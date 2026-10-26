import { Composition } from "remotion";
import { VIDEO } from "./config";
import { ClikoMotion } from "./ClikoMotion";

export const RemotionRoot: React.FC = () => (
  <Composition id="ClikoMotion" component={ClikoMotion} durationInFrames={VIDEO.durationInFrames} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
);
