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
