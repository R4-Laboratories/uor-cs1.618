# Stitch Matches and Modern Tactical Gameplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship verified Stitch room discovery plus a clear, more polished modern tactical game.
**Architecture:** Signed short-lived discovery over the pinned Stitch bus wraps the existing authoritative WebRTC rooms. Objective, bot and presentation improvements retain the Verdant Wasm and compiled Prism boundaries.
**Tech Stack:** TypeScript, Three.js, WebRTC/PeerJS, Stitch, WebCrypto, Verdant Wasm, LexLean/PrismPM.
**Spec:** docs/superpowers/specs/2026-11-16-stitch-modern-design.md

## Global Constraints
- Public rooms by default, private invite-only rooms available; explicit publication disclosure.
- Modern CS-style presentation/mechanics; original assets only.
- Existing compiled round/evolution/identity guests remain mandatory; no fabricated whole-game proofs.
- No TURN credentials, private keys or Me data in listings; no paid dependency.
- Bounded discovery records, 45-second leases and 20-second host refresh; no unverified discovery joins.

## Review Focus
- Signed but malicious listing endpoints, replay, host substitution and oversized records: task 1.
- Relay outage, canceled startup, disconnected host and private-room nonpublication: task 1.
- Objective cancellation, death, wall obstruction and deadline boundary: task 2.
- Several bots competing for a defuse and unseen targets: task 2.
- Repeated weapon switches, audio voice budget and narrow screens: task 3.

### Task 1: Verified Stitch match directory
**Files:** shared/match-discovery.ts, src/match-directory.ts, src/peer-room.ts, src/main.ts, src/ui.ts, src/style.css, tests/match-discovery.test.ts, scripts/discovery-browser-test.ts and related identity adapters/model metadata.
**Interfaces:** Match directory exposes bounded verified public listings, start/stop/refresh and signed host publication. PeerRoom.start accepts optional host identity session and expected host identity; discovery joins require a live proof before welcome/snapshots are delivered. Exact types owned by this task and documented in its report.
- [x] Write and observe failing tests for real signed listings, stale/tampered/replayed records, bounded input and host-substitution refusal.
- [x] Implement pinned Stitch relay use, compiled Holo admission, listing leases/withdrawals, live host challenge and public/private UI.
- [x] Add real two-browser directory publication, discovery and authenticated WebRTC join, plus private and outage coverage. Inject relay HTTP only at the external boundary for reproducibility; use actual Stitch framing/signatures.
- [x] Run unit suite, build and targeted discovery/peer/identity browser checks. Commit and review.

### Task 2: Bomb objective reliability and tactical bots
**Files:** server/match.ts, shared/protocol.ts, src/ui.ts, new focused objective helper as needed, tests/objective*.test.ts, tests/bot*.test.ts, scripts/objective-browser-test.ts.
**Interfaces:** Preserve public snapshot compatibility by using optional/additive fields where needed; add objective events for interaction/reload/pickup/drop as typed GameEvent variants for task 3 audio. Continue using compiled RoundKernel and generated tactic decider.
- [x] Write and observe regression tests for full objective lifecycle, timing/interruptions and cooperative bot behavior using real engine/kernel.
- [x] Implement objective correctness fixes, persistent team-specific instructions/distance/progress, and bots with single defuser/cover plus bounded perception/reaction/fire control.
- [x] Exercise full plant/defuse/explosion in the browser or actual host transport and verify winner through the real kernel.
- [x] Run unit suite and objective/browser gates. Commit and review.

### Task 3: Modern map, weapons and sound
**Files:** src/world.ts, src/audio.ts, shared/audio-program.ts or focused new modules, src/style.css, relevant presentation tests/browser script.
**Interfaces:** Consume task 2 typed events and snapshots; retain WorldView/render/quality and GameAudio public methods used by existing tests. Preserve generated-experience/artwork integration.
- [x] Establish failing behavior tests for new distinct audio cues/cleanup and bounded weapon lifecycle. Capture baseline views.
- [x] Improve original weapon models/skins, reload/switch motion, site readability, map materials/detail and planted bomb display without changing colliders.
- [x] Add spatial objective feedback and distinct round/reload/equipment sounds with existing limits.
- [x] Verify screenshots and audio/browser checks at normal and performance quality, repeated switches and mobile lobby. Commit and review.

### Task 4: Integration, evidence and publication
**Files:** package.json/lock, .github/workflows/pages.yml or current Pages workflow, docs and evidence records; generated artifact bindings only when required.
- [x] Add new browser gates to CI and evolution admission; npm run verify and all eight browser suites passed locally. Custody verified; Rust unchanged, so UORust projection regeneration is not applicable.
- [x] Whole-branch review: approved with no blocking findings; limitations and progress ledger recorded.
- [ ] Reconcile autonomous commits, push authorized changes, observe successful Pages deployment and verify public build/room UI.
- [ ] Publish release with source/client/evidence and provide live URL with truthful scope.

Integration 0.9.0: local gate results, initial rendered-gameplay harness failure/retry and proof/performance/service limits are retained in docs/RELEASE-0.9.0.md and docs/evidence/stitch-modern/. Whole-branch review passed. Upstream reconciliation, publication and deployed-origin probe remain parent-owned; the open boxes above are intentional.
