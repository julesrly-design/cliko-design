// Caméra : fonction pure de la frame. Chaque scène décrit sa caméra dans son repère local ;
// les transitions (whip-pans, plongée, grue) mélangent deux caméras avec un easing expo.
// La même fonction pilote la caméra R3F, la projection des textes HTML et le flou de mouvement.
import * as THREE from "three";
import { SCENES, VIDEO, type SceneId } from "../config";
import { REF, toWorld, sceneQuat, W, H } from "./world";
import { clamp, lerp, noise1, type Ease, type V3 } from "./math";

export type CamPose = { pos: V3; look: V3; roll?: number; fov?: number };
export type SceneCamera = (localFrame: number) => CamPose;

export type Transition = {
  at: number; // frame de la coupe (sur un temps)
  pre: number; // frames avant la coupe
  post: number; // frames après
  ease: Ease;
  arc?: V3; // décalage monde au milieu de la transition (trajectoire en courbe)
  rollKick?: number; // roulis ajouté au milieu (radians), donne du nerf aux whip-pans
};

export const defaultCamera: SceneCamera = () => ({ pos: [0, 0, REF.distance], look: [0, 0, 0] });

const ORDER = Object.keys(SCENES) as SceneId[];
const cams: Partial<Record<SceneId, SceneCamera>> = {};
const transitions: Transition[] = [];
const shakes: { f: number; amp: number; decay: number }[] = [];

export const registerCamera = (id: SceneId, cam: SceneCamera) => {
  cams[id] = cam;
};
export const registerTransition = (t: Transition) => {
  transitions.push(t);
  transitions.sort((a, b) => a.at - b.at);
};
export const registerShake = (f: number, amp: number, decay = 9) => {
  shakes.push({ f, amp, decay });
};

const qTmp = new THREE.Quaternion();
const mTmp = new THREE.Matrix4();
const vEye = new THREE.Vector3();
const vLook = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

type WorldPose = { pos: THREE.Vector3; quat: THREE.Quaternion; fov: number };

const sceneWorldPose = (id: SceneId, f: number): WorldPose => {
  const cam = cams[id] ?? defaultCamera;
  const p = cam(f - SCENES[id].start);
  vEye.set(...p.pos);
  vLook.set(...p.look);
  mTmp.lookAt(vEye, vLook, UP);
  const qLocal = new THREE.Quaternion().setFromRotationMatrix(mTmp);
  if (p.roll) qLocal.multiply(qTmp.setFromAxisAngle(Z, p.roll));
  const quat = sceneQuat(id).clone().multiply(qLocal);
  return { pos: new THREE.Vector3(...toWorld(id, p.pos)), quat, fov: p.fov ?? REF.fov };
};

const sceneAt = (f: number): SceneId => {
  for (let i = ORDER.length - 1; i >= 0; i--) if (f >= SCENES[ORDER[i]].start) return ORDER[i];
  return ORDER[0];
};

// Tremblement (impacts) : petites rotations décroissantes, déterministes.
const shakeAt = (f: number): V3 => {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const s of shakes) {
    const d = f - s.f;
    if (d < 0 || d > s.decay * 6) continue;
    const k = s.amp * Math.exp(-d / s.decay);
    x += k * noise1(d * 0.9, s.f);
    y += k * noise1(d * 0.9, s.f + 7);
    z += k * 0.6 * noise1(d * 0.7, s.f + 13);
  }
  return [x, y, z];
};

const cache = new Map<number, WorldPose>();

export const cameraPose = (frame: number): WorldPose => {
  const f = ((frame % VIDEO.durationInFrames) + VIDEO.durationInFrames) % VIDEO.durationInFrames;
  const key = Math.round(f * 1000) / 1000;
  const hit = cache.get(key);
  if (hit) return hit;

  let pose: WorldPose;
  const tr = transitions.find((t) => f >= t.at - t.pre && f < t.at + t.post);
  if (tr) {
    const from = sceneAt(tr.at - 1);
    const to = sceneAt(tr.at);
    const a = sceneWorldPose(from, f);
    const b = sceneWorldPose(to, f);
    const t = tr.ease(clamp((f - (tr.at - tr.pre)) / (tr.pre + tr.post)));
    const pos = a.pos.clone().lerp(b.pos, t);
    if (tr.arc) pos.add(new THREE.Vector3(...tr.arc).multiplyScalar(Math.sin(Math.PI * t)));
    const quat = a.quat.clone().slerp(b.quat, t);
    if (tr.rollKick) quat.multiply(qTmp.setFromAxisAngle(Z, tr.rollKick * Math.sin(Math.PI * t)));
    pose = { pos, quat, fov: lerp(a.fov, b.fov, t) };
  } else {
    pose = sceneWorldPose(sceneAt(f), f);
  }
  const s = shakeAt(f);
  if (s[0] || s[1] || s[2]) {
    pose = { ...pose, quat: pose.quat.clone().multiply(qTmp.setFromEuler(new THREE.Euler(s[0], s[1], s[2]))) };
  }
  if (cache.size > 4000) cache.clear();
  cache.set(key, pose);
  return pose;
};

// Caméra three.js prête pour la projection (overlays HTML, flou de mouvement).
const projCam = new THREE.PerspectiveCamera(REF.fov, W / H, 0.05, 400);
export const projectionCamera = (frame: number) => {
  const p = cameraPose(frame);
  projCam.position.copy(p.pos);
  projCam.quaternion.copy(p.quat);
  projCam.fov = p.fov;
  projCam.updateProjectionMatrix();
  projCam.updateMatrixWorld(true);
  return projCam;
};

// Monde → pixel écran. w < 0 : derrière la caméra.
const vp = new THREE.Vector4();
export const projectPx = (frame: number, p: V3): { x: number; y: number; w: number } => {
  const cam = projectionCamera(frame);
  vp.set(p[0], p[1], p[2], 1).applyMatrix4(cam.matrixWorldInverse).applyMatrix4(cam.projectionMatrix);
  return { x: ((vp.x / vp.w) * 0.5 + 0.5) * W, y: (1 - ((vp.y / vp.w) * 0.5 + 0.5)) * H, w: vp.w };
};

// Vitesse écran de la caméra (px/frame) au centre de l'image : pilote le flou de mouvement.
export const cameraScreenVelocity = (frame: number): [number, number] => {
  const pose = cameraPose(frame);
  const fwd = new THREE.Vector3(0, 0, -10).applyQuaternion(pose.quat).add(pose.pos);
  const prev = projectPx(frame - 0.5, [fwd.x, fwd.y, fwd.z]);
  const now = projectPx(frame + 0.5, [fwd.x, fwd.y, fwd.z]);
  if (prev.w <= 0 || now.w <= 0) return [0, 0];
  // Déplacement à l'écran d'un point fixe du monde situé devant la caméra.
  return [now.x - prev.x, now.y - prev.y];
};
