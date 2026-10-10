import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { z } from "zod";
import { Captions } from "./components/Captions";
import { Background, Grain, PunchIn, SafeZones } from "./components/Fx";
import { HookScene } from "./scenes/Hook";
import { ProblemScene, SolutionScene } from "./scenes/Scatter";
import { OfferScene } from "./scenes/Offer";
import { HumanScene } from "./scenes/Human";
import { CtaScene } from "./scenes/Cta";
import { buildTimeline, estimateWords, SceneId, TimelineCtx, Word } from "./timeline";

export const reelSchema = z.object({
  hook: z.enum(["A", "B"]),
  showSafeZones: z.boolean(),
  // Mots alignés (timestamps ElevenLabs) ; absent = estimation du débit.
  words: z.array(z.object({ text: z.string(), start: z.number(), end: z.number(), scene: z.string() })).optional(),
});
export type ReelProps = z.infer<typeof reelSchema>;

export const timelineFor = (p: ReelProps) => buildTimeline((p.words as Word[] | undefined) ?? estimateWords(p.hook));

export const ClikoReel: React.FC<ReelProps> = (props) => {
  const { fps } = useVideoConfig();
  const tl = useMemo(() => timelineFor(props), [props]);
  const seq = (id: SceneId) => {
    const from = Math.round(tl.scenes[id].from * fps);
    return { from, durationInFrames: Math.round(tl.scenes[id].to * fps) - from, premountFor: fps };
  };
  return (
    <TimelineCtx.Provider value={tl}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Background />
        <PunchIn>
          <Sequence name="1 · Accroche" {...seq("accroche")}><HookScene hook={props.hook} /></Sequence>
          <Sequence name="2 · Problème" {...seq("probleme")}><ProblemScene /></Sequence>
          <Sequence name="3 · Solution" {...seq("solution")}><SolutionScene /></Sequence>
          <Sequence name="4 · Ce qu'on fait" {...seq("offre")}><OfferScene /></Sequence>
          <Sequence name="5 · L'humain" {...seq("humain")}><HumanScene /></Sequence>
          <Sequence name="6 · Appel à l'action" {...seq("cta")}><CtaScene hook={props.hook} /></Sequence>
        </PunchIn>
        <Captions />
        <Grain />
        {props.showSafeZones && <SafeZones />}
      </AbsoluteFill>
    </TimelineCtx.Provider>
  );
};
