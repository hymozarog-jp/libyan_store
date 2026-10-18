/* Direct package payment: bypass the old wallet checkout and use Libyana/Almadar. */
(function(){
  function hideWalletUi(){
    document.querySelectorAll('[data-view="wallet"], .lc-wallet, .lc-profile-balance, #walletPageBalance').forEach(function(node){
      node.style.display='none';
    });
  }

  function useDirectCheckout(){
    if(typeof window.renderGuestPaymentCheckout==='function'){
      window.checkout=window.renderGuestPaymentCheckout;
    }
    hideWalletUi();
  }

  useDirectCheckout();
  const observer=new MutationObserver(function(){
    useDirectCheckout();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  // Cart pages may have captured the old checkout function before this file loaded.
  document.addEventListener('click',function(event){
    const button=event.target.closest && event.target.closest('#buy');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(typeof window.renderGuestPaymentCheckout==='function')window.renderGuestPaymentCheckout();
  },true);
})();
