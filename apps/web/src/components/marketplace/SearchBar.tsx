'use client'

import { useState, useEffect, useRef } from 'react'

export interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  categories?: Array<{ id: string; name: string; slug: string }>
  onCategorySelect?: (categoryId: string | null) => void
}

export function SearchBar({
  onSearch,
  placeholder = 'Buscar produtos...',
  categories,
  onCategorySelect,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, onSearch])

  function handleClear() {
    setQuery('')
    inputRef.current?.focus()
  }

  function handleCategoryClick(categoryId: string | null) {
    setSelectedCategory(categoryId)
    onCategorySelect?.(categoryId)
  }

  return (
    <div className="w-full">
      {/* Search input */}
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.58 3.58a.75.75 0 1 1-1.06 1.06l-3.58-3.58A7 7 0 0 1 2 9Z"
            fill="var(--mp-text-muted)"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar produtos"
          className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-lg border text-sm transition-colors duration-200 outline-none"
          style={{
            borderColor: 'var(--mp-border-default)',
            backgroundColor: 'var(--mp-bg-elevated)',
            color: 'var(--mp-text-default)',
            fontFamily: 'var(--mp-font-body)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--mp-accent)'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232, 93, 44, 0.15)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--mp-border-default)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-150"
            style={{
              backgroundColor: 'var(--mp-bg-muted)',
              color: 'var(--mp-text-secondary)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M3 3l6 6M9 3l-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Category pills */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Filtrar por categoria">
          <button
            type="button"
            onClick={() => handleCategoryClick(null)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 min-h-[44px] flex items-center"
            style={{
              backgroundColor: selectedCategory === null ? 'var(--mp-accent)' : 'var(--mp-bg-muted)',
              color: selectedCategory === null ? 'var(--mp-text-on-accent)' : 'var(--mp-text-secondary)',
              border: selectedCategory === null ? '1px solid var(--mp-accent)' : '1px solid var(--mp-border-default)',
            }}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 min-h-[44px] flex items-center"
              style={{
                backgroundColor: selectedCategory === category.id ? 'var(--mp-accent)' : 'var(--mp-bg-muted)',
                color: selectedCategory === category.id ? 'var(--mp-text-on-accent)' : 'var(--mp-text-secondary)',
                border: selectedCategory === category.id ? '1px solid var(--mp-accent)' : '1px solid var(--mp-border-default)',
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
