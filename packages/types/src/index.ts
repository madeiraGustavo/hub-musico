// ─── Track ───────────────────────────────────────────────────────────────────

export type TrackGenre =
  | 'all'
  | 'piano'
  | 'jazz'
  | 'ambient'
  | 'orquestral'
  | 'rock'
  | 'demo'

export interface Track {
  id: number
  title: string
  genre: TrackGenre
  genreLabel: string
  duration: string
  key: string
  src: string | null
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type ProjectPlatform = 'youtube' | 'spotify'

export interface Project {
  id: string
  title: string
  description: string
  year: string
  platform: ProjectPlatform
  tags: string[]
  href: string
  thumbnailUrl: string | null
  spotifyId: string | null
  featured: boolean
  backgroundStyle: string
  backgroundPosition: string | null
  backgroundSize: string | null
}

// ─── Artist ──────────────────────────────────────────────────────────────────

export interface ArtistStat {
  value: string
  label: string
}

export interface ArtistContact {
  email: string
  whatsapp: string
}

export interface ArtistEducation {
  year: string | null
  title: string
  institution: string
}

export interface ArtistService {
  id: string
  icon: 'drum' | 'mic' | 'music' | 'compose'
  title: string
  description: string
  items: string[]
  price: string
  highlight: boolean
}

export interface ArtistTestimonial {
  id: string
  text: string
  author: string
  role: string
  initials: string
  gradient: string
}

export interface Artist {
  id: string
  name: string
  tagline: string
  bio: string[]
  location: string
  reach: string
  contact: ArtistContact
  social: Record<string, string | null>
  stats: ArtistStat[]
  skills: string[]
  tools: string[]
  education: ArtistEducation[]
  references: string[]
  services: ArtistService[]
  testimonials: ArtistTestimonial[]
}

// ─── API Response wrappers (usados na FASE 3) ─────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    message: string
    code: string
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError
