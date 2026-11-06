// Cliko · film motion design (1080×1920, 30 fps, 25 s).
// Inspirations : lancement produit lumineux → coupe vers le clair et typographie cinétique ; flamme chaude,
// puces, brief tapé, code qui file, carte de site en 3D qui se recolore, lettres qui se posent en arc.
import React from "react";
import { AbsoluteFill, getStaticFiles, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Grain } from "../components/Night";
import { CL, Flame, PAL, mixPal, Void } from "./kit";
import { M } from "./timeline";
import { Ignite } from "./scenes/Ignite";
import { Brief } from "./scenes/Brief";
import { Showcase } from "./scenes/Showcase";
import { Light } from "./scenes/Light";
import { Brand, End } from "./scenes/Finale";

const S = M.styles;

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const pal = mixPal(
    f,
    [0, S.from - 4, S.from + 6, S.flip1 + 5, S.flip1 + 10, S.flip2 + 5, S.flip2 + 10],
    [PAL.cliko, PAL.cliko, PAL.forno, PAL.forno, PAL.sobre, PAL.sobre, PAL.celest],
  );
  const intensity = interpolate(
    f,
    [0, 26, 70, 110, 150, 222, M.drop - 2, M.drop + 1, M.drop + 30, S.from, S.out, M.light.from],
    [0, 1, 1, 0.75, 0.55, 0.5, 0.95, 1.15, 0.75, 0.95, 1, 1.5],
    CL,
  );
  const y = interpolate(f, [0, 70, 150, M.drop, S.from], [180, 0, 160, 0, 60], CL);
  return (
    <Void>
      <Flame pal={pal} intensity={intensity} spin={-6 + f * 0.04} y={y} />
    </Void>
  );
};

// Secousse de caméra amortie sur les impacts.
const shake = (f: number) => {
  let x = 0, y = 0;
  for (const at of [M.drop, M.light.from, M.end.from]) {
    const t = f - at;
    if (t < 0 || t > 14) continue;
    const a = 16 * Math.exp(-t / 4);
    x += Math.sin(t * 2.7) * a;
    y += Math.cos(t * 3.4) * a * 0.7;
  }
  return `translate(${x}px, ${y}px)`;
};

const Flash: React.FC<{ at: number; color: string; dur?: number; peak?: number }> = ({ at, color, dur = 12, peak = 0.9 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 2, at, at + dur], [0, peak, 0], CL);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

// ------------------------------------------------------------------------------------------------
// Son : pas de musique. Une seule piste de bruitages, mixée par scripts/mix_sfx.py à partir de src/motion/cues.ts
// (≈ 250 sons ElevenLabs calés à la frame : touches, tics, claquements, whooshs, impacts, ambiance de flamme).
const Sound: React.FC = () =>
  getStaticFiles().some((x) => x.name === "motion/sfx-mix.wav") ? <Audio src={staticFile("motion/sfx-mix.wav")} /> : null;

// ------------------------------------------------------------------------------------------------
export const ClikoMotion: React.FC<{ sound?: boolean }> = ({ sound = true }) => {
  const f = useCurrentFrame();
  const dark = f < M.light.from;
  return (
    <AbsoluteFill style={{ background: "#05060c", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: shake(f) }}>
        {dark && <Background />}
        {f < M.chips.from + 20 && <Ignite />}
        {f >= M.chips.from - 2 && f < M.drop + 2 && <Brief />}
        {f >= M.drop - 2 && dark && <Showcase />}
        {f >= M.light.from && f < M.brand.from + 12 && <Light />}
        {f >= M.brand.from && f < M.end.from && <Brand />}
        {f >= M.end.from && <End />}
      </AbsoluteFill>
      <Flash at={M.drop} color="#ffb867" dur={10} peak={0.45} />
      <Flash at={M.light.from} color="#ffffff" dur={6} peak={0.6} />
      <Flash at={M.end.from} color="#ffc46b" dur={10} peak={0.35} />
      <Grain amount={dark || f >= M.end.from ? 0.07 : 0.045} />
      {sound && <Sound />}
    </AbsoluteFill>
  );
};

export const MOTION_FRAMES = M.total;

