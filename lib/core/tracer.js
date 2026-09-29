// CSS 343 unified library — core/tracer.js
// The instrumentation spine. An algorithm runs ONCE with a Tracer: it calls
// t.count(kind) at each primitive operation and t.step(msg, {...}) at each
// interesting moment, producing a Trace (an ordered list of Frames). The Player
// then scrubs the Trace — so "step back" is just an index decrement (no inverse
// operations needed), and the cost counters give the performance readout. This
// is the SAME cost model S01/S02 teach (count basic operations → order of growth).

/**
 * @typedef {Object} Frame
 * @property {number} i         index in the trace
 * @property {string} msg       human-readable description of this step
 * @property {*}      snapshot  structure-specific state to render (e.g. a cloned tree)
 * @property {Object} highlight renderer hints (which nodes/edges/cells are active)
 * @property {Object<string,number>} counters cumulative cost counters at this step
 */

// The canonical primitive-operation kinds. A demo shows whichever it increments.
export const COST_KINDS = ["compare", "swap", "read", "write", "link", "visit", "hash", "rotation", "alloc", "free", "partition"];

const COST_LABEL = {
  compare: "comparisons", swap: "swaps", read: "reads", write: "writes",
  link: "link updates", visit: "nodes visited", hash: "hashes",
  rotation: "rotations", alloc: "allocations", free: "nodes freed", partition: "partitions",
};
const COST_LABEL_ONE = {
  compare: "comparison", swap: "swap", read: "read", write: "write",
  link: "link update", visit: "node visited", hash: "hash",
  rotation: "rotation", alloc: "allocation", free: "node freed", partition: "partition",
};
/** Grammatical label for a counter — pass the count to get singular at 1. */
export const costLabel = (k, n) => (n === 1 ? (COST_LABEL_ONE[k] || k) : (COST_LABEL[k] || k));

export class Tracer {
  constructor() {
    /** @type {Frame[]} */ this.frames = [];
    /** @type {Object<string,number>} */ this.counters = {};
  }

  /** Increment a primitive-operation counter (the cost model). */
  count(kind, n = 1) {
    this.counters[kind] = (this.counters[kind] || 0) + n;
    return this;
  }

  /**
   * Record one step/frame.
   * @param {string} msg
   * @param {{snapshot?:*, highlight?:Object}} [meta]
   */
  step(msg, meta = {}) {
    this.frames.push({
      i: this.frames.length,
      msg,
      snapshot: meta.snapshot ?? null,
      highlight: meta.highlight ?? {},
      pause: meta.pause ?? false, // autoplay halts here (predict-and-continue)
      pace: meta.pace ?? null,    // "fast" = a routine frame playback may hurry over
      counters: { ...this.counters }, // freeze cumulative counts at this moment
    });
    return this;
  }

  trace() { return new Trace(this.frames); }
}

export class Trace {
  /** @param {Frame[]} frames */
  constructor(frames) { this.frames = frames; }
  get length() { return this.frames.length; }
  /** Clamp-and-fetch — the reason stepping back is O(1) and free. */
  at(i) { return this.frames[Math.max(0, Math.min(this.length - 1, i))]; }
  get last() { return this.frames[this.length - 1]; }
  /** Total of a counter across the whole run (its value in the final frame). */
  total(kind) { return this.last ? (this.last.counters[kind] || 0) : 0; }
}

/**
 * Splice several traces end-to-end into one continuous Trace (e.g. a "build"
 * made of N separately-traced inserts) so Play/step animates the whole
 * sequence. Each trace's own frames already carry ITS OWN cumulative counters
 * starting at 0; this carries a running total across the trace boundaries so
 * the cost readout doesn't reset partway through.
 */
export function concatTraces(traces) {
  const frames = [];
  const base = {};
  for (const tr of traces) {
    for (const f of tr.frames) {
      const counters = { ...base };
      for (const k of Object.keys(f.counters)) counters[k] = (base[k] || 0) + f.counters[k];
      frames.push({ ...f, i: frames.length, counters });
    }
    const last = tr.frames[tr.frames.length - 1];
    if (last) for (const k of Object.keys(last.counters)) base[k] = (base[k] || 0) + last.counters[k];
  }
  return new Trace(frames);
}
