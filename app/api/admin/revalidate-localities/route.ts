import { NextResponse, type NextRequest } from 'next/server'
import { revalidateLocalitiesCache } from '@/lib/localities/cache'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.LOCALITIES_REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'LOCALITIES_REVALIDATE_SECRET not configured' }, { status: 500 })
  }
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  revalidateLocalitiesCache()
  return NextResponse.json({ revalidated: true })
}
