# Canonical native-library preparation

Four governed projects are staged from the single unchanged `../src/` kernel set,
small operation descriptors, and exact PrismPM fixture bytes. No arithmetic,
generated Lean, generated Rust, SDK lock, or game guest is authored here.

From the game repository root:

```sh
python3 scripts/numeric/canonical/packages.py stage /absolute/pinned-prismpm /absolute/new-projects
```

The source fixture is `tests/fixtures/library/native-library/project` at
`2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`; `inputs.json` binds every copied
fixture file and original kernel file. Each descriptor names one raw arithmetic
export plus one zero-argument Boolean acceptance export. Eleven representative
oracle cases match `Option.some` and refuse `Option.none`; these checks are finite
and separate from the external 44,648-vector corpus.

The hosted workflow `.github/workflows/numeric-canonical-packages.yml` restores
the reviewed PrismPM snapshot and builds its verifier once inside unchanged d6.
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
PRISMPM_SOURCE=/absolute/pinned-prismpm python3 scripts/numeric/canonical/test_packages.py -v
```

These are host harness refusals using synthetic receipts, not actual Prism
bundle-reader controls. Actual unchanged-SDK package verification, newly emitted
artifact replay, independent actual source/root/archive/child/output custody
controls, and full applicable upstream validation remain required before
production admission. See
`docs/research/numeric-export/canonical-packaging-report.md` for measured and
pending evidence. Native libraries carry no application/Holo/browser/rendering
qualification. Task3 owns persistent render integration; Text/1 remains later
comparison-only work.
