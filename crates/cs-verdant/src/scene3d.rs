//! Bounded HD geometry and camera/governor bridges to the pinned Verdant Prism kernels.
use std::cell::RefCell;
use verdant_core::{
    camera::{CameraMode, CameraRigConfig, LawfulCameraRig},
    ecs::{EntityRole, SceneWorld, Transform, TwoLevelBvh},
    geometry::ProceduralMesh,
    hd_world::{
        generate_parabolic_arch_bridge_mesh, generate_sculpted_canopy_tree_mesh,
        generate_vaulted_citadel_hall_mesh,
    },
    math::{Aabb, Vec3},
    runtime::{BrowserCapabilities, EngineConfig, OntologicalRuntimeGovernor},
};

pub fn map_bvh(boxes: &[Aabb]) -> TwoLevelBvh {
    let mut scene = SceneWorld::new();
    let mut meshes = Vec::new();
    for b in boxes {
        let (a, c) = (b.min, b.max);
        let positions = vec![
            [a.x, a.y, a.z],
            [c.x, a.y, a.z],
            [c.x, c.y, a.z],
            [a.x, c.y, a.z],
            [a.x, a.y, c.z],
            [c.x, a.y, c.z],
            [c.x, c.y, c.z],
            [a.x, c.y, c.z],
        ];
        let mesh = ProceduralMesh {
            name: "Meridian collision box".into(),
            positions: positions
                .iter()
                .map(|p| [p[0] as f32, p[1] as f32, p[2] as f32])
                .collect(),
            normals: vec![[0., 1., 0.]; 8],
            uvs: vec![[0., 0.]; 8],
            colors: vec![[1.; 4]; 8],
            indices: vec![
                0, 3, 2, 0, 2, 1, 4, 5, 6, 4, 6, 7, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5, 0, 1, 5, 0,
                5, 4, 3, 7, 6, 3, 6, 2,
            ],
            morph_targets: vec![],
        };
        let id = scene.spawn(
            "map",
            EntityRole::StaticArchitecture,
            None,
            Transform::default(),
            *b,
            (1., "shared/map.ts"),
        );
        scene.attach_renderable(id, meshes.len(), 0);
        meshes.push(mesh);
    }
    TwoLevelBvh::build_solid(&scene, &meshes).expect("validated Meridian boxes")
}
thread_local! {
    static ASSET: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
    static CAMERA: RefCell<[f64;7]> = const { RefCell::new([0.;7]) };
}
/// Returns 0 for unknown asset kinds/detail levels; clears prior output on rejection.
#[no_mangle]
pub extern "C" fn cs_hd_asset(kind: u32, lod: u32) -> u32 {
    ASSET.with(|out| {
        let mut out = out.borrow_mut();
        out.clear();
        if kind > 2 || lod > 4 {
            return 0;
        }
        let mesh = match kind {
            0 => generate_vaulted_citadel_hall_mesh(0., lod as u64),
            1 => generate_parabolic_arch_bridge_mesh(Vec3::new(0., 1., 0.), 14., lod as u64),
            _ => generate_sculpted_canopy_tree_mesh(lod as u64),
        };
        if mesh.validate().is_err() {
            return 0;
        }
        *out = serde_json::to_vec(&mesh).expect("finite validated mesh");
        1
    })
}
#[no_mangle]
pub extern "C" fn cs_hd_ptr() -> *const u8 {
    ASSET.with(|v| v.borrow().as_ptr())
}
#[no_mangle]
pub extern "C" fn cs_hd_len() -> usize {
    ASSET.with(|v| v.borrow().len())
}
/// Returns -1 for invalid bounded inputs; pin prevents automatic quality overrides.
#[no_mangle]
pub extern "C" fn cs_lod(lod: u32, micros: f64, pinned: u32) -> i32 {
    if lod > 4 || !micros.is_finite() || !(0.0..=1_000_000.0).contains(&micros) || pinned > 1 {
        return -1;
    }
    let config = EngineConfig::from_refresh_rate(1, 1, 60, 60, 1).expect("valid frame budget");
    let caps = BrowserCapabilities {
        wasm_simd_available: false,
        webgl2_available: true,
        hardware_concurrency: 1,
        shared_array_buffer: false,
        audio_worklet: false,
        offscreen_canvas: false,
    };
    OntologicalRuntimeGovernor::new(config, caps).recommend_non_coercive_lod(
        lod as u64,
        micros as u64,
        pinned as u64,
    ) as i32
}
/// Returns 0 on invalid optics/inputs. Camera guard operates on the same map boxes as authority.
#[no_mangle]
pub extern "C" fn cs_camera(
    x: f64,
    y: f64,
    z: f64,
    yaw: f64,
    pitch: f64,
    fov: f64,
    aspect: f64,
) -> u32 {
    CAMERA.with(|out| *out.borrow_mut() = [0.; 7]);
    if ![x, y, z, yaw, pitch, fov, aspect]
        .iter()
        .all(|x| x.is_finite())
        || !(1.0..=150.0).contains(&fov)
        || !(0.001..=1000.0).contains(&aspect)
        || x.abs() > 1000.
        || y.abs() > 1000.
        || z.abs() > 1000.
    {
        return 0;
    }
    let config = CameraRigConfig {
        vertical_fov_radians: fov.to_radians(),
        aspect_ratio: aspect,
        z_near_meters: 0.05,
        z_far_meters: 220.,
        min_pitch_radians: -1.56,
        max_pitch_radians: 1.56,
        ..CameraRigConfig::default()
    };
    let Ok(mut rig) = LawfulCameraRig::new(config, CameraMode::FirstPersonEye, yaw, pitch, 0.)
    else {
        return 0;
    };
    super::WORLD.with(|world| {
        let world = world.borrow();
        let Some(bvh) = world.triangles.as_ref() else {
            return 0;
        };
        let Ok(frame) = rig.solve_frame(0., Vec3::new(x, y, z), bvh, &|_, _| 0.) else {
            return 0;
        };
        if !frame.near_sphere_guarded || frame.clearance_meters + 1e-6 < frame.guard_radius_meters {
            return 0;
        }
        CAMERA.with(|out| {
            *out.borrow_mut() = [
                frame.eye.x,
                frame.eye.y,
                frame.eye.z,
                frame.guard_radius_meters,
                frame.clearance_meters,
                if frame.near_sphere_guarded { 1. } else { 0. },
                if frame.obstructed { 1. } else { 0. },
            ]
        });
        1
    })
}
#[no_mangle]
pub extern "C" fn cs_camera_result(i: u32) -> f64 {
    CAMERA.with(|out| out.borrow().get(i as usize).copied().unwrap_or(0.))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn hd_detail_is_bounded_and_invalid_requests_clear_old_asset() {
        assert_eq!(cs_hd_asset(0, 0), 1);
        let low = cs_hd_len();
        assert_eq!(cs_hd_asset(0, 4), 1);
        assert!(cs_hd_len() > low);
        assert_eq!(cs_hd_asset(0, 5), 0);
        assert_eq!(cs_hd_len(), 0);
        assert_eq!(cs_hd_asset(3, 0), 0);
    }
    #[test]
    fn governor_preserves_explicit_pins_and_refuses_nonfinite_samples() {
        assert_eq!(cs_lod(3, 40_000., 0), 2);
        assert_eq!(cs_lod(3, 4_000., 0), 4);
        assert_eq!(cs_lod(3, 40_000., 1), 3);
        assert_eq!(cs_lod(1, f64::NAN, 0), -1);
        assert_eq!(cs_lod(5, 4_000., 0), -1);
    }
    #[test]
    fn camera_keeps_near_plane_outside_wall_and_refuses_invalid_optics() {
        super::super::cs_clear();
        super::super::cs_box(0., 0., 28., 58., 7., 2.);
        super::super::cs_build();
        assert_eq!(cs_camera(0., 1.6, 26.99, 0., 0., 76., 16. / 9.), 1);
        assert!(cs_camera_result(2) + cs_camera_result(3) < 27.001);
        assert_eq!(cs_camera_result(5), 1.);
        assert_eq!(cs_camera(0., 1.6, 26.99, 0., 0., 0., 1.), 0);
        assert_eq!(cs_camera_result(5), 0.);
    }
}
