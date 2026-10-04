/* CSS 343 · L04: AVL tree ENGINE (viz/avl-engine.js).
   A height-balanced BST whose insert / get / remove each return a list of
   STEPS in the shared player's format:
       step = { color, msg, apply() -> highlighted-node|null }
   apply() advances the LIVE tree to that step's state and returns the node to
   highlight, so viz/player.js can scrub the animation both ways. The engine
   also exposes snapshot()/restore() so the timeline can save & rewind state.
   Node shape: { key, height, left, right }. Depends on nothing.
   Exposes window.AVLEngine. */
(function () {
  "use strict";
  var HIT = "#0a7d4d", MISS = "#b3261e", NEW = "#d39a00", WARN = "#7c5cff";

  function node(key) { return { key: key, left: null, right: null, height: 0 }; }
  function h(t) { return t ? t.height : -1; }
  function bf(t) { return t ? h(t.left) - h(t.right) : 0; }
  function fix(t) { t.height = 1 + Math.max(h(t.left), h(t.right)); }
  function rotR(y) { var x = y.left; y.left = x.right; x.right = y; fix(y); fix(x); return x; }
  function rotL(x) { var y = x.right; x.right = y.left; y.left = x; fix(x); fix(y); return y; }
  function clone(t) { return t ? { key: t.key, height: t.height, left: clone(t.left), right: clone(t.right) } : null; }
  function find(t, key) { while (t) { if (t.key === key) return t; t = key < t.key ? t.left : t.right; } return null; }
  function sizeOf(t) { return t ? 1 + sizeOf(t.left) + sizeOf(t.right) : 0; }

  function rebalanceNode(z) {                 // single OR double rotation; returns new subtree root
    if (bf(z) > 1) { if (bf(z.left) < 0) z.left = rotL(z.left); return rotR(z); }
    if (bf(z.right) > 0) z.right = rotR(z.right);
    return rotL(z);
  }
  function rotationName(z) {
    if (bf(z) > 1) return bf(z.left) < 0 ? "left-right (double)" : "left-left (single right rotation)";
    return bf(z.right) > 0 ? "right-left (double)" : "right-right (single left rotation)";
  }

  function AVL() { this.root = null; }

  // Build a player step that, when applied, sets the live tree to `snapTree`
  // and highlights the node with key `hiKey` (null = no highlight).
  function makeSteps() {
    var steps = [];
    return {
      list: steps,
      push: function (self, snapTree, hiKey, color, msg) {
        var s = clone(snapTree);
        steps.push({
          color: color || null, msg: msg || "",
          apply: function () { self.root = s ? clone(s) : null; return hiKey == null ? null : find(self.root, hiKey); }
        });
      }
    };
  }

  // ---- insert: BST descent, attach leaf, one rotation at the lowest ±2 node --
  AVL.prototype.insert = function (key) {
    var self = this, S = makeSteps();
    var snap = function (hi, c, m) { S.push(self, self.root, hi, c, m); };
    if (this.root == null) { this.root = node(key); snap(key, NEW, "insert " + key + " as the root"); return S.list; }

    var stack = [], cur = this.root;
    while (cur) {
      stack.push(cur);
      if (key < cur.key) { if (!cur.left) break; cur = cur.left; }
      else if (key > cur.key) { if (!cur.right) break; cur = cur.right; }
      else { snap(cur.key, MISS, key + " already present: no new node"); return S.list; }
    }
    var p = stack[stack.length - 1];
    if (key < p.key) p.left = node(key); else p.right = node(key);
    for (var i = stack.length - 1; i >= 0; i--) fix(stack[i]);
    snap(key, NEW, "insert " + key + " at a leaf, update heights on the way up");

    var zi = -1;
    for (i = stack.length - 1; i >= 0; i--) { if (Math.abs(bf(stack[i])) >= 2) { zi = i; break; } }
    if (zi < 0) { snap(key, HIT, "still balanced: no rotation (height " + h(this.root) + ")"); return S.list; }

    var z = stack[zi], zp = zi > 0 ? stack[zi - 1] : null;
    snap(z.key, WARN, z.key + " is unbalanced: bf = " + (bf(z) > 0 ? "+2" : "−2") + " → " + rotationName(z));
    var nr = rebalanceNode(z);
    if (!zp) this.root = nr; else if (zp.left === z) zp.left = nr; else zp.right = nr;
    for (i = zi - 1; i >= 0; i--) fix(stack[i]);
    snap(nr.key, HIT, "rotation done: balanced again (height " + h(this.root) + ")");
    return S.list;
  };

  // ---- get: highlight the search path ------------------------------------
  AVL.prototype.get = function (key) {
    var self = this, S = makeSteps();
    var snap = function (hi, c, m) { S.push(self, self.root, hi, c, m); };
    var cur = this.root;
    if (!cur) { snap(null, MISS, "the tree is empty"); return S.list; }
    while (cur) {
      if (key === cur.key) { snap(cur.key, HIT, "found " + key); return S.list; }
      snap(cur.key, NEW, key + (key < cur.key ? " < " : " > ") + cur.key + ": go " + (key < cur.key ? "left" : "right"));
      cur = key < cur.key ? cur.left : cur.right;
    }
    snap(null, MISS, key + " is not in the tree"); return S.list;
  };

  // ---- delete: BST delete, then rebalance up the path --------------------
  function minN(t) { while (t && t.left) t = t.left; return t; }
  function has(t, key) { return !!find(t, key); }
  function bstDel(t, key) {                    // plain BST delete, heights fixed, NO rotation
    if (!t) return null;
    if (key < t.key) t.left = bstDel(t.left, key);
    else if (key > t.key) t.right = bstDel(t.right, key);
    else {
      if (!t.left) return t.right;
      if (!t.right) return t.left;
      var s = minN(t.right); t.key = s.key; t.right = bstDel(t.right, s.key);
    }
    fix(t); return t;
  }
  function avlDel(t, key, rots) {              // AVL delete: rebalance up, recording rotations
    if (!t) return null;
    if (key < t.key) t.left = avlDel(t.left, key, rots);
    else if (key > t.key) t.right = avlDel(t.right, key, rots);
    else {
      if (!t.left) return t.right;
      if (!t.right) return t.left;
      var s = minN(t.right); t.key = s.key; t.right = avlDel(t.right, s.key, rots);
    }
    fix(t);
    if (Math.abs(bf(t)) >= 2) { rots.push(t.key + " (" + rotationName(t) + ")"); t = rebalanceNode(t); }
    return t;
  }
  AVL.prototype.remove = function (key) {
    var self = this, S = makeSteps();
    if (!has(this.root, key)) { S.push(self, this.root, key, MISS, key + " is not in the tree"); return S.list; }
    var before = clone(this.root);
    S.push(self, before, key, MISS, "delete " + key + ": remove it like a BST (successor if 2 children)");
    S.push(self, bstDel(clone(before), key), null, NEW, "removed " + key + "; a node on the path may now be unbalanced");
    var rots = [], finalRoot = avlDel(clone(before), key, rots);
    this.root = finalRoot;
    var msg = rots.length ? "rebalance up the path: rotation at " + rots.join(", ") : "no rotation needed: still balanced";
    S.push(self, finalRoot, null, HIT, msg + " (height " + h(finalRoot) + ")");
    return S.list;
  };

  // ---- in-order traversal: visit every node left→right -------------------
  AVL.prototype.inorder = function () {
    var self = this, S = makeSteps(), list = [];
    (function go(t) { if (!t) return; go(t.left); list.push(t.key); S.push(self, self.root, t.key, HIT, "visit " + t.key + "  (" + list.length + ")"); go(t.right); })(this.root);
    if (!list.length) S.push(self, self.root, null, MISS, "the tree is empty");
    return { steps: S.list, list: list };
  };

  // ---- range search: every key in [lo, hi] -------------------------------
  AVL.prototype.range = function (lo, hi) {
    var self = this, S = makeSteps(), list = [];
    (function go(t) {
      if (!t) return;
      if (t.key > lo) go(t.left);
      if (t.key >= lo && t.key <= hi) { list.push(t.key); S.push(self, self.root, t.key, HIT, t.key + " is in [" + lo + ", " + hi + "]"); }
      if (t.key < hi) go(t.right);
    })(this.root);
    if (!list.length) S.push(self, self.root, null, MISS, "no keys in [" + lo + ", " + hi + "]");
    return { steps: S.list, list: list };
  };

  // ---- timeline hooks + utilities ----------------------------------------
  AVL.prototype.snapshot = function () { return clone(this.root); };
  AVL.prototype.restore = function (s) { this.root = s ? clone(s) : null; };
  AVL.prototype.build = function (keys) { for (var i = 0; i < keys.length; i++) this.insert(keys[i]); return this; };
  AVL.prototype.height = function () { return h(this.root); };
  AVL.prototype.size = function () { return sizeOf(this.root); };

  window.AVLEngine = { AVL: AVL, find: find, clone: clone, colors: { HIT: HIT, MISS: MISS, NEW: NEW, WARN: WARN } };
})();
