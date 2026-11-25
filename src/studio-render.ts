import * as T from 'three';
import type {VerdantEngine} from '../shared/engine';
import surfaces from '../model/studio-render-surfaces.json';

export type StudioSurfaceName = keyof typeof surfaces;
const finishes = ['mineral', 'wood', 'paint', 'metal', 'fabric', 'glass'] as const;
type Finish = typeof finishes[number];
const size = 64;

type TextureEngine = Pick<VerdantEngine, 'packTexture'>;

// One linear roughness microtile per finish for every material using the library.
// The same RGBA value in each lane permits constant page compression. Three
// samples the green channel, and the material's authored scalar sets the range.
function microtile(finish: Finish) {
  const pixels = new Uint8Array(size * size * 4);
  let state = 6841;
  for (let y = 0; y < size; y++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const brush = 192 + (state >>> 26);
    for (let x = 0; x < size; x++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const grain = state >>> 27;
      let level: number;
      switch (finish) {
        case 'mineral': level = 220 + grain; break;
        case 'wood': level = 211 + Math.round(13 * Math.sin(x * Math.PI / 4 + 0.55 * Math.sin(y * Math.PI / 32))) + (grain >> 1); break;
        case 'paint': level = 245 + (grain >> 2); break;
        case 'metal': level = brush; break;
        case 'fabric': level = ((x & 3) < 2) === ((y & 3) < 2) ? 251 : 199; break;
        case 'glass': level = 252; break;
      }
      const byteOffset = (y * size + x) * 4;
      pixels.fill(level, byteOffset, byteOffset + 4);
    }
  }
  return pixels;
}

const tiles = new Map<Finish, T.DataTexture>();
function texture(finish: Finish) {
  let result = tiles.get(finish);
  if (!result) {
    result = new T.DataTexture(microtile(finish), size, size);
    result.name = 'Studio roughness · ' + finish;
    result.wrapS = result.wrapT = T.RepeatWrapping;
    result.repeat.set(4, 4);
    result.magFilter = T.LinearFilter;
    result.minFilter = T.LinearMipmapLinearFilter;
    result.generateMipmaps = true;
    result.needsUpdate = true;
    tiles.set(finish, result);
  }
  return result;
}

let stagedWith: TextureEngine | undefined;
/** Switch shared texture sources to the engine's CPU backing. WebGL pulls
 * logical pixels on upload, including after a context restore. The renderer
 * can draw the loading screen before asynchronous WASM initialization. */
export function stageStudioSurfaces(engine: TextureEngine) {
  if (engine === stagedWith) return;
  const sources = finishes.map(finish => {
    const target = texture(finish);
    const data = target.image.data;
    if (!(data instanceof Uint8Array)) throw Error('Invalid Studio roughness pixels');
    return {target, packed: engine.packTexture(size, size, data)};
  });
  for (const {target, packed} of sources) {
    Object.defineProperty(target.image, 'data', {
      configurable: true,
      enumerable: true,
      get: () => packed.unpack(),
    });
    target.needsUpdate = true;
  }
  stagedWith = engine;
}

/** OpenPBR base_color values use linear RGB. Color constructors taking
 * hexadecimal/sRGB input would decode these values a second time. */
export function studioSurface(name: StudioSurfaceName): T.MeshStandardMaterialParameters {
  const surface = surfaces[name];
  const [r, g, b] = surface.base_color;
  return {
    color: new T.Color(r, g, b),
    metalness: surface.base_metalness,
    roughness: surface.specular_roughness,
    roughnessMap: texture(surface.finish as Finish),
  };
}
