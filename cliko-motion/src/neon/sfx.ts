// Bruitages de la version néon : frames exactes (60 fps), calées sur les événements de chaque scène.
// `npm run sfx:list` exporte cette liste dans SFX.md.
import { SCENES } from "../config";
import type { SfxCue } from "../sfx";

const s = (id: keyof typeof SCENES, lf: number) => SCENES[id].start + lf;

const CUES: SfxCue[] = [
  // 1 · Hook
  { frame: s("hook", 22), type: "whoosh", note: "le bouton lumineux quitte le logo", gain: 0.9, offset: -4 },
  { frame: s("hook", 50), type: "tick", note: "« Ton commerce »", gain: 0.6 },
  { frame: s("hook", 62), type: "tick", note: "« est invisible » (fantôme)", gain: 0.6 },
  { frame: s("hook", 76), type: "tick", note: "« en ligne ? »", gain: 0.6 },
  { frame: s("hook", 90), type: "impact", note: "le fil frappe le « ? » (tremblement)", gain: 0.35, offset: -1 },
  { frame: s("hook", 98), type: "whoosh", note: "lasso autour de « invisible »", gain: 0.5, offset: -3 },
  { frame: s("hook", 114), type: "sparkle", note: "« invisible » s'allume", gain: 0.7 },
  { frame: s("hook", 126), type: "whooshDeep", note: "plongée vers le téléphone", gain: 1, offset: -6 },
  // 2 · Site
  { frame: s("site", 30), type: "whoosh", note: "le fil se pose sur le bord du téléphone", gain: 0.5, offset: -3 },
  { frame: s("site", 90), type: "pop", note: "en-tête du site", gain: 0.7 },
  { frame: s("site", 100), type: "pop", note: "photo", gain: 0.7 },
  { frame: s("site", 110), type: "pop", note: "texte", gain: 0.5 },
  { frame: s("site", 120), type: "pop", note: "bouton « Réserver »", gain: 0.7 },
  { frame: s("site", 130), type: "pop", note: "cartes du menu", gain: 0.5 },
  { frame: s("site", 138), type: "tick", note: "tap sur « Réserver »", gain: 0.9 },
  { frame: s("site", 152), type: "tick", note: "« On crée ton site. »", gain: 0.6 },
  { frame: s("site", 180), type: "tick", note: "« Sur mesure. »", gain: 0.7 },
  { frame: s("site", 238), type: "whooshDeep", note: "le fil file vers les services", gain: 0.9, offset: -6 },
  // 3 · Services
  ...[45, 105, 165, 225].flatMap((lf, i): SfxCue[] => [
    { frame: s("services", lf - 11), type: "whoosh", note: `le fil entoure la ligne ${i + 1}`, gain: 0.4, offset: -2 },
    { frame: s("services", lf), type: "tick", note: `ligne ${i + 1} allumée, coche`, gain: 0.75 },
  ]),
  { frame: s("services", 318), type: "whooshDeep", note: "le fil plonge (les branches montent)", gain: 0.9, offset: -6 },
  // 4 · Pour qui
  ...[50, 110, 170].flatMap((lf, i): SfxCue[] => [
    { frame: s("forWho", lf - 40), type: "whoosh", note: `branche ${i + 1} qui monte`, gain: 0.45, offset: -2 },
    { frame: s("forWho", lf), type: "pop", note: `bulle ${i + 1} + étiquette`, gain: 0.85 },
    { frame: s("forWho", lf), type: "sparkle", note: "étincelles", gain: 0.35 },
  ]),
  // 5 · Mobile
  { frame: s("mobile", 22), type: "whoosh", note: "1er anneau autour du téléphone", gain: 0.55, offset: -3 },
  { frame: s("mobile", 58), type: "whoosh", note: "2e anneau", gain: 0.4, offset: -3 },
  { frame: s("mobile", 100), type: "tick", note: "« Parfait sur mobile. »", gain: 0.6 },
  { frame: s("mobile", 120), type: "pop", note: "notification « Nouvelle réservation »", gain: 0.85 },
  { frame: s("mobile", 165), type: "pop", note: "notification « Nouveau message »", gain: 0.85 },
  { frame: s("mobile", 236), type: "whooshDeep", note: "le fil file vers les langues", gain: 0.9, offset: -6 },
  // 6 · Multilingue
  { frame: s("languages", 14), type: "whoosh", note: "le fil entoure la bulle « Aa »", gain: 0.5, offset: -2 },
  ...[30, 60, 90].map((lf, i): SfxCue => ({ frame: s("languages", lf), type: "impact", note: `drapeau ${["FR", "NL", "EN"][i]} : claque sur le temps`, gain: 0.28, offset: -1 })),
  ...[30, 60, 90].map((lf): SfxCue => ({ frame: s("languages", lf), type: "pop", note: "drapeau", gain: 0.6 })),
  { frame: s("languages", 105), type: "tick", note: "« inclus »", gain: 0.6 },
  { frame: s("languages", 128), type: "whooshDeep", note: "le fil file vers l'offre", gain: 0.9, offset: -6 },
  // 7 · Offre
  { frame: s("offer", 6), type: "flap", note: "les rouleaux du prix défilent", gain: 0.5 },
  ...[46, 53, 60].map((lf): SfxCue => ({ frame: s("offer", lf), type: "tick", note: "un rouleau se bloque", gain: 0.7 })),
  { frame: s("offer", 60), type: "pop", note: "« € »", gain: 0.6 },
  { frame: s("offer", 62), type: "whoosh", note: "le fil souligne le prix", gain: 0.5, offset: -3 },
  { frame: s("offer", 90), type: "sparkle", note: "le trait explose en étincelles", gain: 0.9 },
  { frame: s("offer", 90), type: "impact", note: "explosion", gain: 0.3, offset: -1 },
  ...[96, 104, 112].map((lf, i): SfxCue => ({ frame: s("offer", lf), type: "tick", note: `pastille ${i + 1} allumée`, gain: 0.6 })),
  // 8 · Logo
  { frame: s("logo", 60) - 96, type: "riser", note: "riser jusqu'à la convergence (1,6 s)", gain: 0.9 },
  { frame: s("logo", 10), type: "whooshDeep", note: "les fils convergent", gain: 0.8, offset: -6 },
  { frame: s("logo", 60), type: "impact", note: "GROS IMPACT : convergence, flash, onde de choc", gain: 1, offset: -1 },
  { frame: s("logo", 60), type: "sparkle", note: "étincelles", gain: 0.8 },
  { frame: s("logo", 66), type: "whoosh", note: "le fil écrit le logo", gain: 0.5, offset: -2 },
  { frame: s("logo", 106), type: "pop", note: "le bouton se loge dans l'interrupteur", gain: 0.9 },
  { frame: s("logo", 120), type: "tick", note: "« cliko.be »", gain: 0.7 },
  { frame: s("logo", 150), type: "pop", note: "« Lien en bio »", gain: 0.8 },
];
export const NEON_SFX_CUES = CUES.sort((a, b) => a.frame - b.frame);
