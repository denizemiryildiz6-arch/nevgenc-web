window.NevGenc = window.NevGenc || {};
NevGenc.views = (()=>{
  const e=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const icon={
    map:'<svg viewBox="0 0 24 24"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>',
    users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.4-4 2.4-6 5.5-6s5.1 2 5.5 6"/><path d="M16 6.5a2.7 2.7 0 0 1 0 5.1M16.5 14.5c2.5.5 3.8 2.3 4 5.5"/></svg>',
    library:'<svg viewBox="0 0 24 24"><path d="M4 5a4 4 0 0 1 4-2h4v18H8a4 4 0 0 0-4 2V5ZM20 5a4 4 0 0 0-4-2h-4v18h4a4 4 0 0 1 4 2V5Z"/></svg>',
    brief:'<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"/></svg>',
    store:'<svg viewBox="0 0 24 24"><path d="M4 10h16M5 10l1-5h12l1 5M6 10v9h12v-9M9 19v-5h6v5"/></svg>',
    bell:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 6-2.5 7-2.5 9h17c0-2-2.5-3-2.5-9Z"/><path d="M10 21h4"/></svg>',
    calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>',
    check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>',
    external:'<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>',
    bus:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="16" rx="3"/><path d="M7 19v2M17 19v2M4 11h16M8 15h.01M16 15h.01"/></svg>'
  };
  function sourceBadge(source){return `<span class="data-badge">${source==='supabase'?'Canlı veri':'Resmî kaynak'}</span>`}
  function fmtDate(v){if(!v)return '';try{return new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(v))}catch{return ''}}
  function fmtDateTime(v){if(!v)return '';try{return new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return ''}}
  function sourceLabel(type){return type==='municipality'?'Serdivan Belediyesi':type==='community'?'Topluluk':'Sakarya Üniversitesi'}
  function announcementCards(items,followed=new Set(),responses={}){
    if(!items.length)return '<div class="empty-state">Bu filtrede gösterilecek duyuru bulunmuyor.</div>';
    const now=Date.now();
    return items.map(a=>{
      const sourceClass=e(a.sourceType||'university');
      const eventFuture=a.eventStart?new Date(a.eventStart).getTime()>=now:Boolean(a.isEvent && a.eventRangeText);
      const response=responses[a.slug];
      const followedSource=a.communitySlug&&followed.has(a.communitySlug);
      return `<article class="announcement-card card ${a.isPinned?'pinned':''}" data-announcement-card data-source-type="${sourceClass}" data-community-slug="${e(a.communitySlug||'')}">
        <div class="announcement-accent ${sourceClass}"></div>
        <div class="announcement-head">
          <div class="announcement-source"><span class="source-dot ${sourceClass}"></span><strong>${e(a.sourceName||sourceLabel(a.sourceType))}</strong><span>${e(a.kind||'Duyuru')}</span></div>
          <span class="announcement-date">${e(fmtDate(a.publishedAt)||a.eventRangeText||'')}</span>
        </div>
        <h2>${e(a.title)}</h2>
        <p>${e(a.summary||'')}</p>
        <div class="announcement-meta">
          ${a.eventRangeText?`<span>${icon.calendar}${e(a.eventRangeText)}</span>`:''}
          ${a.eventStart?`<span>${icon.calendar}${e(fmtDateTime(a.eventStart))}</span>`:''}
          ${a.location?`<span>${icon.map}${e(a.location)}</span>`:''}
          ${a.deadlineText?`<span class="deadline">${e(a.deadlineText)}</span>`:''}
        </div>
        <div class="announcement-actions">
          ${eventFuture?`<button class="action-button ${response==='attending'?'active':''}" data-announcement-response="attending" data-announcement-slug="${e(a.slug)}">${icon.check}<span>${response==='attending'?'Katılacağım ✓':'Katılacağım'}</span></button>`:''}
          <button class="action-button ${response==='interested'?'active':''}" data-announcement-response="interested" data-announcement-slug="${e(a.slug)}">${icon.bell}<span>${response==='interested'?'İlgileniyorum ✓':'İlgileniyorum'}</span></button>
          ${a.communitySlug?`<button class="action-button ${followedSource?'active':''}" data-follow-community="${e(a.communitySlug)}">${icon.users}<span>${followedSource?'Takip ediliyor':'Topluluğu takip et'}</span></button>`:''}
          ${a.url?`<a class="announcement-link" href="${e(a.url)}" target="_blank" rel="noopener">Kaynağa git ${icon.external}</a>`:''}
        </div>
      </article>`;
    }).join('');
  }

  async function home(){
    const [announcements,followed,responses,partners]=await Promise.all([
      NevGenc.repositories.announcements(),
      NevGenc.repositories.followedCommunitySlugs(),
      NevGenc.repositories.announcementResponses(),
      NevGenc.repositories.partners()
    ]);
    const pinned=announcements.data.filter(x=>x.isPinned).length;
    return `<section class="page home-feed-page" data-home-feed>
      <div class="feed-header">
        <div><span class="eyebrow">NEVGENÇ DUYURU MERKEZİ</span><h1>Duyurular</h1><p>Üniversite, belediye ve öğrenci topluluklarından öğrenciyi ilgilendiren güncel duyurular tek akışta.</p></div>
        <div class="feed-summary card"><strong>${announcements.data.length}</strong><span>güncel kayıt</span><i></i><strong>${pinned}</strong><span>öne çıkan</span></div>
      </div>
      <div class="feed-toolbar card">
        <div class="feed-filters" id="announcement-filters">
          <button class="chip active" data-announcement-filter="all">Tümü</button>
          <button class="chip" data-announcement-filter="university">Üniversite</button>
          <button class="chip" data-announcement-filter="municipality">Belediye</button>
          <button class="chip" data-announcement-filter="community">Topluluklar</button>
          <button class="chip" data-announcement-filter="following">Takip Ettiklerim</button>
        </div>
        <span class="feed-source">${sourceBadge(announcements.source)}</span>
      </div>
      <div class="home-content-grid">
        <div><div id="announcement-feed" class="announcement-feed">${announcementCards(announcements.data,followed,responses)}</div></div>
        <aside class="home-sidebar">
          <article class="side-card card"><div class="side-card-title"><span class="icon-box compact">${icon.map}</span><div><span class="eyebrow">KAMPÜS & SERDİVAN</span><h3>Harita</h3></div></div><p>Kütüphane, yemekhane, anlaşmalı işletmeler ve kampüs ulaşım hatlarını görüntüle.</p><a class="button small primary" href="#/harita">Haritayı aç</a></article>
          <article class="side-card card"><div class="side-card-title"><span class="icon-box compact">${icon.users}</span><div><span class="eyebrow">TOPLULUKLAR</span><h3>Takip ettiğin topluluklar</h3></div></div><p>${followed.size?`${followed.size} topluluğu takip ediyorsun. Duyuruları ana akışta filtreleyebilirsin.`:'Toplulukları takip ederek onların duyurularını ana sayfada ayrı filtreleyebilirsin.'}</p><a class="button small" href="#/topluluklar">Toplulukları keşfet</a></article>
          <article class="side-card card"><span class="eyebrow">ANLAŞMALI İŞLETMELER</span><div class="side-number">${partners.data.length}</div><p>Doğrulanmış NevGenç anlaşmalı işletme.</p><a class="text-link" href="#/firsatlar">Avantajları gör →</a></article>
        </aside>
      </div>
    </section>`;
  }

  async function communities(){
    const [result,followed]=await Promise.all([NevGenc.repositories.communities(),NevGenc.repositories.followedCommunitySlugs()]);
    const cats=['Tümü',...NevGenc.seed.communityCategories];
    return `<section class="page" data-community-page><div class="page-title"><div><span class="eyebrow">SAÜ ÖĞRENCİ TOPLULUKLARI</span><h1>Topluluklar</h1><p>Toplulukları keşfet, resmî hesaplarına ulaş ve takip ederek duyurularını ana sayfada öne çıkar.</p></div>${sourceBadge(result.source)}</div>
      <div class="toolbar"><label class="search-field"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><input id="community-search" placeholder="Topluluk ara…"></label><div class="chips" id="community-chips">${cats.map((c,i)=>`<button class="chip ${i===0?'active':''}" data-category="${e(c)}">${e(c)}</button>`).join('')}</div></div>
      <div class="community-grid" id="community-grid">${communityCards(result.data,followed)}</div></section>`;
  }
  function communityCards(items,followed=new Set()){
    return items.length?items.map(c=>`<article class="community-card card" data-community-card="${e(c.slug||c.id)}"><div class="community-card-top"><div class="category">${e(c.category||'Topluluk')}</div><button class="follow-button ${followed.has(c.slug||c.id)?'active':''}" data-follow-community="${e(c.slug||c.id)}">${followed.has(c.slug||c.id)?'Takip ediliyor':'Takip et'}</button></div><h3>${e(c.name)}</h3><p>${c.description?e(c.description):'Topluluğun doğrulanmış açıklaması bulunduğunda bu alanda gösterilir.'}</p><div class="community-actions"><a class="social" href="${e(c.social_url||c.socialUrl||c.source_url||c.sourceUrl||NevGenc.config.sources.communities)}" target="_blank" rel="noopener">Resmî bağlantı ↗</a></div></article>`).join(''):`<div class="empty-state">Eşleşen topluluk bulunamadı.</div>`;
  }

  async function mapView(){
    const [locations,lines]=await Promise.all([NevGenc.repositories.locations(),NevGenc.repositories.transportLines()]);
    return `<section class="page map-page"><div class="map-layout"><aside class="map-panel card">
      <div class="map-panel-head"><span class="eyebrow">SAKARYA · SERDİVAN · KAMPÜS</span><h1>Harita</h1><p>Kampüs noktalarını, anlaşmalı işletmeleri ve belediye ulaşım hatlarını tek haritada görüntüle.</p></div>
      <div class="map-section-label">Konumlar</div>
      <div class="map-filters" id="map-filters"><button class="chip active" data-map-filter="all">Tümü</button><button class="chip" data-map-filter="campus">Kampüs</button><button class="chip" data-map-filter="library">Kütüphane</button><button class="chip" data-map-filter="dining">Yemekhane</button><button class="chip" data-map-filter="partner">İşletmeler</button><button class="chip" data-map-filter="transport">Otobüsler</button></div>
      <div class="location-list" id="location-list">${locations.data.map(x=>`<button class="location-item" data-location-id="${e(x.id)}"><strong>${e(x.name)}</strong><small>${e(x.address||x.category||'')}</small></button>`).join('')}</div>
      <div class="map-section-label transport-label">Kampüs otobüsleri</div>
      <div class="transport-lines" id="transport-lines">${lines.data.map(l=>`<button class="line-chip" data-line-code="${e(l.code)}"><strong>${e(l.code)}</strong><span>${e(l.name)}</span></button>`).join('')}</div>
      <div id="transport-detail" class="transport-detail"><p>Bir hat seçerek durak sırasını ve varsa harita güzergâhını görüntüleyin.</p></div>
      <div class="source-note">Ulaşım kaynağı: <a href="${e(NevGenc.config.sources.transport)}" target="_blank" rel="noopener">Sakarya Büyükşehir Belediyesi SAKUS</a></div>
    </aside><div class="map-card"><div id="map" class="map-canvas"></div><div class="map-legend" aria-label="Harita açıklaması"><span><i class="legend-dot campus"></i>Kampüs</span><span><i class="legend-dot library"></i>Kütüphane</span><span><i class="legend-dot dining"></i>Yemekhane</span><span><i class="legend-dot partner"></i>Anlaşmalı işletme</span><span><i class="legend-dot stop"></i>Otobüs durağı</span></div><div class="map-status" id="map-status">Harita hazırlanıyor…</div></div></div></section>`;
  }
  function transportDetail(line,source){
    if(!line)return '<p>Hat bilgisi bulunamadı.</p>';
    const known=NevGenc.officialData.knownStopCoordinates||{};
    const stops=(line.stops||[]).map((s,i)=>{
      const item=typeof s==='string'?{name:s}:{...s};
      const p=known[item.name];
      return {...item,order:i+1,lat:item.lat??item.latitude??p?.lat??null,lng:item.lng??item.longitude??p?.lng??null};
    });
    const mapped=stops.filter(s=>Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lng)));
    return `<div class="transport-detail-head"><div><span class="line-badge">${e(line.code)}</span><strong>${e(line.name)}</strong></div>${source?sourceBadge(source):''}</div><div class="transport-stop-summary"><strong>${stops.length} durak</strong> · ${e(line.direction||'Gidiş')} · <strong>${mapped.length} konum haritada</strong></div>${mapped.length?`<div class="transport-map-note">Konumu doğrulanmış duraklar mavi işaretle gösterilir. Listedeki işaretli durağa dokunarak haritada odaklanabilirsiniz.</div>`:`<div class="transport-map-note">Bu hattın resmî durak sırası mevcut; nokta koordinatları eklendikçe duraklar haritada açılır.</div>`}<ol class="transport-stop-list">${stops.map(s=>{const has=Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lng));return `<li class="${has?'has-map-point':''}" ${has?`data-stop-lat="${Number(s.lat)}" data-stop-lng="${Number(s.lng)}" data-stop-name="${e(s.name||'')}" tabindex="0" role="button"`:''}><span>${s.order}</span><strong>${e(s.name||'')}</strong>${has?'<i title="Haritada mevcut">●</i>':''}</li>`}).join('')}</ol>${line.sourceUrl?`<a class="button small" target="_blank" rel="noopener" href="${e(line.sourceUrl)}">SAKUS'ta canlı hattı aç</a>`:''}`;
  }

  async function opportunities(){
    const result=await NevGenc.repositories.opportunities();
    const partners=(await NevGenc.repositories.partners()).data;
    return `<section class="page"><div class="page-title"><div><span class="eyebrow">ÖĞRENCİ FIRSATLARI</span><h1>Fırsatlar</h1><p>Staj, burs, yarışma, gönüllülük ve NevGenç anlaşmalı işletme avantajları.</p></div>${sourceBadge(result.source)}</div>
      <section class="section"><div class="section-head"><div><h2>Aktif fırsatlar</h2><p>Doğrulanmış ve yayınlanmış kayıtlar.</p></div></div>${result.data.length?`<div class="opportunity-grid">${result.data.map(o=>`<article class="op-card card"><div class="op-top"><span class="pill blue">${e(o.type||'Fırsat')}</span><span class="date">${e(o.deadline||'')}</span></div><h3>${e(o.title)}</h3><p>${e(o.summary||'')}</p><footer><span>${e(o.organization||'')}</span>${o.url?`<a class="text-link" target="_blank" rel="noopener" href="${e(o.url)}">Detay ↗</a>`:''}</footer></article>`).join('')}</div>`:`<div class="empty-state">Şu anda yayınlanmış doğrulanmış fırsat bulunmuyor.</div>`}</section>
      <section class="section"><div class="section-head"><div><h2>Anlaşmalı işletmeler</h2><p>İndirim oranı doğrulanmayan işletmelerde oran gösterilmez.</p></div></div><div class="grid-3">${partners.map(p=>`<article class="partner-card card"><div class="partner-logo">${e(p.name).charAt(0)}</div><div><h3>${e(p.name)}</h3><p>${e(p.category||'')}<br>${e(p.address||'')}</p><div class="partner-meta"><span class="pill blue">NevGenç Anlaşmalı</span></div></div></article>`).join('')}</div></section></section>`;
  }
  async function profile(){
    const data=await NevGenc.repositories.profile();
    const followed=await NevGenc.repositories.followedCommunitySlugs();
    const responses=await NevGenc.repositories.announcementResponses();
    const attending=Object.values(responses).filter(x=>x==='attending').length;
    if(!data) return `<section class="page"><div class="profile-gate card"><span class="icon-box">${icon.users}</span><span class="eyebrow">HESAP</span><h1 style="font-size:32px;margin-top:8px">Profil</h1><p>NevGenç’i kişiselleştirmek için yalnızca adını girmen yeterli. Bu sürümde şifre kullanılmaz.</p><div class="profile-stats compact-stats"><div class="profile-stat"><strong>${followed.size}</strong><span>Takip</span></div><div class="profile-stat"><strong>${attending}</strong><span>Katılacağım</span></div></div><button class="button primary" data-open-name-login>Giriş Yap</button></div></section>`;
    const p=data.profile||{};
    const session=NevGenc.session?.get?.();
    const name=p.full_name||session?.name||data.user?.email||'Kullanıcı';
    const subtitle=data.local?'NevGenç kullanıcısı':(p.department||data.user?.email||'NevGenç kullanıcısı');
    return `<section class="page"><div class="page-title"><div><span class="eyebrow">HESABIM</span><h1>Profil</h1></div></div><article class="profile-card card"><div class="profile-header"><div class="avatar">${e(name).charAt(0).toUpperCase()}</div><div class="profile-identity"><h2>${e(name)}</h2><p class="muted small">${e(subtitle)}</p></div></div><div class="profile-stats"><div class="profile-stat"><strong>${Number(p.n_points||0)}</strong><span>N Puan</span></div><div class="profile-stat"><strong>${followed.size}</strong><span>Takip edilen</span></div><div class="profile-stat"><strong>${attending}</strong><span>Katılacağım</span></div><div class="profile-stat"><strong>${Object.keys(responses).length}</strong><span>Duyuru tercihi</span></div></div><div class="profile-actions"><button class="button" data-edit-profile-name>Adı değiştir</button><button class="button subtle-danger" data-sign-out>Çıkış yap</button></div>${data.local?`<div class="profile-session-note">Bu sürümde kullanıcı adı bu cihazda saklanır. Parola veya hesap doğrulaması kullanılmaz.</div>`:''}</article></section>`;
  }
  return {home,communities,mapView,opportunities,profile,communityCards,announcementCards,transportDetail};
})();
