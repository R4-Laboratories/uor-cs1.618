# Browser-hosted multiplayer

The user approved the proposed first release: an elected creator hosts the existing authoritative Match in a Web Worker; guests connect over WebRTC; the complete app stays on GitHub Pages. Automatic host migration is a subsequent project, not claimed here.

Use PeerJS 1.5.5 for rendezvous signaling, configurable to an independent PeerServer. The default uses PeerJS Cloud. Explicit STUN configuration discovers direct routes; optional TURN credentials and relay-only mode cover restricted networks. GitHub Pages cannot listen for STUN, TURN or signaling requests. No public service availability or cross-network NAT success is guaranteed.

Each connection carries reliable ordered control messages and an unordered, zero-retransmission data channel for inputs/snapshots. A random room identifier and invitation secret are shared through a URL fragment. Authenticate the secret over the encrypted data channel, not in signaling metadata. The host validates input and owns the simulation. Guests cannot select their player identity or directly mutate Match. Bound connection counts, packet sizes, message rates, timeouts and outgoing queues. Stale unordered snapshots must not roll back the client.

Keep bot practice and dedicated-server play available. Browser-hosted mode becomes the default on Pages; local development preserves the server option. Host creation exposes a copyable invitation before deployment and in the pause menu. Diagnostics show direct/relayed connection state; failed joins offer clear recovery. Closing the host ends the match; background tabs and suspended laptops may stall it. No competitive anti-cheat claim.

Alternatives considered: full peer mesh and lockstep multiply connections and conflict resolution without solving host trust; manual SDP exchange is awkward and large. PeerJS rendezvous with native WebRTC channels fits the existing authoritative simulation and lets users replace signaling infrastructure.

Verification: unit-test the host boundary and invitation/config parsing, then connect isolated Chromium contexts using a local signaling-only PeerServer and static Vite output, with no Node game server. Verify joins, snapshots, input authority, purchases, rejection, guest departure, and host shutdown. Retain the existing server/practice suite. Deploy to Pages and smoke-test public host/join if network access permits.
