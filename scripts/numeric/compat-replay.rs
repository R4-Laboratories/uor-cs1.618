//! Exact admitted-backend diagnostic replay; generated packages own all arithmetic.
extern crate addint16;
extern crate addint32;
extern crate addint64;
extern crate adduint32;
extern crate adduint64;
extern crate nested4;
extern crate unsignedless;
extern crate shiftuint64;
extern crate equaluint64;
#[no_mangle]
pub extern "C" fn selftest() -> u32 {
    for (a,b) in [(0,0),(-1074,2047),(-32768,-1),(32767,1),(-32768,32767)] {
        assert_eq!(addint16::addInt16(a,b),a.checked_add(b));
    }
    assert_eq!(addint32::addInt32(i32::MAX,1),None);
    assert_eq!(addint64::addInt64(i64::MIN,-1),None);
    assert_eq!(adduint32::addUInt32(u32::MAX,1),None);
    assert_eq!(adduint64::addUInt64(u64::MAX,1),None);
    for a in [0,1,17,u32::MAX-4,u32::MAX-3,u32::MAX] {
        assert_eq!(nested4::nested4(a),a.checked_add(4));
    }
    for a in [0,1,17,(1u64<<32)-1,1u64<<32,u64::MAX] {
        assert_eq!(shiftuint64::shiftUInt64(a),Some(a>>32));
        for b in [0,1,17,u64::MAX] {
            assert_eq!(unsignedless::unsignedLess(a,b),a<b);
            assert_eq!(equaluint64::equalUInt64(a,b),a==b);
        }
    }
    0
}
fn main() { assert_eq!(selftest(),0); println!("passed exact fixed arithmetic, overflow, comparison, shift and direct iteration diagnostics"); }
