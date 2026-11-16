# Focused browser CI harness repair

## Scope

Commit **dcb7dc6** (`Await authoritative browser input outcomes in CI`). Only `scripts/browser-test.ts` changes. No production code, rendering settings, gameplay rules/timeouts, dependency or generated artifact changes. No full-suite rerun. Both pages retain real rendered scenes, Performance mode, 1100×760 CSS viewport, DPR 0.5, and explicit `document.hidden === false` assertions.

## Red evidence and diagnosis

GitHub run **43917054531**, commit **23a3ad9**, failed the unchanged `z < 22` locomotion assertion with `z = 22.309590373790655` after a fixed 900ms W pulse. Preserved log: `artifacts/pages-0.9.0-failure.log`. Its later failure diagnostics show yaw **1.1**, pitch **0.874**, x **−2.838**, z **21.619**. Movement occurred, but the test sampled early and assumed an axis-aligned camera before establishing that camera. Chromium pointer-lock rebasing had changed relative aim; the existing relative-mouse fixture only normalized it later, before combat. The fixed 800ms fire pulse had the same slow-renderer sampling risk.

## Change

- Extracted the existing relative mouse fixture into `aimForward(page)` and call it before both locomotion and combat. It still tests a real dispatched mouse delta changes camera yaw, normalizes through the same handler, and awaits matching local and server-snapshot yaw/pitch. Locomotion also asserts authoritative host yaw/pitch directly.
- Await observable teleported coordinates on both clients before movement and before combat; no arbitrary positioning delay.
- Hold actual W until both client snapshots satisfy the original **z < 22** assertion, bounded to 30 seconds, then release W in `finally`. The existing post-input movement assertion and remote snapshot check remain.
- Hold the existing real mousedown until the remote player's actual snapshot health is below 100, bounded to 30 seconds, then mouseup in `finally`. Retained health checks and added explicit authoritative ammo-decrease assertion.
- On test-body failure, write `artifacts/browser-results.json` immediately with failed status, completed checks, error details and rendering scope before querying potentially stalled renderer diagnostics. Then augment it with both state/UI snapshots and retain console diagnostics. UI inspection now tolerates an early page without a scoreboard element.

## Green verification

- `npx tsc --noEmit`: passed. Log: `artifacts/browser-ci-fix-tsc.log`.
- `npm run test:browser`: passed, all ten reported checks, zero uncaught browser errors. Aim **yaw 0 / pitch 0**, rifle ammo **30 → 29**, opponent health **100 → 0**, with real shot/hit/kill/round events. Buy/economy, movement on both clients, HD/camera guard, 22-joint animation, screenshots, leave/slot cleanup and ten-player practice remain covered. Log: `artifacts/browser-ci-fix-green.log`; preserved receipt: `artifacts/browser-ci-fix-results.json` (also current `artifacts/browser-results.json`).
- Early-failure receipt check: a temporary copy of the runner injected a throw immediately after creating the artifact directory, before opening the first client. It exited nonzero and persisted the exact error, zero completed checks, and both state/UI diagnostics. The temporary file was removed and the successful canonical receipt restored. Failure receipt: `artifacts/browser-ci-failure-receipt.json`; log: `artifacts/browser-ci-fix-receipt-test.log`. This verifies the real catch path rather than asserting source text.
- `git diff --check -- scripts/browser-test.ts`: passed.

This fixes test setup and observation timing, not engine behavior or measured GPU performance. CI rerun remains the deployment gate; local successful software-rendered execution is evidence for this scoped repair.

## Review follow-through: observe the real movement release

Follow-up commit: **e506ab7** (`Observe processed key release before combat fixture`), changing only the browser runner.

Scoped review identified that `keyboard.up` alone does not prove the host consumed the release: previously queued W inputs could survive until after the combat teleport. The successful first run did not establish a semantic ordering barrier. The follow-up keeps the existing input path and adds only bounded read-only host polling:

1. Capture the host's `acceptedSeq` immediately before sending keyup.
2. Record references to queued neutral movement packets with newer sequence numbers.
3. Require an actual recorded packet object to become `pa.input` with matching `processedSeq`. `server/match.ts` creates a new neutral object for stale-input fallback, so that fallback cannot satisfy this observation even if another incoming packet resets `inputAge`.
4. Before combat teleport, require an observed newer real neutral packet, current neutral movement, no queued moving input, and settled horizontal velocity. Polls every 5ms with a 30-second deadline. It never clears or changes input/queue contents or production timeout behavior.

The focused rerun observed release sequence **492**, actual processed neutral sequence **496**, forward/strafe **0**, queued moving packets **0**, speed **0** before teleport. Combat then retained zero yaw/pitch, ammo **30 → 29** and remote health **100 → 0**. Logs: `artifacts/browser-release-barrier-green.log`, `artifacts/browser-release-barrier-tsc.log`. **The focused browser gate passed all 11 reported checks, with zero page errors; TypeScript passed.** Receipt preserved at `artifacts/browser-release-barrier-results.json`. No full suite was rerun.
