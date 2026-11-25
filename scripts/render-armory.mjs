// Capture the actual first-person models for the buy menu. Run from the repository root.
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {WEAPONS} from '../shared/config.ts';
import {createServer} from 'vite';

const entry = '/armory-preview.js';
const server = await createServer({
  plugins: [{
    name: 'armory-preview',
    resolveId(id) { if (id === entry) return '\0armory-preview'; },
    load(id) {
      if (id !== '\0armory-preview') return;
      return `
        import * as T from 'three';
        import {WorldView} from '/src/world.ts';
        import {createEngine} from '/shared/engine.ts';
        async function setup() {
          const canvas = document.querySelector('canvas');
          const world = new WorldView(canvas, {preserveDrawingBuffer:true});
          const bytes = await (await fetch('/wasm/cs_verdant.wasm')).arrayBuffer();
          world.setEngine(await createEngine(bytes));
          await world.meridian.ready;
          const renderer = world.renderer;
          const camera = new T.OrthographicCamera(-1, 1, 1, -1, .01, 20);
          renderer.setPixelRatio(1);
          renderer.setSize(420, 160, false);
          // Render against the same dark neutral field used by the loadout cards.
          world.weaponScene.background = new T.Color(0x172428);
          return id => {
            world.setWeapon(id);
            world.gun.position.set(0, 0, 0);
            world.gun.rotation.set(0, 0, 0);
            world.gun.traverse(o => { if (o.userData.hideInArmory || o === world.flash) o.visible = false; });
            world.gun.updateMatrixWorld(true);
            const box = new T.Box3();
            world.gun.traverseVisible(o => {
              if (!o.isMesh) return;
              o.geometry.computeBoundingBox();
              box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
            });
            const center = box.getCenter(new T.Vector3());
            camera.position.copy(center).add(new T.Vector3(-3, .65, -.45));
            camera.lookAt(center);
            camera.updateMatrixWorld();
            const bounds = new T.Box3();
            for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z])
              bounds.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
            const aspect = 420/160, extent = bounds.getSize(new T.Vector3());
            const half = Math.max(extent.y, extent.x/aspect)*.55;
            Object.assign(camera, {left:-half*aspect,right:half*aspect,top:half,bottom:-half});
            camera.updateProjectionMatrix();
            renderer.autoClear = true;
            renderer.render(world.weaponScene,camera);
            return canvas.toDataURL('image/webp',.90).split(',')[1];
          };
        }
        window.previewReady = setup();
      `;
    },
    configureServer(s) {
      s.middlewares.use('/armory-fixture', (_req, res) => {
        res.setHeader('Content-Type','text/html');
        res.end('<canvas></canvas><script type="module" src="/armory-preview.js"></script>');
      });
    }
  }],
  server:{host:'127.0.0.1',port:0,hmr:false}
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const page = await browser.newPage();
  page.on('pageerror', error => console.error(error));
  await page.goto(server.resolvedUrls.local[0]+'armory-fixture');
  await page.waitForFunction(() => Boolean(window.previewReady));
  await mkdir('public/armory', {recursive:true});
  for (const {id} of Object.values(WEAPONS).filter(w=>w.price>0)) {
    const image = await page.evaluate(async weapon => (await window.previewReady)(weapon), id);
    await writeFile('public/armory/'+id+'.webp',Buffer.from(image,'base64'));
  }
} finally {
  await browser?.close();
  await server.close();
}
