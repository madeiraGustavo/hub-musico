/**
 * validateMime.ts
 * Validação de MIME type por magic bytes (primeiros bytes do arquivo)
 * NÃO confia na extensão ou no Content-Type enviado pelo cliente
 *
 * Regra OWASP A08: nunca confiar em metadados do cliente para validação de arquivo
 */

export interface MimeValidationResult {
  valid: boolean
  detectedMime: string | null
  error?: string
}

// Magic bytes de cada tipo permitido
const MAGIC_BYTES: Array<{
  mime: string
  bytes: number[]
  offset: number
}> = [
  // JPEG
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF], offset: 0 },
  // PNG
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47], offset: 0 },
  // WebP (RIFF....WEBP)
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  // MP3 (ID3 tag)
  { mime: 'audio/mpeg', bytes: [0x49, 0x44, 0x33], offset: 0 },
  // MP3 (frame sync sem ID3)
  { mime: 'audio/mpeg', bytes: [0xFF, 0xFB], offset: 0 },
  { mime: 'audio/mpeg', bytes: [0xFF, 0xF3], offset: 0 },
  { mime: 'audio/mpeg', bytes: [0xFF, 0xF2], offset: 0 },
  // WAV (RIFF....WAVE)
  { mime: 'audio/wav',  bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  // FLAC
  { mime: 'audio/flac', bytes: [0x66, 0x4C, 0x61, 0x43], offset: 0 },
]

// Tipos explicitamente bloqueados (independente de magic bytes)
const BLOCKED_MIMES = new Set([
  'image/svg+xml',
  'text/html',
  'text/javascript',
  'application/javascript',
  'application/x-php',
])

// Limites de tamanho por categoria
export const SIZE_LIMITS = {
  audio: 50 * 1024 * 1024,  // 50MB
  image:  5 * 1024 * 1024,  //  5MB
} as const

export type AllowedMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'audio/flac'

export const ALLOWED_MIMES = new Set<AllowedMime>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/flac',
])

export function getMediaCategory(mime: string): 'audio' | 'image' | null {
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('image/')) return 'image'
  return null
}

export async function validateMime(
  buffer: ArrayBuffer,
  declaredMime: string,
): Promise<MimeValidationResult> {
  // 1. Bloqueia tipos explicitamente proibidos
  if (BLOCKED_MIMES.has(declaredMime.toLowerCase())) {
    return { valid: false, detectedMime: null, error: 'Tipo de arquivo não permitido' }
  }

  const bytes = new Uint8Array(buffer.slice(0, 16))

  // 2. Detecta MIME real pelos magic bytes
  let detectedMime: string | null = null

  for (const signature of MAGIC_BYTES) {
    const { bytes: magic, offset } = signature
    const match = magic.every((byte, i) => bytes[offset + i] === byte)
    if (match) {
      detectedMime = signature.mime
      break
    }
  }

  // Caso especial: WAV tem RIFF mas precisa verificar bytes 8-11 = "WAVE"
  if (detectedMime === 'audio/mpeg' && bytes[0] === 0x52) {
    // É RIFF — verifica se é WAV ou WebP
    const riffType = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0)
    if (riffType === 'WAVE') detectedMime = 'audio/wav'
    else if (riffType === 'WEBP') detectedMime = 'image/webp'
    else detectedMime = null
  }

  if (!detectedMime) {
    return { valid: false, detectedMime: null, error: 'Formato de arquivo não reconhecido' }
  }

  // 3. Verifica se o MIME detectado está na lista de permitidos
  if (!ALLOWED_MIMES.has(detectedMime as AllowedMime)) {
    return { valid: false, detectedMime, error: 'Tipo de arquivo não permitido' }
  }

  // 4. Verifica se o MIME declarado bate com o detectado (evita spoofing)
  if (detectedMime !== declaredMime) {
    return {
      valid: false,
      detectedMime,
      error: 'Tipo de arquivo declarado não corresponde ao conteúdo real',
    }
  }

  return { valid: true, detectedMime }
}
