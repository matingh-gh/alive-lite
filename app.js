// === Alive Lite app.js (with Foreground Notifications) ===
// Backward-compatible with v4a HTML. If #enableNotif doesn't exist, it will inject a card in Profile.

// ---- I18N ----
const I18N={fa:{title:"Alive Lite – ترک تدریجی",brand:"Alive Lite",subtitle:"ترک تدریجی سیگار – ساخت خودت",tab_controls:"کنترل",tab_dashboard:"داشبورد",tab_history:"تاریخچه",tab_profile:"پروفایل",signup_title:"ساخت حساب",signup_name:"نام شما",signup_lang:"زبان دلخواه",signup_btn:"ساخت حساب",signup_note:"حساب شما فقط روی همین دستگاه ذخیره می‌شود و نیاز به ورود مجدد نیست.",onb_title:"شروع شخصی‌سازی",onb_baseline:"چند نخ در روز می‌کشی؟",onb_wake:"ساعت بیداری در روز؟",onb_reduce:"کاهش هفتگی (%)",onb_start:"شروع برنامه",phase_label:"فاز جاری",phase_next:"ادامه به فاز بعد",phase_stay:"فعلاً همین فاز",target_interval:"فاصله هدف",since_last:"از آخرین سیگار",countdown_label:"زمان باقی‌مانده",btn_smoke:"می‌خوام سیگار بکشم",btn_smoke_ahead:"سیگار خارج از برنامه",wait_msg:"هنوز باید صبر کنی…",dash_title:"داشبورد",kpi_today:"امروز کشیده‌ای",kpi_avg7:"میانگین ۷ روز",kpi_reduction:"کاهش نسبت به پایه",kpi_money:"پول ذخیره‌شده",price_label:"قیمت هر نخ (تخمینی به تومان/یورو)",btn_export:"خروجی JSON",btn_import:"ورودی JSON",btn_reset:"شروع از اول",hist_title:"تاریخچهٔ روزانه",prof_title:"پروفایل",user_card:"اطلاعات کاربر",user_name:"نام",user_lang:"زبان",user_created:"تاریخ ساخت",edit_account:"ویرایش حساب",reset_profile:"حذف/ریست پروفایل",plan_card:"برنامه ترک",plan_baseline:"پایه (نخ/روز)",plan_wake:"ساعت بیداری",plan_reduce:"کاهش هفتگی",plan_phase:"فاز فعلی",plan_interval:"فاصله هدف فعلی",plan_next_ok:"زمان مجاز بعدی",edit_plan:"ویرایش برنامه",progress_card:"پیشرفت",prog_days:"روزهای سپری‌شده از شروع",timeline_card:"تایم‌لاین فازها",notif_title:"اعلان",notif_note:"اعلان «اجازهٔ سیگار بعدی» فقط وقتی اپ باز باشد کار می‌کند.",notif_enable:"فعال‌سازی اعلان",minutes:"دقیقه"},en:{title:"Alive Lite – Gradual Quit",brand:"Alive Lite",subtitle:"Gradual cigarette reduction — DIY",tab_controls:"Control",tab_dashboard:"Dashboard",tab_history:"History",tab_profile:"Profile",signup_title:"Create Account",signup_name:"Your name",signup_lang:"Preferred language",signup_btn:"Create account",signup_note:"Your account is stored on this device only. No need to sign in again.",onb_title:"Personalize",onb_baseline:"How many per day?",onb_wake:"Waking hours per day?",onb_reduce:"Weekly reduction (%)",onb_start:"Start plan",phase_label:"Current phase",phase_next:"Advance phase",phase_stay:"Stay in phase",target_interval:"Target interval",since_last:"Since last cigarette",countdown_label:"Time left",btn_smoke:"I will smoke now",btn_smoke_ahead:"Smoke ahead (off-plan)",wait_msg:"Please wait…",dash_title:"Dashboard",kpi_today:"Smoked today",kpi_avg7:"7-day average",kpi_reduction:"Reduction vs baseline",kpi_money:"Money saved",price_label:"Price per cigarette (est.)",btn_export:"Export JSON",btn_import:"Import JSON",btn_reset:"Reset",hist_title:"Daily history",prof_title:"Profile",user_card:"Account",user_name:"Name",user_lang:"Language",user_created:"Created at",edit_account:"Edit account",reset_profile:"Delete/Reset profile",plan_card:"Quit plan",plan_baseline:"Baseline (per day)",plan_wake:"Waking hours",plan_reduce:"Weekly reduction",plan_phase:"Current phase",plan_interval:"Current target interval",plan_next_ok:"Next allowed time",edit_plan:"Edit plan",progress_card:"Progress",prog_days:"Days since start",timeline_card:"Phase timeline",notif_title:"Notifications",notif_note:"\"Ready to smoke\" alerts work only while the app is open.",notif_enable:"Enable notifications",minutes:"min"}};
let LANG=localStorage.getItem("alive-lite:lang")||"fa";
function t(key){return (I18N[LANG]&&I18N[LANG][key])||key}
function applyI18n(){document.documentElement.setAttribute("lang",LANG);document.documentElement.setAttribute("dir",LANG==="fa"?"rtl":"ltr");document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.getAttribute("data-i18n");el.textContent=t(k)})}

// ---- State & Storage ----
const state={started:false,baseline:20,wake:16,reducePct:8,phase:1,lastSmokeAt:null,history:[],pricePerCig:0.5,account:null,planStartedAt:null,phases:[]};
const STORAGE_KEY="alive-lite:v1";
const $=s=>document.querySelector(s);
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function load(){const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;try{Object.assign(state,JSON.parse(raw))}catch(e){}}
load();

// ---- Utils ----
function minutesBetween(a,b){return Math.floor((a-b)/60000)}
function secondsBetween(a,b){return Math.floor((a-b)/1000)}
function startOfDay(ts){const d=new Date(ts);d.setHours(0,0,0,0);return d.getTime()}
function mmss(s){s=Math.max(0,s|0);const m=String(Math.floor(s/60)).padStart(2,"0"),ss=String(s%60).padStart(2,"0");return `${m}:${ss}`}
function fmtDate(ts){if(!ts)return "—";return new Date(ts).toLocaleDateString(LANG==="fa"?"fa-IR":"en-US",{year:"2-digit",month:"2-digit",day:"2-digit"})}
function currentTargetInterval(){const r=state.reducePct/100,f=Math.pow(1-r,state.phase-1),cigs=Math.max(1,state.baseline*f);return Math.round((state.wake*60)/cigs)}

// ---- Tabs & Sections ----
const controls=$("#controls"),stats=$("#stats"),historySec=$("#history"),profileSec=$("#profile");
const waitMsg=$("#waitMsg"),targetIntervalEl=$("#targetInterval"),elapsedEl=$("#elapsed"),countdown=$("#countdown"),phaseIndex=$("#phaseIndex");
const todayCountEl=$("#todayCount"),avg7El=$("#avg7"),reductionPctEl=$("#reductionPct"),moneySavedEl=$("#moneySaved"),pricePerCigEl=$("#pricePerCig");

function renderTabs(active){
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  const btn=document.querySelector(`.tab-btn[data-tab="${active}"]`); if(btn) btn.classList.add("active");
  [controls,stats,historySec,profileSec].forEach(sec=>sec&&sec.classList.add("hidden"));
  const map={controls,stats,history:historySec,profile:profileSec}; if(map[active]) map[active].classList.remove("hidden");
}
document.querySelectorAll(".tab-btn").forEach(btn=>btn.addEventListener("click",()=>renderTabs(btn.getAttribute("data-tab"))));

// ---- Stats & History ----
function getTodayCount(){const sod=startOfDay(Date.now());return state.history.filter(h=>h.ts>=sod).length}
function get7DayAvg(){const now=Date.now();let total=0;for(let i=0;i<7;i++){const sod=startOfDay(now-i*86400000),eod=sod+86400000;total+=state.history.filter(h=>h.ts>=sod&&h.ts<eod).length}return (total/7).toFixed(1)}
function reductionPct(){const avg=parseFloat(get7DayAvg()); if(!avg||!state.baseline) return 0; return Math.max(0,Math.round((1-avg/state.baseline)*100))}
function moneySaved(){const baselineWeek=state.baseline*7; let weekTotal=0; const now=Date.now(); for(let i=0;i<7;i++){const sod=startOfDay(now-i*86400000),eod=sod+86400000; weekTotal+=state.history.filter(h=>h.ts>=sod && h.ts<eod).length;} const avoided=Math.max(0, baselineWeek-weekTotal); return (avoided*state.pricePerCig).toFixed(2)}

function dailyCounts(days=30){const now=Date.now(),out=[];for(let i=0;i<days;i++){const sod=startOfDay(now-i*86400000),eod=sod+86400000,cnt=state.history.filter(h=>h.ts>=sod && h.ts<eod).length; out.push({date:new Date(sod),count:cnt});} return out}
function renderHistory(){ const list=document.getElementById("historyList"); if(!list) return; list.innerHTML=""; dailyCounts(30).forEach(d=>{ const row=document.createElement("div"); row.className="row"; const ds=d.date.toLocaleDateString(LANG==="fa"?"fa-IR":"en-US",{weekday:"short",year:"2-digit",month:"2-digit",day:"2-digit"}); row.innerHTML=`<span>${ds}</span><b>${d.count}</b>`; list.appendChild(row); }); }

// ---- Profile ----
function renderProfile(){
  const set = (id, val)=>{const el=document.getElementById(id); if(el) el.textContent = val}
  set("pName", state.account?.name || "—");
  set("pLang", state.account?.lang || LANG);
  set("pCreated", fmtDate(state.account?.createdAt));
  set("pBaseline", state.baseline);
  set("pWake", state.wake);
  set("pReduce", state.reducePct);
  set("pPhase", state.phase);
  set("pInterval", currentTargetInterval());
  const nextAllowedSec=Math.max(0, currentTargetInterval()*60 - (state.lastSmokeAt?secondsBetween(Date.now(),state.lastSmokeAt):9999*60));
  set("pNextOk", nextAllowedSec ? mmss(nextAllowedSec) : "00:00");
  set("pDays", state.planStartedAt ? Math.ceil((Date.now()-state.planStartedAt)/86400000) : 0);
  set("pToday", getTodayCount());
  set("pAvg7", get7DayAvg());
  set("pRed", reductionPct() + "%");

  const wrap=document.getElementById("phaseTimeline");
  if(wrap){
    wrap.innerHTML="";
    state.phases.forEach(ph=>{
      const row=document.createElement("div"); row.className="row";
      const status=ph.endTs?"✅":"🟡";
      row.innerHTML = `<span>${status} Phase ${ph.index}</span><span>${ph.interval} ${t('minutes')}</span><span>${fmtDate(ph.startTs)} → ${fmtDate(ph.endTs)}</span>`;
      wrap.appendChild(row);
    });
  }
}

// ---- Notifications (Foreground) ----
let pendingNotifyTimeout=null;
async function enableNotifications(){
  if(!("Notification" in window)) return alert(LANG==="fa"?"اعلان‌ها در این مرورگر پشتیبانی نمی‌شود.":"Notifications not supported.");
  const perm = await Notification.requestPermission();
  if(perm!=="granted") alert(LANG==="fa"?"اجازهٔ اعلان لازم است.":"Permission required.");
}
function scheduleReadyNotification(secondsLeft){
  if(!("Notification" in window)) return;
  if(Notification.permission!=="granted") return;
  if(pendingNotifyTimeout){ clearTimeout(pendingNotifyTimeout); pendingNotifyTimeout=null; }
  const ms = secondsLeft*1000; if(ms<=0) return;
  pendingNotifyTimeout = setTimeout(()=>{
    new Notification(LANG==="fa"?"الان اجازه داری سیگار بکشی":"You can smoke now", {
      body: LANG==="fa"?"فاصلهٔ هدف تکمیل شد.":"Target interval reached."
    });
    if(navigator.vibrate) navigator.vibrate([200,100,200]);
  }, ms);
}

// If HTML doesn't have the card, inject a tiny one into Profile
function ensureNotifCard(){
  if(document.getElementById("enableNotif")) return;
  const profile=document.getElementById("profile"); if(!profile) return;
  const card=document.createElement("div");
  card.className="card inner";
  card.innerHTML = `
    <h3 data-i18n="notif_title">${t('notif_title')}</h3>
    <p class="muted" data-i18n="notif_note">${t('notif_note')}</p>
    <button id="enableNotif" data-i18n="notif_enable">${t('notif_enable')}</button>
  `;
  profile.appendChild(card);
  applyI18n();
  document.getElementById("enableNotif").addEventListener("click", enableNotifications);
}

// ---- Countdown & UI ----
function updateCountdown(){
  const tiMin=currentTargetInterval();
  const now=Date.now();
  const elapsedSec = state.lastSmokeAt ? secondsBetween(now, state.lastSmokeAt) : 9999*60;
  const remainingSec = Math.max(0, tiMin*60 - elapsedSec);
  if(countdown) countdown.textContent = remainingSec ? mmss(remainingSec) : "00:00";
  if(remainingSec>0) scheduleReadyNotification(remainingSec);
}
function updateUI(){
  if(phaseIndex) phaseIndex.textContent = state.phase;
  if(targetIntervalEl) targetIntervalEl.textContent = currentTargetInterval();
  const now=Date.now();
  const elapsedMin = state.lastSmokeAt ? minutesBetween(now, state.lastSmokeAt) : 9999;
  if(elapsedEl) elapsedEl.textContent = isFinite(elapsedMin) ? elapsedMin : "—";
  updateCountdown();
  if(todayCountEl) todayCountEl.textContent = getTodayCount();
  if(avg7El) avg7El.textContent = get7DayAvg();
  if(reductionPctEl) reductionPctEl.textContent = reductionPct()+"%";
  if(moneySavedEl) moneySavedEl.textContent = moneySaved();
  if(pricePerCigEl) pricePerCigEl.value = state.pricePerCig;
  const canSmoke = (state.lastSmokeAt ? minutesBetween(Date.now(), state.lastSmokeAt) : 9999) >= currentTargetInterval();
  if(waitMsg){
    waitMsg.classList.toggle("hidden", canSmoke);
    waitMsg.textContent = canSmoke ? "" : t("wait_msg");
  }
  renderProfile();
  ensureNotifCard();
}

// ---- First-run overlays ----
const overlay=$("#overlay"), signupModal=$("#signupModal"), onboardingModal=$("#onboardingModal");
function showModal(m){ if(!overlay||!m) return; overlay.classList.remove("hidden"); m.classList.remove("hidden"); }
function hideModals(){ if(!overlay) return; overlay.classList.add("hidden"); if(signupModal) signupModal.classList.add("hidden"); if(onboardingModal) onboardingModal.classList.add("hidden"); }
function maybeShowFirstRun(){ if(!state.account){ showModal(signupModal); return true; } if(!state.started){ showModal(onboardingModal); return true; } return false; }

// ---- Handlers ----
const pricePerCigEl = document.getElementById("pricePerCig") || {value:0, addEventListener:()=>{}};
const logBtn = document.getElementById("logBtn");
const smokeAheadBtn = document.getElementById("smokeAheadBtn");
const advancePhaseBtn = document.getElementById("advancePhase");
const advancePhaseProfileBtn = document.getElementById("advancePhaseProfile");
const stayPhaseBtn = document.getElementById("stayPhase");

const exportBtn = document.getElementById("exportJson");
const importInput = document.getElementById("importJson");

if(document.getElementById("createAccount")){
  document.getElementById("createAccount").addEventListener("click",()=>{
    const name=(document.getElementById("signupName").value||"").trim();
    const lang=(document.getElementById("signupLang").value)||"fa";
    if(!name){ alert(LANG==="fa"?"نام را وارد کن":"Enter a name"); return; }
    state.account={name, createdAt:Date.now(), lang};
    LANG=lang; localStorage.setItem("alive-lite:lang", LANG);
    save(); applyI18n(); hideModals();
    if(!state.started){ showModal(onboardingModal); } else { renderTabs("controls"); }
  });
}

if(document.getElementById("autoPlanBtn")){
  document.getElementById("autoPlanBtn").addEventListener("click",()=>{
    const pace = document.getElementById("pace").value;
    const weeks = pace==="easy"?12:(pace==="fast"?5:8);
    const target = Math.max(2, Math.round((parseInt(document.getElementById("baseline").value||"20",10))*0.1));
    const r = 1 - Math.pow(target/Math.max(1, parseInt(document.getElementById("baseline").value||"20",10)), 1/weeks);
    document.getElementById("reduce").value = Math.min(15, Math.max(3, Math.round(r*100)));
  });
}

if(document.getElementById("startPlan")){
  document.getElementById("startPlan").addEventListener("click",()=>{
    state.baseline = Math.max(1, parseInt(document.getElementById("baseline").value||"20",10));
    state.wake = Math.min(20, Math.max(8, parseInt(document.getElementById("wake").value||"16",10)));
    state.reducePct = Math.min(15, Math.max(3, parseInt(document.getElementById("reduce").value||"8",10)));
    state.phase = 1; state.started = true; state.lastSmokeAt = null; state.history = [];
    state.planStartedAt = Date.now();
    state.phases = [{index:1, startTs:Date.now(), endTs:null, interval: currentTargetInterval()}];
    save(); hideModals(); renderTabs("controls"); updateUI(); renderHistory();
  });
}

if(logBtn) logBtn.addEventListener("click",()=>{
  const ti=currentTargetInterval(), now=Date.now();
  const elapsedMin = state.lastSmokeAt ? minutesBetween(now, state.lastSmokeAt) : 9999;
  if(elapsedMin < ti){ updateUI(); return; }
  state.lastSmokeAt = now; state.history.push({ts: now});
  save(); updateUI(); renderHistory();
});
if(smokeAheadBtn) smokeAheadBtn.addEventListener("click",()=>{
  const now=Date.now();
  state.lastSmokeAt = now; state.history.push({ts: now, ahead:true});
  save(); updateUI(); renderHistory();
});
function advancePhase(){
  const now=Date.now();
  const current = state.phases[state.phases.length-1];
  if(current && !current.endTs) current.endTs = now;
  state.phase += 1;
  state.phases.push({index: state.phase, startTs: now, endTs: null, interval: currentTargetInterval()});
  save(); updateUI(); renderHistory(); renderProfile();
}
if(advancePhaseBtn) advancePhaseBtn.addEventListener("click", advancePhase);
if(advancePhaseProfileBtn) advancePhaseProfileBtn.addEventListener("click", advancePhase);
if(stayPhaseBtn) stayPhaseBtn.addEventListener("click", ()=>updateUI());

if(exportBtn) exportBtn.addEventListener("click",()=>{
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download="alive-lite-export.json"; a.click(); URL.revokeObjectURL(url);
});
if(importInput) importInput.addEventListener("change",(e)=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ try{ const data = JSON.parse(reader.result); Object.assign(state, data); save(); updateUI(); renderHistory(); alert("Imported."); }catch(err){ alert("Invalid JSON"); } };
  reader.readAsText(file);
});

const langFa = document.getElementById("langFa");
const langEn = document.getElementById("langEn");
if(langFa) langFa.addEventListener("click",()=>{ LANG="fa"; localStorage.setItem("alive-lite:lang","fa"); applyI18n(); updateUI(); renderHistory(); });
if(langEn) langEn.addEventListener("click",()=>{ LANG="en"; localStorage.setItem("alive-lite:lang","en"); applyI18n(); updateUI(); renderHistory(); });

// tickers
setInterval(()=>{ updateCountdown(); renderProfile(); }, 1000);

// PWA install
let deferredPrompt; const installBtn = document.getElementById("installBtn");
if(installBtn){
  window.addEventListener("beforeinstallprompt",(e)=>{ e.preventDefault(); deferredPrompt=e; installBtn.classList.remove("hidden"); });
  installBtn.addEventListener("click", async ()=>{ if(deferredPrompt){ deferredPrompt.prompt(); } });
}

// Service worker
if("serviceWorker" in navigator){ window.addEventListener("load", ()=>{ navigator.serviceWorker.register("./service-worker.js"); }); }

// Bootstrap
applyI18n();
if(!maybeShowFirstRun()){ renderTabs("controls"); updateUI(); renderHistory(); }
// Ensure notif card exists after initial render
ensureNotifCard();
