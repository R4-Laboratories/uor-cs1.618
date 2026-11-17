# Task 4 hosted qualification reconnaissance

Read-only design, 2026-11-17. No implementation, tests, builds, Docker operations, commits or publication. Read the Task4 plan/spec, Task2 final report, Task3 review/report, actual source owners and current game workflow/collectors. Task2 accepted helper base is `881df278923ff271fc179703e55ea91c45f2394d`, tree `ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4`; Task3 committed source is `79a41668ef04c0bb566e0789589934a79c3d8019`, tree `4e9cd09fcd49795e0b3cdcca39fe109bc2925373`. Task3 corrections are being edited concurrently; observed working-copy changes are not an accepted identity. Freeze the reviewed successor before implementing/launching this wrapper.

## Minimal owned files and workflow

Create `.github/workflows/prismpm-candidate-capture-qualification.yml`, `scripts/numeric/candidate-capture-qualification.py`, `scripts/numeric/tests/test_candidate_capture_qualification.py`, and a separate `scripts/numeric/prismpm-capture-candidate/{manifest.json,candidate.bundle,candidate.patch}`. A small separately measured Python guest probe may be a fourth owned script. These are proposed paths, not existing commands. Reuse the unchanged `restore-prismpm-candidate.py` explicit snapshot argument and exact schema/base3666/numeric-export-backport branch. Do not overwrite historical accepted2a31 or shared/native preparation captures, or update old full-VV trigger paths merely to launch this job.

One native amd64 hosted job with ordered stages is sufficient initially: prepare/identity → original source devcontainer → component controls + real ELF → actual daemon/mount qualification → genuine registered OC10 → complete artifact collection. Stop before OC10 on failed qualification; retain failure evidence. Use existing pinned checkout/devcontainers actions and `.github/actions/prismpm-source-cache`, `skipContainerUserIdUpdate:true`, `inheritEnv:false`, `push:never`, UID1000, umask022 and `/usr/local/bin/prismpm-devcontainer-exec`. Restore in a full-history upstream checkout at base3666, check clean reviewed HEAD/tree before and after, and run original `bash scripts/bootstrap-verify.sh --check-source`. Import no test-specific runtime changes into the source image or SDK.

Original oracle remains exactly `ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`. Hosted host-daemon acquisition uses `docker pull --platform linux/amd64` with that full reference. Retain actual distribution/config/platform and original inventory/helper/launcher measurements; do not identify the source devcontainer by the SDK digest. Source Docker CLI is the unchanged28.4.0 tool; record actual daemon version/subpath behavior separately. Python3.12.3 qualification is **inside d6**; the original source devcontainer can use its own pinned Debian12 Python. No local vfs image pull.

## Exact existing commands and owners

The final source controls remain component evidence, even when run on the hosted machine:

```sh
python3 -I -B scripts/conditional-capture-candidate.test.py
python3 -I -B scripts/conditional-capture-sdk.test.py "$PRISMPM_CAPTURE_TEST_ELF"
node --test scripts/conditional-capture-candidate-command.test.mjs
node --test tests/publication-context-linkage/candidate-transport.test.mjs
```

The legacy Python suite needs the **genuine current prismpm libtest ELF**, not the small exact-name stub used by reader component fixtures. Obtain a fresh ELF from actual Cargo compiler-artifact JSON under an initially absent private target, require `fresh:false`, exact test target, regular single-link inode, and measure the actual list/count/bytes. The existing owner build at `capture-owner.mjs:71–139` is:

```sh
cargo test --locked --offline -p prismpm -p repo-conformance --lib --no-run \
  --message-format=json --jobs 1 --config profile.dev.debug=0 --config build.incremental=false
```

Its owning call supplies a private `CARGO_TARGET_DIR`, moves the freshly emitted inode out of reconstructible cache, creates an authenticated execution copy, runs the readonly-fixture regression and all12 exact node-suite boundary cases, then cleans only that cache. Reuse these custody rules for the qualification ELF; do not export profile/build settings globally. The full OC10 owner builds its own fresh privately staged source/ELFs; the preliminary qualification ELF cannot be silently substituted into that owner.

The smallest **registered genuine OC10 gate** is the existing conformance libtest:

```sh
cargo test --locked --offline -p repo-conformance --test conformance \
  conformance_oc_10 -- --exact --nocapture
```

`crates/conformance/tests/conformance.rs` maps that test to `cases::run("OC-10")`; `cases/mod.rs:760` invokes the exact Node owner inventory: `owner.test.mjs`65 and `capture-guard.test.mjs`2, total67, with original3600000ms Node bound. Require the conformance test result plus original per-file counts/completion, not an exit0 from an empty filter. Direct `node --test tests/publication-context-linkage/owner.test.mjs tests/publication-context-linkage/capture-guard.test.mjs` exercises those owners, but the registered conformance command supplies the existing exact-count guard and is preferable.

The owner transitively runs `verifyCompletePublicationLinkage` → `verifyCapturedPublicationLinkage` → `verifyCapturedFactory`, including original occupied-output refusal, fresh private compilation, source/ELF custody, original exact capture body/all22 graph and publisher/attempt refusals, independent `verifyCandidateTransport` and `verifyCaptureOracle`, frozen retained tree, and generated std/no_std native plus context/admission Wasm replay. Do not run `capture.test.mjs` as a replacement: it explicitly says factory only, not complete OC10. The actual child selection is owned by `runPublicationCapture`; **do not export** `PRISMPM_OC10_CAPTURE_ROUTE`, `PRISMPM_OC10_SDK_CHILD` or capture output in the workflow. Its exact child is:

```text
/usr/bin/timeout --signal=TERM --kill-after=5s 2400s <fresh private execution ELF>
  --exact oci::publication_context::capture_tests::actual_source_free_capture_constructs_complete_conditional_context --nocapture
```

The candidate helper's only CLI is `python3 -I -B scripts/conditional-capture-candidate.py parent SOURCE_ROOT ELF`; stage/guest are authenticated bootstrap entries, not general CLI commands. The candidate launcher always runs the genuine exact case; it has no listing-only smoke mode. Thus phase1 proves bootstrap/staging/mount policy; phase2 proves actual launcher/supervisor/application behavior. Do not invent an easier ELF or call a fake launcher qualification.

## Missing actual-daemon qualification driver

The current56 candidate Python controls explicitly guard against Docker (`LifecycleControls` substitutes daemon responses). There is **no existing actual-SDK qualification flag** or same-UID mutation-probe command. A new bounded game driver is unavoidable; changing the immutable helper or calling the component suite “actual SDK” would not fill this gap.

Use reviewed source-owned primitives by exact authenticated module path: `measure_inputs`, `bind_runtime`, `Lifecycle`, `inspect_runtime`, `bootstrap_argv`, `write_inputs`, `stage_admission`, `verify_materialized`, `verify_views`, and original listing/bounded-command functions. The live positive sequence must preserve actual never-started inspection actor/PID0 and anonymous-volume suppression; actual inventory/image-authority reads; descriptor binding; complete source/fixture/ELF staging through the unchanged bootstrap; actual EOF/readback; successful attachment exhaustion; `retire_actor("stage")` with proven absence; and `references()` before execution creation. Preserve complete baseline SDK-tree measurement/recheck. Record raw bounded inspect/volume/mount observations and their identities rather than deriving facts from the intended Docker arguments.

For mutation qualification, introduce a **separately labelled test probe**, not a fake normal capture guest or complete envelope. Its fixed reviewed Python argv runs in the same inspected native d6 execution policy and exact two read-only input views. `Lifecycle.spec("execute", argv, source_root, socket_gid)` admits a fixed argv internally, so source primitives can enforce actor policy without modifying accepted helper bytes. The probe authority/hash and distinct qualification-only result belong to the game driver; it must never call `publish_envelope` or manufacture normal capture response/receipt. This adapter still needs implementation review and explicit finite cleanup accounting before launch.

Probe under actual UID/GID1000:

- Verify `/proc/self/mountinfo`, `statvfs(ST_RDONLY)`, exact same-device/root relation and same-directory inode for `/candidate-input/candidate-source` and compiled root; no nested candidate mounts. Verify root-owned no-follow protected ancestors. Exercise both admitted root forms `/workspaces/NAME` and `/tmp/prismpm-publication-capture-…/source`, or leave the unexecuted form explicitly unqualified. `/workspace/NAME` must refuse before any actor creation.
- Attempt actual write/truncate, chmod, hardlink, rename/replacement and write-then-restore against source rows/representative alias targets, every authority copy (source scripts in both source views and `/candidate-input/authority`), the ELF, framing files and compiled-root/ancestor redirection. Enumerate the tested paths/views. Check operation refusal **and** byte/mode/path/inode closure afterwards; a successful transient write is failure even if restored. Protect against the probe using the oracle socket to rewrite its own mount; this tests ordinary same-UID filesystem access, not malicious-daemon isolation.
- After retiring stage, deliberately plant a separately owned RW attachment to the input volume; `references()` must refuse before execute creation. Retain proof of zero executable actor for that case. Keep planted actor cleanup under its own authenticated test ownership; never allow candidate reconciliation to delete foreign actors.
- Inject real stage truncation/trailing bytes, early attachment closure, and bounded create/attachment failure/ambiguity. Record actually created IDs, labels/config/role and inspected final states. Failure keeps named volumes and publishes no complete envelope; only authenticated actors may be retired. Count all qualification-owned cleanup operations, including deliberately planted actors, within an explicitly reviewed finite per-scenario budget; no unbounded host cleanup or retry loop. Stop on uncertain ownership.

This requires driver/test implementation, not more source authority APIs. Avoid copying the whole parent orchestration. Reuse its real primitives while keeping probe-only commands and evidence distinctly outside the normal capture contract.

## Independent reader and retained mutation gap

Task3 already supplies genuine first-admission independent transport/receipt verification and repeated outer `capture.verify()` around replay. Its component reader tests use real files and a tiny stub ELF, so they are not actual retained SDK mutation evidence. The factory currently mutates original metadata/preimages/lock and detects added retained files; there is no CLI to reopen a capture by pathname and reconstruct a trusted `captureCompilerArtifact` owner from serialized hashes.

For actual new-envelope mutation controls, keep the original owner alive: mutate only disposable captured bytes, invoke its held `verify()` and restore exact bytes, then require positive re-verification. Coherent config/retirement replacements must be rejected by that privately held outer tree, as the spec requires; do not claim the standalone reader cryptographically proves historical daemon facts. **Concrete integration seam still needed:** the full OC10 test does not expose its private live factory to an external game process. A narrowly reviewed in-process test hook/adapter at the existing owner boundary is needed to exercise actual new envelope/source/authority mutations without rebuilding capture twice or forging the reader's branded ELF owner. Re-running synthetic `candidate-transport.test.mjs` cannot fill this requirement. Do not treat this missing hook as a reason to weaken reader custody or modify the immutable transport helper.

## Artifact custody and budgets

Reuse corrected `golden-preparation.py` completeness discipline, not its shared-golden collector/path limits verbatim: required bounded regular source candidate receipt, original source-input definition hashes, actual source-container config/rootfs/platform, actual d6 distribution/config/inventory/tool records, source HEAD/tree/clean status before/after, exact commands/statuses, fresh ELF/Cargo JSON/list/count/relocation custody, actual qualification actor/volume observations and phase statuses. Each stage is incomplete until all required originals are retained, validated and SHA256 inventoried; independent `always()` failure cannot leave a complete artifact.

Preserve factory/owner receipt paths and hashes, actual source snapshot/ELF subject, complete original capture tree including envelope, generated replay receipts/products, and deterministic sibling `<capture-output>.candidate-diagnostics` manifest/channels/token. Collect through the UID1000 source-container context into the mounted ignored target/evidence directory. Discover only paths emitted by the owned command's typed diagnostics/known receipt, validate expected private prefix/UID/no-follow metadata, and never scan arbitrary `/tmp`. Capture failures before output validation may retain a token spool with direct locator; require that locator/ownership rather than guessing. Inherited stdout/stderr prose is best-effort and cannot be a completion marker. Task3 pending fix must be independently accepted before any launch.

Unchanged inner budgets: source and retained trees512MiB/100000 rows; source member256MiB; JSON32MiB; ELF1GiB; bootstrap32KiB/two modules1MiB each; logs32MiB aggregate, response64MiB, attachment diagnostics1MiB; cache2GiB/250000 entries/depth32; single2400s deadline with420s reconciliation reserve, <=18 daemon calls <=15s each and two attachment waits <=35s, all clamped. Same resource policy: 8GiB memory/swap, 2CPUs,256PIDs, network none/caps dropped/no-new-privileges/rootfs RO; `/tmp`8GiB exec and `/workspaces`16MiB noexec tmpfs. Actual >=10GiB free before staging and execution; local8GiB reserve unchanged.

A proposed outer artifact budget is4GiB total with the original per-product bounds above, unique retained ELF bytes plus original custody records, and a closed manifest for generated replay products. Review this collector cap before implementation; overflow must retain available diagnostics and mark incomplete, never silently omit required originals. Do not recursively upload Cargo/target caches or claim a truncated CI observer log is a complete original command stream. Source image/build acquisition and OC10's original3500000/3600000ms bounds are separate from the2400s individual capture budget; do not extend the latter to fit an overloaded worker. Use existing bounded observer only as supplemental diagnostics.

## Global Cargo correction and final acceptance

Current old full-VV workflow still exports `CARGO_BUILD_JOBS=2 CARGO_NET_OFFLINE=true`. At the eventual newly reviewed source capture, remove only the global build override, preserve offline Cargo, and reject inherited `CARGO_BUILD_*` alongside the existing profile/flags/wrapper/Node/shell overrides. Do not edit source-owned `--jobs 1`/`--config` compiler owner arguments or private owners' deliberate internal settings. Keep candidate-route selection at the Task3 source-test and Node owner boundaries, never globally exported by the wrapper.

Only after actual focused qualification/OC10, required genuine shared/native baseline imports and independent reviews: capture a new final source identity, update full-VV constants/snapshot together, run all8 original `just vv-part` partitions and same-source `scripts/vv-assemble.mjs`, plus separate original-SDK library/corpus gates. No mixing old2a31 part records, no source-development inventory relabeling and no closing NEXP013 on component or qualification-only evidence. Preserve historical failures. This design grants no product/production admission, source-free compiler-runtime claim or untested architecture success.
