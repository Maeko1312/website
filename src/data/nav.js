'use strict';
// Navigation (Mega-Menü, Mobilmenü, Footer). Jeder Link muss auf eine gebaute Seite zeigen –
// build.js prüft das und bricht bei toten Links ab.

const nav = [
  {
    label: 'Märkte', href: '/maerkte', key: 'maerkte', cols: 3,
    groups: [
      { title: 'Überblick', links: [
        ['Marktüberblick', '/maerkte'],
        ['Indizes', '/indizes'],
        ['Aktien A–Z', '/aktien'],
        ['Rankings', '/rankings'],
      ] },
      { title: 'Deutschland', links: [
        ['DAX', '/kurs/dax'],
        ['MDAX', '/kurs/mdax'],
        ['SDAX', '/kurs/sdax'],
        ['TecDAX', '/kurs/tecdax'],
      ] },
      { title: 'Weitere Anlageklassen', links: [
        ['Rohstoffe', '/rohstoffe'],
        ['Devisen', '/devisen'],
        ['Kryptowährungen', '/krypto'],
        ['Anleihen & Zinsen', '/anleihen'],
      ] },
    ],
    feature: 'quotes',
  },
  {
    label: 'Nachrichten', href: '/nachrichten', key: 'nachrichten', cols: 2,
    groups: [
      { title: 'Ressorts', links: [
        ['Alle Nachrichten', '/nachrichten'],
        ['Marktberichte', '/nachrichten/marktberichte'],
        ['Unternehmen', '/nachrichten/unternehmen'],
        ['Wirtschaft & Konjunktur', '/nachrichten/wirtschaft'],
        ['Zentralbanken & Zinsen', '/nachrichten/zentralbanken'],
      ] },
      { title: 'Weitere Themen', links: [
        ['Rohstoffe & Energie', '/nachrichten/rohstoffe'],
        ['Kryptowährungen', '/nachrichten/krypto'],
        ['Analystenstimmen', '/nachrichten/analystenstimmen'],
        ['Newsletter', '/newsletter'],
        ['RSS-Feed', '/feed.xml'],
      ] },
    ],
    feature: 'latest',
  },
  {
    label: 'Analysen', href: '/analysen', key: 'analysen', cols: 2,
    groups: [
      { title: 'Technische Analyse', links: [
        ['Alle Analysen', '/analysen'],
        ['Indizes', '/analysen/indizes'],
        ['Aktien', '/analysen/aktien'],
        ['Rohstoffe & Devisen', '/analysen/rohstoffe-devisen'],
      ] },
      { title: 'Produkte & Strategie', links: [
        ['ETF', '/analysen/etf'],
        ['Hebelprodukte', '/analysen/hebelprodukte'],
        ['Chartanalyse lernen', '/wissen/chartanalyse'],
        ['Anlagestrategien', '/wissen/strategien'],
      ] },
    ],
    feature: 'analysis',
  },
  {
    label: 'Termine', href: '/termine/wirtschaftskalender', key: 'termine', cols: 2,
    groups: [
      { title: 'Kalender', links: [
        ['Wirtschaftskalender', '/termine/wirtschaftskalender'],
        ['Unternehmenstermine', '/termine/unternehmen'],
        ['Börsengänge (IPOs)', '/termine/ipos'],
      ] },
      { title: 'Für Anleger', links: [
        ['Dividendenkalender', '/termine/dividenden'],
        ['Hauptversammlungen', '/termine/hauptversammlungen'],
        ['Börsenfeiertage', '/termine/boersenfeiertage'],
      ] },
    ],
    feature: 'events',
  },
  {
    label: 'Rankings', href: '/rankings', key: 'rankings',
  },
  {
    label: 'Wissen', href: '/wissen', key: 'wissen', cols: 3,
    groups: [
      { title: 'Einstieg', links: [
        ['Börsenwissen – Übersicht', '/wissen'],
        ['Börse für Einsteiger', '/wissen/einsteiger'],
        ['Depot & Broker wählen', '/wissen/broker'],
        ['ETF & Sparplan', '/wissen/etf-sparplan'],
      ] },
      { title: 'Vertiefung', links: [
        ['Chartanalyse', '/wissen/chartanalyse'],
        ['Anlagestrategien', '/wissen/strategien'],
        ['Kennzahlen verstehen', '/wissen/kennzahlen'],
        ['Steuern auf Kapitalerträge', '/wissen/steuern'],
      ] },
      { title: 'Nachschlagen', links: [
        ['Börsenlexikon', '/wissen/boersenlexikon'],
        ['Handelszeiten', '/wissen/handelszeiten'],
        ['Über die Redaktion', '/redaktion'],
      ] },
    ],
  },
  {
    label: 'Werkzeuge', href: '/werkzeuge', key: 'werkzeuge', cols: 2,
    groups: [
      { title: 'Rechner', links: [
        ['Alle Rechner', '/werkzeuge'],
        ['Zinseszinsrechner', '/werkzeuge/zinseszinsrechner'],
        ['Sparplanrechner', '/werkzeuge/sparplanrechner'],
        ['Renditerechner', '/werkzeuge/renditerechner'],
      ] },
      { title: 'Weitere', links: [
        ['Dividendenrechner', '/werkzeuge/dividendenrechner'],
        ['Währungsrechner', '/werkzeuge/waehrungsrechner'],
        ['Positionsgrößenrechner', '/werkzeuge/positionsgroessenrechner'],
        ['Inflationsrechner', '/werkzeuge/inflationsrechner'],
        ['Merkliste', '/merkliste'],
      ] },
    ],
  },
];

const footer = [
  { title: 'Märkte', links: [['Marktüberblick', '/maerkte'], ['DAX', '/kurs/dax'], ['Indizes', '/indizes'], ['Aktien A–Z', '/aktien'], ['Rohstoffe', '/rohstoffe'], ['Devisen', '/devisen'], ['Krypto', '/krypto'], ['Anleihen & Zinsen', '/anleihen'], ['Rankings', '/rankings']] },
  { title: 'Nachrichten', links: [['Alle Nachrichten', '/nachrichten'], ['Marktberichte', '/nachrichten/marktberichte'], ['Unternehmen', '/nachrichten/unternehmen'], ['Wirtschaft', '/nachrichten/wirtschaft'], ['Zentralbanken', '/nachrichten/zentralbanken'], ['Analysen', '/analysen'], ['Newsletter', '/newsletter'], ['RSS-Feed', '/feed.xml']] },
  { title: 'Termine & Wissen', links: [['Wirtschaftskalender', '/termine/wirtschaftskalender'], ['Unternehmenstermine', '/termine/unternehmen'], ['Dividendenkalender', '/termine/dividenden'], ['Börsenfeiertage', '/termine/boersenfeiertage'], ['Börse für Einsteiger', '/wissen/einsteiger'], ['Börsenlexikon', '/wissen/boersenlexikon'], ['Rechner', '/werkzeuge'], ['Merkliste', '/merkliste']] },
  { title: 'Über uns', links: [['Über Börsenblick', '/ueber-uns'], ['Redaktion', '/redaktion'], ['Redaktionelle Leitlinien', '/redaktionelle-leitlinien'], ['Methodik & Datenquellen', '/methodik'], ['Kontakt', '/kontakt'], ['Werben', '/werben'], ['Impressum', '/impressum'], ['Datenschutz', '/datenschutz']] },
];

const legal = [['Impressum', '/impressum'], ['Datenschutz', '/datenschutz'], ['Nutzungsbedingungen', '/nutzungsbedingungen'], ['Cookie-Einstellungen', '/cookie-einstellungen'], ['Kontakt', '/kontakt']];

module.exports = { nav, footer, legal };
