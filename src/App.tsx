import { lazy, Suspense, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useInitData } from '@/hooks/use-init-data'
import type { ModuleTab } from '@/types'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { LoadingFallback } from '@/components/LoadingFallback'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { cn } from '@/lib/utils'
import { Loader2, Moon, Sun } from 'lucide-react'
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

/** 有效的 Tab ID 集合（P1-010: 路由守卫） */
const VALID_TAB_IDS = new Set<string>(TABS.map((t) => t.id))

/** 从 URL hash 解析 Tab ID */
function getTabFromHash(): ModuleTab | null {
  const hash = window.location.hash.slice(1)
  if (hash && VALID_TAB_IDS.has(hash)) return hash as ModuleTab
  return null
}

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
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  // === P1-010: Hash 路由 ===
  // 页面加载时从 URL hash 恢复 Tab
  useEffect(() => {
    const hashTab = getTabFromHash()
    if (hashTab && hashTab !== currentTab) {
      setCurrentTab(hashTab)
    }
  }, [])

  // 监听 hash 变化（浏览器前进/后退）
  useEffect(() => {
    const handleHashChange = () => {
      const hashTab = getTabFromHash()
      if (hashTab && hashTab !== currentTab) {
        setCurrentTab(hashTab)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [currentTab, setCurrentTab])

  // Tab 切换时同步到 URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash !== currentTab) {
      window.location.hash = currentTab
    }
  }, [currentTab])

  // UI-002: 暗色模式切换
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

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
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">加载数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="h-[52px] flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-foreground">织文</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="font-medium">
              {currentWorkId ? '当前作品' : '未选择作品'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>搜索</span>
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>导出</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>设置</span>
          </button>
          <button
            onClick={() => setIsDark((d) => !d)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors"
            aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="h-5 w-px bg-border" />
          <button
            onClick={toggleChatPanel}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
              isChatPanelOpen
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                : 'text-muted-foreground hover:bg-accent'
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
          <nav className="h-12 flex items-center px-4 gap-1 border-t border-border bg-card shrink-0">
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
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
          <aside className="w-[320px] border-l border-border bg-card shrink-0 flex flex-col">
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
