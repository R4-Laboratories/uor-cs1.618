#![cfg_attr(not(feature = "std"), no_std)]
#![allow(dead_code, non_snake_case, unused_parens, unused_variables)]
extern crate alloc;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ComputeError {
    AddOverflow,
    MulOverflow,
    ShiftExponentTooLarge,
    ShiftOverflow,
    PowExponentTooLarge,
    PowOverflow,
    OutputTooSmall,
}

pub fn narrowedIsZero(a: u64) -> bool {
    { let _x_11 = core::convert::TryFrom::try_from(a).ok(); match _x_11 {
        None => { let _x_39 = 0; { let _y_16 = _x_39; { let _x_33 = 0; { let _x_22 = (_y_16 == _x_33); _x_22 } } } },
        Some(val_14) => { let prod_local_0 = val_14; { let prod_local_3 = 0; { let prod_local_4 = (prod_local_0 == prod_local_3); prod_local_4 } } },
    } }
}
