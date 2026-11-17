#!/usr/bin/env python3
"""Fixed hosted game qualification. Component checks confer no SDK acceptance."""
import argparse
import errno
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import select
import shutil
import signal
import stat
import subprocess
import tarfile
import tempfile
import time

BASE = '3666dc0f9da56fcf066d96ec01cd9e14ec9a2974'
REVISION = 'f292c7100874c0e0b2d1e0e81b27caeec8391f77'
TREE = 'd48cdfd94e6d46925e9269e364c2b7a6eb975d8a'
RESTORER = '90b1fe176eaa8eebb4eb6648363308b512d9ebfd649ca010d429eebc8379450d'
SDK = 'ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c'
SOURCE = Path('/workspaces/prismpm')
HOME = SOURCE / 'target/candidate-qualification-driver'
MIB = 1024**2
MAX_FILE, MAX_TOTAL, MAX_METADATA = 256*MIB, 4*1024**3, 32*MIB
SCENARIOS = ('Q1','Q2','Q3','Q4','Q5','Q6')
LEDGER = dict(zip(SCENARIOS, (12,12,7,6,6,7)))
FAULTS = dict(zip(SCENARIOS, ('none','none','extra-rw-writer','truncated-stage-input','lost-create-response','interrupted-attachment')))
AUTHORITY = {'driver':'candidate-capture-qualification.py','probe':'candidate-capture-probe.py','subject_adapter':'candidate-capture-subject.mjs'}
REGISTRIES = {'capture':('capture-owner.mjs','prismpm/private-publication-capture-locator/1'),
              'linkage':('compile.mjs','prismpm/private-publication-linkage-locator/1')}


def require(ok, message):
    if not ok:
        raise ValueError(message)


def closed(value, fields):
    require(type(value) is dict and set(value) == set(fields.split()), 'closed fields: '+fields)
    return value


def unique(pairs):
    result = {}
    for key,value in pairs:
        require(key not in result,'duplicate JSON field');result[key]=value
    return result


def decode(body):
    require(body.endswith(b'\n') and len(body)<=32*MIB, 'bounded complete JSON record with LF')
    return json.loads(body.decode('utf-8','strict'), object_pairs_hook=unique)


def encoded(value):
    return (json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=True)+'\n').encode()


def sha(body):
    return hashlib.sha256(body).hexdigest()


def safe_relative(value):
    require(type(value) is str and value and not value.startswith('/') and '\\' not in value
            and all(part not in ('','.','..') for part in value.split('/')) and '\0' not in value,
            'confined relative evidence path')
    return value


def regular(path, limit=MAX_FILE):
    path=Path(path).absolute()
    require(path.resolve()==path, 'unaliased regular input: '+str(path))
    before=path.lstat()
    require(stat.S_ISREG(before.st_mode) and before.st_nlink==1 and before.st_uid==os.getuid()
            and 0<=before.st_size<=limit, 'bounded owned singly linked input: '+str(path))
    fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
    try:
        with os.fdopen(fd,'rb',closefd=False) as stream: body=stream.read(limit+1)
        keys=('st_dev','st_ino','st_mode','st_size','st_nlink','st_uid','st_gid','st_mtime_ns','st_ctime_ns')
        require(len(body)==before.st_size and all(getattr(before,k)==getattr(after,k)
                for after in (os.fstat(fd),path.lstat()) for k in keys),'file changed while reading')
        return body
    finally: os.close(fd)


def directory(path, private=False):
    path=Path(path).absolute();info=path.lstat()
    require(path.resolve()==path and stat.S_ISDIR(info.st_mode) and info.st_uid==os.getuid()
            and info.st_mode&0o7022==0 and (not private or stat.S_IMODE(info.st_mode)==0o700),
            'owned unaliased safe directory: '+str(path))
    return path


def reference(path, limit=MAX_FILE):
    body=regular(path,limit);return {'path':str(path),'bytes':len(body),'sha256':sha(body)}


def verify_reference(value, limit=MAX_FILE):
    closed(value,'path bytes sha256')
    require(type(value['path']) is str and type(value['bytes']) is int and value['bytes']>=0 and type(value['sha256']) is str and re.fullmatch('[0-9a-f]{64}',value['sha256']),'typed bounded file reference')
    actual=reference(Path(value['path']),limit)
    require(actual==value,'retained reference changed');return actual


def read_json(path, limit=32*MIB):
    return decode(regular(path,limit))


def write(path, value, replace=False):
    path=Path(path);body=encoded(value);require(len(body)<=32*MIB,'JSON output bound')
    path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    directory(path.parent)
    if replace:
        fd,name=tempfile.mkstemp(prefix='.status-',dir=path.parent)
        try:
            with os.fdopen(fd,'wb') as stream:stream.write(body);os.fchmod(stream.fileno(),0o400)
            os.replace(name,path)
        finally:
            if os.path.lexists(name):os.unlink(name)
    else:
        fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o400)
        with os.fdopen(fd,'wb') as stream:stream.write(body)


def required_seconds(phase):
    if phase=='setup':return 21600
    if phase in SCENARIOS:return (6-SCENARIOS.index(phase))*2400+3900+600
    if phase=='oc10':return 4500
    if phase=='collect':return 600
    raise ValueError('closed phase')


def admit_phase(phase, deadline, now=None):
    now=time.monotonic() if now is None else now
    require(deadline-now>=required_seconds(phase),'insufficient absolute budget for '+phase)


def reject_environment(environment):
    forbidden={'PRISMPM_OC10_CAPTURE_ROUTE','PRISMPM_OC10_SDK_CHILD','PRISMPM_OC10_CAPTURE_OUTPUT',
        'RUSTFLAGS','RUSTDOCFLAGS','RUSTC','RUSTDOC','RUSTC_BOOTSTRAP','RUSTC_WRAPPER','RUSTC_WORKSPACE_WRAPPER',
        'CARGO_ENCODED_RUSTFLAGS','CARGO_ENCODED_RUSTDOCFLAGS','NODE_OPTIONS','NODE_PATH','LD_PRELOAD',
        'LD_LIBRARY_PATH','BASH_ENV','ENV'}
    for name in environment:
        require(name not in forbidden and not name.startswith(('CARGO_BUILD_','CARGO_PROFILE_')),
                'unowned compiler/capture environment: '+name)


def git(root,*args):
    environment={'PATH':os.environ.get('PATH','/usr/bin:/bin'),'LANG':'C.UTF-8','GIT_OPTIONAL_LOCKS':'0',
                 'GIT_CONFIG_GLOBAL':'/dev/null','GIT_CONFIG_NOSYSTEM':'1','GIT_TERMINAL_PROMPT':'0'}
    return subprocess.check_output(['git','-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',
                                   '-c','safe.directory='+str(root),'-C',str(root),*args],env=environment,timeout=30)


def source_files(root):
    require(git(root,'rev-parse','HEAD').decode().strip()==REVISION and
            git(root,'rev-parse','HEAD^{tree}').decode().strip()==TREE,'exact reviewed source required')
    require(not git(root,'status','--porcelain=v1','--untracked-files=all').strip(),'source must remain clean')
    rows=[]
    for entry in git(root,'ls-tree','-rz','--full-tree',REVISION).split(b'\0'):
        if not entry:continue
        header,name=entry.split(b'\t',1);mode,kind,oid=header.decode().split();name=name.decode('utf-8')
        safe_relative(name);path=root/name
        require(kind=='blob','no source submodules')
        body=os.readlink(path).encode() if mode=='120000' else regular(path)
        require(mode=='120000' or bool(path.lstat().st_mode&0o100)==(mode=='100755'),'actual source executable mode')
        # Git object content is the independent snapshot authority, including aliases.
        expected=hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()
        require(expected==oid,'source bytes differ from reviewed Git blob: '+name)
        rows.append({'path':name,'mode':mode,'git_blob':oid,'bytes':len(body),'sha256':sha(body)})
    return rows


def load_source():
    expected=read_json(HOME/'source-files.json');require(source_files(SOURCE)==expected,'source inventory changed')
    path=SOURCE/'scripts/conditional-capture-candidate.py'
    spec=importlib.util.spec_from_file_location('reviewed_candidate',path)
    module=importlib.util.module_from_spec(spec)
    exec(compile(regular(path,MIB),str(path),'exec'),module.__dict__)
    return module


def load_probe():
    preparation=read_json(HOME/'preparation.json');row=preparation['probe']
    path=HOME/AUTHORITY['probe'];body=regular(path,32768)
    require(sha(body)==row['sha256'] and len(body)==row['bytes'],'game probe authority changed')
    spec=importlib.util.spec_from_file_location('game_probe',path);module=importlib.util.module_from_spec(spec)
    exec(compile(body,str(path),'exec'),module.__dict__)
    return module,body.decode('utf-8')


def command(name, argv, cwd, deadline, environment=None):
    """Fixed callers only. Always retain exact raw streams and finite status."""
    require(re.fullmatch('[A-Za-z0-9-]+',name),'fixed command name')
    folder=HOME/'commands';folder.mkdir(mode=0o700,exist_ok=True)
    state={'schema':'cs1618/candidate-command/1','name':name,'argv':argv,'cwd':str(cwd),
           'status':'incomplete','exit':None,'elapsed_seconds':None,'stdout':None,'stderr':None,'error':None}
    target=folder/(name+'.json');write(target,state)
    started=time.monotonic();child=None;streams={};failure=None
    try:
        require(deadline>started+5,'command absolute budget exhausted')
        child=subprocess.Popen(argv,cwd=cwd,env=environment,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
        for kind,stream in [('stdout',child.stdout),('stderr',child.stderr)]:
            path=folder/(name+'.'+kind);fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o400)
            streams[stream.fileno()]={'stream':stream,'fd':fd,'path':path,'size':0,'kind':kind}
        active=set(streams)
        while active:
            left=deadline-time.monotonic()-5;require(left>0,'command absolute deadline')
            require(shutil.disk_usage(HOME).free>=8*1024**3,'owned command must preserve8GiB free')
            ready=select.select(list(active),[],[],min(left,1))[0]
            if not ready:continue
            for fd in ready:
                body=os.read(fd,65536)
                if not body:active.remove(fd);continue
                row=streams[fd];require(row['size']+len(body)<=32*MIB,'original command stream overflow')
                os.write(row['fd'],body);row['size']+=len(body)
        state['exit']=child.wait(timeout=max(0.01,deadline-time.monotonic()-1))
        require(state['exit']==0,'fixed command failed: '+name)
        state['status']='completed'
    except BaseException as error:
        failure=error;state['error']=str(error)[:4096]
    finally:
        if child:
            try:os.killpg(child.pid,signal.SIGKILL)
            except ProcessLookupError:pass
            try:child.wait(timeout=max(0.01,min(5,deadline-time.monotonic())))
            except subprocess.TimeoutExpired:state['error']='owned child reap incomplete';state['status']='incomplete'
            if state['exit'] is None:state['exit']=child.returncode
        for row in streams.values():
            os.close(row['fd']);row['stream'].close();state[row['kind']]=reference(row['path'],32*MIB)
        state['elapsed_seconds']=time.monotonic()-started;write(target,state,replace=True)
    if failure:raise failure
    return state


def prepare(phase):
    root=Path.cwd().resolve();game=root/'game';source=root/'prismpm';evidence=root/'evidence'
    evidence.mkdir(mode=0o700,exist_ok=True)
    require(os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('GITHUB_REPOSITORY')=='R4-Laboratories/uor-cs1.618'
            and os.environ.get('GITHUB_REF')=='refs/heads/numeric-kernels'
            and os.environ.get('RUNNER_ENVIRONMENT')=='github-hosted' and os.environ.get('GITHUB_EVENT_NAME') in ('push','workflow_dispatch'),'actual authorized hosted game context')
    commit=os.environ.get('GITHUB_SHA');require(git(game,'rev-parse','HEAD').decode().strip()==commit,'actual game commit')
    require(os.environ.get('GITHUB_WORKFLOW_SHA')==commit,'workflow and game commit differ')
    snapshot=game/'scripts/numeric/prismpm-capture-candidate';meta=read_json(snapshot/'manifest.json',8192)
    closed(meta,'schema source base candidate tree bundle_sha256 patch_sha256')
    require((meta['base'],meta['candidate'],meta['tree'])==(BASE,REVISION,TREE),'snapshot substitution')
    for suffix in ('bundle','patch'):
        require(sha(regular(snapshot/('candidate.'+suffix)))==meta[suffix+'_sha256'],'snapshot transport substitution')
    restore=game/'scripts/numeric/restore-prismpm-candidate.py';require(sha(regular(restore))==RESTORER,'restorer substitution')
    receipt=subprocess.check_output(['python3','-I','-B',str(restore),str(snapshot),str(source)],timeout=120)
    (evidence/'restoration-receipt.json').write_bytes(receipt)
    inputs=source_files(source)
    home=source/'target/candidate-qualification-driver';home.mkdir(parents=True,mode=0o700)
    authorities={}
    for role,name in AUTHORITY.items():
        path='scripts/numeric/'+name;body=git(game,'show',commit+':'+path)
        require(regular(game/path)==body,'actual game authority bytes differ')
        if role=='probe':require(0<len(body)<=32768 and b'\0' not in body,'fixed probe size')
        (home/name).write_bytes(body);os.chmod(home/name,0o400)
        authorities[role]={'path':path,'git_blob':git(game,'rev-parse',commit+':'+path).decode().strip(),
                           'sha256':sha(body),'bytes':len(body)}
    game_inputs=[]
    for path in ('.github/workflows/prismpm-candidate-capture-qualification.yml','.github/actions/prismpm-source-cache/action.yml','scripts/numeric/restore-prismpm-candidate.py'):
        body=git(game,'show',commit+':'+path);require(regular(game/path)==body,'fixed workflow/cache/restorer bytes')
        game_inputs.append({'path':path,'bytes':len(body),'sha256':sha(body)})
    write(home/'game-inputs.json',game_inputs)
    started=read_json(evidence/'job-start.json',4096)
    closed(started,'monotonic');require(type(started['monotonic']) in (float,int),'actual job clock')
    partial={'schema':'cs1618/candidate-capture-preparation-partial/1','status':'incomplete','phase':phase,
             'game':{'commit':commit,'tree':git(game,'rev-parse','HEAD^{tree}').decode().strip()},
             'source':{'commit':REVISION,'tree':TREE,'snapshot_manifest_sha256':sha(regular(snapshot/'manifest.json')),
                       'bundle_sha256':meta['bundle_sha256'],'patch_sha256':meta['patch_sha256']},
             **authorities,'host_source':str(source),'started':started['monotonic'],
             'runner':{key:os.environ.get(key) for key in ('GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','GITHUB_WORKFLOW_REF','GITHUB_WORKFLOW_SHA','GITHUB_REPOSITORY','GITHUB_REF','RUNNER_OS','RUNNER_ARCH','ImageOS','ImageVersion')}}
    write(home/'preparation-partial.json',partial);write(home/'source-files.json',inputs)
    write(evidence/'preparation-partial.json',partial)
    shutil.copyfile(evidence/'restoration-receipt.json',home/'restoration-receipt.json')
    shutil.copyfile(snapshot/'manifest.json',home/'snapshot-manifest.json')
    for kind in REGISTRIES:
        registry=source/('target/conditional-publication-'+kind+'-locators')
        require(not os.path.lexists(registry),'fresh source locator registry required')


def docker(*argv):
    return subprocess.check_output(['docker','--host','unix:///var/run/docker.sock',*argv],timeout=15)


def source_image(partial, folder):
    ids=docker('ps','-aq','--filter','label=devcontainer.local_folder='+partial['host_source']).decode().split()
    require(len(ids)==1,'one actual source container')
    actors=json.loads(docker('container','inspect',ids[0]));require(len(actors)==1,'one source actor')
    actor=actors[0];images=json.loads(docker('image','inspect',actor['Image']));require(len(images)==1,'one source image')
    image=images[0]
    require(image['Id']==actor['Image'] and image['Os']=='linux' and image['Architecture']=='amd64','source image platform')
    require(any(row['Source']==partial['host_source'] and row['Destination']=='/workspaces/prismpm' for row in actor['Mounts']),
            'actual source checkout mount')
    write(folder/'source-container-inspect.json',actor,replace=True);write(folder/'source-image-inspect.json',image,replace=True)
    return {'config_digest':image['Id'],'rootfs':image['RootFS'],'os':image['Os'],'architecture':image['Architecture'],
            'definition_sha256':sha(encoded([row for row in read_json(folder/'source-files.json') if row['path'].startswith('.devcontainer/')]))}


def validate_partial(value):
    closed(value,'schema status phase game source driver probe subject_adapter host_source started runner')
    require(value['schema']=='cs1618/candidate-capture-preparation-partial/1' and value['status']=='incomplete'
            and value['phase'] in ('image','qualification') and type(value['started']) in (int,float) and value['started']>0,
            'explicit partial preparation, never invented runtime identities')
    closed(value['runner'],'GITHUB_RUN_ID GITHUB_RUN_ATTEMPT GITHUB_WORKFLOW_REF GITHUB_WORKFLOW_SHA GITHUB_REPOSITORY GITHUB_REF RUNNER_OS RUNNER_ARCH ImageOS ImageVersion')
    require(value['runner']['GITHUB_REPOSITORY']=='R4-Laboratories/uor-cs1.618' and value['runner']['GITHUB_REF']=='refs/heads/numeric-kernels'
            and value['runner']['RUNNER_OS']=='Linux' and value['runner']['RUNNER_ARCH']=='X64'
            and value['runner']['GITHUB_WORKFLOW_SHA']==value['game']['commit'],'actual independent hosted runner/game binding')
    require(value['runner']['GITHUB_WORKFLOW_REF']=='R4-Laboratories/uor-cs1.618/.github/workflows/prismpm-candidate-capture-qualification.yml@refs/heads/numeric-kernels',
            'actual fixed workflow reference')
    for key in ('GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT'):require(re.fullmatch('[1-9][0-9]{0,19}',value['runner'][key]),'actual hosted run identity')
    return value


def setup_preparation():
    require(os.getuid()==1000 and os.getgid()==1000,'actual source container UID/GID1000')
    reject_environment(os.environ);partial=read_json(HOME/'preparation-partial.json')
    write(HOME/'source-runtime.json',{'python':__import__('sys').version,'executable':__import__('sys').executable,'uid':os.getuid(),'gid':os.getgid(),'uname':list(os.uname())})
    validate_partial(partial)
    require(partial['phase']=='qualification','qualification source required')
    require(time.monotonic()-partial['started']<2700,'setup budget expired before container startup')
    for role,name in AUTHORITY.items():
        body=regular(HOME/name,32768 if role=='probe' else MIB)
        require(sha(body)==partial[role]['sha256'] and len(body)==partial[role]['bytes'],'copied game authority substitution')
    require(source_files(SOURCE)==read_json(HOME/'source-files.json'),'restored source changed')
    image=json.loads(docker('image','inspect',SDK));require(len(image)==1,'one actual SDK image')
    image=image[0];require(SDK in image['RepoDigests'] and image['Os']=='linux' and image['Architecture']=='amd64'
                          and re.fullmatch('sha256:[0-9a-f]{64}',image['Id']),'unchanged SDK distribution identity')
    write(HOME/'sdk-image-inspect.json',image)
    version=json.loads(docker('version','--format','{{json .}}'));write(HOME/'docker-version.json',version)
    require(version['Client']['Version']=='28.4.0','original Docker CLI28.4.0 required')
    require(version['Server']['Version'] and version['Server']['ApiVersion'],'actual daemon version required')
    value={'schema':'cs1618/candidate-capture-preparation/1',**{key:partial[key] for key in ('game','source',*AUTHORITY)},
           'sdk':{'reference':SDK,'config_digest':image['Id'],'os':image['Os'],'architecture':image['Architecture']},
           'source_container':source_image(partial,HOME)}
    write(HOME/'preparation.json',value);return value


def build_subjects():
    partial=read_json(HOME/'preparation-partial.json');deadline=partial['started']+2700
    require(time.monotonic()<deadline,'setup absolute budget')
    command('build-subjects',['/usr/local/bin/node',str(HOME/AUTHORITY['subject_adapter']),'build-subjects'],SOURCE,deadline)
    module=load_source()
    for id in ('Q1','Q2'):
        build=read_json(HOME/(id+'-build.json'));root=Path(build['root']);work=Path(build['work'])
        require((id=='Q1' and root==SOURCE and work==HOME/'subjects/Q1') or
                (id=='Q2' and re.fullmatch('/tmp/prismpm-publication-capture-[A-Za-z0-9_-]{6,64}',str(work))
                 and root==work/'source'),'actual distinct compiled roots')
        directory(work,True);directory(root)
        for key in ('cargo_output','listing','source_inventory'):
            verify_reference(build[key],32*MIB)
        for key in ('artifact','execution'):
            row=build[key];verify_reference({k:row[k] for k in ('path','bytes','sha256')})
            info=Path(row['path']).lstat();require(str(info.st_dev)==row['dev'] and str(info.st_ino)==row['ino'],'actual ELF inode custody')
        require(build['artifact']['fresh'] is False and build['artifact']['manifest_path']==str(root/'crates/prismpm/Cargo.toml')
                and build['artifact']['ino']!=build['execution']['ino'],'fresh emitted original and independent execution copy')
        plan=module.measure_inputs(root,Path(build['execution']['path']),module.remaining_seconds(deadline))
        listing=regular(Path(build['listing']['path']),MIB);module.legacy.checked_listing(listing)
        require(sha(listing)==plan['listing_sha256'] and len(listing.decode().splitlines())==plan['test_count'],'full actual listing/count')
        write(HOME/(id+'-plan.json'),plan)
        subject={'schema':'cs1618/candidate-capture-subject/1','root_kind':plan['source_selection'],'source_root':str(root),
                 'source_sha256':plan['source_sha256'],'union_sha256':plan['union_sha256'],
                 'cargo_output':build['cargo_output'],'artifact':build['artifact'],'execution':build['execution'],
                 'listing':{**build['listing'],'test_count':plan['test_count'],'exact_test':module.legacy.TEST}}
        write(HOME/(id+'-subject.json'),subject)
    elf=read_json(HOME/'Q1-subject.json')['execution']['path']
    commands=[('candidate-components',['/usr/bin/python3','-I','-B','scripts/conditional-capture-candidate.test.py']),
              ('legacy-components',['/usr/bin/python3','-I','-B','scripts/conditional-capture-sdk.test.py',elf]),
              ('launcher-components',['/usr/local/bin/node','--test','scripts/conditional-capture-candidate-command.test.mjs']),
              ('reader-components',['/usr/local/bin/node','--test','tests/publication-context-linkage/candidate-transport.test.mjs'])]
    for name,args in commands:command(name,args,SOURCE,deadline)
    require(source_files(SOURCE)==read_json(HOME/'source-files.json'),'source changed during setup')
    write(HOME/'setup.json',{'schema':'cs1618/candidate-setup/1','status':'completed','commands':['build-subjects',*[row[0] for row in commands]],
                            'subjects':['Q1','Q2'],'harness':reference(HOME/'harness.json'),'elapsed_seconds':time.monotonic()-partial['started']})


class CollectionDeadline(BaseException):
    pass


class ControlledFault(RuntimeError):
    pass


def completed_fault(id,error,observed):
    return id in ('Q3','Q4','Q5','Q6') and observed is True and isinstance(error,ControlledFault) and str(error)==FAULTS[id]


def validate_observation_calls(observations,cleanup_calls):
    calls=[]
    for row in observations:
        if row['kind']=='argv.json':
            value=read_json(Path(row['path']),MIB);closed(value,'argv cleanup')
            require(type(value['argv']) is list and value['argv'][:3]==['docker','--host','unix:///var/run/docker.sock']
                    and all(type(item) is str for item in value['argv']) and type(value['cleanup']) is bool,'actual original Docker command observation')
            calls.append(value)
    require(calls and sum(row['cleanup'] for row in calls)==cleanup_calls,'complete independently counted cleanup call observations')


def scenario_owner(module, folder, deadline, id):
    class Owner(module.Lifecycle):
        def __init__(self):
            super().__init__(deadline,None,[])
            self.observations=[];self.waits=0;self.lost=False;self.retention_error=None;self.raw_bytes=0
        def save(self,role,kind,body):
            try:self.save_checked(role,kind,body)
            except Exception as error:
                self.retention_error=str(error)
                if not self.cleanup_mode:raise
        def save_checked(self,role,kind,body):
            require(len(body)<=32*MIB,'bounded actual Docker observation')
            self.raw_bytes+=len(body);require(self.raw_bytes<=MAX_TOTAL,'bounded complete scenario observations')
            path=folder/(f'{len(self.observations):04d}-'+kind)
            fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o400)
            with os.fdopen(fd,'wb') as stream:stream.write(body)
            self.observations.append({'role':role,'kind':kind,**reference(path,32*MIB)})
        def call(self,*args,limit=module.legacy.MAX_JSON):
            self.save('daemon','argv.json',encoded({'argv':['docker','--host','unix:///var/run/docker.sock',*args],
                                                   'cleanup':self.cleanup_mode}))
            try:result=super().call(*args,limit=limit)
            except BaseException as error:
                self.save('daemon','failed.json',encoded({'error':str(error),'cleanup_calls':self.cleanup_calls}))
                for channel in ('stdout','stderr'):
                    body=getattr(error,channel,b'')
                    if isinstance(body,bytes):self.save('daemon','exception.'+channel,body)
                raise
            self.save('daemon','stdout',result.stdout);self.save('daemon','stderr',result.stderr)
            if id=='Q5' and not self.lost and args[0]=='create' and args[args.index('--name')+1].endswith('-stage'):
                # Actual creation completed. Discard only the caller's ID observation;
                # raw daemon output remains diagnostic, not admitted actor authority.
                self.lost=True;raise ControlledFault('lost-create-response')
            return result
        def inspect(self,cid):
            actor=super().inspect(cid)
            for item in self.actors.values():
                if actor['Name']=='/'+item['spec']['name']:self.validate_actor(actor,item['spec'])
            return actor
        def wait_attachment(self,child,successful=False):
            self.waits+=1;require(self.waits<=2,'two original attachment waits')
            return super().wait_attachment(child,successful)
    return Owner()


def bounded_reader(module, stream, deadline, owner, role):
    class Reader(module.Reader):
        def __init__(self):super().__init__(stream,deadline);self.total=0
        def fill(self):
            left=self.deadline-time.monotonic();require(left>0 and select.select([self.fd],[],[],left)[0],'attachment deadline')
            body=os.read(self.fd,65536);self.total+=len(body);require(self.total<=MIB,'qualification attachment bound')
            owner.save(role,'stream',body);require(body,'capture owner channel closed early');self.buffer.extend(body)
        def exhausted(self):
            require(not self.buffer,'unexpected trailing attachment protocol')
            left=self.deadline-time.monotonic();require(left>0 and select.select([self.fd],[],[],left)[0],'attachment EOF deadline')
            body=os.read(self.fd,1);owner.save(role,'eof',body);require(body==b'','unexpected trailing attachment bytes')
    return Reader()


def validate_probe(value, descriptor, probe, code):
    closed(value,'schema mode complete_application_accepted probe_sha256 descriptor_sha256 python uid gid source_root source_sha256 executable_sha256 listing_sha256 test_count readonly_views sdk_tree_sha256 checks closure_unchanged')
    require(value['schema']=='cs1618/candidate-readonly-probe/1' and value['mode']=='readonly-qualification-v1'
            and value['complete_application_accepted'] is False and value['closure_unchanged'] is True,'closed probe outcome')
    require(value['probe_sha256']==sha(code.encode()) and value['descriptor_sha256']==sha(encoded(descriptor))
            and value['python']=='3.12.3' and type(value['uid']) is int and type(value['gid']) is int and value['uid']==1000 and value['gid']==1000,'actual probe authority/runtime')
    for key in ('source_root','source_sha256','executable_sha256','listing_sha256','test_count'):
        require(value[key]==descriptor[key],'probe descriptor join: '+key)
    require(encoded(value['readonly_views'])==encoded({'input':'/candidate-input','compiled_root':descriptor['source_root'],
            'subpath':'candidate-source','same_directory':True,'readonly':True,'protected_ancestors':True}),'original read-only views')
    require(re.fullmatch('[0-9a-f]{64}',value['sdk_tree_sha256']),'actual SDK tree digest')
    authority=tuple(row['path'] for row in descriptor['authority']);expected=[]
    for index,path in enumerate(probe.mutation_paths(descriptor,authority)):
        for operation in probe.OPERATIONS:expected.append((str(index)+':'+operation,str(path),operation))
    require(type(value['checks']) is list and len(value['checks'])==len(expected),'complete mutation inventory')
    for row,wanted in zip(value['checks'],expected):
        closed(row,'id path operation errno rejected')
        require((row['id'],row['path'],row['operation'])==wanted and row['rejected'] is True
                and type(row['errno']) is int and row['errno'] in (errno.EROFS,errno.EPERM,errno.EACCES),'actual ordered mutation refusal')
    return value


WRITER_CODE = 'import time; time.sleep(1980)'


def writer_create(owner,module):
    name=owner.prefix+'-qualification-writer';role='qualification-writer'
    spec={'name':name,'role':role,'argv':['-I','-B','-c',WRITER_CODE]}
    args=['create','--name',name,'--label',module.legacy.LABEL+'='+owner.token,'--label',module.ROLE_LABEL+'='+role,
          '--interactive','--read-only','--network','none','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true',
          '--memory','8g','--memory-swap','8g','--cpus','2','--pids-limit','256']
    for path,options in module.TMPFS.items():args+=['--tmpfs',path+':'+options]
    args+=['--mount','type=volume,source='+owner.volumes['input']+',target=/workspace',
           '--env','PRISMPM_TEST_SDK_IMAGE='+SDK,'--entrypoint','/usr/bin/python3',owner.image,*spec['argv']]
    item={'role':role,'name':name,'id':None,'absent':False,'spec':spec}
    # Return pending custody through the caller's held object even on create loss.
    return item,args


def writer_authenticate(owner,module,item,actor):
    require(re.fullmatch('[0-9a-f]{64}',actor['Id']) and actor['Name']=='/'+item['name']
            and actor['Image']==owner.image and actor['Config']['Labels'].get(module.legacy.LABEL)==owner.token
            and actor['Config']['Labels'].get(module.ROLE_LABEL)==item['role']
            and (item['id'] is None or actor['Id']==item['id']),'planted writer ownership')
    config,host=actor['Config'],actor['HostConfig']
    require(config['Cmd']==item['spec']['argv'] and config['Entrypoint']==['/usr/bin/python3'] and config['User']=='1000:1000'
            and sorted(config['Env'])==sorted(owner.environment) and config['WorkingDir']=='/workspace'
            and config['OpenStdin'] is True and config['Tty'] is False,'fixed actual writer execution policy')
    require(host['ReadonlyRootfs'] is True and host['NetworkMode']=='none' and host['AutoRemove'] is False
            and host['Memory']==8*1024**3 and host['MemorySwap']==8*1024**3 and host['NanoCpus']==2*10**9
            and host['PidsLimit']==256 and host['CapDrop']==['ALL'] and not host.get('CapAdd')
            and host['SecurityOpt']==['no-new-privileges:true'] and not host['Privileged'] and not host.get('Devices')
            and not host.get('Binds') and not host.get('VolumesFrom') and not host.get('GroupAdd')
            and not host.get('PidMode') and host.get('IpcMode') in ('','private','none') and not host.get('UsernsMode')
            and host['Tmpfs']==module.TMPFS,'fixed writer resources')
    require(len(actor['Mounts'])==1,'writer has exactly one mount')
    mount=actor['Mounts'][0]
    require(mount['Type']=='volume' and mount['Name']==owner.volumes['input'] and mount['Destination']=='/workspace'
            and mount['RW'] is True,'writer real input RW attachment only')
    requests=host.get('Mounts') or [];require(len(requests)==1,'writer requested mount count')
    requested=requests[0]
    require(requested['Type']=='volume' and requested['Source']==owner.volumes['input'] and requested['Target']=='/workspace'
            and not requested.get('ReadOnly') and not requested.get('BindOptions') and not requested.get('Consistency')
            and set(requested)<={'Type','Source','Target','ReadOnly','VolumeOptions','BindOptions','Consistency'}
            and set(requested.get('VolumeOptions') or {})<={'NoCopy'} and not (requested.get('VolumeOptions') or {}).get('NoCopy'),
            'writer exact request without socket/subpath')
    item['id']=actor['Id'];return actor


def retire_writer(owner,module,item):
    ids=owner.call('container','ls','--all','--no-trunc','--filter','name=^/'+item['name']+'$','--format','{{.ID}}').stdout.decode().splitlines()
    require(len(ids)==1,'one independently owned planted actor')
    writer_authenticate(owner,module,item,owner.inspect(ids[0]));owner.call('container','rm','--force',item['id'])
    require(owner.call('container','ls','--all','--no-trunc','--filter','name=^/'+item['name']+'$','--format','{{.ID}}').stdout==b'',
            'writer name absence')
    require(owner.call('container','ls','--all','--no-trunc','--filter','id='+item['id'],'--format','{{.ID}}').stdout==b'',
            'writer ID absence')
    item['absent']=True


def qualify(id):
    require(id in SCENARIOS,'closed scenario')
    admit_phase(id,read_json(HOME/'preparation-partial.json')['started']+21600)
    module=load_source();probe,code=load_probe();preparation=read_json(HOME/'preparation.json')
    subject_id='Q2' if id=='Q2' else 'Q1';subject=read_json(HOME/(subject_id+'-subject.json'))
    source=Path(subject['source_root']);executable=Path(subject['execution']['path'])
    folder=HOME/'scenarios'/id;folder.mkdir(parents=True,mode=0o700)
    deadline=time.monotonic()+2400;owner=scenario_owner(module,folder,deadline,id)
    result={'schema':'cs1618/candidate-capture-scenario/1','id':id,'status':'incomplete','scope':'actual-daemon-qualification-only',
            'complete_application_accepted':False,'preparation_sha256':sha(regular(HOME/'preparation.json')),
            'subject_sha256':sha(regular(HOME/(subject_id+'-subject.json'))),'owner_token':owner.token,
            'descriptor_sha256':None,'probe':None,'observations':[],
            'fault':{'kind':FAULTS[id],'observed_refusal':False,'execution_created':False},
            'retirement':{'actors':[],'volumes':[],'cleanup_daemon_calls':0,'attachment_waits':0,'uncertain':True}}
    write(folder/'scenario.json',result)
    success=False;refusal=False;descriptor=None;writer=None;failure=None;retirement=None
    handlers={s:signal.getsignal(s) for s in (signal.SIGINT,signal.SIGTERM,signal.SIGHUP)}
    def interrupted(signum,frame):raise RuntimeError('qualification interrupted')
    for sig in handlers:signal.signal(sig,interrupted)
    try:
        module.protected_root(str(source))
        verify_reference({k:subject['execution'][k] for k in ('path','bytes','sha256')})
        plan=module.measure_inputs(source,executable,module.remaining_seconds(owner.work_deadline))
        for key in ('source_sha256','union_sha256','listing_sha256','test_count','executable_sha256'):
            expected=subject['listing']['sha256'] if key=='listing_sha256' else subject['listing']['test_count'] if key=='test_count' else subject['execution']['sha256'] if key=='executable_sha256' else subject[key]
            require(plan[key]==expected,'unchanged subject join: '+key)
        identities=module.input_identities(source,executable,plan,owner.work_deadline)
        image_rows=json.loads(owner.call('image','inspect',SDK).stdout);require(len(image_rows)==1,'one pinned SDK')
        image=image_rows[0];require(image['Id']==preparation['sdk']['config_digest'] and SDK in image['RepoDigests']
                and image['Os']=='linux' and image['Architecture']=='amd64','independent SDK identity')
        require(set(image['Config'].get('Volumes') or {})<={'/workspace'},'no anonymous image volumes')
        environment=image['Config']['Env'];require(type(environment) is list and len({x.split('=',1)[0] for x in environment})==len(environment)
                and 'PATH=/usr/local/elan/bin:/usr/local/cargo/bin:/usr/local/bin:/usr/bin:/bin' in environment
                and not any(x.startswith('PRISMPM_TEST_SDK_IMAGE=') for x in environment),'exact SDK environment')
        owner.image=image['Id'];owner.environment=environment+['PRISMPM_TEST_SDK_IMAGE='+SDK]
        runtime=module.inspect_runtime(owner)
        plan['remaining_seconds']=module.remaining_seconds(owner.work_deadline)
        descriptor=module.bind_runtime(plan,{'sdk_image':SDK,'config_digest':owner.image,'os':image['Os'],
                                           'architecture':image['Architecture'],**runtime})
        result['descriptor_sha256']=module.digest(descriptor);write(folder/'descriptor.json',descriptor)
        owner.volume('input')
        stage=owner.spec('stage',module.bootstrap_argv(source,descriptor,'stage-v1',owner.work_deadline))
        try:cid=owner.create(stage)
        except ControlledFault:
            require(id=='Q5' and owner.lost,'actual create response loss');refusal=True;raise
        owner.references(cid)
        child=owner.attach('stage',owner.diagnostics.attachment('stage'))
        for name in (module.UTILITY_NAME,module.ENTRY_NAME):
            body=module.legacy.read_regular(source/'scripts'/name,module.MAX_MODULE)
            row=next(row for row in descriptor['authority'] if row['path']=='scripts/'+name)
            require(sha(body)==row['sha256'] and len(body)==row['bytes'],'actual capsule source')
            module.legacy.write_bounded(child.stdin,body,owner.work_deadline)
        if id=='Q4':
            module.legacy.write_bounded(child.stdin,module.encoded(descriptor),owner.work_deadline)
            first=module.transfer_manifest(descriptor)[0];require(first['bytes']>1,'nonempty real truncated member')
            path=source/first['path'].removeprefix('candidate-source/')
            module.legacy.write_bounded(child.stdin,regular(path)[:1],owner.work_deadline);child.stdin.close()
            reader=bounded_reader(module,child.stdout,owner.work_deadline,owner,'stage')
            try:reader.line()
            except RuntimeError as error:
                require(str(error)=='capture owner channel closed early','named stage EOF refusal');refusal=True
            except ValueError as error:
                require(str(error)=='capture owner channel closed early','named stage EOF refusal');refusal=True
            require(refusal and not reader.buffer,'no stage admission or partial response')
            reader.exhausted();require(owner.wait_attachment(child)!=0,'actual truncated-stage failure')
            stderr=regular(owner.diagnostics.ensure()/'stage.stderr',MIB)
            require(stderr.splitlines().count(b'candidate bootstrap failed: capture owner channel closed early')==1,'actual named truncated-input failure')
            raise ControlledFault(FAULTS[id])
        module.write_inputs(child.stdin,source,executable,descriptor,owner.work_deadline,identities);child.stdin.close()
        reader=bounded_reader(module,child.stdout,owner.work_deadline,owner,'stage');stage_result=reader.line()
        require(stage_result==module.stage_admission(descriptor),'actual full stage admission');reader.exhausted()
        owner.wait_attachment(child,successful=True);owner.retire_actor('stage');owner.references()
        write(folder/'stage-admission.json',stage_result)
        module.recheck_inputs(source,executable,descriptor,identities,owner.work_deadline)
        if id=='Q3':
            writer,args=writer_create(owner,module)
            writer['id']=owner.call(*args).stdout.decode().strip()
            actor=writer_authenticate(owner,module,writer,owner.inspect(writer['id']))
            require(actor['State']['Status']=='created' and actor['State']['Running'] is False,'writer inspected before start')
            owner.call('start',writer['id'])
            require(writer_authenticate(owner,module,writer,owner.inspect(writer['id']))['State']['Running'] is True,'actual detached RW writer running')
            try:owner.references()
            except RuntimeError as error:
                require(str(error)=='additional candidate input volume reference','named RW-reference refusal');refusal=True
            require(refusal and 'execute' not in owner.actors,'writer blocks execution creation')
            raise ControlledFault(FAULTS[id])
        owner.volume('work');socket=os.stat('/var/run/docker.sock');require(stat.S_ISSOCK(socket.st_mode),'actual daemon socket')
        capsules=[next(row for row in descriptor['authority'] if row['path']=='scripts/'+name) for name in (module.UTILITY_NAME,module.ENTRY_NAME)]
        mode='attachment-qualification-v1' if id=='Q6' else 'readonly-qualification-v1'
        argv=['-I','-B','-c',code,mode,str(module.remaining_seconds(owner.work_deadline)),module.digest(descriptor),
              *[str(row[key]) for row in capsules for key in ('bytes','sha256')]]
        spec=owner.spec('execute',argv,str(source),socket.st_gid);cid=owner.create(spec)
        result['fault']['execution_created']=True;owner.references(cid)
        child=owner.attach('execute',owner.diagnostics.attachment('execute'))
        reader=bounded_reader(module,child.stdout,owner.work_deadline,owner,'execute');value=reader.line()
        if id=='Q6':
            closed(value,'schema probe_sha256 descriptor_sha256 uid gid')
            require(value=={'schema':'cs1618/candidate-attachment-ready/1','probe_sha256':sha(code.encode()),
                            'descriptor_sha256':module.digest(descriptor),'uid':1000,'gid':1000},'actual ready record')
            write(folder/'attachment-ready.json',value)
            require(child.poll() is None and owner.inspect(cid)['State']['Running'] is True,'actual live attachment before controlled interruption')
            child.terminate();child.stdin.close();reader.exhausted()
            require(owner.wait_attachment(child)!=0,'actual interrupted Docker attachment failure')
            refusal=True;raise ControlledFault(FAULTS[id])
        validate_probe(value,descriptor,probe,code);child.stdin.close();reader.exhausted();owner.wait_attachment(child,successful=True)
        write(folder/'probe.json',value);result['probe']=reference(folder/'probe.json',MIB)
        module.recheck_inputs(source,executable,descriptor,identities,owner.work_deadline);owner.references(cid)
        success=True
    except BaseException as error:
        failure=error
        refusal=completed_fault(id,error,refusal)
    finally:
        for sig in handlers:signal.signal(sig,signal.SIG_IGN)
        cleanup_error=None
        try:
            owner.cleanup_mode=True
            if writer is not None:retire_writer(owner,module,writer)
        except Exception as error:cleanup_error=error
        try:
            retirement=owner.finish(success and cleanup_error is None)
            if writer is not None:owner.references()
        except Exception as error:cleanup_error=error
        try:
            owner.diagnostics.close_attachments();owner.diagnostics.reconciled=True
            if failure:owner.diagnostics.exception(failure)
            owner.diagnostics.close()
        except Exception as error:cleanup_error=error
        for sig,handler in handlers.items():signal.signal(sig,handler)
        if owner.retention_error and cleanup_error is None:cleanup_error=ValueError(owner.retention_error)
        if cleanup_error:failure=cleanup_error;success=False;refusal=False
        if retirement:
            actors=retirement['actors']+([{key:writer[key] for key in ('role','name','id','absent')}] if writer else [])
            result['retirement']={'actors':actors,'volumes':retirement['volumes'],'cleanup_daemon_calls':owner.cleanup_calls,
                                  'attachment_waits':owner.waits,'uncertain':cleanup_error is not None}
        else:
            result['retirement']={'actors':[{'role':role,'name':item['spec']['name'],'id':item['id'],'absent':item['retired']}
                                            for role,item in owner.actors.items()],
                                  'volumes':[{'role':role,'name':name,'absent':False} for role,name in owner.volumes.items()],
                                  'cleanup_daemon_calls':owner.cleanup_calls,'attachment_waits':owner.waits,'uncertain':True}
        if owner.cleanup_calls>LEDGER[id] or owner.waits>2:
            failure=ValueError('scenario cleanup ledger exceeded');success=False;refusal=False;result['retirement']['uncertain']=True
        result['fault']['observed_refusal']=refusal
        result['observations']=owner.observations
        result['status']='qualified' if success else 'expected-refusal' if refusal and not result['retirement']['uncertain'] else 'incomplete'
        write(folder/'observation-index.json',owner.observations)
        write(folder/'outcome.json',{'error':None if failure is None else str(failure)[:4096],
                                    'diagnostic_locator':owner.diagnostics.locator(),'remaining_seconds':max(0,deadline-time.monotonic())})
        write(folder/'scenario.json',result,replace=True)
    require(result['status']!='incomplete','scenario incomplete: '+id+': '+str(failure))
    return result


MUTATIONS = ('source','services','controls','manifest','assurance','uniqueness','trailing','preimage','aggregate','id-limit',
             'partition-count','bucket-gap','bucket-last','bucket-duplicate','context-omission','context-substitution','context-limit',
             'writer-payload','writer-major','writer-size')
WASM_ROLES = ('wasm','wasm-repro','context-fields-wasm','context-fields-wasm-repro','admission-wasm','admission-wasm-repro')
NATIVE_ROLES = ('std','no_std','context-fields-std','context-fields-no_std')
COMPONENT_COMMANDS = ('build-subjects','candidate-components','legacy-components','launcher-components','reader-components')


def command_spec(name):
    fixed={'build-subjects':['/usr/local/bin/node',str(HOME/AUTHORITY['subject_adapter']),'build-subjects'],
           'candidate-components':['/usr/bin/python3','-I','-B','scripts/conditional-capture-candidate.test.py'],
           'launcher-components':['/usr/local/bin/node','--test','scripts/conditional-capture-candidate-command.test.mjs'],
           'reader-components':['/usr/local/bin/node','--test','tests/publication-context-linkage/candidate-transport.test.mjs'],
           'oc10':['/usr/local/cargo/bin/cargo','test','--locked','--offline','-p','repo-conformance','--test','conformance',
                   'conformance_oc_10','--','--exact','--nocapture']}
    if name=='legacy-components':return ['/usr/bin/python3','-I','-B','scripts/conditional-capture-sdk.test.py',read_json(HOME/'Q1-subject.json')['execution']['path']]
    require(name in fixed,'closed original command inventory');return fixed[name]


def validate_command(value, name):
    closed(value,'schema name argv cwd status exit elapsed_seconds stdout stderr error')
    require(value['schema']=='cs1618/candidate-command/1' and value['name']==name and value['status']=='completed'
            and value['exit']==0 and value['error'] is None,'complete actual command: '+name)
    require(value['argv']==command_spec(name) and value['cwd']==str(SOURCE),'fixed actual command argv/cwd')
    require(type(value['elapsed_seconds']) in (int,float) and 0<=value['elapsed_seconds']<=3900,'bounded actual command elapsed')
    for key in ('stdout','stderr'):verify_reference(value[key],32*MIB)
    return value


def validate_oc10_streams(stdout, stderr):
    require(re.search(rb'test result: ok\. 1 passed; 0 failed; 0 ignored; 0 measured; [0-9]+ filtered out;',stdout),
            'original exact Cargo/libtest completion required')
    prefix=b'# prismpm-node-owner-diagnostic '
    values=[decode(line[len(prefix):]+b'\n') for line in stderr.splitlines() if line.startswith(prefix)]
    values=[value for value in values if value.get('owner')=='OC-10']
    require(len(values)==1,'one complete original OC10 owner summary')
    value=closed(values[0],'scope owner elapsed_ms files tests')
    require(value['scope']=='node-owner-diagnostic-not-acceptance' and value['owner']=='OC-10'
            and type(value['tests']) is int and value['tests']==67 and type(value['files']) is int and value['files']==2
            and type(value['elapsed_ms']) is int and 0<=value['elapsed_ms']<=3600000,'original numeric67/two-file summary')
    return value


def run_oc10():
    partial=read_json(HOME/'preparation-partial.json');outer=partial['started']+21600
    admit_phase('oc10',outer)
    require(source_files(SOURCE)==read_json(HOME/'source-files.json'),'held source before OC10')
    harness=read_json(HOME/'harness.json');closed(harness,'path bytes sha256 dev ino target')
    verify_reference({key:harness[key] for key in ('path','bytes','sha256')})
    info=Path(harness['path']).lstat();require(str(info.st_dev)==harness['dev'] and str(info.st_ino)==harness['ino'],'held conformance harness')
    require(harness['target']==str(HOME/'harness-target') and Path(harness['path']).is_relative_to(HOME/'harness-target'),
            'fixed original harness target')
    reject_environment(os.environ)
    environment={**os.environ,'CARGO_TARGET_DIR':harness['target'],'CARGO_NET_OFFLINE':'true',
                 'PATH':'/usr/local/elan/bin:/usr/local/cargo/bin:/usr/local/bin:/usr/bin:/bin'}
    argv=['/usr/local/cargo/bin/cargo','test','--locked','--offline','-p','repo-conformance','--test','conformance',
          'conformance_oc_10','--','--exact','--nocapture']
    state=command('oc10',argv,SOURCE,min(time.monotonic()+3900,outer-600),environment)
    require(source_files(SOURCE)==read_json(HOME/'source-files.json'),'held source after OC10')
    verify_reference({key:harness[key] for key in ('path','bytes','sha256')})
    summary=validate_oc10_streams(regular(Path(state['stdout']['path']),32*MIB),regular(Path(state['stderr']['path']),32*MIB))
    value={'schema':'cs1618/candidate-original-oc10/1','status':'completed','command':reference(HOME/'commands/oc10.json'),
           'summary':summary,'source_validator':[reference(SOURCE/path) for path in
            ('crates/conformance/src/cases/mod.rs','crates/conformance/src/cases/node_suite.rs','scripts/owning-node-reporter.mjs',
             'tests/publication-context-linkage/owner.test.mjs')]}
    write(HOME/'oc10.json',value)


def locators(kind, source=SOURCE):
    require(kind in REGISTRIES,'closed discovery registry')
    module_name,schema=REGISTRIES[kind];registry=source/('target/conditional-publication-'+kind+'-locators')
    if not os.path.lexists(registry):return []
    directory(source);directory(source/'target');directory(registry,True)
    names=sorted(os.listdir(registry));require(len(names)<=256,'locator registry count bound')
    result=[];total=0
    owner_hash=sha(regular(source/'tests/publication-context-linkage'/module_name,MIB))
    for name in names:
        path=registry/name;raw=regular(path,4096);total+=len(raw);require(total<=MIB,'locator aggregate bound')
        require(stat.S_IMODE(path.lstat().st_mode) in (0o400,0o444),'immutable locator mode')
        value=decode(raw);closed(value,'schema complete accepted work_basename work_path source_root owner_module_sha256')
        require(value['schema']==schema and value['complete'] is False and value['accepted'] is False,'noncompletion locator')
        require(type(value['work_basename']) is str and re.fullmatch('prismpm-publication-'+kind+'-[A-Za-z0-9_-]{6,64}',value['work_basename'])
                and name==value['work_basename']+'.json' and value['work_path']=='/tmp/'+value['work_basename']
                and value['source_root']==str(source) and value['owner_module_sha256']==owner_hash,'fixed locator path/source/module join')
        directory(Path(value['work_path']),True)
        result.append((path,value))
    return result


def validate_scenario(value, id, preparation_hash, subject_hash):
    closed(value,'schema id status scope complete_application_accepted preparation_sha256 subject_sha256 owner_token descriptor_sha256 probe observations fault retirement')
    require(value['schema']=='cs1618/candidate-capture-scenario/1' and value['id']==id and value['scope']=='actual-daemon-qualification-only'
            and value['complete_application_accepted'] is False and value['preparation_sha256']==preparation_hash
            and value['subject_sha256']==subject_hash and re.fullmatch('[0-9a-f]{32}',value['owner_token'])
            and isinstance(value['descriptor_sha256'],str) and re.fullmatch('[0-9a-f]{64}',value['descriptor_sha256']), 'actual closed scenario bindings')
    fault=closed(value['fault'],'kind observed_refusal execution_created');retirement=closed(value['retirement'],'actors volumes cleanup_daemon_calls attachment_waits uncertain')
    positive=id in ('Q1','Q2')
    require(value['status']==('qualified' if positive else 'expected-refusal') and fault['kind']==FAULTS[id]
            and fault['observed_refusal'] is (not positive) and fault['execution_created'] is (id in ('Q1','Q2','Q6')),
            'required finite scenario outcome')
    require(retirement['uncertain'] is False and type(retirement['cleanup_daemon_calls']) is int
            and 0<retirement['cleanup_daemon_calls']<=LEDGER[id] and type(retirement['attachment_waits']) is int
            and 0<=retirement['attachment_waits']<=2,'bounded certain retirement')
    expected_actors=['inspect','stage']+(['execute'] if id in ('Q1','Q2','Q6') else [])+(['qualification-writer'] if id=='Q3' else [])
    require([row['role'] for row in retirement['actors']]==expected_actors,'complete actual actor inventory')
    for row in retirement['actors']:
        closed(row,'role name id absent')
        require(row['name']=='prismpm-candidate-'+value['owner_token']+'-'+row['role'] and row['absent'] is True
                and isinstance(row['id'],str) and re.fullmatch('[0-9a-f]{64}',row['id']),'authenticated actor absence')
    expected_volumes=['input']+(['work'] if id in ('Q1','Q2','Q6') else [])
    require([row['role'] for row in retirement['volumes']]==expected_volumes,'complete volume inventory')
    for row in retirement['volumes']:
        closed(row,'role name absent');require(row['name']=='prismpm-candidate-'+value['owner_token']+'-'+row['role']
                                              and row['absent'] is positive,'actual volume disposition')
    require((value['probe'] is not None)==positive,'read-only proof only for positive scenarios')
    if positive:verify_reference(value['probe'],MIB)
    require(type(value['observations']) is list and value['observations'],'raw actual observations required')
    for row in value['observations']:
        require(row.get('role') in ('daemon','stage','execute') and row.get('kind') in ('argv.json','failed.json','stdout','stderr','exception.stdout','exception.stderr','stream','eof'),'closed observation role/kind')
        closed(row,'role kind path bytes sha256');verify_reference({key:row[key] for key in ('path','bytes','sha256')},32*MIB)
    return value


class Store:
    """Copies only explicit products. A manifest never follows a retained alias."""
    def __init__(self, root):
        self.root=Path(root);self.root.mkdir(parents=True,mode=0o700,exist_ok=True)
        directory(self.root,True);require(not any(self.root.iterdir()),'fresh artifact store')
        self.files=[];self.mapping=[];self.total=0
    def add(self,path,name,limit=MAX_FILE,links=1):
        safe_relative(name);path=Path(path)
        body=regular(path,limit) if links==1 else owned_recorded_file(path,limit,links)
        require(self.total+len(body)<=MAX_TOTAL-MAX_METADATA,'complete remote artifact set exceeds4GiB')
        target=self.root/name;target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        require(shutil.disk_usage(self.root).free>=8*1024**3+len(body),'retained copy must preserve8GiB free')
        fd=os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o400)
        with os.fdopen(fd,'wb') as stream:stream.write(body)
        row={'path':name,'bytes':len(body),'sha256':sha(body)};self.files.append(row);self.total+=len(body)
        self.mapping.append({'original':str(path),'retained':name,'bytes':len(body),'sha256':sha(body)})
        return row
    def archive(self,root,records,name,capture=False):
        """Original direct source aliases become exact tar entries, never dereferences."""
        root=Path(root);directory(root);safe_relative(name)
        require(measure_tree(root,capture=capture)==records,'complete original archive tree differs')
        require(type(records) is dict and len(records)<=100000,'bounded complete source/archive inventory')
        total=sum(row.get('bytes',0) for row in records.values())
        require(total<=512*MIB,'original source/tree bound')
        target=self.root/name;target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        require(not target.exists(),'exclusive archive')
        expected=total+len(records)*2048+10240
        require(self.total+expected<=MAX_TOTAL-MAX_METADATA,'archive including headers exceeds artifact bound')
        require(shutil.disk_usage(self.root).free>=8*1024**3+expected,'archive copy must preserve8GiB free')
        with tarfile.open(target,'x',format=tarfile.PAX_FORMAT) as archive:
            for path,row in sorted(records.items()):
                safe_relative(path);source=root/path;info=source.lstat();member=tarfile.TarInfo(path);member.mtime=0
                member.uid=member.gid=0;member.mode=stat.S_IMODE(info.st_mode)
                if row['kind']=='directory':
                    require(stat.S_ISDIR(info.st_mode) and source.resolve()==source,'original actual directory')
                    member.type=tarfile.DIRTYPE;archive.addfile(member)
                elif row['kind']=='link':
                    require(stat.S_ISLNK(info.st_mode) and os.readlink(source)==row['target'],'original direct alias')
                    resolved=(source.parent/row['target']).resolve()
                    require(not row['target'].startswith('/') and resolved==root/row['resolved'] and row['resolved'] in records,
                            'original alias resolves within exact inventory')
                    member.type=tarfile.SYMTYPE;member.linkname=row['target'];archive.addfile(member)
                else:
                    require(row['kind']=='file','closed archive member kind');body=regular(source)
                    require(len(body)==row['bytes'] and sha(body)==row['sha256']
                            and bool(info.st_mode&0o100)==row['executable'],'actual original file inventory')
                    member.size=len(body);archive.addfile(member,io.BytesIO(body))
        os.chmod(target,0o400);body=regular(target,MAX_TOTAL)
        require(self.total+len(body)<=MAX_TOTAL-MAX_METADATA,'actual archive cap')
        result={'path':name,'bytes':len(body),'sha256':sha(body)};self.files.append(result);self.total+=len(body)
        self.mapping.append({'original':str(root),'retained':name,'archive':'pax-direct-source-aliases',
                             'inventory_sha256':sha(encoded(records)),'bytes':len(body),'sha256':sha(body)})
        return result


def owned_recorded_file(path, limit, links):
    # Only original compiler/Wasm records admit their measured original links.
    require(type(links) is int and 1<=links<=100000,'original recorded link count')
    path=Path(path);before=path.lstat()
    require(path.resolve()==path and stat.S_ISREG(before.st_mode) and before.st_uid==os.getuid()
            and before.st_nlink==links and before.st_size<=limit,'original recorded artifact custody')
    fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
    try:
        with os.fdopen(fd,'rb',closefd=False) as stream:body=stream.read(limit+1)
        keys=('st_dev','st_ino','st_size','st_mode','st_nlink','st_mtime_ns','st_ctime_ns')
        require(len(body)==before.st_size and all(getattr(before,k)==getattr(after,k) for k in keys
                for after in (os.fstat(fd),path.lstat())),'original recorded artifact changed')
        return body
    finally:os.close(fd)


def retained_controls(value,envelope,executable_sha):
    closed(value,'schema scope complete_application_accepted status source_sha256 envelope_sha256 executable_sha256 controls')
    require(value['schema']=='prismpm/candidate-retained-controls/1' and value['scope']=='actual-held-capture-mutations-only'
            and value['complete_application_accepted'] is False and value['status']=='completed'
            and value['source_sha256']==envelope['descriptor']['source_sha256'] and value['executable_sha256']==executable_sha,
            'actual retained-control identity')
    authorities=('conditional-capture-bootstrap.py','conditional-capture-candidate-command.mjs','conditional-capture-candidate.py',
                 'conditional-capture-sdk.py','sdk-command-owner.mjs','sdk-command-owner.py')
    expected=[('source-byte','source/crates/prismpm/src/exporter/source.rs','refused')]
    expected += [('authority-byte:'+name,'source/scripts/'+name,'refused') for name in authorities]
    expected += [(name,'capture/candidate-transport-evidence.json','refused') for name in ('envelope-missing','envelope-altered','retirement-incomplete')]
    expected += [(name,'capture/candidate-transport-evidence.json','observed-shape-accepted') for name in ('observed-config-coherent','observed-retirement-coherent')]
    expected += [('added:'+name,'capture/'+name,'not-invoked') for name in ('.git','target','.lexlean','.prism')]
    require(len(value['controls'])==16,'all16 actual controls required')
    for row,wanted in zip(value['controls'],expected):
        closed(row,'id target reader_result held_owner_refused restored')
        require((row['id'],row['target'],row['reader_result'])==wanted and row['held_owner_refused'] is True and row['restored'] is True,
                'ordered actual restored held-owner control')


def confined(root,path):
    require(type(path) is str and Path(path).is_absolute() and Path(path).is_relative_to(root) and str(Path(path))==path
            and '..' not in Path(path).parts,'typed original path inside owned work')
    return Path(path)


def collect_linkage(store,work,value,label,baseline=False):
    require(value.get('spec')=='prismpm/private-publication-linkage-evidence/1' and value.get('scope')=='component-only'
            and value.get('completeApplicationAccepted') is False,'original linkage receipt contract')
    require(type(value['retainedFiles']) is dict and 0<len(value['retainedFiles'])<=100000,'full original replay inventory')
    required={'project/lexlean.toml','project/lean-toolchain','project/lakefile.toml','runner/src/main.rs','runner/Cargo.lock',
              'context-fields-runner/src/main.rs','context-fields-runner/Cargo.lock','export/kernel.ir','generated/generation-manifest.json'}
    roles=WASM_ROLES if baseline else tuple(value['wasm'])
    if baseline:
        require(set(value['wasm'])==set(WASM_ROLES) and set(value['native'])==set(NATIVE_ROLES),'all actual baseline replay roles')
        required.update(('actual-capture-native.tsv','actual-context.tsv'))
        require(len(value['mutations'])==len(MUTATIONS) and tuple(row['kind'] for row in value['mutations'])==MUTATIONS,
                'all original source mutant owners')
    for role in value['native']:
        require(role in NATIVE_ROLES,'closed native replay role');required.add('native-'+role+'-observer')
    links={}
    for role in roles:
        require(role in WASM_ROLES,'closed original Wasm role')
        row=closed(value['wasm'][role],'original private')
        for side in ('original','private'):
            artifact=row[side];path=safe_relative(artifact['path']);required.add(path)
            require(artifact['sha256']==value['retainedFiles'].get(path,{}).get('sha256'),'Wasm reference/inventory join')
            links[path]=int(artifact['links']);verify_custody(work/path,artifact)
    require(type(value['generatedPackages']) is list and value['generatedPackages'],'actual generated package inventory')
    for package in value['generatedPackages']:
        closed(package,'path kind files');prefix=safe_relative(package['path'])
        require(package['kind'] in ('native','wasm') and type(package['files']) is dict and package['files'],'generated package contract')
        expected_package={'Cargo.lock','Cargo.toml','src/lib.rs','generation-manifest.json'} | ({'LICENSE-APACHE','LICENSE-MIT','README.md'} if package['kind']=='native' else {'.cargo/config.toml'})
        require(set(package['files'])==expected_package,'original closed generated package file set')
        for path,digest in package['files'].items():
            joined=prefix+'/'+safe_relative(path);required.add(joined)
            require(value['retainedFiles'].get(joined,{}).get('sha256')==digest,'full original generated package joins')
    require(required<=set(value['retainedFiles']),'required replay endpoint omitted')
    proof=confined(work,value['proof']['root']);proof_prefix=str(proof.relative_to(work))+'/'
    require({proof_prefix+'build-manifest.json',proof_prefix+'attestation.json'}<=set(value['retainedFiles']),'original proof manifest/attestation required')
    for path,row in sorted(value['retainedFiles'].items()):
        safe_relative(path);closed(row,'bytes sha256')
        retained=store.add(work/path,label+'/products/'+path,links=links.get(path,1))
        require(retained['bytes']==row['bytes'] and retained['sha256']==row['sha256'],'retained replay product bytes')
    require(sha(regular(work/'export/kernel.ir'))==value['ir'],'actual retained IR digest')
    for role,digest in value['native'].items():require(sha(regular(work/('native-'+role+'-observer')))==digest,'actual native replay executable')
    return store.add(work/'publication-linkage-evidence.json',label+'/publication-linkage-evidence.json',32*MIB)


def validate_linkage_join(capture_work,owner,by_work):
    require(owner['factory']['path']==str(capture_work/'capture-factory-evidence.json')
            and owner['factory']['sha256']==sha(regular(capture_work/'capture-factory-evidence.json',32*MIB)),'original factory join')
    closed(owner['linkage'],'work receipt')
    require(owner['linkage']['work'] in by_work and owner['linkage']['receipt']=='publication-linkage-evidence.json',
            'typed reverse linkage locator join')
    work=Path(owner['linkage']['work']);linkage=read_json(work/'publication-linkage-evidence.json')
    require(linkage['actualCapture']=={'path':str(capture_work/'capture-owner-evidence.json'),
            'sha256':sha(regular(capture_work/'capture-owner-evidence.json',32*MIB))},'later forward original capture-owner join')
    require(linkage['ir']==owner['ir'] and linkage['compiler']==owner['compiler'],'original compiler/IR replay join')
    return work,linkage


def collect_original_oc10(store,captures,linkages):
    require(len(captures)==1,'exactly one original captured factory locator')
    require(len(linkages)==1+len(MUTATIONS),'baseline and all20 original mutant linkage locators')
    by_work={value['work_path']:value for _,value in linkages};capture_work=Path(captures[0][1]['work_path'])
    factory=read_json(capture_work/'capture-factory-evidence.json')
    closed(factory,'schema completeApplicationAccepted source executable actualCapture candidateTransport separateDiagnostics retainedControls retainedTree reconstructibleCacheOnly')
    owner=read_json(capture_work/'capture-owner-evidence.json')
    closed(owner,'schema completeApplicationAccepted factory execution compiler ir linkage')
    require(factory['schema']=='prismpm/private-publication-capture-factory/1' and owner['schema']=='prismpm/private-publication-capture-owner/1'
            and factory['completeApplicationAccepted'] is False and owner['completeApplicationAccepted'] is False,'original nonacceptance receipts')
    work,linkage=validate_linkage_join(capture_work,owner,by_work)
    closed(owner['execution'],'linkage fields admission')
    envelope_path=capture_work/'capture/candidate-transport-evidence.json';envelope=read_json(envelope_path)
    require(envelope['schema']=='prismpm/conditional-candidate-transport-evidence/1' and envelope['complete_application_accepted'] is False,
            'actual source transport envelope required')
    descriptor=envelope['descriptor'];module=load_source();module.validate_descriptor(descriptor)
    require(descriptor['source_root']==str(capture_work/'source') and descriptor['source_selection']=='private','actual OC10 compiled private root')
    normalized=[{'path':path,**{key:item for key,item in row.items() if key!='resolved'}} for path,row in
                sorted(factory['source'].items(),key=lambda pair:pair[0].encode('utf-8'))]
    require(descriptor['source']==normalized and descriptor['union']==normalized
            and descriptor['source_sha256']==sha(encoded(normalized)),'actual original complete private source join')
    require(descriptor['runtime']['config_digest']==read_json(HOME/'preparation.json')['sdk']['config_digest']
            and descriptor['sdk_image']==SDK and descriptor['executable_sha256']==factory['executable']['private']['sha256'],
            'original OC10 SDK/ELF identity joins')
    transport=closed(factory['candidateTransport'],'schema complete_application_accepted envelope_sha256 source_sha256 executable_sha256 retained_tree_sha256 observation_scope')
    require(transport['schema']=='prismpm/verified-candidate-transport/1' and transport['complete_application_accepted'] is False
            and transport['envelope_sha256']==sha(regular(envelope_path,32*MIB)) and transport['source_sha256']==descriptor['source_sha256']
            and transport['executable_sha256']==descriptor['executable_sha256'],'actual retained independent transport reader')
    control_path=capture_work/'candidate-retained-controls.json';controls=read_json(control_path,65536)
    retained_controls(controls,envelope,factory['executable']['private']['sha256'])
    require(controls['envelope_sha256']==sha(regular(envelope_path,32*MIB)),'held original envelope digest')
    control_ref=factory['retainedControls'];closed(control_ref,'path bytes sha256')
    require(control_ref=={'path':'candidate-retained-controls.json','bytes':control_path.stat().st_size,'sha256':sha(regular(control_path,65536))},'factory retained control sibling')
    require(factory['reconstructibleCacheOnly']==['producer-source/target'],'original single registered cache exclusion')
    receipt=read_json(capture_work/'capture/capture-evidence.json')
    require(receipt['complete_application_accepted'] is False and receipt['source_free'] is True
            and receipt['graph_refusals']==[{'role':role,'defect':defect,'code':'PP6101'} for role in ('build-manifest','sdk-lock','standards-lock','semantic-snapshot','model','system','runtime-manifest','kernel-attestation','provenance','validation','oracle-attestation') for defect in ('changed','missing')] and receipt['publisher_field_substitutions']==3
            and receipt['refused_attempts']==['instance','revision','empty-ref','oversized-ref'],'actual original22 graph/control receipt')
    require(factory['actualCapture']['actualCaptureSha256']==sha(regular(capture_work/'capture/capture-evidence.json',32*MIB))
            and factory['actualCapture']['sourceRevision']==receipt['source_revision'],'actual independent original oracle join')
    # Source retains the independently executed reader/oracle results, not a revived owner.
    require(factory['candidateTransport'] and factory['actualCapture'] and factory['separateDiagnostics'],'actual independent readers and diagnostics')
    result={}
    for name in ('capture-factory-evidence.json','capture-owner-evidence.json','candidate-retained-controls.json',
                 'candidate-diagnostics-index.json','cargo.jsonl','publication-capture-executable-relocation.json',
                 'publication-gate-executable-relocation.json','exact-gate.list','exact-gate.stdout','exact-gate-evidence.json','readonly-fixture.stdout'):
        result[name]=store.add(capture_work/name,'oc10/capture-owner/'+name,32*MIB)
    for side,row in factory['executable'].items():
        path=safe_relative(row['path']);verify_custody(capture_work/path,row);retained=store.add(capture_work/path,'oc10/capture-owner/'+path,links=int(row['links']))
        require(retained['sha256']==row['sha256'] and retained['bytes']==row['size'],'original capture ELF custody')
    collect_exact_gate(store,capture_work)
    store.archive(capture_work/'source',factory['source'],'oc10/captured-source.tar')
    store.archive(capture_work/'capture',factory['retainedTree'],'oc10/capture-tree.tar',capture=True)
    diagnostics=read_json(capture_work/'candidate-diagnostics-index.json')
    # The original index names fixed sibling members; keep its raw schema and
    # independently enumerate only that bounded diagnostic directory below.
    retain_diagnostics(store,capture_work/'capture.candidate-diagnostics','oc10/candidate-diagnostics',diagnostics)
    result['linkage']=collect_linkage(store,work,linkage,'oc10/linkage',True)
    for index,mutant in enumerate(linkage['mutations']):
        ref=mutant['evidence'];path=Path(ref['path'])
        require(str(path.parent) in by_work and path.name=='publication-linkage-evidence.json'
                and sha(regular(path,32*MIB))==ref['sha256'],'typed actual source-mutant receipt join')
        value=read_json(path);require(value['kind']==MUTATIONS[index] and value['intendedMutationRejected'] is True,'actual intended mutant refusal')
        collect_linkage(store,path.parent,value,'oc10/mutants/'+MUTATIONS[index])
    require(set(by_work)=={str(work),*[str(Path(row['evidence']['path']).parent) for row in linkage['mutations']]},'no unjoined linkage work')
    input_root=Path(linkage['inputSnapshot']);require(input_root==work/'frozen-inputs','exact original complete input snapshot')
    for path,digest in sorted(linkage['inputs'].items()):
        safe_relative(path);retained=store.add(input_root/path,'oc10/frozen-inputs/'+path)
        require(retained['sha256']==digest,'original complete input snapshot')
    collect_retired_compiler(store,owner['compiler'])
    return result


def collect_exact_gate(store,work):
    pair=closed(read_json(work/'exact-gate-evidence.json'),'original private')
    require(pair['original']['sha256']==pair['private']['sha256'] and pair['original']['size']==pair['private']['size']
            and (pair['original']['device'],pair['original']['inode'])!=(pair['private']['device'],pair['private']['inode']),
            'original exact-gate independent execution copy')
    for side,name in [('original','publication-gate-built-tests'),('private','publication-gate-execution')]:
        row=pair[side];require(row['path']==name and row['links']=='1','fixed original exact-gate survivor')
        verify_custody(work/name,row);retained=store.add(work/name,'oc10/capture-owner/'+name)
        require(retained['bytes']==row['size'] and retained['sha256']==row['sha256'],'original exact-gate ELF bytes')


def retain_small_directory(store,root,label,limit):
    directory(root,True);total=0;names=sorted(root.iterdir());require(len(names)<=256,'bounded fixed diagnostics inventory')
    for path in names:
        body=regular(path,32*MIB);total+=len(body);require(total<=limit,'bounded aggregate original diagnostics')
        store.add(path,label+'/'+path.name,32*MIB)


def measure_tree(root,capture=False):
    records={};total=0;root=Path(root)
    def visit(relative):
        nonlocal total
        require(len(records)<100000,'original tree row bound')
        path=root/relative;info=path.lstat()
        if stat.S_ISLNK(info.st_mode):
            target=os.readlink(path);resolved=(path.parent/target).resolve()
            require(not target.startswith('/') and resolved.is_relative_to(root),'direct internal original alias')
            require(Path(os.path.normpath(path.parent/target))==resolved,'original alias cannot chain')
            records[relative]={'kind':'link','target':target,'resolved':str(resolved.relative_to(root))}
        elif stat.S_ISDIR(info.st_mode):
            require(path.resolve()==path,'original unaliased directory');records[relative]={'kind':'directory'}
            if capture and relative=='producer-source/target':return
            for name in sorted(os.listdir(path)):visit(relative+'/'+name)
        else:
            body=regular(path);total+=len(body);require(total<=512*MIB,'original source/tree byte bound')
            records[relative]={'kind':'file','bytes':len(body),'sha256':sha(body),'executable':bool(info.st_mode&0o100)}
    for name in sorted(os.listdir(root)):
        if capture or name not in ('.git','target','.lexlean','.prism'):visit(name)
    for row in records.values():
        if row['kind']=='link':require(row['resolved'] in records,'original alias target belongs to inventory')
    return records


def collect_retired_compiler(store,compiler):
    require(compiler.get('scope')=='fresh-owner-scoped-compiler-tools' and compiler.get('family')=='publication-linkage',
            'original source compiler owner family')
    work=Path(compiler['work']);directory(work,True)
    require(re.fullmatch('/tmp/prismpm-compiler-owner-[A-Za-z0-9_-]{6,64}',str(work)),'original compiler workspace')
    # Source compiler-owner.mjs hashes JSON.stringify(evidence), without LF.
    identity=sha(json.dumps(compiler,ensure_ascii=False,separators=(',',':')).encode())
    intent=read_json(work/'compiler-owner-retirement-intent.json')
    retired=read_json(work/'compiler-owner-retirement.json')
    require(intent=={'status':'requested','compiler':identity} and
            retired=={'scope':'completed-owner-compiler-caches','status':'retired','compiler':identity},
            'actual original compiler cache retirement joins')
    expected={'driver':('driver-target/debug/publication-context-linkage-driver','driver-execution'),
              'exporter':('exporter/.lake/build/bin/prod-export','exporter-execution/prod-export')}
    for role,(original_path,private_path) in expected.items():
        pair=closed(compiler[role],'original private');original=pair['original'];private=pair['private']
        require(original['path']==original_path and private['path']==private_path and original['sha256']==private['sha256']
                and original['size']==private['size'],'fixed original-to-surviving compiler copy relation')
        require(not os.path.lexists(work/original_path),'original source owner must retire compiler cache')
        path=work/private_path;body=regular(path);info=path.lstat()
        require(sha(body)==private['sha256'] and len(body)==private['size'] and str(info.st_dev)==private['device']
                and str(info.st_ino)==private['inode'] and str(info.st_uid)==private['uid'] and str(info.st_gid)==private['gid']
                and info.st_mode==private['mode'] and str(info.st_nlink)==private['links'],'actual still-owned surviving compiler')
        row=store.add(path,'oc10/compiler/'+private_path)
        store.mapping.append({'original':str(work/original_path),'retained':row['path'],'bytes':row['bytes'],'sha256':row['sha256'],
                              'disposition':'original-reconstructible-cache-retired','retirement':'oc10/compiler/compiler-owner-retirement.json'})
    require(not os.path.lexists(work/'exporter/.lake/build'),'original exporter build cache absent')
    for name in ('compiler-owner-retirement-intent.json','compiler-owner-retirement.json'):
        store.add(work/name,'oc10/compiler/'+name,MIB)


def retain_diagnostics(store,root,label,index):
    closed(index,'schema directory owner_token complete_application_accepted completeness files')
    require(index['schema']=='prismpm/private-candidate-diagnostics-index/1' and index['directory']==str(root)
            and index['complete_application_accepted'] is False and index['completeness']=='not asserted',
            'original diagnostic index scope')
    caps={'capture.stderr':32*MIB,'capture.stdout':32*MIB,'exception.stderr':32*MIB,'exception.stdout':32*MIB,
          'execute.stderr':MIB,'owner.stderr':MIB,'stage.stderr':MIB}
    manifest=read_json(root/'manifest.json',MIB)
    require(manifest=={'schema':'prismpm/conditional-candidate-diagnostics/1','owner_token':index['owner_token'],
            'complete_application_accepted':False,'channels':[{'path':name,'maximum_bytes':caps[name]} for name in sorted(caps)],
            'aggregate_limits':{'capture':64*MIB,'exception':32*MIB}},'original diagnostic channel manifest')
    names=[row['path'] for row in index['files']]
    require(names==sorted(os.listdir(root)) and len(names)==len(set(names)) and 'manifest.json' in names,
            'original diagnostic index complete available inventory')
    totals={'capture':0,'exception':0}
    for row in index['files']:
        closed(row,'path bytes sha256');name=row['path'];require(name in caps or name=='manifest.json','fixed diagnostic channel')
        retained=store.add(root/name,label+'/'+name,MIB if name=='manifest.json' else caps[name])
        require(retained['bytes']==row['bytes'] and retained['sha256']==row['sha256'],'original diagnostic bytes')
        family=name.split('.')[0]
        if family in totals:totals[family]+=row['bytes']
    require(totals['capture']<=64*MIB and totals['exception']<=32*MIB,'original diagnostic aggregate bounds')


def verify_custody(path,row):
    path=Path(path);body=owned_recorded_file(path,MAX_FILE,int(row['links']));info=path.lstat()
    require(len(body)==row['size'] and sha(body)==row['sha256'] and str(info.st_dev)==row['device']
            and str(info.st_ino)==row['inode'] and str(info.st_nlink)==row['links'],'actual original artifact identity')
    for key,actual in [('uid',str(info.st_uid)),('gid',str(info.st_gid)),('mode',info.st_mode)]:
        if key in row:require(row[key]==actual,'original artifact ownership/mode')


def validate_subject(subject,build,plan,id):
    closed(subject,'schema root_kind source_root source_sha256 union_sha256 cargo_output artifact execution listing')
    closed(subject['artifact'],'path bytes sha256 manifest_path dev ino fresh')
    closed(subject['execution'],'path bytes sha256 dev ino mode')
    closed(subject['listing'],'path bytes sha256 test_count exact_test')
    closed(build,'id work root cargo_output artifact execution listing source_inventory')
    require(build['id']==id,'closed subject build identity')
    root=Path(subject['source_root']);work=Path(build['work'])
    require(id in ('Q1','Q2') and subject['schema']=='cs1618/candidate-capture-subject/1'
            and subject['root_kind']==('tracked' if id=='Q1' else 'private'),'actual closed subject kind')
    require((id=='Q1' and root==SOURCE and work==HOME/'subjects/Q1') or
            (id=='Q2' and re.fullmatch('/tmp/prismpm-publication-capture-[A-Za-z0-9_-]{6,64}',str(work)) and root==work/'source'),
            'actual distinct compiled root')
    require(build['root']==str(root) and subject['artifact']['manifest_path']==str(root/'crates/prismpm/Cargo.toml')
            and subject['artifact']['fresh'] is False,'original fresh manifest root')
    for key in ('artifact','execution'):
        row=subject[key];require(Path(row['path'])==work/('publication-capture-built-tests' if key=='artifact' else 'publication-capture-execution'),'closed private subject file')
        require(regular(Path(row['path'])).startswith(b'\x7fELF'),'actual Linux ELF subject')
        verify_reference({k:row[k] for k in ('path','bytes','sha256')});info=Path(row['path']).lstat()
        require(row['dev']==str(info.st_dev) and row['ino']==str(info.st_ino),'actual retained subject inode')
    require(stat.S_IMODE(subject['execution']['mode'])==0o500 and subject['execution']['mode']==Path(subject['execution']['path']).lstat().st_mode
            and subject['artifact']['ino']!=subject['execution']['ino']
            and subject['artifact']['sha256']==subject['execution']['sha256'] and subject['artifact']['bytes']==subject['execution']['bytes'],
            'original emitted ELF plus distinct equal execution copy')
    require(subject['cargo_output']['path']==str(work/'cargo.jsonl') and subject['listing']['path']==str(work/'listing.txt'),'fixed original subject products')
    verify_reference(subject['cargo_output'],32*MIB)
    rows=[json.loads(line,object_pairs_hook=unique) for line in regular(Path(subject['cargo_output']['path']),32*MIB).splitlines()]
    actual=[row for row in rows if row.get('reason')=='compiler-artifact' and row.get('target',{}).get('name')=='prismpm'
            and row.get('profile',{}).get('test') and row.get('executable')]
    require(len(actual)==1,'one original source Cargo libtest artifact')
    artifact=actual[0]
    require(artifact['fresh'] is False and artifact['target']['kind']==['lib']
            and artifact['manifest_path']==str(root/'crates/prismpm/Cargo.toml')
            and artifact['target']['src_path']==str(root/'crates/prismpm/src/lib.rs')
            and Path(artifact['executable']).is_relative_to(work/'cargo-target'),'actual original fresh Cargo root/output')
    relocation=read_json(work/'relocation.json')
    require(relocation=={'emitted':artifact['executable'],'retained':subject['artifact']['path'],'dev':subject['artifact']['dev'],
                        'ino':subject['artifact']['ino'],'sha256':subject['artifact']['sha256']},'actual moved emitted inode')
    listing=subject['listing'];verify_reference({key:listing[key] for key in ('path','bytes','sha256')},MIB)
    require(type(listing['test_count']) is int and 1<=listing['test_count']<=100000,'original test-count bound')
    lines=regular(Path(listing['path']),MIB).decode().splitlines()
    require(listing['exact_test']=='oci::publication_context::capture_tests::actual_source_free_capture_constructs_complete_conditional_context'
            and len(lines)==listing['test_count'] and len(lines)==len(set(lines)) and all(line.endswith(': test') for line in lines)
            and lines.count(listing['exact_test']+': test')==1,'complete exact listing/count')
    require(plan['source_root']==str(root) and plan['source_selection']==subject['root_kind']
            and plan['source_sha256']==subject['source_sha256'] and plan['union_sha256']==subject['union_sha256']
            and plan['executable_sha256']==subject['execution']['sha256'] and plan['executable_bytes']==subject['execution']['bytes']
            and plan['listing_sha256']==listing['sha256'] and plan['test_count']==listing['test_count'],'independent measured subject joins')
    return subject


def validate_preparation(value):
    closed(value,'schema game source sdk driver probe subject_adapter source_container')
    require(value['schema']=='cs1618/candidate-capture-preparation/1','closed preparation schema')
    partial=validate_partial(read_json(HOME/'preparation-partial.json'))
    for key in ('game','source',*AUTHORITY):require(value[key]==partial[key],'independent original host preparation join: '+key)
    closed(value['game'],'commit tree');closed(value['source'],'commit tree snapshot_manifest_sha256 bundle_sha256 patch_sha256')
    require(value['source']['commit']==REVISION and value['source']['tree']==TREE,'fixed reviewed source preparation')
    for key in ('snapshot_manifest_sha256','bundle_sha256','patch_sha256'):require(re.fullmatch('[0-9a-f]{64}',value['source'][key]),'source snapshot digest')
    for key in ('commit','tree'):require(re.fullmatch('[0-9a-f]{40}',value['game'][key]),'actual game Git identity')
    closed(value['sdk'],'reference config_digest os architecture')
    require(value['sdk']['reference']==SDK and value['sdk']['os']=='linux' and value['sdk']['architecture']=='amd64'
            and re.fullmatch('sha256:[0-9a-f]{64}',value['sdk']['config_digest']),'actual SDK preparation')
    for role,name in AUTHORITY.items():
        row=closed(value[role],'path git_blob sha256 bytes')
        require(row['path']=='scripts/numeric/'+name and re.fullmatch('[0-9a-f]{40}',row['git_blob'])
                and re.fullmatch('[0-9a-f]{64}',row['sha256']) and type(row['bytes']) is int and 0<row['bytes']<=MIB,'closed game authority')
        body=regular(HOME/name,32768 if role=='probe' else MIB)
        require(len(body)==row['bytes'] and sha(body)==row['sha256']
                and hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()==row['git_blob'],'actual game blob/code binding')
    manifest=read_json(HOME/'snapshot-manifest.json');require(sha(regular(HOME/'snapshot-manifest.json'))==value['source']['snapshot_manifest_sha256'],'actual original snapshot manifest')
    require(read_json(HOME/'restoration-receipt.json')=={'diagnosticOnly':True,**manifest},'original exact restoration receipt')
    require(manifest['candidate']==REVISION and manifest['tree']==TREE and manifest['base']==BASE and manifest['source']=='https://github.com/UOR-Foundation/prismpm','actual source restoration identity')
    container=closed(value['source_container'],'config_digest rootfs os architecture definition_sha256')
    require(re.fullmatch('[0-9a-f]{64}',container['definition_sha256']),'source definition digest')
    closed(container['rootfs'],'Type Layers')
    require(type(container['rootfs']['Layers']) is list and all(re.fullmatch('sha256:[0-9a-f]{64}',item) for item in container['rootfs']['Layers']),'actual source image layer inventory')
    require(re.fullmatch('sha256:[0-9a-f]{64}',container['config_digest']) and container['os']=='linux'
            and container['architecture']=='amd64' and container['rootfs']['Type']=='layers' and container['rootfs']['Layers'],
            'actual source image preparation')
    return value


def collect():
    metadata=HOME/'metadata';metadata.mkdir(mode=0o700,exist_ok=True)
    result={'schema':'cs1618/candidate-capture-collection/1','status':'incomplete','scope':'actual-transport-and-original-OC10-only',
            'complete_application_accepted':False,'preparation':None,'scenarios':{id:None for id in SCENARIOS},
            'oc10':None,'locators':[],'files':[],'retained_bytes':0,'missing':[]}
    write(metadata/'collection.json',result,replace=True)
    store=Store(HOME/'raw');failures=result['missing'];preparation=None;captures=[];linkages=[]
    def attempt(label,operation):
        try:return operation()
        except Exception as error:
            failures.append({'phase':label,'reason':str(error)[:4096]});return None
    def take(path,name,limit=MAX_FILE):return store.add(path,name,limit)
    try:
        # Required endpoints are a fixed inventory, never the survivors of a glob.
        for name in ('preparation-partial.json','preparation.json','source-files.json','restoration-receipt.json',
                     'source-container-inspect.json','source-image-inspect.json','sdk-image-inspect.json','docker-version.json',
                     'setup.json','harness.json','harness-cargo.jsonl','oc10.json','run-status.json','game-inputs.json','source-runtime.json','tool-identities.json','snapshot-manifest.json'):
            attempt('required:'+name,lambda name=name:take(HOME/name,'orchestration/'+name,32*MIB))
        for role,name in AUTHORITY.items():attempt('authority:'+role,lambda name=name:take(HOME/name,'game/'+name,MIB))
        preparation=attempt('preparation-validation',lambda:validate_preparation(read_json(HOME/'preparation.json')))
        if preparation:
            result['preparation']=reference(HOME/'preparation.json')
            attempt('final-source',lambda:require(source_files(SOURCE)==read_json(HOME/'source-files.json'),'final source bytes changed'))
            def final_images():
                partial=read_json(HOME/'preparation-partial.json');actual=source_image(partial,HOME)
                require(actual==preparation['source_container'],'final actual source image changed')
                for name in ('source-container-inspect.json','source-image-inspect.json'):
                    take(HOME/name,'orchestration/final-'+name,32*MIB)
                sdk=json.loads(docker('image','inspect',SDK));require(len(sdk)==1 and sdk[0]['Id']==preparation['sdk']['config_digest']
                        and SDK in sdk[0]['RepoDigests'],'final actual SDK image changed')
                write(HOME/'final-sdk-image.json',sdk[0]);take(HOME/'final-sdk-image.json','orchestration/final-sdk-image.json',32*MIB)
            attempt('final-images',final_images)
        for name in (*COMPONENT_COMMANDS,'oc10'):
            path=HOME/'commands'/(name+'.json')
            state=attempt('command:'+name,lambda path=path,name=name:validate_command(read_json(path),name))
            attempt('raw-command:'+name,lambda path=path,name=name:take(path,'commands/'+name+'.json',MIB))
            for channel in ('stdout','stderr'):
                attempt('raw-stream:'+name+':'+channel,lambda name=name,channel=channel:take(HOME/'commands'/(name+'.'+channel),
                                                                                          'commands/'+name+'.'+channel,32*MIB))
        def harness_product():
            harness=read_json(HOME/'harness.json');verify_reference({key:harness[key] for key in ('path','bytes','sha256')})
            require(Path(harness['path']).is_relative_to(HOME/'harness-target'),'actual fixed conformance harness')
            take(Path(harness['path']),'orchestration/conformance-harness')
        attempt('original-harness',harness_product)
        for id in ('Q1','Q2'):
            def subject_products(id=id):
                subject=read_json(HOME/(id+'-subject.json'));build=read_json(HOME/(id+'-build.json'))
                plan=read_json(HOME/(id+'-plan.json'));load_source().validate_source_plan(plan)
                validate_subject(subject,build,plan,id)
                closed(subject,'schema root_kind source_root source_sha256 union_sha256 cargo_output artifact execution listing')
                require(subject['schema']=='cs1618/candidate-capture-subject/1' and subject['root_kind']==('tracked' if id=='Q1' else 'private'),
                        'closed distinct subject kind')
                for name in ('subject','build','plan'):take(HOME/(id+'-'+name+'.json'),'subjects/'+id+'/'+name+'.json',32*MIB)
                work=Path(build['work']);directory(work,True)
                for name in ('cargo.jsonl','listing.txt','compiler-custody.json','relocation.json','source-inventory.json'):
                    take(work/name,'subjects/'+id+'/'+name,32*MIB)
                for key in ('artifact','execution'):
                    row=subject[key];verify_reference({k:row[k] for k in ('path','bytes','sha256')})
                    require(Path(row['path']).is_relative_to(work),'subject executable must be privately owned')
                    take(Path(row['path']),'subjects/'+id+'/'+Path(row['path']).name)
                records=read_json(work/'source-inventory.json')
                store.archive(Path(subject['source_root']),records,'subjects/'+id+'/source.tar')
            attempt('subject:'+id,subject_products)
        for id in SCENARIOS:
            def scenario_products(id=id):
                folder=HOME/'scenarios'/id;value=read_json(folder/'scenario.json')
                result['scenarios'][id]=take(folder/'scenario.json','scenarios/'+id+'/scenario.json',32*MIB)
                take(folder/'outcome.json','scenarios/'+id+'/outcome.json',MIB)
                take(folder/'descriptor.json','scenarios/'+id+'/descriptor.json',32*MIB)
                index=read_json(folder/'observation-index.json');require(index==value['observations'],'independent complete raw observation inventory')
                take(folder/'observation-index.json','scenarios/'+id+'/observation-index.json',32*MIB)
                validate_observation_calls(index,value['retirement']['cleanup_daemon_calls'])
                for ordinal,row in enumerate(index):
                    require(Path(row['path']).parent==folder and Path(row['path']).name.startswith(f'{ordinal:04d}-'),'ordered fixed observation paths')
                    take(Path(row['path']),'scenarios/'+id+'/'+Path(row['path']).name,32*MIB)
                if id in ('Q1','Q2','Q3','Q6'):take(folder/'stage-admission.json','scenarios/'+id+'/stage-admission.json',MIB)
                if id in ('Q1','Q2'):
                    take(folder/'probe.json','scenarios/'+id+'/probe.json',MIB)
                    probe,code=load_probe();validate_probe(read_json(folder/'probe.json'),read_json(folder/'descriptor.json'),probe,code)
                if id=='Q6':take(folder/'attachment-ready.json','scenarios/'+id+'/attachment-ready.json',MIB)
                outcome=read_json(folder/'outcome.json');locator=outcome['diagnostic_locator']
                if locator:
                    # This is the original helper's own typed spool locator, not
                    # a guessed /tmp path or a caller-selected export actor.
                    closed(locator,'schema owner_token directory manifest manifest_sha256 complete_application_accepted')
                    require(locator['schema']=='prismpm/conditional-candidate-diagnostics-locator/1' and locator['owner_token']==value['owner_token'] and locator['manifest']=='manifest.json' and locator['complete_application_accepted'] is False,'typed original diagnostic locator')
                    path=Path(locator['directory'])
                    require(sha(regular(path/'manifest.json',MIB))==locator['manifest_sha256'],'original helper manifest digest')
                    require(str(path)=='/tmp/prismpm-candidate-diagnostics-'+value['owner_token'],'actual helper diagnostic owner path')
                    retain_small_directory(store,path,'scenarios/'+id+'/diagnostics',100*MIB)
                subject_id='Q2' if id=='Q2' else 'Q1'
                validate_scenario(value,id,sha(regular(HOME/'preparation.json')),sha(regular(HOME/(subject_id+'-subject.json'))))
            attempt('scenario:'+id,scenario_products)
        captures=attempt('capture-locators',lambda:locators('capture')) or []
        linkages=attempt('linkage-locators',lambda:locators('linkage')) or []
        for kind,rows in (('capture',captures),('linkage',linkages)):
            for path,value in rows:
                row=attempt('locator:'+path.name,lambda path=path,kind=kind:take(path,'locators/'+kind+'/'+path.name,4096))
                if row:result['locators'].append(row)
        if not captures:failures.append({'phase':'OC10','reason':'factory-not-recorded; pre-output helper spools without typed locator unavailable'})
        # Preserve the available fixed receipt endpoints even after an early
        # factory/build failure. No recursively discovered target caches.
        for kind,rows in (('capture',captures),('linkage',linkages)):
            names=('capture-factory-evidence.json','capture-owner-evidence.json','candidate-retained-controls.json','candidate-diagnostics-index.json',
                   'cargo.jsonl','exact-gate.list','exact-gate.stdout','exact-gate-evidence.json','readonly-fixture.stdout') if kind=='capture' else ('publication-linkage-evidence.json',)
            for _,locator in rows:
                for name in names:
                    path=Path(locator['work_path'])/name
                    if path.exists():attempt('available:'+name,lambda path=path,kind=kind,locator=locator:take(path,'available/'+kind+'/'+locator['work_basename']+'/'+path.name,32*MIB))
        result['oc10']=attempt('original-oc10-products',lambda:collect_original_oc10(store,captures,linkages))
        if result['oc10'] is None:
            for _,locator in captures:
                work=Path(locator['work_path'])
                for name in ('source','capture'):
                    path=work/name
                    if path.exists():
                        attempt('partial-capture:'+name,lambda path=path,name=name,locator=locator:store.archive(path,measure_tree(path,capture=name=='capture'),
                                'incomplete/'+locator['work_basename']+'/'+name+'.tar',capture=name=='capture'))
                diagnostics=work/'capture.candidate-diagnostics'
                if diagnostics.exists():attempt('partial-diagnostics',lambda diagnostics=diagnostics,locator=locator:retain_small_directory(store,diagnostics,'incomplete/'+locator['work_basename']+'/diagnostics',100*MIB))
        if result['oc10'] is None:
            for _,locator in linkages:
                work=Path(locator['work_path']);label='incomplete/'+locator['work_basename']
                # These are exact source-owned generated/source destinations,
                # independent of remaining files. Never recurse into Cargo/Lake caches.
                for name in ('project/src','export','generated','runner/src','context-fields-runner/src'):
                    path=work/name
                    if path.exists():attempt('partial-linkage:'+name,lambda path=path,name=name,label=label:store.archive(path,measure_tree(path,capture=True),label+'/'+name.replace('/','-')+'.tar',capture=True))
                for name in ('project/lexlean.toml','project/lean-toolchain','project/lakefile.toml','runner/Cargo.lock','context-fields-runner/Cargo.lock',
                             *['native-'+role+'-observer' for role in NATIVE_ROLES],*['guest-'+role+'.wasm' for role in WASM_ROLES]):
                    path=work/name
                    if path.exists():attempt('partial-linkage-file:'+name,lambda path=path,name=name,label=label:take(path,label+'/'+name))
        def final_gate():
            run=read_json(HOME/'run-status.json');closed(run,'schema status phases error')
            require(run=={'schema':'cs1618/candidate-run/1','status':'completed','phases':['setup',*SCENARIOS,'oc10'],'error':None},'all fixed run phase endpoints completed')
            setup=read_json(HOME/'setup.json');closed(setup,'schema status commands subjects harness elapsed_seconds')
            require(setup['schema']=='cs1618/candidate-setup/1' and setup['status']=='completed' and setup['commands']==list(COMPONENT_COMMANDS) and setup['subjects']==['Q1','Q2'] and type(setup['elapsed_seconds']) in (float,int) and 0<=setup['elapsed_seconds']<=2700,'complete original setup endpoint')
            verify_reference(setup['harness'])
            gate=read_json(HOME/'oc10.json');closed(gate,'schema status command summary source_validator')
            require(gate['schema']=='cs1618/candidate-original-oc10/1' and gate['status']=='completed','original gate record')
            verify_reference(gate['command']);state=validate_command(read_json(HOME/'commands/oc10.json'),'oc10')
            require(gate['summary']==validate_oc10_streams(regular(Path(state['stdout']['path']),32*MIB),regular(Path(state['stderr']['path']),32*MIB)),
                    'actual original summary must remain present')
            require(len(gate['source_validator'])==4,'exact source-validator inventory')
            for row in gate['source_validator']:verify_reference(row)
            require(all(result['scenarios'].values()) and result['oc10'] is not None and preparation is not None,'all required phases present')
            envelope=read_json(Path(captures[0][1]['work_path'])/'capture/candidate-transport-evidence.json')
            require(sha(encoded(envelope['sdk_tree']))==envelope['sdk_tree_sha256'] and all(read_json(HOME/'scenarios'/id/'probe.json')['sdk_tree_sha256']==envelope['sdk_tree_sha256'] for id in ('Q1','Q2')),'same original SDK baseline across probes and genuine capture')
            counts=[read_json(HOME/'scenarios'/id/'scenario.json')['retirement'] for id in SCENARIOS]
            require(sum(row['cleanup_daemon_calls'] for row in counts)<=50 and sum(row['attachment_waits'] for row in counts)<=8,
                    'aggregate six-invocation retirement ledger')
        attempt('final-original-gate',final_gate)
        write(HOME/'retained-mapping.json',store.mapping);take(HOME/'retained-mapping.json','retained-mapping.json',32*MIB)
        result['files']=sorted(store.files,key=lambda row:row['path']);result['retained_bytes']=store.total
        if not failures:result['status']='complete-conditional-evidence'
        # Publish only after all required data. Any publication/metadata overflow
        # returns to incomplete; an earlier success file is never left in place.
        write(metadata/'collection.json',result,replace=True)
        for name in ('preparation-partial.json','preparation.json','setup.json','oc10.json','run-status.json','retained-mapping.json'):
            path=HOME/name
            if path.exists():shutil.copyfile(path,metadata/name);os.chmod(metadata/name,0o400)
        size=sum(path.stat().st_size for path in metadata.iterdir())
        require(size<=MAX_METADATA and size+store.total<=MAX_TOTAL,'metadata/full artifact combined cap')
    except BaseException as error:
        result['status']='incomplete';failures.append({'phase':'collection','reason':str(error)[:4096]})
        result['files']=sorted(store.files,key=lambda row:row['path']);result['retained_bytes']=store.total
        write(metadata/'collection.json',result,replace=True)
        raise
    finally:
        if failures:
            result['status']='incomplete';write(metadata/'collection.json',result,replace=True)
    require(result['status']=='complete-conditional-evidence','collection incomplete: '+str(failures))
    return result


def run_all():
    status={'schema':'cs1618/candidate-run/1','status':'incomplete','phases':[],'error':None}
    write(HOME/'run-status.json',status)
    try:
        setup_preparation();build_subjects();status['phases'].append('setup')
        partial=read_json(HOME/'preparation-partial.json');outer=partial['started']+21600
        for id in SCENARIOS:
            admit_phase(id,outer)
            try:qualify(id)
            except Exception as error:status['error']=str(error)[:4096]
            status['phases'].append(id);write(HOME/'run-status.json',status,replace=True)
        run_oc10();status['phases'].append('oc10')
        if status['error'] is None:status['status']='completed'
    except BaseException as error:status['error']=str(error)[:4096]
    finally:
        write(HOME/'run-status.json',status,replace=True)
        partial=read_json(HOME/'preparation-partial.json')
        def expired(signum,frame):raise CollectionDeadline('absolute collection budget exhausted')
        previous=signal.signal(signal.SIGALRM,expired)
        signal.setitimer(signal.ITIMER_REAL,max(0.001,partial['started']+21600-time.monotonic()-120))
        try:collect()
        finally:signal.setitimer(signal.ITIMER_REAL,0);signal.signal(signal.SIGALRM,previous)


def validate_collection_shape(value):
    closed(value,'schema status scope complete_application_accepted preparation scenarios oc10 locators files retained_bytes missing')
    require(value['schema']=='cs1618/candidate-capture-collection/1' and value['scope']=='actual-transport-and-original-OC10-only'
            and value['complete_application_accepted'] is False and value['status'] in ('incomplete','complete-conditional-evidence'),
            'closed nonacceptance collection scope')
    require(type(value['scenarios']) is dict and set(value['scenarios'])==set(SCENARIOS)
            and type(value['files']) is list and type(value['locators']) is list and type(value['missing']) is list
            and type(value['retained_bytes']) is int and 0<=value['retained_bytes']<=MAX_TOTAL,'closed collection inventories')
    paths=[row['path'] for row in value['files']]
    require(paths==sorted(set(paths)),'complete unique sorted retained file inventory')
    if value['status']=='complete-conditional-evidence':
        require(not value['missing'] and value['preparation'] is not None and value['oc10'] is not None
                and all(value['scenarios'].values()) and value['locators'] and value['files'], 'every required phase in completed collection')
    return value


def host_collect(phase):
    root=Path.cwd().resolve();home=root/'prismpm/target/candidate-qualification-driver';evidence=root/'evidence'
    partial=read_json(home/'preparation-partial.json')
    require(git(root/'game','rev-parse','HEAD').decode().strip()==partial['game']['commit'],'host game checkout identity')
    for role,name in AUTHORITY.items():
        body=git(root/'game','show',partial['game']['commit']+':scripts/numeric/'+name)
        require(sha(body)==partial[role]['sha256'] and (root/'game/scripts/numeric'/name).read_bytes()==body,'host game authority bytes')
    if phase=='image':
        source_image(partial,home);require(source_files(root/'prismpm')==read_json(home/'source-files.json'),'clean exact source-image build')
        for name in ('preparation-partial.json','source-container-inspect.json','source-image-inspect.json','source-files.json','restoration-receipt.json'):
            shutil.copyfile(home/name,evidence/name)
        require(sum(p.stat().st_size for p in evidence.iterdir() if p.is_file())<=MAX_METADATA,'bounded image metadata')
        return
    # The source-side always collector owns /tmp discovery. Host never scans it.
    metadata=home/'metadata';metadata.mkdir(mode=0o700,exist_ok=True)
    if not (metadata/'collection.json').exists():
        write(metadata/'collection.json',{'schema':'cs1618/candidate-capture-collection/1','status':'incomplete',
            'scope':'actual-transport-and-original-OC10-only','complete_application_accepted':False,'preparation':None,
            'scenarios':{id:None for id in SCENARIOS},'oc10':None,'locators':[],'files':[],'retained_bytes':0,
            'missing':[{'phase':'source-container','reason':'source-side always collector did not complete'}]})
        shutil.copyfile(home/'preparation-partial.json',metadata/'preparation-partial.json')
    value=read_json(metadata/'collection.json');valid=False
    try:
        validate_collection_shape(value)
        total=0;expected=set()
        for row in value['files']:
            closed(row,'path bytes sha256');safe_relative(row['path']);expected.add(row['path'])
            body=regular(home/'raw'/row['path'],MAX_TOTAL);require(len(body)==row['bytes'] and sha(body)==row['sha256'],'host artifact bytes changed')
            total+=len(body)
        actual={str(path.relative_to(home/'raw')) for path in (home/'raw').rglob('*') if path.is_file()} if (home/'raw').exists() else set()
        require(actual==expected and total==value['retained_bytes'],'exact complete host artifact inventory')
        metadata_size=sum(p.stat().st_size for p in metadata.iterdir());require(metadata_size<=MAX_METADATA and total+metadata_size<=MAX_TOTAL,'host final artifact budget')
        require(source_files(root/'prismpm')==read_json(home/'source-files.json'),'host final source cleanliness')
        valid=value['status']=='complete-conditional-evidence'
    except Exception as error:
        if type(value.get('missing')) is not list:value['missing']=[]
        value['missing'].append({'phase':'host-collection','reason':str(error)[:4096]})
    if not valid:value['status']='incomplete';write(metadata/'collection.json',value,replace=True)
    require(valid,'host collection incomplete')


def export_host(phase):
    root=Path.cwd().resolve();home=root/'prismpm/target/candidate-qualification-driver'
    destination=root/'evidence/metadata-upload';destination.mkdir(parents=True,mode=0o700,exist_ok=True)
    failure=None
    (home/'raw-upload-ready.json').unlink(missing_ok=True)
    try:host_collect(phase)
    except BaseException as error:failure=error
    finally:
        if failure and (home/'metadata/collection.json').exists():
            value=read_json(home/'metadata/collection.json');value['status']='incomplete'
            if type(value.get('missing')) is not list:value['missing']=[]
            value['missing'].append({'phase':'host-collection','reason':str(failure)[:4096]});write(home/'metadata/collection.json',value,replace=True)
        summary={'schema':'cs1618/candidate-host-export/1','status':'incomplete' if failure else 'completed',
                 'phase':phase,'error':None if failure is None else str(failure)[:4096],
                 'raw_safe':False,'raw_bytes':0,'metadata_files':[],'missing':[]}
        raw=home/'raw';metadata=home/'metadata' if phase=='qualification' else root/'evidence'
        if raw.exists():
            try:
                total=0;count=0
                for path in raw.rglob('*'):
                    require(not path.is_symlink(),'artifact export aliases refused')
                    if path.is_dir():directory(path);continue
                    info=path.lstat();require(stat.S_ISREG(info.st_mode) and info.st_nlink==1 and info.st_uid==os.getuid(),
                                             'safe regular artifact export')
                    total+=info.st_size;count+=1;require(total<=MAX_TOTAL-MAX_METADATA and count<=250000,'bounded actual full artifact export')
                summary['raw_safe']=True;summary['raw_bytes']=total
                write(home/'raw-upload-ready.json',{'bytes':total,'files':count},replace=True)
            except Exception as error:summary['missing'].append(str(error)[:4096])
        total=8192
        for name in ('collection.json','preparation-partial.json','preparation.json','setup.json','oc10.json','run-status.json',
                     'retained-mapping.json','source-container-inspect.json','source-image-inspect.json','restoration-receipt.json','source-files.json','game-inputs.json'):
            path=metadata/name
            if not path.exists():continue
            try:
                body=regular(path,MAX_METADATA);require(total+len(body)<=MAX_METADATA,'bounded initial metadata subset')
                (destination/name).write_bytes(body);os.chmod(destination/name,0o400);total+=len(body)
                summary['metadata_files'].append({'path':name,'bytes':len(body),'sha256':sha(body)})
            except Exception as error:summary['missing'].append(name+': '+str(error)[:4096])
        if summary['missing']:
            summary['status']='incomplete'
            for collection in (home/'metadata/collection.json',destination/'collection.json'):
                if collection.exists():
                    value=read_json(collection);value['status']='incomplete';value['missing'].append({'phase':'host-export','reason':str(summary['missing'])[:4096]});write(collection,value,replace=True)
        write(destination/'host-status.json',summary,replace=True)
    if failure:raise failure
    require(not summary['missing'],'host artifact export incomplete')


def admit_local_download(free_bytes,compressed_bytes,extracted_bytes,working_bytes):
    require(all(type(value) is int and value>=0 for value in (free_bytes,compressed_bytes,extracted_bytes,working_bytes)),
            'measured nonnegative local download sizes')
    require(free_bytes-compressed_bytes-extracted_bytes-working_bytes>=8*1024**3,
            'download plus extraction and working copies must preserve8GiB')
    return True


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation',choices=('prepare','build-subjects','qualify','run-oc10','collect','run','host-collect','setup-budget'))
    parser.add_argument('--scenario',choices=SCENARIOS)
    parser.add_argument('--phase',choices=('image','qualification'),default='qualification')
    args=parser.parse_args()
    require((args.operation=='qualify')==(args.scenario is not None),'scenario only belongs to qualify')
    if args.operation=='prepare':prepare(args.phase)
    elif args.operation=='host-collect':export_host(args.phase)
    elif args.operation=='setup-budget':
        partial=read_json(Path.cwd()/'prismpm/target/candidate-qualification-driver/preparation-partial.json')
        minutes=int((partial['started']+2700-time.monotonic())//60)
        require(minutes>0,'absolute45-minute setup window exhausted')
        with open(os.environ['GITHUB_OUTPUT'],'a') as output:output.write('minutes='+str(minutes)+'\n')
    else:
        require(Path.cwd()==SOURCE and Path(__file__).resolve()==HOME/AUTHORITY['driver'],'fixed source-container driver path')
        if args.operation=='run':run_all()
        elif args.operation=='build-subjects':build_subjects()
        elif args.operation=='qualify':qualify(args.scenario)
        elif args.operation=='run-oc10':run_oc10()
        else:collect()


if __name__=='__main__':
    try:main()
    except Exception as error:
        print('candidate capture qualification incomplete: '+str(error),file=__import__('sys').stderr)
        raise SystemExit(1)
