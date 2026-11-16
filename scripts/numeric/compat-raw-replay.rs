//! Replay the separately preserved raw LexLean production fixture.
extern crate numeric_compat_fixedsigned as signed;
extern crate numeric_compat_comparison as comparison;
extern crate numeric_compat_iteration as iteration;
extern crate numeric_compat_constantiteration as constant;
extern crate numeric_compat_step as step;
#[no_mangle]
pub extern "C" fn selftest() -> u32 {
    assert_eq!(signed::run(2047,-1074),Some(3121));
    assert_eq!(signed::run(65535,0),None);
    assert_eq!(signed::run(32767,-1),None);
    assert!(comparison::run(-1074,0));
    assert!(!comparison::run(2047,-1074));
    assert_eq!(constant::run(0),Some(4));
    assert_eq!(constant::run(u32::MAX-3),None);
    assert_eq!(step::run(None),None);
    for n in [0,1,4,32,54,128,255] {
        assert!(matches!(iteration::run(n,1000),Ok(Some(x)) if x==1000+u32::from(n)));
        if n>0 { assert!(matches!(iteration::run(n,u32::MAX),Ok(None))); }
    }
    0
}
fn main() { assert_eq!(selftest(),0); println!("passed raw fixed signed conversion/arithmetic, comparison and bounded iterations"); }
