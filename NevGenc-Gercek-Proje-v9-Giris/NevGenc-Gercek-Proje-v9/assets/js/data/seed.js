window.NevGenc = window.NevGenc || {};
const d = NevGenc.officialData;
NevGenc.seed = {
  library: d.library,
  dining: d.dining,
  locations: [...d.locations, ...d.partners],
  partners: d.partners,
  communityCategories: [...new Set(d.communities.map(x => x.category))],
  communities: d.communities,
  transportLines: d.transportLines
};
