/*
 * ============================================================================
 * EXHIBITION KIOSK LAYER — معرض ترسيخ القيم · iPad Air 13" (M2)
 * ----------------------------------------------------------------------------
 * - Attract mode: after a quiet period with no touch (90 s), close any open
 *   window, return to the welcome view and show the waiting screen: the
 *   twelve values one by one, full screen, readable from across the room,
 *   until the next visitor touches it (the touch opens the value on screen).
 *   Without the values data: a small hint and the 3D orbit slowly turning.
 * - A quiet fresh start: after 4 hours of running, while the waiting screen
 *   shows and the site answers, the page reloads itself (memory, new version).
 * - Keeps the iPad screen awake (Screen Wake Lock, iPadOS 16.4+).
 * - Touch hardening: no pinch-zoom, no long-press callouts on the kiosk UI.
 * Uses only public functions exposed by fable_engine.js / stage3_fable_upgrade.js.
 * ============================================================================
 */
(() => {
  'use strict';

  const IDLE_MS = 90 * 1000; // quiet time on the main page before attract mode (the owner tried 2.5 min and chose 90 s)
  const IDLE_MS_READING = 180 * 1000; // longer while a story or studio is open
  const ROTATE_MS = 5000; // one card every 5 s while attracting

  const $ = (id) => document.getElementById(id);
  const isOpen = (id) => Boolean($(id)?.classList.contains('active'));
  const readingOpen = () => isOpen('storyReaderModal') || isOpen('studioModal');
  const reducedMotion = () =>
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) ||
    document.body.classList.contains('classroom-mode');
  const mediaBusy = () => {
    const studio = window.AudioStudio;
    // A paused message doesn't hold the screen; only one that is playing.
    const synth = window.speechSynthesis;
    return Boolean(studio?.isPlaying || window.QuranRecite?.isPlaying || (synth?.speaking && !synth.paused));
  };

  let idleTimer = 0;
  let rotateTimer = 0;
  let attract = false;
  let ignoreActivityUntil = 0;

  // --------------------------------------------------------------------------
  // The waiting screen (v5.13.3): the twelve values one by one (7 s each),
  // full screen and readable from across the room: the value's icon, number
  // and group, its name very large, its short line, its colour as a soft
  // glow, twelve dots. A touch (or OK on a TV remote) opens the value on
  // screen. Styles: stage3_astra_upgrade.css 11.1. The orbit under it no
  // longer turns (it was below the welcome view, out of sight, anyway).
  // --------------------------------------------------------------------------
  const SLIDE_MS = 7000;
  const SWAP_MS = 430; // the value on screen fades out before the next one
  const LEAVE_MS = 450; // after the touch that ends the waiting mode
  const DRAG_PX = 14; // moved further than this before letting go: a swipe, not a tap

  const TOUCH_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>';

  const SWIPE_ICON =
    '<svg class="ks-swipe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17 11-5-5-5 5"/><path d="m17 18-5-5-5 5"/></svg>';

  function buildShowcase() {
    const data = window.AL_ILM_DATA;
    if (!data || !Array.isArray(data.values) || !data.values.length) return null;
    const paint = window.ALM_PALETTE?.paint || ((v) => v);
    const values = data.values.map(paint);
    const icons = data.icons || {};
    const GROUP = { A: 'قيم المعرض', B: 'قيم التميز والريادة' };

    const show = document.createElement('div');
    show.className = 'kiosk-show';
    show.setAttribute('aria-hidden', 'true');
    show.innerHTML =
      '<div class="ks-light"></div><div class="ks-glow"></div><div class="ks-glow"></div>' +
      '<div class="ks-top"><img src="./assets/school-emblem.svg" alt="" width="60" height="60" decoding="async" />' +
      '<div><b>ثانوية العلم النافع الأهلية</b><span>معرض ترسيخ القيم</span></div></div>' +
      '<div class="ks-stage is-pre"><div class="ks-icon"></div><div class="ks-meta"></div>' +
      '<div class="ks-name"></div><p class="ks-sub"></p></div>' +
      // the two gestures, said equally clearly (owner's request)
      '<div class="ks-foot"><div class="ks-actions">' +
      `<div class="ks-cta ks-cta--tap">${TOUCH_ICON}<span>اضغط لتستكشف هذه القيمة</span></div>` +
      `<div class="ks-cta ks-cta--swipe">${SWIPE_ICON}<span>اسحب لتستكشف الموقع</span></div>` +
      '</div><div class="ks-dots"></div></div>';
    document.body.appendChild(show);

    const stage = show.querySelector('.ks-stage');
    const glows = show.querySelectorAll('.ks-glow');
    const dotsBox = show.querySelector('.ks-dots');
    const el = {
      icon: show.querySelector('.ks-icon'),
      meta: show.querySelector('.ks-meta'),
      name: show.querySelector('.ks-name'),
      sub: show.querySelector('.ks-sub')
    };
    show.style.setProperty('--slide', `${SLIDE_MS}ms`);
    values.forEach(() => dotsBox.appendChild(document.createElement('i')));
    const dots = dotsBox.children;

    let index = 0;
    let shownOnce = false;
    let on = false;
    let glowSide = 0;
    let slideTimer = 0;
    let swapTimer = 0;
    let leaveTimer = 0;
    let downAt = null; // where a press on the screen began (tap or swipe?)

    function fill() {
      const v = values[index];
      show.style.setProperty('--c', v.accent);
      el.icon.innerHTML = icons[v.id] || '';
      el.meta.textContent = `القيمة ${v.num} · ${GROUP[v.group] || ''}`;
      el.name.textContent = v.name;
      // one line: a long name (الانتماء للوطن) shrinks to the screen's width
      el.name.style.fontSize = '';
      const room = show.clientWidth * 0.88;
      const wide = el.name.scrollWidth;
      if (wide > room) {
        el.name.style.fontSize = `${Math.floor((parseFloat(getComputedStyle(el.name).fontSize) * room) / wide)}px`;
      }
      el.sub.textContent = v.sub || '';
      for (let k = 0; k < dots.length; k++) dots[k].classList.remove('is-now');
      void dots[index].offsetWidth; // restart the current dot's fill
      dots[index].classList.add('is-now');
      // the glow cross-fades to this value's colour
      glows[glowSide].style.setProperty('--c', v.accent);
      glows[glowSide].classList.add('is-shown');
      glows[1 - glowSide].classList.remove('is-shown');
      glowSide = 1 - glowSide;
    }

    function enter() {
      stage.classList.add('is-pre');
      stage.classList.remove('is-out');
      fill();
      void stage.offsetWidth;
      stage.classList.remove('is-pre');
    }

    function advance() {
      if (document.hidden) return;
      stage.classList.add('is-out');
      window.clearTimeout(swapTimer);
      swapTimer = window.setTimeout(() => {
        index = (index + 1) % values.length;
        enter();
      }, SWAP_MS);
    }

    function hide() {
      on = false;
      window.clearInterval(slideTimer);
      window.clearTimeout(swapTimer);
      window.clearTimeout(leaveTimer);
      show.classList.remove('is-on');
    }

    function start() {
      window.clearTimeout(leaveTimer);
      if (on) return;
      on = true;
      // each waiting period goes on with the next value
      if (shownOnce) index = (index + 1) % values.length;
      shownOnce = true;
      show.classList.add('is-on');
      enter();
      slideTimer = window.setInterval(advance, SLIDE_MS);
    }

    // The touch that ends the waiting mode (pointerdown, below) comes before
    // its click: the screen stays a moment so that click can open the value.
    function leave() {
      window.clearTimeout(leaveTimer);
      if (downAt) return; // a finger is still on the screen: wait for its tap or swipe
      leaveTimer = window.setTimeout(hide, LEAVE_MS);
    }

    function openShown() {
      if (!show.classList.contains('is-on')) return;
      const v = values[index];
      hide();
      if (v) window.openStudio?.(v.id);
      scheduleIdle(); // a value is open now: the longer reading wait
    }

    // Each gesture its own answer (owner's request): a tap opens the value on
    // screen; a swipe or a drag (finger or mouse) or the wheel is the visitor
    // wanting the exhibit itself, so the screen goes at once and the page
    // stays as it is, with nothing opened. (.kiosk-show has touch-action:
    // none, so a swipe reaches us instead of scrolling the page beneath.)
    show.addEventListener('pointerdown', (event) => {
      downAt = { x: event.clientX, y: event.clientY };
      // the page-wide touch listener (capture, so it ran first) has already
      // asked the screen to leave; a held press decides instead
      window.clearTimeout(leaveTimer);
    });
    show.addEventListener('pointermove', (event) => {
      if (!downAt) return;
      if (Math.abs(event.clientX - downAt.x) > DRAG_PX || Math.abs(event.clientY - downAt.y) > DRAG_PX) {
        downAt = null;
        hide();
      }
    });
    show.addEventListener('pointercancel', () => {
      downAt = null;
      hide();
    });
    // a press let go without a click (released elsewhere): just leave
    show.addEventListener('pointerup', () => {
      window.setTimeout(() => {
        if (!attract && show.classList.contains('is-on')) {
          downAt = null;
          hide();
        }
      }, 300);
    });
    show.addEventListener('wheel', () => hide(), { passive: true });
    show.addEventListener('click', () => {
      if (!downAt) return; // a drag already sent the screen away
      downAt = null;
      openShown();
    });
    // OK / Enter on a TV remote or keyboard opens it too
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!show.classList.contains('is-on')) return;
      event.preventDefault();
      openShown();
    });

    return { start, leave };
  }

  const showcase = buildShowcase();

  // Without the values data: the small hint ("touch to explore") instead
  if (!showcase) {
    const hint = document.createElement('div');
    hint.className = 'attract-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = '👆 المس الشاشة لاستكشاف القيم';
    document.body.appendChild(hint);
  }

  function resetToWelcome() {
    // Our own programmatic scroll/close events must not count as a visitor.
    ignoreActivityUntil = performance.now() + 1500;

    closeFinder(false); // «ابحث عن قيمة»: results closed, the field emptied
    if (finderInput) finderInput.value = '';
    closePhoneCard(false); // «على جوالك» card, if left open
    if (isOpen('storyReaderModal')) window.closeStoryReader?.();
    if (isOpen('studioModal')) window.closeStudio?.();
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    document.activeElement?.blur?.();

    const search = $('globalSearchInput');
    if (search && search.value) {
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (window.AlIlmState?.activeGroup !== 'all') window.switchGroup?.('all');
    window.AppRouter?.switchView?.('all', false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // --------------------------------------------------------------------------
  // A quiet fresh start (v5.13.3): a screen left running all day reloads the
  // page once it has run REFRESH_MS, and only while the waiting screen has
  // been on a full minute (nobody is using it), nothing is playing and the
  // site answers (never an error page without internet). It clears what hours
  // of use leave behind and picks up a newly published version; the waiting
  // screen comes straight back after the reload. A reload ends full screen
  // (browsers allow it only from a touch): the next touch brings it back
  // (see «ملء الشاشة» below); a board that opens the site from its home-screen
  // icon (manifest: fullscreen) keeps full screen anyway.
  // --------------------------------------------------------------------------
  const REFRESH_MS = 4 * 60 * 60 * 1000;
  const REFRESH_CHECK_MS = 60 * 1000; // the first check after a minute of waiting screen
  const RESUME_KEY = 'alm_resume_attract';
  const startedAt = Date.now();
  let refreshTimer = 0;

  async function quietRefresh(force) {
    if (!attract || mediaBusy() || document.hidden) return false;
    if (!force && Date.now() - startedAt < REFRESH_MS) return false;
    if (navigator.onLine === false) return false;
    try {
      const res = await fetch(location.href.split('#')[0], { method: 'HEAD', cache: 'no-store' });
      if (!res.ok || !attract) return false;
    } catch (_) {
      return false; // no answer: keep the page that works
    }
    try {
      sessionStorage.setItem(RESUME_KEY, '1');
    } catch (_) {}
    location.reload();
    return true;
  }

  function enterAttract() {
    if (attract) return;
    resetToWelcome();
    attract = true;
    document.body.classList.add('is-attract');
    if (showcase) showcase.start();
    else if (!reducedMotion()) {
      rotateTimer = window.setInterval(() => {
        if (document.hidden || window.AlIlmState?.isSpinning) return;
        window.OrbitPhysics?.step?.(1);
      }, ROTATE_MS);
    }
    window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(() => quietRefresh(false), REFRESH_CHECK_MS);
  }

  function exitAttract() {
    if (!attract) return;
    attract = false;
    document.body.classList.remove('is-attract');
    window.clearInterval(rotateTimer);
    rotateTimer = 0;
    window.clearInterval(refreshTimer);
    refreshTimer = 0;
    showcase?.leave();
  }

  function scheduleIdle() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(onIdle, readingOpen() ? IDLE_MS_READING : IDLE_MS);
  }

  function onIdle() {
    // Never interrupt a playing voice message or Arabic speech.
    if (mediaBusy()) {
      scheduleIdle();
      return;
    }
    enterAttract();
  }

  function onActivity() {
    exitAttract();
    scheduleIdle();
    keepScreenAwake();
  }

  // A real touch, click or key always counts — even right after the reset.
  ['pointerdown', 'touchstart', 'keydown', 'wheel', 'input'].forEach((type) =>
    window.addEventListener(type, onActivity, { capture: true, passive: true })
  );
  // Scrolling a long story counts as reading, not idling — but the reset's
  // own scroll to the top must not count as a visitor.
  window.addEventListener(
    'scroll',
    () => {
      if (performance.now() < ignoreActivityUntil) return;
      onActivity();
    },
    { capture: true, passive: true }
  );

  // --------------------------------------------------------------------------
  // Keep the screen on during the exhibition (Screen Wake Lock API)
  // --------------------------------------------------------------------------
  let wakeLock = null;
  async function keepScreenAwake() {
    if (wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } catch (_) {
      wakeLock = null; // not allowed yet (needs a user gesture) or unsupported
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      keepScreenAwake();
      scheduleIdle();
    }
  });

  // --------------------------------------------------------------------------
  // Touch hardening for a shared iPad
  // --------------------------------------------------------------------------
  // Block Safari's pinch-zoom gestures (double-tap zoom is handled in CSS).
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) =>
    document.addEventListener(type, (event) => event.preventDefault(), { passive: false })
  );

  // No long-press context menu on the touch kiosk UI (text fields keep theirs;
  // mouse right-click on a computer is left alone).
  const touchScreen = window.matchMedia?.('(hover: none) and (pointer: coarse)');
  document.addEventListener('contextmenu', (event) => {
    if (!touchScreen?.matches) return;
    if (event.target?.closest?.('input, textarea, [contenteditable="true"]')) return;
    event.preventDefault();
  });

  // --------------------------------------------------------------------------
  // The header's end (.nav-tools): the fullscreen button sits there (boards),
  // with room for one more control beside it (v5.13.3).
  // --------------------------------------------------------------------------
  const headerNav = document.querySelector('.top-nav');
  const navTools = headerNav ? document.createElement('div') : null;
  if (navTools) {
    navTools.className = 'nav-tools';
    headerNav.appendChild(navTools);
  }

  // --------------------------------------------------------------------------
  // «ابحث عن قيمة» (v5.13.3, the owner's pick for that spot): a field in the
  // header, stretched from its end toward the middle, that finds one of the
  // twelve values and opens it. Nothing drops down until the visitor types
  // (owner's request); then only the matching values show under the field,
  // forgiving the usual spelling differences (ال, أ/إ/آ, ة/ه, ى/ي,
  // diacritics). Choosing opens the value's window. Big screens only (no room
  // in a phone's header). The results live outside the header (its clip would
  // cut them) and close with Escape, a touch elsewhere, a scroll or the
  // waiting screen. (Not the stories search removed in v5.13: that one
  // searched the texts.)
  // --------------------------------------------------------------------------
  const FIND_ICON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>';
  const fold = (s) =>
    String(s || '')
      .replace(/[ً-ٰٟـ]/g, '') // diacritics, tatweel
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/(^|\s)ال/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

  let finder = null; // { panel, list, empty, items, filter, choose }
  let finderInput = null; // the field in the header
  let finderBar = null;
  function finderOpen() {
    return Boolean(finder && finder.panel.classList.contains('is-open'));
  }
  function closeFinder(returnFocus) {
    if (!finderOpen()) return;
    finder.panel.classList.remove('is-open');
    finder.panel.setAttribute('aria-hidden', 'true');
    finderInput?.setAttribute('aria-expanded', 'false');
    if (returnFocus) finderInput?.focus?.({ preventScroll: true });
  }
  function buildFinder() {
    const data = window.AL_ILM_DATA;
    if (!data || !Array.isArray(data.values)) return null;
    const paint = window.ALM_PALETTE?.paint || ((v) => v);
    const values = data.values.map(paint);
    const icons = data.icons || {};
    const GROUP = { A: 'قيم المعرض', B: 'قيم التميز والريادة' };

    const panel = document.createElement('div');
    panel.className = 'vf-panel';
    panel.id = 'valueFinderPanel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
      '<div class="vf-list" role="listbox" aria-label="القيم المطابقة"></div>' +
      '<p class="vf-empty" hidden>ما فيه قيمة بهذا الاسم، جرّب كلمة ثانية</p>';
    document.body.appendChild(panel);
    const input = finderInput;
    const list = panel.querySelector('.vf-list');
    const empty = panel.querySelector('.vf-empty');

    const items = values.map((v) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vf-item';
      b.setAttribute('role', 'option');
      b.dataset.id = v.id;
      b.style.setProperty('--c', v.accent);
      b.innerHTML =
        `<span class="vf-ic">${icons[v.id] || ''}</span>` +
        `<span class="vf-txt"><span class="vf-name"></span><span class="vf-sub"></span></span>`;
      b.querySelector('.vf-name').textContent = v.name;
      b.querySelector('.vf-sub').textContent = GROUP[v.group] || '';
      b.addEventListener('click', () => choose(v.id));
      list.appendChild(b);
      return { el: b, id: v.id, name: fold(v.name), more: fold(`${v.sub || ''} ${v.text || ''}`) };
    });

    function choose(id) {
      closeFinder(false);
      input.value = '';
      input.blur();
      window.openStudio?.(id);
    }

    // names first; a word found only in a value's line or message comes after
    function filter() {
      const q = fold(input.value);
      let shown = 0;
      const byName = [];
      const byText = [];
      items.forEach((it) => {
        const name = !q || it.name.includes(q);
        const text = !name && q.length > 1 && it.more.includes(q);
        it.el.hidden = !(name || text);
        it.el.classList.remove('is-active');
        if (name) byName.push(it);
        else if (text) byText.push(it);
      });
      byName.concat(byText).forEach((it) => {
        list.appendChild(it.el); // order: name matches, then text matches
        shown++;
      });
      empty.hidden = shown > 0;
      const first = byName[0] || byText[0];
      if (q && first) first.el.classList.add('is-active');
    }
    return { panel, list, empty, items, filter, choose };
  }
  function placeFinder() {
    const r = finderBar.getBoundingClientRect();
    // under the field and as wide as it (at least room for two columns of
    // results on a narrow field), kept on screen
    const w = Math.min(window.innerWidth - 24, Math.max(r.width, 320));
    const left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
    finder.panel.style.width = `${Math.round(w)}px`;
    finder.panel.style.left = `${Math.round(left)}px`;
    finder.panel.style.top = `${Math.round(r.bottom + 10)}px`;
    finder.panel.style.maxHeight = `${Math.max(200, window.innerHeight - r.bottom - 26)}px`;
  }
  // results only while there is something typed
  function updateFinder() {
    if (!finder) finder = buildFinder();
    if (!finder) return;
    if (!fold(finderInput.value)) {
      closeFinder(false);
      return;
    }
    finder.filter();
    placeFinder();
    finder.panel.classList.add('is-open');
    finder.panel.setAttribute('aria-hidden', 'false');
    finderInput.setAttribute('aria-expanded', 'true');
  }
  if (navTools) {
    finderBar = document.createElement('label');
    finderBar.className = 'vf-bar';
    finderBar.innerHTML =
      `${FIND_ICON}<input type="search" class="vf-bar-input" placeholder="ابحث عن قيمة" ` +
      'aria-label="ابحث عن قيمة" role="combobox" aria-autocomplete="list" aria-expanded="false" ' +
      'aria-controls="valueFinderPanel" autocomplete="off" enterkeyhint="search" />';
    finderInput = finderBar.querySelector('input');
    navTools.appendChild(finderBar);
    finderInput.addEventListener('input', updateFinder);
    finderInput.addEventListener('focus', () => {
      if (fold(finderInput.value)) updateFinder(); // back to the field: its results again
    });
    finderInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (finderOpen()) closeFinder(false);
        else finderInput.value = '';
        return;
      }
      if (!finderOpen()) {
        if (event.key === 'ArrowDown' && fold(finderInput.value)) updateFinder();
        return;
      }
      const visible = finder.items.filter((it) => !it.el.hidden).map((it) => it.el);
      const at = visible.findIndex((el) => el.classList.contains('is-active'));
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!visible.length) return;
        const next = event.key === 'ArrowDown' ? (at + 1) % visible.length : (at - 1 + visible.length) % visible.length;
        visible.forEach((el) => el.classList.remove('is-active'));
        visible[next].classList.add('is-active');
        visible[next].scrollIntoView({ block: 'nearest' });
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const pick = visible[at >= 0 ? at : 0];
        if (pick) finder.choose(pick.dataset.id);
      }
    });
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!finderOpen()) return;
        if (finder.panel.contains(event.target) || finderBar.contains(event.target)) return;
        closeFinder(false);
      },
      true
    );
    window.addEventListener('scroll', () => closeFinder(false), { passive: true });
    window.addEventListener('resize', () => {
      if (finderOpen()) placeFinder();
    }, { passive: true });
  }

  // --------------------------------------------------------------------------
  // «على جوالك» (v5.13.4, beside the search, the owner's request): a visitor
  // at the big screen takes the exhibit along. The button opens a small card
  // under it with the site's code to scan (the same code as the iPad poster,
  // _office_docs_and_tools/ipad_qr, checked module by module against a fresh
  // encoding of https://afteryou.pages.dev: version 2, level M, mask 3). Big
  // screens only (phones are already there). The card lives outside the
  // header (its clip would cut it) and closes with ✕, Escape, a touch
  // elsewhere, a scroll, the search opening, the waiting screen or after 25 s.
  // --------------------------------------------------------------------------
  const SITE_URL_TEXT = 'afteryou.pages.dev';
  const SITE_QR = [
    '#######.#.###.#.#.#######',
    '#.....#.#.#.#.#...#.....#',
    '#.###.#......#.#..#.###.#',
    '#.###.#.####.##...#.###.#',
    '#.###.#..#.#..##..#.###.#',
    '#.....#...#.##....#.....#',
    '#######.#.#.#.#.#.#######',
    '........#...#...#........',
    '#.##.###......#...#..#.##',
    '#...#..#.####...#..#...#.',
    '#..####..#.#.#..#..##....',
    '....##....#.####..##.##..',
    '.###.###...####..##.#.###',
    '....##.#...#..###.###...#',
    '.#..#.##..#..##..#..#.##.',
    '#.#..#.#.###..##..###...#',
    '...##.#.######.##########',
    '........#.#######...#.#.#',
    '#######.#....#..#.#.#.###',
    '#.....#.#.###..##...#..##',
    '#.###.#..#......######..#',
    '#.###.#.####.#.####.#####',
    '#.###.#.####.#...##.#.##.',
    '#.....#.....##.#.#..#.#..',
    '#######.##..###..########'
  ];
  const qrSvg = () => {
    const n = SITE_QR.length;
    const q = 4; // the quiet zone around the code
    const s = n + 2 * q;
    const eye = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    let rects = '';
    SITE_QR.forEach((row, r) => {
      for (let c = 0; c < n; c++) {
        if (row[c] !== '#') continue;
        // the corner eyes in deep logo teal (about 8:1 on white), the rest in the site's deep sea
        rects += `<rect x="${c + q}" y="${r + q}" width="1.02" height="1.02" fill="${eye(r, c) ? '#00596a' : '#051920'}"/>`;
      }
    });
    return (
      `<svg viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges" role="img" aria-label="رمز الموقع ${SITE_URL_TEXT}">` +
      `<rect width="${s}" height="${s}" fill="#ffffff"/>${rects}</svg>`
    );
  };
  const QR_ICON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 20.5h1.5M20.5 14v1.5"/></svg>';

  let phoneCard = null;
  let phoneBtn = null;
  let phoneTimer = 0;
  function phoneOpen() {
    return Boolean(phoneCard && phoneCard.classList.contains('is-open'));
  }
  function closePhoneCard(returnFocus) {
    if (!phoneOpen()) return;
    phoneCard.classList.remove('is-open');
    phoneCard.setAttribute('aria-hidden', 'true');
    phoneBtn?.setAttribute('aria-expanded', 'false');
    window.clearTimeout(phoneTimer);
    if (returnFocus) phoneBtn?.focus?.({ preventScroll: true });
  }
  function placePhoneCard() {
    const r = phoneBtn.getBoundingClientRect();
    const w = phoneCard.offsetWidth;
    // under the button, its left edge with the button's, kept on screen
    const left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
    phoneCard.style.left = `${Math.round(left)}px`;
    phoneCard.style.top = `${Math.round(r.bottom + 10)}px`;
  }
  function openPhoneCard() {
    if (!phoneCard) {
      phoneCard = document.createElement('div');
      phoneCard.className = 'phone-qr-card';
      phoneCard.id = 'phoneQrCard';
      phoneCard.setAttribute('role', 'dialog');
      phoneCard.setAttribute('aria-label', 'افتح المعرض على جوالك');
      phoneCard.setAttribute('aria-hidden', 'true');
      phoneCard.innerHTML =
        '<button type="button" class="pq-close" aria-label="إغلاق">✕</button>' +
        '<p class="pq-title">امسح الرمز بكاميرا جوالك</p>' +
        `<div class="pq-code">${qrSvg()}</div>` +
        `<p class="pq-url" dir="ltr">${SITE_URL_TEXT}</p>`;
      document.body.appendChild(phoneCard);
      phoneCard.querySelector('.pq-close').addEventListener('click', () => closePhoneCard(true));
    }
    closeFinder(false); // one drop-down at a time
    placePhoneCard();
    phoneCard.classList.add('is-open');
    phoneCard.setAttribute('aria-hidden', 'false');
    phoneBtn.setAttribute('aria-expanded', 'true');
    window.clearTimeout(phoneTimer);
    phoneTimer = window.setTimeout(() => closePhoneCard(false), 25000);
  }
  if (navTools) {
    phoneBtn = document.createElement('button');
    phoneBtn.type = 'button';
    phoneBtn.className = 'phone-qr-btn';
    phoneBtn.setAttribute('aria-expanded', 'false');
    phoneBtn.setAttribute('aria-controls', 'phoneQrCard');
    phoneBtn.setAttribute('aria-label', 'افتح المعرض على جوالك');
    phoneBtn.title = 'افتح المعرض على جوالك';
    phoneBtn.innerHTML = `${QR_ICON}<span class="pq-label">على جوالك</span>`;
    phoneBtn.addEventListener('click', () => (phoneOpen() ? closePhoneCard(false) : openPhoneCard()));
    navTools.appendChild(phoneBtn); // after the search field: nearer the header's end
    // typing in the search closes the card
    finderInput?.addEventListener('input', () => closePhoneCard(false));
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!phoneOpen()) return;
        if (phoneCard.contains(event.target) || phoneBtn.contains(event.target)) return;
        closePhoneCard(false);
      },
      true
    );
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && phoneOpen()) closePhoneCard(true);
    });
    window.addEventListener('scroll', () => closePhoneCard(false), { passive: true });
    window.addEventListener('resize', () => closePhoneCard(false), { passive: true });
  }

  // --------------------------------------------------------------------------
  // «ملء الشاشة» — the owner's rule (v5.10): only where the browser's own bar
  // stays on screen: interactive classroom boards (BenQ and the like), smart
  // TVs and Android tablets. Not on computers, the iPad, the iPhone or any
  // phone («بس مب الجوالات», v5.13.7: Android phones showed it too).
  // The exhibition board is a BenQ RM7504 on Android 13: the Android rule
  // covers it (and perf_tier.js names it a board, also in «desktop site»
  // mode). For any other screen that needs it, open the site once on it with
  // ?fs=1: that device remembers it (?fs=0 hides the button for good,
  // ?fs=auto goes back to the rule).
  // Once turned on, the next touch after a reload brings full screen back
  // (browsers allow it only from a touch), until turned off with the button.
  // The button sits in the header; while the header is folded to its logo
  // pill or scrolled away, a floating copy in the top corner keeps it in reach.
  // --------------------------------------------------------------------------
  const FS_PREF = 'alm_fullscreen';
  const FS_SHOW = 'alm_fs_show';
  const docEl = document.documentElement;
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const fsSupported = Boolean(docEl.requestFullscreen || docEl.webkitRequestFullscreen) && document.fullscreenEnabled !== false;
  const fsWanted = () => {
    const asked = /[?&]fs=(0|1|auto)\b/.exec(location.search);
    let kept = null;
    try {
      if (asked && asked[1] === 'auto') localStorage.removeItem(FS_SHOW);
      else if (asked) localStorage.setItem(FS_SHOW, asked[1]);
      kept = localStorage.getItem(FS_SHOW);
    } catch (_) {}
    if (asked && asked[1] !== 'auto') return asked[1] === '1';
    if (kept === '1' || kept === '0') return kept === '1';
    const ua = navigator.userAgent || '';
    const device = (window.PerfTier && window.PerfTier.device) || '';
    if (device === 'ipad' || /iPad|iPhone|iPod|Macintosh/.test(ua)) return false;
    // phones: a phone-sized screen (its short side under 600px). The size
    // decides, not only the browser's name, so the board keeps its button even
    // if its browser ever introduces itself as a phone ("Mobile")
    const scr = window.screen || {};
    const shortSide = Math.min(scr.width || 0, scr.height || 0);
    if ((device === 'phone' || /Android.+Mobile/.test(ua)) && shortSide > 0 && shortSide < 600) return false;
    if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) return false;
    return /Android/.test(ua) || device === 'tv' || device === 'board';
  };
  const readPref = () => {
    try {
      return localStorage.getItem(FS_PREF) === '1';
    } catch (_) {
      return false;
    }
  };
  const writePref = (on) => {
    try {
      localStorage.setItem(FS_PREF, on ? '1' : '0');
    } catch (_) {}
  };

  function enterFullscreen() {
    const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
    if (!req) return;
    try {
      const p = req.call(docEl, { navigationUI: 'hide' });
      if (p && p.catch) p.catch(() => {});
    } catch (_) {}
  }

  function exitFullscreen() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (!exit) return;
    try {
      const p = exit.call(document);
      if (p && p.catch) p.catch(() => {});
    } catch (_) {}
  }

  if (fsSupported && fsWanted()) {
    const ICON_ENTER =
      '<svg class="fs-icon-enter" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    const ICON_EXIT =
      '<svg class="fs-icon-exit" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
    const makeFsButton = (id, extra) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.id = id;
      b.className = `fs-btn${extra ? ` ${extra}` : ''}`;
      b.innerHTML = `${ICON_ENTER}${ICON_EXIT}<span class="fs-label"></span>`;
      return b;
    };
    const nav = document.querySelector('.top-nav');
    const fsBtn = makeFsButton('fullscreenBtn');
    // in the header's end (on phones the bottom bar holds the sections)
    (navTools || nav || document.body).appendChild(fsBtn);
    // with the search and «على جوالك» beside it, this button shows its icon
    // alone in the one-row header, so the bar stays centred on a board's
    // enlarged type (stage3 .top-nav.has-fs)
    nav?.classList.add('has-fs');
    // the floating copy: outside the header (the header's clip would hide it)
    const fsFloat = makeFsButton('fullscreenBtnFloat', 'fs-btn--float');
    document.body.appendChild(fsFloat);
    const fsButtons = [fsBtn, fsFloat];
    docEl.classList.add('can-fullscreen');

    const sync = () => {
      const on = Boolean(fsElement());
      docEl.classList.toggle('is-fullscreen', on);
      const label = on ? 'إلغاء ملء الشاشة' : 'ملء الشاشة';
      fsButtons.forEach((b) => {
        b.classList.toggle('is-on', on);
        b.querySelector('.fs-label').textContent = on ? 'إلغاء' : 'ملء الشاشة';
        b.setAttribute('aria-label', label);
        b.title = label;
      });
    };
    sync();
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);

    const toggleFs = () => {
      if (fsElement()) {
        writePref(false);
        exitFullscreen();
      } else {
        writePref(true);
        enterFullscreen();
      }
    };
    fsButtons.forEach((b) => b.addEventListener('click', toggleFs));

    // The floating copy shows only while the header's own button is out of
    // reach: the header folded to its logo pill, or scrolled off the screen.
    let floatQueued = false;
    const placeFloat = () => {
      floatQueued = false;
      const folded = Boolean(nav && nav.classList.contains('is-folded'));
      const gone = !nav || nav.getBoundingClientRect().bottom < 4;
      const show = folded || gone;
      if (show && folded && !gone) {
        // level with the folded logo pill
        const r = nav.getBoundingClientRect();
        const pillH = parseFloat(nav.style.getPropertyValue('--nav-pill-h')) || 0;
        const top = pillH ? r.top + (pillH - fsFloat.offsetHeight) / 2 : 0;
        fsFloat.style.top = top > 4 ? `${Math.round(top)}px` : '';
      } else if (show) {
        fsFloat.style.top = '';
      }
      if (fsFloat.classList.contains('is-shown') !== show) {
        fsFloat.classList.toggle('is-shown', show);
        fsFloat.tabIndex = show ? 0 : -1;
        fsFloat.setAttribute('aria-hidden', show ? 'false' : 'true');
      }
    };
    const queueFloat = () => {
      if (floatQueued) return;
      floatQueued = true;
      requestAnimationFrame(placeFloat);
    };
    fsFloat.tabIndex = -1;
    fsFloat.setAttribute('aria-hidden', 'true');
    window.addEventListener('scroll', queueFloat, { passive: true });
    window.addEventListener('resize', queueFloat, { passive: true });
    if (nav && 'MutationObserver' in window) {
      new MutationObserver(queueFloat).observe(nav, { attributes: true, attributeFilter: ['class'] });
    }
    queueFloat();

    // turned on before: the first touch of this visit brings it back
    if (readPref() && !fsElement()) {
      const again = (event) => {
        window.removeEventListener('pointerup', again, true);
        if (event.target && event.target.closest && event.target.closest('.fs-btn')) return; // the button decides
        if (readPref() && !fsElement()) enterFullscreen();
      };
      window.addEventListener('pointerup', again, true);
    }
  }

  // Small public handle (handy for testing on the device).
  window.ExhibitionKiosk = {
    enterAttract,
    exitAttract,
    get isAttracting() {
      return attract;
    },
    /** test the fresh start now: ExhibitionKiosk.quietRefresh(true) while waiting */
    quietRefresh,
    IDLE_MS,
    IDLE_MS_READING,
    REFRESH_MS
  };

  scheduleIdle();
  keepScreenAwake();

  // after a quiet fresh start: straight back to the waiting screen
  let resume = false;
  try {
    resume = sessionStorage.getItem(RESUME_KEY) === '1';
    sessionStorage.removeItem(RESUME_KEY);
  } catch (_) {}
  if (resume) {
    const back = () => window.setTimeout(enterAttract, 400);
    if (document.readyState === 'complete') back();
    else window.addEventListener('load', back, { once: true });
  }
})();
