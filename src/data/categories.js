'use strict';
const list = [
  { slug: 'marktberichte', name: 'Marktberichte', kind: 'news', description: 'Wie der Handelstag lief: DAX, MDAX, Wall Street, Rohstoffe und Devisen im Überblick.' },
  { slug: 'unternehmen', name: 'Unternehmen', kind: 'news', description: 'Meldungen zu Unternehmen und Branchen – inklusive gekennzeichneter Beiträge, die im Auftrag von Unternehmen erscheinen.' },
  { slug: 'wirtschaft', name: 'Wirtschaft & Konjunktur', kind: 'news', description: 'Konjunkturdaten, Inflation, Arbeitsmarkt und was die Zahlen für die Börse bedeuten.' },
  { slug: 'zentralbanken', name: 'Zentralbanken & Zinsen', kind: 'news', description: 'EZB, Fed, Anleiherenditen und Leitzinsen – klar erklärt.' },
  { slug: 'rohstoffe', name: 'Rohstoffe & Energie', kind: 'news', description: 'Gold, Öl, Kupfer und Erdgas: Preise, Treiber und Hintergründe.' },
  { slug: 'krypto', name: 'Kryptowährungen', kind: 'news', description: 'Bitcoin, Ethereum und Co.: Kurse, Marktstruktur und Regulierung.' },
  { slug: 'analysen', name: 'Analysen', kind: 'news', description: 'Chartanalysen zu Indizes, Rohstoffen und Devisen sowie Einordnungen zu ETF und Hebelprodukten – mit klaren Marken und ohne Kaufempfehlung.' },
  { slug: 'analystenstimmen', name: 'Analystenstimmen', kind: 'news', description: 'Kursziele, Einstufungen und wie man Analystenschätzungen richtig liest.' },
];
module.exports = { list, bySlug: Object.fromEntries(list.map(c => [c.slug, c])), news: list.filter(c => c.kind === 'news'), analysis: list.filter(c => c.kind === 'analysis') };
