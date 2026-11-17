# Task4b host socket diagnosis — read-only

2026-11-17. Systematic-debugging diagnosis only. No implementation/test/workflow/source/index changes, Docker calls, builds, network, privileged tests, account changes or subagents. This report is the only authored file. Proof Task1 retains the implementation slot. The proposed repair requires a later authorized slot and independent review before publication.

## Observed boundary and durable evidence

Actual run44089985756 used game commit b09d45c1d9813a06925dfbcf5dea9399c612d20b. Source restoration succeeded. At13:10:25.533556 UTC the preflight reported `root bridge did not return: candidate capture qualification incomplete: actual fixed Docker socket` and exited1. Source-cache and devcontainer image work were skipped. The always-retention attempt then refused `completed actual bridge preflight required`; it did not rerun the preflight. Upload of the small failure artifact succeeded. Qualification was skipped, so no scenario or original OC10 ran.

Retained under `docs/research/numeric-export/recovery-2026-11-16/ci-44089985756/`:

| File | Bytes | SHA256 |
| --- | ---: | --- |
| completed-run.json | 2439 | 8b45dee24414dcb5d7dd6798dc0b19be8e41084459d0bf0dfcc7c92b316f2295 |
| failed-steps.log | 2109 | 3e0350cb0a38c15061c14edbcd89ff75fce0d0ef6320fe5673d5d6a0d2ef861c |
| source-image-failure-artifact.zip | 341 | ef2659e8aa6cec2b8e7a1e328cb505e5d127c43cda31a2bb96edb625ccea2ffa |

The ZIP was read in memory without extraction. Its sole264-byte `bridge-failure.json` has SHA256 d850befac7edf7dfee6fdfdbfbe5a88e96bb2c0611e6b95a041d763b7068ada2. It records operation preflight-image, actual runner UID/GID1001, exit1, elapsed0.07445206199999177 seconds, the same socket error, and complete_application_accepted=false. Artifact ID14330982957 is supplied by the parent; these file records establish the payload, not a new API lookup.

This advances the known boundary beyond the previous sudo failure: the exact root Python command started, passed its actual-root/sudo-origin/workspace/game/clock authentication, created incomplete preflight state and reached the socket predicate. The UID1000 child has not yet been started: `bridge_supervise` is after the failing check. Thus this run proves neither the credential drop nor the real cross-UID copy handoff. The successful failure artifact does prove that the small ordinary-runner failure route was readable by the artifact uploader.

## Predicate and alias interaction

At `candidate-capture-qualification.py:2113–2115`, the implementation does:

```python
socket = Path('/var/run/docker.sock').lstat()
require(stat.S_ISSOCK(socket.st_mode)
        and Path('/var/run/docker.sock').resolve() == Path('/var/run/docker.sock'),
        'actual fixed Docker socket')
```

The reported message establishes that lstat returned and the compound predicate was false. It does not identify which conjunct failed. If lstat failed, the error would instead be the filesystem exception. Because the Boolean expression short-circuits, resolve may not even have run if the final member was not a socket. No actual hosted socket mode, owner, link text or resolved path was logged. It would be inaccurate to claim this log proves that hosted `/var/run/docker.sock` resolved specifically to `/run/docker.sock`.

The static defect is nevertheless definite: lstat does not follow the final path component, but it must traverse parent components. pathlib.resolve resolves every parent symlink as well. With an ordinary root-owned `/var/run -> /run` (or `../run`) OS alias and a genuine nonsymlink `/run/docker.sock`, lstat correctly reports a socket while resolve returns `/run/docker.sock`. The lexical-equality conjunct therefore rejects the valid fixed endpoint solely because of its standard parent alias. The host entry mistakenly applied the strict no-alias rule for private source/artifact files to a system endpoint with a conventional OS alias.

Read-only metadata inspection of this local environment found `/`, `/var` and `/run` are real root-owned0755 directories, and `/var/run` is a root-owned symlink whose exact text is `/run`. That confirms the parent-alias mechanism locally. **The local final socket is itself a symlink to `/run/codex-docker/docker.sock`; this additional alias is outside the proposed policy and must remain refused.** The local environment is not evidence of the hosted socket target and was not used to connect to Docker. No socket fixture was created during this read-only diagnosis.

## Original source assumptions and comparison

The reviewed f292 source consistently selects the fixed logical endpoint `/var/run/docker.sock`; it does not require the entire spelling to be canonical:

- `.devcontainer/devcontainer.json:9` binds that exact source/target string. `.devcontainer/docker-entrypoint.sh:4–5` and `docker-ready.sh:17–18` test socket type and measure its actual group. These original account/group startup semantics are outside this repair and remain unchanged.
- `scripts/conditional-capture-candidate.py:1580–1581` and the original SDK helper use `os.stat` plus socket type; Rust `crates/prismpm/src/authority.rs:1948` uses filesystem metadata plus socket type.
- Game `docker()` at line394, the six-scenario driver at line735 and full-source-VV mount inspection likewise preserve the logical `/var/run/docker.sock` identity. None establishes the new host bridge's lexical-resolve equality.

Do not rewrite source mounts, Docker argv, descriptor identities or SDK behavior to use a different public endpoint. Do not copy the source's broader final-component-following stat as a shortcut: the new host bridge may preserve its stricter final-socket no-follow policy while recognizing only the fixed OS parent alias.

## Smallest bounded repair proposal

Change only the game driver's host socket measurement/admission and focused component tests. Workflow, source, snapshots, probes, subject adapter, restorer, pins, phase scheduling, output protocol and export implementation need no change.

The production helper has no configurable socket path or CLI option. It selects only `/var/run/docker.sock` and admits two closed layouts: a real `/var/run` directory (the previously admissible canonical layout), or the single root-owned `/var/run` symlink with exact text `/run` or `../run`, resolving directly to `/run`. In the alias layout, the only allowed canonical endpoint is `/run/docker.sock`. Do not admit arbitrary aliases merely because their eventual resolution lands at an allowlisted destination.

Validate `/`, `/var`, and the selected real runtime directory as root-owned real directories without group/other write or special mode bits. In the alias layout `/run` itself must be a real root-owned safe directory, and the `/var/run` link must be root-owned with the exact closed link text; symlink0777 is normal and should not be misinterpreted as a writable directory. Reject aliases in other parent components, an indirect/multiple-link runtime chain, unexpected link text or writable/non-root parent directories. The canonical final `docker.sock` must still be lstat/no-follow socket type, never a final symlink. Record its actual group rather than assuming a group number. Requiring a root-owned final socket and rejecting world-write/special bits is consistent with the fixed hosted-daemon boundary, but should be explicit in the reviewed implementation, not silently inferred from the existing check (which currently does not test socket UID).

Use held no-follow directory descriptors/stat records and join the logical endpoint's final lstat device/inode/type/owner/group/mode to the canonical endpoint's no-follow stat. Recheck held records around measurement so a changed component refuses. This is bounded filesystem metadata, not a Docker operation, account mutation or permission change. If using Linux O_PATH|O_NOFOLLOW to hold a socket inode, remember that O_NOFOLLOW can return a symlink O_PATH descriptor: fstat must still require S_ISSOCK. Ordinary O_RDONLY opening a Unix socket is not a portable way to obtain such a descriptor.

Carry the measured endpoint identity to the existing dropped child, keep its current socket access check and add an identity join before preflight success/image inspection. No inherited root-open socket handle should reach the child; the existing descriptor-closure rule stays intact. Root-owned safe parents constrain the path while the child uses the original logical spelling. Do not add retries, additional phase budgets or a second handoff route.

## Required measurements and focused tests

The next exact hosted preflight should retain bounded typed measurements of logical/canonical endpoint names, `/var/run` kind/link text, selected parent UID/GID/mode/device/inode, final socket UID/GID/mode/device/inode/type, and which admission predicate failed. Emit the measurement before raising an admission error, within the existing bounded stderr/failure-record budget, and include the same measured record in successful bridge-context metadata. Keep it small enough that the existing error truncation cannot remove the distinguishing fields; do not dump environment variables or arbitrary filesystem content. Metadata should explicitly distinguish `final_not_socket`, `unexpected_parent_alias`, `unsafe_parent`, `identity_changed` and admitted state. A regular log line with the compound error alone is insufficient. All work remains inside the existing request/root/child deadline.

Before repair, a focused unprivileged tempfile test can create a real AF_UNIX socket under `run/docker.sock` and a `var/run -> ../run` parent alias; it should show the old lexical-resolve predicate rejects a real final socket. It must not connect to any daemon. The same fixture should pass the revised layout logic; an absolute symlink to the fixture's run directory can exercise the corresponding fixed absolute-layout case through an internal fixture namespace, without a public path override. Ordinary fixture ownership can parameterize a private validation primitive; production must always select fixed paths and UID0. Such tests establish component path semantics, not privileged root ownership success.

Required negative cases: final symlink even when it points to the same socket, this environment's extra socket symlink layout, unexpected/indirect runtime link, symlinked `/var` or canonical `/run`, ordinary file/FIFO/directory instead of a socket, missing member, wrong owner, writable parent, and changed final device/inode/group between held measurements. Preserve a positive real-directory `/var/run` layout if it remains part of the closed policy. Add one focused bridge integration assertion that the measured group/context reach the existing child and the bounded measurement is retained on admission failure, with no new CLI path or Docker command. Reuse already-covered bridge/drop/export/clock tests; do not expand into another general framework or repeat unrelated SDK work.

## Conclusion and limits

The concrete defect is an overstrict canonical-path assertion that rejects a legitimate fixed OS parent alias. The likely hosted trigger is the usual `/var/run -> /run` layout, but this run did not log enough to prove that exact target or even distinguish it from a final-member type refusal. The narrow alias-aware measurement above is warranted; actual hosted metadata must establish which accepted layout is present. If the hosted endpoint has an additional final symlink, it should fail with the measured reason and return for review rather than broadening the allowlist.

Read-only inspection observed game HEAD0da04714e9e85249a693dae26b2c9a48735f51d1, no tracked implementation differences, and clean source463177a/tree0990. Free space9,029,402,624 bytes at inspection. No implementation process was started by this diagnosis. A later repair/launch may still reveal another preflight boundary; no end-to-end success is claimed.
