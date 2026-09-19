(function(){
  function pImage(p){
    if(typeof productImage==='function') return productImage(p.name);
    const n=String(p.name||'').toLowerCase();
    if(n.includes('netflix')||n.includes('نتف')) return 'assets/netflix.svg';
    if(n.includes('shahid')||n.includes('شاهد')) return 'assets/shahid.svg';
    if(n.includes('spotify')||n.includes('سبوت')) return 'assets/spotify.svg';
    return '';
  }
  function closeDrawer(){const d=document.getElementById('lcDrawer');if(d)d.classList.remove('open')}
  function nav(view){
    document.querySelectorAll('[data-lc-view]').forEach(x=>x.classList.toggle('active',x.dataset.lcView===view));
    const fn={store:renderProducts,cart:renderCartPage,wallet:renderWallet,orders:renderOrders,account:renderAccount,admin:renderAdmin}[view];
    if(fn)fn();
  }
  function openProduct(id){
    const p=products.find(x=>x.id===id);if(!p)return;
    const img=pImage(p);
    const modal=document.createElement('div');
    modal.className='lc-modal show';modal.dir='rtl';
    modal.innerHTML='<div class="lc-modal-card"><div class="lc-modal-img">'+
      (img?'<img src="'+img+'" alt="'+esc(p.name)+'" loading="lazy" decoding="async">':'<div class="lc-product-placeholder">⚡</div>')+
      '</div><div class="lc-modal-body"><div class="muted">'+esc(p.category||'منتج رقمي')+'</div>'+
      '<h2 style="margin:5px 0">'+esc(p.name)+'</h2><p class="muted">'+esc(p.description||'بطاقة رقمية يتم تسليمها مباشرة بعد إتمام الشراء.')+'</p>'+
      '<div style="font-size:27px;font-weight:1000;color:var(--lc-orange);margin-top:8px">'+money(p.price)+'</div>'+
      '<label class="lc-check"><input type="checkbox" id="lcTerms"><span>أوافق على الشروط والأحكام</span></label>'+
      '<div class="lc-modal-actions"><button class="btn" id="lcClose">إغلاق</button><button class="btn primary" id="lcBuyNow">اشترِ الآن</button></div></div></div>';
    document.body.appendChild(modal);
    modal.onclick=e=>{if(e.target===modal)modal.remove()};
    modal.querySelector('#lcClose').onclick=()=>modal.remove();
    modal.querySelector('#lcBuyNow').onclick=async()=>{
      if(!modal.querySelector('#lcTerms').checked){alert('وافق على الشروط والأحكام أولاً');return}
      cart[p.id]=Math.min((cart[p.id]||0)+1,p.stock_count||1);
      modal.remove();await checkout();
    };
  }
  window.renderProducts=function(){
    const view=el('view');if(!view)return;
    view.innerHTML='<div class="lc-section-title"><h2>المنتجات</h2><span class="pill">'+products.length+' منتج</span></div>'+
      (products.length?'<div class="lc-products">'+products.map(p=>{
        const img=pImage(p);
        return '<article class="card lc-product"><button type="button" data-product-open="'+p.id+'" style="display:block;width:100%;padding:0;border:0;background:none;color:inherit;text-align:inherit">'+
          '<div class="lc-product-img">'+(img?'<img src="'+img+'" alt="'+esc(p.name)+'">':'<div class="lc-product-placeholder">⚡</div>')+'</div>'+
          '<div class="lc-product-body"><span class="pill">'+esc(p.category||'رقمي')+'</span><h3>'+esc(p.name)+'</h3>'+
          '<div class="lc-product-desc">'+esc(p.description||'')+'</div><div class="lc-product-price">'+money(p.price)+'</div></div></button>'+
          '<div style="padding:0 15px 15px"><button class="btn lc-buy" type="button" data-product-buy="'+p.id+'">اشترِ الآن</button></div></article>';
      }).join('')+'</div>':'<div class="lc-empty">لا توجد منتجات متاحة حالياً.</div>')+
      '<div id="cartBox" style="margin-top:15px"></div>';
    document.querySelectorAll('[data-product-open]').forEach(b=>b.onclick=()=>openProduct(b.dataset.productOpen));
    document.querySelectorAll('[data-product-buy]').forEach(b=>b.onclick=()=>openProduct(b.dataset.productBuy));
    renderCart();
  };
  window.renderStore=function(){
    app.innerHTML='<div class="shell"><header class="lc-header">'+
      '<button class="lc-icon" id="lcMenu">☰</button><button class="lc-icon" id="lcSearch">⌕</button><button class="lc-icon" id="lcBell">♟</button>'+
      '<div class="lc-wallet">💳 <b>'+money(wallet?.balance)+'</b><span class="wallet-text">المحفظة</span></div>'+
      '<div class="lc-logo"><span>Libyan Store</span><span class="lc-logo-mark">LS</span></div></header>'+
      '<section class="lc-hero"><h1>بطاقات واشتراكات رقمية</h1><p>اشترِ بطاقاتك المفضلة واستلم الأكواد مباشرة بعد الدفع.</p></section>'+
      '<div id="view"></div><nav class="lc-bottom">'+
      '<button data-lc-view="store" class="active">⌂<br>الرئيسية</button>'+
      '<button data-lc-view="cart">▣<span class="lc-badge" id="navCartCount">0</span><br>المشتريات</button>'+
      '<button data-lc-view="orders">▤<br>طلباتي</button><button data-lc-view="wallet">▱<br>المحفظة</button>'+
      '<button data-lc-view="account">⚙<br>الإعدادات</button></nav>'+
      '<div class="lc-drawer" id="lcDrawer"><div class="lc-drawer-backdrop" id="lcBackdrop"></div><aside class="lc-drawer-panel">'+
      '<button class="lc-icon" id="lcDrawerClose">×</button><div class="lc-drawer-title">القائمة الرئيسية</div>'+
      '<div class="lc-profile"><div class="lc-profile-avatar">●</div><div style="font-size:21px;font-weight:900">'+esc(profile?.full_name||session.user.email||'العميل')+'</div>'+
      '<div class="muted">'+esc(session.user.email||'')+'</div><div class="lc-profile-balance">'+money(wallet?.balance)+'</div></div>'+
      '<button class="lc-drawer-btn" data-lc-view="store">⌂ &nbsp; الرئيسية</button><button class="lc-drawer-btn" data-lc-view="orders">▤ &nbsp; طلباتي</button>'+
      '<button class="lc-drawer-btn" data-lc-view="wallet">▱ &nbsp; شحن المحفظة</button><button class="lc-drawer-btn" data-lc-view="account">● &nbsp; المعلومات الشخصية</button>'+
      (profile?.role==='admin'?'<button class="lc-drawer-btn" data-lc-view="admin">⚙ &nbsp; الإدارة</button>':'')+
      '<button class="lc-drawer-btn" id="lcLogout" style="color:#ff776f;margin-top:18px">⇥ &nbsp; تسجيل الخروج</button></aside></div></div>';
    document.getElementById('lcMenu').onclick=()=>document.getElementById('lcDrawer').classList.add('open');
    document.getElementById('lcBackdrop').onclick=closeDrawer;document.getElementById('lcDrawerClose').onclick=closeDrawer;
    document.getElementById('lcSearch').onclick=()=>{const q=prompt('ابحث عن منتج');if(q){const found=products.find(p=>String(p.name).toLowerCase().includes(q.toLowerCase()));if(found)openProduct(found.id);else alert('لم يتم العثور على المنتج')}}};
    document.getElementById('lcBell').onclick=()=>alert('لا توجد إشعارات جديدة حالياً.');
    document.getElementById('lcLogout').onclick=async()=>{if(adminTopupChannel){await sb.removeChannel(adminTopupChannel);adminTopupChannel=null}await sb.auth.signOut();session=null;cart={};renderLogin()};
    document.querySelectorAll('[data-lc-view]').forEach(b=>b.onclick=()=>{nav(b.dataset.lcView);closeDrawer()});
    renderProducts();
  };
  window.__LIBYAN_THEME_READY=true;
  if(typeof session!=='undefined'&&session&&el('view')) renderStore();
})();