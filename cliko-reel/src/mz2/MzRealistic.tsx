// Short Mile Zero « GTA 6 is TOO realistic » — gameplay de l'utilisateur (captures PS5), caméra virtuelle qui
// plonge sur 4 détails, annotations, compteur « detail x/4 », boucle : la fin revient sur le panneau du début.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import "../brand";
import { FONT } from "../brand";
import align from "./alignment.json";

export const R_FPS = 30;
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const M = { ink: "#0d0d0f", paper: "#f1ece3", gold: "#d9a35b", red: "#ff3b4e", dim: "rgba(241,236,227,.6)" };
type Word = { text: string; start: number; end: number; scene: string };
const WORDS = align.words as Word[];
export const R_TOTAL = Math.ceil((align.scenes[align.scenes.length - 1].end + 0.35) * R_FPS);
// frame absolue d'un mot (n-ième occurrence dans la scène)
const w = (scene: string, re: RegExp, nth = 0) => {
  const ws = WORDS.filter((x) => x.scene === scene && re.test(x.text));
  return Math.round(ws[Math.min(nth, ws.length - 1)].start * R_FPS);
};
const sStart = (id: string) => Math.round(align.scenes.find((s) => s.scene === id)!.start * R_FPS);

// --- caméra --------------------------------------------------------------------------------
const IW = 1918, IH = 1072, S = 1920 / IH; // image mise à l'échelle sur la hauteur du cadre
type Key = { f: number; x: number; y: number; z: number; snap?: boolean };
const expo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const cam = (keys: Key[], f: number) => {
  let a = keys[0], b = keys[0];
  for (let i = 0; i < keys.length; i++) if (f >= keys[i].f) { a = keys[i]; b = keys[i + 1] ?? keys[i]; }
  if (f < keys[0].f) return { ...keys[0] };
  const span = b.snap ? 7 : Math.max(1, b.f - a.f);
  const t = b === a ? 1 : Math.min(1, Math.max(0, (f - (b.snap ? b.f - 7 : a.f)) / span));
  const e = b.snap ? expo(t) : smooth(t);
  if (b.snap && f < b.f - 7) return { x: a.x, y: a.y, z: a.z };
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, z: a.z + (b.z - a.z) * e };
};
const clampCam = (c: { x: number; y: number; z: number }) => {
  const hx = 540 / (S * c.z), hy = 960 / (S * c.z);
  return { z: c.z, x: Math.min(IW - hx, Math.max(hx, c.x)), y: Math.min(IH - hy, Math.max(hy, c.y)) };
};
const toScreen = (c: { x: number; y: number; z: number }, tx: number, ty: number) => ({ x: 540 + (tx - c.x) * S * c.z, y: 960 + (ty - c.y) * S * c.z });

type Shot = { img: string; from: number; to: number; keys: Key[]; rings?: { at: number; x: number; y: number; r: number; color?: string }[] };

const ShotView: React.FC<{ shot: Shot }> = ({ shot }) => {
  const f = useCurrentFrame();
  const c = clampCam(cam(shot.keys, f));
  const p = clampCam(cam(shot.keys, f - 1));
  const speed = Math.abs(c.z - p.z) * 40 + Math.hypot(c.x - p.x, c.y - p.y) * 0.08;
  const left = 540 - c.x * S * c.z, top = 960 - c.y * S * c.z;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: M.ink }}>
      <Img src={staticFile(`mz2/${shot.img}.jpg`)} style={{ position: "absolute", left, top, width: IW * S * c.z, height: IH * S * c.z, filter: `blur(${Math.min(14, speed)}px)` }} />
      {(shot.rings ?? []).map((r, i) => {
        if (f < r.at) return null;
        const pt = toScreen(c, r.x, r.y);
        const rad = r.r * S * c.z;
        const draw = interpolate(f - r.at, [0, 8], [0, 1], CL);
        const circ = 2 * Math.PI * rad;
        return (
          <svg key={i} style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
            <circle cx={pt.x} cy={pt.y} r={rad} fill="none" stroke={r.color ?? M.red} strokeWidth={9} strokeDasharray={circ} strokeDashoffset={circ * (1 - draw)} transform={`rotate(-90 ${pt.x} ${pt.y})`} style={{ filter: "drop-shadow(0 0 10px rgba(255,59,78,.7))" }} />
          </svg>
        );
      })}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,13,15,.8) 0%, rgba(13,13,15,.1) 27%, rgba(13,13,15,0) 52%, rgba(13,13,15,.35) 62%, rgba(13,13,15,.9) 80%)" }} />
    </AbsoluteFill>
  );
};

// --- montage (coordonnées en pixels de capture 1918×1072) ------------------------------------
const SIGN = { x: 1414, y: 848 }, NOTICE = { x: 1262, y: 853 }, BADGE = { x: 1002, y: 934 }, HUDNAME = { x: 176, y: 800 }, AMMU = { x: 1840, y: 112 };
const T = {
  clubs: w("hook", /^clubs/), no: w("hook", /^NO/), look: w("age", /^Look/), notice: w("age", /^notice/), nobody: w("age", /^nobody/), u21: w("age", /^21/),
  car: sStart("car"), obey: w("car", /^Obey/), badge: w("car", /^badge/), audi: w("car", /^Audi/),
  ammu: sStart("ammu"), cust: w("ammu", /^Customer/), rifle: w("ammu", /^rifle/), parkHere: w("ammu", /^parking/, 1), line: w("ammu", /^That's/),
  out: sStart("outro"), comment: w("outro", /^Comment/), refunds: w("outro", /^no$/),
};
const SHOTS: Shot[] = [
  { img: "club", from: 0, to: T.look - 2, keys: [
    { f: 0, ...SIGN, z: 3.4 }, { f: T.clubs, x: 1100, y: 600, z: 1.05, snap: true }, { f: T.no - 1, x: 1150, y: 620, z: 1.12 }, { f: T.no, ...SIGN, z: 3.0, snap: true }, { f: T.look, ...SIGN, z: 3.2 } ],
    rings: [{ at: T.no + 2, ...SIGN, r: 62 }] },
  { img: "club", from: T.look - 2, to: T.car - 2, keys: [
    { f: T.look - 2, x: 1000, y: 620, z: 1.0 }, { f: T.notice, ...NOTICE, z: 2.2 }, { f: T.nobody, ...NOTICE, z: 3.8, snap: true }, { f: T.car, ...NOTICE, z: 4.1 } ],
    rings: [{ at: T.nobody + 3, ...NOTICE, r: 46, color: M.gold }] },
  { img: "car", from: T.car - 2, to: T.ammu - 2, keys: [
    { f: T.car - 2, x: 980, y: 700, z: 1.0 }, { f: T.obey, ...HUDNAME, z: 2.6, snap: true }, { f: T.badge - 1, x: 230, y: 790, z: 2.7 }, { f: T.badge, x: BADGE.x, y: BADGE.y - 40, z: 2.9, snap: true }, { f: T.ammu, x: BADGE.x, y: BADGE.y - 40, z: 3.1 } ],
    rings: [{ at: T.badge + 3, ...BADGE, r: 34 }] },
  { img: "ammu", from: T.ammu - 2, to: T.out - 2, keys: [
    { f: T.ammu - 2, x: 860, y: 600, z: 1.0 }, { f: T.cust - 1, x: 900, y: 580, z: 1.12 }, { f: T.cust, ...AMMU, z: 3.0, snap: true }, { f: T.rifle, x: AMMU.x, y: AMMU.y + 20, z: 3.2 },
    { f: T.line, x: 860, y: 560, z: 1.25, snap: true }, { f: T.out, x: 860, y: 560, z: 1.35 } ],
    rings: [{ at: T.cust + 3, ...AMMU, r: 80, color: M.gold }] },
  { img: "night", from: T.out - 2, to: T.refunds, keys: [ { f: T.out - 2, x: 950, y: 600, z: 1.0 }, { f: T.refunds, x: 950, y: 640, z: 1.3 } ] },
  // boucle : retour sur le panneau du début
  { img: "club", from: T.refunds, to: R_TOTAL + 1, keys: [ { f: T.refunds, x: 1150, y: 620, z: 1.1 }, { f: T.refunds + 7, ...SIGN, z: 3.4, snap: true } ] },
];

// --- habillage Mile Zero -------------------------------------------------------------------
const Header: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 150, fontFamily: FONT.mono }}>
    <div style={{ color: M.paper, fontSize: 28, fontWeight: 700, letterSpacing: 7 }}>MILE ZERO</div>
    <div style={{ marginTop: 8, color: M.dim, fontSize: 20, background: "rgba(0,0,0,.45)", padding: "3px 10px", display: "inline-block" }}>My gameplay · PS5</div>
  </div>
);
const Marker: React.FC<{ n: number }> = ({ n }) => {
  const f = useCurrentFrame();
  const changes = [0, T.look, T.car, T.ammu];
  const last = changes[n - 1] ?? 0;
  const pop = spring({ frame: f - last, fps: R_FPS, config: { damping: 10, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", right: 70, top: 130, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
      <div style={{ width: 74, height: 96, background: M.paper, borderRadius: 8, border: `4px solid ${M.ink}`, boxShadow: `0 0 0 3px ${M.paper}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, color: M.ink, transform: `scale(${0.8 + 0.2 * pop})` }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1 }}>MILE</div>
        <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>D{n}</div>
      </div>
      <div style={{ fontFamily: FONT.mono, fontSize: 22, fontWeight: 700, color: M.paper, letterSpacing: 2 }}>DETAIL {n}/4</div>
      <div style={{ display: "flex", gap: 6 }}>{[1, 2, 3, 4].map((k) => <div key={k} style={{ width: 26, height: 6, background: k <= n ? M.gold : "rgba(241,236,227,.25)" }} />)}</div>
    </div>
  );
};
const Headline: React.FC<{ at: number; lines: [string, boolean][]; size?: number }> = ({ at, lines, size = 140 }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  return (
    <div style={{ position: "absolute", left: 66, top: 300, right: 60 }}>
      {lines.map(([t, gold], i) => {
        const p = expo(interpolate(f, [i * 2, i * 2 + 8], [0, 1], CL));
        return (
          <div key={i} style={{ overflow: "hidden" }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: size, lineHeight: 0.95, letterSpacing: -size * 0.035, color: gold ? M.gold : M.paper, textTransform: "uppercase", transform: `translateY(${(1 - p) * 105}%)`, textShadow: "0 6px 30px rgba(0,0,0,.55)" }}>{t}</div>
          </div>
        );
      })}
    </div>
  );
};
const Stamp: React.FC<{ at: number; text: string; color?: string; top: number; rot?: number }> = ({ at, text, color = M.red, top, rot = -8 }) => {
  const f = useCurrentFrame() - at;
  if (f < 0) return null;
  const t = expo(Math.min(1, f / 6));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `rotate(${rot}deg) scale(${2 - t})`, opacity: t, border: `9px solid ${color}`, color, fontFamily: FONT.display, fontWeight: 900, fontSize: 96, padding: "4px 30px", letterSpacing: -1, background: "rgba(13,13,15,.55)", textShadow: `0 0 20px ${color}88` }}>{text}</div>
    </div>
  );
};

// Sous-titres : 1 à 3 mots, mots-clés en or, petit rebond
const KEY = /^(GTA|6|NO|REFUNDS|21|closer|Audi|badge|Obey|Tailgater|gun|Customer|parking|rifle|line|realistic|Comment|refunds)/i;
const chunks: Word[][] = [];
{
  let cur: Word[] = [];
  WORDS.forEach((x, i) => {
    cur.push(x);
    const n = WORDS[i + 1];
    if (!n || /[.,!?…:]$/.test(x.text) || cur.length >= 3 || cur.map((y) => y.text).join(" ").length + n.text.length > 17 || n.scene !== x.scene) { chunks.push(cur); cur = []; }
  });
}
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / R_FPS;
  const i = chunks.findIndex((c, k) => s >= c[0].start - 0.03 && (k === chunks.length - 1 || s < chunks[k + 1][0].start - 0.03));
  if (i < 0) return null;
  const c = chunks[i];
  if (s > c[c.length - 1].end + 0.4) return null;
  const local = (s - c[0].start) * R_FPS;
  const sc = interpolate(local, [0, 3, 6], [0.75, 1.07, 1], CL);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1270, textAlign: "center", transform: `scale(${sc})` }}>
      {c.map((x, k) => {
        const on = s >= x.start - 0.02;
        return (
          <span key={k} style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 78, textTransform: "uppercase", letterSpacing: -1, color: KEY.test(x.text) ? M.gold : M.paper, opacity: on ? 1 : 0.4, marginRight: 20, WebkitTextStroke: `8px ${M.ink}`, paintOrder: "stroke fill", textShadow: "0 6px 0 rgba(0,0,0,.6)" }}>{x.text.replace(/[…:]/g, "")}</span>
        );
      })}
    </div>
  );
};

export const MzRealistic: React.FC<{ sound: boolean }> = ({ sound }) => {
  const f = useCurrentFrame();
  const shot = SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[0];
  const n = f < T.look ? 1 : f < T.car ? 2 : f < T.ammu ? 3 : 4;
  const flash = shot.from === 0 ? 0 : interpolate(f - shot.from, [0, 3], [0.45, 0], CL);
  const kicks = [0, T.no, T.nobody, T.badge, T.cust, T.line, T.refunds];
  const k = kicks.filter((x) => f >= x).pop() ?? 0;
  const amp = Math.max(0, 1 - (f - k) / 8) * 14;
  const shx = Math.sin(f * 2.3) * amp, shy = Math.cos(f * 3.1) * amp;
  const lineDraw = interpolate(f, [T.line + 2, T.line + 10], [0, 1], CL);
  const outro = f >= T.out - 2 && f < T.refunds;
  return (
    <AbsoluteFill style={{ background: M.ink }}>
      <AbsoluteFill style={{ transform: `translate(${shx}px, ${shy}px)` }}>
        <ShotView shot={shot} key={shot.from} />
      </AbsoluteFill>
      {/* ligne rouge sur « draws the line » */}
      {f >= T.line && f < T.out - 2 && (
        <div style={{ position: "absolute", left: 0, top: 1150, height: 14, width: `${lineDraw * 100}%`, background: M.red, boxShadow: `0 0 24px ${M.red}` }} />
      )}
      <Header />
      <Marker n={n} />
      {f < T.look && <Headline at={-12} lines={[["No", false], ["refunds", true]]} size={170} />}
      {f >= T.look && f < T.car && <Headline at={T.nobody} lines={[["Under 21?", false], ["Not here", true]]} />}
      {f >= T.car && f < T.ammu && <Headline at={T.badge} lines={[["Basically", false], ["an Audi", true]]} />}
      {f >= T.ammu && f < T.out - 2 && <Headline at={T.cust} lines={[["Guns: yes", false], ["Parking: no", true]]} />}
      {outro && <Headline at={T.out} lines={[["Too", false], ["realistic?", true]]} size={128} />}
      {f >= T.u21 && f < T.car && <Stamp at={T.u21} text="21+" top={1020} />}
      {f >= T.audi && f < T.ammu && <Stamp at={T.audi} text="AUDI?" color={M.gold} top={1020} rot={6} />}
      {f >= T.comment && f < T.refunds && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1450, display: "flex", justifyContent: "center", transform: `scale(${spring({ frame: f - T.comment, fps: R_FPS, config: { damping: 11 } })})` }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 46, color: M.ink, background: M.paper, padding: "14px 34px", borderRadius: 40 }}>YES or NO?</div>
        </div>
      )}
      <Captions />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      {sound && <Audio src={staticFile("mz2/mix.wav")} />}
    </AbsoluteFill>
  );
};
