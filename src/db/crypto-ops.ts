/**
 * IndexedDB 敏感数据加密层 (P1-002)
 *
 * 设计原则：
 * 1. 加密/解密在 DB 操作层透明处理，对 Store 无感知
 * 2. 仅加密敏感字段（背景、内心、创伤、剧情内容等）
 * 3. 非敏感字段（name、status、createdAt）保持明文以支持索引查询
 * 4. 密钥由用户密码通过 PBKDF2 派生，不存储在代码中
 */

const ENCRYPTION_KEY_KEY = 'wangwen:encryption-key'
const SALT_KEY = 'wangwen:encryption-salt'

/** 派生加密密钥 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/** 生成随机盐 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

/** 加密字符串 */
export async function encrypt(text: string, key: CryptoKey): Promise<{ iv: string; cipher: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text))
  return {
    iv: Array.from(iv).join(','),
    cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  }
}

/** 解密字符串 */
export async function decrypt(payload: { iv: string; cipher: string }, key: CryptoKey): Promise<string> {
  const iv = new Uint8Array(payload.iv.split(',').map(Number))
  const cipher = Uint8Array.from(atob(payload.cipher), (c) => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  return new TextDecoder().decode(decrypted)
}

/** 保存用户密码派生的密钥（实际存储 salt，密钥每次派生） */
export async function setupEncryption(password: string): Promise<void> {
  const salt = generateSalt()
  const key = await deriveKey(password, salt)
  // 只存储 salt，密钥每次从密码重新派生
  localStorage.setItem(SALT_KEY, Array.from(salt).join(','))
  // 存储一个标记表示已启用加密
  localStorage.setItem(ENCRYPTION_KEY_KEY, 'enabled')
}

/** 获取加密密钥（如果已设置密码） */
export async function getEncryptionKey(password: string): Promise<CryptoKey | null> {
  const saltStr = localStorage.getItem(SALT_KEY)
  if (!saltStr) return null
  const salt = new Uint8Array(saltStr.split(',').map(Number))
  return deriveKey(password, salt)
}

/** 检查是否已启用加密 */
export function isEncryptionEnabled(): boolean {
  return localStorage.getItem(ENCRYPTION_KEY_KEY) === 'enabled'
}

/** 清除加密设置 */
export function clearEncryption(): void {
  localStorage.removeItem(ENCRYPTION_KEY_KEY)
  localStorage.removeItem(SALT_KEY)
}

// === 字段级加密辅助函数 ===

const SENSITIVE_FIELDS = new Set([
  'background', 'trauma', 'goals', 'arc', 'appearance',
  'personality.surface', 'personality.inner', 'personality.stressResponse',
  'summary', 'content', 'description',
])

function isSensitiveField(path: string): boolean {
  return SENSITIVE_FIELDS.has(path)
}

/** 递归加密对象中的敏感字段 */
export async function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  key: CryptoKey | null,
  path = ''
): Promise<T> {
  if (!key) return obj
  const result: Record<string, unknown> = { ...obj }

  for (const [k, v] of Object.entries(obj)) {
    const fieldPath = path ? `${path}.${k}` : k
    if (typeof v === 'string' && isSensitiveField(fieldPath) && v.length > 0) {
      result[k] = await encrypt(v, key)
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      result[k] = await encryptObject(v as Record<string, unknown>, key, fieldPath)
    }
  }

  return result as T
}

/** 递归解密对象中的敏感字段 */
export async function decryptObject<T extends Record<string, unknown>>(
  obj: T,
  key: CryptoKey | null,
  path = ''
): Promise<T> {
  if (!key) return obj
  const result: Record<string, unknown> = { ...obj }

  for (const [k, v] of Object.entries(obj)) {
    const fieldPath = path ? `${path}.${k}` : k
    if (typeof v === 'object' && v !== null && 'iv' in v && 'cipher' in v) {
      try {
        result[k] = await decrypt(v as { iv: string; cipher: string }, key)
      } catch {
        // 解密失败，保留原值（可能是明文旧数据）
        result[k] = v
      }
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      result[k] = await decryptObject(v as Record<string, unknown>, key, fieldPath)
    }
  }

  return result as T
}
