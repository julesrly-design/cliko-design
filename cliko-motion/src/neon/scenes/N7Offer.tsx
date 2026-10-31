// SCÈNE 7 · L'OFFRE (0:23,5 → 0:26)
// Façon « compteur de série » : l'interrupteur Cliko brille, le prix défile sur des rouleaux
// jusqu'à « Dès 750 € », le fil souligne le prix (étincelles), puis les pastilles de ce qui est
// compris s'allument une à une.
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp, expoOut, lerp, springAt } from "../../lib/math";
import { EASE, FONT, LOGO, NEON, TEXT } from "../theme";
import { drawnAt, ellipseLoop, makeTrack, pointOn, through } from "../paths";
import { Haze, Sparks, Svg, Wire } from "../Neon";
import { Camera, Words } from "../UI";
import { layoutLine } from "../../lib/fonts";

export const N7_PRE = 14;
const SIZE = 300;
const BASE = 1050; // ligne de base du prix
const CX = 500;
const DIGITS = String(TEXT.offer.price).split("");
const LANDS = DIGITS.map((_, i) => 60 - (DIGITS.length - 1 - i) * 7);
const UNDER = [62, 88] as const;
const BOOM = 90;
const CHIPS = [96, 104, 112];
const ICON = { cx: 520, cy: 560 };

const priceLayout = () => {
  const num = layoutLine(String(TEXT.offer.price), SIZE, { tracking: -0.04 });
  const euro = layoutLine(TEXT.offer.currency, SIZE * 0.55, { tracking: 0 });
  const gap = SIZE * 0.06;
  const width = num.width + gap + euro.width;
  return { num, euro, x0: CX - width / 2, euroX: CX - width / 2 + num.width + gap, width };
};

const Reel: React.FC<{ digit: number; lf: number; land: number; spins: number; w: number }> = ({ digit, lf, land, spins, w }) => {
  const total = spins * 10 + digit;
  const p = (f: number) => total * expoOut(clamp((f - 6) / (land - 6)));
  const pos = p(lf);
  const vel = Math.abs(p(lf + 1) - p(lf - 1)) / 2;
  const a = lf - land;
  const bounce = a >= 0 ? Math.exp(-a / 6) * Math.sin(a * 0.9) * 0.07 : 0;
  const h = SIZE;
  const base = Math.floor(pos);
  const frac = pos - base + bounce;
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, width: w, top: -frac * h - h, filter: vel > 0.05 ? `blur(${Math.min(14, vel * 16)}px)` : undefined }}>
        {[-1, 0, 1, 2].map((k) => (
          <div key={k} style={{ height: h, lineHeight: `${h}px`, textAlign: "center" }}>
            {(((base + k) % 10) + 10) % 10}
          </div>
        ))}
      </div>
    </div>
  );
};

export const N7Offer: React.FC = () => {
  const lf = useCurrentFrame() - N7_PRE;
  const L = useMemo(priceLayout, []);
  const uy = BASE + 40;
  const t = useMemo(
    () =>
      makeTrack([-160, 1500], [
        { d: through([[-160, 1500], [60, 1380], [200, 1180], [ICON.cx - 230, ICON.cy + 40]]), f0: 0, f1: 24, ease: EASE.out },
        // tour de l'interrupteur
        { d: ellipseLoop(ICON.cx, ICON.cy, 220, 150, Math.PI * 0.95, 1.02, 48), f0: 24, f1: 46, ease: EASE.inOut },
        // descend souligner le prix
        { d: through([[ICON.cx - 225, ICON.cy + 20], [L.x0 - 80, 900], [L.x0 - 30, uy + 6]]), f0: 46, f1: UNDER[0], ease: EASE.inOut },
        { d: through([[L.x0 - 30, uy + 6], [CX, uy + 2], [L.x0 + L.width + 20, uy]]), f0: UNDER[0], f1: UNDER[1], ease: EASE.inOut },
        // l'explosion la relance : elle passe sous les pastilles de gauche à droite, puis sort
        { d: through([[L.x0 + L.width + 20, uy], [L.x0 + L.width + 40, uy + 110], [500, 1300], [110, 1262]]), f0: BOOM, f1: CHIPS[0] - 4, ease: EASE.out },
        { d: through([[110, 1262], [500, 1264], [900, 1256]]), f0: CHIPS[0] - 4, f1: CHIPS[2] + 4, ease: (x) => x },
        { d: through([[900, 1256], [1080, 1150], [1320, 900]]), f0: 128, f1: 150, ease: EASE.in },
      ]),
    [L, uy],
  );
  const head = pointOn(t.d, drawnAt(t, lf));
  const out = EASE.in(clamp((lf - 140) / 10));
  const pre = EASE.out(clamp((lf - 2) / 12));
  const euro = springAt(lf - 60, { stiffness: 230, damping: 12 });
  const iconPulse = Math.max(Math.exp(-Math.abs(lf - 60) / 10), 0.4 + 0.15 * Math.sin(lf * 0.2));
  const digitW = L.num.width / DIGITS.length;
  return (
    <Camera
      frame={lf}
      keys={[
        { f: -14, y: 60, s: 0.9, rx: 10 },
        { f: 70, y: 0, s: 1, rx: 0 },
        { f: 160, y: -10, s: 1.06, rx: -4 },
      ]}
    >
      <Haze at={head} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - out, filter: out ? `blur(${out * 14}px)` : undefined }}>
        {/* l'interrupteur Cliko, en grand, comme une flamme */}
        <svg width={300} height={204} viewBox="318 40 166 112" style={{ position: "absolute", left: ICON.cx - 150, top: ICON.cy - 102, overflow: "visible", opacity: pre, scale: `${lerp(0.7, 1, pre)}` }}>
          <defs>
            <linearGradient id="offer-tog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={NEON.amberHot} />
              <stop offset="1" stopColor={NEON.amberDeep} />
            </linearGradient>
          </defs>
          <path d={LOGO.toggle} fill="url(#offer-tog)" fillRule="evenodd" style={{ filter: `drop-shadow(0 0 ${20 + 40 * iconPulse}px rgba(255,196,107,${0.5 + 0.4 * iconPulse}))` }} />
          <circle cx={LOGO.hole.cx} cy={LOGO.hole.cy} r={22} fill={NEON.core} opacity={0.6 + 0.4 * iconPulse} style={{ filter: "blur(6px)" }} />
        </svg>
        <div style={{ position: "absolute", left: L.x0 + 10, top: BASE - SIZE * 0.72 - 84, fontFamily: FONT.body, fontWeight: 600, fontSize: 58, color: NEON.mist, opacity: pre }}>{TEXT.offer.prefix}</div>
        <div
          style={{
            position: "absolute",
            left: L.x0,
            top: BASE - SIZE * 0.82,
            display: "flex",
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: SIZE,
            letterSpacing: "-0.04em",
            color: NEON.amberHot,
            // halo appliqué au bloc entier (hors des masques des rouleaux)
            filter: "drop-shadow(0 0 28px rgba(255,196,107,.55)) drop-shadow(0 0 80px rgba(255,170,80,.3))",
            opacity: pre,
          }}
        >
          {DIGITS.map((d, i) => (
            <Reel key={i} digit={Number(d)} lf={lf} land={LANDS[i]} spins={2 + i} w={digitW} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: L.euroX,
            top: BASE - SIZE * 0.55 * 0.82,
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: SIZE * 0.55,
            lineHeight: 1,
            color: NEON.amber,
            textShadow: "0 0 40px rgba(255,196,107,.7)",
            opacity: clamp(euro * 2),
            translate: `${(1 - euro) * 70}px 0`,
          }}
        >
          {TEXT.offer.currency}
        </div>
        {/* pastilles « compris » */}
        <div style={{ position: "absolute", left: 0, width: CX * 2, top: 1150, display: "flex", justifyContent: "center", gap: 16 }}>
          {TEXT.offer.included.map((c, i) => {
            const a = lf - CHIPS[i];
            const on = EASE.out(clamp((a + 2) / 8));
            const s = springAt(a, { stiffness: 320, damping: 12 });
            return (
              <div
                key={i}
                style={{
                  padding: "18px 28px",
                  borderRadius: 999,
                  fontFamily: FONT.body,
                  fontWeight: 600,
                  fontSize: 34,
                  letterSpacing: "-0.01em",
                  color: on > 0.5 ? "#0B1020" : "rgba(242,243,250,.5)",
                  background: on > 0 ? `rgba(255,196,107,${on})` : "rgba(255,255,255,.04)",
                  border: `2px solid rgba(255,196,107,${0.3 + 0.7 * on})`,
                  boxShadow: `0 0 ${36 * on}px rgba(255,196,107,${0.6 * on})`,
                  scale: `${a >= 0 && s > 1 ? 1 + (s - 1) * 0.3 : 1}`,
                  opacity: clamp((lf - 70) / 10),
                }}
              >
                {c}
              </div>
            );
          })}
        </div>
        <Words text={TEXT.offer.includedSuffix} at={118} size={76} x={0} y={1262} width={CX * 2} frame={lf} />
      </div>
      <Svg>
        <Wire track={t} frame={lf} />
        <Sparks at={[L.x0 + L.width + 20, uy]} age={lf - BOOM} count={40} speed={15} seed={21} life={34} />
      </Svg>
    </Camera>
  );
};
