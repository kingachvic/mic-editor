// src/mic/remotion-root.tsx
import { Composition } from "remotion";

// src/paper/remotion.tsx
import { AbsoluteFill, Audio, Img, Series, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// src/paper/frame.tsx
import React from "react";

// src/paper/timeline.ts
var linear = (v) => v;
var easeInOutCubic = (v) => v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
var easeOutCubic = (v) => 1 - Math.pow(1 - v, 3);
var easeInCubic = (v) => v * v * v;
var easeInOutSine = (v) => -(Math.cos(Math.PI * v) - 1) / 2;
var easeOutBack = (v) => 1 + 2.70158 * Math.pow(v - 1, 3) + 1.70158 * Math.pow(v - 1, 2);
var NOW = 0;
function setNow(t) {
  NOW = t;
}
function now() {
  return NOW;
}
var order = 0;
var lastEnd = 0;
function sig(init) {
  const segs = [];
  let sorted = true;
  const at = (t) => {
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
  const f2 = (() => at(NOW));
  f2.at = at;
  f2.to = (v, d = 0.6, e = easeInOutCubic) => add(v, d, e);
  f2.set = (v) => add(v, 0, linear);
  return f2;
}
var all = (...as) => (s) => Math.max(s, ...as.map((a) => a(s)));
var chain = (...as) => (s) => as.reduce((c, a) => a(c), s);
function resetLastEnd() {
  lastEnd = 0;
}
function getLastEnd() {
  return lastEnd;
}

// src/paper/assets.ts
var IMAGES = ["portraits/bernstein.jpg", "portraits/skou.jpg"];
var URL_OF = (p) => p;
function setAssetUrl(f2) {
  URL_OF = f2;
}
function preloadImages(url) {
  return Promise.all(IMAGES.map((p) => new Promise((res) => {
    const im = new Image();
    im.onload = () => im.decode ? im.decode().then(() => res(), () => res()) : res();
    im.onerror = () => {
      console.error("could not load", p);
      res();
    };
    im.src = url(p);
  })));
}

// src/paper/svg.ts
var flat = (c) => c.flat(Infinity).filter((x) => x !== null && x !== void 0 && x !== false);
var f = (n2) => Math.round(n2 * 100) / 100;
var pts = (p) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
function g(h2, o, ...children) {
  const t = [];
  if (o.x || o.y) t.push(`translate(${f(o.x ?? 0)} ${f(o.y ?? 0)})`);
  if (o.rot) t.push(`rotate(${f(o.rot)})`);
  if (o.s !== void 0 && o.s !== 1) t.push(`scale(${Math.max(o.s, 1e-6)})`);
  const props = {};
  if (t.length) props.transform = t.join(" ");
  if (o.op !== void 0 && o.op < 1) props.opacity = Math.max(0, o.op);
  if (o.op !== void 0 && o.op <= 1e-4) return null;
  if (o.s !== void 0 && o.s <= 1e-6) return null;
  return h2("g", props, ...flat(children));
}
function line(h2, p, o = {}) {
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
  return h2(o.closed ? "polygon" : "polyline", props);
}
function rect(h2, x, y, w, ht, o = {}) {
  const r = o.r ?? 0;
  const style = { fill: o.fill ?? "none" };
  if (o.stroke && (o.lw ?? 0) > 0) {
    style.stroke = o.stroke;
    style.strokeWidth = o.lw;
  }
  if (typeof r === "number") {
    const rr = Math.min(r, w / 2, ht / 2);
    return h2("rect", { x: f(x - w / 2), y: f(y - ht / 2), width: w, height: ht, rx: rr, ry: rr, ...style });
  }
  const [tl, tr, br, bl] = r;
  const x0 = x - w / 2, y0 = y - ht / 2, x1 = x + w / 2, y1 = y + ht / 2;
  const d = `M ${f(x0 + tl)} ${f(y0)} L ${f(x1 - tr)} ${f(y0)} Q ${f(x1)} ${f(y0)} ${f(x1)} ${f(y0 + tr)} L ${f(x1)} ${f(y1 - br)} Q ${f(x1)} ${f(y1)} ${f(x1 - br)} ${f(y1)} L ${f(x0 + bl)} ${f(y1)} Q ${f(x0)} ${f(y1)} ${f(x0)} ${f(y1 - bl)} L ${f(x0)} ${f(y0 + tl)} Q ${f(x0)} ${f(y0)} ${f(x0 + tl)} ${f(y0)} Z`;
  return h2("path", { d, ...style });
}
function circle(h2, x, y, w, ht = w, o = {}) {
  const props = { cx: f(x), cy: f(y), rx: w / 2, ry: ht / 2, fill: o.fill ?? "none" };
  if (o.stroke && (o.lw ?? 0) > 0) {
    props.stroke = o.stroke;
    props.strokeWidth = o.lw;
  }
  if (o.rot) props.transform = `rotate(${o.rot} ${f(x)} ${f(y)})`;
  return h2("ellipse", props);
}
function text(h2, s, x, y, o) {
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
  return h2("text", props, s);
}
function path(h2, d, o = {}) {
  const props = { d, fill: o.fill ?? "none" };
  if (o.stroke && (o.lw ?? 0) > 0) {
    props.stroke = o.stroke;
    props.strokeWidth = o.lw;
    if (o.cap) props.strokeLinecap = o.cap;
    if (o.join) props.strokeLinejoin = o.join;
  }
  if (o.op !== void 0) props.opacity = o.op;
  return h2("path", props);
}
function defs(h2) {
  return h2(
    "defs",
    null,
    h2(
      "filter",
      { id: "shadow", x: "-20%", y: "-20%", width: "140%", height: "150%" },
      h2("feDropShadow", { dx: 3, dy: 4, stdDeviation: 5, floodColor: "rgb(58,46,31)", floodOpacity: 0.22 })
    )
  );
}

// src/paper/frame.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var h = React.createElement;
var TILES = [];
for (const ty of [-1, 0, 1]) for (const tx of [-1, 0, 1]) TILES.push([tx, ty]);
function FrameView({ scene, t, Img: Img2, url }) {
  setAssetUrl(url);
  setNow(t + (scene.offset ?? 0));
  const cam = scene.camera?.node;
  const x = cam ? cam.x() : 0, y = cam ? cam.y() : 0, s = cam ? cam.s() : 1;
  return /* @__PURE__ */ jsxs("div", { style: { position: "absolute", left: 0, top: 0, width: 1920, height: 1080, overflow: "hidden", background: scene.background }, children: [
    /* @__PURE__ */ jsx("div", { style: { position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${960 + x}px, ${540 + y}px) scale(${s})` }, children: TILES.map(([tx, ty]) => /* @__PURE__ */ jsx(Img2, { src: url("paper.jpg"), style: { position: "absolute", left: tx * 1920 - 960, top: ty * 1080 - 540, width: 1920, height: 1080 } }, `${tx},${ty}`)) }),
    /* @__PURE__ */ jsxs("svg", { width: 1920, height: 1080, viewBox: "-960 -540 1920 1080", style: { position: "absolute", left: 0, top: 0 }, children: [
      defs(h),
      scene.el(h)
    ] })
  ] });
}
var FONT_FILES = [
  ["Inter-Regular.woff", "Inter", "400", "normal"],
  ["Inter-SemiBold.woff", "Inter", "600", "normal"],
  ["Inter-Bold.woff", "Inter", "700", "normal"],
  ["Inter-ExtraBold.woff", "Inter", "800", "normal"],
  ["Lora-Variable.woff", "Lora", "400 700", "normal"],
  ["LMRoman10-Regular.woff", "Latin Modern Roman", "400", "normal"],
  ["LMRoman10-Italic.woff", "Latin Modern Roman", "400", "italic"],
  ["LatinModernMath.woff", "Latin Modern Math", "400", "normal"]
];
function loadFonts(url) {
  return Promise.all([
    preloadImages(url),
    ...FONT_FILES.map(
      ([file, family, weight, style]) => new FontFace(family, `url(${url(`fonts/${file}`)})`, { weight, style }).load().then((f2) => {
        document.fonts.add(f2);
      })
    )
  ]);
}

// src/paper/remotion.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var fontsReady = delayRender("loading the bundled fonts");
loadFonts(staticFile).then(() => continueRender(fontsReady)).catch((e) => {
  console.error("font loading failed", e);
  continueRender(fontsReady);
});
var framesOf = (scene, fps) => Math.max(1, Math.round(scene.seconds * fps));
function SceneView({ scene }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return /* @__PURE__ */ jsx2(FrameView, { scene, t: frame / fps, Img, url: staticFile });
}
function SequenceView({ scenes, audio }) {
  const { fps } = useVideoConfig();
  return /* @__PURE__ */ jsxs2(AbsoluteFill, { children: [
    /* @__PURE__ */ jsx2(Series, { children: scenes.map((sc) => /* @__PURE__ */ jsx2(Series.Sequence, { durationInFrames: framesOf(sc, fps), name: sc.id, children: /* @__PURE__ */ jsx2(SceneView, { scene: sc }) }, sc.id)) }),
    audio ? /* @__PURE__ */ jsx2(Audio, { src: staticFile(audio) }) : null
  ] });
}

// src/paper/layout.ts
var ctx = null;
var cache = /* @__PURE__ */ new Map();
var fontString = (f2) => `${f2.italic ? "italic " : ""}${f2.weight ?? 400} ${f2.size}px ${f2.family}`;
function measure(s, f2) {
  const font2 = fontString(f2);
  const key = font2 + "|" + s;
  const hit = cache.get(key);
  if (hit !== void 0) return hit;
  if (typeof document === "undefined") return s.length * f2.size * 0.55;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return s.length * f2.size * 0.55;
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
    draw: (h2, cx, cy) => text(h2, s, cx, cy, { size: o.size, weight: o.weight, fill: o.fill, family, italic: o.italic, op: o.op })
  };
}
function boxItem(w, ht, fill, m = {}) {
  return { w, h: ht, ...m, draw: (h2, cx, cy, ww) => fill ? rect(h2, cx, cy, ww ?? w, ht, { fill }) : null };
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
    draw: (h2, cx, cy) => {
      let x = cx - W / 2 + pl;
      const top = cy - Ht / 2 + pt, bottom = top + tall;
      return items.map((it, i) => {
        if (i) x += gap;
        x += it.ml ?? 0;
        const icx = x + it.w / 2;
        x += it.w + (it.mr ?? 0);
        const icy = align === "end" ? bottom - (it.mb ?? 0) - it.h / 2 : align === "start" ? top + (it.mt ?? 0) + it.h / 2 : (top + bottom) / 2 + ((it.mt ?? 0) - (it.mb ?? 0)) / 2;
        return it.draw(h2, icx, icy);
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
    draw: (h2, cx, cy) => {
      let y = cy - Ht / 2 + pt;
      const left = cx - W / 2 + pl, right = left + wide;
      return items.map((it, i) => {
        if (i) y += gap;
        y += it.mt ?? 0;
        const icy = y + it.h / 2;
        y += it.h + (it.mb ?? 0);
        if (it.stretch) return it.draw(h2, (left + right) / 2, icy, wide);
        const icx = align === "start" ? left + (it.ml ?? 0) + it.w / 2 : align === "end" ? right - (it.mr ?? 0) - it.w / 2 : (left + right) / 2 + ((it.ml ?? 0) - (it.mr ?? 0)) / 2;
        return it.draw(h2, icx, icy);
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
function rgbaHex(h2, a) {
  const n2 = parseInt(h2.slice(1), 16);
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
function tornPoints(w, h2, seed, tear = "r", amp = 2.2) {
  const pts2 = [];
  const x0 = -w / 2;
  const y0 = -h2 / 2;
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
  edge(1, x0 + w, y0, x0 + w, y0 + h2, A("r"));
  edge(2, x0 + w, y0 + h2, x0, y0 + h2, A("b"));
  edge(3, x0, y0 + h2, x0, y0, A("l"));
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
  const loop = (scale, extra) => {
    const out = [];
    const n2 = 64;
    for (let i = 0; i <= n2; i++) {
      const u = i / n2;
      const a = a0 + (Math.PI * 2 + over + extra) * u;
      const k = scale * (1 + harm.reduce((s, [h2, amp, ph]) => s + amp * Math.sin(h2 * a + ph), 0) + drift * u);
      const px = RX * k * Math.cos(a);
      const py = RY * k * Math.sin(a);
      out.push([px * Math.cos(tilt) - py * Math.sin(tilt), px * Math.sin(tilt) + py * Math.cos(tilt)]);
    }
    return out;
  };
  r();
  return { main: loop(1, 0), second: null };
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
    g: (h2, ...children) => g(h2, { x: n2.x(), y: n2.y(), s: n2.s(), rot: n2.rot(), op: n2.op() }, ...children)
  };
  return n2;
}
function makeCamera() {
  const n2 = node();
  const push = (p, s, run = T.cam) => all(n2.s.to(s, run), n2.x.to(p[0] * (1 - s), run), n2.y.to(p[1] * (1 - s), run));
  const frame = (p, s, run = T.cam) => all(n2.s.to(s, run), n2.x.to(-p[0] * s, run), n2.y.to(-p[1] * s, run));
  const reset = (run = T.cam) => all(n2.s.to(1, run), n2.x.to(0, run), n2.y.to(0, run));
  return { node: n2, push, frame, reset, g: (h2, ...c) => n2.g(h2, ...c) };
}

// src/mic/parse.ts
function tokenize(s) {
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
    const every = rest.find((x) => x.kind === "kv" && x.key === "every");
    repeat = { n: Math.round(k), every: every ? dur(every.text) : 0 };
    rest = rest.slice(2).filter((x) => x !== every);
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
  return { n: n2, src, when, explicitWhen: explicit, verb: verb2, args: plain, opts, bg, repeat };
}
function parse(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out = { items: [], defines: {}, errors: [] };
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
        out.items.push({ kind: "beat", beat: { n: n2, id: t[1].text, text: text2 } });
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

// src/paper/math.ts
var MATH_FONT = '"Latin Modern Roman", "Latin Modern Math"';
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
function membraneEl(h2, o = {}) {
  const top = MEM.y - MEM.h / 2, bot = MEM.y + MEM.h / 2;
  const X1 = o.x1 ?? MEM.x1;
  const gaps = o.gapAt ?? [];
  const gw = o.gapW ?? 0;
  const inGap = (x) => gaps.some((c) => Math.abs(x - c) < gw / 2);
  const R = 8.5, STEP = 21;
  const heads = [], tails = [];
  for (let x = MEM.x0 + STEP / 2; x < X1 - R; x += STEP) {
    if (inGap(x)) continue;
    for (const [y0, dir] of [[top + R + 1, 1], [bot - R - 1, -1]]) {
      const y1 = y0 + dir * (R + 2), y2 = MEM.y - dir * 3;
      tails.push(line(h2, [[x - 3, y1], [x - 4.5, (y1 + y2) / 2], [x - 2.5, y2]], { stroke: rgbaHex(P.ink, 0.45), w: 1.6, cap: "round", join: "round" }));
      tails.push(line(h2, [[x + 3, y1], [x + 1.5, (y1 + y2) / 2], [x + 3.5, y2]], { stroke: rgbaHex(P.ink, 0.45), w: 1.6, cap: "round", join: "round" }));
      heads.push(circle(h2, x, y0, 2 * R, 2 * R, { fill: P.mem, stroke: rgbaHex(P.ink, 0.75), lw: 1.4 }));
    }
  }
  return g(
    h2,
    {},
    rect(h2, (MEM.x0 + X1) / 2, MEM.y, X1 - MEM.x0, MEM.h - 2 * R, { fill: rgbaHex(P.mem, 0.08) }),
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
  const ball2 = (h2, fill, label, lc, size) => {
    const [dx, dy] = jig();
    return n2.g(h2, g(
      h2,
      { x: dx, y: dy },
      circle(h2, 0, 0, 2 * r, 2 * r, { fill, stroke: P.ink, lw: 2.5 }),
      circle(h2, -r * 0.34, -r * 0.36, r * 0.62, r * 0.48, { fill: "rgba(255,255,255,0.28)", rot: -30 }),
      text(h2, label, 0, 1, { size, weight: 800, fill: lc, family: SANS })
    ));
  };
  const el = (h2) => {
    if (kind === "na") return ball2(h2, P.na, "Na\u207A", P.ink, 17);
    if (kind === "k") return ball2(h2, P.k, "K\u207A", "#FFFFFF", 18);
    if (kind === "cl") return ball2(h2, "#9DB89A", "Cl\u207B", P.ink, 17);
    return ball2(h2, P.an, "\u2212", P.ink, 30);
  };
  const along = (pts2, d = 0.7) => chain(...pts2.map((p) => n2.to(p, d, easeInOutCubic)));
  return { node: n2, el, along, kind };
}
function neuronEl(h2) {
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
    h2,
    {},
    den.map((p) => line(h2, p, { ...ink3, stroke: P.ink, w: 9 })),
    den.map((p) => line(h2, p, { ...ink3, stroke: rgbaHex(P.mem, 0.35), w: 4 })),
    line(h2, axon, { ...ink3, w: 14 }),
    line(h2, axon, { ...ink3, stroke: "#D7E8E4", w: 8 }),
    term.map((p) => line(h2, p, { ...ink3, w: 8 })),
    term.map((p) => circle(h2, p[1][0], p[1][1], 22, 22, { fill: "#D7E8E4", stroke: P.ink, lw: 3 })),
    circle(h2, 0, 0, 190, 170, { fill: "#D7E8E4", stroke: P.ink, lw: 3.5 }),
    circle(h2, -10, 4, 64, 58, { fill: rgbaHex(P.mem, 0.35), stroke: rgbaHex(P.ink, 0.6), lw: 2 })
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
function arrow(h2, a, b, color2, end = 1, w = 5, head = 16) {
  if (end <= 1e-3) return null;
  const x = a[0] + (b[0] - a[0]) * end, y = a[1] + (b[1] - a[1]) * end;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const hx = (s) => x - head * Math.cos(ang + s), hy = (s) => y - head * Math.sin(ang + s);
  return g(
    h2,
    {},
    line(h2, [a, [x, y]], { stroke: color2, w, cap: "round" }),
    line(h2, [[hx(0.5), hy(0.5)], [x, y], [hx(-0.5), hy(-0.5)]], { stroke: color2, w, cap: "round", join: "round" })
  );
}
var SQ = { body: "#C9C2B6", fin: "#D8D2C7" };
var SQ_MANTLE = pathPoints(SQUID.mantle);
var SQ_FINS = pathPoints(SQUID.fins);
var SQ_HEAD = pathPoints(SQUID.head);
var SQ_ARMS = SQUID.arms.map((a) => ({ w: a.w, p: smooth(a.pts) }));
var SQ_AXON = smooth(SQUID.axon);
var SQUID_SCALE = 1.15;
function squidEl(h2, axonGlow) {
  const [ex, ey, er] = SQUID.eye;
  return g(
    h2,
    { s: SQUID_SCALE },
    g(
      h2,
      { x: -118, rot: 1.6 * Math.sin(2 * Math.PI * 0.22 * now()) },
      g(
        h2,
        { x: 118 },
        SQ_ARMS.map((a) => line(h2, a.p, { stroke: P.ink, w: a.w + 3, cap: "round", join: "round" })),
        SQ_ARMS.map((a) => line(h2, a.p, { stroke: SQ.body, w: a.w - 1, cap: "round", join: "round" })),
        SQUID.clubs.map(([x, y, w, hh, r]) => circle(h2, x, y, 2 * w, 2 * hh, { fill: SQ.body, stroke: P.ink, lw: 2, rot: r }))
      )
    ),
    line(h2, SQ_FINS, { closed: true, fill: SQ.fin, stroke: P.ink, w: 2.5 }),
    line(h2, SQ_MANTLE, { closed: true, fill: SQ.body, stroke: P.ink, w: 2.5 }),
    line(h2, SQ_HEAD, { closed: true, fill: SQ.body, stroke: P.ink, w: 2.5 }),
    circle(h2, ex, ey, 2 * er, 2 * er, { fill: P.ink }),
    circle(h2, ex + 2, ey - 1, er, er, { fill: "#FFFFFF" }),
    line(h2, SQ_AXON, { stroke: rgbaHex(P.mem, 0.2 + 0.25 * axonGlow), w: 12 + 6 * axonGlow, cap: "round" }),
    line(h2, SQ_AXON, { stroke: rgbaHex(P.mem, 0.45 + 0.55 * axonGlow), w: 5, cap: "round" })
  );
}
function fibreEl(h2, w = 900, d = 170) {
  return g(
    h2,
    {},
    rect(h2, 0, 0, w, d, { fill: "#D7E8E4", stroke: P.ink, lw: 3 }),
    circle(h2, w / 2, 0, 60, d, { fill: "#C7DDD8", stroke: P.ink, lw: 3 }),
    circle(h2, -w / 2, 0, 60, d, { fill: "#D7E8E4", stroke: P.ink, lw: 3 })
  );
}
function myocyteEl(h2) {
  const W_ = 260, H_ = 84;
  return g(
    h2,
    {},
    rect(h2, 0, 0, W_, H_, { r: H_ / 2, fill: rgbaHex(P.mem, 0.14), stroke: P.ink, lw: 3 }),
    Array.from({ length: 9 }, (_, i) => line(h2, [[-96 + i * 24, -H_ / 2 + 10], [-96 + i * 24, H_ / 2 - 10]], { stroke: rgbaHex(P.mem, 0.35), w: 2 })),
    circle(h2, -30, 4, 58, 28, { fill: rgbaHex(P.mem, 0.32), stroke: rgbaHex(P.mem, 0.75), lw: 2 })
  );
}
function rbcEl(h2) {
  return g(
    h2,
    {},
    circle(h2, 0, 0, 110, 110, { fill: "#D9726A", stroke: P.ink, lw: 3 }),
    circle(h2, 0, 0, 50, 50, { fill: "#C45E57" })
  );
}

// src/v2/channels.ts
function navChan(h2, x, open, lid = 0, lidOp = 1, glow = 0) {
  const y = MEM.y, d = 22 + 14 * open;
  const conduct = open * (1 - lid);
  const ang = -25 + 115 * lid;
  return g(
    h2,
    { x },
    glow > 1e-3 ? circle(h2, 0, y, 130, 130, { fill: rgbaHex(P.na, 0.22 * glow) }) : null,
    rect(h2, 0, y, 2 * d - 12, MEM.h + 20, { fill: rgbaHex(P.na, 0.12 + 0.4 * conduct) }),
    rect(h2, -d, y, 28, MEM.h + 50, { r: 12, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h2, d, y, 28, MEM.h + 50, { r: 12, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    g(h2, { x: -d - 26, y: y - 6, rot: -35 + 55 * open }, line(h2, [[0, 0], [0, -34]], { stroke: P.ink, w: 4, cap: "round" }), circle(h2, 0, -38, 14, 14, { fill: P.na, stroke: P.ink, lw: 2 })),
    lidOp > 1e-3 ? g(
      h2,
      { op: lidOp, x: d, y: y + MEM.h / 2 + 22, rot: ang },
      line(h2, [[0, 0], [0, 34]], { stroke: P.ink, w: 4, cap: "round" }),
      circle(h2, 0, 44, 30, 30, { fill: "#9DB0C2", stroke: P.ink, lw: 3 })
    ) : null
  );
}
function kvChan(h2, x, open) {
  const y = MEM.y, d = 26 + 18 * open;
  return g(
    h2,
    { x },
    rect(h2, 0, y, 2 * d - 14, MEM.h + 20, { fill: rgbaHex(P.k, 0.1 + 0.4 * open) }),
    rect(h2, -d, y, 34, MEM.h + 54, { r: 14, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h2, d, y, 34, MEM.h + 54, { r: 14, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h2, -d, y - MEM.h / 2 - 14, 34, 10, { fill: P.k }),
    rect(h2, d, y - MEM.h / 2 - 14, 34, 10, { fill: P.k })
  );
}
function leakChan(h2, x) {
  const y = MEM.y;
  return g(
    h2,
    { x },
    rect(h2, 0, y, 16, MEM.h + 10, { fill: rgbaHex(P.k, 0.25) }),
    rect(h2, -17, y, 18, MEM.h + 26, { r: 8, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 }),
    rect(h2, 17, y, 18, MEM.h + 26, { r: 8, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 })
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
  const sample = (f2, t0, t1, dt = 0.02) => {
    const out = [];
    for (let t = t0; t < t1; t += dt) out.push([X(t), Y(f2(t))]);
    out.push([X(t1), Y(f2(t1))]);
    return out;
  };
  const tick = (mv, label, c = P.muted) => {
    const s = sig(0);
    ticks.push({ t: { mv, label, color: c }, op: s });
    return { show: (run = T.in) => s.to(1, run, easeOutCubic), hide: (run = T.out) => s.to(0, run), op: s };
  };
  const tip = () => [X(drawTo()), Y(v(drawTo()))];
  const el = (h2, ...extra) => {
    const end = drawTo();
    const AX = PLOT.x0 - 40;
    return n2.g(
      h2,
      axisOp() > 1e-3 ? g(
        h2,
        { op: axisOp() },
        line(h2, [[AX, Y(80)], [AX, Y(-100)]], { stroke: P.ink, w: 3, cap: "round" }),
        ticks.map(({ t, op: s }) => s() > 1e-3 ? g(
          h2,
          { op: s() },
          line(h2, [[AX - 12, Y(t.mv)], [AX + 12, Y(t.mv)]], { stroke: t.color === P.muted ? P.ink : t.color, w: 3 }),
          text(h2, t.label, AX - 22, Y(t.mv), { size: FSZ.label, weight: 700, fill: t.color, family: SANS, align: "r" })
        ) : null)
      ) : null,
      zeroOp() > 1e-3 ? dashed(h2, X(-0.1), X(10), Y(0), rgbaHex(P.ink, 0.55 * zeroOp())) : null,
      ghostOp() > 1e-3 && ghostTo() > 0.01 ? line(h2, sample(ghostWave, 0, ghostTo()), { stroke: rgbaHex(P.muted, 0.85), w: 6, cap: "round", join: "round", op: ghostOp() }) : null,
      end > 0.01 ? g(
        h2,
        { op: op() },
        line(h2, sample(v, 0, end), { stroke: color2, w: 7, cap: "round", join: "round" }),
        naTint() > 1e-3 && end > TT.threshold ? line(h2, sample(v, TT.threshold, Math.min(end, TT.peak)), { stroke: P.na, w: 8, cap: "round", join: "round", op: naTint() }) : null,
        kTint() > 1e-3 && end > TT.peak ? line(h2, sample(v, TT.peak, Math.min(end, TT.rest)), { stroke: P.k, w: 8, cap: "round", join: "round", op: kTint() }) : null,
        tipOp() > 1e-3 ? circle(h2, X(end), Y(v(end)), 20, 20, { fill: rgbaHex(color2, 0.25 * tipOp()) }) : null
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
function dashed(h2, x0, x1, y, stroke, w = 2.5, dash = "18 12") {
  return h2("line", { x1: x0, y1: y, x2: x1, y2: y, stroke, strokeWidth: w, strokeDasharray: dash, strokeLinecap: "round" });
}

// src/v2/parts.ts
function loopArrowEl(h2, r, color2, w = 6) {
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
    h2,
    {},
    line(h2, arc, { stroke: color2, w, cap: "round" }),
    line(h2, [tip, [base[0] + nx * Wd, base[1] + ny * Wd], [base[0] - nx * Wd, base[1] - ny * Wd]], { closed: true, fill: color2, stroke: color2, w: 2, join: "round" })
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
var ion = (kind) => (h2) => makeIon(kind, 0, 0, 1).el(h2);
function ball(h2, fill, label, lc, r = 25, size = 17) {
  return g(
    h2,
    {},
    circle(h2, 0, 0, 2 * r, 2 * r, { fill, stroke: P.ink, lw: 2.5 }),
    circle(h2, -r * 0.34, -r * 0.36, r * 0.62, r * 0.48, { fill: "rgba(255,255,255,0.28)", rot: -30 }),
    text(h2, label, 0, 1, { size, weight: 800, fill: lc, family: SANS })
  );
}
function strip(h2, w = 360) {
  return g(h2, { x: -MEM.x0 - w / 2, y: -MEM.y }, membraneEl(h2, { x1: MEM.x0 + w }));
}
var onStrip = (w, thing) => (h2) => g(h2, {}, strip(h2, w), g(h2, { y: -MEM.y }, thing(h2)));
function penLoopPts(rx, ry) {
  const out = [];
  for (let i = 0; i <= 64; i++) {
    const a = -2.3 + i / 64 * (Math.PI * 2 + 0.5);
    out.push([rx * Math.cos(a) * (1 + 0.03 * Math.sin(3 * a)), ry * Math.sin(a) * (1 + 0.05 * Math.cos(2 * a))]);
  }
  return out;
}
var tracePts = (f2, t0, t1, kx = 140, ky = 4) => {
  const out = [];
  for (let t = t0; t <= t1 + 1e-9; t += 0.02) out.push([(t - (t0 + t1) / 2) * kx, -f2(t) * ky]);
  return out;
};
var traceAsset = (f2, t0, t1, color2, w = 7) => (h2) => {
  const pts2 = tracePts(f2, t0, t1);
  const mid = (Math.max(...pts2.map((p) => p[1])) + Math.min(...pts2.map((p) => p[1]))) / 2;
  return g(h2, { y: -mid }, line(h2, pts2, { stroke: color2, w, cap: "round", join: "round" }));
};
var traceBox = (f2, t0, t1, pad = 12) => {
  const pts2 = tracePts(f2, t0, t1);
  const ys = pts2.map((p) => p[1]), hgt = Math.max(...ys) - Math.min(...ys);
  const w = (t1 - t0) * 140;
  return [-w / 2 - pad, -hgt / 2 - pad, w + 2 * pad, hgt + 2 * pad];
};
function gpcr(h2, bound = false) {
  const xs = [-108, -72, -36, 0, 36, 72, 108];
  const top = MEM.y - MEM.h / 2 - 26, bot = MEM.y + MEM.h / 2 + 26;
  const loops = [];
  xs.forEach((x, i) => {
    loops.push([x, i % 2 ? bot : top], [x, i % 2 ? top : bot]);
  });
  return g(
    h2,
    {},
    line(h2, [[-150, top - 50], [-108, top]], { ...ink2(5), stroke: P.ink }),
    xs.map((x) => rect(h2, x, MEM.y, 30, MEM.h + 52, { r: 13, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 })),
    xs.slice(0, -1).map((x, i) => i % 2 ? line(h2, [[x, top - 2], [x + 18, top - 22], [x + 36, top - 2]], { ...ink2(4) }) : line(h2, [[x, bot + 2], [x + 18, bot + 22], [x + 36, bot + 2]], { ...ink2(4) })),
    line(h2, [[108, bot], [130, bot + 40], [170, bot + 46]], { ...ink2(5) }),
    // the G protein below (α, β, γ)
    circle(h2, 40, bot + 84, 92, 64, { fill: "#C9D8C3", stroke: P.ink, lw: 2.5 }),
    circle(h2, 112, bot + 92, 60, 50, { fill: "#DCE6D6", stroke: P.ink, lw: 2.5 }),
    circle(h2, 150, bot + 64, 34, 30, { fill: "#E8EEE4", stroke: P.ink, lw: 2.5 }),
    text(h2, "\u03B1", 40, bot + 84, { size: 24, weight: 800, fill: P.ink, family: SANS }),
    text(h2, "\u03B2", 112, bot + 92, { size: 22, weight: 800, fill: P.ink, family: SANS }),
    text(h2, "\u03B3", 150, bot + 64, { size: 18, weight: 800, fill: P.ink, family: SANS }),
    bound ? circle(h2, -36, top - 30, 30, 30, { fill: EXTRA.ligand, stroke: P.ink, lw: 2 }) : null
  );
}
function rtk(h2, active = false) {
  const d = active ? 22 : 60;
  const sub = (sx) => g(
    h2,
    { x: sx * d },
    circle(h2, 0, MEM.y - 120, 70, 90, { fill: EXTRA.receptorGreen, stroke: P.ink, lw: 2.5 }),
    rect(h2, 0, MEM.y, 18, MEM.h + 20, { r: 8, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 }),
    rect(h2, 0, MEM.y + 110, 46, 110, { r: 18, fill: PROTEIN_FILL, stroke: P.ink, lw: 2.5 }),
    active ? circle(h2, sx * -30, MEM.y + 90, 26, 26, { fill: P.na, stroke: P.ink, lw: 2 }) : null,
    active ? text(h2, "P", sx * -30, MEM.y + 90, { size: 16, weight: 800, fill: P.ink, family: SANS }) : null
  );
  return g(h2, {}, sub(-1), sub(1), active ? circle(h2, 0, MEM.y - 200, 34, 34, { fill: EXTRA.ligand, stroke: P.ink, lw: 2 }) : null);
}
function carrier(h2, openOut, accent) {
  const c = openOut;
  const top = 6 + 30 * c, bot = 36 - 30 * c, mid = 26, HALF = 70;
  const half = (sx) => line(h2, [[sx * top, -HALF], [sx * mid, 0], [sx * bot, HALF], [sx * 82, HALF], [sx * 96, HALF - 30], [sx * 96, -HALF + 30], [sx * 82, -HALF]], { closed: true, fill: PROTEIN_FILL, stroke: P.ink, w: 3, join: "round" });
  return g(h2, { y: MEM.y }, rect(h2, 0, 0, 200, MEM.h + 4, { fill: P.paper }), rect(h2, 0, 0, 200, MEM.h + 4, { fill: rgbaHex(P.mem, 0.08) }), half(-1), half(1), rect(h2, 0, -HALF - 6, 120, 8, { r: 4, fill: accent }));
}
function caChan(h2, open) {
  const y = MEM.y, d = 20 + 14 * open;
  return g(
    h2,
    {},
    rect(h2, 0, y, 2 * d - 12, MEM.h + 20, { fill: rgbaHex(EXTRA.ca, 0.12 + 0.4 * open) }),
    rect(h2, -d, y, 28, MEM.h + 50, { r: 12, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h2, d, y, 28, MEM.h + 50, { r: 12, fill: PROTEIN_FILL, stroke: P.ink, lw: 3 }),
    rect(h2, -d, y - MEM.h / 2 - 14, 28, 10, { fill: EXTRA.ca }),
    rect(h2, d, y - MEM.h / 2 - 14, 28, 10, { fill: EXTRA.ca })
  );
}
function ligandGated(h2, open) {
  const y = MEM.y, d = 20 + 12 * open;
  return g(
    h2,
    {},
    rect(h2, 0, y, 2 * d - 12, MEM.h + 20, { fill: rgbaHex(P.volt, 0.08 + 0.25 * open) }),
    rect(h2, -d, y - 8, 26, MEM.h + 64, { r: 10, fill: EXTRA.receptorGreen, stroke: P.ink, lw: 3 }),
    rect(h2, d, y - 8, 26, MEM.h + 64, { r: 10, fill: EXTRA.receptorGreen, stroke: P.ink, lw: 3 }),
    line(h2, [[-d - 14, y - MEM.h / 2 - 38], [-d + 2, y - MEM.h / 2 - 18], [d - 2, y - MEM.h / 2 - 18], [d + 14, y - MEM.h / 2 - 38]], ink2(3)),
    open > 0.5 ? circle(h2, 0, y - MEM.h / 2 - 32, 24, 24, { fill: EXTRA.ligand, stroke: P.ink, lw: 2 }) : null
  );
}
function vesicle(h2, n2 = 6) {
  return g(
    h2,
    {},
    circle(h2, 0, 0, 120, 120, { fill: "#F2F6F1", stroke: P.mem, lw: 6 }),
    circle(h2, 0, 0, 104, 104, { fill: "none", stroke: rgbaHex(P.mem, 0.5), lw: 2 }),
    Array.from({ length: n2 }, (_, i) => {
      const a = i / n2 * Math.PI * 2;
      return circle(h2, 24 * Math.cos(a), 24 * Math.sin(a), 18, 18, { fill: EXTRA.ligand, stroke: P.ink, lw: 1.5 });
    })
  );
}
function synapse(h2) {
  return g(
    h2,
    {},
    rect(h2, 0, -230, 90, 120, { fill: EXTRA.cyto, stroke: P.ink, lw: 3.5 }),
    circle(h2, 0, -60, 340, 260, { fill: EXTRA.cyto, stroke: P.ink, lw: 3.5 }),
    rect(h2, 0, -176, 84, 30, { fill: EXTRA.cyto }),
    g(h2, { x: -70, y: -70, s: 0.42 }, vesicle(h2)),
    g(h2, { x: 60, y: -90, s: 0.42 }, vesicle(h2)),
    g(h2, { x: -5, y: -10, s: 0.42 }, vesicle(h2)),
    [-70, -25, 20, 70].map((x, i) => circle(h2, x, 96 + i % 2 * 12, 14, 14, { fill: EXTRA.ligand, stroke: P.ink, lw: 1.5 })),
    rect(h2, 0, 200, 440, 90, { fill: rgbaHex(EXTRA.cyto, 0.8), stroke: P.ink, lw: 3.5 }),
    [-110, 0, 110].map((x) => g(h2, { x }, rect(h2, -12, 150, 16, 26, { r: 5, fill: EXTRA.receptorGreen, stroke: P.ink, lw: 2 }), rect(h2, 12, 150, 16, 26, { r: 5, fill: EXTRA.receptorGreen, stroke: P.ink, lw: 2 })))
  );
}
function capsule(h2) {
  return g(
    h2,
    { rot: -30 },
    rect(h2, -45, 0, 90, 80, { r: 40, fill: P.k, stroke: P.ink, lw: 3 }),
    rect(h2, 45, 0, 90, 80, { r: 40, fill: "#F1ECE2", stroke: P.ink, lw: 3 }),
    rect(h2, -45, -18, 60, 12, { r: 6, fill: "rgba(255,255,255,0.35)" })
  );
}
function tablet(h2) {
  return g(h2, {}, circle(h2, 0, 6, 150, 150, { fill: "#E4DED3", stroke: P.ink, lw: 3 }), circle(h2, 0, 0, 150, 150, { fill: "#FBF8F2", stroke: P.ink, lw: 3 }), line(h2, [[-50, 0], [50, 0]], { stroke: rgbaHex(P.ink, 0.4), w: 4, cap: "round" }));
}
function syringe(h2) {
  return g(
    h2,
    { rot: -20 },
    rect(h2, 0, 0, 260, 64, { r: 8, fill: "rgba(214,232,240,0.9)", stroke: P.ink, lw: 3 }),
    rect(h2, 40, 0, 170, 52, { r: 4, fill: rgbaHex(EXTRA.drug, 0.9) }),
    Array.from({ length: 7 }, (_, i) => line(h2, [[-90 + i * 30, -32], [-90 + i * 30, -16]], { stroke: P.ink, w: 2 })),
    rect(h2, -150, 0, 40, 40, { fill: "#C7CDD2", stroke: P.ink, lw: 3 }),
    line(h2, [[-170, 0], [-240, 0]], { ...ink2(10), stroke: "#8E969D" }),
    rect(h2, -250, 0, 16, 70, { r: 4, fill: "#C7CDD2", stroke: P.ink, lw: 3 }),
    line(h2, [[130, 0], [250, 0]], { ...ink2(4), stroke: "#8E969D" })
  );
}
function drugMolecule(h2) {
  return g(
    h2,
    {},
    line(h2, [[-120, 0], [-40, 0]], ink2(6)),
    line(h2, Array.from({ length: 7 }, (_, k) => [-150 + 30 * Math.cos(k * Math.PI / 3), 30 * Math.sin(k * Math.PI / 3)]), { closed: true, fill: "#E7D9F2", stroke: P.ink, w: 3 }),
    circle(h2, -10, 0, 54, 54, { fill: EXTRA.drug, stroke: P.ink, lw: 3 })
  );
}
function enzyme(h2) {
  const pts2 = [];
  for (let i = 0; i <= 40; i++) {
    const a = 0.55 + i / 40 * (Math.PI * 2 - 1.1);
    pts2.push([90 * Math.cos(a), 80 * Math.sin(a)]);
  }
  pts2.push([20, 0]);
  return g(h2, {}, line(h2, pts2, { closed: true, fill: "#C9D8C3", stroke: P.ink, w: 3, join: "round" }), circle(h2, -30, -26, 40, 26, { fill: "rgba(255,255,255,0.3)", rot: -25 }));
}
function mitochondrion(h2) {
  const cr = [];
  for (let i = 0; i <= 12; i++) cr.push([-110 + i * 18.3, i % 2 ? -30 : 30]);
  return g(h2, {}, rect(h2, 0, 0, 280, 130, { r: 65, fill: "#E9C9C4", stroke: P.ink, lw: 3 }), rect(h2, 0, 0, 250, 100, { r: 50, fill: "#F3DEDA", stroke: rgbaHex(P.ink, 0.5), lw: 2 }), line(h2, cr, { stroke: "#B9877F", w: 4, join: "round" }));
}
function cellOutline(h2) {
  return g(
    h2,
    {},
    circle(h2, 0, 0, 520, 380, { fill: rgbaHex(EXTRA.cyto, 0.8), stroke: P.ink, lw: 3.5 }),
    circle(h2, -40, 10, 170, 150, { fill: rgbaHex(P.mem, 0.25), stroke: rgbaHex(P.ink, 0.7), lw: 2.5 }),
    circle(h2, -30, 0, 50, 46, { fill: rgbaHex(P.mem, 0.45) }),
    g(h2, { x: 150, y: -70, s: 0.4 }, mitochondrion(h2)),
    g(h2, { x: 140, y: 90, s: 0.35, rot: 30 }, mitochondrion(h2))
  );
}
function atpChip(h2, label = "ATP") {
  return g(h2, {}, rect(h2, 0, 0, 92, 46, { r: 23, fill: "#F2E3A6", stroke: P.ink, lw: 2.5 }), text(h2, label, 0, 1, { size: 22, weight: 800, fill: P.ink, family: SANS }));
}
function vessel(h2) {
  return g(
    h2,
    {},
    circle(h2, 0, 0, 300, 300, { fill: "#E8B9B2", stroke: P.ink, lw: 3.5 }),
    circle(h2, 0, 0, 240, 240, { fill: "#F3D9D4", stroke: rgbaHex(P.ink, 0.6), lw: 2 }),
    circle(h2, 0, 0, 170, 170, { fill: "#C4605A", stroke: P.ink, lw: 2.5 }),
    [[-30, -20], [25, 15], [-10, 40], [40, -30]].map(([x, y]) => g(h2, { x, y, s: 0.28 }, rbcEl(h2)))
  );
}
function doseResponse(h2) {
  const pts2 = [];
  for (let i = 0; i <= 60; i++) {
    const x = -300 + i * 10, l = (x + 0) / 70;
    pts2.push([x, 120 - 240 / (1 + Math.exp(-l))]);
  }
  return g(
    h2,
    {},
    line(h2, [[-320, -150], [-320, 140], [320, 140]], ink2(3)),
    line(h2, pts2, { stroke: P.volt, w: 7, cap: "round", join: "round" }),
    text(h2, "log dose", 0, 176, { size: 22, weight: 700, fill: P.muted, family: SANS }),
    g(h2, { x: -350, y: -10, rot: -90 }, text(h2, "effect", 0, 0, { size: 22, weight: 700, fill: P.muted, family: SANS }))
  );
}
var V1 = "v1";
var V2 = "v2";
var LIB = "library-2026-11";
var ASSETS = [
  // 10-paper
  { id: "card-small", cat: "paper", desc: "blank torn-paper card, small (labels)", since: V1, box: [-140, -70, 280, 140], draw: (h2) => line(h2, tornPoints(240, 100, 11, "b"), { closed: true, fill: P.card, shadow: true }) },
  { id: "card-medium", cat: "paper", desc: "blank torn-paper card, medium (callouts, readouts)", since: V1, box: [-230, -110, 460, 220], draw: (h2) => line(h2, tornPoints(420, 180, 12, "b"), { closed: true, fill: P.card, shadow: true }) },
  { id: "card-large", cat: "paper", desc: "blank torn-paper card, large (equations, insets)", since: V1, box: [-360, -200, 720, 400], draw: (h2) => line(h2, tornPoints(680, 360, 13, "r"), { closed: true, fill: P.card, shadow: true }) },
  { id: "tape", cat: "paper", desc: "a strip of masking tape (stick on a card corner, rotated ~30\xB0)", since: V1, box: [-60, -22, 120, 44], draw: (h2) => g(h2, { op: 0.85 }, rect(h2, 0, 0, 96, 28, { fill: P.tape })) },
  // 20-marks
  { id: "pen-loop", cat: "marks", desc: "red pen loop (focus); reveal with a mask or scale", since: V1, box: [-180, -110, 360, 220], draw: (h2) => line(h2, penLoopPts(160, 90), { stroke: P.pen, w: 5, cap: "round", join: "round" }) },
  { id: "pen-x", cat: "marks", desc: "red pen X (cross out)", since: V2, box: [-110, -80, 220, 160], draw: (h2) => g(h2, {}, line(h2, [[-90, -60], [90, 60]], { stroke: P.pen, w: 14, cap: "round" }), line(h2, [[90, -60], [-90, 60]], { stroke: P.pen, w: 14, cap: "round" })) },
  { id: "pen-strike", cat: "marks", desc: "red pen strike-through line", since: V2, box: [-150, -12, 300, 24], draw: (h2) => line(h2, [[-140, 2], [140, -2]], { stroke: P.pen, w: 7, cap: "round" }) },
  { id: "pen-question", cat: "marks", desc: "red pen question mark", since: V2, box: [-60, -110, 120, 200], draw: (h2) => text(h2, "?", 0, 0, { size: 150, weight: 800, fill: P.pen, family: SANS }) },
  { id: "arrow-red", cat: "marks", desc: "red pen arrow (points at things)", since: V1, box: [-20, -30, 260, 60], draw: (h2) => arrow(h2, [0, 0], [220, 0], P.pen, 1, 6, 20) },
  { id: "arrow-ink", cat: "marks", desc: "ink arrow (flows, steps)", since: V1, box: [-20, -30, 260, 60], draw: (h2) => arrow(h2, [0, 0], [220, 0], P.ink, 1, 6, 20) },
  { id: "arrow-loop", cat: "marks", desc: "circular arrow (feedback loop); spin it", since: V2, box: [-70, -70, 140, 140], draw: (h2) => loopArrowEl(h2, 50, P.ink) },
  { id: "bracket", cat: "marks", desc: "red bracket (marks a range, e.g. the overshoot)", since: V2, box: [-20, -110, 60, 220], draw: (h2) => line(h2, [[0, -100], [30, -100], [30, 100], [0, 100]], { stroke: P.pen, w: 6, cap: "round", join: "round" }) },
  { id: "highlighter", cat: "marks", desc: "pink highlighter swipe (behind words); reveal left to right", since: V1, box: [-210, -30, 420, 60], draw: (h2) => rect(h2, 0, 0, 400, 44, { r: 6, fill: rgbaHex(P.hl, 0.6) }) },
  { id: "pointer-dot", cat: "marks", desc: "label pointer: leader line with a dot (text goes at the left end)", since: V1, box: [-10, -20, 220, 40], draw: (h2) => g(h2, {}, line(h2, [[0, 0], [200, 0]], { stroke: P.ink, w: 2.5 }), circle(h2, 200, 0, 14, 14, { fill: P.ink })) },
  { id: "dashed-line", cat: "marks", desc: "dashed ink line (0 mV, threshold, E_X levels)", since: V2, box: [-410, -8, 820, 16], draw: (h2) => h2("line", { x1: -400, y1: 0, x2: 400, y2: 0, stroke: rgbaHex(P.ink, 0.6), strokeWidth: 3, strokeDasharray: "18 12", strokeLinecap: "round" }) },
  { id: "spark", cat: "marks", desc: "stimulus spark", since: V2, box: [-45, -45, 90, 90], draw: (h2) => line(h2, Array.from({ length: 17 }, (_, i) => {
    const a = i * Math.PI / 8, r = i % 2 ? 14 : 36;
    return [r * Math.cos(a), r * Math.sin(a)];
  }), { closed: true, fill: "#F3C94C", stroke: P.ink, w: 2 }) },
  { id: "plus-charge", cat: "marks", desc: "a + charge (voltage pushing)", since: V2, box: [-45, -45, 90, 90], draw: (h2) => g(h2, {}, circle(h2, 0, 0, 80, 80, { fill: P.volt, stroke: P.ink, lw: 3 }), text(h2, "+", 0, 2, { size: 54, weight: 800, fill: "#FFFFFF", family: SANS })) },
  // 30-cell
  { id: "ion-na", cat: "cell", desc: "Na\u207A ion", since: V1, box: [-30, -30, 60, 60], tags: ["sodium"], draw: ion("na") },
  { id: "ion-k", cat: "cell", desc: "K\u207A ion", since: V1, box: [-30, -30, 60, 60], tags: ["potassium"], draw: ion("k") },
  { id: "ion-cl", cat: "cell", desc: "Cl\u207B ion", since: V1, box: [-30, -30, 60, 60], tags: ["chloride"], draw: ion("cl") },
  { id: "ion-ca", cat: "cell", desc: "Ca\xB2\u207A ion", since: LIB, box: [-30, -30, 60, 60], tags: ["calcium"], draw: (h2) => ball(h2, EXTRA.ca, "Ca\xB2\u207A", "#FFFFFF", 25, 15) },
  { id: "ion-h", cat: "cell", desc: "H\u207A ion", since: LIB, box: [-24, -24, 48, 48], tags: ["proton", "acid"], draw: (h2) => ball(h2, "#E6A0A0", "H\u207A", P.ink, 20, 15) },
  { id: "ion-anion", cat: "cell", desc: "trapped anion (protein, \u2212)", since: V1, box: [-38, -38, 76, 76], draw: ion("an") },
  { id: "ion-unknown", cat: "cell", desc: "an ion still to be named (?)", since: V2, box: [-30, -30, 60, 60], draw: (h2) => ball(h2, "#CFCAC0", "?", P.ink, 25, 26) },
  { id: "membrane-strip", cat: "cell", desc: "lipid bilayer strip (tile side by side for longer)", since: V1, box: [-370, -60, 740, 120], draw: (h2) => strip(h2, 720) },
  { id: "nav-channel--closed", cat: "cell", desc: "voltage-gated Na\u207A channel, closed (lid ready)", since: V2, box: [-200, -150, 400, 300], tags: ["sodium channel"], draw: onStrip(360, (h2) => navChan(h2, 0, 0)) },
  { id: "nav-channel--open", cat: "cell", desc: "voltage-gated Na\u207A channel, open", since: V2, box: [-200, -150, 400, 300], draw: onStrip(360, (h2) => navChan(h2, 0, 1)) },
  { id: "nav-channel--inactivated", cat: "cell", desc: "voltage-gated Na\u207A channel, inactivated (lid shut)", since: V2, box: [-200, -150, 400, 300], draw: onStrip(360, (h2) => navChan(h2, 0, 1, 1)) },
  { id: "kv-channel--closed", cat: "cell", desc: "voltage-gated K\u207A channel, closed", since: V2, box: [-200, -130, 400, 260], draw: onStrip(360, (h2) => kvChan(h2, 0, 0)) },
  { id: "kv-channel--open", cat: "cell", desc: "voltage-gated K\u207A channel, open", since: V2, box: [-200, -130, 400, 260], draw: onStrip(360, (h2) => kvChan(h2, 0, 1)) },
  { id: "leak-channel", cat: "cell", desc: "K\u207A leak channel (always open)", since: V1, box: [-200, -110, 400, 220], draw: onStrip(360, (h2) => leakChan(h2, 0)) },
  { id: "cav-channel--closed", cat: "cell", desc: "voltage-gated Ca\xB2\u207A channel, closed", since: LIB, box: [-200, -130, 400, 260], draw: onStrip(360, (h2) => caChan(h2, 0)) },
  { id: "cav-channel--open", cat: "cell", desc: "voltage-gated Ca\xB2\u207A channel, open", since: LIB, box: [-200, -130, 400, 260], draw: onStrip(360, (h2) => caChan(h2, 1)) },
  { id: "ligand-channel--closed", cat: "receptors", desc: "ligand-gated channel, closed", since: V2, box: [-200, -150, 400, 300], draw: onStrip(360, (h2) => ligandGated(h2, 0)) },
  { id: "ligand-channel--open", cat: "receptors", desc: "ligand-gated channel, open with ligand bound", since: V2, box: [-200, -150, 400, 300], draw: onStrip(360, (h2) => ligandGated(h2, 1)) },
  { id: "gpcr", cat: "receptors", desc: "G-protein-coupled receptor (7 helices) with G\u03B1\u03B2\u03B3 below", since: LIB, box: [-260, -150, 520, 400], draw: onStrip(500, (h2) => gpcr(h2)) },
  { id: "gpcr--bound", cat: "receptors", desc: "GPCR with ligand bound", since: LIB, box: [-260, -150, 520, 400], draw: onStrip(500, (h2) => gpcr(h2, true)) },
  { id: "rtk", cat: "receptors", desc: "receptor tyrosine kinase, apart (inactive)", since: LIB, box: [-220, -230, 440, 440], draw: onStrip(420, (h2) => rtk(h2)) },
  { id: "rtk--active", cat: "receptors", desc: "receptor tyrosine kinase, paired and phosphorylated", since: LIB, box: [-220, -270, 440, 480], draw: onStrip(420, (h2) => rtk(h2, true)) },
  { id: "ligand-dot", cat: "receptors", desc: "ligand / neurotransmitter molecule", since: V2, box: [-18, -18, 36, 36], draw: (h2) => circle(h2, 0, 0, 28, 28, { fill: EXTRA.ligand, stroke: P.ink, lw: 2 }) },
  { id: "pump-nak", cat: "transport", desc: "Na\u207A/K\u207A-ATPase (generic carrier, open inside)", since: V1, box: [-200, -130, 400, 260], draw: onStrip(360, (h2) => carrier(h2, 0, P.na)) },
  { id: "carrier--in", cat: "transport", desc: "transporter, open to the inside", since: LIB, box: [-200, -130, 400, 260], draw: onStrip(360, (h2) => carrier(h2, 0, P.mem)) },
  { id: "carrier--out", cat: "transport", desc: "transporter, open to the outside", since: LIB, box: [-200, -130, 400, 260], draw: onStrip(360, (h2) => carrier(h2, 1, P.mem)) },
  { id: "atp", cat: "transport", desc: "ATP chip", since: V1, box: [-52, -28, 104, 56], draw: (h2) => atpChip(h2) },
  { id: "adp", cat: "transport", desc: "ADP chip", since: V1, box: [-52, -28, 104, 56], draw: (h2) => atpChip(h2, "ADP") },
  { id: "vesicle", cat: "transport", desc: "synaptic vesicle full of transmitter", since: LIB, box: [-66, -66, 132, 132], draw: (h2) => vesicle(h2) },
  { id: "synapse", cat: "organs", desc: "synapse: terminal with vesicles, cleft, receptors", since: LIB, box: [-240, -300, 480, 560], draw: (h2) => synapse(h2) },
  { id: "neuron", cat: "organs", desc: "neuron (dendrites, soma, axon, terminals)", since: V1, box: [-300, -270, 1e3, 520], draw: (h2) => neuronEl(h2) },
  { id: "axon-cylinder", cat: "organs", desc: "axon as a cutaway cylinder (squid giant axon)", since: V1, box: [-490, -110, 980, 220], draw: (h2) => fibreEl(h2, 900, 170) },
  { id: "squid", cat: "organs", desc: "squid with its giant axon", since: V1, box: [-420, -240, 840, 480], draw: (h2) => squidEl(h2, 0) },
  { id: "myocyte", cat: "organs", desc: "cardiac muscle cell (capsule, striations, nucleus)", since: V1, box: [-140, -50, 280, 100], draw: (h2) => myocyteEl(h2) },
  { id: "red-blood-cell", cat: "organs", desc: "red blood cell", since: V1, box: [-60, -60, 120, 120], draw: (h2) => rbcEl(h2) },
  { id: "blood-vessel", cat: "organs", desc: "blood vessel cross-section with red cells", since: LIB, box: [-160, -160, 320, 320], draw: (h2) => vessel(h2) },
  { id: "cell", cat: "organs", desc: "generic cell: membrane, nucleus, mitochondria", since: LIB, box: [-270, -200, 540, 400], draw: (h2) => cellOutline(h2) },
  { id: "mitochondrion", cat: "organs", desc: "mitochondrion", since: LIB, box: [-150, -75, 300, 150], draw: (h2) => mitochondrion(h2) },
  // 50-pharm
  { id: "drug-molecule", cat: "pharm", desc: "generic drug molecule (no brand)", since: V2, box: [-190, -40, 230, 80], draw: (h2) => drugMolecule(h2) },
  { id: "capsule", cat: "pharm", desc: "capsule", since: LIB, box: [-110, -80, 220, 160], draw: (h2) => capsule(h2) },
  { id: "tablet", cat: "pharm", desc: "tablet (scored)", since: LIB, box: [-80, -80, 160, 168], draw: (h2) => tablet(h2) },
  { id: "syringe", cat: "pharm", desc: "syringe with drug", since: LIB, box: [-280, -130, 560, 260], draw: (h2) => syringe(h2) },
  { id: "enzyme", cat: "pharm", desc: "enzyme with an active-site notch", since: LIB, box: [-100, -90, 200, 180], draw: (h2) => enzyme(h2) },
  { id: "dose-response", cat: "graphs", desc: "dose\u2013response curve template (axes labelled)", since: LIB, box: [-380, -170, 760, 380], draw: (h2) => doseResponse(h2) },
  // 60-graphs: the action potential in pieces (model neuron), same scale throughout: 140 px per ms, 4 px per mV
  { id: "ap-full", cat: "graphs", desc: "action potential, whole (model neuron, blue)", since: V2, box: traceBox(MODEL, 0, 10), draw: traceAsset(MODEL, 0, 10, P.volt) },
  { id: "ap-coloured", cat: "graphs", desc: "action potential, upstroke mustard, fall violet", since: V2, box: traceBox(MODEL, 0, 10), draw: (h2) => {
    const pts2 = tracePts(MODEL, 0, 10);
    const mid = (Math.max(...pts2.map((p) => p[1])) + Math.min(...pts2.map((p) => p[1]))) / 2;
    const seg = (a, b, c) => line(h2, tracePts(MODEL, 0, 10).filter((_, i) => i * 0.02 >= a - 1e-9 && i * 0.02 <= b + 1e-9), { stroke: c, w: 7, cap: "round", join: "round" });
    return g(h2, { y: -mid }, seg(0, TT.threshold, P.volt), seg(TT.threshold, TT.peak, P.na), seg(TT.peak, TT.rest, P.k), seg(TT.rest, 10, P.volt));
  } },
  { id: "ap-upstroke", cat: "graphs", desc: "AP piece: rest \u2192 peak (\u221270 \u2192 +54), mustard", since: V2, box: traceBox(MODEL, 0, TT.peak), draw: traceAsset(MODEL, 0, TT.peak, P.na) },
  { id: "ap-fall", cat: "graphs", desc: "AP piece: peak \u2192 dip, violet", since: V2, box: traceBox(MODEL, TT.peak, TT.dip), draw: traceAsset(MODEL, TT.peak, TT.dip, P.k) },
  { id: "ap-bernstein", cat: "graphs", desc: "Bernstein's guess: flat top at 0 mV (grey)", since: V2, box: traceBox(BERNSTEIN, 0, 10), draw: traceAsset(BERNSTEIN, 0, 10, P.muted) },
  { id: "axes-voltage", cat: "graphs", desc: "voltage axis (vertical) with ticks every 20 mV", since: V2, box: [-30, -340, 60, 680], draw: (h2) => g(h2, {}, line(h2, [[0, -320], [0, 320]], ink2(3)), Array.from({ length: 9 }, (_, i) => line(h2, [[-12, -320 + i * 80], [12, -320 + i * 80]], ink2(3)))) }
];

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
var EASES = {
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
var rgb = (h2) => {
  const x = h2.length === 4 ? h2.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : h2;
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
  const f2 = (() => at(now()));
  f2.at = at;
  f2.to = (c, d, e = easeInOutCubic) => (s) => {
    segs.push({ s, d, to: c, e });
    segs.sort((a, b) => a.s - b.s);
    return s + d;
  };
  return f2;
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
function ionBall(h2, kind, r = 25) {
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
    h2,
    {},
    circle(h2, 0, 0, 2 * rr, 2 * rr, { fill, stroke: P.ink, lw: 2.5 }),
    circle(h2, -rr * 0.34, -rr * 0.36, rr * 0.62, rr * 0.48, { fill: "rgba(255,255,255,0.28)", rot: -30 }),
    text(h2, label, 0, 1, { size, weight: 800, fill: lc, family: SANS })
  );
}
var ION_KINDS = ["na", "k", "cl", "ca", "h", "an"];
var ionKind = (s) => {
  const k = (s ?? "na").toLowerCase().replace(/^sodium$/, "na").replace(/^potassium$/, "k").replace(/^chloride$/, "cl").replace(/^calcium$/, "ca").replace(/^anion$/, "an");
  if (!ION_KINDS.includes(k)) throw new Error(`kind: use one of ${ION_KINDS.join(", ")}`);
  return k;
};
function boundsOf(p, pad = 0) {
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}
function strokeLine(h2, p, stroke, w, end, dash, closed = false) {
  if (end <= 1e-3) return null;
  if (!dash) return line(h2, p, { stroke, w, cap: "round", join: "round", end, closed, fill: closed ? "none" : void 0 });
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
  return h2("polyline", { points: out.map((q) => q.join(",")).join(" "), fill: "none", stroke, strokeWidth: w, strokeDasharray: dash, strokeLinecap: "round", strokeLinejoin: "round" });
}
function arrowHead(h2, a, b, stroke, w) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const L = 10 + w * 2.6, spread = 0.45;
  const p1 = [b[0] - L * Math.cos(ang - spread), b[1] - L * Math.sin(ang - spread)];
  const p2 = [b[0] - L * Math.cos(ang + spread), b[1] - L * Math.sin(ang + spread)];
  return line(h2, [p1, b, p2], { stroke, w, cap: "round", join: "round" });
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
      return { draw: (h2) => a.draw(h2), box: () => ({ cx: bx + bw / 2, cy: by + bh / 2, w: bw, h: bh }) };
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
        draw: (h2) => g(h2, {}, v.now().map(([c, k]) => {
          const it = items(c, o.base.color(), chars());
          return g(h2, { op: k }, it.draw(h2, off(it.w), 0));
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
    desc: "an equation in the LaTeX look (\\frac{a}{b}, x_{o}, x^{+}, \\it{V}, \\log)",
    opts: '"tex"  fontsize=44',
    takesText: true,
    example: 'add math nernst "\\it{E} = 61.5 \\log \\frac{[K^{+}]_{o}}{[K^{+}]_{i}}"',
    make(o) {
      const size = n(o, "fontsize", 44);
      const v = versions(o.text);
      return {
        swap: (c, s, d) => v.add(c, s, d),
        draw: (h2) => g(h2, {}, v.now().map(([c, k]) => g(h2, { op: k }, tex(c, { size, color: o.base.color() }).draw(h2, 0, 0)))),
        box: () => {
          const it = tex(v.now().slice(-1)[0][0], { size });
          return { cx: 0, cy: 0, w: it.w, h: it.h };
        }
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
        draw: (h2) => {
          const [W, Ht] = sizeNow();
          const sx = tapeSide.startsWith("l") ? -1 : 1;
          return g(
            h2,
            {},
            line(h2, edge(W, Ht), { closed: true, fill: P.card, shadow: true }),
            v.now().map(([c, k]) => {
              const it = colOf(c, o.base.color());
              return it ? g(h2, { op: k }, it.draw(h2, 0, 0)) : null;
            }),
            tapeSide !== "none" && tapeSide !== "no" ? g(h2, { x: sx * (W / 2 - 22), y: -Ht / 2 - 2, rot: sx * -32 }, line(h2, tp, { closed: true, fill: P.tape, op: 0.8 })) : null
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
        props,
        draw: (h2) => tr.el(h2),
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
    opts: 'kind=circle|rect|ellipse|path  w=  h=  r=  path="M0 0 L100 0"  fill=  lw=4  dash=',
    example: "add shape pore kind=rect w=60 h=180 fill=protein",
    make(o) {
      const kind = (o.opts.kind ?? (o.opts.path ? "path" : "circle")).toLowerCase();
      const w = n(o, "w", n(o, "r", 60) * 2), ht = n(o, "h", kind === "circle" ? w : n(o, "r", 60) * 2);
      const fill = o.opts.fill ? color(o.opts.fill) : "none";
      const lw = n(o, "lw", o.opts.fill && !o.opts.color ? 3 : 4);
      const end = sig(1);
      const strokeC = () => o.opts.stroke === "none" ? "none" : o.base.color();
      if (o.opts.stroke && o.opts.stroke !== "none") o.base.color = csig(color(o.opts.stroke));
      return {
        props: { end },
        draw: (h2) => {
          const e = end();
          if (kind === "path") return path(h2, o.opts.path, { fill, stroke: strokeC(), lw, cap: "round", join: "round" });
          if (e < 0.999) {
            const P2 = [];
            if (kind === "rect") {
              const a = w / 2, b = ht / 2;
              P2.push([-a, -b], [a, -b], [a, b], [-a, b], [-a, -b]);
            } else for (let i = 0; i <= 72; i++) {
              const t = -Math.PI / 2 + i / 72 * Math.PI * 2;
              P2.push([w / 2 * Math.cos(t), ht / 2 * Math.sin(t)]);
            }
            return strokeLine(h2, P2, strokeC(), lw, e);
          }
          if (kind === "rect") return rect(h2, 0, 0, w, ht, { r: n(o, "round", 10), fill, stroke: strokeC(), lw });
          return circle(h2, 0, 0, w, ht, { fill, stroke: strokeC(), lw });
        },
        box: () => ({ cx: 0, cy: 0, w, h: ht })
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
      return { draw: (h2) => ionBall(h2, kind), box: () => ({ cx: 0, cy: 0, w: 52, h: 52 }) };
    }
  },
  ions: {
    name: "ions",
    desc: "a drifting field of ions scattered in an area (the same scatter every render)",
    opts: "kind=na|k|cl|ca|h|an  count=12  area=w,h  seed=",
    example: "add ions outside kind=na count=14 area=900,220 at=0,-260",
    make(o) {
      const kind = ionKind(o.opts.kind ?? o.text);
      const count = Math.round(n(o, "count", 12));
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
      return {
        draw: (h2) => g(h2, {}, spots.map((s) => {
          const t = now();
          return g(h2, { x: s.x + 2.6 * Math.sin(t * s.fq * 2 * Math.PI + s.ph), y: s.y + 2.6 * Math.cos(t * s.fq * 1.6 * Math.PI + s.ph * 1.7) }, ionBall(h2, kind));
        })),
        box: () => ({ cx: 0, cy: 0, w: aw, h: ah }),
        points: pts2
      };
    }
  },
  membrane: {
    name: "membrane",
    desc: "the lipid bilayer strip (teal heads, paired tails)",
    opts: "length=1200",
    example: "add membrane mem length=1600 at=0,60",
    make(o) {
      const L = n(o, "length", 1200);
      return { draw: (h2) => g(h2, { x: -MEM.x0 - L / 2, y: -MEM.y }, membraneEl(h2, { x1: MEM.x0 + L })), box: () => ({ cx: 0, cy: 0, w: L, h: MEM.h + 8 }) };
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
        draw: (h2) => g(h2, { y: -MEM.y }, kind === "nav" ? navChan(h2, 0, open(), lid(), lidshow(), glow()) : kind === "kv" ? kvChan(h2, 0, open()) : leakChan(h2, 0)),
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
  const from = o.opts.from ? points(o.opts.from, o.env)[0] : [0, 0];
  const to = o.opts.to ? points(o.opts.to, o.env)[0] : [200, 0];
  const via = o.opts.via ? points(o.opts.via, o.env) : [];
  const p = [from, ...via, to];
  const lw = n(o, "lw", head ? 5 : 4);
  const dash = o.opts.dash !== void 0 ? o.opts.dash && /\d/.test(o.opts.dash) ? o.opts.dash.replace(",", " ") : "18 12" : void 0;
  if (!o.opts.color) o.base.color = csig(head ? P.pen : P.ink);
  const end = sig(1);
  const pts2 = { start: () => from, end: () => to };
  return {
    props: { end },
    draw: (h2) => {
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
      return g(h2, {}, strokeLine(h2, p, c, lw, e, dash), head && e > 0.05 ? arrowHead(h2, tipA, tipB, c, lw) : null);
    },
    box: () => boundsOf(p, lw),
    points: pts2
  };
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
  const lab = (v) => Math.abs(v) >= 1e3 || Math.abs(v) < 0.01 && v !== 0 ? v.toExponential(0).replace("e+", "e") : String(+v.toFixed(3));
  const axes = sig(1);
  return {
    props: { axes },
    draw: (h2) => {
      const a = axes();
      if (a < 1e-3) return null;
      return g(
        h2,
        { op: a },
        line(h2, [[-w / 2, -ht / 2 - 20], [-w / 2, ht / 2], [w / 2 + 20, ht / 2]], { stroke: P.ink, w: 4, cap: "round", join: "round" }),
        xt.map((v) => g(h2, {}, line(h2, [[X2(v), ht / 2], [X2(v), ht / 2 + 12]], { stroke: P.ink, w: 3 }), text(h2, lab(v), X2(v), ht / 2 + 34, { size: 22, weight: 600, fill: P.muted, family: SANS }))),
        yt.map((v) => g(h2, {}, line(h2, [[-w / 2 - 12, Y2(v)], [-w / 2, Y2(v)]], { stroke: P.ink, w: 3 }), text(h2, lab(v), -w / 2 - 20, Y2(v), { size: 22, weight: 600, fill: P.muted, family: SANS, align: "r" }))),
        o.opts.xlabel ? text(h2, o.opts.xlabel, 0, ht / 2 + (xt.length ? 74 : 42), { size: 26, weight: 700, fill: P.muted, family: SANS }) : null,
        o.opts.ylabel ? g(h2, { x: -w / 2 - (yt.length ? 84 : 40), y: 0, rot: -90 }, text(h2, o.opts.ylabel, 0, 0, { size: 26, weight: 700, fill: P.muted, family: SANS })) : null
      );
    },
    box: () => ({ cx: 0, cy: 0, w: w + 40, h: ht + 40 }),
    points: { origin: () => [X2(x0), Y2(y0)], "x-end": () => [X2(x1), Y2(y0)], "y-end": () => [X2(x0), Y2(y1)] },
    pointFn: (name, arg) => name === "x" ? [X2(arg), Y2(y0)] : name === "y" ? [X2(x0), Y2(arg)] : null,
    _plot: api
  };
}
function makeCurve(o) {
  const plot = o.parent?._plot;
  if (!plot) throw new Error("a curve goes on a plot: add on=<plot name>, like on=dr");
  const fn = (o.opts.fn ?? (o.opts.points ? "points" : "hill")).toLowerCase();
  const P0 = {
    hill: { ec50: Math.sqrt(plot.x0 * plot.x1), emax: plot.y1, n: 1, e0: plot.y0 },
    line: { m: 1, b: 0 },
    decay: { a: plot.y1, k: 1, c: plot.y0 },
    rise: { a: plot.y1, k: 1, c: plot.y0 },
    points: {}
  };
  if (!P0[fn]) throw new Error(`fn: use hill, line, decay, rise or points`);
  const props = {};
  for (const [k, d] of Object.entries(P0[fn])) props[k] = sig(o.opts[k] !== void 0 ? num(o.opts[k], o.env) : d);
  const pts2 = o.opts.points ? monotone(points(o.opts.points, o.env)) : null;
  const f2 = (x) => {
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
      default:
        return pts2(x);
    }
  };
  const fx = (u) => plot.logx ? Math.pow(10, Math.log10(plot.x0) + u * (Math.log10(plot.x1) - Math.log10(plot.x0))) : plot.x0 + u * (plot.x1 - plot.x0);
  const toU = (x) => plot.logx ? (Math.log10(x) - Math.log10(plot.x0)) / (Math.log10(plot.x1) - Math.log10(plot.x0)) : (x - plot.x0) / (plot.x1 - plot.x0);
  props.draw = sig(1);
  props.tip = sig(0);
  const lw = n(o, "lw", 7);
  const dash = o.opts.dash !== void 0 ? "22 14" : void 0;
  if (!o.opts.color) o.base.color = csig(P.volt);
  const yc = (y) => Math.max(plot.y0 - (plot.y1 - plot.y0) * 0.05, Math.min(plot.y1 + (plot.y1 - plot.y0) * 0.05, y));
  const at = (u) => {
    const x = fx(u);
    return [plot.X(x), plot.Y(yc(f2(x)))];
  };
  return {
    props,
    draw: (h2) => {
      const e = props.draw();
      if (e <= 1e-3) return null;
      const N = 160, P2 = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N * e;
        P2.push(at(u));
      }
      const col = o.base.color();
      const tip = at(e);
      return g(
        h2,
        {},
        strokeLine(h2, P2, col, lw, 1, dash),
        props.tip() > 1e-3 ? circle(h2, tip[0], tip[1], 40, 40, { fill: rgbaHex(col.startsWith("#") ? col : P.volt, 0.25 * props.tip()) }) : null
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
      ...fn === "hill" ? { ec50: () => [plot.X(props.ec50()), plot.Y((props.emax() + props.e0()) / 2)], top: () => at(1) } : {}
    },
    pointFn: (name, arg) => name === "x" || name === "t" ? [plot.X(arg), plot.Y(yc(f2(arg)))] : null,
    _toU: toU
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
    draw: (h2) => {
      const it = textItem(fmt(value()), { size, fill: o.base.color(), weight: 800, family: fam });
      if (!card) return it.draw(h2, 0, 0);
      const W = widest() + 56, Ht = size * 1.2 + 34;
      return g(h2, {}, line(h2, tornPoints(W, Ht, seed, "b"), { closed: true, fill: P.card, shadow: true }), it.draw(h2, 0, 0));
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
  for (const [k, f2] of Object.entries(std)) if (!base.points[k]) base.points[k] = f2;
  return base;
}
function hash(s) {
  let h2 = 2166136261;
  for (const c of s) h2 = Math.imul(h2 ^ c.charCodeAt(0), 16777619);
  return h2;
}
function toStage(o, p, t) {
  let [x, y] = p;
  for (let c = o; c; c = c.parent) {
    const s = c.s.at(t), r = c.rot.at(t) * Math.PI / 180;
    x *= s * c.flip;
    y *= s;
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
    x /= s * c.flip;
    y /= s;
  }
  return [x, y];
}
var penCache = /* @__PURE__ */ new Map();
function drawObj(h2, o) {
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
    h2,
    {},
    hl > 1e-3 ? line(h2, [[bx.cx - bx.w / 2 + 2, bx.cy + 3], [bx.cx - bx.w / 2 + 2 + (bx.w - 4) * hl, bx.cy + 3]], { stroke: P.hl, w: Math.max(20, Math.min(bx.h * 0.7, 80)), op: 0.62 * d.hl.op() }) : null,
    o.draw(h2),
    kids.map((k) => drawObj(h2, k)),
    ul > 1e-3 ? line(h2, [[bx.cx - bx.w / 2, bx.cy + bx.h / 2 + 6], [bx.cx + bx.w / 2, bx.cy + bx.h / 2 + 2]], { stroke: P.pen, w: 5, cap: "round", end: ul, op: d.ul.op() }) : null,
    st > 1e-3 ? line(h2, [[bx.cx - bx.w / 2 - 6, bx.cy + 2], [bx.cx + bx.w / 2 + 6, bx.cy - 2]], { stroke: P.pen, w: 6, cap: "round", end: st, op: d.strike.op() }) : null,
    cr > 1e-3 ? g(
      h2,
      { op: d.cross.op() },
      line(h2, [[bx.cx - bx.w / 2, bx.cy - bx.h / 2], [bx.cx + bx.w / 2, bx.cy + bx.h / 2]], { stroke: P.pen, w: 12, cap: "round", end: Math.min(1, cr * 2) }),
      cr > 0.5 ? line(h2, [[bx.cx + bx.w / 2, bx.cy - bx.h / 2], [bx.cx - bx.w / 2, bx.cy + bx.h / 2]], { stroke: P.pen, w: 12, cap: "round", end: (cr - 0.5) * 2 }) : null
    ) : null,
    pe > 1e-3 ? (() => {
      const key = `${o.seed}:${bx.w.toFixed(0)}x${bx.h.toFixed(0)}`;
      let pts2 = penCache.get(key);
      if (!pts2) penCache.set(key, pts2 = penLoop(bx.w / 2 + 16, bx.h / 2 + 10, o.seed).main);
      return line(h2, pts2.map(([a, b]) => [a + bx.cx, b + bx.cy]), { stroke: P.pen, w: 4, cap: "round", join: "round", end: pe, op: d.pen.op() });
    })() : null
  );
  return g(
    h2,
    { x: o.x() + dx, y: o.y() + dy, rot: o.rot(), s: o.s(), op },
    o.flip === -1 ? h2("g", { transform: "scale(-1 1)" }, inner) : inner
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
function clocks(beats, timings) {
  const out = [];
  let t = 0;
  for (const b of beats) {
    const script = toks(b.text.replace(/\[[^\]]*\]/g, " "));
    const pause = /\[pause\]/i.test(b.text) ? 1.2 : 0;
    const tm = timings?.beats?.[b.id];
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
      out.push({ id: b.id, start: t, length: tm.duration, speechEnd: s1, audio: true, cue: (words) => {
        const i = find(flat2.map((f2) => f2.w), words, true);
        if (i >= 0) return { t: flat2[i].s, heard: true };
        const j = find(script, words, false);
        if (j < 0) return null;
        return { t: s0 + j / Math.max(1, script.length) * (s1 - s0), heard: false };
      } });
      t += tm.duration;
    } else {
      const speech = script.length / WPS + pause;
      const length = LEAD + speech + TAIL;
      out.push({ id: b.id, start: t, length, speechEnd: LEAD + speech, audio: false, cue: (words) => {
        const j = find(script, words, false);
        return j < 0 ? null : { t: LEAD + j / WPS, heard: true };
      } });
      t += length;
    }
  }
  return out;
}

// src/mic/build.ts
var D = (c, dflt) => c.line.opts.in !== void 0 ? dur(c.line.opts.in) : c.line.opts.for !== void 0 ? dur(c.line.opts.for) : dflt;
var E = (c, dflt) => ease(c.line.opts.ease, dflt);
var each = (c, f2) => {
  if (!c.targets.length) throw new Error(`"${c.line.verb}" needs something to act on, like: ${c.line.verb} ap`);
  return Math.max(c.start, ...c.targets.map((o) => f2(o)(c.start)));
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
  const dir = (c.line.opts.from ?? c.line.opts.out ?? "bottom").toLowerCase();
  const off = dir.startsWith("t") ? [0, -1200] : dir.startsWith("l") ? [-2100, 0] : dir.startsWith("r") ? [2100, 0] : [0, 1200];
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
  if (o.props.end) return chain(o.props.end.set(0), o.props.end.to(1, D(c, 0.9), E(c, easeInOutCubic)))(s);
  throw new Error(`"draw" works on a trace, line, arrow or shape; "${o.name}" is a ${o.type} (use show or grow)`);
}));
verb("erase", "Draw", "undraw a line, arrow or shape (a trace fades)", "erase a1", (c) => each(c, (o) => o.props.end ? o.props.end.to(0, D(c, 0.6), E(c, easeInOutCubic)) : o.op.to(0, D(c, T.out), easeInCubic)));
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
  o.draw = (h2) => g(
    h2,
    {},
    text(h2, words, tx, ty, { size, weight: 700, fill: col, family: SANS, align }),
    lead() > 1e-3 ? line(h2, [st, [st[0] + (0 - st[0]) * lead(), st[1] + (0 - st[1]) * lead()]], { stroke: col, w: 2.5, cap: "round" }) : null,
    lead() > 0.95 ? circle(h2, 0, 0, 12, 12, { fill: col }) : null
  );
  o.box = () => ({ cx: tx, cy: ty, w: Math.max(60, words.length * size * 0.55), h: size * 1.3 });
  o.x.set(p[0])(0);
  o.y.set(p[1])(0);
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
verb("travel", "Motion", 'move along points: travel n1 via="0,-100 0,100" to=0,240 in=1.5s', "travel n1 via=pore.top to=pore.bottom in=1.2s", (c) => each(c, (o) => (s) => {
  const t = s;
  const pts2 = [...c.line.opts.via ? points(c.line.opts.via, c.b.env) : [], ...c.line.opts.to ? [point(c.line.opts.to, c.b.env)] : [], ...c.line.opts.along ? points(c.line.opts.along, c.b.env) : []];
  if (!pts2.length) throw new Error('travel needs to=... (and optionally via="x,y x,y")');
  const local = pts2.map((p) => toParent(o, p, t));
  const from = [o.x.at(t), o.y.at(t)];
  const legs = [from, ...local];
  const L = legs.slice(1).map((p, i) => Math.hypot(p[0] - legs[i][0], p[1] - legs[i][1]));
  const total = L.reduce((a, b) => a + b, 0) || 1;
  const run = D(c, Math.max(0.6, total / 400));
  if (local.length === 1) return Math.max(o.x.to(local[0][0], run, E(c, easeInOutCubic))(t), o.y.to(local[0][1], run, E(c, easeInOutCubic))(t));
  let cur = t;
  local.forEach((p, i) => {
    const d = run * L[i] / total;
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
verb("camera", "Camera", "camera focus <thing or point> zoom=1.6  \xB7  camera pan to=x,y  \xB7  camera zoom 1.4  \xB7  camera reset", "camera focus ap.peak zoom=1.6", (c) => {
  const sub = (c.line.args[0]?.text ?? "").toLowerCase();
  const cam = c.b.cam, t = c.start, run = D(c, T.cam);
  const zNow = cam.node.s.at(t);
  const centre = () => [-cam.node.x.at(t) / zNow, -cam.node.y.at(t) / zNow];
  if (sub === "reset") return cam.reset(run)(t);
  if (sub === "focus" || sub === "frame") {
    const what = c.line.args[1]?.text ?? c.line.opts.on;
    if (!what) throw new Error("camera focus needs a thing or a point, like: camera focus ap.peak");
    const p = point(what, c.b.env);
    return cam.frame(p, c.line.opts.zoom ? num(c.line.opts.zoom, c.b.env) : Math.max(zNow, 1.4), run)(t);
  }
  if (sub === "pan") return cam.frame(point(c.line.opts.to ?? c.line.args[1]?.text ?? "0,0", c.b.env), zNow, run)(t);
  if (sub === "zoom") return cam.frame(centre(), num(c.line.args[1]?.text ?? c.line.opts.to ?? "1", c.b.env), run)(t);
  throw new Error("camera: use focus, pan, zoom or reset");
});
var Builder = class {
  objs = /* @__PURE__ */ new Map();
  cam = makeCamera();
  env;
  vars = {};
  labels = 0;
  t = 0;
  // the script time of the line being built (points are read here)
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
            const names = ["at", "x", "y", "size", "rotate", "opacity", "color", "drift", "layer", ...Object.keys(o.props)];
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
function buildMic(source, timings, o = {}) {
  resetLastEnd();
  resetOrder();
  const lib = o.library ? parse(o.library) : null;
  const parsed = parse(source);
  const defines = { ...lib?.defines ?? {}, ...parsed.defines };
  const errors = [...parsed.errors];
  const warnings = [];
  const b = new Builder();
  const beatHeads = parsed.items.filter((i) => i.kind === "beat").map((i) => i.beat);
  const seen = /* @__PURE__ */ new Set();
  for (const bh of beatHeads) {
    if (seen.has(bh.id)) errors.push({ line: bh.n, msg: `beat ${bh.id} appears twice` });
    seen.add(bh.id);
  }
  const cl = clocks(beatHeads, timings);
  const clockOf = new Map(cl.map((c) => [c.id, c]));
  const lines = [];
  let beat = null;
  let prevStart = 0, prevEnd = 0, maxEnd = 0;
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
      if (/^(keep)$/i.test(a.text)) {
        l.opts[a.text.toLowerCase()] = "";
        continue;
      }
      if (l.verb === "label" || l.verb === "camera" || l.verb === "wait") continue;
      const ob = b.objs.get(a.text);
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
  const doAdd = (l, s, n2) => {
    const words = l.args.filter((a) => a.kind === "word").map((a) => a.text);
    let type = (words[0] ?? "").toLowerCase();
    let name = words[1];
    const opts = { ...l.opts };
    if (!TYPES[type]) {
      if (ASSET_NAMES.includes(words[0])) {
        opts.name = words[0];
        type = "asset";
      } else {
        const near = closest(type, [...Object.keys(TYPES), ...ASSET_NAMES]);
        throw new Error(`"${words[0] ?? ""}" isn't a type of object${near ? `. Did you mean ${near}?` : ""}. Types: ${Object.keys(TYPES).join(", ")}`);
      }
    }
    const flags = words.slice(2).map((w) => w.toLowerCase());
    for (const f2 of flags) opts[f2] = opts[f2] ?? "";
    if (!name) name = `${type}${b.objs.size + 1}`;
    if (!/^[A-Za-z_][\w-]*$/.test(name)) throw new Error(`"${name}" can't be a name: use letters, digits, - and _ (start with a letter)`);
    const txt = l.args.find((a) => a.kind === "str")?.text ?? opts.text ?? "";
    const pg = opts.group ?? opts.on;
    const parent = pg ? b.objs.get(pg) ?? (() => {
      throw new Error(`no ${opts.on ? "plot" : "group"} called "${pg}"`);
    })() : null;
    const ob = b.addObj(type, name, n2, txt, opts, parent);
    if (opts.fixed !== void 0) ob.fixed = true;
    const startOpts = {};
    for (const k of ["at", "x", "y", "size", "scale", "rotate", "tilt", "layer", "drift"]) if (opts[k] !== void 0 && opts[k] !== "") startOpts[k] = opts[k];
    b.t = s;
    b.setProps(ob, startOpts, 0, 0, linear);
    if (opts.layer !== void 0) ob.layer = num(opts.layer, b.env);
    const hidden = opts.hidden !== void 0 && opts.hidden !== "no";
    if (hidden) return s;
    const how = (opts.show ?? "none").toLowerCase();
    const vis = opts.opacity !== void 0 ? num(opts.opacity, b.env) : 1;
    if (how === "none") {
      ob.op.set(vis)(s);
      return s;
    }
    const fake = { line: { ...l, opts: { ...opts.in ? { in: opts.in } : {}, ...opts.opacity ? { opacity: opts.opacity } : {} } }, targets: [ob], start: s, b };
    if (how === "draw" || how === "write") return VERBS[how].run(fake);
    return appear(ob, how, fake)(s);
  };
  for (const it of parsed.items) {
    try {
      if (it.kind === "beat") {
        beat = clockOf.get(it.beat.id);
        prevEnd = Math.max(prevEnd, beat.start);
        prevStart = prevEnd;
      } else if (it.kind === "let") {
        b.vars[it.name] = num(it.expr, b.env);
      } else if (it.kind === "code") {
        warnings.push({ line: it.n, msg: "code blocks are skipped in the editor preview (they run in the full render only)" });
      } else {
        runLine(it.line, it.line.n);
      }
    } catch (e) {
      errors.push({ line: it.kind === "beat" ? it.beat.n : it.kind === "line" ? it.line.n : it.n, msg: e.message ?? String(e) });
    }
  }
  const lastBeatEnd = cl.length ? cl[cl.length - 1].start + cl[cl.length - 1].length : 0;
  const audio = cl.length > 0 && cl.every((c) => c.audio);
  const seconds = Math.max(1 / 30, audio ? lastBeatEnd : Math.max(lastBeatEnd, maxEnd, getLastEnd()));
  const cam = b.cam;
  const scene = {
    id: o.id ?? "mic",
    seconds,
    el: (h2) => {
      const r = b.roots().sort((a, c) => a.layer - c.layer || a.order - c.order);
      return g(h2, {}, cam.g(h2, ...r.filter((x) => !x.fixed).map((ob) => drawObj(h2, ob))), ...r.filter((x) => x.fixed).map((ob) => drawObj(h2, ob)));
    },
    camera: cam,
    background: P.paper,
    late: lines.filter((x) => x.late).map((x) => [`line ${x.line}`, x.late]),
    lastTween: getLastEnd()
  };
  const beats = cl.map((c) => ({ id: c.id, start: c.start, length: c.length, audio: c.audio, line: beatHeads.find((x) => x.id === c.id).n, text: beatHeads.find((x) => x.id === c.id).text }));
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
    scene,
    beats,
    errors: errors.sort((a, c) => a.line - c.line),
    warnings,
    lines,
    objects: [...b.objs.values()].map((x) => ({ name: x.name, type: x.type, line: x.line })),
    objectsByName: b.objs,
    hit,
    seconds
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
function films(files, timings, library) {
  return [...files].sort((a, b) => a.name.localeCompare(b.name)).map((f2) => {
    const result = buildMic(f2.src, timings, { id: slug(f2.name), library });
    const beats = micBeatScenes(result, slug(f2.name)).map((b, i) => ({
      id: `${slug(f2.name)}-${String(i + 1).padStart(2, "0")}-${slug(b.beat)}`,
      beat: b.beat,
      scene: b.scene
    }));
    return { file: f2.name, result, beats };
  });
}

// src/mic/remotion-root.tsx
import { Fragment, jsx as jsx3 } from "react/jsx-runtime";
IMAGES.length = 0;
var FPS = 30;
function makeRoot(input) {
  const all2 = films(input.files, input.timings, input.library);
  for (const f2 of all2) for (const e of f2.result.errors) console.error(`${f2.file} line ${e.line}: ${e.msg}`);
  const byId = new Map(all2.flatMap((f2) => f2.beats.map((b) => [b.id, b.scene])));
  const Comp = ({ id }) => /* @__PURE__ */ jsx3(SequenceView, { scenes: [byId.get(id)] });
  return () => /* @__PURE__ */ jsx3(Fragment, { children: [...byId.entries()].map(([id, sc]) => /* @__PURE__ */ jsx3(Composition, { id, component: Comp, defaultProps: { id }, durationInFrames: framesOf(sc, FPS), fps: FPS, width: 1920, height: 1080 }, id)) });
}
export {
  FPS,
  makeRoot
};
