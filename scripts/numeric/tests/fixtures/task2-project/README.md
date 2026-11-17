# Historical Task2 orchestration fixture

`project.tar.gz` contains the eight numeric project files from immutable commit
`022c11363fd3a1b1c6871991f32ab02994515a7e`. Each member is the exact output of
`git show <commit>:prism/numeric/<member>`; `manifest.json` binds its size and
SHA-256 plus the archive SHA-256. Tar metadata is normalized and gzip mtime is 0.

This fixture supplies the source/configuration matching the retained Task2 SDK
receipts. Five files match that build manifest directly; the three workspace
files match the retained `lexlean.lock`. It is historical test data, not evidence
for the current numeric implementation or a new compiler.

The orchestration tests copy these verified bytes into their temporary fake-SDK
project. They still run the current oracle and collector, preserve the original
source-drift refusal test, and need no Git history at runtime. Frozen receipts
and emitted packages remain unchanged.
