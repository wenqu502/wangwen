/**
 * 本地数据加密工具
 * 使用 Web Crypto API (AES-GCM) 对敏感字段进行加密
 * 密钥通过用户密码 + PBKDF2 派生，仅存储在内存中
 */

const ENCRYPTION_VERSION = 1
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_ITERATIONS = 100000

interface EncryptedField {
  v: number      // 加密版本
  salt: string   // Base64 salt
  iv: string     // Base64 IV
  data: string   // Base64 密文
}

let _derivedKey: CryptoKey | null = null
let _keyPassword: string | null = null

/**
 * 从密码派生加密密钥（PBKDF2 + AES-GCM）
 * 密钥仅保存在内存中，页面刷新后需重新输入密码
 */
export async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // 使用固定 salt 做快速校验（实际加密时每次用随机 salt）
  const fixedSalt = encoder.encode('wangwen-fixed-salt-v1')
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fixedSalt,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 设置加密密码（用户输入后调用）
 */
export async function setEncryptionPassword(password: string): Promise<void> {
  _derivedKey = await deriveKey(password)
  _keyPassword = password
}

/**
 * 清除内存中的密钥
 */
export function clearEncryptionKey(): void {
  _derivedKey = null
  _keyPassword = null
}

/**
 * 检查是否已设置加密密钥
 */
export function isEncryptionReady(): boolean {
  return _derivedKey !== null
}

/**
 * 加密单个字段
 */
export async function encryptField(plaintext: string): Promise<EncryptedField> {
  if (!_derivedKey) {
    throw new Error('加密密钥未设置，请先调用 setEncryptionPassword()')
  }

  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  // 使用随机 salt 重新派生密钥（增强安全性）
  const password = _keyPassword!
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encoder.encode(plaintext)
  )

  return {
    v: ENCRYPTION_VERSION,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(ciphertext),
  }
}

/**
 * 解密单个字段
 */
export async function decryptField(encrypted: EncryptedField): Promise<string> {
  if (!_derivedKey) {
    throw new Error('加密密钥未设置，无法解密数据')
  }

  if (encrypted.v !== ENCRYPTION_VERSION) {
    throw new Error(`不支持的加密版本: ${encrypted.v}`)
  }

  const encoder = new TextEncoder()
  const salt = base64ToArrayBuffer(encrypted.salt)
  const iv = base64ToArrayBuffer(encrypted.iv)
  const data = base64ToArrayBuffer(encrypted.data)

  // 使用存储的 salt 重新派生密钥
  const password = _keyPassword!
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    data
  )

  return new TextDecoder().decode(decrypted)
}

// === 辅助函数 ===

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
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

/**
 * 标记字段是否需要加密（根据字段名判断）
 */
export function shouldEncryptField(fieldName: string): boolean {
  const sensitiveFields = [
    'background',
    'appearance',
    'content',
    'description',
    'summary',
    'notes',
    'contentText',
    'appearanceDesc',
    'innerThoughts',
    'privateNotes',
    'trauma',
    'goals',
    'arc',
  ]
  return sensitiveFields.includes(fieldName)
}

/**
 * 递归加密对象中的敏感字段
 */
export async function encryptObjectFields<T extends Record<string, unknown>>(obj: T): Promise<T> {
  if (!isEncryptionReady()) return obj
  const result: Record<string, unknown> = { ...obj }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && shouldEncryptField(key) && value.length > 0) {
      result[key] = await encryptField(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = await encryptObjectFields(value as Record<string, unknown>)
    }
  }

  return result as T
}

/**
 * 递归解密对象中的敏感字段
 */
export async function decryptObjectFields<T extends Record<string, unknown>>(obj: T): Promise<T> {
  if (!isEncryptionReady()) return obj
  const result: Record<string, unknown> = { ...obj }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && 'v' in value && 'salt' in value && 'iv' in value && 'data' in value) {
      try {
        result[key] = await decryptField(value as EncryptedField)
      } catch {
        // 解密失败保留原值（可能是明文旧数据）
        result[key] = value
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = await decryptObjectFields(value as Record<string, unknown>)
    }
  }

  return result as T
}
