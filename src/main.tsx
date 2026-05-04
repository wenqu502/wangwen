import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@xyflow/react/dist/style.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

/**
 * 注册 Service Worker（P2-002）
 * 仅在生产环境注册，避免开发热重载受影响
 */
function registerServiceWorker() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] 注册成功:', registration.scope)

          // 检测 Service Worker 更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] 发现新版本，刷新后生效')
                // 可选：提示用户刷新页面
              }
            })
          })
        })
        .catch((error) => {
          console.error('[SW] 注册失败:', error)
        })
    })
  }
}

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
