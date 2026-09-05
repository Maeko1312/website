'use strict';
module.exports = function (ctx) {
  const { c, layout, util, content, config } = ctx;
  const { html, raw, dateLong } = util;
  const pages = [];
  const guides = content.guides;
  const add = (path, title, description, body, extra = {}) => { content.searchablePages.push({ title, path, kicker: 'Wissen', description }); pages.push({ path, html: layout.page({ title, description, path, body, section: 'wissen', ...extra }) }); };

  // ---------- Hub ----------
  {
    const terms = content.glossary.filter(t => ['dax', 'etf', 'kgv', 'dividende', 'spread', 'stop-loss', 'volatilitaet', 'zinseszins'].includes(t.slug));
    const body = html`<div class="container page">
      ${c.breadcrumb([['Wissen', '/wissen']])}
      ${c.pageHead({ kicker: 'Börsenwissen', title: 'Börse verstehen', lead: 'Ratgeber vom ersten Depot bis zur Chartanalyse, ein Lexikon mit den wichtigsten Begriffen und Rechner, mit denen Sie Ihre Zahlen selbst prüfen. Geschrieben für Menschen, nicht für Fachleute.' })}
      <section style="margin-bottom:32px">${c.sectionTitle('Ratgeber')}<div class="guide-cards">${guides.map((g, i) => html`<a class="guide-card" href="/wissen/${g.slug}"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${g.title}</h3><p>${g.lead}</p><span class="meta">${g.kicker} · ${g.minutes} Min. Lesezeit</span></a>`)}</div></section>
      <div class="layout no-sticky"><div class="stack">
        <section class="card">${c.sectionTitle('Börsenlexikon', { href: '/wissen/boersenlexikon', more: `Alle ${content.glossary.length} Begriffe` })}<dl>${terms.map(t => html`<div class="term"><dt><a href="/wissen/boersenlexikon#${t.slug}">${t.term}</a></dt><dd>${t.def.split('. ')[0]}.</dd></div>`)}</dl></section>
        <section class="card faq">${c.sectionTitle('Häufige Fragen')}
          <details><summary>Wie viel Geld brauche ich, um anzufangen?</summary><p>Sparpläne gibt es ab 1 Euro, sinnvoll sind 25 bis 50 Euro monatlich. Wichtiger als der Betrag ist die Regelmäßigkeit – und ein Notgroschen von drei Monatsgehältern auf dem Tagesgeldkonto, bevor Sie investieren.</p></details>
          <details><summary>Wann ist der richtige Zeitpunkt zum Einstieg?</summary><p>Niemand kann Kurse verlässlich vorhersagen. Wer regelmäßig investiert, kauft automatisch zu hohen und niedrigen Kursen und glättet den Einstiegspreis. Historisch war der beste Zeitpunkt für einen langfristigen Anleger fast immer „jetzt“.</p></details>
          <details><summary>Was passiert mit meinen Aktien, wenn mein Broker pleitegeht?</summary><p>Wertpapiere sind Sondervermögen und gehören Ihnen, nicht der Bank. Sie werden auf ein anderes Depot übertragen. Nur Guthaben auf dem Verrechnungskonto unterliegen der Einlagensicherung bis 100.000 €.</p></details>
          <details><summary>Muss ich Kursgewinne in der Steuererklärung angeben?</summary><p>Bei deutschen Banken nicht – sie führen die Abgeltungsteuer automatisch ab. Ausnahmen: ausländische Depots, Kryptowährungen und wenn Sie Verluste zwischen verschiedenen Banken verrechnen wollen. Details im Ratgeber <a href="/wissen/steuern">Steuern</a>.</p></details>
          <details><summary>Warum stehen bei Xetra-Kursen „15 Minuten verzögert“?</summary><p>Echtzeitkurse der Deutschen Börse sind lizenzpflichtig. Kostenlose Portale zeigen deshalb Kurse mit 15 Minuten Verzögerung; Ihr Broker liefert Echtzeitkurse für die Orderaufgabe. Mehr unter <a href="/methodik">Methodik & Datenquellen</a>.</p></details>
        </section>
      </div><aside>${c.sideTools()}${c.sideCard('Redaktion', html`<p class="small">Die Ratgeber schreibt ${content.authors.bySlug['sara-yilmaz'].name}, die Chartanalyse-Grundlagen ${content.authors.bySlug['jonas-weber'].name}. Wer wir sind: <a href="/redaktion">Redaktion</a>, nach welchen Regeln wir arbeiten: <a href="/redaktionelle-leitlinien">Leitlinien</a>.</p>`)}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add('/wissen', 'Börsenwissen', 'Ratgeber für Einsteiger und Fortgeschrittene, Börsenlexikon und Rechner – Börse verständlich erklärt.', body);
  }

  // ---------- Ratgeber ----------
  for (const g of guides) {
    const author = content.authors.bySlug[g.author];
    const others = guides.filter(x => x !== g).slice(0, 4);
    const body = html`<div class="container page">
      ${c.breadcrumb([['Wissen', '/wissen'], [g.title, `/wissen/${g.slug}`]])}
      <div class="layout">
        <article class="article" data-article="${g.title}" data-article-cat="Wissen">
          <header class="article-head"><span class="kicker">${g.kicker}</span><h1>${g.title}</h1><p class="deck">${g.lead}</p>
            <div class="article-meta"><div class="author-line">${c.avatar(author)}<div><strong>${author.name}</strong><span>${author.role}</span></div></div><span class="spacer"></span><span>${g.minutes} Min. Lesezeit</span><span>· Aktualisiert ${dateLong(ctx.now)}</span></div></header>
          <div class="prose">${g.sections.map((s, i) => html`<h2 id="${s.id}">${s.h}</h2>${raw(c.wrapTables(s.html))}${i === 1 ? c.nlInline('Börse verstehen – jeden Morgen ein Stück mehr') : ''}`)}</div>
          <footer class="article-foot">
            ${c.newsletterBox({ dark: true })}
            <div class="card"><h3 style="margin-bottom:10px">Weiterlesen</h3><ul class="side-list">${others.map(o => html`<li><a href="/wissen/${o.slug}"><span class="kicker">${o.kicker}</span><span>${o.title}</span></a></li>`)}</ul></div>
            ${c.disclaimer()}
          </footer>
        </article>
        <aside class="no-sticky">
          <nav class="toc" aria-label="Inhalt"><strong>Inhalt</strong><ol>${g.sections.map(s => html`<li><a href="#${s.id}">${s.h}</a></li>`)}</ol></nav>
          ${c.sideTools()}
          ${c.newsletterBox({ compact: true })}
        </aside>
      </div></div>`;
    add(`/wissen/${g.slug}`, g.title, g.lead, body, { ogType: 'article', reading: true, jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.lead, author: { '@type': author.slug === 'redaktion' ? 'Organization' : 'Person', name: author.name }, publisher: { '@type': 'Organization', name: config.brand }, dateModified: ctx.now.toISOString(), inLanguage: 'de' } });
  }

  // ---------- Lexikon ----------
  {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const groups = {};
    for (const t of content.glossary) { const L = t.term[0].toUpperCase(); (groups[L] = groups[L] || []).push(t); }
    const body = html`<div class="container page">
      ${c.breadcrumb([['Wissen', '/wissen'], ['Börsenlexikon', '/wissen/boersenlexikon']])}
      ${c.pageHead({ kicker: 'Wissen', title: 'Börsenlexikon', lead: html`${content.glossary.length} Begriffe von Abgeltungsteuer bis Zinseszins – kurz erklärt, mit Verweisen auf verwandte Einträge. Jeder Eintrag ist direkt verlinkbar.` })}
      <div class="filter-bar"><label class="label" for="term-filter">Begriff suchen</label><div class="control" style="flex:1;max-width:360px"><input id="term-filter" type="search" placeholder="z. B. Dividende, KGV, Spread …" data-filter-input="term-list" autocomplete="off"></div><span class="small muted"><span data-filter-count="term-list">${content.glossary.length}</span> Einträge</span></div>
      <nav class="az" aria-label="Alphabet">${letters.map(L => groups[L] ? html`<a href="#lex-${L}">${L}</a>` : html`<span aria-hidden="true">${L}</span>`)}</nav>
      <div class="layout no-sticky"><div id="term-list">
        ${letters.filter(L => groups[L]).map(L => html`<section data-filter-group><h2 class="letter-head" id="lex-${L}">${L}</h2><dl>${groups[L].map(t => html`<div class="term" id="${t.slug}" data-filter-item="${t.term}"><dt>${t.term}</dt><dd>${t.def}${t.related.length ? html`<span class="block small" style="margin-top:6px"><span class="muted">Siehe auch:</span> ${t.related.map((r, i) => html`${i ? ', ' : ''}<a href="#${r.slug}">${r.term}</a>`)}</span>` : ''}</dd></div>`)}</dl></section>`)}
        <div class="empty" data-filter-empty="term-list" hidden>Kein Eintrag gefunden. Fehlt ein Begriff? <a href="/kontakt">Schreiben Sie uns</a>.</div>
      </div><aside>${c.sideKnowledge()}${c.sideTools()}</aside></div></div>`;
    add('/wissen/boersenlexikon', 'Börsenlexikon', `${content.glossary.length} Börsenbegriffe kurz erklärt: von Abgeltungsteuer und Aktie über KGV und Spread bis Zinseszins.`, body);
  }
  return pages;
};
