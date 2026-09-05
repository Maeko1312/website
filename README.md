# Börsenblick – statische Finanz-Nachrichtenseite

Deutschsprachiges Finanzportal (Nachrichten, Kurse, Analysen, Termine, Wissen, Rechner), gebaut als **rein statische Website** für Vercel. Kein Framework, keine npm-Abhängigkeiten, kein Backend, kein Live-Datenabruf im Browser.

**Arbeitstitel:** „Börsenblick“. Der Name ist an einer Stelle hinterlegt (`src/site.config.js`, außerdem das Wortmarken-Markup in `src/render/layout.js`) und lässt sich in wenigen Minuten austauschen. Namensvorschläge siehe unten.

## Schnellstart

```bash
node build.js            # baut alle Seiten nach dist/
node scripts/serve.js dist 3210   # lokale Vorschau mit Vercel-artigen Clean-URLs
```

Node 18 oder neuer, sonst nichts. Der Build dauert etwa eine Sekunde und erzeugt rund 210 Seiten.

## Deployment auf Vercel

Repository importieren, fertig. `vercel.json` setzt Build-Kommando (`node build.js`) und Ausgabeordner (`dist`), aktiviert Clean-URLs (`/kurs/dax` statt `/kurs/dax.html`), lange Caching-Header für `/assets/` und ein paar Sicherheitsheader. `404.html` wird von Vercel automatisch für unbekannte Pfade ausgeliefert.

**Empfehlung:** einen täglichen Rebuild einrichten (Vercel Deploy Hook per Cron, z. B. GitHub Actions um 6:00 Uhr). Artikel-Zeitstempel, Kalenderwochen und „heute/gestern“ werden relativ zum Build-Datum erzeugt – bei täglichem Build wirkt die Seite immer aktuell.

## Aufbau

```
build.js                  Build-Skript: rendert Seiten, kopiert Assets, schreibt Sitemap, RSS, Suchindex
src/site.config.js        Markenname, Claim, Domain, Impressumsdaten, Kurs-Stichtag
src/data/
  instruments.js          Instrumente-Universum (10 Indizes, 40 DAX + 20 MDAX, 7 Rohstoffe, 6 Devisen, 3 Krypto, 3 Renditen)
  market-snapshot.json    Kurse und Kennzahlen (echter Snapshot, statisch eingebettet)
  history.json            Tagesschlusskurse 1 Jahr je Instrument (für die SVG-Charts)
  articles.js             Artikel – datengetrieben (aus Kursen erzeugt) + redaktionelle Erklärstücke
  calendar.js             Börsenfeiertage 2026 (echt), Wirtschaftskalender (Regeln), Unternehmenstermine (Platzhalter)
  glossary.js             Börsenlexikon, ~75 Begriffe
  guides.js               Ratgeber (Börsenwissen), 8 Stück
  blog.js                 Blog-Beiträge (18) mit Themen
  ipos.js                 Börsengänge (Platzhalter, klar gekennzeichnet)
  categories.js, authors.js, nav.js, content.js
src/render/
  layout.js               Seitenhülle: Kopf, Mega-Menü, Marktleiste, Mobilmenü, Fußzeile, <head>
  components.js           Wiederverwendbare Bausteine (Kurstabellen, Nachrichtenlisten, Sidebar-Karten …)
  charts.js               Statische SVG-Charts (Linie, Sparkline, Balken, 52-Wochen-Spanne)
src/pages/*.js            Seitenmodule: home, news, blog, markets, quote, calendar, rankings, knowledge, tools, misc
src/assets/               styles.css, app.js, favicon.svg  → dist/assets/
src/public/               robots.txt, manifest.webmanifest → dist/
scripts/fetch-market-data.js   Aktualisiert Snapshot + Historie (manuell, siehe unten)
scripts/serve.js          Lokaler Vorschau-Server
```

## Ziel: Newsletter-Anmeldungen

Der Newsletter „Börsenblick am Morgen“ ist das Konversionsziel. Bausteine:

- **Formulare** überall (Startseiten-Banner, Sidebar, in jedem Artikel/Blogpost nach dem zweiten Absatz, am Ende jedes Beitrags, Newsletter-Seite).
- **Slide-in-Leiste** auf Lese-Seiten nach 45 % Scrolltiefe; nach Schließen sieben Tage Ruhe.
- **Exit-Intent-Dialog** (Desktop), wenn der Mauszeiger die Seite nach oben verlässt; einmal pro Woche, nie nach erfolgter Anmeldung.
- **Versanddienst anbinden:** in `src/site.config.js` `newsletterAction` auf die POST-URL des Anbieters setzen (Brevo, Mailchimp, Buttondown, ConvertKit …) und `newsletterEmailField` auf den erwarteten Feldnamen (z. B. `EMAIL` bei Mailchimp). Dankeseite: `/newsletter/danke` (beim Anbieter als Redirect eintragen). Solange `newsletterAction` leer ist, zeigt jedes Formular einen ehrlichen Hinweis statt zu senden.
- **Blog** (`src/data/blog.js`): evergreen Beiträge mit Themen-Filter, „Das Wichtigste in einem Satz“, Inhaltsverzeichnis und Newsletter-CTAs; erscheint im RSS-Feed und in der Suche. Neue Beiträge = neues Objekt im Array.

## Seiten

| Bereich | Pfade |
| --- | --- |
| Start | `/` |
| Nachrichten | `/nachrichten`, `/nachrichten/<ressort>` (7 Ressorts), `/artikel/<slug>` |
| Analysen | `/analysen`, `/analysen/<kategorie>` (5) |
| Blog | `/blog`, `/blog/thema/<thema>` (10), `/blog/<slug>` (18 Beiträge) |
| Märkte | `/maerkte`, `/indizes`, `/aktien`, `/rohstoffe`, `/devisen`, `/krypto`, `/anleihen`, `/rankings` |
| Kursseiten | `/kurs/<slug>` für alle 89 Instrumente (Chart 1M/3M/6M/1J, Kennzahlen, Historie, Peers/Mitglieder, Umrechnungen) |
| Termine | `/termine/wirtschaftskalender`, `/termine/unternehmen`, `/termine/dividenden`, `/termine/hauptversammlungen`, `/termine/boersenfeiertage`, `/termine/ipos`, `/ipo/<slug>` |
| Wissen | `/wissen`, `/wissen/<ratgeber>` (8), `/wissen/boersenlexikon` |
| Werkzeuge | `/werkzeuge`, 7 Rechner unter `/werkzeuge/<rechner>`, `/merkliste` |
| Sonstiges | `/suche`, `/newsletter`, `/newsletter/danke`, `/ueber-uns`, `/redaktion`, `/redaktionelle-leitlinien`, `/methodik`, `/kontakt`, `/werben`, `/impressum`, `/datenschutz`, `/nutzungsbedingungen`, `/cookie-einstellungen`, `404` |
| Dateien | `/feed.xml` (RSS), `/sitemap.xml`, `/search-index.json`, `/instruments.json` |

Der Build prüft jeden internen Link gegen die erzeugten Seiten und bricht bei toten Links ab.

## Daten: echt, aber statisch

Alle Kurse, Kennzahlen (KGV, Dividendenrendite, Marktkapitalisierung, 52-Wochen-Spanne, gleitende Durchschnitte, RSI, Performance) und die Chart-Historie sind **echte Marktdaten**, einmalig abgerufen und als JSON eingebettet. Die Website lädt zur Laufzeit nichts nach. Der Stichtag steht in `site.config.js` (`quotesAsOf`) und wird überall als „Stand …“ angezeigt.

Aktualisieren:

```bash
node scripts/fetch-market-data.js   # schreibt market-snapshot.json + history.json neu
```

Danach `quotesAsOf` in `site.config.js` anpassen und neu bauen. Quellen: TradingView-Scanner (Kurse/Kennzahlen, ohne API-Key) und Yahoo-Finance-Chart-API (Tagesschlusskurse). Beides sind inoffizielle Endpunkte – für den Produktivbetrieb ist ein lizenzierter Datenanbieter vorgesehen; die Datenstruktur (`market-snapshot.json`, `history.json`) bleibt dieselbe.

## Was Platzhalter ist (und so gekennzeichnet)

- **Unternehmenstermine** (Quartalszahlen, HV, Ex-Tage): aus typischen Berichtsfenstern abgeleitet, Badge „Beispielinhalt“, Hinweis „voraussichtlich“.
- **Börsengänge**: erfundene Firmen, Badge „Beispielinhalt“, Seiten `noindex`.
- **Redaktion**: Namen und Profile fiktiv.
- **Impressum/Datenschutz/Kontakt**: Angaben in eckigen Klammern (`[Firmenname …]`) in `site.config.js` → `legal` ausfüllen.
- **Newsletter**: Formular vorhanden; ohne verbundenen Versanddienst zeigt es einen ehrlichen Hinweis plus RSS-Alternative. Versanddienst-URL im `action`-Attribut der Formulare (`components.js`, `newsletterBox`) eintragen.
- **Umfrage**: Startwerte statisch, Antwort wird lokal gespeichert.

Datengetriebene Artikel (Marktberichte, Aktien-Checks, Chartanalysen, Rohstoff-/Kryptomeldungen) sind keine Platzhalter im engeren Sinn: Sie werden nach dokumentierten Regeln (siehe `/methodik`) aus den echten Schlusskursen erzeugt und tragen das Badge „Datenbasiert“.

## CMS-Anbindung später

Artikel, Kategorien, Autoren, Ratgeber, Lexikon, Termine und IPOs sind reine JS/JSON-Datenstrukturen in `src/data/`. Ein CMS (Webflow, Contentful, Sanity, Markdown im Repo …) muss nur dieselben Objekte liefern; die Seitenmodule bleiben unverändert.

## Namensvorschläge (statt Arbeitstitel „Börsenblick“)

1. **Börsenblick** – klar, deutsch, sofort verständlich; Wortmarke „BÖRSEN|BLICK“ funktioniert schon.
2. **Kursradar** – technischer, passt zu Analysen und Rankings.
3. **Marktkompass** – wertiger, „Orientierung“ als Versprechen.

Domainverfügbarkeit ist nicht geprüft.

## Konventionen

- Sprache Deutsch, Sie-Ansprache. Zahlen im Format `1.234,56`, Datum `04.09.2026`, Zeiten 24 h mit „Uhr“ (MEZ/MESZ). Einheiten metrisch (g, kg, l, kWh) neben den Weltmarkteinheiten.
- Grün = Plus, Rot = Minus. Prozentvorzeichen `+`/`−` (echtes Minuszeichen).
- Keine Login-, Konto- oder Bezahlfunktionen. Merkliste, zuletzt gelesene Artikel und Umfrage laufen nur im Browser (localStorage), keine Cookies.
- Externe Ressourcen: nur Google Fonts (Inter, Barlow Condensed). Optional lokal einbinden, dann Datenschutz-Abschnitt anpassen.
