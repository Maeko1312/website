'use strict';
// Sammelt alle Inhalte (Artikel, Kalender, Wissen, Lexikon, IPOs) für den Build.
module.exports = function (ctx) {
  const categories = require('./categories');
  const authors = require('./authors');
  const glossary = require('./glossary');
  const calendar = require('./calendar')(ctx);
  const ipos = require('./ipos')(ctx);
  const guides = require('./guides')(ctx);
  const articles = require('./articles')(ctx);

  const content = {
    categories, authors, glossary: glossary.list, glossaryBySlug: glossary.bySlug,
    holidays: calendar.holidays, events: calendar.events, companyEvents: calendar.company, countries: calendar.countries, calendarRange: calendar.range,
    ipos, guides, articles,
    searchablePages: [],
    poll: { id: 'p1', question: 'Wo steht der DAX am Jahresende?', options: ['Über 28.000 Punkten', 'Zwischen 25.000 und 28.000', 'Unter 25.000 Punkten'], counts: [412, 688, 297] },
    upcomingEvents(n) {
      const today = ctx.util.isoDate(ctx.now);
      const nowMin = ctx.now.getHours() * 60 + ctx.now.getMinutes();
      return calendar.events.filter(e => e.date > today || (e.date === today && (parseInt(e.time, 10) * 60 + parseInt(e.time.slice(3), 10)) >= nowMin)).filter(e => e.impact >= 2).slice(0, n);
    },
  };
  articles.forEach(a => { a.categoryObj = categories.bySlug[a.category]; if (!a.categoryObj) throw new Error(`Unbekannte Kategorie ${a.category} in ${a.slug}`); if (!authors.bySlug[a.author]) throw new Error(`Unbekannter Autor ${a.author}`); });
  return content;
};
