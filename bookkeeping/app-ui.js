function renderKPIs(agg){
  const items=[
    ['green','💵','區間總營收',money(agg.revenue),'#17b875'],
    ['blue','🕒','區間總工時',`${num(agg.hours)} 小時`,'#1677ff'],
    ['purple','🧾','區間單數',`${num(agg.orders,0)} 單`,'#8a56e8'],
    ['orange','🛣️','區間里程',`${num(agg.mileage)} 公里`,'#ff8b2c'],
    ['pink','📶','每小時營收',money(agg.perHour),'#ea4f8b'],
    ['teal','👥','平均客單',money(agg.avgOrder),'#0fa889'],
    ['blue','☀️','平均每天營收',money(agg.avgDay),'#1677ff'],
    ['purple','📅','實際有跑的天數',`${agg.days} 天`,'#8a56e8'],
  ];
  $('#kpiGrid').innerHTML=items.map(([cls,ic,label,val,c])=>`
    <div class="kpi ${cls}">
      <div class="icon">${ic}</div>
      <div class="label">${label}</div>
      <div class="value">${val}</div>
      <div class="delta">區間統計</div>
      ${sparkSVG(c)}
    </div>`).join('');
}


function dailyRows(rows,sessions=[]){
  const map={};
  function ensure(date){
    if(!map[date]) map[date]={date,revenue:0,hours:0,orders:0,mileage:0,punchIn:'-',punchOut:'-'};
    return map[date];
  }
  rows.forEach(r=>{
    const x=ensure(r.date);
    x.revenue += (+r.revenue||0);
    x.orders += 1;
  });
  sessions.forEach(s=>{
    const x=ensure(s.date);
    if(x.punchIn==='-' || (s.startAt && timeOnly(s.startAt)<x.punchIn)) x.punchIn=timeOnly(s.startAt);
    if(s.endAt && (x.punchOut==='-' || timeOnly(s.endAt)>x.punchOut)) x.punchOut=timeOnly(s.endAt);
    if(s.endAt){
      const ms=new Date(s.endAt)-new Date(s.startAt);
      if(ms>0)x.hours += ms/3600000;
      x.mileage += Math.max(0,(+s.endOdo||0)-(+s.startOdo||0));
    }
  });
  return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date));
}

function makeLineChart(rows,key,color='#1677ff',height=210){
  if(!rows.length)return `<div class="empty">此區間沒有資料</div>`;
  const sorted=[...rows].sort((a,b)=>a.date.localeCompare(b.date));
  const vals=sorted.map(r=>+r[key]||0), max=Math.max(...vals,1);
  const W=720,H=height,pL=44,pR=16,pT=18,pB=36, cw=W-pL-pR,ch=H-pT-pB;
  const x=i=>pL+(sorted.length===1?cw/2:i*cw/(sorted.length-1));
  const y=v=>pT+ch-(v/max)*ch;
  const pts=vals.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
  const area=`${pL},${pT+ch} ${pts} ${pL+cw},${pT+ch}`;
  let grid='';
  for(let i=0;i<=4;i++){const yy=pT+ch*i/4;grid+=`<line x1="${pL}" y1="${yy}" x2="${pL+cw}" y2="${yy}" stroke="#e7edf5" stroke-width="1"/>`}
  let labels='';
  sorted.forEach((r,i)=>{if(sorted.length<=8 || i%Math.ceil(sorted.length/7)===0){labels+=`<text x="${x(i)}" y="${H-10}" text-anchor="middle" fill="#718096" font-size="11">${r.date.slice(5).replace('-','/')}</text>`}})
  return `<svg viewBox="0 0 ${W} ${H}" aria-label="chart">
    ${grid}
    <polygon points="${area}" fill="${color}" opacity=".09"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${vals.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="${color}" stroke="#fff" stroke-width="2"/>`).join('')}
    ${labels}
  </svg>`;
}
function makeBarChart(rows,key,color='#59aaf8',height=210){
  if(!rows.length)return `<div class="empty">此區間沒有資料</div>`;
  const sorted=[...rows].sort((a,b)=>a.date.localeCompare(b.date));
  const vals=sorted.map(r=>+r[key]||0), max=Math.max(...vals,1);
  const W=720,H=height,pL=30,pR=12,pT=18,pB=38,cw=W-pL-pR,ch=H-pT-pB;
  const gap=cw/sorted.length, bw=Math.min(46,gap*.62);
  let out='';
  sorted.forEach((r,i)=>{
    const v=vals[i], h=(v/max)*ch, xx=pL+i*gap+(gap-bw)/2, yy=pT+ch-h;
    out+=`<rect x="${xx}" y="${yy}" width="${bw}" height="${h}" rx="7" fill="${color}"/>
    <text x="${xx+bw/2}" y="${Math.max(12,yy-5)}" text-anchor="middle" fill="#334155" font-size="11" font-weight="700">${num(v,0)}</text>
    <text x="${xx+bw/2}" y="${H-10}" text-anchor="middle" fill="#718096" font-size="11">${r.date.slice(5).replace('-','/')}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}">${out}</svg>`;
}
function makeComboChart(rows){
  if(!rows.length)return `<div class="empty">此區間沒有資料</div>`;
  const sorted=[...rows].sort((a,b)=>a.date.localeCompare(b.date));
  const W=720,H=220,pL=34,pR=16,pT=20,pB=38,cw=W-pL-pR,ch=H-pT-pB;
  const maxM=Math.max(...sorted.map(r=>+r.mileage||0),1), maxH=Math.max(...sorted.map(r=>+r.hours||0),1);
  const gap=cw/sorted.length,bw=Math.min(44,gap*.55);
  let bars='',pts=[];
  sorted.forEach((r,i)=>{
    const m=+r.mileage||0,h=+r.hours||0;
    const bh=(m/maxM)*ch,xx=pL+i*gap+(gap-bw)/2, yy=pT+ch-bh;
    bars+=`<rect x="${xx}" y="${yy}" width="${bw}" height="${bh}" rx="7" fill="#20bb7a" opacity=".65"/>
    <text x="${xx+bw/2}" y="${Math.max(12,yy-5)}" text-anchor="middle" fill="#119661" font-size="11" font-weight="700">${num(m,0)}</text>
    <text x="${xx+bw/2}" y="${H-10}" text-anchor="middle" fill="#718096" font-size="11">${r.date.slice(5).replace('-','/')}</text>`;
    const cx=xx+bw/2, cy=pT+ch-(h/maxH)*ch; pts.push([cx,cy]);
  });
  return `<svg viewBox="0 0 ${W} ${H}">
    ${bars}
    <polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#1677ff" stroke-width="4"/>
    ${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="#1677ff"/>`).join('')}
  </svg>`;
}

function renderCompare(){
  const c=compareData();
  $('#cmpLeftLabel').textContent=c.left;$('#cmpRightLabel').textContent=c.right;
  $('#cmpLeftRange').textContent=`${fmtDate(c.aS)} - ${fmtDate(c.aE)}`;
  $('#cmpRightRange').textContent=`${fmtDate(c.bS)} - ${fmtDate(c.bE)}`;
  $('#cmpLeftValue').textContent=money(c.a.revenue);$('#cmpRightValue').textContent=money(c.b.revenue);
  const metrics=[
    ['營收成長',growth(c.a.revenue,c.b.revenue)],
    ['單數成長',growth(c.a.orders,c.b.orders)],
    ['工時成長',growth(c.a.hours,c.b.hours)],
    ['里程成長',growth(c.a.mileage,c.b.mileage)]
  ];
  $('#compareList').innerHTML=metrics.map(([n,v])=>`<div class="compare-row"><span>${n}</span><span class="${v>=0?'up':'down'}">${pct(v)} ${v>=0?'↑':'↓'}</span></div>`).join('');
  $('#miniCompare').innerHTML=[
    ['g','營收成長',growth(c.a.revenue,c.b.revenue)],
    ['b','單數成長',growth(c.a.orders,c.b.orders)],
    ['o','工時成長',growth(c.a.hours,c.b.hours)],
    ['p','里程成長',growth(c.a.mileage,c.b.mileage)]
  ].map(([cls,n,v])=>`<div class="mini ${cls}"><strong class="${v>=0?'up':'down'}">${pct(v)}</strong><span>${n}</span></div>`).join('');
}
function renderDetail(rows){
  const sorted=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  $('#detailBody').innerHTML=sorted.length?sorted.map(r=>{
    const avg=(+r.orders||0)?(+r.revenue||0)/(+r.orders):0, ph=(+r.hours||0)?(+r.revenue||0)/(+r.hours):0;
    return `<tr><td>${fmtDate(r.date)}</td><td>${r.punchIn||'-'}</td><td>${r.punchOut||'-'}</td><td>${money(r.revenue)}</td><td>${num(r.hours)}</td><td>${num(r.orders,0)}</td><td>${num(r.mileage)}</td><td>${money(avg)}</td><td>${money(ph)}</td></tr>`
  }).join(''):`<tr><td colspan="9" class="empty">沒有資料</td></tr>`;
}
function renderHome(){
  if(!currentStart||!currentEnd){const r=getRangePreset('7d');currentStart=r[0];currentEnd=r[1];$('#startDate').value=r[0];$('#endDate').value=r[1]}
  const rows=loadRecords().filter(r=>inRange(r,currentStart,currentEnd));
  const sessions=loadSessions().filter(s=>inRange(s,currentStart,currentEnd));
  const agg=aggregate(rows,sessions);
  const daily=dailyRows(rows,sessions);
  renderKPIs(agg);
  $('#revenueChart').innerHTML=makeLineChart(daily,'revenue');
  $('#ordersChart').innerHTML=makeBarChart(daily,'orders');
  $('#hoursMileageChart').innerHTML=makeComboChart(daily);
  renderCompare();renderDetail(daily);
}
function renderAllRecords(){
  const rows=loadRecords().sort((a,b)=>(b.date+String(b.sequence||0).padStart(4,'0')).localeCompare(a.date+String(a.sequence||0).padStart(4,'0')));
  const seqMap={};
  rows.slice().reverse().forEach(r=>{seqMap[r.date]=(seqMap[r.date]||0)+1;r._displaySeq=seqMap[r.date]});
  $('#allBody').innerHTML=rows.length?rows.map(r=>`<tr>
    <td>${fmtDate(r.date)}</td>
    <td>#${r.sequence||r._displaySeq||1}</td>
    <td>${r.pickup||'-'}</td>
    <td>${r.dropoff||'-'}</td>
    <td>${money(r.revenue)}</td>
    <td>${r.payment||'-'}</td>
    <td>${r.note||'-'}</td>
    <td class="action-cell"><button class="edit" onclick="editRecord('${r.id}')">編輯</button><button class="delete" onclick="deleteRecord('${r.id}')">刪除</button></td>
  </tr>`).join(''):`<tr><td colspan="8" class="empty">尚無紀錄</td></tr>`;
}
function renderStats(){
  const rows=loadRecords(), sessions=loadSessions();
  const agg=aggregate(rows,sessions);
  $('#statsSummary').innerHTML=`
    <div class="kpi-grid">
      <div class="kpi green"><div class="label">累計營收</div><div class="value">${money(agg.revenue)}</div></div>
      <div class="kpi blue"><div class="label">累計工時</div><div class="value">${num(agg.hours)} 小時</div></div>
      <div class="kpi purple"><div class="label">累計單數</div><div class="value">${num(agg.orders,0)} 單</div></div>
      <div class="kpi orange"><div class="label">累計里程</div><div class="value">${num(agg.mileage)} 公里</div></div>
    </div>`;
  const byMonth={};
  rows.forEach(r=>{
    const m=r.date.slice(0,7);
    byMonth[m]=(byMonth[m]||0)+(+r.revenue||0);
  });
  const mrows=Object.entries(byMonth).sort().map(([date,revenue])=>({date:date+'-01',revenue}));
  $('#monthlyChart').innerHTML=makeBarChart(mrows,'revenue','#5b9df9',230);
}
function renderCar(){
  let car={};try{car=JSON.parse(localStorage.getItem(CAR_KEY)||'{}')}catch(e){}
  $('#carPlate').value=car.plate||'';$('#carModel').value=car.model||'';$('#carOdo').value=car.odo||'';
  $('#carInfo').textContent=car.plate?`已儲存：${car.plate}｜${car.model||'未填車型'}｜${car.odo?Number(car.odo).toLocaleString()+' 公里':'未填里程'}`:'尚未設定車輛資料';
}
function renderAll(){renderHome();renderAllRecords();renderStats();renderCar()}

function clearForm(restoreSavedDraft=false){
  const s=activeSession();
  $('#editId').value='';
  $('#fDate').value=s?s.date:'';
  $('#fDateDisplay').value=s?fmtDate(s.date):'尚未上線';
  const d=restoreSavedDraft?loadDraft():{};
  $('#fRevenue').value=d.revenue||'';
  $('#fPayment').value=d.payment||'現金';
  $('#fPickup').value=d.pickup||'';
  $('#fDropoff').value=d.dropoff||'';
  $('#fNote').value=d.note||'';
  if(!restoreSavedDraft) clearDraft();
}
window.editRecord=function(id){
  const r=loadRecords().find(x=>x.id===id);if(!r)return;
  $('#editId').value=r.id;
  $('#fDate').value=r.date;
  $('#fDateDisplay').value=fmtDate(r.date);
  $('#fRevenue').value=r.revenue;
  $('#fPayment').value=r.payment||'現金';
  $('#fPickup').value=r.pickup||'';
  $('#fDropoff').value=r.dropoff||'';
  $('#fNote').value=r.note||'';
  switchView('record');window.scrollTo({top:0,behavior:'smooth'});
}