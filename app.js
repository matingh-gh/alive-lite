// ====== State ======
const state = {
  started: false,
  baseline: 20,
  wake: 16,
  reducePct: 8,   // weekly reduction %
  phase: 1,
  lastSmokeAt: null,       // timestamp (ms)
  history: [],             // [{ts: number}]
  pricePerCig: 0.5
};

// ====== DOM ======
const $ = s => document.querySelector(s);
const onboarding = $('#onboarding');
const controls = $('#controls');
const stats = $('#stats');
const logBtn = $('#logBtn');
const waitMsg = $('#waitMsg');
const targetInterval = $('#targetInterval');
const elapsed = $('#elapsed');
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
function startOfDay(ts){ const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }

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
  // تخمین ساده: تفاوت بین پایه و مصرف ۷روز اخیر * قیمت هر نخ
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
    profiles.push({ id, name: 'پروفایل من' });
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
  // Load state for this profile
  const s = localStorage.getItem(STORAGE_KEY + ':' + id);
  if (s){
    try { Object.assign(state, JSON.parse(s)); } catch(e){}
  } else {
    state.started = false; state.history = []; state.lastSmokeAt=null; state.phase=1;
  }
  updateUI(); renderHistory(); populateProfileSelect();
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
    const ds = d.date.toLocaleDateString('fa-IR', { weekday:'short', year:'2-digit', month:'2-digit', day:'2-digit' });
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
    ['onboarding','controls','stats','history','profile'].forEach(id => {
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
  document.getElementById('autoPlanMsg').textContent = `کاهش هفتگی روی ${state.reducePct}% تنظیم شد تا طی ${weeks} هفته به هدف نزدیک شوی.`;
  saveStateForProfile(); save(); updateUI();
});

// ====== Notifications (foreground) ======
async function enableNotifications(){
  if (!('Notification' in window)) return alert('مرورگر اعلان را پشتیبانی نمی‌کند.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') alert('برای اعلان، اجازه لازم است.');
}
document.getElementById('enableNotif').addEventListener('click', enableNotifications);

let pendingNotifyTimeout = null;
function scheduleReadyNotification(minutesLeft){
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (pendingNotifyTimeout) { clearTimeout(pendingNotifyTimeout); pendingNotifyTimeout = null; }
  const ms = minutesLeft*60000;
  if (ms <= 0) return;
  pendingNotifyTimeout = setTimeout(() => {
    new Notification('الان اجازه داری سیگار بکشی', { body: 'فاصلهٔ هدف تکمیل شد.' });
    if (navigator.vibrate) navigator.vibrate([200,100,200]);
  }, ms);
}

// ====== UI Update ======
function updateUI(){
  if (state.started){
    onboarding.classList.add('hidden');
    controls.classList.remove('hidden');
    stats.classList.remove('hidden');
  } else {
    onboarding.classList.remove('hidden');
    controls.classList.add('hidden');
    stats.classList.add('hidden');
  }

  phaseIndex.textContent = state.phase;
  const ti = currentTargetInterval();
  targetInterval.textContent = ti;

  const now = Date.now();
  const elapsedMin = state.lastSmokeAt ? minutesBetween(now, state.lastSmokeAt) : 9999;
  elapsed.textContent = isFinite(elapsedMin) ? elapsedMin : '—';

  todayCountEl.textContent = getTodayCount();
  avg7El.textContent = get7DayAvg();
  reductionPctEl.textContent = reductionPct() + '%';
  moneySavedEl.textContent = moneySaved();
  pricePerCigEl.value = state.pricePerCig;

  // اجازه/عدم اجازه
  const canSmoke = elapsedMin >= ti;
  waitMsg.classList.toggle('hidden', canSmoke);
  if (!canSmoke){
    waitMsg.textContent = `هنوز ${ti - elapsedMin} دقیقه دیگر صبر کن.`;
    scheduleReadyNotification(ti - elapsedMin);
  } else {
    waitMsg.textContent = '';
  }
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
    scheduleReadyNotification(ti - elapsedMin);
    updateUI();
    return;
  }
  state.lastSmokeAt = now;
  state.history.push({ ts: now });
  save();
  scheduleReadyNotification(ti);
  updateUI(); renderHistory();
});

$('#advancePhase').addEventListener('click', () => {
  state.phase += 1;
  save();
  updateUI();
});
$('#stayPhase').addEventListener('click', () => {
  updateUI();
});

pricePerCigEl.addEventListener('change', (e) => {
  state.pricePerCig = parseFloat(e.target.value || '0');
  save();
  updateUI();
});

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
  if (confirm('همه داده‌ها پاک شود؟')){
    if (currentProfileId) localStorage.removeItem(STORAGE_KEY + ':' + currentProfileId);
    localStorage.removeItem('alive-lite:v1');
    location.reload();
  }
});

// تیک‌تاک هر 30ثانیه برای به‌روزرسانی تایمر
setInterval(updateUI, 30000);

// ====== Install prompt (iOS/Android PWA) ======
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});
installBtn.addEventListener('click', async () => {
  if (deferredPrompt){ deferredPrompt.prompt(); }
});

// ====== PWA SW ======
if ('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}

// ====== Bootstrap ======
loadProfiles();
populateProfileSelect();
setCurrentProfile(currentProfileId);

// Profile UI bindings
document.getElementById('profileSelect').addEventListener('change', (e) => setCurrentProfile(e.target.value));
document.getElementById('newProfile').addEventListener('click', () => {
  const name = prompt('نام پروفایل جدید؟','دوست من');
  if (!name) return;
  const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  profiles.push({ id, name });
  saveProfiles();
  setCurrentProfile(id);
});
document.getElementById('deleteProfile').addEventListener('click', () => {
  if (!confirm('این پروفایل و داده‌هایش حذف شود؟')) return;
  profiles = profiles.filter(p => p.id !== currentProfileId);
  localStorage.removeItem(STORAGE_KEY + ':' + currentProfileId);
  saveProfiles();
  if (profiles.length === 0){
    const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    profiles.push({ id, name:'پروفایل من' });
  }
  setCurrentProfile(profiles[0].id);
});
