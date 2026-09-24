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
  const robuxOldPrices={'دراقون كانلوني':140,'روبلوكس 100':20,'روبلوكس 200':40,'روبلوكس 300':60,'روبلوكس 400':80,'روبلوكس 500':100,'روبلوكس 600':120,'روبلوكس 700':140,'روبلوكس 800':160,'روبلوكس 900':180,'روبلوكس 1000':200};
  window.renderProducts=function(){
    const packageCategory=p=>{const n=String(p.name||'').toLowerCase();if(/3\s*months|3\s*month|3\s*أشهر|ثلاثة\s*أشهر/.test(n))return '3 أشهر';if(/1\s*month|1\s*months|شهر/.test(n))return 'شهر';return 'أخرى';};
    const view=el('view');if(!view)return;
    const brandFromName=p=>{
      const n=String(p.name||'').toLowerCase();
      if(n.includes('netflix')||n.includes('نتف'))return 'Netflix';
      if(n.includes('shahid')||n.includes('شاهد'))return 'Shahid';
      if(n.includes('spotify')||n.includes('سبوت'))return 'Spotify';
      if(n.includes('roblox')||n.includes('روبلوكس'))return 'Roblox';
      return '';
    };
    const groupName=p=>{
      const cat=String(p.category||'').trim();
      const generic=['','رقمي','منتج رقمي','اشتراكات','بطاقات'];
      return cat&&!generic.includes(cat)?cat:(brandFromName(p)||'منتجات أخرى');
    };
    const groups=[...new Set(products.map(groupName))];
    const available=products.filter(p=>Number(p.stock_count||0)>0).length;
    view.innerHTML=
      '<section class="lc-shop-hero">'+
        '<div class="lc-hero-copy"><span class="lc-hero-badge">⚡ متجر رقمي ليبي</span><h1>اشتراكاتك وبطاقاتك<br><strong>بسرعة وأمان</strong></h1><p>اختر خدمتك ثم اختر الباقة المناسبة لك.</p></div>'+
        '<div class="lc-hero-stats"><div><b>'+products.length+'</b><span>منتجات</span></div><div><b>'+available+'</b><span>متوفر الآن</span></div></div>'+
      '</section>'+
      '<section class="lc-shop-tools">'+
        '<div class="lc-search-box"><span>⌕</span><input id="lcProductSearch" class="field" placeholder="ابحث عن Netflix أو Spotify أو شاهد..."></div>'+
        '<div class="lc-categories" id="lcCategories"><button type="button" class="active" data-cat="all">الكل</button>'+groups.map(x=>'<button type="button" data-cat="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div>'+
      '</section>'+
      '<div class="lc-section-title"><div><h2>الخدمات والمنتجات</h2><span class="lc-results-note" id="lcResultsNote">'+groups.length+' خدمات</span></div></div>'+
      '<div id="lcGroupGrid" class="lc-service-groups"></div>'+
      '<div id="lcNoResults" class="lc-empty" style="display:none">لا توجد منتجات تطابق بحثك.</div>'+
      '<div id="cartBox" style="margin-top:15px"></div>';

    const grid=el('lcGroupGrid'),input=el('lcProductSearch'),note=el('lcResultsNote');
    let activeCat='all';
    function draw(){
      const q=String(input?.value||'').trim().toLowerCase();
      const filtered=products.filter(p=>{
        const group=groupName(p);
        const hay=[p.name,p.description,p.category,group].map(v=>String(v||'').toLowerCase()).join(' ');
        return (activeCat==='all'||group===activeCat)&&(!q||hay.includes(q));
      });
      const grouped=groups.map(g=>({name:g,items:filtered.filter(p=>groupName(p)===g)})).filter(g=>g.items.length);
      note.textContent=grouped.length+' خدمات';
      grid.innerHTML=grouped.map(g=>{
        const gStock=g.items.reduce((s,p)=>s+Number(p.stock_count||0),0);
        const slug='service-'+g.name.replace(/[^a-zA-Z0-9\u0600-\u06ff]+/g,'-');
        const cats=['شهر','3 أشهر','أخرى'].filter(c=>g.items.some(p=>packageCategory(p)===c));
        const categorySections=cats.map(cat=>{
          const items=g.items.filter(p=>packageCategory(p)===cat);
          return '<section class="lc-package-panel" data-package-panel="'+esc(cat)+'">'+
            '<div class="lc-package-panel-head"><div><span>فئة الباقة</span><h3>'+esc(cat)+'</h3></div><b>'+items.length+' باقة</b></div>'+
            '<div class="lc-service-products">'+items.map(p=>{
              const img=pImage(p),stock=Number(p.stock_count||0),inStock=stock>0;
              return '<article class="card lc-product" data-package-category="'+esc(cat)+'">'+
                '<button type="button" data-product-open="'+p.id+'" class="lc-product-open">'+
                  '<div class="lc-product-img">'+(img?'<img src="'+img+'" alt="'+esc(p.name)+'" loading="lazy" decoding="async">':'<div class="lc-product-placeholder">⚡</div>')+
                  '<span class="lc-stock '+(inStock?'ok':'out')+'">'+(inStock?'متوفر':'نفد المخزون')+'</span><span class="lc-product-sale-badge">خصم</span></div>'+
                  '<div class="lc-product-body"><span class="pill">'+esc(g.name)+'</span><h3>'+esc(p.name)+'</h3>'+
                  '<div class="lc-product-desc">'+esc(p.description||'اشتراك رقمي يتم تسليمه بعد إتمام الدفع.')+'</div>'+
                  '<div class="lc-product-footer"><div class="lc-product-price-wrap"><span class="lc-product-old-price">'+money(robuxOldPrices[p.name]||0)+'</span><div class="lc-product-price">'+money(p.price)+'</div><small class="lc-product-sale-label">السعر بعد الخصم</small></div><span class="lc-arrow">←</span></div></div>'+
                '</button><div class="lc-product-action"><button class="btn lc-buy" type="button" data-product-buy="'+p.id+'" '+(inStock?'':'disabled')+'>'+(inStock?'اشترِ الآن':'غير متوفر حالياً')+'</button></div>'+
              '</article>';
            }).join('')+'</div></section>';
        }).join('');
        return '<section class="lc-service-group" id="'+esc(slug)+'">'+
          '<div class="lc-service-head"><div><span class="lc-service-kicker">خدمة رقمية</span><h2>'+esc(g.name)+'</h2><p>'+g.items.length+' باقة متاحة'+(gStock?' • '+gStock+' متوفر':'')+'</p></div><span class="lc-service-icon">'+(g.name==='Netflix'?'N':g.name==='Spotify'?'♫':g.name==='Shahid'?'S':g.name==='Roblox'?'R':'⚡')+'</span></div>'+
          '<div class="lc-package-tabs"><div class="lc-package-tabs-title">اختر الفئة</div>'+
            '<div class="lc-package-tab-list"><button type="button" class="lc-package-tab active" data-package-tab="all"><strong>كل الفئات</strong><span>'+g.items.length+' باقة</span></button>'+
            cats.map(cat=>{const count=g.items.filter(p=>packageCategory(p)===cat).length;return '<button type="button" class="lc-package-tab" data-package-tab="'+esc(cat)+'"><strong>'+esc(cat)+'</strong><span>'+count+' باقة</span></button>';}).join('')+
            '</div></div>'+
          '<div class="lc-package-panels">'+categorySections+'</div></section>';
      }).join('');
      el('lcNoResults').style.display=grouped.length?'none':'block';
      grid.querySelectorAll('.lc-package-tab').forEach(btn=>btn.onclick=()=>{
        const section=btn.closest('.lc-service-group');
        section.querySelectorAll('.lc-package-tab').forEach(x=>x.classList.toggle('active',x===btn));
        const cat=btn.dataset.packageTab;
        section.querySelectorAll('.lc-package-panel').forEach(panel=>{
          panel.style.display=(cat==='all'||panel.dataset.packagePanel===cat)?'':'none';
        });
      });
      grid.querySelectorAll('[data-product-open]').forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.productOpen);if(p&&typeof showProduct==='function')showProduct(p);});
      grid.querySelectorAll('[data-product-buy]').forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.productBuy);if(p&&!b.disabled&&typeof showProduct==='function')showProduct(p);});
      renderCart();
    }
    input.oninput=draw;
    document.querySelectorAll('#lcCategories button').forEach(b=>b.onclick=()=>{
      activeCat=b.dataset.cat;
      document.querySelectorAll('#lcCategories button').forEach(x=>x.classList.toggle('active',x===b));
      draw();
    });
    draw();
  };
  window.renderStore=function(){
    app.innerHTML='<div class="shell"><header class="lc-header">'+
      '<button class="lc-icon" id="lcMenu">☰</button><button class="lc-icon" id="lcSearch">⌕</button><button class="lc-icon" id="lcBell" aria-label="الإشعارات">🔔</button>'+
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
    document.getElementById('lcSearch').onclick=()=>{const q=prompt('ابحث عن منتج');if(q){const found=products.find(p=>String(p.name).toLowerCase().includes(q.toLowerCase()));if(found)openProduct(found.id);else alert('لم يتم العثور على المنتج')}};
    document.getElementById('lcBell').onclick=()=>alert('لا توجد إشعارات جديدة حالياً.');
    document.getElementById('lcLogout').onclick=async()=>{if(adminTopupChannel){await sb.removeChannel(adminTopupChannel);adminTopupChannel=null}await sb.auth.signOut();session=null;cart={};renderLogin()};
    document.querySelectorAll('[data-lc-view]').forEach(b=>b.onclick=()=>{nav(b.dataset.lcView);closeDrawer()});
    renderProducts();
  };
  window.__LIBYAN_THEME_READY=true;
  if(typeof session!=='undefined'&&session&&el('view')) renderStore();
})();