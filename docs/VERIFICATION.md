# Verification of release 0.1.0

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

No public multiplayer load benchmark, hardware-GPU performance certification or mobile gameplay support is claimed. Headless browser checks ran using software rendering. GitHub Pages can host the static client and local practice; online matches need a long-running WebSocket server, as explained in [DEPLOYMENT.md](DEPLOYMENT.md).
