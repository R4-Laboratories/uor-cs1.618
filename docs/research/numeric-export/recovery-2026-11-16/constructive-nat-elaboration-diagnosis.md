# Task1 elaboration-memory diagnosis — read-only checkpoint

2026-11-17. This is a bounded inspection of the retained failed component run. No Lean execution, compiler build, fixture/source/authority edit, new proof, network operation or subagent was used for this diagnosis. Only this SDD note was written. It does not establish kernel acceptance or an axiom result.

## Observed failure and exact inputs

The candidate CLI successfully performed actual lock, fmt, fmt --check, lock --check, check and build for the unchanged five Bounds propositions with empty policies and nine generic variants. The selected certificate has fourteen rows. The Bounds source after formatting is byte-identical to the original source except the five policy changes to `[]`. Thirteen new Rust tests and seven existing backend/policy controls passed. These are component facts, not Lean success.

The first command in the actual proof audit was:

```
/workspace/diagnostic-tools/lean-4.32.1-linux/bin/lean -o /workspace/diagnostic-tools/constructive-nat-task1/generated/oleans/ConstructiveComponent/Bounds.olean ConstructiveComponent/Bounds.lean
```

Its working directory was `/workspace/diagnostic-tools/constructive-nat-task1/fixtures/positive/.lexlean/build/73b99cb4aba905bb87481955c1ce231298cdf2f5e6786261b8dbc837fd78af71/modules`. Its exact PATH and LEAN_PATH are retained in `/workspace/diagnostic-tools/constructive-nat-task1/evidence/lean-audit-commands.json`. The runtime oleans and accompanying source hashes are separately recorded in `evidence/original-runtime-identities.json`.

At an observed 95 seconds, `ps` reported RSS 7,610,336 KiB. The retained `/proc` snapshot reports VmHWM 7,610,080 KiB, VmRSS 6,772,704 KiB and VmPeak 14,110,176 KiB. The owned process was proactively terminated by SIGTERM; the audit receipt records exit -15 after 119.082 seconds. Both Lean stdout/stderr files are empty. No fresh Bounds olean exists, leanchecker never ran, and the axiom audit never ran. There is no trace identifying the exact line where elaboration spent time. Source order alone does not prove a particular theorem or node was reached.

Retained evidence:

- `evidence/lean-resource-stop.json`: process identity, full status snapshot and reason for the proactive stop.
- `evidence/lean-audit-commands.json`: actual command, environment, exit, timing and log paths.
- `evidence/lean-audit.json`, `.stdout`, `.stderr`: outer bounded-run receipt/logs.
- Generated Bounds Lean: 32,570 bytes, SHA-256 `2ab5f286414a23fef5363e370da599caf4b5285c48a066c146851dd3f32ed03d`.
- Generated `proofs/constructive-nat.json`: 202,039 bytes, SHA-256 `3d014b17c42141482faae7eafce8181381098588f6f69d1cfc39242c5ae1efbe`.

Both generated files remain under the build directory above. Preserve them as the original failed outputs.

## Static findings

The emitted Lean text is not an exponentially inlined proof DAG. Each certificate node is emitted once as a named local `have`, and premise references name earlier bindings. The emitter also creates a local `let __cntN : Nat := ...` for **every** term, including literals and completely closed additions (`package/src/backend/constructive_nat/emit.rs:20–62`). Every proposition and lemma argument then refers to these local names.

A bounded scan of the certificate gives:

| Bounds theorem | Term rows | Proof nodes | Maximum expanded syntactic term leaves | LiteralLE endpoints |
| --- | ---: | ---: | ---: | --- |
| limbAddBound | 23 | 65 | 3 | 8589934591 <= 8589934591 |
| cellAddBound | 23 | 65 | 3 | 18446744073709551615 <= itself |
| divDoubleRemainderBound | 14 | 46 | 3 | 18014398509481982 <= itself |
| divReducedRemainderBound | 40 | 202 | 4 | none |
| divQuotientStepBound | 15 | 34 | 3 | 36028797018963967 <= itself |

The first source theorem contains this early large closed reduction at generated line 88:

```
let __cnt1 : Nat := (nat_lit 4294967295)
let __cnt19 : Nat := __cnt1 + __cnt1
let __cnt21 : Nat := (nat_lit 8589934590)
...
have __cnp53 : __cnt19 = __cnt21 := Eq.refl __cnt21
```

Its later LiteralLE at line 98 is `__cnt7 <= __cnt7`, discharged by `of_decide_eq_true (Eq.refl true)`. Therefore a hypothesis specifically involving the **numeric gap** between LiteralLE endpoints does not explain this data: every Bounds gap is zero. This does not rule out a bad reduction path proportional to a large operand or repeated successor reduction.

The original pinned Lean source provides a concrete reason to suspect the local term aliases:

- `/workspace/diagnostic-tools/lean-4.32.1-linux/src/lean/Lean/Meta/WHNF.lean:1020–1025`, `withNatValue`, rejects an argument containing free variables **before** attempting `whnf` on it. A local let is represented by an fvar while elaborating under its local context.
- `reduceBinNatOp` and `reduceBinNatPred` use `withNatValue`; `reduceNat?` dispatches `Nat.add` and `Nat.ble` to those fast paths at lines 1063–1071.
- `Init/Prelude.lean:1875` defines the logical `Nat.ble` model by recursive successor comparison. Its documentation explicitly says the compiler and kernel override it for efficient arbitrary-precision evaluation.
- `Init/Prelude.lean:2072–2073`, `Nat.decLe`, uses a decision on `Nat.ble n m = true` and an `isTrue` branch containing `Nat.le_of_ble_eq_true`. `of_decide_eq_true` is at line 1029. The latter theorem is an ordinary closed decidable-to-proposition rule; this inspection does not show that its proof payload is unavoidably expanded.

The strongest bounded hypothesis is thus **closed Nat computation obscured by local fvar aliases**, affecting LiteralAdd and potentially LiteralLE, so elaboration may miss the fast closed-numeral path and enter recursive reduction. This is more specific than blaming certificate size or the mere presence of `decide`. It remains a hypothesis: the failed run has no elaboration trace or isolated comparison proving causality.

Earlier diagnostic constructive witnesses at `/workspace/diagnostic-tools/canonical-theorem-audit-diagnosis/constructive.lean` use direct Nat.add_le_add applications and literal expressions, with no term arena of local aliases and no LiteralLE for the four equal-bound cases. Their previous success is useful context but cannot qualify this generated emitter.

## Smallest proposed correction and confirming regression

Keep the same checked input, certificates, rules, recipes, statements and empty policies. Change only generic term rendering so closed literal/additive expressions are exposed to Lean without local-fvar indirection. A bounded direct syntax renderer for certificate terms (variables, raw `nat_lit`, and explicit parenthesized addition), retaining named **proof** nodes, is a simple robust implementation candidate. It must preserve the original term syntax: do not replace an expression by a Rust-computed result as an unchecked proof, add a tactic fallback, or special-case a theorem/literal. A narrower closed-term-only renderer is possible, but must also handle nested closed additions, all proposition sides, lemma arguments and equality transports; replacing just the LiteralLE line leaves the earlier LiteralAdd hazard.

Expansion must be charged incrementally **before allocation** against the existing 1 MiB proof-text limit and original cumulative output/deadline budget. A certificate DAG can repeat a subterm, so its term-row count or normalized coefficient vector alone is not a bound on expanded syntax. Use an explicit bounded traversal/writer and refuse before appending beyond the cap. Do not inline proof-node DAGs or increase any adopted limit.

On resumption, first use small real **generated** proof outputs through the emitter/checker to separate: a large closed LiteralAdd; a large equal-endpoint LiteralLE; a nonzero-gap LiteralLE; and a small-literal control. Include u128 maximum/overflow controls already in the Rust suite and nested closed sums. Compare the failed emission strategy against the correction under the controller-required 1 GiB combined owned-process-group RSS stop and the existing cumulative <=300-second wall-time monitor (use shorter discriminating checks first), retaining original inputs, outputs and failures. No handwritten production Lean or weaker Bounds theorem is needed. If direct rendering resolves the bounded controls, regenerate the actual authored five Bounds plus generic variants, run original Lean and leanchecker and collect exact empty axiom sets. If it does not, preserve the new failure and diagnose further; do not widen allowances.

Add a regression that actually compiles and kernel-replays generated large-literal outputs within the fixed resource budget. A Rust assertion that emitted text lacks a local name, or another successful internal checker run alone, would not catch this elaboration failure. Retain the existing wrong-rule, malformed-certificate, byte-cap and cumulative-budget controls; add a shared-term expansion boundary control for the new renderer.

## Validation-owner limitations to repair before another heavy audit

The generated module retains the base backend's existing `maxRecDepth 100000` and `maxHeartbeats 1000000000`; those lines are byte-identical to the original `vendor/lexlean/src/backend/semantic.rs:1977`. No limit was raised by this candidate. The intended audit deadline is cumulative 300 seconds. The outer component runner has a separate 360-second bound for Rust compiler builds, an 8 GiB free-space floor and a conservative 500 MiB proactive growth stop beneath the 512 MiB hard cap.

The first audit wrapper (`evidence/audit.py:7–9`) uses `subprocess.run(capture_output=True)` and checks 16 MiB **after** the child finishes. Its outer runner sees only the wrapper's buffered output, not the child's live bytes. The timeout exception path also precedes the per-command log/receipt write. The observed failure had empty output and was retained because SIGTERM caused a normal subprocess return, but the wrapper is not yet a sufficient live output/timeout-failure owner. Before the next heavy audit, stream and bound each child's stdout/stderr while running, retain partial logs on every exit/timeout/guard stop, add explicit process-group RSS monitoring with the controller-required **1 GiB combined owned-process-group RSS ceiling**, and reap only the owned process group. This strengthens the diagnostic harness without altering proof semantics or extending the 300-second stage allowance.

Current implementation remains paused and uncommitted. The original source revision 463177a, original CLI hash, four Lean authority files and original root-rlib absence remain unchanged. Final component acceptance, independent review, final patches/report and later admitted derivation/SDK qualification are still pending.
