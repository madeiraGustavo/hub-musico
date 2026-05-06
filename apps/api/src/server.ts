import { buildApp } from './app.js'
import { env } from './env.js'

async function start(): Promise<void> {
  const app = await buildApp()

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
