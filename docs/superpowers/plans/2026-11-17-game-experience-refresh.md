# Game Experience Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship visible objective, weapon, sound and bot improvements to the playable Pages game.

**Architecture:** Reuse existing Three.js/Web Audio presentation and Verdant-backed authoritative Match. Keep the compiled round kernel and generated tactic decision program intact.

**Tech Stack:** TypeScript, Three.js, Web Audio, Verdant WASM, existing LexLean/PrismPM artifacts, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-17-game-experience-refresh-design.md`

## Global Constraints

- No new dependencies, large assets, compiler builds, upstream pin changes or proof claims. Keep at least 8 GiB free disk space.
- Preserve authoritative host objective resolution, multiplayer protocol, generated tactic source/model and existing LexLean/PrismPM artifacts. Presentation estimates do not authorize interactions or wins.
- Use original art and audio. Preserve quality modes, volume controls, resource disposal and responsive HUD.
- Record tests and screenshots honestly, including fixed-snapshot/software-rendered fixture limitations. Publish only after review and relevant checks; verify the Pages build commit.

## Review Focus

- Defuse already in progress needs remaining duration, while another defuser's unknown kit/progress must not be invented (Task 1).
- Cancellation, death and terminal snapshots must clear interaction sound/card (Task 1).
- Repeated weapon switches must release owned textures and keep shared resources alive (Task 1).
- Crouch/elevation/zero-distance targets must not allow invalid sight rays or through-wall shots (Task 2).
- Replanning or direct final approach must not bypass collision, especially unreachable objectives (Task 2).

### Task 1: Objective presentation, weapon finish and interaction sound

**Files:** `shared/objective-hud.ts`, `src/ui.ts`, `src/style.css`, `src/world.ts`, `src/audio.ts`, `shared/experience.ts`, `tests/presentation.test.ts`, optional `tests/objective-hud.test.ts`, `scripts/presentation-browser-test.ts`, `scripts/presentation-audio-test.ts`.

**Interfaces:** Existing Snapshot/Motion and GameAudio.update remain compatible. Add a typed pure presentation helper in objective-hud for planted state/fuse fraction/defuse duration/margin; UI consumes it. WorldView consumes snapshot fuse only. AudioEvent may add local `plant-progress` and `defuse-progress` types without network changes.

- [ ] Add meaningful failing tests for kit/no-kit margin; own active progress vs another defuser; expired/terminal/freeze/dead states; interaction pulse cancellation and restart. Choose exact UI copy clearly stating that margin excludes travel.
- [ ] Implement the compact card, progress styling and responsive layout. Keep hold-E progress, context hint and result flow.
- [ ] Enhance site paint/signage and physical bomb display. Update canvas texture only when its displayed second/state changes. Improve weapon material separation with original restrained accents; manage any new texture ownership. Never change physics/map collision.
- [ ] Implement distinct bounded planting/defusing pulse profiles and update gating; retain existing voice cap and bomb warnings. Extend offline audio checks to both cues.
- [ ] Run focused unit tests, TypeScript/build, real presentation browser screenshots and offline audio checks. Extend rendered fixture assertions for card state and display, narrow viewport fit and switching resources. Preserve before screenshots.
- [ ] Self-review and commit explicit owned files. Write implementation report with commands, outcomes and evidence paths. No push; parent coordinates release.

### Task 2: Bot sight and objective approach

**Files:** `server/match.ts`, `tests/bot-objective.test.ts` (or focused new bot test file), `server/navigation.ts` only if necessary for safe same-node handling.

**Interfaces:** Keep generated BotFacts/tacticDecider and multiplayer snapshots unchanged. Existing Player.botGoal is available for nearest-goal invalidation; reset it at spawn. Use VerdantEngine.ray/move for sight/collision.

- [ ] Add failing behavior tests for elevated/crouched visible targets, actual cover obstruction, overlapping targets with finite inputs, changed objective goal before old replanning interval, reachable short same-node goal and blocked/unreachable approach.
- [ ] Use normalized 3D eye-to-target torso ray and full distance for sight. Preserve reaction delay, burst recovery and friendly-fire prevention.
- [ ] Refresh navigation immediately when nearest goal changes. When the graph has no remaining route, only use a short direct final approach if collision checks admit the entire segment; do not turn an unreachable route into blind movement. Reset goal tracking on spawn.
- [ ] Run focused real-engine bot/objective tests and full unit tests; retain integration/lifecycle cases. Self-review and commit explicit owned paths, write report. No push.

## Release verification (parent)

- [ ] Independent task reviews and final branch review; fix material findings.
- [ ] `npm run verify`, objective and presentation browser tests; hosted workflow covers remaining multiplayer/discovery/identity gates.
- [ ] Add concise release evidence/changelog, push reviewed code to main within existing authorization, inspect Actions and verify live build.json commit. Infrastructure branch is a separate checkpoint and not part of this release.
