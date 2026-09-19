window.LIBYAN_STORE_CONFIG=window.LIBYAN_STORE_CONFIG||{};
const SUPABASE_CONFIG_URL='https://aybsettkyxfugntizfqq.supabase.co/functions/v1/public-config';
async function loadSupabase(){
  const cfg=window.LIBYAN_STORE_CONFIG;
  if(!cfg.url||!cfg.publishableKey){
    const r=await fetch(SUPABASE_CONFIG_URL,{cache:'no-store'}); if(!r.ok) throw new Error('تعذر تحميل إعدادات المتجر');
    const remote=await r.json(); Object.assign(cfg,remote);
  }
  if(!cfg.url||!cfg.publishableKey) throw new Error('إعدادات Supabase غير مكتملة');
  return supabase.createClient(cfg.url,cfg.publishableKey,{auth:{flowType:'implicit',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
}