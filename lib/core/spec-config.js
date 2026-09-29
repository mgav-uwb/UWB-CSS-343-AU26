// CSS 343 unified library — core/spec-config.js
// Per-demo parameter configuration: one small deep-merge that lets any mount
// site (gallery page, deck registration, a single slide's data-config JSON)
// override a base spec from demos/*.js WITHOUT cloning it. See
// planning/demo-params-config-plan-2026-07-12.md for the full design.
//
//   resolveSpec(base, ...overrides)   // later layers win
//
// Merge rules (deliberately minimal — anything not listed just replaces):
//   · plain objects           → recursive merge (e.g. chrome, rendererOpts)
//   · ops[]     merged by `name`  ┐  an override entry tweaks the matching
//   · inputs[]  merged by `key`   ├─ base entry; a NEW name/key appends;
//   · presets[] merged by `name`  ┘  `enabled: false` REMOVES it at the end
//   · functions, other arrays, scalars → override wins wholesale
//
// Example — a slide reuses the registry's B-tree with a curated setup:
//   { use: "btree", initial: "5..75:5",
//     inputs: [{ key: "m", value: "4", width: 40 }],
//     ops: [{ name: "Search", enabled: false }],
//     chrome: { showScrub: true } }
// (`use` is resolved by deck.js mountDemo against demos/registry.js — this
// module only merges.)

const LIST_KEYS = { ops: "name", inputs: "key", presets: "name" };

const isObj = (v) => v != null && typeof v === "object" && !Array.isArray(v) && typeof v !== "function";

function mergeByKey(baseArr, overArr, idKey) {
  const out = baseArr.map((e) => ({ ...e }));
  for (const o of overArr) {
    const i = out.findIndex((e) => e[idKey] === o[idKey]);
    if (i >= 0) out[i] = { ...out[i], ...o };
    else out.push({ ...o });
  }
  return out;
}

function mergeLayer(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue;
    if (LIST_KEYS[k] && Array.isArray(v) && Array.isArray(base[k])) out[k] = mergeByKey(base[k], v, LIST_KEYS[k]);
    else if (isObj(v) && isObj(base[k])) out[k] = mergeLayer(base[k], v);
    else out[k] = v;
  }
  return out;
}

/** Deep-merge override layers onto a copy of a base spec (later layers win),
 *  then drop every ops/inputs/presets entry marked `enabled: false`. */
export function resolveSpec(base, ...overrides) {
  let spec = { ...base };
  for (const o of overrides) if (o) spec = mergeLayer(spec, o);
  for (const k of Object.keys(LIST_KEYS)) {
    if (Array.isArray(spec[k])) spec[k] = spec[k].filter((e) => e.enabled !== false);
  }
  return spec;
}
