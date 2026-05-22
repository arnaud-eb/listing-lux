function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env.local file.`,
    )
  }
  return value
}

/** Public Supabase URL (available client + server) */
export const SUPABASE_URL = () => requireEnv('NEXT_PUBLIC_SUPABASE_URL')

/** Service role key (server only) */
export const SUPABASE_SERVICE_ROLE_KEY = () => requireEnv('SUPABASE_SERVICE_ROLE_KEY')

/** OpenAI API key (server only) */
export const OPENAI_API_KEY = () => requireEnv('OPENAI_API_KEY')
