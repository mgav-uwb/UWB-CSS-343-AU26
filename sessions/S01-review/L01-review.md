<!--
  CSS 343 · Lecture 1: Review of C++, Recursion, and Counting.
  reveal.js: "---" alone on a line = next part (→), "--" = next slide (↓).
  Speaker notes follow "Note:". Metadata + run instructions live in README.md.
  A review of CSS 342 material, run as predict, run, explain. Live demos in
  demo/. Growth classes, the doubling experiment, memory and O/Θ/Ω notation
  are Lectures 2 and 3.

  Session plan (120 min):
    0:00  Part 0  The course                 (~8  min)
    0:08  Part 1  Passing arguments          (~7  min)
    0:15  Part 2  Owning memory              (~18 min)
    0:33  Part 3  Recursion                  (~25 min)
    0:58  BREAK                              (8 min)
    1:06  Part 4  Counting loops             (~12 min)
    1:18  Part 5  Counting recursion         (~12 min)
    1:30  Part 6  k-sum                      (~22 min)
    1:52  Part 7  Wrap and Homework 1        (~8  min)
-->

## CSS 343

### Data Structures, Algorithms & Discrete Mathematics II

**Lecture 1: Review of C++, Recursion, and Counting**

<small>Autumn 2026 · MW 1:15–3:15 · Dr. Marcel Gavriliu</small>

---

### Part 0 · The course

<small>(~8 min)</small>

--

## What we'll study

- **Data structures:** search trees, heaps, hash tables, graphs, tries
- **Algorithms:** graph search, shortest paths, spanning trees, greedy, divide and conquer, dynamic programming
- **Analysis:** the time and memory cost of each
- **Applications:** string matching, regular expressions, finite automata

--

## How a week runs

- **Monday and Wednesday:** lecture
- **Homework:** one per week, in C++, practice for the quiz
- **Quiz:** Mondays, 20 minutes, on paper, on the previous week
- **Programming assignments:** three (trees, graphs, dynamic programming)
- **Exams:** midterm Mon Nov 9, final Mon Dec 14

Quizzes and exams are **multiple choice, on paper**.

--

## Grading

| Component | Weight | Policy |
| --- | ---: | --- |
| Exams (midterm + final) | 50% | |
| Weekly quizzes | 21% | lowest 2 dropped |
| Programming assignments (3) | 21% | 7% each |
| Homework | 8% | lowest 2 dropped |

**2 late tokens** for the term: each extends one homework or programming assignment deadline by 48 hours.

--

## Where things are

- **Canvas:** announcements, submissions, grades
- **Course text:** an online textbook, one chapter per topic
- **Today's chapter:** <a href="../../textbook/foundations/foundation-recursion.html">Recursion & Induction</a>
- **Guides:** <a href="../../guides/guide-computing-environment.html">Computing Environment</a>, <a href="../../guides/guide-valgrind.html">Valgrind</a>
- **Compiler:** `g++ -std=c++17` on the CSS Linux lab

Code is graded on the lab machines. Build and test there before submitting.

--

## What this course assumes

From CSS 342, used in every session from here on:

- **C++:** references, pointers, heap memory, classes that own memory
- **Recursion:** writing it, tracing it, trusting it
- **Counting:** how many times a line of code runs

Today reviews all three.

---

### Part 1 · Passing arguments

<small>(~7 min)</small>

--

## Predict the output

```cpp
void byValue(int x)  { x = 99; }
void byRef(int& x)   { x = 99; }
void byPtr(int* x)   { *x = 99; }

int main() {
    int a = 1, b = 1, c = 1;
    byValue(a);
    byRef(b);
    byPtr(&c);
    cout << a << " " << b << " " << c << "\n";
}
```

<small>Output: `1 99 99`. `byValue` changed its own copy.</small> <!-- .element: class="fragment" -->

--

## Three ways to pass

| Parameter | The function receives | Can change the caller's variable? |
| --- | --- | --- |
| `int x` | a copy | no |
| `int& x` | the variable itself | yes |
| `int* x` | the variable's address | yes, through `*x` |
| <code style="white-space:nowrap">const int&amp; x</code> | the variable itself, read-only | no |

A pointer can be `nullptr`. A reference always refers to something.

--

## Pass by const reference

```cpp [1,6]
long sumByValue(vector<Tracked> a) {            // copies all N elements
    long s = 0;
    for (const Tracked& t : a) s += t.v;
    return s;
}
long sumByConstRef(const vector<Tracked>& a) {  // copies nothing
    long s = 0;
    for (const Tracked& t : a) s += t.v;
    return s;
}
```

Measured on a vector of 1000:

- by value: **1000** element copies per call
- by const reference: **0**

---

### Part 2 · Owning memory

<small>(~18 min)</small>

--

## Stack and heap

- a **local variable** lives in its function's stack frame and is gone at `return`
- **`new`** allocates on the heap; the object lives until **`delete`**

```cpp
int* makeA() { int x = 7; return &x; }
int* makeB() { return new int(7); }
```

**Which function has a bug?**

<small>`makeA` returns the address of a variable that no longer exists. `makeB` is correct, and its caller must `delete` the result.</small> <!-- .element: class="fragment" -->

--

## A node and a chain

```cpp
struct Node {
    int   key;
    Node* next;
};

void pushFront(int key) { head = new Node(key, head); }
```

After pushing 8, then 5, then 3:

```text
head
 │
 ▼
[3 | •]──►[5 | •]──►[8 | null]
```

--

## Every new needs one delete

```cpp [3-5]
~IntList() {
    while (head != nullptr) {
        Node* doomed = head;
        head = head->next;
        delete doomed;
    }
}
```

The order matters: read `head->next` **before** deleting the node that holds it.

--

## Predict: copying a list

`ShallowList` has that destructor and **no** copy constructor.

```cpp
ShallowList a;              // 3 -> 5 -> 8
ShallowList b = a;          // the compiler writes this copy
b.setFirst(99);
a.print();                  // ?
```

<small>Output: `99 -> 5 -> 8`. The default copy duplicated the head **pointer**, so `a` and `b` share one chain.</small> <!-- .element: class="fragment" -->

--

## Two owners, one chain

```text
a.head ──┐
         ▼
        [99 | •]──►[5 | •]──►[8 | null]
         ▲
b.head ──┘
```

At the end of the scope **both destructors run**.

- the first deletes the three nodes
- the second deletes the same three nodes again

A double delete is undefined behavior. The program usually aborts.

--

## The Rule of Three

A class that needs **one** of these needs **all three**:

| Member | Runs when | Must |
| --- | --- | --- |
| destructor | the object goes out of scope | free what the object owns |
| copy constructor | `IntList b = a;` | build an independent copy |
| copy assignment | `c = a;` | free the old contents, then copy |

Needing a destructor is the sign: the class **owns** heap memory.

--

## Copy constructor

```cpp [4]
IntList(const IntList& other) {
    Node* tail = nullptr;
    for (const Node* p = other.head; p != nullptr; p = p->next) {
        Node* n = new Node(p->key, nullptr);
        if (tail == nullptr) head = n;
        else                 tail->next = n;
        tail = n;
    }
}
```

One `new` per node of `other`: the copy owns its own chain.

--

## Copy assignment

```cpp [2-4]
IntList& operator=(const IntList& other) {
    if (this != &other) {       // 1. self-assignment: do nothing
        clear();                // 2. free what we own
        copyFrom(other);        // 3. deep-copy
    }
    return *this;
}
```

Without step 1, `c = c` frees the list and then copies from the freed list.

--

## Run it

```text
a: 3 -> 5 -> 8
after b = a; b.setFirst(99)
a: 3 -> 5 -> 8
b: 99 -> 5 -> 8
c: 3 -> 5 -> 8
live nodes inside the block: 9
live nodes after the block:  0
```

Three lists of three nodes: **9** allocated, **0** left.

--

## Checking for leaks

```text
g++ -std=c++17 -g intlist.cpp -o intlist
valgrind --leak-check=full ./intlist
```

A clean report has these two lines:

```text
All heap blocks were freed -- no leaks are possible
ERROR SUMMARY: 0 errors from 0 contexts
```

- **Homework 1:** run it and read the report
- **Programming assignments:** leak-free is graded

---

### Part 3 · Recursion

<small>(~25 min)</small>

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

<small>Output: `3 2 1 1 2 3`. The first print runs on the way down, the second on the way back up.</small> <!-- .element: class="fragment" -->

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

<small>Searching for 20, which is absent, also takes 4 probes: 34, 18, 26, 21, then `lo > hi`.</small> <!-- .element: class="fragment" -->

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

---

### Break

<small>(8 min)</small>

---

### Part 4 · Counting loops

<small>(~12 min)</small>

--

## What we count

- choose one **basic operation**
- count **exactly** how many times it runs
- express the count as a function of the input size *n*

```cpp [3]
long ops = 0;
for (long i = 0; i < n; i++)
    ops++;
```

The count belongs to the algorithm. Seconds belong to the machine.

--

## One loop, two loops

```cpp
for (long i = 0; i < n; i++)
    ops++;                          // n
```

```cpp
for (long i = 0; i < n; i++)
    for (long j = 0; j < n; j++)
        ops++;                      // n * n
```

The inner loop runs *n* times for **each** of the outer loop's *n* iterations.

--

## Predict: a dependent loop

```cpp
for (long i = 0; i < n; i++)
    for (long j = i + 1; j < n; j++)
        ops++;
```

For *n* = 5, how many times does `ops++` run?

<small>**10**: the inner loop runs 4, 3, 2, 1, 0 times.</small> <!-- .element: class="fragment" -->

--

## The sum 1 + 2 + ... + (n − 1)

```text
   S = 1       + 2       + ... + (n - 1)
   S = (n - 1) + (n - 2) + ... + 1
  ─────────────────────────────────────────
  2S = n       + n       + ... + n          (n - 1 terms)

   S = n(n - 1) / 2
```

- *n* = 5: **10**
- *n* = 1000: **499,500**

--

## Predict: a loop that halves

```cpp
for (long i = n; i >= 1; i /= 2)
    ops++;
```

For *n* = 16, how many times does `ops++` run?

<small>**5**: *i* takes the values 16, 8, 4, 2, 1. In general ⌊log₂ *n*⌋ + 1, which is 10 for *n* = 1000 and 20 for *n* = 1,000,000.</small> <!-- .element: class="fragment" -->

--

## Sequence and nesting

```cpp
// one after the other: n + n * n
for (long i = 0; i < n; i++) ops++;
for (long i = 0; i < n; i++)
    for (long j = 0; j < n; j++) ops++;
```

```cpp
// one inside the other: n * (halvings of n)
for (long i = 0; i < n; i++)
    for (long j = n; j >= 1; j /= 2) ops++;
```

| n | Sequence | Halving nest |
| ---: | ---: | ---: |
| 16 | 272 | 80 |
| 1000 | 1,001,000 | 10,000 |

---

### Part 5 · Counting recursion

<small>(~12 min)</small>

--

## From code to recurrence

```cpp
int length(const Node* p) {
    if (p == nullptr) return 0;
    return 1 + length(p->next);
}
```

Let `T(n)` be the number of **calls** for a list of *n* nodes.

```text
T(0) = 1                the call that sees nullptr
T(n) = 1 + T(n - 1)     this call, plus the rest of the list
```

A **recurrence** defines a count in terms of the count for a smaller input.

--

## Solve it by unrolling

```text
T(n) = 1 + T(n - 1)
     = 1 + 1 + T(n - 2)
     = 1 + 1 + 1 + T(n - 3)
       ...
     = n + T(0)
     = n + 1
```

Replace `T` by its own definition until the base case appears.

--

## Binary search, counted

Worst-case **probes** of `a[mid]`, for *n* = 2<sup>*k*</sup> − 1 keys.

One probe leaves a half of 2<sup>*k*−1</sup> − 1 keys:

```text
T(2^k - 1) = 1 + T(2^(k-1) - 1)
           = 1 + 1 + T(2^(k-2) - 1)
             ...
           = k + T(0)
           = k
```

That is *k* = log₂(*n* + 1) probes.

--

## Binary search: the numbers

Worst case over every present and absent key, measured:

| n | Worst-case probes |
| ---: | ---: |
| 15 | 4 |
| 16 | 5 |
| 1000 | 10 |
| 1,000,000 | 20 |

For any *n*: ⌊log₂ *n*⌋ + 1.

--

## Towers of Hanoi

```cpp
void hanoi(int n, char from, char to, char via) {
    if (n == 0) return;
    hanoi(n - 1, from, via, to);
    moves++;
    hanoi(n - 1, via, to, from);
}
```

Let `T(n)` be the number of moves:

```text
T(0) = 0
T(n) = 1 + 2 T(n - 1)
```

--

## Unrolling Hanoi

```text
T(n) = 1 + 2 T(n - 1)
     = 1 + 2 + 4 T(n - 2)
     = 1 + 2 + 4 + 8 T(n - 3)
       ...
     = 1 + 2 + 4 + ... + 2^(n-1) + 2^n T(0)
     = 2^n - 1
```

- *n* = 10: **1,023** moves
- *n* = 20: **1,048,575** moves

--

## Three recurrences

| Function | `T(n)` | Count | *n* = 20 |
| --- | --- | ---: | ---: |
| `length` | `1 + T(n-1)` | *n* + 1 | 21 |
| `bsearch` | `1 + T(n/2)` | ⌊log₂ *n*⌋ + 1 | 5 |
| `hanoi` | `1 + 2T(n-1)` | 2<sup>*n*</sup> − 1 | 1,048,575 |

How many recursive calls, and how large an input each receives, decide the count.

---

### Part 6 · k-sum

<small>(~22 min)</small>

--

## The 3-sum problem

> Given *n* integers, how many **triples** sum to exactly **0**?

- input: an array of integers
- output: the number of triples *i < j < k* whose elements sum to 0

**How would you compute this?** Discuss with a neighbor for 60 seconds.

--

## A small instance

<div style="font-family:monospace;font-size:1.05em">−40&nbsp;&nbsp;−20&nbsp;&nbsp;−10&nbsp;&nbsp;0&nbsp;&nbsp;5&nbsp;&nbsp;10&nbsp;&nbsp;30&nbsp;&nbsp;40</div>

Four triples sum to zero:

- (−40, 10, 30)
- (−40, 0, 40)
- (−20, −10, 30)
- (−10, 0, 10)

For this input the answer is **4**.

--

## Check every triple

```cpp [7]
long count3(const vector<int>& a) {
    int n = a.size();
    long cnt = 0;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            for (int k = j + 1; k < n; k++) {
                checks++;
                if (a[i] + a[j] + a[k] == 0) cnt++;
            }
    return cnt;
}
```

The bounds `i + 1` and `j + 1` visit each triple *i < j < k* once.

--

## How many checks?

One check per triple *i < j < k*: the number of ways to choose **3 of *n***.

$$\binom{n}{3} = \frac{n(n-1)(n-2)}{6}$$

- *n* = 8: **56** checks, to find 4 triples
- *n* = 10: **120** checks
- *n* = 40: **9,880** checks

--

## From 3 to k

- **4-sum:** add a fourth nested loop
- **5-sum:** add a fifth
- ***k*-sum, with *k* read at run time:** ?

The number of nested loops is fixed when the code is written. The value of *k* is not known until the program runs.

**How would you write it?**

--

## The idea

To count the ways to choose ***k*** elements from `a[start..]` that sum to **target**:

- pick one element `a[i]`, with *i* ≥ start, as the first of the *k*
- count the ways to choose ***k* − 1** elements from `a[i+1..]` that sum to **target − a[i]**
- add the counts over every choice of *i*

When *k* = 0 nothing is left to pick: the choice works exactly when target = 0.

--

## k-sum: the code

```cpp [3-6,8-9]
long countK(const vector<int>& a, int start, int k, long target) {
    calls++;
    if (k == 0) {
        checks++;
        return target == 0 ? 1 : 0;
    }
    long cnt = 0;
    for (int i = start; i < (int)a.size(); i++)
        cnt += countK(a, i + 1, k - 1, target - a[i]);
    return cnt;
}
```

`countK(a, 0, 3, 0)` is 3-sum.

--

## Trace: k = 2

`a = {1, 2, 3, 4}`, target 5:

```text
countK(start=0, k=2, target=5)
  countK(1, 1, 4)
    countK(2, 0, 2)      check: no
    countK(3, 0, 1)      check: no
    countK(4, 0, 0)      check: yes     1 + 4
  countK(2, 1, 3)
    countK(3, 0, 0)      check: yes     2 + 3
    countK(4, 0, -1)     check: no
  countK(3, 1, 2)
    countK(4, 0, -2)     check: no
  countK(4, 1, 1)
```

**11** calls, **6** checks, **2** pairs found.

--

## Counting the checks

`L(m, k)`: the checks made when *m* elements remain and *k* are still to be picked.

```text
L(m, 0) = 1
L(m, k) = L(m-1, k-1)  +  L(m-1, k)
          first             all later
          iteration         iterations
```

- the first iteration **picks** `a[start]`
- the later iterations, together, never pick it

This is Pascal's rule: `L(m, k)` is the number of ways to choose *k* of *m*.

--

## Run it

*k* = 3, the same data for both versions:

| n | Triples | Loop checks | Recursive checks | Recursive calls |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 0 | 120 | 120 | 176 |
| 20 | 2 | 1,140 | 1,140 | 1,351 |
| 40 | 38 | 9,880 | 9,880 | 10,701 |
| 80 | 307 | 82,160 | 82,160 | 85,401 |

Same answers, same number of checks.

<small>Calls at *n* = 20: one per partial choice of 0, 1, 2 or 3 elements, 1 + 20 + 190 + 1,140 = 1,351.</small>

--

## What k costs

*n* = 40, measured on the lecture laptop:

| k | Checks | Seconds |
| ---: | ---: | ---: |
| 4 | 91,390 | 0.001 |
| 6 | 3,838,380 | 0.040 |
| 8 | 76,904,685 | 0.805 |
| 10 | 847,660,528 | 10.208 |

*k* = 20 needs **137,846,528,820** checks: at the measured rate, close to half an hour.

---

### Part 7 · Wrap and Homework 1

<small>(~8 min)</small>

--

## Recap

- **C++:** pass by const reference; every `new` has one `delete`; the Rule of Three
- **Recursion:** a base case, a smaller instance, the same shape as the data
- **Counting loops:** sequence adds, nesting multiplies, dependent bounds give sums
- **Counting recursion:** write the recurrence, unroll it to the base case

--

## Homework 1

Starter `hw01/hw01.cpp`, instructions in <a href="hw01/HW01.html">HW01.html</a>:

1. `IntList`: the Rule of Three
2. `length` and `contains`, recursively
3. `bsearch`, counting probes
4. `countK`, counting checks

**Due Sun Oct 4, 11:59 PM.**

Quiz 1: Monday Oct 5, on today's material.

