'use strict';
module.exports = function (ctx) {
  const { c, layout, util, instruments, content } = ctx;
  const { html, raw } = util;
  const pages = [];
  const add = (path, title, description, body, noindex) => { content.searchablePages.push({ title, path, kicker: 'Werkzeuge', description }); pages.push({ path, html: layout.page({ title, description, path, body, section: 'werkzeuge', noindex }) }); };
  const tools = content.tools;

  // Hub: alle Rechner untereinander auf einer Seite (Sprungliste oben, Erklärung je Rechner einklappbar)
  {
    const body = html`<div class="container page calc-hub">
      ${c.breadcrumb([['Werkzeuge', '/werkzeuge']])}
      ${c.pageHead({ kicker: 'Werkzeuge', title: 'Rechner', lead: 'Sieben Rechner für die wichtigsten Anlegerfragen – Zinseszins, Sparplan, Rendite, Dividende, Währung, Positionsgröße, Inflation. Alle Berechnungen laufen in Ihrem Browser, es werden keine Daten übertragen.' })}
      <nav class="chips calc-jump" aria-label="Rechner auswählen">${tools.map(t => html`<a class="chip" href="#${t.slug}">${t.title}</a>`)}<a class="chip" href="/merkliste">Merkliste</a></nav>
      ${tools.map(t => html`<section class="calc-section" id="${t.slug}" aria-labelledby="h-${t.slug}">
        <div class="section-title"><h2 id="h-${t.slug}">${t.title}</h2></div>
        <p class="calc-lead">${t.lead}</p>
        ${c.calcForm(t, { id: 'hub-' + t.slug, framed: true })}
        <details class="calc-more"><summary>Erklärung und Formel</summary><div class="prose">${raw(c.wrapTables(t.text))}</div></details>
      </section>`)}
    </div>`;
    add('/werkzeuge', 'Rechner & Werkzeuge', 'Zinseszins-, Sparplan-, Rendite-, Dividenden-, Währungs-, Positionsgrößen- und Inflationsrechner auf einer Seite.', body);
  }

  // Merkliste
  {
    const popular = ['dax', 'gold', 'bitcoin', 'eur-usd', 'brent', 'silber', 'bund-10j', 'uran'].map(s => instruments.bySlug[s]);
    const body = html`<div class="container page" data-watchlist-page>
      ${c.breadcrumb([['Werkzeuge', '/werkzeuge'], ['Merkliste', '/merkliste']])}
      ${c.pageHead({ kicker: 'Werkzeuge', title: 'Meine Merkliste', lead: 'Indizes, Rohstoffe, Währungen, Kryptowährungen und Anleihen, die Sie beobachten möchten – mit dem Stern-Symbol auf jeder Kursseite hinzufügen. Die Liste wird ausschließlich lokal in Ihrem Browser gespeichert.' })}
      <div class="card" data-watchlist-table hidden><div class="section-title"><h2>Beobachtete Werte</h2><button class="btn btn-ghost btn-sm" type="button" data-watchlist-clear>Liste leeren</button></div><div class="table-wrap"><table class="quote-table"><thead><tr><th>Name</th><th class="num">Kurs</th><th class="num">±%</th><th class="num">YTD</th><th></th></tr></thead><tbody data-watchlist-rows></tbody></table></div><p class="small muted" style="margin-top:8px">${layout.asOfLabel}.</p></div>
      <div data-watchlist-empty><div class="empty" style="margin-bottom:24px"><p><strong>Ihre Merkliste ist noch leer.</strong></p><p>Klicken Sie auf einer Kursseite oder in der Tabelle unten auf das Stern-Symbol, um Werte hinzuzufügen.</p></div><section class="card">${c.sectionTitle('Häufig beobachtet')}${c.quoteTable(popular, { cols: ['price', 'change', 'ytd', 'watch'], sortable: false })}</section></div>
      <p class="small muted" style="margin-top:20px">Datenschutz: Die Merkliste liegt im lokalen Speicher Ihres Browsers (localStorage) und wird nicht an uns übertragen. Beim Löschen der Browserdaten geht sie verloren. Details unter <a href="/cookie-einstellungen">Cookie-Einstellungen</a>.</p>
    </div>`;
    add('/merkliste', 'Merkliste', 'Ihre beobachteten Werte auf einer Seite, gespeichert nur in Ihrem Browser.', body, true);
  }
  return pages;
};
