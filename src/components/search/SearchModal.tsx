import { useState, useEffect, useRef } from 'react'
import { X, Search, Users, GitBranch, Network, Layers, Lightbulb, Loader2 } from 'lucide-react'
import { db } from '@/db'
import { useAppStore } from '@/stores/app-store'
import { useDebounce } from '@/hooks/use-debounce'
import type { Character, PlotNode, RelationEdge, WorkSystem, Idea } from '@/types'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

type SearchResultItem = {
  type: 'character' | 'plot' | 'relation' | 'system' | 'idea'
  id: string
  title: string
  subtitle: string
  icon: React.ElementType
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const currentWorkId = useAppStore((s) => s.currentWorkId)
  const setCurrentTab = useAppStore((s) => s.setCurrentTab)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (!debouncedQuery.trim() || !currentWorkId) {
      setResults([])
      setLoading(false)
      return
    }

    const q = debouncedQuery.toLowerCase()
    let cancelled = false

    setLoading(true)
    Promise.all([
      db.characters.where('workId').equals(currentWorkId).toArray(),
      db.plotNodes.where('workId').equals(currentWorkId).toArray(),
      db.relations.where('workId').equals(currentWorkId).toArray(),
      db.systems.where('workId').equals(currentWorkId).toArray(),
      db.ideas.where('workId').equals(currentWorkId).toArray(),
    ]).then(([chars, plots, rels, sys, ideas]) => {
      if (cancelled) return
      const items: SearchResultItem[] = []

      chars.forEach((c: Character) => {
        if (c.name.toLowerCase().includes(q) || (c.aliases || []).some((a: string) => a.toLowerCase().includes(q))) {
          items.push({ type: 'character', id: c.id, title: c.name, subtitle: c.appearance?.slice(0, 20) || '角色', icon: Users })
        }
      })
      plots.forEach((p: PlotNode) => {
        if (p.title.toLowerCase().includes(q) || (p.summary || '').toLowerCase().includes(q)) {
          items.push({ type: 'plot', id: p.id, title: p.title, subtitle: p.summary?.slice(0, 20) || '剧情节点', icon: GitBranch })
        }
      })
      rels.forEach((r: RelationEdge) => {
        const text = `${r.type} ${r.description || ''}`.toLowerCase()
        if (text.includes(q)) {
          items.push({ type: 'relation', id: r.id, title: r.type, subtitle: r.description || '关系', icon: Network })
        }
      })
      sys.forEach((s: WorkSystem) => {
        if (s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)) {
          items.push({ type: 'system', id: s.id, title: s.name, subtitle: '体系', icon: Layers })
        }
      })
      ideas.forEach((i: Idea) => {
        if (i.content.toLowerCase().includes(q) || (i.tags || []).some((t: string) => t.toLowerCase().includes(q))) {
          items.push({ type: 'idea', id: i.id, title: i.content.slice(0, 30), subtitle: '灵感', icon: Lightbulb })
        }
      })

      setResults(items.slice(0, 20))
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [debouncedQuery, currentWorkId])

  const handleSelect = (item: SearchResultItem) => {
    const tabMap: Record<string, typeof item.type> = {
      character: 'character',
      plot: 'plot',
      relation: 'relation',
      system: 'system',
      idea: 'idea',
    }
    setCurrentTab(tabMap[item.type] || 'character')
    onClose()
  }

  if (!isOpen) return null

  const typeLabels: Record<string, string> = {
    character: '角色',
    plot: '剧情',
    relation: '关系',
    system: '体系',
    idea: '灵感',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[560px] max-w-[90vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索角色、剧情、关系、体系、灵感..."
            className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
          <button onClick={onClose} aria-label="关闭搜索" className="p-1 text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            query.trim() ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-400">未找到匹配结果</div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-neutral-400">输入关键词开始搜索</div>
            )
          ) : (
            results.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 truncate">{item.title}</p>
                    <p className="text-xs text-neutral-400 truncate">{item.subtitle}</p>
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">{typeLabels[item.type]}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
