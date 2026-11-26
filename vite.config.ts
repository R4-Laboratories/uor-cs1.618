import { defineConfig, type Plugin } from 'vite';

// Where the holo's page fetches what the game loads at run time (the engine, the Prism kernels, art, armory and
// media): the live Pages site, since a holo's page runs in a sandboxed frame with no files of its own beside it.
const holoAssetBase = process.env.HOLO_ASSET_BASE ?? 'https://r4-laboratories.github.io/uor-cs1.618/';

// A sandboxed page has an opaque origin, so it cannot start a worker from a script URL. In the holo build each
// `new Worker(new URL('./x.ts', import.meta.url), {type: 'module'})` becomes an inline worker, started from a blob.
function inlineWorkers(): Plugin {
  const pattern = /new Worker\(new URL\('\.\/([\w-]+)\.ts',\s*import\.meta\.url\),\s*\{type:'module'\}\)/g;
  return {
    name: 'cs1618-inline-workers',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/src\/[\w-]+\.ts$/.test(id.replaceAll('\\', '/')) || !pattern.test(code)) return null;
      pattern.lastIndex = 0;
      const names = new Set<string>();
      const body = code.replace(pattern, (_, name: string) => { names.add(name); return `new __inlineWorker_${name.replaceAll('-', '_')}()`; });
      const imports = [...names].map((name) => `import __inlineWorker_${name.replaceAll('-', '_')} from './${name}.ts?worker&inline';`).join('\n');
      return { code: `${imports}\n${body}`, map: null };
    },
  };
}

export default defineConfig(({ mode }) => {
  // `vite build --mode holo` writes the game into prism/app/view/, the page of the Prism holo: one script and one
  // stylesheet, no chunks, no public files, every worker inline.
  if (mode === 'holo') return {
    base: './',
    define: { 'import.meta.env.BASE_URL': JSON.stringify(holoAssetBase), __CS_HOLO__: 'true' },
    plugins: [inlineWorkers()],
    // The holospace's policy admits workers only from blob: URLs, and in its sandbox only classic ones start.
    worker: { format: 'iife', rollupOptions: { output: { inlineDynamicImports: true } } },
    build: {
      target: 'es2022',
      outDir: 'prism/app/view',
      emptyOutDir: true,
      copyPublicDir: false,
      cssCodeSplit: false,
      modulePreload: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      chunkSizeWarningLimit: 4096,
      rollupOptions: { input: 'index.html', output: { inlineDynamicImports: true, entryFileNames: 'game.js', assetFileNames: 'game[extname]' } },
    },
  };
  return { base: './', define: { __CS_HOLO__: 'false' }, server: { host: '0.0.0.0', allowedHosts: true }, build: { target: 'es2022', chunkSizeWarningLimit: 700, rollupOptions: { input: { game: 'index.html', evolution: 'evolution-lab.html', studio: 'evolution-studio.html', identity: 'identity.html' } } } };
});
