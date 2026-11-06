// Boîte à outils du film motion design : courbes, flou de mouvement, flamme, étincelle, curseur, ruban.
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { B, EASE, FONT } from "../brand";

export const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0 → 1 entre a et b (frames), avec une courbe du site.
export const ramp = (f: number, a: number, b: number, ease: (t: number) => number = EASE.out) =>
  interpolate(f, [a, b], [0, 1], { ...CL, easing: ease });

// Courbe « expo » franche pour les gestes rapides (entrées / sorties de caméra).
export const EXPO = {
  in: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  out: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  io: (t: number) => (t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
};

// Flou proportionnel à la vitesse d'une valeur animée (px/frame) : flou de mouvement bon marché.
export const speedBlur = (fn: (f: number) => number, f: number, k = 0.35, max = 40) =>
  Math.min(max, Math.abs(fn(f + 0.5) - fn(f - 0.5)) * k);

// ---------------------------------------------------------------------------------------------
// Flamme : panache de lumière chaude (traînées floues superposées), recolorable.
export type Palette = { core: string; mid: string; edge: string };
export const PAL = {
  cliko: { core: "#ffe6b0", mid: "#ffa832", edge: "#d4500a" },
  forno: { core: "#ffe6cf", mid: "#ff8a4c", edge: "#c3261a" },
  sobre: { core: "#f4f1ea", mid: "#aeb3c0", edge: "#5c1f16" },
  celest: { core: "#fff1c6", mid: "#dca843", edge: "#6d3c10" },
  night: { core: "#c9d6ff", mid: "#3b57d6", edge: "#1a2a86" },
} satisfies Record<string, Palette>;

export const mixPal = (f: number, stops: number[], pals: Palette[]): Palette => ({
  core: interpolateColors(f, stops, pals.map((p) => p.core)),
  mid: interpolateColors(f, stops, pals.map((p) => p.mid)),
  edge: interpolateColors(f, stops, pals.map((p) => p.edge)),
});

const plume = (f: number, seed: string, base: number[][], amp: number) => {
  const p = base.map(([x, y], i) => [
    x + noise2D(seed + "x", i, f * 0.012) * amp,
    y + noise2D(seed + "y", i, f * 0.012) * amp,
  ]);
  return `M${p[0][0]} ${p[0][1]} C${p[1][0]} ${p[1][1]} ${p[2][0]} ${p[2][1]} ${p[3][0]} ${p[3][1]}`;
};

export const Flame: React.FC<{ pal: Palette; intensity?: number; spin?: number; y?: number }> = ({ pal, intensity = 1, spin = 0, y = 0 }) => {
  const f = useCurrentFrame();
  const a = plume(f, "a", [[-260, 2050], [260, 1300], [520, 620], [1360, -160]], 170);
  const b = plume(f + 300, "b", [[1300, 1750], [820, 1250], [200, 980], [-300, 300]], 150);
  const c = plume(f + 600, "c", [[120, 1900], [380, 1200], [940, 1100], [1240, 420]], 130);
  const layers: [string, string, number, number, number][] = [
    // chemin, couleur, épaisseur, flou, opacité
    [a, pal.edge, 520, 150, 0.7],
    [b, pal.edge, 340, 130, 0.4],
    [a, pal.mid, 260, 80, 0.85],
    [c, pal.mid, 200, 70, 0.55],
    [b, pal.mid, 140, 50, 0.5],
    [a, pal.core, 70, 28, 0.85],
    [c, pal.core, 28, 16, 0.5],
  ];
  return (
    <AbsoluteFill style={{ opacity: intensity, transform: `translateY(${y}px) rotate(${spin}deg) scale(1.15)`, mixBlendMode: "screen" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ overflow: "visible" }}>
        <defs>
          {layers.map((l, i) => (
            <filter key={i} id={`fl${i}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={l[3]} />
            </filter>
          ))}
        </defs>
        {layers.map(([d, color, w, , op], i) => (
          <path key={i} d={d} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" opacity={op} filter={`url(#fl${i})`} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// Fond noir profond + vignette, base des scènes sombres.
export const Void: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: "#05060c" }}>
    {children}
    <AbsoluteFill style={{ background: "radial-gradient(110% 75% at 50% 48%, transparent 45%, rgba(0,0,0,.75) 100%)" }} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------------------------
// Étincelle du clic : rayons qui jaillissent puis se rétractent autour d'un point.
export const Burst: React.FC<{ p: number; size: number; rays?: number; color?: string; rot?: number; thickness?: number }> = ({
  p, size, rays = 10, color = B.accentBright, rot = 0, thickness = 7,
}) => {
  if (p <= 0 || p >= 1) return null;
  const head = EXPO.out(Math.min(1, p * 1.6));
  const tail = EASE.io(Math.max(0, (p - 0.25) / 0.75));
  return (
    <svg width={size * 2} height={size * 2} viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`} style={{ position: "absolute", left: -size, top: -size, overflow: "visible" }}>
      {Array.from({ length: rays }).map((_, i) => {
        const ang = (i / rays) * Math.PI * 2 + (rot * Math.PI) / 180;
        const long = i % 2 === 0 ? 1 : 0.62;
        const r0 = size * (0.28 + tail * 0.72 * long);
        const r1 = size * (0.3 + head * 0.7 * long);
        if (r1 - r0 < 1) return null;
        return (
          <line key={i} x1={Math.cos(ang) * r0} y1={Math.sin(ang) * r0} x2={Math.cos(ang) * r1} y2={Math.sin(ang) * r1}
            stroke={color} strokeWidth={thickness * (1 - tail * 0.5)} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${B.accent})` }} />
        );
      })}
    </svg>
  );
};

// Point ambre lumineux (le point du logo), avec halo réglable.
export const Orb: React.FC<{ size: number; glow?: number; style?: React.CSSProperties }> = ({ size, glow = 1, style }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: `radial-gradient(circle at 35% 30%, #fffaf0 0%, ${B.accentBright} 25%, ${B.accent} 55%, ${B.accentDeep} 100%)`,
    boxShadow: `0 0 ${size * 0.8 * glow}px rgba(255,196,107,${0.7 * Math.min(glow, 1.4)}), 0 0 ${size * 2.6 * glow}px rgba(255,170,80,${0.4 * Math.min(glow, 1.4)})`,
    ...style,
  }} />
);

// ---------------------------------------------------------------------------------------------
// Curseur de souris (pointeur blanc liseré sombre).
export const Cursor: React.FC<{ x: number; y: number; press?: number; opacity?: number; blur?: number }> = ({ x, y, press = 0, opacity = 1, blur = 0 }) => (
  <svg width={64} height={80} viewBox="0 0 32 40" style={{
    position: "absolute", left: x - 6, top: y - 4, opacity, overflow: "visible",
    transform: `scale(${1 - press * 0.18})`, transformOrigin: "6px 4px",
    filter: `drop-shadow(0 8px 14px rgba(0,0,0,.55)) blur(${blur}px)`,
  }}>
    <path d="M3 2 L3 30 L10 23.5 L14.5 34 L19.5 31.8 L15 21.6 L24.5 21.6 Z" fill="#fff" stroke="#0b1020" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

// Onde de clic (anneau qui s'étend).
export const Ripple: React.FC<{ p: number; size: number; color?: string }> = ({ p, size, color = B.accent }) => {
  if (p <= 0 || p >= 1) return null;
  const e = EASE.out(p);
  return (
    <div style={{
      position: "absolute", left: -size / 2, top: -size / 2, width: size, height: size, borderRadius: "50%",
      border: `${4 * (1 - e) + 1}px solid ${color}`, opacity: 1 - e, transform: `scale(${0.2 + e})`,
      boxShadow: `0 0 30px ${color}`,
    }} />
  );
};

// ---------------------------------------------------------------------------------------------
// Ruban ambre (scène claire) : un segment qui file le long d'une longue courbe, avec ombre portée.
export const Ribbon: React.FC<{ d: string; len: number; p: number; seg?: number; width?: number }> = ({ d, len, p, seg = 0.38, width = 30 }) => {
  if (p <= 0 || p >= 1) return null;
  // la tête avance, la queue suit : le trait apparaît, traverse et disparaît
  const head = EASE.io(Math.min(1, p / (1 - seg * 0.4))) * (1 + seg);
  const tail = Math.max(0, head - seg);
  const a = Math.min(1, tail) * len;
  const b = Math.min(1, head) * len;
  const dash = `0 ${a} ${Math.max(0.01, b - a)} ${len * 2}`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="rib" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={B.accentDeep} />
          <stop offset="0.5" stopColor={B.accent} />
          <stop offset="1" stopColor={B.accentBright} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="rgba(120,70,10,.28)" strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} transform="translate(10 26)" style={{ filter: "blur(14px)" }} />
      <path d={d} fill="none" stroke="url(#rib)" strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
      <path d={d} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={width * 0.22} strokeLinecap="round" strokeDasharray={dash} transform="translate(-3 -6)" />
    </svg>
  );
};

// Petite étiquette mono « Exemple de style » sur verre sombre.
export const Tag: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 24px", borderRadius: 999,
    background: "rgba(10,12,22,.55)", border: "1.5px solid rgba(255,255,255,.14)", backdropFilter: "blur(14px)",
    fontFamily: FONT.mono, fontSize: 24, letterSpacing: "0.08em", textTransform: "uppercase", color: B.mist, whiteSpace: "nowrap",
    ...style,
  }}>
    <span style={{ width: 10, height: 10, borderRadius: 5, background: B.accent, boxShadow: `0 0 12px ${B.accent}` }} />
    {children}
  </div>
);
