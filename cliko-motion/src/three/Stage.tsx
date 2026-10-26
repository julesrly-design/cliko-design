// Décor permanent : fond (dégradé radial), grille 3D au sol qui s'éclaire près de la ligne,
// particules en suspension (fausse profondeur de champ), éclairage studio sombre + rim lights.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { Environment, Lightformer } from "@react-three/drei";
import { PALETTE } from "../config";
import { cameraPose } from "../lib/camera";
import { headAt } from "../lib/track";
import { FLOOR_Y } from "../lib/world";
import { mulberry } from "../lib/math";
import { lineBoost } from "./Line";

const c3 = (hex: string) => new THREE.Color(hex);

// ── Fond ────────────────────────────────────────────────────────────────────
const BG_FS = /* glsl */ `
uniform vec3 cEdge;
uniform vec3 cCenter;
uniform vec3 cGlow;
uniform float uFlash;
uniform vec3 cFlash;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - vec2(0.5, 0.56)) * vec2(1.0, 1.7778);
  float r = length(p);
  vec3 c = mix(cCenter, cEdge, smoothstep(0.0, 1.05, r));
  // lueur marine très diffuse en haut à droite et pétrole en bas à gauche (comme cliko.be)
  c += cGlow * 0.10 * exp(-dot(p - vec2(0.35, 0.55), p - vec2(0.35, 0.55)) * 2.2);
  c += cGlow * 0.05 * exp(-dot(p - vec2(-0.4, -0.7), p - vec2(-0.4, -0.7)) * 2.0);
  c += cFlash * uFlash;
  gl_FragColor = vec4(c, 1.0);
}`;

const flashes: { f: number; k: number; decay: number }[] = [];
export const registerFlash = (f: number, k = 1, decay = 10) => flashes.push({ f, k, decay });
export const flashAt = (f: number) => {
  let k = 0;
  for (const fl of flashes) {
    const d = f - fl.f;
    if (d < -2 || d > fl.decay * 6) continue;
    k += d < 0 ? fl.k * (1 + d / 2) * 0.5 : fl.k * Math.exp(-d / fl.decay);
  }
  return k;
};

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
        fragmentShader: BG_FS,
        uniforms: {
          cEdge: { value: c3(PALETTE.bg) },
          cCenter: { value: c3(PALETTE.bgCenter) },
          cGlow: { value: c3(PALETTE.bgGlow) },
          cFlash: { value: c3("#FFF6E8") },
          uFlash: { value: 0 },
        },
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    [],
  );
  mat.uniforms.uFlash.value = flashAt(frame) * 0.25;
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
};

// ── Grille au sol ───────────────────────────────────────────────────────────
const GRID_VS = /* glsl */ `
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GRID_FS = /* glsl */ `
uniform vec3 uHead;
uniform vec3 uCam;
uniform vec3 cGrid;
uniform vec3 cHot;
uniform float uBase;
uniform float uHeadK;
uniform vec4 uShock; // x, z, rayon, force
uniform float uMap;  // 0..1 : mode « plan de ville » (scène 4), grille plus présente
varying vec3 vW;
float gridLine(vec2 p, float cell, float w) {
  vec2 q = p / cell;
  vec2 fw = fwidth(q);
  vec2 g = abs(fract(q - 0.5) - 0.5) / fw;
  float l = 1.0 - min(min(g.x, g.y) / w, 1.0);
  // au loin, les cellules deviennent minuscules : on efface la ligne avant qu'elle ne crénelle
  return l * (1.0 - smoothstep(0.08, 0.3, max(fw.x, fw.y)));
}
void main() {
  float d = distance(vW, uCam);
  float fade = exp(-d * 0.032);
  float minor = gridLine(vW.xz, 1.0, 1.0);
  float major = gridLine(vW.xz, 5.0, 1.4);
  float g = minor * 0.45 + major;
  float hd = distance(vW.xz, uHead.xz);
  float hh = max(0.0, uHead.y - vW.y);
  float glow = exp(-hd * hd / (1.2 + hh * 0.9)) / (1.0 + hh * 0.45);
  float ring = 0.0;
  if (uShock.w > 0.0) {
    float sd = distance(vW.xz, uShock.xy) - uShock.z;
    ring = exp(-sd * sd * 1.2) * uShock.w + exp(-max(0.0, -sd) * 0.4) * step(sd, 0.0) * uShock.w * 0.15;
  }
  float base = uBase + uMap * 0.10;
  vec3 c = cGrid * g * (base + glow * uHeadK + ring * 2.6) * fade;
  c += cHot * glow * uHeadK * 0.035 * fade;           // reflet diffus de la tête sur le sol
  c += cHot * ring * 0.12 * fade;
  gl_FragColor = vec4(c, 1.0);
}`;

const shocks: { f: number; center: () => [number, number]; speed: number; life: number }[] = [];
export const registerShock = (f: number, center: () => [number, number], speed = 0.55, life = 60) => shocks.push({ f, center, speed, life });

const mapWindows: { f0: number; f1: number }[] = [];
export const registerMapMode = (f0: number, f1: number) => mapWindows.push({ f0, f1 });

export const Grid: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GRID_VS,
        fragmentShader: GRID_FS,
        uniforms: {
          uHead: { value: new THREE.Vector3() },
          uCam: { value: new THREE.Vector3() },
          cGrid: { value: c3(PALETTE.grid) },
          cHot: { value: c3(PALETTE.lineMid) },
          uBase: { value: 0.2 },
          uHeadK: { value: 1.4 },
          uShock: { value: new THREE.Vector4() },
          uMap: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  useLayoutEffect(() => {
    const h = headAt(frame);
    mat.uniforms.uHead.value.set(h[0], h[1], h[2]);
    mat.uniforms.uCam.value.copy(cameraPose(frame).pos);
    mat.uniforms.uHeadK.value = 1.4 * Math.min(1.8, lineBoost(frame));
    const s = shocks.find((s) => frame >= s.f && frame < s.f + s.life);
    if (s) {
      const age = frame - s.f;
      const [x, z] = s.center();
      mat.uniforms.uShock.value.set(x, z, age * s.speed * (1 + 12 / (age + 6)), Math.pow(1 - age / s.life, 1.5));
    } else mat.uniforms.uShock.value.set(0, 0, 0, 0);
    let m = 0;
    for (const w of mapWindows) m = Math.max(m, Math.min(1, (frame - w.f0) / 20, (w.f1 - frame) / 20));
    mat.uniforms.uMap.value = Math.max(0, m);
  }, [frame, mat]);
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position={[18, FLOOR_Y, -20]} renderOrder={-500} frustumCulled={false}>
      <planeGeometry args={[400, 400]} />
    </mesh>
  );
};

// ── Particules ──────────────────────────────────────────────────────────────
const P_VS = /* glsl */ `
attribute float aSize;
attribute float aSeed;
uniform float uTime;
uniform float uFocus;
uniform float uScale;
varying float vA;
varying float vBlur;
varying float vSeed;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.011 + aSeed * 6.28) * 0.35;
  p.y += cos(uTime * 0.009 + aSeed * 12.1) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depth = -mv.z;
  float blur = clamp(abs(depth - uFocus) / uFocus, 0.0, 2.5);
  vBlur = blur;
  vSeed = aSeed;
  vA = (0.8 + 0.2 * sin(uTime * 0.02 + aSeed * 40.0)) / (1.0 + blur * blur * 2.0) * smoothstep(2.5, 6.0, depth) * 0.7;
  gl_PointSize = min(60.0, aSize * (1.0 + blur * 5.0) * uScale / depth);
  gl_Position = projectionMatrix * mv;
}`;
const P_FS = /* glsl */ `
uniform vec3 cA;
uniform vec3 cB;
varying float vA;
varying float vBlur;
varying float vSeed;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = length(q);
  float sharp = 1.0 - smoothstep(0.35, 1.0, r);
  float bokeh = (1.0 - smoothstep(0.85, 1.0, r)) * (0.65 + 0.35 * smoothstep(0.5, 0.95, r));
  float a = mix(sharp, bokeh, clamp(vBlur, 0.0, 1.0));
  vec3 c = mix(cA, cB, fract(vSeed * 7.13));
  float hot = step(0.93, fract(vSeed * 13.7)) * 1.6 + 0.55;
  gl_FragColor = vec4(c * a * vA * hot, 1.0);
}`;

export const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => {
    const N = 2600;
    const rnd = mulberry(42);
    const pos = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = -14 + rnd() * 66;
      pos[i * 3 + 1] = FLOOR_Y + 0.3 + rnd() * 15;
      pos[i * 3 + 2] = -62 + rnd() * 84;
      size[i] = 0.8 + Math.pow(rnd(), 3) * 3.5;
      seed[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: P_VS,
        fragmentShader: P_FS,
        uniforms: {
          uTime: { value: 0 },
          uFocus: { value: 13 },
          uScale: { value: 28 },
          cA: { value: c3(PALETTE.mist) },
          cB: { value: c3(PALETTE.lineMid) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  mat.uniforms.uTime.value = frame;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={-100} />;
};

// ── Lumières ────────────────────────────────────────────────────────────────
// HDRI « studio sombre » généré sur place (Lightformers) : pas de fichier ni de réseau au rendu.
export const StudioEnvironment: React.FC = () => (
  <Environment resolution={256} frames={1}>
    <color attach="background" args={["#020205"]} />
    <Lightformer form="rect" intensity={2.2} position={[0, 6, -2]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
    <Lightformer form="rect" intensity={1.2} position={[0, 1, 8]} scale={[8, 1.2, 1]} />
    <Lightformer form="rect" intensity={4} color={PALETTE.rimA} position={[-7, 1, -2]} rotation-y={Math.PI / 2} scale={[8, 0.6, 1]} />
    <Lightformer form="rect" intensity={4} color={PALETTE.rimB} position={[7, 0, -2]} rotation-y={-Math.PI / 2} scale={[8, 0.6, 1]} />
    <Lightformer form="ring" intensity={1.6} color={PALETTE.lineMid} position={[3, 4, 6]} scale={1.5} />
    {/* bandes tout autour : le chrome capte toujours un reflet, quelle que soit l'orientation de la scène */}
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      return <Lightformer key={i} form="rect" intensity={i % 2 ? 1.4 : 2.2} color={i % 3 === 0 ? PALETTE.rimA : i % 3 === 1 ? "#ffffff" : PALETTE.rimB} position={[Math.cos(a) * 9, 1.5 + (i % 2) * 2, Math.sin(a) * 9]} rotation-y={-a - Math.PI / 2} scale={[1.2, 7, 1]} />;
    })}
  </Environment>
);

// Rim lights attachées à la caméra : elles détachent toujours les objets du fond, quelle que soit la scène.
const RimLight: React.FC<{ position: [number, number, number]; color: string; intensity: number }> = (p) => {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useRef<THREE.Object3D>(null);
  useLayoutEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  return (
    <>
      <directionalLight ref={light} {...p} />
      <object3D ref={target} position={[0, 0, -13]} />
    </>
  );
};

export const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const g = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const p = cameraPose(frame);
    g.current?.position.copy(p.pos);
    g.current?.quaternion.copy(p.quat);
  }, [frame]);
  return (
    <group ref={g}>
      <RimLight position={[-7, 3, -24]} color={PALETTE.rimA} intensity={2.6} />
      <RimLight position={[7, 1, -24]} color={PALETTE.rimB} intensity={2.8} />
      <RimLight position={[2, 6, 4]} color="#ffffff" intensity={0.4} />
    </group>
  );
};
