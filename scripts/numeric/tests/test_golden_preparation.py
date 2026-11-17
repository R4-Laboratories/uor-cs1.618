"""Synthetic retention controls only; no golden generation or SDK qualification."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch, Mock

PATH = Path(__file__).resolve().parents[1] / "golden-preparation.py"
SPEC = importlib.util.spec_from_file_location("golden_preparation", PATH)
OWNER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(OWNER)


class RetentionTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / "source"
        self.source.mkdir()
        self.evidence = self.root / "evidence"
        self.git("init", "-q")
        self.put(".gitignore", "target/\n")
        self.put("tests/golden/stdlib/original.json", "original\n")
        self.git("add", ".")
        self.git("-c", "user.name=Unit", "-c", "user.email=unit@example.invalid", "commit", "-qm", "Synthetic")
        self.addCleanup(patch.stopall)
        patch.object(OWNER, "REVISION", self.git("rev-parse", "HEAD").strip()).start()
        patch.object(OWNER, "TREE", self.git("rev-parse", "HEAD^{tree}").strip()).start()
        self.diagnostics = self.source / "target/ci-diagnostics/golden-preparation"
        for name, argv in OWNER.COMMANDS:
            OWNER.write_json(self.diagnostics / f"{name}.json", {"argv": argv, "exit_code": 0})
            OWNER.write_json(self.diagnostics / name / "gate-result.json", {"state": "completed", "exitCode": 0, "diagnosticsError": False})
            OWNER.write_json(self.diagnostics / name / "log-retention.json", {"truncated": False, "observedBytes": 23, "headBytes": 23})
            (self.diagnostics / name / "gate.log").write_bytes(b"synthetic original log\n")
        self.put("tests/golden/stdlib/original.json", "generated replacement\n")
        self.put("tests/golden/stdlib/new.bin", b"new\0binary\n")

    def put(self, name, content):
        target = self.source / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content.encode() if isinstance(content, str) else content)

    def git(self, *args):
        return subprocess.check_output(["git", "-C", str(self.source), *args]).decode()

    def failed(self):
        with self.assertRaises((ValueError, FileNotFoundError)):
            OWNER.collect(self.source, self.evidence)
        self.assertEqual(json.loads((self.evidence / "result.json").read_bytes())["status"], "incomplete")

    def test_complete_retains_original_bytes_and_new_binary_patch(self):
        OWNER.collect(self.source, self.evidence)
        record = json.loads((self.evidence / "result.json").read_bytes())
        self.assertEqual(record["status"], "complete-review-required")
        self.assertTrue(record["diagnostic_only"])
        self.assertEqual((self.evidence / "generated/tests/golden/stdlib/new.bin").read_bytes(), b"new\0binary\n")
        self.assertIn(b"GIT binary patch", (self.evidence / "golden.patch").read_bytes())
        self.assertIn("diagnostics/golden-write/gate.log", record["sha256"])

    def test_missing_check_status_is_not_success(self):
        (self.diagnostics / "golden-check.json").unlink()
        self.failed()
        self.assertTrue((self.evidence / "golden.patch").is_file())

    def test_original_writer_failure_is_not_success(self):
        OWNER.write_json(self.diagnostics / "golden-write.json", {"argv": OWNER.COMMANDS[2][1], "exit_code": 37})
        self.failed()

    def test_missing_original_log_is_not_complete(self):
        (self.diagnostics / "golden-check/gate.log").unlink()
        self.failed()

    def test_truncated_log_is_not_complete(self):
        OWNER.write_json(self.diagnostics / "golden-write/log-retention.json", {"truncated": True})
        self.failed()

    def test_wrong_revision_preserves_originals_but_refuses_complete(self):
        with patch.object(OWNER, "REVISION", "f" * 40):
            self.failed()
        self.assertTrue((self.evidence / "generated/tests/golden/stdlib/new.bin").is_file())

    def test_unowned_source_change_refused(self):
        self.put("source.rs", "unowned change\n")
        self.failed()

    def test_symlink_and_aggregate_bounds_refused(self):
        (self.source / "tests/golden/escape").symlink_to("/etc/passwd")
        self.failed()
        (self.source / "tests/golden/escape").unlink()
        with patch.object(OWNER, "MAX_TOTAL", 1):
            self.failed()

    def test_writer_then_checker_commands_run_in_order(self):
        with patch.object(OWNER.subprocess, "run", return_value=Mock(returncode=0)) as run:
            OWNER.run_commands(self.source, self.diagnostics)
        calls = [call.args[0][5:] for call in run.call_args_list]
        self.assertEqual(calls, [argv for _, argv in OWNER.COMMANDS])
        self.assertEqual(calls[-2:], [["just", "golden-write", "Review exact proposed backport shared golden source."], ["just", "golden-check"]])

    def test_writer_failure_prevents_check_and_retains_status(self):
        (self.diagnostics / "golden-check.json").unlink()
        with patch.object(OWNER.subprocess, "run", side_effect=[Mock(returncode=0), Mock(returncode=0), Mock(returncode=37)]) as run:
            with self.assertRaisesRegex(ValueError, "golden-write failed: 37"):
                OWNER.run_commands(self.source, self.diagnostics)
        self.assertEqual(run.call_count, 3)
        self.assertEqual(json.loads((self.diagnostics / "golden-write.json").read_bytes())["exit_code"], 37)
        self.assertFalse((self.diagnostics / "golden-check.json").exists())


if __name__ == "__main__":
    unittest.main()
