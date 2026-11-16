# Free development engine

The default engine needs no model subscription, paid inference key or pretrained language model. GitHub Actions supplies the runner; the repository supplies typed source compilers, finite candidate inventories, tests and acceptance contracts. GitHub's normal hosting/Actions policies still apply. Optional GitHub Models authorship runs only when the repository variable `CS_AI_AUTHOR=on` is explicitly set.

## What now writes new code

The consecutive `Autonomous game evolution` workflow constructs art, bot tactics, navigation, render batching and experience candidates. `shared/experience.ts` compiles the experience model into `shared/generated-experience.ts`: executable burst-recovery, voice-admission and render-control functions used by the real game. Candidate recipes change one or two typed decisions at a time. The engine measures them, runs every game/browser/WebRTC gate, asks the actual compiled Prism admission kernel to decide, commits only the hash-bound generated files, and explicitly redeploys Pages.

The experience family adds original, learnable spray patterns, movement/crouch accuracy, bounded weapon-specific procedural audio, and adaptive resolution. The templates and primitives were implemented in this development session; subsequent generated variants are authored by the deterministic compiler. They are not described as LLM-written features. No copied Counter-Strike assets, maps or source code are used.

`model/development/backlog.json` is the expansion frontier. `implemented` means an executable component exists. `needs-recipe` means the next capability needs a compiler primitive and independent acceptance cases. `needs-design` identifies a boundary such as authority migration or historical hit validation that cannot be supplied by adjusting an existing recipe.

## How to add the next feature

1. Specify an observable player outcome and its limits: for example, a smoke grenade blocks sight for a bounded time but never changes map collision.
2. Implement a reusable primitive and typed recipe. Add model-level contracts where state transitions can be expressed in LexLean. Keep damage, purchases and objectives in the authoritative host.
3. Supply independent regression cases, negative cases, browser evidence and performance/resource budgets. Keep these checks outside generated files.
4. Extend the compiler and finite candidate inventory. The existing scheduler explores variants, remembers failed attempts, adjusts bounded strategy weights, records accepted source hashes and redeploys automatically.
5. Add player playtests before calling a change more enjoyable or competitively balanced. Numerical proxies alone cannot establish that.

Near-term priorities are utility grenades, latency-aware hit validation, richer weapon animations, original maps, reconnect/host migration, and training/onboarding. Each has explicit acceptance obligations in the frontier. These are future capabilities, not features being silently promised as already present.

## Discovery, Rule30 and R4

The pinned [source catalogue](../model/development/sources.json) records inspected commits and purposes. The weekly `Free development source discovery` workflow checks their current commit IDs and retains a report. Discovery uses authenticated GitHub CLI requests and records how many repositories were actually checked. Any unavailable or malformed response fails the workflow after preserving its evidence; a green run requires every catalogue entry to resolve. A changed upstream is a review opportunity, never executable instructions. This metadata watcher does not itself port arbitrary upstream code.

- [Rule30](https://github.com/Casey-allard/rule30): bounded discovery/deduction, templates, certified decisions, attempt identity, gate reservation and honest settlement. Its engine explicitly settles when its finite applicable templates are exhausted.
- [LexLean-R4](https://github.com/Casey-allard/lexlean-r4): the newer Casey-allard fork contains `VerdantSynthesis.lex.tex` and `xtask/src/synthesis.rs`. Two actual semantic definitions—`updateBanditWeight` and `admitParetoSynthesisTick`—are imported at a pinned commit, with their source hash and upstream licenses. A restricted compiler emits `shared/r4-synthesis.generated.ts`; the development engine calls these functions for bounded learning and experience admission. Independent tests cover 180 verdict cases and all 16 bounded weight updates. This is semantic-definition reuse, not a claim that the full upstream research model or a coding LLM is running.
- [UOR-R4](https://github.com/R4-Laboratories/uor-r4): a research model. Its inspected README says no useful conversation model is qualified and places coding at milestone M6. It is not currently a justified replacement code-writing model for this game.
- [CorvusWing](https://github.com/R4-Laboratories/CorvusWing): scoped changes, recoverable history, falsifiers and evidence tied to actual files.

The experience evaluator records the discrete interaction `L(A+B)-L(A)-L(B)+L(base)` from four evaluations. This can expose whether two recipe changes interact. It is not a claim that Rule30 supplies a Hessian optimizer or that this game has a differentiable quality objective. The identified upstream mechanism is named Hebbian/Pareto synthesis. Searches of both forks' source and engine code did not find a mechanism named Hessian. The exact imported definitions and the separate mixed-difference measurement are recorded distinctly.

## What is proved and what is measured

- Round and admission behavior use real compiled Prism Wasm. All 288 finite round inputs and all 16 admission input combinations have parity tests. Runtime artifacts and upstream pins are hash checked.
- Every experience promotion runs fixed training and held-out frame traces, burst timing checks, and voice bounds. The loss combines delayed burst resets, squared-resolution work under synthetic overload, and voice high-water count. It is an explicit engineering preference, not measured GPU speed, sound fidelity or player fun. Each protected measured axis must also stay non-regressing; an aggregate win cannot hide a worse burst-recovery or resource result. The imported R4 model additionally refuses defects, score regression and generated-source complexity growth. Pair interaction measurements are recorded separately.
- Real Chromium tests render audio into `OfflineAudioContext`, measure peak/energy/direction/occlusion, stress real voice cleanup, test render modes and persistence, then run ordinary rendered gameplay and two-client WebRTC tests.
- The original SDK verifier had a `PP5004` regeneration-closure defect. The explicit upstream repair is now built reproducibly from that SDK’s locked source; see [proof repair](proof-audit.md). The new `LexLean and Prism proof audit` runs all three formal applications on relevant pushes, weekly and on demand, retains each verifier's real result, and fails when verification fails. No `continue-on-error` or fabricated success receipt is used. This audit is separate from deployment's finite runtime/browser checks; deployment does not imply full formal verification.

The SDK lock names SDK 0.3.0, whose inventory contains PrismPM/LexLean binaries 0.4.0. Inspected upstream PrismPM source is 0.5.0 and contains a replay fix preserving `design/` and `oscal/` projections. The round build contains four `design/` projections. This was confirmed as the regeneration defect. The narrowly pinned upstream repair preserves separately attested projections while retaining exact file-set and byte comparisons; its negative mutation test is mandatory. The SDK inventory remains unchanged and the repaired verifier is reported separately.

## Limits and controls

The frontier is finite. Once it settles, repeated scheduling does not invent new primitives. Adding a new tested recipe, acceptance corpus or model opens new work. There is no guarantee of perpetual improvement or parity with a modern commercial game.

`CS_EVOLUTION=off` stops autonomous publication. Run `npm run evolution:tick -- --family=experience` for a reversible preview, or dispatch the workflow with family `experience` on official main. `CS_AI_AUTHOR` defaults off. A malformed model response is still rejected if that optional path is enabled. Human source changes are never silently rebased by the publisher, and generated code cannot edit its own tests, workflow, SDK pins or admission kernel.
