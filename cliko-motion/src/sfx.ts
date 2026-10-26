// Bruitages : fichiers (public/sfx) et liste des déclenchements, en frames à 60 fps.
// Chaque frame est calée sur l'événement visuel correspondant (et donc sur la grille de 15 frames
// de la musique à 120 BPM pour les coupes et les impacts). `npm run sfx:list` exporte SFX.md.
import { SCENES } from "./config";

export type SfxType = "whoosh" | "whooshDeep" | "tick" | "impact" | "riser" | "flap" | "sparkle" | "pop";

// whoosh / whooshDeep / tick : ElevenLabs (scripts/sfx.mjs) ; les autres : synthèse (scripts/synth_sfx.py).
export const SFX_FILES: Partial<Record<SfxType, string>> = {
  whoosh: "sfx/whoosh.mp3",
  whooshDeep: "sfx/whooshDeep.mp3",
  tick: "sfx/tick.mp3",
  impact: "sfx/impact.wav",
  riser: "sfx/riser.wav",
  pop: "sfx/pop.wav",
  flap: "sfx/flap.wav",
  sparkle: "sfx/sparkle.wav",
};

// offset : décalage de lecture (négatif = le son démarre un peu avant pour que son attaque tombe pile).
export type SfxCue = { frame: number; type: SfxType; note: string; gain?: number; offset?: number };

const s = (id: keyof typeof SCENES, lf: number) => SCENES[id].start + lf;

const CUES: SfxCue[] = [
  // 1 · Hook
  { frame: s("hook", 12), type: "whoosh", note: "le point part comme une balle", gain: 0.9, offset: -4 },
  { frame: s("hook", 24), type: "tick", note: "« Ton commerce » s'écrit", gain: 0.6 },
  { frame: s("hook", 52), type: "tick", note: "« est invisible » s'écrit", gain: 0.6 },
  { frame: s("hook", 80), type: "tick", note: "« en ligne ? » s'écrit", gain: 0.6 },
  { frame: s("hook", 90), type: "impact", note: "impact sur le point du « ? » (tremblement)", gain: 0.35, offset: -1 },
  { frame: s("hook", 90), type: "sparkle", note: "étincelles de l'impact", gain: 0.5 },
  { frame: s("hook", 97), type: "whoosh", note: "rebond vers « invisible »", gain: 0.5, offset: -3 },
  { frame: s("hook", 128), type: "whooshDeep", note: "plongée vers le fond", gain: 1, offset: -6 },
  // 2 · Site
  { frame: s("site", 20), type: "whoosh", note: "la fenêtre surgit en rotation", gain: 0.6, offset: -4 },
  { frame: s("site", 40), type: "whoosh", note: "la ligne fait le tour du cadre", gain: 0.45, offset: -2 },
  { frame: s("site", 90), type: "pop", note: "header", gain: 0.7 },
  { frame: s("site", 105), type: "pop", note: "image", gain: 0.7 },
  { frame: s("site", 120), type: "pop", note: "titres", gain: 0.6 },
  { frame: s("site", 138), type: "pop", note: "boutons", gain: 0.7 },
  { frame: s("site", 152), type: "tick", note: "« On crée ton site. »", gain: 0.6 },
  { frame: s("site", 180), type: "tick", note: "« Sur mesure. »", gain: 0.7 },
  { frame: s("site", 258), type: "whooshDeep", note: "whip-pan vers les services", gain: 0.9, offset: -6 },
  // 3 · Services
  ...[0, 1, 2, 3].flatMap((i): SfxCue[] => [
    { frame: s("services", 45 + i * 60), type: "tick", note: `carte ${i + 1} s'allume, titre`, gain: 0.7 },
    { frame: s("services", 18 + i * 60), type: "whoosh", note: `la ligne file vers la carte ${i + 1}`, gain: 0.45, offset: -3 },
  ]),
  { frame: s("services", 330), type: "whooshDeep", note: "bascule vers la vue de dessus", gain: 0.9, offset: -6 },
  // 4 · Pour qui
  ...[50, 110, 170].map((lf, i): SfxCue => ({ frame: s("forWho", lf), type: "pop", note: `point ${i + 1} allumé + étiquette`, gain: 0.8 })),
  ...[50, 110, 170].map((lf): SfxCue => ({ frame: s("forWho", lf), type: "tick", note: "étiquette (punch)", gain: 0.5 })),
  { frame: s("forWho", 200), type: "whoosh", note: "la ligne quitte le sol", gain: 0.6, offset: -3 },
  // 5 · Mobile
  { frame: s("mobile", 22), type: "whoosh", note: "spirale autour du téléphone", gain: 0.6, offset: -3 },
  { frame: s("mobile", 60), type: "whoosh", note: "spirale (2e passage)", gain: 0.35, offset: -3 },
  { frame: s("mobile", 100), type: "tick", note: "« Parfait sur mobile. »", gain: 0.6 },
  { frame: s("mobile", 120), type: "pop", note: "notification « Nouvelle réservation »", gain: 0.8 },
  { frame: s("mobile", 165), type: "pop", note: "notification « Nouveau message »", gain: 0.8 },
  { frame: s("mobile", 236), type: "whooshDeep", note: "whip-pan vers les langues", gain: 0.9, offset: -6 },
  // 6 · Multilingue
  { frame: s("languages", 6), type: "flap", note: "les palettes se mettent à tourner", gain: 0.6 },
  ...[30, 60, 90].map((lf, i): SfxCue => ({ frame: s("languages", lf), type: "impact", note: `« ${["FR", "NL", "EN"][i]} » claque sur le temps`, gain: 0.25, offset: -1 })),
  ...[36, 66].map((lf): SfxCue => ({ frame: s("languages", lf), type: "flap", note: "palettes suivantes", gain: 0.45 })),
  { frame: s("languages", 108), type: "tick", note: "« inclus »", gain: 0.6 },
  { frame: s("languages", 140), type: "whooshDeep", note: "whip-pan vers l'offre", gain: 0.9, offset: -6 },
  // 7 · Offre
  { frame: s("offer", 6), type: "flap", note: "le compteur défile", gain: 0.5 },
  ...[46, 53, 60].map((lf): SfxCue => ({ frame: s("offer", lf), type: "tick", note: "un rouleau se bloque", gain: 0.7 })),
  { frame: s("offer", 60), type: "pop", note: "« € » arrive", gain: 0.6 },
  { frame: s("offer", 66), type: "whoosh", note: "la ligne souligne le prix", gain: 0.5, offset: -3 },
  { frame: s("offer", 90), type: "sparkle", note: "le trait explose en étincelles", gain: 0.9 },
  { frame: s("offer", 90), type: "impact", note: "explosion du trait", gain: 0.3, offset: -1 },
  { frame: s("offer", 94), type: "tick", note: "sous-titre", gain: 0.5 },
  // 8 · Logo
  { frame: s("logo", 60) - 96, type: "riser", note: "riser jusqu'à la convergence (1,6 s)", gain: 0.9 },
  { frame: s("logo", 0), type: "whooshDeep", note: "long vol de retour", gain: 1, offset: -6 },
  { frame: s("logo", 60), type: "impact", note: "GROS IMPACT : convergence, flash, onde de choc", gain: 1, offset: -1 },
  { frame: s("logo", 60), type: "sparkle", note: "explosion de particules", gain: 0.8 },
  { frame: s("logo", 106), type: "pop", note: "la tête se loge dans l'interrupteur du logo", gain: 0.9 },
  { frame: s("logo", 120), type: "tick", note: "« cliko.be »", gain: 0.7 },
  { frame: s("logo", 150), type: "pop", note: "« Lien en bio »", gain: 0.8 },
  { frame: s("logo", 222), type: "whoosh", note: "la ligne repart vers le point de départ (boucle)", gain: 0.7, offset: -3 },
];
export const SFX_CUES = CUES.sort((a, b) => a.frame - b.frame);
