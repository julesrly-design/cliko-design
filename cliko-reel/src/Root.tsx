import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { ClikoReel, ReelProps, reelSchema, timelineFor } from "./ClikoReel";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<ReelProps> = ({ props }) => ({
  durationInFrames: Math.ceil(timelineFor(props).total * FPS),
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ClikoReel" component={ClikoReel} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "A" as const, showSafeZones: false }} calculateMetadata={calculateMetadata} />
    <Composition id="ClikoReelB" component={ClikoReel} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "B" as const, showSafeZones: false }} calculateMetadata={calculateMetadata} />
  </>
);
