import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { getLength } from "@remotion/paths";
import { B, FONT } from "../../brand";
import { EXPO, Ribbon, ramp } from "../kit";
import { M } from "../timeline";
import { LINES, Line, wordAt } from "../copy";

const L = M.light;
const PAPER = "radial-gradient(85% 60% at 50% 46%, #fdfcf9 0%, #f3f0ea 42%, #d9d4cb 78%, #bdb7ad 100%)";

// Rubans : un segment ambré file le long de chaque courbe au moment des transitions.
const RIBBONS = [
  { d: "M -260 1480 C 160 1760, 520 760, 1340 1080", at: L.from - 1, dur: 30 },
  { d: "M -200 760 C 240 330, 860 360, 1300 820", at: L.l2 - 8, dur: 30 },
  { d: "M 1320 1460 C 820 1080, 300 1760, -260 1240", at: L.l3 - 8, dur: 30 },
  { d: "M -240 1180 C 300 760, 760 1420, 1340 640", at: L.l4 - 6, dur: 32 },
].map((r) => ({ ...r, len: getLength(r.d) }));

const Word: React.FC<{ text: string; at: number; accent: boolean }> = ({ text, at, accent }) => {
  const f = useCurrentFrame();
  const p = EXPO.out(ramp(f, at, at + 12, (t) => t));
  const mark = EXPO.out(ramp(f, at + 5, at + 16, (t) => t));
  return (
    <span style={{ position: "relative", display: "inline-block", margin: "0 0.11em", opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * 0.5}em) scale(${0.9 + 0.1 * p})`, filter: `blur(${(1 - p) * 10}px)` }}>
      {accent && (
        <span style={{
          position: "absolute", left: "-0.08em", right: "-0.1em", top: "0.1em", bottom: "0.02em", borderRadius: "0.12em",
          background: `linear-gradient(100deg, ${B.accentBright}, ${B.accent} 55%, ${B.accentDeep})`,
          transform: `scaleX(${mark}) rotate(-1.2deg)`, transformOrigin: "0% 50%", boxShadow: "0 14px 30px -12px rgba(200,120,30,.6)",
        }} />
      )}
      <span style={{ position: "relative" }}>{text}</span>
    </span>
  );
};

const LineBlock: React.FC<{ line: Line }> = ({ line }) => {
  const f = useCurrentFrame();
  if (f < line.at - 1 || f > line.next + 6) return null;
  const settle = EXPO.out(ramp(f, line.at, line.at + 18, (t) => t));
  const e = ramp(f, line.next - 7, line.next + 4, EXPO.in);
  const push = 1 + ramp(f, line.at, line.next, (t) => t) * 0.05;
  let j = 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1100 }}>
      <div style={{
        fontFamily: FONT.display, fontWeight: 800, fontSize: line.size, letterSpacing: "-0.04em", lineHeight: 1.08, color: B.night, textAlign: "center",
        transform: [
          `translateY(${(1 - settle) * 90 - 60}px)`,
          `rotateX(${(1 - settle) * 28 - e * 62}deg) rotateZ(${(1 - settle) * 3 * line.dir - e * 16 * line.dir}deg)`,
          `translate(${-e * 320 * line.dir}px, ${e * 700}px) scale(${push * (1 + e * 0.9)})`,
        ].join(" "),
        filter: `blur(${e * 22}px)`, opacity: 1 - e * e,
      }}>
        {line.rows.map((row, ri) => (
          <div key={ri} style={{ whiteSpace: "nowrap" }}>
            {row.map((w) => {
              const at = wordAt(line, j++);
              return <Word key={w} text={w} at={at} accent={w === line.accent} />;
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// « Directement. » devient une pilule ambre, puis deux autres pilules se rabattent par-dessus.
export const PILLS = [
  { t: "Directement.", at: L.pill },
  { t: "Réponse en 24 h", at: L.stack1 },
  { t: "Devis gratuit", at: L.stack2 },
];
export const PILL_FONT = 62;

const PillStack: React.FC = () => {
  const f = useCurrentFrame();
  if (f < L.l4 - 1) return null;
  const wordIn = EXPO.out(ramp(f, L.l4, L.l4 + 12, (t) => t));
  const morph = ramp(f, L.pill, L.pill + 10, EXPO.out);
  return (
    <AbsoluteFill style={{ perspective: 1200 }}>
      {PILLS.map((p, k) => {
        const depth = PILLS.reduce((s, q, j) => s + (j > k ? EXPO.out(ramp(f, q.at, q.at + 10, (t) => t)) : 0), 0);
        const flapIn = k === 0 ? 1 : EXPO.out(ramp(f, p.at, p.at + 9, (t) => t));
        if (k > 0 && f < p.at) return null;
        const m = k === 0 ? morph : 1;
        const fall = k < PILLS.length - 1 ? ramp(f, M.brand.from - 2, M.brand.from + 8, EXPO.in) : 0;
        const size = k === 0 ? interpolate(m, [0, 1], [132, PILL_FONT]) : PILL_FONT;
        const bgA = m;
        return (
          <div key={p.t} style={{
            position: "absolute", left: 0, right: 0, top: 960 - 70, display: "flex", justifyContent: "center", zIndex: k,
            transform: `translateY(${-depth * 112}px) scale(${1 - depth * 0.08})`,
            filter: `brightness(${1 - depth * 0.1}) blur(${(k === 0 ? (1 - wordIn) * 10 : 0) + fall * 16}px)`,
            opacity: (k === 0 ? Math.min(1, wordIn * 1.4) : 1) * (1 - fall),
            marginTop: fall * -260,
          }}>
            <div style={{
              transform: k === 0 ? `translateY(${(1 - wordIn) * 60}px) scale(${0.9 + 0.1 * wordIn})` : `rotateX(${(1 - flapIn) * 100}deg)`,
              transformOrigin: "50% 0%",
              display: "flex", alignItems: "center", height: 140, padding: `0 ${m * 62}px`, borderRadius: 70,
              background: `linear-gradient(180deg, rgba(255,212,143,${bgA}), rgba(255,196,107,${bgA}) 55%, rgba(240,169,72,${bgA}))`,
              boxShadow: `0 ${30 * m}px ${60 * m}px -24px rgba(190,110,20,${0.7 * m}), inset 0 2px 0 rgba(255,255,255,${0.55 * m})`,
              fontFamily: FONT.display, fontWeight: k === 0 ? interpolate(m, [0, 1], [800, 700]) : 700, fontSize: size,
              letterSpacing: k === 0 ? `${interpolate(m, [0, 1], [-0.04, -0.015])}em` : "-0.015em", color: B.night, whiteSpace: "nowrap",
            }}>
              {p.t}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Light: React.FC = () => {
  const f = useCurrentFrame();
  // impulsion de caméra à la coupe
  const kick = 1 + 0.06 * (1 - EXPO.out(ramp(f, L.from, L.from + 14, (t) => t)));
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <AbsoluteFill style={{ transform: `scale(${kick})` }}>
        {RIBBONS.map((r, i) => <Ribbon key={i} d={r.d} len={r.len} p={ramp(f, r.at, r.at + r.dur, (t) => t)} />)}
        {LINES.map((l, i) => <LineBlock key={i} line={l} />)}
        <PillStack />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
