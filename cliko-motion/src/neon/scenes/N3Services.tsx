// SCÈNE 3 · LES SERVICES (0:07 → 0:13)
// La liste du site (titres en gras séparés par de fins filets). La lumière parcourt les filets en
// serpentin, de gauche à droite puis de droite à gauche : chaque service s'allume à son passage,
// son numéro passe à l'ambre et une coche apparaît, sur le temps.
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp, springAt } from "../../lib/math";
import { EASE, FONT, LOGO, NEON, TEXT } from "../theme";
import { drawnAt, makeTrack, pointOn, through, type Seg } from "../paths";
import { Haze, Svg, Wire } from "../Neon";
import { Camera, Icon } from "../UI";

export const N3_PRE = 14;
export const LIGHT = [45, 105, 165, 225];
const X0 = 80;
const X1 = 920;
const Y0 = 560;
const STEP = 210;
const itemTop = (i: number) => Y0 + i * STEP;
const lineY = (i: number) => itemTop(i) + 168; // filet sous le titre
const RUN = 26; // durée du passage le long d'un filet

const track = () => {
  const segs: Seg[] = [];
  // arrive par le bas à gauche et remonte jusqu'au premier filet
  segs.push({ d: through([[-140, 1700], [40, 1500], [30, 1100], [26, lineY(0) + 40], [X0, lineY(0)]]), f0: 0, f1: LIGHT[0] - RUN / 2, ease: EASE.out });
  for (let i = 0; i < 4; i++) {
    const ltr = i % 2 === 0;
    const a: [number, number] = [ltr ? X0 : X1, lineY(i)];
    const b: [number, number] = [ltr ? X1 : X0, lineY(i)];
    segs.push({ d: through([a, [(a[0] + b[0]) / 2, lineY(i)], b]), f0: LIGHT[i] - RUN / 2, f1: LIGHT[i] + RUN / 2, ease: EASE.inOut });
    if (i < 3) {
      // descend par la marge (sans traverser les titres) jusqu'au filet suivant
      const m = ltr ? X1 + 46 : X0 - 46;
      segs.push({ d: through([b, [m, lineY(i) + 40], [m, lineY(i + 1) - 40], [ltr ? X1 : X0, lineY(i + 1)]]), f0: LIGHT[i] + RUN / 2, f1: LIGHT[i + 1] - RUN / 2, ease: EASE.inOut });
    }
  }
  // sortie par le bas (les branches de la scène 4 montent du bas de l'écran)
  segs.push({ d: through([[X0, lineY(3)], [40, lineY(3) + 120], [300, 1760], [540, 2140]]), f0: 318, f1: 352, ease: EASE.in });
  return makeTrack([-140, 1700], segs);
};

const Item: React.FC<{ i: number; lf: number }> = ({ i, lf }) => {
  const a = lf - LIGHT[i];
  const lit = EASE.out(clamp((a + 2) / 10));
  const check = springAt(a - 2, { stiffness: 320, damping: 12 });
  const enter = EASE.out(clamp((lf + 12 - i * 5) / 16));
  return (
    <div style={{ position: "absolute", left: X0, top: itemTop(i), width: X1 - X0, height: 168, opacity: enter, translate: `0 ${(1 - enter) * 30}px` }}>
      <div style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 26, letterSpacing: "0.08em", color: lit > 0 ? NEON.amber : NEON.faint, marginTop: 22 }}>{String(i + 1).padStart(2, "0")}</div>
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: 76,
          lineHeight: 1.05,
          letterSpacing: "-0.035em",
          whiteSpace: "nowrap",
          marginTop: 10,
          color: `rgba(242,243,250,${0.28 + 0.72 * lit})`,
          textShadow: lit > 0 ? `0 0 ${34 * (1 - clamp(a / 30))}px rgba(255,196,107,.55)` : undefined,
        }}
      >
        {TEXT.servicesShort[i]}
      </div>
      {check > 0 && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 84,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: NEON.amber,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: `${Math.max(0.2, check)}`,
            boxShadow: `0 0 ${30 * clamp(check)}px rgba(255,196,107,.8)`,
          }}
        >
          <Icon name="check" size={34} color="#0B1020" width={3} />
        </div>
      )}
      {/* filet du site (le fil néon passe par-dessus) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 168, height: 1.5, background: NEON.cardLine }} />
    </div>
  );
};

export const N3Services: React.FC = () => {
  const lf = useCurrentFrame() - N3_PRE;
  const t = useMemo(track, []);
  const head = pointOn(t.d, drawnAt(t, lf));
  const pulse = Math.max(0, ...LIGHT.map((l) => Math.exp(-Math.abs(lf - l) / 8)));
  const logoIn = EASE.out(clamp((lf + 6) / 16));
  return (
    <Camera
      frame={lf}
      keys={[
        { f: -14, y: 40, s: 0.95 },
        { f: 60, y: 10, s: 0.99 },
        { f: 360, y: -10, s: 1.04 },
      ]}
    >
      <Haze at={head} />
      {/* petit interrupteur Cliko en tête de liste */}
      <svg width={104} height={70} viewBox="318 40 166 112" style={{ position: "absolute", left: X0, top: 420, overflow: "visible", opacity: logoIn }}>
        <path d={LOGO.toggle} fill={NEON.amber} fillRule="evenodd" style={{ filter: `drop-shadow(0 0 ${10 + 20 * pulse}px rgba(255,196,107,${0.5 + 0.4 * pulse}))` }} />
      </svg>
      {[0, 1, 2, 3].map((i) => (
        <Item key={i} i={i} lf={lf} />
      ))}
      <Svg>
        <Wire track={t} frame={lf} />
      </Svg>
    </Camera>
  );
};
