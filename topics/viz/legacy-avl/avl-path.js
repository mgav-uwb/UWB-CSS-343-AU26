/* CSS 343 · L04: "only the path is touched" visualizer (demo "avl-path").
   Animates search / insert / delete and shows the BALANCE FACTOR of EVERY node,
   proving that only nodes on the root-to-target path can become imbalanced:
     • search  : light the path down.
     • insert  : light the path down → PLAIN insert the leaf (no balancing) →
                 recompute bf up the path; a path node hits bf ±2 (red) → ROTATE
                 to rebalance. Off-path bf never change.
     • delete  : light the path down → remove the node → recompute bf up → rotate
                 if needed.
   x-position is the in-order rank (stable: rotations preserve order, so nodes
   only move vertically); off-path subtrees never move. window.VizCore + AVLEngine. */
(function () {
  "use strict";
  var C = window.VizCore, E = window.AVLEngine;
  var W = 880, H = 300, M = 34, R = 15, TOP = 30, SPEED = 620;
  var ACCENT = "#7c5cff", GREEN = "#0a7d4d", RED = "#b3261e";

  function parse(s) { return (s || "").split(/[\s,]+/).map(function (t) { return parseInt(t, 10); }).filter(function (x) { return !isNaN(x); }); }
  function heightOf(t) { return t ? t.height : -1; }
  function bf(t) { return t ? heightOf(t.left) - heightOf(t.right) : 0; }
  function count(t) { return t ? 1 + count(t.left) + count(t.right) : 0; }
  function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }
  function fixH(t) { if (!t) return -1; var l = fixH(t.left), r = fixH(t.right); t.height = 1 + Math.max(l, r); return t.height; }
  function plainInsert(root, k) {
    if (!root) return { key: k, left: null, right: null, height: 0 };
    var t = root; while (true) { if (k < t.key) { if (!t.left) { t.left = { key: k, left: null, right: null, height: 0 }; break; } t = t.left; } else if (k > t.key) { if (!t.right) { t.right = { key: k, left: null, right: null, height: 0 }; break; } t = t.right; } else break; }
    fixH(root); return root;
  }
  function plainDelete(root, k) {
    function del(t, key) { if (!t) return null; if (key < t.key) t.left = del(t.left, key); else if (key > t.key) t.right = del(t.right, key); else { if (!t.left) return t.right; if (!t.right) return t.left; var s = t.right; while (s.left) s = s.left; t.key = s.key; t.right = del(t.right, s.key); } return t; }
    root = del(root, k); if (root) fixH(root); return root;
  }
  function insertAnc(root, k) { var p = [], t = root; while (t) { p.push(t.key); if (k === t.key) return { anc: p, dup: true }; t = k < t.key ? t.left : t.right; } return { anc: p, dup: false }; }
  function deletePath(root, k) { var p = [], t = root; while (t && t.key !== k) { p.push(t.key); t = k < t.key ? t.left : t.right; } if (!t) return null; p.push(t.key); if (t.left && t.right) { var s = t.right; p.push(s.key); while (s.left) { s = s.left; p.push(s.key); } return { path: p, succ: s.key }; } return { path: p, succ: null }; }
  function ranksOf(root) { var r = {}, i = 0; (function w(t) { if (!t) return; w(t.left); r[t.key] = i++; w(t.right); })(root); return { rank: r, n: i }; }

  function build(el) {
    var seq = parse(el.getAttribute("data-example") || "8,4,12,2,6,10,14,1,3,5,7,9,11,15");
    var wrap = document.createElement("div"); wrap.className = "viz-canvas-wrap";
    var canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    canvas.style.width = W + "px"; canvas.style.maxWidth = "100%"; canvas.style.height = "auto";
    wrap.appendChild(canvas); el.appendChild(wrap);
    var ctrls = C.makeControls(el,
      '<input type="number" placeholder="key" aria-label="key" style="width:56px">' +
      '<button data-act="insert">Insert</button><button data-act="search">Search</button><button data-act="delete">Delete</button>' +
      '<button class="alt" data-act="replay">▶ replay</button><button class="alt" data-act="reset">Reset</button>');
    var input = ctrls.input, ctx = canvas.getContext("2d");
    var v = { tree: new E.AVL(), frames: [], fi: 0, timer: null, onPath: {}, cur: null, last: null };
    v.tree.build(seq);
    function key() { var t = (input.value || "").trim(); return /^-?\d+$/.test(t) ? parseInt(t, 10) : NaN; }

    function posFor(root, ranks, rn, lvl) { var pos = {}, dx = (W - 2 * M) / Math.max(1, rn - 1); (function w(t, dp) { if (!t) return; pos[t.key] = { x: M + ranks[t.key] * dx, y: TOP + dp * lvl }; w(t.left, dp + 1); w(t.right, dp + 1); })(root, 0); return pos; }
    function lvlOf(roots) { var maxD = 0; roots.forEach(function (r) { maxD = Math.max(maxD, heightOf(r)); }); return Math.min(46, (H - TOP - 22) / Math.max(1, maxD)); }

    function draw(f) {
      ctx.clearRect(0, 0, W, H); var pos = f.pos;
      (function edges(t) { if (!t) return;[t.left, t.right].forEach(function (c) { if (!c) return; var pt = pos[t.key], pc = pos[c.key]; if (!pt || !pc) return; var on = v.onPath[t.key] && v.onPath[c.key]; ctx.lineWidth = on ? 2.5 : 1.25; ctx.strokeStyle = on ? ACCENT : "#e3e6ee"; ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pc.x, pc.y); ctx.stroke(); edges(c); }); })(f.root);
      if (f.ghostPos) { ctx.setLineDash([3, 3]); ctx.strokeStyle = "#d7b3b3"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.ghostPos.x, f.ghostPos.y, R, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]); }
      (function nodes(t) {
        if (!t) return; var p = pos[t.key];
        if (p) {
          var onp = v.onPath[t.key], b = bf(t), danger = (t.key === f.danger), fill = "#fff", ring = "#dfe3ea", text = "#c3c9d6", rw = 1.5, r = R;
          if (danger) { fill = "#fdeaea"; ring = RED; text = RED; rw = 3; }
          else if (f.appear === t.key) { fill = ACCENT; ring = ACCENT; text = "#fff"; rw = 3; r = R + 3; }
          else if (onp && t.key === f.cur) { fill = ACCENT; ring = ACCENT; text = "#fff"; rw = 3; }
          else if (onp && f.fixed[t.key]) { fill = "#e7f7ee"; ring = GREEN; text = "#0a5c39"; rw = 2.5; }
          else if (onp && f.lit[t.key]) { fill = "#f3f0ff"; ring = ACCENT; text = "#3a2f7a"; rw = 2.5; }
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill();
          ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
          ctx.fillStyle = text; ctx.font = "600 14px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(t.key), p.x, p.y);
          // bf label for EVERY node
          var big = Math.abs(b) >= 2; ctx.fillStyle = big ? RED : (onp ? "#6a7284" : "#aeb6c4");
          ctx.font = (big ? "700 " : "600 ") + "10px ui-monospace, Menlo, Consolas, monospace"; ctx.textBaseline = "top";
          ctx.fillText("bf " + (b > 0 ? "+" + b : b), p.x, p.y + r + 2);
        }
        nodes(t.left); nodes(t.right);
      })(f.root);
      ctrls.setStatus(f.msg);
    }

    var replayBtn = ctrls.btn("replay");
    function setReplay(mode) { if (mode === "continue") { replayBtn.textContent = "▶ continue"; replayBtn.classList.remove("alt"); } else { replayBtn.textContent = "▶ replay"; replayBtn.classList.add("alt"); } }
    function tick() {
      if (v.fi >= v.frames.length) return;
      var f = v.frames[v.fi]; draw(f); v.fi++;
      if (f.pause) { v.paused = true; setReplay("continue"); return; }     // stop to predict the rotation
      if (v.fi < v.frames.length) v.timer = setTimeout(tick, SPEED);
    }
    function resume() { v.paused = false; setReplay("replay"); tick(); }
    function playFrames(frames) { clearTimeout(v.timer); v.paused = false; setReplay("replay"); v.frames = frames; v.fi = 0; tick(); }

    function framesFor(kind, k) {
      var preRoot = v.tree.snapshot(), frames = [], superset, ranks, rn, lvl, touch, newKey = null, plainRoot = null, finalRoot, ghost = null, z = null;
      if (kind === "search") {
        touch = insertAnc(v.tree.root, k).anc.slice(); superset = preRoot; var rk0 = ranksOf(superset); ranks = rk0.rank; rn = rk0.n; lvl = lvlOf([preRoot]); finalRoot = preRoot;
      } else if (kind === "insert") {
        var ip = insertAnc(v.tree.root, k); touch = ip.dup ? ip.anc.slice() : ip.anc.concat([k]); newKey = ip.dup ? null : k;
        plainRoot = plainInsert(E.clone(preRoot), k);
        v.tree.insert(k); finalRoot = v.tree.root;
        superset = finalRoot; var rk1 = ranksOf(superset); ranks = rk1.rank; rn = rk1.n; lvl = lvlOf([preRoot, plainRoot, finalRoot]);
        for (var i = ip.anc.length - 1; i >= 0; i--) { var nd = E.find(plainRoot, ip.anc[i]); if (nd && Math.abs(bf(nd)) >= 2) { z = ip.anc[i]; break; } }
      } else { // delete
        var dp = deletePath(v.tree.root, k); if (!dp) return null;
        touch = dp.path.slice();
        plainRoot = plainDelete(E.clone(preRoot), k);
        v.tree.remove(k); finalRoot = v.tree.root;
        superset = preRoot; var rk2 = ranksOf(superset); ranks = rk2.rank; rn = rk2.n; lvl = lvlOf([preRoot, plainRoot, finalRoot]);
        var prePos = posFor(preRoot, ranks, rn, lvl), gk = dp.succ || k; ghost = prePos[gk];
        for (var j = dp.path.length - 1; j >= 0; j--) { var nn2 = E.find(plainRoot, dp.path[j]); if (nn2 && Math.abs(bf(nn2)) >= 2) { z = dp.path[j]; break; } }
      }
      var onPath = {}; touch.forEach(function (x) { onPath[x] = 1; }); v.onPath = onPath;
      function frame(root, o) { return { root: root, pos: posFor(root, ranks, rn, lvl), cur: o.cur || null, lit: copy(o.lit || {}), fixed: o.fixed ? copy(o.fixed) : {}, appear: o.appear || null, ghostPos: o.ghostPos || null, danger: o.danger || null, pause: o.pause || false, msg: o.msg }; }

      var litD = {}, downKeys = (kind === "insert" && newKey != null) ? touch.slice(0, touch.length - 1) : touch;
      for (var d = 0; d < downKeys.length; d++) { litD[downKeys[d]] = 1; frames.push(frame(preRoot, { cur: downKeys[d], lit: litD, msg: "search down the path…" })); }
      if (kind === "search") {
        var n0 = count(preRoot), hit = !!E.find(preRoot, k);
        frames.push(frame(preRoot, { lit: litD, msg: "search " + k + (hit ? ": found" : ": miss") + ": touched " + touch.length + " of " + n0 + "; the other " + (n0 - touch.length) + " untouched" }));
        return frames;
      }
      var litR = copy(litD); if (newKey != null) litR[newKey] = 1;
      // MUTATE: plain, no balancing yet
      frames.push(frame(plainRoot, { lit: litR, appear: newKey, ghostPos: ghost, msg: kind === "insert" ? "plain insert " + k + " as a leaf: no balancing yet" : "remove " + k + ": no balancing yet" }));
      // FIX UP: recompute bf on the way up; stop at the ±2 node
      var upKeys = touch.filter(function (x) { return !!E.find(plainRoot, x); }), fixed = {};
      for (var u = upKeys.length - 1; u >= 0; u--) {
        var kk = upKeys[u], nd2 = E.find(plainRoot, kk), danger = z != null && kk === z;
        fixed[kk] = 1; frames.push(frame(plainRoot, { cur: danger ? null : kk, lit: litR, fixed: fixed, ghostPos: ghost, danger: danger ? kk : null, pause: danger, msg: danger ? "⏸ " + kk + " now has bf " + (bf(nd2) > 0 ? "+2" : "−2") + ": the only ±2, on the path. Predict the rotation, then ▶ continue" : "recompute bf on the way up ↑ (still ≤ ±1)" }));
        if (danger) break;
      }
      // ROTATE → final
      if (z != null) frames.push(frame(finalRoot, { lit: litR, fixed: litR, ghostPos: ghost, msg: "one rotation at " + z + " → back to balanced (all bf ≤ ±1)" }));
      // DONE
      var nn = count(finalRoot);
      frames.push(frame(finalRoot, { lit: litR, fixed: litR, ghostPos: ghost, msg: kind + " " + k + ": touched " + touch.length + " nodes" + (z != null ? " + 1 rotation at " + z : ", no rotation") + "; the other " + (nn - touch.length) + " of " + nn + " untouched → O(height)" }));
      return frames;
    }

    function op(kind, k) {
      if (isNaN(k)) return;
      if (kind === "delete" && !E.find(v.tree.root, k)) { v.onPath = {}; var rr = ranksOf(v.tree.root); draw({ root: v.tree.root, pos: posFor(v.tree.root, rr.rank, rr.n, lvlOf([v.tree.root])), cur: null, lit: {}, fixed: {}, msg: k + " is not in the tree" }); return; }
      v.last = { kind: kind, k: k }; var f = framesFor(kind, k); if (f) playFrames(f);
    }
    function idle() { v.onPath = {}; var rr = ranksOf(v.tree.root); draw({ root: v.tree.root, pos: posFor(v.tree.root, rr.rank, rr.n, lvlOf([v.tree.root])), cur: null, lit: {}, fixed: {}, msg: "" }); }

    ctrls.on(function (act) {
      if (act === "insert") op("insert", key());
      else if (act === "delete") op("delete", key());
      else if (act === "search") op("search", key());
      else if (act === "replay") { if (v.paused) resume(); else if (v.last) op(v.last.kind, v.last.k); }
      else if (act === "reset") { clearTimeout(v.timer); v.paused = false; setReplay("replay"); v.tree = new E.AVL(); v.tree.build(seq); idle(); }
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") op("search", key()); });
    canvas.addEventListener("click", function (e) {
      if (v.timer && v.fi < v.frames.length) return;
      var rr = ranksOf(v.tree.root), pos = posFor(v.tree.root, rr.rank, rr.n, lvlOf([v.tree.root])), r = canvas.getBoundingClientRect(), px = (e.clientX - r.left) * W / r.width, py = (e.clientY - r.top) * H / r.height, hit = null;
      for (var kk in pos) { var pt = pos[kk]; if ((pt.x - px) * (pt.x - px) + (pt.y - py) * (pt.y - py) <= (R + 2) * (R + 2)) { hit = parseInt(kk, 10); break; } }
      if (hit != null) op("search", hit);
    });
    canvas.style.cursor = "pointer";

    idle(); v._op = op; v._framesFor = framesFor; v._draw = draw; v._reset = function () { v.tree = new E.AVL(); v.tree.build(seq); };
    (window.__pathViz = window.__pathViz || []).push(v);   // (for automated tests)
    if (typeof IntersectionObserver === "function") {
      var auto = (el.getAttribute("data-auto") || "insert:16").split(":");     // e.g. "insert:16" | "delete:1" | "search:7"
      var started = false;
      var io = new IntersectionObserver(function (entries) { for (var i = 0; i < entries.length; i++) { if (!started && entries[i].isIntersecting && entries[i].intersectionRatio > 0.4) { started = true; io.disconnect(); op(auto[0], parseInt(auto[1], 10)); } } }, { threshold: [0, 0.4, 0.75] });
      io.observe(canvas);
    }
  }

  C.wire("avl-path", build);
})();
