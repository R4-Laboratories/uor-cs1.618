# Task2c-B2B canonical native-library packaging checkpoint

Status: **NEEDS_CONTEXT — actual hosted unchanged-SDK gates pending**. Implementation
starts at game `4d7e03a`; this report is committed with the owned packaging
checkpoint. No upstream source, arithmetic source/generator, guest, SDK lock,
policy, identity, timeout or renderer was changed. Parent owns publication and
actual CI execution. This checkpoint does not admit production.

## Implemented inputs and orchestration

`prism/numeric/packages/{mul32,mul64,div32,div64}/descriptor.json` each describes
one real `prismpm/native-library/1` project. Cargo packages are
`cs-numeric-{operation}` version `0.1.0`, with the game's real HTTPS repository.
Each exports exactly the sorted raw `BoundedNumeric.Float.{operation}` root and
`BoundedNumeric.NumericPackage.acceptance`. The latter is a zero-argument Bool
which calls the actual Option-returning arithmetic root on eleven explicit
oracle cases, matches Some bits, and returns false on None. Cases include zero
signs, one/two, subnormal/seam rounding, a signaling NaN payload, infinities and
operation-specific invalid inputs. No target arithmetic is handwritten.

`inputs.json` independently binds the three unchanged kernel files, prior typed
source ID `453dc1bd8c46c374bbd40745d3204be62cc972ba4ae0971f66b997fbf625153d`,
original game `prism/prismpm.lock`, and every fixture file copied from exact
PrismPM `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec` native-library fixture.
`scripts/numeric/canonical/packages.py` stages regular independent copies into
four new disposable projects; existing destinations and changed fixture/kernel
bytes are refused. Bounds, Float, Wide and metadata are all entrypoints; the
Foundation model and governed `prism.arch` language tree are included. Generated
Lean/Rust remain outputs. No four drifting arithmetic copies are committed.

Normal `lexlean lock`, `fmt`, `lock`, `fmt --check`, `lock --check` prepare each
new project. Freeze then binds its complete source/config/lock file set and
refuses any kernel rewrite. Build and verify invoke the absolute separately
rebuilt PrismPM binary with `--exporter-source numeric-task2c`. Selection requires
matching exact JSON build/attestation IDs, manifest/content/source identities,
new artifact hashes, native-only schema/scope, byte-identical regeneration,
std/no_std acceptance, both actual exporter owner phases and fixed candidate
archive/compiler/descriptor/SDK-lock receipts. No result is chosen by mtime.

The workflow `.github/workflows/numeric-canonical-packages.yml` has narrow
`numeric-kernels` push paths plus manual dispatch. It restores the reviewed
snapshot using the existing snapshot restorer, pulls d6 **only on the hosted
runner**, builds the verifier once, and runs all four packages under UID1000,
original SDK entrypoint/PATH/inventory, bounded tmpfs and the prior reviewed
shared host/container permission pattern. Original SDK executable/inventory,
source archive, game lock and verifier hashes are rechecked on exit. Every
per-package phase records success/failure/not-run; host container and tee exit
statuses are captured separately without masking the original failure.

A dedicated four-project collector preserves full result-selected build and
verified trees, generated/verified source closure, original source/config/locks,
child receipts, modeled acceptance and replay material. It excludes Cargo/Lake
caches. Reader archives are limited to 256 MiB raw / 31 MiB compressed, with an
explicit complete-reader-inputs/incomplete label. Independent small diagnostics
retain every log tail with original digest/size and explicit truncation labels;
all uploads name fixed archive/status files, avoiding private UID directory
globs. The host recollects after final pipeline statuses exist.

`scripts/numeric/canonical/replay.py` is wired after all four actual verifications.
It reselects and hashes the actual newly emitted packages, inspects their exact
raw `Option<u32/u64>` signatures, refuses unreviewed signature changes, and builds
the separately retained direct-Option status ABI. It runs the unchanged exact
44,648-vector oracle, native host IEEE cross-check, import-free Wasm replay,
wrong-result adapter mutation and explicit None-to-status-2 fixture with prior
result preservation. Emitted kernels are never edited. This ABI evidence does
not create native-library Holo qualification.

## Measured locally

The local tools are isolated components, **not an installed SDK identity**.
Exact commands and identity bindings are in
`canonical-packaging-local-evidence.json`; detailed raw files remain under
`/workspace/diagnostic-tools/` and are not published CI artifacts.

All four final staged projects in
`/workspace/diagnostic-tools/canonical-packaging-frozen/` passed normal isolated
LexLean lock/fmt/lock-check/check/build and input freeze/check. Each build contains
all five authored modules, including Bounds. These are LexLean construction and
link diagnostics, not full source proof verification or Prism CLI acceptance.

| Operation | New local package LexLean source ID |
| --- | --- |
| mul32 | `9741ba5f633e2b8a2a259c3879e8e103be4d0caa3b77445a190004ce7d5d63ee` |
| mul64 | `ed5d08572f47dacf1dcad7317ba3ded2c29f069e7de8bb72d87c35965cfaff59` |
| div32 | `e43b1c1ec380383e48958ab37d0008d9f9390639af95cda4d1d687e542005dd9` |
| div64 | `373096c25214c5abdaf92b39f320568c3e871a158788e48b76190a1d4538c052` |

The separately bound combined arithmetic-plus-acceptance component probe passed
Lake compilation, the actual canonical compiler's repeated sorted `--root`
arguments, and the unchanged registered Rust generator for all four operations.
Requested/included roots were inspected, external-call coverage was empty, and
last-component closure names were unique. Raw generated signatures remained
plain Option. Probe: `/workspace/diagnostic-tools/probe-canonical-packaging-runtime.py`;
outputs: `/workspace/diagnostic-tools/canonical-packaging-combined-runtime-scope/`.
This fast probe **omitted the erased-proof Bounds module** from its compilation
and extraction module arguments. Actual staged projects and SDK orchestration
retain Bounds and its normal proof/runtime closure.

Those exact new combined component outputs passed native **44,648** and import-free
Wasm **44,648** replay, std/no_std finite acceptance, the wrong-result comparator
control, and explicit None-as-status-2 Wasm control. Their generated source
hashes were unchanged before/after. Evidence:
`/workspace/diagnostic-tools/canonical-packaging-component-replay/manifest.json`.
These packages were emitted by the component generator driver, not by governed
Prism CLI package creation. They do not satisfy exact actual CLI output replay.

Host checks:

```sh
PRISMPM_SOURCE=/workspace/scratch/prismpm-numeric python3 scripts/numeric/canonical/test_packages.py -v
python3 -m py_compile scripts/numeric/canonical/{packages,replay,test_packages}.py
bash -n scripts/numeric/canonical/sdk-run.sh
node --check scripts/numeric/canonical/replay.mjs
```

Seven host tests pass: deterministic actual pinned-fixture staging, real metadata
roots/Option acceptance, frozen source/file-set/symlink refusal, exact result
selection despite a newer unrelated directory, changed bundle bytes, changed
manifest identity, rebound wrong root/archive/child/source refusal, four-project
retention completeness/statuses and cache exclusion. Receipt fixtures in these
host tests are synthetic. These are **harness refusals**, not compiler refusal,
modeled finite-acceptance failure or actual Prism bundle-reader refusal. Workflow
YAML also parses successfully.

## Retained concrete failure

The fresh complete-generated-runtime component attempt for mul32 hit its original
**300-second** bound while compiling generated `LexLeanRuntime.Laws`. Status/log:
`/workspace/diagnostic-tools/canonical-packaging-combined-v3/{results.json,mul32/build.log,stopped-scope.json}`.
The active child was Lean itself:
`lean -j2 .../Laws.lean -o .../Laws.olean -i .../Laws.ilean -c .../Laws.c --setup ... --json`.
No external C compiler was active. At stop, `.olean` (334208 bytes),
`.olean.private` (2970920), `.ilean` (144414), and `.ir` (1026976) existed, while
`Laws.c` was empty. Elaboration artifacts had been emitted; Lean was still
performing native generation/emission. These files alone do not identify the
exact internal stalled subphase. The timeout remained a failure. Duplicate full
runtime attempts were stopped; the already-started mul64 attempt was terminated,
and div32/div64 full-runtime attempts were not run. Owned orphaned Lean children
were explicitly cleaned up.

Actual `library_build` stages the imported runtime closure and calls normal
`lake build PrismGenerated`; `lean_project::configuration` uses default library
facets with `moreLeanArgs = ["-j2"]`, which also requests Lean C emission. Thus
this local bottleneck may affect the real SDK gate. No facet substitution,
guard/timeout change or bypass was made. The real hosted SDK run must decide.
Local free disk remained approximately 21 GiB, above the 8 GiB floor.

## Pending before production

1. Full applicable upstream source VV is parent-owned and was pending when this
   checkpoint was prepared. No successful full-VV claim is imported here.
2. Actual unchanged-d6 Prism CLI build **and verify** of all four frozen projects,
   newly emitted package/archive identities, complete source proof/axiom and
   erased-proof audit, actual child/custody receipts, exact regeneration and
   std/no_std acceptance have not run here. Existing original d6/B1 success and
   earlier arithmetic-only packages are separate evidence.
3. Native/Wasm full corpus and mutation controls must pass on the **actual CLI
   output** selected by this workflow; local component success is insufficient.
4. Independent actual bundle-reader changed-source/root/archive/child/output
   negative controls are not implemented by the host unit-test fixtures and
   remain a separate required follow-up gate. Valid changed source need not fail
   generic Prism verification; distinguish frozen-input harness refusal,
   compiler refusal, finite acceptance failure and real reader refusal.
5. Text/1 comparison, persistent status-preserving Task3 adapter custody, rendering
   integration and production admission remain outside this native-library
   preparation checkpoint. Existing `app.holo` is untouched.

Parent can review this concrete checkpoint, publish the owned commit, and let
the narrow workflow run. Failed SDK gates must retain their original evidence
and be resolved without changing SDK pins, source arithmetic, guards or timeouts.

## Review round 1 retention fix

Independent review of implementation `d7e2ac9` identified one P2: command-level
replay compiler/native/Wasm/mutation logs and their status JSON were inside the
primary reader archive but absent from the independent small archive. If the
primary archive was refused at its bound, only the top-level replay traceback
would survive. The focused regression reproduced this loss before the fix.

The small collector now additionally takes direct `replay/*.log` and
`replay/*.status.json` command diagnostics. It applies the same bounded-tail,
original-size/SHA256 and explicit-truncation accounting as other small logs.
Replay binaries, rlibs and nested caches remain outside the small archive.
The focused control plants an original failing rustc log and argv/exit-status
JSON, forces each primary raw/compressed bound to refuse publication, then
checks that the fallback archive still contains the exact retained diagnostic
tail and complete status, with correct size/digest/truncation metadata and no
Wasm, rlib or target-cache files.

Validation on parent base `924627d`:

```sh
python3 scripts/numeric/canonical/test_packages.py HarnessTests.test_replay_failure_fallback_survives_primary_archive_refusal -v
PRISMPM_SOURCE=/workspace/scratch/prismpm-numeric python3 scripts/numeric/canonical/test_packages.py -v
python3 -m py_compile scripts/numeric/canonical/{packages,test_packages}.py
git diff --check
```

The focused control passes for both bounds, the full **eight-test** host suite
passes, Python compilation and whitespace checks pass. This fix changes only
fallback evidence retention and its tests; no arithmetic, pins, gates, guards,
timeouts or generated code changed. Actual SDK and production claims above
remain pending and parent-owned.
