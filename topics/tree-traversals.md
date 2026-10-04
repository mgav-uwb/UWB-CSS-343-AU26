<!--
  TOPIC · Traversals and expression trees.
  Teaches: pre-, in-, post- and level-order; one recursion with the visit moved; expression trees and post-order evaluation.
  Needs:   tree basics.
  Demos:   traversals, expr-tree (Summer canvas demos)
  Program: none
  Budget:  ~12 min, 8 slides.
  Ported from Summer 2026 L03-trees-bst.md, parts 3, 4.
-->

### Traversals and expression trees

<small>(~12 min)</small>

--

## Traversals: visiting every node

**Four** orders: three **recursive**, one with a queue:

- **pre-order**: node, left, right
- **in-order**: left, node, right
- **post-order**: left, right, node
- **level-order**: top-to-bottom, left-to-right, using a **queue** (like BFS)

**In-order of a *search* tree visits the keys in sorted order**.

--

## Recursive traversals: where `visit` goes

All three are the **same recursion**; only the line where you **visit** moves:

```cpp
void traverse(Node* t) {
    if (!t) return;
    // visit(t);   ← PRE: before the subtrees
    traverse(t->left);
    // visit(t);   ← IN: between the subtrees
    traverse(t->right);
    // visit(t);   ← POST: after the subtrees
}
```

--

## Level-order: a queue (BFS)

No recursion: a **queue** sweeps the tree top-to-bottom, left-to-right.

```cpp
void levelOrder(Node* t) {
    Queue q;  q.enqueue(t);
    while (!q.empty()) {
        Node* n = q.dequeue();
        if (!n) continue;
        visit(n->item);
        q.enqueue(n->left);
        q.enqueue(n->right);
    }
}
```

--

## Demo: traversals

<div class="algo-viz" data-algo="traversals">
<pre class="viz-fallback">
            H
          /   \
         C     R           pre:    H C A E R P X
        / \   / \          in:     A C E H P R X   ← sorted!
       A   E P   X         post:   A E C P X R H
                           level:  H C R A E P X
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Pick an order, then **Step / Play**: the visit sequence builds up. **In-order of a BST = sorted.**</small>

--

## Expression trees: the tree *is* the meaning

**Operators** internal, **operands** leaves. The **shape encodes precedence**, so `(2+3)×4` and `2+(3×4)` are *different trees* with different values:

```text
   (2 + 3) × 4 = 20          2 + (3 × 4) = 14
         ×                         +
        / \                       / \
       +   4                     2   ×
      / \                           / \
     2   3                         3   4
```

Parentheses / precedence pick the **tree**; the tree then says exactly what to do.

--

## Evaluating the tree

**Recursively, bottom-up**: a leaf is its value; an operator applies to its evaluated subtrees.

```cpp
double eval(Node* t) {
    if (isLeaf(t)) return t->value;     // operand
    double a = eval(t->left);           // evaluate the subtrees first
    double b = eval(t->right);
    return apply(t->op, a, b);          // then combine: a (op) b
}
```

This is a **post-order** computation: children before parent. No precedence rules needed: the structure already encodes them.

--

## Demo: expression trees

<div class="algo-viz" data-algo="expr-tree">
<pre class="viz-fallback">
        +                2+3*4: precedence shapes the tree:
       / \               × binds tighter, so it sits LOWER
      2   ×
         / \             evaluate bottom-up (post-order):
        3   4            3 × 4 = 12,  then  2 + 12 = 14
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Type any expression → **Build** its tree (precedence sets the shape: try `(2+3)*4` vs `2+3*4`). **Evaluate** computes it **bottom-up**, each value bubbling up to the root.</small>

