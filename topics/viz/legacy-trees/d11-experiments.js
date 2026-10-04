/* CSS 343 · L03: demo D11: average BST search cost vs N (theory meets measurement).
   Reproduces Sedgewick's doubling experiment: a random BST built from N random keys
   has average search cost ≈ 2 ln N ≈ 1.39 log₂ N compares. We plot the theory curve
   f(N) = 1.39·log₂ N − 1.85 and overlay measured points from random shuffled inserts.
   Each "Run trial" accumulates one more set of points (Tufte-style). No dependencies.
   Wires <div class="algo-viz" data-algo="bst-experiments">. */
(function () {
  "use strict";
  var C = window.VizCore;
  var W = 880, H = 330;
  var COL = C.COLORS;
  // plot box (logical coords inside the canvas)
  var L = 64, R = W - 24, T = 24, B = H - 46; // left/right/top/bottom of plot area

  // N values to measure (doubling experiment). Log-spaced.
  var NS = [50, 100, 200, 400, 800, 1600, 3200, 6400];
  // x-axis is log10(N). domain padded a touch beyond the data range.
  var XMIN = Math.log(40) / Math.LN10, XMAX = Math.log(8000) / Math.LN10;
  var YMIN = 0, YMAX = 16; // avg compares

  // ---- deterministic PRNG (mulberry32), seeded per-trial -------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- theory curve ---------------------------------------------------------
  function lg(x) { return Math.log(x) / Math.LN2; }
  function theory(N) { return Math.max(0, 1.39 * lg(N) - 1.85); }

  // ---- one measurement: avg compares = avg node depth + 1 -------------------
  // Build a random BST from a shuffled 1..N via the shared engine, then read its
  // average depth (internal path length / N). Engine build/measure are iterative,
  // so large N is safe.
  function measure(N, rng) {
    var a = new Array(N), i;
    for (i = 0; i < N; i++) a[i] = i + 1;                                             // 1..N
    for (i = N - 1; i > 0; i--) { var j = (rng() * (i + 1)) | 0; var t = a[i]; a[i] = a[j]; a[j] = t; }   // Fisher–Yates
    return new window.BSTEngine.BST().buildFrom(a).avgDepth() + 1;
  }

  // ---- coordinate mapping ---------------------------------------------------
  function xpx(N) {
    var lx = Math.log(N) / Math.LN10;
    return L + (lx - XMIN) / (XMAX - XMIN) * (R - L);
  }
  function ypx(y) {
    return B - (y - YMIN) / (YMAX - YMIN) * (B - T);
  }

  // ---- render ---------------------------------------------------------------
  function render(v) {
    var c = v.ctx;
    C.clear(c, W, H);

    // axes
    c.strokeStyle = COL.ink; c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(L, T); c.lineTo(L, B); c.lineTo(R, B);
    c.stroke();

    c.font = "12px system-ui, sans-serif";
    c.fillStyle = COL.dim;
    c.textAlign = "center"; c.textBaseline = "top";

    // x ticks at log positions 100, 1000 (and gridlines)
    var xticks = [100, 1000];
    var t;
    for (t = 0; t < xticks.length; t++) {
      var xv = xticks[t], px = xpx(xv);
      c.strokeStyle = COL.link; c.lineWidth = 1;
      c.beginPath(); c.moveTo(px, T); c.lineTo(px, B); c.stroke();
      c.strokeStyle = COL.ink;
      c.beginPath(); c.moveTo(px, B); c.lineTo(px, B + 4); c.stroke();
      c.fillStyle = COL.ink;
      c.fillText(String(xv), px, B + 6);
    }
    // minor x ticks (no label) at each measured N for orientation
    c.strokeStyle = COL.ink; c.lineWidth = 1;
    for (t = 0; t < NS.length; t++) {
      var mpx = xpx(NS[t]);
      c.beginPath(); c.moveTo(mpx, B); c.lineTo(mpx, B + 2); c.stroke();
    }

    // y ticks every 4 compares
    c.textAlign = "right"; c.textBaseline = "middle";
    var yt;
    for (yt = 0; yt <= YMAX; yt += 4) {
      var py = ypx(yt);
      c.strokeStyle = COL.link; c.lineWidth = 1;
      c.beginPath(); c.moveTo(L, py); c.lineTo(R, py); c.stroke();
      c.strokeStyle = COL.ink;
      c.beginPath(); c.moveTo(L - 4, py); c.lineTo(L, py); c.stroke();
      c.fillStyle = COL.ink;
      c.fillText(String(yt), L - 7, py);
    }

    // axis labels
    c.fillStyle = COL.ink; c.font = "600 12px system-ui, sans-serif";
    c.textAlign = "center"; c.textBaseline = "top";
    c.fillText("N  (number of keys, log scale)", (L + R) / 2, B + 24);
    c.save();
    c.translate(16, (T + B) / 2);
    c.rotate(-Math.PI / 2);
    c.textBaseline = "bottom";
    c.fillText("avg compares per search", 0, 0);
    c.restore();

    // theory curve: smooth line of f(N) = 1.39 log₂ N − 1.85
    c.strokeStyle = COL.red; c.lineWidth = 2;
    c.beginPath();
    var first = true, lx;
    for (lx = XMIN; lx <= XMAX + 1e-9; lx += (XMAX - XMIN) / 200) {
      var Nv = Math.pow(10, lx);
      var px2 = L + (lx - XMIN) / (XMAX - XMIN) * (R - L);
      var py2 = ypx(theory(Nv));
      if (first) { c.moveTo(px2, py2); first = false; } else c.lineTo(px2, py2);
    }
    c.stroke();

    // curve label near the right end of the curve
    var lblN = 3200;
    c.fillStyle = COL.red; c.font = "600 13px system-ui, sans-serif";
    c.textAlign = "right"; c.textBaseline = "bottom";
    c.fillText("1.39 log₂ N − 1.85", xpx(lblN) + 4, ypx(theory(lblN)) - 8);

    // measured points (all accumulated trials)
    var p;
    for (p = 0; p < v.points.length; p++) {
      var pt = v.points[p];
      c.fillStyle = COL.blue;
      c.globalAlpha = 0.7;
      c.beginPath();
      c.arc(xpx(pt.N), ypx(pt.y), 3, 0, 2 * Math.PI);
      c.fill();
    }
    c.globalAlpha = 1;

    // legend dot for measured
    c.fillStyle = COL.blue;
    c.beginPath(); c.arc(R - 150, T + 8, 3.5, 0, 2 * Math.PI); c.fill();
    c.fillStyle = COL.ink; c.font = "12px system-ui, sans-serif";
    c.textAlign = "left"; c.textBaseline = "middle";
    c.fillText("measured (random BST)", R - 142, T + 8);
  }

  // ---- one trial: measure every N, add points, bump seed -------------------
  function runTrial(v) {
    var rng = mulberry32(v.seed++);
    var i;
    for (i = 0; i < NS.length; i++) {
      var N = NS[i];
      v.points.push({ N: N, y: measure(N, rng) });
    }
    v.trials++;
    render(v);
    v.setStatus(v.trials + (v.trials === 1 ? " trial" : " trials") +
      " · measured average tracks 1.39 log₂ N − 1.85: a random BST stays shallow.");
  }

  function reset(v) {
    v.points = []; v.trials = 0;
    render(v);
    v.setStatus("cleared: click Run trial to overlay measured points.");
  }

  // ---- wiring ---------------------------------------------------------------
  function build(el) {
    // S04 layout: Run trial / Reset on top (a measurement plot: no transport)
    var sc = C.scaffold(el, { w: W, h: H,
      actions: '<span class="grp"><button data-act="run">▶ Run trial</button>' +
               '<button class="alt" data-act="reset">🗑 Reset</button></span>' });
    var ctrls = { setStatus: sc.setStatus, on: sc.on };
    var v = {
      ctx: sc.ctx, points: [], trials: 0, seed: 1,
      setStatus: sc.setStatus
    };
    ctrls.on(function (act) {
      if (act === "run") runTrial(v);
      else if (act === "reset") reset(v);
    });
    // auto-run one trial on load so the plot isn't empty
    runTrial(v);
  }

  C.wire("bst-experiments", build);
})();
