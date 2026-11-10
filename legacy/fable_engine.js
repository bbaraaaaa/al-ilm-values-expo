/* Built by tools/build-legacy.ps1 from fable_engine.js (sha256 66da6f04bfb5142dff228853a0d2246108fdb4dd395787a8a1554f497df110d4) for older browsers. Do not edit: edit fable_engine.js and rebuild. */
(() => {
  "use strict";
  var _a;
  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function replaceChildren(...nodes) {
      while (this.firstChild) this.removeChild(this.firstChild);
      nodes.forEach((n) => this.append(n));
    };
  }
  const DATA = window.AL_ILM_DATA || {};
  const ALM_PALETTE = window.ALM_PALETTE = /* @__PURE__ */ (() => {
    const ACCENT = {
      "#2DD4BF": "#65d4c3",
      "#10B981": "#80d3a4",
      "#38BDF8": "#76c9f8",
      "#F59E0B": "#f1ad79",
      "#A78BFA": "#bab3fe",
      "#60A5FA": "#93c0ff",
      "#D4AF37": "#cdc06d",
      "#FB7185": "#f9a1ac",
      "#84CC16": "#a7cc83",
      "#22D3EE": "#60d0e3",
      "#FBBF24": "#e1b66c",
      "#C084FC": "#daa8ea"
    };
    const GROUND = {
      "#0b2e2b": "#112c34",
      "#06171d": "#081d23",
      "#092c1e": "#0e2931",
      "#051512": "#03141b",
      "#0b253c": "#0b2433",
      "#061322": "#081b26",
      "#332109": "#22231c",
      "#171108": "#141a19",
      "#1f1638": "#171d31",
      "#0d0b1e": "#0d1724",
      "#0f213d": "#0d2233",
      "#071124": "#091a27",
      "#2d240b": "#1e241d",
      "#141108": "#121a19",
      "#311322": "#231c26",
      "#160a14": "#14171f",
      "#1b2c0d": "#102a33",
      "#0c1608": "#00161e",
      "#092b36": "#0a2730",
      "#05141d": "#081b23",
      "#2f2309": "#20241c",
      "#151006": "#121a18",
      "#27133a": "#1c1c32",
      "#11091f": "#101624"
    };
    const painted = /* @__PURE__ */ new WeakMap();
    const accent = (c) => typeof c === "string" && ACCENT[c.toUpperCase()] || c;
    const surface = (s) => typeof s === "string" ? s.replace(/#[0-9a-fA-F]{6}\b/g, (h) => GROUND[h.toLowerCase()] || h) : s;
    const paint = (v) => {
      if (!v || typeof v !== "object") return v;
      let p = painted.get(v);
      if (!p) {
        p = Object.assign({}, v, { accent: accent(v.accent), surface: surface(v.surface) });
        painted.set(v, p);
      }
      return p;
    };
    return { accent, surface, paint };
  })();
  const VALUES = (Array.isArray(DATA.values) ? DATA.values : []).map(ALM_PALETTE.paint);
  const ICONS = DATA.icons || {};
  const ALL_STORIES = VALUES.flatMap(
    (val) => (Array.isArray(val.examples) ? val.examples : []).map((ex, idx) => ({
      id: `${val.id}_story_${idx + 1}`,
      valueId: val.id,
      valueNum: val.num,
      valueName: val.name,
      valueAccent: val.accent,
      valueSurface: val.surface,
      category: ex.category || (idx === 0 ? "heritage" : idx === 1 ? "school" : "vision"),
      typeLabel: ex.type || (idx === 0 ? "من السيرة والتاريخ" : idx === 1 ? "من واقع ثانوية العلم النافع" : "من الوطن ورؤية 2030"),
      title: ex.title || "",
      story: ex.story || ex.text || ""
    }))
  );
  const state = window.AlIlmState = {
    activeView: "all",
    heroLayout: "orbit",
    activeGroup: "all",
    orbitList: [],
    activeOrbitIndex: 0,
    isSpinning: false,
    searchQuery: "",
    storyValueFilter: "all",
    storyCategoryFilter: "all",
    activeEncycId: ((_a = VALUES[0]) == null ? void 0 : _a.id) || "tasamuh",
    currentStudioId: null
  };
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const escapeHTML = (input) => {
    const div = document.createElement("div");
    div.textContent = input == null ? "" : String(input);
    return div.innerHTML;
  };
  const getValueById = (id) => VALUES.find((v) => String(v.id) === String(id)) || VALUES[0] || null;
  const getIconSVG = (id) => ICONS[id] || "";
  const KSU_AYA = (sura, aya) => `https://quran.ksu.edu.sa/index.php?l=ar#aya=${sura}_${aya}&m=hafs&qaree=husary&trans=ar_mu`;
  const KSU = "المصحف الإلكتروني بجامعة الملك سعود";
  const DORAR = "الموسوعة الحديثية — الدرر السنية";
  const EVIDENCE_SOURCES = {
    tasamuh: { url: KSU_AYA(24, 22), site: KSU, recite: "quoted/024022" },
    watani: { url: "https://dorar.net/h/rT3SDt3u", site: DORAR, hadith: "e-watani" },
    // جامع الترمذي 3926
    taawun: { url: KSU_AYA(5, 2), site: KSU, recite: "quoted/005002" },
    azeema: { url: "https://dorar.net/h/Ov16uqG0", site: DORAR, hadith: "e-azeema" },
    // صحيح مسلم 2664
    amana: { url: KSU_AYA(4, 58), site: KSU, recite: "quoted/004058" },
    indibat: { url: KSU_AYA(4, 103), site: KSU, recite: "quoted/004103" },
    itqan: { url: KSU_AYA(27, 88), site: KSU, recite: "quoted/027088" },
    ihtiram: { url: KSU_AYA(49, 11), site: KSU, recite: "quoted/049011" },
    masooliya: { url: "https://dorar.net/h/J4fhEcBq", site: DORAR, hadith: "e-masooliya" },
    // صحيح البخاري 893
    sidq: { url: KSU_AYA(9, 119), site: KSU, recite: "quoted/009119" },
    ihsan: { url: "https://dorar.net/h/zJB1WCUU", site: DORAR, hadith: "e-ihsan" },
    // صحيح مسلم 1955
    tumooh: { url: "https://dorar.net/h/Ov16uqG0", site: DORAR, hadith: "e-azeema" }
    // صحيح مسلم 2664
  };
  const HADITH_VOICE_NOTE = "صوت مولَّد بالذكاء الاصطناعي";
  const RECITER = "الشيخ ياسر الدوسري";
  const ICON_PLAY = '<svg class="audio-icon-play" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2Z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg class="audio-icon-pause" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2" fill="currentColor"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2" fill="currentColor"/></svg>';
  const ICON_REPLAY = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.6-5.9" stroke-linecap="round"/><path d="M4 4.5V9h4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const arClock = (sec) => {
    const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  const QuranRecite = window.QuranRecite = {
    audio: null,
    ctl: null,
    // the control box of the verse being played
    status: "idle",
    // 'idle' | 'playing' | 'paused'
    isPlaying: false,
    raf: 0,
    shownSec: -1,
    // the whole second last written on the clock
    player() {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.preload = "none";
        this.audio.addEventListener("ended", () => this.setStatus("idle"));
        this.audio.addEventListener("error", () => this.setStatus("idle"));
        this.audio.addEventListener("loadedmetadata", () => this.paint());
        this.audio.addEventListener("seeked", () => this.paint());
      }
      return this.audio;
    },
    // Progress as --p (0–1): on the control (the ring of the small in-text
    // hadith button) and on its bar under the verse / hadith. Drawn every
    // frame while playing; the bar moves with transforms only (no layout).
    paint() {
      const ctl = this.ctl;
      const a = this.audio;
      if (!ctl || !a) return;
      const d = a.duration;
      const known = Number.isFinite(d) && d > 0;
      const p = known ? Math.min(1, a.currentTime / d).toFixed(4) : "0";
      ctl.style.setProperty("--p", p);
      const bar = ctl.reciteBar;
      if (!bar) return;
      bar.style.setProperty("--p", p);
      const sec = Math.floor(a.currentTime);
      const total = known ? String(Math.round(d)) : "";
      if (sec === this.shownSec && bar.dataset.total === total) return;
      this.shownSec = sec;
      bar.dataset.total = total;
      bar.querySelector(".recite-time--now").textContent = arClock(a.currentTime);
      bar.querySelector(".recite-time--total").textContent = known ? arClock(d) : "";
      const track = bar.querySelector(".recite-track");
      track.setAttribute("aria-valuemax", total || "0");
      track.setAttribute("aria-valuenow", String(sec));
      track.setAttribute("aria-valuetext", known ? `${arClock(a.currentTime)} من ${arClock(d)}` : arClock(a.currentTime));
    },
    loop() {
      cancelAnimationFrame(this.raf);
      const step = () => {
        this.paint();
        this.raf = this.status === "playing" ? requestAnimationFrame(step) : 0;
      };
      this.raf = requestAnimationFrame(step);
    },
    // tap / drag on the bar (fraction 0–1 from the right) and the arrow keys
    seekTo(ctl, fraction) {
      const a = this.audio;
      const d = a == null ? void 0 : a.duration;
      if (this.ctl !== ctl || !Number.isFinite(d) || d <= 0) return;
      a.currentTime = Math.min(d - 0.05, Math.max(0, fraction * d));
      this.paint();
    },
    seekBy(ctl, seconds) {
      var _a2;
      const d = (_a2 = this.audio) == null ? void 0 : _a2.duration;
      if (this.ctl !== ctl || !Number.isFinite(d) || d <= 0) return;
      this.seekTo(ctl, (this.audio.currentTime + seconds) / d);
    },
    load(ctl) {
      if (this.ctl === ctl) return;
      this.stop();
      this.ctl = ctl;
      this.player().src = ctl.dataset.src;
    },
    toggle(ctl) {
      if (this.ctl === ctl && this.status === "playing") {
        this.audio.pause();
        this.setStatus("paused");
        return;
      }
      this.load(ctl);
      this.play();
    },
    replay(ctl) {
      this.load(ctl);
      this.player().currentTime = 0;
      this.play();
    },
    play() {
      var _a2;
      if (((_a2 = window.AudioStudio) == null ? void 0 : _a2.status) === "playing") window.AudioStudio.pauseAudio();
      this.player().play().catch((err) => {
        if ((err == null ? void 0 : err.name) !== "AbortError") this.setStatus("idle");
      });
      this.setStatus("playing");
    },
    pauseIfPlaying() {
      if (this.status === "playing") {
        this.audio.pause();
        this.setStatus("paused");
      }
    },
    stop() {
      if (this.audio) {
        this.audio.pause();
        if (this.ctl) this.audio.currentTime = 0;
      }
      this.setStatus("idle");
      this.ctl = null;
    },
    setStatus(status) {
      this.status = status;
      this.isPlaying = status === "playing";
      const ctl = this.ctl;
      if (!ctl) return;
      ctl.classList.toggle("is-playing", this.isPlaying);
      const label = ctl.querySelector(".recite-state");
      if (label) label.textContent = this.isPlaying ? "إيقاف" : "تشغيل";
      const toggle = ctl.matches('[data-recite="toggle"]') ? ctl : ctl.querySelector('[data-recite="toggle"]');
      const what = ctl.dataset.what || "تلاوة الآية";
      toggle == null ? void 0 : toggle.setAttribute("aria-label", `${this.isPlaying ? "إيقاف" : "تشغيل"} ${what}`);
      ctl.classList.toggle("is-started", status !== "idle");
      if (this.isPlaying) {
        this.loop();
      } else {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.shownSec = -1;
        if (status === "paused") this.paint();
      }
    }
  };
  const buildReciteControls = (src) => {
    const isVerse = Boolean(src.recite);
    const what = isVerse ? "تلاوة الآية" : "قراءة الحديث";
    const credit = isVerse ? `بصوت ${RECITER}` : HADITH_VOICE_NOTE;
    const box = document.createElement("span");
    box.className = "studio-audio-controls recite-controls";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", isVerse ? `تلاوة الآية بصوت ${RECITER}` : `قراءة الحديث (${HADITH_VOICE_NOTE})`);
    box.dataset.what = what;
    box.dataset.src = isVerse ? `./audio/quran/dosari/${src.recite}.mp3` : `./audio/hadith/${src.hadith}.mp3`;
    box.innerHTML = `<button type="button" class="audio-btn audio-btn--main audio-btn--sm" data-recite="toggle" aria-label="تشغيل ${what}">${ICON_PLAY}${ICON_PAUSE}<span class="recite-state">تشغيل</span></button><span class="recite-fold recite-fold--credit"><span class="recite-fold__in"><span class="recite-credit">${credit}</span></span></span><span class="recite-bar"><span class="recite-bar__caption" aria-hidden="true"><span class="recite-bar__credit">${credit}</span><span class="recite-time"><span class="recite-time--now">0:00</span> / <span class="recite-time--total">0:00</span></span></span><span class="recite-track" role="slider" tabindex="0" aria-label="موضع ${what}" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0"><span class="recite-track__fill"></span><span class="recite-track__head"><span class="recite-track__knob"></span></span></span></span><span class="recite-fold recite-fold--replay"><span class="recite-fold__in"><button type="button" class="audio-btn audio-btn--sm" data-recite="replay" aria-label="إعادة ${what} من البداية">${ICON_REPLAY}<span>إعادة</span></button></span></span>`;
    box.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-recite]");
      if (!btn) return;
      if (btn.dataset.recite === "replay") QuranRecite.replay(box);
      else QuranRecite.toggle(box);
    });
    const bar = box.querySelector(".recite-bar");
    const track = box.querySelector(".recite-track");
    const fractionAt = (e) => {
      const r = track.getBoundingClientRect();
      return r.width ? (r.right - e.clientX) / r.width : 0;
    };
    bar.addEventListener("pointerdown", (e) => {
      var _a2;
      if (QuranRecite.ctl !== box || !box.classList.contains("is-started")) return;
      e.preventDefault();
      e.stopPropagation();
      (_a2 = bar.setPointerCapture) == null ? void 0 : _a2.call(bar, e.pointerId);
      box.classList.add("is-seeking");
      QuranRecite.seekTo(box, fractionAt(e));
    });
    bar.addEventListener("pointermove", (e) => {
      var _a2;
      if ((_a2 = bar.hasPointerCapture) == null ? void 0 : _a2.call(bar, e.pointerId)) QuranRecite.seekTo(box, fractionAt(e));
    });
    const endSeek = () => box.classList.remove("is-seeking");
    bar.addEventListener("pointerup", endSeek);
    bar.addEventListener("pointercancel", endSeek);
    bar.addEventListener("lostpointercapture", endSeek);
    track.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: 2, ArrowUp: 2, ArrowRight: -2, ArrowDown: -2, PageUp: 5, PageDown: -5 }[e.key];
      if (step) QuranRecite.seekBy(box, step);
      else if (e.key === "Home") QuranRecite.seekTo(box, 0);
      else if (e.key === "End") QuranRecite.seekTo(box, 1);
      else return;
      e.preventDefault();
    });
    box.reciteBar = bar;
    return box;
  };
  const renderEvidenceSource = (afterId, valueId) => {
    const textEl = $(afterId);
    if (!textEl) return;
    let line = textEl.nextElementSibling;
    if (!line || !line.classList.contains("evidence-source")) {
      line = document.createElement("p");
      line.className = "evidence-source";
      textEl.after(line);
    }
    const src = EVIDENCE_SOURCES[valueId];
    if (QuranRecite.ctl && line.contains(QuranRecite.ctl)) QuranRecite.stop();
    line.hidden = !src;
    line.replaceChildren();
    if (!src) return;
    const controls = src.recite || src.hadith ? buildReciteControls(src) : null;
    if (controls) line.append(controls);
    const link = document.createElement("a");
    link.href = src.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = src.site;
    link.setAttribute("aria-label", `المصدر: ${src.site} (يفتح في صفحة جديدة)`);
    link.innerHTML = '<span>المصدر</span><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5M14 4h6v6M20 4l-9 9"/></svg>';
    line.append(link);
  };
  const arNorm = (s) => String(s).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ئ/g, "ي").replace(/ؤ/g, "و").replace(/\s+/g, " ");
  const INLINE_HADITHS = [
    ["h-bunyan", "المؤمن للمؤمن كالبنيان"],
    ["h-adwamuha", "أحب الأعمال إلى الله أدومها"],
    ["h-yutqinahu", "إذا عمل أحدكم عملا أن يتقنه"],
    ["h-tumaanina", "فإن الصدق طمأنينة"],
    ["h-tarahu", "أن تعبد الله كأنك تراه"],
    ["h-uhud", "إن رأيتمونا تخطفنا الطير"],
    ["h-ruma", "من يشتري بئر رومة"],
    ["h-sujud", "فأعني على نفسك بكثرة السجود"],
    ["h-shadid", "ليس الشديد بالصرعة"],
    ["h-kafa", "كفى بالمرء كذبا"],
    ["h-awn", "في عون العبد"],
    ["h-ghash", "من غشنا فليس منا"],
    ["h-ihris", "احرص على ما ينفعك"]
  ].map(([id, key]) => ({ id, key: arNorm(key) }));
  const HADITH_SKIP = "#modalEvidenceText, #encycEvidence, .evidence-source, [data-ra-has] [data-ra-f], [data-ra-has][data-ra-f], button, input, textarea, script, style, [contenteditable]";
  const makeHadithButton = (id) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hadith-play";
    btn.dataset.recite = "toggle";
    btn.dataset.what = "قراءة الحديث";
    btn.dataset.src = `./audio/hadith/${id}.mp3`;
    btn.title = `استمع للحديث (${HADITH_VOICE_NOTE})`;
    btn.setAttribute("aria-label", "تشغيل قراءة الحديث");
    btn.innerHTML = ICON_PLAY + ICON_PAUSE;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      QuranRecite.toggle(btn);
    });
    return btn;
  };
  const decorateHadiths = (root) => {
    var _a2;
    if (!root || !root.querySelectorAll) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        var _a3;
        return node.nodeValue.includes("»") && !((_a3 = node.parentElement) == null ? void 0 : _a3.closest(HADITH_SKIP)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let text = node.nodeValue;
      let cursor = node;
      const re = /«([^»]+)»/g;
      let m;
      const cuts = [];
      while (m = re.exec(text)) {
        const q = arNorm(m[1]);
        const hit = INLINE_HADITHS.find((h) => q.includes(h.key));
        if (hit) cuts.push({ end: m.index + m[0].length, id: hit.id });
      }
      for (let i = cuts.length - 1; i >= 0; i--) {
        const { end, id } = cuts[i];
        const next = cursor.nextSibling;
        if (end === text.length && ((_a2 = next == null ? void 0 : next.classList) == null ? void 0 : _a2.contains("hadith-play"))) continue;
        const rest = cursor.splitText(end);
        rest.parentNode.insertBefore(makeHadithButton(id), rest);
        text = cursor.nodeValue;
      }
    }
  };
  window.decorateHadiths = decorateHadiths;
  const NARR = { units: null, loading: null };
  const NARR_WHAT = { s: "قراءة القصة", ben: "قراءة الثمرات والفوائد", steps: "قراءة الخطوات", cmp: "قراءة المقارنة", p: "قراءة الفقرة" };
  const unitKind = (unit) => {
    const m = /-(s|ben|steps|cmp|p)\d*$/.exec(unit);
    return m ? m[1] : "p";
  };
  const makeNarrationButton = (unit, info) => {
    const what = NARR_WHAT[unitKind(unit)];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hadith-play narr-play";
    btn.dataset.recite = "toggle";
    btn.dataset.what = what;
    btn.dataset.unit = unit;
    btn.dataset.src = `./audio/narration/${unit}.mp3${info.d ? `?d=${info.d}` : ""}`;
    const verses = info.v && info.v.length ? `، والآيات بصوت ${RECITER}` : "";
    btn.title = `استمع (${HADITH_VOICE_NOTE}${verses})`;
    btn.setAttribute("aria-label", `تشغيل ${what}`);
    btn.innerHTML = ICON_PLAY + ICON_PAUSE;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      QuranRecite.toggle(btn);
    });
    return btn;
  };
  const fieldsOf = (scope) => (scope.matches("[data-ra-f]") ? [scope] : []).concat([...scope.querySelectorAll("[data-ra-f]")]);
  const dropButton = (btn) => {
    if (QuranRecite.ctl === btn) QuranRecite.stop();
    btn.remove();
  };
  const decorateNarration = (root) => {
    if (!NARR.units || !root || !root.querySelectorAll) return;
    const scopes = root.matches && root.matches("[data-ra]") ? [root] : [];
    root.querySelectorAll("[data-ra]").forEach((s) => scopes.push(s));
    const up = root.parentElement && root.parentElement.closest("[data-ra]");
    if (up && scopes.indexOf(up) < 0) scopes.push(up);
    scopes.forEach((scope) => {
      const unit = scope.dataset.ra;
      const info = NARR.units[unit];
      let btn = scope.querySelector(".narr-play");
      if (!info) {
        if (btn) dropButton(btn);
        scope.removeAttribute("data-ra-has");
        return;
      }
      if (!scope.hasAttribute("data-ra-has")) scope.setAttribute("data-ra-has", "");
      fieldsOf(scope).forEach((f) => f.querySelectorAll(".hadith-play:not(.narr-play)").forEach(dropButton));
      if (btn && btn.dataset.unit === unit) return;
      if (btn) dropButton(btn);
      btn = makeNarrationButton(unit, info);
      const slot = scope.querySelector("[data-ra-btn]");
      if (slot) {
        slot.appendChild(btn);
      } else {
        const fields = fieldsOf(scope);
        const last = fields[fields.length - 1] || scope;
        last.appendChild(document.createTextNode(" "));
        last.appendChild(btn);
      }
    });
  };
  window.decorateNarration = decorateNarration;
  const loadNarration = () => {
    if (!NARR.loading) {
      NARR.loading = fetch("./audio/narration/index.json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : null).then((d) => {
        NARR.units = d && d.units || {};
      }).catch(() => {
        NARR.units = {};
      }).then(() => {
        document.documentElement.classList.toggle("has-narration", Object.keys(NARR.units).length > 0);
        decorateNarration(document.body);
      });
    }
    return NARR.loading;
  };
  const RA_SKIP = "button, svg";
  const wrapWords = (el) => {
    const spans = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.parentElement && n.parentElement.closest(RA_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const parent = node.parentElement;
      if (parent.classList.contains("ra-w")) {
        if (node.nodeValue.trim()) spans.push(parent);
        return;
      }
      if (!node.nodeValue.trim()) return;
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (!part.trim()) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        const s = document.createElement("span");
        s.className = "ra-w";
        s.textContent = part;
        frag.appendChild(s);
        spans.push(s);
      });
      parent.replaceChild(frag, node);
    });
    return spans;
  };
  let raUserAt = 0;
  ["wheel", "touchstart", "keydown"].forEach(
    (type) => window.addEventListener(
      type,
      (e) => {
        if (!(e.target && e.target.closest && e.target.closest(".hadith-play, .audio-btn"))) raUserAt = performance.now();
      },
      { capture: true, passive: true }
    )
  );
  const scrollerOf = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const oy = getComputedStyle(p).overflowY;
      if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight + 4) return p;
    }
    return null;
  };
  const makeReadAlong = () => {
    let scope = null;
    let list = [];
    let idx = -1;
    let scroller;
    let onJump = null;
    const keepInView = (el) => {
      if (performance.now() - raUserAt < 2500) return;
      if (scroller === void 0) scroller = scrollerOf(scope);
      const r = el.getBoundingClientRect();
      const box = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      const h = box.bottom - box.top;
      if (r.top >= box.top + h * 0.1 && r.bottom <= box.bottom - h * 0.16) return;
      const delta = r.top - (box.top + h * 0.38);
      (scroller || window).scrollBy({ top: delta, behavior: "smooth" });
    };
    return {
      get scope() {
        return scope;
      },
      // jump(seconds): only when the sound can go to a word (a file, not the device's voice)
      start(el, items, jump) {
        this.clear();
        scope = el;
        list = items;
        idx = -1;
        scroller = void 0;
        onJump = jump || null;
        scope.classList.add("ra-live");
        scope.classList.toggle("ra-seek", !!onJump);
      },
      // true when the tapped element is one of the words being followed
      jump(el) {
        if (!onJump) return false;
        const word = list.find((w) => w.el === el);
        if (!word) return false;
        onJump(word.t);
        return true;
      },
      tick(t) {
        if (!scope) return;
        let i = idx;
        while (i + 1 < list.length && list[i + 1].t <= t + 0.08) i++;
        while (i >= 0 && list[i].t > t + 0.08) i--;
        if (i === idx) return;
        if (i > idx) {
          for (let k = Math.max(0, idx); k <= i; k++) list[k].el.classList.add("is-read");
        } else {
          for (let k = i + 1; k <= idx; k++) list[k].el.classList.remove("is-read");
        }
        if (idx >= 0 && list[idx]) list[idx].el.classList.remove("is-now");
        if (i >= 0) {
          list[i].el.classList.add("is-now");
          keepInView(list[i].el);
        }
        idx = i;
      },
      clear() {
        if (scope) {
          scope.classList.remove("ra-live", "ra-seek");
          list.forEach((w) => w.el.classList.remove("is-read", "is-now"));
        }
        scope = null;
        list = [];
        idx = -1;
        onJump = null;
      }
    };
  };
  const RA_MSG = makeReadAlong();
  document.addEventListener("click", (e) => {
    const word = e.target.closest && e.target.closest(".ra-w");
    if (!word || String(window.getSelection ? window.getSelection() : "").length) return;
    RA_MSG.jump(word);
  });
  const estimateTimes = (spans, seconds) => {
    const w = spans.map((s) => {
      const t = s.textContent;
      const letters = t.replace(/[^ء-ي0-9]/g, "").length;
      const pause = /[.!؟?]$/.test(t) ? 7 : /[،,؛;:]$/.test(t) ? 4 : 0;
      return Math.max(2, letters) + pause;
    });
    const total = w.reduce((a, b) => a + b, 0) || 1;
    const lead = Math.min(0.35, seconds * 0.04);
    const span = Math.max(0.5, seconds - lead - 0.3);
    let acc = 0;
    return w.map((x) => {
      const t = lead + acc / total * span;
      acc += x;
      return t;
    });
  };
  const MessageAlong = {
    spans: [],
    mode: "off",
    // 'audio' (the file's clock) | 'clock' (estimated) | 'chars' (the voice's own signal)
    raf: 0,
    clock: { base: 0, since: 0, running: false },
    total: 0,
    begin(val) {
      this.stop();
      const el = $("editorialLyrics");
      if (!el) return;
      this.spans = wrapWords(el);
      this.offsets = [];
      let pos = 0;
      const text = el.textContent;
      this.spans.forEach((s) => {
        pos = text.indexOf(s.textContent, pos);
        this.offsets.push(pos);
        pos += s.textContent.length;
      });
      RA_MSG.start(el, []);
    },
    setTimes(times, jump) {
      if (!RA_MSG.scope) return;
      RA_MSG.start(RA_MSG.scope, this.spans.map((el, i) => ({ el, t: times[i] })), jump);
    },
    // a tap on a word: the recording continues from it
    jump(t) {
      const player = this.player;
      if (!player) return;
      player.currentTime = Math.max(0, t - 0.02);
      RA_MSG.tick(player.currentTime);
      if (window.AudioStudio && window.AudioStudio.status === "paused") window.AudioStudio.resumeAudio();
    },
    useAudio(player, val) {
      this.mode = "audio";
      this.player = player;
      const apply = (times) => {
        if (this.mode === "audio") this.setTimes(times, (t) => this.jump(t));
      };
      const fallback = () => {
        const d = player.duration;
        if (Number.isFinite(d) && d > 0) apply(estimateTimes(this.spans, d));
        else player.addEventListener("loadedmetadata", fallback, { once: true });
      };
      if (window.AudioStudio && window.AudioStudio.wordsIds.has(val.id)) {
        const base = (val.file || `./audio/${val.id}.mp3`).replace(/\.mp3(\?.*)?$/, "");
        fetch(`${base}.words.json`, { cache: "no-cache" }).then((r) => r.ok && /json/.test(r.headers.get("content-type") || "") ? r.json() : null).then((d) => d && Array.isArray(d.t) && d.t.length === this.spans.length ? apply(d.t) : fallback()).catch(fallback);
      } else {
        fallback();
      }
      this.loop(() => player.currentTime);
    },
    useClock(seconds) {
      this.mode = "clock";
      this.total = seconds;
      this.setTimes(estimateTimes(this.spans, seconds));
      this.clock = { base: 0, since: performance.now(), running: true };
      this.loop(() => this.elapsed());
    },
    useChars(utterance, wordsPerSecond) {
      this.mode = "chars";
      this.setTimes(this.spans.map((_, i) => i));
      let heard = false;
      utterance.onboundary = (e) => {
        if (this.mode !== "chars" || e.name && e.name !== "word") return;
        heard = true;
        let i = 0;
        while (i + 1 < this.offsets.length && this.offsets[i + 1] <= e.charIndex) i++;
        RA_MSG.tick(i);
      };
      this.clock = { base: 0, since: performance.now(), running: true };
      setTimeout(() => {
        if (!heard && this.mode === "chars" && RA_MSG.scope) {
          const seconds = this.spans.length / wordsPerSecond;
          const passed = this.elapsed();
          this.mode = "clock";
          this.setTimes(estimateTimes(this.spans, seconds));
          this.clock = { base: passed, since: performance.now(), running: this.clock.running };
          this.loop(() => this.elapsed());
        }
      }, 1600);
    },
    elapsed() {
      const c = this.clock;
      return (c.base + (c.running ? performance.now() - c.since : 0)) / 1e3;
    },
    pause() {
      const c = this.clock;
      if (c.running) {
        c.base += performance.now() - c.since;
        c.running = false;
      }
    },
    resume() {
      const c = this.clock;
      if (!c.running) {
        c.since = performance.now();
        c.running = true;
      }
      if (this.mode === "audio" || this.mode === "clock") this.loop(this.now);
    },
    loop(now) {
      this.now = now;
      cancelAnimationFrame(this.raf);
      const step = () => {
        if (window.AudioStudio && window.AudioStudio.status !== "playing") {
          this.raf = 0;
          return;
        }
        RA_MSG.tick(now());
        this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    },
    stop() {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.mode = "off";
      RA_MSG.clear();
    }
  };
  const startHadithDecorator = () => {
    decorateHadiths(document.body);
    let queued = /* @__PURE__ */ new Set();
    let raf = 0;
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "childList") {
          r.addedNodes.forEach((n) => queued.add(n.nodeType === 3 ? n.parentElement : n));
        } else if (r.type === "characterData") {
          queued.add(r.target.parentElement);
        } else if (r.type === "attributes") {
          queued.add(r.target);
        }
      }
      if (QuranRecite.ctl && !QuranRecite.ctl.isConnected) QuranRecite.stop();
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const roots = [...queued].filter((el) => {
          var _a2;
          return el && el.isConnected && !((_a2 = el.closest) == null ? void 0 : _a2.call(el, ".hadith-play"));
        });
        queued = /* @__PURE__ */ new Set();
        roots.forEach((root) => {
          decorateNarration(root);
          decorateHadiths(root);
        });
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["data-ra"] });
    loadNarration();
  };
  const EXHIBITION = window.AL_ILM_EXHIBITION = {
    title: "معرض ترسيخ القيم",
    organizers: "النشاط الطلابي والتوجيه الطلابي بمتابعة إدارة ثانوية العلم النافع",
    motto: "لا تجعل القيم مجرد كلمات نرددها، بل اجعلها إبداعًا نقدّمه وسلوكًا نعيشه وأثرًا نتركه",
    values: [
      { label: "الانضباط", id: "indibat" },
      { label: "المرونة", id: null },
      { label: "الانتماء الوطني", id: "watani" },
      { label: "التسامح", id: "tasamuh" },
      { label: "العزيمة", id: "azeema" },
      { label: "الأمانة", id: "amana" },
      { label: "التعاون", id: "taawun" },
      { label: "المثابرة", id: null }
    ],
    isExhibitionValue(id) {
      return this.values.some((item) => item.id && String(item.id) === String(id));
    }
  };
  const toArabicDigits = (input) => String(input).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
  window.toArabicDigits = toArabicDigits;
  const HERO_CARD_SUBS = {
    tasamuh: "نقاء القلب وقوة الشخصية",
    watani: "فخر بالهوية ووفاء للقيادة",
    taawun: "اجتماع القلوب والعقول على الخير",
    azeema: "إصرار يتجاوز الصعاب نحو القمة",
    amana: "ثقةٌ تُصان وضميرٌ لا يغيب",
    indibat: "التزام واع بالوقت والنظام",
    itqan: "إتقانٌ يصنع الأثر وتوقيعٌ للتميز",
    ihtiram: "رُقيّ الخُلق وتقديرٌ للجميع",
    masooliya: "وعيٌ بالواجب وثباتٌ على العهد",
    sidq: "استقامة القول ونقاء السريرة",
    ihsan: "تجاوز للواجب نحو الأجمل",
    tumooh: "همّةٌ تعانق القمم وأثرٌ خالد"
  };
  const HERO_CARD_QUOTES = {
    tasamuh: "«التسامح هو نقاء القلب، وقوة الشخصية، به نرتقي في تعاملنا مع الآخرين، ونبني مجتمعاً يسوده الاحترام والمحبة.»",
    watani: "«الانتماء الوطني هو فخرنا بهويتنا، ووفاؤنا لأرضنا وقيادتنا، وسعينا المستمر بالعلم والعمل لرفعة وطننا الغالي.»",
    taawun: "«التعاون هو اجتماع القلوب والعقول على الخير، فيد الله مع الجماعة، وبتكاتفنا معاً ننجز ما يعجز عنه الفرد وحده.»",
    azeema: "«العزيمة هي الوقود الذي يدعمنا لتجاوز الصعاب، والإصرار الذي لا يعرف المستحيل حتى نصل إلى القمة ونحقق الطموح.»",
    indibat: "«الانضباط هو سر النجاح والتميز، وهو الإرادة الواعية للوقت والنظام لصنع مستقبلنا ومستقبل وطننا خطوة بخطوة.»",
    amana: "«الأمانة هي ميزان الثقة وركيزة الأخلاق، بها تُصان الحقوق ويبقى الضمير حياً في القول والعمل في كل حين.»",
    itqan: "«الإتقان أن تمنح كل عمل حقه كاملاً من الجهد والعناية، لتجعل إنتاجك تحفةً تحمل اسمك وخطوةً نحو التميز الراسخ.»",
    ihtiram: "«الاحترام لغة الكبار؛ أن تُقدّر معلمك، وتُنصت لزميلك، وتصون مدرستك ونظامها، وتختلف بأدب دون أن تجرح أحداً.»",
    masooliya: "«المسؤولية أن تحمل واجبك بوعي دون تذكير، وتعترف بالخطأ دون تبرير، وتُكمل ما بدأت بهمة وثبات وإخلاص.»",
    sidq: "«الصدق استقامة القول وصفاء الضمير، به تُبنى جسور الثقة وينال الإنسان احترام مجتمعه ورضا ربه في كل أمر.»",
    ihsan: "«الإحسان أن تتجاوز حدود الواجب المجرد إلى الأجمل والأكمل، فتُحسن إلى من حولك قولاً وفعلاً وأثراً يبقى.»",
    tumooh: "«الطموح أن ترى نفسك في قمم المجد ثم تمشي إليها بخطى واثقة؛ وهمّتك سقف إنجازك، ووطنك ينتظر عطاءك الكبير.»"
  };
  const cardShowcaseFooterHTML = (val, extraCtaAttrs = "") => `
      <div class="vcard-footer" ${extraCtaAttrs}${extraCtaAttrs ? ` role="button" tabindex="-1" aria-label="عرض قيمة ${escapeHTML(val.name)}"` : ""}>
        <span class="vcard-tap-hint">اضغط للعرض</span>
      </div>
    `;
  window.normalizeArabic = (input) => String(input || "").normalize("NFKD").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim().toLowerCase();
  const VIEW_MAP = {
    // The intro is the top of the home page ('all'); other views hide it.
    home: "#intro-section",
    orbit: "#hero-section",
    stories: "#examples-section",
    encyclopedia: "#encyclopedia-section",
    comparison: "#comparison-section"
  };
  const AppRouter = window.AppRouter = {
    views: VIEW_MAP,
    switchView(view = "all", shouldScroll = true) {
      const targetView = view === "all" || Object.prototype.hasOwnProperty.call(VIEW_MAP, view) ? view : "all";
      state.activeView = targetView;
      document.body.dataset.activeView = targetView;
      Object.entries(VIEW_MAP).forEach(([key, selector]) => {
        const el = document.querySelector(selector);
        if (!el) return;
        const visible = targetView === "all" || targetView === key;
        el.classList.toggle("spa-hidden", !visible);
        el.inert = !visible;
        if (visible) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", "true");
      });
      $$(".spa-nav-btn[data-view]").forEach((btn) => {
        const isActive = btn.dataset.view === targetView;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", String(isActive));
        if (isActive) btn.setAttribute("aria-current", "page");
        else btn.removeAttribute("aria-current");
      });
      if (window.history && window.history.replaceState) {
        const nextHash = targetView === "all" ? window.location.pathname : `#${targetView}`;
        window.history.replaceState(null, "", nextHash);
      }
      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }
  };
  window.switchView = (view) => AppRouter.switchView(view, true);
  document.body.classList.remove("projector-day");
  try {
    localStorage.removeItem("al_ilm_projector_day");
  } catch (_) {
  }
  const PHYSICS_CFG = {
    stiffness: 195,
    damping: 24,
    spacing: 315,
    snapThreshold: 12e-4
  };
  const OrbitPhysics = window.OrbitPhysics = {
    cards: [],
    position: 0,
    target: 0,
    velocity: 0,
    rafId: 0,
    lastFrameTime: 0,
    pointer: null,
    samples: [],
    stage: null,
    wrapper: null,
    lastRenderedNearest: -1,
    cardWidth: 0,
    init() {
      this.stage = $("stage3D");
      this.wrapper = $("cardsWrapper");
      if (!this.stage || !this.wrapper) return;
      this.buildDeck(state.activeGroup);
      this.bindEvents();
    },
    getCardWidth() {
      if (!this.cardWidth && this.cards.length) {
        this.cardWidth = this.cards[0].element.offsetWidth || 0;
      }
      return this.cardWidth;
    },
    getSpacing() {
      const w = window.innerWidth;
      const base = w < 640 ? 215 : w < 1024 ? 260 : 295;
      const cw = this.getCardWidth();
      if (!cw) return base;
      const floorAtRest = (0.9157 * cw - 28) / 0.955;
      const floorMidSwipe = (0.4657 * cw - 14) / 0.48875;
      return Math.max(base, Math.ceil(Math.max(floorAtRest, floorMidSwipe)) + 8);
    },
    buildDeck(group = "all") {
      state.activeGroup = group;
      const list = group === "all" ? VALUES : VALUES.filter((v) => String(v.group).toUpperCase() === String(group).toUpperCase());
      state.orbitList = list;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      ["A", "B", "all"].forEach((g) => {
        const btn = $(`tab-${g}`);
        if (!btn) return;
        const active = g === group;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      this.wrapper.replaceChildren();
      const frag = document.createDocumentFragment();
      this.cards = list.map((val, idx) => {
        const card = document.createElement("article");
        card.className = "value-card-3d";
        card.dataset.valueId = val.id;
        card.dataset.index = String(idx);
        card.style.setProperty("--card-accent", val.accent || "#D4AF37");
        card.style.setProperty("--card-surface", val.surface || "");
        card.style.setProperty("--spot-color", `${val.accent || "#D4AF37"}2B`);
        card.setAttribute("role", "group");
        card.setAttribute("aria-label", `${val.name} — ${val.sub}`);
        if (EXHIBITION.isExhibitionValue(val.id)) card.classList.add("is-expo-value");
        const subText = HERO_CARD_SUBS[val.id] || val.sub;
        const quoteText = HERO_CARD_QUOTES[val.id] || `«${val.text}»`;
        card.innerHTML = `
          <div class="vcard-glare" aria-hidden="true"></div>

          <div class="vcard-header">
            <div class="vcard-icon-box" style="color:${escapeHTML(val.accent)}; border-color:${escapeHTML(val.accent)}45; background:${escapeHTML(val.accent)}18;">
              ${getIconSVG(val.id)}
            </div>
          </div>

          <div class="vcard-body">
            <h3 class="vcard-title">${escapeHTML(val.name)}</h3>
            <p class="vcard-sub" style="color:${escapeHTML(val.accent)}">${escapeHTML(subText)}</p>
            <p class="vcard-quote">${escapeHTML(quoteText)}</p>
          </div>

          ${cardShowcaseFooterHTML(val, `data-open-studio="${escapeHTML(val.id)}"`)}
        `;
        const ctaBtn = card.querySelector("[data-open-studio]");
        if (ctaBtn) {
          ctaBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!state.isSpinning) window.openStudio(val.id);
          });
          ctaBtn.addEventListener("keydown", (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            ctaBtn.click();
          });
        }
        frag.appendChild(card);
        return { element: card, value: val, index: idx };
      });
      this.wrapper.appendChild(frag);
      this.renderPanoramicGrid(list);
      this.position = 0;
      this.target = 0;
      this.velocity = 0;
      this.lastRenderedNearest = -1;
      this.ambientIndex = -1;
      this.cardWidth = 0;
      this.buildDots();
      this.updateTransforms(false);
      if (typeof window.scanSpotlightSurfaces === "function") {
        window.scanSpotlightSurfaces();
      }
    },
    renderPanoramicGrid(list) {
      const gridEl = $("allValuesGridStage");
      if (!gridEl) return;
      gridEl.innerHTML = list.map((val, idx) => {
        const expoCls = EXHIBITION.isExhibitionValue(val.id) ? " is-expo-value" : "";
        const subText = HERO_CARD_SUBS[val.id] || val.sub;
        const quoteText = HERO_CARD_QUOTES[val.id] || `«${val.text}»`;
        return `
            <article class="value-grid-card spotlight-surface${expoCls}" data-grid-idx="${idx}" data-grid-id="${escapeHTML(val.id)}" role="button" tabindex="0" aria-label="عرض قيمة ${escapeHTML(val.name)}" style="--card-accent:${escapeHTML(val.accent)}; --card-surface:${escapeHTML(val.surface)}; --spot-color:${escapeHTML(val.accent)}28;">
              <div class="vcard-header">
                <div class="vcard-icon-box" style="color:${escapeHTML(val.accent)}; border-color:${escapeHTML(val.accent)}45; background:${escapeHTML(val.accent)}18;">
                  ${getIconSVG(val.id)}
                </div>
              </div>
              <div class="vcard-body">
                <h3 class="vcard-title" style="font-size:1.65rem;">${escapeHTML(val.name)}</h3>
                <p class="vcard-sub" style="color:${escapeHTML(val.accent)}">${escapeHTML(subText)}</p>
                <p class="vcard-quote">${escapeHTML(quoteText)}</p>
              </div>
              ${cardShowcaseFooterHTML(val)}
            </article>
          `;
      }).join("");
      gridEl.onclick = (e) => {
        if (state.isSpinning) return;
        const card = e.target.closest("[data-grid-id]");
        if (card) window.openStudio(card.dataset.gridId);
      };
      gridEl.onkeydown = (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const card = e.target.closest("[data-grid-id]");
        if (!card || state.isSpinning) return;
        e.preventDefault();
        window.openStudio(card.dataset.gridId);
      };
    },
    wrapIndex(idx) {
      const len = this.cards.length;
      if (!len) return 0;
      return (idx % len + len) % len;
    },
    shortestDelta(from, to) {
      const len = this.cards.length;
      if (!len) return 0;
      let diff = (to - from) % len;
      if (diff > len / 2) diff -= len;
      if (diff < -len / 2) diff += len;
      return diff;
    },
    setTarget(nextTarget, initialVelocity = null) {
      if (!this.cards.length) return;
      const wrappedIndex = this.wrapIndex(Math.round(nextTarget));
      const delta = this.shortestDelta(this.position, wrappedIndex);
      this.target = this.position + delta;
      if (initialVelocity !== null) {
        this.velocity = initialVelocity;
      }
      this.wakeSpring();
    },
    wakeSpring() {
      var _a2;
      if (this.rafId) return;
      (_a2 = window.PerfTier) == null ? void 0 : _a2.watch(900);
      this.lastFrameTime = performance.now();
      this.rafId = requestAnimationFrame((now) => this.tick(now));
    },
    tick(now) {
      this.rafId = 0;
      if (!this.cards.length || this.pointer) return;
      const rawDt = (now - (this.lastFrameTime || now)) / 1e3;
      this.lastFrameTime = now;
      const dt = Math.min(Math.max(rawDt, 4e-3), 0.032);
      const displacement = this.target - this.position;
      const springForce = displacement * PHYSICS_CFG.stiffness;
      const dampingForce = -this.velocity * PHYSICS_CFG.damping;
      const accel = springForce + dampingForce;
      this.velocity += accel * dt;
      this.position += this.velocity * dt;
      const settled = Math.abs(displacement) < PHYSICS_CFG.snapThreshold && Math.abs(this.velocity) < PHYSICS_CFG.snapThreshold;
      if (settled) {
        this.position = this.wrapIndex(Math.round(this.target));
        this.target = this.position;
        this.velocity = 0;
        this.updateTransforms(false);
        return;
      }
      this.updateTransforms(true);
      this.rafId = requestAnimationFrame((t) => this.tick(t));
    },
    // Continuous Gaussian depth curve: ONE smooth pose function for every
    // fractional orbit position (no `i === nearest` branch), so depth, scale and
    // rotation never jump when the centre card changes mid-swipe.
    poseFor(rel, spacing) {
      const absRel = Math.abs(rel);
      const focusBell = Math.exp(-absRel * absRel * 2.2);
      const sidePush = Math.sign(rel) * Math.min(absRel, 1.15) * 28;
      return {
        absRel,
        focusBell,
        x: rel * spacing * (1 - absRel * 0.045) + sidePush,
        y: (1 - focusBell) * 14 + Math.min(absRel * 4, 18),
        z: focusBell * 95 - absRel * 115,
        rotY: Math.max(-36, Math.min(36, -rel * 21)),
        scale: Math.max(0.72, 0.88 + focusBell * 0.16 - absRel * 0.05)
      };
    },
    composeTransform(pose) {
      return `translate3d(calc(-50% + ${pose.x.toFixed(2)}px), calc(-50% + ${pose.y.toFixed(2)}px), ${pose.z.toFixed(1)}px) rotateY(${pose.rotY.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`;
    },
    updateTransforms(isMoving = false) {
      var _a2, _b, _c, _d;
      const len = this.cards.length;
      if (!len) return;
      const spacing = this.getSpacing();
      const nearest = this.wrapIndex(Math.round(this.position));
      state.activeOrbitIndex = nearest;
      const perf = ((_a2 = window.PerfTier) == null ? void 0 : _a2.level) || "high";
      const maxVisibleDist = perf === "low" ? 1.75 : perf === "medium" ? len <= 6 ? 2.4 : 2.6 : len <= 6 ? 2.95 : 3.6;
      const depthBlur = perf === "high";
      const minBrightness = 0.58;
      for (let i = 0; i < len; i++) {
        const cardObj = this.cards[i];
        const el = cardObj.element;
        const s = cardObj.applied || (cardObj.applied = {});
        const rel = this.shortestDelta(this.position, i);
        const absRel = Math.abs(rel);
        if (absRel > maxVisibleDist) {
          if (s.offstage !== true) {
            s.offstage = true;
            el.classList.add("is-offstage");
            el.classList.remove("is-center", "is-prev", "is-next", "is-moving");
            el.style.opacity = "0";
            el.style.filter = "none";
            el.setAttribute("aria-hidden", "true");
            el.inert = true;
            s.center = s.prev = s.next = s.moving = false;
            s.opacity = s.filter = null;
          }
          continue;
        }
        if (s.offstage !== false) {
          s.offstage = false;
          el.classList.remove("is-offstage");
          el.removeAttribute("aria-hidden");
          el.inert = false;
        }
        const pose = this.poseFor(rel, spacing);
        const inFocus = absRel < 0.35;
        const sideDepth = Math.max(0, absRel - 0.35);
        const edgeFade = Math.min(1, Math.max(0, (maxVisibleDist - absRel) / 0.6));
        const opacity = (inFocus ? 1 : Math.max(0.45, 1 - sideDepth * 0.12)) * edgeFade;
        const brightness = inFocus ? 1 : Math.max(minBrightness, 1 - sideDepth * 0.2);
        const blurPx = Math.min(4.5, (absRel - 0.25) * 1.85);
        const useFilter = depthBlur && !inFocus && !isMoving;
        const filter = useFilter ? `blur(${blurPx.toFixed(1)}px) brightness(${brightness.toFixed(2)})` : "none";
        const shownOpacity = !useFilter && !inFocus ? opacity * brightness : opacity;
        const opacityText = shownOpacity >= 0.999 ? "1" : shownOpacity.toFixed(3);
        const zIndex = 500 - Math.round(absRel * 100);
        el.style.transform = this.composeTransform(pose);
        if (s.opacity !== opacityText) el.style.opacity = s.opacity = opacityText;
        if (s.filter !== filter) el.style.filter = s.filter = filter;
        if (s.z !== zIndex) el.style.zIndex = String(s.z = zIndex);
        if (s.moving !== isMoving) el.classList.toggle("is-moving", s.moving = isMoving);
        if (state.isSpinning && isMoving) continue;
        const isCenter = i === nearest;
        const isPrev = i === this.wrapIndex(nearest - 1);
        const isNext = i === this.wrapIndex(nearest + 1);
        if (s.center !== isCenter) {
          el.classList.toggle("is-center", s.center = isCenter);
          const cta = s.cta || (s.cta = el.querySelector("[data-open-studio]"));
          if (cta) {
            if (!isCenter && document.activeElement === cta) this.focusNewCentre = true;
            cta.tabIndex = isCenter ? 0 : -1;
          }
        }
        if (s.prev !== isPrev) el.classList.toggle("is-prev", s.prev = isPrev);
        if (s.next !== isNext) el.classList.toggle("is-next", s.next = isNext);
      }
      if (this.focusNewCentre) {
        this.focusNewCentre = false;
        (_c = (_b = this.cards[nearest]) == null ? void 0 : _b.element.querySelector("[data-open-studio]")) == null ? void 0 : _c.focus({ preventScroll: true });
      }
      if (nearest !== this.lastRenderedNearest && !(state.isSpinning && isMoving)) {
        this.lastRenderedNearest = nearest;
        this.syncDots(nearest);
      }
      if (!isMoving && nearest !== this.ambientIndex) {
        this.ambientIndex = nearest;
        const activeVal = (_d = this.cards[nearest]) == null ? void 0 : _d.value;
        const ambient = $("topAmbient");
        if (ambient && activeVal) ambient.style.background = activeVal.accent || "#10B981";
      }
    },
    buildDots() {
      const bar = $("dotsBar");
      if (!bar) return;
      bar.replaceChildren();
      const frag = document.createDocumentFragment();
      this.cards.forEach((c, idx) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "orbit-dot";
        dot.style.setProperty("--dot-accent", c.value.accent || "#D4AF37");
        dot.setAttribute("aria-label", `انتقل إلى قيمة ${c.value.name}`);
        dot.addEventListener("click", () => {
          if (!state.isSpinning) this.setTarget(idx, 0);
        });
        frag.appendChild(dot);
      });
      bar.appendChild(frag);
      this.syncDots(0);
    },
    syncDots(activeIndex) {
      const bar = $("dotsBar");
      if (!bar) return;
      Array.from(bar.children).forEach((dot, idx) => {
        const active = idx === activeIndex;
        dot.classList.toggle("active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
      });
    },
    bindEvents() {
      this.stage.addEventListener("pointerdown", (e) => this.onPointerDown(e));
      this.stage.addEventListener("pointermove", (e) => this.onPointerMove(e));
      this.stage.addEventListener("pointerup", (e) => this.onPointerUp(e));
      this.stage.addEventListener("pointercancel", (e) => this.onPointerUp(e));
      this.stage.addEventListener(
        "wheel",
        (e) => {
          if (state.isSpinning) return;
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 8) {
            e.preventDefault();
            this.setTarget(Math.round(this.target) + (e.deltaX > 0 ? 1 : -1));
          }
        },
        { passive: false }
      );
      window.addEventListener(
        "resize",
        () => {
          this.cardWidth = 0;
          this.updateTransforms(false);
        },
        { passive: true }
      );
      document.addEventListener("keydown", (e) => {
        if (state.isSpinning || document.body.classList.contains("modal-open")) return;
        if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.step(1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          this.step(-1);
        }
      });
    },
    onPointerDown(e) {
      if (state.isSpinning) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest("[data-open-studio]")) return;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      this.pointer = {
        id: e.pointerId,
        startX: e.clientX,
        startPos: this.position,
        totalDx: 0,
        tappedCard: e.target.closest(".value-card-3d")
      };
      this.samples = [[e.clientX, performance.now()]];
      this.velocity = 0;
      this.stage.classList.add("is-dragging");
      try {
        this.stage.setPointerCapture(e.pointerId);
      } catch (_) {
      }
    },
    onPointerMove(e) {
      if (!this.pointer || e.pointerId !== this.pointer.id) return;
      const dx = e.clientX - this.pointer.startX;
      this.pointer.totalDx = dx;
      const spacing = this.getSpacing();
      this.position = this.pointer.startPos - dx / spacing;
      const now = performance.now();
      this.samples.push([e.clientX, now]);
      if (this.samples.length > 5) this.samples.shift();
      this.updateTransforms(true);
    },
    onPointerUp(e) {
      var _a2;
      if (!this.pointer || e.pointerId !== this.pointer.id) return;
      const p = this.pointer;
      this.pointer = null;
      this.stage.classList.remove("is-dragging");
      try {
        if (this.stage.hasPointerCapture(e.pointerId)) {
          this.stage.releasePointerCapture(e.pointerId);
        }
      } catch (_) {
      }
      if (Math.abs(p.totalDx) < 8) {
        if (p.tappedCard) {
          const idx = Number(p.tappedCard.dataset.index);
          const centerIdx = this.wrapIndex(Math.round(this.position));
          if (Number.isFinite(idx)) {
            if (idx === centerIdx) {
              const val = (_a2 = this.cards[idx]) == null ? void 0 : _a2.value;
              if (val) window.openStudio(val.id);
              this.setTarget(centerIdx, 0);
              return;
            } else {
              this.setTarget(idx, 0);
              return;
            }
          }
        }
        this.setTarget(Math.round(this.position), 0);
        return;
      }
      let releaseVelCardsPerSec = 0;
      if (this.samples.length >= 2) {
        const [x0, t0] = this.samples[0];
        const [x1, t1] = this.samples[this.samples.length - 1];
        const dtMs = Math.max(8, t1 - t0);
        const pxPerSec = (x1 - x0) / dtMs * 1e3;
        releaseVelCardsPerSec = -pxPerSec / this.getSpacing();
      }
      const projectedOffset = Math.max(-3.2, Math.min(3.2, releaseVelCardsPerSec * 0.22));
      const rawTarget = Math.round(this.position + projectedOffset);
      this.target = rawTarget;
      this.velocity = releaseVelCardsPerSec * 0.55;
      this.wakeSpring();
    },
    step(dir) {
      if (!this.cards.length || state.isSpinning) return;
      this.target = Math.round(this.target) + Math.sign(dir);
      this.wakeSpring();
    },
    spinToRandom(duration = 2600, onTickCard = null, onComplete = null) {
      var _a2;
      const len = this.cards.length;
      if (!len) return;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      const startPos = this.position;
      const currentIdx = this.wrapIndex(Math.round(startPos));
      const candidates = this.cards.map((_, i) => i).filter((i) => i !== currentIdx);
      const chosenIdx = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : currentIdx;
      const extraRevolutions = 2 * len;
      const forwardDelta = ((chosenIdx - currentIdx) % len + len) % len;
      const totalTravel = extraRevolutions + forwardDelta;
      const endPos = Math.round(startPos) + totalTravel;
      const startTime = performance.now();
      let lastWholeCard = Math.floor(startPos);
      (_a2 = window.PerfTier) == null ? void 0 : _a2.watch(duration);
      const frame = (now) => {
        var _a3;
        const t = Math.min(1, (now - startTime) / duration);
        const eased = spinEase(t);
        this.position = startPos + (endPos - startPos) * eased;
        const currentWhole = Math.floor(this.position);
        if (currentWhole !== lastWholeCard) {
          lastWholeCard = currentWhole;
          if (onTickCard) onTickCard(t);
        }
        this.updateTransforms(t < 1);
        if (t < 1) {
          this.rafId = requestAnimationFrame(frame);
        } else {
          this.rafId = 0;
          this.position = chosenIdx;
          this.target = chosenIdx;
          this.velocity = 0;
          this.updateTransforms(false);
          if (onComplete) onComplete((_a3 = this.cards[chosenIdx]) == null ? void 0 : _a3.value);
        }
      };
      this.rafId = requestAnimationFrame(frame);
    }
  };
  function spinEase(t) {
    const x1 = 0.32, y1 = 0, x2 = 0.12, y2 = 1;
    const bez = (a, b, s2) => 3 * a * s2 * (1 - s2) * (1 - s2) + 3 * b * s2 * s2 * (1 - s2) + s2 * s2 * s2;
    const dBez = (a, b, s2) => 3 * a * (1 - s2) * (1 - s2) + 6 * (b - a) * s2 * (1 - s2) + 3 * (1 - b) * s2 * s2;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const dx = bez(x1, x2, s) - t;
      const d = dBez(x1, x2, s);
      if (Math.abs(dx) < 1e-5 || !d) break;
      s = Math.min(1, Math.max(0, s - dx / d));
    }
    return bez(y1, y2, s);
  }
  window.switchGroup = (grp) => OrbitPhysics.buildDeck(grp);
  window.stepCard = (dir) => OrbitPhysics.step(dir);
  window.addEventListener("perfchange", () => {
    if (!OrbitPhysics.rafId && !state.isSpinning) OrbitPhysics.updateTransforms(false);
  });
  const SpinSynthesizer = {
    ctx: null,
    ensure() {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) this.ctx = new Ctx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
      return this.ctx;
    },
    playTick(progress) {
      const ctx = this.ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(340 + progress * 540, t);
      gain.gain.setValueAtTime(1e-4, t);
      gain.gain.exponentialRampToValueAtTime(0.04, t + 4e-3);
      gain.gain.exponentialRampToValueAtTime(1e-4, t + 0.038);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.042);
    },
    playGoldResolve() {
      const ctx = this.ensure();
      if (!ctx) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + idx * 0.045;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(1e-4, t);
        gain.gain.exponentialRampToValueAtTime(0.045, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(1e-4, t + 0.52);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    }
  };
  window.setHeroLayout = (mode = "orbit") => {
    var _a2, _b, _c, _d, _e;
    state.heroLayout = mode === "grid" ? "grid" : "orbit";
    const isGrid = state.heroLayout === "grid";
    (_a2 = $("stage3D")) == null ? void 0 : _a2.classList.toggle("hidden", isGrid);
    (_b = $("allValuesGridStage")) == null ? void 0 : _b.classList.toggle("hidden", !isGrid);
    (_c = document.querySelector(".orbit-nav-cluster")) == null ? void 0 : _c.classList.toggle("hidden", isGrid);
    (_d = $("layout-orbit")) == null ? void 0 : _d.classList.toggle("active", !isGrid);
    (_e = $("layout-grid")) == null ? void 0 : _e.classList.toggle("active", isGrid);
  };
  window.triggerWheelSpin = () => {
    if (state.isSpinning || !OrbitPhysics.cards.length) return;
    state.isSpinning = true;
    const btn = $("spinBtn");
    const spinText = $("spinText");
    const stage = $("stage3D");
    const originalLabel = spinText ? spinText.textContent : "";
    btn == null ? void 0 : btn.classList.add("is-spinning", "busy");
    btn == null ? void 0 : btn.setAttribute("aria-busy", "true");
    stage == null ? void 0 : stage.classList.add("is-spinning");
    if (spinText) spinText.textContent = "جارٍ اختيار القيمة التربوية...";
    if (state.heroLayout === "grid") {
      const gridCards = $$("#allValuesGridStage .value-grid-card");
      const total = gridCards.length;
      if (!total) {
        state.isSpinning = false;
        return;
      }
      const chosenIdx = Math.floor(Math.random() * total);
      const totalSteps = total * 3 + chosenIdx;
      const duration = 2200;
      const start = performance.now();
      let lastStep = -1;
      const tickGrid = (now) => {
        var _a2;
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3.5);
        const stepIdx = Math.round(eased * totalSteps);
        if (stepIdx !== lastStep) {
          lastStep = stepIdx;
          const activeCardIdx = stepIdx % total;
          gridCards.forEach((c, idx) => c.classList.toggle("spin-roulette-active", idx === activeCardIdx));
          SpinSynthesizer.playTick(t);
        }
        if (t < 1) {
          requestAnimationFrame(tickGrid);
        } else {
          SpinSynthesizer.playGoldResolve();
          state.isSpinning = false;
          btn == null ? void 0 : btn.classList.remove("is-spinning", "busy");
          btn == null ? void 0 : btn.removeAttribute("aria-busy");
          const chosenVal = (_a2 = OrbitPhysics.cards[chosenIdx]) == null ? void 0 : _a2.value;
          if (spinText) {
            spinText.textContent = chosenVal ? `تم اختيار: ${chosenVal.name} — تفتح الآن...` : originalLabel;
          }
          window.setTimeout(() => {
            gridCards.forEach((c) => c.classList.remove("spin-roulette-active"));
            if (spinText) spinText.textContent = originalLabel || "تدوير عشوائي وفتح القيمة (SPIN)";
            if (chosenVal) window.openStudio(chosenVal.id);
          }, 420);
        }
      };
      requestAnimationFrame(tickGrid);
      return;
    }
    OrbitPhysics.spinToRandom(
      3200,
      (progress) => SpinSynthesizer.playTick(progress),
      (chosenVal) => {
        SpinSynthesizer.playGoldResolve();
        state.isSpinning = false;
        btn == null ? void 0 : btn.classList.remove("is-spinning", "busy");
        btn == null ? void 0 : btn.removeAttribute("aria-busy");
        stage == null ? void 0 : stage.classList.remove("is-spinning");
        if (spinText) {
          spinText.textContent = chosenVal ? `تم اختيار: ${chosenVal.name} — تفتح الآن...` : originalLabel;
        }
        window.setTimeout(() => {
          if (spinText) spinText.textContent = originalLabel || "تدوير عشوائي وفتح القيمة (SPIN)";
          if (chosenVal) window.openStudio(chosenVal.id);
        }, 380);
      }
    );
  };
  window.initSpotlightShader = () => {
    let rafId = 0;
    let pending = null;
    const flush = () => {
      rafId = 0;
      if (!pending) return;
      const { el, clientX, clientY } = pending;
      pending = null;
      const rect = el.__cachedSpotRect;
      if (!rect || !rect.width || !rect.height) return;
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      el.style.setProperty("--spot-x", `${localX.toFixed(1)}px`);
      el.style.setProperty("--spot-y", `${localY.toFixed(1)}px`);
      el.classList.add("is-spotlit");
    };
    const bindSurface = (el) => {
      if (el.__spotBound) return;
      el.__spotBound = true;
      const cacheRect = () => {
        el.__cachedSpotRect = el.getBoundingClientRect();
      };
      el.addEventListener(
        "pointerenter",
        (e) => {
          cacheRect();
          pending = { el, clientX: e.clientX, clientY: e.clientY };
          if (!rafId) rafId = requestAnimationFrame(flush);
        },
        { passive: true }
      );
      el.addEventListener(
        "pointerdown",
        (e) => {
          cacheRect();
          pending = { el, clientX: e.clientX, clientY: e.clientY };
          if (!rafId) rafId = requestAnimationFrame(flush);
        },
        { passive: true }
      );
      el.addEventListener(
        "pointermove",
        (e) => {
          if (!el.__cachedSpotRect) cacheRect();
          pending = { el, clientX: e.clientX, clientY: e.clientY };
          if (!rafId) rafId = requestAnimationFrame(flush);
        },
        { passive: true }
      );
      const clearSpot = () => el.classList.remove("is-spotlit");
      el.addEventListener("pointerleave", clearSpot, { passive: true });
      el.addEventListener("pointercancel", clearSpot, { passive: true });
    };
    window.scanSpotlightSurfaces = () => {
      $$(".spotlight-surface, .surface-card, .story-card, .comparison-card").forEach(bindSurface);
    };
    window.scanSpotlightSurfaces();
    const invalidateRects = () => {
      $$(".is-spotlit").forEach((el) => {
        el.__cachedSpotRect = null;
        el.classList.remove("is-spotlit");
      });
    };
    window.addEventListener("scroll", invalidateRects, { passive: true });
    window.addEventListener("resize", invalidateRects, { passive: true });
  };
  const SearchAndFilter = window.SearchAndFilter = {
    init() {
      const input = $("globalSearchInput");
      const clearBtn = $("clearSearchBtn");
      if (input) {
        input.addEventListener("input", () => {
          state.searchQuery = input.value || "";
          if (clearBtn) clearBtn.classList.toggle("hidden", !state.searchQuery.trim());
          if (state.searchQuery.trim() && state.activeView === "orbit") {
            AppRouter.switchView("all", false);
          }
          this.renderStories();
          this.renderComparisonGrid();
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          if (input) input.value = "";
          state.searchQuery = "";
          clearBtn.classList.add("hidden");
          this.renderStories();
          this.renderComparisonGrid();
        });
      }
      this.renderStoryFilters();
      this.renderStories();
      this.renderEncyclopediaSelector();
      this.showEncyclopediaValue(state.activeEncycId);
      this.renderComparisonGrid();
    },
    renderStoryFilters() {
      const valBar = $("examplesFilterBar");
      if (valBar) {
        const items = [
          { id: "all", label: `جميع القيم (${ALL_STORIES.length} قصة)` },
          ...VALUES.map((v) => ({ id: v.id, label: v.name }))
        ];
        valBar.innerHTML = items.map(
          (it) => `<button type="button" class="filter-pill${state.storyValueFilter === it.id ? " active" : ""}" data-story-val="${escapeHTML(it.id)}" aria-pressed="${state.storyValueFilter === it.id}">${escapeHTML(it.label)}</button>`
        ).join("");
        valBar.onclick = (e) => {
          const btn = e.target.closest("[data-story-val]");
          if (!btn) return;
          state.storyValueFilter = btn.dataset.storyVal;
          $$("[data-story-val]", valBar).forEach((b) => {
            const act = b === btn;
            b.classList.toggle("active", act);
            b.setAttribute("aria-pressed", String(act));
          });
          this.renderStories();
        };
      }
    },
    renderStories() {
      const grid = $("examplesCardsGrid");
      if (!grid) return;
      const q = window.normalizeArabic(state.searchQuery);
      const filtered = ALL_STORIES.filter((s) => {
        const valOk = state.storyValueFilter === "all" || s.valueId === state.storyValueFilter;
        const catOk = state.storyCategoryFilter === "all" || s.category === state.storyCategoryFilter;
        if (!valOk || !catOk) return false;
        if (!q) return true;
        const hay = window.normalizeArabic(`${s.valueName} ${s.typeLabel} ${s.title} ${s.story}`);
        return hay.includes(q);
      });
      const statsBadge = $("searchStatsBadge");
      if (statsBadge) {
        statsBadge.textContent = q ? `${filtered.length} قصة مطابقة` : `${filtered.length} قصة معروضة`;
      }
      if (!filtered.length) {
        grid.innerHTML = `
          <div class="surface-card col-span-full text-center py-10">
            <p class="text-lg font-bold mb-2">لا توجد قصص مطابقة لعبارة البحث الحالية</p>
            <p class="text-sm text-muted">جرّب البحث بكلمة أخرى مثل: التسامح، آيسف، الاختبار، نيوم، الأمانة.</p>
          </div>
        `;
        return;
      }
      grid.innerHTML = filtered.map(
        (s) => `
          <article class="story-card spotlight-surface" data-ra="${escapeHTML(s.id.replace("_story_", "-s"))}" style="--spot-color:${escapeHTML(s.valueAccent)}26; border-top-color:${escapeHTML(s.valueAccent)}66;">
            <div class="story-meta justify-between">
              <span class="story-val-chip" style="color:${escapeHTML(s.valueAccent)}; background:${escapeHTML(s.valueAccent)}16; border:1px solid ${escapeHTML(s.valueAccent)}40;">
                <span class="story-chip-icon">${getIconSVG(s.valueId)}</span>
                <span>${escapeHTML(s.valueName)}</span>
              </span>
              <span class="story-cat-chip">${escapeHTML(s.typeLabel)}</span>
            </div>
            <h3 class="story-heading" data-ra-f="0">${escapeHTML(s.title)}</h3>
            <p class="story-body" data-ra-f="1">${escapeHTML(s.story)}</p>
            <button type="button" class="story-action-btn" data-open-val="${escapeHTML(s.valueId)}" style="color:${escapeHTML(s.valueAccent)}">
              <span>فتح موسوعة وصوت «${escapeHTML(s.valueName)}»</span>
              <span aria-hidden="true">←</span>
            </button>
          </article>
        `
      ).join("");
      grid.onclick = (e) => {
        const btn = e.target.closest("[data-open-val]");
        if (btn) window.openStudio(btn.dataset.openVal);
      };
      if (typeof window.scanSpotlightSurfaces === "function") {
        window.scanSpotlightSurfaces();
      }
    },
    renderEncyclopediaSelector() {
      const sel = $("encycSelector");
      if (!sel) return;
      sel.innerHTML = VALUES.map(
        (v) => `<button type="button" class="filter-pill${v.id === state.activeEncycId ? " active" : ""}" data-encyc-id="${escapeHTML(v.id)}" aria-pressed="${v.id === state.activeEncycId}">${escapeHTML(v.num)} • ${escapeHTML(v.name)}</button>`
      ).join("");
      sel.onclick = (e) => {
        const btn = e.target.closest("[data-encyc-id]");
        if (!btn) return;
        this.showEncyclopediaValue(btn.dataset.encycId);
      };
    },
    showEncyclopediaValue(id) {
      const v = getValueById(id);
      if (!v) return;
      state.activeEncycId = v.id;
      $$("[data-encyc-id]").forEach((b) => {
        const act = b.dataset.encycId === v.id;
        b.classList.toggle("active", act);
        b.setAttribute("aria-pressed", String(act));
      });
      const mainCard = $("encycMainCard");
      if (mainCard) {
        mainCard.style.background = v.surface || "";
        mainCard.style.borderColor = `${v.accent}55`;
      }
      const iconBox = $("encycIconBox");
      if (iconBox) {
        iconBox.innerHTML = getIconSVG(v.id);
        iconBox.style.color = v.accent;
        iconBox.style.background = `${v.accent}1F`;
        iconBox.style.borderColor = `${v.accent}4D`;
      }
      const setTxt = (elId, val) => {
        const el = $(elId);
        if (el) el.textContent = val || "";
      };
      setTxt("encycBadge", `القيمة ${v.num} • ${v.group === "A" ? "قيمنا الأساسية" : "قيم التميز والريادة"}`);
      setTxt("encycTitle", v.name);
      setTxt("encycSubtitle", v.sub);
      setTxt("encycFullText", v.text);
      setTxt("encycEvidence", v.evidence);
      renderEvidenceSource("encycEvidence", v.id);
      ["p1", "p2", "p3"].forEach((k) => {
        const el = $(`encyc${k.toUpperCase()}`);
        if (!el) return;
        el.textContent = v[k] || "";
        el.dataset.raF = "0";
        el.dataset.ra = `${v.id}-${k}`;
      });
      const benList = $("encycBenefitsList");
      if (benList) {
        benList.innerHTML = (v.benefits || []).map((b, i) => {
          if (typeof b === "object" && b !== null) {
            return `
                <li class="encyc-item">
                  <div class="encyc-item-title" style="color:${escapeHTML(v.accent)}">✦ <span data-ra-f="${2 * i}">${escapeHTML(b.title)}</span></div>
                  <p class="encyc-item-desc" data-ra-f="${2 * i + 1}">${escapeHTML(b.desc)}</p>
                </li>
              `;
          }
          return `<li class="encyc-item"><p class="encyc-item-desc">✦ ${escapeHTML(b)}</p></li>`;
        }).join("");
        if (benList.parentElement) benList.parentElement.dataset.ra = `${v.id}-ben`;
      }
      const stepsList = $("encycStepsList");
      if (stepsList) {
        stepsList.innerHTML = (v.steps || []).map(
          (st, idx) => `
              <li class="encyc-step-row">
                <span class="encyc-step-num" style="background:${escapeHTML(v.accent)}22; color:${escapeHTML(v.accent)}; border:1px solid ${escapeHTML(v.accent)}45;">${idx + 1}</span>
                <span data-ra-f="${idx}">${escapeHTML(st)}</span>
              </li>
            `
        ).join("");
        if (stepsList.parentElement) stepsList.parentElement.dataset.ra = `${v.id}-steps`;
      }
    },
    renderComparisonGrid() {
      const grid = $("comparisonGrid");
      if (!grid) return;
      const q = window.normalizeArabic(state.searchQuery);
      const list = VALUES.filter((v) => {
        if (!q) return true;
        const hay = window.normalizeArabic(`${v.name} ${v.sub} ${v.withVal} ${v.withoutVal}`);
        return hay.includes(q);
      });
      grid.innerHTML = list.map(
        (v) => `
          <article class="comparison-card is-preferred spotlight-surface" data-ra="${escapeHTML(v.id)}-cmp" style="--spot-color:${escapeHTML(v.accent)}24; border-inline-start-color:${escapeHTML(v.accent)};">
            <div class="comp-header">
              <div class="comp-title-group">
                <span class="comp-icon" style="color:${escapeHTML(v.accent)}; background:${escapeHTML(v.accent)}16;">${getIconSVG(v.id)}</span>
                <div>
                  <h3 class="comp-name">${escapeHTML(v.name)}</h3>
                  <span class="comp-sub">${escapeHTML(v.sub)}</span>
                </div>
              </div>
              <div class="comp-actions">
                <span class="ra-slot" data-ra-btn></span>
                <button type="button" class="comp-open-btn" data-comp-open="${escapeHTML(v.id)}" style="color:${escapeHTML(v.accent)}">استمع للقيمة</button>
              </div>
            </div>

            <div class="comp-box comp-box-pos">
              <div class="comp-box-label">✓ عند تطبيق القيمة في حياتنا ومدرستنا</div>
              <p data-ra-f="0">${escapeHTML(v.withVal)}</p>
            </div>

            <div class="comp-box comp-box-neg">
              <div class="comp-box-label">✕ عند غياب القيمة أو إهمالها</div>
              <p data-ra-f="1">${escapeHTML(v.withoutVal)}</p>
            </div>
          </article>
        `
      ).join("");
      grid.onclick = (e) => {
        const btn = e.target.closest("[data-comp-open]");
        if (btn) window.openStudio(btn.dataset.compOpen);
      };
      if (typeof window.scanSpotlightSurfaces === "function") {
        window.scanSpotlightSurfaces();
      }
    }
  };
  window.openCurrentEncycAudio = () => {
    window.openStudio(state.activeEncycId);
  };
  const AudioStudio = window.AudioStudio = {
    diskAvailableIds: /* @__PURE__ */ new Set(),
    wordsIds: /* @__PURE__ */ new Set(),
    // recordings with audio/<id>.words.json (exact word times for the neon)
    currentValue: null,
    source: "silent",
    // 'file' | 'speech' | 'silent' (no file, no Arabic voice)
    status: "idle",
    // 'idle' | 'playing' | 'paused'
    isPlaying: false,
    _playSessionId: 0,
    _silentTimer: 0,
    _silentLeft: 0,
    _silentSince: 0,
    async init() {
      var _a2, _b;
      await this.checkDiskAudioManifest();
      (_b = (_a2 = window.speechSynthesis) == null ? void 0 : _a2.addEventListener) == null ? void 0 : _b.call(_a2, "voiceschanged", () => {
        if (this.currentValue && this.source === "silent" && this.status === "idle") {
          this.prepareAudio(this.currentValue);
        }
      });
      document.addEventListener("keydown", (e) => {
        var _a3;
        if (e.key === "Escape" && ((_a3 = $("studioModal")) == null ? void 0 : _a3.classList.contains("active"))) {
          this.closeStudio();
        }
      });
      const studioModal = $("studioModal");
      if (studioModal) {
        studioModal.addEventListener("click", (e) => {
          if (e.target === studioModal) this.closeStudio();
        });
      }
    },
    // Which values have an audio file? The list in audio/audio_manifest.json
    // (recording/process-recordings.ps1 keeps it up to date). Only without that
    // list is each audio/<id>.mp3 looked for — twelve requests, each a «not
    // found» on the console until the recordings exist.
    async checkDiskAudioManifest() {
      let listed = false;
      try {
        const res = await fetch("./audio/audio_manifest.json", { cache: "no-store" });
        if (res.ok && /json/.test(res.headers.get("content-type") || "")) {
          const data = await res.json();
          if (Array.isArray(data.available)) {
            data.available.forEach((id) => this.diskAvailableIds.add(String(id)));
            listed = true;
          }
          if (Array.isArray(data.words)) data.words.forEach((id) => this.wordsIds.add(String(id)));
        }
      } catch (_) {
      }
      if (listed) return;
      await Promise.all(
        VALUES.filter((v) => !this.diskAvailableIds.has(v.id)).map(async (v) => {
          try {
            const res = await fetch(v.file || `./audio/${v.id}.mp3`, { method: "HEAD", cache: "no-store" });
            const type = res.headers.get("content-type") || "";
            if (res.ok && /^audio\//i.test(type)) this.diskAvailableIds.add(v.id);
          } catch (_) {
          }
        })
      );
    },
    openStudio(id) {
      var _a2, _b, _c;
      const val = getValueById(id);
      if (!val) return;
      this.stopPlayback();
      (_a2 = window.QuranRecite) == null ? void 0 : _a2.stop();
      this.currentValue = val;
      state.currentStudioId = val.id;
      const setTxt = (elId, t) => {
        const el = $(elId);
        if (el) el.textContent = t || "";
      };
      setTxt("modalNum", val.num);
      setTxt("modalTitle", val.name);
      setTxt("modalTagline", val.sub);
      setTxt("modalEvidenceText", val.evidence);
      renderEvidenceSource("modalEvidenceText", val.id);
      setTxt("modalWithValue", val.withVal);
      setTxt("modalWithoutValue", val.withoutVal);
      const aura = $("modalAura");
      if (aura) aura.style.background = val.accent;
      const messageBox = $("modalMessageBox");
      if (messageBox) {
        messageBox.style.setProperty("--card-accent", val.accent);
        messageBox.style.borderColor = `${val.accent}55`;
      }
      const iconWrap = $("modalIconWrap");
      if (iconWrap) {
        iconWrap.innerHTML = getIconSVG(val.id);
        iconWrap.style.color = val.accent;
      }
      setTxt("editorialLyrics", val.text);
      const exGrid = $("modalExamplesGrid");
      if (exGrid) {
        exGrid.innerHTML = (val.examples || []).map(
          (ex, i) => `
            <article class="studio-story-card" data-ra="${escapeHTML(val.id)}-s${i + 1}">
              <span class="studio-story-type" style="color:${escapeHTML(val.accent)}">${escapeHTML(ex.type)}</span>
              <h4 class="studio-story-title" data-ra-f="0">${escapeHTML(ex.title)}</h4>
              <p class="studio-story-body" data-ra-f="1">${escapeHTML(ex.story)}</p>
            </article>
          `
        ).join("");
      }
      const benEl = $("modalBenefitsList");
      if (benEl) {
        benEl.innerHTML = (val.benefits || []).map(
          (b, i) => typeof b === "object" && b !== null ? `<li><strong style="color:${escapeHTML(val.accent)}">✦ <span data-ra-f="${2 * i}">${escapeHTML(b.title)}</span>:</strong> <span data-ra-f="${2 * i + 1}">${escapeHTML(b.desc)}</span></li>` : `<li>✦ ${escapeHTML(b)}</li>`
        ).join("");
        if (benEl.parentElement) benEl.parentElement.dataset.ra = `${val.id}-ben`;
      }
      const stepsEl = $("modalStepsList");
      if (stepsEl) {
        stepsEl.innerHTML = (val.steps || []).map((s, idx) => `<li><strong style="color:${escapeHTML(val.accent)}">${idx + 1}.</strong> <span data-ra-f="${idx}">${escapeHTML(s)}</span></li>`).join("");
        if (stepsEl.parentElement) stepsEl.parentElement.dataset.ra = `${val.id}-steps`;
      }
      const compBox = (_b = $("modalWithValue")) == null ? void 0 : _b.closest(".studio-story-card");
      if (compBox) compBox.dataset.ra = `${val.id}-cmp`;
      const modal = $("studioModal");
      if (modal) {
        (_c = window.PerfTier) == null ? void 0 : _c.watch(900);
        modal.classList.add("active");
        document.body.classList.add("modal-open");
      }
      this.prepareAudio(val);
    },
    closeStudio() {
      var _a2, _b, _c;
      this.stopPlayback();
      (_a2 = window.QuranRecite) == null ? void 0 : _a2.stop();
      (_b = $("studioModal")) == null ? void 0 : _b.classList.remove("active");
      if (!((_c = $("storyReaderModal")) == null ? void 0 : _c.classList.contains("active"))) {
        document.body.classList.remove("modal-open");
      }
    },
    navigateModal(dir) {
      if (!this.currentValue) return;
      const idx = VALUES.findIndex((v) => v.id === this.currentValue.id);
      const nextIdx = ((idx + Number(dir)) % VALUES.length + VALUES.length) % VALUES.length;
      this.openStudio(VALUES[nextIdx].id);
    },
    arabicVoice() {
      const synth = window.speechSynthesis;
      if (!synth || !window.SpeechSynthesisUtterance) return null;
      const voices = synth.getVoices() || [];
      return voices.find((v) => /^ar[-_]SA$/i.test(v.lang)) || voices.find((v) => /^ar(?:[-_]|$)/i.test(v.lang)) || null;
    },
    pickSource(val) {
      if (this.diskAvailableIds.has(val.id)) return "file";
      if (this.arabicVoice()) return "speech";
      return "silent";
    },
    prepareAudio(val) {
      this.stopPlayback();
      this.source = this.pickSource(val);
      this.showNote("");
    },
    showNote(text) {
      const note = $("audioNote");
      if (!note) return;
      note.textContent = text;
      note.hidden = !text;
    },
    toggleAudioPlayback() {
      if (this.status === "playing") this.pauseAudio();
      else if (this.status === "paused") this.resumeAudio();
      else this.playFromStart();
    },
    replayAudio() {
      this.playFromStart();
    },
    playFromStart() {
      const val = this.currentValue;
      if (!val) return;
      this.stopPlayback();
      if (this.source === "silent") this.source = this.pickSource(val);
      const session = this._playSessionId;
      const finished = () => {
        if (session === this._playSessionId) this.setStatus("idle");
      };
      MessageAlong.begin(val);
      if (this.source === "file") {
        const player = $("realAudioPlayer");
        if (!player) return;
        player.src = val.file || `./audio/${val.id}.mp3`;
        MessageAlong.useAudio(player, val);
        player.onended = finished;
        player.onerror = () => {
          if (session !== this._playSessionId) return;
          this.source = this.arabicVoice() ? "speech" : "silent";
          if (this.status === "playing") this.playFromStart();
          else this.setStatus("idle");
        };
        player.play().catch((err) => {
          if (session === this._playSessionId && (err == null ? void 0 : err.name) !== "AbortError") this.setStatus("idle");
        });
        this.setStatus("playing");
        return;
      }
      if (this.source === "speech") {
        const synth = window.speechSynthesis;
        const voice = this.arabicVoice();
        const utterance = new SpeechSynthesisUtterance(String(val.text || ""));
        utterance.voice = voice;
        utterance.lang = (voice == null ? void 0 : voice.lang) || "ar-SA";
        utterance.rate = 1;
        utterance.onend = finished;
        utterance.onerror = finished;
        MessageAlong.useChars(utterance, 2.3);
        synth.speak(utterance);
        this.setStatus("playing");
        return;
      }
      const words = String(val.text || "").split(/\s+/).filter(Boolean).length;
      this._silentLeft = Math.max(6e3, words * 450);
      this._silentDone = finished;
      this.showNote(`لا يوجد ملف صوتي لهذه القيمة بعد — أضِفه في مجلد audio باسم ${val.id}.mp3`);
      this.runSilent();
      this.setStatus("playing");
      MessageAlong.useClock(this._silentLeft / 1e3);
    },
    runSilent() {
      clearTimeout(this._silentTimer);
      this._silentSince = performance.now();
      this._silentTimer = setTimeout(() => {
        var _a2;
        return (_a2 = this._silentDone) == null ? void 0 : _a2.call(this);
      }, this._silentLeft);
    },
    pauseAudio() {
      var _a2, _b;
      if (this.source === "file") (_a2 = $("realAudioPlayer")) == null ? void 0 : _a2.pause();
      else if (this.source === "speech") (_b = window.speechSynthesis) == null ? void 0 : _b.pause();
      else {
        clearTimeout(this._silentTimer);
        this._silentLeft = Math.max(0, this._silentLeft - (performance.now() - this._silentSince));
      }
      MessageAlong.pause();
      this.setStatus("paused");
    },
    resumeAudio() {
      var _a2, _b;
      if (this.source === "file") (_a2 = $("realAudioPlayer")) == null ? void 0 : _a2.play().catch(() => {
      });
      else if (this.source === "speech") (_b = window.speechSynthesis) == null ? void 0 : _b.resume();
      else this.runSilent();
      this.setStatus("playing");
      MessageAlong.resume();
    },
    // «تشغيل» ⇄ «إيقاف»; «إعادة» appears beside it once the message has started.
    setStatus(status) {
      var _a2, _b, _c;
      this.status = status;
      this.isPlaying = status === "playing";
      if (this.isPlaying) (_a2 = window.QuranRecite) == null ? void 0 : _a2.pauseIfPlaying();
      (_b = $("studioAudioControls")) == null ? void 0 : _b.classList.toggle("is-playing", this.isPlaying);
      const label = $("playStateText");
      if (label) label.textContent = this.isPlaying ? "إيقاف" : "تشغيل";
      (_c = $("audioPlayBtn")) == null ? void 0 : _c.setAttribute("aria-label", this.isPlaying ? "إيقاف رسالة القيمة" : "تشغيل رسالة القيمة");
      const replay = $("audioReplayBtn");
      if (replay) replay.hidden = status === "idle";
      if (status === "idle") MessageAlong.stop();
    },
    stopPlayback() {
      this._playSessionId += 1;
      clearTimeout(this._silentTimer);
      const player = $("realAudioPlayer");
      if (player) {
        player.onended = null;
        player.onerror = null;
        player.pause();
      }
      const synth = window.speechSynthesis;
      if (synth) {
        if (synth.paused) synth.resume();
        if (synth.speaking || synth.pending) synth.cancel();
      }
      this.setStatus("idle");
    }
  };
  window.openStudio = (id) => AudioStudio.openStudio(id);
  window.closeStudio = () => AudioStudio.closeStudio();
  window.navigateModal = (dir) => AudioStudio.navigateModal(dir);
  window.toggleAudioPlayback = () => AudioStudio.toggleAudioPlayback();
  window.replayAudio = () => AudioStudio.replayAudio();
  window.bootAlIlmPlatform = async () => {
    OrbitPhysics.init();
    SearchAndFilter.init();
    window.initSpotlightShader();
    await AudioStudio.init();
    startHadithDecorator();
    const initialHash = (window.location.hash || "").replace("#", "").trim();
    if (initialHash && Object.prototype.hasOwnProperty.call(VIEW_MAP, initialHash)) {
      AppRouter.switchView(initialHash, false);
    } else {
      AppRouter.switchView("all", false);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.bootAlIlmPlatform, { once: true });
  } else {
    window.bootAlIlmPlatform();
  }
})();
