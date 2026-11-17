# Visible game experience refresh

The user prioritized visible graphics, sound, bots and bomb-objective improvements over experimental compiler integration. This release improves the existing modern tactical FPS on Pages using its working Verdant WASM physics, compiled round kernel, Prism metadata and Three.js presentation.

The present game already plants, defuses, detonates, selects a bot defuser, renders original weapon models and synthesizes positional cues. This release should make those systems easier to read and fix concrete bot limitations, without pretending the deferred compiler experiment or AQM has accelerated them.

## Approach

Use existing runtime components for a small, reviewable gameplay release. A wholesale renderer replacement adds risk without addressing objective clarity; another compiler/AQM integration detour is explicitly deferred. The user authorized autonomous execution and chose this priority; the particular presentation choices below are implementation judgment.

## Deliverables

- A compact planted-bomb HUD card: site, remaining fuse bar, defender kit/time requirement and local remaining defuse margin. Starting a defuse is never guaranteed by this estimate: travel and obstruction are not included. Teammate interaction should say to cover them, without inventing their kit/progress from unavailable snapshots. Hide the card on terminal/round transitions. Keep the existing hold-E progress and result feedback.
- A more readable physical objective: broken/hazard-style site paint, contrasting site signage, and an in-world bomb display driven by authoritative snapshot time. No x-ray markers through cover or changes to collision/site radius. Give weapons darker material separation and restrained original accent finishes, with managed texture resources if used.
- Distinct planting and defusing pulse cues while the local player actually interacts, stopped immediately on cancellation, death or round transition. Existing bomb countdown, volume, spatialization and bounded voice policy remain effective. No remote speech service or downloaded audio assets.
- Bots use a normalized three-dimensional ray from their eye to the visible target torso (including crouch/elevation) and handle zero separation without NaN. Objective movement refreshes immediately when its nearest navigation goal changes and can finish a short collision-clear approach when the graph returns an empty route at the same node. It must not walk straight through obstacles or replace the generated tactic decision model.

## Constraints

- No new dependencies, large assets, compiler builds, upstream pin changes or proof claims. Keep at least 8 GiB free disk space.
- Preserve authoritative host objective resolution, multiplayer protocol, generated tactic source/model and existing LexLean/PrismPM artifacts. Presentation estimates do not authorize interactions or wins.
- Use original art and audio. Preserve quality modes, volume controls, resource disposal and responsive HUD.
- Record tests and screenshots honestly, including fixed-snapshot/software-rendered fixture limitations. Publish only after review and relevant checks; verify the Pages build commit.

## Acceptance

Meaningful tests cover fuse/kit/progress transitions, audio cancellation/reset and voice limits, elevated/crouched/occluded bot targets, objective goal changes and blocked short approaches. Existing real-engine bomb lifecycle tests, full unit/build/artifact checks and objective/presentation browser tests pass. Real rendered before/after screenshots show the objective and weapon changes. Hosted verification and Pages publication complete for the release commit.
