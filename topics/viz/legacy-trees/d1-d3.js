/* CSS 343 · L03: tree-terminology demos.
   D1 "tree-terms": click a node to light up its parent/children/siblings/
   ancestors/subtree (relationship anatomy).
   D2 "tree-shapes": click "+" slots / leaves to edit a tree; live-classify it
   as full / perfect / complete / balanced.
   Uses window.VizCore. No dependencies. Renders immediately, zero console errors. */
(function () {
  "use strict";
  var C = window.VizCore, K = C.COLORS;
  var W = 880, R = 15;

  function node(key) { return { key: key, left: null, right: null, x: 0, y: 0, depth: 0 }; }

  // click (CSS px) -> logical 880-wide coords, then nearest node within r
  function hit(canvas, e, root) {
    var rect = canvas.getBoundingClientRect();
    var sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    var px = (e.clientX - rect.left) * sx, py = (e.clientY - rect.top) * sy;
    var best = null, bd = R * R * 2.25;
    (function walk(t) {
      if (!t) return;
      var dx = t.x - px, dy = t.y - py, d = dx * dx + dy * dy;
      if (d <= bd) { bd = d; best = t; }
      walk(t.left); walk(t.right);
    })(root);
    return best ? { node: best, px: px, py: py } : { node: null, px: px, py: py };
  }

  // ========================================================================
  // DEMO 1: tree-terms
  // ========================================================================
  function buildTreeTerms(el) {
    var H = 300;
    // S04 layout: actions on top · canvas · output half below · status hint
    var g = C.scaffold(el, {
      w: W, h: H,
      actions: '<span class="grp"><button class="alt" data-act="reset">Reset</button></span>',
      output: "selected node"
    });
    var cv = { ctx: g.ctx, canvas: g.canvas };
    var ctrls = { setStatus: g.setStatus, on: g.on };
    // fixed BST: insert S,E,X,A,R,C,H,M  (nice 8-node spread)
    var root = C.bstFromKeys(["S", "E", "X", "A", "R", "C", "H", "M"]);
    C.layoutBinary(root, W, H, { margin: 34, level: 52, top: 28 });

    var sel = null;

    function parentOf(t) {
      var p = null;
      (function w(n, par) { if (!n) return; if (n === t) p = par; w(n.left, n); w(n.right, n); })(root, null);
      return p;
    }
    function inSet(set, t) { return set.indexOf(t) >= 0; }
    function subtreeNodes(t) { var a = []; (function w(n) { if (!n) return; a.push(n); w(n.left); w(n.right); })(t); return a; }

    function relations() {
      if (!sel) return null;
      var par = parentOf(sel);
      var kids = [sel.left, sel.right].filter(Boolean);
      var sibs = [];
      if (par) sibs = [par.left, par.right].filter(function (c) { return c && c !== sel; });
      // ancestors = path to root excluding parent
      var anc = [], cur = parentOf(par);
      while (cur) { anc.push(cur); cur = parentOf(cur); }
      // descendants = subtree minus sel
      var desc = subtreeNodes(sel).filter(function (n) { return n !== sel; });
      return { par: par, kids: kids, sibs: sibs, anc: anc, desc: desc };
    }

    function colorOf(rel) {
      return function (t) {
        if (!sel) return null;
        if (t === sel) return { fill: K.accent, ring: K.accent, text: "#fff", ringWidth: 3 };
        if (rel.par === t) return { fill: K.paleBlue, ring: K.blue, text: K.ink, ringWidth: 3 };
        if (inSet(rel.kids, t)) return { fill: K.paleGreen, ring: K.green, text: K.ink, ringWidth: 2.5 };
        if (inSet(rel.sibs, t)) return { fill: K.paleAmber, ring: K.warn, text: K.ink, ringWidth: 2.5 };
        if (inSet(rel.anc, t)) return { fill: K.paleBlue, ring: K.dim, text: K.ink, ringWidth: 2 };
        if (inSet(rel.desc, t)) return { fill: K.paleViolet, ring: K.purple, text: K.ink, ringWidth: 2 };
        return null;
      };
    }

    function legend(ctx) {
      var items = [
        ["selected", K.accent], ["parent", K.blue], ["child", K.green],
        ["sibling", K.warn], ["ancestor", K.dim], ["subtree", K.purple]
      ];
      var x = 14, y = H - 14;
      ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      items.forEach(function (it) {
        ctx.beginPath(); ctx.arc(x + 5, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = it[1]; ctx.fill();
        ctx.fillStyle = K.dim; ctx.fillText(it[0], x + 14, y);
        x += 14 + ctx.measureText(it[0]).width + 16;
      });
    }

    function classify(t) {
      if (!parentOf(t)) return "root";
      if (!t.left && !t.right) return "leaf";
      return "internal";
    }

    function render() {
      C.clear(cv.ctx, W, H);
      var rel = relations();
      C.drawTree(cv.ctx, root, { r: R, colorOf: rel ? colorOf(rel) : null,
        font: "600 14px system-ui, sans-serif" });
      legend(cv.ctx);
      if (!sel) {
        g.setOutput("");
        ctrls.setStatus("Click any node to see its parent, children, siblings, ancestors, and subtree.");
        return;
      }
      var kind = classify(sel);
      var keys = function (arr) { return arr.map(function (n) { return n.key; }).join(", ") || "none"; };
      g.setOutput(sel.key + ": " + kind + " node\n" +
        "parent " + (rel.par ? rel.par.key : "none (root)") +
        " · children " + keys(rel.kids) +
        " · siblings " + keys(rel.sibs) + "\n" +
        "subtree {" + keys(rel.desc) + "} (" + rel.desc.length + " node" + (rel.desc.length === 1 ? "" : "s") + ")");
      ctrls.setStatus("");
    }

    cv.canvas.addEventListener("click", function (e) {
      var h = hit(cv.canvas, e, root);
      sel = h.node || null;
      render();
    });
    ctrls.on(function (act) { if (act === "reset") { sel = null; render(); } });
    render();
  }

  // ========================================================================
  // DEMO 2: tree-shapes
  // ========================================================================
  function buildTreeShapes(el) {
    var H = 320;
    // S04 layout: preset actions on top (shapes | tools) · canvas (badges live on it)
    var g = C.scaffold(el, {
      w: W, h: H,
      actions:
        '<span class="grp"><button data-act="perfect">perfect</button>' +
        '<button data-act="complete">complete</button>' +
        '<button data-act="full">full</button>' +
        '<button data-act="balanced">balanced</button></span>' +
        '<span class="grp"><button class="alt" data-act="generic">generic</button>' +
        '<button class="alt" data-act="maxdepth">max depth</button>' +
        '<button class="alt" data-act="clear">🗑 clear</button></span>'
    });
    var cv = { ctx: g.ctx, canvas: g.canvas };
    var ctrls = { setStatus: g.setStatus, on: g.on };

    var root = null;

    // ---- presets (hand-built; layout recomputed each render) ----
    function n(k, l, r) { var x = node(k); x.left = l || null; x.right = r || null; return x; }
    // every preset is height >= 3 (4+ levels)
    var PRE = {
      perfect: function () { return n(1, n(2, n(4, n(8), n(9)), n(5, n(10), n(11))), n(3, n(6, n(12), n(13)), n(7, n(14), n(15)))); }, // 15 nodes, all leaves at level 3
      complete: function () { return n(1, n(2, n(4, n(8), n(9)), n(5, n(10), null)), n(3, n(6), n(7))); }, // last level packed L→R; node 5 has only a left child → not full
      full: function () { return n(1, n(2, n(4, n(8, n(14), n(15)), n(9)), n(5)), n(3)); }, // height 3, every node has 0 or 2 kids, but lopsided → not complete, not balanced
      balanced: function () { return n(1, n(2, n(4, n(8), null), n(5)), n(3, n(6), n(7, null, n(9)))); }, // heights differ by <=1 everywhere, but mid-level gaps → not complete
      generic: function () { return n(1, n(2, n(4, n(8), null), n(5)), n(3, null, n(7, null, n(11)))); }, // no special shape: fails all four
      maxdepth: function () { return n(1, null, n(2, n(3, null, n(4, n(5), null)), null)); }, // zig-zag path: every node 1 child → height n−1
      clear: function () { return null; }
    };

    function relabel() { var i = 1; (function w(t) { if (!t) return; t.key = i++; w(t.left); w(t.right); })(root); }

    // ---- property checks ----
    function height(t) { return t ? 1 + Math.max(height(t.left), height(t.right)) : 0; }

    function isFull(t) {
      if (!t) return true;
      var has = (t.left ? 1 : 0) + (t.right ? 1 : 0);
      if (has === 1) return false;
      return isFull(t.left) && isFull(t.right);
    }
    function isPerfect(t) {
      if (!t) return true;
      var h = height(t), ok = true;
      (function w(n, d) {
        if (!n) return;
        if (!n.left && !n.right) { if (d !== h) ok = false; return; }
        w(n.left, d + 1); w(n.right, d + 1);
      })(t, 1);
      return ok && isFull(t);
    }
    function isComplete(t) {
      if (!t) return true;
      // BFS: once a missing child seen, no node after may have a child
      var q = [t], seenGap = false;
      while (q.length) {
        var x = q.shift();
        if (x.left) { if (seenGap) return false; q.push(x.left); } else seenGap = true;
        if (x.right) { if (seenGap) return false; q.push(x.right); } else seenGap = true;
      }
      return true;
    }
    function isBalanced(t) {
      var ok = true;
      (function h(n) {
        if (!n) return 0;
        var l = h(n.left), r = h(n.right);
        if (Math.abs(l - r) > 1) ok = false;
        return 1 + Math.max(l, r);
      })(t);
      return ok;
    }

    // ---- the classifier badges: big color-coded pills right below the tree ----
    var BADGE_H = 34, BADGE_BAND = 52;               // pill height + band reserved at the canvas bottom
    function drawBadges(ctx) {
      var items = [
        ["full", isFull(root)], ["perfect", isPerfect(root)],
        ["complete", isComplete(root)], ["balanced", isBalanced(root)]
      ];
      var y = H - BADGE_BAND / 2 - 4, gap = 14, padX = 16;
      ctx.font = "700 17px system-ui, sans-serif"; ctx.textBaseline = "middle";
      var widths = items.map(function (it) {
        return ctx.measureText(it[0] + (it[1] ? "  ✓" : "  ✗")).width + 2 * padX;
      });
      var total = widths.reduce(function (a, b) { return a + b; }, 0) + gap * (items.length - 1);
      var x = (W - total) / 2;
      items.forEach(function (it, i) {
        var ok = it[1], w = widths[i];
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y - BADGE_H / 2, w, BADGE_H, 9); else ctx.rect(x, y - BADGE_H / 2, w, BADGE_H);
        ctx.fillStyle = ok ? K.paleGreen : K.paleRed; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = ok ? K.green : K.red; ctx.stroke();
        ctx.fillStyle = ok ? K.green : K.red; ctx.textAlign = "center";
        ctx.fillText(it[0] + (ok ? "  ✓" : "  ✗"), x + w / 2, y + 1);
        x += w + gap;
      });
    }

    // ---- collect empty child "+" slots: {parent, side, x, y} ----
    var lvl = 52;                                    // set by render(); slots scale with it
    function slots() {
      var out = [];
      var ox = Math.max(14, Math.min(26, Math.round(lvl * 0.5))), oy = Math.min(34, Math.round(lvl * 0.65));
      (function w(t) {
        if (!t) return;
        if (!t.left) out.push({ parent: t, side: "left", x: t.x - ox, y: t.y + oy });
        if (!t.right) out.push({ parent: t, side: "right", x: t.x + ox, y: t.y + oy });
        w(t.left); w(t.right);
      })(root);
      return out;
    }

    function render() {
      C.clear(cv.ctx, W, H);
      if (!root) {
        C.emptyMsg(cv.ctx, W, H, "empty: click a preset, or build with the + slots after adding a root");
        // offer a single root "+" slot
        drawSlot({ x: W / 2, y: 40 });
        ctrls.setStatus("Tip: click the + at top to add a root, or pick a preset.");
        return;
      }
      // depth-aware level spacing: the tree (and its + slots) never reach the badge band
      var maxD = 0;
      (function d(t, dp) { if (!t) return; if (dp > maxD) maxD = dp; d(t.left, dp + 1); d(t.right, dp + 1); })(root, 0);
      lvl = maxD > 0 ? Math.min(52, (H - 28 - BADGE_BAND - 40) / maxD) : 52;
      C.layoutBinary(root, W, H, { margin: 40, level: lvl, top: 28 });
      C.drawTree(cv.ctx, root, {
        r: 12,
        colorOf: function () { return { fill: K.paleViolet, ring: K.purple, text: K.ink }; },
        labelOf: function () { return ""; }
      });
      slots().forEach(drawSlot);
      drawBadges(cv.ctx);
      ctrls.setStatus("click + to add a leaf · click a leaf to remove it: watch the badges react");
    }

    function drawSlot(s) {
      var ctx = cv.ctx;
      ctx.save();
      ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5; ctx.strokeStyle = K.dim;
      ctx.beginPath(); ctx.arc(s.x, s.y, 11, 0, 2 * Math.PI); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = K.dim; ctx.font = "700 16px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("+", s.x, s.y + 1);
      ctx.restore();
    }

    function leaves() {
      var out = [];
      (function w(t) { if (!t) return; if (!t.left && !t.right) out.push(t); w(t.left); w(t.right); })(root);
      return out;
    }
    function removeLeaf(leaf) {
      if (root === leaf) { root = null; return; }
      (function w(t) { if (!t) return;
        if (t.left === leaf) t.left = null; if (t.right === leaf) t.right = null;
        w(t.left); w(t.right);
      })(root);
    }

    cv.canvas.addEventListener("click", function (e) {
      var rect = cv.canvas.getBoundingClientRect();
      var sx = cv.canvas.width / rect.width, sy = cv.canvas.height / rect.height;
      var px = (e.clientX - rect.left) * sx, py = (e.clientY - rect.top) * sy;
      function near(x, y, rad) { var dx = x - px, dy = y - py; return dx * dx + dy * dy <= rad * rad; }

      if (!root) {
        if (near(W / 2, 40, 16)) { root = node(1); relabel(); render(); }
        return;
      }
      // existing leaf? remove (need layout coords: already laid out by last render)
      var ls = leaves(), removed = false;
      for (var i = 0; i < ls.length; i++) {
        if (near(ls[i].x, ls[i].y, R + 4)) { removeLeaf(ls[i]); removed = true; break; }
      }
      if (removed) { relabel(); render(); return; }
      // a "+" slot?
      var sl = slots();
      for (var j = 0; j < sl.length; j++) {
        if (near(sl[j].x, sl[j].y, 14)) { sl[j].parent[sl[j].side] = node(0); relabel(); render(); return; }
      }
    });

    ctrls.on(function (act) {
      if (PRE[act]) { root = PRE[act](); relabel(); render(); }
    });

    root = PRE.complete(); // start on a 3-level tree (complete ✓, but not full/perfect)
    relabel();
    render();
  }

  C.wire("tree-terms", buildTreeTerms);
  C.wire("tree-shapes", buildTreeShapes);
})();
