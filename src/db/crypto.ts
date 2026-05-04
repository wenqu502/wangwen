/**
 * IndexedDB 数据加密模块 (P2-001)
 *
 * 设计原则：
 * 1. 透明加密：通过 Dexie hooks 自动处理，业务层无感知
 * 2. AES-256-GCM：认证加密，防篡改
 * 3. 可选开启：默认关闭，兼容现有明文数据
 * 4. 密钥本地管理：随机生成，存储于 localStorage (简化方案)
 * 5. 安全降级：密钥丢失则加密数据不可恢复（符合加密预期）
 */

const ENC_PREFIX = '$$ENC$:'
const CRYPTO_KEY_STORAGE = 'wangwen-db-key'
const CRYPTO_CONFIG_STORAGE = 'wangwen-db-crypto-config'

/** 各表敏感字段映射（不在列表中的字段视为元数据，不加密） */
export const SENSITIVE_FIELDS: Record<string, string[]> = {
  works: ['name', 'genre', 'description'],
  characters: ['name', 'aliases', 'appearance', 'personality', 'background', 'trauma', 'goals', 'arc', 'quotes', 'abilities', 'relations'],
  plotNodes: ['title', 'summary', 'content', 'location', 'condition', 'foreshadowing', 'payoff'],
  relations: ['type', 'description'],
  systems: ['name', 'description', 'branches', 'rules'],
  ideas: ['content', 'tags'],
}

/** 加密配置 */
export interface CryptoConfig {
  enabled: boolean
  /** 密钥版本，用于未来密钥轮换 */
  version: number
}

/** 运行时加密状态 */
export interface CryptoState {
  enabled: boolean
  key: CryptoKey | null
}

export const cryptoState: CryptoState = {
  enabled: false,
  key: null,
}

// ===== 配置读写 =====

export function getCryptoConfig(): CryptoConfig {
  try {
    const raw = localStorage.getItem(CRYPTO_CONFIG_STORAGE)
    if (raw) return JSON.parse(raw) as CryptoConfig
  } catch { /* ignore corrupt config */ }
  return { enabled: false, version: 1 }
}

export function setCryptoConfig(config: CryptoConfig): void {
  localStorage.setItem(CRYPTO_CONFIG_STORAGE, JSON.stringify(config))
}

// ===== 密钥管理 =====

/** 生成随机 AES-256-GCM 密钥 */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable，用于导出到 localStorage
    ['encrypt', 'decrypt'],
  )
}

/** 导出密钥为 JWK 字符串 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey('jwk', key)
  return JSON.stringify(jwk)
}

/** 从 JWK 字符串导入密钥 */
export async function importKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString)
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
}

/** 获取已有密钥；如不存在则生成并持久化 */
export async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(CRYPTO_KEY_STORAGE)
  if (stored) {
    return importKey(stored)
  }
  const key = await generateKey()
  localStorage.setItem(CRYPTO_KEY_STORAGE, await exportKey(key))
  return key
}

/** 清除本地密钥（禁用加密时调用） */
export function clearKey(): void {
  localStorage.removeItem(CRYPTO_KEY_STORAGE)
}

// ===== 加解密核心 =====

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/** 判断值是否已加密 */
export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX)
}

/**
 * 加密单个字段值
 * - 对任意类型先 JSON.stringify，再 AES-GCM 加密
 * - 输出格式：$$ENC$:<base64(iv + ciphertext)>
 */
export async function encryptField(value: unknown, key: CryptoKey): Promise<unknown> {
  if (value === undefined || value === null) return value

  const plaintext = JSON.stringify(value)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)

  return ENC_PREFIX + arrayBufferToBase64(combined)
}

/**
 * 解密单个字段值
 * - 若值不是加密格式，原样返回
 * - 解密后 JSON.parse 恢复原始类型
 */
export async function decryptField(value: unknown, key: CryptoKey): Promise<unknown> {
  if (!isEncrypted(value)) return value

  const data = base64ToArrayBuffer(value.slice(ENC_PREFIX.length))
  const iv = data.slice(0, 12)
  const encrypted = data.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    encrypted,
  )

  return JSON.parse(new TextDecoder().decode(decrypted))
}

// ===== 批量加解密（供 Dexie hooks 使用） =====

/**
 * 对对象中的敏感字段进行加密（写入前）
 * 直接修改传入的 obj，不返回新对象（符合 Dexie hook 习惯）
 */
export async function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
  key: CryptoKey,
): Promise<void> {
  for (const field of fields) {
    if (field in obj && obj[field] !== undefined) {
      obj[field] = await encryptField(obj[field], key)
    }
  }
}

/**
 * 对对象中的敏感字段进行解密（读取后）
 * 直接修改传入的 obj
 */
export async function decryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
  key: CryptoKey,
): Promise<void> {
  for (const field of fields) {
    if (field in obj && obj[field] !== undefined && isEncrypted(obj[field])) {
      obj[field] = await decryptField(obj[field], key)
    }
  }
}

// ===== 开关控制 =====

/** 初始化加密状态（在数据库连接成功后调用） */
export async function initCrypto(): Promise<void> {
  const config = getCryptoConfig()
  if (config.enabled) {
    try {
      cryptoState.key = await getOrCreateKey()
      cryptoState.enabled = true
      console.log('[Crypto] 加密已初始化，版本:', config.version)
    } catch (err) {
      console.error('[Crypto] 密钥加载失败，加密未启用:', err)
      cryptoState.enabled = false
      cryptoState.key = null
    }
  } else {
    cryptoState.enabled = false
    cryptoState.key = null
  }
}

/** 启用加密（生成或复用密钥） */
export async function enableEncryption(): Promise<void> {
  cryptoState.key = await getOrCreateKey()
  cryptoState.enabled = true
  setCryptoConfig({ enabled: true, version: 1 })
  console.log('[Crypto] 加密已启用')
}

/** 禁用加密（不清除已有密钥，仅停止新数据加密） */
export function disableEncryption(): void {
  cryptoState.enabled = false
  // 保留密钥以便后续仍能解密已有数据
  setCryptoConfig({ enabled: false, version: 1 })
  console.log('[Crypto] 加密已禁用（保留密钥用于读取旧数据）')
}

/** 完全重置加密（清除密钥和配置，已加密数据将永久丢失） */
export function resetEncryption(): void {
  cryptoState.enabled = false
  cryptoState.key = null
  clearKey()
  setCryptoConfig({ enabled: false, version: 1 })
  console.warn('[Crypto] 加密已完全重置，已有加密数据将无法恢复')
}
