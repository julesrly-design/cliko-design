import { Composition } from "remotion";
import { VIDEO } from "./config";
import { ClikoMotion } from "./ClikoMotion";
import { ClikoNeon } from "./neon/ClikoNeon";

// ClikoNeon : version actuelle (néon de marque, 2D/2,5D). ClikoMotion : première version 3D (WebGL).
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ClikoNeon" component={ClikoNeon} durationInFrames={VIDEO.durationInFrames} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
    <Composition id="ClikoMotion" component={ClikoMotion} durationInFrames={VIDEO.durationInFrames} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
  </>
);
