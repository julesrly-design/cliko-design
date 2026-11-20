// CLIKO — « GTA VI IS HERE. WE ARE TOO. »
// Intro motion design temps réel pour cliko.be : WebGL (décors), Canvas 2D (silhouettes), DOM (typographie), Web Audio (musique).
// Tout est une fonction pure du temps t : la lecture, la navigation et le rendu vidéo image par image donnent exactement la même chose.
import { BEAT, S, AUTO_EXIT, clamp, lerp, prog, bell, E, hit, hash } from "./timeline.js";
import { createGL } from "./gl.js";
import { createSilhouettes } from "./silhouettes.js";
import { LivePlayer } from "./audio.js";
import { CSS } from "./styles.js";
import { buildMarkup, codeLens } from "./markup.js";
import { STR, pickLang } from "./i18n.js";

const KEY = "cliko-intro:v1";
const smooth = (x) => x * x * (3 - 2 * x);

// ——— écriture de styles avec cache (aucune écriture inutile dans le DOM) ———
const css = (el, k, v) => {
  const c = el.__c || (el.__c = {});
  if (c[k] !== v) {
    c[k] = v;
    el.style.setProperty(k, v);
  }
};
const op = (el, o) => css(el, "opacity", o <= 0.002 ? "0" : o >= 0.998 ? "1" : o.toFixed(3));
const fl = (el, px) => css(el, "filter", px > 0.25 ? `blur(${px.toFixed(1)}px)` : "none");
const T3 = (x, y, s = 1, extra = "") => `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})${extra}`;
const tf = (el, x = 0, y = 0, s = 1, extra = "") => css(el, "transform", T3(x, y, s, extra));
const tfc = (el, x = 0, y = 0, s = 1, extra = "") => css(el, "transform", "translate(-50%,-50%) " + T3(x, y, s, extra));
const show = (el, on, d = "flex") => css(el, "display", on ? d : "none");
const chroma = (el, amt, base = "") => {
  if (amt < 0.3) return css(el, "filter", base || "none");
  const a = amt.toFixed(1);
  css(el, "filter", `${base} drop-shadow(${a}px 0 0 rgba(255,40,140,.75)) drop-shadow(-${a}px 0 0 rgba(40,220,255,.6))`);
};

// Clignotement déterministe d'un tube néon qui s'allume
function neonOn(b, at) {
  const d = b - at;
  if (d < 0) return 0;
  const steps = [[0, 1], [0.05, 0], [0.11, 0.9], [0.15, 0], [0.27, 1], [0.31, 0.15], [0.37, 1]];
  let v = 0;
  for (const [s, k] of steps) if (d >= s) v = k;
  if (d > 1.6 && d < 1.66) v = 0.35; // micro-coupure
  if (d > 3.1 && d < 3.14) v = 0.5;
  return v;
}

// ——— Plan de montage des décors (en beats) ———
const SEG = [
  { from: -99, id: 0, sil: null }, // bokeh
  { from: 8, id: 1, sil: "sunset" }, // coucher de soleil
  { from: 12, id: 2, sil: null }, // autoroute néon
  { from: 16, id: 3, sil: "city" }, // skyline
  { from: 23, id: 5, sil: null }, // noir / reveal
  { from: 36, id: 2, sil: null }, // M1
  { from: 40, id: 4, sil: null }, // M2
  { from: 44, id: 3, sil: "city" }, // M3
  { from: 48, id: 1, sil: "sunset", dusk: 1 }, // M4
  { from: 52, id: 1, sil: "sunset", fin: 1 }, // signature
];
const TRANS = [
  { at: 7.75, to: 8.1, seg: 1, type: 2 },
  { at: 11.7, to: 12.25, seg: 2, type: 1 },
  { at: 15.8, to: 16.2, seg: 3, type: 2 },
  { at: 35.6, to: 36.2, seg: 5, type: 1 },
  { at: 39.7, to: 40.2, seg: 6, type: 1 },
  { at: 43.7, to: 44.2, seg: 7, type: 1 },
  { at: 47.7, to: 48.2, seg: 8, type: 1 },
  { at: 51.6, to: 52.1, seg: 9, type: 2 },
];

function params(si, b, ctx) {
  const s = SEG[si];
  switch (si) {
    case 0: {
      const streak = 0.22 * bell(b, 0.6, 4.2) + Math.pow(prog(b, 6, 7.95), 2) * 1.3 + (ctx.gate ? 0.12 : 0);
      const appear = ctx.gate ? 0.34 : b < 0 ? lerp(0, 0.34, ctx.preroll) : E.out(prog(b, -0.2, 6));
      return [appear, 1 + 0.2 * E.io(prog(b, 0, 8)), streak, 0];
    }
    case 1:
      if (s.fin) return [lerp(0.07, 0.025, E.io(prog(b, 52, 64))), lerp(1.2, 1.0, E.out(prog(b, 52, 62))), 0.24, 0];
      if (s.dusk) return [0.012, lerp(1.12, 1.04, prog(b, 48, 52)), 0.62, lerp(0.03, -0.03, prog(b, 48, 52))];
      return [0.05, lerp(1.32, 1.0, E.out(prog(b, 8, 11.9))), 0, lerp(-0.06, 0.04, prog(b, 8, 12))];
    case 2:
      return [2.4, lerp(1.0, 1.12, prog(b, 12, 16)), 1, 1];
    case 3:
      return [lerp(-0.04, 0.03, E.io(prog(b, 16, 23))), lerp(1.14, 1.0, E.out(prog(b, 16, 20))), lerp(0, 0.16, prog(b, 16, 23)), 1];
    case 4: {
      if (b < 24) return [0, 0, 0.5 * Math.pow(prog(b, 23, 24), 2), 0];
      const shrink = E.io(prog(b, 24, 26.1));
      const rays = lerp(1.1, 0.55, E.out(prog(b, 24, 27))) * (1 + 0.25 * hit(b, Math.floor(b), 0.5) * (b > 28 ? 1 : 0));
      return [lerp(0.6, 0, shrink), rays, lerp(1, 0.38, E.out(prog(b, 24, 28))), 1];
    }
    case 5:
      return [1.0, lerp(1.0, 1.08, prog(b, 36, 40)), 0.85, 0.72];
    case 6:
      return [1.7, 0.3, 0.95, 0];
    case 7:
      return [0.02, 1.04, lerp(0.3, 0.5, prog(b, 44, 48)), 0.85];
    default:
      return [0, 1, 0, 0];
  }
}

export function createIntro(opts = {}) {
  const lang = pickLang(opts.lang || document.documentElement.lang);
  const L = STR[lang];
  const renderMode = !!opts.renderMode;
  const reduced = !renderMode && (opts.reducedMotion ?? matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ——— Montage du DOM (Shadow DOM isolé) ———
  const host = document.createElement("div");
  host.setAttribute("data-cliko-intro", "");
  host.style.cssText = "position:fixed;inset:0;z-index:2147483647;";
  const root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
  root.innerHTML = `<style>${CSS}</style>${buildMarkup(L)}`;
  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const ck = $(".ck");
  const glc = $("canvas.gl"), silc = $("canvas.sil");
  const stage = $(".stage");
  const sc = {
    s1: $(".s1"), s2a: $(".s2a"), s2b: $(".s2b"), s2c: $(".s2c"), s3: $(".s3"), s4: $(".s4"), s5: $(".s5"),
  };
  const el = {
    s1w: $(".s1w"), s1words: $$(".s1l .w"), s1l: $(".s1l"), flare: $(".flare"),
    gta: $(".s2a .gta"), vi: $(".s2a .vi"), s2row: $(".s2a .row"), s2aa: $(".s2a .a"),
    is: $(".s2b .is"), here: $(".s2b .here"), s2brow: $(".s2b .row"),
    s2c: $(".s2c .a"), k: $(".s2c .k"), l1: $(".s2c .l1"), l2: $(".s2c .l2"), l2w: $(".s2c .l2w"),
    loc: $(".loc"), lt: $(".loc .lt"),
    l3: $(".l3"), s3t: $(".s3t"), s3w: $$(".s3t .w"),
    ms: $$(".m"), vis: $$(".v"), pb: $$(".pb b"), pbw: $(".pb"),
    l5: $(".l5"), t5: $(".t5"), t5c: $$(".t5 .ch"), u5: $(".u5"), pk: $(".pk"),
    bars: $$(".bar"), grain: $(".grain"), fade: $(".fade"),
    cta: $(".cta"), gate: $(".gate"), play: $(".play"), enter: $(".enter"), snd: $(".snd"), sl: $(".snd .sl"), skip: $(".skip"), prog: $(".prog"), progb: $(".prog b"), sr: $(".sr"),
  };
  const logoParts = (wrap) => ({
    svg: $("svg", wrap), paths: $$(".st path", wrap), dot: $(".dt", wrap), o: $(".o", wrap), spk: $(".spk", wrap),
  });
  const L3 = logoParts(el.l3), L5 = logoParts(el.l5);
  const mis = el.ms.map((m) => ({ m, lab: $(".ml", m), lines: $$(".ln>span", m), md: $(".md", m), car: $(".car", m) }));
  const v1 = { fr: $(".fr", el.vis[0]), tb: $(".tb", el.vis[0]), d: $$(".d", el.vis[0]), url: $(".url", el.vis[0]), hero: $(".hero", el.vis[0]), h1: $(".h1", el.vis[0]), h2: $(".h2", el.vis[0]), bt: $(".bt", el.vis[0]), cd: $$(".cd", el.vis[0]), cur: $(".cur", el.vis[0]), rip: $(".rip", el.vis[0]), bw: $(".bw", el.vis[0]) };
  const v2 = { ph: $(".ph", el.vis[1]), scr: $(".scr", el.vis[1]), chips: $$(".chip", el.vis[1]), rings: $$(".ring", el.vis[1]) };
  const v3 = { cards: $$(".cd3", el.vis[2]) };
  const v4 = { cw: $(".cw", el.vis[3]), lines: $$(".cl>span>span", el.vis[3]), car: $(".ccar", el.vis[3]), scan: $(".scan", el.vis[3]), tag: $(".tag", el.vis[3]), code: $(".code", el.vis[3]) };
  const CL = codeLens(L);
  const CLsum = CL.reduce((a, b) => a + b, 0);

  // ——— Géométrie ———
  let W = 0, H = 0, u = 10, portrait = false, bh0 = 0, dpr = 1, glScale = 1;
  const meas = {};
  let gl = null, sil = null;
  function measure() {
    W = ck.clientWidth || innerWidth;
    H = ck.clientHeight || innerHeight;
    portrait = W / H < 0.82;
    u = portrait ? Math.min(W * 0.0128, H * 0.0105) : Math.min(W * 0.01, H * 0.0178);
    bh0 = !portrait && W / H > 1.25 ? Math.max(0, Math.round((H - W / 2.39) / 2)) : 0;
    ck.classList.toggle("pt", portrait);
    css(ck, "--u", u.toFixed(2) + "px");
    dpr = renderMode ? 1 : Math.min(devicePixelRatio || 1, 2);
    const budget = renderMode ? (opts.glPixels || 1e9) : W * H > 9e5 && !portrait ? 1.35e6 : 6.2e5;
    const sc0 = Math.min(dpr, Math.sqrt(budget / (W * H))) * glScale;
    glc.width = Math.max(2, Math.round(W * sc0));
    glc.height = Math.max(2, Math.round(H * sc0));
    silc.width = Math.round(W * dpr);
    silc.height = Math.round(H * dpr);
    meas.s2 = meas.s2b = meas.s3 = null;
    meas.len = [L3, L5].map((P) => P.paths.map((p) => p.getTotalLength?.() || 100));
    for (const P of [L3, L5]) P.paths.forEach((p) => css(p, "stroke-dasharray", "1 2"));
  }

  // Mesures faites à la première image où la scène est visible (display:none avant)
  function lazyMeasure(key) {
    if (meas[key]) return;
    if (key === "s2" && el.s2row.offsetWidth) {
      const r = el.s2row;
      meas.s2 = [r.offsetWidth / 2 - (el.gta.offsetLeft + el.gta.offsetWidth / 2), r.offsetHeight / 2 - (el.gta.offsetTop + el.gta.offsetHeight / 2)];
    } else if (key === "s2b" && el.s2brow.offsetWidth) {
      const r = el.s2brow;
      meas.s2b = [r.offsetWidth / 2 - (el.is.offsetLeft + el.is.offsetWidth / 2), r.offsetHeight / 2 - (el.is.offsetTop + el.is.offsetHeight / 2)];
    } else if (key === "s3" && el.s3t.offsetWidth) {
      const rw = el.s3t.offsetWidth;
      meas.s3 = [0, ...el.s3w.map((w) => (rw - (w.offsetLeft + w.offsetWidth)) / 2)];
    }
  }

  // ——— Logos ———
  const STROKES = [[25.0, 25.9], [25.6, 26.15], [26.0, 26.45], [26.6, 27.0], [27.0, 27.35], [27.2, 27.6]];
  function drawLogo(P, b, mode, idx) {
    // mode : 'reveal' (dessin trait par trait) ou 'full'
    let head = null;
    P.paths.forEach((p, i) => {
      let k = 1;
      if (mode === "reveal") k = E.io(prog(b, STROKES[i][0], STROKES[i][1]));
      css(p, "stroke-dashoffset", (1 - k).toFixed(4));
      op(p, k > 0.002 ? 1 : 0);
      if (mode === "reveal" && k > 0.01 && k < 0.99) head = [p, k, meas.len[idx][i]];
    });
    if (head) {
      const pt = head[0].getPointAtLength(head[1] * head[2]);
      P.spk.setAttribute("cx", pt.x.toFixed(1));
      P.spk.setAttribute("cy", pt.y.toFixed(1));
      P.spk.setAttribute("r", (11 + 4 * Math.sin(b * 40)).toFixed(1));
      op(P.spk, 1);
    } else op(P.spk, 0);
    const dk = mode === "reveal" ? E.back(prog(b, 26.5, 26.85)) : 1;
    css(P.dot, "transform", `scale(${Math.max(0, dk).toFixed(3)})`);
    css(P.dot, "transform-origin", "179px 16px");
    const ok = mode === "reveal" ? prog(b, 25.5, 26.15) : 1;
    op(P.o, ok);
    const os = mode === "reveal" ? lerp(1.3, 1, E.out(prog(b, 25.5, 26.7))) : 1;
    css(P.o, "transform", `scale(${os.toFixed(3)})`);
    css(P.o, "transform-origin", "400px 96px");
  }
  const logoGlow = (w, g, pinkness = 1) => {
    const a = (0.35 * g * u).toFixed(1), c = (1.5 * g * u).toFixed(1), d = (0.9 * g * u).toFixed(1);
    return `drop-shadow(0 0 ${a}px rgba(255,${Math.round(lerp(220, 111, pinkness))},${Math.round(lerp(235, 181, pinkness))},.95)) drop-shadow(0 0 ${c}px rgba(255,46,136,${(0.7 * pinkness + 0.25).toFixed(2)})) drop-shadow(0 0 ${d}px rgba(255,170,80,.35))`;
  };

  // ——— État des décors pour un temps donné ———
  function sceneState(t, b, ctx) {
    let si = 0;
    for (let i = 0; i < SEG.length; i++) if (b >= SEG[i].from) si = i;
    let tr = null;
    for (const x of TRANS) if (b >= x.at && b < x.to) tr = x;
    const st = { a: SEG[si].id, b: SEG[si].id, mix: 0, tr: 0, pa: params(si, b, ctx), pb: [0, 0, 0, 0], sa: si, sb: si };
    if (tr) {
      const A = tr.seg - 1, B = tr.seg;
      st.sa = A;
      st.sb = B;
      st.a = SEG[A].id;
      st.b = SEG[B].id;
      st.pa = params(A, b, ctx);
      st.pb = params(B, b, ctx);
      st.mix = prog(b, tr.at, tr.to);
      st.tr = tr.type;
    }
    return st;
  }

  // Caméra des silhouettes, calée sur celle du shader
  function silCam(segIdx, P, role, st) {
    const s = SEG[segIdx];
    if (!s.sil) return null;
    const asp = W / H;
    let zoom = 1, panX = 0, offY = 0, offX = 0, alpha = 1;
    if (s.id === 1) {
      zoom = P[1];
      panX = P[3];
    } else if (s.id === 3) {
      zoom = P[1];
      panX = -P[2] * zoom * 0.25;
      offY = -P[0] * zoom;
    }
    if (st.mix > 0 && st.mix < 1) {
      const m = st.mix;
      if (st.tr === 1) {
        const e = smooth(m);
        offX = role === "a" ? e * asp : e * asp - asp;
      } else if (st.tr === 2) {
        zoom *= role === "a" ? 1 / (1 - 0.65 * m) : 1 / (1 + 0.9 * (1 - m));
        const k = smooth(clamp((m - 0.35) / 0.3));
        alpha = role === "a" ? 1 - k : k;
      } else alpha = role === "a" ? 1 - m : m;
    }
    return { layout: s.sil, zoom, panX, offX, offY, alpha, fg: 1.35, birds: s.fin ? 1 : 0, small: s.fin ? 0.82 : s.dusk ? 0.9 : 1, color: s.dusk ? "#06020a" : "#0a0410" };
  }

  // ——— RENDU D'UNE IMAGE ———
  const R = { gate: false, preroll: 0, exitK: 0, exitFly: null };
  function render(t) {
    const b = t / BEAT;
    const ctx = { gate: R.gate, preroll: R.preroll };
    const st = sceneState(t, b, ctx);

    // Secousses & flashs
    const shk = 0.011 * hit(b, 8, 0.5) + 0.008 * hit(b, 9, 0.45) + 0.018 * hit(b, 24, 0.7) + 0.005 * (hit(b, 28, 0.4) + hit(b, 29, 0.4) + hit(b, 30, 0.4)) + 0.007 * hit(b, 52, 0.6) + 0.004 * hit(b, 64, 0.6);
    const sx = shk * Math.sin(t * 93), sy = shk * Math.cos(t * 71);
    const flash = 0.55 * hit(b, 8, 0.45) + 0.2 * hit(b, 9, 0.35) + 1.0 * hit(b, 24, 0.8) + 0.12 * (hit(b, 28, 0.3) + hit(b, 29, 0.3) + hit(b, 30, 0.3)) + 0.5 * hit(b, 52, 0.6) + 0.25 * hit(b, 64, 0.6);
    let leak = 0.3;
    if (b < 8) leak = 0.28 * prog(b, 1, 7);
    else if (b < 23) leak = 0.45;
    else if (b < 24) leak = 0;
    else if (b < 36) leak = 0.32 + 0.3 * hit(b, 24, 1.5);
    else if (b < 52) leak = 0.22;
    else leak = 0.55;
    const exposure = R.gate ? 0.85 : b < 0 ? lerp(0.85, 0.2, R.preroll) : 1;
    const night = R.exitK > 0 ? E.io(prog(R.exitK, 0, 0.6)) : 0;

    if (gl) {
      gl.draw({
        time: t + 40, a: st.a, b: st.b, mix: st.mix, tr: st.tr, pa: st.pa, pb: st.pb,
        fx: [flash, leak, 0.62, exposure], fx2: [night, 0.035, sx, sy], cen: oCenter(b),
      });
    }
    // silhouettes
    if (sil) {
      const cams = [silCam(st.sa, st.pa, "a", st), st.sb !== st.sa ? silCam(st.sb, st.pb, "b", st) : null];
      if (cams[0] || cams[1]) {
        for (const c of cams) if (c) c.alpha *= 1 - night;
        sil.draw(t, cams);
        R.silDirty = true;
      } else if (R.silDirty) {
        sil.clear();
        R.silDirty = false;
      }
    }
    css(stage, "transform", `translate3d(${(-sx * H).toFixed(1)}px,${(sy * H).toFixed(1)}px,0)`);

    // Barres cinéma
    const bh = Math.round(bh0 * (1 - E.io(prog(b, 52, 54.5))));
    css(ck, "--bh", bh + "px");
    css(ck, "--ub", Math.max(14, Math.round(bh / 2 - 22)) + "px");
    css(el.grain, "transform", `translate3d(${Math.round(hash(Math.floor(t * 24)) * 60 - 30)}px,${Math.round(hash(Math.floor(t * 24) + 7) * 60 - 30)}px,0)`);

    if (R.gate) {
      for (const k in sc) show(sc[k], false);
      show(el.loc, false);
      return;
    }
    renderS1(b);
    renderS2(b);
    renderS3(b);
    renderS4(b);
    renderS5(b);

    // UI
    if (!renderMode) {
      css(el.progb, "transform", `scaleX(${clamp(t / (64 * BEAT)).toFixed(4)})`);
    }
  }

  function oCenter(b) {
    // centre du « o » du logo (le soleil s'y contracte), en unités shader
    const lwW = (portrait ? 66 : 54) * u, lwH = (lwW * 148) / 480;
    const ly = logoY3(b);
    const x = (400 / 480 - 0.5) * lwW, y = (96 / 148 - 0.5) * lwH + ly;
    const k = E.io(prog(b, 24.4, 26));
    return [lerp(0, x / H, k), lerp(0.03, -y / H, k)];
  }
  const logoY3 = (b) => lerp(0, -(portrait ? 8 : 5.6) * u, E.io(prog(b, 27.6, 28.4)));

  // ——— SCÈNE 1 — THE WAIT IS OVER. ———
  function renderS1(b) {
    const on = b < 8.1;
    show(sc.s1, on);
    if (!on) return;
    const at = [2, 2.75, 3.75, 4.5];
    el.s1words.forEach((w, i) => {
      const k = E.out(prog(b, at[i] - 0.15, at[i] + 0.95));
      op(w, k);
      tf(w, 0, (1 - k) * u * 1.4, 1 + (1 - k) * 0.08);
      fl(w, (1 - k) * 16);
    });
    const push = 1 + 0.07 * prog(b, 2, 7.2) + 0.9 * E.inExpo(prog(b, 7.1, 8.05));
    tfc(el.s1w, 0, 0, push);
    css(el.s1l, "letter-spacing", lerp(0.3, 0.05, E.out(prog(b, 1.6, 7))).toFixed(3) + "em");
    op(el.s1w, 1 - prog(b, 7.7, 8.05));
    chroma(el.s1w, (prog(b, 5.8, 8) * 1.2 + hit(b, 4.5, 0.4) * 0.5) * u * 0.6);
    const fk = E.out(prog(b, 0.7, 2.8));
    css(el.flare, "transform", `scaleX(${(fk * (1 + 0.25 * hit(b, 4.5, 0.6))).toFixed(3)})`);
    op(el.flare, fk * (1 - prog(b, 6.8, 7.8)) * (0.75 + 0.25 * Math.sin(b * 3)));
  }

  // ——— SCÈNE 2 — GTA VI IS HERE. ———
  const slam = (w, b, at, from = 2.6, blurMax = 20) => {
    const k = E.expo(prog(b, at, at + 0.42));
    op(w, b < at ? 0 : clamp(k * 3));
    fl(w, b < at ? 0 : (1 - k) * blurMax);
    return { k, s: lerp(from, 1, k) };
  };
  function renderS2(b) {
    // A — GTA / VI
    const onA = b >= 7.9 && b < 12.3;
    show(sc.s2a, onA);
    if (onA) {
      lazyMeasure("s2");
      const g = slam(el.gta, b, 8), v = slam(el.vi, b, 9);
      const join = E.expo(prog(b, 9, 9.4));
      const m2 = meas.s2 || [0, 0];
      tf(el.gta, m2[0] * (1 - join), m2[1] * (1 - join), g.s);
      tf(el.vi, 0, 0, v.s);
      const drift = 1 + 0.05 * prog(b, 8, 11.7);
      const out = E.inExpo(prog(b, 11.55, 12.2));
      tfc(el.s2aa, -smooth(prog(b, 11.7, 12.25)) * W * 0.35, 0, drift * (1 + 2.6 * out));
      op(el.s2aa, 1 - prog(b, 11.85, 12.2));
      chroma(el.s2row, (hit(b, 8, 0.7) + hit(b, 9, 0.7) + 1.4 * out) * u * 0.7, "drop-shadow(0 0 " + (1.4 * u).toFixed(1) + "px rgba(255,61,139,.5))");
      const sh = prog(b, 10, 11.4);
      for (const w of [el.gta, el.vi]) css(w.lastChild, "background-position", lerp(130, -30, sh).toFixed(1) + "% 0");
    }
    // B — IS HERE. (néon)
    const onB = b >= 12.15 && b < 16.25;
    show(sc.s2b, onB);
    if (onB) {
      const a1 = neonOn(b, 12.5), a2 = neonOn(b, 13);
      op(el.is.lastChild, a1);
      op(el.here.lastChild, a2);
      lazyMeasure("s2b");
      const join = E.expo(prog(b, 13, 13.35));
      const m2 = meas.s2b || [0, 0];
      tf(el.is, m2[0] * (1 - join), m2[1] * (1 - join), 1);
      op(el.here.firstChild, prog(b, 12.6, 13));
      op(el.is.firstChild, prog(b, 12.2, 12.5));
      const out = E.inExpo(prog(b, 15.6, 16.2));
      tfc(el.s2brow.parentNode, 0, 0, (1 + 0.05 * prog(b, 12.3, 15.8)) * (1 + 3 * out));
      op(el.s2brow.parentNode, 1 - prog(b, 15.95, 16.2));
    }
    // C — l'affiche complète sur la skyline
    const onC = b >= 16 && b < 23;
    show(sc.s2c, onC);
    if (onC) {
      const kk = E.out(prog(b, 16.3, 17.2));
      op(el.k, kk);
      css(el.k, "letter-spacing", lerp(0.8, 0.42, kk).toFixed(3) + "em");
      const k1 = E.reveal(prog(b, 16.05, 16.9));
      tf(el.l1, 0, (1 - k1) * u * 6, lerp(0.86, 1, k1));
      op(el.l1, k1);
      fl(el.l1, (1 - k1) * 14);
      op(el.l2w.lastChild, neonOn(b, 16.6));
      op(el.l2w.firstChild, prog(b, 16.3, 16.6));
      const sh = (prog(b, 18, 19.4) + prog(b, 20, 21.4)) % 1.0001;
      css(el.l1.querySelector(".shine"), "background-position", lerp(130, -30, sh).toFixed(1) + "% 0");
      const stut = hit(b, 22, 0.25) + hit(b, 22.25, 0.25) + hit(b, 22.5, 0.25) + hit(b, 22.75, 0.25);
      tfc(el.s2c, 0, 0, (1 + 0.06 * prog(b, 16, 22)) * (1 + 0.045 * stut));
      chroma(el.l1, stut * u * 0.8, "drop-shadow(0 0 " + (1.4 * u).toFixed(1) + "px rgba(255,61,139,.5))");
    }
    // Carton de lieu
    const onL = b >= 8.4 && b < 23;
    show(el.loc, onL);
    if (onL) {
      const txt = b < 15.8 ? L.loc1 : L.loc2;
      const st = b < 15.8 ? 8.6 : 16.6;
      const n = Math.floor(clamp((b - st) / 1.1) * txt.length);
      if (el.lt.__t !== n + txt) {
        el.lt.__t = n + txt;
        el.lt.textContent = txt.slice(0, n);
      }
      op(el.loc, (1 - prog(b, 15.2, 15.8)) * prog(b, 8.4, 8.8) + prog(b, 16.3, 16.6) * (1 - prog(b, 22.6, 23)));
      op(el.loc.firstChild, Math.floor(b * 2) % 2 ? 1 : 0.25);
    }
  }

  // ——— SCÈNE 3 — reveal : WE ARE TOO. ———
  function renderS3(b) {
    const on = b >= 24 && b < 36.3;
    show(sc.s3, on);
    if (!on) return;
    drawLogo(L3, b, "reveal", 0);
    const ly = logoY3(b);
    const push = 1 + 0.05 * prog(b, 28, 35.6);
    const wh = smooth(prog(b, 35.6, 36.2));
    const wx = -wh * W;
    tfc(el.l3, wx, ly, push);
    const g = 1 + 0.9 * hit(b, 27.65, 1.2) + 0.25 * (b > 28 ? hit(b, Math.floor(b), 0.5) : 0) + 0.6 * prog(b, 24.8, 25.6) * (1 - prog(b, 27.6, 28.5));
    const pink = 1 - 0.55 * prog(b, 27.6, 28.6);
    css(el.l3, "filter", logoGlow(el.l3, g, pink) + (wh > 0.02 ? ` blur(${(Math.sin(wh * Math.PI) * 14).toFixed(1)}px)` : ""));
    // WE · ARE · TOO.
    const ty = (portrait ? 13 : 9.6) * u;
    let cx = 0;
    lazyMeasure("s3");
    if (meas.s3) {
      cx = meas.s3[1];
      [29, 30].forEach((at, i) => (cx = lerp(cx, meas.s3[i + 2], E.expo(prog(b, at, at + 0.4)))));
    }
    tfc(el.s3t, wx + cx, ty, push);
    [28, 29, 30].forEach((at, i) => {
      const s = slam(el.s3w[i], b, at, 1.7, 12);
      tf(el.s3w[i], 0, 0, s.s);
    });
    chroma(el.s3t, (hit(b, 28, 0.5) + hit(b, 29, 0.5) + hit(b, 30, 0.5)) * u * 0.6 + Math.sin(wh * Math.PI) * u, "drop-shadow(0 0 " + (1.4 * u).toFixed(1) + "px rgba(255,61,139,.5))");
  }

  // ——— SCÈNE 4 — ce que nous créons ———
  function renderS4(b) {
    const on = b >= 35.6 && b < 52.15;
    show(sc.s4, on);
    if (!on) return;
    const zoomOut = prog(b, 51.6, 52.1);
    for (let i = 0; i < 4; i++) {
      const s0 = 36 + 4 * i;
      const M = mis[i], V = el.vis[i];
      const active = b >= s0 - 0.45 && b < s0 + 4.25;
      show(M.m, active, "block");
      show(V, active, "block");
      if (!active) continue;
      const ein = 1 - smooth(prog(b, s0 - 0.4, s0 + 0.2));
      const eout = i < 3 ? smooth(prog(b, s0 + 3.7, s0 + 4.2)) : 0;
      const x = (ein - eout) * W;
      const zs = 1 + 1.6 * E.inExpo(zoomOut);
      const zo = 1 - prog(b, 51.75, 52.1);
      css(M.m, "transform", (portrait ? "" : "translateY(-50%) ") + T3(x, 0, zs));
      op(M.m, zo);
      op(V, zo);
      const vb = Math.sin(Math.PI * Math.max(ein, eout)) * 10;
      fl(M.m, vb);
      // étiquette
      const kl = E.out(prog(b, s0 + 0.05, s0 + 0.6));
      op(M.lab, kl);
      tf(M.lab, (1 - kl) * -u * 3, 0);
      // titre : une entrée différente par mission
      M.lines.forEach((ln, j) => {
        if (i === 0) {
          const k = E.reveal(prog(b, s0 + 0.15 + j * 0.22, s0 + 1.0 + j * 0.22));
          tf(ln, 0, (1 - k) * ln.offsetHeight * 1.1);
          op(ln, 1);
        } else if (i === 1) {
          const k = prog(b, s0 + j * 0.2, s0 + 1.1 + j * 0.2);
          const q = Math.floor(b * 8 + j * 3);
          const jit = (1 - k) * (k > 0 ? 1 : 0);
          const jx = (hash(q) - 0.5) * u * 3 * jit, sk = (hash(q + 9) - 0.5) * 24 * jit;
          op(ln, k <= 0 ? 0 : hash(q + 4) < 0.25 * jit ? 0.2 : 1);
          tf(ln, jx, 0, 1, ` skewX(${sk.toFixed(1)}deg)`);
          chroma(ln, jit * u * 1.4 + hit(b, s0 + 1 + j, 0.3) * u * 0.6, j === 1 ? `drop-shadow(0 0 ${(0.9 * u).toFixed(1)}px rgba(255,61,139,.35))` : "");
        } else if (i === 2) {
          const k = E.out(prog(b, s0 + 0.2 + j * 0.25, s0 + 1.1 + j * 0.25));
          op(ln, k > 0 ? 1 : 0);
          css(ln, "transform", `rotateX(${((1 - k) * -100).toFixed(1)}deg) translateZ(0)`);
        } else {
          const len = ln.textContent.length;
          const kRaw = prog(b, s0 + 0.15 + j * 0.65, s0 + 0.75 + j * 0.65);
          const k = Math.floor(kRaw * len) / len;
          css(ln, "clip-path", `inset(-10% ${((1 - k) * 100).toFixed(1)}% -20% 0)`);
          op(ln, 1);
          if ((j === 0 && kRaw < 1) || (j === 1 && kRaw > 0) || (j === 1 && kRaw >= 1)) {
            if (M.car) {
              const lx = ln.offsetLeft + ln.offsetWidth * k;
              const lyy = ln.parentNode.offsetTop;
              css(M.car, "left", lx.toFixed(1) + "px");
              css(M.car, "top", lyy.toFixed(1) + "px");
              css(M.car, "height", ln.offsetHeight + "px");
              op(M.car, j === 1 && kRaw >= 1 ? (Math.floor(b * 2) % 2 ? 1 : 0) : 1);
            }
          }
        }
      });
      const kd = E.out(prog(b, s0 + 1.1, s0 + 1.9));
      op(M.md, kd);
      tf(M.md, 0, (1 - kd) * u * 1.5);
      renderVis(i, b, s0, x * (portrait ? 1 : 1.15), zs, vb);
    }
    // barre de progression des missions
    op(el.pbw, prog(b, 36, 36.6) * (1 - prog(b, 51.4, 51.9)));
    el.pb.forEach((p, j) => css(p, "transform", `scaleX(${clamp(prog(b, 36 + 4 * j, 40 + 4 * j)).toFixed(3)})`));
  }

  function renderVis(i, b, s0, vx = 0, vz = 1, vblur = 0) {
    const V = el.vis[i];
    const base = `translate(-50%,-50%) translate3d(${vx.toFixed(1)}px,0,0) scale(${vz.toFixed(4)}) `;
    if (i !== 1) fl(V, vblur);
    if (i === 0) {
      const rot = lerp(-24, -10, E.out(prog(b, s0, s0 + 4)));
      css(v1.bw, "transform", `rotateY(${rot.toFixed(2)}deg) rotateX(${lerp(14, 7, prog(b, s0, s0 + 4)).toFixed(2)}deg)`);
      css(V, "transform", base + T3(0, 0, lerp(0.92, 1, E.out(prog(b, s0, s0 + 1.5)))));
      css(v1.fr, "stroke-dashoffset", (1 - E.io(prog(b, s0, s0 + 0.8))).toFixed(4));
      css(v1.tb, "stroke-dashoffset", (1 - E.io(prog(b, s0 + 0.5, s0 + 0.8))).toFixed(4));
      op($(".bg", V), prog(b, s0 + 0.3, s0 + 0.9));
      v1.d.forEach((d, j) => {
        const k = E.back(prog(b, s0 + 0.8 + j * 0.1, s0 + 1.05 + j * 0.1));
        tf(d, 0, 0, Math.max(0, k));
      });
      const ku = E.out(prog(b, s0 + 0.9, s0 + 1.3));
      css(v1.url, "transform", `scaleX(${ku.toFixed(3)})`);
      const kh = E.out(prog(b, s0 + 1.25, s0 + 1.6));
      css(v1.hero, "transform", `scaleY(${kh.toFixed(3)})`);
      op(v1.hero, kh > 0 ? 1 : 0);
      css(v1.h1, "transform", `scaleX(${E.out(prog(b, s0 + 1.5, s0 + 1.85)).toFixed(3)})`);
      css(v1.h2, "transform", `scaleX(${E.out(prog(b, s0 + 1.6, s0 + 1.95)).toFixed(3)})`);
      const kb = E.back(prog(b, s0 + 2, s0 + 2.3));
      tf(v1.bt, 0, 0, Math.max(0, kb));
      const click = hit(b, s0 + 3.5, 0.5);
      css(v1.bt, "background", click > 0.05 ? "#ffc46b" : "#0b1020");
      v1.cd.forEach((c, j) => {
        const k = E.back(prog(b, s0 + 2.5 + j * 0.25, s0 + 2.85 + j * 0.25));
        op(c, clamp(k * 2));
        tf(c, 0, (1 - clamp(k)) * u * 3, lerp(0.85, 1, clamp(k)));
      });
      const kc = E.io(prog(b, s0 + 2.3, s0 + 3.4));
      const bw = v1.bw.offsetWidth, bhh = v1.bw.offsetHeight;
      const cx = lerp(bw * 0.92, bw * 0.2, kc), cy = lerp(bhh * 1.05, bhh * 0.47, kc);
      op(v1.cur, prog(b, s0 + 2.2, s0 + 2.5));
      tf(v1.cur, cx, cy, 1 - 0.15 * hit(b, s0 + 3.5, 0.3));
      const kr = prog(b, s0 + 3.5, s0 + 4.1);
      op(v1.rip, kr > 0 ? 1 - kr : 0);
      tf(v1.rip, 0, 0, 0.2 + kr * 2.6);
    } else if (i === 1) {
      const k = E.out(prog(b, s0, s0 + 1.2));
      const q = Math.floor(b * 8);
      const g = (1 - prog(b, s0, s0 + 0.8)) * (b >= s0 ? 1 : 0);
      css(V, "transform", base + T3((hash(q) - 0.5) * u * 2.5 * g, 0, lerp(0.9, 1, k)));
      css(v2.ph, "transform", `rotateY(${lerp(38, -10, k).toFixed(1)}deg) rotateZ(${lerp(-8, 4, k).toFixed(1)}deg)`);
      chroma(v2.ph, g * u * 1.6);
      css(v2.scr, "background-position", `0 ${(50 + 50 * Math.sin(b * 0.9)).toFixed(1)}%`);
      v2.chips.forEach((c, j) => {
        const kc = E.back(prog(b, s0 + 1 + j, s0 + 1.35 + j));
        op(c, clamp(kc * 3));
        tf(c, 0, (1 - clamp(kc)) * u * 2, lerp(0.6, 1, kc));
      });
      v2.rings.forEach((r, j) => {
        const kr = prog(b, s0 + 1 + j, s0 + 1.9 + j);
        const ph = v2.ph;
        const ox = ph.offsetLeft + ph.offsetWidth * 0.5, oy = ph.offsetTop + ph.offsetHeight * (0.53 + j * 0.12);
        css(r, "left", ox.toFixed(0) + "px");
        css(r, "top", oy.toFixed(0) + "px");
        op(r, kr > 0 && kr < 1 ? 1 - kr : 0);
        tf(r, 0, 0, 0.2 + kr * 2.4);
      });
    } else if (i === 2) {
      css(V, "transform", base + T3(0, Math.sin(b * 0.8) * u * 0.4, 1));
      const spread = portrait ? 22 : 16.5;
      v3.cards.forEach((c, j) => {
        const k = E.back(prog(b, s0 + 0.5 + j * 0.5, s0 + 1.1 + j * 0.5));
        const kk = clamp(k);
        const fx = (j - 1) * spread * u * kk;
        const ry = lerp(110, (j - 1) * -16, k);
        const fy = Math.sin(b * 1.1 + j * 1.7) * u * 0.5 * kk;
        css(c, "transform", `translate3d(${fx.toFixed(1)}px,${(fy + (j === 1 ? -u * 1.2 : 0)).toFixed(1)}px,${(j === 1 ? u * 4 : 0).toFixed(1)}px) rotateY(${ry.toFixed(1)}deg)`);
        op(c, clamp(k * 2));
      });
    } else {
      const k = E.out(prog(b, s0, s0 + 0.6));
      css(V, "transform", base + T3(0, (1 - k) * u * 3, lerp(0.94, 1, k)));
      css(v4.cw, "transform", `rotateX(${lerp(22, 6, k).toFixed(1)}deg) rotateY(${lerp(-14, -6, prog(b, s0, s0 + 4)).toFixed(1)}deg)`);
      op(V, k);
      const n = Math.floor(prog(b, s0 + 0.3, s0 + 2.95) * CLsum);
      let acc = 0, curLine = 0;
      v4.lines.forEach((ln, j) => {
        const vis = clamp(n - acc, 0, CL[j]);
        css(ln, "width", vis + "ch");
        if (n >= acc) curLine = j;
        acc += CL[j];
      });
      const lnEl = v4.lines[curLine];
      if (lnEl) {
        css(v4.car, "left", (lnEl.offsetLeft + lnEl.offsetWidth).toFixed(0) + "px");
        css(v4.car, "top", (lnEl.parentNode.offsetTop + lnEl.offsetTop + 2).toFixed(0) + "px");
        op(v4.car, n >= CLsum ? (Math.floor(b * 2) % 2 ? 1 : 0) : 1);
      }
      op(v4.tag, neonOn(b, s0 + 0.6));
      tf(v4.tag, 0, 0, 1 + 0.08 * hit(b, Math.floor(b), 0.4));
      const ks = prog(b, s0 + 3, s0 + 3.7);
      op(v4.scan, ks > 0 && ks < 1 ? 1 : 0);
      tf(v4.scan, 0, ks * v4.code.offsetHeight);
    }
  }

  // ——— SCÈNE 5 — la signature ———
  function renderS5(b) {
    const on = b >= 51.8;
    show(sc.s5, on);
    if (!on) return;
    const m = prog(b, 51.6, 52.1);
    const enter = 1 / (1 + 0.9 * (1 - smooth(m)));
    const vis = smooth(clamp((m - 0.35) / 0.3));
    const push = 1 + 0.035 * prog(b, 56, 70);
    const P = portrait ? { lg: -25, t5: 1, u5: 17, cta: R.poster ? 39 : 34, pk: -42 } : { lg: -13, t5: 3.6, u5: 10.4, cta: 16.8, pk: -23.5 };
    // logo
    drawLogo(L5, b, "full", 1);
    const kl = E.out(prog(b, 52, 54.5));
    const g = 0.75 + 0.5 * hit(b, 52, 1.5) + 0.15 * (b > 52 && b < 64 ? hit(b, Math.floor(b), 0.5) : 0) - 0.35 * R.exitK;
    tfc(el.l5, 0, P.lg * u * push, enter * lerp(0.9, 1, kl) * push);
    op(el.l5, vis);
    css(el.l5, "filter", logoGlow(el.l5, Math.max(0, g), 0.55) + (kl < 0.95 ? ` blur(${((1 - E.out(prog(b, 52, 53))) * 10).toFixed(1)}px)` : ""));
    // slogan lettre à lettre
    tfc(el.t5, 0, P.t5 * u * push, enter * push);
    op(el.t5, vis);
    el.t5c.forEach((c, j) => {
      const k = E.out(prog(b, 54 + j * 0.07, 54.9 + j * 0.07));
      op(c, k);
      css(c, "transform", `translate3d(0,${((1 - k) * 0.5).toFixed(3)}em,0) rotateX(${((1 - k) * -70).toFixed(1)}deg)`);
    });
    // url
    const ku = E.out(prog(b, 56, 57.2));
    tfc(el.u5, 0, P.u5 * u * push, enter * push);
    op(el.u5, ku * vis);
    css(el.u5, "letter-spacing", lerp(0.7, 0.24, ku).toFixed(3) + "em");
    // kicker (version sans animation uniquement)
    if (R.poster) {
      css(el.pk, "display", "block");
      tfc(el.pk, 0, P.pk * u, 1);
    }
    // boutons
    if (!renderMode) {
      const kc = R.poster ? 1 : E.out(prog(b, 58, 59.2));
      show(el.cta, kc > 0.001, "flex");
      el.cta.hidden = false;
      css(el.cta, "transform", "translate(-50%,-50%) " + T3(0, P.cta * u + (1 - kc) * u * 2, 1));
      op(el.cta, kc * (1 - R.exitK * 3));
      css(el.cta, "pointer-events", kc > 0.5 ? "auto" : "none");
    }
  }

  // ——— Boucle, horloge, son ———
  let player = null;
  let raf = 0, clock = 0, lastNow = 0, running = false, paused = false;
  let sound = opts.sound !== false;
  let exiting = false;
  const perf = { acc: 0, n: 0, slow: 0 };

  function now() {
    return performance.now() / 1000;
  }
  function currentTime() {
    if (player && !player.muted) {
      const at = player.time();
      if (Math.abs(at - clock) > 0.08) clock = at;
      else clock += (at - clock) * 0.2;
    }
    return clock;
  }
  function frame() {
    raf = requestAnimationFrame(frame);
    const n = now();
    let dt = n - lastNow;
    lastNow = n;
    if (dt > 0.1) dt = 0.1;
    if (paused) return;
    if (R.gate) {
      clock += dt * 0.35;
      render(clock);
      return;
    }
    if (R.prerollStart != null) {
      R.preroll = clamp((n - R.prerollStart) / 0.6);
      if (R.preroll >= 1) {
        R.prerollStart = null;
        clock = 0;
      } else {
        render(-0.6 + R.preroll * 0.6);
        return;
      }
    }
    clock += dt;
    const t = currentTime();
    // adaptation de la résolution du shader si l'appareil peine
    perf.acc += dt;
    perf.n++;
    if (perf.n >= 45) {
      const avg = perf.acc / perf.n;
      if (avg > 0.026 && glScale > 0.45) {
        glScale *= 0.8;
        measure();
      }
      perf.acc = 0;
      perf.n = 0;
    }
    if (R.exitStart != null) {
      R.exitK = clamp((n - R.exitStart) / R.exitDur);
      renderExit(t);
      if (R.exitK >= 1) finish();
      return;
    }
    render(t);
    if (t > AUTO_EXIT && !opts.loop) exit("auto");
  }

  function renderExit(t) {
    render(t);
    const k = R.exitK;
    // le logo final rejoint celui de l'en-tête du site
    if (R.exitFly) {
      const f = R.exitFly, e = E.io(prog(k, 0.08, 0.82));
      const x = lerp(0, f.dx, e), y = lerp(0, f.dy, e), s = lerp(1, f.s, e);
      css(el.l5, "transform", `translate(-50%,-50%) translate3d(${(f.x0 + x).toFixed(1)}px,${(f.y0 + y).toFixed(1)}px,0) scale(${(f.s0 * s).toFixed(4)})`);
      css(el.l5, "filter", logoGlow(el.l5, lerp(0.7, 0, e), 0.55));
      op(el.l5, 1 - prog(k, 0.88, 1));
      for (const x2 of [el.t5, el.u5, el.cta, el.pk]) op(x2, 1 - prog(k, 0, 0.3));
    } else {
      op(stage, 1 - prog(k, 0, 0.45));
    }
    op(el.grain, 1 - k);
    for (const bar of el.bars) op(bar, 1 - prog(k, 0, 0.5));
    css(host, "opacity", (1 - prog(k, R.exitFly ? 0.72 : 0.55, 1)).toFixed(3));
  }

  // ——— Intégration au site : défilement, inertie, focus ———
  const saved = { inert: [], overflow: "", focus: null };
  const stopEv = (e) => {
    e.stopPropagation();
    if (e.cancelable && e.type !== "keydown") e.preventDefault();
  };
  const onKey = (e) => {
    if (!host.isConnected) return;
    const k = e.key;
    if (k === "Escape") {
      e.preventDefault();
      exit("skip");
    } else if ((k === "Enter" || k === " ") && R.gate && !root.activeElement) {
      e.preventDefault();
      start(true);
    } else if (k === "m" || k === "M") toggleSound();
    else if ([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(k) && !(root.activeElement && root.activeElement.tagName === "BUTTON" && (k === " " || k === "Enter"))) e.preventDefault();
  };
  function lockSite() {
    saved.focus = document.activeElement;
    saved.overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    for (const c of document.body.children) {
      if (c === host || c.tagName === "SCRIPT" || c.tagName === "STYLE") continue;
      saved.inert.push([c, c.inert]);
      c.inert = true;
    }
    for (const t of ["wheel", "touchmove", "touchstart", "pointerdown", "mousedown"]) host.addEventListener(t, stopEv, { passive: false });
    addEventListener("keydown", onKey, true);
  }
  function unlockSite() {
    document.documentElement.style.overflow = saved.overflow;
    for (const [c, v] of saved.inert) c.inert = v;
    saved.inert = [];
    removeEventListener("keydown", onKey, true);
    try {
      saved.focus?.focus?.({ preventScroll: true });
    } catch {
      /* rien */
    }
  }
  const onResize = () => {
    measure();
    if (R.poster) render(R.posterT);
  };
  const onVis = () => {
    if (!player) return;
    if (document.hidden) {
      paused = true;
      player.ctx.suspend?.();
    } else {
      player.ctx.resume?.();
      paused = false;
      lastNow = now();
    }
  };

  function setSoundUI() {
    el.snd.setAttribute("aria-pressed", String(sound));
    el.sl.textContent = sound ? L.soundOn : L.soundOff;
  }
  function toggleSound() {
    if (R.gate || exiting) return;
    sound = !sound;
    if (sound && !player) {
      try {
        player = new LivePlayer();
        player.start(Math.max(0, clock));
      } catch {
        player = null;
      }
    } else if (player) player.setMuted(!sound);
    setSoundUI();
  }

  function start(withSound) {
    if (!R.gate) return;
    R.gate = false;
    sound = withSound;
    el.gate.classList.add("off");
    setTimeout(() => (el.gate.hidden = true), 600);
    for (const x of [el.snd, el.skip, el.prog]) x.hidden = false;
    setSoundUI();
    el.skip.focus({ preventScroll: true });
    el.sr.textContent = L.label;
    if (withSound) {
      try {
        player = new LivePlayer();
        player.ctx.resume?.();
        player.start(0, 0.6);
      } catch (e) {
        console.warn("[cliko-intro] audio indisponible", e);
        player = null;
      }
    }
    const at = Math.max(0, +opts.startAt || 0); // démarrage en cours de film (contrôle qualité : ?intro&t=…)
    if (at > 0) {
      clock = at;
      R.prerollStart = null;
      if (player) {
        player.close();
        player = new LivePlayer();
        player.start(at);
      }
      return;
    }
    R.prerollStart = now();
    R.preroll = 0;
  }

  function exit(reason = "skip", then) {
    if (exiting) return;
    exiting = true;
    markSeen();
    player?.fadeOut(0.9);
    // le logo final vole jusqu'au logo de l'en-tête quand la signature est à l'écran
    const t = clock, b = t / BEAT;
    const target = [...document.querySelectorAll('svg[aria-label="Cliko"], [data-cliko-logo]')].find((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 10 && r.top >= -2 && r.top < innerHeight / 2;
    });
    R.exitFly = null;
    if (target && b >= 54 && !R.gate) {
      const r = target.getBoundingClientRect();
      const lr = el.l5.getBoundingClientRect();
      const m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px,0\) scale\(([-\d.]+)\)/.exec(el.l5.style.transform) || [0, 0, 0, 1];
      const x0 = +m[1], y0 = +m[2], s0 = +m[3];
      R.exitFly = { x0, y0, s0, dx: r.left + r.width / 2 - (lr.left + lr.width / 2), dy: r.top + r.height / 2 - (lr.top + lr.height / 2), s: r.width / lr.width };
    }
    R.exitDur = R.exitFly ? 1.25 : reason === "enter" ? 0.55 : 0.8;
    R.exitStart = now();
    R.then = then;
    if (R.gate) {
      el.gate.classList.add("off");
    }
    el.cta.style.pointerEvents = "none";
    if (R.poster || !running) {
      // pas de boucle en cours (version statique) : on lance une petite boucle de sortie
      running = true;
      lastNow = now();
      raf = requestAnimationFrame(frame);
    }
  }
  function finish() {
    cancelAnimationFrame(raf);
    running = false;
    removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVis);
    host.remove();
    unlockSite();
    document.documentElement.classList.remove("ck-intro-pending");
    dispatchEvent(new CustomEvent("cliko-intro:exit"));
    opts.onExit?.();
    R.then?.();
  }
  function markSeen() {
    try {
      const store = opts.frequency === "once" ? localStorage : sessionStorage;
      store.setItem(KEY, String(Date.now()));
    } catch {
      /* stockage bloqué : l'intro se rejouera, sans gravité */
    }
  }

  const goContact = () =>
    exit("quote", () => {
      const href = opts.contactHref || "#contact";
      const t = href.startsWith("#") ? document.querySelector(href) : null;
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
      else location.href = href;
    });

  // ——— Montage ———
  function mount() {
    document.body.appendChild(host);
    document.documentElement.classList.remove("ck-intro-pending");
    try {
      gl = createGL(glc, renderMode);
    } catch {
      gl = null;
    }
    if (!gl) ck.classList.add("nogl");
    sil = createSilhouettes(silc);
    measure();
    addEventListener("resize", onResize);
    if (renderMode) {
      for (const x of [el.gate, el.snd, el.skip, el.prog, el.cta]) x.hidden = true;
      return api;
    }
    lockSite();
    document.addEventListener("visibilitychange", onVis);
    el.play.addEventListener("click", () => start(true));
    el.enter.addEventListener("click", () => exit("enter"));
    el.skip.addEventListener("click", () => exit("skip"));
    el.snd.addEventListener("click", toggleSound);
    $(".go-site").addEventListener("click", () => exit("site"));
    $(".go-quote").addEventListener("click", goContact);

    if (reduced) {
      // Version sans animation : l'affiche finale, fixe, avec les deux slogans et les boutons.
      R.poster = true;
      R.posterT = 66 * BEAT;
      el.gate.hidden = true;
      el.cta.hidden = false;
      const replay = document.createElement("button");
      replay.className = "btn sec";
      replay.textContent = L.replay;
      replay.addEventListener("click", () => {
        R.poster = false;
        css(el.pk, "display", "none");
        replay.remove();
        R.gate = true;
        el.cta.hidden = true;
        start(true);
        running = true;
        lastNow = now();
        raf = requestAnimationFrame(frame);
      });
      el.cta.appendChild(replay);
      render(R.posterT);
      $(".go-site").focus({ preventScroll: true });
      return api;
    }
    if (opts.autoplay === "muted") {
      R.gate = true;
      start(false);
    } else {
      R.gate = true;
      el.gate.hidden = false;
      el.play.focus({ preventScroll: true });
    }
    running = true;
    lastNow = now();
    raf = requestAnimationFrame(frame);
    return api;
  }

  const api = {
    mount,
    exit,
    // rendu déterministe (vidéo / tests) : dessine exactement l'image du temps t
    seek(t) {
      R.gate = false;
      render(t);
    },
    gate() {
      R.gate = true;
      render(0);
    },
    host,
    get time() {
      return clock;
    },
  };
  return api;
}

// ——— API publique ———
export function shouldShow(opts = {}) {
  const q = location.search;
  if (/[?&]nointro\b/.test(q)) return false;
  if (/[?&]intro\b/.test(q) || opts.frequency === "always" || opts.force) return true;
  if (navigator.connection?.saveData) return false;
  if (/bot|crawl|spider|slurp/i.test(navigator.userAgent) && !opts.allowBots) return false;
  try {
    const store = opts.frequency === "once" ? localStorage : sessionStorage;
    return !store.getItem(KEY);
  } catch {
    return true;
  }
}

let current = null;
export function mountClikoIntro(opts = {}) {
  if (current?.host?.isConnected) return current;
  if (!opts.renderMode && !shouldShow(opts)) {
    document.documentElement.classList.remove("ck-intro-pending");
    return null;
  }
  current = createIntro(opts).mount();
  return current;
}
export function play(opts = {}) {
  return mountClikoIntro({ ...opts, force: true });
}
