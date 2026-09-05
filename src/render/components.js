'use strict';
// Wiederverwendbare Bausteine für alle Seiten.
const charts = require('./charts');

module.exports = function (ctx) {
  const { config, util, instruments, snapshot, history, now } = ctx;
  const { html, raw, esc, num, pct, bigEur, dateShort, dateWeekday, relDate, time, isoDate } = util;
  const q = (slug) => snapshot.quotes[slug] || null;
  const dir = (v) => v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
  const c = {};

  const typeLabel = { index: 'Index', stock: 'Aktie', commodity: 'Rohstoff', fx: 'Devisen', crypto: 'Kryptowährung', bond: 'Anleihe' };
  c.typeLabel = (inst) => typeLabel[inst.type] || '';
  c.url = (inst) => `/kurs/${inst.slug}`;
  c.articleUrl = (a) => `/artikel/${a.slug}`;
  c.catUrl = (cat) => cat.kind === 'analysis' ? `/analysen/${cat.slug.replace(/^analysen-/, '')}` : `/nachrichten/${cat.slug}`;
  c.fmtPrice = ctx.fmtPrice;
  c.unit = (inst) => inst.type === 'index' ? 'Pkt.' : inst.type === 'bond' ? '%' : inst.type === 'fx' ? inst.unit : inst.type === 'stock' ? '€' : inst.unit;
  c.asOf = ctx.layout ? ctx.layout.asOfLabel : '';

  /* ---------- Bild-Platzhalter: deterministische Grafik pro Artikel ---------- */
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  c.thumb = (seed, { label = '', cls = '' } = {}) => {
    const h = hash(String(seed));
    const hue = 205 + (h % 40) - 20; // Blau-/Navy-Bereich, dezent variiert
    const pts = []; let y = 60 + (h % 20);
    for (let i = 0; i <= 12; i++) { y += (((h >> (i * 2)) & 7) - 3.2) * 6; y = Math.max(22, Math.min(98, y)); pts.push(`${(i * 160 / 12).toFixed(1)},${y.toFixed(1)}`); }
    const up = parseFloat(pts[pts.length - 1].split(',')[1]) < parseFloat(pts[0].split(',')[1]);
    return raw(`<span class="thumb ${cls}" aria-hidden="true"><svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 45% 22%)"/><stop offset="1" stop-color="hsl(${hue + 15} 50% 12%)"/></linearGradient></defs><rect width="160" height="100" fill="url(#g${h})"/><g stroke="rgba(255,255,255,.07)" stroke-width="1">${[20, 40, 60, 80].map(v => `<line x1="0" x2="160" y1="${v}" y2="${v}"/>`).join('')}${[40, 80, 120].map(v => `<line y1="0" y2="100" x1="${v}" x2="${v}"/>`).join('')}</g><polyline points="${pts.join(' ')}" fill="none" stroke="${up ? '#4ade80' : '#f87171'}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><polygon points="0,100 ${pts.join(' ')} 160,100" fill="${up ? 'rgba(74,222,128,.14)' : 'rgba(248,113,113,.14)'}"/>${label ? `<text x="10" y="90" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="13" letter-spacing=".08em" fill="rgba(255,255,255,.85)">${esc(label).toUpperCase()}</text>` : ''}</svg></span>`);
  };

  /* ---------- Struktur ---------- */
  c.sectionTitle = (title, { href, more = 'Alle anzeigen', tag = 'h2', id } = {}) =>
    html`<div class="section-title"${id ? raw(` id="${id}"`) : ''}>${raw(`<${tag}>`)}${title}${raw(`</${tag}>`)}${href ? html`<a class="more" href="${href}">${more}</a>` : ''}</div>`;
  c.breadcrumb = (items) => html`<nav aria-label="Brotkrumen"><ol class="breadcrumb"><li><a href="/">Start</a></li>${items.map(([l, h], i) => i < items.length - 1 ? html`<li><a href="${h}">${l}</a></li>` : html`<li aria-current="page">${l}</li>`)}</ol></nav>`;
  c.pageHead = ({ kicker, title, lead, extra }) => html`<div class="page-head">${kicker ? html`<span class="kicker">${kicker}</span>` : ''}<h1>${title}</h1>${lead ? html`<p class="lead">${lead}</p>` : ''}${extra || ''}</div>`;
  c.subnav = (items, current) => html`<ul class="subnav">${items.map(([l, h]) => html`<li><a href="${h}"${h === current ? raw(' class="is-current" aria-current="page"') : ''}>${l}</a></li>`)}</ul>`;
  c.note = (text, kind = '') => html`<div class="note ${kind}">${text}</div>`;
  c.placeholder = () => raw('<span class="badge is-placeholder" title="Redaktioneller Beispielinhalt – wird durch echte Meldungen ersetzt">Beispielinhalt</span>');
  c.disclaimer = () => raw('<p class="disclaimer">Dieser Beitrag dient ausschließlich der Information und stellt keine Anlageberatung und keine Empfehlung zum Kauf oder Verkauf von Wertpapieren dar. Kursangaben ' + esc(c.asOf) + '. Frühere Wertentwicklungen sind kein verlässlicher Indikator für künftige Ergebnisse.</p>');

  /* ---------- Kurse ---------- */
  c.delta = (v, { pill = false } = {}) => html`<span class="${pill ? 'delta-pill' : 'delta'} ${dir(v)}">${pct(v)}</span>`;
  c.priceCell = (inst, quote) => html`${c.fmtPrice(inst, quote)}${inst.type === 'bond' ? ' %' : ''}`;
  c.instrumentRow = (inst, cols) => {
    const qq = q(inst.slug) || {}; const h = history[inst.slug];
    const cell = {
      price: html`<td class="num">${c.priceCell(inst, qq)}</td>`,
      change: html`<td class="num">${c.delta(qq.changePct)}</td>`,
      abs: html`<td class="num ${dir(qq.changeAbs)}">${qq.changeAbs == null ? '–' : (qq.changeAbs > 0 ? '+' : '') + num(qq.changeAbs, inst.type === 'fx' ? 4 : 2)}</td>`,
      ytd: html`<td class="num hide-m">${c.delta(qq.perf && qq.perf.ytd)}</td>`,
      y1: html`<td class="num hide-m">${c.delta(qq.perf && qq.perf.y1)}</td>`,
      w: html`<td class="num hide-m">${c.delta(qq.perf && qq.perf.w)}</td>`,
      m1: html`<td class="num hide-m">${c.delta(qq.perf && qq.perf.m1)}</td>`,
      mcap: html`<td class="num hide-m" data-v="${qq.marketCap || 0}">${bigEur(qq.marketCap)}</td>`,
      pe: html`<td class="num hide-m" data-v="${qq.pe || 0}">${qq.pe ? num(qq.pe, 1) : '–'}</td>`,
      dy: html`<td class="num hide-m" data-v="${qq.dividendYield || 0}">${qq.dividendYield ? num(qq.dividendYield, 2) + ' %' : '–'}</td>`,
      range: html`<td class="hide-m">${charts.rangeBar(qq.low52w, qq.high52w, qq.price)}</td>`,
      spark: html`<td class="spark-cell">${h ? charts.sparkline(h.points, { days: 22 }) : ''}</td>`,
      sector: html`<td class="hide-m muted">${inst.sector || ''}</td>`,
      index: html`<td class="hide-m muted">${inst.index || ''}</td>`,
      isin: html`<td class="hide-m muted small">${qq.isin || inst.isin || '–'}</td>`,
      watch: html`<td class="right">${c.watchButton(inst.slug, true)}</td>`,
    };
    const dv = { price: qq.price, change: qq.changePct, abs: qq.changeAbs, ytd: qq.perf && qq.perf.ytd, y1: qq.perf && qq.perf.y1, w: qq.perf && qq.perf.w, m1: qq.perf && qq.perf.m1 };
    return html`<tr><td><a href="${c.url(inst)}">${inst.name}</a>${inst.type === 'stock' ? html`<span class="sub">${inst.sector} · ${inst.index}</span>` : inst.type !== 'index' && inst.short ? html`<span class="sub">${inst.short}</span>` : ''}</td>${cols.map(k => {
      const td = cell[k]; if (!td) return '';
      if (dv[k] !== undefined) return raw(String(td).replace('<td', `<td data-v="${dv[k] == null ? '' : dv[k]}"`));
      return td;
    })}</tr>`;
  };
  const colHead = { price: 'Kurs', change: '±%', abs: '±', ytd: 'YTD', y1: '1 Jahr', w: '1 Woche', m1: '1 Monat', mcap: 'Marktkap.', pe: 'KGV', dy: 'Div.-Rend.', range: '52-Wochen-Spanne', spark: '1 Monat', sector: 'Branche', index: 'Index', isin: 'ISIN', watch: '' };
  const numeric = new Set(['price', 'change', 'abs', 'ytd', 'y1', 'w', 'm1', 'mcap', 'pe', 'dy']);
  c.quoteTable = (insts, { cols = ['price', 'change', 'ytd', 'spark'], compact = false, sortable = true, nameHead = 'Name' } = {}) =>
    html`<div class="table-wrap"><table class="quote-table ${compact ? 'is-compact' : ''}"${sortable ? raw(' data-sortable') : ''}><thead><tr><th>${nameHead}</th>${cols.map(k => html`<th class="${numeric.has(k) ? 'num' : ''} ${['ytd', 'y1', 'w', 'm1', 'mcap', 'pe', 'dy', 'range', 'sector', 'index', 'isin'].includes(k) ? 'hide-m' : ''} ${k === 'spark' ? 'spark-cell' : ''}"${['spark', 'range', 'watch'].includes(k) ? raw(' data-nosort') : ''}>${colHead[k]}</th>`)}</tr></thead><tbody>${insts.map(i => c.instrumentRow(i, cols))}</tbody></table></div>`;
  c.miniQuotes = (insts) => html`<div>${insts.map(i => { const qq = q(i.slug) || {}; return html`<div class="mini-quote"><a href="${c.url(i)}">${i.short || i.name}</a><span class="vals"><strong>${c.priceCell(i, qq)}</strong>${c.delta(qq.changePct)}</span></div>`; })}</div>`;
  c.board = (slugs) => html`<div class="board">${slugs.map(s => { const i = instruments.bySlug[s], qq = q(s) || {}, h = history[s]; return html`<a class="board-item" href="${c.url(i)}"><span class="strip-name">${i.short || i.name}</span><span class="price">${c.priceCell(i, qq)}</span>${c.delta(qq.changePct)}${h ? charts.sparkline(h.points, { days: 22, w: 200, h: 30 }) : ''}</a>`; })}</div>`;
  c.watchButton = (slug, small = false) => html`<button type="button" class="btn btn-ghost ${small ? 'btn-sm' : ''} watch" data-watch="${slug}" aria-pressed="false" title="Auf die Merkliste setzen">${raw(ctx.layout.icons.star)}${small ? '' : html`<span class="watch-label">Auf Merkliste</span>`}</button>`;
  c.movers = (n = 5) => {
    const stocks = instruments.stocks.filter(s => q(s.slug) && q(s.slug).changePct != null).sort((a, b) => q(b.slug).changePct - q(a.slug).changePct);
    return { gainers: stocks.slice(0, n), losers: stocks.slice(-n).reverse() };
  };
  c.perfGrid = (qq) => {
    const p = qq && qq.perf; if (!p) return '';
    const items = [['1 Woche', p.w], ['1 Monat', p.m1], ['3 Monate', p.m3], ['6 Monate', p.m6], ['Seit Jahresbeginn', p.ytd], ['1 Jahr', p.y1]];
    return html`<div class="perf-grid">${items.map(([l, v]) => html`<div class="perf-cell"><span>${l}</span><strong class="${dir(v)}">${pct(v)}</strong></div>`)}</div>`;
  };

  /* ---------- Nachrichten ---------- */
  const catOf = (a) => ctx.content.categories.bySlug[a.category];
  const instOf = (a) => a.instruments && a.instruments.length ? instruments.bySlug[a.instruments[0]] : null;
  c.storyTop = (a, { showDate = true } = {}) => {
    const cat = catOf(a); const inst = instOf(a); const qq = inst ? q(inst.slug) : null;
    return html`<div class="story-top">${showDate ? html`<time datetime="${a.date.toISOString()}">${relDate(a.date, now)}${relDate(a.date, now) === 'heute' ? ', ' + time(a.date) + ' Uhr' : ''}</time>` : ''}${inst ? html`<span class="tag"><a href="${c.url(inst)}">${inst.short || inst.name}</a></span>${qq ? c.delta(qq.changePct) : ''}` : html`<span class="tag"><a href="${c.catUrl(cat)}">${cat.name}</a></span>`}${a.kind === 'analysis' && a.direction ? html`<span class="dir ${a.direction}">${a.direction === 'up' ? '▲ bullish' : '▼ bearish'}</span>` : ''}</div>`;
  };
  c.storyLead = (a) => {
    const inst = instOf(a); const qq = inst ? q(inst.slug) : null; const cat = catOf(a);
    return html`<article class="lead-story"><a href="${c.articleUrl(a)}" aria-hidden="true" tabindex="-1">${c.thumb(a.slug, { label: inst ? inst.short || inst.name : cat.name })}</a><div><span class="kicker is-live">${cat.name}</span><h2><a href="${c.articleUrl(a)}">${a.title}</a></h2><p>${a.deck}</p><div class="story-meta"><time datetime="${a.date.toISOString()}">${relDate(a.date, now)}, ${time(a.date)} Uhr</time>${inst && qq ? html`<span>·</span><a href="${c.url(inst)}"><strong>${inst.short || inst.name}</strong></a> <strong>${c.priceCell(inst, qq)}</strong> ${c.delta(qq.changePct)}` : ''}<span>· ${a.readTime} Min. Lesezeit</span></div></div></article>`;
  };
  c.storyItem = (a, { thumb = false, excerpt = false } = {}) => {
    const inst = instOf(a); const cat = catOf(a);
    return html`<li><article class="story ${thumb ? 'has-thumb' : ''}">${thumb ? html`<a href="${c.articleUrl(a)}" aria-hidden="true" tabindex="-1">${c.thumb(a.slug, { label: inst ? inst.short || inst.name : cat.name })}</a>` : ''}<div>${c.storyTop(a)}<h3 class="story-title"><a href="${c.articleUrl(a)}">${a.title}</a></h3>${excerpt ? html`<p class="story-excerpt">${a.deck}</p>` : ''}</div></article></li>`;
  };
  c.storyList = (arts, { variant = '', thumb = false, excerpt = false } = {}) => html`<ul class="story-list ${variant}">${arts.map(a => c.storyItem(a, { thumb, excerpt }))}</ul>`;
  c.denseList = (arts) => html`<ul class="story-list is-dense">${arts.map(a => { const inst = instOf(a); const cat = catOf(a); return html`<li><time datetime="${a.date.toISOString()}">${relDate(a.date, now) === 'heute' ? time(a.date) : util.dateDM(a.date)}</time><span class="story-title">${inst ? html`<span class="tag"><a href="${c.url(inst)}">${inst.short || inst.name}</a></span>` : html`<span class="tag"><a href="${c.catUrl(cat)}">${cat.name}</a></span>`} <a href="${c.articleUrl(a)}">${a.title}</a></span></li>`; })}</ul>`;
  c.analysisList = (arts) => html`<ul class="story-list is-dense analysis-list">${arts.map(a => { const inst = instOf(a); return html`<li><time datetime="${a.date.toISOString()}">${util.dateDM(a.date)}</time><span class="dir ${a.direction || 'flat'}" title="${a.direction === 'up' ? 'Positive Einschätzung' : a.direction === 'down' ? 'Negative Einschätzung' : 'Neutral'}">${a.direction === 'up' ? '▲' : a.direction === 'down' ? '▼' : '►'}</span><span class="story-title">${inst ? html`<span class="tag"><a href="${c.url(inst)}">${inst.short || inst.name}</a></span>` : ''} <a href="${c.articleUrl(a)}">${a.title}</a></span></li>`; })}</ul>`;
  c.storyCards = (arts, { large = false } = {}) => html`<div class="story-cards">${arts.map((a, i) => { const inst = instOf(a); const cat = catOf(a); return html`<article class="story-card ${large && i === 0 ? 'is-large' : ''}"><a href="${c.articleUrl(a)}" aria-hidden="true" tabindex="-1">${c.thumb(a.slug, { label: inst ? inst.short || inst.name : cat.name })}</a>${c.storyTop(a)}<h3 class="story-title"><a href="${c.articleUrl(a)}">${a.title}</a></h3><p class="story-excerpt">${a.deck}</p></article>`; })}</div>`;
  c.byCategory = (slug, n) => ctx.content.articles.filter(a => a.category === slug).slice(0, n);
  c.byInstrument = (slug, n) => ctx.content.articles.filter(a => a.instruments && a.instruments.includes(slug)).slice(0, n);
  c.authorOf = (a) => ctx.content.authors.bySlug[a.author];
  c.avatar = (author, lg = false) => html`<span class="avatar ${lg ? 'is-lg' : ''}" aria-hidden="true">${author.initials}</span>`;

  /* ---------- Sidebar-Bausteine ---------- */
  c.sideCard = (title, body, { href, more } = {}) => html`<section class="card">${c.sectionTitle(title, { href, more, tag: 'h2' })}${body}</section>`;
  c.sideIndices = () => c.sideCard('Indizes', c.miniQuotes(['dax', 'mdax', 'sdax', 'tecdax', 'euro-stoxx-50', 'sp-500', 'nasdaq-100', 'nikkei-225'].map(s => instruments.bySlug[s])), { href: '/indizes', more: 'Alle Indizes' });
  c.sideMovers = () => { const m = c.movers(5); return c.sideCard('Gewinner & Verlierer', html`<h3 class="kicker" style="margin:4px 0">Top DAX/MDAX</h3>${c.miniQuotes(m.gainers)}<h3 class="kicker" style="margin:14px 0 4px">Flop DAX/MDAX</h3>${c.miniQuotes(m.losers)}`, { href: '/rankings', more: 'Rankings' }); };
  c.sideAnalysis = (n = 5) => c.sideCard('Neueste Analysen', c.analysisList(ctx.content.articles.filter(a => a.kind === 'analysis').slice(0, n)), { href: '/analysen', more: 'Alle Analysen' });
  c.sideLatest = (n = 6, exclude) => c.sideCard('Aktuelle Nachrichten', c.storyList(ctx.content.articles.filter(a => a.kind === 'news' && a.slug !== exclude).slice(0, n), { variant: 'is-compact' }), { href: '/nachrichten', more: 'Alle Nachrichten' });
  c.sideUpcoming = (n = 5) => { const ev = ctx.content.upcomingEvents(n); return c.sideCard('Nächste Termine', html`<ul class="upcoming">${ev.map(e => html`<li><div class="date"><b>${new Date(e.date).getDate()}</b><span>${util.MONTHS_SHORT[new Date(e.date).getMonth()]}</span></div><div><div class="what">${e.title}</div><div class="who">${e.time} Uhr · ${e.countryName}${e.impact === 3 ? ' · hohe Relevanz' : ''}</div></div></li>`)}</ul>`, { href: '/termine/wirtschaftskalender', more: 'Kalender' }); };
  c.sideRecent = () => html`<section class="card" data-recent hidden>${c.sectionTitle('Zuletzt gelesen')}<ul class="side-list" data-recent-list></ul><p class="small muted" style="margin-top:8px">Wird nur lokal in Ihrem Browser gespeichert.</p></section>`;
  c.sideTools = () => c.sideCard('Rechner & Werkzeuge', html`<ul class="side-links">${[['Zinseszinsrechner', '/werkzeuge/zinseszinsrechner'], ['Sparplanrechner', '/werkzeuge/sparplanrechner'], ['Renditerechner', '/werkzeuge/renditerechner'], ['Dividendenrechner', '/werkzeuge/dividendenrechner'], ['Währungsrechner', '/werkzeuge/waehrungsrechner'], ['Merkliste', '/merkliste']].map(([l, h]) => html`<li><a href="${h}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>${l}</a></li>`)}</ul>`, { href: '/werkzeuge', more: 'Alle' });
  c.sideKnowledge = () => c.sideCard('Börsenwissen', html`<ul class="side-list">${ctx.content.guides.slice(0, 5).map(g => html`<li><a href="/wissen/${g.slug}"><span class="kicker">${g.kicker}</span><span>${g.title}</span></a></li>`)}</ul>`, { href: '/wissen', more: 'Übersicht' });
  c.newsletterBox = ({ dark = true, compact = false } = {}) => html`<section class="card ${dark ? 'is-dark' : ''}"><form class="newsletter" data-newsletter action="#" method="post" novalidate><h3>${compact ? 'Börsenblick am Morgen' : 'Der Morgen-Überblick per E-Mail'}</h3><p>Jeden Handelstag um 7:30 Uhr: die Lage an den Märkten, drei Termine des Tages und die wichtigste Meldung – kostenlos, in zwei Minuten gelesen.</p><label class="visually-hidden" for="nl-${compact ? 'c' : 'f'}">E-Mail-Adresse</label><div class="control"><input id="nl-${compact ? 'c' : 'f'}" type="email" name="email" placeholder="ihre@e-mail.de" required autocomplete="email"></div><label class="check"><input type="checkbox" name="consent" required> Ich möchte den Newsletter erhalten und akzeptiere die <a href="/datenschutz">Datenschutzhinweise</a>. Abmeldung jederzeit möglich.</label><button class="btn btn-primary" type="submit">Kostenlos anmelden</button><div class="newsletter-note" data-newsletter-note hidden tabindex="-1">Der Versanddienst wird gerade angebunden – die Anmeldung ist in Kürze möglich. Bis dahin: <a href="/feed.xml">RSS-Feed abonnieren</a> oder die <a href="/nachrichten">Nachrichten</a> als Lesezeichen speichern.</div></form></section>`;
  c.pollBox = () => { const p = ctx.content.poll; return html`<section class="card" data-poll="${p.id}" data-poll-counts="${JSON.stringify(p.counts)}">${c.sectionTitle('Umfrage')}<p style="font-weight:600;margin-bottom:12px">${p.question}</p><div class="poll-options">${p.options.map(o => html`<button type="button" class="poll-option" data-poll-option><span class="poll-bar"></span><span>${o}</span><span class="poll-pct">0 %</span></button>`)}</div><p class="small muted" style="margin-top:10px" data-poll-note hidden></p></section>`; };

  /* ---------- Feeds & Indizes für die Suche ---------- */
  c.rssFeed = () => {
    const items = ctx.content.articles.slice(0, 30).map(a => `  <item>\n    <title>${esc(a.title)}</title>\n    <link>${config.domain}${c.articleUrl(a)}</link>\n    <guid>${config.domain}${c.articleUrl(a)}</guid>\n    <pubDate>${a.date.toUTCString()}</pubDate>\n    <category>${esc(catOf(a).name)}</category>\n    <description>${esc(a.deck)}</description>\n  </item>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>${esc(config.brand)} – Nachrichten</title>\n  <link>${config.domain}</link>\n  <description>${esc(config.description)}</description>\n  <language>de-de</language>\n  <lastBuildDate>${now.toUTCString()}</lastBuildDate>\n  <atom:link href="${config.domain}/feed.xml" rel="self" type="application/rss+xml"/>\n${items}\n</channel>\n</rss>\n`;
  };
  c.searchIndex = () => {
    const out = [];
    for (const i of instruments.all) out.push({ t: i.name, k: [i.short, i.isin, i.index, i.sector].filter(Boolean).join(' · '), u: c.url(i), y: i.type, w: i.type === 'stock' || i.type === 'index' ? 3 : 2, d: i.blurb });
    for (const a of ctx.content.articles) out.push({ t: a.title, k: catOf(a).name + ' · ' + dateShort(a.date), u: c.articleUrl(a), y: 'article', w: 1, d: a.deck });
    for (const g of ctx.content.guides) out.push({ t: g.title, k: g.kicker, u: `/wissen/${g.slug}`, y: 'guide', w: 2, d: g.lead });
    for (const t of ctx.content.glossary) out.push({ t: t.term, k: t.short || '', u: `/wissen/boersenlexikon#${t.slug}`, y: 'term', w: 1, d: t.def.slice(0, 140) });
    for (const p of ctx.content.searchablePages) out.push({ t: p.title, k: p.kicker || '', u: p.path, y: 'page', w: 2, d: p.description || '' });
    return out;
  };
  c.instrumentsJson = () => instruments.all.map(i => { const qq = q(i.slug) || {}; return { slug: i.slug, name: i.name, typeLabel: c.typeLabel(i), url: c.url(i), isin: qq.isin || i.isin || '', price: qq.price, digits: i.type === 'fx' ? 4 : i.type === 'bond' ? 3 : (qq.price >= 1000 ? 0 : 2), unit: c.unit(i), changePct: qq.changePct, perfYtd: qq.perf ? qq.perf.ytd : null }; });

  return c;
};
