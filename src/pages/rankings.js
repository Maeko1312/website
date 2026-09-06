'use strict';
module.exports = function (ctx) {
  const { c, layout, util, instruments, content } = ctx;
  const { html, raw, num, pct, bigEur } = util;
  const q = (s) => ctx.quote(s) || {};
  const stocks = instruments.stocks.filter(s => q(s.slug).price != null);
  const rankings = [
    { key: 'gewinner', label: 'Tagesgewinner', val: (x) => x.changePct, fmt: (v) => c.delta(v), head: '±% heute', desc: 'Größte Kursgewinne gegenüber dem Vortagesschluss.' , sortDesc: true },
    { key: 'verlierer', label: 'Tagesverlierer', val: (x) => x.changePct, fmt: (v) => c.delta(v), head: '±% heute', desc: 'Größte Kursverluste gegenüber dem Vortagesschluss.', sortDesc: false },
    { key: 'ytd', label: 'Seit Jahresbeginn', val: (x) => x.perf && x.perf.ytd, fmt: (v) => c.delta(v), head: 'YTD', desc: 'Kursentwicklung seit dem letzten Handelstag des Vorjahres.', sortDesc: true },
    { key: 'jahr', label: '1 Jahr', val: (x) => x.perf && x.perf.y1, fmt: (v) => c.delta(v), head: '1 Jahr', desc: 'Kursentwicklung über die letzten zwölf Monate.', sortDesc: true },
    { key: 'marktkap', label: 'Marktkapitalisierung', val: (x) => x.marketCap, fmt: (v) => bigEur(v), head: 'Börsenwert', desc: 'Aktienkurs mal Anzahl der Aktien – die größten Unternehmen.', sortDesc: true },
    { key: 'dividende', label: 'Dividendenrendite', val: (x) => x.dividendYield, fmt: (v) => num(v, 2) + ' %', head: 'Div.-Rendite', desc: 'Dividende der letzten zwölf Monate im Verhältnis zum Kurs.', sortDesc: true },
    { key: 'kgv', label: 'Niedrigstes KGV', val: (x) => x.pe > 0 ? x.pe : null, fmt: (v) => num(v, 1), head: 'KGV', desc: 'Kurs-Gewinn-Verhältnis auf Basis der letzten zwölf Monate; Unternehmen mit Verlust sind nicht enthalten.', sortDesc: false },
    { key: 'hoch', label: 'Nähe zum 52-Wochen-Hoch', val: (x) => x.high52w ? (x.price / x.high52w - 1) * 100 : null, fmt: (v) => c.delta(v), head: 'Abstand zum Hoch', desc: 'Abstand des aktuellen Kurses zum höchsten Kurs der letzten 52 Wochen – 0 % bedeutet: neues Jahreshoch.', sortDesc: true },
    { key: 'umsatz', label: 'Handelsumsatz', val: (x) => x.volume && x.price ? x.volume * x.price : null, fmt: (v) => bigEur(v), head: 'Umsatz heute', desc: 'Gehandelte Stücke mal Kurs – wo heute das meiste Geld bewegt wurde.', sortDesc: true },
  ];
  const up = stocks.filter(s => q(s.slug).changePct > 0).length, down = stocks.filter(s => q(s.slug).changePct < 0).length;
  const above200 = stocks.filter(s => q(s.slug).sma200 && q(s.slug).price > q(s.slug).sma200).length;
  const newHigh = stocks.filter(s => q(s.slug).high52w && q(s.slug).price >= q(s.slug).high52w * 0.98).length;

  const table = (r) => {
    const rows = stocks.map(s => ({ s, x: q(s.slug), v: r.val(q(s.slug)) })).filter(o => o.v != null && !Number.isNaN(o.v)).sort((a, b) => r.sortDesc ? b.v - a.v : a.v - b.v).slice(0, 20);
    const maxAbs = Math.max(...rows.map(o => Math.abs(o.v))) || 1;
    return html`<div class="table-wrap"><table class="quote-table rank-table"><thead><tr><th>#</th><th>Aktie</th><th class="num">Kurs</th><th class="num">${r.head}</th><th class="bar-cell hide-m"></th><th class="num hide-m">±% heute</th><th class="hide-m">Branche</th></tr></thead><tbody>${rows.map((o, i) => html`<tr><td class="rank-pos">${i + 1}</td><td><a href="${c.url(o.s)}">${o.s.name}</a><span class="sub">${o.s.index}</span></td><td class="num">${num(o.x.price)} €</td><td class="num"><strong>${r.fmt(o.v)}</strong></td><td class="bar-cell hide-m"><div class="hbar ${o.v >= 0 ? 'is-up' : 'is-down'}"><span style="width:${(Math.abs(o.v) / maxAbs * 100).toFixed(1)}%"></span></div></td><td class="num hide-m">${c.delta(o.x.changePct)}</td><td class="hide-m muted">${o.s.sector}</td></tr>`)}</tbody></table></div>`;
  };

  const body = html`<div class="container page">
    ${c.breadcrumb([['Rankings', '/rankings']])}
    ${c.pageHead({ kicker: 'Märkte', title: 'Rankings', lead: html`Die Top 20 aus DAX und MDAX nach Tagesbewegung, Performance, Börsenwert, Dividendenrendite, Bewertung und Handelsumsatz. ${layout.asOfLabel}.` })}
    <div class="number-tiles" style="margin-bottom:24px">
      <div class="number-tile"><span>Marktbreite</span><strong><span class="up">${up}</span> / <span class="down">${down}</span></strong><small>Gewinner / Verlierer von ${stocks.length} Werten</small></div>
      <div class="number-tile"><span>Über der 200-Tage-Linie</span><strong>${num(above200 / stocks.length * 100, 0)} %</strong><small>${above200} von ${stocks.length} Aktien im Aufwärtstrend</small></div>
      <div class="number-tile"><span>Nahe Jahreshoch</span><strong>${newHigh}</strong><small>Aktien höchstens 2 % unter dem 52-Wochen-Hoch</small></div>
      <div class="number-tile"><span>Ø Dividendenrendite</span><strong>${num(stocks.filter(s => q(s.slug).dividendYield > 0).reduce((n, s) => n + q(s.slug).dividendYield, 0) / stocks.filter(s => q(s.slug).dividendYield > 0).length, 2)} %</strong><small>ausschüttende Werte</small></div>
    </div>
    <div class="layout no-sticky"><div>
      <div class="tabs" data-tabs="rank-panels" data-tabs-hash role="tablist" aria-label="Ranking wählen">${rankings.map((r, i) => html`<button class="tab ${i === 0 ? 'is-active' : ''}" type="button" role="tab" data-tab="${r.key}">${r.label}</button>`)}</div>
      <div id="rank-panels">${rankings.map((r, i) => html`<section class="card" data-panel="${r.key}"${i ? raw(' hidden') : ''}>${c.sectionTitle(r.label)}<p class="section-sub">${r.desc}</p>${table(r)}</section>`)}</div>
      <p class="small muted" style="margin-top:12px">Grundgesamtheit: ${stocks.length} beobachtete Aktien aus DAX und MDAX. Xetra-Schlusskurse, ${layout.asOfLabel}. Kennzahlen auf Basis der letzten zwölf Monate.</p>
    </div><aside>
      ${c.sideCard('Was die Marktbreite sagt', html`<p class="small">Steigt der Index, aber nur wenige Aktien tragen den Anstieg, ist die Rally anfällig. Ein hoher Anteil von Aktien über ihrer 200-Tage-Linie gilt als Zeichen eines gesunden Aufwärtstrends. Details im Ratgeber <a href="/wissen/chartanalyse">Chartanalyse</a>.</p>`)}
      ${c.sideAnalysis(5)}
      ${c.newsletterBox({ compact: true })}
    </aside></div></div>`;
  content.searchablePages.push({ title: 'Rankings', path: '/rankings', kicker: 'Märkte', description: 'Top-Listen DAX und MDAX: Gewinner, Verlierer, Performance, Marktkapitalisierung, Dividendenrendite, KGV.' });
  return [{ path: '/rankings', html: layout.page({ title: 'Rankings – Gewinner, Verlierer, Dividenden, KGV', description: 'Top 20 aus DAX und MDAX nach Tagesbewegung, Performance, Börsenwert, Dividendenrendite, KGV und Handelsumsatz.', path: '/rankings', body, section: 'rankings' }) }];
};
