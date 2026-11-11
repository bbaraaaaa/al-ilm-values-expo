/* Built by tools/build-legacy.ps1 from exhibition_kiosk.js (sha256 da1e47524a6f46508b19fd8453080ae3b493d0d29c16d41014c569e5b6f2d56c) for older browsers. Do not edit: edit exhibition_kiosk.js and rebuild. */
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
  const SLIDE_MS = 7e3;
  const SWAP_MS = 430;
  const LEAVE_MS = 450;
  const DRAG_PX = 14;
  const TOUCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>';
  const SWIPE_ICON = '<svg class="ks-swipe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17 11-5-5-5 5"/><path d="m17 18-5-5-5 5"/></svg>';
  function buildShowcase() {
    var _a2;
    const data = window.AL_ILM_DATA;
    if (!data || !Array.isArray(data.values) || !data.values.length) return null;
    const paint = ((_a2 = window.ALM_PALETTE) == null ? void 0 : _a2.paint) || ((v) => v);
    const values = data.values.map(paint);
    const icons = data.icons || {};
    const GROUP = { A: "قيم المعرض", B: "قيم التميز والريادة" };
    const show = document.createElement("div");
    show.className = "kiosk-show";
    show.setAttribute("aria-hidden", "true");
    show.innerHTML = `<div class="ks-light"></div><div class="ks-glow"></div><div class="ks-glow"></div><div class="ks-top"><img src="./assets/school-emblem.svg" alt="" width="60" height="60" decoding="async" /><div><b>ثانوية العلم النافع الأهلية</b><span>معرض ترسيخ القيم</span></div></div><div class="ks-stage is-pre"><div class="ks-icon"></div><div class="ks-meta"></div><div class="ks-name"></div><p class="ks-sub"></p></div><div class="ks-foot"><div class="ks-actions"><div class="ks-cta ks-cta--tap">${TOUCH_ICON}<span>اضغط لتستكشف هذه القيمة</span></div><div class="ks-cta ks-cta--swipe">${SWIPE_ICON}<span>اسحب لتستكشف الموقع</span></div></div><div class="ks-dots"></div></div>`;
    document.body.appendChild(show);
    const stage = show.querySelector(".ks-stage");
    const glows = show.querySelectorAll(".ks-glow");
    const dotsBox = show.querySelector(".ks-dots");
    const el = {
      icon: show.querySelector(".ks-icon"),
      meta: show.querySelector(".ks-meta"),
      name: show.querySelector(".ks-name"),
      sub: show.querySelector(".ks-sub")
    };
    show.style.setProperty("--slide", `${SLIDE_MS}ms`);
    values.forEach(() => dotsBox.appendChild(document.createElement("i")));
    const dots = dotsBox.children;
    let index = 0;
    let shownOnce = false;
    let on = false;
    let glowSide = 0;
    let slideTimer = 0;
    let swapTimer = 0;
    let leaveTimer = 0;
    let downAt = null;
    function fill() {
      const v = values[index];
      show.style.setProperty("--c", v.accent);
      el.icon.innerHTML = icons[v.id] || "";
      el.meta.textContent = `القيمة ${v.num} · ${GROUP[v.group] || ""}`;
      el.name.textContent = v.name;
      el.name.style.fontSize = "";
      const room = show.clientWidth * 0.88;
      const wide = el.name.scrollWidth;
      if (wide > room) {
        el.name.style.fontSize = `${Math.floor(parseFloat(getComputedStyle(el.name).fontSize) * room / wide)}px`;
      }
      el.sub.textContent = v.sub || "";
      for (let k = 0; k < dots.length; k++) dots[k].classList.remove("is-now");
      void dots[index].offsetWidth;
      dots[index].classList.add("is-now");
      glows[glowSide].style.setProperty("--c", v.accent);
      glows[glowSide].classList.add("is-shown");
      glows[1 - glowSide].classList.remove("is-shown");
      glowSide = 1 - glowSide;
    }
    function enter() {
      stage.classList.add("is-pre");
      stage.classList.remove("is-out");
      fill();
      void stage.offsetWidth;
      stage.classList.remove("is-pre");
    }
    function advance() {
      if (document.hidden) return;
      stage.classList.add("is-out");
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
      show.classList.remove("is-on");
    }
    function start() {
      window.clearTimeout(leaveTimer);
      if (on) return;
      on = true;
      if (shownOnce) index = (index + 1) % values.length;
      shownOnce = true;
      show.classList.add("is-on");
      enter();
      slideTimer = window.setInterval(advance, SLIDE_MS);
    }
    function leave() {
      window.clearTimeout(leaveTimer);
      if (downAt) return;
      leaveTimer = window.setTimeout(hide, LEAVE_MS);
    }
    function openShown() {
      var _a3;
      if (!show.classList.contains("is-on")) return;
      const v = values[index];
      hide();
      if (v) (_a3 = window.openStudio) == null ? void 0 : _a3.call(window, v.id);
      scheduleIdle();
    }
    show.addEventListener("pointerdown", (event) => {
      downAt = { x: event.clientX, y: event.clientY };
      window.clearTimeout(leaveTimer);
    });
    show.addEventListener("pointermove", (event) => {
      if (!downAt) return;
      if (Math.abs(event.clientX - downAt.x) > DRAG_PX || Math.abs(event.clientY - downAt.y) > DRAG_PX) {
        downAt = null;
        hide();
      }
    });
    show.addEventListener("pointercancel", () => {
      downAt = null;
      hide();
    });
    show.addEventListener("pointerup", () => {
      window.setTimeout(() => {
        if (!attract && show.classList.contains("is-on")) {
          downAt = null;
          hide();
        }
      }, 300);
    });
    show.addEventListener("wheel", () => hide(), { passive: true });
    show.addEventListener("click", () => {
      if (!downAt) return;
      downAt = null;
      openShown();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!show.classList.contains("is-on")) return;
      event.preventDefault();
      openShown();
    });
    return { start, leave };
  }
  const showcase = buildShowcase();
  if (!showcase) {
    const hint = document.createElement("div");
    hint.className = "attract-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.textContent = "👆 المس الشاشة لاستكشاف القيم";
    document.body.appendChild(hint);
  }
  function resetToWelcome() {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i;
    ignoreActivityUntil = performance.now() + 1500;
    closeFinder(false);
    if (finderInput) finderInput.value = "";
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
  const REFRESH_MS = 4 * 60 * 60 * 1e3;
  const REFRESH_CHECK_MS = 60 * 1e3;
  const RESUME_KEY = "alm_resume_attract";
  const startedAt = Date.now();
  let refreshTimer = 0;
  async function quietRefresh(force) {
    if (!attract || mediaBusy() || document.hidden) return false;
    if (!force && Date.now() - startedAt < REFRESH_MS) return false;
    if (navigator.onLine === false) return false;
    try {
      const res = await fetch(location.href.split("#")[0], { method: "HEAD", cache: "no-store" });
      if (!res.ok || !attract) return false;
    } catch (_) {
      return false;
    }
    try {
      sessionStorage.setItem(RESUME_KEY, "1");
    } catch (_) {
    }
    location.reload();
    return true;
  }
  function enterAttract() {
    if (attract) return;
    resetToWelcome();
    attract = true;
    document.body.classList.add("is-attract");
    if (showcase) showcase.start();
    else if (!reducedMotion()) {
      rotateTimer = window.setInterval(() => {
        var _a2, _b, _c;
        if (document.hidden || ((_a2 = window.AlIlmState) == null ? void 0 : _a2.isSpinning)) return;
        (_c = (_b = window.OrbitPhysics) == null ? void 0 : _b.step) == null ? void 0 : _c.call(_b, 1);
      }, ROTATE_MS);
    }
    window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(() => quietRefresh(false), REFRESH_CHECK_MS);
  }
  function exitAttract() {
    if (!attract) return;
    attract = false;
    document.body.classList.remove("is-attract");
    window.clearInterval(rotateTimer);
    rotateTimer = 0;
    window.clearInterval(refreshTimer);
    refreshTimer = 0;
    showcase == null ? void 0 : showcase.leave();
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
  const headerNav = document.querySelector(".top-nav");
  const navTools = headerNav ? document.createElement("div") : null;
  if (navTools) {
    navTools.className = "nav-tools";
    headerNav.appendChild(navTools);
  }
  const FIND_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>';
  const fold = (s) => String(s || "").replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/(^|\s)ال/g, "$1").replace(/\s+/g, " ").trim();
  let finder = null;
  let finderInput = null;
  let finderBar = null;
  function finderOpen() {
    return Boolean(finder && finder.panel.classList.contains("is-open"));
  }
  function closeFinder(returnFocus) {
    var _a2;
    if (!finderOpen()) return;
    finder.panel.classList.remove("is-open");
    finder.panel.setAttribute("aria-hidden", "true");
    finderInput == null ? void 0 : finderInput.setAttribute("aria-expanded", "false");
    if (returnFocus) (_a2 = finderInput == null ? void 0 : finderInput.focus) == null ? void 0 : _a2.call(finderInput, { preventScroll: true });
  }
  function buildFinder() {
    var _a2;
    const data = window.AL_ILM_DATA;
    if (!data || !Array.isArray(data.values)) return null;
    const paint = ((_a2 = window.ALM_PALETTE) == null ? void 0 : _a2.paint) || ((v) => v);
    const values = data.values.map(paint);
    const icons = data.icons || {};
    const GROUP = { A: "قيم المعرض", B: "قيم التميز والريادة" };
    const panel = document.createElement("div");
    panel.className = "vf-panel";
    panel.id = "valueFinderPanel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = '<div class="vf-list" role="listbox" aria-label="القيم المطابقة"></div><p class="vf-empty" hidden>ما فيه قيمة بهذا الاسم، جرّب كلمة ثانية</p>';
    document.body.appendChild(panel);
    const input = finderInput;
    const list = panel.querySelector(".vf-list");
    const empty = panel.querySelector(".vf-empty");
    const items = values.map((v) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "vf-item";
      b.setAttribute("role", "option");
      b.dataset.id = v.id;
      b.style.setProperty("--c", v.accent);
      b.innerHTML = `<span class="vf-ic">${icons[v.id] || ""}</span><span class="vf-txt"><span class="vf-name"></span><span class="vf-sub"></span></span>`;
      b.querySelector(".vf-name").textContent = v.name;
      b.querySelector(".vf-sub").textContent = GROUP[v.group] || "";
      b.addEventListener("click", () => choose(v.id));
      list.appendChild(b);
      return { el: b, id: v.id, name: fold(v.name), more: fold(`${v.sub || ""} ${v.text || ""}`) };
    });
    function choose(id) {
      var _a3;
      closeFinder(false);
      input.value = "";
      input.blur();
      (_a3 = window.openStudio) == null ? void 0 : _a3.call(window, id);
    }
    function filter() {
      const q = fold(input.value);
      let shown = 0;
      const byName = [];
      const byText = [];
      items.forEach((it) => {
        const name = !q || it.name.includes(q);
        const text = !name && q.length > 1 && it.more.includes(q);
        it.el.hidden = !(name || text);
        it.el.classList.remove("is-active");
        if (name) byName.push(it);
        else if (text) byText.push(it);
      });
      byName.concat(byText).forEach((it) => {
        list.appendChild(it.el);
        shown++;
      });
      empty.hidden = shown > 0;
      const first = byName[0] || byText[0];
      if (q && first) first.el.classList.add("is-active");
    }
    return { panel, list, empty, items, filter, choose };
  }
  function placeFinder() {
    const r = finderBar.getBoundingClientRect();
    const w = Math.min(window.innerWidth - 24, Math.max(r.width, 320));
    const left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
    finder.panel.style.width = `${Math.round(w)}px`;
    finder.panel.style.left = `${Math.round(left)}px`;
    finder.panel.style.top = `${Math.round(r.bottom + 10)}px`;
    finder.panel.style.maxHeight = `${Math.max(200, window.innerHeight - r.bottom - 26)}px`;
  }
  function updateFinder() {
    if (!finder) finder = buildFinder();
    if (!finder) return;
    if (!fold(finderInput.value)) {
      closeFinder(false);
      return;
    }
    finder.filter();
    placeFinder();
    finder.panel.classList.add("is-open");
    finder.panel.setAttribute("aria-hidden", "false");
    finderInput.setAttribute("aria-expanded", "true");
  }
  if (navTools) {
    finderBar = document.createElement("label");
    finderBar.className = "vf-bar";
    finderBar.innerHTML = `${FIND_ICON}<input type="search" class="vf-bar-input" placeholder="ابحث عن قيمة" aria-label="ابحث عن قيمة" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="valueFinderPanel" autocomplete="off" enterkeyhint="search" />`;
    finderInput = finderBar.querySelector("input");
    navTools.appendChild(finderBar);
    finderInput.addEventListener("input", updateFinder);
    finderInput.addEventListener("focus", () => {
      if (fold(finderInput.value)) updateFinder();
    });
    finderInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (finderOpen()) closeFinder(false);
        else finderInput.value = "";
        return;
      }
      if (!finderOpen()) {
        if (event.key === "ArrowDown" && fold(finderInput.value)) updateFinder();
        return;
      }
      const visible = finder.items.filter((it) => !it.el.hidden).map((it) => it.el);
      const at = visible.findIndex((el) => el.classList.contains("is-active"));
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!visible.length) return;
        const next = event.key === "ArrowDown" ? (at + 1) % visible.length : (at - 1 + visible.length) % visible.length;
        visible.forEach((el) => el.classList.remove("is-active"));
        visible[next].classList.add("is-active");
        visible[next].scrollIntoView({ block: "nearest" });
      } else if (event.key === "Enter") {
        event.preventDefault();
        const pick = visible[at >= 0 ? at : 0];
        if (pick) finder.choose(pick.dataset.id);
      }
    });
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (!finderOpen()) return;
        if (finder.panel.contains(event.target) || finderBar.contains(event.target)) return;
        closeFinder(false);
      },
      true
    );
    window.addEventListener("scroll", () => closeFinder(false), { passive: true });
    window.addEventListener("resize", () => {
      if (finderOpen()) placeFinder();
    }, { passive: true });
  }
  const FS_PREF = "alm_fullscreen";
  const FS_SHOW = "alm_fs_show";
  const docEl = document.documentElement;
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const fsSupported = Boolean(docEl.requestFullscreen || docEl.webkitRequestFullscreen) && document.fullscreenEnabled !== false;
  const fsWanted = () => {
    const asked = /[?&]fs=(0|1|auto)\b/.exec(location.search);
    let kept = null;
    try {
      if (asked && asked[1] === "auto") localStorage.removeItem(FS_SHOW);
      else if (asked) localStorage.setItem(FS_SHOW, asked[1]);
      kept = localStorage.getItem(FS_SHOW);
    } catch (_) {
    }
    if (asked && asked[1] !== "auto") return asked[1] === "1";
    if (kept === "1" || kept === "0") return kept === "1";
    const ua = navigator.userAgent || "";
    const device = window.PerfTier && window.PerfTier.device || "";
    if (device === "ipad" || /iPad|iPhone|iPod|Macintosh/.test(ua)) return false;
    if (window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) return false;
    return /Android/.test(ua) || device === "tv" || device === "board";
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
    (navTools || nav || document.body).appendChild(fsBtn);
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
    /** test the fresh start now: ExhibitionKiosk.quietRefresh(true) while waiting */
    quietRefresh,
    IDLE_MS,
    IDLE_MS_READING,
    REFRESH_MS
  };
  scheduleIdle();
  keepScreenAwake();
  let resume = false;
  try {
    resume = sessionStorage.getItem(RESUME_KEY) === "1";
    sessionStorage.removeItem(RESUME_KEY);
  } catch (_) {
  }
  if (resume) {
    const back = () => window.setTimeout(enterAttract, 400);
    if (document.readyState === "complete") back();
    else window.addEventListener("load", back, { once: true });
  }
})();
