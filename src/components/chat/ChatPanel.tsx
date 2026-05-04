import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Send, Bot, User, Loader2, Sparkles, Users, GitBranch, Network, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { handleStreamingResponse } from '@/ai/streaming'
import { createSystemPrompt } from '@/ai/client'
import { tools } from '@/ai/function-calling'
import { executeTool } from '@/ai/tool-executor'

export function ChatPanel() {
  const { messages, addMessage, updateMessage, isLoading, setIsLoading } = useAppStore()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsgId = `msg_${Date.now()}`
    const assistantMsgId = `msg_${Date.now() + 1}`

    const userMsg = {
      id: userMsgId,
      role: 'user' as const,
      content: input.trim(),
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    setInput('')
    setIsLoading(true)

    // 预先添加空的 assistant 消息占位，用于流式更新
    addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    })

    try {
      const systemPrompt = createSystemPrompt(
        '你是织文 (WangWen) 的 AI 创作助手，专门协助网文作者进行创作。你可以帮助用户创建角色、规划剧情、梳理人物关系、设计世界观体系、记录灵感等。',
        '当前暂无作品上下文。'
      )

      const result = await handleStreamingResponse(
        {
          messages: [
            systemPrompt,
            ...messages.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: userMsg.content },
          ],
          tools,
          temperature: 0.7,
        },
        (text) => {
          updateMessage(assistantMsgId, text)
        }
      )

      // 流式完成后，如果有 toolCalls 则执行
      if (result.toolCalls.length > 0) {
        console.log('[ChatPanel] Tool calls:', result.toolCalls)
        const results = result.toolCalls.map((tc) => executeTool(tc))
        const successCount = results.filter((r) => r.success).length
        const failCount = results.length - successCount

        // 在 assistant 消息后追加工具执行结果
        const resultText = results.map((r) => (r.success ? `✅ ${r.message}` : `❌ ${r.message}`)).join('\n')
        const currentMsg = useAppStore.getState().messages.find((m) => m.id === assistantMsgId)
        if (currentMsg) {
          updateMessage(
            assistantMsgId,
            `${currentMsg.content}\n\n**操作结果** (${successCount}成功${failCount > 0 ? `, ${failCount}失败` : ''}):\n${resultText}`
          )
        }
      }
    } catch (err) {
      updateMessage(
        assistantMsgId,
        `抱歉，AI 调用出错：${err instanceof Error ? err.message : '未知错误'}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 面板标题 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 shrink-0">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <span className="font-semibold text-neutral-900">AI 创作助手</span>
      </div>

      {/* 消息列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-neutral-400">
            <Bot className="w-12 h-12" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-500">AI 创作助手</p>
              <p className="text-xs">描述你的想法，我来帮你生成角色、剧情和关系</p>
            </div>
            <div className="space-y-2 w-full px-2">
              {[
                '帮我创建一个剑修男主，性格沉稳但内心有创伤',
                '规划一个复仇主线，前期隐忍后期爆发',
                '根据现有角色梳理人物关系网络',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-md transition-colors border border-neutral-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2.5',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-100 text-indigo-600'
              )}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-neutral-100 text-neutral-800 rounded-bl-md'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-neutral-100 px-3 py-2 rounded-2xl rounded-bl-md">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            </div>
          </div>
        )}
      </div>

      {/* 快捷指令 */}
      <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 border-t border-neutral-100 shrink-0">
        {QUICK_COMMANDS.map((cmd) => {
          const Icon = cmd.icon
          return (
            <button
              key={cmd.id}
              onClick={() => setInput(cmd.text)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-600 bg-neutral-50 hover:bg-indigo-50 hover:text-indigo-600 border border-neutral-200 rounded-md transition-colors"
            >
              <Icon className="w-3 h-3" />
              <span>{cmd.label}</span>
            </button>
          )
        })}
      </div>

      {/* 输入框 */}
      <div className="p-3 border-t border-neutral-200 shrink-0">
        <div className="flex items-end gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你的创作想法..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 resize-none outline-none min-h-[20px] max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="发送"
            className={cn(
              'p-1.5 rounded-lg transition-colors shrink-0',
              input.trim() && !isLoading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 mt-1.5 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  )
}

const QUICK_COMMANDS = [
  { id: 'char', label: '生成角色', text: '帮我创建一个新角色', icon: Users },
  { id: 'plot', label: '续写剧情', text: '帮我规划一段剧情', icon: GitBranch },
  { id: 'rel', label: '梳理关系', text: '根据现有角色梳理人物关系', icon: Network },
  { id: 'sys', label: '设计体系', text: '帮我设计一个世界观体系', icon: Layers },
]
