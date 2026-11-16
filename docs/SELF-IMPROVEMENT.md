# GitHub-hosted game evolution

cs1.618 uses a bounded source-rewriting loop inspired by [Verdant Resonance](https://github.com/afflom/verdant-resonance/tree/533131e2cdf718d0c9c908866cd0829cf48bd14e) and [LexLean-R4](https://github.com/Casey-allard/lexlean-r4/tree/f1cd751e12a60cafc2a61599cbbb15034941ba10). GitHub Actions evaluates candidates; GitHub stores accepted source and evidence; Pages serves the resulting game. Seeded synthesis requires no model endpoint or API key. Optional GitHub Models authorship uses a workflow token subject to repository access and quota; no compute runs on Pages itself.

## Creative authoring in v0.4.0

The loop now also authors original procedural murals and bot decision programs, with seeded synthesis and an optional GitHub Models adapter. [Creative architecture, evaluation, limitations and controls](CREATIVE-EVOLUTION.md) · [Public evolution studio](https://r4-laboratories.github.io/uor-cs1.618/evolution-studio.html).

## What can improve

The original optimization search rewrites two TypeScript modules from a versioned model; creative authoring adds the two modules described above:

- `src/generated/render-policy.ts`: spatial batching of identical opaque scenery into instanced draws. The search varies cell size and minimum group size. Players, weapons and other dynamic objects stay separate.
- `shared/generated-navigation.ts`: replace exhaustive node-pair enumeration with spatial buckets. Exact ordered graph equivalence preserves the bot routes, while fewer candidate pairs reduce navigation construction work.

These optimization families now sit alongside authored mural and tactical programs. The system does not autonomously design new maps or arbitrary gameplay. Graphics admission measures draw work and visual preservation, **not artistic quality or a guaranteed FPS increase**. Navigation admission improves graph construction, not bot tactical intelligence. Adding a new family requires a human-reviewed generator, independent evaluator and falsifiers. The loop cannot edit its own evaluators, tests, workflow, policy or admission Wasm.

## Admission and publication

1. An hourly Actions tick (minute 17 UTC; GitHub scheduling can be delayed) evaluates at most two untried candidates. Successful families gain a bounded search weight; rejected families lose weight. At most one generation is admitted per tick.
2. Navigation compares the entire ordered graph against independent all-pairs enumeration using real Verdant Wasm, plus 480 path samples. Rendering compares four fixed views with the unbatched scene, checks a complete geometry/material/transform inventory, and bounds the triangle increase. Pixel limits and minimum benefit are in `model/evolution/policy.json`.
3. Rendering work is explicitly a proxy: sum of `100 × draw calls + triangles` over the camera corpus. Frame-time samples are recorded for inspection but are too noisy on CI software graphics to justify an FPS claim. At least 2% work reduction relative to the incumbent is required.
4. Full game verification, rendered gameplay, real WebRTC multiplayer and creative studio/layer tests must pass. A separate **compiled Prism admission Wasm** admits only when fidelity, benefit, resource bounds and checks all pass; all 16 combinations are exhaustively tested. This policy does not prove that the host measurements are correct or formally verify the entire game.
5. A hash-bound publisher commits only six owned files: generated render/navigation/artwork/tactics modules, `model/evolution/state.json`, and `public/evolution.json`. It checks source identity, exact output hashes and evidence age. A racing main update fails publication; it never force-pushes or rebases untested output.
6. After a successful push, the engine explicitly dispatches `pages.yml`. GitHub does not normally trigger another push workflow from a `GITHUB_TOKEN` commit, so this dispatch is essential. Pages independently repeats game gates before deployment. Superseded builds skip deployment.
7. The deployment watcher compares the live `build.json` commit with main. It can dispatch a missing deployment and retry a deploy-only failure once. Failed game checks block publication; they are not bypassed. It writes workflow summaries, not unsolicited issues or comments.

The bounded candidate frontier eventually **settles**. Settled ticks make no commits and claim no improvement. A source/policy context change opens a new frontier. Rejected evaluations can produce an honest evidence-only commit and redeployment without increasing the generation. GitHub may disable inactive public-repository schedules after 60 days; workflows and repository limits still apply.

## Evidence and controls

- [Live generation and bounded history](https://r4-laboratories.github.io/uor-cs1.618/evolution.json)
- [Live build identity](https://r4-laboratories.github.io/uor-cs1.618/build.json)
- [Evolution workflow and downloadable evidence](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/evolution.yml)
- [Pages deployments](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/pages.yml)

Each history record has a hash and previous-record hash. The last 64 records are carried in the current state; git retains older versions. Full tick and browser evidence are workflow artifacts retained for 30 days. The pause menu shows the served generation. Reload to use a newly deployed generation; running matches are not hot-swapped.

Set the repository Actions variable **`CS_EVOLUTION=off`** to pause autonomous ticks, or disable the workflow. To undo an admitted generation, pause evolution, revert its commit and push; the normal Pages gates redeploy that state. If runtime instancing throws, the renderer restores the original scenery and retries rendering locally. That fault rollback is not a universal performance or gameplay watchdog.

Local preview requires a clean checkout:

```sh
npm ci
npx playwright install chromium
npm run evolution:tick           # measure + complete gates; restore tracked source
npm run evolution:tick -- --apply # leave tested outputs for inspection; no local push
npm run evolution:generate       # regenerate source/public projection/workflow from state
npm run evolution:check          # reject projection drift or broken history hashes
```

The publisher deliberately runs only in the main-branch GitHub workflow. The repository must allow its workflow token to write contents and dispatch Actions. No repository secret is delivered to the client.

## What was adapted from the references

Verdant Resonance's browser engine provides bounded candidates, admission, generation evidence and runtime recovery; its GitHub engine runs certified stages but does not itself publish arbitrary generated code. Its modeled/synthetic loss is not evidence of this game's improvement. cs1.618 instead measures its actual rendered scene and Verdant-backed navigation, with a finite supported search. It does not embed the upstream OPFS compiler or claim a general browser self-hosting compiler.

LexLean-R4 supplies the operational pattern of scheduled ticks, persisted state, explicit Pages dispatch and a deployment watcher. cs1.618 does not copy force/rebase publication, failure suppression, run deletion or issue-message automation. Its own admission model, evaluators and publication code are checked in here.

## Prism reproduction and proof scope

`model/evolution/admission.prompt.json` is the declarative input; `prism/evolution/app` contains the generated LexLean package. It was generated by the pinned Prism-DevRel builder, checked and compiled with the same pinned PrismPM SDK as the round model. The shipped kernel is `public/wasm/cs_evolution.wasm`; `public/prism/CS-Evolution.holo` is its binary HOLO artifact. Their source/artifact digests are in `model/artifacts.json`.

To rebuild in the SDK image from `prism/prismpm.lock`, mount this checkout at `/workspace`, enter `/workspace/prism/evolution/app`, and run:

```sh
ulimit -S -s 65536
lexlean lock
lexlean fmt --check
prismpm check
prismpm build
```

See [kernel build evidence](evidence/evolution-kernel-build.txt). Check/build succeeded; **full `prismpm verify` is not claimed** for this new model. The existing round model's documented PP5004 application-regeneration closure failure remains open. This loop's full *game gates* mean the named application tests and integrity checks, not a newly satisfied formal proof gate.

## Free feature-development lane (v0.5)

The `experience` family now generates burst recovery, audio-voice admission and adaptive-render control code from typed recipes. It runs without model access; optional model authorship now requires `CS_AI_AUTHOR=on`. The [development engine](DEVELOPMENT-ENGINE.md) explains the source catalogue, expansion backlog, pair interaction measurements, browser acceptance checks, and limits of finite synthesis. Full proof audits and weekly source discovery have separate official workflows.
