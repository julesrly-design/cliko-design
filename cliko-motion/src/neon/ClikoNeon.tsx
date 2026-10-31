// Composition principale de la version néon : une <Sequence> par scène. Les scènes se chevauchent
// de 14 frames et se relaient en flou de profondeur ; le fil néon porte chaque transition.
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SCENES } from "../config";
import { useReady } from "../ClikoMotion";
import { Soundtrack } from "../Soundtrack";
import { SafeZones } from "../overlay/SafeZones";
import { Backdrop } from "./Backdrop";
import { NeonDefs } from "./Neon";
import { NEON } from "./theme";
import { Stage } from "./UI";
import { N1Hook } from "./scenes/N1Hook";
import { N2Site } from "./scenes/N2Site";
import { N3Services } from "./scenes/N3Services";
import { N4ForWho } from "./scenes/N4ForWho";
import { N5Mobile } from "./scenes/N5Mobile";
import { N6Languages } from "./scenes/N6Languages";
import { N7Offer } from "./scenes/N7Offer";
import { N8Logo } from "./scenes/N8Logo";
import { NEON_SFX_CUES } from "./sfx";

const X = 14; // chevauchement entre deux scènes
const len = (id: keyof typeof SCENES) => SCENES[id].end - SCENES[id].start;

export const ClikoNeon: React.FC = () => {
  const ready = useReady();
  if (!ready) return <AbsoluteFill style={{ background: NEON.bgEdge }} />;
  return (
    <AbsoluteFill style={{ background: NEON.bgEdge, overflow: "hidden" }}>
      <Backdrop />
      <NeonDefs />
      <Sequence name="1 · Hook" from={SCENES.hook.start} durationInFrames={len("hook") + X}>
        <Stage dur={len("hook") + X} over={X} enter={false}>
          <N1Hook />
        </Stage>
      </Sequence>
      <Sequence name="2 · Site" from={SCENES.site.start - X} durationInFrames={len("site") + 2 * X}>
        <Stage dur={len("site") + 2 * X} from="near">
          <N2Site />
        </Stage>
      </Sequence>
      <Sequence name="3 · Services" from={SCENES.services.start - X} durationInFrames={len("services") + 2 * X}>
        <Stage dur={len("services") + 2 * X}>
          <N3Services />
        </Stage>
      </Sequence>
      <Sequence name="4 · Pour qui" from={SCENES.forWho.start - X} durationInFrames={len("forWho") + 2 * X}>
        <Stage dur={len("forWho") + 2 * X} from="near">
          <N4ForWho />
        </Stage>
      </Sequence>
      <Sequence name="5 · Mobile" from={SCENES.mobile.start - X} durationInFrames={len("mobile") + 2 * X}>
        <Stage dur={len("mobile") + 2 * X}>
          <N5Mobile />
        </Stage>
      </Sequence>
      <Sequence name="6 · Langues" from={SCENES.languages.start - X} durationInFrames={len("languages") + 2 * X}>
        <Stage dur={len("languages") + 2 * X} from="near">
          <N6Languages />
        </Stage>
      </Sequence>
      <Sequence name="7 · Offre" from={SCENES.offer.start - X} durationInFrames={len("offer") + 2 * X}>
        <Stage dur={len("offer") + 2 * X}>
          <N7Offer />
        </Stage>
      </Sequence>
      <Sequence name="8 · Logo" from={SCENES.logo.start - X} durationInFrames={len("logo") + X}>
        <Stage dur={len("logo") + X} over={X} exit={false}>
          <N8Logo />
        </Stage>
      </Sequence>
      <SafeZones />
      <Soundtrack cues={NEON_SFX_CUES} />
    </AbsoluteFill>
  );
};
