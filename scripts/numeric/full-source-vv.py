#!/usr/bin/env python3
"""Bind source VV orchestration to the reviewed backport; never admit an SDK."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

BASE = "3666dc0f9da56fcf066d96ec01cd9e14ec9a2974"
REVISION = "2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec"
TREE = "3d4838633c80fb754b33f466c25ef0962057e2fd"
BOOTSTRAP = "f378fd3a8dc5711cb4b22cec9ee2f874353628c3"
SDK = "ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c"
PARTS = ("source", "gates", "conformance", "ho-oc", "st-sy", "dk-0-1", "dk-2", "dk-3")
BOOTSTRAP_NAMES = ("bootstrap-prior-capture.json", "bootstrap-current-capture.json",
                   "bootstrap-source-manifest.json", "bootstrap-evidence.json")
EXPECTED_METADATA = {
    "schema": "cs1618/prismpm-diagnostic/1", "source": "https://github.com/UOR-Foundation/prismpm",
    "base": BASE, "candidate": REVISION, "tree": TREE,
    "bundle_sha256": "c0f3cc3b2acab83656f938bf30cba81d2ae9ad31f0ca468d9a6a5ffdc1e90801",
    "patch_sha256": "4ce9fb365078c56f54121e111ebd91d0bd45e2b17ea8dbd05c1a5ee80ae313c2",
}


def command(*args):
    return subprocess.check_output([str(arg) for arg in args])


def git(source, *args):
    return command("git", "-c", f"safe.directory={source.resolve()}", "-C", source, *args).decode().strip()


def verify(source):
    if git(source, "rev-parse", "HEAD") != REVISION:
        raise ValueError("source revision differs from the reviewed candidate")
    if git(source, "rev-parse", "HEAD^{tree}") != TREE:
        raise ValueError("source tree differs from the reviewed candidate")
    if git(source, "status", "--porcelain", "--untracked-files=all"):
        raise ValueError("source must remain clean")
    git(source, "cat-file", "-e", f"{BOOTSTRAP}^{{tree}}")


def write_json(path, value):
    path.write_text(json.dumps(value, sort_keys=True, indent=2) + "\n")


def prepare(source, snapshot, evidence):
    # Freeze this workflow's reviewed target independently of mutable metadata.
    if json.loads((snapshot / "manifest.json").read_text()) != EXPECTED_METADATA:
        raise ValueError("metadata differs from the exact reviewed source candidate")
    evidence.mkdir(parents=True, exist_ok=True)
    restore = Path(__file__).with_name("restore-prismpm-candidate.py")
    raw = command("python3", restore, snapshot.resolve(), source.resolve())
    (evidence / "candidate.json").write_bytes(raw)
    verify(source)
    preflight = command("bash", "-c", 'cd "$1" && bash scripts/bootstrap-verify.sh --check-source', "bash", source)
    (evidence / "bootstrap-availability.txt").write_bytes(preflight)
    if f"Pinned bootstrap source {BOOTSTRAP} is available".encode() not in preflight:
        raise ValueError("required historical bootstrap availability message missing")
    inputs = {str(path.relative_to(source)): hashlib.sha256(path.read_bytes()).hexdigest()
              for path in sorted((source / ".devcontainer").rglob("*")) if path.is_file()}
    write_json(evidence / "source-inputs.json", {"revision": REVISION, "tree": TREE, "sha256": inputs})


def bounded_copy(source, target, maximum):
    if source.is_symlink() or not source.is_file() or source.stat().st_size > maximum:
        raise ValueError(f"bounded regular original required: {source.name}")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)


def collect(source, evidence, part):
    if part not in PARTS:
        raise ValueError("unknown part")
    diagnostics = evidence / "diagnostics"
    diagnostics.mkdir(parents=True, exist_ok=True)
    # Only the existing bounded observer directory and small closed names.
    # Never recursively retain target, Cargo caches, or compiler build outputs.
    observer = source / "target/ci-diagnostics"
    for path in sorted(observer.rglob("*")):
        if path.is_file():
            bounded_copy(path, diagnostics / path.relative_to(observer), 34 * 1024 * 1024)
    original = source / f"target/vv-part-{part}.json"
    if original.exists():
        bounded_copy(original, diagnostics / original.name, 64 * 1024)
    if part == "source":
        for name in BOOTSTRAP_NAMES:
            path = source / "target" / name
            if path.exists():
                bounded_copy(path, evidence / "bootstrap" / name, 64 * 1024 * 1024)
    # Collection on failure preserves raw originals above, without making an
    # acceptance artifact that the upstream assembler could consume.
    try:
        verify(source)
    except (ValueError, subprocess.CalledProcessError) as error:
        write_json(evidence / "source-after.json", {"status": "failed", "reason": str(error)})
        raise
    write_json(evidence / "source-after.json", {"status": "passed", "revision": REVISION, "tree": TREE})
    status = diagnostics / "full-source-vv-exit-code.txt"
    if not status.is_file() or status.read_text() != "0\n":
        raise ValueError("source VV command did not complete successfully")
    expected = {"commit": REVISION, "part": part, "schema": "prismpm/vv-part/1", "status": "passed"}
    if not original.is_file() or json.loads(original.read_bytes()) != expected:
        raise ValueError("part record identity/status differs")
    if part == "source" and not all((evidence / "bootstrap" / name).is_file() for name in BOOTSTRAP_NAMES):
        raise ValueError("source part requires all four original bootstrap outputs")
    bounded_copy(original, evidence / "parts" / original.name, 64 * 1024)


def image_identity(image):
    value, = json.loads(command("docker", "image", "inspect", image))
    if value["Os"] != "linux" or value["Architecture"] != "amd64":
        raise ValueError("native Linux amd64 image required")
    # The image ID is a config digest, not an OCI distribution digest. A local
    # source-development image need not have any RepoDigests.
    return {"config_digest": value["Id"], "repo_digests": value.get("RepoDigests", []),
            "os": value["Os"], "architecture": value["Architecture"],
            "rootfs": value["RootFS"]}


def container_identity(source, evidence):
    ids = command("docker", "ps", "-aq", "--filter", f"label=devcontainer.local_folder={source.resolve()}").decode().split()
    if len(ids) != 1:
        raise ValueError("exactly one dedicated source devcontainer required")
    container, = json.loads(command("docker", "container", "inspect", ids[0]))
    if not 0 < container["HostConfig"]["ShmSize"] <= 1024 ** 3:
        raise ValueError("source container requires positive /dev/shm capacity <= 1 GiB")
    if not any(mount["Source"] == "/var/run/docker.sock" and mount["Destination"] == "/var/run/docker.sock"
               for mount in container["Mounts"]):
        raise ValueError("source gates require the host Docker socket")
    write_json(evidence / "source-container.json", {
        "container_id": container["Id"], "image_reference": container["Config"]["Image"],
        "image": image_identity(container["Image"]), "state": container["State"],
        "shm_bytes": container["HostConfig"]["ShmSize"],
        "source_revision": REVISION, "source_tree": TREE,
    })


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("prepare", "verify", "collect", "container-identity", "sdk-identity"))
    parser.add_argument("--source", type=Path, default=Path("prismpm"))
    parser.add_argument("--snapshot", type=Path, default=Path("game/scripts/numeric/prismpm-candidate"))
    parser.add_argument("--evidence", type=Path, default=Path("evidence"))
    parser.add_argument("--part", choices=PARTS)
    args = parser.parse_args()
    if args.operation == "prepare":
        prepare(args.source, args.snapshot, args.evidence)
    elif args.operation == "verify":
        verify(args.source)
    elif args.operation == "collect":
        collect(args.source, args.evidence, args.part)
    elif args.operation == "container-identity":
        container_identity(args.source, args.evidence)
    else:
        write_json(args.evidence / "sdk-oracle.json", {"reference": SDK, "image": image_identity(SDK)})


if __name__ == "__main__":
    main()
