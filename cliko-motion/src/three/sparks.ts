// Étincelles déterministes : elles naissent dans les virages serrés de la tête (calculés à partir
// de sa trajectoire) et lors d'« explosions » explicites (impact, soulignement du prix, logo).
import { LINE } from "../config";
import { headAt, headVelocity } from "../lib/track";
import { hash2, type V3 } from "../lib/math";

type Burst = { f: number; p: V3 | (() => V3); count: number; speed: number; life: number; seed: number; up?: number };
const bursts: Burst[] = [];
export const registerBurst = (f: number, p: V3 | (() => V3), count = 60, speed = 0.18, life = 34, up = 0) => {
  bursts.push({ f, p, count, speed, life, seed: bursts.length * 17 + 3, up });
};

export type Spark = { p: V3; prev: V3; w: number; i: number; heat: number };

const GRAVITY = 0.0016;
const DRAG = 0.08;

const sparkPos = (p0: V3, v: V3, t: number, up = 0): V3 => {
  // intégration analytique : vitesse freinée exponentiellement + gravité
  const k = (1 - Math.exp(-DRAG * t)) / DRAG;
  return [p0[0] + v[0] * k, p0[1] + v[1] * k - GRAVITY * t * t * (1 - up), p0[2] + v[2] * k];
};

const randDir = (a: number, b: number, c: number): V3 => {
  const u = hash2(a, b) * 2 - 1;
  const th = hash2(b, c) * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(th), u, r * Math.sin(th)];
};

// Intensité de virage à la frame g : changement de direction × vitesse.
const turnAt = (g: number) => {
  const v1 = headVelocity(g - 0.5, 0.5);
  const v2 = headVelocity(g + 0.5, 0.5);
  const s1 = Math.hypot(...v1);
  const s2 = Math.hypot(...v2);
  if (s1 < 0.02 || s2 < 0.02) return { k: 0, v1, v2, s: 0 };
  const dot = (v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]) / (s1 * s2);
  const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
  return { k: ang * Math.min(s1, s2) * 4, v1, v2, s: (s1 + s2) / 2 };
};

const turnCache = new Map<number, ReturnType<typeof turnAt>>();
const turnCached = (g: number) => {
  let t = turnCache.get(g);
  if (!t) {
    t = turnAt(g);
    if (turnCache.size > 5000) turnCache.clear();
    turnCache.set(g, t);
  }
  return t;
};

export const sparksAt = (frame: number): Spark[] => {
  const out: Spark[] = [];
  const LIFE = 30;
  // 1) virages serrés
  for (let g = Math.floor(frame - LIFE); g <= frame; g++) {
    const t = turnCached(g);
    if (t.k < LINE.sparkThreshold) continue;
    const count = Math.min(4, Math.floor((t.k / LINE.sparkThreshold) * 1.5));
    const p0 = headAt(g);
    // direction : vers l'extérieur du virage, dans le sens de la course
    const out1: V3 = [t.v1[0] - (t.v2[0] - t.v1[0]) * 2, t.v1[1] - (t.v2[1] - t.v1[1]) * 2, t.v1[2] - (t.v2[2] - t.v1[2]) * 2];
    const n1 = Math.hypot(...out1) || 1;
    for (let i = 0; i < count; i++) {
      const life = LIFE * (0.45 + 0.55 * hash2(g, i + 0.5));
      const age = frame - g;
      if (age < 0 || age > life) continue;
      const rd = randDir(g, i, 3.1);
      const sp = t.s * (0.25 + 0.45 * hash2(i, g + 9));
      const v: V3 = [(out1[0] / n1 + rd[0] * 0.7) * sp, (out1[1] / n1 + rd[1] * 0.7) * sp, (out1[2] / n1 + rd[2] * 0.7) * sp];
      const life01 = age / life;
      out.push({
        p: sparkPos(p0, v, age),
        prev: sparkPos(p0, v, Math.max(0, age - 1.6)),
        w: 0.011 * (1 - life01 * 0.6),
        i: 7 * Math.pow(1 - life01, 1.6),
        heat: 1 - life01,
      });
    }
  }
  // 2) explosions explicites
  for (const b of bursts) {
    const age = frame - b.f;
    if (age < 0 || age > b.life) continue;
    const p0 = typeof b.p === "function" ? b.p() : b.p;
    for (let i = 0; i < b.count; i++) {
      const life = b.life * (0.4 + 0.6 * hash2(b.seed, i));
      if (age > life) continue;
      const rd = randDir(b.seed, i, 7.7);
      const sp = b.speed * (0.3 + 0.9 * hash2(i, b.seed + 1));
      const v: V3 = [rd[0] * sp, (rd[1] + (b.up ?? 0)) * sp, rd[2] * sp * 0.6];
      const life01 = age / life;
      out.push({
        p: sparkPos(p0, v, age, b.up),
        prev: sparkPos(p0, v, Math.max(0, age - 1.8), b.up),
        w: 0.012 * (1 - life01 * 0.5),
        i: 8 * Math.pow(1 - life01, 1.4),
        heat: 1 - life01,
      });
    }
  }
  return out;
};
