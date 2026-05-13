import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import {
  createCategoryHandler,
  listCategoriesHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  listPublicCategoriesHandler,
} from './marketplace-categories.controller.js'

export async function marketplaceCategoriesRoutes(fastify: FastifyInstance): Promise<void> {
  // Private (authenticated)
  fastify.post('/dashboard/marketplace/categories', { preHandler: authenticate }, createCategoryHandler)
  fastify.get('/dashboard/marketplace/categories', { preHandler: authenticate }, listCategoriesHandler)
  fastify.patch('/dashboard/marketplace/categories/:id', { preHandler: authenticate }, updateCategoryHandler as RouteHandlerMethod)
  fastify.delete('/dashboard/marketplace/categories/:id', { preHandler: authenticate }, deleteCategoryHandler as RouteHandlerMethod)

  // Public
  fastify.get('/marketplace/categories', listPublicCategoriesHandler)
}
