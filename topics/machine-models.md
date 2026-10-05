<!--
  TOPIC · Machine models: what asymptotics assume about the machine.
  Teaches: order of growth is relative to a cost model (the RAM model charges
           every access 1); any per-operation cost bounded by a constant keeps
           the order of growth; the memory hierarchy makes the cost per access
           a step function of the working set; swapping is a constant-factor
           catastrophe and shows as a knee in a doubling experiment, not as a
           new exponent; models where access cost grows with N (physical
           distance, hierarchical memory, external memory) do change the
           exponent; pipelining, branch prediction and caches change constants;
           what programmer optimization means: algorithm, data structure,
           the constant under the real machine's cost model, the N you have;
           measure first (Amdahl's law), Knuth's remark in full.
  Needs:   the asymptotic-notation and bounds topics; the computer systems
           primer (textbook/foundations/foundation-computer-systems.html).
  Demos:   link to lib/measure/machine-model.html (simulated hierarchy).
  Programs: topics/code/memory/vector_locality.cpp,
            topics/code/machine/branch_predict.cpp
  Budget:  ~20 min, 14 slides.
  Numbers: latencies from the primer (measured: L1 1.4 ns, RAM about 100 ns;
           typical: SSD about 50 µs, disk about 5 ms); every derived number
           was computed by script.
-->

### Machine models: when is a constant not constant?

<small>(~20 min)</small>

--

## Order of growth is relative to a cost model

Every count so far used the **RAM model**: each instruction and **each memory access costs 1**.

A real read costs **1.4 ns** (L1 cache), **about 100 ns** (main memory), or **milliseconds** (disk).

**Which machine changes turn Θ(N²) into something else?**

--

## Fast instructions, slow memory: still Θ(N²)

Instructions **10⁶× faster**, every memory read **10⁶ cycles**:

- each operation still costs **at most a constant**
- so T(N) stays between two constant multiples of the count: **Θ(N²)**

**Rule:** if every operation costs between two constants **independent of N**, the order of growth is the same on every machine.

--

## The hierarchy: cost per access is a step

| level | capacity | one read | vs RAM |
| --- | --- | :-: | :-: |
| L1 cache | 32 KiB | 1.4 ns | 1/70 |
| L3 cache | 16 MiB | about 15 ns | 1/7 |
| main memory | 32 GiB | about 100 ns | 1 |
| SSD (swap) | 1 TB | about 50 µs | **500×** |
| disk (swap) | TBs | about 5 ms | **50,000×** |

Cost per access is a **step function of the working set**.

--

## Swapping: does N² become N³?

Past RAM, the OS pages part of the working set out; touching it **faults** and reads it back.

- on a fixed machine, swap is the **last level**: every access costs at most about 5 ms
- so T(N) is **still Θ(N²)**, with a constant up to 50,000× larger
- **thrashing** is a constant-factor catastrophe, not a new exponent

--

## The knee in a doubling experiment

N² random reads over a working set W ∝ N; memory M; a fraction 1 − M/W fault to SSD:

| W / M | 0.3 → 0.6 | 0.6 → 1.2 | 1.2 → 2.4 | 2.4 → 4.8 | 4.8 → 9.6 |
| --- | :-: | :-: | :-: | :-: | :-: |
| T(2N) / T(N) | 4.0 | **336.7** | 13.9 | 5.4 | 4.5 |
| b = log₂ ratio | 2.00 | **8.40** | 3.80 | 2.44 | 2.18 |

A spike at the boundary, then **back toward 2**. <a href="../../lib/measure/machine-model.html">Simulate it</a>

--

## When the exponent does change

When **one access costs more as N grows**:

- **physical distance:** N cells in 2-D lie about √N apart: Θ(N²) random accesses cost **Θ(N<sup>2.5</sup>)**
- **hierarchical memory:** address x costs log x: a scan of N costs **Θ(N log N)**

Different cost models, each a theorem about its own machine.

--

## The external-memory model

Memory M, a slow level below, **blocks of B**; cost = block transfers (Aggarwal and Vitter, 1988).

| task | transfers |
| --- | :-: |
| scan N items | N / B |
| matrix multiply, column-order inner loop | Θ(N³) |
| the same, row order (i-k-j) | Θ(N³ / B) |
| the same, √M × √M tiles | Θ(N³ / (B√M)) |

**Locality becomes part of the order of growth.**

--

## Pipelines, prediction, caches: constants

Same count, different order, Θ(N) both ways:

| second order vs first | measured |
| --- | :-: |
| sum a matrix: rows, then columns | **41×** slower |
| walk a list: memory order, then scattered | **52×** slower |
| `if (x >= 128)`: sorted data, then random | about **4×** slower |

<small>Code: <a href="../../topics/code/machine/branch_predict.cpp">branch_predict.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## Your turn: which wins, and when?

Data far larger than the caches. **A:** N log₂ N random reads, 100 ns each. **B:** N² sequential reads, 0.3 ns each.

**Faster at N = 10³, 10⁴, 10⁶, 10⁹?**

| N | 10³ | 10⁴ | 10⁶ | 10⁹ |
| --- | :-: | :-: | :-: | :-: |
| A | 1.0 ms | 13 ms | 2.0 s | 50 min |
| B | 0.3 ms | 30 ms | 300 s | 9.5 years |
<!-- .element: class="fragment" -->

--

## What "optimizing" means for a programmer

1. **change the algorithm:** the only lever on the exponent (3-sum: N³ → N² log₂ N → N²)
2. **change the data structure:** a hash table instead of a scan
3. **lower the constant on the real machine:** locality, fewer allocations, predictable branches
4. **choose for your N:** insertion sort below about 16 elements

--

## Lowering the constant: layout first

Summing 4,000,000 ints (`vector_locality.cpp`): array **0.3 ns** per element, list in allocation order **3 ns**, list scattered **100 ns**.

- flat arrays over pointer structures
- traverse in memory order (row-major in C++)
- order struct fields to avoid padding
- `reserve` before pushing; reuse buffers

<small>Code: <a href="../../topics/code/memory/vector_locality.cpp">vector_locality.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## Measure first: Amdahl's law

Speed up a fraction f of the run by a factor s: overall speedup = 1 / ((1 − f) + f / s).

A function takes **80%** of the run and becomes **10×** faster: 1 / (0.2 + 0.08) ≈ **3.6×**. Infinitely fast: at most **5×**.

**Profile, find what dominates, optimize that.**

--

## Knuth, in full


> "Programmers waste enormous amounts of time thinking about, or worrying about, the speed of noncritical parts of their programs, and these attempts at efficiency actually have a strong negative impact when debugging and maintenance are considered. We should forget about small efficiencies, say about 97% of the time: premature optimization is the root of all evil. Yet we should not pass up our opportunities in that critical 3%."
<!-- .element: style="font-size: 0.82em" -->

Knuth, 1974

