// Short Mile Zero « 4 GTA 6 secrets found in 24 hours » — compte à rebours #4 → #1, la récompense (le vrai œuf de
// Pâques) est annoncée dès l'accroche. Images officielles Rockstar + gameplay PS5 de l'utilisateur (voiture, nuit).
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import "../brand";
import { FONT } from "../brand";
import align from "./alignment.json";

export const SE_FPS = 30;
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const M = { ink: "#0d0d0f", paper: "#f1ece3", gold: "#d9a35b", red: "#ff3b4e", dim: "rgba(241,236,227,.6)" };
type Word = { text: string; start: number; end: number; scene: string };
const WORDS = align.words as Word[];
export const SE_TOTAL = Math.ceil((align.scenes[align.scenes.length - 1].end + 0.6) * SE_FPS);
const expo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const w = (scene: string, re: RegExp, nth = 0) => {
  const ws = WORDS.filter((x) => x.scene === scene && re.test(x.text));
  return Math.round(ws[Math.min(nth, ws.length - 1)].start * SE_FPS);
};
const st = (id: string) => Math.round(align.scenes.find((s) => s.scene === id)!.start * SE_FPS);

const T = {
  real: w("hook", /^REAL/), here: w("hook", /^Here/), s4: st("s4"), jet: w("s4", /^jet/), s3: st("s3"), boat: w("s3", /^boat/),
  s2: st("s2"), kirk: w("s2", /^Kirk/), s1: st("s1"), min7: w("s1", /^7$/), nest: w("s1", /^nest/), smash: w("s1", /^smashes/),
  callback: w("s1", /^callback/), out: st("outro"), follow: w("outro", /^Follow/),
};

// --- plans ---------------------------------------------------------------------------------
type Shot = { img: string; from: number; x: number; y: number; z0: number; z1: number; mine?: boolean };
const teaser = (i: number) => T.here + 6 + i * 11;
const SHOTS: Shot[] = [
  { img: "tower", from: 0, x: 47, y: 30, z0: 1.2, z1: 1.5 },
  { img: "swim", from: teaser(0), x: 55, y: 40, z0: 1.1, z1: 1.2 },
  { img: "vcaerial", from: teaser(1), x: 45, y: 35, z0: 1.1, z1: 1.2 },
  { img: "swampnight", from: teaser(2), x: 25, y: 35, z0: 1.1, z1: 1.2 },
  { img: "car", from: teaser(3), x: 50, y: 62, z0: 1.15, z1: 1.25, mine: true },
  { img: "swim", from: T.s4 - 2, x: 55, y: 40, z0: 1.05, z1: 1.25 },
  { img: "boats", from: T.jet - 2, x: 82, y: 35, z0: 1.1, z1: 1.3 },
  { img: "vcaerial", from: T.s3 - 2, x: 45, y: 30, z0: 1.05, z1: 1.25 },
  { img: "marina", from: T.boat - 2, x: 70, y: 70, z0: 1.1, z1: 1.3 },
  { img: "swampnight", from: T.s2 - 2, x: 25, y: 35, z0: 1.05, z1: 1.3 },
  { img: "swamp", from: T.kirk - 2, x: 45, y: 50, z0: 1.05, z1: 1.2 },
  { img: "tower", from: T.s1 - 2, x: 47, y: 30, z0: 1.2, z1: 1.9 },
  { img: "car", from: T.smash - 2, x: 50, y: 62, z0: 1.2, z1: 1.35, mine: true },
  { img: "vcsign", from: T.callback - 2, x: 50, y: 45, z0: 1.05, z1: 1.2 },
  { img: "night", from: T.out - 2, x: 50, y: 55, z0: 1.05, z1: 1.25, mine: true },
];
const end = (i: number) => (SHOTS[i + 1]?.from ?? SE_TOTAL + 1);

const ShotView: React.FC<{ s: Shot; i: number }> = ({ s, i }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [s.from, end(i)], [0, 1], CL);
  const z = s.z0 + (s.z1 - s.z0) * t;
  const inn = s.from === 0 ? 1 : expo(Math.min(1, (f - s.from) / 6));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: M.ink }}>
      <Img src={staticFile(`mz3/${s.img}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${s.x}% ${s.y}%`, transform: `scale(${z * (1.08 - 0.08 * inn)})`, transformOrigin: `${s.x}% ${s.y}%`, filter: `blur(${(1 - inn) * 10}px)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,13,15,.82) 0%, rgba(13,13,15,.12) 30%, rgba(13,13,15,0) 50%, rgba(13,13,15,.4) 62%, rgba(13,13,15,.93) 80%)" }} />
    </AbsoluteFill>
  );
};

// --- habillage -----------------------------------------------------------------------------
const Header: React.FC<{ mine: boolean }> = ({ mine }) => (
  <div style={{ position: "absolute", left: 70, top: 150, fontFamily: FONT.mono }}>
    <div style={{ color: M.paper, fontSize: 28, fontWeight: 700, letterSpacing: 7 }}>MILE ZERO</div>
    <div style={{ marginTop: 8, color: M.dim, fontSize: 20, background: "rgba(0,0,0,.45)", padding: "3px 10px", display: "inline-block" }}>{mine ? "My gameplay · PS5" : "Image: Rockstar Games"}</div>
  </div>
);
const Marker: React.FC<{ n: number | null; at: number }> = ({ n, at }) => {
  const f = useCurrentFrame();
  const pop = spring({ frame: f - at, fps: SE_FPS, config: { damping: 10, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", right: 70, top: 130, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
      <div style={{ width: 74, height: 96, background: M.paper, borderRadius: 8, border: `4px solid ${M.ink}`, boxShadow: `0 0 0 3px ${M.paper}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, color: M.ink, transform: `scale(${0.8 + 0.2 * pop})` }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1 }}>MILE</div>
        <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>{n ? `S${n}` : "S0"}</div>
      </div>
      <div style={{ fontFamily: FONT.mono, fontSize: 22, fontWeight: 700, color: M.paper, letterSpacing: 2 }}>{n ? `SECRET #${n}` : "4 SECRETS"}</div>
      <div style={{ display: "flex", gap: 6 }}>{[4, 3, 2, 1].map((k) => <div key={k} style={{ width: 26, height: 6, background: n && k >= n ? M.gold : "rgba(241,236,227,.25)" }} />)}</div>
    </div>
  );
};
const Headline: React.FC<{ at: number; lines: [string, boolean][]; size?: number }> = ({ at, lines, size = 140 }) => {
  const f = useCurrentFrame() - at;
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
// étiquette de lieu (comme « REGION 02 / LEONIDA KEYS » sur la chaîne)
const Place: React.FC<{ at: number; label: string; name: string }> = ({ at, label, name }) => {
  const f = useCurrentFrame() - at;
  const p = expo(interpolate(f, [4, 14], [0, 1], CL));
  return (
    <div style={{ position: "absolute", left: 70, top: 1060, opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 24, fontWeight: 700, color: M.gold, letterSpacing: 5 }}>{label}</div>
      <div style={{ fontFamily: FONT.display, fontSize: 58, fontWeight: 900, color: M.paper, textTransform: "uppercase", letterSpacing: -1, textShadow: "0 4px 18px rgba(0,0,0,.7)" }}>{name}</div>
    </div>
  );
};
// gros numéro du compte à rebours
const Num: React.FC<{ at: number; n: number }> = ({ at, n }) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 22) return null;
  const t = expo(Math.min(1, f / 6));
  const out = interpolate(f, [14, 22], [1, 0], CL);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 520, lineHeight: 1, color: M.gold, opacity: t * out, transform: `scale(${2.2 - 1.2 * t})`, letterSpacing: -30, textShadow: "0 20px 80px rgba(0,0,0,.7)" }}>#{n}</div>
    </AbsoluteFill>
  );
};
// chrono de la montée (0:00 → 7:00)
const Climb: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.min7 || f >= T.smash - 2) return null;
  const secs = Math.round(420 * expo(Math.min(1, (f - T.min7) / 30)));
  return (
    <div style={{ position: "absolute", right: 70, top: 640, textAlign: "right", fontFamily: FONT.display }}>
      <div style={{ color: M.paper, fontSize: 24, fontWeight: 800, letterSpacing: 4 }}>CLIMB TIME</div>
      <div style={{ color: M.red, fontSize: 104, fontWeight: 900, fontStyle: "italic", letterSpacing: -3, lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,.7)" }}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</div>
    </div>
  );
};
// œuf qui s'écrase sur la voiture (gameplay de l'utilisateur)
const Splat: React.FC = () => {
  const f = useCurrentFrame() - (T.smash + 4);
  if (f < -8 || f >= T.callback - 2 - (T.smash + 4)) return null;
  const fly = interpolate(f, [-8, 0], [0, 1], CL);
  const sp = expo(Math.min(1, Math.max(0, f) / 5));
  return (
    <>
      {f < 0 && <div style={{ position: "absolute", left: 540 - 30 + (1 - fly) * 300, top: 1000 - 30 - (1 - fly) * 700, width: 60, height: 78, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "#f4eedd", boxShadow: "0 0 20px rgba(0,0,0,.4)", transform: `rotate(${f * 40}deg)` }} />}
      {f >= 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={`translate(540 1000) scale(${sp})`}>
            <path d="M-170 -20 C-160 -110 -40 -130 10 -90 C70 -150 190 -90 160 -10 C230 30 170 120 80 100 C40 170 -80 150 -90 90 C-190 110 -230 30 -170 -20 Z" fill="#f6f1e2" opacity={0.95} />
            <circle cx={-5} cy={5} r={58} fill="#f2b632" />
            <circle cx={-20} cy={-12} r={18} fill="#ffd56b" />
            {[[-200, -90, 14], [210, -110, 10], [240, 60, 16], [-240, 90, 12], [30, 170, 10]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#f6f1e2" />)}
          </g>
        </svg>
      )}
    </>
  );
};

// Sous-titres
const KEY = /^(REAL|Easter|egg|4|24|secrets|dog|jet|ski|Leonida|Dexter|Trinity|Washington|Slice|Bigfoot|Mangrove|Kirk|Grassrivers|radio|tower|7|eggs|smashes|car|Vice|2002|first\??|Follow|GTA|6\.?)/i;
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
  const s = f / SE_FPS;
  const i = chunks.findIndex((c, k) => s >= c[0].start - 0.03 && (k === chunks.length - 1 || s < chunks[k + 1][0].start - 0.03));
  if (i < 0) return null;
  const c = chunks[i];
  if (s > c[c.length - 1].end + 0.4) return null;
  const sc = interpolate((s - c[0].start) * SE_FPS, [0, 3, 6], [0.75, 1.07, 1], CL);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1270, textAlign: "center", transform: `scale(${sc})` }}>
      {c.map((x, k) => (
        <span key={k} style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 78, textTransform: "uppercase", letterSpacing: -1, color: KEY.test(x.text) ? M.gold : M.paper, opacity: s >= x.start - 0.02 ? 1 : 0.4, marginRight: 20, WebkitTextStroke: `8px ${M.ink}`, paintOrder: "stroke fill", textShadow: "0 6px 0 rgba(0,0,0,.6)" }}>{x.text.replace(/[…:]/g, "")}</span>
      ))}
    </div>
  );
};

export const MzSecrets: React.FC<{ sound: boolean }> = ({ sound }) => {
  const f = useCurrentFrame();
  const i = SHOTS.reduce((acc, s, k) => (f >= s.from ? k : acc), 0);
  const shot = SHOTS[i];
  const flash = shot.from === 0 ? 0 : interpolate(f - shot.from, [0, 3], [0.4, 0], CL);
  const n = f >= T.s1 - 2 ? 1 : f >= T.s2 - 2 ? 2 : f >= T.s3 - 2 ? 3 : f >= T.s4 - 2 ? 4 : null;
  const nAt = n === 1 ? T.s1 : n === 2 ? T.s2 : n === 3 ? T.s3 : n === 4 ? T.s4 : 0;
  const kicks = [0, T.real, T.s4, T.s3, T.s2, T.s1, T.smash + 4, T.callback];
  const k = kicks.filter((x) => f >= x).pop() ?? 0;
  const amp = Math.max(0, 1 - (f - k) / 8) * (k === T.smash + 4 ? 26 : 12);
  const ring = f >= T.real && f < T.here + 6 ? interpolate(f - T.real, [0, 8], [0, 1], CL) : f >= T.nest && f < T.smash - 2 ? interpolate(f - T.nest, [0, 8], [0, 1], CL) : 0;
  const followP = spring({ frame: f - T.follow, fps: SE_FPS, config: { damping: 11 } });
  return (
    <AbsoluteFill style={{ background: M.ink }}>
      <AbsoluteFill style={{ transform: `translate(${Math.sin(f * 2.3) * amp}px, ${Math.cos(f * 3.1) * amp}px)` }}>
        <ShotView s={shot} i={i} key={i} />
        {ring > 0 && (
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={500} cy={700} r={110} fill="none" stroke={M.red} strokeWidth={9} strokeDasharray={691} strokeDashoffset={691 * (1 - ring)} transform="rotate(-90 500 700)" />
          </svg>
        )}
        <Splat />
      </AbsoluteFill>
      <Header mine={!!shot.mine} />
      <Marker n={n} at={nAt} />
      {f < T.here + 6 && <Headline at={-12} lines={[["A real", false], ["Easter egg", true]]} size={150} />}
      {f >= T.here + 6 && f < T.s4 - 2 && <Headline at={T.here + 6} lines={[["4 secrets", false], ["in 24 hours", true]]} size={130} />}
      {n === 4 && <Headline at={T.s4} lines={[["Dog on", false], ["a jet ski", true]]} />}
      {n === 3 && <Headline at={T.s3} lines={[["Dexter's", false], ["apartment", true]]} />}
      {n === 2 && <Headline at={T.s2} lines={[["Bigfoot", false], ["is real", true]]} />}
      {n === 1 && f < T.out - 2 && <Headline at={T.s1} lines={[["The real", false], ["Easter egg", true]]} />}
      {f >= T.out - 2 && <Headline at={T.out} lines={[["Which one", false], ["first?", true]]} />}
      {n === 4 && <Place at={T.s4} label="REGION 02" name="Leonida Keys" />}
      {n === 3 && <Place at={T.s3} label="VICE CITY" name="Washington Island" />}
      {n === 2 && <Place at={T.s2} label="REGION 03" name="Grassrivers" />}
      {n === 1 && f < T.smash - 2 && <Place at={T.s1} label="RADIO TOWER" name="7 min climb" />}
      {f >= T.callback - 2 && f < T.out - 2 && <Place at={T.callback} label="CALLBACK" name="GTA Vice City · 2002" />}
      <Climb />
      {[4, 3, 2, 1].map((x) => <Num key={x} n={x} at={[T.s4, T.s3, T.s2, T.s1][4 - x]} />)}
      {f >= T.follow && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1450, display: "flex", justifyContent: "center", transform: `scale(${followP})` }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 54, color: M.ink, background: M.gold, padding: "14px 40px", letterSpacing: 2 }}>FOLLOW MILE ZERO</div>
        </div>
      )}
      <Captions />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      {sound && <Audio src={staticFile("mz3/mix.wav")} />}
    </AbsoluteFill>
  );
};
