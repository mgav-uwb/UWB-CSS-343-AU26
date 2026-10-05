<!--
TOPIC · Recursion.
  Teaches: base case and recursive case; the call stack; work before and after
           the call; structural recursion on a list and on a tree; the
           induction argument for correctness; binary search; four ways a
           recursion fails; recomputation measured on Fibonacci.
  Needs:   the owning-memory topic (Node, pointers).
  Demos:   factorial (the recursion tree and the call stack, side by side).
  Program: topics/code/recursion/recursion.cpp
  Budget:  ~28 min, 14 slides.
-->

### Recursion

<small>(~28 min)</small>

--

## The two parts

```cpp
long factorial(int n) {
    if (n <= 1) return 1;              // base case
    return n * factorial(n - 1);       // recursive case
}
```

- **base case:** answered directly, no further call
- **recursive case:** calls itself on a **smaller** instance
- every chain of calls must reach a base case

--

## The call stack

```text
factorial(4)                  returns 4 * 6 = 24
  factorial(3)                returns 3 * 2 = 6
    factorial(2)              returns 2 * 1 = 2
      factorial(1)            returns 1
```

- each call gets its own frame, with its own `n`
- at the deepest point **4 frames** are on the stack
- the multiplications happen on the way **back up**

--

## Watch the stack

<div class="algo-viz" data-algo="factorial" data-config='{"width":720,"cols":[520,200],"height":270,"chrome":{"costsInline":true,"showInput":false,"showClear":false}}'>
<pre class="viz-fallback">
   recursion tree            call stack at the base case
   [ 5 | 120 ]               factorial(1)   returns 1
   [ 4 |  24 ]               factorial(2)   2 * factorial(1) = ?
   [ 3 |   6 ]               factorial(3)   3 * factorial(2) = ?
   [ 2 |   2 ]               factorial(4)   4 * factorial(3) = ?
   [ 1 |   1 ]               factorial(5)   5 * factorial(4) = ?
   5 calls · 5 frames deep · 4 multiplications
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Left: every call so far, with its result once it returns. Right: the calls still open.</small>

--

## Predict the output

```cpp
void downUp(int n) {
    if (n == 0) return;
    cout << n << " ";
    downUp(n - 1);
    cout << n << " ";
}
```

What does `downUp(3)` print?

<details class="answer"><summary>Answer:</summary>

Output: `3 2 1 1 2 3`. The first print runs on the way down, the second on the way back up.

</details>

<small>Code: <a href="../../topics/code/recursion/recursion.cpp">recursion.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## A list is recursive data

A list is either

- **empty**, or
- a **node** followed by a **list**

```cpp
int length(const Node* p) {
    if (p == nullptr) return 0;
    return 1 + length(p->next);
}
```

The code has the same two cases as the data.

--

## A tree is recursive data

A tree is either **empty**, or a **node** with a **left tree** and a **right tree**.

```cpp
struct TNode { int key; TNode* left; TNode* right; };

int size(const TNode* t) {
    if (t == nullptr) return 0;
    return 1 + size(t->left) + size(t->right);
}

int height(const TNode* t) {
    if (t == nullptr) return 0;
    return 1 + max(height(t->left), height(t->right));
}
```

--

## Trace: height

```text
               50 (4)
             /        \
        30 (3)        70 (2)
        /    \            \
   20 (1)    40 (2)       80 (1)
                 \
                 45 (1)
```

In parentheses: the height of the subtree rooted at that node.

- size = **7**
- height = **4**, along 50, 30, 40, 45

--

## Why is it right?

**Claim:** `height(t)` is the number of nodes on the longest path down from `t`.

- **Base:** the empty tree has no nodes, and the function returns 0.
- **Step:** assume the claim for both subtrees. The longest path is `t`, then the longest path in the taller subtree.

Recursion writes the function. **Induction** proves it.

--

## Binary search: the problem

> Given a **sorted** array of *n* keys and a key, find its index, or report that it is absent.

- look at the **middle** element
- equal: found
- middle smaller: search the **right** half
- middle larger: search the **left** half

Each look discards at least half of what remains.

--

## Binary search: the code

```cpp
int bsearch(const vector<int>& a, int lo, int hi, int key) {
    if (lo > hi) return -1;
    int mid = lo + (hi - lo) / 2;
    if (a[mid] == key) return mid;
    if (a[mid] <  key) return bsearch(a, mid + 1, hi, key);
    return bsearch(a, lo, mid - 1, key);
}
```

- `lo > hi` is the empty range: the base case for "absent"
- the array is passed by const reference, so no call copies it

--

## Trace: find 63

```text
index  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14
key    3  7 12 18 21 26 30 34 41 47 52 58 63 69 75
```

| Call | lo | hi | mid | a[mid] | Decision |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 0 | 14 | 7 | 34 | go right |
| 2 | 8 | 14 | 11 | 58 | go right |
| 3 | 12 | 14 | 13 | 69 | go left |
| 4 | 12 | 12 | 12 | 63 | found at 12 |

<details class="answer"><summary>Answer:</summary>

Searching for 20, which is absent, also takes 4 probes: 34, 18, 26, 21, then `lo > hi`.

</details>

--

## How recursion goes wrong

- **no base case:** the calls never stop
- **the argument does not shrink:** the base case is never reached
- **recomputation:** the same subproblem is solved again and again
- **depth:** more frames than the stack can hold

The first two never finish. The last two finish in theory.

--

## Recomputation: Fibonacci

```cpp
long fib(int n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}
```

| n | fib(n) | Calls |
| ---: | ---: | ---: |
| 10 | 55 | 177 |
| 20 | 6,765 | 21,891 |
| 30 | 832,040 | 2,692,537 |

`fib(n - 2)` is computed twice, `fib(n - 3)` three times, `fib(n - 4)` five times.

