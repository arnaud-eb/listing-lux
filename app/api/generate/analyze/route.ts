// Phase 2 stub — Vision analysis endpoint
// This will use GPT-4.1-mini vision to analyze property photos

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Photo analysis not yet implemented (Phase 2)' },
    { status: 501 }
  )
}
