import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Polyfill 'path' module for browser compatibility (needed by mammoth)
      path: 'path-browserify',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit to suppress warnings for large libraries like pdfjs/ffmpeg
  }
})