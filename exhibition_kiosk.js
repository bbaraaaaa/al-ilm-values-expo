/*
 * ============================================================================
 * EXHIBITION KIOSK LAYER — معرض ترسيخ القيم · iPad Air 13" (M2)
 * ----------------------------------------------------------------------------
 * - Attract mode: after a quiet period with no touch, close any open window,
 *   return to the welcome view and slowly turn the 3D orbit until the next
 *   visitor touches the screen.
 * - Keeps the iPad screen awake (Screen Wake Lock, iPadOS 16.4+).
 * - Touch hardening: no pinch-zoom, no long-press callouts on the kiosk UI.
 * Uses only public functions exposed by fable_engine.js / stage3_fable_upgrade.js.
 * ============================================================================
 */
(() => {
  'use strict';

  const IDLE_MS = 90 * 1000; // quiet time on the main page before attract mode
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
  // Attract-mode hint ("touch to explore"), shown only while attracting
  // --------------------------------------------------------------------------
  const hint = document.createElement('div');
  hint.className = 'attract-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = '👆 المس الشاشة لاستكشاف القيم';
  document.body.appendChild(hint);

  function resetToWelcome() {
    // Our own programmatic scroll/close events must not count as a visitor.
    ignoreActivityUntil = performance.now() + 1500;

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

  function enterAttract() {
    if (attract) return;
    resetToWelcome();
    attract = true;
    document.body.classList.add('is-attract');
    if (!reducedMotion()) {
      rotateTimer = window.setInterval(() => {
        if (document.hidden || window.AlIlmState?.isSpinning) return;
        window.OrbitPhysics?.step?.(1);
      }, ROTATE_MS);
    }
  }

  function exitAttract() {
    if (!attract) return;
    attract = false;
    document.body.classList.remove('is-attract');
    window.clearInterval(rotateTimer);
    rotateTimer = 0;
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
  // «ملء الشاشة» — the owner's rule (v5.10): only where the browser's own bar
  // stays on screen: interactive classroom boards (BenQ and the like), smart
  // TVs and Android phones / tablets. Not on computers, the iPad or iPhone.
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
    // in the header, after the search (on phones the bottom bar holds the sections)
    (nav || document.body).appendChild(fsBtn);
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
    IDLE_MS,
    IDLE_MS_READING
  };

  scheduleIdle();
  keepScreenAwake();
})();
