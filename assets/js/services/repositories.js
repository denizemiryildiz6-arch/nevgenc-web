window.NevGenc = window.NevGenc || {};
NevGenc.repositories = (() => {
  const seed = NevGenc.seed;
  const official = (data) => ({data, source:'official'});
  const LOCAL_FOLLOWS='nevgenc-followed-communities-v1';
  const LOCAL_RESPONSES='nevgenc-announcement-responses-v1';
  const LOCAL_LIBRARY_RESERVATIONS='nevgenc-library-reservations-v1';

  async function fromTable(table, queryBuilder, fallback){
    const c = NevGenc.supabase.getClient();
    if(!c) return official(fallback);
    try{
      let q = c.from(table).select('*');
      if(queryBuilder) q = queryBuilder(q);
      const {data,error} = await q;
      if(error) throw error;
      return data?.length ? {data,source:'supabase'} : official(fallback);
    }catch(err){
      console.warn(`[NevGenç] ${table} resmî veri yedeği kullanılıyor`, err);
      return official(fallback);
    }
  }

  function readLocalSet(key){
    try{return new Set(JSON.parse(localStorage.getItem(key)||'[]'))}catch{return new Set()}
  }
  function saveLocalSet(key,set){
    try{localStorage.setItem(key,JSON.stringify([...set]))}catch{}
  }
  function readLocalObject(key){
    try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}
  }
  function saveLocalObject(key,obj){
    try{localStorage.setItem(key,JSON.stringify(obj))}catch{}
  }

  function normalizeCommunity(x){
    return {
      ...x,
      dbId:x.id || null,
      id:x.slug || x.id,
      slug:x.slug || x.id,
      socialUrl:x.instagram_url || x.x_url || x.linkedin_url || x.socialUrl || null,
      instagramUrl:x.instagram_url || x.instagramUrl || null,
      xUrl:x.x_url || x.xUrl || null,
      sourceUrl:x.source_url || x.sourceUrl || NevGenc.config.sources.communities,
      sourceName:x.source_name || x.sourceName || null,
      verifiedAt:x.verified_at || x.verifiedAt || null
    };
  }
  function fallbackLocation(slugOrId){
    return seed.locations.find(item => item.slug===slugOrId || item.id===slugOrId) || null;
  }
  function normalizeLocation(x){
    const key=x.slug||x.id;
    const fallback=fallbackLocation(key);
    return {
      ...fallback,...x,id:key,dbId:x.id||null,
      lat:x.latitude??x.lat??fallback?.lat??null,
      lng:x.longitude??x.lng??fallback?.lng??null,
      sourceUrl:x.source_url||x.sourceUrl||fallback?.sourceUrl||null,
      verifiedAt:x.verified_at||x.verifiedAt||fallback?.verifiedAt||null
    };
  }
  function normalizePartner(x){
    const key=x.slug||x.id;
    const fallback=fallbackLocation(key);
    return {
      ...fallback,...x,id:key,dbId:x.id||null,type:'partner',
      lat:x.latitude??x.lat??fallback?.lat??null,
      lng:x.longitude??x.lng??fallback?.lng??null,
      sourceUrl:x.source_url||x.sourceUrl||fallback?.sourceUrl||null,
      websiteUrl:x.website_url||x.websiteUrl||fallback?.websiteUrl||null,
      benefitText:x.benefit_text||x.benefitText||fallback?.benefitText||null,
      logo:x.logo_url||x.logo||fallback?.logo||null,
      verifiedAt:x.verified_at||x.verifiedAt||fallback?.verifiedAt||null
    };
  }
  function enrichStops(stops=[]){
    const known=NevGenc.officialData.knownStopCoordinates||{};
    return stops.map(stop=>{
      const item=typeof stop==='string'?{name:stop}:{...stop};
      const knownPoint=known[item.name];
      if(!knownPoint)return item;
      return {
        ...item,
        lat:item.lat??item.latitude??knownPoint.lat,
        lng:item.lng??item.longitude??knownPoint.lng,
        sourceUrl:item.sourceUrl||item.source_url||knownPoint.sourceUrl,
        coordinateVerifiedAt:knownPoint.verifiedAt||NevGenc.officialData.verifiedAt
      };
    });
  }
  function normalizeLine(x){
    const fallback=NevGenc.officialData.transportLines.find(l=>l.code===x.code);
    const stops=x.stops||fallback?.stops||[];
    return {...fallback,...x,sourceUrl:x.source_url||x.sourceUrl||fallback?.sourceUrl,routeGeojson:x.route_geojson||x.routeGeojson||null,stops:enrichStops(stops)};
  }
  function normalizeAnnouncement(x){
    const community=x.communities||x.community||null;
    return {
      ...x,
      dbId:x.id||null,
      id:x.slug||x.id,
      slug:x.slug||x.id,
      kind:x.kind||x.type||'Duyuru',
      sourceType:x.source_type||x.sourceType||'university',
      sourceName:x.source_name||x.sourceName||community?.name||'NevGenç',
      title:x.title,
      summary:x.summary||'',
      publishedAt:x.published_at||x.publishedAt||null,
      eventStart:x.event_start||x.eventStart||null,
      eventEnd:x.event_end||x.eventEnd||null,
      eventRangeText:x.event_range_text||x.eventRangeText||null,
      location:x.location||null,
      isEvent:x.is_event??x.isEvent??Boolean(x.event_start||x.eventStart),
      isPinned:x.is_pinned??x.isPinned??false,
      deadlineText:x.deadline_text||x.deadlineText||null,
      url:x.url||x.source_url||x.sourceUrl||null,
      sourceUrl:x.source_url||x.sourceUrl||x.url||null,
      communitySlug:community?.slug||x.community_slug||x.communitySlug||null,
      communityName:community?.name||null,
      verifiedAt:x.verified_at||x.verifiedAt||null
    };
  }

  async function communities(){
    const r=await fromTable('communities',q=>q.eq('is_active',true).order('name'),seed.communities);
    return {data:r.data.map(normalizeCommunity),source:r.source};
  }
  async function partners(){
    const r=await fromTable('partners',q=>q.eq('is_active',true).order('name'),seed.partners);
    return {data:r.data.map(normalizePartner),source:r.source};
  }
  async function locations(){
    const c=NevGenc.supabase.getClient();
    if(!c) return official(seed.locations);
    try{
      const [locRes,partnerRes]=await Promise.all([
        c.from('map_locations').select('*').eq('is_active',true).order('name'),
        c.from('partners').select('*').eq('is_active',true).order('name')
      ]);
      if(locRes.error) throw locRes.error;
      if(partnerRes.error) throw partnerRes.error;
      const merged=[...(locRes.data||[]).map(normalizeLocation),...(partnerRes.data||[]).map(normalizePartner)];
      return merged.length?{data:merged,source:'supabase'}:official(seed.locations);
    }catch(err){console.warn('[NevGenç] konumlarda resmî veri yedeği kullanılıyor',err);return official(seed.locations);}
  }
  async function transportLines(){
    const r=await fromTable('transport_lines',q=>q.eq('is_active',true).order('code'),seed.transportLines);
    return {data:r.data.map(normalizeLine),source:r.source};
  }
  async function transportLineDetail(code){
    const fallback=NevGenc.officialData.transportLines.find(l=>l.code===code);
    const c=NevGenc.supabase.getClient();
    if(!c || !fallback) return fallback ? {data:normalizeLine(fallback),source:'official'} : null;
    try{
      const {data:line,error:lineErr}=await c.from('transport_lines').select('*').eq('code',code).maybeSingle();
      if(lineErr||!line) throw lineErr||new Error('Hat bulunamadı');
      const {data:rows,error:stopErr}=await c.from('transport_line_stops').select('stop_order,direction,transport_stops(name,latitude,longitude,source_url)').eq('line_id',line.id).eq('direction','outbound').order('stop_order');
      if(stopErr) throw stopErr;
      return {data:{...normalizeLine(line),stops:(rows||[]).map(r=>({name:r.transport_stops?.name||'',lat:r.transport_stops?.latitude,lng:r.transport_stops?.longitude,sourceUrl:r.transport_stops?.source_url}))},source:'supabase'};
    }catch(err){console.warn('[NevGenç] hat detayında resmî veri yedeği kullanılıyor',err);return fallback?{data:normalizeLine(fallback),source:'official'}:null;}
  }
  async function announcements(){
    const fallback=(NevGenc.announcementData||[]).map(normalizeAnnouncement);
    const c=NevGenc.supabase.getClient();
    if(!c) return official(fallback);
    try{
      const {data,error}=await c.from('announcements').select('*,communities(slug,name)').eq('is_published',true).order('is_pinned',{ascending:false}).order('published_at',{ascending:false,nullsFirst:false}).limit(60);
      if(error) throw error;
      return data?.length?{data:data.map(normalizeAnnouncement),source:'supabase'}:official(fallback);
    }catch(err){console.warn('[NevGenç] duyurularda resmî veri yedeği kullanılıyor',err);return official(fallback);}
  }
  async function followedCommunitySlugs(){
    const local=readLocalSet(LOCAL_FOLLOWS);
    const c=NevGenc.supabase.getClient();
    const user=await NevGenc.supabase.currentUser();
    if(!c||!user) return local;
    try{
      const {data,error}=await c.from('community_follows').select('communities(slug)').eq('user_id',user.id);
      if(error) throw error;
      const synced=new Set((data||[]).map(x=>x.communities?.slug).filter(Boolean));
      saveLocalSet(LOCAL_FOLLOWS,synced);
      return synced;
    }catch{return local;}
  }
  async function toggleCommunityFollow(slug){
    const local=readLocalSet(LOCAL_FOLLOWS);
    const shouldFollow=!local.has(slug);
    shouldFollow?local.add(slug):local.delete(slug); saveLocalSet(LOCAL_FOLLOWS,local);
    const c=NevGenc.supabase.getClient(); const user=await NevGenc.supabase.currentUser();
    if(!c||!user) return {following:shouldFollow,local:true};
    try{
      const {data:community,error:communityErr}=await c.from('communities').select('id').eq('slug',slug).maybeSingle();
      if(communityErr||!community) throw communityErr||new Error('Topluluk kaydı bulunamadı');
      if(shouldFollow){
        const {error}=await c.from('community_follows').upsert({user_id:user.id,community_id:community.id},{onConflict:'user_id,community_id'}); if(error) throw error;
      }else{
        const {error}=await c.from('community_follows').delete().eq('user_id',user.id).eq('community_id',community.id); if(error) throw error;
      }
      return {following:shouldFollow,local:false};
    }catch(err){console.warn('[NevGenç] takip işlemi yerel olarak saklandı',err);return {following:shouldFollow,local:true};}
  }
  async function announcementResponses(){
    const local=readLocalObject(LOCAL_RESPONSES);
    const c=NevGenc.supabase.getClient(); const user=await NevGenc.supabase.currentUser();
    if(!c||!user) return local;
    try{
      const {data,error}=await c.from('announcement_responses').select('response,announcements(slug)').eq('user_id',user.id);
      if(error) throw error;
      const synced={}; (data||[]).forEach(x=>{if(x.announcements?.slug)synced[x.announcements.slug]=x.response});
      saveLocalObject(LOCAL_RESPONSES,synced); return synced;
    }catch{return local;}
  }
  async function toggleAnnouncementResponse(slug,response='attending'){
    const local=readLocalObject(LOCAL_RESPONSES); const active=local[slug]===response;
    if(active) delete local[slug]; else local[slug]=response; saveLocalObject(LOCAL_RESPONSES,local);
    const c=NevGenc.supabase.getClient(); const user=await NevGenc.supabase.currentUser();
    if(!c||!user) return {active:!active,local:true};
    try{
      const {data:announcement,error:aErr}=await c.from('announcements').select('id').eq('slug',slug).maybeSingle();
      if(aErr||!announcement) throw aErr||new Error('Duyuru kaydı bulunamadı');
      if(active){
        const {error}=await c.from('announcement_responses').delete().eq('user_id',user.id).eq('announcement_id',announcement.id).eq('response',response); if(error) throw error;
      }else{
        const {error}=await c.from('announcement_responses').upsert({user_id:user.id,announcement_id:announcement.id,response},{onConflict:'user_id,announcement_id'}); if(error) throw error;
      }
      return {active:!active,local:false};
    }catch(err){console.warn('[NevGenç] duyuru tercihi yerel olarak saklandı',err);return {active:!active,local:true};}
  }

  async function librarySpaces(){
    const fallback=[
      {id:'local-individual',name:'Bireysel Çalışma Alanı',capacity:null,reservable:true,is_active:true},
      {id:'local-group',name:'Grup Çalışma Alanı',capacity:null,reservable:true,is_active:true}
    ];
    const r=await fromTable('library_spaces',q=>q.eq('is_active',true).order('name'),fallback);
    const data=(r.data||[]).filter(x=>x.reservable!==false);
    return {data:data.length?data:fallback,source:r.source};
  }
  function readLocalReservations(){
    try{return JSON.parse(localStorage.getItem(LOCAL_LIBRARY_RESERVATIONS)||'[]')}catch{return []}
  }
  function saveLocalReservations(items){try{localStorage.setItem(LOCAL_LIBRARY_RESERVATIONS,JSON.stringify(items))}catch{}}
  async function libraryReservations(){
    const local=readLocalReservations();
    const c=NevGenc.supabase.getClient(); const user=await NevGenc.supabase.currentUser();
    if(!c||!user)return {data:local,source:'local'};
    try{
      const {data,error}=await c.from('library_reservations').select('id,space_id,starts_at,ends_at,status,library_spaces(name)').eq('user_id',user.id).order('starts_at',{ascending:true});
      if(error)throw error;
      return {data:(data||[]).map(x=>({id:x.id,spaceId:x.space_id,spaceName:x.library_spaces?.name||'Çalışma alanı',startsAt:x.starts_at,endsAt:x.ends_at,status:x.status||'confirmed'})),source:'supabase'};
    }catch(err){console.warn('[NevGenç] kütüphane randevuları yerel kayıttan gösteriliyor',err);return {data:local,source:'local'};}
  }
  async function createLibraryReservation(input){
    const startsAt=new Date(input.startsAt), endsAt=new Date(input.endsAt);
    if(!input.spaceId||Number.isNaN(startsAt.getTime())||Number.isNaN(endsAt.getTime())||endsAt<=startsAt)throw new Error('Tarih ve saat aralığını kontrol edin.');
    const c=NevGenc.supabase.getClient(); const user=await NevGenc.supabase.currentUser();
    const isLocalSpace=String(input.spaceId).startsWith('local-');
    if(c&&user&&!isLocalSpace){
      try{
        const {data,error}=await c.from('library_reservations').insert({user_id:user.id,space_id:input.spaceId,starts_at:startsAt.toISOString(),ends_at:endsAt.toISOString(),status:'confirmed'}).select('id').single();
        if(error)throw error;
        return {id:data.id,source:'supabase'};
      }catch(err){console.warn('[NevGenç] randevu yerel kayda alındı',err);}
    }
    const spaces=await librarySpaces(); const space=spaces.data.find(x=>String(x.id)===String(input.spaceId));
    const items=readLocalReservations();
    const item={id:(crypto.randomUUID?crypto.randomUUID():`local-${Date.now()}`),spaceId:input.spaceId,spaceName:space?.name||'Çalışma alanı',startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString(),status:'confirmed',createdAt:new Date().toISOString()};
    items.push(item);saveLocalReservations(items);return {id:item.id,source:'local'};
  }
  async function cancelLibraryReservation(id){
    const c=NevGenc.supabase.getClient(); const user=await NevGenc.supabase.currentUser();
    if(c&&user&&!String(id).startsWith('local-')){
      try{const {error}=await c.from('library_reservations').update({status:'cancelled'}).eq('id',id).eq('user_id',user.id);if(error)throw error;return {ok:true,source:'supabase'}}catch(err){console.warn('[NevGenç] randevu iptali yerel kayda uygulanıyor',err)}
    }
    const items=readLocalReservations().map(x=>x.id===id?{...x,status:'cancelled'}:x);saveLocalReservations(items);return {ok:true,source:'local'};
  }
  async function diningMenusRange(startDate,endDate){
    const c=NevGenc.supabase.getClient();
    if(!c)return {data:[],source:'official-link'};
    const key=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${dd}`};
    try{
      const {data:menus,error}=await c.from('dining_menus').select('id,menu_date,source_url,verified_at').gte('menu_date',key(startDate)).lte('menu_date',key(endDate)).order('menu_date');
      if(error)throw error;if(!menus?.length)return {data:[],source:'official-link'};
      const ids=menus.map(x=>x.id);const {data:items,error:iErr}=await c.from('dining_menu_items').select('menu_id,item_order,name,calories').in('menu_id',ids).order('item_order');if(iErr)throw iErr;
      return {data:menus.map(m=>({...m,items:(items||[]).filter(x=>x.menu_id===m.id)})),source:'supabase'};
    }catch(err){console.warn('[NevGenç] haftalık menü alınamadı',err);return {data:[],source:'official-link'};}
  }

  async function diningMenu(date=new Date()){
    const yyyy=date.getFullYear(), mm=String(date.getMonth()+1).padStart(2,'0'), dd=String(date.getDate()).padStart(2,'0');
    const key=`${yyyy}-${mm}-${dd}`;
    const c=NevGenc.supabase.getClient();
    if(!c) return {data:null,source:'official-link'};
    try{
      const {data:menu,error}=await c.from('dining_menus').select('id,menu_date,source_url,verified_at').eq('menu_date',key).maybeSingle();
      if(error||!menu) return {data:null,source:'official-link'};
      const {data:items,error:itemsErr}=await c.from('dining_menu_items').select('item_order,name,calories').eq('menu_id',menu.id).order('item_order');
      if(itemsErr) throw itemsErr;
      return {data:{...menu,items:items||[]},source:'supabase'};
    }catch(err){console.warn('[NevGenç] yemek menüsü resmî bağlantıya yönlendiriliyor',err);return {data:null,source:'official-link'};}
  }
  return {
    communities,partners,locations,announcements,
    opportunities:()=>fromTable('opportunities',q=>q.eq('is_published',true).order('published_at',{ascending:false}),[]),
    transportLines,transportLineDetail,diningMenu,diningMenusRange,librarySpaces,libraryReservations,createLibraryReservation,cancelLibraryReservation,
    followedCommunitySlugs,toggleCommunityFollow,announcementResponses,toggleAnnouncementResponse,
    profile: async()=>{
      const localSession=NevGenc.session?.get?.()||null;
      const user=await NevGenc.supabase.currentUser();
      if(!user){
        if(!localSession)return null;
        return {user:null,local:true,profile:{full_name:localSession.name,n_points:0}};
      }
      const c=NevGenc.supabase.getClient();
      const {data}=await c.from('profiles').select('*').eq('id',user.id).maybeSingle();
      return {user,local:false,profile:{full_name:data?.full_name||localSession?.name||user.email||'Kullanıcı',...data}};
    }
  };
})();
