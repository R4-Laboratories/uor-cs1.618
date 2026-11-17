# Diagnostic PrismPM source snapshot

This bundle preserves a locally reviewed candidate for explicit compiler-source
selection. It is **not an upstream release, replacement SDK, or production
admission**. The upstream base, exact candidate/tree, binary Git patch and bundle
digests are in `manifest.json`. Restore only into a clean dedicated checkout of
that base with `../restore-prismpm-candidate.py`.

The candidate contains the existing verifier replay-input correction separately
from the dual-authority change. Default `released` still names the original
compiler; explicit `numeric-task2c` names compiler `2a13f94`. Its deterministic
archive and descriptor bind the earlier immutable game source snapshot
`3e58e37161a6b8584c913b486484848bf3f3c046`. Keep that commit reachable.

The `PrismPM backport diagnostics` workflow uses the unchanged d6 SDK and the
same newly built absolute verifier path for all three real application checks.
It requires the retained-file reader's explicit completion marker and preserves
actual output/logs on failure. It does not modify the installed SDK verifier or
enable this candidate in the game. Full product/OCI qualification, bounded
arithmetic adaptation and whole-game acceptance remain separate gates.
