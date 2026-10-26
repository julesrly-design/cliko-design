// Texte « écrit par la lumière » : chaque lettre voit d'abord son contour se dessiner (trait lumineux)
// au passage de la tête, puis se remplit de blanc. Les contours viennent d'opentype.js.
import React from "react";
import { PALETTE } from "../config";
import type { TextLine } from "../lib/fonts";
import { clamp, cubicOut, type V3 } from "../lib/math";
import { headAt } from "../lib/track";
import { localToPx, toLocal } from "../lib/world";
import type { SceneId } from "../config";

export type PlacedLine = { line: TextLine; x: number; baseline: number; accent?: [number, number] }; // accent : plage de glyphes

// Frame à laquelle la tête passe au plus près de chaque glyphe, ligne par ligne
// (windows[i] = fenêtre de temps où la tête écrit la ligne i).
export const passTimes = (id: SceneId, lines: PlacedLine[], windows: [number, number][]) =>
  lines.map((pl, li) => {
    const [f0, f1] = windows[li];
    const samples: { f: number; x: number; y: number }[] = [];
    for (let f = f0; f <= f1; f += 0.25) {
      const [x, y] = localToPx(toLocal(id, headAt(f) as V3));
      samples.push({ f, x, y });
    }
    return pl.line.glyphs.map((g) => {
      const cx = pl.x + (g.x0 + g.x1) / 2;
      const cy = pl.baseline - pl.line.capHeight / 2;
      let best = Infinity;
      let bf = f0;
      for (const s of samples) {
        const d = (s.x - cx) ** 2 + ((s.y - cy) * 0.6) ** 2;
        if (d < best) {
          best = d;
          bf = s.f;
        }
      }
      return bf;
    });
  });

export const TracedText: React.FC<{
  frame: number; // frame globale
  lines: PlacedLine[];
  times: number[][];
  strokeFrames?: number;
  fillDelay?: number;
  fillFrames?: number;
  exit?: number; // 0..1, sortie
}> = ({ frame, lines, times, strokeFrames = 9, fillDelay = 3, fillFrames = 12, exit = 0 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <defs>
      <filter id="tt-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="tt-accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={PALETTE.accentFrom} />
        <stop offset="1" stopColor={PALETTE.accentTo} />
      </linearGradient>
    </defs>
    {lines.map((pl, li) => (
      <g key={li} transform={`translate(${pl.x} ${pl.baseline})`}>
        {pl.line.glyphs.map((g, gi) => {
          if (g.empty) return null;
          const t = times[li][gi];
          const s = clamp((frame - t + 2) / strokeFrames);
          if (s <= 0) return null;
          const fill = cubicOut(clamp((frame - t - fillDelay) / fillFrames));
          const strokeFade = 1 - clamp((frame - t - fillDelay - fillFrames) / 16);
          const accent = pl.accent && gi >= pl.accent[0] && gi < pl.accent[1];
          return (
            <g key={gi} opacity={1 - exit}>
              <path
                d={g.d}
                fill="none"
                stroke={accent ? PALETTE.accentFrom : "#FFF3DE"}
                strokeWidth={2.6}
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - cubicOut(s)}
                opacity={0.25 + 0.75 * strokeFade}
                filter="url(#tt-glow)"
              />
              <path d={g.d} fill={accent ? "url(#tt-accent)" : PALETTE.text} opacity={fill} />
            </g>
          );
        })}
      </g>
    ))}
  </svg>
);
