import {readFileSync} from 'node:fs';
import {sha256} from './prism-verifier-backport.mjs';
export const proofProjects = Object.freeze({round:'prism/app',evolution:'prism/evolution/app',identity:'prism/identity/app'});
const productNames={round:['prism_cs_round','CS Round.holo','public/prism/CS-Round.holo'],evolution:['prism_cs_evolution','CS Evolution.holo','public/prism/CS-Evolution.holo'],identity:['prism_cs1618','cs1.618.holo','public/prism/CS-Identity.holo']};
export function bindVerifiedKernel(project, verification, read = readFileSync) {
  if(!Object.hasOwn(proofProjects,project))throw Error('Unknown proof project');
  if(verification?.schema!=='prismpm/verify-result/1'||!/^[a-f0-9]{64}$/.test(verification.build_id)||!/^[a-f0-9]{64}$/.test(verification.attestation_id))throw Error('Invalid full verification result');
  const kernel=`public/wasm/cs_${project}.wasm`;
  const [crate,holoName,publishedHolo]=productNames[project];
  const buildRoot=`${proofProjects[project]}/.prism/build/${verification.build_id}`;
  const compiled=`${buildRoot}/core-wasm/${crate}_core_wasm.wasm`;
  const kernelSha256=sha256(read(kernel));
  if(kernelSha256!==sha256(read(compiled)))throw Error('Published kernel differs from the fully verified application build');
  const holoSha256=sha256(read(publishedHolo));
  if(holoSha256!==sha256(read(`${buildRoot}/${holoName}`)))throw Error('Published Holo differs from the fully verified application build');
  if(project==='identity'&&holoSha256!==sha256(read('public/app.holo')))throw Error('Published discoverable Holo differs from the fully verified application build');
  return {kernelSha256,holoSha256,holoBinding:'identical',buildId:verification.build_id,attestationId:verification.attestation_id,kernelBinding:'identical'};
}
