// Client ElevenLabs minimal. La clé est lue depuis .env (ELEVENLABS_API_KEY) et n'est jamais affichée.
// Usage : node --env-file=.env scripts/<script>.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const API = "https://api.elevenlabs.io";

export const key = () => {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) {
    console.error("ELEVENLABS_API_KEY manquante dans cliko-reel/.env");
    process.exit(1);
  }
  return k;
};

export async function api(path, { method = "GET", body, query, raw = false } = {}) {
  const url = new URL(path, API);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: { "xi-api-key": key(), ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url.pathname} -> ${res.status} ${await res.text()}`);
  return raw ? Buffer.from(await res.arrayBuffer()) : res.json();
}

export async function save(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  console.log("→", path);
}

// Réglages orientés expressivité (Eleven v3 : stability 0 = Creative, 0.5 = Natural).
export const MODEL = process.env.ELEVEN_MODEL ?? "eleven_v3";
export const VOICE_SETTINGS = { stability: 0.3, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true };
