'use strict';
module.exports = function (ctx) {
  const { c, layout, util, instruments, content, now } = ctx;
  const { html, raw, num, pct, isoDate, addDays, startOfWeek, dateShort, dateLong, dateWeekday, DAYS, MONTHS, MONTHS_SHORT, pad } = util;
  const pages = [];
  const sub = [['Wirtschaftskalender', '/termine/wirtschaftskalender'], ['Börsenfeiertage', '/termine/boersenfeiertage']];
  const crumbs = (t, p) => [['Termine', '/termine/wirtschaftskalender'], [t, p]];
  const add = (path, title, description, body, noindex) => { content.searchablePages.push({ title, path, kicker: 'Termine', description }); pages.push({ path, html: layout.page({ title, description, path, body, section: 'termine', noindex }) }); };
  const today = isoDate(now);
  const D = (iso) => new Date(iso + 'T00:00:00');
  function weekNo(d) { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return Math.ceil(((x - y0) / 86400000 + 1) / 7); }
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

  // ---------- Börsenfeiertage ----------
  {
    const hol = content.holidays;
    const next = hol.find(h => h.date >= today);
    const body = html`<div class="container page">
      ${c.breadcrumb(crumbs('Börsenfeiertage', '/termine/boersenfeiertage'))}
      ${c.pageHead({ kicker: 'Termine', title: 'Börsenfeiertage 2026', lead: html`An diesen Tagen bleiben Xetra/Frankfurt und die US-Börsen (NYSE, Nasdaq) geschlossen oder handeln verkürzt. ${next ? html`Nächster börsenfreier Tag: <strong>${dateLong(D(next.date))} (${next.name}, ${next.exchanges.join(' und ')})</strong>.` : ''}` })}
      ${c.subnav(sub, '/termine/boersenfeiertage')}
      <div class="layout no-sticky"><div class="card"><div class="table-wrap"><table class="quote-table"><thead><tr><th>Datum</th><th>Anlass</th><th>Xetra / Frankfurt</th><th>NYSE / Nasdaq</th></tr></thead><tbody>${hol.map(h => { const past = h.date < today; return html`<tr style="${past ? 'opacity:.55' : ''}"><td class="nowrap"><span translate="no">${dateWeekday(D(h.date))}${h.date.slice(0, 4)}</span>${h.date === next?.date ? html` <span class="badge is-accent">nächster</span>` : ''}</td><td>${h.name}${h.note ? html`<span class="sub">${h.note}</span>` : ''}</td><td>${h.exchanges.includes('Xetra') ? html`<span class="badge is-down">geschlossen</span>` : html`<span class="badge is-up">Handel</span>`}</td><td>${h.exchanges.includes('NYSE') ? (h.early ? html`<span class="badge is-early">verkürzt bis 19:00 MEZ</span>` : html`<span class="badge is-down">geschlossen</span>`) : h.earlyNyse ? html`<span class="badge is-early">verkürzt bis 19:00 MEZ</span>` : html`<span class="badge is-up">Handel</span>`}</td></tr>`; })}</tbody></table></div><p class="small muted" style="margin-top:10px">Quelle: Handelskalender der Deutschen Börse und der NYSE für 2026. An deutschen Feiertagen ohne Xetra-Schließung (z. B. 3. Oktober, Fronleichnam, Pfingstmontag) wird regulär gehandelt. Der Kalender 2027 folgt nach Veröffentlichung.</p></div>
      <aside>${c.sideCard('Handelszeiten', html`<p class="small">Xetra 9:00–17:30 Uhr, Frankfurt Parkett und Direkthandel 8:00–22:00 Uhr, Wall Street 15:30–22:00 Uhr MEZ. Alle Börsen im Ratgeber <a href="/wissen/handelszeiten">Handelszeiten</a>.</p>`)}${c.sideCard('Zeitumstellung', html`<p class="small">Die USA stellen die Uhren an anderen Terminen um als Europa. Vom 8. bis 28. März 2026 und vom 25. Oktober bis 1. November 2026 öffnet die Wall Street deshalb um 14:30 bzw. 16:30 Uhr MEZ statt um 15:30 Uhr.</p>`)}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add('/termine/boersenfeiertage', 'Börsenfeiertage 2026', 'Alle börsenfreien Tage 2026 für Xetra/Frankfurt und die US-Börsen, inkl. verkürzter Handelstage.', body);
  }

  return pages;
};
