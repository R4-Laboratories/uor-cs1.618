#!/usr/bin/env python3
"""Deterministic disposable native-library projects and bounded evidence custody.

A host harness refusal is never represented as a Prism verifier refusal.
"""
import argparse
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import tarfile
import tempfile
import copy
from pathlib import Path

OPS = ('mul32', 'mul64', 'div32', 'div64')
REPO = Path(__file__).resolve().parents[3]
META = REPO / 'prism/numeric/packages'
INPUTS = json.loads((META / 'inputs.json').read_text())
MAX_RAW = 256 * 1024 * 1024
MAX_ARCHIVE = 31 * 1024 * 1024
READER = json.loads(Path(__file__).with_name('reader-source.json').read_text())
NATIVE_INVENTORY = '0d4fe1864891ab1220a752d929a5a3a334f5987e0518a97f83f06fb5bdad105f'


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1048576), b''): h.update(chunk)
    return h.hexdigest()


def document(path, value):
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + '\n')


def regular(path):
    if any(parent.is_symlink() for parent in path.parents) or path.is_symlink() or not path.is_file() or path.stat().st_nlink != 1:
        raise ValueError('expected singly linked regular file: ' + str(path))
    return path


def files(root, exclude=()):
    for base, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in exclude)
        for name in dirs:
            if (Path(base) / name).is_symlink():
                raise ValueError('symbolic directory: ' + str(Path(base) / name))
        for name in sorted(names):
            yield regular(Path(base) / name)


def descriptor(op):
    d = json.loads((META / op / 'descriptor.json').read_text())
    if (d['operation'] != op or d['root'] != 'BoundedNumeric.Float.' + op or
            d['width'] != int(op[-2:]) or
            d['acceptance_root'] != 'BoundedNumeric.NumericPackage.acceptance' or
            d['schema'] != 'cs1618/numeric-native-package/1' or d['cargo_name'] != 'cs-numeric-' + op or d['cargo_version'] != '0.1.0' or
            not d['acceptance_cases'] or d['repository'] != 'https://github.com/R4-Laboratories/uor-cs1.618' or
            any(len(case) != 3 or any(type(v) is not int or not 0 <= v < 2 ** d['width'] for v in case) for case in d['acceptance_cases'])):
        raise ValueError('descriptor root/identity mismatch')
    return d


def metadata(d):
    width = 'UInt' + str(d['width'])
    checks = [f'(match (Float::{d["operation"]} ({a} : {width}) ({b} : {width})) | Option.some bits => (prim equal bits ({want} : {width}) : Bool) | Option.none => false)'
              for a, b, want in d['acceptance_cases']]
    body = checks[-1]
    for term in reversed(checks[:-1]):
        body = '(' + term + ' && ' + body + ')'
    roots = sorted([d['root'], d['acceptance_root']])
    exports = f'(cons "{roots[0]}" (cons "{roots[1]}" (nil String)))'
    return '\n'.join([
        r'\begin{lexlean}{NumericPackage}',
        r'\useglossary{lexlean.std.bool@1.2.0}',
        r'\useglossary{lexlean.std.nat@1.2.0}',
        r'\importmodule{Float}',
        r'\importmodule{Foundation.Library.V1.Model}',
        r'\title{Boolean}', r'\begin{semanticmodule}',
        'definition{name: acceptance, parameters: [], result: Bool, body: ' + body + '}',
        'definition{name: numericLibrary, parameters: [], result: Foundation.Library.V1.Model::NativeLibrary, body: (record Foundation.Library.V1.Model::NativeLibrary {' +
        f'profile := "prismpm/native-library/1", name := "Bounded numeric {d["operation"]}", cargoName := "{d["cargo_name"]}", cargoVersion := "{d["cargo_version"]}", cargoDescription := "Raw IEEE numeric kernel with finite native acceptance", cargoRepository := "{d["repository"]}", cargoHomepage := "{d["repository"]}", exportRoots := {exports}, acceptanceRoots := (cons "{d["acceptance_root"]}" (nil String))' + '})}',
        r'\end{semanticmodule}', r'\end{lexlean}', ''])


def stage(source, out):
    if out.exists():
        raise ValueError('stage destination already exists')
    fixture = source / INPUTS['fixture']
    for name, expected in INPUTS['fixture_files'].items():
        if digest(regular(fixture / name)) != expected:
            raise ValueError('fixture identity mismatch: ' + name)
    for name, expected in INPUTS['kernel_files'].items():
        if digest(regular(REPO / name)) != expected:
            raise ValueError('frozen kernel identity mismatch: ' + name)
    if digest(regular(REPO / 'prism/prismpm.lock')) != INPUTS['sdk_lock_sha256']:
        raise ValueError('SDK lock mismatch')
    for op in OPS:
        d = descriptor(op)
        project = out / op
        project.mkdir(parents=True)
        for name in INPUTS['fixture_files']:
            target = project / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((fixture / name).read_bytes())
        lex = (project / 'lexlean.toml').read_text().replace('name = "library-probe"', 'name = "numeric-' + op + '"').replace('module_prefix = "LibraryProbe"', 'module_prefix = "BoundedNumeric"').replace('["src/Probe.lex.tex"]', '["src/Bounds.lex.tex", "src/Float.lex.tex", "src/NumericPackage.lex.tex", "src/Wide.lex.tex"]')
        (project / 'lexlean.toml').write_text(lex)
        (project / 'prismpm.toml').write_text((project / 'prismpm.toml').read_text().replace('Library probe', 'Bounded numeric ' + op))
        (project / 'lakefile.toml').write_text('name = "numeric_' + op + '"\nversion = "0.1.0"\n\n[[lean_lib]]\nname = "BoundedNumeric"\n')
        lake = json.loads((project / 'lake-manifest.json').read_text()); lake['name'] = 'numeric_' + op
        document(project / 'lake-manifest.json', lake)
        for name in INPUTS['kernel_files']:
            (project / 'src' / Path(name).name).write_bytes((REPO / name).read_bytes())
        (project / 'src/NumericPackage.lex.tex').write_text(metadata(d))
        shutil.copyfile(REPO / 'prism/prismpm.lock', project / 'prismpm.lock')
        document(project / 'staging.json', {'schema':'cs1618/numeric-staging/1', 'operation':op, 'inputs':INPUTS, 'descriptor':d, 'descriptor_sha256':digest(META / op / 'descriptor.json'), 'stager_sha256':digest(Path(__file__))})


def input_files(project):
    return {str(p.relative_to(project)):digest(p) for p in files(project, ('.prism','.lexlean','.lake'))
            if p.name != 'frozen-inputs.json'}


def freeze(project):
    if (project / 'frozen-inputs.json').exists():
        raise ValueError('already frozen')
    regular(project / 'lexlean.lock')
    # Formatting must never rewrite an authored arithmetic source.
    for name, expected in INPUTS['kernel_files'].items():
        if digest(project / 'src' / Path(name).name) != expected:
            raise ValueError('kernel changed during preparation')
    document(project / 'frozen-inputs.json', {'schema':'cs1618/numeric-frozen-inputs/1', 'files':input_files(project)})


def check(project):
    expected = json.loads(regular(project / 'frozen-inputs.json').read_text())['files']
    if input_files(project) != expected:
        raise ValueError('frozen input bytes/file set changed (harness refusal)')
    return expected


def identity(value):
    if not isinstance(value, str) or not re.fullmatch('[0-9a-f]{64}', value):
        raise ValueError('invalid content identity')
    return value


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()


def same(actual, expected, message):
    if actual != expected:
        raise ValueError(message + ' (game harness refusal)')


def source_reader(project, evidence, build, verified):
    source = Path(os.environ.get('PRISMPM_READER_SOURCE', '/work/prismpm-b1')).resolve()
    def git(*args):
        try:
            return subprocess.check_output(['git', '-c', 'safe.directory=' + str(source), '-C', str(source), *args], stderr=subprocess.PIPE).decode().strip()
        except subprocess.CalledProcessError as error:
            raise ValueError('reader source repository identity unavailable (game harness refusal)') from error
    same(git('rev-parse', 'HEAD'), READER['revision'], 'reader source revision mismatch')
    same(git('rev-parse', 'HEAD^{tree}'), READER['tree'], 'reader source tree mismatch')
    same(git('status', '--porcelain', '--untracked-files=all'), '', 'reader source changed')
    for path, expected in READER['files'].items():
        same(digest(regular(source / path)), expected, 'reader source closure mismatch')
        same(digest(regular(evidence.parents[1] / 'reader-source' / path)), expected, 'retained reader source closure mismatch')
    argv = ['node', str(Path(__file__).with_name('frontend-reader.mjs')), str(source), str(build), str(verified / 'manifest.json')]
    try:
        result = subprocess.run(argv, capture_output=True, timeout=60)
    except subprocess.TimeoutExpired as error:
        document(evidence / 'frontend-reader-invocation.json', {'scope':'frontend-source-binding-only', 'argv':argv, 'reader':READER, 'status':'timeout', 'exit_code':None})
        raise ValueError('source-owned frontend reader timed out; no successful reader claim') from error
    record = {'schema':'cs1618/numeric-frontend-reader-invocation/1', 'scope':'frontend-source-binding-only',
              'argv':argv, 'exit_code':result.returncode, 'reader':READER,
              'node_sha256':digest(Path(shutil.which('node'))),
              'adapter_sha256':digest(Path(__file__).with_name('frontend-reader.mjs')),
              'stdout':result.stdout.decode('utf-8', errors='replace')[:131072],
              'stderr':result.stderr.decode('utf-8', errors='replace')[:131072]}
    document(evidence / 'frontend-reader-invocation.json', record)
    if result.returncode:
        raise ValueError('source-owned frontend reader refusal (not a CLI proof refusal); see frontend-reader-invocation.json')
    value = json.loads(result.stdout)
    same(value['reader'], READER, 'frontend reader provenance mismatch')
    return value


def capture_tools(root):
    source = Path('/work/prismpm-b1')
    for path, expected in READER['files'].items():
        same(digest(regular(source / path)), expected, 'captured reader source closure mismatch')
        target = root / 'reader-source' / path
        target.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(source / path, target)
    for name in ('frontend-reader.mjs','reader-source.json','packages.py'):
        shutil.copyfile(Path(__file__).with_name(name), root / 'reader-source' / name)
    # Independently measured before CLI work, retained with original/final hashes.
    paths = {'lean':subprocess.check_output(['elan','which','lean']).decode().strip(),
             'lean-launcher':shutil.which('lean'), 'lake':shutil.which('lake'),
             'cargo':subprocess.check_output(['rustup','which','cargo']).decode().strip()}
    document(root / 'native-tools.json', {'schema':'cs1618/numeric-native-tools/1',
        'inventory_sha256':digest(Path('/opt/prismpm/share/inventory.json')),
        'tools':{name:{'path':path, 'sha256':digest(Path(path))} for name,path in paths.items()}})


def frontend_owner(manifest, build, project, evidence, d):
    owner = manifest['exporter_owner']
    same(set(owner), {'schema','phases'}, 'closed owner required')
    same(owner['schema'], 'prismpm/library-exporter-owner/2', 'wrong owner schema')
    same([p['phase'] for p in owner['phases']], ['controller-build','replay'], 'missing actual owner phases')
    tools = json.loads(regular(evidence.parents[1] / 'native-tools.json').read_text())
    same(tools['inventory_sha256'], NATIVE_INVENTORY, 'original SDK inventory mismatch')
    native = tools['tools']
    preflight = manifest['processes'][:5]
    same([r['tool'] for r in preflight], ['lean-version','lake-version','rustfmt-version','rustc-version','timeout-version'], 'native preflight order')
    same(preflight[0]['executable_sha256'], native['lean']['sha256'], 'independent Lean preflight identity')
    same(preflight[1]['executable_sha256'], native['lake']['sha256'], 'independent Lake preflight identity')
    if native['lean']['sha256'] == native['lake']['sha256']:
        raise ValueError('Lean identity is Lake (game harness refusal)')
    prior = None
    for phase in owner['phases']:
        same(set(phase), {'phase','role','model_sha256','lexlean_manifest_sha256','artifacts','processes','frontend'}, 'closed owner phase required')
        same(phase['role'], 'library', 'wrong phase role')
        same(phase['model_sha256'], manifest['model_sha256'], 'phase model binding')
        same(phase['artifacts'], manifest['artifacts'], 'phase artifact binding')
        f, rows = phase['frontend'], phase['processes']
        # Full module/profile/argv/runtime/source validation is source owned below.
        n = len(f['modules']) + 1
        same([r['tool'] for r in rows], ['library-lean-version'] + ['library-lean-frontend'] * (n-1) + ['lean4-prod-build','prod-export','native-library-package'], 'actual dynamic process closure')
        same(f['lean_sha256'], native['lean']['sha256'], 'independent frontend Lean identity')
        same(f['launcher_sha256'], native['lean-launcher']['sha256'], 'independent frontend launcher identity')
        same(rows[0]['stdout'], preflight[0]['stdout'], 'frontend version preflight binding')
        tail = rows[n:]
        same(tail[0]['argv'], ['build','prod-export'], 'exporter build arguments')
        same(tail[2]['argv'], ['package','--locked','--offline','--allow-dirty'], 'package arguments')
        for row in tail[:2]: same(row['executable_sha256'], native['lake']['sha256'], 'original Lake exporter identity')
        same(tail[2]['executable_sha256'], native['cargo']['sha256'], 'original Cargo package identity')
        for row in rows + manifest['processes']:
            same(set(row), {'tool','argv','executable_sha256','exit_code','stdout','stderr'} | ({'exporter'} if row['tool']=='prod-export' else set()), 'closed actual process record')
            if not isinstance(row['argv'], list) or any(not isinstance(a, str) for a in row['argv']):
                raise ValueError('invalid original process arguments (game harness refusal)')
            same(row['exit_code'], 0, 'failed recorded child')
            identity(row['executable_sha256'])
            for stream in ('stdout','stderr'):
                if not isinstance(row[stream], str) or len(row[stream].encode()) > 16*1024*1024 or '\r' in row[stream]:
                    raise ValueError('invalid bounded process stream (game harness refusal)')
        if prior is not None:
            for field in ('role','model_sha256','lexlean_manifest_sha256','artifacts','frontend'):
                same(phase[field], prior[field], 'two-phase ownership/source binding')
            same(tail[1], prior['processes'][-2], 'source/child receipt mismatch')
        prior = phase
    replay = owner['phases'][1]['processes']
    same(manifest['processes'][5:5+len(replay)], replay, 'original replay window binding')
    same([r['tool'] for r in manifest['processes'][5+len(replay):]], ['native-library-std-lock','native-library-std-acceptance','native-library-no_std-lock','native-library-no_std-acceptance'], 'complete top-level replay process closure')
    for mode in ('std','no_std'):
        row = next(r for r in manifest['processes'] if r['tool'] == 'native-library-' + mode + '-acceptance')
        same(json.loads(row['stdout']), {'roots':[d['acceptance_root']], 'status':'passed'}, 'actual acceptance output')
    return owner


def build_bindings(build, bm, manifest, acceptance, d):
    rows = bm['files']
    paths = [r['path'] for r in rows]
    same(paths, sorted(set(paths)), 'duplicate/unordered build file closure')
    actual = {str(p.relative_to(build)) for p in files(build)} - {'manifest.json'}
    same(set(paths), actual, 'complete build file closure')
    for row in rows:
        same((build / row['path']).stat().st_size, row['byte_length'], 'build artifact byte length')
    expected = sorted(['library/' + n for n in ['coverage.json','frontend.json','kernel.ir','model-binding.json',
        'package/Cargo.lock','package/Cargo.toml','package/LICENSE-APACHE','package/LICENSE-MIT','package/README.md',
        'package/generation-manifest.json','package/src/lib.rs',d['cargo_name']+'-'+d['cargo_version']+'.crate','roots.json']])
    same([r['path'] for r in manifest['artifacts']], expected, 'exact native library artifact set')
    same(manifest['artifacts'], [{k:r[k] for k in ('path','byte_length','sha256')} for r in rows if r['path'].startswith('library/')], 'build/verified artifact binding')
    inputs = bm['inputs']
    same(inputs['schema'], 'prismpm/build-inputs/3', 'build input schema')
    same(inputs['library_generator_sha256'], READER['library_generator_sha256'], 'reviewed numeric generator identity')
    same(inputs['library_artifacts_sha256'], hashlib.sha256(canonical(rows)).hexdigest(), 'complete build row digest')
    model_bytes = regular(build / 'model.prism.json').read_bytes()
    model_id = hashlib.sha256(model_bytes).hexdigest()
    same(inputs['model_id'], model_id, 'build model binding')
    same(manifest['model_sha256'], model_id, 'verified model binding')
    same(acceptance['model_id'], model_id, 'accepted model binding')
    model = json.loads(model_bytes)
    library = model['library']
    for key, expected_value in {'profile':'prismpm/native-library/1','cargo_name':d['cargo_name'],'cargo_version':d['cargo_version'],
            'export_roots':sorted([d['root'],d['acceptance_root']]), 'acceptance_roots':[d['acceptance_root']]}.items():
        same(library[key], expected_value, 'numeric model descriptor binding')
    binding = json.loads(regular(build / 'library/model-binding.json').read_text())
    same(binding, {'acceptance_roots':[d['acceptance_root']], 'export_roots':library['export_roots'], 'model_id':model_id,
        'profile':'prismpm/native-library/1','schema':'prismpm/library-build-binding/1','scope':'native-library-only'}, 'native model binding')
    lex = json.loads(regular(build / 'lexlean/build/manifest.json').read_text())
    modules = sorted(r['path'][8:-5].replace('/', '.') for r in lex['outputs'] if r['kind']=='lean')
    same(modules, ['BoundedNumeric.'+n for n in ['Bounds','Float','Foundation.Library.V1.Model','NumericPackage','Wide']], 'complete numeric project module set including Bounds')
    argv = ['exe','prod-export'] + [x for n in modules for x in ['--module',n]] + [x for root in library['export_roots'] for x in ['--root',root]] + ['--ir-module',d['cargo_name'].replace('-','_'),'--out','$LIBRARY_WORK/export']
    for phase in manifest['exporter_owner']['phases']:
        same(phase['processes'][-2]['argv'], argv, 'complete module/root exporter arguments')
    return inputs


def audit_bindings(build, verified, inputs, acceptance):
    # Complete published declaration policies, including erased proofs. Actual
    # kernel verification remains the responsibility of the original CLI.
    snapshot = json.loads(regular(build / 'lexlean/snapshot.json').read_text())
    declared = [(m['lean_module']+'.'+d['lean_name'], d['axiom_policy']) for m in snapshot['modules'] for d in m['declarations']]
    declarations = dict(declared)
    same(len(declarations), len(declared), 'duplicate source declaration')
    att = json.loads(regular(verified / 'lexlean-attestation.json').read_text())
    for key, expected in {'spec':'lexlean/attestation/2','status':'verified','build_id':inputs['lexlean_build_id'],
            'source_id':inputs['lexlean_source_id'],'semantic_id':inputs['lexlean_semantic_id']}.items():
        same(att[key], expected, 'original LexLean attestation binding')
    same(acceptance['lexlean_attestation_id'], att['attestation_id'], 'acceptance original proof attestation binding')
    audits = att['declarations']
    names = [r['name'] for r in audits]
    same(len(names), len(set(names)), 'duplicate declaration audit')
    same(sorted(n for n in names if not n.startswith('LexLeanRuntime.')), sorted(declarations), 'complete declaration/erased-proof audit closure')
    for row in audits:
        same(row['result'], 'ok', 'failed declaration audit')
        if row['name'].startswith('LexLeanRuntime.'):
            same(row['policy']['kind'], 'exact', 'exact runtime axiom policy')
            expected = row['policy']['axioms']
        else:
            same(row['policy'], declarations[row['name']], 'original declaration axiom policy')
            expected = row['policy'].get('axioms', [])
        same(row['observed'], expected, 'declaration observed axioms')


def selection(project, evidence):
    check(project)
    b = json.loads(regular(evidence / 'build-result.json').read_text())
    v = json.loads(regular(evidence / 'verify-result.json').read_text())
    if b['schema'] != 'prismpm/build-result/1' or v['schema'] != 'prismpm/verify-result/1':
        raise ValueError('unexpected CLI result schema')
    bid, aid = identity(b['build_id']), identity(v['attestation_id'])
    if b['manifest_path'] != '.prism/build/' + bid + '/manifest.json' or b['model_path'] != '.prism/build/' + bid + '/model.prism.json' or v['build_id'] != bid or v['verified_root'] != '.prism/verified/' + aid:
        raise ValueError('build/verify result selection mismatch')
    build = project / '.prism/build' / bid
    verified = project / '.prism/verified' / aid
    manifest = json.loads(regular(verified / 'manifest.json').read_text())
    acceptance = json.loads(regular(verified / 'library-acceptance.json').read_text())
    if digest(verified / 'manifest.json') != aid or digest(verified / 'library-acceptance.json') != manifest['acceptance_sha256'] or digest(regular(verified / 'lexlean-attestation.json')) != manifest['lexlean_attestation_sha256']:
        raise ValueError('verified manifest/content identity mismatch')
    bm = json.loads(regular(build / 'manifest.json').read_text())
    input_bytes = canonical(bm['inputs'])
    if hashlib.sha256(input_bytes).hexdigest() != bid or bm['inputs']['lexlean_source_id'] != b['source_id'] or bm['inputs']['lexlean_semantic_id'] != b['semantic_id']:
        raise ValueError('build input/source identity mismatch')
    for row in bm['files']:
        rel = Path(row['path'])
        if rel.is_absolute() or '..' in rel.parts or digest(regular(build / rel)) != row['sha256']:
            raise ValueError('changed build closure')
    if (manifest['schema'] != 'prismpm/library-verification-manifest/3' or
            manifest['build_id'] != bid or manifest['scope'] != 'native-library-only' or
            acceptance['schema'] != 'prismpm/library-acceptance/1' or
            acceptance['build_id'] != bid or acceptance['scope'] != 'native-library-only' or
            acceptance['status'] != 'passed' or acceptance['regeneration'] != 'byte-identical' or
            {x['mode']:x['status'] for x in acceptance['executions']} != {'std':'passed','no_std':'passed'}):
        raise ValueError('native acceptance/manifest mismatch')
    same([r['mode'] for r in acceptance['executions']], ['std','no_std'], 'complete native acceptance executions')
    op = json.loads((project / 'staging.json').read_text())['operation']; d = descriptor(op)
    if acceptance['export_roots'] != sorted([d['root'], d['acceptance_root']]) or any(row['roots'] != [d['acceptance_root']] for row in acceptance['executions']):
        raise ValueError('wrong exported roots')
    inputs = build_bindings(build, bm, manifest, acceptance, d)
    audit_bindings(build, verified, inputs, acceptance)
    owner = frontend_owner(manifest, build, project, evidence, d)
    prior = None
    for phase in owner['phases']:
        rows = phase['processes']
        execution = rows[-2]['exporter']; receipt = execution['acquisition']
        pins = {'schema':'prismpm/exporter-acquisition/2', 'mode':'source-backport', 'source_id':'numeric-task2c', 'compiler_revision':'2a13f942b04f0828e03c5d7db7e4db6ecb626d6e', 'archive_sha256':'6963efb98d5a67a54a5a969d520f0090218115f86da1dd573b789dc027fafb52', 'descriptor_sha256':'163fd02651d0c3e5116bdf1f0549b72d43ec849e66cd7d328b83cbec4fb70dc7', 'toolchain':'leanprover/lean4:v4.32.1'}
        if set(receipt) != set(pins) | {'platform','inventory_sha256','sdk_lock_digest'} or any(receipt[k] != v for k,v in pins.items()) or receipt['platform'] != 'linux/amd64' or receipt['inventory_sha256'] != NATIVE_INVENTORY or execution['source_archive_sha256'] != pins['archive_sha256'] or (prior is not None and prior != execution):
            raise ValueError('selected source/child receipt mismatch')
        identity(execution['executable']['sha256']); identity(receipt['inventory_sha256'])
        same(set(execution), {'schema','source_archive_sha256','executable','acquisition'}, 'closed exporter execution')
        same(execution['schema'], 'prismpm/exporter-execution/1', 'exporter execution schema')
        child = execution['executable']
        same(set(child), {'sha256','byte_length','mode'}, 'closed exporter child identity')
        if type(child['byte_length']) is not int or not 0 < child['byte_length'] <= 256*1024*1024 or type(child['mode']) is not int or not 0 <= child['mode'] <= 0o777 or not child['mode'] & 0o111:
            raise ValueError('invalid original exporter child identity (game harness refusal)')
        if receipt['sdk_lock_digest'] != 'sha256:' + INPUTS['sdk_lock_sha256']:
            raise ValueError('SDK lock receipt mismatch')
        prior = execution

    source_reader(project, evidence, build, verified)

    # Check actual artifact bytes against the verification manifest, never newest mtime.
    for row in manifest['artifacts']:
        relative = Path(row['path'])
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('unsafe artifact path')
        p = regular(build / relative)
        if digest(p) != row['sha256'] or p.stat().st_size != row['byte_length']:
            raise ValueError('changed verified artifact (harness refusal)')
    return {'build_id':bid,'attestation_id':aid,'build':str(build),'verified':str(verified), 'source_id':b['source_id'],'semantic_id':b['semantic_id']}


def controls(project, evidence):
    """Run after actual CLI selection; clones never replace original evidence.

    These are reader/custody refusals. None is counted as a Prism CLI refusal.
    """
    baseline = selection(project, evidence)
    names = ('profile','environment','lean-tool','missing-Bounds','missing-runtime','missing-companion',
             'module-order','source-plan','reordered-phases','phase-owner','archive','child','root','artifact','source-bytes')
    report = {'schema':'cs1618/numeric-selected-reader-controls/1', 'scope':'selected-CLI-bundle-reader-controls-only',
              'selected':baseline, 'original_manifest_sha256':baseline['attestation_id'], 'reader':READER,
              'unclaimed':['CLI-negative-proof-execution','source-free-product-admission'], 'status':'incomplete', 'controls':[]}
    document(evidence / 'reader-controls.json', report)
    for name in names:
        with tempfile.TemporaryDirectory(prefix='numeric-reader-control-') as directory:
            root = Path(directory); candidate = root / 'projects' / project.name; ev = root / 'operations' / project.name
            ev.mkdir(parents=True); candidate.mkdir(parents=True)
            for path in files(project, ('.prism','.lexlean','.lake')):
                target = candidate / path.relative_to(project); target.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(path, target)
            b = candidate / '.prism/build' / baseline['build_id']; v = candidate / '.prism/verified' / baseline['attestation_id']
            shutil.copytree(baseline['build'], b); shutil.copytree(baseline['verified'], v)
            for file in ('build-result.json','verify-result.json'): shutil.copyfile(evidence / file, ev / file)
            shutil.copyfile(evidence.parents[1] / 'native-tools.json', root / 'native-tools.json')
            shutil.copytree(evidence.parents[1] / 'reader-source', root / 'reader-source')
            m = json.loads((v / 'manifest.json').read_text()); phases = m['exporter_owner']['phases']
            if name == 'reordered-phases': phases.reverse()
            elif name == 'phase-owner': phases[0]['role'] = 'application'
            elif name == 'artifact': m['artifacts'].pop()
            elif name == 'root':
                acceptance = json.loads((v / 'library-acceptance.json').read_text()); acceptance['export_roots'] = ['Wrong.root']
                (v / 'library-acceptance.json').write_bytes(canonical(acceptance)); m['acceptance_sha256'] = digest(v / 'library-acceptance.json')
            elif name == 'source-bytes':
                lex = json.loads((b / 'lexlean/build/manifest.json').read_text()); path = next(r['path'] for r in lex['outputs'] if r['kind']=='lean')
                with (b / 'lexlean/build' / path).open('ab') as stream: stream.write(b'\n-- changed source\n')
            else:
                for phase in phases:
                    frontend, rows = phase['frontend'], phase['processes']
                    if name == 'profile': frontend['profile'] = 'lake/legacy'
                    elif name == 'environment': frontend['environment']['HOME'] = '/tmp/reused'
                    elif name == 'lean-tool': frontend['lean_sha256'] = 'f'*64
                    elif name == 'missing-companion': frontend['modules'][0]['artifacts'].pop()
                    elif name in ('missing-Bounds','missing-runtime'):
                        index = next(i for i,r in enumerate(frontend['modules']) if (r['runtime'] if name=='missing-runtime' else r['name']=='BoundedNumeric.Bounds'))
                        frontend['modules'].pop(index); rows.pop(index+1)
                    elif name == 'module-order':
                        frontend['modules'][0],frontend['modules'][1] = frontend['modules'][1],frontend['modules'][0]
                        rows[1],rows[2] = rows[2],rows[1]
                    elif name == 'source-plan': frontend['modules'][0]['source']['sha256'] = 'f'*64
                    elif name == 'archive': rows[-2]['exporter']['acquisition']['archive_sha256'] = 'f'*64
                    elif name == 'child': rows[-2]['exporter']['executable']['sha256'] = 'f'*64 if phase['phase']=='replay' else rows[-2]['exporter']['executable']['sha256']
            if name not in ('reordered-phases','phase-owner'):
                m['processes'][5:-4] = copy.deepcopy(phases[1]['processes'])
            raw = canonical(m); aid = hashlib.sha256(raw).hexdigest(); (v / 'manifest.json').write_bytes(raw)
            destination = v.parent / aid
            if v != destination: v.rename(destination)
            verify = json.loads((ev / 'verify-result.json').read_text()); verify.update(attestation_id=aid, verified_root='.prism/verified/'+aid)
            document(ev / 'verify-result.json', verify)
            try:
                selection(candidate, ev)
            except ValueError as error:
                refusal = 'source-owned-frontend-reader' if str(error).startswith('source-owned frontend reader refusal') else 'game-harness'
                row = {'name':name,'status':'refused','refusal_owner':refusal,'reason':str(error)}
                invocation = ev / 'frontend-reader-invocation.json'
                if invocation.exists(): row['reader_invocation'] = json.loads(invocation.read_text())
                report['controls'].append(row); document(evidence / 'reader-controls.json', report)
            else:
                raise ValueError('reader negative control accepted: ' + name)
    same(selection(project, evidence), baseline, 'original selected bundle changed during controls')
    report['status'] = 'completed-reader-controls-only'; document(evidence / 'reader-controls.json', report)
    return report


def retain(root, dest):
    """Four-project collector: incomplete evidence is retained, never called complete."""
    dest.mkdir(parents=True, exist_ok=True)
    chosen, pending, selections = set(), [], {}
    for op in OPS:
        project, evidence = root / 'projects' / op, root / 'operations' / op
        try:
            sel = selection(project, evidence); selections[op] = sel
            trees = [Path(sel['build']), Path(sel['verified'])]
            # Keep complete generated and verified source closure; no Lake/Cargo caches.
            trees += [project / '.lexlean/build', project / '.lexlean/verified']
        except (OSError, ValueError, KeyError, TypeError) as error:
            pending.append(op + ': ' + str(error))
            trees = [project / '.prism/build', project / '.prism/verified', project / '.lexlean/build', project / '.lexlean/verified']
        if project.exists():
            chosen.update(files(project, ('.prism','.lexlean','.lake')))
        for tree in trees:
            if tree.exists(): chosen.update(files(tree))
    # Logs/results/statuses/replay inputs are separate from compilation caches.
    for p in files(root, ('projects','replay','retained','small-logs')):
        if p.relative_to(root).parts[0] in ('projects','replay','small-logs') or p == dest or dest in p.parents:
            continue
        chosen.add(p)
    replay = root / 'replay'
    if replay.exists():
        chosen.update(p for p in files(replay) if 'target' not in p.relative_to(replay).parts)
    small, small_rows = [], []
    small_inputs = list(files(root, ('projects','replay','retained','small-logs')))
    # Replay commands write flat log/status files here. Keep their diagnostics
    # independently of the primary archive, without binaries, rlibs or caches.
    if replay.exists():
        small_inputs.extend(regular(p) for p in sorted(replay.iterdir())
                            if p.name.endswith(('.log', '.status.json')))
    for p in small_inputs:
        if dest in p.parents: continue
        size_bytes = p.stat().st_size
        with p.open('rb') as stream:
            stream.seek(max(0, size_bytes - 131072))
            tail = stream.read(131072)
        name = str(p.relative_to(root))
        small.append((name, tail))
        small_rows.append({'path':name, 'original_sha256':digest(p), 'original_bytes':size_bytes, 'retained_bytes':len(tail), 'truncated':len(tail)!=size_bytes})
    if sum(len(data) for _,data in small) > 24 * 1024 * 1024:
        raise ValueError('small diagnostic log bound exceeded')
    with tarfile.open(dest / 'canonical-small-logs.tar.gz', 'w:gz') as out:
        for name,data in small:
            info = tarfile.TarInfo(name); info.size = len(data); info.mode = 0o644
            out.addfile(info, io.BytesIO(data))
    document(dest / 'small-logs-status.json', {'schema':'cs1618/numeric-small-logs/1', 'scope':'bounded diagnostics; truncated logs explicitly marked', 'files':small_rows})
    for name in ('runner-exit-code.txt','runner-command-exit-code.txt','custody-exit-code.txt','container-exit-code.txt','log-capture-exit-code.txt'):
        if not (root / name).is_file(): pending.append('missing final status: ' + name)
        elif (root / name).read_text().strip() != '0': pending.append('nonzero final status: ' + name)
    for op in OPS:
        for phase in ('prepare','build','verify','select','controls'):
            p = root / 'operations' / op / (phase + '.status')
            if not p.is_file() or p.read_text().strip() != '0': pending.append(op + ': phase not successful: ' + phase)
    for op, selected in selections.items():
        try:
            control = json.loads(regular(root / 'operations' / op / 'reader-controls.json').read_text())
            same(control['status'], 'completed-reader-controls-only', 'incomplete selected reader controls')
            same(control['original_manifest_sha256'], selected['attestation_id'], 'controls original selection binding')
            same(len(control['controls']), 15, 'incomplete selected reader control set')
            if any(r['status'] != 'refused' for r in control['controls']):
                raise ValueError('selected reader control was not refused')
        except (OSError, ValueError, KeyError, TypeError) as error:
            pending.append(op + ': ' + str(error))
    if not (root / 'replay/manifest.json').is_file(): pending.append('missing exact-package replay manifest')
    status = {'schema':'cs1618/numeric-retention/1' , 'scope':'native-library-only', 'status':'incomplete', 'unclaimed':['production-admission','application','holo','browser','render-integration','independent-actual-reader-controls'], 'pending':pending, 'selected':selections}
    archive = dest / 'canonical-reader-inputs.tar.gz'
    if archive.exists(): archive.unlink()  # Never upload an archive from an earlier collection.
    size = sum(p.stat().st_size for p in chosen)
    if size > MAX_RAW or len(chosen) > 20000:
        status['pending'].append('retention bound exceeded; no partial archive published')
    else:
        with tarfile.open(archive, 'w:gz') as out:
            for p in sorted(chosen): out.add(p, arcname=str(p.relative_to(root)), recursive=False)
        if archive.stat().st_size > MAX_ARCHIVE:
            archive.unlink(); status['pending'].append('archive bound exceeded; no partial archive published')
        else:
            status['archive_sha256'] = digest(archive)
            status['files'] = {str(p.relative_to(root)):digest(p) for p in sorted(chosen)}
            if not pending: status['status'] = 'complete-reader-inputs'
    document(dest / 'retention-status.json', status)
    return status


def main():
    p = argparse.ArgumentParser(); p.add_argument('command', choices=['stage','freeze','check','select','retain','capture-tools','controls']); p.add_argument('path', type=Path); p.add_argument('other', type=Path, nargs='?'); a = p.parse_args()
    if a.command == 'capture-tools': capture_tools(a.path)
    elif a.command == 'stage': stage(a.path, a.other)
    elif a.command == 'freeze': freeze(a.path)
    elif a.command == 'check': check(a.path)
    elif a.command == 'select': document(a.other / 'selected.json', selection(a.path, a.other))
    elif a.command == 'controls': controls(a.path, a.other)
    elif a.command == 'retain':
        s = retain(a.path, a.other)
        if s['status'] != 'complete-reader-inputs': raise SystemExit(1)

if __name__ == '__main__': main()
