window.NevGenc = window.NevGenc || {};
NevGenc.repositories = (() => {
  const seed=NevGenc.seed;
  const official=data=>({data,source:'official'});
  const fallbackLocation=key=>seed.locations.find(x=>x.slug===key||x.id===key)||null;

  async function fromTable(table,queryBuilder,fallback=[]){
    const c=NevGenc.supabase.getClient();if(!c)return official(fallback);
    try{let q=c.from(table).select('*');if(queryBuilder)q=queryBuilder(q);const {data,error}=await q;if(error)throw error;return data?.length?{data,source:'supabase'}:official(fallback)}
    catch(_err){return official(fallback)}
  }
  function normalizeCommunity(x){return {...x,dbId:x.id||null,id:x.slug||x.id,slug:x.slug||x.id,socialUrl:x.instagram_url||x.x_url||x.linkedin_url||x.socialUrl||null,instagramUrl:x.instagram_url||x.instagramUrl||null,xUrl:x.x_url||x.xUrl||null,sourceUrl:x.source_url||x.sourceUrl||NevGenc.config.sources.communities,verifiedAt:x.verified_at||x.verifiedAt||null}}
  function normalizeLocation(x){const key=x.slug||x.id,fb=fallbackLocation(key);return {...fb,...x,id:key,dbId:x.id||null,lat:x.latitude??x.lat??fb?.lat??null,lng:x.longitude??x.lng??fb?.lng??null,sourceUrl:x.source_url||x.sourceUrl||fb?.sourceUrl||null,verifiedAt:x.verified_at||x.verifiedAt||fb?.verifiedAt||null}}
  function normalizePartner(x){const key=x.slug||x.id,fb=fallbackLocation(key);return {...fb,...x,id:key,dbId:x.id||null,type:'partner',lat:x.latitude??x.lat??fb?.lat??null,lng:x.longitude??x.lng??fb?.lng??null,sourceUrl:x.source_url||x.sourceUrl||fb?.sourceUrl||null,websiteUrl:x.website_url||x.websiteUrl||fb?.websiteUrl||null,benefitText:x.benefit_text||x.benefitText||fb?.benefitText||null,logo:x.logo_url||x.logo||fb?.logo||null,verifiedAt:x.verified_at||x.verifiedAt||fb?.verifiedAt||null}}
  function enrichStops(stops=[]){const known=NevGenc.officialData.knownStopCoordinates||{};return stops.map(stop=>{const item=typeof stop==='string'?{name:stop}:{...stop},p=known[item.name];return p?{...item,lat:item.lat??item.latitude??p.lat,lng:item.lng??item.longitude??p.lng,sourceUrl:item.sourceUrl||item.source_url||p.sourceUrl,coordinateVerifiedAt:p.verifiedAt||NevGenc.officialData.verifiedAt}:item})}
  function normalizeLine(x){const fb=NevGenc.officialData.transportLines.find(l=>l.code===x.code),stops=x.stops||fb?.stops||[];return {...fb,...x,sourceUrl:x.source_url||x.sourceUrl||fb?.sourceUrl,routeGeojson:x.route_geojson||x.routeGeojson||null,stops:enrichStops(stops)}}
  function normalizeAnnouncement(x){const community=x.communities||x.community||null;return {...x,dbId:x.id||null,id:x.slug||x.id,slug:x.slug||x.id,kind:x.kind||x.type||'Duyuru',sourceType:x.source_type||x.sourceType||'university',sourceName:x.source_name||x.sourceName||community?.name||'NevGenç',title:x.title||'',summary:x.summary||'',publishedAt:x.published_at||x.publishedAt||null,eventStart:x.event_start||x.eventStart||null,eventEnd:x.event_end||x.eventEnd||null,eventRangeText:x.event_range_text||x.eventRangeText||null,location:x.location||null,isEvent:x.is_event??x.isEvent??Boolean(x.event_start||x.eventStart),isPinned:x.is_pinned??x.isPinned??false,deadlineText:x.deadline_text||x.deadlineText||null,url:x.url||x.source_url||x.sourceUrl||null,sourceUrl:x.source_url||x.sourceUrl||x.url||null,communitySlug:community?.slug||x.community_slug||x.communitySlug||null,communityName:community?.name||null,verifiedAt:x.verified_at||x.verifiedAt||null}}

  async function requireUser(){const user=await NevGenc.supabase.currentUser();if(!user){NevGenc.session.showAuth({tab:'signin'});throw new Error('Bu işlem için giriş yapmalısın.')}return user}
  async function requirePrivilegedAal2(){const state=await NevGenc.session.securitySummary();if(state.currentLevel!=='aal2'){if(state.mfaEnrolled)NevGenc.session.beginMfaChallenge().catch(()=>{});else NevGenc.session.beginMfaEnrollment().catch(()=>{});throw new Error('Yönetici işlemi için iki aşamalı doğrulama gerekli.')}}
  async function communities(){const r=await fromTable('communities',q=>q.eq('is_active',true).order('name'),seed.communities);return {data:r.data.map(normalizeCommunity),source:r.source}}
  async function partners(){const r=await fromTable('partners',q=>q.eq('is_active',true).order('name'),seed.partners);return {data:r.data.map(normalizePartner),source:r.source}}
  async function locations(){
    const c=NevGenc.supabase.getClient();if(!c)return official(seed.locations);
    try{const [a,b]=await Promise.all([c.from('map_locations').select('*').eq('is_active',true).order('name'),c.from('partners').select('*').eq('is_active',true).order('name')]);if(a.error)throw a.error;if(b.error)throw b.error;const merged=[...(a.data||[]).map(normalizeLocation),...(b.data||[]).map(normalizePartner)];return merged.length?{data:merged,source:'supabase'}:official(seed.locations)}catch(_err){return official(seed.locations)}
  }
  async function transportLines(){const r=await fromTable('transport_lines',q=>q.eq('is_active',true).order('code'),seed.transportLines);return {data:r.data.map(normalizeLine),source:r.source}}
  async function transportLineDetail(code){
    const fb=NevGenc.officialData.transportLines.find(l=>l.code===code),c=NevGenc.supabase.getClient();if(!c||!fb)return fb?{data:normalizeLine(fb),source:'official'}:null;
    try{const {data:line,error}=await c.from('transport_lines').select('*').eq('code',code).maybeSingle();if(error||!line)throw error||new Error('Hat bulunamadı');const rows=await c.from('transport_line_stops').select('stop_order,direction,transport_stops(name,latitude,longitude,source_url)').eq('line_id',line.id).eq('direction','outbound').order('stop_order');if(rows.error)throw rows.error;return {data:{...normalizeLine(line),stops:(rows.data||[]).map(r=>({name:r.transport_stops?.name||'',lat:r.transport_stops?.latitude,lng:r.transport_stops?.longitude,sourceUrl:r.transport_stops?.source_url}))},source:'supabase'}}catch(_err){return fb?{data:normalizeLine(fb),source:'official'}:null}
  }
  async function announcements(){
    const fb=(NevGenc.announcementData||[]).map(normalizeAnnouncement),c=NevGenc.supabase.getClient();if(!c)return official(fb);
    try{const {data,error}=await c.from('announcements').select('*,communities(slug,name)').eq('is_published',true).order('is_pinned',{ascending:false}).order('published_at',{ascending:false,nullsFirst:false}).limit(100);if(error)throw error;return data?.length?{data:data.map(normalizeAnnouncement),source:'supabase'}:official(fb)}catch(_err){return official(fb)}
  }
  async function opportunities(){const fb=NevGenc.opportunityData||[];return fromTable('opportunities',q=>q.eq('is_published',true).order('published_at',{ascending:false}),fb)}
  async function organizations(){return fromTable('organizations',q=>q.eq('is_active',true).order('name'),[])}
  async function municipalFacilities(){const fb=[...(NevGenc.nevPlusData?.facilities||[]),...(NevGenc.nevPlusData?.libraries||[])].map((x,i)=>({...x,id:x.slug||`facility-${i}`,facility_type:x.type||'Kütüphane',facilityType:x.type||'Kütüphane',source_url:x.sourceUrl,verified_at:NevGenc.nevPlusData?.verifiedAt}));const r=await fromTable('municipal_facilities',q=>q.eq('is_active',true).order('name'),fb);return {data:r.data.map(x=>({...x,facilityType:x.facility_type||x.facilityType||x.type||'Tesis',sourceUrl:x.source_url||x.sourceUrl||null,verifiedAt:x.verified_at||x.verifiedAt||null})),source:r.source}}

  async function followedCommunitySlugs(){
    const c=NevGenc.supabase.getClient(),user=await NevGenc.supabase.currentUser();if(!c||!user)return new Set();
    try{const {data,error}=await c.from('community_follows').select('communities(slug)').eq('user_id',user.id);if(error)throw error;return new Set((data||[]).map(x=>x.communities?.slug).filter(Boolean))}catch{return new Set()}
  }
  async function toggleCommunityFollow(slug){
    const user=await requireUser(),c=NevGenc.supabase.getClient();const {data:community,error}=await c.from('communities').select('id').eq('slug',slug).maybeSingle();if(error||!community)throw error||new Error('Topluluk bulunamadı.');
    const existing=await c.from('community_follows').select('community_id').eq('user_id',user.id).eq('community_id',community.id).maybeSingle();if(existing.error)throw existing.error;
    if(existing.data){const del=await c.from('community_follows').delete().eq('user_id',user.id).eq('community_id',community.id);if(del.error)throw del.error;return {following:false}}
    const ins=await c.from('community_follows').insert({user_id:user.id,community_id:community.id});if(ins.error)throw ins.error;return {following:true}
  }
  async function announcementResponses(){
    const c=NevGenc.supabase.getClient(),user=await NevGenc.supabase.currentUser();if(!c||!user)return {};
    try{const {data,error}=await c.from('announcement_responses').select('response,announcements(slug)').eq('user_id',user.id);if(error)throw error;const out={};(data||[]).forEach(x=>{if(x.announcements?.slug)out[x.announcements.slug]=x.response});return out}catch{return {}}
  }
  async function toggleAnnouncementResponse(slug,response='attending'){
    const user=await requireUser(),c=NevGenc.supabase.getClient();const {data:a,error}=await c.from('announcements').select('id').eq('slug',slug).maybeSingle();if(error||!a)throw error||new Error('Duyuru bulunamadı.');
    const current=await c.from('announcement_responses').select('response').eq('user_id',user.id).eq('announcement_id',a.id).maybeSingle();if(current.error)throw current.error;
    if(current.data?.response===response){const del=await c.from('announcement_responses').delete().eq('user_id',user.id).eq('announcement_id',a.id);if(del.error)throw del.error;return {active:false}}
    const up=await c.from('announcement_responses').upsert({user_id:user.id,announcement_id:a.id,response,updated_at:new Date().toISOString()},{onConflict:'user_id,announcement_id'});if(up.error)throw up.error;return {active:true}
  }
  async function communityFollowCounts(){
    const c=NevGenc.supabase.getClient();if(!c)return {};
    try{const {data,error}=await c.rpc('public_community_follow_counts');if(error)throw error;const out={};(data||[]).forEach(x=>out[x.slug]=Number(x.follow_count||0));return out}catch{return {}}
  }

  async function librarySpaces(){const r=await fromTable('library_spaces',q=>q.eq('is_active',true).eq('reservable',true).order('name'),[]);return r}
  async function libraryReservations(){
    const c=NevGenc.supabase.getClient(),user=await NevGenc.supabase.currentUser();if(!c||!user)return {data:[],source:'supabase'};
    const {data,error}=await c.from('library_reservations').select('id,space_id,starts_at,ends_at,status,library_spaces(name)').eq('user_id',user.id).order('starts_at',{ascending:true});if(error)throw error;return {data:(data||[]).map(x=>({id:x.id,spaceId:x.space_id,spaceName:x.library_spaces?.name||'Çalışma alanı',startsAt:x.starts_at,endsAt:x.ends_at,status:x.status||'confirmed'})),source:'supabase'}
  }
  async function createLibraryReservation(input){
    const user=await requireUser(),c=NevGenc.supabase.getClient();const startsAt=new Date(input.startsAt),endsAt=new Date(input.endsAt);if(!input.spaceId||!Number.isFinite(startsAt.getTime())||!Number.isFinite(endsAt.getTime())||endsAt<=startsAt)throw new Error('Tarih ve saat aralığını kontrol et.');
    const {data,error}=await c.from('library_reservations').insert({user_id:user.id,space_id:input.spaceId,starts_at:startsAt.toISOString(),ends_at:endsAt.toISOString(),status:'confirmed'}).select('id').single();if(error)throw error;return {id:data.id,source:'supabase'}
  }
  async function cancelLibraryReservation(id){const user=await requireUser(),c=NevGenc.supabase.getClient();const {error}=await c.from('library_reservations').update({status:'cancelled'}).eq('id',id).eq('user_id',user.id);if(error)throw error;return {ok:true}}
  async function diningMenusRange(startDate,endDate){
    const c=NevGenc.supabase.getClient();if(!c)return {data:[],source:'official-link'};const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    try{const {data:menus,error}=await c.from('dining_menus').select('id,menu_date,source_url,verified_at').gte('menu_date',key(startDate)).lte('menu_date',key(endDate)).order('menu_date');if(error)throw error;if(!menus?.length)return {data:[],source:'official-link'};const ids=menus.map(x=>x.id),items=await c.from('dining_menu_items').select('menu_id,item_order,name,calories').in('menu_id',ids).order('item_order');if(items.error)throw items.error;return {data:menus.map(m=>({...m,items:(items.data||[]).filter(x=>x.menu_id===m.id)})),source:'supabase'}}catch{return {data:[],source:'official-link'}}
  }
  async function diningMenu(date=new Date()){
    const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,c=NevGenc.supabase.getClient();if(!c)return {data:null,source:'official-link'};
    try{const {data:menu,error}=await c.from('dining_menus').select('id,menu_date,source_url,verified_at').eq('menu_date',key).maybeSingle();if(error||!menu)return {data:null,source:'official-link'};const items=await c.from('dining_menu_items').select('item_order,name,calories').eq('menu_id',menu.id).order('item_order');if(items.error)throw items.error;return {data:{...menu,items:items.data||[]},source:'supabase'}}catch{return {data:null,source:'official-link'}}
  }


  async function communityBySlug(slug){
    const safe=String(slug||'').trim().toLowerCase();
    const c=NevGenc.supabase.getClient();
    if(!c){const item=(seed.communities||[]).map(normalizeCommunity).find(x=>x.slug===safe)||null;return {data:item,source:'official'}}
    const {data,error}=await c.from('communities').select('*').eq('slug',safe).eq('is_active',true).maybeSingle();
    if(error)throw error;
    if(data)return {data:normalizeCommunity(data),source:'supabase'};
    const item=(seed.communities||[]).map(normalizeCommunity).find(x=>x.slug===safe)||null;return {data:item,source:'official'};
  }

  async function communityPublicAdmins(slug){
    const c=NevGenc.supabase.getClient();if(!c)return {data:[],source:'official'};
    const {data:community,error:ce}=await c.from('communities').select('id').eq('slug',String(slug||'')).maybeSingle();if(ce||!community)return {data:[],source:'supabase'};
    const {data,error}=await c.from('community_admins_public').select('community_id,display_name,role_title,public_email,avatar_url,sort_order').eq('community_id',community.id).order('sort_order').order('display_name');
    if(error){return {data:[],source:'supabase'}}
    return {data:(data||[]).map(x=>({communityId:x.community_id,displayName:x.display_name,roleTitle:x.role_title,publicEmail:x.public_email,avatarUrl:x.avatar_url,sortOrder:x.sort_order})),source:'supabase'};
  }

  async function communityPosts(slug){
    const c=NevGenc.supabase.getClient();if(!c)return {data:[],source:'official'};
    const {data:community,error:ce}=await c.from('communities').select('id').eq('slug',String(slug||'')).maybeSingle();if(ce||!community)return {data:[],source:'supabase'};
    const {data,error}=await c.from('community_posts_public').select('id,community_id,body,image_path,published_at,author_name,author_role').eq('community_id',community.id).order('published_at',{ascending:false}).limit(100);
    if(error){return {data:[],source:'supabase'}}
    return {data:(data||[]).map(x=>({...x,communityId:x.community_id,body:x.body||'',imagePath:x.image_path||null,publishedAt:x.published_at,authorName:x.author_name||'Topluluk Yönetimi',authorRole:x.author_role||'Yönetici',imageUrl:x.image_path?c.storage.from('community-posts').getPublicUrl(x.image_path).data.publicUrl:null})),source:'supabase'};
  }

  async function communityPostsFeed(limit=60){
    const c=NevGenc.supabase.getClient();if(!c)return {data:[],source:'official'};
    try{
      const [posts,communitiesResult]=await Promise.all([
        c.from('community_posts_public').select('id,community_id,body,image_path,published_at,author_name,author_role').order('published_at',{ascending:false}).limit(Math.max(1,Math.min(Number(limit)||60,100))),
        c.from('communities').select('id,slug,name,category').eq('is_active',true)
      ]);
      if(posts.error)throw posts.error;if(communitiesResult.error)throw communitiesResult.error;
      const byId=new Map((communitiesResult.data||[]).map(x=>[x.id,x]));
      return {data:(posts.data||[]).map(x=>{const community=byId.get(x.community_id)||{};return {...x,communityId:x.community_id,communitySlug:community.slug||'',communityName:community.name||'Öğrenci Topluluğu',communityCategory:community.category||'',body:x.body||'',imagePath:x.image_path||null,publishedAt:x.published_at,authorName:x.author_name||'Topluluk Yönetimi',authorRole:x.author_role||'Yönetici',imageUrl:x.image_path?c.storage.from('community-posts').getPublicUrl(x.image_path).data.publicUrl:null}}),source:'supabase'};
    }catch(err){void err;return {data:[],source:'supabase'}}
  }

  function imageMagicType(bytes){
    if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
    if(bytes.length>=8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a)return 'image/png';
    if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
    return null;
  }
  async function sanitizePostImage(file){
    if(!file)return null;
    const allowed=new Set(['image/jpeg','image/png','image/webp']);
    if(!allowed.has(file.type))throw new Error('Görsel yalnızca JPG, PNG veya WEBP olabilir.');
    if(file.size>5*1024*1024)throw new Error('Görsel en fazla 5 MB olabilir.');
    const header=new Uint8Array(await file.slice(0,16).arrayBuffer()),magic=imageMagicType(header);
    if(!magic||magic!==file.type)throw new Error('Görsel dosyasının içeriği geçerli görünmüyor.');
    let bitmap;try{bitmap=await createImageBitmap(file)}catch{throw new Error('Görsel açılamadı veya bozuk.');}
    const pixels=bitmap.width*bitmap.height;if(bitmap.width<32||bitmap.height<32||pixels>24_000_000){bitmap.close();throw new Error('Görsel boyutları güvenli sınırların dışında.');}
    const maxSide=2200,scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height)),w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:true});if(!ctx){bitmap.close();throw new Error('Görsel işlenemedi.');}
    ctx.drawImage(bitmap,0,0,w,h);bitmap.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.9));canvas.width=1;canvas.height=1;if(!blob)throw new Error('Görsel güvenli biçime dönüştürülemedi.');
    if(blob.size>5*1024*1024)throw new Error('İşlenmiş görsel 5 MB sınırını aşıyor.');
    return new File([blob],`${crypto.randomUUID()}.webp`,{type:'image/webp',lastModified:Date.now()});
  }

  async function createCommunityPost({communitySlug,body,imageFile}){
    const user=await requireUser();await requirePrivilegedAal2();const c=NevGenc.supabase.getClient();
    const text=String(body||'').trim();if(text.length>5000)throw new Error('Gönderi metni en fazla 5000 karakter olabilir.');
    const safeImage=imageFile?await sanitizePostImage(imageFile):null;if(!text&&!safeImage)throw new Error('Metin veya görsel eklemelisin.');
    const {data:community,error:ce}=await c.from('communities').select('id').eq('slug',String(communitySlug||'')).eq('is_active',true).maybeSingle();if(ce||!community)throw ce||new Error('Topluluk bulunamadı.');
    let imagePath=null;
    if(safeImage){
      imagePath=`${community.id}/${crypto.randomUUID()}.webp`;
      const uploaded=await c.storage.from('community-posts').upload(imagePath,safeImage,{cacheControl:'3600',contentType:'image/webp',upsert:false});
      if(uploaded.error)throw new Error('Görsel yüklenemedi.');
    }
    const {data,error}=await c.from('community_posts').insert({community_id:community.id,author_id:user.id,body:text||null,image_path:imagePath,is_published:true}).select('id').single();
    if(error){if(imagePath)await c.storage.from('community-posts').remove([imagePath]).catch(()=>{});throw new Error('Gönderi yayınlanamadı.')}
    return {id:data.id};
  }

  async function deleteCommunityPost(id,imagePath=null){
    await requireUser();await requirePrivilegedAal2();const c=NevGenc.supabase.getClient();
    const {error}=await c.from('community_posts').delete().eq('id',id);if(error)throw new Error('Gönderi yayından kaldırılamadı.');
    if(imagePath)await c.storage.from('community-posts').remove([imagePath]).catch(()=>{});
    return {ok:true};
  }

  async function updateCommunityProfile({communitySlug,description,contactEmail}){
    return invokeProtectedFunction('content-admin',{operation:'update_community_profile',communitySlug,description:String(description||'').trim(),contactEmail:String(contactEmail||'').trim().toLowerCase()||null});
  }

  async function updateOrganizationProfile({organizationSlug,contactEmail}){
    return invokeProtectedFunction('content-admin',{operation:'update_organization_profile',organizationSlug,contactEmail:String(contactEmail||'').trim().toLowerCase()||null});
  }

  async function ownCommunityAdminProfile(communitySlug){
    const user=await requireUser(),c=NevGenc.supabase.getClient();
    const {data:community,error:ce}=await c.from('communities').select('id').eq('slug',String(communitySlug||'')).maybeSingle();if(ce||!community)throw ce||new Error('Topluluk bulunamadı.');
    const {data,error}=await c.from('community_admin_public_profiles').select('*').eq('community_id',community.id).eq('user_id',user.id).maybeSingle();if(error)throw error;
    return {communityId:community.id,userId:user.id,displayName:data?.display_name||user.user_metadata?.full_name||'Topluluk Yöneticisi',roleTitle:data?.role_title||'Topluluk Yöneticisi',publicEmail:data?.public_email||'',sortOrder:data?.sort_order??50};
  }

  async function updateOwnCommunityAdminProfile({communitySlug,displayName,roleTitle,publicEmail}){
    const user=await requireUser();await requirePrivilegedAal2();const c=NevGenc.supabase.getClient();
    const name=String(displayName||'').trim().replace(/\s+/g,' '),title=String(roleTitle||'').trim().replace(/\s+/g,' '),email=String(publicEmail||'').trim().toLowerCase();
    if(name.length<2||name.length>80)throw new Error('Görünen ad 2-80 karakter olmalıdır.');
    if(title.length<2||title.length>80)throw new Error('Görev adı 2-80 karakter olmalıdır.');
    if(email&&!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}$/.test(email))throw new Error('İletişim e-postası geçerli değil.');
    const {data:community,error:ce}=await c.from('communities').select('id').eq('slug',String(communitySlug||'')).maybeSingle();if(ce||!community)throw ce||new Error('Topluluk bulunamadı.');
    const {error}=await c.from('community_admin_public_profiles').upsert({community_id:community.id,user_id:user.id,display_name:name,role_title:title,public_email:email||null,updated_at:new Date().toISOString()},{onConflict:'community_id,user_id'});if(error)throw new Error('Yönetici kartı güncellenemedi.');
    return {ok:true};
  }

  async function accountContext(){
    const user=await NevGenc.supabase.currentUser();if(!user)return null;const c=NevGenc.supabase.getClient();
    const [profile,platform,community,org]=await Promise.all([
      c.from('profiles').select('*').eq('id',user.id).maybeSingle(),
      c.from('platform_admins').select('user_id').eq('user_id',user.id).maybeSingle(),
      c.from('community_admins').select('community_id,communities(slug,name)').eq('user_id',user.id),
      c.from('organization_editors').select('organization_id,organizations(slug,name,type)').eq('user_id',user.id)
    ]);
    return {user,profile:profile.data||{},isPlatformAdmin:Boolean(platform.data),communityAdminOf:(community.data||[]).map(x=>({id:x.community_id,slug:x.communities?.slug,name:x.communities?.name})),organizationEditorOf:(org.data||[]).map(x=>({id:x.organization_id,...x.organizations}))}
  }
  async function invokeProtectedFunction(name,body){
    await requireUser();const c=NevGenc.supabase.getClient();
    const {data,error}=await c.functions.invoke(name,{body});
    if(error){
      let message='Yetkili işlem tamamlanamadı.';
      try{const r=error.context; if(r?.json){const j=await r.json();if(j?.error)message=j.error}}catch{}
      throw new Error(message);
    }
    if(data?.error)throw new Error(data.error);return data;
  }
  async function createAnnouncement(payload){
    const [scopeType,scopeValue]=String(payload.scope||`${payload.scope_type||''}:${payload.scope_value||''}`).split(':');
    return invokeProtectedFunction('content-admin',{operation:'create',scopeType,scopeValue,kind:payload.kind,title:payload.title,summary:payload.summary,url:payload.url,eventStart:payload.event_start||payload.eventStart,location:payload.location});
  }
  async function unpublishAnnouncement(announcementId){return invokeProtectedFunction('content-admin',{operation:'unpublish',announcementId})}
  async function assignCommunityAdmin(communitySlug,email){return invokeProtectedFunction('role-admin',{operation:'assign_community_admin',communitySlug,targetEmail:String(email||'').trim().toLowerCase()})}
  async function removeCommunityAdmin(communitySlug,email){return invokeProtectedFunction('role-admin',{operation:'remove_community_admin',communitySlug,targetEmail:String(email||'').trim().toLowerCase()})}
  async function assignPlatformAdmin(email){return invokeProtectedFunction('role-admin',{operation:'assign_platform_admin',targetEmail:String(email||'').trim().toLowerCase()})}
  async function assignOrganizationEditor(organizationSlug,email){return invokeProtectedFunction('role-admin',{operation:'assign_organization_editor',organizationSlug,targetEmail:String(email||'').trim().toLowerCase()})}
  async function deleteOwnAccount(confirmation,emailConfirmation){return invokeProtectedFunction('account-delete',{confirmation:String(confirmation||''),emailConfirmation:String(emailConfirmation||'').trim().toLowerCase()})}
  async function auditLog(limit=50){
    await requireUser();const c=NevGenc.supabase.getClient();const safeLimit=Math.max(1,Math.min(Number(limit)||50,100));
    const {data,error}=await c.from('content_audit_log').select('id,actor_id,action,entity_type,entity_id,metadata,created_at').order('created_at',{ascending:false}).limit(safeLimit);
    if(error)throw new Error('Güvenlik kayıtları alınamadı.');
    return {data:(data||[]).map(x=>({id:x.id,actorId:x.actor_id||null,action:x.action,entityType:x.entity_type,entityId:x.entity_id||null,metadata:x.metadata||{},createdAt:x.created_at})),source:'supabase'};
  }

  return {communities,communityBySlug,communityPublicAdmins,communityPosts,communityPostsFeed,createCommunityPost,deleteCommunityPost,updateCommunityProfile,updateOrganizationProfile,ownCommunityAdminProfile,updateOwnCommunityAdminProfile,partners,locations,transportLines,transportLineDetail,announcements,opportunities,organizations,municipalFacilities,followedCommunitySlugs,toggleCommunityFollow,announcementResponses,toggleAnnouncementResponse,communityFollowCounts,librarySpaces,libraryReservations,createLibraryReservation,cancelLibraryReservation,diningMenu,diningMenusRange,accountContext,createAnnouncement,unpublishAnnouncement,assignCommunityAdmin,removeCommunityAdmin,assignPlatformAdmin,assignOrganizationEditor,deleteOwnAccount,auditLog,profile:accountContext};
})();
