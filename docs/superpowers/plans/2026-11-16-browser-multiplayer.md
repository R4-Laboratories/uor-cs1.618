# Browser Multiplayer Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Host and join cs1.618 matches entirely in browsers from GitHub Pages.
**Architecture:** Existing Match runs in a dedicated worker in the creator's browser. PeerJS provides replaceable rendezvous signaling; native WebRTC channels carry game messages. The host remains authoritative.
**Tech Stack:** TypeScript, Web Workers, PeerJS 1.5.5, WebRTC, existing Verdant/Prism Wasm, Playwright.
**Spec:** docs/superpowers/specs/2026-11-16-browser-multiplayer-design.md

## Global Constraints
- Ten players maximum; existing 60 Hz simulation and 20 Hz snapshots.
- Static Pages deployment; no dedicated game server required for browser rooms.
- No auto-migration, guaranteed NAT traversal, public TURN credentials or anti-cheat claims.
- Preserve dedicated server and local practice modes.

## Review Focus
- Bad or repeated join messages must not evict players or allocate extra worlds.
- Unordered snapshots must not rewind the client.
- Failed signaling, full rooms, wrong invitation and host departure must release resources and return usable UI.
- Custom signaling and TURN settings must not leak credentials into invitation URLs.
- Queue backpressure and missing realtime channels must not grow memory or freeze the app.

### 1. Host boundary and configuration
- [x] Add `shared/browser-host.ts`: BrowserMatchHost wraps Match, emits per-peer messages, validates bounded join/input/buy/ping and tracks connection lifecycle.
- [x] Add `src/peer-config.ts`: parse invitations, generate fragment URLs, validate ICE/signaling settings.
- [x] Add meaningful Node tests for malformed joins, bot replacement, private snapshots, rate limits, cleanup, invite parsing and relay configuration.
- [x] Run `npm test`.

### 2. WebRTC transport and worker
- [x] Add `src/host-worker.ts` to initialize real Wasm, dispatch host operations and tick with bounded elapsed time.
- [x] Add `src/peer-room.ts` with host/create and guest/join, encrypted invitation handshake, reliable controls, unordered realtime channel, queue limits, connection deadlines and candidate diagnostics.
- [x] Integrate transport in `src/main.ts` and prevent stale snapshot rollback.
- [x] Run `npm run build`.

### 3. User flow and browser evidence
- [x] Add create/join selection, invitation sharing, network settings and host lifecycle notices in `src/ui.ts` and CSS.
- [x] Add `scripts/peer-browser-test.ts`: isolated browsers, static-only HTTP and local signaling; exercise real data channels and worker simulation, invalid invite and host loss.
- [x] Run new browser check and existing gameplay checks.

### 4. Publish
- [ ] Document architecture and STUN/TURN operation, update README/manual and CI.
- [ ] Run verification, build release archives, commit and push.
- [ ] Confirm Pages deployment, live browser smoke, and repository description/website link (report permission blocks explicitly).


## Execution record

- Chosen implementation: existing TypeScript/Match/Web Worker with PeerJS rendezvous; user authorized proceeding and publishing. Host migration remains the separately identified follow-up.
- Host/config tests failed before implementation, then passed. Full suite grew from 22 to 28 tests.
- Real WebRTC test passes with a static-only HTTP host and local signaling. Existing rendered server/practice test passes.
- Review: unsolicited PeerJS media offers bypassed the game's link limits. Reproduced retained-call failure, added immediate close on host and guest, and verified the full suite. The reviewer's provisional duplicate-open finding was withdrawn after tracing PeerJS error ordering.
- Test infrastructure: PeerServer 1.0.2 does not expose its recurring maintenance timers for shutdown. The CLI test exits successfully only after all assertions and resource cleanup; failures throw before that exit.
- Repository website link confirmed. GitHub returns HTTP 403 for description updates; browser fallback unavailable. User was given exact About-panel text.
