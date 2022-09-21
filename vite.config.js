// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/svg-detailer.js'),
      name: 'SVGDetailer',
      fileName: format => `svg-detailer.${format}.js`
    },
    rollupOptions: {
      external: [],
      output: {}
    }
  }
})