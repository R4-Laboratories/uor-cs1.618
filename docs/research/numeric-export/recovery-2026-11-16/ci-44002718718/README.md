# Full source VV: retained gates failure

Run https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/44002718718, game commit 8a7c185fbc03b377cf03edc329e4a1095ad2863c, exact PrismPM candidate 2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec.

The gates partition failed at gate 7/15, fixture ct-02-prism-code-model: PP2101, system release model f6274f7e39fe374edbc453002099c268a554ed590017d929c15ed34792bc692d differs from imported application model bde664ad933ee9952eaa71f5478494fabc7d30952232a490af0f5dac7274d03c. Cause is under investigation; this is not a successful full-VV result. Other partitions were still running when this checkpoint was recorded.

Original diagnostic artifact 14294513350: 17,853 bytes; independently checked ZIP SHA-256 4062693c85624a09ef3b36f94fad6b06126dd03b7edfd414efde17d066a8376c matches GitHub API digest. ZIP retained unchanged; gate.log and gate-result.json are exact extracted copies. No source, policies or expected identities changed to suppress the failure.
