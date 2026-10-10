// Captures vidéo fluides de cliko.be (mobile haute résolution + desktop) → public/captures/*.mp4
// Méthode : défilement déterministe image par image (screenshot à chaque pas) puis assemblage ffmpeg 30 fps,
// pour un mouvement parfaitement régulier, sans saccade d'encodage.
// Usage : node scripts/capture.mjs [mobile|desktop]
import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const SITE = process.env.SITE ?? "https://cliko.be";
const FPS = 30;

const VIEWS = {
  mobile: { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
};

// Plans à capturer : ancre textuelle (regex) + durée du défilement.
const SHOTS = [
  { name: "hero", anchor: null, seconds: 3, distance: 0.6 },
  { name: "eparpillee", anchor: /éparpillée/i, seconds: 4, distance: 0.8 },
  { name: "demo-atelier-verso", anchor: /Atelier Verso/i, seconds: 3, distance: 0.6, click: true },
  { name: "demo-forno-nero", anchor: /Forno Nero/i, seconds: 3, distance: 0.6, click: true },
  { name: "demo-maison-celest", anchor: /Maison C[ée]lest/i, seconds: 3, distance: 0.6, click: true },
  { name: "deroule", anchor: /(déroulé|comment ça marche|étapes)/i, seconds: 4, distance: 1.2 },
  { name: "partenaire", anchor: /Un partenaire, pas un prestataire/i, seconds: 4, distance: 0.8 },
];

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function shoot(view) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...VIEWS[view], locale: "fr-BE", reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const vh = VIEWS[view].viewport.height;

  for (const shot of SHOTS) {
    let startY = 0;
    if (shot.anchor) {
      const el = page.getByText(shot.anchor).first();
      if (!(await el.count())) { console.warn(`[${view}] ancre introuvable : ${shot.anchor}`); continue; }
      if (shot.click) await el.click({ trial: false }).catch(() => {});
      await page.waitForTimeout(800);
      startY = await el.evaluate((n) => n.getBoundingClientRect().top + window.scrollY - 80);
    }
    const dir = `public/captures/.frames-${view}-${shot.name}`;
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    const n = shot.seconds * FPS;
    const dist = shot.distance * vh;
    for (let i = 0; i < n; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), startY + dist * ease(i / (n - 1)));
      await page.waitForTimeout(1000 / FPS);
      await page.screenshot({ path: `${dir}/${String(i).padStart(4, "0")}.png` });
    }
    const out = `public/captures/${view}-${shot.name}.mp4`;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${dir}/%04d.png`,
      "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", out]);
    await rm(dir, { recursive: true, force: true });
    console.log("→", out);
  }
  await browser.close();
}

const views = process.argv.slice(2).length ? process.argv.slice(2) : ["mobile", "desktop"];
for (const v of views) await shoot(v);
