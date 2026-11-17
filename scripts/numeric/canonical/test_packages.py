#!/usr/bin/env python3
"""Host harness controls; synthetic receipts never imply actual Prism acceptance."""
import hashlib
import json
import os
import tempfile
import tarfile
import unittest
from unittest import mock
from pathlib import Path
import packages as p


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',',':'), ensure_ascii=False).encode()


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(canonical(value))
    return p.digest(path)


class HarnessTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def project(self, op='mul32'):
        project = self.root / 'projects' / op; project.mkdir(parents=True)
        (project / 'src').mkdir()
        for name in p.INPUTS['kernel_files']:
            (project / 'src' / Path(name).name).write_bytes((p.REPO / name).read_bytes())
        (project / 'lexlean.lock').write_text('synthetic unit-test lock; not verifier evidence')
        write(project / 'staging.json', {'operation':op})
        p.freeze(project)
        return project

    def accepted(self, op='mul32'):
        project = self.project(op); evidence = self.root / 'operations' / op; evidence.mkdir(parents=True)
        d = p.descriptor(op)
        inputs = {'lexlean_source_id':'a'*64,'lexlean_semantic_id':'b'*64}
        bid = hashlib.sha256(canonical(inputs)).hexdigest()
        build = project / '.prism/build' / bid; build.mkdir(parents=True)
        data = b'synthetic emitted test bytes'
        (build / 'kernel.ir').write_bytes(data)
        artifacts = [{'path':'kernel.ir','byte_length':len(data),'sha256':p.digest(build / 'kernel.ir')}]
        write(build / 'manifest.json', {'inputs':inputs,'files':artifacts})
        receipt = {'schema':'prismpm/exporter-acquisition/2','mode':'source-backport','source_id':'numeric-task2c','compiler_revision':'2a13f942b04f0828e03c5d7db7e4db6ecb626d6e','archive_sha256':'6963efb98d5a67a54a5a969d520f0090218115f86da1dd573b789dc027fafb52','descriptor_sha256':'163fd02651d0c3e5116bdf1f0549b72d43ec849e66cd7d328b83cbec4fb70dc7','toolchain':'leanprover/lean4:v4.32.1','platform':'linux/amd64','inventory_sha256':p.NATIVE_INVENTORY,'sdk_lock_digest':'sha256:'+p.INPUTS['sdk_lock_sha256']}
        execution = {'schema':'prismpm/exporter-execution/1','source_archive_sha256':receipt['archive_sha256'],'acquisition':receipt,'executable':{'sha256':'d'*64}}
        phases = [{'phase':phase,'processes':[{'tool':tool,'exit_code':0,**({'exporter':execution} if tool=='prod-export' else {})} for tool in ['lake-build-generated','lean4-prod-build','prod-export','native-library-package']]} for phase in ['controller-build','replay']]
        acceptance = {'schema':'prismpm/library-acceptance/1','build_id':bid,'scope':'native-library-only','status':'passed','regeneration':'byte-identical','executions':[{'mode':mode,'status':'passed','roots':[d['acceptance_root']]} for mode in ['std','no_std']],'export_roots':sorted([d['root'],d['acceptance_root']])}
        att = b'synthetic unit-test source attestation'
        manifest = {'schema':'prismpm/library-verification-manifest/2','build_id':bid,'scope':'native-library-only','acceptance_sha256':hashlib.sha256(canonical(acceptance)).hexdigest(),'lexlean_attestation_sha256':hashlib.sha256(att).hexdigest(),'artifacts':artifacts,'exporter_owner':{'schema':'prismpm/verification-exporter-owner/1','phases':phases}}
        aid = hashlib.sha256(canonical(manifest)).hexdigest()
        verified = project / '.prism/verified' / aid; verified.mkdir(parents=True)
        write(verified / 'manifest.json',manifest); write(verified / 'library-acceptance.json',acceptance); (verified / 'lexlean-attestation.json').write_bytes(att)
        write(evidence / 'build-result.json', {'schema':'prismpm/build-result/1','build_id':bid,'source_id':'a'*64,'semantic_id':'b'*64,'manifest_path':'.prism/build/'+bid+'/manifest.json','model_path':'.prism/build/'+bid+'/model.prism.json'})
        write(evidence / 'verify-result.json', {'schema':'prismpm/verify-result/1','build_id':bid,'attestation_id':aid,'verified_root':'.prism/verified/'+aid})
        for phase in ['prepare','build','verify','select']: (evidence / (phase+'.status')).write_text('0\n')
        return project,evidence,build,verified

    def test_metadata_calls_real_root_matches_option_and_sorted_exports(self):
        for op in p.OPS:
            d=p.descriptor(op); s=p.metadata(d)
            self.assertEqual(s.count('Float::'+op+' '),len(d['acceptance_cases']))
            self.assertEqual(s.count('Option.none => false'),len(d['acceptance_cases']))
            self.assertIn('(cons "'+d['root']+'" (cons "'+d['acceptance_root']+'"',s)

    def test_frozen_file_set_source_and_symlink_refusals(self):
        project=self.project(); p.check(project)
        f=project/'src/Float.lex.tex'; original=f.read_bytes(); f.write_bytes(original+b'\n')
        with self.assertRaisesRegex(ValueError,'frozen input'): p.check(project)
        f.write_bytes(original); (project/'extra.lex.tex').write_text('extra')
        with self.assertRaisesRegex(ValueError,'file set'): p.check(project)
        (project/'extra.lex.tex').unlink(); f.unlink(); f.symlink_to(p.REPO/'prism/numeric/src/Float.lex.tex')
        with self.assertRaisesRegex(ValueError,'regular file'): p.check(project)

    def test_selects_json_identity_and_rejects_wrong_result_bundle(self):
        project,ev,build,verified=self.accepted(); selected=p.selection(project,ev)
        (project/'.prism/build'/('f'*64)).mkdir()
        self.assertEqual(p.selection(project,ev),selected)
        (build/'kernel.ir').write_bytes(b'changed output')
        with self.assertRaisesRegex(ValueError,'changed build closure'): p.selection(project,ev)
        value=json.loads((ev/'verify-result.json').read_text()); value['verified_root']='../../wrong';write(ev/'verify-result.json',value)
        with self.assertRaisesRegex(ValueError,'selection mismatch'): p.selection(project,ev)

    def test_manifest_and_acceptance_mutations_are_refused(self):
        project,ev,_,verified=self.accepted()
        value=json.loads((verified/'manifest.json').read_text());value['exporter_owner']['phases'][0]['processes'][2]['exporter']['acquisition']['mode']='sdk-seed';write(verified/'manifest.json',value)
        with self.assertRaisesRegex(ValueError,'content identity'):p.selection(project,ev)

    def test_rebound_wrong_root_archive_and_child_receipts_are_refused(self):
        parent = self.root
        for mutation,pattern in [('root','wrong exported roots'),('archive','receipt mismatch'),('child','receipt mismatch'),('source','build input/source')]:
            with self.subTest(mutation=mutation):
                self.root = parent / mutation; self.root.mkdir()
                project,ev,_,verified = self.accepted()
                if mutation == 'source':
                    b=json.loads((ev/'build-result.json').read_text());b['source_id']='e'*64;write(ev/'build-result.json',b)
                else:
                    m=json.loads((verified/'manifest.json').read_text())
                    if mutation == 'root':
                        a=json.loads((verified/'library-acceptance.json').read_text());a['export_roots']=['Wrong.root'];m['acceptance_sha256']=write(verified/'library-acceptance.json',a)
                    elif mutation == 'archive':
                        for phase in m['exporter_owner']['phases']:phase['processes'][2]['exporter']['acquisition']['archive_sha256']='e'*64
                    else:
                        m['exporter_owner']['phases'][1]['processes'][2]['exporter']['executable']['sha256']='e'*64
                    aid=write(verified/'manifest.json',m); new=verified.parent/aid;verified.rename(new)
                    v=json.loads((ev/'verify-result.json').read_text());v['attestation_id']=aid;v['verified_root']='.prism/verified/'+aid;write(ev/'verify-result.json',v)
                with self.assertRaisesRegex(ValueError,pattern):p.selection(project,ev)
        self.root = parent

    def test_four_project_retention_completeness_statuses_and_cache_exclusion(self):
        for op in p.OPS:
            project,_,_,_=self.accepted(op)
            cache=project/'.lake/packages/cache';cache.mkdir(parents=True);(cache/'link').symlink_to('/missing')
        for name in ['runner-exit-code.txt','runner-command-exit-code.txt','custody-exit-code.txt','container-exit-code.txt','log-capture-exit-code.txt']:(self.root/name).write_text('0\n')
        write(self.root/'replay/manifest.json',{'unit-test':'synthetic'})
        dest=self.root/'retained'; status=p.retain(self.root,dest)
        self.assertEqual(status['status'],'complete-reader-inputs')
        self.assertEqual(set(status['selected']),set(p.OPS))
        self.assertFalse(any('/.lake/' in name for name in status['files']))
        (self.root/'operations/div64/verify.status').write_text('not-run\n')
        status=p.retain(self.root,dest); self.assertEqual(status['status'],'incomplete')
        self.assertTrue(any('div64' in x for x in status['pending']))
        self.assertTrue((dest/'canonical-small-logs.tar.gz').is_file())
        with mock.patch.object(p, 'MAX_RAW', 1):
            bounded=p.retain(self.root,dest)
        self.assertEqual(bounded['status'],'incomplete')
        self.assertFalse((dest/'canonical-reader-inputs.tar.gz').exists())
        self.assertTrue((dest/'canonical-small-logs.tar.gz').is_file())

    def test_replay_failure_fallback_survives_primary_archive_refusal(self):
        replay=self.root/'replay'; replay.mkdir()
        diagnostic=b'x'*140000+b'\nerror: original rustc replay failure\n'
        log=replay/'mul32-native.log'; log.write_bytes(diagnostic)
        command={'argv':['rustc','emitted/src/lib.rs'],'exit_code':1}
        status=replay/'mul32-native.log.status.json'; write(status,command)
        (replay/'numeric.wasm').write_bytes(b'wasm artifact')
        (replay/'libnumeric_mul32_native.rlib').write_bytes(b'rlib artifact')
        cache=replay/'target/cache'; cache.mkdir(parents=True)
        (cache/'excluded.log').write_text('cache log')
        dest=self.root/'retained'
        for bound in ('MAX_RAW','MAX_ARCHIVE'):
            with self.subTest(bound=bound):
                with mock.patch.object(p,bound,1):
                    retained=p.retain(self.root,dest)
                self.assertEqual(retained['status'],'incomplete')
                self.assertFalse((dest/'canonical-reader-inputs.tar.gz').exists())
                with tarfile.open(dest/'canonical-small-logs.tar.gz','r:gz') as archive:
                    self.assertIn('replay/mul32-native.log',archive.getnames())
                    self.assertEqual(archive.extractfile('replay/mul32-native.log').read(),diagnostic[-131072:])
                    self.assertEqual(json.load(archive.extractfile('replay/mul32-native.log.status.json')),command)
                    self.assertFalse(any(name.endswith(('.wasm','.rlib')) or '/target/' in name for name in archive.getnames()))
                small=json.loads((dest/'small-logs-status.json').read_text())
                rows={row['path']:row for row in small['files']}
                self.assertEqual(rows['replay/mul32-native.log'],{'path':'replay/mul32-native.log','original_sha256':p.digest(log),'original_bytes':len(diagnostic),'retained_bytes':131072,'truncated':True})
                self.assertEqual(rows['replay/mul32-native.log.status.json']['original_sha256'],p.digest(status))
                self.assertEqual(rows['replay/mul32-native.log.status.json']['original_bytes'],status.stat().st_size)
                self.assertFalse(rows['replay/mul32-native.log.status.json']['truncated'])

    @unittest.skipUnless(os.environ.get('PRISMPM_SOURCE'),'set PRISMPM_SOURCE for actual pinned fixture staging test')
    def test_actual_fixture_stage_is_deterministic_single_source_and_pinned(self):
        source=Path(os.environ['PRISMPM_SOURCE']);a=self.root/'a';b=self.root/'b';p.stage(source,a);p.stage(source,b)
        manifest=lambda root:{str(f.relative_to(root)):p.digest(f) for f in p.files(root)}
        self.assertEqual(manifest(a),manifest(b))
        for op in p.OPS:
            for name,want in p.INPUTS['kernel_files'].items():self.assertEqual(p.digest(a/op/'src'/Path(name).name),want)
        with self.assertRaisesRegex(ValueError,'already exists'):p.stage(source,a)

if __name__=='__main__':unittest.main()
