// Calque HTML/SVG d'une scène, posé sur son plan 3D z = 0 (ou z donné) grâce à une homographie :
// on écrit les textes en pixels « caméra de référence » (1080×1920), et ils suivent ensuite
// exactement les mouvements de caméra, les tremblements et les whip-pans.
import React from "react";
import type { SceneId } from "../config";
import { planeTransform } from "../lib/homography";
import { pxToLocal, toWorld, W, H } from "../lib/world";
import { useGlobalFrame } from "../lib/seq";
import type { V3 } from "../lib/math";
import { clamp } from "../lib/math";

export const planeCorners = (id: SceneId, z = 0): [V3, V3, V3, V3] => [
  toWorld(id, pxToLocal(0, 0, z)),
  toWorld(id, pxToLocal(W, 0, z)),
  toWorld(id, pxToLocal(W, H, z)),
  toWorld(id, pxToLocal(0, H, z)),
];

export const SceneOverlay: React.FC<{ id: SceneId; z?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ id, z = 0, style, children }) => {
  const frame = useGlobalFrame();
  const t = planeTransform(frame, planeCorners(id, z), W, H);
  if (!t) return null;
  // le plan s'efface quand la caméra le traverse
  const near = clamp((t.depth - 1.2) / 3.5);
  if (near <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: t.transform, opacity: near, ...style }}>{children}</div>
  );
};

// Variante pour un plan quelconque (carte, écran…) décrit par ses 4 coins monde.
export const PlaneOverlay: React.FC<{ corners: [V3, V3, V3, V3]; w: number; h: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  corners,
  w,
  h,
  style,
  children,
}) => {
  const frame = useGlobalFrame();
  const t = planeTransform(frame, corners, w, h);
  if (!t) return null;
  return <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "0 0", transform: t.transform, ...style }}>{children}</div>;
};
