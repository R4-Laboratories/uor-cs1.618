#!/usr/bin/env python3
"""Independent exact integer/rational IEEE oracle, no host float arithmetic."""
import argparse, hashlib, json, random
from pathlib import Path

def multiply(a, b, width):
    f, eb = (23, 8) if width == 32 else (52, 11)
    bias = (1 << (eb - 1)) - 1
    em = (1 << eb) - 1
    fm = (1 << f) - 1
    sign = (a ^ b) & (1 << (width - 1))
    ea, ebits = (a >> f) & em, (b >> f) & em
    fa, fb = a & fm, b & fm
    if ea == em and fa: return a | (1 << (f - 1))
    if ebits == em and fb: return b | (1 << (f - 1))
    if ea == em or ebits == em:
        if (a & ((1 << (width - 1)) - 1)) == 0 or (b & ((1 << (width - 1)) - 1)) == 0:
            return (em << f) | (1 << (f - 1))
        return sign | (em << f)
    n = (fa + ((1 << f) if ea else 0)) * (fb + ((1 << f) if ebits else 0))
    if not n: return sign
    scale = max(ea, 1) + max(ebits, 1) - 2 * bias - 2 * f
    top = n.bit_length() - 1 + scale
    unit = max(top - f, 1 - bias - f)
    shift = unit - scale
    if shift > 0:
        q, r = divmod(n, 1 << shift)
        q += (2 * r > (1 << shift)) or (2 * r == (1 << shift) and q % 2 == 1)
    else: q = n << -shift
    if q >= (1 << (f + 1)):
        q >>= 1
        unit += 1
    exponent = unit + f + bias if q >= (1 << f) else 0
    if exponent >= em: return sign | (em << f)
    return sign | (exponent << f) | (q & fm)

def divide(a, b, width):
    """Independent exact rational division; large integers belong only to this oracle."""
    f, exponent_bits = (23, 8) if width == 32 else (52, 11)
    bias = (1 << (exponent_bits - 1)) - 1
    em, fm = (1 << exponent_bits) - 1, (1 << f) - 1
    sign_mask = 1 << (width - 1)
    sign = (a ^ b) & sign_mask
    ea, eb = (a >> f) & em, (b >> f) & em
    fa, fb = a & fm, b & fm
    inf, quiet = em << f, 1 << (f - 1)
    if ea == em and fa: return a | quiet
    if eb == em and fb: return b | quiet
    za, zb = (a & (sign_mask - 1)) == 0, (b & (sign_mask - 1)) == 0
    if (za and zb) or (ea == em and eb == em): return inf | quiet
    if ea == em or zb: return sign | inf
    if eb == em or za: return sign
    numerator = fa | ((1 << f) if ea else 0)
    denominator = fb | ((1 << f) if eb else 0)
    scale = max(ea, 1) - max(eb, 1)
    if scale >= 0: numerator <<= scale
    else: denominator <<= -scale
    top = numerator.bit_length() - denominator.bit_length()
    below = numerator < (denominator << top) if top >= 0 else (numerator << -top) < denominator
    top -= below
    unit = max(top - f, 1 - bias - f)
    if unit >= 0: denominator <<= unit
    else: numerator <<= -unit
    q, remainder = divmod(numerator, denominator)
    q += 2 * remainder > denominator or (2 * remainder == denominator and q % 2 == 1)
    if q >= 1 << (f + 1):
        q >>= 1
        unit += 1
    exponent = unit + f + bias if q >= 1 << f else 0
    if exponent >= em: return sign | inf
    return sign | (exponent << f) | (q & fm)

def division_corpus(seed=1619, count=10000):
    rng = random.Random(seed)
    rows = []
    for op, width in [(2, 32), (3, 64)]:
        f, eb = (23, 8) if width == 32 else (52, 11)
        sign, inf = 1 << (width - 1), ((1 << eb) - 1) << f
        one = ((1 << (eb - 1)) - 1) << f
        points = [0, 1, 2, 3, (1 << f)-1, 1 << f, (1 << f)+1, one-1, one,
                  one+1, one+(1 << (f-1)), one+(1 << f), inf-1, inf,
                  inf+1, inf+(1 << (f-1)), inf+(1 << (f-1))+17]
        points += [x | sign for x in points]
        pairs = [(a, b) for a in points for b in points]
        pairs += [(rng.getrandbits(width), rng.getrandbits(width)) for _ in range(count)]
        # Exact subnormal even/odd halfway ties, signed tiny zero and normal seam.
        pairs += [(1, one+(1 << f)), (3, one+(1 << f)),
                  (sign | 1, one+(1 << f)), ((1 << (f+1))-1, one+(1 << f)),
                  (one, one), (inf-1, 1), (1, inf-1)]
        for a, b in pairs: rows.append([op, f'{a:x}', f'{b:x}', f'{divide(a,b,width):x}'])
    return rows

def corpus(seed=1618, count=10000):
    rng = random.Random(seed)
    rows = []
    for op, width in enumerate((32, 64)):
        f, eb = (23, 8) if width == 32 else (52, 11)
        sign, inf = 1 << (width - 1), ((1 << eb) - 1) << f
        one = ((1 << (eb - 1)) - 1) << f
        points = [0, 1, 2, (1 << f)-1, 1 << f, (1 << f)+1, one-1, one, one+1,
                  one+(1 << (f-1)), one+(1 << (f-1))+1, one+(1 << f), inf-1, inf,
                  inf+1, inf+(1 << (f-1)), inf+(1 << (f-1))+17]
        points += [x | sign for x in points]
        pairs = [(a,b) for a in points for b in points]
        pairs += [(rng.getrandbits(width),rng.getrandbits(width)) for _ in range(count)]
        # Exact halfway ties: min subnormal * 0.5, 3*min subnormal * 0.5.
        pairs += [(1, one-(1 << f)), (3, one-(1 << f)), (inf-1, one+1),
                  (sign | 1, one-(1 << f)), (one+3, one+(1 << (f-1)))]
        for a,b in pairs: rows.append([op, f'{a:x}', f'{b:x}', f'{multiply(a,b,width):x}'])
    return rows

if __name__ == '__main__':
    p=argparse.ArgumentParser(); p.add_argument('--output', default='artifacts/numeric/vectors.json'); p.add_argument('--include-division', action='store_true'); args=p.parse_args()
    rows=corpus()+(division_corpus() if args.include_division else []); out=Path(args.output); out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps({'schema':1,'seed':1618,'random_per_format':10000,'vectors':rows},separators=(',',':'))+'\n')
    print(json.dumps({'vectors':len(rows),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
