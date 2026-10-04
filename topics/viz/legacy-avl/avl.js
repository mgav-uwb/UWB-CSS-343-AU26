/* CSS 343 · L04: AVL visualizer UI (demo "avl-ops"), over viz/avl-engine.js
   + the shared timeline viz/player.js.

   Control hierarchy (top row):
     actions  Generate · Insert · Delete · Search · In-order · Range · ↶ Undo
              (Undo reverses whole actions; mutating actions are undoable)
     param    one input box (a key, or "lo-hi" for Range): a clicked node fills it
     mode     ☑ step-by-step  (unchecked = instant)
     play     ⏮ REV · ◁ −step · ▶/⏸ · ▷ +step · ⏭ FF   (drive the running action)
     speed    0.25× 0.5× 1× 2× 4× 8×   (1× = 1 s/step)
   Below the tree, a split bottom row:
     left  = the sequence used to GENERATE the tree (+ ⚙ menu: set/🔀/⇅/+5)
     right = OUTPUT panel (in-order / range lists, search & build results),
             whose result nodes are also highlighted green in the tree.
   data-example="50,30,…": initial build. data-focus="delete": hint delete. */
(function () {
  "use strict";
  var W = 880, H = 300, M = 30, LEVEL = 46, R = 15, TOP = 34;
  var find = window.AVLEngine.find, ACCENT = "#7c5cff", GREEN = "#0a7d4d";
  var SPEEDS = [["0.25×", 4000], ["0.5×", 2000], ["1×", 1000], ["2×", 500], ["4×", 250], ["8×", 125]];

  function layout(v) {
    var root = v.tree.root, idx = 0, n = 0, maxD = 0;
    (function d(t, dp) { if (!t) return; t.depth = dp; if (dp > maxD) maxD = dp; n++; d(t.left, dp + 1); d(t.right, dp + 1); })(root, 0);
    var avail = H - TOP - 18;
    var lvl = maxD > 0 ? Math.min(LEVEL, avail / maxD) : LEVEL;
    v.lvl = lvl; v.r = Math.min(R, Math.max(7, Math.round(lvl * 0.42)));
    var dx = n > 1 ? (W - 2 * M) / (n - 1) : 0;
    (function ino(t) { if (!t) return; ino(t.left); t.x = (n > 1 ? M + idx * dx : W / 2); idx++; t.y = TOP + t.depth * lvl; ino(t.right); })(root);
    v.n = n; v.maxD = maxD;
  }

  function render(v) {
    var c = v.ctx, root = v.tree.root; c.clearRect(0, 0, W, H);
    layout(v); var r = v.r, lvl = v.lvl;
    var res = v.resultKeys ? {} : null; if (res) v.resultKeys.forEach(function (k) { res[k] = 1; });
    c.lineWidth = 1.5; c.strokeStyle = "#b9c0d0";
    (function links(t) { if (!t) return;[t.left, t.right].forEach(function (k) { if (k) { c.beginPath(); c.moveTo(t.x, t.y); c.lineTo(k.x, k.y); c.stroke(); } }); links(t.left); links(t.right); })(root);
    (function nodes(t) {
      if (!t) return;
      var fill = "#fff", text = "#1a1c22", ring = "#9aa3b5", rw = 2;
      if (res && res[t.key]) { fill = "#e7f7ee"; ring = GREEN; }
      if (t === v.hi) { fill = v.hiColor || ACCENT; text = "#fff"; ring = fill; }
      else if (v.selected != null && t.key === v.selected) { ring = ACCENT; rw = 3; }
      else if (t === v.hoverNode && !v.isBusy()) ring = ACCENT;
      c.beginPath(); c.arc(t.x, t.y, r, 0, 2 * Math.PI);
      c.fillStyle = fill; c.fill(); c.lineWidth = rw; c.strokeStyle = ring; c.stroke();
      c.fillStyle = text; c.font = "600 " + Math.max(9, Math.round(r * 0.93)) + "px system-ui, sans-serif";
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(t.key), t.x, t.y);
      if (lvl >= 30) { c.fillStyle = "#8a93a6"; c.font = "10px ui-monospace, Menlo, Consolas, monospace"; c.textBaseline = "top"; c.fillText("h" + t.height, t.x, t.y + r + 2); }
      nodes(t.left); nodes(t.right);
    })(root);
    if (!root) { c.fillStyle = "#9aa3b5"; c.font = "16px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("empty: Generate a tree, or Insert a key", W / 2, H / 2); }
    else {
      var bound = Math.ceil(1.44 * Math.log2(Math.max(1, v.n)));
      c.textAlign = "left"; c.textBaseline = "top"; c.font = "11px ui-monospace, Menlo, Consolas, monospace"; c.fillStyle = "#8a93a6";
      c.fillText("n = " + v.n + "   height = " + v.maxD + "   " + (v.maxD <= bound ? "≤" : ">") + " 1.44·log₂n = " + bound + (v.maxD <= bound ? "  ✓" : ""), 12, 8);
    }
    if (v.drawInit) v.drawInit();
  }

  // ---- ⚙ sequence menu (anchored to the init bar) --------------------------
  function openGearMenu(v, anchorEl, actions) {
    closeMenu(v);
    var dd = document.createElement("div"); dd.className = "viz-dd viz-gear";
    dd.innerHTML =
      '<div class="gm-row"><input type="text" data-role="gseq" aria-label="sequence"><button data-g="apply">apply</button></div>' +
      '<button data-g="shuffle">🔀 randomize order</button>' +
      '<button data-g="order">⇅ sort <span>(again = reverse → worst case)</span></button>' +
      '<button data-g="add5">+5 random keys</button>';
    var seqIn = dd.querySelector('[data-role="gseq"]'); seqIn.value = (v.initSeq || []).join(",");
    dd.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-g]"); if (!b || !dd.contains(b)) return; e.stopPropagation(); closeMenu(v); actions[b.getAttribute("data-g")](seqIn.value); });
    seqIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { closeMenu(v); actions.apply(seqIn.value); } });
    v.wrap.appendChild(dd);
    var ar = anchorEl.getBoundingClientRect(), wr = v.wrap.getBoundingClientRect();
    dd.style.left = Math.max(4, Math.min(ar.left - wr.left, v.wrap.clientWidth - dd.offsetWidth - 4)) + "px";
    dd.style.top = Math.max(4, (ar.bottom - wr.top) + 4) + "px";
    v.dd = dd; seqIn.focus();
  }
  function closeMenu(v) { if (v.dd) { v.dd.remove(); v.dd = null; } }

  function parseKeys(s) { return (s || "").split(/[\s,]+/).map(function (t) { return t.trim(); }).filter(Boolean).map(function (t) { return parseInt(t, 10); }).filter(function (x) { return !isNaN(x); }); }
  function parseParams(s) { return parseKeys(s); }   // "20 60" or "20,60" → [20,60]  (space/comma separated)
  function isSortedAsc(a) { for (var i = 1; i < a.length; i++) if (a[i] < a[i - 1]) return false; return true; }
  function shuffled(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function randomUnused(v, k) { var have = {}, out = []; (function w(t) { if (!t) return; have[t.key] = 1; w(t.left); w(t.right); })(v.tree.root); var g = 0; while (out.length < k && g++ < 500) { var x = 1 + Math.floor(Math.random() * 99); if (!have[x]) { have[x] = 1; out.push(x); } } return out; }

  function build(el) {
    var initSeq = parseKeys(el.getAttribute("data-example") || "50,30,70,20,40,60,80,10");
    var focusDelete = el.getAttribute("data-focus") === "delete";

    // ---- DOM: actions row · canvas · bottom (init | output) · status --------
    var actions = document.createElement("div"); actions.className = "viz-actions";
    var tpBtn = function (a, g, t) { return '<button class="alt tp" data-tp="' + a + '" title="' + t + '">' + g + '</button>'; };
    var speedOpts = SPEEDS.map(function (s, i) { return '<option value="' + s[1] + '"' + (s[1] === 1000 ? ' selected' : '') + '>' + s[0] + '</option>'; }).join("");
    actions.innerHTML =
      '<span class="grp">' +
        '<button data-act="generate" title="build the tree from the sequence below">⚙ Generate</button>' +
        '<button data-act="insert">Insert</button><button data-act="delete">Delete</button><button data-act="search">Search</button>' +
        '<button data-act="inorder">In-order</button><button data-act="range">Range</button>' +
        '<button class="alt" data-act="undo" title="undo the last change">↶ Undo</button></span>' +
      '<span class="grp"><input type="text" placeholder="key · &quot;lo hi&quot;=range" aria-label="param"></span>' +
      '<span class="grp"><label class="chk"><input type="checkbox" data-act="stepmode" checked> step-by-step</label></span>' +
      '<span class="grp">' + tpBtn("rev", "⏮", "rewind") + tpBtn("bk1", "◁", "−step") + tpBtn("play", "▶", "play/pause") + tpBtn("fw1", "▷", "+step") + tpBtn("ff", "⏭", "fast-forward") + '</span>' +
      '<span class="grp"><label class="chk">speed <select data-act="speed">' + speedOpts + '</select></label></span>';
    el.appendChild(actions);

    var wrap = document.createElement("div"); wrap.className = "viz-canvas-wrap";
    var canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    canvas.style.width = W + "px"; canvas.style.maxWidth = "100%"; canvas.style.height = "auto";
    wrap.appendChild(canvas); el.appendChild(wrap);

    var bottom = document.createElement("div"); bottom.className = "viz-bottom";
    bottom.innerHTML =
      '<div class="viz-half viz-initbar"><div class="h"><span>initial tree</span><button class="gear" title="edit the build sequence">⚙</button></div><div class="toks"></div></div>' +
      '<div class="viz-half viz-output"><div class="h"><span>output</span></div><div class="out"></div></div>';
    el.appendChild(bottom);

    var status = document.createElement("div"); status.className = "viz-status"; el.appendChild(status);

    var toksEl = bottom.querySelector(".toks"), outEl = bottom.querySelector(".out"), gearBtn = bottom.querySelector(".gear");

    var v = {
      ctx: canvas.getContext("2d"), canvas: canvas, wrap: wrap,
      tree: new window.AVLEngine.AVL(), hi: null, hiColor: null,
      initSeq: initSeq.slice(), sequence: null, seqPos: -1,
      resultKeys: null, selected: null, hoverNode: null, dd: null, history: [], render: render,
      setStatus: function (m) { status.textContent = m || ""; },
      setOutput: function (t) { outEl.textContent = t || ""; },
      drawInit: function () {
        if (!v.initSeq || !v.initSeq.length) { toksEl.innerHTML = '<span style="color:#b7bdcb">(empty: ⚙ to set)</span>'; return; }
        toksEl.innerHTML = v.initSeq.map(function (k, i) { var cls = (v.seqPos >= 0 && i === v.seqPos) ? "cur" : (v.seqPos >= 0 && i < v.seqPos ? "done" : ""); return '<span class="' + cls + '">' + k + "</span>"; }).join(" ");
      }
    };
    window.VizPlayer.attach(v, {
      snapshot: function (v) { return { t: v.tree.snapshot(), seq: v.sequence ? v.sequence.slice() : null, seqPos: v.seqPos }; },
      restore: function (v, s) { v.tree.restore(s.t); v.sequence = s.seq; v.seqPos = s.seqPos; },
      hiKeyOf: function (n) { return n.key; }, nodeByKey: function (v, k) { return find(v.tree.root, k); }
    });

    var input = actions.querySelector('input[aria-label="param"]');
    var undoBtn = actions.querySelector('[data-act="undo"]');
    v._playBtn = actions.querySelector('[data-tp="play"]');
    function param() { var p = parseParams(input.value); return p.length ? p[0] : NaN; }
    function updateUndo() { undoBtn.disabled = v.history.length === 0; }
    function pushHistory() { v.history.push({ t: v.tree.snapshot(), seq: v.sequence ? v.sequence.slice() : null, seqPos: v.seqPos, init: v.initSeq.slice() }); if (v.history.length > 60) v.history.shift(); updateUndo(); }

    // run one op: baseline the timeline at the CURRENT (pre-op) tree, THEN
    // generate the steps (which may mutate the tree) and animate them.
    function runOp(gen) { closeMenu(v); v.pause(); v.baseline(); v.pushOps(gen()); }

    function doGenerate(keys) {
      pushHistory(); closeMenu(v); v.pause();
      v.tree = new window.AVLEngine.AVL(); v.initSeq = keys.slice(); v.sequence = keys.slice(); v.seqPos = -1;
      v.hi = null; v.resultKeys = null; v.selected = null; v.setOutput("");
      var i = 0, done = false;
      v.program(function () {
        if (i < keys.length) { v.seqPos = i; return v.tree.insert(keys[i++]); }
        if (!done) { done = true; v.seqPos = keys.length; v.setOutput("built " + v.tree.size() + " nodes\nheight " + v.tree.height()); return [{ msg: "build complete", apply: function () { return null; } }]; }
        return null;
      });
    }

    function act(name) {
      var k = param();
      if (name === "generate") { doGenerate(v.initSeq); return; }
      if (name === "insert") { if (isNaN(k)) return; pushHistory(); v.resultKeys = null; v.selected = null; v.setOutput("inserted " + k); runOp(function () { return v.tree.insert(k); }); return; }
      if (name === "delete") { if (isNaN(k)) return; pushHistory(); v.resultKeys = null; v.selected = null; v.setOutput("deleted " + k); runOp(function () { return v.tree.remove(k); }); return; }
      if (name === "search") { if (isNaN(k)) return; v.resultKeys = null; v.setOutput(find(v.tree.root, k) ? "found " + k : k + " not found"); runOp(function () { return v.tree.get(k); }); return; }
      if (name === "inorder") { var io = v.tree.inorder(); v.resultKeys = io.list.slice(); v.setOutput("in-order (" + io.list.length + "):\n" + io.list.join(" ")); runOp(function () { return io.steps; }); return; }
      if (name === "range") {
        var p = parseParams(input.value); if (p.length < 1) return;
        var lo = p[0], hi = p.length > 1 ? p[1] : p[0]; if (lo > hi) { var t = lo; lo = hi; hi = t; }
        var rg = v.tree.range(lo, hi); v.resultKeys = rg.list.slice();
        v.setOutput("range [" + lo + ", " + hi + "] (" + rg.list.length + "):\n" + rg.list.join(" ")); runOp(function () { return rg.steps; }); return;
      }
      if (name === "undo") {
        if (!v.history.length) return; var s = v.history.pop();
        v.pause(); v.tree.restore(s.t); v.sequence = s.seq; v.seqPos = s.seqPos; v.initSeq = s.init;
        v.hi = null; v.resultKeys = null; v.selected = null; v.setOutput("↶ undid last change"); v.setStatus("");
        v.baseline(); updateUndo(); render(v); return;
      }
    }

    var gearActions = {
      apply: function (text) { var t = parseKeys(text); if (t.length) doGenerate(t); },
      shuffle: function () { if (v.initSeq && v.initSeq.length) doGenerate(shuffled(v.initSeq)); },
      order: function () { if (!v.initSeq || !v.initSeq.length) return; var asc = v.initSeq.slice().sort(function (a, b) { return a - b; }); doGenerate(isSortedAsc(v.initSeq) ? asc.reverse() : asc); },
      add5: function () { var extra = randomUnused(v, 5); doGenerate(v.initSeq.concat(extra)); }
    };

    // ---- wire controls -------------------------------------------------------
    actions.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-act"); var tp = e.target.getAttribute && e.target.getAttribute("data-tp");
      if (a && a !== "speed" && a !== "stepmode") act(a);
      else if (tp === "rev") v.rev(); else if (tp === "bk1") v.stepBack(); else if (tp === "play") v.playPause(); else if (tp === "fw1") v.stepFwd(); else if (tp === "ff") v.ff();
    });
    actions.addEventListener("change", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-act");
      if (a === "stepmode") { v.mode = e.target.checked ? "steps" : "instant"; if (v.mode === "instant") v.ff(); }
      else if (a === "speed") { v.speed = parseInt(e.target.value, 10) || 1000; }
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !isNaN(param())) act("insert"); });
    gearBtn.addEventListener("click", function (e) { e.stopPropagation(); if (Date.now() - (v._gearClosedAt || 0) > 300) openGearMenu(v, gearBtn, gearActions); });

    // ---- pointer: hover + click a node → fill the param box + select ---------
    function xy(e) { var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
    function nodeAt(px, py) { var f = null, hr = Math.max(v.r || R, 10); (function w(t) { if (!t || f) return; var dx = t.x - px, dy = t.y - py; if (dx * dx + dy * dy <= hr * hr) { f = t; return; } w(t.left); w(t.right); })(v.tree.root); return f; }
    canvas.addEventListener("mousemove", function (e) {
      if (v.isBusy()) { if (v.hoverNode) { v.hoverNode = null; render(v); } canvas.style.cursor = "default"; return; }
      var p = xy(e), hn = nodeAt(p.x, p.y); canvas.style.cursor = hn ? "pointer" : "default";
      if (hn !== v.hoverNode) { v.hoverNode = hn; render(v); }
    });
    canvas.addEventListener("mouseleave", function () { if (v.hoverNode) { v.hoverNode = null; render(v); } });
    canvas.addEventListener("click", function (e) {
      if (v.isBusy()) return; var n = nodeAt(xy(e).x, xy(e).y);
      if (n) { input.value = n.key; v.selected = n.key; v.setStatus("selected " + n.key + ": pick an action"); render(v); }
    });
    document.addEventListener("mousedown", function (e) { if (v.dd && !v.dd.contains(e.target) && e.target !== gearBtn) { v._gearClosedAt = Date.now(); closeMenu(v); } });

    v.baseline(); updateUndo(); render(v);
    (window.__avlViz = window.__avlViz || []).push(v);   // (for automated tests)
    if (typeof IntersectionObserver === "function") {
      var started = false;
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!started && entries[i].isIntersecting && entries[i].intersectionRatio > 0.4) {
            started = true; io.disconnect(); doGenerate(v.initSeq);
            if (focusDelete) v.setStatus("built: Delete a key (type one or click a node); try 40 to force a rotation");
          }
        }
      }, { threshold: [0, 0.4, 0.75] });
      io.observe(canvas);
    }
  }

  window.VizCore.wire("avl-ops", build);
})();
