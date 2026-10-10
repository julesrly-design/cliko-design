import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { z } from "zod";
import { CaptionRail } from "./components/Captions";
import { Grain, Night, SafeZones } from "./components/Night";
import { Music, Voice } from "./components/Sound";
import { S1Hook } from "./scenes/S1Hook";
import { S2Problem, S3Solution } from "./scenes/S2S3Scatter";
import { S4Offer } from "./scenes/S4Offer";
import { S5Human } from "./scenes/S5Human";
import { S6Cta } from "./scenes/S6Cta";
import { buildTimeline, estimateWords, mergePunct, SceneId, TimelineCtx, Word } from "./timeline";

export const reelSchema = z.object({
  hook: z.enum(["A", "B"]),
  showSafeZones: z.boolean(),
  music: z.boolean(),
  // Voix off ElevenLabs (public/voice/voix-<A|B>.mp3) : activée automatiquement si elle existe.
  voice: z.boolean().optional(),
  // Mots alignés (timestamps ElevenLabs) ; absent = estimation du débit.
  words: z.array(z.object({ text: z.string(), start: z.number(), end: z.number(), scene: z.string() })).optional(),
});
export type ReelProps = z.infer<typeof reelSchema>;

export const timelineFor = (p: Pick<ReelProps, "hook" | "words">) =>
  buildTimeline(p.words?.length ? mergePunct(p.words as Word[]) : estimateWords(p.hook));

export const ClikoReel: React.FC<ReelProps> = (props) => {
  const { fps } = useVideoConfig();
  const tl = useMemo(() => timelineFor(props), [props]);
  const seq = (id: SceneId) => {
    const from = Math.round(tl.scenes[id].from * fps);
    return { from, durationInFrames: Math.round(tl.scenes[id].to * fps) - from, premountFor: fps };
  };
  return (
    <TimelineCtx.Provider value={tl}>
      <AbsoluteFill style={{ overflow: "hidden", background: "#0b1020" }}>
        <Night />
        <Sequence name="1 · Accroche" {...seq("accroche")}><S1Hook hook={props.hook} /></Sequence>
        <Sequence name="2 · Problème" {...seq("probleme")}><S2Problem hook={props.hook} /></Sequence>
        <Sequence name="3 · Solution" {...seq("solution")}><S3Solution hook={props.hook} /></Sequence>
        <Sequence name="4 · Ce qu'on fait" {...seq("offre")}><S4Offer hook={props.hook} /></Sequence>
        <Sequence name="5 · L'humain" {...seq("humain")}><S5Human hook={props.hook} /></Sequence>
        <Sequence name="6 · Appel à l'action" {...seq("cta")}><S6Cta hook={props.hook} /></Sequence>
        <CaptionRail hook={props.hook} />
        <Grain />
        {props.music && <Music hook={props.hook} duck={Boolean(props.voice)} />}
        {props.voice && <Voice hook={props.hook} />}
        {props.showSafeZones && <SafeZones />}
      </AbsoluteFill>
    </TimelineCtx.Provider>
  );
};
