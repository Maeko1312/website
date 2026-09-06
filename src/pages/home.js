'use strict';
module.exports = function (ctx) {
  const { c, layout, util, instruments, content, config } = ctx;
  const { html, raw, num, pct, dateWeekday } = util;
  const q = (s) => ctx.quote(s) || {};
  const news = content.articles.filter(a => a.kind === 'news');
  const analyses = content.articles.filter(a => a.kind === 'analysis');
  const lead = news.find(a => a.featured) || news[0];
  const rest = news.filter(a => a !== lead);
  const todayCards = rest.slice(0, 3);
  const feed = rest.slice(3, 17);
  const m = c.movers(5);
  const upcoming = content.upcomingEvents(5);
  const daxUp = instruments.dax.filter(s => (q(s.slug).changePct || 0) > 0).length;
  const dax = q('dax'), daxInst = instruments.bySlug.dax, daxHist = ctx.hist('dax');
  const posts = content.blog.posts;
  // Rankings kompakt (echte Daten)
  const stocksQ = instruments.stocks.filter(s => q(s.slug).price != null);
  const byKey = (fn, desc = true, n = 8) => stocksQ.map(s => ({ s, v: fn(q(s.slug)) })).filter(o => o.v != null && !Number.isNaN(o.v)).sort((a, b) => desc ? b.v - a.v : a.v - b.v).slice(0, n).map(o => o.s);
  const rankSets = [
    { key: 'gewinner', label: 'Tagesgewinner', rows: byKey(x => x.changePct), cols: ['price', 'change', 'ytd'], note: 'Größte Kursgewinne gegenüber dem Vortag.' },
    { key: 'verlierer', label: 'Tagesverlierer', rows: byKey(x => x.changePct, false), cols: ['price', 'change', 'ytd'], note: 'Größte Kursverluste gegenüber dem Vortag.' },
    { key: 'ytd', label: 'Seit Jahresbeginn', rows: byKey(x => x.perf && x.perf.ytd), cols: ['price', 'ytd', 'y1'], note: 'Beste Kursentwicklung seit dem Jahreswechsel.' },
    { key: 'dividende', label: 'Dividendenrendite', rows: byKey(x => x.dividendYield), cols: ['price', 'dy', 'pe'], note: 'Ausschüttung der letzten zwölf Monate im Verhältnis zum Kurs.' },
  ];

  const tabsFeed = html`
    <div class="tabs" data-tabs="feed-panels" role="tablist" aria-label="Nachrichten filtern">
      <button class="tab is-active" type="button" role="tab" data-tab="alle">Alle</button>
      <button class="tab" type="button" role="tab" data-tab="unternehmen">Unternehmen</button>
      <button class="tab" type="button" role="tab" data-tab="maerkte">Märkte & Konjunktur</button>
      <button class="tab" type="button" role="tab" data-tab="rohstoffe">Rohstoffe & Krypto</button>
    </div>
    <div id="feed-panels">
      <div data-panel="alle">${c.denseList(feed)}</div>
      <div data-panel="unternehmen" hidden>${c.denseList(news.filter(a => ['unternehmen', 'analystenstimmen'].includes(a.category)).slice(0, 10))}</div>
      <div data-panel="maerkte" hidden>${c.denseList(news.filter(a => ['marktberichte', 'wirtschaft', 'zentralbanken'].includes(a.category)).slice(0, 10))}</div>
      <div data-panel="rohstoffe" hidden>${c.denseList(news.filter(a => ['rohstoffe', 'krypto'].includes(a.category)).slice(0, 10))}</div>
    </div>`;

  const moversCard = html`<section class="card" aria-labelledby="h-mv">
    <div class="section-title"><h2 id="h-mv">Gewinner & Verlierer</h2><span class="stand">${layout.asOfLabel}</span></div>
    <div class="movers-mini"><div><span class="kicker up">▲ Gewinner</span>${c.miniQuotes(m.gainers.slice(0, 3))}</div><div><span class="kicker down">▼ Verlierer</span>${c.miniQuotes(m.losers.slice(0, 3))}</div></div>
    <p class="small muted" style="margin-top:10px">DAX und MDAX · ${daxUp} von ${instruments.dax.length} DAX-Werten im Plus · <a href="/rankings">Alle Rankings ›</a></p>
  </section>`;

  const body = html`<h1 class="visually-hidden">Börsenblick – Börse verstehen. Märkte im Blick.</h1>
<div class="container page">
  <div class="hero">
    ${c.heroStory(lead)}
    <div class="hero-side">
      ${c.newsletterBox({ compact: true })}
      ${moversCard}
    </div>
  </div>

  <section aria-labelledby="h-today" style="margin-bottom:28px">
    ${c.sectionTitle('Nachrichten des Tages', { href: '/nachrichten', more: 'Alle Nachrichten', id: 'h-today' })}
    ${c.storyCards(todayCards)}
  </section>

  ${c.nlBanner()}

  <section aria-labelledby="h-blog" style="margin-bottom:32px">
    ${c.sectionTitle('Aus dem Blog', { href: '/blog', more: 'Alle Beiträge', id: 'h-blog' })}
    <div class="post-grid">${posts.slice(0, 3).map(p => c.postCard(p))}</div>
  </section>

  <div class="layout no-sticky">
    <div class="stack">
      <section aria-labelledby="h-feed">
        ${c.sectionTitle('Aktuelle Meldungen', { href: '/nachrichten', more: 'Mehr Nachrichten', id: 'h-feed' })}
        ${tabsFeed}
      </section>
      <section aria-labelledby="h-rank">
        ${c.sectionTitle('Rankings kompakt', { href: '/rankings', more: 'Alle Rankings', id: 'h-rank' })}
        <div class="tabs" data-tabs="rank-home" role="tablist" aria-label="Ranking wählen">${rankSets.map((r, i) => html`<button class="tab ${i === 0 ? 'is-active' : ''}" type="button" role="tab" data-tab="${r.key}">${r.label}</button>`)}</div>
        <div id="rank-home" class="card">${rankSets.map((r, i) => html`<div data-panel="${r.key}"${i ? raw(' hidden') : ''}>${c.quoteTable(r.rows, { cols: r.cols, compact: true, sortable: false })}<p class="small muted" style="margin-top:8px">${r.note}</p></div>`)}</div>
      </section>

    </div>
    <aside>
      <section class="card">
        ${c.sectionTitle('Ideen des Tages', { href: '/analysen', more: 'Alle Analysen' })}
        <div class="ideas">${analyses.slice(0, 4).map(a => { const inst = instruments.bySlug[(a.instruments || [])[0]]; return html`<div class="idea"><span class="kicker">${a.categoryObj.name} · ${inst ? inst.short || inst.name : ''}</span><div class="idea-title"><a href="${c.articleUrl(a)}">${a.title}</a></div><div class="idea-meta"><span class="dir ${a.direction || 'flat'}">${a.direction === 'up' ? 'bullish' : a.direction === 'down' ? 'bearish' : 'neutral'}</span><span>· ${util.dateDM(a.date)}</span></div></div>`; })}</div>
      </section>
      <section class="card">
        ${c.sectionTitle('Termine der Woche', { href: '/termine/wirtschaftskalender', more: 'Kalender' })}
        <ul class="upcoming">${upcoming.map(e => { const d = new Date(e.date + 'T00:00:00'); return html`<li><div class="date"><b>${d.getDate()}</b><span>${util.MONTHS_SHORT[d.getMonth()]}</span></div><div><div class="what">${e.title}</div><div class="who">${dateWeekday(d)} · ${e.time} Uhr · ${e.countryName}</div></div></li>`; })}</ul>
      </section>
      ${c.sideRecent()}
    </aside>
  </div>
</div>

<section class="section-band" aria-labelledby="h-board">
  <div class="container">
    ${c.sectionTitle('Marktüberblick', { id: 'h-board', stand: true })}
    ${c.board(layout.stripSlugs)}
    <p class="small muted" style="margin-top:12px">Xetra-Kurse 15 Minuten verzögert, Devisen und Krypto nahezu Echtzeit · <a href="/maerkte">Alle Märkte ›</a></p>
  </div>
</section>

<div class="container" style="padding-bottom:40px">
  <section aria-labelledby="h-wissen" style="margin-bottom:32px">
    ${c.sectionTitle('Börsenwissen', { href: '/wissen', more: 'Alle Ratgeber', id: 'h-wissen' })}
    <div class="guide-cards">${content.guides.slice(0, 3).map((g, i) => html`<a class="guide-card" href="/wissen/${g.slug}"><span class="num">0${i + 1}</span><h3>${g.title}</h3><p>${g.lead}</p><span class="meta">${g.kicker} · ${g.minutes} Min. Lesezeit</span></a>`)}</div>
  </section>
  <div class="layout no-sticky">
    <div class="stack">
      <section aria-labelledby="h-analysis">
        ${c.sectionTitle('Technische Analysen', { href: '/analysen', more: 'Alle Analysen', id: 'h-analysis' })}
        <div class="tabs is-pills" data-tabs="ana-panels" role="tablist"><button class="tab is-active" role="tab" type="button" data-tab="alle">Alle</button><button class="tab" role="tab" type="button" data-tab="indizes">Indizes</button><button class="tab" role="tab" type="button" data-tab="aktien">Aktien</button><button class="tab" role="tab" type="button" data-tab="rohstoffe">Rohstoffe & Devisen</button><button class="tab" role="tab" type="button" data-tab="produkte">ETF & Hebel</button></div>
        <div id="ana-panels" class="card">
          <div data-panel="alle">${c.analysisList(analyses.slice(0, 8))}</div>
          <div data-panel="indizes" hidden>${c.analysisList(analyses.filter(a => a.category === 'analysen-indizes'))}</div>
          <div data-panel="aktien" hidden>${c.analysisList(analyses.filter(a => a.category === 'analysen-aktien'))}</div>
          <div data-panel="rohstoffe" hidden>${c.analysisList(analyses.filter(a => a.category === 'analysen-rohstoffe-devisen'))}</div>
          <div data-panel="produkte" hidden>${c.analysisList(analyses.filter(a => ['analysen-etf', 'analysen-hebelprodukte'].includes(a.category)))}</div>
        </div>
      </section>
      <section class="grid-3" aria-label="Weitere Märkte">
        <div class="card">${c.sectionTitle('Rohstoffe', { href: '/rohstoffe', more: 'Alle' })}${c.miniQuotes(instruments.commodities.slice(0, 5))}</div>
        <div class="card">${c.sectionTitle('Devisen', { href: '/devisen', more: 'Alle' })}${c.miniQuotes(instruments.fx.slice(0, 5))}</div>
        <div class="card">${c.sectionTitle('Krypto & Zinsen', { href: '/krypto', more: 'Alle' })}${c.miniQuotes([...instruments.crypto.slice(0, 2), ...instruments.bonds])}</div>
      </section>
      <section aria-labelledby="h-calc">
        ${c.sectionTitle('Rechner', { href: '/werkzeuge', more: 'Alle Werkzeuge', id: 'h-calc' })}
        ${c.calcTabs(content.tools, { id: 'home' })}
      </section>
    </div>
    <aside>
      <section class="card">
        ${c.sectionTitle('Börsengänge', { href: '/termine/ipos', more: 'Alle IPOs' })}
        ${c.ipoList(content.ipos.upcoming.slice(0, 3))}
        <p class="small muted" style="margin-top:12px">${c.placeholder()} Firmennamen sind Beispiele, bis der IPO-Datenfeed angebunden ist.</p>
      </section>
      ${c.quizBox()}
      ${c.pollBox()}
      ${c.newsletterBox({ compact: true })}
    </aside>
  </div>
</div>`;

  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: config.brand, url: config.domain, inLanguage: 'de', potentialAction: { '@type': 'SearchAction', target: `${config.domain}/suche?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  return [{ path: '/', html: layout.page({ title: config.brand, description: config.description, path: '/', body, section: null, jsonLd }) }];
};
