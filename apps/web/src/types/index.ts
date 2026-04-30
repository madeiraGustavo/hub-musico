export interface Musica {
  id: number
  title: string
  genre: string
  genreLabel: string
  duration: string
  key: string
  src: string | null
}

export interface Projeto {
  id: string
  title: string
  description: string
  year: string
  platform: 'youtube' | 'spotify'
  tags: string[]
  href: string
  thumbnailUrl: string | null
  spotifyId: string | null
  featured: boolean
  backgroundStyle: string
  backgroundPosition?: string
  backgroundSize?: string
}

export interface Servico {
  id: string
  icon: 'drum' | 'mic' | 'music' | 'compose'
  title: string
  description: string
  items: string[]
  price: string
  highlight: boolean
}

export interface Depoimento {
  id: string
  text: string
  author: string
  role: string
  initials: string
  gradient: string
}

export type FilterGenre = 'all' | 'piano' | 'jazz' | 'ambient' | 'orquestral' | 'rock' | 'demo'
