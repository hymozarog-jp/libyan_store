let sb,session,products=[],cart={},profile,wallet,adminTopupChannel,stockRefreshTimer;
const app=document.getElementById('app');
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const money=v=>`${Number(v||0).toFixed(2)} د.ل`;
const el=id=>document.getElementById(id);
let authBusy=false;
async function boot(){
 try{
  sb=await loadSupabase();
  if(window.__LIBYAN_RECOVERY_ACTIVE)return;
  const oauthParams=new URLSearchParams(location.search);
  const oauthMessage=oauthParams.get('error_description')||oauthParams.get('error');
  if(oauthMessage){
   history.replaceState({},document.title,location.pathname+location.hash);
   renderLogin('تعذر تسجيل الدخول باستخدام Google: '+decodeURIComponent(oauthMessage.replace(/\+/g,' ')));
   return;
  }
  sb.auth.onAuthStateChange((event,nextSession)=>{
   if(event==='SIGNED_IN'||event==='INITIAL_SESSION'){
    session=nextSession||null;
    if(session&&document.getElementById('login')) loadStore();
   }else if(event==='SIGNED_OUT'){
    session=null;cart={};
    if(adminTopupChannel){sb.removeChannel(adminTopupChannel);adminTopupChannel=null}
    renderLogin();
   }
  });
  const r=await sb.auth.getSession();
  if(r.error)throw r.error;
  session=r.data.session||null;
  if(session) await loadStore();
  else renderLogin();
 }catch(e){app.innerHTML='<div class="card" style="text-align:center;margin-top:30px"><h1>⚡ Libyan Store</h1><p class="muted">'+esc(e.message||'تعذر تشغيل تسجيل الدخول')+'</p><button class="btn primary" onclick="location.reload()">إعادة المحاولة</button></div>'}
}
function renderLogin(msg='',signupMode=false){app.innerHTML=`<div style="max-width:430px;margin:35px auto;text-align:center"><div style="font-size:48px">⚡</div><h1>Libyan Store</h1><p class="muted">اشتراكات رقمية ومحفظة وتسليم أكواد</p><div class="card" style="display:grid;gap:10px;text-align:right"><button class="btn" id="googleLogin" style="width:100%;font-weight:800">🔵 المتابعة باستخدام Google</button><div style="display:flex;align-items:center;gap:8px;margin:4px 0;color:#8f9baa"><span style="height:1px;background:#263345;flex:1"></span><small>أو بالبريد الإلكتروني</small><span style="height:1px;background:#263345;flex:1"></span></div><div id="signupFields" style="display:${signupMode?'grid':'none'};gap:10px"><input id="fullName" class="field" autocomplete="name" placeholder="الاسم الكامل"><input id="phone" class="field" type="tel" inputmode="tel" autocomplete="tel" placeholder="رقم الهاتف"></div><input id="email" class="field" type="email" autocomplete="email" placeholder="البريد الإلكتروني"><input id="pass" class="field" type="password" autocomplete="${signupMode?'new-password':'current-password'}" placeholder="كلمة المرور"><button class="btn primary" id="login">${signupMode?'تسجيل الدخول':'دخول'}</button><button class="btn" id="signup">${signupMode?'إنشاء الحساب':'إنشاء حساب جديد'}</button><small id="msg" class="muted">${esc(msg)}</small></div></div>`;el('login').onclick=()=>signupMode?renderLogin('',false):auth(false);el('signup').onclick=()=>signupMode?auth(true):renderLogin('',true);el('googleLogin').onclick=()=>socialLogin('google')}
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
 const email=emailInput(),password=el('pass').value.trim();
 if(!email)return msg.textContent='اكتب البريد الإلكتروني أولاً';
 if(password.length<6)return msg.textContent='كلمة المرور يجب أن تكون 6 أحرف على الأقل';
 let fullName='',phone='';
 if(signup){fullName=el('fullName')?.value.trim()||'';phone=el('phone')?.value.trim()||'';if(fullName.length<2)return msg.textContent='اكتب الاسم الكامل';if(!phone)return msg.textContent='اكتب رقم الهاتف';}
 authBusy=true;msg.textContent=signup?'جارٍ إنشاء الحساب...':'جارٍ تسجيل الدخول...';if(button)button.disabled=true;
 try{
  const r=signup?await sb.auth.signUp({email,password,options:{data:{full_name:fullName,phone}}}):await sb.auth.signInWithPassword({email,password});
  if(r.error){msg.textContent=humanAuthError(r.error);return;}
  if(signup&&!r.data.session){msg.textContent='تم إنشاء الحساب. افتح بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول.';return;}
  session=r.data.session;if(!session){msg.textContent='تعذر إنشاء جلسة تسجيل الدخول. حاول مرة أخرى.';return;}
  if(!signup)notifyLoginToDiscord();
  await loadStore();
 }catch(e){msg.textContent=humanAuthError(e)}finally{authBusy=false;if(button)button.disabled=false}
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
 if(/insufficient_balance/i.test(m))return '❌ رصيد المحفظة غير كافٍ لإتمام الشراء.';
 if(/product_not_found|product_unavailable/i.test(m))return '❌ المنتج غير متوفر حاليًا. تأكد من وجود مخزون لهذا المنتج ثم حاول الشراء مرة أخرى.';
 if(/not_authenticated|auth/i.test(m))return '❌ يجب تسجيل الدخول أولًا.';
 return m;
}
function emailInput(){return el('email').value.trim()}
let storeLoading=null;
async function loadStore(){
 if(storeLoading)return storeLoading;
 storeLoading=(async()=>{
  const uid=session?.user?.id;
  if(!uid)throw new Error('جلسة تسجيل الدخول غير موجودة');
  app.innerHTML='<div class="card" style="max-width:430px;margin:35px auto;text-align:center"><div style="font-size:42px">⏳</div><h2>تم تسجيل الدخول</h2><p class="muted">جارٍ فتح المتجر...</p></div>';
  const withTimeout=(promise,label,ms=12000)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('انتهت مهلة تحميل '+label+'، تحقق من اتصال الإنترنت ثم أعد المحاولة.')),ms))]);
  try{
   const pr=await withTimeout(
    sb.from('products').select('id,name,description,category,price,currency').eq('active',true).order('created_at'),
    'المنتجات'
   );
   if(pr.error)throw pr.error;

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

   products=(pr.data||[]).map(p=>({...p,stock_count:stockMap.get(String(p.id))||0}));
   renderStore();
   startStockRefresh();
   startAdminTopupRealtime();
  }catch(e){
   console.error('loadStore failed:',e);
   app.innerHTML='<div class="card" style="max-width:430px;margin:35px auto;text-align:center"><div style="font-size:42px">⚠️</div><h2>تم تسجيل الدخول بنجاح</h2><p class="muted">لكن تعذر فتح المنتجات.</p><small class="muted">'+esc(e.message||'خطأ غير معروف')+'</small><button class="btn primary" style="width:100%;margin-top:14px" onclick="location.reload()">إعادة المحاولة</button></div>';
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
      const nextStock=stockMap.get(String(p.id))||0;
      if(Number(p.stock_count||0)!==nextStock)changed=true;
      return {...p,stock_count:nextStock};
    });
    if(changed&&el('view')&&document.querySelector('.lc-products'))renderProducts();
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
function renderStore(){
  app.innerHTML=`<div class="shell lc-shell">
    <header class="lc-header">
      <button class="lc-icon" id="lcMenu" aria-label="القائمة">☰</button>
      <button class="lc-icon" id="lcSearch" aria-label="بحث">⌕</button>
      <button class="lc-icon" id="lcBell" aria-label="الإشعارات">♟</button>
      <div class="lc-wallet">💳 <b>${money(wallet?.balance)}</b><span class="wallet-text">المحفظة</span></div>
      <div class="lc-logo"><span>Libyan Store</span><span class="lc-logo-mark">LS</span></div>
    </header>
    <section class="lc-hero"><h1>بطاقات واشتراكات رقمية</h1><p>اشترِ بطاقاتك المفضلة واستلم الأكواد مباشرة بعد الدفع.</p></section>
    <div id="view"></div>
    <nav class="lc-bottom">
      <button class="active" data-view="store">⌂<br>الرئيسية</button>
      <button data-view="cart">▣<span class="lc-badge" id="navCartCount">0</span><br>المشتريات</button>
      <button data-view="orders">▤<br>طلباتي</button>
      <button data-view="wallet">▱<br>المحفظة</button>
      <button data-view="account">⚙<br>الإعدادات</button>
    </nav>
    <div class="lc-drawer" id="lcDrawer"><div class="lc-drawer-backdrop" id="lcBackdrop"></div><aside class="lc-drawer-panel">
      <button class="lc-icon" id="lcDrawerClose">×</button><div class="lc-drawer-title">القائمة الرئيسية</div>
      <div class="lc-profile"><div class="lc-profile-avatar">●</div><div style="font-size:21px;font-weight:900">${esc(profile?.full_name||session.user.email||'العميل')}</div><div class="muted">${esc(session.user.email||'')}</div><div class="lc-profile-balance">${money(wallet?.balance)}</div></div>
      <button class="lc-drawer-btn" data-view="store">⌂ &nbsp; الرئيسية</button>
      <button class="lc-drawer-btn" data-view="orders">▤ &nbsp; طلباتي</button>
      <button class="lc-drawer-btn" data-view="wallet">▱ &nbsp; إضافة الأموال</button>
      <button class="lc-drawer-btn" data-view="account">● &nbsp; المعلومات الشخصية</button>
      ${profile?.role==='admin'?'<button class="lc-drawer-btn" data-view="admin">⚙ &nbsp; الإدارة</button>':''}
      <button class="lc-drawer-btn" id="lcLogout" style="color:#ff776f;margin-top:18px">⇥ &nbsp; تسجيل الخروج</button>
    </aside></div>
  </div>`;
  const close=()=>el('lcDrawer')?.classList.remove('open');
  el('lcMenu').onclick=()=>el('lcDrawer').classList.add('open');el('lcBackdrop').onclick=close;el('lcDrawerClose').onclick=close;
  el('lcSearch').onclick=()=>{const q=prompt('ابحث عن منتج');if(!q)return;const found=products.find(p=>String(p.name||'').toLowerCase().includes(q.toLowerCase()));if(found)showProduct(found);else alert('لم يتم العثور على المنتج')};
  el('lcBell').onclick=()=>alert('لا توجد إشعارات جديدة حالياً.');
  el('lcLogout').onclick=async()=>{if(adminTopupChannel){await sb.removeChannel(adminTopupChannel);adminTopupChannel=null}await sb.auth.signOut();session=null;cart={};renderLogin()};
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-view]').forEach(x=>x.classList.remove('active'));b.classList.add('active');({store:renderProducts,cart:renderCartPage,wallet:renderWallet,orders:renderOrders,account:renderAccount,admin:renderAdmin}[b.dataset.view])();close()});
  renderProducts();
}
function renderCartPage(){
  const entries=Object.entries(cart).filter(([id,q])=>Number(q)>0&&products.some(p=>p.id===id));
  let total=0;
  const rows=entries.map(([id,q])=>{const p=products.find(x=>x.id===id);const t=Number(p.price)*Number(q);total+=t;return `<div style="padding:12px 0;border-bottom:1px solid #202b3a"><div style="display:flex;justify-content:space-between"><div><b>${esc(p.name)}</b><div class="muted">${money(p.price)} × ${q}</div></div><b>${money(t)}</b></div><div style="display:flex;gap:7px;margin-top:8px"><button class="btn" data-minus="${p.id}">−</button><span class="pill">${q}</span><button class="btn" data-plus="${p.id}">+</button><button class="btn" data-remove="${p.id}" style="margin-right:auto">🗑️ إزالة</button></div></div>`}).join('');
  el('view').innerHTML=entries.length?`<h2>🛒 السلة</h2><div class="card">${rows}<hr style="border-color:#263345"><b>الإجمالي: ${money(total)}</b><button class="btn primary" id="pageBuy" style="width:100%;margin-top:12px">شراء من المحفظة</button></div>`:'<div class="card" style="text-align:center"><h2>🛒 السلة فارغة</h2><p class="muted">أضف منتجًا من المتجر ليظهر هنا.</p></div>';
  document.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{const id=b.dataset.plus;cart[id]=(cart[id]||0)+1;renderCartPage()});
  document.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const id=b.dataset.minus;if((cart[id]||0)>1)cart[id]--;else delete cart[id];renderCartPage()});
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{delete cart[b.dataset.remove];renderCartPage()});
  if(el('pageBuy'))el('pageBuy').onclick=checkout;
}
function renderProducts(){
  const view=el('view');if(!view)return;
  const imageFor=p=>typeof productImage==='function'?productImage(p.name):'';
  const groups=[...new Set(products.map(p=>String(p.category||'رقمي').trim()||'رقمي'))];
  const cards=groups.map(category=>{
    const sample=products.find(p=>String(p.category||'رقمي').trim()===category);
    const img=imageFor(sample);
    const count=products.filter(p=>String(p.category||'رقمي').trim()===category).length;
    return '<button type="button" class="card lc-category-card" data-category-open="'+esc(category)+'">'+
      '<div class="lc-category-image">'+(img?'<img src="'+img+'" alt="'+esc(category)+'">':'<div class="lc-product-placeholder">⚡</div>')+'</div>'+
      '<div class="lc-category-body"><h3>'+esc(category)+'</h3><span class="pill">'+count+' '+(count===1?'منتج':'منتجات')+'</span><span class="lc-category-arrow">←</span></div>'+
    '</button>';
  }).join('');
  view.innerHTML='<div class="lc-section-title"><h2>الفئات</h2><span class="pill">'+groups.length+' فئات</span></div>'+
    (cards?'<div class="lc-products lc-categories">'+cards+'</div>':'<div class="lc-empty">لا توجد منتجات متاحة حالياً.</div>')+
    '<div id="cartBox" style="margin-top:15px"></div>';
  document.querySelectorAll('[data-category-open]').forEach(b=>b.onclick=()=>renderCategory(b.dataset.categoryOpen));
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
  view.innerHTML='<div class="lc-section-title"><button type="button" class="lc-back-btn" id="lcBackCategories">→ الفئات الرئيسية</button><h2>فئات '+esc(category)+'</h2><span class="pill">'+list.length+' فئات</span></div>'+
    (cards?'<div class="lc-products lc-categories">'+cards+'</div>':'<div class="lc-empty">لا توجد فئات في هذه المجموعة.</div>')+'<div id="cartBox" style="margin-top:15px"></div>';
  el('lcBackCategories').onclick=renderProducts;
  document.querySelectorAll('[data-product-open]').forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.productOpen);if(p)showProduct(p)});
  renderCart();
}

function showProduct(p){
  const view=el('view');if(!view)return;
  const img=typeof productImage==='function'?productImage(p.name):'';
  const available=Number(p.stock_count||0)>0;
  view.innerHTML=`<section class="lc-product-page">
    <button type="button" class="lc-back-btn" id="lcBackToProducts">← العودة للمنتجات</button>
    <article class="lc-detail-card">
      <div class="lc-detail-image">${img?'<img src="'+img+'" alt="'+esc(p.name)+'">':'<div class="lc-product-placeholder">⚡</div>'}</div>
      <div class="lc-detail-content">
        <h1>${esc(p.name)}</h1>
        <div class="lc-detail-price">${money(p.price)} <span>⌄</span></div>
        <label class="lc-detail-terms">
          <input type="checkbox" id="lcTerms">
          <span>أوافق على <b>الشروط والأحكام</b></span>
        </label>
        <div class="lc-detail-divider"></div>
        <div class="lc-detail-total"><span>الإجمالي:</span><strong>${money(p.price)}</strong></div>
        <button class="btn primary lc-detail-buy" id="lcBuyNow" type="button">${available?'اشترِ الآن':'نفد المخزون'}</button>
      </div>
    </article>
  </section>`;
  el('lcBackToProducts').onclick=()=>renderProducts();
  const buy=el('lcBuyNow');
  if(buy)buy.onclick=async()=>{
    if(!available)return alert('❌ هذا المنتج غير متوفر حاليًا. أضف المخزون من البوت ثم حاول الشراء مرة أخرى.');
    if(!el('lcTerms').checked)return alert('وافق على الشروط والأحكام أولاً');
    buy.disabled=true;buy.textContent='جارٍ تنفيذ الشراء...';
    try{
      cart[p.id]=Math.min((cart[p.id]||0)+1,Number(p.stock_count||1));
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
  box.innerHTML=`<div class="card"><div class="topbar"><h3>🛒 السلة</h3><span class="pill">${count} منتج</span></div>${rows}<hr style="border-color:#263345"><b>الإجمالي: ${money(total)}</b><button class="btn primary" id="buy" style="width:100%;margin-top:12px">شراء من المحفظة</button></div>`;
  document.querySelectorAll('[data-plus]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.plus,p=products.find(x=>x.id===id);if(!p||p.stock_count<1)return;cart[id]=Math.min((cart[id]||0)+1,p.stock_count);renderCart()});
  document.querySelectorAll('[data-minus]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.minus;if((cart[id]||0)>1)cart[id]--;else delete cart[id];renderCart()});
  document.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{delete cart[btn.dataset.remove];renderCart()});
  el('buy').onclick=checkout;
}async function checkout(){
 const name=(profile?.full_name||session.user.email||'عميل').trim();
 const phone=(profile?.phone||session.user.phone||'').trim();
 const items=Object.entries(cart).filter(([id,q])=>Number(q)>0).map(([product_id,quantity])=>({product_id,quantity:Number(quantity)}));
 if(!items.length)return alert('السلة فارغة');
 const total=items.reduce((sum,item)=>{const id=Array.isArray(item)?item[0]:item?.product_id;const q=Array.isArray(item)?item[1]:item?.quantity;const p=products.find(x=>x.id===id);return sum+(Number(p?.price||0)*Number(q||0))},0);
 const buyButtons=[...document.querySelectorAll('.lc-detail-buy,[id="pageBuy"],.lc-buy')];
 buyButtons.forEach(b=>{b.disabled=true;b.dataset.originalText=b.textContent;b.textContent='جارٍ تنفيذ الشراء...'});
 const processing=document.createElement('div');
 processing.id='lcPurchaseProcessing';processing.className='lc-modal show';processing.dir='rtl';
 processing.innerHTML='<div class="lc-modal-card lc-purchase-processing"><div class="lc-purchase-spinner">⏳</div><h2>جارٍ إتمام عملية الشراء</h2><p>نخصم المبلغ من المحفظة ونجهز الأكواد لك...</p></div>';
 document.body.appendChild(processing);
 try{
   const r=await sb.rpc('create_wallet_order',{p_items:items,p_customer_name:name,p_customer_phone:phone});
   if(r.error)throw r.error;
   const orderId=r.data;
   cart={};
   let codes=[];
   let codeError=null;
   for(let attempt=0;attempt<3;attempt++){
     const cr=await sb.rpc('get_my_order_codes',{p_order_id:orderId});
     if(!cr.error){codes=cr.data||[];if(codes.length)break}else codeError=cr.error;
     await new Promise(resolve=>setTimeout(resolve,350));
   }
   if(codeError&&codes.length===0)console.warn('order codes load:',codeError);
   const [orderRes,walletRes]=await Promise.all([
     sb.from('orders').select('id,total,status,created_at').eq('id',orderId).maybeSingle(),
     sb.from('wallets').select('balance').eq('user_id',session.user.id).maybeSingle()
   ]);
   if(walletRes.data)wallet=walletRes.data;
   const order=orderRes.data||{id:orderId,total:total,status:'paid',created_at:new Date().toISOString()};
   const grouped={};
   codes.forEach(x=>(grouped[x.product_id]??=[]).push(x.code));
   const isRobloxOrder=items.length>0&&items.every(item=>{
     const productId=Array.isArray(item)?item[0]:item?.product_id;

     const p=products.find(x=>x.id===productId);
     return /روبلوكس|roblox|robux/i.test(String(p?.category||'')+' '+String(p?.name||''));
   });
   const productsHtml=isRobloxOrder ? '' : Object.entries(grouped).map(([productId,productCodes])=>{
     const p=products.find(x=>x.id===productId);
     const img=typeof productImage==='function'?productImage(p?.name):'';
     return '<section class="lc-purchase-product">'+
       '<div class="lc-purchase-cover">'+(img?'<img src="'+img+'" alt="'+esc(p?.name||'المنتج')+'">':'<div class="lc-product-placeholder">⚡</div>')+'</div>'+
       '<div class="lc-purchase-product-title"><h2>'+esc(p?.name||'المنتج')+'</h2><span>'+productCodes.length+' كود</span></div>'+
       productCodes.map((code,index)=>'<div class="lc-secret-row">'+
         '<div class="lc-secret-label"><span>الكود '+(index+1)+'</span><span>🔐 تسليم رقمي</span></div>'+
         '<div class="lc-secret-box"><button type="button" class="lc-secret-action" data-copy-code="'+esc(code)+'" aria-label="نسخ الكود">▣</button><button type="button" class="lc-secret-action" data-toggle-code aria-label="إظهار الكود">◉</button><span class="lc-secret-value" data-code-value="'+esc(code)+'">'+('•'.repeat(Math.min(14,Math.max(8,code.length))))+'</span></div>'+
       '</div>').join('')+
     '</section>';
   }).join('');
   const noCodes=!codes.length;
   processing.remove();
   const modal=document.createElement('div');
   modal.id='lcPurchaseModal';modal.className='lc-modal show';modal.dir='rtl';
   modal.innerHTML='<div class="lc-modal-card lc-purchase-modal">'+
     '<button class="lc-modal-close" id="lcPurchaseClose" aria-label="إغلاق">×</button>'+
     '<div class="lc-purchase-success"><span class="lc-purchase-ok">✓</span><div><b>تمت عملية الشراء بنجاح</b><span>تم خصم '+money(order.total)+' من محفظتك</span></div></div>'+
     (isRobloxOrder ? '<section class="lc-purchase-no-codes" style="text-align:center"><div style="font-size:28px">📱</div><b>رقم التواصل لاستلام الروبلوكس</b><p style="font-size:24px;font-weight:900;direction:ltr;margin:10px 0">0910005566</p><p>تواصل معنا على هذا الرقم بعد إتمام الشراء.</p></section>' : '')+
     '<div class="lc-purchase-summary"><div><span>رقم الطلب</span><b>#'+String(order.id).slice(-8).toUpperCase()+'</b></div><div><span>الأكواد</span><b>'+codes.length+' كود</b></div><div><span>الرصيد المتبقي</span><b>'+money(wallet?.balance)+'</b></div></div>'+
     (productsHtml||'<section class="lc-purchase-no-codes"><div>✅</div><b>تم الدفع بنجاح</b><p>تم إنشاء الطلب، لكن الأكواد لم تظهر الآن. ستجدها محفوظة داخل «طلباتي» ويمكنك فتح الطلب لاحقًا.</p></section>')+
     (noCodes?'':'<div class="lc-purchase-tip">💡 اضغط على زر النسخ بجانب أي كود لنسخه مباشرة.</div>')+
     '<div class="lc-purchase-actions"><button class="btn" id="lcPurchaseOrders">طلباتي</button><button class="btn primary" id="lcPurchaseClose2">إغلاق</button></div>'+
   '</div>';
   document.body.appendChild(modal);
   const isRobloxPurchase=items.length>0&&items.every(item=>{
     const productId=Array.isArray(item)?item[0]:item?.product_id;

     const p=products.find(x=>x.id===productId);
     const text=String(p?.category||'')+' '+String(p?.name||'');
     return /روبلوكس|roblox|robux/i.test(text);
   });
   if(isRobloxPurchase){
     const purchasedNames=items.map(item=>{const productId=Array.isArray(item)?item[0]:item?.product_id;const quantity=Array.isArray(item)?item[1]:item?.quantity;
       const p=products.find(x=>x.id===productId);
       return (p?.name||'روبلوكس')+' × '+quantity;
     }).join('، ');
     const waText='السلام عليكم، تم شراء طلب روبلوكس من Libyan Store. رقم الطلب #'+String(order.id).slice(-8).toUpperCase()+' — '+purchasedNames+' — الإجمالي '+money(order.total)+' د.ل. أريد إكمال استلام الطلب.';
     const waUrl='https://wa.me/218910005566?text='+encodeURIComponent(waText);
     const waButton=document.createElement('a');
     waButton.href=waUrl;
     waButton.target='_blank';
     waButton.rel='noopener noreferrer';
     waButton.className='btn primary';
     waButton.style.cssText='width:100%;margin-top:10px;text-decoration:none;text-align:center';
     waButton.textContent='💬 التواصل عبر واتساب لاستلام الروبلوكس';
     const actions=modal.querySelector('.lc-purchase-actions');
     if(actions)actions.before(waButton);
     setTimeout(()=>{try{window.open(waUrl,'_blank','noopener,noreferrer')}catch(e){}},150);
   }
   const close=()=>{if(modal.isConnected)modal.remove();refreshProductStock();renderCart()};
   const closeBtn=el('lcPurchaseClose'),closeBtn2=el('lcPurchaseClose2');
   [closeBtn,closeBtn2].forEach(btn=>{if(btn){btn.type='button';btn.onclick=e=>{e.preventDefault();e.stopPropagation();close()}}});
   modal.addEventListener('click',e=>{if(e.target===modal)close()});
   const escPurchase=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',escPurchase)}};document.addEventListener('keydown',escPurchase);
   modal.querySelectorAll('[data-toggle-code]').forEach(btn=>btn.onclick=()=>{
     const value=btn.parentElement.querySelector('.lc-secret-value');const shown=value.dataset.shown==='1';
     value.textContent=shown?'•'.repeat(Math.min(14,Math.max(8,value.dataset.codeValue.length))):value.dataset.codeValue;
     value.dataset.shown=shown?'0':'1';btn.textContent=shown?'◉':'◌';
   });
   modal.querySelectorAll('[data-copy-code]').forEach(btn=>btn.onclick=async()=>{
     const code=btn.dataset.copyCode;
     try{await navigator.clipboard.writeText(code)}catch(e){const ta=document.createElement('textarea');ta.value=code;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
     btn.textContent='✓ تم النسخ';setTimeout(()=>{if(btn.isConnected)btn.textContent='▣'},1200);
   });
   el('lcPurchaseOrders').onclick=()=>{close();document.querySelectorAll('[data-view]').forEach(x=>x.classList.remove('active'));const btn=document.querySelector('[data-view="orders"]');if(btn)btn.classList.add('active');renderOrders()};
 }catch(e){
   processing.remove();
   buyButtons.forEach(b=>{b.disabled=false;if(b.dataset.originalText)b.textContent=b.dataset.originalText});
   alert(humanOrderError(e));
 }
}
async function renderAccount(){
  const current=profile||{};
  el('view').innerHTML=`<div class="card"><h2>👤 حسابي</h2><label>الاسم الكامل</label><input id="accountName" class="field" style="margin-top:6px" value="${esc(current.full_name||'')}" placeholder="الاسم الكامل"><label style="display:block;margin-top:10px">رقم الهاتف</label><input id="accountPhone" class="field" style="margin-top:6px" value="${esc(current.phone||session.user.phone||'')}" placeholder="رقم الهاتف"><p class="muted" style="margin-top:10px">البريد: ${esc(session.user.email||'غير مرتبط')}</p><button class="btn primary" id="saveAccount" style="width:100%;margin-top:10px">حفظ البيانات</button><small id="accountMsg" class="muted" style="display:block;margin-top:8px"></small></div>`;
  el('saveAccount').onclick=async()=>{const full_name=el('accountName').value.trim(),phone=el('accountPhone').value.trim();if(!full_name)return el('accountMsg').textContent='أدخل الاسم';const r=await sb.from('profiles').update({full_name,phone}).eq('id',session.user.id);if(r.error)return el('accountMsg').textContent=r.error.message;profile={...profile,full_name,phone};el('accountMsg').textContent='تم حفظ البيانات بنجاح.';};
}
async function renderWallet(){const r=await sb.from('wallet_topups').select('id,amount,method,status,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(20);const settings=await sb.from('store_settings').select('key,value').in('key',['libyana_number','almadar_number']);const nums=Object.fromEntries((settings.data||[]).map(x=>[x.key,x.value]));el('view').innerHTML=`<div class="card"><h2>💰 شحن المحفظة</h2><p class="muted">اشحن <b>500 د.ل</b> لتحصل على <b>30 د.ل هدية</b> 🎁</p><div style="display:flex;justify-content:center;margin:14px 0"><div style="position:relative;width:170px;height:170px"><svg width="170" height="170" viewBox="0 0 170 170" style="transform:rotate(-90deg)"><circle cx="85" cy="85" r="72" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="12"/><circle id="topupProgress" cx="85" cy="85" r="72" fill="none" stroke="#f39a22" stroke-width="12" stroke-linecap="round" stroke-dasharray="452.39" stroke-dashoffset="452.39"/></svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><b id="topupCircleAmount" style="font-size:28px">0</b><span style="font-size:13px;color:#aeb7c5">من 500 د.ل</span></div></div></div><p id="topupBonusHint" style="text-align:center;margin:0 0 12px;color:#f7c77d">اشحن 500 د.ل واحصل على 30 د.ل هدية 🎁</p><p>ليبيانا: <b>${esc(nums.libyana_number||'غير محدد')}</b><br>المدار: <b>${esc(nums.almadar_number||'غير محدد')}</b></p><select id="tm" class="field"><option value="libyana">ليبيانا</option><option value="almadar">المدار</option></select><input id="ta" class="field" style="margin-top:8px" type="number" min="1" placeholder="المبلغ بالدينار"><input id="tp" class="field" style="margin-top:8px" placeholder="رقم الهاتف المحوّل منه"><button class="btn primary" id="sendTop" style="width:100%;margin-top:10px">إرسال طلب الشحن</button></div><div class="card" style="margin-top:12px"><h3>طلبات الشحن</h3>${(r.data||[]).map(x=>`<div style="padding:9px 0;border-bottom:1px solid #202b3a">${money(x.amount)} — ${esc(x.method)} — <span class="pill">${esc(x.status)}</span></div>`).join('')||'<span class="muted">لا توجد طلبات</span>'}</div>`;const updateCircle=()=>{const amount=Math.max(0,Number(el('ta').value)||0),progress=Math.min(amount,500)/500,ring=2*Math.PI*72;el('topupProgress').style.strokeDashoffset=String(ring*(1-progress));el('topupCircleAmount').textContent=amount.toLocaleString('ar-LY');el('topupBonusHint').textContent=amount>=500?'🎁 مبروك! ستحصل على 30 د.ل هدية عند اعتماد الشحن.':'اشحن '+Math.max(0,500-amount).toLocaleString('ar-LY')+' د.ل إضافية للوصول إلى 500 د.ل والحصول على 30 د.ل هدية 🎁'};el('ta').addEventListener('input',updateCircle);updateCircle();el('sendTop').onclick=async()=>{const amount=Number(el('ta').value);if(!(amount>0)||!el('tp').value.trim())return alert('أكمل البيانات');const x=await sb.rpc('create_wallet_topup',{p_amount:amount,p_method:el('tm').value,p_sender_phone:el('tp').value.trim()});if(x.error)return alert(x.error.message);let notifyFailed=false;try{const n=await sb.functions.invoke('discord-notify',{body:{type:'topup',id:x.data.id}});if(n.error){notifyFailed=true;console.warn('Discord topup notification error:',n.error)}else console.log('Discord topup notification sent:',n.data)}catch(e){notifyFailed=true;console.warn('Discord topup notification failed:',e)}if(notifyFailed)alert('تم إرسال طلب الشحن، لكن تعذر إرسال إشعار الإدارة.');else alert('تم إرسال طلب الشحن');renderWallet()}}
async function renderOrders(){
  const view=el('view');
  view.innerHTML='<div class="lc-orders-page"><div class="lc-orders-loading"><div>⏳</div><b>جارٍ تحميل طلباتك...</b><span>نسترجع آخر مشترياتك وأكوادك بأمان.</span></div></div>';
  try{
    const r=await sb.from('orders')
      .select('id,total,status,payment_method,customer_name,customer_phone,created_at,updated_at,order_items(id,product_id,quantity,unit_price,products(name,category))')
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
    return `<div class="lc-detail-order-item"><div><b>${esc(name)}</b><span>${Number(item.quantity)} × ${money(item.unit_price)}</span></div><strong>${money(Number(item.unit_price)*Number(item.quantity))}</strong>${productCodes.length?`<div class="lc-detail-order-codes">${productCodes.map(code=>`<div class="lc-order-code"><span>🔑</span><code>${esc(code)}</code><button type="button" data-copy-code="${esc(code)}">نسخ</button></div>`).join('')}`:'<small class="muted">سيظهر الكود هنا عند تسليم الطلب.</small>'}</div>`;
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
async function renderAdmin(){if(profile?.role!=='admin')return;const [pr,top,orders,codes,settings]=await Promise.all([sb.from('products').select('*').order('created_at',{ascending:false}),sb.from('wallet_topups').select('*').order('created_at',{ascending:false}).limit(50),sb.from('orders').select('*').order('created_at',{ascending:false}).limit(50),sb.from('product_codes').select('id,product_id,code,status,order_id').order('created_at',{ascending:false}).limit(200),sb.from('store_settings').select('key,value').in('key',['libyana_number','almadar_number'])]);
 const plist=pr.data||[]; const clist=codes.data||[]; const counts={};clist.forEach(c=>counts[c.product_id]=(counts[c.product_id]||0)+1);
 el('view').innerHTML=`<div class="topbar"><h2>⚙️ لوحة الإدارة</h2><span class="pill">مدير</span></div><div class="grid">
 <div class="card"><h3>➕ إضافة منتج</h3><input id="pn" class="field" placeholder="اسم المنتج"><input id="pc" class="field" style="margin-top:8px" placeholder="التصنيف"><input id="pp" class="field" style="margin-top:8px" type="number" min="0" step="0.01" placeholder="السعر بالدينار"><textarea id="pd" class="field" style="margin-top:8px;min-height:80px" placeholder="وصف المنتج"></textarea><button class="btn primary" id="addProduct" style="width:100%;margin-top:10px">إضافة المنتج</button></div>
 <div class="card"><h3>📦 المنتجات</h3>${plist.map(p=>`<div style="padding:10px 0;border-bottom:1px solid #202b3a"><b>${esc(p.name)}</b><div class="muted">${money(p.price)} — ${esc(p.category||'رقمي')} — ${counts[p.id]||0} كود</div><div style="margin-top:7px"><button class="btn" data-edit-product="${p.id}">تعديل</button> <button class="btn" data-toggle-product="${p.id}" data-active="${p.active}">${p.active?'إيقاف':'تفعيل'}</button></div></div>`).join('')||'<span class="muted">لا توجد منتجات</span>'}</div>
 <div class="card"><h3>🔑 إضافة أكواد</h3><select id="codeProduct" class="field">${plist.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select><textarea id="codesText" class="field" style="margin-top:8px;min-height:150px" placeholder="ضع كل كود في سطر مستقل"></textarea><button class="btn primary" id="addCodes" style="width:100%;margin-top:10px">حفظ الأكواد</button><small id="codeMsg" class="muted" style="display:block;margin-top:8px"></small></div>
 <div class="card"><h3>🧾 مخزون الأكواد</h3>${clist.slice(0,100).map(c=>{const p=plist.find(x=>x.id===c.product_id);return `<div style="padding:7px 0;border-bottom:1px solid #202b3a"><div style="font-family:monospace">${esc(c.code)}</div><span class="muted">${esc(p?.name||'منتج محذوف')} — ${esc(c.status)}</span>${c.status==='available'?` <button class="btn" data-delete-code="${c.id}" style="float:left">حذف</button>`:''}</div>`}).join('')||'<span class="muted">لا توجد أكواد. أضف أكواد من البطاقة السابقة.</span>'}</div>
 <div class="card"><h3>📲 أرقام الشحن</h3><input id="libyanaNum" class="field" value="${esc((settings.data||[]).find(x=>x.key==='libyana_number')?.value||'')}" placeholder="رقم ليبيانا"><input id="almadarNum" class="field" style="margin-top:8px" value="${esc((settings.data||[]).find(x=>x.key==='almadar_number')?.value||'')}" placeholder="رقم المدار"><button class="btn primary" id="saveNumbers" style="width:100%;margin-top:10px">حفظ أرقام الشحن</button></div>
 <div class="card"><h3>💳 طلبات الشحن</h3>${(top.data||[]).map(t=>`<div style="padding:8px 0;border-bottom:1px solid #202b3a">${money(t.amount)} — ${esc(t.method)} — ${esc(t.sender_phone||'')}<br><span class="pill">${esc(t.status)}</span>${t.status==='pending'?`<div style="margin-top:7px"><button class="btn primary" data-approve="${t.id}">اعتماد</button> <button class="btn" data-reject="${t.id}">رفض</button></div>`:''}</div>`).join('')||'<span class="muted">لا توجد طلبات</span>'}</div>
 <div class="card"><h3>🛒 الطلبات</h3>${(orders.data||[]).map(o=>`<div style="padding:8px 0;border-bottom:1px solid #202b3a">${money(o.total)} — <span class="pill">${esc(o.status)}</span><br><span class="muted">${esc(o.customer_name||'')} — ${esc(o.customer_phone||'')}</span></div>`).join('')||'<span class="muted">لا توجد طلبات</span>'}</div></div>`;
 el('addProduct').onclick=addProduct;el('addCodes').onclick=addCodes;el('saveNumbers').onclick=saveNumbers;document.querySelectorAll('[data-edit-product]').forEach(b=>b.onclick=()=>editProduct(b.dataset.editProduct,plist));document.querySelectorAll('[data-toggle-product]').forEach(b=>b.onclick=()=>toggleProduct(b.dataset.toggleProduct,b.dataset.active==='true'));document.querySelectorAll('[data-delete-code]').forEach(b=>b.onclick=()=>deleteCode(b.dataset.deleteCode));document.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>reviewTopup(b.dataset.approve,true));document.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>reviewTopup(b.dataset.reject,false));}
async function addProduct(){const name=el('pn').value.trim(),category=el('pc').value.trim()||'رقمي',price=Number(el('pp').value),description=el('pd').value.trim();if(!name||!(price>=0))return alert('أدخل اسم المنتج والسعر');const r=await sb.from('products').insert({name,category,price,description,active:true}).select().single();if(r.error)return alert(r.error.message);alert('تمت إضافة المنتج');renderAdmin()}
async function editProduct(id,list){const p=list.find(x=>x.id===id);if(!p)return;const name=prompt('اسم المنتج',p.name);if(name===null)return;const priceText=prompt('السعر بالدينار',p.price);if(priceText===null)return;const price=Number(priceText);if(!name.trim()||!(price>=0))return alert('بيانات غير صحيحة');const category=prompt('التصنيف',p.category||'رقمي');if(category===null)return;const description=prompt('الوصف',p.description||'');if(description===null)return;const r=await sb.from('products').update({name:name.trim(),price,category:category.trim()||'رقمي',description:description.trim()}).eq('id',id);if(r.error)return alert(r.error.message);renderAdmin()}
async function toggleProduct(id,active){const r=await sb.from('products').update({active:!active}).eq('id',id);if(r.error)return alert(r.error.message);renderAdmin()}
async function addCodes(){const productId=el('codeProduct').value;const raw=el('codesText').value;const codes=[...new Set(raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean))];if(!productId||!codes.length)return alert('اختر المنتج وأدخل كودًا واحدًا على الأقل');el('codeMsg').textContent=`جارٍ حفظ ${codes.length} كود...`;let ok=0,fail=0;for(const code of codes){const r=await sb.rpc('admin_upsert_product_code',{p_product_id:productId,p_code:code});if(r.error)fail++;else ok++}el('codeMsg').textContent=`تم حفظ ${ok} كود${fail?`، وتعذر حفظ ${fail}`:''}.`;if(ok)el('codesText').value='';renderAdmin()}
async function deleteCode(id){if(!confirm('حذف هذا الكود من المخزون؟'))return;const r=await sb.rpc('admin_delete_product_code',{p_code_id:id});if(r.error)return alert(r.error.message);renderAdmin()}
async function saveNumbers(){const a=el('libyanaNum').value.trim(),b=el('almadarNum').value.trim();const r1=await sb.rpc('admin_set_setting',{p_key:'libyana_number',p_value:a}),r2=await sb.rpc('admin_set_setting',{p_key:'almadar_number',p_value:b});if(r1.error||r2.error)return alert((r1.error||r2.error).message);alert('تم حفظ أرقام الشحن');renderAdmin()}
async function reviewTopup(id,approve){const note=prompt(approve?'ملاحظة الاعتماد (اختياري)':'سبب الرفض (اختياري)')||'';const r=await sb.rpc('review_wallet_topup',{p_topup_id:id,p_approve:approve,p_note:note});if(r.error)return alert(r.error.message);renderAdmin()}
boot();