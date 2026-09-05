'use strict';
// Termine: Börsenfeiertage (echt), Wirtschaftskalender (wiederkehrende Veröffentlichungen, aus Regeln erzeugt),
// Unternehmenstermine (Platzhalter mit typischen Zeitfenstern). Alles relativ zum Build-Datum.
const { isoDate, addDays, startOfWeek } = require('../lib/util');

// --- Börsenfeiertage 2026 (Xetra/Frankfurt, NYSE/Nasdaq) ---
const holidays = [
  { date: '2026-01-01', name: 'Neujahr', exchanges: ['Xetra', 'NYSE'] },
  { date: '2026-01-19', name: 'Martin Luther King Day', exchanges: ['NYSE'] },
  { date: '2026-02-16', name: 'Presidents’ Day', exchanges: ['NYSE'] },
  { date: '2026-04-03', name: 'Karfreitag', exchanges: ['Xetra', 'NYSE'] },
  { date: '2026-04-06', name: 'Ostermontag', exchanges: ['Xetra'] },
  { date: '2026-05-01', name: 'Tag der Arbeit', exchanges: ['Xetra'] },
  { date: '2026-05-25', name: 'Memorial Day', exchanges: ['NYSE'] },
  { date: '2026-06-19', name: 'Juneteenth', exchanges: ['NYSE'] },
  { date: '2026-07-03', name: 'Independence Day (beobachtet)', exchanges: ['NYSE'] },
  { date: '2026-09-07', name: 'Labor Day', exchanges: ['NYSE'] },
  { date: '2026-11-26', name: 'Thanksgiving', exchanges: ['NYSE'] },
  { date: '2026-11-27', name: 'Tag nach Thanksgiving (Handelsschluss 19:00 Uhr MEZ)', exchanges: ['NYSE'], early: true },
  { date: '2026-12-24', name: 'Heiligabend', exchanges: ['Xetra'], note: 'NYSE: Handelsschluss 19:00 Uhr MEZ', earlyNyse: true },
  { date: '2026-12-25', name: '1. Weihnachtstag', exchanges: ['Xetra', 'NYSE'] },
  { date: '2026-12-26', name: '2. Weihnachtstag', exchanges: ['Xetra'] },
  { date: '2026-12-31', name: 'Silvester', exchanges: ['Xetra'] },
];

// --- Wirtschaftskalender: Regeln für wiederkehrende Veröffentlichungen ---
const countries = { DE: 'Deutschland', EU: 'Eurozone', US: 'USA', UK: 'Großbritannien', JP: 'Japan', CN: 'China', CH: 'Schweiz' };
// Hilfsfunktionen für Regeln
const nthWeekday = (y, m, weekday, n) => { const d = new Date(y, m, 1); let c = 0; while (true) { if (d.getDay() === weekday) { c++; if (c === n) return new Date(d); } d.setDate(d.getDate() + 1); } };
const lastWeekday = (y, m, weekday) => { const d = new Date(y, m + 1, 0); while (d.getDay() !== weekday) d.setDate(d.getDate() - 1); return d; };
const nearestWeekday = (y, m, day) => { const d = new Date(y, m, day); if (d.getDay() === 6) d.setDate(d.getDate() - 1); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d; };
const prevMonthName = (d) => ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][(d.getMonth() + 11) % 12];
const monthName = (d) => ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][d.getMonth()];

// Jede Regel liefert für ein (Jahr, Monat) 0..n Termine. impact 1–3.
const rules = [
  { c: 'US', title: 'Arbeitsmarktbericht (Nonfarm Payrolls)', time: '14:30', impact: 3, when: (y, m) => [nthWeekday(y, m, 5, 1)], period: (d) => prevMonthName(d), unit: 'Tsd. Stellen', why: 'Wichtigster US-Konjunkturindikator; bewegt Zinserwartungen, Dollar und Aktien.' },
  { c: 'US', title: 'Verbraucherpreise (CPI)', time: '14:30', impact: 3, when: (y, m) => [nearestWeekday(y, m, 12)], period: (d) => prevMonthName(d), unit: '% ggü. Vorjahr', why: 'Maßgeblich für die Zinspolitik der Fed.' },
  { c: 'US', title: 'Erzeugerpreise (PPI)', time: '14:30', impact: 2, when: (y, m) => [nearestWeekday(y, m, 13)], period: (d) => prevMonthName(d), unit: '% ggü. Vormonat' },
  { c: 'US', title: 'Einzelhandelsumsätze', time: '14:30', impact: 2, when: (y, m) => [nearestWeekday(y, m, 16)], period: (d) => prevMonthName(d), unit: '% ggü. Vormonat' },
  { c: 'US', title: 'Erstanträge auf Arbeitslosenhilfe', time: '14:30', impact: 2, weekly: 4, unit: 'Tsd.', period: () => 'Woche' },
  { c: 'US', title: 'ISM-Einkaufsmanagerindex Industrie', time: '16:00', impact: 3, when: (y, m) => [nthWeekday(y, m, 1, 1).getDate() === 1 ? nthWeekday(y, m, 1, 1) : firstBusinessDay(y, m)], period: (d) => prevMonthName(d), unit: 'Punkte' },
  { c: 'US', title: 'ISM-Einkaufsmanagerindex Dienstleistungen', time: '16:00', impact: 2, when: (y, m) => [addBusinessDays(firstBusinessDay(y, m), 2)], period: (d) => prevMonthName(d), unit: 'Punkte' },
  { c: 'US', title: 'Verbrauchervertrauen (Conference Board)', time: '16:00', impact: 2, when: (y, m) => [lastWeekday(y, m, 2)], period: (d) => monthName(d), unit: 'Punkte' },
  { c: 'US', title: 'Verbraucherstimmung Uni Michigan (vorläufig)', time: '16:00', impact: 1, when: (y, m) => [nthWeekday(y, m, 5, 2)], period: (d) => monthName(d), unit: 'Punkte' },
  { c: 'US', title: 'PCE-Kerninflation', time: '14:30', impact: 3, when: (y, m) => [lastWeekday(y, m, 5)], period: (d) => prevMonthName(d), unit: '% ggü. Vorjahr', why: 'Das bevorzugte Inflationsmaß der Fed.' },
  { c: 'US', title: 'BIP (Schätzung)', time: '14:30', impact: 2, when: (y, m) => [lastWeekday(y, m, 4)], period: (d) => 'Q' + (Math.floor(((d.getMonth() + 11) % 12) / 3) + 1), unit: '% annualisiert' },
  { c: 'US', title: 'Rohöllagerbestände (EIA)', time: '16:30', impact: 1, weekly: 3, unit: 'Mio. Barrel', period: () => 'Woche' },
  { c: 'US', title: 'Fed-Zinsentscheid (FOMC)', time: '20:00', impact: 3, fixed: ['2026-01-28', '2026-03-18', '2026-04-29', '2026-06-17', '2026-07-29', '2026-09-16', '2026-10-28', '2026-12-09'], unit: '% Leitzins', why: 'Pressekonferenz um 20:30 Uhr. Bewegt alle Anlageklassen.' },
  { c: 'US', title: 'FOMC-Sitzungsprotokoll', time: '20:00', impact: 2, fixedOffsetFrom: 'Fed-Zinsentscheid (FOMC)', offsetDays: 21 },
  { c: 'EU', title: 'EZB-Zinsentscheid', time: '14:15', impact: 3, fixed: ['2026-02-05', '2026-03-19', '2026-04-30', '2026-06-11', '2026-07-23', '2026-09-10', '2026-10-29', '2026-12-17'], unit: '% Einlagensatz', why: 'Pressekonferenz um 14:45 Uhr.' },
  { c: 'EU', title: 'Verbraucherpreise Eurozone (Schnellschätzung)', time: '11:00', impact: 3, when: (y, m) => [lastBusinessDayOrFirst(y, m)], period: (d) => monthName(d), unit: '% ggü. Vorjahr' },
  { c: 'EU', title: 'BIP Eurozone (Schnellschätzung)', time: '11:00', impact: 2, when: (y, m) => [1, 4, 7, 10].includes(m) ? [lastBusinessDayOrFirst(y, m)] : [], period: (d) => 'Q' + (Math.floor(((d.getMonth() + 11) % 12) / 3) + 1), unit: '% ggü. Vorquartal' },
  { c: 'EU', title: 'Einkaufsmanagerindex Eurozone (vorläufig)', time: '10:00', impact: 2, when: (y, m) => [nthWeekday(y, m, 4, 3)], period: (d) => monthName(d), unit: 'Punkte' },
  { c: 'EU', title: 'Arbeitslosenquote Eurozone', time: '11:00', impact: 1, when: (y, m) => [addBusinessDays(firstBusinessDay(y, m), 1)], period: (d) => prevMonthName(d), unit: '%' },
  { c: 'DE', title: 'ifo-Geschäftsklimaindex', time: '10:00', impact: 3, when: (y, m) => [nearestWeekday(y, m, 24)], period: (d) => monthName(d), unit: 'Punkte', why: 'Wichtigster deutscher Frühindikator, rund 9.000 befragte Unternehmen.' },
  { c: 'DE', title: 'ZEW-Konjunkturerwartungen', time: '11:00', impact: 2, when: (y, m) => [nthWeekday(y, m, 2, 2)], period: (d) => monthName(d), unit: 'Punkte' },
  { c: 'DE', title: 'Verbraucherpreise (vorläufig)', time: '14:00', impact: 2, when: (y, m) => [lastBusinessDayOrFirst(y, m, -1)], period: (d) => monthName(d), unit: '% ggü. Vorjahr' },
  { c: 'DE', title: 'Auftragseingang Industrie', time: '08:00', impact: 2, when: (y, m) => [addBusinessDays(firstBusinessDay(y, m), 3)], period: (d) => prevMonthName(d), unit: '% ggü. Vormonat' },
  { c: 'DE', title: 'Industrieproduktion', time: '08:00', impact: 2, when: (y, m) => [addBusinessDays(firstBusinessDay(y, m), 4)], period: (d) => prevMonthName(d), unit: '% ggü. Vormonat' },
  { c: 'DE', title: 'Einkaufsmanagerindex Industrie (vorläufig)', time: '09:30', impact: 2, when: (y, m) => [nthWeekday(y, m, 4, 3)], period: (d) => monthName(d), unit: 'Punkte' },
  { c: 'DE', title: 'GfK-Konsumklima', time: '08:00', impact: 1, when: (y, m) => [lastWeekday(y, m, 3)], period: (d) => monthName(addDays(d, 31)), unit: 'Punkte' },
  { c: 'DE', title: 'Arbeitsmarktbericht (Bundesagentur)', time: '09:55', impact: 1, when: (y, m) => [lastBusinessDayOrFirst(y, m, -1)], period: (d) => monthName(d), unit: 'Tsd. Arbeitslose' },
  { c: 'DE', title: 'BIP (Schnellmeldung)', time: '08:00', impact: 2, when: (y, m) => [1, 4, 7, 10].includes(m) ? [lastBusinessDayOrFirst(y, m)] : [], period: (d) => 'Q' + (Math.floor(((d.getMonth() + 11) % 12) / 3) + 1), unit: '% ggü. Vorquartal' },
  { c: 'UK', title: 'Verbraucherpreise', time: '08:00', impact: 2, when: (y, m) => [nthWeekday(y, m, 3, 3)], period: (d) => prevMonthName(d), unit: '% ggü. Vorjahr' },
  { c: 'UK', title: 'Bank-of-England-Zinsentscheid', time: '13:00', impact: 2, fixed: ['2026-02-05', '2026-03-19', '2026-04-30', '2026-06-18', '2026-07-30', '2026-09-17', '2026-11-05', '2026-12-17'], unit: '% Leitzins' },
  { c: 'JP', title: 'Bank-of-Japan-Zinsentscheid', time: '04:00', impact: 2, fixed: ['2026-01-23', '2026-03-19', '2026-04-28', '2026-06-16', '2026-07-31', '2026-09-18', '2026-10-30', '2026-12-18'], unit: '% Leitzins' },
  { c: 'CN', title: 'Einkaufsmanagerindex Industrie (offiziell)', time: '03:30', impact: 2, when: (y, m) => [lastBusinessDayOrFirst(y, m)], period: (d) => monthName(d), unit: 'Punkte' },
  { c: 'CN', title: 'Verbraucherpreise', time: '03:30', impact: 1, when: (y, m) => [nearestWeekday(y, m, 9)], period: (d) => prevMonthName(d), unit: '% ggü. Vorjahr' },
  { c: 'CN', title: 'BIP', time: '04:00', impact: 2, when: (y, m) => [0, 3, 6, 9].includes(m) ? [nearestWeekday(y, m, 16)] : [], period: (d) => 'Q' + (Math.floor(((d.getMonth() + 11) % 12) / 3) + 1), unit: '% ggü. Vorjahr' },
  { c: 'CH', title: 'SNB-Zinsentscheid', time: '09:30', impact: 1, fixed: ['2026-03-19', '2026-06-18', '2026-09-24', '2026-12-10'], unit: '% Leitzins' },
];
function firstBusinessDay(y, m) { const d = new Date(y, m, 1); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); return d; }
function addBusinessDays(d, n) { const x = new Date(d); let k = 0; while (k < n) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0 && x.getDay() !== 6) k++; } return x; }
function lastBusinessDayOrFirst(y, m, shift = 0) { const d = new Date(y, m + 1, 0); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1); if (shift) d.setDate(d.getDate() + shift); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1); return d; }

function economicEvents(from, to) {
  const out = [];
  const months = new Set();
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) months.add(`${d.getFullYear()}-${d.getMonth()}`);
  const fixedByTitle = {};
  for (const r of rules) {
    const dates = [];
    if (r.fixed) r.fixed.forEach(s => dates.push(new Date(s + 'T00:00:00')));
    if (r.when) for (const key of months) { const [y, m] = key.split('-').map(Number); r.when(y, m).forEach(d => dates.push(d)); }
    if (r.weekly != null) for (let d = new Date(from); d <= to; d = addDays(d, 1)) if (d.getDay() === r.weekly) dates.push(new Date(d));
    if (r.fixedOffsetFrom) (fixedByTitle[r.fixedOffsetFrom] || []).forEach(d => dates.push(addDays(d, r.offsetDays)));
    fixedByTitle[r.title] = dates;
    for (const d of dates) {
      if (d < from || d > to) continue;
      const iso = isoDate(d);
      if (holidays.some(h => h.date === iso && h.exchanges.includes(r.c === 'US' ? 'NYSE' : 'Xetra') && !h.early)) continue;
      out.push({ date: iso, time: r.time, country: r.c, countryName: countries[r.c], title: r.title, period: r.period ? r.period(d) : (r.fixed ? 'Sitzung' : ''), impact: r.impact, unit: r.unit || '', why: r.why || '' });
    }
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || b.impact - a.impact);
  return out;
}

// --- Unternehmenstermine (Platzhalter; Termine "voraussichtlich") ---
function companyEvents(ctx, from, to) {
  const { instruments } = ctx;
  const out = [];
  const stocks = instruments.stocks;
  // Quartalsberichte: Q3 im Fenster 20.10.–13.11., Q4/Geschäftsjahr Ende Feb–März, Q1 Ende April–Mitte Mai, Q2 Ende Juli–Mitte Aug
  const windows = [[9, 20, 10, 13, 'Quartalszahlen Q3'], [1, 20, 2, 20, 'Geschäftsjahreszahlen'], [3, 25, 4, 15, 'Quartalszahlen Q1'], [6, 24, 7, 14, 'Quartalszahlen Q2']];
  const y = from.getFullYear();
  const seeded = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  for (const w of windows) {
    for (const yy of [y, y + 1]) {
      const start = new Date(yy, w[0], w[1]), end = new Date(yy, w[2], w[3]);
      const span = Math.round((end - start) / 86400000);
      stocks.forEach((s) => {
        let d = addDays(start, seeded(s.slug + w[4]) % span);
        while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
        out.push({ date: isoDate(d), type: 'Quartalszahlen', title: w[4], company: s, note: 'voraussichtlich', tentative: true });
      });
    }
  }
  // Hauptversammlungen: April–Juni, Dividende (Ex-Tag) am Folgetag, Zahlung 3 Geschäftstage später
  stocks.forEach((s) => {
    for (const yy of [y, y + 1]) {
      const start = new Date(yy, 3, 8); let d = addDays(start, seeded(s.slug + 'hv') % 75);
      while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
      const q = ctx.quote(s.slug);
      const hasDiv = q && q.dividendYield && q.dividendYield > 0.2;
      out.push({ date: isoDate(d), type: 'Hauptversammlung', title: 'Ordentliche Hauptversammlung', company: s, note: 'voraussichtlich', tentative: true });
      if (hasDiv) {
        const perShare = q.price * q.dividendYield / 100;
        out.push({ date: isoDate(addDays(d, 1)), type: 'Dividende', title: 'Ex-Dividende', company: s, amount: perShare, yieldPct: q.dividendYield, note: 'Betrag: Vorjahresbasis', tentative: true });
      }
    }
  });
  return out.filter(e => { const d = new Date(e.date + 'T00:00:00'); return d >= from && d <= to; }).sort((a, b) => a.date.localeCompare(b.date) || a.company.name.localeCompare(b.company.name));
}

module.exports = function (ctx) {
  const now = ctx.now;
  const from = startOfWeek(addDays(now, -7));
  const to = addDays(startOfWeek(now), 7 * 8 - 1);
  const events = economicEvents(from, to);
  const company = companyEvents(ctx, addDays(startOfWeek(now), -7), addDays(now, 400));
  return { holidays, events, company, countries, range: { from, to }, economicRange: (a, b) => economicEvents(a, b) };
};
