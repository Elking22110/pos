// نظام تسلسل موحّد لأرقام الفواتير والورديات (بدون عشوائية)

const STORAGE_KEY = 'counters';

function loadCounters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (_) {}
  return { invoice: 1, shift: 1 };
}

function saveCounters(counters) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
  } catch (_) {}
}

function pad(num, size = 8) {
  const s = String(num);
  return s.length >= size ? s : '0'.repeat(size - s.length) + s;
}

function extractMaxNumericId(items = [], key, prefix) {
  let max = 0;
  for (const it of items) {
    const id = it?.[key];
    if (typeof id !== 'string') continue;
    const m = id.startsWith(prefix + '-') ? id.slice(prefix.length + 1) : null;
    const n = m && /^\d+$/.test(m) ? parseInt(m, 10) : null;
    if (n && n > max) max = n;
  }
  return max;
}

function ensureInitialized() {
  const counters = loadCounters();
  // عند أول تشغيل، استنتاج أعلى رقم موجود إن وجد
  const hasInitialized = localStorage.getItem(STORAGE_KEY) !== null;
  if (!hasInitialized) {
    try {
      const sales = JSON.parse(localStorage.getItem('sales') || '[]');
      const shifts = JSON.parse(localStorage.getItem('shifts') || '[]');
      const maxInvoice = extractMaxNumericId(sales, 'id', 'INV');
      const maxShift = extractMaxNumericId(shifts, 'id', 'SH');
      counters.invoice = Math.max(1, maxInvoice + 1);
      counters.shift = Math.max(1, maxShift + 1);
      saveCounters(counters);
    } catch (_) {
      // في حال فشل القراءة نترك القيم الافتراضية
      saveCounters(counters);
    }
  }
  return counters;
}

export function getNextInvoiceId() {
  const counters = ensureInitialized();
  const idNum = counters.invoice++;
  saveCounters(counters);
  return `INV-${pad(idNum)}`;
}

export function getNextShiftId() {
  const counters = ensureInitialized();
  const idNum = counters.shift++;
  saveCounters(counters);
  return `SH-${pad(idNum)}`;
}

export function peekCounters() {
  return loadCounters();
}

export default {
  getNextInvoiceId,
  getNextShiftId,
  peekCounters,
};


