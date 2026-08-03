/* ==========================================================================
   Godfrey Ajeyemi — Portfolio behaviour
   No dependencies, no build step. Everything degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- ICONS ------------------------------------------------------------- */
  var ICONS = {
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    github:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>'
  };

  /* --- TOAST ------------------------------------------------------------- */
  var toastTimer;
  function toast(msg, isError) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle('err', !!isError);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 4000);
  }

  /* --- CONTACT DETAILS --------------------------------------------------- */
  /* Email and phone are assembled at runtime so scrapers reading the raw HTML
     come up empty. Both still render instantly for real visitors. */
  var EMAIL = ['ajeyemi', '.', 'godfrey', '@', 'gmail', '.', 'com'].join('');
  var PHONE = ['234', '816', '254', '2540'].join('');            // wa.me wants digits only
  var PHONE_PRETTY = '+234 816 254 2540';
  var WA_MESSAGE = 'Hi Godfrey, I found your portfolio and would like to talk about a project.';

  function waUrl() {
    return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(WA_MESSAGE);
  }

  function linkify(el, href, text) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    if (href.indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    el.textContent = '';
    el.appendChild(a);
  }

  function wireContacts() {
    $$('[data-email-link]').forEach(function (el) { el.href = 'mailto:' + EMAIL; });
    $$('[data-email-text]').forEach(function (el) { linkify(el, 'mailto:' + EMAIL, EMAIL); });

    $$('[data-wa-link]').forEach(function (el) {
      el.href = waUrl();
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    });
    $$('[data-phone-text]').forEach(function (el) { linkify(el, waUrl(), PHONE_PRETTY); });
  }

  /* --- THEME ------------------------------------------------------------- */
  function wireTheme() {
    var btn = $('#themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('godfrey_theme', next); } catch (e) {}
      btn.setAttribute('aria-label', next === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'light' ? '#ffffff' : '#1a1f26');
    });
  }

  /* --- NAV --------------------------------------------------------------- */
  function wireNav() {
    var nav     = $('#nav');
    var drawer  = $('#drawer');
    var scrim   = $('#scrim');
    var toggle  = $('#navToggle');
    var bar     = $('#progress');
    var toTop   = $('#toTop');

    function closeDrawer() {
      if (!drawer) return;
      drawer.classList.remove('open');
      if (scrim) scrim.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (toggle && drawer) {
      toggle.addEventListener('click', function () {
        var open = drawer.classList.toggle('open');
        if (scrim) scrim.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
        if (open) { var first = $('a', drawer); if (first) first.focus(); }
      });
      $$('a', drawer).forEach(function (a) { a.addEventListener('click', closeDrawer); });
      if (scrim) scrim.addEventListener('click', closeDrawer);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
          closeDrawer();
          toggle.focus();
        }
      });
    }

    // Scroll-driven chrome, batched into one rAF.
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || document.documentElement.scrollTop;
        if (nav) nav.classList.toggle('scrolled', y > 40);
        if (toTop) toTop.classList.toggle('show', y > 600);
        if (bar) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
        }
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }

    // Active section highlighting.
    var links = $$('.nav-links a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var sections = Object.keys(byId)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var active = byId[entry.target.id];
        if (active) active.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* --- TYPEWRITER -------------------------------------------------------- */
  function wireTypewriter() {
    var el = $('#typed');
    if (!el) return;

    var titles = [
      'Full-Stack Developer',
      'Django & Python Engineer',
      'React & Next.js Developer',
      'AI Integration Specialist',
      'IT Infrastructure Specialist'
    ];

    // With reduced motion we show the primary title and stop.
    if (reduceMotion) {
      el.textContent = titles[0];
      return;
    }

    var idx = 0, ch = 0, deleting = false;

    (function step() {
      var word = titles[idx];
      el.textContent = word.slice(0, ch);

      var delay;
      if (deleting) {
        ch--;
        delay = 40;
        if (ch <= 0) { deleting = false; idx = (idx + 1) % titles.length; delay = 380; }
      } else {
        ch++;
        delay = 75;
        if (ch > word.length) { ch = word.length; deleting = true; delay = 2100; }
      }
      setTimeout(step, delay);
    })();
  }

  /* --- COUNT-UP STATS ---------------------------------------------------- */
  function wireCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduceMotion) { el.firstChild.nodeValue = String(target); return; }

      var start = performance.now();
      var dur = 1100;
      (function frame(now) {
        var p = Math.min((now - start) / dur, 1);
        // easeOutExpo
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.firstChild.nodeValue = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(frame);
      })(start);
    }

    // No observer support: the real figures are already in the HTML, leave them.
    if (!('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.25 });

    // Deliberately NOT zeroed up front. On short viewports the last stats wrap
    // below the fold, and a stat that never scrolls into view must still show
    // its real number rather than a permanent "0". run() starts the count at 0
    // itself, so the animation looks identical when it does fire.
    nums.forEach(function (n) { io.observe(n); });
  }

  /* --- SCROLL REVEAL ----------------------------------------------------- */
  function reveal(scope) {
    var items = $$('.reveal:not(.in)', scope || document);
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* --- CURSOR SPOTLIGHT -------------------------------------------------- */
  function wireSpotlight(scope) {
    if (reduceMotion || window.matchMedia('(hover: none)').matches) return;
    $$('.spotlight', scope || document).forEach(function (card) {
      if (card.dataset.spotWired) return;
      card.dataset.spotWired = '1';
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* --- PROJECTS ---------------------------------------------------------- */
  /* Fallback used only if data/projects.json cannot be fetched — e.g. when
     the page is opened straight off the filesystem via file://. */
  var FALLBACK_PROJECTS = [
    {
      id: 1,
      name: 'AssetVerify',
      desc: 'Production asset-inspection platform running at Regency Alliance Insurance Plc, tracking 1,500+ collateral assets across all 36 Nigerian states. Role-based auth, AI-enhanced reports via Groq, automated PDF generation and bulk ZIP export.',
      tags: ['Python', 'Django', 'PostgreSQL', 'Groq AI', 'Cloudinary', 'Render'],
      github: 'https://github.com/Godfreyoz/assetverify',
      live: 'https://assetverify.onrender.com',
      icon: '🏦',
      image: '',
      featured: true
    },
    {
      id: 2,
      name: 'NOIR Lagos',
      desc: 'A dark-luxury restaurant experience with a working cart, multi-method checkout, table reservations and localStorage persistence — built in vanilla HTML, CSS and JavaScript.',
      tags: ['HTML5', 'CSS3', 'JavaScript', 'LocalStorage', 'Netlify'],
      github: 'https://github.com/Godfreyoz/noir-lagos',
      live: 'https://thunderous-sherbet-51b60c.netlify.app/',
      icon: '🍽️',
      image: '',
      featured: false
    },
    {
      id: 3,
      name: 'Django Chat App',
      desc: 'Real-time messaging built on Django Channels and WebSockets, with authentication, persistent rooms and live delivery without polling.',
      tags: ['Python', 'Django', 'WebSockets', 'PostgreSQL'],
      github: 'https://github.com/Godfreyoz/djangochat',
      live: '',
      icon: '💬',
      image: '',
      featured: false
    },
    {
      id: 4,
      name: 'Event Ticketing System',
      desc: 'End-to-end event management and ticketing platform with organiser tools, attendee bookings and integrated payments on a Django backend.',
      tags: ['Python', 'Django', 'PostgreSQL', 'Payments'],
      github: 'https://github.com/Godfreyoz/event_ticketing',
      live: '',
      icon: '🎟️',
      image: '',
      featured: false
    }
  ];

  var allProjects = [];
  var activeFilter = 'All';
  var usingLocalPreview = false;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  /* Only allow links we are willing to render — blocks javascript:/data: URLs
     that could otherwise arrive through an imported JSON file. */
  function safeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    var trimmed = url.trim();
    return /^(https?:\/\/|\/|\.\/|#)/i.test(trimmed) ? trimmed : '';
  }

  function linkEl(href, label, iconKey) {
    var a = el('a', 'project-link');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    var icon = el('span');
    icon.innerHTML = ICONS[iconKey];
    a.appendChild(icon);
    a.appendChild(document.createTextNode(label));
    return a;
  }

  function buildCard(p, index) {
    var card = el('article', 'card project spotlight reveal' + (p.featured ? ' featured' : ''));
    card.style.setProperty('--d', Math.min(index, 6) * 0.06 + 's');

    var tags = el('div', 'project-tags');
    (p.tags || []).forEach(function (t) { tags.appendChild(el('span', 'project-tag', t)); });

    var links = el('div', 'project-links');
    var live = safeUrl(p.live);
    var repo = safeUrl(p.github);
    if (live) links.appendChild(linkEl(live, 'Live', 'external'));
    if (repo) links.appendChild(linkEl(repo, 'Code', 'github'));

    if (p.featured) {
      var shot = el('div', 'project-shot');
      var img = safeUrl(p.image);
      if (img) {
        var image = document.createElement('img');
        image.src = img;
        image.alt = 'Screenshot of ' + p.name;
        image.loading = 'lazy';
        image.decoding = 'async';
        // If the screenshot 404s, fall back to the icon placeholder.
        image.addEventListener('error', function () {
          shot.textContent = '';
          shot.appendChild(placeholder(p));
        });
        shot.appendChild(image);
      } else {
        shot.appendChild(placeholder(p));
      }

      var body = el('div', 'project-body');
      var badge = el('span', 'badge');
      badge.appendChild(document.createTextNode('★ Featured'));
      body.appendChild(badge);
      body.appendChild(el('h3', 'project-name', p.name));
      body.appendChild(el('p', 'project-desc', p.desc));
      body.appendChild(tags);
      links.style.marginTop = '1.3rem';
      body.appendChild(links);

      card.appendChild(shot);
      card.appendChild(body);
      return card;
    }

    var top = el('div', 'project-top');
    var emoji = el('div', 'project-emoji', p.icon || '📦');
    emoji.setAttribute('aria-hidden', 'true');
    top.appendChild(emoji);
    top.appendChild(links);

    card.appendChild(top);
    card.appendChild(el('h3', 'project-name', p.name));
    card.appendChild(el('p', 'project-desc', p.desc));
    card.appendChild(tags);
    return card;
  }

  function placeholder(p) {
    var ph = el('div', 'placeholder');
    var big = el('div', 'big', p.icon || '📦');
    big.setAttribute('aria-hidden', 'true');
    ph.appendChild(big);
    ph.appendChild(el('span', null, p.live ? 'Live project' : 'Source available'));
    return ph;
  }

  function renderProjects() {
    var grid = $('#projectsGrid');
    if (!grid) return;
    grid.textContent = '';

    if (usingLocalPreview) grid.appendChild(previewNotice());

    var ordered = featuredFirst(allProjects);
    var list = activeFilter === 'All'
      ? ordered
      : ordered.filter(function (p) {
          return (p.tags || []).some(function (t) {
            return t.toLowerCase() === activeFilter.toLowerCase();
          });
        });

    if (!list.length) {
      grid.appendChild(el('div', 'empty-state', 'No projects match “' + activeFilter + '” yet.'));
      return;
    }

    list.forEach(function (p, i) { grid.appendChild(buildCard(p, i)); });
    reveal(grid);
    wireSpotlight(grid);
  }

  function previewNotice() {
    var note = el('div', 'preview-note');
    note.appendChild(el('span', null, '⚑ Local preview — these edits live in this browser only.'));
    var clear = el('button', null, 'Clear and show published projects');
    clear.type = 'button';
    clear.addEventListener('click', function () {
      try { localStorage.removeItem('godfrey_projects'); } catch (e) {}
      window.location.reload();
    });
    note.appendChild(clear);
    return note;
  }

  function buildFilters() {
    var row = $('#filters');
    if (!row) return;

    var counts = {};
    allProjects.forEach(function (p) {
      (p.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    });

    // Only surface stacks that appear more than once, so the row stays short.
    var tags = Object.keys(counts)
      .filter(function (t) { return counts[t] > 1; })
      .sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); })
      .slice(0, 6);

    row.textContent = '';
    ['All'].concat(tags).forEach(function (t) {
      var b = el('button', 'filter', t === 'All' ? 'All projects' : t);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(t === activeFilter));
      b.addEventListener('click', function () {
        activeFilter = t;
        $$('.filter', row).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        renderProjects();
      });
      row.appendChild(b);
    });
  }

  function normalise(list) {
    if (!Array.isArray(list)) return null;
    var clean = list.filter(function (p) { return p && typeof p.name === 'string' && p.name.trim(); });
    if (!clean.length) return null;

    // Only one project may hold the featured slot — two full-width cards
    // stacked on each other looks broken. First one declared wins.
    var seen = false;
    clean.forEach(function (p) {
      if (p.featured && !seen) { seen = true; return; }
      p.featured = false;
    });
    return clean;
  }

  /* The featured toggle promises "at the top", so ordering has to honour it
     regardless of where the entry sits in the JSON. Array.sort is stable, so
     everything else keeps its authored order. */
  function featuredFirst(list) {
    return list.slice().sort(function (a, b) {
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }

  function loadProjects() {
    // A localStorage copy means the admin panel is being used for a preview;
    // it wins so edits are visible immediately, but we say so on the page.
    var local = null;
    try {
      var raw = localStorage.getItem('godfrey_projects');
      if (raw) local = normalise(JSON.parse(raw));
    } catch (e) {}

    if (local) {
      usingLocalPreview = true;
      allProjects = local;
      buildFilters();
      renderProjects();
      return;
    }

    fetch('data/projects.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
      .then(function (data) { allProjects = normalise(data) || FALLBACK_PROJECTS; })
      .catch(function () { allProjects = FALLBACK_PROJECTS; })
      .then(function () { buildFilters(); renderProjects(); });
  }

  /* --- CONTACT FORM ------------------------------------------------------ */
  function wireForm() {
    var form = $('#contactForm');
    if (!form) return;

    var btn = $('#submitBtn', form);
    var label = btn ? btn.querySelector('.btn-label') : null;
    var original = label ? label.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) { form.reportValidity(); return; }

      // Honeypot: a real person never fills this.
      var trap = form.querySelector('input[name="_gotcha"]');
      if (trap && trap.value) { toast('Message sent. Thanks!'); form.reset(); return; }

      if (btn) {
        btn.disabled = true;
        if (label) label.textContent = 'Sending';
        var sp = el('span', 'spinner');
        btn.appendChild(sp);
      }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) {
          if (!r.ok) throw new Error('Request failed');
          form.reset();
          toast('Message sent — I’ll get back to you within 24 hours.');
        })
        .catch(function () {
          toast('Could not send. Email me directly at ' + EMAIL, true);
        })
        .then(function () {
          if (!btn) return;
          btn.disabled = false;
          if (label) label.textContent = original;
          var s = btn.querySelector('.spinner');
          if (s) s.remove();
        });
    });
  }

  /* --- MISC -------------------------------------------------------------- */
  function wireYear() {
    var y = $('#year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* --- BOOT -------------------------------------------------------------- */
  function init() {
    wireContacts();
    wireTheme();
    wireNav();
    wireTypewriter();
    wireCounters();
    wireForm();
    wireYear();
    reveal();
    wireSpotlight();
    loadProjects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
