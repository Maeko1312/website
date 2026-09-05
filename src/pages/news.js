'use strict';
module.exports = function (ctx) {
  const { c, layout, util, instruments, content, config } = ctx;
  const { html, raw, num, dateShort, dateLong, time, relDate } = util;
  const pages = [];
  const cats = content.categories;
  const newsSubnav = [['Alle', '/nachrichten'], ...cats.news.map(k => [k.name, `/nachrichten/${k.slug}`])];
  const anaSubnav = [['Alle', '/analysen'], ...cats.analysis.map(k => [k.name, c.catUrl(k)])];

  function listPage({ path, title, lead, kicker, arts, subnav, section, crumbs, cat }) {
    const [first, ...others] = arts;
    const body = html`<div class="container page">
      ${c.breadcrumb(crumbs)}
      ${c.pageHead({ kicker, title, lead })}
      ${c.subnav(subnav, path)}
      <div class="layout">
        <div class="stack">
          ${arts.length ? html`${section === 'analysen' ? html`<div class="card">${c.analysisList(arts.slice(0, 6))}</div>` : c.heroStory(first)}
          <section>${c.sectionTitle(section === 'analysen' ? 'Alle Analysen' : 'Weitere Meldungen', { tag: 'h2' })}${c.storyList(section === 'analysen' ? arts : others, { thumb: true, excerpt: true })}</section>` : html`<div class="empty">In diesem Ressort gibt es noch keine Beiträge.</div>`}
          ${cat ? html`<p class="small muted">Ressort „${cat.name}“: ${arts.length} ${arts.length === 1 ? 'Beitrag' : 'Beiträge'}. Neue Meldungen erscheinen oben; der <a href="/feed.xml">RSS-Feed</a> liefert alle Ressorts.</p>` : ''}
        </div>
        <aside>
          ${section === 'analysen' ? c.sideIndices() : c.sideMovers()}
          ${section === 'analysen' ? c.sideLatest(6) : c.sideAnalysis(5)}
          ${c.newsletterBox({ compact: true })}
          ${c.sideUpcoming(4)}
        </aside>
      </div>
    </div>`;
    content.searchablePages.push({ title, path, kicker: kicker || 'Nachrichten', description: lead });
    return { path, html: layout.page({ title, description: lead, path, body, section }) };
  }

  const news = content.articles.filter(a => a.kind === 'news');
  const analyses = content.articles.filter(a => a.kind === 'analysis');
  pages.push(listPage({ path: '/nachrichten', title: 'Alle Nachrichten', kicker: 'Nachrichten', lead: 'Marktberichte mit den echten Schlusskursen, Aktien-Checks, Konjunktur, Zentralbanken, Rohstoffe und Krypto – chronologisch, ohne Klickstrecken.', arts: news, subnav: newsSubnav, section: 'nachrichten', crumbs: [['Nachrichten', '/nachrichten']] }));
  for (const k of cats.news) pages.push(listPage({ path: `/nachrichten/${k.slug}`, title: k.name, kicker: 'Nachrichten', lead: k.description, arts: news.filter(a => a.category === k.slug), subnav: newsSubnav, section: 'nachrichten', crumbs: [['Nachrichten', '/nachrichten'], [k.name, `/nachrichten/${k.slug}`]], cat: k }));
  pages.push(listPage({ path: '/analysen', title: 'Analysen', kicker: 'Technische Analyse & Produkte', lead: 'Chartanalysen zu Indizes, Aktien, Rohstoffen und Devisen auf Basis der Tagesschlusskurse – mit klar benannten Marken, Trendrichtung und Szenarien. Dazu Grundlagen zu ETFs und Hebelprodukten.', arts: analyses, subnav: anaSubnav, section: 'analysen', crumbs: [['Analysen', '/analysen']] }));
  for (const k of cats.analysis) pages.push(listPage({ path: c.catUrl(k), title: `Analysen: ${k.name}`, kicker: 'Analysen', lead: k.description, arts: analyses.filter(a => a.category === k.slug), subnav: anaSubnav, section: 'analysen', crumbs: [['Analysen', '/analysen'], [k.name, c.catUrl(k)]], cat: k }));

  // ---------- Artikelseiten ----------
  for (const a of content.articles) {
    const cat = a.categoryObj, author = c.authorOf(a);
    const insts = (a.instruments || []).map(s => instruments.bySlug[s]).filter(Boolean);
    const main = insts[0];
    const related = content.articles.filter(x => x !== a && (x.category === a.category || (main && x.instruments && x.instruments.includes(main.slug)))).slice(0, 5);
    const listUrl = cat.kind === 'analysis' ? '/analysen' : '/nachrichten';
    const body = html`<div class="container page">
      ${c.breadcrumb([[cat.kind === 'analysis' ? 'Analysen' : 'Nachrichten', listUrl], [cat.name, c.catUrl(cat)], [a.title, c.articleUrl(a)]])}
      <div class="layout">
        <article class="article" data-article="${a.title}" data-article-cat="${cat.name}">
          <header class="article-head">
            <div class="story-top"><span class="tag"><a href="${c.catUrl(cat)}">${cat.name}</a></span>${a.kind === 'analysis' && a.direction ? html`<span class="badge ${a.direction === 'up' ? 'is-up' : 'is-down'}">${a.direction === 'up' ? '▲ Bullisch' : '▼ Bärisch'}</span>` : a.kind === 'analysis' ? html`<span class="badge">► Neutral</span>` : ''}${a.generated ? html`<span class="badge" title="Aus offiziellen Kursdaten erzeugt und redaktionell geprüft">Datenbasiert</span>` : ''}</div>
            <h1>${a.title}</h1>
            <p class="deck">${a.deck}</p>
            <div class="article-meta">
              <div class="author-line">${c.avatar(author)}<div><strong><a href="/redaktion#${author.slug}">${author.name}</a></strong><span>${author.role}</span></div></div>
              <span class="spacer"></span>
              <time datetime="${a.date.toISOString()}">${dateLong(a.date)}, ${time(a.date)} Uhr</time>
              <span>· ${a.readTime} Min. Lesezeit</span>
              <button class="btn btn-ghost btn-sm" type="button" data-share>Teilen</button>
            </div>
          </header>
          <figure class="article-hero">${c.thumb(a.slug, { label: main ? main.short || main.name : cat.name })}<figcaption>${main ? html`${main.name} – Kursverlauf schematisch. Echte Charts auf der <a href="${c.url(main)}">Kursseite</a>.` : 'Symbolbild.'}</figcaption></figure>
          ${main ? html`<div class="instrument-box"><div><a href="${c.url(main)}">${main.name}</a><span class="muted small block">${c.typeLabel(main)}${main.isin ? ' · ' + main.isin : ''} · ${layout.asOfLabel}</span></div><div class="vals"><strong>${c.priceCell(main, ctx.quote(main.slug) || {})}</strong>${c.delta((ctx.quote(main.slug) || {}).changePct, { pill: true })}${c.watchButton(main.slug, true)}</div></div>` : ''}
          <div class="prose">${raw(c.injectAfterParagraph(c.wrapTables(a.body), c.nlInline(a.kind === 'analysis' ? 'Jeden Morgen die wichtigsten Marken – kostenlos' : undefined), 2))}</div>
          <footer class="article-foot">
            ${c.newsletterBox({ dark: true })}
            ${insts.length ? html`<div class="related-tags"><span class="kicker" style="align-self:center">Werte in diesem Beitrag:</span>${insts.map(i => html`<a class="chip" href="${c.url(i)}">${i.name} ${c.delta((ctx.quote(i.slug) || {}).changePct)}</a>`)}</div>` : ''}
            <div class="author-box">${c.avatar(author, true)}<div><strong>${author.name}</strong><span class="small muted">${author.role} · Schwerpunkt: ${author.focus}</span><p>${author.bio}</p></div></div>
            ${c.disclaimer()}
          </footer>
        </article>
        <aside>
          ${main ? c.sideCard(main.name, html`${c.miniQuotes([main])}${c.perfGrid(ctx.quote(main.slug))}<p style="margin-top:12px"><a class="btn btn-dark btn-block" href="${c.url(main)}">Zur Kursseite mit Chart</a></p>`) : ''}
          ${related.length ? c.sideCard('Mehr zum Thema', c.storyList(related, { variant: 'is-compact' })) : ''}
          ${c.sideLatest(5, a.slug)}
          ${c.newsletterBox({ compact: true })}
        </aside>
      </div>
    </div>`;
    const jsonLd = { '@context': 'https://schema.org', '@type': a.kind === 'analysis' ? 'AnalysisNewsArticle' : 'NewsArticle', headline: a.title, description: a.deck, datePublished: a.date.toISOString(), dateModified: a.date.toISOString(), author: { '@type': author.slug === 'redaktion' ? 'Organization' : 'Person', name: author.name }, publisher: { '@type': 'Organization', name: config.brand }, mainEntityOfPage: `${config.domain}${c.articleUrl(a)}`, articleSection: cat.name, inLanguage: 'de' };
    pages.push({ path: c.articleUrl(a), html: layout.page({ title: a.title, description: a.deck, path: c.articleUrl(a), body, section: cat.kind === 'analysis' ? 'analysen' : 'nachrichten', ogType: 'article', jsonLd, reading: true }) });
  }
  return pages;
};
