# Browser-hosted multiplayer

Open https://r4-laboratories.github.io/uor-cs1.618/ on a desktop browser with WebGL2 and WebRTC support.

1. Enter your callsign and choose a team. Leave **Browser-hosted · WebRTC** selected.
2. Choose **Public** (default) to publish your invitation and public Prism identity, or **Private** for invitation-only access, then click **Create browser room**. The browser starts the authoritative game in a Web Worker. Public listings can also be joined directly from the lobby.
3. Copy the invitation on the deploy screen and send it to friends. You can copy it again from the Escape menu.
4. Friends open that link and click **Join invitation**. They can also paste it into the lobby. Click **Deploy** to capture the mouse.

The room supports ten players. Its creator controls bot filling. A human replaces a bot when joining a full bot-filled room. Late arrivals spectate until the next round. Anyone with the invitation can join and share it; treat it as a room access key. Room identifiers are random, and the 128-bit invitation key is sent over the encrypted data channel for admission, not through signaling metadata. The URL fragment is not sent in ordinary HTTP requests to Pages. Public room creation deliberately publishes that invitation key inside the signed relay listing; private rooms publish no listing.

**Keep the host tab open and active.** The browser host owns movement, shots, ammo, purchases, bots and round outcomes. Closing it ends the room. Browser background throttling, laptop sleep and weak devices can stall the simulation. This release does not migrate the host or restore a closed match. For unattended games, the dedicated-server mode remains available.

## What runs where

| Component | Location and purpose |
| --- | --- |
| Web app, map, Verdant/Prism Wasm | GitHub Pages, loaded into every browser |
| Authoritative Match | Creator's Web Worker, 60 Hz simulation, 20 Hz snapshots |
| Inputs and snapshots | WebRTC unordered channel with no retransmissions; stale snapshots are ignored |
| Join, purchases, responses | Reliable ordered WebRTC control channel |
| Rendezvous signaling | PeerJS Cloud by default; exchanges SDP and ICE connection information |
| STUN | Public Google/Cloudflare services by default; discovers usable network routes |
| TURN | Optional operator-configured relay when direct WebRTC is blocked |

The realtime channel falls back to the reliable channel while opening. Backpressure drops stale realtime traffic; excessive control queues disconnect. The host enforces a ten-connection limit, invitation admission, message size/rate limits, input validation and join/idle deadlines. Established game traffic continues if the signaling connection drops; joining additional players still needs signaling. The client attempts to reconnect signaling.

This is **no dedicated game server**, not zero infrastructure. Third-party signaling/STUN availability is outside this project's control. Signaling receives connection metadata and IP information; STUN discovers the public route. A TURN relay forwards encrypted WebRTC traffic and incurs bandwidth use. The current browser host is trusted and can cheat if modified. Discovery joins verify the listing Prism and a fresh live host challenge before admitting gameplay. This does not verify a human identity, trust the host implementation, provide competitive anti-cheat or guarantee NAT traversal.

## STUN cannot run on GitHub Pages

Pages serves static HTTP files. STUN and TURN must listen for network traffic and answer their protocols, commonly on UDP/TCP 3478 and TURN/TLS 5349. Hosting a second static page cannot provide that service. A page can contain the game or a configuration form, but the actual STUN/TURN endpoint must run on a network host or managed provider.

Most direct connections work with STUN alone. Symmetric NAT, corporate firewalls and some mobile networks require TURN. Configure TURN on **both the creator and guests** for the best coverage; each browser's settings control the ICE candidates it gathers. The default does not include a TURN account.

In **Connection settings**:

- **STUN servers:** comma-separated `stun:` or `stuns:` URLs. Leave empty for LAN-only testing.
- **Optional TURN relay:** one or more provider URLs, such as `turn:relay.example.com:3478?transport=udp` and `turns:relay.example.com:5349?transport=tcp`, plus its username and credential.
- **Require relay:** use TURN only. It refuses to start without configured TURN credentials; it does not guarantee the credential is valid.
- **Signaling service:** an HTTPS PeerServer base URL, or empty for PeerJS Cloud. All participants must choose the same service. Custom service settings are not embedded in invitations.

Only STUN and signaling preferences are saved locally. TURN credentials remain in the current tab and are excluded from invitations and source control. Use short-lived credentials from your provider when available. Do not commit a privileged relay secret into a public static bundle.

The pause/deploy panel reports **direct** or **relayed** from the selected ICE candidate pair. If it remains negotiating or fails, verify the host is still present, both participants use the same signaling service, and TURN is configured for restrictive networks. Unsupported WebRTC, an unavailable room, an invalid key, startup timeout and host departure produce a lobby error.

## Run your own signaling

PeerServer does not simulate games or carry normal gameplay data:

```sh
npm ci
npx peerjs --port 9000 --path /peerjs
```

Put it behind an HTTPS reverse proxy supporting WebSocket upgrades, and use its external base URL in Connection settings. GitHub Pages clients require HTTPS signaling. The included `peer` dependency is a development tool used by the network test; it is not added to the dedicated game server's runtime image.

For your own STUN/TURN, use a persistent host and a maintained implementation such as coturn, or a managed TURN provider. Configure its public address, authentication, listening ports and relay port range according to that provider's instructions. Neither Pages nor a browser service worker can replace this listener.

## Verification scope

`npm run test:peer-browser` starts only static-file hosting and a local PeerServer. Two isolated browser contexts use real WebRTC and the production worker/Wasm. It checks bad-invitation rejection, private identity, guest purchase and movement, no gameplay on signaling, survival of signaling disconnect, and host departure. STUN is disabled in that local test; it is not a cross-ISP or TURN reliability test. The existing browser suite separately checks rendered dedicated-server gameplay and local practice.

A release's successful live smoke confirms only the observed browser environment, not every router/firewall combination. Host migration and authenticated competitive play remain future work. The prior PP5004 verification blocker was repaired in 0.7.0; see [proof audit](proof-audit.md). Discovery and transport remain tested host code, without a formal networking proof.

## Signed public discovery (0.9.0)

The unchanged pinned Stitch `createRelayBus` publishes signed 45-second leases via the hosted ntfy service, refreshed every 20 seconds. A listing binds application audience, protocol, original Meridian map, room invitation, occupancy and supported signaling endpoint. Receivers check shape, signature, freshness and compiled identity admission. Joining a listing also requires a one-use fresh challenge tied to both transport peers, the invitation and the pinned Prism; a copied or substituted listing cannot bypass that host proof. Normal leave withdraws the listing; crashes rely on expiry.

The bounded directory permits PeerJS Cloud and canonical same-origin HTTP(S) signaling. Use Private for arbitrary custom signaling. Publication acknowledgement is not delivery assurance. Outages are reported, and direct invitations remain usable where signaling/WebRTC work. Browser throttling and clock skew can expire otherwise live listings. Private keys, frame-account sessions and TURN credentials are excluded. Signatures do not prevent identity spam, withheld revocations or relay denial of service.

`npm run test:discovery-browser` uses isolated contexts, real Stitch framing/signatures, the compiled identity guest, local PeerServer and real WebRTC, with only the external ntfy HTTP boundary intercepted. Seven checks cover public disclosure/discovery, host proof/substitution refusal, withdrawal, private silence, outage fallback and mobile/desktop list bounds. A separate observed public-service probe used real ntfy and PeerJS Cloud from a local preview origin; it is not an availability guarantee or a deployed-origin test. See [release evidence](RELEASE-0.9.0.md).
