// Bande-son : musique (public/music.mp3, à ajouter) et bruitages calés sur les frames de SFX_CUES.
import React from "react";
import { Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { AUDIO } from "./config";
import { SFX_CUES, SFX_FILES } from "./sfx";

export const Soundtrack: React.FC = () => (
  <>
    {AUDIO.music && <Audio src={staticFile(AUDIO.musicFile)} volume={AUDIO.musicVolume} />}
    {AUDIO.sfx &&
      SFX_CUES.filter((c) => SFX_FILES[c.type]).map((c, i) => (
        <Sequence key={i} from={Math.max(0, c.frame + (c.offset ?? 0))} name={`sfx ${c.type} @${c.frame}`} layout="none">
          <Audio src={staticFile(SFX_FILES[c.type] as string)} volume={AUDIO.sfxVolume * (c.gain ?? 1)} />
        </Sequence>
      ))}
  </>
);
