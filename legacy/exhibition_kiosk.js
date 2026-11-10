/* Built by tools/build-legacy.ps1 from exhibition_kiosk.js (sha256 d2f6b007835b46295021fd6dbff1acf473447230e4d45ba8b787bb1974b32e57) for older browsers. Do not edit: edit exhibition_kiosk.js and rebuild. */
(() => {
  "use strict";
  var _a;
  const IDLE_MS = 90 * 1e3;
  const IDLE_MS_READING = 180 * 1e3;
  const ROTATE_MS = 5e3;
  const $ = (id) => document.getElementById(id);
  const isOpen = (id) => {
    var _a2;
    return Boolean((_a2 = $(id)) == null ? void 0 : _a2.classList.contains("active"));
  };
  const readingOpen = () => isOpen("storyReaderModal") || isOpen("studioModal");
  const reducedMotion = () => {
    var _a2;
    return Boolean((_a2 = window.matchMedia) == null ? void 0 : _a2.call(window, "(prefers-reduced-motion: reduce)").matches) || document.body.classList.contains("classroom-mode");
  };
  const mediaBusy = () => {
    var _a2;
    const studio = window.AudioStudio;
    const synth = window.speechSynthesis;
    return Boolean((studio == null ? void 0 : studio.isPlaying) || ((_a2 = window.QuranRecite) == null ? void 0 : _a2.isPlaying) || (synth == null ? void 0 : synth.speaking) && !synth.paused);
  };
  let idleTimer = 0;
  let rotateTimer = 0;
  let attract = false;
  let ignoreActivityUntil = 0;
  const hint = document.createElement("div");
  hint.className = "attract-hint";
  hint.setAttribute("aria-hidden", "true");
  hint.textContent = "👆 المس الشاشة لاستكشاف القيم";
  document.body.appendChild(hint);
  function resetToWelcome() {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i;
    ignoreActivityUntil = performance.now() + 1500;
    if (isOpen("storyReaderModal")) (_a2 = window.closeStoryReader) == null ? void 0 : _a2.call(window);
    if (isOpen("studioModal")) (_b = window.closeStudio) == null ? void 0 : _b.call(window);
    if ((_c = window.speechSynthesis) == null ? void 0 : _c.speaking) window.speechSynthesis.cancel();
    (_e = (_d = document.activeElement) == null ? void 0 : _d.blur) == null ? void 0 : _e.call(_d);
    const search = $("globalSearchInput");
    if (search && search.value) {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (((_f = window.AlIlmState) == null ? void 0 : _f.activeGroup) !== "all") (_g = window.switchGroup) == null ? void 0 : _g.call(window, "all");
    (_i = (_h = window.AppRouter) == null ? void 0 : _h.switchView) == null ? void 0 : _i.call(_h, "all", false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  function enterAttract() {
    if (attract) return;
    resetToWelcome();
    attract = true;
    document.body.classList.add("is-attract");
    if (!reducedMotion()) {
      rotateTimer = window.setInterval(() => {
        var _a2, _b, _c;
        if (document.hidden || ((_a2 = window.AlIlmState) == null ? void 0 : _a2.isSpinning)) return;
        (_c = (_b = window.OrbitPhysics) == null ? void 0 : _b.step) == null ? void 0 : _c.call(_b, 1);
      }, ROTATE_MS);
    }
  }
  function exitAttract() {
    if (!attract) return;
    attract = false;
    document.body.classList.remove("is-attract");
    window.clearInterval(rotateTimer);
    rotateTimer = 0;
  }
  function scheduleIdle() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(onIdle, readingOpen() ? IDLE_MS_READING : IDLE_MS);
  }
  function onIdle() {
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
  ["pointerdown", "touchstart", "keydown", "wheel", "input"].forEach(
    (type) => window.addEventListener(type, onActivity, { capture: true, passive: true })
  );
  window.addEventListener(
    "scroll",
    () => {
      if (performance.now() < ignoreActivityUntil) return;
      onActivity();
    },
    { capture: true, passive: true }
  );
  let wakeLock = null;
  async function keepScreenAwake() {
    if (wakeLock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch (_) {
      wakeLock = null;
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      keepScreenAwake();
      scheduleIdle();
    }
  });
  ["gesturestart", "gesturechange", "gestureend"].forEach(
    (type) => document.addEventListener(type, (event) => event.preventDefault(), { passive: false })
  );
  const touchScreen = (_a = window.matchMedia) == null ? void 0 : _a.call(window, "(hover: none) and (pointer: coarse)");
  document.addEventListener("contextmenu", (event) => {
    var _a2, _b;
    if (!(touchScreen == null ? void 0 : touchScreen.matches)) return;
    if ((_b = (_a2 = event.target) == null ? void 0 : _a2.closest) == null ? void 0 : _b.call(_a2, 'input, textarea, [contenteditable="true"]')) return;
    event.preventDefault();
  });
  const FS_PREF = "alm_fullscreen";
  const docEl = document.documentElement;
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const fsSupported = Boolean(docEl.requestFullscreen || docEl.webkitRequestFullscreen) && document.fullscreenEnabled !== false;
  const fsWanted = () => {
    const asked = /[?&]fs=([01])\b/.exec(location.search);
    if (asked) return asked[1] === "1";
    const ua = navigator.userAgent || "";
    const device = window.PerfTier && window.PerfTier.device || "";
    if (device === "ipad" || /iPhone|iPod/.test(ua)) return false;
    if (window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) return false;
    return true;
  };
  const readPref = () => {
    try {
      return localStorage.getItem(FS_PREF) === "1";
    } catch (_) {
      return false;
    }
  };
  const writePref = (on) => {
    try {
      localStorage.setItem(FS_PREF, on ? "1" : "0");
    } catch (_) {
    }
  };
  function enterFullscreen() {
    const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
    if (!req) return;
    try {
      const p = req.call(docEl, { navigationUI: "hide" });
      if (p && p.catch) p.catch(() => {
      });
    } catch (_) {
    }
  }
  function exitFullscreen() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (!exit) return;
    try {
      const p = exit.call(document);
      if (p && p.catch) p.catch(() => {
      });
    } catch (_) {
    }
  }
  if (fsSupported && fsWanted()) {
    const ICON_ENTER = '<svg class="fs-icon-enter" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    const ICON_EXIT = '<svg class="fs-icon-exit" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
    const makeFsButton = (id, extra) => {
      const b = document.createElement("button");
      b.type = "button";
      b.id = id;
      b.className = `fs-btn${extra ? ` ${extra}` : ""}`;
      b.innerHTML = `${ICON_ENTER}${ICON_EXIT}<span class="fs-label"></span>`;
      return b;
    };
    const nav = document.querySelector(".top-nav");
    const fsBtn = makeFsButton("fullscreenBtn");
    (nav || document.body).appendChild(fsBtn);
    const fsFloat = makeFsButton("fullscreenBtnFloat", "fs-btn--float");
    document.body.appendChild(fsFloat);
    const fsButtons = [fsBtn, fsFloat];
    docEl.classList.add("can-fullscreen");
    const sync = () => {
      const on = Boolean(fsElement());
      docEl.classList.toggle("is-fullscreen", on);
      const label = on ? "إلغاء ملء الشاشة" : "ملء الشاشة";
      fsButtons.forEach((b) => {
        b.classList.toggle("is-on", on);
        b.querySelector(".fs-label").textContent = on ? "إلغاء" : "ملء الشاشة";
        b.setAttribute("aria-label", label);
        b.title = label;
      });
    };
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    const toggleFs = () => {
      if (fsElement()) {
        writePref(false);
        exitFullscreen();
      } else {
        writePref(true);
        enterFullscreen();
      }
    };
    fsButtons.forEach((b) => b.addEventListener("click", toggleFs));
    let floatQueued = false;
    const placeFloat = () => {
      floatQueued = false;
      const folded = Boolean(nav && nav.classList.contains("is-folded"));
      const gone = !nav || nav.getBoundingClientRect().bottom < 4;
      const show = folded || gone;
      if (show && folded && !gone) {
        const r = nav.getBoundingClientRect();
        const pillH = parseFloat(nav.style.getPropertyValue("--nav-pill-h")) || 0;
        const top = pillH ? r.top + (pillH - fsFloat.offsetHeight) / 2 : 0;
        fsFloat.style.top = top > 4 ? `${Math.round(top)}px` : "";
      } else if (show) {
        fsFloat.style.top = "";
      }
      if (fsFloat.classList.contains("is-shown") !== show) {
        fsFloat.classList.toggle("is-shown", show);
        fsFloat.tabIndex = show ? 0 : -1;
        fsFloat.setAttribute("aria-hidden", show ? "false" : "true");
      }
    };
    const queueFloat = () => {
      if (floatQueued) return;
      floatQueued = true;
      requestAnimationFrame(placeFloat);
    };
    fsFloat.tabIndex = -1;
    fsFloat.setAttribute("aria-hidden", "true");
    window.addEventListener("scroll", queueFloat, { passive: true });
    window.addEventListener("resize", queueFloat, { passive: true });
    if (nav && "MutationObserver" in window) {
      new MutationObserver(queueFloat).observe(nav, { attributes: true, attributeFilter: ["class"] });
    }
    queueFloat();
    if (readPref() && !fsElement()) {
      const again = (event) => {
        window.removeEventListener("pointerup", again, true);
        if (event.target && event.target.closest && event.target.closest(".fs-btn")) return;
        if (readPref() && !fsElement()) enterFullscreen();
      };
      window.addEventListener("pointerup", again, true);
    }
  }
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
