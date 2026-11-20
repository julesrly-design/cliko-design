// Rendu hors ligne de la bande-son (même partition que la lecture en direct) → out/cliko-intro-music.wav
import { createRequire } from "node:module";
import { writeFile, mkdir } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const out = process.argv[2] || "out/cliko-intro-music.wav";
await mkdir("out", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto("http://127.0.0.1:8765/demo/render.html");
await page.evaluate(() => window.__ready);
const b64 = await page.evaluate(async () => {
  const buf = await ClikoIntro.renderOffline(ClikoIntro.VIDEO_END + 1.5, 48000);
  const n = buf.length, ch = 2, data = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); data.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE"); w(12, "fmt ");
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true); data.setUint32(24, 48000, true);
  data.setUint32(28, 48000 * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true); w(36, "data"); data.setUint32(40, n * ch * 2, true);
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    data.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    data.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  console.log("peak", peak);
  const bytes = new Uint8Array(data.buffer);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
});
await writeFile(out, Buffer.from(b64, "base64"));
console.log("→", out);
await browser.close();
