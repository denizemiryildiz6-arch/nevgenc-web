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
    bus:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="16" rx="3"/><path d="M7 19v2M17 19v2M4 11h16M8 15h.01M16 15h.01"/></svg>',
    food:'<svg viewBox="0 0 24 24"><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h6V3h-3ZM17 11v10"/></svg>',
    clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
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
          <article class="side-card card service-shortcuts"><span class="eyebrow">KAMPÜS HİZMETLERİ</span><div class="service-shortcut-grid"><a href="#/kutuphane"><span class="mini-service-icon">${icon.library}</span><strong>Kütüphane</strong><small>Randevu oluştur</small></a><a href="#/yemek"><span class="mini-service-icon">${icon.food}</span><strong>Yemek</strong><small>Güncel menü</small></a><a href="#/takvim"><span class="mini-service-icon">${icon.calendar}</span><strong>Takvim</strong><small>Planlarını gör</small></a></div></article>
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
    return `<button class="transport-detail-close" type="button" data-close-transport-detail aria-label="Hat detayını kapat">×</button><div class="transport-detail-head"><div><span class="line-badge">${e(line.code)}</span><strong>${e(line.name)}</strong></div>${source?sourceBadge(source):''}</div><div class="transport-stop-summary"><strong>${stops.length} durak</strong> · ${e(line.direction||'Gidiş')} · <strong>${mapped.length} konum haritada</strong></div>${mapped.length?`<div class="transport-map-note">Konumu doğrulanmış duraklar mavi işaretle gösterilir. Listedeki işaretli durağa dokunarak haritada odaklanabilirsiniz.</div>`:`<div class="transport-map-note">Bu hattın resmî durak sırası mevcut; nokta koordinatları eklendikçe duraklar haritada açılır.</div>`}<ol class="transport-stop-list">${stops.map(s=>{const has=Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lng));return `<li class="${has?'has-map-point':''}" ${has?`data-stop-lat="${Number(s.lat)}" data-stop-lng="${Number(s.lng)}" data-stop-name="${e(s.name||'')}" tabindex="0" role="button"`:''}><span>${s.order}</span><strong>${e(s.name||'')}</strong>${has?'<i title="Haritada mevcut">●</i>':''}</li>`}).join('')}</ol>${line.sourceUrl?`<a class="button small" target="_blank" rel="noopener" href="${e(line.sourceUrl)}">SAKUS'ta canlı hattı aç</a>`:''}`;
  }

  function isoDateLocal(date=new Date()){
    const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;
  }
  function trDay(v){try{return new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long'}).format(new Date(v))}catch{return v||''}}
  function trDateTime(v){try{return new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return v||''}}
  async function libraryView(){
    const [spaces,reservations]=await Promise.all([NevGenc.repositories.librarySpaces(),NevGenc.repositories.libraryReservations()]);
    const lib=NevGenc.seed.library||NevGenc.officialData.library||{};
    const active=reservations.data.filter(x=>x.status!=='cancelled'&&new Date(x.endsAt)>new Date()).sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt));
    const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
    return `<section class="page service-page"><div class="secondary-page-head"><a href="#/anasayfa" class="back-link">← Ana sayfa</a><span class="eyebrow">KAMPÜS HİZMETİ</span><h1>Kütüphane</h1><p>Merkez Kütüphane bilgileri ve NevGenç çalışma alanı randevuları.</p></div>
      <div class="service-layout"><div class="service-main">
        <article class="card library-info-card"><div class="service-card-head"><span class="icon-box">${icon.library}</span><div><h2>${e(lib.name||'SAÜ Merkez Kütüphanesi')}</h2><p>${e(lib.note||'')}</p></div></div><div class="info-facts"><div><strong>${e(String(lib.capacity||'1.650'))}</strong><span>Kişi kapasitesi</span></div><div><strong>7/24</strong><span>A Blok</span></div><div><strong>10.000 m²</strong><span>Hizmet alanı</span></div></div><div class="service-links">${lib.sourceUrl?`<a class="text-link" target="_blank" rel="noopener" href="${e(lib.sourceUrl)}">Resmî kütüphane sayfası ↗</a>`:''}<a class="text-link" href="#/harita">Haritada göster →</a></div></article>
        <article class="card reservation-card"><div class="section-head"><div><span class="eyebrow">RANDEVU</span><h2>Çalışma alanı ayır</h2><p>Randevun Takvim bölümüne otomatik eklenir.</p></div>${sourceBadge(spaces.source)}</div>
          <form id="library-reservation-form" class="reservation-form">
            <label><span>Alan</span><select id="reservation-space" required>${spaces.data.map(x=>`<option value="${e(x.id)}">${e(x.name)}</option>`).join('')}</select></label>
            <label><span>Tarih</span><input id="reservation-date" type="date" min="${isoDateLocal()}" value="${isoDateLocal(tomorrow)}" required></label>
            <label><span>Başlangıç</span><select id="reservation-start" required>${['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t=>`<option>${t}</option>`).join('')}</select></label>
            <label><span>Bitiş</span><select id="reservation-end" required>${['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map((t,i)=>`<option ${i===1?'selected':''}>${t}</option>`).join('')}</select></label>
            <button class="button primary reservation-submit" type="submit">Randevu oluştur</button>
          </form><p class="form-note">Canlı masa doluluğu gösterilmez; yalnızca sistemde tanımlı randevu alanları üzerinden kayıt oluşturulur.</p>
        </article>
      </div><aside class="service-side"><article class="card upcoming-card"><span class="eyebrow">RANDEVULARIM</span><h3>Yaklaşan randevular</h3><div id="reservation-list" class="reservation-list">${active.length?active.map(r=>`<div class="reservation-row" data-reservation-id="${e(r.id)}"><div><strong>${e(r.spaceName||'Çalışma alanı')}</strong><span>${e(trDateTime(r.startsAt))} – ${e(new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'}).format(new Date(r.endsAt)))}</span></div><button class="plain-danger" data-cancel-reservation="${e(r.id)}">İptal</button></div>`).join(''):'<div class="empty-mini">Yaklaşan randevun yok.</div>'}</div><a class="button small" href="#/takvim">Takvimimi aç</a></article></aside></div></section>`;
  }
  async function diningView(){
    const today=new Date();const end=new Date(today);end.setDate(end.getDate()+6);
    const [menu,week]=await Promise.all([NevGenc.repositories.diningMenu(today),NevGenc.repositories.diningMenusRange(today,end)]);
    const officialUrl=NevGenc.config.sources.diningMenu;
    const items=menu.data?.items||[];
    return `<section class="page service-page"><div class="secondary-page-head"><a href="#/anasayfa" class="back-link">← Ana sayfa</a><span class="eyebrow">SAÜ YEMEKHANE</span><h1>Yemek Menüsü</h1><p>Yemek bilgileri SAÜ SABİS menü kaynağıyla eşleştirilir; doğrulanmayan yemek adı gösterilmez.</p></div>
      <div class="meal-layout"><article class="card meal-today"><div class="meal-date"><span>BUGÜN</span><strong>${e(trDay(today))}</strong></div>${items.length?`<div class="meal-items">${items.map((x,i)=>`<div class="meal-row"><span>${i+1}</span><strong>${e(x.name)}</strong>${x.calories?`<small>${Number(x.calories)} kcal</small>`:''}</div>`).join('')}</div><div class="source-note">${sourceBadge(menu.source)}</div>`:`<div class="official-menu-empty"><span class="icon-box">${icon.food}</span><h2>Bugünün menüsü henüz NevGenç veritabanına aktarılmamış.</h2><p>Yanlış veya eski yemek adı göstermemek için doğrulanmamış menü yayınlanmıyor.</p><a class="button primary" target="_blank" rel="noopener" href="${e(officialUrl)}">SAÜ güncel menüsünü aç ↗</a></div>`}</article>
      <aside class="card week-menu"><span class="eyebrow">HAFTALIK MENÜ</span><h3>Önümüzdeki günler</h3>${week.data.length?`<div class="week-list">${week.data.map(m=>`<div class="week-day"><strong>${e(trDay(m.menu_date))}</strong><span>${m.items.map(x=>e(x.name)).join(' · ')}</span></div>`).join('')}</div>`:`<p class="muted small">Haftalık kayıtlar Supabase’e aktarıldıkça burada otomatik görünür.</p><a class="text-link" target="_blank" rel="noopener" href="${e(officialUrl)}">Aylık menüyü SABİS’te görüntüle ↗</a>`}</aside></div></section>`;
  }
  async function calendarView(){
    const [announcements,responses,reservations]=await Promise.all([NevGenc.repositories.announcements(),NevGenc.repositories.announcementResponses(),NevGenc.repositories.libraryReservations()]);
    const events=announcements.data.filter(a=>responses[a.slug]==='attending').map(a=>({type:'event',title:a.title,when:a.eventStart||a.publishedAt,location:a.location||'',url:a.url||''}));
    const res=reservations.data.filter(x=>x.status!=='cancelled').map(x=>({type:'library',title:x.spaceName||'Kütüphane randevusu',when:x.startsAt,end:x.endsAt,location:'SAÜ Merkez Kütüphanesi'}));
    const all=[...events,...res].filter(x=>x.when).sort((a,b)=>new Date(a.when)-new Date(b.when));
    return `<section class="page service-page"><div class="secondary-page-head"><a href="#/profil" class="back-link">← Profil</a><span class="eyebrow">KİŞİSEL PLAN</span><h1>Takvimim</h1><p>“Katılacağım” dediğin etkinlikler ve kütüphane randevuların burada birlikte görünür.</p></div><div class="calendar-list">${all.length?all.map(x=>`<article class="card calendar-row"><div class="calendar-datebox"><strong>${e(new Intl.DateTimeFormat('tr-TR',{day:'2-digit'}).format(new Date(x.when)))}</strong><span>${e(new Intl.DateTimeFormat('tr-TR',{month:'short'}).format(new Date(x.when)))}</span></div><div><span class="pill ${x.type==='library'?'':'blue'}">${x.type==='library'?'Kütüphane':'Etkinlik'}</span><h3>${e(x.title)}</h3><p>${e(trDateTime(x.when))}${x.location?` · ${e(x.location)}`:''}</p>${x.url?`<a class="text-link" target="_blank" rel="noopener" href="${e(x.url)}">Duyuruyu aç ↗</a>`:''}</div></article>`).join(''):'<div class="empty-state">Takviminde henüz kayıt yok. Duyurularda “Katılacağım” seçebilir veya kütüphane randevusu oluşturabilirsin.</div>'}</div></section>`;
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
    return `<section class="page"><div class="page-title"><div><span class="eyebrow">HESABIM</span><h1>Profil</h1></div></div><article class="profile-card card"><div class="profile-header"><div class="avatar">${e(name).charAt(0).toUpperCase()}</div><div class="profile-identity"><h2>${e(name)}</h2><p class="muted small">${e(subtitle)}</p></div></div><div class="profile-stats"><div class="profile-stat"><strong>${Number(p.n_points||0)}</strong><span>N Puan</span></div><div class="profile-stat"><strong>${followed.size}</strong><span>Takip edilen</span></div><div class="profile-stat"><strong>${attending}</strong><span>Katılacağım</span></div><div class="profile-stat"><strong>${Object.keys(responses).length}</strong><span>Duyuru tercihi</span></div></div><div class="profile-tools"><a href="#/kutuphane"><span>${icon.library}</span><strong>Kütüphane</strong><small>Randevular</small></a><a href="#/yemek"><span>${icon.food}</span><strong>Yemek</strong><small>Güncel menü</small></a><a href="#/takvim"><span>${icon.calendar}</span><strong>Takvimim</strong><small>Etkinlikler</small></a><a href="#/harita"><span>${icon.map}</span><strong>Harita</strong><small>Kampüs & şehir</small></a></div><div class="profile-actions"><button class="button" data-edit-profile-name>Adı değiştir</button><button class="button subtle-danger" data-sign-out>Çıkış yap</button></div>${data.local?`<div class="profile-session-note">Bu sürümde kullanıcı adı bu cihazda saklanır. Parola veya hesap doğrulaması kullanılmaz.</div>`:''}</article></section>`;
  }
  return {home,communities,mapView,opportunities,profile,libraryView,diningView,calendarView,communityCards,announcementCards,transportDetail};
})();
