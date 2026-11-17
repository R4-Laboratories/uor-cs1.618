# Backport harness evidence-retention fix

Implementation commit: `78b1ecc` (`fix(numeric): archive private backport diagnostic projects`). No push performed.

Read `backport-harness-brief.md` and `backport-harness-review.md` before making changes. Addressed only the reviewed UID1000 mode0700 project evidence retention issue. Changed the runner, diagnostic workflow, and one focused temporary-directory test. Did not pull/run the SDK, change candidate/source authority, spawn agents, or touch the pre-existing untracked recovery working directory.

## Result

The UID1000 runner's EXIT finalizer archives the entire `projects` subtree, including hidden retained files, JSON/stderr siblings, symlinks, and private modes, on both success and failure. It writes a temporary archive, explicitly sets mode0644, then publishes `retained-projects.tar.gz`; raw project bytes/modes remain unchanged. Archive diagnostics go to `archive.log`. Tar/chmod/rename failures fail a previously successful run; an original nonzero exit remains authoritative. Final status-file write failure now also preserves an original nonzero exit. Identity-check failures still fail success and do not skip archiving.

The artifact action selects 21 explicit known files, including both gate logs and the archive. It does not select the evidence directory, raw project subtree, wildcard paths, or an exclusion pattern.

## Commands and observed output

`bash -n scripts/numeric/check-prismpm-backport.sh` — exit0.

`python3 scripts/numeric/tests/test_backport_retention.py` — all7 tests passed (`Ran 7 tests ... OK`). Tests exercise the production finalizer extracted verbatim except replacing the fixed `/evidence` mount path with a temporary path. They verify actual gzip tar member names, hidden/binary bytes, symlink target, directory/file modes, unchanged raw evidence, readable archive mode0644 under evidence mode0755, ordinary success/failure retention, tar/chmod/mv injected failures, identity cleanup failures, early failure before project creation, status-write failures, and the workflow's explicit upload list. Fault cases cover original exit0 and exit42. Initial fixture run exposed this environment's restrictive umask; the fixture now explicitly sets evidence mode0755, matching the workflow.

`python3 - <<'PY'` loading the workflow with `yaml.safe_load(...)` — `PASS: YAML syntax`.

`git diff --check` — exit0, no output.

Inspected the actual pinned upload action implementation and lockfile:

- `curl -fsSL https://raw.githubusercontent.com/actions/upload-artifact/ea165f8d65b6e75b540449e92b4886f43607fa02/src/shared/search.ts`
- `curl -fsSL https://raw.githubusercontent.com/actions/upload-artifact/ea165f8d65b6e75b540449e92b4886f43607fa02/package-lock.json -o /tmp/backport-upload-glob.mkN41A/action-package-lock.json`

Its search options set `followSymbolicLinks:true`, `implicitDescendants:true`, `omitBrokenSymbolicLinks:true`, and `excludeHiddenFiles:false` when hidden files are included. The lockfile pins `@actions/glob`0.5.0.

`npm install --prefix /tmp/backport-upload-glob.mkN41A --no-audit --no-fund --ignore-scripts @actions/glob@0.5.0` — `added 12 packages in 2s`. Installed only in a disposable `/tmp` directory; no repository dependency changes.

Ran Node with that exact `@actions/glob` version and those options, using the workflow's parsed 21 explicit file paths in a temporary evidence directory. Instrumented `fs.promises.readdir` to throw `EACCES` whenever code attempted to descend into `evidence/projects`, simulating the host's private-directory denial. Output:

```text
PASS: 21 explicit upload files; 0 private project reads
PASS: broad evidence/ negative control attempted private traversal and failed EACCES
```

The positive control selected all21 files without a private-directory read; the old broad evidence path attempted the forbidden traversal and failed. This checks actual action glob semantics rather than assuming exclusions prune traversal.

## Limits

Tests ran as UID1000. Host readability is verified through mode0644 and parent evidence mode0755, and inaccessible-directory behavior through the exact glob library with injected `EACCES`; this environment has no sudo, so no real UID1001 process was launched. Actual pinned SDK acquisition and genuine retained-reader replay remain pending CI. This diagnostic change does not establish SDK/product qualification or production admission.
