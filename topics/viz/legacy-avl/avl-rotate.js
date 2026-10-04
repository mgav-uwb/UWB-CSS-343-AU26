/* CSS 343 · L04: rotation mechanics (demo "avl-rotate").
   CLICK any node to pick a subtree root, then rotate it. Only that subtree
   reshapes; the rest of the tree never moves and the in-order sequence (bottom)
   never changes. The subtle part is highlighted: the MIDDLE subtree B: the
   pivot child's inner subtree, holding the keys BETWEEN the two rotating nodes -
   is the ONLY piece that changes parent (it re-hangs to the other node). It is
   drawn ORANGE after a rotation, with the two rotating nodes ringed.
   x = in-order rank (stable); y = depth. window.VizCore + window.AVLEngine. */
(function () {
  "use strict";
  var C = window.VizCore, E = window.AVLEngine;
  var W = 880, H = 320, M = 40, R = 15, TOP = 26, STRIP = 30;
  var ACCENT = "#7c5cff", RED = "#b3261e", EDGE = "#e8590c";

  function N(k, l, r) { return { key: k, left: l || null, right: r || null, height: 0 }; }
  function parse(s) { return (s || "").split(/[\s,]+/).map(function (t) { return parseInt(t, 10); }).filter(function (x) { return !isNaN(x); }); }
  function h(t) { return t ? t.height : -1; }
  function bf(t) { return t ? h(t.left) - h(t.right) : 0; }
  function fix(t) { if (!t) return -1; var l = fix(t.left), r = fix(t.right); t.height = 1 + Math.max(l, r); return t.height; }
  function rotR(y) { var x = y.left; y.left = x.right; x.right = y; fix(y); fix(x); return x; }
  function rotL(x) { var y = x.right; x.right = y.left; y.left = x; fix(x); fix(y); return y; }
  function rotAt(root, K, dir) { function rec(t) { if (!t) return t; if (t.key === K) return dir === "R" ? rotR(t) : rotL(t); t.left = rec(t.left); t.right = rec(t.right); return t; } return rec(root); }
  function find(t, k) { while (t) { if (t.key === k) return t; t = k < t.key ? t.left : t.right; } return null; }
  function inorder(t, o) { if (!t) return; inorder(t.left, o); o.push(t.key); inorder(t.right, o); }
  function ranksOf(root) { var r = {}, i = 0; (function w(t) { if (!t) return; w(t.left); r[t.key] = i++; w(t.right); })(root); return { rank: r, n: i }; }
  function subKeys(t, set) { if (!t) return; set[t.key] = 1; subKeys(t.left, set); subKeys(t.right, set); }
  // a gappy AVL whose node 50 has a real MIDDLE subtree (40,35,45) to re-hang
  function defaultTree() { return N(50, N(30, N(20, N(10)), N(40, N(35), N(45))), N(75, N(60, N(55), N(65)), N(90, N(85), N(95)))); }

  function build(el) {
    var seq = parse(el.getAttribute("data-example") || "");
    var wrap = document.createElement("div"); wrap.className = "viz-canvas-wrap";
    var canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    canvas.style.width = W + "px"; canvas.style.maxWidth = "100%"; canvas.style.height = "auto";
    wrap.appendChild(canvas); el.appendChild(wrap);
    var ctrls = C.makeControls(el,
      '<button data-act="R">◀ rotate right</button><button data-act="L">rotate left ▶</button>' +
      '<span style="width:8px"></span><button class="alt" data-act="reset">Reset</button>');
    var ctx = canvas.getContext("2d");
    function freshRoot() { if (seq.length) { var a = new E.AVL(); a.build(seq); return a.root; } return defaultTree(); }
    var v = { root: freshRoot(), sel: null, bMoved: null, risen: null, ranks: {}, rn: 1, lvl: 40 };
    fix(v.root);
    function relayout() { var rk = ranksOf(v.root); v.ranks = rk.rank; v.rn = rk.n; v.lvl = Math.min(46, (H - TOP - STRIP - 18) / Math.max(1, (function d(t) { return t ? 1 + Math.max(d(t.left), d(t.right)) : -1; })(v.root))); }
    function pos() { var p = {}, dx = (W - 2 * M) / Math.max(1, v.rn - 1); (function w(t, dp) { if (!t) return; p[t.key] = { x: M + v.ranks[t.key] * dx, y: TOP + dp * v.lvl }; w(t.left, dp + 1); w(t.right, dp + 1); })(v.root, 0); return p; }

    function render(msg) {
      relayout(); var P = pos(); ctx.clearRect(0, 0, W, H);
      var sub = {}; if (v.sel != null) subKeys(find(v.root, v.sel), sub);   // the selected subtree (root = v.sel, always the top)
      (function e(t) { if (!t) return;[t.left, t.right].forEach(function (c) { if (!c) return; var pt = P[t.key], pc = P[c.key]; var onB = v.bMoved && v.bMoved[t.key] && v.bMoved[c.key]; var onS = sub[t.key] && sub[c.key]; ctx.lineWidth = (onB || onS) ? 2.5 : 1.5; ctx.strokeStyle = onB ? EDGE : (onS ? ACCENT : "#b9c0d0"); ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pc.x, pc.y); ctx.stroke(); e(c); }); })(v.root);
      (function nd(t) {
        if (!t) return; var p = P[t.key], b = bf(t);
        var fill = "#fff", ring = "#9aa3b5", text = "#1a1c22", rw = 2;
        if (sub[t.key]) { fill = "#f3f0ff"; ring = ACCENT; text = "#3a2f7a"; }
        if (v.bMoved && v.bMoved[t.key]) { fill = "#ffe8d6"; ring = EDGE; text = "#9a4200"; rw = 3; }   // the re-hung middle subtree B
        if (t.key === v.sel) { fill = ACCENT; ring = ACCENT; text = "#fff"; rw = 3; }                  // the subtree's root (always the top)
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
        ctx.fillStyle = text; ctx.font = "600 13px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(t.key), p.x, p.y);
        var big = Math.abs(b) >= 2; ctx.fillStyle = big ? RED : "#9aa3b5"; ctx.font = (big ? "700 " : "600 ") + "9px ui-monospace, Menlo, Consolas, monospace"; ctx.textBaseline = "top"; ctx.fillText((b > 0 ? "+" + b : b), p.x, p.y + R + 1);
        nd(t.left); nd(t.right);
      })(v.root);
      ctx.strokeStyle = "#eef0f4"; ctx.beginPath(); ctx.moveTo(10, H - STRIP + 2); ctx.lineTo(W - 10, H - STRIP + 2); ctx.stroke();
      var o = []; inorder(v.root, o);
      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = "600 11px ui-monospace, Menlo, Consolas, monospace"; ctx.fillStyle = "#8a93a6";
      ctx.fillText("in-order (never changes):  " + o.join(" · "), 14, H - 13);
      ctrls.setStatus(msg || (v.sel != null ? "subtree at " + v.sel + " selected: rotate it (its middle subtree will re-hang), or click another node" : "click any node to pick a subtree root"));
    }

    function rotate(dir) {
      if (v.sel == null) { render("click a node first"); return; }
      var yKey = v.sel, y = find(v.root, yKey);
      if (dir === "R" && !y.left) { render(yKey + " has no left child: can't right-rotate"); return; }
      if (dir === "L" && !y.right) { render(yKey + " has no right child: can't left-rotate"); return; }
      var x = dir === "R" ? y.left : y.right;                 // the child that rises to the subtree's top
      var B = dir === "R" ? x.right : x.left;                 // the MIDDLE subtree that re-hangs
      var bKeys = {}; subKeys(B, bKeys);
      v.root = rotAt(v.root, yKey, dir); fix(v.root);
      v.bMoved = B ? bKeys : {}; v.sel = x.key;              // KEEP the same subtree selected: it is now rooted at x
      render((dir === "R" ? "right" : "left") + "-rotate at " + yKey + ": child " + x.key + " rose to the top of this subtree (the selection follows it). The ORANGE middle subtree" + (B ? " (" + B.key + "…), keys between " + x.key + " and " + yKey + "," : " is empty here, so nothing") + " re-hung from " + x.key + " to " + yKey + ": the ONLY parent change. In-order unchanged.");
    }
    ctrls.on(function (act) { if (act === "R" || act === "L") rotate(act); else if (act === "reset") { v.root = freshRoot(); fix(v.root); v.sel = null; v.bMoved = null; v.risen = null; render(); } });
    canvas.addEventListener("click", function (e) {
      var P = pos(), r = canvas.getBoundingClientRect(), px = (e.clientX - r.left) * W / r.width, py = (e.clientY - r.top) * H / r.height, hit = null;
      for (var k in P) { var pt = P[k]; if ((pt.x - px) * (pt.x - px) + (pt.y - py) * (pt.y - py) <= (R + 2) * (R + 2)) { hit = parseInt(k, 10); break; } }
      if (hit != null) { v.sel = hit; v.bMoved = null; v.risen = null; render(); }
    });
    canvas.style.cursor = "pointer";
    render();
    if (typeof IntersectionObserver === "function") { var st = false; var io = new IntersectionObserver(function (es) { for (var i = 0; i < es.length; i++) if (!st && es[i].isIntersecting && es[i].intersectionRatio > 0.4) { st = true; io.disconnect(); v.sel = 50; render("subtree at 50 selected: press ◀ rotate right: its middle subtree (40,35,45) will re-hang from 30 to 50, and nothing else changes parent"); } }, { threshold: [0, 0.4, 0.75] }); io.observe(canvas); }
  }

  C.wire("avl-rotate", build);
})();
