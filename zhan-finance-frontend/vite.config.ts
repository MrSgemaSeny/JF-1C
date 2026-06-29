import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'

export default defineConfig({
  base: '/JF-1C/',
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'copy-index-to-404',
      closeBundle() {
        fs.copyFileSync('dist/index.html', 'dist/404.html')
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'suneditor/src/plugins': 'suneditor/src/plugins/index.js',
      'suneditor/src/plugins/': 'suneditor/src/plugins/index.js'
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
  }
})