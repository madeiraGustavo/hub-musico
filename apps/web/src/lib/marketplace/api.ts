const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface Product {
  id: string
  slug: string
  title: string
  description: string | null
  shortDescription: string | null
  type: 'FIXED_PRICE' | 'QUOTE_ONLY'
  basePrice: number | null
  stock: number | null
  customizable: boolean
  widthCm: number | null
  heightCm: number | null
  material: string | null
  color: string | null
  categoryId: string
  featured: boolean
  sortOrder: number
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductDetail extends Product {
  category: { id: string; name: string; slug: string }
  images: Array<{
    id: string
    url: string
    alt: string | null
    sortOrder: number
  }>
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sortOrder: number
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ProductListResponse {
  data: Product[]
  pagination: Pagination
}

export interface ProductDetailResponse {
  data: ProductDetail
}

export interface CategoryListResponse {
  data: Category[]
}

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
}

export async function fetchProducts(params?: {
  categoryId?: string
  featured?: boolean
  page?: number
  pageSize?: number
}): Promise<ProductListResponse> {
  try {
    const url = new URL(`${API_URL}/marketplace/products`)
    if (params?.categoryId) url.searchParams.set('categoryId', params.categoryId)
    if (params?.featured) url.searchParams.set('featured', 'true')
    if (params?.page) url.searchParams.set('page', String(params.page))
    if (params?.pageSize) url.searchParams.set('pageSize', String(params.pageSize))

    const res = await fetch(url.toString(), { next: { revalidate: 60 } })
    if (!res.ok) return { data: [], pagination: EMPTY_PAGINATION }
    return res.json()
  } catch {
    return { data: [], pagination: EMPTY_PAGINATION }
  }
}

export async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/marketplace/products/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json: ProductDetailResponse = await res.json()
    return json.data
  } catch {
    return null
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/marketplace/categories`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const json: CategoryListResponse = await res.json()
    return json.data
  } catch {
    return []
  }
}
