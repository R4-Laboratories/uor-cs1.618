# Task 1 fix round 1 review

Reviewed `1a8595e49ac6cea913d3a98f9a3f37ed1ee36950` against supplied base `f87b54c`, limited to `task-1-fix-1-diff.txt` and the appended implementation report. No broad source review or passing-suite reruns.

**Original P2: addressed at the reported sizes.** The new portrait/landscape placements clear the original aiming/progress collisions at 390×667 and 667×375. The expanded fixture meaningfully asserts viewport bounds, aiming-area clearance, progress visibility and clearance, radar/clock/session clearance, and text containment for active defusing and teammate cover. Its six reported passing states and fixture limitations are clearly documented.

**Fix verdict: changes requested for one new P2 introduced by the fix.**

- **P2 — Make the portrait side placement fit widths below 390px.** `src/style.css:29` places a fixed **244px** card at `right:12px;top:105px` for every mobile viewport up to 740px tall. The existing radar occupies **x=12–122, y=105–241**. Consequently at **360×640** the card occupies **x=104–348, y=105–236**, obscuring an **18×131px** strip of the tactical radar; at **320×568** the obscured strip is **58×131px**. Even **375×667** overlaps by 3px. This is a new collision created by moving the card beside the radar. Adapt that placement/width to the available horizontal space while keeping its text readable, and add a narrower portrait fixture (360px or 320px) so the new radar-clearance assertion exercises it.

No additional important or minor findings in the fix diff.

Validation: ran only an isolated headless Chromium CSS-layout reproduction using the current existing stylesheet and the card/radar markup, with fallback fonts. The measurements above are direct bounding rectangles; horizontal overlap follows from the fixed widths independently of font choice. No implementation files, index, or git state were changed, and no suites were rerun. The implementation report's passing actual rendered fixtures remain valid evidence for the three tested viewport sizes, not the narrower widths above.
