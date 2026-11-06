// Feuille de bruitages du film motion design, sans musique : chaque son est calé sur la frame exacte de son geste.
// Exportée en JSON par scripts/export-cues.ts, puis mixée par scripts/mix_sfx.py → public/motion/sfx-mix.wav.
import { random } from "remotion";
import { M } from "./timeline";
import { ASK1, ASK2, BRIEF_TEXT, HEAD, HEAD_STEP, LINES, wordAt } from "./copy";

export type Cue = { s: string; f: number; db: number; st?: number; dur?: number; fadeIn?: number; fadeOut?: number; end?: boolean };

const cues: Cue[] = [];
const c = (s: string, f: number, db = 0, st = 0, extra: Partial<Cue> = {}) => cues.push({ s, f, db, st, ...extra });
// variation de hauteur (demi-tons) et de volume, déterministe
const vary = (k: string, amt = 1.2) => (random(k) - 0.5) * 2 * amt;
const pick = <T,>(k: string, arr: T[]) => arr[Math.floor(random(k) * arr.length) % arr.length];

const S = M.styles;
const L = M.light;
const E = M.end;

// ---- ambiance : la flamme gronde sous toutes les scènes sombres ----
c("fire", 0, -16, 0, { dur: L.from - 0, fadeIn: 20, fadeOut: 2 });
c("fire", E.from, -20, -2, { dur: M.total - E.from, fadeIn: 10, fadeOut: 40 });

// ---- 1 · allumage ----
c("whooshDeep", 0, -4);
c("sub", M.ignite.dot - 1, -2);
c("ignite", M.ignite.dot - 2, 0);
c("sparkle", M.ignite.dot + 3, -2);
c("snap", M.ignite.dot, -4, 3);
for (let o = 0; o < 5; o++) c(pick(`il${o}`, ["tick1", "tick2"]), M.ignite.letters + o * 3 + 2, -4, 2 - o * 0.6);
c("swoosh", M.ignite.letters - 2, -8);
c("rise", M.ignite.out - 2, -2);

// ---- 2 · puces ----
c("whip", M.chips.from - 1, 0);
c("swoosh", M.chips.from, -4);
const rows = [6, 5, 6];
rows.forEach((n, ri) => {
  for (let ci = 0; ci < n; ci++) {
    if (ri === 1 && ci === 2) continue;
    c(pick(`ct${ri}${ci}`, ["tick1", "tick2", "pop"]), M.chips.from + ci * 1.5 + ri * 2 + 3, -5 + vary(`cv${ri}${ci}`, 2), vary(`cp${ri}${ci}`, 2.5));
  }
});
c("pop", M.chips.from + 5, -3, 2);
c("swish", M.chips.from + 26, -3);
c("swish", M.chips.from + 40, -6, 1);
c("hover", M.chips.click - 9, -2);
c("click", M.chips.click, 3);
c("snap", M.chips.click + 1, -3);
c("whoosh", M.chips.click + 2, 0);
c("swoosh", M.chips.click + 4, -4, 1);
c("morph", M.chips.click + 5, 0);
c("swish", M.chips.click + 6, -6);

// ---- 3 · brief : une touche par caractère ----
{
  const { type, typeEnd, send } = M.brief;
  const per = (typeEnd - type) / BRIEF_TEXT.length;
  BRIEF_TEXT.split("").forEach((ch, i) => {
    const s = ch === " " ? "key3" : pick(`k${i}`, ["key1", "key2"]);
    c(s, type + i * per, -1 + vary(`kv${i}`, 2.5), vary(`kp${i}`, 1.5));
  });
  c("swish", typeEnd - 4, -4);
  c("hover", send - 6, -4);
  c("click", send, 3);
  c("send", send + 1, 0);
  c("rise", send + 3, 0);
  c("riser", M.drop, -2, 0, { end: true });
}

// ---- 4 · drop, tunnel de code, maquette ----
c("impact", M.drop, 2);
c("sub", M.drop, 0);
c("glitch", M.drop + 1, -2);
c("data", M.drop + 3, -4);
for (let i = 0; i < 18; i++) {
  const z0 = -2600 - random(`z${i}`) * 2200;
  const speed = 95 + random(`v${i}`) * 50;
  const pass = M.drop - 10 - z0 / speed;
  if (pass > M.drop && pass < M.scan + 4) c(pick(`wp${i}`, ["whoosh", "swish", "whip"]), pass - 3, -6 + vary(`wv${i}`, 2), vary(`wps${i}`, 2));
}
for (let i = 0; i < 7; i++) {
  c("snap", M.drop + 8 + i * 4 + 7, -2 + vary(`sv${i}`, 1.5), vary(`sp${i}`, 2));
  c("blip", M.drop + 8 + i * 4 + 7, -12, i * 1.2);
}
c("swoosh", M.drop + 2, -6);
c("scan", M.scan - 1, 0);
c("sparkle", M.scan + 14, -2);
c("thud", M.scan + 16, -4);

// ---- 5 · trois styles ----
for (const [ask, flip, k] of [[ASK1, S.flip1, "a"], [ASK2, S.flip2, "b"]] as const) {
  const per = (ask.to - ask.from) / ask.text.length;
  ask.text.split("").forEach((ch, i) => c(ch === " " ? "key3" : pick(`${k}k${i}`, ["key1", "key2"]), ask.from + i * per, -2 + vary(`${k}v${i}`, 2), vary(`${k}p${i}`, 1.5)));
  c("click", flip - 5, 2);
  c("send", flip - 4, -2);
  c("whip", flip - 1, 2);
  c("flip", flip + 4, 0);
  c("swoosh", flip, -4, 2);
  c("thud", flip + 12, -2);
  c("sparkle", flip + 9, -6);
}
for (let i = 0; i < 13; i++) c(pick(`so${i}`, ["tick1", "tick2"]), S.flip1 + 6 + i * 2 + 3, -8 + vary(`sov${i}`, 2), vary(`sop${i}`, 3));
c("whoosh", S.from + 1, -6);
c("pop", S.from + 6, -4);
c("whooshDeep", S.out - 4, 0);
c("rise", S.out + 2, -2);

// ---- 6 · clair : un tic par mot, un coup de marqueur par mot-clé ----
c("hit", L.from, 3);
c("impact", L.from, -2);
c("sub", L.from, -4);
LINES.forEach((line, li) => {
  const words = line.rows.flat();
  words.forEach((w, j) => {
    const at = wordAt(line, j);
    c(pick(`lw${li}${j}`, ["tick1", "tick2", "pop"]), at + 2, -2 + vary(`lwv${li}${j}`, 1.5), vary(`lwp${li}${j}`, 2.5));
    if (w === line.accent) c("marker", at + 5, 0);
  });
  c("whip", line.next - 6, 2);
  c("whoosh", line.next - 4, -4);
});
[L.from - 1, L.l2 - 8, L.l3 - 8, L.l4 - 6].forEach((at, i) => c("swoosh", at + 4, -2, i - 1));
c("pop", L.l4 + 2, -2);
c("pillPop", L.pill + 1, 2);
c("morph", L.pill, -4);
c("flip", L.stack1, 2);
c("pillPop", L.stack1 + 4, 0, 2);
c("flip", L.stack2, 2, 1);
c("pillPop", L.stack2 + 4, 0, 4);
c("swish", M.brand.from - 3, -2);

// ---- 7 · aplat ambre ----
c("whooshDeep", M.brand.from - 2, 0);
c("rise", M.brand.from, -2);
c("hit", M.brand.pill, 2);
c("pillPop", M.brand.pill + 1, 0, -2);
c("sparkle", M.brand.pill + 6, -2);
c("whooshDeep", M.brand.dive, 2);
c("riser", M.brand.dive + 2, -6, 3, { end: true });

// ---- 8 · plan final : chaque lettre du titre fait « tic » ----
c("impact", E.from, 2);
c("sub", E.from, -2);
c("ignite", E.logo - 2, -2);
c("snap", E.logo, -2, 3);
for (let o = 0; o < 5; o++) c(pick(`el${o}`, ["tick1", "tick2"]), E.logo + 8 + o * 3 + 2, -5, 2 - o * 0.6);
let j = 0;
HEAD.flat().forEach((word, wi) => {
  word.split("").forEach((_, ci) => {
    const at = E.line + j++ * HEAD_STEP;
    if (j % 2 === 1) c(pick(`h${wi}${ci}`, ["tick1", "tick2", "key2"]), at + 5, -6 + vary(`hv${wi}${ci}`, 2), 2 + vary(`hp${wi}${ci}`, 3));
  });
});
c("swoosh", E.line, -4);
c("ding", E.line + 32, -2);
c("pop", E.cta + 2, -2);
c("ding", E.cta, -4, 5);
c("pillPop", E.cta + 6, 2);
c("sparkle", E.cta + 12, -4);
c("click", 736, 0);
c("sparkle", 738, -6, 3);

export const CUES = cues.sort((a, b) => a.f - b.f);
