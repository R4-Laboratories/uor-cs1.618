# Native Golden Game Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and independently review the original PrismPM native golden outputs on real GitHub-hosted amd64 and arm64 runners without upstream publication.

**Architecture:** A game-owned workflow restores a separately captured, clean PrismPM source commit and invokes its unchanged native-golden owner. A closed game orchestration envelope binds the actual game run to that separate source and original raw output. Import only byte-identical reviewed products; leave final full-VV and numerical admission to the parent plans.

**Tech Stack:** Python, original Node22.23.2 native-golden owner, GitHub Actions ubuntu-24.04/ubuntu-24.04-arm, original locked development images and immutable Git transport.

**Spec:** `../../research/numeric-export/recovery-2026-11-16/native-golden-game-adapter-recon.md` records the accepted concrete design and exact original-owner gates. Parent dependency: `2026-11-16-bounded-numeric-kernels.md` Task2c / `2026-11-16-candidate-source-capture.md` Task4.

## Global Constraints

- Keep original source native-golden owner/test/workflow and native-review/1 schema unchanged. Its helper inventory is already corrected to19 atsource324; do not repeat that repair.
- Real GitHub-hosted Linux runners: ubuntu-24.04 amd64 and ubuntu-24.04-arm arm64, fail-fast false, max-parallel2, timeout75minutes. Preserve original pinned checkout/setup-node/buildx/buildkit/artifact actions and Node22.23.2.
- Never forge GITHUB_* or RUNNER_* variables. Pass source revision explicitly to the original owner, retaining distinct actual game execution SHA.
- Retain original development-only image index42213da87c564d859e327ab7df2459357d674fa538050f13905caa24c352588e and environmentrevision6ebbef86a300ff4490c4c37f821e50585e211481 via exact source locks; this is not original-d6 SDK admission.
- Original native owner reserve12GiB plus measured compressed image bytes, dependency22controls, seed38controls, resource/command/cache bounds, authentic cleanup and failure retention remain unchanged. Never pull full images locally; retain >=8GiB locally.
- Source must be fresh/clean with genuine reviewed shared goldens. Original native destination is absent before owner start; sibling wrapper evidence is distinct. No global Cargo/compiler/shell overrides or source chown/devcontainer substitution.
- Exact original commands: `node scripts/native-golden.mjs tests`, then `node scripts/native-golden.mjs run SOURCE_REVISION OUTPUT`. No filtered command, owner seam, forged record, baseline reserialization or early acceptance.
- Capture complete original owner products and bounded observer diagnostics even on failure. Completeness means `complete-review-required`, never acceptance. Three raw native records per architecture, six total.
- No upstream push/PR. Authorized game diagnostic branch push is allowed after review; final Pages/main remain governed by parent gates.

## Review Focus

- Correct source SHA with wrong real repository/run/architecture must fail the game identity joins (Task1).
- Successful exit with missing/truncated original logs or products must remain incomplete (Task1).
- Stale success sidecars after a failed retry cannot survive or imply completeness (Task1).
- Source/owner/locks mutated during generation must be caught by before/after custody (Task1).
- One architecture succeeding cannot qualify the other or license normalized/imported replacements (Task2).

---

### Task1: Reviewed native workflow and independent orchestration retention

**Files:** Create `.github/workflows/prismpm-backport-native-golden.yml`, `scripts/numeric/native-golden-preparation.py`, `scripts/numeric/tests/test_native_golden_preparation.py`, and `scripts/numeric/prismpm-native-candidate/{manifest.json,candidate.bundle,candidate.patch,README.md}`. Reuse `scripts/numeric/restore-prismpm-candidate.py` without broadening its authority. Leave historical shared/full-VV snapshots intact.

**Interfaces:** Python CLI phases `prepare`, `collect`, with source/snapshot/evidence/output paths bound by the workflow. `prepare(source:Path,snapshot:Path,evidence:Path,output:Path,lane:str)->dict` restores exact captured source and initializes incomplete game provenance before helper execution. `collect(source:Path,snapshot:Path,evidence:Path,output:Path,lane:str)->dict` verifies original complete owner outputs plus real run/source/platform/command/log joins and returns only incomplete or complete-review-required. Concrete closed envelope fields must be frozen in implementation brief before dispatch, based on this spec; no arbitrary extra keys or weak self-consistency-only identity checks.

- [ ] Freeze one independently reviewed source commit/tree after source-capture Task3 and the accepted shared import; capture it with existing authenticated bundle/patch mechanism, using an independent native snapshot directory. Verify clean original source and restorability before publishing metadata.
- [ ] Add focused red controls for real game/source separation, wrong run/attempt/repository/architecture, stale snapshot/owner/lock hash, absent owner review, failed helper/owner/observer, missing/extra/aliased/oversized retained file and truncated required logs. Fixtures are structural evidence, never real native generation.
- [ ] Implement explicit restoration plus a separately owned closed `cs1618/prismpm-native-golden-orchestration/1` envelope, binding real repository/workflow/game SHA/run, separate source authority and transport, runner lane/native profile, original owner/test/workflow/environment-lock identities, exact command exits, original review/raw-record/product hashes and complete retained inventory. Preserve raw source-native schema bytes.
- [ ] Implement native workflow with both original lanes/pins/limits, real nonroot host ownership, original observer and two exact commands, fresh original output directory, contents-read permissions, narrow numeric-kernels path trigger and workflow_dispatch. Final collection/upload runs on failure; original status must propagate. Never overwrite GitHub identity or source workflow.
- [ ] Run `python3 -m unittest discover -s scripts/numeric/tests -p test_native_golden_preparation.py` and affected immutable-restoration controls. Verify workflow runner/pin/command/always-retention invariants. No local Docker/full SDK.
- [ ] Commit isolated wrapper/tests/workflow/snapshot, with evidence and independent task review before triggering.

### Task2: Actual two-architecture generation, byte review and import

**Files:** Retain actual verified workflow artifacts under existing numeric recovery evidence; modify only original six native golden paths in source after independent review, then capture final source separately for parent acceptance.

**Interfaces:** Consume reviewed Task1 snapshot/envelope; actual owner output contains `review.json`, environment/acquisition/command evidence, original three records and complete generated products. Independent reviewer verifies original unchanged owner semantics, exact authority/identity/command joins and both architecture-specific byte outputs before import.

- [ ] Push reviewed game diagnostic changes under existing authorization; record actual run IDs/game/source SHA and both lane conclusions. Keep previous failed evidence intact.
- [ ] Independently verify actual artifact API sizes/hashes and safely extract bounded original output. Read failure outputs precisely; repair only demonstrated failures with focused review before rerun, never relabel structural controls as native success.
- [ ] Review both complete real envelopes and all six raw records/products against original source writer and locks. A missing/failed lane keeps the prerequisite open.
- [ ] Import only exact six reviewed raw file bytes at original source paths. Verify all unrelated paths unchanged, preserve original reasons/hashes/record schemas, commit and independently review byte equality. No handwritten replacement or regeneration on the controller.
- [ ] Capture the final clean source with both approved baselines for parent full-VV/SDK/retained-reader/corpus gates. This closes native-baseline preparation only; not SDK, game or source-free acceptance.

## Self-review

Task1 owns actual game/source identity separation, closed independent retention, failure truthfulness and original-command preservation. Task2 owns measured real architecture results and exact-byte import. Original-owner design supplies all fixed runtime bounds and closure requirements. Final source validation and game publication remain explicitly assigned to the parent plans. No new effective LexLean compiler is admitted by this plan; any later constructive-proof backport must independently establish whether regeneration is needed. Execution method and game diagnostic publication were already authorized; no new permission is pending.
