# Game-side native golden adapter reconnaissance

Read-only reconnaissance of the active source owner and upstream workflow, plus section 4 of `full-vv-gates-diagnosis.md`. No source/workflow edits, native execution, tests, Docker operations or upstream publication occurred. This document is a design finding, not review of the sole implementer's evolving source changes.

## Concrete conclusion

**A game-side hosted workflow can call the existing native generation owner without changing its GitHub-context policy or native review schema.** A source revision different from the game's genuine `GITHUB_SHA` is supported: the CLI accepts the exact source commit as an explicit operand, and `runReview` compares it to the source checkout's HEAD. It does **not** compare it to `GITHUB_SHA`, fetch that revision from a remote, require an upstream repository, inspect the workflow ref, or require the upstream workflow file to be the actually executing workflow.

Thus `R4-Laboratories/uor-cs1.618` can supply the genuine GitHub execution context and a separately restored exact PrismPM source checkout. The adapter must preserve that distinction in its own provenance; it must not overwrite GitHub variables with PrismPM source values. The earlier diagnosis correctly requires a separately reviewed game adapter, but there is no runtime upstream-publication or source-SHA-equals-GitHub-SHA restriction to bypass.

There is one concrete **source prerequisite** before calling the normative CLI: as read, `scripts/native-golden.mjs:568` still requires `verifyTap(..., 18) === 18`, while `native-golden.test.mjs` contains the additional Released-frame test, bringing the inventory to 19. `verifyTap` returns the actual test count (`browser-api-sdk-check.mjs:169-181`), so an all-19-pass run still fails this CLI assertion. Route this to the sole source implementer, update the exact complete inventory without removing a test or weakening TAP checks, and capture/review the resulting source revision. This reconnaissance did not run that command. The direct 19-test command used by shared preparation avoids this particular CLI assertion, but does not repair native qualification.

## Actual runtime contract

`runReview` at `scripts/native-golden.mjs:198-220` requires all of the following from the genuine host process:

- `process.arch` is `x64` or `arm64`; `RUNNER_ARCH` correspondingly is `X64` or `ARM64`.
- `GITHUB_ACTIONS=true`, `RUNNER_ENVIRONMENT=github-hosted`, `RUNNER_OS=Linux`.
- `GITHUB_EVENT_NAME` is exactly `pull_request`, `push` or `workflow_dispatch`; positive decimal `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT`.
- Real unprivileged host UID greater than zero and nonnegative GID. It maps these into the Docker actors; there is no shared-writer UID1000 requirement here.
- Explicit 40-hex source revision; `source` is the current working directory through the CLI. Source realpath must contain no control characters or comma.
- Fresh, previously absent output directory outside the source, with an existing unaliased parent. Do not precreate the owner's native output directory.

Initial Git checks at lines 243 and 310 require HEAD equal the explicit source revision and a clean tracked/untracked worktree. They do not verify a remote URL, fetch source, or compare source to GitHub workflow variables. The wrapper must therefore prove snapshot authenticity through the existing immutable restorer, not infer it from those Git checks. Both `.prism/build` and `.prism/verified` must be absent. Shared source and generator baseline validation runs before image acquisition and again after generation; genuine reviewed shared outputs must already be committed.

The owner sanitizes its own Git/Docker subprocess environment: isolated runtime HOME and DOCKER_CONFIG, Docker's local Unix socket, original PATH and fixed locale, disabled global/system Git config and prompts. It does not propagate host Cargo profile, proxy, credential or registry settings into the actors. Preserve this owner instead of replacing its Docker commands.

`validateWorkflow` is an owning test of the retained **source** `.github/workflows/native-golden.yml`; the test reads that file relative to the source test module. It statically checks its triggers, exact runner matrix/actions/command block and failure uploads. It is not a validation of the game workflow currently executing. Leave the original source workflow byte-exact and validate the separate game adapter independently. Do not invoke test injection seams, mutate source YAML to describe the game checkout, or forge an upstream event.

## Smallest adapter

Implement one separately reviewed game workflow plus a small provenance/retention wrapper; reuse the unchanged restorer and source owner. After authentic shared-output review/import and the CLI inventory correction:

1. Capture a new committed source snapshot with the immutable bundle/patch/manifest format, exact source commit/tree and retained hashes. Use a separately named native-preparation snapshot so shared proposal and historical full-VV snapshots remain intact. The existing restorer admits exact base `3666dc0...`, upstream source URL, and bundle branch `numeric-export-backport`; those are snapshot transport constraints, not a requirement to publish the new source upstream.
2. Use the upstream matrix unchanged: `ubuntu-24.04` / amd64 and `ubuntu-24.04-arm` / arm64; fail-fast false, max-parallel 2, 75-minute lane limit. Run on the real hosted machines; no QEMU, self-hosted substitution or local GitHub environment fabrication. A narrow game-branch push trigger and/or dispatch are admitted runtime events. Use contents-read only and the original pinned setup-node 22.23.2, buildx 0.28.0/buildkit digest and artifact actions. No Docker login, SDK rebuild or promotion.
3. Checkout the game execution SHA to `game/`, checkout exact upstream base to `prismpm/` with full Git history and credentials disabled, and restore the new captured source into `prismpm/`. Keep it owned by the hosted runner's unprivileged user. Retain the exact restorer receipt, snapshot metadata/hashes, source HEAD/tree and source-owner/test/workflow/lock hashes outside the source. Check clean/fresh state; do not use the shared-writer devcontainer or its chown-to-1000 sequence.
4. Start the original bounded observer from the restored source. From `prismpm/`, with only a wrapper-owned `SOURCE_REVISION` set to the exact captured commit, execute the original two commands in order:

   ```sh
   node scripts/native-golden.mjs tests
   node scripts/native-golden.mjs run "$SOURCE_REVISION" "$RUNNER_TEMP/native-golden"
   ```

   Do not set `GITHUB_SHA` or any other `GITHUB_*`/`RUNNER_*` variable. A wrapper may retain bounded original stdout/stderr and exit status using the original observer command runner, while preserving command failure and not treating truncated output as complete evidence.
5. Always stop the observer and upload the entire native owner destination, observer diagnostics and wrapper provenance/status, including failures. Preserve the original raw files and schema; the wrapper can report only `complete-review-required` or `incomplete`, never acceptance. A missing owner `review.json`, helper failure, cleanup error, absent provenance, missing file or truncated required log must remain incomplete. Review both architectures and all six raw records before importing their exact bytes in a subsequent source commit.

The source owner has no runtime dependency on the game wrapper's own directory names. The main wrapper responsibilities are immutable source transport and binding the game's execution identity to the separate source identity.

## Provenance/schema requirements

No modification of `prismpm/native-golden-review/1` is necessary to execute this approach. It already records source_revision separately from environment_revision, real run ID/attempt, native architecture basis and original file hashes. **Its run ID has no repository field**, however: retaining only that record would leave the game run's origin ambiguous to a consumer assuming upstream execution.

Add a separate, game-owned, versioned orchestration envelope (for example `cs1618/prismpm-native-golden-orchestration/1`) rather than inserting fields into, rewriting or normalizing the native review record. Give it a closed documented field set and require it before declaring complete. It should bind:

- Real `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY` (`R4-Laboratories/uor-cs1.618`), game execution SHA, workflow ref/SHA, event, ref, run ID/attempt and run URL.
- Actual selected runner OS/architecture/environment, relevant runner image identifiers, matrix lane and expected native profile. These are runner-selection provenance, not hardware attestation.
- Separate source repository authority, captured base, source revision/tree and original bundle/patch hashes; hashes of the exact restoration receipt and source owner/test/workflow/environment-lock bytes used.
- Original helper/owner exit status, observer/completeness state, original native `review.json` and complete artifact file inventory with byte lengths/hashes, including the three raw records, generated products and command/dependency evidence. Cross-check native record source/run/attempt/platform with the real envelope values.

Initialize this envelope/status incomplete before helper invocation in a fresh sibling evidence directory, since the native owner requires its own destination not to exist. Keep the envelope and original native artifact associated by hashes and artifact names including architecture, source revision and actual run/attempt. Validate retained envelope/identity files as bounded regular files; prevent stale successful sidecars from surviving a capture failure. The previous shared-preparation completeness fix supplies the relevant pattern.

If later product requirements insist that repository/workflow identity be inside the source-owned native schema itself, that is a separate explicit source schema/provenance change needing owner/tests/consumer review. It is not required for this minimal adapter when the original record plus mandatory hashed game envelope are retained together.

## Unchanged generation gates and resources

The adapter must retain the complete active owner behavior, not reconstruct a lighter generation path:

- Before acquisition: exact source baseline, independently reviewed application generator owner/framing and descriptor-relative compiler alias; clean revision and fresh outputs. Architecture-specific locked environment metadata is checked against both child and config digests before pull; loaded image identity is checked against the lock's environment source revision.
- Both locks retain index `ghcr.io/uor-foundation/prismpm-sdk-candidate@sha256:42213da87c564d859e327ab7df2459357d674fa538050f13905caa24c352588e`, environment revision `6ebbef86a300ff4490c4c37f821e50585e211481`. amd64 child/config are `53889b1c...1251a9` / `7aa85f1e...e4b973`; arm64 are `2bbf0e55...d94c87` / `97a66398...9dd7f`. Use exact retained lock bytes, not these abbreviations as authority. This development-only image remains distinct from unchanged-d6 source VV.
- Free disk reserve is **12GiB plus independently measured compressed image bytes**, with an initial/additional 256MiB headroom check. The shared writer's 8GiB check is insufficient for native owner admission. No local full SDK pull is needed for this design; acquisition belongs on the hosted lanes.
- Acquisition actor: native image, unprivileged mapped host UID/GID, source read-only, read-only rootfs, bridge network, data-only supplement, 3GiB noexec/nosuid/nodev tmpfs, 2GiB memory/swap cap, 2 CPUs, 256 PIDs, all capabilities dropped and no-new-privileges. Exact actor/network/mount/environment identities are inspected; no credential/registry/proxy redirection is admitted. All **22** dependency controls run, then bounded locked acquisition. Acquisition actor is destroyed and its absence checked before offline generation.
- Offline actor: same locked native image, network none, source writable, supplement read-only, private writable Cargo state, 4096-PID bound, dropped capabilities/no-new-privileges and exact actor checks. It verifies Ubuntu24.04 and native process architecture, runs all **38** exporter-seed controls, seeds/validates immutable cache input, installs/revalidates the supplement, and performs locked offline fetch against all four original manifests.
- Existing native-owner `CARGO_BUILD_JOBS=2`, DEV/TEST debug=0 and the review reason are owner-defined inside this source-development actor. Preserve them there; they are not authorization for global wrapper overrides in other governed verification flows.
- Original `cargo run --locked --offline -p xtask -- check-golden --write`, then the unchanged readback command without `--write`; repeat hashes of all three native records must agree. Cache/manifests/config source cannot mutate or redirect; final source revision/baseline is rechecked, and only the architecture's exact three native record paths may change.
- Owner command bounds: ordinary calls 120 seconds and 16MiB captured output; image pull 1200 seconds; dependency preparation 660 seconds; each original golden command 7200 seconds, under the upstream 75-minute job limit. Do not silently extend/shorten these or omit a command. Cancellation/failure performs authenticated cleanup before retaining generated products; failure remains failure.
- Tree retention: no symlink/special members, depth <=32, <=20,000 entries, <=1GiB aggregate per owner tree traversal, regular file default bound 128MiB. Cache bounds are <=250,000 entries and <=2GiB; image cache file bound 256MiB. Preserve the original observer's 30-second sampling, 8MiB telemetry bound, 32MiB log head and rotating 1MiB tails; log truncation cannot support an adapter complete label. Do not filter raw evidence to meet a new arbitrary smaller artifact cap.

## Expected artifacts and next decision

Each native lane must preserve the whole fresh owner destination:

- `review.json` only after successful commands, input checks and cleanup, retaining status `review-required` and explicit unclaimed hardware/review/SDK/product claims; or original `failure.json` with cleanup/runtime identities on failure.
- `environment.json`; numbered `NNN.command.json`, stdout and stderr files; `cargo-seeded-inputs.json`, `dependency-preparation.json`, `cargo-inputs.json`, and any `unaccepted-dependency-preparation.json`.
- `records/golden-manifest.json`, `records/verified/lexlean-attestation.json`, `records/verified/manifest.json`: three raw files per architecture, **six total**.
- Full `generated/build/**` and `generated/verified/**` products retained after owned compiler actor shutdown, plus the complete observer diagnostics and required game orchestration envelope/status/logs.

Use the original failure-always upload policy, full raw directory compression level 6, 14-day native evidence retention and 7-day observer retention as the minimum upstream-equivalent behavior. Wrapper completeness must check both successful original owner return and retained evidence; an artifact existing is not acceptance.

Actionable next step: finish/review genuine shared output import and the native CLI inventory correction, capture their final exact source commit, then implement and independently review the small game transport/provenance workflow described above. No upstream publication or GitHub environment forgery is needed. Native outputs still need independent byte-preserving review/import, followed by a newly captured candidate and all eight source VV partitions at one exact revision; SDK/product gates remain separate.
