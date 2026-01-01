import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const validUrl = url?.startsWith("http") ? url : "https://example.com"
  const validKey = key || "anon-key"

  return createBrowserClient(validUrl, validKey)
}
