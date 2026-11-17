# Reviewed native golden source capture

This independent diagnostic snapshot restores PrismPM commit
`881df278923ff271fc179703e55ea91c45f2394d`, tree
`ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4`, from upstream base
`3666dc0f9da56fcf066d96ec01cd9e14ec9a2974`. The complete bundle preserves the
original commit objects and `numeric-export-backport` transport branch. The
binary patch is the exact `git diff --binary --full-index --no-ext-diff
--no-textconv --no-renames BASE REVISION` output. `manifest.json` binds both
transport hashes; the game adapter additionally pins its manifest hash.

The capture was made using a private bare repository and read-only source object
alternates. Authentication/restoration was checked in one disposable dedicated
checkout with the unchanged `../restore-prismpm-candidate.py`. No source branch,
index or original owner/workflow/lock bytes were changed. Historical
`../prismpm-candidate` and `../prismpm-preparation-candidate` remain separate.

This source contains the independently reviewed shared golden import and the
original native owner with its complete 19-test helper inventory. Later source
capture/test integrations are separate revisions. Before importing these native
records into a later source revision, independently verify generator, owner and
shared-baseline continuity. A run at this capture must keep this revision as
its source identity.

The hosted workflow uses the unchanged development-only SDK index
`sha256:42213da87c564d859e327ab7df2459357d674fa538050f13905caa24c352588e`
and environment revision `6ebbef86a300ff4490c4c37f821e50585e211481`, with both
architecture locks retained byte-for-byte. The original native owner still owns
its 12 GiB reserve plus measured compressed image payload, 22 dependency controls,
38 seed controls, resource/cache/command bounds and authenticated cleanup.
This is not original-d6 SDK admission.

## Orchestration custody contract

`../native-golden-preparation.py` admits only the `prepare` and `collect` CLI
phases, each with explicit `--source`, `--snapshot`, `--evidence`, `--output` and
`--lane` operands. Paths must be absolute and unaliased; source, native output
and sibling orchestration evidence are separate. `prepare` requires a fresh
wrapper evidence directory and absent native owner output, checks actual
nonroot source ownership, and invokes the unchanged immutable restorer. It writes
an incomplete public envelope before the original helper can execute. The
workflow then executes exactly:

```sh
node scripts/native-golden.mjs tests
node scripts/native-golden.mjs run "$SOURCE_REVISION" "$RUNNER_TEMP/native-golden"
```

The original `ci-observe.mjs run` supervises each command without filtering its
arguments, and the original observer also monitors the whole generation. The
workflow propagates each original exit code, always stops observation, always
collects and always uploads both complete original trees. Both raw owner and
wrapper/observer artifacts use compression level 6 and 14-day retention.

`orchestration.json` is the closed
`cs1618/prismpm-native-golden-orchestration/1` envelope. It has exactly these keys:

- `schema`: that exact schema string.
- `status`: only `incomplete` or `complete-review-required`.
- `diagnostic_only`: always JSON `true`.
- `game`: `server_url`, `repository`, `sha`, `workflow_ref`, `workflow_sha`,
  `event`, `ref`, `run_id`, `run_attempt`, `run_url`. These come from the genuine
  GitHub context. The repository, numeric-kernels branch and workflow are fixed;
  execution/workflow commits are 40 lowercase hex characters, run numbers are
  positive decimal strings of at most 20 digits. The actual game checkout HEAD,
  remote authority and executed helper/workflow bytes are independently checked.
- `source`: `repository`, `base`, `revision`, `tree`, `bundle_sha256`,
  `patch_sha256`, `snapshot_manifest_sha256`, `restoration_receipt_sha256`.
  Source authority is the fixed capture above, separate from the actual game
  execution SHA. The unchanged restorer receipt is retained as original bytes.
- `runner`: `os`, `architecture`, `environment`, `lane`, `image_os`,
  `image_version`. Only real hosted Linux X64/amd64 or ARM64/arm64 lane joins
  complete. Unavailable optional runner image labels remain JSON `null`;
  available labels are at most 256 characters without control characters.
- `inputs`: sorted exact `{path,bytes,sha256}` rows, measured before and after.
  The six original inputs are `scripts/native-golden.mjs`,
  `scripts/native-golden.test.mjs`, `.github/workflows/native-golden.yml`,
  `scripts/ci-observe.mjs`, `sdk/golden-development-amd64.lock.json` and
  `sdk/golden-development.lock.json`, under the `source/` namespace. Each is
  compared against the captured Git object. The immutable restoration helper is
  separately named `game/restore-prismpm-candidate.py` and hash-pinned.
- `commands`: ordered observed `{name,argv,exit_code,diagnostic_path,log_complete}`
  rows for `native-helper-tests` and `native-owner-run`. Exit codes are integers
  from 0 through 255. Completion requires both exact argv arrays, zero exits,
  original completed gate results, successful observer stop results and full
  untruncated original logs. Failure observations remain in this array when
  available, even though they cannot make the envelope complete.
- `owner`: `review_path`, `review_sha256`, `source_revision`, `run_id`,
  `run_attempt`, `platform`, `records`. The original native review must retain
  its unchanged schema, `review-required` status and unclaimed assertions. Its
  exact source/run/attempt/native basis, environment lock/OCI chain and loaded
  image identities must join. The three raw records are exact
  `{path,bytes,sha256}` rows, checked against the original review and source
  profile, without parsing/reserializing their bytes.
- `files`: sorted complete retained `{path,bytes,sha256}` rows for original
  owner output and wrapper/observer evidence. The public envelope excludes
  itself to avoid self-hashing. `owner/` names correspond to the native-golden
  artifact root; `evidence/` names correspond to the native-orchestration
  artifact root. Both artifacts are required together.
- `error`: JSON `null` only for completion; otherwise a nonempty failure string
  bounded to 2048 characters, without control characters.

Unknown/duplicate preparation fields, stale transport/input identities,
missing/extra evidence, symlinks, hard-link aliases, special files, failed
observation and truncated required logs refuse completion. Initially unobserved
`source`, `owner` and `inputs` are JSON `null`, and `commands`/`files` are empty.
The collector atomically resets the public status to incomplete before reading
sidecars, so an earlier complete label cannot survive a failed retry.

Each inventory traversal retains the original bounds: depth at most 32,
20,000 entries, 1 GiB aggregate and 128 MiB per regular file. Observer evidence
retains its original 8 MiB telemetry, 16 KiB sample, 32 MiB log head and 1 MiB
rotating tail bounds; any required log truncation remains incomplete. File byte
lengths are nonnegative integers, and SHA-256 values are lowercase hex strings.
The collector reads selected `build_id` and `attestation_id` from the original
raw golden record and requires `generated/build/<build_id>/manifest.json` and
`generated/verified/<attestation_id>/manifest.json`. It compares all generated
build/verified files against the whole original source `.prism` trees, including
other products, and checks contiguous original command records and streams.
Both actor creation responses must join exact names/CIDs/ownership labels and
networks to their authenticated four-command cleanup blocks: inspect, owned-CID
removal, absent-CID inspect and absent-name inspect. Acquisition retirement must
precede offline creation. Both unchanged golden writer/readback commands must
join the offline actor, followed by the exact final source checks and offline
cleanup; the final absent-name inspect must be the transcript endpoint. Separate
read-only staged/unstaged `--no-renames` inventories and untracked paths permit only the
exact three records in the selected native profile. The original index and
objects are not written during collection.

The raw record names are `golden-manifest.json`,
`verified/lexlean-attestation.json` and `verified/manifest.json`, under
`tests/golden/native/linux-ARCH-ubuntu-24.04/`. Each architecture contributes
three originals; the two hosted lanes must produce six in total for review.

A successful wrapper label establishes evidence completeness only. Structural
fixture controls do not establish actual hosted/native qualification. Failures
retain available original products, logs and incomplete provenance; invalid or
oversized members prevent a complete inventory but are not silently filtered
from the workflow upload. Runner cancellation, timeout or a failed artifact
service can still interrupt collection/upload and require another reviewed run.
No snapshot, artifact existence or complete label accepts a baseline, SDK or
product, and none authorizes an upstream push or publication.
