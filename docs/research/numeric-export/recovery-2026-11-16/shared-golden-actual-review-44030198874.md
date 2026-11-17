# Actual shared-golden proposal review — run 44030198874

**Scoped byte-review verdict: PASS; the five-file proposal is internally consistent and explained by the intended source/provenance refresh. Collection/job verdict: INCOMPLETE, unchanged.** These retained bytes are suitable for comparison with a later fresh, complete proposal. This review does not authorize importing them, fabricate original collection success, or establish native-golden/SDK/source-VV acceptance.

Reviewed evidence: `artifacts/numeric-task2c/ci-44030198874/backport-shared-golden-proposal-44030198874-1`, the parent's complete-tree and semantic comparison diagnostics, and the bounded identity/writer interfaces from exact source `324955b6923c1d194d7bc870a2d2a05eb687048c`, tree `7cf463121cf5dd15b681ce1dfafd5694617cc474`. The original game identity is `ab9d45adc02ef048a40f4a67b4d5186bccd6b328`.

## Actual command and source evidence

The four retained command records and gate results report their exact expected commands, `exit_code: 0`, and completed gates without diagnostic errors:

- `node --test scripts/native-golden.test.mjs`: 19 passed, no failures/skips.
- `node --test scripts/text-workbench.test.mjs`: 26 passed, no failures/skips.
- `just golden-write 'Review exact proposed backport shared golden source.'`: actual xtask generation wrote 418 reviewed files for build `92ffbe4993596c1abe331e3043922153dc3d59291609f03bdf7637a7f3904c7f`.
- `just golden-check`: 418 files matched that reviewed build under `DevelopmentAmd64`.

I read the actual command logs and independently checked their hashes, command records, gate-result records and retention metadata against `result.json`. All four logs are complete and explicitly nontruncated; observed/head byte counts match their files. These are retained execution results, not tests rerun by this review.

The retained candidate receipt selects source324/tree7cf46312 with bundle `0e6e0a5fb250f6c6ca236b34d7ee953d1bf22a25145876e5b1a970658376a17e` and patch `e811bbcb73d32e47c9ef774f33bdd38a46fb6841bf5c1f6837c2b1d485af3bef`, matching the previously independently reviewed preparation capture. The source-inputs and container records identify the same source/tree. I independently matched all four declared devcontainer file hashes to immutable source324. The retained container is Linux amd64 with image-config digest `sha256:dc8cc1bf8893ca3d31a83dd33ea177159816418c344335c892ad2295f1f40628`; its empty repository-digest list is not relabeled as the released d6 SDK. This is source-devcontainer shared-golden generation.

## Five-file semantic review

The parent's complete-tree comparison reports 424 retained golden files, no additions/deletions, five changed stdlib JSON files and 419 byte-identical files. I independently compared the five changed JSON documents against their immutable source324 originals; their recursive differences exactly match the supplied semantic diagnostic:

| File under `tests/golden/stdlib/` | Change and meaning |
| --- | --- |
| `build/manifest.json` | New Released application-generator, dependency-register and emitter identities; model identity and its file-row digest follow the changed model provenance. |
| `build/model.prism.json` | Only `/provenance/emitter_semantics_id` changes. Architecture, quality/security fields, compiler semantics, source/semantic/snapshot identities and facet-package bindings remain unchanged. |
| `verified/lexlean-attestation.json` | Only the executing caller's `lexlean.executable_sha256` and the consequent attestation ID change. Declaration policies/results, generated proof/source bindings, toolchain and process records remain unchanged. |
| `verified/manifest.json` | Build ID, model digest, LexLean attestation ID and attestation-byte digest propagate those changes. Export/package/runtime roots, process records, execution evidence and all other artifact descriptors remain unchanged. |
| `golden-manifest.json` | Build/attestation IDs, the four changed member digests and the explicit new review reason change. Source rows, generated Lean rows and compiler-semantics identity remain unchanged. |

The unchanged attestation body includes 7,594 declaration results, all `ok`, and 181 LexLean process rows. The Prism manifest retains 73 process rows and the unchanged passing execution evidence: 597 cases plus 54 control cases (48 negative, 6 positive). These are shared stdlib evidence, not the four numeric package or 44,648-vector gates. The unchanged generated Rust/kernel/executable descriptors remain unchanged descriptors: the writer deliberately omits those three native payloads from shared golden retention, so this review does not independently replay them.

The `lexlean.executable_sha256` change is consistent with a rebuilt current caller, not changed formal compiler semantics. The inspected writer calls `golden::current_caller` against its actual executable bytes; the existing comparison profile permits only the declared caller-identity normalization for subsequent readback and preserves original raw records. The new recorded caller hash is `30798fad44a3a6770320819b346aa99e072b8811c08f6abbdf507c8b58ff4cda`. Its binary is not retained in this proposal, so I rely on the original successful writer's current-caller check rather than claim an independent ELF measurement.

## Independently reconstructed identities and bindings

I reconstructed the exact Released source frame/application recipe and measured all 31 ordered emitter source owners, then measured the dependency register. They reproduce the proposed identities:

- Application generator: `0eae6b594fc9edbb37ed52d038e15c48c1a2b5cea97fd49e4ec07135375d54f1`.
- Emitter semantics: `c8213cedf16ad1691f136122a58a87a33a596a95e8e5c9b361bf78109df22133`.
- Dependency register: `277d2b5a5c52dfe98e7d06c98fad63c601c51b078f91d029830ecb7fcc33fac6`.

These are source-derived identities, not manually accepted replacement hashes. The application-generator field belongs to the common shared build-input recipe; it does not imply that this stdlib proposal qualifies a numeric native-library frontend or a product application.

I checked all 298 build-manifest file rows and all 417 golden-manifest member rows against retained bytes and lengths. All five changed files match the retained result hash index. Canonical build-input hashing reproduces build ID `92ffbe4993596c1abe331e3043922153dc3d59291609f03bdf7637a7f3904c7f`; the model hashes to `47c8038d51cbf230c73a2bf565c10b729dab1d27e2bbad0d69c77619d304f97e`; the verification manifest hashes to `f6fbaf3c36f235539aa4a9cb26d8df435f1bf28a74a3f5c33fe490ae1e69bf75`. Independently applying LexLean's labeled, length-framed attestation recipe to the canonical body without its ID reproduces `5a8decbce2d806491bd3e9c7a78cfec13607cbd3f7d4d7e4f77f2d289800cae4`. All dependent cross-file hashes/IDs agree.

## Collection limitation and next comparison

`result.json` truthfully remains `status: incomplete` and records `git add -N -- tests/golden` failing with exit 128. The observed host `.git/index.lock` permission failure followed UID1000 ownership transfer. The collector copies generated files before that command; it never reaches the subsequent outside-`tests/golden` changed/untracked-path check, review-patch creation, or remaining completion checks. Successful writer/readback commands and an internally consistent retained golden tree do not repair this missing boundary check. Parent verification of all 460 retained SHA entries and complete-tree comparison likewise cannot prove the failed job's unretained outside-golden working tree was unchanged.

No byte-level blocker was found in the bounded five-file proposal. A repaired collector and fresh complete run must still produce the full original identity/status/outside-golden evidence; its resulting files should be compared byte-for-byte with these preserved bytes before any later import decision. The original failed collection stays failed even if a future proposal matches. Native golden regeneration, full source VV and original actual SDK/numeric/corpus admission gates remain separate.

Review execution: no writer/test/build rerun, Docker use, source/workflow edit, import, subagent or push. The source worktree had independently advanced to `420e285a…` with unrelated capture-tool edits during this task; I did not modify it. Every measured recipe owner and inspected identity/writer interface was separately verified byte-identical to immutable source324 before using it. Only this review report was written.
