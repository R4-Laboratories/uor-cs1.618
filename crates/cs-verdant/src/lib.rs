//! The game-specific safe ABI over Verdant Engine. All geometry queries use Verdant's BVH.
#![deny(unsafe_op_in_unsafe_fn)]

mod characters;
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn wall_blocks_shots_and_movement() {
        let mut w = SpatialWorld::default();
        w.add_box(-1., 0., -1., 1., 5., 1.);
        w.build();
        assert!((w.ray(Vec3::new(0., 1., 5.), Vec3::new(0., 0., -1.), 20.) - 4.).abs() < 0.001);
        let p = w.slide(Vec3::new(0., 0., 3.), Vec3::new(0., 0., -5.), 0.35, 1.8);
        assert!(p.z >= 1.35 && p.z < 1.36);
    }
    #[test]
    fn diagonal_motion_slides_and_radius_cannot_clip_corner() {
        let mut w = SpatialWorld::default();
        w.add_box(-1., 0., -1., 1., 5., 1.);
        w.build();
        let p = w.slide(Vec3::new(0., 0., 2.), Vec3::new(0.5, 0., -2.), 0.35, 1.8);
        assert!(p.x > 0.49 && p.z >= 1.35);
        let q = w.slide(Vec3::new(1.2, 0., 2.), Vec3::new(0., 0., -3.), 0.35, 1.8);
        assert!(q.z >= 1.35);
    }
    #[test]
    fn ray_misses_open_space() {
        let w = SpatialWorld::default();
        assert_eq!(w.ray(Vec3::ZERO, Vec3::UP, 99.), 99.);
    }
}

use std::cell::RefCell;
use verdant_core::audio::{
    evaluate_binaural_cue_with_occlusion, AcousticEnvironment, ListenerPose, SpatialAudioSource,
};
use verdant_core::ecs::{BoundingVolumeHierarchy, EntityId};
use verdant_core::math::{Aabb, Ray, Vec3};

#[derive(Default)]
pub struct SpatialWorld {
    boxes: Vec<Aabb>,
    bvh: BoundingVolumeHierarchy,
}
impl SpatialWorld {
    pub fn add_box(&mut self, x0: f64, y0: f64, z0: f64, x1: f64, y1: f64, z1: f64) {
        self.boxes
            .push(Aabb::new(Vec3::new(x0, y0, z0), Vec3::new(x1, y1, z1)));
    }
    pub fn build(&mut self) {
        self.bvh = BoundingVolumeHierarchy::build(
            self.boxes
                .iter()
                .enumerate()
                .map(|(i, b)| (EntityId(i as u64), *b))
                .collect(),
        );
    }
    pub fn ray(&self, origin: Vec3, direction: Vec3, max: f64) -> f64 {
        self.bvh
            .raycast(Ray::new(origin, direction), max)
            .map_or(max, |h| h.distance_meters)
    }
    pub fn slide(&self, foot: Vec3, delta: Vec3, radius: f64, height: f64) -> Vec3 {
        // Minkowski-expanded boxes let Verdant rays sweep the full player footprint.
        let items = self
            .boxes
            .iter()
            .enumerate()
            .filter(|(_, b)| foot.y + height > b.min.y + 0.01 && foot.y < b.max.y - 0.01)
            .map(|(i, b)| {
                (
                    EntityId(i as u64),
                    Aabb::new(
                        Vec3::new(b.min.x - radius, -100., b.min.z - radius),
                        Vec3::new(b.max.x + radius, 100., b.max.z + radius),
                    ),
                )
            })
            .collect();
        let sweep = BoundingVolumeHierarchy::build(items);
        let mut result = foot;
        for d in [Vec3::new(delta.x, 0., 0.), Vec3::new(0., 0., delta.z)] {
            let len = d.length();
            if len > 1e-9 {
                let ray = Ray::new(result, d.scale(1. / len));
                let safe = sweep
                    .raycast(ray, len)
                    .map_or(len, |h| (h.distance_meters - 0.0001).max(0.));
                result = result + d.scale(safe / len);
            }
        }
        result
    }
    pub fn support(&self, x: f64, z: f64, ceiling: f64, r: f64) -> f64 {
        self.boxes
            .iter()
            .filter(|b| {
                x + r > b.min.x
                    && x - r < b.max.x
                    && z + r > b.min.z
                    && z - r < b.max.z
                    && b.max.y <= ceiling + 0.02
            })
            .fold(0.0_f64, |a, b| a.max(b.max.y))
    }
}
thread_local! { static WORLD: RefCell<SpatialWorld> = RefCell::new(SpatialWorld::default()); static OUT: RefCell<[f64;4]> = const {RefCell::new([0.;4])}; }
#[no_mangle]
pub extern "C" fn cs_clear() {
    WORLD.with(|w| *w.borrow_mut() = SpatialWorld::default());
}
#[no_mangle]
pub extern "C" fn cs_box(x: f64, y: f64, z: f64, w: f64, h: f64, d: f64) {
    WORLD.with(|world| {
        world
            .borrow_mut()
            .add_box(x - w / 2., y, z - d / 2., x + w / 2., y + h, z + d / 2.)
    });
}
#[no_mangle]
pub extern "C" fn cs_build() {
    WORLD.with(|w| w.borrow_mut().build());
}
#[no_mangle]
pub extern "C" fn cs_ray(x: f64, y: f64, z: f64, dx: f64, dy: f64, dz: f64, max: f64) -> f64 {
    WORLD.with(|w| {
        w.borrow()
            .ray(Vec3::new(x, y, z), Vec3::new(dx, dy, dz), max)
    })
}
#[no_mangle]
pub extern "C" fn cs_move(x: f64, y: f64, z: f64, dx: f64, dz: f64, r: f64, h: f64) {
    let p = WORLD.with(|w| {
        w.borrow()
            .slide(Vec3::new(x, y, z), Vec3::new(dx, 0., dz), r, h)
    });
    OUT.with(|o| *o.borrow_mut() = [p.x, p.y, p.z, 0.]);
}
#[no_mangle]
pub extern "C" fn cs_support(x: f64, z: f64, ceiling: f64, r: f64) -> f64 {
    WORLD.with(|w| w.borrow().support(x, z, ceiling, r))
}
#[no_mangle]
pub extern "C" fn cs_result(i: u32) -> f64 {
    OUT.with(|o| o.borrow().get(i as usize).copied().unwrap_or(0.))
}
#[no_mangle]
pub extern "C" fn cs_hitbox(
    x: f64,
    y: f64,
    z: f64,
    dx: f64,
    dy: f64,
    dz: f64,
    bx: f64,
    by: f64,
    bz: f64,
    r: f64,
    h: f64,
) -> f64 {
    Ray::new(Vec3::new(x, y, z), Vec3::new(dx, dy, dz))
        .intersect_aabb(Aabb::new(
            Vec3::new(bx - r, by, bz - r),
            Vec3::new(bx + r, by + h, bz + r),
        ))
        .unwrap_or(-1.)
}
#[no_mangle]
pub extern "C" fn cs_audio(sx: f64, sy: f64, sz: f64, lx: f64, ly: f64, lz: f64, yaw: f64) {
    let source = SpatialAudioSource {
        label: String::new(),
        position: Vec3::new(sx, sy, sz),
        fundamental_hz: 800.,
        reference_gain: 1.,
    };
    let listener = ListenerPose {
        position: Vec3::new(lx, ly, lz),
        forward: Vec3::new(-yaw.sin(), 0., -yaw.cos()),
        up: Vec3::UP,
    };
    let (cue, occ) = WORLD.with(|w| {
        evaluate_binaural_cue_with_occlusion(
            &source,
            &listener,
            &AcousticEnvironment::damped_exterior(343.),
            &w.borrow().bvh,
        )
    });
    OUT.with(|o| {
        *o.borrow_mut() = [
            cue.azimuth_sin,
            cue.direct_gain,
            cue.itd_seconds,
            if occ { 1. } else { 0. },
        ]
    });
}
