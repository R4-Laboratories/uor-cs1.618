# Task2 contracts and sequence

Revision2 after B1–B3 contract review,2026-11-17; no implementation/admission. Read adopted spec/plan, reconnaissance, pristine463177a, Task1 package/patch/schema/metadata/report. Task1 review requires name-capture/preallocation fixes; implementation stays gated. B/D/R/C are future admitted identities, never development fixtures.

Task3 owns final source/recipe/registry/custody/acquisition. Ordinary source/readers/pins/four Lean authorities unchanged.

## 1. Common types, encoding and bounds

Notation `{a:T,b:U}` means precisely required keys; no unknown/optional/null/default/coerced fields unless stated. Closed `oneOf` unions, draft2020-12, locally hash-bound schema refs only. Existing /3 substructures retain exact schemas/meaning.

* `H`: lowercase 64-hex SHA256; `G`: lowercase 40-hex Git object ID. Never interchange `H` and `sha256:H` (`SDKDigest`). Content IDs use bare H as existing Prism/LexLean do.
* `N(m)`: JSON integer 0..m; all new JSON integers <=2^53−1. `S(n)`: UTF-8 string of <=n bytes, no NUL/control characters; nonempty unless indicated. `P`: root-relative POSIX path, <=1024 bytes, components <=255 bytes; no empty/dot/dotdot/backslash/control component, no leading/trailing slash. Paths are identifiers resolved through a held owner, never fetch URLs or executable selectors. Archive link target strings are the sole explicit exception for registered `..` components.
* `Blob={byte_length:N(4294967296),sha256:H}`. Each enclosing role imposes its smaller cap below. `File={path:P,byte_length:N(4294967296),sha256:H}`. Arrays of file records are bytewise path-sorted and unique; referenced bytes must exist and match, not just their JSON claims.
* `Exec={byte_length:N(268435456),mode:N(511),sha256:H}` with length>=1, executable mode bit set, no set-id/sticky bits; stat must be regular, singleton, no-follow, with held real ancestors. Custody also compares owner/device/inode/bytes before/after.
* `Platform` is `linux/amd64|linux/arm64`; retain actual platform. `id` and `rule_version` below are constant `constructive-nat-v1`; profile is exactly `prismpm/native-library/1`.
* New Prism records use existing `holo::canonical::{decode_value,encode_value,content_id}` semantics: unique keys, bytewise sorted keys, minimal integer/string encoding, no floats or trailing LF/bytes. Check bounds before allocation; require canonical re-encoding. JS must reject duplicate keys before JSON.parse, unsafe integers and malformed UTF-8. Nat128 uses canonical decimal strings/checked BigInt, never JSON numbers.
* New record maxima: D 64KiB/4096 contract items; identity 4KiB/64; preparation 1MiB/16384; acquisition 1MiB/16384; build-inputs/4 16KiB/256; verification-manifest/4 **existing 16MiB/65536 total**, including additions. Here item caps use the original contract item_count convention defined in §7.1, not lexer tokens. New objects depth<=32. Source inventories are separately bounded at 32MiB/131072 entries/4GiB regular payload total. Check before allocation; original smaller project/stage/process limits dominate.
* Logs are separately retained Blob/File records, <=16MiB aggregate stdout+stderr per owner operation and also charged to the original smaller stage limit, if any. Failure retains bounded logs and publishes no successful acquisition/preparation/manifest.

Domain-separated aggregate framing is exact: `F(domain,[(label,bytes),...]) = SHA256(ASCII(domain)+LF + concatenation(UTF8(label)+NUL+u64be(len(bytes))+bytes))`, fixed listed order. Hash inputs described as H are **decoded 32 bytes**, not hex text. Raw file hashes remain SHA256(raw bytes); canonical record hashes are SHA256(canonical bytes). 

## 2. Source descriptor D, outer R, inventories

D schema `prismpm/proof-compiler-source/1` has exactly:

```
{schema, id, diagnostic_only:true, profile,
 base:{commit:G,git_tree:G,archive:Blob,inventory:Blob,tree_sha256:H},
 original_lexlean:{revision:G,version:"0.4.0",crate_archive:Blob,
                   inventory:Blob,tree_sha256:H,compiler_semantics_id:H},
 overlay:Blob, recipe:Blob,
 derived:{inventory:Blob,tree_sha256:H},
 package:{name:"lexlean-constructive-diagnostic",version:"0.4.0-constructive.1"},
 compiler_semantics_id:H, runtime_closure_sha256:H,
 rules:{version:"constructive-nat-v1",rules_sha256:H,certificate_schema_sha256:H,
        limits:{parameters:32,hypotheses:64,input_nodes:1024,nat_bits:128,
                coefficient:4096,canonical_leaves:4096,scale:16,candidates:8192,
                terms:16384,certificate_nodes:16384,proof_bytes:1048576}}}
```

`overlay` is a canonical index of ordered, separately hash-bound Task1/Task2 patches and provenance operations, not an ambiguous concatenation. Index/recipe<=1MiB, patch<=16MiB, archive<=4GiB. Recipe enumerates exact operations/inputs, including diagnostic provenance edits. D contains no expected executable hash, C, hash(D), registry hash or aggregate self-reference. Original revision/archive come from frozen dependency authority. Semantics is actual1.2 getter result; current Task1 value is provisional.

Canonical inventory format, for both base and derived:

```
{schema:"prismpm/proof-compiler-tree/1",entries:[Entry...]}
Entry = {kind:"directory",path:P,mode:N(511)}
      | {kind:"file",path:P,mode:N(511),byte_length:N(4294967296),sha256:H}
      | {kind:"symlink",path:P,git_mode:"120000",target:S(1024)}
```

Include all non-root real directories and all regular files; root has prescribed mode0755. Real directory mode0755; regular modes0644 or0755 determined from Git mode100644/100755. Portable modes exclude host mtime/UID/inode/link permissions; custody retains them. Unique path order; validate ancestors/overlaps before creation. Empty directories require explicit recipe. Exactly22 aliases; no duplicated target subtrees. Adopted §5.1 graph/no-follow rules apply. `tree_sha256=SHA256(canonical inventory bytes)`; thus inventory.sha256 equals tree_sha256. A subtree digest, when needed, is F(`prismpm/proof-compiler-subtree/1`, path-labeled canonical entries restricted to that declared subtree), with full root-relative paths and no alias traversal.

`runtime_closure_sha256 = SHA256(raw bytes of B:model/library-frontend-runtime.json)`, including its actual original EOF/pretty formatting; no canonicalization or subtree frame. Its exact five records name LexLeanRuntime.{Portable,Collections,Models,Reasoning,Laws}, imports, and source.path/byte_length/SHA256. Logical source paths are LexLeanRuntime/<name>.lean. These are generated embedded-runtime API outputs, **not existing .lean files under runtime-1.2**. Original runtime API/source gate must independently reproduce each exact row/bytes; caller checks actual generated runtime bytes against rows. Full T_D separately binds original frozen/runtime source/library/generated-data inputs and candidate copies, so this named frontend projection is not a complete-tree exemption. Original four preservation Lean authorities remain byte-identical and separately inventoried; no fifth authority or changed runtime/pin/SDK bytes. Task3 supplies frozen raw file hash and real runtime comparison evidence.

Proposed outer registry record R (Task3-owned):

```
{schema:"prismpm/proof-compiler-registry/1",id,descriptor:Blob,
 effective_source_sha256:H}
```

`effective_source_sha256 = F("prismpm/proof-compiler-build-source/1",[("tree",decode(T_D)),("descriptor",decode(hash(D))),("recipe",decode(recipe.sha256))])`.
R<=4KiB, no C. Controller selects actual C/R; C contains R/D/overlay/recipe; B predates additions. Trusted bundle resolves files, never receipt URLs. Recipe binds all auditor/materializer helpers. Root admission never executes candidate code to authorize itself. Framing changes require contract revision.

## 3. Stable proof identity and build-inputs/4

`library/proof-compiler.json` canonical identity I:

```
{schema:"prismpm/proof-compiler-identity/1",id,descriptor_sha256:H,
 derived_tree_sha256:H,compiler_semantics_id:H,rule_version,
 certificate_sha256:H}
```

Certificate path is fixed `proofs/constructive-nat.json` in full LexLean manifest; copied Prism path is `lexlean/build/proofs/constructive-nat.json`. Require exactly one full-manifest output of kind `constructive-nat-certificate` at that path and recompute bytes/length/hash. I contains no process/acquisition/preparation/platform/path data. Zero selected theorems still require the fixed artifact with zero rows.

Candidate build-inputs/4 is an explicit registered closed schema, even though /3 was inline:

```
{schema:"prismpm/build-inputs/4",
 application_generator_sha256:H,dependency_register_sha256:H,
 emitter_semantics_id:H,model_id:H,system_id:null,
 lexlean_build_id:H,lexlean_semantic_id:H,lexlean_source_id:H,
 library_artifacts_sha256:H,library_generator_sha256:H,
 proof_compiler:I}
```

Library /3 fields plus I; reject other profiles before build, system_id=null. `library_artifacts_sha256` retains existing canonical full FileRow-array hash, `build_id=SHA256(canonical inputs bytes)`. Add sidecar before sorting/build identity. It must also enter `library_build`'s generation result in both controller-build and replay, before owner phase artifact binding: **patch library_build.rs**. Each phase independently validates manifest/certificate, generates I, compares bytes. Existing outer manifest/FileRow kinds stay; sidecar uses `artifact`.

Avoid a lock cycle: `prismpm.lock` SDK-lock/3 retains its closed schema. Its input toolchain lexlean version uses actual candidate version; actual derived generator IDs bind external D and all helpers. Do **not** insert certificate hash/I into pre-build SDK-lock inputs (certificate is an output). Original SDK /2 projection/inventory/pins stay original. LexLean lock uses actual candidate semantics. SDK input-lock changes only T_D; no /4 SDK-lock.

Derived generators hash actual changed sources/all helpers and raw D at `authority/descriptor.json` with existing framing.

## 4. Acquisition A and external trust

Successful A schema `prismpm/proof-compiler-acquisition/1`:

```
{schema,id,mode:"source-backport",controller_commit:G,registry_sha256:H,
 descriptor_sha256:H,effective_source_sha256:H,
 base_commit:G,base_tree_sha256:H,derived_tree_sha256:H,recipe_sha256:H,
 platform:Platform,environment:Environment,
 source_custody:File,build_processes:[BuildProcess...],
 producers:{verifier:Exec,preparation_cli:Exec},
 retained_producer_manifest:File}
Environment = {kind:"installed-sdk",sdk_lock_digest:SDKDigest,inventory_sha256:H}
            | {kind:"source-bootstrap-only",toolchain:"leanprover/lean4:v4.32.1",
               launcher_sha256:H,lean_sha256:H}
BuildProcess = {recipe_step:N(15),tool:"cargo",argv:[S(4096)...],
 executable:Exec,working_directory:"$SOURCE",environment:BuildEnv,
 exit_code:0,stdout:File,stderr:File}
BuildEnv = {CARGO_HOME:"$CARGO_HOME",CARGO_TARGET_DIR:"$BUILD_OUTPUT",
 CARGO_NET_OFFLINE:"true",RUSTUP_TOOLCHAIN:S(256),
 RUSTC:"$TOOLS/rustc",RUSTDOC:"$TOOLS/rustdoc",PATH:"$TOOLS",
 HOME:"$BUILD_HOME",TMPDIR:"$BUILD_TMP",LC_ALL:"C",LANG:"C"}
```

`Environment.sdk_lock_digest` equals `sdk::execution_lock`'s canonical **SDK-lock/2 projection** digest: parse original independently held installed SDK lock, drop inputs and set schema=/2 if input was /3, validate original inventory, SHA256 canonical Prism bytes with `sha256:` prefix (`sdk.rs:452–489,1075`; `contracts.rs:1106`). Never hash project-dependent candidate /3 inputs. inventory_sha256 is actual native platform inventory digest as original exporter_seed_inventory returns, checked against installed inventory and projection. Bootstrap has no invented SDK digest.

Build steps1..16, argv1..64: exact recipe argv/env/order, no shell/inheritance. Symbolic paths record checked held locations. Original pinned RUSTUP_TOOLCHAIN/rustc; $TOOLS is checked executable table. `--locked --offline`, no lock rewrite; all actual Cargo/rustc/build-script children/tool hashes covered by Task3 owner/custody. Existing deadlines dominate. Task3 must implement process/source custody before A; Task2 cannot fabricate it.

**Production A emission/admission is blocked until Task3 custody and producer-manifest subformats are specified and independently reviewed; an opaque File is never authority.** source_custody<=16MiB is the recognized standalone owner result binding pre/post full inventories, physical alias/target/ancestor identity and actual tools. Missing/unrecognized evidence refuses. Producer manifest<=1MiB lists both measured binaries plus all admitted readers/schemas/helpers. Fixed names: prismpm-constructive-diagnostic and lexlean-constructive-diagnostic. No fictional LexLean build/verify child: linked Engine is in process; preparation really invokes CLI children. Exact Task3 custody subformat remains a stated parent decision below.

Nonserialized outside-controller capability:

```
AdmittedAuthority {
  selectedId, controllerCommit, registryBytes, descriptorBytes,
  expectedEffectiveSource, heldSourceOwner,
  producerOwner: independently accepted acquisition hash + retained binary handles,
  readerOwner: reviewed file handles/hashes from T_D,
  environmentOwner: InstalledSdkAuthority | SourceBootstrapAuthority,
  exporterOwner, projectExpectation
}
```

Independent admission constructs this, never receipt parsing. Compare external R/D/aggregate/A/binaries. Worker AuthorityKey binds id,D,T_D,aggregate,A hash,both Exec identities; Plan equality/reload also binds original config witnesses. Recheck live owners before/after, including same-content replacement; no environment selectors. Separate execution review admits producers.

`projectExpectation` independently binds each numeric project/model/source/snapshot/lock/declarations/runtime/erasure/exports. Never infer membership from receipts. SDK/bootstrap remain separate cases, never fake SDK metadata.

## 5. Preparation P: real CLI calls, frozen lock, no cycle

Measured derived verifier `prepare` owns calls to held measured candidate LexLean CLI; no third binary or Task1 API change. All project operations require `--proof-compiler constructive-nat-v1` and externally installed authority handle, never caller URL/path selection.

Successful preparation schema `prismpm/proof-compiler-preparation/1`:

```
{schema,id,descriptor_sha256:H,derived_tree_sha256:H,
 compiler_semantics_id:H,acquisition_sha256:H,
 owner:Exec,preparation_cli:Exec,
 project:{prism_config:{path:"prism.toml",raw_sha256:H},
          lexlean_config:{path:"lexlean.toml",raw_sha256:H,canonical_sha256:H},
          source_id:H,semantic_id:H,snapshot_sha256:H},
 lock:{path:"lexlean.lock",byte_length:N(67108864),sha256:H},
 processes:[PrepProcess,PrepProcess,PrepProcess,PrepProcess],
 result:"prepared"}
PrepProcess={operation:"lock"|"fmt"|"lock-check"|"check",
 executable_sha256:H,argv:[S(4096)...],working_directory:"$PROJECT",
 environment:{LC_ALL:"C",LANG:"C",HOME:"$PREP_HOME",TMPDIR:"$PREP_TMP",PATH:"$TOOLS"},
 exit_code:0,stdout:File,stderr:File}
```

This first diagnostic preparation profile explicitly requires selected Prism file `$PROJECT/prism.toml`, its resolved LexLean file `$PROJECT/lexlean.toml`, configured lockfile `lexlean.lock`, build_root `.lexlean`, language1.2 and lean_workspace `.`; reject other selections before mutation. Original general configuration support is unchanged. Both original descriptor-backed config witnesses and modeled stack stay. raw_sha256 hashes selected raw file bytes; canonical_sha256 is actual LexLean ProjectConfig::config_sha256() over canonical_toml bytes, never Prism config or raw TOML. 

PrepProcess argv excludes argv0 (executable identified separately), exactly prefix `["--project","$PROJECT/lexlean.toml","--diagnostic-format","json","--color","never"]` followed respectively by `["lock"]`, `["fmt"]`, `["lock","--check"]`, `["check"]`. Real path replaces `$PROJECT` only in executed argv; record normalizes to it. No `--allow-network`, `--all` or input paths: fmt/check use Entrypoints. `--proof-compiler` belongs solely to new Prism wrapper, never existing LexLean child. Parse actual command-result schemas. Freeze formatted source/final lock, snapshot in process and check final lock; no fictional process row. The selected path and lock checks precede any child, so wrapper/Plan cannot silently address different projects.

Owner compares CLI hash against admitted producer; project-specific emitted/check lock semantics against D; linked candidate's actual `compiler_semantics_id_for("1.2")`, source/snapshot/lock against same D/T_D. CLI binary acquisition binds D/T_D; observed semantics/lock must agree, without a descriptor API. P.owner equals A.verifier; P.preparation_cli equals A.preparation_cli. After preparation, later facade commands must remeasure source/config/lock and refuse any mismatch. Formatting occurs only explicitly in preparation. Validate unchanged snapshot/2 and original canonical_bytes() exact roundtrip.

P has no I/certificate/build ID. Retain its digest outside deterministic build artifacts. Version inspection creates no P; failures stop/retain logs. Historical logs cannot be relabeled P.

## 6. Verification-manifest/4 and retained reader entrypoint

Copy /3 schema/data exactly and change only schema constant plus these four required fields:

```
proof_compiler:I,
proof_compiler_acquisition:A,
proof_compiler_preparation:P,
proof_compiler_execution:{kind:"in-process",verifier:Exec,
  acquisition_sha256:H,preparation_sha256:H,
  phases:[PhaseBinding,PhaseBinding]}
PhaseBinding={phase:"controller-build"|"replay",source_id:H,semantic_id:H,
 snapshot_sha256:H,lexlean_manifest_sha256:H,certificate_sha256:H,
 proof_compiler_sha256:H,lock_sha256:H}
```

Exact top keys are existing `/3` `acceptance_sha256,artifacts,build_id,exporter_owner,lexlean_attestation_sha256,model_sha256,processes,schema,scope` plus the four above. Existing exporter/owner/frontend/process unions are unchanged; phases ordered controller-build then replay. Execution is an in-process binding, **not** appended as a fictional child process in `processes`. Actual running executable is measured and equals external producer/A.verifier and the LexLean attestation's actual in-process executable digest. Each phase binds actual same I/source/semantic/lock/certificate and its complete manifest, and equals corresponding existing exporter-owner phase manifest/source artifact bindings. Sidecar appears in full generated/replay artifact arrays and phase owner arrays; certificate remains full LexLean output, not an invented `library/` path.

VerifyResult/1 attestation_id=SHA256(canonical /4 manifest), then acceptance/1+LexLean attestation/2 hashes. Existing complete audits/Lean/leanchecker/two exports/native tests remain mandatory; certificate substitutes for none. Historical /3 unchanged; ordinary readers refuse /4.

Derived reader API:

```
readConstructiveLibraryEvidence({authority:AdmittedAuthority,
 verifyResultBytes, evidence:HeldEvidenceOwner}) -> VerifiedCandidateEvidence
```

HeldEvidenceOwner provides bounded no-follow source/artifact/lock reads. Verify reader hashes before load, then external anchors/producers, VerifyResult→manifest→acceptance, build-inputs/I/A/P/snapshot/certificate and all original replay/audits. Retained producers must match without execution. T_D-only edits; resealing cannot override external expectations.

## 7. Independent bounded certificate reader (no Task1 export)

Implement a small JS module `scripts/library-constructive-certificate-reader.mjs` in T_D, invoked by the admitted reader; it imports only bounded canonical/schema/source helper code, never candidate Rust, synthesizer or emitter. API:

```
checkConstructiveCertificate({certificateBytes,snapshotBytes,manifestBytes,
 expected:{compilerVersion,compilerSemanticsId,sourceId,semanticId,
           snapshotRawSha256,manifestRawSha256,certificateRawSha256},
 project:BoundProjectInputs,budget:SharedReaderBudget}) -> {certificateSha256,rowCount}
```

Expected raw hashes are externally selected before reading tested bytes. In production, independently admitted owner constructs BoundProjectInputs and expectations from project authority plus verified VerifyResult/manifest chain. In a0/a1, the parent-held measured acquisition index supplies these anchors; tagged component result grants no source/SDK admission. Neither a certificate nor a snapshot may select its own expected hash. BoundProjectInputs supplies held selected config raw bytes+canonical TOML, canonical lock file bytes, source entries `{path,rawSha256,normalizedSha256,normalizedBytes}`, expected ordered module roster `{name,lean_module,source_path,origin?}`, and original compiler semantics/toolchain/lexicon closure authority. Raw source bytes are separately hash-checked before normalized bytes are made available. In a0 fixtures sources must already be strict UTF-8/NFC, LF-only with one final LF after actual fmt: raw=normalized; general production owner must perform original source normalization/validation, not assert raw=normalized.

Check raw snapshot/manifest/certificate SHA256 (including LF), exact source/map membership, normalized source length/hash against both snapshot source and full manifest source rows. Config input row binds **canonical TOML**, not raw config; lock row binds canonical lock file bytes. Recompute source_id using existing `lexlean-source-v1` recipe and path-sorted normalized sources, canonical project TOML and canonical lock file bytes. Recompute semantic_id from `{spec:"lexlean/linked-ir/1",modules:[snapshot module.linked_ir in module order]}` and snapshot.lexicon_closure using original no-LF canonical payloads and the original `lexlean-semantic-v1` frames, actual1.2 semantics/language/toolchain. Those old recipes are domain+NUL, then u32be(label bytes length)+label+u64be(payload length)+payload (`content_id.rs`), **not F**. Check full manifest compiler/source/semantic IDs and module roster; require its complete input/output inventory against owner (including lexicons/artifacts), then the fixed certificate output row. Safe path access alone is insufficient authentication.

**Actual membership/order (B1):** checked.modules is a BTreeMap; both snapshot and producer traverse bytewise logical module `name` order. Require strict unique order, equality to external roster/full manifest, and distinct lean_module names. For each semantic-module/2, use raw `module.semantic.declarations` order, never summary order. Build unique map from module.declarations summary.logical_id; for each raw declaration.name find exactly one summary, compare summary.linked_ir exactly to raw declaration, logical_id/lean_name to name, kind to raw.kind, and axiom_policy to the original rule (`none` when empty, `exact` otherwise; exact ordered axioms). Summary is sorted logical_id only as a representation requirement. Require no missing/duplicate/extra summaries for this purely semantic module. Require module.linked_ir.semantic equals raw semantic object and linked_ir's name/lean_module/imports/glossary/origin equal module fields. Original closed snapshot/schema/source validation remains required for nonsemantic modules; they add no constructive rows.

Effective sequence for each raw declaration: validated summary.elaboration.declarations in their array order if present (including legitimate empty array), otherwise singleton raw declaration. Never append elaboration.theorems/obligations/cross_checks/required_checks as declarations. Validate all elaboration metadata against original snapshot/semantic schemas and externally anchored snapshot; check referenced declaration identities; alpha IDs remain validated/anchored metadata under the unchanged source/alpha audit, not a new claimed alpha normalizer. Do not try to recover erased elaboration from raw semantic data alone or claim this helper reimplements linker elaboration correctness. Admission anchors the actual checked snapshot; checker verifies internal correspondence and exact proof membership.

Select from this effective sequence exactly theorem with proof.kind=linear_arithmetic and empty axioms (omitted Vec defaults mean empty only where original schema/DTO permits). Require no type parameters/definitions and all Nat parameters; unsupported selected shape fails, never disappears. Row module=module.lean_module, theorem=effective.name, source_sha256=module.source.sha256. Compare ordered parameters/full curried statement and original policy exactly, with schema-defined omitted defaults normalized exactly as original DTO serialization; no syntactic/numeric simplification. Unique ordered row sequence must match fully, not a sorted set. Namespace names are already checked effective names; no extra prefix heuristic. a0 includes source order opposite alphabetical order plus a real realization elaboration; mutating/removing its join must fail even if selected theorem rows are unchanged.

Independent interpreter follows registered certificate schema's exact current tags/subordinate keys; no extra theorem-name payload. Rebuild the source term prefix using left-before-right postorder interning, hypotheses in implication order then goal. Count every implication/atom/term occurrence toward1024 as actual Task1 input does; parameters32/hypotheses64. Reconstruct each term's32 coefficients+Nat128 constant; checked additions, coefficient<=4096, out-of-scope coefficients zero, sum(coefficients)+1<=4096. Interned terms unique; add children strictly earlier; terms<=16384. Compare exact source prefix, including unnormalized syntax.

Node array1..16384, prior references strictly backward. Rule equations operate on **exact term IDs**, not just equal normal forms:

* hyp=indexed original atom; refl_le/refl_eq same existing term; literal_le requires literal nodes and checked m<=n; weaken_lt changes relation only.
* trans_le/eq_trans require exact middle term ID and appropriate relation. add_le/add_lt_le require existing exact Add terms, with right premise le and left le/lt respectively. eq_symm swaps.
* normalize_eq only assoc `(a+b)+c = a+(b+c)`, comm `a+b=b+a`, zero_left/right, literal_add checked u128 sum, congr_add from two prior equality premises. Require every syntactic term exists in arena; do not infer equality from vectors alone.
* rewrite_side matches equality's left term to the entire chosen relation side, replaces by its right term; prior relation may le/lt/eq. cancel_lt requires both sides syntactically Add with exactly the same right term ID, yields left terms' lt. No generalized subtraction/cancellation from vectors.
* Compare each recomputed atom to claimed conclusion. Final node exists and equals original **exact goal atom**, not a weakened/equivalent replacement.

Recipe determinism stays compiler testing; never reuse private Artifact/Row/check.

### 7.1 Byte domains and exact shared budget (B3)

LexLean snapshot/2, build-manifest/1 and certificate/1 are restricted canonical **file** bytes: exactly one final LF; hash includes it. Inner LexLean content identity payloads exclude LF only where original recipe specifies. LexLean forbids null/floats and uses signed i64 integers (reader stores safe-number fields only; reject unsupported unsafe integer); Nat128 remains a string. Prism canonical records permit schema-defined null and have no final LF. Both sort keys by UTF-8 bytes, not JS UTF-16 order. Minimal string escapes: quote/backslash, \b/\f/\n/\r/\t, other controls lower-case \u00xx; all other Unicode scalars raw UTF-8, slash unescaped. Reject malformed UTF-8, lone surrogates, alternate unnecessary escapes, BOM, extra LF/CR/space. Cross-domain vectors: `{}` versus `{}\n`; value containing U+0001/backspace/quote/backslash/slash; raw é/emoji/U+2028; keys U+E000 and U+10000 (UTF-8 order differs from JS default); rejected escaped é, duplicate decoded keys (`a` and `\u0061`), null in LexLean, unsafe integer, malformed UTF-8. Literal vectors: empty Prism object hex7b7d, LexLean7b7d0a; U+0001 escape5c7530303031, é c3a9, U+1F600 f09f9880, U+2028 e280a8; key U+E000 ee8080 precedes U+10000 f0908080. Sort comparator is Buffer.compare(Buffer.from(a,"utf8"),Buffer.from(b,"utf8")); never Array.sort() default. a1 pins full vector bytes/hashes; actual Rust cross-serializer gate stays explicit, not an invented a0 test.

One caller-created, nonresettable budget per complete evidence read, including schema load and all rows. Constructor `new SharedReaderBudget({startedMonotonic,outerDeadline,outerRemainingBytes,outerRemainingWork})` computes deadline=min(outerDeadline,started+300s), bytes=min(outerRemainingBytes,64MiB), work=min(outerRemainingWork,67,108,864). Production outer owner supplies counters; fixtures may tighten but cannot increase constants. Immutable limits plus monotonically increasing used counters; no cloning/restart across modules or retry. All checked arithmetic fails closed.

Per input caps: certificate64MiB, snapshot64MiB, LexLean manifest16MiB, all schema bytes8MiB/64files, all normalized source/config/lock bytes64MiB; **aggregate64MiB includes all these**, hence individual maxima are not additive allowances. Reserve expected file length against per-file/aggregate before allocation/read; verify actual length no-follow; streamed reads debit before extending. Raw source bytes and separately materialized normalized copy both charge when both read; views over same held buffer do not charge duplicate storage. External expected hashes are not charged as file payload twice. Hash/canonical serializer emits in bounded chunks; never make an uncharged second full buffer. Decoded string/key storage separately capped at64MiB aggregate, charged by decoded UTF-8 length before growing. Serialized output shares original output cap and work/deadline.

Separate counters: lexicalTokens<=8,388,608 (each punctuation/key/string/number/bool/null lexeme one); jsonValues<=2,097,152 aggregate (container or primitive once; object key is not a value); memberSlots<=2,097,152 aggregate (each array element/object member one). Per document value ceilings: snapshot1,048,576, certificate1,048,576, manifest131,072, schemas262,144 aggregate; original smaller contract caps also apply. Charge slot before decoding next member/key or growing container, key/string bytes before decoder allocation, value before constructing it; duplicate keys consume slot/token/key budget then reject before map insertion. Containers charge value at opening; primitives charge one value; closing delimiters only lexical/work counters. No whole JSON.parse before this scan.

Original `contracts.rs::item_count` is an additional distinct counter: primitive=1; array/object=sum(child count)+number of member slots; containers themselves add zero, object keys add no separate item. Charge each slot when opened and each primitive when decoded; `/4` total<=65536 includes embedded A/P, matching original exactly. D/I/P/A/build-input caps in §1 use this same convention. Schema scan plus validation is iterative; local frozen `$ref` only, no remote/dynamic refs. Charge each instance/schema evaluation and ref/branch edge before pushing work; <=16,777,216 schema evaluations within shared work67,108,864. Ref traversal stack<=4096; detect nonprogressing reference cycle, reject unsupported schema keywords rather than ignore them. Schema registry freezes supported draft2020-12 subset actually used; full original validators remain later integration gate, not a bypass. Schema bytes cannot be trusted merely because certificate names their URI.

Instance depth<=1100; row count<=65536 and independently selected declaration count. Charge row/term/node before append, max16384 terms/nodes per theorem,32 parameters,64 hypotheses,1024 source occurrences; no per-row reset of aggregate counters. At most32 coefficient steps per operation; each step consumes work. Nat strings<=39 digits before BigInt; arithmetic checked<=2^128−1. Memoized leaf counts saturate4097 to avoid shared-DAG exponential expansion. Deadline before every read/row/schema entry and at least every256 lexical/arithmetic/work steps; no recursive parser/walker or unbounded regex. Any cap failure preserves component refusal, no fallback/new budget.

## 8. Smallest staged implementation and validation

Parent interface/Task1 review approval precedes code. Source463177a immutable; one disposable overlay, no full duplicate/cache/build/network now. `FixtureAuthority` is a separate nonproduction type/entrypoint tagged `local-unadmitted-component`. Its result is structural/component validation, never A or successful VerifyResult. Production admission cannot deserialize it.

0. Task2a0 first: after repaired Task1 independent PASS, actual bounded external API snapshot acquisition per task-2a0-snapshot-brief.md. No retained snapshot currently identified; no invented paths/hashes. Its completed measured index becomes a1 input.
1. Task2a1 JS canonical/framing/schema/certificate helper: consume only actual a0 indexed snapshot/certificate/manifest/source bytes; no compiler/Rust execution. Synthetic snapshots are negative/structural fixtures only, never real positive membership. Positive14-row and zero-row cases; every opcode, exact equality, forward references, source/binder/row membership, Nat overflow, unknown/duplicate keys, noncanonical JSON,4096/4097 leaves/shared DAG negatives. No dependency install or compiler execution.
The exact a1 owned root is `/workspace/diagnostic-tools/constructive-nat-task2a1/`: helpers `scripts/{bounded-json,reader-budget,closed-schema,source-bindings,library-constructive-certificate-reader}.mjs`; `tests/{canonical,budget,membership,certificate}.test.mjs`; `fixtures/{input-index.json,synthetic-negatives.json}`; `evidence/{commands.json,result.json}`. Helpers import only node:assert/strict, node:crypto, node:fs, node:path, node:perf_hooks and these local helpers; tests add node:test. Frozen copied schemas: `schemas/{constructive-nat-certificate,semantic-snapshot-v2,semantic-module-v2,build-manifest}.schema.json` from measured candidate, resolved refs locally. input-index pins a0 actual files; no copies of caches/packages/binaries. New production D/A/P/4 schemas and general reader dispatch remain later slices; a1 does not claim final contract registration. All mutable synthetic fixtures are tagged local-unadmitted-component and excluded from real-positive anchors.
2. Authority/DTO/worker/schema propagation: explicit selection/native profile at every reload, canonical original DTO bridge, public error mapping, new schemas/registrations, sidecar in replay. Small authority fixtures prove only refusal/structural behavior. Test independently coherent wrong D/T_D/producer/semantics/lock/phase data against held external expectations.
3. Preparation owner and retained reader: actual process algorithm, fixture sequence/error tests, tagged installed-sdk/bootstrap authority, original /3 compatibility with independently held original reader and /4 refusal by ordinary reader. Rust/JS hash vectors must eventually match actual compiled Rust, not just hand predictions.
4. Real Rust compilation/Controller/model-worker/facade/preparation/build+verify, complete22-alias materialization/custody, SDK/two exports/root VV/package API/corpus remain explicit **uncompleted gates** until resource/admission allows them. No mocked or schema result closes them. Final B/T_B→P/T_D→D→R→committed C/acquisition is Task3; SDK Task4.

Earlier free disk8,986,198,016; floor8,589,934,592 left396,263,424 (~378MiB); not a current reservation. Task2a1 source/tests/log growth<=32MiB, pre/post disk checks, no Rust. Separately proposed a0<=128MiB temporary growth/8GiB floor/2GiB combined process RSS/<=180s offline link is not execution authorization; current measurements must be refreshed. Existing Task1 ceiling remains closed; no cache deletion or hardlinked source copies. Do not delete original/Task1 artifacts. Before Rust, identify compatible cache provenance and conservative peak growth; otherwise defer to separately bounded/hosted execution. Source-only/JS results cannot claim Rust integration.

Derived registrations: contracts.rs, real schemas/ and model/contracts.toml, model allowlists/tables; code/error/conformance changes only T_D. Use existing PP9001 authority/config, PP4004 malformed contracts, PP5401 stale lock, PP5008 verification with preserved causes until a new code is expressly registered. Task brief must enumerate exact paths/exclusive host slot.

## 9. Remaining gates

Parent provisionally accepts preparation owner/sidecar/external authority. Rereview a0 brief plus B1–B3 changes before implementation. Task1 repaired PASS, exclusive slot and successful actual a0 indexed outputs precede a1. Task3 custody/producer subformats remain unspecified: no production A emission/admission. No execution approval.
