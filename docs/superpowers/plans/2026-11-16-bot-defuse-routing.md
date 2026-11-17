# Bot defuse routing repair

Goal: bots must move into a valid bomb interaction position instead of holding use through solid cover. The current real Meridian crate-corner reproduction permits a legal plant and a navigable route but the defender stalls for the whole bomb timer.

Binding behavior: preserve authoritative planting/defusing/detonation timing, line-of-sight and 3D interaction checks; preserve one-defuser coordination, kit preference when feasible, and normal combat/cover behavior. No teleportation, omniscient aim, expanded reach, timer changes, SDK/proof/identity/render changes or generated artifact hand edits. Follow existing simulation and Verdant navigation APIs. This is an independently releasable repair based on main; experimental numeric/compiler work stays on its branch.

## Task 1: repair actual bot interaction routing

- Reproduce the real crate-corner legal plant in a regression that fails on the existing implementation.
- Share or consistently apply actual defuse feasibility and route to a valid navigable interaction position; avoid stationary use attempts through cover. Inspect assignment consequences and address only reproduced cases.
- Test success before deadline, no illegal through-cover progress, one-defuser/kit/dead-defuser replacement and interruption rules. Use meaningful simulation outcomes, not implementation-mirroring mocks.
- Run relevant existing tests and build; independently review before publication.

## Task 2: publish and verify

- Run game verification and changed-path objective browser check on reviewed final content; preserve source/proof/identity pins.
- Publish to authorized game repository/main, preserving any intervening autonomous evolution commits. Confirm successful Pages deployment and served commit.
- Carry the reviewed fix into numeric branch by merge, preserving immutable compiler-snapshot ancestry.

No new general architecture is required: existing bomb rules and user request for working CS-style objective play are the behavioral specification.
