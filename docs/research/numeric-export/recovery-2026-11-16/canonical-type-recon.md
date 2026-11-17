# Canonical numeric target-type and tuple investigation

## Finding and scope

The canonical Lean → IR boundary loses the checked-conversion destination type, even though the generated Lean and LCNF declarations carry it. The unchanged Rust backend delegates destination selection to Rust inference. The existing packed `mul32` artifact fails native compilation with E0282/E0689/E0790 and E0609. One additional minimal **actual LexLean source** fixture, staged through generated Lean, Lake, the real exporter, and the unchanged registered codegen, also fails native compilation with E0790.

This proves information loss and native refusal for these observed artifacts. It does **not** prove universal safe refusal, and it does **not** demonstrate a silently selected i32 destination. Silent fallback remains an unproven possibility outside the tested shape. No native value comparison was possible for the new fixture because compilation failed. Do not describe this component investigation as production admission, a compiler correctness proof, full source verification, or replay success.

No compiler/source checkout implementation was changed, no generated Rust or IR was edited, no git mutation or push was performed. Diagnostic files are under `/workspace/diagnostic-tools/type-recon`; this report is the sole requested write outside it. One minimal source fixture was tried; no second fixture or broader execution search was run. Disk remained approximately 21 GiB free.

## Exact component identities

- Candidate checkout `/workspace/scratch/compiler-restoration-check`, commit `2a13f942b04f0828e03c5d7db7e4db6ecb626d6e`.
- Real exporter `lean/.lake/build/bin/prod-export`, SHA-256 `15e2d1c3d45f181a0fb2c5de86c4cfe78a9b15b31712500defbe491828bd3915`.
- Diagnostic driver `/workspace/diagnostic-tools/canonical-codegen-target/debug/numeric-compat-codegen`, SHA-256 `5f8c99acf8e06eda323b89333bea6aaa69f1d32e9f2f12054fd0f54c9a1c7113`. Its adjacent `canonical-codegen/src/main.rs` parses IR and calls `prod_codegen::generate_cargo_package`; its manifest uses the original `/workspace/scratch/prismpm-numeric/vendor/lean4-prod/rust/{prod-codegen,prod-ir}` by path. It is not an independent verifier.
- Component-only LexLean binary SHA-256 `3765ef724d19a4d08681aaa0123ff637e65c1ffcc0b8d02ae268b521b5cf2c94`.
- Rust `1.97.1 (8bab26f4f 2026-07-14)`; Lean `4.32.1`, commit `f054605aea4b840552cca2e725580bffd1e1b704`.
- `/workspace/diagnostic-tools/type-recon/evidence-sha256.json` records exact hashes for source/config/lock, generated manifest, exported IR, generated Rust, logs, driver lock, and binaries. `stage-bindings.json` binds generated module and runtime source bytes to the Lake staging paths.

## Concrete loss in the call chain

Line references below are to the inspected checkout and original registered Rust backend, not a hypothetical repaired implementation.

1. `lean/Prod/Export.lean:264` (`exportNames`) obtains the named closure, calls `extractNames`, and calls `emitKernelIr`. `Extract.lean:54–69` runs Lean's `toDecl` and `d.simp {}` with `compiler.small = 0`. `Export.lean:59–75` applies `normalizeConversions` before both type discovery and lowering. The normalized graph is shared; this investigation does not blame a divergent discovery graph.
2. `Lower.lean:776` (`lowerDecl`) retains declared parameter and return types in function signatures. `Lower.lean:645–683` stores each LCNF `decl.type` in `fvarTypes` and calls `lowerLetValue value (some decl.type)`, so the local type is available at lowering time.
3. `Lower.lean:225–243` maps the generic runtime `checkedConvert` to opcode `checked-convert`, arity one. `Lower.lean:519–541` lowers arguments, keeps the last runtime operand, and emits `({op}{spaced values})`. Unlike `parse-decimal`, this case does not use `resultType` to retain its destination. The adjacent dictionary-erasure comment says fixed operand/result types capture the semantic effect, but checked-convert's emitted expression does not carry those local types.
4. The general let at `Lower.lean:683` is `(let name value body)` with no type annotation. Join-point parameter types and case-binder types are stored for lowering but emitted as names only (`Lower.lean:685–723`). Raw fixed-width literals are emitted as decimal text (`Lower.lean:491–496`); fixed-literal constructors can reduce to their operand (`Lower.lean:556–557`). This is wider than one missing turbofish.
5. Registered `rust/prod-ir/src/lib.rs:102` defines `CheckedConvert(Box<Expr>)`, with no destination type, and `parser.rs:323` parses the unary opcode. Typed function signatures do not repair a missing type for an internal local used only in polymorphic operations.
6. Registered `rust/prod-codegen/src/lib.rs:2618–2621` renders `core::convert::TryFrom::try_from(value).ok()` with no destination qualification. General lets are emitted without annotations (`2402–2430`), numeric literals without suffixes (`2565–2566`), and checked operations use receiver methods (`checked_add`, `checked_sub`, etc.). A typed signature or typed receiver can constrain them, but absent such constraints the observed native errors are expected.

Existing artifact evidence: `/workspace/scratch/cs-numeric-kernels/artifacts/numeric-canonical-probe/packed/replay/mul32-native.log`. The first E0282 is generated `lib.rs:71–74`, where an ungrounded converted payload becomes a checked-add receiver. E0689 instances include the literal-derived negative receiver at line 88. The `negative(a: i16) -> bool` helper at generated line 2835 converts `a` and only observes Some/None, so no output payload type is available to select TryFrom's destination; rustc reports E0790 at line 2836. These are failures of this emitted program, not runtime results for the four requested kernels.

## One real LexLean fixture and observed result

Source: `/workspace/diagnostic-tools/type-recon/source/src/Main.lex.tex`, root `TypeRecon.Main.narrowedIsZero`:

```text
parameters: [a : UInt64],
result: Bool,
body: (let narrowed : UInt8 := (match (prim checked_convert a : (Option UInt8))
  | Option.some b => b
  | Option.none => (0 : UInt8)); (prim equal narrowed (0 : UInt8) : Bool))
```

The source is executable with the explicit `[Quot.sound, propext]` axiom policy used by these semantic primitives. It is a diagnostic definition, not a theorem certifying compiler preservation.

Generated source is byte-staged from build ID `141f738743296ed2cbf7107c78b267ff6703b6023974b013af7a8d1c14c6708d`. It explicitly contains `let narrowed : UInt8`, `(LexLeanRuntime.checkedConvert (a) : Option (UInt8))`, and a UInt8 zero. Runtime `Portable.lean` and `Collections.lean` were copied unchanged from the supplied canonical runtime build `b2417b32339d6c95b594a79c0e52b2537638369ea14bd783f721b8d60369ee2f`. Lake compiled all three staged modules successfully.

`lean-work/Observe.lean` imports the generated module; it does not alter it. `lean-eval.log` prints the generic runtime checkedConvert definition and evaluates inputs `[0, 1, 255, 256, 257, 2147483647, 2147483648, 4294967296, 18446744073709551615]`. Lean returns `[true, false, false, true, true, true, true, true, true]`. In particular, a UInt8 checked conversion must reject 256, causing the zero default and `true`.

The actual exported IR is `/workspace/diagnostic-tools/type-recon/extracted/kernel.ir`. Its function signature is `((a UInt64)) Bool`, but its body contains `(checked-convert a)` without UInt8. Its continuation uses `(eq _y_16 _x_33)` with an unsuffixed zero; the default branch jumps with another unsuffixed zero. Coverage reports zero opaque nodes, external calls, and unsupported types, showing that those checks do not establish local numeric type preservation.

Generated Rust `/workspace/diagnostic-tools/type-recon/package/src/lib.rs:16` is:

```rust
pub fn narrowedIsZero(a: u64) -> bool {
    { let _x_11 = core::convert::TryFrom::try_from(a).ok(); match _x_11 {
        None => { let _x_39 = 0; { let _y_16 = _x_39; { let _x_33 = 0; { let _x_22 = (_y_16 == _x_33); _x_22 } } } },
        Some(val_14) => { let prod_local_0 = val_14; { let prod_local_3 = 0; { let prod_local_4 = (prod_local_0 == prod_local_3); prod_local_4 } } },
    } }
}
```

The backend has copied the continuation into each match arm. The `None` arm's zero is therefore not a common numeric match-result type constraining the `Some` arm's destination. Equality itself does not establish that destination here. Native compilation exits 1 with E0790 at line 17; no binary or native output was produced. The anticipated i32 fallback was **not observed**. The one fixture cannot exclude other shapes in which Rust inference may select a type after Lean's destination has disappeared.

### Actual commands and reproducibility

The complete argv/cwd/status record is `type-recon/commands.json`; `run.py` is the exact staging/extraction/evaluation driver. Logs are `lock.log`, `lexlean-build.log`, `lake-build.log`, `extract.log`, `codegen.log`, `lean-eval.log`, and `native-compile.log`.

```sh
/workspace/diagnostic-tools/lexlean-target/release/lexlean --project /workspace/diagnostic-tools/type-recon/source/lexlean.toml lock
/workspace/diagnostic-tools/lexlean-target/release/lexlean --project /workspace/diagnostic-tools/type-recon/source/lexlean.toml build --all
python3 /workspace/diagnostic-tools/type-recon/run.py
```

The first lock attempt lacked a Lake config/toolchain; the fixture then received existing diagnostic `lakefile.toml` and `lean-toolchain` scaffolding before the successful lock/build commands. The source fixture was not revised. `run.py` stages a dedicated Lake library and runs:

```sh
# cwd: /workspace/diagnostic-tools/type-recon/lean-work
# Lake env: ELAN_HOME=/workspace/diagnostic-tools/elan
# ELAN_TOOLCHAIN=leanprover/lean4:v4.32.1; diagnostic-tools/elan/bin prepended to PATH
lake build TypeReconDiagnostic
# Export/eval env: diagnostic-tools/lean-4.32.1-linux/bin prepended to PATH;
# LEAN_PATH=type-recon/lean-work/.lake/build/lib/lean:compiler-restoration-check/lean/.lake/build/lib/lean
/workspace/scratch/compiler-restoration-check/lean/.lake/build/bin/prod-export --module TypeRecon.Main --root TypeRecon.Main.narrowedIsZero --ir-module type_recon --out /workspace/diagnostic-tools/type-recon/extracted
/workspace/diagnostic-tools/canonical-codegen-target/debug/numeric-compat-codegen /workspace/diagnostic-tools/type-recon/extracted/kernel.ir /workspace/diagnostic-tools/type-recon/package
lean Observe.lean
/workspace/diagnostic-tools/rust-1.97.1/bin/rustc --edition=2021 --crate-type=rlib --crate-name=type_recon /workspace/diagnostic-tools/type-recon/package/src/lib.rs -o /workspace/diagnostic-tools/type-recon/libtype_recon.rlib
```

The final command is the expected observed refusal. `run.py` stops at that nonzero exit; subsequent native harness creation/compilation/evaluation code in the script did not execute.

## Tuple projection: smallest defect

This is a builtin tuple representation mismatch, not a domain-specific floating-point limitation:

- `Lower.lean:499–515` resolves structure indices to Lean declared field names. For `Prod`, they are `fst` and `snd`; the emitted projection is `(proj "Prod" "fst" receiver)` or `snd`.
- `Lower.lean:751` lowers `Prod` type to `(Tuple ...)`, and the exporter excludes builtin `Prod` from generated named declarations.
- Registered `prod-codegen/src/lib.rs:2780` already specializes `Prod.mk` as a Rust tuple; `Type::Tuple` also renders as a Rust tuple type.
- Registered `prod-codegen/src/lib.rs:2836–2841` renders every projection as `(<receiver>).<rust_ident(field)>`. Its unknown-field guard only applies when the owner is in the named declaration table. Builtin `Prod` is absent, so `.fst`/`.snd` escapes to rustc instead of becoming `.0`/`.1` or a codegen rejection.
- Existing native evidence reports E0609 at generated `mul32/package/src/lib.rs:2714,2733,2735,2736,2740` on `(u32, i16)`.

The narrow scalar-tuple backend repair is an explicit builtin `Prod` projection path mapping exact `fst`/`snd` to numeric Rust members, with rejection of unknown fields. A general implementation must also preserve projected component type/ownership for non-Copy tuples; simply renaming fields is only enough for the observed Copy scalar pair. Ordinary user records must retain named-field lookup and validation. No tuple patch was implemented or executed here.

## Bounded source workarounds under unchanged IR/Rust pins

These are legitimate source-level approaches for the next bounded experiment, subject to re-extraction/native verification; they are not established by this one failing fixture as already successful application repairs.

1. **Monomorphic named conversion helpers:** a helper with source signature `UInt64 -> Option UInt8` and a direct checked-convert body exports a Rust return type `Option<u8>`. That return signature supplies the missing TryFrom destination. Calls to the helper then retain `Option<u8>` locally. Use one explicit source helper per required source/destination pair; do not use a Bool-only helper that hides the destination again (the existing `negative` example does exactly that). The ordinary named helper must survive extraction as a function and call, rather than being inlined back into the untyped site; `compiler.small = 0` is relevant but the emitted artifact must confirm this.
2. **Monomorphic named arithmetic helpers:** a checked-add/subtract/etc. helper with both parameters explicitly `Int16` (or the intended other scalar) gives Rust a typed receiver at function entry. Passing literals to that helper constrains them through the signature. A fixed return type alone should not be assumed to resolve every method-receiver ambiguity; use explicitly typed operand parameters and inspect emitted signatures/calls. Replace literal-derived negative/checked receivers with operations routed through such typed helpers as necessary.
3. **Named counter/result record:** replace the concrete `(UInt32, Int16)` pair with a monomorphic Lean structure whose two computational fields explicitly carry those types. Its constructor and projections use the existing generated named struct/field mechanism; this avoids builtin Prod tuple projection. Keep the field meanings and order explicit and update all producers/consumers. This is a valid bounded representation change, not permission to add handwritten Rust records or alter emitted fields.

These approaches can constrain this application's representation without changing registered Rust/IR pins. They do not repair the generic loss of local scalar types or the generic Prod mismatch, which remain compiler follow-up issues. They require semantic regression cases at conversion boundaries and counter behavior, followed by the intended full extraction/native/replay gates. Passing such a bounded application workaround would not establish arbitrary checked-convert correctness.

## Narrow compiler repair options for later work

- Preserve checked conversion destination explicitly in IR, taking it from the known `Option target` LCNF result type, and generate a qualified destination conversion such as `<u8>::try_from(value).ok()`. Validate supported source/destination scalar shapes and reject unsupported forms. Typed decimal parsing already illustrates preserving a target at this boundary, but it is not itself a conversion repair.
- Retain typed let bindings / typed fixed literals / typed primitive operands and join parameters sufficiently to ground every fixed-width method receiver, including after join expansion. A convert-only patch does not resolve all observed literal-receiver E0689 failures.
- Add the builtin Prod projection support described above, including validation and appropriate component type handling.

Do not substitute an arbitrary i32/u64 default, weaken parser/type/unknown-field guards, remove native compilation, or edit emitted Rust to force acceptance. No such changes are part of this investigation.
