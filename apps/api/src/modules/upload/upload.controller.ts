import type { FastifyRequest, FastifyReply } from 'fastify'

// TODO Fase 2: implementar POST /upload
export async function uploadHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
