# Task2a0 preflight — read-only

2026-11-17. **Await explicit parent dispatch/exclusive slot.** Read the 12,151B snapshot brief, pin rereview, parent ruling and repaired Task1 independent PASS. No helper/compiler/CLI invocation, build, network, cleanup, new directory, source/test/index edit or subagent. Only this report is written. Renew measurements when the host-layout owner releases the slot.

## Repaired artifact anchors

P=/workspace/diagnostic-tools/constructive-nat-task1/package; E=its sibling evidence; D=/workspace/diagnostic-tools/lexlean-target/release; R=/workspace/diagnostic-tools/rust-1.97.1. Original /workspace/scratch/prismpm-numeric HEAD is463177a0971d95e112e10ed5da39c8cbaf0a4c96 with empty porcelain status (GIT_OPTIONAL_LOCKS=0). P metadata declares local-unadmitted-component, lexlean-constructive-diagnostic0.4.0-constructive.1, base e0b74b81e6f49c83596a957d232c8383a5db1a25, authoritative_descriptor=null.

Use **E/fix1-component-inventory.json**, SHA256543b2058fde3cf826e5f3f350ed067bf01c88dc3fb7ec60eb53cecb14c220faa: all1,076 actual regular-file rows match length/hash/mode. Historical E/component-inventory-current.json has four pre-repair hashes and candidate_cli_retained=false. Accepted repair77dd61d5ecfc03da3af9d3ce49294863766dbcb0 is independently PASS; fix1-source.patch26,362B SHA2564f115e24040b0ac165b32c0ded2afd4ce4b148ff44a00f58d88d63f172015bc6.

E/fix1-cli-build.json records successful locked/offline release build with P cwd/manifest, explicit R/bin/rustc/shared target. Actual D/lexlean-constructive-diagnostic is regular60,569,368B SHA256b34b111b19e4bb35eaaff28abd2600fa48ede3c5c1e15cfa899f13bb1fc1fcd3, matching acceptance.

Candidate **D/deps/liblexlean_constructive_diagnostic-910ff143c3cac728.rlib**, regular172,370,270B, SHA256e6caf694cb9cd41e6990d74d6d0f68166468581ae71b7c3dea75b1c69354a5ab. Cargo stamp48bf7dd3ae73c0f6 decoded little-endian u64=17780338523568455496 matches CLI fingerprint's library edge. Corresponding .d names repaired src paths, P embedded assets and OUT_DIR=D/build/lexlean-constructive-diagnostic-cdbdae18bf7892c9/out. Attribution uses accepted build cwd/manifest + .d + repaired inventory, not suffix alone. fix1-integration-result.json's compiler-artifact identifies this package but describes a test artifact, not a separate library-build record.

Camino **D/deps/libcamino-c62529521ef7b2c7.rlib**, regular788,798B, SHA256958f2d24b78a6c139a1fb1800584be5459861696e9b668ec2145539c6ea01c6d. Stamp1e439191b4a75ac8=u64 14437035949467714334 matches candidate/CLI edges. Corresponding .d identifies /workspace/diagnostic-tools/cargo-home/registry/src/index.crates.io-1949cf8c6b5b557f/camino-1.2.5/src/lib.rs. P/Cargo.lock1.2.5 checksum equals actual cached39,915B camino-1.2.5.crate SHA256bb1307f12aa967b5a58416e87b3653360e0fd614a016b6e970db08fecbb1b80d. Source .cargo-checksum.json absent.

Recursive exact Cargo stamp traversal resolves88 fingerprint JSON records, no missing/ambiguous edge. Existing transitive artifacts and host sysroot are present. Execution must retain full fingerprints/.d/file-hash inventories and bind actual linked members; no dependency rebuild/resolution is needed.

## Rust/linker feasibility

Existing .rustc_info identifies rustc1.97.1, commit8bab26f4f68e0e26f0bb7960be334d5b520ea452, x86_64-unknown-linux-gnu, LLVM22.1.6. Actual R/bin/rustc645,000B SHA256d3a664c970a9fd8361b64194861bebc1ae37b9054e5ee3400dc1c9e691797eea. readelf identifies librustc_driver-832cf6cfb1386559.so/libLLVM.so.22.1-rust-1.97.1-stable through $ORIGIN/../lib plus host runtimes. CLI needs libgcc_s/libc/loader. Freeze full resolved runtime closure at execution.

/usr/bin/x86_64-linux-gnu-gcc-14 regular1,162,264B SHA256a23ecab8ff08f09ad8c80602c2c5df7f49e09c25905cb8975902e101bf72635f. collect2 exists at /usr/libexec/gcc/x86_64-linux-gnu/14/collect2,422,136B SHA256ea31a4cebd9df1b6428c463428d461ccecfe66c897936409d5b2cde0b3af9e27. /usr/bin/x86_64-linux-gnu-ld.bfd1,861,256B SHA256d2766988b6a1b1d1518cdc09242e726d1f24e151e16410ada3092b11ffd9081b. GCC14 crtbeginS/crtendS and system Scrt1/crti/crtn exist. Brief's one direct offline rustc link appears feasible; size/resources remain untested. Existing172MiB rlib stays read-only in place, never copied into owned growth.

## API/config/stack/publication exactness

Engine::load(&camino::Utf8Path), snapshot(CheckRequest{selection:Selection::Entrypoints}) use actual current lock/check pipeline. Public doc-hidden Project::load supplies config.canonical_toml().into_bytes() and limits.compile_stack_plan().stack_bytes as allowed. Fixture max_scope_depth1024 yields83,886,080B (16MiB+1024*64KiB). Keep Engine/snapshot construction, serialization and destruction on that outer worker stack; check_project uses another same-sized compile thread. Preserve limits. **Snapshot canonical_bytes already includes exactly one final LF: write verbatim.** Language1.2 yields lexlean/semantic-snapshot/2. Summary declarations sort logical_id bytes; linked raw order stays authored; nontrivial lowering provides elaboration.declarations.

Real CLI globals: --project <owned-config> --diagnostic-format json --color never; default Entrypoints. Per-fixture sequence exactly lock,fmt,lock --check,check,build,probe. Build publishes .lexlean/build/<actual build_id>/manifest.json and proofs/constructive-nat.json, including zero-row language1.2 certificate. Cross-check full manifest inputs/outputs and source/config/lock/snapshot IDs. No future paths/IDs/hashes known. Ordering raw zLast,middleIdentity,aFirst must yield summary aFirst,middleIdentity,zLast, nonempty realization lowering to definition, certificate zLast,aFirst. Parser acceptance untested; no silent correction.

## Fixtures/resources/next work

E/fix1-retained-input-output-inventory.json101,688B SHA2562a055b4d5b1426a5a68e4e8962c30aa1d942155c3a18e45c4ec293ae791c8a28 binds all14 prescribed source members; every raw length/hash matches its exact row. All regular,0600 except zero lock0644. Under Task1 fixtures:

|Fixture|Members|Bytes|
|---|---|---:|
|positive-direct|lexlean.toml, lexlean.lock|723,1597|
|positive-direct|src/Bounds.lex.tex, src/Compatibility.lex.tex, src/Generic.lex.tex|1269,430,1891|
|compat-v5-1.2-candidate|lexlean.toml, lexlean.lock, src/Compatibility.lex.tex|678,1597,430|
|each source fixture|lean-toolchain, lakefile.toml, lake-manifest.json|25,46,150|

Both workspace triples identical. Raw SHA256:

- lean-toolchain:8e3538e0ab5f81a3ee04927d8838c8c674e0e112838b4b3ce87ec218143276af; literal leanprover/lean4:v4.32.1 plus LF.
- lakefile.toml:64bbda1d8f6492d8e4a20b0eddffe2199e3654a1855324837a5a3bf3244f8abd.
- lake-manifest.json:e2d7568929818723dcc8517bf677001b81a9bcdcd0c8efa4ac5779d50d5cf0ef.

Source lakefile.lean absent. Positive expects five Bounds+nine Generic rows; Compatibility's two declarations excluded. Zero has originalArithmetic nonempty-policy/originalReflexivity empty-policy, zero rows. Ordering takes zero's triple verbatim and generates its lock. Ancestor lstat checks show directories/no ancestor symlink for P,both source fixtures,D/deps,R. Hold file/ancestor identities and recheck pins before each command/after batch.

T=/workspace/diagnostic-tools/constructive-nat-task2a0 absent. Free8,975,708,160B exceeds launch8,740,929,536B; MemAvailable17,404,900KiB; cgroup max17,179,869,184/current3,027,947,520B pass4GiB headroom. Nothing reserved.

After dispatch: create only brief-owned files; freeze no-follow inputs/tools; implement stdlib owner/tiny driver; run one supervised link then fixed batch; index only cross-checked acquired bytes. Preserve128MiB growth,8GiB floor,2GiB process-tree RSS,180s link,120s batch,8MiB logs/proactive thresholds. Record peak/retained growth without cleanup. **Conditional exactness gate:**100ms /proc sampling can miss short-lived children; resolve complete descendant attribution before claiming an exact command tree. No current missing-artifact/resource blocker found. Slot/dispatch, runtime/tool attribution, actual link bounds and parser acceptance remain gates. No successful a0, a1 readiness, Task2 completion or admission claimed.
