const DEFAULT_ORIGIN = 'https://denizemiryildiz6-arch.github.io'

function configuredOrigins() {
  return (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ORIGIN)
    .split(',').map((x) => x.trim()).filter(Boolean)
}

export function isAllowedOrigin(req: Request) {
  const origin = req.headers.get('origin') || ''
  return Boolean(origin && configuredOrigins().includes(origin))
}

export function corsHeaders(req: Request) {
  const headers: Record<string,string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
  const origin=req.headers.get('origin')||''
  if(origin && configuredOrigins().includes(origin)) headers['Access-Control-Allow-Origin']=origin
  return headers
}

export function securityHeaders(requestId?: string) {
  const headers: Record<string,string> = {
    'Cache-Control': 'no-store, max-age=0',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Resource-Policy': 'same-site',
  }
  if(requestId) headers['X-Request-ID']=requestId
  return headers
}

export function json(req: Request, body: unknown, status = 200) {
  const requestId=req.headers.get('x-request-id')?.slice(0,80)||crypto.randomUUID()
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      ...securityHeaders(requestId),
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

export function assertSameOrigin(req: Request) {
  if (!isAllowedOrigin(req)) throw new HttpError(403, 'İstek kaynağı kabul edilmiyor.')
}

export async function readJsonBody(req: Request, maxBytes = 32_768) {
  const contentType=(req.headers.get('content-type')||'').toLowerCase()
  if(!contentType.startsWith('application/json')) throw new HttpError(415,'İstek içeriği JSON olmalıdır.')
  const declared=Number(req.headers.get('content-length')||0)
  if (Number.isFinite(declared) && declared > maxBytes) throw new HttpError(413, 'İstek gövdesi çok büyük.')
  const raw=await req.text()
  const bytes=new TextEncoder().encode(raw).byteLength
  if(bytes>maxBytes) throw new HttpError(413, 'İstek gövdesi çok büyük.')
  if(!raw) return {} as Record<string,unknown>
  try {
    const parsed=JSON.parse(raw)
    if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw new Error()
    return parsed as Record<string,unknown>
  } catch {
    throw new HttpError(400, 'Geçersiz istek.')
  }
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
