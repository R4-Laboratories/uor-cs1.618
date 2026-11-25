import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createEngine} from '../../shared/engine';
import surfaces from '../../model/studio-render-surfaces.json';
import {engineAssetUrl} from '../engine-url';
import {stageStudioSurfaces, studioSurface, type StudioSurfaceName} from '../studio-render';

const names = Object.keys(surfaces) as StudioSurfaceName[];
const label = (s: string) => s.replace(/[A-Z]/g, c => ' ' + c.toLowerCase()).replace(/^./, c => c.toUpperCase());

/** A satin groove plus a cut flat lets artists compare finishes on different
 * surface normals under identical lighting. */
function sampleGeometry() {
  const profile = [new T.Vector2(0, -.72)];
  for (let step = 0; step <= 68; step++) {
    const angle = -.98 + (Math.PI / 2 + .98) * step / 68;
    const groove = Math.abs(angle - .25) < .044 ? .024 : 0;
    profile.push(new T.Vector2(Math.max(0, .865 * Math.cos(angle) - groove), .865 * Math.sin(angle)));
  }
  return new T.LatheGeometry(profile, 80);
}

function populate(select: HTMLSelectElement, selected: StudioSurfaceName) {
  const groups = new Map<string, HTMLOptGroupElement>();
  for (const name of names) {
    const finish = surfaces[name].finish;
    let group = groups.get(finish);
    if (!group) {
      group = document.createElement('optgroup');
      group.label = label(finish);
      groups.set(finish, group);
      select.append(group);
    }
    group.append(new Option(label(name), name));
  }
  select.value = selected;
}

export async function openInspector(container: HTMLElement) {
  const canvas = container.querySelector<HTMLCanvasElement>('canvas')!;
  const selects = Array.from(container.querySelectorAll<HTMLSelectElement>('select'));
  populate(selects[0], 'brushedSteel');
  populate(selects[1], 'tealPaint');

  const response = await fetch(engineAssetUrl(document.baseURI));
  if (!response.ok) throw Error('Engine unavailable');
  const engine = await createEngine(await response.arrayBuffer());
  stageStudioSurfaces(engine);

  const renderer = new T.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new T.Scene();
  scene.background = new T.Color(0x253236);
  const camera = new T.OrthographicCamera(-3, 3, 1.5, -1.5, .1, 30);
  camera.position.set(0, 2.55, 7);
  camera.lookAt(0, .95, 0);

  const room = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  const reflections = pmrem.fromScene(room, .035);
  scene.environment = reflections.texture;
  room.dispose();
  pmrem.dispose();

  const softbox = new T.DirectionalLight(0xfff2de, 3.1);
  softbox.position.set(-2, 5, 4);
  softbox.castShadow = true;
  Object.assign(softbox.shadow.camera, {left: -6, right: 6, top: 6, bottom: -6});
  softbox.shadow.mapSize.set(1024, 1024);
  softbox.shadow.normalBias = .018;
  scene.add(softbox, new T.HemisphereLight(0xe1f1ff, 0x344447, 1.1));
  const ground = new T.Mesh(new T.PlaneGeometry(40, 40), new T.MeshStandardMaterial({color:0x354044, roughness:.91}));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const geometry = sampleGeometry();
  const base = new T.CylinderGeometry(.58, .65, .13, 64);
  const baseFinish = new T.MeshStandardMaterial({color:0x262e32, roughness:.44, metalness:.32});
  const samples = selects.map(select => {
    const group = new T.Group();
    const sample = new T.Mesh(geometry, new T.MeshStandardMaterial());
    sample.rotation.z = -.13;
    sample.position.y = .91;
    sample.castShadow = true;
    const foot = new T.Mesh(base, baseFinish);
    foot.position.y = .065;
    foot.castShadow = foot.receiveShadow = true;
    group.add(foot, sample);
    scene.add(group);
    const output = select.closest('label')!.querySelector('output')!;
    const update = () => {
      const name = select.value as StudioSurfaceName;
      const recipe = surfaces[name];
      sample.material.setValues(studioSurface(name));
      output.textContent = `Roughness ${recipe.specular_roughness.toFixed(2)} · Metalness ${recipe.base_metalness.toFixed(2)}`;
    };
    update();
    select.disabled = false;
    select.addEventListener('change', () => {
      update();
      renderer.render(scene, camera);
    });
    return {group, sample};
  });

  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const halfHeight = Math.max(1.18, 2.25 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    samples[0].group.position.x = -camera.right / 2;
    samples[1].group.position.x = camera.right / 2;
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  container.dataset.stagedTextures = String(engine.textureStaging.textures);
  container.dataset.state = 'ready';
  container.querySelector('[role=status]')!.textContent = '';
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    observer.disconnect();
    ground.geometry.dispose();
    ground.material.dispose();
    baseFinish.dispose();
    base.dispose();
    geometry.dispose();
    samples.forEach(({sample}) => sample.material.dispose());
    reflections.dispose();
    softbox.shadow.dispose();
    renderer.dispose();
  });
}
