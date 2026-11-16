# Task2c-B: explicit exporter source selection

Fresh read-only inspection on 2026-11-16 of the restored authoritative PrismPM
checkout `/workspace/scratch/prismpm-numeric`, HEAD
`3666dc0f9da56fcf066d96ec01cd9e14ec9a2974`. Its
`crates/prismpm/src/verification.rs` SHA-256 is
`0ac12b166ac69535ebf00c0af35bd6c9cfe1ea5d0660fccd8f9d49f31ca432b4`;
`vendor/lean4-prod/lean.tar` is
`7a1a716a57040ea2307f7a34e895a75ebdca7438cf9d5d0364007acb594366bf`.
These are the original SDK source inputs, without the game verifier-only replay
patch. References below are relative to this checkout unless prefixed `game:`.
No implementation, builds, installs, commits or subagents; only this report.

## Decision

**Compile both original and candidate authorities. Keep the original as the
unchanged default; select the candidate only by an explicitly requested closed
ID.** The controller agreed with this recommendation during reconnaissance.
No fallback after seed failure, environment-selected source, caller archive path,
runtime download, loose digest lookup, or silent candidate selection.

The earlier receipt report's suggestion to replace the sole registered
lean4-prod revision/archive is insufficient for this requirement. Today there is
one `ARCHIVE` (`exporter.rs:17`) and one `compiler_identity()` from the lean4-prod
dependency row (`:286-307`). `validate_acquisition` requires the SDK seed receipt
to match both (`:258`, `:276`); the seed admission helper also checks actual
manifest revision/archive. Replacing these pins makes the new verifier reject
the original d6 SDK seed. Bypassing those comparisons would weaken admission.

| Option | Implementation cost | Effect on unchanged default |
| --- | --- | --- |
| Separate original/candidate compile flavors, one archive per binary | Smaller custody changes; compile-time source is global. Candidate flavor must explicitly forbid sdk-seed and report source-backport. | Original release flavor stays unchanged, but candidate verifier itself cannot retain ordinary original sdk-seed behavior. This requires an explicitly narrower interpretation of the requirement. |
| Dual compiled authority registry, explicit candidate ID | Source authority must travel through acquisition, snapshots, generation and release readers. | Same new verifier defaults to original archive/revision and original SDK seed checks; explicit candidate uses fresh source-only construction. Recommended and controller-approved. |

This preserves seed/admission **semantics**, not a claim that a rebuilt verifier
has the old executable hash or unchanged generator identity. Existing lock/3
generator pins still need honest normal validation; never suppress their drift.

## Minimal authority and selection API

Use a small typed registry, for example `SourceId::{Released, NumericTask2c}` and
`SourceAuthority { id, archive_bytes, archive_path, compiler_revision, toolchain,
descriptor }`. Resolve only exact compiled IDs; no arbitrary paths/URLs/hashes.
The names are proposed API, not existing code.

* Leave `vendor/lean4-prod/lean.tar`, the original lean4-prod dependency revision
  `991956fe427bb646498fd0912c89b71be71e7beb`, existing Rust manifest/crate pins and
  original SDK inventory/seed untouched. Add separately named candidate tar and
  descriptor under `vendor/lean4-prod/backports/<closed-id>/`, registered as file
  artifacts. Use a closed separately defined backport register/descriptor for
  candidate revision/tree; do not add a fifth dependency ID or unrecognized
  lean4-prod row metadata. The existing audit has exact IDs and the SDK JS
  `compilerRevision` parser requires exactly four original dependency fields.
* A proposed `--exporter-source <closed-id>` for build/verify is opt-in;
  omission resolves `Released`. Reject the selector on unsupported commands.
  `cli.rs:19-34` currently has no selector. Add a typed immutable Controller
  selection (`controller/mod.rs:138`, `:509`), with the ordinary constructor
  defaulting to Released. Keep `ProjectConfig` unchanged: its shape is closed
  (`config.rs:29-57`), and this is tool authority, not application semantics.
* Select once before acquisition. Instantiate `VerifyExporterOwner` with that
  authority instead of default construction (`verification.rs:2848`). Store the
  ID on its `Package` and `GenerationContext`; prohibit changes across phases.
  Pass it to standalone `application_build::generate_in` and
  `library_build::generate_in` acquisition too (`application_build.rs:859-868`,
  `library_build.rs:274-282`). A legacy generated-module verification path also
  calls `verify_source/acquire_for_owned` (`verification.rs:3096-3099`). Either
  thread the same typed choice there or explicitly reject candidate selection
  for that path; never accidentally revert to the original midway.
* `acquire_for_owned`, `verify_source` and archive measurement must use the
  selected `SourceAuthority`. Released still follows the existing cold/seed
  path exactly; candidate requires the unchanged current lock/2/native SDK
  inventory, extracts only candidate source and builds fresh. Candidate cannot
  invoke the released seed-admission helper. Retain all source/archive checks.
* Keep `sdk::exporter_seed_inventory`, `execution_lock`, running inventory and
  seed readers unchanged. A source-backport receipt includes closed ID and
  descriptor digest, native platform and independently validated SDK
  lock/inventory binding. The outer execution retains measured resulting child
  hash/mode/size. Candidate receipt means source construction, never sdk-seed.

## Custody: do not stop at acquisition

`custody.rs:231` hardcodes `source_members_from(super::ARCHIVE)`. Its downstream
`capture` (`:328`), `capture_optional` (`:332`), `capture_source` (`:515`) and
`authenticate_seed` (`:523`) all validate against that original archive.
`exporter.rs:144,164,382,405,419,573-583`, multiple owner calls and directory
retirement use those entrypoints. A dual archive change that leaves these global
will reject candidate source or accidentally authenticate against the wrong pin.

Give each original `Snapshot` a typed source identity (it is currently a tuple
map at `custody.rs:51`). Expose capture/recapture against that authority; retained
snapshots must never derive their source from caller data at each recheck.
`same_source` and `same_compiler` must require equal authorities before comparing
members/identities. Initial capture uses the selected authority; later owner,
execution and cleanup recapture using the original snapshot's authority.
This avoids a mutable global or repeatedly passed caller selectors.

Concrete sites requiring treatment:

* `exporter.rs:207-229` extraction/validation; `:376-429` first/after build;
  `:437-598` acquisition/publication; `:602-664` repository source equality.
  The repository check must compare the selected registered archive path to its
  compiled bytes, retaining no-follow, single-link and native identity checks.
* `exporter/owner.rs:61,78,274,497,554` full captures and `:79,215` exact cold
  comparisons. Candidate is source-only **only for initial build growth**;
  after that, preserve complete original built-tree custody and trace rules.
* `exporter/directory.rs:292-300` `protect_verified_package` currently recaptures
  with the global source. It must use the original snapshot authority too.
* `exporter.rs:199` must record selected archive, not original `ARCHIVE`; actual
  execution checks remain against that same retained authority and executable.

If candidate Rust codegen is ever changed, dual Lean archives alone do not
provide dual Rust compiler semantics. Either keep explicitly identified original
Rust generator dependencies or separately govern/select their candidate closure.
Do not claim all source at the candidate commit was compiled merely because its
Lean archive was selected.

## Build identity, Holo and source-free release verification

Use selected authority in both generation phases and the existing generator
identity keys. Frame the selected descriptor/ID into generator identity rather
than introducing an unbound CLI-only choice (`controller/mod.rs:29-90`,
`:1023-1058`). Register all descriptor/archive bytes in dependency checksums.
Candidate and original must remain distinguishable even if a small application's
generated Rust bytes happen to be equal.

`application_build.rs:1275` currently writes
`lean4_prod_commit: lean4_prod.revision.clone()` from the original dependency row.
With dual sources it **must write the selected authority revision**. The Holo
field already holds a full revision string (`holo/archive.rs:53,113,277`), so the
representation need not change. Preserve stable `application/exporter-identity.json`
schema/archive/actual child shape (`application_build.rs:1292-1301`), recording
the selected archive. Do not put per-run acquisition evidence into build files.

Release verification must select from **retained original evidence**, independent
of the reader's current CLI/default selection:

1. Resolve original cold/sdk-seed receipts to Released only. Resolve current
   `/2` source-backport receipts by exact compiled ID+descriptor digest. No
   dynamic authority is supplied by the receipt itself.
2. Change `validate_exporter_execution` (`release_verification.rs:1001-1021`)
   to resolve that authority before calling measurement validation. Change
   `validate_exporter_measurement` (`:1023-1039`) to accept an explicit authority
   instead of comparing every receipt to one `include_bytes!` archive.
3. The sidecar has no acquisition field. Its archive digest can resolve uniquely
   among compiled authorities under the current `/2` policy, then must equal
   the receipt-selected source and actual child during application binding
   (`:1522-1528`). Historical `/1` readers remain Released-only. Do not let a
   candidate archive pass historical admission just because it is compiled in.
4. `validate_exporter_authority` (`:1059-1104`) already visits original top-level
   and owner-phase exports. Require all selected IDs/descriptors/archive/children
   agree, match retained native preflight, bind the independent SDK lock and
   retain original sdk-seed inventory row checks. The candidate branch checks
   its distinct descriptor plus unchanged base lock/inventory; it must never
   compare candidate child to the old SDK exporter row as if they were equal.
5. `application_archive` (`:1660-1760`) must bind Holo provenance
   `lean4_prod_commit` to the selected authority as well as archive/sidecar.
   The existing provenance comparisons at `:1703` check model semantic fields,
   but do not currently compare this compiler commit to an authority. Add that
   check. Preserve all artifact-set, byte replay and source-free semantic checks.

Source-free parsing may resolve a compiled candidate so it can validate evidence;
SDK release qualification functions remain sdk-seed-only. Recognition of the
new mode must not qualify an unpublished compiler as a released SDK.

## Candidate distribution provenance without upstream publication

Do not link a candidate commit as though it is reachable at afflom/lean4-prod.
Keep upstream origin/base separate from the actual immutable distribution.
An already-retained game snapshot observed in Git is:

* Game repository: `https://github.com/R4-Laboratories/uor-cs1.618`.
* Earlier immutable game snapshot commit:
  `2560656575f590a138e9c4a751ed4bbb51b6789f`; local remote-tracking
  `origin/numeric-kernels` contains it. No fresh network availability test here.
* Paths at that commit: `scripts/numeric/compiler-candidate/{manifest.json,candidate.bundle,candidate.patch}`.
* Candidate source commit: `634c2c5e52c039299e0a9207a5562cb9c41600b9`;
  tree `e6a24abe2126ebc8f7c9e3ad1541f9bf44f8fe93`.
* Upstream base: `991956fe427bb646498fd0912c89b71be71e7beb` from
  `https://github.com/afflom/lean4-prod`.
* Bundle SHA-256: `2a9e75d1d0edd5abf20ad2dc32d4833c3580ead084b0bb0c59cdf34c7de48c87`.
* Review patch SHA-256: `cae4fa5819bdda06363329d3516b06556b5b49555d4fa56e81799cb843bd50ab`.
* Manifest SHA-256: `e38a3dc7d609b4f503ca67ba28218571fcd8c1fc9350964c624e41a25971468a`.

For example, the immutable bundle location is
`https://github.com/R4-Laboratories/uor-cs1.618/blob/2560656575f590a138e9c4a751ed4bbb51b6789f/scripts/numeric/compiler-candidate/candidate.bundle`.
Use structured repository/commit/path plus independent SHA-256, not a mutable
branch URL. The diagnostic manifest still labels this unvalidated; distribution
identity is not acceptance evidence.

Existing `game:scripts/numeric/restore-compiler-candidate.py:18-54` checks closed
metadata, bundle/patch bytes, exact base, bundle ref candidate, base ancestry,
candidate tree and regenerated binary full-index patch. Reuse that governed
object reconstruction, then produce deterministic candidate Lean archive and
prove exact allowed archive-member bytes/modes equal the selected Git tree.
Retain independent gate/review evidence separately. Do not reclassify a Git
bundle as an upstream release or expand PrismPM handwritten Lean exceptions.

The new compiled descriptor can point to the **earlier** game snapshot above,
with compiler commit/tree, patch/bundle and produced archive digests. It must not
contain its own digest, the later Prism commit/binary hash, the later game commit
containing that descriptor, or resulting exporter binary hash. Those results go
into a later external receipt. If compiler source changes again, first publish
another immutable bundle snapshot, then point the later descriptor to it.

## Minimum decisive tests

* Same dual verifier with omitted selector accepts unchanged original d6
  sdk-seed evidence and actually uses original archive/revision/seed; explicit
  original ID is equivalent. Corrupted default seed still fails, without fallback.
* Candidate exact ID actually builds selected fresh source, records candidate
  commit/archive/descriptor and base SDK lock/inventory, and cannot use an SDK
  seed. Unknown ID/path, descriptor mismatch, absent/legacy lock and foreign
  platform fail. SDK release qualification still rejects source-backport.
* Cross-source source members/snapshots, candidate receipt with original archive,
  changed sidecar/Holo compiler commit, mixed original/candidate phases, and
  changing selection between build/replay all fail, including resealed manifests.
* Candidate initial source growth succeeds once; source/build/child replacement
  during success or failure remains rejected at execution and retirement.
* Resolve retained candidate release correctly even when reader default is
  Released; historical `/1` candidate laundering fails. Keep unknown-call,
  live generic/custom dictionary, mathematical-Int and escaped-closure guards.

This is an architectural recommendation and fresh source inspection, not evidence
that any new mode, archive, descriptor or candidate admission is implemented.
