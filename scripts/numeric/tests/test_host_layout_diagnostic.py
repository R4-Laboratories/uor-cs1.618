"""Owned metadata-only fixtures; never a hosted or credential witness."""
import base64
import errno
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import socket
import stat
import struct
import tempfile
import time
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'host-layout-diagnostic.py'
spec = importlib.util.spec_from_file_location('host_layout', SCRIPT)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
ROOT = Path('/home/runner/work/uor-cs1.618/uor-cs1.618')
FIXTURES = Path('/workspace/diagnostic-tools/host-layout-diagnostic/fixtures')


def acl(entries=None):
    return struct.pack('<I', 2) + b''.join(struct.pack('<HHI', *x) for x in
        (entries or [(1,7,0xffffffff),(4,5,0xffffffff),(32,5,0xffffffff)]))


class ManifestTests(unittest.TestCase):
    def test_exact_closure(self):
        nodes=m.manifest(ROOT,1001)
        self.assertEqual(len(nodes),81)
        self.assertEqual(len({x['id'] for x in nodes}),81)
        self.assertEqual(nodes[0]['id'],'/')
        self.assertEqual(sum(x['id'].startswith(str(ROOT/'game')+'/') or x['id']==str(ROOT/'game') for x in nodes),17)
        self.assertEqual(sum(x['id'].startswith(str(ROOT/'prismpm')+'/') or x['id']==str(ROOT/'prismpm') for x in nodes),41)
        self.assertEqual(sum(x['id'].startswith(str(ROOT/'evidence')+'/') or x['id']==str(ROOT/'evidence') for x in nodes),12)
        self.assertFalse(any('pull-budget' in x['id'] or 'setup-budget' in x['id'] for x in nodes))
    def test_limits_before_opens(self):
        with self.assertRaises(ValueError):m.manifest(Path('/'+'/'.join(['a']*25)),1001)
        with self.assertRaises(ValueError):m.manifest(Path('/'+'a'*513),1001)
    def test_expected_absence_is_distinct(self):
        rows={x['id']:x for x in m.manifest(ROOT,1001)}
        h=ROOT/'prismpm/target/candidate-qualification-driver'
        self.assertEqual(rows[str(h/'metadata')]['expectation']['presence'],'future')
        self.assertEqual(rows[str(h/'preparation-partial.json')]['expectation']['presence'],'required')


class ACLTests(unittest.TestCase):
    def test_exact_bytes_and_decode(self):
        raw=acl();a=m.acl_record(raw)
        self.assertEqual(a['raw_b64'],base64.b64encode(raw).decode())
        self.assertEqual(a['sha256'],hashlib.sha256(raw).hexdigest())
        self.assertEqual(a['entries'],[[1,7,0xffffffff],[4,5,0xffffffff],[32,5,0xffffffff]])
        self.assertIsNone(a['decode_error'])
    def test_malformed(self):
        for raw in (b'x',struct.pack('<I',3),acl([(1,8,0xffffffff),(4,5,0xffffffff),(32,5,0xffffffff)]),acl([(1,7,0xffffffff),(2,7,123),(4,5,0xffffffff),(32,5,0xffffffff)])):
            with self.subTest(raw=raw):self.assertIsNotNone(m.acl_record(raw)['decode_error'])
    def test_error_is_not_absence(self):
        for code in (errno.ENOTSUP,errno.EACCES):
            self.assertEqual(m.acl_error(code)['state'],'unavailable')
        self.assertEqual(m.acl_error(errno.ENODATA)['state'],'absent')
    def test_oversize(self):
        a=m.acl_record(b'a'*8193)
        self.assertEqual(a['state'],'oversize');self.assertEqual(a['bytes'],8193)
        self.assertIsNone(a['sha256']);self.assertIsNone(a['raw_b64'])





class OwnedFixture(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(dir=FIXTURES)
        self.root=Path(self.temp.name)
        self.uid=os.getuid();self.gid=os.getgid();self.deadline=time.monotonic()+20
    def tearDown(self):self.temp.cleanup()
    def make_file(self,name,body=b'fixture\n',mode=0o400):
        path=self.root/name;path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        path.write_bytes(body);path.chmod(mode);return path
    def plan(self,leaves):
        paths=set(leaves)
        for p in list(paths):paths.update(p.parents)
        rows=[]
        for p in sorted(paths,key=lambda x:(len(x.parts),str(x))):
            kind,presence=leaves.get(p,('directory','required'))
            rows.append({'id':str(p),'parent':str(p.parent) if p!=Path('/') else None,'name':p.name or '/',
                         'role':'fixture','expectation':{'type':kind,'presence':presence,'private':None,'owners':[0,self.uid]},
                         'state':'unmeasured','identity':None,'access_acl':None,'default_acl':None,'blocked_by':None,'issue_ids':[]})
        return rows
    def record(self,rows):
        ids={r['id']:i for i,r in enumerate(rows)}
        value=m.new_record(m.manifest(ROOT,self.uid),ROOT,self.uid,self.gid)
        value['nodes']=[{**r,'id':i,'parent':ids.get(r['parent'])} for i,r in enumerate(rows)]
        value['creation_rules']=[]
        return value
    def observe(self,rows):
        record=self.record(rows)
        with m.Handles() as held:body=m.measure(rows,record,self.deadline,held)
        self.assertLessEqual(len(body),65536)
        return record
    def set_acl(self,path,name,raw):
        try:os.setxattr(path,name,raw)
        except OSError as e:
            if e.errno in (errno.ENOTSUP,errno.EOPNOTSUPP,errno.EPERM):self.skipTest('owned ACL fixture unavailable: '+str(e.errno))
            raise


class NativeACLTests(OwnedFixture):
    def test_actual_default_and_masked_access(self):
        default=acl([(1,7,0xffffffff),(2,7,self.uid+10),(4,5,0xffffffff),(16,5,0xffffffff),(32,0,0xffffffff)])
        self.set_acl(self.root,'system.posix_acl_default',default)
        child=self.make_file('child')
        fd=os.open(self.root,os.O_PATH|os.O_NOFOLLOW)
        try:
            got=m.native_acl(fd,'system.posix_acl_default')
            self.assertEqual(got['raw_b64'],base64.b64encode(default).decode())
        finally:os.close(fd)
        fd=os.open(child,os.O_PATH|os.O_NOFOLLOW)
        try:
            access=m.native_acl(fd,'system.posix_acl_access')
            self.assertEqual(access['state'],'present')
            self.assertTrue(m.private_acl(access,0o400))
            self.assertIn([2,7,self.uid+10],access['entries'])
        finally:os.close(fd)
    def test_procfd_unavailable(self):
        p=self.make_file('leaf');fd=os.open(p,os.O_PATH)
        original=os.stat
        def missing(path,*a,**kw):
            if isinstance(path,bytes) and path.startswith(b'/proc/self/fd/'):raise FileNotFoundError(errno.ENOENT,'fixture')
            return original(path,*a,**kw)
        try:
            with patch.object(m.os,'stat',side_effect=missing):got=m.native_acl(fd,'system.posix_acl_access')
            self.assertEqual(got['state'],'unavailable');self.assertEqual(got['errno'],errno.ENOENT)
        finally:os.close(fd)
    def test_native_oversize_and_growth(self):
        p=self.make_file('leaf');fd=os.open(p,os.O_PATH)
        try:
            with patch.object(m,'_GETXATTR',return_value=8193):got=m.native_acl(fd,'system.posix_acl_access')
            self.assertEqual(got['state'],'oversize');self.assertIsNone(got['raw_b64'])
            def growing(*args):
                if args[2] is None:return 8
                m.ctypes.set_errno(errno.ERANGE);return -1
            with patch.object(m,'_GETXATTR',side_effect=growing):got=m.native_acl(fd,'system.posix_acl_access')
            self.assertEqual(got['state'],'oversize');self.assertEqual(got['decode_error'],'growth')
        finally:os.close(fd)
    def test_effective_private_not_acl_absence(self):
        self.assertTrue(m.private_acl(m.acl_record(acl([(1,7,0xffffffff),(2,7,124),(4,7,0xffffffff),(16,0,0xffffffff),(32,0,0xffffffff)])),0o700))
        self.assertFalse(m.private_acl(m.acl_error(errno.EACCES),0o700))
        self.assertFalse(m.private_acl(m.acl_record(acl()),0o700))


class MeasurementTests(OwnedFixture):
    def test_future_absence_and_required_missing(self):
        future=self.root/'future';child=future/'leaf';required=self.root/'required';sibling=self.make_file('safe')
        rows=self.plan({future:('directory','future'),child:('file','future'),required:('file','required'),sibling:('file','required')})
        record=self.observe(rows);out={r['id']:v for r,v in zip(rows,record['nodes'])}
        self.assertEqual(out[str(future)]['state'],'absent_expected')
        self.assertEqual(out[str(child)]['state'],'blocked_expected_absence')
        self.assertEqual(out[str(required)]['state'],'missing_required')
        self.assertEqual(out[str(sibling)]['state'],'measured')
        self.assertFalse(record['coverage']['complete'])
        record=self.observe(self.plan({future:('directory','future'),child:('file','future'),sibling:('file','required')}))
        self.assertTrue(record['coverage']['complete'])
    def test_continue_past_default_acl(self):
        self.set_acl(self.root,'system.posix_acl_default',acl())
        p=self.make_file('leaf');record=self.observe(self.plan({p:('file','required')}))
        self.assertTrue(record['coverage']['complete'])
        self.assertEqual(record['nodes'][-1]['state'],'measured')
        self.assertTrue(any(a['state']=='present' for a in record['acls']))
    def test_unsafe_alias_blocks_only_its_branch(self):
        actual=self.root/'real';actual.mkdir();(self.root/'alias').symlink_to(actual,target_is_directory=True)
        sibling=self.make_file('safe');child=self.root/'alias/leaf'
        rows=self.plan({child:('file','required'),sibling:('file','required')});out=self.observe(rows)
        mapped={r['id']:v for r,v in zip(rows,out['nodes'])}
        self.assertEqual(mapped[str(child)]['state'],'blocked')
        self.assertEqual(mapped[str(sibling)]['state'],'measured')
        self.assertFalse(out['coverage']['complete'])
    def test_timeout_leaves_all_rows(self):
        p=self.make_file('leaf');rows=self.plan({p:('file','required')});self.deadline=time.monotonic()-1
        record=self.observe(rows)
        self.assertEqual(record['coverage']['expected'],len(rows))
        self.assertEqual(record['coverage']['unmeasured'],len(rows))
        self.assertFalse(record['coverage']['complete'])
    def test_acl_error_does_not_block_structural_descent(self):
        p=self.make_file('leaf');original=m.native_acl
        def unavailable(fd,name):
            if m.identity(os.fstat(fd))['ino']==self.root.stat().st_ino:return m.acl_error(errno.EACCES)
            return original(fd,name)
        with patch.object(m,'native_acl',side_effect=unavailable):record=self.observe(self.plan({p:('file','required')}))
        self.assertEqual(record['nodes'][-1]['state'],'measured');self.assertFalse(record['coverage']['complete'])
    def test_replaced_leaf_is_unstable(self):
        p=self.make_file('leaf');original=m.acl_pair;done=False
        def replacing(fd,kind):
            nonlocal done
            result=original(fd,kind)
            if not done and os.fstat(fd).st_ino==p.stat().st_ino:
                done=True;p.unlink();self.make_file('leaf',b'replaced\n')
            return result
        with patch.object(m,'acl_pair',side_effect=replacing):record=self.observe(self.plan({p:('file','required')}))
        self.assertFalse(record['coverage']['complete'])
        self.assertIn(record['nodes'][-1]['state'],('unsafe','unstable'))
    def test_acl_and_ctime_race(self):
        p=self.make_file('leaf');original=m.acl_pair;done=False
        def changing(fd,kind):
            nonlocal done
            result=original(fd,kind)
            if not done and os.fstat(fd).st_ino==self.root.stat().st_ino:
                done=True;os.chmod(self.root,0o750)
            return result
        with patch.object(m,'acl_pair',side_effect=changing):record=self.observe(self.plan({p:('file','required')}))
        self.assertFalse(record['coverage']['complete'])
    def test_acl_bytes_race_even_if_identity_mocked_stable(self):
        p=self.make_file('leaf');original=m.native_acl;calls=0
        def changing(fd,name):
            nonlocal calls
            if os.fstat(fd).st_ino==p.stat().st_ino and name.endswith('access'):
                calls+=1
                return m.acl_record(acl()) if calls==1 else m.acl_error(errno.ENODATA)
            return original(fd,name)
        with patch.object(m,'native_acl',side_effect=changing):record=self.observe(self.plan({p:('file','required')}))
        self.assertFalse(record['coverage']['complete'])


class EncodingTests(unittest.TestCase):
    def test_dedup_and_omission_covers_decoded_expansion(self):
        rows=m.manifest(ROOT,1001);record=m.new_record(rows,ROOT,1001,1001)
        a=m.acl_record(acl());self.assertEqual(m.retain_acl(record,a),m.retain_acl(record,a.copy()))
        self.assertEqual(len(record['acls']),1)
        for x in range(8):
            raw=acl([(1,7,0xffffffff)]+[(2,7,i+x*2000) for i in range(500)]+[(4,5,0xffffffff),(16,5,0xffffffff),(32,0,0xffffffff)])
            m.retain_acl(record,m.acl_record(raw))
        body=m.fit_record(record)
        self.assertLessEqual(len(body),65536);self.assertFalse(record['coverage']['complete'])
        omitted=[a for a in record['acls'] if a['state']=='omitted'];self.assertTrue(omitted)
        self.assertTrue(all(a['sha256'] and a['bytes'] and a['raw_b64'] is None and a['entries'] is None for a in omitted))
    def test_null_probe_fields_and_closed_rows(self):
        rows=m.manifest(ROOT,1001);record=m.new_record(rows,ROOT,1001,1001)
        self.assertEqual(set(record),set(m.FULL_KEYS))
        for name in ('planned','actual','kernel_witness','creation_witness'):self.assertIsNone(record[name])
        for row in record['nodes']:self.assertEqual(set(row),set(m.NODE_KEYS))
        for rule in record['creation_rules']:self.assertIsNone(rule['actual']);self.assertIsNone(rule['creation_witness'])
        self.assertFalse(record['complete_application_accepted'])
    def test_control_schema_always_nonacceptance(self):
        c=m.control(20,'a'*64)
        self.assertEqual(len(m.encoded(c))<8192,True)
        self.assertEqual(m.validate_control(c,1,20,'a'*64),c)
        with self.assertRaises(ValueError):m.validate_control(c,0,20,'a'*64)
        c['preflight']=True
        with self.assertRaises(ValueError):m.validate_control(c,1,20,'a'*64)


class PublicationTests(OwnedFixture):
    def custody(self):return m.Custody(self.root,self.uid,self.deadline)
    def test_exclusive_publication_and_exact_artifact(self):
        with self.custody() as c:
            layout=b'{"fixture":1}\n';status=b'{"status":1}\n'
            m.publish(c,self.root,layout,self.uid,self.gid)
            m.publish(c,self.root,status,self.uid,self.gid,name='status.json')
            m.artifact_readback(c,self.root,layout,status,self.uid)
            self.assertEqual(stat.S_IMODE((self.root/'layout.json').stat().st_mode),0o400)
            with self.assertRaises(FileExistsError):m.publish(c,self.root,layout,self.uid,self.gid)
            self.make_file('extra')
            with self.assertRaises(ValueError):m.artifact_readback(c,self.root,layout,status,self.uid)
    def test_preexisting_symlink_hardlink_wrong_owner_and_hash(self):
        p=self.make_file('target');(self.root/'layout.json').symlink_to(p)
        with self.custody() as c:
            with self.assertRaises(FileExistsError):m.publish(c,self.root,b'x',self.uid,self.gid)
        (self.root/'layout.json').unlink();os.link(p,self.root/'layout.json')
        fd=os.open(self.root,os.O_PATH)
        try:
            with self.assertRaises(ValueError):m.read_at(fd,'layout.json',self.uid,65536,self.deadline)
            (self.root/'layout.json').unlink()
            with self.assertRaises(ValueError):m.read_at(fd,'target',self.uid+1,65536,self.deadline)
        finally:os.close(fd)
        with self.custody() as c:
            m.publish(c,self.root,b'layout\n',self.uid,self.gid)
            m.publish(c,self.root,b'status\n',self.uid,self.gid,name='status.json')
            with self.assertRaises(ValueError):m.artifact_readback(c,self.root,b'changed\n',b'status\n',self.uid)
    def test_replaced_parent_blocks_publication(self):
        with self.custody() as c:
            c.directory(self.root,True)
            moved=self.root.with_name(self.root.name+'-moved')
            self.root.rename(moved);self.root.mkdir(mode=0o700)
            try:
                with self.assertRaises(ValueError):m.publish(c,self.root,b'no\n',self.uid,self.gid)
                self.assertFalse((self.root/'layout.json').exists());self.assertFalse((moved/'layout.json').exists())
            finally:
                self.root.rmdir();moved.rename(self.root)
    def test_parent_race_during_create_is_detected(self):
        with self.custody() as c:
            c.directory(self.root,True);original=os.open;moved=self.root.with_name(self.root.name+'-moved');swapped=False
            def opening(path,flags,*args,**kwargs):
                nonlocal swapped
                if path=='layout.json' and flags&os.O_CREAT and not swapped:
                    swapped=True;self.root.rename(moved);self.root.mkdir(mode=0o700)
                return original(path,flags,*args,**kwargs)
            try:
                with patch.object(m.os,'open',side_effect=opening):
                    with self.assertRaises(ValueError):m.publish(c,self.root,b'held\n',self.uid,self.gid)
                self.assertFalse((self.root/'layout.json').exists())
            finally:
                self.root.rmdir();moved.rename(self.root)
    def test_publication_acl_error_and_oversize(self):
        with self.custody() as c:
            with self.assertRaises(ValueError):m.publish(c,self.root,b'x'*65537,self.uid,self.gid)
            c.directory(self.root,True)
            with patch.object(m,'acl_pair',return_value=(m.acl_error(errno.EACCES),m.acl_empty('not_applicable'))):
                with self.assertRaises(ValueError):m.publish(c,self.root,b'x',self.uid,self.gid)
    def test_actual_default_acl_private_publication(self):
        self.set_acl(self.root,'system.posix_acl_default',acl([(1,7,0xffffffff),(2,7,self.uid+10),(4,7,0xffffffff),(16,7,0xffffffff),(32,7,0xffffffff)]))
        with self.custody() as c:
            m.publish(c,self.root,b'layout\n',self.uid,self.gid)
            m.publish(c,self.root,b'status\n',self.uid,self.gid,name='status.json')
            m.artifact_readback(c,self.root,b'layout\n',b'status\n',self.uid)


class RunnerTests(OwnedFixture):
    def prepare_runner(self):
        evidence=self.root/'evidence';evidence.mkdir(mode=0o700)
        (evidence/'job-start.json').write_bytes(m.encoded({'monotonic':time.monotonic()}))
        (evidence/'job-start.json').chmod(0o644)
        output=self.make_file('github-output',b'',0o600)
        return output
    def test_actual_runner_early_failure_fallback_and_output(self):
        output=self.prepare_runner()
        with patch.object(m,'fixed_root',return_value=self.root),patch.object(m,'bounded_process',return_value=(1,b'',b'sudo unavailable')),patch.dict(os.environ,{'GITHUB_OUTPUT':str(output)}):
            self.assertEqual(m.runner(),1)
        upload=self.root/'evidence'/m.UPLOAD
        self.assertEqual(set(p.name for p in upload.iterdir()),{'layout.json','status.json'})
        value=m.decode((upload/'layout.json').read_bytes());status=m.decode((upload/'status.json').read_bytes())
        self.assertEqual(value['producer'],'runner_fallback');self.assertIsNone(value['observer']);self.assertIsNone(value['context'])
        self.assertTrue(all(r['identity'] is None for r in value['nodes']))
        self.assertFalse(value['coverage']['complete']);self.assertTrue(status['artifact_safe'])
        self.assertEqual(output.read_text(),'artifact_safe=true\n')
    def test_preexisting_upload_refuses_without_output(self):
        output=self.prepare_runner();(self.root/'evidence'/m.UPLOAD).mkdir(mode=0o700)
        with patch.object(m,'fixed_root',return_value=self.root),patch.object(m,'bounded_process') as proc,patch.dict(os.environ,{'GITHUB_OUTPUT':str(output)}):
            self.assertEqual(m.runner(),1)
        proc.assert_not_called();self.assertEqual(output.read_bytes(),b'')
    def test_partial_root_report_cannot_be_replaced_by_fallback(self):
        output=self.prepare_runner()
        def process(*args,**kwargs):
            p=self.root/'evidence'/m.UPLOAD/'layout.json';p.write_bytes(b'partial');p.chmod(0o400)
            return 1,b'',b'error'
        with patch.object(m,'fixed_root',return_value=self.root),patch.object(m,'bounded_process',side_effect=process),patch.dict(os.environ,{'GITHUB_OUTPUT':str(output)}):
            self.assertEqual(m.runner(),1)
        self.assertEqual(output.read_bytes(),b'');self.assertEqual((self.root/'evidence'/m.UPLOAD/'layout.json').read_bytes(),b'partial')
    def test_root_hash_mismatch_never_uploads_partial_report(self):
        output=self.prepare_runner()
        def process(*args,**kwargs):
            request=m.decode((self.root/'evidence'/m.CONTROL/'request.json').read_bytes())
            request_hash=m.digest(m.encoded(request))
            record=m.new_record(m.manifest(self.root,self.uid),self.root,self.uid,self.gid,{'request_sha256':request_hash})
            record['observer']={'uid':0,'euid':0,'gid':0}
            body=m.fit_record(record);p=self.root/'evidence'/m.UPLOAD/'layout.json';p.write_bytes(body);p.chmod(0o400)
            summary=m.control(args[1],request_hash)
            summary['report']={'name':'layout.json','bytes':len(body),'sha256':'0'*64}
            return 1,m.encoded(summary),b''
        with patch.object(m,'fixed_root',return_value=self.root),patch.object(m,'bounded_process',side_effect=process),patch.dict(os.environ,{'GITHUB_OUTPUT':str(output)}):
            self.assertEqual(m.runner(),1)
        self.assertEqual(output.read_bytes(),b'')
        self.assertFalse((self.root/'evidence'/m.UPLOAD/'status.json').exists())

    def test_only_fixed_sudo_command_and_sanitized_environment(self):
        output=self.prepare_runner()
        with patch.object(m,'fixed_root',return_value=self.root),patch.object(m,'bounded_process',return_value=(1,b'',b'')) as call,patch.dict(os.environ,{'GITHUB_OUTPUT':str(output)}):m.runner()
        args,kwargs=call.call_args
        self.assertEqual(args[0],['/usr/bin/sudo','-n','--','/usr/bin/python3','-I','-B',str(self.root/'game'/m.SCRIPT),'--root-observe'])
        self.assertEqual(args[2],8192);self.assertEqual(args[3],m.ENV);self.assertTrue(kwargs['privileged'])
        self.assertNotIn('GITHUB_OUTPUT',args[3])
    def test_stream_cap_and_deadline(self):
        with self.assertRaises(ValueError):m.bounded_process(['/usr/bin/python3','-I','-B','-c','import sys;sys.stdout.write("x"*8193)'],self.deadline,8192,m.ENV)
        with self.assertRaises(ValueError):m.bounded_process(['/usr/bin/python3','-I','-B','-c','pass'],time.monotonic()-1,8192,m.ENV)


class WorkflowTests(unittest.TestCase):
    def test_closed_workflow_and_pins(self):
        text=(SCRIPT.parents[2]/m.WORKFLOW).read_text()
        self.assertIn('diagnostic only',text);self.assertIn('timeout-minutes: 10',text)
        self.assertEqual(text.count('actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683'),2)
        self.assertEqual(text.count('persist-credentials: false'),2);self.assertEqual(text.count('fetch-depth: 0'),2)
        self.assertIn('actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',text)
        self.assertIn("always() && steps.observe.outputs.artifact_safe == 'true'",text)
        self.assertIn('sudo chown -R 1000:1000 prismpm',text)
        self.assertIn('prepare --phase image',text);self.assertIn('umask 022',text)
        self.assertIn('contents: read',text);self.assertIn('cancel-in-progress: false',text)
        paths=text.split('    paths:\n')[1].split('  workflow_dispatch:')[0]
        self.assertEqual([x.strip().strip("- '") for x in paths.strip().splitlines()],[m.WORKFLOW,m.SCRIPT,'scripts/numeric/tests/test_host_layout_diagnostic.py'])
        for forbidden in ('continue-on-error','devcontainers/ci','docker pull','cacheFrom','uses: ./','inputs:','rm -rf','needs:'):
            self.assertNotIn(forbidden,text)
    def test_observer_has_no_probe_or_source_mutation(self):
        import ast
        tree=ast.parse(SCRIPT.read_text());calls=[]
        for node in ast.walk(tree):
            if isinstance(node,ast.Call):
                f=node.func
                calls.append(f.attr if isinstance(f,ast.Attribute) else f.id if isinstance(f,ast.Name) else '')
        for name in ('setuid','setgid','setgroups','initgroups','setresuid','setresgid','access','connect','setxattr','chmod','fchmod','chown','unlink','rename','replace','rglob','glob','walk','validate_partial','bridge_privileged','bridge_admission'):
            self.assertNotIn(name,calls)
        self.assertEqual(calls.count('fchown'),1)
        self.assertNotIn('completed preflight',SCRIPT.read_text())
    def test_creation_rules_match_existing_calls(self):
        driver=(SCRIPT.parent/'candidate-capture-qualification.py').read_text()
        for fragment in ('home.mkdir(parents=True,mode=0o700)','(home/name).write_bytes(body);os.chmod(home/name,0o400)',
                         'tempfile.mkstemp(', 'os.fchmod(stream.fileno(),0o400)',
                         'folder.mkdir(parents=True,mode=0o700)',
                         "shutil.copyfile(original,destination/'copy.json');os.chmod(destination/'copy.json',0o400)",
                         'os.fchown(fd,uid,gid);os.fchmod(fd,0o700'):
            self.assertIn(fragment,driver)
        rules=m.creation_rules(m.manifest(ROOT,1001),ROOT)
        self.assertTrue(any(r['call']=='parents_intermediate' and r['mode']==0o777 for r in rules))
        self.assertTrue(any(r['call']=='copyfile' and r['later'] is None for r in rules))
        self.assertTrue(any(r['call']=='mkstemp' and r['mode']==0o600 and r['later']=='fchmod0400' for r in rules))





class SocketTests(OwnedFixture):
    def test_real_alternative_without_canonical_socket(self):
        # Real sockets and relative no-follow opens; the /var and /run names are
        # mapped to an owned fixture root, with owner expectations explicit.
        (self.root/'run').mkdir();(self.root/'var/run').mkdir(parents=True)
        sock=socket.socket(socket.AF_UNIX);sock.bind(str(self.root/'var/run/docker.sock'))
        os.chmod(self.root/'var/run/docker.sock',0o660)
        rows=self.socket_plan();record=self.record(rows);opening=os.open
        def mapped(path,flags,*args,**kwargs):
            return opening(self.root if path=='/' and kwargs.get('dir_fd') is None else path,flags,*args,**kwargs)
        stating=os.stat
        def mapped_stat(path,*args,**kwargs):return stating(self.root if path=='/' and kwargs.get('dir_fd') is None else path,*args,**kwargs)
        try:
            with patch.object(m.os,'open',side_effect=mapped),patch.object(m.os,'stat',side_effect=mapped_stat),m.Handles() as held:
                m.measure(rows,record,self.deadline,held)
            self.assertEqual(record['socket']['layout'],'real_directory');self.assertTrue(record['coverage']['complete'])
        finally:sock.close()
    def socket_plan(self):
        rows=self.plan({Path('/run/docker.sock'):('socket','alternative'),Path('/var/run/docker.sock'):('socket','alternative')})
        return rows
    def test_fixed_aliases_and_unexpected_alias(self):
        for link in ('/run','../run','../../outside'):
            with self.subTest(link=link):
                base=self.root/link.replace('/','_');base.mkdir();(base/'run').mkdir();(base/'var').mkdir()
                (base/'var/run').symlink_to(link)
                sock=socket.socket(socket.AF_UNIX);sock.bind(str(base/'run/docker.sock'));os.chmod(base/'run/docker.sock',0o660)
                rows=self.socket_plan();record=self.record(rows);opening=os.open;stating=os.stat;ident=m.identity
                alias_inode=(base/'var/run').lstat().st_ino
                def mapped(path,flags,*args,**kwargs):return opening(base if path=='/' and kwargs.get('dir_fd') is None else path,flags,*args,**kwargs)
                def mapped_stat(path,*args,**kwargs):return stating(base if path=='/' and kwargs.get('dir_fd') is None else path,*args,**kwargs)
                def projected(info):
                    value=ident(info)
                    if info.st_ino==alias_inode:value['uid']=0
                    return value
                try:
                    # Only symlink UID is projected to exercise the fixed mapping;
                    # this is explicitly not a privileged ownership witness.
                    with patch.object(m.os,'open',side_effect=mapped),patch.object(m.os,'stat',side_effect=mapped_stat),patch.object(m,'identity',side_effect=projected),m.Handles() as held:
                        m.measure(rows,record,self.deadline,held)
                    if link in ('/run','../run'):
                        self.assertTrue(record['coverage']['complete'])
                        self.assertEqual(record['nodes'][-1]['state'],'fixed_alias_mapping')
                        self.assertIsNotNone(record['socket']['mapping'])
                    else:
                        self.assertFalse(record['coverage']['complete']);self.assertEqual(record['nodes'][-1]['state'],'blocked')
                finally:sock.close()
    def test_privileged_hosted_witness_unavailable(self):
        self.skipTest('No authorized local sudo/root fixture; no privileged or hosted witness claimed')


class AuthenticationTests(OwnedFixture):
    def partial(self):
        started=time.monotonic();commit='a'*40
        return {'schema':'cs1618/candidate-capture-preparation-partial/1','status':'incomplete','phase':'image',
                'game':{'commit':commit,'tree':'b'*40},'source':{'commit':m.REVISION,'tree':m.TREE,'snapshot_manifest_sha256':'c'*64,'bundle_sha256':'d'*64,'patch_sha256':'e'*64},
                **{k:{'path':'scripts/numeric/'+v,'bytes':1,'sha256':'f'*64,'git_blob':'a'*40} for k,v in m.AUTHORITY.items()},
                'host_source':str(self.root/'prismpm'),'started':started,
                'runner':{'GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'1','GITHUB_WORKFLOW_REF':m.REPOSITORY+'/'+m.WORKFLOW+'@'+m.REF,
                          'GITHUB_WORKFLOW_SHA':commit,'GITHUB_REPOSITORY':m.REPOSITORY,'GITHUB_REF':m.REF,'RUNNER_OS':'Linux','RUNNER_ARCH':'X64','ImageOS':'ubuntu24','ImageVersion':'20261117.1'}}
    def test_new_workflow_binding_closed_and_fixed(self):
        value=self.partial();job={'monotonic':value['started']}
        self.assertEqual(m.validate_preparation(value,self.root,job),value)
        for mutation in ('old_workflow','source','phase','field','clock','sha','run'):
            p=json.loads(json.dumps(value))
            if mutation=='old_workflow':p['runner']['GITHUB_WORKFLOW_REF']=p['runner']['GITHUB_WORKFLOW_REF'].replace('host-layout-diagnostic','candidate-capture-qualification')
            if mutation=='source':p['host_source']='/arbitrary'
            if mutation=='phase':p['phase']='qualification'
            if mutation=='field':p['extra']=1
            if mutation=='clock':p['started']+=1
            if mutation=='sha':p['runner']['GITHUB_WORKFLOW_SHA']='d'*40
            if mutation=='run':p['runner']['GITHUB_RUN_ATTEMPT']='0'
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):m.validate_preparation(p,self.root,job)
    def test_authentication_reads_only_fixed_game_and_control(self):
        game=self.root/'game';game.mkdir();evidence=self.root/'evidence';evidence.mkdir(mode=0o700)
        original_root=SCRIPT.parents[2]
        fixed=[m.SCRIPT,m.WORKFLOW,'scripts/numeric/restore-prismpm-candidate.py','scripts/numeric/prismpm-capture-candidate/manifest.json',*['scripts/numeric/'+n for n in m.AUTHORITY.values()]]
        for path in fixed:
            target=game/path;target.parent.mkdir(parents=True,exist_ok=True,mode=0o755);target.write_bytes((original_root/path).read_bytes());target.chmod(0o644)
        import subprocess
        def git(*args):return subprocess.check_output(['/usr/bin/git','-C',str(game),*args],stderr=subprocess.PIPE).decode().strip()
        git('init','-q');git('add','--',*fixed);git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Owned fixture only')
        partial=self.partial();partial['game']={'commit':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}')}
        partial['runner']['GITHUB_WORKFLOW_SHA']=partial['game']['commit']
        meta=m.decode((game/'scripts/numeric/prismpm-capture-candidate/manifest.json').read_bytes())
        partial['source'].update(snapshot_manifest_sha256=m.digest((game/'scripts/numeric/prismpm-capture-candidate/manifest.json').read_bytes()),bundle_sha256=meta['bundle_sha256'],patch_sha256=meta['patch_sha256'])
        for role,name in m.AUTHORITY.items():
            path='scripts/numeric/'+name;body=(game/path).read_bytes()
            partial[role]={'path':path,'bytes':len(body),'sha256':m.digest(body),'git_blob':git('rev-parse','HEAD:'+path)}
        p=evidence/'preparation-partial.json';p.write_bytes(m.encoded(partial));p.chmod(0o400)
        # There is deliberately no source checkout, preflight ledger or original
        # source file in this fixture: authentication must not read any of them.
        with m.Custody(self.root,self.uid,self.deadline) as custody:
            context=m.authenticate(custody,{'monotonic':partial['started']},'a'*64)
            self.assertEqual(set(context['bindings']),set(fixed))
            self.assertEqual(context['game'],partial['game'])
        target=game/m.SCRIPT;target.write_bytes(target.read_bytes()+b'# changed\n')
        with m.Custody(self.root,self.uid,self.deadline) as custody:
            with self.assertRaisesRegex(ValueError,'exact_git_bytes'):m.authenticate(custody,{'monotonic':partial['started']},'a'*64)
    def test_runner_hash_join_refuses_mismatch(self):
        rows=m.manifest(ROOT,self.uid);record=m.new_record(rows,ROOT,self.uid,self.gid,{'request_sha256':'a'*64})
        record['observer']={'uid':0,'euid':0,'gid':0};body=m.fit_record(record)
        with self.assertRaisesRegex(ValueError,'runner_report_hash'):
            m.verify_layout(body,self.uid,self.gid,'a'*64,{'name':'layout.json','bytes':len(body),'sha256':'0'*64})
    def test_fixed_deadline_order_and_no_source_read_api(self):
        import ast
        tree=ast.parse(SCRIPT.read_text());root=next(x for x in tree.body if isinstance(x,ast.FunctionDef) and x.name=='root_observe')
        text=ast.get_source_segment(SCRIPT.read_text(),root)
        self.assertLess(text.index('install_alarm('),text.index('authenticate('))
        self.assertIn("deadline=min(deadline,job['monotonic']+600)",text)
        self.assertIn('deadline-3',text);self.assertIn('install_alarm(deadline-1)',text)
        self.assertNotIn("custody.read(root/'prismpm'",SCRIPT.read_text())


if __name__=='__main__':unittest.main()
