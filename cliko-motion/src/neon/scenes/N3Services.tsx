// SCÈNE 3 · LES SERVICES (0:07 → 0:13)
// Une carte façon « classement » : le fil arrive en bas à gauche, remonte le long de la carte et
// entoure chaque ligne tour à tour ; la ligne s'allume (icône, coche) au passage, sur le temps.
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp, springAt } from "../../lib/math";
import { EASE, FONT, LOGO, NEON, TEXT } from "../theme";
import { drawnAt, makeTrack, pointOn, roundRectFromLeft, through, type Seg } from "../paths";
import { Haze, Svg, Wire } from "../Neon";
import { Camera, Card, Icon, type IconName } from "../UI";

export const N3_PRE = 14;
const CARD = { x: 110, y: 470, w: 780, h: 960 };
const ROW = { x: 138, w: 724, h: 168, y0: 690, gap: 14, r: 30 };
const rowY = (i: number) => ROW.y0 + i * (ROW.h + ROW.gap);
export const LIGHT = [45, 105, 165, 225];
const ICONS: IconName[] = ["pencil", "server", "shield", "chat"];
const LOOP = 22; // durée du tour d'une ligne

const track = () => {
  const segs: Seg[] = [];
  const lx = ROW.x - 10;
  // entrée en bas à gauche, petite boucle, puis remontée le long de la carte
  segs.push({ d: through([[-140, 1720], [40, 1600], [150, 1560], [lx, 1460], [lx - 6, 1200], [lx, rowY(0) + ROW.h / 2]]), f0: 0, f1: LIGHT[0] - LOOP / 2, ease: EASE.out });
  for (let i = 0; i < 4; i++) {
    const y = rowY(i);
    segs.push({ d: roundRectFromLeft(lx, y - 10, ROW.w + 20, ROW.h + 20, ROW.r + 8, 1), f0: LIGHT[i] - LOOP / 2, f1: LIGHT[i] + LOOP / 2, ease: EASE.inOut });
    if (i < 3) segs.push({ d: through([[lx, y + ROW.h / 2], [lx - 14, y + ROW.h + ROW.gap / 2], [lx, rowY(i + 1) + ROW.h / 2]]), f0: LIGHT[i] + LOOP / 2, f1: LIGHT[i + 1] - LOOP / 2, ease: EASE.inOut });
  }
  // sortie par le bas (les branches de la scène 4 montent du bas de l'écran)
  segs.push({ d: through([[lx, rowY(3) + ROW.h / 2], [lx - 30, 1560], [380, 1760], [560, 2140]]), f0: 318, f1: 352, ease: EASE.in });
  return makeTrack([-140, 1720], segs);
};

const Row: React.FC<{ i: number; lf: number }> = ({ i, lf }) => {
  const a = lf - LIGHT[i];
  const lit = EASE.out(clamp((a + 4) / 10));
  const check = springAt(a - 4, { stiffness: 320, damping: 12 });
  const enter = springAt(lf + 10 - i * 5, { stiffness: 140, damping: 16 });
  const label = TEXT.servicesShort[i];
  return (
    <div
      style={{
        position: "absolute",
        left: ROW.x,
        top: rowY(i),
        width: ROW.w,
        height: ROW.h,
        borderRadius: ROW.r,
        background: `rgba(255,196,107,${0.07 * lit})`,
        opacity: clamp(enter),
        translate: `0 ${(1 - Math.min(1, enter)) * 40}px`,
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "0 34px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 26,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: lit > 0 ? `linear-gradient(160deg, ${NEON.amberHot}, ${NEON.amberDeep})` : "rgba(255,255,255,.05)",
          border: `1.5px solid rgba(255,196,107,${0.25 + 0.5 * lit})`,
          boxShadow: `0 0 ${40 * lit}px rgba(255,196,107,${0.55 * lit})`,
        }}
      >
        <Icon name={ICONS[i]} size={44} color={lit > 0.5 ? "#0B1020" : NEON.mist} width={2.2} />
      </div>
      <div style={{ flex: 1, fontFamily: FONT.display, fontWeight: 600, fontSize: 52, letterSpacing: "-0.02em", wordSpacing: "0.08em", whiteSpace: "nowrap", color: lit > 0 ? NEON.text : "rgba(242,243,250,.42)", lineHeight: 1 }}>{label}</div>
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: "50%",
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: check > 0 ? NEON.amber : "transparent",
          border: `2px solid ${check > 0 ? NEON.amber : "rgba(185,196,240,.25)"}`,
          scale: `${check > 0 ? Math.max(0.2, check) : 1}`,
          boxShadow: `0 0 ${30 * clamp(check)}px rgba(255,196,107,.8)`,
        }}
      >
        {check > 0 && <Icon name="check" size={34} color="#0B1020" width={3} />}
      </div>
    </div>
  );
};

// Petit logo-interrupteur en tête de carte
const Toggle: React.FC<{ on: number }> = ({ on }) => (
  <svg width={150} height={100} viewBox="318 40 166 112" style={{ position: "absolute", left: CARD.x + CARD.w / 2 - 75, top: CARD.y + 44, overflow: "visible" }}>
    <path d={LOGO.toggle} fill={NEON.amber} fillRule="evenodd" style={{ filter: `drop-shadow(0 0 ${12 + 24 * on}px rgba(255,196,107,${0.5 + 0.4 * on}))` }} />
  </svg>
);

export const N3Services: React.FC = () => {
  const lf = useCurrentFrame() - N3_PRE;
  const t = useMemo(track, []);
  const head = pointOn(t.d, drawnAt(t, lf));
  const pulse = Math.max(0, ...LIGHT.map((l) => Math.exp(-Math.abs(lf - l) / 8)));
  return (
    <Camera
      frame={lf}
      keys={[
        { f: -14, x: 0, y: 40, s: 0.9, rx: 14, ry: 14 },
        { f: 40, y: 10, s: 0.97, rx: 8, ry: 6 },
        { f: 240, y: 0, s: 1.02, rx: 4, ry: -6 },
        { f: 360, y: 40, s: 1.06, rx: 10, ry: -10 },
      ]}
    >
      <Haze at={head} />
      <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} r={48} glow={0.6 + 0.4 * pulse} />
      <Toggle on={pulse} />
      <div style={{ position: "absolute", left: CARD.x + 40, top: CARD.y + 196, width: CARD.w - 80, height: 1.5, background: NEON.cardLine }} />
      {[0, 1, 2, 3].map((i) => (
        <Row key={i} i={i} lf={lf} />
      ))}
      <Svg>
        <Wire track={t} frame={lf} />
      </Svg>
    </Camera>
  );
};
