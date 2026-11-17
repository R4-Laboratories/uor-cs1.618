# Full VV 44002718718: fixture and generator-baseline diagnosis

Read-only diagnosis completed against clean PrismPM candidate
`2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec` and base
`3666dc0f9da56fcf066d96ec01cd9e14ec9a2974`. No source, fixture, policy, baseline,
candidate bundle, compiler pin or historical evidence was edited. This report is
the only authored output. No Docker, build, broad suite or golden writer ran.

## Conclusion

The candidate changes the application's generator implementation but carries
the base revision's emitter register, concrete prism-code system binding,
shared generated goldens and native generator-recipe preflight. These are real
integration omissions in the captured candidate, not a workflow environment
failure. The two observed partitions correctly reject it. Genuine regeneration,
independent recipe/source review and a new candidate revision are needed; the
failed exact-2a31 run cannot be relabeled as acceptance.

## Gate 7: exact cause and base comparison

Retained gates diagnostics show `gate-result.json` exitCode 1, wrapper status 1,
and `source-after.json` passed at the exact candidate/tree. Gate 7 stopped at
`tests/fixtures/controller/ct-02-prism-code-model`, whose `case.toml` requires
`check` exit 0 with no diagnostics/artifacts. The actual controller returned
exit 3, PP2101:

- Authored system binding: `sha256:f6274f7e39fe374edbc453002099c268a554ed590017d929c15ed34792bc692d`.
- Actual imported application model: `sha256:bde664ad933ee9952eaa71f5478494fabc7d30952232a490af0f5dac7274d03c`.

The entire fixture subtree has the same Git tree at base and candidate:
`1e47575d7188584c4c554c25687206d76dce11db`. Its `System.lex.tex` SHA256 is
`f335c3ce4f3aeff3277763bd762bc34113115649d9c56ea95fd72a9763bed0b2` at both.
Its last binding update, `03a96843dd0fd8e3544f9e59e24150fa2356d50f`, explicitly
replaced an earlier model digest with f6274f7e in both source fields and its
case comment. That historical commit is an ancestor of the base.

`crates/prismpm/src/holo/projector.rs::compute_emitter_semantics_id` hashes 31
declared input paths/bytes, each framed by big-endian u64 path and byte lengths.
An independent Python reconstruction using exact Git blobs produced:

| Revision | Actual emitter_semantics_id |
| --- | --- |
| Fixture binding commit 03a96843 | `1d5fe71ec83a87fc272bcc3cf94e0f84cabd27f77708e574f8e6ecf30a79b639` |
| Base 3666dc0 | `1d5fe71ec83a87fc272bcc3cf94e0f84cabd27f77708e574f8e6ecf30a79b639` |
| Candidate 2a31ad0 | `c8213cedf16ad1691f136122a58a87a33a596a95e8e5c9b361bf78109df22133` |

Exactly one of the 31 emitter inputs changes between base and candidate:
`crates/prismpm/src/application_build.rs`. Its base SHA256 is
`203c9deefed0ef58a9b389208e79ce1ce5776d16224770817096d99171ca35f1`;
candidate SHA256 is
`c1f4dc025ab73fcc363b7f22ee007e351753ee357ac93dcc19259475c952349f`.
The change is introduced by `e837d723826e3e55c45febba2900e85e29caa578`,
`feat: govern explicit numeric exporter source authority`: generation receives
the selected closed exporter source, acquires that source, and records its
revision. The preceding commit has the base file bytes. No fixture or projector
repair accompanied that change. The entire `src/holo` tree and the fixture's
LexLean/compiler inputs remain identical across base and candidate.

`holo/application.rs:967-973` serializes the actual emitter ID into model
provenance. The controller projects the application-root snapshot, serializes
the complete canonical model, and checks its SHA256 against the system binding
at `controller/mod.rs:640-652`. Thus an emitter-input change legitimately changes
the application model identity even with the same modeled application behavior.

A minimal read-only reproduction used the existing local binary, without
rebuilding or running a suite:

```sh
/workspace/scratch/prismpm-numeric/target/debug/prismpm check \
  --project /workspace/scratch/prismpm-numeric/tests/fixtures/controller/ct-02-prism-code-model/project \
  --json
```

It returned exit 3 and the exact same f6274f7e/bde664ad PP2101. The binary SHA256
was `c0c67e2e16d936504939f631aa832d88917a434db1475f4acc28bd09d9a82fbb`.
This existing-binary reproduction is diagnostic, not a fresh source-build
qualification. The upstream worktree remained clean afterward. SPEC §6 and
the CLI describe `check` as in-memory/no-write/no-compiler execution.

### Exact fixture repair closure

There are **two stale concrete applicationModelDigest fields**, both in
`tests/fixtures/controller/ct-02-prism-code-model/project/src/System.lex.tex`:
`systemModel.applicationProfile` at line 13 and `systemManifest` at line 20.
The f6274f7e prefix in `case.toml` is also stale explanatory text. The expected
success result in `expected/result.json` should remain unchanged.

A scan of authored fixture/example/stdlib LexLean sources found no other
concrete f6274f7e binding. `Production/BrowserSystem.lex.tex` has two
`de510ca7...` literals in its own vocabulary test example, duplicated in the
stdlib copy; those are not this fixture's selected system binding and must not
be globally replaced. Generic validation-corpus records are also not concrete
bindings to the prism-code application. Gate 8 `verify_examples` reuses this
same fixture as its fifth example, so its legitimate repair serves both paths.

The upstream release runbook explicitly supports this operation:
`docs/release/v0.4.0-runbook.md:322-325` says to rebind both
`applicationModelDigest` occurrences when the new emitter's PP2101 reports the
expected digest. This updates authored source to a newly measured identity;
it does not authorize changing the digest check or its model/exit policy.

## Source partition: independently reviewed recipe is stale

The later supplied source log records 1186 Node tests, 1178 passed and eight
failed, all in `scripts/native-golden.test.mjs`. The direct refusal is
`scripts/native-golden.mjs:138-139`:

- Expected independently reviewed `controller/mod.rs` owner SHA256:
  `38211cf87c14be83b5094c78e96c56441f13c8de256e5812143afba91b9b2e1e`.
- Actual candidate owner SHA256:
  `04f04bddfe071a40940345f12a9487b41f4b77dde62dab91987f5c58d2e3fe0c`.

The expected value exactly matches the base owner. The actual value exactly
matches the candidate owner. The helper is unchanged base-to-candidate and
still mirrors the **old active Rust recipe**. Changing only its owner hash
would be wrong: the actual new function is
`application_generator_identity_for(Source)` and prepends both a source frame
and the `exporter/source.rs` bytes to the old concatenation.

At 2a31, the exact new recipe is SHA256 of these concatenated bytes, in order:

1. `Source::frame`: each of domain `prismpm/exporter-source/1`, selected source
   ID, and exact descriptor bytes, separately prefixed by big-endian u64 length.
2. Exact `crates/prismpm/src/exporter/source.rs` bytes.
3. Exact `application_build.rs`, `lean_project.rs`, `holo/archive.rs` bytes.
4. Dereferenced exact `vendor/lean4-prod/rust/MANIFEST.sha256` bytes, retaining
   the original embedded-alias target and before/after alias checks.
5. Literal bytes `prismpm/build-artifacts/2`.

An independent reconstruction of the actual code gives:

| Recipe | application_generator_sha256 |
| --- | --- |
| Base recipe / retained shared manifest | `c2a8221267def5cd5a17bf006ef19a68dd3327dbfd9b4d422bf1e31b993ce749` |
| Candidate default Released | `0eae6b594fc9edbb37ed52d038e15c48c1a2b5cea97fd49e4ec07135375d54f1` |
| Candidate numeric-task2c | `b010f30c865033408978d957ff2f1443eace7ea3b36bd32e33cf5417cad0f7d8` |

Released framing uses source ID `released` and descriptor bytes
`prismpm/exporter-source/released/1\0` (92 framed bytes); numeric-task2c uses
the exact candidate descriptor bytes (9121 framed bytes). Source default
golden generation remains Released via `Controller::load`; no opt-in candidate
selector belongs in the default golden writer. These are calculated source
identities, not replacement acceptance receipts.

The eight failing test names are: current shared source baseline is byte-exact;
generator preflight binds actual recipe; source review executes exact image;
failure and missing evidence never become reviewed baseline; native source
review accepts exact workflow events; locked acquisition failure/signal/
cancellation/mutation prevent commands; second offline writer cannot mutate
inputs; and executed source-baseline/second-run omission mutants. Several
later assertions fail because the first owner refusal prevents reaching their
intended phase; this log does not establish eight separate runtime defects.

### Additional statically established blockers beyond the first failures

`model/emitter-inputs.toml` still registers base emitter `1d5fe71e...79b639`.
`xtask/src/audit.rs::audit_emitter_inputs` will reject actual
`c8213ced...f22133` after the earlier Node-suite failure is repaired. This is
an exact computed mismatch, not a speculative test failure.

The retained shared golden model and manifest also retain the base emitter:

- `tests/golden/stdlib/build/model.prism.json`: one old emitter field.
- `tests/golden/stdlib/build/manifest.json`: one old emitter field and the
  old `c2a822...ce749` generator field.

Their descriptors, build identity, verification references and native records
have further derived dependencies. Counting only literal occurrences is not a
complete golden repair. Genuine writer execution must produce that closure.

## Supported repair/review sequence (commands proposed, not executed)

Use a new isolated source candidate based on 2a31 and its unchanged pinned
source devcontainer, with normal fetch/init, Released d6 oracle and no inherited
local profile overrides. Preserve all 44002718718 evidence. First wait for the
remaining original workers to finish, as the controller directed, so other
independent failures can be scoped before refreshing full VV.

### 1. Bind the authored fixture to the final reviewed emitter

Inside the supported source environment, build the actual current source CLI:

```sh
cargo build --locked --offline -p prismpm --bin prismpm
target/debug/prismpm check \
  --project tests/fixtures/controller/ct-02-prism-code-model/project --json
```

Before repair this must be the PP2101 mismatch above. Extract the expected
digest from the structured diagnostic, never from an arbitrary log line or
old fixture. The following exact guarded rebinding procedure is suitable for a
separately authorized implementation in the new checkout:

```python
import json, re, subprocess
from pathlib import Path
project = Path('tests/fixtures/controller/ct-02-prism-code-model/project')
cli = ['target/debug/prismpm', 'check', '--project', str(project), '--json']
run = subprocess.run(cli, text=True, capture_output=True)
assert run.returncode == 3
error = json.loads(run.stdout)
assert error['diagnostic']['code'] == 'PP2101'
match = re.search(r'but the imported application model is (sha256:[0-9a-f]{64})$',
                  error['diagnostic']['message'])
assert match
new = match.group(1)
# Recompute if final reviewed emitter inputs change; do not force today's ID.
old = 'sha256:f6274f7e39fe374edbc453002099c268a554ed590017d929c15ed34792bc692d'
path = project / 'src/System.lex.tex'
text = path.read_text()
needle = f'applicationModelDigest := "{old}"'
assert text.count(needle) == 2 and new != old
path.write_text(text.replace(needle, f'applicationModelDigest := "{new}"'))
case = project.parent / 'case.toml'
comment = case.read_text()
assert comment.count('(f6274f7e)') == 1
case.write_text(comment.replace('(f6274f7e)', '(' + new[7:15] + ')'))
checked = subprocess.run(cli, text=True, capture_output=True)
assert checked.returncode == 0, checked.stdout + checked.stderr
assert json.loads(checked.stdout)['model_id'] == new[7:]
```

At unchanged 2a31 emitter inputs the measured new value is bde664ad above.
Application-root selection is `Specification.lex.tex`; its imported closure
does not import System. Facets are projected separately from the full snapshot.
The post-rebind check is mandatory to establish stability of the measured ID.
Then run the unchanged focused fixture owner, without rewriting expected output:

```sh
cargo run --locked --offline -p xtask -- check-fixtures
```

### 2. Independently review and truthfully seal the source identities

Review the complete active `controller/mod.rs` recipe and its
`exporter/source.rs` framing against the captured base/candidate diff. Adapt
the native helper and its synthetic fixtures to exactly that reviewed recipe,
including source frame, source-owner bytes and existing descriptor-relative
alias checks. Preserve unknown-owner refusal, both source-authority separation
and every current failure/mutation test. The owner SHA update is a consequence
of that completed independent review, not the review itself. There is no
supported command that automatically authorizes an unknown recipe owner.

Likewise update the emitter register only to a fresh independent computation
of the existing exact 31-input closure after source is final. Retain the input
list, framing and equality audit. No compiler pin, emitter-input omission,
golden comparison projection or acceptance policy may be changed to preserve
old derived identities. At today's source the required computed value is
`c8213ced...f22133`; later reviewed emitter edits require a new computation.

### 3. Genuinely regenerate and review shared development goldens

The normative writer is Debian 12 GNU AMD64 in the original development
container, not a host-profile override or the old installed SDK source tree:

```sh
just golden-write "Review numeric exporter authority integration: regenerate exact emitter/generator-bound shared source baseline."
just golden-check
```

Equivalent original writer/readback commands are:

```sh
PRISMPM_GOLDEN_REASON='Review numeric exporter authority integration: regenerate exact emitter/generator-bound shared source baseline.' \
  cargo run --locked --offline -p xtask -- check-golden --write
cargo run --locked --offline -p xtask -- check-golden
```

These are a deliberate baseline-development operation, separate from acceptance
VV. Independently review the full generated tree and exact diff, retain original
logs/products, and commit only authentic reviewed outputs. Do not hand-fill new
fields/hashes, normalize stored records, use fixtures-write to bless PP2101,
or run a writer inside the eight acceptance gates. SPEC §8 and
VERIFICATION.md's integrated golden review describe this genuine writer path.

### 4. Run the existing dual-architecture native source-review owner

After committing the reviewed source/helper/shared-baseline changes, the
supported hosted source-review workflow is `.github/workflows/native-golden.yml`:
Ubuntu 24.04 X64 and Ubuntu 24.04 ARM64, fail-fast false, 75-minute lane bounds.
Its unchanged exact commands are:

```sh
node scripts/native-golden.mjs tests
node scripts/native-golden.mjs run "$SOURCE_REVISION" "$RUNNER_TEMP/native-golden"
```

The runner must be a genuine GitHub-hosted workflow context, not locally
fabricated GitHub environment variables. Trigger by a relevant upstream source
PR or explicitly dispatch the source workflow at the reviewed source ref once
publication is authorized. Upstream publication is currently deferred, so this
is a provisioning/publication dependency, not something executed by this report.
If the controller elects game-side orchestration instead, it needs a separately
reviewed equivalent exact-source/native-worker adapter; the existing source
workflow and script do not offer an arbitrary checkout/environment bypass.

The review owner uses the unchanged pinned development-only environments from
`sdk/golden-development[-amd64].lock.json` (index
`sha256:42213da87c564d859e327ab7df2459357d674fa538050f13905caa24c352588e`),
not the d6 source-VV oracle as a substitute. It checks the exact owner and
shared baseline before acquisition, runs all 38 exporter-seed controls, performs
locked acquisition then offline generation, and runs both original commands:
`cargo run --locked --offline -p xtask -- check-golden --write` followed by
the same command without `--write`. It retains three original raw records per
architecture, full generated products, command/identity evidence and failures.
The resulting `review.json` status is **review-required**, not acceptance.

Independently review/import the six genuine native record files, preserving
their bytes and original source/run/architecture identities, through the
established source-baseline process. Import is a new reviewed baseline commit;
do not rewrite historical source revisions or native evidence to match it.

### 5. Refresh the captured candidate and rerun supported acceptance

Create a new reviewed source commit/bundle/patch/manifest with new candidate and
tree identities; update the game's exact-source orchestration constants to
that reviewed capture. Do not alter the old 2a31 snapshot in place or call its
failed run accepted. Rerun all eight unchanged source parts and the same-source
assembler at the refreshed revision. The other original parts remain useful
diagnostics but cannot serve as acceptance records for a different commit.
Installed-d6 same-new-binary acquisition/retained-reader/authority integration
also remains separate; genuine baseline review is not SDK/product admission.

## Effects outside the failing fixture

Emitter identity is global to ordinary model, application and native-library
projection (`holo/projector.rs`, `holo/application.rs`, `holo/library.rs`). Its
change affects canonical model documents and model IDs outside this fixture.
Controller build inputs include model ID, emitter ID, application-generator ID,
dependency-register digest and system ID, so fresh build IDs/manifests and
derived verification references change. `application_build.rs::source_manifest`
hashes the full canonical model; application archives embed the model bytes and
that manifest. Bundle/application/provenance identities may therefore change
even when generated core behavior is unchanged.

This does **not** establish that generated Rust/Lean execution code or native/
Wasm results changed: those portable bytes require the genuine generator diff
and unchanged checks. Existing native comparison rules explicitly retain every
other byte, source/declaration audit, portable artifact digest, execution result
and process invocation; they must not be broadened to mask this integration.
The separate compiler authority selection and application/library generator
identity changes also remain real, truthful build provenance.

## Evidence and limits

- Gates log SHA256: `02ff50e4829e4f4d6cbe7cb06995a5dcafe5f21daa16527bac3269dbc5a1286f`.
- Source log SHA256: `e293d6c52b0037a5421ed903ef687d661631be1736cd4db035b6a26def02ebef`.
- Controller supplied source artifact ZIP ID `14294629574`, verified SHA256
  `c8ae4fb74ce2ecf3b485cccfec58f87e4338b57c102aa14fd47d6d73891fa64f`;
  extraction was already provided. This task hashes the extracted log, not the
  original ZIP independently again.
- Root-cause source comparisons and identity computations used Git object reads;
  only the existing in-memory `check` was executed. No base binary was freshly
  built: the base relationship is established by matching emitter input bytes,
  fixture history and the candidate's exact observed mismatch.
- No proposed repair or golden generation ran. Exact resulting generated/native
  diffs, current worker resource outcomes and remaining partition failures are
  unknown until supported execution. The original workers should finish before
  scoping the refreshed integration, as directed.
