# NEXP013 Task2 independent spec and quality review

Reviewed `bb33f7f86c24e7f4eddb75a48f8ade0a2f8cb702` → `0c3fa37b598e0ded05fdfd7437ef8b9ae379f94a`, final tree `36b095c44de929e12d5b1bb00dd7c53f8e8b60cb`, on 2026-11-17. Source, index and HEAD remained unchanged. No Docker, build, subagents, push, or passing-suite rerun. Only this review report was authored; two narrow local pipe probes resolved concrete unanswered concerns.

**SpecCompliance: CHANGES REQUIRED.** The principal authority/lifecycle design and controller rulings are implemented, but the retirement control is not the specified closed, descriptor-bound acknowledgement, and synchronous diagnostic writes can escape the single absolute deadline.

**Quality: CHANGES REQUIRED.** The implementation is carefully scoped, reuses the unchanged validators and supervisor closure, and reports component evidence honestly. Two missing negative controls expose actual protocol/deadline gaps. Neither finding establishes a false successful SDK capture; both should be fixed before freezing the Task3 contract and proceeding to actual Task4 qualification.

## Findings

### P2 — Retirement acknowledgement accepts numeric boolean aliases and omits the specified descriptor binding

Locations: `scripts/conditional-capture-candidate.py:860` and `:1358`.

The new guest compares the decoded control with `{"retire": True}` using Python equality. Canonical framing alone does not enforce JSON scalar types: both canonical `{"retire":1}\n` and `{"retire":1.0}\n` pass that comparison and the subsequent actual EOF check. This violates the implementation report's exact boolean control contract and the design's requirement that a malformed control channel fail capture. This is the same class of cross-language scalar ambiguity that accepted Task1 fixed for redundant rows; the response's `readonly_views` correctly uses canonical comparison, but this new control does not.

Additionally, the binding design's “Closed input protocol and complete source materialization” section explicitly requires a **descriptor-bound `retire` acknowledgement**. Both sender and receiver currently carry only `retire`; the report cannot silently replace that named design requirement. The dedicated pipe is session-associated, but there is no checked descriptor field in the control bytes.

Focused `ACK_CHECK` used the real unchanged canonical `Reader`, real OS pipes with actual EOF, and the exact predicate at line860. It accepted both integer and float controls. This was a direct decoder/predicate probe, not a successful guest execution, SDK-pin bypass, or complete-envelope fixture.

Fix the candidate-only control to have a closed key set, exact boolean semantics and the current descriptor digest; compare canonical bytes or explicitly validate exact types. Update both endpoints and the report's finalized wire contract. Add negative real-pipe controls for integer/float aliases, missing/wrong descriptor digest, extra fields and trailing bytes. Preserve the original four authority files.

### P2 — Failure diagnostics can block beyond the absolute cleanup deadline

Locations: `scripts/conditional-capture-candidate.py:1147–1148`, `:1363–1368`, and `:1374–1377`.

Daemon calls and attachment waits have explicit remaining-time limits, but the cleanup path still performs ordinary blocking writes to inherited output pipes. `Lifecycle.finish(False)` prints its failure/volume-retention message without a deadline. The parent's `diagnostics.close()` invokes the unchanged diagnostic context manager's blocking `sys.stderr.buffer.write/flush` outside any `deadline_scope`; exception stream forwarding is also outside a guard. During the finalizer, HUP/INT/TERM are ignored. A full or stalled inherited stderr pipe can therefore hold the capture parent indefinitely after the advertised outer deadline, despite the finite daemon-call table. This is ordinary pipe backpressure, not an uninterruptible-kernel or hostile-daemon hypothetical.

Focused `PIPE_PROBE` ran the actual candidate `Lifecycle.finish(False)` in a real local Python child with no actors or volumes and a deadline 0.1 seconds ahead. The child filled its actual stderr pipe (65,536 bytes), restored blocking mode, announced readiness on stdout, then entered `finish(False)`. It remained blocked after **0.703 seconds**, never reached the return marker, and required the probe parent's SIGKILL; that exact local child was waited/reaped with status -9. No Docker method was called or mocked. This proves the unbounded write directly; the sibling `diagnostics.close()` path has the same blocking sink and no enclosing guard by source inspection.

Use candidate-owned bounded diagnostic forwarding under the existing absolute deadline, retaining diagnostic bytes in an owned file/volume when the downstream sink cannot accept them. Do not allow logging to prevent authenticated actor reconciliation; do not alter the immutable legacy diagnostic helper to achieve this. Include a real saturated-pipe control for failure reporting and attachment-diagnostic closure, asserting bounded termination, retained diagnostics, and no complete envelope. The daemon-call budget itself need not change.

## Accepted implementation boundaries

- **Inspection authority:** actual pinned distribution/config/native platform and image environment are inspected before the distinct never-started actor reads the three fixed paths. Created/never-started/PID0 state is checked before each read; independently pinned helper/launcher hashes anchor authority. Inspection has no named-volume/socket mount and has fixed workspace tmpfs suppression. Authenticated name/ID absence precedes descriptor-bound staging. Actual tmpfs/anonymous-volume behavior remains Task4.
- **Writer retirement:** input/work are distinct labelled volumes; stage owns the sole admitted writable input mount. Complete admission, actual stage stdout EOF and successful attachment wait precede authenticated stage removal/name+ID absence and execution creation. Volume-reference checks occur around this transition and before acknowledgement. Execution's two read-only views use the same named volume and exact `candidate-source` subpath; work/socket mounts remain separate.
- **Protected roots:** `/workspace/NAME` refuses before Docker in candidate mode; Task1/legacy grammar is unchanged. Guest verifies actual readonly mountinfo/statvfs, same-device/subpath/inode relation, no nested mounts, real unaliased parents, root ownership and protected/sticky ancestor policy. Real enforcement and mount destination ownership require Task4.
- **Source and ELF custody:** Task1 full union/fixture/authority materialization is preserved; host identities and complete source/fixture/ELF bytes are rechecked before acknowledgement. Guest checks both immutable source views and exact ELF bytes/modes before and after execution. The exact listing/count is measured before launch. No controller ELF rebuild or candidate copy into writable work/cache was introduced.
- **SDK/cache/original result:** SDK-root baseline uses the complete bounded walker, separately from candidate rows, and is rechecked. Unsupported closure refuses rather than silently omitting rows. Original private Cargo cache/protoc/tool checks and pinned Node/Python supervisor chain are reused. Parent independently invokes unchanged result, exact summary and original receipt checks. The original receipt/schema and `complete_application_accepted=false` meanings remain unchanged.
- **Finite daemon accounting:** one outer 2400-second budget, 420-second reserve plus conservative six-second Task1 allowance, work-before-cleanup separation, one unretired actor at a time, 18-call global cap, 15-second daemon call accounting and two 35-second attachment cleanup allowances are present. Pending creation is recorded before invocation; only label/name/image/role/known-ID authenticated actors are removed. Both volumes are authenticated before successful deletion; failed/uncertain capture does not enter that deletion branch. These checks support the table's daemon/process portion, subject to the diagnostic gap above.
- **Response/envelope custody:** the response has the reported closed 12-field shape, canonical framing, strict candidate row validation and canonical bindings. The nested original payload remains unchanged and can carry failure streams without passing the later result gate. Guest records cannot contain the host envelope. The retained envelope has exactly the reported 20 top-level fields; it is constructed only after original evidence checks, execution EOF/wait, final authenticated reconciliation and diagnostic closure. `capture_records_sha256` hashes pre-envelope guest records, while the receipt digest hashes retained original receipt bytes; there is no self-digest. Task3 must independently recompute those joins and include the envelope in outer custody. No complete host envelope or actual successful SDK fixture was claimed by the local tests.

## Named checks and evidence reconciliation

1. **AUTHORITY_AND_DESIGN_READ:** Read source `AGENTS.md`, normative SPEC §13, the full Task2 brief including accepted Task1 and both controller rulings, binding `docs/superpowers/specs/2026-11-16-candidate-source-capture-design.md`, Task1 report/fix appendix/final scoped review, Task2 report, full five-file review delta, affected source/tests/bootstrap/launcher and relevant unchanged legacy implementations. The rulings supersede the earlier two-actor and `/workspace/NAME` design prose.
2. **SOURCE_IDENTITY_AND_SCOPE:** `git rev-parse HEAD` and `HEAD^{tree}` match the expected commit/tree; `git status --porcelain` is empty. Base-to-head diff lists exactly the five owned paths. `git diff --check BASE HEAD` passed.
3. **IMMUTABLE_BYTES:** Compared actual bytes against `git show BASE:path` for all four authority files, original helper tests and actual Rust capture tests. All match. Current SHA256s match the report: helper `ca09b9de…f8e9a`, original launcher `ac11aadd…d6dd`, JS supervisor `79e017ee…4308`, Python supervisor `ca3517a4…8854`, original helper tests `5496370f…785`, Rust capture tests `d384f78d…0c09`. SDK/tool/policy pins and source-selection/independent-reader files were not changed by this task.
4. **EVIDENCE_INDEX:** Independently read/hash-checked all **37** entries of `/workspace/diagnostic-tools/candidate-capture-lifecycle/index.json`. Every byte count and SHA256 matches. Index SHA256 is `5cd09b11bd4eee217a4731be5249e9513d7e07b31c6a83798cb8192301eb7d2a`.
5. **RECORDED_CONTROLS:** Read actual retained command metadata/status and output. Final candidate is exit0 / 48 tests / 5.528s; launcher is exit0 / 4 pass; unchanged legacy helper is exit0 / 30 tests / 12.827s with the reported existing ELF. They are component evidence only. Inspection/mount/daemon tests use explicit structural transcripts; launcher success uses substituted dependencies in an in-memory copy. Real local listing/pipe/handoff/reap controls establish only their own processes. No passing suite was rerun.
6. **ACCIDENTAL_CLIENT_LIMITATION:** Red03's actual daemon response is “No such container” for the all-3s ID. The original client PID/wait status were not captured, and the later absence observation does not establish reaping. The report and retained note correctly disclose this. The later structural Popen guard and created-state pre-attach check prevent that test path from reaching real Docker; later local-Python reaping evidence does not retroactively qualify the accidental client.
7. **ACK_CHECK / PIPE_PROBE:** Two focused local probes as described above; exact reproduction follows. They create only pipes/processes, no source files, SDK artifacts or daemon objects. The pipe-probe parent killed and reaped its own child.
8. **DISK_RESERVE:** Read-only disk check before probes measured **10,980,519,936 bytes** free, above 8 GiB. No SDK pull or large allocation occurred.

## Focused reproduction

```sh
python3 -I -B - <<'PY'
import importlib.util, os, pathlib, subprocess, sys, time
p=pathlib.Path('/workspace/scratch/prismpm-numeric/scripts/conditional-capture-candidate.py')
s=importlib.util.spec_from_file_location('review_candidate',p)
c=importlib.util.module_from_spec(s); s.loader.exec_module(c)
for wire in (b'{"retire":1}\n', b'{"retire":1.0}\n'):
    r,w=os.pipe(); os.write(w,wire); os.close(w)
    with os.fdopen(r,'rb') as inp:
        reader=c.Reader(inp,time.monotonic()+1)
        value=reader.line()
        c.require(value=={'retire':True},'candidate retirement acknowledgement required')
        reader.exhausted()
        print('ACK_CHECK accepted',repr(wire),'value_type',type(value['retire']).__name__)
code='''import importlib.util,os,sys,time
s=importlib.util.spec_from_file_location("review_candidate",%r)
c=importlib.util.module_from_spec(s);s.loader.exec_module(c)
os.set_blocking(2,False)
filled=0
try:
 while True: filled+=os.write(2,b"x"*4096)
except BlockingIOError: pass
os.set_blocking(2,True)
owner=c.Lifecycle(time.monotonic()+0.1,None,[])
print("deadline_seconds=0.1; saturated_stderr_bytes="+str(filled),flush=True)
owner.finish(False)
print("FINISH_RETURNED",flush=True)
''' % str(p)
child=subprocess.Popen([sys.executable,'-I','-B','-c',code],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print('PIPE_PROBE',child.stdout.readline().decode().strip())
started=time.monotonic()
try:
    child.wait(timeout=0.7)
    print('PIPE_PROBE unexpected_exit',child.returncode)
except subprocess.TimeoutExpired:
    print('PIPE_PROBE still_blocked_after_seconds',round(time.monotonic()-started,3))
    child.kill();child.wait(timeout=2)
finally:
    out,err=child.communicate(timeout=2)
    print('PIPE_PROBE parent_killed_and_reaped',child.returncode,
          'returned_marker',b'FINISH_RETURNED' in out,'captured_stderr_bytes',len(err))
PY
```

Observed: both ACK aliases accepted; stderr filled 65,536 bytes; child remained blocked at 0.703 seconds for a 0.1-second deadline; parent killed/waited child with -9; no return marker.

## Unverified later gates

Task3 still owns the independent JS canonical framing/normalization, selector/no-fallback behavior, private source/ELF/authority joins, strict protected-root rule, SDK inventory/lock/original receipt joins, pre-envelope capture digest and outer envelope inclusion/replay adversaries. This review does not credit producer agreement as independent verification.

Task4 still must establish actual unchanged-d6/Python3.12.3/native-architecture bootstrap; complete actual source/ELF and SDK-root closure within existing caps; actual never-started inspection and anonymous-volume suppression; stage absence; actual Docker subpath/mountinfo/protected-parent semantics; same-UID write/chmod/link/rename/redirection refusals; both 10 GiB headroom checks; original private cache/protoc and qualified subreaper; real extra-writer/pending-create/removal/attachment/retention failures; genuine exact original capture including all 22 application graph refusals and external oracles; actual final actor/volume retirement. Final same-source owner/replay and required full-VV gates remain outstanding. No actual SDK behavior follows from the recorded mock transcripts, local pipe probes, or independent SDK/golden jobs for a different unchanged source snapshot.

Re-review the two fixes and their focused regressions before accepting Task2. Preserve all historical evidence and the original SDK/legacy semantics.

## Scoped fix round1 re-review — 2026-11-17

Reviewed immutable fix base `0c3fa37b598e0ded05fdfd7437ef8b9ae379f94a` through head `bc049680103bbaf285a5582a346a73f4d2f790e4`, tree `1f3f4b6d244414c422115a842949d39e4a46ac3c`. This is a scoped review of the two findings and new breakage in their fix. Current source HEAD is `89d15ce4c2604033689acb097bf0f5279751640f` after the separately owned golden import; those later golden changes were excluded. Both candidate files' working bytes were independently verified equal to their `bc049680` blobs before the focused probe. Source/index/HEAD remained unchanged. No Docker, subagent, build, or passing-suite rerun.

**Updated SpecCompliance: CHANGES REQUIRED. Updated Quality: CHANGES REQUIRED. Both original findings are ADDRESSED, but one new P2 regression in the diagnostic fix loses original daemon-failure streams during reconciliation.** The historical findings and evidence above remain intact; dispositions below supersede their original status.

### Original finding1 — ADDRESSED

`retirement_control` and `receive_retirement` at candidate lines708–715 now bind the canonical current full descriptor digest and exact JSON boolean true. The guest compares canonical bytes, then requires actual EOF under the existing deadline. The parent emits the same closed two-field control. Missing/wrong digest, integer/float boolean aliases, missing retire, extra fields and trailing bytes cannot pass. The new real-pipe controls cover those cases and withheld EOF. The report correctly updates only this auxiliary control contract; response and complete-envelope field sets remain unchanged.

### Original finding2 — ADDRESSED; retention regression noted separately

The original inherited-pipe hang is repaired. Capture streams, owner messages and attachment diagnostics use candidate-owned bounded unbuffered regular files. Reconciliation occurs before inherited-sink forwarding. `nonblocking_forward` performs no capacity wait/retry, limits individual writes to4096 bytes, stops on EAGAIN/broken pipe/deadline, and restores FD blocking state. Attachment/retained-channel processing precedes envelope publication, and final successful close only releases already-processed handles. The immutable legacy helper is untouched.

The controller's diagnostic sibling/token/manifest ruling is implemented: the validated output's exclusive private `.candidate-diagnostics` sibling is established before source measurement/image/actor work; it has fixed channel names/caps, canonical manifest, shared lifecycle token, held no-follow directory/file identities and a deterministic locator. Occupied/aliased/replaced owners refuse. Before validated output, the private token fallback remains outside actor work. The sibling is outside original capture records/envelope and asserts no acceptance. The report makes the nonblocking inherited output and separately retained byte source explicit.

Recorded real saturated-pipe controls and four standalone probe children resolve the original backpressure concern. Each standalone child filled both output pipes with65,536 bytes, exited0 with observed elapsed times approximately0.0010–0.0016s, was waited/reaped, restored FD flags, retained its expected files and produced no envelope. These establish local pipe behavior, not actual daemon retirement or SDK qualification.

### New P2 — Reconciliation discards the daemon streams newly moved into exception attributes

Locations in the reviewed fix: `scripts/conditional-capture-candidate.py:1115–1118`, interacting with `:1332–1333`, `:1345–1346`, `:1356–1357`, `:1364–1365` and `:1371`.

`Lifecycle.call` now replaces the previous stderr-bearing error text with the generic message `candidate Docker control failed; original streams retained`, attaching actual control stdout/stderr to `error.stdout` and `error.stderr`. That works only when the error reaches the public parent's diagnostic handler directly. During actor/reference/volume reconciliation, `finish` catches the exception, appends only `str(error)` to its error list, and ultimately raises a fresh `RuntimeError` with neither stream attribute. `Diagnostics.exception` receives that wrapper and cannot recover the original bytes. Thus failures in exactly the cleanup paths needing diagnostic evidence lose both response channels; even stderr previously present in the error text is now lost. The retained message nevertheless claims “original streams retained.”

A narrow local structural-response probe exercised the **actual** `Lifecycle.call → finish(False) → Diagnostics.exception/close` composition. Only `legacy.run_bounded` was replaced with an explicit nonzero `CompletedProcess` carrying distinct stdout/stderr marker bytes; no subprocess or daemon was invoked. One fixture input-volume inspection failed. The resulting reconciliation error had neither stream attribute. The diagnostic sibling contained only `manifest.json` and `owner.stderr`; neither supplied marker appeared in any retained file. This is fix-local data loss, not an objection to the deferred actual-Docker tests.

Fix: carry bounded original failure channels through reconciliation aggregation, or spool them through the owned diagnostic mechanism without letting a diagnostic error prevent the remaining safe cleanup calls. Preserve the original operation failure as well when a subsequent cleanup failure supersedes it. Retain existing channel/aggregate bounds and the single deadline; do not restore blocking inherited writes or enlarge caps. Add a focused nonzero-control-response regression through actual `call` and `finish`, including a cleanup failure after an earlier operation error, checking byte retention, safe continued reconciliation and no envelope. Do not claim retention in diagnostics unless those bytes remain available.

The focused probe, after asserting the loaded helper equals the exact fix blob, was equivalent to:

```python
with tempfile.TemporaryDirectory(prefix='candidate-cleanup-diagnostic-review-') as temp:
    output = pathlib.Path(temp) / 'capture'
    output.mkdir(mode=0o700)
    diagnostics = candidate.Diagnostics(time.monotonic() + 10)
    diagnostics.bind_output(output)
    owner = candidate.Lifecycle(diagnostics.deadline, None, [], diagnostics=diagnostics)
    owner.volumes = {'input': 'explicit-structural-fixture'}
    original = candidate.legacy.run_bounded
    candidate.legacy.run_bounded = lambda argv, **kwargs: subprocess.CompletedProcess(
        argv, 1, b'actual-response-stdout-marker', b'actual-response-stderr-marker')
    try:
        try:
            owner.finish(False)
        except RuntimeError as error:
            print(hasattr(error, 'stdout'), hasattr(error, 'stderr'))
            diagnostics.exception(error)
    finally:
        candidate.legacy.run_bounded = original
        diagnostics.close()
    bodies = {p.name: p.read_bytes() for p in diagnostics.directory.iterdir()}
    print(sorted(bodies))
    print(any(b'actual-response-stdout-marker' in body for body in bodies.values()))
    print(any(b'actual-response-stderr-marker' in body for body in bodies.values()))
```

Observed: `False False`; `['manifest.json', 'owner.stderr']`; `False`; `False`. The temporary private files were removed by the probe's own `TemporaryDirectory`; no source or unrelated diagnostic artifact was modified.

### Scoped verification and remaining gates

1. Read the complete two-file `task-2-fix-1-review.diff`, final implementation appendix, original findings, same brief, and binding design's diagnostic retention ruling. Reviewed the exact changed control, spool ownership, forwarding and parent/cleanup integration, plus all added tests. No broad re-review of unrelated golden or Task3 work was performed.
2. Independently verified all **44** additive evidence entries by actual bytes/SHA256. Additive index hash is `c9ef6a66113680a7356995850cf3117bc3561098c3587ca835e52bf407c63597`. Read red/focused/final command statuses and outputs and the standalone probe source/results. Final covering command is recorded exit0, **54 tests in6.182s, OK**. The tests do not cover the new reconciliation stream-loss case above.
3. Verified candidate helper90,597 bytes / SHA256 `5ddc34a6a4dcec92e9303219158e88131c4bf19d12cd4aab85816d08a09fb250`; controls75,253 bytes / `ce74ad11436f9495b7351f3568d1a3d5a01ed7361809d0aebae68c38c1a08151`. Both match report and exact fix blobs. All nine protected comparison paths (four immutable authority files, original Python/Rust tests, bootstrap and candidate launcher/test) equal fix-base bytes. Fix diff changes exactly the two candidate Python files; whitespace check passes. Source worktree status remained clean.
4. Free space before the targeted probe was **10,830,970,880 bytes**, above8 GiB. No significant allocation, SDK pull or Docker contact occurred.

No additional out-of-scope finding is raised. Task3 independent reader/selector/owner custody and Task4 actual unchanged-d6 bootstrap/mount/daemon/source/ELF/original-capture/22-refusal/full-VV obligations remain outstanding exactly as previously documented. The prior accidental-client limitation is unchanged. Re-review the new diagnostic aggregation repair and its focused regression before accepting Task2.
