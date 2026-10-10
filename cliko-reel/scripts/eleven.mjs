// Client ElevenLabs minimal. La clé est lue depuis ELEVENLABS_API_KEY (variable de l'environnement cloud ou .env)
// et n'est jamais affichée. Si elle est stockée comme « secret réseau » de l'environnement, le proxy l'injecte
// lui-même dans les requêtes vers api.elevenlabs.io : on envoie alors la requête sans en-tête.
// Usage : node --env-file-if-exists=.env scripts/<script>.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const API = "https://api.elevenlabs.io";

export const key = () => process.env.ELEVENLABS_API_KEY ?? null;

export async function api(path, { method = "GET", body, query, raw = false } = {}) {
  const url = new URL(path, API);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: { ...(key() ? { "xi-api-key": key() } : {}), ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !key()) throw new Error("Clé ElevenLabs introuvable : ajouter ELEVENLABS_API_KEY à l'environnement (ou en secret réseau pour api.elevenlabs.io).");
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
