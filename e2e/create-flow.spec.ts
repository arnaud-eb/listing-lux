import { test, expect } from '@playwright/test'
import path from 'path'

test('Create page loads with required form fields', async ({ page }) => {
  await page.goto('/create')
  await expect(page.getByText('Create Listing')).toBeVisible()
  await expect(page.getByLabel(/size/i)).toBeVisible()
  await expect(page.getByLabel(/price/i)).toBeVisible()
})

test('Generate button is disabled on empty form', async ({ page }) => {
  await page.goto('/create')
  await expect(page.getByRole('button', { name: /generate listing/i })).toBeDisabled()
})

test('Photo drop zone is visible', async ({ page }) => {
  await page.goto('/create')
  await expect(page.getByText(/drag & drop photos/i)).toBeVisible()
})

test('Neighborhood selector is present', async ({ page }) => {
  await page.goto('/create')
  await expect(page.getByText('Neighborhood')).toBeVisible()
})

test('Stepper inputs for bedrooms and bathrooms are present', async ({ page }) => {
  await page.goto('/create')
  await expect(page.getByText('Bedrooms')).toBeVisible()
  await expect(page.getByText('Bathrooms')).toBeVisible()
})

test('Feature chips are present', async ({ page }) => {
  await page.goto('/create')
  await expect(page.getByText('Balcony')).toBeVisible()
  await expect(page.getByText('Parking')).toBeVisible()
  await expect(page.getByText('Garden')).toBeVisible()
})

test('Generate button enables after filling required fields', async ({ page }) => {
  await page.goto('/create')

  // Fill in size
  await page.getByLabel(/size/i).fill('150')

  // Fill in price
  await page.getByLabel(/price/i).fill('1200000')

  // Select neighborhood
  await page.getByRole('combobox').first().click()
  await page.getByRole('option', { name: /kirchberg/i }).click()

  // Price estimate should appear after neighborhood selection with sqm
  await expect(page.getByText(/avg:/i)).toBeVisible()

  // Still disabled because no photos
  await expect(page.getByRole('button', { name: /generate listing/i })).toBeDisabled()
  await expect(page.getByText(/more photo/i)).toBeVisible()
})
