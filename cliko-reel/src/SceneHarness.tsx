import React from "react";
import { CalculateMetadataFunction, Sequence, useVideoConfig } from "remotion";
import { ClikoReel, ReelProps, timelineFor } from "./ClikoReel";
import { SceneId } from "./timeline";
import { withVoice } from "./voice";

// Fenêtre sur une seule scène du reel complet (même fond, mêmes sous-titres, même audio),
// pour prévisualiser et rendre des images d'une scène isolée : Scene-<id>, frame 0 = début de la scène.
export type HarnessProps = ReelProps & { scene: SceneId };

export const SceneHarness: React.FC<HarnessProps> = ({ scene, ...reel }) => {
  const { fps } = useVideoConfig();
  const tl = timelineFor(reel);
  return (
    <Sequence from={-Math.round(tl.scenes[scene].from * fps)}>
      <ClikoReel {...reel} />
    </Sequence>
  );
};

export const harnessMetadata: CalculateMetadataFunction<HarnessProps> = async ({ props }) => {
  const p = await withVoice(props);
  const tl = timelineFor(p);
  const s = tl.scenes[p.scene];
  return { props: p, durationInFrames: Math.round(s.to * 30) - Math.round(s.from * 30) };
};
