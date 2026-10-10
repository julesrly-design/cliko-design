// Captures vidéo fluides de cliko.be → public/captures/<vue>-<plan>.mp4
// L'horloge de la page est pilotée (page.clock) : chaque image avance de 1/30 s exactement,
// quel que soit le temps de rendu. Le défilement et la souris sont interpolés image par image.
// Les démos interactives (rendu WebGL lourd) sont capturées à part : scripts/capture-demos.mjs.
// Usage : node scripts/capture.mjs [mobile|desktop] [plan...]
import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const SITE = process.env.SITE ?? "https://cliko.be";
const FPS = 30;
const OUT = "public/captures";

const VIEWS = {
  mobile: { viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 },
};

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const top = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + scrollY : null; }, sel);

// Plans : `from`/`to` = défilement (px absolus ou fonction), `tab` = onglet de démo à activer,
// `mouse` = trajet de la souris [x0,y0,x1,y1] (desktop), `seconds` = durée.
const SHOTS = {
  mobile: [
    { name: "hero", seconds: 5, from: 0, to: 0 },
    { name: "hero-scroll", seconds: 3, from: 0, to: 700 },
    { name: "eparpillee", seconds: 8, sel: "#services", span: 1, offset: 0 },
    { name: "deroule", seconds: 5, sel: "#le-deroule", span: 0.75, offset: 0 },
    { name: "partenaire", seconds: 5, sel: "#pourquoi-cliko", span: 0.6, offset: 0 },
  ],
  desktop: [
    { name: "hero", seconds: 5, from: 0, to: 0, mouse: [500, 420, 980, 380] },
    { name: "eparpillee", seconds: 8, sel: "#services", span: 1, offset: 0 },
  ],
};

async function shoot(view, only) {
  const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
  const ctx = await browser.newContext({ ...VIEWS[view], locale: "fr-BE", reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date("2026-10-10T10:00:00") });
  await page.goto(SITE, { waitUntil: "networkidle", timeout: 90000 });
  await page.clock.runFor(2000);
  // Parcourt toute la page une fois pour déclencher les apparitions au scroll.
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 250) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.clock.runFor(120); await page.waitForTimeout(30); }
  const vh = VIEWS[view].viewport.height;

  for (const shot of SHOTS[view]) {
    if (only.length && !only.includes(shot.name)) continue;
    let y0 = shot.from ?? 0;
    let y1 = shot.to ?? 0;
    if (shot.sel) {
      const t = await top(page, shot.sel);
      const sh = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, shot.sel);
      y0 = t + sh * (shot.offset ?? 0);
      y1 = shot.span !== undefined ? t + Math.max(0, sh * shot.span - vh) : y0 + (shot.drift ?? 0);
    }
    await page.evaluate((v) => window.scrollTo(0, v), y0);
    if (shot.tab !== undefined) {
      const tabs = page.locator("#exemples [role=tab]");
      await tabs.nth(shot.tab).click();
    }
    await page.clock.runFor(1500);
    await page.waitForTimeout(300);

    const dir = `${OUT}/.frames-${view}-${shot.name}`;
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    const n = Math.round(shot.seconds * FPS);
    for (let i = 0; i < n; i++) {
      const t = easeInOut(i / Math.max(1, n - 1));
      await page.evaluate((v) => window.scrollTo(0, v), y0 + (y1 - y0) * t);
      if (shot.mouse) {
        const [mx0, my0, mx1, my1] = shot.mouse;
        await page.mouse.move(mx0 + (mx1 - mx0) * t, my0 + (my1 - my0) * t);
      }
      await page.clock.runFor(1000 / FPS);
      await page.screenshot({ path: `${dir}/${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 92 });
    }
    const out = `${OUT}/${view}-${shot.name}.mp4`;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${dir}/%04d.jpg`,
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
    await rm(dir, { recursive: true, force: true });
    console.log("→", out);
  }
  await browser.close();
}

const args = process.argv.slice(2);
const views = args.filter((a) => a in VIEWS);
const only = args.filter((a) => !(a in VIEWS));
for (const v of views.length ? views : ["mobile", "desktop"]) await shoot(v, only);
