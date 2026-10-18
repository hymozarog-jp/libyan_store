/* Wallet UI fixes: one wallet view + quick top-up button beside the balance. */
(function(){
  let walletRenderPromise=null;
  let installed=false;

  function install(){
    const balance=document.querySelector('.rb-balance');
    if(!balance || installed) return;
    installed=true;

    let button=document.getElementById('rbWalletTopup');
    if(!button){
      button=document.createElement('button');
      button.id='rbWalletTopup';
      button.type='button';
      button.setAttribute('aria-label','تعبئة المحفظة');
      button.title='تعبئة المحفظة';
      button.innerHTML='<span aria-hidden="true">＋</span><span>تعبئة المحفظة</span>';
      button.style.cssText='display:inline-flex;align-items:center;justify-content:center;gap:7px;margin-top:10px;padding:9px 14px;border:0;border-radius:999px;background:#f5b942;color:#17133f;font:inherit;font-weight:900;cursor:pointer;box-shadow:0 6px 18px rgba(245,185,66,.22)';
      balance.appendChild(button);
    }
    button.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      openWallet();
    };
  }

  async function openWallet(){
    if(typeof window.renderWallet!=='function') return;
    const store=document.getElementById('rbStoreContent');
    const view=document.getElementById('view');
    if(store)store.style.display='none';
    if(view)view.style.display='block';
    await renderWalletOnce();
  }

  function renderWalletOnce(){
    if(walletRenderPromise) return walletRenderPromise;
    walletRenderPromise=Promise.resolve().then(()=>window.renderWallet()).finally(()=>{
      walletRenderPromise=null;
      ensureSingleWalletView();
    });
    return walletRenderPromise;
  }

  function ensureSingleWalletView(){
    const view=document.getElementById('view');
    if(!view) return;
    const wallets=view.querySelectorAll('.wallet-flow');
    if(wallets.length>1){
      for(let i=1;i<wallets.length;i++) wallets[i].remove();
    }
  }

  function patchRenderWallet(){
    if(typeof window.renderWallet!=='function' || window.__walletRenderPatched) return;
    const original=window.renderWallet;
    window.renderWallet=function(){
      if(walletRenderPromise) return walletRenderPromise;
      walletRenderPromise=Promise.resolve().then(()=>original()).finally(()=>{
        walletRenderPromise=null;
        ensureSingleWalletView();
      });
      return walletRenderPromise;
    };
    window.__walletRenderPatched=true;
  }

  const observer=new MutationObserver(function(){
    patchRenderWallet();
    install();
    ensureSingleWalletView();
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});

  const timer=setInterval(function(){
    patchRenderWallet();
    install();
    if(document.querySelector('.rb-balance') && window.__walletRenderPatched) clearInterval(timer);
  },250);
})();
