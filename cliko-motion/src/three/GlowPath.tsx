// Tracé lumineux persistant : un chemin (contour de fenêtre, de carte, rue du plan de ville…)
// qui s'allume progressivement derrière la tête, garde une lueur douce et un « front » très vif.
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { PALETTE } from "../config";
import { cameraPose } from "../lib/camera";
import { fillRibbon, makeRibbonGeometry, makeRibbonMaterial } from "./ribbon";
import type { V3 } from "../lib/math";

const FS = /* glsl */ `
uniform vec3 cHot;
uniform vec3 cBase;
uniform float uP;      // progression du tracé (0..1 sur la longueur)
uniform float uI;      // intensité de la lueur installée
uniform float uFront;  // intensité du front
uniform float uFade;
varying float vAge;    // ici : abscisse 0..1 le long du chemin
varying float vSide;
void main() {
  if (vAge > uP) discard;
  float d = (uP - vAge);
  float front = exp(-d * 28.0) * uFront;
  float s = abs(vSide);
  float body = exp(-s * s * 4.0);
  float core = exp(-s * s * 30.0);
  vec3 c = cBase * body * uI + mix(cBase, cHot, 0.7) * core * uI * 0.6 + cHot * (body * 0.5 + core) * front;
  gl_FragColor = vec4(c * uFade, 1.0);
}`;

export type GlowPathProps = {
  points: V3[] | (() => V3[]); // monde ; fonction si l'objet bouge
  progress: number; // 0..1
  width?: number;
  intensity?: number;
  front?: number;
  fade?: number;
  color?: string;
  hot?: string;
  renderOrder?: number;
};

export const GlowPath: React.FC<GlowPathProps> = ({ points, progress, width = 0.02, intensity = 1.2, front = 6, fade = 1, color = PALETTE.lineMid, hot = "#FFF6E6", renderOrder = 9 }) => {
  const frame = useCurrentFrame();
  const initial = typeof points === "function" ? points() : points;
  const n = initial.length;
  const geo = useMemo(() => makeRibbonGeometry(n), [n]);
  const mat = useMemo(
    () =>
      makeRibbonMaterial(FS, {
        cHot: { value: new THREE.Color(hot) },
        cBase: { value: new THREE.Color(color) },
        uP: { value: 0 },
        uI: { value: intensity },
        uFront: { value: front },
        uFade: { value: fade },
      }),
    [color, hot, intensity, front, fade],
  );
  const vecs = useMemo(() => Array.from({ length: n }, () => new THREE.Vector3()), [n]);
  const ws = useMemo(() => new Array<number>(n).fill(width), [n, width]);
  const params = useMemo(() => {
    // abscisse curviligne normalisée
    const p = new Array<number>(n).fill(0);
    let L = 0;
    for (let i = 1; i < n; i++) {
      L += Math.hypot(initial[i][0] - initial[i - 1][0], initial[i][1] - initial[i - 1][1], initial[i][2] - initial[i - 1][2]);
      p[i] = L;
    }
    return p.map((x) => (L > 0 ? x / L : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useLayoutEffect(() => {
    const pts = typeof points === "function" ? points() : points;
    for (let i = 0; i < n; i++) vecs[i].set(pts[i][0], pts[i][1], pts[i][2]);
    fillRibbon(geo, vecs, ws, params, cameraPose(frame).pos);
    mat.uniforms.uP.value = progress;
    mat.uniforms.uFade.value = fade;
  });

  if (progress <= 0 || fade <= 0) return null;
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={renderOrder} />;
};

// Contour de rectangle arrondi (dans le plan XY local), départ en haut à gauche, sens horaire.
export const roundedRectPath = (w: number, h: number, r: number, segPerCorner = 8): V3[] => {
  const pts: V3[] = [];
  const x0 = -w / 2;
  const x1 = w / 2;
  const y0 = -h / 2;
  const y1 = h / 2;
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= segPerCorner; i++) {
      const a = a0 - (i / segPerCorner) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), 0]);
    }
  };
  pts.push([x0 + r, y1, 0]);
  corner(x1 - r, y1 - r, Math.PI / 2);
  corner(x1 - r, y0 + r, 0);
  corner(x0 + r, y0 + r, -Math.PI / 2);
  corner(x0 + r, y1 - r, Math.PI);
  pts.push([x0 + r, y1, 0]);
  // densifie les côtés droits pour un ruban régulier
  const out: V3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(1, Math.ceil(d / 0.08));
    for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k, 0]);
  }
  out.push(pts[pts.length - 1]);
  return out;
};

// Applique une matrice à une liste de points.
const tv = new THREE.Vector3();
export const transformPts = (pts: V3[], m: THREE.Matrix4): V3[] =>
  pts.map((p) => {
    tv.set(p[0], p[1], p[2]).applyMatrix4(m);
    return [tv.x, tv.y, tv.z];
  });

// Point d'un chemin à l'abscisse u (0..1).
export const pointAlong = (pts: V3[], u: number): V3 => {
  const n = pts.length;
  const lens = [0];
  for (let i = 1; i < n; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const L = lens[n - 1];
  const target = Math.max(0, Math.min(1, u)) * L;
  let i = 1;
  while (i < n - 1 && lens[i] < target) i++;
  const t = (target - lens[i - 1]) / Math.max(1e-9, lens[i] - lens[i - 1]);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, pts[i - 1][2] + (pts[i][2] - pts[i - 1][2]) * t];
};
