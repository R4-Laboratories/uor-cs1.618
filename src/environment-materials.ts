import * as T from 'three';
import {studioSurface} from './studio-render';


export interface MeridianAssets {
  materials: Record<string, T.MeshStandardMaterial>;
  status: {loaded: number; total: number; failed: string[]};
  ready: Promise<void>;
}

/** Packaged CC0 scans supply local relief. The Studio material registry supplies finish and tint. */
export function createMeridianMaterials(scene: T.Scene): MeridianAssets {
  const root = `${import.meta.env.BASE_URL}art/meridian/`;
  const manager = new T.LoadingManager();
  const status = {loaded: 0, total: 15, failed: [] as string[]};
  let finish!: () => void;
  const ready = new Promise<void>(resolve => {finish = resolve;});
  manager.onProgress = (_url, loaded, total) => Object.assign(status, {loaded, total});
  manager.onError = url => status.failed.push(url);
  manager.onLoad = finish;
  const loader = new T.TextureLoader(manager);

  function scan(name: string, channel: 'albedo' | 'normal') {
    const texture = loader.load(`${root}${name}-${channel}.webp`);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.colorSpace = channel === 'albedo' ? T.SRGBColorSpace : T.NoColorSpace;
    texture.anisotropy = 4;
    return texture;
  }
  function mineral(surface: Parameters<typeof studioSurface>[0], name: string, relief: number) {
    return new T.MeshStandardMaterial({
      ...studioSurface(surface), map: scan(name, 'albedo'), normalMap: scan(name, 'normal'),
      normalScale: new T.Vector2(relief, relief),
    });
  }
  const materials = {
    limewash: mineral('plaster','limewash',.32),
    cobbles: mineral('limestone', 'cobbles', .52),
    stone: mineral('limestone', 'masonry', .62),
    plaster: mineral('plaster', 'stucco', .30),
    teal: mineral('tealPaint', 'cladding', .55),
    crate: mineral('crate', 'timber', .44),
    ground: mineral('asphalt', 'tarmac', .38),
    metal: new T.MeshStandardMaterial(studioSurface('galvanized')),
    trim: new T.MeshStandardMaterial(studioSurface('trim')),
    dark: new T.MeshStandardMaterial(studioSurface('darkMetal')),
    glass: new T.MeshStandardMaterial(studioSurface('glass')),
    concrete: new T.MeshStandardMaterial(studioSurface('concrete')),
  };
  materials.metal.map=materials.teal.map;
  materials.metal.normalMap=materials.teal.normalMap;
  materials.metal.normalScale.set(.24,.24);
  loader.load(root + 'maritime-sky.webp', sky => {
    sky.mapping = T.EquirectangularReflectionMapping;
    sky.colorSpace = T.SRGBColorSpace;
    scene.background = sky;
    scene.backgroundRotation.y = 2.1;
    scene.backgroundIntensity = 1.05;
    scene.environment = sky;
    scene.environmentRotation.copy(scene.backgroundRotation);
    scene.environmentIntensity = .45;
  });
  return {materials, status, ready};
}

/** Give a long wall the same texel density as a small building across every face. */
const wallGeometries = new Map<string, T.BoxGeometry>();
export function wallGeometry(w: number, h: number, d: number, tileMeters: number) {
  const key = [w,h,d,tileMeters].join('/');
  const cached = wallGeometries.get(key);
  if (cached) return cached;
  const geometry = new T.BoxGeometry(w,h,d);
  const uv = geometry.getAttribute('uv');
  for (let i=0; i<uv.count; i++) {
    const axis = Math.floor(i/8);
    uv.setXY(i, uv.getX(i) * (axis === 0 ? d : w) / tileMeters,
                uv.getY(i) * (axis === 1 ? d : h) / tileMeters);
  }
  wallGeometries.set(key,geometry);
  return geometry;
}

/** Reuse a single faded shipping manifest across all freight cases. */
export function cargoManifest() {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const c=canvas.getContext('2d')!;
  c.fillStyle='#e2d6ae';c.fillRect(0,0,256,128);
  c.fillStyle='#243433';c.fillRect(0,0,256,26);
  c.font='bold 17px sans-serif';c.fillStyle='#eee9d7';c.fillText('MERIDIAN   /   MARINE FREIGHT',7,19);
  c.fillStyle='#37433b';c.font='bold 30px monospace';c.fillText('MRU 0486',8,64);
  for(let i=0;i<44;i++)c.fillRect(9+i*4,76,1+i%3,36);
  c.strokeStyle='#384339';c.lineWidth=4;c.strokeRect(193,76,48,35);
  c.font='bold 22px sans-serif';c.fillText('↑↑',202,103);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshStandardMaterial({map,roughness:.86,metalness:.02});
}
