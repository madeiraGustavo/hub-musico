'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client'

interface Service {
  id: string
  icon: string
  title: string
  description: string
  items: string[]
  price: string
  highlight: boolean
  active: boolean
  sortOrder: number
}

interface ServicesResponse {
  data?: Service[]
  error?: string
}

interface ServiceResponse {
  data?: Service
  error?: string
}

const ICONS = ['drum','mic','music','compose','needle','camera','calendar','star']

const EMPTY: Omit<Service, 'id' | 'active' | 'sortOrder'> = {
  icon:        'star',
  title:       '',
  description: '',
  items:       [],
  price:       '',
  highlight:   false,
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  // Formulário de edição/criação
  const [editing, setEditing]   = useState<Service | null>(null)
  const [isNew, setIsNew]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    apiGet<ServicesResponse>('/dashboard/services')
      .then((d) => {
        if (d.error) setError(d.error)
        else setServices(d.data ?? [])
      })
      .catch(() => setError('Erro ao carregar serviços'))
      .finally(() => setLoading(false))
  }, [])

  function openNew() {
    setEditing({ ...EMPTY, id: '', active: true, sortOrder: services.length })
    setIsNew(true)
    setFeedback(null)
  }

  function openEdit(s: Service) {
    setEditing({ ...s })
    setIsNew(false)
    setFeedback(null)
  }

  function closeForm() {
    setEditing(null)
    setIsNew(false)
    setFeedback(null)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    setFeedback(null)

    const body = {
      icon:        editing.icon,
      title:       editing.title,
      description: editing.description,
      items:       editing.items,
      price:       editing.price,
      highlight:   editing.highlight,
      sortOrder:   editing.sortOrder,
      active:      editing.active,
    }

    try {
      if (isNew) {
        await apiPost<ServiceResponse>('/dashboard/services', body)
        // Recarrega a lista para pegar o objeto completo
        const list = await apiGet<ServicesResponse>('/dashboard/services')
        setServices(list.data ?? [])
      } else {
        const json = await apiPatch<ServiceResponse>(`/dashboard/services/${editing.id}`, body)
        if (json.data) {
          setServices(prev => prev.map(s => s.id === json.data!.id ? { ...s, ...json.data } : s))
        }
      }
      closeForm()
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar este serviço?')) return
    try {
      await apiDelete(`/dashboard/services/${id}`)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Erro ao deletar serviço')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-head text-3xl font-bold">Serviços</h1>
        <button
          onClick={openNew}
          className="px-5 py-2.5 rounded-[20px] bg-grad-main text-white font-semibold text-sm
            hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(108,99,255,0.4)] transition-all"
        >
          + Novo Serviço
        </button>
      </div>

      {loading && <p className="text-text-muted">Carregando...</p>}
      {error   && <p className="text-red-400">{error}</p>}

      {!loading && !error && services.length === 0 && (
        <p className="text-text-muted">Nenhum serviço cadastrado ainda.</p>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-2 mb-8">
        {services.map(s => (
          <div key={s.id}
            className="flex items-center justify-between bg-bg-card border border-[rgba(255,255,255,0.07)]
              rounded-md px-5 py-4 hover:border-[rgba(108,99,255,0.35)] transition-all">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-sm">{s.title}</h3>
                {s.highlight && (
                  <span className="text-xs bg-grad-main text-white px-2 py-0.5 rounded-xl">Popular</span>
                )}
                {!s.active && (
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-xl">Inativo</span>
                )}
              </div>
              <span className="text-xs text-accent">{s.price}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => openEdit(s)} className="text-xs text-accent hover:underline">
                Editar
              </button>
              <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:underline">
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulário */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-bg-card border border-[rgba(255,255,255,0.07)] rounded-lg p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-head text-xl font-bold mb-6">
              {isNew ? 'Novo Serviço' : 'Editar Serviço'}
            </h2>

            <div className="flex flex-col gap-4">

              {/* Ícone */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Ícone</label>
                <select
                  value={editing.icon}
                  onChange={e => setEditing(prev => prev ? { ...prev, icon: e.target.value } : prev)}
                  className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                    text-text-primary text-sm outline-none focus:border-accent transition-all"
                >
                  {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Título */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Título</label>
                <input
                  type="text" value={editing.title}
                  onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
                  className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                    text-text-primary text-sm outline-none focus:border-accent transition-all"
                />
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Descrição</label>
                <textarea
                  rows={3} value={editing.description}
                  onChange={e => setEditing(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                    text-text-primary text-sm outline-none focus:border-accent transition-all resize-y"
                />
              </div>

              {/* Itens */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">
                  Itens inclusos <span className="text-text-muted">(um por linha)</span>
                </label>
                <textarea
                  rows={3}
                  value={editing.items.join('\n')}
                  onChange={e => setEditing(prev => prev
                    ? { ...prev, items: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }
                    : prev
                  )}
                  className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                    text-text-primary text-sm outline-none focus:border-accent transition-all resize-y"
                />
              </div>

              {/* Preço */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Preço</label>
                <input
                  type="text" value={editing.price}
                  placeholder="Ex: A partir de R$ 200"
                  onChange={e => setEditing(prev => prev ? { ...prev, price: e.target.value } : prev)}
                  className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-md px-4 py-3
                    text-text-primary text-sm outline-none focus:border-accent transition-all"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox" checked={editing.highlight}
                    onChange={e => setEditing(prev => prev ? { ...prev, highlight: e.target.checked } : prev)}
                    className="accent-accent"
                  />
                  Destacar como Popular
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox" checked={editing.active}
                    onChange={e => setEditing(prev => prev ? { ...prev, active: e.target.checked } : prev)}
                    className="accent-accent"
                  />
                  Ativo (visível no portfólio)
                </label>
              </div>

            </div>

            {feedback && (
              <p className="mt-4 text-sm text-red-400">{feedback}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-[20px] bg-grad-main text-white font-semibold text-sm
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={closeForm}
                className="px-6 py-3 rounded-[20px] border border-[rgba(255,255,255,0.07)]
                  text-text-secondary text-sm hover:border-[rgba(255,255,255,0.2)] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
