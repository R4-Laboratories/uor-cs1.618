# Task2c-B2A final bounded source report

Status: implementation and requested local component validation complete; local
commit recorded below. Independent review and full governed Prism/exact-SDK
acceptance remain separate gates. This report is ignored coordination material.

## Owned implementation

Source baseline is 022c11363fd3a1b1c6871991f32ab02994515a7e. Parent subsequently
committed unrelated authority/workflow/canonical-evidence work; those files are
not part of this implementation. Only Float/Wide, their source generator,
helper fixtures/runner, the narrowly authorized historical orchestration test
fixture, numeric documentation and compact raw evidence are owned here.

- Mathematical Int intermediates become checked Int16. Original UInt8/UInt16
  exponent narrowing remains before checked Int16 conversion. Every failure
  propagates, including conditional carry and minimum-negation refusal.
- Signed comparison uses checked subtraction plus checked Int16-to-UInt16 sign
  testing, falling back to left sign only on subtraction overflow. UInt64 order
  uses checked subtraction (None iff smaller). No generic less_than remains.
- Named finite compositions replace runtime Nat iteration and closures, keeping
  quotient counts 25/54 and full UInt64 × UInt64 -> four UInt32 limbs.
- lengthStep's counter is explicitly Int16 and still checks increment overflow.
  Its internal API is now Option LengthState, with word : UInt32 and count :
  Int16. Initialized lengths retain full 0..128 results. None remains None.
- round narrows arbitrary mathematical amounts to Int16; negative low64/shift
  refusal, minimum negation refusal, exactly-128 ties/sticky, greater-than-128
  zero and final increment overflow behavior remain.
- pack32/pack64 contain the original checked packing body as named helpers,
  reducing canonical IR nesting without changing parser limits.
- Ten monomorphic checked-conversion helpers have explicit source and Option
  destination types. int16Add/Subtract/Negate have typed parameters/results.
  These ground actual generated Rust without editing target files or pins.
- Public roots and signatures remain BoundedNumeric.Float.{mul32,mul64,div32,
  div64}, UIntW -> UIntW -> Option UIntW. Bounds remains unchanged.

The named conversions and record address this application's concrete source
shape, not general compiler defects NEXP-010/011. No silently wrong result was
claimed for the preceding native compile failures. No compiler guards, target
Rust/IR, renderer, workflow, existing application guest, or upstream source was
edited. No subagents or pushes. Disk remained above 20 GiB free; no Docker pull.

## Actual final identities

Source ID: 453dc1bd8c46c374bbd40745d3204be62cc972ba4ae0971f66b997fbf625153d
Semantic ID: 02f577acd0c84d1e060f89f57de693f499244f5299cd05cbbffbce310547a8d7
Build ID: 4f8f33ed63ace73a0cfe3e66b4961250e36b861b430da412337eed6f93ce5822
Raw root attestation: 23ee81a60fb7ac5b576f26387a27c6b484cc7b58bc53795b03c176618a3e2da4
Raw root bundle: 86b854c4a4d8f46bebd60c5e716f8b6a6298d4dbdc5c7f9f8e9f1523de5f655b
Helper attestation: 8874e5bffe4921d57dbd2b05db7f2283ada6a387d36a17d93f77471474107e80
Helper bundle: 38aaf4264aa339d9f6e596dad90e92cc568ace7a336c2848fcf46fce76791990

Source SHA-256:
Float 02e86ac15ea4f761b9f8999e5d8f797cc20f9b39f50497155df733923a02f83e
Wide afa302f728315f430645e801d10dc11dba157c8fe4c162fc29d852192fbb9999
Bounds c32cce5627955f91a8ceb4c44d0a32bcdf84f6fe92e27dc08d916159c5dcb2a9
Lock 7b2806004d5f35e529a5e191144baad6dd08fcd13998e1425930c2ccb9dabfaa

The main lock was regenerated and exact-byte checked; its content is unchanged
because lexicon/config/workspace bytes did not change. The lock does not bind
source files themselves; production manifests do.

Actual local tool identities:
- LexLean 0.4.0 executable SHA
  3765ef724d19a4d08681aaa0123ff637e65c1ffcc0b8d02ae268b521b5cf2c94
- Rust 1.97.1 rustc SHA
  d3a664c970a9fd8361b64194861bebc1ae37b9054e5ee3400dc1c9e691797eea
- Lean 4.32.1 actual binary SHA
  e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550
- Node 24.22.1 binary SHA
  61ab14cd750fc24d5db53490ec5fc40f756e4b6e136b78cf7004265471d9bd1d
- Raw rust-std target descriptor digest
  957f6e9a7a87b504094f9c5d0ed9305aad7cbee156bba670acc8bda99db5224c

Exact tool paths, environment, compiler/target metadata, package/source hashes
and signatures are in bounded-source-453dc1bd.json and the retained runner files.
This is component-only evidence, not the installed d6 SDK binary identity.

## Invocations and results

Working directory: /workspace/scratch/cs-numeric-kernels.
Parent invoked the final full runner after the typed checkpoint; the implementer
observed completion and inspected/hash-validated actual outputs rather than
repeating the costly proof run. Exact invocation:

```
env ELAN_HOME=/workspace/diagnostic-tools/elan \
  ELAN_TOOLCHAIN=leanprover/lean4:v4.32.1 \
  CARGO_HOME=/workspace/diagnostic-tools/cargo-home \
  PATH=/workspace/diagnostic-tools/elan/bin:/workspace/diagnostic-tools/rust-1.97.1/bin:$PATH \
  python3 scripts/numeric/tests/check_bounded_source.py \
    --lexlean /workspace/diagnostic-tools/lexlean-target/release/lexlean \
    --rustc /workspace/diagnostic-tools/rust-1.97.1/bin/rustc
```

The runner used fresh production builds, not --reuse-builds. The successful
result JSON stdout was subsequently copied byte-for-byte to
`typed-final-production-result.json` and `typed-helper-production-result.json`
for the documented cache mode; build-only results were never substituted.

- Generator + formatter parity, main/helper source checks and fmt-check: pass.
- Main lock regeneration and lock --check: pass, unchanged bytes.
- Full raw production verification/export: four roots and 16 helpers pass.
- Bundle verification of actual products: pass.
- Raw native and import-free Wasm: all 44,648 independent oracle cases pass;
  per-operation counts 11,161 / 11,161 / 11,163 / 11,163. Native log is byte-for-
  byte equal to decompressed frozen Task2 output (SHA 7adfdec1cbf4fc47112ac70cdb11c7f4f635e36efd4cc8596f19ea4028d3cb95).
- Corpus remains unchanged, SHA
  9edf45b030d1a317adc378abb579386503ca39ea71c37e2d3f475ba6a91b7f92.
- Raw helper native/import-free Wasm passes: exhaustive Int16 left operands
  versus corners/equality/neighbors; every Int16 round amount against boundary
  limbs; all ten conversion pairs (including exhaustive smaller source domains);
  LengthState counter overflow/None; all 128 length bit positions; rounding
  tie/sticky/increment refusals; full UInt64 corner/random products. Independent
  integer oracles are unchanged arithmetic tests, not substitute target kernels.
- Real generated minimum-negation None produces ABI status 2 and preserves the
  prior result in an isolated ABI control. Existing application files untouched.
- Wrong-result mutation is rejected by exact comparator; altered bundle bytes
  are rejected with LLV7102 (length/SHA mismatch).
- Raw Wasm SHA
  47fe7ee9baea42f7ae4f0b4fea0e78db29797eb0d974082fe903f7fc743cc3b6.
- Parent-owned canonical extraction/codegen/native compilation and 44,648-case
  native/import-free Wasm replay also pass on the same source; canonical Wasm
  SHA 96d3b129d040344f0c9fc2dc6255c4eba294e1766bad001683c503b6a1a3f6f7.
  Parent additionally ran actual retained canonical helpers with ABI-only
  adapters and the unchanged independent oracle: native/Wasm controls pass.
  These canonical results remain separately scoped and retained by parent.
- `python3 scripts/numeric/tests/test_build.py`: all five existing tests pass
  after historical fixture repair, including original source-drift refusal.
- Python syntax checks and git diff --check pass.

## Historical fixture repair

Previously two positive orchestration tests paired evolving source with frozen
Task2 receipts and correctly failed at src/Float.lex.tex hash validation. The
other three passed. This was not an arithmetic failure or reason to weaken
source binding.

Authorized repair adds an exact eight-file historical project archive plus
manifest from immutable 022c11363fd3a1b1c6871991f32ab02994515a7e. Source/config
bytes match the old build manifest; workspace bytes match its old lock. The
current collector/oracle run against that historical temporary fake-SDK project.
Runtime tests require no Git history, so shallow CI works. Frozen receipts,
production packages and existing negative controls are unchanged.

Fixture archive: scripts/numeric/tests/fixtures/task2-project/project.tar.gz
SHA: 42b31ea259880af95d6c8090662cd7a2f6cf8a3d4e77ca5532e8b7846ebe33be
Bytes: 5,135. Manifest and README bind all eight original files and scope.
This fixture is historical orchestration data, never new compiler evidence.

## Retention and integrity

Working evidence is only artifacts/numeric-bounded-source. The complete final
working manifest bound 1,855 files and was recomputed with zero mismatches:
064b974a8c075f65df06412a5f8e8e9421c0eb53262e5ecb21905bd6dfb15da6.
The live stdout redirect runner.log is excluded there; compact retention includes
its completed bytes separately.

Compact final raw evidence:
docs/research/numeric-export/recovery-2026-11-16/bounded-source-453dc1bd.tar.gz
SHA: 4df72906b6028eaf9765cc7f1f27a6348eb7fd94c6ff6c42e5060340995c7e62
Bytes: 11,072,244. Files: 709. Adjacent JSON is the review receipt.
The archive includes complete final project production/verification trees,
current runner logs, exact source/fixture inputs, actual native/Wasm artifacts
and a retained-files hash index; prior exploration/caches/rlibs are excluded.

Every retained member hash was checked. Both production bundles extracted from
the archive passed the artifact verifier (4 and 16 outputs). That replay checks
bindings; it does not rerun axiom audit, Lean elaboration, leanchecker or named
extraction. The separate full production run above supplies those observations.

Prior complete checkpoints remain under distinct archives in the working root:
previous-int16-evidence.tar.gz SHA 68451c2e9c4193c3b46fc8c1bac170d5b6c0782bd92473ec4ba872a08b6d64eb
previous-unsigned-evidence.tar.gz SHA 9e2cf795d85b8c32113ab0a57ec288d2eefd59c5569c580f7ae24124e6935fc9
previous-packed-evidence.tar.gz SHA 65467f7b045b56b5f8de019ba818ccb3460c7d0f45441f5fd444d80a6b149fca
No earlier evidence is substituted for final source 453dc1bd.

## Proof scope and remaining gates

Bounds conditional Nat proofs and [Quot.sound, propext] scope are unchanged.
They do not prove analytical exponent reachability, initialized loops, universal
failure absence or universal IEEE correctness. Kernel/source-preservation checks,
empirical conformance, generic compiler correctness, canonical acquisition and
SDK acceptance remain distinct. No performance claim is made.

Removing runtime Nat iteration removes the raw renderer's outer Result effect:
actual emitted roots return Option<u32/u64>, not the old R<Option<_>>. Diagnostic
ABI copies lift Option into Ok at the original classifier; integration must use
actual signatures. No application renderer/guest integration is claimed here.

No blocker remains for this local source/raw-helper/parity task. Independent
review of this commit, governed Prism packaging and exact-SDK/full integration
validation remain parent-owned gates. Generic NEXP-010/011 remain tracked; the
observed source workaround does not close them globally.

## Commit

Implementation commit: efd0fc813b67455ee79b3bfe17d0e934fd23f729.
Parent: 995fbfd79ac614210b8e2204c01bf8e95af05754. Review this single commit
(or its 13 owned paths), not the entire branch history. No push.
Independent review is the next gate.
