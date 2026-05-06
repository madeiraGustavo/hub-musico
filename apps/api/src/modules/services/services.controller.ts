import type { FastifyRequest, FastifyReply } from 'fastify'

export async function getServicesHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
export async function createServiceHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
export async function updateServiceHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
export async function deleteServiceHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
