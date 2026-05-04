/**
 * validateMime.ts
 * Validação de MIME type por magic bytes (primeiros bytes do arquivo).
 * NÃO confia na extensão ou no Content-Type enviado pelo cliente.
 * OWASP A08: nunca confiar em metadados do cliente para validação de arquivo.
 */

export interface MimeValidationResult {
  valid: boolean
  detectedMime: string | null
  error?: string
}

export const SIZE_LIMITS = {
  audio: 50 * 1024 * 1024,
  image:  5 * 1024 * 1024,
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

const BLOCKED_MIMES = new Set([
  'image/svg+xml',
  'text/html',
  'text/javascript',
  'application/javascript',
  'application/x-php',
])

export function getMediaCategory(mime: string): 'audio' | 'image' | null {
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('image/')) return 'image'
  return null
}

function matchBytes(buf: Uint8Array, offset: number, magic: number[]): boolean {
  return magic.every((byte, i) => buf[offset + i] === byte)
}

function detectMime(buf: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (matchBytes(buf, 0, [0xFF, 0xD8, 0xFF])) return 'image/jpeg'

  // PNG: 89 50 4E 47
  if (matchBytes(buf, 0, [0x89, 0x50, 0x4E, 0x47])) return 'image/png'

  // FLAC: 66 4C 61 43
  if (matchBytes(buf, 0, [0x66, 0x4C, 0x61, 0x43])) return 'audio/flac'

  // MP3 com ID3 tag: 49 44 33
  if (matchBytes(buf, 0, [0x49, 0x44, 0x33])) return 'audio/mpeg'

  // MP3 frame sync (sem ID3): FF FB | FF F3 | FF F2
  if (buf[0] === 0xFF && (buf[1] === 0xFB || buf[1] === 0xF3 || buf[1] === 0xF2)) {
    return 'audio/mpeg'
  }

  // RIFF container — diferencia WAV e WebP pelos bytes 8-11
  if (matchBytes(buf, 0, [0x52, 0x49, 0x46, 0x46])) {
    const riffType = String.fromCharCode(
      buf[8]  ?? 0,
      buf[9]  ?? 0,
      buf[10] ?? 0,
      buf[11] ?? 0,
    )
    if (riffType === 'WAVE') return 'audio/wav'
    if (riffType === 'WEBP') return 'image/webp'
    return null // RIFF desconhecido — rejeita
  }

  return null
}

export async function validateMime(
  buffer: ArrayBuffer,
  declaredMime: string,
): Promise<MimeValidationResult> {
  const normalized = declaredMime.toLowerCase().trim()

  // 1. Bloqueia tipos explicitamente proibidos
  if (BLOCKED_MIMES.has(normalized)) {
    return { valid: false, detectedMime: null, error: 'Tipo de arquivo não permitido' }
  }

  const buf = new Uint8Array(buffer.slice(0, 16))
  const detectedMime = detectMime(buf)

  // 2. Não reconhecido pelos magic bytes
  if (!detectedMime) {
    return { valid: false, detectedMime: null, error: 'Formato de arquivo não reconhecido' }
  }

  // 3. MIME detectado não está na whitelist
  if (!ALLOWED_MIMES.has(detectedMime as AllowedMime)) {
    return { valid: false, detectedMime, error: 'Tipo de arquivo não permitido' }
  }

  // 4. MIME declarado não bate com o detectado — possível spoofing
  if (detectedMime !== normalized) {
    return {
      valid: false,
      detectedMime,
      error: 'Tipo de arquivo declarado não corresponde ao conteúdo real',
    }
  }

  return { valid: true, detectedMime }
}
