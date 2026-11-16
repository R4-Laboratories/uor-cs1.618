# cs1.618 in the Prism ecosystem

The shared address bar used by `afflom/me` and Verdant reads the canonical Prism registry. cs1.618 now uses that same `<prism-frame>` component. Type an app name in the bar to discover other registered apps; the person icon uses the shared Stitch Prism identity framework. The bar is available in the lobby and pause menu and hides during active mouse-look gameplay.

## Discovery and publication

`public/app.json` names the app, its repository and public game URL. `public/app.holo` is a real PrismPM-generated HOLO v4 archive. After Pages succeeds, `Register app in Prism ecosystem` obtains a repository-bound GitHub OIDC token with audience `prism-registry`, checks the served Holo matches the checkout, and posts its actual fingerprint to `https://registry.uor.foundation/prism/register`. No API-key secret is needed. The same registration protocol is used by Me's `bootstrap/register.mjs`.

A successful registration is not yet a listing: the registry indexer fetches and validates the app and its examples. The retained registration report distinguishes `registered-awaiting-index` and `listed`. The canonical bar verifies the SHA-256 of the registry's index snapshot before displaying entries. The registration workflow also runs every six hours and can be dispatched manually. Failure is reported rather than silently ignored.

The canonical frame is an unchanged published module from `UOR-Foundation/template`, with exact source revision, URL and SHA-256 in `model/prism-frame.json`. The client checks that hash before importing it. Its own optional panels are also content-addressed by the upstream frame. The associated upstream licenses ship alongside it.

## What the Holo contains

The `cs1.618` Holo is the identity-admission component: `origin fresh signature consent`, each `pass` or `fail`. It returns `allow` only when all four observations pass; malformed requests are refused. All 16 combinations and the generated acceptance examples are checked through `prism-code@0.7.2`, the actual Holo loader. The browser pins the compiled archive hash and uses the guest before exporting a public identity handoff. No handwritten fallback decides admission.

The portable component does **not** contain the whole WebGL shooter. Rendering, cryptography, IndexedDB and multiplayer are host responsibilities. `public/hologram/manifest.json` identifies the game entry point, compiled artifacts, hashes and host requirements; `base` resolves relative to that manifest. Downloading the Holo into a compatible loader runs the policy; opening the registry entry's live URL runs the game. The existing round and evolution Holos remain separately available.

Reproduce the source with `node scripts/generate-identity.mjs`, then run `PRISM_PROJECT=identity npm run prism:verify`. Regeneration changes the source lock and artifact identities; only copy an exact successful build, update `model/hologram-policy.json`, deliberately record artifacts, and regenerate `node scripts/hologram-manifest.mjs`. See [proof repair](proof-audit.md) for the explicit upstream verifier repair and unchanged artifact rejection checks.

## Identity and explicit linking

The [identity page](https://r4-laboratories.github.io/uor-cs1.618/identity.html) imports byte-pinned, unchanged cryptographic code from Stitch, Me and the canonical template. `model/hologram-vendor.json` records every file and license source, and verification rejects changed or extra vendored files.

- **Stitch identity:** the kappa of a signed genesis record. Nonextractable signing keys and the session live in this origin's IndexedDB. A new identity is created only on a click. Its id persists across reloads. Storage loss remains storage loss; this is not a backup service.
- **Device linking:** the actual Stitch link-offer/request/response protocol, with a five-minute offer, single-use acceptance and six-digit user confirmation. The page supports manual transfer over a channel the person trusts. Nothing is automatically published to Stitch's relay. A browser with another identity refuses to overwrite it silently.
- **Shared Prism identity:** the current canonical frame uses Stitch’s `prism/session/1` signed delegation. Use its person icon to create or link the identity used by Me, then choose **Bind shared Prism identity**. The adapter checks the real current-frame delegation and signs an explicit mapping with both its delegated key and the game’s local device key. The two ids remain distinct until explicitly linked. Legacy Me `prism/identity/1` passkey delegations are separately supported, not assumed to be the current frame format.
- **Sharing:** downloads happen only after an explicit button click and Holo admission. Public proofs contain a stable id, public records and signatures, never private keys or Me's private content. They are fresh handoff proofs (60-second verification window), not permanent authorization tokens.

Identity does not give a player host privileges, money, damage authority or administrative access. Existing multiplayer transport remains WebRTC/PeerJS with optional dedicated WebSocket hosting; importing Stitch identity does not replace the game transport or promise distributed durable storage.

Offline checks can reject only revocations supplied in the checked log or trusted account-key set. They do not magically learn withheld revocations, prove hardware key protection, or prove a human's real-world identity. The legacy passkey account protocol lacks an issuance timestamp; the adapter bounds remaining lifetime and requires expiration within seven days of the signed binding. Tests use real current-frame Stitch signatures and synthetic legacy WebAuthn fixtures. Browser tests use an isolated test identity, never a private user account.

## Checks

`npm run verify` checks vendor custody, host-manifest integrity, all runtime tests, type checking/build and compiled artifacts. `npm run test:identity-browser` checks the actual frame, Holo loading, IndexedDB persistence, wrong-code refusal, linking two isolated browser contexts explicit public-proof download, and binding a real current-frame account. Every future autonomous promotion also runs this browser gate.
