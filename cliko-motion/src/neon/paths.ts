// Construction de tracés SVG toujours lisses (Catmull-Rom → Bézier), rectangles arrondis,
// boucles elliptiques, et « pistes » : un fil unique dessiné segment par segment dans le temps.
import { getLength, getPointAtLength } from "@remotion/paths";
import { clamp } from "../lib/math";
import { EASE } from "./theme";

export type P = [number, number];
const f2 = (n: number) => n.toFixed(2);

// Courbe lisse passant par tous les points (sans le M initial : le 1er point est le départ).
export const through = (pts: P[], tension = 1): string => {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: P = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: P = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += ` C ${f2(c1[0])} ${f2(c1[1])} ${f2(c2[0])} ${f2(c2[1])} ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return d;
};

const K = 0.5523; // quart de cercle en Bézier

// Rectangle arrondi parcouru dans le sens horaire depuis le milieu du bord gauche (sans M).
export const roundRectFromLeft = (x: number, y: number, w: number, h: number, r: number, loops = 1, cw = true): string => {
  const k = r * K;
  const top = ` L ${x} ${y + r} C ${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y} L ${x + w - r} ${y} C ${x + w - r + k} ${y} ${x + w} ${y + r - k} ${x + w} ${y + r}`;
  const bottom = ` L ${x + w} ${y + h - r} C ${x + w} ${y + h - r + k} ${x + w - r + k} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} C ${x + r - k} ${y + h} ${x} ${y + h - r + k} ${x} ${y + h - r} L ${x} ${y + h / 2}`;
  const one = cw ? top + bottom : reverseRect(x, y, w, h, r);
  return one.repeat(loops);
};
const reverseRect = (x: number, y: number, w: number, h: number, r: number) => {
  const k = r * K;
  return ` L ${x} ${y + h - r} C ${x} ${y + h - r + k} ${x + r - k} ${y + h} ${x + r} ${y + h} L ${x + w - r} ${y + h} C ${x + w - r + k} ${y + h} ${x + w} ${y + h - r + k} ${x + w} ${y + h - r} L ${x + w} ${y + r} C ${x + w} ${y + r - k} ${x + w - r + k} ${y} ${x + w - r} ${y} L ${x + r} ${y} C ${x + r - k} ${y} ${x} ${y + r - k} ${x} ${y + r} L ${x} ${y + h / 2}`;
};

// Boucle (lasso) elliptique autour d'un centre, départ à l'angle a0 (radians, 0 = droite), sens horaire écran.
export const ellipseLoop = (cx: number, cy: number, rx: number, ry: number, a0: number, turns = 1.08, steps = 40): string => {
  const pts: P[] = [];
  const n = Math.round(steps * turns);
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / steps) * Math.PI * 2;
    // légère spirale : la boucle ne se referme pas exactement sur elle-même, c'est plus vivant
    const g = 1 + 0.06 * (i / n);
    pts.push([cx + Math.cos(a) * rx * g, cy + Math.sin(a) * ry * g]);
  }
  return through(pts);
};

export const ellipsePoint = (cx: number, cy: number, rx: number, ry: number, a: number): P => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];

// ── Piste : un fil continu, chaque segment ayant sa fenêtre de temps (frames locales) ──
export type Seg = { d: string; f0: number; f1: number; ease?: (t: number) => number };
export type Track = { d: string; total: number; segs: { len: number; start: number; f0: number; f1: number; ease: (t: number) => number }[] };

export const makeTrack = (start: P, segs: Seg[]): Track => {
  let d = `M ${f2(start[0])} ${f2(start[1])}`;
  let acc = 0;
  const out: Track["segs"] = [];
  let cur = d;
  for (const s of segs) {
    const prevLen = acc;
    cur += s.d;
    const total = getLength(cur);
    out.push({ len: total - prevLen, start: prevLen, f0: s.f0, f1: s.f1, ease: s.ease ?? EASE.inOut });
    acc = total;
  }
  d = cur;
  return { d, total: acc, segs: out };
};

// Longueur dessinée à la frame f.
export const drawnAt = (t: Track, f: number) => {
  let len = 0;
  for (const s of t.segs) {
    if (f >= s.f1) len = s.start + s.len;
    else if (f > s.f0) {
      len = s.start + s.len * s.ease(clamp((f - s.f0) / (s.f1 - s.f0)));
      break;
    } else break;
  }
  return len;
};

export const pointOn = (d: string, len: number): P => {
  const p = getPointAtLength(d, Math.max(0, len));
  return p ? [p.x, p.y] : [0, 0];
};
