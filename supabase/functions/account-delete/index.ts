import { HttpError, assertSameOrigin, corsHeaders, json, readJsonBody } from '../_shared/http.ts'
import { audit, enforceRateLimit, isPlatformAdmin, isPrivilegedActor, requireActor, requireAal2WhenEnabled } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') { try { assertSameOrigin(req); return new Response('ok',{headers:corsHeaders(req)}) } catch { return new Response(null,{status:403}) } }
  if (req.method !== 'POST') return json(req,{error:'Yalnızca POST desteklenir.'},405)
  try {
    assertSameOrigin(req)
    const {actor,admin,assuranceLevel}=await requireActor(req)
    await enforceRateLimit(admin,actor.id,'account-delete',3,3600)
    const body=await readJsonBody(req,4096)
    if(String(body.confirmation||'')!=='HESABIMI SİL') throw new HttpError(400,'Silme onayı geçersiz.')
    const emailConfirmation=String(body.emailConfirmation||'').trim().toLowerCase()
    if(!actor.email || emailConfirmation!==actor.email.toLowerCase()) throw new HttpError(400,'Hesap e-postası doğrulanamadı.')
    if(await isPrivilegedActor(admin,actor.id)) requireAal2WhenEnabled(assuranceLevel)

    if(await isPlatformAdmin(admin,actor.id)) {
      const {count}=await admin.from('platform_admins').select('*',{count:'exact',head:true})
      if((count||0)<=1) throw new HttpError(409,'Son platform yöneticisi hesabı silinemez. Önce başka bir platform yöneticisi ata.')
    }

    const {data:memberships,error:membershipError}=await admin.from('community_admins').select('community_id').eq('user_id',actor.id)
    if(membershipError) throw new HttpError(500,'Yetki kontrolü tamamlanamadı.')
    for(const row of memberships||[]) {
      const {count}=await admin.from('community_admins').select('*',{count:'exact',head:true}).eq('community_id',row.community_id)
      if((count||0)<=1) throw new HttpError(409,'Yönettiğin bir topluluğun tek yöneticisisin. Hesabı silmeden önce başka bir yönetici ata.')
    }

    await audit(admin,actor.id,'account_delete_requested','user',actor.id)
    const {error}=await admin.auth.admin.deleteUser(actor.id,false)
    if(error) throw new HttpError(500,'Hesap silinemedi.')
    return json(req,{ok:true})
  } catch(error) {
    const status=error instanceof HttpError?error.status:500
    if(status>=500) console.error(JSON.stringify({event:'account_delete_failure',status}))
    const message=status>=500?'Sunucu işlemi tamamlayamadı.':(error instanceof Error?error.message:'İşlem tamamlanamadı.')
    return json(req,{error:message},status)
  }
})
