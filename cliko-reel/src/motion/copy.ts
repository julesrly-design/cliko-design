// Textes et rythmes partagés entre les scènes et la feuille de bruitages (cues.ts). Aucun import React ici.
import { M } from "./timeline";

const L = M.light;

export type Line = { at: number; next: number; dir: number; size: number; rows: string[][]; accent: string };
export const LINES: Line[] = [
  { at: L.from + 2, next: L.l2, dir: 1, size: 112, rows: [["Un", "site", "qui", "vous"], ["ressemble."]], accent: "ressemble." },
  { at: L.l2 + 2, next: L.l3, dir: -1, size: 90, rows: [["Hébergé,", "mis", "à", "jour,"], ["en", "3 langues."]], accent: "3 langues." },
  { at: L.l3 + 2, next: L.l4, dir: 1, size: 108, rows: [["Vous", "parlez", "à"], ["Jules & Louis."]], accent: "Jules & Louis." },
];
// instant d'apparition du j-ième mot d'une ligne
export const wordAt = (line: Line, j: number) => line.at + 2 + j * 3.5;

export const BRIEF_TEXT = "Je veux un site pour ma pizzeria.";
export const ASK1 = { text: "Plus sobre ?", from: M.styles.ask1, to: M.styles.ask1 + 14 };
export const ASK2 = { text: "Plus chic ?", from: M.styles.ask2, to: M.styles.ask2 + 12 };

export const HEAD = [["Votre", "commerce"], ["mérite", "d'être"], ["trouvé."]];
export const HEAD_STEP = 0.95; // frames entre deux lettres du titre final
