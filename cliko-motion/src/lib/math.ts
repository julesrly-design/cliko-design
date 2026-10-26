// Outils numériques purs (aucune dépendance React) : easings, ressorts, bruit déterministe.
import * as THREE from "three";

export type V3 = [number, number, number];

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const remap = (x: number, a: number, b: number, c: number, d: number) => lerp(c, d, invLerp(a, b, x));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = invLerp(a, b, x);
  return t * t * (3 - 2 * t);
};

// ── Easings ─────────────────────────────────────────────────────────────────
export type Ease = (t: number) => number;
export const linear: Ease = (t) => t;
export const expoIn: Ease = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
export const expoOut: Ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const expoInOut: Ease = (t) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
export const cubicInOut: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const cubicOut: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const quartOut: Ease = (t) => 1 - Math.pow(1 - t, 4);
export const sineInOut: Ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
// Accélération brutale, freinage net, avec une vitesse de croisière au milieu
// (plus « balle » qu'expoInOut, qui stagne aux extrémités).
// Profil de vitesse : montée quadratique (18 %), croisière, freinage en 30 %. Intégré une fois en table.
const makeProfile = (a: number, b: number) => {
  const N = 1024;
  const v = (x: number) => (x < a ? Math.pow(x / a, 2) : x > 1 - b ? Math.pow((1 - x) / b, 1.6) : 1);
  const lut = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) lut[i] = lut[i - 1] + v((i - 0.5) / N);
  for (let i = 0; i <= N; i++) lut[i] /= lut[N];
  return (t: number) => {
    const x = clamp(t) * N;
    const i = Math.min(N - 1, Math.floor(x));
    return lerp(lut[i], lut[i + 1], x - i);
  };
};
export const shot: Ease = makeProfile(0.18, 0.3);
// Variante : départ en flèche, long freinage (arrivée sur une info).
export const shotBrake: Ease = makeProfile(0.08, 0.55);
// Variante : longue accélération, arrivée sèche (départ depuis une info).
export const shotLaunch: Ease = makeProfile(0.45, 0.12);
// Overshoot léger (micro-dépassement sur chaque apparition).
export const backOut =
  (s = 1.4): Ease =>
  (t) => {
    const c3 = s + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  };

// Ressort critique-amorti analytique (déterministe, sans état) : 0 → 1 avec léger rebond.
// damping < 1 = rebond. Utilisé pour les « springs rebondis ».
export const springAt = (frames: number, { stiffness = 170, damping = 14, mass = 1, fps = 60 } = {}) => {
  if (frames <= 0) return 0;
  const t = frames / fps;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
};

// ── Bruit / hasard déterministes ────────────────────────────────────────────
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};
export const hash2 = (a: number, b: number) => hash(a * 157.31 + b * 9.173);
export const mulberry = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
// Bruit 1D lisse (valeur interpolée), pour les tremblements et oscillations.
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 101.3), hash(i + 1 + seed * 101.3), u) * 2 - 1;
};

// ── Vecteurs ────────────────────────────────────────────────────────────────
export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const toV = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);
export const fromV = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
export const addV = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const lerpV = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const scaleV = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
