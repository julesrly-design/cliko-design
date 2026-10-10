// STOP 1 — Génère l'accroche A avec plusieurs voix françaises candidates.
// 1) `node --env-file=.env scripts/voice-casting.mjs list` : liste les voix FR de la bibliothèque (jeunes, énergiques).
// 2) `node --env-file=.env scripts/voice-casting.mjs gen <voiceId1> <voiceId2> <voiceId3>` : génère public/voice/casting/*.mp3
import { api, save, MODEL, VOICE_SETTINGS } from "./eleven.mjs";
import { HOOKS, toSay } from "./script.mjs";

const [cmd, ...ids] = process.argv.slice(2);

if (cmd === "list") {
  const seen = new Map();
  for (const use_case of ["social_media", "advertisement", "narrative_story", undefined]) {
    const { voices } = await api("/v1/shared-voices", {
      query: { language: "fr", page_size: 50, use_cases: use_case, sort: "trending" },
    });
    for (const v of voices) seen.set(v.voice_id, v);
  }
  const rows = [...seen.values()]
    .filter((v) => !/old|elderly/i.test(v.age ?? ""))
    .map((v) => ({
      id: v.voice_id, owner: v.public_owner_id, name: v.name, gender: v.gender, age: v.age,
      accent: v.accent, use: v.use_case, desc: (v.descriptive ?? "") + " | " + (v.description ?? "").slice(0, 140),
      cloned: v.cloned_by_count, preview: v.preview_url,
    }));
  await save("public/voice/casting/candidates.json", JSON.stringify(rows, null, 2));
  console.table(rows.slice(0, 40).map(({ preview, desc, ...r }) => r));
} else if (cmd === "gen") {
  for (const id of ids) {
    const audio = await api(`/v1/text-to-speech/${id}`, {
      method: "POST",
      query: { output_format: "mp3_44100_192" },
      body: { text: toSay(HOOKS.A), model_id: MODEL, voice_settings: VOICE_SETTINGS, language_code: "fr" },
      raw: true,
    });
    await save(`public/voice/casting/accroche-${id}.mp3`, audio);
  }
} else {
  console.log("usage: voice-casting.mjs list | gen <voiceId...>");
}
