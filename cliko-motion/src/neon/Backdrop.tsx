// Fond commun : nuit très sombre, dégradé radial, lueur ambrée diffuse au centre.
import React from "react";
import { AbsoluteFill } from "remotion";
import { NEON } from "./theme";

export const Backdrop: React.FC<{ warm?: number }> = ({ warm = 1 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 75% at 50% 46%, ${NEON.bgCenter} 0%, ${NEON.bgMid} 48%, ${NEON.bgEdge} 100%)` }}>
    <AbsoluteFill style={{ background: `radial-gradient(60% 38% at 50% 48%, rgba(255,196,107,${0.05 * warm}) 0%, rgba(255,196,107,0) 70%)` }} />
    {/* vignettage doux */}
    <AbsoluteFill style={{ background: "radial-gradient(90% 70% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)" }} />
  </AbsoluteFill>
);
