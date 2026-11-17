# B1 full validation: supported source/installed-SDK split

Correction from actual run44002718718: the source wrapper must not globally export `CARGO_BUILD_JOBS`. The original run did so and failed au-07; this corrected recipe preserves that failure and the owner guard. The game workflow correction remains queued for the final reviewed source refresh.

Read-only inspection of upstream `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`; no gate or Docker pull was run. Freeze the final reviewed upstream revision before executing this recipe. The ongoing exact-d6 focused job `43986399997` covers three ho-11 acquisitions, retained readers and authority controls only; it is not full upstream acceptance.

## Smallest complete supported set

1. Run **all eight unchanged upstream VV parts** on the same clean source revision in the pinned **source development container**, with the unchanged d6 image supplied as the external SDK oracle. Assemble all eight original part records with the existing assembler.
2. Separately require the same-new-binary default/Released/candidate acquisition and retained-file controls in the unchanged d6 installed SDK, as specified in `backport-authority-report.md` and the controller's game harness. Keep the original installed CLI/inventory/seed and absolute new verifier identities separate.

No source part may be silently omitted, converted to an installed-SDK success, or substituted by the focused B1 tests. Full product/OCI candidate qualification remains separately reserved.

### Why an installed-d6-only full VV recipe is invalid

- `xtask/src/main.rs::run_vv_gates_1_to_5` explicitly runs `sdk/platform-lock.integration.mjs` with a freshly built CLI against **synthetic** two-platform inventories. Its comment identifies the source-bootstrap environment as necessary: installed SDK inventory admission correctly rejects these inventories. Unsetting an environment variable does not disable the immutable installed inventory. Do not remove, mask or override it.
- `scripts/sdk-vv-run.mjs::runInstalled` requires `/opt/prismpm/share/vv-input-policy.json.source_revision == revision` and materializes the image-owned source closure. The old d6 image therefore cannot accept the new B1 revision via this interface. Running that wrapper at the old revision would validate the old source, not B1. Do not edit the policy or relabel its source.
- `scripts/vv.sh` supports an existing exact `PRISMPM_TEST_SDK_IMAGE`. Supplying d6 prevents its otherwise automatic local SDK build/push. This is an SDK **oracle** selector, not the compiler-source selector.

## Source environment and unchanged commands

Use `.devcontainer/devcontainer.json` and its `.devcontainer/Dockerfile` **development** target from the captured source, following `.github/workflows/vv.yml` and the existing devcontainer-cache action. Use native Linux amd64, original initializer/exec launcher, UID 1000, writable owned workspace and caches, and working Docker socket access. This constructs/reuses the source tool environment, not a new SDK. No independently verified prebuilt source-container digest was supplied in this task; record the actual image/config identity and Dockerfile/source inputs if a cached image is reused.

The source recipe has exact Rust 1.97.1 and Lean 4.32.1, Node 22.23.2, Elan proxies, three pinned browser engines, Rust native/musl/Wasm targets, native libraries and the complete oracle/compiler/package tooling. Base inputs include Debian bookworm-slim `sha256:88200866dfff7ea7f5cbcb6ec7c8a701889efe6fe859fe64d6990e4b07ea4171`, Rust tool stage `sha256:0e2bcaef56d041a486784e54104a81aebe0da44bd03019bd70bc0401e42e4a97`, and Playwright v1.62.1 `sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`; use the complete checked-in Dockerfile, not a hand-selected subset of components.

Required acquisition before offline gates:

- Full Git history including bootstrap source tree `f378fd3a8dc5711cb4b22cec9ee2f874353628c3` (`fetch-depth: 0`, or independently supplied verified Git objects). A shallow B1 bundle lacking that tree is insufficient. Run `bash scripts/bootstrap-verify.sh --check-source` and require its availability message.
- Existing `bash scripts/fetch.sh` prepares locked workspace/LexLean/oracle Cargo inputs, RustSec data, immutable Zot/BuildKit images and the prior 0.2.0 archive. Its archive SHA must be `f3dd999f5618db154fa06222a06f9de95d86e1dbf683954426ea91c974cbe24c`. If using transported caches instead, retain their real identities and satisfy those same checks; `cargo deny --frozen` must have its genuine advisory database. No fake advisory scan or policy relaxation.
- The exact d6 image must already be present in the same daemon used by the gates, together with required locked oracle/fixture images. Native Docker, buildx/buildkit, owned local registries and local-container connectivity are exercised by the gates; ordinary `--network=none` without that infrastructure is insufficient. The OCI tests may build their explicitly synthetic transport fixtures; they do not build/promote an SDK when d6 is supplied.
- Use a fresh source environment without inherited `CARGO_PROFILE_*`, `RUSTFLAGS`, `CARGO_ENCODED_RUSTFLAGS`, compiler wrappers, `NODE_OPTIONS`, or shell injection variables. Private compiler owners reject unowned overrides. Do not globally carry the local diagnostic `CARGO_PROFILE_DEV_DEBUG=0`/`CARGO_PROFILE_TEST_DEBUG=0` into VV. Do not globally export `CARGO_BUILD_JOBS`: actual run44002718718 confirmed that the OSCAL owner refuses inherited `CARGO_BUILD_*` settings. Its independently owned internal Cargo settings remain unchanged. Offline Cargo is retained; each owner controls its own build environment.
- Use `umask 022`. Keep real `/dev/shm` tmpfs at positive capacity <=1 GiB (e.g. `--shm-size=1g`); original seed tests explicitly use it and reject an unbounded/wrong filesystem. Keep general build targets on disk. The installed full-VV harness uses a **5 GiB `/tmp` tmpfs**, whereas dedicated exporter construction must use a separate tmpfs <=1 GiB; do not assume the focused job's 1 GiB general `/tmp` can hold source-bootstrap compilation. The existing source-devcontainer filesystem layout is the normative source baseline. Browser processes require writable HOME/cache and all three engines.

Run each matrix value in its own clean source checkout/container/job, with the same commit and acquired inputs. Do not run different VV parts concurrently in one checkout: each can build/retain significant owned artifacts. These are the existing public commands (the prefix is the supported oracle/resource environment):

```bash
set -euo pipefail
umask 022
export PRISMPM_TEST_SDK_IMAGE=ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c
export CARGO_NET_OFFLINE=true
bash scripts/bootstrap-verify.sh --check-source
# One of these eight per isolated job; require all eight overall:
just vv-part source
just vv-part gates
just vv-part conformance
just vv-part ho-oc
just vv-part st-sy
just vv-part dk-0-1
just vv-part dk-2
just vv-part dk-3
```

For bounded diagnostics, the unchanged workflow wraps the single selected command:

```bash
node scripts/ci-observe.mjs run target/ci-diagnostics/vv -- just vv-part "$part"
```

`just vv-part` calls `scripts/vv.sh`, which always runs the browser launch/evaluation preflight, devcontainer/reconciliation/runtime-stack tests and bootstrap-source preflight before invoking `cargo xtask vv-part`. Do not invoke raw cargo to omit those preflights. Avoid the redundant outer `--with-sdk` wrapper when d6 is already explicitly supplied.

Coverage, without manually re-listing or duplicating subcommands:

| Part | Existing owned coverage |
| --- | --- |
| `source` | Gates 1–5: full authored formatting closure, generated model/diagnostic/docs, SPEC bijection, source/error/unsafe/dependency/generated audits and Node regressions, historical bootstrap, exact SDK runtime boundary and OCI metadata/update fixtures, workspace/all-target/all-feature Clippy `-D warnings`; gate 6 workspace tests excluding repo-conformance. |
| `gates` | Gates 7–15: fixtures + Holo codec oracle, generated Lean/replay/axiom audit, LexLean format/lock and Prism check/build/verify, reviewed native golden bytes, named exports/coverage/Rust execution, two-root reproducibility, real upstream corpora/registry/runtime, `cargo deny --frozen --all-features check`, stdlib/package/downstream API. |
| Remaining six | Complete repo-conformance partition, with exact-one ownership checked against registered test names. `dk-3` includes DK-39 and its ten named B1 authority controls. The generic `conformance` part runs tests not owned by the five named HO/OC/ST/SY/DK partitions. |

This full set subsumes the three fast-PR jobs; separate format/lint/validate/fixtures/golden reruns are unnecessary after all parts pass. `cargo xtask validate` alone is only model/SPEC/audit coverage, not VV. Native golden, generator-lock or package-byte drift must remain a real failure for review; never use `--write`, change fixtures or regenerate goldens merely to obtain acceptance.

## Completion evidence and assembly

Each command must exit zero **and** produce fresh original `target/vv-part-PART.json`, schema `prismpm/vv-part/1`, exact source commit, exact part, status `passed`. Its completion line is `VV part PART PASSED for commit COMMIT.` The gate deletes old result files before running and requires a clean worktree before/after. Preserve original JSON bytes plus command status; log tails alone are not acceptance.

Copy the eight original JSON files, with their original filenames, to a fresh aggregate directory containing only those files. From the same source revision:

```bash
node --test scripts/vv-assemble.test.mjs
node scripts/vv-assemble.mjs target/vv-parts target/vv-evidence.json "$SOURCE_REVISION"
```

The output file must not already exist. Require `All 8 V&V parts and 15 gates PASSED for commit COMMIT.` and canonical `prismpm/vv-evidence/1` with that commit, gates `[1,...,15]`, status `passed`. For source part also retain the real bootstrap evidence outputs (`scripts/sdk-bootstrap-retention.mjs` enumerates them); the source gate prints `bootstrap SDK 0.2.0 verified compatibility content; current production semantic identity ...`. Image/source/host identities must be recorded externally; VV records alone do not establish them.

The independent exact-d6 B1 job must still require the explicit marker `retained backport projects: 3 independently bound; candidate mutation corpus rejected`, actual default/Released `sdk-seed` vs candidate `source-backport` receipts, and the ten authority tests, plus required corruption/refusal controls. Full VV uses the default Released path; it cannot substitute for this opt-in candidate integration.

## Time, disk and log bounds supported by repository evidence

- `.github/workflows/vv.yml`: each of eight jobs has a **360-minute** deadline. The repository explicitly states a monolithic full run exceeds one hosted job's six-hour/time and disk budget. Do not launch a single unpartitioned full VV in the current ~22 GiB-free local workspace.
- The same workflow reports a prior combined conformance run falling from **107 GiB free to under 10 GiB**; OC-10 capture itself requires **10 GiB free** (`scripts/conditional-capture-sdk.py`). Use dedicated sufficiently provisioned workers/owned daemon storage, measure free space continuously, and treat resource exhaustion as failure. Eight-way splitting is the existing response; lowering capture bounds or deleting live artifacts is not.
- Fast PR measurements are 16–22 minutes lint, 30–34 minutes model/audits, and about 30 minutes fixtures/goldens (40/50/50-minute job ceilings). Those are historical source-container observations, not predictions for B1 full parts or d6 image transfer. Source-container image-cache job has a 240-minute ceiling in full VV.
- `ci-observe.mjs` caps each observer at six hours/721 samples, 8 MiB telemetry, 32 MiB log head and 1 MiB tail. Retain command exit status and original part records even when output is truncated. A host observer plus gate observer roughly doubles those diagnostic caps. Current failed local audit log is ~381 kB, but that failed early run gives no complete-suite size estimate.
- No reviewed peak RAM bound for all VV parts was found. Browser/tmpfs/parallel compiler/owned Docker loads vary; two Cargo jobs does not cap all tests or daemon memory. Record actual memory/oom/disk telemetry and honor existing gate deadlines instead of inventing a smaller acceptance resource profile.

The remaining prerequisite is provisioning the supported source-bootstrap workers and their full verified inputs. This recipe does not claim that focused CI, local component tests, or the old image-owned VV source has completed that work.
