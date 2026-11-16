# Diagnostic helper repair report

Status: implemented and locally validated; real pinned-SDK CI execution remains pending.

Commit: `37762ee` — `Preserve compiler diagnostic failures and original SDK tools`.

Base: `1b8589fcc92f8790f34042e41fc07371756febc1`, branch `numeric-kernels`.

## Evidence and diagnosis

Read the two diagnostic shell scripts, diagnostic workflow, supplied brief, the actual preparation log from CI run `43970122933`, and the restored source's focused/full gate scripts. The preparation log contains only five successful archive checksum checks. It contains no failed-command trace, so the original CI failure's exact command is **not observed**.

The old helper nevertheless has a concrete invalid assumption: it requires `$CARGO_HOME/bin/wasm-tools`, whereas the supplied SDK layout places the PATH executable at `/usr/local/cargo/bin/wasm-tools` independently of its Cargo cache root. An isolated execution of the original helper with separate executable/cache roots reproduces failure after the five mocked checksum checks; it does not reach the dependency-preparation sentinel. This establishes the faulty assumption in the reproduction, not the exact cause of the historical CI failure.

The original wrapper also runs supplemental tool preparation before compiler preflight and focused validation. A mock execution of that original wrapper shows `cargo-fetch`, `cargo-install`, and helper preparation running before the compiler fails; the wrapper returns `1` rather than the compiler's actual `31` and provides no final identity/archive evidence.

## Changes

- Capture original `wasm-tools` with `command -v` and canonicalize with `readlink -f` before wrapper PATH changes. Validate executable permission, record canonical path and SHA-256, and include it in the original SDK identities.
- The helper independently resolves PATH before its environment changes, compares that canonical file with the wrapper's captured identity, and symlinks that exact original tool into its isolated Cargo home. Cache-directory symlinks remain independent. No compiler/tool substitution or writes to original SDK compiler/bin files were introduced.
- Add inherited `ERR` diagnostics showing stage, script, line, exit status, and command. Helper stages identify resolution, downloads, extraction, TypeScript, Cargo isolation, dependency preparation, browser preparation, and identity recording.
- Run compiler preflight first, with its own log and exact exit-code file. Compiler failure stops fetch/focused/supplemental/full source work. After the locked fetch required by focused offline Cargo builds, run focused validation with its own log and exit-code file before ripgrep and supplemental tools.
- A focused failure remains a workflow failure while allowing subsequent diagnostic gates. The existing full source script still runs after successful preparation, including its deliberate second focused run. Its gate set was not edited or shortened.
- Add an EXIT finalizer that attempts generated-output archiving, original lock/SDK/tool identity verification, and helper-cache hashing even on setup failure. Every cleanup step is attempted. Cleanup failures fail a previously successful invocation and cannot replace an existing nonzero result. Intermediate failures in the sourced helper remain under active errexit.
- Workflow records the actual Docker and tee exit statuses separately, preserving a Docker failure when both fail and failing on log capture errors when Docker succeeds.
- Add a targeted executable mock harness under `scripts/numeric/`. It runs the actual shell files inside temporary mount/network namespaces with fake SDK/download commands; original-file hashing and generated archive creation are real. It requires Linux, bubblewrap, and unprivileged namespaces.

All original helper SHA/SRI checks, dependency pins, real Playwright Chromium launch, helper version/file identities, SDK image digest, upstream revision, lockfile protection, and full source gate invocation remain. No candidate/upstream source files or compiler repairs were edited.

## Actual validation

`bash -n scripts/numeric/check-compiler-source-stage.sh scripts/numeric/prepare-compiler-test-tools.sh` passed.

`python3 scripts/numeric/test-compiler-source-diagnostics.py` passed all 15 scenarios:

| Scenario | Observed exit |
| --- | ---: |
| Compiler failure stops downstream work | 31 |
| Setup failure preserves focused output and original setup status | 43 |
| Focused failure evidence survives later setup failure | 43; focused file records 27 |
| Focused failure survives successful broader gates | 27 |
| Broader gate failure retained | 35 |
| Successful wrapper execution | 0 |
| Lock-check cleanup failure fails prior success | 1 |
| Original SDK tool mutation detected | 1 |
| Cleanup failure preserves prior setup failure | 43 |
| Archive failure still permits identity/cache checks | 66 |
| Archive failure preserves prior setup failure | 43 |
| PATH executable with separate cache root | 58 sentinel reached |
| PATH symlink canonicalization | 58 sentinel reached |
| Cache-home decoy ignored in favor of PATH tool | 58 sentinel reached |
| Missing original PATH executable fails before downloads | 1 |

The wrapper checks include exact focused/full/final exit-code evidence, generated archive contents, active sourced-helper errexit, retained helper-cache hashes, and final lock/tool hash checks. The real-helper tests deliberately stop at the first Cargo dependency command with sentinel `58`, after isolated-home creation; they do not simulate a successful browser/tool installation.

Parsed the workflow with installed PyYAML and ran `bash -n` on every workflow run block: passed. Executed its actual container run block with local fake Docker/tee commands in four combinations: `(Docker, tee) -> workflow` was `(0,0)->0`, `(43,0)->43`, `(0,76)->76`, and `(43,76)->43`; both status files matched in each case.

`git diff --check` passed. The original-wrapper and original-helper negative reproductions failed as expected before the repair was accepted.

## Limits and next evidence

No SDK image was downloaded locally, no actual compiler/focused/full source gates were run, and no real supplemental downloads or browser launch were performed. The mocks establish wrapper control flow, command resolution, retention, and exit-status behavior; they do not establish compiler correctness or upstream gate success. Real pinned-SDK CI is still required, and may reveal source or additional environmental failures. A hard process/container kill cannot run a shell EXIT trap.

No push, PR, publication, or workflow dispatch was performed. Other agents' untracked research/evidence files were left out of the scoped commit. This requested report lives in the ignored `.superpowers` work area and is not force-added to the repository.
