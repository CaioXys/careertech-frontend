import { defineConfig } from 'vite';

export default defineConfig({
  // './' deixa o build funcionar em qualquer subpasta (ex.: GitHub Pages).
  base: './',
  server: {
    port: 4200,
    open: true,
  },
});
