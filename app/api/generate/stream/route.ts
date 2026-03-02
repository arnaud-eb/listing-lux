// Phase 3 stub — AI streaming endpoint
// This will use Vercel AI SDK streamText() to generate listing content

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'AI generation not yet implemented (Phase 3)' },
    { status: 501 }
  )
}
