import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  // './' deixa o build funcionar em qualquer subpasta (ex.: GitHub Pages).
  base: './',
  plugins: [angular()],
  server: {
    port: 4200,
    open: true,
  },
});
