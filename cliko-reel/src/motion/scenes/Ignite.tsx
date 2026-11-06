import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { B, FONT, LOGO } from "../../brand";
import { Burst, EXPO, Orb, ramp } from "../kit";
import { M } from "../timeline";

// Largeurs approximatives des lettres de « Cliko » en Schibsted 700 (em), pour la sortie de derrière le point.
const W = [0.66, 0.27, 0.27, 0.57, 0.6];

// Logo qui s'écrit depuis le point : le point apparaît seul, éclate, puis les lettres sortent de derrière lui,
// de droite à gauche, et repoussent le point jusqu'à sa place de point final.
export const IgniteLogo: React.FC<{ size: number; dotAt: number; lettersAt: number; color?: string }> = ({ size, dotAt, lettersAt, color = B.text }) => {
  const f = useCurrentFrame();
  const dot = EXPO.out(ramp(f, dotAt, dotAt + 9, (t) => t));
  const pop = 1 + 0.35 * Math.sin(Math.PI * ramp(f, dotAt, dotAt + 12, (t) => t));
  const burst = ramp(f, dotAt + 2, dotAt + 26, (t) => t);
  const flare = Math.max(0, 1 - Math.abs(f - (dotAt + 4)) / 14);
  const letters = "Cliko".split("");
  return (
    <div style={{ display: "flex", alignItems: "baseline", fontFamily: FONT.display, fontWeight: LOGO.weight, fontSize: size, letterSpacing: LOGO.tracking, lineHeight: 1, color }}>
      {letters.map((l, i) => {
        const order = letters.length - 1 - i; // o d'abord, C en dernier
        const p = ramp(f, lettersAt + order * 3, lettersAt + order * 3 + 16, EXPO.out);
        return (
          <span key={i} style={{
            display: "inline-block", marginRight: `${-(1 - p) * W[i]}em`, opacity: p,
            transform: `translateX(${(1 - p) * 0.5}em) scale(${0.6 + 0.4 * p})`, filter: `blur(${(1 - p) * 16}px)`,
          }}>{l}</span>
        );
      })}
      <span style={{ position: "relative", display: "inline-block", width: size * 0.21, height: size * 0.2, marginLeft: size * 0.02 }}>
        <span style={{ position: "absolute", left: size * 0.105, bottom: size * 0.095 }}>
          <Burst p={burst} size={size * 0.95} rays={12} thickness={size * 0.028} />
          <div style={{
            position: "absolute", left: -size * 1.2, top: -size * 1.2, width: size * 2.4, height: size * 2.4, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,236,200,.9) 0%, rgba(255,196,107,.35) 30%, transparent 65%)", opacity: flare,
          }} />
        </span>
        <Orb size={size * 0.19} glow={0.8 + flare * 1.2} style={{ position: "absolute", left: size * 0.01, bottom: 0, transform: `scale(${dot * pop})`, transformOrigin: "50% 50%" }} />
      </span>
    </div>
  );
};

export const Ignite: React.FC = () => {
  const f = useCurrentFrame();
  const out = ramp(f, M.ignite.out, M.ignite.out + 14, EXPO.in);
  const zoomIn = 1.18 - 0.18 * ramp(f, 0, M.ignite.out, (t) => t);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{
        transform: `translateY(${-40 - out * 520}px) scale(${zoomIn * (1 - out * 0.45)})`,
        filter: `blur(${out * 26}px)`, opacity: 1 - out,
      }}>
        <IgniteLogo size={230} dotAt={M.ignite.dot} lettersAt={M.ignite.letters} />
      </div>
    </AbsoluteFill>
  );
};
