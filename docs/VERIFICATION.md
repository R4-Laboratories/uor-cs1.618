# Verification evidence

## 0.9.0 integration

[Release scope and current validation](RELEASE-0.9.0.md) documents signed discovery, objective/tactical fixes, presentation/audio, all eight browser gates and their fixture/software-rendering limits. [Rendering research](THREE-PRISM-RENDERING.md) and [numeric export tracking](research/NUMERIC-EXPORT-TRACKER.md) describe follow-up work without changing shipped guests or extending their proof claims.

## Release 0.2.0 — browser-hosted WebRTC

- `npm run verify`: **28 tests passed**, TypeScript/Vite production build passed, existing engine/Prism source and artifact integrity checks passed.
- `npm run test:peer-browser`: real WebRTC between isolated browser contexts with only static files and a local signaling service; invitation rejection, worker-owned purchases/movement, signaling disconnect survival and host departure. The script checks that no game-server endpoint or gameplay-over-signaling is used.
- `npm run test:browser`: dedicated-server gameplay, rendered UI, purchases/combat, leaving and browser-local bot practice passed after integration.
- Independent code review found an unsupported-media-call resource leak in the PeerJS integration. A regression reproduced 25 retained calls before the fix; the host and guest now reject them immediately, and the suite passes.
- Local network tests do not prove TURN connectivity or cross-ISP NAT traversal. Host migration is intentionally deferred. See [browser networking](BROWSER-MULTIPLAYER.md).

The Rust bridge and Prism kernel did not change in this release. Their prior evidence and the open PrismPM verification gate below still apply.

## Release 0.1.0 baseline

This is a playable first release with executable evidence. It is **not** a claim of complete formal verification, production anti-cheat, or full Counter-Strike feature parity.

## Observed checks

| Check | Observed result |
| --- | --- |
| `npm run verify` | 22 tests passed, zero failures; TypeScript and Vite production build passed; 23 source/artifact hashes, six source pins and import-free Wasm checked. |
| `cargo test --locked -p cs-verdant` | Three native Rust tests passed: ray hit/miss and swept movement with sliding. |
| `npm run test:browser` | Passed with two Chromium pages: joining opposite teams, buying/equipping, movement visible remotely, authoritative damage, scoreboard, leaving, and ten-player browser-local practice. No uncaught page errors. |
| Wall-ray mutation | Temporarily replaced the engine ray result with maximum range. The wall-hit test failed as required. Restored the original bytes and reran all four engine tests successfully. |
| Prism finite parity | The real generated Wasm agrees with the prompt-derived oracle for all 288 inputs; invalid inputs are rejected. The `.holo` has the binary HOLO v4 signature. |
| `lexlean fmt --check` | All 14 application-model modules canonical. |
| `prismpm check` | Passed, semantic ID `7168ee43529646104a0514706d1f46d4b04249b2c7c3268a3b6f150a1568882d`. |
| `prismpm build` | Published build `3b66383a3d163668aae5e2d60725c77af763d6194aaf978f3869cfe621713620`; its generated Wasm and HOLO are shipped. |
| `prismpm verify` | **Failed**, `PP5004: application regeneration artifact closure differs`. No successful full-verification receipt is claimed. |
| UORust projection check | Passed: `prism/rust-projection is the current projection`. The frontier retains its open claims. |

Machine transcripts and browser results are under [evidence/](evidence/). Screenshots show the real production client. The browser harness uses two pages connected to a real server and adjusts server fixtures to make combat and purchases deterministic; it does not constitute a public-internet load test. The network test separately exercises real sockets, invalid/duplicate input, independent rooms and disconnect cleanup.

## SDK execution and unresolved gate

The SDK image is pinned to `ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c` (PrismPM 0.4.0, Lean 4.32.1). The environment's VFS Docker driver could not afford multiple writable copies of this large image. The OCI layers were downloaded and digest-checked, flattened, mounted read-only, and their unmodified tools executed via chroot with temporary writable directories. This differs from ordinary execution of the original image and is not represented as a passing SDK supply-chain attestation.

The full verifier reached its independent application regeneration check and rejected the file closure. The check compares the expected generated paths with the replay-generated paths, before comparing their bytes. This remains an unresolved upstream/toolchain integration issue; the evidence does not establish its root cause. The verifier was not patched or bypassed, and its failure was not converted into a success receipt. Re-run `npm run prism:verify` in the ordinary pinned SDK to investigate further.

The directly checked 288-state round behavior is useful evidence despite that open gate. It must not be generalized into a proof of the WebSocket server, collision wrapper, UI, economy, bots, or whole game.

## Product and operational limits

The first release has one original map, five weapons, 5v5 rooms, bot filling, round economy and plant/defuse gameplay. It omits grenades, hostage modes, voice, accounts, ranked matchmaking and lag-compensated rewind. Enemy positions are transmitted to clients, so it is not protected against wallhack clients. Sessions and scores are in memory.

No public multiplayer load benchmark, hardware-GPU performance certification or mobile gameplay support is claimed. Headless browser checks ran using software rendering. The 0.1.0 release needed a long-running WebSocket server for online play. Release 0.2.0 also supports browser-hosted WebRTC rooms from GitHub Pages; dedicated hosting remains optional, as explained in [DEPLOYMENT.md](DEPLOYMENT.md).

## v0.3.0 bounded evolution

The local preview tick at commit `13bb6c6142684e335ac551932bf87ed910e9bb3a` passed 37 tests, type checking/build, 41 artifact/source hashes, rendered gameplay and actual WebRTC browser gates. It admitted the navigation candidate in preview and restored the tracked source afterward. [Recorded evidence](evidence/evolution-local-preview.json). A separate read-only review found no blocking defects; it did not independently run tests.

The evolution admission Wasm passed all 16 obligation combinations. A deliberately missing scenery instance fails the inventory equivalence assertion; invalid metrics, stale output hashes, racing main updates and deployment build failures have rejection tests. See [scope and operational documentation](SELF-IMPROVEMENT.md). Formal proof limitations above remain unchanged.

Two real GitHub ticks subsequently succeeded and published generations 1 and 2. Generation 1 reduced navigation pair checks from 101,926 to 2,651 with exact graph and sampled-route equivalence. Generation 2 rejected a regressing navigation candidate, then reduced the four-view scenery draw count from 1,002 to 461 and the declared work proxy from 112,732 to 59,820. Fidelity and full game gates passed; this is not a measured FPS claim. The first automatically dispatched Pages run succeeded and the served build stamp matched its generated commit. [Operational receipt and immutable workflow links](evidence/evolution-github.json).

## v0.4.0 creative evolution

Generations 3 (tactics) and 4 (art) were admitted and committed by real GitHub ticks. A later tick correctly recorded no improvement when two art candidates missed the 2% benefit threshold. Generation 4 was observed live and passed public studio/layer tests and a direct WebRTC room test with two humans/eight bots, without uncaught browser errors. [Release receipt](evidence/creative-release.json), [public studio checks](evidence/creative-live-browser.json), [public multiplayer check](evidence/creative-live-peer.json).

Final local verification passed 47 tests, type/build and all 41 artifact/source hashes. Both complete creative preview ticks passed gameplay, WebRTC and studio gates. A fresh reviewer found a baseline test that depended on generated tactics; staging an admitted policy reproduced the failure, and an explicit legacy decider fixed it. Tactical scoring was also calibrated to credit the old bot's effective empty-weapon reload; the corrected independent replay still improves from zero to six completed emergency-defuse fixtures, with no decision regressions. These fixtures use stationary visible opponents.

GitHub Models authorship remains unverified operationally: after proxy configuration, the adapter rejected an invalid response envelope; a direct probe returned plain `OK` instead of a completion. All currently admitted creative programs came from seeded synthesis. The real model adapter, strict validation and fallback receipts are implemented; no successful model-generated program is claimed. Formal proof limitations above remain unchanged.

## v0.5 development verification

The new experience contracts distinguish deterministic unit checks, synthetic frame-trace work, actual browser audio/render checks, and formal verification. The `LexLean and Prism proof audit` workflow reruns both applications under the pinned SDK and preserves failures as failures. See [DEVELOPMENT-ENGINE.md](DEVELOPMENT-ENGINE.md) for the SDK-version/projection mismatch lead and exact limits. No whole-game proof or real-GPU speedup is claimed.

## v0.6.0 Verdant 3D import

The engine dependency advances to `b2b29ca` and the browser uses its actual 22-joint character mesh and poses. Five Rust tests, 60 TypeScript tests, the production build, 42 artifact/source hashes and all four browser suites passed locally. UORust regenerated and checked the Rust inspection projection, including the new character ABI. The browser gameplay gate also checks active character poses, slot cleanup on leaving and a ten-player practice roster. See [integration scope](VERDANT-3D.md); the full Prism verification gate remains open.


## 0.7.0 Prism integration and audit repair (2026-11-16)

The repaired complete local verifier passed for round, evolution and identity, retaining real Lean attestations and application-acceptance evidence. Exact shipped Holo/WASM bindings were checked. Attestation ids:

- Round: `a7269be0b54b1a28d650434824cad92d66cf54eabf63de089718b7f3da8c814f`
- Evolution: `0ae7b36af2d737884064876d689a0061adc48c57304aba06128d0b5d2740ced3`
- Identity: `8395125ead5d8bba66a50624b97959da87f3b51f8ce0227f61cc853ef49666ae`

The recorded upstream verifier backport fixes PP5004 while retaining strict artifact closure and SDK checks; see [proof audit](proof-audit.md). This supersedes the earlier PP5004 blocker, not the documented limits of what the models prove.

Runtime/build/custody checks and game, two-browser WebRTC, creative, sound/render-experience and identity browser suites passed locally. Identity checks exercise the actual published canonical frame, Holo examples, persisted nonextractable keys, wrong-code refusal, cross-device linking and explicit account-binding download. Registry acceptance and official GitHub audit results must be checked independently after publication.

Official GitHub publication [43824159200](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43824159200) passed every browser suite and deployed 0.7.0. Registry registration [43824623472](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43824623472) succeeded; its content-addressed index includes `cs1.618`, fingerprint `dad8090fe2019d846545cda501d933410f5cf5ee2624ed5044939f8ff505ff00`, all 28 examples passed. An isolated Chromium session searched `cs1.618` in the live Me address bar, selected the R4-Laboratories result and reached the published game's lobby.

Official autonomous cycle [43824808356](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43824808356) passed the complete game gates, including current-frame identity binding. Its two experience candidates failed improvement criteria, so it preserved generation 7 and published the refusal evidence in `30d3ab2`. This is a successful evaluation cycle, not a claim that rejected candidates improved the game.
