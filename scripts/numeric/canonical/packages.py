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
import tarfile
from pathlib import Path

OPS = ('mul32', 'mul64', 'div32', 'div64')
REPO = Path(__file__).resolve().parents[3]
META = REPO / 'prism/numeric/packages'
INPUTS = json.loads((META / 'inputs.json').read_text())
MAX_RAW = 256 * 1024 * 1024
MAX_ARCHIVE = 31 * 1024 * 1024
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
    canonical = json.dumps(bm['inputs'], sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()
    if hashlib.sha256(canonical).hexdigest() != bid or bm['inputs']['lexlean_source_id'] != b['source_id'] or bm['inputs']['lexlean_semantic_id'] != b['semantic_id']:
        raise ValueError('build input/source identity mismatch')
    for row in bm['files']:
        rel = Path(row['path'])
        if rel.is_absolute() or '..' in rel.parts or digest(regular(build / rel)) != row['sha256']:
            raise ValueError('changed build closure')
    if (manifest['schema'] != 'prismpm/library-verification-manifest/2' or
            manifest['build_id'] != bid or manifest['scope'] != 'native-library-only' or
            acceptance['schema'] != 'prismpm/library-acceptance/1' or
            acceptance['build_id'] != bid or acceptance['scope'] != 'native-library-only' or
            acceptance['status'] != 'passed' or acceptance['regeneration'] != 'byte-identical' or
            {x['mode']:x['status'] for x in acceptance['executions']} != {'std':'passed','no_std':'passed'}):
        raise ValueError('native acceptance/manifest mismatch')
    op = json.loads((project / 'staging.json').read_text())['operation']; d = descriptor(op)
    if acceptance['export_roots'] != sorted([d['root'], d['acceptance_root']]) or any(row['roots'] != [d['acceptance_root']] for row in acceptance['executions']):
        raise ValueError('wrong exported roots')
    owner = manifest['exporter_owner']
    if owner['schema'] != 'prismpm/verification-exporter-owner/1' or [p['phase'] for p in owner['phases']] != ['controller-build','replay']:
        raise ValueError('missing actual owner phases')
    prior = None
    for phase in owner['phases']:
        rows = phase['processes']
        if [p['tool'] for p in rows] != ['lake-build-generated','lean4-prod-build','prod-export','native-library-package'] or any(p['exit_code'] != 0 for p in rows):
            raise ValueError('missing actual child process closure')
        execution = rows[2]['exporter']; receipt = execution['acquisition']
        pins = {'schema':'prismpm/exporter-acquisition/2', 'mode':'source-backport', 'source_id':'numeric-task2c', 'compiler_revision':'2a13f942b04f0828e03c5d7db7e4db6ecb626d6e', 'archive_sha256':'6963efb98d5a67a54a5a969d520f0090218115f86da1dd573b789dc027fafb52', 'descriptor_sha256':'163fd02651d0c3e5116bdf1f0549b72d43ec849e66cd7d328b83cbec4fb70dc7', 'toolchain':'leanprover/lean4:v4.32.1'}
        if any(receipt[k] != v for k,v in pins.items()) or receipt['platform'] != 'linux/amd64' or receipt['inventory_sha256'] != NATIVE_INVENTORY or execution['source_archive_sha256'] != pins['archive_sha256'] or (prior is not None and prior != execution):
            raise ValueError('selected source/child receipt mismatch')
        identity(execution['executable']['sha256']); identity(receipt['inventory_sha256'])
        if receipt['sdk_lock_digest'] != 'sha256:' + INPUTS['sdk_lock_sha256']:
            raise ValueError('SDK lock receipt mismatch')
        prior = execution

    # Check actual artifact bytes against the verification manifest, never newest mtime.
    for row in manifest['artifacts']:
        relative = Path(row['path'])
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('unsafe artifact path')
        p = regular(build / relative)
        if digest(p) != row['sha256'] or p.stat().st_size != row['byte_length']:
            raise ValueError('changed verified artifact (harness refusal)')
    return {'build_id':bid,'attestation_id':aid,'build':str(build),'verified':str(verified), 'source_id':b['source_id'],'semantic_id':b['semantic_id']}


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
        for phase in ('prepare','build','verify','select'):
            p = root / 'operations' / op / (phase + '.status')
            if not p.is_file() or p.read_text().strip() != '0': pending.append(op + ': phase not successful: ' + phase)
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
    p = argparse.ArgumentParser(); p.add_argument('command', choices=['stage','freeze','check','select','retain']); p.add_argument('path', type=Path); p.add_argument('other', type=Path, nargs='?'); a = p.parse_args()
    if a.command == 'stage': stage(a.path, a.other)
    elif a.command == 'freeze': freeze(a.path)
    elif a.command == 'check': check(a.path)
    elif a.command == 'select': document(a.other / 'selected.json', selection(a.path, a.other))
    elif a.command == 'retain':
        s = retain(a.path, a.other)
        if s['status'] != 'complete-reader-inputs': raise SystemExit(1)

if __name__ == '__main__': main()
