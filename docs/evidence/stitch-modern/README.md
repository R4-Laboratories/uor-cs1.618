# 0.9.0 integration evidence

These are retained local validation receipts for the 2026-11-16 integration. [Release notes](../../RELEASE-0.9.0.md) state the full commands, counts and limits. Copied transcripts trim trailing whitespace; original logs remain under artifacts/. Logs retain warnings and fixtures rather than claiming a whole-game proof or physical-GPU performance.

- `discovery-live-relay.json` is the earlier independent live ntfy/PeerJS Cloud/WebRTC probe from a **local preview origin**. No HTTP interception; no deployed-origin or uptime claim.
- Reproducible discovery evidence intercepts external ntfy HTTP only; signatures, framing, compiled identity admission and WebRTC are real.
- Objective evidence uses real keyboard/transport observations plus late-progress/expiry host fixtures, with scene rendering paused; exact durations are tested with the real engine/kernel.
- Presentation images use fixed snapshots in real Three WorldView with SwiftShader. `after-sidearm.png`, `after-site.png`, and `after-mobile-lobby.png` were refreshed by the cold-cache presentation gate. They establish appearance/readability, not hardware frame rate. Other suite screenshots and before/after weapons remain in the release's full `artifacts/` collection.
- Audio receipts use real OfflineAudioContext output, stereo/peaks/tails, and live voice retirement checks.

The local build's commit stamp precedes the integration commit because verification runs before commit. Publication must rebuild the final source and validate the served stamp; these local receipts must not be labeled a completed Pages deployment.

The cold presentation command printed 0.8.0 because it began immediately before the metadata-only 0.9.0 bump; feature code was final. The verify/build and remaining suites used 0.9.0. Its harmless development reload notice and all warnings remain in the transcript.

Final publication: source 382c45d is released as v0.9.0 and passed all Pages jobs. The `pages-*0.9.0` and `discovery-live-pages.json` receipts record actual deployed-origin verification; earlier local receipts retain their original scope and failures. The public match probe pauses scene rendering, uses actual public services and withdraws its transient listing.
