import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from './env'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL(),
    SUPABASE_ANON_KEY(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies can't be set here
          }
        },
      },
    }
  )
}

export function createServiceClient() {
  return createSupabaseClient(
    SUPABASE_URL(),
    SUPABASE_SERVICE_ROLE_KEY(),
    { auth: { persistSession: false } }
  )
}
