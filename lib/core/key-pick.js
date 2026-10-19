// CSS 343 unified library: core/key-pick.js
// CLICK A KEY TO FILL THE RUN BOX. On a demo whose ops include a Delete that
// takes a number, clicking a key in the picture (a tree node, one key of a
// 2-3 or B-tree node, a hash slot, a chain node) puts that key in the Run
// row's value box and selects Delete: deleting what you see is click + Run.
// FullDemo and DualDemo wire it; a spec opts out with `pickOp: false` or
// names another op with `pickOp: "Search"`.
//
// A renderer takes part by exposing keyAt(px, py) in DESIGN units (or
// nodeAt, the binary-tree renderer's older hit test). Only numeric keys
// count: an empty slot, a tombstone or a label is not a key. A drag that pans
// a zoomed view is not a click (viewport.js swallows it).

/** The op a click fills the box for: spec.pickOp by name, else the first
 *  Delete/Remove op that takes a number; null when there is none. */
export function pickOpOf(ops, pickOp) {
  if (pickOp === false) return null;
  const list = ops || [];
  if (typeof pickOp === "string") return list.find((o) => o.name === pickOp) ?? null;
  return list.find((o) => o.arg === "number" && /^(delete|remove)\b/i.test(o.name)) ?? null;
}

/** Renderer helper: the numeric key whose recorded box contains (px, py). */
export function hitKey(hits, px, py) {
  const h = (hits || []).find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);
  return h ? asKey(h.key) : null;
}

const asKey = (k) => (k == null || k === "" || !Number.isFinite(Number(k)) ? null : Number(k));

/** Clicking a key on `canvas` calls onPick(key); hovering one shows a pointer. */
export function attachKeyPick(canvas, rend, onPick) {
  const test = rend.keyAt || rend.nodeAt;
  if (!test) return;
  const keyUnder = (e) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const W = rend.W ?? canvas.width, H = rend.H ?? canvas.height;
    return asKey(test.call(rend, (e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)));
  };
  canvas.addEventListener("click", (e) => { const k = keyUnder(e); if (k != null) onPick(k); });
  canvas.addEventListener("mousemove", (e) => { canvas.style.cursor = keyUnder(e) != null ? "pointer" : ""; });
}
