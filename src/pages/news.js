'use strict';
module.exports = function (ctx) {
  const { c, layout, util, instruments, content, config } = ctx;
  const { html, raw, num, dateShort, dateLong, time, relDate } = util;
  const pages = [];
  const cats = content.categories;
  const newsSubnav = [['Alle', '/nachrichten'], ...cats.news.map(k => [k.name, `/nachrichten/${k.slug}`]), ['Ratgeber', '/nachrichten/ratgeber']];

  function listPage({ path, title, lead, kicker, arts, subnav, section, crumbs, cat }) {
    // Keine doppelten Motive auf einer Listenseite: Doppelgänger erhalten ein hier noch ungenutztes Foto
    { const seenImg = new Set(); for (const it of arts) { if (!it.image) continue; if (seenImg.has(it.image)) { const alt = content.photos.alternative(it, seenImg); if (alt) { it.image = alt.file; it.imageAlt = alt.alt; it.imageCredit = content.photos.credit(alt); } } seenImg.add(it.image); } }
    const [first, ...others] = arts;
    const body = html`<div class="container page">
      ${c.breadcrumb(crumbs)}
      ${c.pageHead({ kicker, title, lead })}
      ${c.subnav(subnav, path)}
      <div class="layout">
        <div class="stack">
          ${arts.length ? html`${section === 'analysen' ? html`<div class="card">${c.analysisList(arts.slice(0, 6))}</div>` : c.heroStory(first)}
          <section>${c.sectionTitle(section === 'analysen' ? 'Alle Analysen' : 'Weitere Meldungen', { tag: 'h2' })}${c.storyList(section === 'analysen' ? arts : others, { thumb: true, excerpt: true })}</section>` : html`<div class="empty">In diesem Ressort gibt es noch keine Beiträge.</div>`}
          ${cat && arts.length < 8 ? (() => { const pool = content.articles.filter(x => !arts.includes(x)).slice(0, Math.max(4, 10 - arts.length)); return pool.length ? html`<section>${c.sectionTitle(section === 'analysen' ? 'Weitere aktuelle Analysen' : 'Aktuelle Meldungen aus allen Ressorts', { tag: 'h2', href: section === 'analysen' ? '/nachrichten' : '/nachrichten', more: 'Alle' })}${c.storyList(pool, { thumb: true, excerpt: true })}</section>` : ''; })() : ''}
          ${cat ? html`<p class="small muted">Ressort „${cat.name}“: ${arts.length} ${arts.length === 1 ? 'Beitrag' : 'Beiträge'}. Neue Meldungen erscheinen oben; der <a href="/feed.xml">RSS-Feed</a> liefert alle Ressorts.</p>` : ''}
        </div>
        <aside>
          ${c.featuredPromo()}
          ${c.newsletterBox({ compact: true })}
        </aside>
      </div>
    </div>`;
    content.searchablePages.push({ title, path, kicker: kicker || 'Nachrichten', description: lead });
    return { path, html: layout.page({ title, description: lead, path, body, section }) };
  }

  const news = content.articles; // alle Beitragsarten (Nachrichten und Analysen) laufen als Nachrichten
  // Ratgeber (ehemals Blog) sind Teil der Nachrichten: hervorgehobene zuerst, dann nach Datum
  const posts = [...content.blog.posts.filter(p => p.featured), ...content.blog.posts.filter(p => !p.featured)];
  const newsAndPosts = [...news, ...content.blog.posts].sort((x, y) => y.date - x.date);
  const analyses = content.articles.filter(a => a.kind === 'analysis');
  pages.push(listPage({ path: '/nachrichten', title: 'Alle Nachrichten', kicker: 'Nachrichten', lead: 'Marktberichte mit den echten Schlusskursen, Aktien-Checks, Konjunktur, Zentralbanken, Rohstoffe und Krypto – chronologisch, ohne Klickstrecken.', arts: newsAndPosts, subnav: newsSubnav, section: 'nachrichten', crumbs: [['Nachrichten', '/nachrichten']] }));
  pages.push(listPage({ path: '/nachrichten/ratgeber', title: 'Ratgeber', kicker: 'Nachrichten', lead: 'Praxisnahe Anleitungen für Anlegerinnen und Anleger – vom ersten Sparplan bis zur Dividendenstrategie. Konkrete Zahlen, keine Produktwerbung.', arts: posts, subnav: newsSubnav, section: 'nachrichten', crumbs: [['Nachrichten', '/nachrichten'], ['Ratgeber', '/nachrichten/ratgeber']], cat: { name: 'Ratgeber', slug: 'ratgeber' } }));
  for (const k of cats.news) pages.push(listPage({ path: `/nachrichten/${k.slug}`, title: k.name, kicker: 'Nachrichten', lead: k.description, arts: news.filter(a => a.category === k.slug), subnav: newsSubnav, section: 'nachrichten', crumbs: [['Nachrichten', '/nachrichten'], [k.name, `/nachrichten/${k.slug}`]], cat: k }));

  // ---------- Artikelseiten ----------
  for (const a of content.articles) {
    const cat = a.categoryObj, author = c.authorOf(a);
    const insts = (a.instruments || []).map(s => instruments.bySlug[s]).filter(Boolean);
    const main = insts[0];
    const related = content.articles.filter(x => x !== a && (x.category === a.category || (main && x.instruments && x.instruments.includes(main.slug)))).slice(0, 5);
    const listUrl = cat.kind === 'analysis' ? '/nachrichten' : '/nachrichten';
    const srcCount = ((a.body.match(/<ul class="sources">[\s\S]*?<\/ul>/) || [''])[0].match(/<li>/g) || []).length;
    const hasHist = !!(main && ctx.hist(main.slug) && ctx.hist(main.slug).points.length > 1);
    const body = html`<div class="container page reader">
      ${c.breadcrumb([['Nachrichten', '/nachrichten'], [cat.name, c.catUrl(cat)], [a.title, c.articleUrl(a)]])}
      <article class="reader-article" data-article="${a.title}" data-article-cat="${cat.name}">
        <header class="reader-head">
          <p class="reader-kicker"><a href="${c.catUrl(cat)}">${cat.name}</a>${a.kind === 'analysis' && a.direction ? html` · <span class="${a.direction === 'up' ? 'up' : 'down'}">${a.direction === 'up' ? 'Bullisch' : 'Bärisch'}</span>` : ''}${a.featured ? html` <span class="badge is-accent">Im Fokus</span>` : ''}${a.sponsored ? html` <span class="badge">Anzeige</span>` : ''}</p>
          <h1>${a.title}</h1>
          <p class="reader-deck">${a.deck}</p>
          <p class="reader-meta"><time datetime="${a.date.toISOString()}" translate="no">${dateLong(a.date)}, ${time(a.date)} Uhr</time><span>Lesezeit ${a.readTime} Min.</span>${srcCount ? html`<span><a href="#quellen">${srcCount} Quellen</a></span>` : ''}</p>
        </header>
        ${a.image ? html`<figure class="reader-hero"><img src="${a.image}" alt="${a.imageAlt || ''}" loading="eager" fetchpriority="high" decoding="async" width="1600" height="900">${a.imageCredit ? html`<figcaption>Foto: ${a.imageCredit}</figcaption>` : ''}</figure>` : ''}
        ${(a.summary && a.summary.length) || (a.facts && a.facts.length) ? html`<aside class="reader-glance" aria-labelledby="h-glance"><h2 id="h-glance">Auf einen Blick</h2>${a.summary && a.summary.length ? html`<ul>${a.summary.map(x => html`<li>${x}</li>`)}</ul>` : ''}${a.facts && a.facts.length ? html`<dl class="reader-facts">${a.facts.slice(0, 6).map(([k, v, cls, sub]) => html`<div><dt>${k}</dt><dd class="${cls || ''}">${v}${sub ? html` <small>${sub}</small>` : ''}</dd></div>`)}</dl>` : ''}</aside>` : ''}
        <div class="prose reader-prose">${raw(c.wrapTables(a.body).replace('<h2>Quellen</h2>', '<h2 id="quellen">Quellen</h2>'))}</div>
        ${hasHist ? html`<section class="reader-chart" aria-labelledby="h-chart"><h2 id="h-chart">Kurs: ${main.name}</h2>${c.interactiveChart(main, ctx.quote(main.slug), ctx.hist(main.slug))}<p class="small muted">Mehr Kennzahlen und lange Historie auf der <a href="${c.url(main)}">Kursseite ${main.short || main.name}</a>.</p></section>` : ''}
        <footer class="reader-foot">
          ${related.length ? html`<section class="reader-related" aria-labelledby="h-related"><h2 id="h-related">Mehr zum Thema</h2><ul>${related.slice(0, 4).map(r => html`<li><a href="${c.articleUrl(r)}">${r.title}</a><span class="reader-related-meta"><time datetime="${r.date.toISOString()}" data-rel>${util.relTime(r.date, ctx.now)}</time> · ${r.categoryObj.name}</span></li>`)}</ul></section>` : ''}
          ${c.newsletterBox({ compact: true })}
          ${c.disclaimer()}
        </footer>
      </article>
    </div>`;
    const jsonLd = { '@context': 'https://schema.org', '@type': a.kind === 'analysis' ? 'AnalysisNewsArticle' : 'NewsArticle', headline: a.title, description: a.deck, datePublished: a.date.toISOString(), dateModified: a.date.toISOString(), author: { '@type': author.slug === 'redaktion' ? 'Organization' : 'Person', name: author.name }, publisher: { '@type': 'Organization', name: config.brand }, mainEntityOfPage: `${config.domain}${c.articleUrl(a)}`, articleSection: cat.name, inLanguage: 'de' };
    pages.push({ path: c.articleUrl(a), html: layout.page({ title: a.title, description: a.deck, path: c.articleUrl(a), body, section: cat.kind === 'analysis' ? 'analysen' : 'nachrichten', ogType: 'article', jsonLd, reading: true }) });
  }
  return pages;
};
