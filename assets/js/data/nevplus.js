window.NevGenc = window.NevGenc || {};
NevGenc.nevPlusData = {
  verifiedAt: '2026-08-28',
  modules: [
    {id:'game-room', title:'Oyun Odası', description:'Kısa molalar için küçük oyunlar.', icon:'game', href:'#/oyun-odasi', status:'active'},
    {id:'community-news', title:'Topluluk Haberleri', description:'Toplulukların NevGenç paylaşımları tek akışta.', icon:'news', href:'#/topluluk-haberleri', status:'active'},
    {id:'dining', title:'Menüde Ne Var?', description:'SAÜ yemekhane menüsüne hızlı erişim.', icon:'food', href:'#/yemek', status:'active'},
    {id:'jobs', title:'İş İlanları', description:'Staj, iş ve kariyer fırsatları.', icon:'brief', href:'#/firsatlar', status:'active'},
    {id:'marketplace', title:'Kampüs Pazarı', description:'Öğrenciden öğrenciye güvenli ilan alanı.', icon:'market', href:'#/yakinda/kampus-pazari', status:'soon'},
    {id:'library', title:'Kütüphane', description:'Çalışma alanı randevusu aktif; canlı doluluk entegrasyonu hazırlanıyor.', icon:'library', href:'#/kutuphane', status:'active'},
    {id:'student-friendly', title:'En Ucuz Nerede Yerim?', description:'Öğrenci dostu işletmeler; doğrulanmış fiyat karşılaştırması kademeli açılacak.', icon:'wallet', href:'#/ogrenci-dostu', status:'active'},
    {id:'facilities', title:'Serdivan Sosyal Tesisleri', description:'Belediyenin sosyal tesis ve kütüphanelerine hızlı erişim.', icon:'facility', href:'#/sosyal-tesisler', status:'active'}
  ],
  facilities: [
    {name:'Gölpark', type:'Sosyal tesis / park', address:'Esentepe Mahallesi, İstanbul Caddesi, Serdivan / Sakarya', sourceUrl:'https://serdivan.bel.tr/tesislerimiz'},
    {name:'Millet Bahçesi', type:'Millet bahçesi / kafeterya', address:'Arabacıalanı Mahallesi, 559. Sokak üzeri yeşil alan, Serdivan / Sakarya', sourceUrl:'https://serdivan.bel.tr/tesislerimiz'},
    {name:'Kırantepe Sosyal Tesisleri', type:'Sosyal tesis', address:'Kemalpaşa Mahallesi, 48. Sokak yeşil alan, Serdivan / Sakarya', sourceUrl:'https://serdivan.bel.tr/tesislerimiz'},
    {name:'Yıldız Kafe Çay Bahçesi', type:'Kafe / çay bahçesi', address:'Arabacıalanı Mahallesi, 530. Sokak üzeri yeşil alan, Serdivan / Sakarya', sourceUrl:'https://serdivan.bel.tr/tesislerimiz'},
    {name:'Serdivan Çay Ocağı', type:'Çay ocağı', address:'İstiklal Mahallesi, Bağlar Caddesi Park Sokak, Karakol yanı, Serdivan / Sakarya', sourceUrl:'https://serdivan.bel.tr/tesislerimiz'}
  ],
  libraries: [
    {name:'Şehit Mehmet Öztürk Kütüphanesi ve İnternet Evi', address:'Serdivan / Sakarya', sourceUrl:'https://serdivan.bel.tr/haberler/sehit-mehmet-oeztuerk-kuetuephanesi-cocuklara-oezel-atoelyeler'},
    {name:'Serdivan Kültür Sanat Kütüphanesi', address:'Arabacıalanı Mahallesi, 541. Sokak No:14, Serdivan / Sakarya', sourceUrl:'https://serdivan.bel.tr/Serdivan%20Belediyesi%202026%20Performans%20Programi.pdf'}
  ],
  sources: {
    facilities:'https://serdivan.bel.tr/tesislerimiz',
    serdivanCepteSingleAccount:'https://serdivan.bel.tr/haberler/serdivan-da-dijital-doenuesuem-teknolojiyle-daha-hizli-daha-gueclue-hizmet'
  }
};
