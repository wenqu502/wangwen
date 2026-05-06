import { useState } from 'react'
import { X, Key, Shield, Info } from 'lucide-react'
import { ApiKeySettings } from './ApiKeySettings'
import { EncryptionSettings } from './EncryptionSettings'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SECTIONS = [
  { id: 'apikey', label: 'API Key', icon: Key },
  { id: 'encryption', label: '数据加密', icon: Shield },
  { id: 'about', label: '关于', icon: Info },
] as const

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState('apikey')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-[600px] max-w-[90vw] max-h-[80vh] flex overflow-hidden">
        {/* 左侧导航 */}
        <div className="w-44 border-r border-neutral-200 bg-neutral-50 p-3 space-y-1 shrink-0">
          <p className="text-xs font-medium text-neutral-400 px-3 py-2 uppercase tracking-wider">
            设置
          </p>
          {SECTIONS.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  activeSection === section.id
                    ? 'bg-brand-light text-brand font-medium'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            )
          })}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900">
              {SECTIONS.find((s) => s.id === activeSection)?.label}
            </h2>
            <button
              onClick={onClose}
              aria-label="关闭设置"
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeSection === 'apikey' && <ApiKeySettings />}
            {activeSection === 'encryption' && <EncryptionSettings />}
            {activeSection === 'about' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand text-white flex items-center justify-center text-lg font-bold">
                    织
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">织文 WangWen</h3>
                    <p className="text-xs text-neutral-500">AI-first 网文创作辅助工具</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-neutral-600">
                  <p>版本: v0.1.0 (MVP)</p>
                  <p>数据存储: 浏览器本地 (IndexedDB)</p>
                  <p>AI 引擎: DeepSeek API (deepseek-v4-pro)</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-500">
                  <p className="font-medium text-neutral-700 mb-1">隐私说明</p>
                  <p>您的作品数据和 API Key 仅存储在本地浏览器中，不会上传到任何服务器。</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
