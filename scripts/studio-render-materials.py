#!/usr/bin/env python3
"""Compile the authored OpenPBR subset used by Meridian's Three renderer."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from urllib.request import urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "model/studio-materials"
OUTPUT = ROOT / "model/studio-render-surfaces.json"
FIELDS = {"base_color": "color3", "base_metalness": "float", "specular_roughness": "float"}
FINISHES = {"mineral", "wood", "paint", "metal", "fabric", "glass"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_contract():
    register = json.loads((SOURCE / "register.json").read_text())
    upstream = register["upstream"]
    pins = json.loads((ROOT / "model/upstream-lock.json").read_text())
    studio = next((pin for pin in pins if pin["name"] == "verdant-studio"), None)
    if not studio or studio["commit"] != upstream["revision"] or studio["repository"] != f"https://github.com/{upstream['repo']}.git":
        raise ValueError("Studio register differs from game upstream lock")
    binding_file = SOURCE / "authority/binding.json"
    if sha(binding_file) != register["binding"]["sha256"]:
        raise ValueError("Verdant Studio authority binding differs from register pin")
    binding = json.loads(binding_file.read_text())
    ref = SOURCE / "authority/open_pbr_surface.mtlx"
    if binding["id"] != register["binding"]["id"] or sha(ref) != binding["source"]["sha256"]:
        raise ValueError("OpenPBR source differs from Studio authority binding")
    admission = register["admissions"]
    if len(admission) != 1 or admission[0].get("construct") != "MeridianSurfaceResponse" or admission[0].get("std") != {"authority": binding["id"], "row": "D07"}:
        raise ValueError("surface construct needs one D07 standard citation")
    reference = ET.parse(ref).find("nodedef[@node='open_pbr_surface']")
    if reference is None:
        raise ValueError("OpenPBR node missing from pinned authority")
    return binding, register, {child.attrib["name"]: child.attrib for child in reference.findall("input")}


def compile_library(source, reference):
    library = {}
    root = ET.parse(source).getroot()
    if root.tag != "materialx" or root.attrib != {"version": "1.39"}:
        raise ValueError("expected MaterialX 1.39")
    for node in root:
        name = node.get("name", "")
        finish = node.get("cs_finish")
        if (node.tag != "open_pbr_surface" or node.get("type") != "surfaceshader"
                or node.attrib.keys() != {"name", "type", "cs_finish"}):
            raise ValueError(f"unsupported shader at {name}")
        if not re.fullmatch("[a-z][A-Za-z0-9]*", name) or name in library or finish not in FINISHES:
            raise ValueError(f"invalid or duplicate surface {name} with finish {finish}")
        result = {}
        for entry in node:
            key = entry.get("name")
            if (entry.tag != "input" or key not in FIELDS or key in result or len(entry)
                    or entry.attrib.keys() != {"name", "type", "value"}):
                raise ValueError(f"unsupported or repeated input {name}/{key}")
            domain = reference[key]
            if FIELDS[key] != domain["type"] or entry.get("type") != domain["type"]:
                raise ValueError(f"{name}/{key} type does not match the authority")
            values = [float(v) for v in entry.attrib["value"].split(",")]
            minimum = [float(v) for v in domain["uimin"].split(",")]
            maximum = [float(v) for v in domain["uimax"].split(",")]
            if len(values) != len(minimum) or any(not math.isfinite(v) or not lo <= v <= hi for v, lo, hi in zip(values, minimum, maximum)):
                raise ValueError(f"{name}/{key} outside authority domain")
            result[key] = values if domain["type"] == "color3" else values[0]
        if result.keys() != FIELDS.keys():
            raise ValueError(f"incomplete surface {name}")
        library[name] = {**result, "finish": finish}
    if not library:
        raise ValueError("empty surface library")
    return library


def replay(cli, binding, register):
    """Run generated Studio operations in an empty model, away from the game's Prism registers."""
    cli = str(Path(cli).resolve())
    with tempfile.TemporaryDirectory(prefix="meridian-studio-") as temp:
        work = Path(temp)
        directory = work / "authorities" / binding["id"]
        directory.mkdir(parents=True)
        shutil.copy(SOURCE / "authority/open_pbr_surface.mtlx", directory)
        bindings = work / "model/bindings"
        bindings.mkdir(parents=True)
        staged = bindings / (binding["id"] + ".json")
        shutil.copy(SOURCE / "authority/binding.json", staged)
        admissions = register["admissions"]
        (work / "surfaces.jsonl").write_text("".join(json.dumps(row) + "\n" for row in admissions))
        shutil.copy(SOURCE / "meridian.mtlx", work)

        def run(*args):
            return subprocess.run([cli, *args], cwd=work, timeout=30,
                                  check=True, text=True, capture_output=True).stdout.strip()

        receipts = [run("ingest-authority", str(staged.relative_to(work))),
                    run("admit", "surfaces.jsonl"),
                    run("read-xml", str(directory.relative_to(work) / "open_pbr_surface.mtlx")),
                    run("read-xml", "meridian.mtlx")]
        if json.loads((work / "model/admissions.json").read_text()) != admissions:
            raise ValueError("Studio returned different citations")
        print("\n".join(receipts))


def replay_upstream(binding, register):
    upstream = register["upstream"]
    base = f"https://raw.githubusercontent.com/{upstream['repo']}/{upstream['revision']}/{upstream['sourcePackage']}"
    with tempfile.TemporaryDirectory(prefix="verdant-studio-export-") as temp:
        work = Path(temp)
        if shutil.disk_usage(work).free < 8 * 1024**3 + 64 * 1024**2:
            raise ValueError("Studio replay needs 64 MiB above the 8 GiB free-space reserve")

        def fetch(relative, digest):
            with urlopen(base + "/" + relative, timeout=30) as response:
                data = response.read(2 * 1024**2 + 1)
            if len(data) > 2 * 1024**2 or hashlib.sha256(data).hexdigest() != digest:
                raise ValueError(f"upstream source differs from pin: {relative}")
            path = work / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            return path

        provenance = json.loads(fetch("provenance.json", upstream["provenanceSha256"]).read_text())
        for path in ("Cargo.toml", "src/lib.rs", "src/main.rs"):
            fetch(path, provenance["files"][path])
        env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0",
                   CARGO_TARGET_DIR=str(work / "target"))
        subprocess.run(["cargo", "build", "--offline", "--jobs", "1"], cwd=work,
                       env=env, check=True, timeout=180)
        replay(work / "target/debug/verdant_studio", binding, register)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="refuse stale generated render data")
    parser.add_argument("--studio-cli", help="also replay the authority, admission and XML with the pinned Studio executable")
    parser.add_argument("--replay-upstream", action="store_true", help="fetch the pinned Studio source export, build it, and replay the studio commands")
    args = parser.parse_args()
    binding, register, reference = load_contract()
    if args.replay_upstream:
        replay_upstream(binding, register)
    if args.studio_cli:
        replay(args.studio_cli, binding, register)
    library = compile_library(SOURCE / "meridian.mtlx", reference)
    content = json.dumps(library, indent=2) + "\n"
    if args.check:
        if OUTPUT.read_text() != content:
            raise SystemExit("render surfaces are stale; run scripts/studio-render-materials.py")
    else:
        OUTPUT.write_text(content)
    print(f"{len(library)} OpenPBR surfaces checked against {binding['id']}")


if __name__ == "__main__":
    main()
