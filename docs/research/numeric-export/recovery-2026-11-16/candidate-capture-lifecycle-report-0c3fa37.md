# NEXP013 Task2 implementation report

Status: **DONE_WITH_CONCERNS**, ready for independent source-authority/lifecycle review. Local component and policy controls pass. Actual unchanged-d6 SDK/daemon/mount qualification and genuine OC10 execution remain Task4; no complete candidate capture was produced locally.

Source worktree: `/workspace/scratch/prismpm-numeric`.
Base: `bb33f7f86c24e7f4eddb75a48f8ade0a2f8cb702`, tree `b2f60264cb055f44b04f17790e4028b65d5f71ea`.
Commit: **`0c3fa37b598e0ded05fdfd7437ef8b9ae379f94a`**, tree **`36b095c44de929e12d5b1bb00dd7c53f8e8b60cb`** (`Add inspected candidate capture lifecycle and readonly execution`). Source worktree clean after explicit five-path commit.

Owned changes only:

- `scripts/conditional-capture-candidate.py`: authenticated image inspection, lifecycle, separate immutable guest, original response/receipt checks and final envelope.
- `scripts/conditional-capture-bootstrap.py`: execute calls `guest(descriptor, context["deadline"])`; fixed bootstrap argv/capsule/pins remain.
- `scripts/conditional-capture-candidate-command.mjs`: fixed candidate ELF path; unchanged original supervisor invocation/result semantics; existing real unaliased work directory required.
- `scripts/conditional-capture-candidate.test.py`: original Task1 controls preserved except the deliberately unavailable lifecycle control now expects closed/unbound-entry refusal; new lifecycle/response/process/publication controls.
- `scripts/conditional-capture-candidate-command.test.mjs`: focused launcher logic and real invalid-argv process controls.

All four immutable legacy authority files, original Python helper controls, original Rust actual capture case and all its existing application controls remain byte-for-byte unchanged. No route-selector/source-gate/independent-reader change, SDK/tool/PATH/marker/inventory/policy change, new controller build, full SDK pull, push, PR, or subagent. Only tiny native fixture programs already used by Task1 controls were compiled. Final recorded available space is **10,980,929,536 bytes**, above the local8 GiB reserve.

## Controller rulings implemented

Read source AGENTS, tracked design including the new implementation rulings, Task2 brief/addendum, Task1 report/fix appendix and final scoped PASS review.

Two concrete conflicts were raised before implementing dependent work, then ruled by the controller and incorporated into the tracked design/brief:

1. Actual inventory/image-authority bytes are needed before descriptor-bound stage argv can be formed. Add a third actor, role `inspect`, which is **never started** and is retired before staging. It has fixed `/usr/bin/python3 -I -B -c pass` argv, exact image/environment/resource policy, no source/input/work volume/socket mount, and a fixed16 MiB noexec `/workspace` tmpfs suppressing any image-declared workspace anonymous volume. Unexpected declared volumes and actual mounts refuse. Before each of the three fixed image-file reads, a fresh actor inspection requires created status, Running=false, PID0, and zero StartedAt. All removal/absence operations are authenticated. Actual anonymous-volume suppression is still a Task4 platform gate.
2. Candidate runtime refuses `/workspace/NAME` before any Docker operation. General Task1/legacy grammar is unchanged. Runtime allows only `/workspaces/NAME` or the exact existing private `/tmp/prismpm-publication-capture-.../source` grammar. Guest requires actual root-owned, unaliased protected ancestors, with the specific root-owned sticky `/tmp` or `/workspaces` anchor exception; the source itself remains a read-only real mountpoint, never a mutable symlink.

Work paused once at controller request for the sole implementation slot, then resumed from intact edits. No competing implementation or additional agent was spawned.

## Execution and custody

`parent(source: Path, executable: Path) -> int` is the closed CLI owner and returns0 only after final envelope publication. It measures the exact Task1 source/fixture union, source-authority closure and actual existing ELF/listing/count under main-thread deadlines. It retains metadata identities across transfer and final pre-ack source/ELF rechecks. Caller SDK environment must exactly name the existing d6 distribution.

The parent independently inspects the actual pinned image: distribution RepoDigest, local config digest, Linux/native architecture, exact image environment including pinned PATH, and supported declared volumes. The never-started inspection actor supplies only the fixed inventory and two original image-authority files. Inventory schema and the independently reviewed utility/launcher SHA256 constants are required; equality to caller bytes does not establish image authority. These actual observations alone feed `bind_runtime`.

The input volume is created only after inspection retirement. Stage actor mounts only that input volume RW at `/workspace`, with no Docker socket. Exact entrypoint/argv/environment, UID/GID, resources, mount requests/actual graph, tmpfs, caps/no-new-privileges and non-running state are checked before attachment. The parent sends the two fixed authenticated capsules, canonical descriptor, complete union/ELF and marker, then closes stdin. It requires exact stage admission, actual stdout EOF, successful attachment exit, authenticated stage removal and both name/ID absence before creating execution. Input-volume container references must be exactly the admitted current actor, or empty between actors.

Execution mounts the input volume RO at `/candidate-input`, the same volume's `candidate-source` subpath RO at the protected compiled root, a distinct RW work volume at `/workspace`, and the original daemon socket. Exact HostConfig.Mounts requests and actual Mounts RW/name/destination graph are checked. No extra writable alias, bind, anonymous mount, volume-from or subpath is admitted. Both live views are checked through actual mountinfo RO flags/device/root relation and matching directory device/inode, then fully read back before and after execution. No candidate source/authority/ELF copy enters work/cache.

`guest(descriptor: dict, deadline: float) -> dict` requires SDK Python3.12.3 and UID/GID1000. It verifies the independently bound inventory/image authority and measures the entire installed SDK source root with no source/cache exclusions, under existing512 MiB/100000-row/256 MiB-member bounds and direct alias grammar. Unsupported objects/links/closures refuse; no row is silently skipped. This SDK baseline is separate from candidate authority and is measured again after the command.

Guest preserves the original private cache2 GiB/250000-entry/depth32 primitives, actual vendored-protoc preflight based on the installed SDK lock, exact image PATH, private Elan/work/tmp setup, tool custody and original capture output. The candidate launcher imports the unchanged sibling JS supervisor, which invokes the unchanged Python supervisor. The only ELF admitted is `/candidate-input/current-test-elf`; the only work path is existing unaliased `/workspace/conditional-capture`. Exact original libtest argv, qualification profile,32 MiB aggregate logs, interruptions, timeout and result writer remain. The actual listing/count are checked by the unchanged semantics before the command. Successful admission still requires the original Python3.12.3 subreaper exhaustion result, actual summary, complete original receipt and all its retained-file joins.

Secondary evidence failures use an empty retained-record response while preserving both original stdout/stderr channels, then fail guest completion. Response framing headroom is checked before executing the command. Parent forwards log chunks as received, preserving already-read bytes on early EOF. On failures, original owned volumes retain actual command files; attachment diagnostics remain bounded1 MiB per attachment and are forwarded after cleanup. No failure creates a complete host envelope.

## Single deadline and finite reconciliation accounting

One absolute outer deadline is created at parent entry: `monotonic()+2400`. Work uses `outer-420-6`; the extra six seconds conservatively charge Task1's at-most1-second listing reap and at-most5-second immutable Git finalizer. Source measurement, snapshots, sender, readback and final pre-ack comparisons retain the main-thread SIGALRM contract. No foreign handler/timer/blocked alarm is admitted, and same-owner nesting clamps.

Bootstrap seconds and command seconds are floored from remaining absolute work time, never renewed to2400. The guest retains its inherited deadline. Every daemon adapter call uses at most10 seconds of `run_bounded` work plus its immutable at-most5-second failure reap, all clamped to remaining absolute time: total at most15 seconds per call. External termination signals are blocked across the bounded daemon client's handle acquisition/wait and delivered afterward; pending actor/volume identity is recorded first. Attachment Popen handoff similarly records custody before restoring signals. The real interruption control tests this handoff with an actual local Python child.

Failure reconciliation has a hard global18-daemon-call cap and two attachment retirement waits, each at most30 normal seconds plus5 forced-reap seconds, clamped to the same outer deadline. No retries. Crucially, creation barriers permit **at most one unretired actor**: inspection must retire before stage, stage before execute. Earlier retired actors are not re-removed.

| State at failure/completion | Maximum reconciliation daemon calls | Attachments potentially requiring cleanup wait |
| --- | ---: | ---: |
| Inspection create/read/ordinary retirement failure | 5 actor calls; no volumes exist | 0 |
| Input volume creation failure | 1 volume ownership inspection | 0 |
| Stage creation/transfer/ordinary retirement failure | 5 actor +1 retained-volume inspection =6 | 1 |
| Work volume creation failure after stage retirement | 2 retained-volume inspections | 1 already-completed stage attachment |
| Execution create/run/response failure | 5 actor +2 retained-volume inspections =7 | at most2 |
| Successful original capture and EOF | 5 actor +1 input-reference check +2 volume inspections +4 volume remove/absence calls =12 | at most2; normally already exited |

Actor five-call sequence: exact-name list, inspect/authenticate if present, remove if authenticated, name absence, ID absence. If a previously authenticated execution actor is already absent, successful cleanup uses3 actor calls instead, making total10. If pending creation has no recovered ID, retirement is uncertain and refuses; absence by name alone never authorizes success. Ambiguous/wrong owners are not removed. Both volumes are authenticated before either is removed. Failed/uncertain capture retains created volumes and reports nested-oracle retirement unqualified. A failure during final local publication after already successful daemon retirement can leave no envelope; it cannot resurrect removed volumes.

Original maximum reserve envelope remains18*15+2*35=340 seconds within420, with no increase. Actual implementation's serial creation barriers reduce the success daemon maximum to12. Normal inspection/stage retirement occurs within the work budget, not by consuming a new cleanup reserve. Final local publication is separately guarded by the same outer absolute deadline. No successful work proceeds after absolute expiry.

## Exact response and envelope contract for Task3

All new protocol/envelope hashes use Task1/unchanged `encoded`: sorted object keys, compact JSON, ASCII escapes including surrogate pairs, and exactly one final LF. Row order is UTF8 byte order; paths contain Unicode scalar values only. The existing Task1 descriptor, source-plan, runtime, source/fixture/union/authority rows, transfer manifest and stage-admission schemas/fields remain unchanged. `input_identities(source, executable, descriptor, deadline)` remains the mandatory four-argument interface.

Response schema is `prismpm/conditional-candidate-capture-response/1`. Its exact keys are:

```
schema, route, descriptor_sha256, source_sha256, union_sha256,
fixture_inputs_sha256, authority, sdk_tree, sdk_tree_sha256,
image_authority, readonly_views, payload
```

- `route` is `candidate-source-v1`; descriptor digest hashes the canonical full runtime-bound input descriptor.
- Source/union/fixture digests and fixed-order six-file authority rows exactly join the descriptor using canonical bytes.
- `sdk_tree` is the independent complete installed SDK-root inventory, in the existing strict row shapes. `sdk_tree_sha256` hashes its canonical row-array bytes. `image_authority` is the descriptor runtime's exact two observed image-authority rows.
- `readonly_views` is exactly `{input:"/candidate-input", compiled_root:descriptor.source_root, subpath:"candidate-source", same_directory:true, readonly:true, protected_ancestors:true}`. Boolean/integer aliases refuse via canonical comparison.
- `payload` is the **unchanged original response** with exact keys `result, executable_sha256, inventory_sha256, source_sha256, stdout_bytes, stderr_bytes, records`. Existing `checked_response`, `checked_result`, `checked_summary`, `checked_receipt` remain the semantic validators. Individual streams≤32 MiB, combined response streams≤64 MiB; launcher actual aggregate cap remains32 MiB. Guest cannot include `candidate-transport-evidence.json` in records.
- Wire order: canonical response LF, original stdout bytes, original stderr bytes, regular retained-record bodies in row order; parent then sends canonical `{retire:true}` and closes stdin. Guest requires that acknowledgement **and actual input EOF**, returns; parent requires actual output EOF and successful attachment wait. No response admits host retirement facts.

Separate retained filename: `candidate-transport-evidence.json`.
Schema: `prismpm/conditional-candidate-transport-evidence/1`.
Exact20 top-level keys:

```
schema, route, complete_application_accepted, scope, descriptor,
stage_admission, inspection, stage_retired_before_execution,
execution_mounts, readonly_views, sdk_tree, sdk_tree_sha256,
candidate_matches_sdk_tree, image_authority,
candidate_utility_matches_image, capture_receipt_sha256,
capture_records_sha256, result, owner_token, retirement
```

Field meanings and joins:

- `complete_application_accepted=false`; scope is exactly `current exact-source conditional capture in immutable SDK; not installed-controller acceptance`.
- `descriptor` is the full original runtime-bound canonical Task1 input object; `stage_admission` is the exact authenticated Task1 admission including `input_eof_observed=true` and descriptor/manifest joins.
- `inspection` has only `role="inspect", never_started=true, retired_before_stage=true, anonymous_volumes_absent=true`. These are parent observations whose live checks are described above, not cryptographic daemon attestation.
- `stage_retired_before_execution=true` records the actual creation barrier.
- `execution_mounts` is the ordered exact normalized request list validated against actual requests/graph:
  1. `{Type:"volume", Source:<prefix>-input, Target:"/candidate-input", ReadOnly:true}`.
  2. `{Type:"volume", Source:<prefix>-input, Target:descriptor.source_root, ReadOnly:true, VolumeOptions:{Subpath:"candidate-source"}}`.
  3. `{Type:"volume", Source:<prefix>-work, Target:"/workspace", ReadOnly:false}`.
  4. `{Type:"bind", Source:"/var/run/docker.sock", Target:"/var/run/docker.sock", ReadOnly:false}`.
- `readonly_views`, `sdk_tree`, `sdk_tree_sha256`, `image_authority`, and `result` exactly equal checked response values. Result remains the complete unchanged original successful result/exhaustion structure.
- `candidate_matches_sdk_tree` compares canonical descriptor union rows with independent complete SDK-tree rows. This is a separate equality observation, never a requirement to treat candidate source as image-owned. `candidate_utility_matches_image` compares the fixed candidate utility authority hash with observed image utility hash; both independently require the unchanged pinned utility digest.
- `capture_receipt_sha256` hashes actual retained original `capture-evidence.json` bytes. Its schema/meaning remain untouched.
- `capture_records_sha256` hashes the canonical **guest-returned records before this envelope is added**. No self-digest/circular capture tree. Original capture plus envelope must still fit512 MiB/100000 rows; the envelope itself≤32 MiB. Outer owner must subsequently include the envelope in its independently retained tree.
- `owner_token` is32 lowercase hex; `<prefix>` is `prismpm-candidate-` plus that token. Actors are named `<prefix>-inspect`, `<prefix>-stage`, `<prefix>-execute`; volumes `<prefix>-input`, `<prefix>-work`.
- `retirement` has exactly `actors, volumes, attachment_eof_observed, cleanup_daemon_calls`. Actors are ordered inspect/stage/execute rows with only `{role,name,id,absent:true}`; IDs are complete64 lowercase hex. Volumes are ordered input/work rows with only `{role,name,absent:true}`. `attachment_eof_observed=true` only after both actual stage/execute EOF observations. `cleanup_daemon_calls` is actual counted final-reconciliation calls, globally≤18; this implementation's successful path produces10 or12 as detailed above. Ordinary earlier inspection/stage retirement calls are inside the work budget and are not this final counter.

The host constructs this envelope only after original tree/receipt/result/summary/source checks, both actual EOFs, all actor absences, both volume retirements and diagnostic closure. It writes/read-verifies a private pending file and atomically renames; timeout/failure removes only an authenticated own partial publication. There is no successful full envelope fixture claimed in this task. Atomic publication mechanics tests use explicit `unit fixture` bytes, which are not valid envelope schema.

Task3 must independently reproduce framing/row normalization, join private source/ELF and all six authority files, enforce the stricter runtime root grammar, verify original receipt/inventory/lock and these closed source/runtime/retirement fields, recompute pre-envelope capture records, and include the envelope in outer custody. The independent reader can validate bindings/shapes; JSON alone cannot prove historical daemon state.

## Red/green controls and retained evidence

Evidence directory: `/workspace/diagnostic-tools/candidate-capture-lifecycle`.
Index: `index.json`, SHA256 **`5cd09b11bd4eee217a4731be5249e9513d7e07b31c6a83798cb8192301eb7d2a`**. It indexes exact bytes/hashes of logs, command metadata, reviewed staged diff, runner, final source/immutable state and the accidental-client note; it does not self-hash. All commands below ran in `/workspace/scratch/prismpm-numeric`.

Initial red:

```
python3 -I -B scripts/conditional-capture-candidate.test.py ProtocolControls.test_lifecycle_policy_primitives_exist
```

`01-red.stderr`: one test ERROR, missing `ENVELOPE_NAME` before lifecycle implementation. Expanded development `02` later had28/29 pass and one stale expected refusal-string failure, corrected without weakening behavior.

Focused red for missing pre-attachment created-state check:

```
python3 -I -B scripts/conditional-capture-candidate.test.py LifecycleControls.test_started_actor_refused_before_attachment
```

`03-red-attachment.stderr`: one test FAIL (`RuntimeError not raised`). Guard was added, together with unexpected-Docker spawn protection. Important accidental-client limitation below. Initial development shells displayed logs using `cat` after the test, so their tool-visible shell status was0 and the individual Python wait status was not separately retained. Their original unittest failure/pass output remains authoritative about assertions; metadata honestly records status=null rather than inventing captured wait statuses. Final runner records exact separate statuses.

Final candidate command:

```
python3 -I -B scripts/conditional-capture-candidate.test.py
```

`11-final-candidate`: **exit0,48 tests in5.528s, OK**. Includes all original28 Task1 controls plus20 lifecycle/response/publication controls: exact create/inspect/attach order; never-started fixed inspection reads; unexpected actual volume and writable mount policy; wrong role/config/image/env/argv/resources; inspection/stage barriers; pending creation and both absence checks; wrong owner/no-delete; stage removal failure blocks execute; extra input-volume reference; both volume ownership checks before deletion; failure retention and exact12-call success transcript;18-call/insufficient-time refusal; real child timeout kill/reap; real SIGTERM during attachment handoff with child retained and reaped; real partial stream EOF preservation; exact response/scalar bindings and host-envelope refusal; expired/occupied atomic local publication. Structural daemon controls intercept Docker process creation; they are policy unit evidence, never daemon enforcement proof.

Launcher command:

```
node --test scripts/conditional-capture-candidate-command.test.mjs
```

`08-launcher`: **exit0,4 tests,4 pass,0 fail**. Tests an in-memory copy with explicit substitute filesystem/supervisor dependencies to check exact invocation/output semantics and refusal variants; original on-disk launcher and both supervisors remain untouched. One real Node process invokes the actual launcher with a wrong ELF path and refuses before supervisor start. There is no claim that the host ran a successful qualified supervisor or ELF capture.

Unchanged original helper suite:

```
python3 -I -B scripts/conditional-capture-sdk.test.py /workspace/scratch/prismpm-numeric/target/debug/deps/prismpm-e88e534b42a91ec6
```

`09-legacy`: **exit0,30 tests in12.827s, OK**. ELF SHA256 remains `783031fadbb67384d7ffdbd6a06c89db699771d25bb63ab419ba999c26554749`. This is the existing real original library ELF argument, not a rebuilt candidate ELF. The genuine original capture case and all22 application mutation/refusal outcomes were **not executed** by this helper suite or by Task2; their source bytes are unchanged.

After final implementation edits, the candidate suite was rerun as11. Launcher and immutable legacy suite were not unnecessarily repeated after later changes confined to candidate helper/controls. `git diff --check` and staged diff check passed. Complete owned diff was self-reviewed for authority, stage/execution barriers, deadlines, diagnostics, source closure and envelope publication before the explicit five-path commit. Independent review is the controller's next gate.

### Accidental local Docker-client attempt — disclosed limitation

During red03, a missing pre-attachment state guard meant a structural test accidentally reached real Popen before that test installed an unexpected-Popen guard. Exact argv:

```
docker --host unix:///var/run/docker.sock start --attach --interactive 3333333333333333333333333333333333333333333333333333333333333333
```

The original retained stderr later received the **actual daemon response**:

```
Error response from daemon: No such container: 3333333333333333333333333333333333333333333333333333333333333333
```

No create/pull/build was issued. A later read-only `ps -eo pid,ppid,args` found no matching client remaining. The failed control did **not** capture the client's PID or original wait status before the test runner exited; **client reaping is not verified**. No unrelated processes or actors were touched. Do not describe this as zero Docker contact, a successfully reaped client, or SDK qualification. The daemon's explicit no-such-container response is the measured result. The suite-wide structural lifecycle Popen guard, focused unexpected-Popen check and new pre-attachment created-state check prevent recurrence. Separate subsequent real local-Python child controls do demonstrate their own kill/wait/reaping, not retroactive custody of this client.

## Immutable hashes and actual/deferred gates

All following bytes equal the base via direct `git show BASE:path` comparison:

| Path | SHA256 |
| --- | --- |
| `scripts/conditional-capture-sdk.py` | `ca09b9de3bf57c3e2dc16e11d4d1a527b9b2f1f271566bb7a87846d0a24f8e9a` |
| `scripts/conditional-capture-command.mjs` | `ac11aadd31f0a3e40df7866cc7690be8e7c8c252120146d718471358840ed6dd` |
| `scripts/sdk-command-owner.mjs` | `79e017eeb59107064fbd5917b09e63259dcf47fe9ecdda1ff3db759944794308` |
| `scripts/sdk-command-owner.py` | `ca3517a446b8082856e2e952a811a81436aabfd9a71b4414e3298d202aea8854` |
| `scripts/conditional-capture-sdk.test.py` | `5496370f42dd452c49af03eab4d4fd375e709884db1710d1bbeed9c04c1ec785` |
| `crates/prismpm/src/oci/publication_context/capture_tests.rs` | `d384f78d7a6c9c0e3a6ef751dd06e1b4ec3dec583f8ed71c8abee348fda10c09` |

New committed file byte counts/hashes are indexed in `13-final-state.json`; candidate module78136 bytes, bootstrap8005 bytes, both within fixed1 MiB/32 KiB limits. Source commit/tree and clean status are recorded there.

Actual local interpreter versions: bare Python3.12.14, `/usr/bin/python3`3.13.5, Node24.22.1. Neither Python is SDK3.12.3; the host procfs/supervisor limitation was not bypassed and no original subreaper policy was weakened.

Task4 must still establish on actual unchanged d6/native architecture:

- Positive same-PID bootstrap under pinned Python/UID/GID, complete actual candidate source/fixture/authority/ELF admission and actual input EOF.
- Actual never-started inspection state, fixed tmpfs suppression of declared anonymous volume, actual image/config/inventory/authority observations and authenticated inspection absence before stage.
- Actual stage retirement and absence before execute, daemon/API `volume-subpath` support, protected mount destination creation/ownership, exact inspected mount graph and mountinfo relation; actual same-UID write/chmod/link/rename/ancestor-redirection attempts must fail through all candidate views.
- Complete actual SDK-root inventory fitting unchanged bounds/alias/object rules; unsupported closure refuses precisely. Actual10 GiB free space at both stage and execute, original private cache/protoc/tool pins, actual qualified supervisor exhaustion.
- Actual extra-writer, pending create, removal failure, attachment interruption/timeout and uncertain ownership injections, demonstrating bounded authenticated cleanup and failure volume retention with the real daemon.
- Genuine exact original capture in unchanged d6 using the fresh exact source-owned ELF; all original receipt/source-free/external-oracle/22 graph-refusal controls and actual final actor/volume retirements.
- Task3 independent JS reader, owner/replay controls, final source snapshot and required full-VV gates.

No production admission, installed-controller acceptance, source-free compiler runtime, malicious-daemon isolation, universal arithmetic, multi-architecture success or full-VV result follows from this local work. The original privileged oracle socket remains explicitly part of conditional test infrastructure.
