# Diagnostic harness review

Reviewed the five-file harness diff in `backport-harness-review.diff` for game `33b93e4..6b5edda`. This was a read-only source review; no source edits, package-wide reruns or subagents. The Prism implementation itself is outside this review.

**Spec compliance: changes required.** The harness correctly pins the original d6 image and upstream base, restores the named candidate with bundle/patch/object checks, preserves the original entrypoint and UID1000, uses bounded tmpfs mounts, builds an isolated verifier and invokes its absolute path for all three ho11 projects. It requires the explicit retained-reader marker and propagates verifier, reader, identity-check and tee failures. The workflow has read-only token permissions and no deployment. However, the required retained project evidence is inaccessible to the host artifact collector.

**Quality: request changes for one blocking evidence-retention issue.** No other concrete defect found within this scope. GitHub's default run-shell error handling covers the retention step's commands; the explicit docker/tee status handling and EXIT identity checks preserve nonzero failure status.

## Finding

- **High / P1 — private container-owned project directory prevents intact artifact retention.** `scripts/numeric/check-prismpm-backport.sh:49` creates `/evidence/projects` with mode 0700 under UID1000. `.github/workflows/prismpm-backport-diagnostics.yml:42` also makes the mounted evidence root UID1000-owned, while the `ubuntu-24.04` hosted runner's artifact action runs as the host `ubuntu` user (UID1001). No subsequent ownership adjustment or privileged archive step occurs before `.github/workflows/prismpm-backport-diagnostics.yml:79` uploads `evidence/`. The host collector cannot traverse `projects`, so the three genuine project trees and their JSON/stderr files cannot be retained intact; upload can fail or omit the inaccessible subtree. This affects successful execution and, more critically, failure evidence. Produce a readable archive of the entire private project subtree as UID1000 before container exit (on both success and failure), preserve original bytes/modes inside it, make archive errors fail an otherwise successful run, and upload that archive with the other logs without traversing the private raw subtree; alternatively arrange explicit host-readable access in an always-run host step.

## Validation and limits

The supplied evidence reports passing Bash/Python/YAML syntax checks, successful exact local Git candidate restoration, and seven restore negative controls refusing altered bundle/patch bytes, extra/duplicate metadata and wrong source/tree/commit without changing the checkout. Those are local syntax/restoration results, not an actual SDK acquisition result.

Actual same-new-verifier execution in the unchanged d6 SDK and its genuine retained-file replay remain **pending CI**. This review does not claim those runtime gates pass, does not establish two-platform SDK qualification, and grants no production admission. Review inspected the original SDK entrypoint and relevant retained-reader bridge only to confirm environment and evidence-path interaction; source-implementation correctness remains with the separate reviewer.
