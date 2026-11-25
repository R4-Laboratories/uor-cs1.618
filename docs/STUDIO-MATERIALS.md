# Authoring Meridian surfaces

Meridian's municipal dockyard, operator kit and viewmodels share 20 authored OpenPBR surfaces. Edit the named surface in `model/studio-materials/meridian.mtlx`, then run the material compiler from the repository root.

```sh
python3 scripts/studio-render-materials.py
npx tsx --test tests/studio-render.test.ts
```

The compiler reads the `base_color`, `base_metalness` and `specular_roughness` input types and allowed ranges from the registered OpenPBR 1.1.2 MaterialX node definition. Colors are linear RGB. Meridian's `cs_finish` annotation chooses a shared microtexture for mineral, wood, paint, metal, fabric or glass. The resulting JSON is the library consumed by `studioSurface(name)`. The game maps the three admitted parameters onto Three.js standard materials and can layer sampled albedo and tangent-space normals over them. Other OpenPBR lobes remain outside this adapter's supported subset.

The game creates a repeating roughness pattern for each finish. When the engine attaches to the world, it validates the RGBA8 byte span with vTensor and applies the vRAM page representation chosen by the WASM guest. The six 64×64 CPU texture sources retain the encoded pages. Their upload getters unpack logical pixels when Three asks for them, including a reupload after context loss. WebGL receives ordinary mipmapped RGBA8 textures. Existing materials keep their texture references during the transition from the loading screen into the match.

Run `node scripts/studio-render-browser.mjs` with Playwright Chromium installed to exercise both GPU upload and reupload after context loss. It reads each finish back from an RGBA8 render target using `texelFetch` and compares all bytes to the original texture. The local integration run compared 98,304 bytes on each pass. vRAM selected four constant pages, twelve palette pages and eight literal pages, totaling 57,456 encoded payload bytes. This measures CPU backing bytes and excludes object headers, GPU storage and generated mipmaps.

## Replay Studio

The register binds Verdant Studio commit `7423aa68ae6c10870f5d9165e00dde5a6223e024`. Its certified, generated Rust command ingests the pinned OpenPBR authority, admits `MeridianSurfaceResponse` with the D07 standard citation and checks the XML of both the reference node and the authored library. Studio manages the authority and admissions. The project compiler enforces the supported rendering subset and produces the Three.js inputs.

With Python 3 and a working Cargo/Rust compiler, run the upstream command in a fresh temporary model:

```sh
python3 scripts/studio-render-materials.py --replay-upstream --check
```

The replay downloads the upstream provenance record and its three pinned Rust package files, verifies their SHA-256 digests and builds with Cargo offline. It requires 64 MiB of headroom above the 8 GiB free-space reserve. Its temporary directory and build output are removed when the command finishes. For an existing checkout of the pinned executable, use `--studio-cli /path/to/verdant_studio --check`. Ordinary build verification uses the offline `--check` path, which also detects stale generated output.

The live upstream replay for this integration returned:

```text
ingested authority ASWF-OPENPBR-1.1.2
admitted MeridianSurfaceResponse
well-formed XML: root materialx, 442 elements
well-formed XML: root materialx, 81 elements
20 OpenPBR surfaces checked against ASWF-OPENPBR-1.1.2
```

Studio's copied binding is distributed under its MIT option. The OpenPBR node definition is distributed under Apache-2.0. Their unmodified source bytes, binding digest, upstream revision, provenance digest and license texts are under `model/studio-materials/`. The authored materials and procedural microtextures belong to this game.

[Verdant Studio at the integration revision](https://github.com/afflom/verdant-studio/tree/7423aa68ae6c10870f5d9165e00dde5a6223e024) · [Pinned OpenPBR reference](https://github.com/AcademySoftwareFoundation/OpenPBR/blob/51b14a8afa42441881254d22a5fe807a95f35591/reference/open_pbr_surface.mtlx)
