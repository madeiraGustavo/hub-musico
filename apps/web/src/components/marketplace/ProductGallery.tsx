'use client'

import { useState, useCallback } from 'react'

interface Image {
  id: string
  url: string
  alt: string | null
  sortOrder: number
}

interface ProductGalleryProps {
  images: Image[]
  title: string
}

function PlaceholderSVG() {
  return (
    <div className="aspect-square rounded-[var(--mp-radius-md)] overflow-hidden bg-gradient-to-br from-[var(--mp-bg-muted)] to-[var(--mp-border-default)] flex items-center justify-center">
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Awning / Lona icon */}
        <rect x="16" y="40" width="64" height="4" rx="2" fill="var(--mp-text-muted)" opacity="0.5" />
        <path
          d="M16 44 C24 56, 32 56, 40 44 C48 56, 56 56, 64 44 C72 56, 80 56, 80 44"
          stroke="var(--mp-text-muted)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <rect x="20" y="44" width="2" height="28" rx="1" fill="var(--mp-text-muted)" opacity="0.3" />
        <rect x="74" y="44" width="2" height="28" rx="1" fill="var(--mp-text-muted)" opacity="0.3" />
        <rect x="18" y="70" width="60" height="3" rx="1.5" fill="var(--mp-text-muted)" opacity="0.2" />
      </svg>
    </div>
  )
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleThumbnailClick = useCallback((index: number) => {
    if (index === activeIndex || isTransitioning) return
    setIsTransitioning(true)
    // After fade-out completes, switch image and fade-in
    setTimeout(() => {
      setActiveIndex(index)
      setIsTransitioning(false)
    }, 150)
  }, [activeIndex, isTransitioning])

  if (images.length === 0) {
    return <PlaceholderSVG />
  }

  return (
    <div className="space-y-3">
      {/* Main image with crossfade transition */}
      <div className="aspect-square bg-[var(--mp-bg-muted)] rounded-[var(--mp-radius-md)] overflow-hidden relative">
        <img
          src={images[activeIndex]?.url}
          alt={images[activeIndex]?.alt ?? title}
          className="w-full h-full object-cover transition-opacity duration-300 ease-in-out"
          style={{ opacity: isTransitioning ? 0 : 1 }}
        />
      </div>

      {/* Thumbnails — horizontal scroll on mobile */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto flex-nowrap pb-1"
          role="group"
          aria-label="Miniaturas da galeria"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleThumbnailClick(index)}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              className={`flex-shrink-0 w-16 h-16 rounded-[var(--mp-radius-sm)] border overflow-hidden transition-all duration-200 ${
                index === activeIndex
                  ? 'border-[var(--mp-border-accent)] ring-2 ring-[var(--mp-border-accent)]'
                  : 'border-[var(--mp-border-default)] hover:border-[var(--mp-border-hover)]'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt ?? `${title} - imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
