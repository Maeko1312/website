'use strict';
module.exports = function (ctx) {
  const { c, layout, util, content, config, instruments } = ctx;
  const { html, raw, dateLong, num } = util;
  const pages = [];
  const L = config.legal;
  const add = (path, title, description, body, opts = {}) => { if (!opts.noindex) content.searchablePages.push({ title, path, kicker: opts.kicker || 'Über uns', description }); pages.push({ path, html: layout.page({ title, description, path, body, section: opts.section || null, noindex: opts.noindex }) }); };
  const prosePage = (path, title, lead, sections, opts = {}) => {
    const body = html`<div class="container page">
      ${c.breadcrumb([[title, path]])}
      <div class="layout"><article class="article"><header class="article-head"><span class="kicker">${opts.kicker || 'Über uns'}</span><h1>${title}</h1>${lead ? html`<p class="deck">${lead}</p>` : ''}</header>
        <div class="prose">${sections.map(s => html`${s.h ? html`<h2 id="${util.slugify(s.h)}">${s.h}</h2>` : ''}${raw(c.wrapTables(s.html))}`)}</div>
        ${opts.updated !== false ? html`<p class="disclaimer">Stand: ${dateLong(ctx.now)}.</p>` : ''}
      </article><aside class="no-sticky">${c.sideCard('Mehr über uns', html`<ul class="side-list">${[['Über Börsenblick', '/ueber-uns'], ['Redaktion', '/redaktion'], ['Redaktionelle Leitlinien', '/redaktionelle-leitlinien'], ['Methodik & Datenquellen', '/methodik'], ['Kontakt', '/kontakt'], ['Werben', '/werben']].filter(([, h]) => h !== path).map(([l, h]) => html`<li><a href="${h}"><span>${l}</span></a></li>`)}</ul>`)}${c.newsletterBox({ compact: true })}</aside></div></div>`;
    add(path, title, lead || title, body, opts);
  };
  const owner = (t) => `<span class="badge is-placeholder" title="Vom Betreiber zu ergänzen">${t}</span>`;

  // ---------- Suche ----------
  {
    const body = html`<div class="container page" data-search-page>
      ${c.breadcrumb([['Suche', '/suche']])}
      <div class="page-head"><span class="kicker">Suche</span><h1 data-search-page-title>Suche</h1><p class="lead">Aktien, Indizes, Rohstoffe, Währungen, Nachrichten, Ratgeber und Lexikon – ein Suchfeld für alles. Auch WKN und ISIN funktionieren.</p></div>
      <form class="filter-bar" role="search" action="/suche" method="get" style="margin-bottom:24px"><label class="visually-hidden" for="q-page">Suchbegriff</label><div class="control" style="flex:1"><input id="q-page" type="search" name="q" placeholder="z. B. Rheinmetall, DE0007164600, Dividende …" data-search-page-input autocomplete="off"></div><button class="btn btn-dark" type="submit">Suchen</button></form>
      <div class="layout no-sticky"><div data-search-page-results><div class="empty">Geben Sie oben einen Suchbegriff ein.</div></div>
      <aside>${c.sideCard('Häufig gesucht', html`<div class="chips">${['dax', 'sap', 'rheinmetall', 'gold', 'bitcoin', 'eur-usd', 'allianz', 'siemens-energy'].map(s => { const i = instruments.bySlug[s]; return html`<a class="chip" href="${c.url(i)}">${i.name}</a>`; })}<a class="chip" href="/wissen/boersenlexikon">Börsenlexikon</a><a class="chip" href="/termine/wirtschaftskalender">Wirtschaftskalender</a></div>`)}${c.sideKnowledge()}</aside></div></div>`;
    add('/suche', 'Suche', 'Suche nach Aktien, Indizes, Nachrichten und Begriffen.', body, { noindex: true });
  }

  // ---------- Newsletter ----------
  {
    const body = html`<div class="container page">
      ${c.breadcrumb([['Newsletter', '/newsletter']])}
      <div class="layout"><div class="stack">
        ${c.pageHead({ kicker: 'Newsletter', title: 'Börsenblick am Morgen', lead: 'Jeden Handelstag um 7:30 Uhr in Ihrem Postfach: wie Asien gelaufen ist, was die US-Futures anzeigen, die drei Termine des Tages und die eine Meldung, die Sie kennen sollten. In zwei Minuten gelesen, kostenlos, jederzeit abbestellbar.' })}
        ${c.nlBanner()}
        <section class="card">${c.sectionTitle('So sieht eine Ausgabe aus')}
          <div class="prose" style="font-size:15px"><p class="kicker">Beispielausgabe · ${dateLong(ctx.now)}, 7:30 Uhr</p><h3>Guten Morgen.</h3><p><strong>Die Lage:</strong> Der DAX hat gestern bei ${num(ctx.quote('dax').price, 0)} Punkten geschlossen (${util.pct(ctx.quote('dax').changePct)}). Der Nikkei notiert heute früh bei ${num(ctx.quote('nikkei-225').price, 0)} Punkten, Gold bei ${num(ctx.quote('gold').price, 0)} Dollar, der Euro bei ${num(ctx.quote('eur-usd').price, 4)} Dollar.</p><p><strong>Heute wichtig:</strong></p><ul>${content.upcomingEvents(3).map(e => `<li>${e.time} Uhr – ${e.title} (${e.countryName})</li>`).map(s => raw(s))}</ul><p><strong>Die Meldung:</strong> <a href="${c.articleUrl(content.articles[0])}">${content.articles[0].title}</a></p><p><strong>Zahl des Tages:</strong> ${num(ctx.quote('bund-10j').price, 2)} % – so hoch rentiert die zehnjährige Bundesanleihe.</p><p class="muted small">Sie erhalten diese E-Mail, weil Sie sich unter boersenblick.de angemeldet haben. Abmelden mit einem Klick.</p></div>
        </section>
        <section class="card faq">${c.sectionTitle('Fragen zum Newsletter')}<details><summary>Wie oft kommt der Newsletter?</summary><p>An jedem Xetra-Handelstag um 7:30 Uhr, also Montag bis Freitag außer an <a href="/termine/boersenfeiertage">Börsenfeiertagen</a>. Keine Sonderausgaben, keine Werbe-Mails.</p></details><details><summary>Was passiert mit meiner E-Mail-Adresse?</summary><p>Sie wird ausschließlich für den Versand verwendet und nicht weitergegeben. Nach der Anmeldung erhalten Sie eine Bestätigungs-Mail (Double Opt-in). Details in den <a href="/datenschutz">Datenschutzhinweisen</a>.</p></details><details><summary>Wie melde ich mich ab?</summary><p>Über den Link am Ende jeder Ausgabe – mit einem Klick, ohne Login.</p></details></section>
      </div><aside>${c.sideCard('Alternativ: RSS', html`<p class="small">Alle Nachrichten und Analysen als <a href="/feed.xml">RSS-Feed</a> für Ihren Feedreader – ohne Anmeldung, in Echtzeit.</p>`)}${c.sideUpcoming(4)}${c.sideRecent()}</aside></div></div>`;
    add('/newsletter', 'Newsletter „Börsenblick am Morgen“', 'Der kostenlose Börsen-Newsletter: jeden Handelstag um 7:30 Uhr die Lage an den Märkten, drei Termine und die wichtigste Meldung.', body, { kicker: 'Newsletter', section: 'nachrichten' });
  }

  // ---------- Newsletter: Danke ----------
  {
    const body = html`<div class="container page"><div class="layout"><div>
      ${c.pageHead({ kicker: 'Newsletter', title: 'Fast geschafft – bitte bestätigen Sie Ihre Anmeldung', lead: 'Wir haben Ihnen eine E-Mail geschickt. Klicken Sie auf den Bestätigungslink, dann kommt die erste Ausgabe von „Börsenblick am Morgen“ am nächsten Handelstag um 7:30 Uhr.' })}
      <section class="card"><h2 style="font-size:18px;margin-bottom:10px">Keine E-Mail erhalten?</h2><ul style="padding-left:1.2em;display:grid;gap:6px"><li>Prüfen Sie den Spam- oder Werbeordner und markieren Sie die Nachricht als „kein Spam“.</li><li>Fügen Sie unsere Absenderadresse zu Ihren Kontakten hinzu, damit künftige Ausgaben im Posteingang landen.</li><li>Nach fünf Minuten immer noch nichts? Melden Sie sich einfach <a href="/newsletter">erneut an</a>.</li></ul></section>
      <section class="card" style="margin-top:20px">${c.sectionTitle('Bis dahin: die meistgelesenen Beiträge', { href: '/blog', more: 'Zum Blog' })}${c.postList(content.blog.posts.slice(0, 4))}</section>
    </div><aside class="no-sticky">${c.sideIndices()}${c.sideUpcoming(4)}</aside></div></div>`;
    pages.push({ path: '/newsletter/danke', html: layout.page({ title: 'Anmeldung bestätigen', description: 'Bitte bestätigen Sie Ihre Newsletter-Anmeldung.', path: '/newsletter/danke', body, section: 'nachrichten', noindex: true }) });
  }

  // ---------- Über uns ----------
  prosePage('/ueber-uns', 'Über Börsenblick', `${config.brand} ist ein unabhängiges Finanzportal für Anlegerinnen und Anleger im deutschsprachigen Raum. Wir erklären, was an den Märkten passiert – in klarer Sprache, mit echten Zahlen und ohne Produktverkauf.`, [
    { h: 'Was wir machen', html: `<p>Wir berichten täglich über den deutschen Aktienmarkt, die wichtigsten internationalen Indizes, Rohstoffe, Devisen, Kryptowährungen und Zinsen. Dazu kommen technische Analysen, ein Wirtschaftskalender, Rankings, ein Börsenlexikon und Rechner für die wichtigsten Anlegerfragen. Alle Kurse auf dieser Seite werden in Euro und in den in Europa gebräuchlichen Einheiten (Gramm, Liter, Kilowattstunde) ausgewiesen, wo das sinnvoll ist.</p>` },
    { h: 'Woran wir uns halten', html: `<ul><li><strong>Keine Anlageberatung.</strong> Wir liefern Informationen und Einordnung. Was Sie kaufen oder verkaufen, entscheiden Sie.</li><li><strong>Echte Zahlen.</strong> Marktberichte entstehen aus den offiziellen Schlusskursen, Analysen aus nachvollziehbaren Regeln (siehe <a href="/methodik">Methodik</a>).</li><li><strong>Kein Produktverkauf.</strong> Wir vermitteln keine Depots, Zertifikate oder Fonds und erhalten keine Provisionen für Empfehlungen.</li><li><strong>Fehlerkultur.</strong> Wir korrigieren Fehler sichtbar und schnell. Hinweise nehmen wir unter <a href="/kontakt">Kontakt</a> entgegen.</li></ul>` },
    { h: 'Wer dahintersteht', html: `<p>Die <a href="/redaktion">Redaktion</a> besteht aus Wirtschaftsjournalistinnen und -journalisten sowie ehemaligen Analysten. Betreiber ist ${owner(L.company)}, ${owner(L.city)}. Wie wir uns finanzieren, steht unter <a href="/werben">Werben</a>.</p>` },
  ]);

  // ---------- Redaktion ----------
  {
    const body = html`<div class="container page">
      ${c.breadcrumb([['Redaktion', '/redaktion']])}
      ${c.pageHead({ kicker: 'Über uns', title: 'Redaktion', lead: html`Wer bei ${config.brand} schreibt, wofür die einzelnen Personen zuständig sind und wie Sie sie erreichen. ${c.placeholder()} Namen und Profile sind Platzhalter, bis das Team feststeht.` })}
      <div class="grid-2">${content.authors.list.map(a => html`<section class="card" id="${a.slug}"><div class="author-line" style="align-items:flex-start;gap:16px">${c.avatar(a, true)}<div><h2 style="font-size:20px">${a.name}</h2><p class="muted small">${a.role} · Schwerpunkt: ${a.focus}</p><p style="margin-top:8px">${a.bio}</p><p class="small" style="margin-top:10px"><a href="/kontakt">Kontakt zur Redaktion</a> · ${content.articles.filter(x => x.author === a.slug).length} Beiträge</p></div></div></section>`)}</div>
      <section class="card" style="margin-top:24px">${c.sectionTitle('Wie wir arbeiten')}<p>Unsere Regeln für Unabhängigkeit, Quellen, Korrekturen und den Umgang mit eigenen Wertpapiergeschäften stehen in den <a href="/redaktionelle-leitlinien">redaktionellen Leitlinien</a>. Woher die Kurse kommen und wie Analysen entstehen, erklärt die Seite <a href="/methodik">Methodik & Datenquellen</a>.</p></section>
    </div>`;
    add('/redaktion', 'Redaktion', 'Das Team hinter Börsenblick: Zuständigkeiten, Profile, Kontakt.', body);
  }

  prosePage('/redaktionelle-leitlinien', 'Redaktionelle Leitlinien', 'Nach diesen Regeln arbeitet die Redaktion. Sie gelten für alle Beiträge, auch für automatisch aus Kursdaten erzeugte Marktberichte.', [
    { h: 'Unabhängigkeit', html: `<p>Redaktionelle Inhalte werden nicht von Werbekunden, Emittenten oder Unternehmen beeinflusst, über die wir berichten. Werbung ist als solche gekennzeichnet und von redaktionellen Inhalten getrennt.</p>` },
    { h: 'Keine Anlageberatung', html: `<p>Wir geben keine individuellen Empfehlungen. Technische Analysen beschreiben Szenarien („bullisch, wenn …“), keine Handlungsanweisungen. Jeder Beitrag mit Kursbezug trägt einen Risikohinweis.</p>` },
    { h: 'Eigene Wertpapiergeschäfte', html: `<p>Redaktionsmitglieder dürfen Wertpapiere, über die sie berichten, nicht innerhalb von 48 Stunden vor und nach Veröffentlichung handeln. Bestehende Positionen in besprochenen Einzelwerten werden am Ende des Beitrags offengelegt.</p>` },
    { h: 'Quellen und Zahlen', html: `<p>Kurse stammen von den in der <a href="/methodik">Methodik</a> genannten Quellen. Konjunkturdaten zitieren wir nach den veröffentlichenden Behörden (Destatis, Eurostat, BLS, EZB, Fed). Analystenschätzungen nennen wir mit Haus und Datum.</p>` },
    { h: 'Automatisch erzeugte Inhalte', html: `<p>Marktberichte, Aktien-Checks und Chartanalysen werden aus offiziellen Kursdaten nach festen Regeln erzeugt und tragen die Kennzeichnung „Datenbasiert“. Sie werden vor Veröffentlichung von einer Redakteurin oder einem Redakteur geprüft. Die Regeln sind in der <a href="/methodik">Methodik</a> dokumentiert.</p>` },
    { h: 'Korrekturen', html: `<p>Fehler korrigieren wir im Beitrag und kennzeichnen die Änderung mit Datum. Sachliche Fehler, die die Aussage eines Beitrags verändern, werden zusätzlich am Anfang vermerkt. Hinweise: <a href="/kontakt">Kontaktformular</a>.</p>` },
    { h: 'Trennung von Werbung', html: `<p>Bezahlte Inhalte tragen die Kennzeichnung „Anzeige“. Affiliate-Links setzen wir nicht ein. Details unter <a href="/werben">Werben</a>.</p>` },
  ]);

  prosePage('/methodik', 'Methodik & Datenquellen', 'Woher die Kurse kommen, wie stark sie verzögert sind, wie Kennzahlen und Analysen berechnet werden – und was die Seite nicht kann.', [
    { h: 'Kursdaten', html: `<table><thead><tr><th>Anlageklasse</th><th>Quelle / Referenz</th><th>Verzögerung</th></tr></thead><tbody><tr><td>Deutsche Aktien und Indizes</td><td>Xetra (Deutsche Börse)</td><td>mindestens 15 Minuten</td></tr><tr><td>US-Indizes</td><td>NYSE / Nasdaq / CBOE</td><td>10–15 Minuten</td></tr><tr><td>EURO STOXX 50, Nikkei</td><td>STOXX / Tokyo Stock Exchange</td><td>nahezu Echtzeit</td></tr><tr><td>Rohstoffe</td><td>Spot (Gold, Silber, Platin), nächstfälliger Future (Brent, WTI, Kupfer, Erdgas)</td><td>Spot Echtzeit, Futures 10 Minuten</td></tr><tr><td>Devisen</td><td>Interbanken-Referenzkurse</td><td>nahezu Echtzeit</td></tr><tr><td>Kryptowährungen</td><td>Coinbase</td><td>nahezu Echtzeit</td></tr><tr><td>Anleiherenditen</td><td>Referenzrenditen 2 und 10 Jahre</td><td>nahezu Echtzeit</td></tr></tbody></table><p>Auf jeder Seite ist der Stand der Kurse angegeben („${layout.asOfLabel}“). Die Kurse werden nicht live im Browser nachgeladen, sondern mit jeder Aktualisierung der Seite neu eingebettet. Historische Charts zeigen Tagesschlusskurse der letzten zwölf Monate.</p>` },
    { h: 'Kennzahlen', html: `<dl><div><dt>KGV</dt><dd>Kurs geteilt durch den Gewinn je Aktie der letzten zwölf Monate (trailing). Bei Verlust nicht ausgewiesen.</dd></div><div><dt>Dividendenrendite</dt><dd>Summe der Ausschüttungen der letzten zwölf Monate geteilt durch den Kurs.</dd></div><div><dt>Marktkapitalisierung</dt><dd>Kurs mal ausstehende Aktien, in Euro.</dd></div><div><dt>Performance</dt><dd>Kursveränderung über 1 Woche, 1/3/6 Monate, seit Jahresbeginn und 1 Jahr, ohne Dividenden (außer bei Performanceindizes wie dem DAX).</dd></div><div><dt>Gleitende Durchschnitte</dt><dd>Einfache Durchschnitte (SMA) der Schlusskurse über 20, 50 und 200 Handelstage.</dd></div><div><dt>RSI</dt><dd>Relative-Stärke-Index nach Wilder über 14 Tage.</dd></div><div><dt>52-Wochen-Spanne</dt><dd>Höchster und niedrigster Kurs der letzten 52 Wochen; die Position wird linear zwischen beiden dargestellt.</dd></div></dl>` },
    { h: 'Umrechnungen', html: `<p>Rohstoffpreise werden mit dem aktuellen EUR/USD-Kurs in Euro umgerechnet. Einheiten: 1 Feinunze = 31,1035 g; 1 Barrel = 158,987 l; 1 Pfund = 453,59 g; 1 MMBtu = 293,071 kWh. Renditen in Prozent, Veränderungen von Renditen in Prozent der Rendite (nicht in Prozentpunkten), sofern nicht „Bp.“ (Basispunkte) angegeben ist.</p>` },
    { h: 'Datenbasierte Beiträge', html: `<p><strong>Marktberichte</strong> entstehen aus den Schlusskursen des jeweiligen Handelstags: DAX, MDAX, EURO STOXX 50, S&P 500, Nasdaq 100, die drei besten und schlechtesten DAX-Werte, Gold, Brent und EUR/USD. <strong>Aktien-Checks</strong> ordnen Bewertung (KGV), Ausschüttung und Trend (Kurs vs. 200-Tage-Linie) nach festen Schwellen ein. <strong>Chartanalysen</strong> bestimmen die Trendrichtung aus der Lage des Kurses zur 50- und 200-Tage-Linie; Widerstand und Unterstützung sind Hoch und Tief der letzten 20 Handelstage. Alle Schwellen sind im Text genannt.</p>` },
    { h: 'Wirtschaftskalender', html: `<p>Zentralbanktermine folgen den veröffentlichten Sitzungskalendern 2026 von Fed, EZB, Bank of England, Bank of Japan und SNB. Konjunkturdaten werden nach den üblichen Veröffentlichungsrhythmen der Statistikämter terminiert (z. B. US-Arbeitsmarktbericht am ersten Freitag, ifo-Index um den 24.). Abweichungen um einzelne Tage sind möglich. Konsensschätzungen und Vorwerte werden mit Anbindung eines Datenanbieters ergänzt.</p>` },
    { h: 'Was die Seite nicht kann', html: `<ul><li>Keine Echtzeitkurse und keine Kursalarme.</li><li>Keine Depotanbindung, kein Handel.</li><li>Unternehmenstermine und Börsengänge sind derzeit Platzhalter (gekennzeichnet) und werden mit einem Datenfeed ersetzt.</li><li>Keine Gewähr für Richtigkeit, Vollständigkeit und Aktualität der Daten.</li></ul>` },
  ]);

  prosePage('/kontakt', 'Kontakt', 'Hinweise, Korrekturen, Fragen an die Redaktion oder Anfragen zu Werbung – so erreichen Sie uns.', [
    { h: 'Redaktion', html: `<p>E-Mail: ${owner(L.email)}<br>Für Korrekturhinweise nennen Sie bitte die Adresse des Beitrags und die betroffene Stelle. Wir antworten in der Regel innerhalb von zwei Werktagen.</p>` },
    { h: 'Werbung und Kooperationen', html: `<p>Informationen zu Werbeformaten und Preisen finden Sie unter <a href="/werben">Werben</a>. Anfragen an: ${owner(L.email)}</p>` },
    { h: 'Postanschrift', html: `<p>${owner(L.company)}<br>${owner(L.street)}<br>${owner(L.city)}<br>Telefon: ${owner(L.phone)}</p><p class="note is-info">Wir geben keine individuellen Anlageempfehlungen – auch nicht per E-Mail. Fragen zu einzelnen Wertpapieren beantworten wir nur redaktionell und allgemein.</p>` },
  ]);

  prosePage('/werben', 'Werben auf Börsenblick', 'Erreichen Sie Anlegerinnen und Anleger, die sich täglich über Börse und Wirtschaft informieren – mit klar gekennzeichneter Werbung, getrennt vom redaktionellen Inhalt.', [
    { h: 'Zielgruppe', html: `<p>Privatanleger im deutschsprachigen Raum mit Interesse an Aktien, ETFs, Rohstoffen und Zinsen. Reichweitenzahlen und Nutzerstruktur stellen wir auf Anfrage bereit: ${owner('Mediadaten folgen')}.</p>` },
    { h: 'Formate', html: `<table><thead><tr><th>Format</th><th>Platzierung</th><th>Kennzeichnung</th></tr></thead><tbody><tr><td>Display-Anzeige</td><td>Seitenleiste, zwischen Inhaltsblöcken</td><td>„Anzeige“</td></tr><tr><td>Newsletter-Sponsoring</td><td>Ein Sponsor je Ausgabe von „Börsenblick am Morgen“</td><td>„Anzeige“, eigener Absatz</td></tr><tr><td>Themen-Special</td><td>Redaktionell erstellte Themenseite mit Sponsoring</td><td>„Präsentiert von“, redaktionell unabhängig</td></tr></tbody></table>` },
    { h: 'Was wir nicht anbieten', html: `<ul><li>Keine Affiliate-Links und keine Provisionsmodelle für Depot- oder Produktempfehlungen.</li><li>Keine bezahlten redaktionellen Beiträge ohne Kennzeichnung.</li><li>Keine Werbung für Produkte, die sich an unerfahrene Anleger mit Hebel- oder Totalverlustrisiko richten, ohne Risikohinweis.</li></ul><p>Anfragen: ${owner(L.email)}</p>` },
  ]);

  prosePage('/impressum', 'Impressum', null, [
    { h: 'Angaben gemäß § 5 DDG', html: `<p>${owner(L.company)}<br>${owner(L.street)}<br>${owner(L.city)}</p><p>Vertreten durch: ${owner('[Geschäftsführung / Vorstand]')}<br>Telefon: ${owner(L.phone)}<br>E-Mail: ${owner(L.email)}</p><p>Registereintrag: ${owner(L.register)}<br>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${owner(L.vat)}</p>` },
    { h: 'Verantwortlich für den Inhalt', html: `<p>Verantwortlich im Sinne des § 18 Abs. 2 MStV: ${owner(L.responsible)}, Anschrift wie oben.</p>` },
    { h: 'Haftung für Inhalte', html: `<p>Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte, insbesondere der Kursdaten, übernehmen wir keine Gewähr. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.</p>` },
    { h: 'Keine Anlageberatung', html: `<p>Sämtliche Inhalte dienen ausschließlich der Information und stellen weder eine Anlageberatung noch eine Aufforderung zum Kauf oder Verkauf von Finanzinstrumenten dar. Sie ersetzen keine individuelle Beratung durch einen zugelassenen Berater. Kursdaten sind verzögert (siehe <a href="/methodik">Methodik</a>).</p>` },
    { h: 'Streitbeilegung', html: `<p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: <a href="https://ec.europa.eu/consumers/odr/" rel="noopener">ec.europa.eu/consumers/odr</a>. Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>` },
  ], { kicker: 'Rechtliches', updated: false });

  prosePage('/datenschutz', 'Datenschutzerklärung', 'Diese Website kommt ohne Tracking-Cookies, ohne Werbenetzwerke und ohne Nutzerkonten aus. Hier steht, welche Daten trotzdem anfallen und was mit ihnen passiert.', [
    { h: 'Verantwortlicher', html: `<p>${owner(L.company)}, ${owner(L.street)}, ${owner(L.city)}, E-Mail: ${owner(L.email)}</p>` },
    { h: 'Hosting und Server-Logs', html: `<p>Die Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA, gehostet und über ein weltweites Netzwerk (CDN) ausgeliefert. Beim Aufruf werden technisch notwendig IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser und Referrer verarbeitet, um die Seite auszuliefern und die Sicherheit zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Mit Vercel besteht ein Auftragsverarbeitungsvertrag inklusive EU-Standardvertragsklauseln. ${owner('[Speicherdauer der Logs prüfen und eintragen]')}</p>` },
    { h: 'Schriftarten', html: `<p>Die Schriftarten Inter und Barlow Condensed werden von Google Fonts (Google Ireland Limited) geladen. Dabei wird Ihre IP-Adresse an Google übertragen. Rechtsgrundlage ist unser berechtigtes Interesse an einer einheitlichen Darstellung (Art. 6 Abs. 1 lit. f DSGVO). ${owner('[Optional: Schriften lokal einbinden, dann entfällt dieser Abschnitt]')}</p>` },
    { h: 'Lokale Speicherung im Browser', html: `<p>Für die Merkliste, die Liste zuletzt gelesener Beiträge, Ihre Umfrageantwort und die Bestätigung des Hinweisbanners nutzen wir den lokalen Speicher Ihres Browsers (localStorage). Diese Daten verlassen Ihr Gerät nicht und werden nicht an uns übertragen. Sie können sie jederzeit unter <a href="/cookie-einstellungen">Cookie-Einstellungen</a> oder über Ihren Browser löschen.</p>` },
    { h: 'Newsletter', html: `<p>Wenn Sie den Newsletter abonnieren, verarbeiten wir Ihre E-Mail-Adresse zum Versand (Art. 6 Abs. 1 lit. a DSGVO). Die Anmeldung wird per Double Opt-in bestätigt. Versanddienstleister: ${owner('[Anbieter, Sitz, AVV]')}. Sie können sich jederzeit über den Link in jeder Ausgabe abmelden.</p>` },
    { h: 'Keine Analyse- und Werbetools', html: `<p>Wir setzen keine Webanalyse-Dienste, keine Werbenetzwerke und keine Social-Media-Plugins ein. Externe Inhalte (z. B. Videos) werden nicht eingebettet.</p>` },
    { h: 'Ihre Rechte', html: `<p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht, sich bei einer Aufsichtsbehörde zu beschweren. Zuständig: ${owner('[Landesdatenschutzbehörde]')}.</p>` },
  ], { kicker: 'Rechtliches' });

  prosePage('/nutzungsbedingungen', 'Nutzungsbedingungen', 'Regeln für die Nutzung dieser Website und ihrer Inhalte.', [
    { h: 'Geltungsbereich', html: `<p>Diese Bedingungen gelten für die Nutzung der Website ${config.brand} und aller darüber bereitgestellten Inhalte und Funktionen.</p>` },
    { h: 'Inhalte und Haftung', html: `<p>Alle Inhalte dienen der allgemeinen Information. Sie stellen keine Anlage-, Rechts- oder Steuerberatung dar. Kursdaten sind verzögert und können Fehler enthalten. Anlageentscheidungen treffen Sie auf eigene Verantwortung; eine Haftung für Vermögensschäden aus der Nutzung der Inhalte ist ausgeschlossen, soweit gesetzlich zulässig.</p>` },
    { h: 'Urheberrecht', html: `<p>Texte, Grafiken und die Gestaltung dieser Website sind urheberrechtlich geschützt. Die Nutzung für private, nicht kommerzielle Zwecke ist gestattet. Vervielfältigung, Verbreitung oder automatisiertes Auslesen (Scraping) über den RSS-Feed hinaus bedürfen unserer schriftlichen Zustimmung. Kursdaten unterliegen den Rechten der jeweiligen Börsen und Datenanbieter.</p>` },
    { h: 'Rechner und Werkzeuge', html: `<p>Die Rechner arbeiten mit vereinfachten Modellannahmen und dienen der Orientierung. Für die Richtigkeit der Ergebnisse übernehmen wir keine Gewähr.</p>` },
    { h: 'Änderungen', html: `<p>Wir können diese Bedingungen mit Wirkung für die Zukunft ändern. Es gilt die jeweils veröffentlichte Fassung. Gerichtsstand, soweit zulässig: ${owner('[Sitz des Betreibers]')}.</p>` },
  ], { kicker: 'Rechtliches' });

  {
    const body = html`<div class="container page">
      ${c.breadcrumb([['Cookie-Einstellungen', '/cookie-einstellungen']])}
      <div class="layout"><article class="article"><header class="article-head"><span class="kicker">Rechtliches</span><h1>Cookie-Einstellungen</h1><p class="deck">Diese Website setzt keine Cookies zu Tracking- oder Werbezwecken. Es gibt deshalb nichts einzuwilligen – und nichts abzulehnen. Was wir lokal in Ihrem Browser speichern, sehen Sie hier.</p></header>
        <div class="prose"><table><thead><tr><th>Speicher</th><th>Zweck</th><th>Dauer</th><th>Übertragung</th></tr></thead><tbody><tr><td><code>bb.watchlist</code></td><td>Ihre Merkliste</td><td>bis zum Löschen</td><td>keine</td></tr><tr><td><code>bb.recent</code></td><td>Zuletzt gelesene Beiträge (max. 6)</td><td>bis zum Löschen</td><td>keine</td></tr><tr><td><code>bb.poll.*</code></td><td>Ihre Antwort in der Umfrage</td><td>bis zum Löschen</td><td>keine</td></tr><tr><td><code>bb.cookienote</code></td><td>Hinweisbanner nicht erneut zeigen</td><td>bis zum Löschen</td><td>keine</td></tr></tbody></table><p>Alle Einträge liegen im localStorage Ihres Browsers und werden weder an uns noch an Dritte übertragen. Es werden keine Cookies gesetzt.</p><h2>Lokale Daten löschen</h2><p>Öffnen Sie die Entwicklerwerkzeuge Ihres Browsers (F12) → „Anwendung“ bzw. „Speicher“ → „Lokaler Speicher“ und entfernen Sie die Einträge dieser Website. Oder löschen Sie die Websitedaten über die Datenschutzeinstellungen Ihres Browsers. Die Merkliste können Sie auch direkt auf der <a href="/merkliste">Merklisten-Seite</a> leeren.</p><h2>Externe Dienste</h2><p>Beim Laden der Schriftarten wird Ihre IP-Adresse an Google Fonts übertragen. Details in der <a href="/datenschutz">Datenschutzerklärung</a>.</p></div>
      </article><aside class="no-sticky">${c.sideCard('Rechtliches', html`<ul class="side-list">${[['Impressum', '/impressum'], ['Datenschutz', '/datenschutz'], ['Nutzungsbedingungen', '/nutzungsbedingungen']].map(([l, h]) => html`<li><a href="${h}"><span>${l}</span></a></li>`)}</ul>`)}</aside></div></div>`;
    add('/cookie-einstellungen', 'Cookie-Einstellungen', 'Keine Tracking-Cookies: Was diese Website lokal im Browser speichert und wie Sie es löschen.', body, { kicker: 'Rechtliches' });
  }

  // ---------- 404 ----------
  {
    const body = html`<div class="container notfound"><p class="kicker">Fehler 404</p><h1>Seite nicht gefunden</h1><p>Diese Adresse gibt es nicht oder nicht mehr. Vielleicht hilft die Suche – oder einer dieser Einstiege.</p><form class="filter-bar" role="search" action="/suche" method="get" style="max-width:520px;margin:0 auto 20px"><label class="visually-hidden" for="q-404">Suche</label><div class="control" style="flex:1"><input id="q-404" type="search" name="q" placeholder="Aktie, Index, Begriff …"></div><button class="btn btn-dark" type="submit">Suchen</button></form><div class="chips" style="justify-content:center"><a class="chip" href="/">Startseite</a><a class="chip" href="/nachrichten">Nachrichten</a><a class="chip" href="/kurs/dax">DAX</a><a class="chip" href="/aktien">Aktien A–Z</a><a class="chip" href="/termine/wirtschaftskalender">Wirtschaftskalender</a><a class="chip" href="/wissen">Börsenwissen</a></div></div>`;
    pages.push({ path: '/404', html: layout.page({ title: 'Seite nicht gefunden', description: 'Die angeforderte Seite existiert nicht.', path: '/404', body, noindex: true }) });
  }
  return pages;
};
