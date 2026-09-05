'use strict';
// Seiten-Hülle: <head>, Kopfzeile (Marke, Suche, Navigation, Marktleiste), Mobilmenü, Fußzeile.
module.exports = function (ctx) {
  const { config, util, nav, instruments, snapshot } = ctx;
  const { html, raw, esc, num, pct, dateShort, time, dateFull } = util;

  const icons = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.9 6.2.8-4.5 4.4 1.1 6.3L12 17.5 6.4 20.4l1.1-6.3L3 9.7l6.2-.8z"/></svg>',
    rss: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="19" r="2"/><path d="M3 10a11 11 0 0 1 11 11h-3a8 8 0 0 0-8-8zm0-6a17 17 0 0 1 17 17h-3A14 14 0 0 0 3 7z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  };
  ctx.icons = icons;

  const q = (slug) => snapshot.quotes[slug];
  const dir = (v) => v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
  const asOf = new Date(config.quotesAsOf);
  const asOfLabel = `Stand ${dateShort(asOf)}, ${time(asOf)} Uhr`;

  function fmtPrice(inst, quote) {
    if (!quote || quote.price == null) return '–';
    const p = quote.price;
    const digits = inst.type === 'fx' ? 4 : inst.type === 'bond' ? 3 : p >= 1000 ? 0 : 2;
    return num(p, digits);
  }
  ctx.fmtPrice = fmtPrice;

  // Marktleiste (10 Werte)
  const stripSlugs = ['dax', 'mdax', 'euro-stoxx-50', 'sp-500', 'nasdaq-100', 'gold', 'brent', 'eur-usd', 'bitcoin', 'bund-10j'];
  function marketStrip() {
    return html`<div class="market-strip" aria-label="Marktüberblick"><div class="container">
      <div class="strip-scroll">${stripSlugs.map(s => {
        const inst = instruments.bySlug[s], qq = q(s); if (!inst || !qq) return '';
        const d = dir(qq.changePct);
        return html`<a class="strip-item" href="/kurs/${inst.slug}"><span class="strip-name">${inst.short || inst.name}</span><span class="strip-row"><strong>${fmtPrice(inst, qq)}${inst.type === 'bond' ? ' %' : ''}</strong><span class="${d}">${pct(qq.changePct)}</span></span></a>`;
      })}</div>
      <div class="strip-meta"><a href="/methodik" title="Kursdaten: Herkunft und Verzögerung">${asOfLabel} · Xetra-Kurse 15 Min. verzögert</a></div>
    </div></div>`;
  }

  function megaFeature(kind) {
    if (kind === 'quotes') {
      return html`<div class="mega-feature"><span class="kicker">Deutsche Indizes</span>${['dax', 'mdax', 'sdax', 'tecdax'].map(s => { const i = instruments.bySlug[s], qq = q(s); return html`<div class="mega-quote"><a href="/kurs/${s}">${i.name}</a><span><strong>${fmtPrice(i, qq)}</strong> <span class="${dir(qq.changePct)} delta">${pct(qq.changePct)}</span></span></div>`; })}<p style="margin-top:8px">${asOfLabel}</p></div>`;
    }
    if (kind === 'latest' && ctx.content) {
      const a = ctx.content.articles.filter(x => x.kind === 'news')[0];
      return html`<div class="mega-feature"><span class="kicker">Aktuell</span><strong><a href="/artikel/${a.slug}">${a.title}</a></strong><p>${a.deck}</p></div>`;
    }
    if (kind === 'analysis' && ctx.content) {
      const a = ctx.content.articles.filter(x => x.kind === 'analysis')[0];
      return html`<div class="mega-feature"><span class="kicker">Neueste Analyse</span><strong><a href="/artikel/${a.slug}">${a.title}</a></strong><p>${a.deck}</p></div>`;
    }
    if (kind === 'events' && ctx.content) {
      const next = ctx.content.upcomingEvents(3);
      return html`<div class="mega-feature"><span class="kicker">Nächste Termine</span>${next.map(e => html`<div class="mega-quote"><span><strong>${e.title}</strong><br><small class="muted">${util.dateWeekday(e.date)} · ${e.time} Uhr</small></span></div>`)}</div>`;
    }
    return '';
  }

  function mainNav(current) {
    return html`<nav class="mainnav" aria-label="Hauptnavigation"><div class="container"><ul class="mainnav-list">
      ${nav.nav.map(item => {
        const cur = item.key === current ? ' is-current' : '';
        if (!item.groups) return html`<li class="mainnav-item${raw(cur)}"><a class="mainnav-link" href="${item.href}">${item.label}</a></li>`;
        return html`<li class="mainnav-item${raw(cur)}" data-menu>
          <button class="mainnav-link" type="button" data-menu-btn aria-expanded="false" aria-haspopup="true">${item.label}${raw(icons.chevron)}</button>
          <div class="mega" style="--cols:${item.cols + (item.feature ? 1 : 0)}">
            ${item.groups.map(g => html`<div class="mega-col"><h3>${g.title}</h3><ul>${g.links.map(([l, h]) => html`<li><a href="${h}">${l}</a></li>`)}</ul></div>`)}
            ${item.feature ? megaFeature(item.feature) : ''}
          </div></li>`;
      })}
      <li class="mainnav-spacer" aria-hidden="true"></li>
      <li class="mainnav-item is-highlight"><a class="mainnav-link" href="/newsletter">Newsletter</a></li>
    </ul></div></nav>`;
  }

  function searchForm(cls) {
    return html`<form class="search ${cls || ''}" role="search" action="/suche" method="get" data-search>
      <label class="visually-hidden" for="${cls === 'is-head' ? 'q-head' : 'q-panel'}">Suche nach Aktien, Indizes, Nachrichten und Begriffen</label>
      <div class="search-field"><input id="${cls === 'is-head' ? 'q-head' : 'q-panel'}" type="search" name="q" placeholder="Aktie, Index, WKN/ISIN, Begriff …" autocomplete="off" spellcheck="false"><button type="submit" aria-label="Suchen">${raw(icons.search)}</button></div>
      <div class="search-results" data-search-results hidden></div>
    </form>`;
  }

  function mobilePanel() {
    return html`<div class="nav-panel" id="nav-panel" data-nav-panel>
      ${searchForm('is-panel')}
      ${nav.nav.map((item, i) => item.groups
        ? html`<div class="nav-group"><button class="nav-group-btn" type="button" data-acc aria-expanded="false" aria-controls="navg-${i}">${item.label}${raw(icons.chevron)}</button><div class="nav-group-body" id="navg-${i}" hidden>${item.groups.map(g => html`<h4>${g.title}</h4>${g.links.map(([l, h]) => html`<a href="${h}">${l}</a>`)}`)}</div></div>`
        : html`<div class="nav-group"><a class="nav-group-btn" href="${item.href}">${item.label}</a></div>`)}
      <div class="nav-panel-foot"><a class="btn btn-primary btn-block" href="/newsletter">Newsletter abonnieren</a><a class="btn btn-ghost btn-block" href="/merkliste">Merkliste öffnen</a></div>
    </div>`;
  }

  function header(current) {
    const holidays = ctx.content ? ctx.content.holidays.filter(h => h.exchanges.includes('Xetra')).map(h => h.date).join(',') : '';
    return html`<header class="site-header">
      <div class="container masthead">
        <button class="burger" type="button" data-nav-toggle aria-expanded="false" aria-controls="nav-panel">${raw(icons.burger)}<span class="burger-label">Menü</span></button>
        <a class="brand" href="/" aria-label="${config.brand} – Startseite">Börsen<em>blick</em></a>
        ${searchForm('is-head')}
        <div class="head-meta"><strong data-clock>${dateFull(ctx.now)}</strong><span class="market-status" data-market-status data-holidays="${holidays}">Xetra</span></div>
        <div class="head-actions"><a class="icon-btn" href="/merkliste" title="Merkliste" aria-label="Merkliste">${raw(icons.star)}<span class="count" data-watch-count hidden>0</span></a></div>
      </div>
      ${mainNav(current)}
      ${marketStrip()}
      <div class="progress" data-progress hidden></div>
    </header>${mobilePanel()}`;
  }

  function footer() {
    return html`<footer class="site-footer"><div class="container">
      <div class="footer-top">
        <div class="footer-brand"><a class="brand" href="/">Börsen<em>blick</em></a><p>${config.claim} Nachrichten, Kurse, Termine und Wissen für Anlegerinnen und Anleger im deutschsprachigen Raum.</p>
          <div class="social"><a href="/feed.xml" title="RSS-Feed" aria-label="RSS-Feed">${raw(icons.rss)}</a><a href="/newsletter" title="Newsletter" aria-label="Newsletter">${raw(icons.mail)}</a></div></div>
        ${nav.footer.map(col => html`<div class="footer-col"><h3>${col.title}</h3><ul>${col.links.map(([l, h]) => html`<li><a href="${h}">${l}</a></li>`)}</ul></div>`)}
      </div>
      <div class="footer-bottom">
        <div class="footer-legal">${nav.legal.map(([l, h]) => html`<a href="${h}">${l}</a>`)}</div>
        <p><strong>Risikohinweis:</strong> Alle Inhalte dienen ausschließlich der Information und stellen keine Anlageberatung, keine Kauf- oder Verkaufsempfehlung und keine Zusicherung künftiger Wertentwicklungen dar. Wertpapiere und Kryptowährungen unterliegen Kursschwankungen bis hin zum Totalverlust. Frühere Wertentwicklungen sind kein Indikator für künftige Ergebnisse.</p>
        <p><strong>Kursdaten:</strong> ${asOfLabel}. Xetra-Kurse mindestens 15 Minuten verzögert, US-Indizes 10–15 Minuten verzögert, Devisen und Kryptowährungen nahezu in Echtzeit. Keine Gewähr für Richtigkeit und Vollständigkeit. Details unter <a href="/methodik">Methodik & Datenquellen</a>.</p>
        <p>© ${ctx.now.getFullYear()} ${config.brand}. Alle Rechte vorbehalten.</p>
      </div>
    </div></footer>
    <div class="cookie-note" data-cookie-note hidden><p>Diese Website verwendet nur technisch notwendige Speicherung (Merkliste, zuletzt gelesene Artikel) lokal in Ihrem Browser – keine Tracking-Cookies, keine Werbe-IDs. <a href="/cookie-einstellungen">Mehr erfahren</a></p><button class="btn btn-dark btn-sm" type="button" data-cookie-ok>Verstanden</button></div>`;
  }

  function page({ title, description, path: p, body, section, noindex, ogType, jsonLd, extraHead, bodyClass }) {
    const fullTitle = p === '/' ? `${config.brand} – ${config.claim}` : `${title} – ${config.brand}`;
    const desc = description || config.description;
    const canonical = `${config.domain}${p === '/' ? '' : p}`;
    return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex, follow">' : ''}
<meta property="og:site_name" content="${esc(config.brand)}">
<meta property="og:type" content="${ogType || 'website'}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="de_DE">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0b1e3a">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${esc(config.brand)} – Nachrichten" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap">
<link rel="stylesheet" href="/assets/styles.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
${extraHead || ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#main">Zum Inhalt springen</a>
${header(section)}
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/app.js" defer></script>
</body>
</html>
`;
  }

  return { page, asOfLabel, icons, fmtPrice, stripSlugs };
};
