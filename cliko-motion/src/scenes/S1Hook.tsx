// SCÈNE 1 · HOOK (0:00 → 0:02,5)
// Le point de lumière est déjà là au centre (la vidéo boucle), se charge, puis part comme une balle
// et écrit « Ton commerce est invisible en ligne ? ». Les lettres se remplissent après son passage,
// impact sur le point du « ? » (tremblement + étincelles), soulignement de « invisible »,
// puis la ligne plonge vers le fond et entraîne la caméra.
import React, { useMemo } from "react";
import { SCENES, TEXT, SAFE } from "../config";
import { fitSize, layoutLine } from "../lib/fonts";
import { registerCamera, registerShake, registerTransition } from "../lib/camera";
import type { TrackBuilder } from "../lib/track";
import { expoInOut, linear, shot, shotBrake, sineInOut, type V3 } from "../lib/math";
import { pxToLocal, pxToWorld, toWorld, REF } from "../lib/world";
import { registerBurst } from "../three/sparks";
import { registerLineBoost } from "../three/Line";
import { useGlobalFrame, useSceneFrame } from "../lib/seq";
import { SceneOverlay } from "../overlay/SceneOverlay";
import { TracedText, passTimes, type PlacedLine } from "../overlay/TracedText";
import { clamp } from "../lib/math";

const S = SCENES.hook;
const ID = "hook" as const;
export const HOOK_START: V3 = [0, 0, 0]; // centre de l'écran, plan de la scène

// ── Mise en page (px, caméra de référence) ─────────────────────────────────
let layoutCache: PlacedLine[] | null = null;
export const hookLayout = () => {
  if (layoutCache) return layoutCache;
  const lines = TEXT.hook.lines;
  const maxW = 1080 - SAFE.left - SAFE.right - 40;
  const size = fitSize(lines, maxW, 150);
  const lh = size * 1.02;
  const cx = (SAFE.left + (1080 - SAFE.right)) / 2;
  const blockCenter = 860;
  const laid = lines.map((l) => layoutLine(l, size));
  const cap = laid[0].capHeight;
  const top = blockCenter - (lh * (lines.length - 1) + cap) / 2;
  layoutCache = laid.map((line, i) => {
    const words = lines[i].split(" ");
    let accent: [number, number] | undefined;
    const wi = words.indexOf(TEXT.hook.accent);
    if (wi >= 0) {
      const start = words.slice(0, wi).join(" ").length + (wi > 0 ? 1 : 0);
      accent = [start, start + TEXT.hook.accent.length];
    }
    return { line, x: cx - line.width / 2, baseline: top + cap + i * lh, accent };
  });
  return layoutCache;
};

const L = (px: number, py: number, z = 0) => pxToWorld(ID, px, py, z);

// Points de passage à travers une ligne de texte : la tête ondule dans les lettres.
const weave = (pl: PlacedLine, until = Infinity) => {
  const cap = pl.line.capHeight;
  const pts: V3[] = [];
  let j = 0;
  for (const g of pl.line.glyphs) {
    if (g.empty || g.char === "?" || g.x0 > until) continue;
    const cx = pl.x + (g.x0 + g.x1) / 2;
    pts.push(L(cx, pl.baseline - cap * (j % 2 ? 0.72 : 0.3), j % 2 ? 0.25 : -0.15));
    j++;
  }
  return pts;
};

// ── Trajet de la ligne ─────────────────────────────────────────────────────
const smoothLinear = (t: number) => (linear(t) + sineInOut(t)) / 2;

export const hookLine = (T: TrackBuilder) => {
  const [l1, l2, l3] = hookLayout();
  const cap = l1.line.capHeight;
  const size = l1.line.size;
  const first = (pl: PlacedLine) => pl.x + pl.line.glyphs[0].x0;
  const last = (pl: PlacedLine) => pl.x + pl.line.glyphs[pl.line.glyphs.length - 1].x1;

  T.hold(S.start + 12, 0.03); // le point se charge au centre
  // départ « balle » vers le début de la première ligne
  T.go(S.start + 22, [L(first(l1) - 60, l1.baseline - cap * 0.5, 0.4)], shot);
  T.go(S.start + 42, [...weave(l1), L(last(l1) + 34, l1.baseline - cap * 0.45, 0.2)], smoothLinear);
  // retour à la ligne en boucle, avec un peu de profondeur
  T.go(S.start + 50, [L((first(l2) + last(l1)) / 2, (l1.baseline + l2.baseline) / 2 + cap * 0.3, 1.4), L(first(l2) - 50, l2.baseline - cap * 0.5, 0.3)], shot);
  T.go(S.start + 70, [...weave(l2), L(last(l2) + 34, l2.baseline - cap * 0.45, 0.2)], smoothLinear);
  T.go(S.start + 77, [L((first(l3) + last(l2)) / 2, (l2.baseline + l3.baseline) / 2 + cap * 0.3, 1.4), L(first(l3) - 50, l3.baseline - cap * 0.5, 0.3)], shot);

  // « en ligne » puis le crochet du « ? » et l'impact sur son point, pile sur le temps (f90)
  const q = l3.line.glyphs.find((g) => g.char === "?");
  const qx0 = l3.x + (q?.x0 ?? 0);
  const qx1 = l3.x + (q?.x1 ?? 0);
  const qm = (qx0 + qx1) / 2;
  const b3 = l3.baseline;
  T.go(S.start + 85, weave(l3, qx0 - 1), smoothLinear);
  T.go(S.start + 89, [L(qx0, b3 - cap * 0.8), L(qm, b3 - cap * 1.02), L(qx1, b3 - cap * 0.75), L(qm, b3 - cap * 0.42), L(qm, b3 - cap * 0.3)], linear);
  T.go(S.start + 90, [L(qm, b3 - cap * 0.06)], linear); // impact

  // rebond, puis soulignement de « invisible »
  const acc = l2.accent ?? [0, l2.line.glyphs.length];
  const ux0 = l2.x + l2.line.glyphs[acc[0]].x0;
  const ux1 = l2.x + l2.line.glyphs[acc[1] - 1].x1;
  const uy = l2.baseline + size * 0.17;
  T.go(S.start + 97, [L(qm + 40, b3 - cap * 0.9, 1.2), L(ux0 - 30, uy + 6, 0.2)], shotBrake);
  T.go(S.start + 112, [L((ux0 + ux1) / 2, uy + 3), L(ux1 + 10, uy)], shot);
  T.hold(S.start + 122, 0.04);
  // boucle serrée puis plongée vers le fond (la scène 2 récupère la ligne)
  T.go(S.start + 132, [L(ux1 + 70, uy - 70, 0.6), L(ux1 + 20, uy - 150, 1.2), L(560, 1000, 2.2)], shot);
};

export const hookUnderline = () => {
  const [, l2] = hookLayout();
  const acc = l2.accent ?? [0, 1];
  return {
    x0: l2.x + l2.line.glyphs[acc[0]].x0,
    x1: l2.x + l2.line.glyphs[acc[1] - 1].x1,
    y: l2.baseline + l2.line.size * 0.17,
  };
};

// ── Caméra, impacts ────────────────────────────────────────────────────────
export const hookSetup = () => {
  // caméra de référence, très légère poussée avant (rien n'est jamais statique)
  registerCamera(ID, (t) => {
    const k = expoInOut(clamp(t / 140)) * 0.25 + clamp(t / 140) * 0.35;
    return { pos: [0, 0, REF.distance - k], look: [0, 0, 0] };
  });
  // plongée : la caméra suit la ligne vers la scène 2 (chase cam)
  registerTransition({ at: SCENES.site.start, pre: 16, post: 34, ease: expoInOut, arc: [0, 0.8, 0], rollKick: 0.08 });

  const [, , l3] = hookLayout();
  const q = l3.line.glyphs.find((g) => g.char === "?");
  const qm = l3.x + ((q?.x0 ?? 0) + (q?.x1 ?? 0)) / 2;
  registerShake(S.start + 90, 0.018, 7);
  registerBurst(S.start + 90, toWorld(ID, pxToLocal(qm, l3.baseline - l3.line.capHeight * 0.06)), 70, 0.13, 34, 0.3);
  registerLineBoost(S.start + 3, S.start + 16, 1.9); // le point se charge
  registerLineBoost(S.start + 86, S.start + 100, 2.4); // impact
};

// ── Calque texte ───────────────────────────────────────────────────────────
let timesCache: number[][] | null = null;

export const HookOverlay: React.FC = () => {
  const frame = useGlobalFrame();
  const t = useSceneFrame();
  const lines = hookLayout();
  const times = useMemo(() => (timesCache ??= passTimes(ID, lines, [[S.start + 20, S.start + 43], [S.start + 49, S.start + 71], [S.start + 76, S.start + 91]])), [lines]);
  const u = hookUnderline();
  // soulignement persistant laissé par la ligne sous « invisible »
  const ul = clamp((t - 99) / 13);
  return (
    <SceneOverlay id={ID}>
      <TracedText frame={frame} lines={lines} times={times} />
      {ul > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="hook-ul" x1="0" x2="1">
              <stop offset="0" stopColor="#FFE1A8" stopOpacity={0.2} />
              <stop offset="1" stopColor="#FFC46B" />
            </linearGradient>
          </defs>
          <path d={`M ${u.x0 - 30} ${u.y + 6} Q ${(u.x0 + u.x1) / 2} ${u.y + 3} ${u.x1 + 10} ${u.y}`} stroke="url(#hook-ul)" strokeWidth={6} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ul} style={{ filter: "drop-shadow(0 0 10px rgba(255,196,107,.8))" }} />
        </svg>
      )}
    </SceneOverlay>
  );
};
