'use strict';
module.exports = function (ctx) {
  const { c, layout, util, content, config } = ctx;
  const { html, raw, dateLong } = util;
  const pages = [];
  const { posts, topics } = content.blog;
  const add = (path, title, description, body, opts = {}) => { content.searchablePages.push({ title, path, kicker: 'Blog', description }); pages.push({ path, html: layout.page({ title, description, path, body, section: 'blog', ...opts }) }); };
  const topicChips = (current) => html`<div class="chips topic-chips">${[['Alle Themen', '/blog'], ...topics.map(t => [t.name, c.topicUrl(t)])].map(([l, h]) => html`<a class="chip ${h === current ? 'is-active' : ''}" href="${h}">${l}</a>`)}</div>`;

  function hub({ path, title, lead, list, current, topic }) {
    const [first, ...others] = list;
    const body = html`<div class="container page">
      ${c.breadcrumb(topic ? [['Blog', '/blog'], [topic.name, path]] : [['Blog', '/blog']])}
      ${c.pageHead({ kicker: 'Blog', title, lead })}
      ${topicChips(current)}
      <div class="layout no-sticky"><div class="stack">
        ${list.length ? html`<div class="post-grid">${c.postCard(first, { featured: true })}${others.slice(0, 8).map(p => c.postCard(p))}</div>
        ${others.length > 8 ? html`<section class="card">${c.sectionTitle('Weitere Beiträge')}${c.postList(others.slice(8))}</section>` : ''}` : html`<div class="empty">Zu diesem Thema gibt es noch keine Beiträge.</div>`}
        ${topic && list.length < 6 ? html`<section>${c.sectionTitle('Weitere Beiträge aus dem Blog', { href: '/blog', more: 'Alle Beiträge' })}<div class="post-grid">${posts.filter(p => !list.includes(p)).slice(0, 4).map(p => c.postCard(p))}</div></section>` : ''}
        ${c.nlInline('Kein Beitrag mehr verpassen')}
      </div><aside>
        ${c.newsletterBox({ compact: true })}
        ${c.sideCard('Themen', html`<ul class="side-list">${topics.map(t => html`<li><a href="${c.topicUrl(t)}"><span>${t.name}</span><span class="kicker">${posts.filter(p => p.topic === t.slug).length} ${posts.filter(p => p.topic === t.slug).length === 1 ? 'Beitrag' : 'Beiträge'}</span></a></li>`)}</ul>`)}
        ${c.sideKnowledge()}
      </aside></div></div>`;
    add(path, title, lead, body);
  }

  hub({ path: '/blog', title: 'Blog: Geld anlegen, verständlich erklärt', lead: 'Praxisnahe Beiträge für Anlegerinnen und Anleger – vom ersten Sparplan bis zur Dividendenstrategie. Konkrete Zahlen, keine Produktwerbung, jeder Beitrag mit dem Wichtigsten in einem Satz.', list: posts, current: '/blog' });
  for (const t of topics) hub({ path: c.topicUrl(t), title: `Blog: ${t.name}`, lead: `Alle Beiträge zum Thema ${t.name} – praxisnah, mit echten Zahlen und ohne Produktwerbung.`, list: posts.filter(p => p.topic === t.slug), current: c.topicUrl(t), topic: t });

  for (const p of posts) {
    const author = content.authors.bySlug[p.author];
    const related = posts.filter(x => x !== p && x.topic === p.topic).slice(0, 3).concat(posts.filter(x => x !== p && x.topic !== p.topic).slice(0, 3)).slice(0, 4);
    const body = html`<div class="container page">
      ${c.breadcrumb([['Blog', '/blog'], [p.topicObj.name, c.topicUrl(p.topicObj)], [p.title, c.blogUrl(p)]])}
      <div class="layout">
        <article class="article" data-article="${p.title}" data-article-cat="Blog">
          <header class="article-head"><span class="kicker"><a href="${c.topicUrl(p.topicObj)}">${p.topicObj.name}</a></span><h1>${p.title}</h1><p class="deck">${p.lead}</p>
            <div class="article-meta"><div class="author-line">${c.avatar(author)}<div><strong><a href="/redaktion#${author.slug}">${author.name}</a></strong><span>${author.role}</span></div></div><span class="spacer"></span><time datetime="${p.date.toISOString()}" translate="no">${dateLong(p.date)}</time><span>· ${p.minutes} Min. Lesezeit</span><button class="btn btn-ghost btn-sm" type="button" data-share><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>Link teilen</button></div></header>
          <figure class="article-hero">${c.thumb('blog-' + p.slug, { label: p.topicObj.name })}</figure>
          ${c.takeaway(p.takeaway)}
          <div class="prose">${p.sections.map((s, i) => html`<h2 id="${util.slugify(s.h)}">${s.h}</h2>${raw(c.wrapTables(s.html))}${i === 1 ? c.nlInline() : ''}`)}</div>
          <footer class="article-foot">
            ${c.newsletterBox({ dark: true })}
            <div class="card"><h3 style="margin-bottom:10px">Weiterlesen</h3>${c.postList(related)}</div>
            <div class="author-box">${c.avatar(author, true)}<div><strong>${author.name}</strong><span class="small muted">${author.role} · Schwerpunkt: ${author.focus}</span><p>${author.bio}</p></div></div>
            ${c.disclaimer()}
          </footer>
        </article>
        <aside class="no-sticky">
          ${c.newsletterBox({ compact: true })}
          ${c.sideBlog(5, p.slug)}
          ${c.sideTools()}
        </aside>
      </div></div>`;
    const jsonLd = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.lead, datePublished: p.date.toISOString(), dateModified: p.date.toISOString(), author: { '@type': author.slug === 'redaktion' ? 'Organization' : 'Person', name: author.name }, publisher: { '@type': 'Organization', name: config.brand }, mainEntityOfPage: `${config.domain}${c.blogUrl(p)}`, articleSection: p.topicObj.name, wordCount: p.words, inLanguage: 'de' };
    pages.push({ path: c.blogUrl(p), html: layout.page({ title: p.title, description: p.lead, path: c.blogUrl(p), body, section: 'blog', ogType: 'article', jsonLd, reading: true }) });
  }
  return pages;
};
