import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase.server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('localities').select('id').limit(1)
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
