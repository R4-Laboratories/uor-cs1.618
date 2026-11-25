import {chromium} from 'playwright';
import {createServer} from 'vite';
import {mkdir, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const server = await createServer({
  cacheDir: 'node_modules/.vite-studio-probe',
  server: {host: '127.0.0.1', port: 0},
  plugins: [{
    name: 'studio-context-restore-fixture',
    configureServer(dev) {
      dev.middlewares.use('/studio-probe', (_req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end('<canvas id="probe"></canvas>');
      });
    },
  }],
});
await server.listen();
let browser;
try {
  browser = await chromium.launch({args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(server.resolvedUrls.local[0] + 'studio-probe');
  const result = await page.evaluate(async () => {
    const T = await import('/node_modules/three/build/three.module.js');
    const {createEngine} = await import('/shared/engine.ts');
    const {studioSurface, stageStudioSurfaces} = await import('/src/studio-render.ts');
    const wasm = await (await fetch('/wasm/cs_verdant.wasm')).arrayBuffer();
    const engine = await createEngine(wasm);
    const names = ['concrete', 'crate', 'tealPaint', 'brushedSteel', 'oliveFabric', 'glass'];
    const tiles = names.map(name => studioSurface(name).roughnessMap);
    const reference = tiles.map(tile => tile.image.data.slice());
    stageStudioSurfaces(engine);
    const canvas = document.querySelector('canvas');
    const renderer = new T.WebGLRenderer({canvas});
    const size = 64;
    const target = new T.WebGLRenderTarget(size, size, {depthBuffer: false});
    const sample = new T.RawShaderMaterial({
      glslVersion: T.GLSL3,
      uniforms: {tile: {value: tiles[0]}},
      vertexShader: 'in vec3 position; void main(){gl_Position=vec4(position,1.0);}',
      fragmentShader: 'precision highp float; uniform sampler2D tile; out vec4 outputColor; void main(){outputColor=texelFetch(tile,ivec2(gl_FragCoord.xy),0);}',
    });
    const scene = new T.Scene();
    scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), sample));
    const camera = new T.Camera();
    function exercise() {
      renderer.setRenderTarget(target);
      for (const [index, tile] of tiles.entries()) {
        sample.uniforms.tile.value = tile;
        renderer.render(scene, camera);
        const pixels = new Uint8Array(size * size * 4);
        renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels);
        const bad = pixels.findIndex((value, offset) => value !== reference[index][offset]);
        if (bad >= 0) throw Error(names[index] + ' differs from authored pixels at byte ' + bad);
      }
      renderer.setRenderTarget(null);
    }
    exercise();
    const restoring = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('WebGL restoration timed out')), 8000);
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        setTimeout(() => renderer.forceContextRestore(), 100);
      }, {once: true});
      canvas.addEventListener('webglcontextrestored', () => {
        clearTimeout(timeout);
        resolve();
      }, {once: true});
    });
    renderer.forceContextLoss();
    await restoring;
    exercise();
    renderer.dispose();
    return {finishes: names.length, bytesComparedPerPass: size * size * 4 * names.length,
      passes: ['first upload', 'after WebGL context restoration'], staging: engine.textureStaging};
  });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(result));
  await mkdir('artifacts/presentation', {recursive: true});
  await writeFile('artifacts/presentation/studio-upload.json', JSON.stringify(result, null, 2) + '\n');
} finally {
  await browser?.close();
  await server.close();
}
