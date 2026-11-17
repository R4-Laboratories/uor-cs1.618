# Bot defuse routing repair

Bots now use the same three-dimensional reach and hand-to-device line-of-sight check as authoritative defusing. When cover blocks that check, the assigned bot navigates to a valid approach position, even inside its usual arrival cutoff or when the bot and bomb map to the same navigation node. The final approach waypoint stays active until the device can actually be reached.

The original bug was reproduced after a legal 180-tick site A plant on Meridian: a kit defender beside the crate attempted defusal without moving for all 2,400 bomb ticks, made no progress, and lost the round. A valid route existed.

| Regression | Before | After | Bomb time remaining |
| --- | --- | --- | --- |
| Crate corner | Explosion; no movement/progress | Defuse at tick 313 | 34.783 seconds |
| Blocked distance below 1.2 | Explosion; no movement/progress | Defuse at tick 309 | 34.850 seconds |
| Same snapped navigation node | Explosion; no movement/progress | Defuse at tick 311 | 34.817 seconds |

These deterministic simulations use the actual Verdant and round Wasm modules. Each asserts legal planting, movement, authoritative progress, exactly one defuse and score award, positive remaining time, and no later duplicate result. Existing interaction distance, obstruction checks, grounded/stationary requirements, kit duration, bomb timer and single-defuser coordination are preserved.

Validation: 136 tests passed; full game verification, production build and artifact checks passed; the existing objective browser gate passed with zero page errors. That browser gate checks human keyboard/WebSocket/HUD behavior with rendering paused and accelerated terminal fixtures; the new simulations exercise the full bot lifecycle. Independent task review found no issues.

This uses the existing ground navigation graph. It does not add jumping/climbing navigation or prove reachability for arbitrary elevated placements. The compiler/numeric experiments remain separate from this repair.
