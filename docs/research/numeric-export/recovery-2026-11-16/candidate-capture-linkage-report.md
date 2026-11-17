# Task4a2 — additive source capture/linkage discovery bridge

Implemented and committed the narrow source discovery correction. This is host component evidence only: no actual SDK capture, generated native/Wasm replay, application acceptance, daemon qualification, artifact acceptance or full VV is claimed. Fresh independent review is required before replacing Task4b's source snapshot or resuming its game implementation. No upstream push/PR, Docker operation, SDK pull, full Rust rebuild, subagent, or Task4b-owned file edit occurred.

## Source identity and scope

- Repository `/workspace/scratch/prismpm-numeric`, branch `numeric-export-backport`.
- Exact clean BASE `331431bc6c2b71ca06d5e145d9e6a825f6218053`, tree `99915b2e2002f4c7bd2cd67d433e111af3141719`.
- HEAD `f292c7100874c0e0b2d1e0e81b27caeec8391f77`, tree `d48cdfd94e6d46925e9269e364c2b7a6eb975d8a`; clean source status after commit.
- Commit `test: link private capture evidence to retained linkage work`, made with `git commit --only` and exactly these four paths: `tests/publication-context-linkage/{compile.mjs,capture-owner.mjs,capture-retained-controls.mjs,capture-retained-controls.test.mjs}`. No xtask or Rust change.
- Retained complete BASE-to-HEAD `reviewed-source.diff` SHA-256 `1f34c11b55c292950f7db0990bae7e85d1af07d9bc91cfb4464f65c2060054e9`.

Read the Task4a2 brief first, source AGENTS and normative conditional-publication admission, adopted qualification design including its final Task4a2 correction, and accepted Task4a report/review. Task4a's original implementation remains accepted and unchanged; this closes the subsequent discoverability gap.

## Exact additional contracts

The original Rust Node owner intentionally does not forward raw child TAP/private paths. Its source, reporter, closed emitted numeric success summary, and exact 65+2 per-file validation are unchanged. Task4b must retain actual Cargo stdout/stderr and actual emitted summary, plus the fixed-source expected inventory and the unchanged validator's enforcement. It must not invent retention of unforwarded child TAP.

The original capture helper, its 16 controls, sidecar and capture-locator code remain an exact byte prefix of the updated helper. Its registry/grammar/module binding are not generalized or repurposed.

The new private fixed `createLinkageLocator({sourceRoot,work})` writes one exclusive locator in `sourceRoot/target/conditional-publication-linkage-locators/`, with filename `<actual-work-basename>.json`. Schema is exactly `prismpm/private-publication-linkage-locator/1`; exact keys are `schema,complete,accepted,work_basename,work_path,source_root,owner_module_sha256`, with `complete:false,accepted:false`. Work basename matches `prismpm-publication-linkage-[A-Za-z0-9_-]{6,64}` and work is exactly `/tmp/<basename>`. The module digest measures the actual fixed `compile.mjs` file, bounded at 1 MiB, using the existing owned singly linked no-follow regular-file reader. There is no caller-selected module, registry, prefix or schema and no fabricated full source identity.

Source root/target/registry/work must be owned, real, unaliased directories with safe permissions; work and registry are exactly 0700. Records are singly linked, owned, no-follow regular files, at most 4096 bytes, immutable mode 0400/0444 (new records 0400). Every existing linkage entry is validated against the linkage-only grammar, source root and actual compiler module hash. Admissions cap existing-plus-new records at 256 and bytes at 1 MiB; aliases, unexpected or malformed entries, cross-kind records, occupied own filenames, unsafe modes and foreign ownership refuse. Original capture records never accept the linkage schema or prefix. The same fixed linkage validation is used when following the held build reference.

`prepareStage` calls the locator immediately after its real `mkdtempSync`, before source/path/project generation or any child launch. All original compiler-owner, mutation, frozen-source and environment guards remain. Because baseline, mutation and component owners share this function, each allocation gets the same discovery contract. A locator refusal prevents further work execution. Later errors retain the existing work and locator, without implying completion.

`verifyCapturedPublicationLinkage` validates the actual already-held `build.work` before the original capture factory, then validates again after original replay barriers. It adds exactly `linkage:{work:build.work,receipt:"publication-linkage-evidence.json"}` to `prismpm/private-publication-capture-owner/1`. This is a directory plus fixed future basename, with no future hash or receipt-existence claim. `build.unchanged()`, original factory and actual replay checks remain in place. No callback, public preparation option, public factory signature or branded compiler reconstruction was added.

`checks.mjs` remains byte-identical: its later `publication-linkage-evidence.json` retains the original `actualCapture:{path,sha256}` forward relation. Thus capture-owner bytes/hash can exist before the outer linkage receipt; the later receipt binds those actual bytes without a hash cycle.

## Verification and retained commands

Evidence root `/workspace/diagnostic-tools/candidate-capture-linkage/`. Every numbered command has exact argv/cwd, exit/elapsed/free-space metadata and bounded original stdout/stderr. `run.py` enforces an 8 GiB starting floor and a 2 MiB bound on each command stream. Audits record source/tool hashes and source identity. No test changes global environment; pinned child environments are explicit argv.

| Evidence prefix | Observed result |
| --- | --- |
| `01-component-red` | Original 9 groups pass; six new groups fail. Four report missing linkage helper exports; two behavioral witnesses fail because actual `prepareStage` reads source before any linkage locator and actual owner output lacks the reverse reference. |
| `02-component-green` | All 15 focused groups pass, no failures/skips. |
| `03-reader-pinned` | All 8 unchanged transport-reader groups pass, no failures/skips. |
| `04-guards-pinned` | Four narrow original capture/compiler-owner groups pass, no failures/skips. |
| `05-planted-early-locator` | Removing only the new locator call from actual `prepareStage` makes the intended exact-body witness fail: `early linkage locator must precede source/project reads`. |
| `06-planted-location-validation` | Removing both new owner location validations makes the actual-owner negative witness fail with `Missing expected rejection`. |
| `07-final-components` | Exact source restored in `finally`; all15 groups pass, no failures/skips. |
| `08-protected-audit`, `15-committed-protected-audit` | Full tracked/protected-byte audits pass before and after commit. |
| `09-whitespace`, `10`–`13` | `git diff --check` and `node --check` for all four owned files pass. |
| `14-commit` | Exact `git commit --only` four-owned-path command succeeds. |

The six new groups cover repeated legitimate work, exact compiler binding, missing/wrong-root/wrong-owner locators, source/path/schema/basename confusion, cross-registry/capture-prefix rejection, immutable modes, symlink/hardlink aliases, malformed/oversize files, ownership, the 256-record boundary, early project failure and blocked locator admission with no child, and a reverse reference followed by a later component-only forward receipt. The owner test also removes the locator during replay and verifies no capture-owner receipt is emitted. Function-body tests execute the exact current function bodies with explicit component dependencies, not a copied implementation or new production injection hook. They confer no compiler/ELF or generated-replay authority.

The focused command is:

```sh
node --test tests/publication-context-linkage/capture-retained-controls.test.mjs
```

Reader and guard commands use the same already-correct pinned child environment as accepted Task4a:

```sh
env -u NODE_PATH -u NODE_OPTIONS -u LD_LIBRARY_PATH -u LD_PRELOAD \
  PATH=/workspace/diagnostic-tools/rust-1.97.1/bin:/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin:/usr/local/bin:/usr/bin:/bin \
  CARGO_HOME=/workspace/diagnostic-tools/cargo-home \
  ELAN_HOME=/workspace/diagnostic-tools/elan \
  node --test tests/publication-context-linkage/candidate-transport.test.mjs

env -u NODE_PATH -u NODE_OPTIONS -u LD_LIBRARY_PATH -u LD_PRELOAD \
  PATH=/workspace/diagnostic-tools/rust-1.97.1/bin:/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin:/usr/local/bin:/usr/bin:/bin \
  CARGO_HOME=/workspace/diagnostic-tools/cargo-home \
  ELAN_HOME=/workspace/diagnostic-tools/elan \
  PRISMPM_SEMANTIC_SOURCE=/workspace/scratch/prismpm-numeric/target/debug/prismpm-semantic-source \
  node --test \
  '--test-name-pattern=independent capture decoder|independent syntax projection|compiler owner refuses forged handles and unregistered tool families|all five existing adapters reject forged owners' \
  tests/publication-context-linkage/capture-guard.test.mjs \
  tests/browser-view/compiler-owner.test.mjs
```

The retained evidence runner wraps these exact argv; guard/reader logs include original observed output. Reader fixtures compile only their existing tiny component ELF; the guard uses the already-built semantic-source binary. No full build occurred. An initial hash-inventory setup attempted to read a tracked directory symlink as a file; it was corrected before source edits to hash symlink target bytes, and the complete baseline inventory succeeded. This setup error is not a test result.

## Protected bytes and honest limits

All 12837 BASE tracked members were measured before edits. All 12833 nonowned members remain byte-identical. The original full `verifyCapturedFactory` body is byte-identical; the retained controls and capture-locator helper prefix are byte-identical; the six existing prerequisite calls and original 65+2 OC10 registration remain exact. Rust capture/source-free controls, 12-boundary source, Node reporter, outer forward receipt, xtask source-check inventory, all immutable helpers, reader/oracle, golden files and dependency/runtime/tool pins are unchanged. `scope-audit.json` separately lists protected byte hashes as well as the complete baseline inventory.

Prior unsupported-host compiler-custody failures are not relabelled as passes and were not rerun: accepted Task4a's broader suite remains 9 passed/10 failed due to the missing pinned `/usr/local/cargo/bin/rustc` and earlier host failures preventing six intended mutation witnesses. Previous reaper limitations remain unqualified. These changes do not alter those boundaries. No actual generated SDK replay is claimed; original full gates remain mandatory downstream. Source/runtime observations are not cryptographic or historical daemon attestation.

Free space at initial source inspection was 9,578,856,448 bytes; final recorded source state had 9,470,357,504 bytes, above 8 GiB. Every recorded command started above 8 GiB. No claim is made that the separate 10 GiB SDK-stage floor has been met.

## Downstream collector join and review gate

Task4b must discover only new records in both fixed registries from its fresh dedicated checkout. A linkage locator is always noncompletion. The collector must validate exact locator schema/name/path/source/module/ownership/mode/bounds; join capture-owner's exact `linkage.work` and fixed receipt basename to an actual linkage locator; require the real later linkage receipt; require its forward `actualCapture.path` and SHA256 to match actual retained capture-owner bytes; and match IR/compiler identities and complete original proof/generated/native/Wasm/source products. Absent final receipt, original gate failure, missing products or mismatched joins remain incomplete. No arbitrary `/tmp` scan, prose-path discovery, fake owner, fabricated hidden TAP or acceptance marker is authorized.

Fresh independent review of this exact source commit/diff and evidence must precede Task4b snapshot refresh and game implementation resumption. Native workflow remains separately fixed at 881 and was neither changed nor relabelled.

Evidence index `index.json` covers 54 other retained files totaling 3,224,667 bytes, each at most 4 MiB and total below 8 MiB. Index SHA-256: `19481afdf65a45c30b7ad8ecd66d58d067b5dd52b3669519ea21b2d92f927a8e`. It does not recursively hash itself. `planted-control.json` binds each deliberate defect and exact restored source hash; `final-state.json` binds committed identity and clean status.
