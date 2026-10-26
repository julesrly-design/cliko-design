// Chargement des polices : FontFace pour le HTML, opentype.js pour obtenir les contours
// vectoriels des lettres (la ligne trace leur contour avant que le texte se remplisse).
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import opentype from "opentype.js";
import { FONTS } from "../config";

let parsed: { display: opentype.Font; displayBold: opentype.Font; body: opentype.Font } | null = null;
let loading: Promise<void> | null = null;

export const fontsReady = () => parsed !== null;

export const loadAllFonts = () => {
  if (loading) return loading;
  const faces: Promise<unknown>[] = [];
  for (const [weight, file] of Object.entries(FONTS.display.files)) {
    faces.push(loadFont({ family: FONTS.display.family, url: staticFile(`fonts/${file}`), weight }));
  }
  for (const [weight, file] of Object.entries(FONTS.body.files)) {
    faces.push(loadFont({ family: FONTS.body.family, url: staticFile(`fonts/${file}`), weight }));
  }
  const parse = async (file: string) => opentype.parse(await (await fetch(staticFile(`fonts/${file}`))).arrayBuffer());
  loading = Promise.all([
    Promise.all(faces),
    parse(FONTS.display.files[600]),
    parse(FONTS.display.files[700]),
    parse(FONTS.body.files[500]),
  ]).then(([, display, displayBold, body]) => {
    parsed = { display, displayBold, body };
  });
  return loading;
};

export const getFonts = () => {
  if (!parsed) throw new Error("Polices pas encore chargées (loadAllFonts)");
  return parsed;
};

export const CSS_FONT = {
  display: `"${FONTS.display.family}", "Inter", sans-serif`,
  body: `"${FONTS.body.family}", sans-serif`,
};

// ── Mise en page d'une ligne de texte en glyphes vectoriels ─────────────────
export type Glyph = { char: string; d: string; x0: number; x1: number; empty: boolean };
export type TextLine = { glyphs: Glyph[]; width: number; size: number; ascent: number; capHeight: number };

export const layoutLine = (text: string, size: number, opts: { bold?: boolean; tracking?: number } = {}): TextLine => {
  const f = opts.bold ? getFonts().displayBold : getFonts().display;
  const scale = size / f.unitsPerEm;
  const track = (opts.tracking ?? FONTS.displayTracking) * size;
  const glyphs: Glyph[] = [];
  let x = 0;
  const chars = Array.from(text);
  const gs = chars.map((c) => f.charToGlyph(c));
  gs.forEach((g, i) => {
    const path = g.getPath(x, 0, size);
    const bb = path.getBoundingBox();
    const adv = (g.advanceWidth ?? 0) * scale;
    const empty = chars[i] === " " || !isFinite(bb.x1) || bb.x2 - bb.x1 <= 0;
    glyphs.push({ char: chars[i], d: path.toPathData(2), x0: empty ? x : bb.x1, x1: empty ? x + adv : bb.x2, empty });
    const kern = i < gs.length - 1 ? f.getKerningValue(g, gs[i + 1]) * scale : 0;
    x += adv + kern + (i < gs.length - 1 ? track : 0) + (chars[i] === " " ? size * 0.09 : 0);
  });
  const capG = f.charToGlyph("H").getPath(0, 0, size).getBoundingBox();
  return { glyphs, width: x, size, ascent: (f.ascender / f.unitsPerEm) * size, capHeight: -capG.y1 };
};

// Taille maximale pour que la ligne la plus longue tienne dans `maxWidth`.
export const fitSize = (lines: string[], maxWidth: number, maxSize: number, bold = false) => {
  const w = Math.max(...lines.map((l) => layoutLine(l, 100, { bold }).width));
  return Math.min(maxSize, (maxWidth / w) * 100);
};
