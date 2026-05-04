/**
 * 织文 (WangWen) Service Worker
 * 缓存策略：静态资源 Cache First / API Network First / 图片 Stale While Revalidate
 * 版本：v1.0.0
 */

const SW_VERSION = 'v1.0.0'
const STATIC_CACHE = `wangwen-static-${SW_VERSION}`
const API_CACHE = `wangwen-api-${SW_VERSION}`
const IMAGE_CACHE = `wangwen-image-${SW_VERSION}`
const OFFLINE_PAGE = '/offline.html'

// 缓存有效期配置
const MAX_AGE_STATIC = 30 * 24 * 60 * 60 * 1000 // 30天
const MAX_AGE_API = 5 * 60 * 1000 // 5分钟
const MAX_AGE_IMAGE = 7 * 24 * 60 * 60 * 1000 // 7天

// 安装阶段：跳过等待，立即激活
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...', SW_VERSION)
  self.skipWaiting()

  // 预缓存离线页面
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.add(OFFLINE_PAGE).catch((err) => {
        console.warn('[SW] 预缓存离线页面失败:', err)
      })
    })
  )
})

// 激活阶段：清理旧版本缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...', SW_VERSION)

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name.startsWith('wangwen-') &&
                !name.includes(SW_VERSION)
              )
            })
            .map((name) => {
              console.log('[SW] 清理旧缓存:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => self.clients.claim())
      .then(() => console.log('[SW] 已接管所有客户端'))
  )
})

/**
 * 缓存策略：Cache First
 * 适用于静态资源（JS/CSS/HTML/字体）
 */
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached && !isExpired(cached, maxAge)) {
    return cached
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const clone = networkResponse.clone()
      cache.put(request, clone)
    }
    return networkResponse
  } catch (error) {
    if (cached) {
      console.log('[SW] 网络失败，返回缓存:', request.url)
      return cached
    }
    throw error
  }
}

/**
 * 缓存策略：Network First
 * 适用于 API 数据和导航请求（优先获取最新内容）
 */
async function networkFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)

  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const clone = networkResponse.clone()
      cache.put(request, clone)
    }
    return networkResponse
  } catch (error) {
    const cached = await cache.match(request)
    if (cached && !isExpired(cached, maxAge)) {
      console.log('[SW] 网络失败，返回 API 缓存:', request.url)
      return cached
    }
    throw error
  }
}

/**
 * 缓存策略：Stale While Revalidate
 * 适用于图片：立即返回缓存（如有），同时在后台更新缓存
 */
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => {
      // 静默失败，使用缓存
    })

  if (cached && !isExpired(cached, maxAge)) {
    // 返回缓存，不阻塞请求
    fetchPromise.catch(() => {})
    return cached
  }

  try {
    return await fetchPromise
  } catch (error) {
    if (cached) {
      return cached
    }
    throw error
  }
}

/**
 * 检查缓存是否过期
 */
function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date')
  if (!dateHeader) return false

  const cachedTime = new Date(dateHeader).getTime()
  return Date.now() - cachedTime > maxAge
}

/**
 * 离线同步队列
 * 使用 IndexedDB 存储离线请求，恢复网络后重试
 */
const SYNC_STORE_NAME = 'offline-sync-queue'
const SYNC_DB_NAME = 'wangwen-sync-db'
const SYNC_DB_VERSION = 1

async function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DB_NAME, SYNC_DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        })
      }
    }
  })
}

async function queueForSync(request) {
  try {
    const db = await openSyncDB()
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite')
    const store = tx.objectStore(SYNC_STORE_NAME)

    const payload = {
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()),
      body: await request.clone().text().catch(() => null),
      timestamp: Date.now(),
    }

    await new Promise((resolve, reject) => {
      const req = store.add(payload)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    console.log('[SW] 请求已加入离线同步队列:', request.url)
  } catch (err) {
    console.error('[SW] 加入同步队列失败:', err)
  }
}

/**
 * 处理 fetch 事件，根据请求类型选择不同缓存策略
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 忽略非 GET 请求（除了需要加入同步队列的写请求）
  if (request.method !== 'GET') {
    // 如果是写请求且离线，加入同步队列
    if (!navigator.onLine && shouldQueueForSync(request)) {
      event.respondWith(
        new Response(
          JSON.stringify({
            success: false,
            queued: true,
            message: '当前处于离线状态，请求已加入队列，恢复网络后将自动同步。',
          }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      event.waitUntil(queueForSync(request))
    }
    return
  }

  // 忽略 chrome-extension 等非 HTTP 请求
  if (!url.protocol.startsWith('http')) {
    return
  }

  // 1. 导航请求（HTML 页面）
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, STATIC_CACHE, MAX_AGE_STATIC).catch(() => {
        return caches.match(OFFLINE_PAGE).then((cached) => {
          if (cached) return cached
          // 如果连离线页面都没有，返回一个最基本的 HTML
          return new Response(
            `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>离线 - 织文</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px;color:#666;">
  <h1>📡 网络不可用</h1>
  <p>您当前处于离线状态，请检查网络连接后重试。</p>
  <button onclick="location.reload()" style="padding:10px 20px;font-size:16px;cursor:pointer;">刷新页面</button>
</body></html>`,
            {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          )
        })
      })
    )
    return
  }

  // 2. API 请求（DeepSeek API 等）
  if (isAPIRequest(url)) {
    event.respondWith(
      networkFirst(request, API_CACHE, MAX_AGE_API).catch((error) => {
        console.error('[SW] API 请求失败:', error)
        return new Response(
          JSON.stringify({
            error: '网络不可用',
            message: '当前处于离线状态，无法连接到 AI 服务。请检查网络后重试。',
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              'X-SW-Offline': 'true',
            },
          }
        )
      })
    )
    return
  }

  // 3. 图片资源
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, MAX_AGE_IMAGE))
    return
  }

  // 4. 字体资源
  if (request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE, MAX_AGE_STATIC))
    return
  }

  // 5. 其他静态资源（JS/CSS/WASM 等）
  event.respondWith(cacheFirst(request, STATIC_CACHE, MAX_AGE_STATIC))
})

/**
 * 判断是否为 API 请求
 */
function isAPIRequest(url) {
  return (
    url.hostname === 'api.deepseek.com' ||
    url.hostname.includes('api.') ||
    url.pathname.startsWith('/api/')
  )
}

/**
 * 判断请求是否应该加入离线同步队列
 * 目前主要针对用户的写操作（如果应用未来有后端同步需求）
 */
function shouldQueueForSync(request) {
  // 当前应用主要是本地存储（Dexie IndexedDB），
  // API 请求（AI 聊天）在离线时无法同步，因为需要实时响应
  // 此函数为扩展预留，可针对特定端点开启同步队列
  return false
}

/**
 * Background Sync 事件处理
 * 当网络恢复时，浏览器会触发 sync 事件
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'wangwen-sync') {
    event.waitUntil(processSyncQueue())
  }
})

/**
 * 处理同步队列中的请求
 */
async function processSyncQueue() {
  try {
    const db = await openSyncDB()
    const tx = db.transaction(SYNC_STORE_NAME, 'readonly')
    const store = tx.objectStore(SYNC_STORE_NAME)

    const requests = await new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    if (!requests || requests.length === 0) {
      console.log('[SW] 同步队列为空')
      return
    }

    console.log(`[SW] 开始处理 ${requests.length} 个同步请求`)

    const results = await Promise.allSettled(
      requests.map(async (item) => {
        const headers = new Headers(item.headers)
        const response = await fetch(item.url, {
          method: item.method,
          headers,
          body: item.body,
        })
        return { id: item.id, response }
      })
    )

    // 删除已成功的请求，保留失败的
    const successIds = results
      .filter((r) => r.status === 'fulfilled' && r.value.response.ok)
      .map((r) => r.value.id)

    const deleteTx = db.transaction(SYNC_STORE_NAME, 'readwrite')
    const deleteStore = deleteTx.objectStore(SYNC_STORE_NAME)

    await Promise.all(
      successIds.map((id) => {
        return new Promise((resolve, reject) => {
          const req = deleteStore.delete(id)
          req.onsuccess = () => resolve()
          req.onerror = () => reject(req.error)
        })
      })
    )

    console.log(`[SW] 同步完成：成功 ${successIds.length} / ${requests.length}`)
  } catch (err) {
    console.error('[SW] 处理同步队列失败:', err)
  }
}

/**
 * 消息处理：与主线程通信
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION })
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(names.map((name) => caches.delete(name)))
        )
        .then(() => {
          event.ports[0]?.postMessage({ success: true })
        })
    )
  }
})

console.log('[SW] Service Worker 加载完成', SW_VERSION)
