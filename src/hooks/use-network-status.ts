import { useEffect, useState, useCallback } from 'react'

/**
 * 网络状态检测 Hook
 * 提供在线/离线状态、网络类型和往返时间的检测
 *
 * @example
 * const { isOnline, isOffline, networkType, rtt } = useNetworkStatus()
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [networkType, setNetworkType] = useState<string | null>(null)
  const [rtt, setRtt] = useState<number | null>(null)

  const updateNetworkInfo = useCallback(() => {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection

    if (connection) {
      setNetworkType(connection.effectiveType || connection.type || null)
      setRtt(connection.rtt || null)
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      updateNetworkInfo()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setNetworkType(null)
      setRtt(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 监听网络类型变化
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', updateNetworkInfo)
      updateNetworkInfo()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [updateNetworkInfo])

  return {
    isOnline,
    isOffline: !isOnline,
    networkType,
    rtt,
  }
}
