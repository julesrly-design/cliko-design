// Ruban lumineux toujours tourné vers la caméra (traînée de la ligne, tracés persistants).
// Chaque sommet porte un « âge » (0 = tête, 1 = bout de queue) et un côté (−1 / +1) ;
// le shader en tire le dégradé blanc → couleur → queue et le profil (cœur chaud + halo).
import * as THREE from "three";

export const ribbonVertex = /* glsl */ `
attribute float aAge;
attribute float aSide;
varying float vAge;
varying float vSide;
void main() {
  vAge = aAge;
  vSide = aSide;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const trailFragment = /* glsl */ `
uniform vec3 cHead;
uniform vec3 cMid;
uniform vec3 cTail;
uniform float uCore;   // part de l'âge occupée par la traînée vive
uniform float uI;      // intensité HDR
uniform float uFade;   // atténuation globale
varying float vAge;
varying float vSide;
void main() {
  float a = vAge;
  vec3 col = mix(cHead, cMid, smoothstep(0.0, uCore * 0.32, a));
  col = mix(col, cTail, smoothstep(uCore * 0.3, uCore * 1.05, a));
  // vive dans la traînée, puis lueur résiduelle qui s'éteint
  float k = mix(1.0, 0.32, smoothstep(0.0, uCore, a));
  k *= a < uCore ? 1.0 : mix(0.2, 0.0, smoothstep(uCore, 1.0, a));
  k *= 1.0 - smoothstep(0.96, 1.0, a);
  float s = abs(vSide);
  float body = exp(-s * s * 5.0);
  float hot = exp(-s * s * 38.0) * (1.0 - smoothstep(0.0, uCore * 0.75, a));
  vec3 c = (col * body + vec3(1.0, 0.97, 0.92) * hot * 1.6) * uI * k * uFade;
  gl_FragColor = vec4(c, 1.0);
}`;

export const makeRibbonMaterial = (fragment: string, uniforms: Record<string, THREE.IUniform>) =>
  new THREE.ShaderMaterial({
    vertexShader: ribbonVertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

// Géométrie préallouée pour n points.
export const makeRibbonGeometry = (n: number) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute("aAge", new THREE.BufferAttribute(new Float32Array(n * 2), 1).setUsage(THREE.DynamicDrawUsage));
  const side = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    side[i * 2] = -1;
    side[i * 2 + 1] = 1;
  }
  g.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  return g;
};

const t = new THREE.Vector3();
const toCam = new THREE.Vector3();
const side = new THREE.Vector3();
const lastSide = new THREE.Vector3(1, 0, 0);

// Remplit le ruban : pts[i], largeur w[i], âge age[i]. Les points inutilisés sont repliés sur le dernier.
export const fillRibbon = (g: THREE.BufferGeometry, pts: THREE.Vector3[], w: number[], age: number[], cam: THREE.Vector3) => {
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const ag = g.getAttribute("aAge") as THREE.BufferAttribute;
  const n = pos.count / 2;
  const m = Math.min(n, pts.length);
  lastSide.set(1, 0, 0);
  for (let i = 0; i < n; i++) {
    const k = Math.min(i, m - 1);
    const p = pts[k];
    if (i < m) {
      const a = pts[Math.max(0, k - 1)];
      const b = pts[Math.min(m - 1, k + 1)];
      t.subVectors(b, a);
      toCam.subVectors(cam, p);
      side.crossVectors(t, toCam);
      if (side.lengthSq() < 1e-12) side.copy(lastSide);
      else side.normalize();
      // évite les retournements brusques du ruban
      if (side.dot(lastSide) < 0) side.negate();
      lastSide.copy(side);
    }
    const ww = i < m ? w[k] : 0;
    pos.setXYZ(i * 2, p.x - side.x * ww, p.y - side.y * ww, p.z - side.z * ww);
    pos.setXYZ(i * 2 + 1, p.x + side.x * ww, p.y + side.y * ww, p.z + side.z * ww);
    ag.setX(i * 2, i < m ? age[k] : 1);
    ag.setX(i * 2 + 1, i < m ? age[k] : 1);
  }
  pos.needsUpdate = true;
  ag.needsUpdate = true;
};
