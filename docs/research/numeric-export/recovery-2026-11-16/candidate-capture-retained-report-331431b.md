# Task4a source implementation report

Status: **IMPLEMENTED AND COMMITTED; independent fresh review required before source snapshot or hosted launch.** No actual SDK capture, application acceptance, generated replay, daemon qualification or full VV is claimed.

## Exact source state and scope

- Worktree `/workspace/scratch/prismpm-numeric`, branch `numeric-export-backport`.
- Base `f8808ad717a1582cd39d8c01bc452519a112afdd`, tree `c8ea557e6cc9b6b13355831f5fef71dff2addf3e`.
- Head `331431bc6c2b71ca06d5e145d9e6a825f6218053`, tree `99915b2e2002f4c7bd2cd67d433e111af3141719`.
- Commit: `Retain actual candidate mutation controls and early failure locators`.
- Exactly four owned paths: `tests/publication-context-linkage/capture-owner.mjs`, new private `capture-retained-controls.mjs` and `capture-retained-controls.test.mjs` beside it, and `xtask/src/main.rs` only one focused source-check inventory row adjacent to `candidate-transport.test.mjs`.
- Commit used `git commit --only` with those four explicit paths; source status is clean. No push, PR, subagents, Docker, SDK pull, full Rust rebuild or unrelated cleanup.

The adopted qualification design, controller adoption and targeted design review (including the permitted unchanged bounded ELF listing) were read before implementation. Source `AGENTS.md` and the normative security/candidate-capture sections of `SPEC.md` were consulted. The TDD skill informed focused component tests; the explicit task limits govern verification, so no full build/VV was attempted.

## Held controls and custody

The actual factory creates its locator before its first prerequisite, then keeps all original source/build/capture/oracle prerequisites. After it privately holds the complete retained tree and verification closure, it calls the private helper synchronously with its actual `verify`, actual `verifyTransport`, original transport result and independently owned executable digest. No new prerequisite, `t.test`, factory callback, environment selector, serialized compiler brand or externally selectable factory hook was added. The real owner still retains `source.records` and its actual branded executable; the helper neither replaces nor reconstructs them.

The exact ordered closed inventory is:

1. `source-byte` targeting `source/crates/prismpm/src/exporter/source.rs`.
2. Six `authority-byte:<name>` rows in order: `conditional-capture-bootstrap.py`, `conditional-capture-candidate-command.mjs`, `conditional-capture-candidate.py`, `conditional-capture-sdk.py`, `sdk-command-owner.mjs`, `sdk-command-owner.py`; each targets its private `source/scripts/` copy.
3. `envelope-missing`, `envelope-altered`, `retirement-incomplete`, `observed-config-coherent`, `observed-retirement-coherent`, each targeting `capture/candidate-transport-evidence.json`.
4. The four original added-file cases, incorporated rather than duplicated: `added:.git`, `added:target`, `added:.lexlean`, `added:.prism`, targeting those capture-root members. Original payload, exclusive write, held-tree refusal and removal semantics remain.

Before controls, the helper positively invokes the actual held verification and reader, copies the original transport result for later comparison, and holds original envelope and all seven source/authority targets with bounded regular identity, exact bytes and mode. Each control positively verifies, applies one mutation, requires the intended named direct-reader rejection or successful coherent observation, requires the held owner's rejection, restores in `finally`, checks original identity/bytes/mode/path, and positively verifies before appending a passed row. Unexpected reader errors and swallowed checks fail. An inode-replacement/restoration failure cannot become a successful row or completed sidecar. Missing-envelope uses an exclusively reserved fixed sibling `work/candidate-transport-evidence.missing-control`, refuses occupancy, renames the original inode out of capture and back, and verifies identity.

Only source/authority data copies and the retained envelope are changed. The actual unchanged reader rejects source/authority drift before its listing. For envelope observations, the unchanged reader may use its existing bounded listing of the unchanged independently owned ELF; no selected test body, altered authority, helper, SDK actor or compilation is launched while mutated. Existing executable mutation and original source barriers are unchanged.

Config mutation changes a valid runtime digest and recomputes only the canonical descriptor's stage digest. Retirement mutation changes one distinct well-formed actor ID while leaving roles/order/names/absence/EOF intact. Both must return successfully from the standalone reader and fail held retained-tree custody. This documents observation shape versus original retained evidence, not cryptographic or historical daemon attestation.

## Closed sidecar and factory evidence delta

After all 16 controls/restorations and final original verification, the helper exclusively writes `work/candidate-retained-controls.json`, outside `work/capture`, mode0444, at most65536 bytes. Exact keys are `schema`, `scope`, `complete_application_accepted`, `status`, `source_sha256`, `envelope_sha256`, `executable_sha256`, `controls`. Values bind schema `prismpm/candidate-retained-controls/1`, scope `actual-held-capture-mutations-only`, acceptance false and status completed, plus the original verified source digest/original envelope hash/actual executable hash.

Every ordered row has exactly `id,target,reader_result,held_owner_refused,restored`. The first10 reader results are `refused`, the next2 `observed-shape-accepted`, and only the original4 added-file rows use `not-invoked`. Both booleans must be true. Missing, omitted, reordered, duplicated, invented, wrong-target or unsuccessful rows refuse validation. Rows are appended after actual checks/restoration, never prefilled planned successes.

The helper holds the exact published bytes/hash and inode/mode and supplies a private retained-record verifier. The factory's existing returned `verify()` now checks that custody before its original checks, so surrounding replay barriers also check it. The factory evidence adds exactly `retainedControls:{path:"candidate-retained-controls.json",bytes,sha256}`. This private factory-record delta requires independent review. Application capture receipt/envelope schemas remain unchanged, and there is no circular tree hash.

## Early noncompletion locator

Immediately after work allocation and before source staging/build/capture, the owner calls the private locator helper with its actual repository and work. Fixed registry: `repository/target/conditional-publication-capture-locators/`; exclusive filename: actual work basename plus `.json`. Registry mode0700; records mode0400 (existing0400/0444 accepted), bounded regular single-link files at most4096 bytes. Registry admissions validate every existing closed record, reject unexpected names/files/aliases/unsafe modes/foreign ownership, and require fewer than256 prior entries and total existing-plus-new bytes at most1MiB. Source root, target, registry and work are checked as real owned directories with no-follow path ancestry; work must be0700.

Closed record: `schema:"prismpm/private-publication-capture-locator/1"`, `complete:false`, `accepted:false`, exact `work_basename`, absolute `work_path`, original absolute `source_root`, and `owner_module_sha256` measured from the actual owning source module. Work must match `/tmp/prismpm-publication-capture-[A-Za-z0-9_-]{6,64}` exactly. No source inventory is fabricated at this early stage. This is discovery only: neither completion nor ELF/source authority nor authority to execute. Later failures retain work/locator and original stderr diagnostics. A component test executes the exact current factory function body with explicit pre-capture dependencies and a failing first prerequisite, checking the locator precedes the failure and no completion/sidecar exists.

## Focused verification and honest host limitations

Evidence root: `/workspace/diagnostic-tools/candidate-capture-retained/`. Each numbered command retains argv/cwd/exit/elapsed/free-space metadata plus bounded stdout/stderr. Explicit child environment changes appear in argv; no new test mutates global environment. Tool hashes cover actual Node, Python, timeout, pinned Rust1.97.1 and the already-built semantic-source binary. The complete baseline file-hash inventory and protected/final-state audits bind source inputs.

| Evidence prefix | Result |
| --- | --- |
| `01-component-red` | Expected initial missing-helper import failure; this alone is not a behavioral red witness. |
| `02-component-green` | 7/8 pass; ownership test fixture incorrectly required root, while host uid is1000. Corrected fixture uses genuinely foreign-owned `/tmp` on nonroot hosts and actual chown on root hosts. |
| `03-component-green` | Initial8 component groups pass. |
| `04-reader`, `05-capture-guard`, `06-compiler-custody` | Raw-host failures retained: rustc/cargo absent from inherited PATH; custody's inherited NODE_PATH refusal. |
| `07-reader-pinned`, `08-guard-explicit`, `09-custody-explicit` | Command setup errors retained: replacing PATH omitted this host's actual Node location, so no tests ran. |
| `10-reader-pinned` | All8 unchanged independent-reader groups pass, zero failures/skips, with existing pinned Rust first on child PATH. Only tiny existing component-ELF fixtures compile. |
| `11-guards-pinned` | Both original capture-guard groups and two narrow compiler-owner checks pass (4 selected, zero failures/skips). Uses the existing semantic-source binary; no Cargo rebuild. |
| `12-custody-pinned` | Broader existing compiler-artifact and mutation suites:9 pass,10 fail, zero skipped. Host lacks pinned `/usr/local/cargo/bin/rustc`; policy was not weakened. |
| `13-component-integration` | All9 new component groups pass, including exact factory early-failure ordering. |
| `14-planted-ordering`, `15-planted-refusal` | Two behavioral planted defects each fail their intended focused witness: removing early locator prevents prerequisite discovery; swallowing the direct-reader refusal loses the required exception. Exact source bytes restored in `finally`; restored hashes retained in `planted-control.json`. |
| `16-final-components` | Final9/9 component groups pass with no failures/skips. |
| `17-whitespace`–`20-test-syntax` | Diff whitespace and all3 affected JavaScript syntax checks pass; staged whitespace was also checked before commit. |
| `21-protected-audit`, `22-committed-state` | Scope/protected comparisons pass; exact committed state retained. |

The10 still-failing custody checks are `actual compiler custody defect pre-execution-check`, `post-execution-check`, `opaque-handle`, `persistent-permissions`, `final-barrier-sweep`, `fresh-execution-barriers`; `nested actual executions never revive pre-child measurements on success or failure`; `fresh compiler capture retains original and separate singly linked private executable`; `private exporter keeps its guarded entrypoint without allowing driver environment overrides`; and `successful and failed actual executions both check compiler identity afterward`. Mutation witnesses report that earlier host/tool failure prevented their intended witness. These are not relabelled as passing controls. Previous reaper limitations remain unqualified; no policy relaxation or fabricated SDK metadata was used.

The initial reader's5 PATH-blocked groups were real-file transport closure, closed descriptor/lifecycle mutations, altered actual source/authority/ELF/receipt, held coherent observation replacement, and candidate caller completion. They subsequently passed unchanged in `10-reader-pinned`. The initial syntax-projection guard's cargo-PATH failure subsequently passed unchanged using its already-built tool in `11-guards-pinned`.

## Protected bytes, counts and remaining gates

The baseline covers12835 tracked members; all12833 nonowned members are byte-identical. Only owner and the one xtask row changed among existing files. The protected audit separately records immutable Task1/2 dependencies, legacy authority, original Rust capture body, Node boundary code, reader/oracle and all5 imported goldens. SDK/tool/runtime/dependency pins are unchanged. Original65+2 OC10 registration remains exact; owner still has its original6 prerequisite calls. The original12 Node boundary code is byte-identical; no Rust rebuild/retest was performed solely to restate unchanged inventory.

Actual16-row SDK control evidence awaits genuine Task4b OC10; temporary helper fixtures and their logs are explicitly component evidence. Same-source generated replay, actual unmodifiedSDK/mount/EOF/daemon/retirement behavior, diagnostic artifact custody, Task4b qualification and full VV remain outstanding. Source changes need fresh independent review before snapshot or hosted launch. Final recorded free space9591078912 bytes (>8GiB); all command checkpoints stayed above8GiB. No claim of the later10GiB SDK-stage budget is made.

Evidence index: `index.json` covers75 other retained files totaling3276002 bytes (each at most4MiB, total below8MiB); index SHA-256 `ae25d03a835225f392fd412bdeb41a5abdf5ab681486f489fb6aab47699ca21d`. The index does not recursively hash itself. Command stdout/stderr each have a2MiB bound. `reviewed-source.diff`, `scope-audit.json`, `protected-before.json`, `tool-hashes.json` and `final-state.json` are indexed with the command logs and planted-defect witnesses.
