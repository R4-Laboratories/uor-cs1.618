# Task 2 implementation report

Base: `171c5cf` on `game-experience-refresh`. Implementation commit: `280edc8` (`Fix bot 3D sight and bounded objective approaches`).

## Scope and behavior

- Changed only `server/match.ts` and added `tests/bot-sight-navigation.test.ts` for the implementation commit. Existing `server/navigation.ts`, `tests/bot-objective.test.ts`, generated tactics, snapshots, proof/model artifacts and compiler pins are unchanged.
- Sight now uses the bot's current crouched/standing eye to the target's crouched/standing torso, normalized in all three dimensions, with full distance used for the 45 m visibility limit. The same eye is used for aim and friendly hitbox checks. Zero separation never divides by zero; nearly vertical aim stays within the input pitch bound.
- A changed nearest navigation goal clears the previous route/replan timer immediately. Spawn resets `botGoal`.
- The general empty-route final approach requires the same nearest node, a distance of at most 3 m, and a clear complete segment. It runs at most 18 real Verdant move sweeps, each at most 0.17 m. Sweeps enlarge the player radius by the step length to enclose the straight segment despite Verdant's X-then-Z axis slide. A single endpoint equality is deliberately insufficient.
- Defuse approach never enters that general fallback. The existing `canReachDevice`/`defusePath` valid-interaction routing remains intact, including keeping its final waypoint until geometry admits interaction.

## Test-first evidence

Before changing production code, `./node_modules/.bin/tsx --test tests/bot-sight-navigation.test.ts` failed eight cases for the expected missing behaviors: elevated target acquisition, crouched-eye aim, actual torso cover obstruction, vertical range, finite overlapping-target geometry, changed-goal replanning, same-node dropped-device retrieval, and spawn goal reset. Three safety preservation cases already passed (friendly obstruction, blocked diagonal, disconnected different-node route). The test helper initially sampled after the first firing pulse; it was corrected to stop on the first pulse, and the crouch test was rerun red on its intended pitch assertion before implementation.

The final focused suite has twelve cases. It additionally covers ordinary body overlap and a same-node goal beyond the bounded fallback distance. Tests use shipped real Verdant/round WASM. The overlap test wraps ray/hitbox only to reject nonfinite boundary values and forwards calls to actual WASM. The blocked diagonal/disconnected/bounded fixtures use small explicit graph node sets to isolate route exhaustion; all collision behavior remains real. The elevated fixture confirms an actual shot damages the target.

## Verification

- `./node_modules/.bin/tsx --test tests/bot-sight-navigation.test.ts tests/bot-objective.test.ts tests/objective.test.ts` — **33/33 passed**, zero skipped. All seven original bot cases, including the three legal-plant defuse regressions, remain passing.
- `npm test` — final run **151/151 passed**, zero skipped (11.0 s). Full output recorded locally at `/tmp/game-bot-task2-unit.log`.
- `./node_modules/.bin/tsc --noEmit` — passed. Initial run found one inferred Node/coordinate type mismatch in the final waypoint variable; explicit coordinate type fixed it, and the final typecheck exited 0.
- `git diff --check` — passed.
- `df -h .` — 8.4 GiB available; no dependencies, installs, builds or large artifacts created.

## Self-review and limits

Reviewed all changed branches against the brief: reaction delay and burst recovery remain unchanged; friendly checks use current eye/target direction and crouched hitbox height; goal invalidation happens after tactic/carrier goal selection; graph disconnection and distance bounds cannot authorize direct movement; defuse routing and authoritative interaction geometry remain independent. The enlarged sweep intentionally rejects some extremely tight clear approaches; it is a conservative short fallback and does not alter normal graph navigation/physics. No browser screenshots were needed or claimed for this server-only task; release/browser verification remains with the parent.

Parent's untracked `docs/GAME-EXPERIENCE-REFRESH.md` was left alone. The `.superpowers` report is local/ignored per existing repository excludes.
