// Feuille de bruitages du short GTA 6, calculée depuis les mêmes timings que les animations → public/gta6/cues.json
import { writeFileSync } from "node:fs";
import { FPS, SCENES, TOTAL, scene, wordAt, SceneId } from "../src/gta6/timing";

type Cue = { t: number; s: string; g?: number; st?: number };
const cues: Cue[] = [];
const at = (id: SceneId, rel: number) => (scene(id).from + rel) / FPS;
const add = (id: SceneId, rel: number, s: string, g = 1, st = 0) => cues.push({ t: at(id, rel), s, g, st });
const counter = (id: SceneId, rel: number, dur: number, n = 12) => {
  add(id, rel, "data", 0.35);
  for (let i = 0; i < n; i++) add(id, rel + Math.round((dur * (1 - Math.pow(1 - i / n, 2)))), i % 2 ? "tick1" : "tick2", 0.45, i * 0.6);
  add(id, rel + dur, "ding", 0.55);
};
const stamp = (id: SceneId, rel: number) => { add(id, rel, "thud", 0.9); add(id, rel, "hit", 0.5); };

// coupes
SCENES.forEach((s, i) => { if (i) { cues.push({ t: s.from / FPS - 0.12, s: i % 2 ? "whoosh" : "swoosh", g: 0.6 }); cues.push({ t: s.from / FPS, s: "impact", g: i % 3 === 0 ? 0.8 : 0.45 }); } });

// hook
add("hook", 3, "impact", 0.9); counter("hook", 3, 12, 8); add("hook", 8, "thud", 0.7);
add("hook", wordAt("hook", /^13$/, 1), "pop", 0.5);
add("hook", wordAt("hook", /^today/i), "pillPop", 0.7);
add("hook", wordAt("hook", /^GTA/) - 30, "riser", 0.6);
add("hook", wordAt("hook", /^GTA/), "impact", 1); add("hook", wordAt("hook", /^GTA/), "sub", 0.9);
stamp("hook", wordAt("hook", /FINALLY/));
// ampleur
add("ampleur", wordAt("ampleur", /^right/), "whip", 0.5);
add("ampleur", wordAt("ampleur", /insane/) - 4, "impact", 1); add("ampleur", wordAt("ampleur", /insane/) - 4, "sub", 0.8);
// twitch
add("twitch", 0, "pillPop", 0.5);
for (let k = 0; k < 6; k++) add("twitch", 10 + k * 23, "blip", 0.18, k);
counter("twitch", wordAt("twitch", /^3$/), 28);
stamp("twitch", wordAt("twitch", /Never/));
// total
add("total", 0, "whip", 0.6); add("total", wordAt("total", /YouTube/), "whip", 0.6, 1); add("total", wordAt("total", /Kick/), "whip", 0.6, 2);
add("total", wordAt("total", /^6$/) - 8, "morph", 0.6);
counter("total", wordAt("total", /^6$/), 30);
add("total", wordAt("total", /launch/), "pop", 0.5);
// vues
add("vues", 0, "pop", 0.7); add("vues", wordAt("vues", /trailer/), "swish", 0.5);
counter("vues", wordAt("vues", /^90$/), 28);
add("vues", wordAt("vues", /^24$/), "scan", 0.5);
stamp("vues", wordAt("vues", /^world/)); add("vues", wordAt("vues", /^world/), "sparkle", 0.5);
// cumul
for (let i = 0; i < 4; i++) add("cumul", i * 4, "snap", 0.5, i);
counter("cumul", wordAt("cumul", /^half/), 26);
add("cumul", wordAt("cumul", /YouTube/), "pop", 0.5);
// congés
add("conges", 0, "whip", 0.5); add("conges", wordAt("conges", /^real/), "thud", 0.6);
add("conges", wordAt("conges", /Thousands/) - 4, "flip", 0.7);
for (let i = 0; i < 10; i++) add("conges", wordAt("conges", /Thousands/) + i * 2, "tick1", 0.3, i);
stamp("conges", wordAt("conges", /^took/));
// logi
add("logi", 0, "pillPop", 0.6); counter("logi", wordAt("logi", /^7,000/), 20, 8);
add("logi", wordAt("logi", /^gave/), "pop", 0.6);
add("logi", wordAt("logi", /Conor/), "pillPop", 0.6); counter("logi", wordAt("logi", /^400/), 16, 6);
add("logi", wordAt("logi", /^same/), "pop", 0.6);
// flu
for (let i = 0; i < 5; i++) add("flu", wordAt("flu", /^worker/) + i * 3, "pop", 0.4, i);
add("flu", wordAt("flu", /^five/), "impact", 0.8); add("flu", wordAt("flu", /^five/), "ding", 0.4);
add("flu", wordAt("flu", /^GTA/) - 20, "riser", 0.5);
add("flu", wordAt("flu", /^GTA/), "glitch", 0.8); add("flu", wordAt("flu", /^GTA/), "impact", 1);
add("flu", wordAt("flu", /flu/), "sub", 0.9); add("flu", wordAt("flu", /flu/), "hit", 0.6);
for (let i = 0; i < 3; i++) add("flu", wordAt("flu", /^GTA/) + 10 + i * 4, "pop", 0.5, i * 2);
// outro
add("outro", 0, "impact", 0.9); add("outro", wordAt("outro", /^take/), "whip", 0.5);
add("outro", wordAt("outro", /^Tell/), "pillPop", 0.8);
add("outro", wordAt("outro", /^Tell/) + 12, "click", 0.6);
add("outro", wordAt("outro", /^follow/), "pillPop", 0.8); add("outro", wordAt("outro", /^follow/), "sparkle", 0.5);

const marks = Object.fromEntries(SCENES.map((s) => [s.id, s.from / FPS]));
const extra = { gta: at("hook", wordAt("hook", /^GTA/)), fou: at("ampleur", wordAt("ampleur", /insane/) - 4), fluGta: at("flu", wordAt("flu", /^GTA/)) };
writeFileSync("public/gta6/cues.json", JSON.stringify({ fps: FPS, duration: TOTAL / FPS, marks: { ...marks, ...extra }, cues: cues.sort((a, b) => a.t - b.t) }, null, 1));
console.log(cues.length, "bruitages,", (TOTAL / FPS).toFixed(2), "s");
