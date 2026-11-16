import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const dir = 'artifacts/numeric';
const bytes = fs.readFileSync(process.argv[2] ?? `${dir}/numeric.wasm`);
const module = new WebAssembly.Module(bytes);
assert.deepEqual(WebAssembly.Module.imports(module), []);
const {numeric_run: run, numeric_result: result} = new WebAssembly.Instance(module).exports;
assert.equal(run(1, 0x3ff0000000000000n, 0x4000000000000000n), 0);
const prior = result();
assert.equal(run(2, 0n, 0n), 1);
assert.equal(run(3, 0n, 0n), 1);
assert.equal(run(0, 0x100000000n, 0n), 3);
assert.equal(run(0, 0n, 0x100000000n), 3);
assert.equal(result(), prior);
const vectors = JSON.parse(fs.readFileSync(`${dir}/vectors.json`));
let count = [0, 0];
for (const [op, a, b, expected] of vectors.vectors) {
  assert.equal(run(op, BigInt(`0x${a}`), BigInt(`0x${b}`)), 0, `${op} ${a} ${b}`);
  assert.equal(BigInt.asUintN(64, result()), BigInt(`0x${expected}`), `${op} ${a} ${b}`);
  count[op]++;
}
console.log(JSON.stringify({status:'passed', vectors:count, imports:0, sha256:crypto.createHash('sha256').update(bytes).digest('hex')}));
