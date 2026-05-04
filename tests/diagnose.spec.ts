import { test, expect } from '@playwright/test'

test(' diagnose page load issue', async ({ page }) => {
  const errors: string[] = []
  const consoleLogs: string[] = []

  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`
    consoleLogs.push(text)
    console.log(text)
  })

  await page.goto('http://localhost:5173/')

  // Wait up to 30 seconds for the app to render
  await page.waitForTimeout(5000)

  const html = await page.content()
  const title = await page.title()
  const bodyText = await page.locator('body').innerText()

  console.log('=== Page Title ===')
  console.log(title)

  console.log('=== Body Text (first 500 chars) ===')
  console.log(bodyText.slice(0, 500))

  console.log('=== Errors ===')
  errors.forEach((e) => console.log(e))

  console.log('=== Console Logs ===')
  consoleLogs.forEach((l) => console.log(l))

  // Take screenshot for visual inspection
  await page.screenshot({ path: 'test-results/diagnose.png', fullPage: true })

  // Check if React app rendered
  const hasContent = bodyText.includes('角色') || bodyText.includes('织文')
  console.log('Has content:', hasContent)

  expect(hasContent).toBe(true)
})
