window.NevGenc = window.NevGenc || {};
NevGenc.session = (() => {
  const SAU=/^[^\s@]+@ogr\.sakarya\.edu\.tr$/i;
  const SUBU=/^g\d+@subu\.edu\.tr$/i;
  const STAFF=/^[^\s@]+@(sakarya\.edu\.tr|serdivan\.bel\.tr)$/i;
  let authStateBound=false,mfaEnrollmentFactorId=null,mfaChallengeFactorId=null,lastSignupEmail='';

  function normalizeEmail(v){return String(v||'').trim().toLowerCase()}
  function normalizeName(v){return String(v||'').trim().replace(/\s+/g,' ').slice(0,80)}
  function validSignupEmail(v){const email=normalizeEmail(v);return SAU.test(email)||SUBU.test(email)||STAFF.test(email)}
  function strongPassword(v){const s=String(v||'');return s.length>=10&&/[a-zçğıöşü]/.test(s)&&/[A-ZÇĞİÖŞÜ]/.test(s)&&/\d/.test(s)}
  function humanize(error){
    const msg=String(error?.message||error||'').toLowerCase();
    if(msg.includes('invalid login credentials'))return 'E-posta veya parola hatalı.';
    if(msg.includes('email not confirmed'))return 'Giriş yapmadan önce e-posta adresini doğrulamalısın.';
    if(msg.includes('user already registered')||msg.includes('user_repeated_signup'))return 'Hesap zaten kayıtlı olabilir. E-postanı kontrol et veya giriş yapmayı dene.';
    if(msg.includes('rate limit')||msg.includes('too many'))return 'Çok fazla deneme yapıldı. Bir süre sonra tekrar dene.';
    if(msg.includes('signup')&&msg.includes('disabled'))return 'Yeni hesap oluşturma şu anda kapalı.';
    if(msg.includes('nevgenç kaydı'))return 'Bu e-posta adresi NevGenç kayıt politikasına uygun değil.';
    if(msg.includes('mfa')||msg.includes('factor')||msg.includes('challenge'))return 'Doğrulama kodu kabul edilmedi. Yeni kodu kontrol edip tekrar dene.';
    return 'İşlem tamamlanamadı. Bir süre sonra tekrar dene.';
  }
  function showAuth({tab='signin'}={}){const o=document.getElementById('auth-overlay');if(!o)return;NevGenc.ui?.openModal?.(o,{focus:tab==='signup'?'#signup-email':tab==='recovery'?'#recovery-password':'#signin-email'});selectTab(tab)}
  function hideAuth(){NevGenc.ui?.closeModal?.('auth-overlay')}
  function selectTab(tab){document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===tab));document.querySelectorAll('[data-auth-panel]').forEach(p=>p.hidden=p.dataset.authPanel!==tab)}
  async function signUp({name,email,password,passwordConfirm}){
    name=normalizeName(name);email=normalizeEmail(email);
    if(name.length<3)throw new Error('Ad Soyad en az 3 karakter olmalı.');
    if(!validSignupEmail(email))throw new Error('SAÜ veya SUBÜ öğrenci e-posta adresi kullanmalısın. Kurumsal editör hesapları yalnızca yetkilendirildikten sonra içerik yönetebilir.');
    if(password!==passwordConfirm)throw new Error('Parolalar eşleşmiyor.');
    if(!strongPassword(password))throw new Error('Parola en az 10 karakter olmalı; büyük/küçük harf ve rakam içermeli.');
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const redirectTo=`${location.origin}${location.pathname}`;
    const {data,error}=await c.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{full_name:name}}});if(error)throw error;lastSignupEmail=email;return data;
  }
  async function signIn({email,password}){const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');const {data,error}=await c.auth.signInWithPassword({email:normalizeEmail(email),password:String(password||'')});if(error)throw error;return data}
  async function resendSignupConfirmation(email){email=normalizeEmail(email||lastSignupEmail);if(!email)throw new Error('Önce e-posta adresini yaz.');const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');const redirectTo=`${location.origin}${location.pathname}`;const {error}=await c.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectTo}});if(error)throw error;lastSignupEmail=email}
  async function resetPassword(email){email=normalizeEmail(email);if(!email)throw new Error('Önce e-posta adresini yaz.');const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');const redirectTo=`${location.origin}${location.pathname}#/profil`;const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error}
  async function requestOwnPasswordReset(){const user=await NevGenc.supabase.currentUser();if(!user?.email)throw new Error('Oturum bulunamadı.');await resetPassword(user.email);return {ok:true}}
  async function updateRecoveredPassword(password,passwordConfirm){if(password!==passwordConfirm)throw new Error('Parolalar eşleşmiyor.');if(!strongPassword(password))throw new Error('Parola en az 10 karakter olmalı; büyük/küçük harf ve rakam içermeli.');const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');const {error}=await c.auth.updateUser({password});if(error)throw error}
  async function signOut({global=false}={}){const c=NevGenc.supabase.getClient();if(c)await c.auth.signOut({scope:global?'global':'local'})}
  async function requireAuth(){const u=await NevGenc.supabase.currentUser();if(u)return u;showAuth({tab:'signin'});return null}
  async function headerIdentity(){const user=await NevGenc.supabase.currentUser();const avatar=document.getElementById('profile-button-avatar');if(!avatar)return;if(!user){avatar.textContent='?';avatar.closest('button')?.classList.remove('signed-in');return}const name=normalizeName(user.user_metadata?.full_name)||user.email||'N';avatar.textContent=(name[0]||'N').toLocaleUpperCase('tr');avatar.closest('button')?.classList.add('signed-in')}

  async function securitySummary(){
    const c=NevGenc.supabase.getClient(),user=await NevGenc.supabase.currentUser();if(!c||!user)return {signedIn:false,emailVerified:false,mfaEnrolled:false,currentLevel:null,nextLevel:null,lastSignIn:null};
    try{
      const [factors,aal]=await Promise.all([c.auth.mfa.listFactors(),c.auth.mfa.getAuthenticatorAssuranceLevel()]);
      const verified=(factors.data?.totp||[]).filter(x=>x.status==='verified');
      return {signedIn:true,emailVerified:Boolean(user.email_confirmed_at||user.confirmed_at),mfaEnrolled:verified.length>0,factors:verified,currentLevel:aal.data?.currentLevel||null,nextLevel:aal.data?.nextLevel||null,lastSignIn:user.last_sign_in_at||null,email:user.email||''};
    }catch{return {signedIn:true,emailVerified:Boolean(user.email_confirmed_at||user.confirmed_at),mfaEnrolled:false,currentLevel:null,nextLevel:null,lastSignIn:user.last_sign_in_at||null,email:user.email||''}}
  }
  function mfaPanels(mode){document.getElementById('mfa-enroll-panel').hidden=mode!=='enroll';document.getElementById('mfa-challenge-panel').hidden=mode!=='challenge'}
  async function beginMfaEnrollment(){
    const c=NevGenc.supabase.getClient();if(!c)throw new Error('Supabase bağlantısı yapılandırılmamış.');
    const state=await securitySummary();if(state.mfaEnrolled){if(state.currentLevel==='aal2')throw new Error('İki aşamalı doğrulama zaten etkin.');return beginMfaChallenge()}
    const listed=await c.auth.mfa.listFactors();for(const factor of (listed.data?.totp||[]).filter(x=>x.status!=='verified')){await c.auth.mfa.unenroll({factorId:factor.id}).catch(()=>{})}
    const {data,error}=await c.auth.mfa.enroll({factorType:'totp',friendlyName:'NevGenç Authenticator'});if(error)throw error;
    mfaEnrollmentFactorId=data.id;const qr=document.getElementById('mfa-qr');const secret=document.getElementById('mfa-secret');if(qr)qr.src=data.totp?.qr_code||'';if(secret)secret.textContent=data.totp?.secret||'';
    mfaPanels('enroll');NevGenc.ui?.openModal?.('mfa-overlay',{focus:'#mfa-enroll-code'});return data;
  }
  async function verifyMfaEnrollment(code){
    if(!mfaEnrollmentFactorId)throw new Error('MFA kurulumu başlatılmadı.');const c=NevGenc.supabase.getClient();
    const clean=String(code||'').replace(/\D/g,'').slice(0,6);if(clean.length!==6)throw new Error('6 haneli kodu gir.');
    const {data,error}=await c.auth.mfa.challengeAndVerify({factorId:mfaEnrollmentFactorId,code:clean});if(error)throw error;mfaEnrollmentFactorId=null;NevGenc.ui?.closeModal?.('mfa-overlay');window.dispatchEvent(new CustomEvent('nevgenc:security-changed'));return data;
  }
  async function beginMfaChallenge(){
    const c=NevGenc.supabase.getClient();const {data,error}=await c.auth.mfa.listFactors();if(error)throw error;const factor=(data.totp||[]).find(x=>x.status==='verified');if(!factor)throw new Error('Doğrulanmış MFA faktörü bulunamadı.');mfaChallengeFactorId=factor.id;mfaPanels('challenge');NevGenc.ui?.openModal?.('mfa-overlay',{focus:'#mfa-challenge-code'});return factor;
  }
  async function verifyMfaChallenge(code){
    if(!mfaChallengeFactorId)throw new Error('MFA doğrulaması başlatılmadı.');const c=NevGenc.supabase.getClient();const clean=String(code||'').replace(/\D/g,'').slice(0,6);if(clean.length!==6)throw new Error('6 haneli kodu gir.');const {data,error}=await c.auth.mfa.challengeAndVerify({factorId:mfaChallengeFactorId,code:clean});if(error)throw error;mfaChallengeFactorId=null;NevGenc.ui?.closeModal?.('mfa-overlay');window.dispatchEvent(new CustomEvent('nevgenc:security-changed'));return data;
  }
  async function cancelMfaFlow(){const c=NevGenc.supabase.getClient();if(mfaEnrollmentFactorId&&c){const id=mfaEnrollmentFactorId;mfaEnrollmentFactorId=null;await c.auth.mfa.unenroll({factorId:id}).catch(()=>{})}mfaChallengeFactorId=null;NevGenc.ui?.closeModal?.('mfa-overlay')}
  async function ensureMfaIfEnrolled(){const state=await securitySummary();if(state.currentLevel==='aal1'&&state.nextLevel==='aal2'){await beginMfaChallenge();return false}return true}

  function bind(){
    document.getElementById('profile-button')?.addEventListener('click',async()=>{const u=await NevGenc.supabase.currentUser();if(u)location.hash='#/profil';else showAuth({tab:'signin'})});
    document.getElementById('auth-close')?.addEventListener('click',hideAuth);document.querySelectorAll('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.authTab)));
    document.getElementById('signin-form')?.addEventListener('submit',async e=>{e.preventDefault();const err=document.getElementById('signin-error'),btn=e.currentTarget.querySelector('button[type=submit]');err.textContent='';err.classList.remove('success');NevGenc.ui?.setBusy?.(btn,true,'Giriş yapılıyor…');try{await signIn({email:document.getElementById('signin-email').value,password:document.getElementById('signin-password').value});hideAuth();await headerIdentity();await ensureMfaIfEnrolled();window.dispatchEvent(new CustomEvent('nevgenc:auth-changed'))}catch(ex){err.textContent=humanize(ex)}finally{NevGenc.ui?.setBusy?.(btn,false)}});
    document.getElementById('signup-form')?.addEventListener('submit',async e=>{e.preventDefault();const err=document.getElementById('signup-error'),btn=e.currentTarget.querySelector('button[type=submit]'),resend=document.getElementById('resend-signup-confirmation');err.textContent='';err.classList.remove('success');NevGenc.ui?.setBusy?.(btn,true,'Hesap oluşturuluyor…');try{await signUp({name:document.getElementById('signup-name').value,email:document.getElementById('signup-email').value,password:document.getElementById('signup-password').value,passwordConfirm:document.getElementById('signup-password-confirm').value});err.classList.add('success');err.textContent='Doğrulama bağlantısı gönderildi. E-postanı doğruladıktan sonra giriş yapabilirsin.';if(resend){resend.hidden=false;startResendCooldown(resend)}}catch(ex){err.classList.remove('success');err.textContent=ex.message?.includes('öğrenci e-posta')||ex.message?.includes('Parola')||ex.message?.includes('Ad Soyad')?ex.message:humanize(ex)}finally{NevGenc.ui?.setBusy?.(btn,false)}});
    document.getElementById('recovery-form')?.addEventListener('submit',async e=>{e.preventDefault();const err=document.getElementById('recovery-error'),btn=e.currentTarget.querySelector('button[type=submit]');err.textContent='';NevGenc.ui?.setBusy?.(btn,true,'Güncelleniyor…');try{await updateRecoveredPassword(document.getElementById('recovery-password').value,document.getElementById('recovery-password-confirm').value);err.classList.add('success');err.textContent='Parolan güncellendi.';setTimeout(()=>{hideAuth();location.hash='#/profil'},700)}catch(ex){err.classList.remove('success');err.textContent=ex.message?.includes('Parola')?ex.message:humanize(ex)}finally{NevGenc.ui?.setBusy?.(btn,false)}});
    document.getElementById('forgot-password')?.addEventListener('click',async()=>{const err=document.getElementById('signin-error');err.textContent='';try{await resetPassword(document.getElementById('signin-email').value);err.classList.add('success');err.textContent='Bu e-posta kayıtlıysa parola yenileme bağlantısı gönderildi.'}catch(ex){err.classList.remove('success');err.textContent=humanize(ex)}});
    document.getElementById('resend-signup-confirmation')?.addEventListener('click',async e=>{const btn=e.currentTarget,err=document.getElementById('signup-error');if(btn.disabled)return;try{await resendSignupConfirmation(document.getElementById('signup-email').value);err.classList.add('success');err.textContent='Doğrulama e-postası yeniden istendi. Gelen kutusu ve gereksiz klasörünü kontrol et.';startResendCooldown(btn)}catch(ex){err.classList.remove('success');err.textContent=humanize(ex)}});
    document.getElementById('mfa-close')?.addEventListener('click',async()=>{const state=await securitySummary();if(state.nextLevel==='aal2'&&state.currentLevel!=='aal2'){const ok=await NevGenc.ui.confirmAction({title:'Doğrulama tamamlanmadı',message:'İki aşamalı doğrulamayı tamamlamadan yetkili işlemleri kullanamazsın. Yine de kapatmak istiyor musun?',confirmText:'Şimdi kapat',danger:false});if(!ok)return}await cancelMfaFlow()});
    document.getElementById('mfa-enroll-form')?.addEventListener('submit',async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button[type=submit]'),err=document.getElementById('mfa-enroll-error');err.textContent='';NevGenc.ui.setBusy(btn,true,'Doğrulanıyor…');try{await verifyMfaEnrollment(document.getElementById('mfa-enroll-code').value);NevGenc.app?.toast?.('İki aşamalı doğrulama etkinleştirildi.')}catch(ex){err.textContent=humanize(ex)}finally{NevGenc.ui.setBusy(btn,false)}});
    document.getElementById('mfa-challenge-form')?.addEventListener('submit',async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button[type=submit]'),err=document.getElementById('mfa-challenge-error');err.textContent='';NevGenc.ui.setBusy(btn,true,'Doğrulanıyor…');try{await verifyMfaChallenge(document.getElementById('mfa-challenge-code').value);NevGenc.app?.toast?.('Güvenli oturum doğrulandı.')}catch(ex){err.textContent=humanize(ex)}finally{NevGenc.ui.setBusy(btn,false)}});
    if(!authStateBound){const c=NevGenc.supabase.getClient();c?.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setTimeout(()=>showAuth({tab:'recovery'}),0);if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED')setTimeout(()=>ensureMfaIfEnrolled().catch(()=>{}),80);setTimeout(()=>{headerIdentity();window.dispatchEvent(new CustomEvent('nevgenc:auth-changed'))},0)});authStateBound=true}
    headerIdentity();
  }
  function startResendCooldown(btn,seconds=60){let left=seconds;btn.disabled=true;const base='Doğrulama e-postasını tekrar gönder';btn.textContent=`${base} (${left})`;const timer=setInterval(()=>{left--;if(left<=0){clearInterval(timer);btn.disabled=false;btn.textContent=base}else btn.textContent=`${base} (${left})`},1000)}
  return {bind,showAuth,hideAuth,signOut,requireAuth,validSignupEmail,headerIdentity,resendSignupConfirmation,securitySummary,beginMfaEnrollment,beginMfaChallenge,ensureMfaIfEnrolled,requestOwnPasswordReset};
})();
