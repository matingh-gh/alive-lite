// ====== I18N ======
const I18N = {
  fa: {
    title: "Alive Lite – ترک تدریجی",
    brand: "Alive Lite",
    subtitle: "ترک تدریجی سیگار – ساخت خودت",
    tab_signup: "ثبت‌نام",
    tab_start: "شروع",
    tab_controls: "کنترل",
    tab_dashboard: "داشبورد",
    tab_history: "تاریخچه",
    tab_profile: "پروفایل",
    signup_title: "ساخت حساب",
    signup_name: "نام شما",
    signup_lang: "زبان دلخواه",
    signup_btn: "ساخت حساب",
    signup_note: "حساب شما فقط روی همین دستگاه ذخیره می‌شود و نیاز به ورود مجدد نیست.",
    onb_title: "شروع شخصی‌سازی",
    onb_baseline: "چند نخ در روز می‌کشی؟",
    onb_wake: "ساعت بیداری در روز؟",
    onb_reduce: "کاهش هفتگی (%)",
    onb_start: "شروع برنامه",
    phase_label: "فاز جاری",
    phase_next: "ادامه به فاز بعد",
    phase_stay: "فعلاً همین فاز",
    target_interval: "فاصله هدف",
    since_last: "از آخرین سیگار",
    countdown_label: "زمان باقی‌مانده",
    btn_smoke: "می‌خوام سیگار بکشم",
    btn_smoke_ahead: "سیگار خارج از برنامه",
    wait_msg: "هنوز باید صبر کنی…",
    dash_title: "داشبورد",
    kpi_today: "امروز کشیده‌ای",
    kpi_avg7: "میانگین ۷ روز",
    kpi_reduction: "کاهش نسبت به پایه",
    kpi_money: "پول ذخیره‌شده",
    price_label: "قیمت هر نخ (تخمینی به تومان/یورو)",
    btn_export: "خروجی JSON",
    btn_reset: "شروع از اول",
    hist_title: "تاریخچهٔ روزانه",
    prof_title: "پروفایل‌ها",
    prof_new: "پروفایل جدید",
    prof_delete: "حذف پروفایل",
    prof_note: "هر پروفایل تنظیمات و تاریخچهٔ جداگانه دارد (روی همین دستگاه).",
    autoplan_title: "تنظیم خودکار برنامه",
    autoplan_mode: "حالت کاهش",
    mode_easy: "آهسته (۱۲ هفته)",
    mode_normal: "نرمال (۸ هفته)",
    mode_fast: "سریع (۵ هفته)",
    autoplan_btn: "محاسبه برنامه",
    notif_title: "اعلان",
    notif_enable: "فعال‌سازی اعلان",
    notif_note: "اعلانِ «اجازهٔ سیگار بعدی» فقط زمانی که اپ باز باشد کار می‌کند.",
    btn_install: "نصب روی Home Screen",
    footnote: "نسخه آزمایشی – داده‌ها فقط روی این دستگاه ذخیره می‌شود.",
    minutes: "دقیقه"
  },
  en: {
    title: "Alive Lite – Gradual Quit",
    brand: "Alive Lite",
    subtitle: "Gradual cigarette reduction — DIY",
    tab_signup: "Sign up",
    tab_start: "Start",
    tab_controls: "Control",
    tab_dashboard: "Dashboard",
    tab_history: "History",
    tab_profile: "Profile",
    signup_title: "Create Account",
    signup_name: "Your name",
    signup_lang: "Preferred language",
    signup_btn: "Create account",
    signup_note: "Your account is stored on this device only. No need to sign in again.",
    onb_title: "Personalize",
    onb_baseline: "How many per day?",
    onb_wake: "Waking hours per day?",
    onb_reduce: "Weekly reduction (%)",
    onb_start: "Start plan",
    phase_label: "Current phase",
    phase_next: "Advance phase",
    phase_stay: "Stay in phase",
    target_interval: "Target interval",
    since_last: "Since last cigarette",
    countdown_label: "Time left",
    btn_smoke: "I will smoke now",
    btn_smoke_ahead: "Smoke ahead (off-plan)",
    wait_msg: "Please wait…",
    dash_title: "Dashboard",
    kpi_today: "Smoked today",
    kpi_avg7: "7-day average",
    kpi_reduction: "Reduction vs baseline",
    kpi_money: "Money saved",
    price_label: "Price per cigarette (est.)",
    btn_export: "Export JSON",
    btn_reset: "Reset",
    hist_title: "Daily history",
    prof_title: "Profiles",
    prof_new: "New profile",
    prof_delete: "Delete profile",
    prof_note: "Each profile has separate settings/history (on this device).",
    autoplan_title: "Auto-plan",
    autoplan_mode: "Pace",
    mode_easy: "Easy (12 weeks)",
    mode_normal: "Normal (8 weeks)",
    mode_fast: "Fast (5 weeks)",
    autoplan_btn: "Calculate plan",
    notif_title: "Notifications",
    notif_enable: "Enable notifications",
    notif_note: "Ready-to-smoke alerts work only while the app is open.",
    btn_install: "Add to Home Screen",
    footnote: "Experimental — data stored only on this device.",
    minutes: "min"
  }
};

let LANG = localStorage.getItem('alive-lite:lang') || 'fa';
function t(key){ return (I18N[LANG] && I18N[LANG][key]) || key; }
function applyI18n(){
  document.documentElement.setAttribute('lang', LANG);
  document.documentElement.setAttribute('dir', LANG==='fa' ? 'rtl':'ltr');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    el.textContent = t(k);
  });
}

// ====== State ======
const state = {
  started: false,
  baseline: 20,
  wake: 16,
  reducePct: 8,
  phase: 1,
  lastSmokeAt: null,
  history: [],            // {ts:number, ahead?:boolean}
  pricePerCig: 0.5,
  account: null           // {name, createdAt, lang}
};

// ====== DOM ======
const $ = s => document.querySelector(s);
const onboarding = $('#onboarding');
const controls = $('#controls');
const stats = $('#stats');
const logBtn = $('#logBtn');
const smokeAheadBtn = $('#smokeAheadBtn');
const waitMsg = $('#waitMsg');
const targetInterval = $('#targetInterval');
const elapsed = $('#elapsed');
const countdown = $('#countdown');
const phaseIndex = $('#phaseIndex');
const todayCountEl = $('#todayCount');
const avg7El = $('#avg7');
const reductionPctEl = $('#reductionPct');
const moneySavedEl = $('#moneySaved');
const pricePerCigEl = $('#pricePerCig');

// ====== Storage ======
const STORAGE_KEY = 'alive-lite:v1';
function save() {
  saveStateForProfile();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try { Object.assign(state, JSON.parse(raw)); } catch(e){}
}
load();

// ====== Helpers ======
function minutesBetween(a,b){ return Math.floor((a-b)/60000); }
function secondsBetween(a,b){ return Math.floor((a-b)/1000); }
function startOfDay(ts){ const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
function mmss(totalSec){
  totalSec = Math.max(0, totalSec|0);
  const m = String(Math.floor(totalSec/60)).padStart(2,'0');
  const s = String(totalSec%60).padStart(2,'0');
  return `${m}:${s}`;
}

// interval for current phase (minutes)
function currentTargetInterval() {
  const r = state.reducePct / 100;
  const factor = Math.pow(1 - r, state.phase - 1);
  const cigsPerDay = Math.max(1, state.baseline * factor);
  return Math.round((state.wake * 60) / cigsPerDay);
}

// stats
function getTodayCount() {
  const sod = startOfDay(Date.now());
  return state.history.filter(h => h.ts >= sod).length;
}
function get7DayAvg() {
  const now = Date.now();
  let total = 0;
  for (let i=0;i<7;i++){
    const sod = startOfDay(now - i*86400000);
    const eod = sod + 86400000;
    total += state.history.filter(h => h.ts >= sod && h.ts < eod).length;
  }
  return (total/7).toFixed(1);
}
function reductionPct() {
  const avg = parseFloat(get7DayAvg());
  if (!avg || !state.baseline) return 0;
  return Math.max(0, Math.round((1 - (avg/state.baseline))*100));
}
function moneySaved() {
  const baselineWeek = state.baseline * 7;
  let weekTotal = 0;
  const now = Date.now();
  for (let i=0;i<7;i++){
    const sod = startOfDay(now - i*86400000);
    const eod = sod + 86400000;
    weekTotal += state.history.filter(h => h.ts >= sod && h.ts < eod).length;
  }
  const avoided = Math.max(0, baselineWeek - weekTotal);
  return (avoided * state.pricePerCig).toFixed(2);
}

// ====== Profiles ======
const PROFILES_KEY = 'alive-lite:profiles';
let profiles = [];
let currentProfileId = null;

function loadProfiles(){
  try { profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]'); } catch(e){ profiles = []; }
  if (profiles.length === 0){
    const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    profiles.push({ id, name: 'Me' });
    currentProfileId = id;
    saveProfiles();
  } else {
    currentProfileId = currentProfileId || profiles[0].id;
  }
}
function saveProfiles(){ localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); }
function setCurrentProfile(id){
  currentProfileId = id;
  saveProfiles();
  const s = localStorage.getItem(STORAGE_KEY + ':' + id);
  if (s){
    try { Object.assign(state, JSON.parse(s)); } catch(e){}
  } else {
    state.started = false; state.history = []; state.lastSmokeAt=null; state.phase=1; state.account = null;
  }
  applyI18n(); updateUI(); renderHistory(); populateProfileSelect();
}
function saveStateForProfile(){
  if (!currentProfileId) return;
  localStorage.setItem(STORAGE_KEY + ':' + currentProfileId, JSON.stringify(state));
}
function populateProfileSelect(){
  const sel = document.getElementById('profileSelect');
  if (!sel) return;
  sel.innerHTML = '';
  profiles.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.name + ' (' + p.id.slice(0,4) + ')';
    if (p.id === currentProfileId) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ====== History View ======
function dailyCounts(days=30){
  const now = Date.now();
  const out = [];
  for (let i=0;i<days;i++){
    const sod = startOfDay(now - i*86400000);
    const eod = sod + 86400000;
    const cnt = state.history.filter(h => h.ts >= sod && h.ts < eod).length;
    out.push({ date: new Date(sod), count: cnt });
  }
  return out; // latest first
}
function renderHistory(){
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = '';
  dailyCounts(30).forEach((d) => {
    const row = document.createElement('div');
    row.className = 'row';
    const ds = d.date.toLocaleDateString(LANG==='fa'?'fa-IR':'en-US', { weekday:'short', year:'2-digit', month:'2-digit', day:'2-digit' });
    row.innerHTML = `<span>${ds}</span><b>${d.count}</b>`;
    list.appendChild(row);
  });
}

// ====== Tabs ======
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.getAttribute('data-tab');
    ['signup','onboarding','controls','stats','history','profile'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('hidden', id !== tab);
    });
  });
});

// ====== Auto Plan ======
document.getElementById('autoPlanBtn').addEventListener('click', () => {
  const pace = document.getElementById('pace').value; // easy 12w, normal 8w, fast 5w
  const weeks = pace === 'easy' ? 12 : (pace === 'fast' ? 5 : 8);
  const target = Math.max(2, Math.round(state.baseline*0.1));
  const r = 1 - Math.pow(target / Math.max(1,state.baseline), 1/weeks);
  state.reducePct = Math.min(15, Math.max(3, Math.round(r*100)));
  document.getElementById('autoPlanMsg').textContent = `${t('autoplan_btn')}: ${state.reducePct}% – ${weeks} w`;
  saveStateForProfile(); save(); updateUI();
});

// ====== Notifications (foreground) ======
async function enableNotifications(){
  if (!('Notification' in window)) return alert('Notifications not supported.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') alert('Permission required.');
}
document.getElementById('enableNotif').addEventListener('click', enableNotifications);

let pendingNotifyTimeout = null;
function scheduleReadyNotification(secondsLeft){
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (pendingNotifyTimeout) { clearTimeout(pendingNotifyTimeout); pendingNotifyTimeout = null; }
  const ms = secondsLeft*1000;
  if (ms <= 0) return;
  pendingNotifyTimeout = setTimeout(() => {
    new Notification(LANG==='fa' ? 'الان اجازه داری سیگار بکشی' : 'You can smoke now', { body: LANG==='fa' ? 'فاصلهٔ هدف تکمیل شد.' : 'Target interval reached.' });
    if (navigator.vibrate) navigator.vibrate([200,100,200]);
  }, ms);
}

// ====== Countdown ======
function updateCountdown(){
  const tiMin = currentTargetInterval();
  const now = Date.now();
  const elapsedSec = state.lastSmokeAt ? secondsBetween(now, state.lastSmokeAt) : 9999*60;
  const remainingSec = Math.max(0, tiMin*60 - elapsedSec);
  countdown.textContent = remainingSec ? mmss(remainingSec) : '00:00';
  // schedule one-shot ready notification
  if (remainingSec>0) scheduleReadyNotification(remainingSec);
}

// ====== Signup ======
document.getElementById('createAccount').addEventListener('click', () => {
  const name = (document.getElementById('signupName').value || '').trim();
  const lang = document.getElementById('signupLang').value || 'fa';
  if (!name) return alert(LANG==='fa'?'نام را وارد کن':'Enter a name');
  state.account = { name, createdAt: Date.now(), lang };
  LANG = lang; localStorage.setItem('alive-lite:lang', LANG);
  save(); applyI18n();
  // Hide signup and show onboarding
  switchTab('onboarding');
});

function switchTab(id){
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${id}"]`).classList.add('active');
  ['signup','onboarding','controls','stats','history','profile'].forEach(sec => {
    const el = document.getElementById(sec);
    if (el) el.classList.toggle('hidden', sec !== id);
  });
}

// ====== UI Update ======
function updateUI(){
  // If no account yet, force signup first
  if (!state.account){
    switchTab('signup');
  } else if (!state.started){
    switchTab('onboarding');
  }

  phaseIndex.textContent = state.phase;
  const ti = currentTargetInterval();
  targetInterval.textContent = ti;

  const now = Date.now();
  const elapsedMin = state.lastSmokeAt ? minutesBetween(now, state.lastSmokeAt) : 9999;
  elapsed.textContent = isFinite(elapsedMin) ? elapsedMin : '—';
  updateCountdown();

  todayCountEl.textContent = getTodayCount();
  avg7El.textContent = get7DayAvg();
  reductionPctEl.textContent = reductionPct() + '%';
  moneySavedEl.textContent = moneySaved();
  pricePerCigEl.value = state.pricePerCig;

  const canSmoke = (state.lastSmokeAt ? minutesBetween(Date.now(), state.lastSmokeAt) : 9999) >= ti;
  waitMsg.classList.toggle('hidden', canSmoke);
  if (!canSmoke){ waitMsg.textContent = t('wait_msg'); } else { waitMsg.textContent = ''; }
}

// ====== Events ======
$('#startPlan').addEventListener('click', () => {
  state.baseline = Math.max(1, parseInt($('#baseline').value || '20',10));
  state.wake = Math.min(20, Math.max(8, parseInt($('#wake').value || '16',10)));
  state.reducePct = Math.min(15, Math.max(3, parseInt($('#reduce').value || '8',10)));
  state.phase = 1;
  state.started = true;
  state.lastSmokeAt = null;
  state.history = [];
  save();
  updateUI(); renderHistory();
});

logBtn.addEventListener('click', () => {
  const ti = currentTargetInterval();
  const now = Date.now();
  const elapsedMin = state.lastSmokeAt ? minutesBetween(now, state.lastSmokeAt) : 9999;
  if (elapsedMin < ti){
    // not allowed yet
    updateUI();
    return;
  }
  state.lastSmokeAt = now;
  state.history.push({ ts: now });
  save();
  updateUI(); renderHistory();
});

smokeAheadBtn.addEventListener('click', () => {
  const now = Date.now();
  state.lastSmokeAt = now;
  state.history.push({ ts: now, ahead: true });
  save();
  updateUI(); renderHistory();
});

$('#advancePhase').addEventListener('click', () => { state.phase += 1; save(); updateUI(); });
$('#stayPhase').addEventListener('click', () => { updateUI(); });
pricePerCigEl.addEventListener('change', (e) => { state.pricePerCig = parseFloat(e.target.value || '0'); save(); updateUI(); });

// Export JSON
document.getElementById('exportJson').addEventListener('click', () => {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'alive-lite-export.json'; a.click();
  URL.revokeObjectURL(url);
});

// Reset
document.getElementById('resetApp').addEventListener('click', () => {
  if (confirm(LANG==='fa'?'همه داده‌ها پاک شود؟':'Clear all data?')){
    if (currentProfileId) localStorage.removeItem(STORAGE_KEY + ':' + currentProfileId);
    localStorage.removeItem('alive-lite:v1');
    location.reload();
  }
});

// Language switch buttons
document.getElementById('langFa').addEventListener('click', () => { LANG='fa'; localStorage.setItem('alive-lite:lang','fa'); applyI18n(); updateUI(); renderHistory(); });
document.getElementById('langEn').addEventListener('click', () => { LANG='en'; localStorage.setItem('alive-lite:lang','en'); applyI18n(); updateUI(); renderHistory(); });

// تیک‌تاک برای شمارش معکوس و UI
setInterval(() => { updateCountdown(); }, 1000);

// ====== Install prompt ======
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});
installBtn.addEventListener('click', async () => { if (deferredPrompt){ deferredPrompt.prompt(); } });

// ====== Service Worker ======
if ('serviceWorker' in navigator){
  window.addEventListener('load', () => { navigator.serviceWorker.register('./service-worker.js'); });
}

// ====== Bootstrap ======
applyI18n();
loadProfiles();
populateProfileSelect();
setCurrentProfile(currentProfileId);

// Profile UI bindings
document.getElementById('profileSelect').addEventListener('change', (e) => setCurrentProfile(e.target.value));
document.getElementById('newProfile').addEventListener('click', () => {
  const name = prompt(LANG==='fa'?'نام پروفایل جدید؟':'New profile name?','Friend');
  if (!name) return;
  const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  profiles.push({ id, name });
  saveProfiles();
  setCurrentProfile(id);
});
document.getElementById('deleteProfile').addEventListener('click', () => {
  if (!confirm(LANG==='fa'?'این پروفایل حذف شود؟':'Delete this profile?')) return;
  profiles = profiles.filter(p => p.id !== currentProfileId);
  localStorage.removeItem(STORAGE_KEY + ':' + currentProfileId);
  saveProfiles();
  if (profiles.length === 0){
    const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    profiles.push({ id, name:'Me' });
  }
  setCurrentProfile(profiles[0].id);
});
