(function(){
  function restore(){
    document.querySelectorAll('.lc-map-banner-wrap,.lc-map-banner').forEach(function(el){el.remove();});
  }
  restore();
  new MutationObserver(restore).observe(document.documentElement,{childList:true,subtree:true});
})();
