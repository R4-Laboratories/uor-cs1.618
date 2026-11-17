# Task 1 review

Reviewed task commit `38ff4a7bff5adf06715b42cdd7d99e0ccc7cc0b5` against supplied base `f67798b`, using `task-1-brief.md`, `task-1-report.md`, and the supplied task diff. Parent's later main integration is outside this review.

**Spec compliance: changes requested.** The implementation covers the pure planted-state helper, kit/no-kit estimates, authoritative own-defuser gating, teammate cover, terminal/dead/transition handling, explicit travel exclusion, original site/bomb/weapon presentation, cached countdown texture updates, bounded cancellable interaction cues, and expanded unit/browser/offline-audio evidence. One responsive HUD requirement remains unmet on shorter mobile viewports.

**Code quality: changes requested for one P2 issue.** No other important correctness, authority, protocol, audio resource, or weapon ownership findings in this diff. The timing calculation agrees with the host's normalized progress (`server/match.ts:189`); estimates remain presentation-only. The diff stays within the ten owned files, with no dependency, asset, toolchain, pin, proof, generated-model or host changes. The persistent world's bomb texture is not recreated by weapon switching. The report accurately limits screenshots to fixed-snapshot SwiftShader fixtures.

## Finding

- **P2 — Adapt the planted card to short mobile viewports.** `src/style.css:26` applies `top:250px` to every viewport at most 700px wide, while the short-height override at `src/style.css:27` only applies above 700px. At a common **390×667** viewport the defender card occupies **y=250–383**, directly across the aiming lane/crosshair (**y=320.5–346.5**). At **667×375** landscape it overlaps the hold-E progress panel (**y=221.25–273.25**) and extends below the viewport (**bottom=383**). Its opaque background obscures world visibility during the live planted phase; the landscape case also loses timing content and crowds interaction feedback. Add a short-height mobile treatment that keeps the card readable and away from aiming/progress, and extend the fixture to cover shorter portrait and landscape layouts. The existing 390×844 assertion checks width and radar clearance only, so it misses both failures.

## Minor findings

None worth blocking or expanding scope for.

## Review validation and limits

- Read the supplied diff once (retrieved the truncated middle separately), then inspected surrounding code only for the named timing, ownership, and responsive-layout risks.
- Did not rerun the reported passing suites or alter code, index, or git state.
- Ran a targeted headless Chromium layout reproduction with the existing `src/style.css` and the new card markup; it measured the rectangles above. This isolated CSS reproduction used fallback fonts and is not a full game-flow test. At the reported 390×844 fixture size, the same card ended at y=383 and cleared the crosshair at y=409–435.
- Consulted existing `artifacts/presentation/browser-results.json`; its recorded geometry/texture switch counts remain stable and it reports no page errors. Full test/build/audio pass claims are implementation-report evidence, not independently rerun here.
- Disk availability was **8,959,877,120 bytes (8.34 GiB)** during review, above the 8 GiB floor. No installations or downloads.
