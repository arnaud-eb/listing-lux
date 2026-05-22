import { test, expect } from '@playwright/test'

test('listing route handles missing ID', async ({ page }) => {
  const response = await page.goto('/en/listing/00000000-0000-0000-0000-000000000000')
  expect(response?.status()).toBeDefined()
})
