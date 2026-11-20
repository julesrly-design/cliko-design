// Test d'intégration sur le VRAI cliko.be : le bundle est injecté dans la page de production (CSP comprise),
// puis on vérifie que le site fonctionne avant, pendant et après l'intro.
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
const { chromium, devices } = createRequire(import.meta.url)("playwright");
const SITE = process.env.SITE || "https://cliko.be";
const bundle = await readFile("dist/cliko-intro.js", "utf8");
await mkdir("out/check", { recursive: true });
const ok = (c, m) => console.log(`${c ? "✓" : "✗"} ${m}`) || (c || (process.exitCode = 1));

async function run(name, ctxOpts, startAt) {
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // la balise Cloudflare Insights est bloquée par la CSP du site lui-même (préexistant, sans lien avec l'intro)
  page.on("console", (m) => m.type() === "error" && !/GL Driver|cloudflareinsights/.test(m.text()) && errors.push(m.text()));
  await page.goto(SITE, { waitUntil: "networkidle" });
  // inline script = autorisé par la CSP du site ('unsafe-inline'), comme le serait /cliko-intro.js ('self')
  await page.addScriptTag({ content: bundle });
  await page.evaluate((t) => ClikoIntro.play({ startAt: t }), startAt || 0);
  await page.waitForTimeout(400);
  const W = ctxOpts.viewport.width;
  await page.screenshot({ path: `out/check/${name}-1-gate.png` });
  ok(await page.evaluate(() => !!document.querySelector("[data-cliko-intro]")), `${name}: l'intro est montée sur cliko.be`);
  ok(await page.evaluate(() => !!document.querySelector("main")?.closest("[inert]")), `${name}: le contenu du site est inerte pendant l'intro (lecteurs d'écran, tabulation)`);
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(500);
  ok((await page.evaluate(() => scrollY)) === y0, `${name}: la molette ne fait pas défiler le site derrière l'intro (Lenis bloqué)`);
  await page.evaluate(() => document.querySelector("[data-cliko-intro]").shadowRoot.querySelector(".play").click());
  await page.waitForTimeout(startAt ? 900 : 3200);
  await page.screenshot({ path: `out/check/${name}-2-play.png` });
  const audio = await page.evaluate(() => typeof AudioContext !== "undefined");
  ok(audio, `${name}: Web Audio disponible`);
  // sortie : bouton CTA si la signature est à l'écran, sinon « Passer »
  const sel = startAt ? ".go-site" : ".skip";
  await page.evaluate((s) => document.querySelector("[data-cliko-intro]").shadowRoot.querySelector(s).click(), sel);
  await page.waitForTimeout(startAt ? 250 : 450);
  await page.screenshot({ path: `out/check/${name}-3-exit.png` });
  await page.waitForTimeout(1200);
  ok(await page.evaluate(() => !document.querySelector("[data-cliko-intro]")), `${name}: l'intro se retire complètement`);
  ok(await page.evaluate(() => !document.querySelector("main")?.closest("[inert]") && document.documentElement.style.overflow === ""), `${name}: inert et overflow restaurés`);
  await page.mouse.wheel(0, 1600);
  await page.waitForTimeout(1200);
  ok((await page.evaluate(() => scrollY)) > 300, `${name}: le site défile normalement après l'intro`);
  await page.screenshot({ path: `out/check/${name}-4-site.png` });
  ok(await page.evaluate(() => sessionStorage.getItem("cliko-intro:v1") !== null), `${name}: mémorisé pour la session (pas de rediffusion à chaque page)`);
  ok(await page.evaluate(() => ClikoIntro.mount() === null), `${name}: pas de seconde diffusion dans la même session`);
  ok(errors.length === 0, `${name}: aucune erreur JavaScript${errors.length ? " — " + errors.join(" | ") : ""}`);
  void W;
  await browser.close();
}
await run("desktop", { viewport: { width: 1440, height: 900 } }, 0);
await run("desktop-fin", { viewport: { width: 1440, height: 900 } }, 33);
await run("mobile", { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } }, 0);
