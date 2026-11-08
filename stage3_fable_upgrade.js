/*
 * ============================================================================
 * STAGE 3 & STAGE 4 HARDENED SHARED-OFFICE ENGINE UPGRADE
 * Co-authored & Audited by: Claude Fable 5.1 · Astra 6 · Claude Opus 5.5 · Argon 4
 * HikmahStore v2 · Zero-Churn 12-Jewel Constellation · Focus-Safe Story Reader ·
 * Mutually-Exclusive Multi-Speed Audio & Arabic TTS · Privacy-Safe A4 Charter
 * ============================================================================
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'al_ilm_hikmah_v2';
  const SCENARIOS_KEY = 'al_ilm_scenarios_v2';

  const VALUES = Array.isArray(window.AL_ILM_DATA?.values) ? window.AL_ILM_DATA.values : [];
  const SCENARIOS = Array.isArray(window.AL_ILM_DATA?.scenarios) ? window.AL_ILM_DATA.scenarios : [];

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const escapeHTML = (value) => {
    const el = document.createElement('span');
    el.textContent = value == null ? '' : String(value);
    return el.innerHTML;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const valueById = (id) => VALUES.find((value) => String(value.id) === String(id)) || null;
  const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

  const announce = (message) => {
    const region = $('almAnnouncer');
    if (region) region.textContent = message || '';
  };

  const prefersReducedMotion = () =>
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) ||
    document.body.classList.contains('classroom-mode');

  const isFlagOrControlCodePoint = (cp) =>
    (cp >= 0x202a && cp <= 0x202e) ||
    (cp >= 0x2066 && cp <= 0x2069) ||
    (cp >= 0x1f1e6 && cp <= 0x1f1ff) ||
    (cp >= 0xe0020 && cp <= 0xe007f) ||
    cp === 0x1f3f4 ||
    cp === 0x1f3f3 ||
    cp === 0x1f3c1 ||
    cp === 0x1f6a9 ||
    cp === 0x1f38c;

  const cleanText = (value, maxLength) => {
    const raw = String(value == null ? '' : value);
    const kept = [];
    for (const ch of raw) {
      const cp = ch.codePointAt(0) || 0;
      if (!isFlagOrControlCodePoint(cp)) {
        kept.push(ch);
        if (kept.length >= maxLength) break;
      }
    }
    return kept.join('');
  };

  function buildStoriesCatalog() {
    return VALUES.flatMap((value) =>
      (Array.isArray(value.examples) ? value.examples : []).map((example, index) => ({
        id: `${value.id}_story_${index + 1}`,
        valueId: value.id,
        valueName: value.name,
        valueAccent: value.accent || '#D4AF37',
        title: example.title || '',
        story: example.story || example.text || '',
        typeLabel:
          example.type ||
          (index === 0
            ? 'من السيرة والتاريخ'
            : index === 1
              ? 'من واقع ثانوية العلم النافع'
              : 'من الوطن ورؤية 2030'),
        category: example.category || ['heritage', 'school', 'vision'][index] || 'vision'
      }))
    );
  }

  const stories = buildStoriesCatalog();
  window.Stage3 = window.Stage3 || {};
  window.Stage3.stories = stories;

  const defaultData = () => ({
    version: 2,
    legacyMigrated: false,
    studentName: '',
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
      const scenario = SCENARIOS.find((item) => String(item.id) === String(id));
      if (!scenario) return;
      const rawIdx = isRecord(entry) ? entry.choiceIdx : entry;
      const parsedIdx =
        typeof rawIdx === 'number' || (typeof rawIdx === 'string' && rawIdx.trim() !== '')
          ? Number(rawIdx)
          : NaN;
      const choice = Number.isInteger(parsedIdx) ? scenario.choices?.[parsedIdx] : null;
      if (!choice) return;
      output[scenario.id] = {
        choiceIdx: parsedIdx,
        score: clamp(Number(choice.score) || 0, 0, 100),
        valueId: valueById(scenario.valueId)?.id || ''
      };
    });
    return output;
  };

  const sanitize = (input) => {
    const result = defaultData();
    if (!isRecord(input) || input.version !== 2) return result;

    result.legacyMigrated = input.legacyMigrated === true;
    result.studentName = cleanText(input.studentName, 80);
    result.classroomMode = false; // classroom mode was removed; drop any saved "on"

    const rawStep = input.readerFontStep;
    result.readerFontStep =
      rawStep === undefined || rawStep === null || rawStep === '' || !Number.isFinite(Number(rawStep))
        ? 1
        : clamp(Math.trunc(Number(rawStep)), 0, 4);

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
        if (!value || typeof text !== 'string') return;
        const cleaned = cleanText(text, 2000);
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

  // Focus-preserving DOM update helper (prevents focus drop to <body> inside modals/lists)
  function rerenderKeepingFocus(container, renderFn) {
    const active = document.activeElement;
    const focusKey =
      container && active && container.contains(active) ? active.dataset?.focusKey || null : null;
    renderFn();
    if (focusKey && container) {
      const target = container.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`);
      target?.focus?.({ preventScroll: true });
    }
  }

  // ==========================================================================
  // 1. HIKMAH STORE V2 (SINGLE SOURCE OF TRUTH + SAFE IMPORT/EXPORT)
  // ==========================================================================
  const HikmahStore = (window.HikmahStore = {
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
        } catch (__) {}
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
        announce('تعذر حفظ البيانات محلياً. تحقق من مساحة التخزين وإعدادات المتصفح.');
        return false;
      }
    },

    migrateLegacyScenariosOnce() {
      let legacy = {};
      try {
        legacy = JSON.parse(localStorage.getItem(SCENARIOS_KEY) || '{}') || {};
      } catch (_) {
        legacy = {};
      }
      if (isRecord(legacy)) {
        SCENARIOS.forEach((scenario) => {
          if (this.data.scenarios[scenario.id]) return;
          const raw = legacy[scenario.id];
          const choiceIdx =
            typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '')
              ? Number(raw)
              : NaN;
          const choice = Number.isInteger(choiceIdx) ? scenario.choices?.[choiceIdx] : null;
          if (!choice) return;
          this.data.scenarios[scenario.id] = {
            choiceIdx,
            score: clamp(Number(choice.score) || 0, 0, 100),
            valueId: valueById(scenario.valueId)?.id || ''
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
      } catch (_) {}
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
      return VALUES.filter((value) => Boolean((this.data.reflections[value.id] || '').trim())).length;
    },

    getReflection(valueId) {
      return this.data.reflections[valueId] || '';
    },

    togglePractice(valueId, stepIndex) {
      const value = valueById(valueId);
      if (!value || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 3) return false;
      const flags = this.data.practices[value.id]
        ? [...this.data.practices[value.id]]
        : [false, false, false, false];
      flags[stepIndex] = !flags[stepIndex];
      this.data.practices[value.id] = flags;

      if (
        flags[stepIndex] &&
        this.data.todayFocus?.valueId === value.id &&
        this.data.todayFocus.stepIndex === stepIndex
      ) {
        this.data.todayFocus = null;
      }

      this.save();
      renderPracticeState(value.id);
      syncJewelsState();
      announce(flags[stepIndex] ? 'تم تسجيل الممارسة كمكتملة.' : 'تم إلغاء تحديد الممارسة.');
      return flags[stepIndex];
    },

    setTodayFocus(valueId, stepIndex) {
      const value = valueById(valueId);
      if (!value || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 3) return false;
      const previousId = this.data.todayFocus?.valueId;
      this.data.todayFocus = { valueId: value.id, stepIndex, updatedAt: Date.now() };
      this.save();
      if (previousId && previousId !== value.id) renderPracticeState(previousId);
      renderPracticeState(value.id);
      renderTodayFocus();
      syncJewelsState();
      announce('تم تحديد ممارسة اليوم.');
      return true;
    },

    completeTodayFocus() {
      const focus = this.data.todayFocus;
      if (!focus) return false;
      const flags = this.data.practices[focus.valueId]
        ? [...this.data.practices[focus.valueId]]
        : [false, false, false, false];
      flags[focus.stepIndex] = true;
      this.data.practices[focus.valueId] = flags;
      this.data.todayFocus = null;
      this.save();
      renderPracticeState(focus.valueId);
      renderTodayFocus();
      syncJewelsState();
      announce('تم تسجيل إنجاز ممارسة اليوم.');
      return true;
    },

    clearTodayFocus() {
      const previous = this.data.todayFocus;
      this.data.todayFocus = null;
      this.save();
      if (previous) renderPracticeState(previous.valueId);
      renderTodayFocus();
      syncJewelsState();
      announce('تم مسح اختيار ممارسة اليوم.');
    },

    setReflection(valueId, text) {
      const value = valueById(valueId);
      if (!value) return false;
      const cleaned = cleanText(text, 2000);
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
      enhanceStoryCards();
      if (window.AudioStudio?.currentValue) {
        renderStudioStories(window.AudioStudio.currentValue);
      }
    },

    refreshAll() {
      applyClassroomModeState(false);
      applyReaderFontStep();

      const encycVal = valueById(window.AlIlmState?.activeEncycId);
      if (encycVal) renderPracticeList($('encycStepsList'), encycVal);

      if (window.AudioStudio?.currentValue) {
        renderPracticeList($('modalStepsList'), window.AudioStudio.currentValue);
        renderStudioStories(window.AudioStudio.currentValue);
      }

      window.SearchAndFilter?.renderStories?.();
      window.SearchAndFilter?.renderComparisonGrid?.();

      buildJewelsOnce();
      syncJewelsState();
      renderTodayFocus();
    }
  });

  // ==========================================================================
  // 2. SAFE SEARCH HIGHLIGHTING & INTERACTIVE 48 PRACTICES
  // ==========================================================================
  function addHighlightedText(container, text, query) {
    const source = String(text || '');
    const normalizedQuery =
      window.normalizeArabic?.(query || '') || String(query || '').trim().toLowerCase();
    if (!normalizedQuery) {
      container.appendChild(document.createTextNode(source));
      return;
    }

    const words = source.split(/(\s+)/);
    words.forEach((word) => {
      if (!word.trim() || !(window.normalizeArabic?.(word) || word.toLowerCase()).includes(normalizedQuery)) {
        container.appendChild(document.createTextNode(word));
        return;
      }
      const mark = document.createElement('mark');
      mark.className = 'alm-hl';
      mark.textContent = word;
      container.appendChild(mark);
    });
  }

  const STEP_ORDINALS = ['الخطوة الأولى', 'الخطوة الثانية', 'الخطوة الثالثة', 'الخطوة الرابعة'];
  const arDigits = (n) => (window.toArabicDigits ? window.toArabicDigits(n) : String(n));

  // Exhibition mode: the four steps are a numbered behavioural-inspiration
  // gallery for visitors — no completion buttons, no "today's practice".
  function renderPracticeList(container, value) {
    if (!container || !value) return;
    const steps = Array.isArray(value.steps) ? value.steps : [];

    container.replaceChildren();
    container.classList.add('exhibit-steps-list');
    steps.slice(0, 4).forEach((step, index) => {
      const item = document.createElement('li');
      item.className = 'exhibit-step-card';
      item.dataset.practiceValue = value.id;
      item.dataset.practiceStep = String(index);
      item.style.setProperty('--step-accent', value.accent || '#D4AF37');

      const num = document.createElement('span');
      num.className = 'exhibit-step-num';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = arDigits(index + 1);

      const copy = document.createElement('div');
      copy.className = 'exhibit-step-copy';

      const kicker = document.createElement('span');
      kicker.className = 'exhibit-step-kicker';
      kicker.textContent = STEP_ORDINALS[index] || `الخطوة ${arDigits(index + 1)}`;

      const text = document.createElement('p');
      text.className = 'exhibit-step-text';
      text.textContent = step;

      copy.append(kicker, text);
      item.append(num, copy);
      container.appendChild(item);
    });
  }

  function renderPracticeState(valueId) {
    const value = valueById(valueId);
    if (!value) return;
    if (window.AlIlmState?.activeEncycId === value.id) {
      renderPracticeList($('encycStepsList'), value);
    }
    if (window.AudioStudio?.currentValue?.id === value.id) {
      renderPracticeList($('modalStepsList'), value);
    }
    renderTodayFocus();
  }

  function renderTodayFocus() {
    const banner = $('todayFocusBanner');
    const focus = HikmahStore.data.todayFocus;
    if (!banner) return;
    // Exhibition mode: the daily-practice banner is permanently retired.
    banner.classList.add('hidden');
    banner.hidden = true;

    const value = focus && valueById(focus.valueId);
    const tag = $('todayFocusValueTag');
    const text = $('todayFocusStepText');
    if (!value || !focus) {
      if (tag) tag.textContent = 'ممارسة اليوم';
      if (text) text.textContent = '';
      return;
    }

    if (tag) tag.textContent = value.name;
    if (text) text.textContent = value.steps?.[focus.stepIndex] || '';
  }

  window.completeTodayFocusStep = () => HikmahStore.completeTodayFocus();
  window.clearTodayFocusStep = () => HikmahStore.clearTodayFocus();

  // ==========================================================================
  // 3. SIMPLE ORBIT DOTS (reference design) — one small dot per card in the
  // current deck; the active dot stretches in its value colour. Zero-churn:
  // the DOM is rebuilt only when the deck (group filter) changes.
  // ==========================================================================
  const dotButtonMap = new Map();
  let dotsDeckKey = '';

  const currentDeck = () => {
    const cards = window.OrbitPhysics?.cards;
    return Array.isArray(cards) && cards.length ? cards.map((card) => card.value) : VALUES;
  };

  function buildJewelsOnce() {
    const bar = $('dotsBar');
    if (!bar) return;
    const deck = currentDeck();
    const key = deck.map((value) => value.id).join('|');
    if (key === dotsDeckKey && bar.children.length === deck.length) return;

    dotsDeckKey = key;
    bar.replaceChildren();
    dotButtonMap.clear();

    deck.forEach((value) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'orbit-dot';
      dot.dataset.valueId = value.id;
      dot.dataset.focusKey = `dot:${value.id}`;
      dot.style.setProperty('--dot-accent', value.accent || '#10B981');
      dot.setAttribute('aria-label', `انتقل إلى بطاقة قيمة ${value.name}`);
      dot.addEventListener('click', () => glideOrbitToValue(value.id));
      bar.appendChild(dot);
      dotButtonMap.set(value.id, dot);
    });
  }

  function syncJewelsState() {
    if (!$('dotsBar')) return;
    buildJewelsOnce();

    const orbit = window.OrbitPhysics;
    const state = window.AlIlmState || {};
    const activeValueId = orbit?.cards?.[state.activeOrbitIndex]?.value?.id || null;

    dotButtonMap.forEach((dot, valueId) => {
      const isActive = valueId === activeValueId;
      dot.classList.toggle('active', isActive);
      if (isActive) {
        if (dot.getAttribute('aria-current') !== 'true') dot.setAttribute('aria-current', 'true');
      } else if (dot.hasAttribute('aria-current')) {
        dot.removeAttribute('aria-current');
      }
    });
  }

  function glideOrbitToValue(valueId) {
    const orbit = window.OrbitPhysics;
    if (!orbit || window.AlIlmState?.isSpinning) return;
    if (window.AlIlmState?.heroLayout === 'grid') window.setHeroLayout?.('orbit');
    let idx = orbit.cards.findIndex((card) => String(card.value.id) === String(valueId));
    if (idx < 0) {
      window.switchGroup?.('all');
      idx = orbit.cards.findIndex((card) => String(card.value.id) === String(valueId));
    }
    if (idx >= 0) orbit.snapToIndex(idx);
  }

  const orbit = window.OrbitPhysics;
  if (orbit) {
    // Smooth physical glide (spring) instead of a dry instant jump. The current
    // velocity is preserved so a tap mid-motion bends the path without a hitch.
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

  // Keep nav buttons free of invalid tab attributes while preserving aria-current="page"
  if (window.AppRouter?.switchView) {
    const origSwitchView = window.AppRouter.switchView.bind(window.AppRouter);
    window.AppRouter.switchView = function (view, shouldScroll = true) {
      const res = origSwitchView(view, shouldScroll);
      $$('.spa-nav-btn[data-view]').forEach((btn) => btn.removeAttribute('aria-selected'));
      return res;
    };
    window.switchView = (v) => window.AppRouter.switchView(v, true);
  }

  // Section bar: lives in the header at the top of the page. When the visitor
  // scrolls down, the header shrinks to a simple logo + name pill and the bar
  // GLIDES down to the bottom of the screen (and glides back up on return).
  // Two copies are used because a fixed element inside the blurred header would
  // be pinned to the header instead of the screen; the floating copy performs a
  // FLIP animation between the two positions so the hand-over is seamless.
  (function setupSectionDock() {
    const nav = document.querySelector('.top-nav');
    const brand = nav?.querySelector('.nav-brand');
    const headerDock = nav?.querySelector('.header-dock');
    const floatingDock = document.querySelector('.glass-dock.floating-dock');
    if (!nav || !brand || !headerDock || !floatingDock) return;

    // The bar folds and glides down on the very first scroll, and comes back
    // only once the page is back at the top (small gap so it never flickers).
    const FLOAT_AFTER = 12; // px scrolled before the bar moves down
    const DOCK_BEFORE = 4; // px from the top before it moves back up
    // Motion language: a soft lift (anticipation) → long, even travel → a small
    // overshoot that settles (soft landing). Duration grows with the distance.
    const EASE_LIFT = 'cubic-bezier(0.3, 0, 0.2, 1)';
    // Gentle middle so the bar never moves more than ~50px in one 60Hz frame.
    const EASE_TRAVEL = 'cubic-bezier(0.4, 0, 0.2, 1)';
    const EASE_SETTLE = 'cubic-bezier(0.33, 0, 0.2, 1)';
    // Hand-over between the two copies. The floating copy sits above the header
    // (z-index) and covers the header copy exactly, so the swap happens while
    // one of them is fully opaque and never dips through half-transparency:
    // going down it fades in over the header copy, which then hides (CSS delay,
    // must match `body.dock-floating .top-nav .header-dock` in section 12);
    // going up it settles over the slot, the header copy reappears beneath it,
    // and only then does it fade away.
    const HANDOFF_IN = 90;
    const HANDOFF_OUT = 150;
    let floating = false;
    let glide = null;
    let glideTimer = 0;

    // This glide is part of the exhibit, so it plays even when the device asks
    // for reduced motion (the kiosk iPad's settings belong to the school, not to
    // the visitor). Its CSS half is re-enabled at the end of section 12 in
    // stage3_astra_upgrade.css.

    // Size of the "logo + name" pill the header shrinks to.
    function measurePill() {
      const navBox = nav.getBoundingClientRect();
      const brandBox = brand.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(nav).paddingInlineStart) || 24;
      const padBlock = parseFloat(getComputedStyle(nav).paddingBlockEnd) || 12;
      nav.style.setProperty('--nav-pill-w', `${Math.round(navBox.right - brandBox.left + pad)}px`);
      nav.style.setProperty('--nav-pill-h', `${Math.round(brandBox.bottom - navBox.top + padBlock)}px`);
    }

    function setInteractive(isFloating) {
      floatingDock.inert = !isFloating;
      floatingDock.setAttribute('aria-hidden', String(!isFloating));
      headerDock.inert = isFloating;
      headerDock.setAttribute('aria-hidden', String(isFloating));
    }

    const T = (x, y, s) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
    const durationFor = (dist) => Math.round(Math.min(1200, Math.max(860, 640 + dist * 0.45)));

    // Where the floating bar must be to sit exactly over the header bar. The
    // header copy is only hidden (its layout box stays), so it can be measured.
    function headerPose() {
      const from = headerDock.getBoundingClientRect();
      const to = floatingDock.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      return { dx, dy, s: from.width / to.width, dist: Math.hypot(dx, dy) };
    }

    // Live on-screen transform, so a reversal mid-flight starts from where
    // the bar actually is instead of snapping.
    function currentTransform() {
      const t = getComputedStyle(floatingDock).transform;
      return t && t !== 'none' ? t : T(0, 0, 1);
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
      const reversing = Boolean(glide);
      const from = reversing ? currentTransform() : null;
      stopGlide();
      floating = true;
      measurePill();
      document.body.classList.add('dock-floating', 'nav-compact'); // header copy crossfades out
      setInteractive(true);

      const p = headerPose();
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
          { transform: T(p.dx, p.dy, p.s), opacity: 0, easing: 'linear' },
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
      glide.onfinish = () => {
        glide = null;
      };
    }

    function goUp() {
      const reversing = Boolean(glide);
      const from = reversing ? currentTransform() : T(0, 0, 1);
      stopGlide();
      floating = false;
      document.body.classList.remove('nav-compact'); // header grows back first
      setInteractive(false);

      const p = headerPose();
      const travel = durationFor(p.dist) - 80;
      const ms = travel + HANDOFF_OUT;
      const settledAt = travel / ms;
      // visibility stays 'visible' in every frame so the bar can keep flying
      // after the page hands control back to the header copy.
      const path = reversing
        ? [
            { transform: from, easing: EASE_TRAVEL },
            { transform: T(p.dx, p.dy - 7, p.s * 1.012), offset: settledAt * 0.84, easing: EASE_SETTLE }
          ]
        : [
            // 1) a small dip before taking off upwards
            { transform: from, easing: EASE_LIFT },
            { transform: T(0, 9, 1.02), offset: settledAt * 0.12, easing: EASE_TRAVEL },
            // 2) rise past the header slot a little…
            { transform: T(p.dx, p.dy - 9, p.s * 1.02), offset: settledAt * 0.86, easing: EASE_SETTLE }
          ];
      const frames = [
        ...path,
        // 3) …settle exactly over the slot, then fade away over the header copy
        { transform: T(p.dx, p.dy, p.s), offset: settledAt, easing: 'linear' },
        { transform: T(p.dx, p.dy, p.s), opacity: 0 }
      ].map((f) => ({ opacity: 1, visibility: 'visible', ...f }));
      glide = floatingDock.animate(frames, { duration: ms, fill: 'forwards' });
      // The header copy reappears beneath the settled floating copy.
      glideTimer = setTimeout(() => {
        if (!floating) document.body.classList.remove('dock-floating');
      }, travel);
      glide.onfinish = () => {
        if (floating) return; // reversed again meanwhile
        document.body.classList.remove('dock-floating');
        stopGlide();
      };
    }

    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const y = window.scrollY;
          if (floating) {
            if (y < DOCK_BEFORE) goUp();
          } else if (y > FLOAT_AFTER) {
            goDown();
          }
        });
      },
      { passive: true }
    );

    // The home intro fills the first screen below the header (CSS reads this).
    const intro = document.getElementById('intro-section');
    function measureIntro() {
      if (!intro || intro.classList.contains('spa-hidden')) return;
      const introTop = intro.getBoundingClientRect().top + window.scrollY;
      document.documentElement.style.setProperty('--intro-offset', `${Math.round(introTop)}px`);
    }

    // «ابدأ الجولة» on the home intro: one smooth scroll down to the cards. The
    // header shrinks to its logo pill on the way (and the bar glides to the
    // bottom), so the cards are lined up just below that pill.
    window.startExhibitionTour = () => {
      const hero = document.getElementById('hero-section');
      if (!hero) return;
      if (document.body.dataset.activeView !== 'all') window.AppRouter?.switchView('all', false);
      const pillH = parseFloat(nav.style.getPropertyValue('--nav-pill-h')) || 82;
      const navTop = parseFloat(getComputedStyle(nav).top) || 0;
      const top = hero.getBoundingClientRect().top + window.scrollY - (navTop + pillH + 12);
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };

    window.addEventListener(
      'resize',
      () => {
        if (!floating) measurePill();
        measureIntro();
      },
      { passive: true }
    );

    measurePill();
    measureIntro();
    document.fonts?.ready.then(measureIntro); // header height settles with the font
    setInteractive(false);
    if (window.scrollY > FLOAT_AFTER) {
      floating = true;
      document.body.classList.add('dock-floating', 'nav-compact');
      setInteractive(true);
    }
  })();


  // ==========================================================================
  // 4. 36 STORIES READER & STORY-TO-ACTION BRIDGE
  // (the visitor book under each value was removed from the exhibition)
  // ==========================================================================
  function renderStudioStories(value) {
    const grid = $('modalExamplesGrid');
    if (!grid || !value) return;
    const matching = stories.filter((story) => String(story.valueId) === String(value.id));

    rerenderKeepingFocus(grid, () => {
      grid.replaceChildren();
      matching.forEach((story) => {
        const article = document.createElement('article');
        article.className = 'studio-story-card';
        article.dataset.storyId = story.id;

        const type = document.createElement('span');
        type.className = 'studio-story-type';
        type.style.color = value.accent || '';
        type.textContent = story.typeLabel;

        const title = document.createElement('h4');
        title.className = 'studio-story-title';
        title.textContent = story.title;

        const body = document.createElement('p');
        body.className = 'studio-story-body';
        body.textContent = story.story;

        const read = document.createElement('span');
        read.className = 'story-read-badge';
        read.textContent = HikmahStore.data.storiesRead[story.id] ? '✓ مقروءة' : '';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'story-action-btn';
        button.dataset.focusKey = `studio-read:${story.id}`;
        button.textContent = '📖 قراءة القصة كاملة';
        button.addEventListener('click', () => window.openStoryReader(story.id));

        article.append(type, title, body, read, button);
        grid.appendChild(article);
      });
    });
  }

  function enhanceStoryCards() {
    const grid = $('examplesCardsGrid');
    if (!grid) return;
    $$('.story-card', grid).forEach((card) => {
      let storyId = card.dataset.storyId;
      if (!storyId) {
        const valueId = card.querySelector('[data-open-val]')?.dataset.openVal;
        const title = card.querySelector('.story-heading')?.textContent || '';
        const found = stories.find((item) => item.valueId === valueId && item.title === title);
        if (!found) return;
        storyId = found.id;
        card.dataset.storyId = storyId;
      }

      const existingBadge = card.querySelector('[data-read-story]');
      if (existingBadge) {
        existingBadge.textContent = HikmahStore.data.storiesRead[storyId] ? '✓ مقروءة' : '';
        return;
      }

      const actions = document.createElement('div');
      actions.className = 'story-stage3-actions';
      const badge = document.createElement('span');
      badge.className = 'story-read-badge';
      badge.dataset.readStory = storyId;
      badge.textContent = HikmahStore.data.storiesRead[storyId] ? '✓ مقروءة' : '';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'story-action-btn';
      button.dataset.focusKey = `gallery-read:${storyId}`;
      button.textContent = '📖 قراءة القصة كاملة';
      button.addEventListener('click', () => window.openStoryReader(storyId));

      actions.append(badge, button);
      card.appendChild(actions);
    });
  }

  // --------------------------------------------------------------------------
  // Six cards at a time (stories + impact comparison). Only on «الجميع» with
  // no search: six cards show, «عرض المزيد» adds six more, and once all are
  // open «طي» folds back to six. Picking one value shows its cards as usual.
  // --------------------------------------------------------------------------
  const PAGE_SIZE = 6;
  const pager = {
    stories: { limit: PAGE_SIZE, sig: '' },
    comparison: { limit: PAGE_SIZE, sig: '' }
  };

  function paginateCards(key, grid, cards, active, sig, words, rerender) {
    const page = pager[key];
    if (page.sig !== sig) {
      page.sig = sig;
      page.limit = PAGE_SIZE; // new filter or search: start from six again
    }

    let area = document.getElementById(`${key}MoreArea`);
    if (!area) {
      area = document.createElement('div');
      area.id = `${key}MoreArea`;
      area.className = 'cards-more-area';
      grid.after(area);
    }
    area.replaceChildren();

    const total = cards.length;
    const limit = active ? page.limit : Infinity;
    cards.forEach((card, index) => {
      const hide = index >= limit;
      card.hidden = hide;
      card.classList.toggle('hidden', hide);
    });
    if (!active || total <= PAGE_SIZE) return { shown: total, total };

    const button = document.createElement('button');
    button.type = 'button';
    if (limit < total) {
      const next = Math.min(PAGE_SIZE, total - limit);
      button.className = 'cards-more-btn';
      button.textContent = `عرض المزيد من ${words.plural} (+${toArabicNumber(next)})`;
      button.addEventListener('click', () => {
        page.limit += PAGE_SIZE;
        rerender();
      });
    } else {
      button.className = 'cards-fold-btn';
      button.textContent = `طي ${words.plural} (العودة إلى ${toArabicNumber(PAGE_SIZE)})`;
      button.addEventListener('click', () => {
        page.limit = PAGE_SIZE;
        rerender();
        const section = grid.closest('section');
        if (section) {
          const top = section.getBoundingClientRect().top + window.scrollY - 96;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
      });
    }
    area.appendChild(button);
    return { shown: Math.min(limit, total), total };
  }

  function toArabicNumber(n) {
    return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  }

  function pageStories(grid, query) {
    const valueFilter = window.AlIlmState?.storyValueFilter || 'all';
    const active = valueFilter === 'all' && !query.trim();
    const cards = $$('.story-card', grid);
    const { shown, total } = paginateCards(
      'stories',
      grid,
      cards,
      active,
      `${valueFilter}|${query}`,
      { plural: 'القصص' },
      () => window.SearchAndFilter?.renderStories?.()
    );
    const badge = $('searchStatsBadge');
    if (badge && active && total > PAGE_SIZE) {
      badge.textContent = `معروض ${toArabicNumber(shown)} من أصل ${toArabicNumber(total)} قصة`;
    } else if (badge && !query.trim()) {
      badge.textContent = `${toArabicNumber(total)} ${total >= 3 && total <= 10 ? 'قصص' : 'قصة'}`;
    }
  }

  const search = window.SearchAndFilter;
  if (search) {
    const originalShow = search.showEncyclopediaValue?.bind(search);
    if (originalShow) {
      search.showEncyclopediaValue = function (id) {
        originalShow(id);
        const value = valueById(id);
        if (value) renderPracticeList($('encycStepsList'), value);
      };
    }

    const originalRenderStories = search.renderStories?.bind(search);
    if (originalRenderStories) {
      search.renderStories = function () {
        originalRenderStories();
        enhanceStoryCards();
        const grid = $('examplesCardsGrid');
        if (!grid) return;
        const query = window.AlIlmState?.searchQuery || '';
        pageStories(grid, query);
        if (!query.trim()) return;

        $$('.story-card', grid).forEach((card) => {
          const story = stories.find((item) => item.id === card.dataset.storyId);
          if (!story) return;

          const valNameSpan = card.querySelector('.story-val-chip > span:last-child');
          const heading = card.querySelector('.story-heading');
          const body = card.querySelector('.story-body');
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

    const originalComparison = search.renderComparisonGrid?.bind(search);
    if (originalComparison) {
      search.renderComparisonGrid = function () {
        originalComparison();
        applyComparisonFilter();
      };
    }
  }

  let readerReturnFocus = null;
  let currentStoryId = null;

  function applyReaderFontStep() {
    const body = $('storyReaderBody');
    if (!body) return;
    body.dataset.fontStep = String(HikmahStore.data.readerFontStep);
    body.style.removeProperty('--reader-font-size');
  }

  function syncReaderMarkButton(storyId) {
    const btn = $('readerMarkReadBtn');
    if (!btn) return;
    btn.removeAttribute('aria-pressed');
    const story = stories.find((item) => item.id === storyId);
    btn.textContent = story
      ? `🎧 استمع لرسالة «${story.valueName}» الصوتية`
      : '🎧 استمع لرسالة القيمة الصوتية';
  }

  // Exhibition bridge: from a story straight into the value's audio studio.
  window.listenToReaderValue = () => {
    const story = stories.find((item) => item.id === currentStoryId);
    if (!story) return;
    HikmahStore.markStoryRead(story.id, true);
    window.closeStoryReader();
    window.openStudio?.(story.valueId);
    window.AudioStudio?.playFromStart?.(); // "listen" means start the message right away
  };

  function buildStoryInsight(story) {
    const val = valueById(story.valueId);
    const valName = story.valueName || val?.name || 'القيمة';
    const sub = val?.sub ? `«${val.sub}» — ` : '';
    if (story.category === 'heritage') {
      return `${sub}تُبرز هذه القصة كيف تتحول قيمة ${valName} في المواقف الفاصلة إلى قدوةٍ حية. سؤال للحوار: كيف نقتدي بهذا الموقف في تعاملنا اليومي داخل المدرسة؟`;
    }
    if (story.category === 'school') {
      return `${sub}هذا الموقف من واقعنا المدرسي يؤكد أن قيمة ${valName} تبدأ بقرار صادق من الطالب نفسه. سؤال للتأمل: لو كنت في الموقف ذاته اليوم، ما الخطوة الأولى التي ستبادر بها؟`;
    }
    return `${sub}تعكس هذه القصة ارتباط قيمة ${valName} بنهضة الوطن ومستهدفات رؤية 2030. سؤال للحوار: كيف يسهم التزامك الشخصي بهذه القيمة في صناعة مستقبل وطنك؟`;
  }

  window.openStoryReader = (storyId) => {
    const storyIdx = stories.findIndex((item) => item.id === storyId);
    const story = storyIdx >= 0 ? stories[storyIdx] : null;
    const modal = $('storyReaderModal');
    if (!story || !modal) return;

    window.AudioStudio?.stopPlayback?.();

    const alreadyOpen = modal.classList.contains('active');
    if (!alreadyOpen) {
      readerReturnFocus = document.activeElement;
    }
    currentStoryId = storyId;

    const title = $('storyReaderTitle');
    const meta = $('storyReaderMeta');
    const counter = $('storyReaderCounter');
    const body = $('storyReaderBody');
    const insightText = $('storyReaderInsightText');

    if (title) title.textContent = story.title;
    if (meta) meta.textContent = `${story.valueName} • ${story.typeLabel}`;
    if (counter) counter.textContent = `${storyIdx + 1} / ${stories.length}`;
    if (body) {
      body.textContent = story.story;
      applyReaderFontStep();
      body.parentElement?.scrollTo?.({ top: 0, behavior: 'auto' });
    }
    if (insightText) {
      insightText.textContent = buildStoryInsight(story);
    }

    syncReaderMarkButton(storyId);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (!alreadyOpen) {
      $('readerMarkReadBtn')?.focus();
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
    const modal = $('storyReaderModal');
    if (!modal) return;

    // Resolve and restore focus BEFORE setting aria-hidden="true"
    let targetFocus = readerReturnFocus;
    if ((!targetFocus || !targetFocus.isConnected) && currentStoryId) {
      const inStudio = $('studioModal')?.classList.contains('active');
      const scope = inStudio ? $('studioModal') : document;
      targetFocus =
        scope?.querySelector(`[data-story-id="${CSS.escape(currentStoryId)}"] .story-action-btn`) ||
        $('randomStoryBtn');
    }
    readerReturnFocus = null;

    modal.classList.remove('active');
    targetFocus?.focus?.({ preventScroll: true });
    modal.setAttribute('aria-hidden', 'true');

    if (!$('studioModal')?.classList.contains('active')) {
      document.body.classList.remove('modal-open');
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
    announce('تم تسجيل القصة كمقروءة.');
  };

  function openPracticeAtValue(value) {
    if (!value) return;
    window.AppRouter?.switchView?.('encyclopedia', true);
    window.SearchAndFilter?.showEncyclopediaValue?.(value.id);
    requestAnimationFrame(() => {
      const list = $('encycStepsList');
      list?.focus?.({ preventScroll: true });
      list?.scrollIntoView?.({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center'
      });
    });
  }

  window.jumpReaderToPractice = () => {
    const story = stories.find((item) => item.id === currentStoryId);
    if (!story) return;
    window.closeStoryReader();
    if ($('studioModal')?.classList.contains('active')) {
      window.closeStudio?.();
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

  // ==========================================================================
  // 5. IMPACT COMPARISON FILTER
  // ==========================================================================
  const comparisonBar = $('comparisonFilterBar');
  let comparisonGroup = 'all';

  function applyComparisonFilter() {
    const grid = $('comparisonGrid');
    if (!grid) return;
    const query = window.AlIlmState?.searchQuery || '';

    $$('.comparison-card', grid).forEach((card) => {
      const openValId = card.querySelector('[data-comp-open]')?.dataset.compOpen;
      const nameEl = card.querySelector('.comp-name');
      const rawName = nameEl
        ? nameEl.dataset.rawText || (nameEl.dataset.rawText = nameEl.textContent || '')
        : '';
      const value = (openValId && valueById(openValId)) || VALUES.find((item) => item.name === rawName);
      const visible = comparisonGroup === 'all' || value?.group === comparisonGroup;

      card.hidden = !visible;
      card.classList.toggle('hidden', !visible);
      if (!visible) return;

      [nameEl, card.querySelector('.comp-sub'), ...$$('.comp-box p', card)].forEach((el) => {
        if (!el) return;
        const source = el.dataset.rawText || (el.dataset.rawText = el.textContent || '');
        el.replaceChildren();
        addHighlightedText(el, source, query);
      });
    });

    // Six at a time on «جميع القيم» (the two groups already have six each).
    const groupCards = $$('.comparison-card', grid).filter((card) => !card.hidden);
    paginateCards(
      'comparison',
      grid,
      groupCards,
      comparisonGroup === 'all' && !query.trim(),
      `${comparisonGroup}|${query}`,
      { plural: 'المقارنات' },
      applyComparisonFilter
    );
  }

  comparisonBar?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-comp-group]');
    if (!button) return;
    comparisonGroup = button.dataset.compGroup;
    $$('[data-comp-group]', comparisonBar).forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    applyComparisonFilter();
  });

  // ==========================================================================
  // 6. EXHIBITION HELPERS
  // ==========================================================================
  const isExpoValue = (id) => Boolean(window.AL_ILM_EXHIBITION?.isExhibitionValue?.(id));

  // ==========================================================================
  // 7. MODAL FOCUS TRAP & CAPTURE-PHASE ESCAPE MANAGER
  // (Classroom mode and its Shift+F shortcut were removed; it is always off.)
  // ==========================================================================
  function applyClassroomModeState(enabled) {
    document.body.classList.toggle('classroom-mode', enabled);
    document.documentElement.classList.toggle('classroom-mode', enabled);
  }

  // Explicit modal priority stack (topmost first)
  function getTopActiveModal() {
    const order = ['storyReaderModal', 'studioModal'];
    for (const id of order) {
      const el = $(id);
      if (el && el.classList.contains('active')) return el;
    }
    return null;
  }

  function closeTopModal() {
    const top = getTopActiveModal();
    if (!top) return false;
    if (top.id === 'storyReaderModal') {
      window.closeStoryReader();
      return true;
    }
    if (top.id === 'studioModal') {
      window.closeStudio?.();
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
      return st.display !== 'none' && st.visibility !== 'hidden';
    });
  }

  // Capture-phase listener prevents fable_engine's bubble Escape listener from closing Studio under StoryReader
  window.addEventListener(
    'keydown',
    (event) => {
      const key = String(event.key || '');

      if (key === 'Escape') {
        if (closeTopModal()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        return;
      }

      const topModal = getTopActiveModal();

      if (key === 'Tab' && topModal) {
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

  // While a window (value studio / story reader) is open, the page behind it
  // can't be reached at all — no keyboard focus, no screen reader — on top of
  // the scroll lock in CSS (section 16 of stage3_astra_upgrade.css).
  (function lockPageBehindWindows() {
    const behind = () =>
      [document.querySelector('.top-nav'), $('mainContent'), document.querySelector('footer')].filter(Boolean);
    let locked = false;
    const root = document.documentElement;

    // Width of the PC scrollbar (0 on iPad) and which side it is on, measured
    // while the page is unlocked, so CSS can fill that space when it hides.
    function measureGutter() {
      if (document.body.classList.contains('modal-open')) return;
      const gutter = Math.max(0, window.innerWidth - root.clientWidth);
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;left:0;right:0;top:0;height:0;visibility:hidden;pointer-events:none';
      document.body.appendChild(probe);
      const side = probe.getBoundingClientRect().left > 0 ? 'left' : 'right';
      probe.remove();
      root.style.setProperty('--lock-gutter', `${gutter}px`);
      root.dataset.gutterSide = side;
    }

    const sync = () => {
      const open = document.body.classList.contains('modal-open');
      if (open === locked) return;
      locked = open;
      behind().forEach((el) => {
        el.inert = open;
      });
    };
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', measureGutter, { passive: true });
    window.addEventListener('load', measureGutter);
    measureGutter();
    sync();
  })();

  // ==========================================================================
  // 8. VALUE STUDIO: open / close wrappers (the voice message itself — one
  // play ⇄ pause control + replay — lives in AudioStudio in fable_engine.js)
  // ==========================================================================
  let studioReturnFocus = null;

  const originalOpenStudio = window.AudioStudio?.openStudio;
  if (typeof originalOpenStudio === 'function') {
    window.AudioStudio.openStudio = function (id) {
      const wasOpen = $('studioModal')?.classList.contains('active');
      if (!wasOpen) {
        studioReturnFocus = document.activeElement;
      }
      const result = originalOpenStudio.call(this, id);
      const value = valueById(id);
      if (value) {
        renderPracticeList($('modalStepsList'), value);
        renderStudioStories(value);
      }
      if (!wasOpen) {
        $('studioModal')?.querySelector('.modal-close')?.focus?.({ preventScroll: true });
      }
      playStudioEntrance();
      return result;
    };
  }

  // Cinematic staggered entrance (studioCardRise) each time a value opens.
  let studioEntranceTimer = 0;
  function playStudioEntrance() {
    const body = $('studioModal')?.querySelector('.studio-scroll-body');
    if (!body) return;
    clearTimeout(studioEntranceTimer);
    body.classList.remove('is-entering');
    body.scrollTop = 0;
    void body.offsetWidth; // restart the CSS animations
    body.classList.add('is-entering');
    // Drop the class once the sequence is done so later re-renders don't replay.
    studioEntranceTimer = setTimeout(() => body.classList.remove('is-entering'), 1400);
  }

  const originalCloseStudio = window.AudioStudio?.closeStudio;
  if (typeof originalCloseStudio === 'function') {
    window.AudioStudio.closeStudio = function (...args) {
      const targetFocus =
        studioReturnFocus && studioReturnFocus.isConnected ? studioReturnFocus : null;
      studioReturnFocus = null;
      const res = originalCloseStudio.apply(this, args);
      targetFocus?.focus?.({ preventScroll: true });
      return res;
    };
  }

  $('storyReaderModal')?.addEventListener('click', (event) => {
    if (event.target === $('storyReaderModal')) window.closeStoryReader();
  });

  // ==========================================================================
  // 9. INITIALIZATION & STATE HYDRATION
  // ==========================================================================
  HikmahStore.load();

  function start() {
    HikmahStore.refreshAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
