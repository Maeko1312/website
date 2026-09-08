'use strict';
module.exports = function (ctx) {
  const { c, layout, util, content, config } = ctx;
  const { html } = util;
  const news = content.articles.filter(a => a.kind === 'news');
  // Aufmacher: hervorgehobener Blogbeitrag > hervorgehobene Nachricht > neueste Meldung
  const campaign = content.featured.active[0] || null; // aktive Kampagne (Im Fokus) ist der Aufmacher
  const lead = campaign ? c.campaignItem(campaign) : (content.blog.posts.find(p => p.featured) || news.find(a => a.featured) || news[0]);
  const rest = news.filter(a => a !== lead);
  const todayCards = rest.slice(0, 4);
  const posts = [...content.blog.posts.filter(p => p.featured), ...content.blog.posts.filter(p => !p.featured)]; // hervorgehobene zuerst
  // Nachrichten und Blogbeiträge in einem Strom (Blog ist Teil der Nachrichten): hervorgehobene zuerst, dann nach Datum
  const stream = [...news.filter(a => a !== lead && !todayCards.includes(a)), ...posts.filter(p => p !== lead)].sort((x, y) => y.date - x.date);
  // Nachrichten nach Ressort: vier Ressorts als Spalten (Aufmacher + fünf Schlagzeilen), nur Beiträge, die oben noch nicht stehen;
  // gezeigt werden die vier Ressorts mit den meisten verfügbaren Beiträgen (bei Gleichstand in Ressort-Reihenfolge)
  const RESSORT_COLS = 4, RESSORT_ROWS = 5;
  const ressortCols = content.categories.news
    .map((cat, order) => { const all = stream.filter(i => !i.topicObj && i.category === cat.slug); return { cat, order, avail: all.length, items: [...all.filter(i => i.featured), ...all.filter(i => !i.featured)].slice(0, 1 + RESSORT_ROWS) }; }) // hervorgehobene Meldung wird Aufmacher der Spalte
    .filter(r => r.items.length >= 2)
    .sort((a, b) => b.avail - a.avail || a.order - b.order)
    .slice(0, RESSORT_COLS)
    .sort((a, b) => a.order - b.order);
  const inRessorts = new Set(ressortCols.flatMap(r => r.items));
  // „Mehr Nachrichten“: alles Weitere, hervorgehobene zuerst, dann chronologisch (ohne Aufmacher, Tageszeilen und Ressortspalten)
  const restStream = stream.filter(i => !inRessorts.has(i));
  const moreNews = [...restStream.filter(i => i.featured), ...restStream.filter(i => !i.featured)].slice(0, 24);
  // Keine doppelten Motive auf der Startseite: Doppelgänger erhalten ein hier noch ungenutztes Foto
  { const visible = [lead, ...todayCards, ...ressortCols.map(r => r.items[0]), ...moreNews]; const seenImg = new Set(); for (const it of visible) { if (!it || !it.image) continue; if (seenImg.has(it.image)) { const alt = content.photos.alternative(it, seenImg); if (alt) { it.image = alt.file; it.imageAlt = alt.alt; it.imageCredit = content.photos.credit(alt); } } seenImg.add(it.image); } }
  const body = html`<h1 class="visually-hidden">Börsenblick – Börse verstehen. Märkte im Blick.</h1>
<div class="container page home-top">
  <div class="hero">
    ${c.heroStory(lead)}
    <div class="hero-side">
      <section class="today" aria-labelledby="h-today">
        ${c.sectionTitle('Nachrichten des Tages', { href: '/nachrichten', more: 'Alle Nachrichten', id: 'h-today' })}
        <ul class="today-list">${todayCards.map(a => c.todayItem(a))}</ul>
      </section>
    </div>
  </div>


  ${ressortCols.length ? html`<section class="news-section ressorts" aria-labelledby="h-ressorts">
    ${c.sectionTitle('Nachrichten nach Ressort', { href: '/nachrichten', more: 'Alle Nachrichten', id: 'h-ressorts' })}
    <div class="ressort-grid" style="--n:${ressortCols.length}">${ressortCols.map(r => c.ressortColumn(r.cat, r.items))}</div>
  </section>` : ''}
</div>

<div class="container" style="padding-bottom:40px">
  ${c.quizBox({ wide: true })}

  <section class="news-section" aria-labelledby="h-more">
    ${c.sectionTitle('Mehr Nachrichten', { href: '/nachrichten', more: 'Alle Nachrichten', id: 'h-more' })}
    <div class="news-layout">
      <div class="news-rows">${moreNews.map(a => c.newsRow(a))}</div>
      <aside class="news-aside">${c.newsletterBox({ compact: true })}${c.pollBox()}${c.sideAnalysis(6)}</aside>
    </div>
  </section>
  <section aria-labelledby="h-calc" style="margin-bottom:32px">
    ${c.sectionTitle('Rechner', { href: '/werkzeuge', more: 'Alle Werkzeuge', id: 'h-calc' })}
    ${c.calcTabs(content.tools, { id: 'home' })}
  </section>
</div>
${c.nlClosing()}`;

  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: config.brand, url: config.domain, inLanguage: 'de', potentialAction: { '@type': 'SearchAction', target: `${config.domain}/suche?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  return [{ path: '/', html: layout.page({ title: config.brand, description: config.description, path: '/', body, section: null, jsonLd }) }];
};
