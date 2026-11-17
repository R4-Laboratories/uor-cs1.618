# Draft: bounded constructive Nat proof compiler backport

2026-11-17. **Design prerequisite only.** The controller permits planning an additive, explicitly identified diagnostic LexLean source backport. Implementation and effective compiler selection remain blocked until the amendment and independent builder review accept this design. No code, proof search, build, production source, pin or policy was changed to prepare this draft.

This draft uses the existing `linear_arithmetic{}` source form and the original five Bounds propositions. It introduces a closed constructive lowering in a separately identified compiler, not a general prover or new handwritten Lean authority. Original/default Engine, installed SDK/inventory, Lean 4.32.1, Rust, guest and exporter pins remain original. Empty source-theorem axioms remain mandatory.

## 1. Scope and exact dispatch

The candidate supports language 1.2 theorems whose existing proof node is `LinearArithmetic`, whose declared policy is empty, and whose proposition is in the fragment below. It emits a constructive proof or a bounded explicit failure. It never falls back to omega for that case. Other proof forms and nonempty-policy `linear_arithmetic` declarations use the unchanged base lowering inside the candidate. The released compiler remains entirely unchanged. This policy-dependent dispatch is part of the candidate's normative proof-lowering semantics, not an axiom exemption.

No recognition of module/theorem names, specific numeric constants, source hashes, package identity, or desired test answers is permitted. All parameters are alpha-indexed by their checked binder positions. A theorem has its original full curried implication statement, even when a proof does not use every hypothesis. No weaker replacement theorem, finite-case substitute, source omission, or theorem-to-definition conversion is allowed.

Supported atoms are `A <= B`, `A < B`, and `A = B`, where A/B are Nat variables, nonnegative Nat literals, or additions of supported terms. The conclusion is a non-strict upper bound by a literal, or a strict inequality handled by the cancellation recipe below. The theorem may have an ordered prefix of supported atomic hypotheses. All parameters must be Nat; no multiplication node, subtraction, division, fixed-width value, Boolean comparison, quantifier below an atom, disjunction, user-defined call or implicit unfolding is admitted in this first fragment. `LinearArithmetic.definitions` must be empty. Unsupported shapes fail with a registered candidate diagnostic before proof emission.

## 2. Internal certificate and kernel proof rules

Normalize each additive term to a nonnegative coefficient vector over binder indices plus a Nat constant. Normalization is an **equality with a proof**, not an unchecked replacement of the original expression. Canonical rendering uses variable indices in ascending order, repeated addition, and one final constant; do not emit multiplication and assume a semiring tactic. The normalizer records a deterministic sequence of associativity, commutativity, zero and numeral-reduction steps. Only approved axiom-free Init lemma applications, congruence and equality elimination may implement those steps. The exact lemma calls must be confirmed in the implementation tests; no `simp`, `omega`, `native_decide`, classical choice or `propext` invocation is permitted in this new lowering.

A certificate is a topologically ordered DAG. Nodes contain a closed opcode, input-node indices, and explicit normalized terms; all indices must refer strictly backward. A separate small checker recomputes every conclusion from its premises and compares the final conclusion with the original theorem after checked normalization. The checker validates types, binder scope, hypothesis identity and all numeric computations. The synthesizer cannot supply a trusted claimed conclusion.

| Rule | Required premises and conclusion | Lean realization |
| --- | --- | --- |
| Hyp | Exact atom at a declared hypothesis index | Named implication binder, introduced in source order. |
| ReflLE / ReflEQ | `A <= A` / `A = A` | Nat reflexivity / Eq reflexivity. |
| LiteralLE | Closed literals m,n with m <= n | Kernel-checked closed decidable proof; no native computation oracle. |
| WeakenLT | `A < B` gives `A <= B` | `Nat.le_of_lt`. |
| TransLE | `A <= B`, `B <= C` give `A <= C` | `Nat.le_trans`. |
| AddLE | `A <= B`, `C <= D` give `A+C <= B+D` | `Nat.add_le_add`. |
| AddLTLE | `A < B`, `C <= D` give `A+C < B+D` | Add the same C to the strict premise, then use monotonicity and `Nat.lt_of_lt_of_le`. |
| EqSymm / EqTrans / NormalizeEQ | Checked ordinary equalities | Eq symmetry/transitivity, associativity/commutativity/zero lemmas, congruence and literal reduction. |
| RewriteSide | An equality exactly matches a whole relation side, after checked normalization | Equality elimination/transport, never proposition extensionality. |
| CancelLT | `A+C < B+C` gives `A < B` | `Nat.lt_of_add_lt_add_right`, after proven regrouping. |

Only these inference rules exist in the first certificate version. In particular there is no arbitrary theorem-name node, arbitrary Lean payload, assumed lemma, or “solver succeeded” node. Constant and coefficient arithmetic in Rust uses checked bounded integers; overflow rejects. Lean's elaboration and `leanchecker` then independently check the emitted proof term, and the ordinary axiom collector must observe the empty set. The internal checker improves determinism and catches synthesizer defects; it is not a replacement trusted proof kernel.

## 3. Two deterministic synthesis recipes

There is no unrestricted saturation loop.

**Recipe A: additive upper bounds.** Apply only when the goal is `T <= N` for a literal N. Extract from hypotheses directed edges `x <= y`, weakened `x < y`, and terminal bounds `x <= K` or weakened `x < K`, where x/y are single variables and K is a literal. For each variable occurring in T, enumerate reachable variables/terminal bounds by bounded BFS. Select the smallest reachable numeric upper bound; ties use shortest path, then lexicographic hypothesis-index sequence. Cycles are visited once. Compose the selected path with WeakenLT/TransLE. Recursively follow T's original addition tree, using ReflLE for literals and AddLE for sums. This yields `T <= M`. If M <= N, finish with LiteralLE and TransLE; otherwise this recipe fails. Unused hypotheses remain binders of the original proposition.

**Recipe B: bounded scaling, equality transport and cancellation.** Apply to a strict goal. Enumerate strict hypotheses in source order, scale factors k = 1..16, equality hypotheses in source order, their two orientations, and left/right side choices in fixed order. Scale a strict premise `A < B` to `kA < kB` using repeated AddLTLE with its weakened copy; k is an algorithm bound, never a theorem-specific constant. Try the scaled relation directly, or exactly one whole-side RewriteSide using an input equality. Normalize; remove the maximal common nonnegative coefficient vector and common constant from both sides, prove the regrouping, and apply CancelLT. Succeed only if the resulting normalized relation equals the normalized goal. No guessed equality or repeated arbitrary substitution is allowed. First success in that order wins. If none succeeds within the caps, reject.

The certificates for the original five statements follow these generic recipes:

- `limbAddBound` and `cellAddBound`: Recipe A combines the three literal upper bounds with AddLE. Their original target constants equal the resulting sums.
- `divDoubleRemainderBound`: Recipe A weakens `r < d`, follows `d <= N`, then adds the derived `r <= N` to itself.
- `divQuotientStepBound`: Recipe A uses the same q bound twice and literal reflexivity for 1.
- `divReducedRemainderBound`: Recipe B scales `r < d` by 2 to `r+r < d+d`, rewrites its left side using `r+r = reduced+d`, then cancels the common d to obtain `reduced < d`.

These are symbolic derivations, not newly executed proof tests. The previous diagnosis already checked constructive witnesses for all five unchanged statements in original Lean. This proposed generator still needs actual authored-source and negative tests.

## 4. Fixed finite bounds

Proposed normative candidate limits are: 32 Nat parameters, 64 atomic hypotheses, 1,024 input term nodes, 128-bit unsigned literals and computed constants, coefficient at most 4,096, scale factor at most 16, 8,192 Recipe-B candidates, 16,384 certificate DAG nodes, and 1 MiB emitted proof text per theorem. Canonical additive expansion also has a 4,096-leaf cap; normalizer proof steps consume the same certificate-node budget. Every attempted candidate and normalization operation is charged before work/allocation. No unbounded search, bigint growth or unchecked list multiplication is allowed.

Recipe A processes at most 32 variable vertices and the 64 input edges/terminal bounds per starting variable; its path nodes share the certificate budget. Recipe B stops at the candidate cap even if its finite enumeration is not exhausted. Exhaustion is a named failure, not a larger timeout or alternate prover. The original request/stage deadline and source/output limits remain controlling and cumulative across modules and theorems; per-theorem caps do not restart or multiply the original 300-second stage budget. These constants are design limits to validate, not measured performance claims; widening one requires review.

## 5. Packaging without new handwritten Lean authority

Commit only an additive diagnostic source descriptor, a bounded patch/overlay, its source-tree membership recipe, and tests. Keep `vendor/lexlean`, its 0.4.0 crate, MANIFEST and VCS metadata pristine. The overlay may change reviewed Rust compiler files, Cargo package naming, and the narrowly listed normative data/version files. It must reject modifications/additions to any `.lean`, `lakefile.lean`, runtime payload, original four compiler-authority files, or unrelated dependency content.

A preparation tool extracts the **registered original archive** into a new private owned build directory, verifies complete membership/modes/bytes against the original authority, applies the exact registered overlay, and verifies the resulting complete derived-tree digest. The original four Lean authority files may exist there only as byte-identical runtime copies from the admitted base archive. They are not committed as a second source authority and no new Lean exception is introduced. The source audit must explicitly validate this derivation; merely hiding files under ignored `target/` is not admission.

For concrete Cargo integration, materialize a fixed diagnostic package path such as `target/diagnostic-compiler-sources/lexlean-constructive-v1` before Cargo metadata/build. The path is build material, not the authority; descriptor and complete derived-tree checks authorize its bytes. Use a distinct local package identity, proposed `lexlean-constructive-diagnostic` version `0.4.0-constructive.1`, linked under the dependency alias `lexlean_candidate`. This is explicitly a local diagnostic version, not an upstream release. The original `lexlean` dependency remains untouched. New path-package entries in Cargo metadata/lock are an additive, reviewed change; original dependency versions/checksums must remain identical.

The acquisition owner must retain a stable handle to the owned source root, validate every admitted member and no extras before and after the actual offline Rust build, record real build commands/results, and measure both resulting candidate PrismPM and candidate preparation executables. Symlink/hardlink/foreign-node changes or source mutation fail. Materialization is required before commands that resolve Cargo dependencies; a missing materialization fails explicitly. Cleanup may remove only owned derived inputs after their build evidence is retained. This additional preparation lifecycle must be part of source VV and the candidate harness, not an undocumented developer step.

## 6. Original/default versus candidate linked Engine

Use **two compiled packages**, not a mutable backend hook inside the released Engine. The original package continues to provide all existing public DTO types and the released implementation. The candidate package has the same authored syntax/DTO wire schema but its own fixed lowering and identity. Both use the original pinned Lean for elaboration/replay.

Introduce a closed controller authority enum with Released as the default and one registered diagnostic member (proposed ID `constructive-nat-v1`). A proposed `--proof-compiler-source` option is valid only for diagnostic native-library build/verify; unknown IDs, paths, URLs, environment overrides and unregistered libraries fail. It is separate from `--exporter-source`. Selection is frozen into the controller/model-worker plan before Engine load and retained through every nested build, model check and fresh verification load. The candidate path must reject application/system/ordinary non-library models before building or verifying them. It cannot silently switch to Released on failure.

A private Engine façade dispatches Released directly to the original `lexlean::Engine`, with no DTO conversion or extra output in that branch. Candidate dispatches to `lexlean_candidate::Engine`. Candidate snapshot bytes are validated against the unchanged canonical snapshot schema, deserialized into the original stable `SemanticSnapshot` DTO, then serialized again and required to equal the original canonical bytes exactly. This is feasible at the public boundary because `artifact/snapshot.rs:16` derives `Serialize/Deserialize`; source grammar and DTO fields are unchanged. It must retain the candidate compiler-semantics ID, never recompute/relabel it as Released. Build/verify result and diagnostic adapters likewise map exact public fields with strict wire validation, not mutable linked compiler internals.

The actual places requiring the façade/selection are `controller/mod.rs:569` (snapshot), `:849` (build), and `verification.rs:2965` (fresh Engine verify), plus the worker plan carrying selection. The semantic-ID equality checks at `verification.rs:3026–3045` and complete theorem/runtime audits remain unchanged in meaning. Source-owned runtime import metadata remains from the pristine original runtime, whose bytes the derivation forbids changing.

Released/default commands retain their existing compiler, lock formats, generation recipe and artifact schemas. Candidate framing belongs only to candidate generation identities. Ordinary/application output or identity drift is a failing compatibility gate, not something to bless by blindly regenerating goldens. If the concrete façade integration forces such drift through existing broad identity closures, the builder must identify it for redesign or a separately reviewed scope amendment.

## 7. Concrete semantics, locks and evidence contracts

The candidate's `language/semantics-1.2.toml` must version its proof lowering and Lean backend and include a deterministic descriptor of this rule set/bounds. It retains language 1.2 syntax. The resulting semantics digest is computed by the real compiler; do not overwrite the old hash. This matters because `build.rs:24–29`/`lib.rs:242–296` hash normative data, not Rust implementation bytes. The separate derivation descriptor and measured producer bind implementation bytes too.

Proposed closed descriptor `prismpm/proof-compiler-source/1` contains: ID; diagnostic-only flag; allowed native-library profile; base revision/version/crate and tree-manifest hashes/base semantics ID; overlay hash; recipe hash; exact derived-tree digest; distinct package name/version; resulting compiler-semantics ID; unchanged runtime-closure digest; proof-rule version and exact limits. It is outside the derived package, avoiding self-hash cycles. Base and derived identities are separate. Review pins this descriptor into a closed registry; a supplied hash is not independent authorization.

Candidate preparation uses an explicitly acquired/measured candidate CLI for lock/fmt/check, not PATH replacement. The original SDK inventory and installed lexlean executable remain measured and unchanged. Candidate lock bytes contain the new actual compiler-semantics ID and are frozen before build. The linked candidate Engine must agree with the preparation CLI on descriptor, derived-tree and semantics IDs. A stock prepared lock or a different candidate's lock is refused, as `lock.rs:1343–1365` already requires. Released preparation remains unchanged.

Publish deterministic candidate certificate data as `proofs/constructive-nat.json` in the candidate LexLean fixed build outputs, covered by its normal manifest. It lists theorem/source IDs, original normalized propositions, DAGs and final nodes; it contains no process/platform paths. The candidate checker verifies the serialized bytes before emitting proof terms. Every matching empty-policy `linear_arithmetic` theorem must have exactly one row; extra/missing/duplicate rows fail. Existing LexLean attestation shape can remain `lexlean/attestation/2` if it already binds the full output manifest, new compiler version/semantics and unchanged audits; do not append unregistered fields. Candidate output-set/version semantics must explicitly include the certificate file.

Use these **proposed new closed Prism schemas**, leaving historical versions untouched:

| Artifact | Exact new content / binding |
| --- | --- |
| `library/proof-compiler.json`, `prismpm/proof-compiler-identity/1` | Stable ID, descriptor digest, derived-tree digest, compiler-semantics ID, rule version and certificate artifact digest. No native process measurement. |
| Candidate `prismpm/build-inputs/4` | All existing `/3` inputs plus one required `proof_compiler` identity matching that sidecar; complete generated artifact rows include it. Released stays `/3`. |
| `prismpm/proof-compiler-acquisition/1` | Descriptor/base/derived identities; owned source snapshot and real build recipe/process records; actual candidate CLI and PrismPM executable hashes/sizes/modes; native platform and independently supplied original SDK lock/inventory digests. No invented LexLean child: Engine runs in process. |
| Candidate `prismpm/library-verification-manifest/4` | All existing `/3` verification/owner/frontend data plus required `proof_compiler` identity, acquisition receipt, preparation CLI/lock binding and the measured in-process verifier binding. Released stays `/3`. Both native phases bind the same stable compiler sidecar and actual source/manifest/certificate digests. |

The current library acceptance payload may keep its shape if its existing manifest/attestation references transitively bind this complete new manifest; implementation must prove that chain rather than assuming it. No historical `/3` record is upgraded by interpretation. Existing exporter acquisition `/1` and `/2` and native frontend/owner receipt meanings remain intact and cannot masquerade as proof-compiler evidence.

A source-free reader independently receives the frozen registered proof-compiler descriptor and original SDK authority from the controller/reader release, checks the receipt against them, verifies retained candidate producer identities and exact semantic/source/model/manifest/certificate/lock bindings, then performs the existing complete declaration/erased-proof audit and frontend/exporter replay checks. It must not learn the authoritative candidate descriptor only from the receipt it is validating. Source-bootstrap conformance must use a separately tagged caller-held producer/source authority, with no fake SDK inventory or downgrade of actual SDK admission.

## 8. Admission amendment, review questions and gates

The amendment must explicitly permit the additive package/derivation, new closed controller authority, diagnostic preparation lifecycle, new compiler-semantics locks and the proposed candidate evidence schemas. Original SDK/Lean/Rust/guest/exporter/base LexLean registrations stay byte-identical. `xtask/src/audit.rs:372–451` must retain its original package/VCS/archive admission and gain a separate derivation verifier; do not weaken its original exact revision check or enlarge the set of handwritten Lean authority bytes.

Independent builder review must resolve these genuine implementation questions before authorization:

1. Confirm the dual-package materialization/alias scheme works with the actual locked offline workspace and source-audit lifecycle without an unreviewed Cargo dependency change; otherwise propose a concrete equivalent derivation layout, not a PATH override.
2. Confirm the DTO bridge is lossless for every selected source declaration, and enumerate every internal worker/build/verify entrypoint that must retain the authority. Detect any ordinary-path identity closure that would drift.
3. Confirm the exact axiom-free Init calls used by normalization, closed LiteralLE and certificate rules, with complete actual generated proof audits. The design specifies logical rules, not untested theorem-name spellings as facts.
4. Assign registered diagnostic codes and schema/model registrations; verify candidate build-input/manifest dispatch, historical refusal behavior and acceptance-reference chain. If `/2` LexLean attestation cannot bind the added fixed certificate artifact without changing its contract, propose a new explicit candidate attestation version before implementation.
5. Check the proposed finite caps against authored positive/negative fixtures and original total-stage budget. No widening or new fallback is implicit in this draft.

Required gates include all five original propositions through real authored candidate generation, Lean elaboration and leanchecker with empty axiom audits; generic symbolic/scoped/invalid-certificate cases; deterministic regeneration; original Released/default/application compatibility; independent authority/receipt mutation controls; runtime/source/erased-proof closure; two independent exports; original all-four actual SDK execution and readers; std/no_std and corpus checks; reviewed full source VV/goldens. Retain both hosted failure runs as historical failures. A certificate checker, successful local proof witness, candidate hash or builder review alone is not production admission.

The design ends here. Its algorithms and evidence shapes are proposed for independent review; no capability or effective pin has yet changed.
