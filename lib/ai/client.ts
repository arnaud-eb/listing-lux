import { createOpenAI } from '@ai-sdk/openai'
import { OPENAI_API_KEY } from '@/lib/env'

export const LISTING_MODEL = 'gpt-4.1-mini'

export const openai = createOpenAI({
  apiKey: OPENAI_API_KEY(),
})
