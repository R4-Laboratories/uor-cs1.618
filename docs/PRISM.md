# Engine and Prism architecture

cs1.618 follows Verdant Resonance's separation between a browser presentation, a portable engine Wasm boundary, and a modeled core. It adds an authoritative Node/WebSocket host and a browser-local practice worker. The browser draws with Three.js/WebGL2; Verdant supplies actual engine operations, rather than serving only as a project reference.

## Requested upstreams

Exact source revisions are in [upstream-lock.json](../model/upstream-lock.json).

| Upstream | Concrete use |
| --- | --- |
| `afflom/verdant-engine` | Pinned Cargo dependency. `verdant-core` BVH, ray/AABB, vectors, occluded binaural audio, and 22-joint character meshes/poses execute through `crates/cs-verdant` in the browser and server. |
| `afflom/verdant-resonance` | Architectural reference for the Rust/Wasm plus web presentation delivery, and explicit distinction between model evidence and observed application behavior. No Resonance game assets are copied. |
| `UOR-Foundation/lexlean` | The round model is LexLean, with the locked compiler and Lean toolchain used by the PrismPM SDK. Source checkout is pinned for inspection; executable compiler identity is pinned separately by the SDK image and `lexlean.lock`. |
| `UOR-Foundation/prismpm` | Builds the actual core Wasm and binary HOLO archive from that model; runs the application verification pipeline. |
| `afflom/prism-devrel` | Its builder generates the model's facets, theorem declarations and application contract from `model/round.prompt.json`. |
| `afflom/UORust` | Built from the pinned source; projects the Rust bridge into `prism/rust-projection` and checks that projection. Its open frontier is retained. |

## The runtime boundary

`server/match.ts` owns input timing, movement, shooting, inventory, economy, objective interactions and phase transitions. During active rounds it asks `shared/round-kernel.ts` for the winner. The browser-local practice worker uses the same Match class and both shipped Wasm modules.

The kernel executes **PrismPM's generated Wasm**, `public/wasm/cs_round.wasm`, through the Text/1 ABI. No handwritten JavaScript decision function is used as a production fallback. Each distinct request gets a fresh Wasm instance; its result is cached in a finite 288-entry domain. This avoids growth of the generated guest's monotonic allocator.

Requests have four fields: objective state (absent/planted/defused/exploded), living attackers (0–5), living defenders (0–5), and whether time remains (0/1). The ordered decision table gives defusal and detonation priority, then defender elimination, then attacker elimination without a plant, then an unplanted timeout. A planted device keeps the round live after the attackers are eliminated. The host performs the actual timer and interaction calculations.

The checked-in `shared/round.generated.ts` is an independent prompt-to-JavaScript test oracle. Tests compare all **288 inputs** against the compiled guest. This exhaustive finite check supplements the generated model's formal evidence; it does not prove the rest of the simulation, networking, renderer, or browser.

The distributable Prism is [CS-Round.holo](../public/prism/CS-Round.holo), a binary HOLO v4 archive. Its content-addressed build is `3b66383a3d163668aae5e2d60725c77af763d6194aaf978f3869cfe621713620`. Artifact and model-source digests are in [artifacts.json](../model/artifacts.json).

## Reproduce the model

```sh
node scripts/fetch-upstreams.mjs
npm run prism:generate
npm run prism:verify
```

The generator intentionally recreates the source project. `lexlean lock` inside the verifier normalizes its lock for the pinned SDK. The verifier uses the image digest in `prism/prismpm.lock`, not a moving tag. A full SDK build needs substantial disk and memory. The application model is located at `prism/app`; the UORust projection is a separate inspection model, not part of the round guest.

After a deliberate successful regeneration, copy the verified build's `core-wasm/prism_cs_round_core_wasm.wasm` to `public/wasm/cs_round.wasm` and its `CS Round.holo` to `public/prism/CS-Round.holo`. Review the build ID, update the recorder if it changed, run the parity tests, then run `node scripts/record-artifacts.mjs`. Recording a digest alone does not establish correctness.

For the Rust projection:

```sh
cd ../upstream/UORust
cargo build --release --locked
cd ../../cs1.618
../upstream/UORust/target/release/uorust project . --out prism/rust-projection --last-modified 2026-11-16T00:00:00Z
../upstream/UORust/target/release/uorust check . --out prism/rust-projection --last-modified 2026-11-16T00:00:00Z
```

Read [frontier.toml](../prism/rust-projection/frontier.toml) before interpreting the projection: dependency types and engine behavior are not automatically lifted into Lean, advisory checks were not supplied, and open claims remain open. See [verification evidence](VERIFICATION.md) for the actual checks performed and environmental limits.
