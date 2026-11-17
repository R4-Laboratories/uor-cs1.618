# Tactical experience refresh

This update puts the development effort back into the playable game. It uses the existing Verdant WASM engine, compiled Prism round kernel and Three.js/Web Audio client.

## Visible changes

- A planted-device card shows the site, fuse bar and countdown. Defenders see their kit requirement and remaining local defuse margin. The estimate excludes travel; it does not authorize a defuse or guarantee a win. When a teammate is defusing, the card asks you to cover them without inventing their progress.
- Planting and defusing have distinct recurring sounds that stop when the interaction is cancelled, the player dies or the round changes. Existing positional warnings and volume/voice limits remain in effect.
- Bombsites have stronger broken perimeter paint and contrasting signs. The physical device has a snapshot-driven countdown display. Weapons use darker receivers and clearer metal/polymer separation with original accent finishes.
- Bots trace sight from their actual standing/crouching eye to the target torso, including elevation. They refresh paths when the destination node changes and can finish a short, collision-checked same-node approach. Existing route-to-valid-defuse-position behavior remains intact.
- The objective HUD adapts to narrow portrait and short landscape/desktop windows, keeping the crosshair and interaction progress clear.

## Evidence

| View | Before | After |
| --- | --- | --- |
| Bombsite | [Original](evidence/game-experience-refresh/before-site.png) | [Updated](evidence/game-experience-refresh/after-site.png) |
| Rifle finish | [Original](evidence/game-experience-refresh/before-m4.png) | [Updated](evidence/game-experience-refresh/after-m4.png) |

[Nearby device](evidence/game-experience-refresh/after-bomb-near.png), [narrow phone](evidence/game-experience-refresh/after-objective-320x568-defusing.png) and [short desktop](evidence/game-experience-refresh/after-objective-800x450-defusing.png) show the additional presentation states. These are real Chromium/SwiftShader renders with fixed snapshots, not hardware performance measurements or full-match recordings.

The [presentation report](evidence/game-experience-refresh/presentation-report.md) and [review](evidence/game-experience-refresh/task-1-fix-2-review.md) record the changes and responsive repairs. The rendered fixture checks eight viewport sizes in local-defusing and teammate-cover states. Offline audio checks distinguish 16 cues and exercise voice limits, cancellation, restart, mute and cleanup. The objective browser gate uses real keyboard/WebSocket input and progress, followed by explicit late-progress/expiry fixtures for terminal outcomes; real-engine unit tests separately verify full plant/defuse/fuse durations.

## Runtime and improvement-loop boundaries

No dependency, external art/audio asset, upstream engine pin or compiled Prism artifact changes in this update. Host behavior and presentation are tested changes, not newly formally verified code. The existing round, evolution and identity guests remain mandatory; artifact checks retain their custody. The experimental compiler/AQM work is checkpointed separately and makes no claim of accelerating this release.

Both Pages publication and `scripts/evolution/tick.ts` already run the objective and presentation checks. The added regressions therefore apply to future accepted automated changes as well as this release.

## Release verification

`npm run verify` passes: **151 tests**, the generated-program/vendor/manifest checks, TypeScript/Vite build, **77 source/artifact hashes**, six upstream pins, import-free WASM and mandatory Prism runtime. [Verification receipt](evidence/game-experience-refresh/verification.json) and [full output](evidence/game-experience-refresh/verify-output.txt) retain the local results. The [bot report](evidence/game-experience-refresh/bot-report.md) and [review](evidence/game-experience-refresh/bot-review.md) cover 33 focused real-engine bot/objective tests, including the existing three legal-plant defuse regressions. The short fallback deliberately rejects some extremely tight clear approaches.

The existing [Pages workflow](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/pages.yml) requires the full multiplayer, identity, discovery, objective, experience and presentation browser suites before publication. The currently served revision is available in [build.json](https://r4-laboratories.github.io/uor-cs1.618/build.json).
