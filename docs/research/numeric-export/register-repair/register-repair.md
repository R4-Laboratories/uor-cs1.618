# Generated register repair after exact-SDK CI

The reviewed source candidate46bdbc56ad99ac2bb73d6499863260a7fead9712 failed its
first actual exact-SDK run at the engine consistency gate, not at a numeric
regression. Run43919280445, patched job133481869450, used the locked SDK and
passed233 library tests,12 CLI tests and27 of28 engine tests. The failing test
`no_lifted_kappa_turns_unlifted_ue_16` reported:
`frontier.toml is not this workspace's lift register; run just register`.
The run then stopped; neither full just vv nor the post-gate primitive probe passed.

`crates/uorust/tests/engine.rs:983` projects the workspace using source and MIR
with the committed proof verdicts. It checks that previously lifted kappas do
not become unlifted, then requires the complete committed register bytes to
match the regenerated register. The source patch changed certification
functions and source spans; the candidate omitted the required generated
`frontier.toml` update. The failure is load-bearing evidence of a packaging
omission, not a reason to relax the comparison.

The unchanged Justfile register recipe at line83 runs:

```sh
rm -rf target/uorust-self
cargo run -q --locked -p uorust -- mir . --out target/mir
cargo run -q --locked -p uorust -- project . --out target/uorust-self --name uorust --last-modified 2026-11-11T00:00:00Z --register frontier.toml --mir target/mir --verdicts lift-verdicts.toml
```

`frontier.toml` is the intended committed output; MIR and project directories
are ignored scratch outputs. Existing `lift-verdicts.toml` is an input, not
rewritten by this recipe. No new proof run, certified package rewrite, gate
change, SDK pin change or numerical semantics change is intended.

Local regeneration uses the retained cached game SDK, explicitly diagnostic,
with Rust1.97.1 (`8bab26f4f68e0e26f0bb7960be334d5b520ea452`, LLVM22.1.6), which
matches the repository rust-toolchain.toml version. It does not become exact
UORust SDK acceptance merely because the Rust version matches. Environment:
`CARGO_TARGET_DIR=/workspace/target/numeric-repair CARGO_BUILD_JOBS=2
CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_INCREMENTAL=0`.
Command: `bash /workspace/scratch/numeric-probe/run-uorust-current-sdk.sh sh -c
'cd /workspace && [environment above]; rustc -vV; just register'`.
Raw receipt: `/workspace/scratch/numeric-probe/current-register-write.log`.

Previous46bdbc5 patch, manifest and reports are preserved beside this report
with prior- prefixes. Only the isolated repair worktree is being changed;
game source, public evidence mapping and publication remain the parent's work.

## Generated result

`just register` completed successfully and wrote84 ignored projection files.
The only tracked change is frontier.toml:5lines replaced. Profile::mark and
carry get new source kappas; cargo_manifest's MIR source span changes from
line3441 to3453 in the row, construct description and summary comment.
All table counts remain identical:1488functions,341lifted,881residue,92foreign,
174effect. No lifted row changes. Machine comparison: register-diff.json.

The focused check uses the same supported task-owned MIR build cache to avoid
another large build directory, while still dumping fresh MIR through the gate:

```sh
bash /workspace/scratch/numeric-probe/run-uorust-current-sdk.sh sh -c 'cd /workspace && export CARGO_TARGET_DIR=/workspace/target/numeric-repair UORUST_MIR_TARGET_DIR=/workspace/target/mir/build CARGO_BUILD_JOBS=2 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_INCREMENTAL=0; cargo test --offline --locked -p uorust --test engine no_lifted_kappa_turns_unlifted_ue_16 -- --exact --nocapture && just self-model-check'
```

Receipt: current-register-check.log. These checks use the cached game SDK;
the actual locked-SDK full gate still requires rerunning CI on the new candidate.
The previous exact-SDK failure must remain in the issue history.

## Result and custody

Focused UE-16 **passed**,1test,27filtered,330.85seconds. The chained
`just self-model-check` stopped with LLC0102: `lexlean.lock is stale or
noncanonical` / `the compiler semantics changed since locking`. This is the
known cached-SDK semantics mismatch. Exact-SDK patched CI had already passed
that same check at17:34:05Z (`self-model: every generated file matches its
generator`) before its later engine failure. No lock rewrite or weakened
check was attempted. Diff whitespace passed; all six policy hashes still match.

Generated-only commit `0e3472ed1ff2f3fda1d010929c4f323a05576c09` follows source commit46bdbc56.
Tree `aa5082efb83d6fd38275d00aec404929fbe34d9c`. Cumulative two-commit patch
`numeric-export-current.patch`, SHA256 `05a866911f5c6386ccf6665cb178471e039cae6a2da1b84a27033491affa33e3`.
`validation-manifest.json` pins the same base/SDK/bootstrap/lock and now admits
12exact changed paths, adding only frontier.toml. The isolated worktree is clean.
The historical46bdbc5 patch and manifest remain preserved with prior- prefixes.

Required next acceptance: independently review this generated-only commit and
rerun the unchanged full `just vv` in the exact c1bfe8d5 SDK using this new
candidate tree. The previous exact-SDK failure remains evidence; local UE-16
success does not claim the full gate or primitive post-gate probe has passed.

Task-owned generated caches retained: current worktree target/mir and
target/numeric-repair. They are distinct from the shared SDK and actual retained
primitive bundle under /workspace/scratch/numeric-probe/project. Final free
disk was about1.6GiB; no SDK download or shared cache deletion occurred here.

Issue identifier: **NEXP-008** is the generated-register finding. Public
NEXP-007 remains the cached-artifact bypass; the parent merges this follow-up
additively rather than replacing its canonical register with this older-derived
snapshot. Patch/tree unchanged by this identifier correction.

A separate temporary Git index applied the cumulative mailbox patch to exact
baseb04af355 and wrote treeaa5082efb83d6fd38275d00aec404929fbe34d9c,
matching the manifest. The source worktree remained clean.
