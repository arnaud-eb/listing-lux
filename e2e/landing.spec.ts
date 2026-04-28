import { test, expect } from '@playwright/test'

// EN locale lives at /en — FR is the default and renders at /. Existing tests
// asserted English copy, so they navigate to /en here. The i18n locale-switch
// spec below covers the FR default + URL rewrite separately.

test('landing page loads with all sections', async ({ page }) => {
  await page.goto('/en')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: /Generate Property Listings/i }),
  ).toBeVisible()
  await expect(page.getByText('Three Steps to a Perfect Listing')).toBeVisible()
  await expect(page.getByText('€99')).toBeVisible()
})

test('Create Listing CTA navigates to /en/create', async ({ page }) => {
  await page.goto('/en')
  await page.getByRole('link', { name: /create your listing/i }).first().click()
  await expect(page).toHaveURL('/en/create')
})

test('default landing renders French copy', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /Générez des annonces/i }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
})

test('language switcher swaps locale and preserves path', async ({ page }) => {
  await page.goto('/create')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Créer une nouvelle annonce',
  )

  await page.getByRole('button', { name: /change language/i }).first().click()
  await page.getByRole('button', { name: /^english$/i }).click()

  await expect(page).toHaveURL(/\/en\/create$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Create New Listing',
  )
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('pricing section has 3 plans (EN)', async ({ page }) => {
  await page.goto('/en')
  await expect(page.getByText('€99')).toBeVisible()
  await expect(page.getByText('€249')).toBeVisible()
  await expect(page.getByText('Custom')).toBeVisible()
})
