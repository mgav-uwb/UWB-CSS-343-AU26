/* CSS 343 · L04: plain-BST vs AVL contrast (demo "avl-vs-bst").
   Feeds the SAME key sequence into a plain BST (no balancing) and an AVL, side
   by side, one key per step: the BST towers toward a Θ(n) path while the AVL
   stays Θ(log n). Same control layout as avl-ops: top row (Generate · mode ·
   play · speed), a tree view, and a bottom split (initial sequence | output).
   Built on viz/player.js. data-example="1,2,…": the initial sequence. */
(function () {
  "use strict";
  var W = 880, H = 300, TOP = 50, M = 22, GAP = 26;
  var GOODC = "#0a7d4d", BADC = "#b3261e", ACCENT = "#7c5cff";
  var SPEEDS = [["0.25×", 4000], ["0.5×", 2000], ["1×", 1000], ["2×", 500], ["4×", 250], ["8×", 125]];

  function bstIns(t, k) { if (!t) return { key: k, left: null, right: null }; if (k < t.key) t.left = bstIns(t.left, k); else if (k > t.key) t.right = bstIns(t.right, k); return t; }
  function cloneT(t) { return t ? { key: t.key, left: cloneT(t.left), right: cloneT(t.right) } : null; }
  function depth(t) { return t ? 1 + Math.max(depth(t.left), depth(t.right)) : -1; }
  function sizeOf(t) { return t ? 1 + sizeOf(t.left) + sizeOf(t.right) : 0; }
  function parseKeys(s) { return (s || "").split(/[\s,]+/).map(function (t) { return t.trim(); }).filter(Boolean).map(function (t) { return parseInt(t, 10); }).filter(function (x) { return !isNaN(x); }); }
  function shuffled(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function layoutHalf(root, x0, x1, lvl) {
    var idx = 0, n = sizeOf(root), dx = n > 1 ? (x1 - x0) / (n - 1) : 0;
    (function ino(t, dp) { if (!t) return; ino(t.left, dp + 1); t.x = (n > 1 ? x0 + idx * dx : (x0 + x1) / 2); idx++; t.y = TOP + dp * lvl; ino(t.right, dp + 1); })(root, 0);
  }
  function drawOne(c, root, r, hiKey, col) {
    c.lineWidth = 1.5; c.strokeStyle = "#b9c0d0";
    (function e(t) { if (!t) return;[t.left, t.right].forEach(function (k) { if (k) { c.beginPath(); c.moveTo(t.x, t.y); c.lineTo(k.x, k.y); c.stroke(); } }); e(t.left); e(t.right); })(root);
    (function nd(t) {
      if (!t) return; var on = t.key === hiKey;
      c.beginPath(); c.arc(t.x, t.y, r, 0, 2 * Math.PI); c.fillStyle = on ? col : "#fff"; c.fill();
      c.lineWidth = 2; c.strokeStyle = on ? col : "#9aa3b5"; c.stroke();
      c.fillStyle = on ? "#fff" : "#1a1c22"; c.font = "600 " + Math.max(8, Math.round(r * 0.9)) + "px system-ui, sans-serif";
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(t.key), t.x, t.y); nd(t.left); nd(t.right);
    })(root);
  }
  function render(v) {
    var c = v.ctx; c.clearRect(0, 0, W, H); var midX = W / 2;
    c.strokeStyle = "#e6e9f0"; c.lineWidth = 1; c.beginPath(); c.moveTo(midX, TOP - 14); c.lineTo(midX, H - 4); c.stroke();
    var bd = depth(v.bst), ad = depth(v.avl.root), maxD = Math.max(bd, ad, 1);
    var lvl = Math.min(44, (H - TOP - 12) / maxD), r = Math.min(13, Math.max(6, Math.round(lvl * 0.42)));
    layoutHalf(v.bst, M + r, midX - GAP - r, lvl); layoutHalf(v.avl.root, midX + GAP + r, W - M - r, lvl);
    c.textAlign = "center"; c.textBaseline = "alphabetic"; c.font = "700 14px system-ui, sans-serif";
    c.fillStyle = BADC; c.fillText("plain BST", (M + midX - GAP) / 2, 16);
    c.fillStyle = GOODC; c.fillText("AVL", (midX + GAP + W - M) / 2, 16);
    c.font = "600 12px ui-monospace, Menlo, Consolas, monospace"; c.fillStyle = "#8a93a6";
    c.fillText("height " + bd, (M + midX - GAP) / 2, 30); c.fillText("height " + ad, (midX + GAP + W - M) / 2, 30);
    drawOne(c, v.bst, r, v.lastKey, BADC); drawOne(c, v.avl.root, r, v.lastKey, GOODC);
    if (!v.bst) { c.fillStyle = "#9aa3b5"; c.font = "15px system-ui"; c.fillText("press ▶ (or Generate) to feed both trees", midX, H / 2); }
    if (v.drawInit) v.drawInit();
    if (v.bst) v.setOutput("plain BST  height " + bd + "     ·     AVL  height " + ad + (bd > ad ? "     ·     AVL is " + (bd - ad) + " levels shorter" : ""));
  }

  function openGearMenu(v, anchorEl, actions) {
    closeMenu(v);
    var dd = document.createElement("div"); dd.className = "viz-dd viz-gear";
    dd.innerHTML = '<div class="gm-row"><input type="text" data-role="gseq" aria-label="sequence"><button data-g="apply">apply</button></div>' +
      '<button data-g="shuffle">🔀 randomize order</button><button data-g="order">⇅ sort <span>(worst case for the BST)</span></button>';
    var seqIn = dd.querySelector('[data-role="gseq"]'); seqIn.value = (v.seq0 || []).join(",");
    dd.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-g]"); if (!b || !dd.contains(b)) return; e.stopPropagation(); closeMenu(v); actions[b.getAttribute("data-g")](seqIn.value); });
    seqIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { closeMenu(v); actions.apply(seqIn.value); } });
    v.wrap.appendChild(dd);
    var ar = anchorEl.getBoundingClientRect(), wr = v.wrap.getBoundingClientRect();
    dd.style.left = Math.max(4, ar.left - wr.left) + "px"; dd.style.top = ((ar.bottom - wr.top) + 4) + "px"; v.dd = dd; seqIn.focus();
  }
  function closeMenu(v) { if (v.dd) { v.dd.remove(); v.dd = null; } }

  function build(el) {
    var seq0 = parseKeys(el.getAttribute("data-example") || "1,2,3,4,5,6,7,8,9,10");
    var actions = document.createElement("div"); actions.className = "viz-actions";
    var tp = function (a, g, t) { return '<button class="alt tp" data-tp="' + a + '" title="' + t + '">' + g + '</button>'; };
    var speedOpts = SPEEDS.map(function (s) { return '<option value="' + s[1] + '"' + (s[1] === 1000 ? ' selected' : '') + '>' + s[0] + '</option>'; }).join("");
    actions.innerHTML =
      '<span class="grp"><button data-act="generate">⚙ Generate</button><button class="alt" data-act="clear" title="clear both">🗑 clear</button></span>' +
      '<span class="grp"><label class="chk"><input type="checkbox" data-act="stepmode" checked> step-by-step</label></span>' +
      '<span class="grp">' + tp("rev", "⏮", "rewind") + tp("bk1", "◁", "−step") + tp("play", "▶", "play/pause") + tp("fw1", "▷", "+step") + tp("ff", "⏭", "fast-forward") + '</span>' +
      '<span class="grp"><label class="chk">speed <select data-act="speed">' + speedOpts + '</select></label></span>';
    el.appendChild(actions);
    var wrap = document.createElement("div"); wrap.className = "viz-canvas-wrap";
    var canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    canvas.style.width = W + "px"; canvas.style.maxWidth = "100%"; canvas.style.height = "auto";
    wrap.appendChild(canvas); el.appendChild(wrap);
    var bottom = document.createElement("div"); bottom.className = "viz-bottom";
    bottom.innerHTML = '<div class="viz-half viz-initbar"><div class="h"><span>input sequence</span><button class="gear" title="edit the sequence">⚙</button></div><div class="toks"></div></div>' +
      '<div class="viz-half viz-output"><div class="h"><span>output</span></div><div class="out"></div></div>';
    el.appendChild(bottom);
    var status = document.createElement("div"); status.className = "viz-status"; el.appendChild(status);
    var toksEl = bottom.querySelector(".toks"), outEl = bottom.querySelector(".out"), gearBtn = bottom.querySelector(".gear");

    var v = {
      ctx: canvas.getContext("2d"), canvas: canvas, wrap: wrap, bst: null, avl: new window.AVLEngine.AVL(),
      lastKey: null, seq0: seq0.slice(), sequence: null, seqPos: -1, dd: null, render: render,
      setStatus: function (m) { status.textContent = m || ""; }, setOutput: function (t) { outEl.textContent = t || ""; },
      drawInit: function () {
        if (!v.sequence || !v.sequence.length) { toksEl.innerHTML = '<span style="color:#b7bdcb">(empty: ⚙ to set)</span>'; return; }
        toksEl.innerHTML = v.sequence.map(function (k, i) { var cls = (v.seqPos >= 0 && i === v.seqPos) ? "cur" : (v.seqPos >= 0 && i < v.seqPos ? "done" : ""); return '<span class="' + cls + '">' + k + "</span>"; }).join(" ");
      }
    };
    window.VizPlayer.attach(v, {
      snapshot: function (v) { return { bst: cloneT(v.bst), avl: v.avl.snapshot(), seq: v.sequence ? v.sequence.slice() : null, seqPos: v.seqPos, last: v.lastKey }; },
      restore: function (v, s) { v.bst = s.bst; v.avl.restore(s.avl); v.sequence = s.seq; v.seqPos = s.seqPos; v.lastKey = s.last; },
      hiKeyOf: function () { return null; }, nodeByKey: function () { return null; }
    });
    v._playBtn = actions.querySelector('[data-tp="play"]');

    function runSeq(keys) {
      closeMenu(v); v.pause();
      v.bst = null; v.avl = new window.AVLEngine.AVL(); v.lastKey = null; v.seq0 = keys.slice(); v.sequence = keys.slice(); v.seqPos = -1;
      var i = 0, done = false;
      v.program(function () {
        if (i < keys.length) { var k = keys[i], idx = i; i++; return [{ msg: "insert " + k + "  →  BST vs AVL", apply: function () { v.bst = bstIns(v.bst, k); v.avl.insert(k); v.lastKey = k; v.seqPos = idx; return null; } }]; }
        if (!done) { done = true; v.seqPos = keys.length; return [{ msg: "done", apply: function () { v.lastKey = null; return null; } }]; }
        return null;
      });
    }
    var gearActions = { apply: function (t) { var k = parseKeys(t); if (k.length) runSeq(k); }, shuffle: function () { if (v.seq0.length) runSeq(shuffled(v.seq0)); }, order: function () { if (v.seq0.length) runSeq(v.seq0.slice().sort(function (a, b) { return a - b; })); } };

    actions.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-act"), tpv = e.target.getAttribute && e.target.getAttribute("data-tp");
      if (a === "generate") runSeq(v.seq0);
      else if (a === "clear") { closeMenu(v); v.pause(); v.bst = null; v.avl = new window.AVLEngine.AVL(); v.lastKey = null; v.sequence = null; v.seqPos = -1; v.queue = []; v.feed = null; v.setOutput(""); v.baseline(); render(v); }
      else if (tpv === "rev") v.rev(); else if (tpv === "bk1") v.stepBack(); else if (tpv === "play") v.playPause(); else if (tpv === "fw1") v.stepFwd(); else if (tpv === "ff") v.ff();
    });
    actions.addEventListener("change", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-act");
      if (a === "stepmode") { v.mode = e.target.checked ? "steps" : "instant"; if (v.mode === "instant") v.ff(); }
      else if (a === "speed") { v.speed = parseInt(e.target.value, 10) || 1000; }
    });
    gearBtn.addEventListener("click", function (e) { e.stopPropagation(); if (Date.now() - (v._gearClosedAt || 0) > 300) openGearMenu(v, gearBtn, gearActions); });
    document.addEventListener("mousedown", function (e) { if (v.dd && !v.dd.contains(e.target) && e.target !== gearBtn) { v._gearClosedAt = Date.now(); closeMenu(v); } });

    v.baseline(); render(v);
    (window.__cvs = window.__cvs || []).push(v);   // (for automated tests)
    if (typeof IntersectionObserver === "function") {
      var started = false;
      var io = new IntersectionObserver(function (entries) { for (var i = 0; i < entries.length; i++) { if (!started && entries[i].isIntersecting && entries[i].intersectionRatio > 0.4) { started = true; io.disconnect(); runSeq(v.seq0); } } }, { threshold: [0, 0.4, 0.75] });
      io.observe(canvas);
    }
  }
  window.VizCore.wire("avl-vs-bst", build);
})();
