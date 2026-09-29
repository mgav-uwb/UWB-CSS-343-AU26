// CSS 343 unified library — demos/registry.js
// Registry of full-demo specs, keyed by ?ds= slug. Add one import + one entry
// per structure as it is ported onto the core (bst, heap, hashing, graph, …).

import { avlDemo } from "./avl.js";
import { bstVsAvlDemo, fibRaceDemo, hashDeleteRaceDemo, lomutoHoareRaceDemo, probeRaceDemo, rodcutRaceDemo, searchRaceDemo, sortRaceDemo } from "./compare.js";
import { bstDemo } from "./bst.js";
import { twoThreeDemo } from "./two-three.js";
import { btreeDemo } from "./btree.js";
import { redblackDemo } from "./redblack.js";
import { heapDemo, minHeapDemo } from "./heap.js";
import { huffmanDemo, huffmanCodecDemo } from "./huffman.js";
import { adaptiveHuffmanDemo } from "./adaptive-huffman.js";
import { chainingDemo, chainResizeDemo, doubleDemo, hashingDemo, quadDemo } from "./hashing.js";
import { hashPitfallsDemo } from "./hash-pitfalls.js";
import { graphDemo } from "./graph.js";
import { unionFindDemo } from "./unionfind.js";
import { dijkstraDemo } from "./dijkstra.js";
import { kruskalDemo, primDemo } from "./mst.js";
import { mergesortDemo, quicksortDemo, quickselectDemo } from "./sorting.js";
import { recurrenceDemo } from "./recurrence.js";
import { fibDemo, rodcutDemo, rodcutTreeDemo, gridDpDemo, lcsDemo, lcsTreeDemo, knapsackDemo, editDistanceDemo } from "./dp.js";
import { nfaBuildDemo, nfaSimDemo, nfa2dfaDemo, dfaDemo } from "./nfa.js";
import { trieDemo } from "./trie.js";
import { tstDemo } from "./tst.js";
import { stringSearchDemo, kmpFailDemo } from "./string-search.js";

// The ORDER of this object is the gallery's order (DEMO_LIST below feeds the
// picker), so it follows the COURSE, session by session — same sequence as the
// hub's per-session rows in index.html and as the decks mount them. Add a demo
// under its session, not at the end.
export const DEMOS = {
  // L03 · BSTs
  bst: bstDemo,
  // L04 · AVL
  avl: avlDemo,
  "bst-vs-avl": bstVsAvlDemo,
  // L05 · 2-3 / B-trees / red-black
  "two-three": twoThreeDemo,
  btree: btreeDemo,
  redblack: redblackDemo,
  // L06 · heaps
  heap: heapDemo,
  "min-heap": minHeapDemo,
  // L07 · hashing
  "hash-lp": hashingDemo,
  "hash-quad": quadDemo,
  "hash-double": doubleDemo,
  "hash-chain": chainingDemo,
  "hash-chain-resize": chainResizeDemo,
  "hash-delete-race": hashDeleteRaceDemo,
  "hash-race": hashDeleteRaceDemo, // legacy slug — old links land on the delete story
  "probe-race": probeRaceDemo,
  "probe-delete-pitfalls": hashPitfallsDemo,
  // L08 · graphs, BFS/DFS
  graph: graphDemo,
  "search-race": searchRaceDemo,
  // L09 · Dijkstra
  dijkstra: dijkstraDemo,
  // L11 · MST & union-find
  "union-find": unionFindDemo,
  kruskal: kruskalDemo,
  prim: primDemo,
  // L12 · greedy & Huffman
  huffman: huffmanDemo,
  "huffman-codec": huffmanCodecDemo,
  "adaptive-huffman": adaptiveHuffmanDemo,
  // L13 · sorting & divide-and-conquer
  recurrence: recurrenceDemo,
  mergesort: mergesortDemo,
  quicksort: quicksortDemo,
  quickselect: quickselectDemo,
  "sort-race": sortRaceDemo,
  "lomuto-vs-hoare": lomutoHoareRaceDemo,
  // L14 · DP I
  fib: fibDemo,
  "fib-race": fibRaceDemo,
  "rodcut-tree": rodcutTreeDemo,
  rodcut: rodcutDemo,
  "rodcut-race": rodcutRaceDemo,
  "lcs-tree": lcsTreeDemo,
  lcs: lcsDemo,
  // L15 · DP II
  knapsack: knapsackDemo,
  "edit-distance": editDistanceDemo,
  "grid-dp": gridDpDemo,
  // L16 · strings & tries
  trie: trieDemo,
  tst: tstDemo,
  "kmp-fail": kmpFailDemo,
  "string-search": stringSearchDemo,
  // L17 · regex & automata
  dfa: dfaDemo,
  "nfa-build": nfaBuildDemo,
  "nfa-sim": nfaSimDemo,
  nfa2dfa: nfa2dfaDemo,
};

export const DEMO_LIST = [...new Set(Object.values(DEMOS))]; // Set: alias slugs share one spec — list it once
