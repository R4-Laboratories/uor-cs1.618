#!/usr/bin/env python3
"""Restore an explicit diagnostic PrismPM snapshot; this does not admit it for production."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

BASE = "3666dc0f9da56fcf066d96ec01cd9e14ec9a2974"
SOURCE = "https://github.com/UOR-Foundation/prismpm"


def run(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args])


def restore(snapshot, repo):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate metadata field: {key}")
            result[key] = value
        return result

    meta = json.loads((snapshot / "manifest.json").read_text(), object_pairs_hook=unique)
    fields = {"schema", "source", "base", "candidate", "tree", "bundle_sha256", "patch_sha256"}
    if not isinstance(meta, dict) or set(meta) != fields:
        raise ValueError("unexpected candidate metadata fields")
    if meta["schema"] != "cs1618/prismpm-diagnostic/1" or meta["source"] != SOURCE or meta["base"] != BASE:
        raise ValueError("candidate authority/base differs from the diagnostic contract")
    for key in ("candidate", "tree", "bundle_sha256", "patch_sha256"):
        size = 40 if key in ("candidate", "tree") else 64
        if not isinstance(meta[key], str) or not re.fullmatch(f"[0-9a-f]{{{size}}}", meta[key]):
            raise ValueError(f"invalid {key}")
    for name, key in (("candidate.bundle", "bundle_sha256"), ("candidate.patch", "patch_sha256")):
        if hashlib.sha256((snapshot / name).read_bytes()).hexdigest() != meta[key]:
            raise ValueError(f"{name} digest mismatch")
    if run(repo, "status", "--porcelain", "--untracked-files=all").strip():
        raise ValueError("candidate restoration requires a clean dedicated checkout")
    if run(repo, "rev-parse", "HEAD").decode().strip() != BASE:
        raise ValueError("checkout is not the exact upstream base")
    run(repo, "bundle", "verify", str(snapshot / "candidate.bundle"))
    run(repo, "fetch", str(snapshot / "candidate.bundle"), "refs/heads/numeric-export-backport")
    if run(repo, "rev-parse", "FETCH_HEAD").decode().strip() != meta["candidate"]:
        raise ValueError("bundle branch does not match the named candidate")
    subprocess.run(["git", "-C", str(repo), "merge-base", "--is-ancestor", BASE, meta["candidate"]], check=True)
    if run(repo, "rev-parse", f'{meta["candidate"]}^{{tree}}').decode().strip() != meta["tree"]:
        raise ValueError("candidate tree mismatch")
    patch = run(repo, "diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", "--no-renames", BASE, meta["candidate"])
    if hashlib.sha256(patch).hexdigest() != meta["patch_sha256"]:
        raise ValueError("candidate objects differ from the retained review patch")
    run(repo, "checkout", "--detach", meta["candidate"])
    print(json.dumps({"diagnosticOnly": True, **meta}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("checkout", type=Path)
    args = parser.parse_args()
    restore(args.snapshot.resolve(), args.checkout.resolve())
