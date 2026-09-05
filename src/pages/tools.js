'use strict';
module.exports = function (ctx) {
  const { c, layout, util, instruments, content } = ctx;
  const { html, raw } = util;
  const pages = [];
  const add = (path, title, description, body, noindex) => { content.searchablePages.push({ title, path, kicker: 'Werkzeuge', description }); pages.push({ path, html: layout.page({ title, description, path, body, section: 'werkzeuge', noindex }) }); };
  const tools = content.tools;

  // Hub
  {
    const body = html`<div class="container page">
      ${c.breadcrumb([['Werkzeuge', '/werkzeuge']])}
      ${c.pageHead({ kicker: 'Werkzeuge', title: 'Rechner & Werkzeuge', lead: 'Sieben Rechner für die wichtigsten Anlegerfragen – Zinseszins, Sparplan, Rendite, Dividende, Währung, Positionsgröße, Inflation. Alle Berechnungen laufen in Ihrem Browser, es werden keine Daten übertragen.' })}
      <div class="tool-grid">${tools.map(t => html`<a class="tool-card" href="/werkzeuge/${t.slug}"><span class="icon">${raw(t.icon)}</span><h3>${t.title}</h3><p>${t.short}</p></a>`)}<a class="tool-card" href="/merkliste"><span class="icon">${raw(layout.icons.star)}</span><h3>Merkliste</h3><p>Ihre beobachteten Aktien, Indizes und Rohstoffe auf einer Seite – gespeichert nur in Ihrem Browser.</p></a></div>
      <section style="margin-top:32px">${c.sectionTitle('Direkt rechnen')}${c.calcTabs(tools, { id: 'tools-hub' })}</section>
      <div class="grid-2" style="margin-top:32px"><section class="card">${c.sectionTitle('Passende Ratgeber')}<ul class="side-list">${content.guides.slice(0, 5).map(g => html`<li><a href="/wissen/${g.slug}"><span class="kicker">${g.kicker}</span><span>${g.title}</span></a></li>`)}</ul></section><section class="card">${c.sectionTitle('Hinweis')}<p class="small">Die Rechner arbeiten mit vereinfachten Annahmen (konstante Rendite, monatliche Verzinsung, keine Steuern, sofern nicht angegeben). Sie ersetzen keine Finanz- oder Steuerberatung. Zahlen mit Komma oder Punkt als Dezimaltrennzeichen werden akzeptiert.</p></section></div>
    </div>`;
    add('/werkzeuge', 'Rechner & Werkzeuge', 'Zinseszins-, Sparplan-, Rendite-, Dividenden-, Währungs-, Positionsgrößen- und Inflationsrechner.', body);
  }
  for (const t of tools) {
    const body = html`<div class="container page">
      ${c.breadcrumb([['Werkzeuge', '/werkzeuge'], [t.title, `/werkzeuge/${t.slug}`]])}
      ${c.pageHead({ kicker: 'Rechner', title: t.title, lead: t.lead })}
      ${c.calcForm(t, { id: 'page' })}
      <div class="layout no-sticky" style="margin-top:28px"><div class="prose card">${raw(c.wrapTables(t.text))}</div><aside>${c.sideCard('Weitere Rechner', html`<ul class="side-links">${tools.filter(x => x !== t).map(x => html`<li><a href="/werkzeuge/${x.slug}">${raw(x.icon)}${x.title}</a></li>`)}</ul>`)}${c.newsletterBox({ compact: true })}</aside></div>
    </div>`;
    add(`/werkzeuge/${t.slug}`, t.title, t.lead, body);
  }

  // Merkliste
  {
    const popular = ['dax', 'sap', 'rheinmetall', 'siemens-energy', 'gold', 'bitcoin', 'eur-usd', 'allianz'].map(s => instruments.bySlug[s]);
    const body = html`<div class="container page" data-watchlist-page>
      ${c.breadcrumb([['Werkzeuge', '/werkzeuge'], ['Merkliste', '/merkliste']])}
      ${c.pageHead({ kicker: 'Werkzeuge', title: 'Meine Merkliste', lead: 'Aktien, Indizes, Rohstoffe und Währungen, die Sie beobachten möchten – mit dem Stern-Symbol auf jeder Kursseite hinzufügen. Die Liste wird ausschließlich lokal in Ihrem Browser gespeichert.' })}
      <div class="card" data-watchlist-table hidden><div class="section-title"><h2>Beobachtete Werte</h2><button class="btn btn-ghost btn-sm" type="button" data-watchlist-clear>Liste leeren</button></div><div class="table-wrap"><table class="quote-table"><thead><tr><th>Name</th><th class="num">Kurs</th><th class="num">±%</th><th class="num">YTD</th><th></th></tr></thead><tbody data-watchlist-rows></tbody></table></div><p class="small muted" style="margin-top:8px">${layout.asOfLabel}.</p></div>
      <div data-watchlist-empty><div class="empty" style="margin-bottom:24px"><p><strong>Ihre Merkliste ist noch leer.</strong></p><p>Klicken Sie auf einer Kursseite oder in der Tabelle unten auf das Stern-Symbol, um Werte hinzuzufügen.</p></div><section class="card">${c.sectionTitle('Häufig beobachtet')}${c.quoteTable(popular, { cols: ['price', 'change', 'ytd', 'watch'], sortable: false })}</section></div>
      <p class="small muted" style="margin-top:20px">Datenschutz: Die Merkliste liegt im lokalen Speicher Ihres Browsers (localStorage) und wird nicht an uns übertragen. Beim Löschen der Browserdaten geht sie verloren. Details unter <a href="/cookie-einstellungen">Cookie-Einstellungen</a>.</p>
    </div>`;
    add('/merkliste', 'Merkliste', 'Ihre beobachteten Werte auf einer Seite, gespeichert nur in Ihrem Browser.', body, true);
  }
  return pages;
};
