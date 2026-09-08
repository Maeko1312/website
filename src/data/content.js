'use strict';
// Sammelt alle Inhalte (Artikel, Kalender, Wissen, Lexikon, IPOs) für den Build.
module.exports = function (ctx) {
  const categories = require('./categories');
  const authors = require('./authors');
  const glossary = require('./glossary');
  const calendar = require('./calendar')(ctx);
  const guides = require('./guides')(ctx);
  const articles = require('./articles')(ctx);
  const blog = require('./blog')(ctx);
  const tools = require('./tools')(ctx);
  const quiz = require('./quiz')(ctx);
  const featured = require('./featured'); // gesponserte Unternehmensporträts (Im Fokus)

  const content = {
    categories, authors, glossary: glossary.list, glossaryBySlug: glossary.bySlug, blog, tools, quiz,
    holidays: calendar.holidays, events: calendar.events, countries: calendar.countries, calendarRange: calendar.range,
    guides, articles, featured,
    searchablePages: [],
    poll: { id: 'p1', question: 'Wo steht der DAX am Jahresende?', options: ['Über 28.000 Punkten', 'Zwischen 25.000 und 28.000', 'Unter 25.000 Punkten'], counts: [412, 688, 297] },
    upcomingEvents(n) {
      const today = ctx.util.isoDate(ctx.now);
      const nowMin = ctx.now.getHours() * 60 + ctx.now.getMinutes();
      return calendar.events.filter(e => e.date > today || (e.date === today && (parseInt(e.time, 10) * 60 + parseInt(e.time.slice(3), 10)) >= nowMin)).filter(e => e.impact >= 2).slice(0, n);
    },
  };
  articles.forEach(a => { a.categoryObj = categories.bySlug[a.category]; if (!a.categoryObj) throw new Error(`Unbekannte Kategorie ${a.category} in ${a.slug}`); if (!authors.bySlug[a.author]) throw new Error(`Unbekannter Autor ${a.author}`); });
  // Themenfotos zuordnen (echte Fotos, freie Lizenzen; Bildnachweise unter /bildnachweise) – eigenes image-Feld hat Vorrang
  const photos = require('./photos');
  // redaktionelle Beiträge zuerst (präzise Motive), generierte Kursnotizen danach (weichen auf freie Motive aus)
  for (const a of [...articles.filter(x => !x.generated), ...articles.filter(x => x.generated)]) { if (a.image) continue; const p = photos.pick({ kind: 'article', slug: a.slug, category: a.category, instruments: a.instruments || [] }); if (p) { a.image = p.file; a.imageAlt = p.alt; a.imageCredit = photos.credit(p); } }
  const perTopic = {};
  for (const p of blog.posts) { if (p.image) continue; const i = perTopic[p.topic] || 0; perTopic[p.topic] = i + 1; const ph = photos.pick({ kind: 'post', topic: p.topic, index: i }); if (ph) { p.image = ph.file; p.imageAlt = ph.alt; p.imageCredit = photos.credit(ph); } }
  for (const g of guides) { if (g.image) continue; const ph = photos.pick({ kind: 'guide', slug: g.slug }); if (ph) { g.image = ph.file; g.imageAlt = ph.alt; g.imageCredit = photos.credit(ph); } }
  content.photos = photos;
  return content;
};
