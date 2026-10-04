<!--
  TOPIC · Red-black trees.
  Teaches: a 2-3 tree encoded in a binary tree with red links; the left-leaning red-black invariants; rotate-left, rotate-right and flip-colors; flip-colors is a 2-3 split; height at most 2 log2 n; red-black against AVL.
  Needs:   2-3 trees, avl rotations.
  Demos:   rb-insert (slide spec)
  Program: none
  Budget:  ~20 min, 13 slides.
  Ported from Summer 2026 L05-2-3-b-trees.md, parts 3.
-->

### Red-black trees

<small>(~20 min)</small>

--

## 2-3 is elegant… but painful to code

Two node types, split logic, promotion, new roots: lots of cases, lots of pointer surgery. In real code we'd rather have **one** node type.

**Idea:** represent a 2-3 tree as an ordinary **binary** tree, using a **color bit** on each link to remember where the 3-nodes were.

--

## Encode a 3-node with a red link

A **3-node** `[a | c]` becomes two BST nodes joined by a **RED** link; all other links are **BLACK**:

```text
   3-node            red-black BST
  [ a | c ]      →        c            (red link
   /  |  \               / \            a-c glues
  A   B   C          a(red) C           the 3-node)
                     /  \
                    A    B
```

A 2-node is just a black-linked BST node. Red links **lean left** (a convention that halves the cases).

--

## The color is on the *link*

Convention: a node's **color** = the color of the link **to its parent**.

- **red** link → this node is glued into its parent as a **3-node**
- **black** link → an ordinary 2-3 tree edge
- the **root** link is **black** by definition

So "a red node" just means "a red link above it."

--

## The red-black invariants

1. Red links **lean left** (no right-leaning red links).
2. **No node has two red links** in a row (no 3-node has a third key: that's the "4-node" we must split).
3. **Black balance:** every root-to-null path has the **same number of black links**.

Invariant 3 = "all 2-3 leaves at the same depth," restated for the binary encoding.

--

## The three restoring moves

Insert like a normal BST (the new link is **red**), then on the way up apply whichever fixes a violation:

```text
   right child red, left black     →  rotateLeft
   left red AND left-left red       →  rotateRight
   both children red                →  flipColors
```

Each move mirrors a 2-3 split or promote: and there are only **three** of them.

--

## rotateLeft / rotateRight

The order-preserving pointer surgery of AVL rotations: now it also **carries the red color**:

```cpp
// h: subtree root to fix (its right link leans red).
// x (=h->right) can't be null: a null link is black.
// x rises and inherits h's color; h drops to x's left
// and turns red.
Node* rotateLeft(Node* h) {
    Node* x = h->right;
    h->right = x->left;
    x->left  = h;
    x->red = h->red;   // x takes h's old color
    h->red = true;      // h is now glued to x as red
    return x;
}
```

`rotateRight` mirrors it. In-order is unchanged.

--

## flipColors = a 2-3 split

When a node has **two red children**, it is a temporary **4-node**. Flip all three colors:

```cpp
// h: node with two red children: a temporary 4-node.
// Neither child is null (red implies non-null). Push
// the color up (h "promotes"); children turn black.
void flipColors(Node* h) {
    h->red        = !h->red;
    h->left->red  = !h->left->red;
    h->right->red = !h->right->red;
}
```

`h` turning red is it "joining its parent": which may now have two reds itself, cascading exactly like a 2-3 split. That is precisely "promote the middle and split," expressed in color.

--

## Demo: red-black insert

<div class="algo-viz" data-algo="rb-insert">
<pre class="viz-fallback">
   left-leaning red-black BST. insert = BST insert (the new
   link is RED) + fix-ups on the way up: rotateLeft,
   rotateRight, flipColors. RED links drawn thick red; every
   root-to-null path keeps the same number of BLACK links.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Red links** (thick, red) are the glued 3-nodes. Insert and watch the fix-ups: a **rotateLeft** leans a red left, a **flipColors** splits a 4-node. Black-height stays equal on every path. (Delete works too: more on that next.)</small>

--

## Proof, part 1: bounding b

**Claim: height ≤ 2 log₂ n.** Let **b** = black links on a root-to-null path: the *same* on every path, by invariant 3.

**Collapse every red link into its parent**: this recovers the **2-3 tree**.

- the tree's **black** links = the 2-3 tree's **edges**, so `b` = **that 2-3 tree's height**
- a 2-3 tree's height is at most log₂ n (all 2-nodes)

So: **b ≤ log₂ n**.

--

## Proof, part 2: no double-reds

Between any two **black** links, invariant 2 allows **at most one red** (two in a row is the violation `flipColors` removes): so **height ≤ 2b**.

Combine with part 1 (`b ≤ log₂ n`): **height ≤ 2 log₂ n = Θ(log n)**, guaranteed for any insert order. ∎

--

## Why we care

Because a red-black BST is **one node type + one color bit**, it's the balanced tree that real libraries ship:

- C++ `std::map` / `std::set`
- Java `TreeMap` / `TreeSet`
- the Linux kernel scheduler, and more

Guaranteed **Θ(log n)**, height **≤ 2 log₂ n**, with plain-BST code plus recoloring.

--

## Red-black vs AVL

| | AVL | red-black |
|---|---|---|
| height | ≤ 1.44 log₂n | ≤ 2 log₂n |
| balance | **tighter** | looser |
| rotations / insert | ≤ 1 (single or double) | **≤ 2** + recolors |
| rotations / delete | up to **log n** | **O(1)** |
| best for | **read**-heavy | **write**-heavy |

Both guaranteed Θ(log n): AVL searches a bit faster, red-black updates a bit faster.

