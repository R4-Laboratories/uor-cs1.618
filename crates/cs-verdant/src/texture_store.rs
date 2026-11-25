//! Admission of browser material storage through upstream Prism-generated kernels.
const MAX_TEXTURE_SIDE: u32 = 1024;
const PAGE_BYTES: u32 = 4096;

/// Byte extent of a tightly packed RGBA8 plane. The tensor's scalar is one byte.
#[no_mangle]
pub extern "C" fn cs_texture_span(width: u32, height: u32) -> u32 {
    if !(1..=MAX_TEXTURE_SIDE).contains(&width) || !(1..=MAX_TEXTURE_SIDE).contains(&height) {
        return 0;
    }
    let row_stride = u64::from(width) * 4;
    let layout = vtensor_layout::Adt0::C0(4, width.into(), height.into(), 1, 1, 4, row_stride, 0, 1, 1);
    match vtensor_layout::run(layout) {
        Ok(vtensor_layout::Adt1::C1(bytes)) => u32::try_from(bytes).unwrap_or(0),
        _ => 0,
    }
}

/// Select fill, sparse exceptions, packed palette or literal. Only candidates
/// strictly smaller than this page are available, including on a short last page.
#[no_mangle]
pub extern "C" fn cs_texture_page_plan(length: u32, uniform: u32, sparse: u32, packed: u32) -> i32 {
    if !(1..=PAGE_BYTES).contains(&length) || uniform > 1 || sparse == 0 || packed == 0 {
        return -1;
    }
    let candidate = |cost| u64::from(if cost < length { cost } else { PAGE_BYTES });
    let unavailable = u64::from(PAGE_BYTES);
    use vram_representation::Adt0::*;
    match vram_representation::run(uniform == 1, candidate(sparse), candidate(packed), unavailable, unavailable) {
        C0 => 0,
        C1 => 1,
        C2 => 2,
        C3 => 3,
        C4 | C5 => -1,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tensor_plane_rejects_empty_oversize_and_preserves_channel_stride() {
        assert_eq!(cs_texture_span(0, 1), 0);
        assert_eq!(cs_texture_span(1, 1025), 0);
        assert_eq!(cs_texture_span(3, 5), 60);
        assert_eq!(cs_texture_span(1024, 1024), 4 * 1024 * 1024);
    }

    #[test]
    fn short_pages_only_admit_encodings_smaller_than_the_literal() {
        assert_eq!(cs_texture_page_plan(21, 1, 4096, 4096), 0);
        assert_eq!(cs_texture_page_plan(21, 0, 4, 23), 1);
        assert_eq!(cs_texture_page_plan(21, 0, 21, 13), 2);
        assert_eq!(cs_texture_page_plan(21, 0, 21, 21), 3);
        assert_eq!(cs_texture_page_plan(0, 0, 1, 1), -1);
        assert_eq!(cs_texture_page_plan(4097, 0, 1, 1), -1);
    }
}
