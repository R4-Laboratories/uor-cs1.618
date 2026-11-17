# Bounded authored-source theorem feasibility investigation

2026-11-17. Follow-up to `canonical-theorem-audit-diagnosis.md`. No production source, index, HEAD, dependency pin, SDK, compiler, library policy, or Lean/Rust generated artifact was changed. Disposable work is under `/workspace/diagnostic-tools/canonical-theorem-source-feasibility`. The controller explicitly permitted `lexlean build` **source emission only** in this disposable project, followed by direct pinned Lean checking. No Cargo, Lake, Docker, compiler rebuild, or installed-SDK gate ran.

**Result:** the existing pinned source forms were tested concretely, but this bounded investigation did not find an authored-source-only constructive proof route for the generic Nat monotonicity/transitivity/cancellation helpers needed by Bounds. The tests establish precise local grammar/linker/backend obstacles, not global impossibility of every source encoding. Simple authored generic equalities, prior-theorem application, cases, and induction do work and have empty observed axioms. Keep the native-library empty-theorem policy and current verification rejection; there is no ready production proof patch from these probes.

## Original identities and limits

The existing standalone LexLean binary is `/workspace/diagnostic-tools/lexlean-target/release/lexlean`, SHA-256 `3765ef724d19a4d08681aaa0123ff637e65c1ffcc0b8d02ae268b521b5cf2c94`. Its previously recorded identity (`original-lexlean-identity.json`) binds source dependency revision `e0b74b81e6f49c83596a957d232c8383a5db1a25`, package manifest hash `dd35c1b0359c90c5896c5188c9e10bb4008883cb21ee92d35bc2fd4c8d4ac759`, and Cargo.lock hash `008618c60e0ee0da9f33fd63f6d2d7c0d053a8d980de1a0315d85e308a7d1151`. It was reused, not rebuilt. Each diagnostic lock reports language `1.2` and compiler semantics `1427f8b629013648a480454d67202788f2303f5396f1d7c70a7c350ddab6f694`, matching the original retained language-1.2 lock. The CLI's unselected `--version` reports language 1.0/default semantics; the project lock is the selected-language identity.

Direct Lean was `/workspace/diagnostic-tools/elan/toolchains/leanprover--lean4---v4.32.1/bin/lean`, original SHA-256 `e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550`. All generated proofs import only its existing Init oleans. No generated companion was compiled to disk. The copied original `lakefile.toml`, `lake-manifest.json`, and `lean-toolchain` bytes were retained only for normal lock bindings; no handwritten lakefile was introduced or Lake invoked.

Disk checks before and after showed 11 GiB free (above the required 8 GiB). Original project resource limits were copied into the disposable configuration. Individual diagnostic subprocesses had 20-second external bounds (the initial setup sequence allowed 30 seconds); the only timeout was one 20-second structural-simplification experiment, recorded as a failure. There was no timeout increase or repeated omega experiment.

## Authored probes and actual outcomes

All probe source files are `<case>/src/Helpers.lex.tex`. Successful compiler emission is preserved exactly under `<case>/.lexlean/build/<build-id>/modules/Feasibility/Helpers.lean`, with the accompanying original manifest/coverage/maps/lexicon closure. `audit.lean` is a diagnostic copy of those exact bytes followed only by `#print axioms` commands. Failed elaborations' `sorryAx` output is **not** a successful proof and cannot pass an audit.

| Case | Actual result | What it establishes |
| --- | --- | --- |
| `positive` | lock/check/build exit 0; pinned Lean exit 0 | Authored reflexivity, application of a prior document theorem, Nat cases, and Nat induction can produce axiom-free generic equalities. |
| `inequalities` | lock/check/build exit 0; pinned Lean exit 1 | Generic monotonicity, transitivity, and cancellation expressed with the existing induction/constructor/congruence forms leave implication goals unsolved; decide does not solve the open reflexivity-of-order goal. |
| `local-apply` | check exit 1, LLT4001 | `apply{theorem: ih, arguments: []}` cannot use an induction hypothesis: “proof application names a forward or missing theorem `ih`.” |
| `imported-apply` | check exit 1, LLT4001 | `apply{theorem: Nat.le_refl, arguments: [n]}` cannot call that external Lean theorem: it is a “forward or missing theorem.” |
| `proof-parameter` | check exit 1, LLP2001 | A parameter `h : (a <= b)` is not a supported semantic parameter type: “expected a name, found `<=`.” |
| `empty-constructor` | check exit 1, LLT4001 | `constructor{branches: []}` is rejected: “constructor proof requires branches.” |

The positive source contains four theorems: `addZeroRight`, `copiedZeroRight` (using `apply` on the earlier theorem), `casesEquality`, and `inductionEquality`. The last two prove `n = n` with the corresponding structural source form, providing a control for the proof transport; they do not establish an arithmetic induction step that consumes its hypothesis. Pinned Lean printed no axioms for all four. Exact positive output:

```text
'Feasibility.Helpers.addZeroRight' does not depend on any axioms
'Feasibility.Helpers.copiedZeroRight' does not depend on any axioms
'Feasibility.Helpers.casesEquality' does not depend on any axioms
'Feasibility.Helpers.inductionEquality' does not depend on any axioms
```

The actual generic inequalities attempted were:

```text
monotone:    a <= b -> a + c <= b + c
transitive:  a <= b -> b <= c -> a <= c
cancellation: a + c < b + c -> a < b
```

For monotonicity, induction on `c` generates the expected zero/successor branches and an induction hypothesis `a <= b -> a + k <= b + k`. `constructor` cannot introduce the remaining implication: Lean reports “target is not an inductive datatype” in both branches. Transitivity's direct constructor attempt has the same obstruction. Cancellation's `congruence{}` emits `congr 1` and leaves both the zero and successor implication goals unsolved. `decide{}` for generic `a <= a` fails with “Expected type must not contain free variables”; the diagnostic does not silently use Lean's suggested `+revert` option, which is absent from this fixed source proof form.

Two initial structural probes are also retained honestly. In `structural`, induction for `0 + n = n` using only `simplify{definitions: [ih]}` reaches Lean but `simp` makes no progress; a nonempty constructor branch for `n <= n` yields “No goals to be solved” because Lean's constructor already closed the goal. The file exits 1, despite its separate `addZeroRight` and selfLe declarations printing empty axioms. A raw tactic-semantics exploratory file also failed and is diagnostic only.

A refined `equalities` source supplied a reflexive addition-successor helper and used it with the induction hypothesis in simplify. Its lock/check/build succeeded, but the direct Lean audit hit the 20-second bound. The initial Python runner stopped with `TimeoutExpired` before retaining partial stream bytes; `equalities/timeout.json` records this limitation and the exact command. The emitted source and compiler outputs are retained. It was not rerun and no explanation such as an infinite simplifier loop is asserted without evidence. That timeout is not evidence of language-wide impossibility.

The first disposable config omitted the required `limits` table and lock failed LLC0101. It was corrected by copying the original limits, with that failed setup command retained in `structural-commands.json`; this incidental setup failure does not explain the later proof failures.

## Precise capability gap

The relevant implementation was checked against immutable source324, and exact files/hashes are retained in `source324/` and `source-identities.json`.

- `vendor/lexlean/src/ir/semantic.rs:689–758` defines the closed proof-form enum. There is no general implication-introduction/local-proof application form or arbitrary exact Lean term. The proof-valued parameter syntax attempted above is also outside the semantic type grammar.
- At `semantic.rs:8320` and following, `Apply` resolves `env.proof_rules`, containing prior document theorem declarations. It does not resolve the local `ih` as a proof rule or import arbitrary `Nat.*` theorem names. This explains the two actual LLT4001 failures. The positive prior-document apply control confirms the restriction's intended working case.
- At `semantic.rs:8468` and following, Constructor requires a nonempty branch list. `backend/semantic.rs:1240` emits `constructor` followed by a bullet for every branch. That combination cannot represent the successful zero-subgoal `Nat.le.refl` constructor tactic as attempted here. It also does not add implication introduction.
- The induction/cases checker at `semantic.rs:8663–8755` recognizes Nat zero/succ branches and records induction hypotheses as local Prop entries. Simplify is allowed to name these local hypotheses; this is a real existing escape from “no access at all,” but it does not make `apply ih` legal or provide the natural-deduction operations needed by the constructive witnesses. The tested simplify routes failed or timed out and are not a completed alternative.
- `backend/semantic.rs:1260` and following emits the structural tactics directly; `congruence` is fixed `congr 1`; `apply` emits exact application of its checked prior document reference. No hidden intro/exact-hypothesis behavior repairs the emitted implication goals.
- The existing `law` registry contains the three list-fold laws only, not Nat order monotonicity/transitivity/cancellation. Arbitrary external Lean theorem references are intentionally not the public source language.

The **smallest capability gap identified for the demonstrated constructive route** is checked natural-deduction plumbing: introducing implication hypotheses, referring/applying local proof hypotheses (including induction hypotheses), and constructing the required Nat order proof steps through a closed, typed mechanism. Empty constructor-branch support fixes one concrete endpoint but alone does not supply monotonicity/transitivity/cancellation. Adding only external theorem-name access also leaves hypothesis introduction/composition unresolved and would unnecessarily expand the authority surface.

A separately designed bounded proof certificate or a small typed proof-form extension could supply those operations and emit ordinary axiom-free Nat proof terms. That is a proposed design direction, not an implemented feature or a claim about the unique minimal patch. It should target the five original Bounds propositions and generic helper laws, not recognize package/theorem names or replace their statements. The prior report already contains successful constructive Lean witnesses, so further omega controls or mathematical proof searches are unnecessary.

## Governance before any compiler backport

The existing native-library contract is explicit: `SPEC.md:2870–2876` requires empty theorem axioms for the complete selected source audit. Preserve that contract. There is no basis here for a theorem allow-list, namespace exemption, changing theorems into definitions, omitting Bounds, or skipping proof closure.

The formal-source boundary at `SPEC.md:59–66` requires authored `.lex.tex`, forbids handwritten production Lean/tactics/raw payloads, and names immutable dependencies in `model/dependencies.toml`. The original LexLean entry is version `0.4.0`, revision `e0b74b81e6f49c83596a957d232c8383a5db1a25`, tree-manifest hash `dd35c1b0359c90c5896c5188c9e10bb4008883cb21ee92d35bc2fd4c8d4ac759`, and original crate hash `f2d579289052493d2c68274b10015d2cce544a78fbb876d73062184f09fb0a18`. `SPEC.md:1154–1179` independently admits the exact registered archive/tree and narrowly enumerated dependency-owned Lean authority; merely resealing a changed tree is insufficient.

Consequently, modifying the shipped proof enum/emitter/registry while retaining the original archive identity would violate existing provenance. A legitimate backport requires a separately authorized, immutable identity and an explicit compatibility/admission design, retaining the original base archive/revision rather than forging its identity. The controller must decide how that new compiler capability is represented and admitted under source/profile/language governance before implementation. New compiler-semantics identity, exact patch/source bytes, tool identity, lock/snapshot/build/attestation bindings, and applicable language/version/profile rules must follow the real change. A new proof syntax cannot silently claim unchanged compiler semantics. The original Lean 4.32.1, SDK/toolchain, Rust, and exporter pins are not evidence of or authorization for modifying LexLean; no such pin or contract change is made here.

Any authorized implementation must have actual authored-source positive tests for all five unchanged Bounds statements with empty observed axioms; rejection controls for malformed proof references, wrong hypotheses, invalid certificates/steps, altered statements, and nonempty theorem dependencies; regenerated manifests and full source/proof/erased-proof closure; and the original all-four SDK, independent export/regeneration, std/no_std, full VV/goldens/corpus and total-budget gates. A local constructive witness or new tool hash alone is not admission.

## Evidence and stopping point

Exact commands and exits are recorded per case in `commands.json`; the small runner scripts retain the source creation/command recipe. The principal command forms were:

```text
<original lexlean> --project <disposable>/lexlean.toml --diagnostic-format json lock
<original lexlean> --project <disposable>/lexlean.toml --diagnostic-format json check --all
<original lexlean> --project <disposable>/lexlean.toml --diagnostic-format json build --all
<original lean> -j2 <disposable>/audit.lean
```

Compiler env was exactly `LANG=C`, `LC_ALL=C`, `PATH=/usr/bin:/bin`; Lean env was exactly `LANG=C`, `LC_ALL=C`, `LEAN_NUM_THREADS=2`. All cwd values were disposable diagnostic paths. Original emitted bytes are unmodified; only separate diagnostic copies append axiom-print commands. `evidence-index.json` records retained file hashes. The positive Lean audit exited 0 in about 0.275 seconds; the inequality audit exited 1 in about 0.343 seconds. Each failed source-link test exited 1 in under a second. The equality timeout remains explicitly distinct from those failures.

The bounded investigation stops here. It supplies concrete source-language/compiler evidence for the missing constructive route and successful transport controls, without claiming a global expressibility impossibility, a completed Bounds repair, or SDK acceptance.
