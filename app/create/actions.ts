'use server'

import { createServiceClient } from '@/lib/supabase.server'
import type { PropertyFormData } from '@/lib/types'

export async function getSignedUploadUrl(
  filename: string,
  contentType: string,
  propertyId: string
): Promise<{ signedUrl: string; path: string }> {
  const supabase = createServiceClient()
  const path = `${propertyId}/${Date.now()}-${filename}`

  const { data, error } = await supabase.storage
    .from('property-photos')
    .createSignedUploadUrl(path)

  if (error || !data) {
    throw new Error(`Failed to get signed upload URL: ${error?.message}`)
  }

  return { signedUrl: data.signedUrl, path }
}

export async function confirmUpload(
  path: string,
  propertyId: string
): Promise<{ publicUrl: string }> {
  const supabase = createServiceClient()

  const { data } = supabase.storage
    .from('property-photos')
    .getPublicUrl(path)

  // Update property photo_urls if property exists
  if (propertyId && propertyId !== 'pending') {
    await supabase
      .from('properties')
      .update({
        photo_urls: supabase.rpc('array_append_unique', {
          arr: 'photo_urls',
          val: data.publicUrl,
        }),
      })
      .eq('id', propertyId)
  }

  return { publicUrl: data.publicUrl }
}

export async function saveProperty(
  formData: PropertyFormData
): Promise<{ id: string }> {
  // Basic validation
  if (formData.bedrooms < 0) {
    throw new Error('Bedrooms must be a positive number')
  }
  if (formData.sqm <= 0) {
    throw new Error('Size must be greater than 0')
  }
  if (formData.price <= 0) {
    throw new Error('Price must be greater than 0')
  }
  if (!formData.neighborhood) {
    throw new Error('Neighborhood is required')
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('properties')
    .insert({
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      sqm: formData.sqm,
      price: formData.price,
      neighborhood: formData.neighborhood,
      property_type: formData.property_type || 'apartment',
      features: formData.features,
      photo_urls: formData.photo_urls,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to save property: ${error?.message}`)
  }

  return { id: data.id }
}
