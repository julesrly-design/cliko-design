import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { B, FONT, LOGO } from "../../brand";
import { Stars } from "../../components/Night";
import { EXPO, Flame, Orb, PAL, Ripple, ramp } from "../kit";
import { IgniteLogo } from "./Ignite";
import { PILL_FONT } from "./Light";
import { M } from "../timeline";

// 7 · La pilule « Devis gratuit » s'ouvre en aplat ambre ; une pilule nuit « Cliko. » surgit puis avale l'écran.
export const Brand: React.FC = () => {
  const f = useCurrentFrame();
  const { from, pill, dive } = M.brand;
  const open = ramp(f, from, from + 12, EXPO.io);
  const w0 = 560, h0 = 140;
  const w = interpolate(open, [0, 1], [w0, 1080 + 40]);
  const h = interpolate(open, [0, 1], [h0, 1920 + 40]);
  const r = interpolate(open, [0, 1], [70, 0]);
  const pop = EXPO.out(ramp(f, pill, pill + 12, (t) => t));
  const bounce = 1 + 0.12 * Math.sin(Math.PI * ramp(f, pill, pill + 14, (t) => t));
  const grow = ramp(f, dive, M.end.from + 2, EXPO.in);
  const shine = ramp(f, pill + 6, pill + 22, (t) => t);
  const streak = ramp(f, from, M.end.from, (t) => t);
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", left: 540 - w / 2, top: 960 - h / 2, width: w, height: h, borderRadius: r, overflow: "hidden",
        background: `radial-gradient(90% 60% at 50% 40%, ${B.accentBright} 0%, ${B.accent} 48%, ${B.accentDeep} 100%)`,
      }}>
        <div style={{ position: "absolute", left: -400 + streak * 1400, top: -200, width: 260, height: 2400, transform: "rotate(24deg)", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - ramp(f, from, from + 5, (t) => t),
          fontFamily: FONT.display, fontWeight: 700, fontSize: PILL_FONT, letterSpacing: "-0.015em", color: B.night }}>Devis gratuit</div>
      </div>
      {f >= pill && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{
            position: "relative", width: 560, height: 190, borderRadius: 95, background: B.night, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `scale(${pop * bounce * (1 + EXPO.in(grow) * 26)})`, boxShadow: "0 40px 90px -30px rgba(80,40,0,.7)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", fontFamily: FONT.display, fontWeight: LOGO.weight, fontSize: 124, letterSpacing: LOGO.tracking, color: B.text, lineHeight: 1, opacity: 1 - ramp(f, dive, dive + 5, (t) => t) }}>
              Cliko<Orb size={124 * 0.19} glow={0.7} style={{ marginLeft: 124 * 0.03 }} />
            </div>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: -200 + shine * 900, width: 120, transform: "skewX(-20deg)", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent)" }} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// 8 · Plan final : nuit étoilée, « Cliko. » s'embrase, le titre du site arrive lettre par lettre en arc, puis cliko.be.
const HEAD = [["Votre", "commerce"], ["mérite", "d'être"], ["trouvé."]];

export const End: React.FC = () => {
  const f = useCurrentFrame();
  const E = M.end;
  const zoom = 1 + ramp(f, E.from, M.total, (t) => t) * 0.04;
  const cta = EXPO.out(ramp(f, E.cta, E.cta + 14, (t) => t));
  const pill = EXPO.out(ramp(f, E.cta + 5, E.cta + 19, (t) => t));
  const reveal = 1 - EXPO.out(ramp(f, E.from, E.from + 12, (t) => t));
  let j = 0;
  return (
    <AbsoluteFill style={{ background: B.night }}>
      <AbsoluteFill style={{
        background: [
          `radial-gradient(90% 45% at 20% 75%, rgba(${B.glowPetrol},.75) 0%, transparent 70%)`,
          `radial-gradient(85% 45% at 85% 25%, rgba(${B.glowMarine},.8) 0%, transparent 70%)`,
          `radial-gradient(70% 40% at 40% 45%, rgba(${B.glowIndigo},.5) 0%, transparent 70%)`,
        ].join(","),
      }} />
      <Stars opacity={0.9} drift={0.6} />
      <Flame pal={PAL.cliko} intensity={0.42} y={820} spin={-8} />
      <AbsoluteFill style={{ transform: `scale(${zoom * (1 + reveal * 0.25)})`, filter: `blur(${reveal * 12}px)` }}>
        <div style={{ position: "absolute", top: 470, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <IgniteLogo size={128} dotAt={E.logo} lettersAt={E.logo + 8} />
        </div>
        <div style={{ position: "absolute", top: 720, left: 0, right: 0, textAlign: "center", fontFamily: FONT.display, fontWeight: 800, fontSize: 118, letterSpacing: "-0.045em", lineHeight: 1.04, color: B.text }}>
          {HEAD.map((row, ri) => (
            <div key={ri} style={{ whiteSpace: "nowrap" }}>
              {row.map((word, wi) => (
                <span key={wi} style={{ display: "inline-block", margin: "0 0.12em" }}>
                  {word.split("").map((ch, ci) => {
                    const at = E.line + j++ * 0.95;
                    const p = EXPO.out(ramp(f, at, at + 18, (t) => t));
                    const th = (1 - p) * 1.25;
                    const R = 520;
                    const amber = ri === 2;
                    return (
                      <span key={ci} style={{
                        display: "inline-block", opacity: Math.min(1, p * 2),
                        transform: `translate(${-Math.sin(th) * R * 0.6}px, ${(1 - Math.cos(th)) * R}px) rotate(${-th * 40}deg)`,
                        filter: `blur(${(1 - p) * 14}px)`,
                        ...(amber ? { background: `linear-gradient(180deg, ${B.accentBright}, ${B.accent} 60%, ${B.accentDeep})`, WebkitBackgroundClip: "text", color: "transparent", textShadow: "none" } : {}),
                      }}>{ch}</span>
                    );
                  })}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 540 + 250, top: 720 + 118 * 1.04 * 2.5 }}>
          <Ripple p={ramp(f, E.line + 30, E.line + 52, (t) => t)} size={360} />
        </div>
        <div style={{ position: "absolute", top: 1150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 84, letterSpacing: "-0.03em", color: B.text, opacity: cta, transform: `translateY(${(1 - cta) * 40}px)`, filter: `blur(${(1 - cta) * 10}px)` }}>
            cliko<span style={{ color: B.accent }}>.be</span>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 18, padding: "26px 52px", borderRadius: 999,
            background: `linear-gradient(180deg, ${B.accentBright} 0%, ${B.accent} 55%, ${B.accentDeep} 100%)`, color: B.night,
            fontFamily: FONT.display, fontWeight: 700, fontSize: 46, letterSpacing: "-0.01em",
            boxShadow: `0 0 ${50 + 30 * Math.sin(f / 8)}px rgba(255,196,107,.4), 0 18px 40px -16px rgba(240,169,72,.7), inset 0 1px 0 rgba(255,255,255,.5)`,
            transform: `scale(${0.6 + 0.4 * pill})`, opacity: pill,
          }}>
            Demander un devis gratuit
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={B.night} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
