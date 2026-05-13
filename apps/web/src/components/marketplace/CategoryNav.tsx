'use client'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

interface CategoryNavProps {
  categories: Category[]
  activeSlug?: string
}

export function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <a
          key={category.id}
          href={`/marketplace/category/${category.slug}`}
          className={`px-4 py-2 rounded-full text-sm border transition-colors ${
            activeSlug === category.slug
              ? 'bg-bg-accent text-text-on-accent border-border-accent'
              : 'bg-bg-surface text-text-default border-border-default hover:border-border-hover'
          }`}
        >
          {category.icon && <span className="mr-1">{category.icon}</span>}
          {category.name}
        </a>
      ))}
    </nav>
  )
}
