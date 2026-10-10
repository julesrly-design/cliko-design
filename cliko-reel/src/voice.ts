import { getStaticFiles, staticFile } from "remotion";
import type { ReelProps } from "./ClikoReel";

// Si la voix ElevenLabs existe (public/voice/), ses timestamps pilotent toute la timeline.
export const withVoice = async <P extends ReelProps>(props: P): Promise<P> => {
  const files = getStaticFiles().map((f) => f.name);
  const align = `voice/alignment-${props.hook}.json`;
  if (props.words?.length || !files.includes(align) || !files.includes(`voice/voix-${props.hook}.mp3`)) return props;
  const json = await (await fetch(staticFile(align))).json();
  return { ...props, voice: true, words: json.words.map((w: { text: string; start: number; end: number; scene: string }) => ({ text: w.text, start: w.start, end: w.end, scene: w.scene })) };
};
