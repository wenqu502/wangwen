---
name: qa-playwright-testing
description: Playwright E2E 自动化测试实战指南，覆盖项目配置、用例编写、选择器策略、CI 集成与调试技巧
type: reference
---

# Playwright E2E 测试实战指南

## 项目配置

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

## 核心命令

```bash
# 运行所有测试
pnpm exec playwright test

#  headed 模式调试（有浏览器窗口）
pnpm exec playwright test --headed

# 单文件调试
pnpm exec playwright test tests/wangwen.spec.ts --headed

# 生成并打开 HTML 报告
pnpm exec playwright show-report

# 录制新测试
pnpm exec playwright codegen http://localhost:5173

# 安装浏览器（首次使用）
pnpm exec playwright install
```

## 选择器策略（优先级）

| 优先级 | 策略 | 示例 | 说明 |
|--------|------|------|------|
| 1 | Role + Name | `getByRole('button', { name: '提交' })` | 最稳定，对应 aria-label/可见文本 |
| 2 | Placeholder | `getByPlaceholder('搜索...')` | 输入框专用 |
| 3 | Text | `getByText('角色小像')` | 页面唯一文案 |
| 4 | Test ID | `getByTestId('character-card')` | 纯逻辑节点，无文本时 |
| 5 | CSS/Locator | `locator('[data-tab="plot"]')` | 最后手段 |

**禁止**：`getByClass('.btn-primary')`、`$('div > span')` 等脆弱选择器。

## 常用模式

### 等待数据加载
```ts
// IndexedDB 加载需要时间
await page.waitForSelector('text=角色小像', { timeout: 10000 })
```

### 下载断言
```ts
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: '导出' }).click(),
])
expect(download.suggestedFilename()).toMatch(/^织文_.*\.json$/)
```

### Dialog 处理
```ts
page.once('dialog', dialog => dialog.accept())
await page.getByRole('button', { name: '删除' }).click()
```

### 弹窗显隐断言
```ts
await page.getByRole('button', { name: '设置' }).click()
await expect(page.getByRole('heading', { name: 'API Key' })).toBeVisible()

await page.getByRole('button', { name: '关闭设置' }).click()
await expect(page.getByRole('heading', { name: 'API Key' })).not.toBeVisible()
```

## 无障碍要求（测试前提）

所有可交互元素必须有可访问名称：
- 图标按钮：`aria-label="手动创建"`
- 输入框：`placeholder="描述你的创作想法..."`
- 弹窗关闭：`aria-label="关闭设置"`

## 测试用例模板

```ts
import { test, expect } from '@playwright/test'

test.describe('模块名', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=角色小像', { timeout: 10000 })
  })

  test('用例描述', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  })
})
```

## 调试技巧

1. **Trace Viewer**：`trace: 'on-first-retry'` 失败后自动录制，用 `pnpm exec playwright show-report` 查看每一步的 DOM 快照。
2. **Codegen**：`pnpm exec playwright codegen` 手动操作生成测试代码，适合复杂交互。
3. **慢动作**：`use: { launchOptions: { slowMo: 500 } }` 放慢执行速度观察问题。
4. **截图对比**：`await expect(page).toHaveScreenshot('homepage.png')` 视觉回归。
