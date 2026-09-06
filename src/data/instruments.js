'use strict';
// Instrumente-Universum. Kurse/Historie kommen aus market-snapshot.json + history.json
// (einmalig per scripts/fetch-market-data.js erzeugt, statisch eingebettet).
// tv = TradingView-Symbol (Snapshot), yahoo = Yahoo-Symbol (Historie).

const stock = (slug, name, tv, yahoo, isin, sector, index, blurb) =>
  ({ slug, name, type: 'stock', tv, yahoo, isin, sector, index, exchange: 'Xetra', currency: 'EUR', unit: '€', blurb });

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

const dax = [
  stock('adidas', 'adidas', 'XETR:ADS', 'ADS.DE', 'DE000A1EWWW0', 'Konsumgüter', 'DAX', 'Zweitgrößter Sportartikelhersteller der Welt mit Sitz in Herzogenaurach.'),
  stock('airbus', 'Airbus', 'XETR:AIR', 'AIR.DE', 'NL0000235190', 'Luft- und Raumfahrt', 'DAX', 'Europäischer Flugzeugbauer und größter ziviler Flugzeughersteller der Welt.'),
  stock('allianz', 'Allianz', 'XETR:ALV', 'ALV.DE', 'DE0008404005', 'Versicherungen', 'DAX', 'Einer der größten Versicherer und Vermögensverwalter weltweit, Sitz in München.'),
  stock('basf', 'BASF', 'XETR:BAS', 'BAS.DE', 'DE000BASF111', 'Chemie', 'DAX', 'Weltgrößter Chemiekonzern mit Stammsitz in Ludwigshafen.'),
  stock('bayer', 'Bayer', 'XETR:BAYN', 'BAYN.DE', 'DE000BAY0017', 'Pharma & Agrar', 'DAX', 'Life-Science-Konzern mit den Sparten Pharma, Consumer Health und Crop Science.'),
  stock('beiersdorf', 'Beiersdorf', 'XETR:BEI', 'BEI.DE', 'DE0005200000', 'Konsumgüter', 'DAX', 'Hamburger Konsumgüterkonzern, bekannt für Marken wie Nivea, Eucerin und Tesa.'),
  stock('bmw', 'BMW', 'XETR:BMW', 'BMW.DE', 'DE0005190003', 'Automobile', 'DAX', 'Münchner Premium-Automobilhersteller mit den Marken BMW, Mini und Rolls-Royce.'),
  stock('brenntag', 'Brenntag', 'XETR:BNR', 'BNR.DE', 'DE000A1DAHH0', 'Chemiedistribution', 'DAX', 'Weltmarktführer im Handel mit Chemikalien und Inhaltsstoffen, Sitz in Essen.'),
  stock('commerzbank', 'Commerzbank', 'XETR:CBK', 'CBK.DE', 'DE000CBK1001', 'Banken', 'DAX', 'Zweitgrößte deutsche Privatbank mit Schwerpunkt Mittelstand und Privatkunden.'),
  stock('continental', 'Continental', 'XETR:CON', 'CON.DE', 'DE0005439004', 'Automobilzulieferer', 'DAX', 'Reifen- und Automobilzulieferer aus Hannover.'),
  stock('daimler-truck', 'Daimler Truck', 'XETR:DTG', 'DTG.DE', 'DE000DTR0CK8', 'Nutzfahrzeuge', 'DAX', 'Einer der größten Nutzfahrzeughersteller der Welt, 2021 von Daimler abgespalten.'),
  stock('deutsche-bank', 'Deutsche Bank', 'XETR:DBK', 'DBK.DE', 'DE0005140008', 'Banken', 'DAX', 'Größte deutsche Bank mit globalem Investmentbanking und Privatkundengeschäft.'),
  stock('deutsche-boerse', 'Deutsche Börse', 'XETR:DB1', 'DB1.DE', 'DE0005810055', 'Finanzdienstleistungen', 'DAX', 'Betreiberin der Frankfurter Wertpapierbörse, von Xetra, Eurex und Clearstream.'),
  stock('dhl-group', 'DHL Group', 'XETR:DHL', 'DHL.DE', 'DE0005552004', 'Logistik', 'DAX', 'Weltgrößter Logistikkonzern, ehemals Deutsche Post, Sitz in Bonn.'),
  stock('deutsche-telekom', 'Deutsche Telekom', 'XETR:DTE', 'DTE.DE', 'DE0005557508', 'Telekommunikation', 'DAX', 'Europas größter Telekommunikationskonzern mit der US-Tochter T-Mobile US.'),
  stock('eon', 'E.ON', 'XETR:EOAN', 'EOAN.DE', 'DE000ENAG999', 'Versorger', 'DAX', 'Energiekonzern mit Fokus auf Stromnetze und Kundenlösungen, Sitz in Essen.'),
  stock('fresenius', 'Fresenius', 'XETR:FRE', 'FRE.DE', 'DE000FRE5EN2', 'Gesundheit', 'DAX', 'Gesundheitskonzern mit der Klinikkette Helios und dem Arzneimittelgeschäft Kabi.'),
  stock('fresenius-medical-care', 'Fresenius Medical Care', 'XETR:FME', 'FME.DE', 'DE0005785802', 'Gesundheit', 'DAX', 'Weltgrößter Anbieter von Dialyseprodukten und -dienstleistungen.'),
  stock('gea-group', 'GEA Group', 'XETR:G1A', 'G1A.DE', 'DE0006602006', 'Maschinenbau', 'DAX', 'Spezialist für Prozesstechnik in der Lebensmittel- und Getränkeindustrie, Sitz in Düsseldorf.'),
  stock('hannover-rueck', 'Hannover Rück', 'XETR:HNR1', 'HNR1.DE', 'DE0008402215', 'Versicherungen', 'DAX', 'Drittgrößter Rückversicherer der Welt.'),
  stock('heidelberg-materials', 'Heidelberg Materials', 'XETR:HEI', 'HEI.DE', 'DE0006047004', 'Baustoffe', 'DAX', 'Einer der größten Baustoffhersteller weltweit, ehemals HeidelbergCement.'),
  stock('henkel', 'Henkel', 'XETR:HEN3', 'HEN3.DE', 'DE0006048432', 'Konsumgüter', 'DAX', 'Düsseldorfer Konzern für Klebstoffe, Wasch- und Reinigungsmittel sowie Kosmetik (Vorzugsaktie).'),
  stock('infineon', 'Infineon', 'XETR:IFX', 'IFX.DE', 'DE0006231004', 'Halbleiter', 'DAX', 'Größter deutscher Halbleiterhersteller, stark in Automobil- und Leistungselektronik.'),
  stock('mercedes-benz', 'Mercedes-Benz Group', 'XETR:MBG', 'MBG.DE', 'DE0007100000', 'Automobile', 'DAX', 'Stuttgarter Hersteller von Premium- und Luxusfahrzeugen.'),
  stock('merck', 'Merck', 'XETR:MRK', 'MRK.DE', 'DE0006599905', 'Pharma & Chemie', 'DAX', 'Darmstädter Wissenschafts- und Technologiekonzern mit Pharma, Life Science und Elektronik.'),
  stock('mtu-aero-engines', 'MTU Aero Engines', 'XETR:MTX', 'MTX.DE', 'DE000A0D9PT0', 'Luft- und Raumfahrt', 'DAX', 'Deutschlands führender Triebwerkshersteller mit Sitz in München.'),
  stock('muenchener-rueck', 'Münchener Rück', 'XETR:MUV2', 'MUV2.DE', 'DE0008430026', 'Versicherungen', 'DAX', 'Weltgrößter Rückversicherer, Erstversicherung über die Tochter ERGO.'),
  stock('porsche-se', 'Porsche SE', 'XETR:PAH3', 'PAH3.DE', 'DE000PAH0038', 'Beteiligungen', 'DAX', 'Holding der Familien Porsche und Piëch, Großaktionärin von Volkswagen (Vorzugsaktie).'),
  stock('qiagen', 'Qiagen', 'XETR:QIA', 'QIA.DE', 'NL0015002SN0', 'Biotechnologie', 'DAX', 'Anbieter von Probenvorbereitungs- und Testtechnologien für Molekulardiagnostik.'),
  stock('rheinmetall', 'Rheinmetall', 'XETR:RHM', 'RHM.DE', 'DE0007030009', 'Rüstung', 'DAX', 'Düsseldorfer Rüstungs- und Technologiekonzern, größter deutscher Wehrtechnikhersteller.'),
  stock('rwe', 'RWE', 'XETR:RWE', 'RWE.DE', 'DE0007037129', 'Versorger', 'DAX', 'Einer der größten Erzeuger erneuerbarer Energien in Europa, Sitz in Essen.'),
  stock('sap', 'SAP', 'XETR:SAP', 'SAP.DE', 'DE0007164600', 'Software', 'DAX', 'Europas größter Softwarekonzern und wertvollstes deutsches Unternehmen, Sitz in Walldorf.'),
  stock('scout24', 'Scout24', 'XETR:G24', 'G24.DE', 'DE000A12DM80', 'Internet', 'DAX', 'Betreiberin des Immobilienportals ImmoScout24.'),
  stock('siemens', 'Siemens', 'XETR:SIE', 'SIE.DE', 'DE0007236101', 'Industrie', 'DAX', 'Technologiekonzern mit Schwerpunkt Automatisierung, Infrastruktur und Mobilität.'),
  stock('siemens-energy', 'Siemens Energy', 'XETR:ENR', 'ENR.DE', 'DE000ENER6Y0', 'Energietechnik', 'DAX', 'Energietechnikkonzern mit Gasturbinen, Netztechnik und der Windtochter Siemens Gamesa.'),
  stock('siemens-healthineers', 'Siemens Healthineers', 'XETR:SHL', 'SHL.DE', 'DE000SHL1006', 'Medizintechnik', 'DAX', 'Medizintechniksparte von Siemens: Bildgebung, Diagnostik und Krebstherapie.'),
  stock('symrise', 'Symrise', 'XETR:SY1', 'SY1.DE', 'DE000SYM9999', 'Spezialchemie', 'DAX', 'Hersteller von Duft- und Geschmacksstoffen aus Holzminden.'),
  stock('vonovia', 'Vonovia', 'XETR:VNA', 'VNA.DE', 'DE000A1ML7J1', 'Immobilien', 'DAX', 'Größtes deutsches Wohnungsunternehmen mit rund 540.000 Wohnungen.'),
  stock('volkswagen', 'Volkswagen', 'XETR:VOW3', 'VOW3.DE', 'DE0007664039', 'Automobile', 'DAX', 'Europas größter Autohersteller mit den Marken VW, Audi, Porsche, Skoda und Seat (Vorzugsaktie).'),
  stock('zalando', 'Zalando', 'XETR:ZAL', 'ZAL.DE', 'DE000ZAL1111', 'Onlinehandel', 'DAX', 'Europas größte Online-Plattform für Mode und Lifestyle, Sitz in Berlin.'),
];

const mdax = [
  stock('porsche-ag', 'Porsche AG', 'XETR:P911', 'P911.DE', 'DE000PAG9113', 'Automobile', 'MDAX', 'Sportwagenhersteller aus Stuttgart-Zuffenhausen (Vorzugsaktie).'),
  stock('sartorius', 'Sartorius', 'XETR:SRT3', 'SRT3.DE', 'DE0007165631', 'Labortechnik', 'MDAX', 'Göttinger Pharma- und Laborzulieferer (Vorzugsaktie).'),
  stock('lufthansa', 'Lufthansa', 'XETR:LHA', 'LHA.DE', 'DE0008232125', 'Luftfahrt', 'MDAX', 'Größte deutsche Fluggesellschaft mit Marken wie Swiss, Austrian und Eurowings.'),
  stock('puma', 'Puma', 'XETR:PUM', 'PUM.DE', 'DE0006969603', 'Konsumgüter', 'MDAX', 'Sportartikelhersteller aus Herzogenaurach.'),
  stock('thyssenkrupp', 'thyssenkrupp', 'XETR:TKA', 'TKA.DE', 'DE0007500001', 'Industrie', 'MDAX', 'Essener Industriekonzern mit Stahl, Werkstoffhandel und Marinesystemen.'),
  stock('evonik', 'Evonik', 'XETR:EVK', 'EVK.DE', 'DE000EVNK013', 'Spezialchemie', 'MDAX', 'Einer der weltweit führenden Spezialchemiekonzerne, Sitz in Essen.'),
  stock('aurubis', 'Aurubis', 'XETR:NDA', 'NDA.DE', 'DE0006766504', 'Metalle', 'MDAX', 'Größter Kupferproduzent Europas mit Sitz in Hamburg.'),
  stock('leg-immobilien', 'LEG Immobilien', 'XETR:LEG', 'LEG.DE', 'DE000LEG1110', 'Immobilien', 'MDAX', 'Wohnungsunternehmen mit Schwerpunkt Nordrhein-Westfalen.'),
  stock('aixtron', 'Aixtron', 'XETR:AIXA', 'AIXA.DE', 'DE000A0WMPJ6', 'Halbleiterausrüstung', 'MDAX', 'Hersteller von Anlagen zur Beschichtung von Halbleitern, Sitz in Herzogenrath.'),
  stock('nemetschek', 'Nemetschek', 'XETR:NEM', 'NEM.DE', 'DE0006452907', 'Software', 'MDAX', 'Münchner Softwareanbieter für Architektur, Bau und Gebäudemanagement.'),
  stock('bechtle', 'Bechtle', 'XETR:BC8', 'BC8.DE', 'DE0005158703', 'IT-Dienstleistungen', 'MDAX', 'Größtes deutsches IT-Systemhaus mit Sitz in Neckarsulm.'),
  stock('carl-zeiss-meditec', 'Carl Zeiss Meditec', 'XETR:AFX', 'AFX.DE', 'DE0005313704', 'Medizintechnik', 'MDAX', 'Medizintechnikunternehmen für Augenheilkunde und Mikrochirurgie aus Jena.'),
  stock('kion-group', 'Kion Group', 'XETR:KGX', 'KGX.DE', 'DE000KGX8881', 'Maschinenbau', 'MDAX', 'Hersteller von Gabelstaplern und Lagertechnik, Sitz in Frankfurt.'),
  stock('hochtief', 'Hochtief', 'XETR:HOT', 'HOT.DE', 'DE0006070006', 'Bau', 'MDAX', 'Essener Baukonzern mit starkem Geschäft in Nordamerika und Australien.'),
  stock('knorr-bremse', 'Knorr-Bremse', 'XETR:KBX', 'KBX.DE', 'DE000KBX1006', 'Industrie', 'MDAX', 'Weltmarktführer für Bremssysteme in Schienen- und Nutzfahrzeugen, Sitz in München.'),
  stock('hensoldt', 'Hensoldt', 'XETR:HAG', 'HAG.DE', 'DE000HAG0005', 'Rüstung', 'MDAX', 'Sensor- und Radarspezialist für Verteidigung und Sicherheit aus Taufkirchen.'),
  stock('hugo-boss', 'Hugo Boss', 'XETR:BOSS', 'BOSS.DE', 'DE000A1PHFF7', 'Bekleidung', 'MDAX', 'Modekonzern aus Metzingen.'),
  stock('wacker-chemie', 'Wacker Chemie', 'XETR:WCH', 'WCH.DE', 'DE000WCH8881', 'Chemie', 'MDAX', 'Münchner Chemiekonzern, u. a. Polysilizium für Solar- und Halbleiterindustrie.'),
  stock('teamviewer', 'TeamViewer', 'XETR:TMV', 'TMV.DE', 'DE000A2YN900', 'Software', 'MDAX', 'Göppinger Anbieter von Fernwartungs- und Kollaborationssoftware.'),
  stock('hellofresh', 'HelloFresh', 'XETR:HFG', 'HFG.DE', 'DE000A161408', 'Onlinehandel', 'MDAX', 'Berliner Kochboxen-Versender.'),
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

const all = [...indices, ...dax, ...mdax, ...commodities, ...fx, ...crypto, ...bonds];
const bySlug = Object.fromEntries(all.map(i => [i.slug, i]));

module.exports = { indices, dax, mdax, stocks: [...dax, ...mdax], commodities, fx, crypto, bonds, all, bySlug };
