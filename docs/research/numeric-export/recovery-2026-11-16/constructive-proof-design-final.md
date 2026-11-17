# Revised draft: isolated constructive Nat proof compiler backport

2026-11-17, revision 3 after independent builder and base-alias review. **Design prerequisite only.** The controller permits planning an additive, explicitly identified diagnostic LexLean source backport. Implementation and effective compiler selection remain blocked until the amendment and independent builder review accept this design. No code, proof search, build, production source, pin or policy was changed to prepare this draft.

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

## 5. Freeze and materialize a separate complete diagnostic workspace

The implementation boundary is a **separately materialized PrismPM + LexLean workspace/tool**, not a new dependency or dispatch branch in the ordinary root workspace. No candidate dependency enters the root `Cargo.toml`, `Cargo.lock`, `crates/prismpm/Cargo.toml`, published package manifest, or ordinary package-API consumer. No candidate code is inserted into the root generator-source closure. All candidate PrismPM controller/verification/CLI/model-worker/schema/reader changes and candidate Cargo entries live in the registered derivation described here.

**Acyclic freeze sequence:**

1. Finish and review the current root work, then freeze a clean immutable base PrismPM commit B and its complete tracked tree T_B **before adding this derivation's registry, descriptor or overlay**. Retain a bounded base archive/bundle with the exact complete inventory: declared real directories, regular-file paths/modes/sizes/byte hashes, and the registered base aliases with link kind and exact target bytes. Do not follow aliases when computing this inventory. The existing original LexLean archive/revision and all original dependencies are members of that base. B is selected by the controller when finalizing the plan; this draft does not guess a future commit hash.
2. Produce an exact reviewed overlay P against B. It may change the candidate PrismPM Rust/CLI/schema/reader/manifest files and add the constructive compiler's Rust/data changes. It must not contain a new or modified `.lean`, `lakefile.lean`, original compiler-authority byte, original runtime payload, SDK lock/inventory, Lean/Rust/guest/exporter pin, or base compiler archive. Paths and patch operations are closed and individually enumerated; no shell patch hooks, arbitrary replacement paths or network sources. The overlay cannot add, change or remove any registered alias. Every patched path and ancestor must be a declared real directory/regular target, never an alias spelling of that target.
3. Define the effective source tree T_D by deterministic base extraction, derived compiler package construction, and overlay application. Its canonical manifest covers **every effective source node**, including declared directory modes, regular-file modes/sizes/digests, and each registered alias kind/path/exact target bytes, plus both original and candidate package code/data and all derived PrismPM manifests/readers. Directory/subtree digests cover the declared canonical entries without following aliases or hashing target content a second time. No generated descriptor is embedded in T_D. Compute its digest from the full canonical path/mode/size/bytes map. Candidate source references a fixed sibling authority input rather than hard-coding its own future descriptor digest.
4. Create descriptor D containing B/T_B, base archive identities, P/recipe digests, T_D, compiler/package/rule/semantics identities and the exact constraints. D is outside T_D. Compute full effective build-source identity `H(domain, T_D, hash(D), recipe_hash)` **after** D exists. Store that aggregate and hash(D) in an outer controller registry R; neither D nor T_D contains R's digest or this self-referential aggregate.
5. Commit R, D, P and the materialization/audit recipe in a later controller/registry commit C. The actual acquisition record names C, B, R, D and the aggregate identity. C is recorded by execution/custody evidence; it is not inserted into its own committed registry. Review/seal the complete recipe and descriptor before any candidate build.

This two-level identity scheme avoids the base-commit/descriptor cycle and the derived-tree/embedded-descriptor cycle. The complete build input closure is T_D **plus** D and the recipe; D is a separately named real build input, not a hidden excluded source file. The independently frozen outer registry is the authorization anchor.

A standalone materializer runs **before any candidate Cargo invocation**. It uses already available original tools, not an xtask that first requires the missing candidate dependency. It validates R and D against the controller's expected registry, independently verifies the retained base Git identity/archive, validates the entire declared inventory and alias target graph before creating any source member, creates real directories and regular files first and then the exact registered aliases, verifies T_B, applies only P to direct regular target paths, checks complete T_D membership/digest and unchanged alias inventory, installs D in the fixed sibling `authority/descriptor.json`, and checks the aggregate closure. No mutable worktree, adjacent unregistered repository, caller URL, unregistered/escaping alias or PATH compiler substitution is accepted. Real-directory, regular-file, alias and resolved-target identities are held and rechecked without following aliases during admission and across the actual build and later use. A partial or mismatching tree is rejected and only proved-owned partial outputs may be removed.

### 5.1 Exact confined base aliases

Read-only inspection of immutable source `881df278923ff271fc179703e55ea91c45f2394d` (`git ls-tree -r`, then `git cat-file blob` for the mode-120000 entries) confirms the following **22** aliases. This is an exact inventory, not a path-pattern allowance. The final B/T_B must freeze these path/target bytes; any alias change in a proposed different base requires separate review. All table paths are relative to the source root. Targets below are exact relative text, with no trailing newline.

| Alias path | Exact target bytes as text |
| --- | --- |
| `crates/prismpm/CHANGELOG.md` | `../../CHANGELOG.md` |
| `crates/prismpm/CONFORMANCE.md` | `../../CONFORMANCE.md` |
| `crates/prismpm/ERRORS.md` | `../../ERRORS.md` |
| `crates/prismpm/LICENSE-APACHE` | `../../LICENSE-APACHE` |
| `crates/prismpm/LICENSE-MIT` | `../../LICENSE-MIT` |
| `crates/prismpm/README.md` | `../../README.md` |
| `crates/prismpm/RELEASE-STATUS.md` | `../../RELEASE-STATUS.md` |
| `crates/prismpm/SPEC.md` | `../../SPEC.md` |
| `crates/prismpm/adapters` | `../../adapters` |
| `crates/prismpm/language` | `../../language` |
| `crates/prismpm/model` | `../../model` |
| `crates/prismpm/schemas` | `../../schemas` |
| `crates/prismpm/sdk` | `../../sdk` |
| `crates/prismpm/src/embedded/hologram-oracle.Cargo.lock` | `../../../../tests/hologram-oracle/Cargo.lock` |
| `crates/prismpm/src/embedded/hologram-oracle.Cargo.toml` | `../../../../tests/hologram-oracle/Cargo.toml` |
| `crates/prismpm/src/embedded/hologram-oracle.main.rs` | `../../../../tests/hologram-oracle/src/main.rs` |
| `crates/prismpm/src/embedded/lean4-prod-rust.MANIFEST.sha256` | `../../../../vendor/lean4-prod/rust/MANIFEST.sha256` |
| `crates/prismpm/standards` | `../../standards` |
| `crates/prismpm/standards.lock` | `../../standards.lock` |
| `crates/prismpm/stdlib` | `../../stdlib` |
| `crates/prismpm/tests/data/holo-codec-v1.json` | `../../../../tests/data/holo-codec-v1.json` |
| `crates/prismpm/vendor` | `../../vendor` |

Admission rules:

- Preserve each exact path, Git link kind/mode 120000 and target bytes. Do not dereference links into duplicate files, rewrite a target to a supposedly equivalent relative path, or change the consumer paths to avoid the links.
- A target must be a direct relative path. Reject absolute targets, backslashes, NUL/control bytes, malformed components, or lexical normalization that escapes the measured source root. The registered `..` components are valid only because resolving from the declared alias parent remains inside the tree; do not prohibit those exact confined spellings or use filesystem traversal to decide confinement.
- The lexically resolved endpoint must be an inventory-declared regular file or real directory. Every ancestor of the alias and of the resolved target must be a declared real directory. Reject link-to-link chains, alias ancestors, alias loops, dangling/unregistered endpoints, special files and hardlinked source files. A directory target names its existing declared subtree; no second subtree is created under the alias path.
- Validate the complete inventory, conflicts and all targets before creation. Reject duplicate/overlapping entries, a regular/directory node substituted for a declared alias, or any additional alias. Create real directories and singleton regular files, then the exact symlinks, in deterministic order. Recheck the completed inventory using no-follow operations and exact readlink bytes.
- Retain no-follow identity measurements for each alias and its declared real target/ancestors. Across the build, revalidate alias kind, target bytes, inode/device and relevant owner/mode metadata, and independently revalidate the resolved target's identity/type/content or declared directory inventory. Replaced links or targets fail even if the replacement has the same displayed target text/content. No target lookup may silently traverse an unvalidated link ancestor.
- Apply P only to direct registered regular targets with real ancestors. P cannot add/change/remove aliases or patch through `crates/prismpm/model`, `schemas`, `vendor`, or another alias; it must name the appropriate real root-relative target. Necessary Rust and manifest edits are regular targets. A future need to alter aliases is a design-review boundary.

The derived canonical manifest retains each alias once as a link record; regular files/directories and their digests remain at their declared real paths. Full source identity therefore preserves the original alias semantics without expanding or obscuring the measured code closure. This reuses the accepted candidate-capture **semantics** conceptually; it does not approve an unexamined implementation or waive new negative controls.

The disposable layout is concretely:

```text
<owned diagnostic root>/
  source/                  # complete derived PrismPM workspace, exact T_D
    vendor/lexlean/         # pristine original package from B
    vendor/lexlean-constructive-diagnostic/  # materialized derived package
    Cargo.toml, Cargo.lock # DERIVED manifests, never copied back to root
    crates/prismpm/...      # DERIVED candidate invocation and validation
    scripts/...            # DERIVED candidate CLI/readers
  authority/descriptor.json # exact separately held D
  build-output/            # actual offline Cargo outputs, outside T_D
  acquisition/             # actual command/custody/producer evidence
```

The candidate LexLean package has a distinct local identity, proposed `lexlean-constructive-diagnostic` version `0.4.0-constructive.1`, linked as `lexlean_candidate`; the original `lexlean` package is retained for Released semantics and stable DTOs. Only the derived manifests/lock add this package, without changing original dependency versions/checksums. The derived PrismPM executable is named/marked as diagnostic, proposed `prismpm-constructive-diagnostic`; the preparation executable is similarly distinct. The workspace and tools are not publishable substitutes for the original PrismPM crate, SDK, or upstream LexLean release. The ordinary root package-API gate still consumes the unchanged ordinary manifests.

Derived package provenance is explicit: the pristine `vendor/lexlean` retains its original clean upstream `.cargo_vcs_info.json` and exact archive identity. The separately materialized diagnostic package must **not** retain that record as if it were itself the untouched upstream release. Remove unsupported publish/VCS metadata from the derived package or replace it with clearly local diagnostic provenance whose fields make no upstream commit/release claim. A small local record may name its diagnostic package/version and the actual original base identity, but the authoritative base-plus-overlay derivation remains in external D/R. No fabricated commit, release tag, clean-upstream claim or duplicated original package identity is permitted. This metadata operation is an explicit member of the reviewed derivation recipe and its resulting T_D inventory, not an unrecorded packaging cleanup.

D and R remain outside T_D. Candidate source may refer to the fixed external authority input and consume its admitted bytes, but cannot hard-code its future D digest or treat a self-supplied descriptor as authorization. The independently owned acquisition controller and source-free reader receive the frozen R/D anchors separately, bind the complete source/build closure, and check candidate claims against those anchors.

The materialized candidate compiler reuses the registered base package's exact four Lean authority files and all unchanged runtime data. If a second package directory needs copies of those four files, they are explicitly enumerated **runtime materializations of the same admitted base bytes**, checked against the original archive and against their corresponding original package members. They are never an additional handwritten-authority allowance. The registry/auditor rejects any fifth path or changed authority byte. No derived `.lean` source is committed; generated proof terms remain manifest-owned build artifacts. The derived source auditor gets this narrow derivation rule from its reviewed overlay; the root auditor independently checks the same invariant before candidate code executes.

After custody validation, run only the recipe's exact `cargo ... --locked --offline` commands in `source/`, with original pinned Rust and fixed `CARGO_TARGET_DIR` under `build-output/`. Record argv, closed environment, measured tool identities, exits and bounded output. Recheck the full source/authority closure afterwards, measure the real candidate verifier and preparation binaries, and retain them or an independently owned immutable producer bundle. No expected binary hash is invented in D before the build. These measured outputs belong to the acquisition evidence. A mutation, missing package, unexpected lock rewrite or unregistered child fails without falling back to the original SDK compiler.

## 6. Root/default isolation and authority propagation inside the derivation

**Ordinary root behavior is preserved by leaving its implementation untouched.** Its original Engine, Controller, verification code, generator closures, Cargo/package manifests, existing readers and `model/dependencies.toml` do not acquire candidate dispatch. Root/default commands keep their existing outputs, identities and package distribution contract. A diagnostic source backport is not added as an installed SDK subprocess or written over its tools.

Inside T_D only, a private Engine façade uses the original package DTOs and the separately linked candidate Engine. Candidate native-library operations require the explicit closed ID `constructive-nat-v1`; missing/unknown selection, paths/URLs/environment selectors, application/system/ordinary model invocation, and fallback to another compiler fail. Version/identity inspection may run without a project. The diagnostic tool does not offer a Released build/verify mode that claims root identities: its own source files and generator digest genuinely differ. Tests that need original/default behavior use the independently held ordinary base tool, not a disguised branch of the modified verifier.

Candidate snapshot bytes are validated against the unchanged canonical snapshot schema, deserialized into original `SemanticSnapshot`, then compared byte-for-byte using its actual `canonical_bytes()` method (`artifact/snapshot.rs:449–452`). Plain serde field-order output is insufficient. The candidate compiler-semantics ID remains data and must survive this bridge unchanged. Necessary public build/verify result fields (`api.rs:152–197`) and diagnostic causes are explicitly adapted; no mutable native compiler tree crosses the worker boundary and no private original compiler internals are constructed.

The selection must be present in all of these **derived** entrypoints, not just three Engine calls:

- Controller construction and both `with_prepared_release` / `verify_release` paths (`controller/mod.rs:683–692,1277–1287`).
- `model_worker::Plan::load`, plan equality/active-scope checks, and reload in `require_current_selection` (`controller/model_worker.rs:11–60,101–126`). Unchanged configuration parsing can be shared, but the frozen authority is an explicit part of the plan.
- Snapshot load (`controller/mod.rs:569`), nested build (`:849` and `build_release_with_owner`), repeated model-configuration checks, and the fresh verify Engine (`verification.rs:2944–2989`).
- Derived generator/input-lock framing and every candidate preparation, build, verification and retained-reader command.

After the existing projections at `controller/mod.rs:625–645`, reject non-library/system/application models before emission. Require the compiler authority to equal the descriptor admitted at materialization and retained by the controller owner. Existing source/semantic/build/attestation equality checks (`verification.rs:3026–3045`) and full theorem/runtime audits retain their meaning.

The derived generator identity hashes the **actual derived source closure**, plus the framed authority input D and all new candidate helpers. Never return a hard-coded original digest, exclude changed `verification.rs`, or edit the original hash recipe to conceal candidate code. The resulting different library generator and input-lock identities are correct for this separate diagnostic tool; they must not be projected onto ordinary root `/3` locks. The existing exporter source selection/owner still has its independently admitted original or NumericTask2c identity and is not replaced by proof-compiler authority.

## 7. Concrete semantics, locks and evidence contracts

The candidate's `language/semantics-1.2.toml` must version its proof lowering and Lean backend and include a deterministic descriptor of this rule set/bounds. It retains language 1.2 syntax. The resulting semantics digest is computed by the real compiler; do not overwrite the old hash. This matters because `build.rs:24–29`/`lib.rs:242–296` hash normative data, not Rust implementation bytes. The separate derivation descriptor and measured producer bind implementation bytes too.

Proposed closed descriptor `prismpm/proof-compiler-source/1` contains: ID; diagnostic-only flag; allowed native-library profile; base PrismPM commit/tree/archive plus original LexLean revision/version/crate and tree-manifest hashes/base semantics ID; complete overlay hash; materialization/build recipe hash; exact complete derived PrismPM-plus-LexLean tree digest; distinct package name/version; resulting compiler-semantics ID; unchanged runtime-closure digest; proof-rule version and exact limits. It is the sibling authority input outside T_D, avoiding self-hash cycles as defined in §5. The outer controller registry pins D and the complete aggregate build-source identity. Neither package VCS metadata nor the original dependency register is forged. A supplied descriptor/hash is not independent authorization.

Candidate preparation uses an explicitly acquired/measured candidate CLI for lock/fmt/check, not PATH replacement. The original SDK inventory and installed lexlean executable remain measured and unchanged. Candidate lock bytes contain the new actual compiler-semantics ID and are frozen before build. The linked candidate Engine must agree with the preparation CLI on descriptor, derived-tree and semantics IDs. A stock prepared lock or a different candidate's lock is refused, as `lock.rs:1343–1365` already requires. The ordinary root and installed SDK preparation remain unchanged. Candidate preparation is a separate explicit command from the acquired diagnostic producer bundle; its own `lock/fmt/check` and the derived linked Engine must agree.

Publish deterministic candidate certificate data as `proofs/constructive-nat.json` in the candidate LexLean fixed build outputs, covered by its normal manifest. It lists theorem/source IDs, original normalized propositions, DAGs and final nodes; it contains no process/platform paths. The candidate checker verifies the serialized bytes before emitting proof terms. Every matching empty-policy `linear_arithmetic` theorem must have exactly one row; extra/missing/duplicate rows fail. Existing LexLean attestation shape can remain `lexlean/attestation/2` if it already binds the full output manifest, new compiler version/semantics and unchanged audits; do not append unregistered fields. Candidate output-set/version semantics must explicitly include the certificate file.

Use these **proposed new closed Prism schemas**, leaving historical versions untouched:

| Artifact | Exact new content / binding |
| --- | --- |
| `library/proof-compiler.json`, `prismpm/proof-compiler-identity/1` | Stable ID, descriptor digest, derived-tree digest, compiler-semantics ID, rule version and certificate artifact digest. No native process measurement. |
| Candidate `prismpm/build-inputs/4` | All existing `/3` inputs plus one required `proof_compiler` identity matching that sidecar; complete generated artifact rows include it. Released stays `/3`. |
| `prismpm/proof-compiler-acquisition/1` | Descriptor/base/derived identities; owned source snapshot and real build recipe/process records; actual candidate CLI and PrismPM executable hashes/sizes/modes; native platform and independently supplied original SDK lock/inventory digests. No invented LexLean child: Engine runs in process. |
| Candidate `prismpm/library-verification-manifest/4` | All existing `/3` verification/owner/frontend data plus required `proof_compiler` identity, acquisition receipt, preparation CLI/lock binding and the measured in-process verifier binding. Released stays `/3`. Both native phases bind the same stable compiler sidecar and actual source/manifest/certificate digests. |

Keep the library acceptance payload `/1` shape, but require the actual external `VerifyResult.attestation_id` → complete verification manifest → acceptance and LexLean-attestation chain (`library_verification.rs:381–478`). Acceptance does not point back to the manifest and can never stand alone as proof-compiler authority. This direction is confirmed by builder review. No historical `/3` record is upgraded by interpretation. Existing exporter acquisition `/1` and `/2` and native frontend/owner receipt meanings remain intact and cannot masquerade as proof-compiler evidence.

The candidate frontend/SDK/owner readers are patched only in T_D and their exact files are part of its manifest. A controller outside T_D loads those already reviewed bytes from the admitted materialization/producer bundle and supplies independently frozen R/D, aggregate source identity, retained measured producer authority and original SDK authority, checks the receipt against them, verifies retained candidate producer identities and exact semantic/source/model/manifest/certificate/lock bindings, then performs the existing complete declaration/erased-proof audit and frontend/exporter replay checks. It must not learn the authoritative candidate descriptor only from the receipt it is validating. Source-bootstrap conformance must use a separately tagged caller-held producer/source authority, with no fake SDK inventory or downgrade of actual SDK admission.

## 8. Minimal root-side admission and VV changes

No production dependency registration is necessary for a compiler that exists only in this separate diagnostic distribution. **Do not add it to root `model/dependencies.toml`.** Although that file is not in the generator function's source list, `controller/mod.rs:1076–1087` hashes its complete bytes into every build's `dependency_register_sha256`; changing it would change ordinary build inputs/IDs. Root Cargo manifests/lock, production schema/error/capability registers and existing source-free readers likewise remain unchanged. Candidate schema/error/capability registrations belong to T_D and its explicit diagnostic contract.

The minimal root/controller additions are a distinct diagnostic registry (proposed `diagnostics/constructive-proof/registry.json`, descriptor/overlay/recipe artifacts), standalone materializer/checker code, bounded fixtures, normative diagnostic documentation, and a source-VV audit invocation. They are not a new ordinary model dependency or a public installed SDK capability. Root source VV must independently verify the derivation before trusting its products.

A small root `xtask` audit entry can read this diagnostic registry and run/admit the standalone checker, using existing xtask dependencies. It must not depend on the candidate crate or resolve the derived workspace before materialization. Root `scripts/vv.sh`/`xtask` continue to start through ordinary Cargo successfully; only then does the new diagnostic source audit materialize/validate its explicitly registered input in a separate owned directory. The separate candidate-build driver invokes the standalone materializer **before** its first derived Cargo call. This resolves the review's bootstrap cycle without adding unresolved ordinary dependencies.

Source-VV checking consists of: verify B's retained immutable source/archive identity; recompute the exact overlay result/full source closure; validate original authority-byte equality, forbidden changes, exact base alias bytes/target confinement/no-follow custody, no extras and both candidate manifests/locks; verify the independent reader recipe and schema registration; exercise invalid derivations and historical candidate refusal. It can then run the separately enumerated candidate test/build gates when authorized. It does not run candidate package code to decide whether that same code is authorized. Root's complete existing VV and standalone package-API gate remain required and unchanged in scope. The private diagnostic workspace does not become a publishable package by passing them; candidate-specific gates are recorded separately, never relabeled as the original published-package result.

**Checked root identity impact:**

| Proposed root change | Existing ordinary generation closure? | Rule |
| --- | --- | --- |
| New diagnostic registry/artifact directory and materializer/audit test files | Not in the application-generator array (`controller/mod.rs:29–46`), library-generator array (`:49–109`), or 31-file emitter array (`holo/projector.rs:63–224`) | Allowed additive diagnostic source/VV inputs after review. Their own full recipe/source identities must be bound. |
| `xtask/src/audit.rs`, a new xtask audit module, minimal `xtask/src/main.rs` audit invocation | Not in those generation arrays; xtask depends on ordinary prismpm without candidate manifests | Allowed audit plumbing with existing dependencies. Root metadata/package-api still resolves original dependencies. |
| `SPEC.md`/diagnostic plan documentation, source-VV script wiring | Not in those explicit generator/emitter arrays | Document new diagnostic authority; do not claim installed SDK capability. Existing spec/source gate effects still require review/tests. |
| `crates/prismpm/src/verification.rs` or other current generation inputs | **Yes**; verification.rs is wholly hashed by the library generator, and both generator IDs enter all `/3` input locks | Forbidden in root for this feature. Patch only T_D, where the new identity is honest. |
| `model/dependencies.toml` | Not the generator arrays, but **directly hashed into ordinary build inputs** | Keep root bytes unchanged; use the separate diagnostic registry. |
| Root Cargo manifests/lock or ordinary package-API dependency patches | Distribution/resolution boundary even without a generator-array entry | Keep unchanged. Candidate package resolution exists only in T_D. |

This is a static closure check, not a claim that any future diff is harmless. The implementation gate must compare these complete original generator/emitter inputs and root dependency/package manifests against B byte-for-byte, compute original generator IDs/ordinary locked build compatibility, and fail if unexpected root production drift appears. Do not compensate with old-digest constants, exclusions, renamed historical records or golden updates.

## 9. Remaining concrete validation obligations

The independent builder found no further fundamental design blocker after the two isolation decisions. Remaining implementation obligations are:

1. Validate actual full-base extraction/overlay/Cargo materialization and ownership in the separate workspace before offline build; record T_B, P, T_D, D, aggregate source closure and real producer outputs without circular hashes. Preserve and remeasure all 22 exact base aliases under §5.1 rather than extracting regular-only or dereferencing content.
2. Implement the exact worker/Engine authority propagation listed in §6 and the canonical DTO round trip. Candidate diagnostics map to the public cause fields; no private native-type fabrication.
3. Validate every normalization/rule/LiteralLE emission against original Lean/leanchecker and empty axiom audits; malformed certificates, hypotheses and limits fail closed. The finite algorithms/caps remain as §§1–4 specify.
4. Register certificate output kind and candidate fixed outputs. Builder review confirms the existing `/2` LexLean attestation binds exact full manifest bytes (`verify/mod.rs:2962–2971`) and includes compiler/version/semantics and actual in-process executable hash (`:2926–2940`); no new LexLean attestation shape is required for this design. Candidate Prism build-inputs `/4` and library-manifest `/4` remain explicit new contracts, with old `/3` validators unchanged in root.
5. Implement the outside-controller reader dispatch using independently held registry/source/producer and original SDK authority. Extend candidate readers' closed-key/frontend-owner checks explicitly for `/4`; retain actual SDK versus separately tagged source-bootstrap distinction. Preserve the confirmed VerifyResult → manifest → acceptance/attestation direction.

Required materialization/alias negatives must be actual tests in the implementation: missing/extra alias; changed target bytes even when lexically equivalent; overlay addition/removal/change of an alias; patch through an alias ancestor; absolute/backslash/control-byte/escaping target; dangling or undeclared endpoint; alias-to-alias chain; aliased source/target ancestor; cycle; directory/file substitution for a link; duplicate or overlapping inventory entry; FIFO/device/socket or hardlinked file; target file/directory replacement during build; and same-text alias replacement during build. Positives must preserve all 22 exact links, their real targets and source identities through the real offline candidate build. Refusal must retain the original failure and must not dereference, rewrite, relax confinement or fall back to a regular-only copy. None of these tests has run during this design revision.

Mandatory execution gates remain: all five original Bounds statements authored with genuinely empty policies and generated through the actual candidate; generic positive/negative/certificate/normalization cases; complete source/runtime/erased-proof closure; deterministic regeneration; actual two independent exports; original total-stage budgets; all-four actual SDK build/verify/readers using the explicitly acquired candidate tools; std/no_std and corpus checks; root full VV and ordinary package API; candidate-specific source tests and reviewed goldens. The installed SDK, original tools and original dependency/authority bytes remain unchanged and are measured before/after. Both prior failed hosted runs remain failed historical evidence.

## Ruling appendix — revision 2

The controller selected **isolated diagnostic materialization** to resolve both independent-review blockers. This revision supersedes revision 1's idea of placing a candidate dependency/Engine façade into the ordinary root workspace. All candidate PrismPM compiler/frontend/CLI/manifest/reader changes now belong to a registered derivation from a reviewed base commit frozen first. Root/default generator closures, dependency register, package manifests and installed SDK identities remain untouched. Root additions are confined to separately registered diagnostic artifacts, source admission/VV tools and documentation outside the verified generator arrays.

The review also corrected two details now incorporated: snapshot bridging uses the actual canonical serializer, and the evidence chain starts with externally selected VerifyResult/manifest rather than acceptance JSON. Original four Lean authority bytes remain exact base copies, not a new handwritten-source exception. No implementation, tests, build, new proof research or effective pin change occurred in this revision. The parent must formalize and review the amended design/plan before implementation.

## Ruling appendix — revision 3

Builder revision 2 resolved the generator-identity and Cargo-package isolation blockers. The controller then identified required base aliases: immutable source `881df278923ff271fc179703e55ea91c45f2394d` has the 22 tracked mode-120000 entries enumerated in §5.1. Revision 3 replaces regular-only extraction with complete prevalidated inventory materialization, real directories/files first and exact confined links second. T_B and T_D preserve link kind and exact target bytes without following links to duplicate source. No alias may be added, changed, removed or patched through by the overlay without separate review. Alias and real-target no-follow identity checks and concrete negative cases are now mandatory across build custody.

No code, test, build, new proof research or effective pin change occurred. The existing isolation, certificate rules, original four Lean authority bytes and all installed/default contracts remain as revision 2 specified. Derived package provenance is also explicit: only the pristine base retains its clean upstream VCS record; the candidate uses clearly local diagnostic metadata or omits unsupported publication metadata, with exact base-plus-overlay authority in external D/R. Candidate source cannot hard-code its future descriptor digest, and acquisition/reader authority is independently owned. This is the final revision-3 design draft for parent formalization, not implementation authorization.
