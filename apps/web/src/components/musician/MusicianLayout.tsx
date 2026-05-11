import type { Artist, Track, Project } from '@hub-art/types'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { Navbar }        from '@/components/Navbar'
import { Hero }          from './Hero'
import { Sobre }         from './Sobre'
import { Musicas }       from './Musicas'
import { Projetos }      from './Projetos'
import { Servicos }      from '@/components/shared/Servicos'
import { Depoimentos }   from '@/components/shared/Depoimentos'
import { Contato }       from '@/components/shared/Contato'
import { Footer }        from '@/components/Footer'

interface Props {
  artist:   Artist
  tracks:   Track[]
  projects: Project[]
}

export function MusicianLayout({ artist, tracks, projects }: Props) {
  const config = PROFILE_CONFIG[artist.profileType]
  return (
    <>
      <Navbar links={config.navLinks} artistName={artist.name} palette={config.palette} />
      <Hero     artist={artist} />
      <Sobre    artist={artist} />
      <Musicas  tracks={tracks} />
      <Projetos projects={projects} />
      <Servicos    services={artist.services} profileType={artist.profileType} palette={config.palette} />
      <Depoimentos testimonials={artist.testimonials} profileType={artist.profileType} palette={config.palette} />
      <Contato     artist={artist} profileType={artist.profileType} palette={config.palette} />
      <Footer   artistName={artist.name} navLinks={config.navLinks} palette={config.palette} />
    </>
  )
}
