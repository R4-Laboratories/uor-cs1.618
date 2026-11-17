# Task4c1: host-layout observation only

Independent-review brief, 2026-11-17. Task4b repair rounds remain closed. This unit measures unknown layout; it grants no source access. Only this brief was written; no code/tests/network/builds/privileged probes/subagents ran.

## Scope and workflow

Own exactly three new implementation files:

- `.github/workflows/prismpm-host-layout-diagnostic.yml`
- `scripts/numeric/host-layout-diagnostic.py`
- `scripts/numeric/tests/test_host_layout_diagnostic.py`

Existing workflow/driver/tests/validators, source463, f292 snapshot, pins and subject/probe stay unchanged. Declare separate Task4c1 evidence/report/index paths before implementation.

Workflow/job names explicitly say **diagnostic only**. Push: branch `numeric-kernels`, path filter exactly these three files. Also input-free workflow_dispatch, guarded to the same repository/branch. contents:read; workflow/ref concurrency, cancellation false; ubuntu-24.04; ten-minute job ceiling. No cache/devcontainer/Docker/SDK/build/qualification/cleanup jobs.

Start evidence/job-start.json monotonic clock. Preserve checkout SHA `11bd71901bbe5b1630ceea73d27597364c9af683`: game at github.sha, source UOR-Foundation/prismpm at3666dc0f9da56fcf066d96ec01cd9e14ec9a2974, fetch-depth0, both persist-credentials false. Run unchanged qualification driver `prepare --phase image` under umask022, then existing scoped `sudo chown -R 1000:1000 prismpm`. This restores sourcef292c7100874c0e0b2d1e0e81b27caeec8391f77/tree d48cdfd94e6d46925e9269e364c2b7a6eb975d8a and binds authorities. No additional source/ancestor mode, owner or ACL changes.

Run observer once after successful preparation. Upload only its two-file directory using upload-artifact SHA `ea165f8d65b6e75b540449e92b4886f43607fa02`, `always() && steps.observe.outputs.artifact_safe == 'true'`, missing-files error,30-day retention, name `prismpm-host-layout-diagnostic-${run_id}-${run_attempt}`. Observer exits1 even when measurement completes; no continue-on-error. Upload may succeed while the diagnostic job remains nonaccepting. No qualification-green claim.

## Entrypoint and clock

CLI accepts only no args (runner) or literal `--root-observe`. Fixed root command: `/usr/bin/sudo -n -- /usr/bin/python3 -I -B <cwd>/game/scripts/numeric/host-layout-diagnostic.py --root-observe`; fixed PATH/LANG, null stdin, close unrelated descriptors, bounded streams. No path/GID/program/revision parameters, credential-drop child, access selection, creation probe or collector.

R=authenticated absolute unaliased cwd; S=R/prismpm; H=S/target/candidate-qualification-driver; C=R/evidence/.host-layout-diagnostic-control; U=R/evidence/host-layout-diagnostic. Runner creates C/U exclusively0700 (preexisting names refuse), C/request.json exclusively0400. These are diagnostic metadata writes, not source probes.

Request `cs1618/host-layout-request/1`: exact keys `schema,operation,uid,gid,started`; operation=`observe`, actual IDs, finite monotonic time. Root requires UID/EUID0, nonzero authenticated SUDO_UID, authenticated SUDO_GID, request ID join, age<5s, fixed cwd/script and held safe runner-owned C/U/request. No caller-selected filesystem input.

Authenticate runner-owned evidence/job-start.json and preparation-partial.json, game HEAD/tree, exact Git bytes for observer/new workflow and existing driver/authority/restorer/manifest bindings. Read only fixed public authorities/control metadata: request/clock4KiB each, partial/manifest8KiB each, workflow64KiB, each fixed script1MiB. No source payload reads. Fixed isolated Git argv retains hooks/fsmonitor/global-config suppression and remaining-deadline timeout/reaping.

**Do not call/widen existing validate_partial(): it hardcodes the old workflow.** New observer independently checks the same closed partial shape, fixed image phase/source IDs/authority bindings, repository/ref/run/attempt, workflow SHA=game commit, host_source=S, and exact new reference `R4-Laboratories/uor-cs1.618/.github/workflows/prismpm-host-layout-diagnostic.yml@refs/heads/numeric-kernels`. Unchanged prepare supports this context. Context binding is not root source validation.

D=min(request.started+30s,job.started+600s). Setup/authentication/measurement/publication/readback consume D. Stop measurement by D−3, root alarm by D−1, runner by D. No timer renewal/retry/preflight ledger. Each control stream≤8KiB including wrappers. Actual runner alone verifies/appends GITHUB_OUTPUT, sole Boolean `artifact_safe`; root never receives that path.

## Exact manifest

Expand this literal set, deduplicate, add all ancestors through `/`, order depth/path. No tree scan/globs/Git dependency walk/environment paths. R encoded length≤512;96-node hard cap. A is exactly candidate-capture-qualification.py, candidate-capture-probe.py, candidate-capture-subject.mjs. B is exactly .dockerignore, .devcontainer/devcontainer.json, .devcontainer/Dockerfile, .devcontainer/docker-entrypoint.sh, .devcontainer/docker-ready.sh.

| Literal endpoints; ancestor directories become rows | Subtree count |
|---|---:|
| R/game/.git/{HEAD,config,objects}; R/game/scripts/numeric/A; same directory host-layout-diagnostic.py, restore-prismpm-candidate.py, prismpm-capture-candidate/manifest.json; R/game/.github/workflows/prismpm-host-layout-diagnostic.yml |17|
| S/.git/{HEAD,config,objects}; S/B; H/{preparation-partial.json,source-files.json,game-inputs.json,restoration-receipt.json,snapshot-manifest.json}; H/A; H/{metadata,raw,collection-clock.json} |part of41|
| Each literal operation preflight-image, preflight-qualification, image-collect, qualification-collect: H/host-bridge/operation/metadata-upload/bridge-context.json; two preflights additionally operation/original.json and operation/metadata-upload/copy.json |completes41|
| R/evidence/{job-start.json,preparation-partial.json,restoration-receipt.json,host-bridge,.host-bridge-root,metadata-upload,preflight-upload,raw-upload}; C/request.json; U |12|
| /run/docker.sock; /var/run/docker.sock; their ancestors |5 extra besides `/`|

Observed R=/home/runner/work/uor-cs1.618/uor-cs1.618:70 R-relative +6 R/ancestors +5 socket-layout = **81 nodes**. Analogous disjoint root depth d gives76+d; calculate actual union before opens, refuse >96. Pull/setup-budget return before folder creation, so invent none. Guards remain control-only.

Prepared game/source nodes and three evidence preparation leaves are required-existing. H/{metadata,raw,collection-clock.json,host-bridge and descendants}, plus original evidence bridge/export dirs, are future-optional. C/request/U required-existing; socket alternatives below. Publication JSON is not falsely listed as already observed: its later identity belongs to status.

## Safe measurement and inheritance

Hold each O_PATH|O_NOFOLLOW relative to held parent, fstat and join no-follow name identity. Record dev/inode/type/UID/GID/full mode/nlink/size/mtime_ns/ctime_ns. Expected ancestry owners: root/actual runner outside S, UID1000 within S, with fixed role-owner/private-mode expectations. Unsafe type/owner/mode/alias or unstable identity blocks descent, but record safe metadata at that node and continue independent branches. No source contents, socket connect or permission probes.

Access/default ACLs are separate. ENODATA alone=absent. Present: exact base64 bytes, length, SHA256, compact numeric version and `[tag,perm,id]` entries. Validate Linux version2, lengths, legal tags/IDs/permissions/base entries/mask; retain malformed/unknown results, never normalize or decide permissions. Default is not_applicable off directories; symlink ACL not_inspected.

O_PATH does not support fgetxattr. Use the fixed Linux `/proc/self/fd/<held-fd>` metadata handle, joining stat to fstat; this internal kernel handle is not an allowed source alias/general path API. If unavailable, report errno; no pathname fallback. Native getxattr size-check plus buffer≤8KiB; growth/ERANGE marks instability/overflow, not absence. Repeat ACL/ctime and held parent/name identity checks; dev/inode alone misses ACL/path races. Never close/reuse a descriptor before checks complete.

Only fixed socket alternative: /var/run directory, or root symlink exactly `/run` or `../run`. Record link bytes/identity, independently hold canonical /run/docker.sock and join known mapping; logical row=`fixed_alias_mapping`, never socket admission. Other aliases block descendants. If /var/run is real, measure its socket independently; absent /run/docker.sock need not invalidate that layout. Socket failures never stop safe source/game branches.

Descendants of missing/unsafe nodes explicitly carry blocked_by/reason. Required missing differs from future-optional absent; descendants of a confirmed absent future parent are blocked_expected_absence, actual inheritance unknown. ACL presence alone does not stop safe structural traversal. ACL inspection/decode errors make coverage incomplete while independent branches continue. Timeout/limits explicitly leave unmeasured rows.

Static creation-rules table (never execute): prepare home0700, parents=True intermediates0777; authority write_bytes then chmod0400; JSON open0400 or mkstemp0600+fchmod0400; source operation mkdir0700/intermediates0777, preflight original0400/copy then chmod0400; root ledger0700/write0400; handoff fchown copies then fchmod directories0700/files0400; runner dirs0700/records0400. Each rule binds measured parent/default row or missing chain, intended actor and fixed child pattern. Prepared ACLs are current post-chown observations, not history. Default ACL concerns creation; access ACL existing access; chmod may leave named entries masked. planned/actual/kernel_witness/creation_witness always null.

## Records and retention

Closed full schema `cs1618/host-layout-observation/1` keys: `schema,producer,context,limits,timing,observer,runner,planned,actual,kernel_witness,creation_witness,nodes,acls,creation_rules,socket,coverage,issues,complete_application_accepted`. Producer=root_observer or explicit runner_fallback; context=fixed authenticated run/commit/preparation/request-hash bindings. Limits=96 nodes/8192 individual ACL bytes/65536 full JSON bytes/8192 control bytes. Observer identity is root, never a source-child actual. Acceptance=false.

Node keys: `id,parent,name,role,expectation,state,identity,access_acl,default_acl,blocked_by,issue_ids`; identity fields above, null if unavailable. ACL keys: `state,bytes,sha256,raw_b64,version,entries,decode_error,errno`; deduplicate by hash+exact bytes. States absent/present/unavailable/oversize/omitted/not_applicable/not_inspected. Issues bounded `{node,stage,syscall,errno,code}`. Coverage counts expected/accounted/measured/absent/blocked/unmeasured plus complete.

Complete requires stable inspected required nodes, retained supported ACL metadata and no errors/overflow/unmeasured nodes. Confirmed expected future absence/blocked_expected_absence may be accounted complete, never a creation witness. Skips cannot be complete. Preallocate all compact rows; fit deduplicated ACL table within64KiB full encoding. Oversize ACL retains known length, raw/hash null. Table overflow retains length/hash but marks bytes omitted and coverage incomplete. Continue safe measurement under D; reserve bounded failure/overflow counts, never silently drop denied prefix.

Control schema `cs1618/host-layout-control/1`: `schema,exit,observation,deadline,request_sha256,report,first_issue,counts,planned,actual,complete_application_accepted`. exit1 always; observation complete/incomplete; report null or literal layout.json with length/hash; planned/actual null, acceptance=false. Entire wrapper≤8KiB, no JSON-in-error-string route.

Root may publish only U/layout.json, exclusive0400 then fchown actual runner, using held U dirfd and parent ACL/identity plus final file joins. Existing bridge_publish alone is insufficient: pathname parent is not held through create. Reuse encoding/hash/read patterns only with these new preconditions. Never call bridge_privileged/admission, require completed preflight, create its ledger or invoke source/export validators. Root cannot create arbitrary directories/replace files. Private publication parent requires supported safe effective ACL/mode; unsafe/uninspectable U means no safe artifact.

Runner reads/hashes layout.json through held U, joins root summary,0400/owner/single-link/stable identity/≤64KiB. It writes status.json≤8KiB, schema `cs1618/host-layout-status/1`: `schema,operation,runner,root_exit,observation,deadline,request_sha256,report,publication_identity,artifact_safe,complete_application_accepted,error`; acceptance=false. If root cannot safely publish, runner may create an explicitly incomplete runner_fallback layout with null root/source observations, only if U remains safe; never invent root facts.

Emit artifact_safe=true only after exact U inventory `{layout.json,status.json}`, runner read/hash and status readback, both private singly-linked runner0400 files, held/rejoined runner0700 U and safe ACL, total≤72KiB charged to existing32MiB metadata/4GiB combined caps. C/request never uploads. No source payload/raw archive/partial transfer; no preflight/metadata_safe/raw_safe output. Unsafe race/expired deadline means exit1 without artifact_safe. Authentication/source-layout failures do not create a circular completed-preflight dependency.

## Focused tests and gates

Required tests: exact81 nodes/96 limit; required vs future absence/blocked descendants; continue past default ACL; complete vs skipped/error/timeout; exact ACL bytes/hash/decoding, ENODATA vs ENOTSUP/EACCES,8KiB/64KiB/8KiB caps/dedup/omission; malformed ACL; procfd unavailable, replaced parent/leaf and ACL/ctime races; fixed socket alternatives; publication race/preexisting file/hardlink/symlink/wrong owner/runner hash mismatch; early root failure/fallback/exact two-file artifact/runner-only outputs; all probe fields null and forbidden source reads/writes/credential changes absent; static creation rules match actual calls; no preflight dependency; workflow trigger/pin/nonacceptance/expensive-job exclusions. Privileged fixture unavailable=explicit skip, never hosted evidence.

Independent design review precedes sole implementation dispatch; implementation review precedes one diagnostic-only hosted execution. Retain Task4c1 evidence/index and return to architecture review. No automatic credential-selection or admitting qualification run follows.
