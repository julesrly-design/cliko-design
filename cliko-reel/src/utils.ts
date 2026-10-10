import { Easing, interpolate, spring } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type SpringCfg = { damping?: number; stiffness?: number; mass?: number };

// Ressort par défaut du reel : vif, léger dépassement.
export const sp = (frame: number, fps: number, delay = 0, cfg: SpringCfg = {}) =>
  spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 160, mass: 0.7, ...cfg } });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Tremblement pseudo-aléatoire, continu et déterministe.
export const jitter = (frame: number, seed: number, amp: number) =>
  amp * (Math.sin(frame * 1.9 + seed * 12.9) * 0.6 + Math.sin(frame * 3.7 + seed * 4.3) * 0.4);

// Enveloppe de « punch » : montée en 3 frames, retombée amortie.
export const punch = (d: number) =>
  d < 0 ? 0 : d < 3 ? d / 3 : interpolate(d, [3, 16], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
