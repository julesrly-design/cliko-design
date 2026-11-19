// Short Mile Zero « How Long Is GTA 6? » — charte de la chaîne : captures officielles Rockstar plein cadre,
// libellé MILE ZERO + crédit image, panneau kilométrique, titre blanc/doré en haut à gauche, sous-titres centrés.
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "../brand";
import { FONT } from "../brand";
import align from "./alignment.json";

export const MZ_FPS = 30;
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const M = { ink: "#0d0d0f", paper: "#f1ece3", gold: "#d9a35b", red: "#ff3b4e", dim: "rgba(241,236,227,.6)" };

type Word = { text: string; start: number; end: number; scene: string };
const WORDS = align.words as Word[];
type Id = "hook" | "main" | "gta5" | "nelson" | "full" | "outro";
export const MZ_TOTAL = Math.ceil((align.scenes[align.scenes.length - 1].end + 1.2) * MZ_FPS);
const SC = align.scenes.map((s, i, all) => ({
  id: s.scene as Id,
  from: i === 0 ? 0 : Math.round(s.start * MZ_FPS) - 2,
  to: i === all.length - 1 ? MZ_TOTAL : Math.round(all[i + 1].start * MZ_FPS) - 2,
}));
const sc = (id: Id) => SC.find((s) => s.id === id)!;
const at = (id: Id, re: RegExp) => {
  const w = WORDS.find((x) => x.scene === id && re.test(x.text));
  return w ? Math.round(w.start * MZ_FPS) - sc(id).from : 0;
};

// --- éléments de charte ---------------------------------------------------------------------
const Header: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 150, fontFamily: FONT.mono }}>
    <div style={{ color: M.paper, fontSize: 28, fontWeight: 700, letterSpacing: 7 }}>MILE ZERO</div>
    <div style={{ marginTop: 8, color: M.dim, fontSize: 20, background: "rgba(0,0,0,.45)", padding: "3px 10px", display: "inline-block" }}>Image: Rockstar Games</div>
  </div>
);
const Marker: React.FC<{ code: string }> = ({ code }) => (
  <div style={{ position: "absolute", right: 70, top: 130, width: 74, height: 96, background: M.paper, borderRadius: 8, border: `4px solid ${M.ink}`, boxShadow: `0 0 0 3px ${M.paper}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, color: M.ink }}>
    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1 }}>MILE</div>
    <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>{code}</div>
  </div>
);

// Titre haut-gauche : lignes qui montent une à une, dernier mot(s) en or
const Headline: React.FC<{ lines: [string, boolean][]; size?: number }> = ({ lines, size = 150 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 66, top: 270, right: 60 }}>
      {lines.map(([t, gold], i) => {
        const p = ease(interpolate(f, [i * 3, i * 3 + 9], [0, 1], CL));
        return (
          <div key={i} style={{ overflow: "hidden" }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: size, lineHeight: 0.95, letterSpacing: -size * 0.035, color: gold ? M.gold : M.paper, textTransform: "uppercase", transform: `translateY(${(1 - p) * 100}%)`, textShadow: "0 6px 30px rgba(0,0,0,.45)" }}>{t}</div>
          </div>
        );
      })}
    </div>
  );
};

// Plan : capture plein cadre avec zoom lent et dégradés sombres
const Shot: React.FC<{ src: string; x?: number; dur: number }> = ({ src, x = 50, dur }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], [1.08, 1.18]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(`mz/${src}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x}% 50%`, transform: `scale(${z})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,13,15,.82) 0%, rgba(13,13,15,.15) 32%, rgba(13,13,15,0) 50%, rgba(13,13,15,.55) 64%, rgba(13,13,15,.95) 82%)" }} />
    </AbsoluteFill>
  );
};

// HUD de temps de jeu, sous le panneau (comme le compteur « CASH » de la chaîne)
const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const steps: [number, number][] = [
    [sc("main").from + at("main", /^50/), 50],
    [sc("gta5").from + at("gta5", /^32/), 32],
    [sc("nelson").from + at("nelson", /^80/), 80],
    [sc("full").from + at("full", /^200/), 200],
  ];
  let val = 0, from = 0, start = 0;
  for (const [t, v] of steps) if (f >= t) { from = val; val = v; start = t; }
  const p = ease(interpolate(f, [start, start + 14], [0, 1], CL));
  const shown = Math.round(from + (val - from) * p);
  const pop = spring({ frame: f - start, fps, config: { damping: 12, stiffness: 200 } });
  if (f < steps[0][0] || f >= sc("outro").from) return null;
  const isG5 = val === 32;
  return (
    <div style={{ position: "absolute", right: 70, top: 760, textAlign: "right", fontFamily: FONT.display }}>
      <div style={{ color: M.paper, fontSize: 24, fontWeight: 800, letterSpacing: 4 }}>{isG5 ? "GTA 5" : "PLAYTIME"}</div>
      <div style={{ color: isG5 ? M.dim : M.red, fontSize: 92, fontWeight: 900, fontStyle: "italic", letterSpacing: -3, lineHeight: 1, transform: `scale(${0.85 + 0.15 * pop})`, transformOrigin: "100% 50%", textShadow: "0 4px 20px rgba(0,0,0,.6)" }}>
        {shown}<span style={{ fontSize: 50 }}> H</span>
      </div>
    </div>
  );
};

// Barres de comparaison (scène GTA 5)
const Bars: React.FC = () => {
  const f = useCurrentFrame();
  const rows: [string, number, string][] = [["GTA 5", 32, M.dim], ["GTA 6", 50, M.gold]];
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 940 }}>
      {rows.map(([n, h, c], i) => {
        const p = ease(interpolate(f, [6 + i * 6, 26 + i * 6], [0, 1], CL));
        return (
          <div key={n} style={{ marginBottom: 34 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.display, fontWeight: 900, fontSize: 44, color: M.paper, marginBottom: 10 }}>
              <span>{n}</span><span style={{ color: c }}>~{Math.round(h * p)} H</span>
            </div>
            <div style={{ height: 26, background: "rgba(241,236,227,.15)" }}>
              <div style={{ height: "100%", width: `${(h / 50) * 100 * p}%`, background: c }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontFamily: FONT.mono, fontSize: 22, color: M.dim }}>main story · GTA 6 = reviewers' runs</div>
    </div>
  );
};

// Sous-titres : 1 à 3 mots, centrés, mots-clés en or
const KEY = /^(GTA|6\??|5,?|50|32\.?|80|200|hours\.?|100|percent\??|weekends\.?|Rob|Nelson|main|story|longer|side|goals|follow)/i;
const chunks: Word[][] = [];
{
  let cur: Word[] = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const n = WORDS[i + 1];
    if (!n || /[.,!?…]$/.test(w.text) || cur.length >= 3 || n.scene !== w.scene) { chunks.push(cur); cur = []; }
  });
}
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / MZ_FPS;
  const i = chunks.findIndex((c, k) => s >= c[0].start - 0.04 && (k === chunks.length - 1 || s < chunks[k + 1][0].start - 0.04));
  if (i < 0) return null;
  const c = chunks[i];
  if (s > c[c.length - 1].end + 0.5) return null;
  const local = (s - c[0].start) * MZ_FPS;
  const y = interpolate(local, [0, 5], [14, 0], CL);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1290, textAlign: "center", transform: `translateY(${y}px)`, opacity: interpolate(local, [0, 3], [0, 1], CL) }}>
      {c.map((w, k) => (
        <span key={k} style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, textTransform: "uppercase", color: KEY.test(w.text) ? M.gold : M.paper, marginRight: 18, textShadow: "0 4px 18px rgba(0,0,0,.7)" }}>{w.text.replace(/…/g, "")}</span>
      ))}
    </div>
  );
};

const SCENES: Record<Id, { img: string; x?: number; lines: [string, boolean][]; size?: number; extra?: React.FC }> = {
  hook: { img: "hook", x: 30, lines: [["How long", false], ["is GTA 6?", true]], size: 170 },
  main: { img: "main", x: 40, lines: [["Main story", false], ["~50 hours", true]] },
  gta5: { img: "gta5", x: 45, lines: [["Way longer", false], ["than GTA 5", true]], extra: Bars },
  nelson: { img: "nelson", x: 35, lines: [["80 hours", true], ["with side", false], ["goals", false]] },
  full: { img: "full", x: 55, lines: [["100%?", false], ["Up to", false], ["200 hours", true]] },
  outro: { img: "outro", x: 50, lines: [["Clear your", false], ["weekends", true]] },
};

export const MzHowLong: React.FC<{ sound: boolean }> = ({ sound }) => {
  const f = useCurrentFrame();
  const cur = SC.find((s) => f >= s.from && f < s.to) ?? SC[0];
  const flash = cur.from === 0 ? 0 : interpolate(f - cur.from, [0, 3], [0.35, 0], CL);
  const followAt = sc("outro").from + at("outro", /^Follow/);
  const fp = spring({ frame: f - followAt, fps: MZ_FPS, config: { damping: 12, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: M.ink }}>
      {SC.map((s) => {
        const d = SCENES[s.id];
        const X = d.extra;
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} layout="none">
            <Shot src={d.img} x={d.x} dur={s.to - s.from} />
            <Headline lines={d.lines} size={d.size} />
            {X && <X />}
          </Sequence>
        );
      })}
      <Header />
      <Marker code="S1" />
      <Hud />
      <Captions />
      {f >= followAt && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1420, display: "flex", justifyContent: "center", transform: `scale(${fp})` }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 54, color: M.ink, background: M.gold, padding: "14px 40px", letterSpacing: 2 }}>FOLLOW MILE ZERO</div>
        </div>
      )}
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      {sound && <Audio src={staticFile("mz/mix.wav")} />}
    </AbsoluteFill>
  );
};
