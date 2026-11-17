//! Direct-Option canonical ABI only: every arithmetic operation is in the unmodified emitted packages.
extern crate numeric_mul32;
extern crate numeric_mul64;
extern crate numeric_div32;
extern crate numeric_div64;
static mut LAST: u64 = 0;

pub fn classify<T, E>(value: Result<Option<T>, E>) -> Result<T, u32> {
    match value { Ok(Some(bits)) => Ok(bits), Ok(None) | Err(_) => Err(2) }
}

pub fn classify_option<T>(value: Option<T>) -> Result<T, u32> {
    match value { Some(bits) => Ok(bits), None => Err(2) }
}

pub fn invoke(op: u32, a: u64, b: u64) -> Result<u64, u32> {
    match op {
        0 => {
            if a > u32::MAX as u64 || b > u32::MAX as u64 { return Err(3); }
            classify_option(numeric_mul32::mul32(a as u32, b as u32)).map(u64::from)
        }
        1 => classify_option(numeric_mul64::mul64(a, b)),
        2 => {
            if a > u32::MAX as u64 || b > u32::MAX as u64 { return Err(3); }
            classify_option(numeric_div32::div32(a as u32, b as u32)).map(u64::from)
        }
        3 => classify_option(numeric_div64::div64(a, b)),
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
