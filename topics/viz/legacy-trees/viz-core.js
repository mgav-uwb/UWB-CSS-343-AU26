/* CSS 343 · L03: shared visualizer core (used by every viz/*.js demo).
   No dependencies. Exposes window.VizCore. Demos register an init via
   (window.__vizInits = window.__vizInits||[]).push(initFn); index.html runs them
   after Reveal.initialize().then(...). Conventions match bst.js (canvas + the
   .algo-viz / .viz-controls / .viz-status markup styled by viz.css). */
(function () {
  "use strict";

  var COLORS = {
    ink: "#1a1c22", accent: "#7c5cff", hit: "#0a7d4d", miss: "#b3261e",
    warn: "#d39a00", link: "#b9c0d0", ringIdle: "#9aa3b5", fillIdle: "#fff",
    dim: "#9aa3b5", blue: "#2563eb", green: "#16a34a", purple: "#7c3aed",
    orange: "#d97706", red: "#dc2626", paleBlue: "#eaf1ff", paleGreen: "#e7f7ee",
    paleViolet: "#f3f0ff", paleAmber: "#fff5e0", paleRed: "#fdeaea"
  };

  // ---- canvas -------------------------------------------------------------
  function makeCanvas(el, w, h) {
    var cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    cv.style.width = w + "px"; cv.style.maxWidth = "100%"; cv.style.height = "auto";
    el.appendChild(cv);
    return { canvas: cv, ctx: cv.getContext("2d"), W: w, H: h };
  }

  // ---- controls -----------------------------------------------------------
  // html = inner buttons/inputs; a .viz-status div is appended automatically.
  function makeControls(el, html) {
    var d = document.createElement("div");
    d.className = "viz-controls";
    d.innerHTML = html + '<div class="viz-status"></div>';
    el.appendChild(d);
    var status = d.querySelector(".viz-status");
    return {
      el: d, input: d.querySelector("input"),
      btn: function (act) { return d.querySelector('[data-act="' + act + '"]'); },
      setStatus: function (m) { status.textContent = m || ""; },
      on: function (fn) {
        d.addEventListener("click", function (e) {
          var a = e.target.getAttribute && e.target.getAttribute("data-act");
          if (a) fn(a, e);
        });
      }
    };
  }

  // ---- layout: BINARY tree (.left/.right). x by in-order index, y by depth.
  // writes .x,.y,.depth on every node. returns {n, h}.
  function layoutBinary(root, W, H, opt) {
    opt = opt || {}; var M = opt.margin || 30, LEV = opt.level || 50, TOP = (opt.top != null ? opt.top : M);
    var idx = 0, maxD = 0, n = 0;
    (function d(t, dp) { if (!t) return; t.depth = dp; if (dp > maxD) maxD = dp; n++; d(t.left, dp + 1); d(t.right, dp + 1); })(root, 0);
    var dx = n > 1 ? (W - 2 * M) / (n - 1) : 0;
    (function ino(t) { if (!t) return; ino(t.left); t.x = (n > 1 ? M + idx * dx : W / 2); idx++; t.y = TOP + t.depth * LEV; ino(t.right); })(root);
    return { n: n, h: maxD };
  }

  // ---- layout: GENERAL tree. getCh(node) -> array of children.
  // x centers a parent over its children; leaves are spaced evenly. returns {leaves,h}.
  function layoutGeneral(root, getCh, W, H, opt) {
    opt = opt || {}; var M = opt.margin || 30, LEV = opt.level || 56, TOP = (opt.top != null ? opt.top : M), leaf = 0, maxD = 0;
    (function pos(t, dp) {
      t.depth = dp; if (dp > maxD) maxD = dp; var ch = getCh(t) || [];
      if (!ch.length) { t._lx = leaf++; }
      else { ch.forEach(function (c) { pos(c, dp + 1); }); t._lx = (ch[0]._lx + ch[ch.length - 1]._lx) / 2; }
    })(root, 0);
    var span = Math.max(1, leaf - 1), dx = (W - 2 * M) / span;
    (function set(t) { t.x = (leaf > 1 ? M + t._lx * dx : W / 2); t.y = TOP + t.depth * LEV; (getCh(t) || []).forEach(set); })(root);
    return { leaves: leaf, h: maxD };
  }

  // ---- draw a tree. opt:
  //   r           node radius (default 15)
  //   getCh       children accessor (default binary: [left,right])
  //   colorOf(t)  -> {fill,ring,text,ringWidth} | null  (per-node styling)
  //   edgeColor(parent,child) -> css | null
  //   linkColor, linkWidth, font, labelOf(t)
  //   nullLinks   true → draw short stubs where a binary child is null
  function drawTree(ctx, root, opt) {
    opt = opt || {}; var R = opt.r || 15, binary = !opt.getCh;
    function kids(t) { return opt.getCh ? (opt.getCh(t) || []) : [t.left, t.right].filter(Boolean); }
    ctx.lineWidth = opt.linkWidth || 1.5;
    (function edges(t) {
      if (!t) return;
      kids(t).forEach(function (k) {
        ctx.strokeStyle = (opt.edgeColor && opt.edgeColor(t, k)) || opt.linkColor || COLORS.link;
        ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(k.x, k.y); ctx.stroke(); edges(k);
      });
    })(root);
    if (binary && opt.nullLinks) {
      ctx.strokeStyle = opt.linkColor || COLORS.link; ctx.lineWidth = 1;
      (function stubs(t) {
        if (!t) return;
        [["left", -0.6], ["right", 0.6]].forEach(function (p) {
          if (!t[p[0]]) { ctx.beginPath(); ctx.moveTo(t.x, t.y + R); ctx.lineTo(t.x + p[1] * R, t.y + R + 12); ctx.stroke(); }
        });
        stubs(t.left); stubs(t.right);
      })(root);
    }
    (function nodes(t) {
      if (!t) return;
      var co = (opt.colorOf && opt.colorOf(t)) || {};
      ctx.beginPath(); ctx.arc(t.x, t.y, R, 0, 2 * Math.PI);
      ctx.fillStyle = co.fill || COLORS.fillIdle; ctx.fill();
      ctx.lineWidth = co.ringWidth || 2; ctx.strokeStyle = co.ring || COLORS.ringIdle; ctx.stroke();
      ctx.fillStyle = co.text || COLORS.ink;
      ctx.font = opt.font || "600 14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(opt.labelOf ? opt.labelOf(t) : String(t.key), t.x, t.y);
      kids(t).forEach(nodes);
    })(root);
  }

  // ---- small helpers ------------------------------------------------------
  function clear(ctx, W, H) { ctx.clearRect(0, 0, W, H); }
  function emptyMsg(ctx, W, H, msg) {
    ctx.fillStyle = COLORS.dim; ctx.font = "16px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(msg, W / 2, H / 2);
  }
  // build a BST by inserting keys (array): returns root of {key,left,right}
  function bstFromKeys(keys) {
    var root = null;
    function ins(t, k) { if (!t) return { key: k, left: null, right: null }; if (k < t.key) t.left = ins(t.left, k); else if (k > t.key) t.right = ins(t.right, k); return t; }
    keys.forEach(function (k) { root = ins(root, k); }); return root;
  }
  // register an init to be run after Reveal initializes
  function register(fn) { (window.__vizInits = window.__vizInits || []).push(fn); }
  // wire every .algo-viz[data-algo=algo] once, calling build(el)
  function wire(algo, build) {
    register(function () {
      var els = document.querySelectorAll('.algo-viz[data-algo="' + algo + '"]');
      for (var i = 0; i < els.length; i++) {
        if (els[i].getAttribute("data-built")) continue;
        els[i].setAttribute("data-built", "1");
        // drop the ASCII fallback (shown only where the demo can't run, e.g. raw md)
        els[i].querySelectorAll(".viz-fallback").forEach(function (f) { f.remove(); });
        build(els[i]);
      }
    });
  }

  // ---- standard demo scaffold (S04 grammar) --------------------------------
  // actions bar ABOVE the canvas · optional bottom input|output halves · status.
  // opts: { w, h, actions: html, input: label|false, output: label|false }
  // Returns { ctx, canvas, wrap, actionsEl, btn(a), on(fn), setStatus,
  //           toksEl, gearBtn, outEl, setOutput }  (bottom fields null if absent)
  function scaffold(el, opts) {
    var actions = document.createElement("div"); actions.className = "viz-actions";
    actions.innerHTML = opts.actions || ""; el.appendChild(actions);
    var wrap = document.createElement("div"); wrap.className = "viz-canvas-wrap";
    var canvas = document.createElement("canvas");
    canvas.width = opts.w; canvas.height = opts.h;
    canvas.style.width = opts.w + "px"; canvas.style.maxWidth = "100%"; canvas.style.height = "auto";
    wrap.appendChild(canvas); el.appendChild(wrap);
    var toksEl = null, gearBtn = null, outEl = null;
    if (opts.input || opts.output) {
      var bottom = document.createElement("div"); bottom.className = "viz-bottom";
      var htm = "";
      if (opts.input) htm += '<div class="viz-half viz-initbar"><div class="h"><span>' + opts.input +
        '</span><button class="gear" title="edit the sequence">⚙</button></div><div class="toks"></div></div>';
      if (opts.output) htm += '<div class="viz-half viz-output"><div class="h"><span>' + opts.output + '</span></div><div class="out"></div></div>';
      bottom.innerHTML = htm; el.appendChild(bottom);
      toksEl = bottom.querySelector(".toks"); gearBtn = bottom.querySelector(".gear"); outEl = bottom.querySelector(".out");
    }
    var status = document.createElement("div"); status.className = "viz-status"; el.appendChild(status);
    return {
      ctx: canvas.getContext("2d"), canvas: canvas, wrap: wrap, actionsEl: actions,
      btn: function (a) { return actions.querySelector('[data-act="' + a + '"]'); },
      on: function (fn) {
        actions.addEventListener("click", function (e) {
          var b = e.target.closest && e.target.closest("[data-act]");
          if (b && actions.contains(b) && b.tagName !== "SELECT" && b.type !== "checkbox") fn(b.getAttribute("data-act"), e);
        });
      },
      setStatus: function (m) { status.textContent = m || ""; },
      toksEl: toksEl, gearBtn: gearBtn, outEl: outEl,
      setOutput: function (t) { if (outEl) outEl.textContent = t || ""; }
    };
  }

  window.VizCore = {
    COLORS: COLORS, makeCanvas: makeCanvas, makeControls: makeControls,
    layoutBinary: layoutBinary, layoutGeneral: layoutGeneral, drawTree: drawTree,
    clear: clear, emptyMsg: emptyMsg, bstFromKeys: bstFromKeys, register: register, wire: wire,
    scaffold: scaffold
  };
})();
