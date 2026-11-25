//! Bounded rendering-only bridge to Verdant's new articulated character module.
use std::cell::RefCell;
use verdant_core::{
    character::{ArticulatedCharacter, CharacterArchetype},
    ecs::{SceneWorld, TwoLevelBvh},
    math::Vec3,
};
const SLOTS: usize = 10;
fn make_character(team: u32) -> ArticulatedCharacter {
    ArticulatedCharacter::new_humanoid(
        "cs1.618 operator",
        if team == 0 {
            CharacterArchetype::BridgeEngineer
        } else {
            CharacterArchetype::Explorer
        },
        Vec3::ZERO,
        1,
    )
    .expect("valid upstream humanoid")
}
thread_local! {
    static PROTOTYPES: [ArticulatedCharacter;2]=[make_character(0),make_character(1)];
    static CHARACTERS: RefCell<[Option<ArticulatedCharacter>;SLOTS]>=RefCell::new(std::array::from_fn(|_|None));
    static ASSET: RefCell<Vec<u8>>=const{RefCell::new(Vec::new())};
    static POSE: RefCell<Vec<f32>>=const{RefCell::new(Vec::new())};
    static FLOOR: TwoLevelBvh=TwoLevelBvh::build_solid(&SceneWorld::new(),&[]).expect("empty collision scene");
}
#[no_mangle]
pub extern "C" fn cs_character_asset(team: u32) -> u32 {
    if team > 1 {
        return 0;
    }
    PROTOTYPES.with(|all|{
        let c=&all[team as usize];
        let bones:Vec<_>=c.skeleton.joints.iter().map(|j|serde_json::json!({"parent":j.parent_index,"root":j.is_root,"translation":[j.rest_translation.x,j.rest_translation.y,j.rest_translation.z],"rotation":[j.rest_rotation.x,j.rest_rotation.y,j.rest_rotation.z,j.rest_rotation.w]})).collect();
        let weights:Vec<_>=c.skin_weights.iter().map(|w|w.weights_permille).collect();
        let joints:Vec<_>=c.skin_weights.iter().map(|w|w.joints).collect();
        let json=serde_json::json!({"positions":c.bind_mesh.positions,"normals":c.bind_mesh.normals,"colors":c.bind_mesh.colors,"indices":c.bind_mesh.indices,"morphs":c.bind_mesh.morph_targets.iter().map(|m|&m.position_deltas).collect::<Vec<_>>(),"bones":bones,"joints":joints,"weights":weights});
        ASSET.with(|out|*out.borrow_mut()=serde_json::to_vec(&json).expect("finite generated mesh"));
    });
    1
}
#[no_mangle]
pub extern "C" fn cs_character_asset_ptr() -> *const u8 {
    ASSET.with(|out| out.borrow().as_ptr())
}
#[no_mangle]
pub extern "C" fn cs_character_asset_len() -> usize {
    ASSET.with(|out| out.borrow().len())
}
#[no_mangle]
pub extern "C" fn cs_character_create(slot: u32, team: u32) -> u32 {
    if slot as usize >= SLOTS || team > 1 {
        return 0;
    }
    CHARACTERS.with(|cs| {
        PROTOTYPES.with(|all| cs.borrow_mut()[slot as usize] = Some(all[team as usize].clone()))
    });
    1
}
#[no_mangle]
pub extern "C" fn cs_character_release(slot: u32) {
    if (slot as usize) < SLOTS {
        CHARACTERS.with(|cs| cs.borrow_mut()[slot as usize] = None);
    }
}
#[no_mangle]
pub extern "C" fn cs_character_step(
    slot: u32,
    dt: f64,
    time: f64,
    speed: f64,
    pitch: f64,
    grounded: u32,
) -> u32 {
    if slot as usize >= SLOTS
        || ![dt, time, speed, pitch].iter().all(|v| v.is_finite())
        || !(0.0..=0.1).contains(&dt)
        || !(0.0..=10.0).contains(&speed)
        || pitch.abs() > 1.5
        || grounded > 1
    {
        return 0;
    }
    CHARACTERS.with(|cs| {
        let mut cs = cs.borrow_mut();
        let Some(c) = cs[slot as usize].as_mut() else {
            return 0;
        };
        // The game owns world position/yaw and authoritative collisions. Animation is local;
        // the engine solves its feet against the support plane at the player's current floor.
        let target = Vec3::new(0., 1.625 + pitch.sin() * 5., pitch.cos() * 5.);
        if FLOOR
            .with(|floor| {
                c.step_and_solve_ik(
                    dt,
                    Vec3::ZERO,
                    Vec3::new(0., 0., speed),
                    grounded == 1,
                    time,
                    Some(target),
                    floor,
                    &|_, _| 0.,
                )
            })
            .is_err()
        {
            return 0;
        }
        POSE.with(|out| {
            let mut out = out.borrow_mut();
            out.clear();
            for (t, q) in c
                .current_pose
                .joint_translations
                .iter()
                .zip(&c.current_pose.joint_rotations)
            {
                out.extend([
                    t.x as f32, t.y as f32, t.z as f32, q.x as f32, q.y as f32, q.z as f32,
                    q.w as f32,
                ]);
            }
            out.extend(
                c.current_pose
                    .morph_weights_permille
                    .iter()
                    .map(|w| *w as f32 / 1000.),
            );
        });
        1
    })
}
#[no_mangle]
pub extern "C" fn cs_character_pose_ptr() -> *const f32 {
    POSE.with(|out| out.borrow().as_ptr())
}
#[no_mangle]
pub extern "C" fn cs_character_pose_len() -> usize {
    POSE.with(|out| out.borrow().len())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn real_upstream_mesh_has_22_joints_and_normalized_weights() {
        for team in 0..2 {
            let c = make_character(team);
            assert_eq!(c.skeleton.joints.len(), 22);
            c.bind_mesh.validate().unwrap();
            assert!(c.bind_mesh.indices.len() > 1000 && c.bind_mesh.indices.len() < 36000);
            for w in c.skin_weights {
                assert_eq!(
                    w.weights_permille.iter().map(|v| *v as u32).sum::<u32>(),
                    1000
                );
                assert!(w.joints.iter().all(|j| *j < 22));
            }
        }
    }
    #[test]
    fn pose_slots_are_bounded_finite_and_released() {
        assert_eq!(cs_character_create(10, 0), 0);
        assert_eq!(cs_character_create(0, 2), 0);
        assert_eq!(cs_character_create(0, 0), 1);
        for i in 0..60 {
            assert_eq!(
                cs_character_step(0, 1. / 60., i as f64 / 60., 5.8, 0.2, 1),
                1
            );
            POSE.with(|p| {
                assert_eq!(p.borrow().len(), 157);
                assert!(p.borrow().iter().all(|v| v.is_finite()));
            });
        }
        assert_eq!(cs_character_step(0, f64::NAN, 0., 0., 0., 1), 0);
        cs_character_release(0);
        assert_eq!(cs_character_step(0, 0.01, 0., 0., 0., 1), 0);
    }
}
