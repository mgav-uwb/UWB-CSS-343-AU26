/* CSS 343 · L03: two interactive BST canvas demos (D9, D10), built on the
   shared BST engine (viz/bst-engine.js).
   D9 bst-shape   : insertion order decides shape (sorted path vs random bushy);
                    dual to quicksort's first partition. "Shuffle" reseeds it.
   D10 bst-ordered: ordered operations on a fixed BST with subtree sizes -
                    min/max, floor/ceiling, select/rank, range. Each query
                    highlights its descent path (accent) and the result (green).
   window.VizCore for drawing; window.BSTEngine.BST for the data structure. */
(function () {
  "use strict";
  var C = window.VizCore, COL = C.COLORS, BST = window.BSTEngine.BST;
  var W = 880, H = 300;
  var seedCounter = 1337;                       // module-load deterministic seed source

  // deterministic PRNG (mulberry32)
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, seed) {
    var a = arr.slice(), rnd = mulberry32(seed);
    for (var i = a.length - 1; i > 0; i--) { var j = (rnd() * (i + 1)) | 0; var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ======================= DEMO 1: bst-shape ================================
  function buildBstShape(el) {
    // S04 layout: the only relevant action is reshuffling the random tree
    var sc = C.scaffold(el, { w: W, h: H,
      actions: '<span class="grp"><button data-act="shuffle">🔀 Shuffle right tree</button></span>' });
    var ctx = sc.ctx;
    var ctrls = { setStatus: sc.setStatus, on: sc.on };
    var KEYS = []; for (var i = 1; i <= 15; i++) KEYS.push(i);   // 15 distinct keys
    var n = KEYS.length, halfW = W / 2, randSeed = (seedCounter += 7);

    function drawPanel(tree, x0, w, title) {
      var root = tree.root;
      C.layoutBinary(root, w, H, { margin: 26, level: 16, top: 40 });
      (function shift(t) { if (!t) return; t.x += x0; shift(t.left); shift(t.right); })(root);
      ctx.fillStyle = COL.ink; ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText(title, x0 + w / 2, 22);
      C.drawTree(ctx, root, {
        r: 9, font: "600 9px system-ui, sans-serif",
        colorOf: function () { return { fill: COL.fillIdle, ring: COL.accent, text: COL.ink, ringWidth: 1.5 }; }
      });
      var h = tree.height(), ad = tree.avgDepth();
      ctx.fillStyle = COL.ink; ctx.font = "600 12px system-ui, sans-serif"; ctx.textBaseline = "alphabetic";
      ctx.fillText("height " + h + "   ·   avg depth " + ad.toFixed(1), x0 + w / 2, H - 10);
      return { h: h, ad: ad };
    }

    function render() {
      C.clear(ctx, W, H);
      ctx.strokeStyle = COL.link; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(halfW, 6); ctx.lineTo(halfW, H - 22); ctx.stroke();
      var left = drawPanel(new BST().buildFrom(KEYS.slice()), 0, halfW, "sorted insertion → a path");
      var right = drawPanel(new BST().buildFrom(shuffle(KEYS, randSeed)), halfW, halfW, "random insertion → balanced-ish");
      var lg = Math.log(n) / Math.LN2;
      // avg-depth theory = avg search-hit compares (1.39 lg n − 1.85, Sedgewick's fit) minus 1
      var theo = Math.max(0, 1.39 * lg - 2.85);
      ctrls.setStatus(
        "Same " + n + " keys. Sorted → height " + left.h + ", avg depth " + left.ad.toFixed(1) +
        ". Random → height " + right.h + ", avg depth " + right.ad.toFixed(1) +
        " (theory ≈ " + theo.toFixed(1) + " = 1.39 log₂ n − 2.85). The root acts like quicksort's first partition."
      );
    }
    ctrls.on(function (act) { if (act === "shuffle") { randSeed += 101; render(); } });
    render();
  }

  // ======================= DEMO 2: bst-ordered =============================
  function buildBstOrdered(el) {
    // S04 layout: the ordered-op verbs + one param box on top; results in an output half
    var sc = C.scaffold(el, { w: W, h: H,
      actions:
        '<span class="grp"><button data-act="min">min</button><button data-act="max">max</button>' +
        '<button data-act="floor">floor</button><button data-act="ceiling">ceiling</button>' +
        '<button data-act="select">select</button><button data-act="rank">rank</button>' +
        '<button data-act="range">range</button></span>' +
        '<span class="grp"><input type="text" placeholder="key / rank / lo,hi" aria-label="argument"></span>',
      output: "query result" });
    var ctx = sc.ctx;
    var ctrls = { setStatus: sc.setStatus, on: sc.on, input: sc.actionsEl.querySelector("input") };
    var KEYS = [50, 30, 70, 20, 40, 60, 80, 35, 65, 90];   // ~10 nodes, clear ranks
    var bst = new BST().buildFrom(KEYS);                   // sizes computed by buildFrom
    var root = bst.root, N = bst.size(root), input = ctrls.input;
    var say = sc.setOutput;
    var pathSet = {}, resultSet = {};                       // keyed by node.key

    function render() {
      C.clear(ctx, W, H);
      C.layoutBinary(root, W, H, { margin: 30, level: 46, top: 30 });
      var any = Object.keys(pathSet).length || Object.keys(resultSet).length;
      C.drawTree(ctx, root, {
        r: 16, font: "600 13px system-ui, sans-serif",
        colorOf: function (t) {
          if (resultSet[t.key]) return { fill: COL.paleGreen, ring: COL.green, text: COL.ink, ringWidth: 2.5 };
          if (pathSet[t.key]) return { fill: COL.paleViolet, ring: COL.accent, text: COL.ink, ringWidth: 2 };
          if (any) return { fill: COL.fillIdle, ring: COL.dim, text: COL.dim, ringWidth: 1.5 };
          return { fill: COL.fillIdle, ring: COL.ringIdle, text: COL.ink, ringWidth: 2 };
        }
      });
    }
    function clearHi() { pathSet = {}; resultSet = {}; }
    function markPath(path) { path.forEach(function (t) { pathSet[t.key] = 1; }); }
    function parseInt10(s) { s = (s || "").trim(); return /^-?\d+$/.test(s) ? parseInt(s, 10) : NaN; }

    function run(act) {
      clearHi();
      var raw = input.value, k, path = [];
      if (act === "min") { var mn = bst.minNode(path); markPath(path); resultSet[mn.key] = 1; say("min = " + mn.key + " (walk left links to the end)"); }
      else if (act === "max") { var mx = bst.maxNode(path); markPath(path); resultSet[mx.key] = 1; say("max = " + mx.key + " (walk right links to the end)"); }
      else if (act === "floor" || act === "ceiling") {
        k = parseInt10(raw);
        if (isNaN(k)) { clearHi(); say("enter a key"); render(); return; }
        var r = act === "floor" ? bst.floorNode(k, path) : bst.ceilingNode(k, path);
        markPath(path);
        if (!r) { say(act + "(" + k + "): none: no key " + (act === "floor" ? "≤" : "≥") + " " + k); }
        else { resultSet[r.key] = 1; say(act + "(" + k + ") = " + r.key + "  (largest key " + (act === "floor" ? "≤" : "≥") + " " + k + " on the descent)"); }
      }
      else if (act === "select") {
        k = parseInt10(raw);
        if (isNaN(k) || k < 0 || k >= N) { clearHi(); say("enter a rank 0.." + (N - 1)); render(); return; }
        var sn = bst.selectNode(k, path); markPath(path); resultSet[sn.key] = 1;
        say("select(" + k + ") = " + sn.key + "  (using left-subtree counts: rank " + k + " of " + N + ")");
      }
      else if (act === "rank") {
        k = parseInt10(raw);
        if (isNaN(k)) { clearHi(); say("enter a key"); render(); return; }
        var rk = bst.rankOf(k, path); markPath(path);
        var present = bst.contains(k);
        if (present) resultSet[k] = 1;
        say("rank(" + k + ") = " + rk + "  (# keys < " + k + (present ? "; " + k + " is at rank " + rk + ")" : ", " + k + " not present)"));
      }
      else if (act === "range") {
        var lo, hi, parts = raw.split(",");
        if (parts.length === 2 && !isNaN(parseInt10(parts[0])) && !isNaN(parseInt10(parts[1]))) { lo = parseInt10(parts[0]); hi = parseInt10(parts[1]); }
        else { lo = bst.minNode().key; hi = bst.maxNode().key; }   // default to full range
        if (lo > hi) { var tmp = lo; lo = hi; hi = tmp; }
        var nodes = [], ks = bst.rangeKeys(lo, hi, nodes);
        nodes.forEach(function (t) { resultSet[t.key] = 1; });
        say("range(" + lo + "," + hi + ") = [" + ks.join(", ") + "]");
      }
      render();
    }
    ctrls.on(function (act) { run(act); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") run("floor"); });
    ctrls.setStatus("Try min / max, or enter a key for floor/ceiling/rank, a rank for select, or lo,hi for range.");
    render();
  }

  C.wire("bst-shape", buildBstShape);
  C.wire("bst-ordered", buildBstOrdered);
})();
