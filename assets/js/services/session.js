window.NevGenc = window.NevGenc || {};
NevGenc.session = (() => {
  const KEY = 'nevgenc-local-session-v1';

  function normalizeName(value){
    return String(value || '').trim().replace(/\s+/g,' ').slice(0,60);
  }
  function get(){
    try{
      const data = JSON.parse(localStorage.getItem(KEY) || 'null');
      if(!data || !normalizeName(data.name)) return null;
      return {...data, name: normalizeName(data.name)};
    }catch{return null;}
  }
  async function syncAnonymousSession(name){
    const c=NevGenc.supabase?.getClient?.();
    if(!c)return {synced:false};
    try{
      const {data:sessionData}=await c.auth.getSession();
      let user=sessionData?.session?.user||null;
      if(!user){
        const {data,error}=await c.auth.signInAnonymously({options:{data:{full_name:name,name}}});
        if(error)throw error;
        user=data?.user||data?.session?.user||null;
      }
      if(user){
        await c.from('profiles').update({full_name:name,updated_at:new Date().toISOString()}).eq('id',user.id);
        return {synced:true,user};
      }
    }catch(err){
      console.warn('[NevGenç] anonim Supabase oturumu kullanılamadı; cihaz oturumu devam ediyor',err);
    }
    return {synced:false};
  }
  async function saveName(value){
    const name = normalizeName(value);
    if(name.length < 2) return {ok:false,message:'Lütfen adınızı en az 2 karakter olacak şekilde girin.'};
    const current = get();
    const session = {
      name,
      createdAt: current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(KEY, JSON.stringify(session));
    const sync=await syncAnonymousSession(name);
    const complete={...session,supabaseSynced:sync.synced};
    localStorage.setItem(KEY,JSON.stringify(complete));
    window.dispatchEvent(new CustomEvent('nevgenc:session-changed',{detail:complete}));
    return {ok:true,session:complete};
  }
  async function signOut(){
    localStorage.removeItem(KEY);
    try{await NevGenc.supabase?.getClient?.()?.auth?.signOut?.()}catch{}
    window.dispatchEvent(new CustomEvent('nevgenc:session-changed',{detail:null}));
  }
  function showLogin({editing=false}={}){
    const overlay=document.getElementById('login-overlay');
    const form=document.getElementById('login-form');
    const input=document.getElementById('login-name');
    const title=document.getElementById('login-title');
    const copy=document.getElementById('login-copy');
    const submit=document.getElementById('login-submit');
    const error=document.getElementById('login-error');
    if(!overlay||!form||!input)return;
    const current=get();
    overlay.hidden=false;
    document.body.classList.add('login-open');
    title.textContent=editing?'Adını değiştir':'NevGenç’e hoş geldin';
    copy.textContent=editing?'Profilde görünecek adını güncelleyebilirsin.':'Devam etmek için yalnızca adını girmen yeterli. Şifre istenmez.';
    submit.textContent=editing?'Kaydet':'Devam Et';
    input.value=current?.name||'';
    error.textContent='';
    overlay.dataset.editing=editing?'1':'0';
    setTimeout(()=>input.focus(),50);
  }
  function hideLogin(){
    const overlay=document.getElementById('login-overlay');
    if(overlay)overlay.hidden=true;
    document.body.classList.remove('login-open');
  }
  function bind(){
    const overlay=document.getElementById('login-overlay');
    const form=document.getElementById('login-form');
    const input=document.getElementById('login-name');
    const error=document.getElementById('login-error');
    const submit=document.getElementById('login-submit');
    if(!overlay||!form||!input)return;
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(submit)submit.disabled=true;
      const result=await saveName(input.value);
      if(submit)submit.disabled=false;
      if(!result.ok){error.textContent=result.message;input.focus();return;}
      hideLogin();
    });
    input.addEventListener('input',()=>{error.textContent='';});
  }
  function requireName(){
    if(!get())showLogin();
  }
  return {get,saveName,signOut,showLogin,hideLogin,bind,requireName};
})();
