'use strict';
// Hilfsfunktionen für Templates: HTML-Escaping, deutsche Zahlen-/Datumsformate, Slugs.

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const attr = esc;

// Tagged template: ${...} wird escaped, ${raw(...)} nicht. Arrays werden gejoint.
class Raw { constructor(s) { this.s = String(s); } toString() { return this.s; } }
const raw = (s) => new Raw(s);
function html(strings, ...values) {
  let out = '';
  strings.forEach((str, i) => {
    out += str;
    if (i < values.length) out += render(values[i]);
  });
  return new Raw(out);
}
function render(v) {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  return esc(v);
}

// Deutsche Zahlenformate: 1.234,56
const nf = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
function num(n, digits = 2) {
  if (n == null || Number.isNaN(Number(n))) return '–';
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(n));
}
function pct(n, digits = 2) {
  if (n == null || Number.isNaN(Number(n))) return '–';
  const v = Number(n);
  const sign = v > 0 ? '+' : v < 0 ? '−' : '±';
  return `${sign}${num(Math.abs(v), digits)} %`;
}
function eur(n, digits = 2) { return n == null ? '–' : `${num(n, digits)} €`; }
function bigEur(n) {
  if (n == null) return '–';
  const v = Number(n);
  if (v >= 1e12) return `${num(v / 1e12, 2)} Bio. €`;
  if (v >= 1e9) return `${num(v / 1e9, 1)} Mrd. €`;
  if (v >= 1e6) return `${num(v / 1e6, 0)} Mio. €`;
  return eur(v, 0);
}

// Datum: dd.mm.yyyy, "Fr., 5. September 2026", ISO für <time>
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_SHORT = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const DAYS_SHORT = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
const pad = (n) => String(n).padStart(2, '0');
function toDate(d) { return d instanceof Date ? d : new Date(d); }
function isoDate(d) { d = toDate(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function dateShort(d) { d = toDate(d); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`; }
function dateDM(d) { d = toDate(d); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`; }
function dateLong(d) { d = toDate(d); return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function dateFull(d) { d = toDate(d); return `${DAYS[d.getDay()]}, ${dateLong(d)}`; }
function dateWeekday(d) { d = toDate(d); return `${DAYS_SHORT[d.getDay()]} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`; }
function time(d) { d = toDate(d); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function addDays(d, n) { const x = new Date(toDate(d)); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d) { const x = new Date(toDate(d)); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; }

// Relativ zum Build-Datum: "heute", "gestern", sonst dd.mm.
function relDate(d, now) {
  d = toDate(d); now = toDate(now);
  const a = new Date(d); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  const diff = Math.round((b - a) / 86400000);
  if (diff === 0) return 'heute';
  if (diff === 1) return 'gestern';
  if (diff < 7 && diff > 1) return `vor ${diff} Tagen`;
  return dateShort(d);
}

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// WKN aus einer deutschen ISIN: DE + 9-stellige NSIN (WKN mit führenden Nullen) + Prüfziffer
function wkn(isin) { if (!isin || !/^DE[0-9A-Z]{9}[0-9]$/.test(isin)) return null; const w = isin.slice(2, 11).replace(/^0+/, ''); return w.length === 6 ? w : null; }

function readTime(text) {
  const words = String(text).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

module.exports = {
  esc, attr, raw, html, render, Raw,
  num, pct, eur, bigEur, nf, nf0,
  MONTHS, MONTHS_SHORT, DAYS, DAYS_SHORT, pad,
  isoDate, dateShort, dateDM, dateLong, dateFull, dateWeekday, time, addDays, startOfWeek, relDate,
  slugify, readTime, wkn,
};
