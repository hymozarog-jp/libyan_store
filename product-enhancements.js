(function(){
"use strict";
function wait(){
  if(typeof sb==="undefined"||!sb){setTimeout(wait,250);return}
  if(window.__productEnhancementsInstalled)return;
  window.__productEnhancementsInstalled=true;
  installRpcNotify();
  installAdminStats();
  installAlwaysAvailableLabel();
}
function installRpcNotify(){
  if(!sb.rpc||sb.rpc.__libyanWrapped)return;
  const original=sb.rpc.bind(sb);
  const wrapped=async function(fn,args,options){
    const result=await original(fn,args,options);
    if(fn==="create_wallet_order"&&!result.error&&result.data){
      try{await sb.functions.invoke("discord-notify",{body:{type:"order",id:result.data}})}
      catch(e){console.warn("Discord order notification:",e)}
    }
    return result;
  };
  wrapped.__libyanWrapped=true;
  sb.rpc=wrapped;
}
function installAdminStats(){
  if(typeof renderAdmin!=="function")return;
  const original=renderAdmin;
  if(original.__libyanStatsWrapped)return;
  const wrapped=async function(){
    const result=await original();
    try{await addSalesStats()}catch(e){console.warn("sales stats:",e)}
    return result;
  };
  wrapped.__libyanStatsWrapped=true;
  window.renderAdmin=wrapped;
}
async function addSalesStats(){
  if(typeof profile==="undefined"||profile?.role!=="admin")return;
  const [{data:items,error:ierr},{data:orders,error:oerr},{data:plist,error:perr}]=await Promise.all([
    sb.from("order_items").select("order_id,product_id,quantity"),
    sb.from("orders").select("id,user_id"),
    sb.from("products").select("id,name,active").order("created_at",{ascending:false})
  ]);
  if(ierr||oerr||perr)throw(ierr||oerr||perr);
  const orderMap=new Map((orders||[]).map(o=>[o.id,o]));
  const stats=new Map();
  for(const item of items||[]){
    const s=stats.get(item.product_id)||{orders:new Set(),customers:new Set(),qty:0};
    s.orders.add(item.order_id);
    s.qty+=Number(item.quantity||0);
    const order=orderMap.get(item.order_id);
    if(order?.user_id)s.customers.add(order.user_id);
    stats.set(item.product_id,s);
  }
  document.getElementById("libyanSalesStats")?.remove();
  const card=document.createElement("div");
  card.id="libyanSalesStats";
  card.className="card";
  card.style.marginTop="12px";
  card.dir="rtl";
  const rows=(plist||[]).map(p=>{
    const s=stats.get(p.id)||{orders:new Set(),customers:new Set(),qty:0};
    return '<div style="padding:10px 0;border-bottom:1px solid #202b3a"><b>'+esc(p.name)+'</b><div class="muted" style="margin-top:4px">👥 '+s.customers.size+' عميل — 🧾 '+s.orders.size+' طلب — 📦 '+s.qty+' وحدة مباعة — '+(p.active?'متاح':'متوقف')+'</div></div>';
  }).join("");
  card.innerHTML='<h3>📊 إحصائيات المنتجات</h3>'+(rows||'<span class="muted">لا توجد منتجات</span>');
  const grid=document.querySelector(".grid");
  if(grid)grid.parentElement.insertBefore(card,grid);
}
wait();
})();