// Lokaler Vorschau-Server, der Vercels cleanUrls-Verhalten nachbildet.
// Aufruf: node scripts/serve.js dist 3210
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || 3210);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'
};

function send(res, file, status) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(500); return res.end('error'); }
    res.writeHead(status || 200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/') && p !== '/') { res.writeHead(308, { Location: p.slice(0, -1) }); return res.end(); }
  if (p.endsWith('.html')) { res.writeHead(308, { Location: p.replace(/(index)?\.html$/, '') || '/' }); return res.end(); }
  const rel = p === '/' ? 'index.html' : p.slice(1);
  const candidates = [rel, rel + '.html', path.join(rel, 'index.html')].map(c => path.join(root, c));
  const hit = candidates.find(c => c.startsWith(root) && fs.existsSync(c) && fs.statSync(c).isFile());
  if (hit) return send(res, hit);
  const nf = path.join(root, '404.html');
  if (fs.existsSync(nf)) return send(res, nf, 404);
  res.writeHead(404); res.end('Not found');
}).listen(port, () => console.log(`Vorschau von ${root} auf http://localhost:${port}`));
