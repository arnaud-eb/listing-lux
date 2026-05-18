import { revalidateTag } from 'next/cache'

export const LOCALITIES_CACHE_TAG = 'localities'

export function revalidateLocalitiesCache() {
  revalidateTag(LOCALITIES_CACHE_TAG, { expire: 0 })
}
