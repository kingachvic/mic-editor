"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/paper/timeline.ts
var linear = (v) => v;
var easeInOutCubic = (v) => v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
var easeOutCubic = (v) => 1 - Math.pow(1 - v, 3);
var easeInCubic = (v) => v * v * v;
var easeInOutSine = (v) => -(Math.cos(Math.PI * v) - 1) / 2;
var easeOutBack = (v) => 1 + 2.70158 * Math.pow(v - 1, 3) + 1.70158 * Math.pow(v - 1, 2);
var NOW = 0;
function now() {
  return NOW;
}
var order = 0;
var lastEnd = 0;
function sig(init) {
  const segs = [];
  let sorted = true;
  let over = null;
  const windows = [];
  const at = (t) => {
    if (over) return over(t);
    if (windows.length) {
      for (const w of windows) if (t >= w.t0 && t <= w.t1) {
        const base = atBase(t);
        const k = Math.min(1, (t - w.t0) / w.b, (w.t1 - t) / w.b);
        const e = k >= 1 ? 1 : k * k * (3 - 2 * k);
        return base + (w.fn(t) - base) * e;
      }
    }
    return atBase(t);
  };
  const atBase = (t) => {
    if (!sorted) {
      segs.sort((a, b) => a.s - b.s || a.n - b.n);
      sorted = true;
    }
    let v = init;
    for (const g2 of segs) {
      if (t < g2.s) break;
      if (g2.d <= 0 || t >= g2.s + g2.d) v = g2.to;
      else {
        v = v + (g2.to - v) * g2.e((t - g2.s) / g2.d);
        break;
      }
    }
    return v;
  };
  const add = (to, d, e) => (s) => {
    segs.push({ s, d: Math.max(0, d), to, e, n: order++ });
    sorted = false;
    lastEnd = Math.max(lastEnd, s + d);
    return s + Math.max(0, d);
  };
  const f3 = (() => at(NOW));
  f3.at = at;
  f3.to = (v, d = 0.6, e = easeInOutCubic) => add(v, d, e);
  f3.set = (v) => add(v, 0, linear);
  f3.follow = (fn) => {
    over = fn;
  };
  f3.followDuring = (fn, t0, t1, b = 0.6) => {
    windows.push({ fn, t0, t1, b: Math.max(0.01, b) });
    lastEnd = Math.max(lastEnd, t1 === Infinity ? t0 : t1);
  };
  return f3;
}
var all = (...as) => (s) => Math.max(s, ...as.map((a) => a(s)));
var chain = (...as) => (s) => as.reduce((c, a) => a(c), s);
function resetLastEnd() {
  lastEnd = 0;
}
function getLastEnd() {
  return lastEnd;
}

// src/paper/svg.ts
var flat = (c) => c.flat(Infinity).filter((x) => x !== null && x !== void 0 && x !== false);
var f = (n2) => Math.round(n2 * 100) / 100;
var pts = (p) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
function g(h, o, ...children) {
  const t = [];
  if (o.x || o.y) t.push(`translate(${f(o.x ?? 0)} ${f(o.y ?? 0)})`);
  if (o.rot) t.push(`rotate(${f(o.rot)})`);
  if (o.s !== void 0 && o.s !== 1) t.push(`scale(${Math.max(o.s, 1e-6)})`);
  const props = {};
  if (t.length) props.transform = t.join(" ");
  if (o.op !== void 0 && o.op < 1) props.opacity = Math.max(0, o.op);
  if (o.op !== void 0 && o.op <= 1e-4) return null;
  if (o.s !== void 0 && o.s <= 1e-6) return null;
  return h("g", props, ...flat(children));
}
function line(h, p, o = {}) {
  const props = { points: pts(p), fill: o.closed && o.fill ? o.fill : "none" };
  if (o.stroke && (o.w ?? 0) > 0) {
    props.stroke = o.stroke;
    props.strokeWidth = o.w;
    if (o.cap) props.strokeLinecap = o.cap;
    if (o.join) props.strokeLinejoin = o.join;
    if (o.end !== void 0 && o.end < 1) {
      props.pathLength = 1;
      props.strokeDasharray = `${Math.max(0, o.end)} 2`;
    }
  }
  if (o.op !== void 0) props.opacity = o.op;
  if (o.shadow) props.filter = "url(#shadow)";
  return h(o.closed ? "polygon" : "polyline", props);
}
function rect(h, x, y, w, ht, o = {}) {
  const r = o.r ?? 0;
  const style = { fill: o.fill ?? "none" };
  if (o.stroke && (o.lw ?? 0) > 0) {
    style.stroke = o.stroke;
    style.strokeWidth = o.lw;
  }
  if (typeof r === "number") {
    const rr = Math.min(r, w / 2, ht / 2);
    return h("rect", { x: f(x - w / 2), y: f(y - ht / 2), width: w, height: ht, rx: rr, ry: rr, ...style });
  }
  const [tl, tr, br, bl] = r;
  const x0 = x - w / 2, y0 = y - ht / 2, x1 = x + w / 2, y1 = y + ht / 2;
  const d = `M ${f(x0 + tl)} ${f(y0)} L ${f(x1 - tr)} ${f(y0)} Q ${f(x1)} ${f(y0)} ${f(x1)} ${f(y0 + tr)} L ${f(x1)} ${f(y1 - br)} Q ${f(x1)} ${f(y1)} ${f(x1 - br)} ${f(y1)} L ${f(x0 + bl)} ${f(y1)} Q ${f(x0)} ${f(y1)} ${f(x0)} ${f(y1 - bl)} L ${f(x0)} ${f(y0 + tl)} Q ${f(x0)} ${f(y0)} ${f(x0 + tl)} ${f(y0)} Z`;
  return h("path", { d, ...style });
}
function circle(h, x, y, w, ht = w, o = {}) {
  const props = { cx: f(x), cy: f(y), rx: w / 2, ry: ht / 2, fill: o.fill ?? "none" };
  if (o.stroke && (o.lw ?? 0) > 0) {
    props.stroke = o.stroke;
    props.strokeWidth = o.lw;
  }
  if (o.rot) props.transform = `rotate(${o.rot} ${f(x)} ${f(y)})`;
  return h("ellipse", props);
}
function text(h, s, x, y, o) {
  const props = {
    x: f(x),
    y: f(y),
    fill: o.fill,
    fontFamily: o.family ?? "Inter",
    fontSize: o.size,
    fontWeight: o.weight ?? 400,
    textAnchor: o.align === "l" ? "start" : o.align === "r" ? "end" : "middle",
    dominantBaseline: "central",
    style: { whiteSpace: "pre" }
  };
  if (o.italic) props.fontStyle = "italic";
  if (o.op !== void 0) {
    if (o.op <= 1e-4) return null;
    props.opacity = o.op;
  }
  return h("text", props, s);
}
function path(h, d, o = {}) {
  const props = { d, fill: o.fill ?? "none" };
  if (o.stroke && (o.lw ?? 0) > 0) {
    props.stroke = o.stroke;
    props.strokeWidth = o.lw;
    if (o.cap) props.strokeLinecap = o.cap;
    if (o.join) props.strokeLinejoin = o.join;
  }
  if (o.op !== void 0) props.opacity = o.op;
  return h("path", props);
}

// src/paper/layout.ts
var ctx = null;
var cache = /* @__PURE__ */ new Map();
var fontString = (f3) => `${f3.italic ? "italic " : ""}${f3.weight ?? 400} ${f3.size}px ${f3.family}`;
function measure(s, f3) {
  const font2 = fontString(f3);
  const key = font2 + "|" + s;
  const hit = cache.get(key);
  if (hit !== void 0) return hit;
  if (typeof document === "undefined") return s.length * f3.size * 0.55;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return s.length * f3.size * 0.55;
  ctx.font = font2;
  const w = ctx.measureText(s).width;
  if (typeof document === "undefined" || !document.fonts || document.fonts.check(font2, s)) cache.set(key, w);
  return w;
}
var LINE = 1.2;
function textItem(s, o, m = {}) {
  const family = o.family ?? "Inter";
  const w = measure(s, { family, size: o.size, weight: o.weight, italic: o.italic });
  return {
    w,
    h: o.size * LINE,
    ...m,
    draw: (h, cx, cy) => text(h, s, cx, cy, { size: o.size, weight: o.weight, fill: o.fill, family, italic: o.italic, op: o.op })
  };
}
function boxItem(w, ht, fill, m = {}) {
  return { w, h: ht, ...m, draw: (h, cx, cy, ww) => fill ? rect(h, cx, cy, ww ?? w, ht, { fill }) : null };
}
var pads = (p = 0) => typeof p === "number" ? [p, p, p, p] : p.length === 2 ? [p[0], p[1], p[0], p[1]] : p;
function row(items, o = {}, m = {}) {
  const gap = o.gap ?? 0;
  const [pt, pr, pb, pl] = pads(o.pad);
  const align = o.align ?? "center";
  const inner = items.reduce((s, it, i) => s + (it.ml ?? 0) + it.w + (it.mr ?? 0) + (i ? gap : 0), 0);
  const tall = Math.max(0, ...items.map((it) => (it.mt ?? 0) + it.h + (it.mb ?? 0)));
  const W = inner + pl + pr, Ht = tall + pt + pb;
  return {
    w: W,
    h: Ht,
    ...m,
    draw: (h, cx, cy) => {
      let x = cx - W / 2 + pl;
      const top = cy - Ht / 2 + pt, bottom = top + tall;
      return items.map((it, i) => {
        if (i) x += gap;
        x += it.ml ?? 0;
        const icx = x + it.w / 2;
        x += it.w + (it.mr ?? 0);
        const icy = align === "end" ? bottom - (it.mb ?? 0) - it.h / 2 : align === "start" ? top + (it.mt ?? 0) + it.h / 2 : (top + bottom) / 2 + ((it.mt ?? 0) - (it.mb ?? 0)) / 2;
        return it.draw(h, icx, icy);
      });
    }
  };
}
function column(items, o = {}, m = {}) {
  const gap = o.gap ?? 0;
  const [pt, pr, pb, pl] = pads(o.pad);
  const align = o.align ?? "center";
  const wide = Math.max(0, ...items.filter((it) => !it.stretch).map((it) => (it.ml ?? 0) + it.w + (it.mr ?? 0)));
  const inner = items.reduce((s, it, i) => s + (it.mt ?? 0) + it.h + (it.mb ?? 0) + (i ? gap : 0), 0);
  const W = wide + pl + pr, Ht = inner + pt + pb;
  return {
    w: W,
    h: Ht,
    ...m,
    draw: (h, cx, cy) => {
      let y = cy - Ht / 2 + pt;
      const left = cx - W / 2 + pl, right = left + wide;
      return items.map((it, i) => {
        if (i) y += gap;
        y += it.mt ?? 0;
        const icy = y + it.h / 2;
        y += it.h + (it.mb ?? 0);
        if (it.stretch) return it.draw(h, (left + right) / 2, icy, wide);
        const icx = align === "start" ? left + (it.ml ?? 0) + it.w / 2 : align === "end" ? right - (it.mr ?? 0) - it.w / 2 : (left + right) / 2 + ((it.ml ?? 0) - (it.mr ?? 0)) / 2;
        return it.draw(h, icx, icy);
      });
    }
  };
}

// src/paper/theme.ts
var P = {
  paper: "#F5F2EA",
  grid: "#CFD8E3",
  ink: "#23211E",
  muted: "#6E6A63",
  card: "#FFFDF8",
  k: "#7E4BC4",
  // K⁺ violet (its flame-test lilac)
  na: "#C49A00",
  // Na⁺ mustard (sodium-flame yellow, darkened for contrast on paper), always with an ink outline
  an: "#BEB9B0",
  // trapped anions, warm grey
  mem: "#4E9A8C",
  // membrane hatching, teal
  pen: "#D2402F",
  // red pen: focus circles, arrows that point
  volt: "#1F4E9C",
  // blue pen: the voltage (marker, readout)
  hl: "#FF8FB1",
  // pink highlighter
  tape: "#E9DDB8",
  shadow: "rgba(58, 46, 31, 0.22)"
};
var SANS = "Inter";
var SERIF = "Lora, Inter";
var FSZ = { small: 20, label: 22, body: 30, callout: 34, head: 44 };
var PACE = 1.5;
var T = {
  in: 0.4 * PACE,
  // appear (ease-out: quick start, soft landing); 0.25 was too quick to notice (creator, 28 Oct)
  out: 0.25 * PACE,
  // leave
  move: 0.5 * PACE,
  // move / resize
  focus: 0.2 * PACE,
  // spotlight change (dim the rest, brighten the subject)
  cam: 0.6 * PACE,
  // camera push-in / pull-out
  pulse: 0.35 * PACE,
  pen: 0.6 * PACE,
  // pen circle draws on, like a hand drawing it (0.35 was too quick)
  hl: 0.25 * PACE,
  // highlighter swipe (creator: right as is)
  settle: 0.3 * PACE
  // a beat between the camera arriving and the subject starting to move (creator, 29 Oct)
};
var DIM = 0.35;
function rgbaHex(h, a) {
  const n2 = parseInt(h.slice(1), 16);
  return `rgba(${n2 >> 16 & 255}, ${n2 >> 8 & 255}, ${n2 & 255}, ${a})`;
}
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function jitter(seed, edge, i) {
  return prng(seed * 7919 + edge * 104729 + i * 15485863 >>> 0)() * 2 - 1;
}
function tornPoints(w, h, seed, tear = "r", amp = 2.2) {
  const pts2 = [];
  const x0 = -w / 2;
  const y0 = -h / 2;
  const STEP = 7;
  const edge = (k, ax, ay, bx, by, a) => {
    const len = Math.hypot(bx - ax, by - ay);
    const nx = -(by - ay) / (len || 1);
    const ny = (bx - ax) / (len || 1);
    for (let d = 0, i = 0; d < len; d += STEP, i++) {
      const t = d / len;
      const j = jitter(seed, k, i) * a;
      pts2.push([ax + (bx - ax) * t + nx * j, ay + (by - ay) * t + ny * j]);
    }
  };
  const A = (s) => s === tear ? amp * 2.6 : amp;
  edge(0, x0, y0, x0 + w, y0, A("t"));
  edge(1, x0 + w, y0, x0 + w, y0 + h, A("r"));
  edge(2, x0 + w, y0 + h, x0, y0 + h, A("b"));
  edge(3, x0, y0 + h, x0, y0, A("l"));
  return pts2;
}
function penLoop(rx, ry, seed) {
  const r = prng(seed);
  const a0 = r() * Math.PI * 2;
  const over = 0.35 + r() * 0.75;
  const tmax = 0.45 * Math.pow(Math.min(1, ry / rx), 1.5);
  const tilt = (r() * 2 - 1) * tmax;
  const asp = 1 + r() * 0.12;
  const RX = rx * asp;
  const RY = ry * asp * (1 + 2.2 * Math.abs(tilt));
  const harm = [2, 3].map((k) => [k, (8e-3 + r() * 0.014) / k, r() * Math.PI * 2]);
  const drift = (r() * 2 - 1) * 0.08;
  const loop2 = (scale, extra) => {
    const out = [];
    const n2 = 64;
    for (let i = 0; i <= n2; i++) {
      const u = i / n2;
      const a = a0 + (Math.PI * 2 + over + extra) * u;
      const k = scale * (1 + harm.reduce((s, [h, amp, ph]) => s + amp * Math.sin(h * a + ph), 0) + drift * u);
      const px = RX * k * Math.cos(a);
      const py = RY * k * Math.sin(a);
      out.push([px * Math.cos(tilt) - py * Math.sin(tilt), px * Math.sin(tilt) + py * Math.cos(tilt)]);
    }
    return out;
  };
  r();
  return { main: loop2(1, 0), second: null };
}

// src/paper/kit.ts
function node(o = {}) {
  const n2 = {
    x: sig(o.x ?? 0),
    y: sig(o.y ?? 0),
    s: sig(o.s ?? 1),
    rot: sig(o.rot ?? 0),
    op: sig(o.op ?? 1),
    to: (p, d, e) => all(n2.x.to(p[0], d, e), n2.y.to(p[1], d, e)),
    g: (h, ...children) => g(h, { x: n2.x(), y: n2.y(), s: n2.s(), rot: n2.rot(), op: n2.op() }, ...children)
  };
  return n2;
}
function makeCamera() {
  const n2 = node();
  const push = (p, s, run = T.cam) => all(n2.s.to(s, run), n2.x.to(p[0] * (1 - s), run), n2.y.to(p[1] * (1 - s), run));
  const frame = (p, s, run = T.cam) => all(n2.s.to(s, run), n2.x.to(-p[0] * s, run), n2.y.to(-p[1] * s, run));
  const reset = (run = T.cam) => all(n2.s.to(1, run), n2.x.to(0, run), n2.y.to(0, run));
  return { node: n2, push, frame, reset, g: (h, ...c) => n2.g(h, ...c) };
}

// src/mic/parse.ts
function tokenize(src) {
  let s = "";
  for (let q = 0, inQ = ""; q < src.length; q++) {
    const ch = src[q];
    if (inQ) {
      s += ch;
      if (ch === inQ) inQ = "";
      continue;
    }
    if (ch === '"' || ch === "\u201C") {
      inQ = ch === '"' ? '"' : "\u201D";
      s += ch;
      continue;
    }
    if (ch === "#") {
      s += src.slice(q);
      break;
    }
    if (ch === "=") {
      s = s.replace(/[ \t]+$/, "") + "=";
      while (src[q + 1] === " " || src[q + 1] === "	") q++;
      continue;
    }
    s += ch;
  }
  const out = [];
  let i = 0;
  const readStr = () => {
    const q = s[i++];
    let r = "";
    while (i < s.length && s[i] !== q) {
      if (s[i] === "\\" && s[i + 1] === q) {
        r += q;
        i += 2;
        continue;
      }
      r += s[i++];
    }
    if (i >= s.length) throw new Error("a quote is not closed");
    i++;
    return r;
  };
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "	") {
      i++;
      continue;
    }
    if (c === "#") break;
    if (c === '"' || c === "\u201C" || c === "\u201D") {
      if (c !== '"') {
        const j2 = s.indexOf(c === "\u201C" ? "\u201D" : "\u201D", i + 1);
        if (j2 < 0) throw new Error("a quote is not closed");
        out.push({ kind: "str", text: s.slice(i + 1, j2) });
        i = j2 + 1;
        continue;
      }
      out.push({ kind: "str", text: readStr() });
      continue;
    }
    let j = i;
    while (j < s.length && s[j] !== " " && s[j] !== "	" && s[j] !== "=" && s[j] !== "#") j++;
    if (s[j] === "=" && j > i) {
      const key = s.slice(i, j);
      i = j + 1;
      if (s[i] === '"' || s[i] === "\u201C") {
        const quoted = s[i] === '"' ? readStr() : (() => {
          const k2 = s.indexOf("\u201D", i + 1);
          if (k2 < 0) throw new Error("a quote is not closed");
          const v2 = s.slice(i + 1, k2);
          i = k2 + 1;
          return v2;
        })();
        out.push({ kind: "kv", key: key.toLowerCase(), text: quoted, quoted: true });
        continue;
      }
      let k = i;
      while (k < s.length && s[k] !== " " && s[k] !== "	" && s[k] !== "#") k++;
      let v = s.slice(i, k);
      const m = /^\s*([+\-])\s*(\S+)/.exec(s.slice(k));
      if (m && /[a-z]/i.test(v) && !/=/.test(m[2])) {
        v += m[1] + m[2];
        k += m[0].length;
      }
      out.push({ kind: "kv", key: key.toLowerCase(), text: v });
      i = k;
      continue;
    }
    if (j === i) throw new Error(`"${s[i]}" can't stand on its own here (write key=value, like to=peak)`);
    out.push({ kind: "word", text: s.slice(i, j) });
    i = j;
  }
  return out;
}
function dur(s) {
  const m = /^([+\-]?\d*\.?\d+)\s*(ms|s)?$/.exec(s.trim());
  if (!m) throw new Error(`"${s}" is not a time (write it like 0.8s)`);
  return m[2] === "ms" ? +m[1] / 1e3 : +m[1];
}
var isDur = (s) => /^[+\-]?\d*\.?\d+(ms|s)?$/.test(s);
function parseWhen(t) {
  const w = t[0];
  if (!w) return { when: { kind: "then" }, used: 0, explicit: false };
  if (w.kind === "word") {
    const k = w.text.toLowerCase();
    if (k === "then") return { when: { kind: "then" }, used: 1, explicit: true };
    if (k === "with") return { when: { kind: "with" }, used: 1, explicit: true };
    if (/^\+/.test(k) && isDur(k)) return { when: { kind: "after", d: dur(k) }, used: 1, explicit: true };
    if (k === "at") {
      if (!t[1] || !isDur(t[1].text)) throw new Error('"at" needs a time, like: at 2.4s');
      return { when: { kind: "at", t: dur(t[1].text) }, used: 2, explicit: true };
    }
    if (k === "end" && t.length > 1) {
      if (t[1] && t[1].kind === "word" && /^[+\-]/.test(t[1].text) && isDur(t[1].text)) return { when: { kind: "end", d: dur(t[1].text) }, used: 2, explicit: true };
      return { when: { kind: "end", d: 0 }, used: 1, explicit: true };
    }
    if (k === "on") {
      if (!t[1] || t[1].kind !== "str") throw new Error('"on" needs the cue words in quotes, like: on "action potential"');
      if (t[2] && t[2].kind === "word" && /^[+\-]/.test(t[2].text) && isDur(t[2].text)) return { when: { kind: "on", words: t[1].text, d: dur(t[2].text) }, used: 3, explicit: true };
      return { when: { kind: "on", words: t[1].text, d: 0 }, used: 2, explicit: true };
    }
  }
  return { when: { kind: "then" }, used: 0, explicit: false };
}
function parseLine(n2, src) {
  const toks2 = tokenize(src);
  if (!toks2.length) return null;
  let bg = false;
  const last = toks2[toks2.length - 1];
  if (last.kind === "word" && last.text === "&") {
    bg = true;
    toks2.pop();
  } else if (last.kind === "word" && last.text.endsWith("&") && last.text.length > 1) {
    bg = true;
    last.text = last.text.slice(0, -1);
  }
  const { when, used, explicit } = parseWhen(toks2);
  let rest = toks2.slice(used);
  let repeat;
  if (rest[0]?.kind === "word" && rest[0].text.toLowerCase() === "repeat") {
    const k = Number(rest[1]?.text);
    if (!Number.isFinite(k) || k < 1) throw new Error('"repeat" needs a count, like: repeat 3 every=0.5s pulse dot');
    if (k > 200) throw new Error('"repeat" goes up to 200 times');
    const every = rest.find((x) => x.kind === "kv" && x.key === "every");
    repeat = { n: Math.round(k), every: every ? dur(every.text) : 0 };
    rest = rest.slice(2).filter((x) => x !== every);
  }
  let loop2;
  if (rest[0]?.kind === "word" && rest[0].text.toLowerCase() === "loop") {
    const every = rest.find((x) => x.kind === "kv" && x.key === "every");
    loop2 = { every: every ? dur(every.text) : 0 };
    rest = rest.slice(1).filter((x) => x !== every);
  }
  const verbTok = rest[0];
  if (!verbTok || verbTok.kind !== "word") throw new Error("what should happen? Start with a verb, like: grow, draw, to, add");
  let verb2 = verbTok.text.toLowerCase();
  let args = rest.slice(1);
  const second = args[0]?.kind === "word" ? args[0].text.toLowerCase() : "";
  if (verb2 === "pen" && (second === "loop" || second === "circle") || verb2 === "cross" && second === "out") {
    verb2 = `${verb2} ${second}`;
    args = args.slice(1);
  }
  const opts = {};
  const plain = [];
  for (const a of args) {
    if (a.kind === "kv") opts[a.key] = a.text;
    else plain.push(a);
  }
  return { n: n2, src, when, explicitWhen: explicit, verb: verb2, args: plain, opts, bg, repeat, loop: loop2 };
}
function parse(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out = { items: [], defines: {}, makes: {}, svgs: {}, images: {}, errors: [] };
  for (let i = 0; i < lines.length; i++) {
    const n2 = i + 1;
    const raw = lines[i];
    const s = raw.trim();
    if (!s || s.startsWith("#")) continue;
    try {
      const head = s.split(/\s+/)[0].toLowerCase();
      if (head === "beat") {
        const t = tokenize(s);
        if (!t[1] || t[1].kind !== "word") throw new Error('a beat needs its ID, like: beat S1-B2 "the narration"');
        const text2 = t.filter((x) => x.kind === "str").map((x) => x.text).join(" ");
        const kv = Object.fromEntries(t.filter((x) => x.kind === "kv").map((x) => [x.key, x.text]));
        for (const k of Object.keys(kv)) if (!["length", "extra"].includes(k)) throw new Error(`a beat takes length= (exactly this long) or extra= (time added after the words), not ${k}=`);
        const length = kv.length !== void 0 ? dur(kv.length) : void 0, extra = kv.extra !== void 0 ? dur(kv.extra) : void 0;
        if (length !== void 0 && (length <= 0 || length > 600)) throw new Error("length: between 0 and 600 seconds");
        out.items.push({ kind: "beat", beat: { n: n2, id: t[1].text, text: text2, length, extra } });
        continue;
      }
      if (head === "page") {
        const t = tokenize(s);
        const opts = {};
        for (const x of t.slice(1)) {
          if (x.kind === "kv") opts[x.key] = x.text;
          else if (x.kind === "word") opts.size = x.text;
        }
        out.items.push({ kind: "page", n: n2, opts });
        continue;
      }
      if (head === "let") {
        const m = /^let\s+([A-Za-z_][\w]*)\s*=\s*(.+)$/.exec(s.replace(/\s+#.*$/, ""));
        if (!m) throw new Error("write it like: let rest = -70");
        out.items.push({ kind: "let", n: n2, name: m[1], expr: m[2].trim() });
        continue;
      }
      if (head === "define") {
        const t = tokenize(s);
        const name = t[1]?.text?.toLowerCase();
        if (!name) throw new Error("a define needs a name, like: define cross ion pore");
        const body = [];
        let j = i + 1;
        for (; j < lines.length; j++) {
          const b = lines[j].trim();
          if (b.toLowerCase() === "end") break;
          if (b && !b.startsWith("#")) body.push({ n: j + 1, src: b });
        }
        if (j >= lines.length) throw new Error(`"define ${name}" has no "end" line`);
        out.defines[name] = { name, params: t.slice(2).map((x) => x.text), body };
        i = j;
        continue;
      }
      if (head === "make") {
        const t = tokenize(s);
        const name = t[1]?.text;
        if (!name || t[1].kind !== "word" || !/^[A-Za-z_][\w-]*$/.test(name)) throw new Error("a make needs a name, like: make heart squeeze=0");
        const params = {};
        for (const x of t.slice(2)) {
          if (x.kind === "kv") params[x.key] = x.text;
          else if (x.kind === "word") params[x.text.toLowerCase()] = "0";
        }
        const body = [];
        let j = i + 1;
        for (; j < lines.length; j++) {
          const b = lines[j].trim();
          if (/^end(\s+make)?$/i.test(b)) break;
          if (b && !b.startsWith("#")) body.push({ n: j + 1, src: b });
        }
        if (j >= lines.length) throw new Error(`"make ${name}" has no "end" line`);
        out.makes[name] = { name, n: n2, params, body };
        i = j;
        continue;
      }
      if (head === "svg") {
        const t = tokenize(s);
        const name = t[1]?.text;
        if (!name || !/^[A-Za-z_][\w-]*$/.test(name)) throw new Error("an svg needs a name, like: svg kidney");
        let j = i + 1;
        const body = [];
        for (; j < lines.length; j++) {
          if (/^\s*end\s+svg\s*$/i.test(lines[j])) break;
          body.push(lines[j]);
        }
        if (j >= lines.length) throw new Error(`"svg ${name}" has no "end svg" line`);
        out.svgs[name] = { n: n2, text: body.join("\n") };
        i = j;
        continue;
      }
      if (head === "image") {
        const t = tokenize(s);
        const name = t[1]?.text;
        if (!name || !/^[A-Za-z_][\w-]*$/.test(name)) throw new Error("an image needs a name, like: image bernstein w=600 h=800");
        const kv = Object.fromEntries(t.filter((x) => x.kind === "kv").map((x) => [x.key, Number(x.text)]));
        let j = i + 1;
        const body = [];
        for (; j < lines.length; j++) {
          if (/^\s*end\s+image\s*$/i.test(lines[j])) break;
          body.push(lines[j].trim());
        }
        if (j >= lines.length) throw new Error(`"image ${name}" has no "end image" line`);
        const data = body.join("");
        if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(data)) throw new Error(`image ${name}: the picture data is damaged (import it again)`);
        out.images[name] = { n: n2, w: kv.w > 0 ? kv.w : 400, h: kv.h > 0 ? kv.h : 400, data };
        i = j;
        continue;
      }
      if (head === "code") {
        let j = i + 1;
        const body = [];
        for (; j < lines.length; j++) {
          if (lines[j].trim().toLowerCase() === "end code") break;
          body.push(lines[j]);
        }
        if (j >= lines.length) throw new Error('"code" has no "end code" line');
        out.items.push({ kind: "code", n: n2, body: body.join("\n") });
        i = j;
        continue;
      }
      const l = parseLine(n2, s);
      if (l) out.items.push({ kind: "line", line: l });
    } catch (e) {
      out.errors.push({ line: n2, msg: e.message ?? String(e) });
    }
  }
  return out;
}

// src/mic/objects.ts
var import_react = __toESM(require("react"));

// src/paper/math.ts
var MATH_FONT = '"Latin Modern Roman", "Latin Modern Math"';
var NAMED = { red: P.pen, pen: P.pen, blue: P.volt, ink: P.ink, k: P.k, na: "#8A6D00", muted: P.muted };
function group(src, i) {
  if (src[i] !== "{") throw new Error(`tex: expected { at ${i} in "${src}"`);
  let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") d++;
    else if (src[j] === "}" && --d === 0) return [src.slice(i + 1, j), j + 1];
  }
  throw new Error(`tex: unbalanced braces in "${src}"`);
}
function parse2(src, it = false) {
  const out = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ t: "txt", s: buf, it });
    buf = "";
  };
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("\\frac", i)) {
      flush();
      const [a, j] = group(src, i + 5);
      const [b, k] = group(src, j);
      out.push({ t: "frac", a: parse2(a, it), b: parse2(b, it) });
      i = k;
    } else if (src.startsWith("\\it", i)) {
      flush();
      const [a, j] = group(src, i + 3);
      out.push(...parse2(a, true));
      i = j;
    } else if (src.startsWith("\\hl", i)) {
      flush();
      const [a, j] = group(src, i + 3);
      out.push({ t: "hl", a: parse2(a, it) });
      i = j;
    } else if (src.startsWith("\\color", i)) {
      flush();
      const [c, j] = group(src, i + 6);
      const [a, k] = group(src, j);
      out.push({ t: "col", c: NAMED[c.trim().toLowerCase()] ?? c.trim(), a: parse2(a, it) });
      i = k;
    } else if (src.startsWith("\\log", i)) {
      buf += "log";
      i += 4;
    } else if (src.startsWith("\\quad", i)) {
      buf += "\u2003";
      i += 5;
    } else if (src.startsWith("\\,", i)) {
      buf += "\u2009";
      i += 2;
    } else if (src[i] === "_" || src[i] === "^") {
      flush();
      const kind = src[i] === "_" ? "sub" : "sup";
      const [a, j] = group(src, i + 1);
      out.push({ t: kind, a: parse2(a, it) });
      i = j;
    } else {
      buf += src[i];
      i++;
    }
  }
  flush();
  return out;
}
var REL = /* @__PURE__ */ new Set(["=", "\u2248", "\u2264", "\u2265", "\u2192", "<", ">"]);
var BIN = /* @__PURE__ */ new Set(["+", "\u2212", "\xD7", "\xF7", "\xB7"]);
function atoms(s, afterOrd) {
  const out = [];
  let buf = "";
  let gap = 0;
  const push = (t, kind) => {
    out.push({ t, kind, gapBefore: gap });
    gap = 0;
  };
  for (const ch of s) {
    if (ch === " " || ch === "\u2009" || ch === "\u2003") {
      if (buf) push(buf, "ord");
      buf = "";
      gap += ch === "\u2003" ? 1 : ch === "\u2009" ? 0.17 : 0.25;
    } else if (REL.has(ch) || BIN.has(ch)) {
      if (buf) push(buf, "ord");
      buf = "";
      const unary = BIN.has(ch) && (out.length === 0 ? !afterOrd : out[out.length - 1].kind !== "ord");
      push(ch, REL.has(ch) ? "rel" : unary ? "ord" : "bin");
    } else buf += ch;
  }
  if (buf) push(buf, "ord");
  return out;
}
function render(toks2, size, color2, script = false) {
  const items = [];
  let afterOrd = false;
  for (const k of toks2) {
    if (k.t === "txt") {
      const as = atoms(k.s, afterOrd);
      if (as.length) afterOrd = as[as.length - 1].kind === "ord";
      for (const a of as) {
        const pad = script ? 0 : a.kind === "rel" ? 0.28 : a.kind === "bin" ? 0.22 : 0;
        const italic = k.it && a.kind === "ord";
        items.push(textItem(a.t, { size, fill: color2, family: MATH_FONT, italic, weight: 400 }, { ml: (pad + a.gapBefore) * size, mr: (pad + (italic ? 0.08 : 0)) * size }));
      }
    } else if (k.t === "sub" || k.t === "sup") {
      afterOrd = true;
      items.push(row(render(k.a, Math.round(size * 0.7), color2, true), { align: "end" }, { mb: k.t === "sub" ? -size * 0.24 : size * 0.42, ml: 1 }));
    } else if (k.t === "col") {
      items.push(...render(k.a, size, k.c, script));
      afterOrd = true;
    } else if (k.t === "hl") {
      afterOrd = true;
      const inner = row(render(k.a, size, color2, script), { align: "end" });
      items.push({
        w: inner.w + 8,
        h: inner.h,
        ml: 1,
        mr: 1,
        draw: (h, cx, cy) => g(h, {}, g(h, { op: 0.6 }, rect(h, cx, cy + size * 0.05, inner.w + 12, Math.min(inner.h, size * 1.15), { fill: P.hl, r: 3 })), inner.draw(h, cx, cy))
      });
    } else if (k.t === "frac") {
      afterOrd = true;
      const s = Math.round(size * 0.9);
      const bar = Math.max(1.5, size / 22);
      const gap = 3;
      const hang = (t) => t.some((x) => x.t === "sub") ? s * 0.24 : 0;
      items.push(column([
        row(render(k.a, s, color2), { align: "end", pad: [0, 0, hang(k.a), 0] }, { ml: 3, mr: 3 }),
        boxItem(0, bar, color2, { stretch: true }),
        row(render(k.b, s, color2), { align: "end", pad: [0, 0, hang(k.b), 0] }, { ml: 3, mr: 3 })
      ], { gap }, { ml: 4, mr: 4, mb: 0.6 * size - (s * 1.25 + gap + bar / 2) }));
    }
  }
  return items;
}
function tex(src, o = {}) {
  const size = o.size ?? 34;
  const toks2 = parse2(src);
  const s = Math.round(size * 0.9);
  const fracDrop = s * 1.25 + 3 + Math.max(1.5, size / 22) / 2 - 0.6 * size;
  const drop = toks2.some((k) => k.t === "frac") ? fracDrop : toks2.some((k) => k.t === "sub") ? size * 0.24 : 0;
  return row(render(toks2, size, o.color ?? P.ink), { align: "end", pad: [0, 0, drop, 0] });
}

// src/v1r/parts.ts
var MEM = { y: 60, h: 84, x0: -1400, x1: 1400 };
function membraneEl(h, o = {}) {
  const top = MEM.y - MEM.h / 2, bot = MEM.y + MEM.h / 2;
  const X1 = o.x1 ?? MEM.x1;
  const gaps = o.gapAt ?? [];
  const gw = o.gapW ?? 0;
  const inGap = (x) => gaps.some((c) => Math.abs(x - c) < gw / 2);
  const R = 8.5, STEP = 21;
  const heads = [], tails = [];
  for (let x = MEM.x0 + STEP / 2; x < X1 - R; x += STEP) {
    if (inGap(x)) continue;
    for (const [y0, dir2] of [[top + R + 1, 1], [bot - R - 1, -1]]) {
      const y1 = y0 + dir2 * (R + 2), y2 = MEM.y - dir2 * 3;
      tails.push(line(h, [[x - 3, y1], [x - 4.5, (y1 + y2) / 2], [x - 2.5, y2]], { stroke: rgbaHex(P.ink, 0.45), w: 1.6, cap: "round", join: "round" }));
      tails.push(line(h, [[x + 3, y1], [x + 1.5, (y1 + y2) / 2], [x + 3.5, y2]], { stroke: rgbaHex(P.ink, 0.45), w: 1.6, cap: "round", join: "round" }));
      heads.push(circle(h, x, y0, 2 * R, 2 * R, { fill: P.mem, stroke: rgbaHex(P.ink, 0.75), lw: 1.4 }));
    }
  }
  return g(
    h,
    {},
    rect(h, (MEM.x0 + X1) / 2, MEM.y, X1 - MEM.x0, MEM.h - 2 * R, { fill: rgbaHex(P.mem, 0.08) }),
    tails,
    heads
  );
}
var ionSeed = 0;
function makeIon(kind, x, y, op = 0) {
  const n2 = node({ x, y, op });
  const r = kind === "an" ? 34 : 25;
  const ph = ionSeed++ * 2.399 % (Math.PI * 2), fq = 0.55 + ionSeed * 0.37 % 0.35;
  const jig = () => [2.6 * Math.sin(now() * fq * 2 * Math.PI + ph), 2.6 * Math.cos(now() * fq * 1.6 * Math.PI + ph * 1.7)];
  const ball2 = (h, fill, label, lc, size) => {
    const [dx, dy] = jig();
    return n2.g(h, g(
      h,
      { x: dx, y: dy },
      circle(h, 0, 0, 2 * r, 2 * r, { fill, stroke: P.ink, lw: 2.5 }),
      circle(h, -r * 0.34, -r * 0.36, r * 0.62, r * 0.48, { fill: "rgba(255,255,255,0.28)", rot: -30 }),
      text(h, label, 0, 1, { size, weight: 800, fill: lc, family: SANS })
    ));
  };
  const el = (h) => {
    if (kind === "na") return ball2(h, P.na, "Na\u207A", P.ink, 17);
    if (kind === "k") return ball2(h, P.k, "K\u207A", "#FFFFFF", 18);
    if (kind === "cl") return ball2(h, "#9DB89A", "Cl\u207B", P.ink, 17);
    return ball2(h, P.an, "\u2212", P.ink, 30);
  };
  const along = (pts2, d = 0.7) => chain(...pts2.map((p) => n2.to(p, d, easeInOutCubic)));
  return { node: n2, el, along, kind };
}
function neuronEl(h) {
  const ink3 = { stroke: P.ink, w: 3, cap: "round", join: "round" };
  const den = [
    [[-70, -40], [-170, -120], [-230, -130]],
    [[-170, -120], [-190, -190]],
    [[-80, 20], [-200, 50], [-260, 20]],
    [[-200, 50], [-240, 110]],
    [[-30, -80], [-40, -190], [-90, -250]],
    [[-40, -190], [10, -240]],
    [[-40, 75], [-90, 170], [-60, 230]],
    [[30, -80], [70, -170], [130, -200]]
  ];
  const axon = [[85, 10], [220, 20], [420, 10], [600, 30]];
  const term = [[[600, 30], [660, -20]], [[600, 30], [670, 40]], [[600, 30], [640, 95]]];
  return g(
    h,
    {},
    den.map((p) => line(h, p, { ...ink3, stroke: P.ink, w: 9 })),
    den.map((p) => line(h, p, { ...ink3, stroke: rgbaHex(P.mem, 0.35), w: 4 })),
    line(h, axon, { ...ink3, w: 14 }),
    line(h, axon, { ...ink3, stroke: "#D7E8E4", w: 8 }),
    term.map((p) => line(h, p, { ...ink3, w: 8 })),
    term.map((p) => circle(h, p[1][0], p[1][1], 22, 22, { fill: "#D7E8E4", stroke: P.ink, lw: 3 })),
    circle(h, 0, 0, 190, 170, { fill: "#D7E8E4", stroke: P.ink, lw: 3.5 }),
    circle(h, -10, 4, 64, 58, { fill: rgbaHex(P.mem, 0.35), stroke: rgbaHex(P.ink, 0.6), lw: 2 })
  );
}

// src/video1/shapes.ts
function pathPoints(d, perCurve = 16) {
  const toks2 = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const out = [];
  let i = 0;
  let cmd = "";
  let cur = [0, 0];
  const num2 = () => parseFloat(toks2[i++]);
  while (i < toks2.length) {
    if (/[MLCZ]/.test(toks2[i])) cmd = toks2[i++];
    if (cmd === "M") {
      cur = [num2(), num2()];
      out.push(cur);
      cmd = "L";
    } else if (cmd === "L") {
      cur = [num2(), num2()];
      out.push(cur);
    } else if (cmd === "C") {
      const p1 = [num2(), num2()];
      const p2 = [num2(), num2()];
      const p3 = [num2(), num2()];
      for (let k = 1; k <= perCurve; k++) {
        const t = k / perCurve;
        const u = 1 - t;
        out.push([
          u * u * u * cur[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * cur[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
        ]);
      }
      cur = p3;
    } else if (cmd === "Z") {
      i += 0;
      break;
    }
  }
  return out;
}
function smooth(pts2, per = 14) {
  const out = [];
  for (let j = 0; j < pts2.length - 1; j++) {
    const p0 = pts2[Math.max(j - 1, 0)];
    const p1 = pts2[j];
    const p2 = pts2[j + 1];
    const p3 = pts2[Math.min(j + 2, pts2.length - 1)];
    const last = j === pts2.length - 2;
    for (let k = 0; k < (last ? per + 1 : per); k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((a) => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3)));
    }
  }
  return out;
}
var SQUID = {
  fins: "M 196 -30 C 236 -104 300 -96 334 0 C 300 96 236 104 196 30 Z",
  mantle: "M -40 -54 C 60 -64 210 -50 336 0 C 210 50 60 64 -40 54 C -54 30 -54 -30 -40 -54 Z",
  head: "M -38 -46 C -72 -52 -114 -40 -122 0 C -114 40 -72 52 -38 46 Z",
  eye: [-84, -14, 12],
  arms: [{ "w": 9, "pts": [[-116, -26], [-170, -46], [-226, -40], [-262, -54]] }, { "w": 9, "pts": [[-118, -16], [-176, -24], [-236, -12], [-276, -22]] }, { "w": 9, "pts": [[-120, -6], [-180, -6], [-240, 6], [-284, -2]] }, { "w": 9, "pts": [[-120, 6], [-180, 12], [-236, 26], [-280, 22]] }, { "w": 9, "pts": [[-118, 16], [-172, 30], [-226, 46], [-264, 44]] }, { "w": 9, "pts": [[-116, 26], [-164, 46], [-212, 62], [-246, 70]] }, { "w": 6, "pts": [[-120, -2], [-200, -18], [-290, -40], [-352, -52]] }, { "w": 6, "pts": [[-120, 4], [-204, 28], [-292, 56], [-356, 64]] }],
  clubs: [[-360, -54, 16, 9, -12], [-364, 66, 16, 9, 12]],
  axon: [[-50, 10], [40, 12], [140, 10], [240, 6], [300, 2]]
};

// src/v1r/parts2.ts
var PROTEIN_FILL = "#B9C9D6";
function arrow(h, a, b, color2, end = 1, w = 5, head = 16) {
  if (end <= 1e-3) return null;
  const x = a[0] + (b[0] - a[0]) * end, y = a[1] + (b[1] - a[1]) * end;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const hx = (s) => x - head * Math.cos(ang + s), hy = (s) => y - head * Math.sin(ang + s);
  return g(
    h,
    {},
    line(h, [a, [x, y]], { stroke: color2, w, cap: "round" }),
    line(h, [[hx(0.5), hy(0.5)], [x, y], [hx(-0.5), hy(-0.5)]], { stroke: color2, w, cap: "round", join: "round" })
  );
}
var SQ = { body: "#C9C2B6", fin: "#D8D2C7" };
var SQ_MANTLE = pathPoints(SQUID.mantle);
var SQ_FINS = pathPoints(SQUID.fins);
var SQ_HEAD = pathPoints(SQUID.head);
var SQ_ARMS = SQUID.arms.map((a) => ({ w: a.w, p: smooth(a.pts) }));
var SQ_AXON = smooth(SQUID.axon);
var SQUID_SCALE = 1.15;
function squidEl(h, axonGlow) {
  const [ex, ey, er] = SQUID.eye;
  return g(
    h,
    { s: SQUID_SCALE },
    g(
      h,
      { x: -118, rot: 1.6 * Math.sin(2 * Math.PI * 0.22 * now()) },
      g(
        h,
        { x: 118 },
        SQ_ARMS.map((a) => line(h, a.p, { stroke: P.ink, w: a.w + 3, cap: "round", join: "round" })),
        SQ_ARMS.map((a) => line(h, a.p, { stroke: SQ.body, w: a.w - 1, cap: "round", join: "round" })),
        SQUID.clubs.map(([x, y, w, hh, r]) => circle(h, x, y, 2 * w, 2 * hh, { fill: SQ.body, stroke: P.ink, lw: 2, rot: r }))
      )
    ),
    line(h, SQ_FINS, { closed: true, fill: SQ.fin, stroke: P.ink, w: 2.5 }),
    line(h, SQ_MANTLE, { closed: true, fill: SQ.body, stroke: P.ink, w: 2.5 }),
    line(h, SQ_HEAD, { closed: true, fill: SQ.body, stroke: P.ink, w: 2.5 }),
    circle(h, ex, ey, 2 * er, 2 * er, { fill: P.ink }),
    circle(h, ex + 2, ey - 1, er, er, { fill: "#FFFFFF" }),
    line(h, SQ_AXON, { stroke: rgbaHex(P.mem, 0.2 + 0.25 * axonGlow), w: 12 + 6 * axonGlow, cap: "round" }),
    line(h, SQ_AXON, { stroke: rgbaHex(P.mem, 0.45 + 0.55 * axonGlow), w: 5, cap: "round" })
  );
}
function fibreEl(h, w = 900, d = 170) {
  return g(
    h,
    {},
    rect(h, 0, 0, w, d, { fill: "#D7E8E4", stroke: P.ink, lw: 3 }),
    circle(h, w / 2, 0, 60, d, { fill: "#C7DDD8", stroke: P.ink, lw: 3 }),
    circle(h, -w / 2, 0, 60, d, { fill: "#D7E8E4", stroke: P.ink, lw: 3 })
  );
}
function myocyteEl(h) {
  const W_ = 260, H_ = 84;
  return g(
    h,
    {},
    rect(h, 0, 0, W_, H_, { r: H_ / 2, fill: rgbaHex(P.mem, 0.14), stroke: P.ink, lw: 3 }),
    Array.from({ length: 9 }, (_, i) => line(h, [[-96 + i * 24, -H_ / 2 + 10], [-96 + i * 24, H_ / 2 - 10]], { stroke: rgbaHex(P.mem, 0.35), w: 2 })),
    circle(h, -30, 4, 58, 28, { fill: rgbaHex(P.mem, 0.32), stroke: rgbaHex(P.mem, 0.75), lw: 2 })
  );
}
function rbcEl(h) {
  return g(
    h,
    {},
    circle(h, 0, 0, 110, 110, { fill: "#D9726A", stroke: P.ink, lw: 3 }),
    circle(h, 0, 0, 50, 50, { fill: "#C45E57" })
  );
}

// src/v2/channels.ts
function navChan(h, x, open, lid = 0, lidOp = 1, glow = 0) {
  const y = MEM.y, d = 22 + 14 * open;
  const conduct = open * (1 - lid);
  const ang = -25 + 115 * lid;
  return g(
    h,
    { x },
    glow > 1e-3 ? circle(h, 0, y, 130, 130, { fill: rgbaHex(P.na, 0.22 * glow) }) : null,
    rect(h, 0, y, 2 * d - 12, MEM.h + 20, { fill: rgbaHex(P.na, 0.12 + 0.4 * conduct) }),
    rect(h, -d, y, 28, MEM.h + 50, { r: 12, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h, d, y, 28, MEM.h + 50, { r: 12, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    g(h, { x: -d - 26, y: y - 6, rot: -35 + 55 * open }, line(h, [[0, 0], [0, -34]], { stroke: P.ink, w: 4, cap: "round" }), circle(h, 0, -38, 14, 14, { fill: P.na, stroke: P.ink, lw: 2 })),
    lidOp > 1e-3 ? g(
      h,
      { op: lidOp, x: d, y: y + MEM.h / 2 + 22, rot: ang },
      line(h, [[0, 0], [0, 34]], { stroke: P.ink, w: 4, cap: "round" }),
      circle(h, 0, 44, 30, 30, { fill: "#9DB0C2", stroke: P.ink, lw: 3 })
    ) : null
  );
}
function kvChan(h, x, open) {
  const y = MEM.y, d = 26 + 18 * open;
  return g(
    h,
    { x },
    rect(h, 0, y, 2 * d - 14, MEM.h + 20, { fill: rgbaHex(P.k, 0.1 + 0.4 * open) }),
    rect(h, -d, y, 34, MEM.h + 54, { r: 14, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h, d, y, 34, MEM.h + 54, { r: 14, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h, -d, y - MEM.h / 2 - 14, 34, 10, { fill: P.k }),
    rect(h, d, y - MEM.h / 2 - 14, 34, 10, { fill: P.k })
  );
}
function leakChan(h, x) {
  const y = MEM.y;
  return g(
    h,
    { x },
    rect(h, 0, y, 16, MEM.h + 10, { fill: rgbaHex(P.k, 0.25) }),
    rect(h, -17, y, 18, MEM.h + 26, { r: 8, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 }),
    rect(h, 17, y, 18, MEM.h + 26, { r: 8, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 })
  );
}

// src/v2/trace.ts
function monotone(pts2) {
  const n2 = pts2.length, xs = pts2.map((p) => p[0]), ys = pts2.map((p) => p[1]);
  const d = xs.slice(1).map((x, i) => (ys[i + 1] - ys[i]) / (x - xs[i]));
  const m = xs.map((_, i) => i === 0 ? d[0] : i === n2 - 1 ? d[n2 - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  for (let i = 0; i < n2 - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n2 - 1]) return ys[n2 - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const hh = xs[i + 1] - xs[i], t = (x - xs[i]) / hh, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * hh * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * hh * m[i + 1];
  };
}
var TT = { foot: 2, threshold: 3, peak: 3.5, zeroUp: 3.27, zeroDown: 4, rest: 4.6, dip: 5.3, end: 10 };
var MODEL = monotone([
  [0, -70],
  [2, -70],
  [2.6, -66],
  [3, -55],
  [3.2, -22],
  [3.34, 28],
  [3.5, 54],
  [3.64, 46],
  [4, 0],
  [4.38, -50],
  [4.75, -77],
  [5.3, -84],
  [6.5, -77.5],
  [8, -72],
  [10, -70]
]);
var BERNSTEIN = monotone([
  [0, -70],
  [2, -70],
  [2.6, -66],
  [3, -55],
  [3.3, -12],
  [3.5, 0],
  [4.1, 0],
  [4.7, -62],
  [5.2, -70],
  [10, -70]
]);
var SQUID2 = (t) => -45 + (MODEL(t) + 70) * (85 / 124);
var SQUID_BERNSTEIN = (t) => -45 + (BERNSTEIN(t) + 70) * (45 / 70);
var PLOT = { x0: -700, kx: 140, y0: -70, ky: 4 };
var X = (t) => PLOT.x0 + t * PLOT.kx;
var Y = (mv) => PLOT.y0 - mv * PLOT.ky;
function makeTrace(o = {}) {
  const wave = o.wave ?? MODEL;
  const ghostWave = o.ghost ?? BERNSTEIN;
  const color2 = o.color ?? P.volt;
  const n2 = node({ x: o.x ?? 0, y: o.y ?? 0, op: 0 });
  const drawTo = sig(0), op = sig(1), peakK = sig(1), naTint = sig(0), kTint = sig(0);
  const axisOp = sig(0), zeroOp = sig(0), tipOp = sig(0);
  const ghostTo = sig(0), ghostOp = sig(0);
  const ticks = [];
  const v = (t) => {
    const raw = wave(t);
    const k = peakK();
    return raw > -55 && t > 2.9 && t < 4.6 ? -55 + (raw + 55) * k : raw;
  };
  const sample = (f3, t0, t1, dt = 0.02) => {
    const out = [];
    for (let t = t0; t < t1; t += dt) out.push([X(t), Y(f3(t))]);
    out.push([X(t1), Y(f3(t1))]);
    return out;
  };
  const tick = (mv, label, c = P.muted) => {
    const s = sig(0);
    ticks.push({ t: { mv, label, color: c }, op: s });
    return { show: (run = T.in) => s.to(1, run, easeOutCubic), hide: (run = T.out) => s.to(0, run), op: s };
  };
  const tip = () => [X(drawTo()), Y(v(drawTo()))];
  const el = (h, ...extra) => {
    const end = drawTo();
    const AX = PLOT.x0 - 40;
    return n2.g(
      h,
      axisOp() > 1e-3 ? g(
        h,
        { op: axisOp() },
        line(h, [[AX, Y(80)], [AX, Y(-100)]], { stroke: P.ink, w: 3, cap: "round" }),
        ticks.map(({ t, op: s }) => s() > 1e-3 ? g(
          h,
          { op: s() },
          line(h, [[AX - 12, Y(t.mv)], [AX + 12, Y(t.mv)]], { stroke: t.color === P.muted ? P.ink : t.color, w: 3 }),
          text(h, t.label, AX - 22, Y(t.mv), { size: FSZ.label, weight: 700, fill: t.color, family: SANS, align: "r" })
        ) : null)
      ) : null,
      zeroOp() > 1e-3 ? dashed(h, X(-0.1), X(10), Y(0), rgbaHex(P.ink, 0.55 * zeroOp())) : null,
      ghostOp() > 1e-3 && ghostTo() > 0.01 ? line(h, sample(ghostWave, 0, ghostTo()), { stroke: rgbaHex(P.muted, 0.85), w: 6, cap: "round", join: "round", op: ghostOp() }) : null,
      end > 0.01 ? g(
        h,
        { op: op() },
        line(h, sample(v, 0, end), { stroke: color2, w: 7, cap: "round", join: "round" }),
        naTint() > 1e-3 && end > TT.threshold ? line(h, sample(v, TT.threshold, Math.min(end, TT.peak)), { stroke: P.na, w: 8, cap: "round", join: "round", op: naTint() }) : null,
        kTint() > 1e-3 && end > TT.peak ? line(h, sample(v, TT.peak, Math.min(end, TT.rest)), { stroke: P.k, w: 8, cap: "round", join: "round", op: kTint() }) : null,
        tipOp() > 1e-3 ? circle(h, X(end), Y(v(end)), 20, 20, { fill: rgbaHex(color2, 0.25 * tipOp()) }) : null
      ) : null,
      ...extra
    );
  };
  const drawOn = (t, d, e = linear) => drawTo.to(t, d, e);
  return {
    node: n2,
    drawTo,
    op,
    peakK,
    naTint,
    kTint,
    axisOp,
    zeroOp,
    tipOp,
    ghostTo,
    ghostOp,
    v,
    tip,
    tick,
    el,
    drawOn,
    showAxes: (run = T.in) => (s) => Math.max(axisOp.to(1, run, easeOutCubic)(s), zeroOp.to(1, run, easeOutCubic)(s)),
    showNode: (run = T.in) => n2.op.to(1, run, easeOutCubic)
  };
}
function dashed(h, x0, x1, y, stroke, w = 2.5, dash = "18 12") {
  return h("line", { x1: x0, y1: y, x2: x1, y2: y, stroke, strokeWidth: w, strokeDasharray: dash, strokeLinecap: "round" });
}

// src/v2/parts.ts
function loopArrowEl(h, r, color2, w = 6) {
  const a1 = Math.PI * 1.6;
  const arc = Array.from({ length: 30 }, (_, i) => {
    const a = i / 29 * a1;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  const tip = [r * Math.cos(a1 + 0.32), r * Math.sin(a1 + 0.32)];
  const tx = -Math.sin(a1 + 0.32), ty = Math.cos(a1 + 0.32);
  const nx = Math.cos(a1 + 0.32), ny = Math.sin(a1 + 0.32);
  const L = 22, Wd = 13;
  const base = [tip[0] - tx * L, tip[1] - ty * L];
  return g(
    h,
    {},
    line(h, arc, { stroke: color2, w, cap: "round" }),
    line(h, [tip, [base[0] + nx * Wd, base[1] + ny * Wd], [base[0] - nx * Wd, base[1] - ny * Wd]], { closed: true, fill: color2, stroke: color2, w: 2, join: "round" })
  );
}

// tools/assets/registry.ts
var EXTRA = {
  protein: PROTEIN_FILL,
  // #B9C9D6 proteins
  proteinLine: "#E3EAF0",
  lid: "#9DB0C2",
  // inactivation lid / ball
  cl: "#9DB89A",
  // Cl⁻
  ca: "#5E8FB0",
  // Ca²⁺ (steel blue; added 20 Nov 2026)
  ligand: "#6E9F5E",
  // neurotransmitter / ligand dots
  receptorGreen: "#CFE0C9",
  drug: "#D9C3EA",
  // generic drug molecule (lilac)
  blood: "#D9726A",
  cyto: "#D7E8E4",
  // cytoplasm / axoplasm
  wood: "#C9A27A"
};
var ink2 = (w = 3) => ({ stroke: P.ink, w, cap: "round", join: "round" });
var ion = (kind) => (h) => makeIon(kind, 0, 0, 1).el(h);
function ball(h, fill, label, lc, r = 25, size = 17) {
  return g(
    h,
    {},
    circle(h, 0, 0, 2 * r, 2 * r, { fill, stroke: P.ink, lw: 2.5 }),
    circle(h, -r * 0.34, -r * 0.36, r * 0.62, r * 0.48, { fill: "rgba(255,255,255,0.28)", rot: -30 }),
    text(h, label, 0, 1, { size, weight: 800, fill: lc, family: SANS })
  );
}
function strip(h, w = 360) {
  return g(h, { x: -MEM.x0 - w / 2, y: -MEM.y }, membraneEl(h, { x1: MEM.x0 + w }));
}
var onStrip = (w, thing) => (h) => g(h, {}, strip(h, w), g(h, { y: -MEM.y }, thing(h)));
function penLoopPts(rx, ry) {
  const out = [];
  for (let i = 0; i <= 64; i++) {
    const a = -2.3 + i / 64 * (Math.PI * 2 + 0.5);
    out.push([rx * Math.cos(a) * (1 + 0.03 * Math.sin(3 * a)), ry * Math.sin(a) * (1 + 0.05 * Math.cos(2 * a))]);
  }
  return out;
}
var tracePts = (f3, t0, t1, kx = 140, ky = 4) => {
  const out = [];
  for (let t = t0; t <= t1 + 1e-9; t += 0.02) out.push([(t - (t0 + t1) / 2) * kx, -f3(t) * ky]);
  return out;
};
var traceAsset = (f3, t0, t1, color2, w = 7) => (h) => {
  const pts2 = tracePts(f3, t0, t1);
  const mid = (Math.max(...pts2.map((p) => p[1])) + Math.min(...pts2.map((p) => p[1]))) / 2;
  return g(h, { y: -mid }, line(h, pts2, { stroke: color2, w, cap: "round", join: "round" }));
};
var traceBox = (f3, t0, t1, pad = 12) => {
  const pts2 = tracePts(f3, t0, t1);
  const ys = pts2.map((p) => p[1]), hgt = Math.max(...ys) - Math.min(...ys);
  const w = (t1 - t0) * 140;
  return [-w / 2 - pad, -hgt / 2 - pad, w + 2 * pad, hgt + 2 * pad];
};
function gpcr(h, bound = false) {
  const xs = [-108, -72, -36, 0, 36, 72, 108];
  const top = MEM.y - MEM.h / 2 - 26, bot = MEM.y + MEM.h / 2 + 26;
  const loops = [];
  xs.forEach((x, i) => {
    loops.push([x, i % 2 ? bot : top], [x, i % 2 ? top : bot]);
  });
  return g(
    h,
    {},
    line(h, [[-150, top - 50], [-108, top]], { ...ink2(5), stroke: P.ink }),
    xs.map((x) => rect(h, x, MEM.y, 30, MEM.h + 52, { r: 13, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 })),
    xs.slice(0, -1).map((x, i) => i % 2 ? line(h, [[x, top - 2], [x + 18, top - 22], [x + 36, top - 2]], { ...ink2(4) }) : line(h, [[x, bot + 2], [x + 18, bot + 22], [x + 36, bot + 2]], { ...ink2(4) })),
    line(h, [[108, bot], [130, bot + 40], [170, bot + 46]], { ...ink2(5) }),
    // the G protein below (α, β, γ)
    circle(h, 40, bot + 84, 92, 64, { fill: "#C9D8C3", stroke: P.ink, lw: 2.5 }),
    circle(h, 112, bot + 92, 60, 50, { fill: "#DCE6D6", stroke: P.ink, lw: 2.5 }),
    circle(h, 150, bot + 64, 34, 30, { fill: "#E8EEE4", stroke: P.ink, lw: 2.5 }),
    text(h, "\u03B1", 40, bot + 84, { size: 24, weight: 800, fill: P.ink, family: SANS }),
    text(h, "\u03B2", 112, bot + 92, { size: 22, weight: 800, fill: P.ink, family: SANS }),
    text(h, "\u03B3", 150, bot + 64, { size: 18, weight: 800, fill: P.ink, family: SANS }),
    bound ? circle(h, -36, top - 30, 30, 30, { fill: EXTRA.ligand, stroke: P.ink, lw: 2 }) : null
  );
}
function rtk(h, active = false) {
  const d = active ? 22 : 60;
  const sub = (sx) => g(
    h,
    { x: sx * d },
    circle(h, 0, MEM.y - 120, 70, 90, { fill: EXTRA.receptorGreen, stroke: P.ink, lw: 2.5 }),
    rect(h, 0, MEM.y, 18, MEM.h + 20, { r: 8, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 }),
    rect(h, 0, MEM.y + 110, 46, 110, { r: 18, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 }),
    active ? circle(h, sx * -30, MEM.y + 90, 26, 26, { fill: P.na, stroke: P.ink, lw: 2 }) : null,
    active ? text(h, "P", sx * -30, MEM.y + 90, { size: 16, weight: 800, fill: P.ink, family: SANS }) : null
  );
  return g(h, {}, sub(-1), sub(1), active ? circle(h, 0, MEM.y - 200, 34, 34, { fill: EXTRA.ligand, stroke: P.ink, lw: 2 }) : null);
}
function carrier(h, openOut, accent) {
  const c = openOut;
  const top = 6 + 30 * c, bot = 36 - 30 * c, mid = 26, HALF = 70;
  const half = (sx) => line(h, [[sx * top, -HALF], [sx * mid, 0], [sx * bot, HALF], [sx * 82, HALF], [sx * 96, HALF - 30], [sx * 96, -HALF + 30], [sx * 82, -HALF]], { closed: true, fill: PROTEIN_FILL, stroke: P.ink, w: 3, join: "round" });
  return g(h, { y: MEM.y }, rect(h, 0, 0, 200, MEM.h + 4, { fill: P.paper }), rect(h, 0, 0, 200, MEM.h + 4, { fill: rgbaHex(P.mem, 0.08) }), half(-1), half(1), rect(h, 0, -HALF - 6, 120, 8, { r: 4, fill: accent }));
}
function caChan(h, open) {
  const y = MEM.y, d = 20 + 14 * open;
  return g(
    h,
    {},
    rect(h, 0, y, 2 * d - 12, MEM.h + 20, { fill: rgbaHex(EXTRA.ca, 0.12 + 0.4 * open) }),
    rect(h, -d, y, 28, MEM.h + 50, { r: 12, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h, d, y, 28, MEM.h + 50, { r: 12, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h, -d, y - MEM.h / 2 - 14, 28, 10, { fill: EXTRA.ca }),
    rect(h, d, y - MEM.h / 2 - 14, 28, 10, { fill: EXTRA.ca })
  );
}
function ligandGated(h, open) {
  const y = MEM.y, d = 20 + 12 * open;
  return g(
    h,
    {},
    rect(h, 0, y, 2 * d - 12, MEM.h + 20, { fill: rgbaHex(P.volt, 0.08 + 0.25 * open) }),
    rect(h, -d, y - 8, 26, MEM.h + 64, { r: 10, fill: EXTRA.receptorGreen, stroke: P.ink, lw: 3 }),
    rect(h, d, y - 8, 26, MEM.h + 64, { r: 10, fill: EXTRA.receptorGreen, stroke: P.ink, lw: 3 }),
    line(h, [[-d - 14, y - MEM.h / 2 - 38], [-d + 2, y - MEM.h / 2 - 18], [d - 2, y - MEM.h / 2 - 18], [d + 14, y - MEM.h / 2 - 38]], ink2(3)),
    open > 0.5 ? circle(h, 0, y - MEM.h / 2 - 32, 24, 24, { fill: EXTRA.ligand, stroke: P.ink, lw: 2 }) : null
  );
}
function vesicle(h, n2 = 6) {
  return g(
    h,
    {},
    circle(h, 0, 0, 120, 120, { fill: "#F2F6F1", stroke: P.mem, lw: 6 }),
    circle(h, 0, 0, 104, 104, { fill: "none", stroke: rgbaHex(P.mem, 0.5), lw: 2 }),
    Array.from({ length: n2 }, (_, i) => {
      const a = i / n2 * Math.PI * 2;
      return circle(h, 24 * Math.cos(a), 24 * Math.sin(a), 18, 18, { fill: EXTRA.ligand, stroke: P.ink, lw: 1.5 });
    })
  );
}
function synapse(h) {
  return g(
    h,
    {},
    rect(h, 0, -230, 90, 120, { fill: EXTRA.cyto, stroke: P.ink, lw: 3.5 }),
    circle(h, 0, -60, 340, 260, { fill: EXTRA.cyto, stroke: P.ink, lw: 3.5 }),
    rect(h, 0, -176, 84, 30, { fill: EXTRA.cyto }),
    g(h, { x: -70, y: -70, s: 0.42 }, vesicle(h)),
    g(h, { x: 60, y: -90, s: 0.42 }, vesicle(h)),
    g(h, { x: -5, y: -10, s: 0.42 }, vesicle(h)),
    [-70, -25, 20, 70].map((x, i) => circle(h, x, 96 + i % 2 * 12, 14, 14, { fill: EXTRA.ligand, stroke: P.ink, lw: 1.5 })),
    rect(h, 0, 200, 440, 90, { fill: rgbaHex(EXTRA.cyto, 0.8), stroke: P.ink, lw: 3.5 }),
    [-110, 0, 110].map((x) => g(h, { x }, rect(h, -12, 150, 16, 26, { r: 5, fill: EXTRA.receptorGreen, stroke: P.ink, lw: 2 }), rect(h, 12, 150, 16, 26, { r: 5, fill: EXTRA.receptorGreen, stroke: P.ink, lw: 2 })))
  );
}
function capsule(h) {
  return g(
    h,
    { rot: -30 },
    rect(h, -45, 0, 90, 80, { r: 40, fill: P.k, stroke: P.ink, lw: 3 }),
    rect(h, 45, 0, 90, 80, { r: 40, fill: "#F1ECE2", stroke: P.ink, lw: 3 }),
    rect(h, -45, -18, 60, 12, { r: 6, fill: "rgba(255,255,255,0.35)" })
  );
}
function tablet(h) {
  return g(h, {}, circle(h, 0, 6, 150, 150, { fill: "#E4DED3", stroke: P.ink, lw: 3 }), circle(h, 0, 0, 150, 150, { fill: "#FBF8F2", stroke: P.ink, lw: 3 }), line(h, [[-50, 0], [50, 0]], { stroke: rgbaHex(P.ink, 0.4), w: 4, cap: "round" }));
}
function electrode(h) {
  const top = -150, tip = 190, w = (y) => 11 - 9.5 * ((y - top) / (tip - top));
  return g(
    h,
    {},
    line(h, [[-w(top), top], [-1.5, tip], [1.5, tip], [w(top), top]], { closed: true, fill: rgbaHex(P.volt, 0.12), stroke: P.ink, w: 2.5, join: "round" }),
    line(h, [[0, top + 4], [0, tip - 8]], { stroke: rgbaHex(P.volt, 0.7), w: 2 }),
    rect(h, 0, top - 22, 30, 44, { r: 4, fill: "#C7CDD2", stroke: P.ink, lw: 2.5 }),
    line(h, [[0, top - 44], [0, -190]], { ...ink2(3), stroke: P.ink })
  );
}
function syringe(h) {
  return g(
    h,
    { rot: -20 },
    rect(h, 0, 0, 260, 64, { r: 8, fill: "rgba(214,232,240,0.9)", stroke: P.ink, lw: 3 }),
    rect(h, 40, 0, 170, 52, { r: 4, fill: rgbaHex(EXTRA.drug, 0.9) }),
    Array.from({ length: 7 }, (_, i) => line(h, [[-90 + i * 30, -32], [-90 + i * 30, -16]], { stroke: P.ink, w: 2 })),
    rect(h, -150, 0, 40, 40, { fill: "#C7CDD2", stroke: P.ink, lw: 3 }),
    line(h, [[-170, 0], [-240, 0]], { ...ink2(10), stroke: "#8E969D" }),
    rect(h, -250, 0, 16, 70, { r: 4, fill: "#C7CDD2", stroke: P.ink, lw: 3 }),
    line(h, [[130, 0], [250, 0]], { ...ink2(4), stroke: "#8E969D" })
  );
}
function drugMolecule(h) {
  return g(
    h,
    {},
    line(h, [[-120, 0], [-40, 0]], ink2(6)),
    line(h, Array.from({ length: 7 }, (_, k) => [-150 + 30 * Math.cos(k * Math.PI / 3), 30 * Math.sin(k * Math.PI / 3)]), { closed: true, fill: "#E7D9F2", stroke: P.ink, w: 3 }),
    circle(h, -10, 0, 54, 54, { fill: EXTRA.drug, stroke: P.ink, lw: 3 })
  );
}
function enzyme(h) {
  const pts2 = [];
  for (let i = 0; i <= 40; i++) {
    const a = 0.55 + i / 40 * (Math.PI * 2 - 1.1);
    pts2.push([90 * Math.cos(a), 80 * Math.sin(a)]);
  }
  pts2.push([20, 0]);
  return g(h, {}, line(h, pts2, { closed: true, fill: "#C9D8C3", stroke: P.ink, w: 3, join: "round" }), circle(h, -30, -26, 40, 26, { fill: "rgba(255,255,255,0.3)", rot: -25 }));
}
function mitochondrion(h) {
  const cr = [];
  for (let i = 0; i <= 12; i++) cr.push([-110 + i * 18.3, i % 2 ? -30 : 30]);
  return g(h, {}, rect(h, 0, 0, 280, 130, { r: 65, fill: "#E9C9C4", stroke: P.ink, lw: 3 }), rect(h, 0, 0, 250, 100, { r: 50, fill: "#F3DEDA", stroke: rgbaHex(P.ink, 0.5), lw: 2 }), line(h, cr, { stroke: "#B9877F", w: 4, join: "round" }));
}
function cellOutline(h) {
  return g(
    h,
    {},
    circle(h, 0, 0, 520, 380, { fill: rgbaHex(EXTRA.cyto, 0.8), stroke: P.ink, lw: 3.5 }),
    circle(h, -40, 10, 170, 150, { fill: rgbaHex(P.mem, 0.25), stroke: rgbaHex(P.ink, 0.7), lw: 2.5 }),
    circle(h, -30, 0, 50, 46, { fill: rgbaHex(P.mem, 0.45) }),
    g(h, { x: 150, y: -70, s: 0.4 }, mitochondrion(h)),
    g(h, { x: 140, y: 90, s: 0.35, rot: 30 }, mitochondrion(h))
  );
}
function atpChip(h, label = "ATP") {
  return g(h, {}, rect(h, 0, 0, 92, 46, { r: 23, fill: "#F2E3A6", stroke: P.ink, lw: 2.5 }), text(h, label, 0, 1, { size: 22, weight: 800, fill: P.ink, family: SANS }));
}
function vessel(h) {
  return g(
    h,
    {},
    circle(h, 0, 0, 300, 300, { fill: "#E8B9B2", stroke: P.ink, lw: 3.5 }),
    circle(h, 0, 0, 240, 240, { fill: "#F3D9D4", stroke: rgbaHex(P.ink, 0.6), lw: 2 }),
    circle(h, 0, 0, 170, 170, { fill: "#C4605A", stroke: P.ink, lw: 2.5 }),
    [[-30, -20], [25, 15], [-10, 40], [40, -30]].map(([x, y]) => g(h, { x, y, s: 0.28 }, rbcEl(h)))
  );
}
function doseResponse(h) {
  const pts2 = [];
  for (let i = 0; i <= 60; i++) {
    const x = -300 + i * 10, l = (x + 0) / 70;
    pts2.push([x, 120 - 240 / (1 + Math.exp(-l))]);
  }
  return g(
    h,
    {},
    line(h, [[-320, -150], [-320, 140], [320, 140]], ink2(3)),
    line(h, pts2, { stroke: P.volt, w: 7, cap: "round", join: "round" }),
    text(h, "log dose", 0, 176, { size: 22, weight: 700, fill: P.muted, family: SANS }),
    g(h, { x: -350, y: -10, rot: -90 }, text(h, "effect", 0, 0, { size: 22, weight: 700, fill: P.muted, family: SANS }))
  );
}
var V1 = "v1";
var V2 = "v2";
var LIB = "library-2026-11";
var ASSETS = [
  // 10-paper
  { id: "card-small", cat: "paper", desc: "blank torn-paper card, small (labels)", since: V1, box: [-140, -70, 280, 140], draw: (h) => line(h, tornPoints(240, 100, 11, "b"), { closed: true, fill: P.card, shadow: true }) },
  { id: "card-medium", cat: "paper", desc: "blank torn-paper card, medium (callouts, readouts)", since: V1, box: [-230, -110, 460, 220], draw: (h) => line(h, tornPoints(420, 180, 12, "b"), { closed: true, fill: P.card, shadow: true }) },
  { id: "card-large", cat: "paper", desc: "blank torn-paper card, large (equations, insets)", since: V1, box: [-360, -200, 720, 400], draw: (h) => line(h, tornPoints(680, 360, 13, "r"), { closed: true, fill: P.card, shadow: true }) },
  { id: "tape", cat: "paper", desc: "a strip of masking tape (stick on a card corner, rotated ~30\xB0)", since: V1, box: [-60, -22, 120, 44], draw: (h) => g(h, { op: 0.85 }, rect(h, 0, 0, 96, 28, { fill: P.tape })) },
  // 20-marks
  { id: "pen-loop", cat: "marks", desc: "red pen loop (focus); reveal with a mask or scale", since: V1, box: [-180, -110, 360, 220], draw: (h) => line(h, penLoopPts(160, 90), { stroke: P.pen, w: 5, cap: "round", join: "round" }) },
  { id: "pen-x", cat: "marks", desc: "red pen X (cross out)", since: V2, box: [-110, -80, 220, 160], draw: (h) => g(h, {}, line(h, [[-90, -60], [90, 60]], { stroke: P.pen, w: 14, cap: "round" }), line(h, [[90, -60], [-90, 60]], { stroke: P.pen, w: 14, cap: "round" })) },
  { id: "pen-strike", cat: "marks", desc: "red pen strike-through line", since: V2, box: [-150, -12, 300, 24], draw: (h) => line(h, [[-140, 2], [140, -2]], { stroke: P.pen, w: 7, cap: "round" }) },
  { id: "pen-question", cat: "marks", desc: "red pen question mark", since: V2, box: [-60, -110, 120, 200], draw: (h) => text(h, "?", 0, 0, { size: 150, weight: 800, fill: P.pen, family: SANS }) },
  { id: "arrow-red", cat: "marks", desc: "red pen arrow (points at things)", since: V1, box: [-20, -30, 260, 60], draw: (h) => arrow(h, [0, 0], [220, 0], P.pen, 1, 6, 20) },
  { id: "arrow-ink", cat: "marks", desc: "ink arrow (flows, steps)", since: V1, box: [-20, -30, 260, 60], draw: (h) => arrow(h, [0, 0], [220, 0], P.ink, 1, 6, 20) },
  { id: "arrow-loop", cat: "marks", desc: "circular arrow (feedback loop); spin it", since: V2, box: [-70, -70, 140, 140], draw: (h) => loopArrowEl(h, 50, P.ink) },
  { id: "bracket", cat: "marks", desc: "red bracket (marks a range, e.g. the overshoot)", since: V2, box: [-20, -110, 60, 220], draw: (h) => line(h, [[0, -100], [30, -100], [30, 100], [0, 100]], { stroke: P.pen, w: 6, cap: "round", join: "round" }) },
  { id: "highlighter", cat: "marks", desc: "pink highlighter swipe (behind words); reveal left to right", since: V1, box: [-210, -30, 420, 60], draw: (h) => rect(h, 0, 0, 400, 44, { r: 6, fill: rgbaHex(P.hl, 0.6) }) },
  { id: "pointer-dot", cat: "marks", desc: "label pointer: leader line with a dot (text goes at the left end)", since: V1, box: [-10, -20, 220, 40], draw: (h) => g(h, {}, line(h, [[0, 0], [200, 0]], { stroke: P.ink, w: 2.5 }), circle(h, 200, 0, 14, 14, { fill: P.ink })) },
  { id: "dashed-line", cat: "marks", desc: "dashed ink line (0 mV, threshold, E_X levels)", since: V2, box: [-410, -8, 820, 16], draw: (h) => h("line", { x1: -400, y1: 0, x2: 400, y2: 0, stroke: rgbaHex(P.ink, 0.6), strokeWidth: 3, strokeDasharray: "18 12", strokeLinecap: "round" }) },
  { id: "spark", cat: "marks", desc: "stimulus spark", since: V2, box: [-45, -45, 90, 90], draw: (h) => line(h, Array.from({ length: 17 }, (_, i) => {
    const a = i * Math.PI / 8, r = i % 2 ? 14 : 36;
    return [r * Math.cos(a), r * Math.sin(a)];
  }), { closed: true, fill: "#F3C94C", stroke: P.ink, w: 2 }) },
  { id: "plus-charge", cat: "marks", desc: "a + charge (voltage pushing)", since: V2, box: [-45, -45, 90, 90], draw: (h) => g(h, {}, circle(h, 0, 0, 80, 80, { fill: P.volt, stroke: P.ink, lw: 3 }), text(h, "+", 0, 2, { size: 54, weight: 800, fill: "#FFFFFF", family: SANS })) },
  // 30-cell
  { id: "ion-na", cat: "cell", desc: "Na\u207A ion", since: V1, box: [-30, -30, 60, 60], tags: ["sodium"], draw: ion("na") },
  { id: "ion-k", cat: "cell", desc: "K\u207A ion", since: V1, box: [-30, -30, 60, 60], tags: ["potassium"], draw: ion("k") },
  { id: "ion-cl", cat: "cell", desc: "Cl\u207B ion", since: V1, box: [-30, -30, 60, 60], tags: ["chloride"], draw: ion("cl") },
  { id: "ion-ca", cat: "cell", desc: "Ca\xB2\u207A ion", since: LIB, box: [-30, -30, 60, 60], tags: ["calcium"], draw: (h) => ball(h, EXTRA.ca, "Ca\xB2\u207A", "#FFFFFF", 25, 15) },
  { id: "ion-h", cat: "cell", desc: "H\u207A ion", since: LIB, box: [-24, -24, 48, 48], tags: ["proton", "acid"], draw: (h) => ball(h, "#E6A0A0", "H\u207A", P.ink, 20, 15) },
  { id: "ion-anion", cat: "cell", desc: "trapped anion (protein, \u2212)", since: V1, box: [-38, -38, 76, 76], draw: ion("an") },
  { id: "ion-unknown", cat: "cell", desc: "an ion still to be named (?)", since: V2, box: [-30, -30, 60, 60], draw: (h) => ball(h, "#CFCAC0", "?", P.ink, 25, 26) },
  { id: "membrane-strip", cat: "cell", desc: "lipid bilayer strip (tile side by side for longer)", since: V1, box: [-370, -60, 740, 120], draw: (h) => strip(h, 720) },
  { id: "nav-channel--closed", cat: "cell", desc: "voltage-gated Na\u207A channel, closed (lid ready)", since: V2, box: [-200, -150, 400, 300], tags: ["sodium channel"], draw: onStrip(360, (h) => navChan(h, 0, 0)) },
  { id: "nav-channel--open", cat: "cell", desc: "voltage-gated Na\u207A channel, open", since: V2, box: [-200, -150, 400, 300], draw: onStrip(360, (h) => navChan(h, 0, 1)) },
  { id: "nav-channel--inactivated", cat: "cell", desc: "voltage-gated Na\u207A channel, inactivated (lid shut)", since: V2, box: [-200, -150, 400, 300], draw: onStrip(360, (h) => navChan(h, 0, 1, 1)) },
  { id: "kv-channel--closed", cat: "cell", desc: "voltage-gated K\u207A channel, closed", since: V2, box: [-200, -130, 400, 260], draw: onStrip(360, (h) => kvChan(h, 0, 0)) },
  { id: "kv-channel--open", cat: "cell", desc: "voltage-gated K\u207A channel, open", since: V2, box: [-200, -130, 400, 260], draw: onStrip(360, (h) => kvChan(h, 0, 1)) },
  { id: "leak-channel", cat: "cell", desc: "K\u207A leak channel (always open)", since: V1, box: [-200, -110, 400, 220], draw: onStrip(360, (h) => leakChan(h, 0)) },
  { id: "cav-channel--closed", cat: "cell", desc: "voltage-gated Ca\xB2\u207A channel, closed", since: LIB, box: [-200, -130, 400, 260], draw: onStrip(360, (h) => caChan(h, 0)) },
  { id: "cav-channel--open", cat: "cell", desc: "voltage-gated Ca\xB2\u207A channel, open", since: LIB, box: [-200, -130, 400, 260], draw: onStrip(360, (h) => caChan(h, 1)) },
  { id: "ligand-channel--closed", cat: "receptors", desc: "ligand-gated channel, closed", since: V2, box: [-200, -150, 400, 300], draw: onStrip(360, (h) => ligandGated(h, 0)) },
  { id: "ligand-channel--open", cat: "receptors", desc: "ligand-gated channel, open with ligand bound", since: V2, box: [-200, -150, 400, 300], draw: onStrip(360, (h) => ligandGated(h, 1)) },
  { id: "gpcr", cat: "receptors", desc: "G-protein-coupled receptor (7 helices) with G\u03B1\u03B2\u03B3 below", since: LIB, box: [-260, -150, 520, 400], draw: onStrip(500, (h) => gpcr(h)) },
  { id: "gpcr--bound", cat: "receptors", desc: "GPCR with ligand bound", since: LIB, box: [-260, -150, 520, 400], draw: onStrip(500, (h) => gpcr(h, true)) },
  { id: "rtk", cat: "receptors", desc: "receptor tyrosine kinase, apart (inactive)", since: LIB, box: [-220, -230, 440, 440], draw: onStrip(420, (h) => rtk(h)) },
  { id: "rtk--active", cat: "receptors", desc: "receptor tyrosine kinase, paired and phosphorylated", since: LIB, box: [-220, -270, 440, 480], draw: onStrip(420, (h) => rtk(h, true)) },
  { id: "ligand-dot", cat: "receptors", desc: "ligand / neurotransmitter molecule", since: V2, box: [-18, -18, 36, 36], draw: (h) => circle(h, 0, 0, 28, 28, { fill: EXTRA.ligand, stroke: P.ink, lw: 2 }) },
  { id: "pump-nak", cat: "transport", desc: "Na\u207A/K\u207A-ATPase (generic carrier, open inside)", since: V1, box: [-200, -130, 400, 260], draw: onStrip(360, (h) => carrier(h, 0, P.na)) },
  { id: "carrier--in", cat: "transport", desc: "transporter, open to the inside", since: LIB, box: [-200, -130, 400, 260], draw: onStrip(360, (h) => carrier(h, 0, P.mem)) },
  { id: "carrier--out", cat: "transport", desc: "transporter, open to the outside", since: LIB, box: [-200, -130, 400, 260], draw: onStrip(360, (h) => carrier(h, 1, P.mem)) },
  { id: "atp", cat: "transport", desc: "ATP chip", since: V1, box: [-52, -28, 104, 56], draw: (h) => atpChip(h) },
  { id: "adp", cat: "transport", desc: "ADP chip", since: V1, box: [-52, -28, 104, 56], draw: (h) => atpChip(h, "ADP") },
  { id: "vesicle", cat: "transport", desc: "synaptic vesicle full of transmitter", since: LIB, box: [-66, -66, 132, 132], draw: (h) => vesicle(h) },
  { id: "synapse", cat: "organs", desc: "synapse: terminal with vesicles, cleft, receptors", since: LIB, box: [-240, -300, 480, 560], draw: (h) => synapse(h) },
  { id: "neuron", cat: "organs", desc: "neuron (dendrites, soma, axon, terminals)", since: V1, box: [-300, -270, 1e3, 520], draw: (h) => neuronEl(h) },
  { id: "axon-cylinder", cat: "organs", desc: "axon as a cutaway cylinder (squid giant axon)", since: V1, box: [-490, -110, 980, 220], draw: (h) => fibreEl(h, 900, 170) },
  { id: "electrode", cat: "organs", desc: "glass microelectrode (tip at the bottom: .bottom); pair it with a readout", since: V2, box: [-20, -192, 40, 384], tags: ["probe", "micropipette", "measure", "voltage"], draw: (h) => electrode(h) },
  { id: "squid", cat: "organs", desc: "squid with its giant axon", since: V1, box: [-420, -240, 840, 480], draw: (h) => squidEl(h, 0) },
  { id: "myocyte", cat: "organs", desc: "cardiac muscle cell (capsule, striations, nucleus)", since: V1, box: [-140, -50, 280, 100], draw: (h) => myocyteEl(h) },
  { id: "red-blood-cell", cat: "organs", desc: "red blood cell", since: V1, box: [-60, -60, 120, 120], draw: (h) => rbcEl(h) },
  { id: "blood-vessel", cat: "organs", desc: "blood vessel cross-section with red cells", since: LIB, box: [-160, -160, 320, 320], draw: (h) => vessel(h) },
  { id: "cell", cat: "organs", desc: "generic cell: membrane, nucleus, mitochondria", since: LIB, box: [-270, -200, 540, 400], draw: (h) => cellOutline(h) },
  { id: "mitochondrion", cat: "organs", desc: "mitochondrion", since: LIB, box: [-150, -75, 300, 150], draw: (h) => mitochondrion(h) },
  // 50-pharm
  { id: "drug-molecule", cat: "pharm", desc: "generic drug molecule (no brand)", since: V2, box: [-190, -40, 230, 80], draw: (h) => drugMolecule(h) },
  { id: "capsule", cat: "pharm", desc: "capsule", since: LIB, box: [-110, -80, 220, 160], draw: (h) => capsule(h) },
  { id: "tablet", cat: "pharm", desc: "tablet (scored)", since: LIB, box: [-80, -80, 160, 168], draw: (h) => tablet(h) },
  { id: "syringe", cat: "pharm", desc: "syringe with drug", since: LIB, box: [-280, -130, 560, 260], draw: (h) => syringe(h) },
  { id: "enzyme", cat: "pharm", desc: "enzyme with an active-site notch", since: LIB, box: [-100, -90, 200, 180], draw: (h) => enzyme(h) },
  { id: "dose-response", cat: "graphs", desc: "dose\u2013response curve template (axes labelled)", since: LIB, box: [-380, -170, 760, 380], draw: (h) => doseResponse(h) },
  // 60-graphs: the action potential in pieces (model neuron), same scale throughout: 140 px per ms, 4 px per mV
  { id: "ap-full", cat: "graphs", desc: "action potential, whole (model neuron, blue)", since: V2, box: traceBox(MODEL, 0, 10), draw: traceAsset(MODEL, 0, 10, P.volt) },
  { id: "ap-coloured", cat: "graphs", desc: "action potential, upstroke mustard, fall violet", since: V2, box: traceBox(MODEL, 0, 10), draw: (h) => {
    const pts2 = tracePts(MODEL, 0, 10);
    const mid = (Math.max(...pts2.map((p) => p[1])) + Math.min(...pts2.map((p) => p[1]))) / 2;
    const seg = (a, b, c) => line(h, tracePts(MODEL, 0, 10).filter((_, i) => i * 0.02 >= a - 1e-9 && i * 0.02 <= b + 1e-9), { stroke: c, w: 7, cap: "round", join: "round" });
    return g(h, { y: -mid }, seg(0, TT.threshold, P.volt), seg(TT.threshold, TT.peak, P.na), seg(TT.peak, TT.rest, P.k), seg(TT.rest, 10, P.volt));
  } },
  { id: "ap-upstroke", cat: "graphs", desc: "AP piece: rest \u2192 peak (\u221270 \u2192 +54), mustard", since: V2, box: traceBox(MODEL, 0, TT.peak), draw: traceAsset(MODEL, 0, TT.peak, P.na) },
  { id: "ap-fall", cat: "graphs", desc: "AP piece: peak \u2192 dip, violet", since: V2, box: traceBox(MODEL, TT.peak, TT.dip), draw: traceAsset(MODEL, TT.peak, TT.dip, P.k) },
  { id: "ap-bernstein", cat: "graphs", desc: "Bernstein's guess: flat top at 0 mV (grey)", since: V2, box: traceBox(BERNSTEIN, 0, 10), draw: traceAsset(BERNSTEIN, 0, 10, P.muted) },
  { id: "axes-voltage", cat: "graphs", desc: "voltage axis (vertical) with ticks every 20 mV", since: V2, box: [-30, -340, 60, 680], draw: (h) => g(h, {}, line(h, [[0, -320], [0, 320]], ink2(3)), Array.from({ length: 9 }, (_, i) => line(h, [[-12, -320 + i * 80], [12, -320 + i * 80]], ink2(3)))) }
];

// src/paper/host.ts
var HOST = {
  skin: "#6A4330",
  skinShade: "#55352A",
  hair: "#1D1916",
  shirt: "#7A2E3A",
  // maroon t-shirt (creator, 4 Nov): darker than the red pen, so it never reads as a mark
  shirtShade: "#62242F",
  steth: "#2B2B2E",
  metal: "#C9CDD2",
  mouth: "#3A1E1A",
  beads: ["#C8352B", "#F2EEE6", "#23211E", "#2E6CB5", "#F2EEE6"]
};
var SH = [80, -232];
var L1 = 100;
var L2 = 94;
var REST_L = [-106, -58];
var REST_R = [106, -58];
var POSES = {
  idle: {
    num: { hLx: REST_L[0], hLy: REST_L[1], hRx: REST_R[0], hRy: REST_R[1], head: 0, lean: 0, lookX: 0, lookY: 0, browL: 0, browR: 0, browTilt: 0 },
    disc: { mouth: "smile", eyes: "open", handL: "open", handR: "open", propL: "none", propR: "none", accent: "none" }
  },
  wave: {
    num: { hLx: REST_L[0], hLy: REST_L[1], hRx: 158, hRy: -412, head: 4, lean: 1.5, lookX: 0, lookY: 0, browL: 4, browR: 4, browTilt: 0 },
    disc: { mouth: "grin", eyes: "open", handL: "open", handR: "open", propL: "none", propR: "none", accent: "none" }
  },
  point: {
    num: { hLx: REST_L[0], hLy: REST_L[1], hRx: 252, hRy: -266, head: 3, lean: 2, lookX: 1, lookY: 0, browL: 2, browR: 2, browTilt: 0 },
    disc: { mouth: "smile", eyes: "open", handL: "open", handR: "point", propL: "none", propR: "none", accent: "none" }
  },
  think: {
    num: { hLx: REST_L[0] + 10, hLy: REST_L[1], hRx: 16, hRy: -296, head: -6, lean: -1, lookX: 0.7, lookY: -1, browL: 6, browR: -1, browTilt: 0 },
    disc: { mouth: "flat", eyes: "open", handL: "open", handR: "fist", propL: "none", propR: "none", accent: "question" }
  },
  idea: {
    num: { hLx: REST_L[0], hLy: REST_L[1], hRx: 196, hRy: -392, head: 3, lean: 1, lookX: 0.6, lookY: -0.8, browL: 7, browR: 7, browTilt: 0 },
    disc: { mouth: "grin", eyes: "wide", handL: "open", handR: "point", propL: "none", propR: "none", accent: "idea" }
  },
  shrug: {
    num: { hLx: -152, hLy: -236, hRx: 152, hRy: -236, head: 8, lean: 0, lookX: 0, lookY: 0, browL: 8, browR: 8, browTilt: -3 },
    disc: { mouth: "flat", eyes: "half", handL: "open", handR: "open", propL: "none", propR: "none", accent: "none" }
  },
  surprised: {
    num: { hLx: -138, hLy: -330, hRx: 138, hRy: -330, head: 0, lean: -2, lookX: 0, lookY: 0, browL: 11, browR: 11, browTilt: 0 },
    disc: { mouth: "o", eyes: "wide", handL: "open", handR: "open", propL: "none", propR: "none", accent: "exclaim" }
  },
  calculator: {
    num: { hLx: REST_L[0], hLy: REST_L[1], hRx: 34, hRy: -122, head: -3, lean: 0, lookX: -0.3, lookY: 0.2, browL: -2, browR: -2, browTilt: 2 },
    disc: { mouth: "flat", eyes: "half", handL: "open", handR: "fist", propL: "none", propR: "calculator", accent: "sweat" }
  },
  thumbsup: {
    num: { hLx: REST_L[0], hLy: REST_L[1], hRx: 140, hRy: -266, head: 4, lean: 1, lookX: 0, lookY: 0, browL: 3, browR: 3, browTilt: 0 },
    disc: { mouth: "grin", eyes: "happy", handL: "open", handR: "thumb", propL: "none", propR: "none", accent: "none" }
  },
  explain: {
    num: { hLx: -66, hLy: -128, hRx: 150, hRy: -170, head: 2, lean: 1, lookX: 0.4, lookY: 0, browL: 3, browR: 3, browTilt: 0 },
    disc: { mouth: "smile", eyes: "open", handL: "open", handR: "open", propL: "none", propR: "none", accent: "none" }
  }
};
function mirror(p) {
  const n2 = p.num, d = p.disc;
  const num2 = {};
  const put = (k, v) => {
    if (v !== void 0) num2[k] = v;
  };
  put("hLx", n2.hRx === void 0 ? void 0 : -n2.hRx);
  put("hLy", n2.hRy);
  put("hRx", n2.hLx === void 0 ? void 0 : -n2.hLx);
  put("hRy", n2.hLy);
  put("head", n2.head === void 0 ? void 0 : -n2.head);
  put("lean", n2.lean === void 0 ? void 0 : -n2.lean);
  put("lookX", n2.lookX === void 0 ? void 0 : -n2.lookX);
  put("lookY", n2.lookY);
  put("browL", n2.browR);
  put("browR", n2.browL);
  put("browTilt", n2.browTilt);
  const disc = {};
  for (const k of ["mouth", "eyes", "accent"]) if (d[k] !== void 0) disc[k] = d[k];
  if (d.handR) disc.handL = d.handR;
  if (d.handL) disc.handR = d.handL;
  if (d.propR) disc.propL = d.propR;
  if (d.propL) disc.propR = d.propL;
  return { num: num2, disc };
}
function ik(s, t, sgn) {
  let dx = t[0] - s[0], dy = t[1] - s[1];
  let d = Math.hypot(dx, dy) || 1e-6;
  const dMax = L1 + L2 - 0.5, dMin = Math.abs(L1 - L2) + 1;
  const dc = Math.min(dMax, Math.max(dMin, d));
  const ux = dx / d, uy = dy / d;
  const hd = [s[0] + ux * dc, s[1] + uy * dc];
  const a = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc))));
  const c1 = [s[0] + L1 * (ux * Math.cos(a) - uy * Math.sin(a)), s[1] + L1 * (ux * Math.sin(a) + uy * Math.cos(a))];
  const c2 = [s[0] + L1 * (ux * Math.cos(-a) - uy * Math.sin(-a)), s[1] + L1 * (ux * Math.sin(-a) + uy * Math.cos(-a))];
  const score = (p) => 0.45 * sgn * p[0] + p[1];
  return { e: score(c1) >= score(c2) ? c1 : c2, hd };
}
var f2 = (n2) => Math.round(n2 * 10) / 10;
function makeHost(x, y, o = {}) {
  const seed = o.seed ?? 4242;
  const nx = sig(x), ny = sig(y), ns = sig(o.s ?? 1), op = sig(0);
  const idle = POSES.idle;
  const num2 = Object.fromEntries(Object.entries(idle.num).map(([k, v]) => [k, sig(v)]));
  const events = [{ t: -1e9, patch: idle.disc }];
  const talkSpans = [];
  const waveSpans = [];
  const disc = () => {
    const t = now();
    const st = {};
    for (const e of events) if (e.t <= t) Object.assign(st, e.patch);
    return st;
  };
  const setDisc = (patch, at = 0) => (s) => (events.push({ t: s + at, patch }), events.sort((a, b) => a.t - b.t), s);
  const tear = (() => {
    const r = prng(seed);
    const p = [];
    for (let i = 0; i <= 16; i++) p.push([100 - 200 * i / 16, (r() - 0.5) * 7]);
    return p;
  })();
  const BORDER = 16;
  const shp = (h, mode, d, fill, lw = 3.5, stroke = P.ink) => mode === "back" ? path(h, d, { fill: P.card, stroke: P.card, lw: BORDER + lw, join: "round" }) : path(h, d, { fill, stroke, lw, join: "round" });
  const ell = (h, mode, cx, cy, rx, ry, fill, lw = 3.5) => mode === "back" ? circle(h, cx, cy, rx * 2, ry * 2, { fill: P.card, stroke: P.card, lw: BORDER + lw }) : circle(h, cx, cy, rx * 2, ry * 2, { fill, stroke: P.ink, lw });
  const limb = (h, mode, pts2, color2, w) => mode === "back" ? line(h, pts2, { stroke: P.card, w: w + BORDER + 7, cap: "round", join: "round" }) : [line(h, pts2, { stroke: P.ink, w: w + 7, cap: "round", join: "round" }), line(h, pts2, { stroke: color2, w, cap: "round", join: "round" })];
  const torsoD = () => {
    const top = `M ${tear[0][0]} ${tear[0][1]} L 97 -186 C 97 -224 90 -242 66 -250 L 30 -260 C 20 -246 -20 -246 -30 -260 L -66 -250 C -90 -242 -97 -224 -97 -186 L ${tear[tear.length - 1][0]} ${tear[tear.length - 1][1]}`;
    return top + " " + tear.slice(1, -1).reverse().map((p) => `L ${f2(p[0])} ${f2(p[1])}`).join(" ") + " Z";
  };
  const headD = "M 0 -444 C 52 -444 70 -404 68 -362 C 66 -318 40 -284 0 -284 C -40 -284 -66 -318 -68 -362 C -70 -404 -52 -444 0 -444 Z";
  const hairCap = "M -71 -366 C -78 -420 -50 -466 0 -468 C 50 -466 78 -420 71 -366 C 66 -386 50 -400 0 -402 C -50 -400 -66 -386 -71 -366 Z";
  const curls = (() => {
    const out = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (0.95 + 1.1 * i / 12);
      out.push([f2(Math.cos(a) * 66), f2(-404 + Math.sin(a) * 60)]);
    }
    return out;
  })();
  const handEl = (h, mode, e, hd, kind, sgn) => {
    const dx = hd[0] - e[0], dy = hd[1] - e[1], d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    let px = -uy, py = ux;
    if (Math.abs(py) < 0.35 ? px * sgn > 0 : py > 0) {
      px = -px;
      py = -py;
    }
    const at = (a, b) => [hd[0] + ux * a + px * b, hd[1] + uy * a + py * b];
    const rot = Math.atan2(uy, ux) * 180 / Math.PI;
    const parts = [];
    if (kind === "point") {
      parts.push(limb(h, mode, [at(6, 7), at(34, 8)], HOST.skin, 9));
      parts.push(ell(h, mode, hd[0], hd[1], 18, 15, HOST.skin));
      if (mode === "front") {
        parts[parts.length - 1] = circle(h, hd[0], hd[1], 36, 30, { fill: HOST.skin, stroke: P.ink, lw: 3.5, rot });
        for (const k of [-1, -8]) parts.push(line(h, [at(2, k), at(13, k)], { stroke: HOST.skinShade, w: 2.5, cap: "round" }));
        parts.push(circle(h, ...at(-2, 12), 14, 10, { fill: HOST.skin, stroke: P.ink, lw: 2.5, rot }));
      }
      return parts;
    }
    if (kind === "thumb") {
      const tx = hd[0] - 6 * sgn;
      parts.push(limb(h, mode, [[tx, hd[1] - 10], [tx - 3 * sgn, hd[1] - 34]], HOST.skin, 11));
      parts.push(mode === "back" ? rect(h, hd[0], hd[1], 36 + BORDER, 32 + BORDER, { r: 12, fill: P.card }) : rect(h, hd[0], hd[1], 36, 32, { r: 11, fill: HOST.skin, stroke: P.ink, lw: 3.5 }));
      if (mode === "front") for (const k of [-5, 3, 11]) parts.push(line(h, [[hd[0] + 2 * sgn, hd[1] + k - 2], [hd[0] + 14 * sgn, hd[1] + k - 2]], { stroke: HOST.skinShade, w: 2.5, cap: "round" }));
      return parts;
    }
    parts.push(ell(h, mode, hd[0], hd[1], kind === "open" ? 18 : 16, kind === "open" ? 17 : 15, HOST.skin));
    if (mode === "front" && kind === "fist") parts.push(line(h, [[hd[0] - 8 * sgn, hd[1] - 4], [hd[0] + 6 * sgn, hd[1] - 4]], { stroke: HOST.skinShade, w: 2.5, cap: "round" }));
    return parts;
  };
  const calculatorEl = (h, mode, hd) => {
    const cx = hd[0] - 14, cy = hd[1] - 40;
    if (mode === "back") return rect(h, cx, cy, 78 + BORDER, 108 + BORDER, { r: 12, fill: P.card });
    const keys = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys.push(rect(h, cx - 22 + c * 22, cy - 2 + r * 17, 15, 11, { r: 3, fill: "#D9D3C6" }));
    return [
      rect(h, cx, cy, 78, 108, { r: 10, fill: "#E9E4D8", stroke: P.ink, lw: 3.5 }),
      rect(h, cx, cy - 32, 58, 22, { r: 4, fill: "#B8C8B2", stroke: P.ink, lw: 2 }),
      text(h, "0", cx + 22, cy - 32, { size: 16, weight: 700, fill: P.ink, align: "r" }),
      ...keys
    ];
  };
  const armEl = (h, mode, side, D2) => {
    const sgn = side === "R" ? 1 : -1;
    const s = [SH[0] * sgn, SH[1]];
    let tx = side === "R" ? num2.hRx() : num2.hLx(), ty = side === "R" ? num2.hRy() : num2.hLy();
    const t = now();
    if (waveSpans.some(([a, b]) => t >= a && t <= b) && ty < -330 && sgn * tx > 100) tx += Math.sin(t * 2 * Math.PI * 2.2) * 26 * sgn;
    const { e, hd } = ik(s, [tx, ty], sgn);
    const sl = [s[0] + (e[0] - s[0]) * 0.5, s[1] + (e[1] - s[1]) * 0.5];
    const prop = side === "R" ? D2.propR : D2.propL;
    const out = [];
    out.push(limb(h, mode, [sl, e, hd], HOST.skin, 28));
    out.push(limb(h, mode, [[s[0] - 10 * sgn, s[1] + 4], sl], HOST.shirt, 40));
    if (prop === "calculator") out.push(calculatorEl(h, mode, hd));
    if (mode === "front" && side === "R") {
      const w = [e[0] + (hd[0] - e[0]) * 0.74, e[1] + (hd[1] - e[1]) * 0.74];
      const dx = hd[0] - e[0], dy = hd[1] - e[1], d = Math.hypot(dx, dy) || 1;
      const nx2 = -dy / d, ny2 = dx / d;
      for (let i = 0; i < 5; i++) {
        const k = (i - 2) * 6.2;
        out.push(circle(h, w[0] + nx2 * k, w[1] + ny2 * k, 8, 8, { fill: HOST.beads[i], stroke: P.ink, lw: 1.2 }));
      }
    }
    out.push(handEl(h, mode, e, hd, side === "R" ? D2.handR : D2.handL, sgn));
    return out;
  };
  const faceEl = (h, D2) => {
    const t = now();
    const ph = (t + seed % 7 * 0.37) % 4.3;
    const blink = ph < 0.14 ? Math.sin(ph / 0.14 * Math.PI) : 0;
    const lx = num2.lookX() * 5, ly = num2.lookY() * 4;
    const out = [];
    const eyeY = -360;
    for (const sgn of [-1, 1]) {
      const ex = 25 * sgn;
      if (D2.eyes === "happy") {
        out.push(path(h, `M ${ex - 11} ${eyeY + 4} Q ${ex} ${eyeY - 10} ${ex + 11} ${eyeY + 4}`, { stroke: P.ink, lw: 4, cap: "round" }));
      } else {
        const ry = (D2.eyes === "wide" ? 17 : 14) * (D2.eyes === "half" ? 0.6 : 1) * (1 - 0.92 * blink);
        const rx = D2.eyes === "wide" ? 14 : 12;
        const cy = eyeY + (D2.eyes === "half" ? 4 : 0);
        out.push(circle(h, ex, cy, rx * 2, Math.max(1.5, ry * 2), { fill: "#FBF8F1", stroke: P.ink, lw: 2.5 }));
        if (ry > 4) out.push(circle(h, ex + lx, cy + ly + (D2.eyes === "half" ? 2 : 0), 13, Math.min(13, ry * 1.6), { fill: P.ink }));
        if (D2.eyes === "half") out.push(line(h, [[ex - rx - 1, cy - ry + 1], [ex + rx + 1, cy - ry + 1]], { stroke: P.ink, w: 3.5, cap: "round" }));
      }
      const raise = sgn < 0 ? num2.browL() : num2.browR();
      const by = eyeY - 26 - raise;
      out.push(line(h, [[ex - 13 * sgn, by + num2.browTilt()], [ex + 13 * sgn, by - num2.browTilt()]], { stroke: HOST.hair, w: 6.5, cap: "round" }));
    }
    out.push(path(h, "M -4 -338 Q 0 -332 6 -337", { stroke: HOST.skinShade, lw: 3, cap: "round" }));
    let m = D2.mouth;
    if (talkSpans.some(([a, b]) => t >= a && t <= b)) {
      const k = Math.floor(t * 9.5 + Math.sin(t * 13) * 1.3) % 3;
      m = k === 0 ? "grin" : k === 1 ? "o" : D2.mouth === "grin" ? "smile" : D2.mouth;
    }
    const my = -314;
    if (m === "smile") out.push(path(h, `M -17 ${my - 3} Q 0 ${my + 11} 17 ${my - 3}`, { stroke: P.ink, lw: 4, cap: "round" }));
    if (m === "grin") out.push(
      path(h, `M -20 ${my - 5} Q 0 ${my + 22} 20 ${my - 5} Z`, { fill: HOST.mouth, stroke: P.ink, lw: 3.5, join: "round" }),
      path(h, `M -15 ${my - 3} L 15 ${my - 3} Q 0 ${my + 3} -15 ${my - 3} Z`, { fill: "#FBF8F1" })
    );
    if (m === "o") out.push(circle(h, 0, my + 2, 15, 19, { fill: HOST.mouth, stroke: P.ink, lw: 3.5 }));
    if (m === "flat") out.push(line(h, [[-13, my], [13, my]], { stroke: P.ink, w: 4, cap: "round" }));
    if (m === "frown") out.push(path(h, `M -15 ${my + 5} Q 0 ${my - 7} 15 ${my + 5}`, { stroke: P.ink, lw: 4, cap: "round" }));
    if (m === "smirk") out.push(path(h, `M -14 ${my} Q 4 ${my + 5} 18 ${my - 7}`, { stroke: P.ink, lw: 4, cap: "round" }));
    return out;
  };
  const accentEl = (h, D2) => {
    const t = now();
    const bob = Math.sin(t * 3) * 4;
    if (D2.accent === "question") return text(h, "?", 108, -470 + bob, { size: 84, weight: 700, fill: P.pen, family: SERIF });
    if (D2.accent === "exclaim") return text(h, "!", 100, -478 + bob, { size: 88, weight: 700, fill: P.pen, family: SERIF });
    if (D2.accent === "sweat") return g(
      h,
      { x: -84, y: -418 + Math.abs(bob) },
      path(h, "M 0 -18 C 10 -2 13 6 0 14 C -13 6 -10 -2 0 -18 Z", { fill: "#BFD6EE", stroke: P.ink, lw: 2.5, join: "round" })
    );
    if (D2.accent === "idea") return g(
      h,
      { x: 0, y: -540 + bob * 0.6 },
      circle(h, 0, 0, 52, 52, { fill: "#FFF3A8", stroke: P.ink, lw: 3.5 }),
      rect(h, 0, 33, 24, 16, { r: 3, fill: "#BEB9B0", stroke: P.ink, lw: 3 }),
      ...[-1, 0, 1].map((k) => line(h, [[k * 44, -26 - (k === 0 ? 14 : 0)], [k * 58, -36 - (k === 0 ? 22 : 0)]], { stroke: P.ink, w: 3.5, cap: "round" }))
    );
    return null;
  };
  const stethEl = (h) => {
    const tube = (d) => [path(h, d, { stroke: P.ink, lw: 10, cap: "round" }), path(h, d, { stroke: HOST.steth, lw: 5.5, cap: "round" })];
    return [
      ...tube("M -27 -258 C -40 -232 -46 -200 -44 -158"),
      ...tube("M 27 -258 C 40 -232 46 -210 44 -186"),
      ...tube("M 44 -186 C 38 -174 34 -166 33 -156"),
      ...tube("M 44 -186 C 52 -176 56 -168 57 -158"),
      circle(h, 33, -153, 8, 8, { fill: HOST.metal, stroke: P.ink, lw: 2 }),
      circle(h, 57, -155, 8, 8, { fill: HOST.metal, stroke: P.ink, lw: 2 }),
      circle(h, -44, -146, 30, 30, { fill: HOST.metal, stroke: P.ink, lw: 3.5 }),
      circle(h, -44, -146, 16, 16, { fill: "#E6E9EC", stroke: P.ink, lw: 2 })
    ];
  };
  const figure = (h, mode, D2) => {
    const t = now();
    const breathe = Math.sin(t * 1.7 + seed) * 2.2;
    const headG = (...c) => g(h, { y: breathe * 0.6 }, g(h, { x: 0, y: -284, rot: num2.head() }, g(h, { y: 294 }, ...c)));
    return g(
      h,
      { rot: num2.lean() },
      shp(h, mode, torsoD(), HOST.shirt),
      mode === "front" ? path(h, "M -30 -260 C -20 -246 20 -246 30 -260", { stroke: HOST.shirtShade, lw: 5, cap: "round" }) : null,
      headG(
        shp(h, mode, "M -20 -296 L 20 -296 L 22 -250 L -22 -250 Z", HOST.skin),
        mode === "front" ? path(h, "M -30 -260 C -20 -246 20 -246 30 -260 L 22 -248 L -22 -248 Z", { fill: HOST.shirt }) : null,
        mode === "front" ? path(h, "M -30 -260 C -20 -246 20 -246 30 -260", { stroke: P.ink, lw: 3.5, cap: "round" }) : null,
        ell(h, mode, -68, -356, 11, 17, HOST.skin),
        ell(h, mode, 68, -356, 11, 17, HOST.skin),
        shp(h, mode, headD, HOST.skin),
        ...curls.map(([cx, cy]) => ell(h, mode, cx, cy, 15, 15, HOST.hair, 3)),
        shp(h, mode, hairCap, HOST.hair),
        mode === "front" ? curls.map(([cx, cy]) => circle(h, cx, cy + 3, 26, 26, { fill: HOST.hair })) : null,
        mode === "front" ? faceEl(h, D2) : null
      ),
      mode === "front" ? stethEl(h) : null,
      armEl(h, mode, "L", D2),
      armEl(h, mode, "R", D2)
    );
  };
  const el = (h) => {
    if (op() <= 1e-3) return null;
    const D2 = disc();
    return g(
      h,
      { x: nx(), y: ny(), s: ns(), op: op() },
      h("g", { filter: "url(#shadow)" }, figure(h, "back", D2)),
      figure(h, "front", D2),
      accentEl(h, D2)
    );
  };
  let facing = o.side ?? "r";
  const pose = (name, side = facing, d = 0.55) => {
    facing = side;
    let p = typeof name === "string" ? POSES[name] : name;
    if (!p) throw new Error("no host pose " + String(name));
    if (side === "l") p = mirror(p);
    const tw = Object.entries(p.num).map(([k, v]) => num2[k].to(v, d, easeInOutCubic));
    const extra = [];
    if (name === "wave") extra.push((s) => (waveSpans.push([s, s + d + 1.6]), s + d + 1.6));
    return all(...tw, setDisc(p.disc, d * 0.45), ...extra);
  };
  const look = (lx, ly = 0, d = 0.25) => all(num2.lookX.to(lx, d, easeInOutCubic), num2.lookY.to(ly, d, easeInOutCubic));
  const face = (patch) => setDisc(patch);
  const talk = (seconds) => (s) => (talkSpans.push([s, s + seconds]), s + seconds);
  const enter = (d = 0.7) => chain(all(ny.set(y + 560), op.set(1)), ny.to(y, d, easeOutBack));
  const leave = (d = 0.5) => chain(ny.to(y + 560, d, easeInCubic), op.set(0));
  const moveTo = (x2, y2, d = T.move) => all(nx.to(x2, d, easeInOutCubic), ny.to(y2, d, easeInOutCubic));
  return { el, pose, look, face, talk, enter, leave, moveTo, x: nx, y: ny, s: ns, op, show: () => op.set(1) };
}

// src/mic/values.ts
var COLORS = {
  ink: P.ink,
  black: P.ink,
  muted: P.muted,
  grey: P.muted,
  gray: P.muted,
  paper: P.paper,
  card: P.card,
  white: "#FFFFFF",
  na: P.na,
  sodium: P.na,
  "na-yellow": P.na,
  mustard: P.na,
  k: P.k,
  potassium: P.k,
  violet: P.k,
  purple: P.k,
  cl: "#9DB89A",
  chloride: "#9DB89A",
  ca: "#5E8FB0",
  calcium: "#5E8FB0",
  anion: P.an,
  an: P.an,
  red: P.pen,
  pen: P.pen,
  blue: P.volt,
  volt: P.volt,
  pink: P.hl,
  highlighter: P.hl,
  teal: P.mem,
  membrane: P.mem,
  green: "#3F8F5A",
  alarm: "#C8402F",
  protein: "#B9C9D6",
  lid: "#9DB0C2",
  ligand: "#6E9F5E",
  drug: "#D9C3EA",
  blood: "#D9726A",
  cyto: "#D7E8E4",
  tape: P.tape
};
function color(s) {
  const k = s.toLowerCase();
  if (COLORS[k]) return COLORS[k];
  if (/^#[0-9a-f]{6}$/i.test(s) || /^#[0-9a-f]{3}$/i.test(s)) return s;
  throw new Error(`"${s}" is not a colour. Use a name (${Object.keys(COLORS).slice(0, 12).join(", ")} ...) or a hex like #1F4E9C`);
}
var spring = (v) => 1 - Math.exp(-6 * v) * Math.cos(v * Math.PI * 4.5) * (1 - v) - (v >= 1 ? 0 : 0);
var bounce = (v) => {
  const n2 = 7.5625, d = 2.75;
  if (v < 1 / d) return n2 * v * v;
  if (v < 2 / d) return n2 * (v -= 1.5 / d) * v + 0.75;
  if (v < 2.5 / d) return n2 * (v -= 2.25 / d) * v + 0.9375;
  return n2 * (v -= 2.625 / d) * v + 0.984375;
};
var elastic = (v) => v <= 0 ? 0 : v >= 1 ? 1 : Math.pow(2, -10 * v) * Math.sin((v * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
var EASES = {
  spring,
  bounce,
  elastic,
  linear,
  in: easeInCubic,
  out: easeOutCubic,
  "in-out": easeInOutCubic,
  inout: easeInOutCubic,
  smooth: easeInOutCubic,
  overshoot: easeOutBack,
  back: easeOutBack,
  sine: easeInOutSine
};
function ease(s, dflt = easeInOutCubic) {
  if (!s) return dflt;
  const e = EASES[s.toLowerCase()];
  if (!e) throw new Error(`"${s}" is not an easing. Use one of: ${Object.keys(EASES).join(", ")}`);
  return e;
}
function num(src, env) {
  let i = 0;
  const s = src.replace(/−/g, "-").trim();
  const peek = () => {
    while (s[i] === " ") i++;
    return s[i];
  };
  const expr = () => {
    let v2 = term();
    for (; ; ) {
      const c = peek();
      if (c === "+") {
        i++;
        v2 += term();
      } else if (c === "-") {
        i++;
        v2 -= term();
      } else return v2;
    }
  };
  const term = () => {
    let v2 = unary();
    for (; ; ) {
      const c = peek();
      if (c === "*") {
        i++;
        v2 *= unary();
      } else if (c === "/") {
        i++;
        v2 /= unary();
      } else return v2;
    }
  };
  const unary = () => {
    const c = peek();
    if (c === "-") {
      i++;
      return -unary();
    }
    if (c === "+") {
      i++;
      return unary();
    }
    if (c === "(") {
      i++;
      const v2 = expr();
      if (peek() !== ")") throw new Error(`missing ) in "${src}"`);
      i++;
      return v2;
    }
    const m = /^(\d*\.?\d+)(ms|s|deg|°|%)?/.exec(s.slice(i));
    if (m) {
      i += m[0].length;
      return m[2] === "ms" ? +m[1] / 1e3 : m[2] === "%" ? +m[1] / 100 : +m[1];
    }
    const w = /^[A-Za-z_][\w]*(\.[\w-]+)?(\.x|\.y)?/.exec(s.slice(i));
    if (w) {
      i += w[0].length;
      const name = w[0];
      if (name === "random") {
        if (peek() === "(") {
          i++;
          const a = expr();
          if (peek() !== ",") throw new Error("random needs two numbers: random(-10, 10)");
          i++;
          const b = expr();
          if (peek() !== ")") throw new Error("missing ) after random");
          i++;
          return a + (b - a) * env.rand();
        }
        return env.rand();
      }
      if (name in env.vars) return env.vars[name];
      const ax = /\.(x|y)$/.exec(name);
      if (ax) {
        const p = env.point(name.slice(0, -2));
        if (p) return ax[1] === "x" ? p[0] : p[1];
      }
      throw new Error(`"${name}" is not a number or a let name`);
    }
    throw new Error(`can't read "${src}" as a number`);
  };
  const v = expr();
  if (i < s.length && s.slice(i).trim()) throw new Error(`can't read "${src}" as a number`);
  return v;
}
function point(src, env) {
  const s = src.trim();
  const m = /^([A-Za-z_][\w-]*\.[\w-]+(?:\([^)]*\))?)\s*(?:([+\-])\s*(.+))?$/.exec(s);
  if (m && !(m[1].split(".")[0] in env.vars)) {
    const p = env.point(m[1]);
    if (!p) throw new Error(`no point called "${m[1]}"`);
    if (!m[2]) return p;
    const [dx, dy] = pair(m[3], env);
    const k = m[2] === "-" ? -1 : 1;
    return [p[0] + k * dx, p[1] + k * dy];
  }
  if (/^[A-Za-z_][\w-]*$/.test(s) && !(s in env.vars)) {
    const p = env.point(s + ".centre");
    if (p) return p;
  }
  return pair(s, env);
}
function pair(s, env) {
  let d = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") d++;
    else if (s[i] === ")") d--;
    else if (s[i] === "," && d === 0) return [num(s.slice(0, i), env), num(s.slice(i + 1), env)];
  }
  throw new Error(`"${s}" is not a position. Write it like 200,-40 or ap.peak`);
}
function points(src, env) {
  return src.trim().replace(/\s*([+*/])\s*/g, "$1").replace(/([\w)])\s+-\s+/g, "$1-").split(/\s+/).filter(Boolean).map((p) => point(p, env));
}
var bool = (s) => s !== void 0 && !/^(no|false|off|0)$/i.test(s);
function closest(word, names) {
  let best = null, bd = Infinity;
  for (const n2 of names) {
    const d = lev(word.toLowerCase(), n2.toLowerCase());
    if (d < bd) {
      bd = d;
      best = n2;
    }
  }
  return best && bd <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
}
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
var rgb = (h) => {
  const x = h.length === 4 ? h.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : h;
  const n2 = parseInt(x.slice(1), 16);
  return [n2 >> 16 & 255, n2 >> 8 & 255, n2 & 255];
};
function csig(init) {
  const segs = [];
  const at = (t) => {
    let v = init;
    for (const g2 of segs) {
      if (t < g2.s) break;
      if (g2.d <= 0 || t >= g2.s + g2.d) v = g2.to;
      else {
        const k = g2.e((t - g2.s) / g2.d), a = rgb(v), b = rgb(g2.to);
        return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * k)).join(",")})`;
      }
    }
    return v;
  };
  const f3 = (() => at(now()));
  f3.at = at;
  f3.to = (c, d, e = easeInOutCubic) => (s) => {
    segs.push({ s, d, to: c, e });
    segs.sort((a, b) => a.s - b.s);
    return s + d;
  };
  return f3;
}

// src/mic/objects.ts
var FONTS = { sans: SANS, inter: SANS, serif: SERIF, lora: SERIF, math: '"Latin Modern Roman", "Latin Modern Math"' };
var font = (s) => s ? FONTS[s.toLowerCase()] ?? (() => {
  throw new Error(`font: use sans, serif or math`);
})() : SANS;
var n = (o, k, d) => o.opts[k] !== void 0 ? num(o.opts[k], o.env) : d;
function versions(first) {
  const list = [{ c: first, s: -1, d: 0 }];
  return {
    add: (c, s, d) => {
      list.push({ c, s, d });
      list.sort((a, b) => a.s - b.s);
    },
    /** [content, opacity] pairs to draw now */
    now: () => {
      const t = now();
      let i = 0;
      while (i + 1 < list.length && list[i + 1].s <= t) i++;
      const cur = list[i];
      if (i > 0 && t < cur.s + cur.d) {
        const k = (t - cur.s) / cur.d;
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        return [[list[i - 1].c, 1 - e], [cur.c, e]];
      }
      return [[cur.c, 1]];
    },
    all: () => list.map((v) => v.c)
  };
}
function lineItemOf(s, size, fill, fam, weight) {
  if (s.startsWith("$")) return tex(s.slice(1), { size: size * 1.25, color: fill });
  return textItem(s, { size, fill, weight, family: fam });
}
var splitLines = (s) => s.split(/\s*\|\s*|\\n/);
function ionBall(h, kind, r = 25) {
  const spec = {
    na: [P.na, "Na\u207A", P.ink, 17],
    k: [P.k, "K\u207A", "#FFFFFF", 18],
    cl: ["#9DB89A", "Cl\u207B", P.ink, 17],
    ca: ["#5E8FB0", "Ca\xB2\u207A", "#FFFFFF", 15],
    h: ["#E9E4F2", "H\u207A", P.ink, 18],
    an: [P.an, "\u2212", P.ink, 30]
  };
  const [fill, label, lc, size] = spec[kind] ?? spec.na;
  const rr = kind === "an" ? 34 : r;
  return g(
    h,
    {},
    circle(h, 0, 0, 2 * rr, 2 * rr, { fill, stroke: P.ink, lw: 2.5 }),
    circle(h, -rr * 0.34, -rr * 0.36, rr * 0.62, rr * 0.48, { fill: "rgba(255,255,255,0.28)", rot: -30 }),
    text(h, label, 0, 1, { size, weight: 800, fill: lc, family: SANS })
  );
}
var ION_KINDS = ["na", "k", "cl", "ca", "h", "an"];
var ionKind = (s) => {
  const k = (s ?? "na").toLowerCase().replace(/^sodium$/, "na").replace(/^potassium$/, "k").replace(/^chloride$/, "cl").replace(/^calcium$/, "ca").replace(/^anion$/, "an");
  if (!ION_KINDS.includes(k)) throw new Error(`kind: use one of ${ION_KINDS.join(", ")}`);
  return k;
};
function smoothPts(p, per = 16) {
  if (p.length < 3) return p;
  const out = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(p[p.length - 1]);
  return out;
}
function bendPts(a, b, bend, n2 = 32) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
  const c = [mx + dy * bend, my - dx * bend];
  return Array.from({ length: n2 + 1 }, (_, i) => {
    const t = i / n2, u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  });
}
function shapePts(p, opts, env) {
  if (opts.bend !== void 0 && p.length === 2) return bendPts(p[0], p[1], opts.bend === "" ? 0.25 : num(opts.bend, env));
  if (opts.smooth !== void 0 && p.length > 2) return smoothPts(p);
  return p;
}
function alongPts(p, u) {
  const L = [0];
  for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const d = Math.max(0, Math.min(1, u)) * L[L.length - 1];
  for (let i = 1; i < p.length; i++) if (L[i] >= d) {
    const k = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return [[p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k], Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0]) * 180 / Math.PI];
  }
  return [p[p.length - 1], 0];
}
function boundsOf(p, pad = 0) {
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}
function strokeLine(h, p, stroke, w, end, dash, closed = false) {
  if (end <= 1e-3) return null;
  if (!dash) return line(h, p, { stroke, w, cap: "round", join: "round", end, closed, fill: closed ? "none" : void 0 });
  const L = [0];
  for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const stop = L[L.length - 1] * Math.min(1, end);
  const out = [p[0]];
  for (let i = 1; i < p.length; i++) {
    if (L[i] <= stop) out.push(p[i]);
    else {
      const k = (stop - L[i - 1]) / (L[i] - L[i - 1] || 1);
      out.push([p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]);
      break;
    }
  }
  return h("polyline", { points: out.map((q) => q.join(",")).join(" "), fill: "none", stroke, strokeWidth: w, strokeDasharray: dash, strokeLinecap: "round", strokeLinejoin: "round" });
}
function arrowHead(h, a, b, stroke, w) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const L = 10 + w * 2.6, spread = 0.45;
  const p1 = [b[0] - L * Math.cos(ang - spread), b[1] - L * Math.sin(ang - spread)];
  const p2 = [b[0] - L * Math.cos(ang + spread), b[1] - L * Math.sin(ang + spread)];
  return line(h, [p1, b, p2], { stroke, w, cap: "round", join: "round" });
}
var assetIndex = new Map(ASSETS.map((a) => [a.id, a]));
var ASSET_NAMES = ASSETS.map((a) => a.id);
var WAVES = { "action-potential": MODEL, ap: MODEL, model: MODEL, bernstein: BERNSTEIN, squid: SQUID2, "squid-bernstein": SQUID_BERNSTEIN };
var TRACE_TIMES = { start: 0, foot: TT.foot, threshold: TT.threshold, "zero-up": TT.zeroUp, peak: TT.peak, "zero-down": TT.zeroDown, rest: TT.rest, dip: TT.dip, end: TT.end };
var TYPES = {
  asset: {
    name: "asset",
    desc: "any drawing from the asset library, by its permanent name",
    opts: "name=<asset name>  flip",
    example: "add asset cell name=neuron at=-500,0 size=0.6",
    make(o) {
      const id = o.opts.name ?? o.text;
      if (!id) throw new Error("which asset? add name=..., like name=nav-channel--open");
      const a = assetIndex.get(id);
      if (!a) {
        const near = ASSET_NAMES.filter((x) => x.includes(id) || id.includes(x.split("--")[0])).slice(0, 4);
        throw new Error(`no asset called "${id}"${near.length ? `. Did you mean ${near.join(", ")}?` : " (open the asset browser to see the names)"}`);
      }
      const [bx, by, bw, bh] = a.box;
      return { draw: (h) => a.draw(h), box: () => ({ cx: bx + bw / 2, cy: by + bh / 2, w: bw, h: bh }) };
    }
  },
  text: {
    name: "text",
    desc: "words; | starts a new line",
    opts: '"words"  fontsize=34  font=sans|serif  weight=600  align=left|centre|right',
    takesText: true,
    example: 'add text q "Why not 0 mV?" font=serif fontsize=44 at=0,-380',
    make(o) {
      const size = n(o, "fontsize", FSZ.callout), fam = font(o.opts.font), weight = n(o, "weight", o.opts.font === "serif" ? 600 : 700);
      const align = (o.opts.align ?? "centre").toLowerCase()[0];
      const chars = sig(1);
      const v = versions(o.text);
      const items = (s, fill, cut = 1) => {
        const total = s.length;
        const shown = cut >= 1 ? s : s.slice(0, Math.round(total * cut));
        const ls = splitLines(shown);
        return column(ls.map((l) => lineItemOf(l || " ", size, fill, fam, weight)), { gap: size * 0.15, align: align === "l" ? "start" : align === "r" ? "end" : "center" });
      };
      const full = () => items(v.all().reduce((a, b) => b.length > a.length ? b : a, ""), P.ink);
      const off = (w) => align === "l" ? w / 2 : align === "r" ? -w / 2 : 0;
      return {
        chars,
        swap: (c, s, d) => v.add(c, s, d),
        draw: (h) => g(h, {}, v.now().map(([c, k]) => {
          const it = items(c, o.base.color(), chars());
          return g(h, { op: k }, it.draw(h, off(it.w), 0));
        })),
        box: () => {
          const it = items(v.now().slice(-1)[0][0], P.ink);
          return { cx: off(it.w), cy: 0, w: it.w, h: it.h };
        },
        points: {},
        _full: full
      };
    }
  },
  math: {
    name: "math",
    desc: "an equation in the LaTeX look (\\frac{a}{b}, x_{o}, x^{+}, \\it{V}, \\log, \\hl{x}, \\color{red}{x}); #name marks a slot you fill later",
    opts: '"tex"  fontsize=44  <slot>="tex"',
    example: 'add math nernst "\\it{E} = 61.5 \\log \\frac{#ko}{#ki}" ko="[K^{+}]_{o}" ki="[K^{+}]_{i}"',
    make(o) {
      const size = n(o, "fontsize", 44);
      const template = o.text;
      const slotNames = [...template.matchAll(/#([A-Za-z]\w*)/g)].map((m) => m[1]);
      const slots = {};
      for (const k of slotNames) slots[k] = o.opts[k.toLowerCase()] ?? k;
      const fillIn = (vals, hl = []) => template.replace(/#([A-Za-z]\w*)/g, (_, k) => hl.includes(k) ? `\\hl{${vals[k]}}` : vals[k]);
      const v = versions(fillIn(slots));
      const check = (c) => {
        try {
          tex(c, { size });
        } catch (e) {
          throw new Error(`maths: ${e.message.replace(/^tex: /, "")}`);
        }
      };
      check(fillIn(slots));
      return {
        swap: (c, s, d) => {
          check(c);
          v.add(c, s, d);
        },
        draw: (h) => g(h, {}, v.now().map(([c, k]) => g(h, { op: k }, tex(c, { size, color: o.base.color() }).draw(h, 0, 0)))),
        box: () => {
          const it = tex(v.now().slice(-1)[0][0], { size });
          return { cx: 0, cy: 0, w: it.w, h: it.h };
        },
        _slots: slots,
        _fill: fillIn
      };
    }
  },
  card: {
    name: "card",
    desc: "a torn-paper card holding text (| = new line, a line starting with $ is maths); other objects can sit on it with group=",
    opts: '"text"  w= h=  tape=left|right|none  tilt=1.5  fontsize=34  font=serif|sans  tear=top|right|bottom|left',
    takesText: true,
    example: 'add card c "0 mV" fontsize=90 tape=left tilt=-2',
    make(o) {
      const size = n(o, "fontsize", FSZ.callout), fam = font(o.opts.font ?? "serif"), weight = n(o, "weight", 700);
      const v = versions(o.text);
      const colOf = (s, fill) => s ? column(splitLines(s).map((l) => lineItemOf(l, size, fill, fam, weight)), { gap: 6, pad: [12, 20] }) : null;
      const fixed = o.opts.w || o.opts.h;
      const sizeNow = () => {
        if (fixed) return [n(o, "w", 300), n(o, "h", 160)];
        let W = 100, Ht = 60;
        for (const c of v.all()) {
          const it = colOf(c, P.ink);
          if (it) {
            W = Math.max(W, it.w + 8);
            Ht = Math.max(Ht, it.h + 6);
          }
        }
        return [W, Ht];
      };
      const tearK = { top: "t", right: "r", bottom: "b", left: "l" }[(o.opts.tear ?? "right").toLowerCase()] ?? "r";
      const tapeSide = (o.opts.tape ?? "none").toLowerCase();
      const tr = prng(o.seed + 99);
      const tp = [];
      for (let i = 0; i <= 6; i++) tp.push([-46 + (tr() - 0.5) * 6, -13 + i * 26 / 6]);
      for (let i = 0; i <= 6; i++) tp.push([46 + (tr() - 0.5) * 6, 13 - i * 26 / 6]);
      const edges = /* @__PURE__ */ new Map();
      const edge = (W, Ht) => {
        const k = `${W.toFixed(1)}x${Ht.toFixed(1)}`;
        let p = edges.get(k);
        if (!p) edges.set(k, p = tornPoints(W, Ht, o.seed, tearK));
        return p;
      };
      if (o.opts.tilt === void 0) o.base.rot.set((prng(o.seed)() - 0.5) * 3.2)(0);
      return {
        swap: (c, s, d) => v.add(c, s, d),
        draw: (h) => {
          const [W, Ht] = sizeNow();
          const sx = tapeSide.startsWith("l") ? -1 : 1;
          return g(
            h,
            {},
            line(h, edge(W, Ht), { closed: true, fill: P.card, shadow: true }),
            v.now().map(([c, k]) => {
              const it = colOf(c, o.base.color());
              return it ? g(h, { op: k }, it.draw(h, 0, 0)) : null;
            }),
            tapeSide !== "none" && tapeSide !== "no" ? g(h, { x: sx * (W / 2 - 22), y: -Ht / 2 - 2, rot: sx * -32 }, line(h, tp, { closed: true, fill: P.tape, op: 0.8 })) : null
          );
        },
        box: () => {
          const [W, Ht] = sizeNow();
          return { cx: 0, cy: 0, w: W, h: Ht };
        }
      };
    }
  },
  trace: {
    name: "trace",
    desc: "a voltage trace on axes (the video 2 trace); draw it with: draw ap to=peak",
    opts: 'wave=action-potential|bernstein|squid|squid-bernstein  points="t,mV t,mV ..."  axes  zero  ghost=bernstein  ticks=-70,0,54  unit=" mV"',
    example: "add trace ap wave=action-potential axes zero ticks=-70,0,54",
    make(o) {
      let wave;
      if (o.opts.points) wave = monotone(points(o.opts.points, o.env));
      else {
        const w = (o.opts.wave ?? "action-potential").toLowerCase();
        if (!WAVES[w]) throw new Error(`wave: use one of ${Object.keys(WAVES).join(", ")}, or points="0,-70 2,-70 3.5,54 ..."`);
        wave = WAVES[w];
      }
      const ghost = o.opts.ghost ? WAVES[o.opts.ghost.toLowerCase()] ?? BERNSTEIN : void 0;
      const tr = makeTrace({ wave, ghost, color: o.opts.color ? color(o.opts.color) : P.volt });
      tr.node.op.set(1)(0);
      if (bool(o.opts.axes) || o.opts.axes === "") tr.axisOp.set(1)(0);
      if (bool(o.opts.zero) || o.opts.zero === "") tr.zeroOp.set(1)(0);
      if (o.opts.ghost) {
        tr.ghostOp.set(1)(0);
      }
      const ticks = {};
      if (o.opts.ticks) for (const v of o.opts.ticks.split(",")) {
        const mv = num(v, o.env);
        const unit = o.opts.unit ?? " mV";
        const tk = tr.tick(mv, `${mv > 0 ? "+" : mv < 0 ? "\u2212" : ""}${Math.abs(mv)}${unit}`, mv === 0 ? P.ink : P.muted);
        tk.op.set(1)(0);
      }
      const props = { draw: tr.drawTo, axes: tr.axisOp, zero: tr.zeroOp, ghost: tr.ghostTo, ghostop: tr.ghostOp, na: tr.naTint, k: tr.kTint, peak: tr.peakK, tip: tr.tipOp, line: tr.op };
      void ticks;
      const pts2 = {};
      for (const [k, t] of Object.entries(TRACE_TIMES)) pts2[k] = () => [X(t), Y(wave(t))];
      pts2.pen = () => tr.tip();
      return {
        _trace: tr,
        props,
        draw: (h) => tr.el(h),
        box: () => {
          let lo = Infinity, hi = -Infinity;
          for (let t = 0; t <= 10; t += 0.05) {
            const v = wave(t);
            lo = Math.min(lo, v);
            hi = Math.max(hi, v);
          }
          return { cx: (X(0) + X(10)) / 2, cy: (Y(hi) + Y(lo)) / 2, w: X(10) - X(0) + 40, h: Y(lo) - Y(hi) + 60 };
        },
        points: pts2,
        pointFn: (name, arg) => name === "t" ? [X(arg), Y(wave(arg))] : null,
        _times: TRACE_TIMES
      };
    }
  },
  shape: {
    name: "shape",
    desc: "a circle, rectangle, ellipse or any SVG path; draw it on with: draw",
    opts: 'kind=circle|rect|ellipse|path  w=  h=  r=  path="M0 0 L100 0"  fill=  stroke=  lw=4  round=10',
    example: "add shape pore kind=rect w=60 h=180 fill=protein",
    make(o) {
      const kind = (o.opts.kind ?? (o.opts.path ? "path" : "circle")).toLowerCase();
      const w0 = n(o, "w", n(o, "r", 60) * 2), h0 = n(o, "h", kind === "circle" ? w0 : n(o, "r", 60) * 2);
      const W = sig(w0), Hh = sig(h0);
      const fill = o.opts.fill ? color(o.opts.fill) : "none";
      const lw = n(o, "lw", o.opts.fill && !o.opts.color ? 3 : 4);
      const end = sig(1);
      const strokeC = () => o.opts.stroke === "none" ? "none" : o.base.color();
      if (o.opts.stroke && o.opts.stroke !== "none") o.base.color = csig(color(o.opts.stroke));
      return {
        props: { end, w: W, h: Hh },
        draw: (h) => {
          const e = end(), w = Math.max(0, W()), ht = Math.max(0, Hh());
          if (kind === "path") return path(h, o.opts.path, { fill, stroke: strokeC(), lw, cap: "round", join: "round" });
          if (e < 0.999) {
            const P2 = [];
            if (kind === "rect") {
              const a = w / 2, b = ht / 2;
              P2.push([-a, -b], [a, -b], [a, b], [-a, b], [-a, -b]);
            } else for (let i = 0; i <= 72; i++) {
              const t = -Math.PI / 2 + i / 72 * Math.PI * 2;
              P2.push([w / 2 * Math.cos(t), ht / 2 * Math.sin(t)]);
            }
            return strokeLine(h, P2, strokeC(), lw, e);
          }
          if (w < 0.5 || ht < 0.5) return null;
          if (kind === "rect") return rect(h, 0, 0, w, ht, { r: Math.min(n(o, "round", 10), w / 2, ht / 2), fill, stroke: strokeC(), lw });
          return circle(h, 0, 0, w, ht, { fill, stroke: strokeC(), lw });
        },
        box: () => ({ cx: 0, cy: 0, w: W(), h: Hh() })
      };
    }
  },
  line: {
    name: "line",
    desc: "a straight or bent line through points; draw it on with: draw",
    opts: 'from=x,y  to=x,y  via="x,y x,y"  lw=4  dash  color=',
    example: "add line zero from=-700,0 to=700,0 dash color=muted",
    make(o) {
      return makeLine(o, false);
    }
  },
  arrow: {
    name: "arrow",
    desc: "a line with an arrowhead at the end",
    opts: 'from=x,y  to=x,y  via="x,y x,y"  lw=5  dash  color=red',
    example: "add arrow a from=-200,0 to=0,0 color=red",
    make(o) {
      return makeLine(o, true);
    }
  },
  number: {
    name: "number",
    desc: "a number that rolls to new values (roll v to=54)",
    opts: 'value=-70  unit=" mV"  decimals=0  sign  fontsize=44  font=sans|serif|math',
    example: 'add number v value=-70 unit=" mV" sign color=blue fontsize=56',
    make(o) {
      return makeNumber(o, false);
    }
  },
  readout: {
    name: "readout",
    desc: "a torn readout card with a rolling value in blue pen (measured voltages)",
    opts: 'value=-70  unit=" mV"  decimals=0  fontsize=56',
    example: 'add readout r value=-70 unit=" mV" at=520,-300',
    make(o) {
      return makeNumber(o, true);
    }
  },
  ion: {
    name: "ion",
    desc: "one ion (travel it through a channel with: travel)",
    opts: "kind=na|k|cl|ca|h|an",
    example: "add ion n1 kind=na at=-300,-200",
    make(o) {
      const kind = ionKind(o.opts.kind ?? o.text);
      return { draw: (h) => ionBall(h, kind), box: () => ({ cx: 0, cy: 0, w: 52, h: 52 }) };
    }
  },
  ions: {
    name: "ions",
    desc: "a drifting field of ions scattered in an area (the same scatter every render)",
    opts: "kind=na|k|cl|ca|h|an  count=12  area=w,h  seed=  shown= (how many show: to outside shown=12 in=2s brings them in one by one)",
    example: "add ions outside kind=na count=14 area=900,220 at=0,-260",
    make(o) {
      const kind = ionKind(o.opts.kind ?? o.text);
      const count = Math.round(n(o, "count", 12));
      if (count > 300 || count < 0) throw new Error("count: 0 to 300 ions");
      const [aw, ah] = o.opts.area ? o.opts.area.split(",").map((x) => num(x, o.env)) : [800, 240];
      const r = prng(n(o, "seed", o.seed));
      const spots = [];
      for (let i = 0; i < count; i++) {
        let best = { x: 0, y: 0 }, bd = -1;
        for (let k = 0; k < 12; k++) {
          const c = { x: (r() - 0.5) * (aw - 60), y: (r() - 0.5) * (ah - 60) };
          const d = Math.min(1e9, ...spots.map((s) => Math.hypot(s.x - c.x, s.y - c.y)));
          if (d > bd) {
            bd = d;
            best = c;
          }
        }
        spots.push({ ...best, ph: r() * Math.PI * 2, fq: 0.5 + r() * 0.4 });
      }
      const pts2 = {};
      spots.forEach((s, i) => pts2[String(i + 1)] = () => [s.x, s.y]);
      const shown = sig(o.opts.shown !== void 0 ? num(o.opts.shown, o.env) : count);
      return {
        props: { shown },
        draw: (h) => g(h, {}, spots.map((s, i) => {
          const t = now();
          const k = Math.max(0, Math.min(1, shown() - i));
          if (k <= 1e-3) return null;
          return g(h, { x: s.x + 2.6 * Math.sin(t * s.fq * 2 * Math.PI + s.ph), y: s.y + 2.6 * Math.cos(t * s.fq * 1.6 * Math.PI + s.ph * 1.7), op: k, s: 0.7 + 0.3 * k }, ionBall(h, kind));
        })),
        box: () => ({ cx: 0, cy: 0, w: aw, h: ah }),
        points: pts2
      };
    }
  },
  flow: {
    name: "flow",
    desc: "a steady stream of particles along a path (ions through a channel, blood cells, a drug); rate and speed can be animated",
    opts: 'path="x,y x,y ..."  kind=na|k|cl|ca|cell|drug|dot  rate=3 (per s)  speed=260 (px/s)  spread=14  straight',
    example: 'add flow stream path="nav1.outside nav1.pore nav1.inside" kind=na rate=0   \xB7   to stream rate=6 in=0.5s',
    make(o) {
      return makeFlow(o);
    }
  },
  link: {
    name: "link",
    desc: "a line or arrow joining two things that stays attached while they move",
    opts: "from=<thing or point>  to=<thing or point>  head (an arrow)  bend=0.25  dash  gap=10",
    example: "add link l from=n1 to=label1 head bend=0.2",
    make(o) {
      o.opts.follow = "";
      return makeLine(o, o.opts.head !== void 0 || o.opts.arrow !== void 0);
    }
  },
  zoom: {
    name: "zoom",
    desc: "a magnifier: a round inset showing a close-up of a spot while the whole picture stays on screen",
    opts: "of=<point>  r=180 (radius)  mag=3 (magnification; to z mag=6 zooms further)",
    example: "add zoom z of=cell.right at=550,-250 r=200 mag=3 hidden   \xB7   grow z",
    make(o) {
      const r = sig(n(o, "r", 180)), mag = sig(n(o, "mag", 3));
      return { props: { r, mag }, draw: () => null, box: () => ({ cx: 0, cy: 0, w: 2 * r(), h: 2 * r() }) };
    }
  },
  host: {
    name: "host",
    desc: "the channel host (the drawn stand-in): enter, leave, pose, talk, look",
    opts: "side=left|right (which way it faces)  hidden (then: enter me)",
    example: "add host me at=690,575 side=left hidden   \xB7   enter me   \xB7   pose me point   \xB7   talk me in=3s",
    make(o) {
      const side = (o.opts.side ?? "left").toLowerCase().startsWith("r") ? "r" : "l";
      const host = makeHost(0, 0, { side });
      o.base.op.set(1)(0);
      if (o.opts.hidden === void 0) host.op.set(1)(0);
      return { draw: (h) => host.el(h), box: () => ({ cx: 0, cy: -260, w: 420, h: 560 }), points: { hand: () => [side === "l" ? -250 : 250, -270], head: () => [0, -400] }, _host: host };
    }
  },
  membrane: {
    name: "membrane",
    desc: "the lipid bilayer strip (teal heads, paired tails)",
    opts: "length=1200",
    example: "add membrane mem length=1600 at=0,60",
    make(o) {
      const L = n(o, "length", 1200);
      return { draw: (h) => g(h, { x: -MEM.x0 - L / 2, y: -MEM.y }, membraneEl(h, { x1: MEM.x0 + L })), box: () => ({ cx: 0, cy: 0, w: L, h: MEM.h + 8 }) };
    }
  },
  svg: {
    name: "svg",
    desc: "a drawing you imported (Library tab); add it by its name: add kidney k1",
    opts: "native (keep its own size instead of 400 px)",
    example: "add kidney k1 at=300,0 size=0.8",
    make(o) {
      const art = svgArt(o.opts.__name ?? "svg", o.opts.__svg ?? "");
      const k = o.opts.native !== void 0 ? 1 : art.k;
      const [vx, vy, vw, vh] = art.vb;
      return {
        draw: (h) => h("g", { transform: `scale(${k}) translate(${-vx - vw / 2} ${-vy - vh / 2})`, dangerouslySetInnerHTML: { __html: art.inner } }),
        box: () => ({ cx: 0, cy: 0, w: vw * k, h: vh * k })
      };
    }
  },
  image: {
    name: "image",
    desc: "a photo or picture you imported (My assets tab); add it by its name: add bernstein p1",
    opts: "tone=warm|grey  frame (taped card, like video 1 portraits)  native",
    example: "add bernstein p1 tone=warm frame at=-500,0",
    make(o) {
      const data = o.opts.__img ?? "";
      const iw = Number(o.opts.__w) || 400, ih = Number(o.opts.__h) || 400;
      const k = o.opts.native !== void 0 ? 1 : 400 / Math.max(iw, ih);
      const W = iw * k, Ht = ih * k;
      const tone = (o.opts.tone ?? "").toLowerCase();
      const filter = tone === "warm" ? "grayscale(1) sepia(0.45) contrast(1.05) brightness(1.02)" : tone === "grey" || tone === "gray" ? "grayscale(1)" : void 0;
      const framed = o.opts.frame !== void 0;
      const tr = prng(o.seed + 7);
      const tp = [];
      for (let i = 0; i <= 6; i++) tp.push([-46 + (tr() - 0.5) * 6, -13 + i * 26 / 6]);
      for (let i = 0; i <= 6; i++) tp.push([46 + (tr() - 0.5) * 6, 13 - i * 26 / 6]);
      const card = framed ? tornPoints(W + 44, Ht + 44, o.seed, "b") : null;
      return {
        draw: (h) => g(
          h,
          {},
          card ? line(h, card, { closed: true, fill: P.card, shadow: true }) : null,
          h("image", { href: data, x: -W / 2, y: -Ht / 2, width: W, height: Ht, preserveAspectRatio: "xMidYMid slice", style: filter ? { filter } : void 0 }),
          framed ? rect(h, 0, 0, W, Ht, { stroke: P.ink, lw: 2 }) : null,
          framed ? g(h, { x: -W / 2 + 26, y: -Ht / 2 - 18, rot: -32 }, line(h, tp, { closed: true, fill: P.tape, op: 0.8 })) : null
        ),
        box: () => ({ cx: 0, cy: 0, w: W + (framed ? 44 : 0), h: Ht + (framed ? 44 : 0) })
      };
    }
  },
  channel: {
    name: "channel",
    desc: "a working ion channel (video 2): open it, swing the Na\u207A lid shut, make it glow, all animatable with to",
    opts: "kind=nav|kv|leak  open=0..1  lid=0..1 (nav)  glow=0..1  lidshow=0..1",
    example: "add channel nav1 kind=nav at=0,60   \xB7   to nav1 open=1 in=0.3s   \xB7   to nav1 lid=1 in=0.4s",
    make(o) {
      const kind = (o.opts.kind ?? "nav").toLowerCase();
      if (!["nav", "kv", "leak"].includes(kind)) throw new Error("kind: use nav (voltage-gated Na\u207A), kv (voltage-gated K\u207A) or leak (K\u207A leak)");
      const open = sig(o.opts.open !== void 0 ? num(o.opts.open, o.env) : 0), lid = sig(o.opts.lid !== void 0 ? num(o.opts.lid, o.env) : 0);
      const glow = sig(o.opts.glow !== void 0 ? num(o.opts.glow, o.env) : 0), lidshow = sig(o.opts.lidshow !== void 0 ? num(o.opts.lidshow, o.env) : 1);
      const props = kind === "nav" ? { open, lid, glow, lidshow } : kind === "kv" ? { open } : {};
      return {
        props,
        draw: (h) => g(h, { y: -MEM.y }, kind === "nav" ? navChan(h, 0, open(), lid(), lidshow(), glow()) : kind === "kv" ? kvChan(h, 0, open()) : leakChan(h, 0)),
        box: () => ({ cx: 0, cy: 0, w: 150, h: MEM.h + 60 }),
        points: { pore: () => [0, 0], outside: () => [0, -MEM.h / 2 - 70], inside: () => [0, MEM.h / 2 + 70] }
      };
    }
  },
  plot: {
    name: "plot",
    desc: "empty axes for curves (dose-response, decay, any function); add curves to it with on=",
    opts: 'xaxis=0.01,1000  yaxis=0,100  logx  w=900  h=520  xlabel="log [drug]"  ylabel="effect (%)"  xticks=0.01,1,100  yticks=0,50,100',
    example: 'add plot dr xaxis=0.01,1000 yaxis=0,100 logx xlabel="[agonist] (log)" ylabel="response (%)"',
    make(o) {
      return makePlot(o);
    }
  },
  curve: {
    name: "curve",
    desc: "a curve on a plot, drawn on like the trace (with a halo at the pen); its numbers (ec50, emax...) can be animated with to",
    opts: 'on=<plot>  fn=hill|line|decay|rise|points  ec50=1 emax=100 n=1 e0=0 (hill) \xB7 m= b= (line) \xB7 a= k= c= (decay/rise) \xB7 points="x,y x,y"  lw=7  dash',
    example: "add curve agonist on=dr fn=hill ec50=1 emax=100 color=blue hidden",
    make(o) {
      return makeCurve(o);
    }
  },
  group: {
    name: "group",
    desc: "holds other objects (add them with group=<name>): move, fade or zoom them as one",
    opts: "",
    example: "add group pump at=300,0",
    make() {
      return { draw: () => null, box: () => ({ cx: 0, cy: 0, w: 0, h: 0 }) };
    }
  }
};
function makeLine(o, head) {
  const live = o.opts.follow !== void 0 && o.env.live;
  const fromL = live && o.opts.from ? o.env.live(o.opts.from) : null, toL = live && o.opts.to ? o.env.live(o.opts.to) : null;
  const from = o.opts.from ? points(o.opts.from, o.env)[0] : [0, 0];
  const to = o.opts.to ? points(o.opts.to, o.env)[0] : [200, 0];
  const via = o.opts.via ? points(o.opts.via, o.env) : [];
  const lw = n(o, "lw", head ? 5 : 4);
  const gap = n(o, "gap", live ? 10 : 0);
  const dash = o.opts.dash !== void 0 ? o.opts.dash && /\d/.test(o.opts.dash) ? o.opts.dash.replace(",", " ") : "18 12" : void 0;
  if (!o.opts.color) o.base.color = csig(head ? P.pen : P.ink);
  const end = sig(1);
  const ptsNow = () => {
    let a = from, b = to;
    if (fromL || toL) {
      const t = now();
      if (fromL) a = fromL(t);
      if (toL) b = toL(t);
      const trim = (p, q, ref) => {
        if (!ref || ref.includes(".") || !o.env.live) return p;
        const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, r = 50 + gap;
        return [p[0] + (q[0] - p[0]) / L * r, p[1] + (q[1] - p[1]) / L * r];
      };
      [a, b] = [trim(a, b, o.opts.from), trim(b, a, o.opts.to)];
    }
    return shapePts([a, ...via, b], o.opts, o.env);
  };
  const pts2 = { start: () => ptsNow()[0], end: () => {
    const q = ptsNow();
    return q[q.length - 1];
  }, middle: () => alongPts(ptsNow(), 0.5)[0] };
  return {
    props: { end },
    draw: (h) => {
      const p = ptsNow();
      const e = end();
      const c = o.base.color();
      let tipA = p[p.length - 2], tipB = p[p.length - 1];
      if (e < 0.999) {
        const L = [0];
        for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
        const stop = L[L.length - 1] * e;
        for (let i = 1; i < p.length; i++) if (L[i] >= stop) {
          const k = (stop - L[i - 1]) / (L[i] - L[i - 1] || 1);
          tipA = p[i - 1];
          tipB = [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k];
          break;
        }
      }
      return g(h, {}, strokeLine(h, p, c, lw, e, dash), head && e > 0.05 ? arrowHead(h, tipA, tipB, c, lw) : null);
    },
    box: () => boundsOf(ptsNow(), lw),
    points: pts2
  };
}
function makeFlow(o) {
  const raw = o.opts.path ?? o.opts.via;
  if (!raw) throw new Error('a flow needs path="x,y x,y ..." (named points work too)');
  const path3 = o.opts.smooth === void 0 && o.opts.straight !== void 0 ? points(raw, o.env) : smoothPts(points(raw, o.env));
  const L = (() => {
    let s2 = 0;
    for (let i = 1; i < path3.length; i++) s2 += Math.hypot(path3[i][0] - path3[i - 1][0], path3[i][1] - path3[i - 1][1]);
    return s2;
  })();
  const kind = (o.opts.kind ?? "na").toLowerCase();
  const rate = sig(n(o, "rate", 3)), speed = sig(n(o, "speed", 260));
  const jitter2 = n(o, "spread", 14);
  const spawns = [];
  let tDone = 0, acc = 0;
  const upTo = (t) => {
    const dt = 1 / 120;
    while (tDone < t && spawns.length < 2e4) {
      acc += Math.max(0, rate.at(tDone)) * dt;
      while (acc >= 1) {
        acc -= 1;
        spawns.push(tDone);
      }
      tDone += dt;
    }
  };
  const r = prng(o.seed + 5);
  const offs = Array.from({ length: 64 }, () => (r() - 0.5) * 2 * jitter2);
  const drawP = (h, i) => {
    if (kind === "cell" || kind === "rbc") return g(h, {}, circle(h, 0, 0, 46, 30, { fill: "#C8504A", stroke: P.ink, lw: 2 }), circle(h, 0, 0, 22, 12, { fill: "#A23E39" }));
    if (kind === "dot") return circle(h, 0, 0, 16, 16, { fill: o.base.color() });
    if (kind === "drug") return circle(h, 0, 0, 26, 26, { fill: "#D9C3EA", stroke: P.ink, lw: 2.5 });
    return g(h, { s: 0.7 }, ionBall(h, ionKind(kind)));
  };
  return {
    props: { rate, speed },
    draw: (h) => {
      const t = now();
      upTo(t);
      const sp = speed();
      const out = [];
      for (let i = spawns.length - 1; i >= 0; i--) {
        const age = t - spawns[i];
        const u = age * sp / L;
        if (u > 1) break;
        const [p, ang] = alongPts(path3, u);
        const off = offs[i % offs.length], a = (ang + 90) * Math.PI / 180;
        const fade = Math.min(1, u / 0.06, (1 - u) / 0.06);
        out.push(g(h, { x: p[0] + Math.cos(a) * off, y: p[1] + Math.sin(a) * off, op: fade }, drawP(h, i)));
      }
      return g(h, {}, out);
    },
    box: () => boundsOf(path3, 30),
    points: { start: () => path3[0], end: () => path3[path3.length - 1] }
  };
}
var svgCache = /* @__PURE__ */ new Map();
function svgArt(name, text2) {
  const key = name + "\0" + text2;
  const hit = svgCache.get(key);
  if (hit) return hit;
  const open = /<svg\b[^>]*>/i.exec(text2);
  const close = text2.toLowerCase().lastIndexOf("</svg>");
  if (!open || close < 0) throw new Error(`svg ${name}: this isn't an SVG drawing (no <svg> ... </svg>)`);
  const head = open[0];
  const num_ = (a) => {
    const m = new RegExp(`\\b${a}\\s*=\\s*["']\\s*([\\d.]+)`, "i").exec(head);
    return m ? parseFloat(m[1]) : NaN;
  };
  const vbm = /viewBox\s*=\s*["']([^"']+)["']/i.exec(head);
  let vb;
  if (vbm) vb = vbm[1].trim().split(/[\s,]+/).map(Number);
  else {
    const w = num_("width"), h = num_("height");
    if (!(w > 0 && h > 0)) throw new Error(`svg ${name}: it has no viewBox or size`);
    vb = [0, 0, w, h];
  }
  let inner = text2.slice(open.index + head.length, close);
  inner = inner.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "").replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "").replace(/(xlink:)?href\s*=\s*["'](?!#|data:image\/)[^"']*["']/gi, "").replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>|<!--[\s\S]*?-->/gi, "");
  const pre = `mic-${name}-`;
  inner = inner.replace(/\bid\s*=\s*"([^"]+)"/g, (_, i) => `id="${pre}${i}"`).replace(/\bid\s*=\s*'([^']+)'/g, (_, i) => `id='${pre}${i}'`).replace(/url\(\s*#([^)\s]+)\s*\)/g, (_, i) => `url(#${pre}${i})`).replace(/href\s*=\s*"#([^"]+)"/g, (_, i) => `href="#${pre}${i}"`);
  inner = inner.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => `<style>${css.replace(/@import[^;]*;/g, "").replace(/url\((?!\s*#|\s*data:)[^)]*\)/g, "none")}</style>`);
  const k = 400 / Math.max(vb[2], vb[3]);
  const art = { inner, vb, k };
  svgCache.set(key, art);
  return art;
}
function makePlot(o) {
  const pr = (k, d) => o.opts[k] ? o.opts[k].split(",").map((v) => num(v, o.env)) : d;
  const logx = o.opts.logx !== void 0;
  const [x0, x1] = pr("xaxis", logx ? [0.01, 1e3] : [0, 10]);
  const [y0, y1] = pr("yaxis", [0, 100]);
  if (logx && (x0 <= 0 || x1 <= 0)) throw new Error("a log axis needs x above 0, like xaxis=0.01,1000");
  const w = n(o, "w", 900), ht = n(o, "h", 520);
  const fx = (x) => logx ? Math.log10(Math.max(x, 1e-12)) : x;
  const X2 = (x) => -w / 2 + (fx(x) - fx(x0)) / (fx(x1) - fx(x0)) * w;
  const Y2 = (y) => ht / 2 - (y - y0) / (y1 - y0) * ht;
  const api = { X: X2, Y: Y2, x0, x1, y0, y1, logx, w, h: ht };
  const ticks = (k) => o.opts[k] ? o.opts[k].split(",").map((v) => num(v, o.env)) : [];
  const xt = ticks("xticks"), yt = ticks("yticks");
  const lab = (v) => Number.isInteger(v) && Math.abs(v) < 1e6 ? String(v) : Math.abs(v) >= 1e6 || Math.abs(v) < 0.01 && v !== 0 ? v.toExponential(0).replace("e+", "e") : String(+v.toFixed(3));
  const axes = sig(1);
  return {
    props: { axes },
    draw: (h) => {
      const a = axes();
      if (a < 1e-3) return null;
      return g(
        h,
        { op: a },
        line(h, [[-w / 2, -ht / 2 - 20], [-w / 2, ht / 2], [w / 2 + 20, ht / 2]], { stroke: P.ink, w: 4, cap: "round", join: "round" }),
        xt.map((v) => g(h, {}, line(h, [[X2(v), ht / 2], [X2(v), ht / 2 + 12]], { stroke: P.ink, w: 3 }), text(h, lab(v), X2(v), ht / 2 + 34, { size: 22, weight: 600, fill: P.muted, family: SANS }))),
        yt.map((v) => g(h, {}, line(h, [[-w / 2 - 12, Y2(v)], [-w / 2, Y2(v)]], { stroke: P.ink, w: 3 }), text(h, lab(v), -w / 2 - 20, Y2(v), { size: 22, weight: 600, fill: P.muted, family: SANS, align: "r" }))),
        o.opts.xlabel ? text(h, o.opts.xlabel, 0, ht / 2 + (xt.length ? 74 : 42), { size: 26, weight: 700, fill: P.muted, family: SANS }) : null,
        o.opts.ylabel ? g(h, { x: -w / 2 - (yt.length ? 84 : 40), y: 0, rot: -90 }, text(h, o.opts.ylabel, 0, 0, { size: 26, weight: 700, fill: P.muted, family: SANS })) : null
      );
    },
    box: () => ({ cx: 0, cy: 0, w: w + 40, h: ht + 40 }),
    points: { origin: () => [X2(x0), Y2(y0)], "x-end": () => [X2(x1), Y2(y0)], "y-end": () => [X2(x0), Y2(y1)] },
    pointFn: (name, arg) => name === "x" ? [X2(arg), Y2(y0)] : name === "y" ? [X2(x0), Y2(arg)] : null,
    _plot: api
  };
}
var VENT = monotone([[0, -90], [10, -90], [12, 22], [16, 10], [30, 5], [120, 2], [200, -12], [250, -45], [290, -82], [320, -90], [1e3, -90]]);
var SA = monotone([[0, -60], [350, -50], [560, -41], [600, -40], [640, 8], [660, 10], [700, -10], [760, -55], [800, -60]]);
function makeCurve(o) {
  const plot = o.parent?._plot;
  if (!plot) throw new Error("a curve goes on a plot: add on=<plot name>, like on=dr");
  const fn = (o.opts.fn ?? (o.opts.points ? "points" : "hill")).toLowerCase();
  const P0 = {
    hill: { ec50: Math.sqrt(plot.x0 * plot.x1), emax: plot.y1, n: 1, e0: plot.y0 },
    line: { m: 1, b: 0 },
    decay: { a: plot.y1, k: 1, c: plot.y0 },
    rise: { a: plot.y1, k: 1, c: plot.y0 },
    points: {},
    // presets (x in seconds for ecg, ms for the action potentials, hours for doses)
    ecg: { hr: 72, amp: 1, base: 0 },
    cardiac: { amp: 1 },
    pacemaker: { cycle: 800 },
    doses: { dose: 50, k: 0.15, tau: 8, n: 99 }
  };
  if (!P0[fn]) throw new Error(`fn: use hill, line, decay, rise, points, ecg, cardiac, pacemaker or doses`);
  const props = {};
  for (const [k, d] of Object.entries(P0[fn])) props[k] = sig(o.opts[k] !== void 0 ? num(o.opts[k], o.env) : d);
  const pts2 = o.opts.points ? monotone(points(o.opts.points, o.env)) : null;
  const f3 = (x) => {
    switch (fn) {
      case "hill": {
        const e = props.ec50(), nn = props.n();
        return props.e0() + (props.emax() - props.e0()) * (Math.pow(x, nn) / (Math.pow(x, nn) + Math.pow(e, nn)));
      }
      case "line":
        return props.m() * x + props.b();
      case "decay":
        return props.c() + (props.a() - props.c()) * Math.exp(-props.k() * x);
      case "rise":
        return props.c() + (props.a() - props.c()) * (1 - Math.exp(-props.k() * x));
      case "ecg": {
        const per = 60 / Math.max(20, props.hr()), u = (x % per + per) % per;
        const gs = (a, m, w) => a * Math.exp(-((u - m) ** 2) / (2 * w * w));
        return props.base() + props.amp() * (gs(0.15, 0.1, 0.025) + gs(-0.12, 0.19, 8e-3) + gs(1.2, 0.21, 9e-3) + gs(-0.28, 0.232, 0.01) + gs(0.32, 0.45, 0.042));
      }
      case "cardiac":
        return -90 + (VENT(x) + 90) * props.amp();
      case "pacemaker": {
        const c = Math.max(200, props.cycle()), u = (x % c + c) % c;
        return SA(u * (800 / c));
      }
      case "doses": {
        let y = 0;
        const tau = Math.max(0.1, props.tau()), k = props.k(), nn = Math.max(1, Math.round(props.n()));
        for (let i = 0; i < nn && i * tau <= x; i++) y += props.dose() * Math.exp(-k * (x - i * tau));
        return y;
      }
      default:
        return pts2(x);
    }
  };
  const fx = (u) => plot.logx ? Math.pow(10, Math.log10(plot.x0) + u * (Math.log10(plot.x1) - Math.log10(plot.x0))) : plot.x0 + u * (plot.x1 - plot.x0);
  const toU = (x) => plot.logx ? (Math.log10(x) - Math.log10(plot.x0)) / (Math.log10(plot.x1) - Math.log10(plot.x0)) : (x - plot.x0) / (plot.x1 - plot.x0);
  props.draw = sig(1);
  props.tip = sig(0);
  props.area = sig(o.opts.area !== void 0 ? num(o.opts.area || "1", o.env) : 0);
  props.track = sig(0);
  props.tx = sig(o.opts.tx !== void 0 ? num(o.opts.tx, o.env) : plot.x0);
  const unit = o.opts.unit ?? "", dec = o.opts.decimals !== void 0 ? Math.round(num(o.opts.decimals, o.env)) : 0;
  const lw = n(o, "lw", 7);
  const dash = o.opts.dash !== void 0 ? "22 14" : void 0;
  if (!o.opts.color) o.base.color = csig(P.volt);
  const yc = (y) => Math.max(plot.y0 - (plot.y1 - plot.y0) * 0.05, Math.min(plot.y1 + (plot.y1 - plot.y0) * 0.05, y));
  const at = (u) => {
    const x = fx(u);
    return [plot.X(x), plot.Y(yc(f3(x)))];
  };
  return {
    props,
    draw: (h) => {
      const e = props.draw();
      if (e <= 1e-3) return null;
      const N = 160, P2 = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N * e;
        P2.push(at(u));
      }
      const col = o.base.color();
      const tip = at(e);
      const ar = props.area(), tr = props.track();
      const hexCol = col.startsWith("#") ? col : P.volt;
      const base = plot.Y(Math.max(plot.y0, Math.min(plot.y1, 0)));
      const tx = Math.max(plot.x0, Math.min(plot.x1, props.tx())), ty = yc(f3(tx)), tp = [plot.X(tx), plot.Y(ty)];
      return g(
        h,
        {},
        ar > 1e-3 ? line(h, [[P2[0][0], base], ...P2, [P2[P2.length - 1][0], base]], { closed: true, fill: rgbaHex(hexCol, 0.22 * ar), stroke: "none" }) : null,
        strokeLine(h, P2, col, lw, 1, dash),
        props.tip() > 1e-3 ? circle(h, tip[0], tip[1], 40, 40, { fill: rgbaHex(hexCol, 0.25 * props.tip()) }) : null,
        tr > 1e-3 ? g(
          h,
          { op: tr },
          h("polyline", { points: `${tp[0]},${plot.Y(plot.y0)} ${tp[0]},${tp[1]} ${plot.X(plot.x0)},${tp[1]}`, fill: "none", stroke: P.muted, strokeWidth: 3, strokeDasharray: "10 8" }),
          circle(h, tp[0], tp[1], 22, 22, { fill: hexCol, stroke: P.ink, lw: 2.5 }),
          text(h, `${ty.toFixed(dec)}${unit}`, tp[0] + 22, tp[1] - 26, { size: 26, weight: 800, fill: hexCol, family: SANS, align: "l" })
        ) : null
      );
    },
    box: () => {
      const P2 = Array.from({ length: 41 }, (_, i) => at(i / 40));
      return boundsOf(P2, lw);
    },
    points: {
      start: () => at(0),
      end: () => at(1),
      pen: () => at(props.draw()),
      dot: () => {
        const tx = Math.max(plot.x0, Math.min(plot.x1, props.tx()));
        return [plot.X(tx), plot.Y(yc(f3(tx)))];
      },
      ...fn === "hill" ? { ec50: () => [plot.X(props.ec50()), plot.Y((props.emax() + props.e0()) / 2)], top: () => at(1) } : {}
    },
    pointFn: (name, arg) => name === "x" || name === "t" ? [plot.X(arg), plot.Y(yc(f3(arg)))] : null,
    _toU: toU,
    /** the curve's value at the pen (for numbers that follow it) */
    _value: (t) => {
      const u = props.draw.at(t);
      const x = fx(u);
      return f3(x);
    },
    _dotValue: (t) => f3(Math.max(plot.x0, Math.min(plot.x1, props.tx.at(t))))
  };
}
function makeNumber(o, card) {
  const value = sig(n(o, "value", 0));
  const dec = Math.round(n(o, "decimals", 0));
  const unit = o.opts.unit ?? "";
  const sign = o.opts.sign !== void 0 || card;
  const size = n(o, "fontsize", card ? 56 : 44);
  const fam = font(o.opts.font);
  if (!o.opts.color) o.base.color = csig(card ? P.volt : P.ink);
  const fmt = (v) => {
    const r = Math.abs(v) < 0.5 * Math.pow(10, -dec) ? 0 : v;
    return `${sign && r > 0 ? "+" : ""}${r < 0 ? "\u2212" : ""}${Math.abs(r).toFixed(dec)}${unit}`;
  };
  const widest = () => Math.max(...["8888".slice(0, 2 + dec), "-888"].map((s) => textItem(`${sign ? "+" : ""}${s}${unit}`, { size, fill: P.ink, weight: 800, family: fam }).w));
  const seed = o.seed;
  return {
    props: { value },
    draw: (h) => {
      const it = textItem(fmt(value()), { size, fill: o.base.color(), weight: 800, family: fam });
      if (!card) return it.draw(h, 0, 0);
      const W = widest() + 56, Ht = size * 1.2 + 34;
      return g(h, {}, line(h, tornPoints(W, Ht, seed, "b"), { closed: true, fill: P.card, shadow: true }), it.draw(h, 0, 0));
    },
    box: () => card ? { cx: 0, cy: 0, w: widest() + 56, h: size * 1.2 + 34 } : { cx: 0, cy: 0, w: widest(), h: size * 1.2 }
  };
}
var ORDER = 0;
function resetOrder() {
  ORDER = 0;
}
function makeObj(type, name, line_, ctx2, parent) {
  const def = TYPES[type];
  const seed = Math.round(Math.abs(hash(name)) % 1e5) + 1;
  const deco = () => ({ end: sig(0), op: sig(1) });
  const base = {
    name,
    type,
    line: line_,
    order: ORDER++,
    x: sig(0),
    y: sig(0),
    s: sig(1),
    rot: sig(0),
    op: sig(0),
    dim: sig(1),
    drift: sig(0),
    flip: 1,
    sx: sig(1),
    sy: sig(1),
    wipe: sig(1),
    wipeDir: "left",
    ink: sig(1),
    color: csig(P.ink),
    layer: 0,
    parent,
    children: [],
    props: {},
    deco: { hl: deco(), pen: deco(), ul: deco(), strike: deco(), cross: deco() },
    box: () => ({ cx: 0, cy: 0, w: 0, h: 0 }),
    points: {},
    draw: () => null,
    seed
  };
  if (ctx2.opts.color) base.color = csig(color(ctx2.opts.color));
  const made = def.make({ text: ctx2.text, opts: ctx2.opts, env: ctx2.env, seed, base, parent });
  Object.assign(base, made, { points: { ...made.points ?? {} } });
  base.props = made.props ?? {};
  if (ctx2.opts.flip !== void 0) base.flip = -1;
  const b = () => base.box();
  const std = {
    centre: () => [b().cx, b().cy],
    center: () => [b().cx, b().cy],
    left: () => [b().cx - b().w / 2, b().cy],
    right: () => [b().cx + b().w / 2, b().cy],
    top: () => [b().cx, b().cy - b().h / 2],
    bottom: () => [b().cx, b().cy + b().h / 2],
    "top-left": () => [b().cx - b().w / 2, b().cy - b().h / 2],
    "top-right": () => [b().cx + b().w / 2, b().cy - b().h / 2],
    "bottom-left": () => [b().cx - b().w / 2, b().cy + b().h / 2],
    "bottom-right": () => [b().cx + b().w / 2, b().cy + b().h / 2]
  };
  for (const [k, f3] of Object.entries(std)) if (!base.points[k]) base.points[k] = f3;
  return base;
}
function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h;
}
function toStage(o, p, t) {
  let [x, y] = p;
  for (let c = o; c; c = c.parent) {
    const s = c.s.at(t), r = c.rot.at(t) * Math.PI / 180;
    x *= s * c.flip * c.sx.at(t);
    y *= s * c.sy.at(t);
    [x, y] = [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
    x += c.x.at(t);
    y += c.y.at(t);
  }
  return [x, y];
}
function toParent(o, p, t) {
  const chain2 = [];
  for (let c = o.parent; c; c = c.parent) chain2.unshift(c);
  let [x, y] = p;
  for (const c of chain2) {
    x -= c.x.at(t);
    y -= c.y.at(t);
    const r = -c.rot.at(t) * Math.PI / 180;
    [x, y] = [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
    const s = c.s.at(t);
    x /= s * c.flip * c.sx.at(t);
    y /= s * c.sy.at(t);
  }
  return [x, y];
}
var SHAPES = /* @__PURE__ */ new Set(["path", "line", "polyline", "polygon", "circle", "ellipse", "rect"]);
function inkTree(el, k) {
  if (Array.isArray(el)) return el.map((e2) => inkTree(e2, k));
  if (!import_react.default.isValidElement(el)) return el;
  const e = el;
  const pr = e.props ?? {};
  const kids = pr.children !== void 0 ? import_react.default.Children.map(pr.children, (c) => inkTree(c, k)) : void 0;
  const fillK = Math.max(0, Math.min(1, (k - 0.55) / 0.45));
  if (SHAPES.has(e.type)) {
    const strokeK = Math.min(1, k / 0.7);
    const hasStroke = pr.stroke && pr.stroke !== "none";
    return import_react.default.cloneElement(e, {
      ...hasStroke ? { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - strokeK } : {},
      fillOpacity: (pr.fillOpacity ?? 1) * (hasStroke ? fillK : Math.min(1, k * 1.4))
    }, kids);
  }
  if (e.type === "text") return import_react.default.cloneElement(e, { opacity: (pr.opacity ?? 1) * fillK }, kids);
  if (pr.dangerouslySetInnerHTML) return import_react.default.cloneElement(e, { opacity: k });
  return kids !== void 0 ? import_react.default.cloneElement(e, {}, kids) : e;
}
var clipN = 0;
var penCache = /* @__PURE__ */ new Map();
function drawObj(h, o) {
  const op = o.op() * o.dim();
  if (op <= 1e-4) return null;
  const t = now();
  const dr = o.drift();
  const dx = dr ? dr * Math.sin(t * 1.3 * Math.PI + o.seed) : 0, dy = dr ? dr * Math.cos(t * 1.1 * Math.PI + o.seed * 1.7) : 0;
  const bx = o.box();
  const d = o.deco;
  const hl = d.hl.end(), pe = d.pen.end(), ul = d.ul.end(), st = d.strike.end(), cr = d.cross.end();
  const kids = [...o.children].sort((a, b) => a.layer - b.layer || a.order - b.order);
  const inner = g(
    h,
    {},
    hl > 1e-3 ? line(h, [[bx.cx - bx.w / 2 + 2, bx.cy + 3], [bx.cx - bx.w / 2 + 2 + (bx.w - 4) * hl, bx.cy + 3]], { stroke: P.hl, w: Math.max(20, Math.min(bx.h * 0.7, 80)), op: 0.62 * d.hl.op() }) : null,
    (() => {
      const ik2 = o.ink();
      return ik2 >= 0.999 ? o.draw(h) : ik2 <= 1e-3 ? null : inkTree(o.draw(h), ik2);
    })(),
    kids.map((k) => drawObj(h, k)),
    ul > 1e-3 ? line(h, [[bx.cx - bx.w / 2, bx.cy + bx.h / 2 + 6], [bx.cx + bx.w / 2, bx.cy + bx.h / 2 + 2]], { stroke: P.pen, w: 5, cap: "round", end: ul, op: d.ul.op() }) : null,
    st > 1e-3 ? line(h, [[bx.cx - bx.w / 2 - 6, bx.cy + 2], [bx.cx + bx.w / 2 + 6, bx.cy - 2]], { stroke: P.pen, w: 6, cap: "round", end: st, op: d.strike.op() }) : null,
    cr > 1e-3 ? g(
      h,
      { op: d.cross.op() },
      line(h, [[bx.cx - bx.w / 2, bx.cy - bx.h / 2], [bx.cx + bx.w / 2, bx.cy + bx.h / 2]], { stroke: P.pen, w: 12, cap: "round", end: Math.min(1, cr * 2) }),
      cr > 0.5 ? line(h, [[bx.cx + bx.w / 2, bx.cy - bx.h / 2], [bx.cx - bx.w / 2, bx.cy + bx.h / 2]], { stroke: P.pen, w: 12, cap: "round", end: (cr - 0.5) * 2 }) : null
    ) : null,
    pe > 1e-3 ? (() => {
      const key = `${o.seed}:${bx.w.toFixed(0)}x${bx.h.toFixed(0)}`;
      let pts2 = penCache.get(key);
      if (!pts2) penCache.set(key, pts2 = penLoop(bx.w / 2 + 16, bx.h / 2 + 10, o.seed).main);
      return line(h, pts2.map(([a, b]) => [a + bx.cx, b + bx.cy]), { stroke: P.pen, w: 4, cap: "round", join: "round", end: pe, op: d.pen.op() });
    })() : null
  );
  const wp = o.wipe();
  let shown = inner;
  if (wp < 0.999) {
    if (wp <= 1e-3) return null;
    const pad = 30, x0 = bx.cx - bx.w / 2 - pad, y0 = bx.cy - bx.h / 2 - pad, W = bx.w + 2 * pad, H = bx.h + 2 * pad;
    const dir2 = o.wipeDir;
    const r = dir2 === "right" ? { x: x0 + W * (1 - wp), y: y0, width: W * wp, height: H } : dir2 === "top" ? { x: x0, y: y0, width: W, height: H * wp } : dir2 === "bottom" ? { x: x0, y: y0 + H * (1 - wp), width: W, height: H * wp } : { x: x0, y: y0, width: W * wp, height: H };
    const id = `mic-wipe-${o.seed}-${clipN = (clipN + 1) % 1e6}`;
    shown = h("g", {}, h("clipPath", { id }, h("rect", r)), h("g", { clipPath: `url(#${id})` }, inner));
  }
  const sx = o.sx() * o.flip, sy = o.sy();
  return g(
    h,
    { x: o.x() + dx, y: o.y() + dy, rot: o.rot(), s: o.s(), op },
    sx !== 1 || sy !== 1 ? h("g", { transform: `scale(${sx} ${sy})` }, shown) : shown
  );
}

// src/mic/cues.ts
var WPM = 150;
var WPS = WPM / 60;
var LEAD = 0.4;
var TAIL = 0.8;
var NUMS = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  twenty: "20",
  thirty: "30",
  forty: "40",
  fifty: "50",
  sixty: "60",
  seventy: "70",
  eighty: "80",
  ninety: "90",
  hundred: "100"
};
var SPOKEN = { "na\u207A": ["sodium"], "k\u207A": ["potassium"], "cl\u207B": ["chloride"], "ca\xB2\u207A": ["calcium"], "na\u207A/k\u207A": ["sodium", "potassium"] };
function toks(w) {
  const lw = w.toLowerCase().replace(/[()"“”]/g, "");
  const out = [];
  for (let part of lw.replace(/−/g, " minus ").replace(/–/g, "-").split(/[\s—/]+|(?<=\w)-(?=\w)/)) {
    if (!part) continue;
    const sp = SPOKEN[part.replace(/[.,;:!?]+$/, "")];
    if (sp) {
      out.push(...sp);
      continue;
    }
    part = part.replace(/^-+/, "");
    for (const p of part.split("-")) {
      const n2 = p.replace(/[^\p{L}\p{N}%.']/gu, "").replace(/\.+$/, "");
      if (n2) out.push(NUMS[n2] ?? n2);
    }
  }
  return out;
}
function similar(a, b) {
  if (!a || !b) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
}
function find(flat2, needle, fuzzy) {
  const want = toks(needle);
  if (!want.length) return -1;
  for (let i = 0; i + want.length <= flat2.length; i++) if (want.every((w, j) => flat2[i + j].startsWith(w))) return i;
  if (!fuzzy) return -1;
  let best = 0, at = -1;
  for (let i = 0; i + want.length <= flat2.length; i++) {
    const r = want.reduce((a, w, j) => a + similar(flat2[i + j], w), 0) / want.length;
    if (r > best) {
      best = r;
      at = i;
    }
  }
  if (best >= 0.75) return at;
  const first = flat2.map((w, i) => [w, i]).filter(([w]) => w.startsWith(want[0]));
  return first.length === 1 ? first[0][1] : -1;
}
function clocks(beats, timings2) {
  const out = [];
  let t = 0;
  for (const b of beats) {
    const script = toks(b.text.replace(/\[[^\]]*\]/g, " "));
    const pause = /\[pause\]/i.test(b.text) ? 1.2 : 0;
    const tm = timings2?.beats?.[b.id];
    if (tm) {
      const flat2 = [];
      for (const [w, s, e] of tm.words) {
        const k = toks(w);
        k.forEach((x, i) => {
          if (/^\.\d/.test(x) && flat2.length) flat2[flat2.length - 1].w += x;
          else flat2.push({ w: x, s: s + (e - s) * i / k.length });
        });
      }
      const s0 = tm.speech_start ?? 0, s1 = tm.speech_end ?? tm.duration;
      const len = b.length ?? tm.duration + (b.extra ?? 0);
      out.push({ id: b.id, start: t, length: len, speechEnd: s1, audio: true, words: tm.words.map(([w, s]) => ({ w: w.trim(), t: s })), cue: (words) => {
        const i = find(flat2.map((f3) => f3.w), words, true);
        if (i >= 0) return { t: flat2[i].s, heard: true };
        const j = find(script, words, false);
        if (j < 0) return null;
        return { t: s0 + j / Math.max(1, script.length) * (s1 - s0), heard: false };
      } });
      t += len;
    } else {
      const speech = script.length / WPS + pause;
      const length = b.length ?? (script.length ? LEAD + speech + TAIL : 1.2) + (b.extra ?? 0);
      const est = [];
      let k = 0;
      for (const w of b.text.replace(/\[[^\]]*\]/g, " ").split(/\s+/).filter(Boolean)) {
        est.push({ w, t: LEAD + k / WPS });
        k += Math.max(1, toks(w).length);
      }
      out.push({ id: b.id, start: t, length, speechEnd: LEAD + speech, audio: false, words: est, cue: (words) => {
        const j = find(script, words, false);
        return j < 0 ? null : { t: LEAD + j / WPS, heard: true };
      } });
      t += length;
    }
  }
  return out;
}

// src/mic/build.ts
var PAGE_SIZES = {
  wide: [1920, 1080],
  youtube: [1920, 1080],
  "16:9": [1920, 1080],
  short: [1080, 1920],
  reel: [1080, 1920],
  tiktok: [1080, 1920],
  vertical: [1080, 1920],
  "9:16": [1080, 1920],
  square: [1080, 1080],
  "1:1": [1080, 1080],
  portrait: [1080, 1350],
  "4:5": [1080, 1350],
  "4:3": [1440, 1080]
};
var D = (c, dflt) => c.line.opts.in !== void 0 ? dur(c.line.opts.in) : c.line.opts.for !== void 0 ? dur(c.line.opts.for) : dflt;
var E = (c, dflt) => ease(c.line.opts.ease, dflt);
var each = (c, f3) => {
  if (!c.targets.length) throw new Error(`"${c.line.verb}" needs something to act on, like: ${c.line.verb} ap`);
  const st = c.line.opts.stagger !== void 0 ? c.line.opts.stagger ? dur(c.line.opts.stagger) : 0.12 : 0;
  return Math.max(c.start, ...c.targets.map((o, i) => f3(o)(c.start + i * st)));
};
var scaleAt = (o, t) => o.s.at(t);
function appear(o, how, c) {
  const run = D(c, T.in);
  const target = c.line.opts.opacity !== void 0 ? num(c.line.opts.opacity, c.b.env) : 1;
  switch (how) {
    case "grow":
      return (s) => {
        const k = scaleAt(o, s) || 1;
        return chain(o.s.set(0), o.op.set(target), o.s.to(k, c.line.opts.in ? run : 0.55, easeOutBack))(s);
      };
    case "rise":
      return (s) => {
        const y0 = o.y.at(s);
        return Math.max(o.y.set(y0 + 14)(s), o.op.to(target, run, easeOutCubic)(s), o.y.to(y0, run, easeOutCubic)(s));
      };
    case "fade":
    case "fadein":
      return o.op.to(target, run, easeOutCubic);
    case "none":
    case "set":
      return o.op.set(target);
    default:
      return (s) => {
        const k = scaleAt(o, s) || 1;
        return Math.max(o.s.set(k * 0.94)(s), o.op.to(target, run, easeOutCubic)(s), o.s.to(k, run, easeOutCubic)(s));
      };
  }
}
var VERBS = {};
var verb = (name, group2, desc, example, run) => VERBS[name] = { name, group: group2, desc, example, run };
verb("show", "Arrive and leave", "appear (fade in with a small settle)", "show cell", (c) => each(c, (o) => appear(o, "pop", c)));
verb("pop", "Arrive and leave", "same as show", "pop label1", (c) => each(c, (o) => appear(o, "pop", c)));
verb("grow", "Arrive and leave", "grow from nothing with a small overshoot", "grow cell", (c) => each(c, (o) => appear(o, "grow", c)));
verb("rise", "Arrive and leave", "fade in while lifting 14 px (labels)", "rise q", (c) => each(c, (o) => appear(o, "rise", c)));
verb("fadein", "Arrive and leave", "plain fade in", "fadein ions", (c) => each(c, (o) => appear(o, "fade", c)));
verb("hide", "Arrive and leave", "fade out", "hide cell", (c) => each(c, (o) => o.op.to(0, D(c, T.out), easeInCubic)));
verb("fade", "Arrive and leave", "fade out, or to an opacity: fade cell to=0.35", "fade cell to=0.35", (c) => each(c, (o) => o.op.to(c.line.opts.to !== void 0 ? num(c.line.opts.to, c.b.env) : 0, D(c, T.out), E(c, easeInOutCubic))));
verb("lift", "Arrive and leave", "lift away: shrink a little while fading (old pictures leaving)", "lift card1", (c) => each(c, (o) => (s) => Math.max(o.s.to(o.s.at(s) * 0.88, D(c, 0.5), easeInOutCubic)(s), o.op.to(0, D(c, 0.5), easeInOutCubic)(s))));
verb("slide", "Arrive and leave", "slide in from an edge (from=bottom|top|left|right), or out (out=bottom...)", "slide card from=bottom", (c) => each(c, (o) => (s) => {
  const dir2 = (c.line.opts.from ?? c.line.opts.out ?? "bottom").toLowerCase();
  const off = dir2.startsWith("t") ? [0, -1200] : dir2.startsWith("l") ? [-2100, 0] : dir2.startsWith("r") ? [2100, 0] : [0, 1200];
  const x0 = o.x.at(s), y0 = o.y.at(s), run = D(c, T.move * 1.2);
  if (c.line.opts.out) return Math.max(o.x.to(x0 + off[0], run, easeInCubic)(s), o.y.to(y0 + off[1], run, easeInCubic)(s));
  return Math.max(o.x.set(x0 + off[0])(s), o.y.set(y0 + off[1])(s), o.op.set(1)(s), o.x.to(x0, run, easeOutCubic)(s), o.y.to(y0, run, easeOutCubic)(s));
}));
verb("clear", "Arrive and leave", "fade out everything on screen (a clean page)", "clear", (c) => {
  const t = c.start;
  return Math.max(t, ...[...c.b.objs.values()].filter((o) => !o.parent && o.op.at(t) > 1e-3).map((o) => o.op.to(0, D(c, T.out), easeInCubic)(t)));
});
verb("draw", "Draw", "draw on a trace (to=peak), a curve (to=10, to=ec50; keep leaves the halo), a line, arrow or shape", "draw ap to=peak in=0.8s", (c) => each(c, (o) => (s) => {
  o.op.at(s) < 0.999 && o.op.set(1)(s);
  if (o.type === "trace") {
    const times = o._times;
    const to = c.line.opts.to ?? "end";
    const ms = times[to.toLowerCase()] ?? num(to, c.b.env);
    const from = o.props.draw.at(s);
    if (c.line.opts.from !== void 0) o.props.draw.set(times[c.line.opts.from] ?? num(c.line.opts.from, c.b.env))(s);
    return o.props.draw.to(ms, D(c, Math.max(0.4, Math.abs(ms - from) * 0.35)), E(c, linear))(s);
  }
  if (o.type === "curve") {
    const toU = o._toU;
    const tgt = c.line.opts.to;
    const u = tgt === void 0 || tgt === "end" ? 1 : tgt === "ec50" && o.props.ec50 ? toU(o.props.ec50.at(s)) : toU(num(tgt, c.b.env));
    const from = o.props.draw.at(s) >= 0.999 ? 0 : o.props.draw.at(s);
    const run = D(c, Math.max(0.5, Math.abs(u - from) * 1.6));
    return chain(o.props.draw.set(from), o.props.tip.to(1, 0.15), o.props.draw.to(Math.max(0, Math.min(1, u)), run, E(c, easeInOutSine)), c.line.opts.keep !== void 0 ? (x) => x : o.props.tip.to(0, 0.3))(s);
  }
  if (o.props.end && o.type !== "shape") return chain(o.props.end.set(0), o.props.end.to(1, D(c, 0.9), E(c, easeInOutCubic)))(s);
  return chain(o.ink.set(0), o.ink.to(1, D(c, 1.1), E(c, easeInOutSine)))(s);
}));
verb("erase", "Draw", "undraw it (the pen in reverse; a trace fades)", "erase a1", (c) => each(c, (o) => o.type === "trace" ? o.op.to(0, D(c, T.out), easeInCubic) : o.props.end && o.type !== "shape" ? o.props.end.to(0, D(c, 0.6), E(c, easeInOutCubic)) : o.ink.to(0, D(c, 0.7), E(c, easeInOutSine))));
verb("wipe", "Draw", "reveal it with a sweep from one side, like a highlighter or marker stroke: wipe hl from=left (also right, top, bottom); wipe x out hides it the same way", "wipe mark from=left in=0.4s", (c) => each(c, (o) => (s) => {
  const out = c.line.args.some((a) => /^out$/i.test(a.text)) || c.line.opts.out !== void 0;
  o.wipeDir = (c.line.opts.from ?? c.line.opts.out ?? "left").toLowerCase().replace(/^l.*/, "left").replace(/^r.*/, "right").replace(/^t.*/, "top").replace(/^b.*/, "bottom");
  if (out) return o.wipe.to(0, D(c, 0.4), E(c, easeInOutCubic))(s);
  return chain(o.op.set(o.op.at(s) > 1e-3 ? o.op.at(s) : 1), o.wipe.set(0), o.wipe.to(1, D(c, 0.45), E(c, easeOutCubic)))(s);
}));
verb("write", "Draw", "write text on letter by letter", "write q in=1.2s", (c) => each(c, (o) => {
  if (!o.chars) throw new Error(`"write" works on text; "${o.name}" is a ${o.type}`);
  return chain(o.op.set(1), o.chars.set(0), o.chars.to(1, D(c, 0.9), linear));
}));
verb("pulse", "Attention", "a short attention pulse (scale up and back)", "pulse ap", (c) => each(c, (o) => (s) => {
  const k = o.s.at(s), m = c.line.opts.by ? num(c.line.opts.by, c.b.env) : 1.12;
  return chain(o.s.to(k * m, 0.18, easeOutCubic), o.s.to(k, 0.3, easeInOutCubic))(s);
}));
verb("pen loop", "Attention", "circle it in red pen, drawn like a hand", "pen loop cell", (c) => each(c, (o) => chain(o.deco.pen.op.set(1), o.deco.pen.end.set(0), o.deco.pen.end.to(1, D(c, T.pen), easeInOutCubic))));
verb("pen circle", "Attention", "same as pen loop", "pen circle cell", (c) => VERBS["pen loop"].run(c));
verb("underline", "Attention", "underline in red pen", "underline q", (c) => each(c, (o) => chain(o.deco.ul.op.set(1), o.deco.ul.end.set(0), o.deco.ul.end.to(1, D(c, 0.45), easeInOutCubic))));
verb("strike", "Attention", "strike through in red pen", "strike guess", (c) => each(c, (o) => chain(o.deco.strike.op.set(1), o.deco.strike.end.set(0), o.deco.strike.end.to(1, D(c, 0.4), easeInOutCubic))));
verb("cross out", "Attention", "a big red X over it", "cross out zeroCard", (c) => each(c, (o) => chain(o.deco.cross.op.set(1), o.deco.cross.end.set(0), o.deco.cross.end.to(1, D(c, 0.6), easeInOutCubic))));
verb("highlight", "Attention", "pink highlighter swipe behind it", "highlight q", (c) => each(c, (o) => chain(o.deco.hl.op.set(1), o.deco.hl.end.set(0), o.deco.hl.end.to(1, D(c, T.hl), easeOutCubic))));
verb("unmark", "Attention", "take off pen loops, highlights, underlines and crosses", "unmark q", (c) => each(c, (o) => (s) => Math.max(...Object.values(o.deco).map((d) => d.op.to(0, D(c, T.out), easeInCubic)(s)))));
verb("spotlight", "Attention", "everything else fades to 0.35; spotlight off brings it back", "spotlight ap cell", (c) => {
  const t = c.start, run = D(c, T.focus);
  const off = c.line.args.some((a) => /^(off|all|none)$/i.test(a.text));
  const keep = new Set(c.targets);
  const related = (o) => keep.has(o) ? "target" : o.children.some((k) => related(k) !== "no") ? "ancestor" : "no";
  let end = t;
  const walk = (list) => {
    for (const o of list) {
      if (off) {
        end = Math.max(end, o.dim.to(1, run, easeOutCubic)(t));
        walk(o.children);
        continue;
      }
      const r = related(o);
      end = Math.max(end, o.dim.to(r === "no" ? DIM : 1, run, easeOutCubic)(t));
      if (r === "ancestor") walk(o.children);
      else for (const k of o.children) end = Math.max(end, k.dim.to(1, run, easeOutCubic)(t));
    }
  };
  walk(c.b.roots());
  return end;
});
verb("label", "Attention", 'a label with a pointer to a point: label ap.peak "+54 mV" side=right', 'label ap.peak "+54 mV" side=right color=blue as=peakLabel', (c) => {
  const a = c.line.args;
  const where = c.line.opts.near ?? a.find((x) => x.kind === "word")?.text;
  const words = a.find((x) => x.kind === "str")?.text ?? c.line.opts.text;
  if (!where || words === void 0) throw new Error('write it like: label ap.peak "+54 mV" side=right');
  const p = point(where, c.b.env);
  const side = (c.line.opts.side ?? "right").toLowerCase();
  const dist = c.line.opts.dist ? num(c.line.opts.dist, c.b.env) : 130;
  const size = c.line.opts.fontsize ? num(c.line.opts.fontsize, c.b.env) : FSZ.label + 6;
  const col = c.line.opts.color ? color(c.line.opts.color) : P.ink;
  const off = side.startsWith("l") ? [-dist, -dist * 0.35] : side.startsWith("a") || side.startsWith("t") ? [0, -dist] : side.startsWith("b") ? [0, dist] : [dist, -dist * 0.35];
  const align = side.startsWith("l") ? "r" : side.startsWith("r") ? "l" : "c";
  const name = c.line.opts.as ?? `label${++c.b.labels}`;
  const lead = sig(0);
  const tx = off[0], ty = off[1];
  const st = align === "l" ? [tx - 10, ty] : align === "r" ? [tx + 10, ty] : [tx, ty + (ty < 0 ? 1 : -1) * size * 0.8];
  const o = c.b.addObj("group", name, c.line.n, "", {}, null);
  o.type = "label";
  o.draw = (h) => g(
    h,
    {},
    text(h, words, tx, ty, { size, weight: 700, fill: col, family: SANS, align }),
    lead() > 1e-3 ? line(h, [st, [st[0] + (0 - st[0]) * lead(), st[1] + (0 - st[1]) * lead()]], { stroke: col, w: 2.5, cap: "round" }) : null,
    lead() > 0.95 ? circle(h, 0, 0, 12, 12, { fill: col }) : null
  );
  o.box = () => ({ cx: tx, cy: ty, w: Math.max(60, words.length * size * 0.55), h: size * 1.3 });
  o.x.set(p[0])(0);
  o.y.set(p[1])(0);
  if (c.line.opts.follow !== void 0 && c.b.env.live) {
    const lv = c.b.env.live(where);
    o.x.follow((t) => lv(t)[0]);
    o.y.follow((t) => lv(t)[1]);
  }
  return chain((s) => Math.max(o.y.set(p[1] + 14)(s), o.op.to(1, T.in, easeOutCubic)(s), o.y.to(p[1], T.in, easeOutCubic)(s)), lead.to(1, 0.4, easeInOutCubic))(c.start);
});
verb("to", "Change", "animate any property: to cell at=200,0 size=0.8 opacity=0.5 color=blue in=1s", "to cell at=200,0 size=0.8 in=1s", (c) => each(c, (o) => (s) => c.b.setProps(o, c.line.opts, s, D(c, T.move), E(c, easeInOutCubic))));
verb("set", "Change", "change properties instantly (no animation)", "set cell size=0.5 opacity=0", (c) => each(c, (o) => (s) => c.b.setProps(o, c.line.opts, s, 0, linear)));
verb("roll", "Change", "roll a number to a new value", "roll v to=54 in=1.2s", (c) => each(c, (o) => {
  if (!o.props.value) throw new Error(`"roll" works on a number or readout; "${o.name}" is a ${o.type}`);
  if (c.line.opts.to === void 0) throw new Error("roll needs to=..., like: roll v to=54");
  return o.props.value.to(num(c.line.opts.to, c.b.env), D(c, 1.2), E(c, easeInOutCubic));
}));
verb("swap", "Change", 'crossfade text, maths or a card to new words: swap q "new words"', 'swap eq "\\frac{2804}{375}"', (c) => each(c, (o) => (s) => {
  if (!o.swap) throw new Error(`"swap" works on text, math or a card; "${o.name}" is a ${o.type}`);
  const words = c.line.args.find((x) => x.kind === "str")?.text;
  if (words === void 0) throw new Error("swap needs the new words in quotes");
  const d = D(c, 0.5);
  o.swap(words, s, d);
  return s + d;
}));
verb("fill", "Change", "drop values into a maths slot, highlighted as they land: fill eq ko=4 ki=140", "fill nernst ko=4 ki=140", (c) => each(c, (o) => (s) => {
  const slots = o._slots, fillIn = o._fill;
  if (!slots || !o.swap) throw new Error(`"fill" works on maths with #slots; "${o.name}" is a ${o.type}`);
  const keys = Object.keys(slots), vals = { ...slots }, changed = [];
  for (const [k, v] of Object.entries(c.line.opts)) {
    if (["in", "ease", "hold", "for"].includes(k)) continue;
    const real = keys.find((x) => x.toLowerCase() === k);
    if (!real) throw new Error(`"${o.name}" has no slot "${k}". Its slots: ${keys.join(", ") || "none (mark them with #name)"}`);
    vals[real] = v;
    changed.push(real);
  }
  if (!changed.length) throw new Error("fill needs slot=value, like: fill nernst ko=4");
  const d = D(c, 0.4), hold = c.line.opts.hold !== void 0 ? dur(c.line.opts.hold) : 0.8;
  o.swap(fillIn(vals, changed), s, d);
  o.swap(fillIn(vals), s + d + hold, 0.5);
  Object.assign(slots, vals);
  return s + d + hold + 0.5;
}));
verb("travel", "Motion", 'move along points: travel n1 via="0,-100 0,100" to=0,240 in=1.5s (smooth: a curve through them; bend=0.3: one curve; turn: face the way it goes)', "travel n1 via=pore.top to=pore.bottom in=1.2s", (c) => each(c, (o) => (s) => {
  const t = s;
  const pts2 = [...c.line.opts.via ? points(c.line.opts.via, c.b.env) : [], ...c.line.opts.to ? [point(c.line.opts.to, c.b.env)] : [], ...c.line.opts.along ? points(c.line.opts.along, c.b.env) : []];
  if (!pts2.length) throw new Error('travel needs to=... (and optionally via="x,y x,y")');
  let local = pts2.map((p) => toParent(o, p, t));
  const from = [o.x.at(t), o.y.at(t)];
  if (c.line.opts.smooth !== void 0 || c.line.opts.bend !== void 0) local = shapePts([from, ...local], c.line.opts, c.b.env).slice(1);
  const legs = [from, ...local];
  const turn = c.line.opts.turn !== void 0;
  const L = legs.slice(1).map((p, i) => Math.hypot(p[0] - legs[i][0], p[1] - legs[i][1]));
  const total = L.reduce((a, b) => a + b, 0) || 1;
  const run = D(c, Math.max(0.6, total / 400));
  const face = (i, at, d) => {
    if (turn) {
      const a = Math.atan2(legs[i + 1][1] - legs[i][1], legs[i + 1][0] - legs[i][0]) * 180 / Math.PI;
      o.rot.to(a, Math.min(0.15, d), linear)(at);
    }
  };
  if (local.length === 1) {
    face(0, t, run);
    return Math.max(o.x.to(local[0][0], run, E(c, easeInOutCubic))(t), o.y.to(local[0][1], run, E(c, easeInOutCubic))(t));
  }
  let cur = t;
  local.forEach((p, i) => {
    const d = run * L[i] / total;
    face(i, cur, d);
    Math.max(o.x.to(p[0], d, linear)(cur), o.y.to(p[1], d, linear)(cur));
    cur += d;
  });
  return cur;
}));
verb("drift", "Motion", "constant life: a slow wander (amount=3); drift x amount=0 stops it", "drift cell amount=3", (c) => each(c, (o) => o.drift.to(c.line.opts.amount ? num(c.line.opts.amount, c.b.env) : 3, D(c, 0.3))));
verb("spin", "Motion", "turn round (turns=1, or by=90 degrees)", "spin loopArrow turns=1 in=2s", (c) => each(c, (o) => (s) => o.rot.to(o.rot.at(s) + (c.line.opts.by ? num(c.line.opts.by, c.b.env) : 360 * (c.line.opts.turns ? num(c.line.opts.turns, c.b.env) : 1)), D(c, 1.2), E(c, easeInOutCubic))(s)));
verb("shake", "Motion", "a quick no-shake (something wrong)", "shake guess", (c) => each(c, (o) => (s) => {
  const r = o.rot.at(s);
  return chain(o.rot.to(r - 5, 0.07), o.rot.to(r + 5, 0.1), o.rot.to(r - 3, 0.1), o.rot.to(r, 0.08))(s);
}));
verb("wait", "Motion", "wait before the next line: wait 1s", "wait 0.5s", (c) => {
  const w = c.line.args[0]?.text ?? c.line.opts.for;
  if (!w) throw new Error("write it like: wait 0.5s");
  return c.start + dur(w);
});
verb("stop", "Loops", "end the loops on a thing: stop heart (stop alone ends every loop). Start one with: loop every=0.8s pulse heart", "stop heart", (c) => c.start);
verb("cover", "Transitions", "a sheet of paper slides over the page (style=slide|tear|fade); change what is underneath, then uncover", "cover style=tear in=0.8s", (c) => c.b.cover(c, true));
verb("uncover", "Transitions", "the sheet slides away, showing the new page", "uncover in=0.8s", (c) => c.b.cover(c, false));
verb("enter", "Host", "the host slides up into the frame", "enter me", (c) => each(c, (o) => hostOf(o).enter(c.line.opts.in ? dur(c.line.opts.in) : 0.7)));
verb("leave", "Host", "the host drops out of the frame", "leave me", (c) => each(c, (o) => hostOf(o).leave(c.line.opts.in ? dur(c.line.opts.in) : 0.5)));
verb("pose", "Host", "the host strikes a pose: idle, wave, point, explain, think, idea, surprised, shrug, calculator, thumbsup (side=left|right)", "pose me point", (c) => each(c, (o) => {
  const name = c.line.args.filter((a) => a.kind === "word").map((a) => a.text).find((w) => !c.b.objs.has(w));
  const poses = ["idle", "wave", "point", "explain", "think", "idea", "surprised", "shrug", "calculator", "thumbsup"];
  if (!name || !poses.includes(name)) throw new Error(`pose: use one of ${poses.join(", ")}`);
  const side = c.line.opts.side ? c.line.opts.side.toLowerCase().startsWith("r") ? "r" : "l" : void 0;
  return hostOf(o).pose(name, side, c.line.opts.in ? dur(c.line.opts.in) : 0.55);
}));
verb("talk", "Host", "the host's mouth moves, in the background (in= how long; default: to the beat's last word)", "talk me", (c) => each(c, (o) => (s) => {
  hostOf(o).talk(c.line.opts.in ? dur(c.line.opts.in) : Math.max(0.5, c.b.speechEnd - s))(s);
  return s;
}));
verb("look", "Host", "the host's eyes turn to a thing or point", "look me at=ap.peak", (c) => each(c, (o) => {
  const p = point(c.line.opts.at ?? c.line.opts.to ?? "0,0", c.b.env);
  const me = toStage(o, [0, -400], c.start);
  const dx = p[0] - me[0], dy = p[1] - me[1], L = Math.hypot(dx, dy) || 1;
  return hostOf(o).look(dx / L, dy / L);
}));
verb("camera", "Camera", "camera focus <thing or point> zoom=1.6  \xB7  camera follow <thing> zoom=1.5 (keeps it centred while it moves; camera stop or reset ends it)  \xB7  camera pan to=x,y  \xB7  camera zoom 1.4  \xB7  camera reset", "camera focus ap.peak zoom=1.6", (c) => {
  const sub = (c.line.args[0]?.text ?? "").toLowerCase();
  const cam = c.b.cam, t = c.start, run = D(c, T.cam);
  const zNow = cam.node.s.at(t);
  const centre = () => [-cam.node.x.at(t) / zNow, -cam.node.y.at(t) / zNow];
  if (sub === "reset" || sub === "stop") {
    c.b.endFollow(t);
    return sub === "reset" ? cam.reset(run)(t) : t;
  }
  if (sub === "follow") {
    const what = c.line.args[1]?.text ?? c.line.opts.on;
    if (!what || !c.b.env.live) throw new Error("camera follow needs a thing, like: camera follow n1 zoom=1.5");
    const z = c.line.opts.zoom ? num(c.line.opts.zoom, c.b.env) : Math.max(zNow, 1.4);
    c.b.endFollow(t);
    c.b.camFollow = { start: t, live: c.b.env.live(what), blend: run };
    cam.node.s.to(z, run)(t);
    return t + run;
  }
  if (sub === "focus" || sub === "frame") {
    const what = c.line.args[1]?.text ?? c.line.opts.on;
    if (!what) throw new Error("camera focus needs a thing or a point, like: camera focus ap.peak");
    const p = point(what, c.b.env);
    return cam.frame(p, c.line.opts.zoom ? num(c.line.opts.zoom, c.b.env) : Math.max(zNow, 1.4), run)(t);
  }
  if (sub === "pan") return cam.frame(point(c.line.opts.to ?? c.line.args[1]?.text ?? "0,0", c.b.env), zNow, run)(t);
  if (sub === "zoom") return cam.frame(centre(), num(c.line.args[1]?.text ?? c.line.opts.to ?? "1", c.b.env), run)(t);
  throw new Error("camera: use focus, follow, pan, zoom, stop or reset");
});
var rectFill = (h, W, Ht, op) => g(h, { op }, rect(h, 0, 0, W + 80, Ht + 80, { fill: P.paper }), gridLines(h, W, Ht));
function gridLines(h, W, Ht) {
  const ls = [];
  for (let x = -Math.ceil(W / 48) * 24; x <= W / 2 + 24; x += 24) ls.push(h("line", { key: "x" + x, x1: x, y1: -Ht / 2 - 30, x2: x, y2: Ht / 2 + 30, stroke: "rgba(110,130,160,0.13)", strokeWidth: 1.2 }));
  for (let y = -Math.ceil(Ht / 48) * 24; y <= Ht / 2 + 24; y += 24) ls.push(h("line", { key: "y" + y, x1: -W / 2 - 30, y1: y, x2: W / 2 + 30, y2: y, stroke: "rgba(110,130,160,0.13)", strokeWidth: 1.2 }));
  return g(h, {}, ls);
}
var hostOf = (o) => {
  const hst = o._host;
  if (!hst) throw new Error(`"${o.name}" isn't the host (add host me)`);
  return hst;
};
var Builder = class {
  objs = /* @__PURE__ */ new Map();
  cam = makeCamera();
  env;
  vars = {};
  labels = 0;
  t = 0;
  // the script time of the line being built (points are read here)
  page = { w: 1920, h: 1080 };
  speechEnd = 0;
  coverObj = null;
  /** the page-turn sheet: progress 0 (off to the right) .. 1 (covering) .. 2 (gone off to the left) */
  cover(c, on) {
    const style = (c.line.opts.style ?? "slide").toLowerCase();
    if (!this.coverObj) {
      const o2 = this.addObj("group", "page__cover", c.line.n, "", {}, null);
      o2.type = "cover";
      o2.fixed = true;
      o2.layer = 1e4;
      const pr2 = sig(0);
      o2.props = { p: pr2 };
      o2._style = style;
      const W = () => this.page.w, H = () => this.page.h;
      const edge = [];
      const r = prng(97);
      for (let i = 0; i <= 40; i++) edge.push([(r() - 0.5) * 26, -H() / 2 - 20 + i / 40 * (H() + 40)]);
      o2.draw = (h) => {
        const p = pr2(), st = o2._style;
        if (p <= 1e-3 || p >= 1.999) return null;
        if (st === "fade") return rectFill(h, W(), H(), p <= 1 ? p : 2 - p);
        const x = W() * (1 - p);
        const torn = st === "tear";
        return g(
          h,
          { x },
          torn ? line(h, [[-W() / 2, -H() / 2 - 20], ...edge.map(([ex, ey]) => [-W() / 2 + ex, ey]), [-W() / 2, H() / 2 + 20], [W() / 2 + 40, H() / 2 + 20], [W() / 2 + 40, -H() / 2 - 20]], { closed: true, fill: P.paper, shadow: true }) : rect(h, 20, 0, W() + 40, H() + 40, { fill: P.paper }),
          gridLines(h, W(), H()),
          !torn ? line(h, [[-W() / 2, -H() / 2 - 20], [-W() / 2, H() / 2 + 20]], { stroke: "rgba(35,33,30,0.18)", w: 10 }) : null
        );
      };
      o2.op.set(1)(0);
    }
    const o = this.coverObj ?? this.objs.get("page__cover");
    this.coverObj = o;
    o._style = style;
    const pr = o.props.p, run = c.line.opts.in ? dur(c.line.opts.in) : 0.8;
    if (on) return chain(pr.set(0), pr.to(1, run, easeInOutCubic))(c.start);
    return chain(pr.set(1), pr.to(2, run, easeInOutCubic))(c.start);
  }
  camFollow = null;
  /** finish a camera follow at time t: the camera keeps the thing centred from its start until t */
  endFollow(t) {
    const f3 = this.camFollow;
    if (!f3) return;
    this.camFollow = null;
    const node2 = this.cam.node;
    node2.x.followDuring((tt) => -f3.live(tt)[0] * node2.s.at(tt), f3.start, t, f3.blend);
    node2.y.followDuring((tt) => -f3.live(tt)[1] * node2.s.at(tt), f3.start, t, f3.blend);
  }
  constructor(seed = 1) {
    const r = prng(seed);
    this.env = {
      vars: this.vars,
      rand: r,
      point: (ref) => {
        const m = /^([A-Za-z_][\w-]*)\.([\w-]+)(?:\(([^)]*)\))?$/.exec(ref);
        if (!m) return null;
        const o = this.objs.get(m[1]);
        if (!o) return null;
        let p = null;
        if (m[3] !== void 0 && o.pointFn) p = o.pointFn(m[2], num(m[3], this.env));
        else if (o.points[m[2]]) p = o.points[m[2]]();
        if (!p) throw new Error(`"${m[1]}" has no point "${m[2]}". It has: ${Object.keys(o.points).join(", ")}`);
        return toStage(o, p, this.t);
      },
      live: (src) => {
        const m = /^([A-Za-z_][\w-]*)(?:\.([\w-]+)(?:\(([^)]*)\))?)?\s*(?:([+\-])\s*(.+))?$/.exec(src.trim());
        const o = m ? this.objs.get(m[1]) : void 0;
        if (!m || !o) {
          const fixed = point(src, this.env);
          return () => fixed;
        }
        const name = m[2] ?? "centre", arg = m[3] !== void 0 ? num(m[3], this.env) : void 0;
        if (arg === void 0 && !o.points[name]) throw new Error(`"${m[1]}" has no point "${name}". It has: ${Object.keys(o.points).join(", ")}`);
        let dx = 0, dy = 0;
        if (m[4]) {
          const q = point(m[5], this.env);
          const k = m[4] === "-" ? -1 : 1;
          dx = k * q[0];
          dy = k * q[1];
        }
        return (t) => {
          const p = arg !== void 0 && o.pointFn ? o.pointFn(name, arg) ?? [0, 0] : o.points[name]();
          const q = toStage(o, p, t);
          return [q[0] + dx, q[1] + dy];
        };
      }
    };
  }
  roots() {
    return [...this.objs.values()].filter((o) => !o.parent);
  }
  addObj(type, name, n2, text2, opts, parent) {
    if (this.objs.has(name)) throw new Error(`there is already something called "${name}" (line ${this.objs.get(name).line})`);
    const o = makeObj(type, name, n2, { text: text2, opts, env: this.env }, parent);
    this.objs.set(name, o);
    if (parent) parent.children.push(o);
    return o;
  }
  /** apply key=value properties to an object over d seconds from s */
  setProps(o, opts, s, d, e) {
    let end = s;
    const skip = /* @__PURE__ */ new Set(["in", "for", "ease", "as", "hidden", "show", "group", "on", "name", "kind", "text"]);
    const go = (sg, v) => {
      end = Math.max(end, d > 0 ? sg.to(v, d, e)(s) : sg.set(v)(s));
    };
    for (const [k, v] of Object.entries(opts)) {
      if (skip.has(k)) continue;
      switch (k) {
        case "at": {
          const p = toParent(o, point(v, this.env), this.t);
          go(o.x, p[0]);
          go(o.y, p[1]);
          break;
        }
        case "x":
          go(o.x, num(v, this.env));
          break;
        case "y":
          go(o.y, num(v, this.env));
          break;
        case "size":
        case "scale":
          go(o.s, num(v, this.env));
          break;
        case "sx":
        case "stretchx":
        case "widen":
          go(o.sx, num(v, this.env));
          break;
        case "width": {
          const bw = o.box().w * (o.s.at(s) || 1);
          if (bw > 0.5) go(o.sx, num(v, this.env) / bw);
          break;
        }
        case "height": {
          const bh = o.box().h * (o.s.at(s) || 1);
          if (bh > 0.5) go(o.sy, num(v, this.env) / bh);
          break;
        }
        case "sy":
        case "stretchy":
          go(o.sy, num(v, this.env));
          break;
        case "rotate":
        case "tilt":
        case "rot":
          go(o.rot, num(v, this.env));
          break;
        case "opacity":
          go(o.op, num(v, this.env));
          break;
        case "drift":
          go(o.drift, num(v, this.env));
          break;
        case "layer":
          o.layer = num(v, this.env);
          break;
        case "color":
        case "colour":
          end = Math.max(end, o.color.to(color(v), d, e)(s));
          break;
        default: {
          const p = o.props[k];
          if (!p) {
            const names = ["at", "x", "y", "size", "sx", "sy", "rotate", "opacity", "color", "drift", "layer", ...Object.keys(o.props)];
            const near = closest(k, names);
            throw new Error(`"${o.name}" (a ${o.type}) has no "${k}"${near ? `. Did you mean ${near}?` : `. It has: ${names.join(", ")}`}`);
          }
          const times = o._times;
          go(p, times && times[v.toLowerCase()] !== void 0 ? times[v.toLowerCase()] : num(v, this.env));
        }
      }
    }
    return end;
  }
};
function buildMic(source, timings2, o = {}) {
  resetLastEnd();
  resetOrder();
  const lib2 = o.library ? parse(o.library) : null;
  const parsed = parse(source);
  const defines = { ...lib2?.defines ?? {}, ...parsed.defines };
  const makes = { ...lib2?.makes ?? {}, ...parsed.makes };
  const svgs = { ...lib2?.svgs ?? {}, ...parsed.svgs };
  const images = { ...lib2?.images ?? {}, ...parsed.images };
  const errors = [...parsed.errors];
  for (const e of lib2?.errors ?? []) errors.push({ line: 0, msg: `library line ${e.line}: ${e.msg}` });
  const warnings = [];
  const b = new Builder();
  const beatHeads = parsed.items.filter((i) => i.kind === "beat").map((i) => i.beat);
  const seen = /* @__PURE__ */ new Set();
  for (const bh of beatHeads) {
    if (seen.has(bh.id)) errors.push({ line: bh.n, msg: `beat ${bh.id} appears twice` });
    seen.add(bh.id);
  }
  const cl = clocks(beatHeads, timings2);
  const clockOf = new Map(cl.map((c) => [c.id, c]));
  const lines = [];
  let beat = null;
  let prevStart = 0, prevEnd = 0, maxEnd = 0;
  const loops = [];
  const materialize = (lp, until) => {
    let t = lp.start, i = 0;
    while (t < until - 1e-6 && i++ < 3e3) {
      b.t = t;
      const e = exec(lp.line, t, lp.n);
      t = lp.every > 0 ? t + lp.every : Math.max(e, t + 0.05);
    }
  };
  const runLine = (l, nForErrors) => {
    let start;
    const bs = beat ? beat.start : 0;
    let late;
    switch (l.when.kind) {
      case "then":
        start = prevEnd;
        break;
      case "with":
        start = prevStart;
        break;
      case "after":
        start = prevEnd + l.when.d;
        break;
      case "at":
        start = bs + l.when.t;
        break;
      case "end":
        if (!beat) throw new Error('"end" only works inside a beat');
        start = bs + beat.speechEnd + l.when.d;
        break;
      case "on": {
        if (!beat) throw new Error('"on" only works inside a beat (start one with: beat S1-B1 "narration")');
        const q = beat.cue(l.when.words);
        if (!q) throw new Error(`"${l.when.words}" isn't in the narration of ${beat.id}`);
        if (!q.heard) warnings.push({ line: nForErrors, msg: `"${l.when.words}" wasn't heard in the recording of ${beat.id}; using its place in the script. Try a nearby word.` });
        const T0 = bs + q.t + l.when.d;
        if (prevEnd - T0 > 0.25) late = +(prevEnd - T0).toFixed(2);
        start = Math.max(prevEnd, T0);
        break;
      }
    }
    b.t = start;
    let end = start;
    const reps = l.repeat ? l.repeat.n : 1;
    let s = start;
    if (l.loop) {
      const inner = { ...l, loop: void 0, repeat: void 0 };
      b.t = start;
      const first = exec(inner, start, nForErrors);
      loops.push({ line: inner, n: nForErrors, start: l.loop.every > 0 ? start + l.loop.every : Math.max(first, start + 0.05), every: l.loop.every, names: inner.args.filter((a) => a.kind === "word").map((a) => a.text) });
      lines.push({ line: nForErrors, beat: beat?.id ?? null, start, end: first, bg: true });
      prevStart = start;
      prevEnd = start;
      return;
    }
    for (let r = 0; r < reps; r++) {
      b.t = s;
      const e = exec(l, s, nForErrors);
      end = Math.max(end, e);
      s = e + (l.repeat?.every ?? 0);
    }
    lines.push({ line: nForErrors, beat: beat?.id ?? null, start, end, late, bg: l.bg });
    if (late) warnings.push({ line: nForErrors, msg: `starts ${late}s late: the line before is still running when "${l.when.words}" is said. Add & to the long line before, or shorten it.` });
    prevStart = start;
    prevEnd = l.bg ? Math.max(prevEnd, start) : end;
    if (l.bg) prevEnd = start;
    maxEnd = Math.max(maxEnd, end);
  };
  const targetsOf = (l) => {
    const out = [];
    for (const a of l.args) {
      if (a.kind !== "word") continue;
      if (/^(off|all|none|focus|frame|pan|zoom|reset)$/i.test(a.text) && (l.verb === "spotlight" || l.verb === "camera")) continue;
      if (/^[+\-]?\d/.test(a.text)) continue;
      if (/^(keep|out)$/i.test(a.text)) {
        l.opts[a.text.toLowerCase()] = l.opts[a.text.toLowerCase()] ?? "";
        continue;
      }
      if (/^(follow|head|arrow|smooth|turn|straight)$/i.test(a.text)) {
        l.opts[a.text.toLowerCase()] = "";
        continue;
      }
      if (l.verb === "label" || l.verb === "camera" || l.verb === "wait") continue;
      if (l.verb === "pose" && !b.objs.has(a.text)) continue;
      let ob = b.objs.get(a.text);
      if (!ob && a.text.includes(".")) {
        const [i0, c0] = a.text.split(".");
        ob = b.objs.get(`${i0}__${c0}`);
      }
      if (!ob) {
        const near = closest(a.text, [...b.objs.keys()]);
        throw new Error(`no object called "${a.text}"${near ? `. Did you mean ${near}?` : ""}`);
      }
      out.push(ob);
    }
    return out;
  };
  const exec = (l, s, n2) => {
    if (l.verb === "add") return doAdd(l, s, n2);
    if (l.verb === "stop") {
      const names = l.args.filter((a) => a.kind === "word").map((a) => a.text);
      for (const nm of names) if (!b.objs.has(nm)) {
        const near = closest(nm, [...b.objs.keys()]);
        throw new Error(`no object called "${nm}"${near ? `. Did you mean ${near}?` : ""}`);
      }
      for (const lp of [...loops]) if (!names.length || lp.names.some((x) => names.includes(x))) {
        materialize(lp, s);
        loops.splice(loops.indexOf(lp), 1);
      }
      return s;
    }
    const mac = defines[l.verb];
    if (mac) {
      const args = l.args.map((a) => a.text);
      let cur = s;
      let first = true;
      for (const bl of mac.body) {
        let src = bl.src;
        mac.params.forEach((p, i) => {
          if (args[i] !== void 0) src = src.replace(new RegExp(`\\b${p}\\b`, "g"), args[i]);
        });
        const inner = parseLine(n2, src);
        if (!inner) continue;
        const saved = [prevStart, prevEnd];
        if (first) {
          prevStart = s;
          prevEnd = s;
        }
        first = false;
        let st = prevEnd;
        if (inner.when.kind === "with") st = prevStart;
        else if (inner.when.kind === "after") st = prevEnd + inner.when.d;
        b.t = st;
        const e = exec(inner, st, n2);
        prevStart = st;
        prevEnd = inner.bg ? st : e;
        cur = Math.max(cur, e);
        void saved;
      }
      return cur;
    }
    const v = VERBS[l.verb];
    if (!v) {
      const near = closest(l.verb, [...Object.keys(VERBS), ...Object.keys(defines), "add"]);
      throw new Error(`"${l.verb}" isn't a verb${near ? `. Did you mean ${near}?` : ""}`);
    }
    return v.run({ line: l, targets: targetsOf(l), start: s, b });
  };
  const follow = (target, expr, ctx2) => {
    const val = (t) => {
      const saved = {};
      for (const [k, sg] of Object.entries(ctx2.params)) {
        saved[k] = b.vars[k];
        b.vars[k] = sg.at(t);
      }
      try {
        return num(expr, b.env);
      } finally {
        for (const [k, v] of Object.entries(saved)) {
          if (v === void 0) delete b.vars[k];
          else b.vars[k] = v;
        }
      }
    };
    target.follow(val);
  };
  const usesParam = (v, ctx2) => !!ctx2 && Object.keys(ctx2.params).some((p) => new RegExp(`(^|[^\\w.])${p}($|[^\\w])`).test(v));
  const splitPair = (v) => {
    let d = 0;
    for (let i = 0; i < v.length; i++) {
      if (v[i] === "(") d++;
      else if (v[i] === ")") d--;
      else if (v[i] === "," && !d) return [v.slice(0, i), v.slice(i + 1)];
    }
    return null;
  };
  const doMake = (mk, l, s, n2, words, opts, mctx) => {
    let name = words[1] ?? `${mk.name}${b.objs.size + 1}`;
    if (!/^[A-Za-z_][\w-]*$/.test(name)) throw new Error(`"${name}" can't be a name`);
    if (mctx) name = mctx.prefix + name;
    const parent = mctx ? mctx.parent : opts.group ? b.objs.get(opts.group) ?? null : null;
    const inst = b.addObj("group", name, n2, "", {}, parent);
    inst.type = mk.name;
    const params = {};
    for (const [k, d] of Object.entries(mk.params)) params[k] = sig(opts[k] !== void 0 ? num(opts[k], b.env) : num(d, b.env));
    inst.props = params;
    const ctx2 = { parent: inst, prefix: `${name}__`, params };
    const kids = [];
    for (const bl of mk.body) {
      const inner = parseLine(bl.n, bl.src);
      if (!inner) continue;
      if (inner.verb !== "add") throw new Error(`inside make ${mk.name} (line ${bl.n}) only "add" lines work`);
      try {
        doAdd(inner, 0, bl.n, ctx2);
      } catch (e) {
        throw new Error(`make ${mk.name}, line ${bl.n}: ${e.message}`);
      }
      const cw = inner.args.filter((a) => a.kind === "word")[1]?.text;
      if (cw && b.objs.get(ctx2.prefix + cw)) kids.push([cw, b.objs.get(ctx2.prefix + cw)]);
    }
    for (const [cw, c] of kids) inst.points[cw] = () => [c.x(), c.y()];
    inst.box = () => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const c of inst.children) {
        const bx = c.box(), k = c.s.at(0), cx = c.x.at(0) + bx.cx * k, cy = c.y.at(0) + bx.cy * k;
        x0 = Math.min(x0, cx - bx.w * k / 2);
        x1 = Math.max(x1, cx + bx.w * k / 2);
        y0 = Math.min(y0, cy - bx.h * k / 2);
        y1 = Math.max(y1, cy + bx.h * k / 2);
      }
      return isFinite(x0) ? { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 } : { cx: 0, cy: 0, w: 0, h: 0 };
    };
    for (const k of ["centre", "center", "left", "right", "top", "bottom"]) {
      const bx = () => inst.box();
      inst.points[k] = k === "left" ? () => [bx().cx - bx().w / 2, bx().cy] : k === "right" ? () => [bx().cx + bx().w / 2, bx().cy] : k === "top" ? () => [bx().cx, bx().cy - bx().h / 2] : k === "bottom" ? () => [bx().cx, bx().cy + bx().h / 2] : () => [bx().cx, bx().cy];
    }
    const startOpts = {};
    for (const k of ["at", "x", "y", "size", "scale", "sx", "sy", "stretchx", "stretchy", "rotate", "tilt", "layer", "drift"]) if (opts[k] !== void 0 && opts[k] !== "") startOpts[k] = opts[k];
    b.t = s;
    b.setProps(inst, startOpts, 0, 0, linear);
    if (words.slice(2).some((w) => /^hidden$/i.test(w)) || opts.hidden !== void 0) return s;
    const how = (opts.show ?? "none").toLowerCase();
    if (how === "none") {
      inst.op.set(1)(s);
      return s;
    }
    return appear(inst, how, { line: { ...l, opts: opts.in ? { in: opts.in } : {} }, targets: [inst], start: s, b })(s);
  };
  const wireZoom = (ob, opts) => {
    if (!opts.of || !b.env.live) throw new Error("a zoom needs of=<point>, like of=cell.right");
    const src = b.env.live(opts.of);
    const ring = opts.ring !== void 0 || true;
    if (opts.layer === void 0) ob.layer = 50;
    let k2 = 0;
    ob.draw = (h) => {
      const t = now(), p = src(t), r = ob.props.r(), k = ob.props.mag();
      const me = [ob.x(), ob.y()], ms = ob.s() || 1;
      const sp = [(p[0] - me[0]) / ms, (p[1] - me[1]) / ms];
      const id = `mic-zoom-${ob.seed}-${k2 = (k2 + 1) % 1e6}`;
      const others = b.roots().filter((x) => x !== ob && x.type !== "zoom" && !x.fixed).sort((a, c2) => a.layer - c2.layer || a.order - c2.order);
      const L = Math.hypot(sp[0], sp[1]) || 1, ux = sp[0] / L, uy = sp[1] / L, rs = r / k;
      return g(
        h,
        {},
        ring ? circle(h, sp[0], sp[1], 2 * rs, 2 * rs, { stroke: P.ink, lw: 3 / ms }) : null,
        ring ? line(h, [[sp[0] - ux * rs, sp[1] - uy * rs], [ux * r, uy * r]], { stroke: P.ink, w: 2.5 / ms, dash: "8 6" }) : null,
        h("clipPath", { id }, h("circle", { cx: 0, cy: 0, r })),
        h(
          "g",
          { clipPath: `url(#${id})` },
          rect(h, 0, 0, 2 * r + 4, 2 * r + 4, { fill: P.paper }),
          h("g", { transform: `scale(${k / ms}) translate(${-p[0]} ${-p[1]})` }, others.map((x) => drawObj(h, x)))
        ),
        circle(h, 0, 0, 2 * r, 2 * r, { stroke: P.ink, lw: 5, fill: "none" })
      );
    };
  };
  const doAdd = (l, s, n2, mctx) => {
    const words = l.args.filter((a) => a.kind === "word").map((a) => a.text);
    let type = (words[0] ?? "").toLowerCase();
    let name = words[1];
    const opts = { ...l.opts };
    const asImage = (nm) => {
      const im = images[nm];
      opts.__img = im.data;
      opts.__w = String(im.w);
      opts.__h = String(im.h);
      type = "image";
    };
    if (type === "asset" && opts.name && svgs[opts.name]) {
      type = "svg";
      opts.__svg = svgs[opts.name].text;
      opts.__name = opts.name;
    } else if ((type === "asset" || type === "image") && opts.name && images[opts.name]) asImage(opts.name);
    if (!TYPES[type] || type === "svg" && !opts.__svg || type === "image" && !opts.__img) {
      const mk = makes[words[0]];
      if (mk) return doMake(mk, l, s, n2, words, opts, mctx);
      if (images[words[0]]) asImage(words[0]);
      else if (svgs[words[0]]) {
        opts.__svg = svgs[words[0]].text;
        opts.__name = words[0];
        type = "svg";
      } else if (ASSET_NAMES.includes(words[0])) {
        opts.name = words[0];
        type = "asset";
      } else {
        const near = closest(type, [...Object.keys(TYPES), ...ASSET_NAMES, ...Object.keys(makes), ...Object.keys(svgs), ...Object.keys(images)]);
        throw new Error(`"${words[0] ?? ""}" isn't a type of object${near ? `. Did you mean ${near}?` : ""}. Types: ${Object.keys(TYPES).join(", ")}`);
      }
    }
    const flags = words.slice(2).map((w) => w.toLowerCase());
    for (const f3 of flags) opts[f3] = opts[f3] ?? "";
    if (!name) name = `${type}${b.objs.size + 1}`;
    if (!/^[A-Za-z_][\w-]*$/.test(name)) throw new Error(`"${name}" can't be a name: use letters, digits, - and _ (start with a letter)`);
    const txt = l.args.find((a) => a.kind === "str")?.text ?? opts.text ?? "";
    const pg = opts.group ?? opts.on;
    const pgName = pg && mctx ? mctx.prefix + pg : pg;
    const parent = pg ? b.objs.get(pgName) ?? (() => {
      throw new Error(`no ${opts.on ? "plot" : "group"} called "${pg}"`);
    })() : mctx ? mctx.parent : null;
    if (mctx) name = mctx.prefix + name;
    const bound = [];
    if (mctx) {
      for (const [k, v] of Object.entries(opts)) if (usesParam(v, mctx)) bound.push([k, v]);
      for (const [k, sg] of Object.entries(mctx.params)) b.vars[k] = sg.at(0);
    }
    let ob;
    try {
      ob = b.addObj(type, name, n2, txt, opts, parent);
    } finally {
      if (mctx) for (const k of Object.keys(mctx.params)) delete b.vars[k];
    }
    for (const [k, v] of bound) {
      const base = { x: "x", y: "y", size: "s", scale: "s", rotate: "rot", tilt: "rot", rot: "rot", opacity: "op", sx: "sx", sy: "sy", stretchx: "sx", stretchy: "sy" };
      if (k === "at") {
        const pr = splitPair(v);
        if (!pr) throw new Error(`at=${v}: write it as x,y`);
        follow(ob.x, pr[0], mctx);
        follow(ob.y, pr[1], mctx);
        delete opts.at;
      } else if (base[k]) {
        follow(ob[base[k]], v, mctx);
        delete opts[k];
      } else if (k === "r" && ob.props.w) {
        follow(ob.props.w, `2*(${v})`, mctx);
        follow(ob.props.h, `2*(${v})`, mctx);
      } else if (ob.props[k]) follow(ob.props[k], v, mctx);
      else throw new Error(`"${k}" can't follow the make's numbers`);
    }
    if (bound.some(([k]) => k === "opacity")) {
      delete opts.opacity;
    }
    if (opts.fixed !== void 0) ob.fixed = true;
    if (opts.follow && ob.props.value) {
      const [tn, pn] = opts.follow.split(".");
      const src = b.objs.get(tn);
      if (!src) throw new Error(`follow: no object called "${tn}"`);
      let fn;
      if (!pn && src.type === "trace") {
        const tr = src._trace;
        fn = (t) => tr.v(src.props.draw.at(t));
      } else if (!pn && src.type === "curve") fn = src._value;
      else if (pn === "dot" && src.type === "curve") fn = src._dotValue;
      else if (pn && src.props[pn]) {
        const sg = src.props[pn];
        fn = (t) => sg.at(t);
      } else throw new Error(`follow: "${opts.follow}" isn't something a number can follow (a trace, a curve, curve.dot, or thing.number like ago.ec50)`);
      ob.props.value.follow(fn);
    }
    if (type === "zoom") wireZoom(ob, opts);
    const startOpts = {};
    for (const k of ["at", "x", "y", "size", "scale", "sx", "sy", "stretchx", "stretchy", "rotate", "tilt", "layer", "drift"]) if (opts[k] !== void 0 && opts[k] !== "") startOpts[k] = opts[k];
    if (!["shape", "plot"].includes(type)) {
      for (const k of ["width", "height"]) if (opts[k] !== void 0 && opts[k] !== "") startOpts[k] = opts[k];
    }
    b.t = s;
    b.setProps(ob, startOpts, 0, 0, linear);
    if (opts.layer !== void 0) ob.layer = num(opts.layer, b.env);
    const hidden = opts.hidden !== void 0 && opts.hidden !== "no";
    if (hidden || bound.some(([k]) => k === "opacity")) return s;
    const how = (opts.show ?? "none").toLowerCase();
    const vis = opts.opacity !== void 0 ? num(opts.opacity, b.env) : 1;
    if (how === "none") {
      ob.op.set(vis)(s);
      return s;
    }
    const fake = { line: { ...l, opts: { ...opts.in ? { in: opts.in } : {}, ...opts.opacity ? { opacity: opts.opacity } : {} } }, targets: [ob], start: s, b };
    if (how === "draw" || how === "write" || how === "wipe") return VERBS[how].run(fake);
    return appear(ob, how, fake)(s);
  };
  const page = { w: 1920, h: 1080, background: P.paper, paper: true };
  for (const it of parsed.items) {
    try {
      if (it.kind === "page") {
        const o2 = it.opts;
        if (o2.size) {
          const k = o2.size.toLowerCase();
          const m = /^(\d{3,4})\s*[x×]\s*(\d{3,4})$/.exec(k);
          if (PAGE_SIZES[k]) [page.w, page.h] = PAGE_SIZES[k];
          else if (m) {
            page.w = +m[1];
            page.h = +m[2];
            if (page.w > 3840 || page.h > 3840 || page.w < 240 || page.h < 240) throw new Error("page size: between 240 and 3840 on each side");
          } else throw new Error(`page size: use ${Object.keys(PAGE_SIZES).join(", ")}, or WIDTHxHEIGHT like 1080x1920`);
          if (page.w % 2 || page.h % 2) throw new Error("page size: use even numbers (video needs them)");
          b.page = { w: page.w, h: page.h };
        }
        const bg = (o2.background ?? o2.bg ?? "").trim();
        if (bg) {
          const k = bg.toLowerCase();
          if (k === "paper") {
            page.paper = true;
            page.background = P.paper;
            page.backImage = void 0;
          } else if (k === "plain") {
            page.paper = false;
            page.background = P.paper;
            page.backImage = void 0;
          } else if (images[bg]) {
            page.backImage = images[bg].data;
            page.paper = false;
          } else {
            page.background = color(k === "green" || k === "greenscreen" || k === "chroma" ? "#00B140" : bg);
            page.paper = false;
            page.backImage = void 0;
          }
        }
        continue;
      }
      if (it.kind === "beat") {
        beat = clockOf.get(it.beat.id);
        b.speechEnd = beat.start + beat.speechEnd;
        prevEnd = Math.max(prevEnd, beat.start);
        prevStart = prevEnd;
      } else if (it.kind === "let") {
        b.vars[it.name] = num(it.expr, b.env);
      } else if (it.kind === "code") {
        warnings.push({ line: it.n, msg: "code blocks are not supported (yet): this block is skipped in the preview and in the render. Ask for a new verb or object type instead." });
      } else {
        runLine(it.line, it.line.n);
      }
    } catch (e) {
      errors.push({ line: it.kind === "beat" ? it.beat.n : it.kind === "line" ? it.line.n : it.n, msg: e.message ?? String(e) });
    }
  }
  const lastBeatEnd = cl.length ? cl[cl.length - 1].start + cl[cl.length - 1].length : 0;
  {
    const until = Math.max(lastBeatEnd, maxEnd);
    for (const lp of loops) {
      try {
        materialize(lp, until);
      } catch (e) {
        errors.push({ line: lp.n, msg: e.message ?? String(e) });
      }
    }
    b.endFollow(until + 1);
  }
  const audio = cl.length > 0 && cl.every((c) => c.audio);
  const seconds = Math.max(1 / 30, audio ? lastBeatEnd : Math.max(lastBeatEnd, maxEnd, getLastEnd()));
  const cam = b.cam;
  const scene = {
    id: o.id ?? "mic",
    seconds,
    el: (h) => {
      const r = b.roots().sort((a, c) => a.layer - c.layer || a.order - c.order);
      return g(h, {}, cam.g(h, ...r.filter((x) => !x.fixed).map((ob) => drawObj(h, ob))), ...r.filter((x) => x.fixed).map((ob) => drawObj(h, ob)));
    },
    camera: cam,
    background: page.background,
    width: page.w,
    height: page.h,
    paper: page.paper,
    backImage: page.backImage,
    late: lines.filter((x) => x.late).map((x) => [`line ${x.line}`, x.late]),
    lastTween: getLastEnd()
  };
  const beats = cl.map((c) => ({ id: c.id, start: c.start, length: c.length, audio: c.audio, words: c.words, line: beatHeads.find((x) => x.id === c.id).n, text: beatHeads.find((x) => x.id === c.id).text }));
  const hit = (x, y, t) => {
    const out = [];
    for (const ob of b.objs.values()) {
      if (ob.op.at(t) * ob.dim.at(t) < 0.05 || ob.type === "group") continue;
      const bx = ob.box();
      const corners = [[bx.cx - bx.w / 2, bx.cy - bx.h / 2], [bx.cx + bx.w / 2, bx.cy + bx.h / 2], [bx.cx - bx.w / 2, bx.cy + bx.h / 2], [bx.cx + bx.w / 2, bx.cy - bx.h / 2]].map((p) => toStage(ob, p, t));
      const xs = corners.map((p) => p[0]), ys = corners.map((p) => p[1]);
      if (x >= Math.min(...xs) && x <= Math.max(...xs) && y >= Math.min(...ys) && y <= Math.max(...ys)) out.push(ob);
    }
    return out.sort((a, c) => c.box().w * c.box().h - a.box().w * a.box().h).reverse();
  };
  return {
    page,
    scene,
    beats,
    errors: errors.sort((a, c) => a.line - c.line),
    warnings,
    lines,
    objects: [...b.objs.values()].map((x) => ({ name: x.name, type: x.type, line: x.line })),
    objectsByName: b.objs,
    hit,
    seconds,
    makes: Object.keys(makes),
    svgs: [...Object.keys(svgs), ...Object.keys(images)]
  };
}
function micBeatScenes(r, prefix = "mic") {
  return r.beats.map((bt, i) => {
    const t0 = i === 0 ? 0 : bt.start;
    const t1 = i === r.beats.length - 1 ? r.seconds : r.beats[i + 1].start;
    return { beat: bt.id, scene: { ...r.scene, id: `${prefix}_${bt.id}`, seconds: Math.max(1 / 30, t1 - t0), offset: t0, late: [] } };
  });
}

// src/mic/films.ts
var slug = (s) => s.replace(/\.mic$/i, "").replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "scene";
function films(files2, timings2, library) {
  return [...files2].sort((a, b) => a.name.localeCompare(b.name)).map((f3) => {
    const result = buildMic(f3.src, timings2, { id: slug(f3.name), library });
    const beats = micBeatScenes(result, slug(f3.name)).map((b, i) => ({
      id: `${slug(f3.name)}-${String(i + 1).padStart(2, "0")}-${slug(b.beat)}`,
      beat: b.beat,
      scene: b.scene
    }));
    return { file: f3.name, result, beats };
  });
}

// src/mic/check.ts
var fs = require("fs");
var path2 = require("path");
var dir = process.argv[2] ?? "scenes";
var tPath = process.argv[3];
var files = fs.readdirSync(dir).filter((f3) => f3.endsWith(".mic")).map((f3) => ({ name: f3, src: fs.readFileSync(path2.join(dir, f3), "utf8") }));
if (!files.length) {
  console.log(`no .mic files in ${dir}`);
  process.exit(1);
}
var timings = tPath && fs.existsSync(tPath) ? JSON.parse(fs.readFileSync(tPath, "utf8")) : null;
var lib = fs.existsSync(path2.join(dir, "library.mic")) ? fs.readFileSync(path2.join(dir, "library.mic"), "utf8") : void 0;
var all2 = films(files.filter((f3) => f3.name !== "library.mic"), timings, lib);
var bad = 0;
var ids = [];
for (const f3 of all2) {
  console.log(`
${f3.file}: ${f3.beats.length} beat(s), ${f3.result.seconds.toFixed(1)} s, timing: ${f3.result.beats.every((b) => b.audio) && f3.result.beats.length ? "your voice-over" : f3.result.beats.some((b) => b.audio) ? "voice-over for some beats, estimate for the rest" : "estimate (150 wpm)"}`);
  for (const b of f3.result.beats) console.log(`  ${b.id.padEnd(8)} starts ${b.start.toFixed(2).padStart(7)} s, lasts ${b.length.toFixed(2)} s${b.audio ? "" : "  (no recording: estimated)"}`);
  for (const e of f3.result.errors) {
    console.log(`  ERROR line ${e.line}: ${e.msg}`);
    bad++;
  }
  for (const w of f3.result.warnings) console.log(`  warning line ${w.line}: ${w.msg}`);
  ids.push(...f3.beats.map((b) => b.id));
}
fs.writeFileSync("ids.txt", ids.join("\n") + "\n");
console.log(bad ? `
${bad} error(s): fix them in the editor, upload the files again, and re-run.` : `
no errors. ${ids.length} beat file(s) to render.`);
process.exit(bad ? 1 : 0);
