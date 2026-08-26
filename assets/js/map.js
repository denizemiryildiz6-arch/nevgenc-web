window.NevGenc = window.NevGenc || {};
NevGenc.map = (() => {
  let map = null;
  let markers = [];
  let routeLayers = [];
  let routeStopMarkers = [];
  let overviewStopMarkers = [];
  let statusEl = null;
  let allLocations = [];
  let activeFilter = 'all';
  let selectedLine = null;
  let resizeHandler = null;
  let resizeTimer = null;

  const iconSvg = {
    partner:'<svg viewBox="0 0 24 24"><path d="M4 10h16M5 10l1-5h12l1 5M6 10v9h12v-9M9 19v-5h6v5"/></svg>',
    library:'<svg viewBox="0 0 24 24"><path d="M4 5a4 4 0 0 1 4-2h4v18H8a4 4 0 0 0-4 2V5ZM20 5a4 4 0 0 0-4-2h-4v18h4a4 4 0 0 1 4 2V5Z"/></svg>',
    dining:'<svg viewBox="0 0 24 24"><path d="M6 3v8M9 3v8M6 7h3M7.5 11v10M15 3v8a3 3 0 0 0 3 3V3M18 14v7"/></svg>',
    campus:'<svg viewBox="0 0 24 24"><path d="m3 10 9-6 9 6-9 4-9-4Z"/><path d="M6 12v5c4 3 8 3 12 0v-5"/></svg>',
    stop:'<svg viewBox="0 0 24 24"><path d="M7 4h10a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h2M14 12h2M8 17l-1 3M16 17l1 3"/></svg>'
  };

  function leafletIcon(type){
    return L.divIcon({
      className:'',
      html:`<div class="marker-pin ${type}">${iconSvg[type]||iconSvg.campus}</div>`,
      iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-18]
    });
  }
  function stopIcon(order){
    return L.divIcon({
      className:'',
      html:`<div class="route-stop-pin">${order}</div>`,
      iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-12]
    });
  }
  function overviewStopIcon(){
    return L.divIcon({
      className:'',
      html:`<div class="marker-pin stop overview-stop">${iconSvg.stop}</div>`,
      iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-16]
    });
  }
  function escape(s=''){
    return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function validPoint(x){
    return Number.isFinite(Number(x?.lat)) && Number.isFinite(Number(x?.lng));
  }
  function popupHtml(x){
    const query=validPoint(x)?`${x.lat},${x.lng}`:(x.address||x.name);
    const maps=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    const serviceLink=x.type==='library'?'<a href="#/kutuphane">Kütüphane ve randevu →</a>':x.type==='dining'?'<a href="#/yemek">Yemek menüsünü aç →</a>':'';
    return `<div class="map-popup"><h3>${escape(x.name)}</h3><p>${escape(x.address||x.category||'')}</p>${x.phone?`<p>${escape(x.phone)}</p>`:''}<div class="map-popup-links">${serviceLink}<a href="${maps}" target="_blank" rel="noopener">Yol tarifi ↗</a></div></div>`;
  }
  function stopPopupHtml(name,sourceUrl,lineCode=''){
    return `<div class="map-popup"><h3>${escape(name)}</h3><p>${lineCode?`Hat ${escape(lineCode)} üzerinde doğrulanmış durak konumu`:'Doğrulanmış belediye otobüs durağı'}</p>${sourceUrl?`<a href="${escape(sourceUrl)}" target="_blank" rel="noopener">Konum kaynağını aç ↗</a>`:''}</div>`;
  }

  function cache(){try{return JSON.parse(localStorage.getItem(NevGenc.config.map.geocodeCacheKey)||'{}')}catch{return {}}}
  function saveCache(data){try{localStorage.setItem(NevGenc.config.map.geocodeCacheKey,JSON.stringify(data))}catch{}}
  async function geocode(location){
    if(validPoint(location)) return location;
    const c=cache(); if(c[location.id]) return {...location,...c[location.id]};
    if(!NevGenc.config.map.runtimeGeocoding) return location;
    try{
      const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=tr&q=${encodeURIComponent(location.address||location.name)}`;
      const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),6500);
      const res=await fetch(url,{headers:{'Accept-Language':'tr'},signal:controller.signal}); clearTimeout(timer);
      if(!res.ok)return location;
      const arr=await res.json(); if(!arr[0])return location;
      const coords={lat:Number(arr[0].lat),lng:Number(arr[0].lon)}; c[location.id]=coords; saveCache(c);
      return {...location,...coords};
    }catch{return location;}
  }

  function addLocationMarker(x){
    if(!validPoint(x) || markers.some(m=>m.__location.id===x.id)) return null;
    const marker=L.marker([Number(x.lat),Number(x.lng)],{icon:leafletIcon(x.type)}).addTo(map).bindPopup(popupHtml(x));
    marker.__location=x; markers.push(marker);
    const show=activeFilter==='all'||activeFilter===x.type;
    if(!show && map.hasLayer(marker)) map.removeLayer(marker);
    return marker;
  }
  function renderKnown(locations){locations.filter(validPoint).forEach(addLocationMarker)}

  function renderTransportOverview(){
    const points=NevGenc.officialData.knownStopCoordinates||{};
    const used=new Set();
    Object.entries(points).forEach(([name,p])=>{
      if(!validPoint(p)) return;
      const coordKey=`${Number(p.lat).toFixed(7)},${Number(p.lng).toFixed(7)}`;
      if(used.has(coordKey)) return;
      used.add(coordKey);
      const marker=L.marker([Number(p.lat),Number(p.lng)],{icon:overviewStopIcon()})
        .bindPopup(stopPopupHtml(name,p.sourceUrl));
      marker.__stop={name,...p};
      overviewStopMarkers.push(marker);
      if(activeFilter==='all'||activeFilter==='transport') marker.addTo(map);
    });
  }

  async function resolveMissingInBackground(locations){
    if(!NevGenc.config.map.runtimeGeocoding) return;
    const missing=locations.filter(x=>!validPoint(x));
    let found=0;
    for(let i=0;i<missing.length;i++){
      if(statusEl)statusEl.textContent=`Adres konumları doğrulanıyor · ${i+1}/${missing.length}`;
      const resolved=await geocode(missing[i]);
      if(validPoint(resolved)){found++;allLocations=allLocations.map(x=>x.id===resolved.id?resolved:x);addLocationMarker(resolved)}
      if(i<missing.length-1)await new Promise(r=>setTimeout(r,1050));
    }
    if(statusEl)statusEl.textContent=`${markers.length} temel konum · ${overviewStopMarkers.length} doğrulanmış durak haritada`;
  }

  function removeLayer(layer){if(map&&map.hasLayer(layer))map.removeLayer(layer)}
  function addLayer(layer){if(map&&!map.hasLayer(layer))layer.addTo(map)}
  function clearRoute(){
    routeLayers.forEach(removeLayer); routeLayers=[];
    routeStopMarkers.forEach(removeLayer); routeStopMarkers=[];
    selectedLine=null;
  }
  function setOverviewVisible(show){overviewStopMarkers.forEach(m=>show?addLayer(m):removeLayer(m))}

  function fitLayers(layers,maxZoom=14){
    if(!map)return;
    const coords=[];
    layers.forEach(layer=>{
      if(layer?.getLatLng){const p=layer.getLatLng();coords.push([p.lat,p.lng]);}
    });
    if(!coords.length)return;
    if(coords.length===1){map.setView(coords[0],Math.min(maxZoom,15),{animate:true});return;}
    map.fitBounds(L.latLngBounds(coords),{padding:[32,32],maxZoom});
  }
  function fitAll(){fitLayers([...markers,...overviewStopMarkers],13)}

  function filter(type){
    activeFilter=type;
    markers.forEach(m=>{
      const show=type==='all'||m.__location.type===type;
      show?addLayer(m):removeLayer(m);
    });

    if(type==='transport'){
      markers.forEach(removeLayer);
      if(selectedLine){setOverviewVisible(false);routeStopMarkers.forEach(addLayer);routeLayers.forEach(addLayer);fitLayers(routeStopMarkers,14)}
      else{setOverviewVisible(true);fitLayers(overviewStopMarkers,13)}
      if(statusEl&&!selectedLine)statusEl.textContent=`${overviewStopMarkers.length} doğrulanmış otobüs durağı haritada · bir hat seçerek durak sırasını görüntüleyin`;
      return;
    }

    if(type==='all'){
      if(selectedLine){setOverviewVisible(false);routeStopMarkers.forEach(addLayer);routeLayers.forEach(addLayer)}
      else setOverviewVisible(true);
      fitAll();
      return;
    }

    clearRoute();
    setOverviewVisible(false);
    const visible=markers.filter(m=>m.__location.type===type);
    fitLayers(visible,15);
    if(statusEl)statusEl.textContent=`${visible.length} ${type==='partner'?'anlaşmalı işletme':'konum'} haritada`;
  }

  async function focus(id){
    let m=markers.find(x=>x.__location.id===id);
    if(!m){
      const loc=allLocations.find(x=>x.id===id);
      if(loc){
        const resolved=await geocode(loc);
        if(validPoint(resolved)){allLocations=allLocations.map(x=>x.id===id?resolved:x);m=addLocationMarker(resolved)}
      }
    }
    if(m){
      activeFilter='all';
      addLayer(m);map.setView(m.getLatLng(),16,{animate:true});m.openPopup();
      if(statusEl)statusEl.textContent=m.__location.name;
    }else if(statusEl)statusEl.textContent='Bu konum için doğrulanmış koordinat bulunmuyor.';
  }

  function focusStop(lat,lng,name='Durak'){
    if(!map||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng)))return;
    map.setView([Number(lat),Number(lng)],16,{animate:true});
    const marker=[...routeStopMarkers,...overviewStopMarkers].find(m=>{
      const p=m.getLatLng();return Math.abs(p.lat-Number(lat))<1e-7&&Math.abs(p.lng-Number(lng))<1e-7;
    });
    if(marker){addLayer(marker);marker.openPopup()}
    if(statusEl)statusEl.textContent=name;
  }

  function parseGeojson(value){
    if(!value)return null;if(typeof value==='object')return value;
    try{return JSON.parse(value)}catch{return null}
  }
  function enrichedStops(line){
    const known=NevGenc.officialData.knownStopCoordinates||{};
    return (line.stops||[]).map((stop,index)=>{
      const item=typeof stop==='string'?{name:stop}:{...stop};
      const k=known[item.name];
      return {
        ...item,order:index+1,
        lat:item.lat??item.latitude??k?.lat??null,
        lng:item.lng??item.longitude??k?.lng??null,
        sourceUrl:item.sourceUrl||item.source_url||k?.sourceUrl||line.sourceUrl
      };
    });
  }

  function showTransportLine(line){
    clearRoute();
    if(!line||!map)return {mappedStops:0,hasRoute:false};
    selectedLine=line;
    setOverviewVisible(false);

    const geo=parseGeojson(line.routeGeojson);
    if(geo){
      try{
        const layer=L.geoJSON(geo,{style:{weight:5,opacity:.82}}).addTo(map);
        routeLayers.push(layer);
      }catch(err){console.warn('[NevGenç] güzergâh geometrisi çizilemedi',err)}
    }

    const stops=enrichedStops(line);
    const mapped=stops.filter(validPoint);
    mapped.forEach(s=>{
      const marker=L.marker([Number(s.lat),Number(s.lng)],{icon:stopIcon(s.order)})
        .addTo(map)
        .bindPopup(stopPopupHtml(s.name,s.sourceUrl,line.code));
      marker.__stop=s;routeStopMarkers.push(marker);
    });

    if(geo&&routeLayers[0]){
      const b=routeLayers[0].getBounds();if(b.isValid())map.fitBounds(b.pad(.12));
    }else if(mapped.length){
      fitLayers(routeStopMarkers,14);
    }else{
      map.setView(NevGenc.config.map.center,NevGenc.config.map.zoom,{animate:true});
    }

    if(statusEl){
      if(geo)statusEl.textContent=`Hat ${line.code} · doğrulanmış güzergâh + ${mapped.length} koordinatlı durak`;
      else statusEl.textContent=`Hat ${line.code} · ${mapped.length}/${stops.length} doğrulanmış durak haritada · tüm duraklar panelde`;
    }
    return {mappedStops:mapped.length,hasRoute:Boolean(geo),totalStops:stops.length};
  }

  async function init(el,locations,status){
    statusEl=status;allLocations=[...locations];
    if(!window.L){if(statusEl)statusEl.textContent='Harita bileşeni yüklenemedi.';return []}
    if(resizeHandler){window.removeEventListener('resize',resizeHandler);window.visualViewport?.removeEventListener('resize',resizeHandler);resizeHandler=null}
    if(map){map.remove();map=null}
    markers=[];routeLayers=[];routeStopMarkers=[];overviewStopMarkers=[];activeFilter='all';selectedLine=null;
    const mobile=window.matchMedia('(max-width: 680px)').matches;
    map=L.map(el,{zoomControl:true,preferCanvas:true,inertia:true,bounceAtZoomLimits:false,scrollWheelZoom:!mobile}).setView(NevGenc.config.map.center,NevGenc.config.map.zoom);
    if(mobile)map.zoomControl.setPosition('bottomright');
    L.tileLayer(NevGenc.config.map.tiles,{maxZoom:19,attribution:NevGenc.config.map.attribution}).addTo(map);
    renderKnown(allLocations);
    renderTransportOverview();
    setTimeout(()=>{map.invalidateSize({pan:false});fitAll()},120);
    resizeHandler=()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{if(map)map.invalidateSize({pan:false,animate:false})},90);
    };
    window.addEventListener('resize',resizeHandler,{passive:true});
    window.visualViewport?.addEventListener('resize',resizeHandler,{passive:true});
    if(statusEl)statusEl.textContent=`${markers.length} temel konum · ${overviewStopMarkers.length} doğrulanmış otobüs durağı haritada`;
    resolveMissingInBackground(allLocations);
    return allLocations;
  }

  return {init,filter,focus,focusStop,showTransportLine,clearTransport:clearRoute};
})();
