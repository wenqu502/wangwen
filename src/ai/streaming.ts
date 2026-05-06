import { chatStream, mockChatStream, isMockMode } from './client'
import type { AIChatOptions } from './types'

const STREAM_TIMEOUT_MS = 30000

export interface StreamingResult {
  content: string
  toolCalls: Array<{
    id: string
    name: string
    arguments: Record<string, unknown>
  }>
}

export async function handleStreamingResponse(
  options: AIChatOptions,
  onContent: (text: string) => void,
  externalSignal?: AbortSignal,
): Promise<StreamingResult> {
  let fullContent = ''
  const toolCallMap = new Map<number, { id: string; name: string; args: string }>()

  // P1-003: AbortController 30s 超时兜底 + 支持外部取消
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => {
    abortController.abort()
    console.warn('[AI] 流式响应超时，已中断')
  }, STREAM_TIMEOUT_MS)

  // 外部 signal 与内部 timeout 联动
  const onExternalAbort = () => abortController.abort()
  externalSignal?.addEventListener('abort', onExternalAbort)

  try {
    const stream = isMockMode()
      ? mockChatStream(options, abortController.signal)
      : chatStream({ ...options, signal: abortController.signal })

    for await (const chunk of stream) {
      if (abortController.signal.aborted) break

      const delta = chunk.choices[0]?.delta
      if (!delta) continue

      if (delta.content) {
        fullContent += delta.content
        onContent(fullContent)
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          // P1-003: 使用 index 维度兜底（tc.id 在首包可能为空）
          const idx = tc.index ?? 0
          const existing = toolCallMap.get(idx)
          if (existing) {
            existing.name = existing.name || tc.function?.name || ''
            existing.args += tc.function?.arguments || ''
          } else {
            toolCallMap.set(idx, {
              id: tc.id || `call_${idx}_${Date.now()}`,
              name: tc.function?.name || '',
              args: tc.function?.arguments || '',
            })
          }
        }
      }
    }
  } finally {
    clearTimeout(timeoutId)
    externalSignal?.removeEventListener('abort', onExternalAbort)
  }

  const toolCalls = Array.from(toolCallMap.values()).map((tc) => {
    const parsed = safeParseJSON(tc.args)
    return {
      id: tc.id,
      name: tc.name,
      arguments: parsed,
    }
  })

  return { content: fullContent, toolCalls }
}

// P1-003: safeParseJSON 不再静默失败，返回错误标记对象
function safeParseJSON(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str)
  } catch (err) {
    console.error('[AI] JSON 解析失败:', str, err)
    return { _parseError: true, _rawArgs: str }
  }
}
