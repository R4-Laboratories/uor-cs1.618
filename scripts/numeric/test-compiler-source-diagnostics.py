#!/usr/bin/env python3
"""Run focused diagnostic shell tests without downloading an SDK or tools.

Requires Linux, bubblewrap, and unprivileged namespaces. The real wrapper/helper
run with fake SDK commands in temporary mount and network namespaces. Download
hashes/extraction are mocked; original-file identity checks use real sha256sum.
"""
import os
from pathlib import Path
import subprocess
import tempfile
import tarfile

REPO = Path(__file__).resolve().parents[2]
BWRAP = [
    'bwrap', '--unshare-user', '--unshare-pid', '--unshare-net',
    '--ro-bind', '/usr', '/usr', '--ro-bind', '/etc', '/etc',
    '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib',
    '--symlink', 'usr/lib64', '/lib64', '--proc', '/proc', '--dev', '/dev',
]

def put(path, body, executable=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body)
    if executable:
        path.chmod(0o755)

def fixture(root):
    for name in ['source/lean', 'source/rust', 'game/scripts/numeric', 'evidence', 'sdk/bin', 'cache/registry', 'cache/git', 'inventory', 'tmp']:
        (root / name).mkdir(parents=True, exist_ok=True)
    put(root/'source/rust/Cargo.lock', 'original lock\n')
    put(root/'inventory/inventory.json', '{"mock":true}\n')
    for name in ['lean','rustc','node','wasm-tools']:
        put(root/f'sdk/bin/{name}', '#!/bin/bash\necho "mock '+name+'"\n', True)
    put(root/'sdk/bin/elan', '#!/bin/bash\necho /sdk/bin/lean\n', True)
    put(root/'sdk/bin/rustup', '#!/bin/bash\necho "/sdk/bin/$2"\n', True)
    put(root/'sdk/bin/git', '#!/bin/bash\nexit 0\n', True)
    put(root/'sdk/bin/lake', '''#!/bin/bash
if [[ $1 == --version ]]; then echo 'mock lake'; exit; fi
echo preflight >> /evidence/events
exit "${PREFLIGHT_STATUS:-0}"
''', True)
    put(root/'sdk/bin/cargo', '''#!/bin/bash
if [[ $1 == -V ]]; then echo 'mock cargo'; exit; fi
echo "cargo-$1" >> /evidence/events
if [[ $1 == install ]]; then
  mkdir -p /tmp/compiler-test-tools/bin
  printf '#!/bin/bash\necho mock-rg\n' > /tmp/compiler-test-tools/bin/rg
  chmod +x /tmp/compiler-test-tools/bin/rg
  touch /tmp/compiler-test-tools/.crates.toml
fi
exit 0
''', True)
    put(root/'source/scripts/check-numeric-conversion.sh', '''#!/bin/bash
set -euo pipefail
echo focused >> /evidence/events
mkdir -p output/numeric
printf 'generated evidence\n' > output/numeric/generated.txt
exit "${FOCUSED_STATUS:-0}"
''', True)
    put(root/'source/scripts/check-numeric-source-stage.sh', '''#!/bin/bash
set -euo pipefail
echo broader >> /evidence/events
exit "${BROADER_STATUS:-0}"
''', True)
    put(root/'game/scripts/numeric/prepare-compiler-test-tools.sh', '''#!/bin/bash
set -euo pipefail
echo preparation >> /evidence/events
export WASM_PACK_CACHE=/tmp/compiler-test-tools/wasm-pack-cache
mkdir -p "$WASM_PACK_CACHE"
echo helper-cache > "$WASM_PACK_CACHE/entry"
if [[ ${MUTATE_LOCK:-0} == 1 ]]; then echo changed >> /source/rust/Cargo.lock; fi
if [[ ${MUTATE_TOOL:-0} == 1 ]]; then echo changed >> /sdk/bin/wasm-tools; fi
if [[ ${FAIL_ARCHIVE:-0} == 1 ]]; then printf '#!/bin/bash\nexit 66\n' > /tmp/compiler-test-tools/bin/tar; chmod +x /tmp/compiler-test-tools/bin/tar; fi
bash -c 'exit "${PREPARATION_STATUS:-0}"'
echo preparation-finished >> /evidence/events
''', True)

def run(root, command, **env):
    bindings = []
    for source, target in [('source','/source'),('game','/game'),('evidence','/evidence'),('sdk','/sdk'),('cache','/cache'),('inventory','/opt/prismpm/share'),('tmp','/tmp')]:
        bindings += ['--bind',str(root/source),target]
    setting = dict(os.environ, PATH='/sdk/bin:/usr/bin:/bin', CARGO_HOME='/cache', **env)
    return subprocess.run(BWRAP+bindings+['--chdir','/source']+command, env=setting, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=30)

def wrapper_case(name, expected, **env):
    with tempfile.TemporaryDirectory(prefix='compiler-diag-') as tmp:
        root=Path(tmp)
        fixture(root)
        put(root/'game/scripts/numeric/check-compiler-source-stage.sh', (REPO/'scripts/numeric/check-compiler-source-stage.sh').read_text(), True)
        result=run(root, ['bash','/game/scripts/numeric/check-compiler-source-stage.sh'], **env)
        events=(root/'evidence/events').read_text().splitlines() if (root/'evidence/events').exists() else []
        failures=[]
        def check(ok, message):
            if not ok: failures.append(message)
        check(result.returncode == expected, f'exit {result.returncode}, expected {expected}')
        check((root/'evidence/workflow-exit-code.txt').read_text().strip() == str(expected) if (root/'evidence/workflow-exit-code.txt').exists() else False, 'wrong final exit evidence')
        if env.get('PREFLIGHT_STATUS','0') != '0':
            check(events == ['preflight'], f'ran downstream: {events}')
            check((root/'evidence/compiler-preflight-exit-code.txt').read_text().strip()==env['PREFLIGHT_STATUS'] if (root/'evidence/compiler-preflight-exit-code.txt').exists() else False, 'missing preflight exit')
        else:
            check(events.index('focused') < events.index('cargo-install'), f'focus after unrelated helpers: {events}')
            check((root/'evidence/focused-exit-code.txt').read_text().strip() == env.get('FOCUSED_STATUS','0') if (root/'evidence/focused-exit-code.txt').exists() else False, 'wrong focused exit evidence')
            if env.get('FAIL_ARCHIVE','0') == '0':
                archive=root/'evidence/focused-generated-evidence.tar.gz'
                check(archive.exists(), 'lost generated evidence')
                if archive.exists():
                    with tarfile.open(archive) as retained:
                        check(retained.extractfile('output/numeric/generated.txt').read()==b'generated evidence\n', 'changed archived output')
            check((root/'evidence/test-tools/wasm-pack-cache.sha256').exists(), 'missing helper-cache hashes')
            if env.get('PREPARATION_STATUS','0') != '0':
                check('preparation-finished' not in events and 'broader' not in events, 'sourced helper ignored errexit')
                check('stage=test-tool-preparation' in (root/'evidence/test-tool-preparation.log').read_text(), 'missing helper stage diagnostic')
            elif env.get('MUTATE_TOOL','0') == '1':
                check('broader' not in events, 'ran gates after SDK identity mismatch')
            else:
                check('broader' in events, 'missing broader gates')
                check((root/'evidence/source-stage-exit-code.txt').read_text().strip() == env.get('BROADER_STATUS','0') if (root/'evidence/source-stage-exit-code.txt').exists() else False, 'wrong broader exit evidence')
        check((root/'evidence/finalization.log').exists(), 'missing finalization log')
        if (root/'evidence/finalization.log').exists():
            finalization=(root/'evidence/finalization.log').read_text()
            check('rust/Cargo.lock:' in finalization and '/sdk/bin/wasm-tools:' in finalization, 'final identity checks skipped')
        if env.get('MUTATE_LOCK','0') == '1' or env.get('MUTATE_TOOL','0') == '1':
            check('FAILED' in (root/'evidence/finalization.log').read_text() if (root/'evidence/finalization.log').exists() else False, 'identity mutation not detected')
        if failures:
            raise AssertionError(name+': '+ '; '.join(failures)+'\n'+result.stdout)
        print(f'PASS {name}: exit={result.returncode}, events={events}')

def helper_case(name, decoy=False, missing=False, symlink=False):
    with tempfile.TemporaryDirectory(prefix='compiler-helper-') as tmp:
        root=Path(tmp)
        fixture(root)
        canonical='/sdk/bin/wasm-tools'
        if symlink:
            canonical='/sdk/actual/wasm-tools'
            (root/'sdk/actual').mkdir()
            (root/'sdk/bin/wasm-tools').rename(root/'sdk/actual/wasm-tools')
            (root/'sdk/bin/wasm-tools').symlink_to(canonical)
        if missing:
            (root/'sdk/bin/wasm-tools').unlink()
        if decoy:
            put(root/'cache/bin/wasm-tools', '#!/bin/bash\necho decoy\n', True)
        put(root/'game/scripts/numeric/prepare-compiler-test-tools.sh', (REPO/'scripts/numeric/prepare-compiler-test-tools.sh').read_text(), True)
        put(root/'sdk/bin/curl', r'''#!/bin/bash
echo download >> /evidence/events
while [[ $# -gt 0 ]]; do
  if [[ $1 == -o ]]; then touch "$2"; exit; fi
  shift
done
exit 1
''', True)
        put(root/'sdk/bin/sha256sum', r'''#!/bin/bash
# Fake download hashes only: no network or real archives enter this harness.
if [[ $1 == -c && $2 == - ]]; then cat >/dev/null; echo mock-download-check; exit; fi
exec /usr/bin/sha256sum "$@"
''', True)
        put(root/'sdk/bin/tar', r'''#!/bin/bash
while [[ $# -gt 0 ]]; do
  if [[ $1 == -C ]]; then destination=$2; break; fi
  shift
done
mkdir -p "$destination/bin"
for tool in wasm-pack wasm-bindgen; do
  printf '#!/bin/bash\nexit 0\n' > "$destination/$tool"
  chmod +x "$destination/$tool"
done
for tool in wasm-opt java; do
  printf '#!/bin/bash\nexit 0\n' > "$destination/bin/$tool"
  chmod +x "$destination/bin/$tool"
done
''', True)
        put(root/'sdk/bin/python3', r'''#!/bin/bash
if [[ $1 == -m ]]; then
  mkdir -p /tmp/compiler-test-tools/kotlin/kotlinc/bin
  touch /tmp/compiler-test-tools/kotlin/kotlinc/bin/kotlinc
else
  cat >/dev/null
fi
''', True)
        put(root/'sdk/bin/cargo', '#!/bin/bash\nexit 58\n', True)
        result=run(root, ['bash','/game/scripts/numeric/prepare-compiler-test-tools.sh'])
        if missing:
            assert result.returncode != 0, result.stdout
            assert not (root/'evidence/events').exists(), 'download attempted without original tool'
            assert 'stage=test-tool-preparation/resolve-sdk-wasm-tools' in result.stdout, result.stdout
        else:
            assert result.returncode == 58, result.stdout
            link=root/'tmp/compiler-test-tools/cargo-home/bin/wasm-tools'
            assert link.is_symlink() and os.readlink(link)==canonical, result.stdout
            assert (root/'evidence/test-tools/original-wasm-tools-path.txt').read_text().strip()==canonical
            identity=run(root, ['sha256sum','-c','/evidence/test-tools/original-wasm-tools.sha256'])
            assert identity.returncode == 0, identity.stdout
            assert 'stage=test-tool-preparation/fixture-dependencies' in result.stdout and 'line=' in result.stdout, result.stdout
        print(f'PASS {name}: exit={result.returncode}')

if __name__ == '__main__':
    wrapper_case('preflight failure stops downstream', 31, PREFLIGHT_STATUS='31')
    wrapper_case('setup failure retains focus and original exit', 43, PREPARATION_STATUS='43')
    wrapper_case('focused evidence survives later setup failure', 43, FOCUSED_STATUS='27', PREPARATION_STATUS='43')
    wrapper_case('focused failure survives successful broader gates', 27, FOCUSED_STATUS='27')
    wrapper_case('broader failure retained', 35, BROADER_STATUS='35')
    wrapper_case('successful execution', 0)
    wrapper_case('cleanup failure fails success', 1, MUTATE_LOCK='1')
    wrapper_case('SDK tool identity mutation fails success', 1, MUTATE_TOOL='1')
    wrapper_case('cleanup failure preserves earlier error', 43, PREPARATION_STATUS='43', MUTATE_LOCK='1')
    wrapper_case('archive failure still checks identities and cache', 66, FAIL_ARCHIVE='1')
    wrapper_case('archive failure preserves setup failure', 43, PREPARATION_STATUS='43', FAIL_ARCHIVE='1')
    helper_case('PATH executable preserved with separate cache root')
    helper_case('PATH symlink resolves to canonical SDK file', symlink=True)
    helper_case('PATH executable preferred to cache-home decoy', decoy=True)
    helper_case('missing original PATH tool fails before downloads', missing=True)
