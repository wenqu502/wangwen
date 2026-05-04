import { test, expect } from '@playwright/test'

/**
 * P2-002: Service Worker 缓存策略验收测试
 */
test.describe('Service Worker', () => {
  test('Service Worker 应成功注册', async ({ page }) => {
    // 监听 console 日志中的 SW 注册信息
    const swLogs: string[] = []
    page.on('console', (msg) => {
      if (msg.text().includes('[SW]')) {
        swLogs.push(msg.text())
      }
    })

    await page.goto('/')

    // 等待 Service Worker 注册完成
    await page.waitForTimeout(2000)

    // 验证 Service Worker 是否已注册
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registration = await navigator.serviceWorker.ready
      return !!registration.active
    })

    expect(swRegistered).toBe(true)
    console.log('SW logs:', swLogs)
  })

  test('离线时导航请求应回退到缓存', async ({ page, context }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // 模拟离线状态
    await context.setOffline(true)

    // 刷新页面，验证能正常加载（从缓存）
    await page.reload()

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 验证页面内容仍然可访问
    const root = page.locator('#root')
    await expect(root).toBeVisible()

    // 恢复网络
    await context.setOffline(false)
  })

  test('离线页面应可访问', async ({ page, context }) => {
    // 模拟离线状态
    await context.setOffline(true)

    // 直接访问离线页面
    await page.goto('/offline.html')

    const title = page.locator('h1')
    await expect(title).toContainText('离线')

    // 恢复网络
    await context.setOffline(false)
  })
})
