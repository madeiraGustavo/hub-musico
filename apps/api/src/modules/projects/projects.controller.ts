import type { FastifyRequest, FastifyReply } from 'fastify'

export async function getProjectsHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
export async function createProjectHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ error: 'Not Implemented' })
}
