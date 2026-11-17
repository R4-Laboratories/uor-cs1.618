"""Fixed game qualification authority; never a normal capture guest or envelope."""
import errno
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys
import time

SDK_IMAGE = 'ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c'
UTILITY_SHA256 = 'ca09b9de3bf57c3e2dc16e11d4d1a527b9b2f1f271566bb7a87846d0a24f8e9a'
CAPSULES = ('conditional-capture-sdk.py', 'conditional-capture-candidate.py')
OPERATIONS = ('write', 'truncate', 'chmod', 'hardlink', 'rename', 'write-restore')
MAX_CODE, MAX_MODULE, MAX_JSON = 32768, 1048576, 33554432


def require(ok, message):
    if not ok:
        raise ValueError(message)


def parse_invocation(original, current):
    require(type(original) is list and len(original) == 12 and original[:4] ==
            ['/usr/bin/python3', '-I', '-B', '-c'], 'exact probe orig_argv')
    require(current == ['-c'] + original[5:], 'exact probe argv')
    code = original[4].encode('utf-8', 'strict')
    require(0 < len(code) <= MAX_CODE and b'\0' not in code, 'bounded probe code')
    mode, seconds, descriptor, utility_size, utility_hash, entry_size, entry_hash = original[5:]
    require(mode in ('readonly-qualification-v1', 'attachment-qualification-v1'), 'closed probe mode')
    require(re.fullmatch('[1-9][0-9]{0,3}', seconds) and int(seconds) <= 1980, 'bounded probe seconds')
    require(re.fullmatch('[0-9a-f]{64}', descriptor), 'probe descriptor digest')
    capsules = []
    for size, digest in ((utility_size, utility_hash), (entry_size, entry_hash)):
        require(re.fullmatch('[1-9][0-9]{0,6}', size) and int(size) <= MAX_MODULE
                and re.fullmatch('[0-9a-f]{64}', digest), 'bounded probe capsule')
        capsules.append({'bytes': int(size), 'sha256': digest})
    require(utility_hash == UTILITY_SHA256, 'fixed utility digest')
    return {'mode': mode, 'seconds': int(seconds), 'descriptor_sha256': descriptor,
            'probe_sha256': hashlib.sha256(code).hexdigest(), 'capsules': capsules}


def require_runtime(version, uid, gid, isolated, no_bytecode, image):
    require(version == (3, 12, 3) and uid == 1000 and gid == 1000 and isolated == 1
            and no_bytecode is True and image == SDK_IMAGE, 'actual pinned isolated SDK runtime required')


def identity(info):
    return tuple(getattr(info, key) for key in ('st_dev', 'st_ino', 'st_uid', 'st_gid', 'st_mode',
                                               'st_nlink', 'st_size', 'st_mtime_ns', 'st_ctime_ns'))


def regular(path, maximum):
    require(path.is_absolute() and path.resolve() == path, 'unaliased probe input')
    before = path.lstat()
    require(stat.S_ISREG(before.st_mode) and before.st_nlink == 1 and before.st_size <= maximum,
            'bounded single-link probe input')
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        require(identity(os.fstat(fd)) == identity(before), 'probe input replaced')
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            body = stream.read(maximum + 1)
        require(len(body) == before.st_size and identity(os.fstat(fd)) == identity(before)
                and identity(path.lstat()) == identity(before), 'probe input changed')
        return body
    finally:
        os.close(fd)


def mutation_paths(descriptor, authority):
    # The selected ordinary file is fixed by the complete authenticated source
    # union, not by discovery of whichever paths happen to remain on disk.
    ordinary = next(row['path'] for row in descriptor['union']
                    if row['kind'] == 'file' and row['path'] not in authority)
    paths = []
    for root in (Path('/candidate-input/candidate-source'), Path(descriptor['source_root'])):
        paths.extend(root / path for path in (ordinary, *authority))
    paths.extend(Path('/candidate-input/authority') / name for name in CAPSULES)
    paths.extend(Path('/candidate-input') / name for name in
                 ('current-test-elf', 'candidate-input.json', 'candidate-transfer-manifest.json'))
    return paths


def refuse_mutation(path, operation):
    before = path.lstat()
    require(stat.S_ISREG(before.st_mode) and path.resolve() == path, 'real mutation target')
    temporary = path.with_name(path.name + '.candidate-qualification-mutation')
    require(not os.path.lexists(temporary), 'mutation destination must be absent')
    observed = None
    try:
        if operation in ('write', 'truncate', 'write-restore'):
            fd = os.open(path, os.O_RDWR | os.O_NOFOLLOW | os.O_NONBLOCK)
            try:
                if operation == 'truncate':
                    # Even a same-size ftruncate must fail on a read-only mount.
                    os.ftruncate(fd, before.st_size)
                else:
                    original = os.pread(fd, 1, 0)
                    if operation == 'write':
                        os.pwrite(fd, original or b'\0', 0)
                        if not original:
                            os.ftruncate(fd, 0)
                    else:
                        try:
                            os.pwrite(fd, bytes([(original[0] if original else 0) ^ 1]), 0)
                        finally:
                            if original:
                                os.pwrite(fd, original, 0)
                            os.ftruncate(fd, before.st_size)
            finally:
                os.close(fd)
        elif operation == 'chmod':
            os.chmod(path, stat.S_IMODE(before.st_mode), follow_symlinks=False)
        elif operation == 'hardlink':
            os.link(path, temporary, follow_symlinks=False)
            temporary.unlink()
        elif operation == 'rename':
            os.rename(path, temporary)
            os.rename(temporary, path)
        else:
            raise ValueError('closed mutation operation')
    except OSError as error:
        require(error.errno in (errno.EROFS, errno.EPERM, errno.EACCES), 'unexpected mutation failure errno')
        observed = error.errno
    require(observed is not None, 'readonly mutation unexpectedly succeeded: ' + operation + ' ' + str(path))
    require(identity(path.lstat()) == identity(before) and not os.path.lexists(temporary),
            'mutation changed inode, mode, bytes metadata or paths')
    return observed


def main():
    started = time.monotonic()
    context = parse_invocation(sys.orig_argv, sys.argv)
    deadline = started + context['seconds']
    require_runtime(sys.version_info[:3], os.getuid(), os.getgid(), sys.flags.isolated,
                    sys.dont_write_bytecode, os.environ.get('PRISMPM_TEST_SDK_IMAGE'))
    root = Path('/candidate-input')
    require(root.resolve() == root and os.statvfs(root).f_flag & os.ST_RDONLY, 'readonly mounted input')
    authority = root / 'authority'
    require(authority.resolve() == authority and stat.S_ISDIR(authority.lstat().st_mode)
            and set(os.listdir(authority)) == set(CAPSULES), 'exact mounted capsule inventory')
    bodies = [regular(authority / name, MAX_MODULE) for name in CAPSULES]
    for body, record in zip(bodies, context['capsules']):
        require(len(body) == record['bytes'] and hashlib.sha256(body).hexdigest() == record['sha256'],
                'mounted capsule digest mismatch')
    namespace = {'__name__': 'candidate_qualification_authenticated', '__file__': str(authority / CAPSULES[1])}
    exec(compile(bodies[1], namespace['__file__'], 'exec'), namespace)
    legacy = namespace['legacy']
    with namespace['deadline_scope'](deadline):
        raw = regular(root / 'candidate-input.json', MAX_JSON)
        descriptor = namespace['validate_descriptor'](json.loads(raw))
        require(namespace['encoded'](descriptor) == raw and hashlib.sha256(raw).hexdigest() ==
                context['descriptor_sha256'], 'canonical mounted descriptor mismatch')
        rows = {row['path']: row for row in descriptor['authority']}
        for record, name in zip(context['capsules'], CAPSULES):
            require(record == {key: rows['scripts/' + name][key] for key in ('bytes', 'sha256')},
                    'descriptor capsule binding mismatch')
        views = namespace['verify_views'](descriptor, deadline)
        baseline = namespace['sdk_baseline'](descriptor, deadline)
        executable = root / 'current-test-elf'
        listing = namespace['measured_listing'](executable, deadline)
        require(listing == (descriptor['listing_sha256'], descriptor['test_count']), 'actual listing mismatch')
        work = Path('/workspace')
        info = work.lstat()
        require(work.resolve() == work and stat.S_ISDIR(info.st_mode) and info.st_uid == 1000
                and info.st_mode & 0o200 and shutil.disk_usage(work).free >= 10 * 1024**3,
                'execution volume requires owned writable space and 10 GiB free')
        if context['mode'] == 'attachment-qualification-v1':
            ready = {'schema': 'cs1618/candidate-attachment-ready/1',
                     'probe_sha256': context['probe_sha256'], 'descriptor_sha256': context['descriptor_sha256'],
                     'uid': os.getuid(), 'gid': os.getgid()}
            legacy.write_bounded(sys.stdout.buffer, namespace['encoded'](ready), deadline)
            # Never produce read-only/capture success. Parent interrupts this
            # real attachment; the unchanged absolute deadline remains a guard.
            while True:
                namespace['tick'](deadline)
                time.sleep(min(0.1, max(0, deadline - time.monotonic())))
        paths = mutation_paths(descriptor, namespace['AUTHORITY'])
        checks = []
        try:
            for index, path in enumerate(paths):
                for operation in OPERATIONS:
                    namespace['tick'](deadline)
                    observed = refuse_mutation(path, operation)
                    checks.append({'id': str(index) + ':' + operation, 'path': str(path),
                                   'operation': operation, 'errno': observed, 'rejected': True})
        finally:
            require(namespace['verify_views'](descriptor, deadline) == views
                    and namespace['sdk_baseline'](descriptor, deadline) == baseline
                    and namespace['measured_listing'](executable, deadline) == listing,
                    'complete source/SDK/ELF/listing closure changed')
            for body, name in zip(bodies, CAPSULES):
                require(regular(authority / name, MAX_MODULE) == body, 'capsule changed after qualification')
            require(regular(root / 'candidate-input.json', MAX_JSON) == raw, 'descriptor changed after qualification')
        result = {'schema': 'cs1618/candidate-readonly-probe/1', 'mode': context['mode'],
                  'complete_application_accepted': False, 'probe_sha256': context['probe_sha256'],
                  'descriptor_sha256': context['descriptor_sha256'], 'python': '3.12.3',
                  'uid': os.getuid(), 'gid': os.getgid(), 'source_root': descriptor['source_root'],
                  'source_sha256': descriptor['source_sha256'], 'executable_sha256': descriptor['executable_sha256'],
                  'listing_sha256': listing[0], 'test_count': listing[1], 'readonly_views': views,
                  'sdk_tree_sha256': namespace['digest'](baseline), 'checks': checks, 'closure_unchanged': True}
        body = namespace['encoded'](result)
        require(len(body) <= MAX_MODULE, 'bounded probe response')
        legacy.write_bounded(sys.stdout.buffer, body, deadline)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('candidate qualification probe failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
