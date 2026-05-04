/// <reference types="vite/client" />
import OpenAI from 'openai'
import type { AIChatOptions, AIStreamChunk, AIChatMessage } from './types'

// === API Key 安全读取策略 ===
// 1. 优先从 localStorage 读取（用户通过 UI 输入，不在代码中硬编码）
// 2. 回退到环境变量（开发时可用 .env.local，生产构建应清空）
// 3. 如果都没有，提示用户输入
function getApiKey(): string {
  const LS_KEY = 'wangwen:deepseek-api-key'
  const fromStorage = localStorage.getItem(LS_KEY)
  if (fromStorage) return fromStorage

  const fromEnv = import.meta.env.VITE_DEEPSEEK_API_KEY
  if (fromEnv && fromEnv !== 'your_api_key_here') return fromEnv

  return ''
}

const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'

function createClient() {
  const apiKey = getApiKey()
  return new OpenAI({
    baseURL: BASE_URL,
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

export function saveApiKey(key: string): void {
  localStorage.setItem('wangwen:deepseek-api-key', key.trim())
}

export function clearApiKey(): void {
  localStorage.removeItem('wangwen:deepseek-api-key')
}

export async function* chatStream(options: AIChatOptions): AsyncGenerator<AIStreamChunk> {
  if (!hasApiKey()) {
    throw new Error('DeepSeek API Key 未配置，请在设置面板中输入您的 API Key')
  }

  const client = createClient()
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
  if (!hasApiKey()) {
    throw new Error('DeepSeek API Key 未配置，请在设置面板中输入您的 API Key')
  }

  const client = createClient()
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
