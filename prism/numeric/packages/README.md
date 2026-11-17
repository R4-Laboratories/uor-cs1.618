# Canonical native-library preparation

Four governed projects are staged from the single unchanged `../src/` kernel set,
small operation descriptors, and exact PrismPM fixture bytes. No arithmetic,
generated Lean, generated Rust, SDK lock, or game guest is authored here.

From the game repository root:

```sh
python3 scripts/numeric/canonical/packages.py stage /absolute/pinned-prismpm /absolute/new-projects
```

The source fixture is `tests/fixtures/library/native-library/project` at
`324955b6923c1d194d7bc870a2d2a05eb687048c`; `inputs.json` binds every copied
fixture file and original kernel file. Each descriptor names one raw arithmetic
export plus one zero-argument Boolean acceptance export. Eleven representative
oracle cases match `Option.some` and refuse `Option.none`; these checks are finite
and separate from the external 44,648-vector corpus.

The hosted workflow `.github/workflows/numeric-canonical-packages.yml` restores
the separate reviewed frontend preparation snapshot and builds its verifier once inside unchanged d6.
It uses the original SDK entrypoint, inventory and PATH as UID1000, prepares
normal source locks and canonical formatting, freezes each source/config/lock
file set, then invokes the absolute rebuilt verifier with the closed
`numeric-task2c` source selector. Original kernel bytes must survive formatting.
It retains build and verification trees selected by matching JSON identities,
complete generated/verified source trees, child receipts, std/no_std acceptance,
exact generated signatures, native and import-free Wasm corpus replay, and
separate status ABI evidence. Original source/lock/verifier hashes are checked
again on exit. Generated kernels are never rewritten for replay.

Retention is dedicated to these four projects. Reader archives have explicit
complete/incomplete status and 256 MiB raw / 31 MiB compressed bounds. Bounded
small logs are uploaded independently, with any truncation labeled. Both host
pipeline statuses and all per-package phase statuses are preserved; no private
project-directory glob or Lake/Cargo cache tree is uploaded.

Run host controls with:

```sh
PRISMPM_SOURCE=/absolute/pinned-prismpm PRISMPM_READER_SOURCE=/absolute/pinned-prismpm python3 scripts/numeric/canonical/test_packages.py -v
```

The current selector requires library verification `/3`, library owner `/2`,
frontend `/1` and stable source plan `/1`. Module count/order comes from the
complete source-bound frontend plan, including Bounds and pinned runtime
closure. Both original owner phases, the top-level replay window, actual tool
measurements, source-backport pins, declaration policies, complete artifact
bytes and std/no_std results are bound before selection. The separately invoked
source-owned frontend reader and runtime registry are pinned and retained;
`library-sdk-check.checkAccepted` is fixture-specific and is not used here.

Native tool capture `/2` distinguishes PATH Lean/Lake/Cargo launchers from
actual Lean/Cargo binaries. Original Lean/Lake launcher equality is permitted;
frontend Lean binds the separate locked native Lean artifact. Original process
rows bind their selected commands, including Rustup for native packaging.
Retained original inventory/lock and initial/final file measurements bind both
roles; no source-bootstrap authority path substitutes for the actual SDK flow.

Host tests use synthetic receipts and distinguish game harness refusals from
source-owned frontend-reader refusals. With the source variables set, they run
the actual pinned frontend reader; they do not execute SDK proof verification.
The prepared `controls` command runs only after a selected real CLI bundle,
clones that bundle for 15 reader/custody mutations, records the refusal owner,
and rechecks the untouched original. Those controls remain pending against new
actual SDK outputs until the controller launches the hosted workflow.

Actual unchanged-SDK package verification, newly emitted artifact replay,
independent producer authority, and full applicable upstream source/golden
validation remain required before admission. See
`docs/research/numeric-export/canonical-packaging-report.md` for historical
measured and pending evidence. Native libraries carry no application/Holo/
browser/rendering qualification. Task3 owns persistent render integration;
Text/1 remains later comparison-only work.
