(function(){
  const robuxOnly = p => /roblox|robux|روبلوكس|روبوكس/i.test([p.name,p.category].join(' '));
  const imageFor = p => typeof productImage==='function' ? productImage(p.name) : '';
  window.renderStore = function(){
    app.innerHTML = '<div class="rb-shell" dir="rtl"><header class="rb-header"><div class="rb-brand"><span class="rb-logo">R</span><div><b>Robux ليبيا</b><small>متجر شحن روبلوكس</small></div></div><button class="rb-menu" id="rbMenu">☰</button></header><section class="rb-balance"><span>رصيدي</span><strong id="rbBalanceAmount">0.0000</strong><small>د.ل</small></section><div id="rbStoreContent"><section class="rb-hero"><div class="rb-hero-tag">⚡ شحن سريع وبسيط</div><h1>عالمك في روبلوكس،<br><em>أقرب مما تتخيل</em></h1><p>اختار باقة Robux المناسبة ليك، وشوف السعر والتوفر قبل ما تطلب.</p><div class="rb-hero-stat"><span>باقات رقمية</span><b>Robux فقط</b></div><div class="rb-orb rb-orb-one"></div><div class="rb-orb rb-orb-two"></div></section><section class="rb-toolbar"><label class="rb-search">⌕ <input id="rbSearch" placeholder="دور على باقة Robux..." /></label><span id="rbCount" class="rb-count"></span></section><section id="rbProducts" class="rb-products"></section><div id="rbEmpty" class="rb-empty" hidden>ما فيش باقات Robux متوفرة حالياً.</div></div><div id="view" class="rb-detail-view" style="display:none"></div><nav class="rb-nav"><button data-rb-view="store" class="active">⌂<small>الرئيسية</small></button><button data-rb-view="orders">▤<small>طلباتي</small></button><button data-rb-view="wallet">◈<small>رصيدي</small></button><button data-rb-view="account">◉<small>حسابي</small></button></nav></div>';
    const balanceAmount=document.getElementById('rbBalanceAmount');
    const paintBalance=value=>{const formatted=Number(value).toFixed(4);const node=document.getElementById('rbBalanceAmount');if(node)node.textContent=formatted;};
    if(balanceAmount) balanceAmount.textContent=(typeof wallet!=='undefined' && wallet && wallet.balance!=null && Number.isFinite(Number(wallet.balance))) ? Number(wallet.balance).toFixed(4) : '—';
    // Fetch the signed-in customer's balance directly; do not rely on a stale global value.
    (async()=>{try{
      if(typeof sb==='undefined'||!sb||typeof session==='undefined'||!session?.user?.id)return;
      const result=await sb.from('wallets').select('balance').eq('user_id',session.user.id).maybeSingle();
      if(result.error){console.warn('Customer wallet refresh failed:',result.error);return;}
      wallet=result.data||{balance:0};
      const value=Number(wallet.balance);
      if(Number.isFinite(value))paintBalance(value);else{const node=document.getElementById('rbBalanceAmount');if(node)node.textContent='—';}
    }catch(error){console.warn('Customer wallet refresh failed:',error)}})();
    const menu=document.getElementById('rbMenu');
    menu.onclick=()=>{const choices=[['الرئيسية','store'],['طلباتي','orders'],['رصيدي','wallet'],['حسابي','account']];const answer=prompt('اكتب رقم الصفحة:\n1 الرئيسية\n2 طلباتي\n3 رصيدي\n4 حسابي');const v=choices[Number(answer)-1]?.[1];if(v==='store')renderStore();else if(v)({orders:renderOrders,wallet:renderWallet,account:renderAccount}[v])?.();};
    document.querySelectorAll('[data-rb-view]').forEach(b=>b.onclick=()=>{const v=b.dataset.rbView;if(v==='store'){renderStore();return;}const store=document.getElementById('rbStoreContent'),view=document.getElementById('view');if(store)store.style.display='none';if(view)view.style.display='block';({wallet:renderWallet,cart:renderCartPage,orders:renderOrders,account:renderAccount}[v])?.();});
    window.renderProducts();
  };
  window.renderProducts=function(){
    const grid=document.getElementById('rbProducts');if(!grid)return;
    const input=document.getElementById('rbSearch');
    const draw=()=>{
      const list=(products||[]).filter(robuxOnly).filter(p=>String(p.name+' '+(p.description||'')).toLowerCase().includes(String(input.value||'').toLowerCase()));
      document.getElementById('rbCount').textContent=list.length+' باقة';
      document.getElementById('rbEmpty').hidden=list.length>0;
      grid.innerHTML=list.map(p=>{
        const available=Number(p.stock_count||0)>0;
        const img=imageFor(p);
        return '<article class="rb-product"><div class="rb-product-art">'+(img?'<img src="'+esc(img)+'" alt="" loading="lazy">':'<span>R$</span>')+'<b class="'+(available?'rb-in':'rb-out')+'">'+(available?'متوفر':'نفد المخزون')+'</b></div><div class="rb-product-info"><span class="rb-label">ROBUX PACKAGE</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.description||'باقة Robux لروبلوكس')+'</p><div class="rb-price">'+money(p.price)+'</div><button class="rb-buy" data-rb-buy="'+esc(p.id)+'" '+(available?'':'disabled')+'>'+(available?'اختار الباقة':'غير متوفر')+' <span>←</span></button></div></article>';
      }).join('');
      grid.querySelectorAll('[data-rb-buy]').forEach(b=>b.onclick=()=>{const p=products.find(x=>String(x.id)===b.dataset.rbBuy);if(!p)return;const store=document.getElementById('rbStoreContent'),detail=document.getElementById('view');if(!detail)return;if(store)store.style.display='none';detail.style.display='block';if(typeof showProduct==='function'){showProduct(p);const back=document.getElementById('lcBackToProducts');if(back)back.onclick=()=>{detail.style.display='none';if(store)store.style.display='block';window.renderProducts();};}else{if(store)store.style.display='block';detail.style.display='none';alert('تعذر فتح تفاصيل الباقة. حدّث الصفحة وحاول مرة أخرى.');}});

    };
    input.oninput=draw;draw();
  };
  if(typeof products!=='undefined'&&products.length)window.renderStore();
})();
(function(){const originalCheckout=window.checkout;if(typeof originalCheckout==='function'){window.checkout=async function(){await originalCheckout();const amount=document.getElementById('rbBalanceAmount');if(amount)amount.textContent=Number(wallet?.balance||0).toFixed(4);};}})();
