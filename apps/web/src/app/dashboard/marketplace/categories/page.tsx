'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  sortOrder: number
  createdAt: string
}

export default function DashboardCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [error, setError] = useState('')

  function loadCategories() {
    apiGet<{ data: Category[] }>('/dashboard/marketplace/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCategories() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      if (editingId) {
        await apiPatch(`/dashboard/marketplace/categories/${editingId}`, {
          name: formName,
          icon: formIcon || undefined,
          sortOrder: formSortOrder,
        })
      } else {
        await apiPost('/dashboard/marketplace/categories', {
          name: formName,
          icon: formIcon || undefined,
          sortOrder: formSortOrder,
        })
      }
      resetForm()
      loadCategories()
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    try {
      await apiDelete(`/dashboard/marketplace/categories/${id}`)
      loadCategories()
    } catch (err: any) {
      setError(err.message ?? 'Erro ao excluir')
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setFormName(cat.name)
    setFormIcon(cat.icon ?? '')
    setFormSortOrder(cat.sortOrder)
    setShowForm(true)
  }

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setFormName('')
    setFormIcon('')
    setFormSortOrder(0)
    setError('')
  }

  if (loading) return <div className="text-text-muted text-sm">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-default">Categorias</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-bg-accent text-text-on-accent rounded text-sm"
        >
          Nova Categoria
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border border-border-default rounded-lg bg-bg-surface space-y-3">
          <div>
            <label className="block text-sm text-text-default mb-1">Nome</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-default mb-1">Ícone</label>
              <input
                type="text"
                value={formIcon}
                onChange={e => setFormIcon(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm text-text-default mb-1">Ordem</label>
              <input
                type="number"
                value={formSortOrder}
                onChange={e => setFormSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
                min={0}
                max={999}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-bg-accent text-text-on-accent rounded text-sm">
              {editingId ? 'Salvar' : 'Criar'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-border-default rounded text-sm text-text-default">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between p-3 border border-border-default rounded-lg bg-bg-surface">
            <div>
              <span className="text-text-default font-medium">{cat.name}</span>
              <span className="text-text-muted text-xs ml-2">/{cat.slug}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(cat)} className="text-xs text-text-muted hover:text-text-default">
                Editar
              </button>
              <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-500 hover:text-red-700">
                Excluir
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">Nenhuma categoria criada.</p>
        )}
      </div>
    </div>
  )
}
