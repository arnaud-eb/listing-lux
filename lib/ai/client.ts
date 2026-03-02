import { createOpenAI } from '@ai-sdk/openai'

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Phase 2: analyzePhotos(imageUrls: string[]) → PhotoAnalysis
// Phase 3: generateListing(property, analysis, language) → Listing
// Model: 'gpt-4.1-mini' for both (vision + text, cost-efficient)
