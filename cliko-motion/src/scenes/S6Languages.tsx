// SCÈNE 6 · MULTILINGUE (0:21 → 0:23,5)
// Afficheur à palettes (split-flap) : « FR · NL · EN » ; chaque langue claque sur un temps,
// frappée par la ligne qui tombe dessus (étincelles), puis « inclus » s'écrit en lumière.
import React, { useMemo } from "react";
import { PALETTE, SAFE, SCENES, TEXT } from "../config";
import { registerCamera, registerShake, registerTransition } from "../lib/camera";
import type { TrackBuilder } from "../lib/track";
import { clamp, cubicOut, expoInOut, expoOut, hash2, lerp, linear, shot, sineInOut, springAt } from "../lib/math";
import { pxToWorld, REF } from "../lib/world";
import { useGlobalFrame, useSceneFrame } from "../lib/seq";
import { SceneOverlay } from "../overlay/SceneOverlay";
import { TracedText, passTimes, wavePoints, type PlacedLine } from "../overlay/TracedText";
import { registerLineBoost } from "../three/Line";
import { registerBurst } from "../three/sparks";
import { CSS_FONT, fitSize, layoutLine } from "../lib/fonts";

const ID = "languages" as const;
const S = SCENES.languages;

// Disposition des palettes (px)
const TILE = { w: 118, h: 170, gap: 8, sep: 44 };
const GROUP_W = TILE.w * 2 + TILE.gap;
const BOARD_W = GROUP_W * 3 + TILE.sep * 2;
const BOARD = { x: (SAFE.left + 1080 - SAFE.right) / 2 - BOARD_W / 2, y: 770 };
const groupX = (g: number) => BOARD.x + g * (GROUP_W + TILE.sep);
// Atterrissage de chaque langue (frames locales) : un temps chacune.
const LAND = [30, 60, 90];
const INCLUS_T = [104, 122] as const;
const GLYPHS = "ABCDEFGHIJKLMNOPRSTUVWXYZ";

let layoutCache: PlacedLine[] | null = null;
const inclusLayout = () => {
  if (layoutCache) return layoutCache;
  const size = fitSize([TEXT.languages.suffix], 700, 124);
  const l = layoutLine(TEXT.languages.suffix, size);
  layoutCache = [{ line: l, x: (SAFE.left + 1080 - SAFE.right) / 2 - l.width / 2, baseline: BOARD.y + TILE.h + 40 + l.capHeight, accent: [0, l.glyphs.length] }];
  return layoutCache;
};

export const languagesLine = (T: TrackBuilder) => {
  const f = (lf: number) => S.start + lf;
  const P = (x: number, y: number, z = 0) => pxToWorld(ID, x, y, z);
  const mid = (g: number) => groupX(g) + GROUP_W / 2;
  // chaque langue : la tête monte au-dessus de la palette puis s'abat dessus pile sur le temps
  LAND.forEach((L, g) => {
    T.go(f(L - 7), [P(mid(g) - 40, BOARD.y - 120, 1.4), P(mid(g), BOARD.y - 60, 1.0)], g === 0 ? shot : sineInOut);
    T.go(f(L), [P(mid(g), BOARD.y + TILE.h * 0.5, 0.3)], (t) => t * t * t);
  });
  // « inclus » écrit en lumière
  const [pl] = inclusLayout();
  const first = pl.x + pl.line.glyphs[0].x0;
  const last = pl.x + pl.line.glyphs[pl.line.glyphs.length - 1].x1;
  T.go(f(INCLUS_T[0]), [P(mid(2) + 120, BOARD.y + TILE.h + 30, 1.2), P(first - 50, pl.baseline - pl.line.capHeight / 2, 0.4)], shot);
  const through = wavePoints(pl, P);
  T.go(f(INCLUS_T[1]), [...through, P(last + 30, pl.baseline - pl.line.capHeight / 2)], (t) => (linear(t) + sineInOut(t)) / 2);
  T.go(f(140), [P(last + 60, pl.baseline - 200, 0.8), P(400, BOARD.y - 140, 1.2)], sineInOut);
};

export const languagesSetup = () => {
  registerCamera(ID, (lf) => {
    const k = clamp(lf / 150);
    return { pos: [lerp(-0.6, 0.5, sineInOut(k)), lerp(0.4, -0.1, k), REF.distance + 0.4 - 0.9 * k], look: [0, 0, 0], roll: lerp(0.03, -0.015, k) };
  });
  registerTransition({ at: SCENES.offer.start, pre: 10, post: 22, ease: expoInOut, rollKick: 0.1 });
  LAND.forEach((L, g) => {
    registerShake(S.start + L, 0.007, 5);
    registerLineBoost(S.start + L - 3, S.start + L + 10, 2.0);
    registerBurst(S.start + L, pxToWorld(ID, groupX(g) + GROUP_W / 2, BOARD.y + TILE.h * 0.5, 0.3), 34, 0.09, 24, 0.4);
  });
};

// ── Palette (une lettre) ───────────────────────────────────────────────────
const FLIP = 4; // frames par battement de palette
const Half: React.FC<{ ch: string; top: boolean; style?: React.CSSProperties; shade?: number }> = ({ ch, top, style, shade = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      width: TILE.w,
      height: TILE.h / 2,
      top: top ? 0 : TILE.h / 2,
      overflow: "hidden",
      background: top ? "linear-gradient(180deg,#1d2448,#151b38)" : "linear-gradient(180deg,#121731,#0e1329)",
      borderRadius: top ? "14px 14px 0 0" : "0 0 14px 14px",
      backfaceVisibility: "hidden",
      ...style,
    }}
  >
    <div style={{ position: "absolute", left: 0, width: TILE.w, height: TILE.h, top: top ? 0 : -TILE.h / 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CSS_FONT.display, fontWeight: 600, fontSize: 124, color: PALETTE.text, letterSpacing: "-0.02em" }}>
      {ch}
    </div>
    {shade > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${shade})` }} />}
  </div>
);

const Tile: React.FC<{ target: string; lf: number; start: number; land: number; seed: number; x: number }> = ({ target, lf, start, land, seed, x }) => {
  const K = Math.max(1, Math.floor((land - start) / FLIP));
  const seq = useMemo(() => {
    const s = Array.from({ length: K }, (_, k) => GLYPHS[Math.floor(hash2(seed, k) * GLYPHS.length)]);
    s.push(target);
    return s; // seq[0] = affiché au départ, seq[K] = cible
  }, [K, seed, target]);
  const t0 = land - K * FLIP;
  const n = Math.floor((lf - t0) / FLIP); // nombre de battements commencés
  const visible = lf >= start - 6;
  if (!visible) return null;
  const cur = seq[Math.max(0, Math.min(K, n))];
  const next = seq[Math.max(0, Math.min(K, n + 1))];
  const flipping = n >= 0 && n < K;
  const p = flipping ? (lf - t0 - n * FLIP) / FLIP : 0;
  // claque à l'atterrissage : petit rebond vertical
  const a = lf - land;
  const slam = a >= 0 ? Math.exp(-a / 5) * Math.sin(a * 1.4) * 7 : 0;
  const glow = a >= 0 ? Math.exp(-a / 14) : 0;
  const appear = cubicOut(clamp((lf - start + 6) / 10));
  return (
    <div style={{ position: "absolute", left: x, top: BOARD.y + slam, width: TILE.w, height: TILE.h, perspective: 700, opacity: appear, transform: `translateY(${(1 - appear) * 30}px)` }}>
      <div style={{ position: "absolute", inset: -2, borderRadius: 16, boxShadow: `0 24px 50px -18px rgba(0,0,0,.9), 0 0 ${50 * glow}px rgba(255,196,107,${0.6 * glow})`, border: `1.5px solid rgba(185,196,240,${0.16 + glow * 0.4})` }} />
      {/* moitiés fixes */}
      <Half ch={flipping ? next : cur} top />
      <Half ch={cur} top={false} />
      {/* palette qui tombe : haut de la lettre courante, puis bas de la suivante */}
      {flipping && p < 0.5 && <Half ch={cur} top style={{ transformOrigin: "50% 100%", transform: `rotateX(${-180 * p}deg)` }} shade={p * 0.8} />}
      {flipping && p >= 0.5 && <Half ch={next} top={false} style={{ transformOrigin: "50% 0%", transform: `rotateX(${180 * (1 - p)}deg)` }} shade={(1 - p) * 0.8} />}
      {/* fente centrale */}
      <div style={{ position: "absolute", left: 0, right: 0, top: TILE.h / 2 - 1.5, height: 3, background: "#05060A" }} />
      {glow > 0.02 && <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: `linear-gradient(180deg, rgba(255,214,150,${0.18 * glow}), transparent 60%)` }} />}
    </div>
  );
};

let timesCache: number[][] | null = null;
export const LanguagesOverlay: React.FC = () => {
  const frame = useGlobalFrame();
  const lf = useSceneFrame();
  const lines = inclusLayout();
  const times = useMemo(() => (timesCache ??= passTimes(ID, lines, [[S.start + INCLUS_T[0] - 2, S.start + INCLUS_T[1] + 1]])), [lines]);
  const exit = clamp((lf - 140) / 9);
  const codes = TEXT.languages.codes;
  return (
    <SceneOverlay id={ID} style={{ opacity: 1 - exit, filter: exit > 0 ? `blur(${exit * 10}px)` : undefined }}>
      {codes.map((code, g) =>
        Array.from(code).map((ch, c) => (
          <Tile key={`${g}-${c}`} target={ch} lf={lf} start={4 + g * 5} land={LAND[g] - (1 - c) * 2} seed={g * 10 + c + 1} x={groupX(g) + c * (TILE.w + TILE.gap)} />
        )),
      )}
      {[0, 1].map((g) => {
        const on = expoOut(clamp((lf - LAND[g]) / 10));
        return (
          <div
            key={g}
            style={{
              position: "absolute",
              left: groupX(g) + GROUP_W + TILE.sep / 2 - 9,
              top: BOARD.y + TILE.h / 2 - 9,
              width: 18,
              height: 18,
              borderRadius: 9,
              background: PALETTE.accent,
              transform: `scale(${springAt(lf - LAND[g], { stiffness: 300, damping: 12 })})`,
              boxShadow: `0 0 ${20 + 30 * on}px rgba(255,196,107,.9)`,
            }}
          />
        );
      })}
      <TracedText frame={frame} lines={lines} times={times} />
    </SceneOverlay>
  );
};
