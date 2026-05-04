import React from 'react'
import type { Artist, Track, Project } from '@hub-musico/types'
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
  const p = config.palette

  // Injeta variáveis CSS da paleta — sobrescreve as do tema global apenas neste layout
  const cssVars = {
    '--profile-accent':         p.accent,
    '--profile-accent-alt':     p.accentAlt,
    '--profile-accent-dim':     p.accentDim,
    '--profile-accent-border':  p.accentBorder,
    '--profile-bg-base':        p.bgBase,
    '--profile-bg-surface':     p.bgSurface,
    '--profile-bg-card':        p.bgCard,
    '--profile-text':           p.text,
    '--profile-text-secondary': p.textSecondary,
    '--profile-gradient':       p.gradient,
  } as React.CSSProperties

  return (
    <div style={cssVars}>
      <Navbar links={config.navLinks} artistName={artist.name} palette={config.palette} />
      <HeroTattoo      artist={artist} />
      <SobreTattoo     artist={artist} />
      <PortfolioTattoo projects={projects} />
      <EstilosTattoo   tracks={tracks} />
      <InstagramCTA    artist={artist} />
      <Servicos    services={artist.services} profileType={artist.profileType} palette={config.palette} />
      <Depoimentos testimonials={artist.testimonials} profileType={artist.profileType} palette={config.palette} />
      <Contato     artist={artist} profileType={artist.profileType} palette={config.palette} />
      <Footer          artistName={artist.name} navLinks={config.navLinks} palette={config.palette} />
    </div>
  )
}
