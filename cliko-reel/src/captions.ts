// Découpage des sous-titres (1 à 3 mots par carton), forme écrite, mots-clés et « mots héros ».
// Le plan est écrit à la main ; il est validé contre les mots réellement prononcés
// (estimation ou timestamps ElevenLabs). En cas d'écart, la scène retombe sur un découpage automatique.
import { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { Hook, norm, SceneId, SCENES, useTimeline, Word } from "./timeline";

// Formes phonétiques → forme écrite (espace insécable pour garder « 24 h » en un seul jeton).
const DISPLAY: [string[], string][] = [
  [["vingt-quatre", "heures"], "24\u00a0h"],
  [["cliko", "point", "be"], "cliko.be"],
  [["kliko"], "Cliko"],
  [["clicko"], "Cliko"],
];

// « * » en tête = mot héros : la scène l'affiche en grand, le rail de sous-titres le saute.
const PLAN: Record<SceneId, string[]> & { accrocheB: string[] } = {
  accroche: ["Votre commerce", "mérite mieux", "qu'un site fait", "à la chaîne."],
  accrocheB: ["Les agences web", "vous traitent", "comme un numéro\u00a0?", "Pas nous."],
  probleme: ["Facebook,", "Google,", "vos photos…", "tout est", "*éparpillé."],
  solution: ["*Cliko", "rassemble tout", "à une seule", "adresse\u00a0:", "la vôtre."],
  offre: ["Un site", "*sur-mesure,", "parfait", "sur téléphone.", "Hébergé,", "mis à jour,", "en trois langues.", "On gère même", "vos réseaux."],
  humain: ["Et surtout,", "*on vous écoute.", "Pas de ticket,", "pas de robot\u00a0:", "vous parlez", "directement à", "*Jules et Louis.", "Réponse", "en 24\u00a0h."],
  cta: ["*Cliko.", "Votre commerce", "mérite d'être", "*trouvé.", "*Devis gratuit", "*sur cliko.be"],
};

const KEYWORDS = new Set([
  "mieux", "chaîne", "numéro", "nous", "éparpillé", "cliko", "vôtre", "sur-mesure", "parfait",
  "langues", "réseaux", "écoute", "ticket", "robot", "jules", "louis", "24\u00a0h", "trouvé", "gratuit", "cliko.be",
]);

export type CapWord = { text: string; key: boolean; start: number; end: number }; // secondes absolues
export type CapGroup = { scene: SceneId; text: string; hero: boolean; words: CapWord[]; start: number; end: number };

const tokenNorm = (t: string) => norm(t).replace(/\u00a0/g, " ");
const clean = (t: string) => t.replace(/[.,:;…]+$/u, "").trim();

const applyDisplay = (words: Word[]): Word[] => {
  const out: Word[] = [];
  for (let i = 0; i < words.length; i++) {
    const rule = DISPLAY.find(([seq]) => seq.every((s, k) => norm(words[i + k]?.text ?? "") === s));
    if (!rule) {
      out.push(words[i]);
      continue;
    }
    const last = words[i + rule[0].length - 1];
    const trail = last.text.match(/[.,?!…:]+$/u)?.[0] ?? "";
    out.push({ ...words[i], text: rule[1] + trail, end: last.end });
    i += rule[0].length - 1;
  }
  return out;
};

const keyNorm = (t: string) => t.toLowerCase().replace(/[.,!?:;…]+$/u, "").trim();
const isKey = (t: string) => KEYWORDS.has(keyNorm(t));

const toCapWord = (w: Word): CapWord => {
  const text = clean(w.text);
  return { text, key: isKey(text), start: w.start, end: w.end };
};

// Découpage automatique de secours : 1 à 3 mots, coupe sur la ponctuation, ~15 caractères max.
const autoGroups = (scene: SceneId, words: Word[]): CapGroup[] => {
  const groups: CapGroup[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    const ws = cur.map(toCapWord);
    groups.push({ scene, text: ws.map((w) => w.text).join(" "), hero: false, words: ws, start: ws[0].start, end: ws[ws.length - 1].end });
    cur = [];
  };
  for (const w of words) {
    const len = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
    if (cur.length && (cur.length >= 3 || len > 15)) flush();
    cur.push(w);
    if (/[.,?!…:]$/u.test(w.text)) flush();
  }
  flush();
  return groups;
};

const planGroups = (scene: SceneId, words: Word[], plan: string[]): CapGroup[] | null => {
  const groups: CapGroup[] = [];
  let i = 0;
  for (const entry of plan) {
    const hero = entry.startsWith("*");
    const tokens = (hero ? entry.slice(1) : entry).split(" ").filter(Boolean);
    const slice = words.slice(i, i + tokens.length);
    if (slice.length !== tokens.length) return null;
    const ok = slice.every((w, k) => tokenNorm(w.text) === tokenNorm(tokens[k]) || tokenNorm(tokens[k]).startsWith(tokenNorm(w.text)));
    if (!ok) return null;
    const ws = slice.map((w, k) => ({ ...toCapWord(w), text: clean(tokens[k]), key: isKey(tokens[k]) }));
    groups.push({ scene, text: ws.map((w) => w.text).join(" "), hero, words: ws, start: ws[0].start, end: ws[ws.length - 1].end });
    i += tokens.length;
  }
  return i === words.length ? groups : null;
};

export const buildCaptions = (words: Word[], hook: Hook): CapGroup[] =>
  SCENES.flatMap((scene) => {
    const ws = applyDisplay(words.filter((w) => w.scene === scene));
    const plan = scene === "accroche" && hook === "B" ? PLAN.accrocheB : PLAN[scene];
    return planGroups(scene, ws, plan) ?? autoGroups(scene, ws);
  });

export const useCaptions = (hook: Hook) => {
  const { words } = useTimeline();
  return useMemo(() => buildCaptions(words, hook), [words, hook]);
};

// Mot héros d'une scène, en frames relatives à la scène : la scène l'anime elle-même.
export const useHero = (hook: Hook, scene: SceneId, text: string) => {
  const groups = useCaptions(hook);
  const tl = useTimeline();
  const { fps } = useVideoConfig();
  const g = groups.find((x) => x.scene === scene && x.hero && tokenNorm(x.text) === tokenNorm(text));
  const from = tl.scenes[scene].from;
  if (!g) return null;
  const f = (s: number) => Math.round((s - from) * fps);
  return { ...g, at: f(g.start), endAt: f(g.end), words: g.words.map((w) => ({ ...w, at: f(w.start) })) };
};
