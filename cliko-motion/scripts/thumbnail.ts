// Miniature (couverture du Reel) : la frame THUMBNAIL_FRAME de config.ts → out/miniature.png
// Usage : npm run thumbnail
import { execFileSync } from "node:child_process";
import { THUMBNAIL_FRAME } from "../src/config";

execFileSync("npx", ["remotion", "still", "src/index.ts", "ClikoMotion", "out/miniature.png", `--frame=${THUMBNAIL_FRAME}`, "--image-format=png"], { stdio: "inherit" });
