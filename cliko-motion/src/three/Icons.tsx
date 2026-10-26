// Icônes 3D extrudées, finition chrome : code, serveur, bouclier (maintenance), bulle de chat.
import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { PALETTE } from "../config";

export type IconKind = "code" | "server" | "shield" | "chat";

const EXTRUDE = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.028, bevelSegments: 4, curveSegments: 24 };

// Polyligne épaisse → forme fermée (pour les chevrons « < / > »).
const thickPolyline = (pts: [number, number][], w: number) => {
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    let nx = -dy / l;
    let ny = dx / l;
    // jointure en onglet pour les angles
    let k = w / 2;
    if (i > 0 && i < pts.length - 1) {
      const d1 = [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]];
      const l1 = Math.hypot(d1[0], d1[1]);
      const n1 = [-d1[1] / l1, d1[0] / l1];
      const cos = nx * n1[0] + ny * n1[1];
      k = w / 2 / Math.max(0.35, cos);
      nx = nx;
      ny = ny;
    }
    left.push([pts[i][0] + nx * k, pts[i][1] + ny * k]);
    right.push([pts[i][0] - nx * k, pts[i][1] - ny * k]);
  }
  const s = new THREE.Shape();
  [...left, ...right.reverse()].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
};

const shapesFor = (kind: IconKind): THREE.Shape[] => {
  switch (kind) {
    case "code":
      return [
        thickPolyline([[-0.18, 0.3], [-0.48, 0], [-0.18, -0.3]], 0.11),
        thickPolyline([[0.18, 0.3], [0.48, 0], [0.18, -0.3]], 0.11),
        thickPolyline([[0.09, 0.4], [-0.09, -0.4]], 0.1),
      ];
    case "shield": {
      const s = new THREE.Shape();
      s.moveTo(0, 0.5);
      s.bezierCurveTo(0.16, 0.4, 0.3, 0.38, 0.42, 0.37);
      s.bezierCurveTo(0.44, 0.0, 0.32, -0.33, 0, -0.52);
      s.bezierCurveTo(-0.32, -0.33, -0.44, 0.0, -0.42, 0.37);
      s.bezierCurveTo(-0.3, 0.38, -0.16, 0.4, 0, 0.5);
      // coche évidée
      const check = thickPolyline([[-0.18, 0.0], [-0.04, -0.15], [0.2, 0.15]], 0.085);
      s.holes.push(new THREE.Path(check.getPoints(1).reverse()));
      return [s];
    }
    case "chat": {
      const s = new THREE.Shape();
      const w = 0.5;
      const h = 0.36;
      const r = 0.14;
      s.moveTo(-w + r, h);
      s.lineTo(w - r, h);
      s.quadraticCurveTo(w, h, w, h - r);
      s.lineTo(w, -h + r);
      s.quadraticCurveTo(w, -h, w - r, -h);
      s.lineTo(-0.05, -h);
      s.lineTo(-0.3, -h - 0.2);
      s.lineTo(-0.25, -h);
      s.lineTo(-w + r, -h);
      s.quadraticCurveTo(-w, -h, -w, -h + r);
      s.lineTo(-w, h - r);
      s.quadraticCurveTo(-w, h, -w + r, h);
      for (const x of [-0.22, 0, 0.22]) {
        const hole = new THREE.Path();
        hole.absarc(x, 0, 0.06, 0, Math.PI * 2, true);
        s.holes.push(hole);
      }
      return [s];
    }
    case "server":
      return [];
  }
};

export const ChromeMaterial: React.FC<{ glow?: number }> = ({ glow = 0 }) => (
  <meshPhysicalMaterial color={PALETTE.metal} metalness={1} roughness={0.13} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={1.6} emissive={PALETTE.lineMid} emissiveIntensity={glow} />
);

export const Icon3D: React.FC<{ kind: IconKind; glow?: number }> = ({ kind, glow = 0 }) => {
  const geos = useMemo(() => {
    const shapes = shapesFor(kind);
    return shapes.map((s) => {
      const g = new THREE.ExtrudeGeometry(s, EXTRUDE);
      g.center();
      return g;
    });
  }, [kind]);
  if (kind === "server") {
    return (
      <group>
        {[0.3, 0, -0.3].map((y, i) => (
          <group key={i} position={[0, y, 0]}>
            <RoundedBox args={[0.9, 0.24, 0.3]} radius={0.06} smoothness={4}>
              <ChromeMaterial glow={glow * 0.3} />
            </RoundedBox>
            <mesh position={[0.3, 0, 0.152]}>
              <circleGeometry args={[0.035, 16]} />
              <meshBasicMaterial color={new THREE.Color(PALETTE.accent).multiplyScalar(2.2 + glow * 3)} toneMapped={false} />
            </mesh>
            <mesh position={[-0.12, 0, 0.152]}>
              <planeGeometry args={[0.34, 0.035]} />
              <meshBasicMaterial color={PALETTE.bgCenter} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g}>
          <ChromeMaterial glow={glow * 0.3} />
        </mesh>
      ))}
    </group>
  );
};
