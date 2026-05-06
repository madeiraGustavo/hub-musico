// Feature: api-architecture-migration, Property 6: input validation rejects invalid data

/**
 * validation.property.test.ts
 *
 * Property-based tests for Property 6: Validação de input rejeita dados inválidos
 *
 * Para qualquer payload que viole o schema Zod de um endpoint (campo obrigatório
 * ausente, tipo errado, string fora dos limites), o schema deve rejeitar o payload
 * (safeParse retorna success: false) — garantindo que a API retornaria HTTP 422
 * e o recurso no banco não seria criado ou modificado.
 *
 * Validates: Requirements 4.2, 4.3
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

import { LoginSchema }          from './auth/auth.schema.js'
import { CreateTrackSchema, UpdateTrackSchema }       from './tracks/tracks.schema.js'
import { CreateProjectSchema, UpdateProjectSchema }   from './projects/projects.schema.js'
import { CreateServiceSchema, UpdateServiceSchema }   from './services/services.schema.js'
import { UpdateProfileSchema }                        from './profile/profile.schema.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Asserts that a Zod schema rejects the given payload. */
function assertInvalid(schema: { safeParse: (v: unknown) => { success: boolean } }, payload: unknown): void {
  const result = schema.safeParse(payload)
  expect(result.success).toBe(false)
}

// ─── Generators for invalid values ───────────────────────────────────────────

/** Generates a non-email string (plain string without '@'). */
const invalidEmail = fc.string({ minLength: 1 }).filter(s => !s.includes('@'))

/** Generates a string shorter than 6 characters (violates min(6)). */
const tooShortPassword = fc.string({ maxLength: 5 })

/** Generates a string shorter than 2 characters (violates min(2)). */
const tooShortString = fc.oneof(fc.constant(''), fc.string({ maxLength: 1 }))

/** Generates a non-string primitive (number, boolean, null, undefined). */
const nonString = fc.oneof(
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
)

/** Generates a non-boolean primitive. */
const nonBoolean = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.constant(null),
)

// ─── Property 6.1: LoginSchema rejeita payloads inválidos ────────────────────

describe('Property 6: LoginSchema rejeita payloads inválidos', () => {
  it(
    'rejeita qualquer email sem formato válido (sem @) — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidEmail,
          fc.string({ minLength: 6 }),
          async (email, password) => {
            assertInvalid(LoginSchema, { email, password })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita qualquer senha com menos de 6 caracteres — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          tooShortPassword,
          async (email, password) => {
            assertInvalid(LoginSchema, { email, password })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo email — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 6 }),
          async (password) => {
            assertInvalid(LoginSchema, { password })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo password — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            assertInvalid(LoginSchema, { email })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload com tipos errados (email como número, password como boolean) — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer(),
          fc.boolean(),
          async (email, password) => {
            assertInvalid(LoginSchema, { email, password })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 6.2: CreateTrackSchema rejeita payloads inválidos ───────────────

const VALID_GENRES = ['piano', 'jazz', 'ambient', 'orquestral', 'rock', 'demo', 'outro'] as const
const invalidGenre = fc.string().filter(s => !(VALID_GENRES as readonly string[]).includes(s))

describe('Property 6: CreateTrackSchema rejeita payloads inválidos', () => {
  it(
    'rejeita qualquer title com menos de 2 caracteres — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          tooShortString,
          fc.constantFrom(...VALID_GENRES),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (title, genre, genre_label) => {
            assertInvalid(CreateTrackSchema, { title, genre, genre_label })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita qualquer genre fora do enum permitido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          invalidGenre,
          fc.string({ minLength: 1, maxLength: 50 }),
          async (title, genre, genre_label) => {
            assertInvalid(CreateTrackSchema, { title, genre, genre_label })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo title obrigatório — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...VALID_GENRES),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (genre, genre_label) => {
            assertInvalid(CreateTrackSchema, { genre, genre_label })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo genre obrigatório — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (title, genre_label) => {
            assertInvalid(CreateTrackSchema, { title, genre_label })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo genre_label obrigatório — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.constantFrom(...VALID_GENRES),
          async (title, genre) => {
            assertInvalid(CreateTrackSchema, { title, genre })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita sort_order negativo ou não-inteiro — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.constantFrom(...VALID_GENRES),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ max: -1 }),
          async (title, genre, genre_label, sort_order) => {
            assertInvalid(CreateTrackSchema, { title, genre, genre_label, sort_order })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 6.3: UpdateTrackSchema rejeita payloads inválidos ───────────────

describe('Property 6: UpdateTrackSchema rejeita payloads inválidos', () => {
  it(
    'rejeita title com menos de 2 caracteres quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          tooShortString,
          async (title) => {
            assertInvalid(UpdateTrackSchema, { title })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita genre inválido quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidGenre,
          async (genre) => {
            assertInvalid(UpdateTrackSchema, { genre })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita sort_order negativo quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ max: -1 }),
          async (sort_order) => {
            assertInvalid(UpdateTrackSchema, { sort_order })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 6.4: CreateProjectSchema rejeita payloads inválidos ─────────────

const VALID_PLATFORMS = ['youtube', 'spotify', 'soundcloud', 'outro'] as const
const invalidPlatform = fc.string().filter(s => !(VALID_PLATFORMS as readonly string[]).includes(s))

describe('Property 6: CreateProjectSchema rejeita payloads inválidos', () => {
  it(
    'rejeita qualquer title com menos de 2 caracteres — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          tooShortString,
          fc.constantFrom(...VALID_PLATFORMS),
          fc.webUrl(),
          async (title, platform, href) => {
            assertInvalid(CreateProjectSchema, { title, platform, href })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita platform fora do enum permitido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          invalidPlatform,
          fc.webUrl(),
          async (title, platform, href) => {
            assertInvalid(CreateProjectSchema, { title, platform, href })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita href que não é uma URL válida — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.constantFrom(...VALID_PLATFORMS),
          // Generate strings that are clearly not URLs: plain words without any protocol or domain structure
          fc.stringOf(fc.char().filter(c => c !== ':' && c !== '/' && c !== '.' && c !== '@'), { minLength: 1, maxLength: 50 }),
          async (title, platform, href) => {
            assertInvalid(CreateProjectSchema, { title, platform, href })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo title obrigatório — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...VALID_PLATFORMS),
          fc.webUrl(),
          async (platform, href) => {
            assertInvalid(CreateProjectSchema, { platform, href })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo platform obrigatório — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.webUrl(),
          async (title, href) => {
            assertInvalid(CreateProjectSchema, { title, href })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo href obrigatório — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.constantFrom(...VALID_PLATFORMS),
          async (title, platform) => {
            assertInvalid(CreateProjectSchema, { title, platform })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 6.5: UpdateProjectSchema rejeita payloads inválidos ─────────────

describe('Property 6: UpdateProjectSchema rejeita payloads inválidos', () => {
  it(
    'rejeita title com menos de 2 caracteres quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          tooShortString,
          async (title) => {
            assertInvalid(UpdateProjectSchema, { title })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita platform inválida quando fornecida — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidPlatform,
          async (platform) => {
            assertInvalid(UpdateProjectSchema, { platform })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita href inválida quando fornecida — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.stringOf(fc.char().filter(c => c !== ':' && c !== '/' && c !== '.' && c !== '@'), { minLength: 1, maxLength: 50 }),
          async (href) => {
            assertInvalid(UpdateProjectSchema, { href })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 6.6: CreateServiceSchema rejeita payloads inválidos ─────────────

const VALID_ICONS = ['drum', 'mic', 'music', 'compose', 'needle', 'camera', 'calendar', 'star'] as const
const invalidIcon = fc.string().filter(s => !(VALID_ICONS as readonly string[]).includes(s))

describe('Property 6: CreateServiceSchema rejeita payloads inválidos', () => {
  it(
    'rejeita icon fora do enum permitido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidIcon,
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (icon, title, description, price) => {
            assertInvalid(CreateServiceSchema, { icon, title, description, price })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita title com menos de 2 caracteres — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...VALID_ICONS),
          tooShortString,
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (icon, title, description, price) => {
            assertInvalid(CreateServiceSchema, { icon, title, description, price })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita description com menos de 10 caracteres — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...VALID_ICONS),
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.string({ maxLength: 9 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (icon, title, description, price) => {
            assertInvalid(CreateServiceSchema, { icon, title, description, price })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita price vazio (string vazia) — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...VALID_ICONS),
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (icon, title, description) => {
            assertInvalid(CreateServiceSchema, { icon, title, description, price: '' })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo icon obrigatório — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (title, description, price) => {
            assertInvalid(CreateServiceSchema, { title, description, price })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita sort_order negativo — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...VALID_ICONS),
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ max: -1 }),
          async (icon, title, description, price, sort_order) => {
            assertInvalid(CreateServiceSchema, { icon, title, description, price, sort_order })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 6.7: UpdateServiceSchema rejeita payloads inválidos ─────────────

describe('Property 6: UpdateServiceSchema rejeita payloads inválidos', () => {
  it(
    'rejeita icon inválido quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidIcon,
          async (icon) => {
            assertInvalid(UpdateServiceSchema, { icon })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita title com menos de 2 caracteres quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          tooShortString,
          async (title) => {
            assertInvalid(UpdateServiceSchema, { title })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita description com menos de 10 caracteres quando fornecida — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ maxLength: 9 }),
          async (description) => {
            assertInvalid(UpdateServiceSchema, { description })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita sort_order negativo quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ max: -1 }),
          async (sort_order) => {
            assertInvalid(UpdateServiceSchema, { sort_order })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 6.8: UpdateProfileSchema rejeita payloads inválidos ─────────────

describe('Property 6: UpdateProfileSchema rejeita payloads inválidos', () => {
  it(
    'rejeita name com menos de 2 caracteres quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          tooShortString,
          async (name) => {
            assertInvalid(UpdateProfileSchema, { name })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita email com formato inválido quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidEmail,
          async (email) => {
            assertInvalid(UpdateProfileSchema, { email })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita tagline com mais de 300 caracteres quando fornecida — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 301, maxLength: 500 }),
          async (tagline) => {
            assertInvalid(UpdateProfileSchema, { tagline })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita location com mais de 100 caracteres quando fornecida — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 101, maxLength: 200 }),
          async (location) => {
            assertInvalid(UpdateProfileSchema, { location })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita skills como não-array quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // skills must be an array — passing a non-array non-undefined value should fail
          fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
          async (skills) => {
            assertInvalid(UpdateProfileSchema, { skills })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita tools como não-array quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // tools must be an array — passing a non-array non-undefined value should fail
          fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
          async (tools) => {
            assertInvalid(UpdateProfileSchema, { tools })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
