/* CSS 343 · L03: expression-tree visualizer (demo D7).
   Builds an EXPRESSION TREE from any arithmetic expression (precedence decides
   the SHAPE), then EVALUATES the tree recursively, bottom-up (post-order):
   each node's value is computed from its children and bubbles up to the root.

   Grammar (recursive descent, standard precedence + left associativity):
     expr   := term (('+'|'-') term)*
     term   := factor (('*'|'/') factor)*
     factor := NUMBER | '(' expr ')'
   Node: operator {op,left,right,value} | operand {val,left:null,right:null,value}.
   Wires .algo-viz[data-algo="expr-tree"]. Uses window.VizCore. No deps. */
(function () {
  "use strict";
  var C = window.VizCore, K = C.COLORS;
  var W = 880, H = 330, R = 17, SPEED = 750;

  // ---- parser (recursive descent) ----------------------------------------
  function tokenize(s) {
    var toks = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (c === " " || c === "\t") { i++; continue; }
      if (c >= "0" && c <= "9") {
        var num = "";
        while (i < s.length && s[i] >= "0" && s[i] <= "9") num += s[i++];
        toks.push({ t: "num", v: num });
      } else if (c === "+" || c === "-" || c === "*" || c === "/" || c === "x" || c === "×") {
        toks.push({ t: "op", v: (c === "x" || c === "×") ? "*" : c }); i++;
      } else if (c === "(" || c === ")") {
        toks.push({ t: c }); i++;
      } else {
        throw new Error("bad character '" + c + "'");
      }
    }
    return toks;
  }
  function parse(str) {
    var toks = tokenize(str), pos = 0;
    function peek() { return toks[pos]; }
    function eat(t) { var k = toks[pos]; if (!k || k.t !== t) throw new Error("expected " + t); pos++; return k; }
    function leaf(val) { return { val: val, left: null, right: null, value: null, evaluated: false }; }
    function bin(op, l, r) { return { op: op, left: l, right: r, value: null, evaluated: false }; }
    function expr() {
      var node = term();
      while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) {
        var op = eat("op").v; node = bin(op, node, term());
      }
      return node;
    }
    function term() {
      var node = factor();
      while (peek() && peek().t === "op" && (peek().v === "*" || peek().v === "/")) {
        var op = eat("op").v; node = bin(op, node, factor());
      }
      return node;
    }
    function factor() {
      var k = peek();
      if (!k) throw new Error("unexpected end");
      if (k.t === "num") { pos++; return leaf(k.v); }
      if (k.t === "(") { eat("("); var e = expr(); eat(")"); return e; }
      throw new Error("unexpected token");
    }
    if (toks.length === 0) throw new Error("empty");
    var root = expr();
    if (pos !== toks.length) throw new Error("trailing tokens");
    return root;
  }

  // ---- helpers ------------------------------------------------------------
  function isLeaf(t) { return t && t.left == null && t.right == null; }
  function lbl(t) { return t.op != null ? (t.op === "*" ? "×" : t.op) : t.val; }
  function applyOp(op, a, b) {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "*") return a * b;
    return b === 0 ? NaN : a / b;
  }
  function fmt(x) { return (typeof x === "number" && !Number.isInteger(x)) ? Math.round(x * 100) / 100 : x; }
  function postorder(t, out) { if (!t) return; postorder(t.left, out); postorder(t.right, out); out.push(t); }
  function clearEval(t) { if (!t) return; t.evaluated = false; t.value = null; clearEval(t.left); clearEval(t.right); }

  // ---- visualizer ---------------------------------------------------------
  function buildExprTree(el) {
    // S04 layout: Build/Evaluate + expression input + transport + speed on top;
    // the running result goes to an output half. Fully scrubbable (◁ steps back).
    var sc = C.scaffold(el, {
      w: W, h: H,
      actions:
        '<span class="grp"><button data-act="build">Build</button>' +
        '<button data-act="eval">Evaluate</button></span>' +
        '<span class="grp"><input type="text" placeholder="e.g. (2+3)*4" aria-label="expression"></span>' +
        window.VizPlayer.tpButtonsHTML() + window.VizPlayer.speedHTML(),
      output: "result"
    });
    var ctx = sc.ctx;
    var input = sc.actionsEl.querySelector("input");
    var ctrls = { setStatus: sc.setStatus, on: sc.on, input: input };
    input.value = el.getAttribute("data-expr") || "2+3*4";

    var v = { root: null, order: [], pos: 0, hi: null, done: false, timer: null, src: "", speedMs: SPEED };
    var playBtn = sc.btn("play");
    function syncPlay() { playBtn.textContent = v.timer ? "⏸" : "▶"; playBtn.title = v.timer ? "pause" : "play"; }
    function updateOut() {
      if (!v.root) { sc.setOutput(""); return; }
      var done = v.root.evaluated;
      sc.setOutput(v.src + (done ? "  =  " + fmt(v.root.value)
        : v.pos > 0 ? "   (step " + v.pos + "/" + v.order.length + ")" : ""));
    }

    function colorOf(t) {
      if (t === v.hi) return { fill: K.hit, ring: K.hit, text: "#fff", ringWidth: 3 };
      if (t.evaluated) return { fill: K.paleGreen, ring: K.green, text: K.ink, ringWidth: isLeaf(t) ? 2 : 3 };
      if (isLeaf(t)) return { fill: K.fillIdle, ring: K.ringIdle, text: K.ink };
      return { fill: K.paleViolet, ring: K.accent, text: K.ink, ringWidth: 3 };  // operator, not yet evaluated
    }

    // the computed value of each operator, shown below its node as it bubbles up
    function drawValues() {
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      v.order.forEach(function (n) {
        if (n.evaluated && !isLeaf(n)) {
          ctx.font = "700 14px system-ui, sans-serif"; ctx.fillStyle = K.green;
          ctx.fillText("= " + fmt(n.value), n.x, n.y + R + 13);
        }
      });
    }

    function render() {
      C.clear(ctx, W, H);
      if (!v.root) { C.emptyMsg(ctx, W, H, "enter an expression and press Build"); updateOut(); return; }
      C.layoutBinary(v.root, W, H, { margin: 42, level: 52, top: 38 });
      C.drawTree(ctx, v.root, { r: R, colorOf: colorOf, labelOf: lbl, font: "600 16px system-ui, sans-serif" });
      drawValues();
      updateOut();
    }

    function doBuild() {
      stopEval();
      var src = ctrls.input.value.trim(), tree;
      try { tree = parse(src); }
      catch (err) { ctrls.setStatus("couldn't parse “" + src + "”: try e.g. (2+3)*4"); return; }
      v.root = tree; v.src = src; v.order = []; v.pos = 0; v.hi = null; v.done = false;
      clearEval(tree); render();
      ctrls.setStatus("tree built: precedence set its shape. Press ▶ to evaluate bottom-up.");
    }

    function startEval() {
      if (!v.root) { ctrls.setStatus("build a tree first"); return; }
      clearEval(v.root);
      v.order = []; postorder(v.root, v.order); v.pos = 0; v.hi = null; v.done = false;
      render(); ctrls.setStatus("evaluate bottom-up: a leaf is its value; an operator combines its subtrees.");
    }
    function ensure() { if (!v.order.length || v.done) startEval(); }

    // jump to step p by REPLAYING from scratch (state is a pure function of p) -
    // this is what makes ◁ / ⏮ scrubbing possible.
    function applyTo(p) {
      ensure();
      p = Math.max(0, Math.min(p, v.order.length));
      clearEval(v.root);
      for (var i = 0; i < p; i++) {
        var n = v.order[i];
        if (isLeaf(n)) { n.value = Number(n.val); n.evaluated = true; }
        else { n.value = applyOp(n.op, n.left.value, n.right.value); n.evaluated = true; }
      }
      v.pos = p; v.done = false; v.hi = p > 0 ? v.order[p - 1] : null;
      render();
      if (p === 0) ctrls.setStatus("at the start: ▷ steps the bottom-up evaluation");
      else {
        var m = v.order[p - 1];
        ctrls.setStatus(isLeaf(m) ? "operand " + m.val : lbl(m) + " = " + fmt(m.value));
      }
    }

    function stepOnce() {
      ensure();
      if (v.pos >= v.order.length) {
        v.hi = v.root; v.done = true; render();
        ctrls.setStatus("done: result = " + fmt(v.root.value));
        stopEval(); return false;
      }
      var n = v.order[v.pos++]; v.hi = n;
      if (isLeaf(n)) {
        n.value = Number(n.val); n.evaluated = true;
        ctrls.setStatus("operand " + n.val + ": its value is " + n.val);
      } else {
        var a = n.left.value, b = n.right.value, r = applyOp(n.op, a, b);
        n.value = r; n.evaluated = true;
        ctrls.setStatus(lbl(n) + " :  " + fmt(a) + " " + lbl(n) + " " + fmt(b) + " = " + fmt(r));
      }
      render(); return true;
    }
    function playToggle() {
      if (v.timer) { stopEval(); return; }
      ensure();
      (function go() { if (stepOnce()) { v.timer = setTimeout(go, v.speedMs); syncPlay(); } else stopEval(); })();
    }
    function stopEval() { clearTimeout(v.timer); v.timer = null; syncPlay(); }

    sc.actionsEl.addEventListener("change", function (e) {
      if (e.target.getAttribute && e.target.getAttribute("data-act") === "speed") v.speedMs = parseInt(e.target.value, 10) || SPEED;
    });
    ctrls.on(function (act) {
      if (act === "build") doBuild();
      else if (act === "eval") { startEval(); playToggle(); }
      else if (act === "rev") { stopEval(); applyTo(0); }
      else if (act === "bk1") { stopEval(); applyTo(v.pos - 1); }
      else if (act === "play") playToggle();
      else if (act === "fw1") { stopEval(); stepOnce(); }
      else if (act === "ff") { stopEval(); ensure(); applyTo(v.order.length); if (v.root && v.root.evaluated) { v.done = true; v.hi = v.root; render(); ctrls.setStatus("done: result = " + fmt(v.root.value)); } }
    });
    ctrls.input.addEventListener("keydown", function (e) { if (e.key === "Enter") doBuild(); });

    doBuild();   // show the tree immediately (primed: ▶ runs the evaluation)
  }

  C.wire("expr-tree", buildExprTree);
})();
