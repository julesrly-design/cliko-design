// Fond Cliko (comme cliko.be) : nuit presque noire teintée de violet, nébuleuses indigo/lavande,
// champ d'étoiles qui scintille doucement (quelques étoiles ambrées), et la galaxie de particules
// du site, en spirale, qui tourne lentement. Tout est dessiné sur canvas, déterministe.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { mulberry } from "../lib/math";
import { NEON } from "./theme";

const W = 1080;
const H = 1920;

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const stars = useMemo(() => {
    const r = mulberry(7);
    return Array.from({ length: 520 }, () => ({
      x: r() * W,
      y: r() * H,
      z: 0.2 + r() * 0.8, // profondeur : parallaxe et taille
      s: 0.5 + Math.pow(r(), 3) * 1.8,
      ph: r() * Math.PI * 2,
      amber: r() < 0.06,
    }));
  }, []);
  useLayoutEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, W, H);
    for (const st of stars) {
      // dérive lente vers le haut (on « avance » dans la nuit), bouclée
      const y = (((st.y - frame * 0.18 * st.z) % H) + H) % H;
      const tw = 0.55 + 0.45 * Math.sin(frame * 0.035 * (0.5 + st.z) + st.ph);
      g.globalAlpha = (0.25 + 0.6 * st.z) * tw;
      g.fillStyle = st.amber ? NEON.amber : "#E8E6FF";
      g.beginPath();
      g.arc(st.x, y, st.s * (0.6 + st.z * 0.6), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }, [frame, stars]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 70% 18%, ${NEON.bgCenter} 0%, ${NEON.bgMid} 45%, ${NEON.bgEdge} 100%)` }}>
      {/* nébuleuses (lavande et indigo du site) */}
      <AbsoluteFill style={{ background: "radial-gradient(55% 32% at 72% 20%, rgba(124,104,190,.22) 0%, rgba(124,104,190,0) 70%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(60% 34% at 18% 78%, rgba(52,44,116,.28) 0%, rgba(52,44,116,0) 70%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(50% 30% at 85% 92%, rgba(28,52,122,.22) 0%, rgba(28,52,122,0) 70%)" }} />
      <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0 }} />
      <AbsoluteFill style={{ background: "radial-gradient(90% 70% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// Galaxie spirale (le visuel du site) : bras de particules sur une ellipse inclinée, cœur laiteux.
export const Galaxy: React.FC<{ cx: number; cy: number; r?: number; tilt?: number; opacity?: number; spin?: number }> = ({ cx, cy, r = 420, tilt = -0.32, opacity = 1, spin = 0 }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const pts = useMemo(() => {
    const rnd = mulberry(99);
    return Array.from({ length: 1700 }, (_, i) => {
      const arm = i % 2;
      const t = Math.pow(rnd(), 0.75); // 0 = cœur, 1 = bord
      const spread = (rnd() - 0.5) * (0.35 + t * 0.9);
      return {
        rad: t,
        ang: arm * Math.PI + t * 5.2 + spread,
        jitter: (rnd() - 0.5) * 0.06,
        s: 0.6 + Math.pow(rnd(), 4) * 2.2,
        a: 0.35 + rnd() * 0.65,
        amber: rnd() < 0.05,
      };
    });
  }, []);
  useLayoutEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, W, H);
    // cœur laiteux
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, r * 0.55);
    core.addColorStop(0, "rgba(255,244,226,.7)");
    core.addColorStop(0.25, "rgba(214,196,255,.3)");
    core.addColorStop(1, "rgba(124,104,190,0)");
    g.save();
    g.translate(cx, cy);
    g.rotate(tilt);
    g.scale(1, 0.42);
    g.translate(-cx, -cy);
    g.fillStyle = core;
    g.beginPath();
    g.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    g.fill();
    g.restore();
    const rot = frame * 0.004 + spin;
    for (const p of pts) {
      const a = p.ang + rot * (1.6 - p.rad);
      const rr = r * (p.rad + p.jitter);
      const x0 = Math.cos(a) * rr;
      const y0 = Math.sin(a) * rr * 0.42;
      const x = cx + x0 * Math.cos(tilt) - y0 * Math.sin(tilt);
      const y = cy + x0 * Math.sin(tilt) + y0 * Math.cos(tilt);
      g.globalAlpha = Math.min(1, p.a * (1 - p.rad * 0.5) * 1.25);
      g.fillStyle = p.amber ? NEON.amber : p.rad < 0.25 ? "#FFF4E2" : "#E6E0FF";
      g.beginPath();
      g.arc(x, y, p.s, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }, [frame, pts, cx, cy, r, tilt, spin]);
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, opacity }} />;
};
