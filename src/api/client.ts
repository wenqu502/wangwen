const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000')

function getToken(): string | null {
  return localStorage.getItem('wangwen_token')
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function keysToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(keysToSnake)
  if (obj === null || typeof obj !== 'object') return obj
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = keysToSnake(value)
  }
  return result
}

function keysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(keysToCamel)
  if (obj === null || typeof obj !== 'object') return obj
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = keysToCamel(value)
  }
  return result
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const payload = body ? JSON.stringify(keysToSnake(body)) : undefined

  const res = await fetch(url, {
    method,
    headers,
    body: payload,
  })

  if (res.status === 401) {
    localStorage.removeItem('wangwen_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json()
    return keysToCamel(data) as T
  }
  return undefined as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
