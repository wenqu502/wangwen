import { test, expect } from '@playwright/test'

test.describe('织文 WangWen - 核心流程 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // 等待 IndexedDB 数据加载完成
    await page.waitForSelector('text=角色小像', { timeout: 10000 })
  })

  test('首页加载 - 显示五个 Tab 和顶部按钮', async ({ page }) => {
    const tabs = ['角色', '剧情', '关系', '体系', '灵感']
    for (const tab of tabs) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'AI 助手' })).toBeVisible()
    await expect(page.getByRole('button', { name: '搜索' })).toBeVisible()
    await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
    await expect(page.getByRole('button', { name: '设置' })).toBeVisible()
  })

  test('Tab 切换 - 五个模块都能正常渲染', async ({ page }) => {
    const tabMap = [
      { name: '剧情', heading: '剧情分支' },
      { name: '关系', heading: '关系网' },
      { name: '体系', heading: '世界观体系' },
      { name: '灵感', heading: '灵感池' },
    ]

    for (const { name, heading } of tabMap) {
      await page.getByRole('button', { name }).click()
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }

    // 切回角色
    await page.getByRole('button', { name: '角色' }).click()
    await expect(page.getByRole('heading', { name: '角色小像' })).toBeVisible()
  })

  test('角色模块 - 手动创建、编辑、删除角色', async ({ page }) => {
    // 创建角色
    await page.getByRole('button', { name: '手动创建' }).click()
    await expect(page.getByText('角色 1')).toBeVisible()

    // 编辑角色
    await page.getByRole('button', { name: '编辑角色' }).click()
    await page.getByPlaceholder('角色名').fill('测试角色')
    await page.getByRole('button', { name: '确认编辑' }).click()
    await expect(page.getByText('测试角色')).toBeVisible()

    // 删除角色
    await page.getByRole('button', { name: '删除角色' }).click()
    await expect(page.getByText('测试角色')).not.toBeVisible()
  })

  test('AI 助手面板 - 打开关闭和发送消息', async ({ page }) => {
    // 打开面板
    await page.getByRole('button', { name: 'AI 助手' }).click()
    await expect(page.getByPlaceholder('描述你的创作想法...')).toBeVisible()

    // 发送消息
    await page.getByPlaceholder('描述你的创作想法...').fill('你好')
    await page.getByRole('button', { name: '发送' }).click()
    await expect(page.getByText('你好')).toBeVisible()

    // 关闭面板
    await page.getByRole('button', { name: 'AI 助手' }).click()
    await expect(page.getByPlaceholder('描述你的创作想法...')).not.toBeVisible()
  })

  test('搜索功能 - 全局搜索弹窗', async ({ page }) => {
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(page.getByPlaceholder('搜索角色、剧情、关系、体系、灵感...')).toBeVisible()

    await page.getByPlaceholder('搜索角色、剧情、关系、体系、灵感...').fill('不存在的关键词')
    await expect(page.getByText('未找到匹配结果')).toBeVisible()

    // 关闭搜索
    await page.getByRole('button', { name: '关闭搜索' }).click()
    await expect(page.getByPlaceholder('搜索角色、剧情、关系、体系、灵感...')).not.toBeVisible()
  })

  test('设置弹窗 - 打开关闭', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click()
    await expect(page.getByRole('heading', { name: 'API Key' })).toBeVisible()

    await page.getByRole('button', { name: '关闭设置' }).click()
    await expect(page.getByRole('heading', { name: 'API Key' })).not.toBeVisible()
  })

  test('导出功能 - 触发下载', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '导出' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^织文_.*\.json$/)
  })
})
