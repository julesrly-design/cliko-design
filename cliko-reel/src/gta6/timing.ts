// Timings du short GTA 6, tirés de l'alignement mot à mot de la voix off (src/gta6/alignment.json).
import align from "./alignment.json";

export const FPS = 30;
export const TAIL = 1.3; // secondes après le dernier mot
export const TOTAL = Math.ceil((align.scenes[align.scenes.length - 1].end + TAIL) * FPS);

export type SceneId = "hook" | "ampleur" | "twitch" | "total" | "vues" | "cumul" | "conges" | "logi" | "flu" | "outro";
export type Word = { text: string; start: number; end: number; scene: string };

export const WORDS = align.words as Word[];

// Chaque scène commence au début de son premier mot (moins 3 frames : la coupe précède la voix).
export const SCENES = align.scenes.map((s, i, all) => ({
  id: s.scene as SceneId,
  from: i === 0 ? 0 : Math.round(s.start * FPS) - 3,
  to: i === all.length - 1 ? TOTAL : Math.round(all[i + 1].start * FPS) - 3,
}));
export const scene = (id: SceneId) => SCENES.find((s) => s.id === id)!;

// Frame (relative au début de sa scène) où un mot est prononcé : n-ième occurrence dans la scène.
export const wordAt = (id: SceneId, re: RegExp, nth = 0) => {
  const ws = WORDS.filter((w) => w.scene === id && re.test(w.text));
  const w = ws[Math.min(nth, ws.length - 1)];
  return w ? Math.round(w.start * FPS) - scene(id).from : 0;
};
