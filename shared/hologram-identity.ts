/** Local adapter over byte-pinned upstream cryptography. Identity conveys no game authority. */
// @ts-expect-error Upstream ships JavaScript without declarations; unchanged custody is intentional.
import * as stitch from '../vendor/stitch/src/prism-id.js';
// @ts-expect-error Upstream ships JavaScript without declarations; unchanged custody is intentional.
import { verifySession as verifyLegacySession, originsOf } from '../vendor/me/frame/panels.mjs';
// @ts-expect-error Unchanged published-frame source delegates to its pinned upstream Stitch bundle.
import { verifySession as verifyFrameSession } from '../vendor/template/frame/panels.mjs';

export const MAX_IDENTITY_BYTES = 128 * 1024;
export const MAX_IDENTITY_RECORDS = 32;
export const MAX_ME_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
export const ME_IDENTITY_ORIGIN = 'https://id.uor.foundation';
const encoder = new TextEncoder();
const defaultSeen = new Set<string>();
export interface IdentityProof { prism: string; records: any[]; envelope: any }
export type Proof = IdentityProof;
export interface MeBinding {
  mapping: { kind: 'cs1618/me-binding/1'; prism: string; account: string; key: string; sessionKey: string; app: string; at: number; expires: number; nonce: string };
  delegation: any;
  signature: string;
  proof: IdentityProof;
}
export type Binding = MeBinding;
export interface MeFrame { sign(bytes: Uint8Array): Promise<{ signature: string; delegation: any }> }
export class HologramIdentityError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'HologramIdentityError'; }
}
function fail(code: string, message: string): never { throw new HologramIdentityError(code, message); }
function bounded(value: unknown): void {
  let text: string | undefined;
  try { text = JSON.stringify(value); } catch { fail('shape', 'Identity input must be bounded JSON'); }
  if (!text || text.length > MAX_IDENTITY_BYTES || encoder.encode(text).length > MAX_IDENTITY_BYTES) fail('size', 'Identity input exceeds 128 KiB');
}
function records(value: unknown): asserts value is any[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_IDENTITY_RECORDS) fail('records', 'Identity needs 1–32 public records');
}
function origin(value: string): void {
  try {
    const url = new URL(value);
    if (url.origin !== value || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new Error();
  } catch { fail('origin', 'Audience must be an exact secure app origin'); }
}
function time(now: number): void { if (!Number.isSafeInteger(now) || now < 0) fail('time', 'Time must be Unix milliseconds'); }
function challengeValue(challenge: string): void { if (typeof challenge !== 'string' || !challenge || challenge.length > 1024) fail('challenge', 'A bounded host challenge is required'); }
function checkSession(session: any): void {
  if (!(session?.log instanceof Map) || session.log.size === 0 || session.log.size > MAX_IDENTITY_RECORDS) fail('records', 'Identity needs 1–32 public records');
  bounded({ prism: session.prism, records: [...session.log.values()] });
}
export async function createIdentity(): Promise<any> { return stitch.createPrism(); }
export async function publicIdentity(session: any): Promise<{ prism: string; records: any[] }> {
  checkSession(session);
  return structuredClone({ prism: session.prism, records: [...session.log.values()] });
}
export async function signIdentity(session: any, audience: string, challenge: string, payload: object, now = Date.now()): Promise<IdentityProof> {
  origin(audience); challengeValue(challenge); time(now); checkSession(session);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('payload', 'Identity payload must be an object');
  bounded({ challenge, payload });
  const identity = await publicIdentity(session);
  const envelope = await stitch.signAction(session, 'cs1618/identity', { challenge, payload }, { now, audience });
  const proof = { ...identity, envelope };
  bounded(proof);
  return proof;
}
export async function verifyIdentity(proof: IdentityProof, audience: string, challenge: string, now = Date.now(), seen: Set<string> = defaultSeen): Promise<{ prism: string }> {
  bounded(proof); records(proof?.records); origin(audience); challengeValue(challenge); time(now);
  if (proof?.envelope?.body?.action !== 'cs1618/identity' || proof.envelope.body.payload?.challenge !== challenge || !proof.envelope.body.payload?.payload || typeof proof.envelope.body.payload.payload !== 'object' || Array.isArray(proof.envelope.body.payload.payload)) fail('challenge', 'Identity action or challenge does not match');
  const result = await stitch.verifyAction(proof.prism, await stitch.logFromRecords(proof.records), proof.envelope, { audience, now, seen });
  if (!result.allowed) fail('identity', `Identity refused: ${result.reason}`);
  return { prism: proof.prism };
}

// Wrappers keep the upstream protocol, including user-confirmed codes and one-use offers.
export const createDevice = (options?: object): Promise<any> => stitch.createDevice(options);
export async function createLinkOffer(session: any, options: { now?: number; ttl?: number; role?: string; scope?: string[] } = {}): Promise<any> {
  checkSession(session);
  return stitch.createLinkOffer(session, { ...options, now: options.now ?? Date.now() });
}
export function parseLinkUri(uri: string): any { bounded(uri); return stitch.parseLinkUri(uri); }
export async function requestLink(device: any, offer: any): Promise<any> { bounded(offer); return stitch.requestLink(device, offer); }
export async function linkCode(secret: string, deviceRecord: any): Promise<string> { bounded({ secret, deviceRecord }); return stitch.linkCode(secret, deviceRecord); }
export async function acceptLinkRequest(session: any, pending: any, request: any, options: { now?: number; confirmCode: string }): Promise<any> {
  checkSession(session); bounded({ pending, request });
  if (session.log.size >= MAX_IDENTITY_RECORDS) fail('records', 'Link would exceed the public record limit');
  return stitch.acceptLinkRequest(session, pending, request, { ...options, now: options.now ?? Date.now() });
}
export async function completeLink(device: any, offer: any, response: any): Promise<any> { bounded({ offer, response }); records(response?.records); return stitch.completeLink(device, offer, response); }
export async function revokeDevice(session: any, deviceId: string): Promise<any> {
  checkSession(session);
  if (session.log.size >= MAX_IDENTITY_RECORDS) fail('records', 'Revocation would exceed the public record limit');
  const next = await stitch.revokeDevice(session, deviceId);
  checkSession(next);
  return next;
}

/** Verify both the current frame's Stitch delegation and the older Me WebAuthn format. */
async function checkedDelegation(delegation: any, appOrigin: string, now: number, revokedKeys: ReadonlySet<string> = new Set()): Promise<{ account: string; key: string; sessionKey: string; expires: number }> {
  bounded(delegation); records(delegation?.records); origin(appOrigin); time(now);
  if (delegation.app !== appOrigin) fail('origin', 'Me delegation is for another app origin');
  // Presence of envelope selects the current protocol; malformed current input
  // must never fall through to the legacy verifier.
  const current = Object.hasOwn(delegation, 'envelope');
  const body = current ? delegation.envelope?.body : undefined;
  const expires = current ? body?.payload?.expires : delegation.expires;
  if (!Number.isSafeInteger(expires) || expires <= now || expires > now + MAX_ME_SESSION_MS) fail('expired', 'Me delegation must expire within seven days');
  if (current && (!Number.isSafeInteger(body?.at) || body.at < 0 || body.at > now || expires > body.at + MAX_ME_SESSION_MS)) fail('expired', 'Frame delegation must last at most seven days from issuance');
  // Kept sessions are verified at issuance, then the delegated key must sign
  // the fresh mapping below. No relay requests are made; supplied log records
  // still enforce revocation through upstream verifyAction/resolvePrism.
  const who = current
    ? await verifyFrameSession(delegation, { now, fresh: 0, hear: false })
    : { ...await verifyLegacySession(delegation, originsOf(ME_IDENTITY_ORIGIN), now), sessionKey: delegation.sessionKey };
  if (revokedKeys.has(who.key)) fail('revoked', 'Me signing credential is revoked');
  return who;
}
export async function bindMeAccount(session: any, frame: MeFrame, appOrigin: string, now = Date.now()): Promise<MeBinding> {
  origin(appOrigin); time(now); checkSession(session);
  const nonce = stitch.toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const discovery = await frame.sign(stitch.canonicalBytes({ kind: 'cs1618/me-binding-discovery/1', prism: session.prism, app: appOrigin, nonce }));
  const who = await checkedDelegation(discovery.delegation, appOrigin, now);
  const mapping: MeBinding['mapping'] = { kind: 'cs1618/me-binding/1', prism: session.prism, account: who.account, key: who.key, sessionKey: who.sessionKey, app: appOrigin, at: now, expires: who.expires, nonce };
  const signed = await frame.sign(stitch.canonicalBytes(mapping));
  const payload = { kind: 'cs1618/me-binding-proof/1', mapping, delegationHash: await stitch.kappa(signed.delegation), signature: signed.signature };
  const proof = await signIdentity(session, appOrigin, nonce, payload, now);
  const binding = { mapping, ...signed, proof };
  await verifyMeBinding(binding, appOrigin, now, new Set());
  return binding;
}
/** Offline: revocations count only when supplied by a trusted verifier; no registry is contacted. */
export async function verifyMeBinding(binding: MeBinding, appOrigin: string, now = Date.now(), seen: Set<string> = defaultSeen, revokedKeys: ReadonlySet<string> = new Set()): Promise<{ prism: string; account: string }> {
  bounded(binding); records(binding?.proof?.records); records(binding?.delegation?.records); origin(appOrigin); time(now);
  const { mapping, delegation, signature, proof } = binding;
  if (!mapping || mapping.kind !== 'cs1618/me-binding/1' || mapping.app !== appOrigin || mapping.prism !== proof.prism || !Number.isSafeInteger(mapping.at) || mapping.at > now || now - mapping.at > 60000 || mapping.expires > mapping.at + MAX_ME_SESSION_MS) fail('binding', 'Me mapping is stale or for another identity or origin');
  challengeValue(mapping.nonce);
  const replayKey = `cs1618/me-binding ${appOrigin} ${mapping.account} ${mapping.nonce}`;
  if (seen.has(replayKey)) fail('replay', 'Me mapping has already been used');
  const who = await checkedDelegation(delegation, appOrigin, now, revokedKeys);
  if (mapping.account !== who.account || mapping.key !== who.key || mapping.sessionKey !== who.sessionKey || mapping.expires !== who.expires) fail('binding', 'Me mapping does not match its delegation');
  const expected = { kind: 'cs1618/me-binding-proof/1', mapping, delegationHash: await stitch.kappa(delegation), signature };
  if (stitch.canonicalJson(proof.envelope?.body?.payload?.payload) !== stitch.canonicalJson(expected)) fail('binding', 'Stitch proof does not bind this Me mapping');
  const key = await crypto.subtle.importKey('raw', stitch.fromBase64Url(who.sessionKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  if (!await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, stitch.fromBase64Url(signature), stitch.canonicalBytes(mapping))) fail('signature', 'Delegated Me session key did not sign this mapping');
  await verifyIdentity(proof, appOrigin, mapping.nonce, now, seen);
  // A fresh Stitch envelope cannot make an already-used Me mapping fresh.
  if (seen.has(replayKey)) fail('replay', 'Me mapping has already been used');
  seen.add(replayKey);
  return { prism: proof.prism, account: who.account };
}

export type CareerSeal = { at:number; stitch:IdentityProof } | { at:number; signature:string; delegation:any };
export type CareerKey = {owner:string; frame:MeFrame} | {owner:string; session:any};
type CareerPurpose = 'backup' | 'session';

function careerMessage(owner:string, app:string, purpose:CareerPurpose, challenge:string, at:number) {
  return { kind:'cs1618/career/1', owner, app, purpose, challenge, at };
}

export async function sealCareer(key:CareerKey, app:string, purpose:CareerPurpose, challenge:string, at=Date.now()):Promise<CareerSeal> {
  const message=careerMessage(key.owner,app,purpose,challenge,at);
  if ('frame' in key) return {at,...await key.frame.sign(stitch.canonicalBytes(message))};
  return {at,stitch:await signIdentity(key.session,app,challenge,message,at)};
}

/** A backup is a durable signed document. Verify its delegation at signing time.
 * Access to restore is separately verified with a fresh challenge on the current device. */
export async function verifyCareerSeal(seal:CareerSeal, owner:string, app:string, purpose:CareerPurpose, challenge:string, now=Date.now()) {
  bounded(seal); origin(app);
  if (!seal || !Number.isSafeInteger(seal.at) || seal.at<0 || seal.at>now || (purpose==='session' && now-seal.at>60000)) fail('time','Career signature has invalid time.');
  const message=careerMessage(owner,app,purpose,challenge,seal.at);
  if ('stitch' in seal) {
    if (seal.stitch?.envelope?.body?.at!==seal.at || stitch.canonicalJson(seal.stitch?.envelope?.body?.payload?.payload)!==stitch.canonicalJson(message)) fail('binding','Career signature does not match this record.');
    const who=await verifyIdentity(seal.stitch,app,challenge,seal.at,new Set());
    if(who.prism!==owner) fail('binding','Career signature belongs to another identity.');
  } else {
    const who=await checkedDelegation(seal.delegation,app,seal.at);
    if(who.account!==owner) fail('binding','Career signer belongs to another identity.');
    const key=await crypto.subtle.importKey('raw',stitch.fromBase64Url(who.sessionKey),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,stitch.fromBase64Url(seal.signature),stitch.canonicalBytes(message))) fail('signature','Career signature did not verify.');
  }
}
