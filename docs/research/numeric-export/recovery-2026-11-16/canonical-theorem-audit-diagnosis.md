# Canonical native-library theorem audit diagnosis

2026-11-17. Hosted run `44039536691`, game `8b90`, source `324955b6923c1d194d7bc870a2d2a05eb687048c`. Read-only diagnosis; no implementation, source/index/HEAD mutation, policy adjustment, SDK rebuild, Docker execution, or re-probe of acceptance Bool metadata.

**Ruling:** PP5003 is enforcing the existing native-library contract correctly. All five selected `BoundedNumeric.Bounds` theorems have nonempty axiom dependencies. Each of the five unchanged mathematical statements admits an axiom-free proof in original Lean 4.32.1, independently demonstrated below. Therefore a nonempty-theorem profile extension is not mathematically required. However, this investigation does **not** establish a ready authored-LexLean-only repair under the pinned closed proof language. The constructive Lean witnesses must not be inserted as handwritten production Lean. Keep the rejection and empty-theorem requirement while resolving that source-expression gap; do not replace it with an allow-list or skip.

## Retained evidence and complete relevant inventory

Let `R` be `/workspace/scratch/cs-numeric-kernels/artifacts/numeric-task2c/ci-44039536691/numeric-canonical-reader-inputs-44039536691/extracted`. All four `R/operations/<op>/verify-result.json` records report PP5003, message `library theorem has a nonempty axiom audit`. All builds passing is compatible with this: building makes no verification admission claim. The earlier acceptance LLV7005 is resolved, but that does not imply the stricter library audit passes.

I enumerated **every** declaration with `kind == "theorem"` in every retained `projects/<op>/.prism/build/*/lexlean/snapshot.json`, including imported source modules. Each of mul32, mul64, div32, and div64 contains exactly these five, and no other source theorems:

| Fully qualified theorem | Authored source line | Declared exact set | Independent observed set |
| --- | --- | --- | --- |
| `BoundedNumeric.Bounds.limbAddBound` | `src/Bounds.lex.tex:5` | Quot.sound, propext | Quot.sound, propext |
| `BoundedNumeric.Bounds.cellAddBound` | `src/Bounds.lex.tex:13` | Quot.sound, propext | Quot.sound, propext |
| `BoundedNumeric.Bounds.divDoubleRemainderBound` | `src/Bounds.lex.tex:21` | Quot.sound, propext | Quot.sound, propext |
| `BoundedNumeric.Bounds.divReducedRemainderBound` | `src/Bounds.lex.tex:29` | Quot.sound, propext | Quot.sound, propext |
| `BoundedNumeric.Bounds.divQuotientStepBound` | `src/Bounds.lex.tex:37` | Quot.sound, propext | Quot.sound, propext |

All five source declarations use `proof: linear_arithmetic{}`. Repairing just one would leave four equivalent blockers. The audit is over the complete selected source snapshot, so removing Bounds from exports would not cure this; removing it from the selected source is prohibited and would discard requested proofs.

The runtime path is different and must remain distinct. In source324 `crates/prismpm/src/library_verification.rs:111–120`, source declarations obtain their theorem flag from the snapshot, while recognized runtime declarations obtain their exact pinned runtime policy and `theorem = false`. Thus imported `LexLeanRuntime` laws are audited as complete, pinned runtime modules, but do not trigger this particular source-theorem-empty condition. All selected/imported **source** theorem rows are exhausted by the table; the runtime branch is not an additional unaddressed theorem-empty blocker. This is the validator's current classification, not permission to reclassify Bounds as runtime.

There is no retained `lexlean/attestation/*` JSON object in the extracted reader-input tree (checked parsed `spec` and `schema`, not merely filename). The actual hosted error is authoritative evidence that the empty-theorem guard fired, but does not name the first row. The exact five dependency sets above are independently confirmed using matching existing compiled diagnostic modules, not claimed as recovered hosted attestation rows. Snapshot ordering starts with `cellAddBound`; without the actual audit ordering, this report does not assert which theorem was first rejected. `theorem-inventory.json` preserves all four inventories and source hashes.

## Validator versus normative contract

The immutable source was read using `git show 324955b6923c1d194d7bc870a2d2a05eb687048c:<path>`. Relevant files were saved under `/workspace/diagnostic-tools/canonical-theorem-audit-diagnosis/source324/`; their hashes and confirmation that the inspected live bytes match are in `source-evidence.json`.

`SPEC.md:2870–2876` says native-library verification requires “the complete selected LexLean declaration audit, including imported namespaces, exact source axiom policies and empty theorem axioms, plus generated Lean elaboration and kernel replay.” The broader Prism theorem policy at `SPEC.md:846–850` also distinguishes empty theorem axioms from executable definitions' individually declared policies.

`library_verification.rs:127–153` first requires each audit's result and policy to match the source, parses canonical observed/permitted names, then rejects `theorem && !actual.is_empty()` with this exact PP5003. This is an additional library-profile constraint beyond LexLean's per-declaration exact-policy acceptance. A theorem can legitimately pass LexLean's declared two-axiom policy and still fail the native-library profile. The implementation matches the explicit normative library wording, including non-Prism imported source namespaces. Narrowing the condition to `PrismPM.*`, allowing the pair for all theorems, or merely trusting `result: ok` would weaken the current library contract.

## Cause and constructive feasibility

The generated `BoundedNumeric/Bounds.lean` has theorem declarations at lines 10, 17, 24, 31, and 38. Each proof introduces hypotheses, runs fixed simplifications, splits, and invokes `omega`. This comes directly from source324 `vendor/lexlean/src/backend/semantic.rs:1432–1480`, the fixed `linear_arithmetic` lowering.

A bounded control proved the **same five propositions** using only `by omega`, importing `Init` and omitting the generated runtime-law import and every preprocessing simplifier. All five still depend on `[propext, Quot.sound]`. Thus removing the broad simplifier list or the runtime-law import does not solve these proofs. The pinned omega proof output itself is sufficient to introduce the rejected pair. This control does not claim every omega theorem must have that pair.

A second bounded control used only constructive Nat lemmas and definitional arithmetic. All five succeeded and printed **no axioms**. The actual proof terms, retained in `constructive.lean`, are short:

- `limbAddBound`: `Nat.add_le_add (Nat.add_le_add ha hb) hc`.
- `cellAddBound`: the same nested monotonicity with its original three hypotheses and numerical bounds.
- `divDoubleRemainderBound`: derive `r <= 9007199254740991` with `Nat.le_trans (Nat.le_of_lt hr) hd`, then add it to itself.
- `divReducedRemainderBound`: substitute `r + r = reduced + d` into `Nat.add_lt_add_left hr r` to obtain `reduced + d < r + d`; cancel the right addend with `Nat.lt_of_add_lt_add_right`, then use `Nat.lt_trans` with `r < d`.
- `divQuotientStepBound`: `Nat.add_le_add (Nat.add_le_add hq hq) (Nat.le_refl 1)`.

The temporary Lean theorem hypotheses are curried binders for the same implications in the retained statements. The statements, constants, and quantification are unchanged. No finite-case replacement or weaker proposition was used. The Nat monotonicity, transitivity, cancellation, and associativity lemmas inspected separately also print no axioms. These witnesses establish mathematical feasibility under the original Lean, not a production source artifact or accepted SDK result.

## Pinned source expressibility and repair options

The distinction between an axiom-free Lean proof and a valid pinned LexLean source proof is material here. Source324 `vendor/lexlean/src/ir/semantic.rs:689–758` has a closed proof-form enum. It contains reflexivity, decide, linear_arithmetic, simplify, constructor, cases, term_cases, induction, congruence, fixed boolean_reflection, law, and apply. It has no general raw Lean `exact` proof term or arbitrary tactic script.

The straightforward transcription of the witnesses is unavailable through `apply`: `check_proof` at lines 8320 onward accepts only prior **document** theorem references. Writing `apply` against `Nat.add_le_add` does not make it a declared source theorem. `law` is restricted to the shipped registry, whose entries are only `list_fold_fusion`, `list_fold_pair`, and `list_fold_append`; it does not register these Nat lemmas. `simplify` checks prior document definitions/theorems or the three fixed Boolean/Nat equality bridges, and would not provide arbitrary imported Nat theorem access. The fixed Boolean reflection forms concern their registered list/record validation relations, not these unchanged general arithmetic propositions.

Accordingly, simply changing `proof` to an arbitrary `exact` block, removing `axioms`, or importing handwritten Lean is not a valid repair. Removing the two-name policies without replacing the proof terms would just restore an LLV7005 rejection earlier in verification.

**Preferred option:** retain the empty-theorem native-library contract and all five original propositions; develop and verify an axiom-free proof expressed through supported authored source forms. A source-only construction using helper declarations/structural proofs has not been demonstrated here. The closed forms and missing direct Nat-lemma access explain the gap, but are not a formal proof that every possible combination of existing source forms is incapable. This report must not be used to assert such an impossibility or to claim a source-only fix already exists.

**If that source-expression route cannot be established within the existing pins and budgets:** the next proposed work should be a separately reviewed, bounded constructive proof-generation capability that emits these ordinary kernel-checked Nat proof terms from authored source. It must preserve the native-library empty-theorem requirement, original statements, source/proof audit, regeneration, and resource guards. Such a compiler/proof-language change is **not authorized by this diagnosis**, is not a game-only edit, and must be reconciled with the original LexLean/compiler identity and pin constraints before implementation. The temporary hand-authored Lean witnesses are tests/specimens only, never production files or generated-output patches.

**Nonempty-theorem profile extension:** this would be a genuine governed contract change, not a bug fix to the present validator. It is not required by the mathematics and is not justified merely because the current convenience proof form uses omega. It would require explicit owner authorization and revised normative profile/evidence semantics; none is granted here. Do not implement an exception, blanket pair allow-list, namespace trick, theorem-to-definition relabeling, omitted Bounds module, or skipped proof audit.

The minimum legitimate final proof repair must cover all five rows, regenerate their source policies to none/empty to match genuinely empty observed dependencies, and preserve the computational Float/Wide policies and the already reviewed acceptance metadata. Existing strict SDK verification, complete imported-source/runtime audits, erased-proof closure, two independent exports, regeneration, std/no_std execution, original total stage budget, and remaining full source VV/goldens/corpus gates remain mandatory.

## Commands, results, and limits

All diagnostics are under `/workspace/diagnostic-tools/canonical-theorem-audit-diagnosis`. Exact argv, environment, cwd, exit, and timing are recorded in the three `*-result.json` files, with full `.lean`, `.stdout`, and `.stderr` files. Each command was:

```text
/workspace/diagnostic-tools/elan/toolchains/leanprover--lean4---v4.32.1/bin/lean -j2 <absolute diagnostic .lean path>
```

The executable is the original 4.32.1 binary (SHA-256 `e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550`). Cwd was the diagnostic directory. Environment was exactly `LANG=C`, `LC_ALL=C`, `LEAN_NUM_THREADS=2`, and, for `trace.lean` only, `LEAN_PATH=/workspace/diagnostic-tools/laws-investigation/no-c/.lake/build/lib/lean`. Each run had a 30-second bound, exited 0 in under a few seconds, and requested no emitted `.olean`, `.ilean`, or C file. No Lake, package build, pull, installed SDK verification, or policy edit ran.

| File | Result |
| --- | --- |
| `trace.lean` | Five original Bounds roots: exact pair. Named Nat lemmas: no axioms. Existing Bounds source byte-for-byte matches retained hosted generated source. |
| `omega-only.lean` | Five unchanged propositions, only omega: exact pair for all five. |
| `constructive.lean` | Five unchanged propositions, constructive proofs: no axioms for all five. |

Existing `Bounds.olean` and companions are older diagnostic inputs, not retained hosted compiled artifacts; source-byte equality does not turn them into fresh SDK proof custody. In contrast, the two local control files were actually checked by pinned Lean using its existing Init oleans during this diagnosis. They demonstrate proof behavior and feasibility only. `source-evidence.json` records immutable source identities and the absence of a retained full LexLean attestation; `theorem-inventory.json` records complete selected source theorem inventories. The evidence index hashes the diagnostic inputs and results.

No repaired source package or new admission evidence has been produced. The exact proof-source implementation path remains an explicit unresolved prerequisite, while the five offending propositions, their dependency sets, the normative rejection, and axiom-free mathematical feasibility are established.
