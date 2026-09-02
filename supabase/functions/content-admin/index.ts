import { HttpError, assertSameOrigin, corsHeaders, json, readJsonBody } from '../_shared/http.ts'
import { audit, enforceRateLimit, isCommunityAdmin, isOrganizationEditor, isPlatformAdmin, requireActor, requireAal2WhenEnabled } from '../_shared/auth.ts'

const kinds = new Set(['Duyuru', 'Etkinlik', 'Haber', 'Topluluk'])

function httpsUrl(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:') throw new Error()
    return u.toString()
  } catch { throw new HttpError(400, 'Kaynak bağlantısı geçerli bir HTTPS adresi olmalıdır.') }
}


function optionalEmail(value: unknown) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return null
  if (raw.length > 160 || !/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$/.test(raw)) {
    throw new HttpError(400, 'İletişim e-postası geçerli değil.')
  }
  return raw
}

function optionalText(value: unknown, max: number) {
  const s = String(value || '').trim()
  if (!s) return null
  if (s.length > max) throw new HttpError(400, `Metin en fazla ${max} karakter olabilir.`)
  return s
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') { try { assertSameOrigin(req); return new Response('ok', { headers: corsHeaders(req) }) } catch { return new Response(null,{status:403}) } }
  if (req.method !== 'POST') return json(req, { error: 'Yalnızca POST desteklenir.' }, 405)

  try {
    assertSameOrigin(req)
    const { actor, admin, assuranceLevel } = await requireActor(req)
    const body = await readJsonBody(req)
    const operation = String(body.operation || 'create')
    const platform = await isPlatformAdmin(admin, actor.id)
    await enforceRateLimit(admin, actor.id, `content-admin:${operation}`, operation==='create'?20:40, 600)
    requireAal2WhenEnabled(assuranceLevel)

    if (operation === 'create') {
      const scopeType = String(body.scopeType || '')
      const scopeValue = String(body.scopeValue || '').trim()
      const kind = String(body.kind || 'Duyuru')
      const title = String(body.title || '').trim()
      const summary = optionalText(body.summary, 1200)
      const location = optionalText(body.location, 160)
      const sourceUrl = httpsUrl(body.url)
      if (!kinds.has(kind)) throw new HttpError(400, 'Geçersiz içerik türü.')
      if (title.length < 4 || title.length > 160) throw new HttpError(400, 'Başlık 4-160 karakter olmalıdır.')

      let eventStart: string | null = null
      if (body.eventStart) {
        const d = new Date(String(body.eventStart))
        if (!Number.isFinite(d.getTime())) throw new HttpError(400, 'Etkinlik tarihi geçersiz.')
        eventStart = d.toISOString()
      }

      let sourceType = 'nevgenc'
      let sourceName = 'NevGenç'
      let communityId: string | null = null
      let organizationId: string | null = null

      if (scopeType === 'community') {
        const { data: community } = await admin.from('communities').select('id,name').eq('slug', scopeValue).eq('is_active', true).maybeSingle()
        if (!community) throw new HttpError(404, 'Topluluk bulunamadı.')
        if (!platform && !(await isCommunityAdmin(admin, actor.id, community.id))) throw new HttpError(403, 'Bu topluluk adına yayın yetkin yok.')
        communityId = community.id; sourceType = 'community'; sourceName = community.name
      } else if (scopeType === 'organization') {
        const { data: org } = await admin.from('organizations').select('id,name,type').eq('slug', scopeValue).eq('is_active', true).maybeSingle()
        if (!org) throw new HttpError(404, 'Kurum bulunamadı.')
        if (!platform && !(await isOrganizationEditor(admin, actor.id, org.id))) throw new HttpError(403, 'Bu kurum adına yayın yetkin yok.')
        organizationId = org.id; sourceType = org.type; sourceName = org.name
      } else if (scopeType === 'platform') {
        if (!platform) throw new HttpError(403, 'Platform yayını için platform yöneticisi olmalısın.')
      } else throw new HttpError(400, 'Geçersiz yayın kapsamı.')

      const slug = `content-${crypto.randomUUID()}`
      const { data, error } = await admin.from('announcements').insert({
        slug, kind, source_type: sourceType, source_name: sourceName,
        community_id: communityId, organization_id: organizationId,
        title, summary, published_at: new Date().toISOString(), event_start: eventStart,
        location, is_event: kind === 'Etkinlik' || Boolean(eventStart), is_pinned: false,
        url: sourceUrl, source_url: sourceUrl, verified_at: new Date().toISOString(),
        is_published: true, created_by: actor.id, updated_by: actor.id,
      }).select('id,slug').single()
      if (error || !data) throw new HttpError(400, 'İçerik yayımlanamadı.')
      await audit(admin, actor.id, 'announcement_created', 'announcement', data.id, { scope_type: scopeType, scope_value: scopeValue })
      return json(req, { ok: true, id: data.id, slug: data.slug })
    }

    if (operation === 'update_community_profile') {
      const communitySlug = String(body.communitySlug || '').trim()
      if (!/^[a-z0-9-]{2,100}$/.test(communitySlug)) throw new HttpError(400, 'Geçersiz topluluk.')
      const { data: community } = await admin.from('communities').select('id,name').eq('slug', communitySlug).eq('is_active', true).maybeSingle()
      if (!community) throw new HttpError(404, 'Topluluk bulunamadı.')
      if (!platform && !(await isCommunityAdmin(admin, actor.id, community.id))) throw new HttpError(403, 'Bu topluluğu düzenleme yetkin yok.')

      const description = optionalText(body.description, 3000)
      const contactEmail = optionalEmail(body.contactEmail)
      const { error } = await admin.from('communities').update({
        description,
        contact_email: contactEmail,
        updated_at: new Date().toISOString(),
      }).eq('id', community.id)
      if (error) throw new HttpError(400, 'Topluluk bilgileri güncellenemedi.')
      await audit(admin, actor.id, 'community_profile_updated', 'community', community.id, { contact_email_set: Boolean(contactEmail) })
      return json(req, { ok: true })
    }

    if (operation === 'update_organization_profile') {
      const organizationSlug = String(body.organizationSlug || '').trim()
      if (!/^[a-z0-9-]{2,100}$/.test(organizationSlug)) throw new HttpError(400, 'Geçersiz kurum.')
      const { data: organization } = await admin.from('organizations').select('id,name').eq('slug', organizationSlug).eq('is_active', true).maybeSingle()
      if (!organization) throw new HttpError(404, 'Kurum bulunamadı.')
      if (!platform && !(await isOrganizationEditor(admin, actor.id, organization.id))) throw new HttpError(403, 'Bu kurumun iletişim bilgisini düzenleme yetkin yok.')
      const contactEmail = optionalEmail(body.contactEmail)
      const { error } = await admin.from('organizations').update({ contact_email: contactEmail }).eq('id', organization.id)
      if (error) throw new HttpError(400, 'Kurum iletişim bilgisi güncellenemedi.')
      await audit(admin, actor.id, 'organization_profile_updated', 'organization', organization.id, { contact_email_set: Boolean(contactEmail) })
      return json(req, { ok: true })
    }


    if (operation === 'unpublish') {
      const id = String(body.announcementId || '')
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'Geçersiz içerik kimliği.')
      const { data: announcement } = await admin.from('announcements').select('id,community_id,organization_id').eq('id', id).maybeSingle()
      if (!announcement) throw new HttpError(404, 'İçerik bulunamadı.')
      let allowed = platform
      if (!allowed && announcement.community_id) allowed = await isCommunityAdmin(admin, actor.id, announcement.community_id)
      if (!allowed && announcement.organization_id) allowed = await isOrganizationEditor(admin, actor.id, announcement.organization_id)
      if (!allowed) throw new HttpError(403, 'Bu içeriği yönetme yetkin yok.')
      const { error } = await admin.from('announcements').update({ is_published: false, updated_by: actor.id, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw new HttpError(400, 'İçerik yayından kaldırılamadı.')
      await audit(admin, actor.id, 'announcement_unpublished', 'announcement', id)
      return json(req, { ok: true })
    }

    throw new HttpError(400, 'Desteklenmeyen işlem.')
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    if (status >= 500) console.error(JSON.stringify({event:'content_admin_failure',status}))
    const message=status>=500?'Sunucu işlemi tamamlayamadı.':(error instanceof Error?error.message:'İşlem tamamlanamadı.')
    return json(req, { error: message }, status)
  }
})
