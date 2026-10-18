import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Functional checks stay deterministic and also cover loss of external media.
  // The remote font and video are verified separately in the visual browser pass.
  await page.route('https://**/*', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('the landing page fits desktop, tablet, narrow phone, and landscape viewports', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    // Dynamic viewport units update on the browser's resize/render cycle.
    await expect.poll(() => page.locator('.page-shell').evaluate((element) => element.getBoundingClientRect().height)).toBe(viewport.height)
    const bounds = await page.evaluate(() => {
      const action = document.querySelector('.hero-actions')!.getBoundingClientRect()
      const play = document.querySelector('.hero-play-button')!.getBoundingClientRect()
      const shell = document.querySelector('.page-shell')!.getBoundingClientRect()
      return {
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        action: { left: action.left, right: action.right, bottom: action.bottom },
        play: { width: play.width, height: play.height },
        shellHeight: shell.height,
      }
    })
    expect(bounds.documentWidth, JSON.stringify(viewport)).toBe(viewport.width)
    expect(bounds.documentHeight, JSON.stringify(viewport)).toBe(viewport.height)
    expect(bounds.shellHeight).toBe(viewport.height)
    expect(bounds.action.left).toBeGreaterThanOrEqual(0)
    expect(bounds.action.right).toBeLessThanOrEqual(viewport.width)
    expect(bounds.action.bottom, `CTA must be visible at ${JSON.stringify(viewport)}`).toBeLessThanOrEqual(viewport.height)
    expect(bounds.play.width, 'Play remains circular').toBe(bounds.play.height)
  }
})

test('the primary content and coded dashboard match the requested data', async ({ page }) => {
  await expect(page).toHaveTitle('Nexora — The Future of Smarter Automation')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Future of Smarter Automation')
  await expect(page.locator('h1 em')).toHaveText('Smarter')
  await expect(page.locator('h1 em')).toHaveCSS('font-style', 'italic')
  await expect(page.locator('.hero-badge')).toContainText('Now with GPT-5 support')
  const dashboard = page.getByRole('img', { name: /Nexora dashboard/ })
  for (const text of [
    'Welcome, Jane', '$8,450,190', '.32', '$98,125.50', '$6,750,200.00',
    '$1,592,864.82', 'Trake rutes', 'Recent Transactions', 'AWS', '-$5,200',
    'Client Payment', '+$125,000', 'Payroll', '-$85,450', 'Office Supplies', '-$1,200',
  ]) {
    await expect(dashboard).toContainText(text)
  }
  await expect(dashboard.locator('tbody tr')).toHaveCount(4)
  await expect(dashboard.locator('img, canvas, iframe, button, input, a')).toHaveCount(0)
})

test('Play opens a working tour and Escape restores keyboard focus', async ({ page }) => {
  const play = page.getByRole('button', { name: 'Play product demo' })
  await play.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Start with a simple trigger.' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Next step' }).click()
  await expect(dialog.getByRole('heading', { name: 'Let your agent connect the dots.' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Next step' }).click()
  await expect(dialog.getByRole('heading', { name: 'Stay in control. Keep moving.' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Replay' }).click()
  await expect(dialog.getByRole('heading', { name: 'Start with a simple trigger.' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(play).toBeFocused()
})

test('all desktop navigation and primary actions respond without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const label of ['Pricing', 'About', 'Contact']) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: label, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Close dialog' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  }
  for (const label of ['Book a demo', 'Get started']) {
    await page.getByRole('button', { name: label, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Explore the interactive demo' }).click()
    await expect(page.getByRole('heading', { name: 'From busywork to done.' })).toBeVisible()
    await page.keyboard.press('Escape')
  }
  expect(errors).toEqual([])
})

test('dialogs fit a 320px phone and keep keyboard focus inside', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.getByRole('button', { name: 'Book a demo', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const hasHorizontalOverflow = () => dialog.evaluate((element) => element.scrollWidth > element.clientWidth)
  expect(await hasHorizontalOverflow()).toBe(false)
  await dialog.getByRole('button', { name: 'Explore the interactive demo' }).click()
  await expect(dialog.getByRole('heading', { name: 'From busywork to done.' })).toBeVisible()
  expect(await hasHorizontalOverflow()).toBe(false)
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  }
  const rect = await dialog.boundingBox()
  expect(rect!.x).toBeGreaterThanOrEqual(0)
  expect(rect!.y).toBeGreaterThanOrEqual(0)
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(320)
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(568)
})

test('reduced motion pauses the video and the local fallback is available', async ({ page, request }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.dashboard-position')).toHaveCSS('opacity', '1')
  const video = page.locator('video')
  await expect(video).toHaveAttribute('loop', '')
  await expect(video).toHaveAttribute('playsinline', '')
  await expect(video).toHaveAttribute('poster', '/forest-poster.webp')
  expect(await video.evaluate((element: HTMLVideoElement) => element.paused && element.muted)).toBe(true)
  await expect(video.locator('source')).toHaveAttribute('src', 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4')
  const poster = await request.get('/forest-poster.webp')
  expect(poster.ok()).toBe(true)
  expect(poster.headers()['content-type']).toContain('image/webp')
})
