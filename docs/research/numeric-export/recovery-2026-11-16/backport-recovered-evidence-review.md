# Recovered B1 installed-SDK evidence review

Read-only review, 2026-11-17. **The recovered evidence supports the narrow
historical Linux/amd64 B1 installed-SDK integration gate:** one rebuilt verifier
completed default/Released/candidate acquisition, genuine retained-file replay
and the ten authority controls in unchanged d6. No blocking discrepancy was
found in the recovered reader inputs. This does not make the original workflow
successful or establish full B1/VV, SDK release or OCI/product admission.

No SDK/build/test binary was executed, archive extracted to disk, source changed,
large artifact downloaded, subagent used or commit/push made. Inspection used
bounded Python ZIP/tar/JSON readers and hashes of the already downloaded files.
Read `backport-authority-report.md`, `backport-full-validation-recipe.md` and the
recovered `recovery-scope.txt` before interpreting results.

## Provenance and independently checked retention

Recovery run `43999834995`, game `6c7114a`, recovered historical output from failed
run `43986399997`, head `022c11363fd3a1b1c6871991f32ab02994515a7e`, original artifact
`14288310173` (`prismpm-backport-43986399997`, 1,336,947,756 bytes). Recovery metadata
binds its API digest
`sha256:20100b809e5b0994703f681dc1c4cf751dda4f50e1d784ec8d65a7ac792a0fa9`.
The original run's conclusion remains `failure` because of host evidence-write
permissions. The recovery run performed no SDK rerun or receipt rewrite.

The original giant ZIP was **not independently hashed** here or by the recovery
workflow: the pinned download action extracts it and only warns on its own digest
mismatch. Recovery validates the recorded API metadata. This limitation is stated
in `14292235767/recovery-scope.txt` and is retained, not repaired by hashing the
new compact ZIPs. This review independently checked each new compact ZIP against
`downloaded-artifacts.json`, including size, member-name set and every extracted
local file's exact bytes:

| Compact artifact | ZIP bytes | Independently matching ZIP SHA-256 |
| --- | ---: | --- |
| Original logs `14291976193` | 7,371 | `1df6783e97a1a9477b791959dd778b094e9d8bc39f8ae13bfcd5793e3688dcd3` |
| Recovery summaries `14292235767` | 263,812 | `099a82748d45dd7882abc759c5c307ae82d7815002392e8d1ca83c4516b397ad` |
| Complete reader inputs `14291098413` | 534,049 | `817ebb0f1d3748f7947183017fdb2563e1a4bfeea18cc86d81e6aae54b85c717` |

Evidence root: `artifacts/numeric-task2c/ci-43999834995/`.
`14291098413/retained-reader-inputs.tar.gz` is 537,827 compressed bytes, SHA-256
`0d063916c7c1bb9e0cd61f98c958af35e3cfeee59bccdafc71c46ae39c7922ba`.
Its complete bounded inventory matches all 463 manifest entries in
`14292235767/reader-input-manifest.json`, with exactly 2,642,825 regular-file bytes:

* 282 regular files, all mode0644; 180 directories mode0755; private `projects`
  root mode0700. No symlinks, hardlinks, special files, duplicate/absolute/parent
  paths or special permission bits. Member count/aggregate bytes/per-file bounds
  were checked before consuming members; no content was executed.
* Manifest paths, sizes and modes match the tar exactly. The 18 retained summary
  strings match actual tar member bytes exactly. All six files in the separate
  `retained-reader-basics.tar.gz` also match the complete reader tar.
* `retention-status.json` reports `complete_reader_inputs:true`, no errors.
  Independent checks confirm completeness against each build manifest, rather
  than relying only on that status. The inventory is size/mode metadata, not a
  per-file hash manifest; actual artifact hash checks below supply those links.

These checks establish retained member bytes/modes, not historical native inode
identity, ownership or live SDK filesystem custody. Those runtime observations
remain the original verifier's logged evidence.

## Runner, source and tool evidence

`14291976193/runner-exit-code.txt` is `0`; `completion.txt` explicitly scopes the
completion to dual-authority acquisition and retained-file replay.
`gates--retained-reader.log` contains the required nonempty extension marker:
`retained backport projects: 3 independently bound; candidate mutation corpus rejected`.
It reports 1 passed/0 failed (525 filtered). `gates--authority-controls.log`
reports all ten named controls passed/0 failed (516 filtered), including original
pin/seed controls, no fallback, selector refusals, owner selection, snapshot
authority, selected archive/execution custody and fresh native compiler builds.

The runner identifies PrismPM `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`, tree
`3d4838633c80fb754b33f466c25ef0962057e2fd`; the recovered source manifest identifies
bundle `c0f3cc3b2acab83656f938bf30cba81d2ae9ad31f0ca468d9a6a5ffdc1e90801`
and patch `4ce9fb365078c56f54121e111ebd91d0bd45e2b17ea8dbd05c1a5ee80ae313c2`.
The new verifier was measured separately as
`272a96c5995f664f130759a096a6015ce265e5e12e52de08ac41cac67b516949`;
the unchanged installed CLI was recorded as
`eae9a54a3d5164b75cd409b43746132b7d89a6c5b90885fdd3e6fbc632bfd0fc`.
These are distinct executables. The historical runner script at game022c113
builds once and invokes that absolute new verifier for all three projects.

`environment.txt` records native x86_64 Lean4.32.1/Lake, Rust/Cargo1.97.1,
Node22.23.2, 1GiB `/tmp` and `/dev/shm` tmpfs and stack65536. Final identity log
reports every original captured Cargo.lock, SDK lock, two archives/descriptor,
installed inventory/seed/CLI/tool and rebuilt verifier hash `OK`. Binaries and
the complete installed filesystem are not present in the compact inputs, so
this review does not independently remeasure those original runtime bytes.

## Independently checked receipt and artifact relationships

Each project contains a closed verify result, 88 build files (87 exact declared
artifacts plus build manifest), three verification files and unchanged lock.
All 87 artifact rows are unique and exactly equal the retained build-file set;
all declared lengths and SHA-256 values match actual bytes. Build manifests and
verification manifests are canonical JSON, with duplicate keys refused.
Recomputed canonical build-input hashes match build IDs; verification manifest
hashes match attestation IDs. Model, LexLean attestation and acceptance digests
match, using the existing acceptance projection excluding `browser_timing`.

| Selection | Build ID | Attestation ID | Acquisition |
| --- | --- | --- | --- |
| Default and explicit `released` | `1efd7216aa092fa0e20ec0bcca88785125e2718cc08aa73664dfe37fc0137e12` | `6e66531b8c58c603a37c94243a7b83a8358711f34f150a37b2e5be0a4f6688b6` | `prismpm/exporter-acquisition/1`, `sdk-seed` |
| Explicit `numeric-task2c` | `d8bf010629e47867d5e7d08a648b72a24fe58cd22ca43a9e37acb36acdd53649` | `f200f4706006e93b4452ba47b7e888fc4847526d4ce7aaca6b9e7a06ad9d36fb` | `prismpm/exporter-acquisition/2`, `source-backport` |

For each project, all 17 top-level processes and both three-process owner phases
report zero exit. Both phases' 42 artifact rows match retained build bytes and
each other; model and generated-Lean-manifest hashes bind both phases. The
top-level final three processes equal the original replay transcript. All three
exporter records (top-level plus each phase) are identical within each project.
Sidecar archive/actual executable measurements match them. The selected compiler
revision also matches the actual retained model-provenance bytes embedded in
`Text Request.holo`, whose complete artifact hash was checked.

Released/default identity is compiler
`991956fe427bb646498fd0912c89b71be71e7beb`, archive
`7a1a716a57040ea2307f7a34e895a75ebdca7438cf9d5d0364007acb594366bf`, actual child
`b0081437c68a576ea0b19805568e8ac8c418cf5b7b366d7881b02f38dbaf77ed`
(226,949,656 bytes, mode0755). The closed seed receipt binds exact native locked
exporter/seed rows, seed-manifest
`5ad69a24139104bd268a70b2124384a9266903550fe6909804abb6c8c32b9431`.

Candidate identity is compiler `2a13f942b04f0828e03c5d7db7e4db6ecb626d6e`, archive
`6963efb98d5a67a54a5a969d520f0090218115f86da1dd573b789dc027fafb52`, descriptor
`163fd02651d0c3e5116bdf1f0549b72d43ec849e66cd7d328b83cbec4fb70dc7`, actual child
`15e2d1c3d45f181a0fb2c5de86c4cfe78a9b15b31712500defbe491828bd3915`
(227,109,272 bytes, mode0755). Its closed source receipt binds `numeric-task2c`,
not a seed-manifest or old SDK child identity.

All three locks are byte-identical SHA-256
`fb18f8a88756f6f3b89efe375c6611ab317beec320f986f81af92e142ac54969`, lock/2,
image `ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`.
Receipt native platform is `linux/amd64`; inventory digest
`0d4fe1864891ab1220a752d929a5a3a334f5987e0518a97f83f06fb5bdad105f`
matches the exact retained platform inventory document and rows. Candidate
`sdk_lock_digest` equals the retained lock's actual byte digest. Both authorities
retain Lean4.32.1. Candidate and released application generator IDs differ;
model and generated Lean manifest bytes remain equal across all selections.

Two expected differences do not weaken the bindings: default/released acceptance
files differ only in permitted browser timing (their other retained files match),
and candidate first-build/replay `application-exporter.stdout` differs because
fresh compiler construction does more work than replay. The original transcripts
are retained; exporter identity/receipts and generated artifact sets still agree.

## Findings and gate disposition

**No blocking finding within this scope.** The recovered positive acquisitions,
required retained-reader completion marker, genuine candidate mutation-corpus
result, ten authority controls, complete inputs and independent artifact/receipt
cross-checks support marking the **historical native-amd64 acquisition/reader
integration subgate** evidenced for source2a31ad07 and the measured272a96 verifier.
Recovery need not pretend the original host wrapper passed: that workflow remains
failed, and the repaired harness's fresh run has its own independent status.

This review did not rerun the Rust semantic reader or mutation corpus; their
execution is historical logged evidence. It independently validates retained
bytes and structural/hash/authority relationships. The existing reader extension
at `release_verification/tests.rs:911-992` consumes complete build/verification
trees through `validate_with_authority`, checks expected source/mode and default
build-ID equality/candidate inequality, then runs the candidate mutation corpus.

Still outside this result: all eight assembled source-VV parts, SDK release and
real OCI/product qualification, live corrupt-installed-seed launch controls in a
separate container, native arm64 execution, full numeric-root canonical admission,
game adoption and performance claims. The ten passing controls are not evidence
that every separate installed-SDK negative or the full VV suite ran. Preserve the
original failure, original-ZIP verification limitation and scope in downstream
reports; do not relabel recovery success as new SDK execution or complete B1.
