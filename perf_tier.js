/* ==========================================================================
 * Device performance levels — loaded first, in <head>, before the styles.
 *
 * Every device gets the motion it can play smoothly:
 *   high   — iPad, capable desktops/laptops, the newest phones: the full
 *            exhibit (depth-of-field blur on the side cards, the 3D lift of
 *            the centre card, colour-easing glows, staggered entrances).
 *   medium — most phones (A13–A15 iPhones, mid-range Android), Android
 *            tablets, older laptops: the same page and motion, without live
 *            blur filters, with fewer cards drawn in the 3D ring.
 *   low    — entry-level phones, smart TVs, interactive classroom boards
 *            (BenQ and the like), browsers without a GPU: only cheap GPU
 *            motion (move / fade), shorter animations, no glows, and solid
 *            panels instead of the live glass blur.
 *
 * The level starts as a guess from the kind of device, is refined once by a
 * short CPU check after the page has loaded (remembered for a week), and is
 * stepped down live if real animations keep dropping frames.
 * It sets <html data-perf="high|medium|low" data-device="…">; the CSS
 * (stage3_astra_upgrade.css section 19) and the scripts read it.
 * Test any level on any device with ?perf=high|medium|low (?perf=auto resets).
 * ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var RANK = { low: 0, medium: 1, high: 2 };
  var NAMES = ['low', 'medium', 'high'];
  var STORE = 'alm_perf_v1';
  var FORCE = 'alm_perf_force';
  var WEEK = 7 * 864e5;

  var nav = navigator;
  var ua = nav.userAgent || '';
  var touchPoints = nav.maxTouchPoints || 0;
  var sw = Math.min(screen.width, screen.height);
  var sh = Math.max(screen.width, screen.height);

  // iPadOS Safari presents itself as a Mac; only the touch screen tells.
  var isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && (touchPoints > 1 || 'ontouchend' in document));
  var isIPhone = /iPhone|iPod/.test(ua);
  var isTV = /SmartTV|SMART-TV|Tizen|Web0S|WebOS|NetCast|BRAVIA|HbbTV|CrKey|GoogleTV|Android TV|AFT[A-Z]|Roku|VIDAA|Viera/i.test(ua);
  var isAndroid = /Android/.test(ua);
  var isPhone = isIPhone || (isAndroid && /Mobile/.test(ua)) || (!isIPad && touchPoints > 0 && sw < 600);
  // Interactive classroom displays (BenQ, ViewSonic, Promethean, SMART, Newline,
  // MAXHUB …): a big Android or Linux touch screen driven by a phone-class chip
  // at 4K — or a board that names itself. They get the light level.
  var isBoard =
    !isTV &&
    !isPhone &&
    (/BenQ|\bR[MPE]\d{4}|ViewBoard|ViewSonic|Promethean|ActivPanel|SMART ?Board|Newline|MAXHUB|Clevertouch|Boxlight|i3TOUCH|IdeaHub|Hitevision|Horion|Optoma|InFocus|\bIFP/i.test(ua) ||
      (isAndroid && !/Mobile/.test(ua) && sh >= 1800) ||
      (/Linux/.test(ua) && !isAndroid && !/CrOS/.test(ua) && touchPoints > 0 && sh >= 1800));
  var device = isIPad ? 'ipad' : isTV ? 'tv' : isBoard ? 'board' : isPhone ? 'phone' : isAndroid ? 'tablet' : 'computer';

  // iPhones by screen size: every model with a 375×667, 375×812, 390×844,
  // 414×896 or 428×926 screen has an A15 chip or older (iPhone 8 to 14, SE);
  // the newer sizes (393×852, 402×874, 430×932, 440×956 …) are A16 and up.
  var OLDER_IPHONE = { '320x568': 1, '375x667': 1, '414x736': 1, '375x812': 1, '414x896': 1, '390x844': 1, '428x926': 1 };
  var newerIPhone = isIPhone && !OLDER_IPHONE[sw + 'x' + sh];

  var cores = nav.hardwareConcurrency || 0;
  var memory = nav.deviceMemory || 0; // Chrome / Android only
  var saveData = !!(nav.connection && nav.connection.saveData);

  function read(storage, key) {
    try {
      return window[storage].getItem(key);
    } catch (e) {
      return null;
    }
  }
  function write(storage, key, value) {
    try {
      if (value === null) window[storage].removeItem(key);
      else window[storage].setItem(key, value);
    } catch (e) {}
  }

  // Manual override (this tab only).
  var asked = /[?&]perf=(high|medium|low|auto)\b/.exec(location.search);
  if (asked) write('sessionStorage', FORCE, asked[1] === 'auto' ? null : asked[1]);
  var forced = RANK.hasOwnProperty(read('sessionStorage', FORCE)) ? read('sessionStorage', FORCE) : null;

  var saved = null;
  try {
    saved = JSON.parse(read('localStorage', STORE) || 'null');
    if (!saved || saved.ua !== ua || Date.now() - saved.at > WEEK) saved = null;
  } catch (e) {
    saved = null;
  }

  // First guess, from the kind of device only.
  function guess() {
    if (device === 'ipad') return 2;
    if (device === 'tv' || device === 'board') return 0;
    if (isIPhone) return newerIPhone ? 2 : 1;
    if (device === 'phone' || device === 'tablet') {
      if ((memory && memory <= 3) || (cores && cores <= 4)) return 0;
      return 1;
    }
    if ((memory && memory <= 2) || (cores && cores <= 2)) return 0;
    if ((memory && memory <= 4) || (cores && cores <= 4)) return 1;
    return 2;
  }

  // Refined with the CPU check (cpu: 0 slow, 1 mid, 2 fast) and, on
  // computers / TVs / Android tablets, whether the browser draws without a GPU.
  function refine(level, cpu, noGpu) {
    if (cpu == null) return level;
    if (device === 'ipad') return cpu === 0 ? 1 : 2; // iPad stays at full quality
    if (isIPhone) return Math.min(level, cpu); // low-power mode or an old iPhone
    // a smart board fills a 4K panel with a phone's graphics chip: always light
    // (smooth beats fancy on a classroom screen; ?perf=medium tries more)
    if (device === 'board') return 0;
    if (noGpu) return 0;
    var l = cpu;
    if (device === 'tv') l = Math.min(l, 1);
    if (memory && memory <= 2) l = 0;
    else if (memory && memory <= 4) l = Math.min(l, 1);
    return l;
  }

  var cpu = saved ? saved.cpu : null;
  var noGpu = saved ? !!saved.noGpu : false;
  var cap = saved && saved.cap != null ? saved.cap : 2; // set by the frame watch
  var minLevel = device === 'ipad' ? 1 : 0;

  function compute() {
    if (forced) return RANK[forced];
    var l = refine(guess(), cpu, noGpu);
    if (saveData) l = Math.min(l, 1);
    return Math.max(minLevel, Math.min(l, cap));
  }

  var level = compute();
  var api = (window.PerfTier = {
    level: NAMES[level],
    device: device,
    forced: !!forced,
    /** motion length multiplier for scripted animations */
    motion: 1,
    watch: watch,
    set: function (name) {
      if (RANK.hasOwnProperty(name)) apply(RANK[name], 'manual');
    }
  });

  function apply(next, reason) {
    level = next;
    api.level = NAMES[level];
    api.motion = level === 0 ? 0.85 : 1;
    root.setAttribute('data-perf', api.level);
    root.setAttribute('data-device', device);
    if (reason) {
      try {
        window.dispatchEvent(new CustomEvent('perfchange', { detail: { level: api.level, reason: reason } }));
      } catch (e) {}
    }
  }
  apply(level, null);

  function save() {
    write('localStorage', STORE, JSON.stringify({ ua: ua, at: Date.now(), cpu: cpu, noGpu: noGpu, cap: cap }));
  }

  // ---- CPU check (once a week, after load, in short idle slices) ---------
  // ~8 ms of mixed number / object / sorting work on an Apple M2 or a recent
  // desktop; the best of a few rounds counts (the first one warms the JIT).
  function cpuRound() {
    var t0 = performance.now();
    var x = 0;
    var arr = new Float64Array(2048);
    for (var i = 0; i < 360000; i++) {
      x += Math.sqrt(i) * ((i & 7) - 3.5);
      arr[i & 2047] = x;
    }
    var o = [];
    for (var k = 0; k < 18000; k++) o.push({ a: (k * 7919) % 18013, b: 'v' + k });
    o.sort(function (p, q) {
      return p.a - q.a;
    });
    var s = 0;
    for (var j = 0; j < o.length; j += 97) s += o[j].b.length;
    api._sink = s + arr[5];
    return performance.now() - t0;
  }

  function softwareRendering() {
    try {
      var c = document.createElement('canvas');
      var opts = { failIfMajorPerformanceCaveat: true };
      var gl = c.getContext('webgl', opts) || c.getContext('experimental-webgl', opts);
      if (!gl) return true;
      var info = gl.getExtension('WEBGL_debug_renderer_info');
      var name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Basic Render|Software/i.test(name);
    } catch (e) {
      return false;
    }
  }

  function measure() {
    var best = Infinity;
    var round = 0;
    function next() {
      if (document.hidden) return setTimeout(next, 1000);
      var t = cpuRound();
      if (round > 0) best = Math.min(best, t);
      round++;
      // clearly slow already: no need to keep the device busy
      if (round < 4 && !(round > 1 && best > 30)) return setTimeout(next, 60);
      cpu = best <= 11 ? 2 : best <= 26 ? 1 : 0;
      if (device === 'computer' || device === 'tv' || device === 'tablet' || device === 'board') noGpu = softwareRendering();
      api.cpuMs = Math.round(best * 10) / 10;
      save();
      var l = compute();
      if (l !== level) apply(l, 'cpu');
    }
    next();
  }

  if (!forced && cpu == null) {
    var start = function () {
      setTimeout(measure, 1200);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }

  // ---- Frame watch -------------------------------------------------------
  // The page's animations call PerfTier.watch(ms) while they play (the
  // section glide, the bar, the card ring, the value window, scrolling).
  // Frames are counted against 60 Hz, so 90/120 Hz screens never look slow.
  // Three rough windows out of the last six step the level down one notch
  // (remembered for a week; on the iPad only for this visit, and never
  // below medium).
  var bornAt = performance.now();
  var until = 0;
  var rafId = 0;
  var last = 0;
  var deltas = [];
  var history = [];

  function frame(now) {
    if (last) deltas.push(now - last);
    last = now;
    if (now < until && !document.hidden) {
      rafId = requestAnimationFrame(frame);
      return;
    }
    rafId = 0;
    last = 0;
    judge(deltas);
    deltas = [];
  }

  function judge(d) {
    if (d.length < 20 || document.hidden) return;
    // An even 30 fps is a capped screen rate (Low Power Mode, a 30 Hz TV),
    // not stutter: the device isn't struggling, so it is not judged.
    var sorted = d.slice().sort(function (a, b) {
      return a - b;
    });
    var median = sorted[sorted.length >> 1];
    if (median > 24) {
      var steady = 0;
      for (var k = 0; k < d.length; k++) if (Math.abs(d[k] - median) < 4) steady++;
      if (steady / d.length > 0.8) return;
    }
    var missed = 0;
    for (var i = 0; i < d.length; i++) missed += Math.max(0, Math.round(d[i] / 16.7) - 1);
    var dropped = missed / (missed + d.length);
    api.lastDropped = Math.round(dropped * 100);
    history.push(dropped > (device === 'ipad' ? 0.3 : 0.22));
    if (history.length > 6) history.shift();
    var rough = 0;
    for (var h = 0; h < history.length; h++) rough += history[h] ? 1 : 0;
    if (rough >= 3 && level > minLevel) {
      history = [];
      cap = level - 1;
      // The exhibition iPad starts every visit at full quality again.
      if (device !== 'ipad') save();
      apply(cap, 'frames');
    }
  }

  function watch(ms) {
    if (forced || document.hidden) return;
    var now = performance.now();
    if (now - bornAt < 3000) return; // the page is still settling
    until = Math.max(until, now + (ms || 1000));
    if (!rafId) {
      last = 0;
      rafId = requestAnimationFrame(frame);
    }
  }

  // ---- ?diag=1 : what this screen is, for checking a classroom board or TV
  // from a photo (browser, level, screen, frames per second). Nothing else.
  if (/[?&]diag=1\b/.test(location.search)) {
    var showDiag = function () {
      var box = document.createElement('div');
      box.setAttribute('dir', 'ltr');
      box.style.cssText =
        'position:fixed;z-index:2147483647;left:8px;bottom:8px;max-width:min(96vw,640px);padding:10px 12px;border-radius:10px;' +
        'background:rgba(0,0,0,.88);color:#d1fae5;font:12px/1.5 monospace;white-space:pre-wrap;pointer-events:none';
      document.body.appendChild(box);
      var frames = 0;
      var t0 = performance.now();
      var fps = '…';
      var count = function () {
        frames++;
        var now = performance.now();
        if (now - t0 >= 2000) {
          fps = Math.round((frames * 1000) / (now - t0));
          frames = 0;
          t0 = now;
          paint();
        }
        requestAnimationFrame(count);
      };
      var paint = function () {
        box.textContent =
          navigator.userAgent +
          '\nlevel ' + api.level + ' | device ' + device + (window.ALM_LEGACY ? ' | older-browser scripts' : '') +
          '\nscreen ' + screen.width + 'x' + screen.height + ' @' + (window.devicePixelRatio || 1) +
          ' | window ' + innerWidth + 'x' + innerHeight +
          '\ncores ' + (cores || '?') + ' | memory ' + (memory || '?') + ' GB | cpu ' + (api.cpuMs || '?') + ' ms' +
          (noGpu ? ' | no GPU' : '') + ' | ' + fps + ' fps';
      };
      paint();
      requestAnimationFrame(count);
    };
    if (document.body) showDiag();
    else document.addEventListener('DOMContentLoaded', showDiag);
  }
})();
