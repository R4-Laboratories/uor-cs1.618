# Prism frame immutable dependency repair

## Diagnosis and scope

Pages run **43919246410** passed game/browser/peer/creative gates, then timed out waiting for the shared frame account. The old runner had no failure receipt. Instrumented real Chromium reproduction confirms **four HTTP404 responses** for the immutable panels URL `https://uor-foundation.github.io/template/frame/9e618c80b716a37942a69c82b24b0843c80f612c6c580e5e63a1e5a64bd29e02/prism-panels.mjs`. The account remained absent, accountReady false and panelChildren zero, while the actual compiled identity policy replayed 28 examples and device creation/linking/public export worked. This is a production dependency-availability regression, not a passkey interaction mismatch or an insufficient test timeout.

Evidence: `artifacts/pages-0.9.0-identity-failure.log`, `artifacts/identity-dependency-repro.log`, `artifacts/identity-dependency-red.json`.

The published frame's account loader closes over a hardcoded remote host; no public URL/loader override exists. The app now delivers only its two exact immutable dependencies through an application-scoped Service Worker. Original frame bytes, vendor source, SDK/guest pins and all real account/signature/proof checks remain unchanged. No production/global fetch monkeypatch, fake account, fake signature, mocked proof or skipped assertion.

## Exact-byte recovery and custody

Parent recovered the dependencies using the **unmodified upstream publisher** at `UOR-Foundation/template@5b712b9d7b123af6c4545534ffa7c8b1647e7110`, original photo inputs and the original locked Terser 5.51.2 dependency tree. The recovery reproduced the already-pinned canonical frame byte-for-byte, anchoring the outputs to the frame actually shipped.

- Canonical frame: SHA256 `7087830654aff9ba7f53ec4fe521330a3b0b42bcf9435bdd00f2cb76210df849`, 62,343 bytes, unchanged.
- Published panels: SHA256 `9e618c80b716a37942a69c82b24b0843c80f612c6c580e5e63a1e5a64bd29e02`, 49,707 bytes.
- Published minified identity bundle: SHA256 `03cee6c658dce4a4eed6aeb640ea3dd02ba79b5402066c2c7fff8ffd52a072ef`, 96,780 bytes. This is separate from the unchanged source bundle in vendor/template (SHA68482230…).

Mirrors are under `public/prism-frame/<sha>/<name>`. Authoritative URL/path/hash/length/provenance map: `model/prism-frame.json`. `scripts/prism-frame-assets.mjs` verifies hashes, binds the dependency chain to literal hashes in the unchanged frame/panels, and generates `public/prism-frame-assets.mjs`; `--check` requires byte-for-byte projection agreement. Existing `hologram-manifest` verification invokes this check. `model/artifacts.json` now checks 77 files, including mirrors, generated map, worker, recovery receipt and license custody. Public Holo host manifest explicitly describes tested delivery scope and the Service Worker requirement.

Recovery evidence and upstream notice/license: `docs/evidence/stitch-modern/prism-dependency-recovery.json`, `docs/licenses/prism-template-NOTICE.txt`, `docs/licenses/prism-template-MIT.txt`, `public/prism-frame/LICENSE.txt`. Existing pinned license/source files were not modified.

## Delivery behavior and lifecycle

- `public/prism-frame-worker.js` routes **only GET requests to the two exact immutable upstream URLs**. Unknown URL, host, query, path, method, game JS, engine Wasm and navigation are untouched. It is not a general proxy.
- A matching request reads the corresponding same-origin mirror beneath the registration scope, verifies SHA256 and byte count, and returns it. Missing or altered bytes return 502, with no remote or fake fallback. The original frame/panels loader then performs its existing SHA check again before executing.
- No Cache API, application cache, engine cache or navigation caching. Worker fetches have an 8s deadline/cleanup. `skipWaiting` and `clients.claim` permit first-page control and worker updates; app/engine/code requests remain ordinary network requests.
- `src/prism-frame.ts` registers at the actual app base (localhost root or Pages subpath), waits at most 10s for that exact controller and a dependency-version handshake, then preflights the two URLs through it with a shared 10s deadline before importing the unchanged verified frame. All preflight requests are aborted/released in finally, including the sibling request after an early failure.
- Any unrelated active/waiting/installing worker at the same exact scope is preserved and causes a visible frame-unavailable state; no unregister operation is used. Broader scopes are not removed. On failure, the frame is visibly unavailable/aria-disabled and provides no sharing/account fallback.
- First-page preflight adds about 146KB of local immutable dependency reads. It prevents upstream's silent lazy-load failure from leaving a misleading empty account panel. Original frame semantics and cryptography remain unchanged.

## Regression and verification evidence

- New `tests/prism-frame-assets.test.ts`: initial **3/3 red** for missing custody/projection/route; after implementation **3/3 green**. Tests verify exact byte custody, one authoritative projection, root/Pages path resolution, GET-only exact allowlist, exclusion of unrelated requests, and real SHA rejection of modified/missing bytes. Logs: `artifacts/prism-frame-assets-red.log`, `prism-frame-assets-green.log`.
- Focused identity suite: **14/14 passed**, including the three new tests plus existing hologram identity/policy tests. `artifacts/prism-frame-focused-tests.log`.
- Negative browser gate first failed because a corrupt companion left the original lazy frame silently unavailable without a visible startup error. After bounded startup preflight, all cases pass: corrupt byte → worker502 + no account + visible disabled frame; worker unavailable → no account + visible disabled frame; unrelated same-scope worker remains controller; navigation and engine fetches are not intercepted. `artifacts/frame-assets-browser-red.log`, `frame-assets-browser-red.json`, `frame-assets-browser-green.log`, `frame-assets-browser.json`.
- Real identity browser gate passes with new fresh browser contexts on localhost root and `/pages-scope/`, with first-page controller checks and response `fromServiceWorker === true` for both exact dependencies. Real Holo acceptance, nonextractable identity reload, wrong-code refusal, two-context device linking, signed public export, **actual shared frame account creation and verified signed binding/export**, and mobile layout all remain asserted. Zero page errors. Logs: `artifacts/identity-dependency-final.log`, `identity-dependency-subpath-green.log`; receipts: `artifacts/identity-browser.json`, `identity-dependency-subpath.json`.
- The negative gate is composed into existing mandatory `npm run test:identity-browser`, so Pages and evolution acceptance cannot omit it. Standalone command: `npm run test:frame-assets-browser`.
- `npm run test:discovery-browser`: passed seven existing checks, including real signed Stitch framing, fresh host challenge before WebRTC welcome, substitution rejection, normal withdrawal, private-room silence and honest relay503 fallback. Existing harness rendering isolation was unchanged and is not claimed as graphics evidence. `artifacts/prism-frame-discovery.log`.
- `npm run build` / TypeScript: passed. The final parent verification did not report an identity.css build warning. `artifacts/prism-frame-build.log`, `prism-frame-final-tsc.log`.
- Unchanged vendor custody check passed; public Holo manifest/projection check passed; artifact check passed **77 hashes / six upstream pins / import-free Wasm / mandatory Prism runtime**. `artifacts/prism-frame-vendor-check.log`, `prism-frame-manifest-check.log`, `prism-frame-artifact-check.log`.
- `git diff --check`: passed. No broad full-game suite rerun was needed for this focused dependency repair.

## Review and remaining release gate

Candidate is uncommitted pending scoped production review and root authorization. This is a tested host-delivery adapter, not an extension of formal proof claims. Publication is not claimed: the parent must commit/review and rerun Pages acceptance/deployment. Original unavailable upstream panels remain unavailable externally; the application now owns exact verified delivery of its immutable dependency closure.
