import { expect, test } from '@playwright/test'

test.describe('Shop', () => {
  test('home page loads with the EastWest title', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/EastWest Fashions/)
  })

  test('shop lists products and a product page shows the live preview', async ({ page }) => {
    await page.goto('http://localhost:3000/shop?section=jerseys')
    const first = page.locator('article a[href^="/products/"]').first()
    await expect(first).toBeVisible()
    await first.click()
    await expect(page).toHaveURL(/\/products\//)
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible()
  })
})
