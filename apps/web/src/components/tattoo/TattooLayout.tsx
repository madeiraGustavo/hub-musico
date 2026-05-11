import React from 'react'
import type { Artist, Track, Project } from '@hub-art/types'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { Navbar }          from '@/components/Navbar'
import { HeroTattoo }      from './HeroTattoo'
import { SobreTattoo }     from './SobreTattoo'
import { PortfolioTattoo } from './PortfolioTattoo'
import { EstilosTattoo }   from './EstilosTattoo'
import { InstagramCTA }    from './InstagramCTA'
import { Servicos }        from '@/components/shared/Servicos'
import { Depoimentos }     from '@/components/shared/Depoimentos'
import { Contato }         from '@/components/shared/Contato'
import { Footer }          from '@/components/Footer'

interface Props {
  artist:   Artist
  tracks:   Track[]
  projects: Project[]
}

export function TattooLayout({ artist, tracks, projects }: Props) {
  const config = PROFILE_CONFIG[artist.profileType]

  return (
    // Sem injeção de CSS vars — componentes tattoo usam valores fixos da paleta ink/gold
    <div>
      <Navbar links={config.navLinks} artistName={artist.name} palette={config.palette} />
      <HeroTattoo      artist={artist} />
      <SobreTattoo     artist={artist} />
      <PortfolioTattoo artist={artist} />
      <EstilosTattoo   artist={artist} />
      <InstagramCTA    artist={artist} />
      <Servicos
        services={artist.services}
        profileType={artist.profileType}
        palette={config.palette}
      />
      <Depoimentos
        testimonials={artist.testimonials}
        profileType={artist.profileType}
        palette={config.palette}
      />
      <Contato
        artist={artist}
        profileType={artist.profileType}
        palette={config.palette}
      />
      <Footer
        artistName={artist.name}
        navLinks={config.navLinks}
        palette={config.palette}
      />
    </div>
  )
}
