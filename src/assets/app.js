/* Börsenblick – Client-Skript. Kein Framework, keine externen Abhängigkeiten, keine Live-Datenabrufe. */
(function () {
  'use strict';
  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var store = {
    get: function (k, f) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat/blockiert */ } }
  };
  var fmt = {
    num: function (n, dg) { if (n == null || isNaN(n)) return '–'; return new Intl.NumberFormat('de-DE', { minimumFractionDigits: dg == null ? 2 : dg, maximumFractionDigits: dg == null ? 2 : dg }).format(n); },
    pct: function (n) { if (n == null || isNaN(n)) return '–'; var s = n > 0 ? '+' : n < 0 ? '−' : '±'; return s + fmt.num(Math.abs(n)) + ' %'; }
  };

  /* ---------- Kopfzeile: Datum & Uhr ---------- */
  function clock() {
    var el = $('[data-clock]'); if (!el) return;
    var days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
    function tick() {
      var n = new Date();
      var p = function (x) { return (x < 10 ? '0' : '') + x; };
      el.textContent = days[n.getDay()] + ' ' + p(n.getDate()) + '.' + p(n.getMonth() + 1) + '.' + n.getFullYear() + ' · ' + p(n.getHours()) + ':' + p(n.getMinutes()) + ' Uhr';
    }
    tick(); setInterval(tick, 15000);
    // Börsenstatus Xetra (9:00–17:30 Uhr, Mo–Fr, Feiertage aus data-Attribut)
    var st = $('[data-market-status]'); if (!st) return;
    var holidays = (st.getAttribute('data-holidays') || '').split(',');
    function status() {
      var now = new Date();
      var berlin = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
      var iso = berlin.getFullYear() + '-' + (berlin.getMonth() < 9 ? '0' : '') + (berlin.getMonth() + 1) + '-' + (berlin.getDate() < 10 ? '0' : '') + berlin.getDate();
      var wd = berlin.getDay(), mins = berlin.getHours() * 60 + berlin.getMinutes();
      var open = wd >= 1 && wd <= 5 && holidays.indexOf(iso) < 0 && mins >= 540 && mins < 1050;
      st.textContent = open ? 'Xetra geöffnet' : 'Xetra geschlossen';
      st.classList.toggle('is-open', open);
    }
    status(); setInterval(status, 60000);
  }

  /* ---------- Navigation ---------- */
  function nav() {
    var toggle = $('[data-nav-toggle]'), panel = $('[data-nav-panel]');
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        var open = panel.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        d.documentElement.classList.toggle('nav-open', open);
        toggle.querySelector('.burger-label').textContent = open ? 'Schließen' : 'Menü';
      });
    }
    // Mega-Menü: auf Touch/Klick öffnen, Hover per CSS
    $$('[data-menu]').forEach(function (item) {
      var btn = $('[data-menu-btn]', item);
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        // Mit Maus: Menü öffnet per Hover, Klick führt zur Bereichsseite
        if (window.matchMedia('(hover: hover)').matches && btn.getAttribute('data-href')) { location.href = btn.getAttribute('data-href'); return; }
        var open = item.classList.contains('is-open');
        $$('[data-menu].is-open').forEach(function (o) { o.classList.remove('is-open'); $('[data-menu-btn]', o).setAttribute('aria-expanded', 'false'); });
        if (!open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
    d.addEventListener('click', function (e) {
      if (!e.target.closest('[data-menu]')) $$('[data-menu].is-open').forEach(function (o) { o.classList.remove('is-open'); $('[data-menu-btn]', o).setAttribute('aria-expanded', 'false'); });
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        $$('[data-menu].is-open').forEach(function (o) { o.classList.remove('is-open'); });
        if (panel && panel.classList.contains('is-open')) toggle.click();
        closeSearch();
      }
    });
    // Mobile Akkordeon im Menü-Panel
    $$('[data-acc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        var body = d.getElementById(btn.getAttribute('aria-controls'));
        if (body) body.hidden = open;
      });
    });
  }

  /* ---------- Suche ---------- */
  var index = null, indexPromise = null;
  function loadIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (j) { index = j; return j; }).catch(function () { return []; });
    return indexPromise;
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'); }
  function search(q, limit) {
    if (!index) return [];
    var nq = norm(q).trim(); if (nq.length < 2) return [];
    var terms = nq.split(/\s+/);
    var scored = [];
    index.forEach(function (it) {
      var hay = norm(it.t + ' ' + (it.k || '') + ' ' + (it.d || ''));
      var alist = it.a ? norm(it.a).split(/\s*,\s*/) : [], al = alist.join(', ');
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        if (alist.length && (alist.indexOf(nq) >= 0 || alist.indexOf(t) >= 0)) score += 9;
        else if (al && al.indexOf(t) >= 0) score += 5;
        else if (norm(it.t).indexOf(t) === 0) score += 6;
        else if (norm(it.t).indexOf(t) >= 0) score += 4;
        else if ((it.k && norm(it.k).indexOf(t) >= 0)) score += 3;
        else if (hay.indexOf(t) >= 0) score += 1;
        else { score = 0; break; }
      }
      if (score > 0) scored.push({ it: it, s: score + (it.w || 0) });
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, limit || 8).map(function (x) { return x.it; });
  }
  /* Exakter Alias- oder Titeltreffer: direkt zur Seite (z. B. „tools“ → /werkzeuge) */
  function directHit(q) {
    if (!index) return null;
    var nq = norm(q).trim(); if (!nq) return null;
    for (var i = 0; i < index.length; i++) {
      var it = index[i];
      if (it.a && norm(it.a).split(/\s*,\s*/).indexOf(nq) >= 0) return it;
    }
    for (var j = 0; j < index.length; j++) { if (norm(index[j].t) === nq) return index[j]; }
    return null;
  }
  var typeLabel = { article: 'Nachricht', blog: 'Blog', stock: 'Aktie', index: 'Index', commodity: 'Rohstoff', fx: 'Devisen', crypto: 'Krypto', bond: 'Anleihe', term: 'Lexikon', page: 'Seite', guide: 'Wissen' };
  function closeSearch() { $$('[data-search-results]').forEach(function (r) { r.hidden = true; r.innerHTML = ''; }); }
  function headerSearch() {
    $$('[data-search]').forEach(function (form) {
      var input = $('input[type="search"]', form), results = $('[data-search-results]', form);
      if (!input || !results) return;
      input.addEventListener('focus', loadIndex);
      var lastQ = '';
      input.addEventListener('input', function () {
        var q = input.value; lastQ = q;
        loadIndex().then(function () {
          if (q !== lastQ) return;
          var hits = search(q, 8);
          if (!hits.length) { results.hidden = true; results.innerHTML = ''; return; }
          results.innerHTML = hits.map(function (h) {
            return '<a class="search-hit" href="' + h.u + '"><span class="search-hit-type">' + (typeLabel[h.y] || h.y) + '</span><span class="search-hit-title">' + escapeHtml(h.t) + '</span>' + (h.k ? '<span class="search-hit-meta">' + escapeHtml(h.k) + '</span>' : '') + '</a>';
          }).join('') + '<a class="search-hit search-hit-all" href="/suche?q=' + encodeURIComponent(q) + '">Alle Treffer für „' + escapeHtml(q) + '“ anzeigen</a>';
          results.hidden = false;
        });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = input.value.trim(); if (!q) return;
        loadIndex().then(function () { var hit = directHit(q); location.href = hit ? hit.u : '/suche?q=' + encodeURIComponent(q); });
      });
      d.addEventListener('click', function (e) { if (!form.contains(e.target)) { results.hidden = true; } });
    });
  }
  function searchPage() {
    var host = $('[data-search-page]'); if (!host) return;
    var params = new URLSearchParams(location.search);
    var q = params.get('q') || '';
    var input = $('[data-search-page-input]');
    var out = $('[data-search-page-results]');
    var title = $('[data-search-page-title]');
    if (input) input.value = q;
    function run(query) {
      loadIndex().then(function () {
        var hits = search(query, 60);
        if (title) title.textContent = query ? (hits.length ? hits.length + ' Treffer für „' + query + '“' : 'Keine Treffer für „' + query + '“') : 'Suche';
        if (!query) { out.innerHTML = ''; return; }
        if (!hits.length) {
          out.innerHTML = '<div class="empty"><p>Dazu haben wir nichts gefunden. Tipps: kürzere Begriffe, Aktienname statt WKN, oder stöbern Sie in den <a href="/nachrichten">Nachrichten</a> und im <a href="/wissen/boersenlexikon">Börsenlexikon</a>.</p></div>';
          return;
        }
        var groups = {};
        hits.forEach(function (h) { (groups[h.y] = groups[h.y] || []).push(h); });
        var order = ['stock', 'index', 'commodity', 'fx', 'crypto', 'bond', 'article', 'blog', 'guide', 'term', 'page'];
        var plural = { stock: 'Aktien', index: 'Indizes', commodity: 'Rohstoffe', fx: 'Devisen', crypto: 'Krypto', bond: 'Anleihen', article: 'Nachrichten', blog: 'Blog', guide: 'Wissen', term: 'Lexikon', page: 'Seiten' };
        var dh = directHit(query);
        out.innerHTML = (dh ? '<p class="search-direct">Direkt zur Seite: <a href="' + dh.u + '">' + escapeHtml(dh.t) + '</a></p>' : '') + order.filter(function (k) { return groups[k]; }).map(function (k) {
          return '<section class="search-group"><h2 class="section-title"><span>' + (groups[k].length > 1 ? plural[k] : typeLabel[k]) + '</span></h2><ul class="result-list">' +
            groups[k].map(function (h) { return '<li><a href="' + h.u + '"><strong>' + escapeHtml(h.t) + '</strong>' + (h.k ? ' <span class="muted">· ' + escapeHtml(h.k) + '</span>' : '') + (h.d ? '<span class="result-desc">' + escapeHtml(h.d) + '</span>' : '') + '</a></li>'; }).join('') + '</ul></section>';
        }).join('');
      });
    }
    run(q);
    var form = host.querySelector('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value.trim(); history.replaceState(null, '', '/suche' + (v ? '?q=' + encodeURIComponent(v) : '')); run(v); });
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- Tabs ---------- */
  function tabs() {
    $$('[data-tabs]').forEach(function (group) {
      var btns = $$('[data-tab]', group);
      var scope = group.getAttribute('data-tabs');
      var panels = $$('[data-panel]', scope ? d.getElementById(scope) || group : group);
      function activate(name, push) {
        btns.forEach(function (b) { var on = b.getAttribute('data-tab') === name; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.setAttribute('tabindex', on ? '0' : '-1'); });
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== name; });
        if (push && group.hasAttribute('data-tabs-hash')) history.replaceState(null, '', '#' + name);
      }
      btns.forEach(function (b) { b.addEventListener('click', function () { activate(b.getAttribute('data-tab'), true); }); });
      group.addEventListener('keydown', function (e) {
        var i = btns.indexOf(d.activeElement); if (i < 0) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length]; n.focus(); n.click(); }
      });
      var initial = (group.hasAttribute('data-tabs-hash') && location.hash && btns.some(function (b) { return b.getAttribute('data-tab') === location.hash.slice(1); })) ? location.hash.slice(1) : (btns.filter(function (b) { return b.classList.contains('is-active'); })[0] || btns[0]).getAttribute('data-tab');
      activate(initial, false);
    });
  }

  /* ---------- Sortierbare Tabellen ---------- */
  function sortable() {
    $$('table[data-sortable]').forEach(function (table) {
      var ths = $$('thead th', table);
      ths.forEach(function (th, idx) {
        if (th.hasAttribute('data-nosort')) return;
        var btn = d.createElement('button'); btn.type = 'button'; btn.className = 'th-sort'; btn.innerHTML = th.innerHTML + '<span class="th-arrow" aria-hidden="true"></span>';
        th.innerHTML = ''; th.appendChild(btn);
        btn.addEventListener('click', function () {
          var dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
          ths.forEach(function (t) { t.removeAttribute('aria-sort'); });
          th.setAttribute('aria-sort', dir);
          var tbody = $('tbody', table), rows = $$('tr', tbody);
          var numeric = rows.every(function (r) { var c = r.children[idx]; return c && c.hasAttribute('data-v'); });
          rows.sort(function (a, b) {
            var ca = a.children[idx], cb = b.children[idx];
            var va = numeric ? parseFloat(ca.getAttribute('data-v')) : ca.textContent.trim();
            var vb = numeric ? parseFloat(cb.getAttribute('data-v')) : cb.textContent.trim();
            if (numeric) { if (isNaN(va)) va = -Infinity; if (isNaN(vb)) vb = -Infinity; return dir === 'ascending' ? va - vb : vb - va; }
            return dir === 'ascending' ? va.localeCompare(vb, 'de') : vb.localeCompare(va, 'de');
          });
          rows.forEach(function (r) { tbody.appendChild(r); });
        });
      });
    });
  }

  /* ---------- Filter (Aktien A–Z, Lexikon) ---------- */
  function filters() {
    $$('[data-filter-input]').forEach(function (input) {
      var target = d.getElementById(input.getAttribute('data-filter-input'));
      if (!target) return;
      var items = $$('[data-filter-item]', target);
      var counter = $('[data-filter-count="' + input.getAttribute('data-filter-input') + '"]');
      var empty = $('[data-filter-empty="' + input.getAttribute('data-filter-input') + '"]');
      function apply() {
        var q = norm(input.value).trim(); var n = 0;
        items.forEach(function (it) { var show = !q || norm(it.getAttribute('data-filter-item') + ' ' + it.textContent).indexOf(q) >= 0; it.hidden = !show; if (show) n++; });
        $$('[data-filter-group]', target).forEach(function (g) { g.hidden = !$$('[data-filter-item]:not([hidden])', g).length; });
        if (counter) counter.textContent = n;
        if (empty) empty.hidden = n > 0;
      }
      input.addEventListener('input', apply);
    });
    // Chip-Filter (z. B. Kalender-Impact/Land, Nachrichten-Kategorie)
    $$('[data-chipfilter]').forEach(function (group) {
      var targetId = group.getAttribute('data-chipfilter');
      var target = d.getElementById(targetId); if (!target) return;
      var attr = group.getAttribute('data-chipfilter-attr') || 'data-cat';
      var chips = $$('[data-chip]', group);
      var multi = group.hasAttribute('data-multi');
      function apply() {
        var active = chips.filter(function (c) { return c.classList.contains('is-active'); }).map(function (c) { return c.getAttribute('data-chip'); });
        var all = active.indexOf('all') >= 0 || !active.length;
        $$('[' + attr + ']', target).forEach(function (row) {
          var v = row.getAttribute(attr).split(' ');
          row.hidden = !all && !v.some(function (x) { return active.indexOf(x) >= 0; });
        });
        $$('[data-filter-group]', target).forEach(function (g) {
          var visible = $$('[' + attr + ']:not([hidden])', g).length;
          var emptyRow = $('[data-group-empty]', g);
          if (emptyRow) emptyRow.hidden = visible > 0;
        });
        var cnt = $('[data-chipfilter-count="' + targetId + '"]');
        if (cnt) cnt.textContent = $$('[' + attr + ']:not([hidden])', target).length;
      }
      chips.forEach(function (c) {
        c.addEventListener('click', function () {
          if (multi) {
            if (c.getAttribute('data-chip') === 'all') { chips.forEach(function (x) { x.classList.toggle('is-active', x === c); }); }
            else { c.classList.toggle('is-active'); var allChip = chips.filter(function (x) { return x.getAttribute('data-chip') === 'all'; })[0]; if (allChip) allChip.classList.remove('is-active'); if (!chips.some(function (x) { return x.classList.contains('is-active'); }) && allChip) allChip.classList.add('is-active'); }
          } else { chips.forEach(function (x) { x.classList.toggle('is-active', x === c); }); }
          chips.forEach(function (x) { x.setAttribute('aria-pressed', x.classList.contains('is-active') ? 'true' : 'false'); });
          apply();
        });
      });
      apply();
    });
  }

  /* ---------- Merkliste (lokal im Browser) ---------- */
  var WL_KEY = 'bb.watchlist';
  function watchlist() {
    var list = store.get(WL_KEY, []);
    function isIn(slug) { return list.indexOf(slug) >= 0; }
    function paint(btn) {
      var on = isIn(btn.getAttribute('data-watch'));
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var lbl = $('.watch-label', btn); if (lbl) lbl.textContent = on ? 'Auf der Merkliste' : 'Auf Merkliste';
    }
    $$('[data-watch]').forEach(function (btn) {
      paint(btn);
      btn.addEventListener('click', function () {
        var slug = btn.getAttribute('data-watch');
        if (isIn(slug)) list = list.filter(function (s) { return s !== slug; }); else list.push(slug);
        store.set(WL_KEY, list);
        $$('[data-watch="' + slug + '"]').forEach(paint);
        updateCount();
        toast(isIn(slug) ? 'Zur Merkliste hinzugefügt' : 'Von der Merkliste entfernt');
        d.dispatchEvent(new CustomEvent('bb:watchlist'));
      });
    });
    function updateCount() { $$('[data-watch-count]').forEach(function (el) { el.textContent = list.length; el.hidden = !list.length; }); }
    updateCount();
    // Merkliste-Seite
    var host = $('[data-watchlist-page]'); if (!host) return;
    var tbody = $('[data-watchlist-rows]', host), emptyEl = $('[data-watchlist-empty]', host), tableWrap = $('[data-watchlist-table]', host);
    function renderList() {
      if (!list.length) { emptyEl.hidden = false; tableWrap.hidden = true; return; }
      emptyEl.hidden = true; tableWrap.hidden = false;
      fetch('/instruments.json').then(function (r) { return r.json(); }).then(function (all) {
        var map = {}; all.forEach(function (i) { map[i.slug] = i; });
        tbody.innerHTML = list.map(function (slug) {
          var i = map[slug]; if (!i) return '';
          var cls = i.changePct > 0 ? 'up' : i.changePct < 0 ? 'down' : '';
          return '<tr><td><a href="' + i.url + '"><strong>' + escapeHtml(i.name) + '</strong></a><span class="muted small block">' + escapeHtml(i.typeLabel) + (i.isin ? ' · ' + i.isin : '') + '</span></td>' +
            '<td class="num">' + fmt.num(i.price, i.digits) + (i.unit ? ' <span class="muted">' + escapeHtml(i.unit) + '</span>' : '') + '</td>' +
            '<td class="num ' + cls + '">' + fmt.pct(i.changePct) + '</td>' +
            '<td class="num ' + (i.perfYtd > 0 ? 'up' : i.perfYtd < 0 ? 'down' : '') + '">' + fmt.pct(i.perfYtd) + '</td>' +
            '<td class="right"><button type="button" class="btn btn-ghost btn-sm" data-watch-remove="' + slug + '">Entfernen</button></td></tr>';
        }).join('');
        $$('[data-watch-remove]', tbody).forEach(function (b) {
          b.addEventListener('click', function () { list = list.filter(function (s) { return s !== b.getAttribute('data-watch-remove'); }); store.set(WL_KEY, list); updateCount(); renderList(); });
        });
      });
    }
    renderList();
    d.addEventListener('bb:watchlist', renderList);
    var clear = $('[data-watchlist-clear]', host);
    if (clear) clear.addEventListener('click', function () { if (confirm('Merkliste wirklich leeren?')) { list = []; store.set(WL_KEY, list); updateCount(); renderList(); } });
  }

  /* ---------- Zuletzt gelesen ---------- */
  var RECENT_KEY = 'bb.recent';
  function recent() {
    var art = $('[data-article]');
    var list = store.get(RECENT_KEY, []);
    if (art) {
      var entry = { u: location.pathname, t: art.getAttribute('data-article'), c: art.getAttribute('data-article-cat') || '' };
      list = [entry].concat(list.filter(function (e) { return e.u !== entry.u; })).slice(0, 6);
      store.set(RECENT_KEY, list);
    }
    var host = $('[data-recent]'); if (!host) return;
    var items = list.filter(function (e) { return e.u !== location.pathname; }).slice(0, 5);
    if (!items.length) { host.hidden = true; return; }
    $('[data-recent-list]', host).innerHTML = items.map(function (e) { return '<li><a href="' + e.u + '">' + (e.c ? '<span class="kicker">' + escapeHtml(e.c) + '</span>' : '') + '<span>' + escapeHtml(e.t) + '</span></a></li>'; }).join('');
    host.hidden = false;
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); if (!t) { t = d.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); d.body.appendChild(t); }
    t.textContent = msg; t.classList.add('is-visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 2200);
  }

  /* ---------- Newsletter ---------- */
  var SUB_KEY = 'bb.subscribed', BAR_KEY = 'bb.nlbar', MODAL_KEY = 'bb.nlmodal';
  var WEEK = 7 * 86400000;
  function newsletter() {
    $$('form[data-newsletter]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        var email = $('input[type="email"]', form);
        if (!email || !email.checkValidity()) { e.preventDefault(); email && email.reportValidity(); return; }
        var consent = $('input[type="checkbox"][required]', form);
        if (consent && !consent.checked) { e.preventDefault(); consent.reportValidity(); return; }
        var action = form.getAttribute('action');
        if (action && action !== '#') { store.set(SUB_KEY, Date.now()); return; /* normaler POST an den Versanddienst */ }
        e.preventDefault();
        // Kein Versanddienst verbunden: ehrlich sagen, Alternative anbieten
        var note = $('[data-newsletter-note]', form);
        if (note) { note.hidden = false; note.focus(); }
        else { toast('Die Newsletter-Anmeldung wird gerade eingerichtet.'); }
      });
    });
  }
  /* Slide-in-Leiste auf Lese-Seiten (nach 45 % Scrolltiefe), einmal pro Woche nach Schließen */
  function nlBar() {
    var bar = $('[data-nl-bar]'); if (!bar || !d.body.hasAttribute('data-reading')) return;
    if (store.get(SUB_KEY, 0)) return;
    var dismissed = store.get(BAR_KEY, 0); if (dismissed && Date.now() - dismissed < WEEK) return;
    var shown = false;
    function chk() {
      if (shown) return;
      var art = $('[data-article]'); if (!art) return;
      var r = art.getBoundingClientRect(); var total = r.height - window.innerHeight;
      var p = total > 0 ? -r.top / total : 1;
      if (p > 0.45) { shown = true; bar.hidden = false; setTimeout(function () { bar.classList.add('is-visible'); d.documentElement.classList.add('nlbar-open'); }, 30); window.removeEventListener('scroll', chk); }
    }
    window.addEventListener('scroll', chk, { passive: true });
    $$('[data-nl-bar-close]', bar).forEach(function (b) { b.addEventListener('click', function () { bar.classList.remove('is-visible'); d.documentElement.classList.remove('nlbar-open'); store.set(BAR_KEY, Date.now()); setTimeout(function () { bar.hidden = true; }, 400); }); });
  }
  /* Exit-Intent-Dialog: Mauszeiger verlässt das Fenster nach oben (Desktop), einmal pro Woche */
  function nlModal() {
    var modal = $('[data-nl-modal]'); if (!modal) return;
    if (store.get(SUB_KEY, 0)) return;
    var last = store.get(MODAL_KEY, 0); if (last && Date.now() - last < WEEK) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    var armed = false; setTimeout(function () { armed = true; }, 8000);
    function open() {
      if (!armed || modal.classList.contains('is-open')) return;
      if ($('[data-nav-panel].is-open') || $('[data-search-results]:not([hidden])')) return;
      modal.hidden = false; modal.classList.add('is-open'); d.documentElement.classList.add('modal-open');
      store.set(MODAL_KEY, Date.now());
      var inp = $('input[type="email"]', modal); if (inp) setTimeout(function () { inp.focus(); }, 50);
      d.removeEventListener('mouseout', onOut);
    }
    function close() { modal.classList.remove('is-open'); d.documentElement.classList.remove('modal-open'); setTimeout(function () { modal.hidden = true; }, 50); }
    function onOut(e) { if (!e.relatedTarget && e.clientY <= 0) open(); }
    d.addEventListener('mouseout', onOut);
    $$('[data-nl-modal-close]', modal).forEach(function (b) { b.addEventListener('click', close); });
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
  }

  /* ---------- Rechner ---------- */
  function calculators() {
    $$('[data-calc]').forEach(function (form) {
      var type = form.getAttribute('data-calc');
      var out = $('[data-calc-out]', form);
      var read = function (n) { var el = form.elements[n]; if (!el) return NaN; return parseFloat(String(el.value).replace(/\./g, '').replace(',', '.')); };
      var row = function (l, v, big) { return '<div class="calc-row' + (big ? ' is-big' : '') + '"><span>' + l + '</span><strong>' + v + '</strong></div>'; };
      var eur = function (n) { return fmt.num(n, 2) + ' €'; };
      function run() {
        var html = '';
        if (type === 'zinseszins') {
          var start = read('start') || 0, rate = read('rate') || 0, yrs = read('years') || 0, r = (read('interest') || 0) / 100;
          var total = start * Math.pow(1 + r, yrs), paid = start;
          for (var i = 0; i < yrs * 12; i++) { var m = Math.pow(1 + r, 1 / 12) - 1; total += rate * Math.pow(1 + m, yrs * 12 - i - 1); paid += rate; }
          html = row('Endkapital nach ' + yrs + ' Jahren', eur(total), true) + row('Eingezahlt', eur(paid)) + row('Davon Zinsen und Kursgewinne', eur(total - paid)) + row('Anteil der Erträge am Endkapital', fmt.num(total ? (total - paid) / total * 100 : 0, 1) + ' %');
        } else if (type === 'rendite') {
          var buy = read('buy'), sell = read('sell'), qty = read('qty') || 1, fees = read('fees') || 0, hold = read('hold') || 1;
          var gross = (sell - buy) * qty, net = gross - fees, pct = buy ? net / (buy * qty) * 100 : 0;
          var annual = hold > 0 && buy ? (Math.pow(1 + net / (buy * qty), 1 / hold) - 1) * 100 : 0;
          html = row('Gewinn/Verlust nach Kosten', eur(net), true) + row('Rendite gesamt', fmt.pct(pct)) + row('Rendite pro Jahr (annualisiert)', fmt.pct(annual)) + row('Kapitaleinsatz', eur(buy * qty)) + '<p class="calc-note">Ohne Steuern. Auf Kursgewinne fallen in Deutschland 25 % Abgeltungsteuer plus Solidaritätszuschlag an, Sparer-Pauschbetrag 1.000 € pro Jahr.</p>';
        } else if (type === 'dividende') {
          var price = read('price'), div = read('div'), shares = read('shares') || 1, growth = (read('growth') || 0) / 100, years = read('years') || 10;
          var yld = price ? div / price * 100 : 0, sum = 0, cur = div;
          for (var y = 0; y < years; y++) { sum += cur * shares; cur *= 1 + growth; }
          html = row('Dividendenrendite', fmt.num(yld, 2) + ' %', true) + row('Jährliche Dividende (brutto)', eur(div * shares)) + row('Nach Abgeltungsteuer (26,375 %)', eur(div * shares * (1 - 0.26375))) + row('Summe über ' + years + ' Jahre bei ' + fmt.num(growth * 100, 1) + ' % Wachstum', eur(sum));
        } else if (type === 'waehrung') {
          var amt = read('amount') || 0, rate2 = read('rate') || 0, dir = form.elements['dir'] ? form.elements['dir'].value : 'eur2';
          var res = dir === 'eur2' ? amt * rate2 : (rate2 ? amt / rate2 : 0);
          html = row(dir === 'eur2' ? 'Ergebnis in Fremdwährung' : 'Ergebnis in Euro', fmt.num(res, 2), true) + row('Verwendeter Kurs', fmt.num(rate2, 4)) + '<p class="calc-note">Referenzkurs ohne Bankspanne. Beim Umtausch fallen in der Praxis Aufschläge von 1–3 % an.</p>';
        } else if (type === 'position') {
          var capital = read('capital') || 0, riskPct = (read('risk') || 0) / 100, entry = read('entry'), stop = read('stop');
          var riskPerShare = Math.abs(entry - stop), riskAmt = capital * riskPct, n = riskPerShare ? Math.floor(riskAmt / riskPerShare) : 0;
          html = row('Stückzahl', fmt.num(n, 0), true) + row('Positionsgröße', eur(n * entry)) + row('Risiko in Euro', eur(riskAmt)) + row('Abstand zum Stop', fmt.num(entry ? riskPerShare / entry * 100 : 0, 2) + ' %') + row('Anteil am Depot', fmt.num(capital ? n * entry / capital * 100 : 0, 1) + ' %');
        } else if (type === 'inflation') {
          var amount = read('amount') || 0, infl = (read('inflation') || 0) / 100, yrs2 = read('years') || 0;
          var real = amount / Math.pow(1 + infl, yrs2);
          html = row('Kaufkraft in ' + yrs2 + ' Jahren', eur(real), true) + row('Kaufkraftverlust', eur(amount - real)) + row('Verlust in Prozent', fmt.num(amount ? (1 - real / amount) * 100 : 0, 1) + ' %') + row('Nötiger Betrag für gleiche Kaufkraft', eur(amount * Math.pow(1 + infl, yrs2)));
        } else if (type === 'sparplan') {
          var monthly = read('rate') || 0, yrs3 = read('years') || 0, ret = (read('return') || 0) / 100, cost = (read('cost') || 0) / 100;
          var m2 = Math.pow(1 + ret - cost, 1 / 12) - 1, val = 0;
          for (var k = 0; k < yrs3 * 12; k++) val = (val + monthly) * (1 + m2);
          var paid2 = monthly * yrs3 * 12;
          html = row('Depotwert nach ' + yrs3 + ' Jahren', eur(val), true) + row('Eingezahlt', eur(paid2)) + row('Wertzuwachs', eur(val - paid2)) + row('Angenommene Rendite nach Kosten', fmt.num((ret - cost) * 100, 2) + ' % p. a.');
        }
        out.innerHTML = html;
      }
      form.addEventListener('input', run);
      form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
      run();
    });
  }

  /* ---------- Kalender-Wochennavigation ---------- */
  function weeks() {
    $$('[data-weeks]').forEach(function (host) {
      var panels = $$('[data-week]', host), i = 0;
      panels.forEach(function (p, k) { if (p.hasAttribute('data-week-current')) i = k; });
      var label = $('[data-week-label]', host), prev = $('[data-week-prev]', host), next = $('[data-week-next]', host);
      function show() {
        panels.forEach(function (p, k) { p.hidden = k !== i; });
        if (label) label.textContent = panels[i].getAttribute('data-week-label');
        if (prev) prev.disabled = i === 0;
        if (next) next.disabled = i === panels.length - 1;
      }
      if (prev) prev.addEventListener('click', function () { if (i > 0) { i--; show(); } });
      if (next) next.addEventListener('click', function () { if (i < panels.length - 1) { i++; show(); } });
      show();
    });
  }

  /* ---------- Umfrage (lokal) ---------- */
  function poll() {
    $$('[data-poll]').forEach(function (host) {
      var id = host.getAttribute('data-poll'), key = 'bb.poll.' + id;
      var voted = store.get(key, null);
      var opts = $$('[data-poll-option]', host);
      var counts = JSON.parse(host.getAttribute('data-poll-counts') || '[]');
      function show() {
        var total = counts.reduce(function (a, b) { return a + b; }, 0) || 1;
        opts.forEach(function (o, k) {
          var p = Math.round(counts[k] / total * 100);
          o.classList.add('is-result'); o.disabled = true;
          o.classList.toggle('is-chosen', voted === k);
          $('.poll-bar', o).style.width = p + '%';
          $('.poll-pct', o).textContent = p + ' %';
        });
        var note = $('[data-poll-note]', host); if (note) { note.hidden = false; note.textContent = total + ' Stimmen · Danke für Ihre Teilnahme'; }
      }
      if (voted !== null) show();
      opts.forEach(function (o, k) {
        o.addEventListener('click', function () { if (voted !== null) return; voted = k; counts[k]++; store.set(key, k); show(); });
      });
    });
  }

  /* ---------- Quiz ---------- */
  function quiz() {
    $$('[data-quiz]').forEach(function (host) {
      var qs; try { qs = JSON.parse(host.getAttribute('data-quiz-questions')); } catch (e) { return; }
      var key = 'bb.quiz.' + host.getAttribute('data-quiz');
      var body = $('[data-quiz-body]', host), prog = $('[data-quiz-progress]', host);
      var i = 0, score = 0, done = store.get(key, null);
      function esc(s) { return escapeHtml(s); }
      function render() {
        var q = qs[i];
        prog.textContent = 'Frage ' + (i + 1) + ' von ' + qs.length;
        body.innerHTML = '<p class="quiz-q">' + esc(q.q) + '</p><div class="quiz-options">' + q.o.map(function (o, k) { return '<button type="button" class="quiz-option" data-quiz-option="' + k + '"><span>' + esc(o) + '</span></button>'; }).join('') + '</div>';
        $$('[data-quiz-option]', body).forEach(function (b) { b.addEventListener('click', function () { answer(parseInt(b.getAttribute('data-quiz-option'), 10)); }); });
      }
      function answer(k) {
        var q = qs[i]; var right = k === q.a; if (right) score++;
        $$('[data-quiz-option]', body).forEach(function (b, idx) { b.disabled = true; if (idx === q.a) b.classList.add('is-right'); else if (idx === k) b.classList.add('is-wrong'); });
        var box = d.createElement('div'); box.className = 'quiz-expl ' + (right ? 'is-right' : 'is-wrong');
        box.innerHTML = '<strong>' + (right ? 'Richtig.' : 'Leider nein.') + '</strong> ' + esc(q.e) + '<button type="button" class="btn btn-dark btn-sm" data-quiz-next>' + (i < qs.length - 1 ? 'Nächste Frage' : 'Ergebnis anzeigen') + '</button>';
        body.appendChild(box);
        $('[data-quiz-next]', box).addEventListener('click', function () { i++; if (i < qs.length) render(); else finish(); });
      }
      function finish() {
        store.set(key, score);
        prog.textContent = 'Ergebnis';
        var msg = score === qs.length ? 'Alle richtig – Sie kennen die Börse.' : score >= 3 ? 'Solide. Die Lücken schließt das Börsenlexikon.' : 'Ein guter Anlass für die Einsteiger-Ratgeber.';
        body.innerHTML = '<p class="quiz-result"><strong>' + score + ' von ' + qs.length + '</strong> richtig</p><p class="quiz-msg">' + msg + '</p><div class="quiz-actions"><a class="btn btn-teal btn-sm" href="/newsletter">Jeden Morgen dazulernen</a><button type="button" class="btn btn-ghost btn-sm" data-quiz-restart>Nochmal</button><a class="btn btn-ghost btn-sm" href="/wissen/boersenlexikon">Lexikon</a></div>';
        $('[data-quiz-restart]', body).addEventListener('click', function () { i = 0; score = 0; render(); });
      }
      if (done !== null) { score = done; finish(); } else { render(); }
    });
  }

  /* ---------- Cookie-Hinweis (nur technisch notwendige) ---------- */
  function cookieNote() {
    var el = $('[data-cookie-note]'); if (!el) return;
    if (store.get('bb.cookienote', false)) { el.remove(); return; }
    el.hidden = false;
    $('[data-cookie-ok]', el).addEventListener('click', function () { store.set('bb.cookienote', true); el.remove(); });
  }

  /* ---------- Teilen ---------- */
  function share() {
    $$('[data-share]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var data = { title: d.title, url: location.href };
        if (navigator.share) { navigator.share(data).catch(function () { }); }
        else if (navigator.clipboard) { navigator.clipboard.writeText(location.href).then(function () { toast('Link kopiert'); }); }
      });
    });
  }

  /* ---------- Bewegung: Ladebalken beim Seitenwechsel + Scroll-Reveal ---------- */
  function motion() {
    var root = d.documentElement;
    window.BB_MOTION = true;
    var leaveTimer;
    function leaving() { root.classList.add('is-leaving'); clearTimeout(leaveTimer); leaveTimer = setTimeout(function () { root.classList.remove('is-leaving'); }, 8000); }
    d.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download') || (a.getAttribute('href') || '').charAt(0) === '#') return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.search === location.search && u.hash) return;
      leaving();
    });
    d.addEventListener('submit', function (e) { if (!e.defaultPrevented && e.target.method !== 'dialog') leaving(); });
    window.addEventListener('pageshow', function () { root.classList.remove('is-leaving'); });
    if (!root.classList.contains('reveal-on') || !('IntersectionObserver' in window)) return;
    /* Liste identisch mit styles.css (Abschnitt "Bewegung") */
    var sel = '.card, .post-card, .story-card, .guide-card, .tool-card, .board-item, .number-tile, .nl-banner, .facts, .summary, .article-hero, .post-list > li';
    var excl = '.hero-side, .mega, .nav-panel, .nl-modal, .nl-bar, .search-results';
    var els = [];
    $$(sel).forEach(function (el) { if (el.closest(excl)) return; if (el.closest('[hidden]')) { el.classList.add('is-in'); el.classList.add('is-done'); return; } els.push(el); });
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (en) { return en.isIntersecting; }).sort(function (a, b) { return (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left); });
      batch.forEach(function (en, i) {
        var el = en.target; io.unobserve(el);
        el.style.transitionDelay = Math.min(i, 6) * 60 + 'ms';
        el.classList.add('is-in');
        var done = function (ev) { if (ev && ev.target !== el) return; el.classList.add('is-done'); el.style.transitionDelay = ''; el.removeEventListener('transitionend', done); };
        el.addEventListener('transitionend', done);
        setTimeout(done, 1300);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Seitenleiste: folgt dem Scrollen; hohe Leisten laufen richtungsabhängig mit (kein Sprung) ---------- */
  function stickyAside() {
    var asides = $$('.layout > aside'); if (!asides.length) return;
    var base = 64 + 44 + 45 + 16, lastY = window.scrollY || 0;
    var state = asides.map(function (as) { return { el: as, top: base }; });
    function update(delta) {
      var avail = window.innerHeight - 16;
      state.forEach(function (st) {
        var minTop = avail - st.el.offsetHeight;
        st.top = minTop >= base ? base : Math.max(minTop, Math.min(base, st.top - delta));
        st.el.style.setProperty('--aside-top', st.top + 'px');
      });
    }
    update(0);
    window.addEventListener('scroll', function () { var y = window.scrollY || 0; update(y - lastY); lastY = y; }, { passive: true });
    window.addEventListener('resize', function () { update(0); });
    window.addEventListener('load', function () { update(0); });
    if (window.ResizeObserver) { var ro = new ResizeObserver(function () { update(0); }); asides.forEach(function (as) { ro.observe(as); }); }
  }

  /* ---------- FAQ: weich auf- und zuklappen ---------- */
  function faq() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $$('.faq details').forEach(function (det) {
      var sum = $('summary', det); if (!sum || !det.animate) return;
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (e.detail) sum.blur();
        if (det.getAttribute('data-anim')) return;
        if (reduce) { det.open = !det.open; return; }
        var h0 = det.getBoundingClientRect().height, h1;
        det.setAttribute('data-anim', '1'); det.style.overflow = 'hidden';
        if (det.open) { det.classList.add('is-closing'); h1 = sum.getBoundingClientRect().height + 1; }
        else { det.open = true; h1 = det.getBoundingClientRect().height; }
        var a = det.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 220, easing: 'ease' });
        a.onfinish = a.oncancel = function () {
          if (det.classList.contains('is-closing')) { det.open = false; det.classList.remove('is-closing'); }
          det.style.overflow = ''; det.removeAttribute('data-anim');
        };
      });
    });
  }

  /* ---------- Sticky-Kopfzeile: Schatten ---------- */
  function headerShadow() {
    var h = $('.site-header'); if (!h) return;
    var on = false;
    function chk() { var s = window.scrollY > 8; if (s !== on) { on = s; h.classList.toggle('is-scrolled', s); } }
    window.addEventListener('scroll', chk, { passive: true }); chk();
  }

  /* ---------- Lesefortschritt ---------- */
  function progress() {
    var bar = $('[data-progress]'), art = $('[data-article]'); if (!bar || !art) return;
    function upd() {
      var r = art.getBoundingClientRect(); var total = r.height - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      bar.style.transform = 'scaleX(' + p + ')';
    }
    window.addEventListener('scroll', upd, { passive: true }); upd();
  }

  d.addEventListener('DOMContentLoaded', function () {
    clock(); nav(); headerSearch(); searchPage(); tabs(); sortable(); filters(); watchlist(); recent(); newsletter(); nlBar(); nlModal(); calculators(); weeks(); poll(); quiz(); cookieNote(); share(); faq(); motion(); stickyAside(); headerShadow(); progress();
  });
})();
