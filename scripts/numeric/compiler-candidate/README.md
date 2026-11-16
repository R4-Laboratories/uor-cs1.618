# Compiler source diagnostic candidate

This is an **unvalidated reconstruction**, retained after the prior workspace reset. It is not selected by game builds, PrismPM acquisition, or Pages. The bundle retains the new local commit exactly; the patch is its reviewable difference from the declared upstream base. The commit has not been published to afflom/lean4-prod.

The workflow `Compiler source diagnostics` restores the source with checked object/patch identities and runs the source-stage gates in the unchanged pinned SDK. Compilation, negative controls, generated-output review and independent review remain required. A source-gate result does not establish canonical game-root admission.

See [recovery notes](../../../docs/research/numeric-export/recovery-2026-11-16/compiler-source-stage.md). No historical lost log is substituted for a new run.
