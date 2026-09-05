'use strict';
// Einmaliger Daten-Snapshot (kein Live-Abruf auf der Website):
//   node scripts/fetch-market-data.js
// Schreibt src/data/market-snapshot.json (Kurse) und src/data/history.json (Tagesschlusskurse, 1 Jahr).
// Quellen: TradingView-Scanner (Kurse, ohne Key) und Yahoo Finance Chart-API (Historie, ohne Key).

const fs = require('fs');
const path = require('path');
const instruments = require('../src/data/instruments.js');

const OUT_SNAPSHOT = path.join(__dirname, '..', 'src', 'data', 'market-snapshot.json');
const OUT_HISTORY = path.join(__dirname, '..', 'src', 'data', 'history.json');

const TV_COLUMNS = ['close', 'change', 'change_abs', 'open', 'high', 'low', 'volume', 'currency', 'description',
  'update_mode', 'type', 'market_cap_basic', 'price_52_week_high', 'price_52_week_low',
  'Perf.W', 'Perf.1M', 'Perf.3M', 'Perf.6M', 'Perf.YTD', 'Perf.Y', 'price_earnings_ttm', 'dividends_yield', 'dps_common_stock_prim_issue_fy',
  'sector', 'isin', 'SMA20', 'SMA50', 'SMA200', 'RSI', 'Volatility.D', 'average_volume_30d_calc', 'earnings_per_share_basic_ttm'];

async function fetchTV(tickers) {
  const res = await fetch('https://scanner.tradingview.com/global/scan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols: { tickers }, columns: TV_COLUMNS }),
  });
  if (!res.ok) throw new Error(`TradingView ${res.status}`);
  const json = await res.json();
  const out = {};
  for (const row of json.data) {
    const o = {};
    TV_COLUMNS.forEach((c, i) => { o[c] = row.d[i]; });
    out[row.s] = o;
  }
  return out;
}

async function fetchYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Yahoo ${symbol} ${res.status}`);
  const json = await res.json();
  const r = json.chart && json.chart.result && json.chart.result[0];
  if (!r) throw new Error(`Yahoo ${symbol}: keine Daten`);
  const ts = r.timestamp || [];
  const q = r.indicators.quote[0];
  const points = [];
  for (let i = 0; i < ts.length; i++) {
    if (q.close[i] == null) continue;
    const d = new Date(ts[i] * 1000);
    points.push([d.toISOString().slice(0, 10), +q.close[i].toFixed(4), q.open[i] != null ? +q.open[i].toFixed(4) : null,
      q.high[i] != null ? +q.high[i].toFixed(4) : null, q.low[i] != null ? +q.low[i].toFixed(4) : null, q.volume[i] || 0]);
  }
  return { meta: { currency: r.meta.currency, price: r.meta.regularMarketPrice, prevClose: r.meta.chartPreviousClose, name: r.meta.longName || r.meta.shortName }, points };
}

(async () => {
  const tickers = instruments.all.map(i => i.tv).filter(Boolean);
  console.log(`TradingView: ${tickers.length} Symbole …`);
  const tv = await fetchTV(tickers);
  const missing = tickers.filter(t => !tv[t]);
  if (missing.length) console.warn('  fehlend:', missing.join(', '));

  const history = {};
  const snapshot = { asOf: new Date().toISOString(), quotes: {} };
  for (const inst of instruments.all) {
    const q = inst.tv ? tv[inst.tv] : null;
    let h = null;
    if (inst.yahoo) {
      try { h = await fetchYahoo(inst.yahoo); }
      catch (e) { console.warn(`  Historie ${inst.slug}: ${e.message}`); }
      await new Promise(r => setTimeout(r, 250));
    }
    if (h) history[inst.slug] = { currency: h.meta.currency, points: h.points };
    const last = h && h.points.length ? h.points[h.points.length - 1] : null;
    const prev = h && h.points.length > 1 ? h.points[h.points.length - 2] : null;
    snapshot.quotes[inst.slug] = {
      price: q ? q.close : (last ? last[1] : null),
      changePct: q ? q.change : (last && prev ? ((last[1] / prev[1]) - 1) * 100 : null),
      changeAbs: q ? q.change_abs : (last && prev ? last[1] - prev[1] : null),
      open: q ? q.open : (last ? last[2] : null),
      high: q ? q.high : (last ? last[3] : null),
      low: q ? q.low : (last ? last[4] : null),
      volume: q ? q.volume : (last ? last[5] : null),
      avgVolume30d: q ? q.average_volume_30d_calc : null,
      marketCap: q ? q.market_cap_basic : null,
      high52w: q ? q.price_52_week_high : (h ? Math.max(...h.points.map(p => p[1])) : null),
      low52w: q ? q.price_52_week_low : (h ? Math.min(...h.points.map(p => p[1])) : null),
      perf: q ? { w: q['Perf.W'], m1: q['Perf.1M'], m3: q['Perf.3M'], m6: q['Perf.6M'], ytd: q['Perf.YTD'], y1: q['Perf.Y'] } : null,
      pe: q ? q.price_earnings_ttm : null,
      eps: q ? q.earnings_per_share_basic_ttm : null,
      dividendYield: q ? q.dividends_yield : null,
      dividendPerShare: q ? q.dps_common_stock_prim_issue_fy : null,
      sma20: q ? q.SMA20 : null, sma50: q ? q.SMA50 : null, sma200: q ? q.SMA200 : null, rsi: q ? q.RSI : null,
      volatilityDay: q ? q['Volatility.D'] : null,
      updateMode: q ? q.update_mode : (h ? 'eod' : null),
      currency: q ? q.currency : (h ? h.meta.currency : inst.currency),
      isin: q && q.isin ? q.isin : inst.isin || null,
    };
    console.log(`  ${inst.slug.padEnd(24)} ${String(snapshot.quotes[inst.slug].price).padEnd(12)} ${h ? h.points.length + ' Tage' : 'keine Historie'}`);
  }

  fs.writeFileSync(OUT_SNAPSHOT, JSON.stringify(snapshot, null, 1));
  fs.writeFileSync(OUT_HISTORY, JSON.stringify(history));
  console.log(`\nGeschrieben: ${OUT_SNAPSHOT}\n             ${OUT_HISTORY}`);
})().catch(e => { console.error(e); process.exit(1); });
