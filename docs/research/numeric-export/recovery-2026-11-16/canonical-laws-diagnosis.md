# Read-only canonical Laws diagnosis

No source, SDK pin, guard, timeout, facet, reviewed checkpoint or tracked report
was changed for this diagnosis. No Lean compilation was launched. A small Rust
diagnostic wrapper linked the already-built isolated LexLean rlib to call the
same `lexlean::backend::runtime::imported_by` API as PrismPM.

## Exact runtime comparison

Evidence: `/workspace/diagnostic-tools/canonical-laws-diagnosis/comparison.json`
SHA256 `5dbe50d46e6b00df5bfb55402d1d64a5017a826ad4655bec2a20091636bba7af`.
It binds the wrapper, linked rlib, generated project inputs, API output and
complete-probe runtime hashes. The rlib is the previously measured isolated
LexLean component from dependency `e0b74b81e6f49c83596a957d232c8383a5db1a25`;
this does not measure an installed SDK.

For all five generated mul32 source modules (including Bounds), actual
`imported_by` returns this dependency-ordered closure:

| Module | Bytes | API and complete-probe SHA256 |
| --- | ---: | --- |
| LexLeanRuntime.Portable | 366254 | `d2d34c01c5fff345c099279013f7d428dc5747f0401873fa9df36ca97a87705a` |
| LexLeanRuntime.Collections | 266696 | `c78bfaf21acedf3a0e9812d3fe575cd2903489c281df393113bb7cf0eaef3610` |
| LexLeanRuntime.Laws | 684731 | `d0c1f9df307e62d88e4dbb1f2b66b38416d4e2074860b7f61449f474d3fd4563` |

Each file is byte-identical to its corresponding complete-probe input.
The diagnostic probe also staged Models and Reasoning unnecessarily. Actual
`library_build` would omit those two, but it still stages the exact same Laws
bytes because generated `BoundedNumeric.Bounds` publicly imports Laws.
Calling the actual API on the generated project modules with Bounds omitted
returns only Portable. This is a scoped diagnostic, not authorization to remove
Bounds or its proof scope from the actual package.

Laws is used here through a proof dependency, but its generated file is not
pure theorem text. Parsing its exact native source through
`CoreModule::from_source` yields 107 theorem, 6 abbreviation and 6 definition
rows. Four rows have `compiled: true`: `LexLeanLaws.sumInt`,
`LexLeanLaws.sumNat`, and two private splitter rows. The generated core decoder
also contains executable decoder definitions. The API's 80 audited declarations
are its filtered audit-name set, not the total native-row count. No evidence
identifies a specific declaration as the C-emission bottleneck.

## Timeout phase

The retained original full-runtime attempt reports `lake_exit: timeout300`,
with extraction/codegen not run:
`/workspace/diagnostic-tools/canonical-packaging-combined-v3/results.json`.
Its active child was Lean itself with `-o`, `-i`, and `-c` outputs; no external
C compiler was active. At termination, Laws `.olean`, `.olean.private`,
`.olean.server`, `.ilean` and `.ir` existed; `Laws.c` was zero bytes.

Pinned Lean distribution source makes the phase more precise than the initial
checkpoint report could: `Lean/Elab/Frontend.lean:350` writes the olean on the
no-errors path, then the ilean. `Lean/Shell.lean:553` awaits `runFrontend`;
only after receiving `some env` does it open/truncate the C output file and
call `Compiler.LCNF.emitC` inside the `C code generation` profile block
(`Lean/Shell.lean:563–570`). It writes the resulting complete data afterwards.
The existing empty C file therefore places this failure after successful
frontend elaboration/artifact serialization, in Lean's C emission path.
It was not a `cc` compilation timeout or a demonstrated theorem-checking
failure. No internal emitter subroutine or offending definition is identified.

## Actual library path and facets

Exact PrismPM `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`:

- `library_build.rs:329` calls `lean_project::stage_runtime` on every generated
  project module, then creates the library roots from that imported runtime
  closure plus all project modules. Bounds therefore induces Laws here too.
- `lean_project::configuration` defines `PrismGenerated` with `-j2` and default
  library facets; actual owner arguments require `lake build PrismGenerated`.
- Pinned Lake `LeanLibConfig.lean:88` defaults to `leanArts`.
  `Build/Library.lean:65–74` fetches each module's `leanArts`.
  `Build/Module.lean:793–801` includes a C output; `Build/Actions.lean:43–47`
  adds `-c` unless the traced postponed-compile option applies. The retained
  setup options are empty and the observed child includes `-c`.
- Merely selecting Lake's `olean` or `olean.server` facet would not bypass this
  default work in this version: both fetch `mod.leanArts` via
  `Build/Module.lean:1040–1062`. No such alternate facet was run.

The superfluous Models/Reasoning staging is diagnostic-only overhead. The Laws
C-emission obligation is also present in the actual unchanged library path for
the current complete project module set. The actual hosted SDK run remains the
normative test; elapsed behavior on that machine is not inferred from the local
component timeout. No bypass or configuration change is proposed here.
