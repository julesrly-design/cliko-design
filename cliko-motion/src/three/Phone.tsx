// Smartphone 3D : coque titane / chrome aux bords arrondis, verre avant, écran qui affiche un site
// (capture d'une démo Cliko) avec défilement, Dynamic Island, boutons latéraux, bloc photo au dos.
import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox, useTexture } from "@react-three/drei";
import { staticFile } from "remotion";
import { PALETTE } from "../config";

export const PHONE = { w: 1.95, h: 4.0, d: 0.21, r: 0.3 };
const SCREEN = { w: PHONE.w - 0.12, h: PHONE.h - 0.12, r: 0.25 };
const IMG = { w: 1075, h: 5625 };

const roundedRectGeometry = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const g = new THREE.ShapeGeometry(s, 16);
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  return g;
};

// scroll ∈ [0, 1] : position dans la page affichée à l'écran.
export const Phone: React.FC<{ scroll: number; screenGlow?: number }> = ({ scroll, screenGlow = 1 }) => {
  const tex = useTexture(staticFile("site/demo-mobile.png"));
  const screenTex = useMemo(() => {
    const t = tex.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.needsUpdate = true;
    return t;
  }, [tex]);
  const rep = (SCREEN.h / SCREEN.w) * (IMG.w / IMG.h);
  screenTex.repeat.set(1, rep);
  screenTex.offset.set(0, 1 - rep - scroll * (1 - rep));
  const screenGeo = useMemo(() => roundedRectGeometry(SCREEN.w, SCREEN.h, SCREEN.r), []);
  const glassGeo = useMemo(() => roundedRectGeometry(PHONE.w - 0.04, PHONE.h - 0.04, PHONE.r - 0.02), []);
  const z = PHONE.d / 2;
  return (
    <group>
      {/* coque titane */}
      <RoundedBox args={[PHONE.w, PHONE.h, PHONE.d]} radius={PHONE.r * 0.55} smoothness={6} bevelSegments={6}>
        <meshPhysicalMaterial color={PALETTE.metal} metalness={1} roughness={0.24} clearcoat={0.6} clearcoatRoughness={0.15} envMapIntensity={1.5} />
      </RoundedBox>
      {/* verre avant noir */}
      <mesh geometry={glassGeo} position={[0, 0, z + 0.002]}>
        <meshPhysicalMaterial color="#020306" roughness={0.06} metalness={0.1} clearcoat={1} envMapIntensity={1.2} />
      </mesh>
      {/* écran */}
      <mesh geometry={screenGeo} position={[0, 0, z + 0.004]}>
        <meshBasicMaterial map={screenTex} color={new THREE.Color(0.93 * screenGlow, 0.93 * screenGlow, 0.93 * screenGlow)} toneMapped={false} />
      </mesh>
      {/* reflet du verre sur l'écran */}
      <mesh geometry={glassGeo} position={[0, 0, z + 0.006]}>
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.07} roughness={0.04} metalness={0} envMapIntensity={2.4} depthWrite={false} />
      </mesh>
      {/* Dynamic Island */}
      <RoundedBox args={[0.5, 0.15, 0.01]} radius={0.07} smoothness={4} position={[0, SCREEN.h / 2 - 0.16, z + 0.008]}>
        <meshBasicMaterial color="#000000" />
      </RoundedBox>
      {/* boutons latéraux */}
      {[
        [-1, 0.95, 0.42],
        [-1, 0.45, 0.3],
        [1, 0.7, 0.62],
      ].map(([side, y, len], i) => (
        <RoundedBox key={i} args={[0.05, len, 0.08]} radius={0.02} smoothness={3} position={[(side * PHONE.w) / 2 + side * 0.012, y, 0]}>
          <meshPhysicalMaterial color={PALETTE.metal} metalness={1} roughness={0.2} envMapIntensity={1.4} />
        </RoundedBox>
      ))}
      {/* dos : verre dépoli + bloc photo */}
      <mesh geometry={glassGeo} position={[0, 0, -z - 0.002]} rotation-y={Math.PI}>
        <meshPhysicalMaterial color="#1b2036" roughness={0.45} metalness={0.3} envMapIntensity={1} />
      </mesh>
      <group position={[-PHONE.w / 2 + 0.52, PHONE.h / 2 - 0.55, -z - 0.03]}>
        <RoundedBox args={[0.78, 0.78, 0.06]} radius={0.16} smoothness={4}>
          <meshPhysicalMaterial color="#2a3150" roughness={0.3} metalness={0.6} envMapIntensity={1.2} />
        </RoundedBox>
        {[
          [-0.17, 0.17],
          [-0.17, -0.17],
          [0.17, 0],
        ].map(([x, y], i) => (
          <group key={i} position={[x, y, -0.05]} rotation-x={Math.PI / 2}>
            <mesh>
              <cylinderGeometry args={[0.13, 0.13, 0.06, 32]} />
              <meshPhysicalMaterial color={PALETTE.metal} metalness={1} roughness={0.15} envMapIntensity={1.6} />
            </mesh>
            <mesh position={[0, -0.032, 0]}>
              <cylinderGeometry args={[0.085, 0.085, 0.01, 32]} />
              <meshPhysicalMaterial color="#05060a" roughness={0.02} clearcoat={1} envMapIntensity={2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
