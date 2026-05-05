/**
 * profileConfig.ts
 *
 * Fonte da verdade para renderização contextual por ArtistType.
 * NUNCA espalhar if/else de tipo nos componentes — centralizar aqui.
 *
 * Uso:
 *   const config = PROFILE_CONFIG[artist.profileType]
 *   config.trackLabel  // "Faixas" ou "Estilos"
 */

import type { ArtistType } from '@hub-musico/types'

export interface ProfileConfig {
  // Labels contextuais
  trackLabel:        string
  trackLabelPlural:  string
  projectLabel:      string
  serviceLabel:      string
  portfolioLabel:    string

  // Hero
  heroTag:           string
  heroTitle:         string
  heroSubtitle:      string
  heroCTA:           string
  heroSecondaryCTA:  string

  // Sobre
  aboutTitle:        string
  aboutSubtitle:     string

  // Nav links
  navLinks: Array<{ href: string; label: string }>

  // Seções habilitadas
  sections: {
    player:    boolean
    waveform:  boolean
    vinyl:     boolean
    tracks:    boolean
    projects:  boolean
    portfolio: boolean
    styles:    boolean
    instagram: boolean
  }

  // Paleta — usada nos componentes contextuais
  palette: {
    accent:        string   // cor principal
    accentAlt:     string   // cor secundária / gradiente
    accentDim:     string   // fundo sutil
    accentBorder:  string   // borda
    bgBase:        string   // fundo base
    bgSurface:     string   // fundo surface
    bgCard:        string   // fundo card
    text:          string   // texto principal
    textSecondary: string   // texto secundário
    gradient:      string   // gradiente principal
  }
}

export const PROFILE_CONFIG: Record<ArtistType, ProfileConfig> = {

  musician: {
    trackLabel:       'Faixa',
    trackLabelPlural: 'Músicas',
    projectLabel:     'Projeto',
    serviceLabel:     'Serviço',
    portfolioLabel:   'Portfólio',

    heroTag:          'Baterista · Multi-instrumentista · Compositor · Arranjador · Educador Musical',
    heroTitle:        'O ritmo que move',
    heroSubtitle:     'a sua música',
    heroCTA:          'Ouvir Músicas',
    heroSecondaryCTA: 'Trabalhar Juntos',

    aboutTitle:    'A música é minha',
    aboutSubtitle: 'linguagem nativa',

    navLinks: [
      { href: '#sobre',    label: 'Sobre' },
      { href: '#musicas',  label: 'Músicas' },
      { href: '#projetos', label: 'Projetos' },
      { href: '#servicos', label: 'Serviços' },
      { href: '#contato',  label: 'Contato' },
    ],

    sections: {
      player:    true,
      waveform:  true,
      vinyl:     true,
      tracks:    true,
      projects:  true,
      portfolio: false,
      styles:    false,
      instagram: false,
    },

    palette: {
      accent:        '#6c63ff',
      accentAlt:     '#e040fb',
      accentDim:     'rgba(108,99,255,0.15)',
      accentBorder:  'rgba(108,99,255,0.35)',
      bgBase:        '#0a0a0f',
      bgSurface:     '#111118',
      bgCard:        '#16161f',
      text:          '#f0f0f8',
      textSecondary: '#9090a8',
      gradient:      'linear-gradient(135deg, #6c63ff, #e040fb)',
    },
  },

  tattoo: {
    trackLabel:       'Estilo',
    trackLabelPlural: 'Estilos',
    projectLabel:     'Trabalho',
    serviceLabel:     'Sessão',
    portfolioLabel:   'Galeria',

    heroTag:          'Tatuador Profissional · Fine Line · Blackwork · Pontilhismo',
    heroTitle:        'Arte que fica',
    heroSubtitle:     'na sua pele',
    heroCTA:          'Ver Portfólio',
    heroSecondaryCTA: 'Agendar Sessão',

    aboutTitle:    'Cada traço conta',
    aboutSubtitle: 'uma história',

    navLinks: [
      { href: '#sobre',     label: 'Sobre' },
      { href: '#portfolio', label: 'Portfólio' },
      { href: '#estilos',   label: 'Estilos' },
      { href: '#servicos',  label: 'Sessões' },
      { href: '#contato',   label: 'Contato' },
    ],

    sections: {
      player:    false,
      waveform:  false,
      vinyl:     false,
      tracks:    false,
      projects:  false,
      portfolio: true,
      styles:    true,
      instagram: true,
    },

    palette: {
      accent:        '#c9a96e',
      accentAlt:     '#f0d898',
      accentDim:     'rgba(201,169,110,0.1)',
      accentBorder:  'rgba(201,169,110,0.25)',
      bgBase:        '#0d0d0d',
      bgSurface:     '#111111',
      bgCard:        '#1a1a1a',
      text:          '#f5f5f5',
      textSecondary: '#a0a0a0',
      gradient:      'linear-gradient(135deg, #c9a96e, #f0d898)',
    },
  },
}
