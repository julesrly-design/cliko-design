// La ligne lumineuse : traînée (ruban HDR), tête (point blanc très intense + halo + éclat
// anamorphique), lumière ponctuelle qui éclaire vraiment la scène, étincelles dans les virages.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { LINE, PALETTE } from "../config";
import { headAt, headVelocity } from "../lib/track";
import { cameraPose } from "../lib/camera";
import type { V3 } from "../lib/math";
import { fillRibbon, makeRibbonGeometry, makeRibbonMaterial, trailFragment } from "./ribbon";
import { sparksAt } from "./sparks";

const col = (hex: string) => new THREE.Color(hex);

// Modulation d'intensité de la ligne (montée à l'allumage, pics aux impacts) : registre global.
const boosts: { f0: number; f1: number; k: number }[] = [];
export const registerLineBoost = (f0: number, f1: number, k: number) => boosts.push({ f0, f1, k });
export const lineBoost = (f: number) => {
  let k = 1;
  for (const b of boosts) {
    if (f < b.f0 || f > b.f1) continue;
    const u = (f - b.f0) / (b.f1 - b.f0);
    k *= 1 + (b.k - 1) * Math.sin(Math.PI * u);
  }
  return k;
};

const HEAD_VS = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HEAD_FS = /* glsl */ `
uniform vec3 cCore;
uniform vec3 cHalo;
uniform float uI;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float core = exp(-r * r * 140.0);
  float inner = exp(-r * r * 22.0);
  float halo = exp(-r * 4.2) * (1.0 - smoothstep(0.75, 1.0, r));
  // éclat anamorphique horizontal très fin
  float streak = exp(-abs(p.y) * 70.0) * exp(-abs(p.x) * 2.2) * 0.55;
  vec3 c = cCore * (core * 1.0 + inner * 0.35) + cHalo * (halo * 0.11 + streak * 0.18);
  gl_FragColor = vec4(c * uI, 1.0);
}`;

export const Line: React.FC = () => {
  const frame = useCurrentFrame();
  const span = LINE.coreFrames + LINE.residualFrames;
  const n = Math.ceil(span / LINE.sampleStep) + 1;

  const geo = useMemo(() => makeRibbonGeometry(n), [n]);
  const mat = useMemo(
    () =>
      makeRibbonMaterial(trailFragment, {
        cHead: { value: col(PALETTE.lineHead) },
        cMid: { value: col(PALETTE.lineMid) },
        cTail: { value: col(PALETTE.lineTail) },
        uCore: { value: LINE.coreFrames / span },
        uI: { value: LINE.trailIntensity },
        uFade: { value: 1 },
      }),
    [span],
  );
  const headMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HEAD_VS,
        fragmentShader: HEAD_FS,
        uniforms: { cCore: { value: col(PALETTE.lineHead) }, cHalo: { value: col(PALETTE.lineMid) }, uI: { value: LINE.headIntensity } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  const head = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  const pts = useMemo(() => Array.from({ length: n }, () => new THREE.Vector3()), [n]);
  const w = useMemo(() => new Array<number>(n).fill(0), [n]);
  const age = useMemo(() => new Array<number>(n).fill(0), [n]);

  useLayoutEffect(() => {
    const cam = cameraPose(frame);
    const boost = lineBoost(frame);
    for (let i = 0; i < n; i++) {
      const dt = i * LINE.sampleStep;
      const p = headAt(frame - dt);
      pts[i].set(p[0], p[1], p[2]);
      const a = dt / span;
      age[i] = a;
      const c = LINE.coreFrames / span;
      w[i] = a < c ? THREE.MathUtils.lerp(LINE.width, LINE.tailWidth, Math.pow(a / c, 0.7)) : LINE.tailWidth * (1 + 0.5 * ((a - c) / (1 - c)));
    }
    fillRibbon(geo, pts, w, age, cam.pos);
    mat.uniforms.uI.value = LINE.trailIntensity * boost;

    const h = pts[0];
    const v = headVelocity(frame);
    const speed = Math.hypot(v[0], v[1], v[2]);
    if (head.current) {
      head.current.position.copy(h);
      head.current.quaternion.copy(cam.quat);
      // la tête se dilate légèrement quand elle file, et palpite à l'arrêt
      const s = 0.62 * (1 + Math.min(0.5, speed * 0.6)) * (1 + 0.06 * Math.sin(frame * 0.35));
      head.current.scale.setScalar(s);
    }
    headMat.uniforms.uI.value = LINE.headIntensity * boost;
    if (light.current) {
      light.current.position.copy(h);
      light.current.intensity = LINE.lightIntensity * Math.min(1.6, boost);
    }
  }, [frame, geo, mat, headMat, n, pts, w, age, span]);

  return (
    <group>
      <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={10} />
      <mesh ref={head} material={headMat} renderOrder={11} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <pointLight ref={light} color={PALETTE.lineMid} distance={LINE.lightDistance} decay={1.6} />
      <Sparks />
    </group>
  );
};

// ── Étincelles ──────────────────────────────────────────────────────────────
const MAX_SPARKS = 900;
const SPARK_VS = /* glsl */ `
attribute vec3 aColor;
varying vec3 vColor;
void main() { vColor = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SPARK_FS = /* glsl */ `
varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, 1.0); }`;

const Sparks: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 6 * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 6 * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SPARK_VS,
        fragmentShader: SPARK_FS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  );
  const cHot = useMemo(() => col("#FFF4E0"), []);
  const cMid = useMemo(() => col(PALETTE.lineMid), []);

  useLayoutEffect(() => {
    const cam = cameraPose(frame).pos;
    const sparks = sparksAt(frame);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const c = geo.getAttribute("aColor") as THREE.BufferAttribute;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const toCam = new THREE.Vector3();
    const side = new THREE.Vector3();
    const tmpC = new THREE.Color();
    let k = 0;
    for (const s of sparks.slice(0, MAX_SPARKS)) {
      a.set(...s.p);
      b.set(...s.prev);
      dir.subVectors(a, b);
      toCam.subVectors(cam, a);
      side.crossVectors(dir, toCam);
      if (side.lengthSq() < 1e-10) side.set(0, 1, 0);
      side.normalize().multiplyScalar(s.w);
      // quad fin (streak) de b vers a
      const quad: V3[] = [
        [b.x - side.x * 0.3, b.y - side.y * 0.3, b.z - side.z * 0.3],
        [b.x + side.x * 0.3, b.y + side.y * 0.3, b.z + side.z * 0.3],
        [a.x + side.x, a.y + side.y, a.z + side.z],
        [b.x - side.x * 0.3, b.y - side.y * 0.3, b.z - side.z * 0.3],
        [a.x + side.x, a.y + side.y, a.z + side.z],
        [a.x - side.x, a.y - side.y, a.z - side.z],
      ];
      tmpC.copy(cMid).lerp(cHot, s.heat).multiplyScalar(s.i);
      for (let j = 0; j < 6; j++) {
        pos.setXYZ(k * 6 + j, quad[j][0], quad[j][1], quad[j][2]);
        const tail = j === 0 || j === 1 || j === 3 ? 0.15 : 1;
        c.setXYZ(k * 6 + j, tmpC.r * tail, tmpC.g * tail, tmpC.b * tail);
      }
      k++;
    }
    for (let i = k * 6; i < MAX_SPARKS * 6; i++) pos.setXYZ(i, 0, 0, 0);
    pos.needsUpdate = true;
    c.needsUpdate = true;
    geo.setDrawRange(0, k * 6);
  }, [frame, geo, cHot, cMid]);

  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={12} />;
};

