'use client'

import { useState } from 'react'

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

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-bg-muted rounded-lg flex items-center justify-center">
        <span className="text-text-muted text-sm">Sem imagens</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square bg-bg-muted rounded-lg overflow-hidden">
        <img
          src={images[activeIndex].url}
          alt={images[activeIndex].alt ?? title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded border overflow-hidden transition-colors ${
                index === activeIndex
                  ? 'border-border-accent ring-2 ring-border-accent'
                  : 'border-border-default hover:border-border-hover'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt ?? `${title} - ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
