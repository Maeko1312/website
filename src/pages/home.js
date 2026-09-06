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
      <section class="today" aria-labelledby="h-today">
        ${c.sectionTitle('Nachrichten des Tages', { href: '/nachrichten', more: 'Alle Nachrichten', id: 'h-today' })}
        <ul class="today-list">${todayCards.map(a => c.todayItem(a))}</ul>
      </section>
    </div>
  </div>

  ${c.nlBanner()}

  <section aria-labelledby="h-blog" style="margin-bottom:32px">
    ${c.sectionTitle('Aus dem Blog', { href: '/blog', more: 'Alle Beiträge', id: 'h-blog' })}
    <div class="chips post-filter" data-post-filter role="group" aria-label="Thema wählen"><button type="button" class="chip is-active" data-topic="all" aria-pressed="true">Alle Themen</button>${content.blog.topics.filter(t => posts.some(p => p.topic === t.slug)).map(t => html`<button type="button" class="chip" data-topic="${t.slug}" aria-pressed="false">${t.name}</button>`)}</div>
    <div class="post-grid" data-paged="6">${posts.map(p => c.postCard(p))}</div>
    <nav class="pager" data-pager aria-label="Weitere Beiträge" hidden></nav>
  </section>

</div>

<div class="container" style="padding-bottom:40px">
  <section aria-labelledby="h-wissen" style="margin-bottom:32px">
    ${c.sectionTitle('Börsenwissen', { href: '/wissen', more: 'Alle Ratgeber', id: 'h-wissen' })}
    <div class="guide-cards">${content.guides.slice(0, 3).map((g, i) => html`<a class="guide-card" href="/wissen/${g.slug}"><span class="num">0${i + 1}</span><h3>${g.title}</h3><p>${g.lead}</p><span class="meta">${g.kicker} · ${g.minutes} Min. Lesezeit</span></a>`)}</div>
  </section>
  ${c.quizBox({ wide: true })}
  <section aria-labelledby="h-calc" style="margin-bottom:32px">
    ${c.sectionTitle('Rechner', { href: '/werkzeuge', more: 'Alle Werkzeuge', id: 'h-calc' })}
    ${c.calcTabs(content.tools, { id: 'home' })}
  </section>
  ${c.postTips(posts)}
  ${c.pollBox({ wide: true })}
</div>
${c.nlClosing()}`;

  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: config.brand, url: config.domain, inLanguage: 'de', potentialAction: { '@type': 'SearchAction', target: `${config.domain}/suche?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  return [{ path: '/', html: layout.page({ title: config.brand, description: config.description, path: '/', body, section: null, jsonLd }) }];
};
