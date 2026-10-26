// SCÈNE 3 · LES SERVICES (0:07 → 0:13)
// Whip-pan. Quatre cartes en verre dépoli disposées en arc 3D, qui flottent. La ligne file de
// l'une à l'autre en zigzag en faisant le tour de chacune : la carte s'allume, son icône chromée
// tourne, son titre apparaît. La caméra descend le long de l'arc en orbite légère.
import React from "react";
import { MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import { PALETTE, SCENES, TEXT } from "../config";
import { registerCamera, registerTransition } from "../lib/camera";
import type { TrackBuilder } from "../lib/track";
import { clamp, cubicOut, expoInOut, lerp, shot, shotBrake, sineInOut, smoothstep, springAt, type V3 } from "../lib/math";
import { PX, REF } from "../lib/world";
import { applyM, objectMatrix, useMatrixProps } from "../lib/scene";
import { useSceneFrame } from "../lib/seq";
import { PlaneOverlay } from "../overlay/SceneOverlay";
import { GlowPath, pointAlong, roundedRectPath, transformPts } from "../three/GlowPath";
import { Icon3D, type IconKind } from "../three/Icons";
import { registerLineBoost } from "../three/Line";
import { CSS_FONT } from "../lib/fonts";

const ID = "services" as const;
const S = SCENES.services;

const CARD = { w: 3.1, h: 1.22, d: 0.07, r: 0.16 };
const ICONS: IconKind[] = ["code", "server", "shield", "chat"];
// Disposition en arc : zigzag horizontal, l'arc recule aux extrémités.
const LAYOUT: { pos: V3; rot: V3 }[] = [
  { pos: [-0.42, 2.85, -0.7], rot: [-0.16, 0.2, 0.02] },
  { pos: [0.02, 0.95, -0.1], rot: [-0.05, -0.2, -0.015] },
  { pos: [-0.42, -0.95, -0.1], rot: [0.05, 0.2, 0.015] },
  { pos: [0.02, -2.85, -0.7], rot: [0.16, -0.2, -0.02] },
];
// Frames locales où la tête passe sur chaque carte (elle s'allume) : un temps sur deux.
export const LIGHT = [45, 105, 165, 225];

export const cardMatrix = (i: number, lf: number) => {
  const L = LAYOUT[i];
  const enter = springAt(lf + 14 - i * 4, { stiffness: 80, damping: 12 });
  const lit = springAt(lf - LIGHT[i], { stiffness: 180, damping: 10 });
  const bob = 0.05 * Math.sin(lf * 0.045 + i * 1.7);
  const pop = 1 + 0.06 * Math.sin(Math.PI * clamp(lit)) * (1 - clamp((lf - LIGHT[i]) / 30));
  return objectMatrix(
    ID,
    [L.pos[0] + (1 - enter) * (i % 2 ? 3 : -3), L.pos[1] + bob, L.pos[2] - (1 - enter) * 4],
    [L.rot[0] + 0.03 * Math.sin(lf * 0.03 + i), L.rot[1] + (1 - enter) * 0.9 + 0.04 * Math.sin(lf * 0.025 + i * 2), L.rot[2]],
    pop * lerp(0.6, 1, enter),
  );
};

// Demi-contour parcouru par la tête sur la carte i (alternance gauche → droite / droite → gauche).
const halfPerimeter = (i: number): V3[] => {
  const full = roundedRectPath(CARD.w + 0.1, CARD.h + 0.1, CARD.r + 0.05).map((p) => [p[0], p[1], CARD.d / 2 + 0.03] as V3);
  // full démarre en haut à gauche et tourne en sens horaire
  const n = full.length;
  const idxLeftMid = full.findIndex((p, k) => k > n * 0.7 && p[0] < -CARD.w / 2 && p[1] <= 0.0);
  const idxRightMid = full.findIndex((p) => p[0] > CARD.w / 2 && p[1] <= 0.0);
  if (i % 2 === 0) {
    // gauche (milieu) → haut → droite (milieu)
    return [...full.slice(idxLeftMid), ...full.slice(0, idxRightMid + 1)];
  }
  // droite (milieu) → bas → gauche (milieu)
  return full.slice(idxRightMid, idxLeftMid + 1);
};
const HALF = [0, 1, 2, 3].map(halfPerimeter);
const RECT = roundedRectPath(CARD.w + 0.1, CARD.h + 0.1, CARD.r + 0.05).map((p) => [p[0], p[1], CARD.d / 2 + 0.03] as V3);

// Passage sur une carte : rapide aux bords, freine au milieu (sur le titre), repart en flèche.
const brakeMid = (t: number) => {
  const x = 2 * t - 1;
  return 0.5 + 0.5 * Math.sign(x) * Math.pow(Math.abs(x), 1.7);
};
const PASS = 28; // durée du passage sur une carte (frames)

export const servicesLine = (T: TrackBuilder) => {
  const f = (lf: number) => S.start + lf;
  for (let i = 0; i < 4; i++) {
    const t0 = LIGHT[i] - PASS / 2;
    const start = (fr: number) => applyM(cardMatrix(i, fr - S.start), HALF[i][0]);
    // trajet jusqu'au début du demi-contour (whip pour la 1re carte, zigzag ensuite)
    T.go(f(t0), [lerpV3(T.end, start(f(t0)), 0.5, i === 0 ? [0, 1.2, 2.5] : [0, 0, 0.9]), start(f(t0))], i === 0 ? shotBrake : shot);
    T.fn(f(t0 + PASS), (u, fr) => applyM(cardMatrix(i, fr - S.start), pointAlong(HALF[i], u)), brakeMid);
  }
  // la tête tourne autour de l'icône de la dernière carte, puis plonge vers le sol (scène 4)
  const iconAt = (fr: number, a: number, r: number): V3 => applyM(cardMatrix(3, fr - S.start), [-CARD.w / 2 + 0.6 + r * Math.cos(a), r * Math.sin(a) * 0.8, 0.55 + r * Math.sin(a) * 0.35]);
  const endHalf = applyM(cardMatrix(3, LIGHT[3] + PASS / 2), HALF[3][HALF[3].length - 1]);
  const orbitStart = iconAt(f(LIGHT[3] + PASS / 2 + 12), Math.PI, 0.75);
  T.go(f(LIGHT[3] + PASS / 2 + 12), [lerpV3(endHalf, orbitStart, 0.5, [0, -0.3, 0.4]), orbitStart], shot);
  const o0 = LIGHT[3] + PASS / 2 + 12;
  T.fn(f(o0 + 60), (u, fr) => iconAt(fr, Math.PI + u * Math.PI * 4, 0.75 - 0.2 * Math.sin(Math.PI * u)), sineInOut);
};

const lerpV3 = (a: V3, b: V3, t: number, off: V3 = [0, 0, 0]): V3 => [lerp(a[0], b[0], t) + off[0], lerp(a[1], b[1], t) + off[1], lerp(a[2], b[2], t) + off[2]];

export const servicesSetup = () => {
  registerCamera(ID, (lf) => {
    // descend le long de l'arc en suivant la carte active, avec une orbite lente
    const k = smoothstep(20, 300, lf);
    const lookY = lerp(1.55, -1.45, k);
    const orbit = lerp(-0.28, 0.22, sineInOut(clamp(lf / 360)));
    const d = REF.distance - 0.4;
    return { pos: [Math.sin(orbit) * d, lookY + 0.45, Math.cos(orbit) * d - 0.2], look: [-0.1, lookY, -0.3], roll: 0.02 * Math.sin(lf / 70) };
  });
  // plongée vers le sol : la caméra bascule à la verticale (vue de dessus)
  registerTransition({ at: SCENES.forWho.start, pre: 30, post: 16, ease: expoInOut, arc: [-2, 9, 0] });
  for (const l of LIGHT) registerLineBoost(S.start + l - 6, S.start + l + 12, 1.5);
};

// ── 3D ─────────────────────────────────────────────────────────────────────
const Card: React.FC<{ i: number; lf: number }> = ({ i, lf }) => {
  const m = cardMatrix(i, lf);
  const props = useMatrixProps(m);
  const lit = clamp((lf - LIGHT[i] + 4) / 10);
  const spin = springAt(lf - LIGHT[i] + 2, { stiffness: 60, damping: 9 });
  const halfProg = clamp((lf - (LIGHT[i] - PASS / 2)) / PASS);
  const traced = brakeMid(halfProg);
  const settle = clamp((lf - LIGHT[i] - PASS / 2) / 20);
  return (
    <>
      <group {...props}>
        <RoundedBox args={[CARD.w, CARD.h, CARD.d]} radius={CARD.r} smoothness={5}>
          <MeshTransmissionMaterial
            transmissionSampler
            transmission={1}
            thickness={0.2}
            roughness={0.38}
            ior={1.3}
            chromaticAberration={0.05}
            anisotropicBlur={0.3}
            color={PALETTE.glass}
            envMapIntensity={1.2}
            emissive={PALETTE.bgGlow}
            emissiveIntensity={0.06 + lit * 0.1}
          />
        </RoundedBox>
        <group position={[-CARD.w / 2 + 0.6, 0, 0.35]} rotation={[0.1, spin * Math.PI * 2 + 0.25 * Math.sin(lf * 0.03 + i), 0]} scale={0.62 + lit * 0.05}>
          <Icon3D kind={ICONS[i]} glow={lit * (1 - settle * 0.6)} />
        </group>
      </group>
      <GlowPath points={() => transformPts(HALF[i], cardMatrix(i, lf))} progress={traced} width={0.02} intensity={0.8} front={6} />
      <GlowPath points={() => transformPts(RECT, cardMatrix(i, lf))} progress={1} width={0.014} intensity={0.35 * settle} front={0} fade={settle} />
    </>
  );
};

export const Services3D: React.FC = () => {
  const lf = useSceneFrame();
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} i={i} lf={lf} />
      ))}
    </>
  );
};

// ── Titres (HTML net, posé sur la face de chaque carte) ────────────────────
const CW = Math.round(CARD.w * PX);
const CH = Math.round(CARD.h * PX);
const cardCorners = (i: number, lf: number): [V3, V3, V3, V3] => {
  const m = cardMatrix(i, lf);
  const z = CARD.d / 2 + 0.002;
  return [applyM(m, [-CARD.w / 2, CARD.h / 2, z]), applyM(m, [CARD.w / 2, CARD.h / 2, z]), applyM(m, [CARD.w / 2, -CARD.h / 2, z]), applyM(m, [-CARD.w / 2, -CARD.h / 2, z])];
};

export const ServicesOverlay: React.FC = () => {
  const lf = useSceneFrame();
  return (
    <>
      {TEXT.services.map((title, i) => {
        const a = lf - LIGHT[i];
        if (a < -2) return null;
        // apparition : masque qui glisse + flou → net, micro-dépassement
        const p = cubicOut(clamp((a + 2) / 14));
        const s = springAt(a + 2, { stiffness: 200, damping: 12 });
        // la 1re carte cède sa place quand la 4e s'allume (6 mots max à l'écran)
        const out = i === 0 ? clamp((lf - LIGHT[3] + 8) / 10) : 0;
        const exit = clamp((lf - 330) / 10);
        const size = title.length > 14 ? 50 : 58;
        return (
          <PlaneOverlay key={i} corners={cardCorners(i, lf)} w={CW} h={CH}>
            <div style={{ position: "absolute", left: 218, top: 0, bottom: 0, right: 24, display: "flex", flexDirection: "column", justifyContent: "center", opacity: (1 - out) * (1 - exit) }}>
              <div style={{ fontFamily: CSS_FONT.body, fontWeight: 500, fontSize: 20, letterSpacing: "0.16em", color: PALETTE.accent, opacity: p, marginBottom: 8 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ overflow: "hidden", paddingBottom: 6 }}>
                <div
                  style={{
                    fontFamily: CSS_FONT.display,
                    fontWeight: 600,
                    fontSize: size,
                    lineHeight: 1.0,
                    letterSpacing: "-0.03em",
                    color: PALETTE.text,
                    transform: `translateY(${(1 - p) * 70}%) scale(${lerp(1.12, 1, s)})`,
                    transformOrigin: "0% 100%",
                    filter: `blur(${(1 - p) * 8}px)`,
                    textShadow: `0 0 ${24 * (1 - clamp(a / 40))}px rgba(255,196,107,.65)`,
                  }}
                >
                  {title}
                </div>
              </div>
            </div>
          </PlaneOverlay>
        );
      })}
    </>
  );
};

