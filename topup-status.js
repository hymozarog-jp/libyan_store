/* Top-up status UI: shows the customer that a wallet top-up is under review and follows the result. */
(function(){
  function waitForSupabase(){
    return new Promise(function(resolve){
      if(window.sb) return resolve(window.sb);
      var timer=setInterval(function(){
        if(window.sb){clearInterval(timer);resolve(window.sb)}
      },200);
      setTimeout(function(){clearInterval(timer);resolve(window.sb||null)},15000);
    });
  }

  function toast(message, type){
    var old=document.getElementById('topupStatusToast');
    if(old) old.remove();
    var box=document.createElement('div');
    box.id='topupStatusToast';
    box.dir='rtl';
    box.style.cssText='position:fixed;left:14px;right:14px;bottom:86px;z-index:100000;max-width:520px;margin:auto;padding:16px 18px;border-radius:16px;background:#171d27;border:1px solid #334155;box-shadow:0 14px 40px rgba(0,0,0,.35);color:#fff;font-family:inherit;text-align:right';
    box.innerHTML='<div style="font-size:17px;font-weight:800">'+message+'</div>';
    document.body.appendChild(box);
    if(type!=='pending') setTimeout(function(){if(box.parentNode)box.remove()},7000);
    return box;
  }

  async function watchTopup(){
    var client=await waitForSupabase();
    if(!client || !window.session || !window.session.user) return;

    await new Promise(function(r){setTimeout(r,900)});
    var latest=await client.from('wallet_topups')
      .select('id,status,amount,admin_note,created_at')
      .eq('user_id',window.session.user.id)
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle();

    if(latest.error || !latest.data) return;
    var row=latest.data;
    var created=Date.parse(row.created_at||'');
    if(!created || Date.now()-created>120000) return;

    if(row.status==='pending'){
      toast('⏳ تم إرسال طلب الشحن بنجاح.<br><span style="font-size:14px;font-weight:500;color:#aeb9c8">انتظر قليلًا، سيتم قبول الطلب أو رفضه بعد المراجعة.</span>','pending');
    } else if(row.status==='approved'){
      toast('✅ تم قبول طلب الشحن وإضافة المبلغ إلى محفظتك.','approved');
      if(typeof window.renderWallet==='function') setTimeout(function(){window.renderWallet()},1200);
      return;
    } else if(row.status==='rejected'){
      toast('❌ تم رفض طلب الشحن.'+(row.admin_note?'<br><span style="font-size:14px;font-weight:500;color:#aeb9c8">السبب: '+String(row.admin_note).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]})+'</span>':''),'rejected');
      if(typeof window.renderWallet==='function') setTimeout(function(){window.renderWallet()},1200);
      return;
    } else return;

    var started=Date.now();
    var timer=setInterval(async function(){
      if(Date.now()-started>120000){clearInterval(timer);return}
      var check=await client.from('wallet_topups')
        .select('id,status,amount,admin_note')
        .eq('id',row.id)
        .maybeSingle();
      if(check.error || !check.data) return;
      if(check.data.status==='approved'){
        clearInterval(timer);
        toast('✅ تم قبول طلب الشحن وإضافة المبلغ إلى محفظتك.','approved');
        if(typeof window.renderWallet==='function') setTimeout(function(){window.renderWallet()},1200);
      }else if(check.data.status==='rejected'){
        clearInterval(timer);
        var note=check.data.admin_note?'<br><span style="font-size:14px;font-weight:500;color:#aeb9c8">السبب: '+String(check.data.admin_note).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]})+'</span>':'';
        toast('❌ تم رفض طلب الشحن.'+note,'rejected');
        if(typeof window.renderWallet==='function') setTimeout(function(){window.renderWallet()},1200);
      }
    },2500);
  }

  function attach(){
    var button=document.getElementById('sendTop');
    if(!button || button.dataset.topupStatusAttached==='1') return;
    button.dataset.topupStatusAttached='1';
    button.addEventListener('click',function(){
      toast('⏳ جارٍ إرسال طلب الشحن...<br><span style="font-size:14px;font-weight:500;color:#aeb9c8">بعد الإرسال سيتم مراجعته وقبوله أو رفضه.</span>','pending');
      watchTopup();
    },true);
  }

  var observer=new MutationObserver(attach);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  attach();
})();