// SCÈNE 4 · POUR QUI (0:13 → 0:17)
// La caméra bascule à la verticale au-dessus de la grille, qui devient un plan de ville.
// La ligne trace un réseau lumineux façon circuit le long des rues, entre de petits immeubles,
// et allume trois points : « Restaurants », « Hôtels », « Boutiques » (punch 1,2 → 1, flou → net).
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, SCENES, TEXT } from "../config";
import { registerCamera, registerTransition } from "../lib/camera";
import type { TrackBuilder } from "../lib/track";
import { clamp, cubicOut, expoInOut, lerp, mulberry, shot, shotBrake, springAt, type V3 } from "../lib/math";
import { localToPx, REF, sceneQuat, toWorld } from "../lib/world";
import { useGlobalFrame, useSceneFrame } from "../lib/seq";
import { SceneOverlay } from "../overlay/SceneOverlay";
import { GlowPath } from "../three/GlowPath";
import { registerLineBoost } from "../three/Line";
import { registerMapMode } from "../three/Stage";
import { registerBurst } from "../three/sparks";
import { CSS_FONT } from "../lib/fonts";

const ID = "forWho" as const;
const S = SCENES.forWho;
const Z = 0.03; // juste au-dessus du sol

// Nœuds (intersections du plan, coordonnées locales = unités de grille) et frame d'allumage.
const NODES: { p: [number, number]; t: number; side: "right" | "left" }[] = [
  { p: [-2, 2], t: 50, side: "right" },
  { p: [1, 0], t: 110, side: "left" },
  { p: [-2, -2], t: 170, side: "right" },
];

// Rues parcourues par la tête (polyligne à angles chanfreinés, comme une piste de circuit).
const ROUTE: [number, number][][] = [
  [[0, 4.6], [0, 3], [-1, 3], [-2, 2]],
  [[-2, 2], [0, 2], [1, 1], [1, 0]],
  [[1, 0], [1, -1], [-1, -1], [-2, -2]],
  [[-2, -2], [1, -2], [2, -1], [2, 4.8]],
];
// Ramifications secondaires qui poussent depuis chaque nœud allumé.
const BRANCHES: [number, number][][][] = [
  [[[-2, 2], [-3, 2], [-3, 4]], [[-2, 2], [-2, 1], [-3, 0]], [[-1, 3], [-1, 5]]],
  [[[1, 0], [2, 0], [3, 1], [3, 3]], [[1, 0], [0, -0.5], [0, -1]], [[0, 2], [0, 1], [-1, 1]]],
  [[[-2, -2], [-3, -3], [-3, -5]], [[-2, -2], [-2, -4]], [[-1, -1], [-1, 0], [-2, 0]]],
];

const L = (x: number, y: number, z = Z): V3 => toWorld(ID, [x, y, z]);
const densify = (pts: [number, number][], z = Z, step = 0.1): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < k; j++) out.push(L(a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k, z));
  }
  const e = pts[pts.length - 1];
  out.push(L(e[0], e[1], z));
  return out;
};

// Fenêtres de temps de chaque tronçon de route (frames locales).
const LEGS = [
  { f0: 14, f1: 50 },
  { f0: 64, f1: 110 },
  { f0: 124, f1: 170 },
  { f0: 186, f1: 236 },
];

export const forWhoLine = (T: TrackBuilder) => {
  const f = (lf: number) => S.start + lf;
  // arrivée en piqué sur la première rue
  T.go(f(LEGS[0].f0), [L(0.6, 5.4, 4.5), L(0, 4.6, Z + 0.05)], shot);
  LEGS.forEach((leg, i) => {
    if (i > 0) T.hold(f(leg.f0), 0.035);
    const route = ROUTE[i];
    // dernier tronçon : la tête quitte le sol vers le téléphone (scène 5)
    const pts = densify(route).slice(1);
    if (i === 3) pts.push(L(2.3, 7.5, 3.5));
    T.go(f(leg.f1), pts, i === 3 ? shot : shotBrake, 0.2);
  });
};

export const forWhoSetup = () => {
  registerCamera(ID, (lf) => {
    // vue de dessus, légère rotation et poussée : le plan vit
    const k = clamp(lf / 260);
    const roll = lerp(0.06, -0.05, k);
    return { pos: [0.25 * Math.sin(lf / 90), lerp(-0.4, 0.2, k), REF.distance - k * 0.8], look: [0, lerp(-0.1, 0.25, k), 0], roll };
  });
  // la caméra se redresse : le téléphone se dresse devant elle (scène 5)
  registerTransition({ at: SCENES.mobile.start, pre: 22, post: 30, ease: expoInOut, arc: [-1.5, 1.5, 0] });
  registerMapMode(S.start - 30, S.end + 10);
  for (const n of NODES) {
    registerLineBoost(S.start + n.t - 6, S.start + n.t + 14, 2.0);
    registerBurst(S.start + n.t, L(n.p[0], n.p[1], 0.1), 36, 0.07, 26, 0.6);
  }
};

// ── 3D ─────────────────────────────────────────────────────────────────────
const Buildings: React.FC<{ lf: number }> = ({ lf }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const cells = useMemo(() => {
    const rnd = mulberry(7);
    const out: { x: number; y: number; h: number; s: number }[] = [];
    for (let x = -4; x < 4; x++)
      for (let y = -6; y < 6; y++) {
        // 2 à 4 immeubles par îlot (cellule entre deux rues)
        const n = 1 + Math.floor(rnd() * 3);
        for (let k = 0; k < n; k++) {
          const s = 0.18 + rnd() * 0.22;
          out.push({ x: x + 0.2 + rnd() * (0.6 - s) + s / 2, y: y + 0.2 + rnd() * (0.6 - s) + s / 2, h: 0.08 + Math.pow(rnd(), 2) * 0.7, s });
        }
      }
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = sceneQuat(ID);
    cells.forEach((c, i) => {
      // les immeubles poussent depuis le sol à l'arrivée de la caméra
      const grow = springAt(lf + 30 - Math.abs(c.y) * 3, { stiffness: 90, damping: 14 });
      const h = Math.max(0.001, c.h * grow);
      const p = new THREE.Vector3(...toWorld(ID, [c.x, c.y, h / 2]));
      m.compose(p, q, new THREE.Vector3(c.s, c.s, h));
      // (géométrie unitaire alignée sur les axes locaux de la scène)
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [lf, cells]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cells.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0d1328" roughness={0.35} metalness={0.6} envMapIntensity={0.9} />
    </instancedMesh>
  );
};

const Node: React.FC<{ n: (typeof NODES)[number]; lf: number }> = ({ n, lf }) => {
  const a = lf - n.t;
  const s = springAt(a, { stiffness: 220, damping: 10 });
  if (a < -1) return null;
  const pos = L(n.p[0], n.p[1], 0.02);
  const ring = clamp(a / 40);
  return (
    <group position={pos}>
      {/* anneau d'onde au sol */}
      <mesh rotation-x={-Math.PI / 2} scale={0.2 + ring * 1.6}>
        <ringGeometry args={[0.9, 1, 64]} />
        <meshBasicMaterial color={new THREE.Color(PALETTE.lineMid).multiplyScalar(3 * (1 - ring))} transparent opacity={1 - ring} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* pastille */}
      <mesh rotation-x={-Math.PI / 2} scale={0.17 * s}>
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial color={new THREE.Color("#FFF1D6").multiplyScalar(4)} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} scale={0.3 * s}>
        <ringGeometry args={[0.8, 1, 48]} />
        <meshBasicMaterial color={new THREE.Color(PALETTE.lineMid).multiplyScalar(2.2)} toneMapped={false} />
      </mesh>
      {/* faisceau vertical */}
      <mesh position={[0, 0.9 * s, 0]} scale={[1, s, 1]}>
        <cylinderGeometry args={[0.012, 0.05, 1.8, 12, 1, true]} />
        <meshBasicMaterial color={new THREE.Color(PALETTE.lineMid).multiplyScalar(1.6)} transparent opacity={0.5} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

export const ForWho3D: React.FC = () => {
  const lf = useSceneFrame();
  const routes = useMemo(() => ROUTE.map((r) => densify(r, Z, 0.08)), []);
  const branches = useMemo(() => BRANCHES.map((bs) => bs.map((b) => densify(b, Z, 0.08))), []);
  const fade = 1 - clamp((lf - 250) / 25);
  return (
    <>
      <Buildings lf={lf} />
      {/* rues tracées par la tête : elles restent allumées */}
      {routes.map((r, i) => {
        const leg = LEGS[i];
        const p = clamp((lf - leg.f0) / (leg.f1 - leg.f0));
        const eased = i === 3 ? shot(p) : shotBrake(p);
        return <GlowPath key={i} points={r} progress={i === 3 ? Math.min(1, eased * 1.05) : eased} width={0.022} intensity={0.75} front={5} fade={fade} />;
      })}
      {/* ramifications façon circuit, plus fines, qui poussent après chaque nœud */}
      {branches.map((bs, i) =>
        bs.map((b, j) => {
          const p = cubicOut(clamp((lf - NODES[i].t - 2 - j * 4) / 22));
          return <GlowPath key={`${i}-${j}`} points={b} progress={p} width={0.012} intensity={0.5} front={3} fade={fade} />;
        }),
      )}
      {NODES.map((n, i) => (
        <Node key={i} n={n} lf={lf} />
      ))}
    </>
  );
};

// ── Étiquettes : kinetic typography ────────────────────────────────────────
export const ForWhoOverlay: React.FC = () => {
  const lf = useSceneFrame();
  useGlobalFrame();
  return (
    <SceneOverlay id={ID}>
      {NODES.map((n, i) => {
        const a = lf - n.t;
        if (a < 0) return null;
        const [x, y] = localToPx([n.p[0], n.p[1], 0]);
        const s = springAt(a, { stiffness: 260, damping: 13 });
        const scale = lerp(1.2, 1, clamp(s)) + (s > 1 ? (s - 1) * 0.15 : 0);
        const blur = (1 - clamp(a / 9)) * 14;
        const exit = clamp((lf - 246) / 10);
        const right = n.side === "right";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: right ? x + 52 : undefined,
              right: right ? undefined : 1080 - x + 52,
              top: y - 58,
              fontFamily: CSS_FONT.display,
              fontWeight: 600,
              fontSize: 96,
              lineHeight: 1,
              letterSpacing: "-0.035em",
              color: PALETTE.text,
              whiteSpace: "nowrap",
              transform: `scale(${scale})`,
              transformOrigin: right ? "0% 50%" : "100% 50%",
              filter: `blur(${blur}px)`,
              opacity: clamp(a / 4) * (1 - exit),
              textShadow: "0 0 30px rgba(5,6,10,.9), 0 4px 40px rgba(5,6,10,.9)",
            }}
          >
            {TEXT.forWho[i]}
          </div>
        );
      })}
    </SceneOverlay>
  );
};
