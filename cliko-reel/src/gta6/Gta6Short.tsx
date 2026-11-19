// Short YouTube « GTA 6 : l'ampleur du lancement » — 1080×1920, 30 fps, voix off ElevenLabs + musique et bruitages synthétisés.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import "../brand"; // charge les polices embarquées
import { C, CL, DISPLAY, shake, Sky } from "./kit";
import { Ampleur, Conges, Cumul, Flu, Hook, Logi, Outro, Total, Twitch, Vues } from "./scenes";
import { FPS, SceneId, SCENES, WORDS } from "./timing";

const VIEWS: Record<SceneId, { C: React.FC; hue: number; zoom?: number }> = {
  hook: { C: Hook, hue: 0 },
  ampleur: { C: Ampleur, hue: -25 },
  twitch: { C: Twitch, hue: -45 },
  total: { C: Total, hue: -20 },
  vues: { C: Vues, hue: 0 },
  cumul: { C: Cumul, hue: -15 },
  conges: { C: Conges, hue: -35 },
  logi: { C: Logi, hue: -55 },
  flu: { C: Flu, hue: -25 },
  outro: { C: Outro, hue: 0 },
};

// --- Sous-titres : mots regroupés par 1 à 3, chiffres écrits en chiffres -------------------------
type Tok = { text: string; start: number; end: number; hot: boolean };
const MERGE: [RegExp, RegExp, string][] = [
  [/^sept$/i, /^mille$/i, "7 000"],
  [/^quatre$/i, /^cents$/i, "400"],
  [/^vingt-quatre$/i, /^heures/i, "24 h"],
];
const NUM: [RegExp, string][] = [[/^treize/i, "13"], [/^trois$/i, "3"], [/^six$/i, "6"], [/^quatre-vingt-dix$/i, "90"], [/^cinq/i, "5"]];
const HOT = /^(13|6|3|90|24|7,000|400|five|GTA|FINALLY|record|insane|Never|half|billion|Logitech|McGregor|flu|Twitch|YouTube|Kick|Thousands|million|craziest|YOU|follow)/i;

const tokens: Tok[] = [];
for (let i = 0; i < WORDS.length; i++) {
  const w = WORDS[i];
  const n = WORDS[i + 1];
  const m = n && MERGE.find(([a, b]) => a.test(w.text) && b.test(n.text));
  if (m) {
    const punct = n.text.match(/[.,!?…:]+$/)?.[0] ?? "";
    tokens.push({ text: m[2] + punct, start: w.start, end: n.end, hot: true });
    i++;
    continue;
  }
  const core = w.text.replace(/[.,!?…:]+$/, "");
  const punct = w.text.slice(core.length);
  const num = NUM.find(([re]) => re.test(core));
  const text = (num ? num[1] : core) + punct;
  tokens.push({ text, start: w.start, end: w.end, hot: HOT.test(text) });
}
const chunks: Tok[][] = [];
let cur: Tok[] = [];
tokens.forEach((t, i) => {
  cur.push(t);
  const next = tokens[i + 1];
  const len = cur.map((c) => c.text).join(" ").length;
  if (!next || /[.,!?…:]$/.test(t.text) || cur.length >= 3 || len > 16 || next.start - t.end > 0.35) {
    chunks.push(cur);
    cur = [];
  }
});

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const idx = chunks.findIndex((c, i) => s >= c[0].start - 0.05 && (i === chunks.length - 1 || s < chunks[i + 1][0].start - 0.05));
  if (idx < 0) return null;
  const ch = chunks[idx];
  if (s > ch[ch.length - 1].end + 0.6) return null;
  const local = (s - ch[0].start + 0.05) * FPS;
  const pop = interpolate(local, [0, 4, 8], [0.7, 1.08, 1], CL);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1250, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `scale(${pop})` }}>
      {ch.map((t, i) => {
        const on = s >= t.start - 0.03;
        const active = on && (i === ch.length - 1 || s < ch[i + 1].start);
        return (
          <span
            key={i}
            style={{
              fontFamily: DISPLAY, fontWeight: 900, fontSize: 88, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: -1,
              color: active ? C.yellow : t.hot ? C.hot : "#fff", opacity: on ? 1 : 0.35,
              WebkitTextStroke: `10px ${C.night}`, paintOrder: "stroke fill",
              transform: `scale(${active ? 1.08 : 1}) rotate(${active ? -2 : 0}deg)`, display: "inline-block",
              textShadow: `0 8px 0 ${C.night}`,
            }}
          >
            {t.text}
          </span>
        );
      })}
    </div>
  );
};

// --- Composition ------------------------------------------------------------------------------
export const Gta6Short: React.FC<{ sound: boolean }> = ({ sound }) => {
  const f = useCurrentFrame();
  const sc = SCENES.find((x) => f >= x.from && f < x.to) ?? SCENES[0];
  const v = VIEWS[sc.id];
  const local = f - sc.from;
  const flash = sc.from === 0 ? 0 : interpolate(local, [0, 4], [0.85, 0], CL);
  const punch = interpolate(local, [0, 8], [1.12, 1], { ...CL, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const sh = shake(f, sc.from, 16, 9);
  const drift = 1 + (local / (sc.to - sc.from)) * 0.04;
  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Sky hue={v.hue} zoom={drift} dim={0.15} />
        {SCENES.map((s) => {
          const V = VIEWS[s.id].C;
          return (
            <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} layout="none">
              <AbsoluteFill style={{ transform: `scale(${s.id === sc.id ? punch : 1})` }}>
                <V />
              </AbsoluteFill>
            </Sequence>
          );
        })}
      </div>
      <Captions />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, mixBlendMode: "screen" }} />
      {/* grain + scanlines légers */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0 2px, transparent 2px 4px)", opacity: 0.35, pointerEvents: "none" }} />
      {sound && <Audio src={staticFile("gta6/mix.wav")} />}
    </AbsoluteFill>
  );
};
