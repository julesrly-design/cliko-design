import React from "react";
import { CalculateMetadataFunction, Composition, Folder } from "remotion";
import { ClikoReel, ReelProps, reelSchema, timelineFor } from "./ClikoReel";
import { harnessMetadata, SceneHarness } from "./SceneHarness";
import { SCENES } from "./timeline";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<ReelProps> = ({ props }) => ({
  durationInFrames: Math.ceil(timelineFor(props).total * FPS),
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ClikoReel" component={ClikoReel} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "A" as const, showSafeZones: false, music: true }} calculateMetadata={calculateMetadata} />
    <Composition id="ClikoReelB" component={ClikoReel} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "B" as const, showSafeZones: false, music: true }} calculateMetadata={calculateMetadata} />
    <Composition id="ClikoReelVoixSeule" component={ClikoReel} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "A" as const, showSafeZones: false, music: false }} calculateMetadata={calculateMetadata} />
    <Folder name="Scenes">
      {SCENES.map((scene) => (
        <Composition key={scene} id={`Scene-${scene}`} component={SceneHarness} fps={FPS} width={1080} height={1920} durationInFrames={1}
          defaultProps={{ hook: "A" as const, showSafeZones: false, music: true, scene }} calculateMetadata={harnessMetadata} />
      ))}
    </Folder>
  </>
);
