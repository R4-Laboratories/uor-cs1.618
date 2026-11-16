# Verdant 3D integration

Pinned upstream: [`9b6c14d4b756b09faecf61b9f61cf894155f52c9`](https://github.com/afflom/verdant-engine/commit/9b6c14d4b756b09faecf61b9f61cf894155f52c9), inspected 2026-11-16. This imports all three commits since `b2b29ca`, including the latest generated Prism tensor kernels, HD LOD4 changes, runtime governor, universe and narrative modules. Upstream source is unchanged. The game-specific bridge selects the following runtime capabilities.

## Active in the game

| Capability | Integration and observable result |
| --- | --- |
| HD architecture and foliage | Verdant generates the actual vaulted hall, parabolic arch bridges and canopy meshes. Nine roofline/exterior instances enrich Meridian's skyline without inserting unmatched cover into the tactical routes. Smooth normals, vertex colors and UVs reach Three.js PBR materials. |
| LOD0–4 | Geometry is generated in a separate browser worker, then swapped atomically. Superseded replies are ignored; replaced GPU geometry/materials are disposed. Native quality pins LOD4; Performance pins LOD0. The pause menu displays actual detail level and triangle count. |
| Runtime governor | The upstream `OntologicalRuntimeGovernor` uses its compiled Prism kernel. Auto quality samples active frame cadence over three seconds. A modeled 8–20 ms deadband prevents normal 60 Hz jitter from degrading detail. Sustained overload lowers detail; sustained sub-8 ms cadence allows it to rise. Paused samples do not count. This is frame cadence, not GPU timing or proof of improved FPS. |
| Triangle-backed camera | `TwoLevelBvh` indexes the same Meridian collision boxes as the authority. `LawfulCameraRig::FirstPersonEye` guards the near-plane diagonal against their surfaces and the floor, including scoped/wide aspect ratios. It does not replace the game's movement or shot semantics. |
| Articulated operators | Existing upstream 22-joint, 856-vertex, 1,200-triangle models, normalized weights, morph targets and foot IK remain active. Ten reusable Wasm slots, team colors and Three.js GPU skinning are preserved. Foot support is a local flat plane, not map-triangle IK. |

The import-free engine Wasm grows from 203,969 to 261,647 bytes. The whole game has its own larger asset budget; upstream's demo cold-boot size claim does not apply to this client.

## Imported source versus active features

The dependency includes floating-origin universes/portals, narrative conservation, glTF import/export, UORC streaming, XPBD vehicles/joints, software tile rasterization, and the upstream demo studio. These are **not exposed or activated in this FPS**. Dead-code elimination and disabled optional UORC dependencies mean importing the source is not shipping every subsystem in the Wasm. The client continues to use Three.js/WebGL2 for presentation and the existing WebRTC/authority architecture. Full renderer/world/netcode replacement is a separate integration, not something this update silently claims.

## LexLean, PrismPM and evidence

`model/verdant-3d.json` records integration claims and the client quality policy. `model/upstream-lock.json`, Cargo.lock, the UORust source projection and `model/artifacts.json` bind the source and artifact revision. The PrismPM SDK and compiled LexLean round, evolution and identity guests remain unchanged and mandatory. The full formal audits for those guests previously passed; see [proof audit](proof-audit.md). UORust continues to retain open adapter/dependency claims. Upstream formal claims do not establish a proof of the entire browser game.

Verification commands: `npm run engine:build`, `npm run verify`, all five browser suites, and the UORust projection check documented in [PRISM.md](PRISM.md). New checks exercise real Wasm mesh topology at all five detail levels, invalid inputs, camera clearance, governor overload/headroom/pins, 60 Hz jitter, GPU disposal and stale worker replies. Browser tests assert active HD and guarded cameras during multiplayer, both quality extremes, and persisted settings. GitHub's browser artifact includes `experience/verdant-hd4.png` and measured triangle counts.

A planted old-engine run failed all three new Wasm capability tests. Browser verification also caught a worker-relative asset URL fetching HTML instead of Wasm; the loader now resolves the engine URL from the embedding document, supporting GitHub Pages subpaths.

This upgrade was requested and implemented with assistant help. It is not counted as an autonomous tick or a new evolution generation.

Local final checks: **95 unit/tooling tests, eight native Rust tests, five browser suites and current UORust projection**. [Measured integration evidence](evidence/verdant-3d-latest.json) records geometry counts, hashes and scope. Review caught and verified fixes for extreme-resize camera recovery and transient worker-download retry. Camera refusal suspends local control and shows a recoverable message without stopping the animation/network loop. A real browser regression restores a valid viewport and requires camera recovery plus advancing authoritative input acknowledgments.

The final placement pass puts two halls on inaccessible rooftops and the arch bridge above the attack approach. Trees remain outside the map. Geometry clears a 6 m vertical envelope or the map boundary. A real render-mesh raycast, checked against the authoritative engine raycast, verifies that the bridge is visible from the approach rather than hidden behind a wall. The browser artifact includes `experience/verdant-play-hd4.png`.

All three full LexLean/PrismPM audits passed for the imported engine commit: [official audit run](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43884108122). The later scene-placement pass leaves those compiled guests and engine Wasm bytes unchanged.

Both the main client and HD worker request the engine with its recorded SHA-256 in the URL. This prevents an older unversioned browser cache entry from pairing obsolete Wasm exports with the new JavaScript bridge. The browser gate deliberately serves an obsolete module at the bare URL and requires successful HD startup through the versioned URL.
