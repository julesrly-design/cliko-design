// SCÈNE 4 · POUR QUI (0:13 → 0:17)
// Le fil se ramifie depuis le bas de l'écran : trois branches lumineuses montent vers trois bulles
// (restaurants, hôtels, boutiques) qui s'allument une par une, sur le temps.
// Étiquettes en typo cinétique : punch 1,2 → 1, flou → net.
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp, lerp, springAt } from "../../lib/math";
import { EASE, FONT, NEON, TEXT } from "../theme";
import { drawnAt, makeTrack, pointOn, through, type P } from "../paths";
import { Haze, Sparks, Svg, Wire } from "../Neon";
import { Camera, Icon, Orb, type IconName } from "../UI";

export const N4_PRE = 14;
export const ARRIVE = [50, 110, 170];
const R = 104;
const NODES: { p: P; side: "right" | "left"; icon: IconName; via: P[] }[] = [
  { p: [300, 560], side: "right", icon: "utensils", via: [[560, 1900], [430, 1500], [180, 1080], [210, 760]] },
  { p: [760, 890], side: "left", icon: "bed", via: [[540, 1900], [640, 1520], [880, 1240], [820, 1020]] },
  { p: [320, 1230], side: "right", icon: "bag", via: [[520, 1900], [420, 1660], [250, 1460], [280, 1340]] },
];
const ROOT: P = [540, 2140];

export const N4ForWho: React.FC = () => {
  const lf = useCurrentFrame() - N4_PRE;
  const tracks = useMemo(
    () => NODES.map((n, i) => makeTrack(ROOT, [{ d: through([ROOT, ...n.via, [n.p[0], n.p[1] + R * 0.95]]), f0: ARRIVE[i] - 44, f1: ARRIVE[i], ease: EASE.inOut }])),
    [],
  );
  const heads = tracks.map((t) => pointOn(t.d, drawnAt(t, lf)));
  const active = Math.max(0, ARRIVE.findIndex((a) => lf < a));
  const out = EASE.in(clamp((lf - 238) / 14));
  return (
    <Camera
      frame={lf}
      keys={[
        { f: -14, y: 160, s: 0.94, rz: -2 },
        { f: 120, y: 40, s: 1, rz: 0 },
        { f: 250, y: -20, s: 1.05, rz: 1.5 },
      ]}
    >
      <Haze at={heads[Math.min(2, active)]} />
      <Svg>
        {tracks.map((t, i) => (
          <Wire key={i} track={t} frame={lf} />
        ))}
      </Svg>
      {NODES.map((n, i) => {
        const a = lf - ARRIVE[i];
        const pop = springAt(a, { stiffness: 220, damping: 11 });
        return (
          <React.Fragment key={i}>
            <Orb x={n.p[0]} y={n.p[1]} r={R} color={NEON.orbs[i]} pop={pop}>
              <Icon name={n.icon} size={92} color="#FFFFFF" width={2} />
            </Orb>
            <Svg>
              <Sparks at={n.p} age={a} count={26} speed={11} seed={i + 4} />
            </Svg>
            {a >= 0 && (
              <div
                style={{
                  position: "absolute",
                  left: n.side === "right" ? n.p[0] + R + 40 : undefined,
                  right: n.side === "left" ? 1080 - (n.p[0] - R - 40) : undefined,
                  top: n.p[1] - 40,
                  fontFamily: FONT.display,
                  fontWeight: 600,
                  fontSize: 72,
                  lineHeight: 1,
                  letterSpacing: "-0.035em",
                  color: NEON.text,
                  whiteSpace: "nowrap",
                  transformOrigin: n.side === "right" ? "0% 50%" : "100% 50%",
                  scale: `${lerp(1.2, 1, clamp(springAt(a, { stiffness: 260, damping: 14 })))}`,
                  filter: `blur(${(1 - clamp(a / 9)) * 14 + out * 12}px)`,
                  opacity: clamp(a / 4) * (1 - out),
                  textShadow: `0 0 ${36 * (1 - clamp(a / 30))}px ${NEON.orbs[i]}`,
                }}
              >
                {TEXT.forWho[i]}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </Camera>
  );
};
