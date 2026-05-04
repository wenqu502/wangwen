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
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心运行时（变化最少，长期缓存）
          'vendor-react': ['react', 'react-dom'],
          // 可视化画布库（体积大、按需加载）
          'vendor-canvas': ['@xyflow/react', '@antv/g6'],
          // 状态管理 + 工具库
          'vendor-state': ['zustand', 'immer', 'dexie'],
          // AI 客户端 + PDF 导出
          'vendor-ai': ['openai', 'html2canvas', 'jspdf'],
        },
      },
    },
    // 代码拆分阈值：超过 30KB 的模块自动拆分
    chunkSizeWarningLimit: 30,
  },
})
