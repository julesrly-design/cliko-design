import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { norm, useTimeline, Word } from "../timeline";
import { sp } from "../utils";

// Forme phonétique → forme écrite (« vingt-quatre heures » → « 24 h »).
const DISPLAY: [string[], string][] = [
  [["vingt-quatre", "heures"], "24 h"],
  [["cliko", "point", "be"], "cliko.be"],
  [["kliko"], "Cliko"],
  [["clicko"], "Cliko"],
];

const KEYWORDS = new Set([
  "mieux", "chaîne", "numéro", "nous", "éparpillé", "cliko", "vôtre", "sur-mesure", "parfait",
  "français", "néerlandais", "anglais", "réseaux", "sociaux", "écoute", "ticket", "robot",
  "jules", "louis", "24 h", "trouvé", "gratuit", "cliko.be",
]);

type Group = { words: { text: string; key: boolean }[]; start: number; end: number };

const applyDisplay = (words: Word[]): Word[] => {
  const out: Word[] = [];
  for (let i = 0; i < words.length; i++) {
    const rule = DISPLAY.find(([seq]) => seq.every((s, k) => norm(words[i + k]?.text ?? "") === s));
    if (!rule) { out.push(words[i]); continue; }
    const last = words[i + rule[0].length - 1];
    const trail = last.text.match(/[.,?!…:]+$/)?.[0] ?? "";
    out.push({ ...words[i], text: rule[1] + trail, end: last.end });
    i += rule[0].length - 1;
  }
  return out;
};

// 1 à 3 mots par carton ; coupe sur la ponctuation et au-delà de ~15 caractères.
export const groupCaptions = (words: Word[]): Group[] => {
  const groups: Group[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    groups.push({
      words: cur.map((w) => {
        const text = w.text.replace(/[.,:…]+$/, "");
        return { text, key: KEYWORDS.has(norm(text)) };
      }),
      start: cur[0].start,
      end: cur[cur.length - 1].end,
    });
    cur = [];
  };
  for (const w of applyDisplay(words)) {
    const len = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
    if (cur.length && (cur.length >= 3 || len > 15)) flush();
    cur.push(w);
    if (/[.,?!…:]$/.test(w.text)) flush();
  }
  flush();
  return groups;
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { words } = useTimeline();
  const groups = useMemo(() => groupCaptions(words), [words]);
  const t = frame / fps;
  const i = groups.findIndex((g, k) => t >= g.start - 0.03 && t < (groups[k + 1]?.start ?? g.end + 0.6) && t < g.end + 0.6);
  if (i < 0) return null;
  const g = groups[i];
  const local = frame - Math.round((g.start - 0.03) * fps);
  const s = sp(local, fps, 0, { damping: 11, stiffness: 260, mass: 0.5 });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute", left: 60, width: 870, top: 1360, transform: `translateY(-50%) scale(${0.82 + 0.18 * s})`,
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 32px",
          fontFamily: F.display, fontWeight: 900, fontSize: 104, lineHeight: 1.05, letterSpacing: -2, textAlign: "center",
        }}
      >
        {g.words.map((w, k) => (
          <span
            key={k}
            style={{
              color: w.key ? C.accent : C.white,
              WebkitTextStroke: `16px ${C.ink}`,
              paintOrder: "stroke fill",
              textShadow: "0 10px 30px rgba(0,0,0,.35)",
            }}
          >
            {w.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
