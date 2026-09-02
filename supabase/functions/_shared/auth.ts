import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.112.4'
import { HttpError } from './http.ts'

export type Context = { actor: User; admin: SupabaseClient; token: string; assuranceLevel: string | null }

function tokenPayload(token: string): Record<string,unknown> {
  try {
    const part=token.split('.')[1]
    if(!part) return {}
    const normalized=part.replace(/-/g,'+').replace(/_/g,'/')
    const padded=normalized + '='.repeat((4-normalized.length%4)%4)
    return JSON.parse(atob(padded))
  } catch { return {} }
}

export async function requireActor(req: Request): Promise<Context> {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) throw new HttpError(500, 'Sunucu yapılandırması eksik.')

  const auth = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token || token.length > 8192) throw new HttpError(401, 'Oturum gerekli.')

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-NevGenc-Function': '1' } },
  })

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Oturum doğrulanamadı.')
  const payload=tokenPayload(token)
  return { actor: data.user, admin, token, assuranceLevel: typeof payload.aal==='string'?payload.aal:null }
}

export async function enforceRateLimit(admin: SupabaseClient, userId: string, scope: string, limit: number, windowSeconds: number) {
  const { data, error } = await admin.rpc('security_rate_limit_check', {
    p_user_id:userId, p_scope:scope, p_limit:limit, p_window_seconds:windowSeconds,
  })
  if (error) throw new HttpError(503, 'Güvenlik kontrolü geçici olarak kullanılamıyor.')
  if (data !== true) throw new HttpError(429, 'Çok fazla işlem denendi. Bir süre sonra tekrar dene.')
}

export function requireAal2WhenEnabled(assuranceLevel: string | null) {
  const configured=(Deno.env.get('REQUIRE_ADMIN_AAL2') ?? 'true').toLowerCase()
  if (configured !== 'false' && assuranceLevel !== 'aal2') {
    throw new HttpError(403, 'Bu yönetici işlemi için iki aşamalı doğrulama gerekli.')
  }
}

export async function isPrivilegedActor(admin: SupabaseClient, userId: string) {
  if (await isPlatformAdmin(admin,userId)) return true
  const [community,organization]=await Promise.all([
    admin.from('community_admins').select('user_id',{count:'exact',head:true}).eq('user_id',userId),
    admin.from('organization_editors').select('user_id',{count:'exact',head:true}).eq('user_id',userId),
  ])
  if(community.error||organization.error) throw new HttpError(500,'Rol bilgisi doğrulanamadı.')
  return (community.count||0)>0 || (organization.count||0)>0
}

export async function isPlatformAdmin(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from('platform_admins').select('user_id').eq('user_id', userId).maybeSingle()
  if (error) throw new HttpError(500, 'Rol bilgisi doğrulanamadı.')
  return Boolean(data)
}

export async function isCommunityAdmin(admin: SupabaseClient, userId: string, communityId: string) {
  const { data, error } = await admin.from('community_admins').select('user_id')
    .eq('user_id', userId).eq('community_id', communityId).maybeSingle()
  if (error) throw new HttpError(500, 'Rol bilgisi doğrulanamadı.')
  return Boolean(data)
}

export async function isOrganizationEditor(admin: SupabaseClient, userId: string, organizationId: string) {
  const { data, error } = await admin.from('organization_editors').select('user_id')
    .eq('user_id', userId).eq('organization_id', organizationId).maybeSingle()
  if (error) throw new HttpError(500, 'Rol bilgisi doğrulanamadı.')
  return Boolean(data)
}

export async function findUserByEmail(admin: SupabaseClient, email: string) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$/.test(normalized) || normalized.length > 160) {
    throw new HttpError(400, 'Geçerli bir e-posta adresi gir.')
  }
  const { data, error } = await admin.from('profiles').select('id,email_lower').eq('email_lower', normalized).maybeSingle()
  if (error) throw new HttpError(500, 'Kullanıcı aranamadı.')
  if (!data) throw new HttpError(404, 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.')
  return data
}

export async function audit(admin: SupabaseClient, actorId: string, action: string, entityType: string, entityId?: string | null, metadata: Record<string, unknown> = {}) {
  const safeMetadata=Object.fromEntries(Object.entries(metadata).filter(([k])=>!/(token|password|secret|email)/i.test(k)))
  const { error } = await admin.from('content_audit_log').insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId || null, metadata:safeMetadata })
  if (error) console.error(JSON.stringify({event:'audit_write_failed',action,entityType}))
}
