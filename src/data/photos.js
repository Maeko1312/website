'use strict';
// Themenfotos: echte Fotografien von Wikimedia Commons unter freien Lizenzen (CC0, Public Domain, CC BY, CC BY-SA),
// Dateien in src/public/img/topics/, Bildnachweise unter /bildnachweise. Zuordnung je Beitrag: explizites `image`-Feld >
// feste Slug-Regel > Muster (generierte Beiträge) > Themen-Pool (am seltensten genutztes Foto zuerst, damit sich Motive
// auf einer Seite möglichst nicht wiederholen). Neue Fotos: Datei ablegen, hier eintragen – fertig.
const fs = require('fs');
const path = require('path');

const P = (file, title, artist, license, page, alt) => ({ key: file, file: `/img/topics/${file}.jpg`, title, artist, license, page, alt });
const photos = {
  ezb: P('ezb', 'Seat of the European Central Bank and Frankfurt Skyline at dawn', 'DXR', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Seat_of_the_European_Central_Bank_and_Frankfurt_Skyline_at_dawn_20150422_1.jpg', 'Die Europäische Zentralbank in Frankfurt am Main in der Morgendämmerung'),
  fed: P('fed', 'Eccles Building, Federal Reserve, Washington', 'Federal Reserve', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Eccles_Building_(26088200676).jpg', 'Das Eccles Building der US-Notenbank in Washington'),
  boerse: P('boerse', 'Frankfurt Stock Exchange (Ank Kumar) 01', 'Ank Kumar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Frankfurt_Stock_Exchange_(Ank_Kumar)_01.jpg', 'Handelssaal der Frankfurter Wertpapierbörse'),
  boerse2: P('boerse2', 'Frankfurt Stock Exchange (Ank Kumar) 04', 'Ank Kumar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Frankfurt_Stock_Exchange_(Ank_Kumar)_04.jpg', 'Kurstafel an der Frankfurter Börse'),
  boerse3: P('boerse3', 'Frankfurt Stock Exchange (Ank Kumar) 06', 'Ank Kumar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Frankfurt_Stock_Exchange_(Ank_Kumar)_06.jpg', 'Anzeigetafel mit Aktienkursen an der Frankfurter Börse'),
  bulle: P('bulle', 'Frankfurt am Main, Skulptur Bulle & Bär', 'Dietmar Rabich', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Frankfurt_am_Main,_Skulptur_-Bulle_%26_B%C3%A4r-_--_2015_--_6763.jpg', 'Die Skulptur Bulle und Bär vor der Frankfurter Börse'),
  skyline: P('skyline', 'Frankfurt Bankenviertel', 'Jorge Franganillo', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Frankfurt_Bankenviertel_(50569447522).jpg', 'Hochhäuser im Frankfurter Bankenviertel'),
  inflation: P('inflation', 'Supermarket interior, grocery store shelves', 'Wolfmann', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:SPAR_kolonial_mat_varehandel_hyller_(Supermarket_interior_GROCERY_store_shelves)_Kolbotn_Norway_2019-10-24_02.jpg', 'Regale mit Lebensmitteln in einem Supermarkt'),
  industrie: P('industrie', 'Meyer Werft Papenburg', 'Raimond Spekking', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Meyer_Werft_Papenburg-7297.jpg', 'Baudock der Meyer Werft in Papenburg'),
  airbus: P('airbus', 'A321 final assembly', 'DearEdward', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:A321_final_assembly_(9351765668).jpg', 'Endmontage eines Airbus A321'),
  jobs: P('jobs', 'Aerial skyline view of lower Manhattan, New York City', 'Carol M. Highsmith', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Aerial_skyline_view_of_lower_Manhattan,_New_York_City,_before_September_11,_2001.jpg', 'Luftaufnahme der Südspitze Manhattans'),
  wallstreet: P('wallstreet', 'Sign of the New York Stock Exchange, Broad Street', 'Billie Grace Ward', 'CC0', 'https://commons.wikimedia.org/wiki/File:Sign_of_the_New_York_Stock_Exchange,_Broad_Street.jpg', 'Fassade der New York Stock Exchange an der Broad Street'),
  china: P('china', 'Containerbrücken für Eurogate, Hamburg', 'GeorgHH', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Containerb%C3%BCcken_f%C3%BCr_Eurogate_013.jpg', 'Containerbrücken werden per Schiff in den Hamburger Hafen geliefert'),
  oel: P('oel', 'Euronav tanker on the Saint Lawrence at Quebec City', 'Wilfredor', 'CC0', 'https://commons.wikimedia.org/wiki/File:Euronav_tanker_on_the_Saint_Lawrence_at_Quebec_City.jpg', 'Ein Öltanker auf dem Sankt-Lorenz-Strom'),
  raffinerie: P('raffinerie', 'Blue hour fog over Preemraff oil refinery by Brofjorden', 'W.carter', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Blue_hour_fog_over_Preemraff_oil_refinery_by_Brofjorden.jpg', 'Eine Ölraffinerie in der blauen Stunde'),
  gas: P('gas', 'LNG tanker Gulf Energy', 'Gordon Leggett', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:2023-05-20_01_LNG_tanker,_GULF_ENERGY_-_IMO_7390143.jpg', 'Ein Flüssiggastanker vor Anker'),
  gold: P('gold', 'Gold bullion bars', 'Stevebidmead', 'CC0', 'https://commons.wikimedia.org/wiki/File:Gold_bullion_bars.jpg', 'Gestapelte Goldbarren'),
  silber: P('silber', 'Silberbarren', 'Amada44', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Silberbarren.jpg', 'Ein gegossener Silberbarren'),
  kupfer: P('kupfer', 'Bingham Canyon Open Pit Copper Mine', 'Jet6581', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Bingham_Canyon_Open_Pit_Copper_Mine_2012-09-17_21-25-59.jpg', 'Bagger in einer Kupfermine im Tagebau'),
  bitcoin: P('bitcoin', 'Bitcoin coins on US dollar bills', 'David McBee', 'CC0', 'https://commons.wikimedia.org/wiki/File:Pexels-david-mcbee-730564.jpg', 'Bitcoin-Münzen auf Dollarscheinen'),
  ethereum: P('ethereum', 'Close-up of a physical Ethereum coin', 'Ivan Radic', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Close-up_of_a_physical_Ethereum_coin_(51002904687).jpg', 'Eine physische Ethereum-Münze'),
  mining: P('mining', 'Cryptocurrency Mining Farm', 'Marco Krohn', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Cryptocurrency_Mining_Farm.jpg', 'Rechner in einer Krypto-Mining-Farm'),
  vw: P('vw', 'Wolfsburg Volkswagen Plant', 'Jorge Franganillo', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Wolfsburg_Volkswagen_Plant.jpg', 'Das Volkswagen-Werk in Wolfsburg am Mittellandkanal'),
  nvidia: P('nvidia', 'Nvidia sign', 'Will Buckner', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Nvidia_sign.jpg', 'Firmenschild am Nvidia-Hauptsitz in Santa Clara'),
  bundesbank: P('bundesbank', 'Frankfurt, Europaturm und Deutsche Bundesbank', 'Dr. Thomas Liptak', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Frankfurt,_Europaturm_und_Deutsche_Bundesbank.jpg', 'Europaturm und Zentrale der Deutschen Bundesbank in Frankfurt'),
  banknoten: P('banknoten', 'Euro banknotes', 'Misko3', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Bundza_penazi_money_Euro_banknotes.jpg', 'Euro-Banknoten in einer Hand'),
  sparen: P('sparen', 'Piggy bank, coins in a jar', 'stevepb', 'CC0', 'https://commons.wikimedia.org/wiki/File:Piggy-bank-968302.jpg', 'Münzen und ein Geldschein in einem Sparglas'),
  kurstafel: P('kurstafel', 'Electronic stock board in Yaesu, Tokyo', 'nappa', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Electronic_stock_board_in_Yaesu,_Tokyo_2007.jpg', 'Elektronische Kurstafel mit Aktienkursen'),
  skyline2: P('skyline2', 'Frankfurt Skyline at night (Unsplash)', 'Mathias Konrath konni', 'CC0', 'https://commons.wikimedia.org/wiki/File:Frankfurt_Skyline_at_night_(Unsplash).jpg', 'Frankfurter Skyline bei Nacht am Main'),
  skyline3: P('skyline3', 'Untermainbrücke 2010', 'uggboy', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Untermainbr%C3%BCcke_2010.jpg', 'Frankfurter Bankentürme'),
  bundestag: P('bundestag', 'Berlin Reichstag BW 2', 'Berthold Werner', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Berlin_Reichstag_BW_2.jpg', 'Das Reichstagsgebäude in Berlin'),
  finanzministerium: P('finanzministerium', 'Haus-der-Ministerien-Berlin', 'Bettenburg', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Haus-der-Ministerien-Berlin.jpg', 'Das Bundesfinanzministerium in Berlin'),
  geldautomat: P('geldautomat', 'ATM - Cash Dispenser in Platanos - panoramio', 'We_have_been_there_i…', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:ATM_-_Cash_Dispenser_in_Platanos_-_panoramio.jpg', 'Ein Geldautomat'),
  nyse: P('nyse', 'Wall Street - New York Stock Exchange', 'Carlos Delgado', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Wall_Street_-_New_York_Stock_Exchange.jpg', 'Die New York Stock Exchange'),
  london: P('london', 'City of London skyline from London City Hall - Oct 2008', 'Diliff', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:City_of_London_skyline_from_London_City_Hall_-_Oct_2008.jpg', 'Die Skyline der City of London'),
  pumpjack: P('pumpjack', 'Pump Jack at the Lost Hills Oil Field In Central California', 'Richard Masoner / Cyclelicious', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Pump_Jack_at_the_Lost_Hills_Oil_Field_In_Central_California.jpg', 'Eine Ölpumpe auf einem Ölfeld'),
  oelplattform: P('oelplattform', 'Offshore-plattform hg', 'Hannes Grobe (talk)', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Offshore-plattform_hg.jpg', 'Eine Ölplattform in der Nordsee'),
  gasflamme: P('gasflamme', 'Portable propane butane burner-head-03', 'Lilly_M', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Portable_propane_butane_burner-head-03.jpg', 'Gasflamme eines Herds'),
  windrad: P('windrad', 'Middelgrunden wind farm 2009-07-01 edit filtered', 'Photo by Kim Hansen. Postprocessing (crop, rotation, color a', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Middelgrunden_wind_farm_2009-07-01_edit_filtered.jpg', 'Windräder auf einem Feld'),
  solar: P('solar', 'Field of Solar Panels near Ogwell', 'Partonez', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Field_of_Solar_Panels_near_Ogwell.jpg', 'Solaranlage'),
  weizen: P('weizen', 'Wheat harvest, Raisen district, Madhya Pradesh, India', 'Yann (talk)', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Wheat_harvest,_Raisen_district,_Madhya_Pradesh,_India.jpg', 'Ein Weizenfeld vor der Ernte'),
  goldmuenzen: P('goldmuenzen', 'Anlagegold weiß', 'Apollo2005', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Anlagegold_wei%C3%9F.JPG', 'Goldmünzen'),
  silbermuenzen: P('silbermuenzen', '2010 olympics hockey coin', 'Eric Golub', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:2010_olympics_hockey_coin.jpg', 'Silbermünzen'),
  chip: P('chip', 'AMD3101E', 'Mister rf', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:AMD3101E.jpg', 'Ein Halbleiter-Wafer'),
  hafen: P('hafen', 'Hamburg Hafen Containerterminal', 'Raimond Spekking', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Hamburg_Hafen_Containerterminal.jpg', 'Containerterminal im Hamburger Hafen'),
  gueterzug: P('gueterzug', 'Freight Train Cars and Containers - Spokane 7', '298YGH20', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Freight_Train_Cars_and_Containers_-_Spokane_7.jpg', 'Ein Güterzug mit Containern'),
  flugzeug: P('flugzeug', 'Lufthansa Airbus A320-211 D-AIQT 01', 'Julian Herzog (Website)', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Lufthansa_Airbus_A320-211_D-AIQT_01.jpg', 'Ein Verkehrsflugzeug'),
  bankgebaeude: P('bankgebaeude', 'Deutsche Bank neue Fassade', 'Thomas Wolf (Der Wolf im Wald)', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Deutsche_Bank_neue_Fassade.jpg', 'Die Zwillingstürme der Deutschen Bank'),
  baustelle: P('baustelle', 'Crane and building site - geograph.org.uk - 5284660', 'M J Richardson', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Crane_and_building_site_-_geograph.org.uk_-_5284660.jpg', 'Baustelle mit Kran'),
  einkaufswagen: P('einkaufswagen', 'Shopping cart of Prisma shop', 'Dmitry G', 'Public domain', 'https://commons.wikimedia.org/wiki/File:Shopping_cart_of_Prisma_shop.JPG', 'Einkaufswagen im Supermarkt'),
  tankstelle: P('tankstelle', '$4.06 Gas Prices, Lewiston, Maine, Cumberland Farms', 'Micov', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:$4.06_Gas_Prices,_Lewiston,_Maine,_Cumberland_Farms.JPG', 'Zapfsäule an einer Tankstelle'),
  kohle: P('kohle', 'Coal power plant Knepper 1', 'Arnoldius', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Coal_power_plant_Knepper_1.jpg', 'Ein Kohlekraftwerk'),
  atomkraft: P('atomkraft', 'Bell Bend Nuclear Power Plant cooling towers from the east', 'Jakec', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Bell_Bend_Nuclear_Power_Plant_cooling_towers_from_the_east.JPG', 'Kühltürme eines Kernkraftwerks'),
  blockchain: P('blockchain', '10elqpi', 'The original uploader was Ladislav Mecir at English Wikipedi', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:10elqpi.jpg', 'Eine Hardware-Wallet'),
  fed2: P('fed2', '2013 Federal Reserve Bank of New York from west', 'Beyond My Ken', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:2013_Federal_Reserve_Bank_of_New_York_from_west.jpg', 'Die Federal Reserve Bank of New York'),
  schiff: P('schiff', 'Cargo ship at dusk (15953825200)', 'Ian Gratton from Sutton-n-Craven, North Yorkshire, England', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Cargo_ship_at_dusk_(15953825200).jpg', 'Ein Frachtschiff auf See'),
};

// Feste Zuordnung je Slug (redaktionelle Beiträge und Erklärstücke)
const bySlug = {
  'ezb-vor-zweiter-zinserhoehung-einlagensatz-2-50-prozent': 'ezb', 'bundrendite-3-38-prozent-hoechster-stand-seit-2011': 'bundesbank', 'fed-chef-warsh-inflation-zu-hoch-zinserhoehung-september-im-spiel': 'fed',
  'inflation-deutschland-august-2026-2-9-prozent-energie': 'inflation', 'euroraum-inflation-august-2026-3-3-prozent-kernrate-sinkt': 'banknoten', 'industrieauftraege-juli-2026-plus-2-5-prozent-grossauftraege': 'industrie',
  'us-arbeitsmarkt-august-2026-162000-stellen-quote-4-1-prozent': 'jobs', 'china-exporte-august-2026-plus-25-prozent-handelsueberschuss': 'china', 'oelpreis-brent-96-dollar-hormus-opec-plus-haelt-foerderziele': 'oel',
  'gaspreis-ttf-ueber-70-euro-drittel-teurer-in-drei-wochen': 'gas', 'gold-4400-dollar-notenbanken-kaufen-privatanleger-auf-14-monats-hoch': 'gold', 'bitcoin-79000-dollar-nach-plus-25-prozent-im-august-77000-als-schluesselmarke': 'bitcoin',
  'ethereum-2450-dollar-etf-zufluesse-lassen-nach-2550-als-widerstand': 'ethereum', 'volkswagen-aufsichtsrat-beschliesst-abbau-von-50000-stellen-bis-2030': 'vw', 'nvidia-rekordquartal-96-milliarden-dollar-umsatz-ki-rally-haelt': 'nvidia',
  'wochenausblick-ezb-entscheid-us-inflation-oracle-dax-26000': 'bulle',
  'us-verbraucherpreise-11-september-was-die-fed-sehen-will': 'fed2', 'oracle-adobe-quartalszahlen-10-september-test-fuer-die-ki-nachfrage': 'chip', 'deutsche-autobauer-erstes-halbjahr-2026-absatz-unter-weltmarkt-china-bricht-ein': 'airbus',
  'silber-66-dollar-gold-silber-verhaeltnis-67-industriemetall-mit-hebel': 'silbermuenzen', 'kupfer-dr-copper-chinas-exportboom-und-die-nachfrage-aus-der-elektrifizierung': 'kupfer', 'festgeld-und-tagesgeld-nach-der-zinswende-was-sparer-jetzt-bekommen': 'geldautomat', 'dax-prognosen-banken-sehen-jahresende-um-26000-punkte-mehr-schwankung': 'kurstafel',
};
const bySlugSoft = {
  'ezb-zinsentscheid-was-anleger-wissen-muessen': 'ezb', 'fed-zinsentscheid-fomc-erklaert': 'fed', 'ifo-index-erklaert': 'airbus', 'inflation-verbraucherpreise-richtig-lesen': 'inflation', 'us-arbeitsmarktbericht-payrolls-erklaert': 'wallstreet',
  'kursziele-analystenschaetzungen-richtig-lesen': 'kurstafel', 'quartalszahlen-lesen-in-fuenf-minuten': 'boerse2', 'dax-etf-oder-msci-world': 'boerse', 'etf-sparplan-100-euro-monatlich': 'sparen', 'knock-out-zertifikate-erklaert': 'boerse3',
  'optionsscheine-kennzahlen-delta-omega': 'kurstafel', 'bundrendite-zinsstruktur-aktuell': 'bundesbank',
};
// Pools nach Kategorie, Instrument und Ratgeber-Thema
const pools = {
  category: { marktberichte: ['boerse', 'bulle', 'boerse2', 'skyline', 'boerse3', 'skyline2', 'skyline3', 'nyse', 'london', 'bankgebaeude'], unternehmen: ['industrie', 'airbus', 'vw', 'skyline', 'flugzeug', 'hafen', 'gueterzug', 'chip', 'baustelle', 'bankgebaeude'], wirtschaft: ['inflation', 'industrie', 'china', 'airbus', 'bundestag', 'finanzministerium', 'einkaufswagen', 'hafen', 'gueterzug', 'weizen', 'baustelle', 'tankstelle'], zentralbanken: ['ezb', 'bundesbank', 'fed', 'banknoten', 'fed2', 'bundestag', 'finanzministerium', 'geldautomat'], rohstoffe: ['gold', 'oel', 'gas', 'kupfer', 'raffinerie', 'silber', 'pumpjack', 'oelplattform', 'gasflamme', 'windrad', 'solar', 'kohle', 'atomkraft', 'goldmuenzen', 'silbermuenzen', 'weizen', 'schiff'], krypto: ['bitcoin', 'ethereum', 'mining', 'blockchain', 'chip'], analystenstimmen: ['kurstafel', 'wallstreet', 'boerse2', 'nyse', 'london', 'skyline2'], analysen: ['boerse2', 'kurstafel', 'boerse3', 'wallstreet', 'nyse', 'skyline2', 'london', 'gold', 'raffinerie', 'banknoten', 'mining', 'silber', 'pumpjack', 'goldmuenzen', 'geldautomat', 'boerse', 'sparen'], 'analysen-indizes': ['boerse2', 'kurstafel', 'boerse3', 'wallstreet', 'nyse', 'skyline2', 'london'], 'analysen-rohstoffe-devisen': ['gold', 'raffinerie', 'banknoten', 'mining', 'silber', 'pumpjack', 'goldmuenzen', 'geldautomat'], 'analysen-etf': ['boerse', 'sparen'], 'analysen-hebelprodukte': ['boerse3', 'kurstafel'] },
  instrument: { gold: 'gold', silber: 'silber', platin: 'goldmuenzen', kupfer: 'kupfer', brent: 'oel', wti: 'pumpjack', erdgas: 'gas', uran: 'atomkraft', 'eur-gbp': 'london', solana: 'blockchain', bitcoin: 'bitcoin', ethereum: 'ethereum', solana: 'mining', 'eur-usd': 'banknoten', 'bund-10j': 'bundesbank', 'bund-2j': 'bundesbank', 'us-treasury-10j': 'fed', 'sp-500': 'wallstreet', 'nasdaq-100': 'nvidia', 'dow-jones': 'wallstreet', dax: 'boerse2', mdax: 'boerse3', 'euro-stoxx-50': 'ezb' },
  topic: { einsteiger: ['sparen', 'banknoten', 'skyline', 'bulle', 'geldautomat', 'einkaufswagen'], 'etf-sparplan': ['boerse', 'kurstafel', 'boerse3', 'sparen', 'skyline2', 'london'], aktien: ['bulle', 'boerse2', 'wallstreet', 'boerse', 'nyse', 'bankgebaeude'], dividenden: ['banknoten', 'sparen', 'boerse2', 'goldmuenzen'], 'zinsen-anleihen': ['bundesbank', 'ezb', 'fed', 'fed2', 'finanzministerium'], 'gold-rohstoffe': ['gold', 'silber', 'kupfer', 'oel', 'goldmuenzen', 'silbermuenzen', 'pumpjack'], krypto: ['bitcoin', 'ethereum', 'mining', 'blockchain'], steuern: ['banknoten', 'sparen', 'finanzministerium', 'bundestag'], psychologie: ['bulle', 'skyline', 'jobs', 'skyline2', 'schiff'], chartanalyse: ['kurstafel', 'boerse2', 'boerse3', 'nyse'] },
  guide: { einsteiger: ['sparen', 'bulle'], broker: ['wallstreet', 'kurstafel'], 'etf-sparplan': ['boerse', 'sparen'], chartanalyse: ['kurstafel', 'boerse2'], strategien: ['bulle', 'skyline'], kennzahlen: ['boerse2', 'boerse3'], boersenlexikon: ['boerse', 'skyline'], anleihen: ['bundesbank', 'ezb'], rohstoffe: ['gold', 'oel'], krypto: ['bitcoin', 'mining'] },
  any: Object.keys(photos),
};

const used = new Map();
const take = (key) => { used.set(key, (used.get(key) || 0) + 1); return photos[key]; };
const leastUsed = (keys) => keys.slice().sort((a, b) => (used.get(a) || 0) - (used.get(b) || 0))[0];
// Wunschmotiv nur, solange es noch nicht (oder seltener als der Pool) genutzt wurde – sonst das seltenste aus dem Pool
// Seltenstes Motiv aus dem Pool; ist der Pool ausgeschöpft, ein noch ungenutztes Motiv aus dem Gesamtbestand
const fromPool = (pool) => { const k = leastUsed(pool); if ((used.get(k) || 0) === 0) return k; const g = leastUsed(pools.any); return (used.get(g) || 0) < (used.get(k) || 0) ? g : k; };
const fresh = (key, pool) => { const u = used.get(key) || 0; if (u === 0) return key; const alt = fromPool(pool || pools.any); return (used.get(alt) || 0) < u ? alt : key; };
const has = (f) => fs.existsSync(path.join(__dirname, '..', 'public', 'img', 'topics', f + '.jpg'));

function pick(item) {
  const { kind, slug = '', category, instruments = [], topic, index = 0 } = item;
  if (bySlug[slug]) return take(fresh(bySlug[slug], pools.category[category] || pools.topic[topic] || pools.any));
  if (bySlugSoft[slug]) return take(fresh(bySlugSoft[slug], pools.category[category] || pools.any));
  if (kind === 'article') {
    if (slug.startsWith('boerse-frankfurt-')) return take(fromPool(pools.category.marktberichte));
    const mChart = slug.match(/^(.+)-chartanalyse-\d{4}/); if (mChart && pools.instrument[mChart[1]]) return take(fresh(pools.instrument[mChart[1]], pools.category[category]));
    const mPrice = slug.match(/^(.+)-(preis|kurs)-\d{4}/); if (mPrice && pools.instrument[mPrice[1]]) return take(fresh(pools.instrument[mPrice[1]], pools.category[category]));
    for (const s of instruments) if (pools.instrument[s] && (used.get(pools.instrument[s]) || 0) === 0) return take(pools.instrument[s]);
    if (pools.category[category]) return take(fromPool(pools.category[category]));
  }
  if (kind === 'post' && pools.topic[topic]) return take(fromPool(pools.topic[topic]));
  if (kind === 'guide') { for (const [k, pool] of Object.entries(pools.guide)) if (slug.includes(k)) return take(fromPool(pool)); }
  return take(fromPool(pools.any));
}
const credit = (p) => p ? `${p.title} – ${p.artist}, Wikimedia Commons, ${p.license}` : '';
const all = () => Object.values(photos).filter(p => has(p.key));

// Ersatzmotiv für eine Seite, auf der das zugewiesene Foto schon vorkommt: passender Pool, sonst Gesamtbestand; bevorzugt global selten genutzt
function alternative(item, excludeFiles) {
  const pool = (item.categoryObj && pools.category[item.category]) || (item.topicObj && pools.topic[item.topic]) || [];
  const cands = [...pool, ...pools.any].filter((k, i, arr) => arr.indexOf(k) === i && !excludeFiles.has(photos[k].file));
  if (!cands.length) return null;
  const k = cands.slice().sort((a, b) => (used.get(a) || 0) - (used.get(b) || 0))[0];
  return take(k);
}
module.exports = { photos, pick, credit, all, alternative };
