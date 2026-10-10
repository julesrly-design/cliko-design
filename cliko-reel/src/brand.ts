// Identité Cliko, extraite de cliko.be (feuille de style du site, octobre 2026).
// Toutes les couleurs, polices et courbes du reel passent par ce fichier.
import { Easing } from "remotion";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Polices embarquées (public/fonts, fichiers variables de Google Fonts) : aucun accès réseau au rendu.
const UR = {
  latin: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  latinExt: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
};
const FAMILIES = [
  ["Schibsted Grotesk", "schibsted-grotesk", "400 900"],
  ["Geist Mono", "geist-mono", "400 700"],
] as const;
for (const [family, file, weight] of FAMILIES) {
  loadFont({ family, url: staticFile(`fonts/${file}-latin.woff2`), weight, unicodeRange: UR.latin });
  loadFont({ family, url: staticFile(`fonts/${file}-latin-ext.woff2`), weight, unicodeRange: UR.latinExt });
}

export const B = {
  // Fond « nuit » du site et ses niveaux
  night: "#0b1020",
  nightDeep: "#080c1b",
  nightRaised: "#141a33",
  nightPanel: "#151c3a",
  horizon: "#26356e",
  royal: "#2539a8",
  royalDeep: "#1a2a86",
  // Texte
  text: "#f2f3fa",
  mist: "#b9c0e3",
  faint: "#8b94c8",
  // Accent ambre (le point du logo)
  accent: "#ffc46b",
  accentBright: "#ffd48f",
  accentDeep: "#f0a948",
  // Lignes et verre
  line: "rgba(185,196,240,.16)",
  lineSoft: "rgba(185,196,240,.09)",
  lineStrong: "rgba(185,196,240,.30)",
  glass: "rgba(242,243,250,.06)",
  glassStrong: "rgba(242,243,250,.11)",
  glassLine: "rgba(185,196,240,.18)",
  // Lueurs d'ambiance (RVB) utilisées en dégradés radiaux sur le site
  glowPetrol: "18,84,104",
  glowMarine: "28,52,122",
  glowIndigo: "52,44,116",
  glowRoyal: "34,58,140",
  // Monde « machine » (scène 1) : acier froid, désaturé
  steel: "#8e97a8",
  steelDark: "#2a3142",
  steelLight: "#c9cfdb",
} as const;

export const FONT = {
  display: '"Schibsted Grotesk", "Inter", sans-serif', // titres, sous-titres, logo
  mono: '"Geist Mono", "DejaVu Sans Mono", monospace', // étiquettes techniques, URL, compteurs
};

// Courbes d'easing du site (variables --ease, --ease-reveal, --ease-io, --ease-micro).
export const EASE = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  reveal: Easing.bezier(0.16, 1, 0.3, 1),
  io: Easing.bezier(0.65, 0, 0.35, 1),
  micro: Easing.bezier(0.4, 0, 0.2, 1),
};

// Logo : « Cliko » en Schibsted Grotesk 700, interlettrage −0,03 em, point final ambre.
export const LOGO = { weight: 700, tracking: "-0.03em" };
