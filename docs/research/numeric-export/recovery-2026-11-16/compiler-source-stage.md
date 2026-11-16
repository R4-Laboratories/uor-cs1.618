# Task 2c compiler source-stage recovery notes

Recorded 2026-11-16 after the execution environment reset. This is a reconstruction
from the implementation agent's retained conversation context, not a recovered
source patch, test log, build receipt, or new validation result. The restored game
checkout was observed at `b4676b780304bed5ac9a4a042e5a63822a806042` when this note
was written. No compiler implementation was reconstructed while writing it.

## Recovery status and evidence limits

The authoritative isolated upstream checkout, its unpushed candidate commit, the
cached SDK, private Prism source copy, diagnostic binaries, and local Task 2c logs
were absent after the reset. The original candidate commit has **not been
recovered**. Its historically observed identities were:

| Item | Historical identity |
| --- | --- |
| Upstream base | `991956fe427bb646498fd0912c89b71be71e7beb` |
| Candidate commit | `4eb4ff4b1fbc878e3f278565c8323bc5410812f3` |
| Candidate tree | `7a395e1b67784fac014ad1e7faa8aadc2e408cf6` |
| Local branch | `numeric-export-repair` |
| Original game task base | `8a26b962f2363f4d08976146577f61fbd9474dc1` |

The candidate was committed locally after the source checks described below.
There was no upstream push or PR. The source-stage completion report had not yet
been written. The former private `task-2c-report.md` was an older interim report
about the launcher-custody blocker and must not be treated as current completion.

Immediately before reset, a command attempted to retain a binary git diff, base
and candidate Lean archives, and `source-stage/identities.json` under the game's
ignored `artifacts/numeric-task2c/` directory. Its output was not received before
context compaction. The patch/archive hashes and base-archive member equality
result are therefore unknown. No exact replacement patch can be recovered from
this note. A reconstruction must be a **new candidate**, with a fresh commit,
fresh checks, and fresh custody evidence. Historical test outcomes below are
recollection of observed executions; the logs themselves are lost.

## Historical environment identities

| Item | Historical identity |
| --- | --- |
| Pinned SDK digest | `d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c` |
| SDK Prism revision | `3666dc0f9da56fcf066d96ec01cd9e14ec9a2974` |
| Lean | 4.32.1, commit `f054605aea4b840552cca2e725580bffd1e1b704` |
| Rust | rustc 1.97.1, revision prefix `8bab26f4f` |
| SDK inventory SHA-256 | `0d4fe1864891ab1220a752d929a5a3a334f5987e0518a97f83f06fb5bdad105f` |
| Seed manifest SHA-256 | `5ad69a24139104bd268a70b2124384a9266903550fe6909804abb6c8c32b9431` |
| Original compiler archive SHA-256 | `7a1a716a57040ea2307f7a34e895a75ebdca7438cf9d5d0364007acb594366bf` |
| Original seed prod-export SHA-256 | `b0081437c68a576ea0b19805568e8ac8c418cf5b7b366d7881b02f38dbaf77ed` |
| Original seed prod-export size | 226,949,656 bytes |

The old SDK reference source was `/workspace/cs1.618/artifacts/proof-toolchain/source`.
The diagnostic copy was `artifacts/numeric-task2c/prism-source`. Neither path is
authority merely because it used to exist. The game verifier backport script
records the independently authorized replay-input patch; it must be consulted
again rather than inferring its revision from the ambient game checkout.

## Root cause and hypotheses already tested

The investigation followed systematic debugging: retain a small actual canonical
failure, inspect pinned compiler lowering, then test narrowly scoped hypotheses.
The ordinary named `repeat4` helper was opportunistically inlined into a
specialized residual form that the exporter rejected. A conversion control
retained generic `Fixed` dictionary structure in reachable type discovery.

Three helper-inlining approaches were tried, in this order:

1. `d.simp { inlineDefs := false }` solved a diagnostic with explicit generated
   matches, but ordinary `do`/`Option.bind` code retained an escaping local
   closure. This global-disable approach was abandoned.
2. Locally saving modified `noinline` declaration metadata did not override the
   imported extension lookup. `repeat4` still produced the specialized external
   form. This approach was reverted.
3. Setting the pinned option `compiler.small` to zero only around named
   extraction disabled opportunistic tiny-helper inlining while preserving
   explicit inlining such as `Option.bind`. Small helper and conversion controls
   passed with this approach.

Do not repeat the first two approaches without new evidence. No specialization
name whitelist was introduced. Inspection also found a signed Int16
specialization with a physical UInt16 signature while its signed implementation
remained semantically relevant. Recognizing operations from a monomorphized
signature alone is therefore unsafe.

## Historical source change design

The committed candidate reportedly changed 13 files, with 493 inserted and 15
deleted lines. This is a map for reconstruction, not exact source content.

### Named extraction scope

`lean/Prod/Extract.lean` wrapped only the named extraction `CompilerM.run` in:

```lean
withOptions (·.set `compiler.small (0 : Nat))
```

Tagged/example extraction was unchanged. Explicit inlining was retained; generic
closures were not admitted.

### Checked-conversion normalization

New `lean/Prod/Conversion.lean` validated canonical `checkedConvert` dictionaries
before normalizing the call and eliminating its dictionary graph. The important
constraints were:

- Reconstruct only closed dictionary constants and projections; reject unsafe or
  partial definitions. Do not treat dictionary type checking as optional.
- Use Meta definitional equality to validate source integer interpretation:
  signed built-in `toInt`, unsigned built-in `toNat` followed by `Int.ofNat`, or
  the applicable Int identity. Retaining the identity case did not make generic
  mathematical Int admissible to code generation.
- Validate the target's exact minimum, maximum, and `ofInt` semantics for the
  supported built-in signed/unsigned 8/16/32/64-bit types. The finite mapping was
  a type/range mapping, not a whitelist of instance or specialization names.
- Validate the actual source operand type and exact `Option` target result type.
  Track types through parameters, lets, cases, and function values; test malformed
  LCNF operand/result types explicitly.
- Track dictionary IDs actually consumed by a validated conversion. Remove that
  graph only when backward free-variable liveness shows it has no other use;
  propagate liveness through projections. Keep a dictionary that escapes or
  otherwise remains live, allowing the existing unsupported-type gate to reject
  it. Do not delete arbitrary unused computations.
- Avoid partial name-string extraction (`getString!`-style assumptions).

`lean/Prod/Export.lean` applied this normalization once, before both type discovery
and body lowering. It retained unsupported type declarations and returned an
additional unsupported-type result with the IR and reports. Named coverage's
`unsupported_types` field reflected the actual retained declarations instead of
being hardcoded empty. `lean/Prod/Emit.lean` adjusted tuple unpacking accordingly.

The local semantic argument was recorded in
`specs/designs/numeric-conversion-normalization.md`: definitional equality for
recognized closed dictionaries and liveness-limited erasure preserve the local
operation and failure behavior. It was not a universal compiler-correctness
proof, and did not prove total root success or admit generic closures.

### Fixtures and generated artifacts

New upstream fixtures were:

- `lean/Conformance/NumericClosureFixture.lean`
- `lean/Conformance/NumericClosure.lean`
- `lean/Conformance/NumericConversion.lean`
- `rust/prod-codegen/tests/fixtures/numeric_generated_test.rs`
- `scripts/check-numeric-conversion.sh`

The Rust fixture was an oracle/replay harness calling compiler-generated code,
not a replacement implementation. Native `main` was conditionally compiled to
avoid Wasm warnings. The `justfile` added a `numeric-conversion` CI gate.

`fixtures/lexlean-1.1/expected/kernel.ir` and `generated.rs` were regenerated by
the exporter/code generator; their reviewed changes were temporary identifiers.
They were not hand-edited. The default `lean/Conformance/golden.ir` and generated
`specs/lean-for-production.md` were observed byte-unchanged.

## Historical test matrix and outcomes

All outcomes in this section are historical recollection, **not currently
reproducible evidence**. Their former log paths identify what fresh runs must
replace.

`upstream-final-source-validation.log` was observed successful and covered:

- Ordinary UInt32 `repeat4`, renamed Int16 `signedTwice`, and `Option.bind`.
- UInt32→UInt64, UInt16→Int64, Int64→Int16, Int16→UInt32, UInt64→Int64 conversions,
  including a renamed canonical closed dictionary outside the root namespace.
- Separate mutations of source interpretation, target minimum, target maximum,
  and target `fromInt`, each rejected as noncanonical.
- A still-live generic dictionary rejected, with `Fixed` present in unsupported
  type coverage; no general dictionary or closure escape hatch.
- Wrong actual source operand and result types in mutated LCNF rejected.
- An otherwise unused Nat `MAX64 + 1` operation inserted in fixture LCNF and
  retained in emitted `output/numeric/unused-failure.ir`. Generated native and
  Wasm execution returned `ComputeError::AddOverflow`; normalization did not
  erase a failing unused computation.
- Named first-order `countedLoop` recursion with a concrete `Counter` record,
  captured delta, Option state/failure, and an outer fuel≤128 guard. Native/Wasm
  boundaries included fuel 0, 1, 4, 127, 128; 129 refused; capture values 0, 1,
  and 3 and failure propagation were exercised.
- `lake build ProofFixtures PrismPMGeneratedFixture`, default `prod-export`,
  subset regeneration, root checking (three roots, nonempty dependencies, no
  cycles), and Cargo formatting. Generated default outputs were checked unchanged.

`upstream-final-affected-gates.log` was observed successful after final type
validation changes. It ran `check-generated-fixtures.sh`, the Node owned
accumulator provenance check, `check-named-export.sh`,
`check-portable-package.sh`, `check-specialized-index.sh`,
`check-scalar-length.sh`, `check-typed-decimal.sh`, `check-shared-decidable.sh`,
and `check-owned-accumulator.sh`. These retained unknown, unsafe, partial,
escaping-closure, mathematical-Int/no-array refusals and prior specialization
mutation matrices. No existing rejection gate was weakened.

`upstream-workspace-no-fail-fast.log` ran the full Cargo workspace, including
suites after the earlier abort. Exactly the `prod-codegen --test sdk_fixtures`
target failed, in three wrapper cases:

| Case | Observed limitation |
| --- | --- |
| `hygiene::hygienic_kotlin_wrapper_executes_loader_contract` | `kotlinc` unavailable |
| `hygiene::hygienic_typescript_wrapper_executes_loader_contract` | `tsc` unavailable |
| `hygiene::hygienic_wasm_bindgen_wrapper_executes_real_guest` | Test-generated package required exact wasm-bindgen 0.2.122, absent offline |

The main unchanged lock used wasm-bindgen 0.2.126 and was staged successfully.
Tests were not skipped or relabeled as successes. There was no full-suite pass
claim. Release-assertions, clippy, full Wasm workspace checking, and remaining
view/core-Wasm/UOR CI gates had not been run. Existing unused-proof-variable
warnings were observed; they were not evidence of new fixture correctness.

Earlier retained logs included the deliberately red helper/conversion tests and
failed inlining hypotheses. Initial existing named/portable gate failures from
missing PATH tools were followed by successful final runs; the old failures
were retained rather than deleted.

## Historical canonical launcher custody work

A private test appended to the copied Prism exporter exercised the actual
`acquire_for_owned`, `lean_project::stage_runtime`/configuration,
`before_first_build`, `after_build`, and `run_export_with_custody` path. It did
not substitute a bare exporter invocation for canonical acquisition. It checked
original generated module/runtime bytes and `.olean`, `.olean.server`,
`.olean.private`, and `.ir` companions.

The initial released SDK acquisition rejected the flattened local cache with
PP5008 because required ownership/mode metadata was wrong. The controller
approved a narrowly scoped metadata-only repair after reviewing the exact path
list and preconditions: 15,522 paths examined, 15,521 needing root ownership;
`lchown`-equivalent no-follow ownership changes and clearing write bits on the
inventory only. SDK content bytes were not written. Inventory and seed hashes
were observed unchanged. That historical approval does not license guessing
metadata in a newly restored SDK; inspect its actual state first.

The unchanged canonical launcher then completed the expected red reproduction
in 44.71 seconds: `repeat4` rejected, `convertUInt64` retained the generic `Fixed`
residue and failed the codegen boundary, and `nested4` passed. The diagnostic
test itself passed because those outcomes matched its assertions.

The lost diagnostic binary's historically observed SHA-256 was
`e763b81d755d1be5121ed3c858932564e80a76fc526439fd0e50a5b35b45c19e`, size
208,865,888 bytes. It was compressed before its disposable Cargo target was
removed. The probe source SHA-256 was
`84704183733d37b4167f2f51c973e006bf9146d26f9d10680d1bc2ad0a9de061`;
the private appended exporter source SHA-256 was
`ac3f47c0368d319e8f38a040d9c2a7e8ddf99801a3853dec041cdf6ea17e0511`.

The candidate upstream exporter later accepted the **same original generated
application module/companion bytes** for
`BoundedNumeric.Alternatives.convertInt64`, `convertUInt64`, `nested4`, and
`repeat4`. Compiler-generated Rust passed native and import-free Wasm exact
boundary replay (`generated-source-green.log` and
`generated-source-native-wasm.log`). This was a source diagnostic, not admission
through a new canonical source-backport acquisition mode.

No application Lean/Rust was hand-edited. Some disposable build caches were
removed under controller authorization before the reset. An attempted extra
cache-file inventory write failed on permissions before deletion; do not invent
that missing inventory as retained evidence.

## Historical test dependency staging

No new SDK version or dependency pin was used. Five archives absent from the
SDK cache were fetched from static.crates.io, about 220 KiB total, and checked
against the unchanged upstream Cargo.lock:

| Crate | SHA-256 |
| --- | --- |
| bitflags 2.11.1 | `c4512299f36f043ab09a583e57bceb5a5aab7a73db1805848e8fef3c9e8c78b3` |
| wasm-bindgen 0.2.126 | `4b067c0c11094aef6b7a801c1e34a26affafdf3d051dba08456b868789aaf9a4` |
| wasm-bindgen-macro 0.2.126 | `167ce5e579f6bcf889c4f7175a8a5a585de84e8ff93976ce393efa5f2837aab1` |
| wasm-bindgen-macro-support 0.2.126 | `f3997c7839262f4ef12cf90b818d6340c18e80f263f1a94bf157d0ec4420380e` |
| wasm-bindgen-shared 0.2.126 | `dc1b4cb0cc549fcf58d7dfc081778139b3d283a081644e833e84682ad71cea24` |

The lost `scripts/numeric/stage-locked-crates.py` verified lock checksums,
bounded archive members, rejected unsafe paths/symlinks, and built a private
Cargo directory source with per-file/package checksum manifests. Shared SDK
Cargo content was not modified. Test builds used `--locked --offline`, a private
`CARGO_HOME`, disabled dev/test debug information and incremental compilation,
and the pinned SDK compiler/linker.

The SDK-bundled Lean toolchain `bin` directory was appended to PATH to expose
its clang. A separately identified test-only host ripgrep was also appended:
15.2.0 revision `e89fff89ac`, PCRE2 10.45, SHA-256
`e62198eb19b136b88c330af83647b5a962cb99b6b1f066758568f12de1974849`.
This was not a substitute Lean/Rust toolchain. Fresh runs must record their own
actual tools and checksums rather than reusing these identities as receipts.

## Remaining work and preserved design boundaries

Neither the explicit source-backport acquisition mode nor the shared numeric
source adaptation had been implemented. No Task 2c game implementation commit
was created by this agent. The preexisting four raw kernels' 44,648-vector
work was not repeated while their source remained unchanged.

The controller approved designing an explicit, separately registered
source-backport mode. The released path must keep its existing lock/seed/archive
mismatch refusal, inventory checks, and default semantics. Do not drop or
legacy-convert the consumer lock, fabricate metadata, mutate an archive by hand,
reuse the released seed as though it contains changed compiler source, or claim
upstream merge/release. Stable compiled source identity must be separate from
outer receipts binding the resulting binaries to avoid a self-hash fixed point.

Independent receipt reconnaissance, also lost locally, identified these restart
points (line numbers were historical and must be rechecked):

- `exporter.rs`: explicit source-only acquisition variant, with before/after
  build custody, independently requiring valid current lock/2 and native SDK
  inventory equality. Released `sdk-seed` gates stay unchanged.
- `owner.rs` near lines 79/215: exact cold-receipt comparisons govern permitted
  first-build source growth; the explicit source-only backport mode must use the
  same controlled semantics, not bypass ownership checks.
- Proposed compiled descriptor `vendor/lean4-prod/source-backport.json`, outside
  `lean.tar`, as a sixth artifact under the existing lean4-prod dependency.
  Include upstream base/candidate commit/tree and patch/archive identities; omit
  its own hash, dependency-register hash, verifier hash, and resulting binaries.
- Receipt fields proposed: schema, mode, descriptor SHA-256, SDK lock SHA-256,
  inventory SHA-256, platform. Actual exporter child identity belongs in the
  existing outer execution/identity records; verifier identity is external.
- `release_verification.rs`: compiled archive equality, platform authority, and
  application exporter sidecar/replay equality all need explicit consistent
  handling. Do not weaken these checks globally.
- Add the variant to the current manifest-v2 reader/schema, including recursively
  reused owner-process definitions. Preserve historical manifest-v1 semantics.
- SDK release qualification helpers deliberately accept only released cold or
  sdk-seed paths; keep them release-only unless adding a distinct explicit
  backport qualification entry point.
- `sdk/inventory-metadata.mjs` rejects arbitrary extra compiler-dependency row
  fields; `xtask` expects exactly four dependency IDs and vendor-prefixed
  artifact paths. Register the descriptor under the existing dependency rather
  than casually adding a row or metadata field.
- Update exact dependency artifact tests deliberately. Bind the descriptor into
  generator/input framing, since a new include-bytes input is not automatically
  part of existing controller framing.

The controller separately authorized an eventual Int16 internal exponent/count
adaptation with checked operations and explicit narrowed private helper
contracts. Analytical reachable bounds were −3117..4092 and root round amounts
0..1078; these were not new proved theorems. Preserve full UInt64×UInt64→four
UInt32 limbs, length 0..128, negative Wide.round behavior/refusal including
minimum-value negation, and public raw ABI. A proposed full-domain Int16 less
comparison is checked subtraction: use the difference sign if successful;
on signed overflow use the left operand's sign. Boundary tests must cover every
sign combination, equal values, min/max, and both overflow directions. No
unchecked wrapping is authorized.

The supported LexLean recursion shape from reconnaissance was a named function
with `fuel : Nat`, outermost `Nat.zero`/`Nat.succ remaining` match, recursive call
on `remaining`, and `recursive_argument: fuel`; use a prior named step and a
concrete record, without lambdas or function parameters. Literal fuel should be
tested first. Upstream compiler-owned Lean loop tests did not by themselves
prove the full shared LexLean source's canonical admission.

Wait for the controller's exact SDK/source restoration status before restarting
implementation. Recovered historical source, if found, must be verified by git
object identity; otherwise reconstruct a new candidate and rerun the necessary
source, custody, negative, native, and Wasm checks. Task 2c remains open through
full canonical roots; full game Text/1 packaging/rendering belongs to Task 3.
