import OpenAI from 'openai'
import type { AIChatOptions, AIStreamChunk, AIChatMessage } from './types'

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'

const client = new OpenAI({
  baseURL: BASE_URL,
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function* chatStream(options: AIChatOptions): AsyncGeneratorGenerator<AIStreamChunk> {
  if (!API_KEY) {
    throw new Error('DeepSeek API Key 未配置，请在 .env.local 中设置 VITE_DEEPSEEK_API_KEY')
  }

  const stream = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: options.messages as any,
    tools: options.tools as any,
    stream: true,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  })

  for await (const chunk of stream) {
    yield chunk as unknown as AIStreamChunk
  }
}

export async function chatOnce(options: AIChatOptions): Promise<string> {
  if (!API_KEY) {
    throw new Error('DeepSeek API Key 未配置，请在 .env.local 中设置 VITE_DEEPSEEK_API_KEY')
  }

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: options.messages as any,
    tools: options.tools as any,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  })

  return response.choices[0]?.message?.content ?? ''
}

export function createSystemPrompt(base: string, context: string): AIChatMessage {
  return {
    role: 'system',
    content: `${base}\n\n---\n\n当前作品上下文:\n${context}`,
  }
}
