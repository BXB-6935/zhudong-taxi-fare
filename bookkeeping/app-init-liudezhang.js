function renderPunch(){
  const s=activeSession();
  const off=$('#offlinePunch'), on=$('#onlinePunch'), badge=$('#onlineBadge');
  if(s){
    off.style.display='none'; on.style.display='block';
    badge.textContent='上線中';badge.style.background='#e8faf2';badge.style.color='#0d9d63';
    $('#activeStartTime').textContent=`${fmtDate(s.date)} ${timeOnly(s.startAt)}`;
    $('#activeStartOdo').textContent=`${num(s.startOdo)} km`;
    $('#fDate').value=s.date;$('#fDateDisplay').value=fmtDate(s.date);
  }else{
    off.style.display='block'; on.style.display='none';
    badge.textContent='尚未上線';badge.style.background='#eef2f7';badge.style.color='#64748b';
    if(!$('#editId').value){
      const day=selectedBusinessDate();
      $('#fDate').value=day;$('#fDateDisplay').value=fmtDate(day);
    }
  }
  syncBusinessDayUI();
  const businessDay=selectedBusinessDate();
  const daySessions=loadSessions().filter(x=>x.date===businessDay);
  const closed=daySessions.filter(x=>x.endAt);
  const hours=closed.reduce((a,x)=>a+Math.max(0,(new Date(x.endAt)-new Date(x.startAt))/3600000),0);
  const km=closed.reduce((a,x)=>a+Math.max(0,(+x.endOdo||0)-(+x.startOdo||0)),0);
  const todayRows=loadRecords().filter(r=>r.date===businessDay);
  $('#todayPunchSummary').innerHTML=`
    <div class="mini-compare">
      <div class="mini b"><strong>${num(hours)} 小時</strong><span>本營業日已完成工時</span></div>
      <div class="mini g"><strong>${num(km)} km</strong><span>本營業日已完成里程</span></div>
      <div class="mini o"><strong>${todayRows.length} 單</strong><span>本營業日明細筆數</span></div>
      <div class="mini p"><strong>${money(todayRows.reduce((a,r)=>a+(+r.revenue||0),0))}</strong><span>本營業日營收</span></div>
    </div>`;
}

function punchIn(){
  if(activeSession()){alert('目前已有一筆上線中的進卡紀錄，請先下線出卡。');return}
  const km=Number($('#startOdo').value);
  if(!Number.isFinite(km) || km<0 || $('#startOdo').value===''){alert('上線進卡一定要輸入目前公里數。');$('#startOdo').focus();return}
  const now=new Date(), sid=uid();
  const sessions=loadSessions();
  sessions.push({id:sid,date:toISO(now),startAt:localDateTime(now),startOdo:km,endAt:null,endOdo:null});
  saveSessions(sessions);
  $('#startOdo').value='';
  saveAppState({pendingStartOdo:'',recordDate:toISO(now)});
  clearForm();renderPunch();renderAll();toast('已完成上線進卡');
}

function punchOut(){
  const s=activeSession();
  if(!s){alert('目前沒有上線中的進卡紀錄。');return}
  const km=Number($('#endOdo').value);
  if(!Number.isFinite(km) || $('#endOdo').value===''){alert('下線出卡一定要輸入目前公里數。');$('#endOdo').focus();return}
  if(km < Number(s.startOdo)){alert('出卡公里數不可小於進卡公里數。');return}
  const now=new Date(), sessions=loadSessions();
  const idx=sessions.findIndex(x=>x.id===s.id);
  sessions[idx]={...sessions[idx],endAt:localDateTime(now),endOdo:km};
  saveSessions(sessions);
  $('#endOdo').value='';
  saveAppState({pendingEndOdo:'',recordDate:s.date});
  clearForm();renderPunch();renderAll();toast('已完成下線出卡，工時與公里已自動計算');
}

window.deleteRecord=function(id){
  if(!confirm('確定刪除這筆紀錄？'))return;
  saveRecords(loadRecords().filter(r=>r.id!==id));renderAll();toast('已刪除');
}

function switchView(name){
  $$('.view').forEach(v=>v.classList.remove('active'));$('#view-'+name).classList.add('active');
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  saveAppState({activeView:name});
  if(name==='home')renderHome();if(name==='record'){syncBusinessDayUI();renderAllRecords();renderPunch();}if(name==='stats')renderStats();if(name==='car')renderCar();
}

$$('#quickGrid .quick-btn').forEach(b=>b.addEventListener('click',()=>setRange(b.dataset.range)));
$('#applyDate').addEventListener('click',()=>{
  const s=$('#startDate').value,e=$('#endDate').value;
  if(!s||!e||s>e){alert('請確認日期區間');return}
  currentStart=s;currentEnd=e;$$('.quick-btn').forEach(x=>x.classList.remove('active'));
  saveAppState({quickRange:'custom',startDate:s,endDate:e});
  renderHome()
});
$('#compareMode').addEventListener('change',()=>{saveAppState({compareMode:$('#compareMode').value});renderCompare();});
$('#recordDateQuick [data-record-day]').forEach(b=>b.addEventListener('click',()=>{
  const d=new Date();
  if(b.dataset.recordDay==='yesterday')d.setDate(d.getDate()-1);
  if(b.dataset.recordDay==='beforeYesterday')d.setDate(d.getDate()-2);
  setSelectedBusinessDate(toISO(d));
  clearForm();
  renderAllRecords();
  renderPunch();
}));
$('#recordDatePicker').addEventListener('change',()=>{
  const d=$('#recordDatePicker').value;
  if(!d)return;
  setSelectedBusinessDate(d);
  clearForm();
  renderAllRecords();
  renderPunch();
});
$$('.nav-btn').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
['fRevenue','fPayment','fPickup','fDropoff','fNote'].forEach(id=>{
  const el=$('#'+id);
  if(el){
    el.addEventListener('input',saveDraft);
    el.addEventListener('change',saveDraft);
  }
});
$('#saveRecord').addEventListener('click',()=>{
  const id=$('#editId').value;
  const existing=id?loadRecords().find(r=>r.id===id):null;
  const s=activeSession();

  const date=id && existing ? existing.date : (s?s.date:selectedBusinessDate());
  const revenue=Number($('#fRevenue').value);
  if(!Number.isFinite(revenue) || $('#fRevenue').value===''){alert('請輸入本筆營收金額。');$('#fRevenue').focus();return}

  const payment=$('#fPayment').value,pickup=$('#fPickup').value.trim(),dropoff=$('#fDropoff').value.trim(),note=$('#fNote').value.trim();
  let rows=loadRecords();
  let sequence=existing?.sequence;
  if(!sequence){
    sequence=rows.filter(r=>r.date===date).length+1;
  }
  const rec={
    id:id||uid(),
    sessionId:existing?.sessionId || s?.id || null,
    date,
    sequence,
    revenue,
    payment,
    pickup,
    dropoff,
    note
  };
  if(id)rows=rows.map(r=>r.id===id?rec:r);else rows.push(rec);
  saveRecords(rows);saveAppState({recordDate:date});clearForm();renderAll();renderPunch();syncBusinessDayUI();toast(id?'已更新這一筆':'已新增一筆營收');
});
$('#cancelEdit').addEventListener('click',clearForm);
$('#punchInBtn').addEventListener('click',punchIn);
$('#punchOutBtn').addEventListener('click',punchOut);
$('#startOdo').addEventListener('input',()=>saveAppState({pendingStartOdo:$('#startOdo').value}));
$('#endOdo').addEventListener('input',()=>saveAppState({pendingEndOdo:$('#endOdo').value}));
$('#seedBtn').addEventListener('click',()=>{if(confirm('載入示範資料會覆蓋目前紀錄，是否繼續？'))seedData()});
$('#clearBtn').addEventListener('click',()=>{if(confirm('確定清除所有記帳資料？')){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(SESSION_KEY);localStorage.removeItem(APP_STATE_KEY);localStorage.removeItem(DRAFT_KEY);clearForm();renderPunch();setRange('7d');renderAll();toast('資料已清除')}});

$('#saveCar').addEventListener('click',()=>{
  const car={plate:$('#carPlate').value.trim(),model:$('#carModel').value.trim(),odo:$('#carOdo').value};
  localStorage.setItem(CAR_KEY,JSON.stringify(car));renderCar();toast('車輛資料已儲存')
});

$('#sessionCsvBtn').addEventListener('click',()=>{
  const sessions=loadSessions().slice().sort((a,b)=>a.startAt.localeCompare(b.startAt));
  const csv=['日期,進卡時間,進卡公里,出卡時間,出卡公里,工時小時,本次里程',...sessions.map(s=>{
    const hours=s.endAt?Math.max(0,(new Date(s.endAt)-new Date(s.startAt))/3600000):'';
    const km=s.endAt?Math.max(0,(+s.endOdo||0)-(+s.startOdo||0)):'';
    return [s.date,timeOnly(s.startAt),s.startOdo,timeOnly(s.endAt),s.endOdo??'',hours===''?'':hours.toFixed(2),km].join(',');
  })].join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`進出卡紀錄_${toISO(new Date())}.csv`;a.click();URL.revokeObjectURL(a.href);
});

$('#backupBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({
    records:loadRecords(),
    sessions:loadSessions(),
    car:JSON.parse(localStorage.getItem(CAR_KEY)||'{}'),
    appState:loadAppState(),
    draft:loadDraft()
  },null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='記帳儀表板備份_'+toISO(new Date())+'.json';a.click();URL.revokeObjectURL(a.href);
});
$('#restoreInput').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();rd.onload=()=>{
    try{
      const data=JSON.parse(rd.result);
      if(Array.isArray(data.records))saveRecords(data.records);
      if(Array.isArray(data.sessions))saveSessions(data.sessions);
      if(data.car)localStorage.setItem(CAR_KEY,JSON.stringify(data.car));
      if(data.appState)localStorage.setItem(APP_STATE_KEY,JSON.stringify(data.appState));
      if(data.draft)localStorage.setItem(DRAFT_KEY,JSON.stringify(data.draft));
      restoreAppState();
      renderPunch();renderAll();toast('備份已匯入')
    }catch(err){alert('備份檔格式錯誤')}
  };rd.readAsText(f)
});
$('#exportBtn').addEventListener('click',()=>{
  const rows=loadRecords().filter(r=>inRange(r,currentStart,currentEnd)).sort((a,b)=>a.date.localeCompare(b.date));
  const csv=['日期,序號,上車地點,下車地點,營收,付款方式,備註',...rows.map(r=>[
    r.date,r.sequence||'',`"${(r.pickup||'').replaceAll('"','""')}"`,`"${(r.dropoff||'').replaceAll('"','""')}"`,r.revenue,r.payment||'',`"${(r.note||'').replaceAll('"','""')}"`
  ].join(','))].join('\\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`記帳_${currentStart}_${currentEnd}.csv`;a.click();URL.revokeObjectURL(a.href);
});

function restoreAppState(){
  const state=loadAppState();

  if(state.compareMode && $('#compareMode')){
    $('#compareMode').value=state.compareMode;
  }

  if(state.quickRange && state.quickRange!=='custom'){
    const [s,e]=getRangePreset(state.quickRange);
    currentStart=state.startDate||s;
    currentEnd=state.endDate||e;
    $('#startDate').value=currentStart;
    $('#endDate').value=currentEnd;
    $$('.quick-btn').forEach(b=>b.classList.toggle('active',b.dataset.range===state.quickRange));
  }else if(state.startDate && state.endDate){
    currentStart=state.startDate;
    currentEnd=state.endDate;
    $('#startDate').value=currentStart;
    $('#endDate').value=currentEnd;
    $$('.quick-btn').forEach(b=>b.classList.remove('active'));
  }else{
    const [s,e]=getRangePreset('7d');
    currentStart=s;currentEnd=e;
    $('#startDate').value=s;$('#endDate').value=e;
    $$('.quick-btn').forEach(b=>b.classList.toggle('active',b.dataset.range==='7d'));
  }

  $('#startOdo').value=state.pendingStartOdo||'';
  $('#endOdo').value=state.pendingEndOdo||'';

  clearForm(true);

  const view=state.activeView||'home';
  $$('.view').forEach(v=>v.classList.remove('active'));
  const target=$('#view-'+view);
  if(target)target.classList.add('active');
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
}

restoreAppState();
syncBusinessDayUI();
renderAll();
renderPunch();