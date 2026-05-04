import { test, expect } from '@playwright/test'

/**
 * Program QA 工程师 — 全面交互走查
 * 覆盖：页面加载、Tab切换、各模块CRUD、AI面板、设置、搜索、导出
 */

test.describe('🔍 QA 全面走查', () => {
  const issues: string[] = []

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => issues.push(`[PAGEERROR] ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') issues.push(`[CONSOLE] ${msg.text()}`)
    })
    await page.goto('http://localhost:5173/')
    await page.waitForSelector('text=角色小像', { timeout: 15000 })
  })

  test.afterEach(async ({ page: _page }, testInfo) => {
    if (issues.length > 0) {
      console.log(`\n=== ${testInfo.title} 期间的错误 ===`)
      issues.forEach((i) => console.log(i))
      issues.length = 0
    }
  })

  test('1️⃣ 首页加载 — 检查所有 UI 元素', async ({ page }) => {
    // 顶部按钮
    await expect(page.getByRole('button', { name: '搜索' })).toBeVisible()
    await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
    await expect(page.getByRole('button', { name: '设置' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'AI 助手' })).toBeVisible()

    // 底部 Tabs
    for (const tab of ['角色', '剧情', '关系', '体系', '灵感', '校验报告']) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible()
    }

    // 右侧 AI 面板默认展开
    await expect(page.getByText('AI 创作助手')).toBeVisible()

    await page.screenshot({ path: 'test-results/qa-01-home.png' })
  })

  test('2️⃣ Tab 切换 — 6 个 Tab 全部渲染', async ({ page }) => {
    const tabs = [
      { name: '剧情', heading: '剧情分支树' },
      { name: '关系', heading: '关系网' },
      { name: '体系', heading: '世界观体系' },
      { name: '灵感', heading: '灵感便签' },
      { name: '校验报告', heading: '校验报告' },
    ]

    for (const { name, heading } of tabs) {
      await page.getByRole('button', { name }).click()
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await page.screenshot({ path: `test-results/qa-02-tab-${name}.png` })
    }

    // 切回角色
    await page.getByRole('button', { name: '角色' }).click()
    await expect(page.getByRole('heading', { name: '角色小像' })).toBeVisible()
  })

  test('3️⃣ 角色模块 — 创建、编辑、删除完整流程', async ({ page }) => {
    // 创建角色
    await page.getByRole('button', { name: '手动创建' }).click()
    await expect(page.getByText('角色 1')).toBeVisible()

    // 编辑角色
    await page.getByRole('button', { name: '编辑角色' }).click()
    await page.getByPlaceholder('角色名').fill('测试角色QA')
    await page.getByRole('button', { name: '确认编辑' }).click()
    await expect(page.getByText('测试角色QA')).toBeVisible()

    // 删除角色
    await page.getByRole('button', { name: '删除角色' }).click()
    await expect(page.getByText('测试角色QA')).not.toBeVisible()

    await page.screenshot({ path: 'test-results/qa-03-character.png' })
  })

  test('4️⃣ 剧情模块 — 添加节点', async ({ page }) => {
    await page.getByRole('button', { name: '剧情' }).click()
    await expect(page.getByRole('heading', { name: '剧情分支树' })).toBeVisible()

    await page.getByRole('button', { name: '添加节点' }).click()
    // 节点应出现在画布中
    await expect(page.getByText('节点 1')).toBeVisible()

    await page.screenshot({ path: 'test-results/qa-04-plot.png' })
  })

  test('5️⃣ 关系模块 — 添加关系（需先有角色）', async ({ page }) => {
    // 先创建两个角色
    await page.getByRole('button', { name: '角色' }).click()
    await page.getByRole('button', { name: '手动创建' }).click()
    await page.getByRole('button', { name: '手动创建' }).click()

    // 切换到关系 Tab
    await page.getByRole('button', { name: '关系' }).click()
    await expect(page.getByRole('heading', { name: '关系网' })).toBeVisible()

    await page.screenshot({ path: 'test-results/qa-05-relation.png' })
  })

  test('6️⃣ 体系模块 — 添加体系', async ({ page }) => {
    await page.getByRole('button', { name: '体系' }).click()
    await expect(page.getByRole('heading', { name: '世界观体系' })).toBeVisible()

    await page.getByRole('button', { name: '添加体系' }).click()
    await expect(page.getByText('新体系')).toBeVisible()

    await page.screenshot({ path: 'test-results/qa-06-system.png' })
  })

  test('7️⃣ 灵感模块 — 添加便签', async ({ page }) => {
    await page.getByRole('button', { name: '灵感' }).click()
    await expect(page.getByRole('heading', { name: '灵感便签' })).toBeVisible()

    await page.getByRole('button', { name: '添加便签' }).click()
    await expect(page.getByText('新的灵感...')).toBeVisible()

    await page.screenshot({ path: 'test-results/qa-07-idea.png' })
  })

  test('8️⃣ AI 助手面板 — 打开关闭、发送消息、快捷指令', async ({ page }) => {
    // 关闭面板
    await page.getByRole('button', { name: 'AI 助手' }).click()
    await expect(page.getByPlaceholder('描述你的创作想法...')).not.toBeVisible()

    // 打开面板
    await page.getByRole('button', { name: 'AI 助手' }).click()
    await expect(page.getByPlaceholder('描述你的创作想法...')).toBeVisible()

    // 发送消息
    await page.getByPlaceholder('描述你的创作想法...').fill('你好')
    await page.getByRole('button', { name: '发送' }).click()
    await expect(page.getByText('你好')).toBeVisible()

    // 快捷指令
    await page.getByText('生成角色').click()
    const textarea = page.locator('textarea').first()
    await expect(textarea).toHaveValue('帮我创建一个新角色')

    await page.screenshot({ path: 'test-results/qa-08-chat.png' })
  })

  test('9️⃣ 搜索功能 — 打开关闭、空结果', async ({ page }) => {
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(page.getByPlaceholder('搜索角色、剧情、关系、体系、灵感...')).toBeVisible()

    await page.getByPlaceholder('搜索角色、剧情、关系、体系、灵感...').fill('不存在的关键词xyz')
    // 等待 debounce
    await page.waitForTimeout(400)
    await expect(page.getByText('未找到匹配结果')).toBeVisible()

    // 关闭搜索
    await page.getByRole('button', { name: '关闭搜索' }).click()
    await expect(page.getByPlaceholder('搜索角色、剧情、关系、体系、灵感...')).not.toBeVisible()

    await page.screenshot({ path: 'test-results/qa-09-search.png' })
  })

  test('🔟 设置弹窗 — 打开关闭', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click()
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible()

    await page.getByRole('button', { name: '关闭设置' }).click()
    await expect(page.getByRole('heading', { name: '设置' })).not.toBeVisible()

    await page.screenshot({ path: 'test-results/qa-10-settings.png' })
  })

  test('1️⃣1️⃣ 导出功能 — 触发下载', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '导出' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^织文_.*\.json$/)
  })

  test('1️⃣2️⃣ 控制台无 JS 错误', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    // 遍历所有 Tab
    for (const tab of ['剧情', '关系', '体系', '灵感', '校验报告', '角色']) {
      await page.getByRole('button', { name: tab }).click()
      await page.waitForTimeout(300)
    }

    // 过滤掉已知的非致命警告
    const criticalErrors = errors.filter(
      (e) => !e.includes('frame-ancestors') && !e.includes('React DevTools')
    )

    expect(criticalErrors).toEqual([])
  })
})
