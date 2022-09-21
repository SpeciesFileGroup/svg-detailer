// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/svg-detailer.js'),
      name: 'svg-detailer',
      fileName: 'svg-detailer'
    },
    rollupOptions: {
      external: [],
      output: {}
    }
  }
})