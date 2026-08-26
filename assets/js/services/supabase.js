window.NevGenc = window.NevGenc || {};
NevGenc.supabase = (() => {
  let client = null;
  function isConfigured(){
    const {url,anonKey}=NevGenc.config.supabase;
    return Boolean(url && anonKey && window.supabase?.createClient);
  }
  function getClient(){
    if(!isConfigured()) return null;
    if(!client) client = window.supabase.createClient(NevGenc.config.supabase.url,NevGenc.config.supabase.anonKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    return client;
  }
  async function currentUser(){
    const c=getClient(); if(!c) return null;
    const {data,error}=await c.auth.getUser(); if(error) return null;
    return data.user || null;
  }
  return {isConfigured,getClient,currentUser};
})();
