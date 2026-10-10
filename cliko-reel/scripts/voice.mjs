// Génère la voix off complète (accroche A et B) via l'endpoint « with timestamps ».
// Chaque variante = 1 seule requête (prosodie continue). On écrit :
//   public/voice/voix-<A|B>.mp3 et public/voice/alignment-<A|B>.json (mots + scènes, en secondes)
// Usage : VOICE_ID=xxx node --env-file=.env scripts/voice.mjs
import { api, save, MODEL, VOICE_SETTINGS } from "./eleven.mjs";
import { HOOKS, BODY, DISPLAY, toSay } from "./script.mjs";

const voiceId = process.env.VOICE_ID;
if (!voiceId) throw new Error("VOICE_ID requis");

// Regroupe l'alignement caractère par caractère en mots.
function toWords(text, { characters, character_start_times_seconds: s, character_end_times_seconds: e }) {
  const words = [];
  let cur = null;
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { cur = null; return; }
    if (!cur) { cur = { text: "", start: s[i], end: e[i], charStart: i }; words.push(cur); }
    cur.text += ch; cur.end = e[i];
  });
  return words;
}

for (const variant of ["A", "B"]) {
  const parts = [{ scene: "accroche", say: HOOKS[variant] }, ...BODY];
  const text = parts.map((p) => toSay(p.say)).join(" ");
  const res = await api(`/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: "POST",
    query: { output_format: "mp3_44100_192" },
    body: { text, model_id: MODEL, voice_settings: VOICE_SETTINGS, language_code: "fr" },
  });
  await save(`public/voice/voix-${variant}.mp3`, Buffer.from(res.audio_base64, "base64"));
  const align = res.normalized_alignment ?? res.alignment;
  const words = toWords(text, align);

  // Rattache chaque mot à sa scène via les offsets caractères.
  let offset = 0;
  const bounds = parts.map((p) => { const b = { scene: p.scene, from: offset, to: offset + toSay(p.say).length }; offset = b.to + 1; return b; });
  for (const w of words) w.scene = bounds.find((b) => w.charStart >= b.from && w.charStart < b.to)?.scene;
  const scenes = bounds.map((b) => {
    const ws = words.filter((w) => w.scene === b.scene);
    return { scene: b.scene, start: ws[0].start, end: ws.at(-1).end };
  });
  await save(`public/voice/alignment-${variant}.json`, JSON.stringify({ variant, voiceId, model: MODEL, display: DISPLAY.map(([r, t]) => [r.source, t]), scenes, words }, null, 2));
}
