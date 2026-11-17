#!/usr/bin/env python3
"""Validate the one historical artifact's API provenance; never select latest."""
import json
import os
from pathlib import Path
import sys
import urllib.request

REPOSITORY = "R4-Laboratories/uor-cs1.618"
RUN = 43986399997
ARTIFACT = 14288310173
NAME = "prismpm-backport-43986399997"
HEAD = "022c11363fd3a1b1c6871991f32ab02994515a7e"
DIGEST = "sha256:20100b809e5b0994703f681dc1c4cf751dda4f50e1d784ec8d65a7ac792a0fa9"
SIZE = 1336947756


def validate(run, artifact, listing):
    if (run.get("id") != RUN or run.get("head_sha") != HEAD or
            run.get("repository", {}).get("full_name", "").lower() != REPOSITORY.lower()):
        raise ValueError("fixed recovery run/head/repository mismatch")
    if (artifact.get("id") != ARTIFACT or artifact.get("name") != NAME or
            artifact.get("size_in_bytes") != SIZE or artifact.get("expired") is not False or
            artifact.get("digest") != DIGEST or
            artifact.get("workflow_run", {}).get("id") != RUN or
            artifact.get("workflow_run", {}).get("head_sha") != HEAD):
        raise ValueError("fixed recovery artifact metadata mismatch")
    matches = [item for item in listing["artifacts"] if item["name"] == NAME]
    if len(matches) != 1 or matches[0]["id"] != ARTIFACT or listing.get("total_count", 0) > 100:
        raise ValueError("artifact name is ambiguous or listing incomplete")
    return {
        "repository": REPOSITORY, "source_run_id": RUN, "source_head_sha": HEAD,
        "source_artifact_id": ARTIFACT, "source_artifact_name": NAME,
        "source_artifact_size": SIZE, "source_artifact_api_digest": DIGEST,
        "run_conclusion": run.get("conclusion"),
        "scope": "historical artifact recovery only; no SDK rerun or receipt rewrite",
        "digest_verification_limit": (
            "API digest is required to match the recorded original. Pinned download-artifact "
            "performs its own download digest check, whose mismatch is a warning. The action "
            "extracts the ZIP and does not expose original ZIP bytes here; no independent "
            "ZIP SHA256 verification is claimed. The original artifact remains retained."),
    }


def main():
    output = Path(sys.argv[1])
    output.mkdir(parents=True, exist_ok=True)
    scope = "historical artifact recovery only; no SDK rerun or receipt rewrite"
    (output / "recovery-scope.txt").write_text(scope + "\n")
    def get(suffix):
        request = urllib.request.Request(
            "https://api.github.com/repos/" + REPOSITORY + suffix,
            headers={"Authorization": "Bearer " + os.environ["GH_TOKEN"],
                     "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"})
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.load(response)
    metadata = {"validated_api_metadata": False, "expected_run": RUN,
                "expected_artifact": ARTIFACT, "expected_head": HEAD,
                "expected_name": NAME, "expected_digest": DIGEST, "scope": scope}
    try:
        metadata.update(validate(get(f"/actions/runs/{RUN}"), get(f"/actions/artifacts/{ARTIFACT}"),
                                 get(f"/actions/runs/{RUN}/artifacts?per_page=100")))
        metadata["validated_api_metadata"] = True
    except Exception as error:
        metadata["validation_error"] = str(error)
        raise
    finally:
        (output / "recovery-metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    (output / "recovery-scope.txt").write_text(metadata["scope"] + "\n" + metadata["digest_verification_limit"] + "\n")


if __name__ == "__main__":
    main()
