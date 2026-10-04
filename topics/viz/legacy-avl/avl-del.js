/* CSS 343 · L04: the delete cases (demo "avl-del").
   Pick a case: leaf · one child · two children · +rotation · +cascade: and
   watch: descend to the node, REMOVE it (splice a leaf / splice a one-child /
   promote the successor for two children), then recompute bf UP the path,
   pausing at any bf ±2 so you can predict, and rotating. Unlike insert, a delete
   can rotate at MORE THAN ONE level (the cascade). bf shown on every node;
   x = in-order rank (stable). window.VizCore only (self-contained). */
(function () {
  "use strict";
  var C = window.VizCore;
  var W = 880, H = 300, M = 42, R = 15, TOP = 28, SPEED = 780;
  var ACCENT = "#7c5cff", GREEN = "#0a7d4d", RED = "#b3261e";

  function N(k, l, r) { return { key: k, left: l || null, right: r || null, height: 0 }; }
  function h(t) { return t ? t.height : -1; }
  function bf(t) { return t ? h(t.left) - h(t.right) : 0; }
  function fix(t) { if (!t) return -1; var l = fix(t.left), r = fix(t.right); t.height = 1 + Math.max(l, r); return t.height; }
  function clone(t) { return t ? { key: t.key, left: clone(t.left), right: clone(t.right), height: t.height } : null; }
  function rotR(y) { var x = y.left; y.left = x.right; x.right = y; fix(y); fix(x); return x; }
  function rotL(x) { var y = x.right; x.right = y.left; y.left = x; fix(x); fix(y); return y; }
  function reb(z) { if (bf(z) > 1) { if (bf(z.left) < 0) z.left = rotL(z.left); return rotR(z); } if (bf(z.right) > 0) z.right = rotR(z.right); return rotL(z); }
  function find(t, k) { while (t) { if (t.key === k) return t; t = k < t.key ? t.left : t.right; } return null; }
  function ranksOf(root) { var r = {}, i = 0; (function w(t) { if (!t) return; w(t.left); r[t.key] = i++; w(t.right); })(root); return { rank: r, n: i }; }
  function plainDelete(root, k) { function del(t) { if (!t) return null; if (k < t.key) t.left = del(t.left); else if (k > t.key) t.right = del(t.right); else { if (!t.left) return t.right; if (!t.right) return t.left; var s = t.right; while (s.left) s = s.left; t.key = s.key; t.right = (function dd(u, kk) { if (!u) return null; if (kk < u.key) u.left = dd(u.left, kk); else if (kk > u.key) u.right = dd(u.right, kk); else { if (!u.left) return u.right; if (!u.right) return u.left; } fix(u); return u; })(t.right, s.key); } fix(t); return t; } root = del(root); if (root) fix(root); return root; }
  function affectedDirs(root, k) { var d = [], cur = root; while (cur && cur.key !== k) { if (k < cur.key) { d.push("L"); cur = cur.left; } else { d.push("R"); cur = cur.right; } } if (!cur) return null; if (cur.left && cur.right) { d.push("R"); var s = cur.right; while (s.left) { d.push("L"); s = s.left; } } return d; }
  function chainByDir(root, dirs) { var ch = [root], cur = root; for (var i = 0; i < dirs.length; i++) { cur = dirs[i] === "L" ? cur.left : cur.right; if (!cur) break; ch.push(cur); } return ch; }
  function minAVL(Hh) { if (Hh < 0) return null; if (Hh === 0) return N(0); return N(0, minAVL(Hh - 1), minAVL(Hh - 2)); }
  function inoAssign(t, c) { if (!t) return; inoAssign(t.left, c); t.key = c.v; c.v += 10; inoAssign(t.right, c); }

  // 16 nodes (doubled); the case keys are unchanged: 30 is still a leaf,
  // 90 still has exactly one child (95, which now carries 97 so the splice
  // stays rotation-free), 25 still has two children (successor 30).
  function bstTree() {
    return N(50,
      N(25, N(10, N(5), N(15)), N(35, N(30))),
      N(80,
        N(65, N(60, N(55)), N(70, null, N(75))),
        N(90, null, N(95, null, N(97)))));
  }
  function minTree() { var t = minAVL(5); inoAssign(t, { v: 10 }); return t; }   // 20 nodes, keys 10..200
  var CASES = {
    leaf: { t: bstTree, k: 30, label: "leaf" },
    "one child": { t: bstTree, k: 90, label: "one child" },
    "two children": { t: bstTree, k: 25, label: "two children" },
    "+rotation": { t: minTree, k: 40, label: "delete → one rotation" },
    "+cascade": { t: minTree, k: 120, label: "delete → cascade (two rotations up the path)" }
  };

  function build(el) {
    var wrap = document.createElement("div"); wrap.className = "viz-canvas-wrap";
    var canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    canvas.style.width = W + "px"; canvas.style.maxWidth = "100%"; canvas.style.height = "auto";
    wrap.appendChild(canvas); el.appendChild(wrap);
    var ctrls = C.makeControls(el,
      '<button data-act="leaf">leaf</button><button data-act="one child">one child</button><button data-act="two children">two children</button>' +
      '<button data-act="+rotation">+ rotation</button><button data-act="+cascade">+ cascade</button>' +
      '<span style="width:6px"></span><button class="alt" data-act="replay">▶ continue</button>');
    var ctx = canvas.getContext("2d");
    var v = { frames: [], fi: 0, timer: null, paused: false, ranks: {}, rn: 1, lvl: 40, lit: {}, last: "leaf" };
    var replayBtn = ctrls.btn("replay");
    function setReplay(m) { replayBtn.textContent = m === "continue" ? "▶ continue" : "▶ replay"; }

    function posFor(root) { var p = {}, dx = (W - 2 * M) / Math.max(1, v.rn - 1); (function w(t, dp) { if (!t) return; p[t.key] = { x: M + v.ranks[t.key] * dx, y: TOP + dp * v.lvl }; w(t.left, dp + 1); w(t.right, dp + 1); })(root, 0); return p; }
    function draw(f) {
      ctx.clearRect(0, 0, W, H); var pos = f.pos;
      (function e(t) { if (!t) return;[t.left, t.right].forEach(function (c) { if (!c) return; var pt = pos[t.key], pc = pos[c.key]; if (!pt || !pc) return; var on = v.lit[t.key] && v.lit[c.key]; ctx.lineWidth = on ? 2.5 : 1.5; ctx.strokeStyle = on ? ACCENT : "#c4cad6"; ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pc.x, pc.y); ctx.stroke(); e(c); }); })(f.root);
      if (f.ghostPos) { ctx.setLineDash([3, 3]); ctx.strokeStyle = "#d7b3b3"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.ghostPos.x, f.ghostPos.y, R, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]); }
      (function nd(t) {
        if (!t) return; var p = pos[t.key], b = bf(t), lit = v.lit[t.key];
        var fill = "#fff", ring = "#9aa3b5", text = "#1a1c22", rw = 2;
        if (lit) { fill = "#f3f0ff"; ring = ACCENT; text = "#3a2f7a"; rw = 2.5; }
        if (t.key === f.hi) { fill = "#e7f7ee"; ring = GREEN; text = "#0a5c39"; rw = 3; }
        if (t.key === f.cur) { fill = ACCENT; ring = ACCENT; text = "#fff"; rw = 3; }
        if (t.key === f.danger) { fill = "#fdeaea"; ring = RED; text = RED; rw = 3; }
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
        ctx.fillStyle = text; ctx.font = "600 13px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(t.key), p.x, p.y);
        var big = Math.abs(b) >= 2; ctx.fillStyle = big ? RED : "#8a93a6"; ctx.font = (big ? "700 " : "600 ") + "9px ui-monospace, Menlo, Consolas, monospace"; ctx.textBaseline = "top"; ctx.fillText((b > 0 ? "+" + b : b), p.x, p.y + R + 1);
        nd(t.left); nd(t.right);
      })(f.root);
      ctrls.setStatus(f.msg);
    }
    function tick() { if (v.fi >= v.frames.length) return; var f = v.frames[v.fi]; if (f.lit) v.lit = f.lit; draw(f); v.fi++; if (f.pause) { v.paused = true; setReplay("continue"); return; } if (v.fi < v.frames.length) v.timer = setTimeout(tick, SPEED); else setReplay("replay"); }
    function resume() { v.paused = false; setReplay("replay"); tick(); }

    function runCase(name) {
      clearTimeout(v.timer); v.paused = false; setReplay("replay"); v.last = name;
      var c = CASES[name], orig = c.t(); fix(orig);
      var k = c.k, rk = ranksOf(orig); v.ranks = rk.rank; v.rn = rk.n;
      v.lvl = Math.min(46, (H - TOP - 20) / Math.max(1, (function d(t) { return t ? 1 + Math.max(d(t.left), d(t.right)) : -1; })(orig)));
      var target = find(orig, k), twoChild = target.left && target.right;
      var succ = twoChild ? (function () { var s = target.right; while (s.left) s = s.left; return s.key; })() : null;
      var childCount = (target.left ? 1 : 0) + (target.right ? 1 : 0);
      // descent keys
      var dk = [], cur = orig; while (cur && cur.key !== k) { dk.push(cur.key); cur = k < cur.key ? cur.left : cur.right; } dk.push(k);
      if (twoChild) { var s = target.right; while (s) { dk.push(s.key); s = s.left; } }
      var litSet = {}; dk.forEach(function (x) { litSet[x] = 1; });
      var frames = [], litD = {};
      for (var i = 0; i < dk.length; i++) { litD[dk[i]] = 1; frames.push({ root: clone(orig), pos: posFor(orig), lit: copy(litD), cur: dk[i], msg: "search down the path…" }); }
      // remove (plain)
      var plainRoot = plainDelete(clone(orig), k);
      var ghostKey = twoChild ? succ : k, gp = posFor(orig)[ghostKey];
      var caseMsg = childCount === 2 ? "delete " + k + " (two children): copy successor " + succ + " up, remove its node" : childCount === 1 ? "delete " + k + " (one child): splice it out" : "delete " + k + " (a leaf): just remove it";
      frames.push({ root: clone(plainRoot), pos: posFor(plainRoot), lit: copy(litSet), ghostPos: gp, msg: caseMsg });
      // rebalance UP
      var dirs = affectedDirs(orig, k), chain = chainByDir(plainRoot, dirs), root2 = plainRoot, rotCount = 0;
      for (i = chain.length - 1; i >= 0; i--) {
        var node = chain[i], parent = i > 0 ? chain[i - 1] : null; fix(node);
        if (Math.abs(bf(node)) >= 2) {
          rotCount++;
          frames.push({ root: clone(root2), pos: posFor(root2), lit: copy(litSet), danger: node.key, pause: true, msg: "⏸ " + node.key + " is bf " + (bf(node) > 0 ? "+2" : "−2") + ": predict the rotation, then ▶ continue" });
          var nr = reb(node); if (!parent) root2 = nr; else if (parent.left === node) parent.left = nr; else parent.right = nr;
          frames.push({ root: clone(root2), pos: posFor(root2), lit: copy(litSet), hi: nr.key, msg: "rotate → " + nr.key + " rises; keep checking up the path" });
        } else {
          frames.push({ root: clone(root2), pos: posFor(root2), lit: copy(litSet), cur: node.key, msg: "bf " + bf(node) + " at " + node.key + ": ok" });
        }
      }
      frames.push({ root: clone(root2), pos: posFor(root2), lit: {}, msg: c.label + ": " + (rotCount === 0 ? "no rotation needed" : rotCount + " rotation" + (rotCount > 1 ? "s (a cascade: delete can rotate at every level)" : "")) + "; balanced" });
      v.frames = frames; v.fi = 0; tick();
    }
    function copy(o) { var r = {}; for (var x in o) r[x] = o[x]; return r; }

    ctrls.on(function (act) { if (act === "replay") { if (v.paused) resume(); else runCase(v.last); } else if (CASES[act]) runCase(act); });
    if (typeof IntersectionObserver === "function") { var st = false; var io = new IntersectionObserver(function (es) { for (var i = 0; i < es.length; i++) if (!st && es[i].isIntersecting && es[i].intersectionRatio > 0.4) { st = true; io.disconnect(); runCase("two children"); } }, { threshold: [0, 0.4, 0.75] }); io.observe(canvas); } else runCase("two children");
  }

  C.wire("avl-del", build);
})();
