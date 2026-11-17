# Task4c host architecture diagnosis

2026-11-17. Read-only diagnosis after the fifth/final Task4b fix and actual run44105354772. No implementation, tests, privileged operations, builds, Docker, network, delegation or source changes were performed. This report is the only file written.

## Decision

Do not make a sixth line-level Task4b repair. The demonstrated blocker is an overly narrow supported-host contract: the bridge requires both access ACLs and directory default ACLs to be absent, and stops measuring at the first nonempty xattr. The actual host has a default ACL on `/home`. That observation does not establish a denied read or search permission.

The smallest coherent Task4c architecture retains the original source path, source UID/GID1000, existing private readers and one-time copy handoff. Separate three decisions that the current single ACL flag conflates:

1. Collect a complete bounded metadata inventory of the fixed access and creation layout before granting access or rejecting a particular ACL layout.
2. Support explicitly recognized Linux POSIX ACL metadata, with separate access/default semantics. Use actual kernel checks under the existing baseline credentials and, only if necessary, the one already authorized runner-GID candidate to select credentials. Do not introduce an independent ACL permission interpreter as the source of access authority.
3. Admit preflight only after actual original-source/game reads, actual private creation/copy transfer, and actual ordinary-runner readback establish the existing custody contract. Record inherited ACLs on those existing preflight objects as well as their modes.

Next task: independently review and implement the bounded measurement/retention contract below, then perform a **diagnostic-only hosted execution**, returning nonacceptance before image/cache/devcontainer work. Its evidence determines whether the in-place ACL/kernel-witness contract is supported. Consider a controlled namespace only if measurements demonstrate that permitted identities cannot use the existing layout safely.

## Demonstrated evidence and limits

Reviewed the current driver/workflow, prior host-access ruling/design/implementation review and final fixture report. Hosted commit `1243d59531541ab1117539d37a48a1675fe318e0` repaired the fixture, not the production ACL gate. Evidence:

- `docs/research/numeric-export/recovery-2026-11-16/ci-44105354772/observed-failure.json` (1702 bytes, SHA256 `84b41352466cdfbf8de772d221c4573367eb4202c444681060ba62e884fb549e`).
- The same directory's `completed-run.json`, `full-run.log`, `failed-steps.log`, `launch.json`, ZIP and `evidence-index.json`. All six indexed file lengths and SHA256 values independently match the index.

The actual record says `preflight-image`, runner1001:1001, root observer0:0, `planned:null`, `actual:null`, exit1 and nonacceptance. First failure: `unsupported_acl`, `/home`, `getxattr:system.posix_acl_default`, errno null. Both recorded directories (`/`, `/home`) are root-owned0755. Refusal occurs approximately0.104 seconds into the bridge, before credential selection or child execution. Preparation/source chown completed; cache/devcontainer work and qualification did not run. Image retention refused because preflight was incomplete; the small failure artifact was retained.

In `_bridge_access_measure`, `acl()` checks `system.posix_acl_access` first and continues only on ENODATA. It then checks the default ACL for directories. Thus the code path plus actual failure establishes that `/home`'s access ACL was absent at that observation and its default xattr returned bytes. `/` had neither xattr. No default-ACL bytes, length, version, entries or mask were retained. Even an ACL containing only the base entries is consistent with the observation; named grants are not established.

The socket measurement admits this run's root-owned0660 GID118 socket at canonical `/run/docker.sock`, with `/var/run -> /run` and the measured safe parents. That is an actual root socket-layout observation. It is not a child socket-access/connect witness: no child ran.

**Unobserved:** every later ancestor/object ACL and mode; baseline/candidate access; actual creation inheritance and distinct-UID custody/readback; image/scenario/OC10 success. Prior run44092790586's EACCES did not identify its denied ancestor. This run neither explains that denial nor proves identical ephemeral-host layouts.

Source463 remained clean: HEAD `463177a0971d95e112e10ed5da39c8cbaf0a4c96`, tree `0990e900cf1cb5bb4a481bba781a86cc3fcf0999`, original index SHA256 `b57cc2bd2190d7e5fa1cbb941b29eb22160d41aab91e63a4fdf48a601b3a9fb1`. No snapshot/pin/evidence changes. Measured free space8,890,183,680 bytes, above8GiB.

## Why access and default ACLs must be separated

An **access ACL** controls access to an existing object. With extended Linux POSIX ACLs, the group mode bits represent the ACL mask, not necessarily the owning group's permissions. Named-user precedence and the mask can change the result that a mode-only owner/group/other calculation predicts. A matching owner or named user cannot fall through to a more permissive other entry; applicable group decisions also cannot simply fall through after denial. Adding a group is not monotonically beneficial. Merely allowing nonempty access xattrs while retaining `bridge_access_permission()` would make admission unsound.

A **default ACL** is a directory's inheritance template for newly created children. It does not decide traversal of that directory or read access to existing descendants. `/home`0755 with absent access ACL permits the ordinary other-class search bit regardless of the default ACL. The current default-ACL rejection therefore cannot be called a demonstrated kernel denial. Changing a parent's default ACL does not retroactively replace existing children's access ACLs.

When a parent default ACL exists, new objects inherit an access ACL constrained by the requested creation mode; the usual no-default-ACL umask calculation is not an adequate model. Newly created directories may also inherit a default ACL. `chown` does not strip these ACLs. `chmod` changes the effective access permissions/mask but can leave named entries present. An ACL-aware contract must distinguish present-but-currently-masked entries from actual access, and must not claim xattr absence after chmod.

For a supported POSIX ACL, an exact0700 directory or0400 file has zero effective group-class mask and zero other permissions. Named entries cannot bypass that mask. Consequently, a nonempty access/default xattr does not by itself defeat the original owner's current private0700/0400 policy. Conversely, a successful UID1000 read proves availability to that UID, not privacy from another UID; the separate private-mode/owner checks and distinct-runner denial remain mandatory. Unsupported ACL models or unreadable metadata still cannot be assumed safe.

The actual creation/custody domains are:

| Domain | Current actor and operation | ACL implication to measure |
| --- | --- | --- |
| Runner preparation | Checkout/restore and `prepare`, then workflow `sudo chown -R 1000:1000 prismpm` | Observe actual prepared access/default ACLs after chown; public files must remain readable by the ordinary runner. Chown alone does not normalize ACLs. |
| Private source preparation | Home mkdir0700; authority copies then chmod0400; JSON `os.open(...,0400)` or mkstemp+fchmod0400 | Measure home, leaves and intermediate `target`. Python's `parents=True` does not apply leaf0700 to intermediate directories. Privacy relies on actual creation/chmod masks, not umask alone. |
| UID1000 host operation | `home/host-bridge/<operation>` and original/copy objects | Measure the existing nearest creation parents' default ACLs, then actual new directories/files. Existing preflight already supplies a disposable original and copy; no second scratch tree is needed. |
| Root control | `evidence/.host-bridge-root` and immutable ledger/publication records | Exact0700/0400 creation and owner checks remain required; inherited default/latent access entries must be observable. No ACL changes to existing host parents. |
| Copy handoff | Same-device no-replace rename; root fchown runner, fchmod directories0700/files0400, top directory last | Only enumerated copies change owner. Mode clamping limits effective ACL access but need not remove entries/defaults. Join actual ACL/mode/identity observations before and after transfer and retain the original unchanged. |
| Ordinary runner | Private controls, export hashes/admission writes, five public build-input reads | Actual runner reads are decisive. The source UID child's extra group does not change runner credentials or repair runner input access. |

The `/workspaces/prismpm` container bind avoids host `/home` ancestry but preserves source inodes/ACLs/inheritance. This failure does not justify container/source-reader changes.

## Minimal discriminating measurement

Separate measurement from policy: every declared fixed node is measured or explicitly unavailable/blocked/over-limit. Never follow unsafe branches, scan arbitrary files or read payload bytes as root.

**Fixed closure.** From authenticated cwd and the joined original `partial.host_source`, build a deduplicated manifest containing the current source/game requirements and all ancestors; the five public build inputs and their ancestors; existing source `target`, private home and host-bridge parents; evidence/control/root-ledger/export parents; and the already fixed socket layout. Mark each node's actor and role: search, read, required write/create parent, or transfer destination. List fixed not-yet-existing children as expected-absent and bind them to the measured nearest parent. Cover all six source-reading operations with the same manifest construction. Do not make metadata/raw control-only guards acquire a source child.

Fixed `.git/HEAD`, `.git/config` and object-directory measurements are layout observations, not every Git dependency. Preserve exact child Git commands/commit/blob joins as actual operation witnesses. The fixed-layout diagnostic also does not replace the later full collector payload inventory; no unbounded Git/source scan is proposed.

**Per-node data.** Retain held no-follow identity, parent linkage, dev/inode/type, UID/GID/mode, role and relevant timestamps/link counts. Record access/default ACLs separately: absent/ENODATA, present, or exact read errno. Deduplicate exact bounded ACL bytes, lengths/SHA256 and numeric version/tags/permissions/IDs/mask. No account lookup. Local Linux headers specify xattr version2/tags, not actual hosted contents.

Bind ACL observations to the same held object with before/after identity/ctime checks and a consistent xattr re-read; a pathname xattr read alone must not be mistaken for descriptor-bound evidence. Record mismatches as instability, not an admissible snapshot. Unsupported type/alias/unsafe branch or filesystem inspection failure remains a refusal, but continue collecting independent safe branches and record every blocked descendant. In particular, default-ACL presence alone must no longer terminate diagnostic collection at `/home`.

**Creation information.** Record actor, requested mode and parent default ACL at each boundary. Prepared objects provide actual post-chown observations, not invented historical ACLs. Subsequently instrument the already-required preflight original/copy/directories and handoff before admission; unexecuted creation has null actual observations. Root measurement must not create source substitutes or supply child content reads.

**Bounded retention.** Proposed explicit design limits:96 fixed layout nodes,8KiB raw bytes per individual ACL and64KiB for the complete canonical diagnostic file, including deduplicated ACL data. These are ceilings, not a prediction about the host. Derive and test the exact manifest/count before implementation approval; no caller can add paths. If a limit, clock, read or stability check prevents completeness, retain bounded coverage/failure data and refuse. Never label a truncated table complete.

Keep the existing8KiB control stream and short access summary. It carries actual/planned identities, full first failure/prefix/errno, socket result, completeness/overflow fields, and the fixed diagnostic file's byte count/SHA256. Root may publish only this fixed metadata record to the already validated runner-owned control area using the existing exclusive publication pattern. The runner must read/hash it as itself. It cannot accept an arbitrary pathname or root-readable data request.

Extend the current exact failure-only allowlist from `bridge-failure.json` to include this one fixed diagnostic file, with inventory/hash/ownership checks. Charge both to existing32MiB metadata/4GiB combined caps; keep the8KiB pipe. Publication failure means incomplete diagnostics and no success output. Diagnostic retention never admits an incomplete source export or completed preflight.

Consume existing absolute clocks:30-second preflight, five-second budgets,60-second retention. No renewed timer, workload retry, network or expensive work. Diagnostic-only execution ends before cache/devcontainer admission even if its inventory appears usable.

## Recommended supported-host contract after measurement

This is a proposed Task4c ruling, not a silent exception to the prior reviewed Task4b ACL-absence/no-retry contract. It needs independent design review before implementation or an admitting hosted run.

1. Recognize only bounded, well-formed Linux POSIX ACL metadata with separately known access/default semantics. Preserve all current owner/type/no-follow/single-link/private-mode/source-identity restrictions. Unknown/unreadable ACLs, unstable identities, unsupported layout or incomplete coverage refuse. A default ACL on a traversal-only ancestor is observable inheritance metadata, not an automatic search denial. On creation parents it must be joined to requested and actual child modes/ACLs.
2. Replace permission arithmetic as the admission oracle with a **closed credential-selection witness**, over only the predeclared fixed requirements. Baseline is UID/GID1000 with only the already permitted socket group for the three socket operations. Observe actual real/effective IDs and exact groups after drop, close inherited root handles, clear environment as now, and ensure no retained DAC-bypass capability can make the witness a disguised root read.
3. Run bounded, non-mutating kernel access/search checks with syscall errno and no-follow identity joins, followed by the fixed actual original-reader and game Git/authority reads. An O_PATH open alone does not prove target read/search/write access. Use real permission checks for the required masks and actual opens/reads; report precise first denied prefix. An ACL decode is useful for explaining evidence, not for overriding these results. Do not classify a generic Git error, integrity mismatch, timeout or unsupported metadata as permission denial.
4. Only if baseline has an actual permission denial on a required access may the selector try the one candidate containing authenticated SUDO_GID. It must check the **whole** fixed plan, not only the failed ancestor. At most these two credential sets are permitted; if baseline succeeds, omit the extra group. If candidate fails anywhere, refuse. This is a finite read-only selection stage, not a retry of collection, export, creation or a failed source validator. Its process-wide group authority remains explicitly recorded. No initgroups, arbitrary inode-derived group, account change or environment-preserved authority is allowed.
5. After a selected complete read witness and unchanged metadata/ACL joins, execute the existing operation once under exactly those credentials. Private preflight creation/transfer/readback happens once. Actual runner non-readability of the distinct-UID original, actual runner copy/hash reads and actual runner public build-input reads remain separate required facts. Capture actual inheritance/handoff ACL observations before declaring preflight complete. Original source ownership, modes, bytes and namespace never change as an access repair.
6. Remeasure/rejoin the fixed layout and actual access on each of the six source-reading operations under its existing clock. A successful preflight does not promise that subsequent ACLs, LSM decisions or payloads cannot change. Preserve real nonzero exits, actual-versus-planned distinction, one-time ledger/export behavior and existing absolute collection reserve. Metadata/raw guards stay control-only.

A runner-owned0700 ancestor cannot be repaired by a supplementary group: owner-only search with zero group/other permissions is still denied. A named ACL denial, missing permission on UID1000's own object, read-only mount or other kernel restriction may also remain fatal. Those cases must produce the complete bounded diagnostic and stop; no blind chmod, ACL removal, extra group or root source-read fallback is authorized.

## Alternatives and unresolved choices

Ignoring only default ACLs preserves identity but leaves subsequent access ACLs/inheritance unknown. A complete ACL permission interpreter preserves the path but duplicates kernel semantics and still needs actual reads. Neither is the next patch. The recommended in-place architecture adds bounded metadata and at most two read-only credential probes under current deadlines, retaining original inodes/readers and custody.

A controlled preparation namespace could provide deterministic new parents. Binding existing source preserves its inodes **and ACLs**; copying/staging changes custody/path identity and consumes disk. Either requires separate preparation/workflow/path rulings, ordinary-runner cache access, same-device handoff and lifecycle review; mounts also add privileged machinery. If demonstrated necessary, establish a specifically reviewed new owned parent from the start, never sanitize existing `/home`, workspace or source ACLs. It is not an implicit fallback.

Unresolved until full measurement/review: whether the existing layout meets the proposed ACL contract; exact fixed-manifest node count and retained schema; which native permission-check syscall interface is supported; whether the finite two-credential selector meets the five-second operations' existing deadlines. Missing answers require refusal/design correction, not fresh time or authority. None prevents collecting the bounded diagnostic first.

## Required discriminating tests and acceptance gates

Proposed tests, not executed here:

- Complete collection past default-only0755 ancestry; multiple independent blockers and blocked branches; access/default separation; unknown/malformed/unavailable ACLs, races and explicit count/byte overflow; retained full-file/hash joins within all caps.
- Actual default inheritance under0700/0400 creation, intermediate mkdir, chown and copy fchmod; existing children unchanged by later parent-default changes; latent entries distinguished from effective access; UID1000 original unchanged/private and runner copy actually readable.
- Baseline omission of extra group, necessary0750 runner-group access,0700 refusal, owner/named-user/mask/group precedence, whole-plan candidate regression, and no credential retry after integrity/Git/non-permission failures.
- All six operations, socket roles, actual game Git/original-source/runner-public reads, root-descriptor isolation, control-only guards, no repeated creation/export, and unchanged absolute clocks/reserves.
- Failure before child and during selection/creation/handoff; exact two-file diagnostic allowlist; partial transfers never admitted.

Local sudo is unavailable; skipped/projected-ownership fixtures are not privileged kernel witnesses. A suitable separately authorized environment must supply distinct-identity ACL tests. First obtain the complete hosted diagnostic, then independently review its evidence/contract before an admitting read/create/transfer/readback preflight. Preflight success would still not establish image/scenario/OC10/SDK success.

## Inspection record

Used bounded driver/workflow/report/header reads, retained-file SHA256/length checks, source Git/index checks and free-space measurement. No hosted or privileged fixture tests ran.
