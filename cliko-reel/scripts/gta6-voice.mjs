// Voix off du short GTA 6 : 1 requête ElevenLabs « with timestamps » → public/gta6/voix.mp3 + alignment.json
import { api, save, MODEL } from "./eleven.mjs";
import script from "../src/gta6/script.json" with { type: "json" };

const voiceId = process.env.VOICE_ID ?? script.voiceId;
const clean = (s) => s.replace(/\[[^\]]+\]\s*/g, "");
const text = script.parts.map((p) => p.say).join(" ");
const res = await api(`/v1/text-to-speech/${voiceId}/with-timestamps`, {
  method: "POST",
  query: { output_format: "mp3_44100_128" },
  body: { text, model_id: MODEL, language_code: "fr", voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.5, use_speaker_boost: true } },
});
await save("public/gta6/voix.mp3", Buffer.from(res.audio_base64, "base64"));
const a = res.normalized_alignment ?? res.alignment;
const chars = a.characters.join("");
// mots (hors balises [..])
const words = [];
let cur = null, inTag = false;
a.characters.forEach((ch, i) => {
  if (ch === "[") inTag = true;
  if (inTag) { if (ch === "]") inTag = false; cur = null; return; }
  if (/\s/.test(ch)) { cur = null; return; }
  if (!cur) { cur = { text: "", start: a.character_start_times_seconds[i], end: 0, i }; words.push(cur); }
  cur.text += ch; cur.end = a.character_end_times_seconds[i];
});
let off = 0;
const bounds = script.parts.map((p) => { const b = { scene: p.scene, from: off, to: off + p.say.length }; off = b.to + 1; return b; });
for (const w of words) w.scene = bounds.find((b) => w.i >= b.from && w.i < b.to)?.scene;
const scenes = bounds.map((b) => { const ws = words.filter((w) => w.scene === b.scene); return { scene: b.scene, start: ws[0].start, end: ws.at(-1).end }; });
console.log(chars.length === text.length ? "aligné" : `écart ${chars.length} vs ${text.length}`);
console.table(scenes);
const json = JSON.stringify({ voiceId, model: MODEL, scenes, words: words.map(({ i, ...w }) => w) }, null, 2);
await save("public/gta6/alignment.json", json);
await save("src/gta6/alignment.json", json);
