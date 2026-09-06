'use strict';
// Statischer Build: rendert alle Seiten nach dist/. Keine Abhängigkeiten, kein Netzwerk.
//   node build.js
const fs = require('fs');
const path = require('path');

const config = require('./src/site.config.js');
const util = require('./src/lib/util.js');
const instruments = require('./src/data/instruments.js');
const snapshot = require('./src/data/market-snapshot.json');
const history = require('./src/data/history.json');
const navData = require('./src/data/nav.js');

const DIST = path.join(__dirname, 'dist');
const now = new Date();

// Kontext für alle Seiten-Module
const ctx = { config, util, instruments, snapshot, history, nav: navData, now, quote: (slug) => snapshot.quotes[slug] || null, hist: (slug) => history[slug] || null };
// Inhalte (Artikel, Kalender, Wissen …) werden relativ zum Build-Datum erzeugt
ctx.content = require('./src/data/content.js')(ctx);
const layout = require('./src/render/layout.js')(ctx);
const components = require('./src/render/components.js')(ctx);
ctx.layout = layout; ctx.c = components;

// Seitenmodule
const pageModules = ['home', 'news', 'blog', 'markets', 'quote', 'calendar', 'rankings', 'knowledge', 'tools', 'misc'];
const pages = [];
for (const m of pageModules) {
  const mod = require(`./src/pages/${m}.js`);
  const list = mod(ctx);
  for (const p of list) pages.push(p);
}

// --- Ausgabe ---
// dist leeren (Datei für Datei – ein laufender Vorschau-Server darf den Ordner selbst offen halten)
clearDir(DIST);
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(__dirname, 'src', 'assets'), path.join(DIST, 'assets'));
copyDir(path.join(__dirname, 'src', 'public'), DIST);

const seen = new Set();
for (const p of pages) {
  if (seen.has(p.path)) throw new Error(`Doppelter Pfad: ${p.path}`);
  seen.add(p.path);
  const file = p.path === '/' ? 'index.html' : p.path === '/404' ? '404.html' : `${p.path.slice(1)}.html`;
  const abs = path.join(DIST, file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, String(p.html));
}

// Linkprüfung: jeder interne Link muss auf eine Seite oder Datei zeigen
const extra = new Set(['/feed.xml', '/sitemap.xml', '/search-index.json', '/instruments.json', '/robots.txt', '/assets/styles.css', '/assets/app.js', '/assets/favicon.svg', '/manifest.webmanifest', config.newsletterAction].filter(Boolean));
const broken = new Map();
for (const p of pages) {
  const html = String(p.html);
  const re = /href="(\/[^"#?]*)/g; let m;
  while ((m = re.exec(html))) {
    const href = m[1].replace(/\/$/, '') || '/';
    if (seen.has(href) || extra.has(href) || href.startsWith('/assets/')) continue;
    if (!broken.has(href)) broken.set(href, p.path);
  }
}
if (broken.size) {
  console.error('Tote interne Links:');
  for (const [href, from] of broken) console.error(`  ${href}  (zuerst auf ${from})`);
  process.exit(1);
}

// Sitemap, Feed, Suchindex, Instrumentenliste
const staticPaths = pages.filter(p => p.path !== '/404' && !p.noindex).map(p => p.path);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticPaths.map(p => `  <url><loc>${config.domain}${p === '/' ? '' : p}</loc><lastmod>${util.isoDate(now)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'feed.xml'), components.rssFeed());
fs.writeFileSync(path.join(DIST, 'search-index.json'), JSON.stringify(components.searchIndex()));
fs.writeFileSync(path.join(DIST, 'instruments.json'), JSON.stringify(components.instrumentsJson()));
// Kurshistorien für den interaktiven Chart: ein JSON je Instrument (Tages-, Intraday-, Wochen- und Monatsreihen)
{
  const longPath = path.join(__dirname, 'src', 'data', 'history-long.json');
  const histLong = fs.existsSync(longPath) ? JSON.parse(fs.readFileSync(longPath, 'utf8')) : {};
  fs.mkdirSync(path.join(DIST, 'data', 'history'), { recursive: true });
  let n = 0;
  for (const inst of instruments.all) {
    const h = history[inst.slug], l = histLong[inst.slug] || {};
    if (!h && !l.w5y) continue;
    const qq = snapshot.quotes[inst.slug] || {};
    const doc = { slug: inst.slug, name: inst.name, currency: (h && h.currency) || l.currency || inst.currency || null, unit: inst.unit || null, asOf: config.quotesAsOf, source: config.dataSource || null, delay: util.delayLabel(qq.updateMode),
      series: { d1y: h ? h.points.map(p => [p[0], p[1]]) : null, i1d: l.i1d || null, w5y: l.w5y || null, mMax: l.mMax || null } };
    fs.writeFileSync(path.join(DIST, 'data', 'history', inst.slug + '.json'), JSON.stringify(doc)); n++;
  }
  console.log(`Kurshistorien: ${n} Instrumente → dist/data/history/`);
}

console.log(`${pages.length} Seiten gebaut → dist/  (Kurse Stand ${snapshot.asOf})`);

function clearDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    try { fs.rmSync(p, { recursive: true, force: true }); } catch (err) { if (e.isDirectory()) clearDir(p); }
  }
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
