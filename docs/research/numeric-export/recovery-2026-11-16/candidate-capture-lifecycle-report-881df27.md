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

## Fix round1 — descriptor-bound retirement and bounded diagnostic ownership

Status: **DONE_WITH_CONCERNS**, ready for scoped independent re-review of both P2 findings. This appendix supersedes the initial report's retirement ACK and inherited-stream diagnostic behavior; historical logs and limitations above remain intact.

Fix base `0c3fa37b598e0ded05fdfd7437ef8b9ae379f94a`; commit **`bc049680103bbaf285a5582a346a73f4d2f790e4`**, tree **`1f3f4b6d244414c422115a842949d39e4a46ac3c`** (`Bind candidate retirement and retain diagnostics without sink waits`). Only candidate helper and candidate Python controls changed. Source worktree clean. Available space recorded10,841,464,832 bytes, above8 GiB. No Docker command, pull, broad build, push, PR or subagent in this fix round.

Read both findings in full from `task-2-review.md`; implemented both. Controller additionally ruled the deterministic diagnostic sibling and token/manifest discovery contract described below. No pin, resource, capture/protocol limit, outer deadline or reconciliation budget was increased. All four immutable authority files, original Python/Rust capture tests, bootstrap and candidate launcher/tests remain byte-equal to the fix base.

### Finding1 disposition and final wire correction

The guest's new `receive_retirement(reader, descriptor)` compares canonical bytes against `retirement_control(descriptor)`, then requires actual EOF using the existing Reader. The parent uses that same fixed producer shape at its own endpoint. The **exact closed ACK** is now:

```
{"descriptor_sha256":"<sha256 of canonical full current input descriptor>","retire":true}\n
```

The displayed `\n` is one final LF byte, not a literal backslash sequence. Only two keys are permitted: `descriptor_sha256` and `retire`. `retire` must be JSON boolean true; integer1, float1.0, omitted/mismatched digest, missing retire, extra fields and trailing bytes refuse. The digest is the current runtime-bound input descriptor's existing canonical digest, not a source-plan digest or a previous descriptor. `retirement_control` returns that object; `receive_retirement` accepts it only after exact canonical comparison and actual EOF under the reader's existing deadline. No schema/fields changed in the original receipt, the12-field candidate response, or20-field complete transport envelope.

Real OS-pipe controls cover both numeric aliases with and without digest, the old missing-digest ACK, wrong digest, missing retire, extra fields, trailing bytes, a valid control with actual EOF, and a valid control whose writer withholds EOF. Withheld EOF refuses on the existing deadline. All these tests use the actual canonical Reader; no SDK execution or successful envelope is implied.

### Finding2 disposition: retention before forwarding, reconciliation before sinks

The candidate route no longer enters `legacy.infrastructure_diagnostics()` or an ExitStack that flushes inherited stderr. The immutable helper is unchanged. `Diagnostics` owns fixed unbuffered regular files, and attachment stderr continues to be bounded at its actual writer by the original1 MiB RLIMIT_FSIZE. The parent retains original capture/exception bytes in those files; it does not write or flush Python's inherited buffered output streams during active actor custody.

After all authenticated reconciliation attempts finish, the owner marks diagnostics eligible for forwarding. The parent then closes attachment handles, validates/reads the bounded files, and forwards only through `nonblocking_forward`: original FD blocking state is saved, O_NONBLOCK is set, writes are at most4096 bytes each, and EAGAIN/broken pipe returns immediately. The original FD state is restored. There is **no select/sleep/retry waiting for downstream capacity**. The same absolute outer deadline guards regular-file retention/reads and forwarding; expired forwarding does no new work. Already retained bytes are never removed because a sink is blocked or the deadline has expired.

Failure/volume-retention messages are spooled after reconciliation; named parent exception stdout/stderr forwarding was moved out of `_parent`'s pre-finally exception block into the public parent's handler, after `_parent` has reconciled actors. Actual original exception streams are preserved in separate fixed files. Bounded daemon nonzero results carry their original stdout/stderr as exception attributes rather than constructing an unbounded textual stderr message. Owner text has its own1 MiB cap with explicit truncation marker; original stream files have their existing caps.

Capture stdout/stderr are now retained while receiving, then forwarded after reconciliation. This preserves the original bytes and summary checks without allowing inherited stdout backpressure to hold a live execution actor. Original command-log aggregate32 MiB and response-stream combined64 MiB bounds remain unchanged. Attachment diagnostics are closed before envelope construction. All retained-channel reads/forwarding are attempted before complete envelope publication; the final successful `Diagnostics.close()` only releases unbuffered handles already processed, so it cannot introduce a late inherited-sink wait or diagnostic-read expiry after publication. Failure/expired close still releases handles and retains their files. There is no automatic deletion of these diagnostic artifacts.

The normal bootstrap's own error writer still targets the parent's owned bounded attachment file, not a stalled inherited pipe. Protocol stdout continues to use the unchanged deadline-aware `write_bounded`. The candidate CLI's terminal error path is also candidate-owned/nonblocking; it does not add an ordinary blocking print or traceback fallback. Host-side output is best effort after reconciliation, while retained files remain the byte source.

### Exact diagnostic discovery and custody contract for outer owners

Once the existing capture output is validated as fresh, absolute, unaliased, owned and private, diagnostics allocate the exclusive mode0700 sibling:

```
<validated absolute capture output>.candidate-diagnostics
```

For example an output `/tmp/owned-capture` has sibling `/tmp/owned-capture.candidate-diagnostics`. This path is derived; no arbitrary diagnostic destination argument exists. Occupied or aliased siblings refuse before image/actor work. The source/ELF measurement now follows output/diagnostic ownership establishment. The sibling is wholly outside the original capture tree, records and envelope, and must not be added to the pre-envelope capture digest.

A fresh random32-hex token is shared by Diagnostics and Lifecycle. Directory creation/open uses an exclusive mkdir and no-follow directory FD. The owner holds directory device/inode/mode/UID/GID, creates only fixed names relative to that held directory FD with O_EXCL/O_NOFOLLOW, and holds file ownership identities. Path resolution, actual lstat and fstat must continue to identify the same owner; a renamed/replaced directory is refused rather than adopted. Mode0600 files and single-link bounded readback are preserved. No unknown directory/file is removed.

Before image/actor work, `manifest.json` is written canonically with exact keys:

```
schema, owner_token, complete_application_accepted, channels, aggregate_limits
```

- Schema is `prismpm/conditional-candidate-diagnostics/1`.
- `owner_token` equals Lifecycle token; `complete_application_accepted=false`.
- `channels` is an ASCII/UTF8 path-sorted array of exact `{path,maximum_bytes}` rows for the following closed set. A channel may be absent if no corresponding bytes were produced.

| Fixed filename | Maximum bytes |
| --- | ---: |
| `capture.stderr` | 33,554,432 |
| `capture.stdout` | 33,554,432 |
| `exception.stderr` | 33,554,432 |
| `exception.stdout` | 33,554,432 |
| `execute.stderr` | 1,048,576 |
| `owner.stderr` | 1,048,576 |
| `stage.stderr` | 1,048,576 |

- `aggregate_limits` is exactly `{capture:67108864,exception:33554432}`. These retain the original combined response/control ceilings; actual command aggregate cap remains32 MiB, and actual listing exception streams remain bounded by their original aggregate1 MiB producer. Attachment writers remain individually1 MiB. `manifest.json` itself is bounded1 MiB (the actual current manifest is572 bytes).
- The manifest declares ownership/limits, **not stream completeness, successful retirement, or capture acceptance**. It is recorded before work and is not rewritten at expiry; actual existing bytes can be read and independently indexed by the outer owner under the declared bounds.

`Diagnostics.locator()` returns the exact keys:

```
schema, owner_token, directory, manifest, manifest_sha256,
complete_application_accepted
```

Schema is `prismpm/conditional-candidate-diagnostics-locator/1`; `directory` is the exact absolute location above; `manifest="manifest.json"`; `manifest_sha256` hashes canonical manifest bytes; acceptance is false. A directly called Python parent attaches this locator to a raised exception as `error.candidate_diagnostics`. CLI outer owners derive the sibling from their already-known validated output path and read its manifest; no stdout receipt and **no global /tmp scan** is necessary. The parent owner-information channel also records the exact directory, but discovery does not depend on that channel being writable.

Early failures before output custody can use the exclusive fallback `/tmp/prismpm-candidate-diagnostics-<owner_token>` and the direct exception locator. **No actor/volume has been created at that point**, and no complete capture exists. The fallback does not authorize directory scanning. If expiry precedes any allocation, a planned locator alone does not claim files were created. Once actor work is possible, the deterministic sibling and manifest already exist.

For Task3/4, retain/index these diagnostics separately from original capture evidence. Do not treat the diagnostic manifest as a transport envelope, add diagnostic files to original capture-record hashes, or infer process/daemon success from their existence. The current successful envelope/response schemas are unchanged; only the ACK wire and auxiliary failure/diagnostic discovery contract changed.

### Exact red/green and real bounded-pipe evidence

All commands ran in `/workspace/scratch/prismpm-numeric`. Additive evidence is under `/workspace/diagnostic-tools/candidate-capture-lifecycle/fix-1/`; the initial parent index remains unchanged.

Before repairing behavior, the existing ACK predicate was extracted into the named control helper without semantic changes, then two focused regressions were run:

```
python3 -I -B scripts/conditional-capture-candidate.test.py ProtocolControls.test_retirement_ack_exact_boolean_descriptor_binding_and_actual_eof ProtocolControls.test_real_saturated_failure_sink_does_not_block_retirement
```

`01-red`: **exit1,2 tests, FAILED(failures=4,errors=1)**. Integer/float/missing-digest ACKs were accepted and the sender lacked descriptor binding. The actual child filled stderr, used a0.15-second owner deadline, remained blocked beyond its parent's0.8-second wait, and required the regression's owned-child kill/wait cleanup. Exact stdout/stderr/status are indexed; unlike initial Task2 development commands, fix-round command statuses are separately captured.

After repair, the same focused command (`02-focused`) exits0. Expanded real pipe/closure/exception controls (`03-focused`, then05 after token/retention tightening) pass. Covering04 recorded52 passing controls; after sibling/no-follow custody tests, covering06 recorded54. Final self-review moved all retained-channel reads before envelope publication, followed by the final covering command:

```
python3 -I -B scripts/conditional-capture-candidate.test.py
```

`08-final`: **exit0,54 tests in6.182s, OK**. All previous48 controls remain; six new methods cover exact ACK/EOF semantics, saturated failure reporting, saturated attachment/exception/capture closure, and deterministic sibling/manifest/occupied/aliased/replaced-owner refusal. Saturated controls fill both real stdout/stderr pipes without draining them, use a0.15-second diagnostic deadline, require bounded exit, actual wait/reaping, restored FD state, exact retained bytes/manifest token joins and no complete envelope. The exception control invokes the actual public parent handler around an explicitly substituted failing inner operation and proves reconciliation precedes exception forwarding. It is a local process/control test, not daemon qualification.

A standalone retained probe provides exact PID/status/timing/byte evidence:

```
python3 -I -B /workspace/diagnostic-tools/candidate-capture-lifecycle/fix-1/07-probes.py
```

`07-probes`: exit0. Four real child processes each saturated stdout and stderr to **65,536 bytes each**, without the parent draining either until exit. With a0.2-second outer diagnostic budget:

| Probe | Child elapsed seconds | Wait status | Reaped | Retained evidence |
| --- | ---: | ---: | --- | --- |
| finish | 0.0013291720024426468 | 0 | true | manifest and84-byte owner failure message |
| attachments | 0.0014307269957498647 | 0 | true | manifest, owner message, exact27-byte stage and29-byte execution diagnostics |
| exception | 0.001613120999536477 | 0 | true | manifest, owner message, exact15-byte original stdout and15-byte stderr |
| expired attachment closure | 0.0009711820021038875 | 0 | true | manifest, owner message and23 bytes written before expiry |

All recorded `fds_restored=true` and `no_envelope=true`. Exact manifests/channel files, PIDs, statuses, retained-byte hashes, source probe and observations remain inside the additive evidence directory and are indexed. This demonstrates the observed ordinary-pipe backpressure fix; it does not claim bounded arbitrary kernel-uninterruptible I/O or actual Docker cleanup/mount behavior.

### Scope, evidence hashes and remaining gates

The launcher, bootstrap and all immutable legacy source/tests were unchanged, so their covering suites were **not rerun** in this fix round. Prior4/4 launcher and30/30 legacy evidence remains attached to identical bytes. The changed candidate helper/controls were covered by the final54-test run. `git diff --check` and staged check passed; the complete two-file delta was self-reviewed and committed explicitly.

Additive index: `/workspace/diagnostic-tools/candidate-capture-lifecycle/fix-1/index.json`, **44 entries**, SHA256 **`c9ef6a66113680a7356995850cf3117bc3561098c3587ca835e52bf407c63597`**. It records all exact command/status/log files, real probe artifacts, reviewed diff and final source/immutable state. It does not self-hash. Initial index remains `5cd09b11bd4eee217a4731be5249e9513d7e07b31c6a83798cb8192301eb7d2a`.

Committed candidate helper:90,597 bytes, SHA256 `5ddc34a6a4dcec92e9303219158e88131c4bf19d12cd4aab85816d08a09fb250`. Candidate controls:75,253 bytes, SHA256 `ce74ad11436f9495b7351f3568d1a3d5a01ed7361809d0aebae68c38c1a08151`. Module remains below1 MiB. Final state includes direct base-byte comparisons for all original immutable files, original Python/Rust tests, bootstrap and launcher/test.

All original Task3 independent-verifier and Task4 actual unchanged-d6/bootstrap/mount/daemon/source/ELF/original-capture/22-refusal/full-VV gates remain outstanding. No actual SDK success is newly established, and this fix does not alter the previous accidental-client limitation. Scoped independent re-review of both findings remains required.

## Fix round2 — retain daemon streams before reconciliation wrappers replace errors

Status: **DONE_WITH_CONCERNS**, ready for scoped re-review of the new P2. Both original review findings were independently ADDRESSED in fix1 and remain unchanged. Re-read the fix-loop guidance and the complete fix1 re-review appendix, including its exact actual-call/finish/Diagnostics reproduction.

Base **`89d15ce4c2604033689acb097bf0f5279751640f`**, including the independently reviewed five-file shared-golden import. Fix commit **`881df278923ff271fc179703e55ea91c45f2394d`**, tree **`ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4`** (`Retain daemon failure streams before reconciliation aggregation`). Only the candidate Python helper and controls changed. Source worktree clean; recorded free space10,830,467,072 bytes. All nine protected helper/bootstrap/launcher/test paths and all five imported golden files directly compare byte-equal to the base. No Docker, SDK pull, source/golden rebuild, push, PR or subagent occurred in this round.

### Disposition and unchanged contract

`Lifecycle.call` now retains each actual nonzero daemon response's stdout/stderr through `Diagnostics.retain_exception_streams` **at observation**, before raising the operation error. Consequently a later `finish` catch can aggregate error messages without discarding the already-owned bytes, and a cleanup error can supersede an earlier operation exception without erasing that earlier response. The generic operation error no longer claims “original streams retained.”

Each completely written exception channel is marked on its original error object with this diagnostic owner's token. A later public-parent/direct diagnostic handler skips those already-retained channels rather than appending them twice. Raw stdout/stderr from successive failures append to their existing respective exception files in observation order. No new stream framing, file, manifest field or public response/envelope field was introduced.

Retention still uses the original fixed per-channel and cumulative exception32 MiB cap and the original absolute deadline. It does not forward anything to an inherited sink during active reconciliation. All inherited output still runs only through the post-reconciliation nonblocking forwarding path accepted in fix1.

If a stream cannot be completely retained because the existing cap/deadline or filesystem operation fails, Diagnostics records an in-memory incomplete-retention state. The daemon operation retains its original failure and adds a precise `diagnostic retention incomplete` explanation; it is not replaced by the logging error. `finish` therefore continues its remaining safe authenticated reconciliation calls. Later owner error text explicitly reports `original exception stream retention incomplete (bound/deadline or I/O failure)`. Already-owned bytes remain intact. The implementation does not claim all streams were retained when the cumulative cap is exhausted, enlarge that cap, or invent missing bytes. Actual partial I/O failures remain marked incomplete even if a later handler retries; only fully retained channels receive the deduplication mark.

The deterministic sibling, shared token, no-follow identities, manifest/locator schemas and discovery rules, retention channels/caps, ACK descriptor binding, response/envelope schemas, original receipt semantics, original18-call/420-second reserve/2400-second total budget, and reconcile-before-forward ordering are unchanged. All Task3/4 contract guidance from fix1 remains applicable.

### Focused regression and exact red/green evidence

Evidence directory: `/workspace/diagnostic-tools/candidate-capture-lifecycle/fix-2/`. Cwd for all commands: `/workspace/scratch/prismpm-numeric`.

Focused regression:

```
python3 -I -B scripts/conditional-capture-candidate.test.py LifecycleControls.test_actual_call_reconciliation_preserves_multiple_failure_streams
```

`02-red`: **exit1,1 test, FAILED(failures=1)**. Through the actual `Lifecycle.call`, actual `finish(False)` and actual Diagnostics implementation, a structural nonzero `run_bounded` return supplied distinct markers for an earlier image operation and both later volume inspections. The later handler retained only `b'out-1\n'`; expected `b'out-1\nout-2\nout-3\n'`. The retained cleanup error still falsely said “original streams retained.” The precursor `01-red` also failed but had an incidental list/tuple assertion mismatch in the new test; that test assertion was corrected before the substantive02 red. Both original outputs/statuses are preserved.

After the custody fix, `03-focused` is **exit0,1 test, OK**. The final regression uses a real Python `finally` to let the cleanup exception supersede the earlier operation error, then verifies exact bytes from all three failures, two subsequent cleanup attempts, no duplicate bytes when the earlier error is handled again, reconciled state and no complete envelope. Only `legacy.run_bounded` is replaced with an explicit nonzero CompletedProcess; actual call/finish/Diagnostics and actual regular files are exercised. The existing structural-test Popen guard prevents real Docker.

Expanded focused command:

```
python3 -I -B scripts/conditional-capture-candidate.test.py LifecycleControls.test_actual_call_reconciliation_preserves_multiple_failure_streams LifecycleControls.test_daemon_stream_cap_preserves_owned_bytes_and_continues_reconciliation
```

`04-focused`: **exit0,2 tests, OK**. The cap test writes actual bounded file bytes until only4 bytes of the existing32 MiB exception aggregate remain. It retains the next4 stdout bytes, refuses further stderr/cleanup streams at the unchanged cap, preserves the original prefix and final4 bytes exactly, continues both later volume-inspection calls, reports incomplete retention explicitly, performs no pre-reconciliation forwarding, and creates no envelope. Its large fixture is cleaned by its own test owner without forwarding32 MiB into evidence logs.

Final covering command:

```
python3 -I -B scripts/conditional-capture-candidate.test.py
```

`05-covering`: **exit0,56 tests in6.492s, OK**. All previous54 controls, including the real saturated-pipe/ACK/deadline/ownership controls, remain green; two narrow custody/cap controls were added. No other suite was rerun because launcher, bootstrap and immutable legacy authority/tests did not change.

A retained small structural-response probe follows the review composition and records exact resulting files:

```
python3 -I -B /workspace/diagnostic-tools/candidate-capture-lifecycle/fix-2/06-probe.py
```

`06-probe`: **exit0**. Actual call/finish/Diagnostics observed three explicit structural failure responses in order: earlier image inspect, input-volume inspect, work-volume inspect. Final cleanup counter is2; reconciliation completed its attempted calls; `retention_incomplete=false`; `no_envelope=true`. The actual sibling contains the canonical572-byte manifest,288-byte owner message file, and both exact48-byte response streams:

```
exception.stdout: actual-stdout-1\nactual-stdout-2\nactual-stdout-3\n
exception.stderr: actual-stderr-1\nactual-stderr-2\nactual-stderr-3\n
```

Their SHA256s are respectively `419aeb936eaacbafa7f7226b247c996b44f1c3554a7b31b74a56fe6940f91d32` and `dac1f9fde6386921bc7b89889e61d31eeb6b79388293bac7fa6a400a288f078c`. The probe source, complete stdout/stderr/status, actual sibling files, manifest/locator/token, events and byte hashes are retained and indexed. No subprocess/daemon was invoked by that probe; it is diagnostic custody evidence, not actual daemon qualification.

### Evidence/scope audit and remaining gate

`git diff --check` and staged check passed. The small complete two-file diff was self-reviewed before explicit commit. All immutable authorities, original Python/Rust capture tests, bootstrap and candidate launcher/test remain unchanged. The exact imported golden paths also remain unchanged: `tests/golden/stdlib/{build/manifest.json,build/model.prism.json,golden-manifest.json,verified/lexlean-attestation.json,verified/manifest.json}`.

Additive index: `/workspace/diagnostic-tools/candidate-capture-lifecycle/fix-2/index.json`, **25 entries**, SHA256 **`24390e0e32fcb7eac39a3429750e2dc22a3647b1955d017338c25c1f4b911b2f`**. Earlier evidence/indexes remain unchanged.

Committed helper91,898 bytes, SHA256 `25c3577471562d41cb8a2d0ec110663d739f03daa53020f7cac663f9988ec4b4`; controls79,075 bytes, SHA256 `3599cf8507b9761a5d6b266a7efd236cda3eb1920067514c96c8f6a188096399`. Exact source/tree/clean status, disk reserve and all protected byte comparisons are in `08-final-state.json`.

The new P2 is implemented and locally covered; independent scoped re-review remains the acceptance gate. No actual SDK/bootstrap/mount/daemon capture, original22 application-refusal outcomes, Task3 independent verification or full-VV gate is newly claimed. Earlier actual-SDK and accidental-client limitations remain unchanged.
