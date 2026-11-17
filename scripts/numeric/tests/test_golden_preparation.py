"""Synthetic retention controls only; no golden generation or SDK qualification."""
import importlib.util
import hashlib
import json
import os
import shutil
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
        self.put(".devcontainer/devcontainer.json", '{"unitOnly":true}\n')
        self.put("tests/golden/stdlib/original.json", "original\n")
        self.git("add", ".")
        self.git("-c", "user.name=Unit", "-c", "user.email=unit@example.invalid", "commit", "-qm", "Synthetic")
        self.addCleanup(patch.stopall)
        patch.object(OWNER, "REVISION", self.git("rev-parse", "HEAD").strip()).start()
        patch.object(OWNER, "TREE", self.git("rev-parse", "HEAD^{tree}").strip()).start()
        candidate = json.loads(PATH.with_name("prismpm-preparation-candidate").joinpath("manifest.json").read_bytes())
        candidate.update(candidate=OWNER.REVISION, tree=OWNER.TREE)
        self.candidate = candidate
        patch.object(OWNER, "candidate_metadata", return_value=candidate).start()
        self.identity_records = {
            "candidate.json": {"diagnosticOnly": True, **candidate},
            "source-inputs.json": {"revision": OWNER.REVISION, "tree": OWNER.TREE, "devcontainer_sha256": {
                ".devcontainer/devcontainer.json": hashlib.sha256((self.source / ".devcontainer/devcontainer.json").read_bytes()).hexdigest()}},
            "source-container.json": {"container_id": "a" * 64, "image_config_digest": "sha256:" + "b" * 64,
                "repo_digests": [], "rootfs": {"Type": "layers", "Layers": ["sha256:" + "c" * 64]},
                "source_revision": OWNER.REVISION, "source_tree": OWNER.TREE, "os": "linux", "architecture": "amd64"},
        }
        for name, record in self.identity_records.items():
            OWNER.write_json(self.evidence / name, record)
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
        for name in self.identity_records:
            self.assertEqual(record["sha256"][name], hashlib.sha256((self.evidence / name).read_bytes()).hexdigest())

    def test_readonly_source_index_and_target_keep_binary_deletion_and_outside_checks(self):
        # UID1000 cannot create the original index lock/target patch here,
        # reproducing the hosted post-container permission failure without sudo.
        tracked=self.source/'tests/golden/stdlib/deleted.bin';tracked.write_bytes(b'old binary\0')
        self.git('add',str(tracked));self.git('-c','user.name=Unit','-c','user.email=unit@example.invalid','commit','-qm','Deletion fixture')
        revision=self.git('rev-parse','HEAD').strip();tree=self.git('rev-parse','HEAD^{tree}').strip()
        patch.object(OWNER,'REVISION',revision).start();patch.object(OWNER,'TREE',tree).start()
        self.candidate.update(candidate=revision,tree=tree)
        self.identity_records['candidate.json']={'diagnosticOnly':True,**self.candidate}
        for name in ('source-inputs.json','source-container.json'):
            record=self.identity_records[name]
            for key in ('revision','source_revision'):
                if key in record:record[key]=revision
            for key in ('tree','source_tree'):
                if key in record:record[key]=tree
        for name,record in self.identity_records.items():OWNER.write_json(self.evidence/name,record)
        tracked.unlink()
        index=self.source/'.git/index';before_bytes=index.read_bytes();before_stat=index.stat()
        objects={str(p.relative_to(self.source/'.git/objects')):p.read_bytes() for p in (self.source/'.git/objects').rglob('*') if p.is_file()}
        directories=[self.source/'.git',self.source/'target']
        for directory in directories:directory.chmod(0o555)
        try:
            with self.assertRaises(PermissionError): (self.source/'.git/index.lock').open('xb')
            with self.assertRaises(PermissionError): (self.source/'target/golden-preparation.patch').open('xb')
            OWNER.collect(self.source,self.evidence)
            result=json.loads((self.evidence/'result.json').read_text())
            self.assertEqual(result['status'],'complete-review-required')
            data=(self.evidence/'golden.patch').read_bytes()
            self.assertIn(b'GIT binary patch',data);self.assertIn(b'deleted file mode',data)
            self.assertIn(b'deleted.bin',data)
            self.assertFalse((self.source/'target/golden-preparation.patch').exists())
            self.assertEqual(index.read_bytes(),before_bytes)
            for key in ('st_ino','st_mode','st_uid','st_gid','st_mtime_ns','st_ctime_ns'):
                self.assertEqual(getattr(index.stat(),key),getattr(before_stat,key))
            self.assertEqual(objects,{str(p.relative_to(self.source/'.git/objects')):p.read_bytes() for p in (self.source/'.git/objects').rglob('*') if p.is_file()})
            self.put('outside.rs','untracked outside output\n');self.failed()
            self.assertFalse((self.evidence/'golden.patch').exists(),'no previous success patch survives a failed collection')
        finally:
            for directory in directories:directory.chmod(0o755)

    def test_staged_outside_change_hidden_by_worktree_restore_is_refused(self):
        original=(self.source/'.devcontainer/devcontainer.json').read_bytes()
        self.put('.devcontainer/devcontainer.json','staged outside change\n')
        self.git('add','--','.devcontainer/devcontainer.json')
        self.put('.devcontainer/devcontainer.json',original)
        self.failed()

    def test_missing_identity_records_refused(self):
        for name, record in self.identity_records.items():
            with self.subTest(name=name):
                (self.evidence / name).unlink()
                self.failed()
                OWNER.write_json(self.evidence / name, record)

    def test_malformed_identity_records_refused(self):
        for name, record in self.identity_records.items():
            with self.subTest(name=name):
                (self.evidence / name).write_text('{"malformed":')
                self.failed()
                OWNER.write_json(self.evidence / name, record)

    def test_wrong_identity_source_refused(self):
        for name, field in (("candidate.json", "candidate"), ("candidate.json", "tree"),
                            ("source-inputs.json", "revision"), ("source-inputs.json", "tree"),
                            ("source-container.json", "source_revision"), ("source-container.json", "source_tree")):
            with self.subTest(name=name, field=field):
                OWNER.write_json(self.evidence / name, {**self.identity_records[name], field: "f" * 40})
                self.failed()
                OWNER.write_json(self.evidence / name, self.identity_records[name])

    def test_invalid_container_native_and_image_fields_refused(self):
        for field, value in (("container_id", "short"), ("image_config_digest", "floating:latest"),
                             ("os", "windows"), ("architecture", "arm64"), ("repo_digests", ["floating:latest"]),
                             ("rootfs", {}), ("rootfs", {"Type": "layers", "Layers": []}),
                             ("rootfs", {"Type": "layers", "Layers": ["bad"]})):
            with self.subTest(field=field, value=value):
                OWNER.write_json(self.evidence / "source-container.json", {**self.identity_records["source-container.json"], field: value})
                self.failed()
                OWNER.write_json(self.evidence / "source-container.json", self.identity_records["source-container.json"])

    def test_wrong_preparation_records_refused(self):
        for name, field, value in (("candidate.json", "diagnosticOnly", False), ("candidate.json", "diagnosticOnly", 1), ("candidate.json", "bundle_sha256", "f" * 64),
                                   ("source-inputs.json", "devcontainer_sha256", {})):
            with self.subTest(name=name, field=field):
                OWNER.write_json(self.evidence / name, {**self.identity_records[name], field: value})
                self.failed()
                OWNER.write_json(self.evidence / name, self.identity_records[name])

    def test_identity_symlinks_and_file_bounds_refused(self):
        for name, record in self.identity_records.items():
            with self.subTest(name=name):
                target = self.evidence / name
                target.unlink()
                target.symlink_to(self.source / ".devcontainer/devcontainer.json")
                self.failed()
                target.unlink()
                with target.open("wb") as stream:
                    stream.truncate(OWNER.MAX_FILE + 1)
                self.failed()
                OWNER.write_json(target, record)

    def test_failed_identity_capture_invalidates_old_record(self):
        with patch.object(OWNER, "verify"), patch.object(OWNER, "command", side_effect=subprocess.CalledProcessError(1, "docker")):
            with self.assertRaises(subprocess.CalledProcessError):
                OWNER.container_identity(self.source, self.evidence)
        self.failed()

    def test_duplicate_identity_fields_refused(self):
        target = self.evidence / "source-container.json"
        text = target.read_text().replace('"os": "linux"', '"os": "windows", "os": "linux"')
        target.write_text(text)
        self.failed()

    def test_container_capture_binds_actual_inspected_image(self):
        record = self.identity_records["source-container.json"]
        original_command = OWNER.command
        container = {"Id": record["container_id"], "Image": record["image_config_digest"]}
        image = {"Id": record["image_config_digest"], "RepoDigests": [], "RootFS": record["rootfs"], "Os": "linux", "Architecture": "amd64"}

        def inspect(source, *args):
            if args[0] != "docker":
                return original_command(source, *args)
            if args[1] == "ps":
                return (record["container_id"] + "\n").encode()
            return json.dumps([container if args[1] == "container" else image]).encode()

        with patch.object(OWNER, "command", side_effect=inspect):
            OWNER.container_identity(self.source, self.evidence)
            self.assertEqual(json.loads((self.evidence / "source-container.json").read_bytes()), record)
            OWNER.collect(self.source, self.evidence)
            image["Id"] = "sha256:" + "f" * 64
            with self.assertRaisesRegex(ValueError, "differs from container config"):
                OWNER.container_identity(self.source, self.evidence)
        self.failed()

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


class SnapshotTests(unittest.TestCase):
    def test_shared_and_canonical_sources_use_same_separate_capture(self):
        snapshot = OWNER.candidate_metadata()
        reader = json.loads(PATH.with_name('canonical').joinpath('reader-source.json').read_text())
        self.assertEqual((snapshot['candidate'],snapshot['tree']), (OWNER.REVISION,OWNER.TREE))
        self.assertEqual((reader['revision'],reader['tree']), (OWNER.REVISION,OWNER.TREE))
        repo = PATH.parents[2]
        canonical = (repo / '.github/workflows/numeric-canonical-packages.yml').read_text()
        self.assertIn('restore-prismpm-candidate.py game/scripts/numeric/prismpm-preparation-candidate prismpm', canonical)
        historical = json.loads(PATH.with_name('prismpm-candidate').joinpath('manifest.json').read_text())
        self.assertEqual(historical['candidate'], '2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec')

    @unittest.skipUnless(os.environ.get('PRISMPM_TEST_SOURCE'), 'full-history source required for immutable transport controls')
    def test_actual_restore_bootstrap_and_transport_identity_tampering(self):
        restore_spec = importlib.util.spec_from_file_location('restore_preparation', PATH.with_name('restore-prismpm-candidate.py'))
        restore = importlib.util.module_from_spec(restore_spec); restore_spec.loader.exec_module(restore)
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);source=root/'source';snapshot=root/'snapshot'
            subprocess.run(['git','clone','--shared','--no-checkout',os.environ['PRISMPM_TEST_SOURCE'],str(source)],check=True,capture_output=True)
            subprocess.run(['git','-C',str(source),'checkout','--detach',restore.BASE],check=True,capture_output=True)
            shutil.copytree(PATH.with_name('prismpm-preparation-candidate'),snapshot)
            original=(snapshot/'manifest.json').read_bytes();metadata=json.loads(original)
            for field in ('candidate','tree','source','base'):
                with self.subTest(field=field):
                    changed={**metadata,field:'f'*40};(snapshot/'manifest.json').write_text(json.dumps(changed))
                    with self.assertRaises(ValueError):restore.restore(snapshot,source)
                    (snapshot/'manifest.json').write_bytes(original)
            for name in ('candidate.bundle','candidate.patch'):
                with self.subTest(name=name):
                    target=snapshot/name;raw=target.read_bytes();target.write_bytes(raw+b'tamper')
                    with self.assertRaisesRegex(ValueError,'digest mismatch'):restore.restore(snapshot,source)
                    target.write_bytes(raw)
            OWNER.prepare(source,snapshot,root/'evidence')
            OWNER.verify(source,clean=True)
            self.assertIn(b'available', (root/'evidence/bootstrap-availability.txt').read_bytes())
            self.assertEqual(subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD']).decode().strip(),OWNER.REVISION)


if __name__ == "__main__":
    unittest.main()
