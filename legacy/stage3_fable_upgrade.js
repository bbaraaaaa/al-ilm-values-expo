/* Built by tools/build-legacy.ps1 from stage3_fable_upgrade.js (sha256 89a535363e4e5a4bd999e383d591789b0e99de2ff400e6a89616516684a5964a) for older browsers. Do not edit: edit stage3_fable_upgrade.js and rebuild. */
(() => {
  "use strict";
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const STORAGE_KEY = "al_ilm_hikmah_v2";
  const SCENARIOS_KEY = "al_ilm_scenarios_v2";
  const VALUES = (Array.isArray((_a = window.AL_ILM_DATA) == null ? void 0 : _a.values) ? window.AL_ILM_DATA.values : []).map(
    (v) => window.ALM_PALETTE ? window.ALM_PALETTE.paint(v) : v
  );
  const SCENARIOS = Array.isArray((_b = window.AL_ILM_DATA) == null ? void 0 : _b.scenarios) ? window.AL_ILM_DATA.scenarios : [];
  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHTML = (value) => {
    const el = document.createElement("span");
    el.textContent = value == null ? "" : String(value);
    return el.innerHTML;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const valueById = (id) => VALUES.find((value) => String(value.id) === String(id)) || null;
  const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const announce = (message) => {
    const region = $("almAnnouncer");
    if (region) region.textContent = message || "";
  };
  const prefersReducedMotion = () => {
    var _a2;
    return Boolean((_a2 = window.matchMedia) == null ? void 0 : _a2.call(window, "(prefers-reduced-motion: reduce)").matches) || document.body.classList.contains("classroom-mode");
  };
  const isFlagOrControlCodePoint = (cp) => cp >= 8234 && cp <= 8238 || cp >= 8294 && cp <= 8297 || cp >= 127462 && cp <= 127487 || cp >= 917536 && cp <= 917631 || cp === 127988 || cp === 127987 || cp === 127937 || cp === 128681 || cp === 127884;
  const cleanText = (value, maxLength) => {
    const raw = String(value == null ? "" : value);
    const kept = [];
    for (const ch of raw) {
      const cp = ch.codePointAt(0) || 0;
      if (!isFlagOrControlCodePoint(cp)) {
        kept.push(ch);
        if (kept.length >= maxLength) break;
      }
    }
    return kept.join("");
  };
  function buildStoriesCatalog() {
    return VALUES.flatMap(
      (value) => (Array.isArray(value.examples) ? value.examples : []).map((example, index) => ({
        id: `${value.id}_story_${index + 1}`,
        valueId: value.id,
        valueName: value.name,
        valueAccent: value.accent || "#D4AF37",
        title: example.title || "",
        story: example.story || example.text || "",
        typeLabel: example.type || (index === 0 ? "من السيرة والتاريخ" : index === 1 ? "من واقع ثانوية العلم النافع" : "من الوطن ورؤية 2030"),
        category: example.category || ["heritage", "school", "vision"][index] || "vision"
      }))
    );
  }
  const stories = buildStoriesCatalog();
  const narrationUnit = (storyId) => String(storyId).replace("_story_", "-s");
  window.Stage3 = window.Stage3 || {};
  window.Stage3.stories = stories;
  const defaultData = () => ({
    version: 2,
    legacyMigrated: false,
    studentName: "",
    classroomMode: false,
    readerFontStep: 1,
    audioSpeed: 1,
    todayFocus: null,
    practices: {},
    reflections: {},
    storiesRead: {},
    scenarios: {}
  });
  const normalizeFocus = (focus) => {
    if (!isRecord(focus)) return null;
    const value = valueById(focus.valueId);
    const stepIndex = Number(focus.stepIndex);
    if (!value || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 3) return null;
    return {
      valueId: value.id,
      stepIndex,
      updatedAt: Number.isFinite(Number(focus.updatedAt)) ? Number(focus.updatedAt) : Date.now()
    };
  };
  const normalizeScenarios = (input) => {
    const output = {};
    if (!isRecord(input)) return output;
    Object.entries(input).forEach(([id, entry]) => {
      var _a2, _b2;
      const scenario = SCENARIOS.find((item) => String(item.id) === String(id));
      if (!scenario) return;
      const rawIdx = isRecord(entry) ? entry.choiceIdx : entry;
      const parsedIdx = typeof rawIdx === "number" || typeof rawIdx === "string" && rawIdx.trim() !== "" ? Number(rawIdx) : NaN;
      const choice = Number.isInteger(parsedIdx) ? (_a2 = scenario.choices) == null ? void 0 : _a2[parsedIdx] : null;
      if (!choice) return;
      output[scenario.id] = {
        choiceIdx: parsedIdx,
        score: clamp(Number(choice.score) || 0, 0, 100),
        valueId: ((_b2 = valueById(scenario.valueId)) == null ? void 0 : _b2.id) || ""
      };
    });
    return output;
  };
  const sanitize = (input) => {
    const result = defaultData();
    if (!isRecord(input) || input.version !== 2) return result;
    result.legacyMigrated = input.legacyMigrated === true;
    result.studentName = cleanText(input.studentName, 80);
    result.classroomMode = false;
    const rawStep = input.readerFontStep;
    result.readerFontStep = rawStep === void 0 || rawStep === null || rawStep === "" || !Number.isFinite(Number(rawStep)) ? 1 : clamp(Math.trunc(Number(rawStep)), 0, 4);
    const speed = Number(input.audioSpeed);
    result.audioSpeed = [0.85, 1, 1.2].includes(speed) ? speed : 1;
    result.todayFocus = normalizeFocus(input.todayFocus);
    if (isRecord(input.practices)) {
      Object.entries(input.practices).forEach(([id, flags]) => {
        const value = valueById(id);
        if (!value || !Array.isArray(flags)) return;
        result.practices[value.id] = Array.from({ length: 4 }, (_, idx) => flags[idx] === true);
      });
    }
    if (isRecord(input.reflections)) {
      Object.entries(input.reflections).forEach(([id, text]) => {
        const value = valueById(id);
        if (!value || typeof text !== "string") return;
        const cleaned = cleanText(text, 2e3);
        if (cleaned.trim()) result.reflections[value.id] = cleaned;
      });
    }
    if (isRecord(input.storiesRead)) {
      Object.entries(input.storiesRead).forEach(([id, read]) => {
        if (read === true && stories.some((story) => story.id === id)) {
          result.storiesRead[id] = true;
        }
      });
    }
    result.scenarios = normalizeScenarios(input.scenarios);
    return result;
  };
  function rerenderKeepingFocus(container, renderFn) {
    var _a2, _b2;
    const active = document.activeElement;
    const focusKey = container && active && container.contains(active) ? ((_a2 = active.dataset) == null ? void 0 : _a2.focusKey) || null : null;
    renderFn();
    if (focusKey && container) {
      const target = container.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`);
      (_b2 = target == null ? void 0 : target.focus) == null ? void 0 : _b2.call(target, { preventScroll: true });
    }
  }
  const HikmahStore = window.HikmahStore = {
    data: defaultData(),
    load() {
      let loadedValidV2 = false;
      let raw = null;
      try {
        raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (isRecord(parsed) && parsed.version === 2) {
            this.data = sanitize(parsed);
            loadedValidV2 = true;
          }
        }
      } catch (_) {
        try {
          if (raw) localStorage.setItem(`${STORAGE_KEY}_corrupt`, raw.slice(0, 65536));
        } catch (__) {
        }
        this.data = defaultData();
      }
      if (!loadedValidV2 || !this.data.legacyMigrated) {
        this.migrateLegacyScenariosOnce();
      } else {
        this.syncLegacyScenarios();
      }
      this.save();
      return this.data;
    },
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        return true;
      } catch (_) {
        announce("تعذر حفظ البيانات محلياً. تحقق من مساحة التخزين وإعدادات المتصفح.");
        return false;
      }
    },
    migrateLegacyScenariosOnce() {
      let legacy = {};
      try {
        legacy = JSON.parse(localStorage.getItem(SCENARIOS_KEY) || "{}") || {};
      } catch (_) {
        legacy = {};
      }
      if (isRecord(legacy)) {
        SCENARIOS.forEach((scenario) => {
          var _a2, _b2;
          if (this.data.scenarios[scenario.id]) return;
          const raw = legacy[scenario.id];
          const choiceIdx = typeof raw === "number" || typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
          const choice = Number.isInteger(choiceIdx) ? (_a2 = scenario.choices) == null ? void 0 : _a2[choiceIdx] : null;
          if (!choice) return;
          this.data.scenarios[scenario.id] = {
            choiceIdx,
            score: clamp(Number(choice.score) || 0, 0, 100),
            valueId: ((_b2 = valueById(scenario.valueId)) == null ? void 0 : _b2.id) || ""
          };
        });
      }
      this.data.legacyMigrated = true;
      this.syncLegacyScenarios();
    },
    syncLegacyScenarios() {
      const legacyMap = {};
      Object.entries(this.data.scenarios).forEach(([id, answer]) => {
        if (isRecord(answer) && Number.isInteger(answer.choiceIdx)) {
          legacyMap[id] = answer.choiceIdx;
        }
      });
      try {
        localStorage.setItem(SCENARIOS_KEY, JSON.stringify(legacyMap));
      } catch (_) {
      }
      if (window.ScenariosEngine) {
        window.ScenariosEngine.savedChoices = { ...legacyMap };
      }
    },
    getValuePracticeCount(valueId) {
      return (this.data.practices[valueId] || []).filter(Boolean).length;
    },
    getValuePracticePct(valueId) {
      return this.getValuePracticeCount(valueId) * 25;
    },
    getTotalPracticesDone() {
      return VALUES.reduce((sum, value) => sum + this.getValuePracticeCount(value.id), 0);
    },
    getTotalStoriesRead() {
      return Object.keys(this.data.storiesRead).length;
    },
    getTotalReflectionsCount() {
      return VALUES.filter((value) => Boolean((this.data.reflections[value.id] || "").trim())).length;
    },
    getReflection(valueId) {
      return this.data.reflections[valueId] || "";
    },
    togglePractice(valueId, stepIndex) {
      var _a2;
      const value = valueById(valueId);
      if (!value || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 3) return false;
      const flags = this.data.practices[value.id] ? [...this.data.practices[value.id]] : [false, false, false, false];
      flags[stepIndex] = !flags[stepIndex];
      this.data.practices[value.id] = flags;
      if (flags[stepIndex] && ((_a2 = this.data.todayFocus) == null ? void 0 : _a2.valueId) === value.id && this.data.todayFocus.stepIndex === stepIndex) {
        this.data.todayFocus = null;
      }
      this.save();
      renderPracticeState(value.id);
      syncJewelsState();
      announce(flags[stepIndex] ? "تم تسجيل الممارسة كمكتملة." : "تم إلغاء تحديد الممارسة.");
      return flags[stepIndex];
    },
    setTodayFocus(valueId, stepIndex) {
      var _a2;
      const value = valueById(valueId);
      if (!value || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 3) return false;
      const previousId = (_a2 = this.data.todayFocus) == null ? void 0 : _a2.valueId;
      this.data.todayFocus = { valueId: value.id, stepIndex, updatedAt: Date.now() };
      this.save();
      if (previousId && previousId !== value.id) renderPracticeState(previousId);
      renderPracticeState(value.id);
      renderTodayFocus();
      syncJewelsState();
      announce("تم تحديد ممارسة اليوم.");
      return true;
    },
    completeTodayFocus() {
      const focus = this.data.todayFocus;
      if (!focus) return false;
      const flags = this.data.practices[focus.valueId] ? [...this.data.practices[focus.valueId]] : [false, false, false, false];
      flags[focus.stepIndex] = true;
      this.data.practices[focus.valueId] = flags;
      this.data.todayFocus = null;
      this.save();
      renderPracticeState(focus.valueId);
      renderTodayFocus();
      syncJewelsState();
      announce("تم تسجيل إنجاز ممارسة اليوم.");
      return true;
    },
    clearTodayFocus() {
      const previous = this.data.todayFocus;
      this.data.todayFocus = null;
      this.save();
      if (previous) renderPracticeState(previous.valueId);
      renderTodayFocus();
      syncJewelsState();
      announce("تم مسح اختيار ممارسة اليوم.");
    },
    setReflection(valueId, text) {
      const value = valueById(valueId);
      if (!value) return false;
      const cleaned = cleanText(text, 2e3);
      if (cleaned.trim()) this.data.reflections[value.id] = cleaned;
      else delete this.data.reflections[value.id];
      return this.save();
    },
    markStoryRead(storyId, isRead = true) {
      if (!stories.some((story) => story.id === storyId)) return;
      if (isRead) this.data.storiesRead[storyId] = true;
      else delete this.data.storiesRead[storyId];
      this.save();
      this.refreshStoryViews();
    },
    refreshStoryViews() {
      var _a2;
      enhanceStoryCards();
      if ((_a2 = window.AudioStudio) == null ? void 0 : _a2.currentValue) {
        renderStudioStories(window.AudioStudio.currentValue);
      }
    },
    refreshAll() {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      applyClassroomModeState(false);
      applyReaderFontStep();
      const encycVal = valueById((_a2 = window.AlIlmState) == null ? void 0 : _a2.activeEncycId);
      if (encycVal) renderPracticeList($("encycStepsList"), encycVal);
      if ((_b2 = window.AudioStudio) == null ? void 0 : _b2.currentValue) {
        renderPracticeList($("modalStepsList"), window.AudioStudio.currentValue);
        renderStudioStories(window.AudioStudio.currentValue);
      }
      (_d2 = (_c2 = window.SearchAndFilter) == null ? void 0 : _c2.renderStories) == null ? void 0 : _d2.call(_c2);
      (_f2 = (_e2 = window.SearchAndFilter) == null ? void 0 : _e2.renderComparisonGrid) == null ? void 0 : _f2.call(_e2);
      buildJewelsOnce();
      syncJewelsState();
      renderTodayFocus();
    }
  };
  function addHighlightedText(container, text, query) {
    var _a2;
    const source = String(text || "");
    const normalizedQuery = ((_a2 = window.normalizeArabic) == null ? void 0 : _a2.call(window, query || "")) || String(query || "").trim().toLowerCase();
    if (!normalizedQuery) {
      container.appendChild(document.createTextNode(source));
      return;
    }
    const words = source.split(/(\s+)/);
    words.forEach((word) => {
      var _a3;
      if (!word.trim() || !(((_a3 = window.normalizeArabic) == null ? void 0 : _a3.call(window, word)) || word.toLowerCase()).includes(normalizedQuery)) {
        container.appendChild(document.createTextNode(word));
        return;
      }
      const mark = document.createElement("mark");
      mark.className = "alm-hl";
      mark.textContent = word;
      container.appendChild(mark);
    });
  }
  const STEP_ORDINALS = ["الخطوة الأولى", "الخطوة الثانية", "الخطوة الثالثة", "الخطوة الرابعة"];
  const arDigits = (n) => window.toArabicDigits ? window.toArabicDigits(n) : String(n);
  function renderPracticeList(container, value) {
    if (!container || !value) return;
    const steps = Array.isArray(value.steps) ? value.steps : [];
    container.replaceChildren();
    container.classList.add("exhibit-steps-list");
    if (container.parentElement) container.parentElement.dataset.ra = `${value.id}-steps`;
    steps.slice(0, 4).forEach((step, index) => {
      const item = document.createElement("li");
      item.className = "exhibit-step-card";
      item.dataset.practiceValue = value.id;
      item.dataset.practiceStep = String(index);
      item.style.setProperty("--step-accent", value.accent || "#D4AF37");
      const num = document.createElement("span");
      num.className = "exhibit-step-num";
      num.setAttribute("aria-hidden", "true");
      num.textContent = arDigits(index + 1);
      const copy = document.createElement("div");
      copy.className = "exhibit-step-copy";
      const kicker = document.createElement("span");
      kicker.className = "exhibit-step-kicker";
      kicker.textContent = STEP_ORDINALS[index] || `الخطوة ${arDigits(index + 1)}`;
      const text = document.createElement("p");
      text.className = "exhibit-step-text";
      text.dataset.raF = String(index);
      text.textContent = step;
      copy.append(kicker, text);
      item.append(num, copy);
      container.appendChild(item);
    });
  }
  function renderPracticeState(valueId) {
    var _a2, _b2, _c2;
    const value = valueById(valueId);
    if (!value) return;
    if (((_a2 = window.AlIlmState) == null ? void 0 : _a2.activeEncycId) === value.id) {
      renderPracticeList($("encycStepsList"), value);
    }
    if (((_c2 = (_b2 = window.AudioStudio) == null ? void 0 : _b2.currentValue) == null ? void 0 : _c2.id) === value.id) {
      renderPracticeList($("modalStepsList"), value);
    }
    renderTodayFocus();
  }
  function renderTodayFocus() {
    var _a2;
    const banner = $("todayFocusBanner");
    const focus = HikmahStore.data.todayFocus;
    if (!banner) return;
    banner.classList.add("hidden");
    banner.hidden = true;
    const value = focus && valueById(focus.valueId);
    const tag = $("todayFocusValueTag");
    const text = $("todayFocusStepText");
    if (!value || !focus) {
      if (tag) tag.textContent = "ممارسة اليوم";
      if (text) text.textContent = "";
      return;
    }
    if (tag) tag.textContent = value.name;
    if (text) text.textContent = ((_a2 = value.steps) == null ? void 0 : _a2[focus.stepIndex]) || "";
  }
  window.completeTodayFocusStep = () => HikmahStore.completeTodayFocus();
  window.clearTodayFocusStep = () => HikmahStore.clearTodayFocus();
  const dotButtonMap = /* @__PURE__ */ new Map();
  let dotsDeckKey = "";
  const currentDeck = () => {
    var _a2;
    const cards = (_a2 = window.OrbitPhysics) == null ? void 0 : _a2.cards;
    return Array.isArray(cards) && cards.length ? cards.map((card) => card.value) : VALUES;
  };
  function buildJewelsOnce() {
    const bar = $("dotsBar");
    if (!bar) return;
    const deck = currentDeck();
    const key = deck.map((value) => value.id).join("|");
    if (key === dotsDeckKey && bar.children.length === deck.length) return;
    dotsDeckKey = key;
    bar.replaceChildren();
    dotButtonMap.clear();
    deck.forEach((value) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "orbit-dot";
      dot.dataset.valueId = value.id;
      dot.dataset.focusKey = `dot:${value.id}`;
      dot.style.setProperty("--dot-accent", value.accent || "#10B981");
      dot.setAttribute("aria-label", `انتقل إلى بطاقة قيمة ${value.name}`);
      dot.addEventListener("click", () => glideOrbitToValue(value.id));
      bar.appendChild(dot);
      dotButtonMap.set(value.id, dot);
    });
  }
  function syncJewelsState() {
    var _a2, _b2, _c2;
    if (!$("dotsBar")) return;
    buildJewelsOnce();
    const orbit2 = window.OrbitPhysics;
    const state = window.AlIlmState || {};
    const activeValueId = ((_c2 = (_b2 = (_a2 = orbit2 == null ? void 0 : orbit2.cards) == null ? void 0 : _a2[state.activeOrbitIndex]) == null ? void 0 : _b2.value) == null ? void 0 : _c2.id) || null;
    dotButtonMap.forEach((dot, valueId) => {
      const isActive = valueId === activeValueId;
      dot.classList.toggle("active", isActive);
      if (isActive) {
        if (dot.getAttribute("aria-current") !== "true") dot.setAttribute("aria-current", "true");
      } else if (dot.hasAttribute("aria-current")) {
        dot.removeAttribute("aria-current");
      }
    });
  }
  function glideOrbitToValue(valueId) {
    var _a2, _b2, _c2, _d2;
    const orbit2 = window.OrbitPhysics;
    if (!orbit2 || ((_a2 = window.AlIlmState) == null ? void 0 : _a2.isSpinning)) return;
    if (((_b2 = window.AlIlmState) == null ? void 0 : _b2.heroLayout) === "grid") (_c2 = window.setHeroLayout) == null ? void 0 : _c2.call(window, "orbit");
    let idx = orbit2.cards.findIndex((card) => String(card.value.id) === String(valueId));
    if (idx < 0) {
      (_d2 = window.switchGroup) == null ? void 0 : _d2.call(window, "all");
      idx = orbit2.cards.findIndex((card) => String(card.value.id) === String(valueId));
    }
    if (idx >= 0) orbit2.snapToIndex(idx);
  }
  const orbit = window.OrbitPhysics;
  if (orbit) {
    orbit.snapToIndex = function snapToIndex(index) {
      if (!this.cards.length || !Number.isFinite(Number(index))) return;
      this.setTarget(Number(index));
      syncJewelsState();
    };
    orbit.buildDots = () => {
      buildJewelsOnce();
      syncJewelsState();
    };
    orbit.syncDots = syncJewelsState;
  }
  if ((_c = window.AppRouter) == null ? void 0 : _c.switchView) {
    const origSwitchView = window.AppRouter.switchView.bind(window.AppRouter);
    window.AppRouter.switchView = function(view, shouldScroll = true) {
      var _a2, _b2, _c2;
      const res = origSwitchView("all", false);
      $$(".spa-nav-btn[data-view]").forEach((btn) => btn.removeAttribute("aria-selected"));
      if (view && view !== "all") (_a2 = window.goToSection) == null ? void 0 : _a2.call(window, view, !shouldScroll);
      else if (shouldScroll) (_b2 = window.goToSection) == null ? void 0 : _b2.call(window, "all");
      else (_c2 = window.refreshSectionSpy) == null ? void 0 : _c2.call(window);
      return res;
    };
    window.switchView = (v) => window.AppRouter.switchView(v, true);
  }
  let glideRaf = 0;
  let glideStop = null;
  function glideScrollTo(targetY, onDone) {
    var _a2, _b2;
    if (glideStop) glideStop();
    const startY = window.scrollY;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const endY = Math.max(0, Math.min(targetY, maxY));
    const dist = endY - startY;
    if (Math.abs(dist) < 2) {
      onDone == null ? void 0 : onDone();
      return;
    }
    const ms = Math.min(1200, Math.max(600, 420 + Math.abs(dist) * 0.45)) * (((_a2 = window.PerfTier) == null ? void 0 : _a2.motion) || 1);
    (_b2 = window.PerfTier) == null ? void 0 : _b2.watch(ms);
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const stop = () => {
      cancelAnimationFrame(glideRaf);
      ["wheel", "touchstart", "keydown"].forEach((type) => window.removeEventListener(type, stop, true));
      if (glideStop === stop) glideStop = null;
      onDone == null ? void 0 : onDone();
      onDone = null;
    };
    glideStop = stop;
    ["wheel", "touchstart", "keydown"].forEach(
      (type) => window.addEventListener(type, stop, { capture: true, passive: true })
    );
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      window.scrollTo(0, startY + dist * ease(t));
      if (t < 1) glideRaf = requestAnimationFrame(step);
      else stop();
    };
    glideRaf = requestAnimationFrame(step);
  }
  (function setupSectionDock() {
    var _a2, _b2;
    const nav = document.querySelector(".top-nav");
    const brand = nav == null ? void 0 : nav.querySelector(".nav-brand");
    const headerDock = nav == null ? void 0 : nav.querySelector(".header-dock");
    const floatingDock = document.querySelector(".glass-dock.floating-dock");
    if (!nav || !brand || !headerDock || !floatingDock) return;
    const FLOAT_AFTER = 12;
    const DOCK_BEFORE = 4;
    const EASE_LIFT = "cubic-bezier(0.3, 0, 0.2, 1)";
    const EASE_TRAVEL = "cubic-bezier(0.4, 0, 0.2, 1)";
    const EASE_SETTLE = "cubic-bezier(0.33, 0, 0.2, 1)";
    const HANDOFF_IN = 90;
    const HANDOFF_OUT = 150;
    let floating = false;
    let glide = null;
    let glideTimer = 0;
    function measurePill() {
      const navBox = nav.getBoundingClientRect();
      const brandBox = brand.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(nav).paddingInlineStart) || 24;
      const padBlock = parseFloat(getComputedStyle(nav).paddingBlockEnd) || 12;
      nav.style.setProperty("--nav-pill-w", `${Math.round(navBox.right - brandBox.left + pad)}px`);
      nav.style.setProperty("--nav-pill-h", `${Math.round(brandBox.bottom - navBox.top + padBlock)}px`);
    }
    function setInteractive(isFloating) {
      floatingDock.inert = !isFloating;
      floatingDock.setAttribute("aria-hidden", String(!isFloating));
      headerDock.inert = isFloating;
      headerDock.setAttribute("aria-hidden", String(isFloating));
    }
    function setFolded(on) {
      nav.classList.toggle("is-folded", on);
    }
    function setDockFloating(on) {
      nav.classList.toggle("dock-away", on);
      floatingDock.classList.toggle("is-floating", on);
    }
    const isFolded = () => nav.classList.contains("is-folded");
    const T = (x, y, s) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
    const durationFor = (dist) => {
      var _a3;
      return Math.round(Math.min(1200, Math.max(860, 640 + dist * 0.45)) * (((_a3 = window.PerfTier) == null ? void 0 : _a3.motion) || 1));
    };
    function headerPose() {
      const from = headerDock.getBoundingClientRect();
      const to = floatingDock.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      return { dx, dy, s: from.width / to.width, dist: Math.hypot(dx, dy) };
    }
    function currentTransform() {
      const t = getComputedStyle(floatingDock).transform;
      return t && t !== "none" ? t : T(0, 0, 1);
    }
    function stopGlide() {
      clearTimeout(glideTimer);
      if (glide) {
        glide.onfinish = null;
        glide.cancel();
        glide = null;
      }
    }
    function goDown() {
      var _a3;
      const reversing = Boolean(glide);
      const from = reversing ? currentTransform() : null;
      stopGlide();
      floating = true;
      const p = headerPose();
      measurePill();
      setFolded(true);
      setDockFloating(true);
      setInteractive(true);
      let ms;
      let frames;
      if (reversing) {
        ms = durationFor(p.dist);
        frames = [
          { transform: from, opacity: 1, easing: EASE_TRAVEL },
          { transform: T(0, 7, 1.012), opacity: 1, offset: 0.84, easing: EASE_SETTLE },
          { transform: T(0, 0, 1), opacity: 1 }
        ];
      } else {
        ms = HANDOFF_IN + durationFor(p.dist);
        const inAt = HANDOFF_IN / ms;
        frames = [
          // 0) fade in exactly over the header bar (which hides beneath it)
          { transform: T(p.dx, p.dy, p.s), opacity: 0, easing: "linear" },
          { transform: T(p.dx, p.dy, p.s), opacity: 1, offset: inAt, easing: EASE_LIFT },
          // 1) lift off slightly
          { transform: T(p.dx, p.dy - 10, p.s * 1.035), opacity: 1, offset: inAt + 0.14, easing: EASE_TRAVEL },
          // 2) long even travel, landing a few px past the dock…
          { transform: T(0, 8, 1.015), opacity: 1, offset: 0.87, easing: EASE_SETTLE },
          // 3) …and settling softly into place
          { transform: T(0, 0, 1), opacity: 1 }
        ];
      }
      glide = floatingDock.animate(frames, { duration: ms });
      (_a3 = window.PerfTier) == null ? void 0 : _a3.watch(ms);
      glide.onfinish = () => {
        glide = null;
      };
    }
    function goUp() {
      var _a3;
      const reversing = Boolean(glide);
      const from = reversing ? currentTransform() : T(0, 0, 1);
      stopGlide();
      floating = false;
      const p = headerPose();
      setFolded(false);
      setInteractive(false);
      const travel = durationFor(p.dist) - 80;
      const ms = travel + HANDOFF_OUT;
      const settledAt = travel / ms;
      const path = reversing ? [
        { transform: from, easing: EASE_TRAVEL },
        { transform: T(p.dx, p.dy - 7, p.s * 1.012), offset: settledAt * 0.84, easing: EASE_SETTLE }
      ] : [
        // 1) a small dip before taking off upwards
        { transform: from, easing: EASE_LIFT },
        { transform: T(0, 9, 1.02), offset: settledAt * 0.12, easing: EASE_TRAVEL },
        // 2) rise past the header slot a little…
        { transform: T(p.dx, p.dy - 9, p.s * 1.02), offset: settledAt * 0.86, easing: EASE_SETTLE }
      ];
      const frames = [
        ...path,
        // 3) …settle exactly over the slot, then fade away over the header copy
        { transform: T(p.dx, p.dy, p.s), offset: settledAt, easing: "linear" },
        { transform: T(p.dx, p.dy, p.s), opacity: 0 }
      ].map((f) => ({ opacity: 1, visibility: "visible", ...f }));
      glide = floatingDock.animate(frames, { duration: ms, fill: "forwards" });
      (_a3 = window.PerfTier) == null ? void 0 : _a3.watch(ms);
      glideTimer = setTimeout(() => {
        if (!floating) setDockFloating(false);
      }, travel);
      glide.onfinish = () => {
        if (floating) return;
        setDockFloating(false);
        stopGlide();
      };
    }
    const compactMQ = window.matchMedia("(max-width: 640px), (max-height: 500px)");
    const isCompact = () => compactMQ.matches;
    function applyCompactState() {
      stopGlide();
      const y = window.scrollY;
      measurePill();
      if (isCompact()) {
        floating = true;
        setDockFloating(true);
        setFolded(y > FLOAT_AFTER);
        setInteractive(true);
      } else {
        floating = y > FLOAT_AFTER;
        setDockFloating(floating);
        setFolded(floating);
        setInteractive(floating);
      }
    }
    (_a2 = compactMQ.addEventListener) == null ? void 0 : _a2.call(compactMQ, "change", applyCompactState);
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        var _a3;
        (_a3 = window.PerfTier) == null ? void 0 : _a3.watch(700);
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const y = window.scrollY;
          spySection();
          if (isCompact()) {
            const fold = y > FLOAT_AFTER;
            if (fold && !isFolded()) measurePill();
            setFolded(fold ? true : y >= DOCK_BEFORE && isFolded());
            return;
          }
          if (floating) {
            if (y < DOCK_BEFORE) goUp();
          } else if (y > FLOAT_AFTER) {
            goDown();
          }
        });
      },
      { passive: true }
    );
    const intro = document.getElementById("intro-section");
    function measureIntro() {
      if (!intro || intro.classList.contains("spa-hidden")) return;
      const introTop = intro.getBoundingClientRect().top + window.scrollY;
      document.documentElement.style.setProperty("--intro-offset", `${Math.round(introTop)}px`);
    }
    const SECTION_IDS = {
      all: "intro-section",
      orbit: "hero-section",
      stories: "examples-section",
      encyclopedia: "encyclopedia-section",
      comparison: "comparison-section"
    };
    const VIEWS = Object.keys(SECTION_IDS);
    let spyHold = false;
    let spyCurrent = "all";
    function headerRoom() {
      const navStyle = getComputedStyle(nav);
      const pinned = navStyle.position === "sticky" || navStyle.position === "fixed";
      const pillH = parseFloat(nav.style.getPropertyValue("--nav-pill-h")) || 82;
      const navTop = parseFloat(navStyle.top) || 0;
      return pinned ? navTop + pillH + 12 : 12;
    }
    function setActiveSection(view) {
      spyCurrent = view;
      $$(".spa-nav-btn[data-view]").forEach((btn) => {
        const on = btn.dataset.view === view;
        btn.classList.toggle("active", on);
        if (on) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
    }
    let spyMap = null;
    function measureSpy() {
      const y = window.scrollY;
      spyMap = {
        room: headerRoom(),
        bottom: document.documentElement.scrollHeight - window.innerHeight,
        tops: VIEWS.map((view) => {
          const el = document.getElementById(SECTION_IDS[view]);
          return el && el.offsetParent !== null ? el.getBoundingClientRect().top + y : Infinity;
        })
      };
    }
    let spyQueued = false;
    const invalidateSpy = () => {
      spyMap = null;
      if (spyQueued) return;
      spyQueued = true;
      requestAnimationFrame(() => {
        spyQueued = false;
        spySection();
      });
    };
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(invalidateSpy);
      VIEWS.forEach((view) => {
        const el = document.getElementById(SECTION_IDS[view]);
        if (el) ro.observe(el);
      });
      ro.observe(document.body);
    }
    function spySection() {
      if (spyHold) return;
      if (!spyMap || !("ResizeObserver" in window)) measureSpy();
      const y = window.scrollY;
      const line = y + spyMap.room + 80;
      let current = "all";
      spyMap.tops.forEach((top, i) => {
        if (top <= line) current = VIEWS[i];
      });
      if (y > 0 && y >= spyMap.bottom - 4) current = VIEWS[VIEWS.length - 1];
      if (current !== spyCurrent) setActiveSection(current);
    }
    window.refreshSectionSpy = () => {
      spyCurrent = null;
      spyMap = null;
      spySection();
    };
    window.goToSection = (view, instant = false) => {
      if (!SECTION_IDS[view]) view = "all";
      setActiveSection(view);
      const el = document.getElementById(SECTION_IDS[view]);
      const y = view === "all" || !el ? 0 : Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerRoom());
      if (instant) {
        window.scrollTo(0, y);
        return;
      }
      spyHold = true;
      glideScrollTo(y, () => {
        spyHold = false;
        spySection();
      });
    };
    window.startExhibitionTour = () => window.goToSection("orbit");
    window.addEventListener(
      "resize",
      () => {
        if (!floating) measurePill();
        measureIntro();
        spyMap = null;
        spySection();
      },
      { passive: true }
    );
    measurePill();
    measureIntro();
    (_b2 = document.fonts) == null ? void 0 : _b2.ready.then(measureIntro);
    applyCompactState();
    window.refreshSectionSpy();
  })();
  function renderStudioStories(value) {
    const grid = $("modalExamplesGrid");
    if (!grid || !value) return;
    const matching = stories.filter((story) => String(story.valueId) === String(value.id));
    rerenderKeepingFocus(grid, () => {
      grid.replaceChildren();
      matching.forEach((story) => {
        const article = document.createElement("article");
        article.className = "studio-story-card";
        article.dataset.storyId = story.id;
        article.dataset.ra = narrationUnit(story.id);
        const type = document.createElement("span");
        type.className = "studio-story-type";
        type.style.color = value.accent || "";
        type.textContent = story.typeLabel;
        const title = document.createElement("h4");
        title.className = "studio-story-title";
        title.dataset.raF = "0";
        title.textContent = story.title;
        const body = document.createElement("p");
        body.className = "studio-story-body";
        body.dataset.raF = "1";
        body.textContent = story.story;
        const read = document.createElement("span");
        read.className = "story-read-badge";
        read.textContent = HikmahStore.data.storiesRead[story.id] ? "✓ مقروءة" : "";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "story-action-btn";
        button.dataset.focusKey = `studio-read:${story.id}`;
        button.textContent = "📖 قراءة القصة كاملة";
        button.addEventListener("click", () => window.openStoryReader(story.id));
        article.append(type, title, body, read, button);
        grid.appendChild(article);
      });
    });
  }
  function enhanceStoryCards() {
    const grid = $("examplesCardsGrid");
    if (!grid) return;
    $$(".story-card", grid).forEach((card) => {
      var _a2, _b2;
      let storyId = card.dataset.storyId;
      if (!storyId) {
        const valueId = (_a2 = card.querySelector("[data-open-val]")) == null ? void 0 : _a2.dataset.openVal;
        const title = ((_b2 = card.querySelector(".story-heading")) == null ? void 0 : _b2.textContent) || "";
        const found = stories.find((item) => item.valueId === valueId && item.title === title);
        if (!found) return;
        storyId = found.id;
        card.dataset.storyId = storyId;
      }
      const existingBadge = card.querySelector("[data-read-story]");
      if (existingBadge) {
        existingBadge.textContent = HikmahStore.data.storiesRead[storyId] ? "✓ مقروءة" : "";
        return;
      }
      const actions = document.createElement("div");
      actions.className = "story-stage3-actions";
      const badge = document.createElement("span");
      badge.className = "story-read-badge";
      badge.dataset.readStory = storyId;
      badge.textContent = HikmahStore.data.storiesRead[storyId] ? "✓ مقروءة" : "";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "story-action-btn";
      button.dataset.focusKey = `gallery-read:${storyId}`;
      button.textContent = "📖 قراءة القصة كاملة";
      button.addEventListener("click", () => window.openStoryReader(storyId));
      actions.append(badge, button);
      card.appendChild(actions);
    });
  }
  const PAGE_SIZE = 6;
  const pager = {
    stories: { limit: PAGE_SIZE, sig: "" },
    comparison: { limit: PAGE_SIZE, sig: "" }
  };
  function markOwnEntrance(grid) {
    grid.dataset.rvSkip = "1";
    setTimeout(() => delete grid.dataset.rvSkip, 0);
  }
  function paginateCards(key, grid, cards, active, sig, words, rerender) {
    const page = pager[key];
    if (page.sig !== sig) {
      page.sig = sig;
      page.limit = PAGE_SIZE;
    }
    let area = document.getElementById(`${key}MoreArea`);
    if (!area) {
      area = document.createElement("div");
      area.id = `${key}MoreArea`;
      area.className = "cards-more-area";
      grid.after(area);
    }
    area.replaceChildren();
    const total = cards.length;
    const limit = active ? page.limit : Infinity;
    cards.forEach((card, index) => {
      const hide = index >= limit;
      card.hidden = hide;
      card.classList.toggle("hidden", hide);
    });
    if (page.revealFrom != null) {
      const from = page.revealFrom;
      page.revealFrom = null;
      cards.slice(from, Math.min(limit, total)).forEach((card, i) => {
        var _a2;
        (_a2 = card.animate) == null ? void 0 : _a2.call(
          card,
          [
            { opacity: 0, transform: "translate3d(0, 16px, 0)" },
            { opacity: 1, transform: "none" }
          ],
          { duration: 460, delay: i * 55, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
        );
      });
    }
    if (!active || total <= PAGE_SIZE) return { shown: total, total };
    const button = document.createElement("button");
    button.type = "button";
    if (limit < total) {
      const next = Math.min(PAGE_SIZE, total - limit);
      button.className = "cards-more-btn";
      button.textContent = `عرض المزيد من ${words.plural} (+${toArabicNumber(next)})`;
      button.addEventListener("click", () => {
        page.revealFrom = page.limit;
        page.limit += PAGE_SIZE;
        markOwnEntrance(grid);
        rerender();
      });
    } else {
      button.className = "cards-fold-btn";
      button.textContent = `طي ${words.plural} (العودة إلى ${toArabicNumber(PAGE_SIZE)})`;
      button.addEventListener("click", () => {
        page.limit = PAGE_SIZE;
        markOwnEntrance(grid);
        rerender();
        const section = grid.closest("section");
        if (section) {
          const top = section.getBoundingClientRect().top + window.scrollY - 96;
          glideScrollTo(Math.max(0, top));
        }
      });
    }
    area.appendChild(button);
    return { shown: Math.min(limit, total), total };
  }
  function toArabicNumber(n) {
    return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  }
  function pageStories(grid, query) {
    var _a2;
    const valueFilter = ((_a2 = window.AlIlmState) == null ? void 0 : _a2.storyValueFilter) || "all";
    const active = valueFilter === "all" && !query.trim();
    const cards = $$(".story-card", grid);
    const { shown, total } = paginateCards(
      "stories",
      grid,
      cards,
      active,
      `${valueFilter}|${query}`,
      { plural: "القصص" },
      () => {
        var _a3, _b2;
        return (_b2 = (_a3 = window.SearchAndFilter) == null ? void 0 : _a3.renderStories) == null ? void 0 : _b2.call(_a3);
      }
    );
    const badge = $("searchStatsBadge");
    if (badge && active && total > PAGE_SIZE) {
      badge.textContent = `معروض ${toArabicNumber(shown)} من أصل ${toArabicNumber(total)} قصة`;
    } else if (badge && !query.trim()) {
      badge.textContent = `${toArabicNumber(total)} ${total >= 3 && total <= 10 ? "قصص" : "قصة"}`;
    }
  }
  const search = window.SearchAndFilter;
  if (search) {
    const originalShow = (_d = search.showEncyclopediaValue) == null ? void 0 : _d.bind(search);
    if (originalShow) {
      search.showEncyclopediaValue = function(id) {
        originalShow(id);
        const value = valueById(id);
        if (value) renderPracticeList($("encycStepsList"), value);
      };
    }
    const originalRenderStories = (_e = search.renderStories) == null ? void 0 : _e.bind(search);
    if (originalRenderStories) {
      search.renderStories = function() {
        var _a2;
        originalRenderStories();
        enhanceStoryCards();
        const grid = $("examplesCardsGrid");
        if (!grid) return;
        const query = ((_a2 = window.AlIlmState) == null ? void 0 : _a2.searchQuery) || "";
        pageStories(grid, query);
        if (!query.trim()) return;
        $$(".story-card", grid).forEach((card) => {
          const story = stories.find((item) => item.id === card.dataset.storyId);
          if (!story) return;
          const valNameSpan = card.querySelector(".story-val-chip > span:last-child");
          const heading = card.querySelector(".story-heading");
          const body = card.querySelector(".story-body");
          if (valNameSpan) {
            valNameSpan.replaceChildren();
            addHighlightedText(valNameSpan, story.valueName, query);
          }
          if (heading) {
            heading.replaceChildren();
            addHighlightedText(heading, story.title, query);
          }
          if (body) {
            body.replaceChildren();
            addHighlightedText(body, story.story, query);
          }
        });
      };
    }
    const originalComparison = (_f = search.renderComparisonGrid) == null ? void 0 : _f.bind(search);
    if (originalComparison) {
      search.renderComparisonGrid = function() {
        originalComparison();
        applyComparisonFilter();
      };
    }
  }
  let readerReturnFocus = null;
  let currentStoryId = null;
  function applyReaderFontStep() {
    const body = $("storyReaderBody");
    if (!body) return;
    body.dataset.fontStep = String(HikmahStore.data.readerFontStep);
    body.style.removeProperty("--reader-font-size");
  }
  function syncReaderMarkButton(storyId) {
    const btn = $("readerMarkReadBtn");
    if (!btn) return;
    btn.removeAttribute("aria-pressed");
    const story = stories.find((item) => item.id === storyId);
    btn.textContent = story ? `🎧 استمع لرسالة «${story.valueName}» الصوتية` : "🎧 استمع لرسالة القيمة الصوتية";
  }
  window.listenToReaderValue = () => {
    var _a2, _b2, _c2;
    const story = stories.find((item) => item.id === currentStoryId);
    if (!story) return;
    HikmahStore.markStoryRead(story.id, true);
    window.closeStoryReader();
    (_a2 = window.openStudio) == null ? void 0 : _a2.call(window, story.valueId);
    (_c2 = (_b2 = window.AudioStudio) == null ? void 0 : _b2.playFromStart) == null ? void 0 : _c2.call(_b2);
  };
  function buildStoryInsight(story) {
    const val = valueById(story.valueId);
    const valName = story.valueName || (val == null ? void 0 : val.name) || "القيمة";
    const sub = (val == null ? void 0 : val.sub) ? `«${val.sub}» — ` : "";
    if (story.category === "heritage") {
      return `${sub}تُبرز هذه القصة كيف تتحول قيمة ${valName} في المواقف الفاصلة إلى قدوةٍ حية. سؤال للحوار: كيف نقتدي بهذا الموقف في تعاملنا اليومي داخل المدرسة؟`;
    }
    if (story.category === "school") {
      return `${sub}هذا الموقف من واقعنا المدرسي يؤكد أن قيمة ${valName} تبدأ بقرار صادق من الطالب نفسه. سؤال للتأمل: لو كنت في الموقف ذاته اليوم، ما الخطوة الأولى التي ستبادر بها؟`;
    }
    return `${sub}تعكس هذه القصة ارتباط قيمة ${valName} بنهضة الوطن ومستهدفات رؤية 2030. سؤال للحوار: كيف يسهم التزامك الشخصي بهذه القيمة في صناعة مستقبل وطنك؟`;
  }
  window.openStoryReader = (storyId) => {
    var _a2, _b2, _c2, _d2, _e2;
    const storyIdx = stories.findIndex((item) => item.id === storyId);
    const story = storyIdx >= 0 ? stories[storyIdx] : null;
    const modal = $("storyReaderModal");
    if (!story || !modal) return;
    (_b2 = (_a2 = window.AudioStudio) == null ? void 0 : _a2.stopPlayback) == null ? void 0 : _b2.call(_a2);
    const alreadyOpen = modal.classList.contains("active");
    if (!alreadyOpen) {
      readerReturnFocus = document.activeElement;
    }
    currentStoryId = storyId;
    const title = $("storyReaderTitle");
    const meta = $("storyReaderMeta");
    const counter = $("storyReaderCounter");
    const body = $("storyReaderBody");
    const insightText = $("storyReaderInsightText");
    if (title) title.textContent = story.title;
    const panel = modal.querySelector(".reader-panel");
    if (panel) panel.dataset.ra = narrationUnit(story.id);
    if (meta) meta.textContent = `${story.valueName} • ${story.typeLabel}`;
    if (counter) counter.textContent = `${storyIdx + 1} / ${stories.length}`;
    if (body) {
      body.textContent = story.story;
      applyReaderFontStep();
      (_d2 = (_c2 = body.parentElement) == null ? void 0 : _c2.scrollTo) == null ? void 0 : _d2.call(_c2, { top: 0, behavior: "auto" });
    }
    if (insightText) {
      insightText.textContent = buildStoryInsight(story);
    }
    syncReaderMarkButton(storyId);
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (!alreadyOpen) {
      (_e2 = $("readerMarkReadBtn")) == null ? void 0 : _e2.focus();
    }
  };
  window.stepStoryReader = (delta) => {
    if (!stories.length || !currentStoryId) return;
    const curIdx = stories.findIndex((item) => item.id === currentStoryId);
    if (curIdx < 0) return;
    const step = Math.sign(Number(delta) || 1);
    const nextIdx = ((curIdx + step) % stories.length + stories.length) % stories.length;
    window.openStoryReader(stories[nextIdx].id);
  };
  window.closeStoryReader = () => {
    var _a2, _b2, _c2, _d2;
    const modal = $("storyReaderModal");
    if (!modal) return;
    (_a2 = window.QuranRecite) == null ? void 0 : _a2.stop();
    let targetFocus = readerReturnFocus;
    if ((!targetFocus || !targetFocus.isConnected) && currentStoryId) {
      const inStudio = (_b2 = $("studioModal")) == null ? void 0 : _b2.classList.contains("active");
      const scope = inStudio ? $("studioModal") : document;
      targetFocus = (scope == null ? void 0 : scope.querySelector(`[data-story-id="${CSS.escape(currentStoryId)}"] .story-action-btn`)) || $("randomStoryBtn");
    }
    readerReturnFocus = null;
    modal.classList.remove("active");
    (_c2 = targetFocus == null ? void 0 : targetFocus.focus) == null ? void 0 : _c2.call(targetFocus, { preventScroll: true });
    modal.setAttribute("aria-hidden", "true");
    if (!((_d2 = $("studioModal")) == null ? void 0 : _d2.classList.contains("active"))) {
      document.body.classList.remove("modal-open");
    }
  };
  window.stepReaderFont = (delta) => {
    HikmahStore.data.readerFontStep = clamp(
      HikmahStore.data.readerFontStep + Math.sign(Number(delta) || 0),
      0,
      4
    );
    HikmahStore.save();
    applyReaderFontStep();
  };
  window.markCurrentStoryRead = () => {
    if (!currentStoryId) return;
    HikmahStore.markStoryRead(currentStoryId, true);
    syncReaderMarkButton(currentStoryId);
    announce("تم تسجيل القصة كمقروءة.");
  };
  function openPracticeAtValue(value) {
    var _a2, _b2, _c2, _d2;
    if (!value) return;
    (_b2 = (_a2 = window.AppRouter) == null ? void 0 : _a2.switchView) == null ? void 0 : _b2.call(_a2, "encyclopedia", true);
    (_d2 = (_c2 = window.SearchAndFilter) == null ? void 0 : _c2.showEncyclopediaValue) == null ? void 0 : _d2.call(_c2, value.id);
    requestAnimationFrame(() => {
      var _a3, _b3;
      const list = $("encycStepsList");
      (_a3 = list == null ? void 0 : list.focus) == null ? void 0 : _a3.call(list, { preventScroll: true });
      (_b3 = list == null ? void 0 : list.scrollIntoView) == null ? void 0 : _b3.call(list, {
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "center"
      });
    });
  }
  window.jumpReaderToPractice = () => {
    var _a2, _b2;
    const story = stories.find((item) => item.id === currentStoryId);
    if (!story) return;
    window.closeStoryReader();
    if ((_a2 = $("studioModal")) == null ? void 0 : _a2.classList.contains("active")) {
      (_b2 = window.closeStudio) == null ? void 0 : _b2.call(window);
    }
    openPracticeAtValue(valueById(story.valueId));
  };
  let shuffleBag = [];
  window.openRandomStory = () => {
    if (!stories.length) return;
    if (!shuffleBag.length) {
      shuffleBag = stories.map((story) => story.id);
      for (let index = shuffleBag.length - 1; index > 0; index -= 1) {
        const next = Math.floor(Math.random() * (index + 1));
        [shuffleBag[index], shuffleBag[next]] = [shuffleBag[next], shuffleBag[index]];
      }
    }
    window.openStoryReader(shuffleBag.pop());
  };
  const comparisonBar = $("comparisonFilterBar");
  let comparisonGroup = "all";
  function applyComparisonFilter() {
    var _a2;
    const grid = $("comparisonGrid");
    if (!grid) return;
    const query = ((_a2 = window.AlIlmState) == null ? void 0 : _a2.searchQuery) || "";
    $$(".comparison-card", grid).forEach((card) => {
      var _a3;
      const openValId = (_a3 = card.querySelector("[data-comp-open]")) == null ? void 0 : _a3.dataset.compOpen;
      const nameEl = card.querySelector(".comp-name");
      const rawName = nameEl ? nameEl.dataset.rawText || (nameEl.dataset.rawText = nameEl.textContent || "") : "";
      const value = openValId && valueById(openValId) || VALUES.find((item) => item.name === rawName);
      const visible = comparisonGroup === "all" || (value == null ? void 0 : value.group) === comparisonGroup;
      card.hidden = !visible;
      card.classList.toggle("hidden", !visible);
      if (!visible) return;
      [nameEl, card.querySelector(".comp-sub"), ...$$(".comp-box p", card)].forEach((el) => {
        if (!el) return;
        const source = el.dataset.rawText || (el.dataset.rawText = el.textContent || "");
        el.replaceChildren();
        addHighlightedText(el, source, query);
      });
    });
    const groupCards = $$(".comparison-card", grid).filter((card) => !card.hidden);
    paginateCards(
      "comparison",
      grid,
      groupCards,
      comparisonGroup === "all" && !query.trim(),
      `${comparisonGroup}|${query}`,
      { plural: "المقارنات" },
      applyComparisonFilter
    );
  }
  comparisonBar == null ? void 0 : comparisonBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-comp-group]");
    if (!button) return;
    comparisonGroup = button.dataset.compGroup;
    $$("[data-comp-group]", comparisonBar).forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    applyComparisonFilter();
  });
  const isExpoValue = (id) => {
    var _a2, _b2;
    return Boolean((_b2 = (_a2 = window.AL_ILM_EXHIBITION) == null ? void 0 : _a2.isExhibitionValue) == null ? void 0 : _b2.call(_a2, id));
  };
  function applyClassroomModeState(enabled) {
    document.body.classList.toggle("classroom-mode", enabled);
    document.documentElement.classList.toggle("classroom-mode", enabled);
  }
  function getTopActiveModal() {
    const order = ["storyReaderModal", "studioModal"];
    for (const id of order) {
      const el = $(id);
      if (el && el.classList.contains("active")) return el;
    }
    return null;
  }
  function closeTopModal() {
    var _a2;
    const top = getTopActiveModal();
    if (!top) return false;
    if (top.id === "storyReaderModal") {
      window.closeStoryReader();
      return true;
    }
    if (top.id === "studioModal") {
      (_a2 = window.closeStudio) == null ? void 0 : _a2.call(window);
      return true;
    }
    return false;
  }
  function focusables(modal) {
    if (!modal) return [];
    return $$(
      'a[href], button:not([disabled]), input:not([disabled]):not([hidden]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modal
    ).filter((element) => {
      if (element.hidden || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
      const st = window.getComputedStyle(element);
      return st.display !== "none" && st.visibility !== "hidden";
    });
  }
  window.addEventListener(
    "keydown",
    (event) => {
      const key = String(event.key || "");
      if (key === "Escape") {
        if (closeTopModal()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        return;
      }
      const topModal = getTopActiveModal();
      if (key === "Tab" && topModal) {
        const items = focusables(topModal);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!topModal.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    true
  );
  (function lockPageBehindWindows() {
    const behind = () => [document.querySelector(".top-nav"), $("mainContent"), document.querySelector("footer")].filter(Boolean);
    let locked = false;
    const root = document.documentElement;
    function measureGutter() {
      if (document.body.classList.contains("modal-open")) return;
      const gutter = Math.max(0, window.innerWidth - root.clientWidth);
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;left:0;right:0;top:0;height:0;visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);
      const side = probe.getBoundingClientRect().left > 0 ? "left" : "right";
      probe.remove();
      root.style.setProperty("--lock-gutter", `${gutter}px`);
      root.dataset.gutterSide = side;
    }
    const sync = () => {
      const open = document.body.classList.contains("modal-open");
      if (open === locked) return;
      locked = open;
      root.classList.toggle("modal-locked", open);
      behind().forEach((el) => {
        el.inert = open;
      });
    };
    const WINDOW_SCROLLERS = ".studio-scroll-body, #storyReaderModal";
    let touchStartY = 0;
    let touchScroller = null;
    document.addEventListener(
      "touchstart",
      (event) => {
        var _a2, _b2;
        if (!locked || event.touches.length !== 1) return;
        touchStartY = event.touches[0].clientY;
        touchScroller = ((_b2 = (_a2 = event.target).closest) == null ? void 0 : _b2.call(_a2, WINDOW_SCROLLERS)) || null;
      },
      { passive: true }
    );
    document.addEventListener(
      "touchmove",
      (event) => {
        if (!locked || event.touches.length !== 1) return;
        const el = touchScroller;
        if (!el || !el.isConnected) {
          event.preventDefault();
          return;
        }
        const y = event.touches[0].clientY;
        const dy = y - touchStartY;
        touchStartY = y;
        if (!dy) return;
        const atTop = el.scrollTop <= 0;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
        if (dy > 0 && atTop || dy < 0 && atBottom) event.preventDefault();
      },
      { passive: false }
    );
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", measureGutter, { passive: true });
    window.addEventListener("load", measureGutter);
    measureGutter();
    sync();
  })();
  let studioReturnFocus = null;
  const originalOpenStudio = (_g = window.AudioStudio) == null ? void 0 : _g.openStudio;
  if (typeof originalOpenStudio === "function") {
    window.AudioStudio.openStudio = function(id) {
      var _a2, _b2, _c2, _d2;
      const wasOpen = (_a2 = $("studioModal")) == null ? void 0 : _a2.classList.contains("active");
      if (!wasOpen) {
        studioReturnFocus = document.activeElement;
      }
      const result = originalOpenStudio.call(this, id);
      const value = valueById(id);
      if (value) {
        renderPracticeList($("modalStepsList"), value);
        renderStudioStories(value);
      }
      if (!wasOpen) {
        (_d2 = (_c2 = (_b2 = $("studioModal")) == null ? void 0 : _b2.querySelector(".modal-close")) == null ? void 0 : _c2.focus) == null ? void 0 : _d2.call(_c2, { preventScroll: true });
      }
      playStudioEntrance();
      return result;
    };
  }
  let studioEntranceTimer = 0;
  function playStudioEntrance() {
    var _a2;
    const body = (_a2 = $("studioModal")) == null ? void 0 : _a2.querySelector(".studio-scroll-body");
    if (!body) return;
    clearTimeout(studioEntranceTimer);
    body.classList.remove("is-entering");
    body.scrollTop = 0;
    void body.offsetWidth;
    body.classList.add("is-entering");
    studioEntranceTimer = setTimeout(() => body.classList.remove("is-entering"), 1400);
  }
  const originalCloseStudio = (_h = window.AudioStudio) == null ? void 0 : _h.closeStudio;
  if (typeof originalCloseStudio === "function") {
    window.AudioStudio.closeStudio = function(...args) {
      const targetFocus = studioReturnFocus && studioReturnFocus.isConnected ? studioReturnFocus : null;
      studioReturnFocus = null;
      const res = originalCloseStudio.apply(this, args);
      const restore = (tries = 0) => {
        var _a2;
        if (!(targetFocus == null ? void 0 : targetFocus.isConnected)) return;
        if (targetFocus.closest("[inert]") && tries < 45) {
          requestAnimationFrame(() => restore(tries + 1));
          return;
        }
        (_a2 = targetFocus.focus) == null ? void 0 : _a2.call(targetFocus, { preventScroll: true });
      };
      restore();
      return res;
    };
  }
  (_i = $("storyReaderModal")) == null ? void 0 : _i.addEventListener("click", (event) => {
    if (event.target === $("storyReaderModal")) window.closeStoryReader();
  });
  (function setupReveal() {
    if (!("IntersectionObserver" in window)) return;
    const splitWords = (el) => {
      if (el.dataset.rvSplit) return 0;
      el.dataset.rvSplit = "1";
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      let i = 0;
      nodes.forEach((node) => {
        if (!node.nodeValue.trim()) return;
        const frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.append(part);
            return;
          }
          const word = document.createElement("span");
          word.className = "rv-word";
          word.style.setProperty("--i", String(Math.min(i++, 12)));
          word.textContent = part;
          frag.append(word);
        });
        node.replaceWith(frag);
      });
      return i;
    };
    const groups = [];
    document.querySelectorAll(".section-header, .hero-top-grid").forEach((head) => {
      let words = 0;
      head.querySelectorAll(".section-title, .hero-headline").forEach((t) => {
        words = Math.max(words, splitWords(t));
      });
      const after = Math.min(words, 12) * 70 + 140;
      head.querySelectorAll(".section-description, .hero-slogan, .filter-bar, .filter-pill#randomStoryBtn, #searchStatsBadge").forEach((el) => {
        if (el.closest(".rv-fade")) return;
        el.classList.add("rv-fade");
        el.style.setProperty("--rv-after", `${after}ms`);
      });
      groups.push(head);
    });
    ["examplesFilterBar", "encycSelector"].forEach((id) => {
      const el = $(id);
      if (el) {
        el.classList.add("rv-self");
        groups.push(el);
      }
    });
    [$("examplesCardsGrid"), $("comparisonGrid"), document.querySelector(".encyc-grid-shell")].forEach((el) => {
      if (el) {
        el.classList.add("rv-cards");
        groups.push(el);
      }
    });
    const reveal = (group) => {
      if (group.classList.contains("rv-on") || group.classList.contains("rv-done")) return;
      if (group.classList.contains("rv-cards")) {
        [...group.children].forEach((card, i) => card.style.setProperty("--i", String(Math.min(i, 8))));
      }
      group.classList.add("rv-on");
      const words = group.querySelectorAll(".rv-word").length;
      const length = group.classList.contains("rv-cards") ? 8 * 75 + 900 : Math.min(words, 12) * 70 + 1100;
      setTimeout(() => {
        group.classList.remove("rv-on");
        group.classList.add("rv-done");
      }, length);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          reveal(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );
    groups.forEach((group) => {
      group.classList.add("rv-group");
      io.observe(group);
    });
    document.documentElement.classList.add("rv-ready");
    let sweeping = false;
    const sweep = () => {
      sweeping = false;
      groups.forEach((group) => {
        if (group.classList.contains("rv-on") || group.classList.contains("rv-done")) return;
        const r = group.getBoundingClientRect();
        if (!r.width && !r.height) return;
        if (r.bottom < 0) {
          io.unobserve(group);
          group.classList.add("rv-done");
        } else if (r.top < window.innerHeight) {
          io.unobserve(group);
          reveal(group);
        }
      });
    };
    window.addEventListener(
      "scroll",
      () => {
        if (sweeping) return;
        sweeping = true;
        requestAnimationFrame(sweep);
      },
      { passive: true }
    );
    [$("examplesCardsGrid"), $("comparisonGrid")].forEach((grid) => {
      if (!grid) return;
      const shown = () => [...grid.children].filter((card) => !card.hidden && card.getClientRects().length);
      const signature = (cards) => cards.map((card) => card.textContent.trim().slice(0, 40)).join("|");
      let last = signature(shown());
      new MutationObserver(() => {
        const cards = shown();
        const sig = signature(cards);
        const changed = sig !== last;
        last = sig;
        if (grid.dataset.rvSkip) {
          delete grid.dataset.rvSkip;
          return;
        }
        if (!changed || !grid.classList.contains("rv-done")) return;
        if (document.documentElement.dataset.perf === "low" || document.body.classList.contains("classroom-mode")) return;
        cards.slice(0, 9).forEach(
          (card, i) => {
            var _a2;
            return (_a2 = card.animate) == null ? void 0 : _a2.call(
              card,
              [
                { opacity: 0, transform: "translate3d(0, 14px, 0)" },
                { opacity: 1, transform: "none" }
              ],
              { duration: 420, delay: i * 45, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" }
            );
          }
        );
      }).observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    });
  })();
  (function setupSlidePills() {
    const bars = [
      ...document.querySelectorAll(".top-nav .header-dock, .glass-dock.floating-dock"),
      document.querySelector("#hero-section .group-segmented"),
      $("comparisonFilterBar")
    ].filter(Boolean);
    const isActive = (b) => b.classList.contains("active") || b.getAttribute("aria-pressed") === "true" || b.getAttribute("aria-current") === "page";
    bars.forEach((bar) => {
      var _a2, _b2;
      const pill = document.createElement("span");
      pill.className = `slide-pill ${bar.matches(".header-dock, .floating-dock") ? "slide-pill--nav" : "slide-pill--filter"} no-anim`;
      pill.setAttribute("aria-hidden", "true");
      bar.prepend(pill);
      bar.classList.add("has-slide-pill");
      let raf = 0;
      let placed = false;
      const place = () => {
        raf = 0;
        const btn = [...bar.querySelectorAll(":scope > button")].find(isActive);
        if (!btn || !btn.offsetWidth) {
          pill.style.opacity = "0";
          return;
        }
        pill.style.opacity = "";
        pill.style.setProperty("--sp-x", `${btn.offsetLeft}px`);
        pill.style.setProperty("--sp-y", `${btn.offsetTop}px`);
        pill.style.setProperty("--sp-w", `${btn.offsetWidth}px`);
        pill.style.setProperty("--sp-h", `${btn.offsetHeight}px`);
        if (!placed) {
          placed = true;
          requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.remove("no-anim")));
        }
      };
      const queue = () => {
        if (!raf) raf = requestAnimationFrame(place);
      };
      new MutationObserver(queue).observe(bar, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "aria-pressed", "aria-current"]
      });
      new ResizeObserver(queue).observe(bar);
      (_b2 = (_a2 = document.fonts) == null ? void 0 : _a2.ready) == null ? void 0 : _b2.then(queue);
      queue();
    });
  })();
  HikmahStore.load();
  function start() {
    HikmahStore.refreshAll();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
