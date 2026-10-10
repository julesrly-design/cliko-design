import React from "react";
import { Audio } from "@remotion/media";
import { Sequence, staticFile, useVideoConfig } from "remotion";

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

// Piste musicale temporaire (synthétisée) ; remplacée par la musique ElevenLabs quand elle existe.
export const Music: React.FC<{ hook: "A" | "B"; muted?: boolean }> = ({ hook, muted }) =>
  muted ? null : <Audio src={staticFile(`music/temp-music-${hook}.wav`)} volume={Math.pow(10, -4 / 20)} />;
