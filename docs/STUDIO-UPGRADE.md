# Meridian graphics upgrade

## Delivery plan

1. Capture Meridian, the five first-person weapons and both teams at fixed camera positions on the published source revision.
2. Pin the current Verdant Engine and the vRAM and vTensor components used by the browser adapter. Build and exercise the WebAssembly adapter. Follow Verdant Studio’s authority and derivation mechanics to define and validate a material register.
3. Apply those materials in the world and on equipment. Dress Meridian as a coastal industrial station, fit the existing animated operators with team-specific gear, and remodel the first-person weapons and hands. Maintain readable routes, silhouettes and objective markers.
4. Use confirmed shots and simulation state for combat feedback. Show each weapon’s in-game model in the buy menu.
5. Compare the rendered release with the baseline. Verify gameplay, browser multiplayer, the Prism guests, artifact provenance and the existing evolution checks. Publish through the official repository and confirm the revision and rendered game on Pages.

Use shallow upstream checkouts, compact local texture derivatives and one Rust target directory. Check available disk before large downloads or builds and keep 8 GiB available.

## What changed in the match

Meridian's coastal relay station has corrugated loading bays, vented service cabinets, overhead trusses, a harbor crane and painted routes to A and B. Five scanned surfaces supply albedo and tangent-space normal detail. A local coastal panorama lights the yard. The existing collision map still defines navigable space.

Ember and Tidal carry different field equipment on Verdant’s animated 22-joint operators. Each of the five first-person weapons has an original model, gloved hands and fitted sleeves. The four purchasable weapons appear in the buy menu as renders of the equipped models. Both sites have crisp painted perimeters. The objective has an overmolded relay case, a recessed handle and a state-driven display. The radar shows lane geometry and facing direction. The reticle responds to movement and recoil, hit confirmation follows authoritative events, and impacts and detonations have short-lived effects.

The browser uses Verdant Engine 2.22.4 and Three.js WebGL2. The game stages six shared finish textures through compiled vTensor and vRAM kernels. A GPU readback verified the exact pixels on first upload and after context loss. Encoded CPU payloads occupy 57,456 bytes for 98,304 bytes of RGBA8 data. This measurement covers the six roughness textures. The photographs use the normal image loading pipeline.

The [live material inspector](https://r4-laboratories.github.io/uor-cs1.618/evolution-studio.html) compares any two of the 20 authored surfaces under the same light. Editing the [MaterialX library](../model/studio-materials/meridian.mtlx) and regenerating its register updates the game and inspector together. [Studio admission and replay](STUDIO-MATERIALS.md) · [Rust adapter and proof scope](VERDANT-3D.md)

## Compare the rendering

These are in-engine captures at fixed camera positions on the same map. The earlier build is `62a6d4a`. Chromium used its software WebGL renderer for reproducibility. The comparisons show art and rendering changes. Physical-GPU frame time was not measured.

| View | Earlier build | Studio release |
| --- | --- | --- |
| Teams and equipment | [Earlier operators](evidence/studio-upgrade/before-operators.webp) | [Ember and Tidal](evidence/studio-upgrade/after-operators.webp) |
| Route to A | [Earlier lane](evidence/studio-upgrade/before-kestrel.webp) | [West loading bay](evidence/studio-upgrade/after-kestrel.webp) |
| Planted device | [Earlier Site A](evidence/studio-upgrade/before-site.webp) | [New Site A](evidence/studio-upgrade/after-site.webp) |

## Reproduce the checks

```sh
npm ci
npm run verify
npx playwright install chromium
npm run test:presentation-browser
npm run test:creative-browser
npm run test:browser
npm run test:peer-browser
```

The presentation suite captures five weapons, both teams, the planted site and the narrow-screen HUD. The creative suite changes a real material in the inspector and checks its rendered pixels. The Pages workflow also exercises discovery, identity, interaction and objective play. After deployment, `node scripts/verify-studio-pages.mjs <deployed-commit>` starts a ten-player practice match and opens the material inspector on the published origin.
