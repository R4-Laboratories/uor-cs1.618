# Exact backport source validation

`.github/workflows/prismpm-backport-full-validation.yml` is manually dispatchable
and runs on a `numeric-kernels` push that changes its orchestration or captured
candidate inputs. Publishing this workflow does not assert that VV has passed.
The eight source jobs and their final assembly must actually complete in CI.

Each worker checks out the full history of `UOR-Foundation/prismpm` at
`3666dc0f9da56fcf066d96ec01cd9e14ec9a2974`, restores the retained bundle with
`restore-prismpm-candidate.py`, and independently requires candidate
`2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`, tree
`3d4838633c80fb754b33f466c25ef0962057e2fd`, the captured bundle/patch hashes,
a clean worktree, and the original historical-bootstrap availability preflight.
The game checkout remains separate. No authored upstream file is patched or
given a game harness file.

The source development container uses the candidate's unchanged `.devcontainer`
definition, initializer, non-root exec launcher and postCreate fetch. The pinned
upstream devcontainers action supports the `subFolder`, `env`, `inheritEnv`, and
UID-update inputs used here. The cache action retains upstream buildx/action
pins and hashes `prismpm/.devcontainer/**` at its actual checkout location;
`push: never` prohibits publishing a source image. Retained image metadata
distinguishes local config digests, optional distribution digests, and tags.

An independent checkout/container/job runs each original part: `source`, `gates`,
`conformance`, `ho-oc`, `st-sy`, `dk-0-1`, `dk-2`, `dk-3`. Matrix fail-fast is off.
The image job retains the original 240-minute ceiling; each VV job retains
360 minutes. Hosted-runner disk cleanup is restricted to disposable preinstalled
tools and explicitly requires a GitHub-hosted runner. Existing bounded host and
gate observers retain disk, memory, OOM and command diagnostics. No target or
Cargo-cache tree is uploaded.

Every worker pulls the unchanged exact d6 SDK oracle into the host daemon:

```
ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c
```

The original source container mounts that daemon's Docker socket. The oracle is
passed as `PRISMPM_TEST_SDK_IMAGE`; this prevents the otherwise automatic SDK
build. The selected command remains:

```sh
export CARGO_BUILD_JOBS=2 CARGO_NET_OFFLINE=true
bash scripts/bootstrap-verify.sh --check-source
node scripts/ci-observe.mjs run target/ci-diagnostics/vv -- just vv-part "$PRISMPM_VV_PART"
```

Offline mode begins only after postCreate's unchanged `scripts/fetch.sh` has
finished. Environment inheritance is disabled, and exported unowned compiler
profile, compiler-wrapper, Node and shell-injection variables are rejected.
No focused local diagnostic profile override is passed to VV. The original
source filesystem baseline is retained, including disk-backed build outputs and
the default positive bounded `/dev/shm`; its actual configured size is checked.

`full-source-vv.py collect` first preserves bounded raw diagnostics, command
status, any original part JSON, and the four source-bootstrap outputs when
present. It then requires the exact source identity and a clean tree, successful
command status, and a correctly bound passed record. Only then can that original
record be uploaded in a part-acceptance artifact. Failed commands retain their
original exit code and raw record separately; no success record is synthesized.

The final job restores the same source, downloads only successful part artifacts
into a fresh directory, and runs the original assembler tests and assembler.
The assembler requires exactly eight original canonical records, one source
revision, all fifteen gates, and a fresh output file. A green `complete` job
therefore means the source VV set passed. It does not establish the separately
required candidate/default/Released integration in installed d6, production
admission, or full product/OCI qualification. The existing installed-SDK
diagnostics and recovery workflows remain independent.

Local orchestration verification uses an existing full-history source fixture:

```sh
PRISMPM_TEST_SOURCE=/path/to/prismpm-checkout \
  python3 -m unittest scripts/numeric/tests/test_full_source_vv.py
```

The fixture is never modified: tests create independent shared-object clones,
exercise real bundle restoration and upstream assembly, and substitute only the
expensive gate command/daemon boundary. Their synthetic passed records are test
fixtures, not validation evidence. These tests do not pull Docker images or run
full VV. CI execution, resource sufficiency and actual gate outcomes remain
pending until the workflow runs.
