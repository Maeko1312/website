'use strict';
// Platzhalter-Redaktion. Namen und Profile sind fiktiv und werden durch das echte Team ersetzt.
const list = [
  { slug: 'redaktion', name: 'Börsenblick-Redaktion', initials: 'BB', role: 'Redaktion', focus: 'Marktberichte und Kurse', bio: 'Die Redaktion fasst Kursbewegungen und Termine zusammen. Marktberichte basieren auf den offiziellen Schlusskursen.', placeholder: false },
  { slug: 'lena-hartmann', name: 'Lena Hartmann', initials: 'LH', role: 'Leitende Redakteurin Märkte', focus: 'DAX, europäische Aktien, Konjunktur', bio: 'Beobachtet seit über zehn Jahren den deutschen Aktienmarkt und erklärt, was hinter den Kursbewegungen steckt.', placeholder: true },
  { slug: 'jonas-weber', name: 'Jonas Weber', initials: 'JW', role: 'Redakteur Technische Analyse', focus: 'Charttechnik, Indizes, Rohstoffe', bio: 'Zertifizierter technischer Analyst. Schreibt die täglichen Chartanalysen zu DAX, Gold und Bitcoin.', placeholder: true },
  { slug: 'miriam-koch', name: 'Miriam Koch', initials: 'MK', role: 'Redakteurin Unternehmen', focus: 'DAX-Konzerne, Bilanzen, Dividenden', bio: 'Diplom-Kauffrau, früher im Equity Research. Nimmt Geschäftsberichte und Kennzahlen auseinander.', placeholder: true },
  { slug: 'david-brandt', name: 'David Brandt', initials: 'DB', role: 'Redakteur Geldpolitik & Anleihen', focus: 'EZB, Fed, Zinsen, Anleihen', bio: 'Volkswirt mit Schwerpunkt Geldpolitik. Erklärt Zinsentscheidungen und ihre Folgen für Anleger.', placeholder: true },
  { slug: 'sara-yilmaz', name: 'Sara Yilmaz', initials: 'SY', role: 'Redakteurin Börsenwissen', focus: 'Einsteiger, ETF, Steuern', bio: 'Schreibt die Ratgeber und das Börsenlexikon – verständlich, ohne Fachchinesisch.', placeholder: true },
];
module.exports = { list, bySlug: Object.fromEntries(list.map(a => [a.slug, a])) };
