import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Включаем source maps для дебага (отключить в проде если не нужны)
    sourcemap: false,

    // Минимальный размер чанка для инлайна (4 КиБ)
    assetsInlineLimit: 4096,

    // CSS code splitting — каждый lazy-chunk получает свой CSS
    cssCodeSplit: true,

    // Оптимизация чанков — разбиваем бандл на части
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — кешируется отдельно, редко меняется
          'vendor-react': ['react', 'react-dom'],
          // Router — тоже стабильный
          'vendor-router': ['react-router-dom'],
          // Axios — HTTP клиент
          'vendor-axios': ['axios'],
        },
      },
    },

    // Целевой размер чанка (предупреждение если больше)
    chunkSizeWarningLimit: 150,

    // Минификация через esbuild (быстрее terser)
    minify: 'esbuild',

    // Удаляем console.log и debugger в проде
    target: 'es2020',
  },
})
