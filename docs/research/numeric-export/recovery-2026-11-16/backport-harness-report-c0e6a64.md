# Harness round2 implementation report

Local implementation commit: `ea7a49a` (`fix(numeric): share diagnostic root and bound retained evidence`), based on `87bd5cc`. Seven owned diagnostic workflow/script/test files committed. This report is ignored and was not force-added. No push, SDK pull/run, full historical artifact download, source-authority changes, arithmetic edits, or subagents. Other paused-agent modifications and the recovery working directory were not touched or staged. Free workspace space remains21GiB, above the8GiB minimum.

Read the round2 brief, original brief/review and prior fix report; inspected `/workspace/diagnostic-tools/b1-ci-43986399997-failed.log`. The actual log contains host `tee: evidence/run.log: Permission denied`, the explicit reader marker at00:42:10, then permission failures writing the host container status and generated diff. That marker alone does not prove the container's final status, authority controls or final identities, which remain unread until recovery executes.

## Shared evidence root

The acquisition workflow now chowns only `prismpm` toUID1000. Evidence remains host-owned, gets group1000 and mode2770. It is not world writable/traversable. The host writes and reads a top-level probe, a separate invocation of the unchanged SDK entrypoint asUID1000 reads that host probe and writes/reads its own probe, and the host reads the container probe before the verifier build starts. The permissions-only invocation does not leave a misleading successful runner status. The real invocation repeats the container check. Host status-file write errors preserve the earlier container or tee nonzero status, failing prior success if needed. SDK digest, inventory, entrypoint and resource isolation are unchanged.

## Bounded complete reader inputs and small logs

New `retain-backport-evidence.py` retains the three result JSONs, SDKlocks, stderr files, and **every** file/directory in each JSON-selected `.prism/build/{build_id}` and `{verified_root}` tree, including hidden/nested/binary files and original modes. It excludes unrelated `.lake`/other compilation caches and never writes raw projects. Required paths are validated; selected symlinks, hardlinks, special files and traversal are refused. Missing/invalid JSON uses bounded available `.prism/build`/`.prism/verified` failure-state retention and explicitly reports incompleteness. Missing locks/JSONs/required nonempty trees also fail cleanup. Original verifier failures remain authoritative.

Complete archive: `retained-reader-inputs.tar.gz`, cap31MiB compressed and256MiB raw, with entry-count and manifest-size limits. Oversize or unsafe input removes the temporary complete archive and reports failure rather than uploading a misleading truncated reader fixture. `retention-status.json` and `reader-input-manifest.json` state completeness and limits. For unavailable full trees, the small evidence also includes exact three result JSONs/locks with original modes in the explicitly partial `retained-reader-basics.tar.gz` (each basic file <=1MiB), plus bounded selected manifest summaries. Complete-reader claims are never inferred from basics or summaries.

Small logs are copied from an explicit allowlist into a separate generated directory with24MiB total input budget; status, recovery metadata and JSON/lock basics have priority. Oversize available logs are listed as omitted and make the preparation step fail. Status adds only small metadata overhead, keeping each log artifact below32MiB. The workflow uploads explicit known small-log files and the complete archive as a separate artifact; it never traverses raw private projects. Recovery uploads original logs and recovery summaries as separate small artifacts, each with its own24MiB budget.

## Fixed historical recovery

New `.github/workflows/prismpm-backport-recovery.yml` is manual/push-on-specific-recovery-path only, with `contents:read` and `actions:read`. Before download, the helper validates API run43986399997/head`022c11363fd3a1b1c6871991f32ab02994515a7e`/repository and artifact14288310173/name`prismpm-backport-43986399997`/size1336947756/digest`sha256:20100b809e5b0994703f681dc1c4cf751dda4f50e1d784ec8d65a7ac792a0fa9`/expiry/associated run+head, plus an unambiguous name-to-ID listing. Metadata failures stop download and retain expected source/error metadata.

Download uses the specified pinned `actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093`, explicit artifact ID14288310173, fixed run ID and `github.token`; no mutable latest selection. It downloads on the hosted worker. The Python helper scans `retained-projects.tar.gz` twice with streaming tar readers and never extracts caches or follows links. First pass obtains bounded JSON/lock basics; second pass writes complete selected reader trees under the same bounds and emits useful partial basics/summaries on oversize. The original full artifact remains retained. This is recovery only, not SDK rerun or receipt rewriting.

Digest limitation is explicit in recovery metadata: the API digest must match the recorded digest; the pinned download action performs a digest comparison but emits only a warning on mismatch. Its extraction does not expose original ZIP bytes here, so no independently recomputed ZIP SHA256 is claimed. Inspected the pinned action source to confirm this behavior and that name/artifact-ids cannot both be supplied; workflow uses fixed artifact-ids after API name validation. No token/header values are logged by the metadata helper.

## Commands and results

Final post-commit checks:

```text
python3 scripts/numeric/tests/test_backport_retention.py
Ran 18 tests in 1.262s
OK

ACTIONS_GLOB_MODULE=/tmp/backport-upload-glob.mkN41A/node_modules/@actions/glob \
  node scripts/numeric/tests/check-backport-upload-glob.cjs
PASS: 30 diagnostic/recovery upload selections; 0 private project reads
PASS: old broad evidence/ selection fails EACCES negative control

bash -n scripts/numeric/check-prismpm-backport.sh
exit0

Python ast.parse for both new helpers
PASS Python syntax: retain-backport-evidence.py
PASS Python syntax: recover-backport-artifact.py

yaml.safe_load + bash -n for every embedded run command in both workflows
PASS YAML and embedded Bash: .github/workflows/prismpm-backport-recovery.yml
PASS YAML and embedded Bash: .github/workflows/prismpm-backport-diagnostics.yml

git diff --check
exit0, no output

git check-ignore .superpowers/sdd/numeric-kernels/backport-harness-round2-report.md
.superpowers/sdd/numeric-kernels/backport-harness-round2-report.md

df -h /workspace
overlay 32G 9.4G 21G 32% /
```

The18 tests retain the prior7 finalizer checks, updated to the exact compact layout, and add full-byte/mode comparisons for local retention and real streaming tar recovery, hidden/nested binary members,3MiB irrelevant cache exclusion under a4KiB reader budget, missing/invalid result failure retention, missing required trees, selected links/hardlinks/traversal refusal, raw/compressed bounds with exact JSON/lock basics, bounded small logs, actual localUID1000 permissions-only script execution, host docker/tee/status-writer status preservation, and metadata negative controls (wrong ID/name/digest/size/head/expiry/ambiguous listing). Streaming recovery tests replace `extractall` with a hard failure to prove no extraction path is used.

The glob check is now a committed focused Node test. It uses the same `@actions/glob`0.5.0 pinned by the upload action, installed only in `/tmp` during round1, and the action's actual options (`implicitDescendants:true`, symbolic-link follow enabled, hidden files included). All acquisition/recovery upload paths are tested against an injected private-project `EACCES`; the original broad evidence path is a failing negative control. Pinned download source was inspected with `curl -fsSL .../src/download-artifact.ts` into `/tmp` only.

## Runtime still pending

No SDK or recovery workflow ran locally. Actual hostUID1001/containerUID1000 sharing will be checked by the new CI probes; local execution covers UID1000 plus workflow structure because sudo is unavailable here. Whether the historical complete reader trees fit the caps, and the original final status/identity/authority-control results, remain pending hosted recovery. The changes grant no SDK/product qualification or production admission.

## Round3: two scoped review fixes

Read `backport-harness-round2-review.md` first. Implemented only its P1 download-layout and P2 local-hardlink findings. Local commit: `c0e6a64` (`fix(numeric): flatten recovery downloads and reject local hardlinks`). Parent documentation commits `e4a61a1`/`e322c19` arrived after the implementation base; the focused review range is `e322c19..c0e6a64` (three owned diagnostic files,42 insertions/2 deletions). Paused arithmetic/source files were not edited or staged. No push, SDK pull/run, historical artifact download, agents, or source-authority changes. This report remains ignored and was not force-added.

P1: the fixed-ID download now explicitly sets `merge-multiple: true`, so the pinned action extracts the validated sole artifact into `original/`, matching both the tar-reader and historical log-source paths. Fixed run/ID/name/API validation and digest limitation remain unchanged. Added a workflow regression test tying the flat extraction option to downstream paths, and checked the pinned action's actual destination expression with the workflow's parsed YAML inputs; no artifact download was involved.

P2: both local basics and selected regular-file readers now require `st_nlink == 1` before reading. Added actual `os.link` controls for result JSON, SDKlock, selected build input and nested selected verified input, each aliased outside the reader trees. All four controls verify link count2, cleanup failure instead of prior success, refusal to publish a complete archive, preservation of original exit42, and unchanged raw bytes/modes/link counts. Streaming tar hardlink rejection remains covered by its existing test.

Exact regression command before the fix:

```text
python3 scripts/numeric/tests/test_backport_retention.py RetentionTests.test_recovery_download_flattening_contract RetentionTests.test_local_hardlinks_fail_retention_and_preserve_original_status
Ran 2 tests in 0.336s
FAILED (failures=5)
```

The missing merge setting failed one assertion; all four real local hardlink cases incorrectly returned0 before the guards were added. After the fix:

```text
python3 scripts/numeric/tests/test_backport_retention.py
Ran 20 tests in 1.706s
OK

ACTIONS_GLOB_MODULE=/tmp/backport-upload-glob.mkN41A/node_modules/@actions/glob node scripts/numeric/tests/check-backport-upload-glob.cjs > /tmp/backport-upload-glob.mkN41A/round3-glob-output.log
rg 'PASS:' /tmp/backport-upload-glob.mkN41A/round3-glob-output.log
PASS: 30 diagnostic/recovery upload selections; 0 private project reads
PASS: old broad evidence/ selection fails EACCES negative control

bash -n scripts/numeric/check-prismpm-backport.sh
exit0

git diff --check
exit0, no output

git diff --cached --check
exit0, no output before the scoped commit
```

Python `ast.parse` for both helpers and `yaml.safe_load` plus `bash -n` for every embedded run command also passed:

```text
PASS Python syntax: retain-backport-evidence.py
PASS Python syntax: recover-backport-artifact.py
PASS YAML and embedded Bash: .github/workflows/prismpm-backport-recovery.yml
PASS YAML and embedded Bash: .github/workflows/prismpm-backport-diagnostics.yml
```

The YAML check wrote only the download step's non-secret inputs (token expression, not credentials) into `/tmp/backport-upload-glob.mkN41A/round3-download-inputs.json`. Exact local Node command checking the pinned action's retained source expression:

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync('/tmp/backport-upload-glob.mkN41A/download-artifact.ts', 'utf8');
const expression = source.match(/\n      path:\s*([\s\S]*?),\n      expectedHash:/)[1];
const destination = new Function('isSingleArtifactDownload', 'inputs', 'resolvedPath', 'path', 'artifact', 'return (' + expression + ')');
const config = JSON.parse(fs.readFileSync('/tmp/backport-upload-glob.mkN41A/round3-download-inputs.json', 'utf8'));
assert.equal(config['artifact-ids'], 14288310173);
assert.equal(config['run-id'], 43986399997);
const actual = destination(!!config.name, {mergeMultiple: config['merge-multiple']}, config.path, path, {name:'prismpm-backport-43986399997'});
assert.equal(actual, 'original');
console.log('PASS: pinned download-action destination expression + real workflow inputs resolve to original');
const old = destination(!!config.name, {mergeMultiple: false}, config.path, path, {name:'prismpm-backport-43986399997'});
assert.equal(old, 'original/prismpm-backport-43986399997');
console.log('PASS: no-merge negative control resolves to nested original/prismpm-backport-43986399997');
```

Executed as `node <<'JS' ... JS`; both displayed PASS lines were observed. Runtime limits from round2 remain: actual hosted download/recovery, actual cross-UID SDK sharing, and the historical run's final statuses/identities/authority-control results are pending. No new concrete concern identified within these two scoped fixes; this is diagnostic repair only.
