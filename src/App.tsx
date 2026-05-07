import { lazy, Suspense, useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/auth-store'
import { useInitData } from '@/hooks/use-init-data'
import type { ModuleTab } from '@/types'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { LoadingFallback } from '@/components/LoadingFallback'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { cn } from '@/lib/utils'
import { Loader2, Moon, Sun } from 'lucide-react'
import { useState, useCallback } from 'react'
import { exportWork } from '@/lib/export'
import { importWork } from '@/lib/import'
import { showToast } from '@/utils/toast'
import { readAllWorks, writeAddWork } from '@/db/operations'
import { generateWorkId } from '@/utils/id-generator'
import type { Work } from '@/types'
import { SearchModal } from '@/components/search/SearchModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'
import { api } from '@/api/client'

const CharacterCanvas = lazy(() => import('@/modules/character/CharacterCanvas').then(m => ({ default: m.CharacterCanvas })))
const PlotCanvas = lazy(() => import('@/modules/plot/PlotCanvas').then(m => ({ default: m.PlotCanvas })))
const RelationCanvas = lazy(() => import('@/modules/relation/RelationCanvas').then(m => ({ default: m.RelationCanvas })))
const SystemCanvas = lazy(() => import('@/modules/system/SystemCanvas').then(m => ({ default: m.SystemCanvas })))
const IdeaCanvas = lazy(() => import('@/modules/idea/IdeaCanvas').then(m => ({ default: m.IdeaCanvas })))
const EventCanvas = lazy(() => import('@/modules/event/EventCanvas').then(m => ({ default: m.EventCanvas })))
const ReportCanvas = lazy(() => import('@/modules/report/ReportCanvas').then(m => ({ default: m.ReportCanvas })))
import {
  Users,
  GitBranch,
  Network,
  Layers,
  Lightbulb,
  FileCheck,
  CalendarDays,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Download,
  Upload,
  Settings,
  BookOpen,
  ChevronDown,
  Plus,
  Trash2,
} from 'lucide-react'

const TABS = [
  { id: 'character' as const, label: '角色', icon: Users },
  { id: 'plot' as const, label: '剧情', icon: GitBranch },
  { id: 'relation' as const, label: '关系', icon: Network },
  { id: 'system' as const, label: '体系', icon: Layers },
  { id: 'idea' as const, label: '灵感', icon: Lightbulb },
  { id: 'event' as const, label: '事件', icon: CalendarDays },
  { id: 'report' as const, label: '校验报告', icon: FileCheck },
]

const TAB_COMPONENTS = {
  character: CharacterCanvas,
  plot: PlotCanvas,
  relation: RelationCanvas,
  system: SystemCanvas,
  idea: IdeaCanvas,
  event: EventCanvas,
  report: ReportCanvas,
} as const

/** 有效的 Tab ID 集合（P1-010: 路由守卫） */
const VALID_TAB_IDS = new Set<string>(TABS.map((t) => t.id))

/** 从 URL hash 解析 Tab ID（P1-010: 路由守卫） */
function getTabFromHash(): ModuleTab | null {
  const hash = window.location.hash.slice(1)
  if (hash && VALID_TAB_IDS.has(hash)) return hash as ModuleTab
  return null
}

/** 默认 Tab（无效 hash 时回退） */
const DEFAULT_TAB: ModuleTab = 'character'

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = mode === 'login' ? { username, password } : { username, email, password }
      const res = await api.post<{ access_token: string }>(endpoint, payload)
      if (res.access_token) {
        useAuthStore.getState().setToken(res.access_token)
        onLogin()
      } else {
        setError('登录失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-6 bg-card border border-border rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-foreground mb-1">织文</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">AI 网文创作助手</p>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('login')}
            className={cn('flex-1 py-2 text-sm font-medium rounded-md transition-colors', mode === 'login' ? 'bg-brand text-white' : 'bg-accent text-muted-foreground')}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className={cn('flex-1 py-2 text-sm font-medium rounded-md transition-colors', mode === 'register' ? 'bg-brand text-white' : 'bg-accent text-muted-foreground')}
          >
            注册
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
          {mode === 'register' && (
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          )}
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm font-medium bg-brand text-white rounded-md hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  )
}

function App() {
  const {
    currentTab,
    setCurrentTab,
    isChatPanelOpen,
    toggleChatPanel,
    currentWorkId,
  } = useAppStore()

  const { token, isLoading: authLoading, setIsLoading, setUser } = useAuthStore()
  const [authChecked, setAuthChecked] = useState(false)

  // 验证 token 有效性
  useEffect(() => {
    async function verify() {
      if (!token) {
        setAuthChecked(true)
        setIsLoading(false)
        return
      }
      try {
        const user = await api.get<{ id: number; username: string; email: string }>('/api/me')
        setUser(user)
      } catch {
        useAuthStore.getState().setToken(null)
      }
      setAuthChecked(true)
      setIsLoading(false)
    }
    verify()
  }, [token])

  if (!authChecked || authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!token) {
    return <LoginPage onLogin={() => setAuthChecked(true)} />
  }

  const isReady = useInitData(currentWorkId)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isWorkMenuOpen, setIsWorkMenuOpen] = useState(false)
  const [works, setWorks] = useState<Work[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('wangwen-theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // === P1-010: Hash 路由 + 404 回退 ===
  // 页面加载时从 URL hash 恢复 Tab，无效 hash 回退到默认
  useEffect(() => {
    const hashTab = getTabFromHash()
    if (hashTab && hashTab !== currentTab) {
      setCurrentTab(hashTab)
    } else if (!hashTab && window.location.hash.slice(1)) {
      // hash 存在但无效，清除并回退到默认
      window.location.hash = DEFAULT_TAB
      if (currentTab !== DEFAULT_TAB) {
        setCurrentTab(DEFAULT_TAB)
      }
    }
  }, [])

  // 监听 hash 变化（浏览器前进/后退），无效 hash 回退到默认
  useEffect(() => {
    const handleHashChange = () => {
      const hashTab = getTabFromHash()
      if (hashTab && hashTab !== currentTab) {
        setCurrentTab(hashTab)
      } else if (!hashTab && window.location.hash.slice(1)) {
        // hash 存在但无效，回退到默认
        window.location.hash = DEFAULT_TAB
        if (currentTab !== DEFAULT_TAB) {
          setCurrentTab(DEFAULT_TAB)
        }
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

  // UI-002: 暗色模式切换 + localStorage 持久化
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('wangwen-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // 监听系统主题变化（仅在用户未手动设置时跟随）
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('wangwen-theme')) {
        setIsDark(e.matches)
      }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const handleExport = useCallback(async () => {
    if (!currentWorkId || isExporting) return
    setIsExporting(true)
    try {
      await exportWork(currentWorkId)
      showToast('导出成功', { type: 'success' })
    } catch (err) {
      console.error('导出失败', err)
      showToast(`导出失败: ${err instanceof Error ? err.message : '未知错误'}`, { type: 'error' })
    } finally {
      setIsExporting(false)
    }
  }, [currentWorkId, isExporting])

  // Batch7: 加载作品列表
  const loadWorks = useCallback(async () => {
    try {
      const list = await readAllWorks()
      setWorks(list)
      // 如果没有作品，自动创建一个默认作品
      if (list.length === 0) {
        const defaultWork: Work = {
          id: 'default',
          name: '我的第一部作品',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await writeAddWork(defaultWork)
        setWorks([defaultWork])
        setCurrentWorkId('default')
      }
    } catch (err) {
      console.error('加载作品列表失败:', err)
    }
  }, [setCurrentWorkId])

  useEffect(() => {
    loadWorks()
  }, [loadWorks])

  // Batch7: 导入作品
  const handleImport = useCallback(async (file: File) => {
    setIsImporting(true)
    try {
      const result = await importWork(file)
      if (result.success) {
        showToast('导入成功', { type: 'success' })
        await loadWorks()
        setCurrentWorkId(result.workId)
      } else {
        showToast(result.error, { type: 'error' })
      }
    } catch (err) {
      showToast(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`, { type: 'error' })
    } finally {
      setIsImporting(false)
    }
  }, [loadWorks, setCurrentWorkId])

  // Batch7: 创建新作品
  const handleCreateWork = useCallback(async () => {
    const name = window.prompt('请输入作品名称:')
    if (!name?.trim()) return
    const work: Work = {
      id: generateWorkId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const result = await writeAddWork(work)
    if (result.success) {
      showToast('作品创建成功', { type: 'success' })
      await loadWorks()
      setCurrentWorkId(work.id)
      setIsWorkMenuOpen(false)
    } else {
      showToast('作品创建失败', { type: 'error' })
    }
  }, [loadWorks, setCurrentWorkId])

  // 全局键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Esc: 关闭弹窗
      if (e.key === 'Escape') {
        if (isSearchOpen) { setIsSearchOpen(false); e.preventDefault(); return }
        if (isSettingsOpen) { setIsSettingsOpen(false); e.preventDefault(); return }
      }

      // Ctrl/Cmd + K: 搜索（不在输入框时）
      if (isMod && e.key === 'k' && !isInput) {
        e.preventDefault()
        setIsSearchOpen(true)
        return
      }

      // Ctrl/Cmd + D: 切换暗色模式
      if (isMod && e.key === 'd') {
        e.preventDefault()
        setIsDark((d) => !d)
        return
      }

      // Ctrl/Cmd + Shift + E: 导出
      if (isMod && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        handleExport()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen, isSettingsOpen, handleExport])

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
      {/* P2-002: 离线状态提示横幅 */}
      <OfflineBanner />
      {/* 顶部导航栏 */}
      <header className="h-[52px] flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand dark:text-brand-hover" />
            <span className="font-semibold text-foreground">织文</span>
          </div>
          <div className="h-5 w-px bg-border" />
          {/* Batch7: 作品切换下拉 */}
          <div className="relative">
            <button
              onClick={() => setIsWorkMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="font-medium max-w-[120px] truncate">
                {works.find((w) => w.id === currentWorkId)?.name || '未选择作品'}
              </span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', isWorkMenuOpen && 'rotate-180')} />
            </button>
            {isWorkMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsWorkMenuOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                  <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">作品列表</div>
                  {works.map((work) => (
                    <button
                      key={work.id}
                      onClick={() => {
                        setCurrentWorkId(work.id)
                        setIsWorkMenuOpen(false)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between',
                        currentWorkId === work.id && 'text-brand bg-brand-light/50'
                      )}
                    >
                      <span className="truncate">{work.name}</span>
                      {currentWorkId === work.id && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={handleCreateWork}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2 text-brand"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新建作品
                  </button>
                </div>
              </>
            )}
          </div>
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
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>导入</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
                e.target.value = ''
              }}
            />
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
            onClick={() => useAuthStore.getState().logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors"
          >
            退出
          </button>
          <button
            onClick={toggleChatPanel}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
              isChatPanelOpen
                      ? 'text-brand dark:text-brand-hover bg-brand-light dark:bg-brand-active/10'
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
                ? 'text-brand dark:text-brand-hover bg-brand-light dark:bg-brand-active/10'
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
