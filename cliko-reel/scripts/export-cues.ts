// Exporte la feuille de bruitages (src/motion/cues.ts) → public/motion/cues.json
import { writeFileSync } from "node:fs";
import { CUES } from "../src/motion/cues";
import { FPS, M } from "../src/motion/timeline";
writeFileSync("public/motion/cues.json", JSON.stringify({ fps: FPS, frames: M.total, cues: CUES }, null, 1));
console.log("→ public/motion/cues.json", CUES.length, "sons");
