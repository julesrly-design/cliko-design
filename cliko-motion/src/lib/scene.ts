// Aides communes aux scènes : matrices de placement, texte posé, temps de passage de la tête.
import * as THREE from "three";
import type { SceneId } from "../config";
import { PLACE, sceneQuat } from "./world";
import type { V3 } from "./math";

const mats = new Map<SceneId, THREE.Matrix4>();
// Matrice local → monde d'une scène.
export const sceneMatrix = (id: SceneId) => {
  let m = mats.get(id);
  if (!m) {
    m = new THREE.Matrix4().compose(new THREE.Vector3(...PLACE[id].pos), sceneQuat(id), new THREE.Vector3(1, 1, 1));
    mats.set(id, m);
  }
  return m;
};

// Matrice d'un objet de la scène (position / rotation Euler / échelle locales) → monde.
export const objectMatrix = (id: SceneId, pos: V3, rot: V3 = [0, 0, 0], scale = 1) =>
  sceneMatrix(id)
    .clone()
    .multiply(new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(scale, scale, scale)));

const tv = new THREE.Vector3();
export const applyM = (m: THREE.Matrix4, p: V3): V3 => {
  tv.set(p[0], p[1], p[2]).applyMatrix4(m);
  return [tv.x, tv.y, tv.z];
};

// Décompose une matrice monde pour la donner à un <group> R3F.
export const useMatrixProps = (m: THREE.Matrix4) => {
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  m.decompose(p, q, s);
  return { position: p, quaternion: q, scale: s };
};
