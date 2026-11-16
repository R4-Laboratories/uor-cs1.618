# Task2c-A final compiler source-stage review

## Final spec verdict: approved for the source-stage scope

The reviewed compiler source and actual exact-revision pinned-SDK execution
satisfy this source-stage task. The original P1 consumed-graph erasure finding
is addressed: eager dictionary construction is checked separately from kernel
field equivalence, including explicit scalar dependencies and computation hidden
inside aliases. All four precise production refusal probes pass. The independent
unused-overflow operation remains in generated code and returns `AddOverflow`
in native and import-free Wasm replay at optimization levels 0 and 2.

Ordinary and signed helpers, canonical and renamed checked conversions, operand
and result type refusals, altered dictionary semantics, and live dictionary
refusal all pass. Supported-container type discovery preserves nested unsupported
`Fixed` declarations and coverage; real code generation rejects the retained
dictionary with `PolymorphicType`.

The normalization/discovery/lowering design and repair deltas were reviewed in
`source-stage-review.md`, `source-stage-fix-review.md`,
`source-stage-round2-review.md`, and `source-stage-round3-review.md`. This final
verdict adds actual current-candidate full source-stage evidence to those static
reviews; it does not replace their documented semantic boundaries.

## Final quality verdict: approved for the source-stage scope

No actionable review finding remains. Compiler preflight, both focused runs,
and all 31 recorded source-stage gates pass at the exact candidate below. The
affected and broad gates cover named/portable exports, specialized indexing,
scalar length, typed decimal, shared conditions, owned accumulators, generated
provenance, workspace and release-assertion tests, no-allocation, formatting,
clippy, Wasm, browser/view integration, SDK fixtures, and UOR fixtures. No failed
gate is reclassified as successful, and no prior-revision pass is substituted
for current-candidate evidence.

The generated replay files still emit warnings for naming, an unused variable,
and unnecessary parentheses. These warnings are visible in the retained focused
logs; they are not compiler/test failures, and no warning or assertion gate was
weakened to conceal them. Existing test-suite ignored-test behavior should not
be read as a claim that every possible test executed merely because the gates
passed.

## Exact evidence reviewed

- CI run: [43978245009](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43978245009).
- GitHub artifact: `14281967144`. Controller-verified original ZIP SHA-256:
  `08ce8def692d9670506047da60158b321712da238cb25c2992c34979c7b6ce78`.
- Source base: `991956fe427bb646498fd0912c89b71be71e7beb`.
- Source candidate: `2a13f942b04f0828e03c5d7db7e4db6ecb626d6e`.
- Source tree: `747d3c5c4ed0d7984a9ebcadc665b10417e5ea84`.
- Bundle SHA-256: `ad555eb1d133fa3cbe04362606da005c112565ba9255806c4e67d47e390734e4`.
- Patch SHA-256: `0278ee47e9210484a4481b0afe1589a1da29f31fc5e624adb94580c065e31373`.

The extracted evidence root is
`artifacts/numeric-task2c/ci-43978245009` in the game checkout. Read
`candidate.json`, `compiler-preflight.log`, `focused.log`, `gates/status.tsv`,
`gates/focused.log`, gate completion logs, `run.log`, `tool-identities.txt`, and
`finalization.log`. All 31 gate statuses are zero. Compiler preflight, early
focused, source stage, container, log capture, and workflow exit-code files each
contain zero. `generated-changes.patch` is empty.

The actual tool record reports Lean 4.32.1, Rust/Cargo 1.97.1, Node 22.23.2 and
wasm-tools 1.258.0. Finalization reports matching original Cargo lock, Lean,
Rust, Cargo, Node, wasm-tools, and SDK inventory hashes. This closes the earlier
component-only Node-version qualification. The original pinned SDK identity
remains `d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`;
the repaired compiler source is still separately identified, diagnostic source.

Read the retained `focused-generated-evidence.tar.gz` without modifying its
contents. Its actual named `kernel.ir` and `generated.rs` match the committed
expected files byte for byte. Actual numeric generated Rust, unused-failure
IR/Rust, and replay wrapper match the component artifacts reviewed in round3
byte for byte. The archive retains the live-dictionary `PolymorphicType` log and
both native and Wasm replay artifacts. Both focused logs show the exact refusal
probe summary and successful generated native/import-free Wasm replay marker.
The reviewed unchanged focused script requires zero Wasm imports, successful
`numeric_check()`, and the independent `AddOverflow` assertion at both levels.

No builds or replay tests were rerun by this final review. No implementation,
commit, upstream publication, or SDK mutation was performed.

## Residual scope

This closes Task2c-A compiler source-stage review only. It does not approve a
candidate acquisition mode, silently admit the changed source under the pristine
SDK seed identity, establish canonical game-root admission, or approve the whole
branch/application. Those subsequent custody and application tasks retain their
own checks. The focused corpus and refusal tests are empirical evidence, not a
universal compiler-equivalence or IEEE theorem. The conservative inert-value
grammar/fuel limit and the documented boundary around delayed dictionary field
bodies remain as previously reviewed.
