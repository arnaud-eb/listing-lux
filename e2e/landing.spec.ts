import { test, expect } from '@playwright/test'

test('landing page loads with all sections', async ({ page }) => {
  await page.goto('/')

  // Hero section
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('Elevate Your Listings')).toBeVisible()

  // Efficiency section
  await expect(page.getByText('5 Minutes')).toBeVisible()

  // How it works section
  await expect(page.getByText('Three Steps to a Perfect Listing')).toBeVisible()

  // Pricing section
  await expect(page.getByText('€199')).toBeVisible()
})

test('Try Demo CTA navigates to /demo', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /try demo/i }).click()
  await expect(page).toHaveURL('/demo')
})

test('Create Listing CTA navigates to /create', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create listing/i }).first().click()
  await expect(page).toHaveURL('/create')
})

test('language badges are visible in hero', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('DE')).toBeVisible()
  await expect(page.getByText('FR')).toBeVisible()
  await expect(page.getByText('EN')).toBeVisible()
  await expect(page.getByText('LU')).toBeVisible()
})

test('pricing section has 3 plans', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('€49')).toBeVisible()
  await expect(page.getByText('€199')).toBeVisible()
  await expect(page.getByText('€499')).toBeVisible()
})
