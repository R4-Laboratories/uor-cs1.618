# NEXP013 Task1 independent review

Reviewed source base `324955b6923c1d194d7bc870a2d2a05eb687048c` through head `420e285a49490935add42b61747466a174b8b926` in `/workspace/scratch/prismpm-numeric`. Review date: 2026-11-17. Source/index/HEAD were not modified. No Docker, push, subagents, or passing-suite rerun.

**Spec verdict: CHANGES REQUIRED.** The task's main architecture and most component requirements are implemented, but the closed row/digest contract and shared measurement deadline have reproducible violations.

**Quality verdict: CHANGES REQUIRED.** The code is reasonably factored around authenticated unchanged primitives, and the tests/evidence distinguish component success from SDK qualification. Two focused negative controls are missing and currently fail their required behavior. Both findings are within Task1 rather than requests to implement the deferred lifecycle.

## Findings

### P2 — Redundant union/authority rows bypass exact type and canonical digest validation

Location: `scripts/conditional-capture-candidate.py:143` and `:149` (`validate_source_plan`).

The source and fixture rows receive strict field validation, but the supplied `union` and `authority` lists are checked only using Python equality against derived rows. Python considers `1 == True`, `0 == False`, and an integral float equal to its corresponding integer. Consequently canonical JSON with an integer in an `executable` field can pass as a boolean row. `union_sha256` is compared against the **derived** valid union, not the actual supplied union's canonical bytes.

A focused real-file probe copied the test fixture descriptor, changed the union row for `tool` from `"executable": true` to `"executable": 1`, and changed the first authority row from `"executable": false` to `"executable": 0`. `validate_descriptor` accepted it. Supplying the matching descriptor-bound marker and actual file/ELF bodies to `materialize_inputs` returned `input_eof_observed=True`. At that point `digest(descriptor["union"]) != descriptor["union_sha256"]`. Thus this is successful stage admission with a nonconforming closed row and a declared inventory digest that does not hash that inventory's canonical bytes; it is not merely an exceptional malformed-input failure. It also creates an avoidable Python/independent-JS interpretation mismatch.

Fix: validate the supplied union's exact row grammar and compare its canonical bytes/digest to the derived union. Compare authority rows using canonical bytes or validate each row's exact scalar types before equality; the authority tuple uses a fixed semantic order, so do not simply feed it to a sorted-inventory validator. Add controls for integer/boolean and integer/float substitutions in redundant row copies, asserting refusal before destination creation and no admission.

### P2 — Actual ELF listing processes can outlive the measurement deadline

Location: `scripts/conditional-capture-candidate.py:190` (also deadline-free source/fixture scans at `:174–175`).

`measure_inputs` creates a deadline from the supplied remaining seconds, but calls the unchanged `legacy.listing` and `legacy.test_count` without passing it through. Those helpers each invoke `run_bounded` with a new default 30-second timeout (`conditional-capture-sdk.py:265`, `:273`, `:55`). There is no deadline check between the two listing calls; the check at candidate line193 happens after both finish. The helper therefore cannot enforce its supplied remaining budget and can consume reconciliation reserve before returning to the future parent.

A focused real native ELF printed the valid original test listing after `sleep(2)`. Calling `measure_inputs(valid_fixture_source, slow_elf, 1)` took **4.010 seconds** before raising `candidate input deadline`: both listing processes ran even though the first alone exhausted the budget. No clock monkeypatch, mocked process, SDK pin bypass, or lifecycle claim was used.

Fix: run the actual listing under the remaining shared deadline, preferably once and derive both its digest and count through unchanged semantic checks, while preserving output caps and failure diagnostics. Keep the legacy helper bytes unchanged. Audit the new component's surrounding source/fixture scans and sender rechecks so they too cannot silently run beyond the caller's remaining budget; use a bounded wrapper where an unchanged primitive cannot take the deadline. Add a real slow-ELF control that proves timely interruption and that a second listing is not launched after expiry.

## Strengths and accepted boundaries

- Exact immutable utility loading uses a fixed sibling path, no-follow checks, metadata identity, a size bound, the pinned hash, and compilation of the bytes actually authenticated. The old utility, launcher, both supervisors and original test file remain byte-for-byte unchanged.
- Source/fixture union and original source rows remain distinct. Fixture coverage is independently checked; complete materialized readback has no legacy top-level exclusions. UTF-8 ordering and ASCII-escaped framing have a pinned BMP/non-BMP vector.
- Exclusive streaming files, bounded hashes, direct measured aliases, mode normalization, occupied-destination refusal, and actual EOF before admission are clearly implemented. The withheld-EOF control checks that both ELF and executable source remain nonexecutable and that no descriptor is installed.
- Bootstrap has closed argv/modes, fixed capsule names and sizes, pinned Python/UID checks, and same-process entry. Component child controls are labeled honestly and do not manufacture a successful SDK bootstrap.
- `measure_inputs` produces a source plan; mandatory `bind_runtime` snapshots separately supplied runtime observations. Unbound plans refuse at the materializer. This matches the controller's recorded ruling and the tracked spec.
- The missing Task2 launcher and explicitly refusing parent/guest are accepted planned boundaries. Transport-only launcher/runtime fixtures are not actual observations. Their presence in controls is not a finding.
- Read-only mount graph/daemon/actor lifecycle and full OC10 are Task2/Task4 obligations. Mode sealing or `ST_RDONLY` is not represented as completion of those obligations in the report.

## Named checks and evidence reconciliation

1. **Scope / baseline check:** Read the brief, implementation report, source `AGENTS.md`, tracked design, diagnosis, and this plan's `progress.md` rulings. Read the 67,559-byte review diff once in bounded sequential passes. Inspected only the named legacy interfaces needed to assess row grammar, measurement/listing/deadline, identity/readback, and canonical Reader behavior.
2. **Commit / immutable files:** `git rev-parse HEAD` returned `420e285a49490935add42b61747466a174b8b926`; `git status --short` was empty. `git diff --name-status BASE HEAD` lists exactly the three new task files. `git diff --check BASE HEAD` passed. Current hashes of all five immutable baseline files and all three new files exactly match the report.
3. **Evidence integrity:** Independently read/hash-checked all **33** entries of `/workspace/diagnostic-tools/candidate-capture-protocol/index.json`; all byte counts and SHA-256 values matched. The index itself hashes to reported `33e1012a8044b675f9c20c6b195ff76049c1ac71e4ca9d014ccf1d6351220f57`.
4. **Recorded red/green:** Read actual retained stderr/status. `01-red` is exit1 for the missing candidate implementation. `07-final-candidate` is exit0, **23 tests in 3.505s, OK**. `05-legacy` is exit0, **30 tests in 12.822s, OK**, with the actual current library ELF argument. Test names and inspected implementation support the reported control coverage, subject to the two newly demonstrated gaps. No passing suites were rerun.
5. **TYPE_PROBE:** Actual fixture source and ELF plus canonical malformed descriptor and matching marker; result `input_eof_observed=True`, while the actual supplied union's canonical digest did not match `union_sha256`. The first exploratory attempt accidentally used the helper's default original-descriptor payload and correctly failed its marker join; rerunning with `payload=case.payload(d)` supplied the intended matching marker and reproduced the finding.
6. **DEADLINE_PROBE:** Actual compiled native ELF with two-second delay per listing; `remaining_seconds=1`, observed **4.010s** until refusal. Exact focused reproduction follows. These targeted checks exercised an unanswered concern; they did not rerun test methods or change source.

Focused reproduction command (temporary files are created/cleaned by the existing fixture; no source edits):

```sh
python3 -I -B - <<'PY'
import importlib.util, pathlib, copy, subprocess, time
path=pathlib.Path('/workspace/scratch/prismpm-numeric/scripts/conditional-capture-candidate.test.py')
s=importlib.util.spec_from_file_location('review_controls',path)
m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
m.ProtocolControls.setUpClass(); case=m.ProtocolControls(); case.setUp()
try:
    d=copy.deepcopy(case.descriptor)
    next(r for r in d['union'] if r['path']=='tool')['executable']=1
    d['authority'][0]['executable']=0
    m.candidate.validate_descriptor(d)
    result=case.materialize(payload=case.payload(d),descriptor=d)
    print('TYPE_PROBE: malformed union executable=1 and authority executable=0 accepted; input_eof_observed='+str(result['input_eof_observed']))
    print('TYPE_PROBE: union canonical digest matches union_sha256='+str(m.candidate.digest(d['union'])==d['union_sha256']))
    slow=pathlib.Path(m.ProtocolControls.native.name)/'slow.c'
    slow.write_text('#include <unistd.h>\n#include <stdio.h>\nint main(void){ sleep(2); puts("'+m.legacy.TEST+': test"); return 0;}\n')
    subprocess.run(['/usr/bin/cc',str(slow),'-o',str(case.executable)],check=True,capture_output=True)
    started=time.monotonic()
    try:
        m.candidate.measure_inputs(case.source,case.executable,1)
    except RuntimeError as e:
        print('DEADLINE_PROBE: remaining_seconds=1; elapsed=%.3fs; refusal=%s'%(time.monotonic()-started,e))
finally:
    case.doCleanups(); m.ProtocolControls.tearDownClass()
PY
```

## Cannot verify / downstream acceptance remains outstanding

No actual Python3.12.3/d6 bootstrap, complete production-source admission with the real Task2 launcher, daemon/runtime observation, same-PID SDK stage, protected source subpath mount, same-UID immutability probe, actor/volume ownership and retirement, independent JS reader, full response/envelope, complete original capture/22 application refusals, or OC10/full-VV qualification was established here. Bare Python3.12.14 and explicit `/usr/bin/python3`3.13.5 are host component evidence only. The original actual test and all application controls remain unchanged, but the passing 30-control helper suite is not evidence that those application gates ran. These limitations are correctly disclosed by the report and are not additional Task1 findings.

Re-review the two fixes and their focused regressions before accepting Task1. A later broad final review and actual unchanged-d6 qualification remain required.
