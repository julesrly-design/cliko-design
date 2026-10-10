import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { random, useVideoConfig } from "remotion";
import * as THREE from "three";

// Galaxie de particules, écho du hero de cliko.be (« Votre commerce mérite d'être trouvé. »).
// Entièrement déterministe : positions tirées avec random(seed), rotation pilotée par props.

const COUNT = 16000;

const useSprite = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,.85)");
    grd.addColorStop(0.6, "rgba(255,255,255,.18)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);

const useGalaxyGeometry = () =>
  useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const inner = new THREE.Color("#ffe6bd");
    const mid = new THREE.Color("#ffc46b");
    const outer = new THREE.Color("#7f95e6");
    const R = 4.2;
    const branches = 2;
    for (let i = 0; i < COUNT; i++) {
      const core = random(`gc${i}`) < 0.32;
      const r = core ? Math.pow(random(`gr${i}`), 2.4) * 1.0 : 0.35 + Math.pow(random(`gr${i}`), 1.25) * R;
      const branch = ((i % branches) / branches) * Math.PI * 2;
      const spin = r * 1.55;
      const spread = (k: string) => Math.pow(random(k), 3) * (random(k + "s") < 0.5 ? 1 : -1) * (0.12 + r * 0.13);
      pos[i * 3] = Math.cos(branch + spin) * r + spread(`gx${i}`);
      pos[i * 3 + 1] = spread(`gy${i}`) * (core ? 0.9 : 0.35);
      pos[i * 3 + 2] = Math.sin(branch + spin) * r + spread(`gz${i}`);
      const c = r < 1.1 ? inner.clone().lerp(mid, r / 1.1) : mid.clone().lerp(outer, Math.min(1, (r - 1.1) / (R - 1.1)));
      const dim = 0.55 + 0.45 * random(`gd${i}`);
      col[i * 3] = c.r * dim;
      col[i * 3 + 1] = c.g * dim;
      col[i * 3 + 2] = c.b * dim;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  }, []);

const GalaxyPoints: React.FC<{ rotation: number; tilt: number; size: number; brightness: number }> = ({ rotation, tilt, size, brightness }) => {
  const geo = useGalaxyGeometry();
  const sprite = useSprite();
  return (
    <group rotation={[tilt, 0, -0.32]}>
      <points geometry={geo} rotation={[0, rotation, 0]}>
        <pointsMaterial
          size={size}
          map={sprite}
          vertexColors
          transparent
          opacity={brightness}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

export const Galaxy: React.FC<{
  rotation: number; // radians
  distance?: number; // distance caméra
  tilt?: number;
  size?: number;
  brightness?: number;
  offsetY?: number; // décalage vertical du centre (unités monde)
}> = ({ rotation, distance = 9, tilt = 1.05, size = 0.06, brightness = 1, offsetY = 0 }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, offsetY, distance], fov: 40, near: 0.1, far: 100 }}
      gl={{ antialias: false, alpha: true, preserveDrawingBuffer: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <GalaxyPoints rotation={rotation} tilt={tilt} size={size} brightness={brightness} />
    </ThreeCanvas>
  );
};
