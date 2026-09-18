(function(){
  window.__LIBYAN_RECOVERY_ACTIVE=location.hash.includes('type=recovery')||location.search.includes('type=recovery');
  const CONFIG_URL='https://aybsettkyxfugntizfqq.supabase.co/functions/v1/public-config';
  let client=null;
  const app=()=>document.getElementById('app');
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  async function getClient(){
    if(client)return client;
    const cfg=window.LIBYAN_STORE_CONFIG||{};
    if(!cfg.url||!cfg.publishableKey){const r=await fetch(CONFIG_URL,{cache:'no-store'});if(!r.ok)throw new Error('تعذر تحميل إعدادات المتجر');Object.assign(cfg,await r.json());window.LIBYAN_STORE_CONFIG=cfg;}
    client=window.supabase.createClient(cfg.url,cfg.publishableKey);
    return client;
  }
  function redirectUrl(){return 'https://libyanstore.pages.dev/';}
  async function sendReset(){
    const email=(document.getElementById('recoveryEmail')||{}).value?.trim();
    const msg=document.getElementById('recoveryMsg');
    if(!email)return msg.textContent='اكتب بريدك الإلكتروني أولاً';
    msg.textContent='جارٍ إرسال رابط الاستعادة...';
    try{const sb=await getClient();const r=await sb.auth.resetPasswordForEmail(email,{redirectTo:redirectUrl()});if(r.error)throw r.error;msg.textContent='تم إرسال رابط تغيير كلمة المرور إلى بريدك. افتح الرابط من نفس الجهاز.';}
    catch(e){msg.textContent=e.message||'تعذر إرسال رابط الاستعادة';}
  }
  function renderRecovery(){
    app().innerHTML='<div style="max-width:430px;margin:35px auto;text-align:center"><div style="font-size:48px">🔐</div><h1>استعادة كلمة المرور</h1><p class="muted">أدخل بريد حسابك وسنرسل لك رابطًا آمنًا لتغيير كلمة المرور.</p><div class="card" style="display:grid;gap:10px;text-align:right"><input id="recoveryEmail" class="field" type="email" placeholder="البريد الإلكتروني"><button class="btn primary" id="sendRecovery">إرسال رابط الاستعادة</button><button class="btn" id="backLogin">العودة لتسجيل الدخول</button><small id="recoveryMsg" class="muted"></small></div></div>';
    document.getElementById('sendRecovery').onclick=sendReset;
    document.getElementById('backLogin').onclick=()=>location.reload();
  }
  async function finishRecovery(){
    if(!location.hash.includes('type=recovery')&&!location.search.includes('type=recovery'))return;
    try{
      const sb=await getClient();
      await sb.auth.getSession();
      app().innerHTML='<div style="max-width:430px;margin:35px auto;text-align:center"><div style="font-size:48px">🔑</div><h1>تعيين كلمة مرور جديدة</h1><p class="muted">اختر كلمة مرور جديدة لحسابك.</p><div class="card" style="display:grid;gap:10px;text-align:right"><input id="newPassword" class="field" type="password" placeholder="كلمة المرور الجديدة"><input id="newPassword2" class="field" type="password" placeholder="تأكيد كلمة المرور"><button class="btn primary" id="savePassword">حفظ كلمة المرور</button><small id="passwordMsg" class="muted"></small></div></div>';
      document.getElementById('savePassword').onclick=async()=>{
        const p=document.getElementById('newPassword').value,p2=document.getElementById('newPassword2').value,msg=document.getElementById('passwordMsg');
        if(p.length<6)return msg.textContent='كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        if(p!==p2)return msg.textContent='كلمتا المرور غير متطابقتين';
        msg.textContent='جارٍ الحفظ...';
        const r=await sb.auth.updateUser({password:p});
        if(r.error)return msg.textContent=r.error.message;
        msg.textContent='تم تغيير كلمة المرور بنجاح. جارٍ فتح المتجر...';
        setTimeout(()=>{location.hash='';location.href=redirectUrl();},900);
      };
    }catch(e){app().innerHTML='<div class="card" style="max-width:430px;margin:35px auto;text-align:center"><h2>تعذر استعادة الجلسة</h2><p class="muted">'+esc(e.message||'الرابط غير صالح أو منتهي الصلاحية')+'</p><button class="btn primary" onclick="location.href=\"'+redirectUrl()+'\"">العودة للمتجر</button></div>';}
  }
  function addForgotButton(){
    const card=document.querySelector('#login')?.parentElement;if(!card||document.getElementById('forgotPassword'))return;
    const b=document.createElement('button');b.id='forgotPassword';b.className='btn';b.textContent='نسيت كلمة المرور؟';b.onclick=renderRecovery;
    const signup=document.getElementById('signup');if(signup)signup.insertAdjacentElement('afterend',b);else card.appendChild(b);
  }
  async function start(){
    try{await finishRecovery();}catch(_){return;}
    addForgotButton();
    new MutationObserver(()=>addForgotButton()).observe(document.body,{childList:true,subtree:true});
  }
  start();
})();
