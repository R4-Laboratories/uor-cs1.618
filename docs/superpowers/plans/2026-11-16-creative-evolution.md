# Creative Evolution Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation and one final fresh review.

**Goal:** Extend the GitHub evolution loop with authored procedural artwork and bot tactics, and deploy it.
**Architecture:** Typed creative programs → deterministic TypeScript compiler → seeded/model proposal sources → independent family evaluators → existing Prism admission/full game gates → restricted publication/Pages. A browser studio exposes the generated content and evidence.
**Tech Stack:** TypeScript, Canvas/Three.js, Verdant/Prism Wasm, Playwright, GitHub Actions/Models.
**Spec:** docs/superpowers/specs/2026-11-16-creative-evolution-design.md

## Global Constraints
- Keep protocol, weapon balance, collision, economy and victory rules authoritative and unchanged.
- No arbitrary model code execution, URLs, imports or credential delivery to the browser.
- At most 12 tactical rules, depth 4 and 64 nodes; bounded shapes and four fixed wall panels.
- Compare candidate and incumbent on training/held-out scenarios; no universal intelligence/beauty/FPS claims.
- Preserve prior history hashes and tested-output publication custody.

## Review Focus
- Malformed/oversized/model-injected programs reject before source generation.
- Objective interaction under visible threat must reach actual Match use/defusal, not just pass a policy truth table.
- Artwork must not change collision or obstruct existing labels; disabled/failing art restores a usable scene.
- Generated program identity must match what evaluation and publication actually use.
- Model unavailability, stale candidates and finite search exhaustion must be visible and never bypass gates.

### Task 1: Program compiler and authors
Files: shared/creative-program.ts; scripts/evolution/creative-author.ts; tests/creative.test.ts; model/evolution/brief.json.
Interfaces: validateArt/validateTactics; synthesizeArt(seed)/synthesizeTactics(seed); compileArt/compileTactics; authorProposals(state,brief).
- [ ] Write rejection/determinism/novelty/compiler parity tests; run and observe failure.
- [ ] Implement bounded typed grammars, source compiler and seeded proposal generation; test malformed provider data with an injected fetch and no network.
- [ ] Implement GitHub Models proposal adapter with recorded fallback and fixed endpoint; test failure/timeout/invalid-response paths.
- [ ] Run creative tests; commit.

### Task 2: Runtime art and tactics
Files: src/creative/artwork.ts; src/world.ts; server/match.ts; shared/generated-{artwork,tactics}.ts; src/ui.ts/main.ts.
Interfaces: paintArtwork(ctx,site,program); ArtworkLayer.apply/setEnabled; BotFacts → TacticAction; Match optional TacticDecider for evaluation.
- [ ] Add tests for actual emergency defusal/plant/reload and no hidden-enemy facts; observe old behavior fail where appropriate.
- [ ] Render four generated wall murals, preserve objective labels; add local artwork toggle and failure fallback.
- [ ] Apply generated tactic decisions through existing authoritative inputs and paths; keep baseline fallback for empty programs.
- [ ] Run real Wasm and creative regression tests; commit.

### Task 3: Evaluation, search and publication
Files: scripts/evolution/{generate,policy,state,tick,measure-creative}.ts; model/evolution/{policy,state}.json; workflow template.
Interfaces: Configuration art/tactics programs; Family extended; measureCreative(candidate,incumbent,policy): Evidence.
- [ ] Test state migration, generated-source drift, creative frontiers and expanded publication custody.
- [ ] Implement deterministic scenario corpus and real Match checks; reject regressing/no-op candidate, keep held-out non-regression separate from training benefit.
- [ ] Implement browser art render/coverage/contrast/inventory checks and screenshot evidence; inspect the actual screenshots.
- [ ] Integrate source identity, generic family history, bounded proposal queue and optional author step into hourly workflow.
- [ ] Run verification plus local complete tick preview; commit.

### Task 4: Public studio, verification and deployment
Files: evolution-studio.html; src/creative/studio.ts/css; vite.config.ts; README/docs/evidence.
- [ ] Build public studio with admitted art/tactics/evidence and baseline toggle; test in real Chromium.
- [ ] Update plan, proof scope, authorship/metrics limits, API fallback and operator controls.
- [ ] Run full tests/build/artifact/browser/WebRTC gates and fresh read-only code review; fix material findings.
- [ ] Publish main, run actual GitHub creative ticks, inspect live generation/build identity and public multiplayer; publish release/evidence.
