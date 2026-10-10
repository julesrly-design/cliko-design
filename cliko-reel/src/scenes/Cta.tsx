import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { Icon } from "../components/Icons";
import { Hook as HookId, useScene } from "../timeline";
import { clamp, ease, sp } from "../utils";
import { Belt, beltPos, useBrake } from "./Hook";

const LOOP = 10; // frames de raccord vers le frame 0

// PROVISOIRE : logotype de travail, remplacé par le logo Cliko (public/brand/logo.svg).
const Logo: React.FC<{ reveal: number }> = ({ reveal }) => (
  <div style={{ display: "flex", alignItems: "baseline", fontFamily: F.display, fontWeight: 900, fontSize: 230, letterSpacing: -10, color: C.ink, clipPath: `inset(0 ${100 - reveal * 100}% 0 0)` }}>
    cliko
    <span style={{ display: "inline-block", width: 56, height: 56, borderRadius: 28, background: C.accent, marginLeft: 8, transform: `scale(${reveal})` }} />
  </div>
);

export const CtaScene: React.FC<{ hook: HookId }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("cta");
  const brake = useBrake(hook);
  const aTrouve = T.at("trouvé");
  const aDevis = T.at("devis");

  const logo = interpolate(frame, [0, 9], [0, 1], { ...clamp, easing: ease });
  const logoPop = sp(frame, fps, 0, { damping: 9, stiffness: 200, mass: 0.6 });
  const click = interpolate(frame, [0, 20], [0, 1], { ...clamp, easing: ease });
  const up = sp(frame, fps, aDevis - 4, { damping: 16, stiffness: 120 });
  const pin = sp(frame, fps, aTrouve, { damping: 8, stiffness: 220, mass: 0.6 });
  const ripple = interpolate(frame - aTrouve, [4, 24], [0, 1], { ...clamp, easing: ease });
  const url = sp(frame, fps, aDevis, { damping: 13, stiffness: 160 });
  const handle = sp(frame, fps, aDevis + 6, { damping: 13, stiffness: 160 });
  const pill = sp(frame, fps, aDevis + 12, { damping: 13, stiffness: 160 });

  // Raccord de boucle : le plan final s'envole, la chaîne du frame 0 remonte en place.
  const loop = interpolate(frame, [T.dur - LOOP, T.dur - 1], [0, 1], { ...clamp, easing: (x) => x * x });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateY(${-loop * 1400}px)`, filter: `blur(${loop * 18}px)` }}>
        {/* clic signature : anneaux */}
        <div style={{ position: "absolute", left: 465, top: 640 - up * 210, width: 0, height: 0 }}>
          {[0, 1].map((k) => (
            <div key={k} style={{ position: "absolute", left: -300 * (click + k * 0.3), top: -300 * (click + k * 0.3), width: 600 * (click + k * 0.3), height: 600 * (click + k * 0.3), borderRadius: "50%", border: `${8 - k * 4}px solid ${C.accent}`, opacity: (1 - click) * (k ? 0.5 : 1) }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 150, top: 520 - up * 210, display: "flex", justifyContent: "center", transform: `scale(${(0.7 + 0.3 * logoPop) * (1 - 0.25 * up)})` }}>
          <Logo reveal={logo} />
        </div>
        {/* épingle plantée sous le logo */}
        <div style={{ position: "absolute", left: 465 - 70, top: 790 - up * 380, width: 140, display: "flex", flexDirection: "column", alignItems: "center", opacity: frame >= aTrouve ? 1 - up : 0 }}>
          <div style={{ transform: `translateY(${(1 - pin) * -260}px)` }}>
            <Icon name="pin" size={140} color={C.accent} fill={C.accentSoft} stroke={2} />
          </div>
          <div style={{ width: 160 * (0.4 + ripple), height: 40 * (0.4 + ripple), borderRadius: "50%", border: `4px solid ${C.accent}`, opacity: 1 - ripple, marginTop: -16 }} />
        </div>
        {/* plan final lisible */}
        <div style={{ position: "absolute", left: 60, width: 810, top: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontSize: 132, letterSpacing: -5, color: C.ink, transform: `translateY(${(1 - url) * 60}px) scale(${0.8 + 0.2 * url})`, opacity: url }}>
            cliko<span style={{ color: C.accent }}>.be</span>
          </div>
          <div style={{ fontFamily: F.text, fontWeight: 700, fontSize: 54, color: C.inkSoft, transform: `translateY(${(1 - handle) * 40}px)`, opacity: handle }}>@cliko_be</div>
          <div style={{ marginTop: 20, padding: "24px 38px", borderRadius: 999, background: C.ink, color: "#fff", fontFamily: F.display, fontWeight: 800, fontSize: 36, textAlign: "center", lineHeight: 1.25, transform: `scale(${pill})`, opacity: Math.min(1, pill * 2) }}>
            <span style={{ color: C.accent }}>Devis gratuit</span> · Bruxelles et toute la Belgique
          </div>
        </div>
      </AbsoluteFill>
      {loop > 0 && (
        <AbsoluteFill style={{ transform: `translateY(${(1 - loop) * 1920}px)`, background: C.cold }}>
          <Belt hook={hook} pos={beltPos(-LOOP + loop * LOOP, brake, 0)} speed={30} press={1 - loop} heroLift={0} heroColor={0} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
