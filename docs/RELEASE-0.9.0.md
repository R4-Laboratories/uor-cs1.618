# cs1.618 0.9.0 — public matches and tactical presentation

Release integration, 2026-11-16. Publication and a deployed-origin smoke test are separate gates; this document records local evidence and does not claim a GitHub deployment or release has completed.

## Implemented behavior

Public-by-default browser rooms publish signed, short-lived invitations through the existing pinned Stitch relay. Discovery joins pin the listing Prism and require a fresh live host proof before receiving gameplay. Private rooms publish nothing. The lobby explains publication, bounds/scrolls its list on mobile and desktop, and reports relay outages while retaining direct invitations. Real-time matches remain host-authoritative WebRTC; ntfy, PeerJS signaling, STUN and optional TURN are availability dependencies.

The objective lifecycle now resolves deadline ties, exclusive defuser ownership, interruption and terminal state consistently through the existing round kernel. Players get persistent team instructions, bearings/distance, progress and countdown. Bots coordinate defusal/cover and carrier escort with bounded line-of-sight reaction and controlled bursts. Blast damage is an original bounded radial rule. Five original procedural weapon finishes, reload/equip motion, richer surfaces and wayfinding, a stable planted device and distinct spatial objective/result cues improve readability. Shared Prism theme variables no longer override game labels. Geometry/material and audio voice ownership remain bounded.

No new Rust source, engine binary, generated guest, upstream pin, collider or external asset dependency is introduced by this increment. Three remains the GPU renderer. See [rendering research](THREE-PRISM-RENDERING.md) and the separately tracked [numeric export investigation](research/NUMERIC-EXPORT-TRACKER.md).

## Validation and evidence

The final integration report and machine receipts are recorded under [evidence/stitch-modern](evidence/stitch-modern/). All eight browser suites are required by both Pages and autonomous evolution acceptance; the presentation npm command includes its additional offline-audio runner. External live-service probes stay outside mandatory CI to avoid turning service availability into a deterministic gate.

| Command | Result |
| --- | --- |
| `npm run verify` | 133/133 tests after dependency recovery, zero failures/skips; generation check, 18 pinned vendor files, manifest, TypeScript/Vite, 77 source/artifact hashes, six upstream pins and mandatory import-free guests. |
| `npm run test:browser` | 11 checks after the CI fixture follow-up; real multiplayer purchase/movement/aim/combat/scoreboard/leave and ten-player practice. Initial failures and passing local repairs retained. |
| `npm run test:peer-browser` | 8 checks, real unordered WebRTC, invitation refusal, host authority, signaling-loss continuity and departure. |
| `npm run test:creative-browser` | 6 checks, studio, reversible original/evolved artwork, mobile width and rejection cases. |
| `npm run test:identity-browser` | 10 checks, real frame/Holo, persistence, wrong-code refusal, linking, public export and account binding; root and Pages-subpath runs, plus three mandatory loader failure cases. |
| `npm run test:experience-browser` | Pass; ten weapon/occlusion audio measurements, voice bounds/retirement, HD0/HD4, native/Performance ratios, camera recovery, digest-addressed engine, persistence/mobile width. |
| `npm run test:discovery-browser` | 7 checks, signed public discovery, mobile bounds, live pinned-host proof/substitution refusal, withdrawal, private silence and outage fallback. |
| `npm run test:objective-browser` | 4 checks, persistent HUD, real keyboard interaction/cancel and explicitly fixtured compiled-kernel terminal outcomes. |
| `npm run test:presentation-browser` | Pass from fresh Vite cache; real fixed-view screenshots/resource checks plus 14 distinct audio waveforms, zero page errors. |
| `npx tsc --noEmit` | Pass after the gameplay harness change. |
| `git diff --check`, stylesheet/license byte comparisons | Pass. |

The multiplayer gameplay gate uses two fully rendered clients in the real Performance setting, 1100×760 CSS viewports and deviceScaleFactor 0.5, without a hidden override. Its initial native/auto run completed movement/combat but disconnected the primary client before the scoreboard assertion. The exact socket cause was not captured; software-render load is the working explanation. All gameplay assertions were retained in the passing bounded-render retry; native quality remains covered separately by presentation and experience. Failure diagnostics now retain lobby/focus/activeElement/pointer-lock/scoreboard visibility.


GitHub run [43917054531](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43917054531) then passed `npm run verify` but failed the movement fixture: it assumed an axis-aligned camera and sampled a fixed 900ms key pulse. Diagnostics showed real movement with yaw 1.1/pitch 0.874. Harness commits `dcb7dc6` and `e506ab7` establish aim through the real pointer handler, await both position/movement observations, and require an actual newly processed neutral input before changing fixtures. Fire remains a real mouse event and now awaits remote damage with explicit ammo consumption. Both scenes remain rendered; thresholds and production behavior are unchanged. The focused rerun passed **11 checks** and TypeScript. An injected early error verified failure receipts are saved even before the first screenshot. See the [scoped repair report](evidence/stitch-modern/browser-ci-fix-report.md); remote rerun remains a separate deployment gate.

The fresh presentation run began after removing only generated `node_modules/.vite`; it passed without an optimizer-reload workaround. Its fixture renders one real WorldView with fixed snapshots (no hidden override), including native/Performance HD, all weapons, reload/switch, stable/terminal bomb and mobile readability. Repeated switches retained 23 renderer geometries. OfflineAudioContext distinguished 14 cues and checked peaks, stereo, silent tails, completion, voice limit 16, stop, mute and retirement.

The objective browser gate intentionally isolates the HUD with scene rendering paused. It observes real E input/progress/cancellation through normal WebSocket transport and the host, then uses late-progress/expiry fixtures for outcomes. It does not claim full-duration browser timing. Real Verdant/round-kernel tests independently check the 3/5/10/40-second boundaries at 180/300/600/2400 simulation ticks. An earlier task-2 full real-time browser lifecycle passed once, but only its log was retained; later HUD screenshots are not evidence of that earlier rendered run.

Discovery's reproducible test intercepts only ntfy HTTP at the external boundary while retaining actual upstream bus framing, signatures, compiled identity admission, local PeerServer and WebRTC. It tests signed host substitution refusal, withdrawal, private silence and outage fallback. Separately, [the retained public relay receipt](evidence/stitch-modern/discovery-live-relay.json) records actual ntfy GET/POST 200 responses, actual PeerJS Cloud and WebRTC, pinned-host verification and departure/withdrawal, with no intercepted HTTP. That probe ran on a **local preview origin**, not the final Pages origin, with scene rendering paused to isolate networking; it establishes one observed success, not availability, NAT/TURN coverage or load tolerance.

## Dependency availability repair

Pages run [43919246410](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43919246410) passed gameplay, peer and creative checks, then found the pinned Prism panels URL returning HTTP404. This broke real shared-frame account creation. The exact original publisher and locked dependencies reproduced the canonical frame and both companion module hashes; [recovery receipt](evidence/stitch-modern/prism-dependency-recovery.json) and [scoped review](evidence/stitch-modern/prism-dependency-review.md) retain the evidence.

The app now owns exact local copies of those two immutable modules. A Service Worker at the application's scope handles only their exact GET URLs and verifies bytes; the original loaders verify their hashes again. Navigation, game code and engine downloads are untouched. Startup waits for matching control and fails visibly on missing/corrupt bytes or conflicting scope ownership. HTTPS/localhost and Service Worker support are required for this shared frame. This is tested host delivery, not a new formal identity proof or a change to the canonical frame, vendor, engine or guests. The MIT license is retained.

The repaired real identity flow passes on root and Pages-style paths. Negative browser checks reject altered bytes and unavailable workers and preserve unrelated worker ownership; they now run in mandatory identity acceptance. Discovery's seven checks also pass. Final local `npm run verify` passed 133 tests and 77 custody hashes. The original failure remains recorded; final remote deployment is a separate acceptance step.

## Proof and performance scope

The compiled round, evolution and identity guests remain mandatory. Existing proof/attestation evidence is preserved; 0.7's repaired PP5004 gate remains described in [the proof audit](proof-audit.md). Four identity observations still correspond to actual host checks. These facts do not prove host cryptography/adapters, discovery networking, bots, rendering/audio, GPU drivers or the entire game. The 0.9 host changes are empirically tested open claims.

Browser screen evidence uses Chromium software rendering/SwiftShader. Presentation screenshots and the rendered experience/gameplay checks show appearance and behavior; they do not establish physical-GPU FPS. Timing fixtures are disclosed above. No public load benchmark, TURN coverage, human-identity guarantee, competitive anti-cheat or host migration is claimed. Browser throttling can stall authority or expire listings; crash cleanup relies on the 45-second lease. Signatures do not prevent identity spam or relay denial of service.

The build recognizes the public identity stylesheet after correcting its source URL; output stays relative (`./identity.css`) and its bytes are unchanged. The pinned vendor's dynamic import analysis warning remains documented rather than modifying upstream custody. Experimental Node ML-KEM/ML-DSA warnings are toolchain notices, not failed checks.
