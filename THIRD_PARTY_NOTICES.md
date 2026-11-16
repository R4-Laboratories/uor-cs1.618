# Third-party notices

Original game code, map, models, textures and synthesized sounds are MIT licensed. No Counter-Strike maps, models, audio, logos or other Valve assets are included.

- **Verdant Engine** — afflom/verdant-engine, MIT OR Apache-2.0. Used under MIT. The Rust dependency is pinned by commit in Cargo.toml and Cargo.lock; its BVH, geometry mathematics and binaural acoustics are compiled into `cs_verdant.wasm`. License copied to `docs/licenses/verdant-engine-MIT.txt`.
- **uor-matmul** — UOR-Foundation/uor-matmul, transitive engine dependency; locked in Cargo.lock. Only linked code retained by the Wasm linker ships.
- **Verdant Resonance** — afflom/verdant-resonance, architecture reference for a browser renderer over a committed Verdant Wasm substrate. Its game source and game assets are not copied.
- **Prism-DevRel** — afflom/prism-devrel, MIT OR Apache-2.0; used under MIT to generate the checked-in Prism model and facets. License copied to `docs/licenses/prism-devrel-MIT.txt`.
- **LexLean, PrismPM, UORust** — used as development/modeling tools at revisions in `model/upstream-lock.json`. Generated models and verification evidence are retained; toolchain executables are not bundled into the game.
- **PeerJS** and **PeerServer** — MIT. PeerJS provides browser rendezvous and WebRTC connection setup; PeerServer is used for signaling-only tests and optional self-hosting. Licenses are copied to `docs/licenses`.
- **Three.js**, **ws**, **tsx**, **Vite**, **TypeScript** — their original licenses remain in installed npm packages. Exact versions and integrity hashes are in package-lock.json. Three.js renders the world; ws hosts multiplayer transport; tsx runs the server.
- **Barlow**, **Barlow Condensed**, **IBM Plex Mono** — self-hosted through pinned Fontsource packages; SIL Open Font License. Licenses are copied to `docs/licenses`. There are no runtime requests to Google Fonts.

Cargo.lock records the complete Rust dependency closure; package-lock.json records the JavaScript dependency closure. The custom Wasm artifact's hash and source provenance are recorded in `model/artifacts.json`.
