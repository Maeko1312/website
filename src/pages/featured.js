'use strict';
// „Im Fokus“: gesponserte Unternehmensporträts unter /fokus/<slug> (Daten: src/data/featured.js)
const charts = require('../render/charts');
module.exports = function (ctx) {
  const { c, layout, util, content, config, instruments } = ctx;
  const { html, raw, num, pct, dateLong, readTime } = util;
  const q = (s) => ctx.quote(s) || {};
  const pages = [];

  // Einfaches Balkendiagramm mit absoluten Werten (ohne Vorzeichen), passend zum Kursblatt-Stil
  const bars = (items, unit, digits = 0) => {
    const w = 600, h = 230, padT = 26, padB = 40, padL = 12, padR = 12;
    const max = Math.max(...items.map(i => i.value)) || 1;
    const iw = w - padL - padR, ih = h - padT - padB, bw = iw / items.length;
    const body = items.map((it, i) => {
      const hgt = it.value / max * ih, x = padL + i * bw + bw * 0.2, y = padT + ih - hgt, cx = padL + i * bw + bw / 2;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.6).toFixed(1)}" height="${Math.max(hgt, 1).toFixed(1)}" class="bar is-accent"/><text x="${cx.toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" class="bar-value">${num(it.value, digits)}${unit === '%' ? ' %' : ''}</text><text x="${cx.toFixed(1)}" y="${h - 14}" text-anchor="middle" class="bar-label">${it.label}</text>`;
    }).join('');
    return raw(`<svg class="barchart fokus-bars" viewBox="0 0 ${w} ${h}" role="img" aria-label="${items.map(i => `${i.label}: ${num(i.value, digits)}${unit === '%' ? ' %' : ' ' + unit}`).join(', ')}"><line x1="${padL}" x2="${w - padR}" y1="${padT + ih}" y2="${padT + ih}" class="chart-grid"/>${body}</svg>`);
  };
  const chartFigure = (series, id) => html`<figure class="fokus-chart" id="${id}"><figcaption><strong>${series.title}</strong>${series.unit !== '%' ? html` <span class="muted">in ${series.unit}</span>` : ''}</figcaption>${bars(series.items.map(([label, value]) => ({ label, value })), series.unit, series.unit === '%' ? 1 : 0)}<p class="small muted">Quelle: ${series.source}</p></figure>`;

  for (const f of content.featured.active) {
    const url = `/fokus/${f.slug}`;
    const inst = instruments.bySlug[f.instrument.slug] || f.instrument;
    const x = q(inst.slug), hist = ctx.hist(inst.slug);
    const price = x.price, chg = x.changePct;
    const mcapLive = price != null && inst.sharesOutstanding ? price * inst.sharesOutstanding : null;
    const fmtMio = (v) => v == null ? null : num(v / 1e6, 1) + ' Mio. ' + inst.currency;
    const arrMultiple = mcapLive && f.shareInfo.arr ? mcapLive / f.shareInfo.arr : null;
    const cashPerShare = f.shareInfo && inst.sharesOutstanding ? 3780000 / inst.sharesOutstanding : null;
    const rt = readTime(f.sections.map(s => s.html || '').join(''));
    const tocItems = f.sections.filter(s => s.id && s.h2).map(s => [s.id, s.h2]).concat([['kurs', 'Kursentwicklung'], ['faq', 'Häufige Fragen'], ['risiken', 'Risikofaktoren'], ['haftungsausschluss', 'Haftungsausschluss']]);
    const copy = (v) => html`<span class="copy-wrap"><code translate="no">${v}</code><button type="button" class="copy-btn" data-copy="${v}" aria-label="${v} kopieren" title="Kopieren">⧉</button></span>`;

    // ---------- Module ----------
    const modules = {
      highlights: () => html`<section class="fokus-highlights" id="highlights" aria-labelledby="h-highlights"><h2 id="h-highlights">Investment Highlights: ${f.short} auf einen Blick</h2><ol>${f.highlights.map(([h, t]) => html`<li><strong>${h}</strong><p>${t}</p></li>`)}</ol></section>`,
      capexChart: () => chartFigure(f.capexSeries, 'chart-capex'),
      marginChart: () => chartFigure(f.marginSeries, 'chart-marge'),
      useCases: () => html`<div class="fokus-rows">${f.useCases.map(u => html`<article class="fokus-row"><div class="fokus-row-head"><span class="kicker">${u.kicker}</span><h3>${u.h}</h3></div><p>${u.text}</p></article>`)}</div>`,
      patents: () => html`<div class="fokus-rows is-patents">${f.patents.map((p, i) => html`<article class="fokus-row"><div class="fokus-row-head"><span class="kicker">Patent ${i + 1} · erteilt ${p.granted}</span><h3>${p.h}</h3><code class="fokus-patent-no" translate="no">${p.no}</code></div><p>${p.text}</p></article>`)}</div>`,
      team: () => html`<div class="fokus-team">${f.team.map(m => html`<article class="fokus-person"><div class="fokus-portrait">${m.image ? html`<img src="${m.image}" alt="${m.name}" loading="lazy" width="160" height="160">` : html`<span class="avatar is-lg" aria-hidden="true">${m.name.split(' ').map(s => s[0]).join('')}</span>`}</div><div><h3>${m.name}</h3><span class="kicker">${m.role}</span><p>${m.text}</p></div></article>`)}</div>`,
      chart: () => html`<section class="fokus-kurs" id="kurs" aria-labelledby="h-kurs"><h2 id="h-kurs">Kursentwicklung</h2>${price != null ? html`<div class="fokus-quote-row"><strong class="fokus-quote-price">${num(price, 2)} <small>${inst.currency}</small></strong>${c.delta(chg, { pill: true })}<span class="small muted">${inst.exchange} · ${c.delayLabel(x)} · Stand ${layout.asOfLabel}</span></div>` : ''}${c.interactiveChart(inst, x, hist, { caption: `${inst.name}, ${inst.exchange}, in ${inst.currency}` }) || html`<p class="note is-plain">Für diese Aktie liegt noch keine Kurshistorie vor.</p>`}${c.instrumentCard(inst, x)}</section>`,
      valuation: () => html`<section class="fokus-valuation" aria-labelledby="h-val"><h2 id="h-val">Bewertung im Verhältnis</h2><p class="small muted">Rechnerische Größen aus dem aktuellen Kurs (${layout.asOfLabel}) und den zuletzt berichteten Zahlen. Keine Bewertungsempfehlung.</p><div class="number-tiles">${[['Marktkapitalisierung', mcapLive != null ? fmtMio(mcapLive) : f.shareInfo.mcapRef, `${f.shareInfo.sharesLabel} Aktien × Kurs`], ['Börsenwert / ARR', arrMultiple != null ? num(arrMultiple, 1) + ' ×' : '–', `wiederkehrender Umsatz ${f.shareInfo.arrLabel}`], ['Liquide Mittel je Aktie', cashPerShare != null ? num(cashPerShare, 2) + ' ' + inst.currency : '–', '3,78 Mio. CAD zum 30. Juni 2026'], ['Größter Aktionär', f.shareInfo.majorHolder[0].replace(' Technologies', ''), f.shareInfo.majorHolder[1]]].map(([l, v, s]) => html`<div class="number-tile"><span>${l}</span><strong>${v}</strong><small>${s}</small></div>`)}</div></section>`,
      timeline: () => html`<section class="fokus-timeline-wrap" aria-labelledby="h-timeline"><h2 id="h-timeline">Meilensteine</h2><ol class="fokus-timeline">${f.timeline.map(([d, t]) => html`<li><span class="fokus-timeline-date" translate="no">${d}</span><span>${t}</span></li>`)}</ol></section>`,
      faq: () => html`<section class="faq fokus-faq" id="faq" aria-labelledby="h-faq"><h2 id="h-faq">Häufige Fragen</h2>${f.faq.map(([qq, a]) => html`<details><summary>${qq}</summary><div class="faq-body"><p>${a}</p></div></details>`)}</section>`,
      risks: () => html`<section class="fokus-risks" id="risiken" aria-labelledby="h-risiken"><h2 id="h-risiken">Risikofaktoren</h2><ol class="fokus-risk-list">${f.risks.map(r => html`<li>${r}</li>`)}</ol></section>
        <section class="fokus-sources" aria-labelledby="h-quellen"><h2 id="h-quellen">Quellen</h2><ol class="sources">${f.sources.map(([l, u]) => html`<li><a href="${u}" rel="noopener" target="_blank">${l}</a></li>`)}</ol></section>
        <section class="fokus-legal" id="haftungsausschluss" aria-labelledby="h-haftung"><h2 id="h-haftung">Haftungsausschluss</h2><p class="fokus-legal-flag"><span class="badge">Bezahlte Werbung</span></p>${f.disclaimer.map(p => html`<p>${p}</p>`)}<h3>Rechtliche Angaben zur Veröffentlichung</h3><dl class="kv">${f.legal.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl></section>`,
    };

    const sectionHtml = (s) => {
      if (s.module) { const m = modules[s.module]; if (!m) throw new Error(`Unbekanntes Modul ${s.module} in ${f.slug}`); return m(); }
      return html`${s.h2 ? html`<h2 id="${s.id || util.slugify(s.h2)}">${s.h2}</h2>` : ''}${s.h3 ? html`<h3>${s.h3}</h3>` : ''}${s.html ? raw(s.html) : ''}${s.figure ? html`<figure class="fokus-figure"><img src="${s.figure.src}" alt="${s.figure.alt}" loading="lazy" width="1200" height="750"><figcaption>${s.figure.caption}</figcaption></figure>` : ''}`;
    };

    const body = html`<div class="fokus-bar"><div class="container"><span class="badge is-accent">Anzeige</span><span class="fokus-bar-text">Verbreitet im Auftrag von <strong>${f.sponsor}</strong></span><span class="fokus-bar-meta"><time datetime="${f.firstPublished}" translate="no">Erstveröffentlichung ${dateLong(new Date(f.firstPublished + 'T12:00:00'))}</time> · <time datetime="${f.updated}" translate="no">Stand ${dateLong(new Date(f.updated + 'T12:00:00'))}</time></span><a href="#haftungsausschluss">Hinweise und Interessenkonflikt</a></div></div>
<div class="container page fokus">
  ${c.breadcrumb([['Im Fokus', url], [f.short, url]])}
  <header class="fokus-head">
    <div class="fokus-head-main">
      <div class="fokus-flags"><span class="badge is-accent">Im Fokus</span><span class="badge">Anzeige</span><span class="tag">${f.sector}</span><span class="tag">${f.country}</span></div>
      <h1>${f.title}</h1>
      <p class="deck">${f.lead}</p>
      <div class="fokus-meta"><span>Lesezeit ${rt} Min.</span><span>${f.sources.length} Quellen</span><span>Kurse ${c.delayLabel(x)}</span></div>
    </div>
  </header>
  <figure class="fokus-hero"><img src="${f.image}" alt="${f.imageAlt}" loading="eager" fetchpriority="high" decoding="async" width="1600" height="900"><figcaption>${f.imageAlt}. Bild: ${f.sponsor}</figcaption></figure>
  <div class="layout">
    <article class="article fokus-article" data-article="${f.title}" data-article-cat="Im Fokus">
      <section class="fokus-kpis" aria-label="Kennzahlen auf einen Blick"><div class="number-tiles">${f.kpis.map(([l, v, s, d]) => html`<div class="number-tile"><span>${l}</span><strong class="${d || ''}">${v}</strong><small>${s}</small></div>`)}</div></section>
      <div class="prose fokus-prose">${f.sections.map(sectionHtml)}</div>
      <footer class="article-foot" id="updates">
        ${c.newsletterBox({ dark: true })}
        ${c.disclaimer()}
      </footer>
    </article>
    <aside>
    <aside class="fokus-ticker card" aria-labelledby="h-ticker">
      <span class="kicker">Die Aktie</span>
      <h2 id="h-ticker">${inst.name}</h2>
      <div class="fokus-price">${price != null ? html`<strong>${num(price, 2)} <small>${inst.currency}</small></strong>${c.delta(chg, { pill: true })}` : html`<span class="muted">Kurs folgt</span>`}</div>
      <p class="fokus-ticker-meta"><span>${inst.exchange} · ${c.delayLabel(x)}</span><span>${layout.asOfLabel}</span></p>
      <div class="fokus-actions"><a class="fokus-action is-primary" href="${f.presentation}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg><span>Präsentation<small>PDF für Investoren</small></span></a><a class="fokus-action" href="${f.website}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg><span>Website<small>${new URL(f.website).host}</small></span></a><a class="fokus-action" href="#kurs"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M6 15l4-5 3 3 5-7"/></svg><span>Kurs und Chart<small>Verlauf, Kennzahlen</small></span></a><a class="fokus-action" href="#updates"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><span>E-Mail-Updates<small>zu ${f.short}</small></span></a></div>
      <dl class="kv is-compact fokus-kv">
        ${inst.listings.map(([ex, sym]) => html`<div><dt>${ex.replace(' Exchange', '').replace(' Venture Market', '')}</dt><dd>${copy(sym)}</dd></div>`)}
        <div><dt>ISIN</dt><dd>${copy(inst.isin)}</dd></div>
        <div><dt>WKN</dt><dd>${copy(inst.wkn)}</dd></div>
        <div><dt>Marktkapitalisierung</dt><dd>${mcapLive != null ? fmtMio(mcapLive) : f.shareInfo.mcapRef}</dd></div>
        ${x.low52w != null && x.high52w != null ? html`<div class="is-wide"><dt>52-Wochen-Spanne</dt><dd>${charts.rangeBar(x.low52w, x.high52w, price)}<span class="range-labels"><span>${num(x.low52w, 2)}</span><span>${num(x.high52w, 2)}</span></span></dd></div>` : ''}
      </dl>
    </aside>
      <details class="card fokus-toc"><summary><span class="kicker">Inhalt</span><span class="small muted">${tocItems.length} Abschnitte</span></summary><ol>${tocItems.map(([id, t]) => html`<li><a href="#${id}">${t}</a></li>`)}</ol></details>
    </aside>
  </div>
</div>`;

    content.searchablePages.push({ title: `${f.company} – Im Fokus`, path: url, kicker: 'Im Fokus', description: f.lead.slice(0, 160) });
    const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: f.title, description: f.lead, datePublished: f.firstPublished, dateModified: f.updated, isAccessibleForFree: true, sponsor: { '@type': 'Organization', name: f.sponsor }, publisher: { '@type': 'Organization', name: config.brand }, about: { '@type': 'Corporation', name: f.company, tickerSymbol: inst.short, url: f.website } };
    pages.push({ path: url, html: layout.page({ title: `${f.company}: ${f.title}`, description: f.lead, path: url, body, section: null, ogType: 'article', jsonLd, reading: true, bodyClass: 'is-fokus' }) });
  }
  return pages;
};
