#!/usr/bin/env bash
set -euo pipefail
cd /workspace
sdk_source=/opt/prismpm/share/conformance-root
build_root=/workspace/artifacts/proof-toolchain
mkdir -p artifacts/proofs "$build_root"
source_root="$build_root/source"
# Recreate sources each run; only locked Cargo compilation outputs are cached.
rm -rf "$source_root"
cp -a "$sdk_source" "$source_root"
node scripts/prism-verifier-backport.mjs "$source_root"
# The complete compiler source and offline dependencies come from the immutable
# SDK image. Refuse any different source before applying the upstream backport.
node --input-type=module - "$source_root" <<'JS'
import {readFileSync} from 'node:fs';
import {verifierBackport,sha256} from './scripts/prism-verifier-backport.mjs';
if(sha256(readFileSync(`${process.argv[2]}/${verifierBackport.sourcePath}`))!==verifierBackport.patchedSha256)throw Error('Prism verifier backport digest differs');
JS
export CARGO_TARGET_DIR="$build_root/target"
export CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_DEV_INCREMENTAL=false
export CARGO_PROFILE_TEST_DEBUG=0 CARGO_PROFILE_TEST_INCREMENTAL=false
cargo build --manifest-path "$source_root/Cargo.toml" --locked --offline -p prismpm --bin prismpm
cargo test --manifest-path "$source_root/Cargo.toml" --locked --offline -p prismpm --lib application_regeneration_requires_every_identical_artifact
node --input-type=module - "$build_root/target/debug/prismpm" <<'JS'
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {verifierBackport,sha256} from './scripts/prism-verifier-backport.mjs';
const executable=process.argv[2];
if(sha256(readFileSync(executable))!==verifierBackport.binarySha256)throw Error('Rebuilt Prism verifier binary digest differs');
writeFileSync('artifacts/proofs/verifier.json', JSON.stringify({...verifierBackport,binarySha256:sha256(readFileSync(executable)),version:execFileSync(executable,['--version'],{encoding:'utf8'}).trim(),regenerationMutationTest:'passed'},null,2)+'\n');
JS
