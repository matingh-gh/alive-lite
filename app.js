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
  updateUI();
});

logBtn.addEventListener('click', () => {
  const ti = currentTargetInterval();
  const now = Date.now();
  const elapsedMin = state.lastSmokeAt ? minutesBetween(now, state.lastSmokeAt) : 9999;
  if (elapsedMin < ti){
    // نه! هنوز وقت نشده
    updateUI();
    return;
  }
  state.lastSmokeAt = now;
  state.history.push({ ts: now });
  save();
  updateUI();
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

// اولیـن رندر
updateUI();
