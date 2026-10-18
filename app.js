/* admin-account-entry test */
let sb,session,products=[],cart={},cartOptions={},profile,wallet,productOptions=[],adminTopupChannel,stockRefreshTimer,supportWhatsapp='0910005566';
const app=document.getElementById('app');
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const money=v=>`${Number(v||0).toFixed(2)} د.ل`;
const el=id=>document.getElementById(id);
let authBusy=false;
async function boot(){
 try{
  sb=await loadSupabase();
  if(window.__LIBYAN_RECOVERY_ACTIVE){ window.__LIBYAN_RECOVERY_ACTIVE=false; }
  const r=await sb.auth.getSession();
  if(r.error)throw r.error;
  session=r.data.session||null;
  const forceLogin=new URLSearchParams(location.search).get('login')==='1';
  if(forceLogin){
   if(session){const out=await sb.auth.signOut();if(out.error)throw out.error;}
   session=null;profile=null;wallet=null;
   renderLogin('',false);
   return;
  }
  if(!session){
   renderLogin('',false);
   return;
  }
  await loadStore();
 }catch(e){
  app.innerHTML='<div class="card" style="text-align:center;margin-top:30px"><h1>⚡ Libyan Store</h1><p class="muted">'+esc(e.message||'تعذر تشغيل المتجر')+'</p><button class="btn primary" onclick="location.reload()">إعادة المحاولة</button></div>'
 }
}
function renderLogin(msg='',signupMode=false){
 const modeLabel=signupMode?'إنشاء حساب جديد':'مرحبًا بعودتك';
 app.innerHTML=`<section class="auth-page" dir="rtl">
  <div class="auth-glow auth-glow-one"></div><div class="auth-glow auth-glow-two"></div>
  <div class="auth-layout">
   <aside class="auth-welcome">
    <div class="auth-brand"><span class="auth-brand-mark">L</span><span><b>Libyan Store</b><small>متجرك الرقمي بكل سهولة</small></span></div>
    <div class="auth-welcome-copy"><span class="auth-eyebrow"><i></i> تجربة تسوّق أسهل</span><h1>كل اللي تحتاجه،<br><em>في مكان واحد.</em></h1><p>سجّل دخولك وتابع مشترياتك وطلباتك، أو أنشئ حسابًا جديدًا في خطوات بسيطة.</p>
     <div class="auth-benefits"><div><span>✓</span><div><b>حسابك في أمان</b><small>تسجيل دخول وتحقق بالبريد</small></div></div><div><span>↗</span><div><b>تجربة سلسة</b><small>واجهة واضحة على الهاتف والكمبيوتر</small></div></div></div>
    </div><div class="auth-aside-foot"><span class="auth-live-dot"></span> متجر ليبي، تجربة رقمية حديثة</div>
   </aside>
   <section class="auth-panel">
    <div class="auth-mobile-brand"><span class="auth-brand-mark">L</span><b>Libyan Store</b></div>
    <div class="auth-form-head"><span class="auth-form-icon">${signupMode?'✦':'↗'}</span><span class="auth-eyebrow">أهلًا بيك</span><h2>${modeLabel}</h2><p>${signupMode?'أنشئ حسابك وابدأ تجربتك معانا.':'سجّل دخولك للمتابعة إلى متجرك.'}</p></div>
    <div class="auth-tabs" role="tablist" aria-label="نوع الحساب"><button type="button" id="authTabLogin" class="${signupMode?'':'active'}" aria-selected="${!signupMode}">تسجيل الدخول</button><button type="button" id="authTabSignup" class="${signupMode?'active':''}" aria-selected="${signupMode}">حساب جديد</button></div>
    <form id="authForm" class="auth-form" novalidate>
     ${signupMode?'<label class="auth-label" for="fullName">الاسم الكامل</label><div class="auth-input-wrap"><span class="auth-input-icon">♙</span><input id="fullName" class="field auth-field" autocomplete="name" placeholder="اكتب اسمك الكامل" required></div><label class="auth-label" for="phone">رقم الهاتف</label><div class="auth-input-wrap"><span class="auth-input-icon">⌕</span><input id="phone" class="field auth-field" type="tel" inputmode="tel" autocomplete="tel" placeholder="09xxxxxxxx" required></div>':''}
     <label class="auth-label" for="email">البريد الإلكتروني</label><div class="auth-input-wrap"><span class="auth-input-icon">✉</span><input id="email" class="field auth-field" type="email" autocomplete="email" placeholder="name@example.com" required dir="ltr"></div>
     <label class="auth-label" for="pass">كلمة المرور</label><div class="auth-input-wrap"><span class="auth-input-icon">⌑</span><input id="pass" class="field auth-field" type="password" autocomplete="${signupMode?'new-password':'current-password'}" placeholder="6 أحرف على الأقل" required minlength="6" dir="auto"><button class="auth-show-pass" id="togglePass" type="button" aria-label="إظهار كلمة المرور" aria-pressed="false">إظهار</button></div>
     <div class="auth-form-tools">${signupMode?'<span class="auth-hint">استخدم 6 أحرف على الأقل</span>':'<button type="button" id="forgot" class="auth-link">نسيت كلمة المرور؟</button>'}</div>
     <button class="btn primary auth-submit" id="login" type="submit"><span>${signupMode?'إنشاء الحساب وإرسال رمز التحقق':'تسجيل الدخول'}</span><span class="auth-submit-arrow">←</span></button>
     <button class="btn auth-secondary" id="signup" type="button">${signupMode?'العودة لتسجيل الدخول':'إنشاء حساب جديد'} <span>＋</span></button>
     <div class="auth-message ${msg?'has-message':''}" id="msg" role="status" aria-live="polite">${esc(msg)}</div>
    </form>
    <p class="auth-terms">بالمتابعة، أنت تستخدم خدمات <b>Libyan Store</b> بأمان.</p>
   </section>
  </div>
 </section>`;
 el('authTabLogin').onclick=()=>{if(signupMode)renderLogin('',false)};
 el('authTabSignup').onclick=()=>{if(!signupMode)renderLogin('',true)};
 el('authForm').onsubmit=e=>{e.preventDefault();auth(signupMode)};
 el('login').onclick=e=>{e.preventDefault();auth(signupMode)};
 el('signup').onclick=()=>renderLogin('',!signupMode);
 const toggle=el('togglePass');
 toggle.onclick=()=>{const input=el('pass'),visible=input.type==='password';input.type=visible?'text':'password';toggle.textContent=visible?'إخفاء':'إظهار';toggle.setAttribute('aria-pressed',String(visible));toggle.setAttribute('aria-label',visible?'إخفاء كلمة المرور':'إظهار كلمة المرور');input.focus()};
 if(el('forgot'))el('forgot').onclick=resetPassword;
}
function renderVerifyEmail(email,msg=''){
 app.innerHTML=`<section class="auth-page" dir="rtl"><div class="auth-glow auth-glow-one"></div><div class="auth-glow auth-glow-two"></div><div class="auth-layout auth-verify-layout"><aside class="auth-welcome"><div class="auth-brand"><span class="auth-brand-mark">L</span><span><b>Libyan Store</b><small>متجرك الرقمي بكل سهولة</small></span></div><div class="auth-welcome-copy"><span class="auth-eyebrow"><i></i> خطوة أخيرة</span><h1>بريدك هو<br><em>مفتاح حسابك.</em></h1><p>أكّد بريدك الإلكتروني باش نحافظوا على أمان حسابك ونكملوا التسجيل.</p></div></aside><section class="auth-panel"><div class="auth-form-head"><span class="auth-form-icon">✉</span><span class="auth-eyebrow">تأكيد البريد</span><h2>تحقق من بريدك</h2><p>أرسلنا رمزًا إلى <b dir="ltr">${esc(email)}</b>. أدخل الرمز المكوّن من 6 أرقام.</p></div><div class="auth-form"><label class="auth-label" for="emailCode">رمز التحقق</label><input id="emailCode" class="field auth-field auth-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" dir="ltr"><button class="btn primary auth-submit" id="verifyCode" type="button"><span>تأكيد البريد الإلكتروني</span><span class="auth-submit-arrow">←</span></button><button class="btn auth-secondary" id="resendCode" type="button">إعادة إرسال الرمز</button><button class="btn auth-text-button" id="backToLogin" type="button">العودة لتسجيل الدخول</button><div id="msg" class="auth-message ${msg?'has-message':''}" role="status" aria-live="polite">${esc(msg)}</div></div></section></div></section>`;
 el('verifyCode').onclick=()=>verifyEmailCode(email);
 el('resendCode').onclick=()=>resendEmailCode(email);
 el('backToLogin').onclick=()=>renderLogin('',false);
 el('emailCode').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\\D/g,'').slice(0,6)});
 el('emailCode').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();verifyEmailCode(email)}});
}
async function verifyEmailCode(email){
 if(authBusy)return;
 const token=String(el('emailCode')?.value||'').replace(/\D/g,'');
 const msg=el('msg');
 if(token.length!==6){msg.textContent='اكتب رمز التحقق المكوّن من 6 أرقام.';return}
 authBusy=true;msg.textContent='جارٍ التحقق من الرمز...';el('verifyCode').disabled=true;
 try{
  const r=await sb.auth.verifyOtp({email,token,type:'signup'});
  if(r.error){msg.textContent=humanAuthError(r.error);return}
  session=r.data.session||null;
  if(!session){msg.textContent='تم التحقق، لكن تعذر فتح الجلسة. ارجع وسجّل الدخول.';return}
  await loadStore();
 }catch(e){msg.textContent=humanAuthError(e)}
 finally{authBusy=false;if(el('verifyCode'))el('verifyCode').disabled=false}
}
async function resendEmailCode(email){
 if(authBusy)return;
 const msg=el('msg');authBusy=true;msg.textContent='جارٍ إرسال رمز جديد...';el('resendCode').disabled=true;
 try{
  const r=await sb.auth.resend({type:'signup',email});
  if(r.error){msg.textContent=humanAuthError(r.error);return}
  msg.textContent='طلبنا إرسال رمز جديد. افحص البريد الوارد ومجلد الرسائل غير المرغوب فيها.';
 }catch(e){msg.textContent=humanAuthError(e)}
 finally{authBusy=false;if(el('resendCode'))el('resendCode').disabled=false}
}
async function socialLogin(provider){
 if(authBusy)return;
 const msg=el('msg');authBusy=true;if(msg)msg.textContent=provider==='google'?'جارٍ فتح Google...':'جارٍ فتح تسجيل الدخول...';
 try{
  localStorage.setItem('__libyan_social_login_pending','1');
  const redirectTo=location.origin+'/';
  const r=await sb.auth.signInWithOAuth({provider,options:{redirectTo,queryParams:{prompt:'select_account'}}});
  if(r.error){
   localStorage.removeItem('__libyan_social_login_pending');
   if(msg)msg.textContent=humanAuthError(r.error);
  }
 }catch(e){
  localStorage.removeItem('__libyan_social_login_pending');
  if(msg)msg.textContent=humanAuthError(e);
 }finally{authBusy=false}
}
async function resetPassword(){const email=el('email').value.trim(),msg=el('msg');if(!email)return msg.textContent='اكتب بريدك الإلكتروني أولاً';msg.textContent='جارٍ إرسال رابط الاستعادة...';try{const r=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(r.error)return msg.textContent=r.error.message;msg.textContent='تم إرسال رابط تغيير كلمة المرور إلى بريدك. افتح الرابط من نفس الجهاز.'}catch(e){msg.textContent=e.message||'تعذر إرسال رابط الاستعادة'}}
async function notifyLoginToDiscord(){try{const r=await sb.functions.invoke('discord-notify',{body:{type:'login',id:session.user.id}});if(r.error)console.log('Discord login notification error:',r.error);else console.log('Discord login notification sent:',r.data)}catch(e){console.log('Discord login notification:',e)}}
async function auth(signup){
 if(authBusy)return;
 const msg=el('msg'),button=signup?el('signup'):el('login');
 const email=emailInput(),password=el('pass')?.value||'';
 if(!email)return msg.textContent='اكتب البريد الإلكتروني أولاً';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return msg.textContent='تأكد من كتابة بريد إلكتروني صحيح.';
 if(password.length<6)return msg.textContent='كلمة المرور يجب أن تكون 6 أحرف على الأقل';
 let fullName='',phone='';
 if(signup){
  fullName=el('fullName')?.value.trim()||'';phone=el('phone')?.value.trim()||'';
  if(fullName.length<2)return msg.textContent='اكتب الاسم الكامل';
  if(!phone)return msg.textContent='اكتب رقم الهاتف';
 }
 authBusy=true;msg.textContent=signup?'جارٍ إنشاء الحساب وإرسال رمز التحقق...':'جارٍ تسجيل الدخول...';if(button)button.disabled=true;
 try{
  if(signup){
   const r=await sb.auth.signUp({email,password,options:{data:{full_name:fullName,phone}}});
   if(r.error){msg.textContent=humanAuthError(r.error);return}
   if(r.data.session){
    await sb.auth.signOut();
    session=null;
   }
   renderVerifyEmail(email,'إذا لم تصلك الرسالة خلال دقائق، افحص مجلد الرسائل غير المرغوب فيها أو أعد إرسال الرمز.');
   return;
  }
  const r=await sb.auth.signInWithPassword({email,password});
  if(r.error){msg.textContent=humanAuthError(r.error);return}
  session=r.data.session||null;
  if(!session){msg.textContent='تعذر إنشاء جلسة تسجيل الدخول. حاول مرة أخرى.';return}
  notifyLoginToDiscord();
  await loadStore();
 }catch(e){if(el('msg'))el('msg').textContent=humanAuthError(e)}
 finally{authBusy=false;if(button)button.disabled=false}
}
function humanAuthError(e){
 const m=String(e?.message||e||'تعذر تنفيذ العملية');
 if(/invalid login credentials/i.test(m))return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
 if(/email not confirmed/i.test(m))return 'الحساب غير مؤكد. افتح رسالة التأكيد في بريدك الإلكتروني ثم حاول تسجيل الدخول.';
 if(/user already registered/i.test(m))return 'هذا البريد مسجل بالفعل. استخدم تسجيل الدخول بدل إنشاء حساب.';
 if(/password.*(weak|at least)/i.test(m))return 'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.';
 if(/rate limit|too many requests/i.test(m))return 'تم تجاوز عدد المحاولات مؤقتًا. انتظر قليلًا ثم حاول مرة أخرى.';
 return m;
}
function humanOrderError(e){
 const m=String(e?.message||e||'تعذر تنفيذ العملية');
 if(/insufficient_stock/i.test(m))return '❌ المنتج غير متوفر حاليًا. أضف المخزون من البوت أولًا ثم حاول الشراء مرة أخرى.';
 if(/invalid_customer_name/i.test(m))return '❌ الاسم الكامل غير صحيح.';
 if(/invalid_customer_phone/i.test(m))return '❌ رقم الهاتف غير صحيح.';
 if(/invalid_sender_phone/i.test(m))return '❌ رقم الهاتف الذي حوّلت منه غير صحيح.';
 if(/invalid_payment_method/i.test(m))return '❌ اختر ليبيانا أو المدار.';
 if(/product_not_found|product_unavailable/i.test(m))return '❌ المنتج غير متوفر حاليًا. تأكد من وجود مخزون لهذا المنتج ثم حاول الشراء مرة أخرى.';
 if(/whatsapp_required/i.test(m))return '❌ رقم الواتساب مطلوب لهذا المنتج.';
 if(/roblox_username_required/i.test(m))return '❌ يوزر Roblox مطلوب لهذا المنتج.';
 if(/invalid_roblox_username/i.test(m))return '❌ يوزر Roblox غير صالح. استخدم 3-20 حرفًا/رقمًا، ويمكن استخدام _ مرة واحدة فقط.';
 if(/not_authenticated|auth/i.test(m))return '❌ يجب تسجيل الدخول أولًا.';
 return m;
}
function emailInput(){return el('email').value.trim()}
function whatsappInternational(value){const raw=String(value||'').replace(/\D/g,'');if(raw.startsWith('218'))return raw;if(raw.startsWith('0'))return '218'+raw.slice(1);return raw;}
let storeLoading=null;
async function loadStore(){
 if(storeLoading)return storeLoading;
 storeLoading=(async()=>{
  const uid=session?.user?.id;
  if(!uid)throw new Error('جلسة تسجيل الدخول غير موجودة');
  app.innerHTML='<div class="card" style="max-width:430px;margin:35px auto;text-align:center"><div style="font-size:42px">⏳</div><h2>جاري فتح المتجر</h2><p class="muted">لحظات ونكون جاهزين...</p></div>';
  const withTimeout=(promise,label,ms=12000)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('انتهت مهلة تحميل '+label+'، تحقق من اتصال الإنترنت ثم أعد المحاولة.')),ms))]);
  try{
   const [pr,opts,settings]=await Promise.all([
    withTimeout(sb.from('products').select('id,name,description,category,price,currency,always_available,requires_whatsapp,requires_roblox_username').eq('active',true).order('created_at'),'المنتجات'),
    withTimeout(sb.from('product_options').select('id,product_id,option_type,option_name,active').eq('active',true).order('created_at'),'خيارات المنتجات'),
    withTimeout(sb.from('store_settings').select('key,value').in('key',['whatsapp_number']),'إعدادات المتجر').catch(()=>({data:[],error:null}))
   ]);
   if(pr.error)throw pr.error;
   productOptions=opts.error?[]:(opts.data||[]);
   const settingsMap=Object.fromEntries((settings?.data||[]).map(x=>[x.key,x.value]));
   if(String(settingsMap.whatsapp_number||'').trim())supportWhatsapp=String(settingsMap.whatsapp_number).trim();

   const [p,w,stock]=await Promise.allSettled([
    withTimeout(sb.from('profiles').select('full_name,phone,role').eq('id',uid).maybeSingle(),'بيانات الحساب'),
    withTimeout(sb.from('wallets').select('balance').eq('user_id',uid).maybeSingle(),'المحفظة'),
    withTimeout(sb.rpc('get_active_product_stock'),'المخزون')
   ]);

   if(p.status==='fulfilled'){
    if(p.value.error)console.warn('profiles load:',p.value.error);
    else profile=p.value.data||{full_name:'',phone:'',role:'customer'};
   }else console.warn('profiles load failed:',p.reason);

   if(w.status==='fulfilled'){
    if(w.value.error)console.warn('wallet load:',w.value.error);
    else wallet=w.value.data||{balance:0};
   }else console.warn('wallet load failed:',w.reason);

   const stockMap=new Map();
   if(stock.status==='fulfilled' && !stock.value.error){
    (stock.value.data||[]).forEach(x=>stockMap.set(String(x.product_id),Number(x.available_stock||0)));
   }else{
    console.warn('stock load failed:',stock.status==='fulfilled'?stock.value.error:stock.reason);
   }

   products=(pr.data||[]).map(p=>({...p,stock_count:p.always_available?999999:(stockMap.get(String(p.id))||0)}));
   renderStore();
   startStockRefresh();
   startAdminTopupRealtime();
  }catch(e){
   console.error('loadStore failed:',e);
   app.innerHTML='<div class="card" style="max-width:430px;margin:35px auto;text-align:center"><div style="font-size:42px">⚠️</div><h2>تعذر فتح المتجر</h2><p class="muted">حدث خطأ أثناء تحميل المنتجات.</p><small class="muted">'+esc(e.message||'خطأ غير معروف')+'</small><button class="btn primary" style="width:100%;margin-top:14px" onclick="location.reload()">إعادة المحاولة</button></div>';
  }
 })().finally(()=>{storeLoading=null});
 return storeLoading;
}
async function refreshProductStock(){
  if(!sb||!session)return;
  try{
    const r=await sb.rpc('get_active_product_stock');
    if(r.error){console.warn('stock refresh:',r.error);return}
    const stockMap=new Map((r.data||[]).map(x=>[String(x.product_id),Number(x.available_stock||0)]));
    let changed=false;
    products=products.map(p=>{
      const nextStock=p.always_available?999999:(stockMap.get(String(p.id))||0);
      if(Number(p.stock_count||0)!==nextStock)changed=true;
      return {...p,stock_count:nextStock};
    });
    if(changed&&el('view'))renderProducts();
  }catch(e){console.warn('stock refresh failed:',e)}
}
function startStockRefresh(){
  if(stockRefreshTimer)clearInterval(stockRefreshTimer);
  stockRefreshTimer=setInterval(refreshProductStock,30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshProductStock()},{once:false});
  window.addEventListener('focus',refreshProductStock,{once:false});
}
function startAdminTopupRealtime(){if(profile?.role!=='admin'||!sb)return;if(adminTopupChannel){sb.removeChannel(adminTopupChannel);adminTopupChannel=null}adminTopupChannel=sb.channel('admin-wallet-topups').on('postgres_changes',{event:'INSERT',schema:'public',table:'wallet_topups'},payload=>{const row=payload.new;if(row?.status==='pending')showTopupNotification(row)}).subscribe(status=>{if(status!=='SUBSCRIBED')console.log('Topup realtime status:',status)})}
function showTopupNotification(row){const old=document.getElementById('topupToast');if(old)old.remove();const toast=document.createElement('div');toast.id='topupToast';toast.dir='rtl';toast.style.cssText='position:fixed;top:18px;right:18px;z-index:99999;max-width:360px;background:#17100c;border:1px solid #ff7a18;box-shadow:0 12px 35px rgba(0,0,0,.45);border-radius:16px;padding:15px;color:#fff;font-family:inherit';toast.innerHTML=`<div style="font-size:18px;font-weight:800">🔔 طلب تعبئة رصيد جديد</div><div style="margin-top:8px;color:#ffd9bd">المبلغ: <b>${money(row.amount)}</b></div><div style="margin-top:3px;color:#ffd9bd">الطريقة: <b>${esc(row.method)}</b></div><div style="margin-top:3px;color:#ffd9bd">رقم المحوّل: <b>${esc(row.sender_phone||'غير متوفر')}</b></div><button class="btn primary" id="closeTopupToast" style="width:100%;margin-top:12px">فتح طلبات الشحن</button>`;document.body.appendChild(toast);el('closeTopupToast').onclick=()=>{toast.remove();const adminBtn=document.querySelector('[data-view="admin"]');if(adminBtn)adminBtn.click()};try{const Ctx=window.AudioContext||window.webkitAudioContext;if(Ctx){const ctx=new Ctx(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=880;gain.gain.value=.05;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.18);setTimeout(()=>ctx.close(),300)}}catch(e){}if('Notification'in window&&Notification.permission==='granted'){try{new Notification('طلب تعبئة رصيد جديد',{body:`${money(row.amount)} — ${row.method}`})}catch(e){}}}
function getAccountAvatarUrl(){
 const user=session?.user||{};
 const identities=Array.isArray(user.identities)?user.identities:[];
 const google=identities.find(x=>x.provider==='google')?.identity_data||{};
 const meta=user.user_metadata||{};
 return google.avatar_url||google.picture||google.photo_url||meta.avatar_url||meta.picture||meta.avatar||'';
}
function renderStore(){
  app.innerHTML=`<div class="shell lc-shell">
    <header class="lc-header">
      <button class="lc-icon" id="lcMenu" aria-label="القائمة">☰</button>
      <button class="lc-icon" id="lcSearch" aria-label="بحث">⌕</button>
      <button class="lc-icon" id="lcBell" aria-label="الإشعارات">♟</button>
      
      <button class="lc-account-avatar" id="lcAccountAvatar" type="button" aria-label="حسابي" title="${esc(profile?.full_name||session.user.email||'حسابي')}">
        ${getAccountAvatarUrl()?'<img src="'+esc(getAccountAvatarUrl())+'" alt="صورة الحساب" referrerpolicy="no-referrer">':'<span>'+esc((profile?.full_name||session.user.email||'ح').trim().slice(0,1).toUpperCase())+'</span>'}
      </button>
      <div class="lc-logo"><span>Libyan Store</span><span class="lc-logo-mark">LS</span></div>
    </header>
    <div id="view"></div>
    <nav class="lc-bottom">
      <button class="active" data-view="store">⌂<br>الرئيسية</button>
      
      <button data-view="cart">▣<span class="lc-badge" id="navCartCount">0</span><br>المشتريات</button>
      <button data-view="orders">▤<br>البطاقات</button>
      <button data-view="account">⚙<br>الإعدادات</button>
    </nav>
    <div class="lc-drawer" id="lcDrawer"><div class="lc-drawer-backdrop" id="lcBackdrop"></div><aside class="lc-drawer-panel">
      <button class="lc-icon" id="lcDrawerClose">×</button><div class="lc-drawer-title">القائمة الرئيسية</div>
      <div class="lc-profile"><div class="lc-profile-avatar">●</div><div style="font-size:21px;font-weight:900">${esc(profile?.full_name||session.user.email||'العميل')}</div><div class="muted">${esc(session.user.email||'')}</div></div>
      <button class="lc-drawer-btn" data-view="store">⌂ &nbsp; الرئيسية</button>
      <button class="lc-drawer-btn" data-view="orders">▤ &nbsp; طلباتي</button>
      
      <button class="lc-drawer-btn" data-view="account">● &nbsp; المعلومات الشخصية</button>
      ${profile?.role==='admin'?'<button class="lc-drawer-btn" data-view="admin">⚙ &nbsp; الإدارة</button>':''}
      <button class="lc-drawer-btn" id="lcLogout" style="color:#ff776f;margin-top:18px">⇥ &nbsp; تسجيل الخروج</button>
    </aside></div>
  </div>`;
  const close=()=>el('lcDrawer')?.classList.remove('open');
  el('lcAccountAvatar').onclick=()=>{const accountBtn=document.querySelector('[data-view="account"]');if(accountBtn)accountBtn.click()};
  el('lcMenu').onclick=()=>el('lcDrawer').classList.add('open');el('lcBackdrop').onclick=close;el('lcDrawerClose').onclick=close;
  el('lcSearch').onclick=()=>{const q=prompt('ابحث عن منتج');if(!q)return;const found=products.find(p=>String(p.name||'').toLowerCase().includes(q.toLowerCase()));if(found)showProduct(found);else alert('لم يتم العثور على المنتج')};
  el('lcBell').onclick=()=>alert('لا توجد إشعارات جديدة حالياً.');
  el('heroBrowse')?.addEventListener('click',()=>el('view')?.scrollIntoView({behavior:'smooth',block:'start'}));
  el('lcLogout').onclick=async()=>{if(!confirm('هل تريد تسجيل الخروج؟'))return;try{const r=await sb.auth.signOut();if(r.error)throw r.error;session=null;profile=null;wallet=null;renderLogin('تم تسجيل الخروج بنجاح.',false)}catch(e){alert(humanAuthError(e))}};
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{const viewName=b.dataset.view;if(viewName==='wallet'){close();return}document.querySelectorAll('[data-view]').forEach(x=>x.classList.remove('active'));b.classList.add('active');({store:renderProducts,cart:renderCartPage,wallet:renderWallet,orders:renderOrders,account:renderAccount,admin:renderAdmin}[viewName])();close()});
  renderProducts();
}
function renderCartPage(){
  const entries=Object.entries(cart).filter(([id,q])=>Number(q)>0&&products.some(p=>p.id===id));  let total=0;
  const rows=entries.map(([id,q])=>{const p=products.find(x=>x.id===id);const t=Number(p.price)*Number(q);total+=t;return `<div style="padding:12px 0;border-bottom:1px solid #202b3a"><div style="display:flex;justify-content:space-between"><div><b>${esc(p.name)}</b><div class="muted">${money(p.price)} × ${q}</div></div><b>${money(t)}</b></div><div style="display:flex;gap:7px;margin-top:8px"><button class="btn" data-minus="${p.id}">−</button><span class="pill">${q}</span><button class="btn" data-plus="${p.id}">+</button><button class="btn" data-remove="${p.id}" style="margin-right:auto">🗑️ إزالة</button></div></div>`}).join('');
  el('view').innerHTML=entries.length?`<h2>🛒 السلة</h2><div class="card">${rows}<hr style="border-color:#263345"><b>الإجمالي: ${money(total)}</b><button class="btn primary" id="pageBuy" style="width:100%;margin-top:12px">الدفع لهذا الطلب</button></div>`:'<div class="card" style="text-align:center"><h2>🛒 السلة فارغة</h2><p class="muted">أضف منتجًا من المتجر ليظهر هنا.</p></div>';
  document.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{const id=b.dataset.plus;cart[id]=(cart[id]||0)+1;renderCartPage()});
  document.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const id=b.dataset.minus;if((cart[id]||0)>1)cart[id]--;else delete cart[id];renderCartPage()});
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{delete cart[b.dataset.remove];renderCartPage()});
  if(el('pageBuy'))el('pageBuy').onclick=checkout;
}
const robuxOldPrices={'روبلوكس 100':20,'روبلوكس 200':40,'روبلوكس 300':60,'روبلوكس 400':80,'روبلوكس 500':100,'روبلوكس 600':120,'روبلوكس 700':140,'روبلوكس 800':160,'روبلوكس 900':180,'روبلوكس 1000':200};
function renderProducts(){
  const view=el('view');if(!view)return;
  const imageFor=p=>typeof productImage==='function'?productImage(p.name):'';
  const categoryTitle=category=>category==='Netflix'?'اشتراكات نتفلكس':category;
  const categories=[...new Set(products.map(p=>String(p.category||'رقمي').trim()||'رقمي'))];
  const packageCards=products.map(p=>{
    const img=imageFor(p);
    const available=Boolean(p.always_available)||Number(p.stock_count||0)>0;
    const stockText=p.always_available?'متوفر دائمًا':available?'متوفر الآن':'غير متوفر حاليًا';
    const stockClass=available?'available':'unavailable';
    const category=String(p.category||'رقمي').trim()||'رقمي';
    const desc=String(p.description||'').trim();
    return '<article class="lc-package-card">'+
      '<button type="button" class="lc-package-main" data-product-open="'+p.id+'">'+
        '<div class="lc-package-media">'+
          (img?'<img src="'+img+'" alt="'+esc(p.name)+'">':'<div class="lc-product-placeholder">⚡</div>')+
          '<span class="lc-package-category">'+esc(categoryTitle(category))+'</span><span class="lc-package-discount">خصم</span>'+
        '</div>'+
        '<div class="lc-package-content">'+
          '<div class="lc-package-head"><h3>'+esc(p.name)+'</h3><span class="lc-package-status '+stockClass+'">'+esc(stockText)+'</span></div>'+
          (desc?'<p class="lc-package-description">'+esc(desc)+'</p>':'<p class="lc-package-description">باقة رقمية جاهزة للشراء والتسليم.</p>')+
          '<div class="lc-package-footer"><div class="lc-package-pricing"><span class="lc-package-old-price">'+money(robuxOldPrices[p.name]||0)+'</span><span class="lc-package-price">'+money(p.price)+'</span><small>السعر بعد الخصم</small></div><span class="lc-package-open">عرض الباقة ←</span></div>'+
        '</div>'+
      '</button>'+
    '</article>';
  }).join('');
  const filters='<button type="button" class="lc-filter-chip active" data-package-filter="all">الكل <span>'+products.length+'</span></button>'+
    categories.map(c=>'<button type="button" class="lc-filter-chip" data-package-filter="'+esc(c)+'">'+esc(categoryTitle(c))+' <span>'+products.filter(p=>String(p.category||'رقمي').trim()===c).length+'</span></button>').join('');
  const welcomeName=String(profile?.full_name||session?.user?.user_metadata?.full_name||session?.user?.email?.split('@')[0]||'عميلنا').trim();
  const avatarUrl=getAccountAvatarUrl();
  view.innerHTML='<section class="lc-packages-page">'+
    '<div style="display:flex;align-items:center;gap:12px;padding:16px;margin-bottom:16px;border-radius:18px;background:linear-gradient(135deg,#211b55,#30276d);color:#fff">'+
      '<div style="width:54px;height:54px;flex:0 0 54px;border-radius:50%;overflow:hidden;background:#fff2;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800">'+(avatarUrl?'<img src="'+esc(avatarUrl)+'" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover">':esc(welcomeName.slice(0,1).toUpperCase()))+'</div>'+
      '<div><div style="font-size:13px;opacity:.85">أهلاً بيك من جديد 👋</div><div style="font-size:19px;font-weight:900;margin-top:3px">'+esc(welcomeName)+'</div><div style="font-size:12px;opacity:.8;margin-top:3px">حسابك جاهز للتسوّق</div></div>'+
    '</div>'+
    '<div class="lc-packages-hero"><div><span class="lc-category-kicker">Libyan Store</span><h1>الباقات المتاحة</h1><p>اختر الباقة المناسبة لك، وكل باقة موضحة بشكل مستقل.</p></div><div class="lc-packages-count"><b>'+products.length+'</b><span>باقة</span></div></div>'+
    '<div class="lc-package-filters" aria-label="فلترة الباقات">'+filters+'</div>'+
    (packageCards?'<div class="lc-package-grid" id="packageGrid">'+packageCards+'</div>':'<div class="lc-empty">لا توجد باقات متاحة حاليًا.</div>')+
    '<div id="cartBox" style="margin-top:18px"></div>'+
  '</section>';
  const bindProducts=()=>document.querySelectorAll('[data-product-open]').forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.productOpen);if(p)showProduct(p)});
  bindProducts();
  document.querySelectorAll('[data-package-filter]').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('[data-package-filter]').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    const category=btn.dataset.packageFilter;
    document.querySelectorAll('.lc-package-card').forEach(card=>{
      const productId=card.querySelector('[data-product-open]')?.dataset.productOpen;
      const p=products.find(x=>x.id===productId);
      card.style.display=category==='all'||String(p?.category||'رقمي').trim()===category?'':'none';
    });
  });
  renderCart();
}
function renderCategory(category){
  const view=el('view');if(!view)return;
  const list=products.filter(p=>String(p.category||'رقمي').trim()===String(category).trim());
  const imageFor=p=>typeof productImage==='function'?productImage(p.name):'';
  const cards=list.map(p=>{
    const img=imageFor(p);
    return '<button type="button" class="card lc-category-card" data-product-open="'+p.id+'">'+
      '<div class="lc-category-image">'+(img?'<img src="'+img+'" alt="'+esc(p.name)+'">':'<div class="lc-product-placeholder">⚡</div>')+'</div>'+
      '<div class="lc-category-body"><h3>'+esc(p.name)+'</h3><span class="pill">'+money(p.price)+'</span><span class="lc-category-arrow">←</span></div>'+
    '</button>';
  }).join('');
  view.innerHTML='<div class="lc-section-title"><button type="button" class="lc-back-btn" id="lcBackCategories">→ الفئات الرئيسية</button><h2>فئات '+esc(categoryTitle(category))+'</h2><span class="pill">'+list.length+' فئات</span></div>'+
    (cards?'<div class="lc-products lc-categories">'+cards+'</div>':'<div class="lc-empty">لا توجد فئات في هذه المجموعة.</div>')+'<div id="cartBox" style="margin-top:15px"></div>';
  el('lcBackCategories').onclick=renderProducts;
  document.querySelectorAll('[data-product-open]').forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.productOpen);if(p)showProduct(p)});
  renderCart();
}

function showProduct(p){
  const view=el('view');if(!view)return;
  const img=typeof productImage==='function'?productImage(p.name):'';
  const available=Boolean(p.always_available)||Number(p.stock_count||0)>0;
  const isDragon=String(p.name||'').trim()==='دراقون';
  const requiresWhatsapp=Boolean(p.requires_whatsapp);
  const requiresRobloxUsername=Boolean(p.requires_roblox_username);
  let selectedColor=isDragon?(cartOptions[p.id]?.color||''):'';
  let selectedRobloxUsername=requiresRobloxUsername?(cartOptions[p.id]?.roblox_username||''):'';
  const dragonColors=isDragon?productOptions.filter(o=>String(o.product_id)===String(p.id)&&o.option_type==='color'&&o.active).map(o=>o.option_name):[];
  if(isDragon&&selectedColor&&!dragonColors.includes(selectedColor))selectedColor='';
  const colorButtons=isDragon?(dragonColors.length?dragonColors.map(color=>'<button type="button" class="btn" data-dragon-color="'+esc(color)+'">'+esc(color)+'</button>').join(''):'<div class="lc-option-hint">⚠️ لا توجد ألوان متوفرة حاليًا.</div>'):'';
  view.innerHTML=`<section class="lc-product-page">
    <button type="button" class="lc-back-btn" id="lcBackToProducts">← العودة للمنتجات</button>
    <article class="lc-detail-card">
      <div class="lc-detail-image">${img?'<img src="'+img+'" alt="'+esc(p.name)+'">':'<div class="lc-product-placeholder">⚡</div>'}</div>
      <div class="lc-detail-content">
        <h1>${esc(p.name)}</h1>
        <div class="lc-detail-price">${money(p.price)} <span>⌄</span></div>
        ${isDragon?`<div class="lc-required-box"><div class="lc-option-title">🎨 اختر اللون <span>مطلوب</span></div><div id="dragonColors" class="lc-color-grid">${colorButtons}</div><div id="dragonColorMsg" class="lc-option-hint">${selectedColor?'✓ اللون المختار: '+esc(selectedColor):'⚠️ لازم تختار لون قبل الشراء'}</div></div>`:''}
        ${requiresRobloxUsername?`<div class="lc-required-box"><div class="lc-option-title">🎮 يوزر Roblox <span>مطلوب</span></div><input id="productRobloxUsername" class="field" type="text" inputmode="text" autocomplete="off" maxlength="20" placeholder="مثال: RobloxPlayer123"><div class="lc-option-hint">📌 اكتب اسم المستخدم في Roblox كما هو، وليس Display Name.</div></div>`:''}
        ${requiresWhatsapp?`<div class="lc-required-box lc-whatsapp-box"><div class="lc-option-title">📱 رقم الواتساب <span>مطلوب</span></div><input id="productWhatsapp" class="field" type="tel" inputmode="tel" autocomplete="tel" placeholder="مثال: 0912345678"><div class="lc-option-hint">📌 اكتب رقم واتساب صحيح حتى نقدر نتواصل معك.</div></div>`:''}
        <label class="lc-detail-terms">
          <input type="checkbox" id="lcTerms">
          <span>أوافق على <b>الشروط والأحكام</b></span>
        </label>
        <div class="lc-detail-divider"></div>
        <div class="lc-detail-total"><span>الإجمالي:</span><strong>${money(p.price)}</strong></div>
        <button class="btn primary lc-detail-buy" id="lcBuyNow" type="button" ${(!available||((isDragon&&!selectedColor)||(requiresWhatsapp&&!String(cartOptions[p.id]?.whatsapp||'').trim())||(requiresRobloxUsername&&!String(cartOptions[p.id]?.roblox_username||'').trim())))?'disabled':''}>${available?'اشترِ الآن':'نفد المخزون'}</button>
      </div>
    </article>
  </section>`;
  el('lcBackToProducts').onclick=()=>renderProducts();
  const buy=el('lcBuyNow');
  const updateBuyState=()=>{
    const whatsapp=requiresWhatsapp?(el('productWhatsapp')?.value.trim()||''):'';
    const robloxUsername=requiresRobloxUsername?(el('productRobloxUsername')?.value.trim()||''):'';
    const ready=available&&(!isDragon||dragonColors.includes(selectedColor))&&(!requiresWhatsapp||!!whatsapp)&&(!requiresRobloxUsername||/^[A-Za-z0-9]+(_[A-Za-z0-9]+)?$/.test(robloxUsername)&&robloxUsername.length>=3&&robloxUsername.length<=20);
    if(buy){
      buy.disabled=!ready;
      if(ready)buy.textContent='اشترِ الآن';
      else if(available)buy.textContent='أكمل البيانات المطلوبة';
    }
  };
  if(isDragon){
    document.querySelectorAll('[data-dragon-color]').forEach(btn=>{
      if(btn.dataset.dragonColor===selectedColor)btn.classList.add('active');
      btn.onclick=()=>{
        selectedColor=btn.dataset.dragonColor;
        document.querySelectorAll('[data-dragon-color]').forEach(x=>x.classList.toggle('active',x===btn));
        const msg=el('dragonColorMsg');if(msg)msg.textContent='✓ اللون المختار: '+selectedColor;
        cartOptions[p.id]={...(cartOptions[p.id]||{}),color:selectedColor};
        updateBuyState();
      };
    });
  }
  const robloxInput=el('productRobloxUsername');
  if(robloxInput){
    robloxInput.value=selectedRobloxUsername;
    robloxInput.addEventListener('input',()=>{
      selectedRobloxUsername=robloxInput.value.trim();
      cartOptions[p.id]={...(cartOptions[p.id]||{}),roblox_username:selectedRobloxUsername};
      updateBuyState();
    });
  }
  const whatsappInput=el('productWhatsapp');
  if(whatsappInput){
    whatsappInput.value=cartOptions[p.id]?.whatsapp||'';
    whatsappInput.addEventListener('input',()=>{
      const whatsapp=whatsappInput.value.trim();
      cartOptions[p.id]={...(cartOptions[p.id]||{}),whatsapp};
      updateBuyState();
    });
  }
  updateBuyState();
  if(buy)buy.onclick=async()=>{
    if(!available)return alert('❌ هذا المنتج غير متوفر حاليًا. أضف المخزون من البوت ثم حاول الشراء مرة أخرى.');
    if(isDragon&&!selectedColor)return alert('⚠️ اختر اللون أولاً من الخيارات الظاهرة فوق زر الشراء.');
    const whatsapp=requiresWhatsapp?(el('productWhatsapp')?.value.trim()||''):'';
    const robloxUsername=requiresRobloxUsername?(el('productRobloxUsername')?.value.trim()||''):'';
    if(requiresWhatsapp&&!whatsapp)return alert('⚠️ اكتب رقم الواتساب أولاً في الخانة الظاهرة فوق زر الشراء.');
    if(requiresRobloxUsername&&(!/^[A-Za-z0-9]+(_[A-Za-z0-9]+)?$/.test(robloxUsername)||robloxUsername.length<3||robloxUsername.length>20))return alert('⚠️ اكتب يوزر Roblox صحيحًا (3-20 حرفًا/رقمًا، ويمكن استخدام _ مرة واحدة).');
    if(!el('lcTerms').checked)return alert('وافق على الشروط والأحكام أولاً');
    buy.disabled=true;buy.textContent='جارٍ تنفيذ الشراء...';
    try{
      cart[p.id]=Math.min((cart[p.id]||0)+1,Number(p.stock_count||1));
      cartOptions[p.id]={...(cartOptions[p.id]||{}),...(isDragon?{color:selectedColor}:{}),...(requiresWhatsapp?{whatsapp}:{}),...(requiresRobloxUsername?{roblox_username:robloxUsername}:{})};
      await checkout();
    }catch(e){
      console.error('purchase failed:',e);
      alert(humanOrderError(e));
      buy.disabled=false;buy.textContent='اشترِ الآن';
    }
  };
}
function renderCart(){
  const entries=Object.entries(cart).filter(([id,q])=>Number(q)>0&&products.some(p=>p.id===id));
  const badge=el('cartCount');
  const navBadge=el('navCartCount');
  const count=entries.reduce((sum,[id,q])=>sum+Number(q),0);
  if(badge)badge.textContent=count;
  if(navBadge)navBadge.textContent=count;
  const box=el('cartBox');
  if(!box)return;
  if(!entries.length){
    box.innerHTML='<div class="card"><h3>🛒 السلة <span class="pill">0</span></h3><p class="muted">السلة فارغة</p></div>';
    return;
  }
  let total=0;
  const rows=entries.map(([id,q])=>{
    const p=products.find(x=>x.id===id);
    const itemTotal=Number(p.price)*Number(q);
    total+=itemTotal;
    return `<div style="padding:12px 0;border-bottom:1px solid #202b3a"><div style="display:flex;justify-content:space-between;gap:10px"><div><b>${esc(p.name)}</b><div class="muted">${money(p.price)} × ${q}</div></div><b>${money(itemTotal)}</b></div><div style="display:flex;gap:7px;margin-top:9px"><button class="btn" data-minus="${p.id}">−</button><span class="pill">${q}</span><button class="btn" data-plus="${p.id}">+</button><button class="btn" data-remove="${p.id}" style="margin-right:auto">🗑️ إزالة</button></div></div>`;
  }).join('');
  box.innerHTML=`<div class="card"><div class="topbar"><h3>🛒 السلة</h3><span class="pill">${count} منتج</span></div>${rows}<hr style="border-color:#263345"><b>الإجمالي: ${money(total)}</b><button class="btn primary" id="buy" style="width:100%;margin-top:12px">الدفع لهذا الطلب</button></div>`;
  document.querySelectorAll('[data-plus]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.plus,p=products.find(x=>x.id===id);if(!p||p.stock_count<1)return;cart[id]=Math.min((cart[id]||0)+1,p.stock_count);renderCart()});
  document.querySelectorAll('[data-minus]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.minus;if((cart[id]||0)>1)cart[id]--;else delete cart[id];renderCart()});
  document.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{delete cart[btn.dataset.remove];renderCart()});
  el('buy').onclick=checkout;
}async function checkout(){
 const entries=Object.entries(cart).filter(([id,q])=>Number(q)>0&&products.some(p=>p.id===id));
 if(!entries.length)return alert('السلة فارغة');
 const items=entries.map(([product_id,quantity])=>({product_id,quantity:Number(quantity),...(cartOptions[product_id]?.color?{color:cartOptions[product_id].color}:{}),...(cartOptions[product_id]?.whatsapp?{whatsapp:cartOptions[product_id].whatsapp}:{}),...(cartOptions[product_id]?.roblox_username?{roblox_username:cartOptions[product_id].roblox_username}:{})}));
 const total=entries.reduce((sum,[id,q])=>sum+Number(products.find(p=>p.id===id)?.price||0)*Number(q),0);
 let settings={};
 try{const sr=await sb.from('store_settings').select('key,value').in('key',['libyana_number','almadar_number']);settings=Object.fromEntries((sr.data||[]).map(x=>[x.key,String(x.value||'')]));}catch(e){console.warn('Payment settings unavailable',e)}
 const prior=document.getElementById('lcPaymentModal');if(prior)prior.remove();
 const modal=document.createElement('div');modal.id='lcPaymentModal';modal.className='lc-modal show';modal.dir='rtl';
 const defaultName=String(profile?.full_name||session?.user?.user_metadata?.full_name||'').trim();
 const defaultPhone=String(profile?.phone||session?.user?.phone||'').trim();
 modal.innerHTML='<div class="lc-modal-card" style="max-width:520px;max-height:90vh;overflow:auto;position:relative"><button type="button" id="lcPaymentClose" class="lc-modal-close" aria-label="إغلاق">×</button><div style="font-size:28px;margin-bottom:8px">💳</div><h2 style="margin:0 0 6px">الدفع على هذا الطلب</h2><p class="muted" style="margin:0 0 14px">اختر ليبيانا أو المدار، وحوّل قيمة الطلب ثم أدخل بيانات التحويل.</p><div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-radius:12px;background:#17133f;color:#fff;margin-bottom:14px"><span>إجمالي الطلب</span><b style="font-size:20px">'+money(total)+'</b></div><form id="lcPaymentForm"><label class="auth-label" for="lcPayName">الاسم الكامل</label><input class="field" id="lcPayName" maxlength="80" required minlength="2" value="'+esc(defaultName)+'" placeholder="اسمك الكامل"><label class="auth-label" for="lcPayPhone" style="display:block;margin-top:10px">رقم هاتفك للتواصل</label><input class="field" id="lcPayPhone" type="tel" maxlength="24" minlength="8" required value="'+esc(defaultPhone)+'" placeholder="09xxxxxxxx"><label class="auth-label" for="lcPayMethod" style="display:block;margin-top:10px">طريقة الدفع</label><select class="field" id="lcPayMethod" required><option value="libyana">ليبيانا</option><option value="almadar">المدار</option></select><div id="lcPayInstructions" style="padding:12px;margin-top:10px;border:1px solid #8b78f733;border-radius:12px;background:#8b78f70d"></div><label class="auth-label" for="lcSenderPhone" style="display:block;margin-top:10px">رقم الهاتف الذي حوّلت منه</label><input class="field" id="lcSenderPhone" type="tel" maxlength="24" minlength="8" required placeholder="رقم ليبيانا أو المدار الذي أرسلت منه"><label class="auth-label" for="lcPayReference" style="display:block;margin-top:10px">رقم الحوالة / المرجع (اختياري)</label><input class="field" id="lcPayReference" maxlength="80" placeholder="اكتب رقم العملية إن وجد"><p class="muted" style="font-size:12px;margin:10px 0">سيتم تسجيل الطلب للمراجعة بعد إرسال البيانات. لا ترسل كلمة مرور أو رمز تحقق.</p><button class="btn primary" id="lcSubmitPayment" type="submit" style="width:100%;margin-top:8px">إرسال الطلب للمراجعة</button><div id="lcPaymentError" role="status" class="muted" style="margin-top:10px"></div></form></div>';
 document.body.appendChild(modal);
 const method=modal.querySelector('#lcPayMethod'),instructions=modal.querySelector('#lcPayInstructions'),form=modal.querySelector('#lcPaymentForm'),submit=modal.querySelector('#lcSubmitPayment'),err=modal.querySelector('#lcPaymentError');
 const renderInstructions=()=>{const key=method.value==='libyana'?'libyana_number':'almadar_number',label=method.value==='libyana'?'ليبيانا':'المدار',number=settings[key];instructions.innerHTML='<b>حوّل '+money(total)+' عبر '+label+'</b><div style="margin-top:6px">رقم الاستلام: <b dir="ltr" style="font-size:19px">'+(number?esc(number):'يرجى التواصل مع الإدارة لمعرفة رقم الاستلام')+'</b></div><small class="muted" style="display:block;margin-top:6px">تأكد من الرقم والمبلغ قبل تأكيد التحويل.</small>';};
 renderInstructions();method.onchange=renderInstructions;
 const close=()=>modal.remove();modal.querySelector('#lcPaymentClose').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
 form.onsubmit=async e=>{
  e.preventDefault();
  const name=modal.querySelector('#lcPayName').value.trim(),phone=modal.querySelector('#lcPayPhone').value.trim(),sender=modal.querySelector('#lcSenderPhone').value.trim(),reference=modal.querySelector('#lcPayReference').value.trim(),paymentMethod=method.value;
  if(name.length<2){err.textContent='اكتب الاسم الكامل.';return}
  if(phone.replace(/\D/g,'').length<8){err.textContent='اكتب رقم هاتف صحيح للتواصل.';return}
  if(sender.replace(/\D/g,'').length<8){err.textContent='اكتب رقم الهاتف الذي حوّلت منه.';return}
  if(!settings[paymentMethod==='libyana'?'libyana_number':'almadar_number']){err.textContent='رقم الاستلام غير مضبوط حاليًا. تواصل مع الإدارة قبل التحويل.';return}
  submit.disabled=true;submit.textContent='جارٍ تسجيل الطلب...';err.textContent='';
  try{
   const r=await sb.rpc('create_guest_purchase_request',{p_items:items,p_customer_name:name,p_customer_phone:phone,p_payment_method:paymentMethod,p_sender_phone:sender,p_payment_reference:reference||null});
   if(r.error)throw r.error;
   const request=r.data||{},requestId=request.id||'';
   cart={};cartOptions={};
   modal.querySelector('.lc-modal-card').innerHTML='<div style="font-size:40px;margin-bottom:10px">✅</div><h2>تم تسجيل طلبك</h2><p>رقم الطلب: <b dir="ltr">'+esc(String(requestId).slice(-8).toUpperCase())+'</b></p><div style="padding:14px;background:#17133f;color:#fff;border-radius:12px;margin:14px 0"><div>الإجمالي المطلوب</div><b style="font-size:23px">'+money(request.total??total)+'</b></div><p>طريقة الدفع: <b>'+(paymentMethod==='libyana'?'ليبيانا':'المدار')+'</b></p><p>حالة الطلب: <b>بانتظار مراجعة الدفع</b></p><p class="muted">احتفظ برقم الطلب. سيتم التحقق من الحوالة ثم تجهيز المنتج.</p><button type="button" class="btn primary" id="lcPaymentDone" style="width:100%">تم</button>';
   modal.querySelector('#lcPaymentDone').onclick=()=>{close();renderCart();refreshProductStock()};
  }catch(error){
   console.error('direct payment request failed:',error);
   err.textContent=humanOrderError(error);
   submit.disabled=false;submit.textContent='إرسال الطلب للمراجعة';
  }
 };
}
async function renderAccount(){
  const current=profile||{};
  const hasGoogle=Array.isArray(session.user.identities)&&session.user.identities.some(x=>x.provider==='google');
  el('view').innerHTML=`<div class="card"><h2>👤 حسابي</h2><label>الاسم الكامل</label><input id="accountName" class="field" style="margin-top:6px" value="${esc(current.full_name||'')}" placeholder="الاسم الكامل"><label style="display:block;margin-top:10px">رقم الهاتف</label><input id="accountPhone" class="field" style="margin-top:6px" value="${esc(current.phone||session.user.phone||'')}" placeholder="رقم الهاتف"><p class="muted" style="margin-top:10px">البريد: ${esc(session.user.email||'غير مرتبط')}</p><button class="btn primary" id="saveAccount" style="width:100%;margin-top:10px">حفظ البيانات</button><button class="btn" id="linkGoogleAvatar" style="width:100%;margin-top:10px;background:#fff;color:#1f2937;border:1px solid #d1d5db">${hasGoogle?'تم ربط حساب Google ✓':'ربط حساب Google لإظهار صورته'}</button><small id="accountMsg" class="muted" style="display:block;margin-top:8px">${hasGoogle?'صورة Google ستظهر بجانب رصيدك بعد تحديث الصفحة.':'اربط حساب Google مرة واحدة للسماح بعرض صورته مع بقاء تسجيل الدخول بالبريد وكلمة المرور.'}</small></div>`;
  el('saveAccount').onclick=async()=>{const full_name=el('accountName').value.trim(),phone=el('accountPhone').value.trim();if(!full_name)return el('accountMsg').textContent='أدخل الاسم';const r=await sb.from('profiles').update({full_name,phone}).eq('id',session.user.id);if(r.error)return el('accountMsg').textContent=r.error.message;profile={...profile,full_name,phone};el('accountMsg').textContent='تم حفظ البيانات بنجاح.';};
  el('linkGoogleAvatar').onclick=async()=>{const msg=el('accountMsg');msg.textContent='جارٍ فتح Google لربط الصورة...';try{const r=await sb.auth.linkIdentity({provider:'google',options:{redirectTo:location.origin+'/',queryParams:{prompt:'select_account'}}});if(r.error)throw r.error;}catch(e){msg.textContent='تعذر ربط Google: '+(e.message||'تحقق من إعدادات تسجيل الدخول عبر Google في Supabase.');}};
}
async function renderWallet(){
 if(!session?.user){renderLogin('سجّل الدخول أولاً حتى تتمكن من شحن المحفظة.');return}
 const [r,tx,settings,walletRes]=await Promise.all([
  sb.from('wallet_topups').select('id,amount,method,status,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(20),
  sb.from('wallet_transactions').select('id,type,amount,balance_after,note,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(30),
  sb.from('store_settings').select('key,value').in('key',['libyana_number','almadar_number']),
  sb.from('wallets').select('balance').eq('user_id',session.user.id).maybeSingle()
 ]);
 if(!walletRes.error) wallet=walletRes.data||{balance:0};
 const topupTotal=(r.data||[]).filter(x=>x.status==='approved').reduce((s,x)=>s+Number(x.amount||0),0);
 const nums=Object.fromEntries((settings.data||[]).map(x=>[x.key,x.value]));
 const txRows=(tx.data||[]).map(x=>{
   const positive=['topup','refund','adjustment'].includes(x.type);
   const label={topup:'شحن',purchase:'شراء',refund:'استرجاع',adjustment:'تعديل / هدية'}[x.type]||x.type;
   return '<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #202b3a"><div><b>'+label+'</b><div class="muted" style="font-size:12px">'+new Date(x.created_at).toLocaleString('ar-LY')+(x.note?' — '+esc(x.note):'')+'</div></div><div style="text-align:left"><b style="color:'+(positive?'#63d48c':'#ff8b7b')+'">'+(positive?'+':'−')+money(Math.abs(Number(x.amount||0)))+'</b><div class="muted" style="font-size:12px">الرصيد بعد العملية: '+money(x.balance_after)+'</div></div></div>';
 }).join('')||'<span class="muted">لا توجد حركات مالية بعد.</span>';
  el('view').innerHTML=`<div class="wallet-flow">
    <section class="card wallet-balance-card" style="text-align:center;padding:24px">
      <div style="font-size:13px;opacity:.8">رصيد محفظتك الحالي</div>
      <div style="font-size:36px;font-weight:900;margin:8px 0;color:#f5b942" id="walletPageBalance">${money(wallet?.balance??0)}</div>
      <div class="muted">اختار شركة الاتصالات لبدء تعبئة الرصيد</div>
    </section>
    <section class="card" style="margin-top:12px">
      <h2 style="margin-top:0">➕ اختار طريقة الشحن</h2>
      <p class="muted">اضغط على ليبيانا أو المدار، وبعدها اختار قيمة الشحن.</p>
      <div style="display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:16px">
        <button type="button" class="wallet-method-card wallet-provider" data-method="libyana" style="display:flex;align-items:center;gap:16px;text-align:right;width:100%;background:#fff;border:1px solid #e9edf4;border-radius:18px;padding:16px;color:#222;cursor:pointer;font:inherit;box-shadow:0 5px 18px rgba(0,0,0,.08)">
          <span style="flex:1"><b style="display:block;font-size:17px">ليبيانا</b><small style="display:block;color:#64748b;margin-top:5px">اختيار قيمة الشحن ←</small></span>
          <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Libyana_mobile_phone_logo.png" alt="شعار ليبيانا" style="display:block;width:130px;height:58px;object-fit:contain">
        </button>
        <button type="button" class="wallet-method-card wallet-provider" data-method="almadar" style="display:flex;align-items:center;gap:16px;text-align:right;width:100%;background:#fff;border:1px solid #e9edf4;border-radius:18px;padding:16px;color:#222;cursor:pointer;font:inherit;box-shadow:0 5px 18px rgba(0,0,0,.08)">
          <span style="flex:1"><b style="display:block;font-size:17px">المدار الجديد</b><small style="display:block;color:#64748b;margin-top:5px">اختيار قيمة الشحن ←</small></span>
          <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Almadar_Aljadid_Logo.png" alt="شعار المدار الجديد" style="display:block;width:130px;height:58px;object-fit:contain">
        </button>
      </div>
    </section>
    <section class="card" style="margin-top:12px"><h3>طلبات الشحن</h3>${(r.data||[]).map(x=>`<div style="padding:9px 0;border-bottom:1px solid #202b3a">${money(x.amount)} — ${esc(x.method)} — <span class="pill">${esc(x.status)}</span></div>`).join('')||'<span class="muted">لا توجد طلبات</span>'}</section>
    <section class="card" style="margin-top:12px"><h3>📒 سجل الحركات المالية</h3><p class="muted" style="margin-top:0">كل شحن وشراء وهدية يظهر هنا مع الرصيد بعد العملية.</p>${txRows}</section>
  </div>`;
  document.querySelectorAll('.wallet-provider').forEach(card=>{card.onclick=()=>renderWalletTopupPage(card.dataset.method,nums)});
}

async function renderWalletTopupPage(method, nums={}){
  const isLibyana=method==='libyana';
  const provider=isLibyana?'ليبيانا':'المدار الجديد';
  const destination=nums[isLibyana?'libyana_number':'almadar_number']||'غير محدد';
  const logo=isLibyana?'https://commons.wikimedia.org/wiki/Special:FilePath/Libyana_mobile_phone_logo.png':'https://commons.wikimedia.org/wiki/Special:FilePath/Almadar_Aljadid_Logo.png';
  const accent=isLibyana?'#e74d5b':'#7c3aed';
  el('view').innerHTML=`<div class="wallet-topup-step">
    <button class="btn" id="backWalletProviders" style="margin-bottom:12px">→ رجوع لطرق الشحن</button>
    <section class="card" style="text-align:center;padding:20px">
      <img src="${logo}" alt="شعار ${provider}" style="width:190px;height:78px;object-fit:contain;background:#fff;border-radius:14px;padding:8px">
      <h2 style="margin:12px 0 4px">الشحن عبر ${provider}</h2>
      <p class="muted" style="margin:0">اختار قيمة الشحن المناسبة ليك</p>
    </section>
    <section class="card" style="margin-top:12px">
      <label style="font-weight:800;display:block;margin-bottom:12px">قيمة الشحن بالدينار الليبي</label>
      <div id="walletAmountChoices" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px">
        ${[5,10,20,30,50,100].map(n=>`<button type="button" class="wallet-amount-option" data-amount="${n}" style="border:1px solid #39465b;border-radius:13px;padding:14px 6px;background:rgba(255,255,255,.04);color:inherit;font:inherit;font-weight:800;cursor:pointer">${n} د.ل</button>`).join('')}
      </div>
      <label for="walletCustomAmount" style="display:block;margin:16px 0 7px">أو اكتب مبلغًا آخر</label>
      <input id="walletCustomAmount" class="field" type="number" min="1" step="1" inputmode="numeric" placeholder="المبلغ بالدينار">
      <div style="margin-top:16px;padding:15px;border-radius:14px;background:rgba(245,185,66,.09);border:1px solid rgba(245,185,66,.28);display:flex;justify-content:space-between;align-items:center;gap:10px">
        <span class="muted">المبلغ المختار</span><b id="walletChosenAmount" style="font-size:23px;color:#f5b942">— د.ل</b>
      </div>
    </section>
    ${isLibyana ? `<section class="card" style="margin-top:12px">
      <h3 style="margin-top:0">📱 الدفع عبر كود ليبيانا</h3>
      <p class="muted">بعد اختيار المبلغ اضغط اتصال، وستفتح شاشة الاتصال بالكود جاهزًا. راجع الكود وأكّد الاتصال من هاتفك.</p>
      <div style="padding:12px;border-radius:12px;background:rgba(255,255,255,.05);margin-bottom:12px">رقم ليبيانا: <b style="font-size:18px">0925620538</b></div>
      <div style="padding:12px;border-radius:12px;background:rgba(245,185,66,.09);border:1px solid rgba(245,185,66,.28);margin-bottom:12px">كود الدفع: <code id="walletUssdPreview">اختار المبلغ أولاً</code></div>
      <button class="btn primary" id="walletCallTopup" style="width:100%" disabled>📞 اتصال لتأكيد الدفع</button>
      <p class="muted" style="font-size:12px;margin-bottom:0">اضغط «اتصال لتأكيد الدفع» لفتح شاشة الاتصال بالكود، ثم أكّد الاتصال من هاتفك. الاتصال وحده لا يضيف الرصيد تلقائيًا.</p>
    </section>` : `<section class="card" style="margin-top:12px">
      <h3 style="margin-top:0">📱 بيانات التحويل</h3>
      <p class="muted">حوّل قيمة الشحن إلى الرقم الموضح، ثم اكتب رقم الهاتف الذي تم التحويل منه وأرسل الطلب للمراجعة.</p>
      <div style="padding:12px;border-radius:12px;background:rgba(255,255,255,.05);margin-bottom:12px">رقم ${provider}: <b style="font-size:18px">${esc(destination)}</b></div>
      <label for="walletSenderPhone" style="display:block;margin-bottom:7px">رقم الهاتف المحوّل منه</label>
      <input id="walletSenderPhone" class="field" type="tel" inputmode="tel" placeholder="09xxxxxxxx" autocomplete="tel">
      <button class="btn primary" id="walletSubmitTopup" style="width:100%;margin-top:14px" disabled>إرسال طلب الشحن</button>
      <p class="muted" style="font-size:12px;margin-bottom:0">سيتم إضافة الرصيد بعد مراجعة الطلب واعتماده من الإدارة. هذه الخطوة لا تنفّذ دفعًا تلقائيًا.</p>
    </section>`}
  </div>`;
  el('backWalletProviders').onclick=renderWallet;
  let selectedAmount=0;
  const amountButtons=[...document.querySelectorAll('.wallet-amount-option')];
  const custom=el('walletCustomAmount'),submit=el('walletSubmitTopup'),callButton=el('walletCallTopup');
  const ussdCode=()=>selectedAmount>0&&Number.isInteger(selectedAmount)?'*122*0925620538*'+(selectedAmount*1000)+'#':'';
  const refreshAmount=()=>{
    const customValue=Number(custom.value);
    if(custom.value.trim()){
      selectedAmount=customValue;
      amountButtons.forEach(b=>{b.style.background='rgba(255,255,255,.04)';b.style.borderColor='#39465b';b.style.color='inherit'});
    }
    el('walletChosenAmount').textContent=selectedAmount>0?money(selectedAmount):'— د.ل';
    const validAmount=selectedAmount>0&&Number.isFinite(selectedAmount)&&Number.isInteger(selectedAmount);
    if(isLibyana){
      el('walletUssdPreview').textContent=validAmount?ussdCode():'اختار المبلغ أولاً';
      callButton.disabled=!validAmount;
    }else{
      submit.disabled=!(validAmount&&el('walletSenderPhone').value.trim().length>=5);
    }
  };
  if(isLibyana)callButton.onclick=()=>{
    const code=ussdCode();
    if(!code)return alert('اختار مبلغ الشحن أولاً');
    window.location.href='tel:'+code.replace('#','%23');
  };
  amountButtons.forEach(b=>b.onclick=()=>{
    selectedAmount=Number(b.dataset.amount);custom.value='';
    amountButtons.forEach(x=>{const active=x===b;x.style.background=active?accent:'rgba(255,255,255,.04)';x.style.borderColor=active?accent:'#39465b';x.style.color=active?'#fff':'inherit'});
    refreshAmount();
  });
  custom.addEventListener('input',refreshAmount);
  if(!isLibyana){
    el('walletSenderPhone').addEventListener('input',refreshAmount);
    submit.onclick=async()=>{
      if(submit.disabled||submit.dataset.busy==='1')return;
      if(!session?.user){renderLogin('سجّل الدخول أولاً حتى تتمكن من شحن المحفظة.');return}
      submit.dataset.busy='1';submit.disabled=true;const original=submit.textContent;submit.textContent='جارٍ إرسال طلب الشحن...';
      try{
        const x=await sb.from('wallet_topups').insert({user_id:session.user.id,amount:selectedAmount,method:method,sender_phone:el('walletSenderPhone').value.trim(),status:'pending'}).select('id').single();
        if(x.error){console.error('topup insert:',x.error);alert('تعذر تسجيل طلب الشحن: '+(x.error.message||'خطأ غير معروف'));return}
        let notifyFailed=false;
        try{const n=await sb.functions.invoke('discord-notify',{body:{type:'topup',id:x.data.id}});if(n.error)notifyFailed=true}catch(e){notifyFailed=true;console.warn('Discord topup notification failed:',e)}
        alert(notifyFailed?'تم إرسال طلب الشحن، لكن تعذر إرسال إشعار الإدارة.':'تم إرسال طلب الشحن بنجاح. يرجى الانتظار حتى تتم مراجعة الطلب واعتماده.');
        await renderWallet();
      }catch(e){alert('تعذر إرسال طلب الشحن: '+(e.message||'خطأ غير معروف'))}
      finally{if(el('walletSubmitTopup')){submit.dataset.busy='';submit.textContent=original;refreshAmount()}}
    };
  }
}

async function renderOrders(){
  const view=el('view');
  view.innerHTML='<div class="lc-orders-page"><div class="lc-orders-loading"><div>⏳</div><b>جارٍ تحميل طلباتك...</b><span>نسترجع آخر مشترياتك وأكوادك بأمان.</span></div></div>';
  try{
    const r=await sb.from('orders')
      .select('id,total,status,payment_method,customer_name,customer_phone,created_at,updated_at,order_items(id,product_id,quantity,unit_price,color,whatsapp,roblox_username,products(name,category))')
      .eq('user_id',session.user.id)
      .order('created_at',{ascending:false})
      .limit(50);
    if(r.error)throw r.error;
    const orders=r.data||[];
    const codeResults=await Promise.all(orders.map(o=>sb.rpc('get_my_order_codes',{p_order_id:o.id})));
    const codeMap=new Map();
    orders.forEach((o,i)=>codeMap.set(o.id,codeResults[i]?.data||[]));
    window.__LIBYAN_ORDERS=orders;
    window.__LIBYAN_ORDER_CODES=codeMap;

    const counts={all:orders.length,paid:0,processing:0,completed:0,pending:0,cancelled:0,refunded:0};
    orders.forEach(o=>{if(counts[o.status]!==undefined)counts[o.status]++});
    const totalSpent=orders.filter(o=>['paid','processing','completed'].includes(o.status)).reduce((s,o)=>s+Number(o.total||0),0);
    const statusLabel={pending:'قيد الانتظار',paid:'مدفوع',processing:'جارٍ التجهيز',completed:'مكتمل',cancelled:'ملغى',refunded:'مسترجع'};
    const statusClass={pending:'pending',paid:'paid',processing:'processing',completed:'completed',cancelled:'cancelled',refunded:'refunded'};

    const filterButtons=[
      ['all','الكل',counts.all],
      ['paid','مدفوعة',counts.paid],
      ['processing','قيد التجهيز',counts.processing],
      ['completed','مكتملة',counts.completed],
      ['cancelled','ملغاة',counts.cancelled]
    ];
    view.innerHTML=`
      <div class="lc-orders-page">
        <div class="lc-orders-hero">
          <div><span class="lc-orders-kicker">سجل المشتريات</span><h1>📦 طلباتي</h1><p>تابع طلباتك، تفاصيل المنتجات، والأكواد التي اشتريتها.</p></div>
          <div class="lc-orders-total"><span>إجمالي المشتريات</span><b>${money(totalSpent)}</b></div>
        </div>
        <div class="lc-orders-summary">
          <div><b>${counts.all}</b><span>كل الطلبات</span></div>
          <div><b>${counts.completed}</b><span>مكتملة</span></div>
          <div><b>${counts.processing+counts.paid}</b><span>قيد المعالجة</span></div>
        </div>
        <div class="lc-orders-filters" id="orderFilters">
          ${filterButtons.map(([key,label,count])=>`<button class="${key==='all'?'active':''}" data-order-filter="${key}">${label}<span>${count}</span></button>`).join('')}
        </div>
        <div id="ordersList"></div>
      </div>`;

    const renderList=(filter='all')=>{
      const list=orders.filter(o=>filter==='all'||o.status===filter);
      const listEl=el('ordersList');
      if(!list.length){
        listEl.innerHTML=`<div class="lc-orders-empty"><div>🧾</div><h3>لا توجد طلبات هنا</h3><p>عندما تقوم بشراء منتج سيظهر طلبك هنا مع تفاصيله.</p><button class="btn primary" id="goStoreFromOrders">تصفح المنتجات</button></div>`;
        el('goStoreFromOrders')?.addEventListener('click',()=>renderProducts());
        return;
      }
      listEl.innerHTML=list.map(o=>{
        const items=o.order_items||[];
        const codes=codeMap.get(o.id)||[];
        const codeCount=codes.length;
        const itemCount=items.reduce((n,x)=>n+Number(x.quantity||0),0);
        const names=items.map(x=>x.products?.name).filter(Boolean);
        const title=names.length===1?names[0]:(names.length>1?`${names[0]} + ${names.length-1} منتجات أخرى`:'طلب رقمي');
        return `
          <article class="lc-order-card">
            <div class="lc-order-head">
              <div><span class="lc-order-id">طلب #${esc(o.id.slice(0,8).toUpperCase())}</span><div class="lc-order-date">${new Date(o.created_at).toLocaleString('ar-LY')}</div></div>
              <span class="lc-order-status ${statusClass[o.status]||''}">${statusLabel[o.status]||esc(o.status)}</span>
            </div>
            <div class="lc-order-main">
              <div class="lc-order-icon">⚡</div>
              <div class="lc-order-info"><h3>${esc(title)}</h3><p>${itemCount} منتج • ${codeCount} كود • الدفع بالمحفظة</p></div>
              <strong class="lc-order-price">${money(o.total)}</strong>
            </div>
            <div class="lc-order-footer">
              <span>${o.status==='completed'?'✅ تم التسليم':o.status==='cancelled'?'↩️ تم الإلغاء':o.status==='refunded'?'💸 تم الاسترجاع':codeCount?'🔑 الأكواد متاحة':'⏳ بانتظار التسليم'}</span>
              <button class="btn" data-order-details="${o.id}">عرض التفاصيل</button>
            </div>
          </article>`;
      }).join('');
      listEl.querySelectorAll('[data-order-details]').forEach(b=>b.onclick=()=>showOrderDetails(b.dataset.orderDetails));
    };
    renderList();
    document.querySelectorAll('[data-order-filter]').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('[data-order-filter]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');renderList(b.dataset.orderFilter);
    });
  }catch(e){
    console.error('renderOrders failed:',e);
    view.innerHTML=`<div class="lc-orders-empty"><div>⚠️</div><h3>تعذر تحميل الطلبات</h3><p class="muted">${esc(e.message||'حدث خطأ غير متوقع')}</p><button class="btn primary" id="retryOrders">إعادة المحاولة</button></div>`;
    el('retryOrders')?.addEventListener('click',renderOrders);
  }
}
function parseCredential(code){
  const raw=String(code??'').trim();
  if(raw.startsWith('{')&&raw.endsWith('}')){try{const obj=JSON.parse(raw);const login=String(obj.login??obj.email??obj.username??'').trim();const password=String(obj.password??'').trim();const accountNumber=String(obj.account_number??obj.accountNumber??'').trim();const accountCode=String(obj.account_code??obj.accountCode??'').trim();if(login&&password)return {login,loginLabel:obj.login_type==='username'?'username':'email',password,accountNumber,accountCode};}catch(e){}}
  const parts=raw.split(/\s*\\|\s*/).map(x=>x.trim()).filter(Boolean);
  if(parts.length===2){
    const clean=v=>v.replace(/^(email|e-mail|username|user|يوزر|الإيميل|البريد|password|pass|كلمة السر|كلمه السر)\s*[:=]\s*/i,'').trim();
    const leftLabel=/^(email|e-mail|الإيميل|البريد)\s*[:=]/i.test(parts[0])?'email':/^(username|user|يوزر)\s*[:=]/i.test(parts[0])?'username':'';
    const rightLabel=/^(email|e-mail|الإيميل|البريد)\s*[:=]/i.test(parts[1])?'email':/^(username|user|يوزر)\s*[:=]/i.test(parts[1])?'username':'';
    const leftPass=/^(password|pass|كلمة السر|كلمه السر)\s*[:=]/i.test(parts[0]);
    const rightPass=/^(password|pass|كلمة السر|كلمه السر)\s*[:=]/i.test(parts[1]);
    if(leftPass||rightPass||leftLabel||rightLabel){
      return {login:leftPass?clean(parts[1]):clean(parts[0]),loginLabel:leftLabel||rightLabel||'email',password:leftPass?clean(parts[0]):clean(parts[1])};
    }
    return {login:parts[0],loginLabel:'email',password:parts[1]};
  }
  const m=raw.match(/^(?:email|e-mail|الإيميل|البريد|username|user|يوزر)\s*[:=]\s*(.*?)\s*[|,;]\s*(?:password|pass|كلمة السر|كلمه السر)\s*[:=]\s*(.+)$/i);
  if(m){const label=/^(?:username|user|يوزر)/i.test(raw)?'username':'email';return {login:m[1].trim(),loginLabel:label,password:m[2].trim()}}
  return null;
}
function credentialHtml(code){
  const parsed=parseCredential(code);
  if(!parsed)return '<div class="lc-secret-box"><button type="button" class="lc-secret-action" data-copy-code="'+esc(code)+'" aria-label="نسخ">▣</button><button type="button" class="lc-secret-action" data-toggle-code aria-label="إظهار">◉</button><span class="lc-secret-value" data-code-value="'+esc(code)+'">'+('•'.repeat(Math.min(14,Math.max(8,String(code).length))))+'</span></div>';
  const rows=[{label:parsed.loginLabel==='username'?'اليوزر':'الإيميل',value:parsed.login},{label:'كلمة السر',value:parsed.password},{label:'رقم الحساب',value:parsed.accountNumber},{label:'رمز الحساب',value:parsed.accountCode}].filter(row=>row.value);
  return '<div class="lc-credential-grid">'+rows.map((row,i)=>'<div class="lc-credential-row"><span>'+row.label+'</span><div class="lc-credential-value"><button type="button" class="lc-secret-action" data-copy-credential="'+esc(row.value)+'">▣</button><button type="button" class="lc-secret-action" data-toggle-credential>◉</button><code data-credential-value="'+esc(row.value)+'">'+('•'.repeat(Math.min(18,Math.max(8,String(row.value).length))))+'</code></div></div>').join('')+'</div>';
}
function showOrderDetails(orderId){
  const orders=window.__LIBYAN_ORDERS||[];
  const codeMap=window.__LIBYAN_ORDER_CODES||new Map();
  const o=orders.find(x=>x.id===orderId);if(!o)return;
  const statusLabel={pending:'قيد الانتظار',paid:'مدفوع',processing:'جارٍ التجهيز',completed:'مكتمل',cancelled:'ملغى',refunded:'مسترجع'};
  const statusClass={pending:'pending',paid:'paid',processing:'processing',completed:'completed',cancelled:'cancelled',refunded:'refunded'};
  const codes=codeMap.get(o.id)||[];
  const items=o.order_items||[];
  const grouped={};
  codes.forEach(x=>(grouped[x.product_id]??=[]).push(x.code));
  const itemRows=items.map(item=>{
    const name=item.products?.name||'منتج رقمي';
    const productCodes=grouped[item.product_id]||[];
    return `<div class="lc-detail-order-item"><div><b>${esc(name)}</b><span>${Number(item.quantity)} × ${money(item.unit_price)}${item.color?' • اللون: '+esc(item.color):''}${item.roblox_username?' • يوزر Roblox: '+esc(item.roblox_username):''}</span></div><strong>${money(Number(item.unit_price)*Number(item.quantity))}</strong>${productCodes.length?`<div class="lc-detail-order-codes">${productCodes.map(code=>`<div class="lc-order-code"><span>🔑</span><code>${esc(code)}</code><button type="button" data-copy-code="${esc(code)}">نسخ</button></div>`).join('')}`:'<small class="muted">سيظهر الكود هنا عند تسليم الطلب.</small>'}</div>`;
  }).join('');
  const modal=document.createElement('div');
  modal.className='lc-order-modal';
  modal.innerHTML=`<div class="lc-order-modal-backdrop"></div><section class="lc-order-modal-card" role="dialog" aria-modal="true" aria-label="تفاصيل الطلب">
    <button type="button" class="lc-order-modal-close" aria-label="إغلاق">×</button>
    <div class="lc-order-modal-head"><div><span class="lc-order-kicker">تفاصيل الطلب</span><h2>طلب #${esc(o.id.slice(0,8).toUpperCase())}</h2><p>${new Date(o.created_at).toLocaleString('ar-LY')}</p></div><span class="lc-order-status ${statusClass[o.status]||''}">${statusLabel[o.status]||esc(o.status)}</span></div>
    <div class="lc-detail-order-items">${itemRows||'<div class="muted">لا توجد تفاصيل منتجات.</div>'}</div>
    <div class="lc-order-detail-total"><span>الإجمالي</span><strong>${money(o.total)}</strong></div>
    <div class="lc-order-detail-meta"><div><span>طريقة الدفع</span><b>المحفظة</b></div><div><span>عدد المنتجات</span><b>${items.reduce((n,x)=>n+Number(x.quantity||0),0)}</b></div></div>
  </section>`;
  document.body.appendChild(modal);
  const close=()=>{if(modal.isConnected)modal.remove()};
  modal.querySelector('.lc-order-modal-backdrop').onclick=close;
  modal.querySelector('.lc-order-modal-close').onclick=close;
  modal.querySelectorAll('[data-copy-code]').forEach(btn=>btn.onclick=async()=>{try{await navigator.clipboard.writeText(btn.dataset.copyCode);btn.textContent='تم النسخ ✓';setTimeout(()=>{if(btn.isConnected)btn.textContent='نسخ'},1200)}catch(e){alert('تعذر نسخ الكود تلقائيًا')}})
  const onKey=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',onKey)}};
  document.addEventListener('keydown',onKey);
}
async function renderAdmin(){if(profile?.role!=='admin')return;const [pr,top,orders,codes,settings,opts]=await Promise.all([sb.from('products').select('*').order('created_at',{ascending:false}),sb.from('wallet_topups').select('*').order('created_at',{ascending:false}).limit(50),sb.from('orders').select('*').order('created_at',{ascending:false}).limit(50),sb.from('product_codes').select('id,product_id,code,status,order_id').order('created_at',{ascending:false}).limit(200),sb.from('store_settings').select('key,value').in('key',['libyana_number','almadar_number']),sb.from('product_options').select('id,product_id,option_type,option_name,active').eq('option_type','color').order('created_at')]);
 const plist=pr.data||[]; const clist=codes.data||[]; const colorOpts=opts.data||[]; const dragonProduct=plist.find(p=>String(p.name||'').trim()==='دراقون'); const counts={};clist.forEach(c=>counts[c.product_id]=(counts[c.product_id]||0)+1);
 el('view').innerHTML=`<div class="topbar"><h2>⚙️ لوحة الإدارة</h2><span class="pill">مدير</span></div><div class="grid">
 <div class="card"><h3>➕ إضافة منتج</h3><input id="pn" class="field" placeholder="اسم المنتج"><input id="pc" class="field" style="margin-top:8px" placeholder="التصنيف"><input id="pp" class="field" style="margin-top:8px" type="number" min="0" step="0.01" placeholder="السعر بالدينار"><textarea id="pd" class="field" style="margin-top:8px;min-height:80px" placeholder="وصف المنتج"></textarea><button class="btn primary" id="addProduct" style="width:100%;margin-top:10px">إضافة المنتج</button></div>
 <div class="card"><h3>📦 المنتجات</h3>${plist.map(p=>`<div style="padding:10px 0;border-bottom:1px solid #202b3a"><b>${esc(p.name)}</b><div class="muted">${money(p.price)} — ${esc(p.category||'رقمي')} — ${counts[p.id]||0} كود</div><div style="margin-top:7px"><button class="btn" data-edit-product="${p.id}">تعديل</button> <button class="btn" data-toggle-product="${p.id}" data-active="${p.active}">${p.active?'إيقاف':'تفعيل'}</button></div></div>`).join('')||'<span class="muted">لا توجد منتجات</span>'}</div>
  <div class="card"><h3>🎨 ألوان دراقون</h3>${dragonProduct ? colorOpts.filter(o=>o.product_id===dragonProduct.id).map(o=>'<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #202b3a"><b>'+esc(o.option_name)+'</b><button class="btn '+(o.active?'primary':'')+'" data-toggle-dragon-color="'+o.id+'" data-active="'+o.active+'">'+(o.active?'متوفر':'غير متوفر')+'</button></div>').join('') : '<span class="muted">منتج دراقون غير موجود</span>'}<small class="muted" style="display:block;margin-top:8px">اضغط على الزر لتحديد الألوان التي تظهر للزبون ويمكن شراؤها.</small></div>
 <div class="card"><h3>🔑 إضافة مخزون</h3><select id="codeProduct" class="field">${plist.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select><div id="credentialEntry" class="lc-admin-credential" style="display:none"><label class="muted">الإيميل أو اليوزر</label><input id="accountLogin" class="field" autocomplete="off" placeholder="example@gmail.com أو username"><label class="muted">كلمة السر</label><input id="accountPassword" class="field" type="password" autocomplete="new-password" placeholder="كلمة السر"><label class="muted">رقم الحساب</label><input id="accountNumber" class="field" inputmode="numeric" autocomplete="off" placeholder="رقم الحساب (اختياري)"><label class="muted">رمز الحساب</label><input id="accountCode" class="field" autocomplete="off" placeholder="رمز الحساب (اختياري)"><button class="btn primary" id="addAccount" style="width:100%;margin-top:10px">إضافة الحساب للمخزون</button></div><div id="normalCodeEntry"><label class="muted">الأكواد — كود في كل سطر</label><textarea id="codesText" class="field" style="margin-top:8px;min-height:120px" placeholder="اكتب كودًا في كل سطر"></textarea><button class="btn primary" id="addCodes" style="width:100%;margin-top:10px">حفظ الأكواد</button></div><small id="codeMsg" class="muted" style="display:block;margin-top:8px"></small></div>
 <div class="card"><h3>🧾 مخزون الأكواد</h3>${clist.slice(0,100).map(c=>{const p=plist.find(x=>x.id===c.product_id);return `<div style="padding:7px 0;border-bottom:1px solid #202b3a"><div>${credentialHtml(c.code)}</div><span class="muted">${esc(p?.name||'منتج محذوف')} — ${esc(c.status)}</span>${c.status==='available'?` <button class="btn" data-delete-code="${c.id}" style="float:left">حذف</button>`:''}</div>`}).join('')||'<span class="muted">لا توجد أكواد. أضف أكواد من البطاقة السابقة.</span>'}</div>
 <div class="card"><h3>📲 أرقام الشحن</h3><input id="libyanaNum" class="field" value="${esc((settings.data||[]).find(x=>x.key==='libyana_number')?.value||'')}" placeholder="رقم ليبيانا"><input id="almadarNum" class="field" style="margin-top:8px" value="${esc((settings.data||[]).find(x=>x.key==='almadar_number')?.value||'')}" placeholder="رقم المدار"><button class="btn primary" id="saveNumbers" style="width:100%;margin-top:10px">حفظ أرقام الشحن</button></div>
 <div class="card"><h3>💳 طلبات الشحن</h3>${(top.data||[]).map(t=>`<div style="padding:8px 0;border-bottom:1px solid #202b3a">${money(t.amount)} — ${esc(t.method)} — ${esc(t.sender_phone||'')}<br><span class="pill">${esc(t.status)}</span>${t.status==='pending'?`<div style="margin-top:7px"><button class="btn primary" data-approve="${t.id}">اعتماد</button> <button class="btn" data-reject="${t.id}">رفض</button></div>`:''}</div>`).join('')||'<span class="muted">لا توجد طلبات</span>'}</div>
 <div class="card"><h3>🛒 الطلبات</h3>${(orders.data||[]).map(o=>`<div style="padding:8px 0;border-bottom:1px solid #202b3a">${money(o.total)} — <span class="pill">${esc(o.status)}</span><br><span class="muted">${esc(o.customer_name||'')} — ${esc(o.customer_phone||'')}</span></div>`).join('')||'<span class="muted">لا توجد طلبات</span>'}</div></div>`;
 el('addProduct').onclick=addProduct;el('addCodes').onclick=addCodes;el('addAccount').onclick=addAccount;el('codeProduct').onchange=toggleCredentialEntry;toggleCredentialEntry();el('saveNumbers').onclick=saveNumbers;document.querySelectorAll('[data-edit-product]').forEach(b=>b.onclick=()=>editProduct(b.dataset.editProduct,plist));document.querySelectorAll('[data-toggle-product]').forEach(b=>b.onclick=()=>toggleProduct(b.dataset.toggleProduct,b.dataset.active==='true'));document.querySelectorAll('[data-toggle-dragon-color]').forEach(b=>b.onclick=()=>toggleDragonColor(b.dataset.toggleDragonColor,b.dataset.active==='true'));document.querySelectorAll('[data-delete-code]').forEach(b=>b.onclick=()=>deleteCode(b.dataset.deleteCode));document.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>reviewTopup(b.dataset.approve,true));document.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>reviewTopup(b.dataset.reject,false));}
async function addProduct(){const name=el('pn').value.trim(),category=el('pc').value.trim()||'رقمي',price=Number(el('pp').value),description=el('pd').value.trim();if(!name||!(price>=0))return alert('أدخل اسم المنتج والسعر');const r=await sb.from('products').insert({name,category,price,description,active:true}).select().single();if(r.error)return alert(r.error.message);alert('تمت إضافة المنتج');renderAdmin()}
async function editProduct(id,list){const p=list.find(x=>x.id===id);if(!p)return;const name=prompt('اسم المنتج',p.name);if(name===null)return;const priceText=prompt('السعر بالدينار',p.price);if(priceText===null)return;const price=Number(priceText);if(!name.trim()||!(price>=0))return alert('بيانات غير صحيحة');const category=prompt('التصنيف',p.category||'رقمي');if(category===null)return;const description=prompt('الوصف',p.description||'');if(description===null)return;const r=await sb.from('products').update({name:name.trim(),price,category:category.trim()||'رقمي',description:description.trim()}).eq('id',id);if(r.error)return alert(r.error.message);renderAdmin()}
async function toggleProduct(id,active){const r=await sb.from('products').update({active:!active}).eq('id',id);if(r.error)return alert(r.error.message);renderAdmin()}
async function toggleDragonColor(id,active){const r=await sb.from('product_options').update({active:!active,updated_at:new Date().toISOString()}).eq('id',id).eq('option_type','color');if(r.error)return alert(r.error.message);renderAdmin()}
function isCredentialProduct(product){const n=String(product?.name||'').toLowerCase();const c=String(product?.category||'').toLowerCase();return /netflix|نتفلكس|نتفليكس|shahid|شاهد/.test(n+' '+c)}
function toggleCredentialEntry(){const select=el('codeProduct');const label=select?.options?.[select.selectedIndex]?.textContent||'';const credential=isCredentialProduct({name:label,category:''});if(el('credentialEntry'))el('credentialEntry').style.display=credential?'grid':'none';if(el('normalCodeEntry'))el('normalCodeEntry').style.display=credential?'none':'block'}
async function addAccount(){const productId=el('codeProduct').value;const login=el('accountLogin').value.trim();const password=el('accountPassword').value;const accountNumber=el('accountNumber').value.trim();const accountCode=el('accountCode').value.trim();const msg=el('codeMsg');if(!productId||!login||!password)return alert('اختر المنتج واكتب الإيميل/اليوزر وكلمة السر');const select=el('codeProduct');const productLabel=select?.options?.[select.selectedIndex]?.textContent||'';if(!isCredentialProduct({name:productLabel,category:''}))return alert('هذا المنتج لا يستخدم نظام الحسابات');msg.textContent='جارٍ إضافة الحساب...';const code=JSON.stringify({login,password,account_number:accountNumber,account_code:accountCode,login_type:/@/.test(login)?'email':'username'});const r=await sb.rpc('admin_upsert_product_code',{p_product_id:productId,p_code:code});if(r.error){msg.textContent='';return alert(r.error.message)}el('accountLogin').value='';el('accountPassword').value='';el('accountNumber').value='';el('accountCode').value='';msg.textContent='تمت إضافة الحساب للمخزون ✓';renderAdmin()}
async function addCodes(){const productId=el('codeProduct').value;const raw=el('codesText').value;const codes=[...new Set(raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean))];if(!productId||!codes.length)return alert('اختر المنتج وأدخل كودًا واحدًا على الأقل');el('codeMsg').textContent=`جارٍ حفظ ${codes.length} كود...`;let ok=0,fail=0;for(const code of codes){const r=await sb.rpc('admin_upsert_product_code',{p_product_id:productId,p_code:code});if(r.error)fail++;else ok++}el('codeMsg').textContent=`تم حفظ ${ok} كود${fail?`، وتعذر حفظ ${fail}`:''}.`;if(ok)el('codesText').value='';renderAdmin()}
async function deleteCode(id){if(!confirm('حذف هذا الكود من المخزون؟'))return;const r=await sb.rpc('admin_delete_product_code',{p_code_id:id});if(r.error)return alert(r.error.message);renderAdmin()}
async function saveNumbers(){const a=el('libyanaNum').value.trim(),b=el('almadarNum').value.trim();const r1=await sb.rpc('admin_set_setting',{p_key:'libyana_number',p_value:a}),r2=await sb.rpc('admin_set_setting',{p_key:'almadar_number',p_value:b});if(r1.error||r2.error)return alert((r1.error||r2.error).message);alert('تم حفظ أرقام الشحن');renderAdmin()}
async function reviewTopup(id,approve){const note=prompt(approve?'ملاحظة الاعتماد (اختياري)':'سبب الرفض (اختياري)')||'';const r=await sb.rpc('review_wallet_topup',{p_topup_id:id,p_approve:approve,p_note:note});if(r.error)return alert(r.error.message);renderAdmin()}
boot();