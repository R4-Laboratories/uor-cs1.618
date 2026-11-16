# 0.9.0 evolution queue evidence

Recorded 2026-11-16T18:27:57.321406+00:00. [Evolution run 43924605541](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43924605541) targets `382c45d7614842aa0b9ca99337cd1bada0d0f745`.

Read-only inspection around 18:17–18:19 UTC found the run and check suite **queued** since **18:02:20 UTC**, with zero jobs/check runs and no pending deployment approvals. The workflow is active; no other evolution run is active. Its workflow blob is identical to the last successful [evolution run 43896152734](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43896152734). GitHub's public status reported Actions operational; that does not identify this run's backend state.

[Pages 43923626809](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43923626809) logged **dispatched** at 18:02:21 UTC and linked this tick. The [fallback continuation](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43924626967) correctly logged **already-run** at 18:02:42 UTC. Both logs showed an empty `CS_EVOLUTION`, not `off`.

The parent subsequently reported one bounded cancellation/retry attempt:

| Observation | Reported result |
| --- | --- |
| `gh run cancel 43924605541` | CLI said the run was completed; exact wording was not supplied. |
| POST [cancel endpoint](https://api.github.com/repos/R4-Laboratories/uor-cs1.618/actions/runs/43924605541/cancel) | HTTP 409: “Cannot cancel a workflow run that has not been queued yet.” |
| POST [force-cancel endpoint](https://api.github.com/repos/R4-Laboratories/uor-cs1.618/actions/runs/43924605541/force-cancel) | HTTP 409: the same message. |
| Fresh GET after those attempts | `status: queued`, `jobs: []`. |
| Retry dispatch | **None dispatched.** |

These follow-up responses are parent-reported, not independently repeated; their exact timestamps were not supplied. The responses conflict with one another. The evidence supports a GitHub pre-job state/scheduling inconsistency, but does not establish its internal cause or a workflow-code defect. Neither successful cancellation nor recovery is claimed.

The repository-variable API and signed artifact downloads were inaccessible (403/Forbidden); readable continuation logs supplied the dispatch evidence. The companion [JSON](evolution-queue-0.9.0.json) retains identifiers and provenance. Writing these two local files made no additional GitHub requests or mutations. No credentials or signed download URLs are retained.

## Bounded recovery

After reviewing the existing concurrency, candidate and publication guards, one fresh manual dispatch at 18:33:11 UTC started [run 43930018817](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43930018817). It acquired a runner and reached Node setup. This establishes execution resumed, not a completed improvement. The older run remains queued. The continuation input is audit metadata, so the old run could later perform another serialized tick; no further retries are planned.

The recovery run completed successfully. It evaluated `art-synth-0` and `art-synth-1`, rejected both as no improvement against the declared contrast/density score, and retained generation10. All game gates passed. It committed the evaluation records as `59ee1d7133ea7a2e4f25d2d633282584fa2e7b01` and dispatched Pages run43930966329. Execution and evidence publication resumed; no graphics improvement is claimed for this tick.

Pages run43930966329 succeeded. A public-origin read confirmed build59ee1d7, version0.9.0, generation10 and the same latest history hash `a8ed38ebabe21758c7d6307ac9dcff87f152334754ed861c416ca7104a7a5855`.
