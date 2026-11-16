# Hosting cs1.618

## GitHub Pages: browser rooms and local practice

The Pages workflow builds and tests the client on pushes to `main`. Enable **Settings → Pages → Source: GitHub Actions**. Assets use relative paths, so the repository subpath works without changes. The workflow never tries to run a WebSocket process on Pages.

Open the deployed URL and choose Create browser room, then share its invitation. Friends join through WebRTC; the creator's browser runs the match. See [browser networking](BROWSER-MULTIPLAYER.md) for signaling, STUN and optional TURN. Practice still plays entirely locally. For the optional dedicated server, select Dedicated game server and enter its secure WebSocket URL in Connection settings. That URL is saved only in that browser. Room codes are case-insensitive and contain 1–20 letters, digits or hyphens.

## A single host: client plus multiplayer

```sh
docker compose up --build -d
```

Open `http://localhost:3000`. On a LAN, other computers can use `http://HOST_LAN_IP:3000`. Browsers typically permit pointer lock there, but production should use HTTPS. Stop with `docker compose down`.

For an internet host, map your domain to the server and place a TLS proxy in front. An example Caddy route:

```caddy
play.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

Caddy handles WebSocket upgrade forwarding. Keep the Node process alive with Docker's restart policy. The default client uses its own origin's `/socket`, so this deployment needs no manual connection configuration.

To use the Pages client with a separate server, enter `wss://play.example.com/socket` there. If `ALLOWED_ORIGINS` is set, include the Pages origin (scheme and hostname, no repository path).

## Codespaces

The devcontainer installs dependencies and forwards port 3000. Start `npm run dev`. To invite other people to a temporary session, make that forwarded port public in the Codespaces Ports panel, then share its HTTPS URL and room code. The session ends when the Codespace stops. Codespaces is a development host, not an always-on dedicated server.

## Operational boundaries

Rooms and scores live in memory. When the final human leaves, a room is deleted; restarting the server ends its matches. One process supports at most 32 rooms and 200 sockets, with ten players per room. Inputs are validated and rate-limited, but this release is intended for small hosted sessions, not an authenticated competitive service. All remote players' positions are sent to clients; anti-wallhack visibility filtering is not implemented.

The server owns movement timing, ammo, purchases, damage and round outcomes. Client timestamps do not grant movement time. There is no lag-compensated rewind: high-latency players must lead moving targets. No passwords, personal profiles or persistent player data are collected.
