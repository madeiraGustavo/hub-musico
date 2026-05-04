/**
 * projectService.ts
 * Lê de /public/data/projects.json via fs (Server Components).
 * FASE 6: substituir por chamada à API REST.
 */

import type { Project } from '@hub-musico/types'
import path from 'path'
import fs   from 'fs/promises'

interface ProjectsJson {
  projects: Project[]
}

let cache: Project[] | null = null

async function fetchProjects(): Promise<Project[]> {
  if (cache) return cache

  const filePath = path.join(process.cwd(), 'public', 'data', 'projects.json')
  const raw  = await fs.readFile(filePath, 'utf-8')
  const json = JSON.parse(raw) as ProjectsJson
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
