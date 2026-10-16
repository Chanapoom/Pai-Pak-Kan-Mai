import {bangkokMinutes,openingStatus,hoursInfo,boundaryLabel} from './hours.js';
import {t,getLang,english,PROVINCES_EN,DISTRICTS_EN,LINES_EN} from './i18n.js';
export {bangkokMinutes,openingStatus,hoursInfo};
export function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// Time of day in Bangkok sets the map's tint. Before 05:00 counts as night.
export const DAYPARTS=[
  {id:'morning',label:'ยามเช้า',from:5*60},
  {id:'day',label:'กลางวัน',from:11*60},
  {id:'evening',label:'ยามเย็น',from:16*60},
  {id:'night',label:'กลางคืน',from:19*60}
];
export function daypart(date = new Date()) {
  const now=bangkokMinutes(date);
  return [...DAYPARTS].reverse().find(d=>now>=d.from)||DAYPARTS.at(-1);
}
export function clockText(date = new Date()) {
  const now=bangkokMinutes(date);
  return t('{time} น.',{time:`${String(Math.floor(now/60)).padStart(2,'0')}:${String(now%60).padStart(2,'0')}`});
}
export function formatDuration(minutes) {
  if(minutes<60)return t('{m} นาที',{m:minutes});
  const h=Math.floor(minutes/60), m=minutes%60;
  return m&&h<3?t('{h} ชม. {m} นาที',{h,m}):t('{h} ชม.',{h});
}
export function distanceKm(a,b) {
  const rad=x=>x*Math.PI/180;
  const h=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
// "What do you want to do?" chips. Matching reads only the place's own activity/facility lists,
// so a place never appears under an intent its sourced data does not support.
const hasAny=(list,wanted)=>wanted.some(x=>list.includes(x));
// short keys kept for the first provinces (links and tests use them); other provinces use their Thai name as the value
export const PROVINCE_KEYS={bangkok:'กรุงเทพมหานคร',nonthaburi:'นนทบุรี',pathumthani:'ปทุมธานี',samutprakan:'สมุทรปราการ',samutsakhon:'สมุทรสาคร',nakhonpathom:'นครปฐม',chiangmai:'เชียงใหม่',nakhonratchasima:'นครราชสีมา',udonthani:'อุดรธานี',ayutthaya:'พระนครศรีอยุธยา',rayong:'ระยอง',phetchaburi:'เพชรบุรี',songkhla:'สงขลา'};
export const INTENTS=[
  {id:'walk',label:'เดินเล่น',test:p=>hasAny(p.activities,['เดินเล่น','ชมธรรมชาติ','ถ่ายภาพ','ปิกนิก'])},
  {id:'run',label:'วิ่ง',test:p=>hasAny(p.activities,['วิ่ง'])},
  {id:'bike',label:'ปั่นจักรยาน',test:p=>p.amenities?.cycle?.value!==false&&(hasAny(p.activities,['ปั่นจักรยาน'])||p.amenities?.cycle?.value===true)},
  {id:'mind',label:'โยคะ & แอโรบิก',test:p=>hasAny(p.activities,['โยคะ','แอโรบิก','ไทเก็ก'])},
  {id:'gym',label:'ยิม & เครื่องออกกำลังกาย',test:p=>p.type==='gym'||hasAny(p.activities,['เครื่องออกกำลังกาย','เวทเทรนนิง'])},
  {id:'kids',label:'พาเด็กไป',test:p=>p.facilities.includes('สนามเด็กเล่น')}
];
const INTENT_FACILITY={run:'track',bike:'cycle',gym:'equipment'};
export const matchesIntent=(place,id)=>!id||id==='all'||Boolean(INTENTS.find(i=>i.id===id)?.test(place));
// group 'sport': courts, tracks and pools shown as their own filter row; group 'service': everyday comforts.
// A place has a facility only when amenities[id] says so with a source, or its sourced facility list names it.
export const FACILITY_FILTERS=[
  {id:'track',group:'sport',label:'ลู่/ทางวิ่ง',terms:['ลู่วิ่ง','ทางวิ่ง','เส้นทางวิ่ง','ทางเดินและวิ่ง']},
  {id:'cycle',group:'sport',label:'ที่ปั่นจักรยาน',terms:['ทางจักรยาน','เส้นทางปั่นจักรยาน']},
  {id:'football',group:'sport',label:'สนามฟุตบอล/ฟุตซอล',terms:['สนามฟุตบอล','สนามฟุตซอล']},
  {id:'basketball',group:'sport',label:'สนามบาส',terms:['สนามบาสเกตบอล','สนามบาสเก็ตบอล']},
  {id:'pool',group:'sport',label:'สระว่ายน้ำ',terms:['สระว่ายน้ำ']},
  {id:'equipment',group:'sport',label:'เครื่องออกกำลังกาย',terms:['เครื่องออกกำลังกาย','เครื่องออกกำลังกายกลางแจ้ง','ฟิตเนสกลางแจ้ง']},
  {id:'badminton',group:'sport',label:'แบดมินตัน',terms:['สนามแบดมินตัน']},
  {id:'takraw',group:'sport',label:'ตะกร้อ',terms:['สนามตะกร้อ']},
  {id:'tennis',group:'sport',label:'เทนนิส',terms:['สนามเทนนิส']},
  {id:'table-tennis',group:'sport',label:'ปิงปอง',terms:['โต๊ะปิงปอง','สนามเทเบิลเทนนิส']},
  {id:'toilet',group:'service',label:'ห้องน้ำ',terms:['ห้องน้ำ']},
  {id:'parking',group:'service',label:'ที่จอดรถ',terms:['ที่จอดรถ']},
  {id:'accessible',group:'service',label:'การเข้าถึงสำหรับผู้พิการ',terms:['รองรับผู้พิการ']},
  {id:'playground',group:'service',label:'สนามเด็กเล่น',terms:['สนามเด็กเล่น']},
  {id:'pets',group:'service',label:'พื้นที่พาสัตว์เลี้ยงเข้าได้',terms:['Dog Park','พื้นที่สำหรับสุนัข']}
];
export const SPORT_FACILITIES=FACILITY_FILTERS.filter(f=>f.group==='sport');
export const sportFacilities=place=>SPORT_FACILITIES.filter(f=>facilityStatus(place,f.id)===true);
export function facilityStatus(place,id) {
  const explicit=place.amenities?.[id];
  if(explicit?.source&&typeof explicit.value==='boolean')return explicit.value;
  const option=FACILITY_FILTERS.find(f=>f.id===id);
  return option&&place.sources?.facilities&&hasAny(place.facilities||[],option.terms)?true:null;
}
export const validPoint=p=>Boolean(p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180);
export function locationCandidates(places,stations=[],query='') {
  const q=query.trim().toLocaleLowerCase('th');
  if(q.length<2)return [];
  const locations=[...places.map(p=>({id:p.id,label:p.name,detail:`${p.district} · ${p.province}`,lat:p.lat,lng:p.lng,kind:'place'})),...stations.map(s=>({id:`station-${s.id||s.name}`,label:`สถานี${s.name}`,detail:'สถานีรถไฟฟ้า',lat:s.lat,lng:s.lng,kind:'station'}))];
  return locations.filter(p=>validPoint(p)&&`${p.label} ${p.detail}`.toLocaleLowerCase('th').includes(q)).sort((a,b)=>Number(b.label.includes(q))-Number(a.label.includes(q))).slice(0,12);
}
export function filterPlaces(places,state,date=new Date()) {
  const query=(state.query||'').trim().toLocaleLowerCase('th');
  const list=places.filter(p=>{
    const category=state.category||'all';
    // English names and terms are searchable too, so the English view finds places by what it shows
    const searchable=[p.name,p.nameEn,p.district,DISTRICTS_EN[p.district],p.province,PROVINCES_EN[p.province],...p.activities,...p.activities.map(english),...p.rail.map(r=>`${r.station} ${r.line} ${LINES_EN[r.line]||''}`)].filter(Boolean).join(' ').toLocaleLowerCase('th');
    const matchCategory=category==='all'||(category==='park'&&p.type!=='gym')||(category==='gym'&&p.type==='gym')||(category==='exercise'&&p.type!=='gym'&&p.activities.some(a=>['วิ่ง','ออกกำลังกาย','แอโรบิก','ปั่นจักรยาน'].includes(a)));
    const fee=state.feeFilter||'all';
    const radius=Number(state.radiusKm),point=state.searchOrigin||state.location;
    const inRadius=!(radius>0&&validPoint(point))||distanceKm(point,p)<=radius;
    const b=state.bounds,inBounds=!b||(p.lat>=b.south&&p.lat<=b.north&&p.lng>=b.west&&p.lng<=b.east);
    const amenities=(state.facilities||[]).every(id=>facilityStatus(p,id)===true);
    return searchable.includes(query)&&matchCategory&&matchesIntent(p,state.intent)&&(!state.province||state.province==='all'||p.province===(PROVINCE_KEYS[state.province]||state.province))&&(!state.freeOnly||p.free===true)&&(fee==='all'||fee==='free'&&p.free===true||fee==='paid'&&p.free===false||fee==='unknown'&&p.free==null)&&(!state.openOnly||openingStatus(p,date)==='open')&&(!state.savedOnly||state.saved?.has(p.id))&&amenities&&inRadius&&inBounds&&(!state.photoOnly||Boolean(p.photo));
  });
  if(state.sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'th'));
  const origin=state.searchOrigin||state.location;
  if(state.sort==='distance'&&validPoint(origin))list.sort((a,b)=>distanceKm(origin,a)-distanceKm(origin,b));
  return list;
}
// What suits each time of day. Matching reads only the place's own type and activity list, never invented attributes.
export const DAYPART_FIT={
  morning:{mood:'เช้านี้ เหมาะไปเดินหรือวิ่งในสวน',types:{},activities:['วิ่ง','เดินเล่น','ชมธรรมชาติ','ไทเก็ก','โยคะ']},
  day:{mood:'กลางวัน ลองสวนป่าที่มีต้นไม้เยอะ หรือยิมในร่ม',types:{forest:1.5,nature:1.5,gym:1.5},activities:['เวทเทรนนิง','คาร์ดิโอ','คลาสกลุ่ม']},
  evening:{mood:'เย็นนี้ ไปออกกำลังกายก่อนสวนปิด',types:{},activities:['แอโรบิก','เครื่องออกกำลังกาย','เล่นกีฬา','ปั่นจักรยาน','วิ่ง','ดนตรีในสวน']},
  night:{mood:'ค่ำแล้ว เลือกที่ยังเปิดได้นานที่สุด',types:{gym:1},activities:['เวทเทรนนิง','คาร์ดิโอ'],lateBonus:true}
};
export function daypartFit(place,part){
  const fit=DAYPART_FIT[part.id];
  const matches=place.activities.filter(a=>fit.activities.includes(a));
  return {matches,typeMatch:Boolean(fit.types[place.type]),score:(fit.types[place.type]||0)+Math.min(matches.length,3)*.5};
}
// Ranks the filtered places for "right now". Open places come first, then places that reopen soonest, then places
// whose hours are unknown (never guessed open); the time of day can only reorder places inside one of those groups.
// Inside a group: what suits the time of day, free entry, rail access and, with a location, distance. Dataset order breaks ties.
export function recommend(places,state,date=new Date()) {
  const part=daypart(date);
  const list=filterPlaces(places,{...state,sort:'recommended'},date);
  return list.map((place,index)=>{
    const hours=hoursInfo(place,date), fit=daypartFit(place,part);
    const tier=hours.closure?-1:hours.status==='open'?2:hours.status==='closed'?1:0;
    // data order only breaks ties (at most half a point), so a long nationwide list does not bury its later entries
    let score=-index/Math.max(list.length,1)*0.5+fit.score;
    // a real photo makes a better first suggestion when nothing else separates two places
    if(place.photo)score+=0.5;
    if(hours.status==='open'){
      if(hours.minutesLeft<30)score-=6;
      else if(DAYPART_FIT[part.id].lateBonus||part.id==='evening')score+=Math.min(hours.minutesLeft,180)/90;
    }
    else if(hours.status==='closed')score-=Math.min(hours.minutesToOpen??1440,720)/360;
    if(place.free===true)score+=2;else if(place.free===false)score-=1;
    if(place.rail.length)score+=1;
    // a confirmed track, cycling area or exercise machines lifts a place for the matching "what do you want to do" choice
    const wanted=INTENT_FACILITY[state.intent];
    if(wanted&&facilityStatus(place,wanted)===true)score+=1.5;
    const origin=state.searchOrigin||state.location;
    if(validPoint(origin))score-=Math.min(distanceKm(origin,place),30)*0.3;
    // "suits" = open for at least another hour and a clear match for this time of day (two matching activities or a
    // matching type); at night, still being open is the match
    const suits=hours.status==='open'&&hours.minutesLeft>=60&&(fit.score>=1||Boolean(DAYPART_FIT[part.id].lateBonus));
    return {place,score,tier,hours,fit,suits};
  }).sort((a,b)=>b.tier-a.tier||b.score-a.score);
}
// What the pick card may show: only places that suit the current time of day, best first.
// When nothing suits (late night, or filters leave no match) the single best-ranked place is shown on its own.
export function pickPool(ranked){
  const suitable=ranked.filter(r=>r.suits);
  return suitable.length?{items:suitable,suitable:true}:{items:ranked.slice(0,1),suitable:false};
}
// Short, factual reasons for a place card. Every phrase comes from sourced fields, never from invented numbers.
export function whyGo(place,{location=null,date=new Date(),planned=false}={}) {
  const info=hoursInfo(place,date);
  const hours=info.status==='open'
    ?{status:'open',text:`${t(planned?'เปิดตามเวลาที่เลือก':'เปิดอยู่')} · ${info.minutesLeft>=1440?t('เปิดตลอดวัน'):info.minutesLeft<=60?t('ปิดในอีก {d}',{d:formatDuration(info.minutesLeft)}):t('ถึง {time}',{time:boundaryLabel(info.minutesLeft,date)})}`}
    // a closure notice is free Thai text from the source; English shows a plain "closed by notice" instead
    :info.status==='closed'?{status:'closed',text:info.closure?(getLang()==='en'?t('ปิดตามประกาศ'):info.closure):`${t(planned?'ปิดตามเวลาที่เลือก':'ปิดอยู่')}${info.minutesToOpen!=null?` · ${t('เปิด {when}',{when:boundaryLabel(info.minutesToOpen,date)})}`:` · ${t('เช็กวันเปิดครั้งถัดไป')}`}`}
    :{status:'unknown',text:t('เช็กเวลาก่อนไป')};
  const fee=place.free===true?{kind:'free',text:t('เข้าฟรี')}:place.free===false?{kind:'paid',text:t('มีค่าใช้จ่าย')}:{kind:'unknown',text:t('เช็กค่าเข้า')};
  const rail=place.rail[0]?{text:t('ใกล้ {line}',{line:place.rail[0].line.split(' ')[0]})}:null;
  const distance=location?{text:t('{km} กม.',{km:distanceKm(location,place).toFixed(1)})}:null;
  const part=daypart(date), f=daypartFit(place,part);
  const suits=f.matches.length?{text:t('เหมาะกับ{part}: {acts}',{part:t(part.label),acts:f.matches.slice(0,2).map(a=>t(a)).join(' · ')})}:f.typeMatch?{text:t('{kind} เหมาะกับ{part}',{kind:t(place.type==='gym'?'ยิมในร่ม':'สวนป่าในเมือง'),part:t(part.label)})}:null;
  // activities that suit the time of day are listed first
  const activities=[...f.matches,...place.activities.filter(a=>!f.matches.includes(a))];
  return {hours,fee,rail,distance,suits,activities,part};
}
export function directionsUrl(place,origin='',mode='transit') {
  const url=new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api','1');
  // A named venue allows Maps to resolve the entrance, rather than navigate to an approximate park centre.
  const entrance=place.access?.source&&(!place.access.mode||place.access.mode===mode)&&place.access?.destination;
  url.searchParams.set('destination',entrance||`${place.name} ${place.province} ประเทศไทย`);
  if(place.access?.source&&place.access?.placeId)url.searchParams.set('destination_place_id',place.access.placeId);
  url.searchParams.set('travelmode',['transit','walking','driving'].includes(mode)?mode:'transit');
  if(origin.trim())url.searchParams.set('origin',origin.trim());
  return url.href;
}
// config.json is edited by hand and its values end up in href attributes, so accept only a plain email or an https URL.
export function contactConfig(config) {
  const email=typeof config?.suggest?.email==='string'?config.suggest.email.trim():'';
  const formUrl=typeof config?.suggest?.formUrl==='string'?config.suggest.formUrl.trim():'';
  let safeForm='';
  try{if(formUrl&&new URL(formUrl).protocol==='https:')safeForm=new URL(formUrl).href;}catch{}
  const safeEmail=/^[^\s@<>"',;:]+@[^\s@<>"',;:]+\.[^\s@<>"',;:]+$/.test(email)?email:'';
  return {email:safeEmail,formUrl:safeForm,enabled:Boolean(safeEmail||safeForm)};
}
export function suggestionMessage({kind,name,area,link,details,placeId}) {
  const fix=kind==='fix';
  const lines=[fix?'แจ้งข้อมูลที่ไม่ตรง':'แนะนำสถานที่ใหม่',`ชื่อสถานที่: ${name||'-'}`];
  if(placeId)lines.push(`รหัสในไปพักกันไหม: ${placeId}`);
  lines.push(`ย่าน/จังหวัด: ${area||'-'}`,`ลิงก์แหล่งข้อมูล: ${link||'-'}`,'',details||'');
  return {subject:`[ไปพักกันไหม] ${fix?'แจ้งข้อมูลผิด':'แนะนำสถานที่'}: ${name||''}`.trim(),body:lines.join('\n')};
}
