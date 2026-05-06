/**
 * 极简 Toast 通知工具
 * 3 秒后自动消失
 */

interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export function showToast(message: string, options: ToastOptions = {}): void {
  const { type = 'info', duration = 3000 } = options

  const toast = document.createElement('div')
  toast.className = `fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 opacity-0 translate-y-[-10px]`

  const colorMap = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    warning: 'bg-warning text-white',
    info: 'bg-brand text-white',
  }

  toast.classList.add(...colorMap[type].split(' '))
  toast.textContent = message
  document.body.appendChild(toast)

  // 触发动画
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-[-10px]')
  })

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]')
    setTimeout(() => toast.remove(), 300)
  }, duration)
}
