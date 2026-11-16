#!/usr/bin/env bash
# Supplemental source-test tools only; never writes into SDK compiler/bin paths.
set -euo pipefail
testroot=/tmp/compiler-test-tools
mkdir -p "$testroot/downloads" "$testroot/bin" /evidence/test-tools
fetch_checked() {
  local url=$1 destination=$2 expected=$3
  curl --proto '=https' --tlsv1.2 --fail --silent --show-error --location --retry 3 "$url" -o "$destination"
  printf '%s  %s\n' "$expected" "$destination" | sha256sum -c -
}
fetch_checked https://github.com/wasm-bindgen/wasm-pack/releases/download/v0.13.1/wasm-pack-v0.13.1-x86_64-unknown-linux-musl.tar.gz \
  "$testroot/downloads/wasm-pack.tar.gz" c539d91ccab2591a7e975bcf82c82e1911b03335c80aa83d67ad25ed2ad06539
fetch_checked https://github.com/wasm-bindgen/wasm-bindgen/releases/download/0.2.122/wasm-bindgen-0.2.122-x86_64-unknown-linux-musl.tar.gz \
  "$testroot/downloads/bindgen.tar.gz" 122a3fe2ea9c6e3e89b50e42dd1a346e499f3f65a54aae0b4eaeb658139d1e0e
fetch_checked https://github.com/WebAssembly/binaryen/releases/download/version_117/binaryen-version_117-x86_64-linux.tar.gz \
  "$testroot/downloads/binaryen.tar.gz" 3dc677006555b355ea2da5e82602065a161d5e83eaefd3f759afa00b96e83212
fetch_checked https://github.com/JetBrains/kotlin/releases/download/v1.9.25/kotlin-compiler-1.9.25.zip \
  "$testroot/downloads/kotlin.zip" 6ab72d6144e71cbbc380b770c2ad380972548c63ab6ed4c79f11c88f2967332e
fetch_checked https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jdk_x64_linux_hotspot_17.0.13_11.tar.gz \
  "$testroot/downloads/jdk.tar.gz" 8682892fc02965930b9022c066fa164dd6f458ef4a5dc262016aa28333b30f49
for name in wasm-pack bindgen binaryen jdk; do
  mkdir -p "$testroot/$name"
  tar -xzf "$testroot/downloads/$name.tar.gz" --strip-components=1 -C "$testroot/$name"
done
python3 -m zipfile -e "$testroot/downloads/kotlin.zip" "$testroot/kotlin"
chmod +x "$testroot/kotlin/kotlinc/bin/"*
curl --proto '=https' --tlsv1.2 --fail --silent --show-error --location --retry 3 \
  https://registry.npmjs.org/typescript/-/typescript-4.8.4.tgz -o "$testroot/downloads/typescript.tgz"
python3 - "$testroot/downloads/typescript.tgz" <<'PY'
import base64,hashlib,sys
from pathlib import Path
expected='QCh+85mCy+h0IGff8r5XWzOVSbBO+KfeYrMQh7NJ58QujwcE22u+NUSmUxqF+un70P9GXKxa2HCNiTTMJknyjQ=='
actual=base64.b64encode(hashlib.sha512(Path(sys.argv[1]).read_bytes()).digest()).decode()
if actual != expected: raise SystemExit('TypeScript SRI mismatch')
PY
mkdir -p "$testroot/typescript"
tar -xzf "$testroot/downloads/typescript.tgz" --strip-components=1 -C "$testroot/typescript"
ln -s "$testroot/typescript/bin/tsc" "$testroot/bin/tsc"
ln -s "$testroot/wasm-pack/wasm-pack" "$testroot/bin/wasm-pack"
ln -s "$testroot/binaryen/bin/wasm-opt" "$testroot/bin/wasm-opt"

sdk_cargo_home=${CARGO_HOME:?SDK Cargo home must be set}
mkdir -p "$testroot/cargo-home/bin"
for cache in registry git; do
  if test -d "$sdk_cargo_home/$cache"; then
    ln -s "$sdk_cargo_home/$cache" "$testroot/cargo-home/$cache"
  fi
done
test -x "$sdk_cargo_home/bin/wasm-tools"
ln -s "$(readlink -f "$sdk_cargo_home/bin/wasm-tools")" "$testroot/cargo-home/bin/wasm-tools"
ln -s "$testroot/bindgen/wasm-bindgen" "$testroot/cargo-home/bin/wasm-bindgen"
export CARGO_HOME="$testroot/cargo-home"
export JAVA_HOME="$testroot/jdk"
test -x "$JAVA_HOME/bin/java"
export WASM_PACK_CACHE="$testroot/wasm-pack-cache"
export PATH="$testroot/bin:$JAVA_HOME/bin:$testroot/kotlin/kotlinc/bin:$CARGO_HOME/bin:$PATH"
unset CARGO_NET_OFFLINE

# Seed the existing fixtures' exact dependency family without changing their
# manifests or the compiler workspace lock. Retain the resolved auxiliary lock.
mkdir -p "$testroot/view-deps/src"
cat > "$testroot/view-deps/Cargo.toml" <<'EOF'
[package]
name = "compiler-source-test-view-deps"
version = "0.0.0"
edition = "2021"
[workspace]
[dependencies]
js-sys = "=0.3.99"
wasm-bindgen = "=0.2.122"
EOF
: > "$testroot/view-deps/src/lib.rs"
cargo generate-lockfile --manifest-path "$testroot/view-deps/Cargo.toml"
cargo fetch --locked --manifest-path "$testroot/view-deps/Cargo.toml" --target wasm32-unknown-unknown
cp "$testroot/view-deps/Cargo.lock" /evidence/test-tools/view-deps.Cargo.lock

mkdir -p /opt/lean4-prod/browser-tests
cp /source/scripts/browser-tests/package.json /source/scripts/browser-tests/package-lock.json /opt/lean4-prod/browser-tests/
npm ci --ignore-scripts --prefix /opt/lean4-prod/browser-tests
export PLAYWRIGHT_BROWSERS_PATH=/opt/lean4-prod/browsers
/opt/lean4-prod/browser-tests/node_modules/.bin/playwright install chromium
node <<'JS'
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const load=createRequire('/opt/lean4-prod/browser-tests/package.json');
assert.equal(load('playwright/package.json').version,'1.62.1');
(async()=>{const browser=await load('playwright').chromium.launch({headless:true});await browser.close();})().catch(e=>{console.error(e);process.exitCode=1;});
JS
{
  tsc --version
  kotlinc -version
  java -version
  wasm-pack --version
  "$CARGO_HOME/bin/wasm-bindgen" --version
  "$CARGO_HOME/bin/wasm-tools" --version
  wasm-opt --version
} > /evidence/test-tools/versions.txt 2>&1
cp "$JAVA_HOME/release" /evidence/test-tools/java-release.txt
cp /opt/lean4-prod/browser-tests/node_modules/playwright-core/browsers.json /evidence/test-tools/
cp /opt/lean4-prod/browser-tests/package-lock.json /evidence/test-tools/browser-package-lock.json
find "$testroot" /opt/lean4-prod/browsers -type f -print0 | sort -z | xargs -0 sha256sum > /evidence/test-tools/files.sha256
