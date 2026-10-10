import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { DirBlur } from "../components/Fx";
import { SiteMock } from "../components/Devices";
import { Hook as HookId, useScene } from "../timeline";
import { clamp, sp } from "../utils";

const SPACING = 380;
const SPEED = 30; // px/frame avant l'arrêt
const CARD_W = 300;
const CARD_H = 470;

// Tampon industriel : descente sèche en 3 frames, remontée en 7.
const pressY = (frame: number, hits: number[]) => {
  for (const h of hits) {
    const d = frame - h;
    if (d >= 0 && d < 3) return interpolate(d, [0, 3], [1, 0]);
    if (d >= 3 && d < 10) return interpolate(d, [3, 10], [0, 1]);
  }
  return 1;
};

const Card: React.FC<{ n: number; label: string; style?: React.CSSProperties; children?: React.ReactNode }> = ({ n, label, style, children }) => (
  <div style={{ position: "absolute", width: CARD_W, height: CARD_H, left: -CARD_W / 2, top: -CARD_H, borderRadius: 22, overflow: "hidden", boxShadow: "0 24px 40px -14px rgba(0,0,0,.45)", ...style }}>
    <SiteMock variant="gray" width={CARD_W} />
    <div style={{ position: "absolute", left: 18, bottom: 18, padding: "6px 12px", border: `3px solid ${C.grayDark}`, color: C.grayDark, fontFamily: F.display, fontWeight: 900, fontSize: 20, letterSpacing: 1, transform: "rotate(-6deg)", borderRadius: 6 }}>
      {label} {String(n).padStart(4, "0")}
    </div>
    {children}
  </div>
);

// La chaîne de montage. `pos` = position de la carte héros (0 = centre, arrêtée).
export const Belt: React.FC<{ pos: number; speed: number; press: number; heroLift: number; heroColor: number; hook: HookId }> = ({
  pos, speed, press, heroLift, heroColor, hook,
}) => {
  const blurId = "belt-blur";
  const label = hook === "B" ? "#" : "MODÈLE N°";
  const cards = [];
  for (let i = Math.ceil((-1700 - pos) / SPACING); i <= Math.floor((1700 - pos) / SPACING); i++) {
    if (i === 0 && heroLift > 0) continue;
    cards.push(
      <Card key={i} n={347 + i} label={label} style={{ transform: `translateX(${pos + i * SPACING}px)`, filter: heroLift > 0 ? `blur(${6 * heroLift}px) brightness(${1 - 0.25 * heroLift})` : undefined }} />,
    );
  }
  return (
    <AbsoluteFill>
      <DirBlur id={blurId} amount={speed * 0.45} />
      <div style={{ position: "absolute", left: 540, top: 1000, transform: "rotate(-12deg)" }}>
        {/* tapis */}
        <div style={{ position: "absolute", left: -1400, width: 2800, top: 0, height: 120, background: `repeating-linear-gradient(90deg, #2B2E33 0 46px, #3A3E44 46px 50px)`, backgroundPosition: `${pos}px 0`, boxShadow: "inset 0 10px 18px rgba(0,0,0,.45)" }} />
        <div style={{ position: "absolute", left: -1400, width: 2800, top: 120, height: 34, background: "linear-gradient(#5A5F66, #2B2E33)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, filter: speed > 1 ? `url(#${blurId})` : undefined }}>{cards}</div>
        {/* tampon */}
        <div style={{ position: "absolute", left: -110, width: 220, top: -CARD_H - 340 - 0 + (1 - press) * 300, height: 300, opacity: heroLift > 0 ? 1 - heroLift : 1 }}>
          <div style={{ position: "absolute", left: 90, width: 40, top: -900, height: 1000, background: "linear-gradient(90deg,#3A3E44,#6B7078,#3A3E44)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 100, height: 200, borderRadius: 18, background: "linear-gradient(#4A4E55,#26292D)", boxShadow: "0 20px 30px rgba(0,0,0,.4)" }} />
        </div>
        {heroLift > 0 && (
          <div style={{ position: "absolute", left: 0, top: 0, transform: `translateX(${pos}px) translateY(${-260 * heroLift}px) rotate(${12 * heroLift}deg) scale(${1 + 0.55 * heroLift})` }}>
            <Card n={347} label={label} style={{ boxShadow: `0 ${30 + 60 * heroLift}px ${40 + 80 * heroLift}px -20px rgba(0,0,0,${0.45 + 0.15 * heroLift})` }}>
              <div style={{ position: "absolute", inset: 0, clipPath: `circle(${heroColor * 120}% at 50% 45%)` }}>
                <SiteMock variant="cliko" width={CARD_W} />
              </div>
            </Card>
          </div>
        )}
      </div>
      {/* lumière d'usine froide */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(30,40,55,.25), transparent 40%, rgba(30,40,55,.2))", opacity: 1 - heroColor * 0.8 }} />
    </AbsoluteFill>
  );
};

// Position du héros : défile à vitesse constante puis freine et se cale au centre (léger recul).
export const beltPos = (frame: number, brake: number, settle: number) => {
  const final = SPEED * (brake + 5);
  return frame < brake ? SPEED * frame - final : SPEED * brake + SPEED * 5 * settle - final;
};

export const useBrake = (hook: HookId) => {
  const T = useScene("accroche");
  return hook === "A" ? T.at("site") : T.at("numéro");
};

export const HookScene: React.FC<{ hook: HookId }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("accroche");
  const brake = useBrake(hook);
  const reveal = hook === "A" ? T.at("chaîne") - 4 : T.at("pas");
  const hits = hook === "A" ? [-3, T.at("mérite"), T.at("mieux")] : [-3, T.at("vous"), T.at("comme")];

  const settle = sp(frame, fps, brake, { damping: 9, stiffness: 220, mass: 0.6 });
  const pos = beltPos(frame, brake, settle);
  const speed = frame < brake ? SPEED : interpolate(frame - brake, [0, 4], [SPEED * 0.6, 0], clamp);
  const lift = sp(frame, fps, brake + 4, { damping: 13, stiffness: 120 });
  const color = interpolate(frame, [reveal, reveal + 14], [0, 1], clamp);

  return <Belt hook={hook} pos={pos} speed={speed} press={pressY(frame, hits)} heroLift={lift} heroColor={color} />;
};
