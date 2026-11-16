# Verdant AQM integration assessment

Research date: 2026-11-16. Status: investigation; **no AQM code is enabled in the game**.

Source: [afflom/verdant-aqm](https://github.com/afflom/verdant-aqm/tree/4478ca42eca5124c46f89b78abdf042fae0d98eb), commit `4478ca42eca5124c46f89b78abdf042fae0d98eb`. [Public demo](https://afflom.github.io/verdant-aqm/). Game baseline: `8a26b962f2363f4d08976146577f61fbd9474dc1`.

AQM supplies useful classical Wasm kernels and quantum-state simulation/presentation experiments. Its current API does not replace Verdant's scene, collision, character or audio interface. Its renderer uses Three/WebGL2 and a CPU triangle fallback; no WebGPU acceleration was found. There is no demonstrated general FPS, graphics-quality, bot-intelligence or autonomous-development improvement from importing it wholesale.

The first **navigation cache experiment is complete**: AQM produced correct routes on the tested subgraph but did not meet the performance promotion gate against ordinary caches. Keep it as research evidence; do not add its runtime to the game on this result. Preserve the existing Three renderer, Verdant simulation, compiled Prism decisions and signed Stitch discovery. Import only a component that passes its own correctness, cost and provenance gates.

## What is reusable

| Component | Actual behavior | Potential game use |
| --- | --- | --- |
| `wasm_tropical_minplus_closure` | Signed-i32 Floyd–Warshall all-pairs paths, distance and next-hop matrices; wrapper selects Wasm for at most 128 nodes | Small fixed navigation graph cache or independent offline oracle |
| `wasm_symplectic_commute` | AND/XOR plus `i64.popcnt`, then parity over packed F₂ vectors | Future binary constraints with exactly those semantics; not an IEEE multiplication replacement |
| `wasm_coded_packed4_gemv` | Nibbles select signed-i32 codebook weights; actual `i64.mul`/`i64.add` accumulate signed-i64 results | Bounded, deliberately authored bot feature scoring; no tactical model currently supplied |
| Sparse cyclotomic simulator | BigInt coefficients in Z[ζ₈] and sparse state maps | Optional small precomputed presentation experiments; general state size can grow exponentially |
| Software rasterizer | CPU flat-triangle shading into Canvas2D, separate from Three | Separate fallback research; missing features and cost prevent a direct game-renderer replacement |
| Sonification | Web Audio oscillators, panning and envelopes | Optional presentation idea implemented through the game's existing audio bus and voice budget |

The real Wasm compute exports are distinct from `holo_run`: the latter intentionally handles a finite table of 26 diagnostic requests. Replaying that table checks those finite behaviors, not arbitrary circuit correctness.

Source entry points at the pinned revision:

- [Wasm kernels, assembler and typed wrappers](https://github.com/afflom/verdant-aqm/blob/4478ca42eca5124c46f89b78abdf042fae0d98eb/src/aqm/holoGuest.ts).
- [Graph wrapper](https://github.com/afflom/verdant-aqm/blob/4478ca42eca5124c46f89b78abdf042fae0d98eb/src/aqm/tropical.ts), [MPS simulator](https://github.com/afflom/verdant-aqm/blob/4478ca42eca5124c46f89b78abdf042fae0d98eb/src/aqm/mps.ts), [sparse simulator](https://github.com/afflom/verdant-aqm/blob/4478ca42eca5124c46f89b78abdf042fae0d98eb/src/aqm/cyclotomic.ts).
- [Viewport](https://github.com/afflom/verdant-aqm/blob/4478ca42eca5124c46f89b78abdf042fae0d98eb/src/components/QuantumViewport3D.tsx), [software rasterizer](https://github.com/afflom/verdant-aqm/blob/4478ca42eca5124c46f89b78abdf042fae0d98eb/src/aqm/tileRasterizer.ts).
- [Archive builder](https://github.com/afflom/verdant-aqm/blob/4478ca42eca5124c46f89b78abdf042fae0d98eb/ci/kappa-cache.ts), [Pages workflow](https://github.com/afflom/verdant-aqm/blob/4478ca42eca5124c46f89b78abdf042fae0d98eb/.github/workflows/pages.yml).

## Reproduced evidence

The existing upstream Node suite passed 10/10. The separate [research probe](../../scripts/research/aqm-kernel-probe.ts) checks the actual generic compute exports against independent references:

- 128 symplectic cases against bit-clearing parity.
- 128 bounded multirow GEMVs against BigInt dot products.
- 48 directed/disconnected weighted graphs, 4,488 ordered pairs, against repeated Bellman–Ford and next-hop witnesses.
- Known malformed-input, overflow and MPS counterexamples below.

All valid bounded comparisons passed. The guest is 3,276 bytes with 262,144 bytes initial memory. These are empirical checks of this source revision, not a proof over all inputs or a full frontend/Lean/Rust build. The probe deliberately asserts the known defects as well: a passing research probe **does not mean these components are production-safe**. Results and runtime identity are retained in [aqm/kernel-probe.json](aqm/kernel-probe.json).

Reproduce using the game's installed dependencies and a separate clean checkout; no AQM dependency installation is needed:

```sh
git clone https://github.com/afflom/verdant-aqm.git /tmp/verdant-aqm-review
git -C /tmp/verdant-aqm-review checkout --detach 4478ca42eca5124c46f89b78abdf042fae0d98eb
node_modules/.bin/tsx scripts/research/aqm-kernel-probe.ts /tmp/verdant-aqm-review
```

The probe refuses a different revision or dirty checkout. For upstream tests, run the game's absolute `node_modules/.bin/tsx` path with `--test src/aqm/aqm.test.ts` from that checkout. No upstream patches or PRs have been made for this assessment.

### Actual game navigation experiment

The shipped engine constructed a graph of **452 nodes and 1,261 undirected collision-checked edges**. The experiment selected a deterministic connected 64-node induced subgraph with 185 edges. Current BFS, repeated-BFS caching, AQM Wasm min-plus and scratch JS min-plus all passed **4,096 ordered-pair distance and route-witness checks** against independent Bellman–Ford. AQM chose a different equally short route for four pairs. This establishes equivalence within the selected subgraph, not equivalence to full-map routing through omitted nodes.

The workload simulates 10 bots choosing seeded source/target nodes every 1–2 seconds for ten minutes: **4,005 queries executed without wall-clock waiting**. Timings include cache construction, nearest-node scans and path reconstruction, following four warmups and 20 rotated-order trials. These are whole-batch CPU times, not individual query latency or frame rates.

| Algorithm | Median total, earlier run | Median total, retained final probe |
| --- | ---: | ---: |
| Current BFS | 19.354 ms | 18.865 ms |
| Repeated-BFS cache | 7.278 ms | 7.179 ms |
| AQM Wasm cache | 7.404 ms | 7.364 ms |
| JS min-plus cache | 7.382 ms | 7.225 ms |

Both runs used Node 24.22.1 on a shared Linux x64 environment reporting AMD EPYC 9V74, not a physical-device browser benchmark. Cache gains over current BFS amount to only about 12 ms across this simulated ten-minute subgraph workload. AQM did not beat the best ordinary cache, much less the proposed 20% margin. Cold loading/assembly/compilation costs are recorded separately and make a new runtime import still harder to justify. No FPS gain is established.

Retained evidence: [final raw trials, graph, source bindings and cold costs](aqm/navigation-benchmark.json), [earlier raw run](aqm/navigation-benchmark-prior.json). The [portable benchmark](../../scripts/research/aqm-navigation-benchmark.mts) verifies all seven game input files against the recorded baseline, checks clean pinned AQM before and after, and records its own source digest and guest digest. The earlier script had the same algorithms and checks; the retained script adds explicit TypeScript annotations and those two digest fields.

```sh
node_modules/.bin/tsx scripts/research/aqm-navigation-benchmark.mts . /tmp/verdant-aqm-review /tmp/aqm-navigation.json
```

The full graph exceeds AQM's 128-node Wasm wrapper limit. Future navigation work should first evaluate a full-graph ordinary cache or a deliberately designed hierarchical graph against real bot traces. AQM remains useful as a separate algorithmic oracle, rather than an enabled game dependency.

## Issue register and required repair evidence

All entries remain open. A source-level fix alone does not close an entry; its boundary and negative tests must pass against the actual produced artifact.

| ID | Finding | Required repair/acceptance |
| --- | --- | --- |
| AQM-01 | Unequal symplectic buffers, short GEMV activations and short closure matrices were accepted without refusal | Exact buffer-shape checks, bounded integer dimensions, safe byte products and explicit errors before touching Wasm memory; malformed and boundary tests |
| AQM-02 | Two full-i32 GEMV products with mathematical sum `2^63` returned `-2^63` | Enforce `K·maxAbsActivation·maxAbsWeight ≤ 2^63−1` or checked accumulation; validate grid length 16 and `K = 2·packedCols`; test extremal signed values |
| AQM-03 | The 64–256 KiB bump arena wraps; generic wrappers lack a complete allocation/admission contract | Per-operation capacity checks, serialized non-reentrant calls or isolated workers, owned outputs, repeated-call/aliasing tests; never retain scratch views |
| AQM-04 | Two-qubit MPS with bond cap 1 and H+CNOT returned a product state instead of a Bell state | Detect excess rank and refuse, or expose explicitly approximate output/error; verify rank-limited factorization preserves all rows before calling it exact |
| AQM-05 | Archive production directly assembles Wasm from TypeScript; current Pages workflow does not invoke LexLean/Lean/PrismPM compilation | A separately pinned source/target path with actual compiler/kernel checking and production-artifact parity, or label the sidecar empirical; never reuse existing game proof claims |
| AQM-06 | AQM's journal stores caller-supplied identity/signature fields but only checks reconstructed payload hashes | Keep existing game Stitch signature/host-pinning policy; verify signatures, canonical payload and bounds before any future journal transport integration |
| AQM-07 | First game-subgraph benchmark failed the performance gate; actual full graph has 452 nodes | No runtime promotion from these results; a future full-graph or hierarchical experiment needs its own workload, correctness and cost evidence |
| AQM-08 | Apache-2.0 declarations exist, but no tracked root LICENSE/NOTICE was found | Record selected-source provenance and applicable copyright/notice scope; include full license and required notices with any distribution |

For AQM-04 the reproduced output has both qubit probabilities `p1=0`, purity `1`, bond rank `1`. A Bell state requires `p1=0.5`, purity `0.5`, bond rank `2`. This is a concrete counterexample to unrestricted exactness at that cap, not a claim that every MPS operation fails.

Additional scope limits: the Atlas representation uses two 96-element Float64 arrays (1,536 bytes before other state), not a general arbitrary-qubit statevector. Its displayed purity and cursor-based measurement have model-specific semantics. The Rust reference uses i128/u128; it is not the source of the browser's hand-emitted kernel ABI. The SLM module has fixed keyword/template scoring, not a trained tactical bot or autonomous code writer. None of these become verified game systems merely by packaging them in `.holo`.

## Integration plan and promotion gates

### 1. Preserve source and establish a game-specific cost baseline (first experiment complete)

Pin AQM separately from `afflom/verdant-engine`. Use a collision-checked induced subgraph of at most 64 nodes from `BotNavigator`, with unit-cost edges. Compare reachable sets within that subgraph; an induced subset does not preserve full-map routes. Compare every ordered pair's distance and route validity; equal-cost routes need not have identical tie-breaking unless deliberately specified. Include self and disconnected paths. Compare current BFS, repeated-BFS precomputation, JS min-plus and actual Wasm min-plus.

Measure cold compilation, initialization, copies, execution, nearest-node search, route reconstruction, p50/p95 total workload batch time and retained memory. Per-query timers would distort this small workload; individual query latency needs a separate methodology. Report the full graph size and subset selection. A seeded ten-minute/ten-bot workload at the game's replanning cadence is a simulation, not an observed match trace. A cache comparison must include its precompute cost and invalidation rules.

**Promotion gate:** zero correctness mismatches or invalid routes, no memory growth/aliasing, all applicable input guards, and at least 20% lower end-to-end amortized CPU time than the best current/cache baseline in a repeated named-environment measurement. The first experiment did not achieve the performance gate; guard repairs are also still open. Retain the offline research result and do not ship unused kernels. Any later workload requires a new evaluation.

### 2. Establish the bounded LexLean/PrismPM contract

For any winning path kernel, specify `1 ≤ n ≤ 64`, exact `n²` array lengths, zero diagonal, nonnegative finite weights, consistent unreachable sentinel/next-hop values, and finite paths below sentinel `1,000,000`. Bound all sums, indexes, allocations and reconstruction steps. Do not mix the Rust reference's different sentinel `2^20` into this contract.

Repair and validate the supported compiler/export path before claiming compiled correctness. Compare the actual guest with independent graph references and native/Wasm/browser execution. Keep source preservation, mathematical bounds, test coverage and measured performance as separate evidence. The current [numeric/export tracker](NUMERIC-EXPORT-TRACKER.md) remains authoritative for unresolved compiler/numeric work; AQM's XOR/popcount does not close IEEE export or rounding questions.

### 3. Integrate behind a reversible host-owned policy

Only the authoritative host chooses bot routes and objective decisions. Bind any cache to map/collision/graph/algorithm identities, invalidate it on those changes, and preserve the existing BFS fallback with visible diagnostic counters. Test bot route completion, stuck rate, bomb-objective completion and team symmetry. Then register the candidate with the existing evolution evaluation, including workload, acceptance threshold and rollback evidence. AQM itself supplies no continuous game-improvement mechanism.

Keep root `app.holo`, identity/round/evolution guests, Stitch transport and their admission rules intact. A new artifact needs its own name, hashes, proof scope and provenance. Add artifact verification and CI checks before production activation, then exercise the existing browser/Pages gates.

### 4. Evaluate graphics and sound independently

Use the existing Three scene and `GameAudio` for any selected presentation ideas. AQM's static CPU raster demo does not establish better FPS rendering: clipping, textures, animation, shadows and continuous-frame costs require separate work. Do not import its React application, second Three lifecycle or standalone AudioContext into the game.

Prioritize map materials, weapon presentation, readability and objective sounds using measured budgets and gameplay review. An optional small quantum-state motif is possible but is an aesthetic feature, not a graphics acceleration. Any audio addition must respect master volume, existing voice limits, node disposal and bomb/gunshot audibility.

## Current result

AQM is suitable for component-level experiments after repairing the relevant guards and establishing game-specific value. No production dependency, renderer, gameplay policy, proof artifact or Pages release was changed by this investigation. Compiler repair and renderer integration already underway continue independently; upstream PRs remain deferred until the game work is ready.
