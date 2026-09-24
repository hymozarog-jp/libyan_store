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
  if(!session){
   const anon=await sb.auth.signInAnonymously();
   if(anon.error)throw anon.error;
   session=anon.data.session||null;
  }
  if(!session)throw new Error('تعذر إنشاء جلسة الزائر تلقائيًا');
  await loadStore();
 }catch(e){
  app.innerHTML='<div class="card" style="text-align:center;margin-top:30px"><h1>⚡ Libyan Store</h1><p class="muted">'+esc(e.message||'تعذر تشغيل المتجر')+'</p><button class="btn primary" onclick="location.reload()">إعادة المحاولة</button></div>'
 }
}
undefined