import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../brand";
import { norm, useTimeline } from "../timeline";
import { clamp, punch } from "../utils";

// Grain filmique animé (4–7 %).
export const Grain: React.FC<{ amount?: number }> = ({ amount = 0.07 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: amount }}>
      <svg width="1080" height="1920">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// Flou de mouvement directionnel (SVG) : stdDeviation sur l'axe X local de l'élément.
export const DirBlur: React.FC<{ id: string; amount: number }> = ({ id, amount }) => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={`${Math.max(0, amount)} 0`} />
    </filter>
  </svg>
);

const PUNCH_WORDS = ["mieux", "nous", "éparpillé", "vôtre", "sur-mesure", "parfait", "écoute", "jules", "vingt-quatre", "trouvé"];

// Micro-zoom « punch-in » sur les mots forts.
export const PunchIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { words } = useTimeline();
  const scale = words
    .filter((w) => PUNCH_WORDS.includes(norm(w.text)))
    .reduce((s, w) => s + 0.055 * punch(frame - Math.round(w.start * fps)), 1);
  return <AbsoluteFill style={{ transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
};

// Fond : froid et gris au début, papier ensuite, chaud pendant la scène humaine.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { scenes } = useTimeline();
  const t = frame / fps;
  const warm = interpolate(t, [scenes.humain.from, scenes.humain.from + 0.6, scenes.cta.from - 0.2, scenes.cta.from + 0.4], [0, 1, 1, 0.35], clamp);
  const cold = interpolate(t, [0, scenes.accroche.to - 0.5, scenes.accroche.to], [1, 1, 0], clamp);
  const drift = frame * 0.6;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <AbsoluteFill style={{ background: C.cold, opacity: cold }} />
      <AbsoluteFill
        style={{
          opacity: warm,
          background: `radial-gradient(120% 80% at 50% 35%, #FFE9D6 0%, ${C.warm} 55%, #F4B999 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(18,18,20,.13) 2.2px, transparent 2.4px)",
          backgroundSize: "54px 54px",
          backgroundPosition: `0px ${-drift}px`,
          opacity: 0.55,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 45%, transparent 55%, rgba(0,0,0,.10) 100%)" }} />
    </AbsoluteFill>
  );
};

// Repères des zones de sécurité Reels/TikTok (contrôle uniquement).
export const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 250, background: "rgba(255,0,80,.25)" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 450, background: "rgba(255,0,80,.25)" }} />
    <div style={{ position: "absolute", top: 250, bottom: 450, right: 0, width: 150, background: "rgba(255,0,80,.25)" }} />
  </AbsoluteFill>
);
