import type { FastifyRequest, FastifyReply } from 'fastify'

// TODO Fase 2: implementar GET /dashboard/profile
export async function getProfileHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}

// TODO Fase 2: implementar PATCH /dashboard/profile
export async function updateProfileHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
