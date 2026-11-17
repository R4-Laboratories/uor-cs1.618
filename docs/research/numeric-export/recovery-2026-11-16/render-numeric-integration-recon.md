# Task3 rendering numeric integration reconnaissance

Read-only preparation at game HEAD `6c598f6a34a16dab2ef24914d2cd2e0843fe14e6`.
Only this requested report was written; no builds, source changes or tests run.
Task3 remains future work until the current canonical source/package gate and
required reviews pass. Raw preservation, component replay and native-library
acceptance do not confer application/Holo/browser admission.

## Smallest integration

Read Task3 and Rendering use in the bounded-numeric plan/spec, current renderer,
host adapters, artifact scripts and canonical package preparation.

| Location | Existing behavior | Smallest future change |
|---|---|---|
| `src/hd-budget.ts:sample` | Accumulates accepted positive finite dt below .25; after 3 accumulated seconds computes seconds/frames*1e6, resets, calls governor | Inject a synchronous mean provider; replace only this calculation, retaining reset, inclusive deadband and engine call |
| `src/world.ts:setEngine` | Constructs HdBudget; requests mode-specific HD rank | Give HdBudget the same persistent numeric service; rebuilding the engine must not refetch/recompile numeric Wasm |
| `src/world.ts:render` | Samples only when HD ready and quality auto | Keep this condition and existing quality/geometry logic; no async loading or compilation here |
| `src/main.ts` startup | Loads required Verdant/round guests and sets engine | Start optional numeric initialization outside frame/render; do not block required guests or lobby on its failure |
| `src/main.ts` final `window.cs1618` getter | Read-only operator/test diagnostics | Add a copied numeric status/fallback snapshot, not a mutable guest or compiler UI |

Create `src/numeric-kernel.ts` with one persistent compiled import-free instance,
`meanMicros(totalSeconds,frames)` returning tagged success/diagnostic, and
`status()` reporting loading/ready/failed plus last failure and bounded counters.
Inject this interface for deterministic host tests; actual-artifact tests must
also execute the final published guest. Retain failures after subsequent success
as last-failure history, separately from current path; do not call a loading
service successfully verified or silently clear its fallback record.

At each completed sampling window: validate finite nonnegative seconds and
integer frames 1..1,000,000; convert their binary64 values with DataView bit
reinterpretation, call div64, check status before reading bits, then mul64 by
`0x412e848000000000n` (1e6), again check before read. Check decoded result finite
and in 0..250,000. Keep the existing evaluation order (divide then multiply).
Use BigInt throughout i64 bits, normalize returned signed i64 with
`BigInt.asUintN(64, result)`; never Number(rawBits). Use explicit consistent
DataView endianness. Frame values are exactly representable in the stated range.
The current canonical adapter has op1=mul64/op3=div64, `numeric_run` and
`numeric_result`; confirm final artifact exports and pin ABI, do not assume an
unreviewed wrapper is the admitted output.

Statuses remain 0 success, 1 unsupported op, 2 generated arithmetic failure,
3 domain failure. Treat unexpected status, missing/wrong export, trap, malformed
result and integrity/import failure as explicit diagnostics. Never use LAST
from a failed operation: current Rust wrapper deliberately retains it. A failed
second operation must not expose the first operation's result as the mean.
Host domain refusal is a host diagnostic/status3, not evidence the raw guest
validated renderer inputs. No generated arithmetic edits or JS replacement of
its internals are needed.

## Fallback and behavior to preserve

On loading/unavailable/refused/malformed numeric service, compute the original
`seconds / frames * 1e6` from the same captured window, validate its finite
renderer range, and record host fallback with reason. Reset exactly once per
window. If even the original host result is invalid, retain rank with diagnostic;
do not invent zero or feed invalid data to the governor. At most one concise
console warning per service lifetime, no per-frame logging. Distinguish loading
from terminal failure; late readiness uses the next completed window without
resetting a partially collected window.

Preserve `model/verdant-3d.json`: auto initial rank2, native pin4, performance
pin0, ranks0..4, three-second window; deadband includes both 8000 and 20000us.
`setQuality` resets sampling and applies the pin. Numeric readiness/failure may
not unpin quality. `shared/engine.ts:recommendLod` still calls actual `cs_lod`;
its broader 1,000,000us validation is not the new adapter's 250,000us domain.
Keep separate `adaptQuality` pixel-scale logic untouched. Main currently caps
render dt at .15, and hidden documents skip rendering; this is observed cadence,
not physical GPU time. Preserve existing pause/invalid-dt behavior rather than
silently redefining hidden-tab sampling. Required round/evolution/identity and
identity/Holo policy behavior stay mandatory; numeric fallback is not authority
to add fallback to those guests.

## Text/1 availability: concrete missing prerequisite

`shared/round-kernel.ts` implements Text/1 via memory, `holo_alloc`, and packed
i64 `holo_run` pointer/length, strict response bounds and parsing. It compiles a
module once, creates a fresh instance per distinct request because allocation is
monotonic, and memoizes a bounded 288-request round domain. This is an existing
transport pattern, **not a numeric same-root guest or generic numeric host API**.
Do not copy its finite memoization onto the enormous numeric domain or reuse its
instance indefinitely without a reviewed allocation/reset contract.

`prism/numeric/packages/README.md` explicitly scopes current projects to native
libraries and leaves Text/1 later. `public/wasm/` contains only Verdant, round,
evolution and identity; no numeric application/Holo or same-root Text/1 adapter
was found in the inspected source. Thus the plan's same-root Text/1 comparison
is currently blocked. After the canonical gate, it needs a separately verified
application that transports exact UInt64 bit strings plus explicit status,
invokes the same admitted mul64/div64 source roots, and returns exact bits.
Specify and test bounded request/response codecs (no decimal-float roundtrip),
allocation/lifetime behavior and source/child receipts. Preserve codec refusals.
A handwritten Text/1 ABI shim around generated native libraries can at most
measure that labeled shim; it cannot impersonate a Prism-generated application.
Round timing or JSON around JS arithmetic cannot satisfy the same-root test.

## Guest and publication custody

Use final gate-selected source/semantic/build/attestation IDs and complete child
receipts, retained verified generated libraries, wrapper source/hash, exact
compiler/Rust/target flags, final native/Wasm hashes and actual corpus/negative
controls. Reviewed source453dc1bd is the current kernel baseline; use the actual
final gate identity rather than promoting an older diagnostic Wasm by filename.
Preserve SDK d6 (`prism/prismpm.lock`) and existing dependency/policy pins; no
silent tool upgrade or changed mandatory guest to accommodate numeric loading.

Existing integration surfaces need deliberate extension:

- `scripts/record-artifacts.mjs` explicitly enumerates published artifacts and
  walks only three existing app source trees. Add numeric source/config/lock,
  provenance and actual final guest; preserve existing records.
- `scripts/verify-artifacts.mjs` hashes manifest members but has a fixed list of
  four import-free Wasm checks. Add numeric import/export/ABI and provenance
  bindings and changed-source/guest/wrapper/receipt controls. Merely recording
  a new hash does not verify source-to-guest custody.
- `scripts/proof-result.mjs:bindVerifiedKernel` and `scripts/verify-prism.sh`
  recognize only round/evolution/identity application projects. They bind
  published Wasm/Holo to a fully verified application build. Native-library
  numeric receipts are not this schema; do not fabricate a numeric Holo entry.
  Use a distinct native-derived adapter receipt now if admitted by Task3 scope;
  actual Text/1/Holo delivery requires its own verified application mapping.
- `scripts/hologram-manifest.mjs` emits explicit dependencies and proof scopes.
  List the actual numeric dependency with truthful native-derived/app scope;
  include a Holo only if one was actually built/verified. Retain identity scope.
- `scripts/package.mjs` verifies artifacts then archives source and dist. Ensure
  Vite's copied public guest/provenance match recorded bytes and the browser
  fetches the BASE_URL path. `engineAssetUrl` offers a digest cache-key pattern,
  but query hashes alone are not integrity: check downloaded numeric byte count
  and WebCrypto SHA-256 against the bundled trusted manifest before compile.

## Tests and measured acceptance

Add numeric adapter tests for actual raw bits including sign-bit i64, signed
zero and large payloads at the generic bit boundary; mean-domain boundaries,
NaN/infinity/negative/fractional/count0/count1000001; delayed init, network/hash/
imports/exports failure, trap, each nonzero status, malformed success and stale
result retention. Require div failure to skip mul; mul failure must refuse the
mean. Test loading-to-ready, bounded warning and diagnostics without fail-open
integrity. Host fallback is separately observed, not counted as kernel success.

Extend `tests/hd-budget.test.ts` for exact completed-window inputs, one call per
window/reset, invalid dt, inactive reset and readiness transitions; preserve its
60Hz jitter, 30Hz overload and 144Hz recovery controls. Test ranks0..4 and means
immediately below/at/above both thresholds with actual `cs_lod`; generate raw-bit
neighbors and verify resulting mean bits rather than assuming decimal input
construction lands exactly on a threshold. Preserve pin changes during pending
HD loads (`tests/hd-layer.test.ts`) and `tests/verdant-3d.test.ts` governor bounds.
Browser tests should observe `cs1618.numeric`, actual ready samples and injected
network/corrupt/missing guest fallback, auto/native/low choices, and no repeated
fetch/compile in render. Existing `scripts/experience-browser-test.ts` covers
pins, HD triangles, resize recovery and persistence under SwiftShader; extend
that path. Existing browser/objective/identity/frame-assets checks protect
adjacent behavior; objective browser deliberately pauses 3D and is not a
render-performance benchmark. Run `npm run verify`, appropriate browser gates,
artifact/package checks and independent review only after authorized changes.

Create `scripts/numeric/benchmark.mjs` only when actual eligible artifacts exist.
Compare (A) persistent numeric Wasm div64+mul64, (B) genuine same-root Text/1
using its real allocation/instance boundary, (C) original host expression.
Report B unavailable until built, not a surrogate result. Identical serialized
window inputs, hashes, result bits/status/rank validation and observable output
checksums must precede timing; include actual recorded cadence plus labeled
synthetic threshold/boundary cases. Use same sequence/counts in all paths; disable
memo-hit substitution or report it as a separate workload. Validate full actual
native/Wasm 44,648 IEEE replay separately from renderer-domain measurements.

Separate fetch/hash/compile/instantiate cold cost, warm arithmetic+bit bridge,
Text/1 encode/allocate/run/decode+instance lifetime, and full HdBudget/governor
sample cost (ordinary frames versus completion frames). Measure browser as well
as Node; retain device/CPU/browser/runtime, graphics backend, artifacts/flags,
warmup/iterations, alternating or seeded randomized paired trial order and every
raw sample. Pilot once then freeze common counts (e.g. 5 warmups/30 measured
blocks), use sufficiently large batches, verify outputs outside timing, show
median/tail/dispersion and harness overhead. Record memory growth for Text/1 and
persistent instances. Browser completion-frame timing must include validation,
fallback/status bookkeeping and actual governor call; avoid inserting fetch in
that measurement. Establish the sampling budget from measured tails on stated
devices, rerun a fixed acceptance workload, and retain regressions. No numeric
latency, low-frequency sampling success, or SwiftShader test implies FPS/GPU/
Three.js superiority. No performance conclusion is available from this recon.

Readiness: integration seams are identified. Blocking prerequisites are current
canonical admission/review, custody-qualified final guest/adapter, genuine
same-root Text/1 application for the required comparison, and measured browser
sampling budget. This report does not waive any of them.

## Follow-up: smallest genuine Text/1 candidate and scope clarification

Read-only source inspection, no build or implementation. Upstream paths below
are relative to `/workspace/scratch/prismpm-numeric`, observed HEAD
`f6776fca7c9f675b3bb762ddaf88d256aad3d77f`; their availability is source evidence,
not a new SDK acceptance claim. Rebind the exact accepted revision before work.

**Supported declarations, not inferred APIs.** `SPEC.md` §3 and
`stdlib/src/Foundation/View/Text/V1/Model.lex.tex` define the byte-request Text/1
profile used by the game round/evolution apps. The distinct
`stdlib/src/Foundation/Application.lex.tex` declares the older application/layer
model; it is not a ready UInt64 Text/1 codec. Text/1 has no calculator-operation,
numeric-grammar or error-enum fields. Its entry is source-owned `Bytes -> Bytes`
with a modeled `TextApplication` record and literal byte acceptance vectors.
The small actual fixture is
`tests/fixtures/holo/ho-11-text-application/project/src/TextRequest.lex.tex`.
Use this minimal layout plus the game's metadata/dispatch conventions; do not
copy all round/evolution decision-table architecture or claim their proofs for
numeric transport. Do not introduce Text/2, Text/3 or browser effects merely to
construct this benchmark application.

Available source functions are:

- `Foundation.Bytes.byteLength(Bytes)->Nat`, `byteAt(Bytes,Nat)->Option UInt8`,
  `sliceBytes(Bytes,Nat,Nat)->Option Bytes`, `appendBytes(Bytes,Bytes)->Bytes`,
  and `compareBytes(Bytes,Bytes)->Ordering`. Game-local Foundation.Bytes is the
  same small surface. `ByteOrder`/`BoundedBuffer` records alone do not implement
  endian UInt64 reads/writes; none were found here.
- `Foundation.Utf8.encode(String)->Bytes` and `decode(Bytes)->Option String`.
- `Foundation.Codec.formatInt64(Int64)->String` and
  `parseInt64(String)->Option Int64`; these are the actual wrappers present,
  not UInt64 parsers. Do not pass high-bit raw UInt64 through checked Int64
  conversion, or assume a `parseUInt64`, hex codec or bitcast API exists.
- Game round/evolution `parseDigits` is recursive Nat decimal parsing capped at
  18 digits. It neither accepts all 20-digit UInt64 values nor supplies a safe
  ready-made replacement for this task's bounded fixed-width closure.

**Proposed smallest genuine app (new source still requiring validation).** Keep
Float/Wide/Bounds bytes and `BoundedNumeric` root names unchanged in an isolated
application project; add one `NumericText` module importing Float and the small
Foundation Bytes/Text V1 model. New codec helpers and dispatch are source-owned
LexLean, not handwritten target arithmetic. The module may reuse typed Wide
helpers; introduce no unqualified conversion or tuple projection.

Use exactly `m hhhhhhhhhhhhhhhh hhhhhhhhhhhhhhhh` or `d ... ...`: 35 ASCII bytes,
lowercase hexadecimal only, 16 digits per UInt64, separators at offsets1/18,
operands at2..17/19..34. `m` invokes original mul64; `d` original div64. Two
requests implement the same div-then-mul mean as the persistent ABI; do not
hide both operations in one request for the comparison. Leading hex zeros are
required padding, not decimal noncanonicality. A successful response is
`0 hhhhhhhhhhhhhhhh` (18 bytes); error responses are exactly `1` unsupported
opcode, `2` arithmetic None, `3` malformed transport. The latter is transport
domain refusal, not a claim to validate the renderer's mean domain. No error
returns plausible zero bits. Error precedence must be specified and tested
(e.g. length/separators/hex validation before opcode selection).

Implement nibble decoding with a fixed UInt8 ASCII-to-Option UInt64 lookup
(16 literals), not generic UInt8 subtraction/conversion. Decode 16 fixed offsets
through named shallow helpers carrying Option UInt64, checked shift-left4 and
OR with a nibble. Before a general step, require its high4 bits zero because
checked shift only bounds the count; initialized 16-step decoding satisfies
this. Constant Nat indices are the byte API's existing signature, not a Nat
arithmetic recurrence. Encode each of 16 nibbles with checked right shifts by
constant UInt32 counts60,56,...,0, mask15, and fixed UInt64-to-single-byte literal
lookup; assemble with appendBytes in named small groups. Every input read,
checked shift and impossible nibble case must refuse explicitly. This avoids
UInt64 decimal support, dynamic byte constructors, Nat.iterate, recursion,
closures and Prod; compatibility of the combined new closure remains untested.
Split helpers enough to keep the existing parser depth, never raise its limit.

The literal application record follows TextRequest/CsRound: profile
`prismpm/text-application/1`, entryRoot `BoundedNumeric.NumericText.dispatch`,
sorted libraryRoots containing dispatch (its closure reaches unchanged numeric
roots), real Cargo metadata, positive byte limits, empty capabilities, fat
archive, core contract `hologram:guest/core-wasm@1`, primary0/view1 and the seven
nonempty View labels. A concrete candidate is requestMaximum35,
responseMaximum18, guestAllocationMaximum36, so an exact36-byte malformed vector
exercises refusal above the UI request bound. These are proposed model values,
not existing measured allocation bounds. Source dispatch rejects every length
other than35 before indexing. Include valid m/d, sign-bit/max/NaN patterns,
short/long/nonhex/wrong-separator/unsupported-op, and exact36-byte vectors with
unique requests and bounded UTF-8 responses. External replay covers the full
same-root corpus; application examples alone do not prove IEEE correctness.

Closed checks are in `crates/prismpm/src/holo/{application,validate}.rs` and
`SPEC.md` §3: exactly one closed application value, qualified valid/sorted unique
library roots including entry, positive request/response limits, input allocation
cap >= request limit, nonempty distinct acceptance requests all within input
allocation cap including one exactly at the cap, UTF-8 responses within bound,
empty capabilities, layers0/1 and fat archive. Text/1 disallows memory/stack/CLI
fields from later profiles. `holo/model_document.rs` fixes its default Core-Wasm
maximum to32 pages (2MiB); do not silently change profiles if numeric closure
exceeds it. `guestAllocationMaximum` is an **input allocation cap**, not proof
that codec intermediate buffers, source arithmetic, stack or cumulative monotonic
allocator usage fit it. Measure actual generated memory behavior; fresh instances
per uncached request follow RoundKernel's current pattern. Do not promise a
reset/deallocation primitive that was not found.

First future checkpoint is unchanged-gate source build/extract/codegen of this
minimal app, actual Core-Wasm/Holo generation and verification, then all corpus,
codec/resource/refusal and artifact bindings. Retain any refusal. No source build
has established that the combination currently passes; native-library admission
is a prerequisite, not a replacement for this app's application checks.

**Wording/scope correction to the earlier readiness paragraph.** The spec says
“existing Text/1-style boundary”; Task3 says “same-root persistent-vs-Text/1
boundary.” Neither sentence explicitly mandates adding a fully governed numeric
Holo application solely for the benchmark. Thus a genuine generated app is the
stronger interpretation needed to claim *Prism Text/1 application* results; its
absence does not alone prove that every permitted transport benchmark is blocked.
A benchmark-only handwritten byte/ABI shim around the exact admitted generated
numeric library could measure a clearly labeled *Text/1-style transport* cost,
with the same byte grammar, limits, actual root calls and allocation policy. It
would not be an existing generated app, would not establish exporter support for
its codec, and would not qualify as Holo/application delivery. It must not replace
arithmetic or count host fallback as root execution.

A scope ruling by the parent/task owner is therefore needed **before treating
such a shim as satisfaction of Task3's Text/1 comparison**, or before broadening
work into a new governed application if that was not intended. This is a plan
interpretation, not an automatic safety approval or reason to bypass the native
gate. Recommend genuine minimal app if generated-boundary comparison is desired;
otherwise explicitly record benchmark-only shim scope and retain generated
application qualification as unfulfilled rather than silently changing claims.
