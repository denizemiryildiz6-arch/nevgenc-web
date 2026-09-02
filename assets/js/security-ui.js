window.NevGenc = window.NevGenc || {};
NevGenc.ui = (() => {
  let activeModal=null,restoreFocus=null,confirmResolve=null;
  const focusable='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function modalElement(idOrEl){return typeof idOrEl==='string'?document.getElementById(idOrEl):idOrEl}
  function openModal(idOrEl,{focus}={}){
    const el=modalElement(idOrEl);if(!el)return;
    restoreFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    if(activeModal&&activeModal!==el)closeModal(activeModal,{restore:false});
    activeModal=el;el.hidden=false;document.body.classList.add('modal-open');
    requestAnimationFrame(()=>{const target=focus?el.querySelector(focus):el.querySelector('[autofocus]')||el.querySelector(focusable);target?.focus?.()});
  }
  function closeModal(idOrEl,{restore=true}={}){
    const el=modalElement(idOrEl)||activeModal;if(!el)return;
    el.hidden=true;if(activeModal===el)activeModal=null;
    if(!document.querySelector('.modal-overlay:not([hidden])'))document.body.classList.remove('modal-open');
    if(restore&&restoreFocus?.isConnected)restoreFocus.focus();
  }
  function onKeydown(e){
    if(!activeModal||activeModal.hidden)return;
    if(e.key==='Escape'&&activeModal.dataset.escapeClose!=='false'){e.preventDefault();closeModal(activeModal);return}
    if(e.key!=='Tab')return;
    const items=[...activeModal.querySelectorAll(focusable)].filter(x=>!x.hidden&&x.getClientRects().length);
    if(!items.length){e.preventDefault();return}
    const first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }

  function setBusy(button,busy,label='İşleniyor…'){
    if(!button)return;
    if(busy){button.dataset.originalText=button.textContent;button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=label}
    else{button.disabled=false;button.removeAttribute('aria-busy');if(button.dataset.originalText){button.textContent=button.dataset.originalText;delete button.dataset.originalText}}
  }

  function enhancePasswordInput(input){
    if(!input||input.dataset.securityEnhanced)return;input.dataset.securityEnhanced='1';
    const wrap=document.createElement('div');wrap.className='secure-password-field';
    input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='password-toggle';toggle.setAttribute('aria-label','Parolayı göster');toggle.textContent='Göster';wrap.appendChild(toggle);
    const caps=document.createElement('small');caps.className='caps-warning';caps.hidden=true;caps.textContent='Caps Lock açık';wrap.parentNode.appendChild(caps);
    toggle.addEventListener('click',()=>{const show=input.type==='password';input.type=show?'text':'password';toggle.textContent=show?'Gizle':'Göster';toggle.setAttribute('aria-label',show?'Parolayı gizle':'Parolayı göster')});
    input.addEventListener('keydown',e=>{if(typeof e.getModifierState==='function')caps.hidden=!e.getModifierState('CapsLock')});
    input.addEventListener('keyup',e=>{if(typeof e.getModifierState==='function')caps.hidden=!e.getModifierState('CapsLock')});
    input.addEventListener('blur',()=>caps.hidden=true);
  }

  function passwordScore(value){
    const s=String(value||'');const checks=[s.length>=10,/[a-zçğıöşü]/.test(s),/[A-ZÇĞİÖŞÜ]/.test(s),/\d/.test(s),s.length>=14,/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(s)];
    return {checks,score:checks.filter(Boolean).length};
  }
  function bindPasswordMeter(inputId,meterId){
    const input=document.getElementById(inputId),meter=document.getElementById(meterId);if(!input||!meter)return;
    const draw=()=>{const {checks,score}=passwordScore(input.value);meter.dataset.score=String(score);meter.querySelectorAll('[data-pass-check]').forEach((el,i)=>el.classList.toggle('ok',Boolean(checks[i])));const label=meter.querySelector('[data-pass-label]');if(label)label.textContent=score<=2?'Zayıf':score<=4?'Yeterli':'Güçlü'};
    input.addEventListener('input',draw);draw();
  }

  function connectionState(){
    const banner=document.getElementById('connection-banner');if(!banner)return;
    const online=navigator.onLine;banner.hidden=online;banner.textContent=online?'':'İnternet bağlantısı yok. Bazı canlı veriler güncellenmeyebilir.';document.documentElement.classList.toggle('is-offline',!online);
  }

  function confirmAction({title='İşlemi onayla',message='',confirmText='Onayla',danger=false}={}){
    const overlay=document.getElementById('confirm-overlay');if(!overlay)return Promise.resolve(false);
    document.getElementById('confirm-title').textContent=title;document.getElementById('confirm-message').textContent=message;
    const btn=document.getElementById('confirm-accept');btn.textContent=confirmText;btn.classList.toggle('danger',danger);btn.classList.toggle('primary',!danger);
    openModal(overlay,{focus:'#confirm-accept'});
    return new Promise(resolve=>{confirmResolve=resolve});
  }
  function resolveConfirm(value){if(confirmResolve){const r=confirmResolve;confirmResolve=null;r(Boolean(value))}closeModal('confirm-overlay')}

  function init(){
    document.addEventListener('keydown',onKeydown);
    document.querySelectorAll('input[type="password"]').forEach(enhancePasswordInput);
    bindPasswordMeter('signup-password','signup-password-meter');bindPasswordMeter('recovery-password','recovery-password-meter');
    window.addEventListener('online',connectionState);window.addEventListener('offline',connectionState);connectionState();
    document.querySelectorAll('.modal-overlay').forEach(el=>el.addEventListener('mousedown',e=>{if(e.target===el&&el.dataset.escapeClose!=='false')closeModal(el)}));
    document.getElementById('confirm-cancel')?.addEventListener('click',()=>resolveConfirm(false));
    document.getElementById('confirm-close')?.addEventListener('click',()=>resolveConfirm(false));
    document.getElementById('confirm-accept')?.addEventListener('click',()=>resolveConfirm(true));
  }
  return {init,openModal,closeModal,setBusy,confirmAction,passwordScore};
})();
document.addEventListener('DOMContentLoaded',NevGenc.ui.init,{once:true});
