// Captures fixes haute définition des 3 démos interactives de cliko.be (Atelier Verso, Forno Nero, Maison Célest).
// Leur aperçu contient un rendu WebGL lourd : on prend des images nettes de chaque « feuille »,
// que la composition anime ensuite (défilement fluide dans les écrans des appareils).
//   public/captures/demos/<demo>-mobile-<n>.png   (mini-site seul, sans la ligne de prix du pied)
//   public/captures/demos/<demo>-desktop-<n>.png  (section complète en vue bureau)
// Usage : node scripts/capture-demos.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const SITE = process.env.SITE ?? "https://cliko.be";
const OUT = "public/captures/demos";
const DEMOS = ["atelier-verso", "forno-nero", "maison-celest"];
const SHEETS = 3;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });

async function run(view) {
  const opts = view === "mobile"
    ? { viewport: { width: 430, height: 932 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 };
  const ctx = await browser.newContext({ ...opts, locale: "fr-BE" });
  const page = await ctx.newPage();
  page.setDefaultTimeout(120000);
  await page.goto(SITE, { waitUntil: "networkidle", timeout: 90000 });
  const top = await page.evaluate(() => document.querySelector("#exemples").getBoundingClientRect().top + scrollY);
  await page.evaluate((v) => window.scrollTo(0, v), top);
  await page.waitForTimeout(1500);

  for (let d = 0; d < DEMOS.length; d++) {
    await page.locator("#exemples [role=tab]").nth(d).click();
    await page.waitForTimeout(2500);
    for (let s = 0; s < SHEETS; s++) {
      if (view === "mobile") {
        // cadre du mini-site : premier ancêtre du canvas assez grand ; on s'arrête avant la ligne « devis / chantiers / € »
        const clip = await page.evaluate(() => {
          const canvas = document.querySelector("#exemples canvas");
          let el = canvas;
          while (el && el.getBoundingClientRect().height < 700) el = el.parentElement;
          const r = el.getBoundingClientRect();
          const money = [...el.querySelectorAll("*")].find((n) => n.children.length === 0 && /€/.test(n.textContent));
          const bottom = money ? money.getBoundingClientRect().top - 24 : r.bottom;
          return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: Math.max(400, bottom - r.top) };
        });
        await page.evaluate((y) => window.scrollTo(0, y - 40), clip.y);
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `${OUT}/${DEMOS[d]}-mobile-${s + 1}.png`, clip, fullPage: true });
      } else {
        await page.evaluate((v) => window.scrollTo(0, v + 60), top);
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `${OUT}/${DEMOS[d]}-desktop-${s + 1}.png` });
      }
      console.log("→", view, DEMOS[d], s + 1);
      // feuille suivante (flèche ›)
      const next = page.locator("#exemples button", { hasText: "›" }).first();
      if (await next.count()) { await next.click(); await page.waitForTimeout(2200); }
    }
  }
  await ctx.close();
}

await run("mobile");
await run("desktop");
await browser.close();
