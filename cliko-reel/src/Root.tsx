import React from "react";
import { CalculateMetadataFunction, Composition, Folder } from "remotion";
import { withVoice } from "./voice";
import { ClikoReel, ReelProps, reelSchema, timelineFor } from "./ClikoReel";
import { harnessMetadata, SceneHarness } from "./SceneHarness";
import { Cover } from "./Cover";
import { SCENES } from "./timeline";
import { ClikoMotion, MOTION_FRAMES } from "./motion/ClikoMotion";
import { Gta6Short } from "./gta6/Gta6Short";
import { MzHowLong, MZ_TOTAL } from "./mz/MzHowLong";
import { MzRealistic, R_TOTAL } from "./mz2/MzRealistic";
import { INTRO as GTA6_INTRO, TOTAL as GTA6_FRAMES } from "./gta6/timing";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<ReelProps> = async ({ props }) => {
  const p = await withVoice(props);
  return { props: p, durationInFrames: Math.ceil(timelineFor(p).total * FPS) };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MzRealistic" component={MzRealistic} fps={FPS} width={1080} height={1920} durationInFrames={R_TOTAL} defaultProps={{ sound: true }} />
    <Composition id="MzHowLong" component={MzHowLong} fps={FPS} width={1080} height={1920} durationInFrames={MZ_TOTAL} defaultProps={{ sound: true }} />
    <Composition id="Gta6Short" component={Gta6Short} fps={FPS} width={1080} height={1920} durationInFrames={GTA6_FRAMES + GTA6_INTRO} defaultProps={{ sound: true }} />
    <Composition id="ClikoMotion" component={ClikoMotion} fps={FPS} width={1080} height={1920} durationInFrames={MOTION_FRAMES} defaultProps={{ sound: true }} />
    <Composition id="ClikoReel" component={ClikoReel} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "A" as const, showSafeZones: false, music: true }} calculateMetadata={calculateMetadata} />
    <Composition id="ClikoReelB" component={ClikoReel} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "B" as const, showSafeZones: false, music: true }} calculateMetadata={calculateMetadata} />
    <Composition id="ClikoReelVoixSeule" component={ClikoReel} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "A" as const, showSafeZones: false, music: false }} calculateMetadata={calculateMetadata} />
    <Composition id="Couverture" component={Cover} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "A" as const, showSafeZones: false, music: false }} />
    <Composition id="CouvertureB" component={Cover} schema={reelSchema} fps={FPS} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ hook: "B" as const, showSafeZones: false, music: false }} />
    <Folder name="Scenes">
      {SCENES.map((scene) => (
        <Composition key={scene} id={`Scene-${scene}`} component={SceneHarness} fps={FPS} width={1080} height={1920} durationInFrames={1}
          defaultProps={{ hook: "A" as const, showSafeZones: false, music: true, scene }} calculateMetadata={harnessMetadata} />
      ))}
    </Folder>
  </>
);
