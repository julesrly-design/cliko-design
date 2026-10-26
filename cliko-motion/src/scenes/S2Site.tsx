// SCÈNE 2 · LE SITE SE CONSTRUIT (0:02,5 → 0:07)
// La ligne plonge vers le fond ; une fenêtre de navigateur en verre surgit en rotation 3D.
// La ligne fait le tour du cadre (les bords s'allument derrière elle), puis file vers chaque
// bloc qui s'emboîte à son contact (header, image, titres, boutons) avec des ressorts rebondis.
// Texte tracé par la ligne : « On crée ton site. » puis « Sur mesure. ».
import React, { useMemo } from "react";
import * as THREE from "three";
import { MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import { PALETTE, SAFE, SCENES, TEXT } from "../config";
import { fitSize, layoutLine } from "../lib/fonts";
import { registerCamera, registerTransition } from "../lib/camera";
import type { TrackBuilder } from "../lib/track";
import { clamp, cubicInOut, expoInOut, lerp, linear, shot, shotBrake, sineInOut, springAt, type V3 } from "../lib/math";
import { pxToLocal, pxToWorld, PX, REF } from "../lib/world";
import { applyM, objectMatrix, useMatrixProps } from "../lib/scene";
import { useGlobalFrame, useSceneFrame } from "../lib/seq";
import { SceneOverlay } from "../overlay/SceneOverlay";
import { TracedText, passTimes, type PlacedLine } from "../overlay/TracedText";
import { GlowPath, pointAlong, roundedRectPath, transformPts } from "../three/GlowPath";
import { registerLineBoost } from "../three/Line";

const ID = "site" as const;
const S = SCENES.site;

// ── Fenêtre ────────────────────────────────────────────────────────────────
const WIN = { cx: 500, cy: 680, w: 780 / PX, h: 560 / PX, r: 0.14, depth: 0.09 };
const winCenter = pxToLocal(WIN.cx, WIN.cy);

// Matrice monde de la fenêtre à la frame locale lf : surgit en rotation, puis flotte.
export const windowMatrix = (lf: number) => {
  const s = springAt(lf - 14, { stiffness: 95, damping: 12 });
  const ry = lerp(1.35, -0.17, s) + 0.035 * Math.sin(lf * 0.028);
  const rx = lerp(-0.55, 0.08, s) + 0.02 * Math.sin(lf * 0.021 + 1);
  const z = lerp(-9, 0, s);
  const sc = lerp(0.35, 1, Math.min(1, s * 1.2));
  return objectMatrix(ID, [winCenter[0], winCenter[1] + 0.03 * Math.sin(lf * 0.035), z], [rx, ry, 0], sc);
};

const PERIM = roundedRectPath(WIN.w + 0.06, WIN.h + 0.06, WIN.r + 0.03).map((p) => [p[0], p[1], WIN.depth / 2 + 0.01] as V3);
const TRACE = { f0: 40, f1: 82 }; // tour du cadre (frames locales)
const traceEase = (t: number) => cubicInOut(t) * 0.75 + t * 0.25;

// Blocs du site (coordonnées locales de la fenêtre) et leur frame d'apparition.
type Block = { pos: V3; size: [number, number]; r: number; t: number; kind: "dot" | "bar" | "pill" | "image" | "amber" | "outline" | "mist" };
const top = WIN.h / 2;
const left = -WIN.w / 2;
const BLOCKS: Block[] = [
  // barre du navigateur (présente dès l'apparition)
  { pos: [left + 0.24, top - 0.19, 0], size: [0.1, 0.1], r: 0.05, t: 20, kind: "dot" },
  { pos: [left + 0.4, top - 0.19, 0], size: [0.1, 0.1], r: 0.05, t: 22, kind: "dot" },
  { pos: [left + 0.56, top - 0.19, 0], size: [0.1, 0.1], r: 0.05, t: 24, kind: "dot" },
  { pos: [0.25, top - 0.19, 0], size: [1.9, 0.17], r: 0.085, t: 26, kind: "outline" },
  // header : logo + navigation
  { pos: [left + 0.62, top - 0.56, 0], size: [0.62, 0.16], r: 0.08, t: 90, kind: "amber" },
  { pos: [0.55, top - 0.56, 0], size: [0.34, 0.07], r: 0.035, t: 93, kind: "mist" },
  { pos: [1.0, top - 0.56, 0], size: [0.34, 0.07], r: 0.035, t: 95, kind: "mist" },
  { pos: [1.45, top - 0.56, 0], size: [0.34, 0.07], r: 0.035, t: 97, kind: "mist" },
  // image héros
  { pos: [0.92, -0.32, 0], size: [1.62, 1.62], r: 0.1, t: 105, kind: "image" },
  // titres
  { pos: [left + 1.0, 0.36, 0], size: [1.62, 0.17], r: 0.05, t: 120, kind: "bar" },
  { pos: [left + 0.82, 0.1, 0], size: [1.26, 0.17], r: 0.05, t: 124, kind: "bar" },
  { pos: [left + 0.92, -0.2, 0], size: [1.46, 0.065], r: 0.03, t: 130, kind: "mist" },
  { pos: [left + 0.74, -0.34, 0], size: [1.1, 0.065], r: 0.03, t: 132, kind: "mist" },
  // boutons
  { pos: [left + 0.6, -0.76, 0], size: [0.8, 0.24], r: 0.12, t: 138, kind: "amber" },
  { pos: [left + 1.45, -0.76, 0], size: [0.72, 0.24], r: 0.12, t: 144, kind: "outline" },
];
const FRONT_Z = WIN.depth / 2 + 0.045;
// Les arrêts de la tête : un par groupe de blocs.
const STOPS = [
  { t: 90, at: [left + 0.62, top - 0.56, FRONT_Z + 0.1] as V3 },
  { t: 105, at: [0.92, -0.32, FRONT_Z + 0.15] as V3 },
  { t: 121, at: [left + 1.0, 0.36, FRONT_Z + 0.1] as V3 },
  { t: 131, at: [left + 0.9, -0.27, FRONT_Z + 0.1] as V3 },
  { t: 139, at: [left + 0.6, -0.76, FRONT_Z + 0.1] as V3 },
  { t: 145, at: [left + 1.45, -0.76, FRONT_Z + 0.1] as V3 },
];

// ── Texte ──────────────────────────────────────────────────────────────────
let layoutCache: PlacedLine[] | null = null;
export const siteLayout = () => {
  if (layoutCache) return layoutCache;
  const maxW = 1080 - SAFE.left - SAFE.right - 40;
  const cx = (SAFE.left + 1080 - SAFE.right) / 2;
  const s1 = fitSize([TEXT.site.line1], maxW, 92);
  const s2 = fitSize([TEXT.site.line2], maxW, 138);
  const l1 = layoutLine(TEXT.site.line1, s1);
  const l2 = layoutLine(TEXT.site.line2, s2);
  layoutCache = [
    { line: l1, x: cx - l1.width / 2, baseline: 1150 },
    { line: l2, x: cx - l2.width / 2, baseline: 1150 + s2 * 1.08, accent: [0, l2.glyphs.length] },
  ];
  return layoutCache;
};
const TEXT_T = { l1: [152, 170], l2: [180, 198] } as const;

// ── Trajet de la ligne ─────────────────────────────────────────────────────
const W2 = (px: number, py: number, z = 0) => pxToWorld(ID, px, py, z);

export const siteLine = (T: TrackBuilder) => {
  const f = (lf: number) => S.start + lf;
  // plongée depuis la scène 1 jusqu'au coin de la fenêtre qui surgit
  const corner = applyM(windowMatrix(TRACE.f0), PERIM[0]);
  T.go(f(TRACE.f0), [W2(620, 1000, -6), W2(380, 760, -1.5), corner], shot);
  // tour du cadre : la tête suit la fenêtre en mouvement
  T.fn(f(TRACE.f1), (u, fr) => applyM(windowMatrix(fr - S.start), pointAlong(PERIM, u)), traceEase);
  // la tête « pose » chaque bloc
  for (const s of STOPS) T.go(f(s.t), [applyM(windowMatrix(s.t), s.at)], shotBrake);
  // écrit les deux lignes de texte
  const [l1, l2] = siteLayout();
  const through = (pl: PlacedLine): V3[] =>
    pl.line.glyphs.filter((g) => !g.empty).map((g, j) => W2(pl.x + (g.x0 + g.x1) / 2, pl.baseline - pl.line.capHeight * (j % 2 ? 0.7 : 0.3), j % 2 ? 0.2 : -0.1));
  const first = (pl: PlacedLine) => pl.x + pl.line.glyphs[0].x0;
  const last = (pl: PlacedLine) => pl.x + pl.line.glyphs[pl.line.glyphs.length - 1].x1;
  T.go(f(TEXT_T.l1[0]), [W2(first(l1) - 50, l1.baseline - l1.line.capHeight / 2, 0.5)], shot);
  T.go(f(TEXT_T.l1[1]), [...through(l1), W2(last(l1) + 30, l1.baseline - l1.line.capHeight / 2)], (t) => (linear(t) + sineInOut(t)) / 2);
  T.go(f(TEXT_T.l2[0]), [W2(last(l1) + 10, l1.baseline + 60, 1), W2(first(l2) - 50, l2.baseline - l2.line.capHeight / 2, 0.4)], shot);
  T.go(f(TEXT_T.l2[1]), [...through(l2), W2(last(l2) + 36, l2.baseline - l2.line.capHeight * 0.4)], (t) => (linear(t) + sineInOut(t)) / 2);
  // arc lent qui remonte le long de la fenêtre (rien n'est jamais immobile)
  T.go(f(246), [W2(last(l2) + 70, l2.baseline - 200, 0.6), W2(900, 980, 0.9), W2(905, 560, 0.6)], sineInOut);
  T.hold(f(252), 0.03);
};

// ── Caméra ─────────────────────────────────────────────────────────────────
export const siteSetup = () => {
  registerCamera(ID, (lf) => {
    const k = clamp(lf / 270);
    return { pos: [0.7 * Math.sin(lf / 110) - 0.3, 0.15 + 0.2 * k, REF.distance + 0.6 - 0.9 * expoInOut(k) * 0.5 - k * 0.4], look: [0, 0.15, 0] };
  });
  // whip-pan vers la droite : la ligne file vers les cartes de services
  registerTransition({ at: SCENES.services.start, pre: 12, post: 22, ease: expoInOut, rollKick: -0.1 });
  registerLineBoost(S.start + TRACE.f1 - 6, S.start + TRACE.f1 + 10, 1.6);
};

// ── 3D ─────────────────────────────────────────────────────────────────────
const heroTexture = () => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const bg = g.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, "#141c46");
  bg.addColorStop(0.55, "#2a2f6e");
  bg.addColorStop(1, "#c77a3c");
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 512);
  const sun = g.createRadialGradient(330, 330, 10, 330, 330, 190);
  sun.addColorStop(0, "rgba(255,226,170,1)");
  sun.addColorStop(0.25, "rgba(255,196,107,.85)");
  sun.addColorStop(1, "rgba(255,196,107,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, 512, 512);
  // relief stylisé (collines) devant le soleil
  g.fillStyle = "#0b1020";
  g.beginPath();
  g.moveTo(0, 420);
  g.bezierCurveTo(120, 340, 220, 400, 300, 380);
  g.bezierCurveTo(380, 360, 450, 300, 512, 330);
  g.lineTo(512, 512);
  g.lineTo(0, 512);
  g.fill();
  g.fillStyle = "#151c3a";
  g.beginPath();
  g.moveTo(0, 470);
  g.bezierCurveTo(160, 420, 300, 470, 512, 430);
  g.lineTo(512, 512);
  g.lineTo(0, 512);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const BlockMesh: React.FC<{ b: Block; lf: number; hero: THREE.Texture }> = ({ b, lf, hero }) => {
  const s = springAt(lf - b.t, { stiffness: 210, damping: 11 });
  if (s <= 0.001) return null;
  const z = FRONT_Z + (1 - s) * 0.9;
  const [w, h] = b.size;
  const mat = (() => {
    switch (b.kind) {
      case "amber":
        return <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.55} roughness={0.35} metalness={0.1} toneMapped />;
      case "bar":
        return <meshStandardMaterial color={PALETTE.text} emissive={PALETTE.text} emissiveIntensity={0.35} roughness={0.4} />;
      case "mist":
        return <meshStandardMaterial color={PALETTE.mist} emissive={PALETTE.mist} emissiveIntensity={0.12} roughness={0.5} transparent opacity={0.8} />;
      case "dot":
        return <meshStandardMaterial color={PALETTE.mist} emissive={PALETTE.mist} emissiveIntensity={0.25} roughness={0.3} />;
      case "outline":
        return <meshStandardMaterial color="#1a2140" emissive={PALETTE.grid} emissiveIntensity={0.12} roughness={0.25} metalness={0.4} transparent opacity={0.85} />;
      case "image":
        return <meshStandardMaterial map={hero} emissiveMap={hero} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.5} />;
    }
  })();
  return (
    <group position={[b.pos[0], b.pos[1], z]} scale={[lerp(0.4, 1, Math.min(1.2, s)), lerp(0.4, 1, Math.min(1.2, s)), 1]}>
      {b.kind === "dot" ? (
        <mesh>
          <sphereGeometry args={[b.r, 24, 12]} />
          {mat}
        </mesh>
      ) : (
        <RoundedBox args={[w, h, 0.035]} radius={Math.min(b.r, h / 2 - 0.001, 0.017)} smoothness={3} bevelSegments={2}>
          {mat}
        </RoundedBox>
      )}
    </group>
  );
};

export const Site3D: React.FC = () => {
  const lf = useSceneFrame();
  const hero = useMemo(heroTexture, []);
  const m = windowMatrix(lf);
  const props = useMatrixProps(m);
  const visible = lf > 14;
  const perimWorld = () => transformPts(PERIM, windowMatrix(lf));
  const traced = traceEase(clamp((lf - TRACE.f0) / (TRACE.f1 - TRACE.f0)));
  return (
    <>
      {visible && (
        <group {...props}>
          <RoundedBox args={[WIN.w, WIN.h, WIN.depth]} radius={WIN.r} smoothness={5}>
            <MeshTransmissionMaterial
              transmission={1}
              thickness={0.35}
              roughness={0.1}
              ior={1.32}
              chromaticAberration={0.08}
              anisotropicBlur={0.15}
              distortion={0.08}
              distortionScale={0.4}
              temporalDistortion={0}
              samples={6}
              resolution={768}
              backside={false}
              color={PALETTE.glass}
              attenuationColor="#9fb0ff"
              attenuationDistance={2.5}
              envMapIntensity={1.4}
            />
          </RoundedBox>
          {/* panneau sombre derrière le contenu : la fenêtre se lit comme une surface */}
          <RoundedBox args={[WIN.w - 0.06, WIN.h - 0.06, 0.01]} radius={WIN.r - 0.03} smoothness={4} position={[0, 0, -WIN.depth / 2 - 0.02]}>
            <meshPhysicalMaterial color="#0d1330" roughness={0.6} metalness={0.2} transparent opacity={0.72} emissive={PALETTE.bgGlow} emissiveIntensity={0.25} />
          </RoundedBox>
          {/* séparateur sous la barre d'adresse */}
          <mesh position={[0, top - 0.37, FRONT_Z - 0.03]}>
            <planeGeometry args={[WIN.w - 0.1, 0.008]} />
            <meshBasicMaterial color={PALETTE.mist} transparent opacity={0.25} />
          </mesh>
          {BLOCKS.map((b, i) => (
            <BlockMesh key={i} b={b} lf={lf} hero={hero} />
          ))}
        </group>
      )}
      {/* bords lumineux : tracés par la tête, puis lueur installée */}
      <GlowPath points={perimWorld} progress={traced} width={0.022} intensity={0.9} front={7} />
    </>
  );
};

// ── Calque texte ───────────────────────────────────────────────────────────
let timesCache: number[][] | null = null;
export const SiteOverlay: React.FC = () => {
  const frame = useGlobalFrame();
  const lf = useSceneFrame();
  const lines = siteLayout();
  const times = useMemo(() => (timesCache ??= passTimes(ID, lines, [[S.start + TEXT_T.l1[0] - 2, S.start + TEXT_T.l1[1] + 1], [S.start + TEXT_T.l2[0] - 2, S.start + TEXT_T.l2[1] + 1]])), [lines]);
  const exit = clamp((lf - 258) / 10);
  return (
    <SceneOverlay id={ID}>
      <TracedText frame={frame} lines={lines} times={times} exit={exit} />
    </SceneOverlay>
  );
};
