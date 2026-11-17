"""Exercise the real EXIT finalizer without a checkout, SDK, or Docker."""
import hashlib
import os
from pathlib import Path
import shlex
import shutil
import stat
import subprocess
import tarfile
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts/numeric/check-prismpm-backport.sh"
WORKFLOW = ROOT / ".github/workflows/prismpm-backport-diagnostics.yml"


class RetentionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.evidence = Path(self.temp.name) / "evidence"
        self.evidence.mkdir(mode=0o755)
        self.evidence.chmod(0o755)
        self.projects = self.evidence / "projects"
        self.projects.mkdir(mode=0o700)
        for name in ("default", "released", "numeric-task2c"):
            project = self.projects / name
            project.mkdir(mode=0o700)
            (project / ".private").write_bytes(b"\x00raw\xff\n")
            (project / ".private").chmod(0o600)
            (project / "run").write_bytes(b"#!/bin/sh\nexit 0\n")
            (project / "run").chmod(0o751)
            (self.projects / f"{name}.json").write_bytes(b'{"ok":true}\n')
            (self.projects / f"{name}.stderr").write_bytes(b"diagnostic\n")
        (self.projects / "default/link").symlink_to(".private")

    def snapshot(self):
        result = {}
        for path in (self.projects, *self.projects.rglob("*")):
            metadata = path.lstat()
            value = (os.readlink(path) if path.is_symlink() else
                     path.read_bytes() if path.is_file() else None)
            result[str(path.relative_to(self.evidence))] = (
                stat.S_IMODE(metadata.st_mode), value)
        return result

    def run_finalizer(self, status=0, overrides=""):
        # Extract the production function, changing only its fixed mount path.
        source = SCRIPT.read_text()
        finalizer = source[source.index("finish() {"):source.index("trap finish EXIT")]
        finalizer = finalizer.replace("/evidence", shlex.quote(str(self.evidence)))
        result = subprocess.run(
            ["bash", "-c", "set -Eeuo pipefail\numask 022\n" + finalizer +
             "trap finish EXIT\n" + overrides + f"\nexit {status}\n"],
            capture_output=True, text=True)
        return result.returncode

    def assert_archive(self):
        archive = self.evidence / "retained-projects.tar.gz"
        # The UID1001 host can traverse evidence/ and read this UID1000 file.
        self.assertEqual(stat.S_IMODE(self.evidence.stat().st_mode), 0o755)
        self.assertEqual(stat.S_IMODE(archive.stat().st_mode), 0o644)
        with tarfile.open(archive) as retained:
            members = {member.name: member for member in retained.getmembers()}
            self.assertEqual(set(members), set(self.snapshot()))
            for name, (mode, value) in self.snapshot().items():
                member = members[name]
                self.assertEqual(member.mode, mode, name)
                if member.isfile():
                    self.assertEqual(retained.extractfile(member).read(), value, name)
                elif member.issym():
                    self.assertEqual(member.linkname, value, name)
        self.assertFalse((self.evidence / "retained-projects.tar.gz.tmp").exists())

    def test_success_retains_full_tree_without_mutation(self):
        before = self.snapshot()
        self.assertEqual(self.run_finalizer(), 0)
        self.assertEqual(self.snapshot(), before)
        self.assert_archive()
        self.assertEqual((self.evidence / "runner-exit-code.txt").read_text(), "0\n")

    def test_failure_still_retains_full_tree(self):
        self.assertEqual(self.run_finalizer(42), 42)
        self.assert_archive()
        self.assertEqual((self.evidence / "runner-exit-code.txt").read_text(), "42\n")

    def test_archive_errors_fail_success_preserve_failure(self):
        for command, failure in (("tar", 73), ("chmod", 74), ("mv", 75)):
            for original in (0, 42):
                with self.subTest(command=command, original=original):
                    override = f'{command}() {{ echo injected-{command} >&2; return {failure}; }}'
                    self.assertEqual(self.run_finalizer(original, override), original or failure)
                    self.assertFalse((self.evidence / "retained-projects.tar.gz").exists())
                    self.assertIn(f"injected-{command}", (self.evidence / "archive.log").read_text())

    def test_identity_failure_still_archives_and_preserves_original_failure(self):
        target = self.evidence / "identity"
        target.write_bytes(b"changed")
        for manifest in ("original-files.sha256", "verifier.sha256"):
            (self.evidence / manifest).write_text(
                hashlib.sha256(b"original").hexdigest() + "  " + str(target) + "\n")
        self.assertEqual(self.run_finalizer(), 1)
        self.assert_archive()
        self.assertEqual(self.run_finalizer(42), 42)
        self.assert_archive()

    def test_early_failure_before_projects_exist(self):
        shutil.rmtree(self.projects)
        self.assertEqual(self.run_finalizer(42), 42)
        self.assertFalse((self.evidence / "retained-projects.tar.gz").exists())

    def test_status_write_failure_preserves_original_failure(self):
        (self.evidence / "runner-exit-code.txt").mkdir()
        self.assertEqual(self.run_finalizer(), 1)
        self.assertEqual(self.run_finalizer(42), 42)
        self.assert_archive()

    def test_upload_only_names_explicit_readable_files(self):
        paths = WORKFLOW.read_text().split("          path: |\n", 1)[1].split(
            "          include-hidden-files:", 1)[0].splitlines()
        paths = [path.strip() for path in paths]
        self.assertIn("evidence/retained-projects.tar.gz", paths)
        self.assertIn("evidence/archive.log", paths)
        for path in paths:
            self.assertTrue(path.startswith("evidence/"), path)
            self.assertNotIn("projects/", path)
            self.assertNotRegex(path, r"[*!?\[\]]")
            self.assertFalse(path.endswith("/"), path)


if __name__ == "__main__":
    unittest.main(verbosity=2)
