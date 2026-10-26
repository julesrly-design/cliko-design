// Génère les bruitages avec l'API Sound Effects d'ElevenLabs → public/sfx/*.mp3
// Usage : NODE_USE_ENV_PROXY=1 node scripts/sfx.mjs [nom…]
// La clé est lue dans ELEVENLABS_API_KEY ; dans l'environnement cloud, le proxy l'injecte lui-même.
import { mkdir, writeFile } from "node:fs/promises";

const SFX = {
  whoosh: ["Fast clean modern whoosh, airy, short, cinematic UI transition", 0.6],
  whooshDeep: ["Deep cinematic whoosh swipe pass-by, low end, smooth, powerful, short", 1.0],
  tick: ["Tiny crisp UI tick, soft click, clean, very short, premium interface sound", 0.5],
  pop: ["Soft glassy UI pop, subtle bubble, clean, very short", 0.5],
  impact: ["Huge cinematic impact hit with deep sub boom and bright shimmering tail, trailer logo reveal", 2.2],
  riser: ["Cinematic tension riser, rising whoosh and shimmering synth, building fast, ends abruptly", 1.6],
  flap: ["Split-flap departure board flipping letters, fast mechanical clatter, crisp", 1.0],
  sparkle: ["Electric spark crackle burst with glittering magical shimmer, short", 0.8],
};

const names = process.argv.slice(2);
await mkdir("public/sfx", { recursive: true });
for (const [name, [text, duration_seconds]] of Object.entries(SFX)) {
  if (names.length && !names.includes(name)) continue;
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192", {
    method: "POST",
    headers: { "content-type": "application/json", ...(process.env.ELEVENLABS_API_KEY ? { "xi-api-key": process.env.ELEVENLABS_API_KEY } : {}) },
    body: JSON.stringify({ text, duration_seconds, prompt_influence: 0.6 }),
  });
  if (!res.ok) throw new Error(`${name} : ${res.status} ${await res.text()}`);
  await writeFile(`public/sfx/${name}.mp3`, Buffer.from(await res.arrayBuffer()));
  console.log("→ public/sfx/" + name + ".mp3");
}
