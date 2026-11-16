#!/usr/bin/env python3
"""Fail-closed custody checks; negative controls never overwrite genuine artifacts."""
import copy,hashlib,json
from pathlib import Path

def validate(m):
    result=json.loads(Path(m['bundle'],'result.json').read_text())
    assert result['result_id']==m['result_id'],'bundle identity'
    assert result['source']==m['source'],'source identity'
    assert result['compiler']==m['compiler'],'compiler identity'
    assert [r['outputs'][0]['target'] for r in result['roots']]==m['targets'],'target identity'
    for name,digest in m['files'].items():
        assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==digest,f'byte custody: {name}'

if __name__=='__main__':
    m=json.loads(Path('artifacts/numeric/manifest.json').read_text()); validate(m)
    mutations={
      'source':lambda x:x['source'].__setitem__('source_id','0'*64),
      'target':lambda x:x['targets'][0].__setitem__('digest','0'*64),
      'bundle':lambda x:x.__setitem__('result_id','0'*64),
      'output':lambda x:x['files'].__setitem__('artifacts/numeric/numeric.wasm','0'*64),
    }
    for name,mutate in mutations.items():
        changed=copy.deepcopy(m); mutate(changed)
        try: validate(changed)
        except AssertionError as e: print(f'REFUSED {name}: {e}')
        else: raise AssertionError(f'{name} mutation accepted')
    print('PASS genuine custody and four negative controls')
