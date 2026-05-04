import { useState } from 'react'
import { Key, Eye, EyeOff, Trash2, Check, AlertTriangle } from 'lucide-react'
import { hasApiKey, saveApiKey, clearApiKey } from '@/ai/client'

export function ApiKeySettings() {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(hasApiKey())

  const handleSave = () => {
    if (!key.trim()) return
    saveApiKey(key.trim())
    setSaved(true)
    setKey('')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    clearApiKey()
    setSaved(false)
    setKey('')
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Key className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-neutral-900">DeepSeek API Key</h3>
      </div>

      <p className="text-sm text-neutral-500">
        您的 API Key 仅存储在浏览器本地，不会上传到任何服务器。
        在 <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">DeepSeek 平台</a> 获取 Key。
      </p>

      <div className="space-y-3">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={hasApiKey() ? '••••••••••••••••' : '输入您的 API Key'}
            className="w-full pr-20 pl-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            {saved ? '已保存' : '保存'}
          </button>

          {hasApiKey() && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清除
            </button>
          )}
        </div>
      </div>

      {!hasApiKey() && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            尚未配置 API Key，AI 对话功能将无法使用。请在上方输入您的 Key。
          </p>
        </div>
      )}
    </div>
  )
}
