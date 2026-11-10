/* ==========================================================================
 * Scroll-linked motion (v5.12) — motion_scroll.css goes with it
 *
 * The motion language of the reference clips, applied to the existing page:
 *   A. the home emblem turns and flies into the header logo, which catches
 *      it; the intro lines rise at their own speeds and dissolve at the top
 *   B. a giant faint word behind each section title, drifting with the scroll
 *   C. the 3D ring of value cards settles as its section arrives
 *   D. the light of the page takes the colour of the section / chosen value
 *   F. a thin progress line in the floating section bar
 *   G. a value card grows into the value window (View Transitions API)
 *   (E, titles coming into focus and cards tilting in, is CSS only)
 *
 * Smoothness and cost:
 *   - the scrubbed parts follow a softly eased copy of the scroll position
 *     (time-based, so 60/90/120 Hz screens feel the same): wheel steps glide
 *     instead of jumping; a jump of more than a screen and a half (the bar's
 *     glide start, attract mode going home) is followed at once
 *   - every frame writes transform / opacity only (and a small blur on strong
 *     devices); everything it reads is read first, before any write, so the
 *     browser never has to work out styles twice in one frame
 *   - positions are measured once, and again only when something changes size
 *   - html[data-perf] (perf_tier.js) picks what runs, as everywhere else:
 *       high   everything
 *       medium everything but the blur and the CSS focus / tilt entrances
 *       low    (classroom boards, TVs) the emblem flight without the 3D turn,
 *              the intro dissolve without blur, the giant words, the
 *              progress line; no ring tilt, no colour light, no card morph
 *     and perf_tier.js steps the level down by itself if frames drop while
 *     this scrubs (PerfTier.watch)
 * Like the rest of the exhibit (CSS sections 12 and 20.9) the motion stays
 * on devices that ask for reduced motion; MOTION_STILL = true would honour it.
 * Written without ?. / ?? / template strings so older board browsers (Chrome
 * 61+) run it as it is: no legacy copy is needed.
 * ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  if (!body || !window.requestAnimationFrame) return;

  // ---- helpers -----------------------------------------------------------
  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var MOTION_STILL = false; // true = honour prefers-reduced-motion with a still page
  // how softly the scrubbed parts follow the scroll (ms to close ~63% of the gap)
  var EASE_MS = { high: 110, medium: 95, low: 70 };
  function perf() {
    return root.getAttribute('data-perf') || 'high';
  }
  function reduced() {
    return !!(reduceMQ && reduceMQ.matches);
  }
  function scrollTop() {
    return window.pageYOffset || root.scrollTop || 0;
  }
  function clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }
  function smooth(a, b, x) {
    var t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  }
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function r(x) {
    return Math.round(x * 100) / 100;
  }
  // write a style only when it changed (most frames change nothing)
  function put(el, t, o, f) {
    var c = el._ms || (el._ms = {});
    if (t !== undefined && c.t !== t) {
      el.style.transform = t;
      c.t = t;
    }
    if (o !== undefined && c.o !== o) {
      el.style.opacity = o;
      c.o = o;
    }
    if (f !== undefined && c.f !== f) {
      el.style.filter = f;
      c.f = f;
    }
  }
  function clear(el) {
    if (el) put(el, '', '', '');
  }
  function live(el, on) {
    if (el._msLive !== on) {
      el._msLive = on;
      el.classList.toggle('is-live', on);
    }
  }
  // layout position, ignoring transforms (ours included)
  function docTop(el) {
    var y = 0;
    while (el) {
      y += el.offsetTop;
      el = el.offsetParent;
    }
    return y;
  }
  function docLeft(el) {
    var x = 0;
    while (el) {
      x += el.offsetLeft;
      el = el.offsetParent;
    }
    return x;
  }
  function shown(el) {
    return !!(el && el.offsetParent !== null);
  }

  // ---- the parts of the page ---------------------------------------------
  var nav = doc.querySelector('.top-nav');
  var brand = nav && nav.querySelector('.brand-emblem');
  var brandImg = brand && (brand.querySelector('img') || brand);

  var intro = doc.getElementById('intro-section');
  var emblem = intro && intro.querySelector('.intro-emblem');
  var introLines = intro ? [].slice.call(intro.querySelectorAll('.intro-inner > :not(.intro-emblem)')) : [];
  // how much each line lags behind the scroll (school name … «ابدأ الجولة»):
  // higher lines lag more, so the intro opens up in depth as it leaves
  var LAG = [0.34, 0.3, 0.24, 0.18, 0.1, 0.04];
  // the emblem's flight to the header logo is drawn by a fixed copy above
  // the header (z-index 35: over the header's 30, under the bar's 40 and the
  // windows), because the intro section keeps its own emblem under the header
  var flyer = null;
  if (emblem) {
    flyer = doc.createElement('img');
    flyer.className = 'ms-flyer';
    flyer.src = emblem.currentSrc || emblem.src;
    flyer.alt = '';
    flyer.setAttribute('aria-hidden', 'true');
    flyer.decoding = 'async';
    body.appendChild(flyer);
  }

  var hero = doc.getElementById('hero-section');
  var track = doc.getElementById('cardsWrapper');

  // B. giant words: one per section, placed behind its title
  var GIANTS = [
    ['hero-section', '.hero-top-grid', 'القيم'],
    ['examples-section', '.section-header', 'القصص'],
    ['encyclopedia-section', '.section-header', 'الموسوعة'],
    ['comparison-section', '.section-header', 'المقارنة']
  ];
  var giants = [];
  GIANTS.forEach(function (g) {
    var section = doc.getElementById(g[0]);
    var head = section && section.querySelector(g[1]);
    if (!head) return;
    var word = doc.createElement('span');
    word.className = 'ms-giant';
    word.setAttribute('aria-hidden', 'true');
    word.textContent = g[2];
    section.classList.add('ms-giant-host');
    section.insertBefore(word, section.firstChild);
    giants.push({ section: section, head: head, word: word });
  });

  // D. the light of the page: two layers that cross-fade
  var atmo = doc.createElement('div');
  atmo.className = 'ms-atmo';
  atmo.setAttribute('aria-hidden', 'true');
  atmo.innerHTML = '<i></i><i></i>';
  body.insertBefore(atmo, body.firstChild);
  var atmoLayers = atmo.children;
  var atmoCur = 0;
  var atmoShown = '';
  var atmoWant = '';
  var atmoTimer = 0;

  var SECTIONS = ['intro-section', 'hero-section', 'examples-section', 'encyclopedia-section', 'comparison-section'];
  var DATA = window.AL_ILM_DATA && window.AL_ILM_DATA.values ? window.AL_ILM_DATA.values : [];
  var ambient = doc.getElementById('topAmbient');
  var encycCard = doc.getElementById('encycMainCard');

  // F. progress line in the floating section bar
  var dock = doc.querySelector('.glass-dock.floating-dock');
  var progress = null;
  if (dock) {
    progress = doc.createElement('span');
    progress.className = 'ms-progress';
    progress.setAttribute('aria-hidden', 'true');
    dock.appendChild(progress);
  }

  // ---- measuring (once, then only when something changes size) -----------
  // All reads first, then the few writes (the giant words' places).
  var M = null;
  function measure() {
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    M = { vh: vh, vw: vw, max: Math.max(1, root.scrollHeight - vh) };

    var navPos = nav ? window.getComputedStyle(nav).position : '';
    M.pinned = navPos === 'sticky' || navPos === 'fixed';
    var pillH = nav ? parseFloat(nav.style.getPropertyValue('--nav-pill-h')) || 82 : 0;
    // the line where intro text has fully dissolved: under the folded header
    M.fadeLine = M.pinned ? pillH + 16 : 0;

    M.intro = null;
    M.emblem = null;
    if (shown(intro)) {
      M.intro = { top: docTop(intro), h: intro.offsetHeight };
      M.lines = introLines.map(function (el) {
        return { el: el, mid: docTop(el) + el.offsetHeight / 2 };
      });
      if (shown(emblem)) {
        M.emblem = {
          cx: docLeft(emblem) + emblem.offsetWidth / 2,
          cy: docTop(emblem) + emblem.offsetHeight / 2,
          w: emblem.offsetWidth || 1,
          h: emblem.offsetHeight || 1,
          travel: Math.max(220, Math.min(M.intro.h * 0.6, vh * 0.55))
        };
      }
    }

    M.giants = giants.map(function (g) {
      if (!shown(g.head)) return null;
      var hTop = docTop(g.head);
      var hH = g.head.offsetHeight;
      return { top: hTop, h: hH, place: Math.round(hTop - docTop(g.section) + hH / 2) };
    });

    M.hero = shown(hero) ? docTop(hero) : null;

    M.sections = SECTIONS.map(function (id) {
      var el = doc.getElementById(id);
      return shown(el) ? { id: id, top: docTop(el) } : null;
    }).filter(Boolean);

    // writes
    if (flyer && M.emblem) {
      flyer.style.width = M.emblem.w + 'px';
      flyer.style.height = M.emblem.h + 'px';
    }
    giants.forEach(function (g, i) {
      var G = M.giants[i];
      if (G) g.word.style.top = G.place + 'px'; // on the middle of the title block
    });
  }

  // ---- A. the intro: emblem flies into the header, lines dissolve --------
  // The intro lines get their GPU layers (.ms-scrub → will-change) a moment
  // after the page has loaded, while nothing moves, instead of on the first
  // scroll, where the header fold and the bar glide also start (one frame
  // doing everything at once was the first-scroll hitch on slow screens).
  var introLive = false;
  var introReady = false;
  var introPromoted = false;
  var caught = false;
  function frameIntro(S, level, still, brandRect) {
    var I = M.intro;
    var inRange = !!I && !still && S < I.top + I.h + M.vh;
    var promote = inRange && introReady;
    if (promote !== introPromoted) {
      introPromoted = promote;
      intro.classList.toggle('ms-scrub', promote);
    }
    var active = inRange && S > 0.5;
    if (!active) {
      if (introLive) {
        introLive = false;
        introLines.forEach(clear);
        clear(emblem);
      }
      caught = false;
      if (flyer) put(flyer, undefined, '0');
      return;
    }
    introLive = true;
    var blur = level === 'high';

    M.lines.forEach(function (line, i) {
      var k = LAG[i] !== undefined ? LAG[i] : 0.1;
      var dist = Math.max(120, line.mid - M.fadeLine);
      var m = (S * (1 - k)) / dist; // 0 → 1 as the line travels to the top
      var gone = smooth(0.22, 1, m);
      var t = 'translate3d(0,' + r(S * k) + 'px,0)' + (gone > 0 ? ' scale(' + r(1 + gone * 0.035) + ')' : '');
      put(line.el, t, gone > 0 ? String(r(1 - gone)) : '', blur && gone > 0.02 ? 'blur(' + r(gone * 7) + 'px)' : '');
    });

    var E = M.emblem;
    if (!E) return;
    var p = clamp01(S / E.travel);
    var e = easeInOut(p);
    var spin = level !== 'low' ? ' perspective(700px) rotateY(' + r(360 * e) + 'deg)' : '';
    if (M.pinned && brandImg && flyer) {
      put(emblem, '', '0', '');
      if (p >= 1) {
        // landed: the copy has faded into the logo; nothing left to move
        put(flyer, undefined, '0');
        return;
      }
      // fly to the logo in the folded header and land on it exactly
      var b = brandRect || { left: E.cx, top: E.cy, width: E.w, height: E.h };
      var bx = b.left + b.width / 2;
      var by = b.top + b.height / 2;
      // it lifts off where it rested on the first screen and travels straight
      // to the logo (following the page instead would carry it off the top)
      var x = E.cx + (bx - E.cx) * e;
      var y = E.cy + (by - E.cy) * e;
      var sc = 1 + ((b.width || E.w) / E.w - 1) * e;
      put(
        flyer,
        'translate3d(' + r(x - E.w / 2) + 'px,' + r(y - E.h / 2) + 'px,0)' + spin + ' scale(' + r(sc) + ')',
        String(r(1 - smooth(0.82, 1, p)))
      );
      if (p >= 0.97 && !caught) {
        caught = true;
        catchLogo();
      } else if (p < 0.6) {
        caught = false;
      }
    } else {
      // the header scrolls away (phones): rise faster, turn, and fade
      if (flyer) put(flyer, undefined, '0');
      put(
        emblem,
        'translate3d(0,' + r(-S * 0.3) + 'px,0)' + spin + ' scale(' + r(1 - 0.3 * e) + ')',
        String(r(1 - smooth(0.35, 0.95, p))),
        ''
      );
    }
  }

  // the header logo gives a small bounce as the emblem lands on it
  var catchTimer = 0;
  function catchLogo() {
    if (!brand) return;
    brand.classList.remove('ms-catch');
    void brand.offsetWidth;
    brand.classList.add('ms-catch');
    clearTimeout(catchTimer);
    catchTimer = setTimeout(function () {
      brand.classList.remove('ms-catch');
    }, 700);
  }

  // ---- B. giant words drift as their section passes ----------------------
  function frameGiants(S, level, still) {
    giants.forEach(function (g, i) {
      var G = M.giants[i];
      if (!G || still) {
        clear(g.word);
        live(g.word, false);
        return;
      }
      var q = (M.vh - (G.top - S)) / (M.vh + G.h); // 0 below the screen → 1 above it
      var near = q > -0.25 && q < 1.25;
      // its own GPU layer only while near the screen (saves board memory)
      live(g.word, near);
      if (!near) return;
      q = clamp01(q);
      var tx = (0.5 - q) * 0.32 * M.vw; // right → left while scrolling down
      var ty = (q - 0.5) * 56; // a little slower than the page: depth
      put(g.word, 'translate3d(' + r(tx) + 'px,' + r(ty) + 'px,0)');
    });
  }

  // ---- C. the ring of value cards settles as its section arrives ---------
  function frameRing(S, level, still) {
    if (!track) return;
    if (M.hero === null || still || level === 'low') {
      clear(track);
      return;
    }
    var q = clamp01((M.vh - (M.hero - S)) / (M.vh * 0.85));
    if (q >= 1) {
      put(track, '');
      return;
    }
    var rest = 1 - easeOut(q);
    put(track, 'rotateX(' + r(rest * 16) + 'deg) translateZ(' + r(-rest * 150) + 'px)');
  }

  // ---- D. the light of the page -------------------------------------------
  function rgbOf(color) {
    if (!color) return null;
    var m = /^#([0-9a-f]{6})$/i.exec(color.trim());
    if (m) {
      var n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(color);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function accentOf(id) {
    for (var i = 0; i < DATA.length; i++) if (DATA[i].id === id) return DATA[i].accent;
    return DATA[0] ? DATA[0].accent : '#10b981';
  }
  function sectionColor(id) {
    if (id === 'hero-section') {
      // the ring's colour, as fable_engine.js sets it on #topAmbient (inline
      // style: read without asking the browser to compute styles)
      var c = ambient ? ambient.style.backgroundColor || ambient.style.background : '';
      return rgbOf(c) ? c : '#2dd4bf';
    }
    if (id === 'examples-section') return '#d4af37';
    if (id === 'encyclopedia-section') {
      var st = window.AlIlmState;
      return accentOf(st && st.activeEncycId);
    }
    if (id === 'comparison-section') return '#38bdf8';
    return '#10b981';
  }
  function applyAtmo() {
    var rgb = rgbOf(atmoWant);
    if (!rgb) return;
    atmoShown = atmoWant;
    var day = body.classList.contains('projector-day');
    var a1 = day ? 0.09 : 0.15;
    var a2 = day ? 0.05 : 0.08;
    var c = rgb.join(',');
    var next = atmoLayers[1 - atmoCur];
    next.style.backgroundImage =
      'radial-gradient(80% 62% at 50% -12%, rgba(' + c + ',' + a1 + '), rgba(' + c + ',0) 72%),' +
      'radial-gradient(48% 42% at 92% 104%, rgba(' + c + ',' + a2 + '), rgba(' + c + ',0) 70%)';
    atmoLayers[atmoCur].classList.remove('is-on');
    next.classList.add('is-on');
    atmoCur = 1 - atmoCur;
  }
  function frameAtmo(S, level) {
    if (level === 'low' || !M.sections.length) return;
    var line = S + M.vh * 0.45;
    var current = M.sections[0].id;
    M.sections.forEach(function (s) {
      if (s.top <= line) current = s.id;
    });
    var want = sectionColor(current);
    if (want === atmoWant) return;
    atmoWant = want;
    clearTimeout(atmoTimer);
    // a quick drag across the ring changes colour many times: settle first
    atmoTimer = setTimeout(applyAtmo, atmoShown ? 160 : 0);
  }

  // ---- F. progress line ---------------------------------------------------
  function frameProgress(S) {
    if (!progress) return;
    put(progress, 'scaleX(' + Math.round(clamp01(S / M.max) * 1000) / 1000 + ')');
  }

  // ---- the loop ------------------------------------------------------------
  var queued = false;
  var eased = null; // the softly eased scroll position the scrubbed parts follow
  var lastAt = 0;
  function frame(now) {
    queued = false;
    if (!M) measure();
    var S = scrollTop();
    var level = perf();
    var still = MOTION_STILL && reduced();
    now = now || Date.now();

    if (eased === null || still || Math.abs(S - eased) > M.vh * 1.5) {
      eased = S;
    } else {
      var dt = lastAt ? Math.min(64, Math.max(1, now - lastAt)) : 16;
      eased += (S - eased) * (1 - Math.exp(-dt / (EASE_MS[level] || 95)));
      if (Math.abs(S - eased) < 0.35) eased = S;
    }
    var Y = eased;

    // reads first: where the header logo is, while the emblem is in flight
    var brandRect = null;
    if (M.pinned && brandImg && flyer && M.emblem && Y > 0.5 && Y < M.emblem.travel) {
      brandRect = brandImg.getBoundingClientRect();
    }

    frameIntro(Y, level, still, brandRect);
    frameGiants(Y, level, still);
    frameRing(Y, level, still);
    frameAtmo(S, level);
    frameProgress(Y);

    if (eased !== S) {
      lastAt = now;
      request(); // still easing towards the scroll position
    } else {
      lastAt = 0;
    }
  }
  function request() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(frame);
  }
  function remeasure() {
    M = null;
    request();
  }

  // the device watch (perf_tier.js) judges the frames while this scrubs
  var watchedAt = 0;
  function watch() {
    var now = Date.now();
    if (now - watchedAt < 250) return;
    watchedAt = now;
    if (window.PerfTier && window.PerfTier.watch) window.PerfTier.watch(800);
  }

  window.addEventListener(
    'scroll',
    function () {
      request();
      watch();
    },
    { passive: true }
  );
  window.addEventListener('resize', remeasure, { passive: true });
  function readyIntro() {
    setTimeout(function () {
      introReady = true;
      request();
    }, 900);
  }
  window.addEventListener('load', function () {
    remeasure();
    readyIntro();
  });
  if (doc.readyState === 'complete') readyIntro();
  window.addEventListener('perfchange', function () {
    introLines.forEach(clear);
    clear(emblem);
    clear(track);
    if (flyer) put(flyer, '', '0');
    giants.forEach(function (g) {
      clear(g.word);
      live(g.word, false);
    });
    introLive = false;
    introPromoted = false;
    if (intro) intro.classList.remove('ms-scrub');
    eased = null;
    remeasure();
  });
  if (reduceMQ) {
    var onReduce = function () {
      remeasure();
    };
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onReduce);
    else if (reduceMQ.addListener) reduceMQ.addListener(onReduce);
  }
  if ('ResizeObserver' in window) {
    new window.ResizeObserver(remeasure).observe(body);
  } else {
    // older browsers: check the page height now and then
    var lastH = 0;
    setInterval(function () {
      var h = root.scrollHeight;
      if (h !== lastH) {
        lastH = h;
        remeasure();
      }
    }, 1000);
  }
  // the ring's colour and the chosen value change without a scroll
  if ('MutationObserver' in window) {
    var mo = new MutationObserver(request);
    if (ambient) mo.observe(ambient, { attributes: true, attributeFilter: ['style'] });
    if (encycCard) mo.observe(encycCard, { attributes: true, attributeFilter: ['style'] });
    mo.observe(body, { attributes: true, attributeFilter: ['class'] });
  }
  request();

  // ---- G. a value card grows into the value window ------------------------
  // Only on high / medium devices whose browser has the View Transitions API;
  // everywhere else the window opens with its own rise (CSS 20.8).
  var originalOpen = window.openStudio;
  if (typeof originalOpen === 'function' && typeof doc.startViewTransition === 'function') {
    var lastTap = null;
    var lastTapAt = 0;
    var CARDS = '.value-card-3d, .value-grid-card';
    var BUTTONS = '[data-open-studio], [data-open-val], [data-comp-open]';
    var remember = function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var card = t.closest(CARDS);
      var btn = card ? null : t.closest(BUTTONS);
      lastTap = card || (btn && (btn.closest('article') || btn)) || null;
      lastTapAt = Date.now();
    };
    doc.addEventListener('click', remember, true);
    doc.addEventListener(
      'keydown',
      function (e) {
        if (e.key === 'Enter' || e.key === ' ') remember(e);
      },
      true
    );

    window.openStudio = function () {
      var self = this;
      var args = arguments;
      var modal = doc.getElementById('studioModal');
      var panel = modal && modal.querySelector('.studio-panel');
      var src = lastTap;
      lastTap = null;
      var fresh = src && Date.now() - lastTapAt < 900 && src.isConnected && src.getClientRects().length;
      if (!fresh || !panel || modal.classList.contains('active') || perf() === 'low' || (MOTION_STILL && reduced())) {
        return originalOpen.apply(self, args);
      }
      var done = function () {
        root.classList.remove('ms-vt');
        panel.style.viewTransitionName = '';
        src.style.viewTransitionName = '';
      };
      src.style.viewTransitionName = 'ms-studio';
      root.classList.add('ms-vt');
      try {
        var vt = doc.startViewTransition(function () {
          src.style.viewTransitionName = '';
          originalOpen.apply(self, args);
          panel.style.viewTransitionName = 'ms-studio';
        });
        vt.finished.then(done, done);
      } catch (err) {
        done();
        return originalOpen.apply(self, args);
      }
    };
  }
})();
