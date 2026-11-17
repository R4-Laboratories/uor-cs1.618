#!/usr/bin/env python3
"""Replay only result-selected, verified, newly emitted canonical package bytes.

Direct Option signatures are checked before compiling the independently retained
status adapter. No generated source is rewritten. This is separate ABI evidence,
not native-library Holo qualification or a substitute for Prism verification.
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
import packages

ROOT = Path(sys.argv[1]).resolve()
OUT = ROOT / 'replay'
OUT.mkdir(exist_ok=False)
HERE = Path(__file__).resolve().parent


def run(args, log, stdin=None, success=True):
    with (OUT / log).open('wb') as stream:
        result = subprocess.run([str(x) for x in args], stdout=stream, stderr=subprocess.STDOUT, stdin=stdin)
    packages.document(OUT / (log + '.status.json'), {'argv':[str(x) for x in args], 'exit_code':result.returncode})
    if (result.returncode == 0) != success:
        raise ValueError('unexpected replay command status: ' + log)
    return (OUT / log).read_text()


run(['python3', HERE.parent / 'oracle.py', '--include-division', '--output', OUT / 'vectors.json'], 'oracle.log')
vectors = json.loads((OUT / 'vectors.json').read_text())['vectors']
if len(vectors) != 44648:
    raise ValueError('unexpected oracle corpus size')
(OUT / 'vectors.txt').write_text(''.join(' '.join(map(str,row)) + '\n' for row in vectors))
commands, bindings, signatures = [], {}, {}
externs = {'native':[], 'wasm':[]}
for op in packages.OPS:
    selection = packages.selection(ROOT / 'projects' / op, ROOT / 'operations' / op)
    package = Path(selection['build']) / 'library/package'
    source = packages.regular(package / 'src/lib.rs')
    width = int(op[-2:]); typ = 'u' + str(width)
    signature = re.search(r'pub fn ' + op + r'\([^\n]+', source.read_text())
    if not signature or not re.fullmatch(r'pub fn ' + op + r'\(a: ' + typ + r', b: ' + typ + r'\) -> Option<' + typ + r'> \{', signature.group()):
        raise ValueError('new generated signature requires explicit ABI review: ' + op)
    signatures[op] = signature.group()
    bindings[op] = {'selection':selection, 'source_sha256':packages.digest(source), 'cargo_sha256':packages.digest(package / 'Cargo.toml')}
    for mode, target in [('native',[]), ('wasm',['--target','wasm32-unknown-unknown'])]:
        lib = OUT / ('libnumeric_' + op + '_' + mode + '.rlib')
        run(['rustc','--edition=2021','-O','--crate-name','numeric_' + op,'--crate-type','rlib',*target,source,'-o',lib], op + '-' + mode + '.log')
        externs[mode] += ['--extern', 'numeric_' + op + '=' + str(lib)]
# Retain the exact adapter and native harness used (derived from independently
# tested raw adapter, with direct Option matching instead of an invented Result).
for name in ('wasm.rs','native.rs','replay.mjs'):
    (OUT / name).write_bytes((HERE / name).read_bytes())
run(['rustc','--edition=2021','-O',OUT / 'native.rs',*externs['native'],'-o',OUT / 'native'], 'compile-native.log')
with (OUT / 'vectors.txt').open('rb') as corpus:
    run([OUT / 'native'], 'native-replay.log', stdin=corpus)
if len((OUT / 'native-replay.log').read_text().splitlines()) != 44648:
    raise ValueError('incomplete native transcript')
wasm_flags = ['--crate-type','cdylib','--target','wasm32-unknown-unknown']
run(['rustc','--edition=2021','-O',*wasm_flags,OUT / 'wasm.rs',*externs['wasm'],'-o',OUT / 'numeric.wasm'], 'compile-wasm.log')
run(['node',OUT / 'replay.mjs',OUT / 'numeric.wasm',OUT], 'wasm-replay.log')
wrong = (OUT / 'wasm.rs').read_text().replace('LAST = bits;', 'LAST = bits ^ 1;')
(OUT / 'wrong-result.rs').write_text(wrong)
run(['rustc','--edition=2021','-O',*wasm_flags,OUT / 'wrong-result.rs',*externs['wasm'],'-o',OUT / 'wrong-result.wasm'], 'compile-wrong-result.log')
rejection = run(['node',OUT / 'replay.mjs',OUT / 'wrong-result.wasm',OUT], 'wrong-result-rejection.log', success=False)
if 'ERR_ASSERTION' not in rejection:
    raise ValueError('wrong-result control failed outside comparator')
# Force only the source-owned ABI fixture to report None; kernel bytes stay fixed.
failure = (OUT / 'wasm.rs').read_text().replace('numeric_mul32::mul32(a as u32, b as u32)', 'None::<u32>')
(OUT / 'failure-control.rs').write_text(failure)
run(['rustc','--edition=2021','-O',*wasm_flags,OUT / 'failure-control.rs',*externs['wasm'],'-o',OUT / 'failure-control.wasm'], 'compile-failure-control.log')
code = "import fs from 'node:fs';import assert from 'node:assert/strict';const m=new WebAssembly.Module(fs.readFileSync(process.argv[1]));assert.deepEqual(WebAssembly.Module.imports(m),[]);const e=new WebAssembly.Instance(m).exports;assert.equal(e.numeric_run(1,0x3ff0000000000000n,0x4000000000000000n),0);const p=e.numeric_result();assert.equal(e.numeric_run(0,0n,0n),2);assert.equal(e.numeric_result(),p);console.log('explicit None retained as status 2; prior result preserved');"
run(['node','--input-type=module','-e',code,OUT / 'failure-control.wasm'], 'failure-control.log')
for op in packages.OPS:
    packages.selection(ROOT / 'projects' / op, ROOT / 'operations' / op)
packages.document(OUT / 'manifest.json', {'scope':'native-library artifacts plus separately bound status ABI; no Holo qualification', 'vectors':44648, 'bindings':bindings, 'signatures':signatures, 'harness_sha256':packages.digest(Path(__file__)), 'oracle_sha256':packages.digest(HERE.parent / 'oracle.py'), 'files':{p.name:packages.digest(p) for p in packages.files(OUT)}, 'pending':['independent actual bundle-reader source/root/archive/child/output controls; upstream full validation']})
