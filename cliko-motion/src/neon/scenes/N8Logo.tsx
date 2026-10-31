// SCÈNE 8 · LOGO + CTA (0:26 → 0:30)
// Quatre fils convergent au centre en accélérant : flash, onde de choc, étincelles. Le fil écrit
// ensuite le logo Cliko (le vrai tracé de cliko.be) et se loge dans le « o » interrupteur : il en
// devient le bouton allumé. « cliko.be », « Lien en bio ». La dernière image est la première.
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp, lerp, springAt } from "../../lib/math";
import { EASE, FONT, LOGO, LOGO_POS, logoPx, NEON, TEXT } from "../theme";
import { drawnAt, makeTrack, pointOn, through, type P, type Seg } from "../paths";
import { Haze, Head, Shock, Sparks, Svg, Wire } from "../Neon";
import { Logo } from "../UI";

export const N8_PRE = 14;
export const N8_DUR = 240;
const C: P = [LOGO_POS.cx, LOGO_POS.cy];
const CONVERGE = 60;
const DRAW = [66, 104] as const;
const KNOB = 106;
const URL_T = 120;
const CTA_T = 150;
const OUT = 214;

const L = (x: number, y: number): P => logoPx(x, y);
const arcPts = (cx: number, cy: number, r: number, a0: number, a1: number, n = 24): P[] => Array.from({ length: n + 1 }, (_, i) => L(cx + r * Math.cos(a0 + ((a1 - a0) * i) / n), cy + r * Math.sin(a0 + ((a1 - a0) * i) / n)));
const C_ANG = Math.atan2(68.57 - 96, 82.47 - 52);

// Tracé d'écriture du logo, trait par trait (avec de petits sauts entre les lettres).
type Part = { id: string; pts: P[]; dur: number };
const PARTS: Part[] = [
  { id: "c", pts: arcPts(52, 96, 41, C_ANG, C_ANG - (2 * Math.PI - 2 * Math.abs(C_ANG)), 30), dur: 8 },
  { id: "hop", pts: [L(82, 124), L(110, 40), L(123, 11)], dur: 2 },
  { id: "l", pts: [L(123, 11), L(123, 135)], dur: 4 },
  { id: "hop", pts: [L(123, 135), L(160, 110), L(179, 57)], dur: 2 },
  { id: "i", pts: [L(179, 57), L(179, 135)], dur: 3 },
  { id: "hop", pts: [L(179, 135), L(200, 70), L(179, 24)], dur: 2 },
  { id: "dot", pts: arcPts(179, 16, 8, Math.PI / 2, Math.PI / 2 + Math.PI * 2, 14), dur: 2 },
  { id: "hop", pts: [L(179, 24), L(210, 20), L(235, 11)], dur: 2 },
  { id: "k1", pts: [L(235, 11), L(235, 135)], dur: 3 },
  { id: "hop", pts: [L(235, 135), L(232, 118), L(235, 112)], dur: 1 },
  { id: "k2", pts: [L(235, 112), L(289, 57)], dur: 3 },
  { id: "hop", pts: [L(289, 57), L(262, 80), L(253, 93.67)], dur: 1 },
  { id: "k3", pts: [L(253, 93.67), L(293, 135)], dur: 3 },
  { id: "hop", pts: [L(293, 135), L(340, 150), L(380, 96)], dur: 2 },
  { id: "hole", pts: arcPts(LOGO.hole.cx, LOGO.hole.cy, LOGO.hole.r + 7, Math.PI, Math.PI * 3, 32), dur: 6 },
];

const buildDraw = () => {
  const segs: Seg[] = [];
  const windows: Record<string, [number, number]> = {};
  let f: number = DRAW[0];
  const totalDur = PARTS.reduce((a, p) => a + p.dur, 0);
  const k = (DRAW[1] - DRAW[0]) / totalDur;
  for (const p of PARTS) {
    const f1 = f + p.dur * k;
    segs.push({ d: through(p.pts), f0: f, f1, ease: (x) => x });
    if (p.id !== "hop") windows[p.id] = [f, f1];
    f = f1;
  }
  // se pose au centre du trou de l'interrupteur
  const last = PARTS[PARTS.length - 1].pts;
  segs.push({ d: through([last[last.length - 1], L(LOGO.hole.cx - 20, LOGO.hole.cy + 10), L(LOGO.hole.cx, LOGO.hole.cy)]), f0: DRAW[1], f1: KNOB, ease: EASE.out });
  return { track: makeTrack(PARTS[0].pts[0], segs), windows };
};

const CONV: P[][] = [
  [[-140, 260], [300, 380], [760, 560], [700, 760]],
  [[1220, 520], [900, 760], [640, 1080], [430, 980]],
  [[1220, 1560], [820, 1320], [380, 1100], [400, 860]],
  [[-140, 1640], [200, 1300], [560, 1240], [700, 1000]],
];

export const N8Logo: React.FC = () => {
  const lf = useCurrentFrame() - N8_PRE;
  const draw = useMemo(buildDraw, []);
  // accélération continue (t^1,7) : visibles dès l'entrée, de plus en plus rapides
  const conv = useMemo(() => CONV.map((pts) => makeTrack(pts[0], [{ d: through([...pts, C]), f0: -12, f1: CONVERGE, ease: (x) => Math.pow(x, 1.7) }])), []);
  // trait par trait : progression d'apparition dans le logo vectoriel
  const sp = (id: string) => {
    const w = draw.windows[id];
    return w ? clamp((lf - w[0]) / (w[1] - w[0])) : 0;
  };
  const hot = 1 - clamp((lf - DRAW[1]) / 20);
  const toggle = EASE.out(clamp((lf - DRAW[1] + 2) / 8));
  const knobOn = lf >= KNOB;
  const loopLf = lf - N8_DUR; // ≡ frame locale de la scène 1 (bouclage)
  const breathe = 1 + 0.05 * Math.sin(loopLf * 0.12);
  const knob = logoPx(LOGO.hole.cx, LOGO.hole.cy);
  const textOut = EASE.in(clamp((lf - OUT) / 14));
  const urlP = EASE.out(clamp((lf - URL_T) / 16));
  const cta = springAt(lf - CTA_T, { stiffness: 220, damping: 13 });
  const flash = lf >= CONVERGE - 1 ? Math.exp(-(lf - CONVERGE + 1) / 3) : 0;
  const drawHead = pointOn(draw.track.d, drawnAt(draw.track, lf));
  const hazeAt = lf < CONVERGE ? C : knobOn ? knob : drawHead;
  // le tracé d'écriture s'efface une fois le logo écrit (il ne reste que le logo net)
  const writeFade = 1 - clamp((lf - DRAW[1] - 2) / 16);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Haze at={hazeAt} k={knobOn ? 1.3 : 1.1} />
      <Svg>
        {conv.map((t, i) => (
          <Wire key={i} track={t} frame={lf} fade={1 - clamp((lf - CONVERGE) / 10)} />
        ))}
        <Shock at={C} age={lf - CONVERGE} life={46} maxR={1100} />
        <Sparks at={C} age={lf - CONVERGE} count={70} speed={22} seed={31} life={40} />
      </Svg>
      {lf >= DRAW[0] && (
        <Logo
          strokes={{ c: sp("c"), l: sp("l"), i: sp("i"), dot: sp("dot"), k1: sp("k1"), k2: sp("k2"), k3: sp("k3") }}
          toggle={toggle}
          hot={hot}
          glow={knobOn ? 1 + 0.2 * Math.sin(loopLf * 0.12) : 1}
        />
      )}
      <Svg>
        <Wire track={draw.track} frame={lf} fade={writeFade} head={!knobOn} tail={160} />
        {knobOn && <Head at={knob} size={2.1 * breathe * (1 + 0.5 * Math.exp(-(lf - KNOB) / 6))} intensity={1.3} />}
      </Svg>
      {/* URL */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1012, textAlign: "center", overflow: "hidden", height: 104, opacity: 1 - textOut }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 78, letterSpacing: "-0.03em", color: NEON.text, lineHeight: "100px", translate: `0 ${(1 - urlP) * 100}%`, filter: `blur(${(1 - urlP) * 8 + textOut * 12}px)` }}>
          {TEXT.logo.url}
        </div>
      </div>
      {/* CTA */}
      {lf >= CTA_T && (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 1150, display: "flex", justifyContent: "center", opacity: clamp((lf - CTA_T) / 5) * (1 - textOut), filter: textOut ? `blur(${textOut * 12}px)` : undefined }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              padding: "26px 50px",
              borderRadius: 999,
              scale: `${lerp(0.7, 1, Math.min(1.12, cta))}`,
              background: `linear-gradient(180deg, ${NEON.amberHot} 0%, ${NEON.amber} 55%, ${NEON.amberDeep} 100%)`,
              color: "#0B1020",
              fontFamily: FONT.body,
              fontWeight: 600,
              fontSize: 48,
              boxShadow: "0 0 70px rgba(255,196,107,.5), inset 0 1px 0 rgba(255,255,255,.5)",
            }}
          >
            {TEXT.logo.cta}
            <span style={{ translate: `0 ${-4 * Math.abs(Math.sin((lf - CTA_T) / 9))}px`, display: "inline-flex" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0B1020" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </span>
          </div>
        </div>
      )}
      {/* flash blanc à la convergence */}
      {flash > 0.01 && <div style={{ position: "absolute", inset: -200, background: "#FFF6E6", opacity: Math.min(0.85, flash * 0.9) }} />}
    </div>
  );
};
