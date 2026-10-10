import { createContext, useContext } from "react";
import { useVideoConfig } from "remotion";
import script from "./script.json";

export type Hook = "A" | "B";
export const SCENES = ["accroche", "probleme", "solution", "offre", "humain", "cta"] as const;
export type SceneId = (typeof SCENES)[number];

// Temps en secondes, absolus dans la vidéo.
export type Word = { text: string; start: number; end: number; scene: SceneId };
export type Timeline = { words: Word[]; scenes: Record<SceneId, { from: number; to: number }>; total: number };

const CTA_HOLD = 2.6; // plan final lisible ≥ 2 s + raccord de boucle
const BREATH = 0.5; // respiration avant la scène 5

export const norm = (t: string) =>
  t.toLowerCase().replace(/[.,!?:;…«»"]/g, "").replace(/’/g, "'").trim();

// Rattache la ponctuation isolée (« ? », « : ») au mot précédent, comme dans l'écrit.
export const mergePunct = (words: Word[]) =>
  words.reduce<Word[]>((acc, w) => {
    if (/^[?!:;…]+$/.test(w.text) && acc.length) {
      const prev = acc[acc.length - 1];
      acc[acc.length - 1] = { ...prev, text: `${prev.text} ${w.text}`, end: w.end };
    } else acc.push(w);
    return acc;
  }, []);

const sceneTexts = (hook: Hook): [SceneId, string][] => [
  ["accroche", script.hooks[hook]],
  ...script.body.map((b) => [b.scene as SceneId, b.say] as [SceneId, string]),
];

// Estimation du débit (≈ 3,4 mots/s) utilisée tant que la voix ElevenLabs n'est pas générée.
export function estimateWords(hook: Hook): Word[] {
  const words: Word[] = [];
  let t = 0;
  for (const [scene, text] of sceneTexts(hook)) {
    if (scene === "humain") t += BREATH;
    for (const raw of text.split(/\s+/)) {
      const letters = raw.replace(/[^\p{L}\d]/gu, "").length;
      const dur = letters ? 0.07 + 0.042 * letters : 0;
      words.push({ text: raw, start: t, end: t + dur, scene });
      t += dur + 0.025;
      if (/,$/.test(raw)) t += 0.1;
      if (/[.]$/.test(raw)) t += 0.18;
      if (/…$/.test(raw)) t += 0.3;
      if (/^[?:]$/.test(raw)) t += 0.18;
    }
  }
  return mergePunct(words);
}

export function buildTimeline(words: Word[]): Timeline {
  const scenes = {} as Timeline["scenes"];
  SCENES.forEach((id, i) => {
    const first = words.find((w) => w.scene === id);
    if (!first) throw new Error(`scène sans mots : ${id}`);
    scenes[id] = { from: i === 0 ? 0 : Math.max(0, first.start - 0.08), to: 0 };
  });
  SCENES.forEach((id, i) => {
    scenes[id].to = i < SCENES.length - 1 ? scenes[SCENES[i + 1]].from : words[words.length - 1].end + CTA_HOLD;
  });
  return { words, scenes, total: scenes.cta.to };
}

export const TimelineCtx = createContext<Timeline | null>(null);

export const useTimeline = () => {
  const tl = useContext(TimelineCtx);
  if (!tl) throw new Error("TimelineCtx manquant");
  return tl;
};

// Ancrages d'une scène, en frames relatives au début de la scène.
export const useScene = (id: SceneId) => {
  const tl = useTimeline();
  const { fps } = useVideoConfig();
  const from = tl.scenes[id].from;
  const ws = tl.words.filter((w) => w.scene === id);
  const find = (match: string, nth = 0) => {
    const hits = ws.filter((w) => norm(w.text).startsWith(norm(match)));
    const w = hits[nth] ?? hits[hits.length - 1];
    if (!w) throw new Error(`mot introuvable dans ${id} : ${match}`);
    return w;
  };
  const f = (s: number) => Math.round((s - from) * fps);
  return {
    at: (match: string, nth = 0) => f(find(match, nth).start),
    end: (match: string, nth = 0) => f(find(match, nth).end),
    dur: Math.round((tl.scenes[id].to - from) * fps),
  };
};
