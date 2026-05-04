import { lazy, Suspense } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useInitData } from '@/hooks/use-init-data'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { LoadingFallback } from '@/components/LoadingFallback'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { exportWork } from '@/lib/export'
import { SearchModal } from '@/components/search/SearchModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const CharacterCanvas = lazy(() => import('@/modules/character/CharacterCanvas').then(m => ({ default: m.CharacterCanvas })))
const PlotCanvas = lazy(() => import('@/modules/plot/PlotCanvas').then(m => ({ default: m.PlotCanvas })))
const RelationCanvas = lazy(() => import('@/modules/relation/RelationCanvas').then(m => ({ default: m.RelationCanvas })))
const SystemCanvas = lazy(() => import('@/modules/system/SystemCanvas').then(m => ({ default: m.SystemCanvas })))
const IdeaCanvas = lazy(() => import('@/modules/idea/IdeaCanvas').then(m => ({ default: m.IdeaCanvas })))
const ReportCanvas = lazy(() => import('@/modules/report/ReportCanvas').then(m => ({ default: m.ReportCanvas })))
import {
  Users,
  GitBranch,
  Network,
  Layers,
  Lightbulb,
  FileCheck,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Download,
  Settings,
  BookOpen,
  ChevronDown,
} from 'lucide-react'

const TABS = [
  { id: 'character' as const, label: '角色', icon: Users },
  { id: 'plot' as const, label: '剧情', icon: GitBranch },
  { id: 'relation' as const, label: '关系', icon: Network },
  { id: 'system' as const, label: '体系', icon: Layers },
  { id: 'idea' as const, label: '灵感', icon: Lightbulb },
  { id: 'report' as const, label: '校验报告', icon: FileCheck },
]

const TAB_COMPONENTS = {
  character: CharacterCanvas,
  plot: PlotCanvas,
  relation: RelationCanvas,
  system: SystemCanvas,
  idea: IdeaCanvas,
  report: ReportCanvas,
} as const

function App() {
  const {
    currentTab,
    setCurrentTab,
    isChatPanelOpen,
    toggleChatPanel,
    currentWorkId,
  } = useAppStore()

  const isReady = useInitData(currentWorkId)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (!currentWorkId || isExporting) return
    setIsExporting(true)
    try {
      await exportWork(currentWorkId)
    } catch (err) {
      console.error('导出失败', err)
    } finally {
      setIsExporting(false)
    }
  }, [currentWorkId, isExporting])

  const ActiveCanvas = TAB_COMPONENTS[currentTab]

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">加载数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-50 overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="h-[52px] flex items-center justify-between px-4 border-b border-neutral-200 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-neutral-900">织文</span>
          </div>
          <div className="h-5 w-px bg-neutral-200" />
          <button className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
            <span className="font-medium">
              {currentWorkId ? '当前作品' : '未选择作品'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>搜索</span>
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>导出</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>设置</span>
          </button>
          <div className="h-5 w-px bg-neutral-200" />
          <button
            onClick={toggleChatPanel}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
              isChatPanelOpen
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-neutral-600 hover:bg-neutral-100'
            )}
          >
            {isChatPanelOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
            <span>AI 助手</span>
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：画布区域 */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* 画布 */}
          <div className="flex-1 overflow-auto p-4">
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <ActiveCanvas />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* 底部 Tab 切换 */}
          <nav className="h-12 flex items-center px-4 gap-1 border-t border-neutral-200 bg-white shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = currentTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </main>

        {/* 右侧：AI 对话面板 */}
        {isChatPanelOpen && (
          <aside className="w-[320px] border-l border-neutral-200 bg-white shrink-0 flex flex-col">
            <ChatPanel />
          </aside>
        )}
      </div>

      {/* 全局弹窗 */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  )
}

export default App
