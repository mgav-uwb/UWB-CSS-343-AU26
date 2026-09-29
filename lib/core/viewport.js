// CSS 343 unified library — core/viewport.js
// Pan & zoom for a renderer's canvas. The default view is ALWAYS autofit
// (zoom 1 — whole structure visible); this module adds the opt-in magnifier:
//   · + / − / fit buttons overlaid on the panel
//   · wheel up/down zooms, anchored at the mouse pointer
//   · click-drag on the canvas (or the scrollbars) pans when zoomed in
// Zoom re-RENDERS at the new scale (renderers multiply their autofit scale by
// rend.zoom and grow the canvas via sizeCanvas), so text stays crisp — this is
// not a blurry CSS transform. Player/DualDemo call attachPanZoom on every
// canvas whose renderer supports zoom (it exposes a `zoom` property).

import { RENDER_LIMITS } from "./render-config.js";

export function attachPanZoom(canvas, rend) {
  if (!("zoom" in rend)) return; // renderer doesn't scale (graph, forest, …)
  const frame = canvas.parentElement;
  if (!frame) return;

  // restructure: frame keeps the border/padding and hosts the fixed controls;
  // a new inner .u-vp-scroll owns the scrollbars, so the controls don't
  // scroll away with the content
  const scroller = document.createElement("div");
  scroller.className = "u-vp-scroll";
  frame.insertBefore(scroller, canvas);
  scroller.appendChild(canvas);
  frame.classList.add("u-vp");

  const ctl = document.createElement("div");
  ctl.className = "u-vp-ctl";
  ctl.innerHTML = `
    <button data-z="in"  title="zoom in">+</button>
    <button data-z="out" title="zoom out">−</button>
    <button data-z="fit" title="fit whole structure">⤢</button>`;
  frame.appendChild(ctl);

  const redraw = () => { if (rend._last) rend.draw(rend._last[0], rend._last[1]); };

  /** Set zoom, keeping the content point under (cx,cy) (viewport px,
   *  default: viewport center) fixed on screen. */
  function setZoom(z, cx, cy) {
    z = Math.max(1, Math.min(RENDER_LIMITS.zoomMax, z));
    const z0 = rend.zoom ?? 1;
    if (z === z0) return;
    cx ??= scroller.clientWidth / 2; cy ??= scroller.clientHeight / 2;
    const oldW = scroller.scrollWidth, oldH = scroller.scrollHeight;
    const ax = scroller.scrollLeft + cx, ay = scroller.scrollTop + cy;

    // freeze the viewport height the first time we leave autofit, so zooming
    // pans inside a fixed window instead of growing the page
    if (z > 1 && !scroller.style.maxHeight) scroller.style.maxHeight = scroller.clientHeight + "px";

    rend.zoom = z;
    redraw();

    if (z === 1) { scroller.style.maxHeight = ""; scroller.scrollLeft = 0; scroller.scrollTop = 0; }
    else {
      scroller.scrollLeft = ax * (scroller.scrollWidth / oldW) - cx;
      scroller.scrollTop = ay * (scroller.scrollHeight / oldH) - cy;
    }
    ctl.classList.toggle("on", z > 1);
  }

  if (rend.expandable) attachExpand(canvas, rend, ctl);

  ctl.querySelector('[data-z="in"]').onclick = () => setZoom((rend.zoom ?? 1) * RENDER_LIMITS.zoomButtonStep);
  ctl.querySelector('[data-z="out"]').onclick = () => setZoom((rend.zoom ?? 1) / RENDER_LIMITS.zoomButtonStep);
  ctl.querySelector('[data-z="fit"]').onclick = () => setZoom(1);

  // wheel: zoom anchored at the pointer. At zoom 1, wheel-down (zoom out)
  // does nothing — let the page scroll normally instead of swallowing it.
  scroller.addEventListener("wheel", (e) => {
    const zoomingOut = e.deltaY > 0;
    if (zoomingOut && (rend.zoom ?? 1) <= 1) return;
    e.preventDefault();
    const r = scroller.getBoundingClientRect();
    const step = RENDER_LIMITS.zoomWheelStep;
    setZoom((rend.zoom ?? 1) * (zoomingOut ? 1 / step : step), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  // drag to pan. A real CLICK (movement under the threshold) still reaches
  // the canvas — InteractiveDemo's click-a-node keeps working; after a pan
  // the synthetic click is swallowed in the capture phase.
  let drag = null, suppressClick = false;
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    suppressClick = false;
    drag = { x: e.clientX, y: e.clientY, sl: scroller.scrollLeft, st: scroller.scrollTop, moved: false };
  });
  window.addEventListener("mousemove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    drag.moved = true;
    scroller.scrollLeft = drag.sl - dx; scroller.scrollTop = drag.st - dy;
    e.preventDefault();
  });
  window.addEventListener("mouseup", () => { if (drag?.moved) suppressClick = true; drag = null; });
  canvas.addEventListener("click", (e) => {
    if (suppressClick) { e.stopImmediatePropagation(); e.preventDefault(); }
    suppressClick = false;
  }, true);
}

/** EXPAND: a panel that is deliberately short (a tree strip above the panels
 *  that matter) grows to the demo's full height and OVERLAYS what is below it,
 *  so you can study the structure without the layout re-flowing — press again
 *  and it snaps back. Opt in with `rend.expandable = true`; the renderer only
 *  has to honour `baseH`, which every sizeCanvas-based renderer does.
 *  Called by attachPanZoom (the button joins its control stack). */
export function attachExpand(canvas, rend, ctl) {
  const frame = canvas.parentElement?.closest(".u-canvas-wrap") || canvas.parentElement;
  if (!frame || !ctl) return;
  const btn = document.createElement("button");
  btn.dataset.z = "expand";
  btn.title = "expand to full height";
  btn.setAttribute("aria-label", btn.title);
  btn.textContent = "⇕";
  ctl.appendChild(btn);

  let h0 = null;
  btn.onclick = () => {
    const on = !frame.classList.contains("u-expanded");
    if (on) {
      const host = frame.closest(".u-player") || frame.parentElement;
      h0 = rend.baseH;
      // fill the player box, minus the transport/status rows below it
      const room = Math.max(240, Math.round(host.clientHeight * 0.82));
      frame.classList.add("u-expanded");
      rend.baseH = room;
    } else {
      frame.classList.remove("u-expanded");
      if (h0) rend.baseH = h0;
    }
    btn.classList.toggle("on", on);
    btn.title = on ? "collapse" : "expand to full height";
    btn.setAttribute("aria-label", btn.title);
    if (rend._last) rend.draw(rend._last[0], rend._last[1]);
  };
}
