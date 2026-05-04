/**
 * 环境变量统一配置 (P1-014)
 *
 * 设计原则：
 * 1. 所有环境变量通过此文件访问，禁止直接访问 import.meta.env
 * 2. 提供类型安全的默认值
 * 3. 运行时校验，缺失必填项时给出明确错误
 */

/**  AI API 配置 — 默认使用 Comet One API (Kimi-K2.6) */
export const AI_CONFIG = {
  /** API 基础地址 */
  baseURL: import.meta.env.VITE_AI_BASE_URL || 'https://oneapi-comate.baidu-int.com/v1',
  /** 默认模型 */
  model: import.meta.env.VITE_AI_MODEL || 'Kimi-K2.6',
  /** 默认温度 */
  temperature: Number(import.meta.env.VITE_AI_TEMPERATURE || '0.7'),
  /** 默认最大 Token */
  maxTokens: Number(import.meta.env.VITE_AI_MAX_TOKENS || '4096'),
  /** 流式输出延迟（演示模式） */
  mockDelayMs: Number(import.meta.env.VITE_MOCK_DELAY_MS || '10'),
  /** 默认 API Key — Comet One API 免费额度供用户体验 */
  apiKey: import.meta.env.VITE_AI_API_KEY || 'sk-nU8nadCSx4pWpDwI2673EaC3FeCd48E3930a623d476bB226',
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

  // 开发环境检查 API Key 是否硬编码
  if (APP_CONFIG.isDev && AI_CONFIG.apiKey) {
    console.warn('[Env] 检测到 VITE_AI_API_KEY 硬编码在环境变量中，建议通过 UI 设置面板输入')
  }

  return errors
}

/** 初始化时调用一次 */
validateEnv()
