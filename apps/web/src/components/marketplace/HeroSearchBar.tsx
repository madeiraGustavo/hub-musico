'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeroSearchBarProps {
  categories: Array<{ id: string; name: string; slug: string }>
}

export function HeroSearchBar({ categories }: HeroSearchBarProps) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedCategory) {
      router.push(`/marketplace/category/${selectedCategory}`)
    } else {
      router.push('/marketplace#catalogo')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'stretch',
      }}
      role="search"
      aria-label="Filtrar por categoria"
    >
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        aria-label="Selecionar categoria"
        style={{
          flex: 1,
          minHeight: '44px',
          padding: '8px 12px',
          borderRadius: 'var(--mp-radius-sm)',
          border: '1px solid var(--mp-border-default)',
          backgroundColor: 'var(--mp-bg-elevated)',
          color: 'var(--mp-text-default)',
          fontFamily: 'var(--mp-font-body)',
          fontSize: '0.875rem',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="">Todas as categorias</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="mp-btn-primary"
        style={{
          padding: '8px 20px',
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
        }}
      >
        Explorar
      </button>
    </form>
  )
}
