import { useEffect, useState } from 'react'
import { useNetworkStatus } from '@/hooks/use-network-status'

/**
 * 离线状态提示横幅
 * 当网络断开时显示在页面顶部，恢复后自动消失
 */
export function OfflineBanner() {
  const { isOffline } = useNetworkStatus()
  const [visible, setVisible] = useState(isOffline)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (isOffline) {
      setVisible(true)
      setWasOffline(true)
    } else if (wasOffline) {
      // 网络恢复后，延迟 2 秒再隐藏，给用户一个明确的反馈
      const timer = setTimeout(() => {
        setVisible(false)
        setWasOffline(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOffline, wasOffline])

  if (!visible) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOffline
          ? 'bg-amber-500 text-white'
          : 'bg-emerald-500 text-white'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOffline ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          网络连接已断开，您仍可使用本地功能
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          网络已恢复，所有功能正常使用
        </span>
      )}
    </div>
  )
}
