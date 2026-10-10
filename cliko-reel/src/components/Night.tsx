import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { B } from "../brand";
import { useTimeline } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Ambiance globale, pilotée par la timeline :
//  usine (accroche) → nuit Cliko (problème → offre) → chaleur ambrée (humain) → nuit galaxie (CTA).
export const useMood = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { scenes } = useTimeline();
  const t = frame / fps;
  const factory = interpolate(t, [scenes.accroche.to - 0.15, scenes.accroche.to + 0.1], [1, 0], clamp);
  const warm = interpolate(
    t,
    [scenes.humain.from - 0.1, scenes.humain.from + 0.7, scenes.cta.from - 0.25, scenes.cta.from + 0.35],
    [0, 1, 1, 0],
    clamp,
  );
  return { factory, warm, t };
};

type Star = { x: number; y: number; r: number; layer: number; phase: number; hue: number };

const makeStars = (n: number): Star[] =>
  Array.from({ length: n }, (_, i) => ({
    x: random(`sx${i}`) * 1080,
    y: random(`sy${i}`) * 1920,
    r: 0.6 + Math.pow(random(`sr${i}`), 3) * 2.2,
    layer: Math.floor(random(`sl${i}`) * 3),
    phase: random(`sp${i}`) * Math.PI * 2,
    hue: random(`sh${i}`),
  }));

// Champ d'étoiles en 3 couches de parallaxe, scintillement déterministe.
export const Stars: React.FC<{ opacity?: number; drift?: number; count?: number }> = ({ opacity = 1, drift = 0.35, count = 240 }) => {
  const frame = useCurrentFrame();
  const stars = useMemo(() => makeStars(count), [count]);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
      {stars.map((s, i) => {
        const speed = [0.25, 0.55, 1][s.layer] * drift;
        const y = (((s.y - frame * speed) % 1920) + 1920) % 1920;
        const tw = 0.55 + 0.45 * Math.sin(frame / (9 + s.layer * 4) + s.phase);
        const fill = s.hue > 0.86 ? B.accentBright : s.hue > 0.6 ? "#d8e4ff" : "#f2f3fa";
        return <circle key={i} cx={s.x} cy={y} r={s.r} fill={fill} opacity={(0.25 + 0.55 * tw) * [0.5, 0.75, 1][s.layer]} />;
      })}
    </svg>
  );
};

// Fond de la marque : nuit, lueurs pétrole / marine / indigo / royal qui dérivent, étoiles, vignette.
export const Night: React.FC = () => {
  const frame = useCurrentFrame();
  const { factory, warm } = useMood();
  const d = frame / 30;
  const glow = (rgb: string, x: number, y: number, w: number, h: number, a: number) =>
    `radial-gradient(${w}% ${h}% at ${x}% ${y}%, rgba(${rgb},${a}) 0%, rgba(${rgb},${a * 0.45}) 38%, transparent 72%)`;
  const night = 1 - factory;
  return (
    <AbsoluteFill style={{ background: B.night }}>
      {/* lueurs de la marque (mêmes dégradés que le fond fixe de cliko.be) */}
      <AbsoluteFill
        style={{
          opacity: night * (1 - warm * 0.6),
          background: [
            glow(B.glowPetrol, 18 + 6 * Math.sin(d * 0.21), 70 + 5 * Math.cos(d * 0.17), 90, 50, 0.9),
            glow(B.glowMarine, 80 + 5 * Math.cos(d * 0.19), 30 + 6 * Math.sin(d * 0.23), 85, 48, 0.85),
            glow(B.glowRoyal, 60 + 8 * Math.sin(d * 0.13), 12, 95, 34, 0.55),
            glow(B.glowIndigo, 30, 45 + 8 * Math.sin(d * 0.15), 70, 40, 0.5),
          ].join(","),
        }}
      />
      {/* usine : acier froid, lumière zénithale */}
      <AbsoluteFill
        style={{
          opacity: factory,
          background: `radial-gradient(120% 60% at 50% 0%, #2a3346 0%, #141a28 45%, #080b12 100%)`,
        }}
      />
      {/* chaleur humaine : lumière ambrée qui monte du bas */}
      <AbsoluteFill
        style={{
          opacity: warm,
          background: `radial-gradient(110% 70% at 50% 108%, rgba(255,196,107,.55) 0%, rgba(240,169,72,.28) 30%, rgba(80,40,30,.0) 70%), radial-gradient(90% 60% at 85% 15%, rgba(255,212,143,.18) 0%, transparent 60%), linear-gradient(180deg, #120f1c 0%, #1d1420 55%, #2a1a18 100%)`,
        }}
      />
      <Stars opacity={night * (1 - warm * 0.7)} />
      <AbsoluteFill style={{ background: "radial-gradient(100% 70% at 50% 45%, transparent 55%, rgba(4,6,14,.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// Grain filmique : 8 trames pré-calculées (public/fx), une par image, en lumière douce.
export const Grain: React.FC<{ amount?: number }> = ({ amount = 0.06 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: amount }}>
      <Img src={staticFile(`fx/grain-${frame % 8}.png`)} style={{ width: 1080, height: 1920 }} />
    </AbsoluteFill>
  );
};

// Repères des zones de sécurité Reels/TikTok (contrôle uniquement) : haut 250 px, bas 450 px, droite 150 px.
export const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 250, background: "rgba(255,0,80,.28)" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 450, background: "rgba(255,0,80,.28)" }} />
    <div style={{ position: "absolute", top: 250, bottom: 450, right: 0, width: 150, background: "rgba(255,0,80,.28)" }} />
  </AbsoluteFill>
);
