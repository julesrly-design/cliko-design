// <SceneSeq> : la <Sequence> Remotion d'une scène, avec un peu de marge avant et après pour
// les transitions. useSceneFrame() renvoie la frame relative au début « officiel » de la scène
// (négative pendant la marge d'entrée) ; useGlobalFrame() la frame absolue de la vidéo.
import React, { createContext, useContext } from "react";
import { Sequence, useCurrentFrame } from "remotion";
import { SCENES, type SceneId } from "../config";

type Ctx = { id: SceneId; from: number; start: number };
const SceneCtx = createContext<Ctx | null>(null);

export const SceneSeq: React.FC<{ id: SceneId; pre?: number; post?: number; layout?: "none" | "absolute-fill"; children: React.ReactNode }> = ({
  id,
  pre = 40,
  post = 40,
  layout = "absolute-fill",
  children,
}) => {
  const s = SCENES[id];
  const from = Math.max(0, s.start - pre);
  return (
    <Sequence name={`${id}${layout === "none" ? " (3D)" : ""}`} from={from} durationInFrames={s.end + post - from} layout={layout}>
      <SceneCtx.Provider value={{ id, from, start: s.start }}>{children}</SceneCtx.Provider>
    </Sequence>
  );
};

export const useScene = () => {
  const c = useContext(SceneCtx);
  if (!c) throw new Error("useScene() hors d'une <SceneSeq>");
  return c;
};
export const useGlobalFrame = () => {
  const c = useContext(SceneCtx);
  return useCurrentFrame() + (c?.from ?? 0);
};
export const useSceneFrame = () => {
  const c = useScene();
  return useCurrentFrame() + c.from - c.start;
};
