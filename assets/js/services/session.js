window.NevGenc = window.NevGenc || {};
NevGenc.session = (() => {
  const SAU=/^[^\s@]+@ogr\.sakarya\.edu\.tr$/i;
  const SUBU=/^g\d+@subu\.edu\.tr$/i;
  const STAFF=/^[^\s@]+@(sakarya\.edu\.tr|serdivan\.bel\.tr)$/i;
  let authStateBound=false;
  let recoveryMode=false;
  let landingMode='';

  function normalizeEmail(v){return String(v||'').trim().toLowerCase()}
  function normalizeName(v){return String(v||'').trim().replace(/\s+/g,' ').slice(0,80)}
  function validSignupEmail(v){const email=normalizeEmail(v);return SAU.test(email)||SUBU.test(email)||STAFF.test(email)}
  function strongPassword(v){const s=String(v||'');return s.length>=10&&/[a-zçğıöşü]/.test(s)&&/[A-ZÇĞİÖŞÜ]/.test(s)&&/\d/.test(s)}
  function appBaseUrl(){return `${location.origin}${location.pathname}`}
  function authRedirect(mode){const u=new URL(appBaseUrl());u.searchParams.set('auth',mode);return u.toString()}
  function authModeFromUrl(){
    const u=new URL(location.href);const q=String(u.searchParams.get('auth')||u.searchParams.get('type')||'').toLowerCase();
    const rawHash=location.hash.startsWith('#')?location.hash.slice(1):'';const hp=new URLSearchParams(rawHash);const h=String(hp.get('type')||'').toLowerCase();
    if(q==='recovery'||h==='recovery')return 'recovery';if(q==='confirm'||q==='signup'||h==='signup')return 'confirm';return '';
  }
  function cleanAuthUrl(route='#/profil'){
    try{const u=new URL(location.href);u.searchParams.delete('auth');u.searchParams.delete('type');u.searchParams.delete('code');u.searchParams.delete('token_hash');u.searchParams.delete('error');u.searchParams.delete('error_code');u.searchParams.delete('error_description');history.replaceState({},document.title,`${u.pathname}${u.search}${route}`)}catch{}
  }
  function humanize(error){
    const msg=String(error?.message||error||'').toLowerCase();
    if(msg.includes('invalid login credentials'))return 'E-posta veya parola hatalı. Parolanı unuttuysan sıfırlama bağlantısı isteyebilirsin.';
    if(msg.includes('email not confirmed'))return 'E-posta adresin henüz doğrulanmamış. Gelen kutunu ve spam klasörünü kontrol et.';
    if(msg.includes('user already registered')||msg.includes('user_repeated_signup'))return 'Bu hesap zaten kayıtlı olabilir. Giriş yapmayı veya doğrulama e-postasını yeniden istemeyi dene.';
    if(msg.includes('rate limit')||msg.includes('over_email_send_rate_limit'))return 'Çok fazla istek gönderildi. Birkaç dakika bekleyip tekrar dene.';
    if(msg.includes('signup')&&msg.includes('disabled'))return 'Yeni hesap oluşturma şu anda kapalı.';
    if(msg.includes('nevgenç kaydı'))return 'Bu e-posta adresi NevGenç kayıt politikasına uygun değil.';
    if(msg.includes('auth session missing')||msg.includes('session missing'))return 'Güvenli oturum bulunamadı. Sıfırlama bağlantısı süresi dolmuş olabilir; yeni bağlantı iste.';
    if(msg.includes('expired')||msg.includes('otp_expired'))return 'Bu bağlantının süresi dolmuş. Yeni bir bağlantı iste.';
    if(msg.includes('network')||msg.includes('fetch')||msg.includes('failed to fetch'))return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
    if(msg.includes('same password')||msg.includes('different from the old'))return 'Yeni parola önceki parolandan farklı olmalı.';
    return 'İşlem tamamlanamadı. Birkaç saniye sonra tekrar dene.';
  }
  function showAuth({tab='signin'}={}){
    const o=document.getElementById('auth-overlay'); if(!o)return;
    o.hidden=false;document.body.classList.add('modal-open');selectTab(tab);
    const target=tab==='signup'?'signup-email':tab==='recovery'?'recovery-password':tab==='forgot'?'forgot-email':'signin-email';
    setTimeout(()=>document.getElementById(target)?.focus(),50);
  }
  function hideAuth(){const o=document.getElementById('auth-overlay');if(o)o.hidden=true;document.body.classList.remove('modal-open')}
  function selectTab(tab){
    document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===tab));
    document.querySelectorAll('[data-auth-panel]').forEach(p=>p.hidden=p.dataset.authPanel!==tab);
    const tabs=document.querySelector('.auth-tabs');if(tabs)tabs.hidden=['forgot','recovery'].includes(tab);
  }
  function setFieldMessage(id,message='',success=false){const el=document.getElementById(id);if(!el)return;el.classList.toggle('success',Boolean(success));el.textContent=message}
  function setBusy(button,busy,label){if(!button)return;if(busy){button.dataset.oldLabel=button.textContent;button.disabled=true;button.textContent=label||'İşleniyor…'}else{button.disabled=false;button.textContent=button.dataset.oldLabel||button.textContent;delete button.dataset.oldLabel}}

  async function signUp({name,email,password,passwordConfirm}){
    name=normalizeName(name);email=normalizeEmail(email);
    if(name.length<3)throw new Error('Ad Soyad en az 3 karakter olmalı.');
    if(!validSignupEmail(email))throw new Error('SAÜ veya SUBÜ öğrenci e-posta adresi kullanmalısın. Kurumsal editör hesapları yalnızca yetkilendirildikten sonra içerik yönetebilir.');
    if(password!==passwordConfirm)throw new Error('Parolalar eşleşmiyor.');
    if(!strongPassword(password))throw new Error('Parola en az 10 karakter olmalı; büyük/küçük harf ve rakam içermeli.');
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const {data,error}=await c.auth.signUp({email,password,options:{emailRedirectTo:authRedirect('confirm'),data:{full_name:name}}});
    if(error)throw error;return data;
  }
  async function signIn({email,password}){
    email=normalizeEmail(email);password=String(password||'');
    if(!email||!email.includes('@'))throw new Error('Geçerli bir e-posta adresi yaz.');
    if(!password)throw new Error('Parolanı yaz.');
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const {data,error}=await c.auth.signInWithPassword({email,password});if(error)throw error;return data;
  }
  async function resendSignupConfirmation(email){
    email=normalizeEmail(email);if(!email)throw new Error('Önce e-posta adresini yaz.');
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const {error}=await c.auth.resend({type:'signup',email,options:{emailRedirectTo:authRedirect('confirm')}});if(error)throw error;
  }
  async function resetPassword(email){
    email=normalizeEmail(email);if(!email||!email.includes('@'))throw new Error('Geçerli bir e-posta adresi yaz.');
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:authRedirect('recovery')});if(error)throw error;
  }
  async function updateRecoveredPassword(password,passwordConfirm){
    if(!recoveryMode)throw new Error('Güvenli parola sıfırlama oturumu bulunamadı. Yeni bağlantı iste.');
    if(password!==passwordConfirm)throw new Error('Parolalar eşleşmiyor.');
    if(!strongPassword(password))throw new Error('Parola en az 10 karakter olmalı; büyük/küçük harf ve rakam içermeli.');
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const {data:sessionData}=await c.auth.getSession();if(!sessionData?.session)throw new Error('Auth session missing');
    const {error}=await c.auth.updateUser({password});if(error)throw error;
    recoveryMode=false;await c.auth.signOut({scope:'local'});
  }
  async function signOut(){const c=NevGenc.supabase.getClient();if(c)await c.auth.signOut({scope:'local'})}
  async function requireAuth(){const u=await NevGenc.supabase.currentUser();if(u)return u;showAuth({tab:'signin'});return null}
  async function headerIdentity(){
    const user=await NevGenc.supabase.currentUser();const avatar=document.getElementById('profile-button-avatar');if(!avatar)return;
    if(!user){avatar.textContent='?';avatar.closest('button')?.classList.remove('signed-in');return}
    const name=normalizeName(user.user_metadata?.full_name)||user.email||'N';avatar.textContent=(name[0]||'N').toLocaleUpperCase('tr');avatar.closest('button')?.classList.add('signed-in');
  }
  function bindPasswordUX(){
    document.querySelectorAll('[data-password-toggle]').forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='1';btn.addEventListener('click',()=>{const input=document.getElementById(btn.dataset.passwordToggle);if(!input)return;const showing=input.type==='text';input.type=showing?'password':'text';btn.setAttribute('aria-label',showing?'Parolayı göster':'Parolayı gizle');btn.textContent=showing?'Göster':'Gizle';input.focus({preventScroll:true})})});
    document.querySelectorAll('input[type="password"],input[data-password-field]').forEach(input=>{if(input.dataset.capsBound)return;input.dataset.capsBound='1';const hint=document.querySelector(`[data-caps-for="${CSS.escape(input.id)}"]`);const update=e=>{if(!hint)return;let on=false;try{on=Boolean(e?.getModifierState&&e.getModifierState('CapsLock'))}catch{}hint.hidden=!on};input.addEventListener('keydown',update);input.addEventListener('keyup',update);input.addEventListener('blur',()=>{if(hint)hint.hidden=true})});
  }
  async function processAuthLanding(){
    const mode=landingMode||authModeFromUrl();if(!mode)return;
    const c=NevGenc.supabase.getClient();if(!c)return;
    // detectSessionInUrl processes the implicit token fragment during client initialization.
    await new Promise(r=>setTimeout(r,80));
    const {data,error}=await c.auth.getSession();
    if(error){showAuth({tab:mode==='recovery'?'forgot':'signin'});const id=mode==='recovery'?'forgot-error':'signin-error';setFieldMessage(id,humanize(error));return}
    if(mode==='recovery'){
      if(data?.session){recoveryMode=true;showAuth({tab:'recovery'});setFieldMessage('recovery-error','Bağlantı doğrulandı. Yeni parolanı belirleyebilirsin.',true);cleanAuthUrl('#/profil')}
      else{showAuth({tab:'forgot'});setFieldMessage('forgot-error','Sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bağlantı iste.');cleanAuthUrl('#/profil')}
    }else if(mode==='confirm'){
      cleanAuthUrl('#/profil');if(data?.session){hideAuth();NevGenc.app?.toast?.('E-posta adresin doğrulandı.','info')}else{showAuth({tab:'signin'});setFieldMessage('signin-error','E-posta doğrulaması tamamlandı. Şimdi giriş yapabilirsin.',true)}
    }
  }
  function bind(){
    landingMode=authModeFromUrl();
    document.getElementById('profile-button')?.addEventListener('click',async()=>{const u=await NevGenc.supabase.currentUser();if(u)location.hash='#/profil';else showAuth({tab:'signin'})});
    document.getElementById('auth-close')?.addEventListener('click',()=>{if(recoveryMode)return;hideAuth()});
    document.getElementById('auth-overlay')?.addEventListener('click',e=>{if(e.target.id==='auth-overlay'&&!recoveryMode)hideAuth()});
    document.querySelectorAll('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.authTab)));
    document.querySelectorAll('[data-auth-back]').forEach(b=>b.addEventListener('click',()=>selectTab('signin')));
    bindPasswordUX();

    document.getElementById('signin-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const err=document.getElementById('signin-error');const btn=e.currentTarget.querySelector('button[type=submit]');setFieldMessage('signin-error');setBusy(btn,true,'Giriş yapılıyor…');
      try{await signIn({email:document.getElementById('signin-email').value,password:document.getElementById('signin-password').value});hideAuth();await headerIdentity();window.dispatchEvent(new CustomEvent('nevgenc:auth-changed'));}
      catch(ex){setFieldMessage('signin-error',ex.message?.startsWith('Geçerli')||ex.message==='Parolanı yaz.'?ex.message:humanize(ex))}finally{setBusy(btn,false)}
    });
    document.getElementById('signup-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const btn=e.currentTarget.querySelector('button[type=submit]');setFieldMessage('signup-error');setBusy(btn,true,'Hesap oluşturuluyor…');
      try{await signUp({name:document.getElementById('signup-name').value,email:document.getElementById('signup-email').value,password:document.getElementById('signup-password').value,passwordConfirm:document.getElementById('signup-password-confirm').value});setFieldMessage('signup-error','Doğrulama bağlantısı e-posta adresine gönderildi. Gelen kutunu ve spam klasörünü kontrol et.',true)}
      catch(ex){setFieldMessage('signup-error',ex.message?.includes('öğrenci e-posta')||ex.message?.includes('Parola')||ex.message?.includes('Ad Soyad')?ex.message:humanize(ex))}finally{setBusy(btn,false)}
    });
    document.getElementById('recovery-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const btn=e.currentTarget.querySelector('button[type=submit]');setFieldMessage('recovery-error');setBusy(btn,true,'Parola güncelleniyor…');
      try{await updateRecoveredPassword(document.getElementById('recovery-password').value,document.getElementById('recovery-password-confirm').value);setFieldMessage('recovery-error','Parolan güncellendi. Yeni parolanla giriş yapabilirsin.',true);setTimeout(()=>{selectTab('signin');document.getElementById('signin-password').value=''},700)}
      catch(ex){setFieldMessage('recovery-error',ex.message?.includes('Parola')||ex.message?.includes('Güvenli')?ex.message:humanize(ex))}finally{setBusy(btn,false)}
    });
    document.getElementById('forgot-password')?.addEventListener('click',()=>{const email=normalizeEmail(document.getElementById('signin-email')?.value);document.getElementById('forgot-email').value=email;setFieldMessage('forgot-error');selectTab('forgot');setTimeout(()=>document.getElementById('forgot-email')?.focus(),40)});
    document.getElementById('forgot-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const btn=e.currentTarget.querySelector('button[type=submit]');setFieldMessage('forgot-error');setBusy(btn,true,'Bağlantı gönderiliyor…');
      try{await resetPassword(document.getElementById('forgot-email').value);setFieldMessage('forgot-error','Bu e-posta sistemde kayıtlıysa parola sıfırlama bağlantısı gönderildi. Gelen kutunu ve spam klasörünü kontrol et.',true)}
      catch(ex){setFieldMessage('forgot-error',ex.message?.startsWith('Geçerli')?ex.message:humanize(ex))}finally{setBusy(btn,false)}
    });
    document.getElementById('resend-confirmation')?.addEventListener('click',async()=>{const email=normalizeEmail(document.getElementById('signin-email')?.value||document.getElementById('signup-email')?.value);try{await resendSignupConfirmation(email);setFieldMessage('signin-error','Doğrulama e-postası yeniden gönderildi.',true)}catch(ex){setFieldMessage('signin-error',humanize(ex))}});

    if(!authStateBound){const c=NevGenc.supabase.getClient();c?.auth.onAuthStateChange((event)=>{
      if(event==='PASSWORD_RECOVERY'){recoveryMode=true;setTimeout(()=>{showAuth({tab:'recovery'});setFieldMessage('recovery-error','Bağlantı doğrulandı. Yeni parolanı belirleyebilirsin.',true);cleanAuthUrl('#/profil')},0)}
      setTimeout(()=>{headerIdentity();window.dispatchEvent(new CustomEvent('nevgenc:auth-changed'))},0)
    });authStateBound=true}
    processAuthLanding().catch(err=>{console.error('Auth callback error',err);const mode=landingMode||authModeFromUrl();showAuth({tab:mode==='recovery'?'forgot':'signin'});setFieldMessage(mode==='recovery'?'forgot-error':'signin-error',humanize(err))});
    headerIdentity();
  }
  return {bind,showAuth,hideAuth,signOut,requireAuth,validSignupEmail,headerIdentity,resendSignupConfirmation};
})();
