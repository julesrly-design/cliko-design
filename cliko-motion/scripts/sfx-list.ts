// Exporte la liste des bruitages (src/sfx.ts) en SFX.md et sfx-cues.json, frames exactes à 60 fps.
// Usage : npm run sfx:list
import { writeFileSync } from "node:fs";
import { SFX_FILES } from "../src/sfx";
import { NEON_SFX_CUES as SFX_CUES } from "../src/neon/sfx";
import { BPM, VIDEO } from "../src/config";

const tc = (f: number) => {
  const s = f / VIDEO.fps;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`;
};
const BEAT = (VIDEO.fps * 60) / BPM;
const beat = (f: number) => (f % BEAT === 0 ? `temps ${f / BEAT + 1}` : f % (BEAT / 2) === 0 ? `croche (temps ${Math.floor(f / BEAT) + 1} +½)` : "");

const rows = SFX_CUES.map((c) => `| ${c.frame} | ${tc(c.frame)} | ${beat(c.frame)} | ${c.type} | ${SFX_FILES[c.type] ?? "—"} | ${c.gain ?? 1} | ${c.offset ?? 0} | ${c.note} |`);
const md = `# Bruitages — frames exactes (60 fps, 120 BPM)

Version néon (composition ClikoNeon). Généré depuis \`src/neon/sfx.ts\` par \`npm run sfx:list\`. Une noire = 30 frames, une croche = 15 frames.
\`offset\` : le son démarre ce nombre de frames avant l'événement, pour que son attaque tombe pile dessus.

| Frame | Temps | Grille | Type | Fichier | Gain | Offset | Événement |
|---:|---:|---|---|---|---:|---:|---|
${rows.join("\n")}
`;
writeFileSync("SFX.md", md);
writeFileSync("sfx-cues.json", JSON.stringify(SFX_CUES, null, 2));
console.log(`SFX.md : ${SFX_CUES.length} déclenchements`);
