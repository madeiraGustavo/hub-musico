'use client'

import { useEffect, useState } from 'react'
import type { ProfileConfig } from '@/lib/profile/profileConfig'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { GradientText } from '@/lib/profile/GradientText'

const DEFAULT_LINKS = [
  { href: '#sobre',    label: 'Sobre' },
  { href: '#musicas',  label: 'Músicas' },
  { href: '#projetos', label: 'Projetos' },
  { href: '#servicos', label: 'Serviços' },
]

interface NavbarProps {
  links?:      Array<{ href: string; label: string }>
  artistName?: string
  palette?:    ProfileConfig['palette']
}

export function Navbar({
  links      = DEFAULT_LINKS,
  artistName = 'MAX SOUZA',
  palette    = PROFILE_CONFIG.musician.palette,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  const id = `nav-${artistName.toLowerCase().replace(/\s+/g, '-')}`

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function handleLinkClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault()
    setOpen(false)
    document.body.style.overflow = ''
    const target = document.querySelector(href)
    if (!target) return
    const top = target.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  function toggleMenu() {
    const next = !open
    setOpen(next)
    document.body.style.overflow = next ? 'hidden' : ''
  }

  const bgBase = palette.bgBase

  return (
    <>
      {/* Estilos de hover isolados por ID */}
      <style dangerouslySetInnerHTML={{ __html: `
        #${id} .nav-link { color: ${palette.textSecondary}; transition: color 0.2s; }
        #${id} .nav-link:hover { color: ${palette.text}; }
        #${id} .nav-login {
          border: 1px solid ${palette.accentBorder};
          color: ${palette.accent};
          background: transparent;
          transition: background 0.2s;
        }
        #${id} .nav-login:hover { background: ${palette.accentDim}; }
      ` }} />

      <nav id={id}
        className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between transition-all duration-300 px-10 py-3"
        style={{
          background:     scrolled ? `${bgBase}ee` : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)'  : 'none',
          boxShadow:      scrolled ? `0 1px 0 ${palette.accentBorder}, 0 4px 32px rgba(0,0,0,0.5)` : 'none',
        }}
      >
        {/* Logo */}
        <div className="font-head text-2xl font-bold tracking-wide">
          <GradientText gradient={palette.gradient}>{artistName}</GradientText>
        </div>

        {/* Links desktop */}
        <ul className={`items-center gap-9 ${open ? 'flex fixed inset-0 flex-col justify-center z-[999] gap-8' : 'hidden md:flex'}`}
          style={open ? { background: bgBase } : {}}>
          {links.map(link => (
            <li key={link.href}>
              <a href={link.href} onClick={e => handleLinkClick(e, link.href)}
                className="nav-link text-sm font-medium">
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#contato" onClick={e => handleLinkClick(e, '#contato')}
              className="nav-link text-sm font-medium">
              Contato
            </a>
          </li>
          <li>
            <a href="/login" className="nav-login px-4 py-2 rounded-[20px] font-semibold text-sm">
              Login
            </a>
          </li>
        </ul>

        {/* Hamburger */}
        <button onClick={toggleMenu} aria-label="Menu"
          className="flex md:hidden flex-col gap-[5px] p-1 z-[1001]">
          <span className={`block w-6 h-0.5 rounded-sm transition-all ${open ? 'translate-y-[7px] rotate-45' : ''}`}
            style={{ background: palette.text }} />
          <span className={`block w-6 h-0.5 rounded-sm transition-all ${open ? 'opacity-0' : ''}`}
            style={{ background: palette.text }} />
          <span className={`block w-6 h-0.5 rounded-sm transition-all ${open ? 'translate-y-[-7px] -rotate-45' : ''}`}
            style={{ background: palette.text }} />
        </button>
      </nav>
    </>
  )
}
