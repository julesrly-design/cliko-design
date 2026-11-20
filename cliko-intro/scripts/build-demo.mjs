// Pages de démo : demo/index.html (locale, polices embarquées) et out/cliko-intro-demo.html (autonome, Google Fonts).
import { readFile, writeFile } from "node:fs/promises";
const tpl = await readFile("demo/template.html", "utf8");
const bundle = (await readFile("dist/cliko-intro.js", "utf8")).replace(/<\/script/gi, "<\\/script");
const gf = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400..700&family=Schibsted+Grotesk:wght@400..900&display=swap">';
await writeFile("out/cliko-intro-demo.html", tpl.replace("<!--FONTS-->", gf).replace("/*BUNDLE*/", () => bundle));
const local = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${tpl
  .replace("<!--FONTS-->", '<link rel="stylesheet" href="fonts.css">')
  .replace("<script>/*BUNDLE*/</script>", '<script src="../dist/cliko-intro.js"></script>')}\n</html>`;
await writeFile("demo/index.html", local.replace("<title>", "<title>").replace("<header>", "</head><body><header>").replace(/<\/html>$/, "</body></html>"));
console.log("ok");
