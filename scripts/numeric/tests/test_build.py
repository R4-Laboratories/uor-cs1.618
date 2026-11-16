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
CORPUS_SHA256 = "f50314b9e145085fd6ed85e3fb0984578e22ef956253be27ff5493287088b9d9"


class BuildInputsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / "scripts/numeric", self.root / "scripts/numeric",
                        ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copytree(ROOT / "prism/numeric/src", self.root / "prism/numeric/src")
        shutil.copy(ROOT / "prism/numeric/lexlean.lock", self.root / "prism/numeric/lexlean.lock")
        (self.root / "model").mkdir()
        shutil.copy(ROOT / "model/numeric-kernels.json", self.root / "model/numeric-kernels.json")
        shutil.copy(ROOT / "artifacts/numeric/targets.json", self.root / "targets.fixture.json")
        # Reuse the retained emitted package fixture, without running or claiming SDK proofs.
        production = self.root / "prism/numeric/.lexlean/production"
        with tarfile.open(ROOT / "artifacts/numeric/production-bundle.tar.gz", "r:gz") as bundle:
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
elif command.endswith("sh /workspace/artifacts/numeric/compile.sh"):
    Path("artifacts/numeric/native").write_bytes(b"stub native output")
    Path("artifacts/numeric/numeric.wasm").write_bytes(b"stub wasm output")
''')
        self.runner.chmod(0o755)

    def build(self):
        return subprocess.run(["bash", "scripts/numeric/build.sh"], cwd=self.root,
                              env={**os.environ, "NUMERIC_SDK_RUNNER": str(self.runner)},
                              capture_output=True, text=True)

    def test_missing_corpus_is_generated_before_actual_collector(self):
        corpus = self.root / "artifacts/numeric/vectors.json"
        self.assertFalse(corpus.exists())
        result = self.build()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(hashlib.sha256(corpus.read_bytes()).hexdigest(), CORPUS_SHA256)
        self.assertEqual(len(json.loads(corpus.read_text())["vectors"]), 22322)
        manifest = json.loads((self.root / "artifacts/numeric/manifest.json").read_text())
        self.assertEqual(manifest["files"]["artifacts/numeric/vectors.json"], CORPUS_SHA256)
        self.assertEqual(len(manifest["signatures"]), 2)
        self.assertIn("compile.sh", (self.root / "sdk-events.log").read_text())

    def test_oracle_write_failure_stops_build_before_sdk_and_collection(self):
        # A directory at the output path forces a real oracle I/O failure.
        (self.root / "artifacts/numeric/vectors.json").mkdir(parents=True)
        result = self.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("IsADirectoryError", result.stderr)
        self.assertFalse((self.root / "sdk-events.log").exists())
        self.assertFalse((self.root / "artifacts/numeric/manifest.json").exists())


if __name__ == "__main__":
    unittest.main()
