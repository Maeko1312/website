'use strict';
// Börsen-Quiz: kurze Wissensfragen mit Erklärung. Die Startseite zeigt fünf, rotierend nach Build-Tag.
const questions = [
  { q: 'Wie viele Unternehmen sind im DAX vertreten?', o: ['30', '40', '50', '100'], a: 1, e: 'Seit September 2021 umfasst der DAX 40 Werte, davor waren es 30. Aufnahme und Ausschluss prüft die Deutsche Börse vierteljährlich.' },
  { q: 'Bis wann läuft der Xetra-Handel an einem normalen Börsentag?', o: ['15:30 Uhr', '17:30 Uhr', '20:00 Uhr', '22:00 Uhr'], a: 1, e: 'Xetra handelt von 9:00 bis 17:30 Uhr. Der Parketthandel in Frankfurt und Direkthändler wie Tradegate laufen bis 22:00 Uhr – mit weiteren Spreads.' },
  { q: 'Was sagt ein KGV von 10 aus?', o: ['Die Aktie kostet 10 Euro', 'Anleger zahlen das 10-Fache des Jahresgewinns', 'Die Dividende beträgt 10 %', 'Der Kurs ist um 10 % gestiegen'], a: 1, e: 'Das Kurs-Gewinn-Verhältnis teilt den Kurs durch den Gewinn je Aktie. Bei 10 dauert es rechnerisch zehn Jahre, bis der Gewinn den Kaufpreis eingespielt hat.' },
  { q: 'Wie hoch ist der Sparer-Pauschbetrag für eine Einzelperson?', o: ['801 €', '1.000 €', '2.000 €', '5.000 €'], a: 1, e: 'Seit 2023 sind 1.000 € Kapitalerträge pro Jahr steuerfrei, bei Zusammenveranlagung 2.000 €. Voraussetzung ist ein Freistellungsauftrag bei der Bank.' },
  { q: 'Ab wann sind Gewinne mit Bitcoin in Deutschland steuerfrei?', o: ['Sofort', 'Nach 6 Monaten', 'Nach 1 Jahr Haltedauer', 'Nie'], a: 2, e: 'Kryptowährungen gelten als private Veräußerungsgeschäfte: Nach mehr als einem Jahr Haltedauer sind Gewinne steuerfrei, davor gilt eine Freigrenze von 1.000 € pro Jahr.' },
  { q: 'Wie viel wiegt eine Feinunze Gold?', o: ['28,35 g', '31,10 g', '50,00 g', '100,00 g'], a: 1, e: 'Eine Feinunze (troy ounce) entspricht 31,1035 Gramm – nicht zu verwechseln mit der Handelsunze von 28,35 Gramm.' },
  { q: 'Was unterscheidet einen Performanceindex wie den DAX von einem Kursindex?', o: ['Er enthält mehr Aktien', 'Dividenden werden rechnerisch wieder angelegt', 'Er wird nur einmal täglich berechnet', 'Er enthält auch Anleihen'], a: 1, e: 'Beim Performanceindex fließen Dividenden in den Indexstand ein. Der S&P 500 ist in der Standardvariante ein Kursindex – der Punktevergleich mit dem DAX hinkt deshalb.' },
  { q: 'Was misst der VIX?', o: ['Die Inflation in den USA', 'Die erwartete Schwankungsbreite des S&P 500', 'Das Handelsvolumen an der Nasdaq', 'Den Goldpreis in Dollar'], a: 1, e: 'Der VIX wird aus Optionspreisen berechnet und zeigt die vom Markt erwartete Volatilität der nächsten 30 Tage. Werte über 30 gelten als Stressphase.' },
  { q: 'Was passiert mit dem Aktienkurs am Ex-Dividenden-Tag?', o: ['Er steigt um die Dividende', 'Er wird rechnerisch um die Dividende gekürzt', 'Er bleibt unverändert', 'Der Handel wird ausgesetzt'], a: 1, e: 'Am Ex-Tag wird die Aktie ohne Dividendenanspruch gehandelt und der Kurs entsprechend niedriger gestellt. „Dividende mitnehmen und verkaufen“ bringt deshalb nichts.' },
  { q: 'Wie viele Liter fasst ein Barrel Rohöl?', o: ['100 Liter', '119 Liter', '159 Liter', '200 Liter'], a: 2, e: 'Ein Barrel sind 158,987 Liter. Bei rund 96 Dollar je Barrel kostet der Liter Rohöl etwa 0,52 Euro – der Rest des Tankstellenpreises sind Steuern, Raffinerie und Vertrieb.' },
  { q: 'Bis zu welchem Betrag sind Bankeinlagen in der EU je Kunde und Bank gesichert?', o: ['20.000 €', '50.000 €', '100.000 €', '250.000 €'], a: 2, e: 'Die gesetzliche Einlagensicherung schützt 100.000 € je Kunde und Bank. Wertpapiere im Depot sind davon unabhängig: Sie sind Sondervermögen und gehören auch bei einer Bankpleite Ihnen.' },
  { q: 'Wann öffnet die Wall Street nach mitteleuropäischer Zeit?', o: ['14:30 Uhr', '15:30 Uhr', '16:00 Uhr', '17:30 Uhr'], a: 1, e: 'NYSE und Nasdaq handeln von 9:30 bis 16:00 Uhr Ortszeit, also 15:30 bis 22:00 Uhr MEZ. In den Wochen mit unterschiedlicher Zeitumstellung verschiebt sich das um eine Stunde.' },
  { q: 'Was bedeutet „Golden Cross“ in der Chartanalyse?', o: ['Der Goldpreis erreicht ein Rekordhoch', 'Die 50-Tage-Linie kreuzt die 200-Tage-Linie nach oben', 'Eine Aktie wird in den DAX aufgenommen', 'Der Kurs schließt über dem Eröffnungskurs'], a: 1, e: 'Kreuzt der kürzere gleitende Durchschnitt den längeren nach oben, gilt das als Kaufsignal; die umgekehrte Kreuzung heißt „Death Cross“.' },
];
module.exports = function (ctx) {
  const dayOfYear = Math.floor((ctx.now - new Date(ctx.now.getFullYear(), 0, 0)) / 86400000);
  const start = dayOfYear % questions.length;
  const today = [];
  for (let i = 0; i < 5; i++) today.push(questions[(start + i) % questions.length]);
  return { all: questions, today, id: `q${ctx.now.getFullYear()}${String(dayOfYear).padStart(3, '0')}` };
};
