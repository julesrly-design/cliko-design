// Rendu vidéo image par image (le film est une fonction pure du temps) + bande-son hors ligne.
// Usage : node scripts/render-video.mjs 1920x1080 out/cliko-gta6-16x9.mp4 [fps]
import { createRequire } from "node:module";
import { mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const [size = "1920x1080", out = "out/cliko-gta6-16x9.mp4", fpsArg = "30"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const fps = Number(fpsArg);
const frames = path.join(process.env.FRAMES_DIR || tmpdir(), `ck-frames-${w}x${h}`);
await rm(frames, { recursive: true, force: true });
await mkdir(frames, { recursive: true });
const WORKERS = Number(process.env.WORKERS || 2);
let end = 0;
const t0 = Date.now();
async function worker(k) {
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(`http://127.0.0.1:8765/demo/render.html?glpx=${process.env.GLPX || 520000}`);
  await page.evaluate(() => window.__ready);
  end = await page.evaluate(() => ClikoIntro.VIDEO_END);
  const N = Math.ceil(end * fps);
  for (let i = k; i < N; i += WORKERS) {
    await page.evaluate((t) => window.__ck.seek(t), i / fps);
    await page.screenshot({ path: `${frames}/f${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 93 });
    if (k === 0 && i % 60 === 0) console.log(`${size} ${i}/${N} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await browser.close();
}
await Promise.all([...Array(WORKERS).keys()].map(worker));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", `${frames}/f%05d.jpg`, "-i", "out/cliko-intro-music.wav",
  "-t", String(end), "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "slow", "-movflags", "+faststart",
  "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", out], { stdio: "inherit" });
await rm(frames, { recursive: true, force: true });
console.log("→", out);
