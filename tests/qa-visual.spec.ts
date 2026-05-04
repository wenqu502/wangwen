import { test, expect } from '@playwright/test'

test('视觉 QA 截图 — 关键页面状态', async ({ page }) => {
  await page.goto('http://localhost:5173/')
  await page.waitForSelector('text=角色小像', { timeout: 15000 })

  // 首页
  await page.screenshot({ path: 'test-results/qa-visual-01-home.png' })

  // 角色 Tab — 创建角色后
  await page.getByRole('button', { name: '手动创建' }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/qa-visual-02-character.png' })

  // 剧情 Tab
  await page.getByRole('button', { name: '剧情', exact: true }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/qa-visual-03-plot.png' })

  // 关系 Tab
  await page.getByRole('button', { name: '关系', exact: true }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/qa-visual-04-relation.png' })

  // 体系 Tab
  await page.getByRole('button', { name: '体系', exact: true }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/qa-visual-05-system.png' })

  // 灵感 Tab
  await page.getByRole('button', { name: '灵感', exact: true }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/qa-visual-06-idea.png' })

  // 校验报告 Tab
  await page.getByRole('button', { name: '校验报告', exact: true }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/qa-visual-07-report.png' })

  // 设置弹窗
  await page.getByRole('button', { name: '设置' }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/qa-visual-08-settings.png' })
  await page.getByRole('button', { name: '关闭设置' }).click()

  // 搜索弹窗
  await page.getByRole('button', { name: '搜索' }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/qa-visual-09-search.png' })
  await page.getByRole('button', { name: '关闭搜索' }).click()

  // AI 聊天面板（发送消息）
  await page.getByPlaceholder('描述你的创作想法...').fill('测试消息')
  await page.getByRole('button', { name: '发送' }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/qa-visual-10-chat.png' })

  expect(true).toBe(true)
})
