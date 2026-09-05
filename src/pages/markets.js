'use strict';
const charts = require('../render/charts');
module.exports = function (ctx) {
  const { c, layout, util, instruments, content } = ctx;
  const { html, raw, num, pct, bigEur } = util;
  const q = (s) => ctx.quote(s) || {};
  const pages = [];
  const crumb = (t, p) => [['Märkte', '/maerkte'], [t, p]];
  const sub = [['Überblick', '/maerkte'], ['Indizes', '/indizes'], ['Aktien A–Z', '/aktien'], ['Rohstoffe', '/rohstoffe'], ['Devisen', '/devisen'], ['Krypto', '/krypto'], ['Anleihen & Zinsen', '/anleihen'], ['Rankings', '/rankings']];
  const add = (path, title, description, body, kicker = 'Märkte') => { content.searchablePages.push({ title, path, kicker, description }); pages.push({ path, html: layout.page({ title, description, path, body, section: 'maerkte' }) }); };
  const eurusd = q('eur-usd').price || 1;

  // ---------- Marktüberblick ----------
  {
    const sectors = {};
    for (const s of instruments.stocks) { const x = q(s.slug); if (x.changePct == null) continue; (sectors[s.sector] = sectors[s.sector] || []).push(x.changePct); }
    const sectorItems = Object.entries(sectors).filter(([, v]) => v.length >= 2).map(([k, v]) => ({ label: k.length > 14 ? k.slice(0, 13) + '…' : k, sub: `${v.length} Werte`, value: v.reduce((a, b) => a + b, 0) / v.length })).sort((a, b) => b.value - a.value).slice(0, 8);
    const m = c.movers(5);
    const up = instruments.dax.filter(s => (q(s.slug).changePct || 0) > 0).length, down = instruments.dax.filter(s => (q(s.slug).changePct || 0) < 0).length;
    const latestReport = content.articles.find(a => a.category === 'marktberichte');
    const body = html`<div class="container page">
      ${c.breadcrumb([['Märkte', '/maerkte']])}
      ${c.pageHead({ kicker: 'Märkte', title: 'Marktüberblick', lead: html`Alle wichtigen Kurse auf einer Seite: deutsche und internationale Indizes, Gewinner und Verlierer, Rohstoffe, Devisen, Krypto und Zinsen. ${layout.asOfLabel}.` })}
      ${c.subnav(sub, '/maerkte')}
      <div class="number-tiles" style="margin-bottom:24px">
        <div class="number-tile"><span>DAX</span><strong class="${q('dax').changePct >= 0 ? 'up' : 'down'}">${num(q('dax').price, 0)}</strong><small>${pct(q('dax').changePct)} · Tagesspanne ${num(q('dax').low, 0)}–${num(q('dax').high, 0)}</small></div>
        <div class="number-tile"><span>Marktbreite DAX</span><strong>${up} <span class="muted" style="font-size:14px">im Plus</span> · ${down} <span class="muted" style="font-size:14px">im Minus</span></strong><small>${instruments.dax.length - up - down} unverändert</small></div>
        <div class="number-tile"><span>Euro / US-Dollar</span><strong>${num(eurusd, 4)}</strong><small>${pct(q('eur-usd').changePct)} · Bund 10J ${num(q('bund-10j').price, 2)} %</small></div>
        <div class="number-tile"><span>Volatilität (VIX)</span><strong>${num(q('vix').price, 2)}</strong><small>${q('vix').price < 15 ? 'ruhiger Markt' : q('vix').price < 25 ? 'erhöhte Nervosität' : 'Stressphase'} · ${pct(q('vix').changePct)}</small></div>
      </div>
      <section style="margin-bottom:28px">${c.sectionTitle('Indizes', { href: '/indizes', more: 'Alle Indizes' })}${c.board(['dax', 'mdax', 'sdax', 'tecdax', 'euro-stoxx-50', 'sp-500', 'nasdaq-100', 'dow-jones', 'nikkei-225', 'vix'])}</section>
      <div class="layout no-sticky">
        <div class="stack">
          <section class="movers"><div class="card">${c.sectionTitle('Tagesgewinner', { href: '/rankings#gewinner', more: 'Ranking' })}${c.quoteTable(m.gainers, { cols: ['price', 'change', 'ytd'], compact: true, sortable: false })}</div><div class="card">${c.sectionTitle('Tagesverlierer', { href: '/rankings#verlierer', more: 'Ranking' })}${c.quoteTable(m.losers, { cols: ['price', 'change', 'ytd'], compact: true, sortable: false })}</div></section>
          <section class="card">${c.sectionTitle('Branchen im DAX und MDAX heute')}<p class="section-sub">Durchschnittliche Tagesveränderung der Aktien je Branche (nur Branchen mit mindestens zwei Werten).</p>${charts.barChart(sectorItems, { w: 760, h: 240 })}</section>
          <section class="card">${c.sectionTitle('DAX-Werte', { href: '/aktien', more: 'Alle Aktien' })}${c.quoteTable(instruments.dax, { cols: ['price', 'change', 'ytd', 'mcap', 'spark'] })}</section>
        </div>
        <aside>
          ${latestReport ? c.sideCard('Marktbericht', html`${c.storyList([latestReport], { thumb: true, excerpt: true })}`, { href: '/nachrichten/marktberichte', more: 'Alle Berichte' }) : ''}
          <section class="card">${c.sectionTitle('Rohstoffe', { href: '/rohstoffe', more: 'Alle' })}${c.miniQuotes(instruments.commodities)}</section>
          <section class="card">${c.sectionTitle('Devisen', { href: '/devisen', more: 'Alle' })}${c.miniQuotes(instruments.fx)}</section>
          <section class="card">${c.sectionTitle('Krypto & Zinsen', { href: '/anleihen', more: 'Zinsen' })}${c.miniQuotes([...instruments.crypto, ...instruments.bonds])}</section>
        </aside>
      </div></div>`;
    add('/maerkte', 'Marktüberblick', 'DAX, MDAX, internationale Indizes, Gewinner und Verlierer, Rohstoffe, Devisen, Krypto und Zinsen auf einen Blick.', body);
  }

  // ---------- Indizes ----------
  {
    const body = html`<div class="container page">
      ${c.breadcrumb(crumb('Indizes', '/indizes'))}
      ${c.pageHead({ kicker: 'Märkte', title: 'Indizes', lead: 'Deutsche und internationale Aktienindizes mit Tagesveränderung, Performance und Ein-Monats-Chart. Klicken Sie auf einen Index für Chart, Kennzahlen und Mitglieder.' })}
      ${c.subnav(sub, '/indizes')}
      <div class="layout no-sticky"><div class="stack">
        <section class="card">${c.sectionTitle('Deutschland')}${c.quoteTable(instruments.indices.filter(i => i.region === 'Deutschland'), { cols: ['price', 'change', 'w', 'm1', 'ytd', 'y1', 'spark'] })}</section>
        <section class="card">${c.sectionTitle('Europa & Welt')}${c.quoteTable(instruments.indices.filter(i => i.region !== 'Deutschland'), { cols: ['price', 'change', 'w', 'm1', 'ytd', 'y1', 'spark'] })}</section>
        <section class="grid-2">${instruments.indices.slice(0, 6).map(i => html`<div class="card"><h3 style="margin-bottom:6px"><a href="${c.url(i)}">${i.name}</a></h3><p class="small muted" style="margin-bottom:10px">${i.blurb}</p>${ctx.hist(i.slug) ? charts.sparkline(ctx.hist(i.slug).points, { days: 250, w: 320, h: 48 }) : ''}<p class="small muted" style="margin-top:6px">12 Monate · ${pct(q(i.slug).perf && q(i.slug).perf.y1)}</p></div>`)}</section>
      </div><aside>${c.sideAnalysis(6)}${c.sideCard('Was ist ein Performanceindex?', html`<p class="small">Der DAX ist ein <a href="/wissen/boersenlexikon#performanceindex">Performanceindex</a>: Dividenden werden rechnerisch wieder angelegt. Der EURO STOXX 50 und der S&P 500 sind in der Standardvariante Kursindizes – der Vergleich der reinen Punktestände hinkt also.</p>`)}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add('/indizes', 'Indizes', 'DAX, MDAX, SDAX, TecDAX, EURO STOXX 50, S&P 500, Nasdaq 100, Dow Jones und Nikkei mit Kursen, Performance und Charts.', body);
  }

  // ---------- Aktien A–Z ----------
  {
    const stocks = instruments.stocks.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const groups = {};
    for (const s of stocks) { const L = s.name[0].toUpperCase(); (groups[L] = groups[L] || []).push(s); }
    const body = html`<div class="container page">
      ${c.breadcrumb(crumb('Aktien A–Z', '/aktien'))}
      ${c.pageHead({ kicker: 'Märkte', title: 'Aktien A–Z', lead: html`Alle ${stocks.length} beobachteten Aktien aus DAX und MDAX mit Kurs, Tagesveränderung, Performance seit Jahresbeginn, Marktkapitalisierung, KGV und Dividendenrendite. Spalten sind sortierbar.` })}
      ${c.subnav(sub, '/aktien')}
      <div class="filter-bar"><label class="label" for="stock-filter">Suchen</label><div class="control" style="flex:1;max-width:360px"><input id="stock-filter" type="search" placeholder="Name, Branche oder ISIN …" data-filter-input="stock-list" autocomplete="off"></div><span class="small muted"><span data-filter-count="stock-list">${stocks.length}</span> Aktien</span></div>
      <nav class="az" aria-label="Alphabetische Navigation">${letters.map(L => groups[L] ? html`<a href="#buchstabe-${L}">${L}</a>` : html`<span aria-hidden="true">${L}</span>`)}</nav>
      <div id="stock-list">
        ${letters.filter(L => groups[L]).map(L => html`<section data-filter-group><h2 class="letter-head" id="buchstabe-${L}">${L}</h2><div class="table-wrap"><table class="quote-table" data-sortable><thead><tr><th>Name</th><th class="num">Kurs</th><th class="num">±%</th><th class="num hide-m">YTD</th><th class="num hide-m">Marktkap.</th><th class="num hide-m">KGV</th><th class="num hide-m">Div.-Rend.</th><th class="hide-m">Branche</th><th data-nosort></th></tr></thead><tbody>${groups[L].map(s => { const x = q(s.slug); return html`<tr data-filter-item="${s.name} ${s.sector} ${x.isin || s.isin || ''} ${s.index}"><td><a href="${c.url(s)}">${s.name}</a><span class="sub">${s.index} · ${x.isin || s.isin || ''}</span></td><td class="num" data-v="${x.price}">${num(x.price)} €</td><td class="num" data-v="${x.changePct}">${c.delta(x.changePct)}</td><td class="num hide-m" data-v="${x.perf ? x.perf.ytd : ''}">${c.delta(x.perf && x.perf.ytd)}</td><td class="num hide-m" data-v="${x.marketCap || 0}">${bigEur(x.marketCap)}</td><td class="num hide-m" data-v="${x.pe || 0}">${x.pe ? num(x.pe, 1) : '–'}</td><td class="num hide-m" data-v="${x.dividendYield || 0}">${x.dividendYield ? num(x.dividendYield, 2) + ' %' : '–'}</td><td class="hide-m muted">${s.sector}</td><td class="right">${c.watchButton(s.slug, true)}</td></tr>`; })}</tbody></table></div></section>`)}
        <div class="empty" data-filter-empty="stock-list" hidden>Keine Aktie passt zu Ihrer Eingabe. Über die <a href="/suche">Suche</a> finden Sie auch Indizes, Rohstoffe und Lexikoneinträge.</div>
      </div>
      <p class="small muted" style="margin-top:16px">${layout.asOfLabel}. Xetra-Schlusskurse, KGV und Dividendenrendite auf Basis der letzten zwölf Monate. Indexzugehörigkeit zum Stichtag – Änderungen durch die Deutsche Börse werden quartalsweise übernommen.</p>
    </div>`;
    add('/aktien', 'Aktien A–Z', 'Alle DAX- und MDAX-Aktien alphabetisch mit Kurs, Veränderung, Marktkapitalisierung, KGV und Dividendenrendite.', body);
  }

  // ---------- Rohstoffe ----------
  {
    const g = q('gold'), s = q('silber'), b = q('brent'), k = q('kupfer');
    const body = html`<div class="container page">
      ${c.breadcrumb(crumb('Rohstoffe', '/rohstoffe'))}
      ${c.pageHead({ kicker: 'Märkte', title: 'Rohstoffe', lead: 'Edelmetalle, Energie und Industriemetalle – notiert in US-Dollar wie an den Weltmärkten, umgerechnet in Euro und metrische Einheiten, wie sie hier gebraucht werden.' })}
      ${c.subnav(sub, '/rohstoffe')}
      <div class="layout no-sticky"><div class="stack">
        <section class="card">${c.sectionTitle('Kurse')}${c.quoteTable(instruments.commodities, { cols: ['price', 'change', 'w', 'm1', 'ytd', 'y1', 'spark'] })}<p class="small muted" style="margin-top:8px">Einheiten: Edelmetalle US-$ je Feinunze (31,1035 g), Öl US-$ je Barrel (158,99 l), Kupfer US-$ je Pfund (453,6 g), Erdgas US-$ je MMBtu (≈ 293 kWh). Öl- und Gaspreise beziehen sich auf den nächstfälligen Terminkontrakt.</p></section>
        <section class="card">${c.sectionTitle('Umgerechnet in Euro und metrische Einheiten')}<p class="section-sub">Wechselkurs EUR/USD ${num(eurusd, 4)} · ${layout.asOfLabel}</p>
          <div class="table-wrap"><table class="quote-table"><thead><tr><th>Rohstoff</th><th class="num">Weltmarkt (US-$)</th><th class="num">in Euro</th><th class="num">metrisch</th></tr></thead><tbody>
            <tr><td><a href="/kurs/gold">Gold</a></td><td class="num">${num(g.price, 2)} / oz</td><td class="num">${num(g.price / eurusd, 2)} € / oz</td><td class="num">${num(g.price / eurusd / 31.1035, 2)} € / g · ${num(g.price / eurusd / 31.1035 * 1000, 0)} € / kg</td></tr>
            <tr><td><a href="/kurs/silber">Silber</a></td><td class="num">${num(s.price, 3)} / oz</td><td class="num">${num(s.price / eurusd, 2)} € / oz</td><td class="num">${num(s.price / eurusd / 31.1035, 3)} € / g · ${num(s.price / eurusd / 31.1035 * 1000, 0)} € / kg</td></tr>
            <tr><td><a href="/kurs/platin">Platin</a></td><td class="num">${num(q('platin').price, 2)} / oz</td><td class="num">${num(q('platin').price / eurusd, 2)} € / oz</td><td class="num">${num(q('platin').price / eurusd / 31.1035, 2)} € / g</td></tr>
            <tr><td><a href="/kurs/brent">Brent-Öl</a></td><td class="num">${num(b.price, 2)} / Barrel</td><td class="num">${num(b.price / eurusd, 2)} € / Barrel</td><td class="num">${num(b.price / eurusd / 158.987, 3)} € / l · ${num(b.price / eurusd / 0.158987, 2)} € / hl</td></tr>
            <tr><td><a href="/kurs/wti">WTI-Öl</a></td><td class="num">${num(q('wti').price, 2)} / Barrel</td><td class="num">${num(q('wti').price / eurusd, 2)} € / Barrel</td><td class="num">${num(q('wti').price / eurusd / 158.987, 3)} € / l</td></tr>
            <tr><td><a href="/kurs/kupfer">Kupfer</a></td><td class="num">${num(k.price, 4)} / lb</td><td class="num">${num(k.price / eurusd, 4)} € / lb</td><td class="num">${num(k.price / eurusd / 0.45359, 2)} € / kg · ${num(k.price / eurusd / 0.45359 * 1000, 0)} € / t</td></tr>
            <tr><td><a href="/kurs/erdgas">Erdgas</a></td><td class="num">${num(q('erdgas').price, 3)} / MMBtu</td><td class="num">${num(q('erdgas').price / eurusd, 3)} € / MMBtu</td><td class="num">${num(q('erdgas').price / eurusd / 293.071 * 100, 2)} ct / kWh</td></tr>
          </tbody></table></div></section>
        <section class="card">${c.sectionTitle('Gold-Silber-Verhältnis')}<p>Eine Unze Gold kostet derzeit <strong>${num(g.price / s.price, 1)}</strong> Unzen Silber. Der 50-Jahres-Durchschnitt liegt bei etwa 60 bis 65; Werte über 80 galten historisch als Zeichen für ein relativ günstiges Silber, Werte unter 50 für ein relativ günstiges Gold.</p></section>
        <section>${c.sectionTitle('Nachrichten Rohstoffe', { href: '/nachrichten/rohstoffe', more: 'Alle' })}${c.storyList(c.byCategory('rohstoffe', 6), { thumb: true, excerpt: true })}</section>
      </div><aside>${c.sideAnalysis(5)}${c.sideCard('Devisen', c.miniQuotes(instruments.fx.slice(0, 4)), { href: '/devisen', more: 'Alle' })}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add('/rohstoffe', 'Rohstoffe', 'Gold, Silber, Platin, Kupfer, Brent, WTI und Erdgas: Kurse in US-Dollar, umgerechnet in Euro je Gramm, Liter und Kilogramm.', body);
  }

  // ---------- Devisen ----------
  {
    const rates = { EUR: 1, USD: q('eur-usd').price, GBP: q('eur-gbp').price, CHF: q('eur-chf').price, JPY: q('eur-jpy').price };
    const ccy = ['EUR', 'USD', 'GBP', 'CHF', 'JPY'];
    const body = html`<div class="container page">
      ${c.breadcrumb(crumb('Devisen', '/devisen'))}
      ${c.pageHead({ kicker: 'Märkte', title: 'Devisen', lead: 'Die wichtigsten Währungspaare aus Sicht des Euro. Ein steigender EUR/USD-Kurs bedeutet: Der Euro wird stärker, ein US-Dollar ist weniger Euro wert.' })}
      ${c.subnav(sub, '/devisen')}
      <div class="layout no-sticky"><div class="stack">
        <section class="card">${c.sectionTitle('Währungspaare')}${c.quoteTable(instruments.fx, { cols: ['price', 'change', 'abs', 'w', 'm1', 'ytd', 'spark'] })}<p class="small muted" style="margin-top:8px">Interbanken-Referenzkurse, nahezu Echtzeit. Beim Umtausch am Schalter oder per Karte kommen Spannen von 1 bis 3 % hinzu.</p></section>
        <section class="card">${c.sectionTitle('Kreuzkurse')}<p class="section-sub">Eine Einheit der Zeile in Einheiten der Spalte, abgeleitet aus den Euro-Kursen.</p><div class="table-wrap"><table class="quote-table is-compact"><thead><tr><th>1 Einheit</th>${ccy.map(x => html`<th class="num">${x}</th>`)}</tr></thead><tbody>${ccy.map(r => html`<tr><td>${r}</td>${ccy.map(col => html`<td class="num">${r === col ? '1' : num(rates[col] / rates[r], col === 'JPY' ? 2 : 4)}</td>`)}</tr>`)}</tbody></table></div><p style="margin-top:12px"><a class="btn btn-dark" href="/werkzeuge/waehrungsrechner">Zum Währungsrechner</a></p></section>
        <section class="card">${c.sectionTitle('Was den Euro bewegt')}<ul class="checklist" style="display:grid;gap:8px;list-style:none"><li><strong>Zinsdifferenz:</strong> Der Abstand zwischen Bund- und US-Rendite (aktuell ${num((q('us-treasury-10j').price - q('bund-10j').price) * 100, 0)} Basispunkte) ist der wichtigste mittelfristige Treiber.</li><li><strong>Zentralbanken:</strong> Überraschungen bei EZB (<a href="/termine/wirtschaftskalender">Termine</a>) und Fed bewegen den Kurs innerhalb von Minuten.</li><li><strong>Konjunkturdaten:</strong> ifo, Einkaufsmanagerindizes und US-Arbeitsmarkt.</li><li><strong>Risikostimmung:</strong> In Krisen fließt Geld in Dollar, Franken und Yen.</li></ul></section>
      </div><aside>${c.sideCard('Für Anleger', html`<p class="small">Wer US-Aktien oder einen MSCI-World-ETF hält, trägt ein Dollar-Risiko: Bei einem Anteil von 70 % US-Werten kostet ein Dollarrückgang um 10 % rund 7 % Depotwert – unabhängig von den Aktienkursen. Details im Ratgeber <a href="/wissen/etf-sparplan">ETF & Sparplan</a>.</p>`)}${c.sideAnalysis(5)}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add('/devisen', 'Devisen', 'EUR/USD, EUR/GBP, EUR/CHF, EUR/JPY, GBP/USD und USD/JPY mit Kursen, Veränderung und Kreuzkursen.', body);
  }

  // ---------- Krypto ----------
  {
    const body = html`<div class="container page">
      ${c.breadcrumb(crumb('Kryptowährungen', '/krypto'))}
      ${c.pageHead({ kicker: 'Märkte', title: 'Kryptowährungen', lead: 'Bitcoin, Ethereum und Solana – gehandelt rund um die Uhr, notiert in US-Dollar und hier zusätzlich in Euro umgerechnet.' })}
      ${c.subnav(sub, '/krypto')}
      <div class="layout no-sticky"><div class="stack">
        <section class="card">${c.sectionTitle('Kurse')}${c.quoteTable(instruments.crypto, { cols: ['price', 'change', 'w', 'm1', 'ytd', 'y1', 'spark'] })}
          <div class="table-wrap" style="margin-top:14px"><table class="quote-table is-compact"><thead><tr><th>Kryptowährung</th><th class="num">in US-$</th><th class="num">in Euro</th><th class="num">Abstand zum 52-Wochen-Hoch</th></tr></thead><tbody>${instruments.crypto.map(i => { const x = q(i.slug); return html`<tr><td><a href="${c.url(i)}">${i.name}</a></td><td class="num">${num(x.price, 2)}</td><td class="num">${num(x.price / eurusd, 2)} €</td><td class="num down">${x.high52w ? pct((x.price / x.high52w - 1) * 100) : '–'}</td></tr>`; })}</tbody></table></div></section>
        <section class="card">${c.sectionTitle('Steuern und Handel in Deutschland')}<ul style="padding-left:1.2em;display:grid;gap:6px"><li>Gewinne aus Kryptowährungen sind nach <strong>einem Jahr Haltedauer steuerfrei</strong>; innerhalb eines Jahres gilt eine Freigrenze von 1.000 € pro Jahr. Details: <a href="/wissen/steuern">Steuern auf Kapitalerträge</a>.</li><li>Krypto-Börsen mit deutscher BaFin-Lizenz oder EU-Zulassung nach MiCA unterliegen der Aufsicht; Einlagen sind jedoch nicht durch die Einlagensicherung geschützt.</li><li>Alternativ gibt es börsengehandelte Krypto-ETNs, die sich wie ein Wertpapier ins Depot legen lassen.</li></ul></section>
        <section>${c.sectionTitle('Nachrichten Krypto', { href: '/nachrichten/krypto', more: 'Alle' })}${c.storyList(c.byCategory('krypto', 5), { thumb: true, excerpt: true })}</section>
      </div><aside>${c.sideCard('Risikohinweis', html`<p class="small">Kryptowährungen schwanken extrem: Tagesbewegungen von 5 bis 10 % und Rückgänge von über 70 % vom Hoch sind in der Vergangenheit mehrfach vorgekommen. Investieren Sie nur Beträge, deren Totalverlust Sie tragen können.</p>`)}${c.sideAnalysis(5)}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add('/krypto', 'Kryptowährungen', 'Bitcoin, Ethereum und Solana: Kurse in US-Dollar und Euro, Performance, Steuern und Nachrichten.', body);
  }

  // ---------- Anleihen & Zinsen ----------
  {
    const b10 = q('bund-10j'), b2 = q('bund-2j'), us = q('us-treasury-10j');
    const spread = (b10.price - b2.price) * 100;
    const body = html`<div class="container page">
      ${c.breadcrumb(crumb('Anleihen & Zinsen', '/anleihen'))}
      ${c.pageHead({ kicker: 'Märkte', title: 'Anleihen & Zinsen', lead: 'Renditen von Bundesanleihen und US-Staatsanleihen – der Maßstab für Tagesgeld, Baukredite und Aktienbewertungen.' })}
      ${c.subnav(sub, '/anleihen')}
      <div class="layout no-sticky"><div class="stack">
        <section class="card">${c.sectionTitle('Renditen')}${c.quoteTable(instruments.bonds, { cols: ['price', 'change', 'w', 'm1', 'ytd', 'y1'] })}<p class="small muted" style="margin-top:8px">Angaben in Prozent Rendite bis Fälligkeit. Veränderung in Prozent der Rendite (nicht in Prozentpunkten).</p></section>
        <div class="number-tiles">
          <div class="number-tile"><span>Zinsstruktur 10J–2J</span><strong>${num(spread, 0)} Bp.</strong><small>${spread >= 0 ? 'normale Kurve' : 'inverse Kurve'}</small></div>
          <div class="number-tile"><span>Abstand USA–Deutschland (10J)</span><strong>${num((us.price - b10.price) * 100, 0)} Bp.</strong><small>Treiber für EUR/USD</small></div>
          <div class="number-tile"><span>Bund 10J</span><strong>${num(b10.price, 3)} %</strong><small>Referenz Baufinanzierung</small></div>
          <div class="number-tile"><span>Bund 2J</span><strong>${num(b2.price, 3)} %</strong><small>Referenz Festgeld</small></div>
        </div>
        <section class="card">${c.sectionTitle('Was die Zinsstruktur bedeutet')}<p>${spread >= 0 ? 'Die Zinskurve ist normal geformt: Längere Laufzeiten rentieren höher als kurze. Anleger verlangen für die längere Kapitalbindung einen Aufschlag – ein Zeichen stabiler Wachstumserwartungen.' : 'Die Zinskurve ist invers: Kurze Laufzeiten rentieren höher als lange. Der Markt erwartet sinkende Leitzinsen; historisch ging eine inverse Kurve Rezessionen häufig voraus.'} Für Sparer heißt das: Festgeld über zwei Jahre sollte in der Nähe von ${num(b2.price, 1)} % liegen; Baufinanzierungen mit zehn Jahren Zinsbindung kosten typischerweise 0,7 bis 1,2 Prozentpunkte mehr als die Bundrendite, also rund ${num(b10.price + 0.7, 1)} bis ${num(b10.price + 1.2, 1)} %.</p></section>
        <section>${c.sectionTitle('Nachrichten Zentralbanken & Zinsen', { href: '/nachrichten/zentralbanken', more: 'Alle' })}${c.storyList(c.byCategory('zentralbanken', 5), { thumb: true, excerpt: true })}</section>
      </div><aside>${c.sideUpcoming(5)}${c.sideCard('Begriffe', html`<ul class="side-list">${['anleihe', 'bundesanleihe', 'kupon', 'rendite', 'leitzins'].map(s => { const t = content.glossaryBySlug[s]; return t ? html`<li><a href="/wissen/boersenlexikon#${t.slug}"><span>${t.term}</span></a></li>` : ''; })}</ul>`, { href: '/wissen/boersenlexikon', more: 'Lexikon' })}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add('/anleihen', 'Anleihen & Zinsen', 'Renditen von Bundesanleihen (2 und 10 Jahre) und US-Staatsanleihen, Zinsstruktur und was sie für Sparer bedeutet.', body);
  }

  return pages;
};
