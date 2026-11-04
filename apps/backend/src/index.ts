import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { prettyJSON } from 'hono/pretty-json'
import { compress } from 'hono/compress'
import { requestId } from 'hono/request-id'
import { rateLimiter } from 'hono-rate-limiter'

import { app as v1, mountDocs } from './openapi'
import { env } from './env'
import { getObject } from './lib/storage'

const root = new Hono()

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

root.use(requestId())
root.use(logger())
root.use('*', prettyJSON())
root.use('*', compress())

// Public read-only proxy for media stored in private Cloudflare R2 bucket
root.get('/v1/storage/public/:folder/:filename', async (c) => {
  const folder = c.req.param('folder')
  const filename = c.req.param('filename')
  if (!/^\d{6}$/.test(folder) || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return c.json({ error: 'invalid file key' }, 400)
  }
  const key = `${folder}/${filename}`
  try {
    const obj = await getObject(key)
    if (!obj.Body) return c.json({ error: 'file not found' }, 404)
    const bytes = await obj.Body.transformToByteArray()
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': obj.ContentType || 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
        ...(obj.ETag ? { ETag: obj.ETag } : {}),
      },
    })
  } catch {
    return c.json({ error: 'file not found' }, 404)
  }
})

root.use(
  '/v1/*',
  cors({
    origin: (origin) => {
      if (!origin) return '*'
      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
  }),
)
root.use(secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }))
root.use(
  '/v1/*',
  rateLimiter({
    windowMs: 60_000,
    limit: 100,
    standardHeaders: 'draft-6',
    keyGenerator: (c) =>
      c.req.header('x-forwarded-for') ??
      c.req.header('x-real-ip') ??
      'anonymous',
  }),
)

mountDocs(root)

root.route('/v1', v1)

root.notFound((c) => c.json({ error: 'not found' }, 404))
root.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'internal server error' }, 500)
})

export default {
  port: env.PORT,
  fetch: root.fetch,
  reusePort: true,
}
