/* Google avatar fallback: use Supabase automatic linking for matching emails. */
(function(){
  var KEY='__libyan_google_avatar_link_session';
  var FLAG='google_avatar_link=1';
  function qs(){return new URLSearchParams(location.search)}
  function cleanUrl(){try{var u=new URL(location.href);u.searchParams.delete('google_avatar_link');history.replaceState({},'',u.pathname+(u.search?u.search:'')+(u.hash||''))}catch(e){}}
  async function restoreOriginal(old){
    try{if(window.sb)await sb.auth.signOut()}catch(e){}
    try{
      var r=await sb.auth.setSession({access_token:old.access_token,refresh_token:old.refresh_token});
      if(r.error)throw r.error;
      try{session=r.data.session||session}catch(e){}
      try{localStorage.removeItem('__libyan_social_login_pending')}catch(e){}
      sessionStorage.removeItem(KEY);
      cleanUrl();
      if(typeof loadStore==='function')await loadStore();else location.reload();
    }catch(e){
      sessionStorage.removeItem(KEY);cleanUrl();
      alert('تم إلغاء ربط Google لأن حساب Google مختلف عن بريد حساب المتجر. استخدم نفس بريد حساب المتجر.');
      location.reload();
    }
  }
  async function finish(){
    if(!window.sb)return setTimeout(finish,300);
    var old=null;try{old=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(e){}
    if(!old||!old.access_token||!old.refresh_token){cleanUrl();return}
    try{
      var r=await sb.auth.getSession();
      if(r.error)throw r.error;
      var current=r.data.session;
      if(current&&current.user&&current.user.id===old.user_id){
        session=current;sessionStorage.removeItem(KEY);cleanUrl();
        if(typeof loadStore==='function')await loadStore();else location.reload();
        return;
      }
      await restoreOriginal(old);
    }catch(e){await restoreOriginal(old)}
  }
  function start(){
    if(qs().get('google_avatar_link')==='1'){setTimeout(finish,300);return}
    document.addEventListener('click',async function(ev){
      var btn=ev.target&&ev.target.closest?ev.target.closest('#linkGoogleAvatar'):null;
      if(!btn)return;
      ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
      if(!window.sb||!window.session||!session.user){return}
      var ids=Array.isArray(session.user.identities)?session.user.identities:[];
      if(ids.some(function(x){return x.provider==='google'})){return}
      var msg=document.getElementById('accountMsg');if(msg)msg.textContent='جارٍ فتح Google... استخدم نفس بريد حساب المتجر.';
      try{
        sessionStorage.setItem(KEY,JSON.stringify({user_id:session.user.id,email:session.user.email||'',access_token:session.access_token,refresh_token:session.refresh_token}));
        var r=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/?google_avatar_link=1',queryParams:{prompt:'select_account'}}});
        if(r.error)throw r.error;
      }catch(e){sessionStorage.removeItem(KEY);if(msg)msg.textContent='تعذر فتح Google: '+(e.message||'حاول مرة ثانية.')}
    },true);
  }
  start();
})();
