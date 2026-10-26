// SCÈNE 8 · LOGO + CTA (0:26 → 0:30)
// La ligne ramène la caméra au point de départ en un long vol, fait des boucles serrées et
// converge au centre : flash blanc, onde de choc sur la grille, explosion de particules qui se
// recomposent en logo Cliko (le vrai tracé de cliko.be). La tête dessine les lettres puis se loge
// dans le « o » en interrupteur : elle devient le bouton allumé. « cliko.be », « Lien en bio ».
// Dans les dernières frames, elle quitte le logo et revient au centre : la vidéo boucle.
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { PALETTE, SCENES, TEXT, SAFE } from "../config";
import { registerCamera, registerShake } from "../lib/camera";
import type { TrackBuilder } from "../lib/track";
import { clamp, cubicOut, expoIn, expoInOut, expoOut, hash2, lerp, mulberry, shot, sineInOut, smoothstep, springAt, type V3 } from "../lib/math";
import { pxToWorld, REF, toWorld } from "../lib/world";
import { useGlobalFrame, useSceneFrame } from "../lib/seq";
import { SceneOverlay } from "../overlay/SceneOverlay";
import { registerLineBoost } from "../three/Line";
import { flashAt, registerFlash, registerShock } from "../three/Stage";
import { registerBurst } from "../three/sparks";
import { CSS_FONT } from "../lib/fonts";
import { HOOK_START } from "./S1Hook";
import { useCurrentFrame } from "remotion";

const ID = "logo" as const;
const S = SCENES.logo;

// ── Logo cliko.be (SVG d'origine, viewBox 480×148, traits de 22) ───────────
const VB = { w: 480, h: 148 };
const LOGO_W = 660;
const K = LOGO_W / VB.w;
const LOGO_CX = (SAFE.left + 1080 - SAFE.right) / 2;
const LOGO = { x: LOGO_CX - LOGO_W / 2, y: 840 - (VB.h * K) / 2 };
const px = (x: number, y: number): [number, number] => [LOGO.x + x * K, LOGO.y + y * K];

const LOGO_PATHS = {
  c: "M82.47 68.57A41 41 0 1 0 82.47 123.43",
  l: "M123 11V135",
  i: "M179 57V135",
  k1: "M235 11V135",
  k2: "M235 112L289 57",
  k3: "M253 93.67L293 135",
  o: "M372 44H428A52 52 0 0 1 428 148H372A52 52 0 0 1 372 44ZM389 96A39 39 0 1 0 467 96A39 39 0 1 0 389 96Z",
};
const DOT = { cx: 179, cy: 16, r: 13 };
const HOLE = { cx: 428, cy: 96, r: 39 };

// Parcours de la tête sur le logo (coordonnées SVG) : chaque trait, avec de petits sauts entre eux.
type Stroke = { id: keyof typeof LOGO_PATHS | "dot" | "hole"; pts: [number, number][] };
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 40): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
const C_ANG = Math.atan2(68.57 - 96, 82.47 - 52);
const STROKES: Stroke[] = [
  // l'arc du « c » part du haut à droite et tourne par la gauche jusqu'en bas à droite
  { id: "c", pts: arc(52, 96, 41, C_ANG, C_ANG - (2 * Math.PI - 2 * Math.abs(C_ANG)), 40) },
  { id: "l", pts: [[123, 11], [123, 135]] },
  { id: "i", pts: [[179, 57], [179, 135]] },
  { id: "dot", pts: arc(DOT.cx, DOT.cy, DOT.r * 0.5, Math.PI / 2, Math.PI / 2 + Math.PI * 2, 16) },
  { id: "k1", pts: [[235, 11], [235, 135]] },
  { id: "k2", pts: [[235, 112], [289, 57]] },
  { id: "k3", pts: [[253, 93.67], [293, 135]] },
  // le « o » interrupteur : la tête fait le tour du trou puis s'y pose
  { id: "hole", pts: arc(HOLE.cx, HOLE.cy, HOLE.r + 6, Math.PI, Math.PI + Math.PI * 2, 48) },
];

// Route complète : chaque trait est précédé d'un saut ; on garde pour chaque trait sa plage [u0, u1].
const buildRoute = () => {
  const pts: [number, number][] = [];
  const ranges: Record<string, [number, number]> = {};
  const lens: number[] = [];
  const push = (p: [number, number]) => {
    if (pts.length) lens.push(lens[lens.length - 1] + Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1]));
    else lens.push(0);
    pts.push(p);
  };
  const marks: { id: string; a: number; b: number }[] = [];
  for (const s of STROKES) {
    const a = pts.length;
    s.pts.forEach(push);
    marks.push({ id: s.id, a, b: pts.length - 1 });
  }
  const L = lens[lens.length - 1];
  for (const m of marks) ranges[m.id] = [lens[m.a] / L, lens[m.b] / L];
  return { pts, lens: lens.map((l) => l / L), ranges };
};
const ROUTE = buildRoute();
const routeAt = (u: number): [number, number] => {
  const { pts, lens } = ROUTE;
  let i = 1;
  while (i < pts.length - 1 && lens[i] < u) i++;
  const t = clamp((u - lens[i - 1]) / Math.max(1e-9, lens[i] - lens[i - 1]));
  return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)];
};

// Temps clés (frames locales)
const CONVERGE = 60; // f1620 : convergence, flash, explosion
const DRAW = [68, 104] as const; // la tête dessine le logo
const KNOB = 106; // elle se pose dans l'interrupteur (f1666)
const URL_T = 120; // f1680
const CTA_T = 150; // f1710
const OUT = 222; // départ vers le point de la scène 1 (f1782)
const drawEase = (t: number) => sineInOut(t) * 0.35 + t * 0.65;
const drawU = (lf: number) => drawEase(clamp((lf - DRAW[0]) / (DRAW[1] - DRAW[0])));

const P = (x: number, y: number, z = 0) => pxToWorld(ID, x, y, z);
const routeWorld = (u: number): V3 => {
  const [x, y] = routeAt(u);
  const [sx, sy] = px(x, y);
  return P(sx, sy, 0.15);
};

export const logoLine = (T: TrackBuilder) => {
  const f = (lf: number) => S.start + lf;
  // le long vol de retour (la caméra suit), puis boucles serrées et convergence au centre
  T.go(f(36), [toWorld(ID, [6, 5, -14]), toWorld(ID, [2.6, 1.2, -2]), toWorld(ID, [1.9, 0, 0])], shot);
  T.fn(
    f(CONVERGE),
    (u) => {
      const a = u * Math.PI * 6;
      const r = 1.9 * (1 - u) * (1 - 0.25 * Math.sin(u * 9));
      return toWorld(ID, [r * Math.cos(a), r * Math.sin(a) * 0.85, 0.7 * Math.sin(a * 0.5) * (1 - u)]);
    },
    expoIn,
  );
  // jaillit de l'explosion et file au début du « c »
  T.go(f(DRAW[0]), [P(560, 760, 1.2), routeWorld(0)], shot);
  T.fn(f(DRAW[1]), (u) => routeWorld(u), drawEase);
  // se pose au centre du trou de l'interrupteur
  const [hx, hy] = px(HOLE.cx, HOLE.cy);
  T.go(f(KNOB), [P(hx, hy, 0.2)], expoOut);
  T.hold(f(OUT), 0.025);
  // retour au point de départ de la scène 1 : la boucle est bouclée
  T.go(S.end, [P(hx - 60, hy + 140, 0.9), toWorld("hook", HOOK_START)], shot);
};

export const logoSetup = () => {
  registerCamera(ID, (lf) => {
    // arrive un peu en retrait, s'approche, et finit exactement sur la caméra de la scène 1
    const k = smoothstep(0, 240, lf);
    return { pos: [0.5 * Math.sin(lf / 60) * (1 - k), 0.25 * (1 - k), REF.distance + 1.2 * (1 - k)], look: [0, 0, 0], roll: 0.03 * Math.sin(lf / 50) * (1 - k) };
  });
  registerFlash(S.start + CONVERGE, 1.0, 3);
  registerShake(S.start + CONVERGE, 0.026, 9);
  registerShock(S.start + CONVERGE, () => [0, -3.5], 0.42, 80);
  registerBurst(S.start + CONVERGE, toWorld(ID, [0, 0, 0]), 80, 0.3, 40, 0);
  registerLineBoost(S.start + 40, S.start + CONVERGE + 4, 2.0);
  registerLineBoost(S.start + KNOB - 4, S.start + KNOB + 24, 2.8);
  registerLineBoost(S.start + CTA_T - 6, S.start + CTA_T + 36, 2.7); // éclat maximum (frame de la miniature)
};

// ── Particules qui se recomposent en logo ──────────────────────────────────
const N_PART = 1400;
const PART_VS = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
varying vec3 vColor;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * 24.0 / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const PART_FS = /* glsl */ `
varying vec3 vColor;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float a = exp(-dot(q, q) * 3.5);
  gl_FragColor = vec4(vColor * a, 1.0);
}`;

// Cible de chaque particule : un point du logo (abscisse u de la route, ou intérieur du « o »).
const targets = (() => {
  const rnd = mulberry(99);
  return Array.from({ length: N_PART }, (_, i) => {
    let u: number;
    let x: number;
    let y: number;
    if (i % 5 === 0) {
      // remplissage du « o » (anneau entre le contour du stade et le trou)
      const a = rnd() * Math.PI * 2;
      const r = HOLE.r + 4 + rnd() * 10;
      x = HOLE.cx - 10 + Math.cos(a) * (r + 6 * Math.abs(Math.cos(a)));
      y = HOLE.cy + Math.sin(a) * Math.min(50, r);
      u = ROUTE.ranges.hole[0] + (ROUTE.ranges.hole[1] - ROUTE.ranges.hole[0]) * rnd();
    } else {
      u = rnd() * ROUTE.ranges.k3[1];
      [x, y] = routeAt(u);
      x += (rnd() - 0.5) * 18;
      y += (rnd() - 0.5) * 18;
    }
    return { u, x, y, seed: rnd() };
  });
})();

// Frame où la tête passe à l'abscisse u de la route (inverse de drawU).
const arriveAt = (u: number) => {
  let lo: number = DRAW[0];
  let hi: number = DRAW[1];
  for (let k = 0; k < 20; k++) {
    const m = (lo + hi) / 2;
    if (drawU(m) < u) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

const LogoParticles: React.FC = () => {
  const lf = useSceneFrame();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N_PART * 3), 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(N_PART * 3), 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(N_PART), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: PART_VS, fragmentShader: PART_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), []);
  const arrivals = useMemo(() => targets.map((t) => arriveAt(t.u)), []);
  const hot = useMemo(() => new THREE.Color("#FFF3DC"), []);
  const amber = useMemo(() => new THREE.Color(PALETTE.lineMid), []);
  useLayoutEffect(() => {
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const col = geo.getAttribute("aColor") as THREE.BufferAttribute;
    const size = geo.getAttribute("aSize") as THREE.BufferAttribute;
    const c0 = toWorld(ID, [0, 0, 0]);
    const tmp = new THREE.Color();
    targets.forEach((t, i) => {
      const age = lf - CONVERGE;
      if (age < 0) {
        size.setX(i, 0);
        return;
      }
      // 1) explosion : direction aléatoire, freinage exponentiel
      const th = hash2(i, 1) * Math.PI * 2;
      const ph = Math.acos(hash2(i, 2) * 2 - 1);
      const sp = 0.25 + hash2(i, 3) * 0.55;
      const e = (1 - Math.exp(-age / 9)) * sp * 9;
      const ex: V3 = [c0[0] + Math.sin(ph) * Math.cos(th) * e, c0[1] + Math.cos(ph) * e * 0.8, c0[2] + Math.sin(ph) * Math.sin(th) * e * 0.6];
      // 2) recomposition : chaque particule rejoint son point du logo juste avant le passage de la tête
      const arrive = arrivals[i];
      const dur = 16 + t.seed * 10;
      const k = expoInOut(clamp((lf - (arrive - dur)) / dur));
      const [sx, sy] = px(t.x, t.y);
      const tg = P(sx, sy, 0.1);
      const p: V3 = [lerp(ex[0], tg[0], k), lerp(ex[1], tg[1], k), lerp(ex[2], tg[2], k)];
      pos.setXYZ(i, p[0], p[1], p[2]);
      // s'éteint une fois posée (le tracé vectoriel prend le relais)
      const fadeIn = clamp(age / 3);
      const fade = 1 - clamp((lf - arrive - 2) / 12);
      const flicker = 0.75 + 0.25 * Math.sin(lf * 0.6 + i);
      tmp.copy(amber).lerp(hot, 0.4 + 0.6 * (1 - k)).multiplyScalar(2.0 * fadeIn * fade * flicker);
      col.setXYZ(i, tmp.r, tmp.g, tmp.b);
      size.setX(i, (0.9 + t.seed * 1.4) * (1 + (1 - k) * 0.6));
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;
    size.needsUpdate = true;
  }, [lf, geo, arrivals, amber, hot]);
  if (lf < CONVERGE - 1 || lf > DRAW[1] + 30) return null;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={13} />;
};

export const Logo3D: React.FC = () => <LogoParticles />;

// ── Calque : logo vectoriel, URL, CTA, flash ───────────────────────────────
export const LogoOverlay: React.FC = () => {
  const lf = useSceneFrame();
  useGlobalFrame();
  const u = drawU(lf);
  // sortie (boucle) : le tracé se défait à rebours, les textes s'effacent
  const out = Math.pow(clamp((lf - OUT + 2) / 13), 1.6);
  const strokeP = (id: string) => {
    const [a, b] = ROUTE.ranges[id];
    return clamp((u - a) / (b - a));
  };
  const lit = (id: string) => clamp((lf - arriveAt(ROUTE.ranges[id][1])) / 18); // passe du trait lumineux au blanc
  const toggle = clamp((lf - KNOB + 2) / 8);
  const toggleOn = springAt(lf - KNOB, { stiffness: 260, damping: 11 });
  const urlP = expoOut(clamp((lf - URL_T) / 16));
  const ctaS = springAt(lf - CTA_T, { stiffness: 220, damping: 13 });
  const textOut = clamp((lf - OUT + 4) / 10);
  const strokes: (keyof typeof LOGO_PATHS)[] = ["c", "l", "i", "k1", "k2", "k3"];
  return (
    <SceneOverlay id={ID}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id="logo-glow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="logo-amber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={PALETTE.accentFrom} />
            <stop offset="0.55" stopColor={PALETTE.accent} />
            <stop offset="1" stopColor={PALETTE.accentTo} />
          </linearGradient>
        </defs>
        <g transform={`translate(${LOGO.x} ${LOGO.y}) scale(${K})`}>
          {strokes.map((id) => {
            const p = strokeP(id);
            if (p <= 0) return null;
            const w = lit(id);
            const remain = 1 - out; // à rebours, du dernier trait au premier
            return (
              <path
                key={id}
                d={LOGO_PATHS[id]}
                fill="none"
                stroke={w < 1 ? `rgb(${lerp(255, 242, w)},${lerp(226, 243, w)},${lerp(170, 250, w)})` : PALETTE.text}
                strokeWidth={22}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - Math.min(p, remain)}
                filter={w < 1 ? "url(#logo-glow)" : undefined}
              />
            );
          })}
          {/* point du i */}
          {strokeP("dot") > 0 && <circle cx={DOT.cx} cy={DOT.cy} r={DOT.r * cubicOut(strokeP("dot")) * (1 - out)} fill={PALETTE.text} />}
          {/* « o » interrupteur ambre */}
          {toggle > 0 && (
            <g opacity={toggle * (1 - out)} transform={`translate(${HOLE.cx} ${HOLE.cy}) scale(${lerp(0.85, 1, clamp(toggleOn)) + (toggleOn > 1 ? (toggleOn - 1) * 0.3 : 0)}) translate(${-HOLE.cx} ${-HOLE.cy})`}>
              <path d={LOGO_PATHS.o} fill="url(#logo-amber)" fillRule="evenodd" style={{ filter: `drop-shadow(0 0 ${14 + 30 * (1 - clamp((lf - KNOB) / 40))}px rgba(255,196,107,.75))` }} />
            </g>
          )}
        </g>
      </svg>
      {/* URL */}
      <div style={{ position: "absolute", left: 0, width: LOGO_CX * 2, top: 1010, textAlign: "center", overflow: "hidden", height: 100, opacity: 1 - textOut }}>
        <div style={{ fontFamily: CSS_FONT.display, fontWeight: 600, fontSize: 76, letterSpacing: "-0.03em", color: PALETTE.text, lineHeight: "96px", transform: `translateY(${(1 - urlP) * 100}%)`, filter: `blur(${(1 - urlP) * 8 + textOut * 10}px)` }}>
          {TEXT.logo.url}
        </div>
      </div>
      {/* CTA */}
      {lf >= CTA_T && (
        <div style={{ position: "absolute", left: 0, width: LOGO_CX * 2, top: 1140, display: "flex", justifyContent: "center", opacity: clamp((lf - CTA_T) / 5) * (1 - textOut) }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              padding: "26px 48px",
              borderRadius: 999,
              transform: `scale(${lerp(0.7, 1, Math.min(1.15, ctaS))})`,
              background: `linear-gradient(180deg, ${PALETTE.accentFrom} 0%, ${PALETTE.accent} 55%, ${PALETTE.accentTo} 100%)`,
              color: PALETTE.bg,
              fontFamily: CSS_FONT.body,
              fontWeight: 600,
              fontSize: 48,
              letterSpacing: "-0.01em",
              boxShadow: "0 0 60px rgba(255,196,107,.45), 0 20px 40px -16px rgba(240,169,72,.7), inset 0 1px 0 rgba(255,255,255,.55)",
              filter: `blur(${textOut * 10}px)`,
            }}
          >
            {TEXT.logo.cta}
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={PALETTE.bg} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `translateY(${-4 * Math.abs(Math.sin((lf - CTA_T) / 9))}px)` }}>
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
        </div>
      )}
    </SceneOverlay>
  );
};

// Flash blanc plein cadre (au-dessus de tout), piloté par la même courbe que le flash 3D.
export const FlashOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const k = flashAt(f);
  if (k < 0.01) return null;
  return <div style={{ position: "absolute", inset: 0, background: "#FFF7EC", opacity: Math.min(0.75, k * 0.6), pointerEvents: "none" }} />;
};

