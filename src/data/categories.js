'use strict';
const list = [
  { slug: 'marktberichte', name: 'Marktberichte', kind: 'news', description: 'Wie der Handelstag lief: DAX, MDAX, Wall Street, Gewinner und Verlierer – kompakt und mit den echten Schlusskursen.' },
  { slug: 'unternehmen', name: 'Unternehmen', kind: 'news', description: 'Aktien im Check: Bewertung, Dividende, Kursentwicklung und was Anleger über DAX- und MDAX-Konzerne wissen sollten.' },
  { slug: 'wirtschaft', name: 'Wirtschaft & Konjunktur', kind: 'news', description: 'Konjunkturdaten, Inflation, Arbeitsmarkt und was die Zahlen für die Börse bedeuten.' },
  { slug: 'zentralbanken', name: 'Zentralbanken & Zinsen', kind: 'news', description: 'EZB, Fed, Anleiherenditen und Leitzinsen – klar erklärt.' },
  { slug: 'rohstoffe', name: 'Rohstoffe & Energie', kind: 'news', description: 'Gold, Öl, Kupfer und Erdgas: Preise, Treiber und Hintergründe.' },
  { slug: 'krypto', name: 'Kryptowährungen', kind: 'news', description: 'Bitcoin, Ethereum und Co.: Kurse, Marktstruktur und Regulierung.' },
  { slug: 'analystenstimmen', name: 'Analystenstimmen', kind: 'news', description: 'Kursziele, Einstufungen und wie man Analystenschätzungen richtig liest.' },
  { slug: 'analysen-indizes', name: 'Indizes', kind: 'analysis', description: 'Technische Analysen zu DAX, MDAX, EURO STOXX 50, S&P 500 und Nasdaq 100.' },
  { slug: 'analysen-aktien', name: 'Aktien', kind: 'analysis', description: 'Charttechnische Einschätzungen zu deutschen Standard- und Nebenwerten.' },
  { slug: 'analysen-rohstoffe-devisen', name: 'Rohstoffe & Devisen', kind: 'analysis', description: 'Gold, Öl, EUR/USD und Bitcoin aus charttechnischer Sicht.' },
  { slug: 'analysen-etf', name: 'ETF', kind: 'analysis', description: 'Indexfonds im Fokus: Auswahl, Kosten und Strategien.' },
  { slug: 'analysen-hebelprodukte', name: 'Hebelprodukte', kind: 'analysis', description: 'Optionsscheine, Knock-outs und Faktor-Zertifikate: Chancen, Risiken, Funktionsweise.' },
];
module.exports = { list, bySlug: Object.fromEntries(list.map(c => [c.slug, c])), news: list.filter(c => c.kind === 'news'), analysis: list.filter(c => c.kind === 'analysis') };
