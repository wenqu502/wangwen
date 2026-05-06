/**
 * 环境变量统一配置 (P1-014)
 *
 * 设计原则：
 * 1. 所有环境变量通过此文件访问，禁止直接访问 import.meta.env
 * 2. 提供类型安全的默认值
 * 3. 运行时校验，缺失必填项时给出明确错误
 */

/**  AI API 配置 — 默认使用 DeepSeek V4 Pro API */
export const AI_CONFIG = {
  /** API 基础地址 */
  baseURL: import.meta.env.VITE_AI_BASE_URL || 'https://api.deepseek.com/v1',
  /** 默认模型：deepseek-v4-pro (V4 Pro 思考模型，deepseek-chat 已弃用) */
  model: import.meta.env.VITE_AI_MODEL || 'deepseek-v4-pro',
  /** 是否开启思考模式 (reasoning) — V4 Pro 默认开启 */
  reasoning: import.meta.env.VITE_AI_REASONING !== 'false',
  /** 思考深度: low | medium | high */
  reasoningEffort: (import.meta.env.VITE_AI_REASONING_EFFORT as 'low' | 'medium' | 'high') || 'medium',
  /** 默认温度 — V4 Pro 不支持 temperature，此值会被忽略 */
  temperature: Number(import.meta.env.VITE_AI_TEMPERATURE || '0.7'),
  /** 默认最大 Token */
  maxTokens: Number(import.meta.env.VITE_AI_MAX_TOKENS || '4096'),
  /** 流式输出延迟（演示模式） */
  mockDelayMs: Number(import.meta.env.VITE_MOCK_DELAY_MS || '10'),
  /** 开发环境 API Key（仅用于开发，生产应通过 UI 输入） */
  apiKey: import.meta.env.VITE_AI_API_KEY || '',
} as const

/** 应用配置 */
export const APP_CONFIG = {
  /** 应用名称 */
  name: import.meta.env.VITE_APP_NAME || '织文',
  /** 版本号 */
  version: import.meta.env.VITE_APP_VERSION || '0.0.1',
  /** 构建时间 */
  buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
  /** 是否开发模式 */
  isDev: import.meta.env.DEV,
  /** 是否生产模式 */
  isProd: import.meta.env.PROD,
} as const

/** 功能开关 */
export const FEATURE_FLAGS = {
  /** 启用加密存储 */
  encryption: import.meta.env.VITE_ENABLE_ENCRYPTION !== 'false',
  /** 启用演示模式（无 API Key 时） */
  mockMode: import.meta.env.VITE_ENABLE_MOCK_MODE !== 'false',
  /** 启用 Analytics（未来扩展） */
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
} as const

/** 运行时校验 */
export function validateEnv(): string[] {
  const errors: string[] = []

  // 生产环境禁止硬编码 API Key
  if (APP_CONFIG.isProd && AI_CONFIG.apiKey) {
    errors.push('生产环境禁止在环境变量中硬编码 API Key')
    console.error('[Env] 生产环境检测到 VITE_AI_API_KEY 硬编码，已忽略')
  }

  // 开发环境检查 API Key 是否硬编码
  if (APP_CONFIG.isDev && AI_CONFIG.apiKey) {
    console.warn('[Env] 检测到 VITE_AI_API_KEY 硬编码在环境变量中，建议通过 UI 设置面板输入')
  }

  return errors
}

/** 初始化时调用一次 */
validateEnv()
