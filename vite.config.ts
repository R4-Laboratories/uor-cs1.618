import { defineConfig } from 'vite';
export default defineConfig({base:'./',server:{host:'0.0.0.0',allowedHosts:true},build:{target:'es2022',chunkSizeWarningLimit:700,rollupOptions:{input:{game:'index.html',evolution:'evolution-lab.html'}}}});
