<!--
TOPIC · k-sum: from three nested loops to one recursive function.
  Teaches: 3-sum by checking every triple, and its count C(n,3); why k nested
           loops cannot be written when k is a variable; the recursive
           formulation; its call tree; Pascal's rule as its recurrence; what k
           costs.
  Needs:   the recursion, counting-loops and counting-recurrences topics.
  Demos:   three-sum (loops and recursion on one tree), k-sum.
  Program: topics/code/k-sum/ksum.cpp
  Budget:  ~25 min, 13 slides.
-->

### k-sum

<small>(~25 min)</small>

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

<div class="algo-viz" data-algo="k-sum" data-config='{"width":720,"cols":[520,200],"height":270,"chrome":{"costsInline":true,"showInput":false,"showClear":false}}'>
<pre class="viz-fallback">
a = {1, 2, 3, 4}, target 5
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
11 calls · 6 checks · 2 pairs found
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**11** calls, **6** checks, **2** pairs. The stack is never deeper than 3 frames.</small>

--

## Loops and recursion

<div class="algo-viz" data-algo="three-sum" data-config='{"width":720,"cols":[520,200],"height":270,"chrome":{"costsInline":true,"showInput":false,"showClear":false}}'>
<pre class="viz-fallback">
a = {-1, 0, 1, 2}, triples that sum to 0
                    checks   calls   deepest stack
   Loops (count3)      4        1          1
   Recursion, k = 3    4       15          4
both find (-1, 0, 1)
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Run **Loops**, then **Recursion**: the same tree, the same 4 checks, a different stack.</small>

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

