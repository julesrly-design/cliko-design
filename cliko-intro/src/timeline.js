// Grille musicale commune à l'image et au son : tout est exprimé en temps (beats) à 110 BPM.
// 1 beat = 0,545 s · 1 mesure = 4 beats = 2,18 s.
export const BPM = 110;
export const BEAT = 60 / BPM;
export const bt = (beats) => beats * BEAT;

// Découpage en scènes (en beats)
export const S = {
  wait: [0, 8], // Scène 1 — L'attente
  here: [8, 24], // Scène 2 — L'annonce
  reveal: [24, 36], // Scène 3 — Le reveal Cliko
  create: [36, 52], // Scène 4 — Ce que nous créons
  sign: [52, 64], // Scène 5 — La signature
};
export const END_BEAT = 64; // dernier accord
export const VIDEO_END = bt(70); // fin du rendu vidéo (queue de réverbération incluse)
export const AUTO_EXIT = bt(78); // sortie automatique vers le site si personne ne clique

// Grille d'accords (1 par mesure) : Am9 · Fmaj7 · Cadd9 · G6
export const BARS = ["Am", "F", "Am", "F", "C", "G", "Am", "F", "G", "Am", "F", "C", "G", "Am", "F", "G", "Am"];

// ——— outils d'animation ———
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (x, a, b) => clamp((x - a) / (b - a));
export const bell = (x, a, b) => {
  const k = prog(x, a, b);
  return Math.sin(k * Math.PI);
};

// Courbe de Bézier cubique (mêmes courbes que les variables --ease du site)
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(clamp(t));
  };
}

export const E = {
  out: bezier(0.22, 1, 0.36, 1), // --ease
  reveal: bezier(0.16, 1, 0.3, 1), // --ease-reveal
  io: bezier(0.65, 0, 0.35, 1), // --ease-io
  expo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  back: (x) => {
    const c = 2.2;
    return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
  },
  inCubic: (x) => x * x * x,
};

// Impulsion qui décroît après `at` (secousses, flashs). Renvoie 0 avant `at`.
export const hit = (b, at, decayBeats = 0.6) => (b < at ? 0 : Math.exp(-((b - at) / decayBeats) * 3));

// PRNG déterministe (le film doit être identique à chaque lecture et au rendu vidéo)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
