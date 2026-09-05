'use strict';
module.exports = function (ctx) {
  const { c, layout, util, instruments, content, now } = ctx;
  const { html, raw, num, pct, isoDate, addDays, startOfWeek, dateShort, dateLong, dateWeekday, DAYS, MONTHS, MONTHS_SHORT, pad } = util;
  const pages = [];
  const sub = [['Wirtschaftskalender', '/termine/wirtschaftskalender'], ['Unternehmenstermine', '/termine/unternehmen'], ['Dividenden', '/termine/dividenden'], ['Hauptversammlungen', '/termine/hauptversammlungen'], ['Börsenfeiertage', '/termine/boersenfeiertage'], ['Börsengänge', '/termine/ipos']];
  const crumbs = (t, p) => [['Termine', '/termine/wirtschaftskalender'], [t, p]];
  const add = (path, title, description, body, noindex) => { content.searchablePages.push({ title, path, kicker: 'Termine', description }); pages.push({ path, html: layout.page({ title, description, path, body, section: 'termine', noindex }) }); };
  const today = isoDate(now);
  const D = (iso) => new Date(iso + 'T00:00:00');
  const impact = (n) => html`<span class="impact is-${n}" title="Relevanz ${n} von 3: ${n === 3 ? 'hoch' : n === 2 ? 'mittel' : 'niedrig'}" aria-label="Relevanz ${n} von 3"><i></i><i></i><i></i></span>`;
  const flag = (cc) => html`<span class="flag" title="${content.countries[cc]}">${cc}</span>`;

  // ---------- Wirtschaftskalender ----------
  {
    const weeks = [];
    const start = startOfWeek(addDays(now, -7));
    for (let w = 0; w < 8; w++) {
      const monday = addDays(start, w * 7);
      const days = [0, 1, 2, 3, 4].map(i => addDays(monday, i));
      const evs = content.events.filter(e => e.date >= isoDate(monday) && e.date <= isoDate(addDays(monday, 6)));
      // Am Wochenende gilt die kommende Woche als "aktuell"
      const anchor = now.getDay() === 0 || now.getDay() === 6 ? isoDate(addDays(startOfWeek(now), 7)) : today;
      weeks.push({ monday, days, evs, current: isoDate(monday) <= anchor && anchor <= isoDate(addDays(monday, 6)) });
    }
    const countries = ['DE', 'EU', 'US', 'UK', 'JP', 'CN', 'CH'];
    const body = html`<div class="container page">
      ${c.breadcrumb(crumbs('Wirtschaftskalender', '/termine/wirtschaftskalender'))}
      ${c.pageHead({ kicker: 'Termine', title: 'Wirtschaftskalender', lead: 'Alle marktrelevanten Konjunkturdaten und Zentralbanktermine der Woche – nach Tag und Uhrzeit (MEZ/MESZ), mit Land, Zeitraum und Relevanz. Filtern Sie nach Wichtigkeit und Region.' })}
      ${c.subnav(sub, '/termine/wirtschaftskalender')}
      <div class="filter-bar" data-chipfilter="cal-weeks" data-chipfilter-attr="data-cat" data-multi>
        <span class="label">Relevanz</span><div class="group"><button class="chip is-active" type="button" data-chip="all" aria-pressed="true">Alle</button><button class="chip" type="button" data-chip="imp3" aria-pressed="false">${impact(3)} Hoch</button><button class="chip" type="button" data-chip="imp2" aria-pressed="false">${impact(2)} Mittel</button><button class="chip" type="button" data-chip="imp1" aria-pressed="false">${impact(1)} Niedrig</button></div>
        <span class="label">Region</span><div class="group">${countries.map(cc => html`<button class="chip" type="button" data-chip="${cc}" aria-pressed="false">${flag(cc)} ${content.countries[cc]}</button>`)}</div>
      </div>
      <div class="layout no-sticky"><div>
        <div data-weeks id="cal-weeks">
          <div class="week-nav"><button class="btn btn-ghost btn-sm" type="button" data-week-prev>‹ Vorwoche</button><strong data-week-label></strong><button class="btn btn-ghost btn-sm" type="button" data-week-next>Nächste Woche ›</button></div>
          ${weeks.map(w => html`<div data-week data-week-label="KW ${weekNo(w.monday)} · ${dateShort(w.monday)} – ${dateShort(addDays(w.monday, 4))}"${w.current ? raw(' data-week-current') : ''} hidden>
            ${w.days.map(d => { const iso = isoDate(d); const evs = w.evs.filter(e => e.date === iso); const hol = content.holidays.filter(h => h.date === iso); return html`<section class="day" data-filter-group><div class="day-head ${iso === today ? 'is-today' : ''}"><strong>${DAYS[d.getDay()]}</strong><span>${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}${iso === today ? ' · heute' : ''}</span><span class="count">${evs.length} ${evs.length === 1 ? 'Termin' : 'Termine'}</span></div>
              ${hol.length ? html`<div class="note" style="border-radius:0">${hol.map(h => html`<span><strong>${h.name}</strong> – ${h.exchanges.join(' und ')} ${h.early ? 'verkürzter Handel' : 'geschlossen'}. </span>`)}</div>` : ''}
              <div class="table-wrap"><table class="event-table"><thead><tr><th>Zeit</th><th>Land</th><th>Termin</th><th>Zeitraum</th><th>Relevanz</th><th>Einheit</th></tr></thead><tbody>
                ${evs.map(e => html`<tr data-cat="imp${e.impact} ${e.country}"><td class="time">${e.time}</td><td>${flag(e.country)}</td><td><span class="ev-title">${e.title}</span>${e.why ? html`<span class="ev-sub">${e.why}</span>` : ''}</td><td>${e.period}</td><td>${impact(e.impact)}</td><td class="muted">${e.unit || '–'}</td></tr>`)}
                <tr data-group-empty ${evs.length ? raw('hidden') : ''}><td colspan="6" class="muted">${evs.length ? 'Kein Termin entspricht den Filtern.' : 'Keine marktrelevanten Veröffentlichungen geplant.'}</td></tr>
              </tbody></table></div></section>`; })}
          </div>`)}
        </div>
        <div class="legend"><span>${impact(3)} hohe Relevanz: bewegt Märkte regelmäßig</span><span>${impact(2)} mittel</span><span>${impact(1)} niedrig</span><span>Zeiten in MEZ/MESZ</span></div>
        <p class="small muted" style="margin-top:12px">Die Termine folgen den Veröffentlichungsplänen der Statistikämter und Notenbanken (Fed, EZB, BoE, BoJ, SNB: offizielle Sitzungskalender 2026; Konjunkturdaten: übliche Veröffentlichungsrhythmen). Konsensschätzungen und Vorwerte werden mit Anbindung eines Datenfeeds ergänzt. Änderungen vorbehalten.</p>
      </div><aside>
        ${c.sideCard('Die nächsten Highlights', html`<ul class="upcoming">${content.upcomingEvents(6).filter(e => e.impact === 3).slice(0, 5).map(e => html`<li><div class="date"><b>${D(e.date).getDate()}</b><span>${MONTHS_SHORT[D(e.date).getMonth()]}</span></div><div><div class="what">${e.title}</div><div class="who">${dateWeekday(D(e.date))} · ${e.time} Uhr · ${e.countryName}</div></div></li>`)}</ul>`)}
        ${c.sideCard('Lesen', html`<ul class="side-list">${['ezb-zinsentscheid-was-anleger-wissen-muessen', 'fed-zinsentscheid-fomc-erklaert', 'ifo-index-erklaert', 'us-arbeitsmarktbericht-payrolls-erklaert', 'inflation-verbraucherpreise-richtig-lesen'].map(s => { const a = content.articles.find(x => x.slug === s); return a ? html`<li><a href="${c.articleUrl(a)}"><span class="kicker">${a.categoryObj.name}</span><span>${a.title}</span></a></li>` : ''; })}</ul>`)}
        ${c.newsletterBox({ compact: true })}
      </aside></div></div>`;
    add('/termine/wirtschaftskalender', 'Wirtschaftskalender', 'Konjunkturdaten und Zentralbanktermine der Woche mit Uhrzeit (MEZ), Land, Zeitraum und Relevanz. Fed, EZB, ifo, Arbeitsmarkt, Inflation.', body);
  }

  // ---------- Unternehmenstermine ----------
  {
    const from = isoDate(startOfWeek(now)), to = isoDate(addDays(now, 70));
    const evs = content.companyEvents.filter(e => e.date >= from && e.date <= to);
    const byDate = {};
    for (const e of evs) (byDate[e.date] = byDate[e.date] || []).push(e);
    const types = ['Quartalszahlen', 'Hauptversammlung', 'Dividende'];
    const body = html`<div class="container page">
      ${c.breadcrumb(crumbs('Unternehmenstermine', '/termine/unternehmen'))}
      ${c.pageHead({ kicker: 'Termine', title: 'Unternehmenstermine', lead: html`Quartalszahlen, Hauptversammlungen und Dividendentermine der DAX- und MDAX-Unternehmen für die nächsten zehn Wochen. ${c.placeholder()} Die Termine sind aus den üblichen Berichtsfenstern abgeleitet und als „voraussichtlich“ markiert, bis der Unternehmenskalender-Feed angebunden ist.` })}
      ${c.subnav(sub, '/termine/unternehmen')}
      <div class="filter-bar" data-chipfilter="co-list" data-chipfilter-attr="data-cat"><span class="label">Art</span><div class="group"><button class="chip is-active" type="button" data-chip="all" aria-pressed="true">Alle</button>${types.map(t => html`<button class="chip" type="button" data-chip="${t}" aria-pressed="false">${t}</button>`)}</div><span class="small muted" style="margin-left:auto"><span data-chipfilter-count="co-list">${evs.length}</span> Termine</span></div>
      <div class="layout no-sticky"><div id="co-list">
        ${Object.keys(byDate).sort().map(date => { const d = D(date); return html`<section class="day" data-filter-group><div class="day-head ${date === today ? 'is-today' : ''}"><strong>${DAYS[d.getDay()]}</strong><span>${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}</span><span class="count">${byDate[date].length} Termine</span></div><div class="table-wrap"><table class="event-table"><thead><tr><th>Unternehmen</th><th>Termin</th><th>Art</th><th>Hinweis</th></tr></thead><tbody>${byDate[date].map(e => { const x = ctx.quote(e.company.slug) || {}; return html`<tr data-cat="${e.type}" id="${byDate[date].indexOf(e) === 0 ? '' : ''}"><td><a href="${c.url(e.company)}"><strong>${e.company.name}</strong></a><span class="ev-sub">${e.company.index} · ${num(x.price)} € ${c.delta(x.changePct)}</span></td><td class="ev-title">${e.title}${e.amount ? html`<span class="ev-sub">ca. ${num(e.amount, 2)} € je Aktie (${num(e.yieldPct, 2)} %)</span>` : ''}</td><td><span class="badge">${e.type}</span></td><td class="muted small">${e.note}</td></tr>`; })}<tr data-group-empty hidden><td colspan="4" class="muted">Kein Termin dieser Art an diesem Tag.</td></tr></tbody></table></div></section>`; })}
      </div><aside>
        ${c.sideCard('So lesen Sie Quartalszahlen', html`<p class="small">Umsatz, operatives Ergebnis, Free Cashflow und vor allem der Ausblick – <a href="/artikel/quartalszahlen-lesen-in-fuenf-minuten">unser Leitfaden in fünf Minuten</a>.</p>`)}
        ${c.sideCard('Berichtssaison', html`<p class="small">Deutsche Unternehmen berichten in vier Fenstern: <strong>Ende Februar bis März</strong> (Geschäftsjahr), <strong>Ende April bis Mitte Mai</strong> (Q1), <strong>Ende Juli bis Mitte August</strong> (Q2) und <strong>Ende Oktober bis Mitte November</strong> (Q3). Hauptversammlungen finden überwiegend zwischen April und Juni statt; die Dividende wird am dritten Geschäftstag danach gezahlt.</p>`)}
        ${c.sideMovers()}
      </aside></div></div>`;
    add('/termine/unternehmen', 'Unternehmenstermine', 'Quartalszahlen, Hauptversammlungen und Dividendentermine der DAX- und MDAX-Unternehmen.', body);
  }

  // ---------- Dividenden ----------
  {
    const rows = instruments.stocks.map(s => ({ s, x: ctx.quote(s.slug) || {} })).filter(r => r.x.dividendYield > 0).sort((a, b) => b.x.dividendYield - a.x.dividendYield);
    const nextEx = content.companyEvents.filter(e => e.type === 'Dividende' && e.date >= today).slice(0, 12);
    const avg = rows.reduce((n, r) => n + r.x.dividendYield, 0) / rows.length;
    const body = html`<div class="container page">
      ${c.breadcrumb(crumbs('Dividendenkalender', '/termine/dividenden'))}
      ${c.pageHead({ kicker: 'Termine', title: 'Dividendenkalender', lead: html`Dividendenrenditen aller DAX- und MDAX-Werte auf Basis der letzten Ausschüttung sowie die nächsten Ex-Tage. Durchschnittliche Rendite der ausschüttenden Werte: <strong>${num(avg, 2)} %</strong>.` })}
      ${c.subnav(sub, '/termine/dividenden')}
      <div class="layout no-sticky"><div class="stack">
        <section class="card">${c.sectionTitle('Dividendenrendite – alle Werte')}<div class="table-wrap"><table class="quote-table" data-sortable><thead><tr><th>#</th><th>Aktie</th><th class="num">Kurs</th><th class="num">Div.-Rendite</th><th class="num hide-m">Dividende je Aktie*</th><th class="num hide-m">KGV</th><th class="hide-m">Branche</th></tr></thead><tbody>${rows.map((r, i) => html`<tr><td class="rank-pos" data-v="${i + 1}">${i + 1}</td><td><a href="${c.url(r.s)}">${r.s.name}</a><span class="sub">${r.s.index}</span></td><td class="num" data-v="${r.x.price}">${num(r.x.price)} €</td><td class="num" data-v="${r.x.dividendYield}"><strong>${num(r.x.dividendYield, 2)} %</strong></td><td class="num hide-m" data-v="${r.x.price * r.x.dividendYield / 100}">${num(r.x.price * r.x.dividendYield / 100, 2)} €</td><td class="num hide-m" data-v="${r.x.pe || 0}">${r.x.pe ? num(r.x.pe, 1) : '–'}</td><td class="hide-m muted">${r.s.sector}</td></tr>`)}</tbody></table></div><p class="small muted" style="margin-top:8px">* Rechnerisch aus Kurs und Dividendenrendite der letzten zwölf Monate. Die tatsächliche Dividende beschließt die Hauptversammlung. Werte ohne Ausschüttung sind nicht aufgeführt.</p></section>
        <section class="card">${c.sectionTitle('Nächste Ex-Tage')}${c.placeholder()}<ul class="upcoming" style="margin-top:10px">${nextEx.map(e => html`<li><div class="date"><b>${D(e.date).getDate()}</b><span>${MONTHS_SHORT[D(e.date).getMonth()]}</span></div><div><div class="what"><a href="${c.url(e.company)}">${e.company.name}</a> – ca. ${num(e.amount, 2)} € (${num(e.yieldPct, 2)} %)</div><div class="who">Ex-Tag ${e.note}, Zahlung drei Geschäftstage später</div></div></li>`)}</ul></section>
      </div><aside>
        ${c.sideCard('Dividende verstehen', html`<p class="small">Am <strong>Ex-Tag</strong> wird die Aktie erstmals ohne Dividendenanspruch gehandelt, der Kurs wird um die Dividende gekürzt. Wer am Vortag (Record Date) Aktionär war, erhält die Zahlung. Auf Dividenden fallen 26,375 % Abgeltungsteuer an, bis 1.000 € pro Jahr steuerfrei. Rechnen Sie Ihre Erträge im <a href="/werkzeuge/dividendenrechner">Dividendenrechner</a>.</p>`)}
        ${c.sideCard('Vorsicht bei sehr hohen Renditen', html`<p class="small">Eine Rendite deutlich über dem Durchschnitt entsteht oft durch einen gefallenen Kurs – der Markt erwartet dann eine Kürzung. Prüfen Sie die Ausschüttungsquote und den Free Cashflow (<a href="/wissen/kennzahlen">Kennzahlen verstehen</a>).</p>`)}
        ${c.newsletterBox({ compact: true })}
      </aside></div></div>`;
    add('/termine/dividenden', 'Dividendenkalender', 'Dividendenrenditen aller DAX- und MDAX-Aktien, sortierbar, plus die nächsten Ex-Tage.', body);
  }

  // ---------- Hauptversammlungen ----------
  {
    const hv = content.companyEvents.filter(e => e.type === 'Hauptversammlung' && e.date >= today).slice(0, 60);
    const body = html`<div class="container page">
      ${c.breadcrumb(crumbs('Hauptversammlungen', '/termine/hauptversammlungen'))}
      ${c.pageHead({ kicker: 'Termine', title: 'Hauptversammlungen', lead: html`Die nächsten ordentlichen Hauptversammlungen der DAX- und MDAX-Unternehmen. ${c.placeholder()} Termine voraussichtlich, bis der Unternehmenskalender angebunden ist.` })}
      ${c.subnav(sub, '/termine/hauptversammlungen')}
      <div class="layout no-sticky"><div class="card"><div class="table-wrap"><table class="quote-table" data-sortable><thead><tr><th>Datum</th><th>Unternehmen</th><th class="hide-m">Index</th><th class="num">Kurs</th><th class="num hide-m">Div.-Rendite</th><th class="hide-m">Status</th></tr></thead><tbody>${hv.map(e => { const x = ctx.quote(e.company.slug) || {}; return html`<tr><td data-v="${e.date.replace(/-/g, '')}">${dateWeekday(D(e.date))}${e.date.slice(0, 4)}</td><td><a href="${c.url(e.company)}">${e.company.name}</a></td><td class="hide-m muted">${e.company.index}</td><td class="num" data-v="${x.price}">${num(x.price)} €</td><td class="num hide-m" data-v="${x.dividendYield || 0}">${x.dividendYield ? num(x.dividendYield, 2) + ' %' : '–'}</td><td class="hide-m"><span class="badge">${e.note}</span></td></tr>`; })}</tbody></table></div></div>
      <aside>${c.sideCard('Was auf einer HV passiert', html`<p class="small">Die Hauptversammlung beschließt die Dividende, entlastet Vorstand und Aufsichtsrat, wählt Aufsichtsräte und stimmt über Kapitalmaßnahmen ab. Stammaktionäre haben Stimmrecht, Vorzugsaktionäre in der Regel nicht. Die Dividende wird am dritten Geschäftstag nach der HV gezahlt; Ex-Tag ist der Tag nach der HV.</p>`)}${c.sideCard('Teilnahme', html`<p class="small">Anmeldung über die Depotbank bis meist sechs Tage vor dem Termin (Record Date). Viele Unternehmen bieten virtuelle Hauptversammlungen mit Online-Abstimmung an.</p>`)}${c.sideMovers()}</aside></div></div>`;
    add('/termine/hauptversammlungen', 'Hauptversammlungen', 'Termine der nächsten Hauptversammlungen von DAX- und MDAX-Unternehmen.', body);
  }

  // ---------- Börsenfeiertage ----------
  {
    const hol = content.holidays;
    const next = hol.find(h => h.date >= today);
    const body = html`<div class="container page">
      ${c.breadcrumb(crumbs('Börsenfeiertage', '/termine/boersenfeiertage'))}
      ${c.pageHead({ kicker: 'Termine', title: 'Börsenfeiertage 2026', lead: html`An diesen Tagen bleiben Xetra/Frankfurt und die US-Börsen (NYSE, Nasdaq) geschlossen oder handeln verkürzt. ${next ? html`Nächster börsenfreier Tag: <strong>${dateLong(D(next.date))} (${next.name}, ${next.exchanges.join(' und ')})</strong>.` : ''}` })}
      ${c.subnav(sub, '/termine/boersenfeiertage')}
      <div class="layout no-sticky"><div class="card"><div class="table-wrap"><table class="quote-table"><thead><tr><th>Datum</th><th>Anlass</th><th>Xetra / Frankfurt</th><th>NYSE / Nasdaq</th></tr></thead><tbody>${hol.map(h => { const past = h.date < today; return html`<tr style="${past ? 'opacity:.55' : ''}"><td class="nowrap">${dateWeekday(D(h.date))}${h.date.slice(0, 4)}${h.date === next?.date ? html` <span class="badge is-accent">nächster</span>` : ''}</td><td>${h.name}${h.note ? html`<span class="sub">${h.note}</span>` : ''}</td><td>${h.exchanges.includes('Xetra') ? html`<span class="badge is-down">geschlossen</span>` : html`<span class="badge is-up">Handel</span>`}</td><td>${h.exchanges.includes('NYSE') ? (h.early ? html`<span class="badge">verkürzt bis 19:00 MEZ</span>` : html`<span class="badge is-down">geschlossen</span>`) : h.earlyNyse ? html`<span class="badge">verkürzt bis 19:00 MEZ</span>` : html`<span class="badge is-up">Handel</span>`}</td></tr>`; })}</tbody></table></div><p class="small muted" style="margin-top:10px">Quelle: Handelskalender der Deutschen Börse und der NYSE für 2026. An deutschen Feiertagen ohne Xetra-Schließung (z. B. 3. Oktober, Fronleichnam, Pfingstmontag) wird regulär gehandelt. Der Kalender 2027 folgt nach Veröffentlichung.</p></div>
      <aside>${c.sideCard('Handelszeiten', html`<p class="small">Xetra 9:00–17:30 Uhr, Frankfurt Parkett und Direkthandel 8:00–22:00 Uhr, Wall Street 15:30–22:00 Uhr MEZ. Alle Börsen im Ratgeber <a href="/wissen/handelszeiten">Handelszeiten</a>.</p>`)}${c.sideCard('Zeitumstellung', html`<p class="small">Die USA stellen die Uhren an anderen Terminen um als Europa. Vom 8. bis 28. März 2026 und vom 25. Oktober bis 1. November 2026 öffnet die Wall Street deshalb um 14:30 bzw. 16:30 Uhr MEZ statt um 15:30 Uhr.</p>`)}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add('/termine/boersenfeiertage', 'Börsenfeiertage 2026', 'Alle börsenfreien Tage 2026 für Xetra/Frankfurt und die US-Börsen, inkl. verkürzter Handelstage.', body);
  }

  // ---------- IPOs ----------
  {
    const ipoRow = (i) => html`<div class="ipo-row"><span class="when">${i.status === 'geplant' ? dateWeekday(D(i.date)) : dateShort(D(i.date))}</span><div><div class="name"><a href="/ipo/${i.slug}">${i.name}</a></div><div class="meta">${i.sector} · ${i.market} · ${i.status === 'geplant' ? 'Preisspanne ' + i.priceRange : i.priceRange + ', Erstkurs ' + i.firstPrice}</div></div><span class="badge ${i.status === 'geplant' ? 'is-accent' : ''}">${i.status === 'geplant' ? 'geplant' : 'erfolgt'}</span></div>`;
    const body = html`<div class="container page">
      ${c.breadcrumb(crumbs('Börsengänge', '/termine/ipos'))}
      ${c.pageHead({ kicker: 'Termine', title: 'Börsengänge (IPOs)', lead: html`Geplante und kürzlich erfolgte Börsengänge mit Preisspanne, Emissionsvolumen und Handelsplatz. ${c.placeholder()} Die aufgeführten Unternehmen sind erfundene Beispiele zur Darstellung – sie werden durch den IPO-Feed ersetzt.` })}
      ${c.subnav(sub, '/termine/ipos')}
      <div class="layout no-sticky"><div class="stack"><section class="card">${c.sectionTitle('Geplante Börsengänge')}${content.ipos.upcoming.map(ipoRow)}</section><section class="card">${c.sectionTitle('Kürzlich erfolgt')}${content.ipos.recent.map(ipoRow)}</section></div>
      <aside>${c.sideCard('So läuft ein Börsengang', html`<ol class="small" style="padding-left:1.2em;display:grid;gap:6px"><li><strong>Intention to Float:</strong> Das Unternehmen kündigt den Börsengang an (etwa vier Wochen vorher).</li><li><strong>Preisspanne:</strong> Mit dem Wertpapierprospekt beginnt das Bookbuilding (meist ein bis zwei Wochen).</li><li><strong>Zeichnung:</strong> Anleger geben über ihre Bank Kaufaufträge ab; bei Überzeichnung wird zugeteilt.</li><li><strong>Erstnotiz:</strong> Der erste Handelstag zeigt, ob der Ausgabepreis richtig lag.</li></ol>`)}${c.sideCard('Begriffe', html`<ul class="side-list">${['ipo', 'bookbuilding', 'emittent'].map(s => { const t = content.glossaryBySlug[s]; return t ? html`<li><a href="/wissen/boersenlexikon#${t.slug}"><span>${t.term}</span></a></li>` : ''; })}</ul>`, { href: '/wissen/boersenlexikon', more: 'Lexikon' })}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add('/termine/ipos', 'Börsengänge (IPOs)', 'Geplante und erfolgte Börsengänge mit Preisspanne, Volumen und Handelsplatz.', body);

    for (const i of content.ipos.list) {
      const body = html`<div class="container page">
        ${c.breadcrumb([['Termine', '/termine/wirtschaftskalender'], ['Börsengänge', '/termine/ipos'], [i.name, `/ipo/${i.slug}`]])}
        <div class="layout"><article class="article">
          <header class="article-head"><div class="story-top"><span class="tag">Börsengang</span><span class="badge ${i.status === 'geplant' ? 'is-accent' : ''}">${i.status}</span>${c.placeholder()}</div><h1>${i.name}</h1><p class="deck">${i.desc}</p></header>
          <div class="card" style="margin-bottom:20px"><dl class="kv is-single"><div><dt>${i.status === 'geplant' ? 'Geplante Erstnotiz' : 'Erstnotiz'}</dt><dd>${dateLong(D(i.date))}</dd></div><div><dt>Branche</dt><dd>${i.sector}</dd></div><div><dt>Handelsplatz / Segment</dt><dd>${i.market}</dd></div><div><dt>${i.status === 'geplant' ? 'Preisspanne' : 'Ausgabepreis'}</dt><dd>${i.priceRange}</dd></div>${i.firstPrice ? html`<div><dt>Erster Kurs</dt><dd>${i.firstPrice}</dd></div>` : ''}<div><dt>Emissionsvolumen</dt><dd>${i.volume}</dd></div><div><dt>Angebotene Aktien</dt><dd>${i.shares}</dd></div></dl></div>
          <div class="prose"><p>${i.lead} Sobald der Datenfeed für Börsengänge angebunden ist, erscheinen an dieser Stelle Angaben aus dem Wertpapierprospekt: Geschäftsmodell, Verwendung des Emissionserlöses, Altaktionäre, Lock-up-Fristen und Konsortialbanken.</p><h2>Worauf Anleger bei Börsengängen achten</h2><ul><li><strong>Verwendung des Erlöses:</strong> Fließt das Geld ins Unternehmen (Kapitalerhöhung) oder an Altaktionäre (Umplatzierung)?</li><li><strong>Bewertung:</strong> Preisspanne im Verhältnis zu Umsatz und Gewinn, verglichen mit börsennotierten Wettbewerbern.</li><li><strong>Lock-up:</strong> Wie lange dürfen Altaktionäre nicht verkaufen (meist 6 bis 12 Monate)?</li><li><strong>Zeichnungsfrist und Zuteilung:</strong> Bei starker Nachfrage werden Privatanleger oft nur anteilig bedient.</li></ul></div>
          ${c.disclaimer()}
        </article><aside>${c.sideCard('Weitere Börsengänge', html`${content.ipos.list.filter(x => x.slug !== i.slug).slice(0, 5).map(x => html`<div class="mini-quote"><a href="/ipo/${x.slug}">${x.name}</a><span class="small muted">${dateShort(D(x.date))}</span></div>`)}`, { href: '/termine/ipos', more: 'Alle' })}${c.newsletterBox({ compact: true })}</aside></div></div>`;
      pages.push({ path: `/ipo/${i.slug}`, html: layout.page({ title: `Börsengang ${i.name}`, description: i.desc, path: `/ipo/${i.slug}`, body, section: 'termine', noindex: true }) });
    }
  }

  function weekNo(d) { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return Math.ceil(((x - y0) / 86400000 + 1) / 7); }
  return pages;
};
