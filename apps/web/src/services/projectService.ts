/**
 * projectService.ts
 *
 * Camada de acesso a dados de projetos.
 * Componentes React NUNCA importam dados diretamente — sempre via este serviço.
 *
 * Hoje: lê de /public/data/projects.json
 * FASE 3: substituir fetch por chamada à API REST sem alterar os componentes.
 */

import type { Project } from '@hub-musico/types'

interface ProjectsJson {
  projects: Project[]
}

let cache: Project[] | null = null

async function fetchProjects(): Promise<Project[]> {
  if (cache) return cache

  const res = await fetch('/data/projects.json', { cache: 'force-cache' })

  if (!res.ok) {
    throw new Error(`projectService: falha ao carregar dados (${res.status})`)
  }

  const json: ProjectsJson = await res.json() as ProjectsJson
  cache = json.projects
  return cache
}

export async function getProjects(): Promise<Project[]> {
  return fetchProjects()
}

export async function getFeaturedProject(): Promise<Project | undefined> {
  const projects = await fetchProjects()
  return projects.find(p => p.featured)
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const projects = await fetchProjects()
  return projects.find(p => p.id === id)
}
