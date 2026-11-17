#!/usr/bin/env python3
"""Component-only bounded-source diagnostics; never canonical/SDK acceptance.

Run with the caller's exact Lean environment and --lexlean/--rustc/--node.
All products go to artifacts/numeric-bounded-source, never prior evidence.
"""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--lexlean', required=True, type=Path)
p.add_argument('--rustc', required=True, type=Path)
p.add_argument('--node', default='node')
p.add_argument('--reuse-builds', action='store_true', help='Require successful recorded builds matching staged sources')
a = p.parse_args()
os.chdir(ROOT)
OUT = ROOT / 'artifacts/numeric-bounded-source'
OUT.mkdir(parents=True, exist_ok=True)
sha = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(args, name, *, stdin=None, failure=False, cwd=ROOT):
    args = list(map(str, args))
    started = time.time()
    with (OUT / f'runner-{name}.log').open('wb') as out:
        result = subprocess.run(args, cwd=cwd, stdin=stdin, stdout=out, stderr=subprocess.STDOUT)
    with (OUT / 'runner-commands.jsonl').open('a') as log:
        log.write(json.dumps({'argv': args, 'cwd': str(cwd), 'exit': result.returncode,
                              'seconds': time.time() - started,
                              'log': f'runner-{name}.log'}) + '\n')
    if (result.returncode == 0) == failure:
        raise RuntimeError(f'{name}: unexpected exit {result.returncode}; see runner-{name}.log')
    return OUT / f'runner-{name}.log'


def lex(project, args, name):
    return run([a.lexlean, '--project', project / 'lexlean.toml', *args], name)


def copy_project(project, helper=False):
    (project / 'src').mkdir(parents=True, exist_ok=True)
    for name in ('lakefile.toml', 'lake-manifest.json', 'lean-toolchain'):
        shutil.copyfile(ROOT / 'prism/numeric' / name, project / name)
    config = (ROOT / 'prism/numeric/lexlean.toml').read_text()
    sources = ['Wide.lex.tex'] if helper else ['Float.lex.tex', 'Wide.lex.tex', 'Bounds.lex.tex']
    for name in sources:
        shutil.copyfile(ROOT / 'prism/numeric/src' / name, project / 'src' / name)
    if helper:
        config = config.replace('"src/Bounds.lex.tex", "src/Float.lex.tex", "src/Wide.lex.tex"',
                                '"src/HelperControls.lex.tex", "src/Wide.lex.tex"')
        shutil.copyfile(Path(__file__).with_name('bounded-helper-controls.lex.tex'), project / 'src/HelperControls.lex.tex')
    (project / 'lexlean.toml').write_text(config)


# Bind actual component binaries, never substitute the SDK image digest.
identities = {'scope': 'local components; raw LexLean diagnostic only',
              'lexlean': {'path': str(a.lexlean), 'sha256': sha(a.lexlean)},
              'rustc': {'path': str(a.rustc), 'sha256': sha(a.rustc)},
              'environment': {k: os.environ.get(k) for k in ('ELAN_HOME', 'CARGO_HOME', 'PATH')}}
for tool, executable in [('lexlean', a.lexlean), ('rustc', a.rustc), ('node', a.node), ('lean', 'lean')]:
    identities[tool + '_version'] = run([executable, '--version'], tool + '-version', cwd=ROOT / 'prism/numeric').read_text().strip()
    resolved = shutil.which(str(executable))
    if resolved:
        identities[tool + '_resolved_sha256'] = sha(resolved)
    if tool == 'lean' and shutil.which('elan'):
        actual = run(['elan', 'which', 'lean'], 'lean-actual-path', cwd=ROOT / 'prism/numeric').read_text().strip()
        identities['lean_actual'] = {'path': actual, 'sha256': sha(actual)}
(OUT / 'runner-tool-identities.json').write_text(json.dumps(identities, indent=2) + '\n')

# Regeneration is checked after the compiler's formatter, exactly as checked in.
regen = OUT / 'regenerated'
copy_project(regen)
run([sys.executable, 'scripts/numeric/generate-source.py', '--output-dir', regen / 'src'], 'regenerate')
lex(regen, ['lock'], 'regenerate-lock')
lex(regen, ['fmt'], 'regenerate-fmt')
for name in ('Wide.lex.tex', 'Float.lex.tex'):
    assert (regen / 'src' / name).read_bytes() == (ROOT / 'prism/numeric/src' / name).read_bytes(), name
    text = (regen / 'src' / name).read_text()
    assert not re.search(r'\b(?:Int|Nat|iterate|to_nat|to_int|fun|less_than)\b', text), name

project = OUT / 'typed-final-project'
helpers = OUT / 'typed-helpers'
targets = json.loads(run([a.lexlean, 'production', 'targets', '--diagnostic-format', 'json'], 'targets').read_text())
target = next(x for x in targets['targets'] if x['id'] == 'rust-std')
results = {}
packages = {}
for helper, project in [(False, project), (True, helpers)]:
    label = 'helpers' if helper else 'roots'
    copy_project(project, helper)
    names = sorted(['length', 'lengthStep', 'multiply', 'round', 'signedLess', 'unsignedLess'] + ['convertUInt64ToUInt8', 'convertUInt64ToUInt16', 'convertUInt64ToUInt32', 'convertUInt32ToUInt64', 'convertUInt8ToInt16', 'convertUInt16ToInt16', 'convertInt16ToUInt8', 'convertInt16ToUInt16', 'convertInt16ToUInt32', 'convertInt16ToUInt64']) if helper else ['div32', 'div64', 'mul32', 'mul64']
    prefix = 'BoundedNumeric.HelperControls.' if helper else 'BoundedNumeric.Float.'
    request = {'spec': 'lexlean/production-request/1', 'roots': [
        {'package': {'name': ('bounded_' if helper else 'numeric_') + n.lower(), 'version': '0.1.0'},
         'root': prefix + n, 'targets': [{'id': target['id'], 'digest': target['digest']}]}
        for n in names]}
    (project / 'request.json').write_text(json.dumps(request, indent=2) + '\n')
    lex(project, ['lock'], label + '-lock')
    check = json.loads(lex(project, ['check', '--all', '--diagnostic-format', 'json'], label + '-check').read_text())
    lex(project, ['fmt', '--check'], label + '-fmt-check')
    recorded = OUT / ('typed-helper-production-result.json' if helper else 'typed-final-production-result.json')
    if a.reuse_builds:
        command = json.loads(recorded.read_text())
    else:
        command = json.loads(lex(project, ['production', 'build', '--request', project / 'request.json', '--diagnostic-format', 'json'], label + '-build').read_text())
    assert command['success'] and command['exit_code'] == 0, command
    for key in ('source_id', 'semantic_id'):
        assert command[key] == check[key], (label, key)
    bundle = project / command['artifacts'][0]
    result = json.loads((bundle / 'result.json').read_text())
    assert {r['root'] for r in result['roots']} == {r['root'] for r in request['roots']}
    assert result['source']['lock_sha256'] == sha(project / 'lexlean.lock')
    lex(project, ['production', 'verify-artifact', bundle], label + '-verify-artifact')
    results[label] = {'command': command, 'result': result, 'bundle': str(bundle.relative_to(ROOT))}
    for entry in result['roots']:
        package = entry['outputs'][0]['package']
        name = package['name']
        source = bundle / package['directory'] / 'src/lib.rs'
        assert package['export'] == 'run'
        packages[name] = {'source': str(source.relative_to(ROOT)), 'sha256': sha(source),
                          'signature': re.search(r'pub fn run\([^\n]+', source.read_text()).group()}
        for wasm in [False, True]:
            suffix = '_wasm' if wasm else ''
            flags = ['--target', 'wasm32-unknown-unknown'] if wasm else []
            run([a.rustc, '--edition=2021', '-O', '--crate-type', 'rlib', '--crate-name', name,
                 *flags, source, '-o', OUT / f'lib{name}{suffix}.rlib'], name + suffix + '-compile')

(OUT / 'runner-packages.json').write_text(json.dumps(packages, indent=2) + '\n')
(OUT / 'runner-results.json').write_text(json.dumps(results, indent=2) + '\n')
# Reuse the prior ABI/oracle independently; the finite raw exports now return
# Option directly, so lift only that boundary into the existing classifier.
abi = (ROOT / 'scripts/numeric/wasm.rs').read_text()
for name in ('mul32', 'mul64', 'div32', 'div64'):
    assert '-> Option<' in packages['numeric_' + name]['signature']
    pattern = rf'classify\(numeric_{name}::run\(([^)]*)\)\)'
    abi, count = re.subn(pattern, rf'classify(Ok::<_, ()>(numeric_{name}::run(\1)))', abi)
    assert count == 1
(OUT / 'wasm.rs').write_text(abi)
shutil.copyfile(ROOT / 'scripts/numeric/native.rs', OUT / 'native.rs')
replay = (ROOT / 'scripts/numeric/replay.mjs').read_text().replace("const dir = 'artifacts/numeric-task2';", "const dir = 'artifacts/numeric-bounded-source';")
(OUT / 'replay.mjs').write_text(replay)


def compile_driver(source, names, output, wasm=False):
    flags = ['--crate-type', 'cdylib', '--target', 'wasm32-unknown-unknown'] if wasm else []
    for name in names:
        flags += ['--extern', f'{name}={OUT}/lib{name}{"_wasm" if wasm else ""}.rlib']
    run([a.rustc, '--edition=2021', '-O', *flags, source, '-o', OUT / output], output + '-compile')


root_names = [n for n in packages if n.startswith('numeric_')]
helper_names = [n for n in packages if n.startswith('bounded_')]
compile_driver(OUT / 'native.rs', root_names, 'native')
compile_driver(OUT / 'wasm.rs', root_names, 'numeric.wasm', True)
run([sys.executable, 'scripts/numeric/oracle.py', '--include-division', '--output', OUT / 'vectors.json'], 'oracle')
vectors = json.loads((OUT / 'vectors.json').read_text())['vectors']
assert len(vectors) == 44648
assert sha(OUT / 'vectors.json') == '9edf45b030d1a317adc378abb579386503ca39ea71c37e2d3f475ba6a91b7f92'
(OUT / 'vectors.txt').write_text(''.join(' '.join(map(str, row)) + '\n' for row in vectors))
with (OUT / 'vectors.txt').open('rb') as corpus:
    native_replay = run([OUT / 'native'], 'native-replay', stdin=corpus)
assert native_replay.read_bytes() == gzip.decompress((ROOT / 'artifacts/numeric-task2/native-replay.log.gz').read_bytes())
run([a.node, OUT / 'replay.mjs'], 'wasm-replay')
assert 'LAST = bits;' in abi
(OUT / 'wrong-result.rs').write_text(abi.replace('LAST = bits;', 'LAST = bits ^ 1;'))
compile_driver(OUT / 'wrong-result.rs', root_names, 'wrong-result.wasm', True)
mutation = run([a.node, OUT / 'replay.mjs', OUT / 'wrong-result.wasm'], 'red-wrong-result', failure=True).read_text()
assert 'ERR_ASSERTION' in mutation and '1n !== 0n' in mutation
helper_source = ROOT / 'scripts/numeric/tests/bounded_helpers.rs'
compile_driver(helper_source, helper_names, 'helpers-native')
compile_driver(helper_source, helper_names, 'helpers.wasm', True)
run([OUT / 'helpers-native'], 'helpers-native-replay')
run([a.node, '-e', 'const fs=require("fs"),a=require("assert/strict");const m=new WebAssembly.Module(fs.readFileSync(process.argv[1]));a.deepEqual(WebAssembly.Module.imports(m),[]);a.equal(new WebAssembly.Instance(m).exports.selftest(),0);console.log("passed bounded helper controls; imports=0");', OUT / 'helpers.wasm'], 'helpers-wasm-replay')
# Drive an actual generated helper refusal through the unchanged ABI dispatch
# and state-update code in an isolated control. Generated packages stay intact.
failure_abi = abi.replace('numeric_mul64::run(a, b)', 'bounded_round::run(0, 0, 0, 0, i16::MIN)')
assert failure_abi != abi
(OUT / 'generated-failure.rs').write_text(failure_abi)
compile_driver(OUT / 'generated-failure.rs', root_names + ['bounded_round'], 'generated-failure.wasm', True)
run([a.node, '-e', 'const fs=require("fs"),a=require("assert/strict");const m=new WebAssembly.Module(fs.readFileSync(process.argv[1]));a.deepEqual(WebAssembly.Module.imports(m),[]);const e=new WebAssembly.Instance(m).exports;a.equal(e.numeric_run(0,0x3f800000n,0x40000000n),0);const prior=e.numeric_result();a.equal(e.numeric_run(1,0n,0n),2);a.equal(e.numeric_result(),prior);console.log("passed actual generated None -> status2 and prior-result retention");', OUT / 'generated-failure.wasm'], 'generated-failure-replay')
# Mutating emitted bytes must be caught by the raw bundle verifier.
rejected = OUT / 'rejected-bundle'
if rejected.exists():
    shutil.rmtree(rejected)
shutil.copytree(ROOT / results['roots']['bundle'], rejected)
changed = next(rejected.glob('packages/*/*/src/lib.rs'))
changed.write_bytes(changed.read_bytes() + b'\n')
changed_log = run([a.lexlean, '--project', OUT / 'typed-final-project/lexlean.toml', 'production', 'verify-artifact', rejected], 'red-changed-bundle', failure=True).read_text()
assert 'LLV7102' in changed_log and 'length and SHA-256' in changed_log
manifest = {'scope': identities['scope'], 'vectors': len(vectors), 'packages': packages,
            'results': results, 'tools': identities}
inputs = list((ROOT / 'prism/numeric/src').glob('*.lex.tex')) + [ROOT / 'scripts/numeric' / name for name in ('generate-source.py', 'oracle.py', 'native.rs', 'wasm.rs', 'replay.mjs')]
inputs += [Path(__file__), helper_source, Path(__file__).with_name('bounded-helper-controls.lex.tex'), ROOT / 'artifacts/numeric-task2/native-replay.log.gz']
# runner.log is the caller's still-open stdout redirect and cannot be hashed
# before this process's final print. All completed per-command logs are bound.
products = [x for x in OUT.rglob('*') if x.is_file() and '.lake' not in x.parts and x.name not in ('runner-manifest.json', 'runner.log')]
manifest['sha256'] = {str(x.relative_to(ROOT)): sha(x) for x in sorted(set(inputs + products))}
(OUT / 'runner-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'status': 'passed', 'vectors_native_and_wasm': len(vectors), 'helpers': 'native and import-free Wasm', 'scope': identities['scope']}))
