// ─────────────────────────────────────────────────────────────────────────────
//  CONFIG : tout ce qu'on modifie sans toucher au reste du code.
//  Couleurs, textes, timings des scènes, réglages de la ligne et des effets.
// ─────────────────────────────────────────────────────────────────────────────

// ── Format ──────────────────────────────────────────────────────────────────
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 60,
  durationInFrames: 1800, // 30 s
};

// Musique à 120 BPM : une noire = 0,5 s = 30 frames à 60 fps ; une croche = 15 frames.
// Toutes les coupes et tous les impacts tombent sur un multiple de 15 frames.
export const BPM = 120;
export const BEAT = (VIDEO.fps * 60) / BPM; // 30
export const HALF_BEAT = BEAT / 2; // 15

// ── Palettes ────────────────────────────────────────────────────────────────
// « brand » : la charte de cliko.be (nuit bleutée, ambre du logo, lueurs pétrole et royal).
// « electric » : la palette du brief (cyan électrique → violet). Changer PALETTE ci-dessous suffit.
type Palette = {
  bg: string; // fond, coins
  bgCenter: string; // fond, centre du dégradé radial
  bgGlow: string; // lueur d'ambiance très diffuse
  text: string; // blanc cassé
  mist: string; // texte secondaire
  lineHead: string; // cœur de la tête (sera poussé en HDR)
  lineMid: string; // couleur de la traînée juste derrière la tête
  lineTail: string; // couleur de queue
  accent: string; // accent principal (mots clés, prix)
  accentFrom: string; // dégradé d'accent : début
  accentTo: string; // dégradé d'accent : fin
  rimA: string; // rim light froide (gauche)
  rimB: string; // rim light profonde (droite)
  grid: string; // lignes de la grille
  glass: string; // teinte du verre
  metal: string; // finition titane / chrome
};

export const PALETTES: Record<"brand" | "electric", Palette> = {
  brand: {
    bg: "#020306",
    bgCenter: "#060912", // « nuit » de cliko.be, assombrie
    bgGlow: "#142659", // lueur marine du site, très discrète
    text: "#F2F3FA",
    mist: "#B9C0E3",
    lineHead: "#FFFFFF",
    lineMid: "#FFC46B", // ambre du logo
    lineTail: "#4A5BD8", // royal de cliko.be, éclairci pour la lumière
    accent: "#FFC46B",
    accentFrom: "#FFE1A8",
    accentTo: "#F0A948",
    rimA: "#2AA9D6", // pétrole du site, éclairci
    rimB: "#5B4BFF", // indigo / royal du site
    grid: "#6F86FF",
    glass: "#C9D3FF",
    metal: "#B9BFCC",
  },
  electric: {
    bg: "#05060A",
    bgCenter: "#0A0E1C",
    bgGlow: "#1A1F5C",
    text: "#F5F7FA",
    mist: "#AEB6D6",
    lineHead: "#FFFFFF",
    lineMid: "#00E5FF",
    lineTail: "#7C4DFF",
    accent: "#00E5FF",
    accentFrom: "#00E5FF",
    accentTo: "#7C4DFF",
    rimA: "#00E5FF",
    rimB: "#7C4DFF",
    grid: "#5AA0FF",
    glass: "#CFEFFF",
    metal: "#C2C8D6",
  },
};

export const PALETTE = PALETTES.brand;

// ── Typo ────────────────────────────────────────────────────────────────────
// Fichiers dans public/fonts. Clash Display (Fontshare, licence ITF FFL) et Inter (OFL).
export const FONTS = {
  display: { family: "Clash Display", files: { 600: "ClashDisplay-Semibold.ttf", 700: "ClashDisplay-Bold.ttf" } },
  body: { family: "Inter", files: { 400: "Inter-Regular.ttf", 500: "Inter-Medium.ttf", 600: "Inter-SemiBold.ttf" } },
  // Interlettrage serré des titres (en em)
  displayTracking: -0.035,
};

// ── Zones de sécurité réseaux sociaux (px) ──────────────────────────────────
export const SAFE = { top: 250, bottom: 450, right: 160, left: 80 };
// Calque de contrôle (rouge) visible dans le studio : passer à true pour vérifier.
export const SHOW_SAFE_ZONES = false;

// ── Scènes (frames à 60 fps) ────────────────────────────────────────────────
// start = première frame de la scène ; les transitions débordent un peu de part et d'autre.
export const SCENES = {
  hook: { start: 0, end: 150 }, // 0:00 → 0:02,5
  site: { start: 150, end: 420 }, // 0:02,5 → 0:07
  services: { start: 420, end: 780 }, // 0:07 → 0:13
  forWho: { start: 780, end: 1020 }, // 0:13 → 0:17
  mobile: { start: 1020, end: 1260 }, // 0:17 → 0:21
  languages: { start: 1260, end: 1410 }, // 0:21 → 0:23,5
  offer: { start: 1410, end: 1560 }, // 0:23,5 → 0:26
  logo: { start: 1560, end: 1800 }, // 0:26 → 0:30
} as const;
export type SceneId = keyof typeof SCENES;

// ── Textes ──────────────────────────────────────────────────────────────────
// Règle : 6 mots maximum à l'écran en même temps.
export const TEXT = {
  hook: {
    // Une ligne de texte par entrée ; le mot « accent » reçoit le dégradé ambre.
    lines: ["Ton commerce", "est invisible", "en ligne ?"],
    accent: "invisible",
  },
  site: { line1: "On crée ton site.", line2: "Sur mesure." },
  services: ["Création sur mesure", "Hébergement", "Maintenance", "Réseaux sociaux"],
  forWho: ["Restaurants", "Hôtels", "Boutiques"],
  mobile: {
    title: "Parfait sur mobile.",
    notifications: ["Nouvelle réservation", "Nouveau message"],
  },
  languages: { codes: ["FR", "NL", "EN"], suffix: "inclus" },
  offer: {
    prefix: "Dès",
    price: 750, // prix de départ affiché sur cliko.be (de 750 à 1 200 €)
    currency: "€",
    // Brief : « Hébergement, domaine et maintenance compris ». Raccourci d'un mot pour tenir les 6 mots à l'écran.
    subtitle: "Hébergement, domaine, maintenance compris",
  },
  logo: { url: "cliko.be", cta: "Lien en bio" },
};

// ── Ligne lumineuse ─────────────────────────────────────────────────────────
export const LINE = {
  headIntensity: 26, // multiplicateur HDR du cœur (> 1 = déclenche le bloom)
  trailIntensity: 5.5, // HDR de la traînée près de la tête
  coreFrames: 16, // longueur de la traînée vive (en frames de trajet)
  residualFrames: 24, // lueur résiduelle derrière (s'estompe en 0,4 s)
  sampleStep: 0.125, // pas d'échantillonnage de l'historique (frames) : petit = courbes bien rondes
  width: 0.075, // épaisseur à la tête (unités monde ; 1 unité ≈ 203 px au plan de référence)
  tailWidth: 0.012,
  lightIntensity: 38, // pointLight attachée à la tête
  lightDistance: 9,
  sparkThreshold: 2.4, // sensibilité des étincelles dans les virages serrés (haut = seulement les vrais coups de fouet)
};

// ── Post-processing ─────────────────────────────────────────────────────────
export const POST = {
  bloomIntensity: 1.35,
  bloomThreshold: 1.0, // seul ce qui dépasse 1 (la lumière) brille
  bloomSmoothing: 0.25,
  bloomRadius: 0.78,
  chromaticAberration: 0.0018,
  grain: 0, // grain animé désactivé (0) : il faisait « grésiller » le fond
  vignette: 0.62,
  motionBlurShutter: 0.55, // fraction d'une frame
};

// ── Miniature (couverture du Reel) : logo complet, ligne à son éclat maximum ──
export const THUMBNAIL_FRAME = 1725;

// ── Audio ───────────────────────────────────────────────────────────────────
export const AUDIO = {
  // Déposer la musique dans public/music.mp3 puis passer à true.
  music: false,
  musicFile: "music.mp3",
  musicVolume: 0.9,
  // Bruitages de public/sfx (générés par scripts/sfx.mjs) ; la liste des frames est dans SFX.md.
  sfx: true,
  sfxVolume: 0.8,
};
