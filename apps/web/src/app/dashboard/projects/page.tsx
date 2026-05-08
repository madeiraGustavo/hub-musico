'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api/client'

interface Project {
  id: string
  title: string
  platform: string
  tags: string[]
  featured: boolean
  status: string
  createdAt: string
}

interface ProjectsResponse {
  data?: Project[]
  error?: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    apiGet<ProjectsResponse>('/dashboard/projects')
      .then((d) => {
        if (d.error) setError(d.error)
        else setProjects(d.data ?? [])
      })
      .catch(() => setError('Erro ao carregar projetos'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-head text-3xl font-bold">Projetos</h1>
        <a href="/dashboard/projects/new"
          className="px-5 py-2.5 rounded-[20px] bg-grad-main text-white font-semibold text-sm
            hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(108,99,255,0.4)] transition-all">
          + Novo Projeto
        </a>
      </div>

      {loading && <p className="text-text-muted">Carregando...</p>}
      {error   && <p className="text-red-400">{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="text-text-muted">Nenhum projeto cadastrado ainda.</p>
      )}

      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {projects.map(project => (
          <div key={project.id}
            className="bg-bg-card border border-[rgba(255,255,255,0.07)] rounded-lg p-5
              hover:border-[rgba(108,99,255,0.35)] transition-all">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-head font-bold">{project.title}</h3>
              {project.featured && (
                <span className="text-xs bg-grad-main text-white px-2 py-0.5 rounded-xl">Destaque</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-accent uppercase tracking-wider">{project.platform}</span>
              <span className={`text-xs px-2 py-0.5 rounded-xl ${project.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                {project.status}
              </span>
            </div>
            <a href={`/dashboard/projects/${project.id}`}
              className="text-xs text-accent hover:underline">Editar</a>
          </div>
        ))}
      </div>
    </div>
  )
}
