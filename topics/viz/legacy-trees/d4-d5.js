/* CSS 343 · L03: two compact canvas demos for the Trees & BST deck.
   D4 "tree-height": min vs max height of a binary tree with n nodes.
   D5 "array-tree": array-by-position layout of a binary tree (children 2i+1/2i+2).
   One ES5 IIFE, no deps; uses window.VizCore. Wired at file end. */
(function () {
  "use strict";
  var C = window.VizCore, COL = C.COLORS;

  function lg(n) { return Math.floor(Math.log(n) / Math.log(2)); }

  // ===================================================================
  // DEMO 1: tree-height: shortest (complete) vs tallest (path) tree.
  // ===================================================================

  // Build the SHORTEST binary tree with n nodes: a complete tree, filled
  // level by level (array-of-nodes by index; children 2i+1, 2i+2).
  function completeTree(n) {
    if (n < 1) return null;
    var a = [];
    for (var i = 0; i < n; i++) a.push({ left: null, right: null, x: 0, y: 0, depth: 0 });
    for (var j = 0; j < n; j++) {
      var L = 2 * j + 1, R = 2 * j + 2;
      if (L < n) a[j].left = a[L];
      if (R < n) a[j].right = a[R];
    }
    return a[0];
  }

  // Build the TALLEST binary tree with n nodes: a degenerate left path.
  function pathTree(n) {
    if (n < 1) return null;
    var root = { left: null, right: null }, cur = root;
    for (var i = 1; i < n; i++) { cur.left = { left: null, right: null }; cur = cur.left; }
    return root;
  }

  // Lay out `root` inside x-range [x0,x1], vertical step `lev`, starting at `top`.
  // x by in-order rank, y by depth. Returns max depth.
  function layoutIn(root, x0, x1, top, lev) {
    var idx = 0, maxD = 0, n = 0;
    (function d(t, dp) { if (!t) return; t.depth = dp; if (dp > maxD) maxD = dp; n++; d(t.left, dp + 1); d(t.right, dp + 1); })(root, 0);
    var dx = n > 1 ? (x1 - x0) / (n - 1) : 0;
    (function ino(t) { if (!t) return; ino(t.left); t.x = (n > 1 ? x0 + idx * dx : (x0 + x1) / 2); idx++; t.y = top + t.depth * lev; ino(t.right); })(root);
    return maxD;
  }

  function buildTreeHeight(el) {
    var W = 880, H = 320;
    // S04 layout: the n-slider is the only relevant action (no transport: static compare)
    var sc = C.scaffold(el, {
      w: W, h: H,
      actions: '<span class="grp"><label class="chk">n = <span class="nlab">8</span> nodes</label>' +
               '<input type="range" min="1" max="31" value="8" aria-label="number of nodes" style="width:200px"></span>'
    });
    var g = { ctx: sc.ctx }, ctx = sc.ctx;
    var ctrls = { setStatus: sc.setStatus };
    var slider = sc.actionsEl.querySelector("input"), nlab = sc.actionsEl.querySelector(".nlab");

    function caption(s, x, y, color) {
      ctx.fillStyle = color || COL.ink; ctx.font = "600 14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s, x, y);
    }

    function render() {
      var n = parseInt(slider.value, 10);
      nlab.textContent = n;
      C.clear(ctx, W, H);

      var minH = lg(n), maxH = n - 1, top = 44, r = 11;
      // vertical step shrinks if the path is deep so it stays on-canvas.
      var avail = H - top - 36;
      var levMin = minH > 0 ? Math.min(40, avail / minH) : 40;
      var levMax = maxH > 0 ? Math.min(40, avail / maxH) : 40;

      // titles + divider
      caption("minimum height", 220, 18, COL.green);
      caption("maximum height", 660, 18, COL.red);
      ctx.strokeStyle = COL.link; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(440, 28); ctx.lineTo(440, H - 8); ctx.stroke();

      var shortest = completeTree(n), tallest = pathTree(n);
      layoutIn(shortest, 30, 410, top, levMin);   // left half
      layoutIn(tallest, 480, 840, top, levMax);   // right half (past the x=440 divider)

      var greenStyle = { fill: COL.paleGreen, ring: COL.green };
      var redStyle = { fill: COL.paleRed, ring: COL.red };
      C.drawTree(ctx, shortest, { r: r, colorOf: function () { return greenStyle; }, labelOf: function () { return ""; } });
      C.drawTree(ctx, tallest, { r: r, colorOf: function () { return redStyle; }, labelOf: function () { return ""; } });

      caption("shortest: height = ⌊log₂ n⌋ = " + minH, 220, H - 14, COL.green);
      caption("tallest: height = n−1 = " + maxH, 660, H - 14, COL.red);

      ctrls.setStatus("n = " + n + " node" + (n === 1 ? "" : "s") +
        " → height ranges from " + minH + " (balanced) to " + maxH + " (a path)");
    }

    slider.addEventListener("input", render);
    render();
  }

  // ===================================================================
  // DEMO 2: array-tree: binary tree mapped to array by position.
  //   root at 0; node i -> children 2i+1, 2i+2; node j -> parent floor((j-1)/2).
  //   Tree has a gap so some array cells are wasted slots.
  // ===================================================================

  // Tree keys keyed by array index. Indices present: 0,1,2,4,5,9,10
  // (index 3 missing → a gap → wasted slots also at 7,8 below it).
  function arrayModel() {
    var keys = {}; // index -> key letter
    keys[0] = "M"; keys[1] = "E"; keys[2] = "R";
    keys[4] = "A"; keys[5] = "C"; keys[9] = "H"; keys[10] = "T";
    var maxIdx = 10;
    return { keys: keys, maxIdx: maxIdx };
  }

  function buildArrayTree(el) {
    var W = 880, H = 320;
    // S04 layout: Reset on top; the formula narration goes to an output half
    var sc = C.scaffold(el, {
      w: W, h: H,
      actions: '<span class="grp"><button class="alt" data-act="reset">Reset</button></span>',
      output: "index & formulas"
    });
    var ctx = sc.ctx, canvas = sc.canvas;
    var ctrls = { setStatus: sc.setStatus, on: sc.on };
    var model = arrayModel(), sel = null;
    var nodeHits = []; // {idx, x, y, r}
    var cellHits = []; // {idx, x, y, w, h}: array cells are clickable too

    var TOP = 24, LEV = 46, R = 16;           // tree region (top half)
    var ROWY = 248, CELL = 56, CELLH = 40;    // array region (bottom)

    function present(i) { return model.keys.hasOwnProperty(i); }

    function render() {
      C.clear(ctx, W, H);
      nodeHits = [];

      // ---- tree (top half): position nodes by array index ----
      // depth = floor(log2(i+1)); within a level, slot = i - (2^depth - 1).
      var nCells = model.maxIdx + 1;
      var maxDepth = lg(nCells); // deepest present level (indices up to 10 → depth 3)
      function depthOf(i) { return lg(i + 1); }
      function slotOf(i) { return i - (Math.pow(2, depthOf(i)) - 1); }
      function levelCount(d) { return Math.pow(2, d); }
      var treeW = W - 60;
      function nodeX(i) {
        var d = depthOf(i), slots = levelCount(d), s = slotOf(i);
        return 30 + treeW * (s + 0.5) / slots;
      }
      function nodeY(i) { return TOP + R + depthOf(i) * LEV; }

      // edges (parent → child) for present nodes
      ctx.lineWidth = 1.5; ctx.strokeStyle = COL.link;
      for (var i = 0; i <= model.maxIdx; i++) {
        if (!present(i)) continue;
        var p = Math.floor((i - 1) / 2);
        if (i > 0 && present(p)) {
          ctx.beginPath(); ctx.moveTo(nodeX(p), nodeY(p)); ctx.lineTo(nodeX(i), nodeY(i)); ctx.stroke();
        }
      }
      // nodes
      for (var k = 0; k <= model.maxIdx; k++) {
        if (!present(k)) continue;
        var x = nodeX(k), y = nodeY(k), fill = COL.fillIdle, ring = COL.ringIdle, tx = COL.ink;
        if (sel != null) {
          var par = Math.floor((sel - 1) / 2), cL = 2 * sel + 1, cR = 2 * sel + 2;
          if (k === sel) { fill = COL.accent; ring = COL.accent; tx = "#fff"; }
          else if (k === par) { fill = COL.paleBlue; ring = COL.blue; }
          else if (k === cL || k === cR) { fill = COL.paleGreen; ring = COL.green; }
        }
        ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * Math.PI);
        ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke();
        ctx.fillStyle = tx; ctx.font = "600 14px system-ui, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(model.keys[k], x, y);
        nodeHits.push({ idx: k, x: x, y: y, r: R });
      }

      // ---- GHOST path: an EMPTY slot is selected → show where that index would
      //      live, plus the WHOLE missing ancestor chain (grey) up to the nearest
      //      real node, so the ghost is anchored to the actual tree.
      if (sel != null && !present(sel)) {
        var GREY = "#b6bccb";
        var chain = [sel], up = sel;                // sel, then missing ancestors, ending at a present one (or the root slot)
        while (up > 0) { up = Math.floor((up - 1) / 2); chain.push(up); if (present(up)) break; }
        ctx.save();
        ctx.setLineDash([5, 4]);
        // grey dashed edges along the entire missing path
        ctx.lineWidth = 1.5; ctx.strokeStyle = GREY;
        for (var ci = 0; ci + 1 < chain.length; ci++) {
          ctx.beginPath();
          ctx.moveTo(nodeX(chain[ci + 1]), nodeY(chain[ci + 1]));
          ctx.lineTo(nodeX(chain[ci]), nodeY(chain[ci]));
          ctx.stroke();
        }
        // grey ghost nodes for the missing intermediate ancestors
        for (var cj = 1; cj < chain.length; cj++) {
          var gi = chain[cj];
          if (present(gi)) continue;
          ctx.beginPath(); ctx.arc(nodeX(gi), nodeY(gi), R, 0, 2 * Math.PI);
          ctx.fillStyle = "#f4f5f8"; ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = GREY; ctx.stroke();
          ctx.fillStyle = GREY; ctx.font = "600 13px system-ui, sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("[" + gi + "]", nodeX(gi), nodeY(gi));
        }
        // the selected ghost itself (accent)
        var gx2 = nodeX(sel), gy2 = nodeY(sel);
        ctx.beginPath(); ctx.arc(gx2, gy2, R, 0, 2 * Math.PI);
        ctx.fillStyle = COL.paleViolet; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = COL.accent; ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COL.accent; ctx.font = "600 13px system-ui, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("[" + sel + "]", gx2, gy2);
        ctx.restore();
      }

      // ---- array (bottom): one cell per index 0..maxIdx; every cell clickable ----
      var n = model.maxIdx + 1;
      var totalW = n * CELL, x0 = (W - totalW) / 2;
      cellHits = [];
      ctx.textBaseline = "middle";
      for (var a = 0; a < n; a++) {
        var cx = x0 + a * CELL, has = present(a);
        var par2 = Math.floor((sel - 1) / 2), cl2 = 2 * sel + 1, cr2 = 2 * sel + 2;
        var cf = has ? COL.fillIdle : "#eceef3", cr2c = COL.ringIdle, dashCell = false;
        if (sel != null) {
          if (a === sel) {
            if (has) { cf = COL.accent; cr2c = COL.accent; }
            else { cf = COL.paleViolet; cr2c = COL.accent; dashCell = true; }   // selected EMPTY slot
          }
          else if (a === par2) { cf = has ? COL.paleBlue : "#e4ebf7"; cr2c = COL.blue; }
          else if (a === cl2 || a === cr2) { cf = has ? COL.paleGreen : "#e2f0e8"; cr2c = COL.green; }
        }
        ctx.fillStyle = cf; ctx.fillRect(cx, ROWY, CELL - 4, CELLH);
        ctx.lineWidth = (sel === a ? 2.5 : 1.5); ctx.strokeStyle = cr2c;
        if (dashCell) ctx.setLineDash([5, 4]);
        ctx.strokeRect(cx, ROWY, CELL - 4, CELLH);
        ctx.setLineDash([]);
        ctx.textAlign = "center";
        if (has) {
          ctx.fillStyle = (sel === a ? "#fff" : COL.ink); ctx.font = "600 15px system-ui, sans-serif";
          ctx.fillText(model.keys[a], cx + (CELL - 4) / 2, ROWY + CELLH / 2);
        } else {
          ctx.fillStyle = (sel === a ? COL.accent : COL.dim); ctx.font = "11px system-ui, sans-serif";
          ctx.fillText("-", cx + (CELL - 4) / 2, ROWY + CELLH / 2);
        }
        // index label under cell
        ctx.fillStyle = COL.dim; ctx.font = "11px system-ui, sans-serif";
        ctx.fillText(String(a), cx + (CELL - 4) / 2, ROWY + CELLH + 11);
        cellHits.push({ idx: a, x: cx, y: ROWY, w: CELL - 4, h: CELLH });
      }
      // "wasted" note
      ctx.fillStyle = COL.dim; ctx.font = "11px system-ui, sans-serif"; ctx.textAlign = "left";
      ctx.fillText("greyed = wasted slot", x0, ROWY - 8);
    }

    function status(i) {
      var cL = 2 * i + 1, cR = 2 * i + 2, par = Math.floor((i - 1) / 2);
      var parStr = i === 0 ? "none (root)" : "⌊(" + i + "−1)/2⌋ = " + par;
      if (present(i)) {
        sc.setOutput("node " + model.keys[i] + " at index " + i +
          "\nchildren at 2·" + i + "+1=" + cL + " and 2·" + i + "+2=" + cR +
          "\nparent at " + parStr);
      } else {
        var kids = cL > model.maxIdx ? cL + " and " + cR + " (beyond the array)"
          : cL + " and " + cR + (cR > model.maxIdx ? " (beyond the array)" : "");
        sc.setOutput("index " + i + " is a WASTED slot: allocated, but no node lives here." +
          "\nchildren would be at " + kids + "\nparent at " + parStr +
          (present(par) ? " (" + model.keys[par] + ")" : "") + "");
      }
    }

    function hitTest(mx, my) {
      for (var i = nodeHits.length - 1; i >= 0; i--) {
        var h = nodeHits[i], dx = mx - h.x, dy = my - h.y;
        if (dx * dx + dy * dy <= h.r * h.r) return h.idx;
      }
      for (var j = 0; j < cellHits.length; j++) {    // array cells: same action
        var cc = cellHits[j];
        if (mx >= cc.x && mx <= cc.x + cc.w && my >= cc.y && my <= cc.y + cc.h) return cc.idx;
      }
      return null;
    }
    function mouseXY(e) {
      var rect = canvas.getBoundingClientRect();
      // scale CSS pixels back to the logical 880×320 coordinate space.
      var sx = canvas.width / rect.width, sy = canvas.height / rect.height;
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
    }

    canvas.addEventListener("click", function (e) {
      var m = mouseXY(e), idx = hitTest(m.x, m.y);
      if (idx != null) { sel = idx; render(); status(idx); }
    });
    canvas.addEventListener("mousemove", function (e) {
      var m = mouseXY(e);
      canvas.style.cursor = hitTest(m.x, m.y) != null ? "pointer" : "default";
    });

    ctrls.on(function (act) {
      if (act === "reset") {
        sel = null; render(); sc.setOutput("");
        ctrls.setStatus("Click a node OR an array cell: parent/child follow the index formulas. Clicking a greyed (wasted) cell ghosts where that index would live in the tree.");
      }
    });

    render();
    ctrls.setStatus("Click a node OR an array cell: parent/child follow the index formulas. Clicking a greyed (wasted) cell ghosts where that index would live in the tree.");
  }

  // ---- register both demos -------------------------------------------
  C.wire("tree-height", buildTreeHeight);
  C.wire("array-tree", buildArrayTree);
})();
