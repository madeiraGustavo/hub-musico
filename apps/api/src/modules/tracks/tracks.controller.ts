import type { FastifyRequest, FastifyReply } from 'fastify'

export async function getTracksHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
export async function createTrackHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
export async function updateTrackHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
export async function deleteTrackHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
