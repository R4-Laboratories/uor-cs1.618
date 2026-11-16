"""Build orchestration checks with real oracle/collector and a stubbed SDK boundary."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
CORPUS_SHA256 = "9edf45b030d1a317adc378abb579386503ca39ea71c37e2d3f475ba6a91b7f92"


class BuildInputsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / "scripts/numeric", self.root / "scripts/numeric",
                        ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copytree(ROOT / "prism/numeric/src", self.root / "prism/numeric/src")
        shutil.copy(ROOT / "prism/numeric/lexlean.lock", self.root / "prism/numeric/lexlean.lock")
        for name in ("lexlean.toml", "lakefile.toml", "lake-manifest.json", "lean-toolchain"):
            shutil.copy(ROOT / "prism/numeric" / name, self.root / "prism/numeric" / name)
        command = json.loads((ROOT / "artifacts/numeric-task2/build-result.json").read_text())
        self.command = command
        shutil.copy(ROOT / "artifacts/numeric-task2/build-result.json", self.root / "build-result.fixture.json")
        build = self.root / "prism/numeric/.lexlean/build" / command["build_id"]
        build.mkdir(parents=True)
        shutil.copy(ROOT / "artifacts/numeric-task2/build-manifest.json", build / "manifest.json")
        (self.root / "model").mkdir()
        shutil.copy(ROOT / "model/numeric-kernels.json", self.root / "model/numeric-kernels.json")
        shutil.copy(ROOT / "artifacts/numeric-task2/targets.json", self.root / "targets.fixture.json")
        # Reuse the retained emitted package fixture, without running or claiming SDK proofs.
        production = self.root / "prism/numeric/.lexlean/production"
        with tarfile.open(ROOT / "artifacts/numeric-task2/production-bundle.tar.gz", "r:gz") as bundle:
            for member in bundle.getmembers():
                parts = Path(member.name).parts
                self.assertEqual(parts[0], "bundles")
                self.assertNotIn("..", parts)
                self.assertTrue(member.isfile())
                target = production.joinpath(*parts[1:])
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(bundle.extractfile(member).read())
        self.runner = self.root / "sdk-boundary.py"
        self.runner.write_text('''#!/usr/bin/env python3
import json, sys
from pathlib import Path
command = " ".join(sys.argv[1:])
with Path("sdk-events.log").open("a") as log:
    log.write(json.dumps(sys.argv[1:])+"\\n")
if "lexlean production targets" in command:
    print(Path("targets.fixture.json").read_text())
elif "lexlean production build" in command:
    print(Path("build-result.fixture.json").read_text())
elif command.endswith("sh /workspace/artifacts/numeric-task2/compile.sh"):
    Path("artifacts/numeric-task2/native").write_bytes(b"stub native output")
    Path("artifacts/numeric-task2/numeric.wasm").write_bytes(b"stub wasm output")
''')
        self.runner.chmod(0o755)

    def build(self):
        return subprocess.run(["bash", "scripts/numeric/build.sh"], cwd=self.root,
                              env={**os.environ, "NUMERIC_SDK_RUNNER": str(self.runner)},
                              capture_output=True, text=True)

    def test_missing_corpus_is_generated_before_actual_collector(self):
        corpus = self.root / "artifacts/numeric-task2/vectors.json"
        self.assertFalse(corpus.exists())
        result = self.build()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(hashlib.sha256(corpus.read_bytes()).hexdigest(), CORPUS_SHA256)
        self.assertEqual(len(json.loads(corpus.read_text())["vectors"]), 44648)
        manifest = json.loads((self.root / "artifacts/numeric-task2/manifest.json").read_text())
        self.assertEqual(manifest["files"]["artifacts/numeric-task2/vectors.json"], CORPUS_SHA256)
        self.assertEqual(len(manifest["signatures"]), 4)
        self.assertIn("compile.sh", (self.root / "sdk-events.log").read_text())

    def test_oracle_write_failure_stops_build_before_sdk_and_collection(self):
        # A directory at the output path forces a real oracle I/O failure.
        (self.root / "artifacts/numeric-task2/vectors.json").mkdir(parents=True)
        result = self.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("IsADirectoryError", result.stderr)
        self.assertFalse((self.root / "sdk-events.log").exists())
        self.assertFalse((self.root / "artifacts/numeric-task2/manifest.json").exists())


    def test_newer_stale_result_cannot_replace_successful_invocation(self):
        production = self.root / "prism/numeric/.lexlean/production"
        actual = production / Path(self.command["artifacts"][0]).name
        stale = production / ("0" * 64)
        shutil.copytree(actual, stale)
        result = json.loads((stale / "result.json").read_text())
        result["result_id"] = "0" * 64
        (stale / "result.json").write_text(json.dumps(result))
        os.utime(stale / "result.json", (4102444800, 4102444800))
        built = self.build()
        self.assertEqual(built.returncode, 0, built.stdout + built.stderr)
        manifest = json.loads((self.root / "artifacts/numeric-task2/manifest.json").read_text())
        self.assertEqual(manifest["result_id"], actual.name)

    def test_source_drift_is_refused_before_artifact_replay_and_compile(self):
        source = self.root / "prism/numeric/src/Float.lex.tex"
        source.write_text(source.read_text() + "\n")
        built = self.build()
        self.assertNotEqual(built.returncode, 0)
        self.assertIn("src/Float.lex.tex", built.stderr)
        events = (self.root / "sdk-events.log").read_text()
        self.assertNotIn("verify-artifact", events)
        self.assertNotIn("compile.sh", events)

    def test_failed_command_result_is_refused(self):
        command = self.command.copy()
        command.update(success=False, exit_code=2)
        (self.root / "build-result.fixture.json").write_text(json.dumps(command))
        built = self.build()
        self.assertNotEqual(built.returncode, 0)
        self.assertNotIn("verify-artifact", (self.root / "sdk-events.log").read_text())


if __name__ == "__main__":
    unittest.main()
