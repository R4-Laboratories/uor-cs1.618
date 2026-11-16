# Manual numeric export validation

This is validation orchestration, not an upstream release or a passing acceptance receipt. It does not change the game's guests, engine, dependencies or proof claims. The current candidate and evidence are maintained separately in [numeric-export/](numeric-export/).

The [workflow](../../.github/workflows/numeric-export-validation.yml) runs only on manual dispatch, with no dispatch inputs and `contents: read`. It checks out the exact game event SHA and the reviewed manifest's full `afflom/UORust` base commit. Checkout and artifact-upload actions are full-commit pinned; credentials are not persisted. There is no push, release, deployment, secret or upstream branch mutation.

Two independent `ubuntu-24.04` jobs run the **baseline** and **patched** trees, each retaining the original 45-minute timeout. `fail-fast: false` keeps a baseline failure from cancelling the candidate comparison. The jobs invoke the unchanged upstream bootstrap run block, which starts the exact lock-selected SDK and executes full `just vv`, including its original Docker/buildx/devcontainer checks. The wrapper does not rewrite gate commands, filter tests, install a substitute compiler, update a lock, or turn failure into success. This is an amd64 runner comparison; inspecting both image architectures in upstream bootstrap is not a native arm64 validation run.

## Reviewed manifest

Before dispatch, commit these together at the game event revision:

- `docs/research/numeric-export/numeric-export-current.patch`: complete `git format-patch --stdout BASE..CANDIDATE` mailbox series, including all required candidate commits.
- `docs/research/numeric-export/validation-manifest.json`: the exact schema below, with no extra fields. Obtain all hashes from the reviewed bytes; do not use placeholders.

```json
{
  "schema": "cs1618/numeric-export-validation/1",
  "base": "<full 40-character upstream base commit>",
  "candidate_tree": "<full 40-character reviewed candidate Git tree ID>",
  "patch_sha256": "<64-character SHA-256 of the complete patch>",
  "bootstrap_sha256": "<64-character SHA-256 of base .github/workflows/bootstrap.yml>",
  "lock_sha256": "<64-character SHA-256 of base prismpm.lock>",
  "sdk_image": "ghcr.io/afflom/prismpm-sdk-patched@sha256:<64-character image digest>",
  "allowed_paths": ["<exact changed paths, sorted and unique>"]
}
```

The manifest is reviewed repository content, not an independently signed attestation. Its authority is the selected game commit and review of that commit. The workflow offers no base/image/patch override input. A new upstream base or candidate requires a new reviewed patch/manifest commit. The historical `numeric-export-eligibility.patch` remains separate evidence and is never read by this runner. Historical and current candidates must not be mixed: the historical base's full gate failed upstream, and its old patch also modified a template-bound policy document; those facts are not a current-candidate verdict.

The [runner](../../scripts/validate-numeric-export.py) refuses a wrong base/origin, dirty checkout (including ignored stale outputs), patch hash mismatch, mutable image, bootstrap/lock mismatch, policy-file mismatch, protected gate/lock path, unexpected changed path or candidate tree, symlink or submodule. It validates every `template.lock` policy-file digest before and after applying the patch. It preserves `Justfile`, template/SDK/Cargo/toolchain locks and workflow policy; known gate implementation directories are excluded from candidate paths. `git am` applies the reviewed series without three-way rebasing and creates local validation commits; the receipt records the resulting commit/tree, which need not equal the original author's commit IDs. Patch content/hash and the manifest-pinned candidate tree are the comparison evidence; obtain that tree with `git rev-parse CANDIDATE^{tree}`.

The bootstrap YAML is byte-verified first; its exact literal run block is de-indented, saved and checked with `bash -n`, then executed from the upstream checkout. A changed run-block layout fails closed instead of generating another gate. `prepare` stops before Docker and is explicitly **not** acceptance:

```sh
python3 scripts/validate-numeric-export.py metadata
python3 scripts/validate-numeric-export.py prepare \
  --source /absolute/path/to/clean-upstream-checkout \
  --output /absolute/path/outside-upstream/evidence --mode patched
```

Use disposable clean checkouts: prepare/run applies local commits and deliberately does not reset an existing or failed workspace. Baseline mode also validates the reviewed patch hash and manifest, but leaves source at the base. To run the complete original gate, replace `prepare` with `run`; this requires Docker and enough disk for the exact SDK and build. No local full-SDK run is claimed by the orchestration tests.

## Separate current-pin primitive probe

Only after the patched job's unchanged full gate returns success, a separate step runs `bash scripts/probe-numeric-export.sh` inside the **same exact SDK digest**. It checks the candidate tree, original policy custody and successful full-gate receipt again. The container preflight requires the already-installed `wasm32-unknown-unknown` target and its standard-library directory; it installs no replacement tools or target. A mounted TMPDIR retains generated packages, native/Wasm outputs and probe logs in the uploaded evidence. The SDK inventory is not itself a runtime result; a missing tool/target or failed export remains a failure.

This experiment builds and replays the bounded significand primitive and checks its native/Wasm controls. It is separate evidence, not a full float-root export or an alteration of `just vv`. The original gate receipt remains intact if the later probe fails. Both steps share the job's original 45-minute limit; timeout is reported rather than extending or bypassing acceptance. No local exact-SDK probe execution is claimed by the orchestration unit checks.

## Evidence and failure semantics

Each job's always-upload artifact contains metadata output/errors, `gate.log`, the extracted `bootstrap-run.sh`, and a receipt when preflight completed. Preflight sets `full_gate_completed: false`; only an actual returned bootstrap execution records its exit code and `full_gate_passed`. The wrapper propagates nonzero status through a `pipefail` logging pipeline. Missing manifests, gate failures, registry failures, disk exhaustion and timeouts remain failures. After timeout/cancellation, a completed receipt may not exist; preserve the partial logs and GitHub job conclusion rather than infer success. Artifact upload itself can fail if the runner is forcibly lost.

Compare baseline and candidate diagnostics before attributing a failure to the patch. Keep any initial failures, exact source/patch/image identities and the current candidate's independent review. Neither a passing small primitive probe nor successful orchestration preflight is a replacement for full `just vv`. A passing candidate gate would validate this candidate at this pin; it would not prove a complete IEEE implementation, native-GPU performance or the whole game.

## Local orchestration checks

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s scripts/tests -p 'test_numeric_export_validation.py'
```

These use synthetic temporary Git repositories, exercise a two-commit mailbox and baseline preparation, and plant wrong base/dirty source/hash/image/path/policy cases. They check refusal and never run Docker or `just vv`. YAML/shell/Python syntax checks and these fixtures are orchestration evidence only. Full pinned-SDK execution and independent review remain separate gates.
