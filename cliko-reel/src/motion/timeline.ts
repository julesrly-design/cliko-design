// Découpage du film motion design. 30 fps, musique à 120 BPM : 1 temps = 15 frames, 1 mesure = 60 frames.
// Les coupes tombent sur les temps. Les mêmes valeurs alimentent scripts/synth_motion.py (via motion-timeline.json).
export const FPS = 30;
export const BEAT = 15;

export const M = {
  total: 750,
  // 1 · Allumage : le point ambre s'embrase, « Cliko. » s'écrit
  ignite: { from: 0, dot: 14, letters: 30, out: 66 },
  // 2 · Les métiers : puces en verre, le curseur choisit « Pizzeria »
  chips: { from: 72, click: 135 },
  // 3 · Le brief envoyé à Jules & Louis
  brief: { type: 158, typeEnd: 210, send: 225 },
  // 4 · Drop : le code file, la maquette s'assemble
  drop: 240,
  scan: 282,
  // 5 · Trois styles, la scène se recolore
  styles: { from: 300, ask1: 314, flip1: 340, ask2: 354, flip2: 380, out: 404 },
  // 6 · Coupe franche vers le clair : typographie cinétique
  light: { from: 420, l2: 466, l3: 511, l4: 556, pill: 566, stack1: 576, stack2: 586 },
  // 7 · Aplat ambre, pilule « Cliko. »
  brand: { from: 600, pill: 612, dive: 630 },
  // 8 · Plan final
  end: { from: 645, logo: 651, line: 661, cta: 700 },
} as const;
