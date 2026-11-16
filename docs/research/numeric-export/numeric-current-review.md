# Independent current-port review

2026-11-16. Base: `b04af3550bb49c4e5bfdc0747a1e50cd58f13b81`; candidate worktree `/workspace/scratch/uorust-export-current`. Reviewed commit: **`46bdbc56ad99ac2bb73d6499863260a7fead9712`**, tree **`80dcc02ddd30b4e44788189ed81bac2c3d4db80f`**, with a clean worktree. Cumulative patch SHA-256: `135bc1e6c6bc2f8aebf169c3c3fcff729a268862e548d368c8e0b1867eb4fa40`. Reviewed the complete candidate changes and surrounding export/cache logic, policy validator, model, fixtures and retained diagnostic receipts. Candidate source was not edited by this reviewer; no passing suite was rerun.

**Verdict: scoped code/specification and static policy-fidelity review pass after fixing the carried-package bypass found during review. No remaining blocking defect found in the reviewed change. This is not release acceptance: the exact-SDK full gate remains uncompleted.**

## Admission and reuse boundary

The float guard belongs in the current upstream `Profile::mark` implementation, reached by both default and workspace export paths. It uses `Definitions::closure`, preserving the generated Behavior/Prelude static-reference semantics. Direct calls, same-module aliases, qualified Behavior aliases and a non-float-named Prelude alias are rejected before their closures become executable. The loaded but unused float Prelude does not reject integer or helper-free bit-identity roots. The non-default `meter()` control uses `rust-core` and demonstrates that changing profile scope, effects or target does not bypass the boundary. Public request filtering, batches and kappa-keyed refusal output remain correct.

This review found and required a second admission check in the newer upstream reuse path. Initially, `carry()` removed matching prior packages from the names passed to `Profile::mark`, while `production_build()` later published those carried packages independently of fresh-request admission. Source/compiler identities do not include the UORust admission policy. The targeted red regression confirmed the bypass on an unchanged verified project: `read` and `scale` were both carried, where only safe `scale` was expected.

The final implementation computes current marking decisions for all requested roots before retaining reusable artifacts. It excludes marked roots from carried candidates and prior compiler refusals, keeping the categories disjoint. Final production output persists the current marking refusal. The regression now checks `carry`, planning, production export and `sync`: one safe artifact reused, zero builds, one float refusal, only safe kappa `k2` certified, unsafe kappa `k1` refused, and the safe source hash unchanged. All three focused UE-21 tests pass. This closes the reuse finding without requiring a redundant compiler proof build.

The analysis remains conservative lexical reachability over generated Behavior/Prelude definitions, not general LexLean module resolution, runtime path analysis or a numerical bound proof. It does not establish every remaining root safe. No full IEEE implementation was repaired or exported.

## Policy and lock fidelity

The historical patch's modification of byte-bound `VERIFICATION.md` was a genuine packaging defect missed in the initial historical review. Explicit corrections are recorded in the historical report/review; the historical patch remains unchanged and not release-ready even with its exact SDK.

The current port places project evidence in `docs/numeric-export.md`. Independently recomputed all six `template.lock` policy hashes and compared bytes with current base: `.devcontainer/devcontainer.json`, `.github/workflows/bootstrap.yml`, `AGENTS.md`, `VERIFICATION.md`, `prismpm.lock`, and `template-contract.json` all match. `template.lock`, `standards.lock`, `Cargo.lock`, the bootstrap validator, Justfile and factory graph/upstream record are also unchanged.

Independent static checks passed canonical JSON for the template contract and both locks; closed policy paths and rows; policy-tree and contract digests; agreement on the immutable SDK image; SDK-index digest; both platforms' inventory document digests, artifact rows and manifest bindings; and the standards-lock digest. Exact hashes and predicates are retained in `numeric-current-evidence/independent-policy-check.json`. These checks do not replace the pinned SDK's complete template/lock validators or `just vv`.

UE-21 was unused at the base and is added consistently to the authoritative model, scenario, test names and regenerated CONFORMANCE.md. Existing factory UE-20 remains unchanged. The final claim explicitly covers unchanged prior artifacts. The documentation retains the distinction between local diagnostic evidence and full acceptance.

## Validation evidence and limits

Reviewed red receipts for both fresh-admission and cached-artifact defects, and their subsequent green results. Final post-fix diagnostics report **233 library tests, 12 CLI tests, and 16 repo-conformance tests passed** (1 library meta test, 4 BDD meta-gates, 2 factory, 3 ratchet and 6 self-model tests; zero doctests). Model checks report 27 IDs and CONFORMANCE.md equality. Error/deferral/dependency checks pass before SDK inventory refusal. I independently ran `git diff --check` and `bash -n scripts/probe-numeric-export.sh`; both passed. Raw receipts are in `numeric-current-evidence/`, including the final post-reuse log.

The numeric trace and primitive fixtures preserve the previously reviewed semantics, including explicit native success-value assertions. The probe script and four fixtures are byte-identical to the reviewed historical versions. Retained native/Wasm multiplication controls pass, including exact successful values, explicit wide-product overflow and zero Wasm imports. This is multiplication-primitive evidence from the available game SDK, not actual float-root export/replay under the current pinned SDK. The portable wrapper remains unexecuted end-to-end. No game correctness, CPU/GPU fidelity or performance conclusion follows.

The current lock selects patched SDK `c1bfe8d5d3b3473a2c2ca6fdd417158a3e9f5fff3b24dcbf587fe21d6fd9b635`, with amd64 inventory `d802737ecd17651465dc93640c052720bb361c1d158049ecfb5b9b25ca6c6f70`. Local diagnostics used the game SDK with inventory `0d4fe1864891ab1220a752d929a5a3a334f5987e0518a97f83f06fb5bdad105f`. The retained comparison records 17 differing/missing artifacts. Inventory validation correctly stops there; no pin or predicate was weakened. Full `just vv` under the exact current SDK remains required before release acceptance.
