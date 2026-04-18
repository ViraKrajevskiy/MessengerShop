import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // В проде вырезаем все console.* и debugger (debug-шум и утечка инфы)
  // Оставляем console.error и console.warn — реальные ошибки должны быть видны
  esbuild: {
    drop: ['debugger'],
    pure: ['console.log', 'console.info', 'console.debug', 'console.trace'],
  },

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
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router'
          }
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios'
          }
        },
      },
    },

    // Целевой размер чанка (предупреждение если больше)
    chunkSizeWarningLimit: 150,

    // Целевой ES версия
    target: 'es2020',
  },
})
