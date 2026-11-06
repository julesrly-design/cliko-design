// Bruitages du film motion design (ElevenLabs Sound Effects) → public/motion/sfx/*.mp3
// Usage : npm run sfx:motion [nom...]
import { api, save } from "./eleven.mjs";

export const SFX = {
  ignite: ["Bright magical ignition spark burst, warm fire whoosh flare, cinematic logo reveal, crisp", 1.6],
  sparkle: ["Short bright glittering shimmer sparkle tail, premium UI, airy", 0.9],
  impact: ["Huge deep cinematic sub boom impact hit with short tail, modern trailer, clean", 1.8],
  hit: ["Short tight punchy cinematic hit, snappy transient, modern motion graphics", 0.6],
  riser: ["Tension riser, rising white noise sweep with pitch up, ends abruptly, cinematic, 3 seconds", 3.0],
  whoosh: ["Fast clean modern whoosh transition, airy, short", 0.6],
  whooshDeep: ["Deep cinematic whoosh swipe pass by, low end, smooth", 1.0],
  whip: ["Very fast camera whip pan swish, sharp, short", 0.5],
  click: ["Crisp satisfying mouse click, premium, clean, close mic", 0.5],
  pop: ["Soft bubbly UI pop, subtle, clean, very short", 0.5],
  keys: ["Fast typing on a premium laptop keyboard, soft clicky keys, steady short burst", 2.0],
  send: ["Modern chat message sent swoosh with a soft upward pluck, short", 0.6],
  data: ["Digital data stream glitch ticks and computer processing bleeps, fast, futuristic UI", 1.5],
  flip: ["Card flipping over quickly, single crisp paper flap, short", 0.5],
  morph: ["Smooth liquid UI morph transition swoosh, glassy, soft, short", 0.8],
  key1: ["Single crisp mechanical keyboard key press, close mic, dry, very short", 0.5],
  key2: ["One clicky laptop key tap, crisp, dry, close, very short", 0.5],
  key3: ["Keyboard space bar press, soft thock, dry, short", 0.5],
  tick1: ["Tiny crisp UI tick click, very short, high pitched, dry", 0.5],
  tick2: ["Small glassy UI tap click, very short, bright, dry", 0.5],
  snap: ["Satisfying magnetic snap lock click, UI element snapping into place, punchy", 0.5],
  swish: ["Soft short air swish of a fast hand movement, subtle, close", 0.5],
  swoosh: ["Smooth fast swoosh sweep passing left to right, airy, modern motion graphics", 1.0],
  rise: ["Short whoosh rising up, upward swipe transition, airy", 0.8],
  sub: ["Deep sub bass drop boom, cinematic, short tail", 1.5],
  glitch: ["Short digital glitch stutter burst, data corruption, crisp", 0.6],
  scan: ["Futuristic laser scanning sweep, bright electronic shimmer, short", 1.0],
  fire: ["Warm fire roar ambience with soft crackles, cinematic, steady, no music", 12],
  pillPop: ["Bouncy rubber button pop, satisfying, playful UI, punchy", 0.5],
  marker: ["Quick felt marker highlight swipe stroke on paper, single stroke", 0.5],
  thud: ["Soft heavy thud of a card landing on a table, deep, short", 0.6],
  hover: ["Soft UI hover glow blip, gentle shimmer, short", 0.5],
  blip: ["Quick short computer bleep blip, digital, high", 0.5],
  ding: ["Warm bright notification chime, premium, short", 0.8],
};

const names = process.argv.slice(2);
const todo = Object.entries(SFX).filter(([n]) => !names.length || names.includes(n));
// ElevenLabs limite à 4 requêtes simultanées : lots de 3.
for (let i = 0; i < todo.length; i += 3) {
  await Promise.all(todo.slice(i, i + 3).map(async ([name, [text, duration_seconds]]) => {
    const audio = await api("/v1/sound-generation", {
      method: "POST",
      query: { output_format: "mp3_44100_192" },
      body: { text, duration_seconds, prompt_influence: 0.6 },
      raw: true,
    });
    await save(`public/motion/sfx/${name}.mp3`, audio);
  }));
}
