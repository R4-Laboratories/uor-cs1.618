# cs1.618

[![Evolution ticks](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/evolution.yml/badge.svg)](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/evolution.yml) [![Automatic continuation](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/pages.yml/badge.svg)](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/pages.yml)

An original, playable tactical multiplayer FPS inspired by the round-based defusal play of Counter-Strike 1.4/1.5, built on **Verdant Engine** and modeled with the **Prism** toolchain. The repository is `uor-cs1.618`; the game is **cs1.618**.

Two teams of five play for two objective sites on **Meridian**, an original coastal customs quarter. Ember plants the device; Tidal defends or defuses. First to eight rounds wins. Meridian combines original architecture, operators, weapons and synthesized audio with locally packaged CC0 surface scans and a coastal panorama. [Art sources](public/art/meridian/SOURCES.md)

![Customs Arcade in the expanded Meridian arena](docs/evidence/field-update/customs.webp)

[Explore the field update](docs/MERIDIAN-FIELD-UPDATE.md) · [Earlier rendering comparison](docs/STUDIO-UPGRADE.md) · [Inspect the 20 live materials](https://r4-laboratories.github.io/uor-cs1.618/evolution-studio.html#material-inspector)

## Play from GitHub Pages

**[Launch cs1.618](https://r4-laboratories.github.io/uor-cs1.618/)** → join a verified public listing, or **Create browser room**. Rooms are public by default: the disclosure explains that your invitation and public Prism identity are published. Choose **Private** before creating an invitation-only room. WebRTC carries gameplay directly between browsers; no dedicated game server is needed. Keep the host tab open and active. Closing it ends the room.

You can also open [Me](https://afflom.github.io/me/), click its address bar, search **cs1.618**, and choose the **R4-Laboratories** result. Use the shared person icon and the game’s [Prism identity page](https://r4-laboratories.github.io/uor-cs1.618/identity.html) to link identities.

PeerJS Cloud supplies default rendezvous signaling and public STUN helps find direct routes. Restrictive networks may require your own TURN credentials. See [browser multiplayer and STUN/TURN setup](docs/BROWSER-MULTIPLAYER.md). **Practice with bots** still works locally in one browser.

## GitHub-hosted improvement loop

**[Watch ticks run](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/evolution.yml) · [Watch automatic continuation](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/pages.yml) · [Live decisions and generation](https://r4-laboratories.github.io/uor-cs1.618/evolution.json)**

Ticks now run consecutively: evaluate → validate → commit → deploy Pages → automatically queue the next tick. One evolution tick runs at a time. The hourly schedule is a recovery trigger, not the normal wait between ticks. Failed gates stop the chain; an exhausted candidate set settles until new tested recipes or a source change opens more work.

| Mechanism | Code in this repository |
| --- | --- |
| Generate candidates, measure and admit changes | [Tick engine](scripts/evolution/tick.ts), [candidate search](scripts/evolution/policy.ts) |
| Compile real game code | [Generators](scripts/evolution/generate.ts), [experience compiler](shared/experience.ts) |
| Commit only validated outputs and deploy | [Publisher](scripts/evolution/publish.ts) |
| Start the next tick after verified publication | [Continuation](scripts/evolution/continue.ts), [Pages continuation job](.github/workflows/pages.yml), [completion-event fallback](.github/workflows/evolution-chain.yml) |
| Remember decisions and remaining work | [State and history](model/evolution/state.json), [feature backlog](model/development/backlog.json) |

The engine writes variants of rendering, navigation, procedural art, bot tactics and weapon/audio/render experience code. For example, [generation 7 changed executable experience code](https://github.com/R4-Laboratories/uor-cs1.618/commit/99dc1958d643638bdd31874986dca88ab12127d2). It does not independently invent arbitrary new game features: backlog items marked `needs-recipe` or `needs-design` still require implementation. [Mechanism, evidence and limits](docs/SELF-IMPROVEMENT.md).

Explore the [Evolution Studio](https://r4-laboratories.github.io/uor-cs1.618/evolution-studio.html) for admitted art, tactical rules and evidence. [Creative authorship](docs/CREATIVE-EVOLUTION.md) supports seeded generation and optional GitHub Models proposals. Publication remains typed and tested; a finite search does not guarantee continual artistic or gameplay improvement.

## Play locally

Node.js 22.12+ (Node 24 recommended):

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. Choose **Practice with bots** for browser-local play, or select **Dedicated game server** and **Join multiplayer** for the included WebSocket server. To play together, open the same server and enter the same room code. Empty online slots can be filled with bots; a joining human replaces a bot.

The shipped Wasm binaries are committed. Rust and the Prism SDK are needed only to regenerate them, not to play or host.

## What you can play

- Browser-hosted WebRTC rooms with signed Stitch discovery, fresh pinned-host identity verification, private invitations, worker authority, reliable control and unordered realtime data channels. Optional TURN and custom signaling.
- Authoritative 60 Hz server, 20 Hz snapshots, client movement prediction and reconciliation, remote interpolation, isolated named rooms and up to ten players.
- Freeze/buy, live, planted, round-end and match-end phases. Equipment and money persist for survivors; eliminations reset equipment. Win, loss, kill and plant rewards.
- Eight original weapons across two inventory slots, including the Rivet heavy pistol, Tern carbine and Breaker scattergun. The host resolves game damage from range, hit zone, armor remaining and the weapon’s own profile. Hold right mouse to aim and press Q to switch equipped weapons.
- Prism career profiles retain separate practice and multiplayer K/D across visits. Export a signed backup to merge it on another device linked to the same identity. [Career profile](https://r4-laboratories.github.io/uor-cs1.618/identity.html#career)
- Hold-to-plant and hold-to-defuse with persistent objective directions, countdowns and interruption feedback. Single-defuser bot coordination, carrier escort, bounded reaction and burst fire. Dropped-device pickup, defusal kits, blast damage, elimination/timeout/detonation outcomes and scoreboard.
- Five original procedural weapon finishes, reload/switch motion, readable site wayfinding and a stable planted device, with distinct spatial objective and round audio.
- Browser-local 5v5 practice in a worker; online bot fill. Static hosting can run practice without a server.
- Verdant Core's BVH, ray/AABB intersection, vector mathematics and occluded binaural audio execute in the same custom Wasm bridge on client and server. The latest engine also supplies the visible 22-joint operator meshes, skeletal animation and flat-support foot IK, rendered with GPU skinning. See the [3D integration notes](docs/VERDANT-3D.md).

This is a playable first release, not a feature-complete recreation of Counter-Strike. It has one map and the weapons above; grenades, hostages, ranked matchmaking, accounts, voice chat, lag-compensated rewind and production anti-cheat are not implemented. It uses WebGL2 for presentation, as Verdant Resonance does; it does not claim WebGPU rendering or formal verification of the entire game.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Mouse / left click | Look / fire |
| Right mouse | Aim; magnified scope with Longbow |
| Space | Jump; cycle living teammates while spectating |
| Shift | Walk quietly |
| Ctrl or C | Crouch |
| R | Reload |
| 1 / 2 | Primary / sidearm |
| B | Buy menu near spawn during the buy window |
| Hold E | Plant at a site / defuse nearby; stand still |
| Tab | Scoreboard |
| Escape | Pause menu, sensitivity, volume, leave |
| Left / right arrow | Alternative horizontal look |

Desktop keyboard and mouse are required for gameplay. Escape releases pointer lock. Online time continues while menus are open.

## Host multiplayer

```sh
npm ci
npm run build
PORT=3000 npm start
```

One Node process serves `dist/` and upgrades `/socket` to WebSocket. `GET /health` provides a health check. `GET /api/rooms` lists room occupancy. `HOST` defaults to `0.0.0.0`; `PORT` defaults to `3000`. Optionally restrict browser origins with comma-separated `ALLOWED_ORIGINS`.

For the public internet, put the server behind a TLS proxy with WebSocket support. An HTTPS client needs a `wss://` server. A Dockerfile and Compose configuration are included; see [deployment instructions](docs/DEPLOYMENT.md).

GitHub Pages hosts the client, browser-hosted WebRTC multiplayer, and practice mode. For dedicated-server play, select **Dedicated game server** and enter its URL in **Connection settings**, for example `wss://your-game-server.example/socket`. Pages itself cannot run a persistent game server, STUN or TURN. You can share a link with `?room=YOURROOM&server=wss%3A%2F%2Fyour-game-server.example%2Fsocket`.

## Build and verify

```sh
npm test                  # simulation, real Wasm, real WebSocket integration
npm run build             # type check + static client production build
npm run test:browser       # real Chromium clients, input, purchases, combat, practice
npm run test:creative-browser # generated art, studio, controls and rejection cases
npm run test:peer-browser  # static-only WebRTC hosting, invitations, authority, disconnects
npm run test:identity-browser # real frame, persistence, linking and binding
npm run test:experience-browser # render quality, HD, camera and sound
npm run test:discovery-browser # signed listings, live host proof, private/outage cases
npm run test:objective-browser # real input/HUD plus explicit outcome timing fixtures
npm run test:presentation-browser # rendered weapon/map fixtures and real audio
npm run verify            # tests, client build, artifact/source integrity
npm run engine:build      # Rust tests + Verdant Wasm bridge (Rust + wasm32 target)
npm run prism:generate    # prism-devrel builder from the checked-in round prompt
npm run prism:verify      # locked SDK check/build/verify (Docker)
npm run package           # source/server + static-client archives
```

For browser tests, install Chromium once with `npx playwright install chromium`. Source regeneration uses sibling upstream checkouts under `../upstream`, pinned in [model/upstream-lock.json](model/upstream-lock.json), or `UPSTREAM_DIR`.

[Verification evidence](docs/VERIFICATION.md) distinguishes checked behavior, imported engine code, formal model evidence and open claims. [Prism architecture](docs/PRISM.md) describes the original game and proof toolchain. [Studio materials](docs/STUDIO-MATERIALS.md) documents the rendering pipeline. UORust's [frontier](prism/rust-projection/frontier.toml) remains explicit: it is not a claim that the Rust integration has been fully lifted into Lean.

## Layout

| Directory | Responsibility |
| --- | --- |
| `crates/cs-verdant` | Safe game ABI over the pinned Verdant Core engine |
| `public/wasm` | Shipped game and Prism kernel artifacts |
| `shared` | Map, movement, protocol, economy data and round-kernel bridge |
| `server` | Authoritative match simulation, bot navigation, HTTP/WebSocket host |
| `src` | WebGL presentation, input, UI, Web Audio and local practice worker |
| `model` | Requirements, round decision prompt, upstream pins and artifact digests |
| `prism/app` | LexLean model generated by Prism-DevRel |
| `prism/rust-projection` | UORust's source-derived architecture/security/quality projection |
| `tests`, `scripts` | Regression, network, browser and reproducibility checks |

MIT for original game code. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependencies. This is an independent project, not affiliated with Valve or Counter-Strike.

### Free feature development

Weapon spray/recovery, distinct bounded audio, adaptive render quality and saved player settings now run in the browser. The scheduled engine generates and tests variants without paid model access. See the [development mechanism and feature frontier](docs/DEVELOPMENT-ENGINE.md), [live studio](https://r4-laboratories.github.io/uor-cs1.618/evolution-studio.html), and [formal proof audit](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/proofs.yml). The repaired formal audit checks the round, evolution and identity applications and binds their exact published bytes; its scope remains smaller than the whole game.

The [Prism identity page](https://r4-laboratories.github.io/uor-cs1.618/identity.html) and canonical address bar connect the game to the same registry/account ecosystem as Me. See [Holo packaging, discovery and identity limits](docs/HOLOGRAM.md) and the [verifier repair](docs/proof-audit.md).

## Latest engine integration

Meridian uses Verdant Engine 2.22.4, with vTensor validating RGBA texture layouts and vRAM selecting the storage format for Studio roughness tiles. Verdant Studio directs the surface library through OpenPBR and MaterialX. [Studio upgrade](docs/STUDIO-UPGRADE.md) · [Verdant 3D integration](docs/VERDANT-3D.md). Use the pause menu’s render quality setting to compare HD4 and HD0. [Evolution impact audit](docs/evidence/evolution-impact-audit-2026-11-16.md) separates accepted program changes from evaluation-only ticks.

## Release evidence and rendering research

[The tactical experience refresh](docs/GAME-EXPERIENCE-REFRESH.md) records the newer bomb HUD, interaction audio, weapon/site presentation and bot sight/routing improvements with before/after evidence. [0.9.0 scope and validation](docs/RELEASE-0.9.0.md) records the browser fixtures, software-rendering limits and external relay evidence. [Three.js and Prism rendering research](docs/THREE-PRISM-RENDERING.md) explains the existing GPU/Wasm boundary and bounded follow-up experiments; [numeric export tracking](docs/research/NUMERIC-EXPORT-TRACKER.md) separates confirmed source facts from pending export investigations.
