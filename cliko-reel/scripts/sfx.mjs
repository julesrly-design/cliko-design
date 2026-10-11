// Bruitages via l'API Sound Effects d'ElevenLabs → public/sfx/*.mp3
// Usage : node --env-file=.env scripts/sfx.mjs [nom...]
import { api, save, FORMAT } from "./eleven.mjs";

export const SFX = {
  tampon: ["Heavy industrial rubber stamp slam on metal conveyor belt, punchy, dry, close mic", 0.8],
  convoyeur: ["Mechanical factory conveyor belt rattling loop, rhythmic clanks, cold industrial", 2.5],
  frein: ["Metal conveyor belt brakes to an abrupt stop, short screech and clunk", 0.9],
  whoosh: ["Fast clean modern whoosh transition, airy, short", 0.6],
  whooshProfond: ["Deep cinematic whoosh swipe, low end, smooth, short", 1.0],
  aspiration: ["Reverse whoosh suction, objects being sucked in, magnetic, short", 1.0],
  aimant: ["Small magnetic snap click, satisfying, crisp", 0.4],
  pop: ["Soft bubbly UI pop, subtle, clean, very short", 0.3],
  frappe: ["Single soft laptop keyboard key press, close, clean", 0.2],
  clicSignature: ["Signature premium click sound, crisp satisfying mouse click with tiny bright sparkle tail, modern brand sound", 0.8],
  tuile: ["Split-flap display tile flipping, single flap, crisp mechanical", 0.4],
  marqueur: ["Felt marker pen quickly striking through text on paper, single stroke", 0.5],
  grésillement: ["Robot electronic glitch buzz then power down, CRT turning off, short", 1.2],
  envoi: ["Modern chat message sent swoosh, soft, short", 0.4],
  reception: ["Modern chat message received ding, warm, soft", 0.5],
  sonnerie: ["Short phone ring chirp, modern, single ring", 0.6],
};

const names = process.argv.slice(2);
for (const [name, [text, duration_seconds]] of Object.entries(SFX)) {
  if (names.length && !names.includes(name)) continue;
  const audio = await api("/v1/sound-generation", {
    method: "POST",
    query: { output_format: FORMAT },
    body: { text, duration_seconds, prompt_influence: 0.6 },
    raw: true,
  });
  await save(`public/sfx/${name}.mp3`, audio);
}
