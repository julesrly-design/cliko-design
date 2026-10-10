import React from "react";
import { AbsoluteFill } from "remotion";
import { B, FONT } from "./brand";
import { Logo } from "./components/Brand";
import { Grain, Night } from "./components/Night";
import { S1Hook } from "./scenes/S1Hook";
import { ReelProps, timelineFor } from "./ClikoReel";
import { TimelineCtx } from "./timeline";

// Couverture (miniature) : le décor du frame 0 + l'accroche entière, lisible, dans les zones sûres.
// Texte en flux libre (largeur max 850 px, hors des 150 px de droite) ; tout tient dans le recadrage 4:5 de la grille.
type Seg = { text: string; accent?: boolean };
const HOOK: Record<"A" | "B", { size: number; lines: Seg[][] }> = {
  A: { size: 104, lines: [[{ text: "Votre commerce" }], [{ text: "mérite " }, { text: "mieux", accent: true }], [{ text: "qu'un site fait" }], [{ text: "à la chaîne." }]] },
  B: { size: 90, lines: [[{ text: "Les agences web" }], [{ text: "vous traitent" }], [{ text: "comme un numéro\u00a0?" }], [{ text: "Pas " }, { text: "nous.", accent: true }]] },
};

export const Cover: React.FC<ReelProps> = (props) => {
  const tl = timelineFor(props);
  return (
    <TimelineCtx.Provider value={tl}>
      <AbsoluteFill style={{ background: B.night }}>
        <Night />
        <S1Hook hook={props.hook} silent />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,12,27,0) 30%, rgba(8,12,27,.78) 52%, rgba(8,12,27,.92) 100%)" }} />
        <div style={{ position: "absolute", left: 80, width: 850, top: 860, display: "flex", flexDirection: "column", gap: 30 }}>
          <Logo size={72} />
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: HOOK[props.hook].size, lineHeight: 1.0, letterSpacing: "-0.04em", color: B.text, textShadow: "0 8px 40px rgba(4,6,14,.8)" }}>
            {HOOK[props.hook].lines.map((line, i) => (
              <div key={i} style={{ whiteSpace: "nowrap" }}>
                {line.map((seg, k) => (
                  <span key={k} style={{ color: seg.accent ? B.accent : B.text, textShadow: seg.accent ? "0 0 40px rgba(255,196,107,.45)" : undefined }}>
                    {seg.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <Grain amount={0.05} />
      </AbsoluteFill>
    </TimelineCtx.Provider>
  );
};
