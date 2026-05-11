/**
 * projectService.ts
 * Lê de /public/data/projects.json via fs (Server Components).
 * FASE 6: substituir por chamada à API REST.
 */

import type { Project } from '@hub-art/types'
import { MemoryCache } from '@/lib/cache'
import path from 'path'
import fs   from 'fs/promises'

interface ProjectsJson { projects: Project[] }

const cache = new MemoryCache<Project[]>(60_000)
const CACHE_KEY = 'projects'

async function fetchProjects(): Promise<Project[]> {
  const cached = cache.get(CACHE_KEY)
  if (cached) return cached

  const filePath = path.join(process.cwd(), 'public', 'data', 'projects.json')
  const raw  = await fs.readFile(filePath, 'utf-8')
  const json = JSON.parse(raw) as ProjectsJson
  cache.set(CACHE_KEY, json.projects)
  return json.projects
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
