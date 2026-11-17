# Canonical acceptance axiom diagnosis — hosted run 44030198670

2026-11-17. Read-only diagnostic of the retained source324/gameab9 run. No source, SDK, compiler, policy, generated production Lean/Rust, lockfile, index, or HEAD was changed. Only temporary diagnostic inputs/results and this report were written. This is a root-cause diagnosis and repair recommendation, not SDK or production admission.

**Verdict:** the hosted rejection is correct. The packaging generator creates a new `acceptance : Bool` declaration without an axiom policy, even though its calls to the existing numeric roots transitively depend on exactly `Quot.sound` and `propext`. Those existing roots already declare precisely that exact set. The omission is in acceptance metadata generation, not an unexpected new dependency introduced by the native frontend. The smallest supported repair is an explicit exact policy on that generated source declaration alone. No blanket policy relaxation is justified.

## Original failure and source path

Let `R` be `/workspace/scratch/cs-numeric-kernels/artifacts/numeric-task2c/ci-44030198670/numeric-canonical-reader-inputs-44030198670/extracted`.

All four retained `R/operations/{mul32,mul64,div32,div64}/verify-result.json` files contain `PP5001` caused by `LLV7005`: ``BoundedNumeric.NumericPackage.acceptance` violates its none axiom policy: observed [Quot.sound, propext]`. The four successful canonical build phases do not imply successful verification; these failures remain failures. They are preserved in the diagnostic input index, not relabeled by this investigation.

The immutable generator is `R/reader-source/packages.py:68–88`, specifically line 84. `metadata(d)` creates finite calls to `Float::<operation>`, compares each `Option.some` result with a desired bit pattern using `prim equal`, treats `Option.none` as false, and joins checks using `&&`. Its emitted declaration is:

```text
definition{name: acceptance, parameters: [], result: Bool, body: ...}
```

It omits `axioms`. The retained authored `projects/<op>/src/NumericPackage.lex.tex` contains that omission, and its generated `lexlean/build/modules/BoundedNumeric/NumericPackage.lean:12` calls `BoundedNumeric.Float.<op>` exactly as intended. Its imports include `Init`, `LexLeanRuntime.Portable`, `BoundedNumeric.Float`, and the native-library model. Importing a module alone does not contaminate every declaration: the metadata-only `numericLibrary` remains axiom-free.

Each retained `projects/<op>/.prism/build/*/lexlean/snapshot.json` records:

| Declaration | Published policy |
| --- | --- |
| `BoundedNumeric.NumericPackage.acceptance` | `{"kind":"none","axioms":[]}` |
| `BoundedNumeric.NumericPackage.numericLibrary` | `{"kind":"none","axioms":[]}` |
| `BoundedNumeric.Float.<op>` | `{"kind":"exact","axioms":["Quot.sound","propext"]}` |

These policies agree with the authored kernels. In the original game `prism/numeric/src/Float.lex.tex`, the `mul32`, `div32`, `mul64`, and `div64` declarations explicitly contain `axioms: [Quot.sound, propext]` at lines 75, 150, 218, and 287 respectively. `Wide` conversions and arithmetic similarly declare that exact dependency. No inherited module policy fills in acceptance's missing field.

The retained `lexlean.toml` pins `leanprover/lean4:v4.32.1`, language 1.2, and the original 300000 ms child limit and 16777216-byte child-output limit. It provides no global axiom override. The source verifier `vendor/lexlean/src/verify/mod.rs:1975` audits declarations against their policies. `vendor/lexlean/src/ir/declaration.rs:49–90` implements none as empty and exact as equality of the canonical observed set. The failure is the intended enforcement of those rules.

## Independently confirmed transitive dependency

The real pinned Lean diagnostic confirms all four acceptance roots depend on exactly `[propext, Quot.sound]` (Lean's printed ordering; the SDK canonical ordering is `[Quot.sound, propext]`). Every inspected Float definition and Wide definition has the same pair. All four `numericLibrary` definitions have no axioms.

A concrete path, confirmed from explicit printed definitions and pinned source, is:

```text
NumericPackage.acceptance
  -> Float.mul32 (other three roots have the same observed pair)
  -> Wide.convertUInt32ToUInt64 / other checked arithmetic and bit operations
  -> checkedConvert instantiated with instFixedUInt32 and instFixedUInt64
  -> instFixedUInt64's UInt64.land field
  -> BitVec.and
  -> Nat.and_lt_two_pow
  -> Nat.lt_pow_two_of_testBit / Nat.testBit_and and their proof dependencies
  -> {propext, Quot.sound}
```

`trace.stdout` prints `Wide.convertUInt32ToUInt64` with the explicit concrete dictionaries:

```lean
@LexLeanRuntime.checkedConvert UInt32 UInt64
  (@LexLeanRuntime.Fixed.toToMathInt UInt32 LexLeanRuntime.instFixedUInt32)
  LexLeanRuntime.instFixedUInt64 value
```

It also prints `Wide.int16Add` using `instFixedInt16` and `Wide.unsignedLess` using `instFixedUInt64`. The printed `instFixedUInt64` includes UInt64 conversion, bounds, bitwise operations, and shifts. The axiom collector follows the whole dictionary declaration, including fields that a particular call need not execute. The pinned `Lean/Util/CollectAxioms.lean:53–64` recursively collects constants from definition and theorem types and values, and uses precomputed dependency entries for imported declarations. It does not normalize this dictionary away before measuring dependencies.

The original toolchain sources give the next exact edges: `Init/Data/UInt/Basic.lean:635` implements `UInt64.land` through underlying BitVec `&&&`; `Init/Data/BitVec/Basic.lean:506` implements `BitVec.and` with the bound proof `Nat.and_lt_two_pow`; `Init/Data/Nat/Bitwise/Lemmas.lean:523` proves that bound using `Nat.lt_pow_two_of_testBit` and `Nat.testBit_and`. The successful `confirmed-path.stdout` independently reports both axioms for each of these named declarations. This establishes a concrete path into the standard-library proof closure; it does not claim a unique path or a minimal individual theorem proof derivation.

The generic `LexLeanRuntime.equal`, `checkedConvert`, `checkedFromInt`, checked arithmetic, and bit/shift wrapper definitions themselves are axiom-free before concrete instance specialization. Successful temporary concrete wrappers for UInt32 and UInt64 equality are also axiom-free, as is `Bool.and`. Therefore the dependencies are inherent to this existing pinned implementation's declaration closure, not to the Bool type, the finite comparison logic, or an automatically universal mathematical claim. The generator mistake is failing to declare the closure on its new acceptance wrapper. Erasure from generated runtime code would not remove the required Lean source/proof audit.

## Exact diagnostic execution and limits

Evidence is in `/workspace/diagnostic-tools/canonical-axiom-diagnosis/`. `result.json`, `trace-result.json`, `instances-result.json`, and `confirmed-path-result.json` record exact argv, environment, cwd, exits, output hashes, and available timing. The `.lean`, `.stdout`, and `.stderr` files retain the commands and their actual outputs. `input-index.json` records the four original failures/policies, retained source/snapshot/frozen-input hashes, and 178 existing diagnostic input-file identities (including compiled companions).

Executable: `/workspace/diagnostic-tools/elan/toolchains/leanprover--lean4---v4.32.1/bin/lean`, SHA-256 `e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550`. Each subprocess used argv `[that executable, "-j2", absolute diagnostic .lean path]`, cwd the diagnostic directory, and exactly `LANG=C`, `LC_ALL=C`, `LEAN_NUM_THREADS=2`, and `LEAN_PATH=<existing olean root>`. There were no `-o`, `-i`, or `-c` output requests, no Lake/build/pull commands, and no policy modifications. The initial four diagnostics had a combined 60-second bound (about 9.015 seconds actual); the later individual probes had 20-second bounds.

Existing olean roots were:

| Diagnostic | Existing root before `/.lake/build/lib/lean` | Result |
| --- | --- | --- |
| mul32 | `/workspace/diagnostic-tools/laws-investigation/no-c` | exit 1: two guessed `UInt32.beq`/`UInt64.beq` names were invalid; acceptance result printed successfully |
| mul64 | `/workspace/diagnostic-tools/canonical-packaging-combined-v3/mul64/lean-work` | exit 0 |
| div32 | `/workspace/diagnostic-tools/canonical-packaging-combined-v2/div32/lean-work` | exit 0 |
| div64 | `/workspace/diagnostic-tools/canonical-packaging-combined-v2/div64/lean-work` | exit 0 |
| trace | mul32 root | exit 0; explicit dictionary/definition trace and acceptance result |
| instances | mul32 root | exit 1: guessed unqualified `instBEqUInt32`/`instBEqUInt64` names invalid; reported instance/bitwise results printed successfully |
| confirmed-path | mul32 root | exit 0, 1.089 seconds; concrete equality controls, acceptance, instances, and exact standard-library path |

The exploratory exit-1 probes are not passing tests. The final successful probe establishes the relevant conclusions without those invalid names. The exact final command was:

```text
/workspace/diagnostic-tools/elan/toolchains/leanprover--lean4---v4.32.1/bin/lean -j2 /workspace/diagnostic-tools/canonical-axiom-diagnosis/confirmed-path.lean
```

Its `LEAN_PATH` was `/workspace/diagnostic-tools/laws-investigation/no-c/.lake/build/lib/lean`. Final stdout SHA-256 is `60a5001376f9e4dd2bd3a6288cfda64a1cc0e9abdae33c486617548f9dc121f6`; stderr was empty. Its relevant output is:

```text
'diagnosticEqual32' does not depend on any axioms
'diagnosticEqual64' does not depend on any axioms
'Bool.and' does not depend on any axioms
'BoundedNumeric.NumericPackage.acceptance' depends on axioms: [propext, Quot.sound]
'LexLeanRuntime.instFixedUInt32' depends on axioms: [propext, Quot.sound]
'LexLeanRuntime.instFixedUInt64' depends on axioms: [propext, Quot.sound]
'LexLeanRuntime.instFixedInt16' depends on axioms: [propext, Quot.sound]
'UInt64.land' depends on axioms: [propext, Quot.sound]
'BitVec.and' depends on axioms: [propext, Quot.sound]
'Nat.and_lt_two_pow' depends on axioms: [propext, Quot.sound]
'Nat.lt_pow_two_of_testBit' depends on axioms: [propext, Quot.sound]
'Nat.testBit_and' depends on axioms: [propext, Quot.sound]
```

The generated NumericPackage, Float, Wide, and native-library Model Lean source bytes alongside these existing oleans were compared with the retained hosted generated sources and match; their exact hashes are in `result.json`. Existing compiled companions are diagnostic inputs, not retained hosted compiled artifacts or a fresh derivation from the matched sources. This limitation matters: the actual hosted failure is the authority for the failing SDK run, while local compiled diagnostics explain its independently matching dependency set. No new installed-SDK verification or full source gate ran here.

## Smallest valid repair and required follow-through

Change only the authored acceptance declaration emitted by `metadata(d)` to include the existing exact source syntax:

```text
definition{name: acceptance, parameters: [], result: Bool, axioms: [Quot.sound, propext], body: ...}
```

The spelling and order match the existing Float/Wide declarations and their retained exact policies. Nonempty `axioms` is exact, not an allow-list; omission means none. Existing semantic-policy tests in `vendor/lexlean/src/ir/semantic.rs:9850–9883` likewise demonstrate omitted none and nonempty exact. Keep `numericLibrary` none and preserve all existing kernel/proof policies, SDK/toolchain/Lean/Rust/LexLean/archive pins, guards, bounds, total stage budgets, runtime authority, independent exports, and closure checks. Do not modify emitted Lean/Rust or use an axiom exemption to make the run pass. The finite acceptance Bool still expresses only its original finite cases, not a proof of universal IEEE correctness.

Regenerate all four staged NumericPackage sources and their normal frozen-input manifests from the corrected generator. Obtain fresh original-tool source/semantic snapshots, model/build identities, audit attestations, native-library source/model bindings, receipts, and evidence archives through the actual pipeline; never edit old evidence or transplant the new policy into the old snapshot. Recompute the frozen reader-source identity because the generator bytes change. Preserve source compiler pins; this recommendation does not require a compiler change. Policy metadata may leave some generated executable Lean/Rust bytes unchanged, so measure resulting plan/module/artifact hashes rather than inventing a rule that all must change. Every receipt must nevertheless bind its actual regenerated source, model, and plan. Keep the old run as failed historical evidence.

`R/reader-source/packages.py:371–395`, `audit_bindings`, already handles this exact policy. It matches attestation source/semantic/build IDs, requires the complete nonruntime declaration/erased-proof audit closure, compares each nonruntime row's policy to its source snapshot, then compares observed axioms with that exact published list. Runtime rows remain exact. No change to this audit is needed to accommodate a correctly regenerated acceptance policy.

Required focused verification before accepting the repair: assert that all four generated acceptance declarations have exactly the two-name policy and unchanged bodies/cases, that numericLibrary remains none, and that kernel inputs and their policies are unchanged; run the original LexLean formatter/parser/check and actual SDK build/verify path for all four regenerated packages; confirm the final declaration audits show precisely the expected pair for acceptance, no axioms for numericLibrary, and complete original proof/runtime closure. Keep negative checks for omitted/incorrect acceptance policies and altered observed sets or policy/source bindings. Exercise `audit_bindings` on genuine newly verified receipts, including a policy/observed mismatch rejection. Retain independent exports, regeneration checks, std/no_std execution, and failure evidence.

The new actual SDK run, full source VV, goldens/corpus and remaining controller-owned admission gates are still required. This diagnosis neither executes nor waives them, and it cannot establish that no later failure will surface once the current valid rejection is repaired.
