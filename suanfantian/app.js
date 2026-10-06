const MENU=[{"id":"m1","cat":"點心區","name":"雞蛋豆腐","price":50,"emoji":"🥚"},{"id":"m2","cat":"點心區","name":"芋頭餅","price":40,"emoji":"🍠"},{"id":"m3","cat":"點心區","name":"麥克雞塊","price":35,"emoji":"🍗"},{"id":"m4","cat":"點心區","name":"脆薯","price":35,"emoji":"🍟"},{"id":"m5","cat":"點心區","name":"細薯條","price":35,"emoji":"🍟"},{"id":"m6","cat":"點心區","name":"洋蔥圈 5個","price":35,"emoji":"🧅"},{"id":"m7","cat":"點心區","name":"小湯圓","price":30,"emoji":"⚪"},{"id":"m8","cat":"點心區","name":"熱狗","price":30,"emoji":"🌭"},{"id":"m9","cat":"點心區","name":"甜不辣","price":35,"emoji":"🍤"},{"id":"m10","cat":"點心區","name":"鑫鑫腸","price":25,"emoji":"🌭"},{"id":"m11","cat":"點心區","name":"蘿蔔糕","price":25,"emoji":"⬜"},{"id":"m12","cat":"點心區","name":"百頁豆腐","price":25,"emoji":"🟨"},{"id":"m13","cat":"點心區","name":"糯米腸","price":25,"emoji":"🌭"},{"id":"m14","cat":"點心區","name":"芋頭干","price":25,"emoji":"🍠"},{"id":"m15","cat":"點心區","name":"芋粿巧","price":25,"emoji":"🍠"},{"id":"m16","cat":"點心區","name":"煉乳銀絲卷","price":30,"emoji":"🥖"},{"id":"m17","cat":"點心區","name":"銀絲卷","price":25,"emoji":"🥖"},{"id":"m18","cat":"點心區","name":"豬血糕","price":20,"emoji":"🍢"},{"id":"m19","cat":"點心區","name":"德式香腸","price":25,"emoji":"🌭"},{"id":"m20","cat":"點心區","name":"魚板","price":25,"emoji":"🐟"},{"id":"m21","cat":"點心區","name":"薯餅","price":20,"emoji":"🥔"},{"id":"m22","cat":"點心區","name":"豆干（3片）","price":15,"emoji":"🟫"},{"id":"m23","cat":"點心區","name":"豆皮","price":20,"emoji":"🟨"},{"id":"m24","cat":"海陸區","name":"無骨雞腿排","price":80,"emoji":"🍗"},{"id":"m25","cat":"海陸區","name":"古早味脆皮雞排","price":70,"emoji":"🍗"},{"id":"m26","cat":"海陸區","name":"無骨鹽酥雞","price":55,"emoji":"🐔"},{"id":"m27","cat":"海陸區","name":"魷魚頭","price":55,"emoji":"🦑"},{"id":"m28","cat":"海陸區","name":"鹽酥雞軟骨","price":50,"emoji":"🍖"},{"id":"m29","cat":"海陸區","name":"月亮蝦餅","price":50,"emoji":"🦐"},{"id":"m30","cat":"海陸區","name":"柳葉魚","price":40,"emoji":"🐟"},{"id":"m31","cat":"海陸區","name":"雞皮","price":25,"emoji":"🐔"},{"id":"m32","cat":"海陸區","name":"雞屁股","price":25,"emoji":"🐔"},{"id":"m33","cat":"海陸區","name":"雞心","price":25,"emoji":"❤️"},{"id":"m34","cat":"海陸區","name":"雞胗","price":25,"emoji":"🐔"},{"id":"m35","cat":"海陸區","name":"花枝丸","price":25,"emoji":"⚪"},{"id":"m36","cat":"海陸區","name":"黃金魚丸","price":25,"emoji":"🟡"},{"id":"m37","cat":"海陸區","name":"章魚串","price":65,"emoji":"🐙"},{"id":"m38","cat":"田園區","name":"玉米筍","price":45,"emoji":"🌽"},{"id":"m39","cat":"田園區","name":"青椒","price":45,"emoji":"🫑"},{"id":"m40","cat":"田園區","name":"玉米","price":40,"emoji":"🌽"},{"id":"m41","cat":"田園區","name":"香菇","price":30,"emoji":"🍄"},{"id":"m42","cat":"田園區","name":"杏鮑菇","price":30,"emoji":"🍄"},{"id":"m43","cat":"田園區","name":"花椰菜","price":45,"emoji":"🥦"},{"id":"m44","cat":"田園區","name":"四季豆","price":40,"emoji":"🫛"},{"id":"m45","cat":"田園區","name":"地瓜條","price":30,"emoji":"🍠"}];
const POPULAR_NAMES=['古早味脆皮雞排','無骨鹽酥雞','魷魚頭','甜不辣','雞蛋豆腐'];
const CATS=['🔥 熱門菜單','全部','點心區','海陸區','田園區'];
let active='🔥 熱門菜單';
let cart=JSON.parse(localStorage.getItem('ftsCartV2')||'[]').map(x=>({...x,spicy:x.spicy||'不辣',cut:x.cut||(x.name&&x.name.includes('雞排')?'不切':'')}));
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const money=n=>'NT$ '+Number(n||0).toLocaleString('zh-TW');
const saveCart=()=>localStorage.setItem('ftsCartV2',JSON.stringify(cart));
const cartTotal=()=>cart.reduce((a,x)=>a+x.price*x.qty,0);
const cartCount=()=>cart.reduce((a,x)=>a+x.qty,0);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1600)}
function pad(n){return String(n).padStart(2,'0')}
function roundUpMinutes(d,step=10){const x=new Date(d);const m=x.getMinutes();const add=(step-(m%step))%step;x.setMinutes(m+add,0,0);return x}
function nextPickupBase(){
 let d=new Date();d.setMinutes(d.getMinutes()+30);d=roundUpMinutes(d,10);
 const mins=d.getHours()*60+d.getMinutes(),open=15*60,close=23*60+30;
 if(mins<open)d.setHours(15,30,0,0);
 else if(mins>close){d.setDate(d.getDate()+1);d.setHours(15,30,0,0)}
 return d
}
function setPickupDateTime(d){
 $('#date').value=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
 $('#time').value=`${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function renderQuickTimes(){
 const wrap=$('#quickTimes');if(!wrap)return;
 const base=nextPickupBase();
 const opts=[0,20,40,60].map(add=>{const d=new Date(base);d.setMinutes(d.getMinutes()+add);return d.getHours()*60+d.getMinutes()>23*60+30?null:d}).filter(Boolean);
 wrap.innerHTML=opts.map((d,i)=>`<button type="button" class="quick-time ${i===0?'active':''}" data-date="${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}" data-time="${pad(d.getHours())}:${pad(d.getMinutes())}">${i===0?'最快 ':''}${pad(d.getHours())}:${pad(d.getMinutes())}</button>`).join('');
 $$('.quick-time').forEach(b=>b.onclick=()=>{$('#date').value=b.dataset.date;$('#time').value=b.dataset.time;$$('.quick-time').forEach(x=>x.classList.toggle('active',x===b))});
 $('#prepHint').textContent='最快約 '+pad(base.getHours())+':'+pad(base.getMinutes())+' 可取餐（最少預留 30 分鐘製作時間）'
}
function rememberCustomer(){localStorage.setItem('ftsCustomerV1',JSON.stringify({name:$('#name').value.trim(),phone:$('#phone').value.trim()}))}
function restoreCustomer(){try{const c=JSON.parse(localStorage.getItem('ftsCustomerV1')||'{}');if(c.name)$('#name').value=c.name;if(c.phone)$('#phone').value=c.phone}catch(e){}}
function clearOrderForm(){
 localStorage.removeItem('ftsCustomerV1');
 $('#name').value='';
 $('#phone').value='';
 $('#phone').classList.remove('phone-ok','phone-bad');
 $('#pepper').value='正常';
 $('#garlic').value='不要蒜頭';
 $('#note').value='';
 setPickupDateTime(nextPickupBase());
 renderQuickTimes();
 pendingPreviewOrder=null;
}
function status(){
 const d=new Date(),mins=d.getHours()*60+d.getMinutes(),open=15*60,close=23*60+30,s=$('#openStatus');
 if(mins>=open&&mins<=close){s.textContent='● 營業中・可預訂';s.style.color='#12864e'}
 else if(mins<open){s.textContent='尚未營業';s.style.color='#9a6d00'}
 else{s.textContent='今日已打烊';s.style.color='#c83b31'}
}
function renderCats(){
 $('#cats').innerHTML=CATS.map(c=>`<button class="cat ${c===active?'active':''}" data-c="${c}">${c}</button>`).join('');
 $$('.cat').forEach(b=>b.onclick=()=>{active=b.dataset.c;renderCats();renderMenu()})
}
function renderMenu(){
 const q=$('#search').value.trim().toLowerCase();
 const rows=MENU.filter(x=>((active==='全部')||(active==='🔥 熱門菜單'&&POPULAR_NAMES.includes(x.name))||(x.cat===active))&&(!q||x.name.toLowerCase().includes(q))).sort((a,b)=>b.price-a.price||a.name.localeCompare(b.name,'zh-Hant'));
 $('#menuCount').textContent=rows.length;
 $('#menu').innerHTML=rows.length?rows.map(x=>`
 <div class="item ${POPULAR_NAMES.includes(x.name)?'pop':''}">
  ${POPULAR_NAMES.includes(x.name)?'<span class="popular">熱門</span>':''}
  <div class="icon">${x.emoji}</div>
  <div><h3>${x.name}</h3><div class="catname">${x.cat}</div><div class="price">${money(x.price)}</div></div>
  <button class="add" onclick="add('${x.id}')">＋</button>
 </div>`).join(''):'<div class="empty">找不到符合的餐點</div>'
}
window.add=id=>{const m=MENU.find(x=>x.id===id),x=cart.find(x=>x.id===id);if(x)x.qty++;else cart.push({...m,qty:1,spicy:'不辣',cut:m.name.includes('雞排')?'不切':''});saveCart();renderCart();toast('已加入 '+m.name)}
window.qty=(id,d)=>{const x=cart.find(x=>x.id===id);if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(z=>z.id!==id);saveCart();renderCart()}
window.setSpicy=(id,v)=>{const x=cart.find(x=>x.id===id);if(!x)return;x.spicy=v;saveCart();renderCart();toast(x.name+' 已改為 '+v)}
window.setCut=(id,v)=>{const x=cart.find(x=>x.id===id);if(!x)return;x.cut=v;saveCart();renderCart();toast(x.name+' 已改為 '+v)}
function renderCart(){
 $('#cartCount').textContent=cartCount();$('#bottomTotal').textContent=money(cartTotal());$('#cartTotal').textContent=money(cartTotal());$('#cartQtySummary').textContent=cartCount()+' 份';
 $('#cart').innerHTML=cart.length?cart.map(x=>`
 <div class="cartrow"><div><div class="cartname">${x.name}</div><div class="cartsub">${money(x.price)} × ${x.qty} = ${money(x.price*x.qty)}</div>
 <select class="spice-select" onchange="setSpicy('${x.id}',this.value)">
 <option ${x.spicy==='不辣'?'selected':''}>不辣</option><option ${x.spicy==='小辣'?'selected':''}>小辣</option><option ${x.spicy==='中辣'?'selected':''}>中辣</option><option ${x.spicy==='大辣'?'selected':''}>大辣</option></select>
 ${x.name.includes('雞排')?`<select class="cut-select" onchange="setCut('${x.id}',this.value)"><option ${x.cut==='要切'?'selected':''}>要切</option><option ${x.cut==='不切'?'selected':''}>不切</option></select>`:''}
 </div><div class="qty"><button onclick="qty('${x.id}',-1)">−</button><b>${x.qty}</b><button onclick="qty('${x.id}',1)">＋</button></div></div>`).join(''):'<div class="empty">購物車目前是空的</div>'
}
function orderId(){const d=new Date();return `FTS-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${String(d.getTime()).slice(-4)}`}
function validate(){
 if(!cart.length){alert('請先加入餐點');return false}
 if(!$('#name').value.trim()){alert('請輸入姓名');return false}
 const phone=$('#phone').value.trim().replace(/\s|-/g,'');
 if(!phone){alert('請輸入電話');return false}
 if(!/^09\d{8}$/.test(phone)){alert('手機號碼格式請輸入 09 開頭共 10 碼');$('#phone').focus();return false}
 if(!$('#date').value||!$('#time').value){alert('請選擇取餐日期與時間');return false}
 const selected=new Date($('#date').value+'T'+$('#time').value+':00'),base=nextPickupBase();
 if(selected<new Date(base.getTime()-60000)){alert('取餐時間太早，請選擇最快可取時間之後。');return false}
 const mins=selected.getHours()*60+selected.getMinutes();
 if(mins<15*60||mins>23*60+30){alert('取餐時間請選在營業時間 15:00–23:30 內。');return false}
 rememberCustomer();return true
}
function buildOrder(save=false){
 if(!validate())return null;
 const o={id:orderId(),createdAt:new Date().toISOString(),name:$('#name').value.trim(),phone:$('#phone').value.trim(),date:$('#date').value,time:$('#time').value,pepper:$('#pepper').value,garlic:$('#garlic').value,note:$('#note').value.trim(),items:cart.map(x=>({...x})),total:cartTotal()};
 if(save){const h=JSON.parse(localStorage.getItem('ftsOrdersV2')||'[]');h.unshift(o);localStorage.setItem('ftsOrdersV2',JSON.stringify(h.slice(0,20)));renderHistory()}
 return o
}
function textOf(o){
 let s=`【蒜翻天鹽酥雞｜竹東東峰店】\n訂單編號：${o.id}\n姓名：${o.name}\n電話：${o.phone}\n取餐：${o.date} ${o.time}\n胡椒：${o.pepper}\n蒜頭：${o.garlic||'不要蒜頭'}\n\n餐點明細：\n`;
 o.items.forEach((x,i)=>s+=`${i+1}. ${x.name} × ${x.qty}｜${x.spicy||'不辣'}${x.name.includes('雞排')?'｜'+(x.cut||'不切'):''}\n`);
 s+=`\n合計：${money(o.total)}\n備註：${o.note||'無'}`;return s
}
function renderHistory(){
 const h=JSON.parse(localStorage.getItem('ftsOrdersV2')||'[]');
 $('#history').innerHTML=h.length?h.slice(0,5).map((o,idx)=>`<div class="order-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${o.id}｜${money(o.total)}</strong><button class="reorder" onclick="reorderHistory(${idx})">再點一次</button></div><div class="note">${o.date} ${o.time}｜${o.name}｜${o.items.reduce((a,x)=>a+x.qty,0)} 項｜待店家確認</div></div>`).join(''):'<div class="empty">尚無訂單紀錄</div>'
}
$('#search').oninput=renderMenu;
$('#name').addEventListener('blur',rememberCustomer);
$('#phone').addEventListener('blur',rememberCustomer);
$('#phone').addEventListener('input',()=>{const v=$('#phone').value.trim().replace(/\s|-/g,'');$('#phone').classList.remove('phone-ok','phone-bad');if(v)$('#phone').classList.add(/^09\d{8}$/.test(v)?'phone-ok':'phone-bad')});
$('#openCart').onclick=()=>$('#cartSheet').classList.add('show');
$('#closeCart').onclick=()=>$('#cartSheet').classList.remove('show');
$('#clearCart').onclick=()=>{if(!cart.length){toast('購物車目前是空的');return;}if(confirm('確定要清空購物車嗎？')){cart=[];saveCart();renderCart();$('#previewBox').classList.remove('show');pendingPreviewOrder=null;setProgress(1);toast('購物車已清空')}};
$('#cartSheet').onclick=e=>{if(e.target===$('#cartSheet'))$('#cartSheet').classList.remove('show')};
let pendingPreviewOrder=null,lastCreatedOrder=null;
function previewOrderText(o){
 const lines=[`姓名：${o.name}`,`電話：${o.phone}`,`取餐：${o.date} ${o.time}`,`胡椒：${o.pepper}`,`蒜頭：${o.garlic||'不要蒜頭'}`,''];
 o.items.forEach((x,i)=>{let opt=x.spicy||'不辣';if(x.name.includes('雞排'))opt+='／'+(x.cut||'不切');lines.push(`${i+1}. ${x.name} × ${x.qty}｜${opt}｜${money(x.price*x.qty)}`)});
 lines.push('',`合計：${money(o.total)}`);if(o.note)lines.push(`備註：${o.note}`);return lines.join('\n')
}
function setProgress(step){$$('.progress-step').forEach((x,i)=>x.classList.toggle('active',i===step-1))}
function showConfirmation(o){lastCreatedOrder=o;$('#confirmId').textContent=o.id;$('#confirmPickup').textContent=o.date+' '+o.time;$('#confirmTotal').textContent=money(o.total);$('#confirmPanel').classList.add('show');$('#confirmPanel').scrollIntoView({behavior:'smooth',block:'nearest'})}
$('#confirmLineBtn').onclick=async()=>{if(!lastCreatedOrder)return;try{await navigator.clipboard.writeText(textOf(lastCreatedOrder))}catch(e){}window.open('https://line.me/R/ti/p/@664awlma','_blank');toast('訂單已複製，請貼到 LINE')};
window.reorderHistory=idx=>{const h=JSON.parse(localStorage.getItem('ftsOrdersV2')||'[]'),o=h[idx];if(!o)return;cart=o.items.map(x=>({...x}));saveCart();renderCart();$('#cartSheet').classList.add('show');toast('已放回購物車，可直接再次下單')};
$('#previewOrder').onclick=()=>{const o=buildOrder(false);if(!o)return;pendingPreviewOrder=o;$('#previewText').textContent=previewOrderText(o);$('#previewBox').classList.add('show');setProgress(2);$('#previewBox').scrollIntoView({behavior:'smooth',block:'nearest'})};
$('#editOrder').onclick=()=>{$('#previewBox').classList.remove('show');setProgress(1)};
$('#saveOrderOnly').onclick=()=>{if(!pendingPreviewOrder)return;const h=JSON.parse(localStorage.getItem('ftsOrdersV2')||'[]');h.unshift(pendingPreviewOrder);localStorage.setItem('ftsOrdersV2',JSON.stringify(h.slice(0,20)));renderHistory();showConfirmation(pendingPreviewOrder);cart=[];saveCart();renderCart();$('#previewBox').classList.remove('show');toast('訂單已儲存')};
$('#sendLineFinal').onclick=async()=>{if(!pendingPreviewOrder)return;const orderToSend=pendingPreviewOrder;const h=JSON.parse(localStorage.getItem('ftsOrdersV2')||'[]');h.unshift(orderToSend);localStorage.setItem('ftsOrdersV2',JSON.stringify(h.slice(0,20)));renderHistory();try{await navigator.clipboard.writeText(textOf(orderToSend))}catch(e){}showConfirmation(orderToSend);cart=[];saveCart();renderCart();$('#previewBox').classList.remove('show');clearOrderForm();setProgress(3);window.open('https://line.me/R/ti/p/@664awlma','_blank');toast('訂單已送出，訂購資料已清除')};
$('#floatingLine').onclick=()=>window.open('https://line.me/R/ti/p/@664awlma','_blank');
$('#clearHistory').onclick=()=>{if(confirm('確定清除最近訂單？')){localStorage.removeItem('ftsOrdersV2');renderHistory()}};
setPickupDateTime(nextPickupBase());restoreCustomer();renderQuickTimes();status();setInterval(status,60000);renderCats();renderMenu();renderCart();renderHistory();