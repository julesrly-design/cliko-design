// Exporte la timeline (scènes + mots, en secondes) en JSON pour le moteur audio.
// Usage : npx tsx scripts/export-timeline.ts  → public/timeline-A.json, public/timeline-B.json
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { buildTimeline, estimateWords, mergePunct, Word } from "../src/timeline";

for (const variant of ["A", "B"] as const) {
  const aligned = `public/voice/alignment-${variant}.json`;
  const words: Word[] = existsSync(aligned) ? mergePunct(JSON.parse(readFileSync(aligned, "utf8")).words) : estimateWords(variant);
  const tl = buildTimeline(words);
  writeFileSync(`public/timeline-${variant}.json`, JSON.stringify({ variant, source: existsSync(aligned) ? "elevenlabs" : "estimation", ...tl }, null, 2));
  console.log(`→ public/timeline-${variant}.json (${tl.total.toFixed(2)} s)`);
}
