# Full source validation orchestration report

Status: implemented and locally checked; full source VV execution is pending CI.
No image was pulled or built locally, no full gate was run locally, and no SDK,
package, upstream push or production admission was created. Publication of the
game workflow remains with the controller.

Implementation commit: `deaf087` (`Add exact backport full source validation orchestration`).
Focused implementation range: `57cd685..deaf087`. The controller's documentation
commits after brief BASE `0535ebb` are outside that implementation range. This
report is a separate scoped follow-up commit.

## Owned files

- `.github/workflows/prismpm-backport-full-validation.yml`: independent source
  image preparation, eight isolated matrix workers, and original assembly.
- `.github/actions/prismpm-source-cache/action.yml`: original pinned upstream
  runtime/buildx setup with the definition hash rooted at `prismpm/.devcontainer/**`.
- `scripts/numeric/full-source-vv.py`: exact metadata-bound restoration,
  bootstrap-object availability, source-cleanliness verification, selective
  image identity recording, and bounded original-record retention.
- `scripts/numeric/tests/test_full_source_vv.py`: ten orchestration checks.
- `docs/research/numeric-export/recovery-2026-11-16/full-source-validation.md`:
  operation, boundaries, failure semantics and local-test instructions.
- This report.

## Source and command contract

Every source worker uses a full-history checkout of
`UOR-Foundation/prismpm@3666dc0f9da56fcf066d96ec01cd9e14ec9a2974`, in a sibling
checkout to the game harness. Existing `restore-prismpm-candidate.py` verifies
the retained bundle and patch. The new orchestration additionally freezes the
entire reviewed manifest, candidate
`2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec` and tree
`3d4838633c80fb754b33f466c25ef0962057e2fd`. It verifies the historical bootstrap
tree `f378fd3a8dc5711cb4b22cec9ee2f874353628c3` and requires the unchanged
bootstrap script's actual availability message. Source identity and cleanliness
are required before gates and checked again after completion, including failed
commands. No upstream authored input, pin, fixture, guard or profile is edited.

The pinned upstream devcontainers action metadata was inspected at
`/workspace/diagnostic-tools/devcontainers-ci-action.yml`; `subFolder`, `env`,
`inheritEnv`, and `skipContainerUserIdUpdate` are supported real inputs. Its
implementation was also inspected to confirm the source workspace is selected
with `path.resolve(checkoutPath, subFolder)`, lifecycle commands receive the
explicit environment, and the action leaves the container available for
post-command identity recording. The development container definition,
initializer, Docker socket mount, non-root exec launcher, and postCreate
fetch/init sequence remain unchanged. Actual local image config digest, optional
RepoDigests, source-container ID/state, architecture, shm capacity and definition
hashes are retained externally; an image tag is never labeled a digest.

The eight unchanged parts remain `source`, `gates`, `conformance`, `ho-oc`,
`st-sy`, `dk-0-1`, `dk-2`, `dk-3`, with `fail-fast: false`, 360-minute workers
and the original 240-minute image ceiling. Every worker acquires the exact d6
SDK oracle in the host daemon and supplies its immutable reference as
`PRISMPM_TEST_SDK_IMAGE`. The original source container mounts that same daemon's
socket. The selected command is the unchanged observed upstream entry point:

```sh
export CARGO_BUILD_JOBS=2 CARGO_NET_OFFLINE=true
bash scripts/bootstrap-verify.sh --check-source
node scripts/ci-observe.mjs run target/ci-diagnostics/vv -- just vv-part "$PRISMPM_VV_PART"
```

No raw cargo shortcut or redundant outer `--with-sdk` wrapper is used. The d6
selector prevents automatic local SDK construction. Environment inheritance is
disabled; no local `CARGO_PROFILE_*` override is passed. Source gate outputs
remain on disk with the original source-container layout. Positive configured
`/dev/shm` capacity <=1 GiB and a Docker socket mount are required by the
container identity check.

Ruling: export Cargo offline only inside runCmd, after postCreate — the pinned
action applies its `env` input to `devcontainer up` as well as exec, so passing
offline there would obstruct the required unchanged fetch; cost if wrong is a
failed setup rather than relaxed acceptance.

Ruling: retain host observer output outside the UID1000 source checkout — the
host runner's UID differs from the required source user and should not write
its target tree; source gate diagnostics still use the original bounded observer
location. Host Git checks explicitly scope safe.directory to the dedicated
source checkout; cost if wrong is failure to collect/verify, not an acceptance
bypass.

Cleanup reproduces the upstream list of disposable hosted-runner tool
installations, requires both GitHub Actions and a GitHub-hosted runner, and never
deletes local workspace data. Resource exhaustion remains failure. Host and gate
observers retain the upstream bounded telemetry/head/tail behavior. Retention
never uploads a general target or cache directory. The four original bootstrap
outputs enumerated by `sdk-bootstrap-retention.mjs` are copied separately for
the source part, each with that module's 64 MiB per-original bound.

The command wrapper retains its actual status, preserving a nonzero command
status even if writing status fails. Collection retains original raw part JSON
and diagnostics on failure, but only exposes a part acceptance artifact after
successful status, exact record identity and post-command clean-source checks.
The final source checkout runs the original assembler tests and
`vv-assemble.mjs` over a fresh exact-eight-record directory and fresh output.
The unchanged assembler owns canonical record validation, same-source binding,
all-fifteen-gate coverage and the final completion line.

## Verification performed

1. RED: the initial seven orchestration tests failed explicitly because the new
   full-source helper was missing. GREEN: implemented wrapper/helper and then
   exercised real restoration and fake expensive gate boundaries.
2. Final `python3 -m unittest scripts/numeric/tests/test_full_source_vv.py`:
   **10 passed**, 34.542 seconds. Real independent shared-object clones of the
   clean upstream fixture were restored without modifying that fixture. Cases
   cover exact reviewed metadata/history; wrong revision and dirty source;
   byte-preserving successful retention; exit37 failure with raw record retained
   but no acceptance artifact; post-command drift; wrong part/revision/status;
   all-eight matrix/deadline/command/environment topology; real upstream
   assembler rejection of missing/mismatched records and preexisting output;
   image config-vs-tag distinction and secret-free selective retention; and
   rejection of wrong architecture, zero/oversized shm, and missing socket.
   The upstream `node --test scripts/vv-assemble.test.mjs` runs inside that suite
   against the restored candidate. Synthetic gate records are test fixtures,
   never evidence of completed VV.
3. `npm test`: **133 passed**, no failures/skips, 9.461 seconds.
4. `/tmp/actionlint .github/workflows/prismpm-backport-full-validation.yml`:
   passed using actionlint v1.7.7 downloaded outside the worktree.
5. YAML parsing and structural checks: all three jobs exist; all eight matrix
   values exist; each job has an isolated exact-base full-history source
   checkout; every remote action reference is a 40-character pin. Passed.
6. `python3 -m py_compile scripts/numeric/full-source-vv.py scripts/numeric/tests/test_full_source_vv.py`:
   passed. `git diff --cached --check`: passed before the implementation commit.
7. Broad `python3 -m unittest discover -s scripts/numeric/tests -p 'test_*.py'`:
   **33 passed, 2 known existing fixture-binding failures**, 48.031 seconds.
   Both are in `test_build.BuildInputsTest`:
   `test_missing_corpus_is_generated_before_actual_collector` and
   `test_newer_stale_result_cannot_replace_successful_invocation`. Both fail at
   `collect.py`'s `src/Float.lex.tex` receipt hash check: the historical retained
   fixture binds the earlier source while paused B2 has current source edits.
   The controller confirmed these failures and already authorized their separate
   historical-fixture adaptation on B2 resume. This task does not alter either
   that source or frozen evidence to fix them.
8. `/workspace/scratch/prismpm-numeric` remained clean after verification.

Final author review checked the workflow/helper/test/doc contract as a separate
pass. No subagents were started, as instructed. Independent controller review
and publication remain pending. There are no deferred minor implementation
findings from this pass.

## Remaining limits

No full image build/pull or original VV gate ran locally. Worker disk/RAM/network
sufficiency, actual source-image identities, full source results and all eight
assembled acceptance records remain pending CI. A successful source workflow
does not substitute for unchanged-d6 default/Released/candidate acquisition,
retained-reader/corruption/refusal and authority-control integration; the existing
installed-SDK diagnostics/recovery workflows remain independent and unchanged.
No full product/OCI qualification or production admission is claimed.
