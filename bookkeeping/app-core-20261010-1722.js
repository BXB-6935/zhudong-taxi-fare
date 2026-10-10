const STORAGE_KEY='mobileBookkeepingRecordsV1';
const CAR_KEY='mobileBookkeepingCarV1';
const SESSION_KEY='mobileBookkeepingSessionsV1';
const APP_STATE_KEY='mobileBookkeepingAppStateV1';
const DRAFT_KEY='mobileBookkeepingDraftV1';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function pad(n){return String(n).padStart(2,'0')}
function toISO(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function parseISO(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
function fmtDate(s){return s.replaceAll('-','/')}
function money(n){return 'NT$ '+Math.round(n||0).toLocaleString('zh-TW')}
function num(n,d=1){return Number(n||0).toLocaleString('zh-TW',{maximumFractionDigits:d})}
function pct(v){if(!isFinite(v)) return '0.0%'; return `${v>=0?'+':''}${v.toFixed(1)}%`}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}

function loadRecords(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch(e){return[]}
}
function saveRecords(rows){localStorage.setItem(STORAGE_KEY,JSON.stringify(rows))}
function loadSessions(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'[]')}catch(e){return[]}
}
function saveSessions(rows){localStorage.setItem(SESSION_KEY,JSON.stringify(rows))}
function activeSession(){
  return loadSessions().find(s=>!s.endAt) || null;
}
function localDateTime(d=new Date()){
  return `${toISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function timeOnly(iso){
  if(!iso)return '-';
  const p=iso.split('T')[1]||'';
  return p.slice(0,5);
}
function loadAppState(){
  try{return JSON.parse(localStorage.getItem(APP_STATE_KEY)||'{}')}catch(e){return{}}
}
function saveAppState(patch={}){
  const state={...loadAppState(),...patch,lastSavedAt:new Date().toISOString()};
  localStorage.setItem(APP_STATE_KEY,JSON.stringify(state));
}
function selectedBusinessDate(){
  const state=loadAppState();
  const s=activeSession();
  return state.recordDate || (s?s.date:toISO(new Date()));
}
function setSelectedBusinessDate(date){
  if(!date)return;
  saveAppState({recordDate:date});
  syncBusinessDayUI();
}
function syncBusinessDayUI(){
  const viewDate=selectedBusinessDate();
  const picker=$('#recordDatePicker');
  const badge=$('#businessDayBadge');
  const hint=$('#businessDayHint');
  const s=activeSession();

  if(picker){
    picker.value=viewDate;
    picker.disabled=false;
  }

  if(badge){
    badge.textContent=s
      ? '上線中・'+fmtDate(s.date)
      : '查看・'+fmtDate(viewDate);
  }

  if(hint){
    if(s){
      hint.textContent=viewDate===s.date
        ? '目前上線中，跨過凌晨 00:00 仍持續計入 '+fmtDate(s.date)+'；你也可以切換日期查看過去紀錄。'
        : '目前查看 '+fmtDate(viewDate)+'；你仍在 '+fmtDate(s.date)+' 上線中，新登記的營收會繼續記入 '+fmtDate(s.date)+'。';
    }else{
      hint.textContent='可用今天／昨天／前天或日曆切換查看與補登紀錄。';
    }
  }

  const today=toISO(new Date());
  const y=new Date();y.setDate(y.getDate()-1);
  const by=new Date();by.setDate(by.getDate()-2);
  const map={today,yesterday:toISO(y),beforeYesterday:toISO(by)};
  $$('#recordDateQuick [data-record-day]').forEach(b=>{
    const val=map[b.dataset.recordDay];
    b.classList.toggle('active',val===viewDate);
    b.disabled=false;
  });
}
function saveDraft(){
  const data={
    revenue:$('#fRevenue')?.value||'',
    payment:$('#fPayment')?.value||'現金',
    pickup:$('#fPickup')?.value||'',
    dropoff:$('#fDropoff')?.value||'',
    note:$('#fNote')?.value||''
  };
  localStorage.setItem(DRAFT_KEY,JSON.stringify(data));
}
function loadDraft(){
  try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')}catch(e){return{}}
}
function clearDraft(){
  localStorage.removeItem(DRAFT_KEY);
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

function seedData(){
  const today=new Date(), sessions=[], rows=[];
  const sampleTrips=[
    [260,'現金','竹東火車站','竹北'],
    [320,'信用卡','竹北','高鐵新竹站'],
    [180,'現金','新竹市區','竹東'],
    [420,'LINE Pay','竹東','關西'],
    [250,'現金','竹東','芎林']
  ];
  for(let d=0;d<7;d++){
    const dt=new Date(today);dt.setDate(today.getDate()-(6-d));
    const date=toISO(dt);
    const start=new Date(dt); start.setHours(9+(d%2),10,0,0);
    const end=new Date(dt); end.setHours(17+(d%3),35,0,0);
    const startKm=125000+d*118;
    const endKm=startKm+82+(d*9);
    const sid=uid();
    sessions.push({id:sid,date,startAt:localDateTime(start),startOdo:startKm,endAt:localDateTime(end),endOdo:endKm});
    sampleTrips.slice(0,3+(d%3)).forEach((s,i)=>{
      rows.push({id:uid(),sessionId:sid,date,revenue:s[0]+d*10,payment:s[1],pickup:s[2],dropoff:s[3],note:'',sequence:i+1});
    });
  }
  saveSessions(sessions);
  saveRecords(rows);
  renderAll();
  toast('已載入進出卡＋逐筆示範資料');
}

function getRangePreset(type){
  const now=new Date(); now.setHours(0,0,0,0);
  let s=new Date(now), e=new Date(now);
  if(type==='yesterday'){s.setDate(s.getDate()-1);e=new Date(s)}
  if(type==='3d') s.setDate(s.getDate()-2);
  if(type==='7d') s.setDate(s.getDate()-6);
  if(type==='thisWeek'){const day=(now.getDay()+6)%7;s.setDate(s.getDate()-day)}
  if(type==='lastWeek'){const day=(now.getDay()+6)%7;e.setDate(e.getDate()-day-1);s=new Date(e);s.setDate(s.getDate()-6)}
  if(type==='thisMonth'){s=new Date(now.getFullYear(),now.getMonth(),1)}
  if(type==='lastMonth'){s=new Date(now.getFullYear(),now.getMonth()-1,1);e=new Date(now.getFullYear(),now.getMonth(),0)}
  return [toISO(s),toISO(e)];
}

let currentStart='',currentEnd='';
function setRange(type){
  const [s,e]=getRangePreset(type);
  currentStart=s;currentEnd=e;
  $('#startDate').value=s;$('#endDate').value=e;
  $$('.quick-btn').forEach(b=>b.classList.toggle('active',b.dataset.range===type));
  saveAppState({quickRange:type,startDate:s,endDate:e});
  renderHome();
}
function inRange(row,s,e){return row.date>=s && row.date<=e}
function aggregate(rows,sessions=[]){
  const revenue=rows.reduce((a,b)=>a+(+b.revenue||0),0);
  const orders=rows.length;
  const closed=sessions.filter(s=>s.endAt && s.endOdo!=null);
  const hours=closed.reduce((a,s)=>{
    const ms=new Date(s.endAt)-new Date(s.startAt);
    return a+(ms>0?ms/3600000:0);
  },0);
  const mileage=closed.reduce((a,s)=>a+Math.max(0,(+s.endOdo||0)-(+s.startOdo||0)),0);
  const days=new Set(sessions.map(s=>s.date).concat(rows.map(r=>r.date))).size;
  return {revenue,hours,orders,mileage,days,perHour:hours?revenue/hours:0,avgOrder:orders?revenue/orders:0,avgDay:days?revenue/days:0}
}
function dateSpan(s,e){
  return Math.max(1,Math.round((parseISO(e)-parseISO(s))/86400000)+1)
}
function shiftRange(s,e,days){
  const a=parseISO(s),b=parseISO(e);a.setDate(a.getDate()+days);b.setDate(b.getDate()+days);return[toISO(a),toISO(b)]
}
function compareData(){
  const mode=$('#compareMode').value;
  let aS=currentStart,aE=currentEnd,bS,bE,left='本區間',right='前一區間';
  if(mode==='week'){[aS,aE]=getRangePreset('thisWeek');[bS,bE]=getRangePreset('lastWeek');left='本週';right='上週'}
  else if(mode==='month'){[aS,aE]=getRangePreset('thisMonth');[bS,bE]=getRangePreset('lastMonth');left='本月';right='上月'}
  else{
    const span=dateSpan(aS,aE); [bS,bE]=shiftRange(aS,aE,-span)
  }
  const rows=loadRecords(), sessions=loadSessions();
  const a=aggregate(rows.filter(r=>inRange(r,aS,aE)), sessions.filter(s=>inRange(s,aS,aE)));
  const b=aggregate(rows.filter(r=>inRange(r,bS,bE)), sessions.filter(s=>inRange(s,bS,bE)));
  return {a,b,aS,aE,bS,bE,left,right}
}
function growth(a,b){ if(b===0) return a===0?0:100; return ((a-b)/b)*100 }

function sparkSVG(color){
  return `<svg class="spark" viewBox="0 0 80 30"><polyline fill="none" stroke="${color}" stroke-width="2.3" points="2,24 10,20 18,21 27,16 36,18 44,12 54,15 64,8 78,4"/></svg>`
}