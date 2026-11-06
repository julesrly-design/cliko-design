// Cliko · film motion design (1080×1920, 30 fps, 25 s).
// Inspirations : lancement produit lumineux → coupe vers le clair et typographie cinétique ; flamme chaude,
// puces, brief tapé, code qui file, carte de site en 3D qui se recolore, lettres qui se posent en arc.
import React from "react";
import { AbsoluteFill, getStaticFiles, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
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
    [PAL.cliko, PAL.cliko, PAL.forno, PAL.forno, PAL.verso, PAL.verso, PAL.celest],
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
// Son : musique synthétisée (scripts/synth_motion.py) + bruitages ElevenLabs (scripts/sfx-motion.mjs).
type Fx = [name: string, at: number, db?: number, dur?: number];
const SFX: Fx[] = [
  ["whooshDeep", 2, -6], ["ignite", M.ignite.dot - 2, -2], ["sparkle", M.ignite.dot + 2, -6], ["whoosh", M.ignite.letters, -8],
  ["whoosh", M.ignite.out, -6], ["whip", M.chips.from, -4], ["pop", M.chips.from + 6, -12], ["pop", M.chips.from + 10, -12],
  ["click", M.chips.click, 0], ["morph", M.chips.click + 4, -6],
  ["keys", M.brief.type, -4, M.brief.typeEnd - M.brief.type + 4], ["riser", M.drop - 90, -6],
  ["click", M.brief.send, 0], ["send", M.brief.send + 1, -4],
  ["impact", M.drop, 0], ["data", M.drop + 2, -8], ["pop", M.drop + 10, -10], ["pop", M.drop + 18, -10], ["pop", M.drop + 26, -10], ["pop", M.drop + 34, -10],
  ["sparkle", M.scan, -6], ["whooshDeep", S.from - 2, -10],
  ["keys", S.ask1, -8, 16], ["click", S.flip1 - 5, -4], ["send", S.flip1 - 4, -8], ["whip", S.flip1, -2], ["flip", S.flip1 + 6, -4],
  ["keys", S.ask2, -8, 14], ["click", S.flip2 - 5, -4], ["send", S.flip2 - 4, -8], ["whip", S.flip2, -2], ["flip", S.flip2 + 6, -4],
  ["whooshDeep", S.out - 4, -2], ["hit", M.light.from, 0], ["impact", M.light.from, -6],
  ["whoosh", M.light.from + 2, -8], ["whip", M.light.l2 - 4, -4], ["whip", M.light.l3 - 4, -4], ["whip", M.light.l4 - 4, -4],
  ["morph", M.light.pill, -4], ["flip", M.light.stack1, -2], ["flip", M.light.stack2, -2],
  ["whooshDeep", M.brand.from - 2, -4], ["hit", M.brand.pill, -2], ["sparkle", M.brand.pill + 4, -6],
  ["whooshDeep", M.brand.dive, -2], ["impact", M.end.from, -2], ["ignite", M.end.logo - 2, -6],
  ["whoosh", M.end.line, -10], ["ding", M.end.cta, -6], ["pop", M.end.cta + 5, -8],
];

const Sound: React.FC = () => {
  const files = getStaticFiles().map((x) => x.name);
  return (
    <>
      {files.includes("motion/music.wav") && <Audio src={staticFile("motion/music.wav")} volume={0.82} />}
      {SFX.map(([name, at, db = 0, dur], i) =>
        files.includes(`motion/sfx/${name}.mp3`) ? (
          <Sequence key={i} from={Math.max(0, Math.round(at))} durationInFrames={dur ?? 75} layout="none" name={`sfx:${name}`}>
            <Audio src={staticFile(`motion/sfx/${name}.mp3`)} volume={Math.pow(10, (db - 7) / 20)} />
          </Sequence>
        ) : null,
      )}
    </>
  );
};

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

