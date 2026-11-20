import * as esbuild from "esbuild";
const watch = process.argv.includes("--watch");
const common = { entryPoints: ["src/index.js"], bundle: true, target: ["es2020", "safari14"], legalComments: "none", logLevel: "info" };
const builds = [
  { ...common, outfile: "dist/cliko-intro.js", format: "iife", minify: true, sourcemap: false },
  { ...common, entryPoints: ["src/intro.js"], outfile: "dist/cliko-intro.esm.js", format: "esm", minify: true },
  { ...common, outfile: "dist/cliko-intro.debug.js", format: "iife", minify: false },
];
if (watch) for (const b of builds) (await esbuild.context(b)).watch();
else for (const b of builds) await esbuild.build(b);
