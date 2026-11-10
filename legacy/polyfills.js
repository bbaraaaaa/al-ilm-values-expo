/* ==========================================================================
 * Older browsers only (loaded by index.html when the browser cannot read the
 * site's modern scripts — the built-in browsers of many classroom boards and
 * smart TVs, Chrome older than 80). Small stand-ins for the few newer
 * features the site uses; every one is skipped where the browser has it.
 * Plain ES5 on purpose.
 * ========================================================================== */
(function () {
  'use strict';

  function replaceChildren() {
    while (this.lastChild) this.removeChild(this.lastChild);
    for (var i = 0; i < arguments.length; i++) {
      var node = arguments[i];
      this.appendChild(typeof node === 'string' ? document.createTextNode(node) : node);
    }
  }
  [Element.prototype, Document.prototype, DocumentFragment.prototype].forEach(function (proto) {
    if (!proto.replaceChildren) proto.replaceChildren = replaceChildren;
  });

  if (!Array.prototype.flat) {
    Array.prototype.flat = function (depth) {
      var d = depth === undefined ? 1 : Number(depth) || 0;
      var out = [];
      (function walk(list, level) {
        for (var i = 0; i < list.length; i++) {
          if (Array.isArray(list[i]) && level > 0) walk(list[i], level - 1);
          else out.push(list[i]);
        }
      })(this, d);
      return out;
    };
  }

  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function (fn, thisArg) {
      return Array.prototype.map.call(this, fn, thisArg).flat(1);
    };
  }

  if (!Object.fromEntries) {
    Object.fromEntries = function (entries) {
      var obj = {};
      Array.from(entries).forEach(function (pair) {
        obj[pair[0]] = pair[1];
      });
      return obj;
    };
  }

  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (find, value) {
      if (find instanceof RegExp) return this.replace(find, value);
      return this.split(String(find)).join(value);
    };
  }

  if (typeof window.globalThis === 'undefined') window.globalThis = window;

  if (!window.queueMicrotask) {
    window.queueMicrotask = function (fn) {
      Promise.resolve().then(fn);
    };
  }

  if (window.Promise && !Promise.prototype.finally) {
    Promise.prototype.finally = function (fn) {
      return this.then(
        function (v) {
          return Promise.resolve(fn()).then(function () {
            return v;
          });
        },
        function (e) {
          return Promise.resolve(fn()).then(function () {
            throw e;
          });
        }
      );
    };
  }

  // Size changes: checked on window resize and once a second (enough for the
  // page's own uses: the section bar's sliding pill and the ring's size).
  if (!window.ResizeObserver) {
    var watchers = [];
    var check = function () {
      watchers.forEach(function (w) {
        var changed = [];
        w.targets.forEach(function (t) {
          var r = t.el.getBoundingClientRect();
          if (r.width !== t.w || r.height !== t.h) {
            t.w = r.width;
            t.h = r.height;
            changed.push({ target: t.el, contentRect: r });
          }
        });
        if (changed.length) w.cb(changed, w);
      });
    };
    window.addEventListener('resize', check);
    setInterval(check, 1000);
    window.ResizeObserver = function (cb) {
      this.cb = cb;
      this.targets = [];
      watchers.push(this);
    };
    window.ResizeObserver.prototype.observe = function (el) {
      this.targets.push({ el: el, w: -1, h: -1 });
      setTimeout(check, 0);
    };
    window.ResizeObserver.prototype.unobserve = function (el) {
      this.targets = this.targets.filter(function (t) {
        return t.el !== el;
      });
    };
    window.ResizeObserver.prototype.disconnect = function () {
      this.targets = [];
    };
  }
})();
