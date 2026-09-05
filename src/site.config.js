'use strict';
// Zentrale Site-Konfiguration. Markenname hier ändern → überall aktualisiert.

module.exports = {
  brand: 'Börsenblick',            // Arbeitstitel – siehe README (Namensvorschläge)
  brandShort: 'Börsenblick',
  domain: 'https://boersenblick.vercel.app',
  claim: 'Börse verstehen. Märkte im Blick.',
  description: 'Aktuelle Börsennachrichten, DAX-Kurse, Analysen, Wirtschaftskalender und Börsenwissen – klar erklärt, auf den Punkt.',
  lang: 'de',
  locale: 'de-DE',
  timezone: 'Europe/Berlin',
  tzLabel: 'MESZ',
  newsroom: 'Redaktion',
  legal: {
    company: '[Firmenname und Rechtsform]',
    street: '[Straße und Hausnummer]',
    city: '[PLZ Ort]',
    email: '[E-Mail-Adresse]',
    phone: '[Telefonnummer]',
    responsible: '[Verantwortlich i. S. d. § 18 Abs. 2 MStV]',
    vat: '[USt-IdNr.]',
    register: '[Registergericht, Registernummer]',
  },
  // Snapshot-Zeitpunkt der statischen Kurse (wird im UI als "Stand" angezeigt)
  quotesAsOf: '2026-09-04T17:35:00+02:00',
};
