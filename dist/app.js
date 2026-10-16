import { escapeHtml as esc,filterPlaces,recommend,whyGo,distanceKm,directionsUrl,INTENTS,contactConfig,suggestionMessage,daypart,clockText,DAYPART_FIT,pickPool,FACILITY_FILTERS,SPORT_FACILITIES,sportFacilities,facilityStatus,validPoint,PROVINCE_KEYS } from './core.js';
import {localVisitDate,weeklyRows,activeClosure} from './hours.js';
import {t,getLang,setLangValue,locale,placesCount,trProvince,trDistrict,trLine} from './i18n.js';
import {startBuddy,buddyReact,syncBuddyLanguage} from './buddy.js';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const icons={
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 pin:'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 locate:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
 tree:'<path d="m12 2-6 7h3l-5 6h5l-4 4h14l-4-4h5l-5-6h3L12 2Zm0 17v3"/>',
 gym:'<path d="M3 9v6M6.5 6v12M17.5 6v12M21 9v6M6.5 12h11"/>',
 activity:'<path d="M2 12h5l3-8 4 16 3-8h5"/>',
 heart:'<path d="M20.5 4.7a5.5 5.5 0 0 0-8 .2l-.5.5-.5-.5a5.5 5.5 0 0 0-8 7.6L12 21l8.5-8.5a5.5 5.5 0 0 0 0-7.8Z"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
 map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
 bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
 train:'<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 10h14M9 3v7m6-7v7M8 18l-2 3m10-3 2 3M8 14h1m6 0h1"/>',
 bus:'<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 10h16M8 19v2m8-2v2M8 15h1m6 0h1"/>',
 walk:'<circle cx="14" cy="4" r="2"/><path d="m7 11 4-3 4 3h4M11 8l-2 8-4 5m5-9 5 5v5"/>',
 car:'<path d="m5 6-3 7v6h20v-6l-3-7H5Zm-3 7h20M5 19v2m14-2v2M6 16h1m10 0h1"/>',
 people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v4"/>',
 share:'<path d="M12 16V3m-5 5 5-5 5 5M5 13v8h14v-8"/>',
 leaf:'<path d="M20 3C8 1 2 7 5 16c8 5 16-2 15-13ZM3 21 16 8"/>',
 check:'<path d="m5 12 5 5 9-10"/>',
 shuffle:'<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
 sliders:'<path d="M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'
};
const icon=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[n]||icons.pin}</svg>`;
$$('[data-icon]').forEach(el=>el.outerHTML=icon(el.dataset.icon));

// Language switch. The Thai text written in index.html is collected once, before anything renders, and swapped as text;
// elements with data-en swap their whole markup (for text split by inner tags). Everything rendered by script uses t().
const staticText=[],staticAttrs=[],pageTitle=document.title;
(function collectStatic(){
  const thai=/[฀-๿]/;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>thai.test(n.nodeValue)&&!n.parentElement.closest('script,style,noscript,[data-en],[data-no-i18n]')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
  for(let n=walker.nextNode();n;n=walker.nextNode())staticText.push([n,n.nodeValue]);
  for(const el of $$('[placeholder],[aria-label],[title],[alt]'))if(!el.closest('[data-no-i18n]'))for(const a of ['placeholder','aria-label','title','alt']){const v=el.getAttribute(a);if(v&&thai.test(v))staticAttrs.push([el,a,v]);}
  for(const el of $$('[data-en]'))el.dataset.th=el.innerHTML;
})();
function applyStatic(){
  const swap=v=>v.replace(v.trim(),t(v.trim()));
  const english=getLang()==='en';
  for(const [node,th] of staticText)if(node.isConnected)node.nodeValue=english?swap(th):th;
  for(const [el,a,th] of staticAttrs)el.setAttribute(a,english?t(th):th);
  for(const el of $$('[data-en]'))el.innerHTML=english?el.dataset.en:el.dataset.th;
  document.title=t(pageTitle);document.documentElement.lang=getLang();
  $$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===getLang())));
}
function syncCheckedAt(){if(checkedAt)$('#checked-at').textContent=t('ตรวจข้อมูลบางส่วนล่าสุด {date} · ดูวันที่ของแต่ละแห่งในรายละเอียด',{date:checkedDate(checkedAt)});}
// Province choices come from the data: every province with at least one place, Bangkok first, with its count.
function renderProvinceOptions(){
  const keyOf=Object.fromEntries(Object.entries(PROVINCE_KEYS).map(([k,v])=>[v,k])),counts={};
  for(const p of places)counts[p.province]=(counts[p.province]||0)+1;
  const names=Object.keys(counts).sort((a,b)=>a==='กรุงเทพมหานคร'?-1:b==='กรุงเทพมหานคร'?1:a.localeCompare(b,'th'));
  $('#province').innerHTML=`<option value="all" data-label="${esc(t('ทุกพื้นที่'))}">${t('ทุกพื้นที่')}</option>`+names.map(n=>`<option value="${esc(keyOf[n]||n)}" data-label="${esc(trProvince(n))}">${esc(trProvince(n))} (${counts[n]})</option>`).join('');
  $('#province').value=state.province;
}
function setLang(value,{save=true}={}){
  setLangValue(value);
  if(save)try{localStorage.setItem('paipak:lang',getLang());}catch{}
  applyStatic();renderIntents();renderFacilityFilters();syncDaypart();syncCheckedAt();syncControls();
  if(places.length){renderProvinceOptions();renderSportFilters();render();showProvince();}
  syncBuddyLanguage();
  if(railStations){renderRailLegend(Object.values(railLineNames));railStations.eachLayer(m=>m.setTooltipContent(stationTip(m.options.station)));}
  if(userMarker&&searchPoint())drawOrigin(searchPoint());
  if(contact.enabled)$('#suggest-lead').textContent=t('ตอนนี้มี {n} แห่ง ยังไม่ครบทุกที่ ช่วยกันเติมได้ หรือบอกเราถ้าข้อมูลไม่ตรงกับที่เห็นหน้างาน',{n:places.length});
  requestAnimationFrame(()=>{$$('.chip-rail').forEach(syncChipRail);revealIntent();});
}

const state={query:'',province:'all',intent:'all',freeOnly:false,openOnly:false,sort:'recommended',saved:new Set(),location:null,searchOrigin:null,radiusKm:0,bounds:null,facilities:[],feeFilter:'all',photoOnly:false,visitAt:''};
let places=[],map,markers=new Map(),userMarker,selectedId=null,focusId=null,returnFocus=null,returnId=null,toastTimer,travelMode='transit',originText='',pickIndex=0,pickKey='',firstRender=true,skipFocusRestore=false,contact={enabled:false},suggestKind='new',suggestPlace=null;
let stations=[],nearChoices=[],pickingPoint=false,detailHistoryEntry=false,suppressDetailHistory=false,checkedAt='';
const visitDate=()=>localVisitDate(state.visitAt)||new Date();
const searchPoint=()=>state.searchOrigin||state.location;
const reasons=p=>whyGo(p,{location:searchPoint(),date:visitDate(),planned:Boolean(state.visitAt)});
const checkedDate=value=>value?new Date(`${value}T12:00:00+07:00`).toLocaleDateString(locale(),{timeZone:'Asia/Bangkok',day:'numeric',month:'short',year:'numeric'}):t('ยังไม่ระบุ');
// English view: names come from OpenStreetMap's name:en where it exists; anything only written in Thai keeps lang="th".
const en=()=>getLang()==='en';
const thLang=()=>en()?' lang="th"':'';
let stationEn={};
const placeName=p=>en()&&p.nameEn?p.nameEn:p.name;
// A place shows only names its sources give: English when there is one, otherwise the Thai name (and the reverse).
const THAI_RE=/[฀-๿]/;
const nameLang=p=>{const n=placeName(p);return en()?(THAI_RE.test(n)?' lang="th"':''):(THAI_RE.test(n)?'':' lang="en"');};
// the place's name in the other language, under the main one, when its sources give both
const otherName=p=>{const other=en()?p.name:p.nameEn;if(!other||other===placeName(p))return '';return `<p class="detail-thname"><span lang="${THAI_RE.test(other)?'th':'en'}">${esc(other)}</span></p>`;};
// a place may name two stations at once ("สีลม / ลุมพินี"); each part is looked up on its own
const stationName=th=>en()?th.split(' / ').map(part=>stationEn[part]||part).join(' / '):th;
// search points keep a Thai label as their identity; these turn it into what the current language shows
function pointName(point){
  if(!point)return t('จุดที่เลือก');
  if(['ตำแหน่งของฉัน','จุดที่เลือกบนแผนที่'].includes(point.label))return t(point.label);
  if(point.kind==='station')return t('สถานี{name}',{name:stationName(point.label.replace(/^สถานี/,''))});
  return point.label||t('จุดที่เลือก');
}
function pointShort(point){
  if(point.label==='ตำแหน่งของฉัน')return t('ใกล้ฉัน');
  if(point.label==='จุดที่เลือกบนแผนที่')return t('จุดบนแผนที่');
  if(point.kind==='station')return stationName(point.label.replace(/^สถานี/,''));
  return point.label||t('จุดที่เลือก');
}
try { const stored=JSON.parse(localStorage.getItem('paipak:saved')||'[]');if(Array.isArray(stored))state.saved=new Set(stored.filter(x=>typeof x==='string')); }catch{}

function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function toggleSave(id){
  state.saved.has(id)?state.saved.delete(id):state.saved.add(id);
  try{localStorage.setItem('paipak:saved',JSON.stringify([...state.saved]));toast(t(state.saved.has(id)?'บันทึกไว้ในเครื่องนี้แล้ว':'นำออกจากที่บันทึกไว้แล้ว'));}
  catch{toast(t('เบราว์เซอร์ไม่อนุญาตให้บันทึกถาวร รายการนี้จะอยู่จนกว่าจะปิดหน้า'));}
  render();
  if(state.saved.has(id))buddyReact('saved');
  if(selectedId===id){const button=$('#detail-save');if(button){button.innerHTML=icon('bookmark')+t(state.saved.has(id)?'บันทึกแล้ว':'บันทึก');button.setAttribute('aria-pressed',String(state.saved.has(id)));}}
}

// Every pin uses a colour icon in one style (dist/icons): park and gym from the site owner, exercise drawn to match them.
const PIN_IMAGES={park:'icons/park.png',exercise:'icons/exercise.svg',gym:'icons/gym.png'};
const glyph=p=>`<img class="pin-img" src="${PIN_IMAGES[pinKind(p)]}" alt="" width="26" height="26" draggable="false">`;
const pinKind=p=>p.type==='gym'?'gym':p.type==='exercise'?'exercise':'park';
const typeName=p=>t(p.type==='gym'?'ยิม & ฟิตเนส':p.type==='forest'?'สวนป่าในเมือง':p.type==='nature'?'อุทยาน / วนอุทยาน':p.type==='exercise'?(p.id.startsWith('bma-')?'ศูนย์กีฬา กทม.':'ศูนย์กีฬา / สนาม'):'สวนสาธารณะ');
const areaName=p=>`${trDistrict(p.district)} · ${en()?trProvince(p.province):p.province==='กรุงเทพมหานคร'?'กรุงเทพฯ':p.province}`;
// Show only verified place photography. Never replace a missing or failed photo with synthetic venue art.
const noPhoto=p=>`<div class="photo-missing" role="img" aria-label="${esc(t('ยังไม่มีภาพถ่ายจริงของ{name}',{name:placeName(p)}))}"><span>${t('รอภาพถ่ายจริงที่ตรวจสอบได้')}</span></div>`;
function media(p,size='thumb'){
  if(!p.photo)return noPhoto(p);
  const src=size==='thumb'?p.photo.thumb:p.photo.src;
  return `<img class="photo" src="${esc(src)}" alt="${size==='thumb'?'':esc(p.photo.alt)}" data-place="${esc(p.id)}" loading="${size==='thumb'?'lazy':'eager'}" decoding="async" width="${size==='thumb'?500:960}" height="${size==='thumb'?333:640}">`;
}
document.addEventListener('error',e=>{const img=e.target;if(img?.matches?.('img.photo')){const p=places.find(x=>x.id===img.dataset.place);if(p){const box=document.createElement('div');box.className='photo-missing';box.setAttribute('aria-label',t('โหลดภาพถ่ายของ{name}ไม่สำเร็จ',{name:placeName(p)}));box.textContent=t('โหลดภาพไม่สำเร็จ');if(p.photo?.page){const link=document.createElement('a');link.href=p.photo.page;link.target='_blank';link.rel='noopener';link.textContent=t('ดูภาพที่แหล่งต้นฉบับ');box.append(link);}img.replaceWith(box);}}},true);
const creditHtml=p=>p.photo?`${t('ภาพ:')} ${esc(p.photo.author)} · <a href="${esc(p.photo.licenseUrl)}" target="_blank" rel="noopener">${esc(p.photo.license)}</a> · <a href="${esc(p.photo.page)}" target="_blank" rel="noopener">Wikimedia Commons</a>`:'';

// The map follows Bangkok time: tile tint and the clock chip change with the time of day.
// the mascot's pose for each part of the day: a morning run, a daytime stroll, an evening wave, sleepy at night
const MASCOT_POSE={morning:'run',day:'walk',evening:'wave',night:'sleepy'};
function syncDaypart(){
  const part=daypart();
  $('#map').dataset.daypart=part.id;
  const pose=MASCOT_POSE[part.id]||'wave',hero=$('#hero-mascot');
  if(hero&&!hero.src.endsWith(`/${pose}.webp`))hero.src=`./mascot/${pose}.webp`;
  const chip=$('#daypart');chip.dataset.daypart=part.id;chip.textContent=`${clockText()} · ${t(part.label)}`;
}
// Tick on the minute boundary so the clock never shows a stale minute for long.
function tick(){
  syncDaypart();
  if(places.length&&document.visibilityState==='visible')render();
  setTimeout(tick,60000-Date.now()%60000+50);
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncDaypart();});
function initMap(){
  if(!window.L){$('#map-error').hidden=false;return;}
  map=L.map('map',{zoomControl:false,scrollWheelZoom:true,wheelPxPerZoomLevel:120,minZoom:4,maxZoom:18}).setView([13.77,100.55],11);
  L.control.zoom({position:'bottomright'}).addTo(map);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
  let errors=0,loaded=0;
  tiles.on('tileerror',()=>{errors++;if(!loaded&&errors>=4)$('#map-error').hidden=false;});
  tiles.on('tileload',()=>{loaded++;$('#map-error').hidden=true;});
  new ResizeObserver(()=>map.invalidateSize()).observe($('#map'));
  const syncLabels=()=>$('#map').classList.toggle('labels-on',map.getZoom()>=14);
  map.on('zoomend',syncLabels);syncLabels();
  map.on('click',()=>{if(!pickingPoint&&focusId){focusId=null;render();}});
  loadRail();loadProvinces();
}
// Red dashed outline around the chosen province (dist/provinces.json); "ทุกพื้นที่" clears it.
let provinceShapes=null,provinceLayer=null;
async function loadProvinces(){
  try{
    const response=await fetch('./provinces.json');if(!response.ok)throw Error('provinces');
    provinceShapes=(await response.json()).provinces;
    map.createPane('province').style.zIndex=340;
    showProvince();
  }catch{provinceShapes=null;}
}
function showProvince(fit=false){
  if(!map)return false;
  provinceLayer?.remove();provinceLayer=null;
  const shape=provinceShapes?.[state.province];
  const legend=$('#legend-province');legend.hidden=!shape;
  if(!shape)return false;
  legend.querySelector('span').textContent=t('ขอบเขต{name}',{name:en()?trProvince(shape.name):shape.name==='กรุงเทพมหานคร'?'กรุงเทพฯ':shape.name});
  const line={pane:'province',fill:false,interactive:false};
  provinceLayer=L.layerGroup([
    // kept quiet on purpose: a thin, half-opaque dashed line that marks the area without competing with pins and rail lines
    L.polygon(shape.rings,{pane:'province',stroke:false,fillColor:'#b8443a',fillOpacity:.025,interactive:false}),
    L.polygon(shape.rings,{...line,color:'#b8443a',weight:2.5,opacity:.7,dashArray:'6 6',lineCap:'round',className:'province-line'})
  ]).addTo(map);
  if(fit)map.fitBounds(provinceLayer.getLayers()[0].getBounds(),{padding:[30,30]});
  return true;
}
// BTS / MRT / ARL lines and stations from dist/rail.json. Lines always show; station dots appear from zoom 12 so the city view stays readable.
let railOn=true,railLines=null,railStations=null;
async function loadRail(){
  try{
    const response=await fetch('./rail.json');if(!response.ok)throw Error('rail');
    const rail=await response.json();
    stations=rail.stations;
    stationEn=Object.fromEntries(rail.stations.filter(s=>s.nameEn).map(s=>[s.name,s.nameEn]));
    map.createPane('rail').style.zIndex=350;
    const byId=Object.fromEntries(rail.lines.map(l=>[l.id,l]));
    railLineNames=byId;
    railLines=L.layerGroup([
      ...rail.lines.map(l=>L.polyline(l.segments,{pane:'rail',color:'#fffdf8',weight:8,opacity:.9,interactive:false})),
      ...rail.lines.map(l=>L.polyline(l.segments,{pane:'rail',color:l.color,weight:4.5,interactive:false}))
    ]);
    railStations=L.layerGroup(rail.stations.map(s=>L.circleMarker([s.lat,s.lng],{pane:'rail',station:s,radius:s.lines.length>1?6.5:4.5,color:s.lines.length>1?'#13271a':byId[s.lines[0]].color,weight:3,fillColor:'#fffdf8',fillOpacity:1}).bindTooltip(stationTip(s),{direction:'top',offset:[0,-4]})));
    renderRailLegend(rail.lines);
    // the legend starts folded so it does not cover the map; station dots name their lines on hover or tap
    $('#rail-toggle').hidden=false;
    map.on('zoomend',syncRail);syncRail();
  }catch{$('#rail-toggle').hidden=true;$('#rail-legend').hidden=true;}
}
let railLineNames={};
const stationTip=s=>`<strong${stationEn[s.name]&&en()?'':thLang()}>${esc(stationName(s.name))}</strong><br>${s.lines.map(id=>esc(trLine(railLineNames[id]?.name||''))).join(' · ')}`;
function renderRailLegend(lines){$('#rail-legend-list').innerHTML=lines.map(l=>`<li><i style="background:${esc(l.color)}"></i>${esc(trLine(l.name))}</li>`).join('');}
function syncRail(){
  if(!railLines)return;
  $('#rail-legend').hidden=!railOn;
  if(!railOn){railLines.remove();railStations.remove();return;}
  railLines.addTo(map);
  if(map.getZoom()>=11)railStations.addTo(map);else railStations.remove();
}
// Shape and colour both encode the kind (circle park, diamond exercise spot, square gym); the name label shows from zoom 14.
function pinIcon(p){return L.divIcon({className:'pin-wrap',html:`<div class="pin pin-${pinKind(p)} ${selectedId===p.id||focusId===p.id?'is-selected':''}"><span class="pin-shape">${glyph(p)}</span><span class="pin-label"${nameLang(p)}>${esc(placeName(p))}</span></div>`,iconSize:[40,40],iconAnchor:[20,20],tooltipAnchor:[0,-24]});}
// Nearby pins merge into a numbered bubble until zoom 14 (vendor/markercluster), so a nationwide map stays readable and fast.
let pinLayer=null;
const clusterIcon=c=>{const n=c.getChildCount();return L.divIcon({className:'cluster-wrap',html:`<div class="pin-cluster${n>=100?' is-big':n>=20?' is-mid':''}"><span>${n}</span><span class="sr">${t('สถานที่ กดเพื่อซูมเข้า')}</span></div>`,iconSize:[46,46],iconAnchor:[23,23]});};
function renderMarkers(list){
  if(!map)return;
  if(!pinLayer){pinLayer=L.markerClusterGroup?L.markerClusterGroup({chunkedLoading:true,maxClusterRadius:48,disableClusteringAtZoom:14,showCoverageOnHover:false,spiderfyOnMaxZoom:false,iconCreateFunction:clusterIcon}):L.layerGroup();pinLayer.addTo(map);}
  pinLayer.clearLayers();markers.clear();
  const layers=list.map(p=>{const marker=L.marker([p.lat,p.lng],{icon:pinIcon(p),title:placeName(p),alt:placeName(p),keyboard:true,zIndexOffset:selectedId===p.id?1000:0}).bindTooltip(esc(placeName(p)),{direction:'top',className:'pin-tip'}).on('click',()=>showDetail(p.id));markers.set(p.id,marker);return marker;});
  if(pinLayer.addLayers)pinLayer.addLayers(layers);else layers.forEach(m=>pinLayer.addLayer(m));
}

// The same "what do you want to do" row sits in both tabs; "อะไรก็ได้" (not "ทั้งหมด") so it never reads like the list tab.
// intents get their own English (a verb: "Run"), separate from the same Thai word as an activity ("Running")
const INTENT_EN={all:'Anything',walk:'Walk',run:'Run',bike:'Cycle',mind:'Yoga & aerobics',gym:'Gym & machines',kids:'With kids'};
function renderIntents(){
  const html=[{id:'all',label:'อะไรก็ได้'},...INTENTS].map(i=>`<button type="button" class="intent" data-intent="${i.id}" aria-pressed="${state.intent===i.id}">${esc(en()?INTENT_EN[i.id]:i.label)}</button>`).join('');
  $$('[data-intents]').forEach(row=>row.innerHTML=html);
}
// Keep the chosen chip inside its scrolling row.
function revealIntent(){
  for(const row of $$('[data-intents]')){
    const chip=row.querySelector('[aria-pressed=true]');if(!chip||!row.clientWidth)continue;
    if(chip.offsetLeft<row.scrollLeft)row.scrollLeft=chip.offsetLeft-24;
    else if(chip.offsetLeft+chip.offsetWidth>row.scrollLeft+row.clientWidth)row.scrollLeft=chip.offsetLeft+chip.offsetWidth-row.clientWidth+24;
  }
}
// Horizontal chip rows: fade the edge that has more chips, and give mouse users arrow buttons (touch users swipe).
function syncChipRail(rail){
  const row=rail.querySelector('.chip-scroll');if(!row)return;
  rail.classList.toggle('can-left',row.scrollLeft>1);
  rail.classList.toggle('can-right',row.scrollLeft<row.scrollWidth-row.clientWidth-1);
}
function initChipRails(){
  for(const rail of $$('.chip-rail')){
    if(rail.dataset.ready)continue;rail.dataset.ready='1';
    const row=rail.querySelector('.chip-scroll');
    rail.insertAdjacentHTML('beforeend','<button type="button" class="rail-arrow prev" tabindex="-1" aria-hidden="true">‹</button><button type="button" class="rail-arrow next" tabindex="-1" aria-hidden="true">›</button>');
    rail.querySelector('.prev').onclick=()=>row.scrollBy({left:-row.clientWidth*.7,behavior:'smooth'});
    rail.querySelector('.next').onclick=()=>row.scrollBy({left:row.clientWidth*.7,behavior:'smooth'});
    row.addEventListener('scroll',()=>syncChipRail(rail),{passive:true});
    new ResizeObserver(()=>syncChipRail(rail)).observe(row);
    syncChipRail(rail);
  }
}
const PROVINCE_SHORT={'กรุงเทพมหานคร':'กรุงเทพฯ','พระนครศรีอยุธยา':'อยุธยา','Phra Nakhon Si Ayutthaya':'Ayutthaya'},ANYWHERE='ทุกที่';
function locationLabel(){
  if(state.bounds)return t('บริเวณแผนที่');
  const point=searchPoint();
  // short forms so the name survives on a phone-width button; the picker shows the full wording
  if(point)return `${pointShort(point)} · ${state.radiusKm?t('{km} กม.',{km:state.radiusKm}):t('ทุกระยะ')}`;
  if(state.province!=='all'){const name=$('#province').selectedOptions[0]?.dataset.label||'';return PROVINCE_SHORT[name]||name;}
  return t(ANYWHERE);
}
// Filters in use, as chips that remove themselves. The pick tab also lists the quick toggles, since it has no toggle row.
function activeFilters(withQuick){
  const chips=[];
  if(withQuick&&state.openOnly)chips.push({key:'open',label:t(state.visitAt?'เปิดตามเวลาที่เลือก':'เปิดอยู่')});
  if(withQuick&&state.feeFilter==='free')chips.push({key:'fee',label:t('เข้าฟรี')});
  for(const id of state.facilities){const f=FACILITY_FILTERS.find(x=>x.id===id);if(f)chips.push({key:`facility:${id}`,label:t(f.label)});}
  if(state.feeFilter==='paid')chips.push({key:'fee',label:t('มีค่าใช้จ่าย / สมาชิก')});
  if(state.feeFilter==='unknown')chips.push({key:'fee',label:t('ยังไม่ยืนยันค่าเข้า')});
  if(state.photoOnly)chips.push({key:'photo',label:t('มีภาพถ่ายจริง')});
  if(state.visitAt)chips.push({key:'visit',label:t('ไป {when}',{when:visitWhen({weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})})});
  return chips;
}
// a planned visit, written the local way: Thai adds "น." after the time
const visitWhen=format=>`${visitDate().toLocaleString(locale(),{timeZone:'Asia/Bangkok',...format})}${en()?'':' น.'}`;
function renderActiveFilters(){
  for(const box of $$('[data-active]')){
    const chips=activeFilters(box.dataset.active==='pick');
    box.hidden=!chips.length;
    box.innerHTML=chips.length?`<span class="sr">${t('ตัวกรองที่ใช้อยู่')}</span>${chips.map(c=>`<button type="button" class="active-chip" data-remove="${esc(c.key)}" aria-label="${esc(t('เอาตัวกรอง {label} ออก',{label:c.label}))}">${esc(c.label)}<span aria-hidden="true">×</span></button>`).join('')}<button type="button" class="text-button clear-chips" data-clear-filters>${t('ล้างตัวกรอง')}</button>`:'';
  }
}
function removeFilter(key){
  if(key==='open')state.openOnly=false;
  else if(key==='fee'){state.feeFilter='all';state.freeOnly=false;}
  else if(key==='photo')state.photoOnly=false;
  else if(key==='visit')state.visitAt='';
  else if(key.startsWith('facility:'))state.facilities=state.facilities.filter(id=>id!==key.slice(9));
  syncControls();render();
}
function clearFilters(){
  Object.assign(state,{facilities:[],feeFilter:'all',freeOnly:false,photoOnly:false,visitAt:'',openOnly:false});
  syncControls();render();
}
// Form controls follow state, so chips, the sheet and the quick toggles never disagree. The search box is left alone while typing.
function syncControls(){
  $('#province').value=state.province;$('#sort').value=state.sort;
  $('#free-only').checked=state.feeFilter==='free';$('#open-only').checked=state.openOnly;
  $$('#radius input').forEach(i=>i.checked=Number(i.value)===Number(state.radiusKm));
  $$('#fee-filter input').forEach(i=>i.checked=i.value===state.feeFilter);
  $('#photo-only').checked=state.photoOnly;$('#visit-at').value=state.visitAt;
  $$('#facility-filter-list input').forEach(i=>i.checked=state.facilities.includes(i.value));
}
// Two tabs share one scroll area; each keeps its own scroll position.
let activeTab='pick';const tabScroll={pick:0,list:0};
const desktop=()=>matchMedia('(min-width:900px)').matches;
const scrollBox=()=>desktop()?$('#panel-scroll'):document.scrollingElement;
function setTab(tab,{focus=false}={}){
  if(tab!==activeTab){
    tabScroll[activeTab]=scrollBox().scrollTop;activeTab=tab;
    for(const t of $$('[role=tab]')){const on=t.id===`tab-${tab}`;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;}
    $('#panel-pick').hidden=tab!=='pick';$('#results').hidden=tab!=='list';
    scrollBox().scrollTop=tabScroll[tab];
    requestAnimationFrame(()=>{$$('.chip-rail').forEach(syncChipRail);revealIntent();});
  }
  if(focus)$(`#tab-${tab}`).focus();
}
const factsHtml=w=>`<li class="fact status-${w.hours.status}"><i class="mark" aria-hidden="true"></i>${esc(w.hours.text)}</li><li class="fact fee-${w.fee.kind}">${esc(w.fee.text)}</li>${w.rail?`<li class="fact">${esc(w.rail.text)}</li>`:''}${w.distance?`<li class="fact">${esc(t('{d} เส้นตรง',{d:w.distance.text}))}</li>`:''}`;
const activityList=(w,n)=>w.activities.slice(0,n).map(a=>t(a)).join(' · ');
function renderPick(){
  const key=JSON.stringify([state.intent,state.province,state.freeOnly,state.openOnly,state.query,searchPoint(),state.radiusKm,state.bounds,state.facilities,state.feeFilter,state.photoOnly,state.visitAt,daypart(visitDate()).id]);
  if(key!==pickKey){pickKey=key;pickIndex=0;}
  const ranked=places.length?recommend(places,state,visitDate()):[];
  const pool=pickPool(ranked);
  if(!places.length){$('#pick').innerHTML=`<div class="pick-empty"><p>${t('กำลังเลือกที่เหมาะกับตอนนี้…')}</p></div>`;return;}
  if(!ranked.length){$('#pick').innerHTML=`<div class="pick-empty"><p class="pick-label">${t('ตอนนี้แนะนำ')}</p><p><strong>${t('ยังไม่มีที่ตรงกับตัวเลือกนี้')}</strong></p><p>${t('ลองเปลี่ยนความต้องการ หรือปลดตัวกรอง')}</p><button type="button" class="btn btn-ghost" data-reset>${t('ล้างตัวกรอง')}</button></div>`;return;}
  pickIndex%=pool.items.length;
  const {place:p}=pool.items[pickIndex], w=reasons(p), part=t(w.part.label);
  $('#pick').setAttribute('aria-label',t(state.visitAt?'สถานที่ที่แนะนำตามเวลาที่เลือก':'สถานที่ที่แนะนำตอนนี้'));
  const tape=w.hours.status==='open'?`${t('แนะนำ{part}',{part})}${state.visitAt?t(' · ตามเวลาที่เลือก'):''}`:w.hours.status==='closed'?t('แนะนำ · {x}',{x:t(state.visitAt?'ปิดตามเวลาที่เลือก':'ตอนนี้ปิดอยู่')}):t('แนะนำ · เช็กเวลาก่อนไป');
  $('#pick').innerHTML=`<div class="pick-media"><span class="pick-tape">${esc(tape)}</span>${media(p,'hero')}</div>${p.photo?`<p class="credit">${creditHtml(p)}</p>`:''}
  <div class="pick-body"><p class="pick-mood">${esc(t(w.hours.status==='closed'?'สถานที่ในตัวเลือกนี้ปิดอยู่ตามตาราง ตรวจวันเปิดก่อนไป':DAYPART_FIT[w.part.id].mood))}</p><h2 class="pick-name"${nameLang(p)}><button type="button" data-open="${esc(p.id)}">${esc(placeName(p))}</button></h2><p class="pick-where">${esc(areaName(p))} · ${esc(typeName(p))}</p>
  <ul class="facts">${factsHtml(w)}</ul>
  <p class="pick-do">${w.suits?`<strong>${esc(w.suits.text)}</strong>`:esc(activityList(w,4))}</p>
  <div class="pick-actions"><button type="button" class="btn btn-primary" data-open="${esc(p.id)}">${t('ดูรายละเอียด')} ${icon('arrow')}</button>${pool.items.length>1?`<button type="button" class="btn btn-ghost" id="pick-next" aria-label="${esc(t('ขอที่อื่นที่เหมาะกับ{part} ({n} จาก {total})',{part,n:pickIndex+1,total:pool.items.length}))}">${icon('shuffle')}${t('ขอที่อื่น')} <span class="pick-count">${pickIndex+1}/${pool.items.length}</span></button>`:''}</div></div>`;
}
// Courts and tracks a place is confirmed to have; the ones the user filtered for come first.
function renderSportFilters(){
  const kinds=SPORT_FACILITIES.map(f=>({f,n:places.filter(p=>facilityStatus(p,f.id)===true).length})).filter(k=>k.n);
  $('#sport-filters').hidden=!kinds.length;
  $('#sport-filter-list').innerHTML=kinds.map(({f,n})=>`<button type="button" class="sport-chip" data-facility="${f.id}" aria-pressed="${state.facilities.includes(f.id)}">${esc(t(f.label))} <span>${n}</span></button>`).join('');
}
function renderFacilityFilters(){
  $('#facility-filter-list').innerHTML=FACILITY_FILTERS.filter(f=>f.group==='service').map(f=>`<label><input type="checkbox" value="${f.id}"${state.facilities.includes(f.id)?' checked':''}><span>${esc(t(f.label))}</span></label>`).join('');
}
function sportsLine(p){
  const has=sportFacilities(p).sort((a,b)=>Number(state.facilities.includes(b.id))-Number(state.facilities.includes(a.id)));
  if(!has.length)return '';
  return `<ul class="place-has" aria-label="${t('สนามและลู่')}">${has.slice(0,4).map(f=>`<li class="${state.facilities.includes(f.id)?'is-wanted':''}">${esc(t(f.label))}</li>`).join('')}${has.length>4?`<li>+${has.length-4}</li>`:''}</ul>`;
}
function placeRow(p,i){
  const w=reasons(p), saved=state.saved.has(p.id);
  const distance=w.distance?t('{d} เส้นตรง',{d:w.distance.text}):'';
  return `<article class="place ${selectedId===p.id?'is-selected':''} ${firstRender?'enter':''}" data-id="${esc(p.id)}" style="--i:${Math.min(i,8)}"><div class="place-thumb">${media(p,'thumb')}</div><div class="place-body"><h3 class="place-name"${nameLang(p)}><button type="button" data-open="${esc(p.id)}">${esc(placeName(p))}</button></h3><p class="place-where">${esc(areaName(p))}${distance?` · ${esc(distance)}`:''}</p><p class="place-why status-${w.hours.status}"><i class="mark" aria-hidden="true"></i>${esc(w.hours.text)}<span class="fee fee-${w.fee.kind}">${esc(w.fee.text)}</span></p><p class="place-do">${esc(activityList(w,3))}${w.rail?` · ${esc(w.rail.text)}`:''}</p>${sportsLine(p)}</div><button type="button" class="save ${saved?'is-saved':''}" data-save="${esc(p.id)}" aria-label="${esc(`${t(saved?'นำออกจากรายการบันทึก':'บันทึก')} ${placeName(p)}`)}" aria-pressed="${saved}">${icon('bookmark')}</button></article>`;
}
function visiblePlaces(){
  const list=state.sort==='recommended'?recommend(places,state,visitDate()).map(r=>r.place):filterPlaces(places,state,visitDate());
  // "Name A–Z" follows the names on screen, so the English view sorts by the English names
  if(state.sort==='name'&&en())list.sort((a,b)=>placeName(a).localeCompare(placeName(b),'en'));
  return list;
}
// The list shows a page of rows at a time; "แสดงเพิ่ม" adds the next page without re-rendering the rest.
const LIST_PAGE=60;let listShown=LIST_PAGE;
const moreButton=rest=>rest>0?`<button type="button" class="btn btn-ghost list-more" data-more>${t('แสดงเพิ่ม ({n} แห่งที่เหลือ)',{n:rest})}</button>`:'';
const listRows=list=>list.slice(0,listShown).map(placeRow).join('')+moreButton(list.length-listShown);
function showMoreRows(){
  const list=visiblePlaces(),from=listShown;listShown+=LIST_PAGE;
  $('#place-list [data-more]')?.remove();
  $('#place-list').insertAdjacentHTML('beforeend',list.slice(from,listShown).map(placeRow).join('')+moreButton(list.length-listShown));
  $('#place-list').children[from]?.querySelector('[data-open]')?.focus({preventScroll:true});
}
let wasEmpty=false;
function render(){
  const list=visiblePlaces();
  $('#view-count').textContent=list.length;
  // Say plainly when a province has only a handful of places, so a short list reads as "not added yet", not "nothing there".
  const provinceCount=state.province&&state.province!=='all'?places.filter(p=>filterPlaces([p],{province:state.province}).length).length:null;
  const thin=provinceCount!==null&&provinceCount<10;
  $('#coverage-note').hidden=!thin;
  if(thin)$('#coverage-note').textContent=t('{province}มีข้อมูล {n} แห่ง ยังไม่ครบทุกที่ในจังหวัด',{province:$('#province').selectedOptions[0]?.dataset.label||t('จังหวัดนี้'),n:provinceCount});
  $('#result-count').textContent=`${placesCount(list.length)}${state.sort==='distance'&&searchPoint()?t(' · เรียงตามระยะเส้นตรง'):''}${state.visitAt?t(' · ตามวันเวลาที่เลือก'):''}`;
  $('#tab-count').textContent=list.length;$('#filter-result-count').textContent=list.length;
  $$('[data-count]').forEach(el=>el.textContent=list.length);
  $('.see-all').hidden=!list.length;
  const where=locationLabel();
  $$('[data-where]').forEach(b=>{b.querySelector('.where-text').textContent=where;b.classList.toggle('is-set',where!==t(ANYWHERE));b.setAttribute('aria-label',t('ค้นหาแถวไหน: {where}',{where}));b.title=where;});
  renderActiveFilters();renderNearSuggest();
  syncDiscovery();
  $$('.intent').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.intent===state.intent)));
  $$('#sport-filter-list [data-facility]').forEach(b=>b.setAttribute('aria-pressed',String(state.facilities.includes(b.dataset.facility))));
  const scroller=$('#place-list'),keep=scroller.scrollTop;
  listShown=LIST_PAGE;
  // the mascot looks sad once when a search runs dry (not on every render while it stays empty)
  if(!list.length&&!wasEmpty&&!firstRender)buddyReact('empty');wasEmpty=!list.length;
  scroller.innerHTML=list.length?listRows(list):`<div class="empty-state"><img class="mascot" src="./mascot/curious.webp" alt="" width="120" height="120" aria-hidden="true"><strong>${t('ยังไม่พบสถานที่ที่ตรงกัน')}</strong><p>${t('ลองเปลี่ยนคำค้น พื้นที่ หรือตัวกรอง')}</p><button type="button" class="btn btn-ghost" data-reset>${t('ล้างตัวกรองทั้งหมด')}</button></div>`;
  scroller.scrollTop=keep;firstRender=false;
  renderPick();renderMarkers(list);
  if(selectedId&&$('#detail').open){const p=places.find(p=>p.id===selectedId);const facts=$('#detail .facts');if(p&&facts)facts.innerHTML=factsHtml(reasons(p));}
}
function fitMap(){if(!map)return;const list=visiblePlaces();if(!list.length)return toast(t('ไม่มีสถานที่ในผลค้นหาให้แสดง'));map.fitBounds(L.latLngBounds(list.map(p=>[p.lat,p.lng])),{padding:[55,55],maxZoom:14});}
function resetFilters(){
  Object.assign(state,{query:'',province:'all',intent:'all',freeOnly:false,openOnly:false,sort:searchPoint()?'distance':'recommended',radiusKm:0,bounds:null,facilities:[],feeFilter:'all',photoOnly:false,visitAt:''});
  $('#search').value='';syncControls();
  render();showProvince();fitMap();
}
function syncDiscovery(){
  const point=searchPoint();
  $('#search-map-area').setAttribute('aria-pressed',String(Boolean(state.bounds)));
  $('#where-now').hidden=!point&&!state.bounds&&state.province==='all';
  $('#radius-field').hidden=!point||Boolean(state.bounds);
  $('#nearby-summary').textContent=state.bounds?t('ตอนนี้: เฉพาะบริเวณแผนที่ที่เลือก'):point?t('ตอนนี้: รอบ{name} · {radius} (เส้นตรง)',{name:pointName(point),radius:state.radiusKm?t('รัศมี {r} กม.',{r:state.radiusKm}):t('ทุกระยะ')}):t('ตอนนี้: {where}',{where:locationLabel()});
  // the toggle is shorter than the status text so the quick row fits a phone in both languages
  $('#open-only-label').textContent=t(state.visitAt?'เปิดตอนนั้น':'เปิดอยู่ (ปุ่ม)').replace(' (ปุ่ม)','');
  // the badge counts what sits inside the sheet; "เข้าฟรี" has its own toggle outside
  const count=state.facilities.length+Number(['paid','unknown'].includes(state.feeFilter))+Number(state.photoOnly)+Number(Boolean(state.visitAt));
  $('#filter-count').textContent=count||'';
  $('#open-filters').setAttribute('aria-label',count?t('ตัวกรอง ใช้อยู่ {n} อย่าง',{n:count}):t('ตัวกรอง'));
  $('#visit-summary').textContent=state.visitAt?t('ดูตาราง ณ {when} ไม่ใช่การยืนยันหน้างาน',{when:visitWhen({dateStyle:'medium',timeStyle:'short'})}):t('สถานะเปิดอิงตารางที่เผยแพร่ ไม่ใช่การยืนยันหน้างาน');
}
function drawOrigin(point){
  if(!map)return;
  userMarker?.remove();
  userMarker=L.marker([point.lat,point.lng],{icon:L.divIcon({className:'you-wrap',html:`<div class="you"><i></i><span>${t('จุดค้นหา')}</span></div>`,iconSize:[18,18],iconAnchor:[9,9]}),title:pointName(point)||t('จุดเริ่มค้นหา'),zIndexOffset:500}).addTo(map);
}
function setSearchOrigin(point){
  if(!validPoint(point))return;
  state.searchOrigin=point;state.bounds=null;state.province='all';state.sort='distance';
  if(!state.radiusKm)state.radiusKm=5;
  syncControls();
  originText=`${point.lat},${point.lng}`;
  drawOrigin(point);showProvince();render();
  if(map)map.setView([point.lat,point.lng],13,{animate:false});
  if($('#origin')){$('#origin').value=originText;updateRoute();}
}
// Back to "ทุกพื้นที่": no point, no map area, no province.
function clearSearchArea(){
  state.searchOrigin=null;state.location=null;state.radiusKm=0;state.bounds=null;state.province='all';state.sort='recommended';originText='';
  userMarker?.remove();userMarker=null;syncControls();showProvince();render();fitMap();
}
// A province is its own way of saying "where", so it replaces any point or map area.
function setProvince(value){
  state.province=value;state.bounds=null;state.radiusKm=0;state.searchOrigin=null;state.location=null;originText='';
  userMarker?.remove();userMarker=null;
  if(state.sort==='distance')state.sort='recommended';
  syncControls();render();if(!showProvince(true))fitMap();
}
// The one search box filters by text; when the text names a rail station, offer that station as a centre point too.
function renderNearSuggest(){
  const q=state.query.trim().toLocaleLowerCase('th');
  // a station matches by its Thai name or, where OpenStreetMap has one, its English name
  nearChoices=q.length<2?[]:stations.filter(s=>validPoint(s)&&(s.name.toLocaleLowerCase('th').includes(q)||(s.nameEn||'').toLowerCase().includes(q))).slice(0,3)
    .map(s=>({id:`station-${s.name}`,label:`สถานี${s.name}`,detail:'สถานีรถไฟฟ้า',lat:s.lat,lng:s.lng,kind:'station'}));
  $('#near-suggest').hidden=!nearChoices.length;
  $('#near-suggest').innerHTML=nearChoices.length?`<span class="near-label">${t('ค้นหารอบ')}</span>${nearChoices.map((c,i)=>`<button type="button" class="near-chip" data-near="${i}">${icon('pin')}${esc(pointName(c))}</button>`).join('')}`:'';
}
let whereOpener=null;
function openArea(opener){
  whereOpener=opener instanceof Element?opener:document.activeElement;
  syncDiscovery();$('#pick-map-point').disabled=!map;
  $('#area-dialog').showModal();
  // focus the first choice, not the text box, so a phone keyboard does not cover the options
  ($('#where-now').hidden?$('#locate'):$('#radius-field').hidden?$('#clear-area'):$('#radius input:checked')||$('#clear-area')).focus();
}
const backToOpener=()=>{const target=whereOpener?.isConnected&&whereOpener.offsetParent?whereOpener:$('[role=tab][aria-selected=true]');target?.focus({preventScroll:true});};
let pointPreviousView='list';
function endPointPicking(){
  pickingPoint=false;$('#point-picker').hidden=true;$('#map-crosshair').hidden=true;$('.map-panel').classList.remove('is-picking');
}
function startPointPicking(){
  if(!map)return toast(t('แผนที่ยังไม่พร้อม เลือกจังหวัด หรือพิมพ์ชื่อสถานีในช่องค้นหาแทนได้'));
  pointPreviousView=$('.shell').dataset.view;$('#area-dialog').close();pickingPoint=true;
  setView('map');$('#point-picker').hidden=false;$('#map-crosshair').hidden=false;$('.map-panel').classList.add('is-picking');
  map.invalidateSize();$('#confirm-point').focus();
}
async function locate(){
  if(!navigator.geolocation){toast(t('เบราว์เซอร์นี้ไม่รองรับตำแหน่ง เลือกบนแผนที่ หรือพิมพ์ชื่อสถานีในช่องค้นหาแทนได้'));return;}
  if($('#locate').disabled)return;
  $('#locate').disabled=true;toast(t('กำลังหาตำแหน่ง กรุณาอนุญาตตำแหน่งในเบราว์เซอร์'));
  navigator.geolocation.getCurrentPosition(pos=>{
    state.location={lat:pos.coords.latitude,lng:pos.coords.longitude,label:'ตำแหน่งของฉัน'};
    setSearchOrigin(state.location);$('#locate').disabled=false;toast(t('ค้นหารอบตำแหน่งของคุณตามระยะเส้นตรงแล้ว'));
  },err=>{$('#locate').disabled=false;toast(t(err.code===1?'ไม่ได้รับอนุญาตตำแหน่ง กดปุ่ม “แถวไหน” แล้วเลือกบนแผนที่ หรือพิมพ์ชื่อสถานีในช่องค้นหาแทนได้':'หาตำแหน่งไม่สำเร็จ กดปุ่ม “แถวไหน” แล้วเลือกบนแผนที่ หรือพิมพ์ชื่อสถานีในช่องค้นหาแทนได้'));},{enableHighAccuracy:false,timeout:12000,maximumAge:120000});
}

const external=(url,label)=>`<a class="inline-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
const lineClass=line=>line.includes('ม่วง')?'purple':line.includes('ชมพู')?'pink':line.includes('เขียว')||line.includes('สุขุมวิท')?'green':'blue';
// Free Thai text from a source. The English view shows it as-is, marked lang="th", under an English summary where one can be derived.
const sourceText=text=>`<span${thLang()}>${esc(text)}</span>`;
const withSource=(summary,text,textEn)=>en()?(textEn?esc(textEn):`${esc(summary)}<small class="th-source" lang="th">${esc(text)}</small>`):esc(text);
// A place's own text in the current language: the English version written beside the Thai (`en` in places.json) when there is one,
// otherwise the Thai text marked lang="th". Returns [lang attribute, escaped text].
const placeText=(th,enText)=>en()&&enText?['',esc(enText)]:[thLang(),esc(th)];
function hoursSummary(p){
  if(p.schedule)return t('เวลาต่างกันแต่ละวัน ดูตารางรายวัน');
  if(p.open&&p.close)return p.open==='00:00'&&p.close==='24:00'?t('เปิด 24 ชั่วโมง'):t('ทุกวัน {from}–{to}',{from:p.open,to:p.close});
  return t('ยังไม่ยืนยันเวลาเปิด');
}
function scheduleHtml(p){
  const rows=weeklyRows(p),closure=activeClosure(p,visitDate());
  return `${closure?`<p class="notice closure-notice"${thLang()}>${esc(closure.label)}</p>`:''}<div class="info-row"><span>${t('เวลาเปิด')}</span><span>${withSource(hoursSummary(p),p.hours,p.en?.hours)}</span></div>${rows.length?`<details class="weekly-hours"><summary>${t('ดูตารางรายวัน')}</summary><dl>${rows.map(r=>`<div class="info-row"><dt>${r.day}</dt><dd>${esc(r.text)}</dd></div>`).join('')}</dl></details>`:''}${p.schedule?.holidayNote?`<p class="small"${placeText(p.schedule.holidayNote,p.en?.holidayNote).join('>')}</p><p class="small">${t('สถานะวันหยุดที่ยังไม่ยืนยันจะแสดง “เช็กเวลาก่อนไป” ปฏิทินอ้างอิงถึง {date}',{date:checkedDate(p.schedule.validThrough)})}</p>`:''}${(p.closures||[]).map(c=>`<p class="small">${sourceText(c.label)} · ${external(c.source,t('ประกาศเจ้าของสถานที่'))}</p>`).join('')}<p class="small">${t('สถานะอิงตารางตามเวลาประเทศไทย อาจมีการปิดพิเศษ กรุณาตรวจประกาศก่อนเดินทาง')}</p>`;
}
function sportsHtml(p){
  const rows=SPORT_FACILITIES.map(f=>({f,a:p.amenities?.[f.id],status:facilityStatus(p,f.id)})).filter(r=>r.status!==null);
  const known=rows.length?`<ul class="sport-list">${rows.map(({f,a,status})=>`<li class="${status?'yes':'no'}"><strong>${esc(t(f.label))}</strong><span>${t(status?'มี':'ไม่อนุญาต / ไม่มี')}${a?.detail?` · ${sourceText(a.detail)}`:''}</span>${a?.source?external(a.source,a.via==='osm'?'OpenStreetMap':t('แหล่งข้อมูล')):''}</li>`).join('')}</ul>`:`<p class="small">${t('ยังไม่มีข้อมูลสนามหรือลู่ของที่นี่')}</p>`;
  return known+`<p class="small">${t('รายการที่ไม่ได้แสดง ยังไม่มีข้อมูล ไม่ได้แปลว่าไม่มี ทางวิ่งอาจเป็นทางร่วมในสวน ไม่ใช่ลู่มาตรฐาน พื้นที่ปั่นอาจใช้ได้เฉพาะช่วงเวลา สนามและสระอาจต้องจอง เป็นสมาชิก หรือจ่ายแยก เวลาเปิดสถานที่ไม่ใช่เวลาของทุกสนามหรือสระ กรุณาตรวจเงื่อนไขจากแหล่งข้อมูลก่อนเดินทาง ข้อมูล OpenStreetMap เป็นข้อมูลจากอาสาสมัคร')}</p>`;
}
function amenitiesHtml(p){
  return `<dl class="amenity-status">${FACILITY_FILTERS.filter(f=>f.group==='service').map(f=>{const status=facilityStatus(p,f.id);return `<div class="info-row"><dt>${esc(t(f.label))}</dt><dd class="${status===true?'confirmed':'unconfirmed'}">${t(status===true?'มีข้อมูลยืนยัน':status===false?'ไม่มีตามข้อมูลที่ยืนยัน':'ยังไม่ยืนยัน')}${p.amenities?.[f.id]?.detail?`<small${thLang()}>${esc(p.amenities[f.id].detail)}</small>`:''}</dd></div>`;}).join('')}</dl><p class="small">${t('“ยังไม่ยืนยัน” ไม่ได้หมายความว่าไม่มี ข้อมูลการรองรับผู้พิการยังไม่ยืนยันว่าเส้นทางทั้งหมดเหมาะกับรถเข็น')}</p><div class="chips">${p.facilities.map(f=>`<span class="chip">${esc(t(f))}</span>`).join('')}</div>`;
}
function accessHtml(p){
  const access=p.access,station=p.stationAccessibility;
  return `<div class="access-note"><strong${access?.source?placeText(access.label,p.en?.access?.label).join('>'):`>${t('ยังไม่ยืนยันประตูเข้า')}`}</strong><p${access?.source?placeText(access.instruction,p.en?.access?.instruction).join('>'):'>'}${access?.source?'':t('หมุดเป็นบริเวณสถานที่โดยประมาณ ตรวจชื่อสถานที่และทางเข้าบนแผนที่ก่อนเดินทาง')}</p>${access?.source?external(access.source,t('ที่มาของจุดเข้า / ที่ตั้ง')):''}</div>${station?`<p class="small">${esc(t('สถานี{name}: ลิฟต์ทางออก {exits} · ข้อมูลเฉพาะสถานี ยังไม่ได้ยืนยันทางเดินต่อถึงสถานที่',{name:stationName(station.station),exits:station.elevatorExits.join(', ')}))} ${external(station.source,t('ตรวจแผนผังสถานี'))}</p>`:''}`;
}
function costsHtml(p){
  const feeSummary=t(p.free===true?'เข้าฟรี':p.free===false?'มีค่าใช้จ่าย':'ยังไม่ยืนยันค่าใช้จ่าย');
  return `<p class="small">${t('เว็บไซต์ใช้งานฟรี ค่าใช้จ่ายด้านล่างเป็นของสถานที่')}</p><div class="info-row"><span>${t(p.type==='gym'?'ค่าใช้บริการ / สมาชิก':'ค่าเข้า')}</span><span>${withSource(feeSummary,p.fee,p.en?.fee)}</span></div><div class="info-row"><span>${t('ค่าจอดรถ')}</span><span>${p.costs?.parking?sourceText(p.costs.parking):t('ยังไม่ยืนยัน')}</span></div><div class="info-row"><span>${t(p.type==='gym'?'เข้าใช้รายวัน':'เช่าอุปกรณ์ / กิจกรรม')}</span><span>${p.costs?.equipment?sourceText(p.costs.equipment):t('ตรวจสอบกับสถานที่')}</span></div>${p.free==null?`<p class="small">${t('ยังไม่ยืนยันว่าเข้าฟรีหรือมีค่าเข้า')}</p>`:''}`;
}
function detailHtml(p){
  const w=reasons(p);
  const sources=[...new Set(Object.values(p.sources).filter(Boolean))];
  return `<div class="detail-scroll" id="detail-scroll">
  <button type="button" class="icon-button popup-close" id="close-detail" aria-label="${t('ปิดรายละเอียด')}">×</button>
  <figure class="detail-media">${media(p,'hero')}${p.photo?`<figcaption class="credit">${creditHtml(p)}</figcaption>`:''}</figure>
  <div class="detail-head"><p class="detail-type">${esc(typeName(p))}</p><h2 id="detail-title" tabindex="-1"${nameLang(p)}>${esc(placeName(p))}</h2>${otherName(p)}<p class="detail-where">${icon('pin')} ${esc(trDistrict(p.district))} · ${esc(trProvince(p.province))}</p><ul class="facts">${factsHtml(w)}</ul></div>
  <div class="detail-cta"><a class="btn btn-primary" data-route-link target="_blank" rel="noopener">${t('พาไปเลย')} ${icon('arrow')}</a><button type="button" class="btn btn-ghost" id="detail-save" aria-pressed="${state.saved.has(p.id)}">${icon('bookmark')}${t(state.saved.has(p.id)?'บันทึกแล้ว':'บันทึก')}</button><button type="button" class="btn btn-ghost" id="share-place">${icon('share')}${t('คัดลอกลิงก์')}</button><button type="button" class="btn btn-ghost" id="show-on-map">${icon('pin')}${t('ดูบนแผนที่')}</button></div>
  ${en()&&!p.en?`<p class="lang-note">${t('ชื่อ คำอธิบาย และหมายเหตุของสถานที่มาจากแหล่งข้อมูลภาษาไทย จึงแสดงเป็นภาษาไทย')}</p>`:''}
  <section class="detail-section"><h3>${t('ไปทำอะไรได้')}</h3><p class="detail-desc"${placeText(p.description,p.en?.description).join('>')}</p><div class="chips">${p.activities.map(x=>`<span class="chip">${esc(t(x))}</span>`).join('')}</div></section>
  <section class="detail-section"><h3>${t('เวลาเปิด')}</h3>${scheduleHtml(p)}<div class="info-row"><span>${t('จำนวนคน')}</span><span>${t('ยังไม่มีข้อมูลสด')}</span></div>${p.note?`<p class="notice"${placeText(p.note,p.en?.note).join('>')}</p>`:''}<p>${p.sources.hours?external(p.sources.hours,t('ตรวจเวลากับเจ้าของข้อมูล')):external(p.source,t('ดูแหล่งข้อมูลสถานที่ (ไม่มีเวลาเปิด)'))}${p.phone?` · ${external('tel:'+p.phone,t('โทร {phone}',{phone:p.phone}))}`:''}</p></section>
  <section class="detail-section"><h3>${t('ค่าใช้จ่าย')}</h3>${costsHtml(p)}${p.sources.fee?`<p>${external(p.sources.fee,t('ที่มาของค่าใช้จ่าย'))}</p>`:''}</section>
  <section class="detail-section"><h3>${t('เดินทางไป')}</h3>${accessHtml(p)}${p.rail.length?p.rail.map(r=>`<div class="transit-item"><i class="line-dot line-${lineClass(r.line)}"></i><div><strong>${esc(trLine(r.line))} · ${esc(t('สถานี{name}',{name:stationName(r.station)}))}</strong><small${placeText(r.instruction,r.instructionEn).join('>')}</small>${r.source?`<small>${external(r.source,t('ตรวจทางออกสถานี'))}</small>`:''}</div></div>`).join(''):`<p class="small">${t('ยังไม่มีข้อมูลรถไฟฟ้าที่ตรวจสอบแล้ว ใช้ช่องด้านล่างเพื่อดูเส้นทางต่อรถ')}</p>`}${p.sources.rail?`<p>${external(p.sources.rail,t('ที่มาของสถานี'))}</p>`:''}
  ${p.bus.length?`<p class="sub-label">${t('รถเมล์ที่แหล่งข้อมูลระบุ')}</p><div class="chips">${p.bus.map(b=>`<span class="chip">${t('สาย {b}',{b:`<span${/[฀-๿]/.test(b)?thLang():''}>${esc(b)}</span>`})}</span>`).join('')}</div>`:''}<p class="small"${placeText(p.busNote,p.en?.busNote).join('>')}</p>${p.sources.bus?`<p>${external(p.sources.bus,t('ตรวจรายการสาย'))}</p>`:''}
  <div class="route-box"><label class="route-label" for="origin">${t('เริ่มจากที่ไหน')}</label><div class="route-input"><input id="origin" type="text" maxlength="250" placeholder="${esc(t('เช่น อนุสาวรีย์ชัยสมรภูมิ'))}" value="${esc(originText)}"><button type="button" id="route-locate" class="icon-button" aria-label="${esc(t('ใช้ตำแหน่งปัจจุบันเป็นจุดเริ่มต้น'))}">${icon('locate')}</button></div><div class="travel-modes" role="group" aria-label="${esc(t('วิธีเดินทาง'))}"><button type="button" data-mode="transit" class="travel-mode active" aria-pressed="true">${icon('train')}${t('ขนส่งสาธารณะ')}</button><button type="button" data-mode="walking" class="travel-mode" aria-pressed="false">${icon('walk')}${t('เดิน')}</button><button type="button" data-mode="driving" class="travel-mode" aria-pressed="false">${icon('car')}${t('รถยนต์')}</button></div><p class="small" id="route-summary"></p><a class="btn btn-primary btn-block" data-route-link target="_blank" rel="noopener">${t('ดูเวลาและเส้นทางใน Google Maps')} ${icon('arrow')}</a><p class="small">${t('เว็บนี้ไม่คำนวณเวลาเดินทางเอง เปิด Google Maps เพื่อดูเวลา จุดขึ้น–ลง และการต่อรถ')}</p></div></section>
  <section class="detail-section"><h3>${t('สนามและลู่')}</h3>${sportsHtml(p)}</section>
  <section class="detail-section"><h3>${t('สิ่งอำนวยความสะดวก')}</h3>${amenitiesHtml(p)}</section>
  <section class="detail-section"><h3>${t('ที่มาของข้อมูล')}</h3><p class="small">${t('ตรวจวันที่ {date} · พิกัดเป็นบริเวณโดยประมาณ ไม่ใช่ประตูเข้า ข้อมูลอาจเปลี่ยนหลังตรวจสอบ',{date:p.checkedAt||t('ไม่ระบุ')})}</p><ul class="sources">${sources.map(s=>`<li>${external(s,new URL(s).hostname)}</li>`).join('')}</ul>${contact.enabled?`<button type="button" class="text-button" id="report-place">${t('พบข้อมูลไม่ตรงกับหน้างาน? แจ้งเรา')}</button>`:`<p class="small">${t('พบข้อมูลต่างจากหน้างาน? ตรวจสอบกับหน่วยงานผ่านลิงก์ด้านบน')}</p>`}</section></div>`;
}
function showDetail(id,{fromHistory=false}={}){
  const p=places.find(p=>p.id===id);if(!p)return;
  if(!fromHistory&&selectedId!==id)buddyReact('open');
  if(selectedId===null){returnFocus=document.activeElement;returnId=returnFocus?.dataset?.open||null;}
  const alreadyOpen=selectedId!==null;
  selectedId=id;travelMode='transit';skipFocusRestore=false;suppressDetailHistory=false;
  const detail=$('#detail');
  detail.innerHTML=detailHtml(p);
  $('#close-detail').onclick=closeDetail;$('#detail-save').onclick=()=>toggleSave(p.id);$('#share-place').onclick=sharePlace;$('#show-on-map').onclick=()=>showOnMap(p);$('#route-locate').onclick=locate;$('#origin').oninput=e=>{originText=e.target.value;updateRoute();};
  if($('#report-place'))$('#report-place').onclick=()=>{closeDetail({restoreFocus:false});openSuggest('fix',p);};
  detail.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{travelMode=button.dataset.mode;detail.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});updateRoute();});
  updateRoute();render();
  if(!fromHistory){
    if(alreadyOpen)history.replaceState(history.state,'',`#place=${encodeURIComponent(id)}`);
    else{history.pushState({paipakDetail:true},'',`#place=${encodeURIComponent(id)}`);detailHistoryEntry=true;}
  }else detailHistoryEntry=Boolean(history.state?.paipakDetail);
  if(!detail.open)detail.showModal();
  $('#detail-scroll').scrollTop=0;$('#detail-title').focus({preventScroll:true});
  // Centre the map on the place so it is already in view when the popup closes.
  if(map)map.setView([p.lat,p.lng],Math.max(map.getZoom(),14),{animate:false});
}
function updateRoute(){
  const p=places.find(p=>p.id===selectedId);if(!p)return;
  const url=directionsUrl(p,originText,travelMode);
  $$('[data-route-link]').forEach(a=>a.href=url);
  const point=searchPoint();
  $('#route-summary').textContent=point&&originText===`${point.lat},${point.lng}`?t('ระยะเส้นตรงประมาณ {km} กม. · ไม่ใช่ระยะตามถนนหรือเวลาเดินทาง',{km:distanceKm(point,p).toFixed(1)}):t(originText.trim()?'จุดเริ่มต้นนี้จะส่งไปค้นหาเมื่อคุณกดเปิด Google Maps':'เว้นว่างได้ แล้วเลือกจุดเริ่มต้นใน Google Maps');
}
// Closing goes through the dialog so Escape, the × button and a click on the backdrop all end up in finishClose().
function closeDetail({restoreFocus=true,fromHistory=false}={}){const detail=$('#detail');skipFocusRestore=!restoreFocus;suppressDetailHistory=fromHistory;if(detail.open)detail.close();else finishClose();}
function finishClose(){
  if(selectedId===null)return;
  selectedId=null;
  if(!suppressDetailHistory){if(detailHistoryEntry)history.back();else history.replaceState(null,'',location.pathname+location.search);}
  detailHistoryEntry=false;suppressDetailHistory=false;render();
  if(skipFocusRestore)return;
  // the pick card and list rows re-render, so look for a visible button for the same place in whichever tab is open
  const back=[returnFocus,...(returnId?$$(`[data-open="${CSS.escape(returnId)}"]`):[])].find(el=>el?.isConnected&&el.offsetParent);
  (back||$('[role=tab][aria-selected=true]')).focus({preventScroll:true});
}
// a shared link opens in the language it was copied in
async function sharePlace(){const url=new URL(location.href);url.hash=`place=${selectedId}`;if(en())url.searchParams.set('lang','en');else url.searchParams.delete('lang');try{await navigator.clipboard.writeText(url.href);toast(t('คัดลอกลิงก์สถานที่แล้ว'));}catch{const input=document.createElement('input');input.value=url.href;input.setAttribute('aria-label',t('ลิงก์สถานที่สำหรับคัดลอก'));$('#detail-scroll').prepend(input);input.focus();input.select();toast(t('คัดลอกอัตโนมัติไม่ได้ เลือกลิงก์ไว้ให้แล้ว กดคัดลอกได้เลย'));}}

// "Suggest a place / report a mistake" stays hidden until dist/config.json names a mailbox or form link.
function setupSuggest(){
  if(!contact.enabled)return;
  $('#suggest').hidden=false;$('#main-nav').hidden=false;
  $('#suggest-lead').textContent=t('ตอนนี้มี {n} แห่ง ยังไม่ครบทุกที่ ช่วยกันเติมได้ หรือบอกเราถ้าข้อมูลไม่ตรงกับที่เห็นหน้างาน',{n:places.length});
  const form=$('#suggest-form');
  const message=()=>{const d=Object.fromEntries(new FormData(form));return suggestionMessage({kind:suggestKind,placeId:suggestKind==='fix'?suggestPlace?.id:null,...d});};
  const refresh=()=>{const m=message();if(contact.email)$('#suggest-mail').href=`mailto:${contact.email}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;};
  if(contact.email)$('#suggest-mail').hidden=false;
  if(contact.formUrl){$('#suggest-form-link').hidden=false;$('#suggest-form-link').href=contact.formUrl;}
  form.oninput=refresh;refresh();
  $('#suggest-mail').onclick=e=>{if(!form.checkValidity()){e.preventDefault();form.reportValidity();}};
  $('#suggest-copy').onclick=async()=>{if(!form.reportValidity())return;const m=message();try{await navigator.clipboard.writeText(`${m.subject}\n\n${m.body}`);toast(t('คัดลอกข้อความแล้ว'));}catch{toast(t('คัดลอกอัตโนมัติไม่ได้ เลือกข้อความในช่องแล้วคัดลอกเอง'));}};
  $$('.seg [data-kind]').forEach(b=>b.onclick=()=>setSuggestKind(b.dataset.kind));
}
function setSuggestKind(kind){suggestKind=kind;if(kind==='new')suggestPlace=null;$$('.seg [data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));$('#suggest-form').dispatchEvent(new Event('input'));}
// Phones show either the list or the map; desktop shows both and ignores the view.
function setView(view){
  $('.shell').dataset.view=view;
  $$('.view-switch [data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  if(view==='list')window.scrollTo({top:0});
}
function showOnMap(p){
  closeDetail({restoreFocus:false});setView('map');focusId=p.id;render();
  if(map)map.setView([p.lat,p.lng],Math.max(map.getZoom(),15));
}
function openSuggest(kind,place){
  setView('list');
  setSuggestKind(kind);suggestPlace=place||null;const form=$('#suggest-form');
  if(place){form.elements.name.value=place.name;form.elements.area.value=`${place.district} ${place.province}`;}
  form.dispatchEvent(new Event('input'));$('#suggest').scrollIntoView({behavior:'smooth',block:'start'});
  setTimeout(()=>form.elements[place?'details':'name'].focus({preventScroll:true}),350);
}

function creditList(){return places.filter(p=>p.photo).map(p=>`<li><span${nameLang(p)}>${esc(placeName(p))}</span> — ${creditHtml(p).replace(`${t('ภาพ:')} `,'')}</li>`).join('');}
const dataHtml=()=>en()?dataHtmlEn():dataHtmlTh();
const privacyHtml=()=>en()?privacyHtmlEn():privacyHtmlTh();
const dataHtmlEn=()=>`<h2>Where the information comes from</h2><p>Place details are gathered from local authorities, the Department of Tourism, the Department of National Parks, the Designated Areas for Sustainable Tourism Administration, OpenStreetMap and the operators’ own websites. Every place links to its sources so you can check them. Some data was last checked ${checkedDate(checkedAt)}; each place shows its own date.</p><ul><li>Opening hours: daily schedules, split sessions and dated closures are supported. Status uses Thailand time and is not an on-site check. Unconfirmed gym holidays ask you to check first.</li><li>Buses: line numbers are shown as the source publishes them; they may be old, so check the direction and the stop before you travel.</li><li>Travel time: use Google Maps — this site doesn’t calculate it.</li><li>Crowds: there is no verifiable data, so none is shown.</li><li>Distance and search radius: a straight line from your location or chosen point, not walking or driving distance.</li><li>Facilities: filters only use what has evidence. No data doesn’t mean no service.</li><li>Coordinates: the approximate area of a place. Station exit data doesn’t confirm every gate or path.</li><li>English names: OpenStreetMap’s English name first; otherwise the owner’s own English page (Greener Bangkok for BMA parks, the gyms’ websites), the government tourism directory or Wikidata. A place with no published English name keeps its Thai name; names are never romanized by the site. Descriptions and notes stay in the Thai of their source.</li></ul><h3>Photos</h3><p>${places.filter(p=>p.photo).length} of ${places.length} places have a real, credited photo. Only photos with a file page and a licence that can be checked on Wikimedia Commons are shown; the rest say a photo is still to come.</p><ul>${creditList()}</ul><p>${external('https://www.openstreetmap.org/copyright','© OpenStreetMap contributors')} · ${external('https://www.openstreetmap.org/fixthemap','Report a map problem')}</p>`;
const privacyHtmlEn=()=>`<h2>Data and privacy</h2><p>Pai Pak Kan Mai has no user accounts and no payments. Saved places stay in this browser (localStorage) and don’t sync between devices. Your language choice is kept there too.</p><p>Your location is only requested when you tap “Near me” or a location button, and it stays in the memory of the open page. Opening directions sends the start and destination to Google Maps.</p><p>The map loads from OpenStreetMap and fonts from Google Fonts. These providers, and the host, may receive connection data such as your IP address under their own policies. This site has no ads, no cookies and no tracking of individuals. To know how many people use it, the host (Cloudflare Web Analytics) counts visits without cookies and without identifying anyone: page views, country and device type only.</p><p>${external('https://osmfoundation.org/wiki/Privacy_Policy','OpenStreetMap privacy')}<br>${external('https://foundation.wikimedia.org/wiki/Privacy_policy','Wikimedia privacy')}<br>${external('https://policies.google.com/privacy','Google privacy')}<br>${external('https://www.cloudflare.com/web-analytics/','Cloudflare Web Analytics')}</p><button type="button" class="btn btn-primary" id="clear-local">Clear saved places and location on this page</button>`;
const dataHtmlTh=()=>`<h2>ข้อมูลที่มองเห็นที่มา</h2><p>รายละเอียดสถานที่รวบรวมจากหน่วยงานท้องถิ่น กรมการท่องเที่ยว กรมอุทยานฯ องค์การบริหารการพัฒนาพื้นที่พิเศษฯ แหล่ง OpenStreetMap และเว็บไซต์ผู้ให้บริการ แต่ละสถานที่มีลิงก์ที่มาให้ตรวจสอบต่อ ตรวจข้อมูลบางส่วนล่าสุด ${checkedDate(checkedAt)} วันที่ของแต่ละแห่งอยู่ในรายละเอียด</p><ul><li>เวลาเปิด: รองรับตารางรายวัน หลายช่วงเวลา และประกาศปิดตามช่วงวันที่ สถานะอิงเวลาในประเทศไทย ไม่ใช่การยืนยันหน้างาน วันหยุดยิมที่ยังไม่ยืนยันจะแสดงให้ตรวจสอบก่อน</li><li>รถเมล์: แสดงเลขที่แหล่งข้อมูลเผยแพร่ อาจเป็นเลขเดิม ต้องตรวจทิศทางและป้ายก่อนเดินทาง</li><li>เวลาเดินทาง: ดูผ่าน Google Maps เว็บนี้ไม่คำนวณเอง</li><li>จำนวนคน: ไม่มีข้อมูลที่ยืนยันได้ จึงไม่แสดง</li><li>ระยะและรัศมีค้นหา: เป็นเส้นตรงจากตำแหน่งหรือจุดที่เลือก ไม่ใช่ระยะเดินหรือขับรถ</li><li>สิ่งอำนวยความสะดวก: กรองเฉพาะสิ่งที่มีหลักฐาน การไม่มีข้อมูลไม่เท่ากับไม่มีบริการ</li><li>พิกัด: บริเวณสถานที่โดยประมาณ ข้อมูลทางออกสถานีไม่ใช่การยืนยันประตูหรือทางเดินทั้งหมด</li></ul><h3>ภาพถ่าย</h3><p>มีภาพจริงพร้อมเครดิต ${places.filter(p=>p.photo).length} จาก ${places.length} แห่ง แสดงเฉพาะภาพที่มีหน้าไฟล์และใบอนุญาตตรวจสอบได้ใน Wikimedia Commons รายการที่ยังหาแหล่งภาพใช้ซ้ำได้จะแสดงป้ายรอภาพจริง</p><ul>${creditList()}</ul><p>${external('https://www.openstreetmap.org/copyright','© OpenStreetMap contributors')} · ${external('https://www.openstreetmap.org/fixthemap','รายงานปัญหาแผนที่')}</p>`;
const privacyHtmlTh=()=>`<h2>ข้อมูลและความเป็นส่วนตัว</h2><p>ไปพักกันไหม ไม่มีบัญชีผู้ใช้หรือระบบชำระเงิน รายการที่บันทึกอยู่ในเบราว์เซอร์เครื่องนี้ (localStorage) และไม่ซิงก์ข้ามเครื่อง ภาษาที่เลือกก็เก็บไว้ที่เดียวกัน</p><p>ตำแหน่งจะถูกขอเมื่อกด “ใกล้ฉัน” หรือปุ่มตำแหน่งเท่านั้น และเก็บในหน่วยความจำของหน้าที่เปิดอยู่ การเปิดเส้นทางจะส่งจุดเริ่มต้นและปลายทางไปยัง Google Maps</p><p>แผนที่โหลดจาก OpenStreetMap และแบบอักษรโหลดจาก Google Fonts ผู้ให้บริการเหล่านี้รวมถึงโฮสติ้งอาจได้รับข้อมูลการเชื่อมต่อ เช่น IP ตามนโยบายของตน เว็บไซต์ไม่มีโฆษณา ไม่ใช้คุกกี้ และไม่ติดตามตัวบุคคล เพื่อให้รู้ว่ามีคนใช้เว็บกี่คน ผู้ให้บริการโฮสต์ (Cloudflare Web Analytics) นับการเข้าชมโดยไม่ใช้คุกกี้และไม่ระบุตัวตน เก็บเพียงจำนวนการเปิดหน้า ประเทศ และประเภทอุปกรณ์</p><p>${external('https://osmfoundation.org/wiki/Privacy_Policy','ความเป็นส่วนตัว OpenStreetMap')}<br>${external('https://foundation.wikimedia.org/wiki/Privacy_policy','ความเป็นส่วนตัว Wikimedia')}<br>${external('https://policies.google.com/privacy','ความเป็นส่วนตัว Google')}<br>${external('https://www.cloudflare.com/web-analytics/','Cloudflare Web Analytics')}</p><button type="button" class="btn btn-primary" id="clear-local">ล้างรายการบันทึกและตำแหน่งในหน้านี้</button>`;
let infoShown=null;
function showInfo(kind){
  infoShown=kind;$('#info-content').innerHTML=kind==='data'?dataHtml():privacyHtml();
  if(!$('#info-dialog').open)$('#info-dialog').showModal();
  if($('#clear-local'))$('#clear-local').onclick=()=>{state.saved.clear();clearSearchArea();try{localStorage.removeItem('paipak:saved');}catch{}$('#info-dialog').close();toast(t('ล้างข้อมูลในเครื่องแล้ว'));};
}

// typing a name is a lookup, so show the list rather than a single pick
$('#search').oninput=e=>{state.query=e.target.value;if(state.query.trim())setTab('list');render();};
$('#province').onchange=e=>{setProvince(e.target.value);$('#area-dialog').close();backToOpener();};
$('#free-only').onchange=e=>{state.feeFilter=e.target.checked?'free':'all';state.freeOnly=e.target.checked;syncControls();render();};
$('#open-only').onchange=e=>{state.openOnly=e.target.checked;render();};
$('#sort').onchange=e=>{if(e.target.value==='distance'&&!searchPoint()){e.target.value=state.sort;openArea(e.target);return;}state.sort=e.target.value;render();};
$('.tabs').onclick=e=>{const t=e.target.closest('[role=tab]');if(t)setTab(t.id.slice(4));};
$('.tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();setTab(e.key==='Home'?'pick':e.key==='End'?'list':activeTab==='pick'?'list':'pick',{focus:true});};
$('.skip').onclick=e=>{e.preventDefault();setTab('list');$('#results').focus();};
$('#close-area').onclick=()=>{$('#area-dialog').close();backToOpener();};
$('#locate').onclick=()=>{$('#area-dialog').close();locate();backToOpener();};
$('#pick-map-point').onclick=startPointPicking;
$('#confirm-point').onclick=()=>{if(!map)return;const point=map.getCenter();endPointPicking();setSearchOrigin({lat:point.lat,lng:point.lng,label:'จุดที่เลือกบนแผนที่'});setView(pointPreviousView);backToOpener();};
$('#cancel-point').onclick=()=>{endPointPicking();setView(pointPreviousView);backToOpener();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pickingPoint){e.preventDefault();$('#cancel-point').click();}});
$('#clear-area').onclick=()=>{clearSearchArea();$('#area-dialog').close();backToOpener();toast(t('กลับมาดูทุกพื้นที่แล้ว'));};
$('#radius').onchange=e=>{state.radiusKm=Number(e.target.value);state.bounds=null;render();fitMap();};
$('#search-map-area').onclick=()=>{if(!map)return;const b=map.getBounds();state.bounds={south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()};state.province='all';state.radiusKm=0;syncControls();showProvince();setTab('list');render();toast(t('แสดงเฉพาะสถานที่ในบริเวณแผนที่ที่เลือกแล้ว'));};
renderFacilityFilters();
$('#facility-filter-list').onchange=()=>{state.facilities=[...state.facilities.filter(id=>SPORT_FACILITIES.some(f=>f.id===id)),...$$('#facility-filter-list input:checked').map(i=>i.value)];render();};
$('#sport-filter-list').onclick=e=>{const b=e.target.closest('[data-facility]');if(!b)return;const id=b.dataset.facility;state.facilities=state.facilities.includes(id)?state.facilities.filter(x=>x!==id):[...state.facilities,id];render();};
$('#fee-filter').onchange=e=>{state.feeFilter=e.target.value;state.freeOnly=state.feeFilter==='free';syncControls();render();};
$('#photo-only').onchange=e=>{state.photoOnly=e.target.checked;render();};
$('#visit-at').onchange=e=>{if(e.target.value&&!localVisitDate(e.target.value)){e.target.setCustomValidity(t('กรุณาเลือกวันเวลาที่ถูกต้อง'));e.target.reportValidity();return;}e.target.setCustomValidity('');state.visitAt=e.target.value;render();};
$('#visit-now').onclick=()=>{state.visitAt='';$('#visit-at').value='';render();};
// filter sheet: applies as you choose; the main button only closes it and shows the list
$('#open-filters').onclick=()=>{syncControls();$('#filter-dialog').showModal();$('#close-filters').focus();};
$('#close-filters').onclick=()=>$('#filter-dialog').close();
$('#apply-filters').onclick=()=>{$('#filter-dialog').close();setTab('list');};
$('#clear-filters').onclick=()=>{Object.assign(state,{facilities:[],feeFilter:'all',freeOnly:false,photoOnly:false,visitAt:''});syncControls();render();};
$('#filter-dialog').addEventListener('close',()=>{if($('#open-filters').offsetParent)$('#open-filters').focus({preventScroll:true});});
// a click on the dimmed area outside a sheet closes it
for(const d of [$('#filter-dialog'),$('#area-dialog')])d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){d.close();if(d.id==='area-dialog')backToOpener();}});
document.addEventListener('click',e=>{
  const open=e.target.closest('[data-open]'),save=e.target.closest('[data-save]');
  if(save)toggleSave(save.dataset.save);
  else if(open)showDetail(open.dataset.open);
  else if(e.target.closest('[data-reset]'))resetFilters();
  else if(e.target.closest('[data-more]'))showMoreRows();
  else if(e.target.closest('[data-clear-filters]'))clearFilters();
  else if(e.target.closest('[data-remove]'))removeFilter(e.target.closest('[data-remove]').dataset.remove);
  else if(e.target.closest('[data-intent]')){state.intent=e.target.closest('[data-intent]').dataset.intent;render();fitMap();revealIntent();buddyReact('intent',state.intent);}
  else if(e.target.closest('[data-where]'))openArea(e.target.closest('[data-where]'));
  else if(e.target.closest('[data-near]')){
    const point=nearChoices[Number(e.target.closest('[data-near]').dataset.near)];if(!point)return;
    // the text was a place to search around, not a name to match, so clear it
    state.query='';$('#search').value='';setSearchOrigin(point);
    $('.quick-row [data-where]').focus({preventScroll:true});toast(t('ค้นหารอบ{name} รัศมี {r} กม. (เส้นตรง) เปลี่ยนรัศมีได้ที่ปุ่ม “แถวไหน”',{name:pointName(point),r:state.radiusKm}));
  }
  else if(e.target.closest('[data-goto-list]')){setTab('list');$('#results').focus({preventScroll:true});}
  else if(e.target.closest('#pick-next')){pickIndex++;renderPick();$('#pick-next')?.focus({preventScroll:true});}
});
$('#data-info').onclick=()=>showInfo('data');$('#privacy-info').onclick=()=>showInfo('privacy');
$('#close-info').onclick=()=>$('#info-dialog').close();
$('#info-dialog').onclick=e=>{if(e.target===$('#info-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
$('#rail-toggle').onclick=e=>{railOn=!railOn;e.currentTarget.setAttribute('aria-pressed',String(railOn));syncRail();};
$('.view-switch').onclick=e=>{const b=e.target.closest('[data-view]');if(b)setView(b.dataset.view);};
$('#map-locate').onclick=locate;$('#fit-map').onclick=fitMap;
$('#detail').addEventListener('close',finishClose);
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail'))closeDetail();});
function hashPlace(){const id=new URLSearchParams(location.hash.slice(1)).get('place');if(id&&places.some(p=>p.id===id)){if(id!==selectedId)showDetail(id,{fromHistory:true});}else if(selectedId)closeDetail({fromHistory:true});}
window.addEventListener('hashchange',hashPlace);

$('.lang-switch').onclick=e=>{const b=e.target.closest('[data-lang]');if(b&&b.dataset.lang!==getLang())setLang(b.dataset.lang);};
renderIntents();initChipRails();syncControls();
// ?lang=en (from a shared link) wins, then the language this device chose last time; Thai otherwise
{
  let saved=null;try{saved=localStorage.getItem('paipak:lang');}catch{}
  const asked=new URLSearchParams(location.search).get('lang');
  setLang(['th','en'].includes(asked)?asked:saved==='en'?'en':'th',{save:false});
}
// phones: the list bar pins just under the pinned search + tabs
new ResizeObserver(()=>document.documentElement.style.setProperty('--tools-h',`${$('#panel-tools').offsetHeight}px`)).observe($('#panel-tools'));
// the loading screen in index.html: fade it once the data and map are ready (or loading failed), then drop it
function hideSplash(){const s=document.getElementById('splash');if(!s)return;s.classList.add('is-done');setTimeout(()=>s.remove(),400);}
tick();
try{
  const [response,configResponse]=await Promise.all([fetch('./places.json'),fetch('./config.json').catch(()=>null)]);
  if(!response.ok)throw Error('data');
  const data=await response.json();places=data.places;checkedAt=data.checkedAt;
  syncCheckedAt();
  try{if(configResponse?.ok)contact=contactConfig(await configResponse.json());}catch{}
  state.saved=new Set([...state.saved].filter(id=>places.some(p=>p.id===id)));
  renderProvinceOptions();renderSportFilters();
  // the legend lists only kinds that have at least one place on the map
  $$('.map-legend [data-kind]').forEach(li=>li.hidden=!places.some(p=>pinKind(p)===li.dataset.kind));
  initMap();render();fitMap();setupSuggest();hashPlace();
  // the mascot loads after the map so it never delays the first view
  // requestIdleCallback takes an options object, not a delay; a number makes it throw
  if(window.requestIdleCallback)requestIdleCallback(()=>startBuddy(),{timeout:2500});else setTimeout(()=>startBuddy(),1200);
}catch{
  $('#result-count').textContent=t('โหลดข้อมูลไม่สำเร็จ');$('#pick').innerHTML='';
  $('#place-list').innerHTML=`<div class="empty-state"><img class="mascot" src="./mascot/sad.webp" alt="" width="120" height="120" aria-hidden="true"><strong>${t('ยังเชื่อมต่อข้อมูลไม่ได้')}</strong><p>${t('ลองตรวจสอบอินเทอร์เน็ต แล้วโหลดหน้าอีกครั้ง')}</p><button type="button" class="btn btn-ghost" onclick="location.reload()">${t('ลองอีกครั้ง')}</button></div>`;
  setTimeout(()=>{startBuddy().then(()=>buddyReact('error'));},800);
}finally{hideSplash();}
