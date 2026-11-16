import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// Backport only the replay-input correction from this upstream commit. The
// artifact-set comparison, duplicate rejection and byte comparisons stay intact.
export const verifierBackport = Object.freeze({
  schema: 'cs1618/prism-verifier-backport/1',
  platform: 'linux/amd64',
  upstream: 'https://github.com/UOR-Foundation/prismpm/commit/359d7f5bfa8e01272ba6028c30c94459420ebb6a',
  sdkSourceRevision: '3666dc0f9da56fcf066d96ec01cd9e14ec9a2974',
  sourcePath: 'crates/prismpm/src/verification.rs',
  sourceSha256: '0ac12b166ac69535ebf00c0af35bd6c9cfe1ea5d0660fccd8f9d49f31ca432b4',
  patchedSha256: '43afc51ef5ec9d930bf039e9356caf9b3ae701248a5fab3f54efd4bb0c2bfac0',
  binarySha256: '33aec8246dab174f926633feab1fa3c0e8c73a911a67042599aa0dfcc1a1ab2e',
});
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function patchVerifier(source) {
  if (sha256(source) !== verifierBackport.sourceSha256) throw Error('Pinned Prism verifier source digest differs');
  const before = '        if path.starts_with("lexlean/")\n            || path.starts_with("application/lexlean-build/")';
  const after = '        if path.starts_with("lexlean/")\n            || path.starts_with("design/")\n            || path.starts_with("oscal/")\n            || path.starts_with("application/lexlean-build/")';
  const patched = source.replace(before, after);
  if (sha256(patched) !== verifierBackport.patchedSha256) throw Error('Prism verifier backport digest differs');
  return patched;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const file = resolve(process.argv[2], verifierBackport.sourcePath);
  writeFileSync(file, patchVerifier(readFileSync(file,'utf8')));
}
