# Reviewed native baseline generation

[GitHub run44060585070](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/44060585070) completed successfully on both original GitHub-hosted architectures: AMD64 in23.8minutes and ARM64 in41.55minutes. Actual game commit: `e0355a99c8717724e0d1fd072dfac15013603d17`; separately restored source: `881df278923ff271fc179703e55ea91c45f2394d`. The original native owner and environment locks were unchanged.

Both artifact sets passed independent review. Each contains490 inventoried original files, complete49-command transcripts, authenticated cleanup, original helper/dependency/seed checks and native generation/readback. All415 portable generated files match the reviewed shared baseline.

- [AMD64 artifact review](amd64-review.md)
- [ARM64 and joint six-file import review](arm64-joint-review.md)
- [Actual completed-run metadata](completed-run.json)
- [Actual artifact API metadata](artifacts-both-lanes.json)

The original ZIPs and complete extraction inventories are retained here. Their digests and exact six proposed native file hashes are in the reviews. Import uses those exact original bytes, with a separate source-change review. No local regeneration or normalized replacement is authorized by these results.

This closes generation and artifact review only. It does not establish original-d6 SDK capture, constructive proof compilation, complete final-source validation, numerical runtime admission, a game graphics speedup, or a Pages release. Later source identity stays distinct from the source actually executed in this run.
