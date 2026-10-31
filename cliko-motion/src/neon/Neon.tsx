// Primitives lumineuses : le fil néon (halo large, lueur, cœur, pointe blanche), la tête,
// les halos d'ambiance, les étincelles et l'onde de choc. Tout en SVG : net et parfaitement rond.
import React from "react";
import { NEON } from "./theme";
import { drawnAt, pointOn, type P, type Track } from "./paths";
import { hash2 } from "../lib/math";

// Filtres partagés (une seule fois dans la composition).
export const NeonDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="nb-xl" filterUnits="userSpaceOnUse" x={-600} y={-600} width={2280} height={3120}>
        <feGaussianBlur stdDeviation={26} />
      </filter>
      <filter id="nb-l" filterUnits="userSpaceOnUse" x={-600} y={-600} width={2280} height={3120}>
        <feGaussianBlur stdDeviation={11} />
      </filter>
      <filter id="nb-m" filterUnits="userSpaceOnUse" x={-600} y={-600} width={2280} height={3120}>
        <feGaussianBlur stdDeviation={4} />
      </filter>
      <radialGradient id="head-halo">
        <stop offset="0" stopColor={NEON.amberHot} stopOpacity={0.9} />
        <stop offset="0.25" stopColor={NEON.amber} stopOpacity={0.45} />
        <stop offset="1" stopColor={NEON.amber} stopOpacity={0} />
      </radialGradient>
    </defs>
  </svg>
);

// portion [from, to] d'un tracé : tiret unique décalé (pas de point parasite au départ avec les bouts ronds)
const dashProps = (from: number, to: number, total: number) => ({ strokeDasharray: `${Math.max(0.01, to - from)} ${total + 10}`, strokeDashoffset: -Math.max(0, from) });

// Halo sans filtre : couches de traits de plus en plus larges et transparentes. (Les flous SVG
// sont redessinés au mauvais endroit par Chrome dès qu'un parent est transformé : on s'en passe.)
export const GLOW_LAYERS: [number, number][] = [
  // [largeur × épaisseur du cœur, opacité]
  [18, 0.025],
  [12, 0.04],
  [8, 0.07],
  [5, 0.13],
  [3, 0.3],
  [1.8, 0.6],
];

// Fil néon : dessine la portion [from, to] (en px le long du tracé).
export const NeonStroke: React.FC<{ d: string; total: number; from?: number; to: number; width?: number; intensity?: number; tail?: number; color?: string }> = ({
  d,
  total,
  from = 0,
  to,
  width = 4,
  intensity = 1,
  tail = 220,
  color = NEON.amber,
}) => {
  if (to <= from + 0.5) return null;
  const common = { d, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const dp = dashProps(from, to, total);
  return (
    <g>
      {GLOW_LAYERS.map(([w, o], i) => (
        <path key={i} {...common} stroke={color} strokeWidth={width * w} strokeOpacity={o * intensity} {...dp} />
      ))}
      <path {...common} stroke={NEON.amberHot} strokeWidth={width} strokeOpacity={Math.min(1, intensity)} {...dp} />
      {/* pointe blanche : la partie la plus récente est la plus chaude */}
      <path {...common} stroke={NEON.core} strokeWidth={width * 0.55} strokeOpacity={0.95 * Math.min(1, intensity)} {...dashProps(Math.max(from, to - tail), to, total)} />
    </g>
  );
};

// Tête lumineuse (disque rond, halo doux).
export const Head: React.FC<{ at: P; size?: number; intensity?: number }> = ({ at, size = 1, intensity = 1 }) => (
  <g opacity={Math.min(1, intensity)}>
    <circle cx={at[0]} cy={at[1]} r={70 * size} fill="url(#head-halo)" opacity={0.55 * intensity} />
    <circle cx={at[0]} cy={at[1]} r={22 * size} fill="url(#head-halo)" />
    <circle cx={at[0]} cy={at[1]} r={7.5 * size} fill={NEON.core} />
  </g>
);

// Fil complet piloté par une piste : partie dessinée + tête, avec extinction optionnelle.
// `rest` : la tête reste visible une fois le fil arrivé (elle « se pose »).
export const Wire: React.FC<{ track: Track; frame: number; width?: number; fade?: number; head?: boolean; rest?: boolean; tail?: number; trim?: number }> = ({
  track,
  frame,
  width = 4,
  fade = 1,
  head = true,
  rest = false,
  tail = 240,
  trim = 0,
}) => {
  const to = drawnAt(track, frame);
  if (to <= 0.5 || fade <= 0) return null;
  const at = pointOn(track.d, to);
  const speed = Math.abs(drawnAt(track, frame + 0.5) - drawnAt(track, frame - 0.5));
  const done = to >= track.total - 0.5;
  return (
    <g opacity={fade}>
      <NeonStroke d={track.d} total={track.total} from={trim} to={to} width={width} tail={tail} />
      {head && (!done || rest) && <Head at={at} size={1 + Math.min(0.3, speed / 140)} />}
    </g>
  );
};

// Halo d'ambiance : la lumière du fil éclaire le fond autour de la tête.
export const Haze: React.FC<{ at: P; r?: number; k?: number }> = ({ at, r = 520, k = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: at[0] - r,
      top: at[1] - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle, rgba(255,196,107,${0.13 * k}) 0%, rgba(255,170,80,${0.05 * k}) 40%, rgba(255,170,80,0) 70%)`,
      pointerEvents: "none",
    }}
  />
);

// Étincelles déterministes (explosion à un point).
export const Sparks: React.FC<{ at: P; age: number; count?: number; speed?: number; life?: number; seed?: number }> = ({ at, age, count = 36, speed = 14, life = 34, seed = 1 }) => {
  if (age < 0 || age > life) return null;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const a = hash2(seed, i) * Math.PI * 2;
        const v = speed * (0.35 + hash2(i, seed + 3) * 0.9);
        const l = life * (0.45 + 0.55 * hash2(seed + 7, i));
        if (age > l) return null;
        const k = (1 - Math.exp(-age / 9)) * 9;
        const k0 = (1 - Math.exp(-Math.max(0, age - 2.2) / 9)) * 9;
        const g = 0.09 * age * age;
        const x = at[0] + Math.cos(a) * v * k;
        const y = at[1] + Math.sin(a) * v * k + g;
        const x0 = at[0] + Math.cos(a) * v * k0;
        const y0 = at[1] + Math.sin(a) * v * k0 + 0.09 * Math.max(0, age - 2.2) ** 2;
        const o = Math.pow(1 - age / l, 1.3);
        return <line key={i} x1={x0} y1={y0} x2={x} y2={y} stroke={i % 3 ? NEON.amberHot : NEON.core} strokeWidth={3.2 * o + 0.6} strokeLinecap="round" opacity={o} />;
      })}
    </g>
  );
};

// Onde de choc circulaire.
export const Shock: React.FC<{ at: P; age: number; life?: number; maxR?: number }> = ({ at, age, life = 40, maxR = 900 }) => {
  if (age < 0 || age > life) return null;
  const t = age / life;
  const r = maxR * (1 - Math.pow(1 - t, 3));
  return (
    <g opacity={1 - t}>
      {GLOW_LAYERS.map(([w, o], i) => (
        <circle key={i} cx={at[0]} cy={at[1]} r={r} fill="none" stroke={NEON.amber} strokeWidth={(3 + 6 * (1 - t)) * w} strokeOpacity={o} />
      ))}
      <circle cx={at[0]} cy={at[1]} r={r} fill="none" stroke={NEON.amberHot} strokeWidth={3} />
    </g>
  );
};

// Calque SVG plein cadre (1080×1920) pour les primitives ci-dessus.
export const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>
    {children}
  </svg>
);
