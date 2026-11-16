# cs1.618 implementation plan

Deliver a playable original browser tactical shooter inspired by the round-based defusal mechanics of Counter-Strike 1.4/1.5. Original geometry, names, models and synthesized audio; no Valve assets.

1. Pin the six requested upstream repositories. Build a Verdant Core WebAssembly bridge for spatial queries, collision and binaural audio. Use the same binary in browser prediction and server authority.
2. Register and test game requirements: bounded input, authoritative hits, wall occlusion, economy, timed reloads, team allocation, freeze/live/planted/end lifecycle, plant/defuse interrupts, late join and disconnect cleanup.
3. Implement fixed-step WebSocket server with named rooms, bot practice, private per-player state, room limits and idle cleanup. Implement one original two-site map, Meridian.
4. Implement browser WebGL presentation with pointer lock, prediction/reconciliation, remote interpolation, weapons, HUD, radar, buy menu, scoreboards, audio, lobby and settings.
5. Generate a round-decision Prism via prism-devrel, check/verify using pinned PrismPM and LexLean, use its generated runtime in server decisions. Project the Rust bridge with UORust. Record exactly which claims have tool evidence.
6. Run Rust/unit/network/browser tests including two independent browsers, adversarial messages, objective lifecycle and artifact integrity. Produce static client, hostable server and release archive with instructions.

Deployment: GitHub Pages serves the static client; a long-running WebSocket host serves multiplayer. One Node process can serve both. Default local URL is port 3000. Online hosting is not implied by a local build.

## Release status

Steps 1–4 and 6 are implemented and verified as described in docs/VERIFICATION.md. Step 5 has a real generated runtime and HOLO, passing check/build and exhaustive runtime parity. The full PrismPM verify gate remains open with PP5004; its failure is retained in the evidence. UORust projection/check passes with its explicit frontier.
