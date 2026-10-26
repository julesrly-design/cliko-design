// Trajet de la tête de la ligne lumineuse : une suite de segments chaînés couvrant les 1800 frames.
// La position de la tête est une fonction pure de la frame (rendu déterministe), et la traînée
// est simplement l'historique de cette fonction. f < 0 et f ≥ 1800 bouclent : la vidéo se
// referme sans couture.
import * as THREE from "three";
import { VIDEO } from "../config";
import { clamp, type Ease, type V3 } from "./math";

type Seg = {
  f0: number;
  f1: number;
  ease: Ease;
  at: (u: number, f: number) => V3; // u ∈ [0, 1] le long du segment ; f = frame évaluée (objets mobiles)
  hold?: boolean;
};

export class TrackBuilder {
  segs: Seg[] = [];
  end: V3;
  t: number;
  constructor(start: V3, f = 0) {
    this.end = start;
    this.t = f;
  }

  // Trajet courbe (Catmull-Rom centripète) depuis le point courant à travers `pts`, arrivée à f1.
  go(f1: number, pts: V3[], ease: Ease, tension = 0.5) {
    const all = [this.end, ...pts].map((p) => new THREE.Vector3(...p));
    const curve = all.length === 2 ? new THREE.LineCurve3(all[0], all[1]) : new THREE.CatmullRomCurve3(all, false, "centripetal", tension);
    curve.arcLengthDivisions = 400;
    curve.updateArcLengths();
    const v = new THREE.Vector3();
    this.push(f1, ease, (u) => {
      curve.getPointAt(clamp(u), v);
      return [v.x, v.y, v.z];
    });
    this.end = pts[pts.length - 1];
    return this;
  }

  // Trajet paramétrique libre (spirales, contours d'objets qui bougent). fn(0, f0) doit valoir le point courant.
  // `fn` reçoit aussi la frame : la tête peut suivre un objet animé.
  fn(f1: number, fn: (u: number, f: number) => V3, ease: Ease) {
    this.push(f1, ease, fn);
    this.end = fn(1, f1);
    return this;
  }

  // Pause « vivante » : la tête flotte autour du point (jamais statique).
  hold(f1: number, amp = 0.05) {
    const p = this.end;
    const f0 = this.t;
    const len = f1 - f0;
    this.segs.push({
      f0,
      f1,
      ease: (x) => x,
      hold: true,
      at: (u) => {
        const fr = u * len;
        const w = Math.sin(Math.PI * clamp(u)); // revient exactement au point aux deux bouts
        return [p[0] + amp * w * Math.sin(fr * 0.21 + f0), p[1] + amp * w * Math.sin(fr * 0.17 + f0 * 0.5 + 1), p[2] + amp * 0.5 * w * Math.cos(fr * 0.13)];
      },
    });
    this.t = f1;
    return this;
  }

  private push(f1: number, ease: Ease, at: (u: number, f: number) => V3) {
    if (f1 <= this.t) throw new Error(`Segment de ligne vide ou à rebours (${this.t} → ${f1})`);
    this.segs.push({ f0: this.t, f1, ease, at });
    this.t = f1;
  }
}

let SEGS: Seg[] = [];
export const setTrack = (b: TrackBuilder) => {
  SEGS = b.segs;
};

const wrap = (f: number) => ((f % VIDEO.durationInFrames) + VIDEO.durationInFrames) % VIDEO.durationInFrames;

export const headAt = (frame: number): V3 => {
  const f = wrap(frame);
  // recherche dichotomique
  let lo = 0;
  let hi = SEGS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (SEGS[mid].f0 <= f) lo = mid;
    else hi = mid - 1;
  }
  const s = SEGS[lo];
  if (!s) return [0, 0, 0];
  const u = clamp((f - s.f0) / (s.f1 - s.f0));
  return s.at(s.ease(u), f);
};

export const headVelocity = (f: number, h = 0.25): V3 => {
  const a = headAt(f - h);
  const b = headAt(f + h);
  return [(b[0] - a[0]) / (2 * h), (b[1] - a[1]) / (2 * h), (b[2] - a[2]) / (2 * h)];
};

// Abscisse temporelle d'un segment : utile pour savoir quand la tête passe à un endroit.
export const segmentsBetween = (f0: number, f1: number) => SEGS.filter((s) => s.f1 > f0 && s.f0 < f1);

