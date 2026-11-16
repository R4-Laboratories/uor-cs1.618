# Three.js / Verdant rendering research

2026-11-16. Read-only product investigation; only this report was written. No installs, builds, browser/GPU tests, or changes to the active presentation implementation. Source paths below are relative to `/workspace/cs1.618`, except `upstream:` means `/workspace/upstream/verdant-engine`. Working files were changing concurrently, so line references are approximate.

## Conclusion

Keep Three.js as the browser/GPU renderer. Improve its material inputs and shadow policy, then eliminate avoidable HD asset marshaling. Move small, bounded policies and data preparation into Prism/Wasm where their contracts matter; moving GPU rendering or already-working GPU skinning to CPU Wasm would not inherently improve graphics or frame rate. Five scoped options follow, ranked by visible impact/implementation risk, not asserted benchmark wins.

## What is actually running

- `package.json:35` pins Three **0.181.1** (`@types/three` 0.181.0). Installed exports include `InstancedMesh`, `BatchedMesh`, `PMREMGenerator`, and `SkinnedMesh`; a Node import reported revision 181.
- `src/world.ts:61` uses WebGLRenderer, antialiasing, ACES tone mapping, sRGB output, a 2048² PCF-soft directional shadow, and a pixel ratio capped at 1 before adaptive scaling. The world and first-person weapon are separate scene renders with a depth clear. Weapon `RoomEnvironment` + PMREM is already being added at `:76`; do not propose it as new work.
- Static repeated boxes already use spatially partitioned `InstancedMesh`, with rollback and an inventory invariant (`src/evolution/render-batching.ts:4`; generated policy: 16 m cells, minimum 2). Characters already use **GPU** `SkinnedMesh`, four bone weights, three morphs, and 22-joint Wasm poses at 30 Hz (`src/characters.ts:6–54`). There are at most ten rigs, so large-scale crowd optimizations are premature.
- HD geometry is generated in a worker, but Rust serializes JSON, JS parses nested arrays, the worker structured-clones them, and the main thread flattens them into typed attributes (`crates/cs-verdant/src/scene3d.rs:64`; `shared/engine.ts:7`; `src/hd-worker.ts`; `src/hd-layer.ts:16`). Nine placements share three assets. Their geometry is deliberately outside playable cover/clearance (`model/verdant-3d.json`).
- Local dependency and upstream checkout both pin **9b6c14d4b756b09faecf61b9f61cf894155f52c9** (`crates/cs-verdant/Cargo.toml`, `model/upstream-lock.json`). The game embeds its own `cs-verdant` adapter over `verdant-core`, not the complete upstream demo's Wasm API. Upstream has software tile PBR, WGSL validation, render graph/CSM models, packed scene buffers and a separate handwritten WebGL2 demo renderer (`upstream:crates/verdant-core/src/render.rs:349,414,539,647`; `upstream:site/scene-renderer.mjs:51`). These facilities are not evidence that the FPS currently uses them. `model/verdant-3d.json` explicitly classifies unactivated software rendering/glTF/UORC facilities as imported source and browser rendering as empirical/open claims.

## Five actionable options

### 1. Better material information, using existing PBR — small (roughly 1–2 engineering days)

Keep `MeshStandardMaterial`; add restrained tangent-space `normalMap` and `roughnessMap` to one stone/metal family first. Current architectural maps are largely color noise with constant roughness, so actual surface response is a more direct improvement than more triangles. Consider a coherent outdoor `scene.environment` only after reviewing the active weapon PMREM result: the weapon's indoor RoomEnvironment is not automatically a convincing outdoor lighting model. A procedural sky/cubemap can feed `PMREMGenerator.fromScene`; generate once, not per frame. Preserve render-target ownership for eventual disposal.

Three supplies the BRDF, filtered environment, shader permutations and GPU sampling. JS owns textures/materials; Wasm could generate deterministic height/roughness data in a worker if generation is sufficiently costly, but has no inherent advantage for a few one-time maps. Keep albedo sRGB and normal/roughness data `NoColorSpace`; roughness is read from green. AO/light maps require deliberate UV allocation/`Texture.channel`, not blindly reusing tiled UVs for unique baked lighting. Source: `node_modules/three/src/materials/MeshStandardMaterial.js:110–258`, `src/textures/Texture.js:118,299`.

Budget: two 512² RGBA8 maps with mipmaps are approximately **2.67 MiB** per family before compression; avoid multiplying unique material instances and losing existing batches. Acceptance: clearer surface response under the same exposure, preserved enemy silhouettes, no material-count explosion, measured frame cost within a chosen budget. Use original/licensed maps; Three's license does not license unrelated assets.

### 2. Correct shadow updates before adding shadow complexity — small/medium (1–3 days)

The current global `renderer.shadowMap.autoUpdate=false` is only invalidated on setup/rollback in the inspected world code. Moving `castShadow` characters can therefore lack current shadows or leave a captured pose's shadow. Verify in a controlled match after the active visual work; this is a source-level finding, not a screenshot-confirmed defect. A bounded update cadence when visible actors move is the simplest experiment; trigger on appearance/disappearance too. Each invalidation redraws eligible shadow casters, so it has a real cost.

Three exposes both renderer-level and per-light `autoUpdate`/`needsUpdate` (`node_modules/three/src/renderers/webgl/WebGLShadowMap.js:67–121`). JS should drive invalidation from known scene changes. Prism can own cadence/quality bounds; Wasm should not render the shadow map. Separate cached static lighting plus a dynamic shadow scheme is larger work because caster filtering/composition must be designed explicitly.

At an 80 m orthographic span, a 2048 map nominally allocates about **3.9 cm/texel**. Tightening useful coverage can beat increasing resolution. `three/addons/csm/CSM.js` offers cascades, `setupMaterial`, `update`, and custom split callbacks, but adds shadow renders and shader integration; defer until near-camera aliasing is measured. Upstream `compute_csm_splits` could supply bounded split data, but its export is not currently in the game's adapter. Retain static shadows in the low tier if dynamic updates exceed budget.

### 3. Flat HD buffers across the Wasm/worker boundary — medium (2–4 days)

Expose bounded mesh spans/counts from `cs-verdant`; copy them once into owned typed arrays in the worker, transfer those ArrayBuffers, then use `new BufferAttribute(typedArray, itemSize)` on the main thread. Do not use typed-array convenience constructors that unnecessarily copy supplied arrays. Validate lengths, alignment, finite values and index bounds, version the ABI, and preserve latest-request-wins cancellation and LOD pin semantics. Memory growth invalidates old Wasm views: reacquire views after generation, and never transfer or retain the live Wasm memory buffer as though it were an owned transferable asset. GPU upload remains a copy.

A low-risk first stage retains Rust JSON but flattens **in the worker** and transfers typed arrays; this removes main-thread flattening and nested-array cloning without a new Rust ABI. A subsequent binary ABI removes serialize/parse cost. Upstream `PackedSceneRenderBuffers` is a useful design precedent, not a drop-in: it bakes world transforms and omits UVs, whereas this game needs reusable local geometry, UVs and placements.

Bounded single Node probe of shipped `public/wasm/cs_verdant.wasm`, default LOD2 (no browser/GPU):

| Asset | Vertices | Triangles | JSON bytes | Proposed packed bytes* |
| --- | ---: | ---: | ---: | ---: |
| Hall | 5,210 | 7,020 | 612,643 | 313,480 |
| Bridge | 6,392 | 3,844 | 562,711 | 327,376 |
| Canopy | 416 | 648 | 50,485 | 26,080 |
| Total | 12,018 | 11,512 | 1,225,839 | 666,936 |

*Position3 + normal3 + UV2 + RGB3 Float32, Uint32 indices; excludes small headers. **45.6% fewer payload bytes**, not a measured network saving or FPS gain. Three currently may choose Uint16 indices for these meshes, so the proposed Uint32 total is conservative relative to a compact binary design. Single-run generation+serialization totaled 31.34 ms and decode+parse 29.63 ms; cold JIT/allocation effects and host contention make these diagnostic only. Current generation/parsing already happens in a worker. Main-thread/GC savings require browser measurements.

### 4. Extend batching selectively — small/medium (1–2 days)

Do not reimplement the existing box instancer. Test HD repeated placements as `InstancedMesh` (two halls, six canopies) if draw calls matter, accounting for worse aggregate culling. For *different* geometries sharing a material, `BatchedMesh.addGeometry/addInstance` supports per-object frustum culling and sorting (`node_modules/three/src/objects/BatchedMesh.js:148–221`). It can suit weapon hardware or future repeated architectural details, but cannot merge different materials into one magic draw. Its WebGL multi-draw fast path has a fallback (`src/renderers/WebGLRenderer.js:1233`); extension availability affects gains.

Keep batching in JS/GPU unless profiling identifies large CPU visibility workloads. Three already performs frustum culling; an additional Wasm culler at this scene size may duplicate work and add crossing overhead. If scene scale grows, reuse Verdant BVH/spatial bounds and emit visible IDs in one batch, keeping conservative animation bounds. Preserve the existing scene-inventory/rollback checks. Budget: instance matrices cost 64 bytes each plus bounds/objects; expect draw-submission savings, not lower triangle count. The current nine HD placements alone limit upside.

### 5. Optional contact AO after the cheaper changes — medium (2–4 days)

For depth/contact readability, A/B a restrained `GTAOPass` using `EffectComposer`, `RenderPass`, and final `OutputPass` from the installed addons. This is a more defensible experiment than blanket bloom in a tactical FPS. Run world AO before the weapon overlay, and perform tone mapping/output conversion exactly once. The present two-scene clearDepth composition must be adapted deliberately; composer sizing/pixel ratio must track the existing quality scaler. Offscreen targets also need an antialiasing decision; canvas antialiasing alone does not make all composer targets multisampled.

AO stays on the GPU. Prism can select an off/low/high policy; CPU Wasm per-pixel AO would move work away from the already-used GPU. GTAOPass allocates a normal/depth target, AO target and denoise target (`node_modules/three/examples/jsm/postprocessing/GTAOPass.js:143,314`), and performs extra scene/fullscreen passes. At 1080p, three RGBA16F color targets alone are **~47.5 MiB**, before depth and composer targets. Start disabled in low mode, evaluate reduced-resolution AO, and impose an experimental **≤1.5 ms GPU overhead target**, not a promised result. Check thin props, foliage halos, motion and enemy contrast.

## What belongs in Prism/Wasm, and what does not

Good Prism candidates: finite/bounded buffer contracts, index and LOD bounds, deterministic quality-state transitions, memory ceilings, admissible visibility bounds and shadow update cadence. Good Wasm candidates: existing procedural generation, BVH/collision/camera safety, animation/IK pose computation, compressed asset decode, and bulk data preparation. Keep browser lifecycle, GPU resource ownership, Three scenes/materials and input/output orchestration in JS; keep shading, rasterization, postprocessing and vertex skinning on GPU.

A whole Three-to-LexLean rewrite is neither an automatic optimization nor an automatic proof of pixels. It would replicate browser extension handling, shader specialization, texture/color management, GPU state caches, resource lifetimes, and platform workarounds. Lean proofs of selected models do not prove the WebGL implementation, GPU driver, assets or complete game. GPU numerical output is not guaranteed bit-identical across devices. The existing Rust-generated Prism kernels plus narrow host adapters already provide a useful boundary. Preserve it and state exactly what each new proof covers.

Three 0.181.1 includes `WebGPURenderer` with WebGL2 fallback (`node_modules/three/src/renderers/webgpu/WebGPURenderer.js:22–68`). That is a separate renderer architecture, not a necessary prerequisite for these improvements or a drop-in guarantee for WebGL addons/custom shaders. Defer migration until a measured bottleneck or required compute feature justifies a dedicated compatibility prototype. Upstream software PBR is useful as an explicit portability/oracle path; its existence does not establish superior FPS visual quality or performance.

## Recommended next experiment and evidence gate

After the active presentation work settles, run **option 3 stage one: worker-owned flat transferable HD arrays**, keeping the same Wasm binary, geometry, materials, LOD model and pins. This has a concrete source-level bottleneck, a small reversible adapter change, and avoids conflating rendering improvements with scene changes. Capture identical cameras and verify vertex/index/placement equality, rapid LOD-switch cancellation, native=4/low=0, and repeated disposal. Measure main-thread long tasks and HD transition duration for 0→2→4→0; keep the change only with reduced transfer/flatten overhead and no visual regression. If parsing/generation still dominates transition latency, proceed to the binary ABI.

For subsequent graphics tests, record world+weapon draw calls/triangles together: `renderer.info.autoReset=false`, reset once per measured frame (default reset per render otherwise hides the world pass). Record actual GPU timings when supported via disjoint timer queries, reject disjoint samples, and separate CPU submission from GPU time. Existing `src/evolution/lab.ts` uses `gl.finish()` at 640×400; it is useful for controlled local comparisons but not representative gameplay latency. The 3-second `HdBudget` cadence average is explicitly not a GPU benchmark. Evaluate target hardware and software rendering separately; do not infer 60 fps from this investigation.

## License

Three's MIT copyright/permission notice must remain with distributed copies/substantial portions, including copied/adapted shader or algorithm code: `node_modules/three/LICENSE` matches `docs/licenses/three-MIT.txt` (2010–2025 three.js authors). Rewriting a substantial portion into another language does not justify dropping attribution. Audit release packaging when adding addons or copied code; preserve other upstream and asset notices separately.

### Concrete scope for the worker-only experiment

This is bounded presentation plumbing: leave `shared/engine.ts`'s `HdAsset`, Rust, the shipped Wasm, generated Prism guests and producer verification unchanged. Introduce a renderer-facing `HdRenderAsset` with `{name, positions:Float32Array, normals:Float32Array, uvs:Float32Array, colors:Float32Array, indices:Uint16Array|Uint32Array}`. `src/hd-worker.ts` converts each existing `HdAsset` once, strips color alpha exactly as the current renderer does, selects the index width from the maximum index, and calls `postMessage({id,assets}, uniqueBuffers)`. Change `HdLoader`/`HdLayer` to consume that shape with plain `BufferAttribute`; keep the current worker request/error envelope and serial checks. Worker arrays are deliberately detached on successful transfer, and no reuse/cache is assumed.

At the probed LOD2, Uint16 indices suffice for all three assets, giving **597,864 transferable bytes (~584 KiB)** rather than the conservative Uint32 666,936 bytes. This removes main-thread flattening of 12,018 vertices' attributes and 34,536 indices, plus worker-to-main cloning of thousands of nested number arrays. The 45.6% figure above compares hypothetical packed data with Rust's JSON; **it is not the size reduction of structured clone**, whose engine-specific object/number overhead was not measured. Rust still emits 1,225,839 JSON bytes, and worker decode/parse costs remain in stage one.

Focused checks: compare the proposed arrays byte-for-byte with the existing main-thread conversions for each asset and LOD 0–4; test Uint16/Uint32 boundary selection and out-of-range indices; verify transfer-list uniqueness/detachment with a small MessageChannel or worker test; retain existing `tests/hd-layer.test.ts` race/error/dispose cases using the new payload; verify the actual worker response in the existing browser experience gate. Array equality plus matching indices/placements is stronger than relying only on screenshot similarity. Do not claim startup/frame-rate improvement until target-browser measurements show it. This experiment fits the current presentation theme, but should be a separate small follow-up after the active visual agent finishes, so adapter/test edits do not conflict with its work or obscure its visual baseline.
