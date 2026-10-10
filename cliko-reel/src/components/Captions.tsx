import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { B, FONT } from "../brand";
import { CapGroup, useCaptions } from "../captions";
import { Hook } from "../timeline";

// Rail de sous-titres : fer à gauche (comme les titres de cliko.be), ancré par le bas.
// Zone sûre : x 80 → 920, dernière ligne au-dessus de y = 1420.
export const RAIL = { left: 80, width: 840, bottom: 1920 - 1425, size: 100 };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Word: React.FC<{ text: string; keyword: boolean; at: number; frame: number; fps: number; still: boolean }> = ({ text, keyword, at, frame, fps, still }) => {
  const p = still ? 1 : spring({ frame: frame - at, fps, config: { stiffness: 420, damping: 32, mass: 0.5 } });
  return (
    <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em", verticalAlign: "bottom" }}>
      <span
        style={{
          display: "inline-block",
          transform: `translateY(${(1 - p) * 105}%)`,
          filter: p < 0.98 ? `blur(${(1 - p) * 6}px)` : undefined,
          color: keyword ? B.accent : B.text,
          textShadow: keyword ? "0 0 36px rgba(255,196,107,.35)" : "0 4px 30px rgba(4,6,14,.55)",
        }}
      >
        {text}
      </span>
    </span>
  );
};

export const CaptionRail: React.FC<{ hook: Hook }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const groups = useCaptions(hook);
  const t = frame / fps;

  // Carton courant = le dernier commencé ; il sort dès que le suivant (même héros) commence.
  let idx = -1;
  for (let i = 0; i < groups.length; i++) if (groups[i].start - 1.5 / fps <= t) idx = i;
  if (idx < 0) return null;
  const g: CapGroup = groups[idx];
  const next = groups[idx + 1];
  const startF = Math.round(g.start * fps) - 1;
  const exitAt = next ? Math.round(next.start * fps) - 1 : Math.round((g.end + 0.6) * fps);
  const holdEnd = Math.round((g.end + 1.1) * fps);
  const exitF = Math.min(exitAt, holdEnd);
  const out = interpolate(frame, [exitF - 1, exitF + 3], [0, 1], clamp);
  if (g.hero || out >= 1) return null;
  const still = startF <= 1; // miniature : le premier carton est lisible dès le frame 0

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: RAIL.left,
          width: RAIL.width,
          bottom: RAIL.bottom,
          display: "flex",
          flexWrap: "wrap",
          columnGap: "0.24em",
          alignItems: "flex-end",
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: RAIL.size,
          lineHeight: 1.0,
          letterSpacing: "-0.035em",
          transform: `translateY(${-out * 34}px)`,
          opacity: 1 - out,
          filter: out > 0 ? `blur(${out * 8}px)` : undefined,
        }}
      >
        {g.words.map((w, k) => (
          <Word key={k} text={w.text} keyword={w.key} at={Math.round(w.start * fps) - 1} frame={frame} fps={fps} still={still} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Voile de lisibilité sous le rail, dosé par scène (0 = aucun, 1 = fort).
export const RailScrim: React.FC<{ strength: number }> = ({ strength }) =>
  strength <= 0 ? null : (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: strength,
        background: "linear-gradient(180deg, transparent 0%, transparent 58%, rgba(6,9,20,.55) 68%, rgba(6,9,20,.7) 76%, rgba(6,9,20,.35) 88%, transparent 100%)",
      }}
    />
  );
