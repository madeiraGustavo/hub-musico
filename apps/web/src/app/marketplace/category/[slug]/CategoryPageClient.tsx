'use client'

import { useRouter } from 'next/navigation'
import { PaginationControls } from '@/components/marketplace/PaginationControls'

interface CategoryPageClientProps {
  currentPage: number
  totalPages: number
  categorySlug: string
}

export function CategoryPageClient({ currentPage, totalPages, categorySlug }: CategoryPageClientProps) {
  const router = useRouter()

  function handlePageChange(page: number) {
    router.push(`/marketplace/category/${categorySlug}?page=${page}`)
  }

  return (
    <PaginationControls
      page={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  )
}
