# Task4c1 observation-only design review

**READY for implementation in the three new files specified by the brief.** No design blocker requires another Task4b change or an access-policy expansion. The publication and completeness details below are implementation acceptance requirements for this observation-only design. Independent implementation review precedes any hosted execution.

## Evidence, scope and manifest

Read the complete Task4c1 brief and final Task4c architecture diagnosis, inspected the existing prepare/context and workflow boundaries, and verified the six indexed files for run44105354772. Its1702-byte observed failure has SHA256 `84b41352466cdfbf8de772d221c4573367eb4202c444681060ba62e884fb549e`. It establishes a returned default ACL xattr at `/home`, root observer0:0, runner1001:1001 and null planned/actual child identities. It does not establish a kernel access denial or the contents of that default ACL. The retained root socket observation is not a child access witness.

Independently expanded the literal endpoint set and all ancestors. For `/home/runner/work/uor-cs1.618/uor-cs1.618`, the union is exactly81 nodes:17 under game,41 under source,12 under evidence,6 workspace/root ancestors and5 additional socket-layout nodes. The proposed96-node bound is compatible with that manifest. The count must be derived from the union before filesystem inspection; neither absent nodes nor blocked branches may shrink the expected set. The depth formula applies only to the stated disjoint-root case; implementation should use the actual union.

The separate new workflow/observer/test scope is coherent. Existing prepare accepts the new workflow's repository/ref/SHA context and records its workflow reference without calling the old validator. The observer must independently validate the exact new workflow reference and bindings. Existing prepare still writes game-inputs metadata for the original qualification workflow; that record is not authentication of the new workflow. Authenticate the new observer/workflow separately against the same game commit, without widening old validate_partial or invoking the old bridge/preflight ledger.

The new job's narrow triggers, fixed pins, preparation/restoration, existing scoped source chown and unconditional nonaccepting observer exit are appropriate. The observer introduces no source-content reads, source creation probes, credential selection, cache/devcontainer/SDK work or qualification admission. Unchanged preparation's authorized restoration/validation is distinct from observer metadata collection. An artifact-safe Boolean establishes safe diagnostic publication only.

## Measurement and completeness

Use the fixed manifest's role-specific ownership/type/mode expectations rather than assigning every source-home leaf0400. Existing prepare's copied restoration receipt and snapshot manifest do not use the JSON/authority chmod sequence. Static creation rules should retain the actual requested initial modes and later mode changes: write_bytes/copyfile creation, explicit chmod0400, mkdir0700 versus implicit intermediate0777, and mkstemp0600 followed by fchmod0400. These are code-derived rules, not observed creation history or kernel witnesses.

Descriptor-relative O_PATH/no-follow traversal, held identities, bounded native getxattr through `/proc/self/fd/<held-fd>` and before/after ctime/ACL/name checks are the correct metadata boundary. O_PATH alone does not authorize read/search/write access. Never substitute a pathname xattr fallback, follow an unexpected source alias, connect to the socket or inherit these root handles into a credential probe. Keep descriptors live through all joins; close them on every failure/deadline path.

ACL access/default records remain separate. ENODATA alone means absent; ENOTSUP/EACCES, malformed/unknown encodings, size growth and instability remain explicit incomplete evidence. Preserve exact retained bytes alongside decoding; decoding must not become a permission/admission oracle. ACL presence by itself must not stop traversal down an otherwise structurally safe branch. Continue independent branches after a blocker, with all blocked/unmeasured rows and their causes accounted for.

Treat the two fixed socket layouts as conditional alternatives. Stable `/var/run -> /run` or `../run` mapping may explain the logical row without admitting another alias; a real `/var/run` permits independent measurement there. Absence of an unused alternative is not a false required-node failure. A final socket symlink remains unsafe. The permitted mapping and explicitly inapplicable symlink ACL inspection are different from an arbitrary skipped measurement.

Preallocate the complete compact row set and reserve room for coverage, first failure, omission counts and creation rules within the64KiB encoding. ACL-table overflow must omit decoded-entry expansion as necessary as well as raw bytes, retaining known length/hash and explicit incompleteness; otherwise the decoded representation can defeat the byte cap. Never call omitted or timed-out data complete. Future absence can be accounted for only as confirmed absence/blocked expected absence, with creation and kernel witness fields null.

## Publication, races and failure records

Root publication is limited to one exclusive `layout.json` through held U. Validate U's owner, exact0700 mode and supported effective-private ACL state, and rejoin the directory descriptor to its expected parent/name before and after publication. A held descriptor alone does not prove that the uploader's pathname still names it. Require the same joins for the final file, including0400, actual runner owner, single link, stable bytes and bounded length. Private POSIX mode/mask can coexist with latent named/default ACL entries; unsupported or uninspectable publication ACLs cannot be assumed private.

The measured prepublication U identity and the later publication identity are separate observations. Creating the report/status changes directory timestamps intentionally. Preserve the former in the layout and the latter in status/readback rather than silently treating changed timestamps as an unchanged snapshot or introducing a self-referential report hash.

Runner admission must independently read/hash the fixed report, create/read back bounded status, and verify the exact two-file inventory and current held U/parent/ACL joins. Root readability or a successful root write cannot set artifact_safe. Root never receives GITHUB_OUTPUT. The runner emits only the sole typed Boolean after these checks and before D.

Fallback remains exclusive and explicit: if root failed authentication/startup, unknown root/source facts and authentication claims stay null/unavailable with producer=runner_fallback. A partially created/preexisting layout file must not be replaced or relabelled as fallback; absent a safely verified exact artifact, retain exit1 without artifact_safe. A root refusal is not permission to broaden the directory allowlist or upload C/request.

Install and enforce the charged absolute deadline before expensive authentication/Git/measurement work. Fixed Git subprocesses need remaining-deadline timeout and retirement; ordinary runner timeout cannot establish retirement of a root process. Measurement ends by D−3, root by D−1 and runner by D, with no fallback/publication work after expiry. All wrappers and both files remain within the stated individual and combined caps. Completeness and safe retention never change the observer's exit1/nonacceptance result.

## Verification and remaining gates

The brief's focused test categories cover the necessary distinctions: fixed manifest, continued independent branches, absent/default/access ACL semantics, exact bytes/decoding/dedup/overflow, procfd and identity/ctime races, publication replacement/alias/hardlink/owner/readback refusal, incomplete fallback, exact artifact inventory and fixed workflow/context/no-preflight-dependency. Static creation-rule comparisons must use the actual existing calls. Any unavailable privileged fixture remains an explicit skip; projected metadata is not hosted evidence.

The next hosted run is only a bounded layout diagnostic. Return its complete retained evidence to architecture review before choosing an ACL access contract, adding kernel credential witnesses or attempting another admitting preflight. No automatic source-access or qualification run follows this design approval.

Review used read-only files/Git, manifest set arithmetic and retained evidence hashes; no tests, implementation, index/source edits, subagents, privileged operations, network, Docker or builds. This report is the only written file. Inspected documentation HEAD was `ce978d841438d27a477d02a829d700ff8e2a9e97`; source remains clean463177a. Observed free space8,975,601,664 bytes, above8GiB.
