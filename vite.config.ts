import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 生产环境不生成 sourcemap，减少构建产物体积
    sourcemap: false,
    // 代码拆分阈值：超过 30KB 的模块自动拆分
    chunkSizeWarningLimit: 30,
    rollupOptions: {
      output: {
        // 入口文件命名策略
        entryFileNames: 'assets/[name]-[hash].js',
        // chunk 文件命名策略（hash + 可读名）
        chunkFileNames: 'assets/[name]-[hash].js',
        // 静态资源命名策略
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? ''
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.(css)$/i.test(name)) {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        manualChunks(id) {
          if (/[\\/]node_modules[\\/](react|react-dom)[\\/]/.test(id)) {
            return 'vendor-react'
          }
          if (/[\\/]node_modules[\\/]@xyflow[\\/]react[\\/]/.test(id) || /[\\/]node_modules[\\/]@antv[\\/]g6[\\/]/.test(id)) {
            return 'vendor-canvas'
          }
          if (/[\\/]node_modules[\\/](zustand|immer|dexie)[\\/]/.test(id)) {
            return 'vendor-state'
          }
          if (/[\\/]node_modules[\\/](openai|html2canvas|jspdf)[\\/]/.test(id)) {
            return 'vendor-ai'
          }
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) {
            return 'vendor-ui'
          }
          if (/[\\/]node_modules[\\/](clsx|tailwind-merge|class-variance-authority)[\\/]/.test(id)) {
            return 'vendor-utils'
          }
        },
      },
    },
  },
})
