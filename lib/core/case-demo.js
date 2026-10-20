// CSS 343 unified library — core/case-demo.js
// The CASE-SELECTOR interaction pattern: a row of named case buttons (optionally
// grouped), each of which builds a preset structure and runs one scripted
// operation, loaded into the shared Player. For the rotation styles (LL/RR/LR/RL)
// and the delete cases (leaf / one-child / two-child / +rotation / +cascade).
//
// spec = {
//   cases: [ { name, group?, ghost?, make?, build?:[keys], run:(s, spec)=>Trace } ],
//                                   // run also gets the resolved spec, so a slide's
//                                   // data-config can switch a mode (e.g. {"fix": false})
//   groups?: [name, …],             // show only the cases in these groups (a case's
//                                   // group is the last `group` named at or before it)
//   make: ()=>structure,            // default factory when a case has no `make`
//   help?: string,                  // "?" popover at the end of the case bar
//   info?: (snapshot, frame)=>string,  // per-frame state readout (core/info-bar.js)
//   renderer, costs?, chrome?, width?, height?, autoRun?: 'first'|<name>|false,
//   layout?: "row", cols?: [w, …], labels?: [text, …]   // with an ARRAY of renderers
// }

import { Player } from "./player.js";
import { attachHelpPopover } from "./control-bar.js";
import { attachInfoBar } from "./info-bar.js";

export class CaseDemo {
  constructor(mount, spec) {
    this.spec = spec;
    const root = document.createElement("div"); root.className = "u-casedemo";
    const bar = document.createElement("div"); bar.className = "u-casebar";
    let lastGroup = null, sticky = null;
    const shown = spec.cases.filter((c) => { sticky = c.group || sticky; return !spec.groups || spec.groups.includes(sticky); });
    sticky = null;
    const groupOf = new Map(spec.cases.map((c) => [c, (sticky = c.group || sticky)]));
    this.cases = shown;
    shown.forEach((c) => {
      const g = groupOf.get(c);
      if (g && g !== lastGroup) {
        const lab = document.createElement("span"); lab.className = "u-caselabel";
        lab.textContent = g; bar.appendChild(lab); lastGroup = g;
      }
      const btn = document.createElement("button"); btn.textContent = c.name;
      if (c.ghost) btn.className = "ghost"; btn.dataset.case = c.name; btn._case = c; // names may repeat across groups
      btn.onclick = () => this.run(c, true); bar.appendChild(btn);
    });
    if (spec.help) attachHelpPopover(bar.lastElementChild, spec.help);
    root.appendChild(bar);
    const pm = document.createElement("div"); root.appendChild(pm);
    mount.appendChild(root);
    this.$bar = bar;

    const chrome = Object.assign({ mini: false, showScrub: true, showCosts: !!spec.costs }, spec.chrome || {});
    this.player = new Player(pm, spec.renderer, {
      width: spec.width, height: spec.height, costs: spec.costs,
      layout: spec.layout, cols: spec.cols, labels: spec.labels,
      showScrub: chrome.showScrub, showCosts: chrome.showCosts, mini: chrome.mini,
    });
    attachInfoBar(this.player, spec.info);

    const first = spec.autoRun === false ? null
      : typeof spec.autoRun === "string" ? shown.find((c) => c.name === spec.autoRun) || shown[0]
        : shown[0];
    if (first) {
      this.run(first, false);
      if (spec.autoRun !== false && typeof IntersectionObserver === "function") {
        let done = false;
        const io = new IntersectionObserver((es) => {
          for (const e of es) if (!done && e.isIntersecting && e.intersectionRatio > 0.4) {
            done = true; io.disconnect(); this.player.seek(0); setTimeout(() => this.player.play(), 250);
          }
        }, { threshold: [0, 0.4, 0.75] });
        io.observe(pm);
      }
    }
  }

  run(c, play) {
    const s = (c.make || this.spec.make)();
    if (c.build && s.build) s.build(c.build);
    this.player.load(c.run(s, this.spec));
    this.$bar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b._case === c));
    if (play) this.player.play();
  }
}
