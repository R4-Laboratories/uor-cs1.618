"""Orchestration tests; fake gate commands never constitute upstream acceptance."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
HELPER = ROOT / "scripts/numeric/full-source-vv.py"
WORKFLOW = ROOT / ".github/workflows/prismpm-backport-full-validation.yml"
UPSTREAM = Path(os.environ.get("PRISMPM_TEST_SOURCE", ROOT.parent / "prismpm-numeric"))
REVISION = "2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec"


class FullSourceVvTest(unittest.TestCase):
    def setUp(self):
        self.assertTrue(HELPER.is_file(), "full source orchestration helper is required")
        spec = importlib.util.spec_from_file_location("full_source_vv", HELPER)
        self.helper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.helper)
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "prismpm"
        subprocess.run(["git", "clone", "--shared", "--no-checkout", str(UPSTREAM), str(self.source)],
                       check=True, capture_output=True)
        subprocess.run(["git", "-C", str(self.source), "checkout", "--detach", self.helper.BASE],
                       check=True, capture_output=True)
        self.evidence = self.root / "evidence"

    def prepare(self):
        self.helper.prepare(self.source, ROOT / "scripts/numeric/prismpm-candidate", self.evidence)

    def test_restore_is_bound_to_exact_reviewed_metadata_and_history(self):
        self.prepare()
        self.helper.verify(self.source)
        self.assertEqual(json.loads((self.evidence / "candidate.json").read_text())["candidate"], REVISION)
        snapshot = self.root / "snapshot"
        shutil.copytree(ROOT / "scripts/numeric/prismpm-candidate", snapshot)
        meta = json.loads((snapshot / "manifest.json").read_text())
        meta["candidate"] = "0" * 40
        (snapshot / "manifest.json").write_text(json.dumps(meta))
        with self.assertRaisesRegex(ValueError, "reviewed"):
            self.helper.prepare(self.source, snapshot, self.root / "rejected")

    def test_dirty_source_and_wrong_revision_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "revision"):
            self.helper.verify(self.source)
        self.prepare()
        (self.source / "README.md").write_text("drift\n")
        with self.assertRaisesRegex(ValueError, "clean"):
            self.helper.verify(self.source)

    def run_part(self, *, status=0, dirty=False):
        self.prepare()
        text = WORKFLOW.read_text()
        block = text.split("          runCmd: |\n", 1)[1].split("      - name:", 1)[0]
        command = "\n".join(line[12:] for line in block.rstrip().splitlines())
        # The real launcher is covered upstream; this test executes its command.
        command = command.replace("/usr/local/bin/prismpm-devcontainer-exec ", "")
        bin_dir = self.root / "bin"
        bin_dir.mkdir()
        node = bin_dir / "node"
        node.write_text("#!/usr/bin/env python3\nimport os,sys\na=sys.argv\ni=a.index('--')\nos.execvp(a[i+1],a[i+1:])\n")
        node.chmod(0o755)
        just = bin_dir / "just"
        record = {"commit": REVISION, "part": "source", "schema": "prismpm/vv-part/1", "status": "passed"}
        just.write_text("#!/usr/bin/env python3\nimport pathlib,sys\n"
                        "assert sys.argv[1:] == ['vv-part','source']\n"
                        f"pathlib.Path('target/vv-part-source.json').write_bytes({json.dumps(record, sort_keys=True, separators=(',', ':')).encode()!r})\n"
                        + "\n".join(f"pathlib.Path('target/{name}').write_bytes(b'fake gate test bootstrap output')"
                                    for name in self.helper.BOOTSTRAP_NAMES) + "\n"
                        + ("pathlib.Path('README.md').write_text('drift')\n" if dirty else "")
                        + f"sys.exit({status})\n")
        just.chmod(0o755)
        return subprocess.run(["bash", "-euo", "pipefail", "-c", command], cwd=self.source,
                              env={**os.environ, "PATH": f"{bin_dir}:{os.environ['PATH']}",
                                   "PRISMPM_VV_PART": "source", "PRISMPM_TEST_SDK_IMAGE": self.helper.SDK,
                                   "CARGO_BUILD_JOBS": "2", "CARGO_NET_OFFLINE": "true"}, capture_output=True, text=True)

    def test_success_preserves_original_part_bytes(self):
        result = self.run_part()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.helper.collect(self.source, self.evidence, "source")
        self.assertEqual((self.evidence / "parts/vv-part-source.json").read_bytes(),
                         (self.source / "target/vv-part-source.json").read_bytes())

    def test_failed_command_retains_status_and_raw_record_but_cannot_accept(self):
        result = self.run_part(status=37)
        self.assertEqual(result.returncode, 37, result.stderr)
        with self.assertRaisesRegex(ValueError, "command"):
            self.helper.collect(self.source, self.evidence, "source")
        self.assertEqual((self.evidence / "diagnostics/full-source-vv-exit-code.txt").read_text(), "37\n")
        self.assertTrue((self.evidence / "diagnostics/vv-part-source.json").is_file())
        self.assertFalse((self.evidence / "parts").exists())

    def test_post_gate_drift_fails_and_cannot_accept(self):
        result = self.run_part(dirty=True)
        self.assertNotEqual(result.returncode, 0)
        with self.assertRaises(ValueError):
            self.helper.collect(self.source, self.evidence, "source")
        self.assertFalse((self.evidence / "parts").exists())

    def test_wrong_part_and_revision_records_are_rejected(self):
        result = self.run_part()
        self.assertEqual(result.returncode, 0, result.stderr)
        record_path = self.source / "target/vv-part-source.json"
        original = json.loads(record_path.read_text())
        for key, value in [("commit", "0" * 40), ("part", "gates"), ("status", "failed")]:
            record_path.write_text(json.dumps({**original, key: value}))
            with self.assertRaisesRegex(ValueError, "record"):
                self.helper.collect(self.source, self.evidence, "source")
            self.assertFalse((self.evidence / "parts").exists())

    def test_workflow_keeps_all_parts_deadlines_and_unchanged_commands(self):
        text = WORKFLOW.read_text()
        self.assertIn("part: [source, gates, conformance, ho-oc, st-sy, dk-0-1, dk-2, dk-3]", text)
        for value in ["timeout-minutes: 240", "timeout-minutes: 360", "fail-fast: false",
                      "branches: [numeric-kernels]", "workflow_dispatch:", "subFolder: prismpm",
                      "inheritEnv: false", "push: never", 'just vv-part "$PRISMPM_VV_PART"',
                      "node --test scripts/vv-assemble.test.mjs", "node scripts/vv-assemble.mjs"]:
            self.assertIn(value, text)
        self.assertNotIn("--with-sdk", text)
        self.assertNotIn("CARGO_PROFILE_", text.split("runCmd: |", 1)[0])
        self.assertNotIn("continue-on-error", text)
        env_block = text.split("          env: |", 1)[1].split("          runCmd:", 1)[0]
        self.assertNotIn("CARGO_NET_OFFLINE", env_block, "postCreate fetch must remain online")
        self.assertIn("start ../evidence/diagnostics/host", text)

    def test_real_upstream_assembler_rejects_missing_mismatched_and_stale_evidence(self):
        self.prepare()
        parts = self.root / "parts"
        parts.mkdir()
        for part in self.helper.PARTS:
            (parts / f"vv-part-{part}.json").write_text(json.dumps(
                {"commit": REVISION, "part": part, "schema": "prismpm/vv-part/1", "status": "passed"},
                sort_keys=True, separators=(',', ':')))
        def assemble(output):
            return subprocess.run(["node", "scripts/vv-assemble.mjs", str(parts), str(output), REVISION],
                                  cwd=self.source, capture_output=True, text=True)
        output = self.root / "vv-evidence.json"
        result = assemble(output)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(f"All 8 V&V parts and 15 gates PASSED for commit {REVISION}.", result.stdout)
        value = json.loads(output.read_text())
        self.assertEqual(value["schema"], "prismpm/vv-evidence/1")
        self.assertEqual(value["status"], "passed")
        self.assertEqual(value["commit"], REVISION)
        self.assertEqual(value["gates"], list(range(1, 16)))
        self.assertNotEqual(assemble(output).returncode, 0, "existing acceptance output must not be overwritten")
        record = parts / "vv-part-dk-3.json"
        original = record.read_bytes()
        record.unlink()
        self.assertNotEqual(assemble(self.root / "missing.json").returncode, 0)
        changed = json.loads(original)
        changed["commit"] = "0" * 40
        record.write_text(json.dumps(changed, sort_keys=True, separators=(',', ':')))
        self.assertNotEqual(assemble(self.root / "mismatch.json").returncode, 0)
        record.write_bytes(original)
        suite = subprocess.run(["node", "--test", "scripts/vv-assemble.test.mjs"], cwd=self.source,
                               capture_output=True, text=True)
        self.assertEqual(suite.returncode, 0, suite.stdout + suite.stderr)


class ContainerIdentityTest(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location("full_source_identity", HELPER)
        self.helper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.helper)
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.container = {
            "Id": "a" * 64, "Image": "sha256:" + "b" * 64,
            "HostConfig": {"ShmSize": 64 * 1024 ** 2},
            "Config": {"Image": "local-source-tag", "Env": ["SECRET=do-not-retain"]},
            "Mounts": [{"Source": "/var/run/docker.sock", "Destination": "/var/run/docker.sock"}],
            "State": {"Running": True, "OOMKilled": False, "ExitCode": 0},
        }
        self.image = {"Id": self.container["Image"], "Architecture": "amd64", "Os": "linux",
                      "RootFS": {"Type": "layers", "Layers": ["sha256:" + "c" * 64]}, "RepoDigests": []}

    def fake_daemon(self, *args):
        # Only Docker is substituted: the production selection, validation,
        # redaction, and filesystem retention code runs unchanged.
        if args[:3] == ("docker", "ps", "-aq"):
            self.assertEqual(args[-1], f"label=devcontainer.local_folder={self.root.resolve()}")
            return (self.container["Id"] + "\n").encode()
        if args[:3] == ("docker", "container", "inspect"):
            return json.dumps([self.container]).encode()
        if args[:3] == ("docker", "image", "inspect"):
            self.assertEqual(args[-1], self.container["Image"])
            return json.dumps([self.image]).encode()
        self.fail(f"unexpected daemon operation: {args}")

    def test_actual_config_identity_is_retained_without_treating_tag_as_digest(self):
        with patch.object(self.helper, "command", self.fake_daemon):
            self.helper.container_identity(self.root, self.root)
        raw = (self.root / "source-container.json").read_text()
        value = json.loads(raw)
        self.assertEqual(value["image"]["config_digest"], self.container["Image"])
        self.assertEqual(value["image_reference"], "local-source-tag")
        self.assertEqual(value["image"]["repo_digests"], [])
        self.assertNotIn("SECRET", raw)
        self.assertNotIn("do-not-retain", raw)

    def test_wrong_architecture_shared_memory_or_socket_cannot_qualify(self):
        with patch.object(self.helper, "command", self.fake_daemon):
            self.image["Architecture"] = "arm64"
            with self.assertRaisesRegex(ValueError, "amd64"):
                self.helper.container_identity(self.root, self.root)
            self.image["Architecture"] = "amd64"
            for capacity in [0, 2 * 1024 ** 3]:
                self.container["HostConfig"]["ShmSize"] = capacity
                with self.assertRaisesRegex(ValueError, "/dev/shm"):
                    self.helper.container_identity(self.root, self.root)
            self.container["HostConfig"]["ShmSize"] = 64 * 1024 ** 2
            self.container["Mounts"] = []
            with self.assertRaisesRegex(ValueError, "socket"):
                self.helper.container_identity(self.root, self.root)
        self.assertFalse((self.root / "source-container.json").exists())


if __name__ == "__main__":
    unittest.main()
