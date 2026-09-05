'use strict';
const charts = require('../render/charts');
module.exports = function (ctx) {
  const { c, layout, util, instruments, content, config } = ctx;
  const { html, raw, num, pct, bigEur, dateShort, dateWeekday } = util;
  const q = (s) => ctx.quote(s) || {};
  const pages = [];
  const eurusd = q('eur-usd').price || 1;
  const typeHub = { index: ['Indizes', '/indizes'], stock: ['Aktien A–Z', '/aktien'], commodity: ['Rohstoffe', '/rohstoffe'], fx: ['Devisen', '/devisen'], crypto: ['Kryptowährungen', '/krypto'], bond: ['Anleihen & Zinsen', '/anleihen'] };
  const digitsFor = (i, v) => i.type === 'fx' ? 4 : i.type === 'bond' ? 3 : v >= 1000 ? 0 : 2;
  const fmtV = (i, v) => v == null ? '–' : num(v, digitsFor(i, v));
  const unitLong = (i) => i.type === 'index' ? 'Punkte' : i.type === 'stock' ? '€' : i.type === 'bond' ? '%' : i.type === 'fx' ? i.currency : i.currency === 'USD' ? 'US-$' : i.currency;

  for (const inst of instruments.all) {
    const x = q(inst.slug); const h = ctx.hist(inst.slug); const pts = h ? h.points : [];
    const dir = x.changePct > 0 ? 'up' : x.changePct < 0 ? 'down' : 'flat';
    const [hubName, hubPath] = typeHub[inst.type];
    const news = c.byInstrument(inst.slug, 6).filter(a => a.kind === 'news');
    const analyses = c.byInstrument(inst.slug, 4).filter(a => a.kind === 'analysis');
    const prevClose = pts.length > 1 ? pts[pts.length - 2][1] : null;
    const last10 = pts.slice(-10).reverse();
    const perfBars = x.perf ? [['1 W', x.perf.w], ['1 M', x.perf.m1], ['3 M', x.perf.m3], ['6 M', x.perf.m6], ['YTD', x.perf.ytd], ['1 J', x.perf.y1]].map(([l, v]) => ({ label: l, value: v })) : [];
    const chartTabs = [['1m', '1 Monat', 22], ['3m', '3 Monate', 66], ['6m', '6 Monate', 130], ['1y', '1 Jahr', 0]];
    const updateLabel = x.updateMode === 'streaming' ? 'nahezu Echtzeit' : x.updateMode === 'eod' ? 'Schlusskurs' : x.updateMode && x.updateMode.includes('900') ? '15 Min. verzögert' : x.updateMode && x.updateMode.includes('600') ? '10 Min. verzögert' : 'verzögert';

    // Kennzahlen
    const kv = [];
    kv.push(['Eröffnung', fmtV(inst, x.open)], ['Tageshoch', fmtV(inst, x.high)], ['Tagestief', fmtV(inst, x.low)], ['Vortagesschluss', fmtV(inst, prevClose)]);
    if (inst.type === 'stock' || inst.type === 'index') kv.push(['Volumen (Stück)', x.volume ? num(x.volume, 0) : '–'], ['Ø Volumen 30 Tage', x.avgVolume30d ? num(x.avgVolume30d, 0) : '–']);
    if (inst.type === 'stock') kv.push(['Marktkapitalisierung', bigEur(x.marketCap)], ['KGV (12 Monate)', x.pe ? num(x.pe, 1) : '–'], ['Gewinn je Aktie', x.eps != null ? num(x.eps, 2) + ' €' : '–'], ['Dividendenrendite', x.dividendYield ? num(x.dividendYield, 2) + ' %' : '–'], ['Branche', inst.sector], ['Index', inst.index], ['ISIN', x.isin || inst.isin || '–'], ['Börse', inst.exchange]);
    if (inst.type === 'index') kv.push(['ISIN', inst.isin || '–'], ['Berechnung', inst.exchange], ['Region', inst.region]);
    if (inst.type === 'commodity') kv.push(['Einheit', inst.unit], ['Metrisch', inst.unitMetric], ['Handelsplatz', inst.exchange]);
    if (inst.type === 'fx') kv.push(['Notierung', `1 ${inst.short.split('/')[0]} = ${fmtV(inst, x.price)} ${inst.short.split('/')[1]}`], ['Umgekehrt', `1 ${inst.short.split('/')[1]} = ${num(1 / x.price, 4)} ${inst.short.split('/')[0]}`]);
    if (inst.type === 'crypto') kv.push(['in Euro', num(x.price / eurusd, 2) + ' €'], ['Handel', 'rund um die Uhr, 7 Tage'], ['Referenzbörse', inst.exchange || 'Coinbase']);
    kv.push(['52-Wochen-Hoch', fmtV(inst, x.high52w)], ['52-Wochen-Tief', fmtV(inst, x.low52w)], ['200-Tage-Linie', fmtV(inst, x.sma200)], ['50-Tage-Linie', fmtV(inst, x.sma50)], ['20-Tage-Linie', fmtV(inst, x.sma20)], ['RSI (14)', x.rsi != null ? num(x.rsi, 1) : '–'], ['Volatilität (Tag)', x.volatilityDay != null ? num(x.volatilityDay, 2) + ' %' : '–']);

    // Typ-spezifische Zusatzblöcke
    let extra = '';
    if (inst.type === 'index' && (inst.slug === 'dax' || inst.slug === 'mdax')) {
      const members = inst.slug === 'dax' ? instruments.dax : instruments.mdax;
      extra = html`<section class="card">${c.sectionTitle(inst.slug === 'dax' ? 'Die 40 DAX-Werte' : 'MDAX-Werte (Auswahl)', { href: '/aktien', more: 'Aktien A–Z' })}${c.quoteTable(members, { cols: ['price', 'change', 'ytd', 'mcap', 'spark'] })}</section>`;
    } else if (inst.type === 'stock') {
      const peers = instruments.stocks.filter(s => s.sector === inst.sector && s.slug !== inst.slug);
      const idx = instruments.bySlug[inst.index.toLowerCase()];
      extra = html`${peers.length ? html`<section class="card">${c.sectionTitle(`Branche ${inst.sector}`)}${c.quoteTable([inst, ...peers], { cols: ['price', 'change', 'ytd', 'mcap', 'pe', 'dy'] })}</section>` : ''}
        ${idx ? html`<section class="card">${c.sectionTitle(`Vergleich mit dem ${idx.name}`)}<div class="table-wrap"><table class="quote-table is-compact"><thead><tr><th></th><th class="num">1 Woche</th><th class="num">1 Monat</th><th class="num">3 Monate</th><th class="num">YTD</th><th class="num">1 Jahr</th></tr></thead><tbody>${[inst, idx].map(i => { const p = q(i.slug).perf || {}; return html`<tr><td><a href="${c.url(i)}">${i.name}</a></td>${['w', 'm1', 'm3', 'ytd', 'y1'].map(k => html`<td class="num">${c.delta(p[k])}</td>`)}</tr>`; })}<tr><td class="muted">Differenz</td>${['w', 'm1', 'm3', 'ytd', 'y1'].map(k => { const d = ((q(inst.slug).perf || {})[k] || 0) - ((q(idx.slug).perf || {})[k] || 0); return html`<td class="num ${d >= 0 ? 'up' : 'down'}">${(d >= 0 ? '+' : '−') + num(Math.abs(d), 2)} Pp.</td>`; })}</tr></tbody></table></div></section>` : ''}`;
    } else if (inst.type === 'commodity') {
      const conv = inst.slug === 'gold' || inst.slug === 'silber' || inst.slug === 'platin'
        ? [['1 Feinunze', `${num(x.price, 2)} US-$`, `${num(x.price / eurusd, 2)} €`], ['1 Gramm', `${num(x.price / 31.1035, 2)} US-$`, `${num(x.price / eurusd / 31.1035, 2)} €`], ['1 Kilogramm', `${num(x.price / 31.1035 * 1000, 0)} US-$`, `${num(x.price / eurusd / 31.1035 * 1000, 0)} €`]]
        : inst.slug === 'brent' || inst.slug === 'wti' ? [['1 Barrel (158,99 l)', `${num(x.price, 2)} US-$`, `${num(x.price / eurusd, 2)} €`], ['1 Liter', `${num(x.price / 158.987, 4)} US-$`, `${num(x.price / eurusd / 158.987, 4)} €`], ['1 Hektoliter', `${num(x.price / 1.58987, 2)} US-$`, `${num(x.price / eurusd / 1.58987, 2)} €`]]
        : inst.slug === 'kupfer' ? [['1 Pfund (453,6 g)', `${num(x.price, 4)} US-$`, `${num(x.price / eurusd, 4)} €`], ['1 Kilogramm', `${num(x.price / 0.45359, 2)} US-$`, `${num(x.price / eurusd / 0.45359, 2)} €`], ['1 Tonne', `${num(x.price / 0.45359 * 1000, 0)} US-$`, `${num(x.price / eurusd / 0.45359 * 1000, 0)} €`]]
        : [['1 MMBtu (≈ 293 kWh)', `${num(x.price, 3)} US-$`, `${num(x.price / eurusd, 3)} €`], ['1 Kilowattstunde', `${num(x.price / 293.071 * 100, 3)} US-ct`, `${num(x.price / eurusd / 293.071 * 100, 3)} ct`], ['1 Megawattstunde', `${num(x.price / 0.293071, 2)} US-$`, `${num(x.price / eurusd / 0.293071, 2)} €`]];
      extra = html`<section class="card">${c.sectionTitle('Umrechnung')}<p class="section-sub">Wechselkurs EUR/USD ${num(eurusd, 4)}</p><div class="table-wrap"><table class="quote-table is-compact"><thead><tr><th>Menge</th><th class="num">in US-Dollar</th><th class="num">in Euro</th></tr></thead><tbody>${conv.map(r => html`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td></tr>`)}</tbody></table></div></section>
        <section class="card">${c.sectionTitle('Weitere Rohstoffe', { href: '/rohstoffe', more: 'Alle' })}${c.quoteTable(instruments.commodities.filter(i => i.slug !== inst.slug), { cols: ['price', 'change', 'ytd'], compact: true, sortable: false })}</section>`;
    } else if (inst.type === 'fx') {
      const [base, quote] = inst.short.split('/');
      const amounts = [1, 10, 100, 1000, 10000];
      extra = html`<section class="card">${c.sectionTitle('Umrechnungstabelle')}<div class="grid-2"><div class="table-wrap"><table class="quote-table is-compact"><thead><tr><th class="num">${base}</th><th class="num">${quote}</th></tr></thead><tbody>${amounts.map(a => html`<tr><td class="num">${num(a, 0)}</td><td class="num">${num(a * x.price, 2)}</td></tr>`)}</tbody></table></div><div class="table-wrap"><table class="quote-table is-compact"><thead><tr><th class="num">${quote}</th><th class="num">${base}</th></tr></thead><tbody>${amounts.map(a => html`<tr><td class="num">${num(a, 0)}</td><td class="num">${num(a / x.price, 2)}</td></tr>`)}</tbody></table></div></div><p style="margin-top:12px"><a class="btn btn-dark" href="/werkzeuge/waehrungsrechner">Beliebige Beträge im Währungsrechner</a></p></section>
        <section class="card">${c.sectionTitle('Weitere Währungspaare', { href: '/devisen', more: 'Alle' })}${c.quoteTable(instruments.fx.filter(i => i.slug !== inst.slug), { cols: ['price', 'change', 'ytd'], compact: true, sortable: false })}</section>`;
    } else if (inst.type === 'crypto') {
      extra = html`<section class="card">${c.sectionTitle('Weitere Kryptowährungen', { href: '/krypto', more: 'Übersicht' })}${c.quoteTable(instruments.crypto.filter(i => i.slug !== inst.slug), { cols: ['price', 'change', 'ytd', 'y1'], compact: true, sortable: false })}<p class="small muted" style="margin-top:10px">Steuerhinweis: Gewinne nach einem Jahr Haltedauer steuerfrei, darunter Freigrenze 1.000 € pro Jahr. <a href="/wissen/steuern">Mehr</a></p></section>`;
    } else if (inst.type === 'bond') {
      extra = html`<section class="card">${c.sectionTitle('Weitere Renditen', { href: '/anleihen', more: 'Übersicht' })}${c.quoteTable(instruments.bonds.filter(i => i.slug !== inst.slug), { cols: ['price', 'change', 'ytd'], compact: true, sortable: false })}<p class="small muted" style="margin-top:10px">Ein Basispunkt (Bp.) ist ein Hundertstel Prozentpunkt. Steigt die Rendite, fällt der Kurs bereits umlaufender Anleihen.</p></section>`;
    }

    const body = html`<div class="container page">
      ${c.breadcrumb([['Märkte', '/maerkte'], [hubName, hubPath], [inst.name, c.url(inst)]])}
      <div class="quote-hero">
        <div><span class="kicker" style="color:rgba(255,255,255,.7)">${c.typeLabel(inst)}${inst.type === 'stock' ? ` · ${inst.index} · ${inst.sector}` : inst.region ? ` · ${inst.region}` : ''}</span><h1>${inst.name}</h1><div class="ids">${inst.short && inst.short !== inst.name ? html`<span>Kürzel <strong>${inst.short}</strong></span>` : ''}${x.isin || inst.isin ? html`<span>ISIN <strong>${x.isin || inst.isin}</strong></span>` : ''}<span>${inst.type === 'fx' || inst.type === 'crypto' ? 'Referenz' : 'Handelsplatz'} <strong>${inst.exchange || 'Interbanken'}</strong></span><span>Währung <strong>${inst.type === 'index' ? (inst.currency || '–') : inst.type === 'bond' ? 'Rendite in %' : unitLong(inst)}</strong></span></div></div>
        <div class="quote-price"><div class="price">${fmtV(inst, x.price)}<small>${inst.type === 'stock' ? '€' : inst.type === 'index' ? 'Pkt.' : inst.type === 'bond' ? '%' : inst.type === 'fx' ? inst.short.split('/')[1] : 'US-$'}</small></div><div class="change"><span class="${dir}">${x.changeAbs != null ? (x.changeAbs > 0 ? '+' : x.changeAbs < 0 ? '−' : '') + num(Math.abs(x.changeAbs), digitsFor(inst, x.price) === 0 ? 2 : digitsFor(inst, x.price)) : '–'}</span><span class="${dir}">${pct(x.changePct)}</span></div><div class="asof">${layout.asOfLabel} · ${updateLabel}${inst.type === 'crypto' ? ` · ${num(x.price / eurusd, 2)} €` : ''}</div></div>
        <div class="quote-actions">${c.watchButton(inst.slug)}<button class="btn btn-ghost" type="button" data-share>Teilen</button>${inst.type === 'stock' ? html`<a class="btn btn-ghost" href="/termine/unternehmen#${inst.slug}">Termine</a>` : ''}<a class="btn btn-ghost" href="/analysen">Analysen</a><span class="small" style="color:rgba(255,255,255,.6);margin-left:auto">${inst.blurb}</span></div>
      </div>
      <div class="layout" style="margin-top:24px">
        <div class="stack">
          <section class="card" aria-labelledby="h-chart">
            <div class="section-title"><h2 id="h-chart">Chart</h2>${pts.length ? html`<div class="tabs is-pills" data-tabs="chart-panels" data-tabs-hash role="tablist" style="margin:0;border:0">${chartTabs.map(([k, l], i) => html`<button class="tab ${i === 3 ? 'is-active' : ''}" type="button" role="tab" data-tab="${k}">${l}</button>`)}</div>` : ''}</div>
            ${pts.length ? html`<div id="chart-panels" class="chart-wrap">${chartTabs.map(([k, l, days], i) => html`<div data-panel="${k}"${i !== 3 ? raw(' hidden') : ''}>${charts.lineChart(pts, { days, id: `ch-${k}`, label: inst.name, unit: unitLong(inst) })}<div class="chart-legend"><span>${l}: ${(() => { const s = days ? pts.slice(-days) : pts; return s.length > 1 ? c.delta((s[s.length - 1][1] / s[0][1] - 1) * 100) : ''; })()}</span><span>Tagesschlusskurse · ${dateShort(new Date(pts[0][0]))} bis ${dateShort(new Date(pts[pts.length - 1][0]))} · Quelle: Börsendaten</span></div></div>`)}</div>` : html`<div class="chart-empty">Für Renditen liegen keine Tagesschlusskurse als Zeitreihe vor. Die Wochen-, Monats- und Jahresveränderung finden Sie unten.</div>`}
          </section>
          <section class="card">${c.sectionTitle('Performance')}${c.perfGrid(x)}${perfBars.length ? charts.barChart(perfBars, { w: 760, h: 200 }) : ''}</section>
          <section class="card">${c.sectionTitle('Kennzahlen')}<dl class="kv">${kv.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
            ${x.high52w && x.low52w ? html`<div style="margin-top:16px"><span class="kicker">52-Wochen-Spanne</span>${charts.rangeBar(x.low52w, x.high52w, x.price)}<div class="range-labels"><span>Tief ${fmtV(inst, x.low52w)}</span><span>Aktuell ${fmtV(inst, x.price)}</span><span>Hoch ${fmtV(inst, x.high52w)}</span></div></div>` : ''}
          </section>
          ${last10.length ? html`<section class="card">${c.sectionTitle('Historische Kurse')}<div class="table-wrap"><table class="quote-table is-compact"><thead><tr><th>Datum</th><th class="num">Schluss</th><th class="num">±%</th><th class="num hide-m">Eröffnung</th><th class="num hide-m">Hoch</th><th class="num hide-m">Tief</th>${inst.type === 'stock' || inst.type === 'index' ? html`<th class="num hide-m">Volumen</th>` : ''}</tr></thead><tbody>${last10.map((p, i) => { const prev = pts[pts.length - 1 - i - 1]; const chg = prev ? (p[1] / prev[1] - 1) * 100 : null; return html`<tr><td>${dateWeekday(new Date(p[0] + 'T00:00:00'))}${p[0].slice(0, 4)}</td><td class="num">${fmtV(inst, p[1])}</td><td class="num">${c.delta(chg)}</td><td class="num hide-m">${fmtV(inst, p[2])}</td><td class="num hide-m">${fmtV(inst, p[3])}</td><td class="num hide-m">${fmtV(inst, p[4])}</td>${inst.type === 'stock' || inst.type === 'index' ? html`<td class="num hide-m">${p[5] ? num(p[5], 0) : '–'}</td>` : ''}</tr>`; })}</tbody></table></div></section>` : ''}
          ${extra}
          ${news.length || analyses.length ? html`<section class="grid-2">${news.length ? html`<div class="card">${c.sectionTitle('Nachrichten', { href: '/nachrichten', more: 'Alle' })}${c.storyList(news, { variant: 'is-compact' })}</div>` : ''}${analyses.length ? html`<div class="card">${c.sectionTitle('Analysen', { href: '/analysen', more: 'Alle' })}${c.analysisList(analyses)}</div>` : ''}</section>` : ''}
          <p class="disclaimer">Kurse und Kennzahlen ${layout.asOfLabel}, ${updateLabel}. Gleitende Durchschnitte einfach (SMA) auf Tagesschlussbasis, RSI über 14 Tage. Keine Gewähr für Richtigkeit und Vollständigkeit; keine Anlageberatung. Quellen und Methodik unter <a href="/methodik">Methodik & Datenquellen</a>.</p>
        </div>
        <aside>
          ${c.sideCard('Über ' + inst.name, html`<p class="small">${inst.blurb}</p>${inst.type === 'stock' ? html`<p class="small muted" style="margin-top:8px">Weitere ${inst.index}-Werte finden Sie auf der <a href="/kurs/${inst.index.toLowerCase()}">${inst.index}-Seite</a> und unter <a href="/aktien">Aktien A–Z</a>.</p>` : ''}`)}
          ${c.sideIndices()}
          ${inst.type === 'stock' ? c.sideMovers() : c.sideAnalysis(5)}
          ${c.newsletterBox({ compact: true })}
        </aside>
      </div>
    </div>`;
    const title = inst.type === 'stock' ? `${inst.name} Aktie: Kurs, Chart, Kennzahlen` : inst.type === 'index' ? `${inst.name}: Aktueller Stand, Chart, ${inst.slug === 'dax' || inst.slug === 'mdax' ? 'Mitglieder' : 'Kennzahlen'}` : inst.type === 'bond' ? `${inst.name}: Aktuelle Rendite, Entwicklung, Kennzahlen` : inst.type === 'fx' ? `${inst.short}: Kurs, Chart, Umrechnung` : `${inst.name}: Kurs, Chart, Umrechnung`;
    const description = `${inst.name} aktuell: ${fmtV(inst, x.price)} ${unitLong(inst)} (${pct(x.changePct)}). Chart über 1 Jahr, 52-Wochen-Spanne, Performance und Kennzahlen. ${inst.blurb}`;
    pages.push({ path: c.url(inst), html: layout.page({ title, description, path: c.url(inst), body, section: 'maerkte' }) });
  }
  return pages;
};
