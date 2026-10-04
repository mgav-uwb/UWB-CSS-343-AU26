/* CSS 343 · L03: shared Binary Search Tree ENGINE (viz/bst-engine.js).

   A fully-functional BST as an ordered SYMBOL TABLE: unique keys, each with a
   value that rides along (default value = insertion order). Every operation
   returns a list of STEPS so any UI can animate it identically:

       step = { hi: node|null, color: css|null, msg: string, apply: fn|null }

   The engine owns `root`; a step's apply() commits that step's mutation and may
   RETURN the node to highlight (used when a node is created inside apply). This
   is the single source of truth for the BST demos (build / search / delete / …).

   Node: { key, val, left, right, size }.  x/y/depth are added by the UI's layout.
   No dependencies. Exposes window.BSTEngine. */
(function () {
  "use strict";
  var HIT = "#0a7d4d", MISS = "#b3261e", NEW = "#d39a00", UPD = "#2563eb", PROMO = "#7c5cff";

  function makeNode(key, val) { return { key: key, val: val, left: null, right: null, size: 1 }; }

  function BST() { this.root = null; this.clock = 0; }   // clock → default value (insertion order)

  BST.prototype.size = function (x) { return x ? x.size : 0; };
  BST.prototype.fixSizes = function () {                 // recompute every subtree size (simple + correct)
    var self = this;
    (function f(x) { if (!x) return; f(x.left); f(x.right); x.size = 1 + self.size(x.left) + self.size(x.right); })(this.root);
  };

  // ---- insert / put -------------------------------------------------------
  BST.prototype.insert = function (key, val) {
    if (val == null) val = this.clock++;
    var self = this, s = [];
    if (!this.root) {
      s.push({ msg: "tree empty → insert " + key + " (value " + val + ") as the root", color: NEW,
        apply: function () { self.root = makeNode(key, val); return self.root; } });
      return s;
    }
    var cur = this.root, par = null, side = null;
    while (cur) {
      (function (c) { s.push({ hi: c, msg: "compare " + key + " vs " + c.key + (key < c.key ? " → go left" : key > c.key ? " → go right" : "") }); })(cur);
      if (key === cur.key) {   // unique keys: a repeat UPDATES the value, adds no node
        (function (c) { s.push({ hi: c, color: UPD, msg: key + " already present → update its value to " + val + " (no new node)", apply: function () { c.val = val; return c; } }); })(cur);
        return s;
      }
      par = cur; side = key < cur.key ? "left" : "right"; cur = cur[side];
    }
    (function (p, sd) { s.push({ msg: "null " + sd + " link → insert " + key + " (value " + val + ") here", color: NEW,
      apply: function () { p[sd] = makeNode(key, val); self.fixSizes(); return p[sd]; } }); })(par, side);
    return s;
  };

  // ---- search / get -------------------------------------------------------
  BST.prototype.get = function (key) {
    var s = [], cur = this.root;
    if (!cur) { s.push({ msg: "tree is empty: search miss", color: MISS }); return s; }
    while (cur) {
      if (key === cur.key) { s.push({ hi: cur, color: HIT, msg: "found " + key + " (value " + cur.val + "): search HIT" }); return s; }
      (function (c) { s.push({ hi: c, msg: "compare " + key + " vs " + c.key + (key < c.key ? " → go left" : " → go right") }); })(cur);
      cur = key < cur.key ? cur.left : cur.right;
    }
    s.push({ msg: "fell off a null link: search MISS", color: MISS });
    return s;
  };

  // ---- delete (Hibbard): via in-order SUCCESSOR or PREDECESSOR -----------
  BST.prototype.remove = function (key, via) {
    via = via === "predecessor" ? "predecessor" : "successor";
    var self = this, s = [], cur = this.root, par = null, side = null;
    while (cur && cur.key !== key) {
      (function (c) { s.push({ hi: c, msg: "compare " + key + " vs " + c.key }); })(cur);
      par = cur; side = key < cur.key ? "left" : "right"; cur = cur[side];
    }
    if (!cur) { s.push({ msg: key + " not found: nothing to delete", color: MISS }); return s; }
    var x = cur, p = par, sd = side;
    function link(child) { if (!p) self.root = child; else p[sd] = child; self.fixSizes(); }

    if (!x.left || !x.right) {                        // 0 or 1 child
      var child = x.left || x.right;
      s.push({ hi: x, color: MISS, msg: "delete " + key + ": " + (child ? "one child → splice it up" : "leaf → remove it") });
      s.push({ hi: child, color: NEW, msg: child ? child.key + " takes its place" : "removed", apply: function () { link(child); return child; } });
      return s;
    }
    if (via === "successor") {                        // min of the right subtree
      s.push({ hi: x, color: MISS, msg: "delete " + key + " (two children) → in-order SUCCESSOR = min of the right subtree" });
      var sp = x, w = x.right;
      s.push({ hi: w, msg: "enter the right subtree" });
      while (w.left) { sp = w; w = w.left; (function (n) { s.push({ hi: n, msg: "go left for a smaller successor" }); })(w); }
      var succ = w, spar = sp;
      s.push({ hi: x, color: PROMO, msg: "copy successor " + succ.key + " up into " + key + "'s node", apply: function () { x.key = succ.key; x.val = succ.val; return x; } });
      s.push({ hi: succ, color: MISS, msg: "remove the now-duplicate " + succ.key + " (deleteMin of the right subtree)", apply: function () { if (spar === x) spar.right = succ.right; else spar.left = succ.right; self.fixSizes(); return null; } });
    } else {                                          // max of the left subtree
      s.push({ hi: x, color: MISS, msg: "delete " + key + " (two children) → in-order PREDECESSOR = max of the left subtree" });
      var pp = x, u = x.left;
      s.push({ hi: u, msg: "enter the left subtree" });
      while (u.right) { pp = u; u = u.right; (function (n) { s.push({ hi: n, msg: "go right for a larger predecessor" }); })(u); }
      var pred = u, ppar = pp;
      s.push({ hi: x, color: PROMO, msg: "copy predecessor " + pred.key + " up into " + key + "'s node", apply: function () { x.key = pred.key; x.val = pred.val; return x; } });
      s.push({ hi: pred, color: MISS, msg: "remove the now-duplicate " + pred.key + " (deleteMax of the left subtree)", apply: function () { if (ppar === x) ppar.left = pred.left; else ppar.right = pred.left; self.fixSizes(); return null; } });
    }
    return s;
  };

  // ---- circle-plus editing: empty child slots + their valid key bounds ----
  BST.prototype.slots = function () {
    var out = [];
    (function walk(t, lo, hi) {
      if (!t) return;
      if (!t.left)  out.push({ parent: t, side: "left",  lo: lo,    hi: t.key });
      if (!t.right) out.push({ parent: t, side: "right", lo: t.key, hi: hi });
      walk(t.left, lo, t.key); walk(t.right, t.key, hi);
    })(this.root, null, null);
    return out;
  };
  BST.prototype._used = function () { var u = {}; (function w(t){ if(!t) return; u[t.key]=1; w(t.left); w(t.right); })(this.root); return u; };
  BST.prototype._keyBetween = function (lo, hi) {       // an unused A–Z letter strictly inside (lo,hi); null if none
    var used = this._used();
    var loC = lo == null ? 64 : lo.charCodeAt(0);       // exclusive bounds
    var hiC = hi == null ? 91 : hi.charCodeAt(0);
    var mid = Math.round((loC + hiC) / 2);
    for (var d = 0; d <= 26; d++) for (var g = 0; g < (d ? 2 : 1); g++) {
      var code = mid + (g ? -d : d);
      if (code > loC && code < hiC) { var ch = String.fromCharCode(code); if (!used[ch]) return ch; }
    }
    return null;
  };
  // add a child at an empty slot (parent=null → the root). Auto-picks a valid key.
  BST.prototype.addAt = function (parent, side) {
    var self = this, val = this.clock;
    if (!parent) {
      if (this.root) return [];
      var rk = this._keyBetween(null, null);
      return [{ color: NEW, msg: "add " + rk + " as the root", apply: function () { self.clock++; self.root = makeNode(rk, val); return self.root; } }];
    }
    var sl = null, all = this.slots();
    for (var i = 0; i < all.length; i++) if (all[i].parent === parent && all[i].side === side) sl = all[i];
    if (!sl) return [];
    var key = this._keyBetween(sl.lo, sl.hi);
    if (key == null) return [{ hi: parent, color: MISS, msg: "no key fits between " + (sl.lo || "start") + " and " + (sl.hi || "end") + " on this side" }];
    return [{ hi: parent, color: NEW, msg: "add " + key + " (value " + val + ") as " + parent.key + "'s " + side + " child",
      apply: function () { self.clock++; parent[side] = makeNode(key, val); self.fixSizes(); return parent[side]; } }];
  };

  // ---- valid-entry queries (for the UI's insert/edit dropdowns) -----------
  // ALL unused domain keys strictly inside (lo,hi). Domain: letters A–Z when the
  // tree's keys are strings (or `numeric` is false), else integers 0–99.
  BST.prototype.keysBetween = function (lo, hi, numeric) {
    var used = this._used(), out = [];
    if (numeric == null) {
      var probe = this.root; while (probe && probe.left) probe = probe.left;
      numeric = probe ? typeof probe.key === "number" : false;
    }
    if (numeric) {
      var a = lo == null ? 0 : Math.floor(lo) + 1, b = hi == null ? 99 : Math.ceil(hi) - 1;
      for (var k = Math.max(0, a); k <= Math.min(99, b); k++) if (!used[k]) out.push(k);
    } else {
      var loC = lo == null ? 64 : String(lo).charCodeAt(0), hiC = hi == null ? 91 : String(hi).charCodeAt(0);
      for (var c = Math.max(65, loC + 1); c <= Math.min(90, hiC - 1); c++) {
        var ch = String.fromCharCode(c); if (!used[ch]) out.push(ch);
      }
    }
    return out;
  };
  // ---- edge bisection ------------------------------------------------------
  // A key m can BISECT the edge p→c (m takes the link below p; c's ENTIRE
  // subtree hangs under m) iff m fits c's slot bounds AND sits entirely on one
  // side of c's subtree: m ∈ (slotLo, min(subtree))  → subtree hangs RIGHT of m,
  //                      m ∈ (max(subtree), slotHi)  → subtree hangs LEFT of m.
  BST.prototype._subMin = function (t) { while (t && t.left) t = t.left; return t; };
  BST.prototype._subMax = function (t) { while (t && t.right) t = t.right; return t; };
  BST.prototype._slotBounds = function (c) {           // exclusive bounds of the slot node c occupies
    var lo = null, hi = null, t = this.root;
    while (t && t !== c) { if (c.key < t.key) { hi = t.key; t = t.left; } else { lo = t.key; t = t.right; } }
    return t ? { lo: lo, hi: hi } : null;
  };
  BST.prototype.bisectEntries = function (p, c) {      // sorted valid bisecting keys (may be empty)
    var b = this._slotBounds(c); if (!b) return [];
    var mn = this._subMin(c).key, mx = this._subMax(c).key;
    return this.keysBetween(b.lo, mn).concat(this.keysBetween(mx, b.hi));
  };
  BST.prototype.insertBetween = function (p, c, key) { // steps: bisect the edge p→c with `key`
    var self = this, side = p.left === c ? "left" : "right", val = this.clock;
    var below = key < this._subMin(c).key ? "right" : "left";   // where c's subtree hangs under the new node
    return [
      { hi: p, msg: "bisect the " + p.key + "–" + c.key + " edge: " + key + " takes the link below " + p.key },
      { hi: c, color: NEW, msg: c.key + "'s whole subtree hangs as " + key + "'s " + below + " child: order preserved",
        apply: function () { var m = makeNode(key, val); self.clock++; m[below] = c; p[side] = m; self.fixSizes(); return m; } }
    ];
  };

  // Exclusive (lo,hi) bounds for RELABELING node x's key while staying a valid
  // BST: above everything in its left subtree & ancestor lower bound, below
  // everything in its right subtree & ancestor upper bound.
  BST.prototype.editBounds = function (x) {
    var lo = null, hi = null, t = this.root;
    while (t && t !== x) { if (x.key < t.key) { hi = t.key; t = t.left; } else { lo = t.key; t = t.right; } }
    if (!t) return null;
    var m = x.left;  while (m && m.right) m = m.right; if (m) lo = m.key;   // max of left subtree
    var n = x.right; while (n && n.left)  n = n.left;  if (n) hi = n.key;   // min of right subtree
    return { lo: lo, hi: hi };
  };
  BST.prototype.setKey = function (x, newKey) {          // relabel (value rides along unchanged)
    if (newKey === x.key) return [];
    var old = x.key;
    return [{ hi: x, color: UPD, msg: "relabel " + old + " → " + newKey + ": still a valid BST (fits this node's key window)",
      apply: function () { x.key = newKey; return x; } }];
  };

  // ---- snapshots (for the UI's Undo) --------------------------------------
  BST.prototype.snapshot = function () {
    function c(t) { return t ? { key: t.key, val: t.val, size: t.size, left: c(t.left), right: c(t.right) } : null; }
    return { root: c(this.root), clock: this.clock };
  };
  BST.prototype.restore = function (snap) { this.root = snap.root; this.clock = snap.clock; };
  BST.prototype.inorderKeys = function () { var out = []; (function w(t) { if (!t) return; w(t.left); out.push(t.key); w(t.right); })(this.root); return out; };

  // ---- bulk build + measurements (non-animated) --------------------------
  BST.prototype._put = function (key, val) {          // plain iterative insert
    if (val == null) val = this.clock++;
    if (!this.root) { this.root = makeNode(key, val); return; }
    var cur = this.root;
    while (true) {
      if (key < cur.key) { if (cur.left) cur = cur.left; else { cur.left = makeNode(key, val); return; } }
      else if (key > cur.key) { if (cur.right) cur = cur.right; else { cur.right = makeNode(key, val); return; } }
      else { cur.val = val; return; }
    }
  };
  BST.prototype.buildFrom = function (keys) { for (var i = 0; i < keys.length; i++) this._put(keys[i]); this.fixSizes(); return this; };
  BST.prototype.height = function (t) {               // edges to the deepest leaf (empty = -1); iterative
    if (arguments.length === 0) t = this.root;
    var h = -1, st = t ? [{ n: t, d: 0 }] : [];
    while (st.length) { var e = st.pop(); if (e.d > h) h = e.d; if (e.n.left) st.push({ n: e.n.left, d: e.d + 1 }); if (e.n.right) st.push({ n: e.n.right, d: e.d + 1 }); }
    return h;
  };
  BST.prototype.internalPathLength = function () {    // sum of node depths (root = 0), and n
    var ipl = 0, n = 0, st = this.root ? [{ n: this.root, d: 0 }] : [];
    while (st.length) { var e = st.pop(); ipl += e.d; n++; if (e.n.left) st.push({ n: e.n.left, d: e.d + 1 }); if (e.n.right) st.push({ n: e.n.right, d: e.d + 1 }); }
    return { ipl: ipl, n: n };
  };
  BST.prototype.avgDepth = function () { var r = this.internalPathLength(); return r.n ? r.ipl / r.n : 0; };

  // ---- ordered queries (plain; push each visited node into `path` if given) ----
  BST.prototype.minNode = function (path) { var t = this.root, last = null; while (t) { if (path) path.push(t); last = t; t = t.left; } return last; };
  BST.prototype.maxNode = function (path) { var t = this.root, last = null; while (t) { if (path) path.push(t); last = t; t = t.right; } return last; };
  BST.prototype.floorNode = function (k, path) {      // largest key <= k
    var t = this.root, best = null;
    while (t) { if (path) path.push(t); if (k === t.key) return t; if (k < t.key) t = t.left; else { best = t; t = t.right; } }
    return best;
  };
  BST.prototype.ceilingNode = function (k, path) {    // smallest key >= k
    var t = this.root, best = null;
    while (t) { if (path) path.push(t); if (k === t.key) return t; if (k > t.key) t = t.right; else { best = t; t = t.left; } }
    return best;
  };
  BST.prototype.selectNode = function (i, path) {     // node of 0-based rank i
    var t = this.root;
    while (t) { if (path) path.push(t); var ls = this.size(t.left); if (i < ls) t = t.left; else if (i > ls) { i -= ls + 1; t = t.right; } else return t; }
    return null;
  };
  BST.prototype.rankOf = function (k, path) {         // # keys strictly < k
    var t = this.root, r = 0;
    while (t) { if (path) path.push(t); if (k < t.key) t = t.left; else if (k > t.key) { r += this.size(t.left) + 1; t = t.right; } else return r + this.size(t.left); }
    return r;
  };
  BST.prototype.contains = function (k) { var t = this.root; while (t) { if (k === t.key) return true; t = k < t.key ? t.left : t.right; } return false; };
  BST.prototype.rangeKeys = function (lo, hi, outNodes) {   // in-order keys in [lo,hi]
    var out = [];
    (function go(t) { if (!t) return; if (lo < t.key) go(t.left); if (lo <= t.key && t.key <= hi) { out.push(t.key); if (outNodes) outNodes.push(t); } if (t.key < hi) go(t.right); })(this.root);
    return out;
  };

  window.BSTEngine = { BST: BST, colors: { HIT: HIT, MISS: MISS, NEW: NEW, UPD: UPD, PROMO: PROMO } };
})();
