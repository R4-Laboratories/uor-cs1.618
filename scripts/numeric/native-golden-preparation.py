#!/usr/bin/env python3
"""Game-owned native evidence custody. Completeness always requires independent review."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import tempfile

SCHEMA = 'cs1618/prismpm-native-golden-orchestration/1'
FIELDS = {'schema', 'status', 'diagnostic_only', 'game', 'source', 'runner', 'inputs', 'commands', 'owner', 'files', 'error'}
REPOSITORY = 'R4-Laboratories/uor-cs1.618'
SOURCE = 'https://github.com/UOR-Foundation/prismpm'
BASE = '3666dc0f9da56fcf066d96ec01cd9e14ec9a2974'
REVISION = '881df278923ff271fc179703e55ea91c45f2394d'
TREE = 'ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4'
MANIFEST_SHA256 = '987e42ed33beea79badcf6d907b28359b188e1c2fc8876fd7b7c5faff377c468'
RESTORE_SHA256 = '90b1fe176eaa8eebb4eb6648363308b512d9ebfd649ca010d429eebc8379450d'
ENVIRONMENT_REVISION = '6ebbef86a300ff4490c4c37f821e50585e211481'
IMAGE = 'ghcr.io/uor-foundation/prismpm-sdk-candidate@sha256:42213da87c564d859e327ab7df2459357d674fa538050f13905caa24c352588e'
INPUTS = ('scripts/native-golden.mjs', 'scripts/native-golden.test.mjs', '.github/workflows/native-golden.yml',
          'scripts/ci-observe.mjs', 'sdk/golden-development-amd64.lock.json', 'sdk/golden-development.lock.json')
RECORDS = ('golden-manifest.json', 'verified/lexlean-attestation.json', 'verified/manifest.json')
MAX_FILE = 128 * 1024**2
MAX_TOTAL = 1024**3
MARKER = {'owner': 'ci-observe', 'version': 1}
REVIEW_FIELDS = {'schema', 'scope', 'status', 'source_revision', 'environment_revision', 'environment_image',
                 'identity', 'dependency_preparation_sha256', 'platform', 'native_basis', 'run_id', 'run_attempt', 'records', 'unclaimed'}
UNCLAIMED = ['hardware-attestation', 'reviewed-baseline', 'current-sdk-acceptance', 'sdk-release', 'product-readiness']


def require(condition, message):
    if not condition:
        raise ValueError(message)


def regular(path, limit=MAX_FILE):
    path = Path(path).absolute()
    require(path.parent.resolve() == path.parent, 'aliased input ancestor')
    before = path.lstat()
    require(stat.S_ISREG(before.st_mode) and before.st_nlink == 1 and before.st_size <= limit, 'bounded unaliased regular file required: ' + str(path))
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            raw = stream.read(limit + 1)
        after = os.fstat(fd)
        keys = ('st_dev', 'st_ino', 'st_size', 'st_mode', 'st_mtime_ns', 'st_ctime_ns', 'st_nlink')
        require(len(raw) == before.st_size and all(getattr(before, k) == getattr(s, k) for k in keys for s in (after, path.lstat())), 'input changed while reading')
        return raw
    finally:
        os.close(fd)


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def unique(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'duplicate retained field')
        result[key] = value
    return result


def read_json(path):
    return json.loads(regular(path), object_pairs_hook=unique)


def write_json(path, value):
    # A unique temporary file plus replace prevents stale success on interruption.
    fd, name = tempfile.mkstemp(prefix='.custody-', dir=path.parent)
    temporary = Path(name)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(value, stream, sort_keys=True, indent=2); stream.write('\n')
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def git(source, *args):
    # Read-only index/objects, no ambient Git redirection/configuration or hooks.
    env = {'PATH': os.environ.get('PATH', '/usr/bin:/bin'), 'LANG': 'C.UTF-8',
           'GIT_CONFIG_GLOBAL': '/dev/null', 'GIT_CONFIG_NOSYSTEM': '1',
           'GIT_TERMINAL_PROMPT': '0', 'GIT_OPTIONAL_LOCKS': '0'}
    return subprocess.check_output(['git', '-c', f'safe.directory={source}', '-c', 'core.fsmonitor=false',
                                    '-c', 'core.hooksPath=/dev/null', '-C', str(source), *args], env=env)


def profile(lane):
    require(lane in ('amd64', 'arm64'), 'unknown native lane')
    return f'tests/golden/native/linux-{lane}-ubuntu-24.04'


def command_specs(output):
    return [('native-helper-tests', ['node', 'scripts/native-golden.mjs', 'tests']),
            ('native-owner-run', ['node', 'scripts/native-golden.mjs', 'run', REVISION, str(output)])]


def initial_state(lane):
    game = {key: os.environ.get('GITHUB_' + name) for key, name in (
        ('server_url', 'SERVER_URL'), ('repository', 'REPOSITORY'), ('sha', 'SHA'),
        ('workflow_ref', 'WORKFLOW_REF'), ('workflow_sha', 'WORKFLOW_SHA'), ('event', 'EVENT_NAME'),
        ('ref', 'REF'), ('run_id', 'RUN_ID'), ('run_attempt', 'RUN_ATTEMPT'))}
    game['run_url'] = f"{game['server_url']}/{game['repository']}/actions/runs/{game['run_id']}"
    runner = {'os': os.environ.get('RUNNER_OS'), 'architecture': os.environ.get('RUNNER_ARCH'),
              'environment': os.environ.get('RUNNER_ENVIRONMENT'), 'lane': lane,
              'image_os': os.environ.get('ImageOS'), 'image_version': os.environ.get('ImageVersion')}
    return dict(schema=SCHEMA, status='incomplete', diagnostic_only=True, game=game, source=None,
                runner=runner, inputs=None, commands=[], owner=None, files=[], error='preparation not completed')


def validate_context(state, lane):
    game, runner = state['game'], state['runner']
    require(os.environ.get('GITHUB_ACTIONS') == 'true', 'real GitHub Actions context required')
    require(game['server_url'] == 'https://github.com' and game['repository'] == REPOSITORY, 'wrong game repository/server')
    require(game['event'] in ('push', 'workflow_dispatch'), 'wrong game event')
    require(game['ref'] == 'refs/heads/numeric-kernels', 'wrong game branch')
    require(game['workflow_ref'] == REPOSITORY + '/.github/workflows/prismpm-backport-native-golden.yml@refs/heads/numeric-kernels', 'wrong game workflow')
    for key in ('sha', 'workflow_sha'):
        require(isinstance(game[key], str) and re.fullmatch('[0-9a-f]{40}', game[key]), 'invalid game commit identity')
    require(game['sha'] == game['workflow_sha'] and game['sha'] != REVISION, 'game execution and source identities must remain distinct')
    for key in ('run_id', 'run_attempt'):
        require(isinstance(game[key], str) and re.fullmatch('[1-9][0-9]{0,19}', game[key]), 'invalid real run identity')
    require(runner['os'] == 'Linux' and runner['environment'] == 'github-hosted' and
            runner['lane'] == lane and runner['architecture'] == {'amd64': 'X64', 'arm64': 'ARM64'}.get(lane), 'wrong hosted native architecture/lane')
    verify_game(game)
    for key in ('image_os', 'image_version'):
        require(runner[key] is None or (isinstance(runner[key], str) and 0 < len(runner[key]) <= 256 and not re.search(r'[\x00-\x1f]', runner[key])), 'invalid runner image label')


def verify_game(game):
    root = Path(__file__).absolute().parents[2]
    require(git(root, 'rev-parse', 'HEAD').decode().strip() == game['sha'], 'actual game checkout differs from execution SHA')
    origin = git(root, 'config', '--get', 'remote.origin.url').decode().strip()
    require(origin in ('https://github.com/' + REPOSITORY, 'https://github.com/' + REPOSITORY + '.git'), 'actual game checkout repository differs')
    for path in ('scripts/numeric/native-golden-preparation.py', '.github/workflows/prismpm-backport-native-golden.yml'):
        require(regular(root / path) == git(root, 'show', game['sha'] + ':' + path), 'game adapter/workflow bytes differ from execution commit')


def bind_paths(source, snapshot, evidence, output):
    for path in (source, snapshot, evidence, output):
        require(path.is_absolute() and path.resolve() == path, 'absolute unaliased paths required')
    for a, b in ((source, evidence), (source, output), (evidence, output), (snapshot, evidence), (snapshot, output)):
        require(a != b and a not in b.parents and b not in a.parents, 'independent source/snapshot/retention paths required')


def manifest_digest(snapshot):
    return digest(regular(snapshot / 'manifest.json', 8192))


def snapshot_metadata(snapshot):
    require(manifest_digest(snapshot) == MANIFEST_SHA256, 'wrong immutable snapshot manifest')
    metadata = read_json(snapshot / 'manifest.json')
    for name, key in (('candidate.bundle', 'bundle_sha256'), ('candidate.patch', 'patch_sha256')):
        require(digest(regular(snapshot / name)) == metadata[key], 'stale snapshot transport hash')
    require((metadata['source'], metadata['base'], metadata['candidate'], metadata['tree']) == (SOURCE, BASE, REVISION, TREE), 'wrong reviewed source snapshot')
    return metadata


def source_identity(metadata, evidence):
    require(read_json(evidence / 'restoration-receipt.json') == {'diagnosticOnly': True, **metadata}, 'wrong original restoration receipt')
    return {'repository': SOURCE, 'base': BASE, 'revision': REVISION, 'tree': TREE,
            'bundle_sha256': metadata['bundle_sha256'], 'patch_sha256': metadata['patch_sha256'],
            'snapshot_manifest_sha256': MANIFEST_SHA256,
            'restoration_receipt_sha256': digest(regular(evidence / 'restoration-receipt.json'))}


def verify_source(source, clean=False):
    require(git(source, 'rev-parse', 'HEAD').decode().strip() == REVISION and
            git(source, 'rev-parse', 'HEAD^{tree}').decode().strip() == TREE, 'source HEAD/tree differs from reviewed capture')
    if clean:
        require(not git(source, 'status', '--porcelain=v1', '--untracked-files=all').strip(), 'fresh clean source required')
        for kind in ('build', 'verified'):
            require(not os.path.lexists(source / '.prism' / kind), 'original source outputs must be absent')


def verify_changes(source, lane):
    allowed = {f'{profile(lane)}/{path}'.encode() for path in RECORDS}
    # Separate inventories expose BOTH endpoints of renames and staged edits
    # cancelled in the worktree. No add/refresh/index/object writes are used.
    for args in (('diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--cached', 'HEAD', '--name-only', '-z'),
                 ('diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--name-only', '-z'),
                 ('ls-files', '--others', '--exclude-standard', '-z')):
        require(all(path in allowed for path in git(source, *args).split(b'\0') if path), 'source changed outside exact native record paths')


def input_rows(source):
    rows = []
    for path in INPUTS:
        raw = regular(source / path)
        require(raw == git(source, 'show', f'{REVISION}:{path}'), 'source owner/workflow/lock differs from captured Git object')
        rows.append({'path': 'source/' + path, 'bytes': len(raw), 'sha256': digest(raw)})
    raw = regular(Path(__file__).with_name('restore-prismpm-candidate.py'))
    require(digest(raw) == RESTORE_SHA256, 'immutable game restoration helper changed')
    rows.append({'path': 'game/restore-prismpm-candidate.py', 'bytes': len(raw), 'sha256': digest(raw)})
    return sorted(rows, key=lambda row: row['path'])


def inventory(root, prefix):
    require(root.resolve() == root and root.is_dir() and not root.is_symlink(), 'unaliased retention tree required')
    rows, count, total = [], 0, 0
    def walk(directory, depth):
        nonlocal count, total
        require(depth <= 32, 'retention depth bound exceeded')
        for path in sorted(directory.iterdir()):
            count += 1
            require(count <= 20000 and not re.search(r'[\x00-\x1f\\]', path.name), 'retention tree bound/name exceeded')
            mode = path.lstat().st_mode
            if stat.S_ISDIR(mode):
                walk(path, depth + 1)
            else:
                require(stat.S_ISREG(mode), 'aliased or special retained file')
                if prefix == 'evidence' and path == root / 'orchestration.json':
                    continue
                raw = regular(path); total += len(raw)
                require(total <= MAX_TOTAL, 'retained aggregate bound exceeded')
                rows.append({'path': prefix + '/' + path.relative_to(root).as_posix(), 'bytes': len(raw), 'sha256': digest(raw)})
    walk(root, 0)
    return sorted(rows, key=lambda row: row['path'])


def observer(directory, command=False, exit_code=0):
    require(read_json(directory / 'owner.json') == MARKER and read_json(directory / 'ready.json') == MARKER, 'original observer ownership/readiness absent')
    require(regular(directory / 'stop') == b'', 'observer did not stop')
    result = read_json(directory / 'monitor-result.json')
    raw = regular(directory / 'resources.jsonl', 8 * 1024**2)
    require(set(result) == {'samples', 'bytes', 'reason'} and type(result['samples']) is int and 0 <= result['samples'] <= 721
            and type(result['bytes']) is int and result['bytes'] == len(raw)
            and result['reason'] == 'stopped' and len(raw.splitlines()) == result['samples'], 'incomplete/failed original observer')
    require(all(len(line) <= 16 * 1024 for line in raw.splitlines()), 'observer sample bound exceeded')
    for line in raw.splitlines():
        json.loads(line, object_pairs_hook=unique)
    if command:
        gate = read_json(directory / 'gate-result.json')
        require(gate == {'state': 'completed', 'exitCode': exit_code, 'diagnosticsError': False}
                and type(gate['exitCode']) is int and gate['diagnosticsError'] is False, 'failed original observer command')
        log = regular(directory / 'gate.log', 32 * 1024**2)
        metadata = read_json(directory / 'log-retention.json')
        require(set(metadata) == {'observedBytes', 'headBytes', 'tailBytes', 'generation', 'truncated', 'headLimit', 'tailLimit', 'note'}, 'wrong original log metadata')
        require(metadata['truncated'] is False and type(metadata['observedBytes']) is int and type(metadata['headBytes']) is int
                and metadata['observedBytes'] == metadata['headBytes'] == len(log) and metadata['tailBytes'] == 0
                and all(type(metadata[k]) is int for k in ('tailBytes', 'generation', 'headLimit', 'tailLimit'))
                and isinstance(metadata['note'], str) and len(metadata['note']) <= 256
                and metadata['generation'] == -1 and metadata['headLimit'] == 32 * 1024**2 and metadata['tailLimit'] == 1024**2, 'complete untruncated original command log required')


def command_records(evidence, output):
    records = []
    for name, argv in command_specs(output):
        try:
            receipt = read_json(evidence / (name + '-command.json'))
            require(set(receipt) == {'argv', 'exit_code'} and receipt['argv'] == argv
                    and type(receipt['exit_code']) is int and 0 <= receipt['exit_code'] <= 255, 'invalid observed command')
        except Exception:
            break
        complete = True
        try:
            observer(evidence / name, command=True, exit_code=receipt['exit_code'])
        except Exception:
            complete = False
        records.append({'name': name, 'argv': argv, 'exit_code': receipt['exit_code'],
                        'diagnostic_path': 'evidence/' + name, 'log_complete': complete})
    return records


def selected_lock(source, lane):
    return read_json(source / ('sdk/golden-development-amd64.lock.json' if lane == 'amd64' else 'sdk/golden-development.lock.json'))


def validate_names(evidence, output):
    owner_fixed = {'review.json', 'environment.json', 'cargo-seeded-inputs.json', 'dependency-preparation.json',
                   'cargo-inputs.json', 'unaccepted-dependency-preparation.json', 'records', 'generated'}
    for path in output.iterdir():
        require(path.name in owner_fixed or re.fullmatch(r'[0-9]{3,}\.(command\.json|stdout|stderr)', path.name), 'extra original owner file')
    require(set(p.name for p in (output / 'records').iterdir()) == {'golden-manifest.json', 'verified'} and
            set(p.name for p in (output / 'records/verified').iterdir()) == {'lexlean-attestation.json', 'manifest.json'}, 'exact original raw record paths required')
    require(set(p.name for p in (output / 'generated').iterdir()) == {'build', 'verified'}, 'complete generated product directories required')
    evidence_fixed = {'orchestration.json', 'preparation.json', 'restoration-receipt.json', 'observer',
                      'native-helper-tests', 'native-owner-run', 'native-helper-tests-command.json', 'native-owner-run-command.json'}
    require(set(p.name for p in evidence.iterdir()) == evidence_fixed, 'missing/extra orchestration evidence')
    common = {'owner.json', 'ready.json', 'stop', 'resources.jsonl', 'monitor-result.json'}
    for name in ('observer', 'native-helper-tests', 'native-owner-run'):
        allowed = common if name == 'observer' else common | {'gate.log', 'gate-result.json', 'log-retention.json'}
        require(set(p.name for p in (evidence / name).iterdir()) == allowed, 'missing/extra observer file')


def owner_record(source, output, lane, state):
    review = read_json(output / 'review.json')
    require(set(review) == REVIEW_FIELDS and review['schema'] == 'prismpm/native-golden-review/1'
            and review['scope'] == 'source-golden-review-only' and review['status'] == 'review-required'
            and review['unclaimed'] == UNCLAIMED, 'original owner review schema/status differs')
    require((review['source_revision'], review['run_id'], review['run_attempt'], review['platform'], review['native_basis']) ==
            (REVISION, state['game']['run_id'], state['game']['run_attempt'], f'linux-{lane}-ubuntu-24.04',
             'github-hosted-' + state['runner']['architecture'] + '-runner-selection'), 'original review source/run/platform join differs')
    lock = selected_lock(source, lane)
    require(review['environment_revision'] == lock['source_revision'] == ENVIRONMENT_REVISION
            and review['environment_image'] == lock['reference'] == IMAGE, 'wrong development-only environment')
    environment = read_json(output / 'environment.json')
    require(set(environment) == {'lock', 'chain'} and environment['lock'] == lock, 'owner environment differs from original source lock')
    chain, identity = environment['chain'], review['identity']
    require(all(chain[key] == lock[key] for key in ('reference', 'architecture', 'child_digest', 'config_digest'))
            and lock['architecture'] == lane, 'owner OCI chain differs from exact native lock')
    require(isinstance(identity, dict) and set(identity) == {'id', 'platform_id', 'store'}, 'original loaded-image identity required')
    if identity['store'] == 'classic':
        require(identity['id'] == identity['platform_id'] == lock['config_digest'], 'classic loaded-image/lock join differs')
    else:
        require(identity['store'] == 'containerd' and identity['id'] == IMAGE.split('@')[1]
                and identity['platform_id'] == lock['child_digest'], 'containerd loaded-image/lock join differs')
    preparation = read_json(output / 'dependency-preparation.json')
    canonical = json.dumps(preparation['preparation'], sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()
    require(preparation['preparation_sha256'] == review['dependency_preparation_sha256'] == digest(canonical), 'dependency preparation join differs')
    for name in ('cargo-seeded-inputs.json', 'cargo-inputs.json'):
        require(read_json(output / name), 'complete original Cargo evidence required')
    for kind in ('build', 'verified'):
        regular(output / 'generated' / kind / 'manifest.json')
        require(inventory(output / 'generated' / kind, 'product') == inventory(source / '.prism' / kind, 'product'), 'missing/extra/changed retained original generated product')
    require([r['path'] for r in inventory(source / profile(lane), 'record')] == ['record/' + p for p in RECORDS], 'exact source native record inventory required')
    require(isinstance(review['records'], list) and len(review['records']) == 3, 'exact three raw records required')
    rows = []
    for path, recorded in zip(RECORDS, review['records']):
        raw = regular(output / 'records' / path)
        require(recorded == {'path': path, 'byte_length': len(raw), 'sha256': digest(raw)}
                and type(recorded['byte_length']) is int, 'original review/raw-record hash mismatch')
        require(regular(source / profile(lane) / path) == raw, 'source/native owner raw bytes differ')
        rows.append({'path': 'owner/records/' + path, 'bytes': len(raw), 'sha256': digest(raw)})
    command_files = sorted(output.glob('*.command.json'))
    require(command_files and [p.name for p in command_files] == [f'{i:03d}.command.json' for i in range(1, len(command_files)+1)], 'missing original command sequence')
    expected_files = set()
    golden = []
    for path in command_files:
        value = read_json(path); stem = path.name.split('.')[0]
        require(set(value) == {'command', 'args', 'status', 'signal'} and value['command'] in ('git', 'docker')
                and isinstance(value['args'], list) and all(isinstance(v, str) for v in value['args'])
                and value['signal'] is None and type(value['status']) is int, 'invalid original command result')
        stdout, stderr = regular(output / (stem + '.stdout')), regular(output / (stem + '.stderr'))
        # Original authenticated cleanup deliberately retains failed inspect calls.
        require(value['status'] == 0 or (value['status'] == 1 and value['command'] == 'docker'
                and len(value['args']) == 2 and value['args'][0] == 'inspect'
                and re.search(b'No such (?:object|container)', stderr)), 'failed original owner subprocess')
        expected_files.update({path.name, stem + '.stdout', stem + '.stderr'})
        args = value['args']
        base = ['cargo', 'run', '--locked', '--offline', '-p', 'xtask', '--', 'check-golden']
        if value['command'] == 'docker' and args[:1] == ['exec'] and args[2:2+len(base)] == base:
            golden.append(args[2:])
    require(golden == [base + ['--write'], base], 'both exact original golden commands required')
    observed_files = {p.name for p in output.iterdir() if re.fullmatch(r'[0-9]{3,}\..*', p.name)}
    require(expected_files == observed_files, 'missing/extra original command streams')
    return {'review_path': 'owner/review.json', 'review_sha256': digest(regular(output / 'review.json')),
            'source_revision': REVISION, 'run_id': review['run_id'], 'run_attempt': review['run_attempt'],
            'platform': review['platform'], 'records': rows}


def prepare(source: Path, snapshot: Path, evidence: Path, output: Path, lane: str) -> dict:
    bind_paths(source, snapshot, evidence, output)
    require(not os.path.lexists(evidence), 'fresh orchestration evidence required')
    evidence.mkdir(mode=0o700)
    state = initial_state(lane)
    write_json(evidence / 'orchestration.json', state)
    try:
        validate_context(state, lane)
        require(not os.path.lexists(output), 'original native destination must be absent')
        require(os.getuid() > 0 and source.stat().st_uid == os.getuid(), 'real nonroot source owner required')
        metadata = snapshot_metadata(snapshot)
        helper = Path(__file__).with_name('restore-prismpm-candidate.py')
        require(digest(regular(helper)) == RESTORE_SHA256, 'immutable restorer changed')
        receipt = subprocess.check_output(['python3', str(helper), str(snapshot), str(source)])
        (evidence / 'restoration-receipt.json').write_bytes(receipt)
        verify_source(source, clean=True)
        state['source'] = source_identity(metadata, evidence)
        state['inputs'] = input_rows(source)
        state['error'] = 'native commands not yet observed'
        write_json(evidence / 'preparation.json', state)
    except Exception as error:
        state['error'] = bounded_error(error)
        raise
    finally:
        write_json(evidence / 'orchestration.json', state)
    return state


def bounded_error(error):
    return re.sub(r'[\x00-\x1f]', ' ', str(error))[:2048] or 'native evidence incomplete'


def collect(source: Path, snapshot: Path, evidence: Path, output: Path, lane: str) -> dict:
    # Reset the public label before reading any sidecars, including on retries.
    state = initial_state(lane)
    require(evidence.is_dir() and evidence.resolve() == evidence, 'existing unaliased wrapper evidence required')
    write_json(evidence / 'orchestration.json', state)
    try:
        bind_paths(source, snapshot, evidence, output)
        validate_context(state, lane)
        prepared = read_json(evidence / 'preparation.json')
        require(isinstance(prepared, dict) and set(prepared) == FIELDS and prepared['schema'] == SCHEMA
                and prepared['status'] == 'incomplete' and prepared['diagnostic_only'] is True
                and prepared['game'] == state['game'] and prepared['runner'] == state['runner']
                and prepared['commands'] == [] and prepared['owner'] is None and prepared['files'] == []
                and prepared['error'] == 'native commands not yet observed', 'closed original preparation/context required')
        metadata = snapshot_metadata(snapshot)
        state['source'] = source_identity(metadata, evidence)
        require(prepared['source'] == state['source'], 'source transport/restoration identity changed')
        verify_source(source)
        verify_changes(source, lane)
        state['inputs'] = input_rows(source)
        require(prepared['inputs'] == state['inputs'], 'source owner/workflow/environment-lock inputs changed')
        state['commands'] = command_records(evidence, output)
        require(len(state['commands']) == 2 and all(record['exit_code'] == 0 and record['log_complete'] for record in state['commands']), 'both exact commands require successful exits and complete original logs')
        observer(evidence / 'observer')
        state['owner'] = owner_record(source, output, lane, state)
        validate_names(evidence, output)
        state['files'] = sorted(inventory(output, 'owner') + inventory(evidence, 'evidence'), key=lambda row: row['path'])
        state['status'] = 'complete-review-required'; state['error'] = None
    except Exception as error:
        state['error'] = bounded_error(error)
        # Inventory all safe originals even when qualification fails. The actual
        # trees are uploaded whole; unsafe members make completeness impossible.
        rows = []
        for directory, prefix in ((output, 'owner'), (evidence, 'evidence')):
            try:
                rows.extend(inventory(directory, prefix))
            except Exception as retention_error:
                state['error'] = bounded_error(state['error'] + '; retention: ' + str(retention_error))
        state['files'] = sorted(rows, key=lambda row: row['path'])
    finally:
        write_json(evidence / 'orchestration.json', state)
    return state


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=('prepare', 'collect'))
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--lane', choices=('amd64', 'arm64'), required=True)
    args = parser.parse_args()
    paths = [path.absolute() for path in (args.source, args.snapshot, args.evidence, args.output)]
    result = globals()[args.operation](*paths, args.lane)
    if args.operation == 'collect' and result['status'] != 'complete-review-required':
        raise SystemExit(1)


if __name__ == '__main__':
    main()
