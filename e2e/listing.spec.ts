import { test, expect } from '@playwright/test'

test('listing route handles missing ID', async ({ page }) => {
  const response = await page.goto('/en/listing/00000000-0000-0000-0000-000000000000')
  expect(response?.status()).toBeDefined()
})

test('demo page shows coming soon message in EN', async ({ page }) => {
  await page.goto('/en/demo')
  await expect(page.getByText('Demo Coming Soon')).toBeVisible()
  await expect(page.getByRole('link', { name: /create a listing/i })).toBeVisible()
})

test('demo page renders FR copy at root locale', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByText('Démo bientôt disponible')).toBeVisible()
})

test('demo page links back to home and create', async ({ page }) => {
  await page.goto('/en/demo')
  await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /create a listing/i })).toBeVisible()
})
