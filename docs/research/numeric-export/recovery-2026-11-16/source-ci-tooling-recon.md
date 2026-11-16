# Pinned-SDK source CI: supplemental test helpers

Read-only reconnaissance, 2026-11-16. No SDK was pulled, built, installed, or
changed; no compiler/game production files or gates were edited. This proposal
is for the diagnostic source CI over compiler base `991956fe`, candidate
`634c2c5`. It is **a pinned SDK plus separately identified test helpers**, never
a pristine-SDK result. Canonical production compiler acquisition remains separate.

## What failed

Evidence: `artifacts/numeric-task2c/ci-43966373788/gates/`.

- `workspace` and `assertions`: three hygiene tests cannot execute `tsc`,
  `kotlinc`, and `wasm-pack`. Kotlin also needs `java`. Other language tests have
  optional-tool skips, so preflight must require these tools to avoid hidden skips.
- `wasm-sdk-fixture` and `uor-fixture`: missing `wasm-pack`.
- `view` / `text-view`: generated manifests require **exact** `js-sys=0.3.99`
  and `wasm-bindgen=0.2.122`; the SDK registry predates them. Workspace
  `rust/Cargo.lock` instead contains `wasm-bindgen=0.2.126`, so fetching that
  lock alone does not prepare the generated adapters.
- `workspace-view`: cannot resolve `playwright/package.json` at the fixed
  `/opt/lean4-prod/browser-tests` location. Tests assert exactly `1.62.1`.
- `check-view.sh` and `check-text-view.sh` execute
  `$CARGO_HOME/bin/{wasm-tools,wasm-bindgen}` directly: PATH alone cannot replace
  the bindgen helper safely.

The candidate's removal of blanket `CARGO_NET_OFFLINE=true` is appropriate:
`check-view.sh` already resolves/fetches a generated lock before its explicit
`--locked --offline` checks/build. `check-text-view.sh` deliberately resolves
offline and must find that same exact dependency family already cached. Leave
every explicit locked/offline argument and every gate unchanged.

## Exact supplemental assets for Linux x86_64

Use a separate directory, e.g. `/tmp/compiler-test-tools`, and verify each
archive **before extraction**. These portable helpers avoid global npm installs,
an apt Kotlin/JDK upgrade, rustup changes, and writes to SDK Cargo binaries.
TypeScript 4.8.4 matches Bookworm's upstream TypeScript version; Kotlin 1.9.25
and Temurin 17.0.13+11 are explicit supplemental choices, not a claim that they
reproduce the source devcontainer's unversioned apt package closure.

| Asset | Exact archive URL | SHA-256 |
| --- | --- | --- |
| wasm-pack 0.13.1 | `https://github.com/wasm-bindgen/wasm-pack/releases/download/v0.13.1/wasm-pack-v0.13.1-x86_64-unknown-linux-musl.tar.gz` | `c539d91ccab2591a7e975bcf82c82e1911b03335c80aa83d67ad25ed2ad06539` |
| wasm-bindgen CLI 0.2.122 | `https://github.com/wasm-bindgen/wasm-bindgen/releases/download/0.2.122/wasm-bindgen-0.2.122-x86_64-unknown-linux-musl.tar.gz` | `122a3fe2ea9c6e3e89b50e42dd1a346e499f3f65a54aae0b4eaeb658139d1e0e` |
| Kotlin 1.9.25 | `https://github.com/JetBrains/kotlin/releases/download/v1.9.25/kotlin-compiler-1.9.25.zip` | `6ab72d6144e71cbbc380b770c2ad380972548c63ab6ed4c79f11c88f2967332e` |
| Temurin JDK 17.0.13+11 | `https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jdk_x64_linux_hotspot_17.0.13_11.tar.gz` | `8682892fc02965930b9022c066fa164dd6f458ef4a5dc262016aa28333b30f49` |
| Binaryen 117 (wasm-pack optimization helper) | `https://github.com/WebAssembly/binaryen/releases/download/version_117/binaryen-version_117-x86_64-linux.tar.gz` | `3dc677006555b355ea2da5e82602065a161d5e83eaefd3f759afa00b96e83212` |

TypeScript: `https://registry.npmjs.org/typescript/-/typescript-4.8.4.tgz`, npm
SRI `sha512-QCh+85mCy+h0IGff8r5XWzOVSbBO+KfeYrMQh7NJ58QujwcE22u+NUSmUxqF+un70P9GXKxa2HCNiTTMJknyjQ==`.
Verify with `openssl dgst -sha512 -binary typescript.tgz | openssl base64 -A`
against the SRI payload, or install from a supplemental package-lock containing
this exact version and integrity using `npm ci --ignore-scripts --prefix ...`.

Playwright's checked-in `scripts/browser-tests/package-lock.json` already pins
the package and core package to `1.62.1`, including npm SHA-512 integrities.
Its locked `playwright-core/browsers.json` pins Chromium/headless-shell revision
`1234`, browser `151.0.7922.34`, and ffmpeg revision `1011`. Record that installed
JSON and browser executable hashes in the evidence. Do not replace this with
an arbitrary system Chromium or a different Playwright version.

Metadata checked against public GitHub release APIs/checksum sidecars and npm /
crates.io version records. The wasm-pack archive had no release digest, so its
SHA-256 above was computed over the downloaded bytes in memory; no install ran.
The others have publisher checksum sidecars or release digest. Dependency
`js-sys 0.3.99` crate SHA-256 is
`142bc4740e452c1e57ade0cbc129f139c9093e354346f0872ef985f4f5cf5f11`.

## Hosted preparation sequence

Perform this inside the already selected pinned SDK, before compiler preflight,
with network allowed for explicit preparation. Keep logs under
`/evidence/test-tools/`. A download helper can be as small as:

```bash
fetch_checked() {
  local url=$1 destination=$2 expected=$3
  curl --proto '=https' --tlsv1.2 --fail --location --retry 3 "$url" -o "$destination"
  printf '%s  %s\n' "$expected" "$destination" | sha256sum -c -
}
```

Call it with the literal URL/digest pairs above. Extract each into its own
versioned directory; do not extract over `/usr/local` or SDK bin directories.
Use `tar --strip-components=1` for the tarballs. Kotlin ZIP contains `kotlinc/`;
`python3 -m zipfile -e` works without installing unzip, then restore executable
permission explicitly on `kotlinc/bin/*`. Put symlinks for `tsc`, `wasm-pack`,
and `wasm-opt` in the supplemental `bin/`. Set `JAVA_HOME` to the extracted
JDK and put its `bin/` and Kotlin's `bin/` on PATH. Keep the current pinned
Lean/Rust/Node executables and `RUSTUP_HOME` unchanged.

The smallest hosted-runner variant can reuse its existing Java instead: require
`JAVA_HOME_17_X64`, mount that directory read-only at
`/tmp/compiler-test-tools/runner-jdk`, and set `JAVA_HOME` to that mount. Record
the runner image identity, Java release file, `java -version`, and realpath/hash
of `bin/java` and `lib/server/libjvm.so`. This avoids installing Java in the SDK;
it is identified runner Java rather than the fixed Temurin archive above.
Use the fixed archive when that runner image/JDK identity cannot be pinned.

Use an isolated Cargo home for the hardcoded View helper location:

```bash
testroot=/tmp/compiler-test-tools
sdk_cargo_home=${CARGO_HOME:?}
sdk_path=$PATH
mkdir -p "$testroot/cargo-home/bin"
# Share only dependency caches, never the SDK bin directory.
for cache in registry git; do
  if test -d "$sdk_cargo_home/$cache"; then
    ln -s "$sdk_cargo_home/$cache" "$testroot/cargo-home/$cache"
  fi
done
ln -s "$(readlink -f "$sdk_cargo_home/bin/wasm-tools")" \
  "$testroot/cargo-home/bin/wasm-tools"
ln -s "$testroot/wasm-bindgen-0.2.122/wasm-bindgen" \
  "$testroot/cargo-home/bin/wasm-bindgen"
export CARGO_HOME="$testroot/cargo-home"
export JAVA_HOME="$testroot/jdk-17.0.13+11"
export WASM_PACK_CACHE="$testroot/wasm-pack-cache"
export PATH="$testroot/bin:$JAVA_HOME/bin:$testroot/kotlin-1.9.25/kotlinc/bin:$CARGO_HOME/bin:$sdk_path"
unset CARGO_NET_OFFLINE
```

The paths above assume versioned extraction directories with those names.
Assert that the original `wasm-tools` exists; do not silently substitute a new
version. Preserve any required SDK Cargo registry/source configuration explicitly
after reviewing it; copying an old blanket `offline=true` would undo this fix.
An independent cache copy is preferable if original-cache writes are also
disallowed. Shared-cache population changes the environment even though it
does not replace any SDK compiler binary.

Retain the existing workspace `cargo fetch --locked --manifest-path
rust/Cargo.toml` and before/after lock digest. Before the gates, seed the exact
View family with a temporary **external** helper manifest:

```bash
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
cargo fetch --locked --manifest-path "$testroot/view-deps/Cargo.toml" \
  --target wasm32-unknown-unknown
cp "$testroot/view-deps/Cargo.lock" /evidence/test-tools/view-deps.Cargo.lock
```

Archive the seed lock for replay; future preparation can restore it and run only
`cargo fetch --locked`. This does not edit the compiler's lock or generated
fixture manifests. Do not remove `--offline` from Text View or hygiene tests.

Prepare browsers using exactly the checked-in lock and fixed directory:

```bash
mkdir -p /opt/lean4-prod/browser-tests
cp scripts/browser-tests/package{,-lock}.json /opt/lean4-prod/browser-tests/
npm ci --ignore-scripts --prefix /opt/lean4-prod/browser-tests
export PLAYWRIGHT_BROWSERS_PATH=/opt/lean4-prod/browsers
/opt/lean4-prod/browser-tests/node_modules/.bin/playwright install chromium
```

Run a real headless Chromium launch preflight. If runtime libraries are absent,
the source devcontainer's command is `playwright install --with-deps chromium`;
it changes OS packages. For reproducible CI, pin the distro snapshot/package
closure before adopting that fallback and archive `dpkg-query -W` before/after.
Do not install arbitrary browser/system updates and describe that as pristine.

## Important remaining boundaries

- `wasm-pack 0.13.1` checks the resolved crate's exact bindgen version; on
  mismatch with PATH it downloads/caches that version, then may fall back to
  an unlocked `cargo install`. Do not let an unnoticed source-build fallback
  become reproducibility evidence. Its release optimizer is Binaryen 117;
  supplying verified `wasm-opt` keeps this step active. Never set skip-opt flags.
- Hygiene and View need CLI **0.2.122**. `build_wasm_sdk` instead emits
  `wasm-bindgen="0.2.122"` (caret range), so SDK/UOR generated packages can
  resolve another version; the workspace currently locks **0.2.126**. The
  0.2.126 linux-musl CLI release SHA-256 is
  `064948d58e2d6c0a745216477a639ba696216d6309aaa902939d1b865b1d869d`.
  Do not force every test onto one CLI or alter generated manifests to hide
  this difference. Archive resolved generated locks and wasm-pack helper
  paths/hashes. A frozen registry snapshot and identified wasm-pack cache are
  needed for complete repeatability without production pin changes.
- Assert tools exist and capture versions before all gates: `tsc --version`,
  `kotlinc -version`, `java -version`, `wasm-pack --version`,
  `$CARGO_HOME/bin/wasm-bindgen --version`, `wasm-opt --version`,
  `$CARGO_HOME/bin/wasm-tools --version`, Playwright package version and a
  browser launch. Preserve the already installed ripgrep 14.1.1 helper evidence.
- Capture SDK executable realpaths, versions, SHA-256, SDK inventory digest,
  compiler/game commits and diffs before preparation; compare original
  Lean/Lake/Rust/Cargo/Node binary hashes afterward. Hash supplemental archives,
  extracted executables, relevant helper JARs, browser locks and seed Cargo
  locks separately. A Kotlin launcher hash alone does not identify its compiler
  JARs; a browser launcher hash alone does not identify its full install.
- Run the exact full `scripts/check-numeric-source-stage.sh` after preparation;
  every gate failure stays a workflow failure. These findings explain missing
  prerequisites, not proof that remaining gates will pass. No local gate run,
  installation, or pass claim was made during reconnaissance.
