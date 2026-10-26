// Géographie du monde 3D : chaque scène est construite dans son propre repère « local »
// (caméra de référence en (0, 0, D) qui regarde l'origine), puis posée dans le monde.
// Les scènes s'enchaînent dans l'espace : la caméra plonge, pivote (whip-pan), bascule à la
// verticale… pendant que la ligne lumineuse fait le trajet de l'une à l'autre.
import * as THREE from "three";
import { VIDEO, type SceneId } from "../config";
import type { V3 } from "./math";

export const W = VIDEO.width;
export const H = VIDEO.height;

// Caméra de référence de chaque scène : à D unités de son plan z = 0, fov vertical 40°.
export const REF = { distance: 13, fov: 40 };
// Nombre de px par unité monde sur le plan z = 0 vu par la caméra de référence (≈ 203).
export const PX = H / (2 * REF.distance * Math.tan(((REF.fov / 2) * Math.PI) / 180));

// Sol (grille) : altitude monde.
export const FLOOR_Y = -5;

const deg = Math.PI / 180;

// Placement de chaque scène dans le monde (position de son origine + lacet / tangage).
// Les caméras de référence des scènes reliées par un whip-pan coïncident : le whip est une pure rotation.
export const PLACE: Record<SceneId, { pos: V3; yaw: number; pitch: number }> = {
  hook: { pos: [0, 0, 0], yaw: 0, pitch: 0 },
  site: { pos: [0, 0, -46], yaw: 0, pitch: 0 }, // la ligne plonge vers le fond
  services: { pos: [13, 0, -33], yaw: -90 * deg, pitch: 0 }, // whip-pan vers la droite
  forWho: { pos: [24, FLOOR_Y, -33], yaw: -90 * deg, pitch: -90 * deg }, // vue de dessus, sur le sol
  mobile: { pos: [36, -0.5, -33], yaw: -90 * deg, pitch: 0 }, // la caméra se redresse
  languages: { pos: [23, -0.5, -46], yaw: 0, pitch: 0 }, // whip-pan vers la gauche
  offer: { pos: [10, -0.5, -33], yaw: 90 * deg, pitch: 0 }, // nouveau whip vers la gauche
  logo: { pos: [0, 0, 0], yaw: 0, pitch: 0 }, // retour au point de départ : la vidéo boucle
};

const quatCache = new Map<SceneId, THREE.Quaternion>();
export const sceneQuat = (id: SceneId) => {
  let q = quatCache.get(id);
  if (!q) {
    const p = PLACE[id];
    q = new THREE.Quaternion().setFromEuler(new THREE.Euler(p.pitch, p.yaw, 0, "YXZ"));
    quatCache.set(id, q);
  }
  return q;
};

const tmp = new THREE.Vector3();
// Point local → monde.
export const toWorld = (id: SceneId, p: V3): V3 => {
  tmp.set(p[0], p[1], p[2]).applyQuaternion(sceneQuat(id));
  const o = PLACE[id].pos;
  return [tmp.x + o[0], tmp.y + o[1], tmp.z + o[2]];
};
// Point monde → local.
export const toLocal = (id: SceneId, p: V3): V3 => {
  const o = PLACE[id].pos;
  tmp.set(p[0] - o[0], p[1] - o[1], p[2] - o[2]).applyQuaternion(sceneQuat(id).clone().invert());
  return [tmp.x, tmp.y, tmp.z];
};

// Pixel de la caméra de référence → point local, à la profondeur z (z = 0 : plan de la scène).
export const pxToLocal = (px: number, py: number, z = 0): V3 => {
  const k = (REF.distance - z) / REF.distance;
  return [((px - W / 2) / PX) * k, ((H / 2 - py) / PX) * k, z];
};
export const localToPx = (p: V3): [number, number] => {
  const k = REF.distance / (REF.distance - p[2]);
  return [W / 2 + p[0] * PX * k, H / 2 - p[1] * PX * k];
};
export const pxToWorld = (id: SceneId, px: number, py: number, z = 0) => toWorld(id, pxToLocal(px, py, z));
