# Bounded exponent reconnaissance (reconstructed)

This report reconstructs analysis retained from the pre-reset review of `prism/numeric/src/{Float,Wide,Bounds}.lex.tex` and the Task 2 report. The restored arithmetic source was spot-checked for the same exponent formulas and helper signatures. This recovery performed no build, export, conformance run, or formal exponent proof. Bounds below are mathematical source analysis, not new LexLean theorems.

## Decision and scope

Every mathematical `Int` intermediate reachable from the four raw roots fits **Int16**. Across the present root computations the extrema are **−3117..4092**, including unnamed arithmetic intermediates and explicit negations. Int32 is unnecessary for these roots. The parent approved checked Int16 narrowing with documented helper domains, full UInt64×UInt64 Limbs multiplication, full-domain signed comparison checks, and preservation of negative round helper behavior/minimum-negation refusal.

Use checked fixed arithmetic and propagate failures. This report does not establish compiler admission of any primitive or justify wraparound/casts that discard failure. Shared helper signatures must state their narrower domain explicitly; root reachability does not bound an arbitrary mathematical Int parameter.

A full-domain Int16 comparison can inspect the sign bit with `bit_and 0x8000`/equality and attempt checked signed subtraction `a-b`: on success use the difference's sign; on subtraction overflow use the sign of `a`. Overflow occurs only for opposite signs, so the fallback gives the mathematical order. Validate minimum/maximum, equality, same-sign and both opposite-sign directions. Generic fixed signed `less_than` had exporter problems and is not assumed admitted here.

If signed representation cannot be admitted, biased UInt16 `E(x)=x+4096` covers every root intermediate. Compare through unsigned checked subtraction (`None` iff `<`); negate by `8192-E(x)`; add by `E(x)+E(y)-4096`; subtract by `E(x)+4096-E(y)`. Preserve this operation order and checked failures; reject encoded values outside `0..8192` when exposing this bounded helper domain. This remains a fallback, not a request to change the approved Int16 design.

## Root bounds

All ranges are inclusive and give tight extrema unless marked conservative. Let `p=f+1`, `M` be maximum finite stored exponent, `B` bias, and `emin=1-B`:

| Format | f | p | M | B | emin |
|---|---:|---:|---:|---:|---:|
| binary32 | 23 | 24 | 254 | 127 | −126 |
| binary64 | 52 | 53 | 2046 | 1023 | −1022 |

Within an arithmetic branch, operands are finite and nonzero. `x=max(storedExponent,1)` ranges `1..M`; integer significand `m` ranges `1..2^p-1`. A normal operand has height `p`; a subnormal has `x=1` and height `1..f`. Keeping those correlations is essential for tight bounds.

### Multiplication (`bits32`, `bits64`)

| Int expression/value | binary32 | binary64 |
|---|---:|---:|
| `xa`, `xb` | 1..254 | 1..2046 |
| `-xb` | −254..−1 | −2046..−1 |
| `xa-(-xb)` | 2..508 | 2..4092 |
| `scale=xa+xb-(2B+2f)` | −298..208 | −2148..1942 |
| `-scale` | −208..298 | −1942..2148 |
| product `height` | 1..48 | 1..106 |
| `top=height-1` | 0..47 | 0..105 |
| `exponent=top+scale` | −298..255 | −2148..2047 |
| `normalShift=top-f` | −23..24 | −52..53 |
| `subShift=(emin-f)-scale` | −357..149 | −3016..1074 |
| `amount=max(normalShift,subShift)` | **0..149** | **0..1074** |
| `exponent+1` when carry branch executes | −125..255 | −1021..2047 |
| `adjusted` | −298..255 | −2148..2047 |
| `adjusted+B` when normal packing branch executes | 1..382 | 1..3070 |
| `expbits` | 0..382 | 0..3070 |
| `expbits` after finite-output guard | 0..254 | 0..2046 |

The exact nonzero product is at most `(2^p-1)^2`, with top index at most `2p-1`. Two minimum subnormals attain the minimum exponent; two maximum finite operands attain the maximum. If `normalShift<0`, product height is below `p`, so neither operand can be normal: both have `x=1`, making `subShift` positive. Therefore multiplication never reaches the negative `Wide.round` branch. Amount zero is attained using a high-exponent normal power of two and a minimum subnormal.

RNE can carry into the next binade, but the maximum-finite square is farther than half an ulp below the next power of two: adjusted maximum remains 255/2047, not 256/2048. The significand pair `(2^f+1, 2^(f+1)-2)` has product `2^(2f+1)-2`; suitable exponent sums witness both endpoints of the conditional carry row. Underflow rounding cannot trigger `rounded==2^p`. Rounded significands range `0..2^p`.

### Division (`divBits32`, `divBits64`)

| Int expression/value | binary32 | binary64 |
|---|---:|---:|
| `xa`, `xb` | 1..254 | 1..2046 |
| operand heights `ha`, `hb` | 1..24 | 1..53 |
| `p-ha`, `p-hb` before conversion to UInt32 | 0..23 | 0..52 |
| `xa-xb` | −253..253 | −2045..2045 |
| `hb-ha` | −23..23 | −52..52 |
| `delta=(xa-xb)-(hb-ha)` | −276..276 | −2097..2097 |
| `delta-1` when `below` executes | −277..274 | −2098..2095 |
| `exponent` | −277..276 | −2098..2097 |
| `subShift=(3-B)-exponent` | −400..153 | −3117..1078 |
| `amount=max(2,subShift)` | 2..153 | 2..1078 |
| `adjusted` | −277..276 | −2098..2097 |
| `adjusted+B` when normal packing branch executes | 1..403 | 1..3120 |
| `expbits` | 0..403 | 0..3120 |
| `expbits` after finite-output guard | 0..254 | 0..2046 |

`x+h` ranges `2..M+p`, giving the delta extrema. In the `below` branch, normalized denominator cannot be exactly `2^f`, so its original significand height is at least two. That lowers the branch's maximum delta by one before the explicit decrement. Minimum subnormal divided by maximum finite attains the minimum exponent; reversing them attains the maximum.

Normalized integers `na,nb` lie in `[2^f,2^p-1]`. The final normalized ratio R is `na/nb` when `na>=nb`, otherwise `2na/nb`. The first case gives `R<=2-2^-f`; the second gives `R<=2-2/(2^p-1)<2-2^-f`. Thus normal RNE cannot produce `2^p`, and underflow shifts only lower the result. **Division's `rounded==2^p` carry branch is mathematically unreachable.** Its `exponent+1` expression has no executed reachable values. Keeping checked Int16 addition there is safe; even its unconditional conservative range is −276..277 / −2097..2098. The jammed quotient has exactly 26/55 bits; rounded significands range `0..2^p-1`.

## Shared helper domains and explicit refusal

| Helper | Root-reachable bound | Wider declared domain / adaptation requirement |
|---|---|---|
| `length32` | Counter starts zero; after k of 32 steps it is `0..k`; result `0..32`. | All UInt32 inputs satisfy these initialized-loop bounds. UInt8 would suffice for count. |
| `lengthStep` | Counter at most31 before a needed increment; result at most32. | Original counter is arbitrary **Int**, so a direct call has unbounded `c` or `c+1`. Int16 explicitly narrows the signature; increment must be checked and refuse overflow. |
| `length` | Product height `1..48` / `1..106`; operand embedding height `1..24` / `1..53`. | All Limbs inputs yield `0..128`. Selected nonzero high-limb length `n` is `1..32`, so offset branches yield `33..64`, `65..96`, `97..128`. Preserve the full Limbs domain. |
| `from64` then length | Quotient height 26/55. | General UInt64 embedding has height `0..64`. |
| `multiply` then length | Root significands as above. | General UInt64×UInt64 product can be zero or have height up to128. Preserve full multiplication and four UInt32 limbs. |
| `round(w,amount)` | Amounts `0..1078` overall, always nonnegative. | Original `amount:Int` is unbounded. Negative `-amount` is unbounded; all positive `amount>128` return zero; `0..128` converts to UInt8. An Int16 signature is explicit narrowing. Retain the full Int16 negative branch, checked negation/conversion/shift, and minimum-negation refusal. |

The `amount>128` zero branch is exact for a 128-bit w. At exactly128 the ordinary rounding loop must retain guard/sticky and tie-to-even behavior. Division always shifts at least two bits, keeping jammed bit0 below the guard. Preserve exactly one RNE rounding step.

`quotient32/64` and `divideStep` have no Int intermediates, but arbitrary UInt64 arguments need not satisfy their normalized-caller invariant. Preconditions `b>0` and `b<=a<2b` support the documented quotient interpretation. Keep checked doubling/addition/subtraction failures. Only the deliberate unsigned remainder subtraction uses `None` as the comparison “below divisor”; other arithmetic failures propagate. If exposed as general division APIs, add explicit precondition refusal instead of claiming this interpretation for every declared input.

The f32 UInt64-taking internal helpers require clean f32 raw inputs for their API policy; public UInt32 roots/ABI checks own that constraint. It is separate from the exponent bounds.

## Proof status and public behavior

`Bounds.lex.tex` contains conditional Nat linear bounds for limb addition, cell addition, doubled remainder, reduced remainder given its subtraction equation, and one quotient step. Audited axiom lists are `[Quot.sound, propext]`. These do **not** establish the exponent tables, initialized length-loop invariant, nonnegative root round amounts, unreachable division carry, whole quotient invariant, universal failure absence, or universal IEEE correctness. No such formal exponent proof is claimed here.

The fixed-type adaptation must preserve raw roots and status behavior: RNE, gradual underflow, XOR signed zero, NaN precedence/payload quieting, arithmetic failure/status2, f32 high-bit rejection/status3, and prior-result retention after failure. Documented helper-domain narrowing and checked refusal are required; root-only mathematical bounds do not authorize removing helper failure paths.
