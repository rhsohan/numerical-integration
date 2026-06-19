import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        trapezoidal: resolve(__dirname, 'trapezoidal.html'),
        simpson13: resolve(__dirname, 'simpson13.html'),
        simpson38: resolve(__dirname, 'simpson38.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
