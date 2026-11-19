// Publie une vidéo sur YouTube (API Data v3, envoi « resumable »).
// Le jeton OAuth (portée youtube.upload) est injecté par le proxy de l'environnement pour www.googleapis.com :
// on n'envoie donc aucun en-tête Authorization ici. Sinon, le passer dans YT_TOKEN.
// Usage : NODE_USE_ENV_PROXY=1 node scripts/youtube-upload.mjs out/gta6-short.mp4 out/gta6-upload.json
import { readFile, stat } from "node:fs/promises";

const [file, metaFile] = process.argv.slice(2);
const meta = JSON.parse(await readFile(metaFile, "utf8"));
const auth = process.env.YT_TOKEN ? { authorization: `Bearer ${process.env.YT_TOKEN}` } : {};
const size = (await stat(file)).size;

const me = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: auth });
if (me.ok) {
  const j = await me.json();
  console.log("Chaîne :", j.items?.map((c) => c.snippet.title).join(", ") || "(aucune)");
} else console.log("Lecture de la chaîne impossible (portée upload seule ?) :", me.status);
if (process.env.DRY_RUN) process.exit(0);

const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
  method: "POST",
  headers: { ...auth, "content-type": "application/json; charset=UTF-8", "x-upload-content-type": "video/mp4", "x-upload-content-length": String(size) },
  body: JSON.stringify(meta),
});
if (!init.ok) throw new Error(`init ${init.status} ${await init.text()}`);
const location = init.headers.get("location");
const put = await fetch(location, { method: "PUT", headers: { ...auth, "content-type": "video/mp4", "content-length": String(size) }, body: await readFile(file) });
const out = await put.json();
if (!put.ok) throw new Error(`upload ${put.status} ${JSON.stringify(out)}`);
console.log("Publiée :", `https://youtube.com/shorts/${out.id}`, "·", out.status?.uploadStatus, "·", out.status?.privacyStatus);
