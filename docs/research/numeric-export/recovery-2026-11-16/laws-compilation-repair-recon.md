# Laws compilation repair reconnaissance

Status: a supported no-C compilation path is demonstrated; production repair is proposed, not implemented. No source commit, generated production edit, toolchain substitution, SDK pin change, or timeout change was made. Source inspected: PrismPM `f6776fca7c9f675b3bb762ddaf88d256aad3d77f`; restored compiler `2a13f942b04f0828e03c5d7db7e4db6ecb626d6e` at `/workspace/scratch/compiler-restoration-check`; game HEAD when inspected `dee288d85ab92bb4164d64378a138137ed3e1319`.

## Established failure and semantics

Actual hosted run `44008985569` has four `PP5007` / exit 124 `lake-build-generated` failures. Each log reports successful Portable, Collections, Foundation model, Wide, Float, and NumericPackage compilation; verify/replay did not run. This remains the normative failed SDK evidence.

The earlier exact-runtime comparison proves that local Laws bytes equal `runtime::imported_by` output (`d0c1f9df307e62d88e4dbb1f2b66b38416d4e2074860b7f61449f474d3fd4563`). The original partial local attempt wrote Laws olean/private/server, ilean, and IR, and opened an empty C file. Pinned `Lean/Shell.lean:553–570` calls `runFrontend`, then opens C, then calls `LCNF.emitC`, then writes the complete returned buffer. Thus the local timeout is after successful frontend/artifact serialization, in the C emission path, before an external C compiler. This is not evidence of a failed Bounds proof.

`compiler.postponeCompile` is not a bypass. `Lean/Compiler/Options.lean:44` calls it internal/experimental separate compilation. `LCNF/Main.lean:163–175` defers non-meta compilation before normal base/mono/impure passes; `Lake/Build/Actions.lean:84–99` then invokes `leanir setup ir c`. It still requests C and changes compilation staging. Do not use it for this repair.

No supported built-in Lake TOML facet was found that produces the required complete olean/IR set without C in this pin. `Module.mkArtifacts` includes C unconditionally; `leanArts` computes all outputs; olean, olean.server, olean.private and IR facets depend on `leanArts`. `precompileModules=false` does not remove C generation. Switching to an olean facet is ineffective. A custom Lean DSL target would require handwritten production Lean and is not recommended.

Ordinary pinned Lean `-o/-i` without `-c` is different: it runs the normal frontend and compilation pipeline, writes IR with `postponeCompile=false` (`Elab/Frontend.lean:350–354`), and only omits the optional backend C serialization in `Shell.lean`. The repository already uses this supported approach: vendored LexLean `verify/mod.rs:1480–1515` compiles runtime modules with `lake env lean -R <source-root> -o <olean> <source>`; lines 1580–1663 compile project modules in topological import order without `-c`, followed by its replay and audit stages. No runtime/compiler source repair is required to use that established path.

## New bounded component evidence

All new experiments and logs are in `/workspace/diagnostic-tools/laws-investigation`. `probe.py` independently copies exact unedited source files from the original partial workspace and records source/binary hashes, argv, exit codes, log digests, output artifact hashes, elapsed time, and free disk in `result.json`. It starts with an empty artifact directory. Each child has its own process group and cleanup; all compilation plus extraction share a 300-second total diagnostic bound. No stale compiled artifact was copied.

The closure is precisely Portable, Collections, Laws and all five project modules: Bounds, Float, Foundation.Library.V1.Model, NumericPackage, Wide. Models/Reasoning were not included because actual runtime closure does not need them. Setup options remain empty, threads remain `-j2`, and no postponement, trust-level increase, theorem edit, or root change is used. Fresh LEAN_PATH is first; the existing restored compiler library path is present for extraction. The source order is explicitly fixed for this diagnostic only; a production implementation must derive and validate the dependency order.

| Step | Exit | Seconds |
| --- | ---: | ---: |
| Portable | 0 | 9.276 |
| Collections | 0 | 3.457 |
| Laws | 0 | 4.389 |
| Foundation model | 0 | 0.265 |
| Wide | 0 | 0.619 |
| Bounds | 0 | 0.315 |
| Float | 0 | 0.819 |
| NumericPackage | 0 | 0.316 |
| Existing prod-export, all five modules and both roots | 0 | 3.176 |

Total measured run: 22.658 seconds. All eight module artifact sets include `.olean`, `.olean.private`, `.olean.server`, `.ilean`, `.ir`; no C output is requested. Pinned `leanchecker` subsequently returned 0 for all eight modules; commands and timings are in `kernel-result.json`. Bounds still contains all five original public theorem statements: limbAddBound, cellAddBound, divDoubleRemainderBound, divReducedRemainderBound, divQuotientStepBound.

Exporter roots are exactly `BoundedNumeric.Float.mul32` and `BoundedNumeric.NumericPackage.acceptance`; module args include Bounds. Export output hashes:

- `kernel.ir`: `b3c000034887e67cde0d1434e77b49d7046775f6dbc11c5c3ef794e65fbf09bf`.
- `roots.json`: `8890d3e7ba84df05d3714aaad1ee0c2dc60926e66ad32380cd5b9c6fa188298b`.
- `coverage.json`: `f6a2a9524943ce4761340ac355fecbd77f06404cdbc1b165c3d291d4ab9bf530`.

These three are byte-identical to the earlier combined arithmetic-plus-acceptance component output. Coverage has no external calls, opaque nodes, unsupported types, or erased-proof dependencies. Empty erased-proof dependencies describe the exported root closure; they do not mean Bounds was omitted from this new compilation or kernel-check scope. This probe is not full LexLean axiom attestation, Prism build/verify, generated-package acceptance, or SDK qualification.

An optional 60-second instrumented `EmitterProbe.lean` experiment reused the public frontend and internal emitter functions in a standalone interpreter diagnostic. Collection completed (689 impure declarations), but declaration ordering panicked at `getImpureDeclIndices` with `i != 0`, then produced missing-key panics until the bound. This altered invocation is not identical to the original CLI environment; it is inconclusive about the production emitter subroutine and supplies no proposed emitter patch. `emitter.log` and `emitter-result.json` retain it. Do not claim this panic is the original timeout cause. No diagnostic Lean is proposed as production source.

## Smallest principled proposed repair

Limit the initial repair to native-library generation in `library_build.rs` and its exact owner/reader contracts. Preserve the current shared application/browser/other native compilation path unless separate evidence requires changing it. Replace the native-library `lake build PrismGenerated` obligation explicitly with a source-owned Rust orchestration of actual pinned Lean frontend invocations. Do not retain the old command label or fabricate a successful Lake build record.

The implementation must:

1. Stage and byte-bind the complete manifest project set and actual imported runtime closure exactly as today. Keep Bounds and every declaration. Derive deterministic dependency order using authoritative LexLean metadata/APIs or a strictly validated generated-import parser; reject duplicate modules, absent imports, cycles, path escapes, shadowed reserved runtime names, and incomplete closure. No hardcoded numeric-only order.
2. Use the measured pinned `lean` executable with explicit `-j2`, source root, olean/ilean outputs, and a deterministic empty-option setup if retained. Keep `compiler.postponeCompile=false` and default trust level. Use controlled LEAN_PATH restricted to fresh generated artifacts plus required measured toolchain paths; do not inherit ambient caches or accept prior attempt outputs. The diagnostic demonstrates direct Lean; `lake env lean` is an established repository alternative if both launcher and actual Lean identities remain honestly measured.
3. Produce a real process record per module, including exact normalized argv, environment, module identity, binary digest, and exit. Require the complete expected `.olean/.olean.private/.olean.server/.ilean/.ir` regular-file set before considering that module complete. Record an explicit compilation profile such as `lean-frontend-lcnf/1` stating that C output is not requested. This is an intentional profile revision, not an invisible optimization.
4. Preserve the original whole-stage deadline, output/resource limits, and owned process-group cleanup. Do not multiply the former build budget into a fresh full timeout for every module. A sequential implementation is sufficient initially and is simpler to audit; `-j2` remains unchanged.
5. Keep source LexLean verify, kernel replay, declaration/axiom policy audit, closure and erased-proof audit, independent controller-build/replay exports, byte-for-byte regeneration, package creation, and std/no_std acceptance. Native C for these intermediate Lean modules is not consumed by the LCNF-to-Rust pipeline; generated Rust remains wholly owned by the registered generator.

## Exact ownership, reader, identity and golden consequences

- `exporter/owner.rs:100–135` currently requires exactly four command roles, fixed first argv `build PrismGenerated`, empty first environment, and a fresh workspace. Its terminal check at 568–580 also requires exactly those four records. Replace that fixed first command with the complete bound per-module frontend sequence followed by the unchanged exporter build/export/package stages. The dynamic count must come from attested runtime/project closure, not from caller-supplied process records alone. Keep phase order, two independent workspaces, poisoned-state behavior, package custody and before/after snapshots.
- `exporter/owner.rs:710–795` reader currently demands four records, fixed first/second argv, and one equal Lake executable hash for the first three records. The new reader must validate separate Lean identity, per-module source/outputs/args/environment/order, then the existing Lake/exporter/Cargo identities. Update `validate_binding` and all indexing/count assumptions for both controller-build and replay. Scope/version the new library contract explicitly and reject missing/extra/reordered or old-profile records under the new profile. Preserve application handling as a separate branch.
- `library_verification.rs:244–270` retains declaration auditing and invokes the same `generate_owned` for replay. Lines 421–436 bind owner records to the manifest, actual process array and module-derived export arguments. These bindings must cover the new closure/profile, not just accept a list of successful Lean exits. Real bundle-reader mutation tests are required.
- `controller/mod.rs:45–98` hashes `library_build.rs`, `lean_project.rs`, exporter source/owner/custody and other authority files into `library_generator_identity_for`; these changes must change the library generator identity. Any new helper file must also join that identity closure explicitly. Avoid placing a library-only helper in shared `lean_project.rs` without acknowledging that `application_generator_identity_for` also hashes that file at line 39; changing it invalidates application identity/goldens even if behavior is unchanged.
- Existing generic native verification/release readers (`verification.rs:3153–3190`, `release_verification.rs:1912–2040`) also encode `lake-build-generated` and fixed indices, but are a separate path from the modeled-library reader. Do not mechanically rewrite them unless the implementation actually changes that path. Keep their tests/contracts unchanged when scoped out.
- Candidate source archive, rebuilt compiler/Prism provenance, library generator ID, fixture locks and applicable native goldens must be regenerated from the final reviewed source. Do not write the held candidate/golden preparation now and carry stale values across this repair. Shared application generator or owner-envelope changes require the corresponding full native golden regeneration and reader tests, even if generated arithmetic Rust remains byte-identical. Keep original d6/toolchain/SDK-lock pins and explicitly bind the new source candidate as before.

## Required implementation validation

Use the failed actual run as the original regression. Add focused real compilation coverage for a complete Bounds/Laws fixture under no-C, successful pinned leanchecker, and full-module export with exact roots. Add import-order/closure and stale-artifact refusal cases, invalid-proof or forbidden-axiom controls through the existing full verifier, and absence of unexpected C/postponement flags. Assert process count/order/argv/environment and distinct Lean versus Lake hashes rather than mocking all subprocess success.

Add owner and actual reader controls for omitted Bounds/runtime records, removed companion artifacts, reordered dependencies, substituted module/Lean binary, altered compilation profile, changed source/roots/output/archive, and replay workspace reuse. Keep existing source/axiom audit and compiler refusal controls. Validate the shared deadline and cleanup on a bounded failing child.

After source review, run applicable source VV and regenerate affected goldens. Then execute the unchanged hosted SDK workflow on all four actual CLI build/verify packages, retain both owner phases and complete source audits, and rerun native/Wasm corpus plus mutation/None controls against exact selected new CLI outputs. Local component evidence does not replace any of those gates.

Final measured disk free was about 20.29 GB, above the 8 GiB floor. No diagnostic child remains running. Source and production repositories were read-only except this requested report; unrelated pre-existing game worktree changes were left intact.
