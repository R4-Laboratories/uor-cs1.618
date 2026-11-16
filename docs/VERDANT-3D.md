# Verdant 3D integration — v0.6.0

The engine is pinned to [`b2b29ca65f792ad2ceaf5ea3d7313ca5580b17c4`](https://github.com/afflom/verdant-engine/commit/b2b29ca65f792ad2ceaf5ea3d7313ca5580b17c4), upstream main inspected on 2026-11-16. This imports six commits after the previous `4c433f1` pin, including new camera, continuous collision, HD worlds and articulated characters. Upstream code remains unchanged; its MIT notice remains in the distribution.

## Active in the game

- Verdant's `ArticulatedCharacter` generates the actual meshes, skeleton, normalized weights and morph targets. Attackers use BridgeEngineer colors; defenders use Explorer colors.
- Each operator has 22 joints, 856 vertices and 1,200 triangles. Ten reusable Wasm slots bound the roster. Assets and materials are shared; skeleton GPU resources and Wasm slots are released when players leave.
- The engine computes locomotion, head tracking and foot IK at up to 30 updates/second. The client adds a tactical arm stance and Three.js performs GPU skinning. World movement still interpolates at the render rate.
- Meshes are normalized to the game's 1.78 m standing height. The engine solves feet against a local flat support plane at the player's floor; this is not triangle-aware foot placement on map geometry.
- The rebuilt, import-free engine Wasm is 203,969 bytes. Cargo.lock, the source pin and artifact digests identify the same revision. UORust's inspection projection includes the new bridge and retains open claims.

## Available upstream, not activated here

`TwoLevelBvh`, swept continuous collision, `LawfulCameraRig`, HD Citadel/Bridgeworld assets and the upstream demo's three-pass PBR renderer are included in the pinned source dependency. This release retains Meridian, existing authoritative movement/hitboxes, the FPS camera and Three.js/WebGL2 presentation. Adapting those additional systems needs its own behavior and performance checks; importing a dependency does not activate every module or embed all demo assets in the client.

## Validation

Five native Rust tests and 60 TypeScript tests passed, including finite animated vertices, hierarchy and weights, standing bounds, invalid inputs, ten-slot capacity/reuse and actual Wasm execution. Production browser gates cover two rendered multiplayer clients, combat, leaving/rejoining practice, real WebRTC, creative layers, audio and quality settings. These checks use software rendering; no hardware-GPU benchmark is claimed. Existing round/evolution Prism artifacts are unchanged. Full Prism verification still has the documented PP5004 regeneration-closure failure; this update does not claim a proof of the renderer or whole game.
