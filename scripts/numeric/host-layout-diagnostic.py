#!/usr/bin/env python3
"""Bounded host metadata observation. Every invocation exits nonacceptance (1).

No source payload reads, credential probes, ACL changes, or source writes. The
only root write is an exclusive report in the already-held runner upload dir.
"""
import base64
import ctypes
import errno
import hashlib
import json
import math
import os
from pathlib import Path
import re
import select
import signal
import stat
import struct
import subprocess
import sys
import time

SCHEMA = 'cs1618/host-layout-'
WORKFLOW = '.github/workflows/prismpm-host-layout-diagnostic.yml'
SCRIPT = 'scripts/numeric/host-layout-diagnostic.py'
REPOSITORY = 'R4-Laboratories/uor-cs1.618'
REF = 'refs/heads/numeric-kernels'
BASE = '3666dc0f9da56fcf066d96ec01cd9e14ec9a2974'
REVISION = 'f292c7100874c0e0b2d1e0e81b27caeec8391f77'
TREE = 'd48cdfd94e6d46925e9269e364c2b7a6eb975d8a'
RESTORER = '90b1fe176eaa8eebb4eb6648363308b512d9ebfd649ca010d429eebc8379450d'
AUTHORITY = {'driver':'candidate-capture-qualification.py', 'probe':'candidate-capture-probe.py',
             'subject_adapter':'candidate-capture-subject.mjs'}
BUILD_INPUTS = ('.dockerignore', '.devcontainer/devcontainer.json', '.devcontainer/Dockerfile',
                '.devcontainer/docker-entrypoint.sh', '.devcontainer/docker-ready.sh')
OPERATIONS = ('preflight-image', 'preflight-qualification', 'image-collect', 'qualification-collect')
LIMITS = {'nodes':96, 'acl_bytes':8192, 'json_bytes':65536, 'control_bytes':8192}
CONTROL = '.host-layout-diagnostic-control'
UPLOAD = 'host-layout-diagnostic'
ENV = {'PATH':'/usr/bin:/bin', 'LANG':'C.UTF-8'}
IDENTITY_FIELDS = ('dev','ino','type','uid','gid','mode','nlink','size','mtime_ns','ctime_ns')
NODE_KEYS = 'id parent name role expectation state identity access_acl default_acl blocked_by issue_ids'.split()
ACL_KEYS = 'state bytes sha256 raw_b64 version entries decode_error errno'.split()
FULL_KEYS = ('schema producer context limits timing observer runner planned actual kernel_witness '
             'creation_witness nodes acls creation_rules socket coverage issues complete_application_accepted').split()


def require(value, code):
    if not value:
        raise ValueError(code)


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True, allow_nan=False)+'\n').encode()


def digest(body):
    return hashlib.sha256(body).hexdigest()


def closed(value, fields):
    require(type(value) is dict and set(value)==set(fields.split()), 'closed_shape')
    return value


def decode(body):
    def pairs(items):
        result={}
        for key, value in items:
            require(key not in result, 'duplicate_key')
            result[key]=value
        return result
    require(body.endswith(b'\n'), 'record_lf')
    return json.loads(body.decode('utf8'), object_pairs_hook=pairs,
                      parse_constant=lambda value: (_ for _ in ()).throw(ValueError('finite_json')))


def finite(value):
    return type(value) in (int,float) and math.isfinite(value) and value>=0


def remaining(deadline):
    left=deadline-time.monotonic()
    require(left>0, 'deadline')
    return left


def identity(info):
    kind=('directory' if stat.S_ISDIR(info.st_mode) else 'file' if stat.S_ISREG(info.st_mode)
          else 'socket' if stat.S_ISSOCK(info.st_mode) else 'symlink' if stat.S_ISLNK(info.st_mode) else 'other')
    return dict(zip(IDENTITY_FIELDS, (info.st_dev,info.st_ino,kind,info.st_uid,info.st_gid,info.st_mode,
                                    info.st_nlink,info.st_size,info.st_mtime_ns,info.st_ctime_ns)))


def manifest(root, uid):
    """Literal endpoints and ancestor closure, computed before any filesystem open."""
    root=Path(root)
    require(root.is_absolute() and str(root)==os.path.normpath(str(root)) and
            len(os.fsencode(root))<=512, 'root_bound')
    game=root/'game';source=root/'prismpm';home=source/'target/candidate-qualification-driver';evidence=root/'evidence'
    endpoints={}
    def add(path, kind='file', presence='required', private=None):
        endpoints[path]={'type':kind,'presence':presence,'private':private}
    for base in (game,source):
        for name in ('HEAD','config'):add(base/'.git'/name)
        add(base/'.git/objects','directory')
    for name in (*AUTHORITY.values(), 'host-layout-diagnostic.py', 'restore-prismpm-candidate.py',
                 'prismpm-capture-candidate/manifest.json'):add(game/'scripts/numeric'/name)
    add(game/WORKFLOW)
    for name in BUILD_INPUTS:add(source/name)
    for name in ('preparation-partial.json','source-files.json','game-inputs.json',*AUTHORITY.values()):
        add(home/name,private=0o400)
    for name in ('restoration-receipt.json','snapshot-manifest.json'):add(home/name)
    for name in ('metadata','raw'):add(home/name,'directory','future',0o700)
    add(home/'collection-clock.json','file','future',0o400)
    for operation in OPERATIONS:
        base=home/'host-bridge'/operation
        add(base/'metadata-upload/bridge-context.json','file','future',0o400)
        if operation.startswith('preflight-'):
            add(base/'original.json','file','future',0o400)
            add(base/'metadata-upload/copy.json','file','future',0o400)
    for name in ('job-start.json','preparation-partial.json','restoration-receipt.json'):add(evidence/name)
    for name in ('host-bridge','.host-bridge-root','metadata-upload','preflight-upload','raw-upload'):
        add(evidence/name,'directory','future',0o700)
    add(evidence/CONTROL/'request.json',private=0o400)
    add(evidence/UPLOAD,'directory',private=0o700)
    for path in (Path('/run/docker.sock'),Path('/var/run/docker.sock')):add(path,'socket','alternative')
    paths=set(endpoints)
    for path in list(paths):paths.update(path.parents)
    require(len(paths)<=96, 'node_limit')
    rows=[]
    for path in sorted(paths,key=lambda p:(len(p.parts),str(p))):
        expectation=endpoints.get(path,{'type':'directory','presence':'required','private':None}).copy()
        if path==home or path==evidence/CONTROL:expectation['private']=0o700
        if path==home/'host-bridge' or home/'host-bridge' in path.parents:
            expectation['presence']='future'
            if expectation['type']=='directory' and path!=home/'host-bridge':expectation['private']=0o700
        expectation['owners']=([1000] if path==source or source in path.parents else
                               [0] if path==evidence/'.host-bridge-root' or path in (Path('/run'),Path('/var'),Path('/var/run'),Path('/run/docker.sock'),Path('/var/run/docker.sock')) else
                               [uid] if path==game or game in path.parents or path==evidence or evidence in path.parents else sorted(set((0,uid))))
        rows.append({'id':str(path),'parent':None if path==Path('/') else str(path.parent), 'name':path.name or '/',
                     'role':'socket_layout' if str(path) in ('/run','/var','/var/run','/run/docker.sock','/var/run/docker.sock') else
                     'source' if path==source or source in path.parents else 'game' if path==game or game in path.parents else
                     'root_ledger' if path==evidence/'.host-bridge-root' else
                     'runner' if path==evidence or evidence in path.parents else 'ancestor',
                     'expectation':expectation,'state':'unmeasured','identity':None,'access_acl':None,
                     'default_acl':None,'blocked_by':None,'issue_ids':[]})
    return rows


def acl_empty(state, size=None, error=None):
    return dict(zip(ACL_KEYS,(state,size,None,None,None,None,None,error)))


def acl_error(code):
    return acl_empty('absent' if code==errno.ENODATA else 'unavailable',error=code)


def acl_record(raw):
    if len(raw)>8192:return acl_empty('oversize',len(raw))
    result=acl_empty('present',len(raw))
    result.update(sha256=digest(raw),raw_b64=base64.b64encode(raw).decode())
    try:
        require(len(raw)>=4 and (len(raw)-4)%8==0,'length')
        version=struct.unpack_from('<I',raw)[0];result['version']=version
        entries=[list(x) for x in struct.iter_unpack('<HHI',raw[4:])];result['entries']=entries
        require(version==2,'version')
        tags=[x[0] for x in entries];undefined=0xffffffff
        require(all(t in (1,2,4,8,16,32) and 0<=p<=7 and
                    ((i!=undefined) if t in (2,8) else (i==undefined)) for t,p,i in entries),'entry')
        require(all(tags.count(t)==1 for t in (1,4,32)) and tags.count(16)<=1,'base_entries')
        require(not any(t in (2,8) for t in tags) or tags.count(16)==1,'mask')
        require(tags==sorted(tags) and len({(t,i) for t,p,i in entries})==len(entries),'order_or_duplicate')
        for tag in (2,8):
            ids=[i for t,p,i in entries if t==tag]
            require(ids==sorted(ids),'id_order')
    except ValueError as error:result['decode_error']=str(error)
    return result


_LIBC=ctypes.CDLL(None,use_errno=True)
_GETXATTR=_LIBC.getxattr
_GETXATTR.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_void_p,ctypes.c_size_t]
_GETXATTR.restype=ctypes.c_ssize_t


def native_acl(fd, name):
    """The sole ACL API: bounded native getxattr through a joined kernel fd handle."""
    path=('/proc/self/fd/'+str(fd)).encode();before=identity(os.fstat(fd))
    try:
        require(identity(os.stat(path))==before,'procfd_join')
        length=_GETXATTR(path,name.encode(),None,0)
        if length<0:return acl_error(ctypes.get_errno())
        if length>8192:return acl_empty('oversize',length)
        # A zero-sized result still uses a nonzero capacity, so growth is detected.
        capacity=max(1,length);buffer=ctypes.create_string_buffer(capacity)
        actual=_GETXATTR(path,name.encode(),buffer,capacity)
        if actual<0:
            code=ctypes.get_errno()
            result=acl_error(code)
            if code==errno.ERANGE:result.update(state='oversize',bytes=length,decode_error='growth')
            return result
        if actual!=length:
            result=acl_empty('unavailable',actual);result['decode_error']='growth';return result
        require(identity(os.fstat(fd))==before==identity(os.stat(path)),'procfd_changed')
        return acl_record(buffer.raw[:actual])
    except OSError as error:return acl_error(error.errno)
    except ValueError as error:
        result=acl_empty('unavailable');result['decode_error']=str(error);return result


def supported(acl):
    return acl['state']=='absent' or (acl['state']=='present' and acl['decode_error'] is None)


def acl_pair(fd, kind):
    if kind=='symlink':return (acl_empty('not_inspected'),acl_empty('not_inspected'))
    return native_acl(fd,'system.posix_acl_access'), (native_acl(fd,'system.posix_acl_default')
                                                    if kind=='directory' else acl_empty('not_applicable'))


def structure(row, info):
    want=row['expectation'];mode=stat.S_IMODE(info['mode'])
    return (info['type']==want['type'] and info['uid'] in want['owners'] and
            (info['type']!='file' or info['nlink']==1) and
            (mode==want['private'] if want['private'] is not None else
             not (mode & (0o7002 if info['type']=='socket' else 0o7022))))


class Handles:
    """All descriptors remain live until their full parent/name/ACL joins finish."""
    def __init__(self):self.items={}
    def hold(self,path,parent=None,name=None):
        path=str(path);name=name or path
        fd=os.open(name,os.O_PATH|os.O_NOFOLLOW,dir_fd=parent)
        try:
            value=identity(os.fstat(fd))
            require(value==identity(os.stat(name,dir_fd=parent,follow_symlinks=False)),'name_changed')
        except BaseException:os.close(fd);raise
        self.items[path]={'fd':fd,'parent':parent,'name':name,'identity':value}
        return self.items[path]
    def join(self,item, timestamps=True):
        held=identity(os.fstat(item['fd']))
        named=identity(os.stat(item['name'],dir_fd=item['parent'],follow_symlinks=False))
        before=item['identity']
        keys=IDENTITY_FIELDS if timestamps else ('dev','ino','type','uid','gid','mode','nlink')
        require(all(held[k]==named[k]==before[k] for k in keys),'identity_changed')
        return held
    def close(self):
        for item in reversed(list(self.items.values())):os.close(item['fd'])
        self.items.clear()
    def __enter__(self):return self
    def __exit__(self,*unused):self.close()


def coverage(record):
    states=[r['state'] for r in record['nodes']]
    measured=sum(s in ('measured','fixed_alias_mapping') for s in states)
    absent=states.count('absent_expected')+states.count('absent_alternative')
    blocked=sum(s.startswith('blocked') for s in states)
    unmeasured=states.count('unmeasured')
    return {'expected':len(states),'accounted':len(states)-unmeasured,'measured':measured,
            'absent':absent,'blocked':blocked,'unmeasured':unmeasured,
            'complete':not record['issues'] and not unmeasured and
            all(s in ('measured','fixed_alias_mapping','absent_expected','absent_alternative','blocked_expected_absence') for s in states)}


def issue(record,node,stage,code,error=None,syscall=None):
    # At most one issue per node per stage, plus fixed global stages; never discard
    # a failed prefix silently. Counts remain explicit if the reserve is exhausted.
    value={'node':node,'stage':stage,'syscall':syscall,'errno':error,'code':code}
    for n,old in enumerate(record['issues']):
        if old==value:return n
    if len(record['issues'])>=192:
        record['timing']['issue_overflow']=record['timing'].get('issue_overflow',0)+1
        return None
    record['issues'].append(value)
    return len(record['issues'])-1


def creation_rules(rows, root):
    ids={r['id']:i for i,r in enumerate(rows)};h=root/'prismpm/target/candidate-qualification-driver';e=root/'evidence'
    def rule(actor,parent,children,call,mode,later=None):
        return {'actor':actor,'parent':ids[str(parent)],'parent_default':'default_acl',
                'children':children,'call':call,'mode':mode,'later':later,
                'inheritance':'unknown','actual':None,'creation_witness':None}
    out=[rule('runner_then_source1000',h.parent,'candidate-qualification-driver','mkdir',0o700),
         rule('runner_then_source1000',h.parent.parent,'target','parents_intermediate',0o777),
         rule('runner_then_source1000',h,'authority A','write_bytes',0o666,'chmod0400'),
         rule('runner_then_source1000',h,'preparation-partial.json,source-files.json,game-inputs.json','open_exclusive',0o400),
         rule('source1000',h,'JSON replacement','mkstemp',0o600,'fchmod0400'),
         rule('runner_then_source1000',h,'restoration-receipt.json,snapshot-manifest.json','copyfile',0o666),
         rule('source1000',h,'metadata,raw','mkdir',0o700),
         rule('root',e,'.host-bridge-root','mkdir',0o700),
         rule('runner',e,'host-bridge','mkdir',0o700),
         rule('runner',e/'host-bridge','operation.request.json,operation.admission.json,operation.status.json','open_exclusive',0o400),
         rule('root',e/'.host-bridge-root','operation.json','open_exclusive',0o400),
         rule('runner',e,CONTROL+','+UPLOAD,'mkdir',0o700),
         rule('runner',e/CONTROL,'request.json','open_exclusive',0o400),
         rule('root_then_runner',e/UPLOAD,'layout.json','open_exclusive',0o400,'fchown_runner'),
         rule('runner',e/UPLOAD,'status.json','open_exclusive',0o400)]
    for op in OPERATIONS:
        base=h/'host-bridge'/op
        out.extend([rule('source1000',base.parent,op,'mkdir',0o700),
                    rule('source1000',h,'host-bridge','parents_intermediate',0o777),
                    rule('source1000',base,'metadata-upload','mkdir',0o700),
                    rule('source1000',base/'metadata-upload','bridge-context.json','open_exclusive',0o400),
                    rule('root_then_runner',base,'metadata-upload and copies','handoff',None,'fchown_then_fchmod_dirs0700_files0400')])
        if op.startswith('preflight-'):
            out.extend([rule('source1000',base,'original.json','open_exclusive',0o400),
                        rule('source1000',base/'metadata-upload','copy.json','copyfile',0o666,'chmod0400')])
    return out


def new_record(rows,root,uid,gid,context=None,producer='root_observer'):
    nodes=[];ids={r['id']:i for i,r in enumerate(rows)}
    for i,row in enumerate(rows):
        value=row.copy();value.update(id=i,parent=ids.get(row['parent']))
        nodes.append(value)
    return {'schema':SCHEMA+'observation/1','producer':producer,'context':context,'limits':LIMITS.copy(),
            'timing':{'started':time.monotonic(),'finished':None},
            'observer':{'uid':os.getuid(),'euid':os.geteuid(),'gid':os.getgid()} if producer=='root_observer' else None,
            'runner':{'uid':uid,'gid':gid},'planned':None,'actual':None,'kernel_witness':None,'creation_witness':None,
            'nodes':nodes,'acls':[],'creation_rules':creation_rules(rows,root),'socket':{'layout':None,'link':None,'mapping':None},
            'coverage':{},'issues':[],'complete_application_accepted':False}


def retain_acl(record, value):
    for index,existing in enumerate(record['acls']):
        if existing==value:return index
    record['acls'].append(value)
    return len(record['acls'])-1


def fit_record(record):
    """Preserve all rows/failures; omit ACL expansions with explicit byte/hash data."""
    record['coverage']=coverage(record)
    # Reserve 2 KiB for coverage/timing and late failure counts before publication.
    if len(encoded(record))>63500:
        for value in sorted(record['acls'],key=lambda x:len(encoded(x)),reverse=True):
            if value['raw_b64'] is None and value['entries'] is None:continue
            value.update(state='omitted',raw_b64=None,entries=None)
            issue(record,None,'encoding','acl_table_overflow')
            record['coverage']=coverage(record)
            if len(encoded(record))<=63500:break
    body=encoded(record)
    require(len(body)<=65536,'full_json_limit')
    return body


def measure(rows, record, deadline, handles):
    ids={r['id']:i for i,r in enumerate(rows)};raw_acls={};alias=None
    for i,specification in enumerate(rows):
        row=record['nodes'][i];path=specification['id'];parent=specification['parent']
        if time.monotonic()>=deadline:
            issue(record,i,'measurement','deadline');break
        if parent is not None:
            parent_row=record['nodes'][ids[parent]]
            if parent_row['state'] not in ('measured','fixed_alias_mapping'):
                expected=parent_row['state'] in ('absent_expected','blocked_expected_absence')
                row.update(state='blocked_expected_absence' if expected else 'blocked',blocked_by=ids[parent])
                continue
        parentfd=handles.items[parent]['fd'] if parent is not None else None
        try:
            if path=='/var/run/docker.sock' and alias is not None:
                target=record['nodes'][ids['/run/docker.sock']]
                if target['state']=='measured':
                    handles.join(handles.items['/var/run']);handles.join(handles.items['/run/docker.sock'])
                    require(os.readlink('run',dir_fd=handles.items['/var']['fd'])==alias,'alias_changed')
                    row.update(state='fixed_alias_mapping',identity=target['identity'],access_acl=target['access_acl'],default_acl=target['default_acl'])
                    record['socket']['mapping']={'logical':i,'canonical':ids['/run/docker.sock']}
                else:
                    row.update(state='blocked',blocked_by=ids['/run/docker.sock'])
                    issue(record,i,'socket','canonical_unavailable')
                continue
            held=handles.hold(path,parentfd,row['name'] if parent is not None else '/')
            row['identity']=held['identity'];kind=held['identity']['type']
            pair=acl_pair(held['fd'],kind);raw_acls[path]=pair
            row['access_acl'],row['default_acl']=[retain_acl(record,a) for a in pair]
            if path=='/var/run' and kind=='symlink':
                link=os.readlink('run',dir_fd=parentfd)
                require(held['identity']['uid']==0 and link in ('/run','../run'),'unsafe_alias')
                record['socket'].update(layout='fixed_alias_mapping',link={'raw_b64':base64.b64encode(os.fsencode(link)).decode(),'bytes':len(os.fsencode(link))})
                alias=link;row['state']='fixed_alias_mapping'
            else:
                require(structure(specification,held['identity']),'unsafe_structure')
                row['state']='measured'
                if path=='/var/run':record['socket']['layout']='real_directory'
            handles.join(held)
            require(acl_pair(held['fd'],kind)==pair,'acl_changed')
            handles.join(held)
            for a in pair:
                if not supported(a) and a['state'] not in ('not_applicable','not_inspected'):
                    n=issue(record,i,'acl','unsupported_acl',a['errno'],'getxattr');row['issue_ids'].append(n)
        except FileNotFoundError as error:
            expected=specification['expectation']['presence']
            row['state']='absent_expected' if expected=='future' else 'absent_alternative' if expected=='alternative' else 'missing_required'
            if expected=='required':row['issue_ids'].append(issue(record,i,'open','missing_required',error.errno,'openat'))
        except (OSError,ValueError) as error:
            row['state']='unsafe';row['issue_ids'].append(issue(record,i,'measurement',str(error) if isinstance(error,ValueError) else 'syscall',getattr(error,'errno',None),'metadata'))
    # Full ancestry/ctime/ACL rejoin, including held unsafe nodes. These checks
    # occur while every parent and child descriptor still belongs to this pass.
    for path,held in handles.items.items():
        i=ids[path];row=record['nodes'][i]
        if time.monotonic()>=deadline:
            issue(record,i,'recheck','deadline');break
        try:
            handles.join(held)
            require(acl_pair(held['fd'],held['identity']['type'])==raw_acls[path],'acl_changed')
            handles.join(held)
            if path=='/var/run' and alias is not None:
                require(os.readlink('run',dir_fd=handles.items['/var']['fd'])==alias,'alias_changed')
        except (OSError,ValueError) as error:
            row['state']='unstable';row['issue_ids'].append(issue(record,i,'recheck',str(error) if isinstance(error,ValueError) else 'syscall',getattr(error,'errno',None),'metadata'))
    # Conditional socket alternative: canonical absence is harmless only when
    # the real /var/run branch supplied the independently measured socket.
    if '/var/run/docker.sock' in ids and '/run/docker.sock' in ids:
        target=record['nodes'][ids['/var/run/docker.sock'] if record['socket']['layout']=='real_directory' else ids['/run/docker.sock']]
        if target['state']!='measured':issue(record,target['id'],'socket','no_measured_socket')
    record['timing']['finished']=time.monotonic()
    return fit_record(record)


class Custody:
    """Held public-authority/control paths, independent of the source observer."""
    def __init__(self,root,uid,deadline):
        self.root=Path(root);self.uid=uid;self.deadline=deadline;self.handles=Handles();self.acls={}
    def directory(self,path,private=False):
        remaining(self.deadline);path=Path(path)
        if str(path) not in self.handles.items:
            parent=None if path==Path('/') else self.directory(path.parent)['fd']
            item=self.handles.hold(path,parent,path.name if parent is not None else '/')
            value=item['identity']
            require(value['type']=='directory' and value['uid'] in (0,self.uid) and not value['mode']&0o7022,'safe_authority_ancestry')
            pair=acl_pair(item['fd'],'directory')
            require(all(supported(a) for a in pair),'supported_authority_acl')
            self.acls[str(path)]=pair
        item=self.handles.items[str(path)]
        self.handles.join(item)
        if private:
            require(item['identity']['uid']==self.uid and stat.S_IMODE(item['identity']['mode'])==0o700,'private_runner_directory')
            require(private_acl(self.acls[str(path)][0],0o700),'private_directory_acl')
        return item
    def rejoin(self):
        remaining(self.deadline)
        for path,item in self.handles.items.items():
            self.handles.join(item)
            require(acl_pair(item['fd'],'directory')==self.acls[path],'authority_acl_changed')
            self.handles.join(item)
    def created_file(self,path):
        """Rejoin an intentional create without erasing prepublication metadata."""
        remaining(self.deadline);item=self.handles.items[str(path)]
        current=self.handles.join(item,timestamps=False)
        require(acl_pair(item['fd'],'directory')==self.acls[str(path)],'publication_parent_acl_changed')
        require(current==identity(os.fstat(item['fd']))==identity(os.stat(item['name'],dir_fd=item['parent'],follow_symlinks=False)),'publication_parent_changed')
        item['identity']=current
    def read(self,path,limit,private=False):
        path=Path(path);parent=self.directory(path.parent)
        body,ident=read_at(parent['fd'],path.name,self.uid,limit,self.deadline,private)
        self.rejoin()
        return body,ident
    def close(self):self.handles.close()
    def __enter__(self):return self
    def __exit__(self,*unused):self.close()


def private_acl(value,mode):
    if value['state']=='absent':return True
    if not supported(value):return False
    entries={tag:perm for tag,perm,unused in value['entries'] if tag not in (2,8)}
    # This establishes private publication only. It does not select source
    # credentials or compute any caller's source access permissions.
    return entries.get(1)==(mode>>6)&7 and entries.get(32)==0 and entries.get(16,entries.get(4))==0


def read_at(parent,name,uid,limit,deadline,private=True):
    remaining(deadline)
    fd=os.open(name,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=parent)
    try:
        before=identity(os.fstat(fd));mode=stat.S_IMODE(before['mode'])
        require(before['type']=='file' and before['uid']==uid and before['nlink']==1 and
                0<=before['size']<=limit and (mode==0o400 if private else not mode&0o7022),'bounded_owned_record')
        pair=acl_pair(fd,'file')
        require(supported(pair[0]) and (not private or private_acl(pair[0],0o400)),'supported_record_acl')
        chunks=[];size=0
        while True:
            remaining(deadline);chunk=os.read(fd,min(8192,limit+1-size))
            if not chunk:break
            chunks.append(chunk);size+=len(chunk);require(size<=limit,'record_limit')
        body=b''.join(chunks)
        require(len(body)==before['size'] and before==identity(os.fstat(fd))==identity(os.stat(name,dir_fd=parent,follow_symlinks=False)),'record_changed')
        require(acl_pair(fd,'file')==pair,'record_acl_changed')
        require(before==identity(os.fstat(fd))==identity(os.stat(name,dir_fd=parent,follow_symlinks=False)),'record_changed')
        return body,before
    finally:os.close(fd)


def publish(custody,upload,body,uid,gid,root=False,name='layout.json'):
    require(name in (('layout.json',) if root else ('request.json','layout.json','status.json')),'fixed_publication')
    limit=65536 if name=='layout.json' else 8192
    require(len(body)<=limit,'publication_limit');remaining(custody.deadline)
    parent=custody.directory(upload,private=True);custody.rejoin()
    fd=os.open(name,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o400,dir_fd=parent['fd'])
    try:
        require(os.write(fd,body)==len(body),'short_publication')
        if root:os.fchown(fd,uid,gid)
        before=identity(os.fstat(fd))
        require(before['uid']==uid and before['gid']==gid and before['type']=='file' and before['nlink']==1 and stat.S_IMODE(before['mode'])==0o400,'publication_identity')
        pair=acl_pair(fd,'file');require(supported(pair[0]) and private_acl(pair[0],0o400),'publication_acl')
        custody.created_file(upload)
        custody.rejoin()
        require(before==identity(os.fstat(fd))==identity(os.stat(name,dir_fd=parent['fd'],follow_symlinks=False)),'publication_changed')
        require(acl_pair(fd,'file')==pair,'publication_acl_changed')
    finally:os.close(fd)
    # Both root and actual runner re-read their fixed publication; only runner
    # readback below is allowed to authorize the upload Boolean.
    actual,ident=read_at(parent['fd'],name,uid,limit,custody.deadline)
    require(actual==body,'publication_bytes_changed');custody.rejoin()
    return ident


def bounded_process(argv,deadline,stdout_limit,environment,cwd=None,privileged=False):
    remaining(deadline)
    child=subprocess.Popen(argv,cwd=cwd,env=environment,stdin=subprocess.DEVNULL,
                           stdout=subprocess.PIPE,stderr=subprocess.PIPE,close_fds=True,
                           start_new_session=not privileged)
    streams={child.stdout:bytearray(),child.stderr:bytearray()};active=set(streams)
    try:
        while active:
            left=remaining(deadline)
            for stream in select.select(list(active),[],[],min(left,0.05))[0]:
                limit=stdout_limit if stream is child.stdout else 8192
                chunk=os.read(stream.fileno(),min(8192,limit+1-len(streams[stream])))
                if chunk:streams[stream].extend(chunk)
                else:active.remove(stream)
                require(len(streams[stream])<=limit,'control_stream_limit')
        code=child.wait(timeout=remaining(deadline))
        return code,bytes(streams[child.stdout]),bytes(streams[child.stderr])
    finally:
        if not privileged and child.poll() is None:
            try:os.killpg(child.pid,signal.SIGKILL)
            except ProcessLookupError:pass
            child.wait(timeout=max(0.001,deadline-time.monotonic()))
        elif privileged and child.poll() is None:
            # Root owns the earlier D-1 alarm. Runner cannot attest to killing it.
            try:child.wait(timeout=max(0.001,deadline-time.monotonic()))
            except subprocess.TimeoutExpired:pass
        for stream in streams:stream.close()


def git(game,args,deadline,limit=1024*1024):
    environment={**ENV,'GIT_OPTIONAL_LOCKS':'0','GIT_CONFIG_GLOBAL':'/dev/null',
                 'GIT_CONFIG_NOSYSTEM':'1','GIT_TERMINAL_PROMPT':'0'}
    code,out,err=bounded_process(['/usr/bin/git','--no-replace-objects','-c','core.fsmonitor=false',
                                 '-c','core.hooksPath=/dev/null','-c','safe.directory='+str(game),
                                 '-C',str(game),*args],deadline,limit,environment)
    require(code==0,'fixed_git_failed')
    return out


def validate_preparation(value,root,job):
    """Independent new-workflow binding; never calls the old partial validator."""
    closed(value,'schema status phase game source driver probe subject_adapter host_source started runner')
    require(value['schema']=='cs1618/candidate-capture-preparation-partial/1' and value['status']=='incomplete' and
            value['phase']=='image' and finite(value['started']) and value['started']==job['monotonic'] and
            value['host_source']==str(root/'prismpm'),'preparation_context')
    closed(value['game'],'commit tree');closed(value['source'],'commit tree snapshot_manifest_sha256 bundle_sha256 patch_sha256')
    for key in ('commit','tree'):require(type(value['game'][key]) is str and re.fullmatch('[0-9a-f]{40}',value['game'][key]),'game_identity')
    require(value['source']['commit']==REVISION and value['source']['tree']==TREE,'source_identity')
    for key in ('snapshot_manifest_sha256','bundle_sha256','patch_sha256'):
        require(type(value['source'][key]) is str and re.fullmatch('[0-9a-f]{64}',value['source'][key]),'source_digest')
    runner=value['runner'];closed(runner,'GITHUB_RUN_ID GITHUB_RUN_ATTEMPT GITHUB_WORKFLOW_REF GITHUB_WORKFLOW_SHA GITHUB_REPOSITORY GITHUB_REF RUNNER_OS RUNNER_ARCH ImageOS ImageVersion')
    require(runner['GITHUB_REPOSITORY']==REPOSITORY and runner['GITHUB_REF']==REF and
            runner['GITHUB_WORKFLOW_REF']==REPOSITORY+'/'+WORKFLOW+'@'+REF and
            runner['GITHUB_WORKFLOW_SHA']==value['game']['commit'] and runner['RUNNER_OS']=='Linux' and
            runner['RUNNER_ARCH']=='X64','new_workflow_context')
    for key in ('GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT'):
        require(type(runner[key]) is str and re.fullmatch('[1-9][0-9]{0,19}',runner[key]),'run_identity')
    for key in ('ImageOS','ImageVersion'):require(type(runner[key]) is str and 0<len(runner[key])<=128,'image_identity')
    for role,name in AUTHORITY.items():
        item=value[role];closed(item,'path git_blob sha256 bytes')
        require(item['path']=='scripts/numeric/'+name and type(item['bytes']) is int and 0<item['bytes']<=1024*1024 and
                type(item['git_blob']) is str and re.fullmatch('[0-9a-f]{40}',item['git_blob']) and
                type(item['sha256']) is str and re.fullmatch('[0-9a-f]{64}',item['sha256']),'authority_binding')
    return value


def authenticate(custody,job,request_hash):
    root=custody.root;game=root/'game'
    body,unused=custody.read(root/'evidence/preparation-partial.json',8192)
    partial=validate_preparation(decode(body),root,job);commit=partial['game']['commit']
    require(git(game,['rev-parse','HEAD'],custody.deadline,128).decode().strip()==commit,'game_head')
    require(git(game,['rev-parse','HEAD^{tree}'],custody.deadline,128).decode().strip()==partial['game']['tree'],'game_tree')
    bindings={}
    fixed=[(SCRIPT,1024*1024),(WORKFLOW,65536),('scripts/numeric/restore-prismpm-candidate.py',1024*1024),
           ('scripts/numeric/prismpm-capture-candidate/manifest.json',8192)]
    fixed.extend(('scripts/numeric/'+name,1024*1024) for name in AUTHORITY.values())
    for path,limit in fixed:
        local,unused=custody.read(game/path,limit)
        original=git(game,['show',commit+':'+path],custody.deadline,limit)
        require(local==original,'exact_git_bytes')
        bindings[path]={'bytes':len(local),'sha256':digest(local)}
        role=next((k for k,v in AUTHORITY.items() if path=='scripts/numeric/'+v),None)
        if role is not None:
            require(partial[role]['sha256']==digest(local) and partial[role]['bytes']==len(local) and
                    git(game,['rev-parse',commit+':'+path],custody.deadline,128).decode().strip()==partial[role]['git_blob'],'authority_join')
        if path.endswith('/restore-prismpm-candidate.py'):require(digest(local)==RESTORER,'restorer_pin')
        if path.endswith('/manifest.json'):
            meta=decode(local);closed(meta,'schema source base candidate tree bundle_sha256 patch_sha256')
            require(meta['schema']=='cs1618/prismpm-diagnostic/1' and meta['source']=='https://github.com/UOR-Foundation/prismpm' and
                    (meta['base'],meta['candidate'],meta['tree'])==(BASE,REVISION,TREE) and
                    digest(local)==partial['source']['snapshot_manifest_sha256'] and
                    all(meta[k]==partial['source'][k] for k in ('bundle_sha256','patch_sha256')),'manifest_join')
    custody.rejoin()
    return {'repository':REPOSITORY,'ref':REF,'game':partial['game'],'run':partial['runner'],
            'source':partial['source'],'preparation_sha256':digest(body),'request_sha256':request_hash,
            'bindings':bindings,'job_started':job['monotonic']}


def alarm(signum,frame):
    raise TimeoutError('absolute_deadline')


def install_alarm(deadline):
    remaining(deadline)
    for sig in (signal.SIGALRM,signal.SIGTERM,signal.SIGINT):signal.signal(sig,alarm)
    signal.setitimer(signal.ITIMER_REAL,max(0.001,deadline-time.monotonic()))


def fixed_root():
    root=Path.cwd()
    require(root.is_absolute() and root.resolve()==root and Path(__file__).absolute()==root/'game'/SCRIPT,'fixed_cwd_script')
    return root


def control(deadline=None,request_hash=None):
    return {'schema':SCHEMA+'control/1','exit':1,'observation':'incomplete','deadline':deadline,
            'request_sha256':request_hash,'report':None,'first_issue':None,'counts':None,
            'planned':None,'actual':None,'complete_application_accepted':False}


def root_observe():
    summary=control();custody=None;request_handles=Handles()
    try:
        # A short startup alarm precedes authentication; the request subsequently
        # supplies the original absolute budget, never a fresh thirty seconds.
        install_alarm(time.monotonic()+5)
        require(os.getuid()==os.geteuid()==0,'root_identity')
        uid_text=os.environ.get('SUDO_UID','');gid_text=os.environ.get('SUDO_GID','')
        require(re.fullmatch('[1-9][0-9]{0,9}',uid_text) and re.fullmatch('[0-9]{1,10}',gid_text),'sudo_identity')
        uid=int(uid_text);gid=int(gid_text);require(uid<2**32-1 and gid<2**32-1,'sudo_id_bounds')
        os.environ.clear();os.environ.update(ENV)
        root=fixed_root();rows=manifest(root,uid)
        custody=Custody(root,uid,time.monotonic()+5)
        custody.directory(root/'evidence'/CONTROL,True);custody.directory(root/'evidence'/UPLOAD,True)
        raw,request_identity=custody.read(root/'evidence'/CONTROL/'request.json',4096,True)
        request_held=request_handles.hold(root/'evidence'/CONTROL/'request.json',
                                          custody.directory(root/'evidence'/CONTROL,True)['fd'],'request.json')
        require(request_held['identity']==request_identity,'held_request_join')
        request_acls=acl_pair(request_held['fd'],'file')
        request=decode(raw);closed(request,'schema operation uid gid started')
        require(request['schema']==SCHEMA+'request/1' and request['operation']=='observe' and
                type(request['uid']) is int and type(request['gid']) is int and request['uid']==uid and request['gid']==gid and
                finite(request['started']) and 0<=time.monotonic()-request['started']<5,'fresh_runner_request')
        request_hash=digest(raw);deadline=request['started']+30
        custody.deadline=deadline-1;install_alarm(deadline-1)
        job_raw,unused=custody.read(root/'evidence/job-start.json',4096)
        job=decode(job_raw);closed(job,'monotonic')
        require(finite(job['monotonic']) and job['monotonic']<=request['started'],'job_clock')
        deadline=min(deadline,job['monotonic']+600);summary=control(deadline,request_hash)
        custody.deadline=deadline-1;install_alarm(deadline-1)
        context=authenticate(custody,job,request_hash)
        record=new_record(rows,root,uid,gid,context)
        record['timing'].update(deadline=deadline,measurement_deadline=deadline-3)
        with Handles() as handles:body=measure(rows,record,deadline-3,handles)
        remaining(deadline-1)
        request_handles.join(request_held)
        require(acl_pair(request_held['fd'],'file')==request_acls,'request_acl_changed')
        request_handles.join(request_held)
        publish(custody,root/'evidence'/UPLOAD,body,uid,gid,root=True)
        summary.update(observation='complete' if record['coverage']['complete'] else 'incomplete',
                       report={'name':'layout.json','bytes':len(body),'sha256':digest(body)},
                       first_issue=record['issues'][0] if record['issues'] else None,counts=record['coverage'])
    except BaseException as error:
        summary['first_issue']={'node':None,'stage':'root','syscall':None,'errno':getattr(error,'errno',None),
                                'code':str(error)[:120] if isinstance(error,(ValueError,TimeoutError)) else type(error).__name__}
    finally:
        request_handles.close()
        if custody is not None:custody.close()
        signal.setitimer(signal.ITIMER_REAL,0)
    body=encoded(summary)
    require(len(body)<=8192,'control_limit')
    sys.stdout.buffer.write(body);sys.stdout.buffer.flush()
    return 1


def validate_first_issue(value):
    """Closed <=512-byte root issue, with numeric node/errno and plain tokens.

    Node is null or integer0..95, errno null or integer1..4095 (no booleans).
    Stage is1..32 ASCII identifier characters; syscall is null or a1..64 token;
    code is a1..128 token. Tokens cannot carry nested JSON/error serialization.
    """
    if value is None:return None
    closed(value,'node stage syscall errno code')
    require(value['node'] is None or type(value['node']) is int and 0<=value['node']<96,'control_issue_node')
    require(value['errno'] is None or type(value['errno']) is int and 1<=value['errno']<=4095,'control_issue_errno')
    require(type(value['stage']) is str and re.fullmatch('[a-z][a-z0-9_]{0,31}',value['stage']),'control_issue_stage')
    require(value['syscall'] is None or type(value['syscall']) is str and
            re.fullmatch('[A-Za-z0-9_.:-]{1,64}',value['syscall']),'control_issue_syscall')
    require(type(value['code']) is str and re.fullmatch('[A-Za-z0-9_:-]{1,128}',value['code']),'control_issue_code')
    require(len(encoded(value))<=512,'control_issue_limit')
    return value


def root_refusal(summary):
    """Only after validate_control: closed <=1KiB status.error provenance.

    Six exact keys: constant schema/provenance/runner_error strings, the joined
    SHA256 request string and finite numeric deadline, and validated first_issue
    (null or the closed <=512-byte record). This describes the returned control,
    not authenticated source/layout facts. Fallback observer/context stay null.
    """
    value={'schema':SCHEMA+'root-refusal/1','provenance':'validated_root_control',
           'runner_error':'root_no_report','request_sha256':summary['request_sha256'],
           'deadline':summary['deadline'],'first_issue':summary['first_issue']}
    require(len(encoded(value))<=1024,'root_refusal_limit')
    return value


def validate_control(value,code,deadline,request_hash):
    closed(value,'schema exit observation deadline request_sha256 report first_issue counts planned actual complete_application_accepted')
    require(len(encoded(value))<=8192,'control_limit')
    require(value['schema']==SCHEMA+'control/1' and type(value['exit']) is int and type(code) is int and code==value['exit']==1 and
            value['planned'] is None and value['actual'] is None and value['complete_application_accepted'] is False and
            value['observation'] in ('complete','incomplete'),'root_control')
    require(finite(value['deadline']) and value['deadline']==deadline and
            type(value['request_sha256']) is str and re.fullmatch('[0-9a-f]{64}',value['request_sha256']) and
            value['request_sha256']==request_hash,'control_clock_request')
    validate_first_issue(value['first_issue'])
    if value['report'] is not None:
        closed(value['report'],'name bytes sha256')
        require(value['report']['name']=='layout.json' and type(value['report']['bytes']) is int and
                0<value['report']['bytes']<=65536 and type(value['report']['sha256']) is str and
                re.fullmatch('[0-9a-f]{64}',value['report']['sha256']),'control_report')
        counts=value['counts'];closed(counts,'expected accounted measured absent blocked unmeasured complete')
        require(all(type(counts[k]) is int and 0<=counts[k]<=96 for k in counts if k!='complete') and
                type(counts['complete']) is bool and counts['accounted']+counts['unmeasured']==counts['expected'] and
                counts['measured']+counts['absent']+counts['blocked']<=counts['accounted'] and
                counts['complete']==(value['observation']=='complete'),'control_counts')
    else:
        require(value['observation']=='incomplete' and value['counts'] is None,'control_no_report')
    return value


def verify_layout(body,uid,gid,request_hash,root_report):
    require(len(body)<=65536,'layout_limit');value=decode(body)
    require(type(value) is dict and set(value)==set(FULL_KEYS),'layout_shape')
    require(value['schema']==SCHEMA+'observation/1' and value['complete_application_accepted'] is False and
            value['runner']=={'uid':uid,'gid':gid} and value['limits']==LIMITS and
            all(value[k] is None for k in ('planned','actual','kernel_witness','creation_witness')),'layout_nonacceptance')
    require(value['producer']=='root_observer' and value['observer']['uid']==value['observer']['euid']==0 and
            value['context']['request_sha256']==request_hash,'root_layout_identity')
    require(root_report=={'name':'layout.json','bytes':len(body),'sha256':digest(body)},'runner_report_hash')
    return value


def artifact_readback(custody,upload,layout_body,status_body,uid):
    parent=custody.directory(upload,True);custody.rejoin()
    # Enumeration is restricted to this private two-file diagnostic directory.
    fd=os.open('.',os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=parent['fd'])
    try:
        require(identity(os.fstat(fd))==identity(os.fstat(parent['fd'])),'inventory_directory_join')
        require(set(os.listdir(fd))=={'layout.json','status.json'},'exact_two_file_inventory')
        for name,expected,limit in (('layout.json',layout_body,65536),('status.json',status_body,8192)):
            actual,unused=read_at(parent['fd'],name,uid,limit,custody.deadline)
            require(actual==expected,'runner_readback_bytes')
        require(set(os.listdir(fd))=={'layout.json','status.json'},'exact_two_file_inventory')
        require(identity(os.fstat(fd))==identity(os.fstat(parent['fd'])),'inventory_directory_join')
    finally:os.close(fd)
    require(len(layout_body)+len(status_body)<=72*1024 and len(layout_body)+len(status_body)<=32*1024**2 and
            len(layout_body)+len(status_body)<=4*1024**3,'charged_retention_caps')
    custody.rejoin()


def append_output(path,deadline):
    remaining(deadline);path=Path(path)
    require(path.is_absolute() and path.resolve()==path,'output_unaliased')
    fd=os.open(path,os.O_WRONLY|os.O_APPEND|os.O_NOFOLLOW|os.O_NONBLOCK)
    try:
        before=identity(os.fstat(fd))
        require(before['type']=='file' and before['uid']==os.getuid() and before['nlink']==1 and
                before==identity(path.lstat()),'runner_output_identity')
        remaining(deadline);body=b'artifact_safe=true\n'
        require(os.write(fd,body)==len(body),'runner_output_append')
        after=identity(os.fstat(fd));named=identity(path.lstat())
        require(after==named and all(after[k]==before[k] for k in ('dev','ino','type','uid','gid','mode','nlink')) and
                after['size']==before['size']+len(body),'runner_output_rejoin')
    finally:os.close(fd)


def runner():
    custody=None
    try:
        require(os.getuid()==os.geteuid()!=0,'actual_runner_identity')
        started=time.monotonic();install_alarm(started+30)
        root=fixed_root();uid=os.getuid();gid=os.getgid();rows=manifest(root,uid)
        custody=Custody(root,uid,started+30)
        job_raw,unused=custody.read(root/'evidence/job-start.json',4096)
        job=decode(job_raw);closed(job,'monotonic')
        require(finite(job['monotonic']) and job['monotonic']<=started,'job_clock')
        deadline=min(started+30,job['monotonic']+600);custody.deadline=deadline;install_alarm(deadline)
        evidence=custody.directory(root/'evidence')
        for name in (CONTROL,UPLOAD):
            remaining(deadline);custody.rejoin()
            os.mkdir(name,0o700,dir_fd=evidence['fd'])
            # mkdir intentionally changes the held evidence directory's link
            # count and timestamps; rejoin its identity before refreshing them.
            current=identity(os.fstat(evidence['fd']))
            require(current==identity(os.stat(evidence['name'],dir_fd=evidence['parent'],follow_symlinks=False)) and
                    all(current[k]==evidence['identity'][k] for k in ('dev','ino','type','uid','gid','mode')) and
                    current['nlink'] in (evidence['identity']['nlink'],evidence['identity']['nlink']+1),'created_parent_join')
            evidence['identity']=current
            custody.directory(root/'evidence'/name,True)
        request={'schema':SCHEMA+'request/1','operation':'observe','uid':uid,'gid':gid,'started':started}
        request_body=encoded(request);request_hash=digest(request_body)
        publish(custody,root/'evidence'/CONTROL,request_body,uid,gid,name='request.json')
        summary=None;root_exit=None;error=None;layout=None
        try:
            root_exit,out,err=bounded_process(['/usr/bin/sudo','-n','--','/usr/bin/python3','-I','-B',str(root/'game'/SCRIPT),'--root-observe'],
                                               deadline,8192,ENV,privileged=True)
            require(out,'root_no_control')
            summary=validate_control(decode(out),root_exit,deadline,request_hash)
            custody.created_file(root/'evidence'/UPLOAD)
            if summary['report'] is not None:
                layout,unused=custody.read(root/'evidence'/UPLOAD/'layout.json',65536,True)
                value=verify_layout(layout,uid,gid,request_hash,summary['report'])
                require(summary['observation']==('complete' if value['coverage']['complete'] else 'incomplete'),'coverage_join')
            else:error=root_refusal(summary)
        except (OSError,ValueError,TimeoutError,subprocess.SubprocessError):
            layout=None
            error='root_control_or_readback_failed'
        remaining(deadline)
        upload=root/'evidence'/UPLOAD
        custody.created_file(upload)
        if layout is None:
            fallback=new_record(rows,root,uid,gid,None,'runner_fallback')
            issue(fallback,None,'runner',error['runner_error'] if type(error) is dict else error or 'root_unavailable')
            fallback['timing'].update(deadline=deadline,finished=time.monotonic())
            layout=fit_record(fallback)
            # EXCL refuses a partially published or preexisting report. No replace.
            publish(custody,upload,layout,uid,gid)
            observation='incomplete'
        else:observation=summary['observation']
        # Read as the actual runner and record post-publication identities.
        readback,ident=custody.read(upload/'layout.json',65536,True)
        require(readback==layout,'runner_hash_mismatch')
        status={'schema':SCHEMA+'status/1','operation':'observe','runner':{'uid':uid,'gid':gid},
                'root_exit':root_exit,'observation':observation,'deadline':deadline,'request_sha256':request_hash,
                'report':{'name':'layout.json','bytes':len(layout),'sha256':digest(layout)},
                'publication_identity':{'directory':identity(os.fstat(custody.directory(upload,True)['fd'])),'layout':ident},
                'artifact_safe':True,'complete_application_accepted':False,'error':error}
        status_body=encoded(status);require(len(status_body)<=8192,'status_limit')
        publish(custody,upload,status_body,uid,gid,name='status.json')
        artifact_readback(custody,upload,layout,status_body,uid)
        append_output(os.environ['GITHUB_OUTPUT'],deadline)
    except BaseException as error:
        # No exception serialization route can smuggle an unbounded control JSON.
        print('diagnostic nonacceptance: '+type(error).__name__,file=sys.stderr)
    finally:
        if custody is not None:custody.close()
        signal.setitimer(signal.ITIMER_REAL,0)
    return 1


def main():
    if sys.argv[1:]==['--root-observe']:return root_observe()
    if sys.argv[1:]:
        print('diagnostic accepts no arguments or --root-observe',file=sys.stderr);return 1
    return runner()


if __name__=='__main__':sys.exit(main())
