import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import {
  createProductHandler,
  listProductsHandler,
  getProductHandler,
  updateProductHandler,
  deleteProductHandler,
  listPublicProductsHandler,
  getPublicProductHandler,
} from './marketplace-products.controller.js'
import {
  uploadImageHandler,
  reorderImagesHandler,
  deleteImageHandler,
} from './marketplace-products.images.controller.js'

export async function marketplaceProductsRoutes(fastify: FastifyInstance): Promise<void> {
  // Private (authenticated)
  fastify.post('/dashboard/marketplace/products', { preHandler: authenticate }, createProductHandler)
  fastify.get('/dashboard/marketplace/products', { preHandler: authenticate }, listProductsHandler)
  fastify.get('/dashboard/marketplace/products/:id', { preHandler: authenticate }, getProductHandler as RouteHandlerMethod)
  fastify.patch('/dashboard/marketplace/products/:id', { preHandler: authenticate }, updateProductHandler as RouteHandlerMethod)
  fastify.delete('/dashboard/marketplace/products/:id', { preHandler: authenticate }, deleteProductHandler as RouteHandlerMethod)

  // Image endpoints (authenticated)
  fastify.post('/dashboard/marketplace/products/:id/images', { preHandler: authenticate }, uploadImageHandler as RouteHandlerMethod)
  fastify.patch('/dashboard/marketplace/products/:id/images/reorder', { preHandler: authenticate }, reorderImagesHandler as RouteHandlerMethod)
  fastify.delete('/dashboard/marketplace/products/:id/images/:imageId', { preHandler: authenticate }, deleteImageHandler as RouteHandlerMethod)

  // Public
  fastify.get('/marketplace/products', listPublicProductsHandler)
  fastify.get('/marketplace/products/:slug', getPublicProductHandler as RouteHandlerMethod)
}
