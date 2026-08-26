window.NevGenc = window.NevGenc || {};
NevGenc.app = (()=>{
  const routes={anasayfa:NevGenc.views.home,topluluklar:NevGenc.views.communities,harita:NevGenc.views.mapView,firsatlar:NevGenc.views.opportunities,profil:NevGenc.views.profile};
  const view=document.getElementById('view');
  function routeName(){return (location.hash.replace(/^#\//,'').split('/')[0]||NevGenc.config.defaultRoute).toLowerCase()}
  function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2600)}
  async function render(){
    const route=routes[routeName()]?routeName():NevGenc.config.defaultRoute;
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.toggle('active',a.dataset.route===route));
    view.innerHTML='<div class="page"><div class="skeleton" style="height:180px"></div></div>';
    try{view.innerHTML=await routes[route]();await bindRoute(route);view.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}catch(err){console.error(err);view.innerHTML='<div class="empty-state">Sayfa yüklenirken bir sorun oluştu.</div>'}
  }
  async function bindRoute(route){
    document.querySelectorAll('[data-action-message]').forEach(b=>b.addEventListener('click',()=>toast(b.dataset.actionMessage)));
    bindFollowButtons();
    if(route==='anasayfa')await bindHome();
    if(route==='topluluklar')await bindCommunities();
    if(route==='harita')await bindMap();
    if(route==='profil')bindProfile();
  }
  function bindProfile(){
    document.querySelector('[data-open-name-login]')?.addEventListener('click',()=>NevGenc.session.showLogin());
    document.querySelector('[data-edit-profile-name]')?.addEventListener('click',()=>NevGenc.session.showLogin({editing:true}));
    document.querySelector('[data-sign-out]')?.addEventListener('click',()=>{
      NevGenc.session.signOut();
      toast('Oturum kapatıldı.');
      NevGenc.session.showLogin();
      render();
    });
  }
  function bindFollowButtons(root=document){
    root.querySelectorAll('[data-follow-community]').forEach(button=>{
      if(button.dataset.bound==='1')return;button.dataset.bound='1';
      button.addEventListener('click',async e=>{
        e.preventDefault();e.stopPropagation();
        const slug=button.dataset.followCommunity;if(!slug)return;
        button.disabled=true;const result=await NevGenc.repositories.toggleCommunityFollow(slug);button.disabled=false;
        document.querySelectorAll(`[data-follow-community="${CSS.escape(slug)}"]`).forEach(b=>{
          b.classList.toggle('active',result.following);
          const span=b.querySelector('span'); if(span)span.textContent=result.following?'Takip ediliyor':'Topluluğu takip et'; else b.textContent=result.following?'Takip ediliyor':'Takip et';
        });
        toast(result.following?'Topluluk takip ediliyor.':'Topluluk takibi kaldırıldı.');
      });
    });
  }
  async function bindHome(){
    const [announcements,followed,responses]=await Promise.all([NevGenc.repositories.announcements(),NevGenc.repositories.followedCommunitySlugs(),NevGenc.repositories.announcementResponses()]);
    const feed=document.getElementById('announcement-feed'); let active='all';
    const draw=()=>{
      const items=announcements.data.filter(a=>{
        if(active==='all')return true;
        if(active==='following')return a.communitySlug&&followed.has(a.communitySlug);
        return a.sourceType===active;
      });
      feed.innerHTML=NevGenc.views.announcementCards(items,followed,responses);bindAnnouncementActions(feed);bindFollowButtons(feed);
    };
    document.getElementById('announcement-filters')?.addEventListener('click',e=>{
      const b=e.target.closest('[data-announcement-filter]');if(!b)return;active=b.dataset.announcementFilter;
      document.querySelectorAll('#announcement-filters .chip').forEach(x=>x.classList.toggle('active',x===b));draw();
    });
    bindAnnouncementActions(feed);
  }
  function bindAnnouncementActions(root=document){
    root.querySelectorAll('[data-announcement-response]').forEach(button=>{
      if(button.dataset.bound==='1')return;button.dataset.bound='1';
      button.addEventListener('click',async()=>{
        const slug=button.dataset.announcementSlug,response=button.dataset.announcementResponse;if(!slug||!response)return;
        button.disabled=true;const result=await NevGenc.repositories.toggleAnnouncementResponse(slug,response);button.disabled=false;
        const card=button.closest('[data-announcement-card]');
        card?.querySelectorAll(`[data-announcement-slug="${CSS.escape(slug)}"]`).forEach(b=>{
          const same=b.dataset.announcementResponse===response;
          b.classList.toggle('active',same&&result.active);
          const label=b.querySelector('span');
          if(label){
            const type=b.dataset.announcementResponse;
            const isActive=same&&result.active;
            label.textContent=type==='attending'?(isActive?'Katılacağım ✓':'Katılacağım'):(isActive?'İlgileniyorum ✓':'İlgileniyorum');
          }
        });
        toast(result.active?(response==='attending'?'Katılım tercihin kaydedildi.':'Duyuru ilgi listene eklendi.'):'Tercih kaldırıldı.');
      });
    });
  }
  async function bindCommunities(){
    const [result,followed]=await Promise.all([NevGenc.repositories.communities(),NevGenc.repositories.followedCommunitySlugs()]);let active='Tümü';let query='';const grid=document.getElementById('community-grid');
    const apply=()=>{const items=result.data.filter(c=>(active==='Tümü'||c.category===active)&&c.name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));grid.innerHTML=NevGenc.views.communityCards(items,followed);bindFollowButtons(grid)};
    document.getElementById('community-search')?.addEventListener('input',e=>{query=e.target.value;apply()});
    document.getElementById('community-chips')?.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;active=b.dataset.category;document.querySelectorAll('#community-chips .chip').forEach(x=>x.classList.toggle('active',x===b));apply()});
  }
  async function bindMap(){
    const result=await NevGenc.repositories.locations();const status=document.getElementById('map-status');await NevGenc.map.init(document.getElementById('map'),result.data,status);
    document.getElementById('map-filters')?.addEventListener('click',e=>{const b=e.target.closest('[data-map-filter]');if(!b)return;document.querySelectorAll('#map-filters .chip').forEach(x=>x.classList.toggle('active',x===b));NevGenc.map.filter(b.dataset.mapFilter)});
    document.getElementById('location-list')?.addEventListener('click',e=>{const b=e.target.closest('[data-location-id]');if(!b)return;document.querySelectorAll('.location-item').forEach(x=>x.classList.toggle('active',x===b));NevGenc.map.focus(b.dataset.locationId)});
    document.getElementById('transport-lines')?.addEventListener('click',async e=>{
      const b=e.target.closest('[data-line-code]');if(!b)return;const code=b.dataset.lineCode;
      document.querySelectorAll('.line-chip').forEach(x=>x.classList.toggle('active',x===b));
      document.querySelectorAll('#map-filters .chip').forEach(x=>x.classList.toggle('active',x.dataset.mapFilter==='transport'));
      NevGenc.map.filter('transport');
      const detail=document.getElementById('transport-detail');detail.innerHTML='<div class="skeleton" style="height:90px"></div>';
      const result=await NevGenc.repositories.transportLineDetail(code);if(!result){detail.innerHTML='<p>Hat bilgisi bulunamadı.</p>';return}
      detail.innerHTML=NevGenc.views.transportDetail(result.data,result.source);NevGenc.map.showTransportLine(result.data);
    });
    document.getElementById('transport-detail')?.addEventListener('click',e=>{
      const row=e.target.closest('[data-stop-lat][data-stop-lng]');if(!row)return;
      NevGenc.map.focusStop(row.dataset.stopLat,row.dataset.stopLng,row.dataset.stopName||'Durak');
    });
    document.getElementById('transport-detail')?.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;const row=e.target.closest('[data-stop-lat][data-stop-lng]');if(!row)return;e.preventDefault();NevGenc.map.focusStop(row.dataset.stopLat,row.dataset.stopLng,row.dataset.stopName||'Durak');
    });
  }
  function bindSearch(){
    const overlay=document.getElementById('search-overlay'),input=document.getElementById('global-search-input'),results=document.getElementById('global-search-results');
    const open=()=>{overlay.hidden=false;setTimeout(()=>input.focus(),20)},close=()=>{overlay.hidden=true;input.value='';results.innerHTML=''};
    document.getElementById('global-search-button').addEventListener('click',open);document.getElementById('search-close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    input.addEventListener('input',async()=>{const q=input.value.trim().toLocaleLowerCase('tr');if(q.length<2){results.innerHTML='';return}const [cs,ps,as]=await Promise.all([NevGenc.repositories.communities(),NevGenc.repositories.partners(),NevGenc.repositories.announcements()]);const items=[...cs.data.map(x=>({...x,_name:x.name,_type:'Topluluk',_route:'#/topluluklar'})),...ps.data.map(x=>({...x,_name:x.name,_type:'İşletme',_route:'#/harita'})),...as.data.map(x=>({...x,_name:x.title,_type:'Duyuru',_route:'#/anasayfa'}))].filter(x=>(x._name||'').toLocaleLowerCase('tr').includes(q)).slice(0,10);results.innerHTML=items.map(x=>`<a class="search-result" href="${x._route}"><strong>${x._name}</strong><span>${x._type}</span></a>`).join('')||'<div class="empty-state" style="padding:18px">Sonuç bulunamadı.</div>'});
    results.addEventListener('click',()=>close());document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close()});
  }
  function init(){window.addEventListener('hashchange',render);window.addEventListener('nevgenc:session-changed',()=>render());NevGenc.session.bind();if(!location.hash)location.hash='#/anasayfa';bindSearch();document.getElementById('notifications-button').addEventListener('click',()=>{location.hash='#/anasayfa';toast('Duyurular ana sayfada güncel akış olarak gösteriliyor.')});render();NevGenc.session.requireName()}
  return {init,render,toast};
})();
window.addEventListener('DOMContentLoaded',NevGenc.app.init);
