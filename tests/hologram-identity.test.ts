import assert from 'node:assert/strict';
import test from 'node:test';
import { createIdentity, publicIdentity, signIdentity, verifyIdentity, createDevice, createLinkOffer, parseLinkUri, requestLink, linkCode, acceptLinkRequest, completeLink, revokeDevice, bindMeAccount, verifyMeBinding, MAX_ME_SESSION_MS, type MeFrame } from '../shared/hologram-identity.ts';
// @ts-expect-error Unmodified upstream JavaScript has no declaration file.
import { canonicalBytes, kappa } from '../vendor/stitch/src/prism-id.js';
// @ts-expect-error Current frame's unchanged pinned Stitch bundle has no declarations.
import * as framePrism from '../vendor/template/identity/prism-id.mjs';
const app = 'https://game.example';
const now = 1_800_000_000_000;
const b64 = (bytes: ArrayBuffer | Uint8Array) => Buffer.from(bytes as Uint8Array).toString('base64url');
const enc = new TextEncoder();
const sha = async (bytes: string | Uint8Array) => new Uint8Array(await crypto.subtle.digest('SHA-256', typeof bytes === 'string' ? enc.encode(bytes) : new Uint8Array(bytes)));

// Synthetic authenticator fixture adapted from afflom/me identity/test.mjs at
// ee7a2d81c6b5d2146f7a4199bcbfe0aa2c8b6c85, MIT © 2026 The UOR Foundation.
// Full permission notice: vendor/me/LICENSE-MIT. Real P-256 WebAuthn signatures;
// this does not attest hardware, user presence, or a real browser ceremony.
function der(raw: Uint8Array): Uint8Array {
  const integer = (bytes: Uint8Array) => {
    const b = [...bytes];
    while (b.length > 1 && b[0] === 0) b.shift();
    if (b[0] & 0x80) b.unshift(0);
    return [2, b.length, ...b];
  };
  const body = [...integer(raw.slice(0, 32)), ...integer(raw.slice(32))];
  return new Uint8Array([0x30, body.length, ...body]);
}
async function meFrame(options: { app?: string; expires?: number; origin?: string; flags?: number; rp?: string } = {}): Promise<{ frame: MeFrame; delegation: any; key: string; privateKey: CryptoKey }> {
  const credentialKeys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const sessionKeys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', credentialKeys.publicKey));
  const key = b64(await sha(spki));
  const credential = b64(crypto.getRandomValues(new Uint8Array(16)));
  const record = { spec: 'prism/identity/key/1', key, account: key, credential, alg: -7, spki: b64(spki), origin: 'https://id.uor.foundation', created: 0, binding: null };
  const delegation: any = { app: options.app ?? app, nonce: b64(crypto.getRandomValues(new Uint8Array(32))), sessionKey: b64(await crypto.subtle.exportKey('raw', sessionKeys.publicKey)), expires: options.expires ?? now + 60_000, records: [record] };
  const message = `prism/identity/session/1\n${delegation.app}\n${delegation.nonce}\n${delegation.sessionKey}\n${delegation.expires}`;
  const clientDataJSON = enc.encode(JSON.stringify({ type: 'webauthn.get', challenge: b64(await sha(message)), origin: options.origin ?? 'https://id.uor.foundation', crossOrigin: true }));
  const authenticatorData = new Uint8Array([...(await sha(options.rp ?? 'id.uor.foundation')), options.flags ?? 5, 0, 0, 0, 0]);
  const raw = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, credentialKeys.privateKey, new Uint8Array([...authenticatorData, ...(await sha(clientDataJSON))])));
  delegation.assertion = { credential, clientDataJSON: b64(clientDataJSON), authenticatorData: b64(authenticatorData), signature: b64(der(raw)) };
  return { key, privateKey: sessionKeys.privateKey, delegation, frame: { async sign(bytes) { return { signature: b64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, sessionKeys.privateKey, new Uint8Array(bytes))), delegation }; } } };
}

test('actual Stitch identity signs a challenge; exported public identity contains no private keys', async () => {
  const session = await createIdentity();
  const identity = await publicIdentity(session);
  assert.match(identity.prism, /^sha256:[0-9a-f]{64}$/);
  assert.deepEqual(Object.keys(identity).sort(), ['prism', 'records']);
  assert.equal(session.device.signingKey.extractable, false);
  const proof = await signIdentity(session, app, 'host-challenge', { kind: 'join', room: 'atrium' }, now);
  assert.equal(proof.envelope.body.action, 'cs1618/identity');
  assert.deepEqual(await verifyIdentity(proof, app, 'host-challenge', now, new Set()), { prism: session.prism });
});

test('Stitch refuses tampering, wrong audience/challenge, stale time, replay and oversized input', async () => {
  const session = await createIdentity();
  const proof = await signIdentity(session, app, 'challenge', { kind: 'join' }, now);
  const altered = structuredClone(proof); altered.envelope.body.payload.payload.kind = 'admin';
  await assert.rejects(verifyIdentity(altered, app, 'challenge', now, new Set()));
  const signature = structuredClone(proof); signature.envelope.signature = 'AA';
  await assert.rejects(verifyIdentity(signature, app, 'challenge', now, new Set()));
  await assert.rejects(verifyIdentity(proof, 'https://evil.example', 'challenge', now, new Set()));
  await assert.rejects(verifyIdentity(proof, app, 'other', now, new Set()));
  await assert.rejects(verifyIdentity(proof, app, 'challenge', now + 60_001, new Set()));
  const seen = new Set<string>();
  await verifyIdentity(proof, app, 'challenge', now, seen);
  await assert.rejects(verifyIdentity(proof, app, 'challenge', now, seen));
  await assert.rejects(verifyIdentity({ ...proof, records: Array(33).fill({}) }, app, 'challenge', now), /1–32/);
  await assert.rejects(verifyIdentity({ ...proof, envelope: { garbage: 'x'.repeat(128 * 1024) } }, app, 'challenge', now), /128 KiB/);
});

test('actual one-use Stitch linking confirms code and revocation denies the removed signer', async () => {
  const first = await createIdentity();
  const device = await createDevice();
  const offer = await createLinkOffer(first, { now });
  const parsed = parseLinkUri(offer.uri);
  const request = await requestLink(device, parsed);
  await assert.rejects(acceptLinkRequest(first, offer.pending, request, { now, confirmCode: 'wrong' }));
  const confirmCode = await linkCode(parsed.secret, device.record);
  const accepted = await acceptLinkRequest(first, offer.pending, request, { now, confirmCode });
  await assert.rejects(acceptLinkRequest(first, offer.pending, request, { now, confirmCode }));
  const joined = await completeLink(device, parsed, accepted.response);
  assert.equal(joined.prism, first.prism);
  assert.ok(joined.keyring.size);
  const proof = await signIdentity(joined, app, 'join', { kind: 'join' }, now);
  await verifyIdentity(proof, app, 'join', now, new Set());
  const revoked = await revokeDevice(accepted.session, device.id);
  proof.records = (await publicIdentity(revoked)).records;
  await assert.rejects(verifyIdentity(proof, app, 'join', now, new Set()));
  const expired = await createLinkOffer(first, { now, ttl: 1 });
  const expiredRequest = await requestLink(device, expired.offer);
  await assert.rejects(acceptLinkRequest(first, expired.pending, expiredRequest, { now: now + 2, confirmCode: await linkCode(expired.offer.secret, device.record) }));
});

test('Me binding requires both real delegated session-key signature and Stitch action, with replay rejection', async () => {
  const session = await createIdentity();
  const fixture = await meFrame();
  const binding = await bindMeAccount(session, fixture.frame, app, now);
  assert.notEqual(binding.mapping.prism, binding.mapping.account);
  const seen = new Set<string>();
  assert.deepEqual(await verifyMeBinding(binding, app, now, seen), { prism: session.prism, account: fixture.key });
  await assert.rejects(verifyMeBinding(binding, app, now, seen));
  const rewrapped = structuredClone(binding);
  rewrapped.proof = await signIdentity(session, app, binding.mapping.nonce, binding.proof.envelope.body.payload.payload, now);
  await assert.rejects(verifyMeBinding(rewrapped, app, now, seen), /already been used/);
  await assert.rejects(verifyMeBinding(binding, app, now, new Set(), new Set([fixture.key])), /revoked/);
  await assert.rejects(verifyMeBinding(binding, 'https://evil.example', now, new Set()));
  await assert.rejects(verifyMeBinding(binding, app, now + 60_001, new Set()));
  const changedMapping = structuredClone(binding); changedMapping.mapping.account = 'attacker';
  await assert.rejects(verifyMeBinding(changedMapping, app, now, new Set()));
  const changedDelegation = structuredClone(binding); changedDelegation.delegation.nonce = 'attacker';
  await assert.rejects(verifyMeBinding(changedDelegation, app, now, new Set()));
  const changedStitch = structuredClone(binding); changedStitch.proof.envelope.signature = 'AA';
  await assert.rejects(verifyMeBinding(changedStitch, app, now, new Set()));
  // Even the real Stitch owner cannot invent the Me session signature.
  const forged = structuredClone(binding); forged.signature = b64(new Uint8Array(64));
  forged.proof = await signIdentity(session, app, forged.mapping.nonce, { kind: 'cs1618/me-binding-proof/1', mapping: forged.mapping, delegationHash: await kappa(forged.delegation), signature: forged.signature }, now);
  await assert.rejects(verifyMeBinding(forged, app, now, new Set()), /session key/);
  // A valid signature from a different session key does not count either.
  const other = await meFrame();
  forged.signature = (await other.frame.sign(canonicalBytes(forged.mapping))).signature;
  forged.proof = await signIdentity(session, app, forged.mapping.nonce, { kind: 'cs1618/me-binding-proof/1', mapping: forged.mapping, delegationHash: await kappa(forged.delegation), signature: forged.signature }, now);
  await assert.rejects(verifyMeBinding(forged, app, now, new Set()), /session key/);
});

test('Me delegation policy rejects expired, over-seven-day, app-mismatch, wrong identity origin/rp and no UV', async () => {
  const session = await createIdentity();
  for (const options of [{ expires: now - 1 }, { expires: now + MAX_ME_SESSION_MS + 1 }, { app: 'https://evil.example' }, { origin: 'https://evil.example' }, { rp: 'evil.example' }, { flags: 1 }]) {
    const fixture = await meFrame(options);
    await assert.rejects(bindMeAccount(session, fixture.frame, app, now));
  }
});

// Current canonical frame contract: the account is a Stitch prism, and the
// delegation is its signed prism/session/1 action, not a passkey assertion.
async function currentFrame(options: { at?: number; expires?: number; app?: string; audience?: string; action?: string; key?: string; revoked?: boolean } = {}) {
  const identity = await framePrism.createPrism();
  const sessionKeys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
  const sessionKey = b64(await crypto.subtle.exportKey('raw', sessionKeys.publicKey));
  const at = options.at ?? now - 120_000;
  const envelope = await framePrism.signAction(identity, options.action ?? 'prism/session/1', { sessionKey: options.key ?? sessionKey, expires: options.expires ?? now + 86_400_000 }, { now: at, audience: options.audience ?? app });
  const held = options.revoked ? await framePrism.revokeDevice(identity, identity.device.id) : identity;
  const delegation = { app: options.app ?? app, envelope, records: [...held.log.values()] };
  const frame: MeFrame = { async sign(bytes) { return { signature: b64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, sessionKeys.privateKey, new Uint8Array(bytes))), delegation }; } };
  return { frame, delegation, identity };
}

test('current published frame Stitch delegation binds a kept session with no network and rejects replay', async () => {
  const fixture = await currentFrame();
  const local = await createIdentity();
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Identity binding must not contact network'); };
  try {
    const binding = await bindMeAccount(local, fixture.frame, app, now);
    assert.equal(binding.mapping.account, fixture.identity.prism);
    assert.equal(binding.mapping.key, fixture.identity.device.id);
    assert.equal(binding.mapping.sessionKey, fixture.delegation.envelope.body.payload.sessionKey);
    const seen = new Set<string>();
    assert.deepEqual(await verifyMeBinding(binding, app, now, seen), { prism: local.prism, account: fixture.identity.prism });
    await assert.rejects(verifyMeBinding(binding, app, now, seen), /already been used/);
    await assert.rejects(verifyMeBinding(binding, app, now, new Set(), new Set([fixture.identity.device.id])), /revoked/);
    const modified = structuredClone(binding);
    modified.delegation.envelope.body.payload.sessionKey = (await currentFrame()).delegation.envelope.body.payload.sessionKey;
    await assert.rejects(verifyMeBinding(modified, app, now, new Set()));
  } finally { globalThis.fetch = fetchBefore; }
});

test('current frame rejects wrong app/audience/action, invalid delegated key, duration, future issuance and revoked device', async () => {
  const local = await createIdentity();
  const otherKey = (await currentFrame()).delegation.envelope.body.payload.sessionKey;
  for (const options of [
    { app: 'https://evil.example' }, { audience: 'https://evil.example' },
    { action: 'some/other/action' }, { key: 'malformed' }, { key: otherKey },
    { expires: now - 1 }, { at: now, expires: now + MAX_ME_SESSION_MS + 1 },
    // Remaining lifetime fits, but original issuance-to-expiry exceeds seven days.
    { at: now - MAX_ME_SESSION_MS, expires: now + 1 },
    { at: now + 1 }, { revoked: true },
  ]) {
    await assert.rejects(bindMeAccount(local, (await currentFrame(options)).frame, app, now), JSON.stringify(options));
  }
  const fixture = await currentFrame();
  fixture.delegation.envelope.signature = 'AA';
  await assert.rejects(bindMeAccount(local, fixture.frame, app, now));
});

test('current frame and pinned game Stitch identities link in both directions', async () => {
  // Current frame offers; the game joins using its older pinned runtime.
  const account = await framePrism.createPrism();
  const gameDevice = await createDevice();
  const offered = await framePrism.createLinkOffer(account, { now });
  const read = parseLinkUri(offered.uri);
  const request = await requestLink(gameDevice, read);
  const accepted = await framePrism.acceptLinkRequest(account, offered.pending, request, { now, confirmCode: await linkCode(read.secret, gameDevice.record) });
  const joinedGame = await completeLink(gameDevice, read, accepted.response);
  const gameProof = await signIdentity(joinedGame, app, 'interop', { kind: 'join' }, now);
  assert.equal((await framePrism.verifyAction(account.prism, await framePrism.logFromRecords(gameProof.records), gameProof.envelope, { audience: app, now })).allowed, true);
  // Game offers; the canonical frame joins and signs through its own runtime.
  const game = await createIdentity();
  const frameDevice = await framePrism.createDevice();
  const reverseOffer = await createLinkOffer(game, { now });
  const reverseRead = framePrism.parseLinkUri(reverseOffer.uri);
  const reverseRequest = await framePrism.requestLink(frameDevice, reverseRead);
  const reverseAccepted = await acceptLinkRequest(game, reverseOffer.pending, reverseRequest, { now, confirmCode: await framePrism.linkCode(reverseRead.secret, frameDevice.record) });
  const joinedFrame = await framePrism.completeLink(frameDevice, reverseRead, reverseAccepted.response);
  const frameEnvelope = await framePrism.signAction(joinedFrame, 'cs1618/identity', { challenge: 'reverse', payload: { kind: 'join' } }, { now, audience: app });
  assert.deepEqual(await verifyIdentity({ prism: game.prism, records: [...joinedFrame.log.values()], envelope: frameEnvelope }, app, 'reverse', now, new Set()), { prism: game.prism });
});
