'use strict';
// Cache-Busting: Assets werden auf Vercel ein Jahr lang unveränderlich gecacht, daher Inhalts-Hash als Versionsparameter.
const __fs = require('fs'), __path = require('path'), __crypto = require('crypto');
const assetVersion = (f) => __crypto.createHash('md5').update(__fs.readFileSync(__path.join(__dirname, '..', 'assets', f))).digest('hex').slice(0, 8);
const CSS_V = assetVersion('styles.css'), JS_V = assetVersion('app.js');
// Seiten-Hülle: <head>, Kopfzeile (Marke, Suche, Navigation, Marktleiste), Mobilmenü, Fußzeile,
// Newsletter-Leiste (Slide-in) und Newsletter-Dialog (Exit-Intent).
module.exports = function (ctx) {
  const { config, util, nav, instruments, snapshot } = ctx;
  const { html, raw, esc, num, pct, dateShort, time, dateFull } = util;

  const icons = {
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
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
  // Marktleiste: die meistbeachteten Märkte (Index, Gold, Euro/Dollar, Silber, Öl, Bitcoin …); hervorgehobene Instrumente (featured) stehen davor.
  const stripBase = ['dax', 'gold', 'eur-usd', 'silber', 'brent', 'bitcoin', 'sp-500', 'nasdaq-100', 'mdax', 'euro-stoxx-50', 'bund-10j', 'platin'];
  const featuredSlugs = instruments.all.filter(i => i.featured).map(i => i.slug);
  const stripSlugs = [...featuredSlugs, ...stripBase.filter(s => !featuredSlugs.includes(s))];
  function marketStrip() {
    return html`<div class="market-strip" aria-label="Marktüberblick"><div class="container">
      <div class="strip-scroll">${stripSlugs.map(s => {
        const inst = instruments.bySlug[s], qq = q(s); if (!inst || !qq) return '';
        const d = dir(qq.changePct);
        const w = util.wkn(qq.isin || inst.isin); return html`<a class="strip-item ${inst.featured ? 'is-featured' : ''}" href="/kurs/${inst.slug}"${inst.featured ? raw(' title="Im Fokus der Redaktion"') : ''}><span class="strip-name notranslate" translate="no">${inst.short || inst.name}${inst.featured ? html`<span class="strip-flag">Fokus</span>` : ''}</span>${w ? html`<span class="wkn">${w}</span>` : ''}<span class="strip-row"><strong>${fmtPrice(inst, qq)}${inst.type === 'bond' ? ' %' : ''}</strong><span class="${d}">${pct(qq.changePct)}</span></span></a>`;
      })}</div>
      <div class="strip-meta"><a href="/methodik" title="Kursdaten: Herkunft und Verzögerung">${asOfLabel} · Xetra 15 Min. verzögert</a></div>
    </div></div>`;
  }

  function megaFeature(kind) {
    const c = ctx.content;
    if (kind === 'quotes') {
      return html`<div class="mega-feature"><span class="kicker">Deutsche Indizes</span>${['dax', 'mdax', 'sdax', 'tecdax'].map(s => { const i = instruments.bySlug[s], qq = q(s); return html`<a class="mega-quote" href="/kurs/${s}"><span class="name">${i.name}</span><span class="vals"><strong>${fmtPrice(i, qq)}</strong><span class="delta ${dir(qq.changePct)}">${pct(qq.changePct)}</span></span></a>`; })}<p style="margin-top:10px">${asOfLabel}</p></div>`;
    }
    if (kind === 'latest' && c) {
      const a = c.articles.filter(x => x.kind === 'news')[0];
      return html`<div class="mega-feature"><span class="kicker">Aktuell</span><strong><a href="/artikel/${a.slug}">${a.title}</a></strong><p>${a.deck}</p></div>`;
    }
    if (kind === 'analysis' && c) {
      const a = c.articles.filter(x => x.kind === 'analysis')[0];
      return html`<div class="mega-feature"><span class="kicker">Neueste Analyse</span><strong><a href="/artikel/${a.slug}">${a.title}</a></strong><p>${a.deck}</p></div>`;
    }
    if (kind === 'events' && c) {
      const next = c.upcomingEvents(3);
      return html`<div class="mega-feature"><span class="kicker">Nächste Termine</span>${next.map(e => html`<div class="mega-quote"><span><strong>${e.title}</strong><small class="muted">${util.dateWeekday(new Date(e.date + 'T00:00:00'))} · ${e.time} Uhr</small></span></div>`)}</div>`;
    }
    if (kind === 'blog' && c) {
      const p = c.blog.posts[0];
      return html`<div class="mega-feature"><span class="kicker">Neu im Blog</span><strong><a href="/blog/${p.slug}">${p.title}</a></strong><p>${p.lead}</p></div>`;
    }
    return '';
  }

  function mainNav(current) {
    return html`<nav class="mainnav" aria-label="Hauptnavigation"><div class="container"><ul class="mainnav-list">
      ${nav.nav.map(item => {
        const cur = item.key === current ? ' is-current' : '';
        if (!item.groups) return html`<li class="mainnav-item${raw(cur)}"><a class="mainnav-link" href="${item.href}">${item.label}</a></li>`;
        return html`<li class="mainnav-item${raw(cur)}" data-menu>
          <button class="mainnav-link" type="button" data-menu-btn data-href="${item.href}" aria-expanded="false" aria-haspopup="true">${item.label}${raw(icons.chevron)}</button>
          <div class="mega ${item.feature ? 'has-feature' : ''}" style="--cols:${item.cols}">
            ${item.feature ? megaFeature(item.feature) : ''}
            ${item.groups.map(g => html`<div class="mega-col"><h3>${g.title}</h3><ul>${g.links.map(([l, h]) => html`<li><a href="${h}">${l}</a></li>`)}</ul></div>`)}
          </div></li>`;
      })}
      <li class="mainnav-spacer" aria-hidden="true"></li>
      <li class="mainnav-item is-highlight"><a class="mainnav-link" href="/newsletter">Newsletter</a></li>
    </ul></div></nav>`;
  }

  function searchForm(cls) {
    const id = cls === 'is-head' ? 'q-head' : 'q-panel';
    return html`<form class="search ${cls || ''}" role="search" action="/suche" method="get" data-search>
      <label class="visually-hidden" for="${id}">Suche nach Aktien, Indizes, Nachrichten und Begriffen</label>
      <div class="search-field"><input id="${id}" type="search" name="q" placeholder="Aktie, Index, ISIN, Begriff …" autocomplete="off" spellcheck="false"><button type="submit" aria-label="Suchen">${raw(icons.search)}</button></div>
      <div class="search-results" data-search-results hidden></div>
    </form>`;
  }

  // Sprachen: Deutsch ist das Original; andere Sprachen öffnen die Seite als automatische Übersetzung (Google Translate, translate.goog). Ziel-URLs setzt app.js (lang()).
  // Sprachen: Deutsch ist das Original; andere Sprachen öffnen die Seite als automatische Übersetzung (Google Translate, translate.goog). Ziel-URLs setzt app.js (lang()).
  // [Code, Sprache, Kürzel, Land]; Flaggen als kleine SVGs (Emoji-Flaggen werden unter Windows nicht dargestellt)
  const LANGS = [['de', 'Deutsch', 'DE', 'Deutschland'], ['en', 'English', 'EN', 'Großbritannien'], ['fr', 'Français', 'FR', 'Frankreich'], ['es', 'Español', 'ES', 'Spanien'], ['it', 'Italiano', 'IT', 'Italien'], ['tr', 'Türkçe', 'TR', 'Türkei'], ['pl', 'Polski', 'PL', 'Polen']];
  const FLAGS = {
    de: '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="3" height="2" fill="#000"/><rect y=".667" width="3" height=".667" fill="#D00"/><rect y="1.333" width="3" height=".667" fill="#FFCE00"/></svg>',
    en: '<svg viewBox="0 0 60 30" aria-hidden="true"><rect width="60" height="30" fill="#012169"/><path d="M0 0 60 30M60 0 0 30" stroke="#fff" stroke-width="6"/><path d="M0 0 60 30M60 0 0 30" stroke="#C8102E" stroke-width="2.5"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></svg>',
    fr: '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>',
    es: '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="3" height="2" fill="#AA151B"/><rect y=".5" width="3" height="1" fill="#F1BF00"/></svg>',
    it: '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#009246"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CE2B37"/></svg>',
    tr: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#E30A17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.3" cy="10" r="4" fill="#E30A17"/><polygon points="17.6,7.9 18.5,9.5 20.3,9.8 19,11.1 19.3,12.9 17.6,12.1 16,12.9 16.3,11.1 15,9.8 16.8,9.5" fill="#fff"/></svg>',
    pl: '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="3" height="1" fill="#fff"/><rect y="1" width="3" height="1" fill="#DC143C"/></svg>',
  };
  const flag = (code) => html`<span class="lang-flag">${raw(FLAGS[code] || '')}</span>`;
  const langLink = ([code, name, short, country]) => html`<a role="menuitem" href="/" data-lang-code="${code}" hreflang="${code}"${code === 'de' ? raw(' aria-current="true"') : ''}>${flag(code)}<span class="lang-name">${country}</span><span class="lang-short">${name}</span></a>`;
  function langMenu() {
    return html`<div class="lang" data-lang><button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Sprache wählen" translate="no"><span class="lang-current" data-lang-current>${flag('de')}</span><span class="lang-code">DE</span>${raw(icons.chevron)}</button><div class="lang-menu" role="menu" hidden translate="no"><ul>${LANGS.map(l => html`<li>${langLink(l)}</li>`)}</ul><p class="lang-note">Original: Deutsch. Andere Sprachen als automatische Übersetzung (Google Translate).</p></div></div>`;
  }
  function mobilePanel() {
    return html`<div class="nav-panel" id="nav-panel" data-nav-panel>
      ${searchForm('is-panel')}
      ${nav.nav.map((item, i) => item.groups
        ? html`<div class="nav-group"><button class="nav-group-btn" type="button" data-acc aria-expanded="false" aria-controls="navg-${i}">${item.label}${raw(icons.chevron)}</button><div class="nav-group-body" id="navg-${i}" hidden>${item.groups.map(g => html`<h4>${g.title}</h4>${g.links.map(([l, h]) => html`<a href="${h}">${l}</a>`)}`)}</div></div>`
        : html`<div class="nav-group"><a class="nav-group-btn" href="${item.href}">${item.label}</a></div>`)}
      <div class="nav-lang" translate="no"><span class="kicker">Sprache</span><div class="chips">${LANGS.map(([code, name, short, country]) => html`<a class="chip ${code === 'de' ? 'is-active' : ''}" href="/" data-lang-code="${code}" hreflang="${code}">${flag(code)}${country}</a>`)}</div><p class="small muted">Deutsch ist das Original, andere Sprachen sind automatische Übersetzungen.</p></div>
      <div class="nav-panel-foot"><a class="btn btn-teal btn-block" href="/newsletter">Newsletter abonnieren</a><a class="btn btn-ghost btn-block" href="/merkliste">Merkliste öffnen</a></div>
    </div>`;
  }

  function header(current) {
    const holidays = ctx.content ? ctx.content.holidays.filter(h => h.exchanges.includes('Xetra')).map(h => h.date).join(',') : '';
    return html`<header class="site-header">
      <div class="container masthead">
        <button class="burger" type="button" data-nav-toggle aria-expanded="false" aria-controls="nav-panel">${raw(icons.burger)}<span class="burger-label">Menü</span></button>
        <a class="brand notranslate" translate="no" href="/" aria-label="${config.brand} – Startseite">Börsen<em>blick</em></a>
        ${searchForm('is-head')}
        <div class="head-meta"><strong data-clock>${util.DAYS_SHORT[ctx.now.getDay()]} ${dateShort(ctx.now)} · ${time(ctx.now)} Uhr</strong><span class="market-status" data-market-status data-holidays="${holidays}">Xetra</span></div>
        <div class="head-actions"><a class="btn btn-teal head-nl" href="/newsletter">${raw(icons.mail)}Newsletter</a><a class="icon-btn" href="/merkliste" title="Merkliste" aria-label="Merkliste">${raw(icons.star)}<span class="count" data-watch-count hidden>0</span></a>${langMenu()}</div>
      </div>
      ${mainNav(current)}
      ${marketStrip()}
      <div class="progress" data-progress hidden></div>
    </header>${mobilePanel()}`;
  }

  // Formular-Attribute für den Versanddienst
  const formAttrs = () => raw(config.newsletterAction ? `action="${esc(config.newsletterAction)}" method="post"` : 'action="#" method="post"');

  function nlBar() {
    return html`<div class="nl-bar" data-nl-bar hidden aria-live="polite"><div class="container">
      <div class="txt"><strong>Gefällt Ihnen der Beitrag? Jeden Morgen so einen – kostenlos.</strong>Börsenblick am Morgen: Märkte, Termine, die wichtigste Meldung. 7:30 Uhr, zwei Minuten.</div>
      <form class="newsletter-mini" data-newsletter ${formAttrs()} novalidate><label class="visually-hidden" for="nl-bar-email">E-Mail-Adresse</label><div class="control"><input id="nl-bar-email" type="email" name="${config.newsletterEmailField}" placeholder="ihre@e-mail.de" required autocomplete="email"></div><button class="btn btn-primary" type="submit">Anmelden</button></form>
      <button class="close" type="button" data-nl-bar-close aria-label="Leiste schließen">×</button>
    </div></div>`;
  }
  function nlModal() {
    return html`<div class="nl-modal" data-nl-modal role="dialog" aria-modal="true" aria-labelledby="nl-modal-title" hidden><div class="dialog">
      <button class="close" type="button" data-nl-modal-close aria-label="Schließen">×</button>
      <span class="kicker">Bevor Sie gehen</span>
      <h2 id="nl-modal-title">Die Börse in zwei Minuten – jeden Morgen um 7:30 Uhr</h2>
      <p>Was über Nacht passiert ist, drei Termine des Tages und die eine Meldung, die zählt. Kostenlos, werbefrei, jederzeit abbestellbar.</p>
      <form class="newsletter" data-newsletter ${formAttrs()} novalidate>
        <label class="visually-hidden" for="nl-modal-email">E-Mail-Adresse</label>
        <div class="control"><input id="nl-modal-email" type="email" name="${config.newsletterEmailField}" placeholder="ihre@e-mail.de" required autocomplete="email"></div>
        <label class="check"><input type="checkbox" name="consent" required><span>Ich möchte den Newsletter erhalten und akzeptiere die <a href="/datenschutz">Datenschutzhinweise</a>.</span></label>
        <button class="btn btn-teal btn-lg" type="submit">Kostenlos anmelden</button>
        <div class="newsletter-note" data-newsletter-note hidden tabindex="-1">Der Versanddienst wird gerade angebunden – die Anmeldung ist in Kürze möglich. Bis dahin: <a href="/feed.xml">RSS-Feed abonnieren</a>.</div>
      </form>
      <button class="later" type="button" data-nl-modal-close>Vielleicht später</button>
    </div></div>`;
  }

  function footer() {
    return html`<footer class="site-footer"><div class="container">
      <div class="footer-top">
        <div class="footer-brand"><a class="brand notranslate" translate="no" href="/">Börsen<em>blick</em></a><p>${config.claim} Nachrichten, Kurse, Termine und Wissen für Anlegerinnen und Anleger im deutschsprachigen Raum.</p>
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
    ${nlBar()}${nlModal()}
    <div class="cookie-note" data-cookie-note hidden><p>Diese Website speichert nur technisch Notwendiges lokal in Ihrem Browser (Merkliste, zuletzt gelesene Beiträge) – keine Tracking-Cookies, keine Werbe-IDs. <a href="/cookie-einstellungen">Mehr erfahren</a></p><button class="btn btn-dark btn-sm" type="button" data-cookie-ok>Verstanden</button></div>`;
  }

  function page({ title, description, path: p, body, section, noindex, ogType, jsonLd, extraHead, bodyClass, reading }) {
    const fullTitle = p === '/' ? `${config.brand} – ${config.claim}` : `${title} – ${config.brand}`;
    const desc = description || config.description;
    const canonical = `${config.domain}${p === '/' ? '' : p}`;
    return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="content-language" content="de">
<script>(function(h){if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(!("IntersectionObserver" in window))return;h.className+=" reveal-on";setTimeout(function(){if(!window.BB_MOTION)h.className=h.className.replace(" reveal-on","")},2500)})(document.documentElement)</script>
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
<meta name="theme-color" content="#1a1727">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${esc(config.brand)} – Nachrichten & Blog" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/assets/styles.css?v=${CSS_V}">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
${extraHead || ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}${reading ? ' data-reading' : ''}>
<div class="bb-loader" aria-hidden="true"></div>
<a class="skip" href="#main">Zum Inhalt springen</a>
${header(section)}
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/app.js?v=${JS_V}" defer></script>
</body>
</html>
`;
  }

  return { page, asOfLabel, icons, fmtPrice, stripSlugs, formAttrs };
};
