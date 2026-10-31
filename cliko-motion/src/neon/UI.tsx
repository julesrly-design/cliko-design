// Composants d'interface : icônes au trait, téléphone, cartes, bulles lumineuses, drapeaux,
// texte cinétique, logo Cliko, caméra 2,5D et scène (entrée / sortie en flou de profondeur).
import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, lerp, springAt } from "../lib/math";
import { EASE, FONT, LOGO, LOGO_POS, logoScale, NEON } from "./theme";

// ── Icônes (24×24, trait 2) ─────────────────────────────────────────────────
export const ICONS = {
  utensils: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  bed: "M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8 M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4 M12 4v6 M2 18h20",
  bag: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0",
  pencil: "M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",
  server: "M4 3h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M4 13h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z M6 7h.01 M6 17h.01",
  shield: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z M9 12l2 2 4-4",
  chat: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z M8 12h.01 M12 12h.01 M16 12h.01",
  check: "M20 6 9 17l-5-5",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  calendar: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  heart: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
} as const;
export type IconName = keyof typeof ICONS;

export const Icon: React.FC<{ name: IconName; size?: number; color?: string; width?: number; style?: React.CSSProperties }> = ({ name, size = 40, color = NEON.text, width = 2, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={ICONS[name]} />
  </svg>
);

// ── Carte d'interface (verre sombre, filet clair) ───────────────────────────
export const Card: React.FC<{ x: number; y: number; w: number; h: number; r?: number; glow?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  r = 40,
  glow = 0,
  style,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: r,
      background: `linear-gradient(180deg, ${NEON.cardTop} 0%, ${NEON.card} 60%, #0A0F1D 100%)`,
      border: `1.5px solid ${NEON.cardLine}`,
      boxShadow: `0 40px 120px -40px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.06), 0 0 ${80 * glow}px rgba(255,196,107,${0.18 * glow})`,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

// ── Téléphone ───────────────────────────────────────────────────────────────
export const Phone: React.FC<{ x: number; y: number; w: number; h: number; children?: React.ReactNode; glow?: number }> = ({ x, y, w, h, children, glow = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 68,
      background: "linear-gradient(145deg, #3A3F4E 0%, #1A1D27 30%, #0B0D13 70%, #2A2E3A 100%)",
      padding: 11,
      boxSizing: "border-box",
      boxShadow: `0 60px 140px -40px rgba(0,0,0,.95), inset 0 0 0 1.5px rgba(255,255,255,.12), 0 0 ${120 * glow}px rgba(255,196,107,${0.22 * glow})`,
    }}
  >
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 58, overflow: "hidden", background: "#05070E" }}>
      {children}
      {/* Dynamic Island */}
      <div style={{ position: "absolute", left: "50%", top: 16, width: 124, height: 36, marginLeft: -62, borderRadius: 20, background: "#000" }} />
      {/* reflet du verre */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,0) 32%)", pointerEvents: "none" }} />
    </div>
  </div>
);

// ── Bulle lumineuse (scène « Pour qui », langues) ───────────────────────────
export const Orb: React.FC<{ x: number; y: number; r: number; color: string; pop: number; children?: React.ReactNode }> = ({ x, y, r, color, pop, children }) => {
  if (pop <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, scale: `${pop}` }}>
      <div style={{ position: "absolute", inset: -r * 1.2, borderRadius: "50%", background: `radial-gradient(circle, ${color}55 0%, ${color}18 38%, transparent 68%)` }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,.85) 0%, ${color} 34%, ${color} 62%, rgba(0,0,0,.35) 100%)`,
          boxShadow: `0 0 ${r * 0.6}px ${color}, 0 0 ${r * 1.6}px ${color}88, inset 0 -${r * 0.12}px ${r * 0.3}px rgba(0,0,0,.25)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ── Drapeaux ────────────────────────────────────────────────────────────────
export const Flag: React.FC<{ code: string; w?: number }> = ({ code, w = 120 }) => {
  const h = w * 0.66;
  const r = 10;
  if (code === "FR")
    return (
      <svg width={w} height={h} viewBox="0 0 3 2" style={{ borderRadius: r }}>
        <rect width="1" height="2" fill="#1D4ED8" />
        <rect x="1" width="1" height="2" fill="#F8FAFC" />
        <rect x="2" width="1" height="2" fill="#E11D48" />
      </svg>
    );
  if (code === "NL")
    return (
      <svg width={w} height={h} viewBox="0 0 3 2" style={{ borderRadius: r }}>
        <rect width="3" height="0.667" fill="#E11D48" />
        <rect y="0.667" width="3" height="0.667" fill="#F8FAFC" />
        <rect y="1.333" width="3" height="0.667" fill="#1E40AF" />
      </svg>
    );
  return (
    <svg width={w} height={h} viewBox="0 0 60 40" style={{ borderRadius: r }}>
      <rect width="60" height="40" fill="#1E3A8A" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#F8FAFC" strokeWidth="8" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#E11D48" strokeWidth="3" />
      <path d="M30 0V40M0 20H60" stroke="#F8FAFC" strokeWidth="12" />
      <path d="M30 0V40M0 20H60" stroke="#E11D48" strokeWidth="7" />
    </svg>
  );
};

// ── Texte cinétique : chaque mot monte depuis un masque, flou → net, léger punch ──
export const Words: React.FC<{
  text: string;
  at: number; // frame locale d'apparition du 1er mot
  stagger?: number;
  size: number;
  color?: string;
  weight?: number;
  font?: string;
  align?: "left" | "center";
  x: number;
  y: number; // haut de la ligne
  width?: number;
  accent?: string[]; // mots en ambre
  out?: number; // 0..1 sortie
  frame: number;
}> = ({ text, at, stagger = 5, size, color = NEON.text, weight = 600, font = FONT.display, align = "center", x, y, width = 1080, accent = [], out = 0, frame }) => {
  const words = text.split(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        flexWrap: "wrap",
        columnGap: size * 0.26,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: font === FONT.display ? "-0.035em" : "-0.01em",
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 14}px)` : undefined,
      }}
    >
      {words.map((w, i) => {
        const a = frame - at - i * stagger;
        const p = clamp(a / 14);
        const e = EASE.out(p);
        const s = springAt(a, { stiffness: 260, damping: 15 });
        const isAccent = accent.includes(w.replace(/[.,!?]/g, ""));
        // pas encore apparu : rien du tout (sinon son halo déborderait du masque)
        if (a < 0)
          return (
            <span key={i} style={{ display: "inline-block", visibility: "hidden" }}>
              {w}
            </span>
          );
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0.02em 0.12em", margin: "-0.06em -0.02em -0.12em" }}>
            <span
              style={{
                display: "inline-block",
                translate: `0 ${(1 - e) * 105}%`,
                scale: `${lerp(1.18, 1, clamp(s))}`,
                filter: `blur(${(1 - e) * 10}px)`,
                color: isAccent ? undefined : color,
                backgroundImage: isAccent ? `linear-gradient(180deg, ${NEON.amberHot}, ${NEON.amber} 55%, ${NEON.amberDeep})` : undefined,
                WebkitBackgroundClip: isAccent ? "text" : undefined,
                backgroundClip: isAccent ? "text" : undefined,
                WebkitTextFillColor: isAccent ? "transparent" : undefined,
                opacity: clamp(a / 4),
                textShadow: isAccent || a < 6 ? undefined : `0 0 ${30 * (1 - clamp(a / 30))}px rgba(255,196,107,.6)`,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

// ── Logo Cliko (tracé d'origine) ────────────────────────────────────────────
// progress : 0..1 par trait ; toggle : 0..1 ; knob : intensité du bouton lumineux dans le « o »
export const Logo: React.FC<{ strokes?: Partial<Record<keyof typeof LOGO.strokes | "dot", number>>; toggle?: number; glow?: number; hot?: number; opacity?: number }> = ({
  strokes = {},
  toggle = 1,
  glow = 1,
  hot = 0,
  opacity = 1,
}) => {
  const ox = LOGO_POS.cx - LOGO_POS.width / 2;
  const oy = LOGO_POS.cy - (LOGO.vb.h * logoScale) / 2;
  const strokeColor = hot > 0 ? `rgb(${lerp(242, 255, hot)},${lerp(243, 226, hot)},${lerp(250, 174, hot)})` : NEON.text;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible", opacity }}>
      <defs>
        <linearGradient id="logo-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={NEON.amberHot} />
          <stop offset="0.55" stopColor={NEON.amber} />
          <stop offset="1" stopColor={NEON.amberDeep} />
        </linearGradient>
      </defs>
      {/* lueur : copies élargies et transparentes derrière (pas de filtre) */}
      {[
        [3.2, 0.035],
        [2.2, 0.06],
        [1.5, 0.1],
      ].map(([k, o], i) => (
        <g key={i} opacity={o * glow * 2.2}>
          <LogoShapes strokes={strokes} toggle={toggle} color={hot > 0 ? NEON.amberHot : "#FFE9C4"} ox={ox} oy={oy} widthK={k} />
        </g>
      ))}
      <LogoShapes strokes={strokes} toggle={toggle} color={strokeColor} ox={ox} oy={oy} />
    </svg>
  );
};

const LogoShapes: React.FC<{ strokes: Partial<Record<keyof typeof LOGO.strokes | "dot", number>>; toggle: number; color: string; ox: number; oy: number; widthK?: number }> = ({
  strokes,
  toggle,
  color,
  ox,
  oy,
  widthK = 1,
}) => {
  const sp = (k: keyof typeof LOGO.strokes) => strokes[k] ?? 1;
  return (
    <g transform={`translate(${ox} ${oy}) scale(${logoScale})`}>
      {(Object.keys(LOGO.strokes) as (keyof typeof LOGO.strokes)[]).map((k) =>
        sp(k) > 0 ? (
          <path key={k} d={LOGO.strokes[k]} fill="none" stroke={color} strokeWidth={22 * widthK} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${sp(k)} 2`} />
        ) : null,
      )}
      {(strokes.dot ?? 1) > 0 && <circle cx={LOGO.dot.cx} cy={LOGO.dot.cy} r={LOGO.dot.r * (strokes.dot ?? 1) * (1 + (widthK - 1) * 0.6)} fill={color} />}
      {toggle > 0 &&
        (widthK > 1 ? (
          <path d={LOGO.toggle} fill="none" stroke={NEON.amber} strokeWidth={22 * (widthK - 1)} strokeLinejoin="round" opacity={toggle} />
        ) : (
          <path d={LOGO.toggle} fill="url(#logo-amber)" fillRule="evenodd" opacity={toggle} />
        ))}
    </g>
  );
};

// ── Caméra 2,5D : images clés (frame locale → x, y, zoom, rotations) ───────
export type CamKey = { f: number; x?: number; y?: number; s?: number; rx?: number; ry?: number; rz?: number };
export const camAt = (keys: CamKey[], f: number) => {
  const full = keys.map((k) => ({ x: 0, y: 0, s: 1, rx: 0, ry: 0, rz: 0, ...k }));
  if (f <= full[0].f) return full[0];
  for (let i = 0; i < full.length - 1; i++) {
    const a = full[i];
    const b = full[i + 1];
    if (f <= b.f) {
      const t = EASE.inOut(clamp((f - a.f) / (b.f - a.f)));
      return { f, x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t), rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t) };
    }
  }
  return full[full.length - 1];
};
// Point de l'écran visé au centre (x, y en px scène), zoom, rotations en degrés.
export const Camera: React.FC<{ keys: CamKey[]; frame: number; children: React.ReactNode }> = ({ keys, frame, children }) => {
  const c = camAt(keys, frame);
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 2400, perspectiveOrigin: "50% 50%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "540px 960px",
          transform: `translate(${-c.x * c.s}px, ${-c.y * c.s}px) scale(${c.s}) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ── Scène : entrée et sortie en flou de profondeur (comme la référence) ────
// La séquence commence `over` frames avant la coupe et finit `over` frames après. Autour de la
// coupe, la scène sortante s'efface d'abord, l'entrante n'apparaît qu'ensuite (opacité « en
// creux ») : on ne superpose jamais deux scènes nettes, le fil assure la continuité.
export const Stage: React.FC<{ dur: number; over?: number; enter?: boolean; exit?: boolean; from?: "near" | "far"; children: React.ReactNode }> = ({
  dur,
  over = 14,
  enter = true,
  exit = true,
  from = "far",
  children,
}) => {
  const f = useCurrentFrame();
  const win = over * 1.5;
  // entrée sur [over/2, 2·over] (coupe en `over`), sortie sur [dur − 2·over, dur − over/2]
  const linIn = enter ? clamp((f - over / 2) / win) : 1;
  const linOut = exit ? clamp((f - (dur - 2 * over)) / win) : 0;
  const ein = 1 - EASE.out(linIn);
  const eout = EASE.in(linOut);
  const scale = (from === "far" ? 1 - 0.12 * ein : 1 + 0.18 * ein) * (1 + 0.22 * eout);
  const blur = 18 * ein + 22 * eout;
  const opacity = Math.pow(linIn, 2.2) * Math.pow(1 - linOut, 2.2);
  if (opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity, scale: `${scale}`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, transformOrigin: "50% 48%" }}>{children}</div>
  );
};

export const useLocalFrame = useCurrentFrame;
