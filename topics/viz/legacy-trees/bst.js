/* CSS 343 · L03: Binary Search Tree visualizer UI (demo D8).
   A thin UI over the shared BST engine (viz/bst-engine.js) + the shared
   timeline player (viz/player.js). Wires every <div data-algo="bst-ops">.

   S04-style layout:
     actions   ⚙ Generate · Insert · Find · Delete (· via succ/pred) · 🗑 clear
     param     one key input box
     mode      ☑ step-by-step (unchecked = instant) · ⏮ ◁ ▶ ▷ ⏭ · speed
     canvas    the tree (slot ⊕ · edge-bisect ⊕ · click a node to relabel -
               all pickers offer VALID keys only, windowed ±5 with ‹ › paging)
     bottom    input sequence (+ ⚙ menu: set / 🔀 / ⇅ / +5)  |  output panel
     status    step-by-step narration
   Primed on load (no autoplay): the build is queued; ▶ runs it.
   data-example="S,E,…": the trace. data-delete="1": succ/pred toggle. */
(function () {
  "use strict";
  var W = 880, H = 300, M = 30, LEVEL = 46, R = 15, DD_WIN = 11, TOP = 26;
  var CO = (window.BSTEngine && window.BSTEngine.colors) || {};
  var ACCENT = CO.PROMO || "#7c5cff";

  // ---- layout: x by in-order rank, y by depth; compresses to never overflow --
  function layout(v) {
    var root = v.tree.root, idx = 0, n = 0, maxD = 0;
    (function d(t, dp) { if (!t) return; t.depth = dp; if (dp > maxD) maxD = dp; n++; d(t.left, dp + 1); d(t.right, dp + 1); })(root, 0);
    var avail = H - TOP - 30;                       // 30 ≈ room for the ⊕ slots under the deepest row
    var lvl = maxD > 0 ? Math.min(LEVEL, avail / maxD) : LEVEL;
    v.lvl = lvl;
    v.r = Math.min(R, Math.max(7, Math.round(lvl * 0.45)));
    var dx = n > 1 ? (W - 2 * M) / (n - 1) : 0;
    (function ino(t) { if (!t) return; ino(t.left); t.x = M + idx * dx; idx++; t.y = TOP + t.depth * lvl; ino(t.right); })(root);
  }

  function drawPlus(c, x, y, hot, rr) {
    rr = rr || 11;
    c.save();
    if (hot) { c.fillStyle = "#f3f0ff"; c.beginPath(); c.arc(x, y, rr, 0, 2 * Math.PI); c.fill(); }
    c.setLineDash(hot ? [] : [4, 3]); c.lineWidth = 1.5; c.strokeStyle = hot ? ACCENT : "#b6bccb";
    c.beginPath(); c.arc(x, y, rr, 0, 2 * Math.PI); c.stroke();
    c.setLineDash([]); c.fillStyle = hot ? ACCENT : "#9aa3b5"; c.font = "700 " + Math.round(rr * 1.45) + "px system-ui, sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("+", x, y + 1);
    c.restore();
  }

  // ---- render ----------------------------------------------------------------
  function render(v) {
    var c = v.ctx, root = v.tree.root; c.clearRect(0, 0, W, H);
    layout(v);
    var r = v.r, lvl = v.lvl;
    c.lineWidth = 1.5; c.strokeStyle = "#b9c0d0";
    v.edgeHits = [];
    (function links(t) {
      if (!t) return;
      [t.left, t.right].forEach(function (k) {
        if (k) {
          c.beginPath(); c.moveTo(t.x, t.y); c.lineTo(k.x, k.y); c.stroke();
          v.edgeHits.push({ p: t, ch: k, x: (t.x + k.x) / 2, y: (t.y + k.y) / 2 });
        }
      });
      links(t.left); links(t.right);
    })(root);
    (function nodes(t) {
      if (!t) return;
      var fill = "#fff", text = "#1a1c22", ring = "#9aa3b5";
      if (t === v.hi) { fill = v.hiColor || ACCENT; text = "#fff"; ring = fill; }
      else if (t === v.hoverNode && !v.isBusy()) ring = ACCENT;
      c.beginPath(); c.arc(t.x, t.y, r, 0, 2 * Math.PI);
      c.fillStyle = fill; c.fill(); c.lineWidth = 2; c.strokeStyle = ring; c.stroke();
      c.fillStyle = text; c.font = "600 " + Math.max(9, Math.round(r * 0.93)) + "px system-ui, sans-serif";
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(t.key), t.x, t.y);
      if (t.val != null && lvl >= 34) {              // hide the value tag when the tree is compressed
        c.fillStyle = "#8a93a6"; c.font = "10px ui-monospace, Menlo, Consolas, monospace";
        c.textBaseline = "top"; c.fillText(String(t.val), t.x, t.y + r + 2);
      }
      nodes(t.left); nodes(t.right);
    })(root);
    if (!root) { c.fillStyle = "#9aa3b5"; c.font = "16px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("empty: press ▶ to build, click +, or Insert a key", W / 2, H / 2); }

    // ⊕ slots while idle: ONLY where at least one key can actually go.
    v.slotHits = [];
    var sr = Math.max(7, Math.min(11, Math.round(lvl * 0.26)));
    var soX = Math.max(13, Math.min(22, Math.round(lvl * 0.5))), soY = Math.min(30, Math.round(lvl * 0.65));
    if (!v.isBusy()) {
      if (!root) {
        drawPlus(c, W / 2, 44, false);
        v.slotHits.push({ parent: null, side: null, lo: null, hi: null, x: W / 2, y: 44 });
      } else v.tree.slots().forEach(function (sl) {
        if (!v.tree.keysBetween(sl.lo, sl.hi).length) return;
        var x = sl.parent.x + (sl.side === "left" ? -soX : soX), y = sl.parent.y + soY;
        drawPlus(c, x, y, false, sr);
        v.slotHits.push({ parent: sl.parent, side: sl.side, lo: sl.lo, hi: sl.hi, x: x, y: y });
      });
      if (v.hoverEdge) drawPlus(c, v.hoverEdge.x, v.hoverEdge.y, true, sr);
    }
    if (v.drawInit) v.drawInit();
  }

  // ---- dropdown (key picker): valid entries, windowed ±5, ‹ › paging --------
  function openDropdown(v, opt) {
    closeDropdown(v);
    var dd = document.createElement("div"); dd.className = "viz-dd";
    var start = 0;
    if (opt.entries.length > DD_WIN) {
      var ai = 0;
      for (var i = 0; i < opt.entries.length; i++) if (opt.entries[i] <= opt.anchor) ai = i;
      start = Math.max(0, Math.min(ai - Math.floor(DD_WIN / 2), opt.entries.length - DD_WIN));
    }
    function paint() {
      dd.innerHTML = "";
      var t = document.createElement("span"); t.className = "dd-title"; t.textContent = opt.title; dd.appendChild(t);
      if (start > 0) {
        var lt = document.createElement("button"); lt.className = "dd-pg"; lt.textContent = "‹";
        lt.addEventListener("click", function (e) { e.stopPropagation(); start = Math.max(0, start - DD_WIN); paint(); });
        dd.appendChild(lt);
      }
      opt.entries.slice(start, start + DD_WIN).forEach(function (k) {
        var b = document.createElement("button"); b.textContent = String(k);
        b.addEventListener("click", function (e) { e.stopPropagation(); closeDropdown(v); opt.onPick(k); });
        dd.appendChild(b);
      });
      if (start + DD_WIN < opt.entries.length) {
        var gt = document.createElement("button"); gt.className = "dd-pg"; gt.textContent = "›";
        gt.addEventListener("click", function (e) { e.stopPropagation(); start = Math.min(opt.entries.length - DD_WIN, start + DD_WIN); paint(); });
        dd.appendChild(gt);
      }
    }
    paint();
    v.wrap.appendChild(dd);
    var rect = v.canvas.getBoundingClientRect(), wrapRect = v.wrap.getBoundingClientRect();
    var cssX = (rect.left - wrapRect.left) + opt.x * rect.width / W;
    var cssY = (rect.top - wrapRect.top) + opt.y * rect.height / H;
    dd.style.left = Math.max(4, Math.min(cssX - dd.offsetWidth / 2, v.wrap.clientWidth - dd.offsetWidth - 4)) + "px";
    dd.style.top = Math.max(4, Math.min(cssY + 14, v.wrap.clientHeight - dd.offsetHeight - 4)) + "px";
    v.dd = dd;
  }
  function closeDropdown(v) { if (v.dd) { v.dd.remove(); v.dd = null; } }

  // ---- ⚙ sequence menu (anchored to the input-sequence panel header) --------
  function openGearMenu(v, anchorEl, actions) {
    closeDropdown(v);
    var dd = document.createElement("div"); dd.className = "viz-dd viz-gear";
    dd.innerHTML =
      '<div class="gm-row"><input type="text" data-role="gseq" aria-label="sequence"><button data-g="apply">apply</button></div>' +
      '<button data-g="shuffle">🔀 randomize</button>' +
      '<button data-g="order">⇅ sort <span>(again = reverse)</span></button>' +
      '<button data-g="add5">+5 random keys</button>';
    var seqIn = dd.querySelector('[data-role="gseq"]');
    seqIn.value = (v.sequence || []).join(",");
    dd.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-g]");
      if (!btn || !dd.contains(btn)) return;
      e.stopPropagation(); closeDropdown(v); actions[btn.getAttribute("data-g")](seqIn.value);
    });
    seqIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { closeDropdown(v); actions.apply(seqIn.value); } });
    v.wrap.parentNode.style.position = "relative";
    v.wrap.appendChild(dd);
    var ar = anchorEl.getBoundingClientRect(), wr = v.wrap.getBoundingClientRect();
    dd.style.left = Math.max(4, Math.min(ar.left - wr.left - dd.offsetWidth + 24, v.wrap.clientWidth - dd.offsetWidth - 4)) + "px";
    dd.style.top = Math.max(4, (ar.top - wr.top) - dd.offsetHeight - 6) + "px";
    v.dd = dd;
    seqIn.focus();
  }

  // ---- sequence helpers -------------------------------------------------------
  function parseKeys(str) {
    return str.split(/[\s,]+/).map(function (t) { return t.trim(); }).filter(Boolean)
      .map(function (t) { return /^-?\d+$/.test(t) ? parseInt(t, 10) : t.toUpperCase(); });
  }
  function isSortedAsc(a) { for (var i = 1; i < a.length; i++) if (a[i] < a[i - 1]) return false; return true; }
  function shuffled(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ---- wiring ----------------------------------------------------------------
  function build(el) {
    var exKeys = parseKeys(el.getAttribute("data-example") || "S,E,A,R,C,H,X,M,P,L");
    var showVia = el.getAttribute("data-delete") === "1";

    var viaCtrl = showVia
      ? '<select data-act="via" title="how a two-child delete replaces the node">' +
        '<option value="successor">via succ</option><option value="predecessor">via pred</option></select>'
      : '';
    var g = window.VizCore.scaffold(el, {
      w: W, h: H,
      actions:
        '<span class="grp">' +
          '<button data-act="generate" title="build the tree from the sequence below">⚙ Generate</button>' +
          '<button data-act="insert">Insert</button><button data-act="find">Find</button><button data-act="delete">Delete</button>' +
          viaCtrl +
          '<button class="alt" data-act="clear" title="clear the tree">🗑</button></span>' +
        '<span class="grp"><input type="text" placeholder="key" aria-label="key" style="width:56px"></span>' +
        window.VizPlayer.transportHTML(),
      input: "input sequence", output: "output"
    });

    var v = {
      ctx: g.ctx, canvas: g.canvas, wrap: g.wrap,
      tree: new window.BSTEngine.BST(), hi: null, hiColor: null,
      sequence: null, seqPos: -1, slotHits: [], edgeHits: [], hoverEdge: null, hoverNode: null, dd: null,
      render: render, setStatus: g.setStatus, setOutput: g.setOutput,
      drawInit: function () {
        if (!g.toksEl) return;
        if (!v.sequence || !v.sequence.length) { g.toksEl.innerHTML = '<span style="color:#b7bdcb">(empty: ⚙ to set)</span>'; return; }
        g.toksEl.innerHTML = v.sequence.map(function (k, i) {
          var cls = (v.seqPos >= 0 && i === v.seqPos) ? "cur" : (v.seqPos >= 0 && i < v.seqPos ? "done" : "");
          return '<span class="' + cls + '">' + k + "</span>";
        }).join(" ");
      }
    };
    window.VizPlayer.attach(v, {
      snapshot: function (v) { return { t: v.tree.snapshot(), seq: v.sequence ? v.sequence.slice() : null, seqPos: v.seqPos }; },
      restore: function (v, s) { v.tree.restore(s.t); v.sequence = s.seq; v.seqPos = s.seqPos; },
      hiKeyOf: function (n) { return n.key; },
      nodeByKey: function (v, k) { var t = v.tree.root; while (t) { if (String(t.key) === String(k)) return t; t = k < t.key ? t.left : t.right; } return null; }
    });
    window.VizPlayer.wireTransport(v, g.actionsEl);
    v.baseline();
    (window.__bstViz = window.__bstViz || []).push(v);   // (used by automated tests)

    var input = g.actionsEl.querySelector('input[aria-label="key"]');
    function key() { var t = input.value.trim(); return /^-?\d+$/.test(t) ? parseInt(t, 10) : t.toUpperCase(); }
    function via() { var s = g.actionsEl.querySelector('[data-act="via"]'); return s ? s.value : "successor"; }

    // ---- programs & ops ------------------------------------------------------
    // fresh build; the input-sequence panel highlights each key. autostart:false → primed, waits for ▶
    function rebuild(keys, autostart) {
      closeDropdown(v); v.pause();
      v.tree = new window.BSTEngine.BST(); v.sequence = keys.slice(); v.seqPos = -1; v.hi = null;
      v.setOutput("");
      var i = 0, done = false;
      v.program(function () {
        if (i < keys.length) { v.seqPos = i; return v.tree.insert(keys[i++]); }
        if (!done) {
          done = true; v.seqPos = keys.length;
          v.setOutput("built " + v.tree.size(v.tree.root) + " nodes\nheight " + v.tree.height());
          return [{ msg: "build complete: " + v.tree.size(v.tree.root) + " nodes, height " + v.tree.height() }];
        }
        return null;
      }, autostart);
    }
    function appendInserts(keys) {                  // keep the tree; insert more keys
      closeDropdown(v);
      v.sequence = (v.sequence || []).concat(keys);
      var base = v.sequence.length - keys.length, i = 0;
      v.pause(); v.queue = [];
      if (v.tpos < v.timeline.length - 1) v.timeline.length = v.tpos + 1;
      v.feed = function () {
        if (i >= keys.length) { v.seqPos = v.sequence.length; return null; }
        v.seqPos = base + i; return v.tree.insert(keys[i++]);
      };
      if (v.mode === "instant") v.ff(); else v.playPause();
    }
    function doInsert(k) { v.setOutput("insert " + k); appendInserts([k]); }

    var gearActions = {
      apply: function (text) { var toks = parseKeys(text); if (toks.length) rebuild(toks); },
      shuffle: function () { if (v.sequence && v.sequence.length) rebuild(shuffled(v.sequence)); },
      order: function () {
        if (!v.sequence || !v.sequence.length) return;
        var asc = v.sequence.slice().sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
        rebuild(isSortedAsc(v.sequence) ? asc.reverse() : asc);   // sorted already → reverse
      },
      add5: function () {
        var pool = v.tree.keysBetween(null, null);                // all unused domain keys
        if (!pool.length) { v.setStatus("no unused keys left"); return; }
        appendInserts(shuffled(pool).slice(0, 5));
      }
    };

    g.on(function (act) {
      if (act === "generate") rebuild(v.sequence && v.sequence.length ? v.sequence : exKeys);
      else if (act === "insert" && input.value.trim() !== "") doInsert(key());
      else if (act === "find" && input.value.trim() !== "") {
        closeDropdown(v); var k = key();
        v.setOutput(v.tree.contains(k) ? "found " + k : k + " not found");
        v.pushOps(v.tree.get(k));
      }
      else if (act === "delete" && input.value.trim() !== "") {
        closeDropdown(v); v.setOutput("delete " + key() + " (via " + via() + ")");
        v.pushOps(v.tree.remove(key(), via()));
      }
      else if (act === "clear") { closeDropdown(v); v.pause(); v.tree = new window.BSTEngine.BST(); v.hi = null; v.sequence = null; v.seqPos = -1; v.queue = []; v.feed = null; v.setStatus(""); v.setOutput(""); v.baseline(); render(v); }
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && input.value.trim() !== "") doInsert(key()); });
    if (g.gearBtn) g.gearBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (Date.now() - (v._gearClosedAt || 0) > 300) openGearMenu(v, g.gearBtn, gearActions);
    });

    // ---- pointer interactions -------------------------------------------------
    function canvasXY(e) {
      var rect = g.canvas.getBoundingClientRect();
      return { x: (e.clientX - rect.left) * W / rect.width, y: (e.clientY - rect.top) * H / rect.height };
    }
    function nodeAt(px, py) {
      var found = null, hr = Math.max(v.r || R, 10);
      (function walk(t) { if (!t || found) return; var dx = t.x - px, dy = t.y - py; if (dx * dx + dy * dy <= hr * hr) { found = t; return; } walk(t.left); walk(t.right); })(v.tree.root);
      return found;
    }
    g.canvas.addEventListener("mousemove", function (e) {
      if (v.isBusy()) { if (v.hoverEdge || v.hoverNode) { v.hoverEdge = null; v.hoverNode = null; render(v); } g.canvas.style.cursor = "default"; return; }
      var pt = canvasXY(e), hotEdge = null;
      var hn = nodeAt(pt.x, pt.y);
      if (!hn) for (var i = 0; i < v.edgeHits.length; i++) {
        var m = v.edgeHits[i], dx = m.x - pt.x, dy = m.y - pt.y;
        if (dx * dx + dy * dy <= 16 * 16) {
          if (v.tree.bisectEntries(m.p, m.ch).length) hotEdge = { p: m.p, ch: m.ch, x: m.x, y: m.y };
          break;
        }
      }
      var overSlot = false;
      for (var j = 0; j < v.slotHits.length; j++) { var s = v.slotHits[j], sdx = s.x - pt.x, sdy = s.y - pt.y; if (sdx * sdx + sdy * sdy <= 15 * 15) { overSlot = true; break; } }
      g.canvas.style.cursor = (hn || hotEdge || overSlot) ? "pointer" : "default";
      if ((hotEdge && (!v.hoverEdge || v.hoverEdge.x !== hotEdge.x)) || (!hotEdge && v.hoverEdge) || hn !== v.hoverNode) {
        v.hoverEdge = hotEdge; v.hoverNode = hn; render(v);
      }
    });
    g.canvas.addEventListener("mouseleave", function () { if (v.hoverEdge || v.hoverNode) { v.hoverEdge = null; v.hoverNode = null; render(v); g.canvas.style.cursor = "default"; } });

    g.canvas.addEventListener("click", function (e) {
      if (v.isBusy()) return;
      var pt = canvasXY(e);
      var n = nodeAt(pt.x, pt.y);                    // 1) node → relabel
      if (n) {
        var b = v.tree.editBounds(n);
        var entries = b ? v.tree.keysBetween(b.lo, b.hi) : [];
        if (!entries.length) { v.setStatus("no other key fits at " + n.key + "'s position"); return; }
        openDropdown(v, { title: "edit " + n.key + " →", entries: entries, anchor: n.key, x: n.x, y: n.y,
          onPick: function (k) { v.setOutput("relabel " + n.key + " → " + k); v.pushOps(v.tree.setKey(n, k)); } });
        return;
      }
      for (var i = 0; i < v.slotHits.length; i++) {  // 2) empty-link ⊕ → insert there
        var s = v.slotHits[i], dx = s.x - pt.x, dy = s.y - pt.y;
        if (dx * dx + dy * dy <= 15 * 15) {
          var es = v.tree.keysBetween(s.lo, s.hi);
          openDropdown(v, { title: "insert", entries: es, anchor: es[Math.floor((es.length - 1) / 2)], x: s.x, y: s.y, onPick: doInsert });
          return;
        }
      }
      if (v.hoverEdge) {                             // 3) edge ⊕ → BISECT the edge (structural)
        var he = v.hoverEdge, ee = v.tree.bisectEntries(he.p, he.ch);
        if (ee.length) {
          openDropdown(v, { title: "bisect " + he.p.key + "–" + he.ch.key, entries: ee, anchor: ee[Math.floor((ee.length - 1) / 2)], x: he.x, y: he.y,
            onPick: function (k) { v.setOutput("bisect " + he.p.key + "–" + he.ch.key + " with " + k); v.pushOps(v.tree.insertBetween(he.p, he.ch, k)); } });
          return;
        }
      }
      closeDropdown(v);
    });
    document.addEventListener("mousedown", function (e) {
      if (v.dd && !v.dd.contains(e.target) && e.target !== g.gearBtn) {
        if (v.dd.classList.contains("viz-gear")) v._gearClosedAt = Date.now();
        closeDropdown(v);
      }
    });

    // Primed, not playing: the input sequence is loaded and the build is queued,
    // but nothing runs until the presenter presses ▶ (no autoplay on view).
    rebuild(exKeys, false);
    v.setStatus("press ▶ to build from the input sequence");
  }

  window.initVizBst = function () {
    var els = document.querySelectorAll('.algo-viz[data-algo="bst-ops"]');
    for (var i = 0; i < els.length; i++) {
      if (els[i].getAttribute("data-built")) continue;
      els[i].setAttribute("data-built", "1");
      els[i].querySelectorAll(".viz-fallback").forEach(function (f) { f.remove(); });
      build(els[i]);
    }
  };
})();
