// Planches de contrôle : captures à des temps donnés (en beats). Usage : node scripts/snap.mjs out/dir 1280x720 8 9 12.6 ...
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { mkdir } from "node:fs/promises";
const [dir, size, ...beats] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.on("console", (m) => m.type() === "error" || m.type() === "warning" ? console.log("console:", m.text()) : 0);
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto(`http://127.0.0.1:8765/demo/render.html?lang=${process.env.LANG2 || "fr"}`);
await page.evaluate(() => window.__ready);
const BEAT = await page.evaluate(() => ClikoIntro.BEAT);
for (const b of beats) {
  if (b === "gate") { await page.evaluate(() => window.__ck.gate()); }
  else await page.evaluate((t) => window.__ck.seek(t), Number(b) * BEAT);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: `${dir}/b${String(b).padStart(5, "0")}.png` });
}
await browser.close();
