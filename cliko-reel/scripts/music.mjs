// Musique via ElevenLabs Music (si l'offre y donne accès) → public/music/music.mp3
// Sinon : déposer assets/music.mp3. Sinon : pas de musique.
// Usage : DURATION_MS=40000 BREATH_AT_MS=20000 node --env-file=.env scripts/music.mjs
import { api, save } from "./eleven.mjs";

const total = Number(process.env.DURATION_MS ?? 40000);
const breath = Number(process.env.BREATH_AT_MS ?? 20000);

const sections = [
  { section_name: "Intro mécanique", positive_local_styles: ["mechanical percussive groove", "tight kick enters at the end"], negative_local_styles: ["vocals"], duration_ms: 2500, lines: [] },
  { section_name: "Groove", positive_local_styles: ["minimal house groove", "punchy kick", "crisp claps", "warm bass"], negative_local_styles: ["vocals"], duration_ms: breath - 2500, lines: [] },
  { section_name: "Respiration", positive_local_styles: ["sudden low-pass filter breakdown", "drums drop out", "warm pad"], negative_local_styles: ["vocals", "drums"], duration_ms: 1500, lines: [] },
  { section_name: "Reprise chaude", positive_local_styles: ["warm uplifting minimal house", "groove returns gradually"], negative_local_styles: ["vocals"], duration_ms: total - breath - 1500 - 4000, lines: [] },
  { section_name: "Final", positive_local_styles: ["confident outro", "clean ending on the downbeat"], negative_local_styles: ["vocals", "fade out"], duration_ms: 4000, lines: [] },
];

try {
  const audio = await api("/v1/music", {
    method: "POST",
    query: { output_format: "mp3_44100_192" },
    body: {
      model_id: "music_v1",
      composition_plan: {
        positive_global_styles: ["instrumental", "minimal house", "modern electronic", "122 BPM", "energetic", "premium brand ad"],
        negative_global_styles: ["vocals", "lyrics", "lo-fi", "cheesy"],
        sections,
      },
    },
    raw: true,
  });
  await save("public/music/music.mp3", audio);
} catch (e) {
  console.error("Musique ElevenLabs indisponible :", e.message.split("\n")[0]);
  process.exit(2);
}
