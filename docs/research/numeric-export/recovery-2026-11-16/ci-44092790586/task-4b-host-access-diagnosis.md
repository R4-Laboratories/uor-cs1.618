# Task4b host access diagnosis — read-only escalation

2026-11-17. **The demonstrated defect is an incomplete host filesystem access contract after the credential drop.** Transferring the source subtree to UID/GID1000 does not give that identity search permission through the runner-owned host path. The bridge authenticates that path as root, then assumes the dropped child can traverse it. The actual child cannot read its first source-owned preparation record. The precise denied component, its mode/ACL and the hosted socket layout were not retained; this report does not invent them.

The root/drop/export design can retain its existing custody boundary, but another isolated permission adjustment is not justified. Every source-reading host operation needs the same explicit traversal policy, including operations that do not receive the Docker group. A narrowly measured runner traversal group is the smallest candidate repair **if actual ancestor permissions support it and the design reviewer explicitly approves that additional process authority**. An owner-only ancestor cannot be repaired by a group. That case needs an explicitly designed fixed namespace/access route, not chmod/chown of the runner home, relaxed source readers, inherited root-open file handles, or another guessed group.

This phase used the systematic-debugging skill for evidence and path tracing only. No implementation, test execution, build, Docker call, network operation, privilege test, account change, source/index change or subagent was used. This report is the only authored file. The separate compiler task retained its implementation slot throughout this diagnosis.

## Actual failure and what it establishes

Run `44092790586` used exact implementation commit `a37db958cbed291f215cf034069ffddfbd1fee44`. `full-run.log:856–867` shows runner preparation, `umask 022`, the unchanged restorer reaching f292, then `sudo chown -R 1000:1000 prismpm`. The completed job record marks that entire fail-fast step successful. At `13:27:12.7568858Z`, log line872 reports:

```text
UID1000 host child: [Errno 13] Permission denied: '/home/runner/work/uor-cs1.618/uor-cs1.618/prismpm/target/candidate-qualification-driver/preparation-partial.json'
```

The error propagates through the genuine root/runner failure route and the preflight exits1. The always image collector then refuses `completed actual bridge preflight required`; it does not retry preflight. Source cache and devcontainer work are skipped. Qualification, all six scenarios and original OC10 are skipped. The small failure artifact is successfully uploaded.

Independently read and hashed the existing files under `docs/research/numeric-export/recovery-2026-11-16/ci-44092790586/`:

| File | Bytes | SHA256 |
| --- | ---: | --- |
| completed-run.json | 2439 | adfcc7f910bd3f929d008cbe355e599b7b7d58c803e927554bd4e60f130f8cb7 |
| failed-steps.log | 2247 | 808fc1273b0974b8c5094283c3ab6e7e7e938c771b71c70f62ccaa7c844472b2 |
| full-run.log | 164571 | 7941353ac36c0bab0fd6bfb0f51a9e2584bd8349ffb634b78e44943727a6f64e |
| source-image-failure-artifact.zip | 422 | 9639e77154ef7dd2d26814861ca556d3e67eb5490a7e2867403bc6e44571df95 |
| artifacts.json | 235 | 8a231b030d9f9a60cfa782169f8885b39eb03daa492f952e9b6f731696a1b13a |

The ZIP was read in memory, without extraction. Its only member is the402-byte `bridge-failure.json`, SHA256 `b184d48b863f0bec9f5ec68fcdd1a84e59bdbd3aa77741dd47b598462eb13504`. It records operation `preflight-image`, actual runner UID/GID1001, exit1, elapsed0.11272438500003545 seconds, the quoted permission error and `complete_application_accepted=false`. Artifact ID14331992888 and the422-byte ZIP hash agree with the upload log.

The fixed code order narrows the failed boundary. `bridge_child()` calls `bridge_drop()` at2090, remeasures and joins the Docker socket at2091–2093, obtains the current working directory at2094, then calls `read_json(home/'preparation-partial.json')` at2095. The observed pathname is this read. Therefore the actual process reached and passed the UID/GID1000 and exact supplementary-group assertions, and passed the independent socket measurement/join. This advances beyond the prior socket refusal. It does **not** establish the socket's actual group number or canonical layout, successful socket read/write access (`os.access` is later at2102), any Docker connection, source-record equality, or cross-UID export. The preflight private original and metadata destination are created only after the failed read.

`read_json()` calls the unchanged `regular()` at76–89: absolute path, `resolve()==path`, lstat, regular/single-link/current-owner bounds, `O_NOFOLLOW` open and held identity checks. The retained exception does not identify whether EACCES arose during resolution, stat or open. Root then sees no child export, preserves that actual error at2215–2216 and exits without a successful handoff. No code here supports calling the failure a source-owner mismatch: that predicate would produce a different explicit message once stat had succeeded.

## Preparation and the complete path boundary

Let `R=/home/runner/work/uor-cs1.618/uor-cs1.618`, the actual workspace named by the logs. Preparation (`prepare`,345–390) runs as the runner. It validates the restored source through the current-owner reader, creates `R/prismpm/target/candidate-qualification-driver`, copies the three authenticated game authorities, creates source preparation and source inventory records, and writes a separate runner-owned partial record under `R/evidence`. The subsequent successful workflow chown changes ownership only at `R/prismpm` and below. It does not change any ancestor above that subtree, game ownership or host evidence ownership.

For an absolute pathname, the kernel requires search permission on **each directory component**, then the required access to the leaf. Being the leaf's owner, having a permitted Docker socket group, inheriting a current working directory inside the workspace, and root having previously read the path do not supply missing search rights on an earlier component. The absolute lookups in `regular()` start from `/`; the inherited cwd is not an access bypass.

| Actual component | Established or intended ownership/mode | What is still unmeasured |
| --- | --- | --- |
| `/` | Root/child socket admission establishes its safe root-owned directory policy passed. | Exact mode/device/inode were not retained. |
| `/home` | Unchanged by preparation/chown. | UID/GID/mode, ACL and child search access. |
| `/home/runner` | Unchanged by preparation/chown. | Same; a runner-owned0750 directory is a plausible blocker, not an observed fact. |
| `/home/runner/work` | Unchanged by preparation/chown. | Same. |
| `/home/runner/work/uor-cs1.618` | Unchanged by preparation/chown. | Same. |
| `R` | Runner and root admission require actual runner UID1001, real directory, no aliases, no group/other write or special bits. | Those checks allow0700/0750 as well as0755; they do not prove child traversal. Exact GID/mode absent. |
| `R/prismpm` | Successful recursive transfer targets UID/GID1000. The checkout was usable during runner preparation. | Post-transfer stat/mode/ACL not retained. |
| `R/prismpm/target` | Transferred with the source. If newly created by `mkdir(parents=True)` under022, the intermediate directory is0755. | Creation assumptions are not a hosted stat record. |
| `R/prismpm/target/candidate-qualification-driver` | Explicitly created0700 by the runner, then transferred to1000:1000. | No retained post-transfer identity/ACL record. |
| `.../preparation-partial.json` | `write()` creates a new no-follow regular file0400; recursive transfer targets1000:1000. | No retained post-transfer leaf stat, ACL or successful child read. |

Under these ordinary creation/transfer semantics, the private directory and leaf have the correct **owner** search/read permissions for UID1000. Changing their0400/0700 modes is not the coherent repair. A missing search right above the transferred subtree explains how successful chown and EACCES coexist. That is the leading, code-supported mechanism. The exact hosted component is unknown; without post-transfer metadata, an unexpected source-subtree mode/ACL or another kernel access restriction cannot be excluded. The next implementation must measure rather than relabel that uncertainty as `/home/runner is0750`.

No host ancestry measurement is currently made. `bridge_directory(R, runner_uid)` validates only the final directory's ownership/mode and canonical spelling under root credentials; it does not establish all ancestors' access under the child credentials. `bridge_socket()` measures a different path tree (`/var` and `/run`). Neither proves the source path is traversable.

## Identities, all operations and both output domains

The normal runner retains its actual account credentials; the retained artifact establishes UID/GID1001 but does not list its supplementary groups. It invokes exactly `/usr/bin/sudo -n -- /usr/bin/python3 -I -B <R>/game/scripts/numeric/candidate-capture-qualification.py host-root --bridge-operation <closed operation>`. The root entry authenticates actual `SUDO_UID/GID`, runner-owned request/workspace/game/evidence paths, original job clock, game commit and exact driver bytes (`2142–2175`). Root and child environments are reduced to PATH and LANG. The child closes unrelated descriptors and replaces stdio before its callback (`1903–1951`).

`bridge_drop()` (`1954–1959`) replaces supplementary groups, then sets primary GID1000 and UID1000 and checks actual IDs/groups. It neither inherits runner groups nor initializes UID1000's account groups. This is deliberate isolation, but the chosen list accounts only for the Docker socket:

| Operation | Current child supplementary groups | Required host path access |
| --- | --- | --- |
| preflight-image / preflight-qualification | Only measured socket GID | Source partial, source-private preflight output; eventual runner export admission. |
| image-collect | Only measured socket GID | Source partial/inventory/complete tracked source and `.git`; runner-owned game Git and three game authorities; socket; child-private metadata. |
| pull-budget / setup-budget | Empty | The same absolute source partial, even though only its clock value is needed. |
| qualification-collect | Empty | Source partial, collection metadata, raw copies/readiness, complete tracked source/`.git`, and runner-owned game Git/authorities. |
| metadata-budget / raw-budget | No child | Root control ledger and runner admission only; they must remain control-only. |

Consequently, adding a group only to the socket/preflight path is insufficient. Both budget helpers and qualification collection would still lack the traversal identity. Also, `host_collect()` at1709–1713 reopens `R/game` Git objects and the three original game code files after the partial read. Root's earlier successful game authentication is not proof of the child's later read access. The preflight currently does not exercise this game-reader part of collection.

The rest of the ownership flow is coherent and should remain separate:

| Object/domain | Owner/access contract and reader |
| --- | --- |
| `R/game`, its `.git` and fixed authority files | Runner-owned; root authenticates them, and the collector child needs ordinary read/traversal rights to the exact files. Current code does not transfer their ownership. |
| `R/evidence/job-start.json`, `preparation-partial.json`, restoration receipt | Runner-owned; root validates the clock/partial and passes typed values into the child. The source child must not reopen the runner's private evidence as its own. The partial is0400; initial clock/receipt modes derive from their ordinary creation and are not logged. |
| `R/evidence/host-bridge` and request/status/admission/handoff records | Directory0700 and records0400, owned by the runner. Root reads/authenticates or publishes only the fixed control objects. |
| `R/evidence/.host-bridge-root` and state/clock records | Root-owned0700/0400. Later root guards bind the original clock and completed handoff; they do not revisit transferred source copies. |
| Source `.../host-bridge/<operation>` | UID1000-private operation directory0700; preflight original0400 stays there. Parent directories created implicitly still need measured access under the inherited umask, not assumed permissions. |
| Source `.../metadata`, `.../raw`, copied metadata, `raw-upload-ready.json` | UID1000 owns the private retained data and marker. The child reads/writes them. Root, not the runner, observes the readiness path and validates the complete raw inventory before handoff. |
| `R/evidence/preflight-upload`, `metadata-upload`, `raw-upload` | Only retained copies are moved with same-device/no-replace semantics and enumerated descriptor ownership transfer. Final runner-owned directories0700/files0400 are actually traversed/read/hashed by the runner before safe controls. Originals retain their identity/mode/owner. |
| `GITHUB_OUTPUT` | Opened only by the actual runner, with checked original owner/device/inode/mode and no owner change. Its original mode and parent metadata were not retained here. It is never a child path or environment entry. |

The source-side readiness marker must not be made runner-readable to repair this error. Keep its root-mediated inventory/control transition, failure exits, one-time relocation, and later control-only guards. Successful upload of the402-byte runner-created failure record proves that narrow failure route is readable; it proves nothing about a successful UID1000 export.

## Cache, container readiness and existing supported patterns

The source-cache composite action is an ordinary runner action. It hashes `prismpm/.devcontainer/**`, configures the original Buildx/runtime cache and writes its own GITHUB_OUTPUT (`.github/actions/prismpm-source-cache/action.yml:13–27`). Devcontainers/ci also starts as the runner. After source chown, these steps require runner read/traversal of the source's public build inputs; source ownership alone is insufficient in that direction too. The exact f292 `.dockerignore` excludes `.git`, target and the other registered cache trees, so these actions should not require access to the private candidate-driver directory. Do not widen that directory or change the cache action/pin. A useful preflight checks the runner can read the bounded fixed devcontainer definition and `.dockerignore` after transfer.

The actual source workload has a different access path: the daemon mounts the checkout at `/workspaces/prismpm`, and original source `.devcontainer/devcontainer.json` selects remote user `vscode`. The exact f292 Dockerfile creates that user/group as1000. The original root entrypoint measures the mounted socket GID and establishes its container group membership; `docker-ready.sh` checks NSS and, when necessary, refreshes only the command's groups through `sg` within its unchanged deadline. These existing container account semantics remain immutable. A container's mounted path does not traverse host `/home/runner`; success there cannot validate the newly added **host** UID1000 collector path. Conversely, this early host failure is no evidence against the original container readiness code.

Existing code supports two relevant patterns, neither of which silently repairs this host drop:

- Full-source VV chowns source1000 but performs host image inspection/retention as the runner (`prismpm-backport-full-validation.yml:40–70,173–205`; `full-source-vv.py:44–108`). Its host reader does not enforce candidate `regular()`'s current-owner rule. Copying that reader into this task would weaken the required custody boundary.
- Native golden prepare/collect remain under the actual nonroot source owner (`native-golden-preparation.py:440–465`), and the original native owner passes that measured UID/GID into its Docker actors (`scripts/native-golden.mjs` f292,198–220,393–424). Its host/private output ownership is aligned with the runner, so it does not need a different host UID to traverse the runner home. Changing the fixed candidate source/SDK UID to match that pattern is outside this task.
- The older diagnostics workflow explicitly keeps host evidence ownership and uses separate small-log copies for upload, avoiding recursion into UID1000-private originals (`prismpm-backport-diagnostics.yml:44–49,99–101`; `retain-backport-evidence.py:256–269`). It is support for the existing separate export boundary, not permission to make candidate originals shared.

The local/fixture evidence explains why earlier tests did not discover this seam. The actual process is UID/GID1000, with Python reporting an empty supplementary list; `sudo` is absent. Both local repositories are themselves mode0700 owned1000 and their `/workspace` ancestors0755, so the local reader is the directory owner. This says nothing about the hosted1001/1000 boundary. The real two-identity test is explicitly skipped locally and sets its common temporary parent to0755 (`test_candidate_capture_qualification.py:647–681`); even when run as root, that layout would not test a restricted runner ancestor. The socket integration test substitutes the drop and stops at the first `read_json` (`1025–1041`). It intentionally proves socket propagation, not source-path access.

## Smallest coherent repair and explicit design ruling

**Recommendation for the design reviewer:** keep the fixed root entry, UID/GID1000 source validation and existing transfer mechanism. Add one measured host-access contract, used by all six source-reading bridge operations, with durable failure measurements. Approve a process-only traversal GID **only if** it is the authenticated actual runner's primary GID and the held path/access measurements demonstrate that this is the necessary supported route. Do not hardcode1001, copy all runner/account groups, select arbitrary GIDs from encountered files, add a CLI group/path option, or retain a group merely because an earlier process happened to have it.

This is a material expansion from the previous design ruling, which admitted only the measured Docker group. A supplementary runner GID grants that group access throughout the child's host namespace, not just search permission on the named ancestor. It must be explicitly reviewed as process authority; calling it a traversal group does not confine its kernel effects. No implementation of that expansion is authorized by this diagnosis alone.

The coherent implementation contract should cover:

1. Root derives the two fixed path domains from its authenticated cwd and fixed game/source relative names, not from a caller-supplied pathname. It measures every ancestor from `/` to the source partial, required source/game roots and relevant fixed game files: kind, UID/GID/mode, device/inode, and link/ACL presence where relevant. Require no unexpected aliases or unsafe writable ancestry, retain final source-owner/single-link/mode checks, and join held identities across credential transition. Bind `partial.host_source` to the actual original source location; do not substitute a convenient path in Docker labels or source-image mount evidence.
2. A common closed access plan distinguishes source traversal from Docker access. If the explicit group ruling is adopted, preflights and image collection receive the necessary approved traversal GID plus the measured socket GID; pull/setup budgets and qualification collection receive only the necessary approved traversal GID. Deduplicate groups and verify actual resulting IDs/group set after the same setgroups→setgid→setuid order. No account, sudoers, global group or environment change is needed. Metadata/raw guards stay without a source child.
3. The dropped child independently walks/rechecks the access boundary and uses the original `regular()` reader for source preparation and the fixed required authority/inventory reads. Record the actual syscall/errno and first unavailable prefix when access fails. POSIX mode arithmetic alone is insufficient when ACLs or other access controls exist. Root observations may diagnose a denial but cannot replace the child's read. Root-open source descriptors must not cross the drop. The preflight should cover the fixed game read requirements too, within its current30 seconds, and the ordinary runner should verify the fixed cache/build inputs under its real credentials before cache/image work.
4. Keep the actual child credentials, parent/leaf measurements and already admitted socket measurement on both success and failure. Today the child exception loses the socket record and every credential/path observation because bridge-context is written only after source access. Use a closed bounded diagnostic payload retained by the runner through the existing failure route; do not rely on a long string that the2048-byte error truncation can erase. It must fit the existing8KiB control-stream bound, count in metadata/combined caps, survive failure before child metadata exists and remain explicitly nonacceptance evidence. No environment dump or arbitrary file reads.

If an ancestor is runner-owned0700, lacks the approved group's search right, has an unsupported ACL/owner/alias, or the actual child still cannot read, **the group design must refuse with the retained measurement**. It must not chmod/chown `/home/runner`, grant another group, run validation as root, weaken final no-follow/current-owner checks, or retry with a different privilege route.

In that case, or if the additional runner group is not acceptable authority, the necessary alternative is a separately reviewed fixed namespace/access approach. One possible shape is an isolated child mount namespace exposing only the authenticated source and game roots through fixed safe ancestors, preserving underlying source device/inode/UID/mode and an explicit original-host→child-view mapping. Such a design must keep the actual devcontainer host-source/mount identity, final unaliased readers, private originals, root descriptor closure, export relocation and supervisor cleanup intact, and must not become an arbitrary root path/program/mount API. A symlink shortcut or permission change to arbitrary host ancestors is not that design. This alternative has more machinery and unproved hosted privilege requirements; it is not an implementation recommendation to silently add now.

There is insufficient retained metadata to choose the group variant as an unconditional fix or to claim a namespace is definitely necessary. The required ruling is which bounded access policy is allowed; the implementation must measure its applicability and refuse unsupported layouts. This addresses the shared identity/path assumption across operations rather than weakening a succession of failing assertions.

## Proposed scope and meaningful verification

Later implementation should stay in the game driver and focused qualification tests, with only narrowly necessary qualification-workflow integration if the chosen access policy requires it. No source/cache-action/probe/subject/restorer/snapshot/pin changes. The source stays463; the qualification snapshot stays f292/d48; d6 and all original source/SDK authorities stay fixed. Independent design/implementation review and the parent's sole implementation slot are still required.

Tests should first expose the missing contract, then validate the chosen one:

- A real two-identity temporary hierarchy with a runner1001-owned0750 ancestor, UID1000 source/target/private0700 directory and0400 preparation leaf. The old empty/socket-only group path must fail under actual kernel permissions despite correct source ownership. An explicitly approved, measured traversal-group plan must enable the source read without altering any original metadata. Include a runner0700 ancestor that remains refused, a denied intermediate workspace component and a group that is present but lacks search permission. Run this only where the later dispatch authorizes a real privileged fixture; local mocks are not that witness.
- Exercise the actual common drop/path helper across preflight, image collection, both budget helpers and qualification collection. Assert socket group is limited to socket-using operations, no arbitrary/inherited extra groups or secrets enter, and metadata/raw guards never touch source or receive new access. Include wrong owner/group, unexpected ACL/layout, alias and identity-change refusals; preserve single-link and held final-file checks.
- Cover the collector's fixed runner-owned game Git/authority reads and the runner's post-chown cache/build-input reads. Test the production permission classes, not only a0755 common parent or a stub that stops before source access.
- Retain full bounded parent/leaf/credential/socket diagnostics for failure during source resolution/stat/open and before metadata creation. The actual runner must read the failure artifact; genuine child/root exit remains nonzero and no safe-source/export claim is invented. Include payload truncation/overflow and deadline refusal.
- Reuse the existing transfer tests and add the restricted ancestor to the genuine end-to-end fixture: source originals stay private and unchanged, retained copies relocate once to runner700/400, actual runner inventory/hash/output admission succeeds, partial transfer remains unuploadable, and later guards use only persistent control state. Do not repeat unrelated compiler/SDK work.

The next hosted preflight must retain the measured access layout even on failure and demonstrate the full chosen drop/read/export/runner-read route before cache or image work. That preflight is necessary for hosted account/sudo/path evidence; it still does not qualify any scenario or original OC10. No second host, namespace, fallback copy or retry may renew a budget.

Keep image240 minutes, qualification360 minutes with45 setup+240 scenarios+65 OC10+10 collection, collection7 source+1 host+1 metadata+1 raw, five-second guards, all original inner2400/420/18/2 bounds,32MiB metadata/4GiB combined evidence and8GiB local floor unchanged. Added measurements/access work consume existing phase deadlines.

## Inspection identity and limits

Parent documentation advanced from186075d to `c960f38c82af4fb9d88a2eb3e3d5c25ea20fff21` during this read-only work; the parent reported that checkpoint. A read-only scoped diff confirmed driver/tests/workflow remain exacta37db95. Current driver172461 bytes SHA256 `efe5867d716887a0a6f19cbecad21234b56773801fd079b97e8f353824811dc4`; workflow8920 bytes SHA256 `2b1c9ab8fc892c6fb884c0d74709b98111e74a36dc5acb33fc37b83ce3d3a84c`; focused tests81946 bytes SHA256 `3a8c6a53a0b28599e6af3fdcd2275e523de93cf95eb5350e6c39531cf7db586e`.

Read-only source status was clean at `463177a0971d95e112e10ed5da39c8cbaf0a4c96`, tree `0990e900cf1cb5bb4a481bba781a86cc3fcf0999`, index SHA256 `b57cc2bd2190d7e5fa1cbb941b29eb22160d41aab91e63a4fdf48a601b3a9fb1`. Exact f292 source interfaces were read using Git object reads. No source restoration or test was repeated. The last pre-report free-space observation was9,026,875,392 bytes, above8GiB; no large files were created or extracted by this diagnosis. Actual hosted ancestry/ACLs, socket record, usable traversal group or namespace, complete cross-UID handoff and all expensive qualification outcomes remain unproved.
