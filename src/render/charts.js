'use strict';
// Statische SVG-Charts aus echten Tagesschlusskursen (history.json). Kein Client-JS nötig.
const { raw, num, dateDM, MONTHS_SHORT } = require('../lib/util');

function slice(points, days) {
  if (!days) return points;
  return points.slice(Math.max(0, points.length - days));
}

function fmtTick(v, digits) {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(v);
}

function digitsFor(range) {
  if (range >= 1000) return 0;
  if (range >= 100) return 0;
  if (range >= 10) return 1;
  if (range >= 1) return 2;
  return 4;
}

// Kompakte Sparkline (z. B. Listen, Marktleiste)
function sparkline(points, { w = 96, h = 28, days = 22, id = 'sp' } = {}) {
  const pts = slice(points, days).map(p => p[1]);
  if (pts.length < 2) return raw(`<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"></svg>`);
  const min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1;
  const up = pts[pts.length - 1] >= pts[0];
  const step = w / (pts.length - 1);
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`).join(' ');
  return raw(`<svg class="spark ${up ? 'is-up' : 'is-down'}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`);
}

// Großer Linienchart mit Achsen, Fläche und Min/Max
function lineChart(points, { w = 760, h = 300, days = 0, id = 'ch', label = '', unit = '' } = {}) {
  const pts = slice(points, days);
  if (pts.length < 2) return raw(`<div class="chart-empty">Keine Kursdaten verfügbar.</div>`);
  const padL = 56, padR = 16, padT = 16, padB = 32;
  const iw = w - padL - padR, ih = h - padT - padB;
  const vals = pts.map(p => p[1]);
  let min = Math.min(...vals), max = Math.max(...vals);
  const padV = (max - min) * 0.08 || max * 0.01;
  min -= padV; max += padV;
  const span = max - min || 1;
  const x = (i) => padL + (i / (pts.length - 1)) * iw;
  const y = (v) => padT + ih - ((v - min) / span) * ih;
  const up = vals[vals.length - 1] >= vals[0];
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
  const area = `${path} L${x(pts.length - 1).toFixed(1)},${(padT + ih).toFixed(1)} L${padL},${(padT + ih).toFixed(1)} Z`;

  // Y-Achse: 5 Ticks
  const digits = digitsFor(max - min);
  const yTicks = [];
  for (let i = 0; i <= 4; i++) {
    const v = min + (span * i) / 4;
    yTicks.push(`<line x1="${padL}" x2="${w - padR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="chart-grid"/>` +
      `<text x="${padL - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" class="chart-tick">${fmtTick(v, digits)}</text>`);
  }
  // X-Achse: Monats-Ticks (oder Wochen bei kurzen Zeiträumen)
  const xTicks = [];
  let lastKey = '';
  pts.forEach((p, i) => {
    const d = new Date(p[0]);
    const key = pts.length > 70 ? `${d.getFullYear()}-${d.getMonth()}` : `${d.getFullYear()}-${d.getMonth()}-${Math.floor(d.getDate() / 7)}`;
    if (key !== lastKey && i > 0 && i < pts.length - 3) {
      lastKey = key;
      const lbl = pts.length > 70 ? MONTHS_SHORT[d.getMonth()] : dateDM(d);
      xTicks.push(`<text x="${x(i).toFixed(1)}" y="${h - 10}" text-anchor="middle" class="chart-tick">${lbl}</text>` +
        `<line x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${padT}" y2="${padT + ih}" class="chart-grid chart-grid-v"/>`);
    } else if (i === 0) { lastKey = key; }
  });
  const iMin = vals.indexOf(Math.min(...vals)), iMax = vals.indexOf(Math.max(...vals));
  const marker = (i, cls, anchor) => `<circle cx="${x(i).toFixed(1)}" cy="${y(vals[i]).toFixed(1)}" r="3.5" class="chart-dot ${cls}"/>` +
    `<text x="${x(i).toFixed(1)}" y="${(y(vals[i]) + (cls === 'is-max' ? -9 : 16)).toFixed(1)}" text-anchor="${anchor}" class="chart-label ${cls}">${fmtTick(vals[i], digits)}</text>`;
  const anchorFor = (i) => i < pts.length * 0.12 ? 'start' : i > pts.length * 0.88 ? 'end' : 'middle';
  const last = vals[vals.length - 1];
  const first = pts[0][0], lastDate = pts[pts.length - 1][0];
  const desc = `${label ? label + ': ' : ''}Kursverlauf vom ${dateDM(first)}${first.slice(0, 4)} bis ${dateDM(lastDate)}${lastDate.slice(0, 4)}, Tief ${fmtTick(vals[iMin], digits)}, Hoch ${fmtTick(vals[iMax], digits)}, Schluss ${fmtTick(last, digits)}${unit ? ' ' + unit : ''}.`;
  return raw(`<svg class="chart ${up ? 'is-up' : 'is-down'}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${desc.replace(/"/g, '&quot;')}">
<defs><linearGradient id="${id}-g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".22"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
${yTicks.join('')}${xTicks.join('')}
<path d="${area}" fill="url(#${id}-g)" class="chart-area"/>
<path d="${path}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" class="chart-line"/>
${marker(iMax, 'is-max', anchorFor(iMax))}${marker(iMin, 'is-min', anchorFor(iMin))}
<line x1="${padL}" x2="${w - padR}" y1="${y(last).toFixed(1)}" y2="${y(last).toFixed(1)}" class="chart-last"/>
<rect x="${w - padR - 62}" y="${(y(last) - 10).toFixed(1)}" width="62" height="20" rx="4" class="chart-last-bg"/>
<text x="${w - padR - 31}" y="${(y(last) + 4).toFixed(1)}" text-anchor="middle" class="chart-last-text">${fmtTick(last, digits)}</text>
</svg>`);
}

// Balkendiagramm für Performance-Vergleiche (z. B. Sektoren, Zeiträume)
function barChart(items, { w = 600, h = 220, unit = '%' } = {}) {
  if (!items.length) return raw('');
  const padL = 12, padR = 12, padT = 20, padB = 44;
  const iw = w - padL - padR, ih = h - padT - padB;
  const vals = items.map(i => i.value);
  const max = Math.max(0, ...vals), min = Math.min(0, ...vals);
  const span = max - min || 1;
  const y0 = padT + (max / span) * ih;
  const bw = iw / items.length;
  const bars = items.map((it, i) => {
    const v = it.value;
    const yTop = padT + ((max - Math.max(v, 0)) / span) * ih;
    const hgt = Math.abs(v) / span * ih;
    const cx = padL + i * bw + bw / 2;
    return `<rect x="${(cx - bw * 0.3).toFixed(1)}" y="${yTop.toFixed(1)}" width="${(bw * 0.6).toFixed(1)}" height="${Math.max(hgt, 1).toFixed(1)}" rx="3" class="bar ${v >= 0 ? 'is-up' : 'is-down'}"/>` +
      `<text x="${cx.toFixed(1)}" y="${(yTop - 6).toFixed(1)}" text-anchor="middle" class="bar-value">${v > 0 ? '+' : ''}${num(v, 1)} ${unit}</text>` +
      `<text x="${cx.toFixed(1)}" y="${h - 22}" text-anchor="middle" class="bar-label">${it.label}</text>` +
      (it.sub ? `<text x="${cx.toFixed(1)}" y="${h - 8}" text-anchor="middle" class="bar-sub">${it.sub}</text>` : '');
  }).join('');
  return raw(`<svg class="barchart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Balkendiagramm: ${items.map(i => `${i.label} ${i.value > 0 ? '+' : ''}${num(i.value, 1)} ${unit}`).join(', ')}">
<line x1="${padL}" x2="${w - padR}" y1="${y0.toFixed(1)}" y2="${y0.toFixed(1)}" class="chart-grid"/>${bars}</svg>`);
}

// 52-Wochen-Spanne als horizontaler Balken mit Marker
function rangeBar(low, high, current) {
  if (low == null || high == null || current == null || high <= low) return raw('<div class="range"><div class="range-track"></div></div>');
  const p = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100));
  return raw(`<div class="range" role="img" aria-label="Aktueller Kurs liegt bei ${num(p, 0)} % der 52-Wochen-Spanne"><div class="range-track"><span class="range-fill" style="width:${p.toFixed(1)}%"></span><span class="range-marker" style="left:${p.toFixed(1)}%"></span></div></div>`);
}

module.exports = { sparkline, lineChart, barChart, rangeBar };
