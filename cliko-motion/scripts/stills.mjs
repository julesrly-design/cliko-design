// Rend des images fixes de contrôle (un seul bundle, un seul navigateur).
// Usage : node scripts/stills.mjs [frames…]   (défaut : 0 60 240 600 1200 1700)
// Sortie : out/stills/frame-XXXX.png
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const frames = process.argv.slice(2).map(Number);
const list = frames.length ? frames : [0, 60, 240, 600, 1200, 1700];
const compId = process.env.COMP ?? "ClikoMotion";
const outDir = path.resolve("out/stills");
fs.mkdirSync(outDir, { recursive: true });

const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), webpackOverride: (c) => c });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions: { gl: "swangle" } });
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
const composition = await selectComposition({ serveUrl, id: compId, inputProps, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" } });
for (const frame of list) {
  const t0 = Date.now();
  const output = path.join(outDir, `${compId === "ClikoMotion" ? "frame" : compId}-${String(frame).padStart(4, "0")}${process.env.SUFFIX ?? ""}.png`);
  await renderStill({ serveUrl, composition, frame, output, inputProps, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" }, overwrite: true, timeoutInMilliseconds: 120000, onBrowserLog: process.env.LOG ? (l) => console.log(`[browser ${l.type}]`, l.text.slice(0, 400)) : undefined });
  console.log(`frame ${frame} → ${path.relative(process.cwd(), output)} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
await browser.close({ silent: true });
