# Task2c-B2A checked bounded shared source

The shared Float/Wide source uses checked Int16 exponent arithmetic and finite,
named composition. The public roots remain `BoundedNumeric.Float.mul32`,
`mul64`, `div32`, and `div64`, each with its original
`UIntW -> UIntW -> Option UIntW` signature. Bounds is unchanged.

This source revision passed local LexLean preservation/export checks and actual
raw and canonical native/import-free Wasm replay. These are component diagnostic
results, not governed Prism admission or acceptance of the full pinned d6 SDK.

## Arithmetic and helper domains

The analytical ranges in [bounded-exponent-recon.md](bounded-exponent-recon.md)
remain -3117..4092 for executed signed arithmetic and 0..1078 for root rounding
amounts. Every new arithmetic operation and conversion remains checked. Original
UInt64-to-UInt8/UInt16 exponent-field narrowing is retained before conversion to
Int16. Conditional carry addition remains checked even where reachability
analysis says it cannot execute. No bound argument removes a refusal path.

`Wide.negative` checks Int16-to-UInt16 conversion: failure means negative.
`signedLess` checks subtraction and tests the difference's sign; if subtraction
overflows, only opposite signs are possible, so the left sign determines order.
Both helpers cover all Int16 values. `unsignedLess` covers all UInt64 values by
checked subtraction: `None` means less-than and `Some` means not less-than.
These intentionally interpreted subtraction/conversion failures implement
comparison; arithmetic failures elsewhere continue to propagate.

`lengthStep` explicitly narrows its former mathematical counter to Int16.
Nonzero words require checked counter + 1; a zero word retains the counter,
including Int16 maximum. `None` remains `None`. Its internal state API is now
`Option LengthState`, where the named record contains `word : UInt32` and
`count : Int16`, instead of the old tuple. All producers/consumers use those
fields. Initialized `length32` starts at zero and takes 32 steps; `length`
accepts every four-UInt32-limb value and returns 0..128. The UInt64 × UInt64
multiplication algorithm retains all 128 product bits and its checked failures.

`round` explicitly narrows its formerly arbitrary Int amount to Int16. Negative
amounts retain checked negation, conversion, low64 refusal and checked shift
behavior; minimum Int16 negation refuses. Counts beyond the UInt64 shift domain
still refuse even for zero. Positive amounts greater than 128 return zero;
exactly 128 retains guard/sticky and ties-to-even handling. Final increment
overflow still refuses. Root behavior remains one RNE rounding step, gradual
underflow, XOR signed zero, and first-operand NaN quieting/sign/payload policy.

The quotient recurrence retains 25/54 steps and every checked doubling, addition
and subtraction. Its mathematical quotient interpretation requires normalized
callers (`b > 0`, `b <= a < 2*b`, and bounds ensuring doubling succeeds); these
are not general UInt64 division APIs. Internal UInt64-taking f32 helpers still
require clean f32 raw inputs, independently enforced by the public UInt32 roots
and existing ABI guards.

## Supported source representation

Named powers-of-two helpers compose length, round and quotient steps without
runtime Nat counts, mathematical Int values or higher-order closures. Named
`pack32/pack64(sg, rounded, exponent)` helpers share the original checked packing
expression and keep canonical IR within the existing parser depth limit.

Ten monomorphic conversion helpers have explicit source parameters and Option
destination results: UInt64 to UInt8/UInt16/UInt32; UInt32 to UInt64; UInt8/UInt16
to Int16; Int16 to UInt8/UInt16/UInt32/UInt64. Each contains the original checked
conversion primitive. `int16Add`, `int16Subtract` and `int16Negate` have typed
operands and Option Int16 results. Their signatures constrain the actual emitted
Rust at conversion and method-receiver sites.

These are source workarounds for concrete canonical boundaries. Generic unsigned
ordering first failed extraction; deep division composition exceeded the parser's
unchanged recursion limit; packed source then exposed ungrounded conversion and
numeric receiver types (NEXP-010) and `.fst`/`.snd` on Rust tuples (NEXP-011).
The final named helpers and record compile and pass the observed controls. They
do not repair those general compiler defects, establish arbitrary conversion
correctness, or demonstrate a silently wrong result in the earlier failures.
No parser limit, Rust/IR pin, emitted target file or compiler guard was changed.

## Validation and evidence

Final source ID:
`453dc1bd8c46c374bbd40745d3204be62cc972ba4ae0971f66b997fbf625153d`.

- Generator plus LexLean formatter reproduces checked-in Float/Wide exactly.
  Main lock regeneration/check passes with unchanged SHA-256
  `7b2806004d5f35e529a5e191144baad6dd08fcd13998e1425930c2ccb9dabfaa`.
- Local raw production verification/export and bundle verification pass for four
  roots and 16 helper roots. Raw root attestation:
  `23ee81a60fb7ac5b576f26387a27c6b484cc7b58bc53795b03c176618a3e2da4`.
- All 44,648 independent oracle cases pass in raw native and import-free Wasm.
  Native replay is byte-identical to frozen Task2 output. The corpus SHA remains
  `9edf45b030d1a317adc378abb579386503ca39ea71c37e2d3f475ba6a91b7f92`.
- Raw helper controls pass in native and import-free Wasm: all Int16 left values
  versus signed corners/equality/neighbors; every Int16 round amount against
  boundary limbs; all ten conversion pairs, including exhaustive small source
  domains; counter overflow/None; all 128 length positions; ties/sticky/increment
  overflow; 81 UInt64 product corner pairs and 4,096 full-width random products.
- Actual generated minimum-negation refusal, routed through the isolated original
  ABI dispatch/update code, gives status 2 and retains the prior result. An
  altered result fails the exact comparator; altered bundle bytes fail LLV7102.
- The separately retained [canonical component replay](canonical-typed-453dc1bd.json)
  passes all four actual extraction/codegen/native compilations and the same
  44,648 native/import-free Wasm cases. Parent-run canonical helper controls also
  pass with ABI-only record/name adapters and the unchanged independent oracle.
- All five historical orchestration tests pass using an exact eight-file fixture
  from immutable `022c11363fd3a1b1c6871991f32ab02994515a7e`. The fixture archive
  and manifest are under `scripts/numeric/tests/fixtures/task2-project`; no Git
  history is required at test runtime. Frozen receipts and the original
  source-drift negative control remain unchanged. These tests are historical
  orchestration checks, not new compiler evidence.

[The bounded-source receipt](bounded-source-453dc1bd.json) binds compact final raw
evidence, source/tool/target hashes, invocation records and test results. The
full working manifest bound 1,855 files and was rehashed with zero mismatches.
It excludes the caller's then-live `runner.log`; the compact retention includes
that completed log separately. Previous exploratory snapshots remain separate.

The actual tools were locally built LexLean 0.4.0, Lean 4.32.1, Rust 1.97.1 and
Node 24.22.1. Raw Wasm SHA-256:
`47fe7ee9baea42f7ae4f0b4fea0e78db29797eb0d974082fe903f7fc743cc3b6`.
Canonical Wasm SHA-256:
`96d3b129d040344f0c9fc2dc6255c4eba294e1766bad001683c503b6a1a3f6f7`.

## Reproduction and claim boundaries

Generate with `python3 scripts/numeric/generate-source.py`, then run LexLean fmt;
`--output-dir` supports isolated regeneration. With the desired Lean environment
on PATH, the dedicated diagnostic command is:

```sh
python3 scripts/numeric/tests/check_bounded_source.py \
  --lexlean /absolute/path/to/lexlean \
  --rustc /absolute/path/to/rustc --node node
python3 scripts/numeric/tests/test_build.py
```

The optional `--reuse-builds` requires successful recorded production results at
the named typed-project artifact paths and checks source/semantic/lock identities.
Do not substitute build-only results. The original build.sh/test.sh own frozen
Task2 evidence paths and are not this stage's diagnostic entry points.

The actual new raw Rust roots return `Option<u32/u64>`: removing runtime Nat
iteration removes the old renderer's outer Result effect. Only diagnostic ABI
copies lift Option into Ok for the unchanged classifier. Existing application
and renderer files are untouched; integration must respect actual signatures.

Bounds' conditional Nat linear theorems and `[Quot.sound, propext]` axiom scope
are unchanged. They do not prove exponent reachability, initialized loops,
universal failure absence or universal IEEE correctness. Kernel checking,
source preservation, empirical conformance, canonical admission, pinned-SDK
identity and performance remain separate claims. No performance claim is made;
full governed Prism packaging and exact-SDK acceptance remain separate gates.
