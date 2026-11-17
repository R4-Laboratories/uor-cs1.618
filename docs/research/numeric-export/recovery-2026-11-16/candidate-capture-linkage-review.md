# Task4a2 independent implementation review

SpecCompliance: **PASS**. Quality: **APPROVE**. No concrete findings requiring repair in the reviewed scope.

## Reviewed identity and evidence

Reviewed source BASE `331431bc6c2b71ca06d5e145d9e6a825f6218053` through HEAD `f292c7100874c0e0b2d1e0e81b27caeec8391f77`, tree `d48cdfd94e6d46925e9269e364c2b7a6eb975d8a`. Source worktree was clean. Read source AGENTS.md, normative conditional-publication SPEC, the Task4a2 brief/report, adopted qualification design and source implementation/call sites.

Independently compared the exact Git diff to retained `reviewed-source.diff`: SHA-256 `1f34c11b55c292950f7db0990bae7e85d1af07d9bc91cfb4464f65c2060054e9`, byte-identical. The only four changed paths are `tests/publication-context-linkage/{compile.mjs,capture-owner.mjs,capture-retained-controls.mjs,capture-retained-controls.test.mjs}`. Comparing both complete Git trees establishes all 12,833 nonowned members unchanged, with 12,837 total members and no additions. The original retained-control/capture-locator helper is an exact byte prefix of its successor.

Verified evidence index SHA-256 `19481afdf65a45c30b7ad8ecd66d58d067b5dd52b3669519ea21b2d92f927a8e` and every listed regular file's length/hash: 54 files, 3,224,667 bytes, no mismatches. Inspected retained commands, actual output, protected audit, and the red/green and planted-defect evidence. No suites, builds, Docker operations or network actions were rerun by this reviewer.

## Spec compliance

The separate linkage registry has a fixed schema, fixed prefix, fixed registry and actual fixed compile.mjs module binding. Closed fields retain false completion/acceptance. Source/work/target/registry ancestry is checked for aliases and ownership; work and registry require 0700. Regular reads reject symlinks, hardlinks, wrong ownership, changed identity, unsafe record modes, oversized records, malformed names/JSON, and cross-kind records. Every existing registry entry is validated; the 256-record and 1 MiB caps remain bounded. Record admission is exclusive and read back. Original capture grammar and registry are not broadened.

Actual prepareStage places discovery immediately after the real work allocation and before source/project construction or child execution. Failure of locator admission prevents subsequent work. The actual capture owner validates its held build location before the factory and after replay, preserving the existing unchanged/factory/replay checks. Its added linkage object contains only the held work directory and fixed future receipt basename. It does not invent a future digest or final receipt. The unchanged checks.mjs later writes the forward actualCapture path/hash; this ordering has no hash cycle.

The helper participates in the existing parsed local-module input closure. There is no public callback or branded compiler reconstruction. Existing 65+2 OC10 registration, Node12 boundary code, Rust owner/reporter, immutable scripts, capture factory, reader/oracle, golden files and pins are unchanged by the exact tree comparison. No original prerequisite or gate is removed.

## Test quality and limits

The retained initial red has the original nine groups passing and all six new groups failing. The final focused run has 15/15 passing; unchanged reader groups have 8/8 and narrow compiler/capture guards 4/4. The two deliberate omissions fail the intended behavioral witnesses: removing the early locator violates ordering before project reads; removing the owner location validations permits a case that must reject. Exact source restoration precedes the final passing run.

The new file controls exercise repeated legitimate locations, missing/wrong roots and module bindings, separate-registry confusion, alias/hardlink and ownership/mode failures, malformed/oversize records, the count boundary, early project failure without a child, and removal during replay. Exact-function component tests use explicit dependencies and do not claim fresh compiler authority or generated SDK execution. The component forward receipt remains explicitly labelled component-only and proves only the noncircular reference relationship.

This approval permits Task4b to snapshot the exact reviewed successor and continue implementation. It does **not** qualify actual SDK/daemon transport, generated native/Wasm replay, full VV, application acceptance or multi-architecture outputs. Prior broader host custody failures remain unqualified; the actual hosted OC10 and complete artifact review remain mandatory.
