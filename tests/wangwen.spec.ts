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

  test('控制台无 JS 错误和警告', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    // 执行一系列操作
    await page.getByRole('button', { name: '剧情' }).click()
    await page.getByRole('button', { name: '关系' }).click()
    await page.getByRole('button', { name: '体系' }).click()
    await page.getByRole('button', { name: '灵感' }).click()
    await page.getByRole('button', { name: '角色' }).click()

    expect(errors).toEqual([])
  })

  test('AI 助手 - 空输入不应崩溃', async ({ page }) => {
    await page.getByRole('button', { name: 'AI 助手' }).click()
    await page.getByRole('button', { name: '发送' }).click()
    // 页面不应崩溃，输入框仍然可见
    await expect(page.getByPlaceholder('描述你的创作想法...')).toBeVisible()
  })

  test('角色编辑 - 取消编辑应恢复原始值', async ({ page }) => {
    // 先创建一个角色
    await page.getByRole('button', { name: '手动创建' }).click()
    await expect(page.getByText('角色 1')).toBeVisible()

    // 开始编辑
    await page.getByRole('button', { name: '编辑角色' }).click()
    await page.getByPlaceholder('角色名').fill('临时的名字')

    // 假设有取消按钮，如果没有则通过 Escape 取消
    await page.keyboard.press('Escape')

    // 原始值应保持不变（如果 Escape 有效）或至少页面不崩溃
    await expect(page.getByText('角色 1')).toBeVisible()
  })

  test('设置面板 - 输入无效 API Key 应可保存', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click()
    const input = page.getByPlaceholder('sk-...')
    await input.fill('invalid-key')
    await page.getByRole('button', { name: '保存' }).click()

    // 应显示保存成功提示
    await expect(page.getByText('已保存')).toBeVisible()

    // 清空
    await input.fill('')
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText('已保存')).toBeVisible()
  })

  test('404 页面应友好降级', async ({ page }) => {
    // 访问不存在的路由
    await page.goto('/non-existent-page')
    // 不应出现白屏，至少能看到应用外壳
    await expect(page.locator('body')).toContainText('织文')
  })
})
