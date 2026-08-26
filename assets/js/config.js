window.NevGenc = window.NevGenc || {};
NevGenc.config = {
  appName: 'NevGenç',
  defaultRoute: 'anasayfa',
  supabase: {
    url: '',
    anonKey: ''
  },
  map: {
    center: [40.741009, 30.332767],
    zoom: 13,
    tiles: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors · Ulaşım verisi: Sakarya Büyükşehir Belediyesi SAKUS',
    runtimeGeocoding: false,
    geocodeCacheKey: 'nevgenc-geocode-v2'
  },
  sources: {
    communities: 'https://topluluk.sakarya.edu.tr/',
    library: 'https://kutuphane.sakarya.edu.tr/tr/icerik/10896/43023/kutuphanemiz',
    libraryContact: 'https://kutuphane.sakarya.edu.tr/tr/27111/iletisim',
    diningMenu: 'https://menu.sabis.sakarya.edu.tr/',
    transport: 'https://sakus.sakarya.bel.tr/harita',
    universityNews: 'https://haber.sakarya.edu.tr/',
    universityAnnouncements: 'https://adabis.sakarya.edu.tr/',
    municipality: 'https://www.serdivan.bel.tr/'
  }
};
