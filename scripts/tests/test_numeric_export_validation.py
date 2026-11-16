"""Local custody tests only: synthetic Git fixtures never run Docker or just vv."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('numeric_validation', Path(__file__).parents[1] / 'validate-numeric-export.py')
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)
IMAGE = 'ghcr.io/afflom/prismpm-sdk-patched@sha256:' + 'a' * 64
BOOTSTRAP = b'''jobs:
  gate:
    steps:
      - name: Run the template gate through the locked SDK
        shell: bash
        run: |
          set -euo pipefail
          docker run --rm "$image" bash -c 'exec just vv'
'''


class Custody(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'source'
        self.source.mkdir()
        self.output = self.root / 'evidence'
        self.git('init', '-q')
        self.git('config', 'user.name', 'Fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.git('remote', 'add', 'origin', 'https://github.com/afflom/UORust')
        files = {v.BOOTSTRAP: BOOTSTRAP, 'prismpm.lock': json.dumps({'sdk_image': IMAGE}).encode(),
                 'VERIFICATION.md': b'Universal policy\n', 'Justfile': b'vv: test\n',
                 'crates/uorust/src/certify.rs': b'old\n'}
        for name, data in files.items():
            path = self.source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        policies = [{'path': name, 'sha256': 'sha256:' + v.sha(files[name])}
                    for name in [v.BOOTSTRAP, 'prismpm.lock', 'VERIFICATION.md']]
        (self.source / 'template.lock').write_text(json.dumps({'sdk_image': IMAGE, 'policy_files': policies}))
        self.git('add', '.')
        self.git('commit', '-qm', 'base')
        self.base = self.git('rev-parse', 'HEAD').decode().strip()
        for value in ['first', 'second']:
            (self.source / 'crates/uorust/src/certify.rs').write_text(value + '\n')
            self.git('commit', '-qam', value)
        self.candidate_tree = self.git('rev-parse', 'HEAD^{tree}').decode().strip()
        self.patch = self.root / 'candidate.patch'
        self.patch.write_bytes(self.git('format-patch', '--stdout', self.base + '..HEAD'))
        self.git('reset', '--hard', self.base)
        self.data = {'schema': v.SCHEMA, 'base': self.base, 'candidate_tree': self.candidate_tree, 'patch_sha256': v.sha(self.patch.read_bytes()),
                     'bootstrap_sha256': v.sha(BOOTSTRAP), 'lock_sha256': v.sha(files['prismpm.lock']),
                     'sdk_image': IMAGE, 'allowed_paths': ['crates/uorust/src/certify.rs']}

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.source), *args], stderr=subprocess.DEVNULL)

    def target(self):
        path = self.root / 'manifest.json'
        path.write_text(json.dumps(self.data))
        return v.manifest(path)

    def prepare(self, mode='patched'):
        return v.prepare(self.source, self.output, mode, self.target(), self.patch)

    def test_valid_series_preserves_bootstrap_and_does_not_claim_gate(self):
        script, receipt = self.prepare()
        self.assertEqual((self.source / 'crates/uorust/src/certify.rs').read_text(), 'second\n')
        self.assertEqual(script.read_bytes(), v.bootstrap_script(BOOTSTRAP))
        self.assertFalse(receipt['full_gate_completed'])
        self.assertNotIn('full_gate_passed', receipt)

    def test_primitive_refuses_preflight_only_receipt(self):
        self.prepare()
        with self.assertRaisesRegex(ValueError, 'pass full acceptance first'):
            v.probe(self.source, self.output, self.target())

    def test_baseline_keeps_original_source(self):
        _, receipt = self.prepare('baseline')
        self.assertEqual(receipt['applied_head'], self.base)
        self.assertEqual((self.source / 'crates/uorust/src/certify.rs').read_text(), 'old\n')

    def test_wrong_base_refused(self):
        self.data['base'] = 'f' * 40
        with self.assertRaisesRegex(ValueError, 'base mismatch'): self.prepare()

    def test_dirty_checkout_refused(self):
        (self.source / 'unexpected').write_text('dirty')
        with self.assertRaisesRegex(ValueError, 'not clean'): self.prepare()

    def test_ignored_stale_output_refused(self):
        (self.source / '.git/info/exclude').write_text('stale-cache/\n')
        (self.source / 'stale-cache').mkdir()
        (self.source / 'stale-cache/result').write_text('old result')
        with self.assertRaisesRegex(ValueError, 'not clean'): self.prepare()

    def test_wrong_origin_refused(self):
        self.git('remote', 'set-url', 'origin', 'https://example.invalid/UORust')
        with self.assertRaisesRegex(ValueError, 'unexpected upstream'): self.prepare()

    def test_wrong_patch_hash_refused(self):
        self.patch.write_bytes(self.patch.read_bytes() + b'planted corruption')
        with self.assertRaisesRegex(ValueError, 'patch SHA mismatch'): self.prepare()

    def test_wrong_bootstrap_hash_refused(self):
        self.data['bootstrap_sha256'] = 'b' * 64
        with self.assertRaisesRegex(ValueError, 'bootstrap SHA mismatch'): self.prepare()

    def test_wrong_lock_hash_refused(self):
        self.data['lock_sha256'] = 'b' * 64
        with self.assertRaisesRegex(ValueError, 'lock SHA mismatch'): self.prepare()

    def test_wrong_sdk_refused(self):
        self.data['sdk_image'] = IMAGE[:-1] + 'b'
        with self.assertRaisesRegex(ValueError, 'SDK image mismatch'): self.prepare()

    def test_missing_changed_path_refused(self):
        self.data['allowed_paths'] = ['docs/numeric-export.md']
        with self.assertRaisesRegex(ValueError, 'paths differ'): self.prepare()

    def test_wrong_candidate_tree_refused(self):
        self.data['candidate_tree'] = 'f' * 40
        with self.assertRaisesRegex(ValueError, 'candidate tree mismatch'): self.prepare()

    def test_protected_gate_path_refused(self):
        self.data['allowed_paths'] = ['Justfile']
        with self.assertRaisesRegex(ValueError, 'protected gate/lock'): self.target()

    def test_template_policy_path_refused(self):
        self.data['allowed_paths'] = ['VERIFICATION.md']
        with self.assertRaisesRegex(ValueError, 'template policy files'): self.prepare()

    def test_path_escape_refused(self):
        self.data['allowed_paths'] = ['../outside']
        with self.assertRaisesRegex(ValueError, 'invalid patch path'): self.target()

    def test_mutable_base_and_image_refused(self):
        for field, value in [('base', 'main'), ('sdk_image', 'ghcr.io/afflom/prismpm-sdk-patched:latest')]:
            original = copy.deepcopy(self.data)
            self.data[field] = value
            with self.assertRaises(ValueError): self.target()
            self.data = original

    def test_changed_bootstrap_shape_refused(self):
        with self.assertRaisesRegex(ValueError, 'one unchanged bootstrap'): v.bootstrap_script(b'run: just test\n')


if __name__ == '__main__':
    unittest.main()
