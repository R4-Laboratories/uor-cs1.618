# Creative authorship in cs1.618

[Open the evolution studio](https://r4-laboratories.github.io/uor-cs1.618/evolution-studio.html). It displays the bundled, admitted murals and tactical program, lets you compare an undecorated wall, downloads both recipes, and links to the public generation record.

## What the game can now author

**Original environment artwork.** A program describes a palette and up to 48 normalized vector marks. The compiler emits TypeScript drawing operations; the renderer combines them with protected A/B labels and relay typography. Four existing walls carry the resulting murals. They add four decorative planes and two 512×256 textures, without changing collision or gameplay cover. The pause menu can disable murals on that browser. Invalid recipes preserve the previous layer.

**Bot decision programs.** Up to 12 ordered rules combine ten local boolean facts using `all`, `any`, and `not`. The compiler emits a new pure TypeScript decision function. Programs choose interaction, reload, engagement, advance, escort or guard. The host still owns collision, speed, aiming limits, damage, ammo, economy and round results. Hidden enemy coordinates never enter the program. A runtime example is prioritizing a last-chance defuse over a distracting visible opponent.

These are new authored programs, not just selections among the old render cell sizes. Authorship remains typed and bounded: it cannot write arbitrary imports, shell commands, networking, credentials, tests or its own admission rules. General unrestricted repository rewriting is not delivered or claimed.

## Where proposals come from

`model/evolution/brief.json` records the design intent. A deterministic seeded author creates original mural layouts and tactical rule variants without an account or model service. The optional **GitHub Models** author uses `openai/gpt-4.1-mini` through `https://models.github.ai/inference/chat/completions`. It receives the public brief, current admitted programs, recent measured outcomes, an example grammar and fixed constraints, not secrets or the evaluator corpus. Its response is parsed as JSON, checked against strict schemas, and only then compiled by trusted code. No model-supplied JavaScript is executed.

The Actions workflow requests `models: read`; only the author step receives `GH_MODELS_TOKEN`. Availability depends on GitHub Models access for the repository/organization and its quota. No billing/account change is made. The response has a 45-second deadline. Unavailable, rejected or malformed responses produce an explicit author receipt and the tick continues with seeded synthesis. Set **`CS_AI_AUTHOR=off`** to disable model requests. A model proposal does not bypass any gate.

Each creative family gets four synthesis attempts per source context and one valid model-proposal slot, alongside the original optimization frontier. The search can settle; success is never fabricated to keep commits flowing. Changes to code, policy or brief reopen the frontier. Hourly scheduling does not imply hourly improvement.

## What admission measures

Art admission renders all four wall locations in Chromium. It checks unchanged protected scene inventory, visible image differences, lettering contrast of at least 4.5:1, distinct A/B colors, motif coverage between 2% and 35%, and bounded draw/triangle additions. Its declared loss combines inverse contrast and deviation from a target motif density. This measures legibility and density, **not beauty**; screenshots are retained as review evidence. The first probes revealed that broad optimization camera views barely saw the murals, so admission now uses direct, walkable views of every mounting location. Southern panels sit below the windows.

Tactics admission compares incumbent and candidate on 96 training cases, 96 held-out variants (including combined obligations), and six real emergency-defuse matches using the shipped Verdant and Prism Wasm. It requires no per-case decision regression, no reduction in completed objectives, finite legal movement inputs and lower aggregate loss. This corpus is public and finite; held-out means excluded from the author prompt, not a secret statistical guarantee. The six match fixtures use visible stationary opponents: they measure objective priority, not survival against active gunfire. This does not establish a universal win-rate or balance improvement.

The same compiled Prism admission kernel consumes four obligations: protected fidelity, measured benefit, domain/resource bounds, and completed application checks. Creative fidelity means preservation of protected behavior, not pixel equality of intentional artwork changes. All 16 obligation combinations remain tested. This extends host measurements without claiming a new formal proof of the whole game or resolving the previously documented PrismPM PP5004 verification gap.

## Source, provenance and deployment

`shared/creative-program.ts` owns the grammar, validators, compiler and seeded synthesis. The generated artifacts are `shared/generated-artwork.ts` and `shared/generated-tactics.ts`. `scripts/evolution/measure-creative.ts` owns the independent corpus and measurements. Recipe/compiler parity is tested; measurement executes compiled tactical code. The browser verifies that the built art identity matches the candidate before measurement.

The restricted publisher now owns six files: evolution state, public generation record, generated render policy, generated navigation, generated artwork, generated tactics. It still binds tested outputs to SHA-256 hashes, refuses a changed main branch, and uses ordinary fast-forward publication followed by explicit Pages dispatch. Existing history hashes survive migration. Full tests, build/integrity, rendered gameplay, real WebRTC and creative-browser checks must pass before promotion; Pages repeats them.

Commands (clean checkout for ticks):

```sh
npm run evolution:author                       # receipt; synthesis works without a token
npm run evolution:tick -- --family=art         # full preview, restored afterward
npm run evolution:tick -- --family=tactics     # tactical preview
npm run test:creative-browser                  # built studio/layer tests
```

Actions manual dispatch can target `auto`, `art`, `tactics`, `render` or `navigation`. Set `CS_EVOLUTION=off` to pause all ticks. Pause and revert an unwanted generated commit to restore it through normal Pages gates. Reloading picks up a deployed generation; active matches are not hot-swapped. Operator controls and the deployment watcher are described in [the main evolution guide](SELF-IMPROVEMENT.md).
