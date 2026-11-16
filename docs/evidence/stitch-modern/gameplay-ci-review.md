# Gameplay CI followup review

Reviewed `23a3ad9..e506ab7`, comprising `dcb7dc6` and `e506ab7`. Both commits change only `scripts/browser-test.ts`. Read the retained failure from Pages run `43917054531`, final diff, production input/host queue consumers, implementation report, and focused green receipts. No production edits or broad test reruns performed by this reviewer; `git diff --check` for the scoped range passed.

## Spec verdict: PASS

The original failure sampled `z=22.309590373790655` after a fixed 900ms pulse while the camera was at yaw 1.1; later diagnostics already showed movement past the threshold. The repair establishes the axis-specific fixture through the existing production relative-mouse handler and waits for local and authoritative yaw/pitch agreement. It does not assign camera state or bypass network input processing.

Both clients must observe the positioned fixture before input. The original `z < 22` movement checks remain on both authoritative snapshots, with actual keyboard W held until the observations arrive. Combat retains remote and host health checks and adds an explicit authoritative ammunition-decrease assertion. Mouse down/up still exercise the existing production event handlers. The test now verifies eventual gameplay behavior within bounded waits, not a fixed wall-clock movement or firing latency.

Both clients retain actual scene rendering, real Performance mode, 1100×760 CSS viewport and DPR 0.5; visibility assertions remain and no hidden override was added. HD readiness, camera guard, operator animation, buy/economy, leave/character cleanup, ten-player practice and no-page-error checks are preserved. No production gameplay, guard, generated artifacts, dependency or renderer settings changed.

## Quality verdict: APPROVE

No remaining actionable finding. The final scoped repair is approved for the parent push and CI rerun; local success does not itself establish that the remote Pages deployment has passed.

Review identified a residual race in the initial repair: keyup delivery alone did not prove that queued W inputs had been processed before the exact combat teleport fixture. The `e506ab7` followup resolves it with a read-only host barrier. It captures the accepted sequence at release, observes a newer neutral packet in the real queue, and requires that same object to become processed input. The stale-input fallback allocates another object, so it cannot satisfy this observation. The barrier also requires neutral current movement, no queued moving packets and settled velocity. No queue, sequence, input or velocity is forced by the barrier; the existing teleport fixture runs only afterward.

The new movement and damage observation waits retain 30-second limits and release keyboard/mouse input in `finally`. The host release barrier has a 30-second deadline and 5ms polling, and prunes processed packet references. Fixture readiness and aim waits use the existing 30-second Playwright default. Failure handling writes the failed JSON receipt before browser diagnostic queries and tolerates an early page without scoreboard DOM. This is a bound on the new observation conditions, not a claim that every inherited browser diagnostic has a separate timeout.

## Evidence checked

- `artifacts/browser-release-barrier-green.log` and `browser-release-barrier-results.json`: all 11 checks passed, zero page errors. Release sequence 492 advanced to an observed processed neutral packet at 496, with forward/strafe zero, no queued movement and speed zero. Combat used yaw/pitch 0/0, ammo 30→29 and remote health 100→0.
- `artifacts/browser-release-barrier-tsc.log`: no TypeScript diagnostics; the implementer's final report records successful completion.
- `artifacts/browser-ci-failure-receipt.json` and `browser-ci-fix-receipt-test.log`: injected early failure produced failed status, exact error and both diagnostic records. The temporary injection was removed; canonical gameplay results are successful.

These are retained focused verification results inspected by this reviewer, not independently repeated browser runs. The actual Pages rerun remains the deployment gate.
