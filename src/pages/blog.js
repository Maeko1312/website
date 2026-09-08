'use strict';
module.exports = function (ctx) {
  const { c, layout, util, content, config } = ctx;
  const { html, raw, dateLong } = util;
  const pages = [];
  const { posts } = content.blog;
  for (const p of posts) {
    const author = content.authors.bySlug[p.author];
    const related = posts.filter(x => x !== p && x.topic === p.topic).slice(0, 3).concat(posts.filter(x => x !== p && x.topic !== p.topic).slice(0, 3)).slice(0, 4);
    const body = html`<div class="container page reader">
      ${c.breadcrumb([['Nachrichten', '/nachrichten'], ['Ratgeber', '/nachrichten/ratgeber'], [p.title, c.blogUrl(p)]])}
      <article class="reader-article" data-article="${p.title}" data-article-cat="Ratgeber">
        <header class="reader-head">
          <p class="reader-kicker"><a href="${c.topicUrl(p.topicObj)}">Ratgeber · ${p.topicObj.name}</a>${p.featured ? html` <span class="badge is-accent">Im Fokus</span>` : ''}${p.sponsored ? html` <span class="badge">Anzeige</span>` : ''}</p>
          <h1>${p.title}</h1>
          <p class="reader-deck">${p.lead}</p>
          <p class="reader-meta"><time datetime="${p.date.toISOString()}" translate="no">${dateLong(p.date)}</time><span>Lesezeit ${p.readTime || Math.max(3, Math.round(p.sections.map(x => x.html).join(' ').split(/\s+/).length / 200))} Min.</span></p>
        </header>
        ${p.image ? html`<figure class="reader-hero"><img src="${p.image}" alt="${p.imageAlt || ''}" loading="eager" fetchpriority="high" decoding="async" width="1600" height="900">${p.imageCredit ? html`<figcaption>Foto: ${p.imageCredit}</figcaption>` : ''}</figure>` : ''}
        ${p.takeaway ? html`<aside class="reader-glance" aria-labelledby="h-glance"><h2 id="h-glance">Das Wichtigste in einem Satz</h2><p>${p.takeaway}</p></aside>` : ''}
        <div class="prose reader-prose">${p.sections.map(sec => html`<h2 id="${util.slugify(sec.h)}">${sec.h}</h2>${raw(c.wrapTables(sec.html))}`)}</div>
        <footer class="reader-foot">
          ${related.length ? html`<section class="reader-related" aria-labelledby="h-related"><h2 id="h-related">Mehr zum Thema</h2><ul>${related.slice(0, 4).map(r => html`<li><a href="${c.blogUrl(r)}">${r.title}</a><span class="reader-related-meta">Ratgeber · ${r.topicObj.name}</span></li>`)}</ul></section>` : ''}
          ${c.newsletterBox({ compact: true })}
          ${c.disclaimer()}
        </footer>
      </article>
    </div>`;
    const jsonLd = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.lead, datePublished: p.date.toISOString(), dateModified: p.date.toISOString(), author: { '@type': author.slug === 'redaktion' ? 'Organization' : 'Person', name: author.name }, publisher: { '@type': 'Organization', name: config.brand }, mainEntityOfPage: `${config.domain}${c.blogUrl(p)}`, articleSection: p.topicObj.name, wordCount: p.words, inLanguage: 'de' };
    pages.push({ path: c.blogUrl(p), html: layout.page({ title: p.title, description: p.lead, path: c.blogUrl(p), body, section: 'nachrichten', ogType: 'article', jsonLd, reading: true }) });
  }
  return pages;
};
