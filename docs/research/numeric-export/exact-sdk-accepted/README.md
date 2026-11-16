# Exact-SDK acceptance — 2026-11-16

[Run 43924585630](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43924585630) completed successfully. Both the unchanged upstream baseline and the reviewed cumulative candidate passed full unchanged `just vv` on amd64. The candidate also passed the separate production primitive experiment. No native arm64 validation, upstream merge/release, complete IEEE implementation or game compiler upgrade is claimed.

## Source custody

- Game workflow revision: `b7232d553e038ad89dd3ea4999d16ddbfa7df7f1`.
- Upstream base: `b04af3550bb49c4e5bfdc0747a1e50cd58f13b81`.
- Reviewed candidate: `0e3472ed1ff2f3fda1d010929c4f323a05576c09`.
- Candidate tree: `aa5082efb83d6fd38275d00aec404929fbe34d9c`.
- Cumulative patch SHA256: `05a866911f5c6386ccf6665cb178471e039cae6a2da1b84a27033491affa33e3`.
- SDK: `ghcr.io/afflom/prismpm-sdk-patched@sha256:c1bfe8d5d3b3473a2c2ca6fdd417158a3e9f5fff3b24dcbf587fe21d6fd9b635`.

The runner applied the mailbox as local commit `470746c3831db4ff1c0688230c630767e150d4eb`; its tree equals the reviewed tree. The downloaded receipts were checked against the complete [manifest](../validation-manifest.json), not only its short commit label.

## Retained evidence

- [Baseline receipt](baseline-receipt.json) and [full log](baseline-gate.log): job133500546943, exit0.
- [Candidate receipt](receipt.json) and [full log](gate.log): job133500547595, exit0. The earlier stale-register failure remains in [first-run evidence](../register-repair/first-exact-sdk/).
- [Original bootstrap run block](bootstrap-run.sh): unchanged upstream command.
- [Primitive receipt](primitive-receipt.json), [log](primitive.log), [output hashes](primitive-output-hashes.json) and [retrieved Wasm replay](retrieved-wasm-replay.log).

The primitive is the exact inner Nat significand multiplication, not `floatMul` as a complete IEEE operation. It exported one package, result `c6b0193f05f6a07daf96d5af524bd0dad10d38ba5e92f35e9e7832078a59a009`. Binding replay succeeded; its own log explicitly says it did **not** repeat axiom audit, Lean elaboration, leanchecker replay or named-root extraction. Native and import-free Wasm return checked overflow for `2^52 × 2^52` and maximal binary64 significands. Zero, `u64::MAX × 1` and `2^23 × 2^23` return their exact expected values. The downloaded Wasm was separately replayed using the reviewed fixture.

## Artifact retention limits

GitHub artifact14258117814 is the baseline archive, 12,718bytes, verified SHA256 `91dc820dd663229687b3389a3f4c7090b3a1ff396a31b8238b240e163a9a5d58`.

Artifact14258401067 is the candidate archive, 496,885,564bytes; GitHub reports SHA256 `b50a1ae74402707ba067cd6c79cb8fc6a185bbc7a28af65aaa9815b168ee184c`. Only selected entries were downloaded using checked HTTP ranges and ZIP CRC verification; the full large archive digest was not independently recomputed. Most of its size is the ephemeral SDK Cargo cache. The original upload action omitted hidden files, including the `.lexlean/production` package directory. The logged build/replay results and actual compiled outputs survive, but this archive cannot independently replay that missing package. The upload rule is corrected for subsequent runs; the historical archive is not relabeled as complete.

All12 surviving probe files (native/Wasm outputs, rlibs, fixture, request, lock and target descriptor) are preserved in the supplemental `cs1618-numeric-acceptance-2026-11-16.zip` asset on [release v0.9.0](https://github.com/R4-Laboratories/uor-cs1.618/releases/tag/v0.9.0), together with these receipts and hashes. This is separate compiler investigation evidence; it does not change the release's game binaries.
