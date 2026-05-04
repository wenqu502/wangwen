---
name: qa-computer-use-testing
description: 使用 AI 浏览器自动化工具进行探索性用户视角测试的方法论
type: reference
---

# Computer Use / AI 浏览器自动化测试指南

## 什么是 Computer Use 测试

让 AI agent 像真实用户一样操作浏览器，发现人工难以覆盖的边界问题：
- 死按钮、空白状态、404 链接
- 随机点击序列导致的崩溃
- 不同分辨率下的布局错乱

## 工具对比

| 工具 | 类型 | 学习成本 | 适用场景 |
|------|------|----------|----------|
| **Playwright** | 确定性脚本 | 低 | 回归测试、核心流程验证 |
| **Browser-Use** | AI agent | 中 | 探索性测试、复杂多步任务 |
| **Stagehand** | 混合模式 | 中 | 页面频繁变化的项目 |
| **Agent Browser** | CLI 工具 | 低 | AI coding 助手集成 |

## 推荐工作流

### 阶段1：确定性 E2E（Playwright）
覆盖核心用户旅程：
```
打开应用 → 创建角色 → 查看详情 → 切换剧情 Tab → 创建节点 → 刷新验证持久化
```

### 阶段2：探索性测试（Browser-Use）
让 AI 自由探索，发现意外问题：
```python
from browser_use import Agent, Browser

agent = Agent(
    task="测试这个网文创作工具的所有按钮，找出点击后没有任何反应的死按钮，并报告",
    llm=ChatOpenAI(model="gpt-4o"),
    browser=Browser(),
)
await agent.run()
```

### 阶段3：视觉回归（Playwright + 截图对比）
```ts
test('角色卡片视觉回归', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '创建角色' }).click()
  await expect(page).toHaveScreenshot('character-card.png')
})
```

## 快速开始命令

```bash
# Playwright
pnpm create playwright
npx playwright test --ui

# Browser-Use
pip install browser-use
python -m browser_use open http://localhost:5173
```

## 测试检查清单

- [ ] 所有按钮点击后有预期反馈（loading / 弹窗 / 数据更新）
- [ ] 空状态正确展示（无角色/无节点/无灵感时的占位文案）
- [ ] 表单提交验证生效（必填项、格式校验）
- [ ] 刷新页面后数据不丢失
- [ ] Tab 切换流畅，无白屏
- [ ] 控制台无 JS Error / 无 404 资源
