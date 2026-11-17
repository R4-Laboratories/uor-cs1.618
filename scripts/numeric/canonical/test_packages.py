#!/usr/bin/env python3
"""Host harness controls; synthetic receipts never imply actual Prism acceptance."""
import hashlib
import json
import os
import tempfile
import tarfile
import copy
import subprocess
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
        if not os.environ.get('PRISMPM_READER_SOURCE'):
            reader_patch = mock.patch.object(p, 'source_reader', return_value={'scope':'mocked; game harness tests only'})
            reader_patch.start(); self.addCleanup(reader_patch.stop)

    def project(self, op='mul32'):
        project = self.root / 'projects' / op; project.mkdir(parents=True)
        (project / 'src').mkdir()
        for name in p.INPUTS['kernel_files']:
            (project / 'src' / Path(name).name).write_bytes((p.REPO / name).read_bytes())
        (project / 'lexlean.lock').write_text('synthetic unit-test lock; not verifier evidence')
        write(project / 'staging.json', {'operation':op})
        p.freeze(project)
        return project

    def accepted(self, op='mul32', runtime=False):
        project = self.project(op); evidence = self.root / 'operations' / op; evidence.mkdir(parents=True)
        if os.environ.get('PRISMPM_READER_SOURCE'):
            for path in p.READER['files']:
                target=self.root/'reader-source'/path;target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes((Path(os.environ['PRISMPM_READER_SOURCE'])/path).read_bytes())
        inventory_bytes=next(r['inventory_document'].encode() for r in json.loads((p.REPO/'prism/prismpm.lock').read_text())['platforms'] if r['platform']=='linux/amd64')
        inventory=json.loads(inventory_bytes);commands={r['command']:r for r in inventory['commands']}
        lean_actual=next(r['digest'][7:] for r in inventory['artifacts'] if r['id']=='lean')
        elan=commands['lean']['sha256'];rustup=commands['cargo']['sha256']
        # Original actual-SDK raw file capture (ci-44008985569), separate from
        # rustup/PATH Cargo; the focused provenance test below checks these bytes.
        cargo_actual='828980723df339d62434390e9fb8ef8831036583343ae2316b7ab5646b5c1953'
        tools={}
        for command in ('lean','lake','cargo'):
            row=commands[command];tools[command+'-launcher']={'path':'/usr/local/cargo/bin/cargo' if command=='cargo' else row['executable'],'resolved_path':row['executable'],'sha256':row['sha256']}
        for name,path,sha in [('lean','/usr/local/elan/toolchains/leanprover--lean4---v4.32.1/bin/lean',lean_actual),('cargo','/usr/local/rustup/toolchains/1.97.1-x86_64-unknown-linux-gnu/bin/cargo',cargo_actual)]:
            tools[name+'-actual']={'path':path,'resolved_path':path,'sha256':sha}
        (self.root/'native-inventory.json').write_bytes(inventory_bytes)
        (self.root/'original-files.sha256').write_text(''.join(r['sha256']+'  '+r['path']+'\n' for r in tools.values()))
        d = p.descriptor(op)
        roots = sorted([d['root'], d['acceptance_root']])
        model = {'library':{'profile':'prismpm/native-library/1','cargo_name':d['cargo_name'],'cargo_version':d['cargo_version'], 'export_roots':roots,'acceptance_roots':[d['acceptance_root']]}}
        model_id = hashlib.sha256(canonical(model)).hexdigest()
        artifact_data = {'model.prism.json':canonical(model)}
        names = ['BoundedNumeric.'+n for n in ['Bounds','Float','Foundation.Library.V1.Model','NumericPackage','Wide']]
        modules=[]; outputs=[]
        for name in names:
            local=name.replace('.','/')+'.lean'; data=b'import Init\n-- synthetic source-owned reader control, not a proof\n'
            row={'path':'modules/'+local,'kind':'lean','byte_length':len(data),'sha256':hashlib.sha256(data).hexdigest()}
            outputs.append(row);artifact_data['lexlean/build/'+row['path']]=data
            modules.append({'name':name,'source':{**{k:row[k] for k in ('byte_length','sha256')},'path':local},'imports':['Init'],'runtime':False,
                'artifacts':[{'path':'.lake/build/lib/lean/'+name.replace('.','/')+'.'+ext,'byte_length':1,'sha256':'c'*64} for ext in ['olean','olean.private','olean.server','ilean','ir']]})
        if runtime:
            # Authoritative pinned runtime metadata, synthetic project sources.
            registry=json.loads((Path(os.environ['PRISMPM_READER_SOURCE'])/'model/library-frontend-runtime.json').read_text())
            bounds=next(m for m in modules if m['name']=='BoundedNumeric.Bounds')
            data=b'import Init\nimport LexLeanRuntime.Laws\n-- synthetic reader control\n'
            bounds['source'].update(byte_length=len(data),sha256=hashlib.sha256(data).hexdigest());bounds['imports']=['Init','LexLeanRuntime.Laws']
            row=next(r for r in outputs if r['path'].endswith('/Bounds.lean'));row.update(byte_length=len(data),sha256=hashlib.sha256(data).hexdigest())
            artifact_data['lexlean/build/'+row['path']]=data
            for row in registry:
                if row['name'] in ('LexLeanRuntime.Laws','LexLeanRuntime.Collections','LexLeanRuntime.Portable'):
                    modules.append({**row,'runtime':True,'artifacts':[{'path':'.lake/build/lib/lean/'+row['name'].replace('.','/')+'.'+ext,'byte_length':1,'sha256':'c'*64} for ext in ['olean','olean.private','olean.server','ilean','ir']]})
            pending=modules;modules=[];done={'Init','Lean','Lean.Meta.Constructions.SparseCasesOn'}
            while pending:
                row=sorted((m for m in pending if all(n in done for n in m['imports'])),key=lambda m:m['name'])[0]
                modules.append(row);done.add(row['name']);pending=[m for m in pending if m['name']!=row['name']]
        lex={'outputs':outputs}; artifact_data['lexlean/build/manifest.json']=canonical(lex)
        artifact_data['lexlean/snapshot.json']=canonical({'modules':[{'lean_module':name,'declarations':[{'lean_name':'synthetic','axiom_policy':{'kind':'none','axioms':[]}}]} for name in names]})
        frontend={'schema':'prismpm/library-frontend/1','profile':'lean-frontend-lcnf/1','working_directory':'$LIBRARY_WORK','launcher_sha256':elan,'lean_sha256':lean_actual,'environment':{'LC_ALL':'C','LANG':'C','LEAN_PATH':'.lake/build/lib/lean','LEAN_NUM_THREADS':'2'},'modules':modules}
        plan={**frontend,'schema':'prismpm/library-frontend-plan/1'};del plan['lean_sha256'];del plan['launcher_sha256']
        plan['modules']=[{k:v for k,v in m.items() if k!='artifacts'} for m in modules]
        for name in ['coverage.json','kernel.ir','package/Cargo.lock','package/Cargo.toml','package/LICENSE-APACHE','package/LICENSE-MIT','package/README.md','package/generation-manifest.json','package/src/lib.rs',d['cargo_name']+'-'+d['cargo_version']+'.crate','roots.json']:
            artifact_data['library/'+name]=b'synthetic emitted test bytes'
        artifact_data['library/frontend.json']=canonical(plan)
        artifact_data['library/model-binding.json']=canonical({'acceptance_roots':[d['acceptance_root']],'export_roots':roots,'model_id':model_id,'profile':'prismpm/native-library/1','schema':'prismpm/library-build-binding/1','scope':'native-library-only'})
        file_rows=[{'path':name,'kind':'artifact','byte_length':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in sorted(artifact_data.items())]
        artifacts=[{k:r[k] for k in ('path','byte_length','sha256')} for r in file_rows if r['path'].startswith('library/')]
        inputs={'schema':'prismpm/build-inputs/3','lexlean_source_id':'a'*64,'lexlean_semantic_id':'b'*64,'lexlean_build_id':'9'*64,'model_id':model_id,'library_generator_sha256':p.READER['library_generator_sha256'],'library_artifacts_sha256':hashlib.sha256(canonical(file_rows)).hexdigest()}
        bid=hashlib.sha256(canonical(inputs)).hexdigest()
        build=project/'.prism/build'/bid;build.mkdir(parents=True)
        for name,data in artifact_data.items():
            target=build/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        write(build/'manifest.json',{'inputs':inputs,'files':file_rows})
        receipt={'schema':'prismpm/exporter-acquisition/2','mode':'source-backport','source_id':'numeric-task2c','compiler_revision':'2a13f942b04f0828e03c5d7db7e4db6ecb626d6e','archive_sha256':'6963efb98d5a67a54a5a969d520f0090218115f86da1dd573b789dc027fafb52','descriptor_sha256':'163fd02651d0c3e5116bdf1f0549b72d43ec849e66cd7d328b83cbec4fb70dc7','toolchain':'leanprover/lean4:v4.32.1','platform':'linux/amd64','inventory_sha256':p.NATIVE_INVENTORY,'sdk_lock_digest':'sha256:'+p.INPUTS['sdk_lock_sha256']}
        execution={'schema':'prismpm/exporter-execution/1','source_archive_sha256':receipt['archive_sha256'],'acquisition':receipt,'executable':{'sha256':'d'*64,'byte_length':1,'mode':0o755}}
        lean_version='Lean (version 4.32.1, x86_64-unknown-linux-gnu, commit f054605aea4b840552cca2e725580bffd1e1b704, Release)\n'
        def process(tool,argv,sha,stdout=''):
            return {'tool':tool,'argv':argv,'executable_sha256':sha if len(sha)==64 else sha*64,'exit_code':0,'stdout':stdout,'stderr':''}
        rows=[process('library-lean-version',['--version'],lean_actual,lean_version)]
        for module in modules:
            name=module['name'];stem='.lake/build/lib/lean/'+name.replace('.','/')
            rows.append(process('library-lean-frontend',['-j2','-R','.','-o',stem+'.olean','-i',stem+'.ilean',name.replace('.','/')+'.lean'],lean_actual))
        argv=['exe','prod-export']+[x for n in names for x in ['--module',n]]+[x for root in roots for x in ['--root',root]]+['--ir-module',d['cargo_name'].replace('-','_'),'--out','$LIBRARY_WORK/export']
        rows += [process('lean4-prod-build',['build','prod-export'],elan),{**process('prod-export',argv,elan),'exporter':execution},process('native-library-package',['package','--locked','--offline','--allow-dirty'],rustup)]
        phases=[{'phase':phase,'role':'library','model_sha256':model_id,'lexlean_manifest_sha256':hashlib.sha256(canonical(lex)).hexdigest(),'frontend':copy.deepcopy(frontend),'artifacts':copy.deepcopy(artifacts),'processes':copy.deepcopy(rows)} for phase in ['controller-build','replay']]
        att={'spec':'lexlean/attestation/2','status':'verified','build_id':inputs['lexlean_build_id'],'source_id':inputs['lexlean_source_id'],'semantic_id':inputs['lexlean_semantic_id'],'attestation_id':'8'*64,'declarations':[{'name':name+'.synthetic','policy':{'kind':'none','axioms':[]},'observed':[],'result':'ok'} for name in names]}
        acceptance={'schema':'prismpm/library-acceptance/1','build_id':bid,'model_id':model_id,'lexlean_attestation_id':att['attestation_id'],'scope':'native-library-only','status':'passed','regeneration':'byte-identical','executions':[{'mode':mode,'status':'passed','roots':[d['acceptance_root']]} for mode in ['std','no_std']],'export_roots':roots}
        processes=[process(tool,['--version'],elan if tool in ('lean-version','lake-version') else '2',lean_version if tool=='lean-version' else '') for tool in ['lean-version','lake-version','rustfmt-version','rustc-version','timeout-version']]+copy.deepcopy(rows)
        for mode in ['std','no_std']:
            processes += [process('native-library-'+mode+'-lock',[],'3'),process('native-library-'+mode+'-acceptance',[],'4',json.dumps({'roots':[d['acceptance_root']],'status':'passed'}))]
        manifest={'schema':'prismpm/library-verification-manifest/3','build_id':bid,'model_sha256':model_id,'scope':'native-library-only','acceptance_sha256':hashlib.sha256(canonical(acceptance)).hexdigest(),'lexlean_attestation_sha256':hashlib.sha256(canonical(att)).hexdigest(),'artifacts':artifacts,'processes':processes,'exporter_owner':{'schema':'prismpm/library-exporter-owner/2','phases':phases}}
        aid=hashlib.sha256(canonical(manifest)).hexdigest();verified=project/'.prism/verified'/aid;verified.mkdir(parents=True)
        write(verified/'manifest.json',manifest);write(verified/'library-acceptance.json',acceptance);write(verified/'lexlean-attestation.json',att)
        write(evidence/'build-result.json',{'schema':'prismpm/build-result/1','build_id':bid,'source_id':'a'*64,'semantic_id':'b'*64,'manifest_path':'.prism/build/'+bid+'/manifest.json','model_path':'.prism/build/'+bid+'/model.prism.json'})
        write(evidence/'verify-result.json',{'schema':'prismpm/verify-result/1','build_id':bid,'attestation_id':aid,'verified_root':'.prism/verified/'+aid})
        write(self.root/'native-tools.json',{'schema':'cs1618/numeric-native-tools/2','inventory_sha256':p.NATIVE_INVENTORY,'sdk_lock_sha256':p.INPUTS['sdk_lock_sha256'],'tools':tools})
        for phase in ['prepare','build','verify','select','controls']:(evidence/(phase+'.status')).write_text('0\n')
        write(evidence/'reader-controls.json',{'status':'completed-reader-controls-only','original_manifest_sha256':aid,'controls':[{'status':'refused'} for _ in range(15)],'unit-test':'synthetic retention labels only'})
        return project,evidence,build,verified

    def reseal(self, ev, verified, manifest):
        aid=write(verified/'manifest.json',manifest);new=verified.parent/aid
        if new != verified: verified.rename(new)
        value=json.loads((ev/'verify-result.json').read_text());value.update(attestation_id=aid,verified_root='.prism/verified/'+aid);write(ev/'verify-result.json',value)
        return new

    def test_original_sdk_launcher_actual_roles_and_independent_refusals(self):
        parent=self.root
        cases=('positive','preflight-actual','frontend-launcher','package-actual','swap-lean','swap-cargo',
               'changed-launcher','changed-actual','changed-original-measurement','changed-cargo-actual',
               'inventory-artifact','missing-role','old-schema','wrong-lock')
        for name in cases:
            with self.subTest(name=name):
                self.root=parent/name;self.root.mkdir()
                project,ev,build,verified=self.accepted()
                capture=json.loads((self.root/'native-tools.json').read_text());tools=capture['tools']
                m=json.loads((verified/'manifest.json').read_text())
                if name=='positive':
                    self.assertEqual(tools['lean-launcher']['sha256'],tools['lake-launcher']['sha256'])
                    self.assertNotEqual(tools['lean-actual']['sha256'],tools['lean-launcher']['sha256'])
                    self.assertNotEqual(tools['cargo-actual']['sha256'],tools['cargo-launcher']['sha256'])
                    p.selection(project,ev);continue
                if name=='preflight-actual':m['processes'][0]['executable_sha256']=tools['lean-actual']['sha256']
                elif name in ('frontend-launcher','package-actual'):
                    for phase in m['exporter_owner']['phases']:
                        if name=='frontend-launcher':
                            phase['frontend']['lean_sha256']=tools['lean-launcher']['sha256']
                            for row in phase['processes'][:len(phase['frontend']['modules'])+1]:row['executable_sha256']=tools['lean-launcher']['sha256']
                        else:phase['processes'][-1]['executable_sha256']=tools['cargo-actual']['sha256']
                    m['processes'][5:-4]=copy.deepcopy(m['exporter_owner']['phases'][1]['processes'])
                elif name in ('swap-lean','swap-cargo'):
                    tool=name[5:];tools[tool+'-launcher'],tools[tool+'-actual']=tools[tool+'-actual'],tools[tool+'-launcher']
                elif name in ('changed-launcher','changed-actual','changed-cargo-actual'):
                    role='cargo-actual' if name=='changed-cargo-actual' else 'lean-'+name[8:]
                    tools[role]['sha256']='f'*64
                elif name=='changed-original-measurement':
                    path=self.root/'original-files.sha256';path.write_text(path.read_text().replace(tools['lean-actual']['sha256'],'f'*64))
                elif name=='inventory-artifact':
                    path=self.root/'native-inventory.json';inventory=json.loads(path.read_text())
                    next(r for r in inventory['artifacts'] if r['id']=='lean')['digest']='sha256:'+'f'*64
                    write(path,inventory);capture['inventory_sha256']=p.digest(path)
                elif name=='missing-role':tools.pop('cargo-actual')
                elif name=='old-schema':capture['schema']='cs1618/numeric-native-tools/1'
                elif name=='wrong-lock':capture['sdk_lock_sha256']='f'*64
                write(self.root/'native-tools.json',capture);self.reseal(ev,verified,m)
                with self.assertRaises(ValueError):p.selection(project,ev)
        self.root=parent

    @unittest.skipUnless((p.REPO/'artifacts/numeric-task2c/ci-43999834837/14293331679/retained-reader-inputs.tar.gz').is_file(), 'preserved actual SDK reference artifacts required')
    def test_original_sdk_layout_provenance_from_actual_historical_records(self):
        project,ev,_,_=self.accepted();tools=p.native_tools(self.root)
        archive=p.REPO/'artifacts/numeric-task2c/ci-43999834837/14293331679/retained-reader-inputs.tar.gz'
        self.assertEqual(p.digest(archive),'01628c3ad261b8de86cb6bd4037cb9fd0ab39bd118d91a1de5e55b0e76a9fe23')
        aid='6e66531b8c58c603a37c94243a7b83a8358711f34f150a37b2e5be0a4f6688b6'
        with tarfile.open(archive) as original:
            raw=original.extractfile('projects/default/.prism/verified/'+aid+'/manifest.json').read()
            self.assertEqual(hashlib.sha256(raw).hexdigest(),aid);manifest=json.loads(raw)
        for command in ('lean','lake'):
            row=next(r for r in manifest['processes'] if r['tool']==command+'-version')
            self.assertEqual(row['executable_sha256'],tools[command+'-launcher']['sha256'])
        packages=[r for r in manifest['processes'] if r['tool'].startswith('application-package-')]
        self.assertEqual(len(packages),2)
        self.assertTrue(all(r['executable_sha256']==tools['cargo-launcher']['sha256'] for r in packages))
        small_archive=p.REPO/'artifacts/numeric-task2c/ci-44008985569/canonical-small-logs.tar.gz'
        self.assertEqual(p.digest(small_archive),'cc23e217327abc1c1e83fea121a898f3aa33a8ea244496378dd0968f95dd0e2c')
        with tarfile.open(small_archive) as original:
            hashes=dict((line.split('  ',1)[1],line.split('  ',1)[0]) for line in original.extractfile('original-files.sha256').read().decode().splitlines())
        for tool in ('lean-actual','cargo-actual'):
            self.assertEqual(hashes[tools[tool]['path']],tools[tool]['sha256'])
        # Historical actual command/file identities only; accepted() remains
        # synthetic current evidence, never a new actual SDK verification.

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
        (build/'library/kernel.ir').write_bytes(b'changed output')
        with self.assertRaisesRegex(ValueError,'changed build closure'): p.selection(project,ev)
        value=json.loads((ev/'verify-result.json').read_text()); value['verified_root']='../../wrong';write(ev/'verify-result.json',value)
        with self.assertRaisesRegex(ValueError,'selection mismatch'): p.selection(project,ev)

    def test_manifest_and_acceptance_mutations_are_refused(self):
        project,ev,_,verified=self.accepted()
        value=json.loads((verified/'manifest.json').read_text());value['exporter_owner']['phases'][0]['processes'][-2]['exporter']['acquisition']['mode']='sdk-seed';write(verified/'manifest.json',value)
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
                        for phase in m['exporter_owner']['phases']:phase['processes'][-2]['exporter']['acquisition']['archive_sha256']='e'*64
                    else:
                        m['exporter_owner']['phases'][1]['processes'][-2]['exporter']['executable']['sha256']='e'*64
                    if mutation == 'archive': m['processes'][5:5+len(m['exporter_owner']['phases'][1]['processes'])]=copy.deepcopy(m['exporter_owner']['phases'][1]['processes'])
                    aid=write(verified/'manifest.json',m); new=verified.parent/aid;verified.rename(new)
                    v=json.loads((ev/'verify-result.json').read_text());v['attestation_id']=aid;v['verified_root']='.prism/verified/'+aid;write(ev/'verify-result.json',v)
                with self.assertRaisesRegex(ValueError,pattern):p.selection(project,ev)
        self.root = parent

    def test_dynamic_phase_profile_tool_module_order_plan_and_artifact_controls(self):
        mutations = {
            'profile': lambda m: m['exporter_owner']['phases'][0]['frontend'].update(profile='lake/legacy'),
            'tool': lambda m: m['exporter_owner']['phases'][0]['frontend'].update(lean_sha256='f'*64),
            'environment': lambda m: m['exporter_owner']['phases'][0]['frontend']['environment'].update(HOME='/tmp/reuse'),
            'order': lambda m: m['exporter_owner']['phases'].reverse(),
            'role': lambda m: m['exporter_owner']['phases'][0].update(role='application'),
            'missing-module': lambda m: m['exporter_owner']['phases'][0]['frontend']['modules'].pop(),
            'missing-artifact': lambda m: m['artifacts'].pop(),
            'missing-companion': lambda m: m['exporter_owner']['phases'][0]['frontend']['modules'][0]['artifacts'].pop(),
            'replay-window': lambda m: m['processes'].pop(6),
            'frontend-plan': lambda m: m['exporter_owner']['phases'][1]['frontend']['modules'][0]['source'].update(sha256='f'*64),
        }
        parent=self.root
        for name,mutate in mutations.items():
            with self.subTest(name=name):
                self.root=parent/name;self.root.mkdir()
                project,ev,build,verified=self.accepted()
                m=json.loads((verified/'manifest.json').read_text());mutate(m);self.reseal(ev,verified,m)
                with self.assertRaises(ValueError): p.selection(project,ev)
        self.root=parent

    @unittest.skipUnless(os.environ.get('PRISMPM_READER_SOURCE'), 'actual reviewed source reader required')
    def test_coherent_mutations_reach_source_owned_reader(self):
        parent=self.root
        for mutation in ('profile','environment','missing-companion','module-order','missing-Bounds','source-plan'):
            with self.subTest(mutation=mutation):
                self.root=parent/mutation;self.root.mkdir()
                project,ev,build,verified=self.accepted();m=json.loads((verified/'manifest.json').read_text())
                for phase in m['exporter_owner']['phases']:
                    f=phase['frontend']
                    if mutation=='profile': f['profile']='legacy'
                    elif mutation=='environment': f['environment']['HOME']='/tmp/reused'
                    elif mutation=='missing-companion': f['modules'][0]['artifacts'].pop()
                    elif mutation=='module-order':
                        f['modules'][0],f['modules'][1]=f['modules'][1],f['modules'][0]
                        phase['processes'][1],phase['processes'][2]=phase['processes'][2],phase['processes'][1]
                    elif mutation=='missing-Bounds': f['modules'].pop(0);phase['processes'].pop(1)
                    else: f['modules'][0]['source']['sha256']='f'*64
                m['processes'][5:-4]=copy.deepcopy(m['exporter_owner']['phases'][1]['processes'])
                verified=self.reseal(ev,verified,m)
                # These mutate both phase copies plus the top-level window;
                # the game owner gate alone intentionally cannot attest sources.
                p.frontend_owner(m,build,project,ev,p.descriptor('mul32'))
                with self.assertRaisesRegex(ValueError,'source-owned frontend reader refusal'):
                    p.source_reader(project,ev,build,verified)
                record=json.loads((ev/'frontend-reader-invocation.json').read_text())
                self.assertNotEqual(record['exit_code'],0);self.assertEqual(record['reader'],p.READER)
        self.root=parent

    @unittest.skipUnless(os.environ.get('PRISMPM_READER_SOURCE'), 'actual reviewed source reader required')
    def test_prepared_post_cli_controls_with_synthetic_full_runtime_bundle(self):
        project,ev,_,_=self.accepted(runtime=True)
        baseline=p.selection(project,ev)
        report=p.controls(project,ev)
        self.assertEqual(report['status'],'completed-reader-controls-only')
        self.assertEqual(len(report['controls']),15)
        self.assertEqual({r['refusal_owner'] for r in report['controls']},{'game-harness','source-owned-frontend-reader'})
        self.assertEqual(p.selection(project,ev),baseline)
        self.assertEqual(next(r for r in report['controls'] if r['name']=='missing-runtime')['refusal_owner'],'source-owned-frontend-reader')

    @unittest.skipUnless(os.environ.get('PRISMPM_READER_SOURCE'), 'actual reviewed source reader required')
    def test_retained_reader_closure_tampering_is_game_custody_refusal(self):
        project,ev,_,_=self.accepted();p.selection(project,ev)
        path=self.root/'reader-source/model/library-frontend-runtime.json';path.write_bytes(path.read_bytes()+b' ')
        with self.assertRaisesRegex(ValueError,'retained reader source closure mismatch'):
            p.selection(project,ev)

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

    def test_exact_acceptance_and_none_library_audits_refuse_policy_observed_changes(self):
        build=self.root/'build';verified=self.root/'verified';build.mkdir();verified.mkdir()
        prefix='BoundedNumeric.NumericPackage.';exact={'kind':'exact','axioms':['Quot.sound','propext']};none={'kind':'none','axioms':[]}
        snapshot={'modules':[{'lean_module':prefix[:-1],'declarations':[{'lean_name':'acceptance','axiom_policy':exact},{'lean_name':'numericLibrary','axiom_policy':none}]}]}
        inputs={'lexlean_build_id':'1'*64,'lexlean_source_id':'2'*64,'lexlean_semantic_id':'3'*64}
        att={'spec':'lexlean/attestation/2','status':'verified','build_id':inputs['lexlean_build_id'],'source_id':inputs['lexlean_source_id'],'semantic_id':inputs['lexlean_semantic_id'],'attestation_id':'4'*64,'declarations':[{'name':prefix+'acceptance','policy':exact,'observed':['Quot.sound','propext'],'result':'ok'},{'name':prefix+'numericLibrary','policy':none,'observed':[],'result':'ok'}]}
        acceptance={'lexlean_attestation_id':att['attestation_id']}
        write(build/'lexlean/snapshot.json',snapshot);write(verified/'lexlean-attestation.json',att)
        p.audit_bindings(build,verified,inputs,acceptance)
        for case in ('omitted','wrong-exact','missing-observed','extra-observed','policy-binding','library-observed'):
            with self.subTest(case=case):
                snap=copy.deepcopy(snapshot);audit=copy.deepcopy(att)
                if case in ('omitted','wrong-exact'):
                    policy=none if case=='omitted' else {'kind':'exact','axioms':['Quot.sound']}
                    snap['modules'][0]['declarations'][0]['axiom_policy']=policy;audit['declarations'][0]['policy']=policy
                elif case=='missing-observed':audit['declarations'][0]['observed']=['Quot.sound']
                elif case=='extra-observed':audit['declarations'][0]['observed']=['Classical.choice','Quot.sound','propext']
                elif case=='policy-binding':audit['declarations'][0]['policy']=none
                else:audit['declarations'][1]['observed']=['Quot.sound']
                write(build/'lexlean/snapshot.json',snap);write(verified/'lexlean-attestation.json',audit)
                with self.assertRaises(ValueError):p.audit_bindings(build,verified,inputs,acceptance)
        # Explicitly synthetic audit fixtures; no newly verified receipt is claimed.

    @unittest.skipUnless(os.environ.get('LEXLEAN_BIN') and os.environ.get('PRISMPM_SOURCE'), 'real LexLean and pinned source fixture required')
    def test_real_lexlean_acceptance_policy_formatter_parser_and_check(self):
        lex=str(Path(os.environ['LEXLEAN_BIN']).resolve());out=self.root/'staged';p.stage(Path(os.environ['PRISMPM_SOURCE']),out)
        records=[]
        def run(project,*args,success=True):
            argv=[lex,'--diagnostic-format','json',*args];r=subprocess.run(argv,cwd=project,capture_output=True,timeout=30)
            records.append({'argv':argv,'cwd':str(project),'exit_code':r.returncode,'stdout':r.stdout.decode(),'stderr':r.stderr.decode()})
            evidence=os.environ.get('NUMERIC_FOLLOWUP_EVIDENCE')
            if evidence:write(Path(evidence)/'lexlean-policy-commands.json',records)
            if success:self.assertEqual(r.returncode,0,r.stdout.decode()+r.stderr.decode())
            return json.loads(r.stdout) if success else r
        for op in p.OPS:
            with self.subTest(operation=op):
                project=out/op;path=project/'src/NumericPackage.lex.tex';authored=path.read_text()
                for args in (('lock',),('fmt',),('lock',),('fmt','--check'),('lock','--check')):run(project,*args)
                baseline=run(project,'check');canonical_source=path.read_text()
                self.assertIn('axioms: [Quot.sound, propext]',canonical_source.split('name: numericLibrary')[0])
                p.freeze(project);p.check(project)
                def checked_variant(source):
                    path.write_text(source);run(project,'fmt');run(project,'fmt','--check');return run(project,'check')
                library_none=checked_variant(authored.replace('name: numericLibrary, parameters: [],','name: numericLibrary, parameters: [], axioms: [],'))
                self.assertEqual(library_none['semantic_id'],baseline['semantic_id'])
                omitted=checked_variant(authored.replace('axioms: [Quot.sound, propext], ',''))
                self.assertNotEqual(omitted['semantic_id'],baseline['semantic_id'])
                explicit_none=checked_variant(authored.replace('axioms: [Quot.sound, propext]','axioms: []'))
                self.assertEqual(explicit_none['semantic_id'],omitted['semantic_id'])
                wrong=checked_variant(authored.replace('axioms: [Quot.sound, propext]','axioms: [Quot.sound]'))
                self.assertNotEqual(wrong['semantic_id'],baseline['semantic_id'])
                path.write_text(authored.replace('axioms: [Quot.sound, propext]','axioms: [17]'))
                self.assertNotEqual(run(project,'check',success=False).returncode,0,'invalid axiom syntax must fail the real parser')
                path.write_text(canonical_source);run(project,'fmt','--check');run(project,'lock','--check');p.check(project)
                for name,want in p.INPUTS['kernel_files'].items():self.assertEqual(p.digest(project/'src'/Path(name).name),want)
        # Well-formed wrong policies can parse/check; exact observed-set refusal
        # belongs to unchanged audit_bindings and actual SDK verification.

    @unittest.skipUnless(os.environ.get('PRISMPM_SOURCE'),'set PRISMPM_SOURCE for actual pinned fixture staging test')
    def test_actual_fixture_stage_is_deterministic_single_source_and_pinned(self):
        source=Path(os.environ['PRISMPM_SOURCE']);a=self.root/'a';b=self.root/'b';p.stage(source,a);p.stage(source,b)
        manifest=lambda root:{str(f.relative_to(root)):p.digest(f) for f in p.files(root)}
        self.assertEqual(manifest(a),manifest(b))
        for op in p.OPS:
            for name,want in p.INPUTS['kernel_files'].items():self.assertEqual(p.digest(a/op/'src'/Path(name).name),want)
        with self.assertRaisesRegex(ValueError,'already exists'):p.stage(source,a)

if __name__=='__main__':unittest.main()
