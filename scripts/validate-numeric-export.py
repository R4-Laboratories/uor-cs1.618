#!/usr/bin/env python3
"""Run the reviewed UORust candidate through its unchanged bootstrap SDK gate."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'docs/research/numeric-export'
MANIFEST = EVIDENCE / 'validation-manifest.json'
PATCH = EVIDENCE / 'numeric-export-current.patch'
BOOTSTRAP = '.github/workflows/bootstrap.yml'
SCHEMA = 'cs1618/numeric-export-validation/1'
FIELDS = {'schema', 'base', 'patch_sha256', 'bootstrap_sha256', 'lock_sha256',
          'sdk_image', 'allowed_paths', 'candidate_tree'}
PROTECTED = {'Justfile', 'justfile', 'Cargo.toml', 'Cargo.lock', 'prismpm.lock',
             'template.lock', 'rust-toolchain.toml', 'AGENTS.md', 'template-contract.json'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(value):
    require(isinstance(value, str) and value and '\\' not in value,
            'invalid patch path')
    p = PurePosixPath(value)
    require(not p.is_absolute() and '..' not in p.parts and '.' not in p.parts
            and str(p) == value and not any(c.isspace() for c in value),
            'invalid patch path')
    require('.git' not in p.parts, 'patch cannot address Git metadata')
    return value


def git(source, *args):
    return subprocess.check_output(['git', '-C', str(source), *args])


def manifest(path=MANIFEST):
    data = json.loads(path.read_text())
    require(isinstance(data, dict) and set(data) == FIELDS, 'manifest fields differ')
    require(data['schema'] == SCHEMA, 'unsupported manifest schema')
    require(isinstance(data['base'], str) and re.fullmatch('[0-9a-f]{40}', data['base']),
            'base must be a full immutable commit')
    require(isinstance(data['candidate_tree'], str) and re.fullmatch('[0-9a-f]{40}', data['candidate_tree']),
            'candidate_tree must be a full Git tree ID')
    for field in ('patch_sha256', 'bootstrap_sha256', 'lock_sha256'):
        require(isinstance(data[field], str) and re.fullmatch('[0-9a-f]{64}', data[field]),
                f'{field} must be a SHA-256 digest')
    require(isinstance(data['sdk_image'], str) and re.fullmatch(
        r'ghcr\.io/afflom/prismpm-sdk-patched@sha256:[0-9a-f]{64}', data['sdk_image']),
        'SDK must be the immutable upstream registry image')
    paths = data['allowed_paths']
    require(isinstance(paths, list) and paths and all(isinstance(p, str) for p in paths)
            and paths == sorted(set(paths)), 'allowed_paths must be nonempty, sorted and unique')
    for path in paths:
        safe_path(path)
        require(path not in PROTECTED and not path.startswith(('.github/', '.devcontainer/', 'xtask/', 'crates/xtask/',
                                             'crates/repo-conformance/', 'scripts/self-model/', 'scripts/ci/'))
                and not path.endswith('.lock'), f'protected gate/lock path: {path}')
    return data


def bootstrap_script(data):
    # Exact layout is intentionally fail-closed; never synthesize a reduced gate.
    marker = '      - name: Run the template gate through the locked SDK\n        shell: bash\n        run: |\n'
    text = data.decode('utf-8')
    require(text.count(marker) == 1, 'expected one unchanged bootstrap run block')
    lines = text.split(marker, 1)[1].splitlines(keepends=True)
    body = []
    for line in lines:
        if line.strip() and not line.startswith('          '):
            break
        body.append(line[10:] if line.startswith('          ') else line)
    script = ''.join(body).encode()
    require(b'exec just vv' in script and b'docker run --rm' in script,
            'bootstrap no longer invokes the full Docker/just vv gate')
    return script


def custody(source, target):
    bootstrap = (source / BOOTSTRAP).read_bytes()
    require(sha(bootstrap) == target['bootstrap_sha256'], 'bootstrap SHA mismatch')
    lock = (source / 'prismpm.lock').read_bytes()
    require(sha(lock) == target['lock_sha256'], 'SDK lock SHA mismatch')
    require(json.loads(lock)['sdk_image'] == target['sdk_image'], 'SDK image mismatch')
    template = json.loads((source / 'template.lock').read_text())
    require(template['sdk_image'] == target['sdk_image'], 'template SDK image mismatch')
    policies = template['policy_files']
    require(isinstance(policies, list) and policies, 'missing template policy files')
    paths = set()
    for row in policies:
        path = safe_path(row['path'])
        require(row['sha256'] == 'sha256:' + sha((source / path).read_bytes()),
                f'template policy SHA mismatch: {path}')
        paths.add(path)
    require(not paths.intersection(target['allowed_paths']), 'patch touches template policy files')
    return bootstrap


def prepare(source, output, mode, target, patch):
    source, output = source.resolve(), output.resolve()
    require(mode in ('baseline', 'patched'), 'unknown validation mode')
    require(output != source and source not in output.parents,
            'evidence directory must be outside upstream checkout')
    require(git(source, 'rev-parse', 'HEAD').decode().strip() == target['base'],
            'upstream base mismatch')
    require(not git(source, 'status', '--porcelain', '--ignored', '--untracked-files=all').strip(),
            'upstream checkout is not clean')
    require(git(source, 'remote', 'get-url', 'origin').decode().strip()
            in ('https://github.com/afflom/UORust', 'https://github.com/afflom/UORust.git'),
            'unexpected upstream repository')
    require(sha(patch.read_bytes()) == target['patch_sha256'], 'patch SHA mismatch')
    bootstrap = custody(source, target)
    if mode == 'patched':
        subprocess.run(['git', '-C', str(source), '-c', 'user.name=Numeric export validation',
                        '-c', 'user.email=numeric-export-validation@example.invalid',
                        'am', '--committer-date-is-author-date', str(patch.resolve())], check=True)
        changed = set(git(source, 'diff', '--name-only', '--no-renames', '-z',
                          target['base'], 'HEAD').decode().rstrip('\0').split('\0'))
        require(changed == set(target['allowed_paths']), 'applied patch paths differ from manifest')
        require(git(source, 'rev-parse', 'HEAD^{tree}').decode().strip() == target['candidate_tree'],
                'applied candidate tree mismatch')
        for entry in git(source, 'ls-tree', '-r', '-z', 'HEAD', '--', *sorted(changed)).split(b'\0'):
            if entry:
                require(entry.split(b' ', 1)[0] in (b'100644', b'100755'),
                        'patch contains a symlink or submodule')
        require(not git(source, 'status', '--porcelain', '--ignored', '--untracked-files=all').strip(),
                'patched checkout is not clean')
        require(not git(source, 'diff', target['base'], 'HEAD', '--', 'Justfile', 'justfile',
                        'template.lock', 'Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml').strip(),
                'patch changed acceptance gate or locks')
        require(custody(source, target) == bootstrap, 'bootstrap changed after patch')
    script = bootstrap_script(bootstrap)
    output.mkdir(parents=True, exist_ok=True)
    script_path = output / 'bootstrap-run.sh'
    script_path.write_bytes(script)
    subprocess.run(['bash', '-n', str(script_path)], check=True)
    receipt = {'schema': SCHEMA, 'mode': mode, 'target': target,
               'applied_head': git(source, 'rev-parse', 'HEAD').decode().strip(),
               'tree': git(source, 'rev-parse', 'HEAD^{tree}').decode().strip(),
               'bootstrap_run_sha256': sha(script), 'full_gate_completed': False,
               'note': 'Preflight only until the original SDK gate exits successfully.'}
    (output / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    return script_path, receipt


def probe(source, output, target):
    """Additional primitive experiment; never replaces or rewrites full acceptance."""
    source, output = source.resolve(), output.resolve()
    receipt = json.loads((output / 'receipt.json').read_text())
    require(receipt.get('target') == target and receipt.get('mode') == 'patched'
            and receipt.get('full_gate_completed') is True
            and receipt.get('full_gate_passed') is True and receipt.get('exit_code') == 0,
            'primitive probe requires this patched candidate to pass full acceptance first')
    require(git(source, 'rev-parse', 'HEAD^{tree}').decode().strip() == target['candidate_tree']
            and not git(source, 'diff', 'HEAD', '--').strip(),
            'candidate changed after full acceptance')
    custody(source, target)
    require(sha(PATCH.read_bytes()) == target['patch_sha256'], 'patch SHA mismatch')
    probe_dir = output / 'primitive'
    probe_dir.mkdir()
    inner = """set -euo pipefail
rustup target list --installed | grep -Fx wasm32-unknown-unknown
target_libdir=$(rustc --print target-libdir --target wasm32-unknown-unknown)
test -d "$target_libdir"
compgen -G "$target_libdir/libstd-*.rlib" >/dev/null
exec bash scripts/probe-numeric-export.sh
"""
    command = ['docker', 'run', '--rm', '--user', f'{os.getuid()}:{os.getgid()}',
               '--tmpfs', '/tmp:rw,exec,nosuid,size=2g',
               '--volume', f'{source}:{source}', '--volume', f'{output}:{output}',
               '--workdir', str(source), '--env', 'HOME=/tmp/prismpm-home',
               '--env', 'PRISMPM_EPHEMERAL_HOME=1', '--env', f"SDK_IMAGE={target['sdk_image']}",
               '--env', f'TMPDIR={probe_dir}', target['sdk_image'], 'bash', '-c', inner]
    result = subprocess.run(command)
    (output / 'primitive-receipt.json').write_text(json.dumps({
        'schema': SCHEMA, 'scope': 'Bounded significand primitive, not the full IEEE root',
        'sdk_image': target['sdk_image'], 'candidate_tree': target['candidate_tree'],
        'exit_code': result.returncode, 'passed': result.returncode == 0}, indent=2) + '\n')
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('metadata', 'prepare', 'run', 'probe'))
    parser.add_argument('--source', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--mode', choices=('baseline', 'patched'))
    args = parser.parse_args()
    target = manifest()
    if args.command == 'metadata':
        print('base=' + target['base'])
        return 0
    require(args.source and args.output and args.mode, 'source, output and mode are required')
    if args.command == 'probe':
        require(args.mode == 'patched', 'primitive probe is candidate-only')
        return probe(args.source, args.output, target)
    script, receipt = prepare(args.source, args.output, args.mode, target, PATCH)
    print(json.dumps(receipt, indent=2), flush=True)
    if args.command == 'prepare':
        return 0
    result = subprocess.run(['bash', str(script)], cwd=args.source.resolve())
    receipt.update(full_gate_completed=True, exit_code=result.returncode,
                   full_gate_passed=result.returncode == 0)
    (args.output / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    return result.returncode


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        print(f'Numeric export validation refused: {error}', file=sys.stderr)
        sys.exit(1)
