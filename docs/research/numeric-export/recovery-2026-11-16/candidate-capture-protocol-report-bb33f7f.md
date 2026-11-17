# NEXP013 Task1 implementation report

Status: **DONE_WITH_CONCERNS**. Isolated component implementation, not complete candidate capture or SDK qualification.

Source base: `324955b6923c1d194d7bc870a2d2a05eb687048c`.
Commit: `420e285a49490935add42b61747466a174b8b926` (`Add closed candidate capture input protocol and bootstrap`).
Worktree: `/workspace/scratch/prismpm-numeric`; clean after the explicit three-file commit.

Changed paths only:

- `scripts/conditional-capture-candidate.py` (505 lines; 26,949 bytes).
- `scripts/conditional-capture-bootstrap.py` (158 lines; 7,981 bytes).
- `scripts/conditional-capture-candidate.test.py` (531 lines).

No SDK, marker, inventory, PATH, tool pin, policy, Rust, game source, legacy helper, or supervisor change. No Docker operation, full SDK download, upstream push, or subagent. Final actual available space: 11,425,816,576 bytes, above the 8 GiB local reserve.

## Resolved task boundaries

Controller agreed before implementation:

1. The fixed six-file authority closure requires the future Task2 `conditional-capture-candidate-command.mjs`. It does not exist in this commit. Tests supply clearly marked transport-only fixture bytes at that fixed path; no test executes that launcher. Real `measure_inputs` will refuse an incomplete current-source authority closure until Task2 supplies it.
2. `parent SOURCE_ROOT ELF` is recognized but explicitly refuses with `candidate parent lifecycle is not implemented; no Docker operation admitted`. Internal guest likewise refuses `candidate guest lifecycle is not implemented; no SDK execution admitted`. Direct `stage`/`guest` CLI arguments refuse. No fake orchestration or guest-success stub was added.
3. `measure_inputs(source, executable, remaining_seconds)` produces a closed **source plan**, not fabricated runtime observations. The explicit `bind_runtime(source_plan, runtime_observation)` constructs the full mandatory input descriptor. Task2 must supply independently inspected actual runtime observations before bootstrap. Staging rejects an unbound source plan. This ruling was incorporated into the controller's tracked plan/spec in `3102777`.
4. Host deep capsule checks call component helpers in actual child processes and are labelled component-only. They do not bypass or claim successful execution of bootstrap main. Actual bootstrap main retains exact Python3.12.3 and UID/GID1000 guards. Positive unchanged-d6 bootstrap execution is outstanding.
5. The original suite requires its real current library ELF argument. The approved existing ELF was used; no replacement build.

## Implementation and custody

The candidate module loads the unchanged legacy utility at the exact unaliased sibling path. It checks a singly linked regular file, a 1 MiB bound, no-follow open, before/after metadata identity and the immutable SHA-256 before executing its authenticated bytes in an explicit `importlib.util.spec_from_file_location` module namespace. It does not let a loader reread unauthenticated bytes or search an ambient module path.

Existing `encoded`, `sha`, `Reader`, `write_bounded`, `source_rows`, `fixture_rows`, `validate_rows`, `row`, `alias_root`, listing/count, regular-read and identity primitives remain the underlying authority. The new row validator strengthens their new-route use: UTF-8 byte sorting, Unicode scalar paths, exact ancestors, direct measured alias targets and no alias ancestors. Original source rows stay separate from fixture rows and their conflict-checked union. Fixture closure must equal precisely the three fixed recursively consumed subtrees in the union.

The sender rechecks source/fixture rows, holds supplied local metadata identities across transfer, streams no-follow singly linked files in at-most-1 MiB chunks, compares real sent hashes and metadata, and emits the descriptor-bound completion marker. The caller owns and closes its stream; a written marker does not assert EOF. Task2 must retain the identity snapshot across its custody interval and perform final caller-side source/ELF/authority checks.

The materializer rejects its descriptor before creating a destination, creates only new exclusive files, streams/hashes actual bodies, requires the exact marker and actual EOF, then installs canonical descriptor/manifest files, seals modes, and performs complete recursive readback with **no source/cache exclusions**. Regular source and ELF readback hashes stream in bounded chunks. Source executable members and the ELF remain mode0400 before EOF; executable mode0500 is applied only after completion/EOF. No admission record is emitted on failure. Partial owned inputs remain for the later lifecycle owner's diagnostics/retention policy.

Normalized modes are input/source/authority directories0500, ordinary source files0400, source executables0500, authority capsules0400, ELF0500, descriptor/manifest0400. Alias target text is retained exactly. Mode sealing is defense in depth only; it does not establish immutability. Task2 still must retire the writable actor and inspect actual read-only mounts.

## Exact interfaces and closed field contracts

### Source plan and runtime binding

`measure_inputs(source: Path, executable: Path, remaining_seconds: int) -> dict`

Returns the exact closed keys below, with schema `prismpm/conditional-candidate-source-plan/1`:

```
schema, route, source_root, source_selection,
source, fixture_inputs, source_sha256, fixture_inputs_sha256,
union, union_sha256, authority,
executable_bytes, executable_sha256, listing_sha256, test_count,
remaining_seconds, sdk_image
```

- `route`: exactly `candidate-source-v1`.
- `source_root`: unchanged legacy compiled-root grammar; no alias; `/workspace/conditional-capture` refused. Private selection additionally requires `/tmp/prismpm-publication-capture-[A-Za-z0-9_-]{6,64}/source`.
- `source_selection`: `tracked` or `private`, measured through legacy source selection. No invented fixture producer Git identity is added.
- `source`, `fixture_inputs`, `union`: original row shapes below; UTF-8 path ordering. Each original inventory and their union retain existing 100,000-row/512 MiB bounds. The union is not two additive byte allowances.
- The three inventory SHA-256 fields hash the corresponding canonical row-array bytes, including the final LF.
- `executable_bytes`: integer4..1 GiB; actual ELF magic/hash checked; full actual listing/count use original primitives. `listing_sha256` hashes the original terse listing bytes; `test_count` is1..100000.
- `remaining_seconds`: exact integer1..1980, excluding the original420-second reserve from2400. Bootstrap/reader/materializer use one supplied monotonic deadline without phase reset. The outer Task2 owner must decrement/clamp against its original absolute deadline, including measurement and staging.
- `sdk_image`: exactly `ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`.

`bind_runtime(source_plan, runtime_observation) -> dict` validates both, takes an independent canonical JSON snapshot, changes `schema` to `prismpm/conditional-candidate-capture-input/1`, and adds mandatory `runtime`. No other top-level fields or null/default observations are admitted. `validate_descriptor` rejects the source-plan schema.

`runtime` exact keys:

```
sdk_image, config_digest, os, architecture, inventory_sha256, image_authority
```

- Same pinned SDK distribution; `config_digest` is `sha256:` plus64 lowercase hex; `os` is `linux`; `architecture` is `amd64` or `arm64`; inventory digest is64 lowercase hex.
- `image_authority` is an exact ordered two-row list. Each row has only `path`, `bytes`, `sha256`, with positive bytes≤256 MiB and a64-hex digest. Paths are `/opt/prismpm/share/conformance-root/scripts/conditional-capture-sdk.py` then `/opt/prismpm/share/conformance-root/scripts/conditional-capture-command.mjs`.
- These are shape checks and bindings; Task2 must actually inspect/measure the runtime. Matching fixture labels in local tests are never SDK observations.

### Rows and authority

Row closed shapes:

```
{"path": scalar_relative_path, "kind": "directory"}
{"path": scalar_relative_path, "kind": "file", "bytes": integer,
 "sha256": lowercase_hex64, "executable": boolean}
{"path": scalar_relative_path, "kind": "link", "target": direct_relative_target}
```

Files are bounded0..256 MiB, singly linked in measurement/materialization/readback. Absolute, backslash, control, traversal, empty component, non-scalar, `.git`, duplicate, unsorted, unmeasured-parent, chained/escaping alias, link-ancestor and special-file cases refuse. Alias target may include a confined relative `..`; the resolved target must be a directly measured file/directory with declared directory ancestors. Fixtures admit no aliases.

`authority` equals exactly these six original **source file rows**, in this fixed order:

1. `scripts/conditional-capture-bootstrap.py`
2. `scripts/conditional-capture-candidate-command.mjs`
3. `scripts/conditional-capture-candidate.py`
4. `scripts/conditional-capture-sdk.py`
5. `scripts/sdk-command-owner.mjs`
6. `scripts/sdk-command-owner.py`

Bootstrap bytes≤32768; candidate entry and utility each≤1048576. Utility hash must equal the immutable baseline. The running entry/bootstrap must match their measured source rows. No arbitrary module path/command is accepted by the bootstrap.

### Wire framing and materialized layout

`encoded(value)` is unchanged legacy Python framing: sorted object keys, compact JSON separators, ASCII escapes, one final LF. SHA-256 hashes these exact bytes. Paths sort by UTF-8 bytes, not JavaScript UTF-16 code units.

Pinned cross-language vector (the displayed final `\n` is the one LF byte):

```
[{"kind":"directory","path":"\ue000"},{"kind":"directory","path":"\ud800\udc00"}]\n
```

SHA-256: `cf49b0434bd524f4577489c108f8362dde4b0f2c25f1f2259b2c2abe2adee327`.

After fixed utility and entry bootstrap capsule bodies, stage wire is:

1. Canonical full runtime-bound input descriptor line (≤32 MiB).
2. Every regular union member body once, in union row order; directories/aliases have no body.
3. Exact ELF body.
4. Canonical marker with exactly `kind="inputs-complete"`, `descriptor_sha256`, `transfer_manifest_sha256`.
5. Actual EOF.

`transfer_manifest(descriptor)` returns an ordered array of exact `{path,bytes,sha256}` rows: each regular union member has path `candidate-source/` plus its source path; final row is `current-test-elf`. Its canonical hash binds the marker and admission record.

`materialize_inputs(reader, destination: Path, descriptor: dict, deadline: float) -> dict` starts **after** the descriptor line; reader must be the legacy `Reader` (or equivalent contract with `deadline`, `exact`, `line`, `exhausted`). It requires a new absolute unaliased destination. The internal stage adapter alone admits fixed existing `/workspace` with exactly authenticated `authority/` capsules already created by bootstrap. All other occupied destinations refuse.

Exact final root members:

```
authority/conditional-capture-sdk.py
authority/conditional-capture-candidate.py
candidate-source/<exact complete union>
current-test-elf
candidate-input.json
candidate-transfer-manifest.json
```

The root entry set is exactly `authority`, `candidate-source`, `current-test-elf`, `candidate-input.json`, `candidate-transfer-manifest.json`. Descriptor and manifest files contain canonical bytes. No additional member is tolerated on readback.

Returned stage admission exact keys:

```
schema="prismpm/conditional-candidate-stage-admission/1",
route="candidate-source-v1",
descriptor_sha256, source_sha256, union_sha256, fixture_inputs_sha256,
transfer_manifest_sha256, authority, executable_sha256,
input_eof_observed=true
```

`verify_materialized(destination, descriptor, deadline)` performs the same complete readback and returns the same record **without** `input_eof_observed`; later readback does not invent historical EOF. Only successful materialization adds the actual EOF observation. No complete-application receipt is emitted. The original receipt/schema/`complete_application_accepted=false` remain untouched. `RESPONSE_SCHEMA` is reserved as `prismpm/conditional-candidate-capture-response/1`; Task2 owns its full response/retirement implementation and separate retained `candidate-transport-evidence.json`.

Additional sender helpers: `input_identities(source, executable, descriptor)` returns local metadata identity snapshots for source root, every union member, and ELF; `write_inputs(stream, source, executable, descriptor, deadline, identities)` streams canonical descriptor/bodies/marker with before/after custody checks. These metadata identities are local, not fabricated portable provenance fields.

### Bootstrap invocation

Exact `sys.orig_argv` length12 and prefix:

```
/usr/bin/python3 -I -B -c BOOTSTRAP_TEXT MODE SECONDS DESCRIPTOR_SHA256 UTILITY_BYTES UTILITY_SHA256 ENTRY_BYTES ENTRY_SHA256
```

`MODE` is only `stage-v1` or `execute-v1`; integer strings are canonical positive decimals with fixed bounds. `sys.argv` must equal `['-c'] + sys.orig_argv[5:]`. The actual `-c` UTF-8 bytes are retained and joined to the source bootstrap row. Utility digest is fixed before import. Runtime guards remain Python3.12.3 and UID/GID1000.

Stage requires fresh owned fixed `/workspace`,≥10 GiB actual free space, consumes exactly utility then entry using bounded select/read loops with no read-ahead, creates fixed capsule names exclusively, validates digest/length/readback, and enters authenticated candidate `stage(context)` via compile/exec in the **same PID**. No capsule-supplied module path, namespace, expression or command is accepted. Context exact keys: `mode`, `deadline`, `descriptor_sha256`, `bootstrap` (actual bytes), `capsules` (ordered `{bytes,sha256}` rows).

Execute mode uses only fixed `/candidate-input`, checks actual read-only filesystem flag and exact capsule names/measurements, authenticates canonical mounted descriptor plus bootstrap/capsule joins, runs complete input readback, then reaches the deliberately refusing Task1 guest. The full mount graph/protected ancestor inspection, run/retire request, SDK checks, launcher, resource policy and actual lifecycle remain Task2/Task4 obligations. `ST_RDONLY` alone is not claimed as complete mount-graph qualification.

## Red/green commands and actual results

Cwd for every command: `/workspace/scratch/prismpm-numeric`.

Pre-implementation red, after writing the initial real canonical-vector control:

```
python3 -I -B scripts/conditional-capture-candidate.test.py
```

Exit1. `FileNotFoundError: .../scripts/conditional-capture-candidate.py` at the explicit module load. Full original stdout/stderr/status retained as `01-red.*`.

First expanded development run:21 tests,19 passed,1 failure,1 error. The incorrect expected Unicode-vector digest and Git fixture's untracked empty alias-target directory were corrected. Full failure logs retained as `02-development.*`; no implementation acceptance inferred from that run. Intermediate `03` and `06` runs each pass21 tests and remain retained.

Final new component command:

```
python3 -I -B scripts/conditional-capture-candidate.test.py
```

Exit0; `Ran 23 tests in 3.505s`, `OK`; `07-final-candidate.stdout` empty, all unittest output in retained stderr. Tests cover real private/tracked complete source+fixture union; changed exporter source; a real tar archive and its member; data/executable classification; directory/file/relative aliases; BMP/non-BMP ordering; exact bytes/readback/modes; fragmented real pipes and sender; duplicate/unsorted/missing/extra/unknown rows; undeclared parents; fixture conflicts/extras; malformed canonical framing; forbidden paths; hardlink/FIFO/escaping/chained aliases; occupied destinations; actual sparse overlimit file; row/byte/JSON limits; short/corrupt/extra bodies/markers/trailing bytes; expired deadlines; withheld EOF with no stage admission/nonexecutable ELF; real SIGTERM interruption; source persistent and write-restore mutation; readback fixture/mode/ELF/authority/alias changes; substituted bootstrap/entry/utility and fixed import path; wrong capsule digests/lengths, early close, caps and exact argv; explicit unavailable lifecycle refusal.

Real library ELF preflight:

```
target/debug/deps/prismpm-e88e534b42a91ec6 --list --format=terse
```

Exit0;537 test lines, exact original target occurs once at line333. Retained as `04-libtest-list.*`.
ELF SHA-256: `783031fadbb67384d7ffdbd6a06c89db699771d25bb63ab419ba999c26554749`.

Unchanged original suite:

```
python3 -I -B scripts/conditional-capture-sdk.test.py /workspace/scratch/prismpm-numeric/target/debug/deps/prismpm-e88e534b42a91ec6
```

Exit0; `Ran 30 tests in 12.822s`, `OK`; retained as `05-legacy.*`. The actual original capture test itself and its22 application mutation/refusal controls were not run by this component task; their source is unchanged.

`git diff --cached --check` passed before commit; explicit three-file diff/self-review completed. Self-review tightened no-follow metadata checks (excluding atime), streaming ELF/readback hashing, post-EOF executable mode activation, destination/root sealing, source/runtime closure and sender root binding. No mock success or test-specific bypass was added to bootstrap main.

## Host-vs-SDK evidence and outstanding gates

Bare `python3` in the mandated commands actually resolves to `/opt/codex/runtimes/codex-primary-runtime/dependencies/python/bin/python3`, version3.12.14. Explicit bootstrap/child controls use `/usr/bin/python3`, version3.13.5. Neither is SDK3.12.3. The valid-shape actual bootstrap child fails at `bootstrap requires Python 3.12.3`; that test does not count as deep capsule or stage admission. Separate real child component helpers exercise exact digest/length/EOF paths and print only `CAPSULE_COMPONENT_ONLY` on their positive case. The substituted-bootstrap stage-component child refuses at `actual bootstrap bytes mismatch` before touching fixed `/workspace`.

Still unrun/unimplemented here: actual positive pinned bootstrap and same-PID SDK stage; full production-source measurement after Task2 launcher exists; actual daemon/image/runtime observations and complete SDK-root baseline; stage retirement before execute; protected compiled-root read-only subpath mount and same-UID mutation probes; full actor resource/volume/socket policy; original420-second bounded reconciliation schedule; full original OC10/source-free22-refusal capture; independent JS transport verifier; actual final actor/volume retirement and retained transport envelope. No production admission, malicious-daemon isolation, source-free compiler runtime or multi-architecture result is claimed.

The component's runtime schema validates declared observations; it cannot independently create daemon evidence. The source-plan/capture-input separation makes that dependency explicit. This is a safe but intentionally incomplete route until the later tasks implement and independently qualify those boundaries.

## Immutable files and evidence index

Before/after hashes match exactly:

| File | SHA-256 |
| --- | --- |
| `scripts/conditional-capture-sdk.py` | `ca09b9de3bf57c3e2dc16e11d4d1a527b9b2f1f271566bb7a87846d0a24f8e9a` |
| `scripts/conditional-capture-command.mjs` | `ac11aadd31f0a3e40df7866cc7690be8e7c8c252120146d718471358840ed6dd` |
| `scripts/sdk-command-owner.mjs` | `79e017eeb59107064fbd5917b09e63259dcf47fe9ecdda1ff3db759944794308` |
| `scripts/sdk-command-owner.py` | `ca3517a446b8082856e2e952a811a81436aabfd9a71b4414e3298d202aea8854` |
| `scripts/conditional-capture-sdk.test.py` | `5496370f42dd452c49af03eab4d4fd375e709884db1710d1bbeed9c04c1ec785` |

Committed new-file hashes:

- Candidate: `1fd98a490a506f8fb259945af58536997b409b29d773d5fd715d9b7af504d3d4`.
- Bootstrap: `ff8162fd0d6d6202e5c2759b89ecc55bb52bc7519b0b2804670a8ac669ea187f`.
- Controls: `9f73fb65777a52b66d84882a0c44d2694d433348de00eac26c0c03408e54eb12`.

Evidence directory: `/workspace/diagnostic-tools/candidate-capture-protocol`.
Index: `index.json`, SHA-256 `33e1012a8044b675f9c20c6b195ff76049c1ac71e4ca9d014ccf1d6351220f57`.
The index records exact command strings, cwd, statuses/log paths and byte/hash inventory; `09-final-state.json` captures actual commit, clean status, changed-file stat, both Python versions and actual disk free space. It does not self-hash.

## Fix round1 — both independent P2 findings

Status: **DONE_WITH_CONCERNS**, ready for independent re-review. This section supersedes the original implementation's row-comparison and measurement-deadline behavior. Original report/evidence above remain historical and intact.

Base `420e285a49490935add42b61747466a174b8b926`; fix commit `bb33f7f86c24e7f4eddb75a48f8ade0a2f8cb702` (`Reject noncanonical capture rows and bound candidate measurements`). Only `scripts/conditional-capture-candidate.py` and `scripts/conditional-capture-candidate.test.py` changed. Bootstrap and all five immutable legacy files remain unchanged. Working tree clean after commit; final actual free space11,300,507,648 bytes, above8 GiB. No source/golden snapshot refresh, SDK operation/pull, broad build, upstream push or subagent.

### Finding1: strict redundant rows and actual canonical digest

The supplied `union` now receives its own complete strict row validation. Its canonical bytes must equal those of the derived source/fixture union; `union_sha256` hashes the **actual supplied** union's canonical bytes. Authority must be a list whose canonical bytes exactly equal the validated source rows in fixed `AUTHORITY` semantic order. It is deliberately not interpreted as a separately sorted complete tree.

This refuses Python equality aliases such as executable1/0 versus booleans and integral float byte lengths versus integers. All refusal occurs during descriptor validation, before destination creation. The five focused scalar cases use actual fixture bodies and a marker bound to the changed descriptor, so they cannot pass merely by failing an unrelated marker join. No wire fields/schema or canonical framing changed.

### Finding2: shared deadline and single actual listing

`measure_inputs` now runs inside a main-thread POSIX `ITIMER_REAL` guard covering source/fixture scans, ELF measurement, authority reads, listing, final identity check and descriptor validation. The listing is executed **once**; its actual bytes produce both listing digest and test count. The unchanged `legacy.checked_listing` and original distinct-line/`: test` count semantics remain required. The aggregate stdout/stderr cap remains1 MiB for this listing, matching the original helper's listing bound.

The listing helper drains actual pipes under the same absolute remaining deadline, retains bounded stdout/stderr on failure, kills its owned process group when the leader remains live, and reaps the actual leader. Exceptions expose `.stdout`, `.stderr`, and `.listing_pid` for the later parent diagnostics owner. A failed listing, overflow, malformed inventory or deadline never launches a second listing. The new controls exercise missing/duplicate original case, malformed additional line, nonzero exit, overflow, deadline, real PID absence and actual completed wait/reaping. They do not claim universal descendant/subreaper exhaustion.

The same guard covers `write_inputs` including initial/final source/fixture and metadata rechecks, `materialize_inputs`, `verify_materialized`, and internal `stage`. It also bounds standalone metadata snapshots. A real256 MiB sparse source member exercises interruption during the sender's original source scan, under a0.02-second deadline, with no descriptor emitted afterward.

**Task2 interface update:** `input_identities` now requires `(source, executable, descriptor, deadline)`. Its prior three-argument interface is superseded. Other public signatures and wire contracts remain unchanged. `measured_listing(executable, deadline)` returns `(listing_sha256, test_count)` and preserves failure diagnostics as above.

**Main-thread and signal contract:** The controller confirmed compatibility with main-thread Task2 orchestration. `deadline_scope(deadline)` refuses worker-thread use, an externally blocked SIGALRM, any preexisting foreign handler, and any preexisting timer. Same-owner nesting is allowed and always clamps to the earlier absolute deadline. On success and exception it restores the prior handler/timer ownership; nested scopes restore the remaining outer timer without renewing its deadline. An expired failure must propagate; this is not permission for a caller to swallow expiry and continue work. Tests verify ordinary failure/success restoration, real nested expiry, earlier outer expiry after inner timeout, foreign-handler/timer preservation on refusal, blocked signal refusal, and worker-thread refusal.

**Explicit failure-only cleanup allowances:**

- A single listing may use at most `LISTING_REAP_SECONDS=1` second for `child.wait` after terminating its live process group. The work alarm is blocked/disarmed during this bounded retirement; it cannot interrupt reaping. The alarm is also briefly blocked during `Popen` handle acquisition so an expired work alarm cannot strand a child between OS creation and cleanup custody. Pending owner alarms are drained before restoring the previous signal mask. No successful work budget is restarted.
- An interrupted original Git source scan may use the unchanged legacy `run_bounded` finalizer's at-most5-second child reap. Its immutable bytes and existing behavior are preserved. This is a failure cleanup allowance, not five additional seconds for measurement, scans or another process.
- Task2 must charge these failure-only waits to the single original outer deadline/reconciliation reserve, clamp its enclosing schedule accordingly, and never interpret them as renewed work time. Normal source/fixture scans have no independent work timeout reset. No claim is made for arbitrary kernel-uninterruptible I/O or a hostile OS.

### Exact red/green and focused evidence

Cwd `/workspace/scratch/prismpm-numeric` throughout. Retained additive evidence is under `/workspace/diagnostic-tools/candidate-capture-protocol/fix-1/`; the original parent index remains byte-for-byte unchanged.

Before repair, after adding the two focused regressions:

```
python3 -I -B scripts/conditional-capture-candidate.test.py ProtocolControls.test_redundant_row_scalar_substitutions_refuse_before_destination ProtocolControls.test_actual_slow_listing_has_one_shared_deadline_and_reaped_child
```

Exit1; `Ran 2 tests in 4.215s`, `FAILED (failures=6)` (`01-red.*`). Four scalar subcases failed because malformed input was accepted; the integral-float union byte subcase failed because refusal happened only after destination creation. The actual native `sleep(2)` ELF took **4.010575307998806 seconds** with `remaining_seconds=1`, reproducing the review's two-run budget violation. No clock/process mocks or SDK pin bypass.

The same focused command after the initial repair: exit0, `Ran 2 tests in 1.133s`, `OK` (`02-focused.*`). Subsequent whole-suite development logs are retained: `03-development`27 controls passed; `04-final` and `05-final`28 controls passed before the final small failure-diagnostic adjustment.

Final covering command after all committed edits:

```
python3 -I -B scripts/conditional-capture-candidate.test.py
```

Exit0; **`Ran 28 tests in 5.232s`, `OK`** (`06-final.*`). This includes all23 original Task1 controls plus five focused control methods covering the new findings and deadline-runner behavior. The fixed EOF-negative control accepts either original channel-retirement deadline or the stronger outer input deadline; both still require no stage admission, no descriptor file, and nonexecutable partial ELF/tool modes.

For exact retained timing/PID/output observations, after the final code:

```
python3 -I -B /workspace/diagnostic-tools/candidate-capture-protocol/fix-1/07-probes.py
```

Exit0; exact stdout (`07-probes.stdout`):

```
TYPE_PROBE: refused before destination creation: closed file measurement
DEADLINE_PROBE: remaining_seconds=1; elapsed=1.002530s; calls=1; absent=True; reaped=True; refusal=candidate input deadline
RETAINED_STDOUT: b'oci::publication_context::capture_tests::actual_source_free_capture_constructs_complete_conditional_context: test\n'
RETAINED_STDERR: b'slow-listing-started\n'
```

The probe script itself is retained and indexed. It uses actual compiled native code, actual PID recording, `os.kill(pid,0)` absence and `os.waitpid(pid,WNOHANG)` demonstrating the child has already been reaped. This is host component evidence, not SDK execution or actor retirement.

Legacy covering-suite audit: **not rerun in this fix round**. The five immutable original files and bootstrap hashes are unchanged; prior real-ELF30/30 evidence remains valid for those bytes. No legacy function was patched or replaced. The changed code is entirely the new candidate module; its existing complete file/pipe/control suite and new explicit listing-semantic/output/deadline controls were run after the change. A repeat legacy suite would not exercise the new guard in the same process or replace the new focused regressions. No broad SDK/Cargo/full capture run was warranted by these two local findings.

`git diff --check` and staged diff check passed. Self-reviewed the complete candidate delta, bounded child ownership/cleanup, type/framing comparisons, signal restoration, and test additions before committing explicit owned paths. All original limitations on absent Task2 launcher/lifecycle, actual d6/Python3.12.3/bootstrap qualification, daemon/mount enforcement, independent JS verifier, full OC10/22 refusals and actor/volume retirement remain outstanding.

### Fix evidence hashes

The five immutable hashes remain exactly the values in the original report table. Bootstrap remains `ff8162fd0d6d6202e5c2759b89ecc55bb52bc7519b0b2804670a8ac669ea187f`.

- New candidate module: `860a1743539e6d67377da8855cccd88575f5d6fcaa1bbae6f5aefec4a91d498e`.
- Updated controls: `6d239c8d25557a65601752be48f4427e7c6d44fe1d98f1f1916d8b61d4de0e03`.
- Additive fix index: `/workspace/diagnostic-tools/candidate-capture-protocol/fix-1/index.json`, SHA-256 `1f01a6cd2409015248d90f374fa1528bf1bdf7da57a68defe0983c3928033870`.

The fix index records exact commands, original stdout/stderr/status, focused probe source, reviewed diff, commit/clean status, final immutable/new-file hashes and actual disk reserve. It does not self-hash or alter the previous evidence index.
