// CSS 343 unified library — demos/hash-pitfalls.js
// "Why the clever delete tricks fail" — a CaseDemo of three scripted
// disasters, each on a small M = 11 probing table built for its pitfall.
// Every case performs the tempting shortcut and ends on the search it
// silently breaks — the failure is always the LAST frame. The honest fixes
// (tombstone / Sedgewick cluster re-insert) live in hash-delete-race and
// hash-lp. Scenarios verified by dry-run (see the case table in
// planning/2026-07-16-demo-improvements-plan.md, Task 9):
//   (a) blank the slot   [14,25,36,5]  blank 25 → search 36 dies at the hole
//   (b) shift run left   [14,15,25]    15 sat AT its home slot 4; the shift
//                                      drags it to 3, BEHIND every probe
//   (c) swap in the last [14,25,36,5]  5 (displaced past its home) moves to
//                                      slot 3 — its own probe path is cut

import { Tracer, concatTraces } from "../core/tracer.js";
import { ArrayRenderer, LinearProbing, openAddressingInfo } from "../index.js";

class BrokenProbing extends LinearProbing {
  constructor() { super(11, { resizeAt: Infinity }); }

  /** Pitfall (a): delete by just emptying the slot. */
  deleteBlank(k) {
    const t = new Tracer();
    const i = this.slots.indexOf(k);
    t.step(`the tempting shortcut: delete ${k} by just EMPTYING slot ${i}`,
      { snapshot: this.snapshot(), highlight: { active: [i] } });
    this.slots[i] = null; this.n--; t.count("write");
    t.step(`slot ${i} is now empty — looks clean, feels done. But an empty slot means "STOP" to every probe path through it…`,
      { snapshot: this.snapshot(), highlight: { done: [i] } });
    return t.trace();
  }

  /** Pitfall (b): compact — shift the rest of the run one slot left. */
  deleteShiftLeft(k) {
    const t = new Tracer();
    let i = this.slots.indexOf(k);
    t.step(`delete ${k} at slot ${i}, then SHIFT the rest of the run left to close the gap (like an array would)`,
      { snapshot: this.snapshot(), highlight: { active: [i] } });
    this.slots[i] = null; this.n--; t.count("write");
    let j = (i + 1) % this.M;
    while (this.slots[j] !== null) {
      t.step(`shift ${this.slots[j]} from slot ${j} to slot ${i}`,
        { snapshot: this.snapshot(), highlight: { compare: [j], active: [i] } });
      this.slots[i] = this.slots[j]; this.slots[j] = null; t.count("write", 2);
      i = j; j = (j + 1) % this.M;
    }
    t.step(`run compacted — no hole. But WHO moved, and where is each mover's HOME slot?`,
      { snapshot: this.snapshot(), highlight: {} });
    return t.trace();
  }

  /** Pitfall (c): fill the hole with the LAST key of the run. */
  deleteSwapLast(k) {
    const t = new Tracer();
    const i = this.slots.indexOf(k);
    let j = i;
    while (this.slots[(j + 1) % this.M] !== null) j = (j + 1) % this.M;
    const last = this.slots[j];
    t.step(`delete ${k} at slot ${i}; the run ends at slot ${j} (${last}) — swap THAT in and shrink, like an array-backed bucket would`,
      { snapshot: this.snapshot(), highlight: { active: [i], compare: [j] } });
    this.slots[i] = last; this.slots[j] = null; this.n--; t.count("write", 2);
    t.step(`${last} moved to slot ${i}; slot ${j} emptied. One key moved — tidy. But ${last}'s own probe path just changed…`,
      { snapshot: this.snapshot(), highlight: { done: [i], danger: [j] } });
    return t.trace();
  }
}

export const hashPitfallsDemo = {
  id: "probe-delete-pitfalls",
  title: "Probing delete: why the clever fixes fail",
  blurb: "Three tempting shortcuts for delete in a probing table, each followed by the search it silently breaks — watch a PRESENT key come back 'not found'. Blanking the slot cuts every probe path through it; shifting the run left drags a key that sat AT its home slot to before it; swapping in the run's last key relocates a displaced key ahead of its own home. The honest fixes are tombstones (hash-delete-race) and Sedgewick's cluster re-insert (hash-lp).",
  proto: "hashing",
  make: () => new BrokenProbing(),
  renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
  costs: ["compare", "write", "hash"],
  info: openAddressingInfo("fixed M — a broken-delete sandbox"),
  width: 940, height: 120,
  help: "Each button rebuilds a small M = 11 table, runs one shortcut delete, then the search it breaks. The failure is always the LAST frame — scrub back to see the moment the invariant died.",
  cases: [
    { name: "blank the slot → 36 vanishes", group: "pitfalls", build: [14, 25, 36, 5],
      run: (s) => concatTraces([s.deleteBlank(25), s.search(36)]) },
    { name: "shift the run left → 15 vanishes", build: [14, 15, 25],
      run: (s) => concatTraces([s.deleteShiftLeft(14), s.search(15)]) },
    { name: "swap in the last key → 5 vanishes", build: [14, 25, 36, 5],
      run: (s) => concatTraces([s.deleteSwapLast(14), s.search(5)]) },
  ],
};
