// CSS 343 unified library — core/state-stack.js
// STATIC state-stack figures for handouts and slides: run a scripted list of
// operations against a structure and render the resulting states as a
// vertical stack of DOM tables, one full-width action-caption bar between
// consecutive states. Non-interactive by design — where the Player animates
// ONE operation, a state-stack juxtaposes MANY end states so the sequence
// (insert → collide → delete → tombstone → failed search) reads at a glance,
// in print, at any zoom. Markers derive from the TRACE, not hand-annotation:
//   purple  = placed this step (the last frame's `done` indices)
//   amber ✗ = probed on the way (union of compare/active across the step)
//   gray  † = tombstone (any cell whose display value is "†")
//   red caption = the operation failed (`danger` in the last frame)
// Array-shaped snapshots only (open-addressing hash tables): values, "·" =
// empty, "†" = tombstone. Styles live in lib.css (.u-stack*).

const asArr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/**
 * @param {HTMLElement} el
 * @param {{
 *   make: () => any,                 // fresh structure (traced methods)
 *   build?: number[],                // silent pre-load before the first state
 *   steps: Array<{ run: (s:any) => any, caption?: string }>,
 *   indices?: ("ends"|"all"|false),  // index rows (default "ends")
 * }} cfg
 */
export function renderStateStack(el, cfg) {
  const root = document.createElement("div"); root.className = "u-stack";
  const s = cfg.make();
  if (cfg.build && s.build) s.build(cfg.build);
  const indices = cfg.indices ?? "ends";

  const stateRow = (snap, marks) => {
    const row = document.createElement("div"); row.className = "u-stack-tbl";
    snap.forEach((v, i) => {
      const c = document.createElement("div"); c.className = "u-stack-cell";
      if (v === "†") c.classList.add("u-tomb");
      if (marks.probes.has(i)) c.classList.add("u-probe");
      if (marks.news.has(i)) c.classList.add("u-new");
      c.textContent = v === "·" ? "" : String(v);
      row.appendChild(c);
    });
    return row;
  };
  const indexRow = (n) => {
    const row = document.createElement("div"); row.className = "u-stack-idx";
    for (let i = 0; i < n; i++) {
      const sp = document.createElement("span"); sp.textContent = String(i); row.appendChild(sp);
    }
    return row;
  };
  const captionRow = (text, fail) => {
    const d = document.createElement("div"); d.className = "u-stack-act" + (fail ? " fail" : "");
    d.textContent = text;
    return d;
  };

  root.appendChild(stateRow(s.snapshot(), { news: new Set(), probes: new Set() }));
  if (indices) root.appendChild(indexRow(s.snapshot().length));

  cfg.steps.forEach((step, k) => {
    const tr = step.run(s);
    const last = tr.at(tr.length - 1);
    const news = new Set(asArr(last.highlight.done));
    const probes = new Set();
    for (const f of tr.frames) {
      asArr(f.highlight.compare).forEach((i) => probes.add(i));
      asArr(f.highlight.active).forEach((i) => probes.add(i));
    }
    news.forEach((i) => probes.delete(i));
    const fail = asArr(last.highlight.danger).length > 0;
    asArr(last.highlight.danger).forEach((i) => probes.add(i));
    root.appendChild(captionRow(step.caption ?? last.msg, fail));
    root.appendChild(stateRow(last.snapshot, { news, probes }));
    if (indices === "all" || (indices === "ends" && k === cfg.steps.length - 1)) {
      root.appendChild(indexRow(last.snapshot.length));
    }
  });
  el.appendChild(root);
}
