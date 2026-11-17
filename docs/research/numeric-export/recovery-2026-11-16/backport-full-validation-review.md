# Independent full source validation review

Reviewed implementation range: `57cd685..deaf087` and the supplied scoped diff, against `backport-full-validation-brief.md`, `backport-full-validation-recipe.md`, and `backport-full-validation-report.md`.

**Spec compliance verdict: PASS for orchestration implementation.**

**Quality verdict: PASS. No actionable findings in the reviewed change.**

These verdicts do not claim that source VV has executed or passed. Full image acquisition/build, worker capacity, real gate outcomes, and original assembled CI evidence remain pending.

## Evidence inspected

- The five files in the exact implementation diff; current copies of those files still match `deaf087`. Unrelated existing B2 worktree changes were not reviewed or edited.
- The clean upstream checkout at `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`, its `.devcontainer` definition/Dockerfile/initializer/non-root launcher, original `vv.yml` and cache action, `scripts/fetch.sh`, `scripts/vv.sh`, bootstrap verifier/retention module, bounded observer, `xtask` part owner, and assembler.
- `/workspace/diagnostic-tools/devcontainers-ci-action.yml` and actual published action implementation at exact pin `8bf61b26e9c3a98f69cb6ce2f88d24ff59b785c6` (`github-action/dist/index.js.map` source contents, including `lib/main.js`, `common/src/dev-container-cli.ts`, and environment handling). The actual action resolves `path.resolve(checkoutPath, subFolder)`, sends explicit environment through `up` and `exec`, disables UID updates with the supported CLI option, executes through `bash -c`, and leaves the container available after the command. Its post action skips image publishing with `push: never`.

## Contract trace

- `.github/workflows/prismpm-backport-full-validation.yml:28`, `:91`, and `:214` keep the game harness separate from full-history upstream checkouts at the exact base. `scripts/numeric/full-source-vv.py:48` binds all reviewed metadata, invokes the existing bundle/patch verifier, verifies exact candidate/tree, and requires the real historical-bootstrap availability message. The original restore helper remains unchanged.
- `scripts/numeric/full-source-vv.py:34` verifies candidate `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`, tree `3d4838633c80fb754b33f466c25ef0962057e2fd`, clean tracked/untracked source, and bootstrap tree availability. Source inputs are hashed externally at `:61`. No source, guard, pin, accepted fixture, or upstream workflow is changed by this implementation.
- `.github/workflows/prismpm-backport-full-validation.yml:76` preserves the 360-minute worker deadline, all eight original parts and `fail-fast: false`. The image deadline is 240 minutes at `:26`. Each matrix job has an independent checkout, daemon and source container. Cleanup at `:82` preserves the original disposable tool list and additionally requires a GitHub-hosted Actions runner.
- `:117` acquires the exact original d6 SDK oracle in the host daemon; `:132` passes its digest reference into the original socket-mounted source development container. The source image is never represented as the SDK. `scripts/numeric/full-source-vv.py:111` distinguishes actual config identity from optional distribution digests; `:122` checks native Linux amd64 image, bounded positive shm and the same host socket. The source Dockerfile and postCreate fetch/init sequence remain unchanged. Chown plus supported UID-update suppression keep the source user at UID 1000. Host diagnostics live outside that owned checkout.
- `.github/workflows/prismpm-backport-full-validation.yml:135` uses the unchanged non-root launcher, sets umask 022, checks identity/cleanliness/fresh result absence, rejects unowned exported compiler/shell settings, and sets Cargo resource/offline environment only after lifecycle acquisition. The selected `just vv-part` at `:164` preserves all original browser/runtime/bootstrap preflights and the complete upstream part owner. The explicit d6 selector prevents the original automatic SDK construction branch. There is no raw-cargo substitution or weakened gate.
- The EXIT trap at `:139` preserves the command status, including a nonzero status when status-file writing fails. Always-run collection at `:176`, implemented at `scripts/numeric/full-source-vv.py:73`, copies raw original result/status/diagnostics before acceptance checks and verifies clean exact source even after command failure. Acceptance requires status zero, exact passed record identity and all four original bootstrap outputs for `source`; bytes are copied without reserialization. General target/cache trees are not uploaded.
- `.github/workflows/prismpm-backport-full-validation.yml:208` requires the successful eight-worker matrix. A fresh aggregate directory receives only original successful part artifacts. The exact restored upstream assembler tests and assembler at `:237` enforce the complete canonical eight-record set, same revision, all fifteen gates, passed status and fresh output. Failure cannot be converted into final acceptance by diagnostic uploads.
- The documentation explicitly preserves the independent unchanged-d6 default/Released/candidate acquisition and retained-reader/authority requirements. No focused test result is substituted for source acceptance. No package publishing or upstream push is introduced.

## Verification limits

This was a read-only implementation review, apart from this requested review file. I did not rerun the reported same-code ten orchestration tests, 133 npm tests or actionlint. I did not pull/build an image, run source VV, alter the upstream checkout, start subagents, commit or push. The synthetic records in the reviewed tests remain clearly marked test fixtures; real acceptance still requires the CI run described above.
