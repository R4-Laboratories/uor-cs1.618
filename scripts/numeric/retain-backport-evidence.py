#!/usr/bin/env python3
"""Bounded diagnostic retention; never changes projects or asserts verifier success.

Both modes retain *all* files in the reader's build/verified trees. Recovery reads
the original tar twice as a stream and never extracts its compilation caches.
"""
import argparse
import io
import json
from pathlib import Path, PurePosixPath
import shutil
import stat
import tarfile

NAMES = ("default", "released", "numeric-task2c")
RAW_LIMIT = 256 * 1024 * 1024
ARCHIVE_LIMIT = 31 * 1024 * 1024
LOG_LIMIT = 24 * 1024 * 1024
JSON_LIMIT = 1024 * 1024
ENTRY_LIMIT = 20000
LOGFILES = (
    "runner-exit-code.txt", "container-exit-code.txt", "log-capture-exit-code.txt",
    "recovery-metadata.json", "recovery-scope.txt", "retained-reader-basics.tar.gz",
    "retention-status.json", "reader-input-manifest.json", "final-identities.log",
    "original-files.sha256", "verifier.sha256", "completion.txt", "candidate.json",
    "game-commit.txt", "environment.txt", "archive.log", "run.log", "build.log",
    "gates/retained-reader.log", "gates/authority-controls.log", "disk-before.txt",
    "disk-after.txt", "docker-storage-driver.txt", "runner-image.txt",
    "generated-changes.patch", "host-permissions.txt", "container-permissions.txt",
)


def safe_path(name):
    if not isinstance(name, str) or not name or len(name) > 512 or "\\" in name:
        raise ValueError("invalid path")
    path = PurePosixPath(name)
    if path.is_absolute() or any(p in ("", ".", "..") for p in name.split("/")):
        raise ValueError("unsafe path: " + name)
    return str(path)


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")
    path.chmod(0o644)


def read_result(data):
    if len(data) > JSON_LIMIT:
        raise ValueError("result JSON oversized")
    value = json.loads(data)
    build = safe_path(value["build_id"])
    if "/" in build:
        raise ValueError("build_id must be one component")
    verified = safe_path(value["verified_root"])
    if not verified.startswith(".prism/verified/"):
        raise ValueError("verified_root outside .prism/verified")
    return build, verified


def plan(results):
    exact, trees, missing = set(), set(), []
    for name in NAMES:
        base = "projects/" + name
        exact.update((base + "/prismpm.lock", base + ".json", base + ".stderr"))
        try:
            build, verified = read_result(results[name])
        except (KeyError, ValueError, TypeError):
            missing.append(name + ".json (missing or invalid)")
            trees.update((base + "/.prism/build", base + "/.prism/verified"))
        else:
            trees.update((base + "/.prism/build/" + build, base + "/" + verified))
    return exact, trees, missing


def selected(name, exact, trees):
    return (name in exact or any(name == root or name.startswith(root + "/")
                                for root in trees) or
            any(root.startswith(name + "/") for root in exact | trees))


def local_results(root):
    result, basics = {}, []
    if (root / "projects").is_symlink():
        raise ValueError("projects root is a link")
    for name in NAMES:
        for relative in ("projects/" + name + ".json", "projects/" + name + "/prismpm.lock"):
            file = root / relative
            if file.exists():
                if file.parent.is_symlink() or file.is_symlink() or not file.is_file():
                    raise ValueError("basic input is not a regular file")
                if file.stat().st_size > JSON_LIMIT:
                    raise ValueError("basic reader input oversized")
                data = file.read_bytes()
                metadata = file.stat()
                member = tarfile.TarInfo(relative)
                member.size, member.mode = len(data), stat.S_IMODE(metadata.st_mode)
                member.uid, member.gid, member.mtime = metadata.st_uid, metadata.st_gid, metadata.st_mtime
                basics.append((member, data))
                if relative.endswith(".json"):
                    result[name] = data
    return result, basics


def tar_results(source):
    result, basics, seen = {}, [], set()
    basic_paths = {"projects/" + n + suffix for n in NAMES for suffix in (".json", "/prismpm.lock")}
    with tarfile.open(source, "r|gz") as archive:
        for member in archive:
            name = safe_path(member.name.rstrip("/"))
            if name in basic_paths:
                if not member.isfile() or member.size > JSON_LIMIT:
                    raise ValueError("result is not a bounded regular file")
                if name in seen:
                    raise ValueError("duplicate basic reader input")
                seen.add(name)
                data = archive.extractfile(member).read(JSON_LIMIT + 1)
                basics.append((member, data))
                if name.endswith(".json"):
                    result[PurePosixPath(name).stem] = data
            archive.members.clear()  # tarfile otherwise retains every header.
    return result, basics


def local_entries(root, exact, trees):
    def visit(path, name):
        if not selected(name, exact, trees):
            return
        metadata = path.lstat()
        member = tarfile.TarInfo(name)
        member.mode = stat.S_IMODE(metadata.st_mode)
        member.uid, member.gid, member.mtime = metadata.st_uid, metadata.st_gid, metadata.st_mtime
        if stat.S_ISDIR(metadata.st_mode):
            member.type = tarfile.DIRTYPE
            yield member, None
            for child in sorted(path.iterdir()):
                yield from visit(child, name + "/" + child.name)
        elif stat.S_ISREG(metadata.st_mode):
            member.size = metadata.st_size
            with path.open("rb") as stream:
                yield member, stream
        else:
            raise ValueError("link or special file in reader input: " + name)
    yield from visit(root / "projects", "projects")


def tar_entries(source, exact, trees):
    with tarfile.open(source, "r|gz") as archive:
        for member in archive:
            member.name = safe_path(member.name.rstrip("/"))
            if selected(member.name, exact, trees):
                if not (member.isfile() or member.isdir()):
                    raise ValueError("link or special file in reader input: " + member.name)
                yield member, archive.extractfile(member) if member.isfile() else None
            archive.members.clear()


class BoundedFile:
    def __init__(self, stream, limit):
        self.stream, self.limit, self.size = stream, limit, 0

    def write(self, data):
        self.size += len(data)
        if self.size > self.limit:
            raise ValueError("compressed archive exceeds limit")
        return self.stream.write(data)

    def flush(self):
        return self.stream.flush()


def retain(root, output, source=None, raw_limit=RAW_LIMIT, archive_limit=ARCHIVE_LIMIT):
    output.mkdir(parents=True, exist_ok=True)
    archive = output / "retained-reader-inputs.tar.gz"
    partial = output / "retained-reader-inputs.tar.gz.tmp"
    archive.unlink(missing_ok=True)
    (output / "retained-reader-basics.tar.gz").unlink(missing_ok=True)
    records, errors, summaries = [], [], {}
    total, record_bytes = 0, 0
    try:
        results, basics = tar_results(source) if source else local_results(root)
        # These exact bytes/modes remain recoverable even if a complete tree is
        # too large. This archive is explicitly a partial reader fixture.
        basics_path = output / "retained-reader-basics.tar.gz"
        with basics_path.open("wb") as basic_stream:
            with tarfile.open(fileobj=BoundedFile(basic_stream, 8 * JSON_LIMIT), mode="w|gz") as target:
                for member, data in basics:
                    target.addfile(member, io.BytesIO(data))
        basics_path.chmod(0o644)
        exact, trees, missing = plan(results)
        errors.extend("missing result " + name for name in missing)
        entries = tar_entries(source, exact, trees) if source else local_entries(root, exact, trees)
        seen, present, nonempty = set(), set(), set()
        with partial.open("wb") as stream:
            bounded = BoundedFile(stream, archive_limit)
            with tarfile.open(fileobj=bounded, mode="w|gz") as target:
                for member, content in entries:
                    name = safe_path(member.name)
                    if name in seen:
                        raise ValueError("duplicate retained member: " + name)
                    seen.add(name)
                    if len(seen) > ENTRY_LIMIT:
                        raise ValueError("reader input entry limit exceeded")
                    total += member.size
                    record = {"path": name, "size": member.size, "mode": member.mode}
                    record_bytes += len(json.dumps(record).encode())
                    if record_bytes > 4 * JSON_LIMIT:
                        raise ValueError("reader input manifest size limit exceeded")
                    records.append(record)
                    # Keep a small, explicitly partial view if full evidence exceeds
                    # limits. This is a summary, never a replacement reader fixture.
                    if member.isfile() and member.size <= 65536 and (
                            name in exact or PurePosixPath(name).name in
                            ("manifest.json", "exporter-identity.json", "exporter-execution.json")):
                        data = content.read()
                        content = io.BytesIO(data)
                        if sum(len(v) for v in summaries.values()) + len(data) <= JSON_LIMIT:
                            summaries[name] = data.decode("utf-8", errors="replace")
                    if total > raw_limit:
                        raise ValueError("reader input uncompressed size exceeds limit")
                    target.addfile(member, content)
                    if member.isfile():
                        present.add(name)
                        for tree in trees:
                            if name.startswith(tree + "/"):
                                nonempty.add(tree)
        for name in NAMES:
            if "projects/" + name + "/prismpm.lock" not in present:
                errors.append("missing lock " + name)
            if "projects/" + name + ".json" not in present:
                errors.append("missing archived result " + name)
        errors.extend("missing or empty tree " + tree for tree in sorted(trees - nonempty))
        # Incomplete failure evidence is still useful and is explicitly labeled.
        partial.chmod(0o644)
        partial.replace(archive)
    except (OSError, ValueError, KeyError, TypeError, tarfile.TarError, json.JSONDecodeError) as error:
        errors.append(str(error))
    finally:
        partial.unlink(missing_ok=True)
        write_json(output / "reader-input-manifest.json", {
            "scope": "diagnostic retention only; no SDK rerun or receipt rewrite",
            "complete": not errors, "raw_bytes": total, "entries": records,
            "partial_manifest_summaries": summaries,
        })
        write_json(output / "retention-status.json", {
            "complete_reader_inputs": not errors, "errors": errors,
            "archive_present": archive.exists(), "raw_limit": raw_limit,
            "archive_limit": archive_limit,
        })
    return 1 if errors else 0


def small_logs(root, output, limit=LOG_LIMIT):
    output.mkdir(parents=True, exist_ok=True)
    total, omitted = 0, []
    for name in LOGFILES:
        source = root / name
        destination = output / name.replace("/", "--")
        destination.unlink(missing_ok=True)
        if not source.exists():
            continue
        if source.is_symlink() or not source.is_file() or source.stat().st_size + total > limit:
            omitted.append(name)
            continue
        shutil.copyfile(source, destination)
        destination.chmod(0o644)
        total += destination.stat().st_size
    write_json(output / "small-logs-status.json", {
        "complete_available_logs": not omitted, "copied_bytes": total,
        "limit": limit, "omitted": omitted,
        "scope": "diagnostic logs only; no claim of SDK success",
    })
    return 1 if omitted else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("compact", "recover", "logs"))
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.mode == "logs":
        return small_logs(args.root, args.output)
    if args.mode == "recover":
        return retain(args.root.parent, args.output, source=args.root)
    return retain(args.root, args.output)


if __name__ == "__main__":
    raise SystemExit(main())
