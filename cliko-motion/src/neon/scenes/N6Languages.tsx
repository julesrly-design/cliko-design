// SCÈNE 6 · MULTILINGUE (0:21 → 0:23,5)
// Une bulle « Aa » ; le fil l'entoure, puis lance une branche vers chaque drapeau, qui claque
// sur le temps (FR, NL, EN). « FR · NL · EN » se compose dessous, puis « inclus ».
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp, springAt } from "../../lib/math";
import { EASE, FONT, NEON, TEXT } from "../theme";
import { drawnAt, ellipseLoop, makeTrack, pointOn, through, type P } from "../paths";
import { Haze, Sparks, Svg, Wire } from "../Neon";
import { Camera, Flag, Orb, Words } from "../UI";

export const N6_PRE = 14;
export const LAND = [30, 60, 90];
const C: P = [520, 760];
const R = 128;
const FLAGS: P[] = [
  [250, 520],
  [800, 560],
  [600, 1060],
];

export const N6Languages: React.FC = () => {
  const lf = useCurrentFrame() - N6_PRE;
  const main = useMemo(
    () =>
      makeTrack([-160, 900], [
        { d: through([[-160, 900], [120, 980], [C[0] - R - 40, C[1] + 40]]), f0: 0, f1: 14, ease: EASE.out },
        { d: ellipseLoop(C[0], C[1], R + 40, R + 40, Math.PI * 0.9, 1.05, 48), f0: 14, f1: 30, ease: EASE.inOut },
        // part vers la droite (whip-pan vers l'offre)
        { d: through([[C[0] - R - 30, C[1] + 60], [C[0] - 40, C[1] + R + 120], [900, 1200], [1300, 1260]]), f0: 128, f1: 152, ease: EASE.in },
      ]),
    [],
  );
  const branches = useMemo(
    () =>
      FLAGS.map((f, i) => {
        const a = Math.atan2(f[1] - C[1], f[0] - C[0]);
        const s: P = [C[0] + Math.cos(a) * (R + 30), C[1] + Math.sin(a) * (R + 30)];
        const e: P = [f[0] - Math.cos(a) * 80, f[1] - Math.sin(a) * 60];
        const mid: P = [(s[0] + e[0]) / 2 + Math.sin(a) * 40, (s[1] + e[1]) / 2 - Math.cos(a) * 40];
        return makeTrack(s, [{ d: through([s, mid, e]), f0: LAND[i] - 9, f1: LAND[i], ease: EASE.in }]);
      }),
    [],
  );
  const head = pointOn(main.d, drawnAt(main, lf));
  const out = EASE.in(clamp((lf - 140) / 10));
  const codes = TEXT.languages.codes;
  const line = codes.join(" · ");
  return (
    <Camera
      frame={lf}
      keys={[
        { f: -14, y: 60, s: 0.92, rz: 2 },
        { f: 80, y: 20, s: 1, rz: 0 },
        { f: 160, y: 0, s: 1.05, rz: -1.5 },
      ]}
    >
      <Haze at={head} />
      <Svg>
        <Wire track={main} frame={lf} />
        {branches.map((b, i) => (
          <Wire key={i} track={b} frame={lf} head={false} width={3.2} />
        ))}
      </Svg>
      <Orb x={C[0]} y={C[1]} r={R} color={NEON.amber} pop={springAt(lf + 8, { stiffness: 160, damping: 13 })}>
        <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 104, color: "#0B1020", letterSpacing: "-0.04em" }}>Aa</span>
      </Orb>
      {FLAGS.map((f, i) => {
        const a = lf - LAND[i];
        const s = springAt(a, { stiffness: 320, damping: 11 });
        if (a < 0) return null;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: f[0] - 70,
                top: f[1] - 48,
                scale: `${s}`,
                rotate: `${(1 - Math.min(1, s)) * (i % 2 ? 18 : -18)}deg`,
                filter: `drop-shadow(0 0 ${30 * clamp(1 - a / 30) + 10}px rgba(255,196,107,.55))`,
              }}
            >
              <Flag code={codes[i]} w={140} />
            </div>
            <Svg>
              <Sparks at={f} age={a} count={22} speed={10} seed={i + 11} life={26} />
            </Svg>
          </React.Fragment>
        );
      })}
      {/* « FR · NL · EN » : chaque code apparaît avec son drapeau */}
      <div style={{ position: "absolute", left: 66, width: 900, top: 1170, display: "flex", justifyContent: "flex-start", opacity: 1 - out, filter: out ? `blur(${out * 12}px)` : undefined }}>
        {line.split(" ").map((w, k) => {
          const idx = Math.floor((k + 1) / 2); // les « · » arrivent avec le code suivant
          const a = lf - LAND[Math.min(2, idx)];
          const s = springAt(a, { stiffness: 300, damping: 13 });
          return (
            <span
              key={k}
              style={{
                display: "inline-block",
                margin: "0 14px",
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 104,
                letterSpacing: "-0.03em",
                color: w === "·" ? NEON.amber : NEON.text,
                opacity: clamp(a / 3),
                scale: `${a < 0 ? 0 : 1.25 - 0.25 * Math.min(1, s)}`,
                filter: `blur(${(1 - clamp(a / 8)) * 10}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <Words text={TEXT.languages.suffix} at={105} size={96} x={80} y={1300} width={900} frame={lf} accent={[TEXT.languages.suffix]} out={out} />
    </Camera>
  );
};
