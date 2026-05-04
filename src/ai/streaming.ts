import { chatStream, mockChatStream, isMockMode } from './client'
import type { AIChatOptions } from './types'

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
): Promise<StreamingResult> {
  let fullContent = ''
  const toolCallMap = new Map<string, { id: string; name: string; args: string }>()

  const stream = isMockMode() ? mockChatStream(options) : chatStream(options)

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta
    if (!delta) continue

    if (delta.content) {
      fullContent += delta.content
      onContent(fullContent)
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const existing = toolCallMap.get(tc.id)
        if (existing) {
          existing.name = existing.name || tc.function?.name || ''
          existing.args += tc.function?.arguments || ''
        } else {
          toolCallMap.set(tc.id, {
            id: tc.id,
            name: tc.function?.name || '',
            args: tc.function?.arguments || '',
          })
        }
      }
    }
  }

  const toolCalls = Array.from(toolCallMap.values()).map((tc) => ({
    id: tc.id,
    name: tc.name,
    arguments: safeParseJSON(tc.args),
  }))

  return { content: fullContent, toolCalls }
}

function safeParseJSON(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str)
  } catch {
    return {}
  }
}
