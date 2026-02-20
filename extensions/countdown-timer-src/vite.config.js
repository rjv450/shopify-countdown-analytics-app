import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    rollupOptions: {
      input: resolve(__dirname, 'src/index.jsx'),
      output: {
        format: 'iife',
        entryFileNames: 'countdown-timer.iife.js',
        name: 'CountdownTimerWidget',
      },
    },
  },
});







