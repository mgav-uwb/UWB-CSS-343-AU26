// CSS 343 unified library — core/info-bar.js
// A persistent STATE readout under the render: "M = 16 · n = 7 · α = 0.44 ·
// h(k) = k mod 16". Where the status line narrates the current STEP, the info
// bar states the structure's CURRENT CONFIGURATION — and it derives from the
// CURRENT FRAME's snapshot, not the live structure, so scrubbing backward
// shows the state as it was (M before the resize, the tombstone count then).
// spec.info(snapshot, frame) => string; demos define it per structure shape.
// Kept out of player.js so the Player stays a pure transport.

/** Insert a frame-tracking info bar into `player`'s chrome and refresh it on
 *  every rendered frame. `info` is the render function, or an object:
 *    { render, place: "above"|"below", html: false }
 *  "above" (the default) puts it just over the status line; "below" puts it
 *  under the whole transport — where a SIZE/score readout belongs, after the
 *  controls rather than between the picture and its caption. */
export function attachInfoBar(player, info) {
  if (!info) return null;
  const cfg = typeof info === "function" ? { render: info } : info;
  if (typeof cfg.render !== "function") return null;
  const bar = document.createElement("div");
  bar.className = "u-infobar" + (cfg.place === "below" ? " u-below" : "");
  if (cfg.place === "below") {
    // the END of the player's chrome, not "after .u-costs" — with
    // `costsInline` the counters live inside the transport row, and anchoring
    // off them put this strip in there too, wrapping the row
    player.el.appendChild(bar);
  } else {
    const status = player.el.querySelector(".u-status");
    status.parentNode.insertBefore(bar, status);
  }
  const orig = player._render.bind(player);
  player._render = () => {
    orig();
    const t = player.trace;
    if (t && t.length) {
      const f = t.at(player.i);
      const out = cfg.render(f.snapshot, f) ?? "";
      if (cfg.html) bar.innerHTML = out; else bar.textContent = out;
      bar.style.display = out ? "" : "none";
    }
  };
  return bar;
}

// ── standard readouts for the hash-table snapshot shapes ────────────────────
// (everything is COUNTED from the snapshot, never read off the live structure)

/** Open-addressing display array: values, "·" empty, "†" tombstone. */
export const openAddressingInfo = (note) => (snap) => {
  if (!Array.isArray(snap)) return "";
  const M = snap.length;
  const tombs = snap.filter((v) => v === "†").length;
  const n = M - tombs - snap.filter((v) => v === "·").length;
  return `M = ${M} · n = ${n} · α = ${M ? (n / M).toFixed(2) : "—"}`
    + (tombs ? ` · tombstones ${tombs} (load ${((n + tombs) / M).toFixed(2)})` : "")
    + ` · h(k) = k mod ${M}` + (note ? ` · ${note}` : "");
};

/** Separate-chaining snapshot: an array of bucket arrays. */
export const chainingInfo = (note) => (snap) => {
  if (!Array.isArray(snap)) return "";
  const M = snap.length;
  const n = snap.reduce((s, b) => s + b.length, 0);
  const longest = Math.max(0, ...snap.map((b) => b.length));
  return `M = ${M} · n = ${n} · α = ${M ? (n / M).toFixed(2) : "—"} · longest chain ${longest}`
    + (note ? ` · ${note}` : "");
};

/** Graph traversal snapshot ({nodes, edges, frontier?}) + per-frame highlight:
 *  V/E, visit progress, the done ORDER (BFS: dequeue order · DFS: finish order
 *  · Kahn: output order), the live frontier, and the per-vertex labels when an
 *  algorithm is annotating (BFS distances / Kahn in-degrees). */
export const graphInfo = (snap, frame) => {
  if (!snap || !Array.isArray(snap.nodes)) return "";
  const hl = frame?.highlight ?? {};
  const parts = [`V = ${snap.nodes.length}`, `E = ${snap.edges.length}`];
  const done = hl.nodes?.done ?? [];
  const seen = new Set([...(hl.nodes?.visited ?? []), ...done]);
  if (seen.size) parts.push(`visited ${seen.size}/${snap.nodes.length}`);
  if (done.length) parts.push(`done: ${done.join(" ")}`);
  if (snap.frontier) parts.push(`${snap.frontier.label}: [${snap.frontier.items.join(" ")}]`);
  const dist = hl.dist;
  if (dist && Object.keys(dist).length) {
    parts.push(`labels: ${snap.nodes.map((n) => (dist[n.id] === Infinity ? "∞" : dist[n.id] ?? "–")).join(" ")}`);
  }
  return parts.join(" · ");
};
