// Bande-son originale « Cliko — Sunset Drive » : synthwave estivale à 110 BPM, en La mineur.
// Entièrement synthétisée par Web Audio (aucun fichier, aucun sample) : la même partition sert à la lecture
// en direct (ordonnanceur à fenêtre glissante) et au rendu hors ligne (OfflineAudioContext) pour la vidéo.
import { BEAT, BARS, rng } from "./timeline.js";

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const CHORDS = {
  Am: { bass: 33, pad: [57, 60, 64, 67, 71], arp: [69, 72, 76, 79, 81] },
  F: { bass: 29, pad: [53, 57, 60, 64, 67], arp: [65, 69, 72, 76, 77] },
  C: { bass: 36, pad: [55, 60, 62, 64, 67], arp: [67, 72, 74, 76, 79] },
  G: { bass: 31, pad: [55, 59, 62, 64, 67], arp: [67, 71, 74, 79, 83] },
};

// Mélodie (4 mesures) : [beat dans la phrase, note MIDI, durée en beats]
const HOOK = [
  [0, 76, 1], [1, 74, 0.5], [1.5, 72, 0.5], [2, 74, 1.5], [3.5, 76, 0.5],
  [4, 72, 1], [5, 69, 1], [6, 72, 0.5], [6.5, 74, 0.5], [7, 76, 1],
  [8, 79, 1.5], [9.5, 76, 0.5], [10, 74, 1], [11, 72, 1],
  [12, 74, 2], [14, 71, 1], [15, 74, 0.75],
];

// ———————————————————————————————————————————————————————————————————————————————
export function createEngine(ctx) {
  const R = rng(20261119);
  const now0 = 0;

  // ——— Bus et effets ———
  const master = ctx.createGain();
  master.gain.value = 0.82;
  const clip = ctx.createWaveShaper();
  {
    const n = 2048, c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(x * 1.25) / Math.tanh(1.25);
    }
    clip.curve = c;
    clip.oversample = "2x";
  }
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -15;
  comp.knee.value = 9;
  comp.ratio.value = 3.2;
  comp.attack.value = 0.006;
  comp.release.value = 0.16;
  const lows = ctx.createBiquadFilter();
  lows.type = "lowshelf";
  lows.frequency.value = 95;
  lows.gain.value = 0.5;
  const highs = ctx.createBiquadFilter();
  highs.type = "highshelf";
  highs.frequency.value = 8500;
  highs.gain.value = 4;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 32;
  hp.Q.value = 0.6;
  const bus = ctx.createGain();
  bus.gain.value = 0.36; // marge avant compression : garde les nuances (intro calme, impacts qui claquent)
  bus.connect(hp).connect(lows).connect(highs).connect(comp).connect(clip).connect(master).connect(ctx.destination);

  // Bus musical avec « pompe » de sidechain sur chaque grosse caisse
  const pump = ctx.createGain();
  pump.connect(bus);
  const drums = ctx.createGain();
  drums.gain.value = 0.9;
  drums.connect(bus);
  const fx = ctx.createGain();
  fx.gain.value = 0.85;
  fx.connect(bus);
  const lead = ctx.createGain();
  lead.gain.value = 0.9;
  lead.connect(bus);

  // Réverbération : réponse impulsionnelle générée (bruit stéréo à décroissance exponentielle, assombri)
  const rev = ctx.createConvolver();
  {
    const len = Math.floor(ctx.sampleRate * 3.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const k = i / len;
        lp += (R() * 2 - 1 - lp) * (0.55 - 0.4 * k);
        d[i] = lp * Math.pow(1 - k, 2.6) * (i < ctx.sampleRate * 0.012 ? i / (ctx.sampleRate * 0.012) : 1);
      }
    }
    rev.buffer = ir;
  }
  const revIn = ctx.createGain();
  const revOut = ctx.createGain();
  revOut.gain.value = 0.42;
  const revHp = ctx.createBiquadFilter();
  revHp.type = "highpass";
  revHp.frequency.value = 220;
  revIn.connect(revHp).connect(rev).connect(revOut).connect(bus);

  // Délai ping-pong (croche pointée)
  const dIn = ctx.createGain();
  const dL = ctx.createDelay(2), dR = ctx.createDelay(2);
  dL.delayTime.value = BEAT * 0.75;
  dR.delayTime.value = BEAT * 0.75;
  const fb = ctx.createGain();
  fb.gain.value = 0.36;
  const dLp = ctx.createBiquadFilter();
  dLp.type = "lowpass";
  dLp.frequency.value = 3600;
  const pL = ctx.createStereoPanner(), pR = ctx.createStereoPanner();
  pL.pan.value = -0.75;
  pR.pan.value = 0.75;
  const dOut = ctx.createGain();
  dOut.gain.value = 0.5;
  dIn.connect(dL);
  dL.connect(pL).connect(dOut);
  dL.connect(dR);
  dR.connect(pR).connect(dOut);
  dR.connect(dLp).connect(fb).connect(dL);
  dOut.connect(bus);
  dOut.connect(revIn);

  // Bruit blanc partagé
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  {
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1;
  }
  // Courbe « bitcrush » pour les glitchs
  const crushCurve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) crushCurve[i] = Math.round(((i / 1023) * 2 - 1) * 5) / 5;
  const drive = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) drive[i] = Math.tanh(((i / 1023) * 2 - 1) * 4);

  // ——— Primitives ———
  const G = (v = 0) => {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  };
  const O = (type, f, at) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    return o;
  };
  const F = (type, f, q = 0.7) => {
    const b = ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  };
  const N = (at, dur) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    s.start(at, R() * 1.5);
    s.stop(at + dur + 0.05);
    return s;
  };
  const send = (node, dest, amt) => {
    if (amt <= 0) return;
    const g = G(amt);
    node.connect(g).connect(dest);
  };
  // enveloppe AD exponentielle
  const ad = (g, at, peak, a, d) => {
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(peak, at + a);
    g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
  };
  const pan = (v) => {
    const p = ctx.createStereoPanner();
    p.pan.value = v;
    return p;
  };

  const duck = (at, depth = 0.62) => {
    pump.gain.setValueAtTime(1 - depth, at);
    pump.gain.setTargetAtTime(1, at + 0.02, 0.09);
  };

  // ——— Instruments ———
  const I = {
    kick(at, v = 1) {
      const o = O("sine", 165, at);
      o.frequency.exponentialRampToValueAtTime(52, at + 0.09);
      o.frequency.exponentialRampToValueAtTime(40, at + 0.42);
      const g = G();
      ad(g, at, v, 0.002, 0.5);
      o.connect(g).connect(drums);
      o.start(at);
      o.stop(at + 0.6);
      const n = N(at, 0.03), hp = F("highpass", 2500), gn = G();
      ad(gn, at, 0.22 * v, 0.001, 0.02);
      n.connect(hp).connect(gn).connect(drums);
      duck(at);
    },
    snare(at, v = 1, wet = 0.6) {
      const n = N(at, 0.4), bp = F("bandpass", 1900, 0.6), g = G();
      ad(g, at, 0.75 * v, 0.002, 0.24);
      n.connect(bp).connect(g).connect(drums);
      send(g, revIn, wet);
      const o = O("triangle", 200, at);
      o.frequency.exponentialRampToValueAtTime(155, at + 0.1);
      const go = G();
      ad(go, at, 0.45 * v, 0.002, 0.12);
      o.connect(go).connect(drums);
      send(go, revIn, wet * 0.5);
      o.start(at);
      o.stop(at + 0.2);
    },
    clap(at, v = 1) {
      const n = N(at, 0.3), bp = F("bandpass", 1300, 1.2), g = G();
      g.gain.setValueAtTime(0.0001, at);
      for (let i = 0; i < 3; i++) {
        g.gain.setValueAtTime(0.5 * v, at + i * 0.011);
        g.gain.exponentialRampToValueAtTime(0.05, at + i * 0.011 + 0.009);
      }
      g.gain.setValueAtTime(0.45 * v, at + 0.034);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
      n.connect(bp).connect(g).connect(drums);
      send(g, revIn, 0.5);
    },
    hat(at, v = 1, open = false) {
      const n = N(at, open ? 0.35 : 0.08), hp = F("highpass", 7800), g = G();
      ad(g, at, (open ? 0.17 : 0.23) * v, 0.001, open ? 0.26 : 0.045);
      n.connect(hp).connect(g).connect(pan(open ? 0.25 : -0.2)).connect(drums);
    },
    tom(at, f, v = 1) {
      const o = O("sine", f, at);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, at + 0.3);
      const g = G();
      ad(g, at, 0.6 * v, 0.002, 0.32);
      o.connect(g).connect(drums);
      send(g, revIn, 0.35);
      o.start(at);
      o.stop(at + 0.4);
    },
    crash(at, v = 1) {
      const n = N(at, 2.6), hp = F("highpass", 4200), g = G();
      ad(g, at, 0.2 * v, 0.003, 2.4);
      n.connect(hp).connect(g).connect(drums);
      send(g, revIn, 0.3);
    },
    // Pad : 3 dents de scie désaccordées par note, filtrées, stéréo
    pad(at, notes, dur, v = 1, cutoff = 1800, att = 0.5) {
      const f = F("lowpass", cutoff, 0.6);
      const g = G();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.055 * v, at + att);
      g.gain.setValueAtTime(0.055 * v, at + dur);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 1.1);
      f.connect(g).connect(pump);
      send(g, revIn, 0.5);
      for (const m of notes)
        for (const [det, p] of [[-9, -0.6], [0, 0], [9, 0.6]]) {
          const o = O("sawtooth", mtof(m), at);
          o.detune.value = det + (R() - 0.5) * 3;
          o.connect(pan(p)).connect(f);
          o.start(at);
          o.stop(at + dur + 1.2);
        }
      return f;
    },
    bass(at, m, dur, v = 1, open = 1) {
      const o1 = O("sawtooth", mtof(m), at), o2 = O("square", mtof(m), at);
      o2.detune.value = -7;
      const f = F("lowpass", 260, 5);
      f.frequency.setValueAtTime(260 + 1500 * open, at);
      f.frequency.exponentialRampToValueAtTime(240, at + 0.16);
      const g = G();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.11 * v, at + 0.005);
      g.gain.setValueAtTime(0.095 * v, at + Math.max(0.02, dur - 0.03));
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.04);
      const s = O("sine", mtof(m), at), gs = G(0.16 * v);
      gs.gain.setValueAtTime(0.16 * v, at + Math.max(0.02, dur - 0.03));
      gs.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.04);
      o1.connect(f);
      o2.connect(f);
      f.connect(g).connect(pump);
      s.connect(gs).connect(pump);
      for (const o of [o1, o2, s]) {
        o.start(at);
        o.stop(at + dur + 0.1);
      }
    },
    // Basse tenue avec filtre qui s'ouvre (reveal)
    bassSwell(at, m, dur) {
      const o = O("sawtooth", mtof(m), at), s = O("sine", mtof(m), at);
      const f = F("lowpass", 120, 3);
      f.frequency.setValueAtTime(120, at);
      f.frequency.exponentialRampToValueAtTime(900, at + dur * 0.8);
      const g = G();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.13, at + 0.3);
      g.gain.setValueAtTime(0.13, at + dur);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.3);
      o.connect(f);
      s.connect(f);
      f.connect(g).connect(bus);
      for (const x of [o, s]) {
        x.start(at);
        x.stop(at + dur + 0.4);
      }
    },
    pluck(at, m, v = 1, dly = 0.35) {
      const o = O("square", mtof(m), at);
      const o2 = O("triangle", mtof(m + 12), at);
      const f = F("lowpass", 3800, 2);
      f.frequency.setValueAtTime(3800, at);
      f.frequency.exponentialRampToValueAtTime(500, at + 0.16);
      const g = G();
      ad(g, at, 0.07 * v, 0.003, 0.2);
      const g2 = G(0.4);
      o.connect(f);
      o2.connect(g2).connect(f);
      f.connect(g).connect(pump);
      send(g, dIn, dly);
      send(g, revIn, 0.2);
      o.start(at);
      o2.start(at);
      o.stop(at + 0.3);
      o2.stop(at + 0.3);
    },
    lead(at, m, dur, v = 1) {
      const end = at + dur * BEAT;
      const f = F("lowpass", 3400, 1.2);
      const g = G();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.085 * v, at + 0.025);
      g.gain.setValueAtTime(0.075 * v, end - 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, end + 0.28);
      f.connect(g).connect(lead);
      send(g, dIn, 0.42);
      send(g, revIn, 0.45);
      const lfo = O("sine", 5.6, at), lg = G(0);
      lg.gain.setValueAtTime(0, at);
      lg.gain.linearRampToValueAtTime(mtof(m) * 0.006, at + Math.min(0.5, dur * BEAT));
      lfo.connect(lg);
      for (const det of [-8, 8]) {
        const o = O("sawtooth", mtof(m), at);
        o.detune.value = det;
        lg.connect(o.frequency);
        o.connect(f);
        o.start(at);
        o.stop(end + 0.35);
      }
      const sq = O("square", mtof(m - 12), at), gq = G(0.25);
      lg.connect(sq.frequency);
      sq.connect(gq).connect(f);
      sq.start(at);
      sq.stop(end + 0.35);
      lfo.start(at);
      lfo.stop(end + 0.35);
    },
    stab(at, notes, v = 1) {
      const f = F("lowpass", 5200, 1.5);
      f.frequency.setValueAtTime(5200, at);
      f.frequency.exponentialRampToValueAtTime(700, at + 0.35);
      const g = G();
      ad(g, at, 0.09 * v, 0.004, 0.42);
      f.connect(g).connect(bus);
      send(g, revIn, 0.6);
      send(g, dIn, 0.2);
      for (const m of notes)
        for (const det of [-11, 11]) {
          const o = O("sawtooth", mtof(m), at);
          o.detune.value = det;
          o.connect(f);
          o.start(at);
          o.stop(at + 0.6);
        }
    },
    // ——— Sound design ———
    impact(at, size = 1) {
      const s = O("sine", 72, at);
      s.frequency.exponentialRampToValueAtTime(28, at + 1.4);
      const gs = G();
      ad(gs, at, 0.6 * size, 0.004, 1.8 * size);
      s.connect(gs).connect(fx);
      s.start(at);
      s.stop(at + 2.4 * size);
      const b = O("sine", 140, at);
      b.frequency.exponentialRampToValueAtTime(42, at + 0.25);
      const sh = ctx.createWaveShaper();
      sh.curve = drive;
      const gb = G();
      ad(gb, at, 0.4 * size, 0.002, 0.7);
      b.connect(sh).connect(gb).connect(fx);
      b.start(at);
      b.stop(at + 1);
      const n = N(at, 2.2), lp = F("lowpass", 4500, 0.5), gn = G();
      lp.frequency.setValueAtTime(4500, at);
      lp.frequency.exponentialRampToValueAtTime(180, at + 1.6);
      ad(gn, at, 0.42 * size, 0.003, 1.8);
      n.connect(lp).connect(gn).connect(fx);
      send(gn, revIn, 0.9);
      I.crash(at, 0.9 * size);
      duck(at, 0.85);
    },
    riser(at, dur, v = 1) {
      const n = N(at, dur), bp = F("bandpass", 300, 3), g = G();
      bp.frequency.setValueAtTime(260, at);
      bp.frequency.exponentialRampToValueAtTime(7500, at + dur);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.32 * v, at + dur);
      g.gain.setValueAtTime(0, at + dur + 0.01);
      n.connect(bp).connect(g).connect(fx);
      send(g, revIn, 0.5);
      const o = O("sawtooth", 110, at), lp = F("lowpass", 1800), go = G();
      o.frequency.exponentialRampToValueAtTime(880, at + dur);
      go.gain.setValueAtTime(0.0001, at);
      go.gain.exponentialRampToValueAtTime(0.06 * v, at + dur);
      go.gain.setValueAtTime(0, at + dur + 0.01);
      o.connect(lp).connect(go).connect(fx);
      send(go, dIn, 0.3);
      o.start(at);
      o.stop(at + dur + 0.05);
    },
    reverse(at, dur, v = 1) {
      const n = N(at, dur), hp = F("highpass", 2400), g = G();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.4 * v, at + dur);
      g.gain.setValueAtTime(0, at + dur + 0.008);
      n.connect(hp).connect(g).connect(fx);
      send(g, revIn, 0.3);
    },
    whoosh(at, dur = 0.5, dir = 1, v = 1) {
      const n = N(at, dur), bp = F("bandpass", 500, 1.6), g = G(), p = ctx.createStereoPanner();
      bp.frequency.setValueAtTime(450, at);
      bp.frequency.exponentialRampToValueAtTime(3800, at + dur * 0.55);
      bp.frequency.exponentialRampToValueAtTime(600, at + dur);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.5 * v, at + dur * 0.55);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      p.pan.setValueAtTime(-0.9 * dir, at);
      p.pan.linearRampToValueAtTime(0.9 * dir, at + dur);
      n.connect(bp).connect(g).connect(p).connect(fx);
      send(g, revIn, 0.3);
    },
    downlifter(at, dur) {
      const o = O("sawtooth", 1100, at), lp = F("lowpass", 2600), g = G();
      o.frequency.exponentialRampToValueAtTime(55, at + dur);
      lp.frequency.setValueAtTime(2600, at);
      lp.frequency.exponentialRampToValueAtTime(160, at + dur);
      g.gain.setValueAtTime(0.09, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(lp).connect(g).connect(fx);
      send(g, revIn, 0.4);
      o.start(at);
      o.stop(at + dur + 0.05);
    },
    // Tube néon qui s'allume : bourdonnement et grésillements irréguliers
    zap(at, v = 1) {
      const o = O("sawtooth", 98, at), bp = F("bandpass", 1500, 2.5), g = G();
      const pat = [1, 0, 0.8, 0, 0, 1, 0.3, 1];
      g.gain.setValueAtTime(0, at);
      pat.forEach((k, i) => g.gain.setValueAtTime(k * 0.09 * v, at + i * 0.028));
      g.gain.setValueAtTime(0.05 * v, at + pat.length * 0.028);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      o.connect(bp).connect(g).connect(fx);
      send(g, revIn, 0.2);
      o.start(at);
      o.stop(at + 0.55);
      const n = N(at, 0.25), hp = F("highpass", 5000), gn = G();
      gn.gain.setValueAtTime(0, at);
      pat.forEach((k, i) => gn.gain.setValueAtTime(k * 0.12 * v, at + i * 0.028 + 0.004));
      gn.gain.setValueAtTime(0, at + 0.25);
      n.connect(hp).connect(gn).connect(fx);
      const t = O("sine", 2600, at), gt = G();
      ad(gt, at, 0.05 * v, 0.001, 0.12);
      t.connect(gt).connect(fx);
      send(gt, dIn, 0.4);
      t.start(at);
      t.stop(at + 0.2);
    },
    buzz(at, dur) {
      const o = O("sawtooth", 100, at), bp = F("bandpass", 1700, 3), g = G();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.025, at + 0.05);
      g.gain.setValueAtTime(0.025, at + dur - 0.1);
      g.gain.linearRampToValueAtTime(0.0001, at + dur);
      o.connect(bp).connect(g).connect(fx);
      o.start(at);
      o.stop(at + dur + 0.05);
    },
    pop(at, v = 1) {
      const o = O("sine", 520, at), g = G();
      o.frequency.exponentialRampToValueAtTime(1500, at + 0.06);
      ad(g, at, 0.28 * v, 0.002, 0.12);
      o.connect(g).connect(fx);
      send(g, dIn, 0.25);
      send(g, revIn, 0.25);
      o.start(at);
      o.stop(at + 0.2);
    },
    blip(at, f = 1400, v = 1) {
      const o = O("sine", f, at), g = G();
      ad(g, at, 0.12 * v, 0.002, 0.08);
      o.connect(g).connect(pan((R() - 0.5) * 0.8)).connect(fx);
      send(g, dIn, 0.25);
      o.start(at);
      o.stop(at + 0.12);
    },
    click(at, v = 1) {
      const n = N(at, 0.03), hp = F("highpass", 3500), g = G();
      ad(g, at, 0.16 * v, 0.001, 0.018);
      n.connect(hp).connect(g).connect(pan((R() - 0.5) * 0.6)).connect(fx);
    },
    glitch(at, dur) {
      const sh = ctx.createWaveShaper();
      sh.curve = crushCurve;
      const g = G(0.11);
      sh.connect(g).connect(fx);
      send(g, dIn, 0.15);
      const step = BEAT / 8;
      for (let x = 0; x < dur; x += step) {
        if (R() < 0.3) continue;
        const t = at + x;
        if (R() < 0.55) {
          const o = O("square", 200 + R() * 1800, t), go = G();
          ad(go, t, 0.6, 0.001, step * 0.8);
          o.connect(go).connect(sh);
          o.start(t);
          o.stop(t + step);
        } else {
          const n = N(t, step), go = G();
          ad(go, t, 0.7, 0.001, step * 0.7);
          n.connect(go).connect(sh);
        }
      }
    },
    laser(at, v = 1) {
      const o = O("sawtooth", 2600, at), bp = F("bandpass", 1600, 3), g = G(), p = ctx.createStereoPanner();
      o.frequency.exponentialRampToValueAtTime(160, at + 0.4);
      ad(g, at, 0.1 * v, 0.003, 0.4);
      p.pan.setValueAtTime(-0.8, at);
      p.pan.linearRampToValueAtTime(0.8, at + 0.4);
      o.connect(bp).connect(g).connect(p).connect(fx);
      send(g, dIn, 0.3);
      o.start(at);
      o.stop(at + 0.45);
    },
    bell(at, m, v = 1) {
      const parts = [[1, 0.22, 2.4], [2.0, 0.08, 1.4], [3.01, 0.05, 0.8], [4.17, 0.025, 0.45]];
      for (const [r, a, d] of parts) {
        const o = O("sine", mtof(m) * r, at), g = G();
        ad(g, at, a * v, 0.002, d);
        o.connect(g).connect(fx);
        send(g, revIn, 0.5);
        send(g, dIn, 0.25);
        o.start(at);
        o.stop(at + d + 0.1);
      }
    },
    thump(at, v = 1) {
      const o = O("sine", 78, at), g = G();
      o.frequency.exponentialRampToValueAtTime(44, at + 0.35);
      ad(g, at, 0.55 * v, 0.004, 0.55);
      o.connect(g).connect(fx);
      send(g, revIn, 0.35);
      o.start(at);
      o.stop(at + 0.7);
      const n = N(at, 0.2), lp = F("lowpass", 900), gn = G();
      ad(gn, at, 0.08 * v, 0.002, 0.15);
      n.connect(lp).connect(gn).connect(fx);
      send(gn, revIn, 0.6);
    },
    shimmer(at, dur, v = 1) {
      const n = N(at, dur), bp = F("bandpass", 6000, 6), g = G();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.18 * v, at + dur * 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      n.connect(bp).connect(g).connect(fx);
      send(g, revIn, 0.7);
      send(g, dIn, 0.3);
    },
    drone(at, m, dur) {
      const o = O("sine", mtof(m), at), o2 = O("triangle", mtof(m + 12), at), g = G();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.08, at + dur * 0.5);
      g.gain.setValueAtTime(0.08, at + dur - 0.2);
      g.gain.linearRampToValueAtTime(0.0001, at + dur);
      const g2 = G(0.18);
      o.connect(g);
      o2.connect(g2).connect(g);
      g.connect(bus);
      for (const x of [o, o2]) {
        x.start(at);
        x.stop(at + dur + 0.05);
      }
    },
  };

  // ——— Partition ———
  // Renvoie la liste des événements { t (s, relatif au début), run(absTime) } triée.
  function score() {
    const ev = [];
    const at = (beat, fn) => ev.push({ t: beat * BEAT, run: fn });
    const chordAt = (bar) => CHORDS[BARS[Math.min(bar, BARS.length - 1)]];

    // PADS : une nappe par mesure (brillance selon la section)
    for (let bar = 0; bar < 16; bar++) {
      const c = chordAt(bar);
      const cut = bar < 2 ? 700 + bar * 500 : bar === 6 ? 1300 : bar >= 13 ? 2600 : 2000;
      const v = bar < 2 ? 0.9 : bar === 6 ? 1.1 : 1;
      const att = bar === 0 ? 2.0 : bar === 6 ? 0.15 : 0.35;
      at(bar * 4, (t) => I.pad(t, c.pad, 4 * BEAT - 0.05, v, cut, att));
    }
    // accord final, longue tenue
    at(64, (t) => I.pad(t, [45, 57, 60, 64, 67, 71, 76], BEAT * 5, 1.25, 2400, 0.08));
    at(0, (t) => I.drone(t, 33, 8 * BEAT));

    // SCÈNE 1 — l'attente : battements de cœur sur les mots, arpège lointain, montée
    [2, 3, 4, 5].forEach((b, i) => at(b, (t) => I.thump(t, 0.8 + i * 0.1)));
    at(1, (t) => I.shimmer(t, BEAT * 2.5, 0.8));
    [4, 4.75, 5.5, 6, 6.5, 7].forEach((b, i) => at(b, (t) => I.pluck(t, CHORDS.F.arp[i % 5], 0.7, 0.5)));
    at(5, (t) => I.riser(t, BEAT * 3, 1));
    at(6, (t) => I.reverse(t, BEAT * 2, 1));

    // DRUMS & BASSE
    const groove = (bar, { ghost = true, fill = false, half = false } = {}) => {
      const b0 = bar * 4;
      if (half) {
        at(b0, (t) => I.kick(t, 1));
        at(b0 + 2, (t) => I.snare(t, 1, 0.8));
        for (let i = 0; i < 4; i++) at(b0 + i, (t) => I.hat(t, 0.6));
        return;
      }
      at(b0, (t) => I.kick(t, 1));
      at(b0 + 2, (t) => I.kick(t, 0.95));
      if (ghost && bar % 2 === 1) at(b0 + 2.5 + 0.25, (t) => I.kick(t, 0.6));
      at(b0 + 1, (t) => {
        I.snare(t);
        I.clap(t, 0.6);
      });
      if (!fill) at(b0 + 3, (t) => {
        I.snare(t);
        I.clap(t, 0.6);
      });
      for (let i = 0; i < 8; i++) {
        if (fill && i >= 4) break;
        at(b0 + i * 0.5, (t) => I.hat(t, i % 2 ? 1 : 0.55, i === 7));
      }
      for (let i = 0; i < 16; i += 2) if (!fill || i < 8) at(b0 + i * 0.25 + 0.25, (t) => I.hat(t, 0.25));
    };
    const bassBar = (bar, beats = 4) => {
      const c = chordAt(bar);
      for (let i = 0; i < beats * 2; i++) {
        const m = c.bass + (i % 2 ? 12 : 0);
        at(bar * 4 + i * 0.5, (t) => I.bass(t, m, BEAT * 0.45, i % 2 ? 0.8 : 1, i % 4 === 0 ? 1 : 0.6));
      }
    };
    const arpBar = (bar, v = 1, beats = 4) => {
      const c = chordAt(bar).arp;
      const order = [0, 1, 2, 3, 4, 3, 2, 1];
      for (let i = 0; i < beats * 4; i++) at(bar * 4 + i * 0.25, (t) => I.pluck(t, c[order[i % 8]], v * (i % 4 === 0 ? 1 : 0.7)));
    };

    // SCÈNE 2 — l'annonce (mesures 2 à 5)
    at(8, (t) => I.impact(t, 0.9));
    for (let bar = 2; bar <= 5; bar++) {
      groove(bar, { fill: bar === 5 });
      bassBar(bar, bar === 5 ? 3 : 4);
      arpBar(bar, 0.8, bar === 5 ? 3 : 4);
    }
    at(9, (t) => I.stab(t, [57, 64, 69, 72], 0.9));
    at(11.75, (t) => I.whoosh(t, BEAT * 0.75, 1, 1.1));
    at(12.5, (t) => I.zap(t, 1));
    at(13, (t) => I.zap(t, 1.1));
    at(13.2, (t) => I.buzz(t, BEAT * 2.6));
    at(15.75, (t) => I.whoosh(t, BEAT * 0.6, -1, 1));
    at(16, (t) => I.crash(t, 0.8));
    at(20, (t) => I.riser(t, BEAT * 3, 0.8));
    // roulement de toms puis silence (le souffle avant le reveal)
    [22, 22.25, 22.5, 22.75].forEach((b, i) => at(b, (t) => I.tom(t, [190, 160, 130, 100][i], 1)));
    at(22.5, (t) => I.downlifter(t, BEAT * 0.5));
    at(23, (t) => I.reverse(t, BEAT, 1.2));

    // SCÈNE 3 — reveal Cliko
    at(24, (t) => {
      I.impact(t, 1.25);
      I.kick(t, 1);
    });
    at(24, (t) => I.bassSwell(t, 33, BEAT * 4));
    arpBar(6, 0.45);
    at(24.5, (t) => I.shimmer(t, BEAT * 3, 1));
    // un grésillement par trait du logo (C, l, i, k)
    [25, 25.6, 26, 26.6, 27.0, 27.2].forEach((b, i) => at(b, (t) => I.zap(t, 0.7 + (i % 2) * 0.2)));
    at(26.5, (t) => I.pop(t, 1));
    at(27.75, (t) => I.reverse(t, BEAT * 0.25, 0.8));
    // WE · ARE · TOO.
    const stabC = [[57, 60, 64, 69], [57, 60, 65, 69], [60, 64, 67, 72]];
    [28, 29, 30].forEach((b, i) =>
      at(b, (t) => {
        I.stab(t, stabC[i], 1.1);
        I.snare(t, 0.9, 0.7);
        I.kick(t, 1);
      }),
    );
    at(28, (t) => I.crash(t, 1));
    for (let bar = 7; bar <= 8; bar++) {
      if (bar === 7) {
        // la mesure des stabs : groove allégé à partir du 4e temps
        at(31, (t) => I.snare(t));
        for (let i = 6; i < 8; i++) at(28 + i * 0.5, (t) => I.hat(t, i % 2 ? 1 : 0.55, i === 7));
        for (let i = 0; i < 2; i++) at(31 + i * 0.5, (t) => I.bass(t, chordAt(7).bass + (i % 2 ? 12 : 0), BEAT * 0.45));
      } else {
        groove(bar);
        bassBar(bar);
      }
      arpBar(bar, 0.9);
    }
    at(35.5, (t) => I.whoosh(t, BEAT * 0.7, 1, 1));

    // SCÈNE 4 — ce que nous créons (mesures 9 à 12), mélodie principale
    for (let bar = 9; bar <= 12; bar++) {
      groove(bar);
      bassBar(bar);
      arpBar(bar, 0.6);
    }
    HOOK.forEach(([b, m, d]) => at(36 + b, (t) => I.lead(t, m, d, 0.85)));
    [36, 40, 44, 48].forEach((b) => at(b, (t) => I.crash(t, 0.7)));
    // M1 — sites web : la fenêtre se dessine, les blocs claquent
    at(36, (t) => I.laser(t, 0.6));
    [36.8, 36.9, 37.0].forEach((b, i) => at(b, (t) => I.blip(t, 1500 + i * 300, 0.8)));
    [37.25, 37.5, 38, 38.5, 38.75, 39].forEach((b, i) => at(b, (t) => I.blip(t, [900, 1200, 1000, 1350, 1500, 1700][i], 1)));
    at(39.5, (t) => {
      I.click(t, 1.4);
      I.pop(t, 0.6);
    });
    at(39.75, (t) => I.whoosh(t, BEAT * 0.5, 1, 0.9));
    // M2 — expériences digitales : glitchs
    at(40, (t) => I.glitch(t, BEAT * 0.75));
    at(41, (t) => I.glitch(t, BEAT * 0.25));
    [41, 42, 43].forEach((b) => at(b, (t) => I.pop(t, 0.5)));
    at(42.5, (t) => I.glitch(t, BEAT * 0.4));
    at(43.75, (t) => I.whoosh(t, BEAT * 0.5, -1, 0.9));
    // M3 — solutions modernes : cartes qui pivotent
    [44.5, 45, 45.5].forEach((b, i) => at(b, (t) => I.whoosh(t, BEAT * 0.4, i % 2 ? -1 : 1, 0.7)));
    [44.7, 45.2, 45.7].forEach((b) => at(b, (t) => I.click(t, 1.2)));
    at(47.75, (t) => I.whoosh(t, BEAT * 0.5, 1, 0.9));
    // M4 — développement sur mesure : frappe au clavier puis balayage
    for (let i = 0; i < 44; i++) {
      const b = 48.3 + i * 0.062 + (i % 5 === 4 ? 0.06 : 0);
      if (b < 51) at(b, (t) => I.click(t, 0.6 + R() * 0.5));
    }
    at(51, (t) => I.laser(t, 0.8));
    at(51.25, (t) => I.riser(t, BEAT * 0.75, 0.7));

    // SCÈNE 5 — la signature
    at(52, (t) => I.impact(t, 1));
    for (let bar = 13; bar <= 14; bar++) {
      groove(bar);
      bassBar(bar);
      arpBar(bar, 0.7);
    }
    groove(15, { half: true });
    bassBar(15, 4);
    arpBar(15, 0.5);
    HOOK.filter(([b]) => b < 8).forEach(([b, m, d]) => at(52 + b, (t) => I.lead(t, m + 12, d, 0.7)));
    [[60, 74, 2], [62, 71, 1], [63, 74, 1]].forEach(([b, m, d]) => at(b, (t) => I.lead(t, m + 12, d, 0.65)));
    // lettres du slogan : scintillement montant
    for (let i = 0; i < 8; i++) at(54 + i * 0.25, (t) => I.bell(t, [81, 84, 88, 91, 93, 96, 100, 103][i], 0.35));
    at(56, (t) => I.bell(t, 76, 1));
    at(58, (t) => I.pop(t, 0.5));
    at(63, (t) => I.reverse(t, BEAT, 0.9));
    at(64, (t) => {
      I.impact(t, 0.9);
      I.bass(t, 33, BEAT * 4, 1, 0.3);
      I.bell(t, 69, 0.8);
    });

    ev.sort((a, b) => a.t - b.t);
    return ev;
  }

  return { ctx, master, score, I, now0 };
}

// ——— Lecture en direct ———
export class LivePlayer {
  constructor() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC({ latencyHint: "interactive" });
    this.engine = createEngine(this.ctx);
    this.events = this.engine.score();
    this.i = 0;
    this.t0 = 0;
    this.timer = 0;
    this.muted = false;
  }
  get latency() {
    return (this.ctx.outputLatency || 0) + (this.ctx.baseLatency || 0);
  }
  // Démarre la partition comme si on était à `offset` secondes du début, avec un pré-délai.
  start(offset = 0, preroll = 0.08) {
    this.t0 = this.ctx.currentTime + preroll - offset;
    this.i = this.events.findIndex((e) => e.t >= offset - 0.02);
    if (this.i < 0) this.i = this.events.length;
    const m = this.engine.master.gain;
    m.cancelScheduledValues(this.ctx.currentTime);
    m.setValueAtTime(this.muted ? 0 : 0.82, this.ctx.currentTime);
    this.tick();
    this.timer = setInterval(() => this.tick(), 25);
  }
  tick() {
    const horizon = this.ctx.currentTime + 0.18;
    while (this.i < this.events.length && this.t0 + this.events[this.i].t < horizon) {
      const e = this.events[this.i++];
      const at = Math.max(this.t0 + e.t, this.ctx.currentTime + 0.005);
      try {
        e.run(at);
      } catch {
        /* un événement raté ne doit jamais casser la lecture */
      }
    }
  }
  time() {
    return this.ctx.currentTime - this.t0 - this.latency;
  }
  setMuted(m) {
    this.muted = m;
    const g = this.engine.master.gain, now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(m ? 0 : 0.82, now, 0.06);
  }
  fadeOut(sec = 0.8) {
    const g = this.engine.master.gain, now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + sec);
    setTimeout(() => this.close(), sec * 1000 + 100);
  }
  close() {
    clearInterval(this.timer);
    this.ctx.close?.().catch(() => {});
  }
}

// ——— Rendu hors ligne (vidéo) : renvoie un AudioBuffer stéréo ———
export async function renderOffline(seconds, sampleRate = 48000) {
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  const eng = createEngine(ctx);
  for (const e of eng.score()) if (e.t < seconds) e.run(e.t + 0.0001);
  return ctx.startRendering();
}
