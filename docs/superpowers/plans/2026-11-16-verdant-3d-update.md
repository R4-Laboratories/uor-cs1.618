# Verdant Engine 3D import

Upgrade from 4c433f1 to the inspected upstream main b2b29ca. The six new commits add tensor/UI/network kernels, exact triangle BVHs and continuous collision, camera rigs, HD procedural worlds, and 22-joint characters. Import the pinned core dependency and use its new character generation, skeletal pose and flat-support foot IK through the existing Wasm boundary. Render the actual upstream bind mesh and normalized weights with Three.js GPU skinning. Preserve the original tactical map and authoritative collision/hitboxes; full upstream demo-world and renderer replacement is outside this dependency integration.

1. Pin latest engine; rebuild and test the existing spatial/audio ABI.
2. Add a bounded 10-slot character ABI with cached assets, pose buffers and explicit release. Test hierarchy, weights, finite animations and malformed inputs. Integrate visible team-distinct articulated models and GPU skinning, keeping first-person weapons and authority intact.
3. Verify native Rust/Wasm, complete game checks, actual browser animation/rendering and multiplayer. Update artifact custody, licenses/provenance and integration notes. Publish the official repo and verify Pages.

The upstream source is imported unchanged. Its new terrain/PBR demo, camera and CCD APIs are available in the dependency; activating them wholesale would change this game's map, camera or movement behavior and requires separate adaptation/testing. No additional formal-proof claims follow from an upstream README.

Implementation and local validation complete: dependency/Wasm rebuilt, 22-joint GPU skinning active, five Rust and 60 TypeScript tests, all browser gates and UORust projection check passed. Review found a bot pitch range mismatch at the animation boundary; the adapter now clamps animation pitch with a regression test. Public deployment verification follows the main push.
