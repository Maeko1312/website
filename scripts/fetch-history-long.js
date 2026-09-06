'use strict';
// Ergänzende Kurshistorien für den interaktiven Chart (Yahoo Chart API, keyless, serverseitig mit UA-Header):
//   i1d  = Intraday-Verlauf des letzten Handelstags (15-Minuten-Kerzen)
//   w5y  = 5 Jahre Wochenschlusskurse
//   mMax = maximale Historie in Monatsschlusskursen
// Ausgabe: src/data/history-long.json  { slug: { currency, i1d: [[iso, close]], w5y: [[date, close]], mMax: [[date, close]] } }
// Aufruf: node scripts/fetch-history-long.js   (setzt NODE_OPTIONS=--use-system-ca voraus, falls TLS abgefangen wird)
const fs = require('fs');
const path = require('path');
const instruments = require('../src/data/instruments');
const OUT = path.join(__dirname, '..', 'src', 'data', 'history-long.json');

async function yahoo(symbol, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Yahoo ${symbol} ${range}/${interval}: ${res.status}`);
  const json = await res.json();
  const r = json.chart && json.chart.result && json.chart.result[0];
  if (!r) throw new Error(`Yahoo ${symbol}: keine Daten`);
  const ts = r.timestamp || [];
  const q = r.indicators.quote[0];
  const points = [];
  for (let i = 0; i < ts.length; i++) {
    if (q.close[i] == null) continue;
    points.push([ts[i], +q.close[i].toFixed(4)]);
  }
  return { currency: r.meta.currency, points, tz: r.meta.exchangeTimezoneName };
}

const iso = (t) => new Date(t * 1000).toISOString();
const day = (t) => iso(t).slice(0, 10);

(async () => {
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  let ok = 0, fail = 0;
  for (const inst of instruments.all) {
    if (!inst.yahoo) continue;
    const entry = { currency: null, i1d: null, w5y: null, mMax: null };
    try {
      const intra = await yahoo(inst.yahoo, '5d', '15m');
      // nur der letzte Handelstag (nach Datum im Instrument-Zeitraum gruppiert)
      const byDay = {};
      for (const [t, c] of intra.points) (byDay[day(t)] = byDay[day(t)] || []).push([iso(t), c]);
      const days = Object.keys(byDay).sort();
      entry.i1d = days.length ? byDay[days[days.length - 1]] : null;
      entry.currency = intra.currency;
    } catch (e) { console.warn('  i1d', inst.slug, e.message); }
    try { const w = await yahoo(inst.yahoo, '5y', '1wk'); entry.w5y = w.points.map(([t, c]) => [day(t), c]); entry.currency = entry.currency || w.currency; } catch (e) { console.warn('  w5y', inst.slug, e.message); }
    try { const m = await yahoo(inst.yahoo, 'max', '1mo'); entry.mMax = m.points.map(([t, c]) => [day(t), c]); entry.currency = entry.currency || m.currency; } catch (e) { console.warn('  mMax', inst.slug, e.message); }
    if (entry.i1d || entry.w5y || entry.mMax) { out[inst.slug] = entry; ok++; } else fail++;
    await new Promise(r => setTimeout(r, 150));
  }
  out._fetchedAt = new Date().toISOString();
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`history-long.json: ${ok} Instrumente, ${fail} ohne Daten → ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
