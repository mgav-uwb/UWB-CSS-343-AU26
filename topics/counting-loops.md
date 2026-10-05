<!--
TOPIC · Counting how often a loop body runs.
  Teaches: choosing a basic operation; exact counts as functions of n; one
           loop, nested loops, a dependent inner loop and the Gauss sum; a
           halving loop; sequence adds, nesting multiplies.
  Needs:   nothing.
  Demos:   none.
  Program: topics/code/counting-loops/loops.cpp
  Budget:  ~11 min, 7 slides.
-->

### Counting loops

<small>(~11 min)</small>

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

<details class="answer"><summary>Answer:</summary>

**10**: the inner loop runs 4, 3, 2, 1, 0 times.

</details>

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

<details class="answer"><summary>Answer:</summary>

**5**: *i* takes the values 16, 8, 4, 2, 1. In general ⌊log₂ *n*⌋ + 1, which is 10 for *n* = 1000 and 20 for *n* = 1,000,000.

</details>

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

<small>Code: <a href="../../topics/code/counting-loops/loops.cpp">loops.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

