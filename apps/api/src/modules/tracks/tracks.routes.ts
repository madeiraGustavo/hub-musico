import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import { getTracksHandler, createTrackHandler, updateTrackHandler, deleteTrackHandler } from './tracks.controller.js'

export async function tracksRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/dashboard/tracks',        { preHandler: authenticate }, getTracksHandler)
  fastify.post('/dashboard/tracks',       { preHandler: authenticate }, createTrackHandler)
  fastify.patch('/dashboard/tracks/:id',  { preHandler: authenticate }, updateTrackHandler)
  fastify.delete('/dashboard/tracks/:id', { preHandler: authenticate }, deleteTrackHandler)
}
