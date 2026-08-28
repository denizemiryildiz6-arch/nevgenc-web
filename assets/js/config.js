window.NevGenc = window.NevGenc || {};
NevGenc.config = {
  defaultRoute: 'etkinlikler',
  supabase: {
    url: 'https://PROJECT_ID.supabase.co',
    anonKey: 'YOUR_PUBLISHABLE_KEY'
  },
  sources: {
    communities: 'https://topluluk.sakarya.edu.tr/',
    diningMenu: 'https://menu.sabis.sakarya.edu.tr/'
  },
  map: {
    center: [40.7429, 30.3334],
    zoom: 13,
    tiles: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    runtimeGeocoding: false,
    geocodeCacheKey: 'nevgenc-geocode-cache-v1'
  }
};
