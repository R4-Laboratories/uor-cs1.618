# Final Pages objective HUD synchronization fix

Scope: uncommitted change to `scripts/objective-browser-test.ts` only, based on merged HEAD `de43a992`. No production source, timing, transport, input, or assertion changes. No commit until review.

## Cause and observed failure

Pages run `43932719362`, build job `133529115652`, failed the plant text assertion with ` · 10.0s`. Receipt remains at `artifacts/pages-final-merge-failure.log`; the preceding PR run `43932604632` passed the same code.

`receive()` in `src/main.ts` updates the client snapshot immediately when a WebSocket message arrives. `frame()` updates the DOM HUD only when `uiTime > .08`. `src/ui.ts` computes the idle objective text with an empty action and default ten-second duration while the objective is hidden. Thus a positive plant snapshot can legitimately coexist briefly with the previous hidden idle label. The old gate waited for snapshot progress but read the DOM immediately. CI captured exactly that interleaving: host/client plant progress and input were valid, while the DOM still held its idle label. This is a test synchronization race, not evidence that a visible player HUD shows an invalid interaction.

## Fix

Both plant and defuse paths retain their real snapshot progress waits and all original assertions. Before reading/asserting rendered interaction text, they additionally wait for current positive snapshot progress, visible objective container, positive rendered progress width, and the expected PLANTING/DEFUSING label. A missing or wrong HUD still fails the bounded wait. No sleep, mock, skip, timeout increase or fixture change was added to the mandatory gate.

## Evidence

- Existing failed CI receipt supplies the real red failure.
- Isolated diagnostic `artifacts/objective-hud-delay-repro.ts` delays only the DOM label setter by 400ms. It does not modify production files or the mandatory gate. It deterministically observed a positive real host/client interaction snapshot with stale label `· 10.0s`, confirmed that label does not satisfy the old plant assertion, then passed the new synchronization and the complete focused gate. Log: `artifacts/objective-hud-delay-repro.log` (exit 0).
- Initial focused normal gate: `artifacts/objective-hud-sync-green.log` (passed).
- Final exact-content focused gate: `artifacts/objective-hud-sync-green-final.log` (**passed, exit 0, zero page errors**).
- `npx tsc --noEmit` and `git diff --check`: **passed, exit 0**.

The existing focused gate still uses its explicitly documented late-progress/expiry host fixtures and HUD-only render isolation; this patch changes neither their scope nor the retained objective assertions. No full build/release verification rerun was necessary for this test-only fix.
