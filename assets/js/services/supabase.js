window.NevGenc = window.NevGenc || {};
NevGenc.supabase = (() => {
  let client = null;
  function isConfigured(){
    const cfg=NevGenc.config?.supabase||{};
    return Boolean(cfg.url && (cfg.publishableKey||cfg.anonKey) && window.supabase?.createClient);
  }
  function getClient(){
    if(!isConfigured()) return null;
    if(!client){
      const key=NevGenc.config.supabase.publishableKey||NevGenc.config.supabase.anonKey;
      client=window.supabase.createClient(NevGenc.config.supabase.url,key,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce',storageKey:'nevgenc-auth-v1'},
        global:{headers:{'x-client-info':'nevgenc-web/17.1.0'}}
      });
    }
    return client;
  }
  async function currentUser(){
    const c=getClient(); if(!c) return null;
    const {data,error}=await c.auth.getUser();
    if(error) return null;
    return data.user||null;
  }
  async function currentSession(){
    const c=getClient(); if(!c) return null;
    const {data}=await c.auth.getSession(); return data?.session||null;
  }
  return {isConfigured,getClient,currentUser,currentSession};
})();
