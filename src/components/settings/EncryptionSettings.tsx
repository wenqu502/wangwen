import { useState } from 'react'
import { Lock, Unlock, AlertTriangle, Check } from 'lucide-react'
import { setEncryptionPassword, clearEncryptionKey, isEncryptionReady } from '@/utils/crypto'

export function EncryptionSettings() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [enabled, setEnabled] = useState(isEncryptionReady())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleEnable = async () => {
    setError('')
    setSuccess(false)

    if (password.length < 6) {
      setError('密码长度至少 6 位')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    try {
      await setEncryptionPassword(password)
      setEnabled(true)
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('设置加密失败，请重试')
    }
  }

  const handleDisable = () => {
    clearEncryptionKey()
    setEnabled(false)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        {enabled ? (
          <Lock className="w-5 h-5 text-green-600" />
        ) : (
          <Unlock className="w-5 h-5 text-neutral-400" />
        )}
        <h3 className="font-semibold text-neutral-900">本地数据加密</h3>
        {enabled && (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            已启用
          </span>
        )}
      </div>

      <p className="text-sm text-neutral-500">
        启用后，角色背景、剧情内容等敏感字段将以加密形式存储在浏览器中。
        加密密钥由您的密码派生，不会离开本机。
      </p>

      {!enabled ? (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              请务必牢记密码！密码丢失后，加密数据将无法恢复。
            </p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="设置加密密码（至少6位）"
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="确认密码"
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> 加密已启用
            </p>
          )}

          <button
            onClick={handleEnable}
            disabled={!password || !confirmPassword}
            className="w-full py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            启用加密
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-green-700">
            数据加密已启用。敏感字段（角色背景、剧情内容等）将以密文形式存储。
          </p>
          <button
            onClick={handleDisable}
            className="w-full py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            关闭加密（密钥将从内存中清除）
          </button>
        </div>
      )}
    </div>
  )
}
