import React from "react";
import { B, FONT, LOGO } from "../brand";

// Le point ambre du logo « Cliko. » : fil rouge du film.
export const Dot: React.FC<{ size: number; glow?: number; style?: React.CSSProperties }> = ({ size, glow = 1, style }) => (
  <div
    style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 35% 30%, ${B.accentBright} 0%, ${B.accent} 45%, ${B.accentDeep} 100%)`,
      boxShadow: `0 0 ${size * 0.6 * glow}px rgba(255,196,107,${0.55 * glow}), 0 0 ${size * 1.8 * glow}px rgba(255,196,107,${0.28 * glow})`,
      ...style,
    }}
  />
);

// Logo « Cliko. » (Schibsted Grotesk 700, −0,03 em, point ambre). `reveal` ∈ [0,1] par lettre, `dot` ∈ [0,1].
export const Logo: React.FC<{
  size: number; reveal?: number; dot?: number; color?: string; style?: React.CSSProperties;
  dotY?: number; // décalage vertical du point (px, négatif = au-dessus) : chute, rebond
  dotGlow?: number;
  ring?: number; // onde de choc autour du point, 0 → 1
}> = ({ size, reveal = 1, dot = 1, color = B.text, style, dotY = 0, dotGlow = 0.6, ring = 0 }) => {
  const letters = "Cliko".split("");
  return (
    <div style={{ display: "flex", alignItems: "baseline", fontFamily: FONT.display, fontWeight: LOGO.weight, fontSize: size, letterSpacing: LOGO.tracking, lineHeight: 1, color, ...style }}>
      {letters.map((l, i) => {
        const p = Math.max(0, Math.min(1, reveal * letters.length - i));
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 105}%)` }}>{l}</span>
          </span>
        );
      })}
      <span style={{ display: "inline-block", width: size * 0.2, marginLeft: size * 0.015, position: "relative", height: size * 0.2 }}>
        <Dot size={size * 0.19} glow={dotGlow} style={{ position: "absolute", left: 0, bottom: -size * 0.005, transform: `translateY(${dotY}px) scale(${dot})`, transformOrigin: "50% 100%" }} />
        {ring > 0 && ring < 1 && (
          <>
            {[1, 0.6].map((k, i) => (
              <span
                key={i}
                style={{
                  position: "absolute", left: size * 0.095, bottom: size * 0.09, width: 0, height: 0,
                  boxShadow: `0 0 0 ${2 + 2 * k}px rgba(255,196,107,${(1 - ring) * k})`,
                  borderRadius: "50%",
                  transform: "translate(-50%, 50%)",
                  padding: size * 0.1 + ring * size * 2.2 * k,
                }}
              />
            ))}
          </>
        )}
      </span>
    </div>
  );
};

// Panneau « verre » du site (glass / glass-line), avec flou d'arrière-plan.
export const glass = (strong = false): React.CSSProperties => ({
  background: strong ? B.glassStrong : B.glass,
  border: `1.5px solid ${B.glassLine}`,
  backdropFilter: "blur(18px) saturate(140%)",
  WebkitBackdropFilter: "blur(18px) saturate(140%)",
  boxShadow: "0 30px 80px -30px rgba(2,4,12,.75), inset 0 1px 0 rgba(255,255,255,.08)",
});

// Pilule ambre façon bouton « Demander un devis gratuit » du site.
export const AmberPill: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 40, style }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: size * 0.4, padding: `${size * 0.55}px ${size * 0.95}px`, borderRadius: 999,
      background: `linear-gradient(180deg, ${B.accentBright} 0%, ${B.accent} 55%, ${B.accentDeep} 100%)`,
      color: B.night, fontFamily: FONT.display, fontWeight: 700, fontSize: size, letterSpacing: "-0.01em", lineHeight: 1.1,
      boxShadow: "0 0 50px rgba(255,196,107,.35), 0 18px 40px -16px rgba(240,169,72,.7), inset 0 1px 0 rgba(255,255,255,.5)",
      ...style,
    }}
  >
    {children}
  </div>
);

// Petite étiquette technique (Geist Mono), ex. « EXEMPLE DE STYLE ».
export const MonoTag: React.FC<{ children: React.ReactNode; size?: number; dot?: boolean; style?: React.CSSProperties }> = ({ children, size = 26, dot = true, style }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: size * 0.55, padding: `${size * 0.55}px ${size * 0.9}px`, borderRadius: 999,
      ...glass(), fontFamily: FONT.mono, fontWeight: 500, fontSize: size, letterSpacing: "0.08em", textTransform: "uppercase", color: B.mist,
      ...style,
    }}
  >
    {dot && <span style={{ width: size * 0.36, height: size * 0.36, borderRadius: "50%", background: B.accent, boxShadow: "0 0 12px rgba(255,196,107,.8)" }} />}
    {children}
  </div>
);
