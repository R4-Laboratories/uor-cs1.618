#!/usr/bin/env python3
"""Retain a development-only shared golden proposal; never import or admit it."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

REVISION = "324955b6923c1d194d7bc870a2d2a05eb687048c"
TREE = "7cf463121cf5dd15b681ce1dfafd5694617cc474"
MAX_FILE = 64 * 1024 * 1024
MAX_TOTAL = 256 * 1024 * 1024
COMMANDS = (
    ("native-helper-tests", ["node", "--test", "scripts/native-golden.test.mjs"]),
    ("text-workbench-tests", ["node", "--test", "scripts/text-workbench.test.mjs"]),
    ("golden-write", ["just", "golden-write", "Review exact proposed backport shared golden source."]),
    ("golden-check", ["just", "golden-check"]),
)


def command(source, *args):
    return subprocess.check_output([str(arg) for arg in args], cwd=source)


def git(source, *args, env=None):
    if env is not None:
        return subprocess.check_output(["git", "-c", f"safe.directory={source.resolve()}", *args], cwd=source, env=env)
    return command(source, "git", "-c", f"safe.directory={source.resolve()}", *args)


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, sort_keys=True, indent=2) + "\n")


def candidate_metadata():
    return json.loads(Path(__file__).with_name("prismpm-preparation-candidate").joinpath("manifest.json").read_bytes())


def unique_fields(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate retained identity field")
        result[key] = value
    return result


def source_inputs(source):
    inputs = {}
    for path in sorted((source / ".devcontainer").rglob("*")):
        if path.is_symlink():
            raise ValueError("regular source devcontainer inputs required")
        if path.is_file():
            inputs[str(path.relative_to(source))] = hashlib.sha256(path.read_bytes()).hexdigest()
    if not inputs:
        raise ValueError("source devcontainer inputs missing")
    return {"revision": REVISION, "tree": TREE, "devcontainer_sha256": inputs}


def validate_container(record):
    fields = {"container_id", "image_config_digest", "repo_digests", "rootfs", "source_revision", "source_tree", "os", "architecture"}
    digest = lambda value: isinstance(value, str) and re.fullmatch(r"sha256:[0-9a-f]{64}", value) is not None
    if not isinstance(record, dict) or set(record) != fields:
        raise ValueError("closed source container identity required")
    if (record["source_revision"], record["source_tree"], record["os"], record["architecture"]) != (REVISION, TREE, "linux", "amd64"):
        raise ValueError("source container identity differs from native preparation source")
    if not isinstance(record["container_id"], str) or not re.fullmatch(r"[0-9a-f]{64}", record["container_id"]) or not digest(record["image_config_digest"]):
        raise ValueError("exact container and image config identities required")
    references = record["repo_digests"]
    if not isinstance(references, list) or any(not isinstance(value, str) or not re.fullmatch(r"[^\s@]+@sha256:[0-9a-f]{64}", value) for value in references):
        raise ValueError("source image distribution identities malformed")
    rootfs = record["rootfs"]
    if not isinstance(rootfs, dict) or set(rootfs) != {"Type", "Layers"} or rootfs["Type"] != "layers" or not isinstance(rootfs["Layers"], list) or not rootfs["Layers"] or not all(digest(value) for value in rootfs["Layers"]):
        raise ValueError("complete source image rootfs identities required")


def verify(source, clean=False):
    if git(source, "rev-parse", "HEAD").decode().strip() != REVISION:
        raise ValueError("wrong preparation source revision")
    if git(source, "rev-parse", "HEAD^{tree}").decode().strip() != TREE:
        raise ValueError("wrong preparation source tree")
    if clean and git(source, "status", "--porcelain", "--untracked-files=all").strip():
        raise ValueError("preparation requires a clean source")


def prepare(source, snapshot, evidence):
    metadata = json.loads((snapshot / "manifest.json").read_bytes())
    if (metadata.get("candidate"), metadata.get("tree")) != (REVISION, TREE):
        raise ValueError("wrong preparation snapshot")
    evidence.mkdir(parents=True, exist_ok=True)
    restore = Path(__file__).with_name("restore-prismpm-candidate.py").resolve()
    (evidence / "candidate.json").write_bytes(command(source, "python3", restore, snapshot.resolve(), source.resolve()))
    verify(source, clean=True)
    (evidence / "bootstrap-availability.txt").write_bytes(command(source, "bash", "scripts/bootstrap-verify.sh", "--check-source"))
    write_json(evidence / "source-inputs.json", source_inputs(source))


def run(source):
    verify(source, clean=True)
    if os.getuid() != 1000 or os.uname().machine != "x86_64":
        raise ValueError("original source UID1000 / native amd64 required")
    os_release = Path("/etc/os-release").read_text()
    if 'ID=debian\n' not in os_release or 'VERSION_ID="12"' not in os_release:
        raise ValueError("Debian 12 source development environment required")
    output = source / "target/ci-diagnostics/golden-preparation"
    if output.exists():
        raise ValueError("fresh writer diagnostics required")
    output.mkdir(parents=True)
    run_commands(source, output)


def run_commands(source, output):
    for name, argv in COMMANDS:
        status = subprocess.run(["node", "scripts/ci-observe.mjs", "run", str(output / name), "--", *argv], cwd=source).returncode
        write_json(output / f"{name}.json", {"argv": argv, "exit_code": status})
        if status:
            raise ValueError(f"{name} failed: {status}")


def collect(source, evidence):
    evidence.mkdir(parents=True, exist_ok=True)
    state = {"status": "incomplete", "diagnostic_only": True, "revision": REVISION, "tree": TREE}
    write_json(evidence / "result.json", state)
    total = 0
    originals = {}

    def retain(path, destination):
        nonlocal total
        if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_FILE:
            raise ValueError(f"bounded regular original required: {path}")
        total += path.stat().st_size
        if total > MAX_TOTAL:
            raise ValueError("retention aggregate bound exceeded")
        destination.parent.mkdir(parents=True, exist_ok=True)
        if path != destination:
            shutil.copyfile(path, destination)
        raw = destination.read_bytes()
        if len(raw) > MAX_FILE:
            raise ValueError("retained original exceeds file bound")
        originals[str(destination.relative_to(evidence))] = hashlib.sha256(raw).hexdigest()
        return raw

    try:
        # A failed retry must never upload an earlier successful patch.
        (evidence / "golden.patch").unlink(missing_ok=True)
        diagnostics = source / "target/ci-diagnostics/golden-preparation"
        for directory, target in ((diagnostics, evidence / "diagnostics"), (source / "tests/golden", evidence / "generated/tests/golden")):
            for path in sorted(directory.rglob("*")):
                if path.is_symlink() or path.is_file():
                    retain(path, target / path.relative_to(directory))
        verify(source)
        # Container UID1000 owns the source. Keep its original index/state and
        # objects read-only; only these collector subprocesses use private writes.
        index = Path(git(source, "rev-parse", "--git-path", "index").decode().strip())
        objects = Path(git(source, "rev-parse", "--git-path", "objects").decode().strip())
        if not index.is_absolute(): index = source / index
        if not objects.is_absolute(): objects = source / objects
        with tempfile.TemporaryDirectory(prefix="golden-collection-") as temporary:
            private = Path(temporary)
            shutil.copyfile(index, private / "index")
            (private / "objects").mkdir()
            env = {**os.environ, "GIT_INDEX_FILE": str(private / "index"),
                   "GIT_OBJECT_DIRECTORY": str(private / "objects"),
                   "GIT_ALTERNATE_OBJECT_DIRECTORIES": str(objects.resolve())}
            git(source, "add", "-N", "--", "tests/golden", env=env)
            staged = git(source, "diff", "--cached", "HEAD", "--name-only", "-z", env=env)
            unstaged = git(source, "diff", "--name-only", "-z", env=env)
            untracked = git(source, "ls-files", "--others", "--exclude-standard", "-z", env=env)
            if any(path and not path.startswith("tests/golden/") for path in (staged + unstaged + untracked).decode().split("\0")):
                raise ValueError("writer changed a path outside tests/golden")
            patch = private / "golden.patch"
            with patch.open("xb") as stream:
                subprocess.run(["git", "-c", f"safe.directory={source.resolve()}", "diff", "--binary", "--full-index", "HEAD", "--", "tests/golden"], cwd=source, env=env, stdout=stream, check=True)
            retain(patch, evidence / "golden.patch")
        for name, argv in COMMANDS:
            if json.loads((diagnostics / f"{name}.json").read_bytes()) != {"argv": argv, "exit_code": 0}:
                raise ValueError(f"missing successful command: {name}")
            result = json.loads((diagnostics / name / "gate-result.json").read_bytes())
            if result != {"state": "completed", "exitCode": 0, "diagnosticsError": False}:
                raise ValueError(f"incomplete command observation: {name}")
            metadata = json.loads((diagnostics / name / "log-retention.json").read_bytes())
            if metadata.get("truncated") is not False:
                raise ValueError("original log exceeded retention bound")
            log = diagnostics / name / "gate.log"
            if not log.is_file() or metadata.get("observedBytes") != log.stat().st_size or metadata.get("headBytes") != log.stat().st_size:
                raise ValueError("complete original command log required")
        # These files come from independent workflow steps. A successful writer
        # cannot substitute for failed/missing preparation or container capture.
        records = {name: json.loads(retain(evidence / name, evidence / name), object_pairs_hook=unique_fields) for name in
                   ("candidate.json", "source-inputs.json", "source-container.json")}
        candidate = candidate_metadata()
        receipt = records["candidate.json"]
        if not isinstance(receipt, dict) or receipt.get("diagnosticOnly") is not True or (candidate.get("candidate"), candidate.get("tree")) != (REVISION, TREE) or receipt != {"diagnosticOnly": True, **candidate}:
            raise ValueError("exact retained preparation candidate receipt required")
        if records["source-inputs.json"] != source_inputs(source):
            raise ValueError("retained source devcontainer inputs differ")
        validate_container(records["source-container.json"])
        state["status"] = "complete-review-required"
    except Exception as error:
        state["error"] = str(error)
        raise
    finally:
        state["retained_bytes"] = total
        state["sha256"] = originals
        write_json(evidence / "result.json", state)


def container_identity(source, evidence):
    # Never leave an older success receipt available after this capture fails.
    destination = evidence / "source-container.json"
    destination.unlink(missing_ok=True)
    verify(source)
    identifiers = command(source, "docker", "ps", "-aq", "--filter", f"label=devcontainer.local_folder={source.resolve()}").decode().split()
    if len(identifiers) != 1:
        raise ValueError("exactly one original source devcontainer required")
    container, = json.loads(command(source, "docker", "container", "inspect", identifiers[0]))
    image, = json.loads(command(source, "docker", "image", "inspect", container["Image"]))
    if image["Id"] != container["Image"]:
        raise ValueError("inspected source image differs from container config")
    if (image["Os"], image["Architecture"]) != ("linux", "amd64"):
        raise ValueError("native Linux amd64 source image required")
    record = {"container_id": container["Id"],
        "image_config_digest": image["Id"], "repo_digests": image.get("RepoDigests", []),
        "rootfs": image["RootFS"], "source_revision": REVISION, "source_tree": TREE,
        "os": image["Os"], "architecture": image["Architecture"]}
    validate_container(record)
    write_json(destination, record)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("prepare", "run", "collect", "container-identity"))
    parser.add_argument("--source", type=Path, default=Path("prismpm"))
    parser.add_argument("--snapshot", type=Path, default=Path("game/scripts/numeric/prismpm-preparation-candidate"))
    parser.add_argument("--evidence", type=Path, default=Path("evidence"))
    args = parser.parse_args()
    if args.operation == "prepare":
        prepare(args.source.resolve(), args.snapshot, args.evidence)
    elif args.operation == "run":
        run(args.source.resolve())
    elif args.operation == "collect":
        collect(args.source.resolve(), args.evidence)
    else:
        container_identity(args.source.resolve(), args.evidence)


if __name__ == "__main__":
    main()
