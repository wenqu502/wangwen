export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface AIChatOptions {
  messages: AIChatMessage[]
  tools?: ToolDefinition[]
  stream?: boolean
  temperature?: number
  maxTokens?: number
  /** AbortSignal for user-initiated cancellation */
  signal?: AbortSignal
}

export type AIStreamChunk = {
  choices: Array<{
    delta: {
      content?: string
      tool_calls?: ToolCall[]
    }
    finish_reason: string | null
  }>
}

// === 对话历史管理类型 ===

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface ConversationMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  parentId?: string
  branchId?: string
  toolCalls?: ToolCall[]
  toolResults?: Array<{ toolCallId: string; success: boolean; message: string }>
}

export interface ConversationBranch {
  id: string
  name: string
  parentMessageId?: string
  messages: ConversationMessage[]
}

export interface Conversation {
  id: string
  workId: string
  title: string
  branches: ConversationBranch[]
  activeBranchId: string
  createdAt: string
  updatedAt: string
}

// === 提示词模板 ===

export interface PromptTemplate {
  id: string
  label: string
  description: string
  category: 'character' | 'plot' | 'relation' | 'system' | 'idea' | 'general'
  icon?: string
  systemPrompt?: string
  userPrompt: string
}

// === 导出格式 ===

export type ExportFormat = 'text' | 'markdown'
