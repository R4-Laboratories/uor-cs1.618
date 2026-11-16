#[path = "wasm.rs"]
mod abi;
use std::io::{self, BufRead};
fn main() {
    // Planted explicit and generated failure-shaped results cannot become successful zero.
    assert_eq!(abi::classify::<u64, ()>(Ok(None)), Err(2));
    assert_eq!(abi::classify::<u64, ()>(Err(())), Err(2));
    assert_eq!(abi::classify::<u64, ()>(Ok(Some(0))), Ok(0));
    assert_eq!(abi::numeric_run(1, 0x3ff0000000000000, 0x4000000000000000), 0);
    let prior = abi::numeric_result();
    assert_eq!(abi::numeric_run(2, 0, 0), 1);
    assert_eq!(abi::numeric_run(0, 1 << 32, 0), 3);
    assert_eq!(abi::numeric_result(), prior);
    for line in io::stdin().lock().lines() {
        let line = line.expect("corpus read");
        let fields: Vec<_> = line.split_whitespace().collect();
        assert_eq!(fields.len(), 4);
        let op: u32 = fields[0].parse().expect("op");
        let a = u64::from_str_radix(fields[1], 16).expect("a");
        let b = u64::from_str_radix(fields[2], 16).expect("b");
        let expected = u64::from_str_radix(fields[3], 16).expect("expected");
        let status = abi::numeric_run(op, a, b);
        assert_eq!(status, 0, "generated failure: {line}");
        assert_eq!(abi::numeric_result(), expected, "oracle mismatch: {line}");
        // A second, independent native IEEE comparison excludes host-specific NaN payload choices.
        if op == 0 {
            let host = f32::from_bits(a as u32) * f32::from_bits(b as u32);
            if !host.is_nan() { assert_eq!(u64::from(host.to_bits()), expected, "host: {line}"); }
            else { assert!(f32::from_bits(expected as u32).is_nan()); }
        } else {
            let host = f64::from_bits(a) * f64::from_bits(b);
            if !host.is_nan() { assert_eq!(host.to_bits(), expected, "host: {line}"); }
            else { assert!(f64::from_bits(expected).is_nan()); }
        }
        println!("{op} {a:x} {b:x} {expected:x}");
    }
}
