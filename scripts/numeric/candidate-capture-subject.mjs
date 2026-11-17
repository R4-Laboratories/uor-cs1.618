// Fixed game owner. Imports authenticate original source; JSON never revives a brand.
import assert from 'node:assert/strict';
import {chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync,
  renameSync, symlinkSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const home = dirname(fileURLToPath(import.meta.url));
const source = resolve(home, '../..');
assert.equal(source, '/workspaces/prismpm', 'fixed actual tracked build root');
const sha = body => createHash('sha256').update(body).digest('hex');
const preparation = JSON.parse(readFileSync(join(home, 'preparation.json')));
const admitted = JSON.parse(readFileSync(join(home, 'source-files.json')));
for (const row of admitted) {
  if (row.mode === '120000') continue; // Complete sourceInventory owns direct aliases.
  const path = join(source, row.path);
  assert.equal(realpathSync(path), path); assert.equal(sha(readFileSync(path)), row.sha256);
}
assert.equal(sha(readFileSync(fileURLToPath(import.meta.url))), preparation.subject_adapter.sha256);
const load = path => import(pathToFileURL(join(source, path)));
const {run, verifyCompilerTools} = await load('tests/browser-view/compile.mjs');
const {sourceInventory} = await load('tests/publication-context-linkage/capture-owner.mjs');
const {captureCompilerArtifact} = await load('tests/browser-view/compiler-artifact.mjs');
const write = (path, value) => writeFileSync(path, JSON.stringify(value)+'\n', {flag:'wx',mode:0o400});
const file = path => ({path, bytes:lstatSync(path).size, sha256:sha(readFileSync(path))});
const original = sourceInventory(source);
const verify = () => assert.deepEqual(sourceInventory(source), original);
const args = ['test','--locked','--offline','-p','prismpm','-p','repo-conformance','--lib','--no-run',
  '--message-format=json','--jobs','1','--config','profile.dev.debug=0','--config','build.incremental=false'];
assert.deepEqual(process.argv.slice(2), ['build-subjects']);
verifyCompilerTools();
write(join(home,'tool-identities.json'), Object.fromEntries(['cargo','rustc','lean','lake','node'].map(name =>
  [name,run(name,name==='cargo'||name==='rustc'?['--version','--verbose']:['--version'],source)])));
for (const id of ['Q1','Q2']) {
  const work = id === 'Q1' ? join(home,'subjects/Q1') : mkdtempSync('/tmp/prismpm-publication-capture-');
  if (id === 'Q1') mkdirSync(work,{recursive:true,mode:0o700});
  chmodSync(work,0o700);
  const root = id === 'Q1' ? source : join(work,'source');
  if (id === 'Q2') {
    mkdirSync(root,{mode:0o700});
    for (const [path,row] of original) {
      const destination = join(root,path);
      if (row.kind === 'directory') mkdirSync(destination,{mode:0o700});
      else if (row.kind === 'link') symlinkSync(row.target,destination);
      else {
        const bytes=readFileSync(join(source,path));assert.equal(sha(bytes),row.sha256);
        writeFileSync(destination,bytes,{flag:'wx',mode:row.executable?0o500:0o400});
      }
    }
  }
  const check = () => {verify();assert.deepEqual(sourceInventory(root),original);};
  check(); write(join(work,'source-inventory.json'),Object.fromEntries(original));
  const target=join(work,'cargo-target');assert.equal(lstatSync(target,{throwIfNoEntry:false}),undefined);
  let output;
  try {output=run('cargo',args,root,{CARGO_TARGET_DIR:target});} finally {check();}
  writeFileSync(join(work,'cargo.jsonl'),output,{flag:'wx',mode:0o400});
  const rows=output.trim().split('\n').map(line=>JSON.parse(line));
  const candidates=rows.filter(row=>row.reason==='compiler-artifact'&&row.target.name==='prismpm'&&row.profile.test&&row.executable);
  assert.equal(candidates.length,1);const artifact=candidates[0];
  assert.equal(artifact.fresh,false);assert.deepEqual(artifact.target.kind,['lib']);
  assert.equal(artifact.manifest_path,join(root,'crates/prismpm/Cargo.toml'));
  assert.equal(artifact.target.src_path,join(root,'crates/prismpm/src/lib.rs'));
  const emitted=artifact.executable;assert.ok(emitted.startsWith(target+sep));assert.equal(realpathSync(emitted),emitted);
  const before=lstatSync(emitted);assert.ok(before.isFile()&&before.nlink===1&&before.size<=268435456);
  const digest=sha(readFileSync(emitted)),retained=join(work,'publication-capture-built-tests');
  renameSync(emitted,retained);const after=lstatSync(retained);
  assert.equal(after.ino,before.ino);assert.equal(after.dev,before.dev);assert.equal(sha(readFileSync(retained)),digest);
  const owner=captureCompilerArtifact(work,retained,'publication-capture');
  let listing;try {listing=owner.run(['--list','--format=terse'],root);} finally {owner.verify();check();}
  writeFileSync(join(work,'listing.txt'),listing,{flag:'wx',mode:0o400});
  write(join(work,'compiler-custody.json'),owner.evidence);
  write(join(work,'relocation.json'),{emitted,retained,dev:String(before.dev),ino:String(before.ino),sha256:digest});
  const record={id,work,root,cargo_output:file(join(work,'cargo.jsonl')),artifact:{...file(retained),
    manifest_path:artifact.manifest_path,dev:String(after.dev),ino:String(after.ino),fresh:false},
    execution:{...file(owner.path),dev:owner.evidence.private.device,ino:owner.evidence.private.inode,mode:owner.evidence.private.mode},
    listing:file(join(work,'listing.txt')),source_inventory:file(join(work,'source-inventory.json'))};
  write(join(home,id+'-build.json'),record);
  run('cargo',['clean','--manifest-path',join(root,'Cargo.toml'),'--target-dir',target],root);
  owner.verify();check();
}
const target=join(home,'harness-target');assert.equal(lstatSync(target,{throwIfNoEntry:false}),undefined);
let output;
try {output=run('cargo',['test','--locked','--offline','-p','repo-conformance','--test','conformance','--no-run','--message-format=json'],source,{CARGO_TARGET_DIR:target});}
finally {verify();}
writeFileSync(join(home,'harness-cargo.jsonl'),output,{flag:'wx',mode:0o400});
const harness=output.trim().split('\n').map(line=>JSON.parse(line)).filter(row=>row.reason==='compiler-artifact'&&row.target.name==='conformance'&&row.executable&&row.profile.test);
assert.equal(harness.length,1);assert.equal(harness[0].fresh,false);
assert.equal(harness[0].manifest_path,join(source,'crates/conformance/Cargo.toml'));
assert.ok(harness[0].executable.startsWith(target+sep));
assert.equal(realpathSync(harness[0].executable),harness[0].executable);
const stat=lstatSync(harness[0].executable);assert.ok(stat.isFile()&&stat.nlink===1&&stat.size<=268435456);
write(join(home,'harness.json'),{...file(harness[0].executable),dev:String(stat.dev),ino:String(stat.ino),target});
verify();
