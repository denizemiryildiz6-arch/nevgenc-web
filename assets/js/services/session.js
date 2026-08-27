window.NevGenc = window.NevGenc || {};
NevGenc.session = (() => {
  const SAU=/^[^\s@]+@ogr\.sakarya\.edu\.tr$/i;
  const SUBU=/^g\d+@subu\.edu\.tr$/i;
  const STAFF=/^[^\s@]+@(sakarya\.edu\.tr|serdivan\.bel\.tr)$/i;
  let authStateBound=false;

  function normalizeEmail(v){return String(v||'').trim().toLowerCase()}
  function normalizeName(v){return String(v||'').trim().replace(/\s+/g,' ').slice(0,80)}
  function validSignupEmail(v){const email=normalizeEmail(v);return SAU.test(email)||SUBU.test(email)||STAFF.test(email)}
  function strongPassword(v){const s=String(v||'');return s.length>=10&&/[a-zçğıöşü]/.test(s)&&/[A-ZÇĞİÖŞÜ]/.test(s)&&/\d/.test(s)}
  function humanize(error){
    const msg=String(error?.message||error||'').toLowerCase();
    if(msg.includes('invalid login credentials'))return 'E-posta veya parola hatalı.';
    if(msg.includes('email not confirmed'))return 'Giriş yapmadan önce e-posta adresini doğrulamalısın.';
    if(msg.includes('user already registered'))return 'Bu e-posta adresiyle daha önce hesap oluşturulmuş.';
    if(msg.includes('rate limit'))return 'Çok fazla deneme yapıldı. Bir süre sonra tekrar dene.';
    if(msg.includes('signup')&&msg.includes('disabled'))return 'Yeni hesap oluşturma şu anda kapalı.';
    if(msg.includes('nevgenç kaydı'))return 'Bu e-posta adresi NevGenç kayıt politikasına uygun değil.';
    return 'İşlem tamamlanamadı. Bilgilerini kontrol edip tekrar dene.';
  }
  function showAuth({tab='signin'}={}){
    const o=document.getElementById('auth-overlay'); if(!o)return;
    o.hidden=false;document.body.classList.add('modal-open');selectTab(tab);
    const target=tab==='signup'?'signup-email':tab==='recovery'?'recovery-password':'signin-email';
    setTimeout(()=>document.getElementById(target)?.focus(),50);
  }
  function hideAuth(){const o=document.getElementById('auth-overlay');if(o)o.hidden=true;document.body.classList.remove('modal-open')}
  function selectTab(tab){
    document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===tab));
    document.querySelectorAll('[data-auth-panel]').forEach(p=>p.hidden=p.dataset.authPanel!==tab);
  }
  async function signUp({name,email,password,passwordConfirm}){
    name=normalizeName(name);email=normalizeEmail(email);
    if(name.length<3)throw new Error('Ad Soyad en az 3 karakter olmalı.');
    if(!validSignupEmail(email))throw new Error('SAÜ veya SUBÜ öğrenci e-posta adresi kullanmalısın. Kurumsal editör hesapları yalnızca yetkilendirildikten sonra içerik yönetebilir.');
    if(password!==passwordConfirm)throw new Error('Parolalar eşleşmiyor.');
    if(!strongPassword(password))throw new Error('Parola en az 10 karakter olmalı; büyük/küçük harf ve rakam içermeli.');
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const redirectTo=`${location.origin}${location.pathname}`;
    const {data,error}=await c.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{full_name:name}}});
    if(error)throw error;
    return data;
  }
  async function signIn({email,password}){
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const {data,error}=await c.auth.signInWithPassword({email:normalizeEmail(email),password:String(password||'')});
    if(error)throw error;return data;
  }
  async function resetPassword(email){
    email=normalizeEmail(email);if(!email)throw new Error('Önce e-posta adresini yaz.');
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const redirectTo=`${location.origin}${location.pathname}#/profil`;
    const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;
  }
  async function updateRecoveredPassword(password,passwordConfirm){
    if(password!==passwordConfirm)throw new Error('Parolalar eşleşmiyor.');
    if(!strongPassword(password))throw new Error('Parola en az 10 karakter olmalı; büyük/küçük harf ve rakam içermeli.');
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const {error}=await c.auth.updateUser({password});if(error)throw error;
  }
  async function signOut(){const c=NevGenc.supabase.getClient();if(c)await c.auth.signOut({scope:'local'})}
  async function requireAuth(){const u=await NevGenc.supabase.currentUser();if(u)return u;showAuth({tab:'signin'});return null}
  async function headerIdentity(){
    const user=await NevGenc.supabase.currentUser();const avatar=document.getElementById('profile-button-avatar');if(!avatar)return;
    if(!user){avatar.textContent='?';avatar.closest('button')?.classList.remove('signed-in');return}
    const name=normalizeName(user.user_metadata?.full_name)||user.email||'N';avatar.textContent=(name[0]||'N').toLocaleUpperCase('tr');avatar.closest('button')?.classList.add('signed-in');
  }
  function bind(){
    document.getElementById('profile-button')?.addEventListener('click',async()=>{const u=await NevGenc.supabase.currentUser();if(u)location.hash='#/profil';else showAuth({tab:'signin'})});
    document.getElementById('auth-close')?.addEventListener('click',hideAuth);
    document.getElementById('auth-overlay')?.addEventListener('click',e=>{if(e.target.id==='auth-overlay')hideAuth()});
    document.querySelectorAll('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.authTab)));
    document.getElementById('signin-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const err=document.getElementById('signin-error');const btn=e.currentTarget.querySelector('button[type=submit]');err.textContent='';btn.disabled=true;
      try{await signIn({email:document.getElementById('signin-email').value,password:document.getElementById('signin-password').value});hideAuth();await headerIdentity();window.dispatchEvent(new CustomEvent('nevgenc:auth-changed'));}
      catch(ex){err.textContent=ex.message?.startsWith('SAÜ')?ex.message:humanize(ex)}finally{btn.disabled=false}
    });
    document.getElementById('signup-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const err=document.getElementById('signup-error');const btn=e.currentTarget.querySelector('button[type=submit]');err.textContent='';btn.disabled=true;
      try{
        await signUp({name:document.getElementById('signup-name').value,email:document.getElementById('signup-email').value,password:document.getElementById('signup-password').value,passwordConfirm:document.getElementById('signup-password-confirm').value});
        err.classList.add('success');err.textContent='Doğrulama bağlantısı e-posta adresine gönderildi. E-postanı doğruladıktan sonra giriş yapabilirsin.';
      }catch(ex){err.classList.remove('success');err.textContent=ex.message?.includes('öğrenci e-posta')||ex.message?.includes('Parola')||ex.message?.includes('Ad Soyad')?ex.message:humanize(ex)}finally{btn.disabled=false}
    });
    document.getElementById('recovery-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const err=document.getElementById('recovery-error');const btn=e.currentTarget.querySelector('button[type=submit]');err.textContent='';btn.disabled=true;
      try{await updateRecoveredPassword(document.getElementById('recovery-password').value,document.getElementById('recovery-password-confirm').value);err.classList.add('success');err.textContent='Parolan güncellendi.';setTimeout(()=>{hideAuth();location.hash='#/profil'},700)}
      catch(ex){err.classList.remove('success');err.textContent=ex.message?.includes('Parola')?ex.message:humanize(ex)}finally{btn.disabled=false}
    });
    document.getElementById('forgot-password')?.addEventListener('click',async()=>{
      const err=document.getElementById('signin-error');err.textContent='';try{await resetPassword(document.getElementById('signin-email').value);err.classList.add('success');err.textContent='Parola yenileme bağlantısı e-posta adresine gönderildi.'}catch(ex){err.classList.remove('success');err.textContent=humanize(ex)}
    });
    if(!authStateBound){const c=NevGenc.supabase.getClient();c?.auth.onAuthStateChange((event)=>{
      if(event==='PASSWORD_RECOVERY')setTimeout(()=>showAuth({tab:'recovery'}),0);
      setTimeout(()=>{headerIdentity();window.dispatchEvent(new CustomEvent('nevgenc:auth-changed'))},0)
    });authStateBound=true}
    headerIdentity();
  }
  return {bind,showAuth,hideAuth,signOut,requireAuth,validSignupEmail,headerIdentity};
})();
