"""Component checks only; these never qualify a Docker daemon or SDK."""
import importlib.util
import hashlib
import pathlib
import unittest
import os
import tempfile
import copy
import json
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('capture_probe', ROOT / 'candidate-capture-probe.py')
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

class ProbeContract(unittest.TestCase):
    def invocation(self, mode='readonly-qualification-v1'):
        code = (ROOT / 'candidate-capture-probe.py').read_text()
        return ['/usr/bin/python3', '-I', '-B', '-c', code, mode, '1980', 'a'*64,
                '10', probe.UTILITY_SHA256, '11', 'b'*64]

    def test_exact_actual_code_and_capsule_binding(self):
        argv = self.invocation()
        value = probe.parse_invocation(argv, ['-c'] + argv[5:])
        self.assertEqual(value['probe_sha256'], hashlib.sha256(argv[4].encode()).hexdigest())
        self.assertEqual(value['capsules'], [{'bytes':10, 'sha256':probe.UTILITY_SHA256}, {'bytes':11, 'sha256':'b'*64}])
        self.assertLessEqual(len(argv[4].encode()), 32768)

    def test_closed_mode_argv_deadline_and_capsules(self):
        for index, replacement in [(0,'python3'),(1,'-B'),(4,'x'*32769),(4,'x\0'),
                (5,'execute-v1'),(6,'0'),(6,'1981'),(6,'01'),(7,'z'*64),
                (8,'1048577'),(9,'0'*64),(10,'-1'),(11,'Z'*64)]:
            argv=self.invocation(); argv[index]=replacement
            with self.subTest(index=index,replacement=str(replacement)[:24]):
                with self.assertRaises(ValueError): probe.parse_invocation(argv,['-c']+argv[5:])
        argv=self.invocation()
        for changed in [argv+['extra'],argv[:-1]]:
            with self.assertRaises(ValueError):probe.parse_invocation(changed,['-c']+changed[5:])
        with self.assertRaises(ValueError):probe.parse_invocation(argv,['-c']+argv[5:]+['extra'])

    def test_attachment_is_separate_noncompletion_mode(self):
        argv=self.invocation('attachment-qualification-v1')
        self.assertEqual(probe.parse_invocation(argv,['-c']+argv[5:])['mode'],'attachment-qualification-v1')

    def test_sdk_environment_is_actual_and_closed(self):
        for version,uid,gid,isolated,no_bytecode,environment in [
                ((3,12,2),1000,1000,1,True,probe.SDK_IMAGE),
                ((3,12,3),0,1000,1,True,probe.SDK_IMAGE),
                ((3,12,3),1000,0,1,True,probe.SDK_IMAGE),
                ((3,12,3),1000,1000,0,True,probe.SDK_IMAGE),
                ((3,12,3),1000,1000,1,False,probe.SDK_IMAGE),
                ((3,12,3),1000,1000,1,True,'other')]:
            with self.assertRaises(ValueError):probe.require_runtime(version,uid,gid,isolated,no_bytecode,environment)
        probe.require_runtime((3,12,3),1000,1000,1,True,probe.SDK_IMAGE)

class RealFileProbeControls(unittest.TestCase):
    def test_regular_refuses_aliases_links_and_oversize(self):
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory); path=root/'input'; path.write_bytes(b'held bytes')
            self.assertEqual(probe.regular(path,10),b'held bytes')
            with self.assertRaises(ValueError):probe.regular(path,9)
            alias=root/'alias';alias.symlink_to(path)
            with self.assertRaises(ValueError):probe.regular(alias,10)
            os.link(path,root/'hardlink')
            with self.assertRaises(ValueError):probe.regular(path,10)

    def test_real_writable_operations_never_qualify(self):
        with tempfile.TemporaryDirectory() as directory:
            path=pathlib.Path(directory)/'input';path.write_bytes(b'held bytes')
            for operation in probe.OPERATIONS:
                with self.subTest(operation=operation):
                    with self.assertRaisesRegex(ValueError,'unexpectedly succeeded'):
                        probe.refuse_mutation(path,operation)
                    self.assertEqual(path.read_bytes(),b'held bytes')
                    self.assertEqual(sorted(x.name for x in path.parent.iterdir()),['input'])

    def test_path_inventory_comes_from_descriptor_not_surviving_files(self):
        authority=tuple('scripts/'+str(i) for i in range(6))
        descriptor={'source_root':'/workspaces/prismpm','union':[{'kind':'file','path':'Cargo.toml'}]}
        paths=probe.mutation_paths(descriptor,authority)
        self.assertEqual(len(paths),19)
        self.assertEqual(paths[:7],[pathlib.Path('/candidate-input/candidate-source')/x for x in ('Cargo.toml',*authority)])
        self.assertEqual(paths[7:14],[pathlib.Path('/workspaces/prismpm')/x for x in ('Cargo.toml',*authority)])
        self.assertEqual(str(paths[-1]),'/candidate-input/candidate-transfer-manifest.json')

class DriverContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec=importlib.util.spec_from_file_location('qualification_driver',ROOT/'candidate-capture-qualification.py')
        cls.driver=importlib.util.module_from_spec(spec);spec.loader.exec_module(cls.driver)

    def test_closed_schedule_preserves_all_remaining_budgets(self):
        d=self.driver
        self.assertEqual(d.required_seconds('setup'),21600)
        self.assertEqual(d.required_seconds('Q1'),18900)
        self.assertEqual(d.required_seconds('Q6'),6900)
        self.assertEqual(d.required_seconds('oc10'),4500)
        self.assertEqual(d.required_seconds('collect'),600)
        for phase in ['Q0','Q7','retry','capture']:
            with self.assertRaises(ValueError):d.required_seconds(phase)
        with self.assertRaises(ValueError):d.admit_phase('Q1',21600,2701)
        d.admit_phase('Q1',21600,2700)

    def test_truncated_or_duplicate_records_are_never_admitted(self):
        d=self.driver
        for body in [b'{"a":1}',b'{"a":1,"a":2}\n',b'{"a":1}\n{}\n',b'{']:
            with self.assertRaises((ValueError,UnicodeError)):d.decode(body)
        self.assertEqual(d.decode(b'{"a":1}\n'),{'a':1})
        with self.assertRaises(ValueError):d.closed({'a':1,'extra':2},'a')

    def test_real_files_reject_alias_hardlink_and_truncation(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory);p=root/'file';p.write_bytes(b'original')
            ref=d.reference(p);p.write_bytes(b'orig')
            with self.assertRaises(ValueError):d.verify_reference(ref)
            p.write_bytes(b'original');alias=root/'alias';alias.symlink_to(p)
            with self.assertRaises(ValueError):d.regular(alias)
            os.link(p,root/'link')
            with self.assertRaises(ValueError):d.regular(p)

class EvidenceBoundaryControls(unittest.TestCase):
    setUpClass = DriverContracts.__dict__['setUpClass']
    def test_actual_original_summary_requires_full_untruncated_numeric_result(self):
        d=self.driver
        out=b'test conformance_oc_10 ... ok\n\ntest result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 99 filtered out; finished in 1s\n'
        summary={'scope':'node-owner-diagnostic-not-acceptance','owner':'OC-10','elapsed_ms':25,'files':2,'tests':67}
        err=b'# prismpm-node-owner-diagnostic '+json.dumps(summary).encode()+b'\n'
        self.assertEqual(d.validate_oc10_streams(out,err),summary)
        for bad in [b'',err[:-8],err+err,err.replace(b'67',b'66'),err.replace(b'"files": 2',b'"files": 1')]:
            with self.assertRaises((ValueError,KeyError)):d.validate_oc10_streams(out,bad)
        with self.assertRaises(ValueError):d.validate_oc10_streams(out.split(b'test result:')[0],err)

    def test_typed_registry_real_files_missing_alias_stale_and_cross_kind(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as temporary, tempfile.TemporaryDirectory(prefix='prismpm-publication-capture-') as work:
            source=pathlib.Path(temporary);module=source/'tests/publication-context-linkage/capture-owner.mjs'
            module.parent.mkdir(parents=True);module.write_bytes(b'component owner bytes')
            registry=source/'target/conditional-publication-capture-locators';registry.mkdir(parents=True,mode=0o700)
            name=pathlib.Path(work).name
            value={'schema':'prismpm/private-publication-capture-locator/1','complete':False,'accepted':False,
                   'work_basename':name,'work_path':work,'source_root':str(source),'owner_module_sha256':hashlib.sha256(module.read_bytes()).hexdigest()}
            path=registry/(name+'.json');d.write(path,value)
            self.assertEqual(d.locators('capture',source)[0][1],value)
            for key,bad in [('schema','prismpm/private-publication-linkage-locator/1'),('complete',True),('accepted',True),
                            ('source_root',str(source.parent)),('work_path','/tmp/other'),('owner_module_sha256','0'*64),('extra',True)]:
                changed={**value,key:bad};d.write(path,changed,replace=True)
                with self.subTest(key=key),self.assertRaises(ValueError):d.locators('capture',source)
            d.write(path,value,replace=True);os.chmod(path,0o600)
            with self.assertRaises(ValueError):d.locators('capture',source)
            os.chmod(path,0o400);alias=registry/(name+'x.json');os.link(path,alias)
            with self.assertRaises(ValueError):d.locators('capture',source)
            alias.unlink();original=path.read_bytes();path.unlink();outside=source/'outside';outside.write_bytes(original);path.symlink_to(outside)
            with self.assertRaises(ValueError):d.locators('capture',source)

    def test_registry_count_bound_is_checked_before_arbitrary_discovery(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as temporary:
            source=pathlib.Path(temporary);registry=source/'target/conditional-publication-linkage-locators'
            registry.mkdir(parents=True,mode=0o700)
            for index in range(257):(registry/str(index)).write_bytes(b'')
            with self.assertRaisesRegex(ValueError,'count bound'):d.locators('linkage',source)

    def scenario(self,root,id):
        d=self.driver;token='a'*32;positive=id in ('Q1','Q2')
        file=root/'observation';file.write_bytes(b'component policy observation; not a daemon transcript')
        ref=d.reference(file);actors=['inspect','stage']+(['execute'] if id in ('Q1','Q2','Q6') else [])+(['qualification-writer'] if id=='Q3' else [])
        return {'schema':'cs1618/candidate-capture-scenario/1','id':id,'status':'qualified' if positive else 'expected-refusal',
            'scope':'actual-daemon-qualification-only','complete_application_accepted':False,'preparation_sha256':'b'*64,
            'subject_sha256':'c'*64,'owner_token':token,'descriptor_sha256':'d'*64,'probe':ref if positive else None,
            'observations':[{'role':'daemon','kind':'stdout',**ref}],
            'fault':{'kind':d.FAULTS[id],'observed_refusal':not positive,'execution_created':id in ('Q1','Q2','Q6')},
            'retirement':{'actors':[{'role':role,'name':'prismpm-candidate-'+token+'-'+role,'id':format(index+1,'064x'),'absent':True} for index,role in enumerate(actors)],
                'volumes':[{'role':role,'name':'prismpm-candidate-'+token+'-'+role,'absent':positive} for role in ['input']+(['work'] if id in ('Q1','Q2','Q6') else [])],
                'cleanup_daemon_calls':d.LEDGER[id],'attachment_waits':0 if id=='Q5' else 2 if id in ('Q1','Q2','Q6') else 1,'uncertain':False}}

    def test_all_six_closed_outcomes_refuse_unknown_ownership_missing_endpoints_and_overbudget(self):
        d=self.driver
        for id in d.SCENARIOS:
            with tempfile.TemporaryDirectory() as temporary:
                root=pathlib.Path(temporary);value=self.scenario(root,id)
                d.validate_scenario(value,id,'b'*64,'c'*64)
                variants=[]
                for key,bad in [('uncertain',True),('cleanup_daemon_calls',d.LEDGER[id]+1),('attachment_waits',3)]:
                    changed=copy.deepcopy(value);changed['retirement'][key]=bad;variants.append(changed)
                changed=copy.deepcopy(value);changed['retirement']['actors'][-1]['id']=None;variants.append(changed)
                changed=copy.deepcopy(value);changed['retirement']['actors'].pop();variants.append(changed)
                changed=copy.deepcopy(value);changed['retirement']['volumes'].pop();variants.append(changed)
                changed=copy.deepcopy(value);changed['fault']['execution_created']=not changed['fault']['execution_created'];variants.append(changed)
                changed=copy.deepcopy(value);changed['status']='completed';variants.append(changed)
                for changed in variants:
                    with self.subTest(id=id,changed=changed),self.assertRaises(ValueError):d.validate_scenario(changed,id,'b'*64,'c'*64)
                (root/'observation').write_bytes(b'truncated')
                with self.assertRaises(ValueError):d.validate_scenario(value,id,'b'*64,'c'*64)

    def test_uncertain_retirement_never_satisfies_negative_qualification(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as temporary:
            value=self.scenario(pathlib.Path(temporary),'Q5');value['retirement']['uncertain']=True
            with self.assertRaises(ValueError):d.validate_scenario(value,'Q5','b'*64,'c'*64)

    def test_archive_preserves_real_direct_alias_and_refuses_missing_or_added_member(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary);source=root/'source';source.mkdir(mode=0o700)
            (source/'directory').mkdir();(source/'directory/file').write_bytes(b'original source')
            (source/'alias').symlink_to('directory',target_is_directory=True)
            records=d.measure_tree(source);store=d.Store(root/'retained')
            row=store.archive(source,records,'source.tar')
            import tarfile
            with tarfile.open(store.root/row['path']) as archive:
                self.assertTrue(archive.getmember('alias').issym());self.assertEqual(archive.getmember('alias').linkname,'directory')
                self.assertEqual(archive.extractfile('directory/file').read(),b'original source')
            (source/'extra').write_bytes(b'omitted')
            with self.assertRaises(ValueError):store.archive(source,records,'changed.tar')
            (source/'extra').unlink();(source/'directory/file').unlink()
            with self.assertRaises(ValueError):store.archive(source,records,'missing.tar')

    def test_artifact_overflow_and_local_copy_accounting(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary);source=root/'original';source.write_bytes(b'0123456789')
            store=d.Store(root/'retained')
            with patch.object(d,'MAX_TOTAL',19),patch.object(d,'MAX_METADATA',10):
                with self.assertRaises(ValueError):store.add(source,'overflow')
            self.assertEqual(list(store.root.iterdir()),[])
        floor=8*1024**3
        self.assertTrue(d.admit_local_download(floor+60,10,20,30))
        with self.assertRaises(ValueError):d.admit_local_download(floor+59,10,20,30)
        with self.assertRaises(ValueError):d.admit_local_download(floor,False,0,0)

    def compiler_fixture(self,work):
        d=self.driver
        compiler={'scope':'fresh-owner-scoped-compiler-tools','family':'publication-linkage','work':str(work),'inputs':{}}
        for role,original,private in [('driver','driver-target/debug/publication-context-linkage-driver','driver-execution'),
                                       ('exporter','exporter/.lake/build/bin/prod-export','exporter-execution/prod-export')]:
            path=work/private;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(b'component private compiler bytes');os.chmod(path,0o500)
            info=path.stat();row={'path':private,'device':str(info.st_dev),'inode':str(info.st_ino),'uid':str(info.st_uid),'gid':str(info.st_gid),
                  'mode':info.st_mode,'links':str(info.st_nlink),'size':info.st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
            compiler[role]={'original':{**row,'path':original},'private':row}
        identity=hashlib.sha256(json.dumps(compiler,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
        d.write(work/'compiler-owner-retirement-intent.json',{'status':'requested','compiler':identity})
        d.write(work/'compiler-owner-retirement.json',{'scope':'completed-owner-compiler-caches','status':'retired','compiler':identity})
        return compiler

    def test_original_cache_retirement_requires_both_receipts_and_each_surviving_copy(self):
        d=self.driver
        for missing in [None,'compiler-owner-retirement-intent.json','compiler-owner-retirement.json','driver-execution','exporter-execution/prod-export']:
            with tempfile.TemporaryDirectory(prefix='prismpm-compiler-owner-') as temporary, tempfile.TemporaryDirectory() as retained:
                work=pathlib.Path(temporary);compiler=self.compiler_fixture(work);store=d.Store(pathlib.Path(retained)/'raw')
                if missing:(work/missing).unlink()
                if missing:
                    with self.assertRaises((ValueError,FileNotFoundError)):d.collect_retired_compiler(store,compiler)
                else:
                    d.collect_retired_compiler(store,compiler)
                    self.assertEqual(len(store.files),4)
                    retired=[row for row in store.mapping if row.get('disposition')=='original-reconstructible-cache-retired']
                    self.assertEqual(len(retired),2)
                    self.assertTrue(all(row['retirement']=='oc10/compiler/compiler-owner-retirement.json' for row in retired))

    def test_no_ambient_route_build_profile_or_tool_override(self):
        d=self.driver;d.reject_environment({'PATH':'ordinary','CARGO_NET_OFFLINE':'true'})
        for name in ['PRISMPM_OC10_CAPTURE_ROUTE','PRISMPM_OC10_SDK_CHILD','PRISMPM_OC10_CAPTURE_OUTPUT',
                     'CARGO_BUILD_JOBS','CARGO_BUILD_RUSTFLAGS','CARGO_PROFILE_DEV_DEBUG','RUSTFLAGS','NODE_OPTIONS']:
            with self.subTest(name=name),self.assertRaises(ValueError):d.reject_environment({name:'forbidden'})

    def test_fresh_subject_requires_actual_cargo_root_inode_listing_and_elf_joins(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary);source=root/'source';source.mkdir();home=source/'target/candidate-qualification-driver'
            work=home/'subjects/Q1';work.mkdir(parents=True,mode=0o700)
            original=work/'publication-capture-built-tests';execution=work/'publication-capture-execution'
            for path in (original,execution):path.write_bytes(b'\x7fELFcomponent-only');os.chmod(path,0o500)
            artifact={**d.reference(original),'manifest_path':str(source/'crates/prismpm/Cargo.toml'),'dev':str(original.stat().st_dev),'ino':str(original.stat().st_ino),'fresh':False}
            owned={**d.reference(execution),'dev':str(execution.stat().st_dev),'ino':str(execution.stat().st_ino),'mode':execution.stat().st_mode}
            exact='oci::publication_context::capture_tests::actual_source_free_capture_constructs_complete_conditional_context'
            listing=work/'listing.txt';listing.write_text(exact+': test\nother: test\n')
            cargo={'reason':'compiler-artifact','target':{'name':'prismpm','kind':['lib'],'src_path':str(source/'crates/prismpm/src/lib.rs')},
                   'profile':{'test':True},'executable':str(work/'cargo-target/debug/deps/prismpm-original'),'fresh':False,'manifest_path':artifact['manifest_path']}
            cargo_path=work/'cargo.jsonl';cargo_path.write_text(json.dumps(cargo)+'\n')
            d.write(work/'relocation.json',{'emitted':cargo['executable'],'retained':str(original),'dev':artifact['dev'],'ino':artifact['ino'],'sha256':artifact['sha256']})
            subject={'schema':'cs1618/candidate-capture-subject/1','root_kind':'tracked','source_root':str(source),'source_sha256':'a'*64,'union_sha256':'b'*64,
                     'cargo_output':d.reference(cargo_path),'artifact':artifact,'execution':owned,'listing':{**d.reference(listing),'test_count':2,'exact_test':exact}}
            build={'id':'Q1','root':str(source),'work':str(work),'cargo_output':subject['cargo_output'],'artifact':artifact,'execution':owned,'listing':d.reference(listing),'source_inventory':{}}
            plan={'source_root':str(source),'source_selection':'tracked','source_sha256':'a'*64,'union_sha256':'b'*64,
                  'executable_sha256':owned['sha256'],'executable_bytes':owned['bytes'],'listing_sha256':subject['listing']['sha256'],'test_count':2}
            with patch.object(d,'SOURCE',source),patch.object(d,'HOME',home):
                d.validate_subject(subject,build,plan,'Q1')
                for field,bad in [('fresh',True),('manifest_path',str(root/'wrong/Cargo.toml')),('ino','0')]:
                    changed=copy.deepcopy(subject);changed['artifact'][field]=bad
                    with self.subTest(field=field),self.assertRaises(ValueError):d.validate_subject(changed,build,plan,'Q1')
                changed=copy.deepcopy(subject);changed['listing']['test_count']=1
                with self.assertRaises(ValueError):d.validate_subject(changed,build,plan,'Q1')
                changed=copy.deepcopy(plan);changed['source_root']=str(root/'wrong')
                with self.assertRaises(ValueError):d.validate_subject(subject,build,changed,'Q1')
                changed=copy.deepcopy(cargo);changed['fresh']=True;cargo_path.write_text(json.dumps(changed)+'\n')
                subject['cargo_output']=d.reference(cargo_path)
                with self.assertRaises(ValueError):d.validate_subject(subject,build,plan,'Q1')
                cargo_path.write_text(json.dumps(cargo)+'\n');subject['cargo_output']=d.reference(cargo_path)
                os.chmod(execution,0o700);execution.write_bytes(b'not ELF bytes');os.chmod(execution,0o500);subject['execution'].update(d.reference(execution))
                with self.assertRaises(ValueError):d.validate_subject(subject,build,plan,'Q1')

    def test_probe_result_requires_all_ordered_mutations_actual_errno_and_full_closure(self):
        d=self.driver
        authority=tuple('scripts/'+str(index) for index in range(6))
        descriptor={'source_root':'/workspaces/prismpm','source_sha256':'a'*64,'executable_sha256':'b'*64,
                    'listing_sha256':'c'*64,'test_count':2,'authority':[{'path':path} for path in authority],
                    'union':[{'kind':'file','path':'Cargo.toml'}]}
        code='component probe code'
        value={'schema':'cs1618/candidate-readonly-probe/1','mode':'readonly-qualification-v1','complete_application_accepted':False,
               'probe_sha256':d.sha(code.encode()),'descriptor_sha256':d.sha(d.encoded(descriptor)),'python':'3.12.3','uid':1000,'gid':1000,
               **{key:descriptor[key] for key in ('source_root','source_sha256','executable_sha256','listing_sha256','test_count')},
               'readonly_views':{'input':'/candidate-input','compiled_root':descriptor['source_root'],'subpath':'candidate-source','same_directory':True,
                                 'readonly':True,'protected_ancestors':True},'sdk_tree_sha256':'d'*64,'closure_unchanged':True,'checks':[]}
        for index,path in enumerate(probe.mutation_paths(descriptor,authority)):
            for operation in probe.OPERATIONS:value['checks'].append({'id':str(index)+':'+operation,'path':str(path),'operation':operation,'errno':30,'rejected':True})
        d.validate_probe(value,descriptor,probe,code)
        changed=copy.deepcopy(value);changed['checks'].pop()
        with self.assertRaises(ValueError):d.validate_probe(changed,descriptor,probe,code)
        for field,bad in [('closure_unchanged',False),('uid',0),('python','3.12.2'),('probe_sha256','0'*64),('descriptor_sha256','0'*64)]:
            changed=copy.deepcopy(value);changed[field]=bad
            with self.subTest(field=field),self.assertRaises(ValueError):d.validate_probe(changed,descriptor,probe,code)
        for field,bad in [('errno',2),('rejected',False),('path','/outside')]:
            changed=copy.deepcopy(value);changed['checks'][0][field]=bad
            with self.assertRaises(ValueError):d.validate_probe(changed,descriptor,probe,code)
        changed=copy.deepcopy(value);changed['checks'].reverse()
        with self.assertRaises(ValueError):d.validate_probe(changed,descriptor,probe,code)

    def test_only_fully_validated_named_fault_can_finish_a_negative_scenario(self):
        d=self.driver
        for id in ('Q3','Q4','Q5','Q6'):
            self.assertTrue(d.completed_fault(id,d.ControlledFault(d.FAULTS[id]),True))
            for error,observed in [(ValueError('later EOF or exit check failed'),True),
                                   (RuntimeError(d.FAULTS[id]),True),(d.ControlledFault('wrong-fault'),True),
                                   (d.ControlledFault(d.FAULTS[id]),False)]:
                self.assertFalse(d.completed_fault(id,error,observed))
        self.assertFalse(d.completed_fault('Q1',d.ControlledFault('none'),True))

    def test_raw_cleanup_observation_suffix_loss_does_not_change_expected_count(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary);rows=[]
            for index in range(6):
                path=root/(str(index)+'.json');d.write(path,{'argv':['docker','--host','unix:///var/run/docker.sock','volume','inspect','component-only-volume'],
                                                         'cleanup':True})
                rows.append({'role':'daemon','kind':'argv.json',**d.reference(path)})
            d.validate_observation_calls(rows,6)
            with self.assertRaises(ValueError):d.validate_observation_calls(rows[:-1],6)
            d.write(root/'0.json',{'argv':['docker','--host','other-daemon','volume','inspect','component-only-volume'],'cleanup':True},replace=True)
            with self.assertRaises(ValueError):d.validate_observation_calls(rows,6)

    def test_always_collector_resets_stale_complete_and_requires_every_phase_endpoint(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary);home=root/'driver';home.mkdir(mode=0o700)
            metadata=home/'metadata';metadata.mkdir(mode=0o700)
            d.write(metadata/'collection.json',{'status':'complete-conditional-evidence'})
            with patch.object(d,'HOME',home),patch.object(d,'SOURCE',root/'missing-source'),patch.object(d,'docker',side_effect=AssertionError('no Docker allowed in component test')):
                with self.assertRaises(ValueError):d.collect()
                result=d.read_json(metadata/'collection.json')
                self.assertEqual(result['status'],'incomplete')
                self.assertEqual(result['scenarios'],{id:None for id in d.SCENARIOS})
                phases={row['phase'] for row in result['missing']}
                self.assertTrue({'scenario:Q1','scenario:Q6','required:oc10.json','original-oc10-products','final-original-gate'}<=phases)
                d.write(metadata/'collection.json',{'status':'complete-conditional-evidence'},replace=True)
                with self.assertRaises(ValueError):d.collect()
                self.assertEqual(d.read_json(metadata/'collection.json')['status'],'incomplete')

    def test_later_forward_receipt_requires_original_typed_reverse_location(self):
        d=self.driver
        with tempfile.TemporaryDirectory(prefix='prismpm-publication-capture-') as captured, tempfile.TemporaryDirectory(prefix='prismpm-publication-linkage-') as linked:
            capture=pathlib.Path(captured);work=pathlib.Path(linked)
            d.write(capture/'capture-factory-evidence.json',{'component_fixture_only':True})
            owner={'factory':{'path':str(capture/'capture-factory-evidence.json'),'sha256':d.sha(d.regular(capture/'capture-factory-evidence.json'))},
                   'linkage':{'work':str(work),'receipt':'publication-linkage-evidence.json'},'ir':'a'*64,'compiler':{'component_fixture_only':True}}
            d.write(capture/'capture-owner-evidence.json',owner)
            linkage={'actualCapture':{'path':str(capture/'capture-owner-evidence.json'),'sha256':d.sha(d.regular(capture/'capture-owner-evidence.json'))},
                     'ir':owner['ir'],'compiler':owner['compiler']}
            with self.assertRaises(FileNotFoundError):d.validate_linkage_join(capture,owner,{str(work):{}})
            d.write(work/'publication-linkage-evidence.json',linkage)
            self.assertEqual(d.validate_linkage_join(capture,owner,{str(work):{}}),(work,linkage))
            with self.assertRaises(ValueError):d.validate_linkage_join(capture,owner,{})
            changed=copy.deepcopy(owner);changed['linkage']['receipt']='../publication-linkage-evidence.json'
            with self.assertRaises(ValueError):d.validate_linkage_join(capture,changed,{str(work):{}})
            changed=copy.deepcopy(linkage);changed['actualCapture']['sha256']='b'*64
            d.write(work/'publication-linkage-evidence.json',changed,replace=True)
            with self.assertRaises(ValueError):d.validate_linkage_join(capture,owner,{str(work):{}})

    def linkage_fixture(self,work,kind):
        # Fixed f292 compile.mjs modules/layout and checks.mjs mutant receipt.
        # Small real files exercise collection only, never compiler/SDK success.
        d=self.driver;files={};sources={}
        modules=sorted(['Fixture','Production.PublicationAdmission.LinkageV1','Production.PublicationAdmission.LinkageV1Wire',
                        'Production.PublicationAdmission.V1','Production.PublicationAdmission.V1Wire','Foundation.Bytes',
                        'Foundation.Codec','Foundation.Codec.Cbor.V1.Primitive'])
        def put(path,body=b'component evidence only'):
            file=work/path;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(body)
            files[path]={'bytes':len(body),'sha256':d.sha(body)};return files[path]
        for module in modules:sources[module]=put('project/src/'+module.replace('.','/')+'.lex.tex')['sha256']
        for path in ['project/lexlean.toml','project/lean-toolchain','project/lakefile.toml','runner/src/main.rs','runner/Cargo.lock',
                     'context-fields-runner/src/main.rs','context-fields-runner/Cargo.lock',
                     *['runner/src/'+name+'_witnesses.rs' for name in ['collector','partition','payload','bitset']]]:put(path)
        context=kind.startswith('context-');native={}
        for role in (['context-fields-std','context-fields-no_std'] if context else ['std','no_std']):
            native[role]=put('native-'+role+'-observer')['sha256']
        put(('context-fields-runner' if context else 'runner')+'/Cargo.toml')
        ir=put('export/kernel.ir')['sha256'];packages=[];wasm={}
        roles=['context-fields-wasm','context-fields-wasm-repro','admission-wasm','admission-wasm-repro'] if context else ['wasm','wasm-repro']
        for prefix,package_kind in [('generated','native')]+[('guest-'+role,'wasm') for role in roles]:
            names=['Cargo.lock','Cargo.toml','src/lib.rs']+(['LICENSE-APACHE','LICENSE-MIT','README.md'] if package_kind=='native' else ['.cargo/config.toml'])
            members={name:put(prefix+'/'+name)['sha256'] for name in sorted(names)}
            manifest={'schema':'lean4-prod/cargo-package-manifest/1' if package_kind=='native' else 'lean4-prod/core-wasm-target/1',
                      'input_ir_sha256':ir,'files':[{'path':name,'sha256':members[name]} for name in sorted(names)]}
            members['generation-manifest.json']=put(prefix+'/generation-manifest.json',d.encoded(manifest))['sha256']
            packages.append({'path':prefix,'kind':package_kind,'files':members})
        for role in roles:
            pair={}
            for side,path in [('original','guest-'+role+'-target/wasm32-unknown-unknown/release/publication_context_linkage_wire_probe.wasm'),
                              ('private','guest-'+role+'.wasm')]:
                row=put(path);info=(work/path).stat()
                pair[side]={'path':path,'device':str(info.st_dev),'inode':str(info.st_ino),'links':'1',
                            'size':row['bytes'],'sha256':row['sha256']}
            wasm[role]=pair
        proof_prefix='project/.lexlean/verified/'+'a'*64
        proof={'root':str(work/proof_prefix),'modules':modules,'runtime':[{'name':'LexLeanRuntime.Portable','text':'component runtime text\n'}],
               'source_id':'b'*64,'semantic_id':'c'*64,'build_id':'d'*64,'attestation_id':'a'*64}
        outputs=[];module_rows=[];inputs=[];oleans=[]
        for module in modules:
            stem='PrismPM/'+module.replace('.','/');lean='PrismPM.'+module
            module_rows.append({'module':module,'lean_module':lean,'source_path':'src/'+module.replace('.','/')+'.lex.tex'})
            source_path='project/src/'+module.replace('.','/')+'.lex.tex'
            inputs.append({'kind':'source','path':source_path.removeprefix('project/'),'byte_length':files[source_path]['bytes'],'sha256':sources[module]})
            for path,tag in [('modules/'+stem+'.lean','lean'),('modules/'+stem+'.tex','tex'),('maps/'+stem+'.map.json','map'),
                             ('coverage/'+stem+'.coverage.json','coverage'),('lexicons/'+module+'.closure.json','lexicon-closure')]:
                row=put(proof_prefix+'/'+path,b'import LexLeanRuntime.Portable\n' if tag=='lean' else b'component proof member')
                outputs.append({'kind':tag,'path':path,'byte_length':row['bytes'],'sha256':row['sha256']})
            for path in ['lean-src/'+stem+'.lean','process/lean/'+lean+'.json','process/leanchecker/'+lean+'.json']:put(proof_prefix+'/'+path)
            row=put(proof_prefix+'/oleans/'+stem+'.olean');oleans.append({'module':lean,'byte_length':row['bytes'],'sha256':row['sha256']})
        for runtime in proof['runtime']:
            name=runtime['name'];stem=name.replace('.','/')
            put(proof_prefix+'/lean-src/'+stem+'.lean',runtime['text'].encode())
            for path in ['process/lean/'+name+'.json','process/leanchecker/'+name+'.json']:put(proof_prefix+'/'+path)
            row=put(proof_prefix+'/oleans/'+stem+'.olean');oleans.append({'module':name,'byte_length':row['bytes'],'sha256':row['sha256']})
        manifest={'spec':'lexlean/build-manifest/1','selection':modules,'modules':module_rows,'inputs':inputs,'outputs':outputs,
                  **{key:proof[key] for key in ['source_id','semantic_id','build_id']}}
        row=put(proof_prefix+'/build-manifest.json',d.encoded(manifest))
        attestation={'spec':'lexlean/attestation/2','status':'verified','build_manifest':{'byte_length':row['bytes'],'sha256':row['sha256']},
                     'oleans':oleans,**{key:proof[key] for key in ['source_id','semantic_id','build_id','attestation_id']}}
        put(proof_prefix+'/attestation.json',d.encoded(attestation))
        put('intended-mutation.tsv',(('CompleteSixFieldContext' if context else 'SystemReferenceMismatch')+'\t00\t00'+('\t-\t-' if context else '')+'\n').encode())
        value={'spec':'prismpm/private-publication-linkage-evidence/1','scope':'component-only','completeApplicationAccepted':False,
               'kind':kind,'intendedMutationRejected':True,'sources':sources,'proof':proof,'ir':ir,'native':native,'wasm':wasm,
               'generatedPackages':packages,'retainedFiles':files}
        d.write(work/'publication-linkage-evidence.json',value);return value

    def test_mutant_inventory_omissions_never_redefine_complete_source_evidence(self):
        d=self.driver
        for kind in ['source','context-omission']:
            for defect in [None,'native','wasm','package','source','proof','vector','runtime','runtime-proof']:
                with self.subTest(kind=kind,defect=defect),tempfile.TemporaryDirectory() as temporary:
                    root=pathlib.Path(temporary);work=root/'work';work.mkdir();value=self.linkage_fixture(work,kind)
                    if defect=='native':value['native'].pop(next(iter(value['native'])))
                    if defect=='wasm':value['wasm'].pop(next(iter(value['wasm'])))
                    if defect=='package':value['generatedPackages'].pop()
                    removed=None
                    if defect=='source':
                        module=next(iter(value['sources']));value['sources'].pop(module)
                        removed='project/src/'+module.replace('.','/')+'.lex.tex'
                    if defect=='proof':removed=str(pathlib.Path(value['proof']['root']).relative_to(work))+'/modules/PrismPM/Fixture.lean'
                    if defect=='vector':removed='intended-mutation.tsv'
                    if defect=='runtime':value['proof']['runtime']=[]
                    if defect=='runtime-proof':removed=str(pathlib.Path(value['proof']['root']).relative_to(work))+'/oleans/LexLeanRuntime/Portable.olean'
                    if removed:value['retainedFiles'].pop(removed);(work/removed).unlink()
                    d.write(work/'publication-linkage-evidence.json',value,replace=True);store=d.Store(root/'raw')
                    if defect:
                        with self.assertRaises(ValueError):d.collect_linkage(store,work,value,'component-mutant',expected_kind=kind)
                    else:d.collect_linkage(store,work,value,'component-mutant',expected_kind=kind)

    def test_early_and_attachment_failures_retain_available_observations_and_typed_spool(self):
        import uuid,shutil
        d=self.driver
        for missing in ['descriptor.json','stage-admission.json','probe.json']:
            with self.subTest(missing=missing),tempfile.TemporaryDirectory() as temporary:
                root=pathlib.Path(temporary);home=root/'driver';folder=home/'scenarios/Q1';folder.mkdir(parents=True,mode=0o700)
                token=uuid.uuid4().hex;spool=pathlib.Path('/tmp/prismpm-candidate-diagnostics-'+token);spool.mkdir(mode=0o700)
                try:
                    raw=folder/'0000-daemon-stdout';raw.write_bytes(b'available component inspection failure bytes')
                    row={'role':'daemon','kind':'stdout',**d.reference(raw)}
                    value={'schema':'cs1618/candidate-capture-scenario/1','id':'Q1','status':'incomplete','owner_token':token,
                           'observations':[row],'retirement':{'cleanup_daemon_calls':0}}
                    d.write(folder/'scenario.json',value);d.write(folder/'observation-index.json',[row])
                    d.write(spool/'manifest.json',{'component_spool_manifest':True});(spool/'execute.stderr').write_bytes(b'available component attachment error')
                    locator={'schema':'prismpm/conditional-candidate-diagnostics-locator/1','owner_token':token,'directory':str(spool),
                             'manifest':'manifest.json','manifest_sha256':d.sha(d.regular(spool/'manifest.json')),'complete_application_accepted':False}
                    d.write(folder/'outcome.json',{'error':'component early failure','diagnostic_locator':locator,'remaining_seconds':10})
                    for name in ['descriptor.json','stage-admission.json','probe.json']:
                        if name!=missing:d.write(folder/name,{'component_only':True})
                    with patch.object(d,'HOME',home),patch.object(d,'SOURCE',root/'absent-source'),patch.object(d,'docker',side_effect=AssertionError('no daemon')):
                        with self.assertRaises(ValueError):d.collect()
                    result=d.read_json(home/'metadata/collection.json');self.assertEqual(result['status'],'incomplete')
                    paths={row['path'] for row in result['files']}
                    self.assertIn('scenarios/Q1/0000-daemon-stdout',paths)
                    self.assertIn('scenarios/Q1/diagnostics/execute.stderr',paths)
                    self.assertNotIn('scenarios/Q1/'+missing,paths)
                finally:shutil.rmtree(spool)

    def test_collection_clock_caps_early_and_late_failures_without_renewal(self):
        d=self.driver
        early=d.collection_clock(1000,1600)
        self.assertEqual(early,{'schema':'cs1618/candidate-collection-clock/1','started':1600,'source_deadline':2020,'deadline':2200,'job_deadline':22600})
        late=d.collection_clock(1000,22400)
        self.assertEqual(late['source_deadline'],22420);self.assertEqual(late['deadline'],22600)
        for phase,now,wanted in [('host',2020,60),('metadata',2080,60),('raw',2140,60)]:
            self.assertEqual(d.collection_phase_seconds(early,phase,now),wanted)
        with self.assertRaises(ValueError):d.collection_phase_seconds(early,'metadata',2141)
        with self.assertRaises(ValueError):d.collection_phase_seconds(early,'raw',2200)
        with self.assertRaises(ValueError):d.collection_phase_seconds(late,'host',22421)

    def test_actual_collection_timer_reuses_clock_and_marks_exhaustion_incomplete(self):
        d=self.driver
        for started,now,expected in [(1000,1600,420),(1000,22400,20)]:
            with self.subTest(now=now),tempfile.TemporaryDirectory() as temporary:
                home=pathlib.Path(temporary);d.write(home/'preparation-partial.json',{'started':started})
                with patch.object(d,'HOME',home),patch.object(d.time,'monotonic',return_value=now),\
                     patch.object(d.signal,'signal'),patch.object(d.signal,'setitimer') as timer,\
                     patch.object(d,'collect',side_effect=ValueError('component collector failure')):
                    with self.assertRaisesRegex(ValueError,'component collector failure'):d.run_collection()
                    self.assertEqual(timer.call_args_list[0].args[1],expected)
                    clock=(home/'collection-clock.json').read_bytes()
                with patch.object(d,'HOME',home),patch.object(d.time,'monotonic',return_value=now+10),\
                     patch.object(d.signal,'signal'),patch.object(d.signal,'setitimer') as timer,\
                     patch.object(d,'collect',side_effect=ValueError('component collector failure')):
                    with self.assertRaisesRegex(ValueError,'component collector failure'):d.run_collection()
                    self.assertEqual(timer.call_args_list[0].args[1],expected-10)
                    self.assertEqual((home/'collection-clock.json').read_bytes(),clock)
                with patch.object(d,'HOME',home),patch.object(d.time,'monotonic',return_value=now+expected),patch.object(d,'collect') as collector:
                    with self.assertRaises(d.CollectionDeadline):d.run_collection()
                    collector.assert_not_called()
                    self.assertEqual(d.read_json(home/'metadata/collection.json')['status'],'incomplete')

    def test_host_upload_admission_reuses_source_clock_and_refuses_late_raw_upload(self):
        d=self.driver
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary);home=root/'prismpm/target/candidate-qualification-driver';home.mkdir(parents=True)
            (root/'evidence').mkdir();d.write(root/'evidence/job-start.json',{'monotonic':1000})
            clock=d.collection_clock(1000,1600);d.write(home/'collection-clock.json',clock)
            output=root/'output';output.touch()
            with patch.object(d.Path,'cwd',return_value=root),patch.dict(os.environ,{'GITHUB_OUTPUT':str(output)}),\
                 patch.object(d.time,'monotonic',return_value=2080):
                d.upload_collection_budget('metadata')
            self.assertEqual(output.read_text(),'admitted=true\n')
            with patch.object(d.Path,'cwd',return_value=root),patch.dict(os.environ,{'GITHUB_OUTPUT':str(output)}),\
                 patch.object(d.time,'monotonic',return_value=2141):
                with self.assertRaises(ValueError):d.upload_collection_budget('raw')
            self.assertEqual(output.read_text(),'admitted=true\nadmitted=false\n')
            self.assertEqual(d.read_json(root/'evidence/collection-clock.json'),clock)
            self.assertEqual(d.read_json(home/'collection-clock.json'),clock)
            self.assertEqual(d.read_json(root/'evidence/metadata-upload/collection.json')['status'],'incomplete')

    def test_mutant_receipts_join_same_inputs_compiler_and_only_selected_source_change(self):
        d=self.driver
        baseline={'inputs':{'fixed-source':'a'*64},'inputSnapshot':'/component/frozen-inputs','compiler':{'component_only':True},
                  'sources':{name:'b'*64 for name in d.LINKAGE_MODULES}}
        value=copy.deepcopy(baseline);value['sources']['Production.PublicationAdmission.LinkageV1']='c'*64
        d.validate_mutant_join(value,baseline,'source')
        for defect in ['inputs','compiler','inputSnapshot','unmodified','wrong-module']:
            changed=copy.deepcopy(value)
            if defect in ['inputs','compiler']:changed[defect]={}
            if defect=='inputSnapshot':changed[defect]='/component/unrelated'
            if defect=='unmodified':changed['sources']=baseline['sources']
            if defect=='wrong-module':changed['sources']['Fixture']='d'*64
            with self.subTest(defect=defect),self.assertRaises(ValueError):d.validate_mutant_join(changed,baseline,'source')

    def test_workflow_collection_host_and_uploads_have_fixed_same_clock_bounds(self):
        import yaml
        workflow=yaml.load((ROOT.parents[1]/'.github/workflows/prismpm-candidate-capture-qualification.yml').read_text(),Loader=yaml.BaseLoader)
        steps=workflow['jobs']['qualification']['steps']
        retention=next(step for step in steps if step.get('id')=='retention');self.assertEqual(retention.get('timeout-minutes'),'1')
        for phase in ['metadata','raw']:
            guard=next(step for step in steps if step.get('id')==phase+'-budget')
            self.assertIn('collection-budget --collection-phase '+phase,guard['run']);self.assertIn('always()',guard['if'])
            upload=next(step for step in steps if step.get('name','').startswith('Upload '+('initial metadata' if phase=='metadata' else 'bounded original raw')))
            self.assertEqual(upload.get('timeout-minutes'),'1');self.assertIn('steps.'+phase+'-budget.outputs.admitted',upload['if'])

    def test_exact_gate_survivors_are_required_and_custody_bound(self):
        d=self.driver
        for defect in [None,'original','private','same-inode','digest']:
            with tempfile.TemporaryDirectory() as temporary:
                root=pathlib.Path(temporary);work=root/'work';work.mkdir(mode=0o700);pair={}
                for side,name in [('original','publication-gate-built-tests'),('private','publication-gate-execution')]:
                    path=work/name;path.write_bytes(b'component exact-gate file');os.chmod(path,0o500);info=path.stat()
                    pair[side]={'path':name,'device':str(info.st_dev),'inode':str(info.st_ino),'links':'1',
                                'size':info.st_size,'sha256':d.sha(path.read_bytes()),'mode':info.st_mode}
                if defect in ('original','private'):(work/pair[defect]['path']).unlink()
                if defect=='same-inode':pair['private']['inode']=pair['original']['inode']
                if defect=='digest':pair['private']['sha256']='f'*64
                d.write(work/'exact-gate-evidence.json',pair);store=d.Store(root/'raw')
                if defect:
                    with self.assertRaises((ValueError,FileNotFoundError)):d.collect_exact_gate(store,work)
                else:
                    d.collect_exact_gate(store,work);self.assertEqual(len(store.files),2)

    def test_workflow_host_cleanup_exact_original_allowlist_after_absolute_clock(self):
        import yaml,shlex
        folder=ROOT.parents[1]/'.github/workflows'
        value=yaml.load((folder/'prismpm-candidate-capture-qualification.yml').read_text(),Loader=yaml.BaseLoader)
        original=yaml.load((folder/'prismpm-backport-full-validation.yml').read_text(),Loader=yaml.BaseLoader)
        steps=value['jobs']['qualification']['steps'];cleanup=steps[1]['run']
        self.assertIn('time.monotonic()',steps[0]['run'])
        self.assertEqual(value['jobs']['qualification']['runs-on'],'ubuntu-24.04')
        expected=original['jobs']['vv']['steps'][0]['run']
        def paths(script):return shlex.split(script.split('sudo rm -rf ',1)[1].split('df -h /',1)[0].replace('\\\n',''))
        self.assertEqual(paths(cleanup),paths(expected))
        self.assertEqual(len(paths(cleanup)),13)
        for guard in ['test "$GITHUB_ACTIONS" = true','test "$RUNNER_ENVIRONMENT" = github-hosted',
                      'test "$RUNNER_OS" = Linux','ubuntu:24.04','set -euo pipefail']:
            self.assertIn(guard,cleanup)
        self.assertEqual(cleanup.count('sudo rm'),1)

    def test_workflow_exact_pins_narrow_trigger_and_always_bounded_exports(self):
        import yaml
        workflow=ROOT.parents[1]/'.github/workflows/prismpm-candidate-capture-qualification.yml'
        raw=workflow.read_text();value=yaml.load(raw,Loader=yaml.BaseLoader)
        self.assertEqual(set(value['on']),{'push','workflow_dispatch'})
        self.assertEqual(value['on']['push']['branches'],['numeric-kernels'])
        self.assertEqual(value['on']['push']['paths'],[
            '.github/workflows/prismpm-candidate-capture-qualification.yml','scripts/numeric/candidate-capture-qualification.py',
            'scripts/numeric/candidate-capture-probe.py','scripts/numeric/candidate-capture-subject.mjs',
            'scripts/numeric/tests/test_candidate_capture_qualification.py','scripts/numeric/prismpm-capture-candidate/**'])
        self.assertEqual(value['jobs']['image']['timeout-minutes'],'240')
        self.assertEqual(value['jobs']['qualification']['timeout-minutes'],'360')
        self.assertEqual(value['jobs']['qualification']['needs'],'image')
        for job in value['jobs'].values():
            for step in job['steps']:
                if 'uses' in step and not step['uses'].startswith('./'):
                    self.assertRegex(step['uses'],r'@[0-9a-f]{40}$')
                if step.get('uses','').startswith('actions/upload-artifact@'):
                    self.assertIn('always()',step['if'])
                if step.get('uses','').startswith('devcontainers/ci@'):
                    self.assertEqual(step['uses'],'devcontainers/ci@8bf61b26e9c3a98f69cb6ce2f88d24ff59b785c6')
                    self.assertEqual(step['with']['inheritEnv'],'false')
        self.assertNotIn('CARGO_BUILD_',raw)
        for key in ['PRISMPM_OC10_CAPTURE_ROUTE','PRISMPM_OC10_SDK_CHILD','PRISMPM_OC10_CAPTURE_OUTPUT']:self.assertNotIn(key,raw)
        self.assertIn('steps.retention.outputs.raw_safe',raw)
        self.assertIn('steps.setup-budget.outputs.minutes',raw)
        self.assertIn(self.driver.SDK,raw)

if __name__ == '__main__': unittest.main()
