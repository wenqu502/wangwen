import { test, expect } from '@playwright/test'

test('冒烟测试 — 完整用户旅程', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('http://localhost:5173/')
  await page.waitForSelector('text=角色小像', { timeout: 15000 })

  // 1. 创建角色
  await page.getByRole('button', { name: '手动创建' }).click()
  await expect(page.getByRole('heading', { name: '角色 1' })).toBeVisible()

  // 2. 编辑角色
  await page.getByRole('button', { name: '编辑角色' }).click()
  await page.getByPlaceholder('角色名').fill('冒烟角色')
  await page.getByRole('button', { name: '确认编辑' }).click()
  await expect(page.getByRole('heading', { name: '冒烟角色' })).toBeVisible()

  // 3. 创建剧情节点
  await page.getByRole('button', { name: '剧情', exact: true }).click()
  await page.getByRole('button', { name: '添加节点' }).click()
  await expect(page.getByText('节点 1')).toBeVisible()

  // 4. 创建体系
  await page.getByRole('button', { name: '体系', exact: true }).click()
  await page.getByRole('button', { name: '添加体系' }).click()
  await expect(page.getByText('新体系')).toBeVisible()

  // 5. 创建灵感
  await page.getByRole('button', { name: '灵感', exact: true }).click()
  await page.getByRole('button', { name: '添加便签' }).click()
  await expect(page.getByText('新的灵感...')).toBeVisible()

  // 6. AI 聊天
  await page.getByPlaceholder('描述你的创作想法...').fill('冒烟测试')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.getByText('冒烟测试')).toBeVisible()

  // 7. 搜索
  await page.getByRole('button', { name: '搜索' }).click()
  await page.getByPlaceholder('搜索角色、剧情、关系、体系、灵感...').fill('冒烟角色')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: '关闭搜索' }).click()

  // 断言无致命错误
  const criticalErrors = errors.filter(
    (e) => !e.includes('frame-ancestors') && !e.includes('React DevTools')
  )
  expect(criticalErrors).toEqual([])

  await page.screenshot({ path: 'test-results/qa-smoke-final.png' })
})
