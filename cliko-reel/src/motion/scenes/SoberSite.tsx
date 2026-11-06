import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { FONT } from "../../brand";
import { EXPO, ramp } from "../kit";

// Exemple de style dessiné en code : la même pizzeria que Forno Nero, en direction « sobre ».
// Noir, typographie éditoriale, filets fins, un seul accent rouge braise. Aucun prix ni chiffre.
const INK = "#0d0d0f";
const PAPER = "#eceae4";
const DIM = "rgba(236,234,228,.5)";
const LINE = "rgba(236,234,228,.16)";
const EMBER = "#e0452b";

export const SoberSite: React.FC<{ w: number; h: number; at: number }> = ({ w, h, at }) => {
  const f = useCurrentFrame();
  const r = (i: number) => EXPO.out(ramp(f, at + i * 2, at + i * 2 + 14, (t) => t));
  const item = (i: number): React.CSSProperties => ({ opacity: r(i), transform: `translateY(${(1 - r(i)) * 26}px)`, filter: `blur(${(1 - r(i)) * 6}px)` });
  const flick = 0.85 + 0.15 * noise2D("feu", f * 0.08, 0);
  const pad = 40;
  return (
    <div style={{ position: "absolute", inset: 0, width: w, height: h, background: INK, color: PAPER, overflow: "hidden", fontFamily: FONT.display }}>
      {/* barre du haut */}
      <div style={{ position: "absolute", left: pad, right: pad, top: 38, display: "flex", justifyContent: "space-between", alignItems: "center", ...item(0) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 19, letterSpacing: "0.32em", fontWeight: 500 }}>FORNO NERO</div>
        <div style={{ display: "flex", gap: 16, fontFamily: FONT.mono, fontSize: 15, letterSpacing: "0.12em", color: DIM }}>
          <span style={{ color: PAPER, borderBottom: `1.5px solid ${EMBER}`, paddingBottom: 3 }}>FR</span><span>NL</span><span>EN</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: pad, right: pad, top: 84, height: 1, background: LINE, transformOrigin: "0 50%", transform: `scaleX(${r(1)})` }} />

      {/* bouche du four : cercles fins et braise */}
      <div style={{ position: "absolute", right: -96, top: 232, width: 270, height: 270, ...item(6) }}>
        <div style={{ position: "absolute", inset: 58, borderRadius: "50%", background: `radial-gradient(circle at 50% 60%, rgba(255,140,60,${0.9 * flick}) 0%, rgba(224,69,43,${0.55 * flick}) 35%, transparent 70%)`, filter: "blur(10px)" }} />
        {[0, 1, 2, 3].map((k) => (
          <div key={k} style={{ position: "absolute", inset: k * 22, borderRadius: "50%", border: `1.5px solid ${k === 3 ? "rgba(255,150,90,.7)" : LINE}` }} />
        ))}
      </div>

      {/* titre */}
      <div style={{ position: "absolute", left: pad, top: 118, fontFamily: FONT.mono, fontSize: 14, letterSpacing: "0.22em", color: DIM, ...item(2) }}>
        PIZZA NAPOLITAINE · BRUXELLES
      </div>
      <div style={{ position: "absolute", left: pad - 3, top: 150, fontWeight: 800, fontSize: 78, lineHeight: 0.98, letterSpacing: "-0.045em" }}>
        {["Le feu", "fait tout", "le travail."].map((l, i) => (
          <div key={l} style={item(3 + i)}>
            {i === 0 ? (<>Le <span style={{ color: EMBER }}>feu</span></>) : l}
          </div>
        ))}
      </div>

      {/* carte */}
      <div style={{ position: "absolute", left: pad, width: w - pad * 2 - 180, top: 520, fontFamily: FONT.mono, fontSize: 13, letterSpacing: "0.22em", color: DIM, ...item(7) }}>LA CARTE</div>
      <div style={{ position: "absolute", left: pad, right: pad, top: 552 }}>
        {[
          ["Margherita", "tomate · fior di latte"],
          ["Diavola", "salame piccante"],
          ["Bianca", "ricotta · basilic"],
        ].map(([n, d], i) => (
          <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0", borderTop: `1px solid ${LINE}`, ...item(8 + i) }}>
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>{n}</span>
            <span style={{ fontSize: 17, color: DIM }}>{d}</span>
          </div>
        ))}
      </div>

      {/* bouton */}
      <div style={{ position: "absolute", left: pad, bottom: 46, display: "flex", alignItems: "center", gap: 22, ...item(12) }}>
        <div style={{ padding: "18px 34px", border: `1.5px solid ${PAPER}`, borderRadius: 999, fontSize: 22, fontWeight: 600, letterSpacing: "0.02em" }}>Commander →</div>
        <span style={{ width: 9, height: 9, borderRadius: 5, background: EMBER, boxShadow: `0 0 12px ${EMBER}` }} />
        <span style={{ fontFamily: FONT.mono, fontSize: 14, letterSpacing: "0.18em", color: DIM }}>FOUR ALLUMÉ</span>
      </div>
    </div>
  );
};
