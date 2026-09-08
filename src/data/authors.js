'use strict';
// Alle Beiträge erscheinen unter der Börsenblick-Redaktion. Presserechtlich Verantwortliche(r) wird vom Betreiber im Impressum benannt.
const list = [
  { slug: 'redaktion', name: 'Börsenblick-Redaktion', initials: 'BB', role: 'Redaktion', focus: 'Nachrichten, Marktberichte, Ratgeber', bio: 'Die Redaktion fasst Kursbewegungen und Termine zusammen. Marktberichte basieren auf den offiziellen Schlusskursen.', placeholder: false },
];
module.exports = { list, bySlug: Object.fromEntries(list.map(a => [a.slug, a])) };
