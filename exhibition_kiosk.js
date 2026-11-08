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
    return Boolean(studio?.isPlaying || (synth?.speaking && !synth.paused));
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
