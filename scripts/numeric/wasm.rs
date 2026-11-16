//! ABI only: every arithmetic operation is in the unmodified emitted packages.
extern crate numeric_mul32;
extern crate numeric_mul64;
static mut LAST: u64 = 0;

pub fn classify<T, E>(value: Result<Option<T>, E>) -> Result<T, u32> {
    match value { Ok(Some(bits)) => Ok(bits), Ok(None) | Err(_) => Err(2) }
}

pub fn invoke(op: u32, a: u64, b: u64) -> Result<u64, u32> {
    match op {
        0 => {
            if a > u32::MAX as u64 || b > u32::MAX as u64 { return Err(3); }
            classify(numeric_mul32::run(a as u32, b as u32)).map(u64::from)
        }
        1 => classify(numeric_mul64::run(a, b)),
        _ => Err(1),
    }
}

#[no_mangle]
pub extern "C" fn numeric_run(op: u32, a: u64, b: u64) -> u32 {
    match invoke(op, a, b) {
        Ok(bits) => { unsafe { LAST = bits; } 0 }
        Err(status) => status,
    }
}

/// The caller must check numeric_run == 0 before reading this buffer.
#[no_mangle]
pub extern "C" fn numeric_result() -> u64 { unsafe { LAST } }
