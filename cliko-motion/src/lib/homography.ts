// Homographie plan → écran, convertie en matrix3d CSS.
// Les textes restent en HTML/SVG (vectoriels, parfaitement nets) tout en étant « posés » sur
// des plans 3D : quand la caméra bouge, tremble ou pivote, le texte suit la scène exactement.
import type { V3 } from "./math";
import { projectPx } from "./camera";

type P2 = [number, number];

// Résout la projection qui envoie (0,0),(w,0),(w,h),(0,h) sur les 4 points p.
const solve = (w: number, h: number, p: P2[]) => {
  // homographie carré unité → quad (Heckbert)
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const hh = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const c = x0;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  const f = y0;
  // composée avec la mise à l'échelle (w,h) → unité
  return [a / w, b / h, c, d / w, e / h, f, g / w, hh / h, 1];
};

export const matrix3d = (w: number, h: number, quad: P2[]) => {
  const [a, b, c, d, e, f, g, hh, i] = solve(w, h, quad);
  // CSS matrix3d est en colonnes
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${hh},0,0,1,0,${c},${f},0,${i})`;
};

// Plan 3D décrit par son coin haut-gauche et ses deux axes (monde), de taille w×h px côté contenu.
// Renvoie null si le plan passe derrière la caméra.
export const planeTransform = (frame: number, corners: [V3, V3, V3, V3], w: number, h: number) => {
  const pts = corners.map((c) => projectPx(frame, c));
  if (pts.some((p) => p.w <= 0.05)) return null;
  return { transform: matrix3d(w, h, pts.map((p) => [p.x, p.y] as P2)), depth: Math.min(...pts.map((p) => p.w)) };
};
