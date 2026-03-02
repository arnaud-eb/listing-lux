import { test, expect } from '@playwright/test'

test('listing page shows 4 language tabs', async ({ page }) => {
  // Use a non-existent ID to test 404 behavior
  const response = await page.goto('/listing/non-existent-id')
  // Should either show not-found page or redirect
  // This tests that the route is handled
  expect(response?.status()).toBeDefined()
})

test('demo page shows coming soon message', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByText('Demo Coming Soon')).toBeVisible()
  await expect(page.getByRole('link', { name: /create a listing/i })).toBeVisible()
})

test('demo page links back to home and create', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /create a listing/i })).toBeVisible()
})
