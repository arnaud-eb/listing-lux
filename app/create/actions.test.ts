import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/headers before importing actions
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}))

// Mock supabase service client
vi.mock('@/lib/supabase.server', () => ({
  createServiceClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed', path: 'test/photo.jpg' },
          error: null,
        }),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/public/test/photo.jpg' },
        })),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-uuid-1234' },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
    rpc: vi.fn(),
  })),
}))

import { getSignedUploadUrl, saveProperty } from './actions'

describe('getSignedUploadUrl', () => {
  it('returns signed url and a path', async () => {
    const result = await getSignedUploadUrl('photo.jpg', 'image/jpeg', 'prop-123')
    expect(result.signedUrl).toBe('https://example.com/signed')
    // Path includes the propertyId prefix and original filename
    expect(result.path).toContain('prop-123')
    expect(result.path).toContain('photo.jpg')
  })
})

describe('saveProperty', () => {
  it('returns an id on valid data', async () => {
    const result = await saveProperty({
      bedrooms: 3,
      bathrooms: 2,
      sqm: 150,
      price: 1_200_000,
      neighborhood: 'belair',
      property_type: 'apartment',
      features: { balcony: true, parking: false },
      photo_urls: ['https://example.com/photo1.jpg'],
    })
    expect(result.id).toBeDefined()
    expect(typeof result.id).toBe('string')
  })

  it('throws on negative bedrooms', async () => {
    await expect(
      saveProperty({
        bedrooms: -1,
        bathrooms: 1,
        sqm: 100,
        price: 500_000,
        neighborhood: 'belair',
        property_type: 'apartment',
        features: {},
        photo_urls: [],
      })
    ).rejects.toThrow()
  })

  it('throws when sqm is 0', async () => {
    await expect(
      saveProperty({
        bedrooms: 2,
        bathrooms: 1,
        sqm: 0,
        price: 500_000,
        neighborhood: 'belair',
        property_type: 'apartment',
        features: {},
        photo_urls: [],
      })
    ).rejects.toThrow('Size must be greater than 0')
  })

  it('throws when price is 0', async () => {
    await expect(
      saveProperty({
        bedrooms: 2,
        bathrooms: 1,
        sqm: 100,
        price: 0,
        neighborhood: 'belair',
        property_type: 'apartment',
        features: {},
        photo_urls: [],
      })
    ).rejects.toThrow('Price must be greater than 0')
  })

  it('throws when neighborhood is empty', async () => {
    await expect(
      saveProperty({
        bedrooms: 2,
        bathrooms: 1,
        sqm: 100,
        price: 500_000,
        neighborhood: '',
        property_type: 'apartment',
        features: {},
        photo_urls: [],
      })
    ).rejects.toThrow('Neighborhood is required')
  })
})
