"""Structural adversarial controls only; these fixtures never qualify native generation."""
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

PATH = Path(__file__).resolve().parents[1] / 'native-golden-preparation.py'
spec = importlib.util.spec_from_file_location('native_preparation', PATH)
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value) + '\n')


class NativeControls(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.source = self.root/'source'; self.source.mkdir()
        self.snapshot = self.root/'snapshot'; self.snapshot.mkdir()
        self.evidence = self.root/'evidence'; self.evidence.mkdir()
        self.output = self.root/'owner'; self.output.mkdir()
        self.env = {'GITHUB_ACTIONS':'true','GITHUB_SERVER_URL':'https://github.com',
                    'GITHUB_REPOSITORY':native.REPOSITORY,'GITHUB_SHA':'a'*40,
                    'GITHUB_WORKFLOW_REF':native.REPOSITORY+'/.github/workflows/prismpm-backport-native-golden.yml@refs/heads/numeric-kernels',
                    'GITHUB_WORKFLOW_SHA':'a'*40,'GITHUB_EVENT_NAME':'workflow_dispatch',
                    'GITHUB_REF':'refs/heads/numeric-kernels','GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'2',
                    'RUNNER_OS':'Linux','RUNNER_ARCH':'X64','RUNNER_ENVIRONMENT':'github-hosted'}
        self.addCleanup(patch.stopall); patch.dict(os.environ,self.env,clear=True).start()
        self.metadata = {'source':native.SOURCE,'base':native.BASE,'candidate':native.REVISION,'tree':native.TREE,
                         'bundle_sha256':'b'*64,'patch_sha256':'c'*64,'schema':'cs1618/prismpm-diagnostic/1'}
        self.inputs = [{'path':'source/'+p,'bytes':1,'sha256':'d'*64} for p in native.INPUTS]
        self.inputs += [{'path':'game/restore-prismpm-candidate.py','bytes':1,'sha256':native.RESTORE_SHA256}]
        self.inputs.sort(key=lambda x:x['path'])
        patch.object(native,'verify_game').start()
        patch.object(native,'snapshot_metadata',return_value=self.metadata).start()
        patch.object(native,'verify_source').start(); patch.object(native,'verify_changes').start()
        patch.object(native,'input_rows',return_value=self.inputs).start()
        patch.object(native,'manifest_digest',return_value=native.MANIFEST_SHA256).start()
        receipt={'diagnosticOnly':True,**self.metadata}; write(self.evidence/'restoration-receipt.json',receipt)
        self.prepared = native.initial_state('amd64'); self.prepared['source']=native.source_identity(self.metadata,self.evidence)
        self.prepared['inputs']=self.inputs;self.prepared['error']='native commands not yet observed'
        native.write_json(self.evidence/'preparation.json', self.prepared)
        for name,argv in native.command_specs(self.output):
            directory=self.evidence/name
            write(self.evidence/(name+'-command.json'),{'argv':argv,'exit_code':0})
            write(directory/'owner.json',{'owner':'ci-observe','version':1})
            write(directory/'ready.json',{'owner':'ci-observe','version':1})
            (directory/'stop').touch(); (directory/'resources.jsonl').write_text('{}\n')
            write(directory/'monitor-result.json',{'samples':1,'bytes':3,'reason':'stopped'})
            write(directory/'gate-result.json',{'state':'completed','exitCode':0,'diagnosticsError':False})
            (directory/'gate.log').write_text('passed\n')
            write(directory/'log-retention.json',{'observedBytes':7,'headBytes':7,'tailBytes':0,'generation':-1,'truncated':False,'headLimit':33554432,'tailLimit':1048576,'note':'fixture'})
        # Global observer has the same original ownership and stop protocol.
        shutil.copytree(self.evidence/'native-helper-tests',self.evidence/'observer')
        for n in ['gate.log','gate-result.json','log-retention.json']:(self.evidence/'observer'/n).unlink()
        records=[]
        for path in native.RECORDS:
            raw=(path+'\n').encode(); target=self.output/'records'/path; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(raw)
            target=self.source/native.profile('amd64')/path; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(raw)
            records.append({'path':path,'byte_length':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
        self.lock={'source_revision':native.ENVIRONMENT_REVISION,'reference':native.IMAGE,'architecture':'amd64',
                   'child_digest':'sha256:'+'b'*64,'config_digest':'sha256:'+'f'*64}
        self.chain={'reference':native.IMAGE,'architecture':'amd64','child_digest':self.lock['child_digest'],
                    'config_digest':self.lock['config_digest']}
        patch.object(native,'selected_lock',return_value=self.lock).start()
        self.review={'schema':'prismpm/native-golden-review/1','scope':'source-golden-review-only','status':'review-required',
                     'source_revision':native.REVISION,'environment_revision':native.ENVIRONMENT_REVISION,'environment_image':native.IMAGE,
                     'identity':{'id':'sha256:'+'f'*64,'platform_id':'sha256:'+'f'*64,'store':'classic'},'dependency_preparation_sha256':'e'*64,
                     'platform':'linux-amd64-ubuntu-24.04','native_basis':'github-hosted-X64-runner-selection',
                     'run_id':'123','run_attempt':'2','records':records,
                     'unclaimed':['hardware-attestation','reviewed-baseline','current-sdk-acceptance','sdk-release','product-readiness']}
        write(self.output/'review.json',self.review)
        write(self.output/'environment.json',{'lock':self.lock,'chain':self.chain})
        for name in ['cargo-seeded-inputs.json','cargo-inputs.json']:write(self.output/name,[{}])
        write(self.output/'dependency-preparation.json',{'preparation':{},'preparation_sha256':hashlib.sha256(b'{}').hexdigest()})
        self.review['dependency_preparation_sha256']=hashlib.sha256(b'{}').hexdigest();write(self.output/'review.json',self.review)
        for kind in ['build','verified']:
            (self.output/'generated'/kind).mkdir(parents=True);(self.output/'generated'/kind/'manifest.json').write_text('{}')
            shutil.copytree(self.output/'generated'/kind,self.source/'.prism'/kind)
        self.actor='prismpm-native-golden-'+'1'*24
        self.acquisition=self.actor+'-dependencies';self.cid='2'*64;self.acquisition_cid='3'*64
        self.command_count=0
        git_prefix=['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null','-c','core.quotePath=false','-C',str(self.source)]
        self.add_command('git',git_prefix+['rev-parse','HEAD'],stdout=(native.REVISION+'\n').encode())
        self.add_command('git',git_prefix+['status','--porcelain=v1','--untracked-files=all'])
        self.create_actor(self.acquisition,self.acquisition_cid,'bridge')
        self.cleanup_actor(self.acquisition,self.acquisition_cid)
        self.create_actor(self.actor,self.cid,'none')
        base=['cargo','run','--locked','--offline','-p','xtask','--','check-golden']
        self.add_command('docker',['exec',self.actor,*base,'--write'])
        self.add_command('docker',['exec',self.actor,*base])
        self.add_command('git',git_prefix+['rev-parse','HEAD'],stdout=(native.REVISION+'\n').encode())
        self.add_command('git',git_prefix+['diff','--name-only','HEAD'])
        self.add_command('git',git_prefix+['ls-files','--others','--exclude-standard'])
        self.cleanup_actor(self.actor,self.cid)
        self.nested_products()

    def add_command(self,command,args,status=0,stdout=b'',stderr=b''):
        self.command_count+=1;stem=f'{self.command_count:03d}'
        write(self.output/(stem+'.command.json'),{'command':command,'args':args,'status':status,'signal':None})
        (self.output/(stem+'.stdout')).write_bytes(stdout);(self.output/(stem+'.stderr')).write_bytes(stderr)

    def create_actor(self,actor,cid,network):
        self.add_command('docker',['create','--name',actor,'--label','org.uor.prismpm.golden-review='+actor,
                                   '--network',network],stdout=(cid+'\n').encode())

    def cleanup_actor(self,actor,cid):
        row={'Id':cid,'Name':'/'+actor,'Image':'sha256:'+'f'*64,'Config':{'Labels':{'org.uor.prismpm.golden-review':actor}}}
        self.add_command('docker',['inspect',cid],stdout=(json.dumps([row])+'\n').encode())
        self.add_command('docker',['rm','--force','--volumes',cid],stdout=(cid+'\n').encode())
        for target in [cid,actor]:
            self.add_command('docker',['inspect',target],status=1,stdout=b'[]\n',stderr=('Error: No such object: '+target+'\n').encode())

    def bind_raw_record(self,path,value):
        raw=(json.dumps(value,separators=(',',':'))+'\n').encode()
        for root in [self.output/'records',self.source/native.profile('amd64')]:
            (root/path).write_bytes(raw)
        row=next(row for row in self.review['records'] if row['path']==path)
        row.update(byte_length=len(raw),sha256=hashlib.sha256(raw).hexdigest())
        write(self.output/'review.json',self.review)

    def nested_products(self):
        self.build_id='4'*64;self.attestation_id='5'*64
        self.bind_raw_record('golden-manifest.json',{'build_id':self.build_id,'attestation_id':self.attestation_id})
        for kind,identity in [('build',self.build_id),('verified',self.attestation_id)]:
            for root in [self.output/'generated'/kind,self.source/'.prism'/kind]:
                if (root/'manifest.json').exists():
                    (root/identity).mkdir();(root/'manifest.json').rename(root/identity/'manifest.json')

    def collect(self):return native.collect(self.source,self.snapshot,self.evidence,self.output,'amd64')
    def refuses(self):
        state=self.collect();self.assertEqual(state['status'],'incomplete');self.assertIsNotNone(state['error'])
        self.assertEqual(json.loads((self.evidence/'orchestration.json').read_bytes()),state)

    def test_complete_is_review_required_with_separate_identities(self):
        state=self.collect();self.assertEqual(state['status'],'complete-review-required',state['error'])
        self.assertEqual(state['game']['sha'],'a'*40);self.assertEqual(state['source']['revision'],native.REVISION)
        self.assertIsNone(state['runner']['image_os']);self.assertIsNone(state['runner']['image_version'])
        self.assertEqual(set(state),native.FIELDS);self.assertEqual(len(state['owner']['records']),3)
        self.assertTrue(state['files']);self.assertNotIn('evidence/orchestration.json',[r['path'] for r in state['files']])

    def test_wrong_owner_identity(self):
        for key,value in [('run_id','999'),('run_attempt','3'),('source_revision','a'*40),('platform','linux-arm64-ubuntu-24.04'),('status','accepted')]:
            with self.subTest(key=key):
                altered={**self.review,key:value};write(self.output/'review.json',altered);self.refuses()
        write(self.output/'review.json',self.review)

    def test_wrong_real_context(self):
        for key,value in [('GITHUB_REPOSITORY','other/repo'),('GITHUB_RUN_ID','124'),('GITHUB_RUN_ATTEMPT','3'),('RUNNER_ARCH','ARM64'),('GITHUB_WORKFLOW_SHA','b'*40),('GITHUB_SHA',native.REVISION)]:
            with self.subTest(key=key),patch.dict(os.environ,{key:value}):self.refuses()

    def test_stale_source_inputs_and_snapshot(self):
        for key in ['inputs','source']:
            altered=copy.deepcopy(self.prepared)
            if key=='inputs':altered[key][0]['sha256']='0'*64
            else:altered[key]['bundle_sha256']='0'*64
            write(self.evidence/'preparation.json',altered);self.refuses()
        write(self.evidence/'preparation.json',self.prepared)

    def test_failed_commands_observer_and_truncation(self):
        for name,argv in native.command_specs(self.output):
            for filename,record in [('gate-result.json',{'state':'completed','exitCode':1,'diagnosticsError':False}),('gate-result.json',{'state':'completed','exitCode':0,'diagnosticsError':True}),('log-retention.json',{'truncated':True})]:
                path=self.evidence/name/filename;before=path.read_bytes();write(path,record);self.refuses();path.write_bytes(before)
            path=self.evidence/name/'gate.log';path.write_text('short');self.refuses();path.write_text('passed\n')
            path=self.evidence/(name+'-command.json');before=path.read_bytes();write(path,{'argv':argv,'exit_code':1});self.refuses();path.write_bytes(before)
        path=self.evidence/'observer/monitor-result.json';write(path,{'samples':1,'bytes':3,'reason':'collection-error'});self.refuses()

    def test_missing_extra_alias_oversize_and_original_hash(self):
        for relative in ['review.json','generated/build/'+self.build_id+'/manifest.json','001.stdout','records/verified/manifest.json']:
            p=self.output/relative;raw=p.read_bytes();p.unlink();self.refuses();p.write_bytes(raw)
        p=self.output/'extra';p.write_text('extra');self.refuses();p.unlink()
        p=self.output/'records/golden-manifest.json';raw=p.read_bytes();p.write_text('changed');self.refuses();p.unlink();p.symlink_to(self.source/native.profile('amd64')/'golden-manifest.json');self.refuses();p.unlink();p.write_bytes(raw)
        p=self.output/'generated/build/huge';p.touch()
        with p.open('r+b') as stream:stream.truncate(native.MAX_FILE+1)
        self.refuses();p.unlink()
        p=self.output/'failure.json';write(p,{'message':'failed'});self.refuses()

    def test_failure_keeps_observed_command_exit_and_invalid_log_state(self):
        name,argv=native.command_specs(self.output)[0]
        write(self.evidence/(name+'-command.json'),{'argv':argv,'exit_code':23})
        state=self.collect();self.assertEqual(state['status'],'incomplete')
        self.assertEqual(state['commands'][0]['exit_code'],23)
        self.assertEqual(state['commands'][0]['argv'],argv)
        write(self.evidence/(name+'-command.json'),{'argv':argv,'exit_code':0})
        write(self.evidence/name/'gate-result.json',{'state':'completed','exitCode':0,'diagnosticsError':True})
        state=self.collect();self.assertFalse(state['commands'][0]['log_complete'])

    def test_missing_extra_and_changed_nonmanifest_generated_product(self):
        original=self.source/'.prism/build'/self.build_id/'original.bin';original.write_bytes(b'original')
        retained=self.output/'generated/build'/self.build_id/'original.bin'
        self.refuses();retained.write_bytes(b'original')
        self.assertEqual(self.collect()['status'],'complete-review-required')
        retained.write_bytes(b'changed');self.refuses()
        retained.write_bytes(b'original');(self.output/'generated/verified/extra.bin').write_bytes(b'extra');self.refuses()

    def test_loaded_image_and_chain_join(self):
        for change in ['identity','chain']:
            review=copy.deepcopy(self.review);environment=native.read_json(self.output/'environment.json')
            if change=='identity':review['identity']={'id':'sha256:'+'0'*64,'platform_id':'sha256:'+'0'*64,'store':'classic'}
            else:environment['chain']['config_digest']='sha256:'+'0'*64
            write(self.output/'review.json',review);write(self.output/'environment.json',environment);self.refuses()
            write(self.output/'review.json',self.review)
            write(self.output/'environment.json',{'lock':self.lock,'chain':self.chain})

    def test_arm64_complete_uses_distinct_lane_profile_and_basis(self):
        native_dir=self.source/'tests/golden/native'
        (native_dir/'linux-amd64-ubuntu-24.04').rename(native_dir/'linux-arm64-ubuntu-24.04')
        self.lock['architecture']='arm64';self.chain['architecture']='arm64'
        self.review['platform']='linux-arm64-ubuntu-24.04';self.review['native_basis']='github-hosted-ARM64-runner-selection'
        write(self.output/'review.json',self.review);write(self.output/'environment.json',{'lock':self.lock,'chain':self.chain})
        with patch.dict(os.environ,{'RUNNER_ARCH':'ARM64'}):
            prepared=native.initial_state('arm64');prepared['source']=native.source_identity(self.metadata,self.evidence)
            prepared['inputs']=self.inputs;prepared['error']='native commands not yet observed'
            native.write_json(self.evidence/'preparation.json',prepared)
            state=native.collect(self.source,self.snapshot,self.evidence,self.output,'arm64')
            self.assertEqual(state['status'],'complete-review-required',state['error'])
            self.assertEqual(state['owner']['platform'],'linux-arm64-ubuntu-24.04')

    def test_prepare_failure_starts_with_null_observations_and_absent_owner_output(self):
        evidence=self.root/'fresh-evidence';output=self.root/'fresh-owner'
        with patch.object(os,'getuid',return_value=0):
            with self.assertRaisesRegex(ValueError,'nonroot'):
                native.prepare(self.source,self.snapshot,evidence,output,'amd64')
        state=json.loads((evidence/'orchestration.json').read_bytes())
        self.assertEqual(state['status'],'incomplete');self.assertEqual(set(state),native.FIELDS)
        self.assertIsNone(state['source']);self.assertIsNone(state['inputs']);self.assertIsNone(state['owner'])
        self.assertEqual(state['commands'],[]);self.assertEqual(state['files'],[]);self.assertFalse(output.exists())

    def test_real_writer_content_id_product_layout_completes(self):
        self.nested_products()
        raw=(self.output/'records/golden-manifest.json').read_bytes()
        state=self.collect();self.assertEqual(state['status'],'complete-review-required',state['error'])
        self.assertEqual((self.output/'records/golden-manifest.json').read_bytes(),raw)
        # Both sides moving together cannot substitute another content-ID path.
        for kind,identity in [('build',self.build_id),('verified',self.attestation_id)]:
            manifest=self.output/'generated'/kind/identity/'manifest.json';raw=manifest.read_bytes();manifest.unlink()
            self.refuses();manifest.write_bytes(raw)
            for root in [self.output/'generated'/kind,self.source/'.prism'/kind]:
                (root/identity).rename(root/('6'*64))
            self.refuses()
            for root in [self.output/'generated'/kind,self.source/'.prism'/kind]:
                (root/('6'*64)).rename(root/identity)

    def test_all_cleanup_suffix_deletions_refuse_completion(self):
        state=self.collect();self.assertEqual(state['status'],'complete-review-required',state['error'])
        originals={p:p.read_bytes() for p in self.output.iterdir() if p.name[:3].isdigit()}
        for count in range(1,self.command_count+1):
            with self.subTest(missing_suffix_commands=count):
                try:
                    for number in range(self.command_count-count+1,self.command_count+1):
                        for suffix in ['command.json','stdout','stderr']:(self.output/f'{number:03d}.{suffix}').unlink()
                    self.refuses()
                finally:
                    for path,raw in originals.items():path.write_bytes(raw)

    def test_cleanup_actor_cid_label_image_status_and_endpoint_joins(self):
        originals={p:p.read_bytes() for p in self.output.iterdir() if p.name[:3].isdigit()}
        start=self.command_count-3
        for field,value in [('Id','9'*64),('Name','/another-actor'),('Image','sha256:'+'9'*64),('Config',{'Labels':{'org.uor.prismpm.golden-review':'other'}})]:
            path=self.output/f'{start:03d}.stdout';rows=json.loads(path.read_bytes());rows[0][field]=value;write(path,rows)
            with self.subTest(field=field):self.refuses()
            for p,raw in originals.items():p.write_bytes(raw)
        path=self.output/f'{self.command_count:03d}.command.json';value=json.loads(path.read_bytes());value['status']=0;write(path,value);self.refuses()
        for p,raw in originals.items():p.write_bytes(raw)
        path=self.output/f'{self.command_count:03d}.stderr';path.write_bytes(b'other failure');self.refuses()
        for p,raw in originals.items():p.write_bytes(raw)
        # An extra successful-looking command after cleanup is not the owner endpoint.
        self.add_command('git',['rev-parse','HEAD'],stdout=(native.REVISION+'\n').encode());self.refuses()

    def test_actor_creation_response_and_final_source_check_joins(self):
        originals={p:p.read_bytes() for p in self.output.iterdir() if p.name[:3].isdigit()}
        creates=[p for p in self.output.glob('*.command.json') if json.loads(p.read_bytes())['args'][:1]==['create']]
        for path in creates:
            stem=path.name.split('.')[0];stdout=self.output/(stem+'.stdout');stdout.write_bytes(('9'*64+'\n').encode())
            with self.subTest(create_cid=stem):self.refuses()
            for p,raw in originals.items():p.write_bytes(raw)
            value=json.loads(path.read_bytes());value['args'][value['args'].index('--label')+1]='org.uor.prismpm.golden-review=other';write(path,value)
            with self.subTest(create_label=stem):self.refuses()
            for p,raw in originals.items():p.write_bytes(raw)
        for number in range(self.command_count-6,self.command_count-3):
            path=self.output/f'{number:03d}.command.json';value=json.loads(path.read_bytes());value['args']=['other-source-check'];write(path,value)
            with self.subTest(final_source_check=number):self.refuses()
            for p,raw in originals.items():p.write_bytes(raw)

    def test_interior_cleanup_and_individual_stream_deletions_refuse(self):
        for stem in ['004',f'{self.command_count:03d}']:
            for suffix in ['command.json','stdout','stderr']:
                path=self.output/(stem+'.'+suffix);raw=path.read_bytes();path.unlink()
                with self.subTest(path=path.name):self.refuses()
                path.write_bytes(raw)
        paths=[self.output/('004.'+suffix) for suffix in ['command.json','stdout','stderr']]
        originals={path:path.read_bytes() for path in paths}
        for path in paths:path.unlink()
        self.refuses()
        for path,raw in originals.items():path.write_bytes(raw)

    def test_closed_duplicate_and_extra_fields(self):
        path=self.evidence/'preparation.json';raw=path.read_bytes()
        for contents in [raw[:-2]+b',"extra":true}\n',b'{"schema":1,"schema":2}']:
            path.write_bytes(contents);self.refuses()


class WorkflowControls(unittest.TestCase):
    def test_native_lanes_pins_commands_and_failure_retention(self):
        workflow=PATH.parents[2]/'.github/workflows/prismpm-backport-native-golden.yml'
        text=workflow.read_text()
        self.assertIn('branches: [numeric-kernels]',text)
        self.assertIn('  workflow_dispatch:',text)
        self.assertIn('  contents: read',text)
        self.assertIn('    timeout-minutes: 75',text)
        self.assertIn('      fail-fast: false\n      max-parallel: 2',text)
        self.assertIn('          - os: ubuntu-24.04\n            arch: amd64\n          - os: ubuntu-24.04-arm\n            arch: arm64',text)
        for pinned in ['actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
                       'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
                       'docker/setup-buildx-action@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f',
                       'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
                       'node-version: 22.23.2','version: v0.28.0',
                       'image=docker.io/moby/buildkit@sha256:de10faf919fc71ba4eb1dd7bd6449566d012b0c9436b1c61bfee21d621b009aa']:
            self.assertIn(pinned,text)
        self.assertEqual(text.count('persist-credentials: false'),2)
        self.assertEqual(text.count('fetch-depth: 0'),2)
        self.assertIn('-- node scripts/native-golden.mjs tests',text)
        self.assertIn('-- node scripts/native-golden.mjs run "$SOURCE_REVISION" "$RUNNER_TEMP/native-golden"',text)
        self.assertIn('SOURCE_REVISION: '+native.REVISION,text)
        self.assertEqual(text.count('if: always()'),4)
        self.assertEqual(text.count('retention-days: 14'),2)
        self.assertEqual(text.count('compression-level: 6'),2)
        self.assertEqual(text.count('exit "$code"'),2)
        self.assertNotRegex(text,r'(?m)^\s+(?:GITHUB_|RUNNER_)[A-Z_]+:')
        self.assertNotRegex(text,r'chown|setup-qemu|docker/login|devcontainers/ci|continue-on-error|: write')
        self.assertIn('test "$(id -u)" -gt 0',text)
        self.assertEqual(text.count('native-golden-preparation.py prepare'),1)
        self.assertEqual(text.count('native-golden-preparation.py collect'),1)

    def test_pinned_snapshot_and_immutable_helper(self):
        snapshot=PATH.with_name('prismpm-native-candidate')
        metadata=native.snapshot_metadata(snapshot)
        self.assertEqual((metadata['candidate'],metadata['tree']),(native.REVISION,native.TREE))
        self.assertEqual(native.digest(native.regular(PATH.with_name('restore-prismpm-candidate.py'))),native.RESTORE_SHA256)
        historical=json.loads(PATH.with_name('prismpm-candidate').joinpath('manifest.json').read_bytes())
        self.assertEqual(historical['candidate'],'2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec')

    def test_snapshot_manifest_bundle_and_patch_tampering_are_refused(self):
        with tempfile.TemporaryDirectory() as temporary:
            snapshot=Path(temporary)/'snapshot';shutil.copytree(PATH.with_name('prismpm-native-candidate'),snapshot)
            for name in ['manifest.json','candidate.bundle','candidate.patch']:
                path=snapshot/name;raw=path.read_bytes();path.write_bytes(raw+b'tamper')
                with self.subTest(name=name),self.assertRaises(ValueError):native.snapshot_metadata(snapshot)
                path.write_bytes(raw)

    @unittest.skipUnless(os.environ.get('PRISMPM_TEST_SOURCE'), 'full-history source required for authenticated restoration controls')
    def test_actual_immutable_native_restoration_without_source_mutation(self):
        upstream=Path(os.environ['PRISMPM_TEST_SOURCE']).resolve()
        def source_state():
            return (subprocess.check_output(['git','-C',str(upstream),'rev-parse','HEAD']),
                    subprocess.check_output(['git','--no-optional-locks','-C',str(upstream),'status','--porcelain=v1','--untracked-files=all']),
                    (upstream/'.git/index').read_bytes())
        before=source_state()
        # Guard the only complete owned checkout. No SDK/image acquisition.
        self.assertGreaterEqual(shutil.disk_usage(upstream).free,8*1024**3+400*1024**2)
        with tempfile.TemporaryDirectory(prefix='native-restore-control-') as temporary:
            checkout=Path(temporary)/'source'
            subprocess.run(['git','clone','--shared','--no-checkout',str(upstream),str(checkout)],check=True,capture_output=True)
            subprocess.run(['git','-C',str(checkout),'checkout','--detach',native.BASE],check=True,capture_output=True)
            self.assertGreaterEqual(shutil.disk_usage(upstream).free,8*1024**3)
            helper=PATH.with_name('restore-prismpm-candidate.py')
            snapshot=PATH.with_name('prismpm-native-candidate')
            result=subprocess.run(['python3',str(helper),str(snapshot),str(checkout)],check=True,capture_output=True)
            self.assertEqual(json.loads(result.stdout),{'diagnosticOnly':True,**native.snapshot_metadata(snapshot)})
            print('Authenticated restoration receipt: '+result.stdout.decode().strip())
            native.verify_source(checkout,clean=True)
            native.input_rows(checkout)
            for relative in native.INPUTS:
                path=checkout/relative;original=path.read_bytes();path.write_bytes(original+b'\n')
                with self.subTest(input=relative),self.assertRaisesRegex(ValueError,'captured Git object'):
                    native.input_rows(checkout)
                path.write_bytes(original)
            native.verify_source(checkout,clean=True)
            native.verify_changes(checkout,'amd64')
            self.assertGreaterEqual(shutil.disk_usage(upstream).free,8*1024**3)
        self.assertEqual(source_state(),before)


class GitInventoryControls(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.repo=Path(self.temp.name)
        self.git('init','-q');self.git('config','user.email','fixture@example.test');self.git('config','user.name','Fixture')
        (self.repo/'outside').write_text('original\n');self.record=self.repo/native.profile('amd64')/native.RECORDS[0];self.record.parent.mkdir(parents=True);self.record.write_text('record\n')
        self.git('add','.');self.git('commit','-qm','fixture')
    def git(self,*args):return subprocess.check_output(['git','-C',str(self.repo),*args])
    def test_selected_record_change_and_index_objects_unchanged(self):
        self.record.write_text('changed\n');before=(self.repo/'.git/index').read_bytes()
        native.verify_changes(self.repo,'amd64');self.assertEqual((self.repo/'.git/index').read_bytes(),before)
    def test_outside_to_record_staged_and_unstaged_rename(self):
        for staged in [False,True]:
            with self.subTest(staged=staged):
                self.git('reset','--hard','HEAD');self.record.unlink();(self.repo/'outside').rename(self.record)
                if staged:self.git('add','-A')
                before=(self.repo/'.git/index').read_bytes()
                with self.assertRaisesRegex(ValueError,'outside'):native.verify_changes(self.repo,'amd64')
                self.assertEqual((self.repo/'.git/index').read_bytes(),before)
    def test_cancelled_staged_outside_edits(self):
        (self.repo/'outside').write_text('changed\n');self.git('add','outside');(self.repo/'outside').write_text('original\n')
        with self.assertRaisesRegex(ValueError,'outside'):native.verify_changes(self.repo,'amd64')
    def test_real_game_checkout_identity_and_executed_bytes(self):
        root=self.repo
        script=root/'scripts/numeric/native-golden-preparation.py';script.parent.mkdir(parents=True);script.write_text('fixture helper\n')
        workflow=root/'.github/workflows/prismpm-backport-native-golden.yml';workflow.parent.mkdir(parents=True);workflow.write_text('fixture workflow\n')
        self.git('add','.');self.git('commit','-qm','game fixture')
        self.git('remote','add','origin','https://github.com/'+native.REPOSITORY)
        game={'sha':self.git('rev-parse','HEAD').decode().strip()}
        with patch.object(native,'__file__',str(script)):
            native.verify_game(game)
            with self.assertRaisesRegex(ValueError,'execution SHA'):native.verify_game({'sha':'0'*40})
            self.git('remote','set-url','origin','https://github.com/other/repo')
            with self.assertRaisesRegex(ValueError,'repository'):native.verify_game(game)
            self.git('remote','set-url','origin','https://github.com/'+native.REPOSITORY)
            for path in [script,workflow]:
                original=path.read_bytes();path.write_bytes(original+b'changed')
                with self.assertRaisesRegex(ValueError,'execution commit'):native.verify_game(game)
                path.write_bytes(original)

    def test_untracked_outside(self):
        (self.repo/'untracked').touch()
        with self.assertRaisesRegex(ValueError,'outside'):native.verify_changes(self.repo,'amd64')


if __name__=='__main__':unittest.main()
