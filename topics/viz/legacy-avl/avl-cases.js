/* CSS 343 · L04: the four rotation styles (demo "avl-cases").
   You DON'T read the case off "which node was inserted": you read it off the
   BALANCE FACTORS, so it works for any subtree:
     • the ±2 node z: bf +2 ⇒ its LEFT is taller (edge 1 = L); bf −2 ⇒ right (R).
     • that taller child c: its bf picks edge 2 the same way.
   Two edges SAME way (L,L / R,R) = STRAIGHT ⇒ LL/RR ⇒ one rotation.
   Two edges OPPOSITE (L,R / R,L) = KINK ⇒ LR/RL ⇒ two rotations; the first
   rotation straightens the kink into an LL/RR, THEN the single rotation.
   The two edges (orange, L/R labelled) and z, c are highlighted; it pauses at
   the imbalance AND between the two rotations. window.VizCore only. */
(function () {
  "use strict";
  var C = window.VizCore;
  var W = 880, H = 296, M = 66, R = 16, TOP = 46, SPEED = 1050;
  var ACCENT = "#7c5cff", GREEN = "#0a7d4d", RED = "#b3261e", EDGE = "#e8590c";

  function N(k, l, r) { return { key: k, left: l || null, right: r || null, height: 0 }; }
  function h(t) { return t ? t.height : -1; }
  function bf(t) { return t ? h(t.left) - h(t.right) : 0; }
  function fix(t) { if (!t) return -1; var l = fix(t.left), r = fix(t.right); t.height = 1 + Math.max(l, r); return t.height; }
  function clone(t) { return t ? { key: t.key, height: t.height, left: clone(t.left), right: clone(t.right) } : null; }
  function find(t, k) { while (t) { if (t.key === k) return t; t = k < t.key ? t.left : t.right; } return null; }
  function rotR(y) { var x = y.left; y.left = x.right; x.right = y; fix(y); fix(x); return x; }
  function rotL(x) { var y = x.right; x.right = y.left; y.left = x; fix(x); fix(y); return y; }
  function rotAt(root, K, dir) { function rec(t) { if (!t) return t; if (t.key === K) return dir === "R" ? rotR(t) : rotL(t); t.left = rec(t.left); t.right = rec(t.right); return t; } return rec(root); }
  function ranksOf(root) { var r = {}, i = 0; (function w(t) { if (!t) return; w(t.left); r[t.key] = i++; w(t.right); })(root); return { rank: r, n: i }; }

  // read the case off the balance factors: taller child of z, then taller child of c
  function caseEdges(root, badKey) {
    var z = find(root, badKey), d1 = bf(z) > 0 ? "L" : "R", c = d1 === "L" ? z.left : z.right;
    var d2 = d1 === "L" ? (bf(c) >= 0 ? "L" : "R") : (bf(c) <= 0 ? "R" : "L");
    var g = d2 === "L" ? c.left : c.right;
    return { z: z.key, c: c.key, d1: d1, d2: d2, bfz: bf(z), bfc: bf(c), edges: [[z.key, c.key, d1], [c.key, g ? g.key : c.key, d2]] };
  }
  function reason(name, ci) {
    var kink = ci.d1 !== ci.d2;
    return "⏸ " + ci.z + " bf " + (ci.bfz > 0 ? "+2" : "−2") + " → " + (ci.d1 === "L" ? "left" : "right") + " taller (edge 1 = " + ci.d1 +
      "); child " + ci.c + " bf " + (ci.bfc > 0 ? "+" + ci.bfc : ci.bfc) + " → " + (ci.d2 === "L" ? "left" : "right") + " taller (edge 2 = " + ci.d2 + "). " +
      (kink ? "OPPOSITE = kink ⇒ " + name + " ⇒ DOUBLE" : "SAME = straight ⇒ " + name + " ⇒ SINGLE") + ". Predict, then ▶ continue";
  }

  // Each case tree is ~13 nodes (doubled from the minimal 6-7): the imbalance
  // pattern and every scripted key are unchanged: the extra balanced fringe
  // just makes the "everything else stays put" point visible.
  var CASES = {
    LL: { tree: function () { return N(40, N(20, N(10, N(5, N(3), N(7)), N(15)), N(30, N(25), N(35))), N(50, N(45), N(55))); }, bad: 40, kind: "single", steps: [{ at: 40, dir: "R", hi: 20, msg: "right-rotate at 40 → balanced ✓" }] },
    RR: { tree: function () { return N(20, N(10, N(5), N(15)), N(40, N(30, N(25), N(35)), N(50, N(45), N(55, N(53), N(58))))); }, bad: 20, kind: "single", steps: [{ at: 20, dir: "L", hi: 40, msg: "left-rotate at 20 → balanced ✓" }] },
    LR: { tree: function () { return N(40, N(20, N(10, N(5), N(15)), N(30, N(25, N(22), N(27)), N(35))), N(50, N(45), N(55))); }, bad: 40, kind: "double", steps: [{ at: 20, dir: "L", hi: 30 }, { at: 40, dir: "R", hi: 30, msg: "2 of 2: single right-rotate at 40 → balanced ✓" }] },
    RL: { tree: function () { return N(20, N(10, N(5), N(15)), N(40, N(30, N(25), N(35, N(32), N(37))), N(50, N(45), N(55)))); }, bad: 20, kind: "double", steps: [{ at: 40, dir: "R", hi: 30 }, { at: 20, dir: "L", hi: 30, msg: "2 of 2: single left-rotate at 20 → balanced ✓" }] }
  };

  function build(el) {
    var wrap = document.createElement("div"); wrap.className = "viz-canvas-wrap";
    var canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    canvas.style.width = W + "px"; canvas.style.maxWidth = "100%"; canvas.style.height = "auto";
    wrap.appendChild(canvas); el.appendChild(wrap);
    var ctrls = C.makeControls(el,
      '<span style="font:600 12px system-ui;color:#0a7d4d">single</span><button data-act="LL">LL</button><button data-act="RR">RR</button>' +
      '<span style="width:4px"></span><span style="font:600 12px system-ui;color:#7c5cff">double</span><button data-act="LR">LR</button><button data-act="RL">RL</button>' +
      '<span style="width:8px"></span><button class="alt" data-act="replay">▶ continue</button>');
    var ctx = canvas.getContext("2d");
    var v = { frames: [], fi: 0, timer: null, paused: false, ranks: {}, rn: 1, lvl: 44, last: "LL" };
    var replayBtn = ctrls.btn("replay");
    function setReplay(m) { replayBtn.textContent = m === "continue" ? "▶ continue" : "▶ replay"; }
    function posFor(root) { var p = {}, dx = (W - 2 * M) / Math.max(1, v.rn - 1); (function w(t, dp) { if (!t) return; p[t.key] = { x: M + v.ranks[t.key] * dx, y: TOP + dp * v.lvl }; w(t.left, dp + 1); w(t.right, dp + 1); })(root, 0); return p; }

    function draw(f) {
      ctx.clearRect(0, 0, W, H); var pos = f.pos;
      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = "700 14px system-ui, sans-serif";
      if (f.kind === "single") { ctx.fillStyle = GREEN; ctx.fillText("●  SINGLE rotation  (LL / RR: straight)", 16, 18); }
      else { ctx.fillStyle = ACCENT; ctx.fillText("● ●  DOUBLE rotation  (LR / RL: kink)", 16, 18); }
      function edgeHit(a, b) { if (!f.edges) return null; for (var i = 0; i < f.edges.length; i++) if (f.edges[i][0] === a && f.edges[i][1] === b) return f.edges[i][2]; return null; }
      (function e(t) { if (!t) return;[t.left, t.right].forEach(function (c) { if (!c) return; var pt = pos[t.key], pc = pos[c.key], hit = edgeHit(t.key, c.key); ctx.lineWidth = hit ? 4 : 1.8; ctx.strokeStyle = hit ? EDGE : "#b9c0d0"; ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pc.x, pc.y); ctx.stroke(); e(c); }); })(f.root);
      (function nd(t) {
        if (!t) return; var p = pos[t.key], b = bf(t);
        var fill = "#fff", ring = "#9aa3b5", text = "#1a1c22", rw = 2;
        if (t.key === f.hi) { fill = f.done ? "#e7f7ee" : "#f3f0ff"; ring = f.done ? GREEN : ACCENT; text = f.done ? "#0a5c39" : "#3a2f7a"; rw = 3; }
        if (t.key === f.child) { ring = EDGE; rw = 3; }
        if (t.key === f.pivot) { ring = EDGE; rw = 3.5; }         // the node that just rotated
        if (t.key === f.danger) { fill = "#fdeaea"; ring = RED; text = RED; rw = 3; }
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
        ctx.fillStyle = text; ctx.font = "600 15px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(t.key), p.x, p.y);
        var big = Math.abs(b) >= 2; ctx.fillStyle = big ? RED : "#8a93a6"; ctx.font = (big ? "700 " : "600 ") + "11px ui-monospace, Menlo, Consolas, monospace"; ctx.textBaseline = "top"; ctx.fillText("bf " + (b > 0 ? "+" + b : b), p.x, p.y + R + 2);
        nd(t.left); nd(t.right);
      })(f.root);
      if (f.edges) f.edges.forEach(function (ed) { var pa = pos[ed[0]], pb = pos[ed[1]]; if (!pa || !pb) return; var mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2; ctx.beginPath(); ctx.arc(mx, my, 9, 0, 2 * Math.PI); ctx.fillStyle = EDGE; ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "700 11px ui-monospace, Menlo, Consolas, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ed[2], mx, my + 0.5); });
      ctrls.setStatus(f.msg);
    }
    function tick() { if (v.fi >= v.frames.length) return; var f = v.frames[v.fi]; draw(f); v.fi++; if (f.pause) { v.paused = true; setReplay("continue"); return; } if (v.fi < v.frames.length) v.timer = setTimeout(tick, SPEED); else setReplay("replay"); }
    function resume() { v.paused = false; setReplay("replay"); tick(); }

    function runCase(name) {
      clearTimeout(v.timer); v.paused = false; setReplay("replay"); v.last = name;
      var c = CASES[name], root = c.tree(); fix(root);
      var rk = ranksOf(root); v.ranks = rk.rank; v.rn = rk.n;
      v.lvl = Math.min(46, (H - TOP - 22) / Math.max(1, (function d(t) { return t ? 1 + Math.max(d(t.left), d(t.right)) : -1; })(root)));
      var ci = caseEdges(root, c.bad);
      var frames = [{ root: clone(root), pos: posFor(root), danger: c.bad, child: ci.c, edges: ci.edges, kind: c.kind, pause: true, msg: reason(name, ci) }];
      var cur = root;
      c.steps.forEach(function (s, i) {
        cur = rotAt(cur, s.at, s.dir); fix(cur);
        var last = i === c.steps.length - 1, dirWord = s.dir === "R" ? "right-rotate" : "left-rotate";
        if (!last) {                                          // 1st of a double → PAUSE; it straightens (does NOT balance)
          var ci2 = caseEdges(cur, c.bad);
          frames.push({ root: clone(cur), pos: posFor(cur), danger: c.bad, pivot: s.at, edges: ci2.edges, kind: c.kind, pause: true,
            msg: "1 of 2: a rotation: " + dirWord + " at the child " + s.at + " → " + s.hi + " rises above it. It does NOT balance yet: it STRAIGHTENS the kink into a " + ci2.d1 + ci2.d1 + " at " + ci2.z + " (both edges " + ci2.d1 + "). ▶ continue for the balancing rotation" });
        } else {
          frames.push({ root: clone(cur), pos: posFor(cur), hi: s.hi, pivot: s.at, kind: c.kind, done: true, msg: (c.kind === "double" ? "2 of 2: " : "") + dirWord + " at " + s.at + " → balanced ✓ (all bf ≤ ±1)" });
        }
      });
      v.frames = frames; v.fi = 0; tick();
    }
    ctrls.on(function (act) { if (act === "replay") { if (v.paused) resume(); else runCase(v.last); } else if (CASES[act]) runCase(act); });
    if (typeof IntersectionObserver === "function") { var st = false; var io = new IntersectionObserver(function (es) { for (var i = 0; i < es.length; i++) if (!st && es[i].isIntersecting && es[i].intersectionRatio > 0.4) { st = true; io.disconnect(); runCase("LR"); } }, { threshold: [0, 0.4, 0.75] }); io.observe(canvas); } else runCase("LR");
  }

  C.wire("avl-cases", build);
})();
