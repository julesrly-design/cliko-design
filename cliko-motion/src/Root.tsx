import { Composition, Freeze } from "remotion";
import { THUMBNAIL_FRAME, VIDEO } from "./config";
import { ClikoMotion } from "./ClikoMotion";

// Couverture : la vidéo figée sur la frame du logo (ligne à son éclat maximum).
const Miniature: React.FC = () => (
  <Freeze frame={THUMBNAIL_FRAME}>
    <ClikoMotion />
  </Freeze>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ClikoMotion" component={ClikoMotion} durationInFrames={VIDEO.durationInFrames} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
    <Composition id="Miniature" component={Miniature} durationInFrames={1} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
  </>
);
