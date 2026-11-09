/*
 * ============================================================================
 * AL-ILM AL-NAFI INTERACTIVE ENGINE — Fable 5.1 (high) + Argon 4 (Max 1.00) QA
 * 60Hz Spatial Orbit Physics · SPA Router · Spotlight Illumination ·
 * Normalized Arabic Search · 36 Stories · Synced Audio Studio
 * ============================================================================
 */
(() => {
  'use strict';

  // Older TV / school-display browsers (Chrome < 86, Safari < 14) lack
  // replaceChildren(), which the site uses to redraw lists. Tiny stand-in.
  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function replaceChildren(...nodes) {
      while (this.firstChild) this.removeChild(this.firstChild);
      nodes.forEach((n) => this.append(n));
    };
  }

  const DATA = window.AL_ILM_DATA || {};
  const VALUES = Array.isArray(DATA.values) ? DATA.values : [];
  const ICONS = DATA.icons || {};

  // Flatten all 36 real-life stories from the 12 values
  const ALL_STORIES = VALUES.flatMap((val) =>
    (Array.isArray(val.examples) ? val.examples : []).map((ex, idx) => ({
      id: `${val.id}_story_${idx + 1}`,
      valueId: val.id,
      valueNum: val.num,
      valueName: val.name,
      valueAccent: val.accent,
      valueSurface: val.surface,
      category: ex.category || (idx === 0 ? 'heritage' : idx === 1 ? 'school' : 'vision'),
      typeLabel:
        ex.type ||
        (idx === 0
          ? 'من السيرة والتاريخ'
          : idx === 1
            ? 'من واقع ثانوية العلم النافع'
            : 'من الوطن ورؤية 2030'),
      title: ex.title || '',
      story: ex.story || ex.text || ''
    }))
  );

  const state = (window.AlIlmState = {
    activeView: 'all',
    heroLayout: 'orbit',
    activeGroup: 'all',
    orbitList: [],
    activeOrbitIndex: 0,
    isSpinning: false,
    searchQuery: '',
    storyValueFilter: 'all',
    storyCategoryFilter: 'all',
    activeEncycId: VALUES[0]?.id || 'tasamuh',
    currentStudioId: null
  });

  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const escapeHTML = (input) => {
    const div = document.createElement('div');
    div.textContent = input == null ? '' : String(input);
    return div.innerHTML;
  };

  const getValueById = (id) =>
    VALUES.find((v) => String(v.id) === String(id)) || VALUES[0] || null;

  const getIconSVG = (id) => ICONS[id] || '';

  // «المصدر» under each value's verse / hadith (value window + encyclopedia).
  // Verses open at the exact verse in the King Saud University e-Mushaf
  // (a government university; the King Fahd Complex's own e-Mushaf is still
  // "coming soon"). Hadiths open their own page in the Dorar hadith
  // encyclopedia, at the book and number cited, with the scholars' grading.
  // (The official Ifta hadith site, sunna.alifta.gov.sa, has the same hadiths
  // at the same numbers, but its pages took ~30 s or failed with 502 on first
  // open — too slow for visitors tapping on the iPad; its links are kept in
  // the committee's verification report.) Checked 8 Nov 2026.
  const KSU_AYA = (sura, aya) =>
    `https://quran.ksu.edu.sa/index.php?l=ar#aya=${sura}_${aya}&m=hafs&qaree=husary&trans=ar_mu`;
  const KSU = 'المصحف الإلكتروني بجامعة الملك سعود';
  const DORAR = 'الموسوعة الحديثية — الدرر السنية';
  // `recite`: Sheikh Yasser Al-Dosari reciting exactly the displayed words —
  // quoted/SSSAAA.mp3 is the quoted part of the verse, cut at the word
  // boundaries (At-Tawba 119 is shown whole: the whole verse), all at the
  // same loudness as the value messages (-16 LUFS).
  // How the clips were made and checked: audio/quran/dosari/README.txt.
  // `hadith`: the hadith read aloud (audio/hadith/<id>.mp3) — a generated voice
  // (Gemini TTS «Sadaltager»), never used for the Quran. See audio/hadith/README.txt.
  const EVIDENCE_SOURCES = {
    tasamuh: { url: KSU_AYA(24, 22), site: KSU, recite: 'quoted/024022' },
    watani: { url: 'https://dorar.net/h/rT3SDt3u', site: DORAR, hadith: 'e-watani' }, // جامع الترمذي 3926
    taawun: { url: KSU_AYA(5, 2), site: KSU, recite: 'quoted/005002' },
    azeema: { url: 'https://dorar.net/h/Ov16uqG0', site: DORAR, hadith: 'e-azeema' }, // صحيح مسلم 2664
    amana: { url: KSU_AYA(4, 58), site: KSU, recite: 'quoted/004058' },
    indibat: { url: KSU_AYA(4, 103), site: KSU, recite: 'quoted/004103' },
    itqan: { url: KSU_AYA(27, 88), site: KSU, recite: 'quoted/027088' },
    ihtiram: { url: KSU_AYA(49, 11), site: KSU, recite: 'quoted/049011' },
    masooliya: { url: 'https://dorar.net/h/J4fhEcBq', site: DORAR, hadith: 'e-masooliya' }, // صحيح البخاري 893
    sidq: { url: KSU_AYA(9, 119), site: KSU, recite: 'quoted/009119' },
    ihsan: { url: 'https://dorar.net/h/zJB1WCUU', site: DORAR, hadith: 'e-ihsan' }, // صحيح مسلم 1955
    tumooh: { url: 'https://dorar.net/h/Ov16uqG0', site: DORAR, hadith: 'e-azeema' } // صحيح مسلم 2664
  };
  const HADITH_VOICE_NOTE = 'صوت مولَّد بالذكاء الاصطناعي';

  // ---- The verse's recitation: a small «تشغيل ⇄ إيقاف» + «إعادة», the same
  // control as the value message, sized like «المصدر». One shared player, so
  // only one recitation plays; it and the value message never play together
  // (AudioStudio.setStatus / stopPlayback call into this).
  const RECITER = 'الشيخ ياسر الدوسري';
  const ICON_PLAY =
    '<svg class="audio-icon-play" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2Z" fill="currentColor"/></svg>';
  const ICON_PAUSE =
    '<svg class="audio-icon-pause" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2" fill="currentColor"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2" fill="currentColor"/></svg>';
  const ICON_REPLAY =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.6-5.9" stroke-linecap="round"/><path d="M4 4.5V9h4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // «0:04» — the clock under the verse. Western digits like every media
  // player: at this size the Arabic zero «٠» is a dot and «٠:٠٣» reads as «·:·٣».
  const arClock = (sec) => {
    const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const QuranRecite = (window.QuranRecite = {
    audio: null,
    ctl: null, // the control box of the verse being played
    status: 'idle', // 'idle' | 'playing' | 'paused'
    isPlaying: false,
    raf: 0,
    shownSec: -1, // the whole second last written on the clock

    player() {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.preload = 'none';
        this.audio.addEventListener('ended', () => this.setStatus('idle'));
        this.audio.addEventListener('error', () => this.setStatus('idle'));
        // the bar is right as soon as the length is known and after every seek
        this.audio.addEventListener('loadedmetadata', () => this.paint());
        this.audio.addEventListener('seeked', () => this.paint());
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
      const p = known ? Math.min(1, a.currentTime / d).toFixed(4) : '0';
      ctl.style.setProperty('--p', p);
      const bar = ctl.reciteBar;
      if (!bar) return;
      bar.style.setProperty('--p', p);
      const sec = Math.floor(a.currentTime);
      const total = known ? String(Math.round(d)) : '';
      if (sec === this.shownSec && bar.dataset.total === total) return;
      this.shownSec = sec;
      bar.dataset.total = total;
      bar.querySelector('.recite-time--now').textContent = arClock(a.currentTime);
      bar.querySelector('.recite-time--total').textContent = known ? arClock(d) : '';
      const track = bar.querySelector('.recite-track');
      track.setAttribute('aria-valuemax', total || '0');
      track.setAttribute('aria-valuenow', String(sec));
      track.setAttribute('aria-valuetext', known ? `${arClock(a.currentTime)} من ${arClock(d)}` : arClock(a.currentTime));
    },

    loop() {
      cancelAnimationFrame(this.raf);
      const step = () => {
        this.paint();
        this.raf = this.status === 'playing' ? requestAnimationFrame(step) : 0;
      };
      this.raf = requestAnimationFrame(step);
    },

    // tap / drag on the bar (fraction 0–1 from the right) and the arrow keys
    seekTo(ctl, fraction) {
      const a = this.audio;
      const d = a?.duration;
      if (this.ctl !== ctl || !Number.isFinite(d) || d <= 0) return;
      a.currentTime = Math.min(d - 0.05, Math.max(0, fraction * d));
      this.paint();
    },

    seekBy(ctl, seconds) {
      const d = this.audio?.duration;
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
      if (this.ctl === ctl && this.status === 'playing') {
        this.audio.pause();
        this.setStatus('paused');
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
      // the value message pauses while the verse is recited
      if (window.AudioStudio?.status === 'playing') window.AudioStudio.pauseAudio();
      this.player()
        .play()
        .catch((err) => {
          if (err?.name !== 'AbortError') this.setStatus('idle');
        });
      this.setStatus('playing');
    },

    pauseIfPlaying() {
      if (this.status === 'playing') {
        this.audio.pause();
        this.setStatus('paused');
      }
    },

    stop() {
      if (this.audio) {
        this.audio.pause();
        if (this.ctl) this.audio.currentTime = 0;
      }
      this.setStatus('idle');
      this.ctl = null;
    },

    setStatus(status) {
      this.status = status;
      this.isPlaying = status === 'playing';
      const ctl = this.ctl;
      if (!ctl) return;
      ctl.classList.toggle('is-playing', this.isPlaying);
      const label = ctl.querySelector('.recite-state');
      if (label) label.textContent = this.isPlaying ? 'إيقاف' : 'تشغيل';
      // the toggle is the control itself for the small in-text hadith buttons
      const toggle = ctl.matches('[data-recite="toggle"]') ? ctl : ctl.querySelector('[data-recite="toggle"]');
      const what = ctl.dataset.what || 'تلاوة الآية';
      toggle?.setAttribute('aria-label', `${this.isPlaying ? 'إيقاف' : 'تشغيل'} ${what}`);
      // once it has started: the progress line grows out of the button and
      // «إعادة» shows (ring on the small hadith button); at the end / on stop
      // it all folds back (CSS section 20.1)
      ctl.classList.toggle('is-started', status !== 'idle');
      // the verse / hadith text lights up while it is being read
      ctl.closest?.('.evidence-source')?.previousElementSibling?.classList.toggle('is-reciting', this.isPlaying);
      if (this.isPlaying) {
        this.loop();
      } else {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.shownSec = -1;
        if (status === 'paused') this.paint();
      }
    }
  });

  // The player of a verse / hadith, one row:
  //   idle:     [▶ تشغيل] بصوت الشيخ …                              [المصدر]
  //   playing:  [‖ إيقاف] ━━━━━━━━●──────────────── [↻ إعادة]      [المصدر]
  // On «تشغيل» the progress line grows out of the button and pushes «إعادة»
  // across to «المصدر»; the credit moves up into the line's caption with the
  // clock (so «صوت مولَّد بالذكاء الاصطناعي» stays in view). At the end it all
  // folds back. The line fills from right to left; tap / drag it to jump, or
  // use the arrow keys (← forward, → back in this right-to-left page).
  const buildReciteControls = (src) => {
    const isVerse = Boolean(src.recite);
    const what = isVerse ? 'تلاوة الآية' : 'قراءة الحديث';
    const credit = isVerse ? `بصوت ${RECITER}` : HADITH_VOICE_NOTE;
    const box = document.createElement('span');
    box.className = 'studio-audio-controls recite-controls';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', isVerse ? `تلاوة الآية بصوت ${RECITER}` : `قراءة الحديث (${HADITH_VOICE_NOTE})`);
    box.dataset.what = what;
    box.dataset.src = isVerse ? `./audio/quran/dosari/${src.recite}.mp3` : `./audio/hadith/${src.hadith}.mp3`;
    box.innerHTML =
      `<button type="button" class="audio-btn audio-btn--main audio-btn--sm" data-recite="toggle" aria-label="تشغيل ${what}">${ICON_PLAY}${ICON_PAUSE}<span class="recite-state">تشغيل</span></button>` +
      `<span class="recite-fold recite-fold--credit"><span class="recite-fold__in"><span class="recite-credit">${credit}</span></span></span>` +
      '<span class="recite-bar">' +
      `<span class="recite-bar__caption" aria-hidden="true"><span class="recite-bar__credit">${credit}</span>` +
      '<span class="recite-time"><span class="recite-time--now">0:00</span> / <span class="recite-time--total">0:00</span></span></span>' +
      `<span class="recite-track" role="slider" tabindex="0" aria-label="موضع ${what}" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0">` +
      '<span class="recite-track__fill"></span><span class="recite-track__head"><span class="recite-track__knob"></span></span></span>' +
      '</span>' +
      `<span class="recite-fold recite-fold--replay"><span class="recite-fold__in"><button type="button" class="audio-btn audio-btn--sm" data-recite="replay" aria-label="إعادة ${what} من البداية">${ICON_REPLAY}<span>إعادة</span></button></span></span>`;
    box.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-recite]');
      if (!btn) return;
      if (btn.dataset.recite === 'replay') QuranRecite.replay(box);
      else QuranRecite.toggle(box);
    });

    // jumping: the whole height of the line's area is the touch strip
    const bar = box.querySelector('.recite-bar');
    const track = box.querySelector('.recite-track');
    const fractionAt = (e) => {
      const r = track.getBoundingClientRect();
      return r.width ? (r.right - e.clientX) / r.width : 0;
    };
    bar.addEventListener('pointerdown', (e) => {
      if (QuranRecite.ctl !== box || !box.classList.contains('is-started')) return;
      e.preventDefault();
      e.stopPropagation();
      bar.setPointerCapture?.(e.pointerId);
      box.classList.add('is-seeking');
      QuranRecite.seekTo(box, fractionAt(e));
    });
    bar.addEventListener('pointermove', (e) => {
      if (bar.hasPointerCapture?.(e.pointerId)) QuranRecite.seekTo(box, fractionAt(e));
    });
    const endSeek = () => box.classList.remove('is-seeking');
    bar.addEventListener('pointerup', endSeek);
    bar.addEventListener('pointercancel', endSeek);
    bar.addEventListener('lostpointercapture', endSeek);
    track.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: 2, ArrowUp: 2, ArrowRight: -2, ArrowDown: -2, PageUp: 5, PageDown: -5 }[e.key];
      if (step) QuranRecite.seekBy(box, step);
      else if (e.key === 'Home') QuranRecite.seekTo(box, 0);
      else if (e.key === 'End') QuranRecite.seekTo(box, 1);
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
    if (!line || !line.classList.contains('evidence-source')) {
      line = document.createElement('p');
      line.className = 'evidence-source';
      textEl.after(line);
    }
    const src = EVIDENCE_SOURCES[valueId];
    // a recitation whose control is about to be replaced stops with it
    if (QuranRecite.ctl && line.contains(QuranRecite.ctl)) QuranRecite.stop();
    line.hidden = !src;
    line.replaceChildren();
    if (!src) return;
    const controls = src.recite || src.hadith ? buildReciteControls(src) : null;
    if (controls) line.append(controls);
    const link = document.createElement('a');
    link.href = src.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = src.site;
    link.setAttribute('aria-label', `المصدر: ${src.site} (يفتح في صفحة جديدة)`);
    link.innerHTML =
      '<span>المصدر</span><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5M14 4h6v6M20 4l-9 9"/></svg>';
    line.append(link);
  };

  // ---- Hadiths inside the texts (encyclopedia, benefits, stories, situation
  // feedback): a small round ▶ right after the closing » of each Prophetic
  // saying plays its reading (audio/hadith/h-*.mp3) through the same single
  // player. Added wherever such text appears, including text rendered later.
  const arNorm = (s) =>
    String(s)
      .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ئ/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/\s+/g, ' ');
  const INLINE_HADITHS = [
    ['h-bunyan', 'المؤمن للمؤمن كالبنيان'],
    ['h-adwamuha', 'أحب الأعمال إلى الله أدومها'],
    ['h-yutqinahu', 'إذا عمل أحدكم عملا أن يتقنه'],
    ['h-tumaanina', 'فإن الصدق طمأنينة'],
    ['h-tarahu', 'أن تعبد الله كأنك تراه'],
    ['h-uhud', 'إن رأيتمونا تخطفنا الطير'],
    ['h-ruma', 'من يشتري بئر رومة'],
    ['h-sujud', 'فأعني على نفسك بكثرة السجود'],
    ['h-shadid', 'ليس الشديد بالصرعة'],
    ['h-kafa', 'كفى بالمرء كذبا'],
    ['h-awn', 'في عون العبد'],
    ['h-ghash', 'من غشنا فليس منا'],
    ['h-ihris', 'احرص على ما ينفعك']
  ].map(([id, key]) => ({ id, key: arNorm(key) }));
  // the «التأصيل» boxes have their own player under the text
  const HADITH_SKIP = '#modalEvidenceText, #encycEvidence, .evidence-source, button, input, textarea, script, style, [contenteditable]';

  const makeHadithButton = (id) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hadith-play';
    btn.dataset.recite = 'toggle';
    btn.dataset.what = 'قراءة الحديث';
    btn.dataset.src = `./audio/hadith/${id}.mp3`;
    btn.title = `استمع للحديث (${HADITH_VOICE_NOTE})`;
    btn.setAttribute('aria-label', 'تشغيل قراءة الحديث');
    btn.innerHTML = ICON_PLAY + ICON_PAUSE;
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // never also opens the card / story it sits in
      QuranRecite.toggle(btn);
    });
    return btn;
  };

  const decorateHadiths = (root) => {
    if (!root || !root.querySelectorAll) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.nodeValue.includes('»') && !node.parentElement?.closest(HADITH_SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let text = node.nodeValue;
      let cursor = node;
      const re = /«([^»]+)»/g;
      let m;
      const cuts = [];
      while ((m = re.exec(text))) {
        const q = arNorm(m[1]);
        const hit = INLINE_HADITHS.find((h) => q.includes(h.key));
        if (hit) cuts.push({ end: m.index + m[0].length, id: hit.id });
      }
      // split from the last match backwards so earlier offsets stay valid
      for (let i = cuts.length - 1; i >= 0; i--) {
        const { end, id } = cuts[i];
        const next = cursor.nextSibling;
        if (end === text.length && next?.classList?.contains('hadith-play')) continue; // already there
        const rest = cursor.splitText(end);
        rest.parentNode.insertBefore(makeHadithButton(id), rest);
        text = cursor.nodeValue;
      }
    }
  };
  window.decorateHadiths = decorateHadiths;

  const startHadithDecorator = () => {
    decorateHadiths(document.body);
    let queued = new Set();
    let raf = 0;
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'childList') {
          r.addedNodes.forEach((n) => queued.add(n.nodeType === 3 ? n.parentElement : n));
        } else if (r.type === 'characterData') {
          queued.add(r.target.parentElement);
        }
      }
      // a reading whose text was replaced stops with it
      if (QuranRecite.ctl && !QuranRecite.ctl.isConnected) QuranRecite.stop();
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const roots = [...queued].filter((el) => el && el.isConnected && !el.closest?.('.hadith-play'));
        queued = new Set();
        roots.forEach(decorateHadiths);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };

  // ==========================================================================
  // 0. VALUES EXHIBITION IDENTITY (معرض ترسيخ القيم)
  // Official exhibition values in the school announcement order, mapped to the
  // value card that embodies each one (null = no card for it yet).
  // ==========================================================================
  const EXHIBITION = (window.AL_ILM_EXHIBITION = {
    title: 'معرض ترسيخ القيم',
    organizers: 'النشاط الطلابي والتوجيه الطلابي بمتابعة إدارة ثانوية العلم النافع',
    motto: 'لا تجعل القيم مجرد كلمات نرددها، بل اجعلها إبداعًا نقدّمه وسلوكًا نعيشه وأثرًا نتركه',
    values: [
      { label: 'الانضباط', id: 'indibat' },
      { label: 'المرونة', id: null },
      { label: 'الانتماء الوطني', id: 'watani' },
      { label: 'التسامح', id: 'tasamuh' },
      { label: 'العزيمة', id: 'azeema' },
      { label: 'الأمانة', id: 'amana' },
      { label: 'التعاون', id: 'taawun' },
      { label: 'المثابرة', id: null }
    ],
    isExhibitionValue(id) {
      return this.values.some((item) => item.id && String(item.id) === String(id));
    }
  });

  const toArabicDigits = (input) =>
    String(input).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
  window.toArabicDigits = toArabicDigits;

  const HERO_CARD_SUBS = {
    tasamuh: 'نقاء القلب وقوة الشخصية',
    watani: 'فخر بالهوية ووفاء للقيادة',
    taawun: 'اجتماع القلوب والعقول على الخير',
    azeema: 'إصرار يتجاوز الصعاب نحو القمة',
    amana: 'ثقةٌ تُصان وضميرٌ لا يغيب',
    indibat: 'التزام واع بالوقت والنظام',
    itqan: 'إتقانٌ يصنع الأثر وتوقيعٌ للتميز',
    ihtiram: 'رُقيّ الخُلق وتقديرٌ للجميع',
    masooliya: 'وعيٌ بالواجب وثباتٌ على العهد',
    sidq: 'استقامة القول ونقاء السريرة',
    ihsan: 'تجاوز للواجب نحو الأجمل',
    tumooh: 'همّةٌ تعانق القمم وأثرٌ خالد'
  };

  const HERO_CARD_QUOTES = {
    tasamuh: '«التسامح هو نقاء القلب، وقوة الشخصية، به نرتقي في تعاملنا مع الآخرين، ونبني مجتمعاً يسوده الاحترام والمحبة.»',
    watani: '«الانتماء الوطني هو فخرنا بهويتنا، ووفاؤنا لأرضنا وقيادتنا، وسعينا المستمر بالعلم والعمل لرفعة وطننا الغالي.»',
    taawun: '«التعاون هو اجتماع القلوب والعقول على الخير، فيد الله مع الجماعة، وبتكاتفنا معاً ننجز ما يعجز عنه الفرد وحده.»',
    azeema: '«العزيمة هي الوقود الذي يدعمنا لتجاوز الصعاب، والإصرار الذي لا يعرف المستحيل حتى نصل إلى القمة ونحقق الطموح.»',
    indibat: '«الانضباط هو سر النجاح والتميز، وهو الإرادة الواعية للوقت والنظام لصنع مستقبلنا ومستقبل وطننا خطوة بخطوة.»',
    amana: '«الأمانة هي ميزان الثقة وركيزة الأخلاق، بها تُصان الحقوق ويبقى الضمير حياً في القول والعمل في كل حين.»',
    itqan: '«الإتقان أن تمنح كل عمل حقه كاملاً من الجهد والعناية، لتجعل إنتاجك تحفةً تحمل اسمك وخطوةً نحو التميز الراسخ.»',
    ihtiram: '«الاحترام لغة الكبار؛ أن تُقدّر معلمك، وتُنصت لزميلك، وتصون مدرستك ونظامها، وتختلف بأدب دون أن تجرح أحداً.»',
    masooliya: '«المسؤولية أن تحمل واجبك بوعي دون تذكير، وتعترف بالخطأ دون تبرير، وتُكمل ما بدأت بهمة وثبات وإخلاص.»',
    sidq: '«الصدق استقامة القول وصفاء الضمير، به تُبنى جسور الثقة وينال الإنسان احترام مجتمعه ورضا ربه في كل أمر.»',
    ihsan: '«الإحسان أن تتجاوز حدود الواجب المجرد إلى الأجمل والأكمل، فتُحسن إلى من حولك قولاً وفعلاً وأثراً يبقى.»',
    tumooh: '«الطموح أن ترى نفسك في قمم المجد ثم تمشي إليها بخطى واثقة؛ وهمّتك سقف إنجازك، ووطنك ينتظر عطاءك الكبير.»'
  };

  // Short, single call to action at the bottom of every value card. On the
  // card ring it is a real button for the keyboard / a TV remote (only the
  // centre card's is in the Tab order — updateTransforms keeps it so).
  const cardShowcaseFooterHTML = (val, extraCtaAttrs = '') => `
      <div class="vcard-footer" ${extraCtaAttrs}${extraCtaAttrs ? ` role="button" tabindex="-1" aria-label="عرض قيمة ${escapeHTML(val.name)}"` : ''}>
        <span class="vcard-tap-hint">اضغط للعرض</span>
      </div>
    `;

  // ==========================================================================
  // 1. ARABIC NORMALIZATION & SEARCH UTILITIES
  // ==========================================================================
  window.normalizeArabic = (input) =>
    String(input || '')
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  // ==========================================================================
  // 2. SPA ROUTER & HIGH-CONTRAST PROJECTOR DAY MODE
  // ==========================================================================
  const VIEW_MAP = {
    // The intro is the top of the home page ('all'); other views hide it.
    home: '#intro-section',
    orbit: '#hero-section',
    stories: '#examples-section',
    encyclopedia: '#encyclopedia-section',
    comparison: '#comparison-section'
  };

  const AppRouter = (window.AppRouter = {
    views: VIEW_MAP,
    switchView(view = 'all', shouldScroll = true) {
      const targetView = view === 'all' || Object.prototype.hasOwnProperty.call(VIEW_MAP, view) ? view : 'all';
      state.activeView = targetView;
      document.body.dataset.activeView = targetView;

      Object.entries(VIEW_MAP).forEach(([key, selector]) => {
        const el = document.querySelector(selector);
        if (!el) return;
        const visible = targetView === 'all' || targetView === key;
        el.classList.toggle('spa-hidden', !visible);
        el.inert = !visible;
        if (visible) el.removeAttribute('aria-hidden');
        else el.setAttribute('aria-hidden', 'true');
      });

      $$('.spa-nav-btn[data-view]').forEach((btn) => {
        const isActive = btn.dataset.view === targetView;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
        if (isActive) btn.setAttribute('aria-current', 'page');
        else btn.removeAttribute('aria-current');
      });

      if (window.history && window.history.replaceState) {
        const nextHash = targetView === 'all' ? window.location.pathname : `#${targetView}`;
        window.history.replaceState(null, '', nextHash);
      }

      if (shouldScroll) {
        // The content was just swapped, so go straight to the top (the new
        // section fades in there); gliding over new content looked jumpy.
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  });

  window.switchView = (view) => AppRouter.switchView(view, true);

  // The day / projector theme toggle was removed: the site always uses the dark
  // exhibition theme. Clear any saved choice so a device can't stay stuck in it.
  document.body.classList.remove('projector-day');
  try {
    localStorage.removeItem('al_ilm_projector_day');
  } catch (_) {}

  // ==========================================================================
  // 3. 60Hz SPATIAL ORBIT TOUCH, INERTIA & SPRING PHYSICS
  // ==========================================================================
  const PHYSICS_CFG = {
    stiffness: 195,
    damping: 24,
    spacing: 315,
    snapThreshold: 0.0012
  };

  const OrbitPhysics = (window.OrbitPhysics = {
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
      this.stage = $('stage3D');
      this.wrapper = $('cardsWrapper');
      if (!this.stage || !this.wrapper) return;

      this.buildDeck(state.activeGroup);
      this.bindEvents();
    },

    getCardWidth() {
      if (!this.cardWidth && this.cards.length) {
        // offsetWidth is the untransformed layout width (independent of scale/rotate).
        this.cardWidth = this.cards[0].element.offsetWidth || 0;
      }
      return this.cardWidth;
    },

    getSpacing() {
      const w = window.innerWidth;
      const base = w < 640 ? 215 : w < 1024 ? 260 : 295;
      // Geometric floor from the real card width: neighbouring planes must never
      // overlap horizontally (worst cases: rel 0/±1 and the ±0.5 swipe midpoint),
      // otherwise the GPU depth-sorter slices one card through the other.
      const cw = this.getCardWidth();
      if (!cw) return base;
      const floorAtRest = (0.9157 * cw - 28) / 0.955;
      const floorMidSwipe = (0.4657 * cw - 14) / 0.48875;
      return Math.max(base, Math.ceil(Math.max(floorAtRest, floorMidSwipe)) + 8);
    },

    buildDeck(group = 'all') {
      state.activeGroup = group;
      const list =
        group === 'all'
          ? VALUES
          : VALUES.filter((v) => String(v.group).toUpperCase() === String(group).toUpperCase());

      state.orbitList = list;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }

      // Update group filter buttons
      ['A', 'B', 'all'].forEach((g) => {
        const btn = $(`tab-${g}`);
        if (!btn) return;
        const active = g === group;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });

      this.wrapper.replaceChildren();
      const frag = document.createDocumentFragment();

      this.cards = list.map((val, idx) => {
        const card = document.createElement('article');
        // Static cards: no pointer-following spotlight or tilt on the 3D orbit.
        card.className = 'value-card-3d';
        card.dataset.valueId = val.id;
        card.dataset.index = String(idx);
        card.style.setProperty('--card-accent', val.accent || '#D4AF37');
        card.style.setProperty('--card-surface', val.surface || '');
        card.style.setProperty('--spot-color', `${val.accent || '#D4AF37'}2B`);
        card.setAttribute('role', 'group');
        card.setAttribute('aria-label', `${val.name} — ${val.sub}`);

        if (EXHIBITION.isExhibitionValue(val.id)) card.classList.add('is-expo-value');

        const subText = HERO_CARD_SUBS[val.id] || val.sub;
        const quoteText = HERO_CARD_QUOTES[val.id] || `«${val.text}»`;

        // Clean card: icon → name → one-line description → quote → "اضغط للعرض".
        // Layers: glass material (::before) → content (lifted with translateZ on
        // the resting centre card) → static sheen.
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

        const ctaBtn = card.querySelector('[data-open-studio]');
        if (ctaBtn) {
          ctaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!state.isSpinning) window.openStudio(val.id);
          });
          // Enter / Space (keyboard, TV remote OK button) act like a tap
          ctaBtn.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
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

      if (typeof window.scanSpotlightSurfaces === 'function') {
        window.scanSpotlightSurfaces();
      }
    },

    renderPanoramicGrid(list) {
      const gridEl = $('allValuesGridStage');
      if (!gridEl) return;
      gridEl.innerHTML = list
        .map((val, idx) => {
          const expoCls = EXHIBITION.isExhibitionValue(val.id) ? ' is-expo-value' : '';
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
        })
        .join('');

      gridEl.onclick = (e) => {
        if (state.isSpinning) return;
        const card = e.target.closest('[data-grid-id]');
        if (card) window.openStudio(card.dataset.gridId);
      };
      // keyboard / TV remote: Enter or Space on a focused card opens it
      gridEl.onkeydown = (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('[data-grid-id]');
        if (!card || state.isSpinning) return;
        e.preventDefault();
        window.openStudio(card.dataset.gridId);
      };
    },

    wrapIndex(idx) {
      const len = this.cards.length;
      if (!len) return 0;
      return ((idx % len) + len) % len;
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
      // Move target along shortest circular path from current position
      const wrappedIndex = this.wrapIndex(Math.round(nextTarget));
      const delta = this.shortestDelta(this.position, wrappedIndex);
      this.target = this.position + delta;
      if (initialVelocity !== null) {
        this.velocity = initialVelocity;
      }
      this.wakeSpring();
    },

    wakeSpring() {
      if (this.rafId) return;
      window.PerfTier?.watch(900);
      this.lastFrameTime = performance.now();
      this.rafId = requestAnimationFrame((now) => this.tick(now));
    },

    tick(now) {
      this.rafId = 0;
      if (!this.cards.length || this.pointer) return;

      const rawDt = (now - (this.lastFrameTime || now)) / 1000;
      this.lastFrameTime = now;
      const dt = Math.min(Math.max(rawDt, 0.004), 0.032);

      const displacement = this.target - this.position;
      const springForce = displacement * PHYSICS_CFG.stiffness;
      const dampingForce = -this.velocity * PHYSICS_CFG.damping;
      const accel = springForce + dampingForce;

      this.velocity += accel * dt;
      this.position += this.velocity * dt;

      const settled =
        Math.abs(displacement) < PHYSICS_CFG.snapThreshold &&
        Math.abs(this.velocity) < PHYSICS_CFG.snapThreshold;

      if (settled) {
        this.position = this.wrapIndex(Math.round(this.target));
        this.target = this.position;
        this.velocity = 0;
        this.updateTransforms(false);
        return; // Sleep rAF cleanly at 0% idle CPU/GPU!
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
      const len = this.cards.length;
      if (!len) return;

      const spacing = this.getSpacing();
      const nearest = this.wrapIndex(Math.round(this.position));
      state.activeOrbitIndex = nearest;
      // Device level (perf_tier.js): the full ring with depth-of-field blur on
      // capable devices; fewer cards and no blur filter on medium / low ones.
      const perf = window.PerfTier?.level || 'high';
      const maxVisibleDist =
        perf === 'low' ? 1.75 : perf === 'medium' ? (len <= 6 ? 2.4 : 2.6) : len <= 6 ? 2.95 : 3.6;
      const depthBlur = perf === 'high';
      // Day projector cards are light: dimming them too far reads as grey smudge.
      const minBrightness = document.body.classList.contains('projector-day') ? 0.82 : 0.58;

      for (let i = 0; i < len; i++) {
        const cardObj = this.cards[i];
        const el = cardObj.element;
        // Last written state: only touch the DOM when something really changes
        // (rewriting classes/attributes on 12 cards every frame forced extra
        // style work during swipes and the SPIN).
        const s = cardObj.applied || (cardObj.applied = {});
        const rel = this.shortestDelta(this.position, i);
        const absRel = Math.abs(rel);

        if (absRel > maxVisibleDist) {
          if (s.offstage !== true) {
            s.offstage = true;
            el.classList.add('is-offstage');
            el.classList.remove('is-center', 'is-prev', 'is-next', 'is-moving');
            el.style.opacity = '0';
            el.style.filter = 'none';
            el.setAttribute('aria-hidden', 'true');
            el.inert = true;
            s.center = s.prev = s.next = s.moving = false;
            s.opacity = s.filter = null;
          }
          continue;
        }

        if (s.offstage !== false) {
          s.offstage = false;
          el.classList.remove('is-offstage');
          el.removeAttribute('aria-hidden');
          el.inert = false;
        }
        const pose = this.poseFor(rel, spacing);

        // Focus zone (|rel| < 0.35): fully opaque and filter-free. Opacity < 1 or
        // any filter would flatten the card's preserve-3d interior layers.
        const inFocus = absRel < 0.35;
        const sideDepth = Math.max(0, absRel - 0.35);
        const edgeFade = Math.min(1, Math.max(0, (maxVisibleDist - absRel) / 0.6));
        const opacity = (inFocus ? 1 : Math.max(0.45, 1 - sideDepth * 0.12)) * edgeFade;
        const brightness = inFocus ? 1 : Math.max(minBrightness, 1 - sideDepth * 0.2);
        // Depth-of-field blur only once the deck rests (it eases in through the
        // CSS filter transition). A blur whose radius changes every frame is
        // re-rendered from scratch each frame and made the motion stutter.
        // While moving, depth is shown with opacity alone (no filter at all, so
        // every frame is a pure GPU transform/opacity change); the blur and the
        // dimming ease back in from `none` once the deck rests.
        // Medium / low devices never use the filter: the side cards are dimmed
        // with opacity alone, at rest too, so nothing switches when they stop.
        const blurPx = Math.min(4.5, (absRel - 0.25) * 1.85);
        const useFilter = depthBlur && !inFocus && !isMoving;
        const filter = useFilter ? `blur(${blurPx.toFixed(1)}px) brightness(${brightness.toFixed(2)})` : 'none';
        const shownOpacity = !useFilter && !inFocus ? opacity * brightness : opacity;
        const opacityText = shownOpacity >= 0.999 ? '1' : shownOpacity.toFixed(3);
        const zIndex = 500 - Math.round(absRel * 100);

        el.style.transform = this.composeTransform(pose);
        if (s.opacity !== opacityText) el.style.opacity = s.opacity = opacityText;
        if (s.filter !== filter) el.style.filter = s.filter = filter;
        if (s.z !== zIndex) el.style.zIndex = String((s.z = zIndex));

        if (s.moving !== isMoving) el.classList.toggle('is-moving', (s.moving = isMoving));
        // During the SPIN the centre highlight (glowing border) stays put until
        // the wheel stops: re-painting it on every card that flew past was
        // costly and looked busy. Swipes and arrows update it live.
        if (state.isSpinning && isMoving) continue;
        const isCenter = i === nearest;
        const isPrev = i === this.wrapIndex(nearest - 1);
        const isNext = i === this.wrapIndex(nearest + 1);
        if (s.center !== isCenter) {
          el.classList.toggle('is-center', (s.center = isCenter));
          // only the centre card's «اضغط للعرض» is in the Tab order; if it had
          // the focus when the ring turned, the focus follows the new centre
          const cta = s.cta || (s.cta = el.querySelector('[data-open-studio]'));
          if (cta) {
            if (!isCenter && document.activeElement === cta) this.focusNewCentre = true;
            cta.tabIndex = isCenter ? 0 : -1;
          }
        }
        if (s.prev !== isPrev) el.classList.toggle('is-prev', (s.prev = isPrev));
        if (s.next !== isNext) el.classList.toggle('is-next', (s.next = isNext));
      }
      if (this.focusNewCentre) {
        this.focusNewCentre = false;
        this.cards[nearest]?.element.querySelector('[data-open-studio]')?.focus({ preventScroll: true });
      }

      // The dots follow the cards, except mid-SPIN: a dot changing width on
      // every card that flew past re-laid out the toolbar ~30 times a spin.
      if (nearest !== this.lastRenderedNearest && !(state.isSpinning && isMoving)) {
        this.lastRenderedNearest = nearest;
        this.syncDots(nearest);
      }

      // The big blurred glow behind the deck takes the centre card's colour only
      // once the deck rests (re-colouring a 120px blur on every passing card
      // during a swipe or SPIN was the heaviest part of the motion).
      if (!isMoving && nearest !== this.ambientIndex) {
        this.ambientIndex = nearest;
        const activeVal = this.cards[nearest]?.value;
        const ambient = $('topAmbient');
        if (ambient && activeVal) ambient.style.background = activeVal.accent || '#10B981';
      }
    },

    buildDots() {
      const bar = $('dotsBar');
      if (!bar) return;
      bar.replaceChildren();
      const frag = document.createDocumentFragment();
      this.cards.forEach((c, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'orbit-dot';
        dot.style.setProperty('--dot-accent', c.value.accent || '#D4AF37');
        dot.setAttribute('aria-label', `انتقل إلى قيمة ${c.value.name}`);
        dot.addEventListener('click', () => {
          if (!state.isSpinning) this.setTarget(idx, 0);
        });
        frag.appendChild(dot);
      });
      bar.appendChild(frag);
      this.syncDots(0);
    },

    syncDots(activeIndex) {
      const bar = $('dotsBar');
      if (!bar) return;
      Array.from(bar.children).forEach((dot, idx) => {
        const active = idx === activeIndex;
        dot.classList.toggle('active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    },

    bindEvents() {
      this.stage.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      this.stage.addEventListener('pointermove', (e) => this.onPointerMove(e));
      this.stage.addEventListener('pointerup', (e) => this.onPointerUp(e));
      this.stage.addEventListener('pointercancel', (e) => this.onPointerUp(e));

      this.stage.addEventListener(
        'wheel',
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
        'resize',
        () => {
          this.cardWidth = 0; // re-measure for the spacing floor
          this.updateTransforms(false);
        },
        { passive: true }
      );

      document.addEventListener('keydown', (e) => {
        if (state.isSpinning || document.body.classList.contains('modal-open')) return;
        if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.step(1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.step(-1);
        }
      });
    },

    onPointerDown(e) {
      if (state.isSpinning) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // Ignore direct clicks on the CTA button so its click handler fires cleanly
      if (e.target.closest('[data-open-studio]')) return;

      // Interrupt any ongoing spring animation immediately (Apple Fluid Interfaces rule!)
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }

      this.pointer = {
        id: e.pointerId,
        startX: e.clientX,
        startPos: this.position,
        totalDx: 0,
        tappedCard: e.target.closest('.value-card-3d')
      };
      this.samples = [[e.clientX, performance.now()]];
      this.velocity = 0;
      this.stage.classList.add('is-dragging');
      try {
        this.stage.setPointerCapture(e.pointerId);
      } catch (_) {}
    },

    onPointerMove(e) {
      if (!this.pointer || e.pointerId !== this.pointer.id) return;
      const dx = e.clientX - this.pointer.startX;
      this.pointer.totalDx = dx;
      const spacing = this.getSpacing();
      // Exact 1:1 finger tracking
      this.position = this.pointer.startPos - dx / spacing;

      const now = performance.now();
      this.samples.push([e.clientX, now]);
      if (this.samples.length > 5) this.samples.shift();

      this.updateTransforms(true);
    },

    onPointerUp(e) {
      if (!this.pointer || e.pointerId !== this.pointer.id) return;
      const p = this.pointer;
      this.pointer = null;
      this.stage.classList.remove('is-dragging');
      try {
        if (this.stage.hasPointerCapture(e.pointerId)) {
          this.stage.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}

      // Distinguish crisp tap (< 8px movement) from swipe gesture
      if (Math.abs(p.totalDx) < 8) {
        if (p.tappedCard) {
          const idx = Number(p.tappedCard.dataset.index);
          const centerIdx = this.wrapIndex(Math.round(this.position));
          if (Number.isFinite(idx)) {
            if (idx === centerIdx) {
              const val = this.cards[idx]?.value;
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

      // Compute momentum release velocity from last 5 pointer samples
      let releaseVelCardsPerSec = 0;
      if (this.samples.length >= 2) {
        const [x0, t0] = this.samples[0];
        const [x1, t1] = this.samples[this.samples.length - 1];
        const dtMs = Math.max(8, t1 - t0);
        const pxPerSec = ((x1 - x0) / dtMs) * 1000;
        releaseVelCardsPerSec = -pxPerSec / this.getSpacing();
      }

      // Exponential momentum projection (Apple UIScrollView / Fluid Interfaces)
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
      const len = this.cards.length;
      if (!len) return;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }

      const startPos = this.position;
      const currentIdx = this.wrapIndex(Math.round(startPos));
      const candidates = this.cards.map((_, i) => i).filter((i) => i !== currentIdx);
      const chosenIdx = candidates.length
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : currentIdx;

      // Two full turns, then the chosen card. (Five turns in 2.6s started at
      // ~1.7 cards per frame, so the cards flickered instead of moving.)
      const extraRevolutions = 2 * len;
      const forwardDelta = ((chosenIdx - currentIdx) % len + len) % len;
      const totalTravel = extraRevolutions + forwardDelta;
      const endPos = Math.round(startPos) + totalTravel;

      const startTime = performance.now();
      let lastWholeCard = Math.floor(startPos);
      window.PerfTier?.watch(duration);

      const frame = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        // Wheel curve: short smooth speed-up, then a long soft slow-down
        // (cubic-bezier 0.32, 0, 0.12, 1), peaking well under one card a frame.
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
          if (onComplete) onComplete(this.cards[chosenIdx]?.value);
        }
      };

      this.rafId = requestAnimationFrame(frame);
    }
  });

  // cubic-bezier(0.32, 0, 0.12, 1) as a function of time t ∈ [0, 1].
  function spinEase(t) {
    const x1 = 0.32, y1 = 0, x2 = 0.12, y2 = 1;
    const bez = (a, b, s) => 3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s;
    const dBez = (a, b, s) => 3 * a * (1 - s) * (1 - s) + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s * s;
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

  // The device level can change after load (CPU check, frame watch): redraw
  // the ring with the new number of cards / blur.
  window.addEventListener('perfchange', () => {
    if (!OrbitPhysics.rafId && !state.isSpinning) OrbitPhysics.updateTransforms(false);
  });

  // ==========================================================================
  // 4. HIGH-SPEED SPIN REACTOR + WEB AUDIO MECHANICAL TICKS
  // ==========================================================================
  const SpinSynthesizer = {
    ctx: null,
    ensure() {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) this.ctx = new Ctx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    },
    playTick(progress) {
      const ctx = this.ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + progress * 540, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.04, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
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
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.045, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    }
  };

  window.setHeroLayout = (mode = 'orbit') => {
    state.heroLayout = mode === 'grid' ? 'grid' : 'orbit';
    const isGrid = state.heroLayout === 'grid';
    $('stage3D')?.classList.toggle('hidden', isGrid);
    $('allValuesGridStage')?.classList.toggle('hidden', !isGrid);
    document.querySelector('.orbit-nav-cluster')?.classList.toggle('hidden', isGrid);
    $('layout-orbit')?.classList.toggle('active', !isGrid);
    $('layout-grid')?.classList.toggle('active', isGrid);
  };

  window.triggerWheelSpin = () => {
    if (state.isSpinning || !OrbitPhysics.cards.length) return;
    state.isSpinning = true;

    const btn = $('spinBtn');
    const spinText = $('spinText');
    const stage = $('stage3D');
    const originalLabel = spinText ? spinText.textContent : '';

    btn?.classList.add('is-spinning', 'busy');
    btn?.setAttribute('aria-busy', 'true');
    stage?.classList.add('is-spinning');
    if (spinText) spinText.textContent = 'جارٍ اختيار القيمة التربوية...';

    if (state.heroLayout === 'grid') {
      const gridCards = $$('#allValuesGridStage .value-grid-card');
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
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3.5);
        const stepIdx = Math.round(eased * totalSteps);
        if (stepIdx !== lastStep) {
          lastStep = stepIdx;
          const activeCardIdx = stepIdx % total;
          gridCards.forEach((c, idx) => c.classList.toggle('spin-roulette-active', idx === activeCardIdx));
          SpinSynthesizer.playTick(t);
        }
        if (t < 1) {
          requestAnimationFrame(tickGrid);
        } else {
          SpinSynthesizer.playGoldResolve();
          state.isSpinning = false;
          btn?.classList.remove('is-spinning', 'busy');
          btn?.removeAttribute('aria-busy');
          const chosenVal = OrbitPhysics.cards[chosenIdx]?.value;
          if (spinText) {
            spinText.textContent = chosenVal ? `تم اختيار: ${chosenVal.name} — تفتح الآن...` : originalLabel;
          }
          window.setTimeout(() => {
            gridCards.forEach((c) => c.classList.remove('spin-roulette-active'));
            if (spinText) spinText.textContent = originalLabel || 'تدوير عشوائي وفتح القيمة (SPIN)';
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
        btn?.classList.remove('is-spinning', 'busy');
        btn?.removeAttribute('aria-busy');
        stage?.classList.remove('is-spinning');
        if (spinText) {
          spinText.textContent = chosenVal
            ? `تم اختيار: ${chosenVal.name} — تفتح الآن...`
            : originalLabel;
        }
        window.setTimeout(() => {
          if (spinText) spinText.textContent = originalLabel || 'تدوير عشوائي وفتح القيمة (SPIN)';
          if (chosenVal) window.openStudio(chosenVal.id);
        }, 380);
      }
    );
  };

  // ==========================================================================
  // 5. GPU-COALESCED SPOTLIGHT SHADER (NO LAYOUT THRASHING)
  // ==========================================================================
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
      el.style.setProperty('--spot-x', `${localX.toFixed(1)}px`);
      el.style.setProperty('--spot-y', `${localY.toFixed(1)}px`);
      el.classList.add('is-spotlit');
    };

    const bindSurface = (el) => {
      if (el.__spotBound) return;
      el.__spotBound = true;

      const cacheRect = () => {
        el.__cachedSpotRect = el.getBoundingClientRect();
      };

      el.addEventListener(
        'pointerenter',
        (e) => {
          cacheRect();
          pending = { el, clientX: e.clientX, clientY: e.clientY };
          if (!rafId) rafId = requestAnimationFrame(flush);
        },
        { passive: true }
      );

      el.addEventListener(
        'pointerdown',
        (e) => {
          cacheRect();
          pending = { el, clientX: e.clientX, clientY: e.clientY };
          if (!rafId) rafId = requestAnimationFrame(flush);
        },
        { passive: true }
      );

      el.addEventListener(
        'pointermove',
        (e) => {
          if (!el.__cachedSpotRect) cacheRect();
          pending = { el, clientX: e.clientX, clientY: e.clientY };
          if (!rafId) rafId = requestAnimationFrame(flush);
        },
        { passive: true }
      );

      const clearSpot = () => el.classList.remove('is-spotlit');
      el.addEventListener('pointerleave', clearSpot, { passive: true });
      el.addEventListener('pointercancel', clearSpot, { passive: true });
    };

    window.scanSpotlightSurfaces = () => {
      $$('.spotlight-surface, .surface-card, .story-card, .comparison-card').forEach(bindSurface);
    };

    window.scanSpotlightSurfaces();

    const invalidateRects = () => {
      $$('.is-spotlit').forEach((el) => {
        el.__cachedSpotRect = null;
        el.classList.remove('is-spotlit');
      });
    };
    window.addEventListener('scroll', invalidateRects, { passive: true });
    window.addEventListener('resize', invalidateRects, { passive: true });
  };

  // ==========================================================================
  // 6. SEARCH, 36-STORY GALLERY, ENCYCLOPEDIA & 12-CARD IMPACT COMPARISON
  // ==========================================================================
  const SearchAndFilter = (window.SearchAndFilter = {
    init() {
      const input = $('globalSearchInput');
      const clearBtn = $('clearSearchBtn');

      if (input) {
        input.addEventListener('input', () => {
          state.searchQuery = input.value || '';
          if (clearBtn) clearBtn.classList.toggle('hidden', !state.searchQuery.trim());

          // If user searches while focused only on orbit, switch to 'all' so stories & comparisons appear
          if (state.searchQuery.trim() && state.activeView === 'orbit') {
            AppRouter.switchView('all', false);
          }
          this.renderStories();
          this.renderComparisonGrid();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (input) input.value = '';
          state.searchQuery = '';
          clearBtn.classList.add('hidden');
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
      const valBar = $('examplesFilterBar');

      if (valBar) {
        const items = [
          { id: 'all', label: `جميع القيم (${ALL_STORIES.length} قصة)` },
          ...VALUES.map((v) => ({ id: v.id, label: v.name }))
        ];
        valBar.innerHTML = items
          .map(
            (it) =>
              `<button type="button" class="filter-pill${state.storyValueFilter === it.id ? ' active' : ''}" data-story-val="${escapeHTML(it.id)}" aria-pressed="${state.storyValueFilter === it.id}">${escapeHTML(it.label)}</button>`
          )
          .join('');

        valBar.onclick = (e) => {
          const btn = e.target.closest('[data-story-val]');
          if (!btn) return;
          state.storyValueFilter = btn.dataset.storyVal;
          $$('[data-story-val]', valBar).forEach((b) => {
            const act = b === btn;
            b.classList.toggle('active', act);
            b.setAttribute('aria-pressed', String(act));
          });
          this.renderStories();
        };
      }
    },

    renderStories() {
      const grid = $('examplesCardsGrid');
      if (!grid) return;

      const q = window.normalizeArabic(state.searchQuery);
      const filtered = ALL_STORIES.filter((s) => {
        const valOk = state.storyValueFilter === 'all' || s.valueId === state.storyValueFilter;
        const catOk = state.storyCategoryFilter === 'all' || s.category === state.storyCategoryFilter;
        if (!valOk || !catOk) return false;
        if (!q) return true;
        const hay = window.normalizeArabic(`${s.valueName} ${s.typeLabel} ${s.title} ${s.story}`);
        return hay.includes(q);
      });

      const statsBadge = $('searchStatsBadge');
      if (statsBadge) {
        statsBadge.textContent = q
          ? `${filtered.length} قصة مطابقة`
          : `${filtered.length} قصة معروضة`;
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

      grid.innerHTML = filtered
        .map(
          (s) => `
          <article class="story-card spotlight-surface" style="--spot-color:${escapeHTML(s.valueAccent)}26; border-top-color:${escapeHTML(s.valueAccent)}66;">
            <div class="story-meta justify-between">
              <span class="story-val-chip" style="color:${escapeHTML(s.valueAccent)}; background:${escapeHTML(s.valueAccent)}16; border:1px solid ${escapeHTML(s.valueAccent)}40;">
                <span class="story-chip-icon">${getIconSVG(s.valueId)}</span>
                <span>${escapeHTML(s.valueName)}</span>
              </span>
              <span class="story-cat-chip">${escapeHTML(s.typeLabel)}</span>
            </div>
            <h3 class="story-heading">${escapeHTML(s.title)}</h3>
            <p class="story-body">${escapeHTML(s.story)}</p>
            <button type="button" class="story-action-btn" data-open-val="${escapeHTML(s.valueId)}" style="color:${escapeHTML(s.valueAccent)}">
              <span>فتح موسوعة وصوت «${escapeHTML(s.valueName)}»</span>
              <span aria-hidden="true">←</span>
            </button>
          </article>
        `
        )
        .join('');

      grid.onclick = (e) => {
        const btn = e.target.closest('[data-open-val]');
        if (btn) window.openStudio(btn.dataset.openVal);
      };

      if (typeof window.scanSpotlightSurfaces === 'function') {
        window.scanSpotlightSurfaces();
      }
    },

    renderEncyclopediaSelector() {
      const sel = $('encycSelector');
      if (!sel) return;
      sel.innerHTML = VALUES.map(
        (v) =>
          `<button type="button" class="filter-pill${v.id === state.activeEncycId ? ' active' : ''}" data-encyc-id="${escapeHTML(v.id)}" aria-pressed="${v.id === state.activeEncycId}">${escapeHTML(v.num)} • ${escapeHTML(v.name)}</button>`
      ).join('');

      sel.onclick = (e) => {
        const btn = e.target.closest('[data-encyc-id]');
        if (!btn) return;
        this.showEncyclopediaValue(btn.dataset.encycId);
      };
    },

    showEncyclopediaValue(id) {
      const v = getValueById(id);
      if (!v) return;
      state.activeEncycId = v.id;

      $$('[data-encyc-id]').forEach((b) => {
        const act = b.dataset.encycId === v.id;
        b.classList.toggle('active', act);
        b.setAttribute('aria-pressed', String(act));
      });

      const mainCard = $('encycMainCard');
      if (mainCard) {
        mainCard.style.background = v.surface || '';
        mainCard.style.borderColor = `${v.accent}55`;
      }

      const iconBox = $('encycIconBox');
      if (iconBox) {
        iconBox.innerHTML = getIconSVG(v.id);
        iconBox.style.color = v.accent;
        iconBox.style.background = `${v.accent}1F`;
        iconBox.style.borderColor = `${v.accent}4D`;
      }

      const setTxt = (elId, val) => {
        const el = $(elId);
        if (el) el.textContent = val || '';
      };

      setTxt('encycBadge', `القيمة ${v.num} • ${v.group === 'A' ? 'قيمنا الأساسية' : 'قيم التميز والريادة'}`);
      setTxt('encycTitle', v.name);
      setTxt('encycSubtitle', v.sub);
      setTxt('encycFullText', v.text);
      setTxt('encycEvidence', v.evidence);
      renderEvidenceSource('encycEvidence', v.id);
      setTxt('encycP1', v.p1);
      setTxt('encycP2', v.p2);
      setTxt('encycP3', v.p3);

      const benList = $('encycBenefitsList');
      if (benList) {
        benList.innerHTML = (v.benefits || [])
          .map((b) => {
            if (typeof b === 'object' && b !== null) {
              return `
                <li class="encyc-item">
                  <div class="encyc-item-title" style="color:${escapeHTML(v.accent)}">✦ ${escapeHTML(b.title)}</div>
                  <p class="encyc-item-desc">${escapeHTML(b.desc)}</p>
                </li>
              `;
            }
            return `<li class="encyc-item"><p class="encyc-item-desc">✦ ${escapeHTML(b)}</p></li>`;
          })
          .join('');
      }

      const stepsList = $('encycStepsList');
      if (stepsList) {
        stepsList.innerHTML = (v.steps || [])
          .map(
            (st, idx) => `
              <li class="encyc-step-row">
                <span class="encyc-step-num" style="background:${escapeHTML(v.accent)}22; color:${escapeHTML(v.accent)}; border:1px solid ${escapeHTML(v.accent)}45;">${idx + 1}</span>
                <span>${escapeHTML(st)}</span>
              </li>
            `
          )
          .join('');
      }
    },

    renderComparisonGrid() {
      const grid = $('comparisonGrid');
      if (!grid) return;

      const q = window.normalizeArabic(state.searchQuery);
      const list = VALUES.filter((v) => {
        if (!q) return true;
        const hay = window.normalizeArabic(`${v.name} ${v.sub} ${v.withVal} ${v.withoutVal}`);
        return hay.includes(q);
      });

      grid.innerHTML = list
        .map(
          (v) => `
          <article class="comparison-card is-preferred spotlight-surface" style="--spot-color:${escapeHTML(v.accent)}24; border-inline-start-color:${escapeHTML(v.accent)};">
            <div class="comp-header">
              <div class="comp-title-group">
                <span class="comp-icon" style="color:${escapeHTML(v.accent)}; background:${escapeHTML(v.accent)}16;">${getIconSVG(v.id)}</span>
                <div>
                  <h3 class="comp-name">${escapeHTML(v.name)}</h3>
                  <span class="comp-sub">${escapeHTML(v.sub)}</span>
                </div>
              </div>
              <button type="button" class="comp-open-btn" data-comp-open="${escapeHTML(v.id)}" style="color:${escapeHTML(v.accent)}">استمع للقيمة</button>
            </div>

            <div class="comp-box comp-box-pos">
              <div class="comp-box-label">✓ عند تطبيق القيمة في حياتنا ومدرستنا</div>
              <p>${escapeHTML(v.withVal)}</p>
            </div>

            <div class="comp-box comp-box-neg">
              <div class="comp-box-label">✕ عند غياب القيمة أو إهمالها</div>
              <p>${escapeHTML(v.withoutVal)}</p>
            </div>
          </article>
        `
        )
        .join('');

      grid.onclick = (e) => {
        const btn = e.target.closest('[data-comp-open]');
        if (btn) window.openStudio(btn.dataset.compOpen);
      };

      if (typeof window.scanSpotlightSurfaces === 'function') {
        window.scanSpotlightSurfaces();
      }
    }
  });

  window.openCurrentEncycAudio = () => {
    window.openStudio(state.activeEncycId);
  };

  // ==========================================================================
  // 8. FULLSCREEN VALUE STUDIO + THE VALUE'S VOICE MESSAGE
  // One short control, always shown: «تشغيل» → «إيقاف» with «إعادة» beside it.
  // It plays the file audio/<value-id>.mp3 when it exists (added by hand, no
  // in-app recorder), otherwise reads the message aloud with the device's
  // Arabic voice (built into the iPad). With neither, the button still works
  // as a silent timed preview and a short note says no audio file was added.
  // ==========================================================================
  const AudioStudio = (window.AudioStudio = {
    diskAvailableIds: new Set(),
    currentValue: null,
    source: 'silent', // 'file' | 'speech' | 'silent' (no file, no Arabic voice)
    status: 'idle', // 'idle' | 'playing' | 'paused'
    isPlaying: false,
    _playSessionId: 0,
    _silentTimer: 0,
    _silentLeft: 0,
    _silentSince: 0,

    async init() {
      await this.checkDiskAudioManifest();

      // Safari/Chrome load their voice list late: switch to the Arabic voice
      // as soon as it appears if the open value had nothing else to play.
      window.speechSynthesis?.addEventListener?.('voiceschanged', () => {
        if (this.currentValue && this.source === 'silent' && this.status === 'idle') {
          this.prepareAudio(this.currentValue);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && $('studioModal')?.classList.contains('active')) {
          this.closeStudio();
        }
      });

      const studioModal = $('studioModal');
      if (studioModal) {
        studioModal.addEventListener('click', (e) => {
          if (e.target === studioModal) this.closeStudio();
        });
      }
    },

    // Which values have an audio file? 1) ids listed in audio/audio_manifest.json,
    // 2) any audio/<id>.mp3 that simply exists (auto-detected, no list to edit).
    async checkDiskAudioManifest() {
      try {
        const res = await fetch('./audio/audio_manifest.json', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.available)) {
            data.available.forEach((id) => this.diskAvailableIds.add(String(id)));
          }
        }
      } catch (_) {}

      await Promise.all(
        VALUES.filter((v) => !this.diskAvailableIds.has(v.id)).map(async (v) => {
          try {
            const res = await fetch(v.file || `./audio/${v.id}.mp3`, { method: 'HEAD', cache: 'no-store' });
            // Must really be audio: some hosts (Cloudflare Pages without a
            // 404.html) answer a missing file with the home page and 200 OK.
            const type = res.headers.get('content-type') || '';
            if (res.ok && /^audio\//i.test(type)) this.diskAvailableIds.add(v.id);
          } catch (_) {}
        })
      );
    },

    openStudio(id) {
      const val = getValueById(id);
      if (!val) return;
      this.stopPlayback();
      window.QuranRecite?.stop(); // a recitation from the page or another value stops
      this.currentValue = val;
      state.currentStudioId = val.id;

      const setTxt = (elId, t) => {
        const el = $(elId);
        if (el) el.textContent = t || '';
      };

      setTxt('modalNum', val.num);
      setTxt('modalTitle', val.name);
      setTxt('modalTagline', val.sub);
      setTxt('modalEvidenceText', val.evidence);
      renderEvidenceSource('modalEvidenceText', val.id);
      setTxt('modalWithValue', val.withVal);
      setTxt('modalWithoutValue', val.withoutVal);

      const aura = $('modalAura');
      if (aura) aura.style.background = val.accent;

      const messageBox = $('modalMessageBox');
      if (messageBox) {
        messageBox.style.setProperty('--card-accent', val.accent);
        messageBox.style.borderColor = `${val.accent}55`;
      }

      const iconWrap = $('modalIconWrap');
      if (iconWrap) {
        iconWrap.innerHTML = getIconSVG(val.id);
        iconWrap.style.color = val.accent;
      }

      // The value's message as plain, readable text.
      setTxt('editorialLyrics', val.text);

      // Populate 3 real-life stories inside modal
      const exGrid = $('modalExamplesGrid');
      if (exGrid) {
        exGrid.innerHTML = (val.examples || [])
          .map(
            (ex) => `
            <article class="studio-story-card">
              <span class="studio-story-type" style="color:${escapeHTML(val.accent)}">${escapeHTML(ex.type)}</span>
              <h4 class="studio-story-title">${escapeHTML(ex.title)}</h4>
              <p class="studio-story-body">${escapeHTML(ex.story)}</p>
            </article>
          `
          )
          .join('');
      }

      // Populate structured benefits inside modal
      const benEl = $('modalBenefitsList');
      if (benEl) {
        benEl.innerHTML = (val.benefits || [])
          .map((b) =>
            typeof b === 'object' && b !== null
              ? `<li><strong style="color:${escapeHTML(val.accent)}">✦ ${escapeHTML(b.title)}:</strong> ${escapeHTML(b.desc)}</li>`
              : `<li>✦ ${escapeHTML(b)}</li>`
          )
          .join('');
      }

      // Populate 4 daily steps inside modal
      const stepsEl = $('modalStepsList');
      if (stepsEl) {
        stepsEl.innerHTML = (val.steps || [])
          .map((s, idx) => `<li><strong style="color:${escapeHTML(val.accent)}">${idx + 1}.</strong> ${escapeHTML(s)}</li>`)
          .join('');
      }

      const modal = $('studioModal');
      if (modal) {
        window.PerfTier?.watch(900);
        modal.classList.add('active');
        document.body.classList.add('modal-open');
      }

      // Ready to play, but nothing starts until the visitor presses «تشغيل».
      this.prepareAudio(val);
    },

    closeStudio() {
      this.stopPlayback();
      window.QuranRecite?.stop(); // closing the window also stops a verse recitation
      $('studioModal')?.classList.remove('active');
      if (!$('storyReaderModal')?.classList.contains('active')) {
        document.body.classList.remove('modal-open');
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
      return (
        voices.find((v) => /^ar[-_]SA$/i.test(v.lang)) ||
        voices.find((v) => /^ar(?:[-_]|$)/i.test(v.lang)) ||
        null
      );
    },

    pickSource(val) {
      if (this.diskAvailableIds.has(val.id)) return 'file';
      if (this.arabicVoice()) return 'speech';
      return 'silent';
    },

    prepareAudio(val) {
      this.stopPlayback();
      this.source = this.pickSource(val);
      this.showNote('');
    },

    showNote(text) {
      const note = $('audioNote');
      if (!note) return;
      note.textContent = text;
      note.hidden = !text;
    },

    toggleAudioPlayback() {
      if (this.status === 'playing') this.pauseAudio();
      else if (this.status === 'paused') this.resumeAudio();
      else this.playFromStart();
    },

    replayAudio() {
      this.playFromStart();
    },

    playFromStart() {
      const val = this.currentValue;
      if (!val) return;
      this.stopPlayback();
      // The voice list may have arrived since the value was opened.
      if (this.source === 'silent') this.source = this.pickSource(val);
      const session = this._playSessionId;
      const finished = () => {
        if (session === this._playSessionId) this.setStatus('idle');
      };

      if (this.source === 'file') {
        const player = $('realAudioPlayer');
        if (!player) return;
        player.src = val.file || `./audio/${val.id}.mp3`;
        player.onended = finished;
        player.onerror = () => {
          if (session !== this._playSessionId) return;
          // File missing or unreadable: fall back to the Arabic voice / preview
          // (and don't restart it if the visitor already paused).
          this.source = this.arabicVoice() ? 'speech' : 'silent';
          if (this.status === 'playing') this.playFromStart();
          else this.setStatus('idle');
        };
        player.play().catch((err) => {
          if (session === this._playSessionId && err?.name !== 'AbortError') this.setStatus('idle');
        });
        this.setStatus('playing');
        return;
      }

      if (this.source === 'speech') {
        const synth = window.speechSynthesis;
        const voice = this.arabicVoice();
        const utterance = new SpeechSynthesisUtterance(String(val.text || ''));
        utterance.voice = voice;
        utterance.lang = voice?.lang || 'ar-SA';
        utterance.rate = 1;
        utterance.onend = finished;
        utterance.onerror = finished;
        synth.speak(utterance);
        this.setStatus('playing');
        return;
      }

      // Nothing to hear on this device: run the control for the message's
      // length (about 0.45 s a word) and say why it is silent.
      const words = String(val.text || '').split(/\s+/).filter(Boolean).length;
      this._silentLeft = Math.max(6000, words * 450);
      this._silentDone = finished;
      this.showNote(`لا يوجد ملف صوتي لهذه القيمة بعد — أضِفه في مجلد audio باسم ${val.id}.mp3`);
      this.runSilent();
      this.setStatus('playing');
    },

    runSilent() {
      clearTimeout(this._silentTimer);
      this._silentSince = performance.now();
      this._silentTimer = setTimeout(() => this._silentDone?.(), this._silentLeft);
    },

    pauseAudio() {
      if (this.source === 'file') $('realAudioPlayer')?.pause();
      else if (this.source === 'speech') window.speechSynthesis?.pause();
      else {
        clearTimeout(this._silentTimer);
        this._silentLeft = Math.max(0, this._silentLeft - (performance.now() - this._silentSince));
      }
      this.setStatus('paused');
    },

    resumeAudio() {
      if (this.source === 'file') $('realAudioPlayer')?.play().catch(() => {});
      else if (this.source === 'speech') window.speechSynthesis?.resume();
      else this.runSilent();
      this.setStatus('playing');
    },

    // «تشغيل» ⇄ «إيقاف»; «إعادة» appears beside it once the message has started.
    setStatus(status) {
      this.status = status;
      this.isPlaying = status === 'playing';
      // the verse recitation pauses while the value message plays
      if (this.isPlaying) window.QuranRecite?.pauseIfPlaying();
      $('studioAudioControls')?.classList.toggle('is-playing', this.isPlaying);
      const label = $('playStateText');
      if (label) label.textContent = this.isPlaying ? 'إيقاف' : 'تشغيل';
      $('audioPlayBtn')?.setAttribute('aria-label', this.isPlaying ? 'إيقاف رسالة القيمة' : 'تشغيل رسالة القيمة');
      const replay = $('audioReplayBtn');
      if (replay) replay.hidden = status === 'idle';
    },

    stopPlayback() {
      this._playSessionId += 1;
      clearTimeout(this._silentTimer);
      const player = $('realAudioPlayer');
      if (player) {
        player.onended = null;
        player.onerror = null;
        player.pause();
      }
      const synth = window.speechSynthesis;
      if (synth) {
        // Chrome stays paused after cancel(), which would mute the next speak().
        if (synth.paused) synth.resume();
        if (synth.speaking || synth.pending) synth.cancel();
      }
      this.setStatus('idle');
    },
  });

  window.openStudio = (id) => AudioStudio.openStudio(id);
  window.closeStudio = () => AudioStudio.closeStudio();
  window.navigateModal = (dir) => AudioStudio.navigateModal(dir);
  window.toggleAudioPlayback = () => AudioStudio.toggleAudioPlayback();
  window.replayAudio = () => AudioStudio.replayAudio();

  // ==========================================================================
  // 9. BOOTSTRAP PLATFORM AT LOCKED 60Hz
  // ==========================================================================
  window.bootAlIlmPlatform = async () => {
    OrbitPhysics.init();
    SearchAndFilter.init();
    window.initSpotlightShader();
    await AudioStudio.init();

    startHadithDecorator();

    // Restore hash route if present
    const initialHash = (window.location.hash || '').replace('#', '').trim();
    if (initialHash && Object.prototype.hasOwnProperty.call(VIEW_MAP, initialHash)) {
      AppRouter.switchView(initialHash, false);
    } else {
      AppRouter.switchView('all', false);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.bootAlIlmPlatform, { once: true });
  } else {
    window.bootAlIlmPlatform();
  }
})();
