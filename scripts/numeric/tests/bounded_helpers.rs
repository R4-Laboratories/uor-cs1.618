//! Independent controls for actual emitted helper packages, native and Wasm.
extern crate bounded_signedless as compare;
extern crate bounded_unsignedless as unsigned;
extern crate bounded_lengthstep as step;
extern crate bounded_length as length;
extern crate bounded_round as round;
extern crate bounded_multiply as multiply;

extern crate bounded_convertuint64touint8 as cu64_u8;
extern crate bounded_convertuint64touint16 as cu64_u16;
extern crate bounded_convertuint64touint32 as cu64_u32;
extern crate bounded_convertuint32touint64 as cu32_u64;
extern crate bounded_convertuint8toint16 as cu8_i16;
extern crate bounded_convertuint16toint16 as cu16_i16;
extern crate bounded_convertint16touint8 as ci16_u8;
extern crate bounded_convertint16touint16 as ci16_u16;
extern crate bounded_convertint16touint32 as ci16_u32;
extern crate bounded_convertint16touint64 as ci16_u64;
// ABI-only record/tuple bridge for the independent counter oracle.
fn length_step(state: Option<(u32,i16)>) -> Option<(u32,i16)> {
    step::run(state.map(|(word,count)| step::Adt0::C0(word,count)))
        .map(|step::Adt0::C0(word,count)| (word,count))
}
fn limbs(x: u128) -> [u32; 4] {
    [x as u32, (x >> 32) as u32, (x >> 64) as u32, (x >> 96) as u32]
}
fn rounded(x: u128, amount: i16) -> Option<u64> {
    // Independent quotient/remainder RNE oracle; no generated helper calls.
    if amount < 0 {
        let shift = amount.checked_neg()? as u32;
        return u64::try_from(x).ok()?.checked_shl(shift);
    }
    if amount > 128 { return Some(0); }
    if amount == 128 { return Some(u64::from(x > (1u128 << 127))); }
    if amount == 0 { return u64::try_from(x).ok(); }
    let shift = amount as u32;
    let quotient = u64::try_from(x >> shift).ok()?;
    let remainder = x & ((1u128 << shift) - 1);
    let half = 1u128 << (shift - 1);
    quotient.checked_add(u64::from(remainder > half || (remainder == half && quotient & 1 == 1)))
}
fn check_round(x: u128, amount: i16) {
    let [a,b,c,d] = limbs(x);
    assert_eq!(round::run(a,b,c,d,amount), rounded(x,amount), "round {x} by {amount}");
}
fn check_length(x: u128) {
    let [a,b,c,d] = limbs(x);
    assert_eq!(length::run(a,b,c,d), Some((128-x.leading_zeros()) as i16));
}
fn check_product(a: u64, b: u64) {
    let multiply::Adt0::C0(l0,l1,l2,l3) = multiply::run(a,b).expect("full product fits limbs");
    assert_eq!([l0,l1,l2,l3], limbs(u128::from(a)*u128::from(b)));
}
fn random(state: &mut u64) -> u64 {
    *state ^= *state << 13; *state ^= *state >> 7; *state ^= *state << 17;
    *state
}
#[no_mangle]
pub extern "C" fn selftest() -> u32 {
    let corners = [i16::MIN, i16::MIN+1, -3117, -1078, -128, -1, 0, 1, 128, 1078, 4092, i16::MAX-1, i16::MAX];
    // Every left operand, corner right operands, equality and immediate neighbors.
    for ai in i32::from(i16::MIN)..=i32::from(i16::MAX) {
        let a = ai as i16;
        assert!(!compare::run(a,a));
        for b in corners { assert_eq!(compare::run(a,b), a < b, "compare {a} {b}"); }
        if a != i16::MAX { assert!(compare::run(a,a+1)); }
        if a != i16::MIN { assert!(!compare::run(a,a-1)); }
    }
    // Conversion signatures must retain both ends, especially discarded-payload
    // sign tests and the original format-field narrowing at 256/65536.
    for value in [0,1,255,256,32767,32768,65535,65536,u32::MAX as u64,u32::MAX as u64+1,u64::MAX] {
        assert_eq!(cu64_u8::run(value),u8::try_from(value).ok());
        assert_eq!(cu64_u16::run(value),u16::try_from(value).ok());
        assert_eq!(cu64_u32::run(value),u32::try_from(value).ok());
    }
    for value in [0,1,u32::MAX] { assert_eq!(cu32_u64::run(value),Some(u64::from(value))); }
    for value in u8::MIN..=u8::MAX { assert_eq!(cu8_i16::run(value),Some(i16::from(value))); }
    for value in u16::MIN..=u16::MAX { assert_eq!(cu16_i16::run(value),i16::try_from(value).ok()); }
    for value in i16::MIN..=i16::MAX {
        assert_eq!(ci16_u8::run(value),u8::try_from(value).ok());
        assert_eq!(ci16_u16::run(value),u16::try_from(value).ok());
        assert_eq!(ci16_u32::run(value),u32::try_from(value).ok());
        assert_eq!(ci16_u64::run(value),u64::try_from(value).ok());
    }
    assert_eq!(length_step(None),None);
    for count in corners {
        for word in [0,1,2,3,u32::MAX] {
            let expected = if word == 0 {Some((0,count))} else {count.checked_add(1).map(|n|(word>>1,n))};
            assert_eq!(length_step(Some((word,count))),expected);
        }
    }
    assert_eq!(length_step(Some((1,i16::MAX))),None);
    assert_eq!(length_step(Some((0,i16::MAX))),Some((0,i16::MAX)));
    let unsigned_corners = [0, 1, 2, (1u64<<32)-1, 1u64<<32, (1u64<<63)-1, 1u64<<63, u64::MAX-1, u64::MAX];
    for a in unsigned_corners {
        for b in unsigned_corners { assert_eq!(unsigned::run(a,b), a<b); }
    }
    check_length(0); check_length(u128::MAX);
    for bit in 0..128 { check_length(1u128<<bit); check_length((1u128<<bit)-1); }
    for amount in i32::from(i16::MIN)..=i32::from(i16::MAX) {
        for value in [0,1,u128::from(u64::MAX),1u128<<127,u128::MAX] { check_round(value,amount as i16); }
    }
    // Boundary ties, sticky bits and increment overflow, including amount 128.
    for bit in 0..128 {
        for delta in [-1i8,0,1] {
            let center = 1u128 << bit;
            let value = if delta < 0 {center-1} else {center+delta as u128};
            for amount in [0,1,2,31,32,63,64,65,127,128,129] {check_round(value,amount);}
        }
    }
    for value in [u64::MAX-1,u64::MAX,u64::MAX/2,0,1,2,3,1<<32,(1<<32)-1] {
        for other in [u64::MAX-1,u64::MAX,u64::MAX/2,0,1,2,3,1<<32,(1<<32)-1] {check_product(value,other);}
    }
    let mut state = 0x6a09e667f3bcc909;
    for _ in 0..4096 {
        let a=random(&mut state); let b=random(&mut state);
        assert_eq!(unsigned::run(a,b), a<b);
        assert_eq!(unsigned::run(b,a), b<a);
        assert!(!unsigned::run(a,a));
        check_product(a,b);
        let x=(u128::from(a)<<64)|u128::from(b);
        check_length(x);
        for amount in [0,1,2,31,32,63,64,65,96,127,128,129,-1,-63,-64,i16::MIN] {check_round(x,amount);}
    }
    0
}
fn main() { assert_eq!(selftest(),0); println!("passed full-domain Int16 comparison/round controls, checked counter refusal, 0..128 lengths and full UInt64 products"); }
