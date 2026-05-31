import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  assetsInclude: ['**/*.mp3'],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    minify: 'esbuild',
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('gsap')) return 'vendor';
        },
      },
    },
  },
});


