/**
 * supabase/admin.ts
 * Cliente com service_role — bypassa RLS
 * USO EXCLUSIVO em Route Handlers server-side
 * NUNCA importar em Client Components ou expor ao browser
 */

import { createClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createClient> | null = null

export function createAdminClient() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase Admin: SUPABASE_SERVICE_ROLE_KEY não configurada')
  }

  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  })

  return adminClient
}
