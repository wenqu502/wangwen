---
name: qa-frontend-testing
description: 前端项目测试方法论与工具链配置指南，覆盖 Vitest/RTL/Playwright/MSW
type: reference
---

# 前端测试实战指南

## 技术栈选型（2026）

| 层级 | 工具 | 安装命令 |
|------|------|----------|
| 运行器 | Vitest | `pnpm add -D vitest @vitest/coverage-v8` |
| 组件测试 | React Testing Library + userEvent | `pnpm add -D @testing-library/react @testing-library/user-event` |
| DOM 断言 | jest-dom | `pnpm add -D @testing-library/jest-dom` |
| API 模拟 | MSW | `pnpm add -D msw` |
| E2E | Playwright | `pnpm create playwright` |

## 测试分层金字塔

```
      /\
     /  \  E2E (Playwright) — 用户完整流程
    /____\
   /      \  Integration (RTL + MSW) — 组件+API
  /________\
 /          \  Unit (Vitest) — 纯函数、工具类
/____________\
```

## 关键原则

1. **测试行为，不测试实现** — 用 `getByRole('button', { name: '提交' })` 而不是 `getByClass('.btn-primary')`
2. **userEvent > fireEvent** — 模拟真实用户交互（hover、type、click 都带延迟）
3. **MSW 拦截网络层** — 代码不知道自己在被测试
4. **80% 覆盖率 > 100% 无意义覆盖**

## 常用模式

```ts
// Vitest + RTL 组件测试示例
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

describe('CharacterCanvas', () => {
  it('创建角色后显示在列表中', async () => {
    render(<CharacterCanvas />)
    await userEvent.click(screen.getByRole('button', { name: /手动创建/i }))
    expect(screen.getByText('角色 1')).toBeInTheDocument()
  })
})
```

## E2E 用例模板（Playwright）

```ts
import { test, expect } from '@playwright/test'

test('完整创建角色流程', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.getByPlaceholder('描述你的创作想法...').fill('帮我创建一个剑修男主')
  await page.getByRole('button', { name: /发送/i }).click()
  await expect(page.getByText('林云')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.character-card')).toHaveCount(1)
})
```
