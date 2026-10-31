// Mesure des mots (contours réels de Clash Display via opentype.js) pour placer précisément
// le fil autour d'un mot. Doit correspondre à la mise en page de <Words>.
import { layoutLine } from "../lib/fonts";

export type WordBox = { word: string; x0: number; x1: number; cx: number };

export const measureLine = (text: string, size: number, cx: number): { words: WordBox[]; width: number } => {
  const words = text.split(" ");
  const gap = size * 0.26;
  // <Words> applique letter-spacing −0,035 em à chaque lettre, y compris la dernière
  const widths = words.map((w) => layoutLine(w, size).width + -0.035 * size);
  const width = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = cx - width / 2;
  return {
    width,
    words: words.map((w, i) => {
      const box = { word: w, x0: x, x1: x + widths[i], cx: x + widths[i] / 2 };
      x += widths[i] + gap;
      return box;
    }),
  };
};
