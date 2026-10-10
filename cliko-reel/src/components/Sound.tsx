import React from "react";
import { Audio } from "@remotion/media";
import { getStaticFiles, Sequence, staticFile, useVideoConfig } from "remotion";

export type SfxName =
  | "whoosh" | "whoosh-deep" | "whip" | "suck" | "riser" | "click-signature" | "click" | "pop" | "stamp" | "brake"
  | "key" | "flap" | "marker" | "glitch-off" | "msg-send" | "msg-receive" | "impact" | "conveyor";

// Bruitage placé à une frame relative à la scène courante. Volume en dB (0 = niveau nominal, ~-18 dB sous la voix).
export const Sfx: React.FC<{ name: SfxName; at: number; db?: number; duration?: number }> = ({ name, at, db = 0, duration }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence name={`sfx:${name}`} from={Math.round(at)} durationInFrames={duration ?? Math.round(2.2 * fps)} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={Math.pow(10, (db - 14) / 20)} />
    </Sequence>
  );
};

// Piste musicale : music/music.mp3 (ElevenLabs Music) si elle existe, sinon la piste temporaire synthétisée.
// Sous une voix off, la musique passe en retrait (−12 dB).
export const Music: React.FC<{ hook: "A" | "B"; duck?: boolean }> = ({ hook, duck }) => {
  const custom = getStaticFiles().some((f) => f.name === "music/music.mp3");
  const src = custom ? "music/music.mp3" : `music/temp-music-${hook}.wav`;
  return <Audio src={staticFile(src)} volume={Math.pow(10, (duck ? -16 : -4) / 20)} />;
};

// Voix off ElevenLabs (scripts/voice.mjs).
export const Voice: React.FC<{ hook: "A" | "B" }> = ({ hook }) => <Audio src={staticFile(`voice/voix-${hook}.mp3`)} />;
