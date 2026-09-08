'use strict';
// Instrumente-Universum: bewusst klein (Indizes, Rohstoffe, Devisen, Krypto, Anleihen) – keine Einzelaktien,
// damit die Seite ohne teuren Datenfeed und ohne tägliche Pflege auskommt. Kurse/Historie kommen aus market-snapshot.json + history.json
// (einmalig per scripts/fetch-market-data.js erzeugt, statisch eingebettet).
// tv = TradingView-Symbol (Snapshot), yahoo = Yahoo-Symbol (Historie).

const indices = [
  { slug: 'dax', name: 'DAX', type: 'index', tv: 'XETR:DAX', yahoo: '^GDAXI', isin: 'DE0008469008', exchange: 'Xetra', currency: 'EUR', unit: 'Punkte', region: 'Deutschland',
    blurb: 'Der DAX bündelt die 40 größten und liquidesten Aktien des deutschen Aktienmarkts. Er wird als Performanceindex berechnet, Dividenden fließen also in den Indexstand ein.' },
  { slug: 'mdax', name: 'MDAX', type: 'index', tv: 'XETR:MDAX', yahoo: '^MDAXI', isin: 'DE0008467416', exchange: 'Xetra', currency: 'EUR', unit: 'Punkte', region: 'Deutschland',
    blurb: 'Der MDAX umfasst die 50 Unternehmen, die nach Marktkapitalisierung und Börsenumsatz auf die DAX-Werte folgen – das deutsche Mittelfeld der Börse.' },
  { slug: 'sdax', name: 'SDAX', type: 'index', tv: null, yahoo: '^SDAXI', isin: 'DE0009653386', exchange: 'Xetra', currency: 'EUR', unit: 'Punkte', region: 'Deutschland',
    blurb: 'Der SDAX enthält 70 kleinere Unternehmen unterhalb des MDAX. Er gilt als Gradmesser für den deutschen Nebenwertemarkt.' },
  { slug: 'tecdax', name: 'TecDAX', type: 'index', tv: null, yahoo: '^TECDAX', isin: 'DE0007203275', exchange: 'Xetra', currency: 'EUR', unit: 'Punkte', region: 'Deutschland',
    blurb: 'Der TecDAX fasst die 30 größten Technologiewerte unterhalb des DAX zusammen – von Halbleitern bis Software.' },
  { slug: 'euro-stoxx-50', name: 'EURO STOXX 50', type: 'index', tv: 'TVC:SX5E', yahoo: '^STOXX50E', isin: 'EU0009658145', exchange: 'STOXX', currency: 'EUR', unit: 'Punkte', region: 'Eurozone',
    blurb: 'Der EURO STOXX 50 ist der Leitindex der Eurozone mit 50 Standardwerten aus elf Ländern.' },
  { slug: 'sp-500', name: 'S&P 500', type: 'index', tv: 'SP:SPX', yahoo: '^GSPC', isin: 'US78378X1072', exchange: 'NYSE/Nasdaq', currency: 'USD', unit: 'Punkte', region: 'USA',
    blurb: 'Der S&P 500 bildet die 500 größten börsennotierten US-Unternehmen ab und gilt als wichtigster Aktienindex der Welt.' },
  { slug: 'nasdaq-100', name: 'Nasdaq 100', type: 'index', tv: 'NASDAQ:NDX', yahoo: '^NDX', isin: 'US6311011026', exchange: 'Nasdaq', currency: 'USD', unit: 'Punkte', region: 'USA',
    blurb: 'Der Nasdaq 100 enthält die 100 größten Nicht-Finanzwerte der Nasdaq – stark geprägt von Technologie- und Wachstumsunternehmen.' },
  { slug: 'dow-jones', name: 'Dow Jones', type: 'index', tv: 'DJ:DJI', yahoo: '^DJI', isin: 'US2605661048', exchange: 'NYSE', currency: 'USD', unit: 'Punkte', region: 'USA',
    blurb: 'Der Dow Jones Industrial Average ist der älteste US-Aktienindex und umfasst 30 Standardwerte. Er wird preisgewichtet berechnet.' },
  { slug: 'nikkei-225', name: 'Nikkei 225', type: 'index', tv: 'TVC:NI225', yahoo: '^N225', isin: 'XC0009692440', exchange: 'Tokio', currency: 'JPY', unit: 'Punkte', region: 'Japan',
    blurb: 'Der Nikkei 225 ist der bekannteste japanische Aktienindex und wird wie der Dow Jones preisgewichtet berechnet.' },
  { slug: 'vix', name: 'VIX', type: 'index', tv: 'TVC:VIX', yahoo: '^VIX', isin: null, exchange: 'CBOE', currency: 'USD', unit: 'Punkte', region: 'USA',
    blurb: 'Der VIX misst die erwartete Schwankungsbreite des S&P 500 für die nächsten 30 Tage – das „Angstbarometer“ der Wall Street.' },
];

const commodities = [
  { slug: 'gold', name: 'Gold', type: 'commodity', tv: 'TVC:GOLD', yahoo: 'GC=F', exchange: 'Spot', currency: 'USD', unit: 'US-$/Feinunze', unitMetric: '1 Feinunze = 31,1035 g',
    blurb: 'Gold gilt als Krisenwährung und Inflationsschutz. Der Preis wird in US-Dollar je Feinunze notiert.' },
  { slug: 'silber', name: 'Silber', type: 'commodity', tv: 'TVC:SILVER', yahoo: 'SI=F', exchange: 'Spot', currency: 'USD', unit: 'US-$/Feinunze', unitMetric: '1 Feinunze = 31,1035 g',
    blurb: 'Silber ist Edel- und Industriemetall zugleich – gefragt in Solarzellen, Elektronik und als Anlage.' },
  { slug: 'platin', name: 'Platin', type: 'commodity', tv: 'TVC:PLATINUM', yahoo: 'PL=F', exchange: 'Spot', currency: 'USD', unit: 'US-$/Feinunze', unitMetric: '1 Feinunze = 31,1035 g',
    blurb: 'Platin wird vor allem in Katalysatoren, in der Schmuckindustrie und in der Wasserstoffwirtschaft eingesetzt.' },
  { slug: 'kupfer', name: 'Kupfer', type: 'commodity', tv: 'COMEX:HG1!', yahoo: 'HG=F', exchange: 'COMEX', currency: 'USD', unit: 'US-$/lb', unitMetric: '1 lb = 453,6 g',
    blurb: 'Kupfer gilt als „Dr. Copper“: Sein Preis spiegelt die Nachfrage aus Bau, Elektrifizierung und Industrie.' },
  { slug: 'brent', name: 'Brent-Öl', type: 'commodity', tv: 'ICEEUR:BRN1!', yahoo: 'BZ=F', exchange: 'ICE', currency: 'USD', unit: 'US-$/Barrel', unitMetric: '1 Barrel = 158,99 l',
    blurb: 'Brent ist die Referenzsorte für Rohöl aus der Nordsee und der wichtigste Ölpreis für Europa.' },
  { slug: 'wti', name: 'WTI-Öl', type: 'commodity', tv: 'NYMEX:CL1!', yahoo: 'CL=F', exchange: 'NYMEX', currency: 'USD', unit: 'US-$/Barrel', unitMetric: '1 Barrel = 158,99 l',
    blurb: 'West Texas Intermediate ist die US-Referenzsorte für leichtes, schwefelarmes Rohöl.' },
  { slug: 'erdgas', name: 'Erdgas (Henry Hub)', type: 'commodity', tv: 'NYMEX:NG1!', yahoo: 'NG=F', exchange: 'NYMEX', currency: 'USD', unit: 'US-$/MMBtu', unitMetric: '1 MMBtu ≈ 293 kWh', contract: 'Front-Month-Future (NYMEX)', rollRule: 'nymex-ng', priceKind: 'Terminkontrakt (Future) – kein Spotpreis', kwhPerUnit: 293.071, benchmarkNote: 'US-Referenzpreis; für Europa ist der TTF (Niederlande) maßgeblich',
    blurb: 'Henry Hub ist der US-Referenzpreis für Erdgas. Für Europa ist zusätzlich der niederländische TTF-Preis maßgeblich.' },
  { slug: 'uran', name: 'Uran (Sprott-Trust)', type: 'commodity', tv: 'TSX:U.UN', yahoo: 'U-UN.TO', exchange: 'Toronto (TSX)', currency: 'CAD', unit: 'CAD je Anteil', unitMetric: 'Anteil am physisch gelagerten Uran (U3O8)', priceKind: 'Anteilspreis des Trusts', benchmarkNote: 'Für Uran gibt es keinen frei verfügbaren Spotpreis; der Trust hält physisches Uran, sein Anteilspreis folgt dem Uranpreis mit Auf- oder Abschlag.',
    blurb: 'Uran wird nicht an einer öffentlichen Börse gehandelt. Als Näherung für den Uranpreis dient der Sprott Physical Uranium Trust, der physisches Uranoxid (U3O8) lagert; sein Anteilspreis in kanadischen Dollar folgt dem Spotmarkt.' },
];

const fx = [
  { slug: 'eur-usd', name: 'Euro / US-Dollar', short: 'EUR/USD', type: 'fx', tv: 'FX:EURUSD', yahoo: 'EURUSD=X', currency: 'USD', unit: 'US-$', blurb: 'Das meistgehandelte Währungspaar der Welt. Ein steigender Kurs bedeutet einen stärkeren Euro.' },
  { slug: 'eur-gbp', name: 'Euro / Britisches Pfund', short: 'EUR/GBP', type: 'fx', tv: 'FX:EURGBP', yahoo: 'EURGBP=X', currency: 'GBP', unit: '£', blurb: 'Kurs des Euro gegenüber dem britischen Pfund.' },
  { slug: 'eur-chf', name: 'Euro / Schweizer Franken', short: 'EUR/CHF', type: 'fx', tv: 'FX:EURCHF', yahoo: 'EURCHF=X', currency: 'CHF', unit: 'CHF', blurb: 'Kurs des Euro gegenüber dem Schweizer Franken, der als sicherer Hafen gilt.' },
  { slug: 'eur-jpy', name: 'Euro / Japanischer Yen', short: 'EUR/JPY', type: 'fx', tv: 'FX:EURJPY', yahoo: 'EURJPY=X', currency: 'JPY', unit: '¥', blurb: 'Kurs des Euro gegenüber dem japanischen Yen.' },
  { slug: 'gbp-usd', name: 'Britisches Pfund / US-Dollar', short: 'GBP/USD', type: 'fx', tv: 'FX:GBPUSD', yahoo: 'GBPUSD=X', currency: 'USD', unit: 'US-$', blurb: 'Das „Cable“ – Kurs des Pfund gegenüber dem US-Dollar.' },
  { slug: 'usd-jpy', name: 'US-Dollar / Japanischer Yen', short: 'USD/JPY', type: 'fx', tv: 'FX:USDJPY', yahoo: 'USDJPY=X', currency: 'JPY', unit: '¥', blurb: 'Kurs des US-Dollar gegenüber dem japanischen Yen.' },
];

const crypto = [
  { slug: 'bitcoin', name: 'Bitcoin', short: 'BTC/USD', type: 'crypto', tv: 'COINBASE:BTCUSD', yahoo: 'BTC-USD', currency: 'USD', unit: 'US-$', blurb: 'Die älteste und größte Kryptowährung. Handel rund um die Uhr, sieben Tage die Woche.' },
  { slug: 'ethereum', name: 'Ethereum', short: 'ETH/USD', type: 'crypto', tv: 'COINBASE:ETHUSD', yahoo: 'ETH-USD', currency: 'USD', unit: 'US-$', blurb: 'Die zweitgrößte Kryptowährung und wichtigste Plattform für Smart Contracts.' },
  { slug: 'solana', name: 'Solana', short: 'SOL/USD', type: 'crypto', tv: 'COINBASE:SOLUSD', yahoo: 'SOL-USD', currency: 'USD', unit: 'US-$', blurb: 'Schnelle Blockchain mit niedrigen Transaktionskosten.' },
];

const bonds = [
  { slug: 'bund-10j', name: 'Bundesanleihe 10 Jahre', short: 'Bund 10J', type: 'bond', tv: 'TVC:DE10Y', yahoo: null, currency: null, unit: '%', maturity: '10 Jahre', priceKind: 'Rendite bis Fälligkeit', blurb: 'Rendite zehnjähriger deutscher Staatsanleihen – der Referenzzins für die Eurozone.' },
  { slug: 'bund-2j', name: 'Bundesanleihe 2 Jahre', short: 'Bund 2J', type: 'bond', tv: 'TVC:DE02Y', yahoo: null, currency: null, unit: '%', maturity: '2 Jahre', priceKind: 'Rendite bis Fälligkeit', blurb: 'Rendite zweijähriger Bundesanleihen, stark von den Zinserwartungen an die EZB geprägt.' },
  { slug: 'us-treasury-10j', name: 'US-Staatsanleihe 10 Jahre', short: 'US 10J', type: 'bond', tv: 'TVC:US10Y', yahoo: '^TNX', currency: null, unit: '%', maturity: '10 Jahre', priceKind: 'Rendite bis Fälligkeit', blurb: 'Rendite zehnjähriger US-Staatsanleihen – der wichtigste Zins der Welt.' },
];

const all = [...indices, ...commodities, ...fx, ...crypto, ...bonds];
// Gesponserte Unternehmen (aktive Kampagnen aus featured.js): eigene Kursdaten und Fokus-Eintrag in der Kursleiste, aber nicht Teil von `all`
const sponsors = require('./featured').placed('strip').filter(f => f.instrument).map(f => ({ ...f.instrument, featured: true, url: '/fokus/' + f.slug }));
const bySlug = Object.fromEntries([...all, ...sponsors].map(i => [i.slug, i]));
// CMS-Flag: hervorgehobene Unternehmen (Marktleiste vorn, Fokus-Kennzeichnung). Leer lassen, wenn nichts hervorgehoben werden soll.
const FEATURED = [];
for (const f of FEATURED) if (bySlug[f]) bySlug[f].featured = true;

module.exports = { indices, commodities, fx, crypto, bonds, all, sponsors, bySlug };
