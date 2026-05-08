import { createClient } from '@supabase/supabase-js'
import { env } from '../env.js'

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession:   false,
  },
})

export async function uploadFile(
  bucket:   string,
  key:      string,
  buffer:   Buffer | ArrayBuffer,
  mimeType: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType: mimeType,
    upsert:      true,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
}

export async function deleteFile(bucket: string, key: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([key])
  if (error) throw new Error(`Storage delete failed: ${error.message}`)
}

export async function createSignedUrl(
  bucket:        string,
  key:           string,
  expiresInSecs: number,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, expiresInSecs)
  if (error || !data?.signedUrl) {
    throw new Error(`Storage signed URL failed: ${error?.message ?? 'no URL returned'}`)
  }
  return data.signedUrl
}
