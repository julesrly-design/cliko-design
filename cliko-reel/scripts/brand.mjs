// Extraction de l'identité Cliko depuis cliko.be (si le code source du site n'est pas disponible) :
// couleurs (variables CSS + couleurs calculées dominantes), polices, logo (SVG/IMG), photo de Jules et Louis.
// → public/brand/brand.json + fichiers téléchargés. Usage : node scripts/brand.mjs
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";

const SITE = process.env.SITE ?? "https://cliko.be";
await mkdir("public/brand", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(SITE, { waitUntil: "networkidle" });

const info = await page.evaluate(() => {
  const vars = {};
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) if (r.selectorText === ":root") for (const p of r.style) if (p.startsWith("--")) vars[p] = r.style.getPropertyValue(p).trim();
  }
  const count = (prop) => {
    const m = {};
    for (const el of document.querySelectorAll("body *")) { const v = getComputedStyle(el)[prop]; if (v && v !== "rgba(0, 0, 0, 0)") m[v] = (m[v] ?? 0) + 1; }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 12);
  };
  const fonts = [...new Set([...document.querySelectorAll("h1,h2,h3,p,a,button")].map((e) => getComputedStyle(e).fontFamily))];
  const logo = document.querySelector('header svg, [class*="logo"] svg, img[alt*="liko" i], [class*="logo"] img');
  const imgs = [...document.querySelectorAll("img")].map((i) => ({ src: i.currentSrc || i.src, alt: i.alt }));
  return { vars, colors: count("color"), backgrounds: count("backgroundColor"), fonts, logo: logo?.outerHTML?.slice(0, 20000), imgs,
    fontFaces: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style}`) };
});
await writeFile("public/brand/brand.json", JSON.stringify(info, null, 2));
if (info.logo?.startsWith("<svg")) await writeFile("public/brand/logo.svg", info.logo);
const team = info.imgs.find((i) => /jules|louis|équipe|team|fondateur/i.test(i.alt + i.src));
if (team) await writeFile(`public/brand/jules-louis.${team.src.split(".").pop().split("?")[0]}`, Buffer.from(await (await fetch(team.src)).arrayBuffer()));
console.log("fonts:", info.fontFaces, "\nteam photo:", team?.src ?? "introuvable");
await browser.close();
