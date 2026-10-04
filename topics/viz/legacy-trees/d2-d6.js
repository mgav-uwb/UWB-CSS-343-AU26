/* CSS 343 · L03: two canvas demos for the Trees & BSTs deck.
   D2: general tree <-> first-child/next-sibling binary remapping (animated toggle).
   D6: pre/in/post/level-order traversals stepped over a small BST.
   ES5 IIFE, no deps. Uses window.VizCore. Wires .algo-viz[data-algo=...]. */
(function () {
  "use strict";
  var C = window.VizCore, CO = C.COLORS, W = 880;

  // ===========================================================================
  // DEMO 1: general tree → first-child/next-sibling binary, in STAGES:
  //   0 natural · 1 GREEN firstChild links · 2 + ORANGE sibling links ·
  //   3 prune the remaining gray links · 4 morph to the binary shape.
  //   ⏮ ◁ ▶ ▷ ⏭ step the phases (the 3↔4 boundary tweens the positions).
  // ===========================================================================
  function buildGeneralTree(el) {
    var H = 300;
    // 13-node, 4-level general tree:
    //   A{ B{ E{K,L}, F }, C{G}, D{ H{M}, I, J } }
    function gn(k, ch) { return { key: k, children: ch || [] }; }
    var K = gn("K"), L = gn("L"), M2 = gn("M");
    var E = gn("E", [K, L]), F = gn("F"), G = gn("G");
    var Hn = gn("H", [M2]), I = gn("I"), J = gn("J");
    var B = gn("B", [E, F]), Cn = gn("C", [G]), D = gn("D", [Hn, I, J]);
    var A = gn("A", [B, Cn, D]);
    var all = [A, B, Cn, D, E, F, G, Hn, I, J, K, L, M2];

    // natural layout (depth 3 → 4 levels)
    var natMaxD = 3;
    C.layoutGeneral(A, function (n) { return n.children; }, W, H, { top: 30, level: Math.min(64, (H - 76) / natMaxD) });
    all.forEach(function (n) { n.posN = { x: n.x, y: n.y }; });

    // first-child / next-sibling remap, then lay out that binary structure
    all.forEach(function (n) { n.left = n.children.length ? n.children[0] : null; n.right = null; });
    all.forEach(function (n) {
      for (var i = 0; i < n.children.length - 1; i++) n.children[i].right = n.children[i + 1];
    });
    var binMaxD = 0;
    (function bd(t, d) { if (!t) return; if (d > binMaxD) binMaxD = d; bd(t.left, d + 1); bd(t.right, d + 1); })(A, 0);
    C.layoutBinary(A, W, H, { top: 26, level: Math.min(52, (H - 66) / Math.max(1, binMaxD)) });
    all.forEach(function (n) { n.posB = { x: n.x, y: n.y }; });

    // S04 layout: transport + speed on top (the phases ARE the steps; no other actions apply)
    var sc = C.scaffold(el, { w: W, h: H, actions: window.VizPlayer.tpButtonsHTML() + window.VizPlayer.speedHTML() });
    var cv = { ctx: sc.ctx, canvas: sc.canvas }, ctx = sc.ctx;
    var ctrls = { setStatus: sc.setStatus, on: sc.on };

    var phase = 0, u = 0, raf = null, playTimer = null;   // u: 0 = natural positions, 1 = binary
    var LAST = 4, stepMs = 650;                           // speed select drives dwell + tween
    var MSG = [
      "The tree, naturally: each node fans out to ALL of its children (up to 3 here).",
      "Step 1 · GREEN: every node keeps ONE downward link: to its FIRST child.",
      "Step 2 · ORANGE: every node gains one ACROSS link: to its NEXT SIBLING.",
      "Step 3 · prune: the remaining gray links are redundant now. Every node has ≤ 2 links.",
      "Step 4 · morph: draw firstChild as LEFT and nextSibling as RIGHT: a binary tree. Same 13 nodes, same information."
    ];

    function lerp(a, b, t) { return a + (b - a) * t; }
    function setPos(t) { all.forEach(function (n) { n.x = lerp(n.posN.x, n.posB.x, t); n.y = lerp(n.posN.y, n.posB.y, t); }); }
    function isFirstChild(p, c) { return p.children.length && p.children[0] === c; }

    function render() {
      C.clear(ctx, W, H);
      setPos(u);
      // gray parent→child links (all in phase 0; non-first-child only in 1–2; none in 3+)
      if (phase <= 2) {
        ctx.lineWidth = 1.5; ctx.strokeStyle = CO.link;
        (function gray(n) {
          n.children.forEach(function (c) {
            if (phase === 0 || !isFirstChild(n, c)) {
              ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(c.x, c.y); ctx.stroke();
            }
            gray(c);
          });
        })(A);
      }
      // GREEN firstChild links (phase ≥ 1)
      if (phase >= 1) {
        ctx.lineWidth = 2.6; ctx.strokeStyle = CO.green;
        all.forEach(function (n) {
          if (n.left) { ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.left.x, n.left.y); ctx.stroke(); }
        });
      }
      // ORANGE nextSibling links (phase ≥ 2): slight downward arc in the natural
      // view so they don't ride on top of the gray edges; straight once morphing
      if (phase >= 2) {
        ctx.lineWidth = 2.6; ctx.strokeStyle = CO.orange;
        all.forEach(function (n) {
          if (!n.right) return;
          var sag = 18 * (1 - u);
          ctx.beginPath(); ctx.moveTo(n.x, n.y);
          ctx.quadraticCurveTo((n.x + n.right.x) / 2, (n.y + n.right.y) / 2 + sag, n.right.x, n.right.y);
          ctx.stroke();
        });
      }
      // nodes
      var ring = phase === 0 ? CO.accent : phase < 4 ? CO.purple : CO.purple;
      all.forEach(function (n) {
        ctx.beginPath(); ctx.arc(n.x, n.y, 14, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke();
        ctx.fillStyle = CO.ink; ctx.font = "600 14px system-ui, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n.key, n.x, n.y);
      });
      // legend + step dots
      ctx.font = "600 12.5px system-ui"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      if (phase >= 1) { ctx.fillStyle = CO.green;  ctx.fillText("─ firstChild (down)",    16, H - 34); }
      if (phase >= 2) { ctx.fillStyle = CO.orange; ctx.fillText("─ nextSibling (across)", 16, H - 16); }
      for (var d = 0; d <= LAST; d++) {
        ctx.beginPath(); ctx.arc(W - 92 + d * 18, H - 20, 5, 0, 2 * Math.PI);
        ctx.fillStyle = d <= phase ? CO.accent : "#dfe3ec"; ctx.fill();
      }
    }
    function show() { render(); ctrls.setStatus(MSG[phase]); }

    // tween u toward the phase's resting value (0 for phases ≤3, 1 for phase 4)
    function settle(then) {
      var target = phase >= 4 ? 1 : 0;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (u === target) { show(); if (then) then(); return; }
      var from = u, dur = Math.min(650, stepMs), start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / dur);
        u = lerp(from, target, t * t * (3 - 2 * t));   // smoothstep
        render();
        if (t < 1) raf = requestAnimationFrame(frame);
        else { raf = null; show(); if (then) then(); }
      }
      raf = requestAnimationFrame(frame);
    }
    function goTo(p, then) { phase = Math.max(0, Math.min(LAST, p)); settle(then); }
    function stopPlay() { clearTimeout(playTimer); playTimer = null; }
    function play() {
      stopPlay();
      if (phase >= LAST) phase = -1;                    // ▶ at the end restarts
      (function next() {
        goTo(phase + 1, function () {
          if (phase < LAST) playTimer = setTimeout(next, stepMs + 500);
        });
      })();
    }
    sc.actionsEl.addEventListener("change", function (e) {
      if (e.target.getAttribute && e.target.getAttribute("data-act") === "speed") stepMs = parseInt(e.target.value, 10) || 650;
    });
    ctrls.on(function (act) {
      if (act === "rev") { stopPlay(); goTo(0); }
      else if (act === "bk1") { stopPlay(); goTo(phase - 1); }
      else if (act === "play") play();
      else if (act === "fw1") { stopPlay(); goTo(phase + 1); }
      else if (act === "ff") { stopPlay(); goTo(LAST); }
    });
    setPos(0); show();
    ctrls.setStatus(MSG[0] + "   (▶ Play steps through the conversion)");
  }

  // ===========================================================================
  // DEMO 2: pre / in / post / level-order traversal of a small BST
  // ===========================================================================
  function buildTraversals(el) {
    var H = 300;
    var root = C.bstFromKeys(["H", "C", "R", "A", "E", "P", "X"]); // in-order => A C E H P R X
    C.layoutBinary(root, W, H, { top: 34, level: 60 });

    // S04 layout: order group + transport + speed on top; the visit sequence
    // goes to an output half (the tree is fixed: no input panel needed).
    var sc = C.scaffold(el, {
      w: W, h: H,
      actions:
        '<span class="grp"><button data-act="pre">pre</button>' +
        '<button data-act="in">in</button>' +
        '<button data-act="post">post</button>' +
        '<button data-act="level">level</button></span>' +
        window.VizPlayer.tpButtonsHTML() + window.VizPlayer.speedHTML(),
      output: "visit order"
    });
    var ctx = sc.ctx;
    var ctrls = { setStatus: sc.setStatus, on: sc.on, btn: sc.btn };

    var order = "in", ev = [], pos = 0, timer = null, speedMs = 650;
    var playBtn = sc.btn("play");
    function syncPlay() { playBtn.textContent = timer ? "⏸" : "▶"; playBtn.title = timer ? "pause" : "play"; }
    function pause() { clearTimeout(timer); timer = null; syncPlay(); }

    // Event trace of the traversal. Every node TOUCH is a step:
    //   emit:false → recursion is passing through the node (descending, or
    //                returning back up through a parent between/after subtrees)
    //   emit:true  → the node is visited / appended to the output
    // It is a full Euler-tour walk: the position moves one edge at a time and
    // lands on a parent again on the way back up. Always starts at the root.
    // Each node emits at exactly one landing: pre=enter, in=after-left, post=after-right.
    function compute(o) {
      var out = [];
      if (o === "level") {
        var q = [root];
        while (q.length) {
          var n = q.shift();
          out.push({ node: n, emit: true });                 // dequeue & visit
          if (n.left) q.push(n.left);
          if (n.right) q.push(n.right);
        }
      } else {
        (function rec(n) {
          var hasL = !!n.left, hasR = !!n.right;
          var emitAt = o === "pre" ? 0 : o === "in" ? (hasL ? 1 : 0) : (hasR ? 2 : hasL ? 1 : 0);
          out.push({ node: n, emit: emitAt === 0 });                              // land: enter
          if (hasL) { rec(n.left);  out.push({ node: n, emit: emitAt === 1 }); }  // land: back up from left subtree
          if (hasR) { rec(n.right); out.push({ node: n, emit: emitAt === 2 }); }  // land: back up from right subtree
        })(root);
        while (out.length && !out[out.length - 1].emit) out.pop();  // trim the dead unwind after the last visit
      }
      return out;
    }
    function setActive() {
      ["pre", "in", "post", "level"].forEach(function (o) {
        var b = ctrls.btn(o); if (b) b.classList.toggle("alt", o !== order);
      });
    }
    // keys output (emitted) within the first `upto` events
    function outputSoFar(upto) {
      var ks = [];
      for (var i = 0; i < upto; i++) if (ev[i].emit) ks.push(ev[i].node.key);
      return ks;
    }
    function render() {
      C.clear(ctx, W, H);
      var curEv = pos > 0 ? ev[pos - 1] : null;
      var cur = curEv ? curEv.node : null;
      var justEmitted = curEv && curEv.emit ? cur.key : null;
      var emitted = {};
      for (var i = 0; i < pos; i++) if (ev[i].emit) emitted[ev[i].node.key] = 1;

      C.drawTree(ctx, root, {
        linkColor: CO.link,
        colorOf: function (n) {
          if (n === cur && curEv && !curEv.emit)             // passing through (descending)
            return { fill: CO.paleAmber, ring: CO.warn, text: CO.ink, ringWidth: 3 };
          if (n.key === justEmitted)                         // just visited this step
            return { fill: CO.accent, ring: CO.accent, text: "#fff", ringWidth: 3 };
          if (emitted[n.key])                                // already in the output
            return { fill: CO.paleViolet, ring: CO.purple, text: CO.ink };
          return null;
        }
      });

      // the enumeration so far goes to the output half (HTML, not canvas)
      sc.setOutput(outputSoFar(pos).join(" "));
    }
    function status() {
      var keys = outputSoFar(pos), curEv = pos > 0 ? ev[pos - 1] : null;
      var msg;
      if (pos >= ev.length && ev.length) {
        msg = order + "-order complete → " + keys.join(" ");
        if (order === "in") msg += "   (in-order of a BST = sorted!)";
      } else if (!curEv) {
        msg = order + "-order: press Step / Play (starts at the root)";
      } else if (!curEv.emit) {
        msg = order + "-order · passing through " + curEv.node.key + " …";
      } else {
        msg = order + "-order · visit " + curEv.node.key + " → output: " + keys.join(" ");
      }
      ctrls.setStatus(msg);
    }
    function restart(o) {
      pause(); order = o; ev = compute(o); pos = 0;
      setActive(); render(); status();
    }
    function step() {
      if (pos < ev.length) { pos++; render(); status(); return true; }
      return false;
    }
    function playToggle() {
      if (timer) { pause(); return; }
      if (pos >= ev.length) pos = 0;                 // ▶ at the end restarts
      (function go() { if (step()) { timer = setTimeout(go, speedMs); syncPlay(); } else pause(); })();
    }
    sc.actionsEl.addEventListener("change", function (e) {
      if (e.target.getAttribute && e.target.getAttribute("data-act") === "speed") speedMs = parseInt(e.target.value, 10) || 650;
    });
    ctrls.on(function (act) {
      if (act === "pre" || act === "in" || act === "post" || act === "level") restart(act);
      else if (act === "rev") { pause(); pos = 0; render(); status(); }
      else if (act === "bk1") { pause(); if (pos > 0) pos--; render(); status(); }
      else if (act === "play") playToggle();
      else if (act === "fw1") { pause(); step(); }
      else if (act === "ff") { pause(); pos = ev.length; render(); status(); }
    });
    restart("in");
  }

  C.wire("general-tree", buildGeneralTree);
  C.wire("traversals", buildTraversals);
})();
