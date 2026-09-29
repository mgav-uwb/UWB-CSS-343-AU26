// CSS 343 unified library — structures/hashing.js
// Open-addressing hash table over a plain fixed-size array `slots` — empty
// cells are null, tombstones are TOMB (drawn "†"). h(k) = ((k % M) + M) % M,
// count "hash". The probe FAMILY is a constructor option:
//   linear     index = (home + t)        mod M   — the classic +1 walk
//   quadratic  index = (home + t²)       mod M   — kills primary clustering
//   double     index = (home + t·h2(k))  mod M   — h2(k) = q − (k mod q),
//              key-dependent stride, kills secondary clustering too
// Delete is either Sedgewick's cluster re-insert (linear's default — walk the
// rest of the cluster and re-insert every key, no tombstones) or TOMBSTONE
// marking (default for quadratic/double, where "the rest of the cluster" is
// not a contiguous run): the slot is marked, searches walk over it, a later
// insert may reclaim it. Every probe loop is bounded by M attempts; a table
// that cannot place a key REJECTS the insert (lastRejected / rejectedCount)
// instead of spinning — the demo chrome turns that into a warning band.
// Resizing counts tombstones as load ((n + tombs)/M ≥ resizeAt): linear
// doubles M (the lecture narrative), quadratic/double grow to the next PRIME
// ≥ 2M, because their probe sequences need a prime M to reach enough slots.
// snapshot() renders a DISPLAY array (empty → "·", tombstone → "†") so the
// shared ArrayRenderer draws it directly with mode 'cells'.

import { Tracer } from "../core/tracer.js";

const hash = (k, M) => ((k % M) + M) % M;
const isPrime = (x) => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
const nextPrime = (x) => { while (!isPrime(x)) x++; return x; };
const prevPrime = (x) => { while (x > 2 && !isPrime(x)) x--; return x; };

export const TOMB = Symbol("tombstone");

export class OpenAddressing {
  /** @param {number} M @param {{probe?:("linear"|"quadratic"|"double"),
   *  resizeAt?:number, deleteMode?:("reinsert"|"tombstone"), q?:number}} [opts]
   *  resizeAt = load-factor threshold that triggers growth (default 0.5);
   *  pass Infinity for a fixed-size table (lecture demos BEFORE resizing is
   *  introduced — a full table then rejects inserts instead of looping).
   *  q = the double-hash stride prime (default: largest prime < M).
   *  deleteMode defaults to "reinsert" for linear, "tombstone" otherwise
   *  (Sedgewick's cluster walk only makes sense on a contiguous linear run). */
  constructor(M = 8, opts = {}) {
    this.M = M;
    this.slots = new Array(M).fill(null);
    this.n = 0;            // live keys (tombstones NOT counted)
    this.tombs = 0;        // tombstone count
    this.probe = opts.probe ?? "linear";
    this.deleteMode = opts.deleteMode ?? (this.probe === "linear" ? "reinsert" : "tombstone");
    this.resizeAt = opts.resizeAt ?? 0.5;
    this.q = opts.q ?? null;         // null = derive from M
    this._userQ = opts.q != null;    // a pinned q survives resizes
    this.lastRejected = false;
    this.rejectedCount = 0;
  }

  /** Human reason for the demo warning band when inserts are refused. */
  get rejectedWhy() { return `the fixed-size table is full (M = ${this.M}); resize is the fix`; }

  _q() { return this.q ?? prevPrime(this.M - 1); }
  _stride(k) { const q = this._q(); return q - (((k % q) + q) % q); }
  /** Index of probe attempt t (t = 0, 1, 2, …) for key k from its home slot. */
  _at(k, home, t) {
    if (this.probe === "quadratic") return (home + t * t) % this.M;
    if (this.probe === "double") return (home + t * this._stride(k)) % this.M;
    return (home + t) % this.M;
  }
  _load() { return (this.n + this.tombs) / this.M; }
  _grownM() { return this.probe === "linear" ? this.M * 2 : nextPrime(this.M * 2); }
  /** Arrival narration for probe attempt t at index i (linear keeps the classic wording). */
  _probeMsg(k, home, t, i) {
    if (this.probe === "quadratic") return `probe #${t}: (${home} + ${t}²) mod ${this.M} = ${i}`;
    if (this.probe === "double") return `probe #${t}: (${home} + ${t}·${this._stride(k)}) mod ${this.M} = ${i}  (h2(${k}) = ${this._stride(k)})`;
    return `probe slot ${i}`;
  }

  build(keys) { this.rejectedCount = 0; for (const k of keys) this._insertSilent(k); return this; }

  /** Display array: empty → "·", tombstone → "†", so the ArrayRenderer draws them directly. */
  snapshot() { return this.slots.map((v) => (v === null ? "·" : v === TOMB ? "†" : v)); }
  inorder() { return this.slots.filter((v) => v !== null && v !== TOMB); }

  _insertSilent(k) {
    if (this.n >= this.M) { this.rejectedCount++; return; }
    const home = hash(k, this.M);
    let firstTomb = -1;
    for (let t = 0; t < this.M; t++) {
      const i = this._at(k, home, t);
      if (this.slots[i] === TOMB) { if (firstTomb < 0) firstTomb = i; continue; }
      if (this.slots[i] === k) return;                       // duplicate — no change
      if (this.slots[i] === null) {
        const at = firstTomb >= 0 ? firstTomb : i;
        if (firstTomb >= 0) this.tombs--;
        this.slots[at] = k; this.n++;
        if (this._load() >= this.resizeAt) this._growSilent();
        return;
      }
    }
    if (firstTomb >= 0) {                 // cycle exhausted, but a tombstone is reusable
      this.slots[firstTomb] = k; this.tombs--; this.n++;
      if (this._load() >= this.resizeAt) this._growSilent();
      return;
    }
    this.rejectedCount++;                 // probe cycle exhausted — reject
  }

  /** Grow (per _grownM) and rehash every live key, silently (used by build()). Tombstones evaporate. */
  _growSilent() {
    const old = this.slots.filter((v) => v !== null && v !== TOMB);
    this.M = this._grownM();
    if (!this._userQ) this.q = null;      // re-derive the stride prime for the new M
    this.slots = new Array(this.M).fill(null);
    this.n = 0; this.tombs = 0;
    for (const k of old) {
      const home = hash(k, this.M);
      let placed = false;
      for (let t = 0; t < this.M; t++) {
        const i = this._at(k, home, t);
        if (this.slots[i] === null) { this.slots[i] = k; this.n++; placed = true; break; }
      }
      if (!placed) this.rejectedCount++;  // can't happen at sane loads; never spin
    }
  }

  /** insert(k) — probe from h(k), counting each occupied slot passed as a "compare"
   *  (collision); place in the first empty slot, or the FIRST tombstone passed if the
   *  probe proves k absent. Resizes when (n + tombstones)/M ≥ resizeAt afterward.
   *  A key that cannot be placed is REJECTED (lastRejected), never an infinite loop. */
  insert(k) {
    const t = new Tracer();
    this.lastRejected = false;
    if (this.n >= this.M) {
      this.lastRejected = true;
      t.step(`table full (n = M = ${this.M}) — insert ${k} REJECTED: a fixed-size open-addressing table cannot take another key; it needs a RESIZE`,
        { snapshot: this.snapshot(), highlight: { danger: this.slots.map((_, idx) => idx) } });
      return t.trace();
    }
    const home = hash(k, this.M); t.count("hash");
    t.step(`insert ${k}: home slot h(${k}) = ${home}`, { snapshot: this.snapshot(), highlight: { active: [home], pointers: { h: home } } });

    let firstTomb = -1, empty = -1;
    for (let a = 0; a < this.M; a++) {
      const i = this._at(k, home, a);
      if (a > 0) t.step(this._probeMsg(k, home, a, i), { snapshot: this.snapshot(), highlight: { active: [i], pointers: { h: home } } });
      const v = this.slots[i];
      if (v === TOMB) {
        t.count("compare");
        if (firstTomb < 0) {
          firstTomb = i;
          t.step(`slot ${i} is a tombstone — remember it, keep probing (a duplicate of ${k} may still be ahead)`,
            { snapshot: this.snapshot(), highlight: { compare: [i], pointers: { h: home } } });
        } else {
          t.step(`slot ${i} is a tombstone (a key was deleted here) — keep probing`,
            { snapshot: this.snapshot(), highlight: { compare: [i], pointers: { h: home } } });
        }
        continue;
      }
      if (v === null) { empty = i; break; }
      t.count("compare");
      if (v === k) {
        t.step(`${k} already present at slot ${i} — no change`, { snapshot: this.snapshot(), highlight: { done: [i], pointers: { h: home } } });
        return t.trace();
      }
      t.step(`slot ${i} occupied by ${v} — collision, probe forward`, { snapshot: this.snapshot(), highlight: { compare: [i], pointers: { h: home } } });
    }

    let at;
    if (firstTomb >= 0) {
      at = firstTomb; this.tombs--;
      this.slots[at] = k; this.n++; t.count("write");
      t.step(`place ${k} in the remembered tombstone slot ${at} — the marker is reclaimed`,
        { snapshot: this.snapshot(), highlight: { done: [at], pointers: { h: home } } });
    } else if (empty >= 0) {
      at = empty;
      this.slots[at] = k; this.n++; t.count("write");
      t.step(`insert ${k} into empty slot ${at}`, { snapshot: this.snapshot(), highlight: { done: [at], pointers: { h: home } } });
    } else {
      this.lastRejected = true;
      t.step(`probe cycle exhausted after ${this.M} attempts — insert ${k} REJECTED (${this.probe} probing cannot reach an empty slot at this load; resize is the fix)`,
        { snapshot: this.snapshot(), highlight: { danger: this.slots.map((_, idx) => idx) } });
      return t.trace();
    }

    if (this._load() >= this.resizeAt) {
      const label = this.probe === "linear"
        ? `load factor ${this.n + this.tombs}/${this.M} ≥ ${this.resizeAt} — resize to ${this.M * 2} and rehash every key`
        : `load factor (n + tombstones)/M = ${this.n + this.tombs}/${this.M} ≥ ${this.resizeAt} — resize to ${this._grownM()} (next prime ≥ 2M — ${this.probe} probing needs a prime M) and rehash every key`;
      t.step(label, { snapshot: this.snapshot(), highlight: {} });
      this._resizeTraced(t);
    }

    t.step(`done — ${k} inserted`, { snapshot: this.snapshot(), highlight: { done: this.slots.map((v, idx) => (v === k ? idx : -1)).filter((x) => x >= 0) } });
    return t.trace();
  }

  /** Grow the table and rehash every live key, one traced step per placement. Tombstones evaporate. */
  _resizeTraced(t) {
    const old = this.slots.filter((v) => v !== null && v !== TOMB);
    this.M = this._grownM();
    if (!this._userQ) this.q = null;
    this.slots = new Array(this.M).fill(null);
    this.n = 0; this.tombs = 0;
    for (const k of old) {
      const home = hash(k, this.M); t.count("hash");
      let at = -1;
      for (let a = 0; a < this.M; a++) {
        const i = this._at(k, home, a);
        if (this.slots[i] === null) { at = i; break; }
        t.count("compare");
      }
      if (at < 0) { this.rejectedCount++; continue; }  // unreachable at sane loads
      this.slots[at] = k; this.n++; t.count("write");
      t.step(`rehash ${k} → slot ${at} (M=${this.M})`, { snapshot: this.snapshot(), highlight: { active: [at] } });
    }
  }

  /** search(k) — probe from h(k) until k is found or an EMPTY slot is hit;
   *  tombstones don't stop the walk (that is their whole job). */
  search(k) {
    const t = new Tracer();
    const home = hash(k, this.M); t.count("hash");
    t.step(`search ${k}: home slot h(${k}) = ${home}`, { snapshot: this.snapshot(), highlight: { active: [home], pointers: { h: home } } });

    for (let a = 0; a < this.M; a++) {
      const i = this._at(k, home, a);
      if (a > 0) t.step(this._probeMsg(k, home, a, i), { snapshot: this.snapshot(), highlight: { active: [i], pointers: { h: home } } });
      const v = this.slots[i];
      if (v === null) {
        t.step(`slot ${i} empty — ${k} not found`, { snapshot: this.snapshot(), highlight: { danger: [i], pointers: { h: home } } });
        return t.trace();
      }
      t.count("compare");
      if (v === TOMB) {
        t.step(`slot ${i} is a tombstone (a key was deleted here) — cannot stop, keep probing`,
          { snapshot: this.snapshot(), highlight: { compare: [i], pointers: { h: home } } });
        continue;
      }
      if (v === k) {
        t.step(`found ${k} at slot ${i}`, { snapshot: this.snapshot(), highlight: { done: [i], pointers: { h: home } } });
        return t.trace();
      }
      t.step(`slot ${i} = ${v} ≠ ${k} — probe forward`, { snapshot: this.snapshot(), highlight: { compare: [i], pointers: { h: home } } });
    }
    t.step(`probed all ${this.M} slots — ${k} not found (probe cycle exhausted)`,
      { snapshot: this.snapshot(), highlight: { danger: [home], pointers: { h: home } } });
    return t.trace();
  }

  /** remove(k) — find k (tombstones don't stop the walk), then either mark a
   *  TOMBSTONE (deleteMode "tombstone") or run Sedgewick's cluster re-insert
   *  (linear probing's no-tombstone repair: empty the slot, then re-insert the
   *  rest of the cluster so no search path breaks). */
  remove(k) {
    const t = new Tracer();
    const home = hash(k, this.M); t.count("hash");
    t.step(`remove ${k}: home slot h(${k}) = ${home}`, { snapshot: this.snapshot(), highlight: { active: [home], pointers: { h: home } } });

    let found = -1;
    for (let a = 0; a < this.M; a++) {
      const i = this._at(k, home, a);
      if (a > 0) t.step(this._probeMsg(k, home, a, i), { snapshot: this.snapshot(), highlight: { active: [i], pointers: { h: home } } });
      const v = this.slots[i];
      if (v === null) {
        t.step(`slot ${i} empty — ${k} not found, nothing to remove`, { snapshot: this.snapshot(), highlight: { danger: [i], pointers: { h: home } } });
        return t.trace();
      }
      t.count("compare");
      if (v === TOMB) {
        t.step(`slot ${i} is a tombstone (a key was deleted here) — cannot stop, keep probing`,
          { snapshot: this.snapshot(), highlight: { compare: [i], pointers: { h: home } } });
        continue;
      }
      if (v === k) { found = i; break; }
      t.step(`slot ${i} = ${v} ≠ ${k} — probe forward`, { snapshot: this.snapshot(), highlight: { compare: [i], pointers: { h: home } } });
    }
    if (found < 0) {
      t.step(`probed all ${this.M} slots — ${k} not found, nothing to remove`,
        { snapshot: this.snapshot(), highlight: { danger: [home], pointers: { h: home } } });
      return t.trace();
    }

    if (this.deleteMode === "tombstone") {
      this.slots[found] = TOMB; this.n--; this.tombs++; t.count("write");
      t.step(`remove ${k}: mark slot ${found} with a TOMBSTONE — searches must walk over it, inserts may reuse it`,
        { snapshot: this.snapshot(), highlight: { danger: [found], pointers: { h: home } } });
      t.step(`done — ${k} removed (${this.tombs} tombstone${this.tombs === 1 ? "" : "s"} in the table)`,
        { snapshot: this.snapshot(), highlight: {} });
      return t.trace();
    }

    // Sedgewick's linear-probing delete: rehash the rest of the cluster so no search breaks.
    this.slots[found] = null; this.n--; t.count("write");
    t.step(`remove ${k} from slot ${found} — empty it`, { snapshot: this.snapshot(), highlight: { danger: [found] } });
    let j = (found + 1) % this.M;
    while (this.slots[j] !== null) {
      const kk = this.slots[j];
      this.slots[j] = null; this.n--; t.count("write");
      t.step(`re-insert ${kk} (was in the same cluster at slot ${j}) so its probe sequence still works`,
        { snapshot: this.snapshot(), highlight: { active: [j] } });

      let p = hash(kk, this.M); t.count("hash");
      while (this.slots[p] !== null) { t.count("compare"); p = (p + 1) % this.M; }
      this.slots[p] = kk; this.n++; t.count("write");
      t.step(`${kk} reinserted at slot ${p}`, { snapshot: this.snapshot(), highlight: { done: [p] } });
      j = (j + 1) % this.M;
    }
    t.step(`done — ${k} removed`, { snapshot: this.snapshot(), highlight: {} });
    return t.trace();
  }
}

export class LinearProbing extends OpenAddressing {
  /** Back-compat alias: today's class, now a fixed probe strategy. */
  constructor(M = 8, opts = {}) { super(M, { ...opts, probe: "linear" }); }
}

// ---------------------------------------------------------------------------
// Separate chaining: M buckets, each a short list of keys; a collision just
// joins its bucket. snapshot() returns the buckets as an ARRAY OF ARRAYS for
// the dedicated ChainRenderer (chain nodes drawn hanging below each bucket).
// Traces highlight the home bucket AND the individual chain node being
// visited (highlight.node = [bucket, position], highlight.nodeState).
// M is FIXED by default (the teaching point is the buckets; the no-resize
// demo shows the O(1) promise breaking as α climbs) — pass a finite
// `resizeAt` to opt into doubling + rehash when α crosses it, which is the
// move that KEEPS α = O(1). remove() is a plain list unlink: chaining's
// delete is trivial, the contrast to open addressing.
export class SeparateChaining {
  /** @param {number} M @param {{resizeAt?:number}} [opts] resizeAt = α
   *  threshold that triggers doubling (default Infinity — fixed table). */
  constructor(M = 7, opts = {}) {
    this.M = M;
    this.buckets = Array.from({ length: M }, () => []);
    this.n = 0;
    this.resizeAt = opts.resizeAt ?? Infinity;
  }

  build(keys) { for (const k of keys) this._insertSilent(k); return this; }

  snapshot() { return this.buckets.map((b) => b.slice()); }
  inorder() { return this.buckets.flat(); }
  alpha() { return `${this.n}/${this.M} = ${(this.n / this.M).toFixed(2)}`; }

  _insertSilent(k) {
    const i = hash(k, this.M);
    if (!this.buckets[i].includes(k)) {
      this.buckets[i].push(k); this.n++;
      if (this.n / this.M >= this.resizeAt) this._growSilent();
    }
  }

  _growSilent() {
    const old = this.buckets.flat();
    this.M *= 2;
    this.buckets = Array.from({ length: this.M }, () => []);
    this.n = 0;
    for (const k of old) { this.buckets[hash(k, this.M)].push(k); this.n++; }
  }

  /** insert(k) — hash to the bucket, scan it for a duplicate, append. By
   *  default never resizes — a long bucket just gets longer (that is the α
   *  story); with a finite resizeAt, crossing it doubles M and rehashes. */
  insert(k) {
    const t = new Tracer();
    const i = hash(k, this.M); t.count("hash");
    t.step(`insert ${k}: home bucket h(${k}) = ${k} mod ${this.M} = ${i}`,
      { snapshot: this.snapshot(), highlight: { active: [i], pointers: { h: i } } });
    for (let p = 0; p < this.buckets[i].length; p++) {
      const kk = this.buckets[i][p];
      t.count("compare");
      if (kk === k) {
        t.step(`${k} already in bucket ${i} — no change`,
          { snapshot: this.snapshot(), highlight: { done: [i], node: [i, p], nodeState: "done", pointers: { h: i } } });
        return t.trace();
      }
      t.step(`scan bucket ${i}: ${kk} ≠ ${k}`,
        { snapshot: this.snapshot(), highlight: { compare: [i], node: [i, p], nodeState: "compare", pointers: { h: i } } });
    }
    this.buckets[i].push(k); this.n++; t.count("write");
    const len = this.buckets[i].length;
    t.step(`link ${k} into bucket ${i}${len > 1 ? " — the collision just joins the chain" : ""} (chain length ${len}, α = ${this.alpha()})`,
      { snapshot: this.snapshot(), highlight: { done: [i], node: [i, len - 1], nodeState: "done", pointers: { h: i } } });
    if (this.n / this.M >= this.resizeAt) {
      t.step(`α = ${this.alpha()} ≥ ${this.resizeAt} — resize: M doubles to ${this.M * 2}, EVERY key rehashes (this is the act that keeps α = O(1))`,
        { snapshot: this.snapshot(), highlight: {} });
      const old = this.buckets.flat();
      this.M *= 2;
      this.buckets = Array.from({ length: this.M }, () => []);
      this.n = 0;
      for (const kk of old) {
        const i2 = hash(kk, this.M); t.count("hash");
        this.buckets[i2].push(kk); this.n++; t.count("write");
        t.step(`rehash ${kk} → bucket ${i2} (M = ${this.M})`,
          { snapshot: this.snapshot(), highlight: { active: [i2], node: [i2, this.buckets[i2].length - 1], nodeState: "active" } });
      }
      t.step(`resize done — M = ${this.M}, α = ${this.alpha()}: the chains are short again`,
        { snapshot: this.snapshot(), highlight: {} });
    }
    return t.trace();
  }

  /** search(k) — hash to the bucket, walk ONLY that bucket's chain; the other M−1 buckets are never touched. */
  search(k) {
    const t = new Tracer();
    const i = hash(k, this.M); t.count("hash");
    t.step(`search ${k}: home bucket h(${k}) = ${k} mod ${this.M} = ${i}`,
      { snapshot: this.snapshot(), highlight: { active: [i], pointers: { h: i } } });
    let probes = 0;
    for (let p = 0; p < this.buckets[i].length; p++) {
      const kk = this.buckets[i][p];
      t.count("compare"); probes++;
      if (kk === k) {
        t.step(`bucket ${i}, node ${p + 1}: ${kk} ✓ found (${probes} compare${probes > 1 ? "s" : ""} — the other ${this.M - 1} buckets were never touched)`,
          { snapshot: this.snapshot(), highlight: { done: [i], node: [i, p], nodeState: "done", pointers: { h: i } } });
        return t.trace();
      }
      t.step(`bucket ${i}, node ${p + 1}: ${kk} ≠ ${k} — follow the chain`,
        { snapshot: this.snapshot(), highlight: { compare: [i], node: [i, p], nodeState: "compare", pointers: { h: i } } });
    }
    t.step(`chain ${i} exhausted — ${k} is not in the table (miss after ${probes} compare${probes === 1 ? "" : "s"})`,
      { snapshot: this.snapshot(), highlight: { danger: [i], pointers: { h: i } } });
    return t.trace();
  }

  /** remove(k) — hash to the bucket, walk the chain, unlink. One list splice;
   *  no other key moves (contrast with open addressing's cluster repair). */
  remove(k) {
    const t = new Tracer();
    const i = hash(k, this.M); t.count("hash");
    t.step(`delete ${k}: home bucket h(${k}) = ${k} mod ${this.M} = ${i}`,
      { snapshot: this.snapshot(), highlight: { active: [i], pointers: { h: i } } });
    for (let p = 0; p < this.buckets[i].length; p++) {
      const kk = this.buckets[i][p];
      t.count("compare");
      if (kk === k) {
        t.step(`bucket ${i}, node ${p + 1}: ${kk} ✓ — unlink it`,
          { snapshot: this.snapshot(), highlight: { compare: [i], node: [i, p], nodeState: "danger", pointers: { h: i } } });
        this.buckets[i].splice(p, 1); this.n--; t.count("write");
        t.step(`done — ${k} unlinked; no other key moved (α = ${this.alpha()})`,
          { snapshot: this.snapshot(), highlight: { done: [i], pointers: { h: i } } });
        return t.trace();
      }
      t.step(`bucket ${i}, node ${p + 1}: ${kk} ≠ ${k} — follow the chain`,
        { snapshot: this.snapshot(), highlight: { compare: [i], node: [i, p], nodeState: "compare", pointers: { h: i } } });
    }
    t.step(`chain ${i} exhausted — ${k} not present, nothing to delete`,
      { snapshot: this.snapshot(), highlight: { danger: [i], pointers: { h: i } } });
    return t.trace();
  }
}
