"""Exercise the real EXIT finalizer without a checkout, SDK, or Docker."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shlex
import shutil
import stat
import subprocess
import tarfile
import tempfile
import textwrap
import unittest
from unittest import mock


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts/numeric/check-prismpm-backport.sh"
WORKFLOW = ROOT / ".github/workflows/prismpm-backport-diagnostics.yml"
HELPER = ROOT / "scripts/numeric/retain-backport-evidence.py"
spec = importlib.util.spec_from_file_location("retention", HELPER)
retention = importlib.util.module_from_spec(spec)
spec.loader.exec_module(retention)
recovery_spec = importlib.util.spec_from_file_location(
    "recovery", ROOT / "scripts/numeric/recover-backport-artifact.py")
recovery = importlib.util.module_from_spec(recovery_spec)
recovery_spec.loader.exec_module(recovery)


class RetentionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.evidence = Path(self.temp.name) / "evidence"
        self.evidence.mkdir(mode=0o755)
        self.evidence.chmod(0o2770)
        self.projects = self.evidence / "projects"
        self.projects.mkdir(mode=0o700)
        for name in ("default", "released", "numeric-task2c"):
            project = self.projects / name
            project.mkdir(mode=0o700)
            for directory in (".prism/build/build-id", ".prism/verified/verified-id"):
                tree = project / directory
                tree.mkdir(parents=True, mode=0o700)
                (tree / ".private").write_bytes(b"\x00raw\xff\n")
                (tree / ".private").chmod(0o600)
                (tree / "run").write_bytes(b"#!/bin/sh\nexit 0\n")
                (tree / "run").chmod(0o751)
                (tree / ".nested").mkdir(mode=0o700)
                (tree / ".nested/input.bin").write_bytes(b"\x00\xffnested\n")
            (project / "prismpm.lock").write_bytes(b"original SDK lock\n")
            cache = project / ".lake"
            cache.mkdir()
            (cache / "unrelated-large-cache").write_bytes(b"x" * 1024 * 1024)
            (cache / "link").symlink_to("unrelated-large-cache")
            (self.projects / f"{name}.json").write_text(json.dumps({
                "build_id": "build-id", "verified_root": ".prism/verified/verified-id"}))
            (self.projects / f"{name}.stderr").write_bytes(b"diagnostic\n")

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
        finalizer = finalizer.replace("/game/scripts/numeric/retain-backport-evidence.py", shlex.quote(str(HELPER)))
        result = subprocess.run(
            ["bash", "-c", "set -Eeuo pipefail\numask 022\n" + finalizer +
             "trap finish EXIT\n" + overrides + f"\nexit {status}\n"],
            capture_output=True, text=True)
        return result.returncode

    def assert_archive(self):
        archive = self.evidence / "retained-reader-inputs.tar.gz"
        # The UID1001 host can traverse evidence/ and read this UID1000 file.
        self.assertEqual(stat.S_IMODE(self.evidence.stat().st_mode), 0o2770)
        self.assertEqual(stat.S_IMODE(archive.stat().st_mode), 0o644)
        with tarfile.open(archive) as retained:
            members = {member.name: member for member in retained.getmembers()}
            results, _ = retention.local_results(self.evidence)
            exact, trees, _ = retention.plan(results)
            expected = {name: value for name, value in self.snapshot().items()
                        if retention.selected(name, exact, trees)}
            self.assertEqual(set(members), set(expected))
            for name, (mode, value) in expected.items():
                member = members[name]
                self.assertEqual(member.mode, mode, name)
                if member.isfile():
                    self.assertEqual(retained.extractfile(member).read(), value, name)
                elif member.issym():
                    self.assertEqual(member.linkname, value, name)
        self.assertFalse((self.evidence / "retained-reader-inputs.tar.gz.tmp").exists())

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
        for command, failure in (("python3", 73),):
            for original in (0, 42):
                with self.subTest(command=command, original=original):
                    override = f'{command}() {{ echo injected-{command} >&2; return {failure}; }}'
                    self.assertEqual(self.run_finalizer(original, override), original or failure)
                    self.assertFalse((self.evidence / "retained-reader-inputs.tar.gz").exists())
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
        self.assertFalse((self.evidence / "retained-reader-inputs.tar.gz").exists())

    def test_status_write_failure_preserves_original_failure(self):
        (self.evidence / "runner-exit-code.txt").mkdir()
        self.assertEqual(self.run_finalizer(), 1)
        self.assertEqual(self.run_finalizer(42), 42)
        self.assert_archive()

    def test_upload_only_names_explicit_readable_files(self):
        paths = WORKFLOW.read_text().split("          path: |\n", 1)[1].split(
            "          include-hidden-files:", 1)[0].splitlines()
        paths = [path.strip() for path in paths]
        self.assertIn("evidence/small-logs/retention-status.json", paths)
        self.assertIn("evidence/small-logs/archive.log", paths)
        for path in paths:
            self.assertTrue(path.startswith("evidence/"), path)
            self.assertNotIn("projects/", path)
            self.assertNotRegex(path, r"[*!?\[\]]")
            self.assertFalse(path.endswith("/"), path)

    def test_compact_excludes_caches_and_fits_small_raw_budget(self):
        before = self.snapshot()
        self.assertEqual(retention.retain(self.evidence, self.evidence, raw_limit=4096), 0)
        self.assertEqual(before, self.snapshot())
        self.assert_archive()

    def test_streaming_historical_recovery_preserves_every_required_file(self):
        original = self.evidence / "original.tar.gz"
        with tarfile.open(original, "w:gz", dereference=False) as target:
            target.add(self.projects, arcname="projects")
        output = self.evidence / "recovered"
        with mock.patch.object(tarfile.TarFile, "extractall", side_effect=AssertionError("no extraction")):
            self.assertEqual(retention.retain(self.evidence, output, source=original, raw_limit=4096), 0)
        with tarfile.open(output / "retained-reader-inputs.tar.gz") as target:
            actual = {member.name: member for member in target}
            self.assertFalse(any(".lake" in name for name in actual))
            results, _ = retention.local_results(self.evidence)
            exact, trees, _ = retention.plan(results)
            expected = {name: value for name, value in self.snapshot().items()
                        if retention.selected(name, exact, trees)}
            self.assertEqual(set(actual), set(expected))
            for name, (mode, value) in expected.items():
                self.assertEqual(actual[name].mode, mode, name)
                if actual[name].isfile():
                    self.assertEqual(target.extractfile(actual[name]).read(), value, name)

    def test_missing_or_invalid_result_retains_bounded_partial_state(self):
        (self.projects / "default.json").write_text("")
        self.assertEqual(self.run_finalizer(), 1)
        self.assert_archive()
        status = json.loads((self.evidence / "retention-status.json").read_text())
        self.assertFalse(status["complete_reader_inputs"])
        self.assertTrue(status["archive_present"])
        self.assertEqual(self.run_finalizer(42), 42)

    def test_missing_required_tree_fails_cleanup(self):
        shutil.rmtree(self.projects / "released/.prism/verified/verified-id")
        self.assertEqual(self.run_finalizer(), 1)
        self.assertEqual(self.run_finalizer(42), 42)
        self.assertIn("missing or empty tree", (self.evidence / "retention-status.json").read_text())

    def test_reader_links_and_path_traversal_are_refused(self):
        link = self.projects / "default/.prism/build/build-id/link"
        link.symlink_to(".private")
        self.assertEqual(retention.retain(self.evidence, self.evidence), 1)
        self.assertFalse((self.evidence / "retained-reader-inputs.tar.gz").exists())
        link.unlink()
        (self.projects / "default.json").write_text(json.dumps({
            "build_id": "../../escape", "verified_root": "/outside"}))
        self.assertEqual(retention.retain(self.evidence, self.evidence), 1)
        with self.assertRaises(ValueError):
            retention.read_result((self.projects / "default.json").read_bytes())

    def test_tar_traversal_and_hardlinks_are_refused_without_extraction(self):
        for name, kind in (("projects/../escape", tarfile.REGTYPE),
                           ("projects/default/.prism/build/build-id/link", tarfile.LNKTYPE)):
            with self.subTest(name=name):
                original = self.evidence / "hostile.tar.gz"
                with tarfile.open(original, "w:gz") as target:
                    target.add(self.projects, arcname="projects")
                    member = tarfile.TarInfo(name)
                    member.type, member.linkname = kind, "projects/default/prismpm.lock"
                    target.addfile(member)
                self.assertEqual(retention.retain(self.evidence, self.evidence, source=original), 1)
                self.assertFalse((self.evidence / "retained-reader-inputs.tar.gz").exists())

    def test_local_hardlinks_fail_retention_and_preserve_original_status(self):
        for relative in ("default.json", "default/prismpm.lock",
                         "default/.prism/build/build-id/.private",
                         "default/.prism/verified/verified-id/.nested/input.bin"):
            with self.subTest(relative=relative):
                selected_file = self.projects / relative
                outside_alias = self.evidence / "outside-reader-trees"
                os.link(selected_file, outside_alias)
                try:
                    before = self.snapshot()
                    self.assertEqual(selected_file.stat().st_nlink, 2)
                    self.assertEqual(self.run_finalizer(), 1)
                    status = json.loads((self.evidence / "retention-status.json").read_text())
                    self.assertFalse(status["complete_reader_inputs"])
                    self.assertIn("hardlink", " ".join(status["errors"]))
                    self.assertFalse((self.evidence / "retained-reader-inputs.tar.gz").exists())
                    self.assertEqual(self.run_finalizer(42), 42)
                    self.assertEqual(self.snapshot(), before)
                    self.assertEqual(selected_file.stat().st_nlink, 2)
                finally:
                    outside_alias.unlink()

    def test_recovery_download_flattening_contract(self):
        workflow = (ROOT / ".github/workflows/prismpm-backport-recovery.yml").read_text()
        download = workflow.split("      - name: Download only the fixed original diagnostic artifact\n", 1)[1]
        download = download.split("      - name:", 1)[0]
        # The pinned action treats artifact-ids as a multiple-artifact download,
        # even for one ID; merging is required for the downstream flat root.
        self.assertIn("          artifact-ids: 14288310173\n", download)
        self.assertIn("          merge-multiple: true\n", download)
        self.assertIn("          path: original\n", download)
        self.assertIn("test -f original/retained-projects.tar.gz", workflow)
        self.assertIn("logs original recovered/original-small", workflow)

    def test_raw_and_compressed_limits_keep_exact_basics_and_fail(self):
        for limits in ({"raw_limit": 32}, {"archive_limit": 64}):
            with self.subTest(limits=limits):
                self.assertEqual(retention.retain(self.evidence, self.evidence, **limits), 1)
                self.assertFalse((self.evidence / "retained-reader-inputs.tar.gz").exists())
                with tarfile.open(self.evidence / "retained-reader-basics.tar.gz") as basics:
                    self.assertEqual(len(basics.getmembers()), 6)
                    for name in retention.NAMES:
                        member = basics.getmember(f"projects/{name}.json")
                        self.assertEqual(basics.extractfile(member).read(),
                                         (self.projects / f"{name}.json").read_bytes())
                        lock = basics.getmember(f"projects/{name}/prismpm.lock")
                        self.assertEqual(basics.extractfile(lock).read(),
                                         (self.projects / name / "prismpm.lock").read_bytes())
                        self.assertEqual(lock.mode, stat.S_IMODE((self.projects / name / "prismpm.lock").stat().st_mode))
                self.assertFalse((self.evidence / "retained-reader-inputs.tar.gz.tmp").exists())

    def test_small_logs_prioritize_status_and_report_oversize(self):
        (self.evidence / "runner-exit-code.txt").write_text("42\n")
        (self.evidence / "build.log").write_bytes(b"x" * 1024)
        output = self.evidence / "small-logs"
        self.assertEqual(retention.small_logs(self.evidence, output, limit=64), 1)
        self.assertEqual((output / "runner-exit-code.txt").read_text(), "42\n")
        self.assertFalse((output / "build.log").exists())
        self.assertEqual(json.loads((output / "small-logs-status.json").read_text())["omitted"], ["build.log"])
        self.assertLess(sum(p.stat().st_size for p in output.iterdir()), 1024)

    def test_actual_uid1000_permissions_probe_before_build(self):
        self.assertEqual(os.getuid(), 1000)
        (self.evidence / "host-permissions.txt").write_text("host-write-ok\n")
        script = SCRIPT.read_text().replace("/evidence", shlex.quote(str(self.evidence)))
        script = script.replace("/work/prismpm-b1", shlex.quote(str(self.evidence)))
        probe = self.evidence / "probe.sh"
        probe.write_text(script)
        result = subprocess.run(["bash", str(probe), "--permissions-only"], capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.evidence / "container-permissions.txt").read_text(), "container-write-ok\n")
        self.assertFalse((self.evidence / "runner-exit-code.txt").exists())
        workflow = WORKFLOW.read_text()
        self.assertIn("sudo chown -R 1000:1000 prismpm\n", workflow)
        self.assertNotIn("chown -R 1000:1000 prismpm evidence", workflow)
        self.assertIn("sudo chgrp 1000 evidence", workflow)
        self.assertIn("chmod 2770 evidence", workflow)

    def test_host_status_write_and_tee_failures_preserve_container_status(self):
        shell = WORKFLOW.read_text().split("          if docker run", 1)[1]
        shell = "if docker run" + shell.split("      - name: Retain generated", 1)[0]
        shell = textwrap.dedent("          " + shell).replace("evidence/", str(self.evidence) + "/")
        for filename in ("container-exit-code.txt", "log-capture-exit-code.txt"):
            (self.evidence / filename).mkdir()
        for container_status, tee_status, expected in ((42, 74, 42), (0, 74, 74), (0, 0, 1)):
            preamble = (f"set -euo pipefail\nGITHUB_WORKSPACE=/unused\ndocker() {{ return {container_status}; }}\n"
                        f"tee() {{ cat; return {tee_status}; }}\n")
            result = subprocess.run(["bash", "-c", preamble + shell], capture_output=True)
            self.assertEqual(result.returncode, expected, result.stderr)

    def test_fixed_recovery_metadata_refuses_wrong_source_and_artifact(self):
        run = {"id": recovery.RUN, "head_sha": recovery.HEAD,
               "repository": {"full_name": recovery.REPOSITORY}, "conclusion": "failure"}
        artifact = {"id": recovery.ARTIFACT, "name": recovery.NAME,
                    "size_in_bytes": recovery.SIZE, "expired": False, "digest": recovery.DIGEST,
                    "workflow_run": {"id": recovery.RUN, "head_sha": recovery.HEAD}}
        listing = {"total_count": 1, "artifacts": [artifact]}
        self.assertEqual(recovery.validate(run, artifact, listing)["run_conclusion"], "failure")
        for field, value in (("id", 1), ("name", "latest"), ("digest", "sha256:wrong"),
                             ("size_in_bytes", 1), ("expired", True)):
            with self.subTest(field=field), self.assertRaises(ValueError):
                recovery.validate(run, {**artifact, field: value}, listing)
        with self.assertRaises(ValueError):
            recovery.validate({**run, "head_sha": "wrong"}, artifact, listing)
        with self.assertRaises(ValueError):
            recovery.validate(run, artifact, {"total_count": 2, "artifacts": [artifact, artifact]})
        workflow = (ROOT / ".github/workflows/prismpm-backport-recovery.yml").read_text()
        self.assertIn("actions: read", workflow)
        self.assertIn("artifact-ids: 14288310173", workflow)
        self.assertIn("run-id: 43986399997", workflow)
        self.assertIn("actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093", workflow)
        self.assertNotIn("docker", workflow)


if __name__ == "__main__":
    unittest.main(verbosity=2)
