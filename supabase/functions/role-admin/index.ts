import { HttpError, assertSameOrigin, corsHeaders, json, readJsonBody } from '../_shared/http.ts'
import { audit, enforceRateLimit, findUserByEmail, isCommunityAdmin, isPlatformAdmin, requireActor, requireAal2WhenEnabled } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') { try { assertSameOrigin(req); return new Response('ok', { headers: corsHeaders(req) }) } catch { return new Response(null,{status:403}) } }
  if (req.method !== 'POST') return json(req, { error: 'Yalnızca POST desteklenir.' }, 405)

  try {
    assertSameOrigin(req)
    const { actor, admin, assuranceLevel } = await requireActor(req)
    const body = await readJsonBody(req, 16_384)
    const operation = String(body.operation || '')
    const actorIsPlatform = await isPlatformAdmin(admin, actor.id)
    await enforceRateLimit(admin, actor.id, `role-admin:${operation}`, 10, 600)
    requireAal2WhenEnabled(assuranceLevel)

    if (operation === 'assign_community_admin') {
      const slug = String(body.communitySlug || '').trim()
      if (!/^[a-z0-9-]{2,100}$/.test(slug)) throw new HttpError(400, 'Geçersiz topluluk.')
      const { data: community, error } = await admin.from('communities').select('id,name,slug').eq('slug', slug).eq('is_active', true).maybeSingle()
      if (error || !community) throw new HttpError(404, 'Topluluk bulunamadı.')
      if (!actorIsPlatform && !(await isCommunityAdmin(admin, actor.id, community.id))) throw new HttpError(403, 'Bu topluluk için yönetici atama yetkin yok.')
      const target = await findUserByEmail(admin, String(body.targetEmail || ''))
      const { error: insertError } = await admin.from('community_admins').upsert({ community_id: community.id, user_id: target.id, added_by: actor.id }, { onConflict: 'community_id,user_id', ignoreDuplicates: true })
      if (insertError) throw new HttpError(400, insertError.message.includes('en fazla 4') ? 'Bir toplulukta en fazla 4 yönetici olabilir.' : 'Yönetici atanamadı.')
      await audit(admin, actor.id, 'community_admin_assigned', 'community', community.id, { target_user_id: target.id })
      return json(req, { ok: true, community: community.name })
    }

    if (operation === 'remove_community_admin') {
      if (!actorIsPlatform) throw new HttpError(403, 'Yönetici kaldırma işlemi platform yöneticisi gerektirir.')
      const slug = String(body.communitySlug || '').trim()
      const { data: community } = await admin.from('communities').select('id,name').eq('slug', slug).maybeSingle()
      if (!community) throw new HttpError(404, 'Topluluk bulunamadı.')
      const target = await findUserByEmail(admin, String(body.targetEmail || ''))
      const { count } = await admin.from('community_admins').select('*', { count: 'exact', head: true }).eq('community_id', community.id)
      if ((count || 0) <= 1) throw new HttpError(400, 'Topluluk en az bir yöneticiye sahip olmalıdır.')
      const { error } = await admin.from('community_admins').delete().eq('community_id', community.id).eq('user_id', target.id)
      if (error) throw new HttpError(400, 'Yönetici kaldırılamadı.')
      await audit(admin, actor.id, 'community_admin_removed', 'community', community.id, { target_user_id: target.id })
      return json(req, { ok: true })
    }

    if (operation === 'assign_platform_admin') {
      if (!actorIsPlatform) throw new HttpError(403, 'Bu işlem yalnızca platform yöneticilerine açıktır.')
      const target = await findUserByEmail(admin, String(body.targetEmail || ''))
      const { error } = await admin.from('platform_admins').upsert({ user_id: target.id, added_by: actor.id }, { onConflict: 'user_id', ignoreDuplicates: true })
      if (error) throw new HttpError(400, error.message.includes('limiti 4') ? 'Platform yöneticisi limiti 4 kişidir.' : 'Platform yöneticisi atanamadı.')
      await audit(admin, actor.id, 'platform_admin_assigned', 'user', target.id)
      return json(req, { ok: true })
    }

    if (operation === 'assign_organization_editor') {
      if (!actorIsPlatform) throw new HttpError(403, 'Bu işlem yalnızca platform yöneticilerine açıktır.')
      const orgSlug = String(body.organizationSlug || '').trim()
      if (!/^[a-z0-9-]{2,100}$/.test(orgSlug)) throw new HttpError(400, 'Geçersiz kurum.')
      const { data: organization } = await admin.from('organizations').select('id,name').eq('slug', orgSlug).eq('is_active', true).maybeSingle()
      if (!organization) throw new HttpError(404, 'Kurum bulunamadı.')
      const target = await findUserByEmail(admin, String(body.targetEmail || ''))
      const { error } = await admin.from('organization_editors').upsert({ organization_id: organization.id, user_id: target.id, added_by: actor.id }, { onConflict: 'organization_id,user_id', ignoreDuplicates: true })
      if (error) throw new HttpError(400, 'Kurum editörü atanamadı.')
      await audit(admin, actor.id, 'organization_editor_assigned', 'organization', organization.id, { target_user_id: target.id })
      return json(req, { ok: true, organization: organization.name })
    }

    throw new HttpError(400, 'Desteklenmeyen işlem.')
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    if (status >= 500) console.error(JSON.stringify({event:'role_admin_failure',status}))
    const message=status>=500?'Sunucu işlemi tamamlayamadı.':(error instanceof Error?error.message:'İşlem tamamlanamadı.')
    return json(req, { error: message }, status)
  }
})
