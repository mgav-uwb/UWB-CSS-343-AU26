<!--
  TOPIC · Red-black trees.
  Teaches: a 2-3 tree encoded in a binary tree (a 2-node is a black node, a 3-node two nodes joined by a red link; left- or right-leaning, one side chosen); the left-leaning rules; RBNode and the tree class; insert as a BST insert with a red node, and the catalog of what it can break; delete as a BST delete (predecessor or successor), the three removals, and the missing black with its five places; then the fixes: rotateLeft, rotateRight, flipColors (the 2-3 split), recolor the root; the delete repairs (2-3 merge and borrow, as recolors and rotations); height at most 2 log2 n; red-black against AVL.
  Needs:   2-3 trees (including delete), avl rotations.
  Demos:   rb-convert, rb-insert-cases, rb-moves, rb-delete (registry), rb-insert (slide spec)
  Program: none
  Budget:  ~50 min, 34 slides.
  Ported from Summer 2026 L05-2-3-b-trees.md, parts 3; restructured violation-first 2026-10-19.
-->

### Red-black trees

> Guibas and Sedgewick named red-black trees in 1978; Sedgewick has said red was the color that printed best on their laser printer at Xerox PARC.

<small>L. J. Guibas and R. Sedgewick, FOCS 1978</small>

--

## 2-3 is elegant… but painful to code

Two node types, split logic, promotion, new roots: lots of cases, lots of pointer surgery. In real code we'd rather have **one** node type.

**Idea:** store a 2-3 tree as an ordinary **binary** tree, with one **color bit** per node to remember where the 3-nodes were.

--

## Encode one 2-3 node

<div>
<img src="../../topics/figures/trees/rb-encode-nodes.svg" style="height:200px" alt="
   2-node  →  one black node       3-node  →  two nodes and a RED link
    [ a ]          a                [ a | b ]          b
    /   \         / \               /   |   \       R /  \
   A     B       A   B             A    B    C       a    C
                                                    / \
                                                   A   B
   (R marks the red link)">
</div>

- every 2-3 edge becomes a **black** link; the glue inside a 3-node is **red**
- a node is **red** when the link from its parent is red; the **root** is black
- subtrees keep their key ranges, so in-order is unchanged

--

## Left or right?

<div>
<img src="../../topics/figures/trees/rb-left-right.svg" style="height:200px" alt="
    [ a | b ]        left-leaning        right-leaning
    /   |   \             b                   a
   A    B    C         R /  \               /  \ R
                        a    C             A    b
                       / \                     / \
                      A   B                   B   C
   (R marks the red link)">
</div>

- both are BSTs: same keys, same order, same black links
- pick **one** side for every 3-node: **one** encoding per 2-3 tree, one shape to repair
- we lean **left** (Sedgewick); right-leaning mirrors every rule

--

## The rules (left-leaning)

1. the **root** is black
2. red links **lean left**: a red node is a left child
3. **no node has two red links**: no red child under a red node, no two red children
4. **black balance**: every root-to-null path crosses the same number of black links

Rules 2 and 3: every 2-3 node is a 2-node or a left-leaning 3-node (a 4-node needs two red links at one node). Rule 4: all 2-3 leaves at one depth (black links = the 2-3 edges).

--

## Demo: 2-3 to red-black, and back

<div class="algo-viz" data-algo="rb-convert">
<pre class="viz-fallback">
   2-3 tree                      left-leaning red-black BST
          [40]                              40
        /      \                         /       \
     [20]     [60|80]                  20          80
     /  \     /  |  \                 /  \      R /   \
  [10] [30] [50][70][90|95]         10    30     60     95
                                               /  \  R /
                                             50   70  90
   decode: collapse each red link into its parent
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Left: the 2-3 tree. Right: the red-black BST, built one 2-3 node at a time, then decoded back. Try a right-leaning case.</small>

--

## The data structure

```cpp
struct RBNode {
    int     key;
    RBNode* left  = nullptr;
    RBNode* right = nullptr;
    bool    red   = true;      // color of the link from the parent
    explicit RBNode(int k) : key(k) {}
};
bool isRed(const RBNode* h) { return h && h->red; }   // null: black

class RedBlackTree {
public:
    bool contains(int key) const;  // plain BST search
    void insert(int key);          // BST insert, then fix
    void remove(int key);          // BST delete, then repair
private:
    RBNode* root = nullptr;        // always black
};
```

--

## Insert: a BST insert, colored red

1. a plain **BST insert**: the new key becomes a leaf
2. color it **red**

**Why red?** A black leaf adds a black link to the paths through it, and to no other path: **black balance** would break on **every** insert. A red leaf adds **no** black link, so rule 4 holds. What a red leaf can break are the **red-link** rules (1, 2, 3).

--

## What an insert can break

<div>
<img src="../../topics/figures/trees/rb-insert-breaks.svg" style="height:420px" alt="
   before → after (R marks a red link; the 2-3 node below each tree)
   insert 30 into [50]:      50  →   50        [50] → [30|50]       no violation
                                   R /
                                   30
   insert 70 into [50]:      50  →   50        [50] → [50|70]       a red link leans right
                                       \ R
                                        70
   insert 70 into [30|50]:   50  →   50        [30|50] → [30|50|70] two red children
                           R /     R / \ R
                           30      30   70
   insert 10 into [30|50]:   50  →     50      [30|50] → [10|30|50] two reds in a row
                           R /       R /
                           30        30
                                   R /
                                   10
   insert 40 into [30|50]:   50  →   50        [30|50] → [30|40|50] two reds in a row, leaning right
                           R /     R /
                           30      30
                                     \ R
                                      40">
</div>

Later, from repairs: a red link sent **up**; a **red root**.

--

## Demo: insert, violations only

<div class="algo-viz" data-algo="rb-insert-cases" data-config='{"fix": false}'>
<pre class="viz-fallback">
   into [50], 30:   50 with red left 30            no violation
   into [50], 70:   50 with red RIGHT 70           leans right
   into [20|40], 50: 40 with red children 20, 50   two red children
   into [20|40], 10: 40, red 20, red 10            two reds in a row
   into [20|40], 30: 40, red 20, red right 30      two reds in a row, leaning right
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Each case attaches one red node and names the rule it breaks; the 2-3 tree on the left shows the 3-node or 4-node it made.</small>

--

## Delete, step 1: to the bottom

- find the key with a BST search
- **two children?** swap it with its **in-order predecessor**: the largest key on its left (left once, then right to the end)
- the **in-order successor** (smallest key on its right) works **equally well**, mirrored; we use the predecessor, as the 2-3 delete does, so both deletes stay in step
- now the key sits in a node with **at most one child**

--

## Delete, step 2: remove it

<div>
<img src="../../topics/figures/trees/rb-delete-removal.svg" style="height:390px" alt="
   a red leaf: delete 10 from [10|20], no violation
        40                 40          2-3:  [40]               [40]
       /  \       →       /  \              /    \      →      /    \
     20    60           20    60       [10|20]   [60]       [20]   [60]
   R /
   10
   one child: delete 20 from [10|20], no violation
        40                 40          2-3:  [40]               [40]
       /  \       →       /  \              /    \      →      /    \
     20    60           10    60       [10|20]   [60]       [10]   [60]
   R /
   10
   a black leaf: delete 20, a black link goes missing
        40                 40          2-3:  [40]               [40]
       /  \       →       /  \              /    \      →      /    \
     20    60          ( )    60         [20]    [60]       [ ]    [60]
   (R marks a red link; ( ) and [ ] are the empty node)">
</div>

Only the **black leaf** breaks a rule: a black link goes missing (dashed).

--

## The missing black: where it can sit

<div>
<img src="../../topics/figures/trees/rb-delete-positions.svg" style="height:250px" alt="
   under a 2-node [p]            under a 3-node [r|g]
       p          p              g             g             g
      / \        / \          R / \         R / \         R / \
    ( )  S      S  ( )        r   U         r   U         r  ( )
                             / \           / \           / \
                           ( )  S         S  ( )        S   U
     left        right        left         middle        right
   (R marks a red link; ( ) is the empty node; S and U are sibling subtrees)">
</div>

The repair depends on the **parent** (2-node or 3-node), the empty node's **place** (left, middle, right) and the **sibling** next to it (2-node or 3-node).

--

## What the 2-3 delete does

<div>
<img src="../../topics/figures/trees/rb-23-delete.svg" style="height:371px" alt="
   ( ) is the empty node
   a sibling is a 3-node: borrow            [40]                 [60]
                                            /   \        →       /   \
                                          ( )  [60|70]        [40]  [70]      done
   3-node parent, 2-node siblings: merge   [30|60]               [60]
                                           /  |  \       →       /    \
                                         ( ) [40] [70]       [30|40]  [70]    done
   2-node parent, 2-node sibling: merge     [40]                 ( )
                                            /   \        →        |
                                          ( )   [60]           [40|60]        the empty node moves up
   the empty node is the root: drop it      ( )
                                             |           →     [40|60]        one level shorter
                                          [40|60]">
</div>

--

## Demo: delete, violations only

<div class="algo-viz" data-algo="rb-delete" data-config='{"fix": false, "height": 140, "groups": ["no violation", "under a 2-node", "under a 3-node"]}'>
<pre class="viz-fallback">
   red leaf, one child, two children:   no violation
   under a 2-node: the empty node left or right, the sibling a 2-node or a 3-node
   under a 3-node: the empty node left, middle or right, the siblings 2-nodes or 3-nodes
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Each case stops at the violation and its situation. Dashed: the empty node.</small>

--

## Fixing an insert

<div>
<img src="../../topics/figures/trees/rb-insert-fixes.svg" style="height:420px" alt="
   (R marks a red link)
   a red link leans right:   50              70        2-3 tree unchanged: [50|70]
                               \ R  rotateLeft(50)   R /
                                70      →         50
   two reds in a row:        50              30        2-3 tree unchanged: [10|30|50]
                           R /   rotateRight(50)  R / \ R
                           30         →         10    50
                         R /
                         10
   two red children:         50              50 (red)  2-3 split: [30|50|70] → [50] over [30], [70]
                           R / \ R flipColors(50) / \
                           30   70      →       30   70
   a red root:            50 (red)           50        2-3 tree unchanged
                           /  \ recolor 50 black / \
                          30   70     →       30   70">
</div>

Each fix: constant time, where the violation is.

--

## rotateLeft / rotateRight

The order-preserving pointer surgery of AVL rotations, now also **carrying the color**:

```cpp
// h: subtree root whose right link leans red.
// x (= h->right) rises and takes h's color;
// h drops to x's left and turns red.
RBNode* rotateLeft(RBNode* h) {
    RBNode* x = h->right;
    h->right = x->left;
    x->left  = h;
    x->red = h->red;   // x takes h's old color
    h->red = true;     // h is now glued to x as red
    return x;
}
```

`rotateRight` mirrors it. In-order is unchanged.

--

## flipColors = a 2-3 split

Two **red children** = a temporary **4-node**. Flip all three colors:

```cpp
// h: a node with two red children (neither is null:
// a red link is never null). Its children turn black,
// and h turns red: h joins its parent's 2-3 node.
void flipColors(RBNode* h) {
    h->red        = !h->red;
    h->left->red  = !h->left->red;
    h->right->red = !h->right->red;
}
```

The middle key moves **up** and the outer two become 2-nodes: "promote the middle and split," in color. Its new red link can break a rule one level up, checked the same way.

--

## Demo: the three moves

<div class="algo-viz" data-algo="rb-moves">
<pre class="viz-fallback">
   rotateLeft(20): 40 rises, 30 moves across, the red link now leans left;
                   the 2-3 tree is unchanged
   rotateRight(40): the mirror image
   flipColors(20): [10|20|30] splits, 20 joins its parent [50]
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Each move beside the 2-3 tree: rotating a **red** link leaves the 2-3 tree unchanged; a flip splits a 4-node.</small>

--

## Insert, assembled

```cpp
RBNode* fixUp(RBNode* h) {   // each test fixes one violation
    if (isRed(h->right) && !isRed(h->left))     h = rotateLeft(h);
    if (isRed(h->left) && isRed(h->left->left)) h = rotateRight(h);
    if (isRed(h->left) && isRed(h->right))      flipColors(h);
    return h;
}
RBNode* put(RBNode* h, int key) {
    if (!h) return new RBNode(key);           // new node: red
    if      (key < h->key) h->left  = put(h->left,  key);
    else if (key > h->key) h->right = put(h->right, key);
    return fixUp(h);                          // on the way back up
}
void RedBlackTree::insert(int key) {
    root = put(root, key);
    root->red = false;                        // fix a red root
}
```

--

## Demo: insert, violations and fixes

<div class="algo-viz" data-algo="rb-insert-cases" data-config='{"height": 175}'>
<pre class="viz-fallback">
   into [20|40], 30 (between):
     violation: two reds in a row, the second leaning right
     rotateLeft(20) → two reds in a row → rotateRight(40)
     → two red children → flipColors(30): 30 joins [60]
   split moves up: a flip's red link lands one level up, same checks
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Each case names the violation, then fixes it, one move per step.</small>

--

## Fixing a delete: merge and borrow, in color

- **merge** (sibling a 2-node): **recolor**: the sibling turns red, a red parent key black; if it leans right, **rotateLeft**. Under a 2-node parent: **moves up**
- **borrow** (sibling a 3-node): **1 to 3 rotations** lift the sibling's key, a **recolor**: **done**
- **above the root**: drop the empty node, one level shorter

--

## Repairs under a 2-node

<div>
<img src="../../topics/figures/trees/rb-repairs-2node.svg" style="height:528px" alt="
   ( ) is the empty node; R marks a red link
   empty left, sibling [60|70]: borrow    40(( ), 70(R 60))  rotateRight(70), rotateLeft(40), recolor 40, 70 black   →  60(40, 70)     done
   empty left, sibling [60]: merge        40(( ), 60)        recolor 60 red, rotateLeft(40)                        →  ( ) over 60(R 40)  the empty node moves up
   empty right, sibling [10|20]: borrow   40(20(R 10), ( ))  rotateRight(40), recolor 10, 40 black                 →  20(10, 40)     done
   empty right, sibling [20]: merge       40(20, ( ))        recolor 20 red                                        →  ( ) over 40(R 20)  the empty node moves up">
</div>

--

## Borrow: an empty end child

<div>
<img src="../../topics/figures/trees/rb-repairs-3borrow-ends.svg" style="height:466px" alt="
   parent [30|60]: 60 black, 30 its red left child; ( ) is the empty node
   empty left, middle sibling [40|50]:     rotateRight(50), rotateLeft(30), recolor 30, 50 black   →  parent [40|60]   done
   empty right, middle sibling [40|50]:    rotateLeft(30), rotateRight(60), recolor 40, 60 black   →  parent [30|50]   done">
</div>

--

## Borrow: the empty middle

<div>
<img src="../../topics/figures/trees/rb-repairs-3borrow-middle.svg" style="height:390px" alt="
   parent [30|60]: 60 black, 30 its red left child; ( ) is the empty node
   empty middle, left sibling [10|20]:     rotateRight(30), recolor 10, 30 black                   →  parent [20|60]   done
   empty middle, left [10], right [70|80]: rotateRight(80), rotateLeft(60), rotateRight(60),
                                           recolor 60, 80 black                                    →  parent [30|70]   done">
</div>

The middle borrows from the **left** sibling if it can, otherwise from the right.

--

## Merge under a 3-node

<div>
<img src="../../topics/figures/trees/rb-repairs-3merge.svg" style="height:528px" alt="
   parent [30|60]: 60 black, 30 its red left child; ( ) is the empty node
   empty left, middle sibling [40]:         recolor 30 black, 40 red, rotateLeft(30)   →  [60] over [30|40], [70]   done
   empty middle, siblings [10] and [70]:    recolor 30 black, 10 red                   →  [60] over [10|30], [70]   done
   empty right, middle sibling [40]:        rotateRight(60), recolor 60 black, 40 red  →  [30] over [10], [40|60]   done">
</div>

--

## Demo: delete repairs, 2-node parent

<div class="algo-viz" data-algo="rb-delete" data-config='{"height": 190, "groups": ["no violation", "under a 2-node"]}'>
<pre class="viz-fallback">
   [40] over [20], [60|70], delete 20: borrow
     rotateRight(70), rotateLeft(40), recolor 40, 70 black → [60] over [40], [70]
   [40] over [20], [60], delete 20: merge
     recolor 60 red, rotateLeft(40) → [40|60]; the empty node is above the root: drop it
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>The violation, its situation, the 2-3 repair, then each red-black move; the 2-3 panel updates when the repair is complete.</small>

--

## Demo: delete repairs, 3-node parent

<div class="algo-viz" data-algo="rb-delete" data-config='{"height": 180, "groups": ["under a 3-node"]}'>
<pre class="viz-fallback">
   [30|60] over [10], [40|50], [70]:
     delete 10: borrow (rotateRight(50), rotateLeft(30), recolor)
     delete 70: borrow (rotateLeft(30), rotateRight(60), recolor)
   [30|60] over [10], [40], [70]: delete 10, 40 or 70: merge
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Seven cases: the empty node left, middle or right of a 3-node, borrowing when a sibling can spare a key, merging otherwise.</small>

--

## Demo: repairs that move up

<div class="algo-viz" data-algo="rb-delete" data-config='{"groups": ["moving up"]}'>
<pre class="viz-fallback">
   delete 10 from [40] over [20] ([10], [30]) and [60|80] ([50], [70], [90]):
     merge at [20]: the empty node moves up to [40]'s left
     borrow from [60|80]: done
   merge into a 3-node: the second merge ends the repair
   merge to the root: two merges, the tree is one level shorter
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>A merge under a 2-node parent moves the empty node up a level; the next level repairs the same way.</small>

--

## Demo: red-black BST

<div class="algo-viz" data-algo="rb-insert">
<pre class="viz-fallback">
   left-leaning red-black BST beside its 2-3 tree. Insert: a BST insert
   with a red node, then each violation named and fixed. Delete: a BST
   delete; a black leaf leaves a missing black, repaired by borrow or merge.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Insert or delete any key: every violation is named, then fixed. Click a key, then Run, to delete it.</small>

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

