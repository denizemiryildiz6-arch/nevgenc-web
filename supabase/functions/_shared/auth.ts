import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'
import { HttpError } from './http.ts'

export type Context = {
  actor: User
  admin: SupabaseClient
}

export async function requireActor(req: Request): Promise<Context> {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) throw new HttpError(500, 'Sunucu yapılandırması eksik.')

  const auth = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw new HttpError(401, 'Oturum gerekli.')

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-NevGenc-Function': '1' } },
  })

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Oturum doğrulanamadı.')
  return { actor: data.user, admin }
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
  const { error } = await admin.from('content_audit_log').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    metadata,
  })
  if (error) console.error('audit-log-failed', error.message)
}
