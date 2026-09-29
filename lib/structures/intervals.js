// CSS 343 unified library — structures/intervals.js
// The two interval greedies of L12, on ONE instance so the contrast lands:
//   select() — ACTIVITY SELECTION: the most pairwise-compatible intervals that
//              fit in ONE room. Greedy rule: earliest FINISH time first.
//   rooms()  — INTERVAL PARTITIONING: the fewest rooms that host them ALL.
//              Greedy rule: in START order, reuse any room that is free.
// Same events, different question, different answer — and rooms() lands exactly
// on the maximum overlap, which is why the lower-bound argument is tight.
//
// Intervals are HALF-OPEN [s, f): an event finishing at 5 and one starting at 5
// do NOT conflict and may share a room. The slides state this, because with
// closed intervals every answer here changes.
//
// build(keys) reads keys as consecutive PAIRS s f, naming them a, b, c, … in
// input order. Degenerate pairs (f <= s) are dropped, and never silently:
// rejectedCount / rejectedWhy feed the demo's warning band.

import { Tracer } from "../core/tracer.js";

const SAMPLE = [1, 5, 2, 6, 3, 7, 7, 9, 8, 11];   // a[1,5) b[2,6) c[3,7) d[7,9) e[8,11)
const NAMES = "abcdefghijklmnopqrstuvwxyz";

export class Intervals {
  constructor() { this.iv = []; this.rejectedCount = 0; }

  build(keys) {
    const ks = (keys || []).filter(Number.isFinite);
    const pairs = [];
    for (let i = 0; i + 1 < ks.length; i += 2) pairs.push([ks[i], ks[i + 1]]);
    const src = pairs.length ? pairs : [];
    const kept = src.filter(([s, f]) => f > s);
    const list = src.length ? kept : SAMPLE.reduce((acc, v, i) =>
      (i % 2 ? acc : [...acc, [v, SAMPLE[i + 1]]]), []);
    this.iv = list.slice(0, NAMES.length).map(([s, f], i) => ({ name: NAMES[i], s, f }));
    this.rejectedCount = (ks.length % 2) + (src.length ? src.length - kept.length : 0);
    return this;
  }
  loadRaw(keys) { return this.build(keys); }

  get rejectedWhy() {
    return `intervals are "start finish" pairs with finish > start; unpaired or empty pairs are ignored`;
  }

  get tmin() { return this.iv.length ? Math.min(...this.iv.map((v) => v.s)) : 0; }
  get tmax() { return this.iv.length ? Math.max(...this.iv.map((v) => v.f)) : 1; }

  snapshot(extra = {}) {
    return {
      iv: this.iv.map((v) => ({ ...v })),
      tmin: this.tmin, tmax: this.tmax,
      ...extra,
    };
  }
  inorder() { return this.iv.map((v) => `${v.name}[${v.s},${v.f})`).join(" "); }

  /** Per-unit overlap tallies over [tmin, tmax) — the picture of the lower bound. */
  overlapCounts() {
    const out = [];
    for (let t = this.tmin; t < this.tmax; t++) {
      out.push({ t, n: this.iv.filter((v) => v.s <= t && t < v.f).length });
    }
    return out;
  }
  /** max number of intervals sharing any instant = the room lower bound. */
  peakOverlap() { return this.overlapCounts().reduce((m, c) => Math.max(m, c.n), 0); }

  /** ACTIVITY SELECTION — earliest finish first; keep it if it starts at or after
   *  the last kept finish. One room, as many events as possible. */
  select() {
    const t = new Tracer();
    const order = this.iv.slice().sort((a, b) => a.f - b.f || a.s - b.s);
    t.step(`sort by FINISH time: ${order.map((v) => `${v.name}(${v.f})`).join(", ")}`,
      { snapshot: this.snapshot({ picked: [] }), highlight: {} });
    const picked = [];
    let lastFinish = -Infinity;
    for (const v of order) {
      t.count("compare");
      const ok = v.s >= lastFinish;
      t.step(ok
        ? `${v.name}[${v.s},${v.f}) starts at ${v.s} ≥ ${lastFinish === -Infinity ? "−∞" : lastFinish} → TAKE it`
        : `${v.name}[${v.s},${v.f}) starts at ${v.s} < ${lastFinish} → conflicts, skip`,
        { snapshot: this.snapshot({ picked: picked.slice() }),
          highlight: ok ? { active: [v.name] } : { danger: [v.name] } });
      if (ok) { picked.push(v.name); lastFinish = v.f; t.count("write"); }
      t.step(ok ? `kept ${picked.join(", ")} — room now free from ${v.f}` : `still kept: ${picked.join(", ") || "(none)"}`,
        { snapshot: this.snapshot({ picked: picked.slice() }),
          highlight: ok ? { done: picked.slice() } : {} });
    }
    t.step(`done — ${picked.length} activities in ONE room: ${picked.join(", ")}`,
      { snapshot: this.snapshot({ picked: picked.slice() }), highlight: { done: picked.slice() } });
    return t.trace();
  }

  /** INTERVAL PARTITIONING — in START order, put each event in any room that is
   *  free; open a new room only when every open room is still busy. */
  rooms() {
    const t = new Tracer();
    const order = this.iv.slice().sort((a, b) => a.s - b.s || a.f - b.f);
    const counts = this.overlapCounts();
    t.step(`sort by START time: ${order.map((v) => `${v.name}(${v.s})`).join(", ")} — `
      + `max overlap is ${this.peakOverlap()}, so ${this.peakOverlap()} rooms is the floor`,
      { snapshot: this.snapshot({ counts }), highlight: {} });
    const freeFrom = [];                       // freeFrom[r] = when room r falls free
    const assigned = {};
    for (const v of order) {
      let r = freeFrom.findIndex((f) => f <= v.s);
      freeFrom.forEach(() => t.count("compare"));
      const opened = r === -1;
      if (opened) { r = freeFrom.length; freeFrom.push(v.f); }
      else freeFrom[r] = v.f;
      assigned[v.name] = r;
      t.count("write");
      const withRooms = this.snapshot({ counts, sweep: v.s });
      withRooms.iv.forEach((x) => { if (assigned[x.name] != null) x.room = assigned[x.name]; });
      t.step(opened
        ? (r === 0
            ? `${v.name}[${v.s},${v.f}): no rooms open yet → OPEN room 1`
            : `${v.name}[${v.s},${v.f}): all ${r} open room(s) still busy at ${v.s} → OPEN room ${r + 1}`)
        : `${v.name}[${v.s},${v.f}): room ${r + 1} is free at ${v.s} → reuse it`,
        { snapshot: withRooms, highlight: { active: [v.name] } });
    }
    const final = this.snapshot({ counts });
    final.iv.forEach((x) => { x.room = assigned[x.name]; });
    t.step(`done — ${freeFrom.length} rooms host all ${this.iv.length} events `
      + `(= the max overlap ${this.peakOverlap()}, so this is optimal)`,
      { snapshot: final, highlight: {} });
    return t.trace();
  }
}
