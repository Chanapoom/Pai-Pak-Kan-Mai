// All venue dates and times are evaluated in Thailand, including on devices in other zones.
import {t,locale} from './i18n.js';
const DAY=1440;
export function bangkokDateParts(date=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
  const key=`${p.year}-${p.month}-${p.day}`;
  return {key,minute:Number(p.hour)*60+Number(p.minute),weekday:new Date(`${key}T00:00:00Z`).getUTCDay()};
}
export const bangkokMinutes=(date=new Date())=>bangkokDateParts(date).minute;
export function localVisitDate(value) {
  if(!value)return new Date();
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return null;
  const result=new Date(`${value}:00+07:00`);
  return Number.isNaN(result.valueOf())||bangkokDateParts(result).key!==value.slice(0,10)?null:result;
}
const time=(value,end=false)=>{
  if(end&&value==='24:00')return DAY;
  if(!/^\d{2}:\d{2}$/.test(value||''))return NaN;
  const [h,m]=value.split(':').map(Number);
  return h<24&&m<60?h*60+m:NaN;
};
const dateAt=(key,offset)=>new Date(new Date(`${key}T00:00:00Z`).valueOf()+offset*86400000);
const keyAt=(key,offset)=>dateAt(key,offset).toISOString().slice(0,10);
function intervalsFor(place,key,weekday) {
  const schedule=place.schedule;
  if(schedule&&(schedule.validFrom&&key<schedule.validFrom||schedule.validThrough&&key>schedule.validThrough))return null;
  let raw;
  if(schedule)raw=Object.hasOwn(schedule.overrides||{},key)?schedule.overrides[key]:schedule.week?.[weekday];
  else raw=place.open&&place.close?[[place.open,place.close]]:null;
  if(!Array.isArray(raw))return null;
  const intervals=[];
  for(const pair of raw){
    if(!Array.isArray(pair)||pair.length!==2)return null;
    const start=time(pair[0]),end=time(pair[1],true);
    if(!Number.isFinite(start)||!Number.isFinite(end)||start===end)return null;
    intervals.push([start,end>start?end:end+DAY]);
  }
  return intervals;
}
export function activeClosure(place,date=new Date()) {
  const {key}=bangkokDateParts(date);
  return place.closures?.find(c=>c.from<=key&&key<=c.through)||null;
}
// Unknown days never become open or acquire an invented reopening time.
// An explicit override takes precedence over an overnight session from the day before.
export function hoursInfo(place,date=new Date()) {
  const closure=activeClosure(place,date);
  if(closure)return {status:'closed',closure:closure.label};
  const {key,minute}=bangkokDateParts(date);
  const days=Array.from({length:10},(_,i)=>{
    const offset=i-1,k=keyAt(key,offset);
    return {offset,key:k,intervals:intervalsFor(place,k,dateAt(key,offset).getUTCDay())};
  });
  if(days[1].intervals===null)return {status:'unknown'};
  const windows=[];
  for(const day of days){
    if(day.offset>0&&day.intervals===null)break;
    for(const [s,e] of day.intervals||[]){
      if(day.offset===-1&&Object.hasOwn(place.schedule?.overrides||{},key))continue;
      let end=e+day.offset*DAY;
      const next=keyAt(day.key,1);
      if(e>DAY&&(Object.hasOwn(place.schedule?.overrides||{},next)||place.closures?.some(c=>c.from<=next&&next<=c.through)))end=(day.offset+1)*DAY;
      if(place.closures?.some(c=>c.from<=day.key&&day.key<=c.through))continue;
      windows.push([s+day.offset*DAY,end]);
    }
  }
  windows.sort((a,b)=>a[0]-b[0]);
  const merged=[];
  for(const window of windows){
    const previous=merged.at(-1);
    if(previous&&window[0]<=previous[1])previous[1]=Math.max(previous[1],window[1]);
    else merged.push([...window]);
  }
  const current=merged.find(([s,e])=>s<=minute&&minute<e);
  if(current)return {status:'open',minutesLeft:current[1]-minute};
  const next=merged.find(([s])=>s>minute);
  return next?{status:'closed',minutesToOpen:next[0]-minute}:{status:'closed'};
}
export const openingStatus=(place,date=new Date())=>hoursInfo(place,date).status;
export function boundaryLabel(minutes,date=new Date()) {
  const target=new Date(date.valueOf()+minutes*60000),today=bangkokDateParts(date),then=bangkokDateParts(target);
  const clock=t('{time} น.',{time:`${String(Math.floor(then.minute/60)).padStart(2,'0')}:${String(then.minute%60).padStart(2,'0')}`});
  if(then.key===today.key)return clock;
  if(then.key===keyAt(today.key,1))return t('พรุ่งนี้ {clock}',{clock});
  return `${target.toLocaleDateString(locale(),{timeZone:'Asia/Bangkok',day:'numeric',month:'short'})} ${clock}`;
}
export const WEEKDAYS=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
export function weeklyRows(place) {
  if(!place.schedule?.week)return [];
  return [1,2,3,4,5,6,0].map(day=>{
    const raw=place.schedule.week[day],valid=intervalsFor({...place,schedule:{week:place.schedule.week}},'2000-01-01',day);
    return {day:t(WEEKDAYS[day]),text:valid===null?t('ยังไม่ยืนยัน'):raw.length?raw.map(([s,e])=>`${s}–${e}`).join(' / '):t('ปิด')};
  });
}
