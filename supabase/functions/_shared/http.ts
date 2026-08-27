const DEFAULT_ORIGIN = 'https://denizemiryildiz6-arch.github.io'

export function allowedOrigin(req: Request) {
  const origin = req.headers.get('origin') || ''
  const configured = (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ORIGIN)
    .split(',').map((x) => x.trim()).filter(Boolean)
  return configured.includes(origin) ? origin : configured[0]
}

export function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': allowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

export function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) return
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ORIGIN)
    .split(',').map((x) => x.trim()).filter(Boolean)
  if (!allowed.includes(origin)) throw new HttpError(403, 'Bu kaynak için istek kabul edilmiyor.')
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
