# B2A bounded source independent review

Reviewed commit `efd0fc813b67455ee79b3bfe17d0e934fd23f729` against
`995fbfd79ac614210b8e2204c01bf8e95af05754`, using the supplied 13-owned-path diff,
binding brief, final implementation report, and final `453dc1bd` evidence.
Earlier checkpoint evidence is not the acceptance basis.

**Spec-compliance verdict: PASS for the bounded source/local diagnostic task.**
**Code-quality verdict: APPROVE within that scope.**

No actionable correctness or code-quality finding was identified in this diff.
No source change is requested by this review. These verdicts are not SDK,
governed canonical-package, application-integration, or full V&V acceptance.

## Source and semantics inspected

- Public Float roots retain raw UInt32/UInt64 inputs and Option-valued results
  (`prism/numeric/src/Float.lex.tex:65`, `:140`, `:214`, `:283`). NaN tests still
  precede infinity/zero handling in operand order; quieting preserves the first
  NaN's sign/payload and invalid operations use positive canonical NaN. The
  multiplication and division formulas, special-case ordering, sign XOR,
  subnormal packing, and single guard/sticky/ties-even rounding are preserved.
- Source-owned conversion helpers explicitly constrain both scalar endpoints
  and Option results (`prism/numeric/src/Wide.lex.tex:6` onward). Checked Int16
  add/subtract/negate have typed operands (`:96` onward). The generator's
  replacements preserve the analytical root interval -3117..4092 and rounding
  amount 0..1078 without deleting checked operations. In particular, conditional
  packing carry still binds checked addition instead of assuming it unreachable.
- `signedLess` (`Wide.lex.tex:242`) uses checked subtraction and checks the sign
  of the result, or the left operand on overflow. This is correct over the
  complete Int16 domain: subtraction overflow requires opposite signs. Its
  sign conversion to UInt16 rejects exactly negative Int16 values. Unsigned
  subtraction underflow remains the deliberate unsigned comparison result.
- `lengthStep` (`Wide.lex.tex:260`) uses the named LengthState record throughout;
  None propagates, a zero word retains any Int16 count, and a nonzero word
  requires checked count+1. The initialized 32-step composition yields 0..32;
  high-limb selection and checked offsets retain the entire 0..128 length
  domain. Root bounds are not substituted for arbitrary helper preconditions.
- `round` (`Wide.lex.tex:429`) retains negative-amount checked negation,
  conversion, low64 restriction and checked-shift refusal, including Int16
  minimum. Amounts above 128 return zero, while exactly 128 still executes the
  rounding steps. Positive finite composition preserves guard/sticky state;
  rounding increment still propagates overflow. The four-UInt32 multiplication
  algorithm is unchanged apart from typed conversions and retains full UInt64
  products. The 25/54-step quotient compositions (`:558`, `:571`) preserve
  recurrence order and checked failures for arbitrary UInt64 helper arguments;
  documentation correctly limits their mathematical quotient interpretation.
- `pack32/pack64` (`Float.lex.tex:7`, `:156`) factor the prior checked expressions
  into named helpers. The generated finite compositions remain source-level
  definitions. No handwritten replacement target arithmetic, SDK/pin changes,
  compiler guard changes, or existing guest changes occur in the owned diff.

## Tests, independence, and evidence checked

The new Rust helper oracle uses independent u128 multiplication, leading-zero
length, quotient/remainder rounding, Rust integer ordering, and fallible scalar
conversions. It calls the actual emitted helper packages; it does not compute
expected values through the source implementation. Coverage includes every
Int16 left comparison operand against corners/equality/neighbors, every Int16
round amount against boundary limbs, exhaustive small conversion domains,
length counter overflow/None, all 128 bit positions, rounding ties/sticky and
increment refusal, 81 full-width product corner pairs and 4,096 random products.
The range loops are inclusive and include Int16 minimum/maximum.

The runner (`scripts/numeric/tests/check_bounded_source.py:80` onward) checks
formatted generator parity, source/semantic/lock identities, requested roots,
and bundle verification before compiling actual package source. Diagnostic ABI
copies only lift the emitted Option boundary into the existing classifier. The
existing status policy remains intact: 0 success, 1 unknown operation, 2 None
or outer arithmetic failure, and 3 f32 high-bit input refusal. The isolated real helper None control tests status 2 plus prior
result retention; the actual source no longer emits the old outer Result effect,
which is explicitly documented as an integration requirement.

This review performed focused evidence checks, not reruns of unchanged reported
production/conformance suites:

- Independently checked compact raw archive size and SHA-256 against its receipt.
  Verified the retained-files index digest and all 708 indexed member digests
  (709 archived members including the index itself).
- Compared archived final Float/Wide, generator, runner and helper-oracle bytes
  with the reviewed checkout. Observed successful full production-build logs for
  roots and helpers, including final root source ID `453dc1bd...`.
- Inspected retained success logs for native/Wasm helper controls, import-free
  Wasm replay, and actual generated None/status-2 retention. Verified the native
  replay's 44,648 lines and SHA-256 against the receipt. Inspected real rejection
  logs for wrong-result mutation and altered bundle bytes (`LLV7102`).
- Ran the generator only into a temporary directory and independently confirmed
  both generated source files match checked-in source modulo whitespace. The
  retained full runner supplies the stronger formatter/byte-parity observation.
- Independently compared all eight historical fixture members byte-for-byte with
  immutable commit `022c11363fd3a1b1c6871991f32ab02994515a7e`. Their source,
  project-config and lock hashes/lengths match the original Task2 build manifest.
  `test_build.py:29` onward checks the closed eight-file member set and hashes
  without requiring runtime Git history. The source-drift refusal control is
  retained. This fixes historical orchestration inputs without weakening source
  binding or claiming new arithmetic/compiler evidence.
- Read the separately scoped canonical receipt for the same source ID and
  44,648 native/import-free Wasm cases. Canonical helper success is parent-owned
  evidence; this review does not relabel raw outputs as canonical products.

## Limits and remaining gates

The conditional Nat Bounds theorems are unchanged. Neither those proofs nor this
review prove the analytical exponent table, all initialized-loop invariants,
universal failure absence, universal IEEE conformance, or arbitrary compiler
correctness. The documentation maintains these distinctions and makes no
performance claim. Source signature constraints and named records address this
application's observed compilation issues; generic NEXP-010/011 remain open.

Exact pinned-SDK execution, governed Prism packaging/acquisition, existing guest
adaptation to actual Option signatures, and complete integration V&V remain
separate parent-owned gates. Compiler internals/B1 workflows and the rest of the
branch were intentionally not re-reviewed. No production or helper suite was
rerun, no tracked source was modified, and no push was performed.
