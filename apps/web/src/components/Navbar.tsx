'use client'

import { useEffect, useState } from 'react'

const LINKS = [
  { href: '#sobre',    label: 'Sobre' },
  { href: '#musicas',  label: 'Músicas' },
  { href: '#projetos', label: 'Projetos' },
  { href: '#servicos', label: 'Serviços' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between transition-all duration-300
        ${scrolled
          ? 'bg-[rgba(10,10,15,0.92)] backdrop-blur-xl shadow-[0_1px_0_rgba(108,99,255,0.15),0_4px_32px_rgba(0,0,0,0.5)] px-10 py-3.5'
          : 'px-10 py-5'
        }`}
    >
      {/* Logo */}
      <div className="font-head text-2xl font-bold tracking-wide bg-grad-main bg-clip-text text-transparent">
        MAX SOUZA
      </div>

      {/* Links desktop */}
      <ul
        className={`items-center gap-9 
          ${open
            ? 'flex fixed inset-0 bg-[rgba(10,10,15,0.97)] flex-col justify-center z-[999] gap-8'
            : 'hidden md:flex'
          }`}
      >
        {LINKS.map(link => (
          <li key={link.href}>
            <a
              href={link.href}
              onClick={e => handleLinkClick(e, link.href)}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors relative
                after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5
                after:bg-grad-main after:rounded-sm after:transition-all hover:after:w-full
                md:text-sm text-xl"
            >
              {link.label}
            </a>
          </li>
        ))}
        <li>
          <a
            href="#contato"
            onClick={e => handleLinkClick(e, '#contato')}
            className="px-5 py-2 rounded-[20px] bg-grad-main text-white font-semibold text-sm
              hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(108,99,255,0.4)] transition-all"
          >
            Contato
          </a>
        </li>
      </ul>

      {/* Hamburger */}
      <button
        onClick={toggleMenu}
        aria-label="Menu"
        className="flex md:hidden flex-col gap-[5px] p-1 z-[1001]"
      >
        <span className={`block w-6 h-0.5 bg-text-primary rounded-sm transition-all ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
        <span className={`block w-6 h-0.5 bg-text-primary rounded-sm transition-all ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-6 h-0.5 bg-text-primary rounded-sm transition-all ${open ? 'translate-y-[-7px] -rotate-45' : ''}`} />
      </button>
    </nav>
  )
}
