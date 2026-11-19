<!--
  TOPIC · Hoare's partition (appendix).
  Teaches: Hoare's scheme (pivot a[lo], two pointers moving inward, stop on keys equal to the pivot, swap inverted pairs, place the pivot at j); traced on 3 7 1 9 4 8 6 2 5; Lomuto against Hoare, counted on the lecture's array, sorted input and all-equal input; the race demo.
  Needs:   quicksort (Lomuto's partition).
  Demos:   lomuto-vs-hoare-lecture (the registry's race on the lecture's array, slide spec in topics/demos.js); figure so-hoare (tools/gen-sort-figures.mjs)
  Program: none (the counts are the library's, lib/structures/sorting.js, the same code the demo runs)
  Budget:  ~8 min, 5 slides. Mounted in Lecture 15 as an appendix, after the close.
  Ported from Summer 2026 L13-sorting-dc.md, part 3.
-->

### Hoare's partition

> Jon Bentley's *Programming Pearls* credits the one-index partition to Nico Lomuto; Hoare's 1961 original moves two indices toward each other.

<small>J. Bentley, *Programming Pearls*, 2nd ed., Addison-Wesley, 2000, column 11</small>

--

## Hoare's scheme

Pivot = the **first** key, `a[lo]`; two pointers walk **inward**:

- `i` moves right past keys $\lt$ pivot; `j` moves left past keys $\gt$ pivot
- both stopped, `i < j`: the pair is on the wrong sides: **swap**
- crossed: swap the pivot into `a[j]`

Only **out-of-place pairs** move.

--

## Hoare, traced

<div><img src="../../topics/figures/sorting/so-hoare.svg" style="height:430px" alt="
   pivot = a[0] = 3
   i stops at 7 (index 1), j passes 5 and stops at 2 (index 7): swap a[1] and a[7]
   i passes 1, stops at 9 (index 3); j passes 6, 8, 4, 9, stops at 1 (index 2): crossed
   place: swap a[0] and a[2]: 1 2 3 9 4 8 6 7 5, the pivot at index 2"></div>

One swap in the scan, plus the pivot's.

--

## Lomuto against Hoare, counted

| input | Lomuto | Hoare |
| --- | --- | --- |
| `3 7 1 9 4 8 6 2 5`: swaps | 11 | **7** |
| `1..12`, sorted: swaps | 77 | **11** |
| 12 equal keys: comparisons | 66 | **34** |
| 16 equal keys: comparisons | 120, $\Theta(n^2)$ | **50**, $\Theta(n \log n)$ |

Counted by the library the demo runs; the swap counts include the pivot's placement.

--

## Demo: Lomuto against Hoare

<div class="algo-viz" data-algo="lomuto-vs-hoare-lecture" data-config='{"width":900}'>
<pre class="viz-fallback">
   both schemes on one array, stacked and stepped together
     3 7 1 9 4 8 6 2 5   Lomuto 11 swaps, Hoare 7
     1..12 (sorted)      Lomuto 77 swaps, Hoare 11
     twelve equal keys   Lomuto 66 comparisons, Hoare 34
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Race the lecture's array, then `1..12`, then twelve equal keys.</small>

