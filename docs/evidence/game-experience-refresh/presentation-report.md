# Task 1 implementation report

Status: complete and committed for parent review. No push or deployment performed.

Commit: `38ff4a7bff5adf06715b42cdd7d99e0ccc7cc0b5`

Branch: `game-experience-refresh`; task base supplied as `f67798b`.

## Scope and behavior

- Added the typed pure `plantedObjective` presentation helper. It reports the authoritative planted fuse fraction, local kit/no-kit duration, own remaining interaction time and timing margin. Teammate activity gets a cover state without estimating their kit/progress. Terminal, expired and non-live states hide the card; dead players receive no local timing estimate. Margin explicitly reads **LOCAL MARGIN · EXCLUDES TRAVEL**.
- Added the compact planted card below the round clock, a fuse meter, warning treatment and narrow viewport layout. Kept hold-E progress, contextual instructions and round results. A regression test caught stale local DEFUSING text when a teammate owns the defuse; both that prompt and the stale local progress bar are now suppressed.
- Replaced the thin site ring with broken industrial perimeter paint and larger floor letters, plus contrasting dark-backed site plaques. These are presentation meshes only; map geometry, collision, site centers and radii are unchanged.
- Gave the bomb contrasting hardware and an original top-mounted canvas countdown. One texture belongs to the persistent world bomb; snapshots repaint it only when displayed seconds or display state change. Weapon changes do not create or own this texture. A real renderer check verifies unchanged texture versions within a displayed second and updated versions across a displayed second.
- Darkened each weapon's receiver, separated metal/polymer finishes, and reduced painted handguard/stock coverage while retaining restrained original accents. No weapon textures were introduced; existing material and owned-geometry disposal remains covered by the existing repeated-switch test.
- Added bounded, distinct local planting and defusing pulse profiles, scheduled only for live, alive, authoritative local interaction. Cancellation, another defuser, terminal state, death, stop and round changes retire the current pulse immediately; restart emits a fresh pulse. Existing global voice admission, positional bomb warnings and volume behavior remain intact.

Owned changes only: `shared/objective-hud.ts`, `src/ui.ts`, `src/style.css`, `src/world.ts`, `src/audio.ts`, `shared/experience.ts`, `tests/presentation.test.ts`, `tests/objective-hud.test.ts`, `scripts/presentation-browser-test.ts`, `scripts/presentation-audio-test.ts`.

The optional objective test file is justified by pure timing/state behavior; no extra production helper files were needed. No dependencies, downloaded assets, toolchain/proof files, pins, generated tactic/model sources or network protocol changes.

## Verification

- `npx tsx --test tests/objective-hud.test.ts tests/presentation.test.ts`: **7/7 passed**. New tests cover kit/no-kit margin, own vs teammate progress, late/expired/terminal/freeze/dead states, pulse cancellation/restart/death/round transitions and authoritative defuser gating.
- `npx tsc --noEmit`: passed.
- `npm test`: **136/136 passed**, zero failures. Full output: `artifacts/presentation/unit-tests.log`.
- `npm run build`: passed. Full output: `artifacts/presentation/build.log`.
- `npm run test:presentation-browser`: passed. Full output: `artifacts/presentation/presentation-check.log`.
  - Real Chromium SwiftShader WebGL rendering; zero page errors.
  - Stable bomb rotation and terminal/card hiding.
  - Card content, local progress estimate, teammate-cover state and hidden stale local progress.
  - Canvas texture version stable within a displayed second and advancing at the next displayed second.
  - 390×844 objective card fits and clears the radar; lobby also fits.
  - Repeated weapon switches kept renderer memory counts at **54 geometries / 20 textures**.
  - Performance pixel ratio remained **0.7**, reload and switching animation assertions passed.
  - **16** distinct offline synthesized waveforms passed peak, stereo, source cleanup and silent-tail checks. Actual planting and defusing cancellation/restart each produced active voice sequence **1,0,1,0**. Existing bounded voice admission, stop, mute and resume checks passed.
- `git diff --check`: passed before commit. Working tree clean after commit (report is ignored task metadata).
- Free disk remained **8.4 GiB**; no installs or compiler builds.

Red/green evidence: initial helper tests failed because the helper was absent/null; initial interaction test failed because no progress pulses were emitted; rendered fixture failed waiting for the absent bomb card. After implementation all passed. Self-review added a regression assertion that initially exposed stale local DEFUSING text while a teammate owns the bomb interaction; it passed after the focused fix. One intermediate browser assertion used remaining=16.2 expecting a changed displayed second from 17, which was a fixture mistake because ceil(16.2)=17; corrected it to test both 16.8 staying17 and 16 changing the displayed second. Final combined presentation run is green.

## Evidence

Preserved all existing `artifacts/presentation/before-*.png` files. New evidence:

- `artifacts/presentation/after-site.png`
- `artifacts/presentation/after-sidearm.png`
- `artifacts/presentation/after-kestrel.png`
- `artifacts/presentation/after-m4.png`
- `artifacts/presentation/after-smg.png`
- `artifacts/presentation/after-scout.png`
- `artifacts/presentation/after-defuse.png`
- `artifacts/presentation/after-bomb-near.png`
- `artifacts/presentation/after-mobile-objective.png`
- `artifacts/presentation/after-performance.png`
- `artifacts/presentation/after-reload.png`
- `artifacts/presentation/after-switch.png`
- `artifacts/presentation/after-mobile-lobby.png`
- `artifacts/presentation/browser-results.json`
- `artifacts/presentation/audio-results.json`

I visually inspected the after-site, M4, near-bomb and narrow-objective screenshots. The stronger site paint, dark receiver and readable nearby bomb panel are visible. The final narrow-objective image shows teammate cover without the stale local progress bar.

## Limits and concerns

No known implementation blocker. Screenshots are fixed-snapshot, software-rendered fixtures, not evidence of a full multiplayer objective round or hardware performance. The fixture follows the existing harness/font-loading setup; the hosted application loads its fonts through its normal entry point. Existing Node experimental cryptography notices and Vite's vendor/template/frame/panels.mjs dynamic-import analysis warning appeared, with no test/page errors.

Parent noted that the supplied branch baseline predates newer remote-main bot routing. Parent clarified the 133-test presentation baseline is c22cc51; current remote main7889 adds three bot tests and does not alter the presentation baseline paths. The 136 count is for this task checkout, not a claim about current remote main; parent will integrate exact remote main and run the release checks. Bot task, full real-engine objective/browser release acceptance, remote integration and publication remain parent-owned. No compiler acceleration or proof claims are made.

## Review fix round 1 — short mobile HUD

Addressed the sole P2 in `task-1-review.md` with commit `1a8595e49ac6cea913d3a98f9a3f37ed1ee36950`, based on the parent-integrated branch at `f87b54c`. Only `src/style.css` and `scripts/presentation-browser-test.ts` changed.

The mobile card's fixed 250px top offset ignored available height. Short portrait now places the full card beside the radar, while short landscape places it at the top right beside the score bar. Session/feed positioning follows that card placement to keep the existing HUD elements apart. No timing information is hidden or reduced in font size; the tall portrait treatment remains in place.

The rendered fixture now covers active local defusing and teammate cover at **390×844**, **390×667** and **667×375**. It asserts the card stays inside both viewport axes; clears the radar, score bar and session label; clears a **72×64px aiming area by at least 6px**; clears the active hold-E panel; contains key site/directive/fuse/kit/margin text without horizontal clipping; and preserves visible progress only for the active local defuser. Canvas-size synchronization after a viewport change prevents a resize from clearing the first captured scene frame.

Commands and results:

- `npx tsx scripts/presentation-browser-test.ts > artifacts/presentation/responsive-red.log 2>&1` — expected RED: **390x667 defusing: card clears aiming area** failed with the original CSS. Earlier harness-only attempts exposed serialized helper naming and an unremoved TypeScript cast in a browser expression; corrected the test harness before the valid red reproduction.
- `npx tsx scripts/presentation-browser-test.ts > artifacts/presentation/responsive-green.log 2>&1` — **exit 0**, all six responsive states passed, **zero page errors**; existing rendered objective/weapon/resource checks also passed. Final output: `Presentation after: rendered screenshots captured; zero page errors.`
- `npx tsc --noEmit > artifacts/presentation/responsive-typecheck.log 2>&1` — **exit 0**, no output.
- `git diff --check` — **exit 0** before commit. Working tree clean after commit.

Measured active-defuse card rectangles (left/top/right/bottom): **390×844: 48/250/342/383**, **390×667: 134/105/378/236**, **667×375: 395/12/655/143**. All bounds, aiming/progress/radar clearance and readability assertions passed in both states. Detailed measurements: `artifacts/presentation/browser-results.json` under `responsive`.

Evidence: `artifacts/presentation/after-objective-{390x844,390x667,667x375}-{defusing,cover}.png` (six actual files), plus the preserved `after-mobile-objective.png`. Visually inspected the final short portrait and landscape active-defuse screenshots: the real scene is present, aiming lane and hold-E panel are clear, and the full bomb timing card is readable. These remain fixed-snapshot SwiftShader fixtures, not hardware-performance or multiplayer-flow evidence. The existing vendor dynamic-import analysis warning appeared without page errors.

As requested, no full unit suite or audio checks were rerun for this CSS-only fix. No pushes, dependencies/assets, bot changes or other source edits. Available disk remained **8.4 GiB**, above the 8 GiB floor.

## Review fix round 2 — fluid portrait sizing and short/wide HUD

Committed `858f2e1efb6b2d41581bb7e4c7eb348a3e869346` from parent base `171e15b`. Only `src/style.css` and `scripts/presentation-browser-test.ts` changed; no pushes.

Addressed the narrow radar collision with shared fluid sizing: the portrait card receives the width remaining after the radar, a 12px gap and outer margins. The radar scales from 110px to 70px only on the narrowest phones; the card retains at least 214px across the requested 320–390px portrait widths, with all existing timing text and font sizes. Extended the side treatment through 850px height after the boundary sweep exposed aiming clearance failures immediately above the old 740px cutoff.

At the parent's additional requested check, actual layout confirmed 800×450 failed aiming-area clearance while 1024×600 passed. The existing compact landscape treatment now applies across viewport widths through 550px height and owns its complete placement, including radar below the scores. Screenshot self-review caught the desktop score bar initially covering the radar; added a score/radar separation assertion and corrected that placement before commit. The orientation selector also preserves the earlier treatment below 550px landscape width; final checks include 540px rather than introducing a minimum-width regression.

Verification:

- `SWEEP_OUTPUT=artifacts/presentation/layout-sweep-red.json npx tsx artifacts/presentation/layout-sweep.ts` — development RED: 61/140 states failed, including the reported narrow radar overlaps and old height-boundary aiming collisions.
- Actual-UI/CSS expanded development sweep: **294 states passed**, spanning widths 320–1024, portrait heights 568–900 and wider short cases from 450px. Output: `artifacts/presentation/layout-wide-green.log` (`{"total":294,"failures":0,"examples":[]}`); measurements in the corresponding JSON. The temporary layout-only script and outputs are ignored evidence files, not additional committed source.
- `SWEEP_OUTPUT=artifacts/presentation/layout-final-check.json npx tsx artifacts/presentation/layout-final-check.ts > artifacts/presentation/layout-final-check.log 2>&1` — final selector/boundary check: **exit 0**, **24/24 passed**, widths 540/550/800/1024 × heights 450/550/600 × own/cover states. This checks the final all-width landscape selector, including widths below the initially considered 550px cutoff.
- `npx tsx scripts/presentation-browser-test.ts > artifacts/presentation/responsive-fix2-browser.log 2>&1` — **exit 0**, **16 rendered responsive states passed**, zero page errors. Viewports: **320×568, 360×640, 375×667, 390×667, 390×844, 667×375, 800×450, 1024×600**, each with local defusing and teammate cover. Existing viewport/text/aiming/progress/radar/score/session checks remain, with the new score/radar separation assertion. The final selector preserves the same placement for these 16 rendered states.
- `npx tsc --noEmit > artifacts/presentation/responsive-fix2-typecheck.log 2>&1` — **exit 0**, no output. `git diff --check` passed; working tree clean after commit.

Evidence: `artifacts/presentation/browser-results.json` now contains all 16 states. Real rendered screenshots are `after-objective-<width>x<height>-{defusing,cover}.png` for the eight sizes above. Visually inspected 320×568 and 360×640 active-defuse captures and the final corrected 800×450 active-defuse capture: full timing text remains inside the card; radar, aiming area and hold-E panel are unobscured. The 800×450 capture confirms the score bar clears the radar. Original before screenshots remain untouched. Fixture limits remain fixed snapshots, fallback-font harness setup and Chromium SwiftShader, without multiplayer/hardware-performance claims.

No full suite, build or audio rerun for these scoped CSS changes, as requested. Existing vendor dynamic-import analysis warning appeared without page errors. Disk remained **8.4 GiB free**, above the required floor. No remaining blocker or additional cosmetic work proposed.
