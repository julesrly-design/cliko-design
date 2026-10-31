// Direction « néon de marque » (inspirée des pubs produit type Duolingo) : un univers d'une seule
// couleur, l'ambre du logo Cliko, qui illumine une nuit très sombre. Tout se règle ici.
import { Easing } from "remotion";
import { TEXT } from "../config";

export const NEON = {
  // fond : nuit bleutée de cliko.be, très sombre
  bgCenter: "#0C1430",
  bgMid: "#060A18",
  bgEdge: "#010208",
  // la couleur néon (ambre du logo) et ses variantes
  amber: "#FFC46B",
  amberHot: "#FFE2AE",
  amberDeep: "#F0A948",
  core: "#FFF6E6", // cœur blanc chaud du fil
  // interfaces
  card: "#0D1324",
  cardTop: "#121A31",
  cardLine: "rgba(185,196,240,.16)",
  text: "#F2F3FA",
  mist: "#8E97C6",
  // couleurs secondaires des bulles (scène « Pour qui »), tirées des lueurs du site
  orbs: ["#FFC46B", "#38C6F4", "#7B6CFF"] as const,
};

// Textes : on reprend ceux de config.ts (un seul endroit à modifier)
export { TEXT };

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  snap: Easing.bezier(0.2, 1.4, 0.4, 1), // micro-dépassement
};

export const FONT = {
  display: '"Clash Display", "Inter", sans-serif',
  body: '"Inter", sans-serif',
};

// Logo cliko.be (SVG d'origine, viewBox 480×148, traits de 22)
export const LOGO = {
  vb: { w: 480, h: 148 },
  strokes: {
    c: "M82.47 68.57A41 41 0 1 0 82.47 123.43",
    l: "M123 11V135",
    i: "M179 57V135",
    k1: "M235 11V135",
    k2: "M235 112L289 57",
    k3: "M253 93.67L293 135",
  },
  toggle: "M372 44H428A52 52 0 0 1 428 148H372A52 52 0 0 1 372 44ZM389 96A39 39 0 1 0 467 96A39 39 0 1 0 389 96Z",
  dot: { cx: 179, cy: 16, r: 13 },
  hole: { cx: 428, cy: 96, r: 39 },
};
// Position du logo à l'écran (identique au début et à la fin : la vidéo boucle)
export const LOGO_POS = { cx: 540, cy: 860, width: 640 };
export const logoScale = LOGO_POS.width / LOGO.vb.w;
export const logoPx = (x: number, y: number): [number, number] => [
  LOGO_POS.cx - LOGO_POS.width / 2 + x * logoScale,
  LOGO_POS.cy - (LOGO.vb.h * logoScale) / 2 + y * logoScale,
];
